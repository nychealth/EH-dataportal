// ======================================================================= //
// site-characterization.mjs
// ======================================================================= //

// Breadth-first characterization harness: every page the site serves, loaded
// once, with its rendered structure recorded so a template, asset or SCSS
// change can be diffed against a committed baseline.
// Dev-only tooling — not part of the Hugo build or the shipped bundle.
//
// It is the orthogonal axis to the depth-first harnesses (cp-characterization
// here, and de-/nr-/pagefind-characterization on feature branches): those drive
// a handful of pages through interactions, this loads every page once and
// touches nothing. Neither covers the other.
//
// It is also what smoke-pages.mjs cannot be. Smoke fails on console errors, so
// it catches JS that throws and nothing else. A library that stopped loading
// because head.html's gating changed, a heading level that started skipping, an
// alt that vanished, a container that started overflowing the viewport — all of
// those leave the console silent and the build green.
//
// THE PROBES ARE APPROXIMATIONS ON PURPOSE. accessibleName() below is not the
// W3C accname algorithm and does not try to be. A characterization probe has to
// be *stable* and *sensitive to change*; it does not have to be correct in
// absolute terms, because every number it produces is only ever compared
// against itself. Read a count here as "this changed", never as "this is how
// many controls are unlabelled".
//
// Usage (Task 1 driver — baseline/check plumbing lands in Task 3):
//   node scripts/site-characterization.mjs --out scripts/tmp/run-a
//   node scripts/site-characterization.mjs --out scripts/tmp/run-b --all
//
// Plan and ledger: documents/site-characterization-plan-2026-08-23.md

import { chromium } from "playwright";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDevServer } from "./dev-server.mjs";
import { collectAllPaths, mapPool } from "./site-urls.mjs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// A fixed viewport, because overflowX and every zero-size probe are viewport
// relative. Changing this number invalidates the whole baseline, so it is a
// constant rather than a flag.
const VIEWPORT = { width: 1280, height: 900 };

const DEFAULT_CONCURRENCY = 6;

// Hosts whose requests are aborted before they can inject anything.
//
// This is not a general third-party block. Datawrapper, AirNow and forecast7
// stay reachable, because what they render is content this harness is meant to
// characterize — a Datawrapper embed that starts rendering at zero height is
// exactly the regression class smoke cannot see.
//
// These four are different: they inject DOM and nothing visible depends on
// them. The Google Translate widget appends a language <select>, five hidden
// inputs, two buttons, two images and a same-origin banner iframe, on Google's
// network timing rather than ours. Measured over the 41-page sample, that race
// moved 11 fields at once on 8 of 41 pages with a fixed 2.5s settle, and still
// on 5 of 41 after a DOM-quiescence wait was added — because the injection can
// begin after the DOM has already been quiet for three samples
// `[verified 2026-08-23: three sweeps, pairwise; a-vs-b was clean and a-vs-c
// was not, which is why two runs is not a sufficient test for a race]`.
//
// Blocking them costs one signal and keeps another. Lost: whether Google's
// widget still works at runtime, which is not this repo's to characterize.
// Kept: whether head.html still emits the <script> tag that loads it, since
// that tag is parser-inserted and appears in `assets` either way. It also makes
// the baseline independent of Google's uptime, which would otherwise churn it.
const BLOCKED_HOSTS = [
    "translate.google.com",
    "translate.googleapis.com",
    "www.gstatic.com",
    "www.googletagmanager.com",
];

// The Task 1 sample: smoke's own one-per-template-kind list, plus pages that
// list cannot cover. The sample exists to measure run-to-run churn cheaply —
// the full sweep is --all.
//
// The first four render from JS after fetching EHDP-data. The last four are
// Spanish and Simplified Chinese: without them `lang` is constant across the
// whole sample, which reads in a distinct-value sweep exactly like a probe that
// is reading nothing.
const SAMPLE_EXTRA = [
    "data-features/heat-syndrome/",
    "data-features/hvi/",
    "data-features/neighborhood-air-quality/",
    "data-features/cooling-info/",
    "es/",
    "zh/",
    "es/data-stories/housing/",
    "zh/data-stories/geographies/",
];

