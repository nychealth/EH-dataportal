// Proves a js-comment-spacing.py run changed no JavaScript tokens.
//
// The script's two grep checks prove its diff is empty-line insertions only, but a
// blank line inserted inside a template literal is also an empty-line insertion,
// and it changes the string. The script guards against that with a backtick count,
// which is a heuristic. This compares each changed .js file's token stream (raw
// template text included) against HEAD, so a changed string fails it.
//
// Also covers the <script> bodies of changed .html layouts, read through
// html-script-bodies.mjs: Hugo actions are masked as comments, so they are
// compared as nothing, and a body that still cannot be tokenized is named and
// fails the run rather than passing unchecked. Serves js-brace-padding.mjs too.
//
// espree is ESLint's parser, installed as its dependency rather than declared in
// package.json.
//
// Run from the repo root, after the spacing script and before committing:
//   node scripts/js-comment-spacing-verify.mjs     (exit 0 = no token changed)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as espree from "espree";
import { maskHugo, scriptRegions } from "./html-script-bodies.mjs";


// ----- token stream of one source, as comparable strings ----- //

const tokens = (source) =>
    espree.tokenize(source, { ecmaVersion: "latest", sourceType: "script" })
        .map((t) => `${t.type}:${t.value}`);

const sameTokens = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);


// ----- control: the check must see a blank line inside a template literal ----- //

if (sameTokens(tokens("const s = `a\nb`;"), tokens("const s = `a\n\nb`;"))) {
    console.error("Control failed: a template-literal change did not alter the token stream.");
    process.exit(2);
}


// ----- token stream of a layout: its script bodies, Hugo actions masked ----- //

const htmlTokens = (source) => {

    const lines = source.replace(/\r\n/g, "\n").split("\n");

    return scriptRegions(source).flatMap(([start, end]) =>
        tokens(maskHugo(lines.slice(start, end).join("\n"))));

};


// ----- control: the layout path must see a changed string, and ignore a blank line ----- //

{
    const page = (body) => `<div>\n<script>\n${body}\n</script>\n</div>`;
    const a = htmlTokens(page("const s = `{{ .Title }}\na`;\nf();"));

    if (sameTokens(a, htmlTokens(page("const s = `{{ .Title }}\n\na`;\nf();")))
        || !sameTokens(a, htmlTokens(page("const s = `{{ .Title }}\na`;\n\nf();")))) {
        console.error("Control failed: the .html path did not separate a string change from a blank line.");
        process.exit(2);
    }
}


// ----- compare every changed .js and .html file against HEAD ----- //

const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=M", "--", "*.js", "*.html"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

const nonBlank = (source) => source.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim()).join("\n");

let differing = 0;
let lineChanged = 0;
let unreadable = 0;

for (const file of changed) {

    const before = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", maxBuffer: 1 << 26 });
    const after = readFileSync(file, "utf8");
    const read = file.endsWith(".html") ? htmlTokens : tokens;

    let same;

    try {
        same = sameTokens(read(before), read(after));
    } catch (err) {
        unreadable++;
        console.log(`UNREADABLE      ${file}  ${err.message}`);
        continue;
    }

    if (!same) {
        differing++;
        console.log(`TOKENS CHANGED  ${file}`);
    }

    // The whole file, markup included, must differ only by blank lines. A line diff
    // cannot show this once blank lines are removed as well as inserted: it pairs a
    // `}` with the blank on its other side and reports the brace as moved
    if (nonBlank(before) !== nonBlank(after)) {
        lineChanged++;
        console.log(`NON-BLANK LINES CHANGED  ${file}`);
    }
}

console.log(`${changed.length} changed .js/.html file(s) compared: ${differing} with changed tokens, `
    + `${lineChanged} with changed non-blank lines, ${unreadable} unreadable`);
process.exitCode = differing || lineChanged || unreadable ? 1 : 0;
