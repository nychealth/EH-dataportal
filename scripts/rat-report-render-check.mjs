// Check that each rat-report chart DISPLAYS the data it was given.
//
//   node scripts/rat-report-render-check.mjs              every slot in chart-map.json
//   node scripts/rat-report-render-check.mjs table-6-1    one slot
//
// WHY THIS EXISTS, AND WHY rat-report-charts.mjs's OWN PROOF CANNOT DO IT.
// That script verifies a push by comparing the chart's published dataset.csv
// against the next/*.csv it uploaded. That comparison is sound and it passes:
// on 2026-09-21 all 32 live datasets were byte-identical to their CSV, with
// each one checked against a neighbouring slot's CSV as the control. It is also
// blind to the defect that made this file necessary.
//
// A Datawrapper chart stores hand-edits made in its UI as metadata.data.changes
// — a list of cell overrides keyed by (row, column) rather than by content. A
// copy inherits them. The rat report's charts are produced by copying last
// year's, and this year's data has more rows than the edits were made against,
// so an inherited override lands on a different cell than the one it was
// written for and the chart draws a value that is in neither the new data nor
// the old row it came from. Measured 2026-09-21: all 32 charts carried such
// overrides, 1 to 177 each, and 9 of them rendered 64 cells that were not the
// data they had been given — table-6-1's rows 1-3 showed the previous row's
// figures, table-2-4 showed table-2-3's percentages, and four charts dropped
// the minus sign from a percentage-change column.
//
// The overrides live in metadata, not in the data, so no dataset comparison
// reaches them. Only rendering the chart does. This runs before `apply`, which
// is the step that puts these chart ids on the live page.
//
// THE ROW ALIGNMENT IS THE WHOLE INSTRUMENT, so it is read rather than
// inferred. metadata.data.horizontal-header decides whether the drawn <thead>
// IS uploaded row 0 (true) or a header Datawrapper synthesised from the column
// names, with every uploaded row shifted down one (false). Comparing without
// that offset mismatches nearly every cell and reports ~28 false defects per
// chart, which is what a first version of this check did. Row counts cannot
// substitute for reading the flag, because pagination also changes them.
//
// WHAT FAILS THE RUN is a difference in a cell that holds DATA, or a row the
// chart never drew. A difference in a header cell is reported and does not
// fail: on a horizontal-header chart uploaded row 0 is the heading text, where
// an inherited override is usually doing something wanted — supplying "Period"
// for a column the CSV leaves blank, or correcting table-5a-5's duplicated
// `Failed (#)` to `Failed (%)`. There is no allowlist of excused cells; the
// distinction is positional, so a data cell can never be quietly excused.
//
// NO TOKEN. Everything here is the public CDN, so this needs no credentials and
// writes nothing. It is read-only against Datawrapper by construction.
//
// ARGUMENTS ARE POSITIONAL, and an argument starting with `-` is rejected
// rather than half-honoured — same contract and same reason as
// rat-report-charts.mjs.
//
// NO process.exit() ANYWHERE AFTER A fetch(). On Windows, Node aborts on a
// libuv assertion and returns 127 while every message the script printed stays
// correct. main() returns its code and the caller sets process.exitCode.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const MAP = `${REPO_ROOT}/scripts/rat-report-charts/chart-map.json`;
const CDN = "https://datawrapper.dwcdn.net";

// The harness is fingerprinted by some CDN edges and Datawrapper's own page
// serves a 403 to an obvious HeadlessChrome UA, so send a normal Chrome one.
// Same reasoning as scripts/smoke-pages.mjs, which de-headlesses for
// forecast7.com.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Long enough for Datawrapper's Svelte table to finish drawing. Read at 4s and
// again at 3.5s on 2026-09-21 over the same chart: identical cells both times,
// so this is not timing the render — but a shorter wait was not tested.
const SETTLE_MS = 3500;

function usage(message) {
    console.error(message);
    console.error("");
    console.error("Usage: node scripts/rat-report-render-check.mjs [slot]");
    console.error("  With no argument, checks every slot in chart-map.json.");
    console.error("  Needs no DATAWRAPPER_TOKEN — it reads the public CDN only.");
    return 2;
}

// ---------------------------------------------------------------------------
// Reading one chart
// ---------------------------------------------------------------------------

