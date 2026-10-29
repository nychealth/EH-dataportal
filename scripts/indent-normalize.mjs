// Re-indents files that mix 2- and 4-space regions to 4 spaces, from their leading
// whitespace alone. The follow-up to indent-rescale.mjs, which could only take files
// written at one width (documents/js-formatting-pass-2026-10-19.md, step 8 and its
// Decisions row).
//
// Each line's depth comes from the line above it. An indentation increase after a
// line that opens something — `{`, `(`, `[`, `=>`, a Hugo `}}`, a tag's `>`, `case …:`
// — is nesting and becomes one 4-space level, and so is a JS line opening with `.` or
// an operator (a `.then` chain). An increase after a line that ends something — `;`,
// `}`, `]`, `)`, a closing tag, a comment — is a stray indent and the line becomes a
// sibling. Any other increase is a continuation (a tag's attributes split over lines)
// and keeps its offset from its parent. Every level is then put on a multiple of 4,
// except a block comment's interior and a ternary chain, which keep their alignment.
// A dedent returns to the level it matches. Rules fitted to Chris's hand pass over
// these files (2026-10-27, step 8's row).
//
// Applied at 91aa287079 (step 8b), and kept as the record of how. It refuses to run,
// either way, on a tree that already holds that commit: the files have since had a
// hand pass, which a re-run would re-indent. On a tree from before it:
//
//   node scripts/indent-normalize.mjs            # re-indent every file in FILES
//   node scripts/indent-normalize.mjs --verify   # check each against HEAD; must exit 0
//
// Left alone: lines inside a multi-line template literal (their whitespace is part
// of the string) and inside <pre>/<textarea>, and tab-indented lines.
//
// An orphan is a dedent landing between two open levels, which means the source
// indentation was already wrong there — usually a closing tag at the wrong depth.
// It is kept at its old offset from the enclosing level and printed, for a hand pass.
//
// --verify re-applies the transform to HEAD's copy and requires the working file to
// equal it, then checks that every line's text past its leading whitespace is
// unchanged and, in JS and <script> bodies, that espree's token stream is too.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as espree from "espree";
import { maskHugo, scriptRegions } from "./html-script-bodies.mjs";


// ----- the files: those whose share of +2 among +2/+4 indentation increases was ----- //
// ----- 0.197–0.963 at 42233d7169 (step 8's row)                                   ----- //

const FILES = [
    "assets/scss/_c-custom-mixins.scss",
    "assets/scss/_de-custom.scss",
    "content/data-features/cooling-info/cooling-info.js",
    "content/data-features/flood-vulnerability-index/fvi.js",
    "content/data-features/healthy-homes-info/source/assets/css/main.css",
    "content/data-features/heat-syndrome/heatsyndrome.js",
    "content/data-features/neighborhood-air-quality/aqe.js",
    "content/data-features/proximity/proximity.js",
    "content/data-features/rat-mitigation-zones/rmz.js",
    "themes/dohmh/layouts/about/section.html",
    "themes/dohmh/layouts/about/single.html",
    "themes/dohmh/layouts/data-features/asthma-syndrome.html",
    "themes/dohmh/layouts/data-features/cooling-info.html",
    "themes/dohmh/layouts/data-features/fvi.html",
    "themes/dohmh/layouts/data-features/healthy-homes.html",
    "themes/dohmh/layouts/data-features/heatstory.html",
    "themes/dohmh/layouts/data-features/hvi.html",
    "themes/dohmh/layouts/data-features/proximity.html",
    "themes/dohmh/layouts/data-features/realtime.html",
    "themes/dohmh/layouts/data-features/restaurant-grades.html",
    "themes/dohmh/layouts/data-features/syndromic.html",
    "themes/dohmh/layouts/data-stories/bbb.html",
    "themes/dohmh/layouts/index.html",
    "themes/dohmh/layouts/neighborhood-reports/section.html",
    "themes/dohmh/layouts/partials/nr-indicator-names-hidden.html",
    "themes/dohmh/layouts/partials/nr-neighborhood-picker.html",
    "themes/dohmh/layouts/partials/nr-report-footer-sm.html",
    "themes/dohmh/layouts/partials/nyccas_pollutant_maps.html",
    "themes/dohmh/layouts/partials/nyccas_pollutant_table.html",
    "themes/dohmh/layouts/partials/nyccas_pollutant_trends.html",
    "themes/dohmh/layouts/partials/overlap-tool-with-map.html",
    "themes/dohmh/layouts/partials/structured-data.html",
    "themes/dohmh/layouts/resources/sugar.html",
    "themes/dohmh/layouts/shortcodes/csvtable.html",
    "themes/dohmh/layouts/take-action/dialog.html",
    "themes/dohmh/layouts/take-action/section.html",
];


