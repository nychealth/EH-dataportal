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
// Usage:
//   node scripts/site-characterization.mjs --baseline --all   write + commit
//   node scripts/site-characterization.mjs --check --all      gate on `structure`
//   node scripts/site-characterization.mjs --check --content  gate on both halves
//   node scripts/site-characterization.mjs --out <dir>        raw capture, no baseline
//
// A BASELINE IS A FACT ABOUT ONE COMMIT AND ONE CLASS OF ENVIRONMENT. Baselines
// live under scripts/site-characterization-baseline/<key>/, where the key is the
// EHDP-data branch — or "prod_prod", the one environment whose template output
// differs from its data-branch siblings. See BASELINE_ROOT below. The harness
// reads the key off the running site, so --check selects its own baseline and
// prints which one it used.
//
// Plan and ledger: documents/site-characterization-plan-2026-08-23.md

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { availableParallelism } from "node:os";
import { pathToFileURL } from "node:url";
import { ensureDevServer } from "./dev-server.mjs";
import { collectAllPaths, mapPool } from "./site-urls.mjs";
import { summarize, renderText, renderMarkdown } from "./site-characterization-summary.mjs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// A fixed viewport, because overflowX and every zero-size probe are viewport
// relative. Changing this number invalidates the whole baseline, so it is a
// constant rather than a flag.
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

// Baselines are filed by what actually changes the site's output, not by Hugo
// environment name. The precedent is scripts/nr-characterization-baseline/ on
// feature-MOD-Lab-NR-recode-refactor, which splits by EHDP-data branch.
//
// Two things vary here, not one:
//
//   - data_branch. staging and production carry different indicator data, so a
//     production-data server checked against a staging baseline reports content
//     differences as regressions.
//   - prod_prod. head.html:46-53 branches on the environment NAME, not on the
//     data branch: only prod_prod emits robots "all" (or "noindex" for the
//     resources section), where every other environment emits "noindex,
//     nofollow" on every page. So prod_prod and dev_prod share production data
//     and still differ in meta.robots on all 925 pages.
//
// Hence three keys, not four — prod_prod is always production data:
//
//   staging/     dev_stage, local_stage, prod_stage
//   production/  dev_prod, development, local_prod, production
//   prod_prod/   prod_prod
//
// Paths and asset references are recorded prefix-relative (see CAPTURE), so one
// baseline checks from any environment in its row whatever path it is mounted
// at — that is the property that makes the split work at all.
const BASELINE_ROOT = "scripts/site-characterization-baseline";
const CURRENT_DIR = "scripts/site-characterization-current";

// Above this many differing pages, --check reports what it captured rather than
// re-capturing each one sequentially. recapture() guards against a per-page
// capture race, and a race does not reach hundreds of pages at once — a
// difference that wide is systematic, so arbitration is pure cost on a result
// that will not change.
//
// The cost is not marginal. A one-line template edit that moved `lang` on every
// page sent the CI job into a 12-minute un-concurrent re-capture of all 925 and
// hit `timeout-minutes: 20` having reported NOTHING — no field summary, no
// artifact, and the base-branch control skipped, because `if: failure()` is
// false for a cancelled job `[run 32802721473, 2026-08-25: sweep 6m15s, then
// "925 page(s) differ ... re-capturing sequentially", cancelled at 20m15s]`.
// The harness was slowest exactly when it had the most to say.
//
// 25 is above every arbitration count observed here — 18 before the
// Leaflet-tile and quiescence fixes, 2 after them, 0 on the prod_prod capture,
// and 3 in the one failure that justifies recapture() at all — and far below
// anything systematic. A full-cap re-capture has never been run: at the
// >=0.78 s/page the timed-out run implies (720s for 925 pages, and it had not
// finished), 25 pages is on the order of 20-30s.
//
// Only --check is capped. --baseline arbitrates two sweeps of the SAME commit,
// where a wide disagreement means something is wrong that a re-capture will not
// settle either; it is rare, run by hand, and under no timeout.
const ARBITRATION_CAP = 25;

