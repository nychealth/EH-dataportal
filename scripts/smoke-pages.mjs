// Console-error smoke test. Fails on any console `error` or `pageerror` that
// isn't in the allowlist below.
//
// It exists to catch what a clean `hugo` build cannot: the site's browser JS is
// loaded as classic <script> tags sharing one global scope, so a bad edit throws
// at load time while the build still succeeds. Run it before merging anything
// that touches a shared template (head.html, baseof.html, the header/footer
// partials) or any file under assets/js/.
//
// Three modes. The first two take whatever server dev-server.mjs resolves; the
// third picks the environment itself, through scripts/smoke-env.mjs.
//   npm run smoke             one page per template kind (the PAGES list), sequential
//   npm run smoke:all         every page the site serves, concurrent — for a
//                             pre-merge or pre-deploy sweep
//   npm run smoke:env <env>   every page, against an isolated server for ONE
//                             named Hugo environment (see smoke-env.mjs)
//
//   node scripts/smoke-pages.mjs --all --concurrency 12
//   DE_BASE_URL="http://localhost:1313/dev-prod/" npm run smoke   # existing server
//
// NOTE: `npm run smoke -- --all` does NOT work under PowerShell, which eats the
// `--` and leaves the script with an empty argv. That is why --all has its own
// npm script rather than being a forwarded flag.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
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
    "neighborhood-reports/active_design_physical_activity_and_health/",  // nr-topic-index.html — Option D kept the
                                                    // URL and changed what renders it; topiclanding.html is retired
    "neighborhood-reports/bayside_little_neck/",                         // nr-neighborhood-index.html
    "neighborhood-reports/bayside_little_neck/asthma_and_the_environment/", // nr-report.html — the report itself
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
    // displacement-risk iframes NYC City Planning's Equitable Development Data
    // Explorer (equitableexplorer.planning.nyc.gov, displacement.html:33), whose
    // CARTO basemap key was rejected as of 2026-08-31: "Unauthorized access to
    // Maps API: invalid combination of user ('planninglabs') and apiKey ...".
    // Third-party embed we don't control; the surrounding page renders. Verified
    // present on production's own tip via the smoke base-control job on PR #1489.
    // Remove this when the embed loads again.
    { page: /displacement-risk/, error: /Unauthorized access to Maps API/i },
    // The signup <iframe> in partials/header.html embeds a Google Form, which
    // Google serves with a report-only `frame-ancestors 'none'`. Chromium logs
    // the refusal on every page that renders the header. Report-only, so nothing
    // is blocked — but it does mean the embed itself never renders.
    { page: null, error: /frame-ancestors|Framing 'https:\/\/docs\.google\.com\//i },
    // Pagefind, allowlisted only when its index is genuinely absent. `hugo
    // server` does not build one, but dev-server.mjs now does for any server it
    // starts, so the index is present on the common path and a pagefind error
    // there is a real regression rather than dev-server noise.
    //
    // What this entry hides when it does apply, measured by removing the index
    // from a server that had it: three to four errors per page — the css and js
    // both `Refused to ...` on a text/plain 404, then `PagefindUI is not
    // defined` `[2026-08-24]`. That last one is the downstream symptom the
    // CAUTION below is about, and it was being masked on every page.
    { page: null, error: /pagefind/i, when: () => !pagefindServed },
    // Generic dev-server resource noise: favicons and 404s of that kind say
    // nothing about the page.
    // CAUTION: the broad `Failed to load resource` entry also hides the *cause*
    // of a blocked script, leaving only a downstream "X is not defined". When
    // diagnosing one of those, re-run with this entry commented out.
    { page: null, error: /favicon|Failed to load resource|net::ERR/i },
];

// Whether the server under test serves Pagefind's index. Set once from
// ensureDevServer() before any page is visited; read by the conditional entry
// above, which is why it is module scope rather than threaded through visit().
let pagefindServed = false;

const isKnownNoise = (text, path) =>
    KNOWN_NOISE.some(({ page, error, when }) =>
        error.test(text) && (page === null || page.test(path)) && (when === undefined || when()));

