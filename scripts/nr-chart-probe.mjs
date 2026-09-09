// THROWAWAY probe for the Vega-Lite 5 -> 6 evaluation (2026-09-09). Delete after use.
//
// Neighborhood-report charts render only when an indicator accordion is expanded
// (renderNRMap is called from nr-indicator-new.html:251 on 'shown.bs.collapse'),
// so neither smoke nor site-characterization -- both load-only -- ever sees them.
// This expands every collapse on the page and records what renders.
//
// Toggles are clicked through el.click() in page context rather than Playwright's
// click: several are outside the viewport or covered, and Playwright's actionability
// wait times out on them. Bootstrap 4 binds via jQuery delegation, so a synthetic
// click on the element still fires the handler.
//
// Charts are keyed by container id, which nr-indicator-new.html derives from the
// indicator name, so the key is stable across runs and across library versions.
//
// Usage: node scripts/nr-chart-probe.mjs <baseURL> <out.json>

import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2];
const OUT = process.argv[3];

const NEIGHBORHOODS = ["east_harlem", "bayside_little_neck"];
const TOPICS = [
    "active_design_physical_activity_and_health", "asthma_and_the_environment",
    "climate_and_health", "housing_and_health", "outdoor_air_and_health"
];
const PAGES = NEIGHBORHOODS.flatMap((n) => TOPICS.map((t) => `neighborhood-reports/${n}/${t}/`));

// Box dimensions are unreliable here: a collapsed Bootstrap panel reports a zero
// height while still holding a fully rendered chart. The SVG's own width/height
// attributes and its element census do not depend on the panel being open.
const measure = () =>
    [...document.querySelectorAll(".vega-embed")].map((el, i) => {
        const svg = el.querySelector("svg");
        const counts = {};
        if (svg) for (const n of svg.querySelectorAll("*")) counts[n.tagName] = (counts[n.tagName] ?? 0) + 1;
        return {
            key: el.parentElement?.id || el.id || `idx${i}`,
            svgW: svg?.getAttribute("width") ?? null,
            svgH: svg?.getAttribute("height") ?? null,
            elements: Object.fromEntries(Object.entries(counts).sort()),
            textCount: svg ? svg.querySelectorAll("text").length : null
        };
    });

const browser = await chromium.launch();
const probe = await browser.newPage();
const ua = (await probe.evaluate(() => navigator.userAgent)).replace("HeadlessChrome", "Chrome");
await probe.close();

const results = {};
for (const path of PAGES) {
    const page = await browser.newPage({ userAgent: ua, viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => {
        if (m.type() === "error" && !/pagefind/i.test(m.text())) errors.push("console: " + m.text());
    });
    try {
        await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.waitForTimeout(8000);
        const n = await page.evaluate(() => document.querySelectorAll('[data-toggle="collapse"]').length);
        for (let i = 0; i < n; i++) {
            await page.evaluate((idx) => {
                const t = document.querySelectorAll('[data-toggle="collapse"]')[idx];
                if (t) { t.scrollIntoView(); t.click(); }
            }, i);
            await page.waitForTimeout(3500);
        }
        await page.waitForTimeout(3000);
        results[path] = { toggles: n, charts: await page.evaluate(measure), errors };
    } catch (e) {
        results[path] = { toggles: null, charts: [], errors: [...errors, "NAV: " + e.message.slice(0, 120)] };
    }
    await page.close();
    process.stdout.write(`${path} -> ${results[path].toggles} toggles, ${results[path].charts.length} charts, ${results[path].errors.length} errors\n`);
}
await browser.close();
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log("wrote " + OUT);
