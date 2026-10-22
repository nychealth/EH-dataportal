// Applies the brace-padding rules in documents/js-conventions.md (§ Vertical
// whitespace): which blocks get a blank line after `{` and before `}`, and which
// stay tight. Its companion js-comment-spacing.py handles comments; this handles
// everything decided by the kind of block and its length.
//
// It parses with espree rather than matching lines, so a block is known by its
// syntax — a function body, an if/else branch, an object literal holding a
// function — and its braces are exact. It only ever inserts or deletes blank
// lines next to a brace, in both directions: a block the rules leave tight loses
// padding it already had.
//
// Like the comment script, it is for the moment old code arrives, not a check.
// Run it on a clean tree, then prove its diff:
//
//   node scripts/js-brace-padding.mjs              # every target file
//   node scripts/js-brace-padding.mjs chart-tod    # only paths containing that substring
//   node scripts/js-comment-spacing-verify.mjs     # must exit 0
//   python scripts/build-output-diff.py <before> <after>   # must exit 0; builds in its docstring
//
// The last proves Hugo still compiles every layout and renders the same pages,
// blank lines aside. The verifier proves two things per changed file: its non-blank lines are
// unchanged and in order, and no JavaScript token changed — which catches a blank
// line added to or removed from a template literal. A `git diff | grep` for
// non-blank lines does not work here: removing blanks makes the diff pair a `}`
// with the blank on its other side and show the brace as moved.
//
// .html targets are the <script> bodies of layouts, read through
// html-script-bodies.mjs: Hugo actions are masked at the same length before
// parsing, so line positions hold. A body that still fails to parse is left
// untouched and named, and the run exits 1.
//
// Targets come from js-sweep-targets.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import * as espree from "espree";
import { maskHugo, scriptRegions } from "./html-script-bodies.mjs";
import { sweepTargets } from "./js-sweep-targets.mjs";


// ----- syntax helpers ----- //

const isFunction = (node) =>
    node && ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type);

// A closing line holds nothing but closers and their trailing punctuation: `}`, `});`, `]`
const CLOSER_LINE = /^\s*[}\])][}\])\s;,]*$/;

const isComment = (line) => /^\s*(\/\/|\/\*)/.test(line);

// Walk the AST, handing each node its ancestors, nearest first
const walk = (node, visit, ancestors = []) => {

    visit(node, ancestors);

    const next = [node, ...ancestors];

    for (const key of Object.keys(node)) {

        // The root's token list holds objects with a `type` too; they are not nodes
        if (key === "tokens") continue;

        const child = node[key];

        if (Array.isArray(child)) {
            child.forEach((c) => c && typeof c.type === "string" && walk(c, visit, next));
        } else if (child && typeof child.type === "string") {
            walk(child, visit, next);
        }

    }

};

// An object is nested when another object encloses it inside the same function
const isNestedObject = (ancestors) => {

    for (const a of ancestors) {
        if (isFunction(a)) return false;
        if (a.type === "ObjectExpression") return true;
    }

    return false;

};

const holdsFunction = (node) =>
    node.properties.some((p) => p.type === "Property" && (p.method || isFunction(p.value)));


// ----- the rules: should this block be padded, given its body length? ----- //

// Returns true (padded), false (tight), or null (no rule: leave it alone)
const wantsPadding = (node, ancestors, length) => {

    const parent = ancestors[0];

    if (node.type === "ObjectExpression") {
        return !isNestedObject(ancestors) && length > 3 && holdsFunction(node);
    }

    if (node.type === "SwitchStatement" || node.type === "StaticBlock") return length > 3;

    if (node.type !== "BlockStatement") return null;

    // Function bodies, callbacks included
    if (isFunction(parent) && parent.body === node) return length > 3;

    // Every branch of an if / else chain, however short
    if (parent?.type === "IfStatement") {

        const inChain = parent.alternate !== null
            || (ancestors[1]?.type === "IfStatement" && ancestors[1].alternate === parent);

        return inChain || parent.alternate === node ? true : length > 3;

    }

    if (parent?.type === "TryStatement" || parent?.type === "CatchClause") return true;

    // Loops and bare blocks
    return length > 3;

};


// ----- the brace pair of a block-like node, as line numbers ----- //

const braceLines = (node, tokens, lineOf) => {

    let open = node.range[0];

    // A switch's `{` follows its discriminant rather than starting the node
    if (node.type === "SwitchStatement") {
        const t = tokens.find((t) => t.range[0] >= node.discriminant.range[1] && t.value === "{");
        open = t.range[0];
    }

    return [lineOf(open), lineOf(node.range[1] - 1)];

};


// ----- plan the edits for one parsed source ----- //

