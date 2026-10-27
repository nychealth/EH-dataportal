// Rescales the indentation of files written at 2 spaces or with tabs to 4 spaces,
// per the 4-space rule in CLAUDE.md (Coding conventions). Chris chose a rescale
// for now and a structural re-indent as a follow-up (2026-10-27,
// documents/js-formatting-pass-2026-10-19.md, Decisions).
//
// A rescale only multiplies: a 2-space file has every leading run of spaces
// doubled, a tab file has every leading tab replaced by 4 spaces. Nothing is
// computed from nesting, so a file is only safe to rescale when it uses one unit
// throughout. A file mixing 2- and 4-space regions would have its 4-space regions
// pushed to 8, which is why FILES is a list measured per file rather than a test
// run over the tree (the measurement is in the ledger's step 6 row).
//
//   node scripts/indent-rescale.mjs            # rescale every file in FILES
//   node scripts/indent-rescale.mjs --verify   # reverse each against HEAD; must exit 0
//
// --verify halves each doubled run (or turns each 4 spaces back into a tab) and
// requires the result to equal HEAD's bytes, so the diff is proved to be leading
// whitespace and nothing else. What that leaves for a reader: leading whitespace
// inside a multi-line string literal is part of the string. One such literal sits
// in the list, the Vega `calculate` expression in minimum-wage-with-maps.html,
// where whitespace has no meaning.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";


// ----- the files, and the unit each was written in ----- //

const FILES = {
    "assets/js/data-stories/lazy-tab-embeds.js": "tabs",
    "assets/js/site.js": "tabs",
    "assets/scss/_d-enhancements.scss": "two",
    "assets/scss/_f-layout-elements.scss": "two",
    "content/data-features/realtime-air-quality/css/aqe.css": "two",
    "themes/dohmh/layouts/404.html": "two",
    "themes/dohmh/layouts/data-features/24-25-heat-report.html": "two",
    "themes/dohmh/layouts/data-features/minimum-wage-with-maps.html": "two",
    "themes/dohmh/layouts/partials/console-log.html": "two",
    "themes/dohmh/layouts/partials/nyccas_pollutant_trends_new.html": "two",
    "themes/dohmh/layouts/shortcodes/vega0.html": "two",
};


// ----- one line each way ----- //

// A line's leading run: spaces only in a "two" file, tabs and spaces in a "tabs" one.
// A whitespace-only line is left alone in both directions, so as not to grow trailing whitespace
const rescaleLine = (line, unit) => {
    const lead = /^[ \t]*/.exec(line)[0];
    if (!lead || !line.trim()) return line;
    const body = line.slice(lead.length);
    if (unit === "two") {
        if (lead.includes("\t")) throw new Error("tab in a 2-space file");
        return " ".repeat(lead.length * 2) + body;
    }
    return lead.replace(/\t/g, "    ") + body;
};

const reverseLine = (line, unit) => {
    const lead = /^ */.exec(line)[0];
    if (!lead || !line.trim()) return line;
    const body = line.slice(lead.length);

    // An odd run cannot have come from doubling; repeat() would floor it and hide that
    if (unit === "two" && lead.length % 2) return "\0odd lead\0" + line;
    if (unit === "two") return " ".repeat(lead.length / 2) + body;
    return lead.replace(/ {4}/g, "\t") + body;
};


// ----- rescale, or verify against HEAD ----- //

const verify = process.argv.includes("--verify");
let failures = 0;
let changedLines = 0;

for (const [path, unit] of Object.entries(FILES)) {
    const text = readFileSync(path, "utf8");

    if (verify) {
        const head = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 1 << 26 });
        const reversed = text.split("\n").map((l) => reverseLine(l, unit)).join("\n");
        if (reversed !== head) {
            console.log(`${path}: does not reverse to HEAD`);
            failures++;
        }
        continue;
    }

    // A rescale is not idempotent — a second run doubles again — so only a file
    // still at HEAD's bytes is touched
    const dirty = execFileSync("git", ["diff", "--name-only", "HEAD", "--", path], { encoding: "utf8" }).trim();
    if (dirty) {
        console.log(`${path}: differs from HEAD, skipped`);
        failures++;
        continue;
    }

    const lines = text.split("\n");
    const out = lines.map((l) => rescaleLine(l, unit));
    changedLines += out.filter((l, i) => l !== lines[i]).length;
    writeFileSync(path, out.join("\n"));
}

if (verify) {
    console.log(`${Object.keys(FILES).length} files reversed against HEAD; ${failures} failed`);
    process.exit(failures ? 1 : 0);
}
console.log(`${Object.keys(FILES).length - failures} files rescaled; ${changedLines} lines changed`);
process.exit(failures ? 1 : 0);
