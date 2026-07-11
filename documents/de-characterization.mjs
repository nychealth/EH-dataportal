// ======================================================================= //
// de-characterization.mjs
// ======================================================================= //

// One-time characterization harness for the DE.* state-namespace refactor:
// captures rendered outputs (selected labels, Leaflet layer counts, Vega chart
// descriptions + mark counts, DataTables row counts) for a fixed set of
// indicators, so every migration stage can be diffed against a baseline.
// Dev-only tooling — not part of the Hugo build or the shipped bundle.
//
// IMPORTANT: this script must only read DOM output and window-scoped objects
// (window.$, window.myVegaView). It must never read the bare `let` globals it
// characterizes — their names change between stages, and the harness has to
// stay valid across the whole migration.
//
// Usage (dev server must already be running in another terminal):
//   hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080
//   node documents/de-characterization.mjs --baseline
//   node documents/de-characterization.mjs --check

import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// Match the address `hugo server` prints ("Web Server is available at ...").
// dev_stage keeps the /dev-stage/ path segment from its configured baseURL.
const BASE_URL = 'http://localhost:8080/dev-stage/';

// Indicators chosen to exercise every view: 2380 (asthma ED visits — map, bar,
// trend, links, AND disparities via the poverty-221 comparator), 2414 (asthma
// adult prevalence), 2023 (air quality — annual-average trend slices and
// comparison pills). Swap entries here if a view comes back uncovered.
const TARGETS = [
    { id: 2380, topic: 'asthma' },
    { id: 2414, topic: 'asthma' },
    { id: 2023, topic: 'air-quality' }
];

const BASELINE_DIR = 'documents/de-characterization-baseline';
const CURRENT_DIR = 'documents/de-characterization-current';

// Console noise that predates this refactor and is not a regression signal
// (Pagefind dev-asset 404s, resource-load failures from the dev basemap/CDN).
const KNOWN_NOISE = /pagefind|favicon|Failed to load resource|net::ERR/i;

// ----------------------------------------------------------------------- //
// capture helpers
// ----------------------------------------------------------------------- //

// This app's vegaEmbed() calls never set a `renderer` option, so vega-embed's
// default applies (node_modules/vega-embed: `const renderer = opts.renderer ??
// 'canvas'`) — every chart paints to a <canvas>, not an <svg>, so there is no
// DOM mark tree to query. Vega still writes role/aria-label onto the CONTAINER
// element regardless of renderer (vega's initializeAria calls
// `view.container().setAttribute(...)` unconditionally), so presence/ariaLabel
// below read the container directly. Mark counts need the live Vega View's own
// toSVG() export (a standard, renderer-independent Vega API) — but only bar.js
// and correlate.js happen to stash their view on `window` for their own resize
// interop, and trend.js/disparities.js discard theirs. Rather than leave two of
// five views permanently unmeasurable (or edit those app files just for this
// harness), installVegaViewCapture wraps the global vegaEmbed once per page so
// every embed's view is captured uniformly, regardless of which file calls it.
const installVegaViewCapture = (page) => page.addInitScript(() => {

    window.__deVegaViews = {};

    let realVegaEmbed;

    // A plain `global.vegaEmbed = factory(...)` assignment (vega-embed's UMD
    // footer) runs through this setter, so wrapping happens before any app
    // script can call the real function — no behavior change: the wrapper
    // calls straight through and returns the exact same promise.
    Object.defineProperty(window, 'vegaEmbed', {
        configurable: true,
        get: () => realVegaEmbed,
        set: (fn) => {
            realVegaEmbed = (el, spec, opts) => {
                const promise = fn(el, spec, opts);
                promise.then((result) => {
                    const container = typeof el === 'string' ? document.querySelector(el) : el;
                    if (container?.id) {
                        window.__deVegaViews[container.id] = result.view;
                    }
                }).catch(() => {});
                return promise;
            };
        }
    });

});


