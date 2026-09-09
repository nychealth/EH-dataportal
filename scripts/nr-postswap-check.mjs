// ======================================================================= //
// nr-postswap-check.mjs
// ======================================================================= //

// The other half of scripts/nr-output-precapture.mjs.
//
// Option D replaced 252 content-file-backed nr-output pages with adapter-generated ones
// in a single commit, so the two could never be built side by side. The pre-capture
// recorded what the old pages rendered; this reads what the new ones render and diffs
// the two. It is the rollback that the same-paths constraint took away.
//
// It has to drive a browser, which the pre-capture did not. The old
// nr-output/single.html rendered its indicator cards server-side, so reading the built
// HTML was enough; the SPA that replaces it renders them from JS after fetching
// EHDP-data, and none of that text exists in the file on disk.
//
// THE DATA BRANCH HAS TO MATCH. The pre-capture was built against EHDP-data's
// `production` branch, and ensureDevServer() spawns `--environment dev_stage`, which
// serves `staging`. Those branches differ in row counts — staging carries an Indoor Air
// Quality "Mold" indicator that production does not — so a default run reports 210
// content regressions that are nothing of the kind. The check below refuses to run on a
// mismatch rather than let that read as a finding.
//
// Usage — start a production-data server first and point the harness at it:
//   npx hugo server --environment development -p 8081
//   DE_BASE_URL=http://localhost:8081/EH-dataportal/ node scripts/nr-postswap-check.mjs
//
//   ...            # the 20 highest-traffic report pages
//   ... --all      # all 210, several minutes
//   ... --limit 5
//
// Exits non-zero on any mismatch.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDevServer } from './dev-server.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE = JSON.parse(readFileSync(join(REPO_ROOT, 'scripts', 'nr-output-precapture', 'capture.json'), 'utf8'));

const args = process.argv.slice(2);
const runAll = args.includes('--all');
const limitArg = args.indexOf('--limit');
const limit = limitArg !== -1 ? Number(args[limitArg + 1]) : 20;


// ----------------------------------------------------------------------- //
// normalization
// ----------------------------------------------------------------------- //

const squash = s => (s || '').replace(/\s+/g, ' ').trim();

// The retired template sentence-cased report_topic headings ("Adult asthma"); the SPA
// prints the YAML value as written ("Adult Asthma"). That is a rendering difference
// between the two templates, not a data difference, so headings compare case-folded
const foldCase = s => squash(s).toLowerCase();

// The old page printed "10029, 10035." with the period from the template; the SPA's
// zip list has no trailing period
const zips = s => squash(s).replace(/\.$/, '');


// ----------------------------------------------------------------------- //
// extraction from the rendered SPA
// ----------------------------------------------------------------------- //

// Reads the same four things the pre-capture read, from the live DOM instead of the file
const extractReport = () => {

    const text = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();

    const reportTopics = [...document.querySelectorAll('.report-section > .px-2')].map(d => ({
        heading: text(d.querySelector('h3')),
        description: text(d.querySelector('p'))
    }));

    const indicators = [...document.querySelectorAll('.card-header[id$="-h"]')].map(h => {

        // The detail panel is a sibling of the header, keyed by the header's own id
        const panel = document.getElementById(h.id.replace(/-h$/, '-c'));

        return {
            shortName: text(h.querySelector('.font-weight-bold.fs-md')),
            longName: text(h.querySelector('.fs-sm.font-weight-normal')),
            description: panel ? text(panel.querySelector('p.fs-md')) : null,
            sourceList: panel
                ? text([...panel.querySelectorAll('p.fs-xs')].find(p => p.textContent.includes('Source:')))
                    .replace(/^Source:\s*/, '')
                : null
        };

    });

    return {
        neighborhood: text(document.getElementById('nr-header-neighborhood')),
        zips: text(document.getElementById('nr-zip-list')),
        reportTopics,
        indicators
    };

};


// ----------------------------------------------------------------------- //
// per-page comparison
// ----------------------------------------------------------------------- //

// Every indicator the old page showed, resolved out of the deduplicated library
const expectedIndicators = (topic, keys) =>
    keys.map(k => CAPTURE.indicatorLibrary[`${topic}/${k}`]).filter(Boolean);

// Compares as sorted sets: the SPA orders cards by data_value_rank as the old page did,
// but a reordering is not the regression this is looking for — a missing or changed
// indicator is
const asSet = list => list
    .map(i => [squash(i.shortName), squash(i.longName), squash(i.description)].join(' | '))
    .sort();