const SAMPLE_BASE = [
    "",
    "data-explorer/",
    "data-explorer/asthma/",
    "data-explorer/asthma/?id=2380",
    "data-explorer/data-index/",
    "data-explorer/indicator-catalog/",
    "data-stories/",
    "data-stories/housing/",
    "data-stories/cold/",
    "data-stories/urban-heat-island/",
    "data-stories/block-by-block/",
    "data-stories/air-quality-snapshots/",
    "data-features/",
    "data-features/flood-vulnerability-index/",
    "data-features/rat-mitigation-zones/",
    "data-features/realtime-air-quality/",
    "data-features/find-your-uhf/",
    "data-features/rats-in-your-neighborhood/",
    "data-features/congestion-pricing-report/",
    "data-features/heat-report-archive/2021/",
    "neighborhood-reports/",
    "neighborhood-reports/active_design_physical_activity_and_health/",
    "neighborhood-reports/bayside_little_neck/",
    "neighborhood-reports/bayside_little_neck/asthma_and_the_environment/",
    "key-topics/",
    "key-topics/airquality/",
    "about/",
    "about/publications/",
    "resources/",
    "resources/sugar-lookup/",
    "take-action/",
    "take-action/email-electeds/",
    "search-results/",
];

const SAMPLE = [...SAMPLE_BASE, ...SAMPLE_EXTRA];

// ----------------------------------------------------------------------- //
// in-page capture
// ----------------------------------------------------------------------- //

// Everything below runs inside the browser. It reads only the rendered DOM —
// never the site's own globals — so it stays valid across a refactor that
// renames them.