// Hosts whose requests visit() aborts before they leave the browser.
//
// One host, where site-characterization.mjs blocks four. The difference is what
// each harness records: that one baselines injected DOM, so Google Translate
// churns it by injecting on Google's network timing, and blocking Translate buys
// stability. Smoke records console errors, not DOM, so Translate is not a churn
// source here. Block only what has an outward side effect.
//
// gtag is that side effect, and it is NOT confined to prod_prod: head.html
// emits a gtag/js script on every environment — G-64BWDRHRGB under prod_prod,
// G-PB98MPZ31B from the `else` branch everywhere else. So an unblocked sweep
// reports one page view per page to a real analytics property whichever
// environment it runs against. Blocking by HOST rather than by id covers both,
// and covers a third party that loads its own container: the AirNow widget on
// data-features/realtime-air-quality/ pulls gtm.js?id=GTM-L8ZB, which is why
// that page aborts two requests where every other page aborts one
// `[measured 2026-08-26, prod_prod: unblocked, that page fetched five
// googletagmanager URLs and all five returned 200]`.
//
// Only the external script is aborted, so the inline gtag() block still runs and
// stays under test. The aborted request logs one console error per abort —
// `Failed to load resource: net::ERR_FAILED`, which does not name the host —
// and the broad `/favicon|Failed to load resource|net::ERR/i` entry above
// already swallows it, so this adds no failures. That entry is also the one
// whose CAUTION warns it hides the *cause* of a blocked script: if a run ever
// shows an unexplained "X is not defined", check this list before the allowlist.
const BLOCKED_HOSTS = [
    "www.googletagmanager.com",
];

// Default browser concurrency for --all. Derived from the machine rather than
// fixed, and the same formula site-characterization.mjs uses, so the repo's two
// sweeps behave alike on the same box — the cores available differ by an order
// of magnitude between a dev workstation and a GitHub Actions runner, and a
// number tuned for one starves or overcommits the other.
//
// The bounds come from a measurement of the OTHER harness, not this one:
// 925 pages, three interleaved sweeps, 12 -> 198s, 24 -> 114s, 12 -> 199s
// `[2026-08-24, 24 logical processors]`. That transfers as far as the mechanism
// does — both harnesses drive one chromium instance with browser.newPage() per
// URL — and no further. This harness adds a fixed 2s settle per page that the
// other does not have, which puts a floor under any wall time here. 6 is the
// value this file ran at before 2026-08-26; 24 is the highest tried anywhere in
// the repo. Raising the ceiling means measuring above it first.
const CONCURRENCY_FLOOR = 6;
const CONCURRENCY_CEILING = 24;
const DEFAULT_CONCURRENCY = Math.min(
    CONCURRENCY_CEILING,
    Math.max(CONCURRENCY_FLOOR, availableParallelism()),
);

// How many concurrent failures get a sequential re-check before the harness
// stops re-checking and says so. Same cap, for the same reason, as
// site-characterization.mjs's re-capture limit.
//
// A capture race does not reach hundreds of pages at once, so a failure that
// wide is systematic — and systematic is precisely what this harness exists to
// catch: one bad edit to head.html or a file under assets/js/ throws on every
// page. Each re-visit carries the fixed 2s settle below, so re-checking ~925
// pages sequentially is 31 minutes at an absolute floor, and the run reports
// nothing until it finishes. The characterization harness hit exactly this: a
// one-line template edit that moved `lang` on every page sent its CI job into a
// 12-minute sequential re-capture of all 925 and it hit `timeout-minutes: 20`
// having reported nothing `[run 32802721473, 2026-08-25]`.
const RECHECK_CAP = 25;

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

// Playwright's default UA says "HeadlessChrome", and some third-party endpoints
// refuse it — which surfaces as a page bug rather than a harness one. forecast7.com
// (Cloudflare) answers 403 to that UA and 200 with an Access-Control-Allow-Origin
// header to a normal Chrome one, so the weatherwidget.io embed on
// data-features/heat-syndrome/ reported a CORS failure and rendered at zero height
// under the sweep while working for real visitors, on production and locally alike
// [verified 2026-08-22: same browser, same run — default UA 3 errors / iframe 0px,
// de-headlessed UA 0 errors / 211px; curl to forecast7 403 vs 200].
//
// Dropping "Headless" is enough; deriving it from the browser's own default keeps
// it correct across Chromium bumps. No first-party JS reads navigator.userAgent,
// so this changes nothing about how the site's own code runs.
const browserUserAgent = async (browser) => {
    const page = await browser.newPage();
    const ua = await page.evaluate(() => navigator.userAgent);
    await page.close();
    return ua.replace("HeadlessChrome", "Chrome");
};