// ----- what a line above can open ----- //

// A closing tag ends in `>` too, so a line starting `</` opens nothing
const opensLevel = (t) =>
    /[{([]$/.test(t) || /=>$/.test(t) || /}}$/.test(t)
    || (/>$/.test(t) && !t.startsWith("</"))
    || /^(case\b.*|default):$/.test(t);

// A line that ends a statement, a rule, an element or a comment: an increase after it
// is a stray indent, not a continuation
const endsSomething = (t) =>
    /[;}\])]$/.test(t) || t.startsWith("</") || /<\/[\w-]+>$/.test(t)
    || /^(\/\/|<!--|\/\*|\*)/.test(t) || /(\*\/|-->)$/.test(t);

// A JS line opening with `.` or an operator continues the statement above it, even
// when that one ends in `)` — `fetch(x)` then `.then(…)`
const continuesStatement = (t) => /^(\.|\|\||&&|\+|-[^-]|\?|:)/.test(t);


// ----- the JS in a file, and the lines its multi-line template literals cover ----- //

const jsRegions = (path, text, lines) =>
    path.endsWith(".html") ? scriptRegions(text) : path.endsWith(".js") ? [[0, lines.length]] : [];

// A layout's body, each Hugo action masked by its role; null when it does not parse
const parseJs = (body) => {
    try {
        return espree.parse(maskHugo(body), { ecmaVersion: "latest", sourceType: "script", loc: true, tokens: true });
    } catch (e) {
        return null;
    }
};

const tokenStream = (ast) => ast.tokens.map((t) => t.type + " " + t.value).join("\n");


// ----- the transform ----- //

