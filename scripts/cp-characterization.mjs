// ======================================================================= //
// cp-characterization.mjs
// ======================================================================= //

// Characterization harness for the congestion pricing report's chart sizing.
// Every chart on that page computes its own panel geometry, because
// Vega-Lite's width:"container" only applies to single and layered views — so
// the thing worth pinning is the relationship between a container's width and
// what actually rendered inside it, across a width x site matrix.
// Dev-only tooling — not part of the Hugo build or the shipped bundle.
//
// Records, per rendered chart: container width, rendered svg width, the
// resulting overflow, the geometry the spec asked for (columns, panel width,
// wrapped title lines), and how many times vegaEmbed was called. That last
// count is load-bearing: embedFitted() deliberately renders a second time when
// a chart overflows, so a change from 1 to 2 is a real behavior change even
// when the final pixels are identical.
//
// Also counts requests for the shared post-period CSV. Both the AQ change
// chart and the CI explainer read it, and a spec that names a URL is re-fetched
// on every embed, so this number silently tracked the render count until the
// data was hoisted into a shared load. One request per page load is correct.
//
// Usage:
//   node scripts/cp-characterization.mjs --baseline   # write + commit
//   node scripts/cp-characterization.mjs --check      # diff against baseline
//
// Point it at a running dev server with CP_BASE_URL if yours differs:
//   hugo server --environment local_stage -p 8080
//
// NOTE: the sibling DE/NR harnesses import ensureDevServer() from
// ./dev-server.mjs to start a server on demand. That file is not on this
// branch; switch this script over to it once they land together.

import { chromium } from "playwright";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const BASE_URL = process.env.CP_BASE_URL
    || "http://127.0.0.1:8080/local-stage/data-features/congestion-pricing-report/";

const BASELINE_DIR = "scripts/cp-characterization-baseline";
const CURRENT_DIR = "scripts/cp-characterization-current";

// The shared CSV whose request count this harness watches (see file header).
const SHARED_CSV = "AQ_Post.csv";

// 768 is the selector's <select>/button swap; 576 is Bootstrap's sm, where
// every chart reflows to fewer columns. Widths bracket both boundaries.
const WIDTHS = [1200, 900, 700, 560, 420, 360];

const EJ_SITES = [
    "CRZ", "Major Deegan", "Cross Bronx", "BQE", "SI Expwy",
    "FDR", "Trans-Manhattan", "Van Wyck", "Rest of the city"
];

const TOD_SITES = [
    "Major Deegan", "Cross Bronx", "BQE", "SI Expwy",
    "FDR", "Trans-Manhattan", "Van Wyck"
];

// Console noise that predates this harness and is not a regression signal:
// the dev server serves Pagefind's assets as text/plain, and Vega warns about
// a "nice" scale conflict authored into the CI explainer.
const KNOWN_NOISE = /pagefind|favicon|Failed to load resource|net::ERR|Conflicting scale property/i;

// ----------------------------------------------------------------------- //
// in-page capture hook
// ----------------------------------------------------------------------- //

// Wraps vegaEmbed before any app script can call it, and records the geometry
// each spec asked for alongside what rendered. Installed via addInitScript so
// the property setter below intercepts vega-embed's own UMD assignment.

// Reads the requested panel geometry out of whichever shape a spec uses — a
// plain facet, an hconcat of facets, or a vconcat of single views.
const INIT = () => {

    window.__cpCaptures = [];

    const paneWidth = (spec) => {
        if (spec.spec?.width != null) return spec.spec.width;
        if (Array.isArray(spec.hconcat)) return spec.hconcat[0]?.spec?.width ?? spec.hconcat[0]?.width ?? null;
        if (Array.isArray(spec.vconcat)) return spec.vconcat[0]?.width ?? null;
        return null;
    };

    const titleLines = (spec) => {
        const text = spec.title?.text;
        if (text == null) return 0;
        return Array.isArray(text) ? text.length : 1;
    };

    let real;

    const wrapper = function (el, spec) {

        const node = typeof el === "string" ? document.querySelector(el) : el;
        const id = (node && node.id) || String(el);

        // Snapshot the requested geometry now — vegaEmbed mutates the spec.
        const requested = {
            columns: spec.columns ?? null,
            spacing: spec.spacing ?? null,
            paneW: paneWidth(spec),
            titleLines: titleLines(spec)
        };

        return Promise.resolve(real.apply(this, arguments)).then((res) => {

            const svg = node && node.querySelector("svg");
            const containerW = node ? node.clientWidth : null;
            const svgW = svg ? Math.round(svg.getBoundingClientRect().width) : null;

            window.__cpCaptures.push({
                id,
                ...requested,
                containerW,
                svgW,
                overflow: (svgW != null && containerW != null) ? svgW - containerW : null
            });

            return res;
        });
    };

    // vega-embed's UMD footer assigns global.vegaEmbed; this setter wraps it
    // at that moment, so no app script ever sees the unwrapped function.
    Object.defineProperty(window, "vegaEmbed", {
        configurable: true,
        get() { return real ? wrapper : undefined; },
        set(fn) { real = fn; }
    });
};