const comparePage = (key, expected, actual) => {

    const [, topic] = key.split('/');
    const problems = [];

    if (squash(actual.neighborhood) !== squash(expected.neighborhood)) {
        problems.push(`neighborhood: expected "${expected.neighborhood}", got "${actual.neighborhood}"`);
    }

    if (zips(actual.zips) !== zips(expected.zips)) {
        problems.push(`zips: expected "${zips(expected.zips)}", got "${zips(actual.zips)}"`);
    }

    // ----- report topics ----- //

    const expTopics = expected.reportTopics.map(t => `${foldCase(t.heading)} | ${squash(t.description)}`);
    const actTopics = actual.reportTopics.map(t => `${foldCase(t.heading)} | ${squash(t.description)}`);

    if (expTopics.length !== actTopics.length) {
        problems.push(`report topics: expected ${expTopics.length}, got ${actTopics.length}`);
    } else {
        expTopics.forEach((t, i) => {
            if (t !== actTopics[i]) problems.push(`report topic ${i}:\n      expected ${t}\n      got      ${actTopics[i]}`);
        });
    }

    // ----- indicators ----- //

    // A zero here is the specific regression the pre-capture was taken to catch: every
    // page in that artifact carries between 10 and 22 indicators and none carries zero
    if (actual.indicators.length === 0) {
        problems.push('indicators: rendered ZERO — this is the Greenwich Village failure mode');
    }

    const expInd = asSet(expectedIndicators(topic, expected.indicatorKeys));
    const actInd = asSet(actual.indicators);

    if (expInd.length !== actInd.length) {
        problems.push(`indicator count: expected ${expInd.length}, got ${actInd.length}`);
    }

    const missing = expInd.filter(i => !actInd.includes(i));
    const extra = actInd.filter(i => !expInd.includes(i));

    missing.slice(0, 3).forEach(i => problems.push(`indicator missing: ${i}`));
    extra.slice(0, 3).forEach(i => problems.push(`indicator unexpected: ${i}`));

    if (missing.length > 3) problems.push(`  …and ${missing.length - 3} more missing`);
    if (extra.length > 3) problems.push(`  …and ${extra.length - 3} more unexpected`);

    return problems;

};


// ----------------------------------------------------------------------- //
// run
// ----------------------------------------------------------------------- //

const server = await ensureDevServer();
const browser = await chromium.launch();

// Highest-traffic pages first, so a truncated run still covers what most users load
const keys = Object.keys(CAPTURE.reportPages)
    .sort((a, b) => (CAPTURE.reportPages[b].sessions || 0) - (CAPTURE.reportPages[a].sessions || 0));

const targets = runAll ? keys : keys.slice(0, limit);

// ----- data-branch gate ----- //

// head.html declares `data_branch` as a top-level `let`, so it is reachable from an
// evaluate() but is not a window property
const gate = await browser.newPage();
await gate.goto(`${server.baseURL}neighborhood-reports/`, { waitUntil: 'load', timeout: 45000 });
const servedBranch = await gate.evaluate(() => (typeof data_branch === 'undefined' ? null : data_branch));
await gate.close();

// capture.environment is a Hugo environment name; every one of them that serves
// production data resolves to this branch
const EXPECTED_BRANCH = 'production';

if (servedBranch !== EXPECTED_BRANCH) {
    await browser.close();
    await server.stop();
    console.error(
        `\nREFUSING TO RUN — the dev server is serving EHDP-data "${servedBranch}", but the ` +
        `pre-capture was taken from "${EXPECTED_BRANCH}" (capture.environment: ${CAPTURE.environment}).\n` +
        `Every content difference reported would be a data difference. Start a production-data ` +
        `server and set DE_BASE_URL — see the header of this file.`
    );
    process.exit(2);
}

console.log(`Checking ${targets.length} of ${keys.length} report pages against the pre-capture.`);
console.log(`Server: ${server.baseURL}  EHDP-data branch: ${servedBranch}\n`);

let failures = 0;
const ehdpSeen = new Set();

for (const key of targets) {

    const page = await browser.newPage();
    const expected = CAPTURE.reportPages[key];

    page.on('request', r => {
        if (r.url().includes('EHDP-data')) ehdpSeen.add(r.url());
    });

    const url = `${server.baseURL}neighborhood-reports/${key}/`;
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });

    // Wait for cards rather than a fixed delay. Not fatal if they never arrive — an
    // empty render has to be reported as a mismatch, not swallowed as a timeout
    await page
        .waitForFunction(() => document.querySelectorAll('.card-header[id$="-h"]').length > 0, null, { timeout: 45000 })
        .catch(() => {});

    const actual = await page.evaluate(extractReport);
    const finalURL = page.url();

    const problems = comparePage(key, expected, actual);

    // A silent redirect to the 404 page would otherwise look like "nothing rendered"
    if (!finalURL.endsWith(`/neighborhood-reports/${key}/`)) {
        problems.unshift(`final URL moved: ${finalURL}`);
    }

    if (problems.length) {
        failures++;
        console.log(`FAIL  ${key}`);
        problems.forEach(p => console.log(`      ${p}`));
    } else {
        console.log(`ok    ${key}  (${actual.indicators.length} indicators)`);
    }

    await page.close();

}

await browser.close();
await server.stop();

// The report/viz JSON paths are the substantive "is it reading the same data" check;
// geography TopoJSON is fetched by both and is not per-page
const dataUrls = [...ehdpSeen].filter(u => u.includes('/neighborhood-reports/data/')).sort();
console.log(`\nEHDP-data URLs requested: ${ehdpSeen.size} (${dataUrls.length} under /neighborhood-reports/data/)`);

console.log(failures ? `\nFAIL — ${failures} of ${targets.length} pages differ.` : `\nPASS — all ${targets.length} pages match the pre-capture.`);
process.exit(failures ? 1 : 0);
