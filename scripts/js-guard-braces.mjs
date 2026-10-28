// Applies the one-line guard rule in documents/js-conventions.md (§ Statements): an
// `if` with no `else` and a single-statement body goes on one line, without braces,
// when that line is at most MAX_LENGTH characters from `if` to the end; longer, it
// keeps braces, and a long one-liner gains them.
//
//   if (!button) {
//       return;          →    if (!button) return;
//   }
//
//   if (textElement && CP_SITES[site].text) textElement.innerHTML = CP_SITES[site].text;
//                         →    if (textElement && CP_SITES[site].text) {
//                                  textElement.innerHTML = CP_SITES[site].text;
//                              }
//
// It parses with espree, so "no else" and "single statement" are read off the syntax
// tree. It changes an `if` only when all of these hold, and leaves it alone otherwise:
//   - no `else`, and not itself the `else if` of a chain
//   - the body is one return, throw, break, continue or expression statement; a
//     declaration is a SyntaxError unbraced, and a nested `if` reads as `if (a) if (b)`
//   - that statement fits on one line, and the condition is on the `if`'s line
//   - nothing but whitespace around the statement besides its braces: a comment, inside
//     the braces or after a one-liner, leaves the `if` as it is
//   - no Hugo action in the condition or the statement
//   - nothing else on the `if`'s first or last line
// A statement without a semicolon gets one, so ASI cannot join it to a next line that
// opens with `(` or `[`. An added brace body is indented one level, by the step the
// `if` itself sits at inside its enclosing block.
//
// It changes tokens, so js-comment-spacing-verify.mjs cannot prove it. Run it on a
// clean tree, then:
//
//   node scripts/js-guard-braces.mjs              # every target file
//   node scripts/js-guard-braces.mjs chart-tod    # only paths containing that substring
//   node scripts/js-guard-braces-verify.mjs       # must exit 0: same syntax tree as HEAD
//
// Each change moves its enclosing block's length by two lines, which can cross the
// padding threshold, so run js-brace-padding.mjs afterwards, as its own commit.
//
// To change the cap: edit MAX_LENGTH and run the three commands above, then
// js-brace-padding.mjs; the run works from any earlier cap, in both directions. Then
// update the number in js-conventions.md § Statements and in the formatting ledger's
// Decisions row (documents/js-formatting-pass-2026-10-19.md).
//
// .html targets are read as in js-brace-padding.mjs. Targets come from
// js-sweep-targets.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import * as espree from "espree";
import { jsBodies, lineIndex, maskHugo } from "./html-script-bodies.mjs";
import { sweepTargets } from "./js-sweep-targets.mjs";


// Chris, 2026-10-21, measured from `if`: "it's especially hard to visually parse a long conditional"
const MAX_LENGTH = 60;

const SIMPLE = new Set([
    "ReturnStatement", "ThrowStatement", "BreakStatement", "ContinueStatement", "ExpressionStatement",
]);


// ----- walk the AST, handing each node its parent ----- //

const walk = (node, visit, parent = null) => {

    visit(node, parent);

    for (const key of Object.keys(node)) {

        // The root's token and comment lists hold objects with a `type` too; they are not nodes
        if (key === "tokens" || key === "comments") continue;

        const child = node[key];

        if (Array.isArray(child)) {
            child.forEach((c) => c && typeof c.type === "string" && walk(c, visit, node));
        } else if (child && typeof child.type === "string") {
            walk(child, visit, node);
        }

    }

};


// ----- plan the changes for one parsed source ----- //

