// ======================================================================= //
// pagefind-characterization.mjs
// ======================================================================= //

// Characterization harness for Pagefind — what the site's search index actually
// holds, for every indexed page, plus what a fixed set of queries returns.
//
// The other harnesses cover rendered pages. None of them can see search: Pagefind
// is a post-build step (`npx -y pagefind --site docs` in all four workflows), so
// `hugo server` never produces an index at all — which is why `PagefindUI is not
// defined` is allowlisted dev-only noise in nr-characterization.mjs. A template
// change that silently adds or removes indexed text is therefore invisible to
// every check this repo had before this one.
//
// That is not hypothetical. Making the 42-neighborhood list server-rendered —
// correct for crawling and for the no-JS path — put 42 names and every ZIP code
// into the index on six pages, taking a search for "Kingsbridge" from 1 match to
// 12 and pushing that neighborhood's own page from first to fourth. The build was
// clean, the pages were correct, and nothing failed
// (documents/nr-pagefind-parity-2026-08-15.md).
//
// It builds the site itself rather than reading docs/ or hitting a dev server:
//   - docs/ holds whatever was last built, from whichever environment, and a check
//     against a stale index passes for the wrong reason
//   - a dev server has no index to read
// The build goes to a temp directory with HUGO_RESOURCEDIR pointed there too, which
// is the one form that cannot reach the repo's resources/_gen. Two Hugo builders
// sharing that cache poison each other, and a dev server is usually running here.
//
// Two controls, because a clean-looking capture and a broken one are otherwise the
// same JSON. The RENDERED-CONTENT control asserts a floor on indexed word count for
// one page of each kind: a template break renders empty shells, and Pagefind will
// honestly index empty shells without complaint. The QUERY control asserts that a
// known term returns many results and that a nonsense term returns none — a search
// path that answers everything and one that answers nothing both look like a pass
// from one direction only.
//
// Unlike nr-characterization.mjs, --baseline here CAN fail: it runs both controls
// and refuses to write a baseline that fails them. Recording whatever it finds is
// how a baseline of three empty pages gets committed as the thing to match.
//
// Baselines are filed per EHDP-data branch (staging and production index different
// indicator names), read from the merged Hugo config rather than off a page. The
// baseURL path prefix is normalized out of every recorded value, so any environment
// on a given data branch shares that branch's baseline — `local_prod`, `dev_prod`
// and `prod_prod` all check against `production/`.
//
// Usage:
//   node scripts/pagefind-characterization.mjs --baseline
//   node scripts/pagefind-characterization.mjs --check
//   node scripts/pagefind-characterization.mjs --against ../production/docs
//
// --against diffs this branch's fresh build against another already-built site —
// another worktree's docs/, or any directory holding a pagefind/ folder. That is the
// cross-branch comparison, and it needs no baseline on either side.
//
// npm run characterize:pagefind -- --check works from bash. PowerShell eats the
// `--`, so call node directly there.

import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const BASELINE_ROOT = 'scripts/pagefind-characterization-baseline';

// Both tools are npm packages with Node entry points, so they are spawned as `node
// <entry>` rather than through npx. Node refuses to spawn a .cmd shim without
// shell:true, and shell:true then re-parses arguments that hold temp paths — running
// the entry point directly sidesteps both, works the same on every platform, and
// uses the pagefind pinned in package.json instead of whatever `npx -y` fetches.
//
// The workflows do run `npx -y pagefind`, so the two can drift apart on a major
// release. That is why the capture records pagefindVersion: a drift shows up as a
// diff line rather than as unexplained churn across every page.
const HUGO_CLI = 'node_modules/hugo-extended/lib/cli.js';
const PAGEFIND_CLI = 'node_modules/pagefind/lib/runner/bin.cjs';