// /<id>/1/ is a 239-byte JS+meta redirect stub naming the current version, not
// the chart. A "first 200 wins" version walk reads the stub and then compares
// against whatever it happens to hold, so resolve the version explicitly.
async function currentVersion(request, id) {
    const res = await request.get(`${CDN}/${id}/1/`);
    if (!res.ok()) throw new Error(`${id}: the version stub returned ${res.status()}`);
    const match = (await res.text()).match(new RegExp(`dwcdn\\.net/${id}/(\\d+)/`));
    // A stub with no redirect in it IS version 1 — that is what /1/ serves
    // before a chart has been republished.
    return match ? match[1] : "1";
}

async function uploadedGrid(request, id, ver) {
    const res = await request.get(`${CDN}/${id}/${ver}/dataset.csv`);
    if (!res.ok()) throw new Error(`${id} v${ver}: dataset.csv returned ${res.status()}`);
    return (await res.text())
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.split("\t"));
}

async function horizontalHeader(request, id, ver) {
    const res = await request.get(`${CDN}/${id}/${ver}/`);
    if (!res.ok()) throw new Error(`${id} v${ver}: the chart page returned ${res.status()}`);
    // The page carries its chart JSON inside a JS string literal, so each quote
    // is preceded by a backslash. \\* tolerates none or several rather than
    // assuming one level of escaping, which is what silently returned zero
    // matches on all 32 charts the first time this was written.
    const match = (await res.text()).match(/\\*"horizontal-header\\*":(true|false)/);
    // Refused rather than defaulted: this flag sets the row alignment, and a
    // guessed alignment turns every cell into a false defect.
    if (!match) throw new Error(`${id} v${ver}: horizontal-header did not parse; the page shape moved`);
    return match[1] === "true";
}

async function renderedGrid(page, id, ver) {
    await page.goto(`${CDN}/${id}/${ver}/`, { waitUntil: "load" });
    await page.waitForTimeout(SETTLE_MS);
    const grid = await page.evaluate(() => {
        const table = document.querySelector("table");
        if (!table) return null;
        return [...table.querySelectorAll("tr")].map((tr) =>
            [...tr.children].map((cell) => cell.textContent.replace(/\s+/g, " ").trim()));
    });
    if (!grid) throw new Error(`${id} v${ver}: the page drew no <table>`);
    return grid;
}

// ---------------------------------------------------------------------------
// Comparing
// ---------------------------------------------------------------------------

// Three differences are the chart's formatting rather than its content, and all
// three are normalised away: it groups thousands, it draws a real minus
// (U+2212) where the CSV has a hyphen, and a column formatted as a percentage
// appends the `%` the CSV omits — `8` in the data is drawn as `8%` on 11 slots,
// and scoring those as defects reported 77 false positives.
//
// What is deliberately NOT normalised is a sign present on one side and absent
// on the other. `26%` against `-26%` inverts what the cell means, and four
// charts were drawing exactly that.
//
// The trailing `%` is stripped from both sides, so this cannot detect a column
// whose percent format was lost. That is a whole-column setting rather than a
// per-cell value, so it cannot hide a wrong number in some rows and not others
// — which is the class this check exists for.
function normalize(value) {
    return value.replace(/[,\s]/g, "").replace(/−/g, "-").replace(/%$/, "");
}

function compareSlot({ slot, id, ver, rendered, uploaded, hhdr }) {
    const offset = hhdr ? 0 : 1;
    const rows = Math.min(rendered.length - offset, uploaded.length);

    const dataDiffs = [];
    const headerDiffs = [];
    let cellsCompared = 0;

    for (let r = 0; r < rows; r++) {
        const drawn = rendered[r + offset];
        const cols = Math.min(drawn.length, uploaded[r].length);
        for (let c = 0; c < cols; c++) {
            cellsCompared += 1;
            if (normalize(drawn[c]) === normalize(uploaded[r][c])) continue;
            const diff = { row: r, col: c, shows: drawn[c], uploaded: uploaded[r][c] };
            // Uploaded row 0 is heading text only when the chart is told to read
            // it that way; on every other chart it is the first data row.
            (hhdr && r === 0 ? headerDiffs : dataDiffs).push(diff);
        }
    }

    // A row the chart never drew is hidden behind a pagination arrow, which is
    // a different fault from a wrong cell and is invisible in a cell diff — the
    // rows that ARE drawn all match. It gets counted separately.
    const hiddenRows = Math.max(0, uploaded.length - (rendered.length - offset));

    return { slot, id, ver, hhdr, cellsCompared, dataDiffs, headerDiffs, hiddenRows };
}

// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);

    const flag = args.find((a) => a.startsWith("-"));
    if (flag) return usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (args.length > 1) return usage(`Expected at most one slot name, got ${args.length} arguments.`);

    const map = JSON.parse(readFileSync(MAP, "utf8"));
    const [only] = args;
    if (only !== undefined && !(only in map)) {
        return usage(`"${only}" is not a slot in chart-map.json.`);
    }
    const slots = only === undefined ? Object.keys(map) : [only];

    console.log(`${slots.length} slot(s) to render, from scripts/rat-report-charts/chart-map.json`);
    console.log("Reading the public CDN only; no token is used and nothing is written.\n");

    const browser = await chromium.launch();
    const context = await browser.newContext({ userAgent: UA });
    const results = [];

    try {
        for (const slot of slots) {
            const id = map[slot].to;
            const page = await context.newPage();
            try {
                const ver = await currentVersion(context.request, id);
                const [uploaded, hhdr] = await Promise.all([
                    uploadedGrid(context.request, id, ver),
                    horizontalHeader(context.request, id, ver),
                ]);
                const rendered = await renderedGrid(page, id, ver);
                const result = compareSlot({ slot, id, ver, rendered, uploaded, hhdr });
                results.push(result);

                const verdict = result.dataDiffs.length || result.hiddenRows ? "FAIL" : "ok  ";
                console.log(`  ${verdict} ${slot.padEnd(14)} ${id} v${ver}  hhdr=${String(hhdr).padEnd(5)} `
                    + `${result.cellsCompared} cells, ${result.dataDiffs.length} data diff(s), `
                    + `${result.headerDiffs.length} header diff(s), ${result.hiddenRows} row(s) hidden`);
            } finally {
                await page.close();
            }
        }
    } finally {
        await browser.close();
    }

    // A slot that compared no cells is a broken read, not a pass. Without this
    // an empty grid on both sides reports "0 diffs" in the same voice as a
    // chart that was actually checked.
    const empty = results.filter((r) => r.cellsCompared === 0);
    const failed = results.filter((r) => r.dataDiffs.length || r.hiddenRows);

    console.log("");
    console.log(`slots rendered        : ${results.length}`);
    console.log(`cells compared        : ${results.reduce((n, r) => n + r.cellsCompared, 0)}`);
    console.log(`slots failing         : ${failed.length}`);
    console.log(`data cells wrong      : ${failed.reduce((n, r) => n + r.dataDiffs.length, 0)}`);
    console.log(`rows hidden           : ${results.reduce((n, r) => n + r.hiddenRows, 0)}`);
    console.log(`header cells differing: ${results.reduce((n, r) => n + r.headerDiffs.length, 0)} (reported, not failing)`);
    console.log(`slots comparing 0 cells: ${empty.length} (must be 0)`);

    for (const r of results.filter((x) => x.headerDiffs.length)) {
        console.log(`\n${r.slot} (${r.id} v${r.ver}) header text, not a failure:`);
        for (const d of r.headerDiffs) {
            console.log(`  col ${d.col}: shows ${JSON.stringify(d.shows)}, data has ${JSON.stringify(d.uploaded)}`);
        }
    }

    for (const r of failed) {
        console.log(`\n${r.slot} (${r.id} v${r.ver}) FAILS — ${r.dataDiffs.length} data cell(s)`
            + `${r.hiddenRows ? `, ${r.hiddenRows} row(s) hidden behind a pagination arrow` : ""}:`);
        for (const d of r.dataDiffs) {
            console.log(`  row ${d.row} col ${d.col}: shows ${JSON.stringify(d.shows)}, `
                + `data has ${JSON.stringify(d.uploaded)}`);
        }
    }

    if (empty.length) {
        console.log(`\n${empty.length} slot(s) compared no cells at all — the read is broken, not clean:`);
        for (const r of empty) console.log(`  ${r.slot} (${r.id} v${r.ver})`);
        return 1;
    }

    if (failed.length) {
        console.log(`\n${failed.length} of ${results.length} slot(s) do not display the data they were given.`);
        console.log("Do not run `apply` until this is zero. See documents/"
            + "rat-report-2026-update-plan-2026-09-14.md, Task 3, for what clears the overrides.");
        return 1;
    }

    console.log(`\nAll ${results.length} slot(s) display the data they were given.`);
    return 0;
}

main().then(
    (code) => { process.exitCode = code; },
    (err) => {
        console.error(`\n${err.message}`);
        process.exitCode = 1;
    },
);