// Where --check writes the two section-filtered trees it actually diffs. Kept
// inside the repo and deliberately short: `git diff --no-index` returns the
// correct exit code but prints ZERO lines of diff when handed a long path,
// which reads as a broken harness rather than as a failing check
// `[verified 2026-08-23: exit 1 and no output against a ~150-char temp path;
// full field-level output for the same comparison under C:/temp]`.
const DIFF_DIR = "scripts/.sc-check";

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
    // Leaflet map tiles are excluded, and that exclusion is load-bearing. How
    // many tiles a map has fetched is a fact about network timing, not about
    // the page: four loads of one neighborhood report gave img.total 17, 17,
    // 20, 20, and img.leaflet-tile 9, 9, 12, 12 — while the images *outside*
    // the map container were 8 on all four [verified 2026-08-23 in a browser].
    // Left in, this field alone failed the first full-site --check on 9 NR
    // pages. Only `.leaflet-tile` goes; marker icons and anything else inside
    // the map are still counted, because those are page structure.
    const imgs = $$("img").filter((el) => !el.classList.contains("leaflet-tile"));

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

const walk = (dir, base = "") => readdirSync(dir, { withFileTypes: true })
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
const recapture = async (browser, baseURL, userAgent, prefix, outDir, paths) => {

    const results = [];

    for (const path of paths) {
        const result = await capturePage(browser, baseURL, path, userAgent, prefix);
        write(outDir, result);
        results.push(result);
    }

    return results;
};

// Paths whose records differ between two capture directories.
// `only`, where given, restricts the comparison to files the run actually
// captured — see project() for why sample mode needs it.
const differingPaths = (dirA, dirB, only = null) => walk(dirA)
    .filter((rel) => rel !== META_FILE)
    .filter((rel) => !only || only.has(rel))
    .filter((rel) => {
        try {
            return readFileSync(`${dirA}/${rel}`, "utf8") !== readFileSync(`${dirB}/${rel}`, "utf8");
        } catch {
            return true;
        }
    })
    .map((rel) => JSON.parse(readFileSync(`${dirA}/${rel}`, "utf8")).path);

// ----------------------------------------------------------------------- //
// baseline metadata
// ----------------------------------------------------------------------- //

// A baseline is a fact about one commit AND one environment, and neither is
// recoverable from the records themselves.
//
// The environment half is not paranoia. meta.robots reads "noindex, nofollow"
// on every page outside prod_prod, and under prod_prod reads "all" except on
// the resources section, which reads "noindex" (head.html:46-53). Diffing a
// dev_stage baseline against a prod_prod run therefore reports ~925 robots
// changes that are nothing of the kind, and the real regressions are lost in
// them. --check refuses the comparison rather than let that read as a finding.
const META_FILE = "_meta.json";

const gitHead = () => {
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    } catch {
        return null;
    }
};

const writeMeta = (dir, { prefix, pages, all, arbitrated, cleared, capped, env, pagefind, hugo, dataCommit }) => {
    writeFileSync(`${dir}/${META_FILE}`, JSON.stringify({
        capturedAt: new Date().toISOString(),
        gitHead: gitHead(),
        baselineKey: env.key,
        hugoEnv: env.hugoEnv,
        dataBranch: env.dataBranch,
        // Which EHDP-data commit the branch above pointed at when this was
        // captured. Recorded, never gated — see fetchDataCommit(). Null means
        // the lookup failed, and a baseline captured before this field existed
        // has no key here at all; --check treats both the same way, as nothing
        // to say rather than as a mismatch.
        dataCommit,
        // Whether Pagefind's index was served at capture time. `hugo server`
        // does not build it, and without it the search UI never mounts — worth
        // one button and one input on every page `[measured 2026-08-24: 40 of
        // 40 sample pages, controls.button and controls.input each +1, no other
        // field touched]`. Recorded rather than assumed so --check can refuse a
        // comparison across the two states instead of reporting 925 regressions.
        pagefind,
        // Which Hugo built the site this baseline describes, and whether that is
        // known or merely likely. `owned: true` means this process spawned the
        // server, so the version is the server's; `owned: false` means the
        // server came from DE_BASE_URL or was already running, and the version
        // describes the binary this checkout would have used. Recorded, not gated:
        // measured 2026-08-24, v0.147.3 and v0.147.9 build this site to
        // byte-identical output across 2936 files, the only difference being the
        // build_datetime meta on the three home pages, which no record reads.
        hugo: hugo ?? null,
        // Informational only. The prefix no longer gates the check — records are
        // prefix-relative, so an environment may be served at any path.
        prefix,
        mode: all ? "all" : "sample",
        pages,
        // Which pages in this capture did not come from the concurrent sweep.
        // `arbitrated` were re-captured sequentially — because two sweeps
        // disagreed (--baseline) or because they differed from the baseline
        // (--check); `cleared` is the --check subset that then matched, so
        // contention rather than change. `capped` says the --check re-capture
        // was skipped outright because more pages differed than
        // ARBITRATION_CAP, which makes every record here a plain concurrent
        // capture. Named rather than counted: a count cannot tell you which
        // page to go and look at.
        arbitrated,
        cleared,
        capped,
        viewport: VIEWPORT,
        blockedHosts: BLOCKED_HOSTS,
    }, null, 4) + "\n");
};

