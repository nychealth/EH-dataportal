// ======================================================================= //
// nr-characterization.mjs
// ======================================================================= //

// Characterization harness for the Phase 2 Neighborhood Reports topic SPA
// (assets/js/nr-topic-spa/ + layouts/neighborhood-reports/nr-topic-spa.html):
// captures the rendered output for a fixed set of topic/neighborhood pairs so a
// refactor can be diffed against a committed baseline.
//
// The DE harness (de-characterization.mjs) does not cover any of this — it drives
// the data explorer's tabs and does not work on this branch at all. The NR topic
// SPA is what actually changes here, and until now had no regression net.
//
// IMPORTANT: this reads only DOM output. It must never read the SPA's internal
// names. They are now reachable — the `bootstrap()` closure was unwrapped to module
// scope, and the file was split into ten — so the rule no longer enforces itself.
// It is what keeps the harness valid across a refactor that renames things.
//
// It navigates straight to the real <nbhd>/<topic>/ page. Until the Option D swap
// those pages did not exist, so the harness reached the SPA at the clean topic URL
// and injected the neighborhood through the `nr_pending_neighborhood`
// sessionStorage bridge — which meant it exercised the bridge and never the
// path-based resolution it appeared to cover (scoping memo §11, step 3). Now the
// server supplies the neighborhood and the harness reads what a real visitor gets.
// Clicking the Leaflet map is still avoided: it would make this a test of map
// hit-detection rather than of report rendering.
//
// One accordion panel is expanded per target, because charts render lazily and a
// harness that never expands one leaves the entire Vega path uncovered — which is
// how a canvas→SVG renderer switch passed a full green run in 2026-08-06. The
// first panel is chosen rather than a named indicator so the harness stays
// independent of which indicators EHDP-data currently ships.
//
// What is asserted about the chart is deliberately structural — the renderer in
// use, and whether each mark group painted — not the number of marks, which tracks
// the row counts in EHDP-data and would churn the baseline on every data refresh.
//
// Baselines are filed per EHDP-data branch, under nr-characterization-baseline/<branch>/,
// and the branch is read off the running server rather than passed in. A server serving a
// branch with no baseline is told so; it is never checked against another branch's.
//
// Usage (reuses a running dev server, or starts one — see dev-server.mjs):
//   npm run characterize:nr -- --baseline
//   npm run characterize:nr -- --check
//
// PowerShell eats the `--`, so call node directly there:
//   node scripts/nr-characterization.mjs --check

import { chromium } from 'playwright';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDevServer } from './dev-server.mjs';

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// Topic/neighborhood pairs chosen to exercise the variation that actually
// exists: two topics against one shared neighborhood (isolates topic-driven
// content), and one topic against two neighborhoods (isolates neighborhood-driven
// content). Slugs match the `url:` frontmatter on the topic content files and the
// lowercased content directory names.
const TARGETS = [
    { topic: 'asthma_and_the_environment', neighborhood: 'bayside_little_neck' },
    { topic: 'asthma_and_the_environment', neighborhood: 'east_new_york' },
    { topic: 'climate_and_health',         neighborhood: 'bayside_little_neck' }
];

// Baselines are filed by EHDP-data branch, not by Hugo environment. The branches differ
// in row counts — staging carries an Indoor Air topic production does not — so a
// production-data server checked against a staging baseline reports content regressions
// that are nothing of the kind (the same confusion read as 210 of them in
// nr-postswap-check.mjs). Environments sharing a branch share a baseline, and since
// finalURL is now prefix-relative that is the whole condition: staging covers dev_stage,
// local_stage and prod_stage; production covers dev_prod, development, local_prod,
// prod_prod and production.
const BASELINE_ROOT = 'scripts/nr-characterization-baseline';
const CURRENT_ROOT  = 'scripts/nr-characterization-current';

// Console noise that predates this harness and is not a regression signal.
// Pagefind is not built by `hugo server`, so PagefindUI is legitimately absent in
// dev; the rest is dev-only resource noise.
const KNOWN_NOISE = /pagefind|PagefindUI|favicon|Failed to load resource|net::ERR|frame-ancestors|docs\.google\.com/i;

// ----------------------------------------------------------------------- //
// capture
// ----------------------------------------------------------------------- //