// `lines` are the original lines; `source` may be a masked copy with the same line breaks.
// Returns { insertAfter: Set, remove: Set } in line numbers relative to `lines`.
const planEdits = (source, lines) => {

    const ast = espree.parse(source, {
        ecmaVersion: "latest", sourceType: "script", range: true, tokens: true,
    });

    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1);

    const lineOf = (offset) => {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
        }
        return lo;
    };

    const insertAfter = new Set();
    const remove = new Set();

    walk(ast, (node, ancestors) => {

        if (!["BlockStatement", "ObjectExpression", "SwitchStatement", "StaticBlock"].includes(node.type)) return;

        const [openLine, closeLine] = braceLines(node, ast.tokens, lineOf);

        // Only a brace that ends its line and a brace that starts its line can be padded
        if (closeLine <= openLine + 1) return;
        if (!lines[openLine].trimEnd().endsWith("{")) return;
        if (!/^\s*}/.test(lines[closeLine])) return;

        let first = openLine + 1;
        while (first < closeLine && !lines[first].trim()) first++;

        let last = closeLine - 1;
        while (last > openLine && !lines[last].trim()) last--;

        if (first > last) return;

        let length = 0;
        for (let i = first; i <= last; i++) if (lines[i].trim()) length++;

        const want = wantsPadding(node, ancestors, length);

        if (want === null) return;

        // A comment as the first line keeps its gap even in a tight block
        const wantTop = want || isComment(lines[first]);

        // Stacked closers: no blank line before this `}` when the line above is one
        const wantBottom = want && !CLOSER_LINE.test(lines[last]);

        if (wantTop && first === openLine + 1) insertAfter.add(openLine);
        if (!wantTop) for (let i = openLine + 1; i < first; i++) remove.add(i);

        if (wantBottom && last === closeLine - 1) insertAfter.add(last);
        if (!wantBottom) for (let i = last + 1; i < closeLine; i++) remove.add(i);

    });

    return { insertAfter, remove };

};


// ----- apply planned edits to a line array ----- //

const applyEdits = (lines, { insertAfter, remove }) => {

    const out = [];

    lines.forEach((line, i) => {
        if (!remove.has(i)) out.push(line);
        if (insertAfter.has(i)) out.push("");
    });

    return out;

};


// ----- one file ----- //

const processFile = (path, failures) => {

    const raw = readFileSync(path, "utf8");

    // Keep the file's own line endings
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const lines = raw.replace(/\r\n/g, "\n").split("\n");

    const insertAfter = new Set();
    const remove = new Set();

    const isHtml = path.endsWith(".html");
    const regions = isHtml ? scriptRegions(raw) : [[0, lines.length]];

    for (const [start, end] of regions) {

        const slice = lines.slice(start, end);
        const text = slice.join("\n");

        // A layout body is tried with actions as comments, then as values
        const attempts = isHtml ? [maskHugo(text), maskHugo(text, true)] : [text];

        let plan = null;
        let firstError = null;

        for (const source of attempts) {
            try {
                plan = planEdits(source, slice);
                break;
            } catch (err) {
                firstError ??= err;
            }
        }

        if (!plan) {
            failures.push(`${path}:${start + 1}  ${firstError.message}`);
            continue;
        }

        plan.insertAfter.forEach((i) => insertAfter.add(i + start));
        plan.remove.forEach((i) => remove.add(i + start));

    }

    if (!insertAfter.size && !remove.size) return [0, 0];

    writeFileSync(path, applyEdits(lines, { insertAfter, remove }).join(nl));

    return [insertAfter.size, remove.size];

};


// ----- control: each rule must fire on a fixture with a known answer ----- //

const FIXTURE_IN = `const long = () => {
    a();
    b();
    c();
    d();
};
const short = () => {

    a();

};
const three = () => {
    a();
    b();
    c();
};
if (x) {
    a();
} else {
    b();
}
if (y) {

    a();

}
if (z) {
    a();
    b();
    c();
    d();
}
if (p) {
    a();
} else if (q) {
    b();
}
const opts = {
    a: 1,
    b: 2,
    c: 3,
    f: () => go()
};
const spec = {

    a: 1,
    b: 2,
    c: 3,
    d: { e: 1 }

};
list.forEach((item) => {
    item.on("click", () => {
        a();
        b();
        c();
        d();
    });
});
const commented = () => {
    // kept apart
    a();
};`;

const FIXTURE_OUT = `const long = () => {

    a();
    b();
    c();
    d();

};
const short = () => {
    a();
};
const three = () => {
    a();
    b();
    c();
};
if (x) {

    a();

} else {

    b();

}
if (y) {
    a();
}
if (z) {

    a();
    b();
    c();
    d();

}
if (p) {

    a();

} else if (q) {

    b();

}
const opts = {

    a: 1,
    b: 2,
    c: 3,
    f: () => go()

};
const spec = {
    a: 1,
    b: 2,
    c: 3,
    d: { e: 1 }
};
list.forEach((item) => {

    item.on("click", () => {

        a();
        b();
        c();
        d();

    });
});
const commented = () => {

    // kept apart
    a();
};`;

{
    const lines = FIXTURE_IN.split("\n");
    const got = applyEdits(lines, planEdits(FIXTURE_IN, lines)).join("\n");

    if (got !== FIXTURE_OUT) {
        console.error("Control failed: the fixture did not produce its expected output. Got:\n" + got);
        process.exit(2);
    }
}


// ----- run ----- //

const filter = process.argv[2];

if (process.argv.length > 3 || filter?.startsWith("-")) {
    console.error("Usage: node scripts/js-brace-padding.mjs [path-substring]");
    process.exit(2);
}

const targets = sweepTargets(filter);

const failures = [];
let inserted = 0, removed = 0, files = 0;

for (const path of targets) {

    const [i, r] = processFile(path, failures);

    if (i || r) {
        files++;
        inserted += i;
        removed += r;
        console.log(`+${String(i).padStart(3)} -${String(r).padStart(3)}  ${path}`);
    }

}

console.log(`\n${targets.length} target files; ${files} changed: ${inserted} blank lines inserted, ${removed} removed`);

if (failures.length) {
    console.log(`\n${failures.length} script bodies could not be parsed and were left untouched:`);
    failures.forEach((f) => console.log(`  ${f}`));
    process.exitCode = 1;
}
