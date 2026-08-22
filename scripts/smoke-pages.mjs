// Console-error smoke test. Fails on any console `error` or `pageerror` that
// isn't in the allowlist below.
//
// It exists to catch what a clean `hugo` build cannot: the site's browser JS is
// loaded as classic <script> tags sharing one global scope, so a bad edit throws
// at load time while the build still succeeds. Run it before merging anything
// that touches a shared template (head.html, baseof.html, the header/footer
// partials) or any file under assets/js/.
//
// Two modes:
//   npm run smoke        one page per template kind (the PAGES list), sequential
//   npm run smoke:all    every page the site serves, concurrent — for a
//                        pre-merge or pre-deploy sweep
//
//   node scripts/smoke-pages.mjs --all --concurrency 12
//   DE_BASE_URL="http://localhost:1313/dev-prod/" npm run smoke   # existing server
//
// NOTE: `npm run smoke -- --all` does NOT work under PowerShell, which eats the
// `--` and leaves the script with an empty argv. That is why --all has its own
// npm script rather than being a forwarded flag.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";
import { collectAllPaths, mapPool } from "./site-urls.mjs";

// One page per template kind, prefix-relative — joined onto whatever baseURL
// ensureDevServer() returns.
//
// Every comment names the template that renders that URL, taken from the content
// file's own frontmatter rather than from the URL's shape: a comment claiming the
// wrong template is how a page ends up with zero coverage while looking covered.
// The list favours templates that load map/chart libraries, since those are the
// ones that break when head.html's gating changes.
const PAGES = [
    "",                                             // index.html — home
    "data-explorer/",                               // data-explorer/section.html — topic chooser
    "data-explorer/asthma/",                        // data-explorer/single.html — the SPA, no ?id=
    "data-explorer/asthma/?id=2380",                // data-explorer/single.html — indicator loaded from the URL
    "data-explorer/data-index/",                    // data-index layout — builds topic_indicators.json
    "data-explorer/indicator-catalog/",             // indicator-catalog layout
    "data-stories/",                                // data-stories/section.html
    "data-stories/housing/",                        // data-stories/single.html — Vega + Datawrapper embeds
    "data-stories/cold/",                           // cold layout — bundled standalone HTML
    "data-stories/urban-heat-island/",              // uhi layout
    "data-stories/block-by-block/",                 // bbb layout
    "data-stories/air-quality-snapshots/",          // flexible layout
    "data-features/",                               // data-features/section.html
    "data-features/flood-vulnerability-index/",     // fvi layout — Leaflet, colorIcon/easyButton
    "data-features/rat-mitigation-zones/",          // rmz layout — Leaflet, colorIcon/easyButton
    "data-features/realtime-air-quality/",          // realtime layout — third-party AirNow widget
    "data-features/find-your-uhf/",                 // neighborhood-overlap layout — Leaflet + geocoder
    "data-features/rats-in-your-neighborhood/",     // rats-in-your-neighborhood layout — Leaflet
    "data-features/congestion-pricing-report/",     // congestion-pricing-report layout — Leaflet + easyButton, Vega, D3
    "data-features/heat-report-archive/2021/",      // report layout
    "neighborhood-reports/",                        // neighborhood-reports/section.html — NR landing
    "neighborhood-reports/active_design_physical_activity_and_health/",  // topiclanding layout
    "neighborhood-reports/bayside_little_neck/",                         // nr-output/section.html
    "neighborhood-reports/bayside_little_neck/asthma_and_the_environment/", // nr-output/single.html — the report itself
    "key-topics/",                                  // key-topics/section.html
    "key-topics/airquality/",                       // key-topics/single.html
    "about/",                                       // about/section.html
    "about/publications/",                          // about/single.html
    "resources/",                                   // resources/section.html
    "resources/sugar-lookup/",                      // sugar layout
    "take-action/",                                 // take-action/section.html
    "take-action/email-electeds/",                  // email-electeds layout
    "search-results/",                              // search-results/single.html — Pagefind
];