// Collapses runs of whitespace so captures don't churn on template reindentation.
const tidy = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

// Drops the environment's baseURL path prefix from a captured pathname, so one baseline
// checks from any environment serving the same data branch. Measured 2026-08-15: a
// prod_stage server (/IndicatorPublic/) against the dev_stage-captured staging baseline
// failed all 3 targets, with finalURL the only differing field on any of them — the
// reports themselves were byte-identical, because the branch is what decides those.
//
// Anchored to the start rather than a global replace. This field exists to catch a silent
// redirect to the 404 page, which is a change AFTER the prefix; stripping every occurrence
// would also eat a prefix-shaped segment deeper in the path, which is the one way this
// normalization could hide the thing it is guarding.
const stripBasePath = (pathname, baseURL) => {
    const prefix = new URL(baseURL).pathname.replace(/\/$/, '');
    if (!prefix || !pathname.startsWith(`${prefix}/`)) return pathname;
    return pathname.slice(prefix.length);
};

// Reads the rendered state of one topic/neighborhood pair.
//
// Everything here is DOM-observable output a user could point at. The final URL
// is included deliberately: NR routing is path-based with a sessionStorage
// bridge, and a silent redirect to the 404 page is exactly the failure this
// branch is prone to (site-wide audit §5i) — capturing the landing URL means a
// regression shows up as a diff instead of as an empty-looking report. It is
// recorded prefix-relative (see stripBasePath), so the environment a capture came
// from no longer decides whether the check passes.
const captureTarget = async (browser, target, baseURL) => {

    const page = await browser.newPage();
    const consoleErrors = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        if (!KNOWN_NOISE.test(err.message)) consoleErrors.push(`pageerror: ${err.message}`);
    });

    const url = `${baseURL}neighborhood-reports/${target.neighborhood}/${target.topic}/`;

    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // The SPA fetches its report JSON and renders asynchronously. Wait for the
    // neighborhood header to be filled rather than for a fixed delay — but do not
    // throw if it never fills, because "nothing rendered" is itself a result the
    // baseline should record rather than an error that aborts the run.
    await page
        .waitForFunction(() => {
            const el = document.getElementById('nr-header-neighborhood');
            return el && el.textContent.trim().length > 0;
        }, { timeout: 20000 })
        .catch(() => {});

    // ----- expand the first panel so the lazy chart path runs ----- //

    // onAccordionExpand renders on the `shown.bs.collapse` event, so the chart
    // only exists after a real expand. Failing soft here matches the header wait
    // above: a panel that never opens is a result worth recording, not a crash.
    const firstPanel = page.locator('#nr-acc-1-h button');

    if (await firstPanel.count()) {
        await firstPanel.click().catch(() => {});
    }

    // Wait for Vega to paint rather than for a fixed delay. The chart fetches two
    // topojson files from EHDP-data at render time, so this is the slowest step in
    // the capture — the harness already depends on that host for the report and viz
    // JSON, so this adds requests, not a new dependency.
    await page
        .waitForFunction(() => {
            const embed = document.querySelector('.vega-embed');
            return !!embed && (embed.querySelector('svg.marks') || embed.querySelector('canvas'));
        }, { timeout: 30000 })
        .catch(() => {});

    // Let any remaining embeds settle after the first one paints.
    await page.waitForTimeout(1500);

    const captured = await page.evaluate(() => {

        const textOf = (id) => document.getElementById(id)?.textContent ?? null;

        // Indicator cards are built per section; count them and keep their ids so
        // a dropped section shows up as a count change with a name attached.
        // Scoped to the nr-acc- prefix: a bare `.collapse[id]` also matches site
        // chrome (the language menu, the primary nav), which would churn the
        // baseline on unrelated header edits.
        const accordions = [...document.querySelectorAll('[id^="nr-acc-"]')].map((el) => el.id).sort();

        // chartName reads the node that actually carries the name. `.vega-embed`
        // itself has NO aria-label — it was read here until 2026-08-11 and captured
        // an empty string in every baseline, so the field proved nothing and the
        // chart naming added in the a11y Stage B work went uncovered. The spec's
        // `description` lands on vega-embed's inner .chart-wrapper, which carries
        // role="graphics-document" [verified 2026-08-11 in Chrome: the wrapper reads
        // "Asthma ED visits (adults) across all NYC neighborhoods", the embed and
        // svg.marks read null]. Selected by role rather than by class because the
        // role is the thing assistive tech navigates by; a class rename in
        // vega-embed would be cosmetic, a role change would be the regression.
        //
        // actionsLabel covers the export menu's <summary>, which is labelled from a
        // .then() after vegaEmbed resolves — a promise that silently stops running
        // would otherwise leave no trace here.
        //
        // hasCanvas/hasSvg pin the renderer: chart.js passes renderer: 'svg', and a
        // silent revert to vega-embed's canvas default would otherwise be invisible
        // here. `svg.marks` is the scenegraph specifically — a bare `svg` also
        // matches the action menu's own icon, which is present either way.
        //
        // markGroups records that each half of the vconcat painted, keyed by Vega's
        // own group class (mark-shape/mark-rect + concat index). Membership and a
        // painted flag are stable across EHDP-data refreshes; child counts are not.
        const charts = [...document.querySelectorAll('.vega-embed')].map((el) => {

            const marks = el.querySelector('svg.marks');

            return {
                chartName: el.querySelector('[role="graphics-document"]')?.getAttribute('aria-label') ?? null,
                actionsLabel: el.querySelector('details > summary')?.getAttribute('aria-label') ?? null,
                hasCanvas: !!el.querySelector('canvas'),
                hasSvg: !!marks,
                markGroups: marks
                    ? [...marks.querySelectorAll('g[class*="role-mark"]')]
                        .map((g) => ({ cls: g.getAttribute('class'), painted: g.children.length > 0 }))
                        .sort((a, b) => a.cls.localeCompare(b.cls))
                    : []
            };

        });

        return {
            finalURL: window.location.pathname,
            headerNeighborhood: textOf('nr-header-neighborhood'),
            mobileNeighborhood: textOf('nr-mobile-neighborhood'),
            mobileTitle: textOf('nr-mobile-title'),
            reportHeader: textOf('nr-report-header'),
            demographics: textOf('nr-demographics'),
            zipList: textOf('nr-zip-list'),
            accordionIds: accordions,
            accordionCount: accordions.length,
            // Distinguishes "the panel opened and drew nothing" from "the click
            // never landed", which look identical in an empty charts array.
            expandedPanel: document.querySelector('#nr-acc-1-c.show') ? 'nr-acc-1-c' : null,
            charts,
            chartCount: charts.length,
            topicLinkCount: document.querySelectorAll('.nr-topic-link').length,
            mapPanes: document.querySelectorAll('#nr-map .leaflet-pane').length
        };

    });

    await page.close();

    return {
        ...captured,
        finalURL: stripBasePath(captured.finalURL, baseURL),
        headerNeighborhood: tidy(captured.headerNeighborhood),
        mobileNeighborhood: tidy(captured.mobileNeighborhood),
        mobileTitle: tidy(captured.mobileTitle),
        reportHeader: tidy(captured.reportHeader),
        demographics: tidy(captured.demographics),
        zipList: tidy(captured.zipList),
        // Whitespace-normalized like the rest, but null is preserved rather than
        // collapsed to "": tidy() turning a missing attribute into an empty string is
        // what made the old .vega-embed read look like a captured value for three
        // baselines. An absent name must be visibly absent.
        charts: captured.charts.map((c) => ({
            ...c,
            chartName: c.chartName === null ? null : tidy(c.chartName),
            actionsLabel: c.actionsLabel === null ? null : tidy(c.actionsLabel)
        })),
        consoleErrors
    };

};