// The environment to build. Any environment on the same EHDP-data branch produces
// the same index once the baseURL prefix is normalized away, so this is a choice of
// data source and nothing else. local_prod is the default because it reads the
// locally hosted data repo and so does not depend on GitHub being reachable; set
// PAGEFIND_ENV to build something else.
const ENV = process.env.PAGEFIND_ENV || 'local_prod';

// Queries run against the built index in a real browser. Chosen to cover the axes a
// content or template change moves independently: a neighborhood name, a ZIP code,
// a topic term shared by many pages, a multi-word query that should resolve to one
// page, and a navigation phrase. `expect` is a floor for the control, not an
// assertion about ranking — ranking lives in the recorded result list.
const QUERIES = [
    { q: 'Kingsbridge' },
    { q: '10463' },
    { q: 'asthma', expectAtLeast: 20 },
    { q: 'asthma East Harlem' },
    { q: 'neighborhood reports' },
    { q: 'heat vulnerability' },

    // The two bare NR topic words with the worst first-page crowding: 42 report pages per
    // topic share the topic's vocabulary and its title. "climate" is the extreme case, and
    // neither was in this set when the set was first written — which is why the first
    // attempt at fixing that crowding was measured with a separate one-off probe instead
    // of by the harness that exists to measure it.
    { q: 'climate' },
    { q: 'housing' },

    // Negative control: a search path that has broken open and matches everything
    // clears every floor above, and only a term with nothing to match catches it.
    //
    // It is a ceiling rather than `=== 0` because Pagefind matches fuzzily and a
    // nonsense token usually finds something. This control was written as "expect
    // exactly 0" and failed on its first run: "zzqqxxwv" returns /about/, and
    // "xylophonewombat" returns /about/accessibility-updates/ by way of "x-y"
    // [verified 2026-08-15: five nonsense tokens queried against the built index;
    // only "qqzzxxvvww" returned 0]. Pinning the exact figure would have made the
    // control fail whenever unrelated content changed, so it asserts the thing that
    // actually matters — that the query path discriminates — against a real query's
    // 257 results on the same index.
    { q: 'zzqqxxwv', expectAtMost: 2 }
];

// How many result URLs to record per query. Deep enough that a reordering of the
// first page shows up, shallow enough that a data refresh reshuffling the tail does
// not churn the baseline.
const QUERY_DEPTH = 10;

// Rendered-content control: one page per template kind, with a floor on indexed
// words. These are floors, not expected values — they exist to catch a page kind
// that stopped rendering, not to pin its content, which is what the per-page
// records do. A missing URL fails the control too: a control that silently skips
// the page it was meant to prove is not a control.
//
// `absent: true` inverts it, asserting a page is deliberately NOT in the index. The
// 210 report pages are the case: they carry a page-level data-pagefind-ignore, and
// an inverted control is what stops that being undone by accident — a deleted
// attribute would otherwise read as a diff to re-baseline rather than as a control
// failure. That they still *render* is characterize:nr's job, not this one's.
const CONTENT_CONTROLS = [
    { url: '/',                                                          min: 100, kind: 'home' },
    { url: '/data-explorer/asthma/',                                     min: 200, kind: 'data explorer topic' },
    { url: '/data-stories/asthma-and-poverty/',                          min: 100, kind: 'data story' },
    { url: '/key-topics/airquality/',                                    min: 100, kind: 'key topic' },
    { url: '/data-features/hvi/',                                        min: 100, kind: 'data feature' },
    { url: '/neighborhood-reports/',                                     min: 100, kind: 'NR landing' },
    { url: '/neighborhood-reports/asthma_and_the_environment/',          min: 200, kind: 'NR topic index' },
    { url: '/neighborhood-reports/east_harlem/',                         min: 5,   kind: 'NR neighborhood index' },
    { url: '/neighborhood-reports/east_harlem/asthma_and_the_environment/', absent: true, kind: 'NR report (deliberately un-indexed)' }
];