// Pre-existing console noise that is NOT a regression. Every entry must name the
// page it excuses and what was observed, so fixing that bug is what removes the
// entry — the allowlist trends to zero.
//
// `page` scopes an exemption to the page(s) where the cause was actually
// identified. A bug-specific signature must NOT be excused site-wide, or a real
// regression producing the same text elsewhere is silently swallowed. Reserve
// `page: null` for generic dev-server noise that is benign everywhere.
//
// --all mode makes this rule load-bearing rather than tidy: it covers hundreds of
// pages nothing has ever loaded, so it WILL surface unfamiliar errors. Quieting
// one of them with a new `page: null` entry disables that check across the whole
// site. Scope the entry to the page, or fix the bug.
const KNOWN_NOISE = [
    // urban-heat-island embeds two Google Maps Street View iframes
    // (data-stories/uhi.html:63 and :73). Street View asks for the accelerometer
    // for device-orientation panning, which the embed doesn't grant via `allow=`,
    // so Chromium logs one violation per iframe. Two iframes, two errors, and the
    // maps render regardless — only device-orientation panning is unavailable.
    { page: /urban-heat-island/, error: /Permissions policy violation: accelerometer/i },
    // realtime-air-quality embeds the AirNow widget (widget.airnow.gov), which
    // makes a cross-origin XHR to airnowgovapi.com that the API serves without
    // an Access-Control-Allow-Origin header. Third-party embed, not our request.
    { page: /realtime-air-quality/, error: /airnowgovapi\.com|widget\.airnow\.gov/i },
    // The signup <iframe> in partials/header.html embeds a Google Form, which
    // Google serves with a report-only `frame-ancestors 'none'`. Chromium logs
    // the refusal on every page that renders the header. Report-only, so nothing
    // is blocked — but it does mean the embed itself never renders.
    { page: null, error: /frame-ancestors|Framing 'https:\/\/docs\.google\.com\//i },
    // Generic dev-server resource noise: Pagefind's index isn't built by
    // `hugo server`, and favicons/404s of that kind say nothing about the page.
    // CAUTION: the broad `Failed to load resource` entry also hides the *cause*
    // of a blocked script, leaving only a downstream "X is not defined". When
    // diagnosing one of those, re-run with this entry commented out.
    { page: null, error: /pagefind|favicon|Failed to load resource|net::ERR/i },
];

const isKnownNoise = (text, path) =>
    KNOWN_NOISE.some(({ page, error }) => error.test(text) && (page === null || page.test(path)));

// Default browser concurrency for --all. Six pages against one `hugo server`
// leaves headroom on a machine that is also being used for something else;
// --concurrency raises it.
const DEFAULT_CONCURRENCY = 6;

// Minimal flag parsing — three flags do not justify a dependency.
const parseArgs = (argv) => {
    const all = argv.includes("--all");
    const at = (flag) => {
        const i = argv.indexOf(flag);
        return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
    };
    return {
        all,
        concurrency: Number(at("--concurrency")) || (all ? DEFAULT_CONCURRENCY : 1),
        report: at("--report"),
    };
};

// Load one page and return the unexpected console errors it produced.
const visit = async (browser, baseURL, path) => {
    const page = await browser.newPage();
    const errors = [];

    page.on("console", (msg) => {
        if (msg.type() === "error" && !isKnownNoise(msg.text(), path)) errors.push(msg.text());
    });
    page.on("pageerror", (err) => {
        if (!isKnownNoise(err.message, path)) errors.push(err.message);
    });

    try {
        // "load" rather than "networkidle": pages embedding third-party
        // iframes that poll continuously (Datawrapper, the AirNow widget)
        // never reach networkidle and would time out. The settle delay
        // lets deferred scripts surface errors that fire after load.
        await page.goto(baseURL + path, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(2000);
    } catch (e) {
        errors.push(`navigation failed: ${e.message}`);
    }

    await page.close();
    return errors;
};

const label = (path) => path || "(home)";

// Group failures by exact error text, so a summary shows at a glance whether one
// error is site-wide or confined to a single template. Grouping on exact text
// rather than a normalised form keeps the summary honest: two errors shown as
// one signature really are the same string.
const groupSignatures = (failures) => {
    const groups = new Map();
    for (const { path, errors } of failures) {
        for (const error of errors) {
            if (!groups.has(error)) groups.set(error, []);
            groups.get(error).push(path);
        }
    }
    return [...groups.entries()]
        .map(([error, pages]) => ({ error, count: pages.length, pages }))
        .sort((a, b) => b.count - a.count);
};

const writeReport = (target, report) => {
    // A path ending in .json is a file; anything else is a directory to timestamp
    // into, which is how the npm script uses it.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = target.endsWith(".json") ? target : `${target.replace(/\/?$/, "/")}smoke-${stamp}.json`;
    mkdirSync(file.replace(/[^/\\]+$/, ""), { recursive: true });
    writeFileSync(file, JSON.stringify(report, null, 4));
    console.log(`\nReport written to ${file}`);
};

const gitHead = () => {
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    } catch {
        return null;
    }
};

const main = async () => {

    const { all, concurrency, report } = parseArgs(process.argv.slice(2));
    const { baseURL, stop } = await ensureDevServer();
    const paths = all ? await collectAllPaths(baseURL) : PAGES;
    const browser = await chromium.launch({ headless: true });

    let failures = [];
    let cleared = [];

    try {
        let done = 0;
        const results = await mapPool(paths, concurrency, async (path) => {
            const errors = await visit(browser, baseURL, path);
            done++;

            if (errors.length) {
                console.error(`FAIL  ${label(path)}`);
                for (const e of errors) console.error(`        ${e}`);
            } else if (!all) {
                // --all would print hundreds of `ok` lines, drowning the failures.
                console.log(`ok    ${label(path)}`);
            }

            if (all && done % 50 === 0) console.log(`      ... ${done}/${paths.length}`);
            return { path, errors };
        });

        failures = results.filter((r) => r.errors.length);

        // Concurrency introduces a failure mode sequential runs don't have: several
        // pages contending for one `hugo server`'s on-demand render can push a slow
        // page past the navigation timeout. Re-check every failure sequentially
        // before reporting it, so the sweep doesn't cry wolf. Skipped when
        // concurrency is 1, where there is no contention to rule out.
        if (concurrency > 1 && failures.length) {
            console.log(`\nRe-checking ${failures.length} failing page(s) sequentially...`);
            const rechecked = [];
            for (const { path } of failures) {
                const errors = await visit(browser, baseURL, path);
                if (errors.length) rechecked.push({ path, errors });
                else cleared.push(path);
            }
            failures = rechecked;
        }
    } finally {
        await browser.close();
        await stop();
    }

    const signatures = groupSignatures(failures);

    if (cleared.length) {
        console.log(`\n${cleared.length} page(s) failed under concurrency but were clean on a sequential re-run:`);
        for (const p of cleared) console.log(`      ${label(p)}`);
    }

    if (signatures.length) {
        console.error(`\nDistinct error signatures (${signatures.length}):`);
        for (const { error, count, pages } of signatures) {
            console.error(`  ${String(count).padStart(4)}x  ${error.split("\n")[0].slice(0, 160)}`);
            console.error(`        e.g. ${pages.slice(0, 3).map(label).join(", ")}${pages.length > 3 ? ", ..." : ""}`);
        }
    }

    if (report) {
        writeReport(report, {
            timestamp: new Date().toISOString(),
            baseURL,
            mode: all ? "all" : "curated",
            concurrency,
            gitHead: gitHead(),
            pagesChecked: paths.length,
            clearedOnRecheck: cleared,
            failures,
            signatures,
        });
    }

    if (failures.length) {
        console.error(`\nSmoke test FAILED — ${failures.length} of ${paths.length} page(s) had unexpected console errors.`);
        process.exitCode = 1;
    } else {
        console.log(`\nSmoke test PASSED — ${paths.length} pages clean (known noise allowlisted).`);
    }

};

main();