// Captures a Vega chart's accessible description and mark count. markCount is
// null (never 0) when no view was captured for this container, so a genuinely
// blank chart is never confused with an unmeasured one.
const captureVega = async (page, containerSelector) => {

    const containerId = containerSelector.replace('#', '');

    const base = await page.evaluate((sel) => {

        const container = document.querySelector(sel);
        const rendered = container?.querySelector('canvas, svg');

        if (!container || !rendered) {
            return { present: false, ariaLabel: '' };
        }

        return { present: true, ariaLabel: container.getAttribute('aria-label') || '' };

    }, containerSelector);

    if (!base.present) {
        return { ...base, markCount: null };
    }

    const markCount = await page.evaluate(async (id) => {

        const view = window.__deVegaViews[id];

        if (!view) {
            return null;
        }

        // toSVG() is renderer-independent — it works even though the view's
        // live renderer is canvas — and produces the same role-mark structure
        // an svg-rendered chart would have had, so mark counts stay comparable.
        const svgString = await view.toSVG();
        const svgDoc = new DOMParser().parseFromString(svgString, 'image/svg+xml');

        return svgDoc.querySelectorAll('g[class*="role-mark"] > *').length;

    }, containerId);

    return { ...base, markCount };

};


// Clicks an overlay tab (skipping disabled ones) and waits for its pane to be ready.
const clickTabAndWait = async (page, tabSelector, readyPredicate) => {

    const disabled = await page.$eval(tabSelector, el => el.classList.contains('disabled'));

    if (disabled) {
        return false;
    }

    await page.click(tabSelector);
    await page.waitForFunction(readyPredicate, null, { timeout: 60000 });

    // Let Vega/DataTables settle after their async embed/init.
    await page.waitForTimeout(750);

    return true;

};


// ----------------------------------------------------------------------- //
// per-indicator capture
// ----------------------------------------------------------------------- //

