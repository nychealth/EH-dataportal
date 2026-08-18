// Console-error smoke test across one page per template kind. Fails on any
// console `error` or `pageerror` that isn't in the allowlist below.
//
// It exists to catch what a clean `hugo` build cannot: the site's browser JS is
// loaded as classic <script> tags sharing one global scope, so a bad edit throws
// at load time while the build still succeeds. Run it before merging anything
// that touches a shared template (head.html, baseof.html, the header/footer
// partials) or any file under assets/js/.
//
//   npm run smoke
//   DE_BASE_URL="http://localhost:1313/dev-prod/" npm run smoke   # existing server

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

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

const main = async () => {

    const { baseURL, stop } = await ensureDevServer();
    const browser = await chromium.launch({ headless: true });
    const failures = [];

    try {
        for (const path of PAGES) {
            const url = baseURL + path;
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
                await page.goto(url, { waitUntil: "load", timeout: 30000 });
                await page.waitForTimeout(2000);
            } catch (e) {
                errors.push(`navigation failed: ${e.message}`);
            }

            if (errors.length) {
                failures.push({ path, errors });
                console.error(`FAIL  ${path || "(home)"}`);
                for (const e of errors) console.error(`        ${e}`);
            } else {
                console.log(`ok    ${path || "(home)"}`);
            }

            await page.close();
        }
    } finally {
        await browser.close();
        await stop();
    }

    if (failures.length) {
        console.error(`\nSmoke test FAILED — ${failures.length} of ${PAGES.length} page(s) had unexpected console errors.`);
        process.exitCode = 1;
    } else {
        console.log(`\nSmoke test PASSED — ${PAGES.length} pages clean (known noise allowlisted).`);
    }

};

main();