// Exported so a control can run it against a page it has deliberately modified.
// A field that is constant across every page is either constant by
// construction or reading a node that does not exist, and the two are
// indistinguishable in the output — the only way to tell them apart is to make
// the node exist and check the number moves.
export const CAPTURE = (prefix) => {

    const $$ = (sel) => [...document.querySelectorAll(sel)];
    const squash = (s) => (s || "").replace(/\s+/g, " ").trim();
    const text = (el) => squash(el && el.textContent);
    const uniqSorted = (xs) => [...new Set(xs)].sort();

    // --- accessible name -------------------------------------------------
    // An approximation of the accname algorithm, in precedence order. See the
    // file header: this is a change detector, not an audit.
    const accessibleName = (el) => {

        const labelledby = el.getAttribute("aria-labelledby");
        if (labelledby) {
            const t = squash(labelledby.split(/\s+/)
                .map((id) => text(document.getElementById(id))).join(" "));
            if (t) return t;
        }

        const label = squash(el.getAttribute("aria-label"));
        if (label) return label;

        // el.labels covers <label for> and wrapping <label>, for form controls.
        if (el.labels && el.labels.length) {
            const t = squash([...el.labels].map(text).join(" "));
            if (t) return t;
        }

        const own = text(el);
        if (own) return own;

        const img = el.querySelector("img[alt]");
        if (img && squash(img.alt)) return squash(img.alt);

        const title = squash(el.getAttribute("title"));
        if (title) return title;

        // <input type=submit|button> takes its name from value, not content.
        if (el.tagName === "INPUT" && /^(submit|button|reset)$/.test(el.type)) {
            return squash(el.value);
        }

        return "";
    };

    const isZeroSized = (el) => {
        const r = el.getBoundingClientRect();
        return r.width === 0 || r.height === 0;
    };

    // --- assets ----------------------------------------------------------
    // Hugo's short-fingerprint.html inserts an xxhash as 16 hex characters
    // before the extension (lib-vega.0ea3b78b7b6d94fd.js). Strip it so an
    // unrelated asset edit does not churn every page in the baseline. Some
    // assets ship unhashed (conditional-modal.js), and some base names contain
    // their own dot (accessible-autocomplete.min.js) — the lookahead on the
    // extension is what keeps the pattern off ".min".
    //
    // Same-origin assets are recorded as the baseURL-prefix-stripped pathname,
    // so js/lib-vega-bundle.js stays distinguishable from a same-named file
    // elsewhere, and so the record does not carry /dev-stage/ — the prefix is
    // a property of the server, not of the site.
    //
    // Cross-origin assets are recorded as the HOST ALONE. Their paths carry the
    // vendor's own build identifiers, which change on the vendor's schedule and
    // would churn the baseline for a reason unrelated to this site — Google
    // Translate injects
    // translate.googleapis.com/_/translate_http/_/js/k=translate_http.tr.en_US.<id>/...
    // and googletagmanager's ?id= is the analytics property, which differs by
    // environment. The signal worth keeping is "this page still loads a script
    // from that host", which is what a gating regression would break.
    const stripHash = (s) => s.replace(/\.[0-9a-f]{16,}(?=\.(js|css)$)/, "");

    const assetName = (url) => {
        let u;
        try { u = new URL(url, location.href); } catch { return stripHash(url); }
        if (u.origin !== location.origin) return u.host;
        const path = u.pathname.startsWith(prefix) ? u.pathname.slice(prefix.length) : u.pathname.replace(/^\//, "");
        return stripHash(path);
    };

    // livereload.js is injected by `hugo server` and exists in no built site.
    // Recording it would make the baseline a description of the dev server.
    const isDevServerAsset = (url) => /\/livereload\.js(\?|$)/.test(url);

    const assetNodes = [
        ...$$("script[src]").map((el) => ({ url: el.src, integrity: !!el.integrity })),
        ...$$('link[rel="stylesheet"][href]').map((el) => ({ url: el.href, integrity: !!el.integrity })),
    ].filter((a) => !isDevServerAsset(a.url));

    // --- headings --------------------------------------------------------
    // Levels and text are recorded separately: levels are template structure
    // and belong in the gated half of the record, text is content and does not.
    const headings = $$("h1, h2, h3, h4, h5, h6");
    const headingLevels = headings.map((el) => Number(el.tagName[1]));

    let headingJumps = 0;
    for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) headingJumps++;
    }

    // --- head metadata ---------------------------------------------------
    const metaOf = (sel) => {
        const el = document.querySelector(sel);
        return el ? squash(el.content) : null;
    };

    // The robots string is recorded verbatim, not as a boolean: head.html emits
    // "noindex, nofollow" in every environment except prod_prod, so its value
    // is the tell that a build came from the wrong environment.
    const meta = {
        description: !!metaOf('meta[name="description"]'),
        canonical: !!document.querySelector('link[rel="canonical"]'),
        robots: metaOf('meta[name="robots"]'),
        ogTitle: !!metaOf('meta[property="og:title"]'),
        ogImage: !!metaOf('meta[property="og:image"]'),
        viewport: !!metaOf('meta[name="viewport"]'),
    };

    // --- JSON-LD ---------------------------------------------------------
    // topLevelIsObject is the load-bearing field. JSON.parse returns a *string*
    // and throws nothing for a document double-encoded as a JSON string
    // literal, so "it parsed" is not evidence that a consumer can read it.
    const jsonld = $$('script[type="application/ld+json"]').map((el) => {

        let parsed;
        try {
            parsed = JSON.parse(el.textContent);
        } catch {
            return { type: null, keys: [], topLevelIsObject: false, parseError: true };
        }

        const isObject = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);

        return {
            type: isObject ? (parsed["@type"] ?? null) : null,
            keys: isObject ? Object.keys(parsed).sort() : [],
            topLevelIsObject: isObject,
            parseError: false,
        };
    });

    // --- images ----------------------------------------------------------
    // Counted over the parsed DOM rather than over source lines: a line-oriented
    // sweep scores the opening line of a multi-line <img> as missing its alt.
    const imgs = $$("img");

    const img = {
        total: imgs.length,
        missingAlt: imgs.filter((el) => !el.hasAttribute("alt")).length,
        emptyAlt: imgs.filter((el) => el.getAttribute("alt") === "").length,
        zeroSize: imgs.filter(isZeroSized).length,
    };

    // --- links -----------------------------------------------------------
    const anchors = $$("a[href]");

    const linkInfo = anchors.map((el) => {
        const raw = el.getAttribute("href");
        let host = null;
        let path = null;
        let internal = false;
        try {
            const u = new URL(el.href);
            host = u.host;
            internal = u.origin === location.origin;
            // Strip the baseURL prefix where the link carries it. A link that
            // does NOT is left as-is on purpose: /data-explorer/asthma/ written
            // without the prefix resolves correctly on a server mounted at /
            // and 404s on one mounted at /IndicatorPublic/, so the difference
            // between the two shapes is a signal, not noise to normalise away.
            path = internal && u.pathname.startsWith(prefix)
                ? u.pathname.slice(prefix.length - 1)
                : u.pathname;
        } catch { /* javascript:, mailto:, malformed — left null */ }
        return { raw, host, path, internal, named: accessibleName(el) !== "" };
    });

    const links = {
        internal: linkInfo.filter((l) => l.internal).length,
        external: linkInfo.filter((l) => l.host && !l.internal).length,
        emptyHref: linkInfo.filter((l) => l.raw === "" || l.raw === "#").length,
        noAccessibleText: linkInfo.filter((l) => !l.named).length,
    };

    // --- form controls ---------------------------------------------------
    // type=hidden is excluded: it has no accessible name by design, and
    // counting it would make every page report a constant floor of failures.
    const controlNodes = $$("button, input:not([type=hidden]), select, textarea");

    const controls = {
        button: $$("button").length,
        input: $$("input:not([type=hidden])").length,
        select: $$("select").length,
        textarea: $$("textarea").length,
        noAccessibleName: controlNodes.filter((el) => accessibleName(el) === "").length,
    };

    // --- tables ----------------------------------------------------------
    const tableNodes = $$("table");

    const tables = {
        total: tableNodes.length,
        withTh: tableNodes.filter((el) => el.querySelector("th")).length,
        withCaption: tableNodes.filter((el) => el.querySelector("caption")).length,
    };

    // --- embeds ----------------------------------------------------------
    // Host plus a rendered-size flag. A third-party embed that starts rendering
    // at zero height is invisible to a console-error check and to the build.
    // A same-origin embed records "(self)" rather than localhost:8080 — the
    // host is a property of whichever server the sweep ran against.
    const iframes = $$("iframe").map((el) => {
        let host = null;
        try {
            const u = new URL(el.src, location.href);
            host = u.origin === location.origin ? "(self)" : u.host;
        } catch { /* srcdoc, about:blank */ }
        return { host, zeroSize: isZeroSized(el) };
    }).sort((a, b) => String(a.host).localeCompare(String(b.host)));

    // --- layout ----------------------------------------------------------
    const root = document.documentElement;

    return {

        structure: {
            lang: root.getAttribute("lang"),
            assets: uniqSorted(assetNodes.map((a) => assetName(a.url))),
            assetsWithIntegrity: assetNodes.filter((a) => a.integrity).length,
            headingLevels,
            headingJumps,
            landmarks: {
                main: $$("main").length,
                nav: $$("nav").length,
                header: $$("header").length,
                footer: $$("footer").length,
                aside: $$("aside").length,
                h1: $$("h1").length,
            },
            meta,
            jsonld,
            img,
            links,
            controls,
            tables,
            iframes,
            overflowX: root.scrollWidth > root.clientWidth,
        },

        content: {
            title: document.title,
            headingText: headings.map(text),
            internalTargets: uniqSorted(linkInfo.filter((l) => l.internal).map((l) => l.path)),
            externalHosts: uniqSorted(linkInfo.filter((l) => l.host && !l.internal).map((l) => l.host)),
            metaDescription: metaOf('meta[name="description"]'),
        },

        // Kept out of both gated sections deliberately — see recordFor().
        rawAssetUrls: assetNodes.map((a) => a.url.split("/").pop()),
    };
};