// Load one page and return the unexpected console errors it produced.
const visit = async (browser, baseURL, path, userAgent) => {
    const page = await browser.newPage({ userAgent });
    const errors = [];

    page.on("console", (msg) => {
        if (msg.type() === "error" && !isKnownNoise(msg.text(), path)) errors.push(msg.text());
    });
    page.on("pageerror", (err) => {
        if (!isKnownNoise(err.message, path)) errors.push(err.message);
    });

    // Registered before navigating, so the very first request is covered.
    await page.route("**/*", (route) => {
        const host = new URL(route.request().url()).host;
        return BLOCKED_HOSTS.includes(host) ? route.abort() : route.continue();
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

// The commit of the SITE UNDER TEST, which is not always the commit this
// process runs from. A base-control CI job runs the harness out of the PR's
// checkout while the site it sweeps is built from base/, so `git rev-parse
// HEAD` there names the harness rather than the site — and the two artifacts
// then agree on the one field meant to tell them apart `[run 33019503991,
// 2026-08-26: the sweep's report and the base's both recorded edf2e17299, the
// PR merge ref]`. That job passes the base sha in; everywhere else the working
// directory IS the site's tree and the git call is right.
const gitHead = () => {
    const declared = process.env.SITE_UNDER_TEST_COMMIT;
    if (declared) return declared;
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    } catch {
        return null;
    }
};

const main = async () => {

    const { all, concurrency, report } = parseArgs(process.argv.slice(2));
    const { baseURL, stop, pagefind } = await ensureDevServer();
    pagefindServed = pagefind;
    console.log(`Pagefind index: ${pagefind ? "served" : "ABSENT — its errors are allowlisted"}`);
    const paths = all ? await collectAllPaths(baseURL) : PAGES;
    const browser = await chromium.launch({ headless: true });
    const userAgent = await browserUserAgent(browser);

    let failures = [];
    let cleared = [];
    // True when the sequential re-check was skipped outright because more pages
    // failed than RECHECK_CAP, which makes every failure below a plain
    // concurrent result with nothing ruling out contention.
    let capped = false;

    try {
        let done = 0;
        const results = await mapPool(paths, concurrency, async (path) => {
            const errors = await visit(browser, baseURL, path, userAgent);
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

        // Concurrency introduces a failure mode sequential runs don't have: a page
        // can time out under a concurrent sweep and pass on its own. Re-check every
        // failure sequentially before reporting it, so the sweep doesn't cry wolf.
        // Skipped when concurrency is 1, where there is nothing to rule out.
        //
        // WHY that happens is NOT established. This comment used to attribute it to
        // "several pages contending for one `hugo server`'s on-demand render" — never
        // measured, and it does not hold up: at concurrency 6 against 1 over 12 pages,
        // navigation slowed 1.34x, JS settle time 1.00x, and all 12 reached identical
        // final DOM states `[2026-08-23]`. The re-check is a guard for an unexplained
        // flake, not a fix for a known cause. site-characterization.mjs hit the same
        // wall and reaches for the same guard.
        if (concurrency > 1 && failures.length > RECHECK_CAP) {
            capped = true;
            console.log(`\n${failures.length} page(s) failed — past the ${RECHECK_CAP}-page re-check `
                + `cap, so they are reported as swept and NOT re-checked sequentially. A capture `
                + `race does not reach this many pages at once; a failure this wide is systematic. `
                + `Nothing below is arbitrated, so treat every page named as a real failure.`);
        } else if (concurrency > 1 && failures.length) {
            console.log(`\nRe-checking ${failures.length} failing page(s) sequentially...`);
            const rechecked = [];
            for (const { path } of failures) {
                const errors = await visit(browser, baseURL, path, userAgent);
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
            // `clearedOnRecheck` is the subset that failed concurrently and was
            // clean sequentially — contention rather than a real error.
            // `recheckCapped` says that re-check was skipped altogether, so a
            // consumer knows nothing here was arbitrated.
            clearedOnRecheck: cleared,
            recheckCapped: capped,
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
