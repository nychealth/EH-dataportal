// Proves a js-comment-spacing.py run changed no JavaScript tokens.
//
// The script's two grep checks prove its diff is empty-line insertions only, but a
// blank line inserted inside a template literal is also an empty-line insertion,
// and it changes the string. The script guards against that with a backtick count,
// which is a heuristic. This compares each changed .js file's token stream (raw
// template text included) against HEAD, so a changed string fails it.
//
// Covers .js files only: the <script> bodies of .html templates hold Go-template
// syntax a JS tokenizer cannot read, so those insertions are reviewed by eye.
//
// espree is ESLint's parser, installed as its dependency rather than declared in
// package.json.
//
// Run from the repo root, after the spacing script and before committing:
//   node scripts/js-comment-spacing-verify.mjs     (exit 0 = no token changed)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as espree from "espree";


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


// ----- compare every changed .js file against HEAD ----- //

const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=M", "--", "*.js"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

let differing = 0;

for (const file of changed) {

    const before = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", maxBuffer: 1 << 26 });
    const after = readFileSync(file, "utf8");

    if (!sameTokens(tokens(before), tokens(after))) {
        differing++;
        console.log(`TOKENS CHANGED  ${file}`);
    }
}

console.log(`${changed.length} changed .js file(s) compared, ${differing} with changed tokens`);
process.exitCode = differing ? 1 : 0;