// ----------------------------------------------------------------------- //
// quiescence
// ----------------------------------------------------------------------- //

// Counts structural DOM mutations, so the harness can wait for a page to stop
// changing rather than sleep a fixed interval and hope.
//
// A fixed sleep is what this replaces, and the measurement that killed it: with
// a 2.5s settle, 8 of 41 sample pages differed between two runs, always in the
// same 11 fields at once. Every delta was the Google Translate widget's
// injected subtree — its language <select>, five hidden inputs, two buttons,
// two images, a same-origin banner iframe and two script hosts — which lands
// either side of 2.5s depending on the network. One cause, eleven fields
// `[verified 2026-08-23: run-a vs run-b over the 41-page sample]`.
//
// childList/subtree only, not attributes: Leaflet and Bootstrap mutate
// attributes continuously on some pages, and a page that never stops would hit
// the cap on every run rather than settle.
const INSTALL_MUTATION_COUNTER = () => {
    window.__scMutations = 0;
    new MutationObserver((records) => { window.__scMutations += records.length; })
        .observe(document.documentElement, { childList: true, subtree: true });
};

// Polls until the mutation count holds still, or the cap expires. Returns
// whether it actually settled — a probe with a stop condition has to say which
// stop condition it hit, or a capped page is indistinguishable from a quiet one.
const waitForQuiescence = async (page, { interval = 400, stableSamples = 3, cap = 15000 } = {}) => {

    const deadline = Date.now() + cap;
    let last = -1;
    let stable = 0;

    while (Date.now() < deadline) {
        await page.waitForTimeout(interval);
        const n = await page.evaluate(() => window.__scMutations ?? 0);
        stable = (n === last) ? stable + 1 : 0;
        last = n;
        if (stable >= stableSamples) return true;
    }

    return false;
};