// Content types for the throwaway static server. Pagefind fetches its index shards
// with fetch(), which does not care about the type, but the wasm and the module do.
const MIME = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.svg':  'image/svg+xml'
};

// ----------------------------------------------------------------------- //
// build
// ----------------------------------------------------------------------- //

// Reads the merged config for an environment. This is where the data branch and the
// baseURL come from — not from a served page, because nothing is served yet.
const readSiteConfig = (env) => {

    const out = spawnSync(process.execPath, [HUGO_CLI, 'config', '--environment', env, '--format', 'json'], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });

    if (out.status !== 0) return null;

    try {
        const cfg = JSON.parse(out.stdout);
        return {
            dataBranch: cfg.params?.data_branch ?? null,
            // The path part of baseURL is what ends up in absolute hrefs and in
            // Pagefind's meta values; it is the only piece that varies by environment.
            prefix: new URL(cfg.baseurl).pathname.replace(/\/$/, '')
        };
    } catch {
        return null;
    }

};

// Builds into a temp directory. HUGO_RESOURCEDIR is the load-bearing half: without
// it the build writes the repo's resources/_gen, and a second builder sharing that
// cache breaks the first one's served asset URLs sitewide.
const buildSite = (env, dir) => {

    const publicDir = join(dir, 'public');

    const out = spawnSync(process.execPath, [HUGO_CLI, '--environment', env, '-d', publicDir], {
        encoding: 'utf8',
        env: { ...process.env, HUGO_RESOURCEDIR: join(dir, 'resources') },
        maxBuffer: 64 * 1024 * 1024
    });

    return { ok: out.status === 0, publicDir, log: `${out.stdout ?? ''}${out.stderr ?? ''}` };

};

// Runs Pagefind over a built site, exactly as the workflows do.
const runPagefind = (publicDir) => {

    const out = spawnSync(process.execPath, [PAGEFIND_CLI, '--site', publicDir], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });

    return { ok: out.status === 0, log: `${out.stdout ?? ''}${out.stderr ?? ''}` };

};

// ----------------------------------------------------------------------- //
// reading the index
// ----------------------------------------------------------------------- //

// Accepts either a built site root or the pagefind/ directory inside one, so
// --against can be pointed at another worktree's docs/ without ceremony.
const resolvePagefindDir = (dir) => {

    if (existsSync(join(dir, 'pagefind-entry.json'))) return dir;
    if (existsSync(join(dir, 'pagefind', 'pagefind-entry.json'))) return join(dir, 'pagefind');
    return null;

};

// Every fragment, decompressed. Fragments are gzipped JSON behind a `pagefind_dcd`
// magic prefix — slicing to the first brace rather than a fixed offset, since the
// prefix is a format detail and not a documented width.
const readFragments = (pagefindDir) => {

    const fragDir = join(pagefindDir, 'fragment');
    const records = [];

    for (const file of readdirSync(fragDir)) {

        if (!file.endsWith('.pf_fragment')) continue;

        const text = gunzipSync(readFileSync(join(fragDir, file))).toString('utf8');
        records.push(JSON.parse(text.slice(text.indexOf('{'))));

    }

    return records;

};

// ----------------------------------------------------------------------- //
// querying the index
// ----------------------------------------------------------------------- //

