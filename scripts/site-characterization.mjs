// ======================================================================= //
// site-characterization.mjs
// ======================================================================= //

// Breadth-first characterization harness: every page the site serves, loaded
// once, with its rendered structure recorded so a template, asset or SCSS
// change can be diffed against another tree's capture.
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
// Usage:
//   node scripts/site-characterization.mjs --out <dir> [--all]   capture into <dir>
//
// Capture only. Comparing two captures — a PR against its base branch — is
// site-characterization-compare.mjs, which drives this script once per side.
// There is no committed baseline any more: see
// documents/characterization-pr-diff-plan-2026-11-18.md for why.
//
// Original plan and probe validation: documents/site-characterization-plan-2026-08-23.md

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { availableParallelism } from "node:os";
import { pathToFileURL } from "node:url";
import { ensureDevServer } from "./dev-server.mjs";
import { collectAllPaths, mapPool } from "./site-urls.mjs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// A fixed viewport, because overflowX and every zero-size probe are viewport
// relative. A constant rather than a flag, so the two sides of a comparison —
// both captured by this one script — cannot be taken at different sizes.
const VIEWPORT = { width: 1280, height: 900 };

// Browser pages in flight. Derived from the machine rather than fixed, because
// the two places this runs differ by an order of magnitude in cores — a dev
// workstation and a GitHub Actions runner — and a number tuned for one starves
// or overcommits the other.
//
// Measured on this repo, 925 pages, one prod_prod `hugo server`, three
// interleaved sweeps so a warm cache could not be mistaken for concurrency:
// 12 -> 198s, 24 -> 114s, 12 -> 199s. All three captures byte-identical across
// all 925 records, every page quiesced before the cap, and the console-error
// total was 1862 in all three `[2026-08-24, 24 logical processors]`.
//
// The bounds are the range that was actually measured, not a known optimum: 6
// is the value Tasks 1-8 ran at, 24 is the highest tried. Raising the ceiling
// means measuring above it first — this harness's whole value rests on captures
// that agree, and concurrency is the obvious thing that could break that.
const CONCURRENCY_FLOOR = 6;
const CONCURRENCY_CEILING = 24;
const DEFAULT_CONCURRENCY = Math.min(
    CONCURRENCY_CEILING,
    Math.max(CONCURRENCY_FLOOR, availableParallelism()),
);

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
    "zh/data-stories/redlining/",
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
    //
    // Leaflet map tiles are excluded on every page, and that exclusion is
    // load-bearing. How many tiles a map has fetched is a fact about network
    // timing, not about the page: four loads of one neighborhood report gave
    // img.total 17, 17, 20, 20 and img.leaflet-tile 9, 9, 12, 12, while the
    // images *outside* the map container were 8 on all four [verified
    // 2026-08-23 in a browser]. Left in, this field alone failed the first
    // full-site --check on 9 NR pages.
    //
    // Marker icons are excluded on ONE page, and the narrowness is the point.
    // A marker count is worth keeping wherever the markers come from data that
    // changes by hand: there, markers appearing or vanishing is exactly the
    // regression this check exists to catch. `proximity` (128 markers),
    // `congestion-pricing-report` (111) and `heat-story` (19) are all in that
    // class and keep their counts. `realtime-air-quality` is not: it draws one
    // marker per LIVE air-quality monitor, so a monitor going down moves
    // img.total and img.missingAlt with no code change — which reddened a
    // prod_prod --check twice on 2026-08-26, 19 -> 18 and 16 -> 15, purely
    // from the feed.
    //
    // A marker image carries no class of its own; the class sits on its PARENT
    // div.leaflet-marker-icon, so `classList.contains` never matches one and
    // only `closest` does `[verified 2026-08-26 in a browser: 15
    // map-marker.svg, every one parented by div.leaflet-marker-icon, and the
    // only alt-less images on that page]`.
    //
    // Derived from location rather than passed in, so both callers of CAPTURE
    // keep their one-argument signature. Same prefix-stripping as the asset
    // and link paths below, so the entry matches a record's own `path` field.
    const LIVE_MARKER_PAGES = ["data-features/realtime-air-quality/"];
    const herePath = location.pathname.startsWith(prefix)
        ? location.pathname.slice(prefix.length)
        : location.pathname.replace(/^\//, "");
    const liveMarkers = LIVE_MARKER_PAGES.includes(herePath);

    const imgs = $$("img").filter((el) => (liveMarkers
        ? !el.closest(".leaflet-container")
        : !el.classList.contains("leaflet-tile")));

    const img = {
        total: imgs.length,
        missingAlt: imgs.filter((el) => !el.hasAttribute("alt")).length,
        emptyAlt: imgs.filter((el) => el.getAttribute("alt") === "").length,
        zeroSize: imgs.filter(isZeroSized).length,

        // Recorded only where the count was suppressed, because only there is
        // it carrying anything: on a page that still counts its markers, a
        // marker set dropping to zero already shows up as a count diff, and a
        // second field saying so would be a field added to 925 records to
        // restate what one of them already says.
        //
        // Presence, not count: how MANY markers the map drew tracks the feed,
        // but whether it drew any at all is a fact about the page, and catches
        // the failure that matters — tiles rendering with no data on them.
        // Queried on `.leaflet-marker-icon` directly rather than through the
        // images, so a marker drawn as a divIcon with no <img> still registers.
        ...(liveMarkers ? { mapMarkers: $$(".leaflet-marker-icon").length > 0 } : {}),
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
//
// The deferred attach is not defensive style, it is the whole thing working.
// addInitScript runs before the page's own scripts, and at that point
// document.readyState is "loading" and document.documentElement is null, so
// `.observe(document.documentElement, ...)` throws
// `TypeError: parameter 1 is not of type 'Node'` and the observer never
// attaches [verified 2026-08-24]. The assignment on the line above it survives,
// so __scMutations sits at 0 for the life of the page and waitForQuiescence
// compares 0 to 0 forever. Measured on data-explorer/climate/: this
// construction read 0 after 8s where a correctly attached observer counted
// 2,558 mutation batches.
const INSTALL_MUTATION_COUNTER = () => {

    window.__scMutations = 0;
    window.__scObserverAttached = false;

    const attach = () => {
        if (!document.documentElement) return false;
        new MutationObserver((records) => { window.__scMutations += records.length; })
            .observe(document.documentElement, { childList: true, subtree: true });
        window.__scObserverAttached = true;
        return true;
    };

    if (!attach()) document.addEventListener("readystatechange", attach, { once: true });
};

// Polls until the DOM has stopped changing AND no main-frame request is still
// in flight, or the cap expires. Returns whether it actually settled — a probe
// with a stop condition has to say which stop condition it hit, or a capped
// page is indistinguishable from a quiet one.
//
// The in-flight half was added on the theory that the data explorer's runtime
// fetch of EHDP-data leaves a quiet DOM while the fetch is outstanding. It was
// then measured as never binding — "DOM quiet" and "DOM quiet and nothing in
// flight" arrived at the same millisecond on every page sampled
// `[2026-08-23: extra = 0ms on about/, key-topics/airquality/,
// data-explorer/asthma/, data-explorer/data-index/]`.
//
// THAT MEASUREMENT DOES NOT SETTLE IT. It ran against a warm HTTP cache, where
// the fetch resolves immediately and there is no window for the condition to
// bind. It shows the condition is inert when the data is already cached; it
// says nothing about a cold fetch, which is the case the theory is about. Keep
// the condition, and treat neither the theory nor its "disproof" as settled.
//
// What the theory does illustrate is not in doubt: waiting for the DOM to stop
// changing cannot distinguish a page that has FINISHED rendering from one that
// has NOT STARTED. Both are quiet. Any readiness check built on quiescence
// alone inherits that blindness — which is why recapture() exists rather than
// a longer wait.
//
// Only MAIN-FRAME requests are counted. Datawrapper and the AirNow widget poll
// continuously from inside their own cross-origin iframes, and counting those
// would mean no page carrying one ever settles — the same reason
// smoke-pages.mjs waits for `load` rather than `networkidle`.
const waitForQuiescence = async (page, { interval = 400, stableSamples = 3, cap = 30000 } = {}) => {

    let inFlight = 0;

    const isMainFrame = (request) => {
        try { return request.frame() === page.mainFrame(); } catch { return false; }
    };

    const started = (request) => { if (isMainFrame(request)) inFlight++; };
    const ended = (request) => { if (isMainFrame(request)) inFlight--; };

    page.on("request", started);
    page.on("requestfinished", ended);
    page.on("requestfailed", ended);

    try {
        const deadline = Date.now() + cap;
        let last = -1;
        let stable = 0;

        while (Date.now() < deadline) {
            await page.waitForTimeout(interval);
            const n = await page.evaluate(() => window.__scMutations ?? 0);

            // A counter that never attached also reads a constant 0, which is
            // indistinguishable from a quiet page — that is exactly how this
            // wait silently degenerated into a ~1.2s sleep. Fail loudly instead.
            if (!await page.evaluate(() => window.__scObserverAttached === true)) {
                throw new Error("the mutation observer never attached — "
                    + "quiescence cannot be measured, so no capture from this run is trustworthy");
            }

            stable = (n === last && inFlight <= 0) ? stable + 1 : 0;
            last = n;
            if (stable >= stableSamples) return true;
        }

        return false;

    } finally {
        page.off("request", started);
        page.off("requestfinished", ended);
        page.off("requestfailed", ended);
    }
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

export const walk = (dir, base = "") => readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`, `${base}${e.name}/`) : [`${base}${e.name}`]);

// ----------------------------------------------------------------------- //
// sequential arbitration
// ----------------------------------------------------------------------- //

// Re-captures a set of pages one at a time and rewrites their records.
//
// THE FAILURE IS REAL AND ITS CAUSE IS NOT ESTABLISHED. Saying so here is
// deliberate: the next person will refactor against whatever this comment
// claims, and a confident wrong cause is worse than an open question.
//
// What happened: a --baseline immediately followed by a --check, same commit,
// reported controls.button 25 -> 96 and links.internal 70 -> 638 on three
// data-explorer pages. 25 is below even that page's FIRST sampled state of 63,
// so the baseline captured a page before its initial render, not between two
// states.
//
// What is measured, and rules things out rather than in:
//   - The pages are not slow. Hit sequentially, data-explorer/asthma/ reaches
//     its final state at 260ms, ?id=2380 at 269ms, the NR report at 1050ms,
//     static pages at ~4ms `[2026-08-23]`.
//   - Concurrency barely touches them. At 6 vs 1 over 12 pages, navigation
//     (goto -> load) slowed 1.34x while JS settle time was 1.00x, and all 12
//     reached identical final DOM states `[2026-08-23]`. That is nowhere near
//     enough to explain a pre-first-render capture, so "six pages starve one
//     hugo server's render" — smoke-pages.mjs:246's explanation, which this
//     repo's CLAUDE.md repeats — is NOT supported for this failure.
//   - An earlier theory, that the EHDP-data fetch leaves the DOM quiet while it
//     is in flight, was called disproved on an "extra = 0ms" measurement. That
//     measurement ran against a warm HTTP cache and therefore could not have
//     seen the condition bind. The theory is open, not dead.
//
// The failure has not been reproduced since. This function is therefore a
// GUARD, justified by the observed failure, not by a known mechanism: two
// captures that disagree are arbitrated by a third taken alone. That is worth
// having whatever the cause turns out to be, and it is the same answer
// smoke-pages.mjs reaches for.
export const recapture = async (browser, baseURL, userAgent, prefix, outDir, paths) => {

    const results = [];

    for (const path of paths) {
        const result = await capturePage(browser, baseURL, path, userAgent, prefix);
        write(outDir, result);
        results.push(result);
    }

    return results;
};

// ----------------------------------------------------------------------- //
// capture metadata
// ----------------------------------------------------------------------- //

// The name of the provenance file a capture directory may hold. This script no
// longer writes one, but walk()-based enumerations and project() still skip it,
// so a capture directory left over from before 2026-11-19 compares cleanly.
export const META_FILE = "_meta.json";

// ----------------------------------------------------------------------- //
// section-filtered diff
// ----------------------------------------------------------------------- //

// Writes a copy of `srcDir` holding only the record sections in `keys`, so a
// comparison can look at `structure` alone while each capture still records
// `content` for anyone who widens it with --content.
//
// A projection rather than a two-file-per-page layout: it keeps a capture at
// one readable file per page instead of 1,850 half-records, and the projected
// trees are throwaway.
export const project = (srcDir, dstDir, keys) => {

    rmSync(dstDir, { recursive: true, force: true });

    for (const rel of walk(srcDir)) {
        if (rel === META_FILE) continue;
        const record = JSON.parse(readFileSync(`${srcDir}/${rel}`, "utf8"));
        const kept = { path: record.path, status: record.status };
        for (const k of keys) kept[k] = record[k];
        const dst = `${dstDir}/${rel}`;
        mkdirSync(dirname(dst), { recursive: true });
        writeFileSync(dst, JSON.stringify(kept, null, 4) + "\n");
    }
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

const USAGE = `Usage:
  node scripts/site-characterization.mjs --out <dir> [--all]    capture every page (or the sample) into <dir>

  --concurrency N   browser pages in flight (default ${DEFAULT_CONCURRENCY})

To compare two trees, use site-characterization-compare.mjs (npm run characterize:site).`;

// Playwright's default UA says "HeadlessChrome", which some third parties
// refuse — forecast7.com answers 403 to it, so the heat-syndrome embed renders
// at zero height under the harness while working for visitors. Same
// de-headlessing as smoke-pages.mjs, and for the same reason: without it this
// harness would bake a harness artefact into the baseline as a finding.
// head.html declares data_branch and hugoEnv as top-level `let`s in an inline
// script, so they are reachable from an evaluate() but are NOT window
// properties — window.data_branch reads undefined. Same trap the NR harness
// documents.
// "owner/repo" from a raw-content URL, whose last two non-empty segments are
// exactly that: https://raw.githubusercontent.com/nychealth/EHDP-data/ ->
// nychealth/EHDP-data `[config/_default/config.toml:18]`. Null when the URL
// cannot yield two segments.
export const githubSlug = (repoUrl) => {
    if (!repoUrl) return null;
    const [owner, repo] = repoUrl.split("/").filter(Boolean).slice(-2);
    return owner && repo ? `${owner}/${repo}` : null;
};

// The data half of a baseline's provenance. `dataBranch` names the STREAM;
// this names its STATE, which is the difference between "this PR moved a
// template" and "the data moved underneath" — the question the base-control
// job spends nine minutes answering `[run 32905347134: 9m48s]`.
//
// RECORDED, NEVER GATED, unlike `pagefind`. EHDP-data's production branch moves
// on a SEASONAL schedule — the auto-commit carries heat illness surveillance
// data, so it runs through heat season and not year round. Distinct commit-days
// per window: 86 of the 92 days to 2026-08-01 and 24 of the 25 after it,
// against 8 of the 92 from 2025-11-01 and 4 of the 88 after that
// `[gh api repos/nychealth/EHDP-data/commits?sha=production, 2026-08-26]`.
//
// So a gate would look fine for two thirds of the year and then refuse nearly
// every comparison through the months when the data is actually moving — which
// is when a characterization run is worth having. It is also why a baseline
// with no dataCommit at all must still compare cleanly.
//
// Null is a real answer, not an error: an unreachable host, a rate-limited API,
// a 404, a repo URL that is not a GitHub one. The caller prints "@ unknown" and
// carries on.
// A token for api.github.com: GITHUB_TOKEN when set (CI sets it), otherwise the
// local gh CLI's login. Read once per process. No gh, or gh not logged in, gives
// null and the request goes unauthenticated, as it did before.
let githubTokenCache;
const githubToken = () => {
    if (githubTokenCache !== undefined) return githubTokenCache;
    githubTokenCache = process.env.GITHUB_TOKEN || null;
    if (!githubTokenCache) {
        try {
            githubTokenCache = execFileSync("gh", ["auth", "token"], {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
                timeout: 5000,
            }).trim() || null;
        } catch {
            githubTokenCache = null;
        }
    }
    return githubTokenCache;
};

export const fetchDataCommit = async (repoUrl, branch) => {
    const slug = githubSlug(repoUrl);
    if (!slug || !branch) return null;

    try {
        const res = await fetch(`https://api.github.com/repos/${slug}/commits/${encodeURIComponent(branch)}`, {
            headers: {
                Accept: "application/vnd.github+json",
                // Unauthenticated api.github.com allows 60 requests an hour PER
                // IP. A GitHub-hosted runner's IP is shared with everyone else's
                // job, and locally a day of sweeps beside other gh/API use has
                // also run out (prod_prod's 2026-11-10 re-baseline recorded null),
                // so every run authenticates when it can: see githubToken().
                ...(githubToken() ? { Authorization: `Bearer ${githubToken()}` } : {}),
            },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;

        const body = await res.json();
        if (!body?.sha) return null;
        return {
            sha: body.sha,
            date: body.commit?.committer?.date ?? null,
            // When the SHA was read, which is not when the pages were captured —
            // a 925-page sweep runs for minutes after this.
            fetchedAt: new Date().toISOString(),
        };
    } catch {
        return null;
    }
};

const readEnvironment = async (browser, baseURL) => {

    const page = await browser.newPage();

    try {
        await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30000 });

        const env = await page.evaluate(() => ({
            // Read off the PAGE, not out of config/, so the record describes the
            // site that was actually swept — including when DE_BASE_URL points at
            // a server this checkout did not build. Same `typeof` guard as its
            // siblings: these are inline-script `let`s, so they are not
            // properties of window and a bare reference would throw.
            dataRepo: typeof data_repo === "undefined" ? null : data_repo,
            dataBranch: typeof data_branch === "undefined" ? null : data_branch,
            hugoEnv: typeof hugoEnv === "undefined" ? null : hugoEnv,
        }));

        if (!env.dataBranch || !env.hugoEnv) {
            throw new Error(
                `Could not read data_branch / hugoEnv from ${baseURL}.
`
                + `head.html emits both as top-level lets in an inline script; check they are
`
                + `still emitted before trusting any capture from this server.`);
        }

        return env;

    } finally {
        await page.close();
    }
};

