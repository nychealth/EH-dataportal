// =========================================================================
// Site-wide accessibility audit — axe-core under Playwright
// =========================================================================
//
//   node scripts/site-a11y-audit.mjs [environment]      default: prod_prod
//   DE_BASE_URL=http://localhost:8080/dev-stage/ node scripts/site-a11y-audit.mjs
//
// The site-wide counterpart to scripts/nr-a11y-audit.mjs (on the Neighborhood
// Reports branch), which covers only the four NR page kinds. Runs axe over:
//
//   - the curated smoke list, read from scripts/smoke-pages.mjs (one page per
//     template kind);
//   - every Data Explorer topic page, twice: bare, which opens the indicator
//     chooser, and with the topic's first indicator, which renders the explorer.
//
// By default it builds and serves the named environment on the isolated :8090
// server (scripts/isolated-server.mjs), with the Pagefind index the live build
// has, and stops it afterwards. With DE_BASE_URL set it scans that server instead.
//
// It is an audit instrument, not a gate: findings never fail it. It exits 1
// only when its own evidence is void —
//
//   - the positive control (an injected <img> with no alt must fire image-alt)
//     did not fire, which is what a scan where axe never ran looks like;
//   - a page failed to load, or failed its rendered-content control, so its
//     zero would describe an empty page rather than the page.
//
// Per-page JSON and summary.json land in A11Y_OUT (default: a temp directory).
// Read `incompleteIds` as well as `violations`: axe defers nodes whose
// background it cannot resolve, so a zero for color-contrast is a floor.

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PORT, responds, startServer } from './isolated-server.mjs';
import { mapPool } from './site-urls.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const AXE_PATH = join(REPO_ROOT, 'node_modules/axe-core/axe.min.js');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// The smoke list's length when this script was written. Reading it from source
// text is only safe while the count is checked: a parse that silently finds
// fewer entries would shrink the audit without saying so.
const EXPECTED_SMOKE_PAGES = 44;

// Explorer pages load their data after `load`; wait for something the render
// produces before scanning, rather than for a fixed delay.
const EXPLORER_RENDERED = '#map .leaflet-interactive, #map canvas, .vega-embed svg, .vega-embed canvas, table.dataTable';

// ----------------------------------------------------------------------- //
// page list
// ----------------------------------------------------------------------- //

// Reads PAGES out of smoke-pages.mjs without importing it: that module runs a
// smoke sweep at load. Matches each string literal between `const PAGES = [`
// and the first `];` after it.
const readSmokePages = () => {

    const source = readFileSync(join(REPO_ROOT, 'scripts/smoke-pages.mjs'), 'utf8');
    const start = source.indexOf('const PAGES = [');
    const end = source.indexOf('];', start);

    if (start === -1 || end === -1) throw new Error('Could not find `const PAGES = [ … ];` in smoke-pages.mjs');

    // A string literal at the start of a line, before any comment: `    "data-stories/",  // …`
    const pages = [...source.slice(start, end).matchAll(/^\s*"([^"]*)",/gm)].map((m) => m[1]);

    if (pages.length !== EXPECTED_SMOKE_PAGES) {
        throw new Error(`Read ${pages.length} smoke pages, expected ${EXPECTED_SMOKE_PAGES}; update EXPECTED_SMOKE_PAGES only after checking the parse.`);
    }

    return pages;
};

// Each explorer topic, bare and with its first indicator, from the build's own
// topic_indicators.json (published by the de-topic-indicators partial).
const readTopicPages = async (baseURL) => {

    const url = `${baseURL}IndicatorMetadata/topic_indicators.json`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`${url} answered ${response.status}`);

    const topics = await response.json();
    const entries = Object.entries(topics || {});

    if (!entries.length) throw new Error(`${url} holds no topics`);

    return entries.flatMap(([topic, entry]) => {
        const first = (entry?.IndicatorID || [])[0];
        return first === undefined
            ? [`data-explorer/${topic}/`]
            : [`data-explorer/${topic}/`, `data-explorer/${topic}/?id=${first}`];
    });
};