// `source` may be a masked copy of `original`, with the same offsets. Returns
// [{ first, last, lines }]: lines first..last are replaced by `lines`.
const planGuards = (source, original) => {

    const ast = espree.parse(source, {
        ecmaVersion: "latest", sourceType: "script", range: true, tokens: true,
    });

    const { lineStarts, lineOf } = lineIndex(source);

    const lineEnd = (line) => (line + 1 < lineStarts.length ? lineStarts[line + 1] - 1 : source.length);

    const tokenAt = new Map(ast.tokens.map((t, i) => [t.range[0], i]));
    const leading = (line) => source.slice(lineStarts[line], lineEnd(line)).match(/^\s*/)[0];

    // One indentation level here: how far this `if` sits inside the line that opens
    // its enclosing block. A file's own unit varies (2 or 4 spaces, tabs) and markup
    // in a layout hides it; at the top level, four spaces
    const indentUnit = (indent, parent) => {

        if (!parent || parent.type === "Program") return "    ";

        const outer = leading(lineOf(parent.range[0]));

        return indent.length > outer.length && indent.startsWith(outer) ? indent.slice(outer.length) : "    ";

    };

    const plans = [];

    walk(ast, (node, parent) => {

        if (node.type !== "IfStatement" || node.alternate) return;
        if (parent?.type === "IfStatement" && parent.alternate === node) return;

        const braced = node.consequent.type === "BlockStatement";
        const body = braced ? node.consequent.body : [node.consequent];

        if (body.length !== 1) return;

        const stmt = body[0];

        if (!SIMPLE.has(stmt.type)) return;

        const ifLine = lineOf(node.range[0]);
        const lastLine = lineOf(node.range[1] - 1);

        if (lineOf(node.consequent.range[0]) !== ifLine) return;
        if (lineOf(stmt.range[0]) !== lineOf(stmt.range[1] - 1)) return;

        // Only whitespace before the `if`, and after its end, on their lines
        const indent = source.slice(lineStarts[ifLine], node.range[0]);

        if (/\S/.test(indent)) return;
        if (source.slice(node.range[1], lineEnd(lastLine)).trim()) return;

        // Only whitespace between `)` and the body, and inside braces besides the statement
        const openParen = ast.tokens[tokenAt.get(node.range[0]) + 1];
        const closeParen = ast.tokens[tokenAt.get(node.consequent.range[0]) - 1];

        if (source.slice(closeParen.range[1], node.consequent.range[0]).trim()) return;

        if (braced) {
            if (source.slice(node.consequent.range[0] + 1, stmt.range[0]).trim()) return;
            if (source.slice(stmt.range[1], node.consequent.range[1] - 1).trim()) return;
        }

        const test = original.slice(openParen.range[1], closeParen.range[0]);
        let text = original.slice(stmt.range[0], stmt.range[1]);

        if (/\{\{|\}\}/.test(test + text)) return;

        if (!text.endsWith(";")) text += ";";

        const oneLine = `if (${test}) ${text}`;
        const fits = oneLine.length <= MAX_LENGTH;

        if (braced && fits) {
            plans.push({ first: ifLine, last: lastLine, lines: [indent + oneLine] });
        } else if (!braced && !fits) {
            plans.push({
                first: ifLine,
                last: lastLine,
                lines: [`${indent}if (${test}) {`, indent + indentUnit(indent, parent) + text, `${indent}}`],
            });
        }

    });

    // A change inside another's lines is left for a re-run; the outer one's text keeps it
    plans.sort((a, b) => a.first - b.first);

    return plans.filter((p, i) => !plans.slice(0, i).some((q) => p.first <= q.last && q.first <= p.last));

};


// ----- apply planned changes to a line array ----- //

const applyPlans = (lines, plans) => {

    const out = [];
    const byFirst = new Map(plans.map((p) => [p.first, p]));

    for (let i = 0; i < lines.length; i++) {

        const plan = byFirst.get(i);

        if (!plan) {
            out.push(lines[i]);
            continue;
        }

        out.push(...plan.lines);
        i = plan.last;

    }

    return out;

};


// ----- one file ----- //

// Returns [collapsed, expanded]
const processFile = (path, failures) => {

    const raw = readFileSync(path, "utf8");

    // Keep the file's own line endings
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const lines = raw.replace(/\r\n/g, "\n").split("\n");

    const plans = [];

    for (const { start, end, text, source } of jsBodies(path, raw, lines)) {

        let planned;

        try {
            planned = planGuards(source, text);
        } catch (err) {
            failures.push(`${path}:${start + 1}  ${err.message}`);
            continue;
        }

        planned.forEach((p) => plans.push({ ...p, first: p.first + start, last: p.last + start }));

    }

    if (!plans.length) return [0, 0];

    writeFileSync(path, applyPlans(lines, plans).join(nl));

    const collapsed = plans.filter((p) => p.lines.length === 1).length;

    return [collapsed, plans.length - collapsed];

};


// ----- control: each rule must hold on a fixture with a known answer ----- //

// Every fixed-length line the fixture expects collapsed is at most 17 characters, so
// any cap from there up is checked by the same fixture. The long conditions are built
// from MAX_LENGTH, putting the one-line form at exactly MAX_LENGTH and MAX_LENGTH + 1
if (MAX_LENGTH < 17) {
    console.error("MAX_LENGTH below 17: the fixture's short guards would no longer fit; shorten them first.");
    process.exit(2);
}

const FIT = "a".repeat(MAX_LENGTH - 15);
const OVER = "a".repeat(MAX_LENGTH - 14);

