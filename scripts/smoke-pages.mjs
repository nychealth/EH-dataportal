// Console-error smoke test across one page per template kind. Fails on any
// console `error` or `pageerror`. Exists because Tier 4.6 shipped bugs that a
// clean `hugo` build and static grep both missed — the old explorer's map was
// broken and four data-features pages threw on colorIcon/easyButton, visible
// only by loading real pages. Runs the same way as the characterization
// check: `npm run smoke` before a merge that touches shared templates.

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

// One page per template kind. Prefix-relative — joined onto whatever baseURL
// ensureDevServer() returns.
//
// Every URL here was resolved against this branch's content tree, and every
// comment names the layout that actually renders it — a comment claiming the
// wrong template kind is how a section page ends up with zero coverage while
// looking covered.
const PAGES = [
    "",                                              // home
    "data-explorer/asthma/?id=2380",                 // data-explorer/single.html — indicator loaded from the URL
    "data-explorer/asthma/",                         // data-explorer/single.html — no ?id=, boots the indicator chooser
    "data-explorer/",                                // data-explorer/section.html — topic chooser
    "data-features/flood-vulnerability-index/",      // fvi layout — easyButton/colorIcon
    "data-features/rats-in-your-neighborhood/",      // KNOWN-RED (see allowlist)
    "data-features/rat-mitigation-zones/",           // rmz layout — easyButton/colorIcon
    "data-features/realtime-air-quality/",           // realtime layout — easyButton/colorIcon
    "data-features/find-your-uhf/",                  // renders neighborhood-overlap.html — sole real easyButton/colorIcon consumer
    "neighborhood-reports/",                         // neighborhood-reports/section.html — NR landing
    "neighborhood-reports/asthma_and_the_environment/",                     // nr-topic-index.html — topic index, server-rendered
                                                     // 42-neighborhood link list. No report renderer on this URL any more.
    "neighborhood-reports/bayside_little_neck/",                            // nr-neighborhood-index.html — generated section page
    "neighborhood-reports/bayside_little_neck/asthma_and_the_environment/", // nr-report.html — generated report page, the report page.
                                                     // Same two URLs as the retired nr-output pages: Option D kept
                                                     // the paths and changed what renders them.
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
    // /data-explorer/ (section.html) includes de-topic-indicators.html, which
    // calls aq.from() at line 75 — but head.html:138 gates Arquero behind
    // `or (eq .Kind "page") (eq .Section "neighborhood-reports")`, and the
    // section page is neither. So the topic/indicator table on the DE landing
    // page is broken. Real, user-facing, pre-existing. site-wide audit §5f.
    // Page-scoped deliberately: `aq is not defined` anywhere else is a
    // regression, not this bug.
    { page: /^data-explorer\/$/, error: /\baq is not defined\b/ },
    // The signup <iframe> in partials/header.html:374 embeds a Google Form, and
    // Google serves it with a report-only `frame-ancestors 'none'`. Chromium
    // logs the refusal on every page that renders the header. Third-party and
    // report-only ("no further action has been taken"), so it's noise here — but
    // it does mean the embed never renders. site-wide audit §5g.
    { page: null, error: /frame-ancestors|Framing 'https:\/\/docs\.google\.com\//i },
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
