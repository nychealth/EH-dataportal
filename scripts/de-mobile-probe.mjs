// Phone-layout probe for the data explorer (documents/de-mobile-layout-options-2026-11-05.md).
// For each viewport and view: which elements scroll vertically, and whether "Change dataset",
// the three mobile dropdowns and the legend are reachable — scrolled into view, then hit-tested
// at their centre. Fails on a second vertical scroller (beyond the allowed table ones) or on any
// target that is covered. Usage: node scripts/de-mobile-probe.mjs [WIDTHxHEIGHT ...]
import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

const PAGE = "data-explorer/asthma/?id=2380";
const VIEWS = ["none", "bar", "trend", "correlate", "table"];
const DEFAULT_SIZES = ["375x812", "360x640"];

// DataTables' own body and the table's checkbox boxes are allowed to scroll: Task 6 decides
// whether they stay.
const ALLOWED_SCROLLERS = [".dataTables_scrollBody", ".de-table-optionbox"];

const TARGETS = {
    "Change dataset": ".mobile-details-header .indicator-selector-trigger",
    "Measure": "#measureOptionsDropdownButton1",
    "Boundary": "#geoOptionsDropdownButton1",
    "Time": "#timeOptionsDropdownButton1",
    "Legend": ".de-legend",
};

// Runs in the page. Returns the vertical scrollers and each target's reachability.
function measure({ targets, allowed }) {
    const name = el => el === document.scrollingElement ? "page"
        : el.id ? `#${el.id}` : `.${String(el.className).trim().split(/\s+/)[0]}`;
    const scrollers = [document.scrollingElement, ...document.querySelectorAll("body *")]
        .filter(el => {
            if (el.scrollHeight <= el.clientHeight + 1) return false;
            if (el === document.scrollingElement) return true;
            const r = el.getBoundingClientRect();
            return r.height > 0 && /(auto|scroll)/.test(getComputedStyle(el).overflowY);
        })
        .map(el => ({ name: name(el), allowed: allowed.some(s => el.matches(s)) }));
    const reach = {};
    for (const [label, sel] of Object.entries(targets)) {
        const el = document.querySelector(sel);
        if (!el || el.getBoundingClientRect().height === 0) { reach[label] = "hidden"; continue; }
        el.scrollIntoView({ block: "center" });
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        reach[label] = hit && (el === hit || el.contains(hit)) ? "ok" : "covered";
    }
    return { scrollers, reach, docWidth: document.documentElement.scrollWidth, vw: innerWidth };
}

const sizes = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SIZES)
    .map(s => s.split("x").map(Number));
if (sizes.some(([w, h]) => !w || !h)) { console.error("Sizes are WIDTHxHEIGHT"); process.exit(2); }

const server = await ensureDevServer();
const browser = await chromium.launch();
let failures = 0;
try {
    for (const [width, height] of sizes) {
        for (const view of VIEWS) {
            const page = await browser.newPage({ viewport: { width, height } });
            await page.goto(`${server.baseURL}${PAGE}&overlay=${view}`, { waitUntil: "load" });
            await page.waitForTimeout(2500);
            // Open the details so the dropdowns exist to test, as a user would. The toggle is
            // d-lg-none, so at 960px and wider it is hidden and the targets read "hidden".
            const toggle = page.locator(".mobile-details-toggle");
            if (await toggle.isVisible()) {
                await toggle.click();
                await page.waitForTimeout(500);
            }
            const m = await page.evaluate(measure, { targets: TARGETS, allowed: ALLOWED_SCROLLERS });
            const extra = m.scrollers.filter(s => !s.allowed);
            const covered = Object.entries(m.reach).filter(([, v]) => v === "covered").map(([k]) => k);
            const wide = m.docWidth > m.vw;
            const ok = extra.length <= 1 && covered.length === 0 && !wide;
            if (!ok) failures++;
            console.log(`${ok ? "PASS" : "FAIL"} ${width}x${height} ${view.padEnd(9)} `
                + `scrollers=[${m.scrollers.map(s => s.name + (s.allowed ? "*" : "")).join(", ")}] `
                + `covered=[${covered.join(", ")}]${wide ? ` pageWidth=${m.docWidth}` : ""}`);
            await page.close();
        }
    }
} finally {
    await browser.close();
    await server.stop();
}
console.log(`${failures} failing of ${sizes.length * VIEWS.length}`);
process.exitCode = failures ? 1 : 0;
