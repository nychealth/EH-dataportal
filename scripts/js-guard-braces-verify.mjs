// Proves a js-guard-braces.mjs run changed nothing but braces, semicolons and
// whitespace.
//
// Collapsing or bracing a guard changes tokens, so the token comparison in
// js-comment-spacing-verify.mjs would fail every changed file. This compares syntax
// trees instead: each changed file's tree against HEAD's, with positions dropped and
// every braced single-statement `if` body read as its statement, so `if (x) { s; }`
// and `if (x) s;` are equal and anything else that changed is not. A tree holds no
// comments, so the comments are compared too, in order.
//
// For a changed .html layout: its <script> bodies are compared that way, read
// through html-script-bodies.mjs, and every line outside them must be unchanged, as
// must the Hugo actions in order (masking turns them into underscores, which the
// tree comparison cannot tell apart).
//
// Run from the repo root, after the guard script and before committing:
//   node scripts/js-guard-braces-verify.mjs     (exit 0 = same syntax everywhere)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as espree from "espree";
import { maskHugo, scriptRegions } from "./html-script-bodies.mjs";


// ----- syntax tree and comments of one source, as comparable strings ----- //

const POSITION = new Set(["start", "end", "range", "loc"]);

// A braced one-statement `if` body reads as the bare statement; trees are walked in place
const unbrace = (node) => {

    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
        node.forEach(unbrace);
        return;
    }

    if (node.type === "IfStatement" && node.consequent.type === "BlockStatement" && node.consequent.body.length === 1) {
        node.consequent = node.consequent.body[0];
    }

    Object.values(node).forEach(unbrace);

};

const syntax = (source) => {

    const ast = espree.parse(source, { ecmaVersion: "latest", sourceType: "script", comment: true });
    const comments = ast.comments.map((c) => `${c.type}:${c.value}`);

    delete ast.comments;
    unbrace(ast);

    return {
        tree: JSON.stringify(ast, (key, value) => (POSITION.has(key) ? undefined : value)),
        comments: JSON.stringify(comments),
    };

};

const same = (a, b) => a.tree === b.tree && a.comments === b.comments;


// ----- control: the comparison must equate a collapse and nothing else ----- //

const controls = [
    ["if (a) { b(); }", "if (a) b();", true],
    ["function f() { if (a) { return } }", "function f() { if (a) return; }", true],
    ["if (a) { b(); }", "if (a) { c(); }", false],
    ["if (a) { b(); c(); }", "if (a) b(); c();", false],
    ["// x\nif (a) { b(); }", "// y\nif (a) b();", false],
    ["if (a) { b('x'); }", 'if (a) b("x");', false],
    ["const s = `a\nb`;", "const s = `a\n\nb`;", false],
];

for (const [before, after, equal] of controls) {
    if (same(syntax(before), syntax(after)) !== equal) {
        console.error(`Control failed: ${JSON.stringify(before)} vs ${JSON.stringify(after)} should ${equal ? "" : "not "}compare equal.`);
        process.exit(2);
    }
}


// ----- one layout: script bodies by syntax, everything else by text ----- //

const HUGO_ACTION = /\{\{[\s\S]*?\}\}/g;

// Returns null when either side does not parse
const sameBody = (before, after) => {

    try {
        return same(syntax(maskHugo(before)), syntax(maskHugo(after)));
    } catch {
        return null;
    }

};

// A layout body's comparison must see a semicolon that moves a value action out of a
// `return`, and one appended after a control action, which renders as a stray `;`
const bodyControls = [
    ["function f() {\n    return {{ .x }}\n}", "function f() {\n    return; {{ .x }}\n}", false],
    ["{{- range .Pages -}}\nadd({{ .Title }})\n{{- end }}", "{{- range .Pages -}};\nadd({{ .Title }});\n{{- end }};", false],
    ["const d = {{ .x }}\nuse(d)", "const d = {{ .x }};\nuse(d);", true],
];

for (const [before, after, equal] of bodyControls) {
    if (sameBody(before, after) !== equal) {
        console.error(`Control failed: body ${JSON.stringify(before)} vs ${JSON.stringify(after)} should ${equal ? "" : "not "}compare equal.`);
        process.exit(2);
    }
}

const checkHtml = (before, after) => {

    const problems = [];

    if (JSON.stringify(before.match(HUGO_ACTION)) !== JSON.stringify(after.match(HUGO_ACTION))) {
        problems.push("Hugo actions differ");
    }

    const bLines = before.split("\n");
    const aLines = after.split("\n");
    const bRegions = scriptRegions(before);
    const aRegions = scriptRegions(after);

    if (bRegions.length !== aRegions.length) {
        return [...problems, `script body count ${bRegions.length} -> ${aRegions.length}`];
    }

    // Lines outside the bodies, with each body replaced by a marker so order is kept
    const outside = (lines, regions) => {
        const out = [];
        let at = 0;
        for (const [s, e] of regions) {
            out.push(...lines.slice(at, s), "\0body");
            at = e;
        }
        return [...out, ...lines.slice(at)].join("\n");
    };

    if (outside(bLines, bRegions) !== outside(aLines, aRegions)) problems.push("lines outside <script> bodies differ");

    bRegions.forEach(([s, e], i) => {

        const [as, ae] = aRegions[i];
        const result = sameBody(bLines.slice(s, e).join("\n"), aLines.slice(as, ae).join("\n"));

        if (result === null) problems.push(`body at line ${s + 1} unreadable`);
        else if (!result) problems.push(`body at line ${s + 1} has different syntax`);

    });

    return problems;

};


// ----- every changed file ----- //

const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split("\n")
    .filter((p) => p.endsWith(".js") || p.endsWith(".html"));

const failures = [];

for (const path of changed) {

    const before = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 1 << 26 }).replace(/\r\n/g, "\n");
    const after = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

    if (path.endsWith(".html")) {
        checkHtml(before, after).forEach((p) => failures.push(`${path}: ${p}`));
        continue;
    }

    try {
        if (!same(syntax(before), syntax(after))) failures.push(`${path}: different syntax`);
    } catch (err) {
        failures.push(`${path}: unreadable (${err.message})`);
    }

}

console.log(`${changed.length} changed .js/.html files compared against HEAD`);

if (failures.length) {
    console.log(`\n${failures.length} problems:`);
    failures.forEach((f) => console.log(`  ${f}`));
    process.exitCode = 1;
}