// ----------------------------------------------------------------------- //
// axe plumbing (as in nr-a11y-audit.mjs)
// ----------------------------------------------------------------------- //

// Runs axe for one tag set and keeps the rule, its impact and where it fired;
// the full result carries every passing node and is far too large to keep.
const runAxe = async (page, tags) => page.evaluate(async (t) => {

    const result = await window.axe.run(document, {
        runOnly:     { type: 'tag', values: t },
        resultTypes: ['violations']
    });

    return {
        violations: result.violations.map((v) => ({
            id:        v.id,
            impact:    v.impact,
            help:      v.help,
            nodeCount: v.nodes.length,
            nodes:     v.nodes.slice(0, 6).map((n) => ({
                target:  n.target,
                html:    n.html.slice(0, 300),
                summary: (n.failureSummary || '').slice(0, 400)
            }))
        })),
        incompleteIds: result.incomplete.map((i) => i.id)
    };
}, tags);

// Injects a deliberately broken element and returns true only if axe catches it.
const provePositiveControl = async (page) => page.evaluate(async () => {

    const probe = document.createElement('img');
    probe.src = 'a11y-positive-control.png';
    probe.id = 'a11y-positive-control';
    document.body.appendChild(probe);

    const result = await window.axe.run(document, {
        runOnly:     { type: 'rule', values: ['image-alt'] },
        resultTypes: ['violations']
    });

    probe.remove();

    return result.violations.some((v) => v.id === 'image-alt'
        && v.nodes.some((n) => String(n.target).includes('a11y-positive-control')));
});

// ----------------------------------------------------------------------- //
// one page
// ----------------------------------------------------------------------- //

// Loads one page, applies its rendered-content control, runs axe. Never throws:
// a page that fails is returned as a failure so the run can count it.
const auditPage = async (browser, baseURL, path, controlState) => {

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    try {
        const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'load', timeout: 40000 });
        const status = response ? response.status() : null;

        // Rendered-content control: the page must not be an error page, its <main>
        // must show some text, and an explorer page with an indicator must have
        // drawn something. It guards against scanning an empty or missing page,
        // not against a short one: section and catalog pages legitimately show
        // under 200 characters once their d-none blocks are excluded.
        const isIndicator = path.includes('?id=');
        if (isIndicator) await page.waitForSelector(EXPLORER_RENDERED, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(1500);

        const rendered = await page.evaluate((sel) => ({
            mainText:  (document.querySelector('main')?.innerText || '').trim().length,
            indicator: sel ? document.querySelectorAll(sel).length : null
        }), isIndicator ? EXPLORER_RENDERED : null);
        rendered.status = status;
        const renderedOk = status !== null && status < 400 && rendered.mainText > 0 && (!isIndicator || rendered.indicator > 0);

        await page.addScriptTag({ path: AXE_PATH });

        // Proving the control once per run is enough: it tests the injection path
        // and the axe build, neither of which varies by page.
        if (!controlState.proven) {
            controlState.proven = await provePositiveControl(page);
            controlState.provenOn = path || '(home)';
        }

        return {
            path,
            ok:              renderedOk,
            renderedControl: rendered,
            axeVersion:      await page.evaluate(() => window.axe.version),
            wcag:            await runAxe(page, WCAG_TAGS),
            bestPractice:    await runAxe(page, ['best-practice'])
        };
    } catch (error) {
        return { path, ok: false, error: String(error.message || error).slice(0, 300) };
    } finally {
        await page.close();
    }
};

// ----------------------------------------------------------------------- //
// summary
// ----------------------------------------------------------------------- //