// Loads one indicator page and walks map → bar → trend → links/disparities → table,
// capturing rendered output at each step. Table goes last on purpose: it is the
// heaviest init and mirrors the app's own map-before-table scheduling.
const captureIndicator = async (browser, target) => {

    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consoleErrors = [];

    page.on('pageerror', err => consoleErrors.push(String(err)));
    page.on('console', msg => {
        if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) {
            consoleErrors.push(msg.text());
        }
    });

    // Must be installed before goto() — see captureVega's comment above.
    await installVegaViewCapture(page);

    const url = `${BASE_URL}data-explorer/${target.topic}/?id=${target.id}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ----- initial load: wait for the choropleth/bubble layer to paint ----- //

    await page.waitForFunction(
        () => document.querySelectorAll('#map .leaflet-overlay-pane path.leaflet-interactive').length > 0,
        null,
        { timeout: 60000 }
    );
    await page.waitForTimeout(750);

    const labels = await page.evaluate(() => ({
        measure: document.querySelector('.measure-name')?.textContent.trim() || '',
        geo: document.querySelector('.geo-name')?.textContent.trim() || '',
        time: document.querySelector('.time-name')?.textContent.trim() || ''
    }));

    const map = await page.evaluate(() => ({
        interactivePathCount: document.querySelectorAll('#map .leaflet-overlay-pane path.leaflet-interactive').length,
        legendMin: document.getElementById('minVal')?.textContent.trim() || '',
        legendMax: document.getElementById('maxVal')?.textContent.trim() || '',
        legendAria: document.getElementById('viridisRect')?.getAttribute('aria-label') || ''
    }));

    // ----- bar tab ----- //

    let bar = { present: false, ariaLabel: '', markCount: null };

    // Ready check looks for a rendered canvas OR svg — this app's charts render
    // to canvas by default (see captureVega's comment above), but checking both
    // keeps this working if a chart's renderer option ever changes.
    if (await clickTabAndWait(page, '#v-pills-bar-tab', () => !!document.querySelector('#barHolder canvas, #barHolder svg'))) {
        bar = await captureVega(page, '#barHolder');
    }

    // ----- trend tab (borough mode, then first comparison pill if any) ----- //

    let trend = { present: false, ariaLabel: '', markCount: null, notes: '' };
    let trendComparison = null;

    const trendReady = () => !!document.querySelector('#trend canvas, #trend svg')
        || /not available/i.test(document.getElementById('trend')?.textContent || '');

    if (await clickTabAndWait(page, '#v-pills-trends-tab', trendReady)) {

        trend = {
            ...(await captureVega(page, '#trend')),
            notes: await page.evaluate(() => document.getElementById('trend-unreliability')?.textContent.trim() || '')
        };

        const comparisonPill = await page.evaluate(() => {
            const pill = document.querySelector('#trendComparisonPills .trendmode-button');
            return pill && !pill.classList.contains('disabled') ? pill.textContent.trim() : null;
        });

        if (comparisonPill) {
            await page.click('#trendComparisonPills .trendmode-button');
            await page.waitForTimeout(2000);
            trendComparison = {
                pillLabel: comparisonPill,
                ...(await captureVega(page, '#trend'))
            };
        }

    }

    // ----- links tab (correlate, then disparities if the toggle is enabled) ----- //

    let links = { present: false, ariaLabel: '', markCount: null, viewNote: '' };
    let disparities = null;

    const linksReady = () => !!document.querySelector('#links canvas, #links svg') || !!document.querySelector('#links .alert');

    if (await clickTabAndWait(page, '#v-pills-correlate-tab', linksReady)) {

        links = {
            ...(await captureVega(page, '#links')),
            viewNote: await page.evaluate(() => document.getElementById('linksViewNote')?.textContent.trim() || '')
        };

        const disparitiesEnabled = await page.evaluate(() => {
            const btn = document.getElementById('show-disparities');
            return !!btn && !btn.disabled && !btn.classList.contains('disabled') && !btn.classList.contains('active');
        });

        if (disparitiesEnabled) {

            await page.click('#show-disparities');

            // The disparities description always ends "and poverty scatterplot";
            // fall through on timeout so both baseline and check settle identically.
            // (aria-label lives on the #links container itself — see captureVega's
            // comment above on why there's no inner svg to read it from.)
            try {
                await page.waitForFunction(
                    () => (document.querySelector('#links')?.getAttribute('aria-label') || '').includes('poverty scatterplot'),
                    null,
                    { timeout: 20000 }
                );
            } catch {
                // aria-label may be absent; capture whatever rendered after the wait
            }

            await page.waitForTimeout(750);
            disparities = await captureVega(page, '#links');

        }

    }

    // ----- table tab (last: heaviest init) ----- //

    let table = { present: false, rowCount: 0, totalRowCount: 0, columnCount: 0, filterSummary: '' };

    // NOTE the lowercase `dataTable` — $.fn.dataTable.isDataTable, per CLAUDE.md.
    const tableReady = () => window.$ && window.$.fn && window.$.fn.dataTable
        && window.$.fn.dataTable.isDataTable('#tableID');

    if (await clickTabAndWait(page, '#v-pills-table-tab', tableReady)) {
        table = await page.evaluate(() => {
            const dt = window.$('#tableID').DataTable();
            return {
                present: true,
                rowCount: dt.rows({ search: 'applied' }).count(),
                totalRowCount: dt.rows().count(),
                columnCount: dt.columns().count(),
                filterSummary: document.getElementById('tableFilterSummary')?.textContent.trim() || ''
            };
        });
    }

    await page.close();

    return {
        target,
        labels,
        map,
        bar,
        trend,
        trendComparison,
        links,
        disparities,
        table,
        consoleErrors
    };

};


// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

// Captures every target into the mode's output directory; --check then diffs
// against the committed baseline and fails the process on any difference.
const main = async () => {

    const mode = process.argv.includes('--baseline') ? 'baseline' : 'check';
    const outDir = mode === 'baseline' ? BASELINE_DIR : CURRENT_DIR;

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });

    for (const target of TARGETS) {
        console.log(`Capturing indicator ${target.id} (${target.topic}) ...`);
        const result = await captureIndicator(browser, target);
        writeFileSync(`${outDir}/${target.id}.json`, JSON.stringify(result, null, 4) + '\n');
    }

    await browser.close();

    if (mode === 'check') {
        try {
            execSync(`git diff --no-index --exit-code ${BASELINE_DIR} ${CURRENT_DIR}`, { stdio: 'inherit' });
            console.log('\nCharacterization check PASSED — output matches baseline.');
        } catch {
            console.error('\nCharacterization check FAILED — differences shown above.');
            process.exitCode = 1;
        }
    } else {
        console.log(`\nBaseline written to ${BASELINE_DIR}/ — commit it.`);
    }

};

main();
