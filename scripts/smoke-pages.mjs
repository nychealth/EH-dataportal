// Console-error smoke test across one page per template kind. Fails on any
// console `error` or `pageerror`. Exists because Tier 4.6 shipped bugs that a
// clean `hugo` build and static grep both missed — the old explorer's map was
// broken and four data-features pages threw on colorIcon/easyButton, visible
// only by loading real pages. Runs the same way as the characterization
// check: `npm run smoke` before a merge that touches shared templates.

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

// One page per template kind, weighted toward Tier 4.6's actual casualties.
// Prefix-relative — joined onto whatever baseURL ensureDevServer() returns.
const PAGES = [
    "",                                              // home
    "data-explorer/asthma/?id=2380",                 // DE single
    "data-explorer/asthma/",                         // DE section
    "data-explorer-old/asthma/?id=2380",             // old explorer single
    "data-features/flood-vulnerability-index/",      // fvi layout — easyButton/colorIcon
    "data-features/rats-in-your-neighborhood/",      // KNOWN-RED (see allowlist)
    "data-features/rat-mitigation-zones/",           // rmz layout — easyButton/colorIcon
    "data-features/realtime-air-quality/",           // realtime layout — easyButton/colorIcon
    "data-features/find-your-uhf/",                  // renders neighborhood-overlap.html — sole real easyButton/colorIcon consumer
    "neighborhood-reports/",                         // NR section
    "neighborhood-reports/bayside_little_neck/asthma_and_the_environment/", // nr-output single report — nr-leaflet standalone + Arquero-built charts
    "data-stories/housing/",                         // KNOWN-RED (see allowlist)
    "take-action/",                                  // take-action
];

// Pre-existing, documented console noise that is NOT a regression. Each entry
// names the page it excuses and the audit section that tracks the real fix, so
// resolving that bug is what removes the entry — the allowlist trends to zero.
//
// `page` scopes the exemption to the known-red page(s): a bug-specific signature
// must NOT be excused site-wide, or a genuine regression producing the same
// error text on another page would be silently swallowed. The negative-SVG
// signature especially — the DE chart pages render Vega-Lite, which throws the
// identical "negative value" text on a real sizing bug. `page: null` is reserved
// for generic dev-only noise that is benign on every page.
const KNOWN_NOISE = [
    // Datawrapper iframe computing NaN/negative size in a hidden Bootstrap tab
    // (data-stories/housing, and off-list redlining/, air-quality-snapshots/,
    // vectorborne-diseases/). The browser's SVG validator reports generic
    // "negative value" attribute errors with no CDN string, so match the
    // signature, not the host — hence the page scope. site-wide audit §5b.
    { page: /data-stories\/housing\//, error: /attribute (?:width|height): A negative value is not valid/i },
    // Any Datawrapper resource-load noise that DOES name the host, same page.
    { page: /data-stories\/housing\//, error: /dwcdn\.net|datawrapper/i },
    // rats-in-your-neighborhood: area.contains() has thrown since 2019 (RawGit
    // fallout). site-wide audit §5c. Remove when that template is fixed.
    { page: /rats-in-your-neighborhood/, error: /area\.contains|is not a function.*contains/i },
    // realtime-air-quality: the embedded AirNow widget (widget.airnow.gov) makes
    // a cross-origin XHR to airnowgovapi.com that is blocked by CORS — a third-
    // party embed we don't control. site-wide audit §5d.
    { page: /realtime-air-quality/, error: /airnowgovapi\.com|widget\.airnow\.gov/i },
    // Generic dev-only resource noise, benign on any page (same set the harness
    // ignores).
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
                // iframes that poll continuously (e.g. Datawrapper on
                // data-stories/housing, §5b) never reach networkidle and would
                // time out. The settle delay lets deferred scripts surface any
                // console errors that fire after load.
                await page.goto(url, { waitUntil: "load", timeout: 30000 });
                await page.waitForTimeout(2000);
            } catch (e) {
                errors.push(`navigation failed: ${e.message}`);
            }

            if (errors.length) {
                failures.push({ path, errors });
                console.error(`FAIL  ${path}`);
                for (const e of errors) console.error(`        ${e}`);
            } else {
                console.log(`ok    ${path}`);
            }

            await page.close();
        }
    } finally {
        await browser.close();
        await stop();
    }

    if (failures.length) {
        console.error(`\nSmoke test FAILED — ${failures.length} page(s) had unexpected console errors.`);
        process.exitCode = 1;
    } else {
        console.log(`\nSmoke test PASSED — ${PAGES.length} pages clean (known noise allowlisted).`);
    }

};

main();