// Per rule: how many pages it fired on and how many nodes in all.
const tally = (results, key, field) => {

    const byRule = {};
    for (const r of results) {
        for (const v of r[key]?.[field] || []) {
            const id = typeof v === 'string' ? v : v.id;
            byRule[id] ??= { pages: 0, nodes: 0, impact: v.impact ?? null, examplePaths: [] };
            byRule[id].pages += 1;
            byRule[id].nodes += v.nodeCount ?? 0;
            if (byRule[id].examplePaths.length < 5) byRule[id].examplePaths.push(r.path);
        }
    }
    return Object.fromEntries(Object.entries(byRule).sort((a, b) => b[1].pages - a[1].pages));
};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const main = async () => {

    const args = process.argv.slice(2);
    if (args.some((a) => a.startsWith('-')) || args.length > 1) {
        console.error('usage: node scripts/site-a11y-audit.mjs [environment]   (positional only; default prod_prod)');
        return 2;
    }
    const environment = args[0] || 'prod_prod';
    const outDir = process.env.A11Y_OUT || join(tmpdir(), `site-a11y-${Date.now()}`);
    mkdirSync(outDir, { recursive: true });

    // Resolve the server: the one named by DE_BASE_URL, or our own isolated build.
    let baseURL = process.env.DE_BASE_URL;
    let stop = () => {};
    if (!baseURL) {
        if (await responds(`http://localhost:${PORT}/`)) {
            console.error(`Something already answers on :${PORT}; refusing to start a second server.`);
            return 2;
        }
        const server = await startServer(environment);
        ({ baseURL, stop } = server);
        execSync(`npx -y pagefind --site "${server.destDir}"`, { cwd: REPO_ROOT, stdio: 'ignore' });
    }
    if (!baseURL.endsWith('/')) baseURL += '/';

    const browser = await chromium.launch();
    const controlState = { proven: false, provenOn: null };

    try {
        const paths = [...readSmokePages(), ...(await readTopicPages(baseURL))];
        const commit = execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
        console.log(`Auditing ${paths.length} pages at ${baseURL} (tree ${commit.slice(0, 10)})`);

        // The positive control runs on the first page audited, before the pool.
        const results = [await auditPage(browser, baseURL, paths[0], controlState)];
        results.push(...await mapPool(paths.slice(1), 6, (p) => auditPage(browser, baseURL, p, controlState)));

        results.forEach((r, i) => writeFileSync(join(outDir, `page-${String(i).padStart(3, '0')}.json`), JSON.stringify(r, null, 2)));

        const failed = results.filter((r) => !r.ok);
        const summary = {
            commit, baseURL, environment: process.env.DE_BASE_URL ? null : environment,
            axeVersion: results.find((r) => r.axeVersion)?.axeVersion ?? null,
            positiveControl: controlState,
            pages: { input: paths.length, audited: results.length, failed: failed.map((r) => ({ path: r.path, error: r.error ?? null, renderedControl: r.renderedControl ?? null })) },
            wcagViolations:  tally(results, 'wcag', 'violations'),
            wcagIncomplete:  tally(results, 'wcag', 'incompleteIds'),
            bestPractice:    tally(results, 'bestPractice', 'violations')
        };
        writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

        console.log(`axe ${summary.axeVersion}; positive control: ${controlState.proven ? `FIRED (on ${controlState.provenOn})` : 'DID NOT FIRE'}`);
        console.log(`pages: ${paths.length} input, ${results.length} audited, ${failed.length} failed load or render control`);
        for (const f of failed) console.log(`  FAILED ${f.path}: ${f.error ?? JSON.stringify(f.renderedControl)}`);
        console.log('WCAG violations (rule: pages / nodes):');
        for (const [id, t] of Object.entries(summary.wcagViolations)) console.log(`  ${id} [${t.impact}]: ${t.pages} / ${t.nodes}`);
        console.log(`WCAG incomplete (rule: pages): ${Object.entries(summary.wcagIncomplete).map(([id, t]) => `${id} ${t.pages}`).join(', ')}`);
        console.log(`Output: ${outDir}`);

        return controlState.proven && !failed.length && results.length === paths.length ? 0 : 1;
    } finally {
        await browser.close();
        stop();
    }
};

// Exit code via process.exitCode, never process.exit(), after network I/O on Windows.
main().then((code) => { process.exitCode = code; }, (error) => { console.error(error); process.exitCode = 1; });
