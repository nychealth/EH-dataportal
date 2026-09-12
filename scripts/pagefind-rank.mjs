// Full ranked result list, with scores, for one or more queries against an
// already-built site.
//
//   node scripts/pagefind-rank.mjs <built-site-dir> [query] [query] ...
//   node scripts/pagefind-rank.mjs C:/temp/pagefind-char-ld34WV/public "climate"
//
// WHY THIS EXISTS, given scripts/pagefind-characterization.mjs already queries the
// index: that harness records the top QUERY_DEPTH (10) URLs per query and no scores,
// deliberately — it is a regression check, and a baseline holding 173 scored rows per
// query would churn on every content edit. So it can tell you a page left the top ten
// and cannot tell you whether it fell to eleventh or ninety-ninth, nor whether the
// ordering it left was meaningful.
//
// That distinction decided the NDHR indexing question on 2026-09-12. The harness showed
// /neighborhood-reports/ dropping out of the top five for "neighborhood reports", which
// read as a shuffle. This script showed it at rank 99 of 173 with 105 results inside
// 0.05 of the top score, against 2 before — the query had stopped discriminating, which
// is a different finding with a different answer.
//
// It needs a BUILT site because Pagefind is a post-build step that hugo itself never runs.
// A server started by scripts/dev-server.mjs is the exception — it runs `npx -y pagefind
// --site docs` afterwards (dev-server.mjs:129) — but that index describes docs/, whatever
// was last built there, which is why this script refuses that path. Get one from the
// harness's own build:
//
//   node scripts/pagefind-characterization.mjs --check --keep-build
//
// which prints "Build kept at <dir>"; the site is the public/ directory under it.
//
// Positional arguments, and an argument starting with "-" is refused rather than
// half-honoured: PowerShell eats the "--" in an npm run and npm eats a flag's name,
// leaving its value as a nameless positional, so a flag interface here would silently
// mean something other than what was typed. Same contract as characterize-env.mjs.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

// Queries used when none are named. The first two are the pair the NDHR decision turned
// on; both are multi-word, which is where crowding shows up first.
const DEFAULT_QUERIES = ['neighborhood reports', 'climate'];

// How far down the list to resolve URLs. Every result carries a score for free, but
// url needs a data() call per result, which is the slow part.
const HEAD_DEPTH = 12;

// Ceiling on the data() calls made while hunting for a specific page's rank. A query
// matching most of the site would otherwise resolve every result. When this is hit the
// output says so — a rank reported as "not found" and one never looked for must not
// print the same way.
const SCAN_LIMIT = 400;

const TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm'
};

const argv = process.argv.slice(2);

const flagLike = argv.find(a => a.startsWith('-'));
if (flagLike) {
    console.error(`\nArguments are positional here; "${flagLike}" looks like a flag.\n` +
                  `  node scripts/pagefind-rank.mjs <built-site-dir> [query] ...\n`);
    process.exit(2);
}

const root = argv[0];
const queries = argv.length > 1 ? argv.slice(1) : DEFAULT_QUERIES;

if (!root) {
    console.error('\nusage: node scripts/pagefind-rank.mjs <built-site-dir> [query] ...\n');
    process.exit(2);
}

// docs/ is the one path worth refusing by name: it holds whatever was last built, so a
// rank read there describes some earlier tree and looks exactly like a rank read from the
// build you meant. scripts/pagefind-characterization.mjs refuses to read it for the same
// reason.
if (/(^|[\\/])docs[\\/]?$/.test(root)) {
    console.error(`\n${root} is the repo's docs/ — it holds whatever was last built, which is not\n` +
                  `necessarily this tree. Build one instead:\n` +
                  `  node scripts/pagefind-characterization.mjs --check --keep-build\n`);
    process.exit(2);
}

if (!existsSync(join(root, 'pagefind', 'pagefind.js'))) {
    console.error(`\nNo Pagefind index under ${root} — expected ${join(root, 'pagefind', 'pagefind.js')}.\n` +
                  `A hugo server build will not have one. Run:\n` +
                  `  node scripts/pagefind-characterization.mjs --check --keep-build\n` +
                  `and point this at the public/ directory it names.\n`);
    process.exit(2);
}

// Throwaway static server on an ephemeral port: Pagefind fetches its index shards, so
// file:// will not do, and a fixed port would collide with a dev server.
const server = createServer((req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    let file = join(root, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
});

await new Promise(resolve => server.listen(0, resolve));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/404.html`);

const report = await page.evaluate(async ({ queries, headDepth, scanLimit }) => {

    const pf = await import('/pagefind/pagefind.js');
    await pf.options({ baseUrl: '/' });

    const out = {};

    for (const q of queries) {

        const search = await pf.search(q);
        const results = search.results;
        const scores = results.map(r => r.score);

        // The head of the list, with URLs resolved.
        const head = [];
        for (let i = 0; i < Math.min(headDepth, results.length); i++) {
            const data = await results[i].data();
            head.push({ rank: i + 1, score: results[i].score, url: data.url });
        }

        // Every URL down to the scan limit, so any page's rank can be looked up. The
        // stop reason is recorded: exhausted and truncated are different answers.
        const ranked = [];
        let scanned = 0;
        for (; scanned < Math.min(scanLimit, results.length); scanned++) {
            const data = await results[scanned].data();
            ranked.push({ rank: scanned + 1, score: results[scanned].score, url: data.url });
        }

        const top = scores[0] ?? 0;
        const within = d => scores.filter(s => top - s <= d).length;

        out[q] = {
            total: results.length,
            head,
            ranked,
            scan: {
                scanned,
                stoppedBecause: scanned >= results.length ? 'results exhausted' : `scan limit of ${scanLimit} reached`
            },
            distribution: {
                distinctScores: new Set(scores.map(s => s.toFixed(6))).size,
                topScore: top,
                lastScore: scores[scores.length - 1] ?? 0,
                withinPoint01: within(0.01),
                withinPoint05: within(0.05),
                withinPoint5: within(0.5)
            }
        };
    }

    return out;

}, { queries, headDepth: HEAD_DEPTH, scanLimit: SCAN_LIMIT });

await browser.close();
server.close();

// ----------------------------------------------------------------------- //
// report
// ----------------------------------------------------------------------- //

for (const [q, r] of Object.entries(report)) {

    const d = r.distribution;

    console.log(`\n"${q}" — ${r.total} result(s)`);
    console.log(`  scores ${d.topScore.toFixed(4)} down to ${d.lastScore.toFixed(4)}, ${d.distinctScores} distinct`);
    console.log(`  within 0.01 of the top: ${d.withinPoint01}   within 0.05: ${d.withinPoint05}   within 0.5: ${d.withinPoint5}`);

    // A near-tied head is the thing a top-ten list hides: when most of the first page
    // scores the same, the ordering inside it is arbitrary and reading a rank change
    // there as a ranking change is a mistake.
    if (d.withinPoint05 > 10) {
        console.log(`  NOTE: ${d.withinPoint05} results sit within 0.05 of the top score — ordering among them is close to arbitrary.`);
    }

    console.log('');
    for (const row of r.head) {
        console.log(`  ${String(row.rank).padStart(4)}  ${row.score.toFixed(4)}  ${row.url}`);
    }

    if (r.total > r.head.length) {
        console.log(`  ... ${r.total - r.head.length} more; ${r.scan.scanned} URL(s) resolved (${r.scan.stoppedBecause})`);
    }
}

// Machine-readable form, for diffing two builds against each other.
if (process.env.PAGEFIND_RANK_JSON) {
    console.log('\n' + JSON.stringify(report, null, 2));
}

console.log('');