const browserUserAgent = async (browser) => {
    const page = await browser.newPage();
    const ua = await page.evaluate(() => navigator.userAgent);
    await page.close();
    return ua.replace("HeadlessChrome", "Chrome");
};

const main = async () => {

    const { all, out, concurrency } = parseArgs(process.argv.slice(2));

    // process.exitCode rather than process.exit() on every path: exiting
    // straight after a fetch() can abort Node on Windows with 127.
    if (!out) {
        console.error(USAGE);
        process.exitCode = 2;
        return;
    }

    const { baseURL, stop, pagefind, hugo } = await ensureDevServer();

    // The server's own path prefix (/dev-stage/, /IndicatorPublic/, ...). Every
    // probe that reads a URL strips it, so a record describes the site rather
    // than the environment that served it.
    const prefix = new URL(baseURL).pathname;

    const browser = await chromium.launch({ headless: true });

    // Which environment this server is, read from the running site before
    // sweeping, so pointing at the wrong server costs one page load.
    let env;

    try {
        env = await readEnvironment(browser, baseURL);
    } catch (e) {
        await browser.close();
        await stop();
        console.error(String(e.message ?? e));
        process.exitCode = 2;
        return;
    }

    console.log(`Environment: ${env.hugoEnv} (EHDP-data ${env.dataBranch}) at ${prefix} `
        + `— pagefind ${pagefind ? "served" : "ABSENT"}`
        + `\nHugo: ${hugo?.version ?? "unknown"}`
        + `${hugo?.owned ? "" : " (this checkout's pinned binary — the server was not started by this process)"}`
        // Printed rather than inferred: DEFAULT_CONCURRENCY is derived from the
        // machine, so the same command runs at a different width on a developer
        // box and on a CI runner, and two sweep timings are not comparable
        // without knowing which width each was taken at.
        + `\nConcurrency: ${concurrency} (${availableParallelism()} logical processors)`);

    const paths = all ? await collectAllPaths(baseURL) : SAMPLE;
    const userAgent = await browserUserAgent(browser);

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });

    let done = 0;
    let failed = 0;
    const unsettled = [];
    let consoleErrorTotal = 0;
    let rawHashedAssets = 0;

    try {
        await mapPool(paths, concurrency, async (path) => {

            const result = await capturePage(browser, baseURL, path, userAgent, prefix);
            write(out, result);

            done++;
            consoleErrorTotal += result.consoleErrors.length;

            // The positive control for the fingerprint strip: count raw asset
            // names that actually carried a 16-hex segment. A strip that never
            // had anything to strip passes by construction.
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
    console.log(`Console errors across the sweep (not compared — that is smoke's job): ${consoleErrorTotal}`);

    // A page that answers non-200 is not necessarily a failure — 404.html is in
    // the --all set on purpose — but a sample entry that has always 404'd is
    // invisible otherwise. zh/data-stories/geographies/ was one, from Task 1
    // until 2026-08-24: it was added to stop `lang` reading constant, and the
    // 404 page renders lang="en", so it contributed nothing while looking like
    // coverage.
    const nonOk = walk(out)
        .filter((rel) => rel !== META_FILE)
        .map((rel) => JSON.parse(readFileSync(`${out}/${rel}`, "utf8")))
        .filter((r) => r.status !== 200);

    if (nonOk.length) {
        console.log(`\n${nonOk.length} page(s) did not answer 200:`);
        for (const r of nonOk) console.log(`      ${r.status}  ${r.path || "(home)"}`);
    }

    // A page that hit the quiescence cap was measured mid-change, so its record
    // is the one to suspect first when a comparison churns. Named, not counted:
    // a count cannot tell you which page to go and look at.
    if (unsettled.length) {
        console.log(`\n${unsettled.length} page(s) never reached DOM quiescence and were captured at the cap:`);
        for (const p of unsettled) console.log(`      ${p}`);
    } else {
        console.log("Every page reached DOM quiescence before the cap.");
    }

    if (failed) {
        console.error(`\n${failed} page(s) failed to load — this capture is partial and must not be compared.`);
        process.exitCode = 1;
    }
};

// Only sweep when run directly. CAPTURE and capturePage() are imported by the
// probe controls, and an unguarded main() would start a full sweep on import.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
