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
// A BASELINE IS A FACT ABOUT ONE COMMIT AND ONE ENVIRONMENT. meta.robots alone
// differs on every page between environments (head.html:46-53), so --check
// refuses to run when the server's path prefix does not match the one recorded
// in the baseline's _meta.json.
//
// Plan and ledger: documents/site-characterization-plan-2026-08-23.md

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const BASELINE_DIR = "scripts/site-characterization-baseline";
const CURRENT_DIR = "scripts/site-characterization-current";

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
const differingPaths = (dirA, dirB) => walk(dirA)
    .filter((rel) => rel !== META_FILE)
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

const writeMeta = (dir, { prefix, pages, all }) => {
    writeFileSync(`${dir}/${META_FILE}`, JSON.stringify({
        capturedAt: new Date().toISOString(),
        gitHead: gitHead(),
        prefix,
        mode: all ? "all" : "sample",
        pages,
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
const project = (srcDir, dstDir, keys) => {

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

    const outDir = out || (baseline ? BASELINE_DIR : CURRENT_DIR);

    // Read the baseline's environment BEFORE sweeping, so a mismatch costs a
    // file read rather than a full capture.
    let baselineMeta = null;

    if (check) {
        if (!existsSync(`${BASELINE_DIR}/${META_FILE}`)) {
            console.error(`No baseline at ${BASELINE_DIR}/ — run --baseline first.`);
            process.exit(2);
        }
        baselineMeta = JSON.parse(readFileSync(`${BASELINE_DIR}/${META_FILE}`, "utf8"));
    }

    const { baseURL, stop } = await ensureDevServer();

    // The server's own path prefix (/dev-stage/, /IndicatorPublic/, ...). Every
    // probe that reads a URL strips it, so a record describes the site rather
    // than the environment that served it.
    const prefix = new URL(baseURL).pathname;

    if (baselineMeta && baselineMeta.prefix !== prefix) {
        await stop();
        console.error(
            `Environment mismatch — refusing to check.\n` +
            `  baseline was captured against ${baselineMeta.prefix}\n` +
            `  this server serves            ${prefix}\n\n` +
            `meta.robots alone differs on every page between environments, so this comparison\n` +
            `would report hundreds of changes that are not regressions. Point DE_BASE_URL at a\n` +
            `server matching the baseline, or re-baseline against this one.`);
        process.exit(2);
    }

    const paths = all ? await collectAllPaths(baseURL) : SAMPLE;
    const browser = await chromium.launch({ headless: true });
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
            const suspect = differingPaths(BASELINE_DIR, outDir);
            if (suspect.length) {
                console.log(`\n${suspect.length} page(s) differ from the baseline — re-capturing sequentially before reporting.`);
                await recapture(browser, baseURL, userAgent, prefix, outDir, suspect);
                const still = new Set(differingPaths(BASELINE_DIR, outDir));
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

    if (baseline) {
        writeMeta(outDir, { prefix, pages: paths.length, all, arbitrated });
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

    project(BASELINE_DIR, `${DIFF_DIR}/base`, keys);
    project(CURRENT_DIR, `${DIFF_DIR}/head`, keys);

    if (cleared.length) {
        console.log(`\n${cleared.length} page(s) differed under concurrency but matched on a sequential `
            + `re-capture, so they are reported rather than failed:`);
        for (const p of cleared) console.log(`      ${p || "(home)"}`);
    }

    console.log(`\nDiffing ${keys.join(" + ")} against the baseline captured at `
        + `${baselineMeta.gitHead?.slice(0, 10)} (${baselineMeta.capturedAt})`);

    try {
        execFileSync("git", ["diff", "--no-index", "--exit-code", `${DIFF_DIR}/base`, `${DIFF_DIR}/head`],
            { stdio: "inherit" });
        console.log(`\nCharacterization check PASSED — ${keys.length > 1 ? "both halves" : "the structure half"} `
            + `matches the baseline.`);
    } catch {
        console.error(`\nCharacterization check FAILED — differences shown above.`);
        if (!content) {
            console.error(`(Only ${keys.join(" + ")} was compared. Re-run with --content to include titles, `
                + `heading text and link targets.)`);
        }
        process.exitCode = 1;
    }
};

// Only sweep when run directly. CAPTURE and capturePage() are imported by the
// probe controls, and an unguarded main() would start a full sweep on import.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