// ----------------------------------------------------------------------- //
// per-page capture
// ----------------------------------------------------------------------- //

// Loads one page and returns its record plus the console errors it produced.
//
// "load" rather than "networkidle", matching smoke-pages.mjs: pages embedding
// third-party iframes that poll continuously never reach networkidle. Waiting
// for DOM quiescence afterwards lets JS-rendered content (data explorer,
// nr-output) and third-party injection land before anything is measured —
// without it this harness would characterize five empty accordion shells and
// call them stable, and would race the Google Translate widget on every page.
export async function capturePage(browser, baseURL, path, userAgent, prefix) {

    const page = await browser.newPage({ userAgent, viewport: VIEWPORT });
    const consoleErrors = [];

    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.addInitScript(INSTALL_MUTATION_COUNTER);

    await page.route("**/*", (route) => {
        const host = new URL(route.request().url()).host;
        return BLOCKED_HOSTS.includes(host) ? route.abort() : route.continue();
    });

    let status = null;
    let record = null;
    let navError = null;
    let settled = null;

    try {
        const response = await page.goto(baseURL + path, { waitUntil: "load", timeout: 30000 });
        status = response ? response.status() : null;
        settled = await waitForQuiescence(page);
        record = await page.evaluate(CAPTURE, prefix);
    } catch (e) {
        navError = e.message;
    }

    await page.close();

    return { path, status, settled, navError, record, consoleErrors };
}

// ----------------------------------------------------------------------- //
// output
// ----------------------------------------------------------------------- //

// A URL path turned into a file path that survives Windows and git. The query
// string is part of the identity — data-explorer/asthma/?id=2380 renders
// differently from data-explorer/asthma/ — so it is encoded, not dropped.
const fileFor = (outDir, path) => {
    const safe = (path || "_home")
        .replace(/\/$/, "/index")
        .replace(/[^A-Za-z0-9._\-/]/g, "_");
    return `${outDir}/${safe}.json`;
};

