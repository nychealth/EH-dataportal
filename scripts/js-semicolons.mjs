// Applies "end every statement with a semicolon" (documents/js-conventions.md
// § Statements) to old code, using ESLint's own `semi` rule.
//
// `npx eslint --fix --rule "semi: error"` cannot do this here: eslint.config.mjs
// configures only assets/js/data-explorer and assets/js/nr-report, so ESLint skips
// every other target, and it cannot read a layout's <script> bodies at all. This runs
// the same rule through ESLint's Linter API over every sweep target, reading layouts
// through html-script-bodies.mjs. Hugo actions are masked at the same length, so a
// fix's offsets hold in the original text.
//
// It applies a fix only when it is a bare `;` insertion; any other fix the rule
// offers is named and the run exits 1.
//
// Adding a semicolon where ASI already ended the statement leaves the syntax tree
// unchanged, so the proof is the guard verifier. Run on a clean tree, then:
//
//   node scripts/js-semicolons.mjs              # every target file
//   node scripts/js-semicolons.mjs chart-tod    # only paths containing that substring
//   node scripts/js-guard-braces-verify.mjs     # must exit 0: same syntax tree as HEAD
//
// Targets come from js-sweep-targets.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import { Linter } from "eslint";
import { maskHugo, scriptRegions } from "./html-script-bodies.mjs";
import { sweepTargets } from "./js-sweep-targets.mjs";


const linter = new Linter();

const CONFIG = [{
    languageOptions: { ecmaVersion: "latest", sourceType: "script" },
    rules: { semi: ["error", "always"] },
}];


// ----- the semicolon insertions for one source, as offsets ----- //

// `source` may be a masked copy of the text the offsets are applied to. Throws on a
// parse error, so the caller can try another mask
const planSemicolons = (source, path, refused) => {

    const messages = linter.verify(source, CONFIG);
    const fatal = messages.find((m) => m.fatal);

    if (fatal) throw new Error(`${fatal.line}:${fatal.column} ${fatal.message}`);

    const offsets = [];

    for (const m of messages) {

        if (m.ruleId !== "semi") continue;

        const fix = m.fix;

        if (fix && fix.text === ";" && fix.range[0] === fix.range[1]) offsets.push(fix.range[0]);
        else refused.push(`${path}:${m.line}:${m.column}  ${m.message} (fix: ${JSON.stringify(fix)})`);

    }

    return offsets;

};

const insertAt = (text, offsets) =>
    [...offsets].sort((a, b) => b - a).reduce((t, o) => t.slice(0, o) + ";" + t.slice(o), text);


// ----- one file ----- //

const processFile = (path, failures, refused) => {

    const raw = readFileSync(path, "utf8");

    // Keep the file's own line endings
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const text = raw.replace(/\r\n/g, "\n");

    if (!path.endsWith(".html")) {

        let offsets;

        try {
            offsets = planSemicolons(text, path, refused);
        } catch (err) {
            failures.push(`${path}  ${err.message}`);
            return 0;
        }

        if (offsets.length) writeFileSync(path, insertAt(text, offsets).replace(/\n/g, nl));

        return offsets.length;

    }

    // A layout: each <script> body is tried with actions as comments, then as values
    const lines = text.split("\n");
    let count = 0;

    // Bottom-up, so an edit never moves a body not yet edited
    for (const [start, end] of scriptRegions(text).reverse()) {

        const body = lines.slice(start, end).join("\n");

        let offsets = null;
        let firstError = null;

        for (const source of [maskHugo(body), maskHugo(body, true)]) {
            try {
                offsets = planSemicolons(source, `${path}:${start + 1}`, refused);
                break;
            } catch (err) {
                firstError ??= err;
            }
        }

        if (!offsets) {
            failures.push(`${path}:${start + 1}  ${firstError.message}`);
            continue;
        }

        if (!offsets.length) continue;

        lines.splice(start, end - start, ...insertAt(body, offsets).split("\n"));
        count += offsets.length;

    }

    if (count) writeFileSync(path, lines.join(nl));

    return count;

};


// ----- control: the rule must reach its known answer on a fixture ----- //

const FIXTURE_IN = `let a = 1
const f = () => {
    a++
    if (a) return
    for (let i = 0; i < 2; i++) g(i)
    do { a-- } while (a)
    return a;
}
class C {
    x = 1
    m() {}
}
const s = \`x\${a}\`
`;

const FIXTURE_OUT = `let a = 1;
const f = () => {
    a++;
    if (a) return;
    for (let i = 0; i < 2; i++) g(i);
    do { a--; } while (a);
    return a;
};
class C {
    x = 1;
    m() {}
}
const s = \`x\${a}\`;
`;

// A Hugo action standing in for a value gets its semicolon after the action
const HUGO_IN = "const data = {{ .Params.data | jsonify }}\nuse(data)";
const HUGO_OUT = "const data = {{ .Params.data | jsonify }};\nuse(data);";

{
    const refused = [];
    const got = insertAt(FIXTURE_IN, planSemicolons(FIXTURE_IN, "fixture", refused));
    const hugo = insertAt(HUGO_IN, planSemicolons(maskHugo(HUGO_IN, true), "hugo fixture", refused));

    if (got !== FIXTURE_OUT || hugo !== HUGO_OUT || refused.length) {
        console.error("Control failed: a fixture did not reach its known answer.");
        console.error(got, hugo, refused);
        process.exit(2);
    }
}


// ----- run ----- //

const filter = process.argv[2];

if (process.argv.length > 3 || filter?.startsWith("-")) {
    console.error("Usage: node scripts/js-semicolons.mjs [path-substring]");
    process.exit(2);
}

const targets = sweepTargets(filter);

const failures = [];
const refused = [];
let added = 0, files = 0;

for (const path of targets) {

    const n = processFile(path, failures, refused);

    if (n) {
        files++;
        added += n;
        console.log(`${String(n).padStart(4)}  ${path}`);
    }

}

console.log(`\n${targets.length} target files; ${files} changed: ${added} semicolons added`);

if (refused.length) {
    console.log(`\n${refused.length} fixes were not a bare semicolon insertion and were not applied:`);
    refused.forEach((r) => console.log(`  ${r}`));
}

if (failures.length) {
    console.log(`\n${failures.length} sources could not be parsed and were left untouched:`);
    failures.forEach((f) => console.log(`  ${f}`));
}

if (refused.length || failures.length) process.exitCode = 1;