// ----------------------------------------------------------------------- //
// baseline / check
// ----------------------------------------------------------------------- //

const fileFor = (dir, target) => join(dir, `${target.topic}__${target.neighborhood}.json`);

// Which EHDP-data branch the running server is serving, or null if it could not be read.
//
// head.html declares `data_branch` as a top-level `let`, so it is reachable from an
// evaluate() but is NOT a window property — `window.data_branch` reads undefined. Same
// mechanism and same reason as the gate in nr-postswap-check.mjs; read from the page
// rather than from a flag because a flag can be wrong and --baseline cannot fail, so a
// mislabelled capture would install itself silently as the wrong reference.
const readServedBranch = async (browser, baseURL) => {

    const page = await browser.newPage();

    try {
        await page.goto(`${baseURL}neighborhood-reports/`, { waitUntil: 'load', timeout: 45000 });
        return await page.evaluate(() => (typeof data_branch === 'undefined' ? null : data_branch));
    } catch {
        return null;
    } finally {
        await page.close();
    }

};

// Reports the field-level differences between two captures.
const diff = (baseline, current) => {

    const changes = [];
    const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();

    for (const key of keys) {
        const a = JSON.stringify(baseline[key]);
        const b = JSON.stringify(current[key]);
        if (a !== b) changes.push(`      ${key}:\n        baseline: ${a}\n        current:  ${b}`);
    }

    return changes;

};