// The gated record. rawAssetUrls is dropped here: it exists only so the Task 1
// control can prove the fingerprint strip had something to strip, and keeping
// it would put a hash in the baseline and churn every page on every asset edit.
const recordFor = ({ path, status, navError, record }) => {
    if (!record) return { path, status, navError, structure: null, content: null };
    const { rawAssetUrls, ...gated } = record;
    return { path, status, ...gated };
};

const write = (outDir, result) => {
    const file = fileFor(outDir, result.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(recordFor(result), null, 4) + "\n");
};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const parseArgs = (argv) => {
    const at = (flag) => {
        const i = argv.indexOf(flag);
        return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
    };
    return {
        all: argv.includes("--all"),
        out: at("--out"),
        concurrency: Number(at("--concurrency")) || DEFAULT_CONCURRENCY,
    };
};

// Playwright's default UA says "HeadlessChrome", which some third parties
// refuse — forecast7.com answers 403 to it, so the heat-syndrome embed renders
// at zero height under the harness while working for visitors. Same
// de-headlessing as smoke-pages.mjs, and for the same reason: without it this
// harness would bake a harness artefact into the baseline as a finding.
const browserUserAgent = async (browser) => {
    const page = await browser.newPage();
    const ua = await page.evaluate(() => navigator.userAgent);
    await page.close();
    return ua.replace("HeadlessChrome", "Chrome");
};

const main = async () => {

    const { all, out, concurrency } = parseArgs(process.argv.slice(2));

    if (!out) {
        console.error("Usage: node scripts/site-characterization.mjs --out <dir> [--all] [--concurrency N]");
        process.exit(2);
    }

    const { baseURL, stop } = await ensureDevServer();

    // The server's own path prefix (/dev-stage/, /IndicatorPublic/, ...). Every
    // probe that reads a URL strips it, so a record describes the site rather
    // than the environment that served it.
    const prefix = new URL(baseURL).pathname;

    const paths = all ? await collectAllPaths(baseURL) : SAMPLE;
    const browser = await chromium.launch({ headless: true });
    const userAgent = await browserUserAgent(browser);

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });

    let done = 0;
    let failed = 0;
    let unsettled = [];
    let consoleErrorTotal = 0;
    let rawHashedAssets = 0;

    try {
        await mapPool(paths, concurrency, async (path) => {

            const result = await capturePage(browser, baseURL, path, userAgent, prefix);
            write(out, result);

            done++;
            consoleErrorTotal += result.consoleErrors.length;

            // Task 1 step 6's positive control for the fingerprint strip: count
            // raw asset names that actually carried a 16-hex segment. A strip
            // that never had anything to strip passes by construction.
            if (result.record) {
                rawHashedAssets += result.record.rawAssetUrls
                    .filter((n) => /\.[0-9a-f]{16,}\.(js|css)$/.test(n)).length;
            }

            if (result.settled === false) unsettled.push(path || "(home)");

            if (result.navError) {
                failed++;
                console.error(`FAIL  ${path || "(home)"}  ${result.navError}`);
            }

            if (done % 50 === 0) console.log(`      ... ${done}/${paths.length}`);
        });
    } finally {
        await browser.close();
        await stop();
    }

    console.log(`\nCaptured ${done - failed}/${paths.length} pages into ${out}`);
    console.log(`Fingerprinted asset references seen (strip control): ${rawHashedAssets}`);
    console.log(`Console errors across the sweep (NOT baselined — that is smoke's job): ${consoleErrorTotal}`);

    // A page that hit the quiescence cap was measured mid-change, so its record
    // is the one to suspect first when the baseline churns. Named, not counted:
    // a count cannot tell you which page to go and look at.
    if (unsettled.length) {
        console.log(`\n${unsettled.length} page(s) never reached DOM quiescence and were captured at the cap:`);
        for (const p of unsettled) console.log(`      ${p}`);
    } else {
        console.log("Every page reached DOM quiescence before the cap.");
    }

    if (failed) {
        console.error(`${failed} page(s) failed to load.`);
        process.exitCode = 1;
    }
};

// Only sweep when run directly. CAPTURE and capturePage() are imported by the
// probe controls, and an unguarded main() would start a full sweep on import.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
