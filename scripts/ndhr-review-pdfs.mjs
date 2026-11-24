// ======================================================================= //
// ndhr-review-pdfs.mjs
// ======================================================================= //

// Saves the NYC Healthy Places Toolkit pages as PDFs that look like the screen, for
// reviewers to read and mark up.
//
// Printing from the browser does not give that. The report page has its own print
// stylesheet, inherited from Neighborhood Reports, that prints a compact table in place
// of the page (no map, no left column, no charts); and at Letter width every page lays
// out at Bootstrap's narrow breakpoint, so columns stack as they do on a phone. This
// script renders with SCREEN media at a 1280px desktop width, then scales that onto
// Letter pages, so the PDF is the page a reviewer would see on a laptop.
//
// Usage — POSITIONAL arguments only, for the PowerShell/npm reason in CLAUDE.md:
//   node scripts/ndhr-review-pdfs.mjs                      landing, 5 category pages,
//                                                          and midtown's index + 5 reports
//   node scripts/ndhr-review-pdfs.mjs east_harlem bushwick the same, for those districts
//   node scripts/ndhr-review-pdfs.mjs midtown collapsed    leave report rows closed
//
// The district argument is the slug in the URL (/nyc-healthy-places-toolkit/<slug>/).
// Report rows are expanded by default so each indicator's chart and comparison text are
// in the PDF; `collapsed` prints them as a visitor first sees them.
//
// Server: scripts/dev-server.mjs, so the rules in CLAUDE.md apply — it reuses a server on
// :8080/:8081/:1313 or starts a dev_stage one (staging data). Set DE_BASE_URL to choose.
// Output: review-pdfs/<date>/ at the repo root (git-ignored), or REVIEW_PDF_OUT.

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";
import fs from "node:fs";
import path from "node:path";


// ----------------------------------------------------------------------- //
// arguments
// ----------------------------------------------------------------------- //

const args = process.argv.slice(2);

// A flag here would arrive as a bare value after npm/PowerShell strip it, so refuse it
if (args.some(a => a.startsWith("-"))) {
    console.error("Positional arguments only: node scripts/ndhr-review-pdfs.mjs [district ...] [collapsed]");
    process.exit(2);
}

const collapsed = args.includes("collapsed");
const districts = args.filter(a => a !== "collapsed");

if (districts.length === 0) {
    districts.push("midtown");
}


// ----------------------------------------------------------------------- //
// page list
// ----------------------------------------------------------------------- //

// Category slugs, read from the same file the content adapter crosses with the districts
const SECTION = "nyc-healthy-places-toolkit/";
const categoriesYml = fs.readFileSync("data/globals/NDHR_categories.yml", "utf8");
const categorySlugs = [...categoriesYml.matchAll(/^\s+slug:\s*"?([a-z0-9-]+)"?\s*$/gm)].map(m => m[1]);

if (categorySlugs.length === 0) {
    console.error("Read no category slugs from data/globals/NDHR_categories.yml — has its shape changed?");
    process.exit(2);
}

// Numbered so the files sort in reading order: landing, categories, then each district
const pages = [{ name: "01-landing", url: SECTION }];

categorySlugs.forEach((slug, i) => {
    pages.push({ name: `02-category-${i + 1}-${slug}`, url: `${SECTION}${slug}/` });
});

districts.forEach((district, d) => {
    const n = String(d + 3).padStart(2, "0");
    pages.push({ name: `${n}-${district}-0-index`, url: `${SECTION}${district}/` });
    categorySlugs.forEach((slug, i) => {
        pages.push({ name: `${n}-${district}-${i + 1}-${slug}`, url: `${SECTION}${district}/${slug}/`, report: true });
    });
});


// ----------------------------------------------------------------------- //
// rendering
// ----------------------------------------------------------------------- //

// Letter with 0.4in margins leaves 7.7in = 739.2 CSS px of width. Scaling by this factor
// makes Chromium lay the page out at exactly the 1280px viewport, so nothing (the Leaflet
// maps especially, which size their tiles once) has to reflow between screen and PDF
const VIEWPORT_WIDTH = 1280;
const MARGIN = "0.4in";
const SCALE = (7.7 * 96) / VIEWPORT_WIDTH;

// Keep cards, maps and indicator rows whole across page breaks. Screen media is emulated,
// so this is the only print-time rule applied. Each report row's expanded panel is avoided
// as a whole: putting the rule on the chart itself, a flex child, made Chromium paint the
// chart over the strategy box below it where the row straddled a page
const BREAK_CSS = `
    .card, .leaflet-container, img, figure,
    .ndhr-report-accordion .collapse { break-inside: avoid; }
    h1, h2, h3, h4 { break-after: avoid; }
`;

// Waits for network traffic to settle, without failing a page that never quite goes quiet
const settle = async page => {
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
};

// Opens every closed indicator row on a report page so its chart renders
const expandReportRows = async page => {
    await page.waitForSelector(".ndhr-report-accordion .card-header", { timeout: 20000 });
    const buttons = page.locator('.ndhr-report-accordion button[data-toggle="collapse"][aria-expanded="false"]');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
        await buttons.nth(0).click();
        await page.waitForTimeout(400);
    }

    // Bootstrap animates each panel open; a PDF taken mid-animation clips the panel at
    // its transitional height, so wait until none is still collapsing
    await page.waitForFunction(() => !document.querySelector(".collapsing"), null, { timeout: 15000 });

    // The last click leaves a focus ring and a hover tint on its row header
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.mouse.move(0, 0);

    return count;
};

const outDir = process.env.REVIEW_PDF_OUT
    || path.join("review-pdfs", new Date().toISOString().slice(0, 10));
fs.mkdirSync(outDir, { recursive: true });

const { baseURL, stop } = await ensureDevServer();
const browser = await chromium.launch({ headless: true });

try {

    console.log(`Server: ${baseURL}\nOutput: ${path.resolve(outDir)}\n`);

    for (const p of pages) {

        const page = await browser.newPage({ viewport: { width: VIEWPORT_WIDTH, height: 1000 } });

        await page.goto(baseURL + p.url, { waitUntil: "load", timeout: 60000 });
        await settle(page);

        let note = "";
        if (p.report && !collapsed) {
            note = ` (${await expandReportRows(page)} rows expanded)`;
            await settle(page);
        }

        await page.addStyleTag({ content: BREAK_CSS });
        await page.emulateMedia({ media: "screen" });

        const file = path.join(outDir, `${p.name}.pdf`);
        await page.pdf({
            path: file,
            format: "Letter",
            scale: SCALE,
            printBackground: true,
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        });

        console.log(`  ${p.name}.pdf${note}`);
        await page.close();

    }

} finally {
    await browser.close();
    await stop();
}