const main = async () => {

    const mode = process.argv.includes('--baseline') ? 'baseline'
        : process.argv.includes('--check') ? 'check'
            : null;

    if (!mode) {
        console.error('Usage: npm run characterize:nr -- --baseline | --check');
        process.exitCode = 1;
        return;
    }

    const { baseURL, stop } = await ensureDevServer();
    const browser = await chromium.launch({ headless: true });

    // ----- data-branch gate ----- //

    // Everything below is filed under the served branch, so this has to resolve before a
    // single target is captured. An unreadable branch aborts rather than defaulting: a
    // default would file the capture somewhere plausible and wrong.
    const branch = await readServedBranch(browser, baseURL);

    if (!branch) {
        await browser.close();
        await stop();
        console.error(
            `\nREFUSING TO RUN — could not read the served EHDP-data branch from ${baseURL}.\n` +
            `Captures are filed per branch, so there is nowhere correct to put this one. ` +
            `Check that the server is up and that head.html still declares data_branch.`
        );
        process.exitCode = 2;
        return;
    }

    const baselineDir = join(BASELINE_ROOT, branch);
    const outDir = mode === 'baseline' ? baselineDir : join(CURRENT_ROOT, branch);

    // Scoped to this branch's directory: clearing the root would delete the other
    // branch's baseline as a side effect of re-capturing this one.
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    if (mode === 'check' && !existsSync(baselineDir)) {
        await browser.close();
        await stop();
        console.error(
            `\nNO BASELINE for EHDP-data branch "${branch}" (looked in ${baselineDir}/).\n` +
            `Run --baseline against this server first, or point DE_BASE_URL at a server ` +
            `serving a branch that has one.`
        );
        process.exitCode = 1;
        return;
    }

    console.log(`Server: ${baseURL}  EHDP-data branch: ${branch}\n`);

    let failures = 0;

    try {

        for (const target of TARGETS) {

            const label = `${target.topic} / ${target.neighborhood}`;
            console.log(`Capturing ${label} ...`);

            const captured = await captureTarget(browser, target, baseURL);

            writeFileSync(fileFor(outDir, target), `${JSON.stringify(captured, null, 2)}\n`);

            if (captured.consoleErrors.length) {
                console.error(`  console errors on ${label}:`);
                for (const e of captured.consoleErrors) console.error(`    ${e}`);
            }

            if (mode === 'check') {

                const baselineFile = fileFor(baselineDir, target);

                if (!existsSync(baselineFile)) {
                    console.error(`  NO BASELINE for ${label} — run --baseline first.`);
                    failures++;
                    continue;
                }

                const changes = diff(JSON.parse(readFileSync(baselineFile, 'utf8')), captured);

                if (changes.length) {
                    console.error(`  DIFF ${label}`);
                    for (const c of changes) console.error(c);
                    failures++;
                } else {
                    console.log(`  ok ${label}`);
                }

            }

        }

    } finally {
        await browser.close();
        await stop();
    }

    if (mode === 'baseline') {
        console.log(`\nBaseline written to ${baselineDir}/ (${TARGETS.length} target(s)). Commit it.`);
        return;
    }

    if (failures) {
        console.error(`\nNR characterization FAILED — ${failures} of ${TARGETS.length} target(s) differ.`);
        process.exitCode = 1;
    } else {
        console.log(`\nNR characterization PASSED — ${TARGETS.length} target(s) match baseline.`);
    }

};

main();