// Serves a built site at its own baseURL prefix. Pagefind's generated JS fetches
// its shards at absolute, prefixed paths, so serving the directory at / would 404
// every one of them and report an empty index that looks exactly like a broken build.
const serveStatic = (root, prefix, port) => new Promise((resolve) => {

    const server = createServer((req, res) => {

        let path = decodeURIComponent(req.url.split('?')[0]);

        if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length);

        let file = join(root, path);

        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

        if (!existsSync(file)) {
            res.writeHead(404);
            res.end('not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(res);

    });

    server.listen(port, () => resolve(server));

});

// Runs the query set through Pagefind's own JS API in a real browser. The API is the
// thing the site's search box uses; reading fragments alone answers "is this text in
// the index" and never "what does a search for it return, in what order".
//
// This distinction is not academic. Production's fragment for a neighborhood index
// holds only its ZIP codes, which reads as "cannot be found by name" — but Pagefind
// searches meta.title too, and the query returns the page first.
const runQueries = async (browser, baseURL, prefix) => {

    const page = await browser.newPage();

    await page.goto(`${baseURL}${prefix}/`, { waitUntil: 'domcontentloaded' });

    const results = await page.evaluate(async ({ queries, depth, prefix }) => {

        const pagefind = await import(`${prefix}/pagefind/pagefind.js`);
        await pagefind.init();

        const out = {};

        for (const { q } of queries) {

            const search = await pagefind.search(q);
            const top = await Promise.all(search.results.slice(0, depth).map((r) => r.data()));

            out[q] = {
                total: search.results.length,
                top: top.map((d) => ({
                    url: d.url,
                    subResults: d.sub_results.length
                }))
            };

        }

        return out;

    }, { queries: QUERIES, depth: QUERY_DEPTH, prefix });

    await page.close();

    return results;

};

// ----------------------------------------------------------------------- //
// capture
// ----------------------------------------------------------------------- //

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// Strips the environment's baseURL path prefix wherever it appears, so a capture
// from local_prod and one from dev_prod compare equal. Applied to recorded strings
// rather than to the whole document: it is the difference between two environments
// of the same data branch, and nothing else should be normalized away silently.
const stripPrefix = (s, prefix) => (prefix && typeof s === 'string' ? s.split(prefix).join('') : s);

// Turns raw fragments plus query results into the committed record.
//
// Content is stored as a hash plus its opening words, not in full: the full text of
// 411 pages is megabytes that no one reads, while a hash catches any change to it and
// the opening words make the diff legible without opening the build.
const capture = (fragments, queries, meta, prefix) => {

    const pages = {};
    const sections = {};

    for (const f of fragments.sort((a, b) => a.url.localeCompare(b.url))) {

        const url = stripPrefix(f.url, prefix);
        const section = url.split('/')[1] || '(root)';

        sections[section] = (sections[section] ?? 0) + 1;

        pages[url] = {
            words: f.word_count,
            title: stripPrefix(f.meta?.title ?? '', prefix),
            filters: f.filters ?? {},
            // Ids only. Anchor text and character offsets move whenever any earlier
            // word on the page changes, which would make every capture a diff.
            anchors: f.anchors.map((a) => a.id).filter(Boolean).sort(),
            contentHash: sha(f.content),
            contentHead: f.content.slice(0, 120)
        };

    }

    const normalizedQueries = {};

    for (const [q, r] of Object.entries(queries)) {
        normalizedQueries[q] = {
            total: r.total,
            top: r.top.map((t) => ({ url: stripPrefix(t.url, prefix), subResults: t.subResults }))
        };
    }

    return {
        pagefindVersion: meta.pagefindVersion,
        dataBranch: meta.dataBranch,
        pageCount: fragments.length,
        sections,
        queries: normalizedQueries,
        pages
    };

};

// ----------------------------------------------------------------------- //
// controls
// ----------------------------------------------------------------------- //

// Returns the control failures. An empty array is only meaningful because each
// control names a page or a query that must behave a particular way — a capture of
// an empty site fails all of them rather than passing quietly.
const runControls = (record) => {

    const failures = [];

    for (const control of CONTENT_CONTROLS) {

        const page = record.pages[control.url];

        if (control.absent) {
            if (page) {
                failures.push(
                    `rendered-content control: ${control.kind} — ${control.url} is in the index with ${page.words} words, ` +
                    `and should not be there at all. Has its page-level data-pagefind-ignore been removed?`
                );
            }
            continue;
        }

        if (!page) {
            failures.push(`rendered-content control: ${control.kind} — ${control.url} is not in the index at all`);
            continue;
        }

        if (page.words < control.min) {
            failures.push(`rendered-content control: ${control.kind} — ${control.url} indexed ${page.words} words, floor is ${control.min}`);
        }

    }

    for (const { q, expectAtLeast, expectAtMost } of QUERIES) {

        const result = record.queries[q];

        if (!result) {
            failures.push(`query control: "${q}" returned no result object — the Pagefind JS API did not run`);
            continue;
        }

        if (expectAtLeast !== undefined && result.total < expectAtLeast) {
            failures.push(`query control: "${q}" returned ${result.total} results, floor is ${expectAtLeast}`);
        }

        if (expectAtMost !== undefined && result.total > expectAtMost) {
            failures.push(`query control: "${q}" returned ${result.total} results, ceiling is ${expectAtMost} — the query path is not discriminating`);
        }

    }

    return failures;

};

// ----------------------------------------------------------------------- //
// diff
// ----------------------------------------------------------------------- //

// How many per-page changes to print before summarizing. A template change touching
// a shared partial moves hundreds of pages identically, and printing all of them
// buries the one page that moved for a different reason.
const DIFF_SAMPLE = 12;

const diff = (baseline, current) => {

    const lines = [];

    if (baseline.dataBranch !== current.dataBranch) {
        lines.push(`  data branch: ${baseline.dataBranch} -> ${current.dataBranch}  (different EHDP-data; content differences below are expected)`);
    }

    if (baseline.pagefindVersion !== current.pagefindVersion) {
        lines.push(`  pagefind version: ${baseline.pagefindVersion} -> ${current.pagefindVersion}`);
    }

    if (baseline.pageCount !== current.pageCount) {
        lines.push(`  indexed pages: ${baseline.pageCount} -> ${current.pageCount}`);
    }

    // ----- section counts ----- //

    for (const section of [...new Set([...Object.keys(baseline.sections), ...Object.keys(current.sections)])].sort()) {

        const was = baseline.sections[section] ?? 0;
        const now = current.sections[section] ?? 0;

        if (was !== now) lines.push(`  section ${section}: ${was} -> ${now} indexed pages`);

    }

    // ----- pages added and removed ----- //

    const added = Object.keys(current.pages).filter((u) => !baseline.pages[u]);
    const removed = Object.keys(baseline.pages).filter((u) => !current.pages[u]);

    for (const [label, list] of [['no longer indexed', removed], ['newly indexed', added]]) {

        if (!list.length) continue;

        lines.push(`  ${list.length} page(s) ${label}:`);
        for (const url of list.slice(0, DIFF_SAMPLE)) lines.push(`      ${url}`);
        if (list.length > DIFF_SAMPLE) lines.push(`      ... and ${list.length - DIFF_SAMPLE} more`);

    }

    // ----- per-page field changes ----- //

    const changed = { words: [], title: [], filters: [], anchors: [], contentHash: [] };

    for (const [url, was] of Object.entries(baseline.pages)) {

        const now = current.pages[url];
        if (!now) continue;

        if (was.words !== now.words) changed.words.push(`${url}  ${was.words} -> ${now.words}`);
        if (was.title !== now.title) changed.title.push(`${url}  "${was.title}" -> "${now.title}"`);
        if (JSON.stringify(was.filters) !== JSON.stringify(now.filters)) changed.filters.push(`${url}  ${JSON.stringify(was.filters)} -> ${JSON.stringify(now.filters)}`);
        if (JSON.stringify(was.anchors) !== JSON.stringify(now.anchors)) changed.anchors.push(`${url}  ${was.anchors.length} -> ${now.anchors.length} anchor id(s)`);
        // Reported only where the word count held steady, so a rewrite is not listed
        // twice; a same-length change is the one a word count cannot see.
        if (was.contentHash !== now.contentHash && was.words === now.words) changed.contentHash.push(`${url}  text changed, word count unchanged (${now.words})`);

    }

    for (const [field, list] of Object.entries(changed)) {

        if (!list.length) continue;

        lines.push(`  ${list.length} page(s) with changed ${field}:`);
        for (const entry of list.slice(0, DIFF_SAMPLE)) lines.push(`      ${entry}`);
        if (list.length > DIFF_SAMPLE) lines.push(`      ... and ${list.length - DIFF_SAMPLE} more`);

    }

    // ----- queries ----- //

    for (const { q } of QUERIES) {

        const was = baseline.queries[q];
        const now = current.queries[q];

        if (!was || !now) continue;

        const wasTop = was.top.map((t) => t.url);
        const nowTop = now.top.map((t) => t.url);

        if (was.total === now.total && JSON.stringify(wasTop) === JSON.stringify(nowTop)) continue;

        lines.push(`  query "${q}": ${was.total} -> ${now.total} result(s)`);

        if (JSON.stringify(wasTop) !== JSON.stringify(nowTop)) {
            lines.push(`      was: ${wasTop.slice(0, 5).join('  ') || '(none)'}`);
            lines.push(`      now: ${nowTop.slice(0, 5).join('  ') || '(none)'}`);
        }

    }

    return lines;

};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const main = async () => {

    const argv = process.argv.slice(2);
    const againstIndex = argv.indexOf('--against');
    const against = againstIndex === -1 ? null : argv[againstIndex + 1];

    const mode = against ? 'against' : argv.includes('--baseline') ? 'baseline' : argv.includes('--check') ? 'check' : null;

    if (!mode) {
        console.error(
            'Usage:\n' +
            '  node scripts/pagefind-characterization.mjs --baseline\n' +
            '  node scripts/pagefind-characterization.mjs --check\n' +
            '  node scripts/pagefind-characterization.mjs --against <built-site-dir>\n\n' +
            '  --keep-build   leave the temp build in place and print its path\n' +
            '  PAGEFIND_ENV   Hugo environment to build (default local_prod)'
        );
        process.exitCode = 2;
        return;
    }

    if (against && !existsSync(against)) {
        console.error(`\n--against: ${against} does not exist.`);
        process.exitCode = 2;
        return;
    }

    // ----- config gate ----- //

    const site = readSiteConfig(ENV);

    if (!site?.dataBranch) {
        console.error(
            `\nREFUSING TO RUN — could not read data_branch from the merged config for --environment ${ENV}.\n` +
            `Captures are filed per EHDP-data branch, so there is nowhere correct to put this one.`
        );
        process.exitCode = 2;
        return;
    }

    const baselineFile = join(BASELINE_ROOT, `${site.dataBranch}.json`);

    if (mode === 'check' && !existsSync(baselineFile)) {
        console.error(
            `\nNO BASELINE for EHDP-data branch "${site.dataBranch}" (looked for ${baselineFile}).\n` +
            `Run --baseline first, or set PAGEFIND_ENV to an environment on a branch that has one.`
        );
        process.exitCode = 1;
        return;
    }

    console.log(`Environment: ${ENV}   EHDP-data branch: ${site.dataBranch}   baseURL prefix: ${site.prefix || '(none)'}\n`);

    const work = mkdtempSync(join(tmpdir(), 'pagefind-char-'));
    const keepBuild = argv.includes('--keep-build');

    let browser;
    let servers = [];

    try {

        // ----- build and index ----- //

        console.log('Building site to a temp directory (isolated from resources/_gen) ...');

        const built = buildSite(ENV, work);

        if (!built.ok) {
            console.error(`\nBUILD FAILED for --environment ${ENV}:\n${built.log}`);
            process.exitCode = 2;
            return;
        }

        console.log('Running pagefind over the build ...');

        const indexed = runPagefind(built.publicDir);

        if (!indexed.ok) {
            console.error(`\nPAGEFIND FAILED:\n${indexed.log}`);
            process.exitCode = 2;
            return;
        }

        const pagefindDir = resolvePagefindDir(built.publicDir);

        if (!pagefindDir) {
            console.error('\nPagefind reported success but wrote no index. Nothing to characterize.');
            process.exitCode = 2;
            return;
        }

        // ----- capture ----- //

        browser = await chromium.launch({ headless: true });

        const entry = JSON.parse(readFileSync(join(pagefindDir, 'pagefind-entry.json'), 'utf8'));

        servers.push(await serveStatic(built.publicDir, site.prefix, 8931));

        const current = capture(
            readFragments(pagefindDir),
            await runQueries(browser, 'http://localhost:8931', site.prefix),
            { pagefindVersion: entry.version, dataBranch: site.dataBranch },
            site.prefix
        );

        console.log(`Captured ${current.pageCount} indexed page(s), pagefind ${current.pagefindVersion}.\n`);

        // ----- controls ----- //

        const controlFailures = runControls(current);

        if (controlFailures.length) {

            console.error('CONTROLS FAILED — the capture does not describe a working site:\n');
            for (const f of controlFailures) console.error(`  ${f}`);
            console.error(
                `\nNo baseline written and no comparison made. Fix the build first: a baseline ` +
                `recorded now would pin the broken state as the thing to match.`
            );
            process.exitCode = 2;
            return;

        }

        console.log(`Controls passed — ${CONTENT_CONTROLS.length} page kind(s) rendered, query path answers and refuses correctly.\n`);

        // ----- compare or write ----- //

        if (mode === 'baseline') {

            mkdirSync(BASELINE_ROOT, { recursive: true });
            writeFileSync(baselineFile, `${JSON.stringify(current, null, 2)}\n`);

            console.log(`Baseline written to ${baselineFile}. Commit it.`);
            return;

        }

        let other;
        let label;

        if (mode === 'check') {

            other = JSON.parse(readFileSync(baselineFile, 'utf8'));
            label = `baseline ${baselineFile}`;

        } else {

            const otherDir = resolvePagefindDir(against);

            if (!otherDir) {
                console.error(`\n--against: no pagefind index found under ${against}. Expected a built site with a pagefind/ directory.`);
                process.exitCode = 2;
                return;
            }

            // The other site was built by someone else, under an environment this run
            // does not know. Its own prefix is read off its meta values rather than
            // assumed, so a production docs/ built under /local-prod/ compares cleanly.
            const otherFragments = readFragments(otherDir);
            const otherEntry = JSON.parse(readFileSync(join(otherDir, 'pagefind-entry.json'), 'utf8'));
            const otherPrefix = (otherFragments.find((f) => f.meta?.image)?.meta.image ?? '').match(/^(\/[^/]+)\/images\//)?.[1] ?? '';

            servers.push(await serveStatic(otherDir.replace(/[/\\]pagefind$/, ''), otherPrefix, 8932));

            other = capture(
                otherFragments,
                await runQueries(browser, 'http://localhost:8932', otherPrefix),
                { pagefindVersion: otherEntry.version, dataBranch: '(other site)' },
                otherPrefix
            );

            label = `${against} (${other.pageCount} indexed pages)`;

        }

        const changes = diff(other, current);

        if (!changes.length) {
            console.log(`PASSED — this build's index matches ${label} in every recorded field.`);
            return;
        }

        console.log(`Differences against ${label}:\n`);
        for (const line of changes) console.log(line);

        if (mode === 'check') {
            console.error(`\nPagefind characterization FAILED — the index differs from the baseline. If the change is intended, re-run with --baseline.`);
            process.exitCode = 1;
        }

    } finally {

        for (const server of servers) server.close();
        if (browser) await browser.close();

        if (keepBuild) {
            console.log(`\nBuild kept at ${work}`);
        } else {
            rmSync(work, { recursive: true, force: true });
        }

    }

};

main();
