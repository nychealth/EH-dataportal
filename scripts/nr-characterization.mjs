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
// Neighborhood selection goes through the sessionStorage bridge the SPA already
// supports (`nr_pending_neighborhood`, read during the SPA's startup),
// seeded via addInitScript so it is set before page scripts run. That is
// deterministic; clicking the Leaflet map is not, and would make the harness a
// test of map hit-detection rather than of report rendering.
//
// Usage (reuses a running dev server, or starts one — see dev-server.mjs):
//   npm run characterize:nr -- --baseline
//   npm run characterize:nr -- --check

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

const BASELINE_DIR = 'scripts/nr-characterization-baseline';
const CURRENT_DIR  = 'scripts/nr-characterization-current';

// Console noise that predates this harness and is not a regression signal.
// Pagefind is not built by `hugo server`, so PagefindUI is legitimately absent in
// dev; the rest is dev-only resource noise.
const KNOWN_NOISE = /pagefind|PagefindUI|favicon|Failed to load resource|net::ERR|frame-ancestors|docs\.google\.com/i;

// ----------------------------------------------------------------------- //
// capture
// ----------------------------------------------------------------------- //

// Collapses runs of whitespace so captures don't churn on template reindentation.
const tidy = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

// Reads the rendered state of one topic/neighborhood pair.
//
// Everything here is DOM-observable output a user could point at. The final URL
// is included deliberately: NR routing is path-based with a sessionStorage
// bridge, and a silent redirect to the 404 page is exactly the failure this
// branch is prone to (site-wide audit §5i) — capturing the landing URL means a
// regression shows up as a diff instead of as an empty-looking report.
const captureTarget = async (browser, target, baseURL) => {

    const page = await browser.newPage();
    const consoleErrors = [];

    // Seed the bridge before any page script runs, exactly as the landing page
    // and the 404 interceptor do.
    //
    // addInitScript runs in EVERY frame, and the header's Google Forms iframe is
    // sandboxed without allow-same-origin, so touching sessionStorage there
    // throws a SecurityError that surfaces as a page-level error and pollutes the
    // capture. Only the top frame needs the value.
    await page.addInitScript((slug) => {
        if (window.top !== window.self) return;
        try {
            sessionStorage.setItem('nr_pending_neighborhood', slug);
        } catch {
            // Storage unavailable in this context; the SPA falls back to its
            // path-based selection, which is what we want to characterize anyway.
        }
    }, target.neighborhood);

    page.on('console', (msg) => {
        if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        if (!KNOWN_NOISE.test(err.message)) consoleErrors.push(`pageerror: ${err.message}`);
    });

    const url = `${baseURL}neighborhood-reports/${target.topic}/`;

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

    // Let any Vega embeds finish painting after the header lands.
    await page.waitForTimeout(1500);

    const captured = await page.evaluate(() => {

        const textOf = (id) => document.getElementById(id)?.textContent ?? null;

        // Indicator cards are built per section; count them and keep their ids so
        // a dropped section shows up as a count change with a name attached.
        // Scoped to the nr-acc- prefix: a bare `.collapse[id]` also matches site
        // chrome (the language menu, the primary nav), which would churn the
        // baseline on unrelated header edits.
        const accordions = [...document.querySelectorAll('[id^="nr-acc-"]')].map((el) => el.id).sort();

        // Vega writes role/aria-label onto the container regardless of renderer,
        // so container labels work whether charts paint to canvas or SVG.
        const charts = [...document.querySelectorAll('.vega-embed')].map((el) => ({
            ariaLabel: el.getAttribute('aria-label'),
            hasCanvas: !!el.querySelector('canvas'),
            hasSvg: !!el.querySelector('svg')
        }));

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
            charts,
            chartCount: charts.length,
            topicLinkCount: document.querySelectorAll('.nr-topic-link').length,
            mapPanes: document.querySelectorAll('#nr-map .leaflet-pane').length
        };

    });

    await page.close();

    return {
        ...captured,
        headerNeighborhood: tidy(captured.headerNeighborhood),
        mobileNeighborhood: tidy(captured.mobileNeighborhood),
        mobileTitle: tidy(captured.mobileTitle),
        reportHeader: tidy(captured.reportHeader),
        demographics: tidy(captured.demographics),
        zipList: tidy(captured.zipList),
        charts: captured.charts.map((c) => ({ ...c, ariaLabel: tidy(c.ariaLabel) })),
        consoleErrors
    };

};

// ----------------------------------------------------------------------- //
// baseline / check
// ----------------------------------------------------------------------- //

const fileFor = (dir, target) => join(dir, `${target.topic}__${target.neighborhood}.json`);

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

    const outDir = mode === 'baseline' ? BASELINE_DIR : CURRENT_DIR;

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const { baseURL, stop } = await ensureDevServer();
    const browser = await chromium.launch({ headless: true });

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

                const baselineFile = fileFor(BASELINE_DIR, target);

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
        console.log(`\nBaseline written to ${BASELINE_DIR}/ (${TARGETS.length} target(s)). Commit it.`);
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