const normalize = (path, text) => {

    const lines = text.split("\n");
    const frozen = new Set();
    const inJs = new Set();
    const parseFailures = [];

    for (const [a, b] of jsRegions(path, text, lines)) {

        for (let i = a; i < b; i++) inJs.add(i);
        const ast = parseJs(lines.slice(a, b).join("\n"));
        if (!ast) { parseFailures.push(a + 1); continue; }

        for (const t of ast.tokens) {
            if (t.type !== "Template") continue;
            for (let ln = t.loc.start.line + 1; ln <= t.loc.end.line; ln++) frozen.add(a + ln - 1);
        }

    }

    if (path.endsWith(".html")) {
        let inPre = false;
        lines.forEach((l, i) => {
            if (inPre) frozen.add(i);
            if (/<(pre|textarea)\b/i.test(l) && !/<\/(pre|textarea)>/i.test(l)) inPre = true;
            if (/<\/(pre|textarea)>/i.test(l)) inPre = false;
        });
    }

    // Each open level: its column in the source, and its column now
    const stack = [{ col: 0, now: 0 }];
    const orphans = [];
    let prevText = "";
    let prevCol = 0;
    let commentOpen = false;

    const out = lines.map((l, i) => {

        if (!l.trim() || frozen.has(i)) return l;
        if (/^ *\t/.test(l)) { prevText = l; return l; }

        const col = l.length - l.trimStart().length;
        const dedent = col < prevCol;
        prevCol = col;
        const t = l.trim();
        const above = prevText.trim();

        // Inside a block comment opened on an earlier line, through its closing line
        const inComment = commentOpen;
        if (!commentOpen && /\/\*|<!--/.test(t) && !/\*\/|-->/.test(t.slice(t.search(/\/\*|<!--/) + 2))) commentOpen = true;
        else if (commentOpen && /\*\/|-->/.test(t)) commentOpen = false;

        while (stack.length > 1 && stack[stack.length - 1].col > col) stack.pop();

        const top = stack[stack.length - 1];

        if (top.col !== col) {

            if (dedent) orphans.push(i + 1);

            // How far this level sits from its parent, before it is put on the grid
            const step = opensLevel(above) ? 4
                : inJs.has(i) && continuesStatement(t) ? 4
                : t.startsWith("*") || inComment ? col - top.col
                : endsSomething(above) ? 0
                : col - top.col;

            // Every level lands on a multiple of 4, except two alignments kept as
            // written: a block comment's interior, and a ternary chain
            let now = top.now + step;
            const aligned = t.startsWith("*") || inComment || /^[?:]/.test(t) || /[?:]$/.test(above);
            if (now % 4 && !aligned) {
                now = Math.round(now / 4) * 4;
                if (step > 0 && now <= top.now) now = top.now + 4;   // an increase stays deeper than its parent
            }

            stack.push({ col, now });

        }

        prevText = l;
        return " ".repeat(stack[stack.length - 1].now) + l.trimStart();

    });

    return { out: out.join("\n"), orphans, parseFailures };

};


// ----- refuse a tree the re-indent already reached ----- //

const APPLIED_AT = "91aa287079";

try {
    execFileSync("git", ["merge-base", "--is-ancestor", APPLIED_AT, "HEAD"]);
    console.error(`Already applied at ${APPLIED_AT}; this tool is a record of step 8, not a re-runnable sweep.`);
    process.exit(2);
} catch (err) {
    // Exit 1 is git's "not an ancestor", the one case to go on; anything else is not an answer
    if (err.status !== 1) throw err;
}


// ----- re-indent, or verify against HEAD ----- //

const verify = process.argv.includes("--verify");
let failures = 0;
let changedLines = 0;
let orphanCount = 0;

for (const path of FILES) {

    const text = readFileSync(path, "utf8");

    if (verify) {

        const head = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 1 << 26 });
        const a = head.split("\n");
        const b = text.split("\n");
        const problems = [];

        if (normalize(path, head).out !== text) problems.push("is not the transform of HEAD");
        if (a.length !== b.length || a.some((l, i) => l.trimStart() !== b[i].trimStart())) problems.push("text past leading whitespace changed");

        jsRegions(path, head, a).forEach(([s, e]) => {
            const before = parseJs(a.slice(s, e).join("\n"));
            const after = parseJs(b.slice(s, e).join("\n"));
            if (before && (!after || tokenStream(before) !== tokenStream(after))) problems.push(`token stream changed in the body at line ${s + 1}`);
        });

        for (const p of problems) console.log(`${path}: ${p}`);
        if (problems.length) failures++;
        continue;

    }

    const { out, orphans, parseFailures } = normalize(path, text);

    for (const n of parseFailures) {
        console.log(`${path}:${n}: JS does not parse, template literals not found`);
        failures++;
    }
    for (const n of orphans) console.log(`${path}:${n}: orphan dedent`);

    orphanCount += orphans.length;
    changedLines += out.split("\n").filter((l, i) => l !== text.split("\n")[i]).length;
    if (!parseFailures.length) writeFileSync(path, out);

}

if (verify) {
    console.log(`${FILES.length} files checked against HEAD; ${failures} failed`);
    process.exit(failures ? 1 : 0);
}
console.log(`${FILES.length - failures} files re-indented; ${changedLines} lines changed; ${orphanCount} orphan dedents`);
process.exit(failures ? 1 : 0);