// ----------------------------------------------------------------------- //
// section-filtered diff
// ----------------------------------------------------------------------- //

// Writes a copy of `srcDir` holding only the record sections in `keys`, so the
// default check can gate on `structure` while `content` still lives in the
// committed baseline for anyone who wants to read or diff it.
//
// A projection rather than a two-file-per-page layout: it keeps the committed
// baseline at one readable file per page instead of 1,850 half-records, and the
// projected trees are throwaway.
//
// `only` restricts the projection to a set of relative filenames. A sample-mode
// --check captures 41 pages against a baseline holding 925, and without this the
// diff reports the other 884 as deletions and fails every time. Scoping the
// projection to what was actually captured is what makes the sample check mean
// "these 41 pages are unchanged" rather than "the baseline is bigger than the run".
const project = (srcDir, dstDir, keys, only = null) => {

    rmSync(dstDir, { recursive: true, force: true });

    for (const rel of walk(srcDir)) {
        if (rel === META_FILE) continue;
        if (only && !only.has(rel)) continue;
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
        baseline: argv.includes("--baseline"),
        check: argv.includes("--check"),
        content: argv.includes("--content"),
        out: at("--out"),
        concurrency: Number(at("--concurrency")) || DEFAULT_CONCURRENCY,
    };
};

const USAGE = `Usage:
  node scripts/site-characterization.mjs --baseline [--all]     write the committed baseline
  node scripts/site-characterization.mjs --check    [--all]     diff the structure half against it
  node scripts/site-characterization.mjs --check --content      diff structure AND content
  node scripts/site-characterization.mjs --out <dir> [--all]    raw capture, no baseline involved

  --concurrency N   browser pages in flight (default ${DEFAULT_CONCURRENCY})

Under PowerShell, prefer the npm scripts: \`npm run characterize:site -- --check\` does NOT work,
because PowerShell eats the \`--\` and the script sees an empty argv.`;

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
export const fetchDataCommit = async (repoUrl, branch) => {
    const slug = githubSlug(repoUrl);
    if (!slug || !branch) return null;

    try {
        const res = await fetch(`https://api.github.com/repos/${slug}/commits/${encodeURIComponent(branch)}`, {
            headers: {
                Accept: "application/vnd.github+json",
                // Unauthenticated api.github.com allows 60 requests an hour PER
                // IP, and a GitHub-hosted runner's IP is shared with everyone
                // else's job — so without this the field would most often be
                // null exactly where it is worth having. Absent locally, where
                // one request per run is nowhere near the limit.
                ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
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
                + `still emitted before trusting any baseline captured from this server.`);
        }

        // prod_prod is the only environment whose TEMPLATE output differs from
        // its data-branch siblings, so it gets its own key.
        return { ...env, key: env.hugoEnv === "prod_prod" ? "prod_prod" : env.dataBranch };

    } finally {
        await page.close();
    }
};

// The baseline keys that already exist on disk, for an error message that tells
// you what you could have pointed at instead.
const existingBaselines = () => {
    if (!existsSync(BASELINE_ROOT)) return [];
    return readdirSync(BASELINE_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(`${BASELINE_ROOT}/${d.name}/${META_FILE}`))
        .map((d) => d.name);
};

const browserUserAgent = async (browser) => {
    const page = await browser.newPage();
    const ua = await page.evaluate(() => navigator.userAgent);
    await page.close();
    return ua.replace("HeadlessChrome", "Chrome");
};

const main = async () => {

    const { all, baseline, check, content, out, concurrency } = parseArgs(process.argv.slice(2));

    if ([baseline, check, Boolean(out)].filter(Boolean).length !== 1) {
        console.error(USAGE);
        process.exit(2);
    }

    const { baseURL, stop, pagefind, hugo } = await ensureDevServer();

    // The server's own path prefix (/dev-stage/, /IndicatorPublic/, ...). Every
    // probe that reads a URL strips it, so a record describes the site rather
    // than the environment that served it.
    const prefix = new URL(baseURL).pathname;

    const browser = await chromium.launch({ headless: true });

    // Which baseline this server belongs to, read from the running site BEFORE
    // sweeping — pointing at the wrong environment then costs one page load
    // rather than a full capture.
    let env;

    try {
        env = await readEnvironment(browser, baseURL);
    } catch (e) {
        await browser.close();
        await stop();
        console.error(String(e.message ?? e));
        process.exit(2);
    }

    const baselineDir = `${BASELINE_ROOT}/${env.key}`;
    const outDir = out || (baseline ? baselineDir : CURRENT_DIR);

    let baselineMeta = null;

    if (check) {
        if (!existsSync(`${baselineDir}/${META_FILE}`)) {
            await browser.close();
            await stop();
            const have = existingBaselines();
            console.error(
                `No baseline for "${env.key}" — looked in ${baselineDir}/.
` +
                `  hugo environment: ${env.hugoEnv}
` +
                `  EHDP-data branch: ${env.dataBranch}

` +
                `Capture one with --baseline against this server, or point DE_BASE_URL at an
` +
                `environment that has one. Baselines present: ${have.length ? have.join(", ") : "(none)"}`);
            process.exit(2);
        }
        baselineMeta = JSON.parse(readFileSync(`${baselineDir}/${META_FILE}`, "utf8"));

        // Comparing a searched site against a search-less one (or the reverse)
        // moves controls.button and controls.input on every page, which buries
        // anything real under 925 diffs. Refuse the comparison and name the fix
        // rather than spend a full sweep producing noise. Baselines captured
        // before this field existed have `pagefind` undefined; those are not
        // gated, since we cannot know which state they hold.
        if (baselineMeta.pagefind !== undefined && baselineMeta.pagefind !== pagefind) {
            await browser.close();
            await stop();
            console.error(
                `Pagefind mismatch: this server ${pagefind ? "serves" : "does not serve"} the search `
                + `index, the "${env.key}" baseline was captured ${baselineMeta.pagefind ? "with" : "without"} it.
`
                + `Every page would differ on controls.button and controls.input.

`
                + (pagefind
                    ? `Re-capture the baseline with --baseline, or point DE_BASE_URL at a server without the index.`
                    : `Build it: npx -y pagefind --site docs   (against this server's publishDir, then re-run)`));
            process.exit(2);
        }
    }

    // Once per run, before the sweep. A failure costs at most the 5s timeout and
    // changes nothing else about the run.
    const dataCommit = await fetchDataCommit(env.dataRepo, env.dataBranch);

    console.log(`Environment: ${env.hugoEnv} (EHDP-data ${env.dataBranch}) at ${prefix} `
        + `— baseline "${env.key}" — pagefind ${pagefind ? "served" : "ABSENT"}`
        + `
Hugo: ${hugo?.version ?? "unknown"}`
        + `${hugo?.owned ? "" : " (this checkout's pinned binary — the server was not started by this process)"}`
        // Printed rather than inferred: DEFAULT_CONCURRENCY is derived from the
        // machine, so the same command runs at a different width on a developer
        // box and on a CI runner, and two sweep timings are not comparable
        // without knowing which width each was taken at.
        + `
Concurrency: ${concurrency} (${availableParallelism()} logical processors)`
        + `
EHDP-data: ${env.dataBranch} @ `
        + (dataCommit
            ? `${dataCommit.sha.slice(0, 10)} (${dataCommit.date?.slice(0, 10) ?? "date unknown"})`
            : "unknown"));

    const paths = all ? await collectAllPaths(baseURL) : SAMPLE;
    const userAgent = await browserUserAgent(browser);

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    let done = 0;
    let failed = 0;
    let unsettled = [];
    let consoleErrorTotal = 0;
    let rawHashedAssets = 0;

    // Sweeps `paths` into `dir` at `concurrency`, accumulating the run stats
    // above. Extracted so --baseline can run it twice: one sweep cannot tell an
    // anomalous capture from a real one, and two disagreeing sweeps can.
    const sweep = (dir, at) => mapPool(paths, at, async (path) => {

            const result = await capturePage(browser, baseURL, path, userAgent, prefix);
            write(dir, result);

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

    let arbitrated = [];
    let cleared = [];
    let capped = false;

    try {
        await sweep(outDir, concurrency);

        // --baseline arbitrates against a second sweep. A baseline entry taken
        // from an anomalous capture would fail every check from then on, so it
        // is worth a second pass on an operation this rare.
        if (baseline && !failed) {
            const verifyDir = `${DIFF_DIR}/verify`;
            rmSync(verifyDir, { recursive: true, force: true });
            mkdirSync(verifyDir, { recursive: true });

            console.log("\nVerifying the baseline against a second sweep...");
            done = 0;
            await sweep(verifyDir, concurrency);

            arbitrated = differingPaths(outDir, verifyDir);
            if (arbitrated.length) {
                console.log(`${arbitrated.length} page(s) disagreed between sweeps — re-capturing sequentially:`);
                for (const p of arbitrated) console.log(`      ${p || "(home)"}`);
                await recapture(browser, baseURL, userAgent, prefix, outDir, arbitrated);
            }
            rmSync(verifyDir, { recursive: true, force: true });
        }

        // --check arbitrates only what differs from the baseline. A page that
        // agrees on a calm sequential re-capture was contending, not changed.
        if (check && !failed) {
            const captured = all ? null : new Set(
                walk(outDir).filter((rel) => rel !== META_FILE));
            const suspect = differingPaths(baselineDir, outDir, captured);
            if (suspect.length > ARBITRATION_CAP) {
                capped = true;
                console.log(`\n${suspect.length} page(s) differ from the baseline — past the `
                    + `${ARBITRATION_CAP}-page arbitration cap, so they are reported as captured `
                    + `and NOT re-captured sequentially. A capture race does not reach this many `
                    + `pages at once; a difference this wide is systematic. Nothing below is `
                    + `arbitrated, so treat every page named as a real difference.`);
            } else if (suspect.length) {
                console.log(`\n${suspect.length} page(s) differ from the baseline — re-capturing sequentially before reporting.`);
                await recapture(browser, baseURL, userAgent, prefix, outDir, suspect);
                arbitrated = suspect;
                const still = new Set(differingPaths(baselineDir, outDir, captured));
                cleared = suspect.filter((p) => !still.has(p));
            }
        }

    } finally {
        await browser.close();
        await stop();
    }

    console.log(`\nCaptured ${done - failed}/${paths.length} pages into ${outDir}`);
    console.log(`Fingerprinted asset references seen (strip control): ${rawHashedAssets}`);
    console.log(`Console errors across the sweep (NOT baselined — that is smoke's job): ${consoleErrorTotal}`);

    // A page that hit the quiescence cap was measured mid-change, so its record
    // is the one to suspect first when the baseline churns. Named, not counted:
    // a count cannot tell you which page to go and look at.
    // A page that answers non-200 is not necessarily a failure — 404.html is in
    // the --all set on purpose — but a sample entry that has always 404'd is
    // invisible otherwise. zh/data-stories/geographies/ was one, from Task 1
    // until 2026-08-24: it was added to stop `lang` reading constant, and the
    // 404 page renders lang="en", so it contributed nothing while looking like
    // coverage.
    const nonOk = walk(outDir)
        .filter((rel) => rel !== META_FILE)
        .map((rel) => JSON.parse(readFileSync(`${outDir}/${rel}`, "utf8")))
        .filter((r) => r.status !== 200);

    if (nonOk.length) {
        console.log(`
${nonOk.length} page(s) did not answer 200:`);
        for (const r of nonOk) console.log(`      ${r.status}  ${r.path || "(home)"}`);
    }

    if (unsettled.length) {
        console.log(`\n${unsettled.length} page(s) never reached DOM quiescence and were captured at the cap:`);
        for (const p of unsettled) console.log(`      ${p}`);
    } else {
        console.log("Every page reached DOM quiescence before the cap.");
    }

    if (failed) {
        console.error(`\n${failed} page(s) failed to load — not writing a baseline or a verdict from a partial sweep.`);
        process.exitCode = 1;
        return;
    }

    // Provenance for the capture, not only for a committed baseline. A --check
    // tree is what the CI failure artifact carries, and without this it is 925
    // records with nothing saying which commit, environment, data branch or Hugo
    // produced them — on a 14-day artifact retention, where the console log that
    // prints the same facts is a separate object with its own lifetime
    // `[2026-08-25: the base-control artifact from run 32905347134, downloaded
    // and inventoried]`.
    //
    // Every enumeration here already skips META_FILE, so nothing downstream has
    // to learn about the new file. NOT written for --out, which is the one mode
    // that chooses its own path: an --out tree under BASELINE_ROOT carrying a
    // _meta.json would register as a baseline key — baselineKeys() accepts any
    // directory holding one — and so would let --out mint a baseline without the
    // second sweep --baseline arbitrates against.
    if (!out) {
        writeMeta(outDir, { prefix, pages: paths.length, all, arbitrated, cleared, capped, env, pagefind, hugo, dataCommit });
    }

    if (baseline) {
        console.log(`\nBaseline written to ${outDir}/ against ${prefix} at ${gitHead()?.slice(0, 10)} — commit it.`);
        console.log(arbitrated.length
            ? `${arbitrated.length} page(s) needed sequential arbitration; their records came from that pass.`
            : "Both sweeps agreed on every page — no arbitration was needed.");
        return;
    }

    if (!check) return;

    // The gated sections. `content` is always captured and always committed;
    // --content only widens what the check refuses to let through.
    const keys = content ? ["structure", "content"] : ["structure"];

    // In sample mode the baseline is a superset of what was captured, so both
    // sides are projected through the INTERSECTION. In --all mode `only` is null
    // and a page missing from the run still shows up as a deletion, which is a
    // real regression worth failing on.
    //
    // The intersection rather than the captured set, because the sample contains
    // pages the baseline cannot: `--all` enumerates from sitemap.xml, which lists
    // no query strings, so data-explorer/asthma/?id=2380 has no baseline record
    // and would otherwise fail every sample check as an addition. Those pages are
    // named rather than silently dropped — an unmatched page is uncovered, and a
    // check that quietly ignores what it cannot compare is the failure this whole
    // harness is built against.
    let only = null;
    let unmatched = [];

    if (!all) {
        const captured = walk(CURRENT_DIR).filter((rel) => rel !== META_FILE);
        const inBaseline = new Set(walk(baselineDir).filter((rel) => rel !== META_FILE));
        only = new Set(captured.filter((rel) => inBaseline.has(rel)));
        unmatched = captured.filter((rel) => !inBaseline.has(rel));
    }

    if (unmatched.length) {
        console.log(`
${unmatched.length} sample page(s) have no record in this baseline and were `
            + `NOT compared:`);
        for (const rel of unmatched) {
            console.log(`      ${JSON.parse(readFileSync(`${CURRENT_DIR}/${rel}`, "utf8")).path}`);
        }
    }

    project(baselineDir, `${DIFF_DIR}/base`, keys, only);
    project(CURRENT_DIR, `${DIFF_DIR}/head`, keys, only);

    if (cleared.length) {
        console.log(`\n${cleared.length} page(s) differed under concurrency but matched on a sequential `
            + `re-capture, so they are reported rather than failed:`);
        for (const p of cleared) console.log(`      ${p || "(home)"}`);
    }

    console.log(`\nDiffing ${keys.join(" + ")} against the baseline captured at `
        + `${baselineMeta.gitHead?.slice(0, 10)} (${baselineMeta.capturedAt})`);

    // The field-level summary, computed from the two projected trees before the
    // raw diff runs so it lands ABOVE it in the log. `git diff` stays the
    // authority on pass/fail — this only describes what it is about to print.
    const rels = [...new Set([...walk(`${DIFF_DIR}/base`), ...walk(`${DIFF_DIR}/head`)])];
    const rows = summarize(`${DIFF_DIR}/base`, `${DIFF_DIR}/head`, rels);
    let driftMd = null;
    if (rows.length) console.log(renderText(rows, rels.length));

    try {
        execFileSync("git", ["diff", "--no-index", "--exit-code", `${DIFF_DIR}/base`, `${DIFF_DIR}/head`],
            { stdio: "inherit" });
        console.log(`\nCharacterization check PASSED — ${keys.length > 1 ? "both halves" : "the structure half"} `
            + `matches the baseline.`);
    } catch {
        console.error(`\nCharacterization check FAILED — the summary above names every changed field; `
            + `the raw diff follows it.`);
        if (!content) {
            console.error(`(Only ${keys.join(" + ")} was compared. Re-run with --content to include titles, `
                + `heading text and link targets.)`);
        }

        // Did the data move, or did I? Both metas describe the same environment
        // by construction — --check refuses a cross-environment comparison — so
        // the commit is the only thing here that can differ. Silent when either
        // side has no dataCommit, which includes every baseline captured before
        // the field existed, and silent on a green run because this whole block
        // is the failure path.
        const wasSha = baselineMeta.dataCommit?.sha;
        const nowSha = dataCommit?.sha;
        if (wasSha && nowSha) {
            const short = (x) => x.slice(0, 10);
            const slug = githubSlug(env.dataRepo);
            if (wasSha === nowSha) {
                console.error(`
EHDP-data has NOT moved since the baseline (${short(wasSha)}) — the data is not the explanation.`);
                driftMd = `**EHDP-data has not moved** since the baseline (\`${short(wasSha)}\`), `
                    + `so the data is not the explanation.
`;
            } else {
                const compare = slug ? `https://github.com/${slug}/compare/${wasSha}...${nowSha}` : null;
                console.error(`
EHDP-data moved since the baseline: ${short(wasSha)} -> ${short(nowSha)}`
                    + (compare ? `
      ${compare}` : ""));
                driftMd = `**EHDP-data moved** since the baseline: \`${short(wasSha)}\` -> \`${short(nowSha)}\``
                    + (compare ? ` ([compare](${compare}))` : "") + `
`;
            }
        }

        // Two independent comparisons of the same two trees, so disagreement
        // means the summary is blind to something git can see — which would
        // otherwise be invisible, because the raw diff below still prints it and
        // the run still fails. Say so rather than let a silent gap accumulate.
        if (!rows.length) {
            console.error(`\nWARNING: git found a difference and the field summary found none. `
                + `The summary is not seeing everything the diff sees — read the raw diff, and treat `
                + `site-characterization-summary.mjs as suspect.`);
        }

        // GitHub renders this on the run page, so a red run is legible without
        // opening the log. Unset locally, which is what keeps local output
        // identical either way.
        if (process.env.GITHUB_STEP_SUMMARY && rows.length) {
            appendFileSync(process.env.GITHUB_STEP_SUMMARY,
                renderMarkdown(rows, rels.length) + (driftMd ? `
${driftMd}` : ""));
        }

        process.exitCode = 1;
    }
};

// Only sweep when run directly. CAPTURE and capturePage() are imported by the
// probe controls, and an unguarded main() would start a full sweep on import.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