const FIXTURE_IN = `function f(a, b, list) {

    if (!a) {
        return;
    }

    if(b){ return 0; }

    if (a) {
        a.b = 1
    }

    if (a) {
        return {};
    }

    if (a) {
        // why
        return;
    }

    if (a) {
        return; // why
    }

    if (a) {
        return 1;
    } else {
        return 2;
    }

    if (a) {
        return 1;
    } else if (b) {
        return 2;
    }

    if (a) {
        return 1;
    }
    else {
        return 2;
    }

    if (a) {
        return 1;
    } else
    if (b) {
        return 2;
    }

    if (a) {
        const c = 1;
    }

    if (a) {
        if (b) {
            return 3;
        }
    }

    if (a) {
        return {
            x: 1
        };
    }

    if (a &&
        b) {
        return;
    }

    if (${FIT}) {
        return 1;
    }

    if (${OVER}) {
        return 1;
    }

    if (${FIT}) return 1;

    if (${OVER}) return 1

    if (${OVER}) return 1; // why

    if (${OVER}) return 1; else return 2;

    if (${OVER}) const_like(1),
        more(2);

    for (const x of list) {
        if (x) {
            continue;
        }
    }

    if (a) {
        throw e;
    }

}`;

const FIXTURE_OUT = `function f(a, b, list) {

    if (!a) return;

    if (b) return 0;

    if (a) a.b = 1;

    if (a) return {};

    if (a) {
        // why
        return;
    }

    if (a) {
        return; // why
    }

    if (a) {
        return 1;
    } else {
        return 2;
    }

    if (a) {
        return 1;
    } else if (b) {
        return 2;
    }

    if (a) {
        return 1;
    }
    else {
        return 2;
    }

    if (a) {
        return 1;
    } else
    if (b) {
        return 2;
    }

    if (a) {
        const c = 1;
    }

    if (a) {
        if (b) return 3;
    }

    if (a) {
        return {
            x: 1
        };
    }

    if (a &&
        b) {
        return;
    }

    if (${FIT}) return 1;

    if (${OVER}) {
        return 1;
    }

    if (${FIT}) return 1;

    if (${OVER}) {
        return 1;
    }

    if (${OVER}) return 1; // why

    if (${OVER}) return 1; else return 2;

    if (${OVER}) const_like(1),
        more(2);

    for (const x of list) {
        if (x) continue;
    }

    if (a) throw e;

}`;

// A Hugo action in the statement is left alone
const HUGO = "function g(a) {\n    if (a) {\n        return {{ .Params.x }};\n    }\n}";

// A two-space file gets a two-space body
const TWO_LONG = "a".repeat(MAX_LENGTH - 11);
const TWO_IN = `function h(a) {\n  if (a) {\n    a.b();\n  }\n  if (${TWO_LONG}) a.b();\n}`;
const TWO_OUT = `function h(a) {\n  if (a) a.b();\n  if (${TWO_LONG}) {\n    a.b();\n  }\n}`;

const run = (text) => applyPlans(text.split("\n"), planGuards(text, text)).join("\n");
const fixtureGot = run(FIXTURE_IN);
const twoGot = run(TWO_IN);
const hugoPlans = planGuards(maskHugo(HUGO), HUGO).length;

if (fixtureGot !== FIXTURE_OUT || twoGot !== TWO_OUT || hugoPlans) {
    console.error("Control failed: a fixture did not reach its known answer.");
    if (hugoPlans) console.error("A Hugo action was changed.");
    if (twoGot !== TWO_OUT) console.error(twoGot);
    if (fixtureGot !== FIXTURE_OUT) console.error(fixtureGot);
    process.exit(2);
}


// ----- run ----- //

const filter = process.argv[2];

if (process.argv.length > 3 || filter?.startsWith("-")) {
    console.error("Usage: node scripts/js-guard-braces.mjs [path-substring]");
    process.exit(2);
}

const targets = sweepTargets(filter);

const failures = [];
let collapsed = 0, expanded = 0, files = 0;

for (const path of targets) {

    const [c, e] = processFile(path, failures);

    if (c || e) {
        files++;
        collapsed += c;
        expanded += e;
        console.log(`-${String(c).padStart(3)} +${String(e).padStart(3)}  ${path}`);
    }

}

console.log(`\n${targets.length} target files; ${files} changed: ${collapsed} guards collapsed, ${expanded} braced`);

if (failures.length) {
    console.log(`\n${failures.length} script bodies could not be parsed and were left untouched:`);
    failures.forEach((f) => console.log(`  ${f}`));
    process.exitCode = 1;
}