// ----------------------------------------------------------------------- //
// capture helpers
// ----------------------------------------------------------------------- //

// Waits until no further embeds land. Renders are debounced and a re-fit adds
// a second embed, so a fixed sleep would race the very behavior being recorded.
async function settle(page) {

    let prev = -1;

    for (let i = 0; i < 30; i++) {
        const n = await page.evaluate(() => window.__cpCaptures.length);
        if (n === prev) return;
        prev = n;
        await page.waitForTimeout(350);
    }
}

// Takes the captures accumulated since the last drain.
function drain(page) {
    return page.evaluate(() => {
        const captures = window.__cpCaptures;
        window.__cpCaptures = [];
        return captures;
    });
}

// The site picker is a native <select> on mobile and a button group above it.
function pick(page, wrapId, idPrefix, site, width) {
    return width < 768
        ? page.selectOption(`#${wrapId} select`, site)
        : page.click(`#${idPrefix}${site.replaceAll(" ", "-")}`);
}

// Captures one viewport width: initial load, then every EJ and TOD site.
async function captureWidth(browser, width) {

    const rows = [];
    const consoleErrors = [];
    let sharedCsvRequests = 0;

    const context = await browser.newContext({ viewport: { width, height: 1000 } });

    await context.addInitScript(INIT);

    const page = await context.newPage();

    page.on("request", (req) => {
        if (req.url().includes(SHARED_CSV)) sharedCsvRequests++;
    });

    // The noise filter has to cover pageerror as well as console: the dev
    // server serves Pagefind's script as text/plain, so the failure surfaces as
    // an uncaught ReferenceError rather than a console message. Filtering both
    // leaves this list empty on a healthy page, so any entry is a real signal.

    const record = (text) => {
        if (!KNOWN_NOISE.test(text)) consoleErrors.push(text);
    };

    page.on("pageerror", (err) => record(String(err)));
    page.on("console", (msg) => {
        if (msg.type() === "error") record(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);

    for (const capture of await drain(page)) {
        rows.push({ phase: "load", site: null, ...capture });
    }

    // Embed counts per site switch are recorded alongside the captures: a site
    // that starts re-fitting when it previously did not is a regression even
    // if its rendered width is unchanged.

    for (const site of EJ_SITES) {
        await pick(page, "cpSiteButtons", "", site, width);
        await settle(page);
        const got = await drain(page);
        for (const capture of got) rows.push({ phase: "ej", site, ...capture });
        rows.push({ phase: "ej-embeds", site, id: "__count", n: got.length });
    }

    for (const site of TOD_SITES) {
        await pick(page, "todSiteButtons", "tod-", site, width);
        await settle(page);
        const got = await drain(page);
        for (const capture of got) rows.push({ phase: "tod", site, ...capture });
        rows.push({ phase: "tod-embeds", site, id: "__count", n: got.length });
    }

    await context.close();

    return { width, sharedCsvRequests, rows, consoleErrors };
}

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

// Captures every width into the mode's output directory; --check then diffs
// against the committed baseline and fails the process on any difference.
async function main() {

    const mode = process.argv.includes("--baseline") ? "baseline" : "check";
    const outDir = mode === "baseline" ? BASELINE_DIR : CURRENT_DIR;

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });

    try {

        for (const width of WIDTHS) {
            const result = await captureWidth(browser, width);
            writeFileSync(`${outDir}/${width}.json`, JSON.stringify(result, null, 4) + "\n");
            console.log(`width ${width}: ${result.rows.length} rows, `
                + `${result.sharedCsvRequests} ${SHARED_CSV} request(s), `
                + `${result.consoleErrors.length} console error(s)`);
        }

    } finally {
        await browser.close();
    }

    if (mode === "check") {
        try {
            execSync(`git diff --no-index --exit-code ${BASELINE_DIR} ${CURRENT_DIR}`, { stdio: "inherit" });
            console.log("\nCharacterization check PASSED — output matches baseline.");
        } catch {
            console.error("\nCharacterization check FAILED — differences shown above.");
            process.exitCode = 1;
        }
    } else {
        console.log(`\nBaseline written to ${BASELINE_DIR}/ — commit it.`);
    }
}

main();
