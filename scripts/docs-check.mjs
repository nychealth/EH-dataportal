// Staleness check for docs that claim to describe CURRENT code.
//
// Exists because documents/data-explorer-architecture.md silently rotted through
// five refactors — it listed a file that no longer exists, omitted three that do,
// cited ten identifiers that had been renamed, and still used the pre-cutover
// `data-explorer-new/` paths. Every one of those is mechanically checkable, and
// each would have failed at the commit that introduced it, which is when it was
// cheapest to fix. Prose drift ("these renderers are stubs") is NOT checkable —
// that is what the `docs-check verified` provenance line is for.
//
// Opt-in: a doc is only checked if it declares source roots in its first lines.
// Audits and dated findings deliberately reference old names and must NOT opt in.
//
//   <!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts -->
//   <!-- docs-check verified: <commit> <YYYY-MM-DD> -->
//   <!-- docs-check ignore: someOldName anotherOldName -->
//
// Run: npm run docs-check

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_DIR = join(REPO_ROOT, "documents");

// Source extensions worth scanning for identifiers.
const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".html", ".scss", ".css", ".json"]);

// Directories never worth walking.
const SKIP_DIRS = new Set(["node_modules", ".git", "docs", "resources", ".playwright-mcp"]);

// Reads every file under a root and returns the set of identifier-ish tokens in it.
const collectIdentifiers = (root) => {
    const found = new Set();

    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name)) {
                    walk(join(dir, entry.name));
                }
                continue;
            }

            const dot = entry.name.lastIndexOf(".");

            if (dot === -1 || !SOURCE_EXTENSIONS.has(entry.name.slice(dot))) {
                continue;
            }

            const text = readFileSync(join(dir, entry.name), "utf8");

            for (const token of text.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? []) {
                found.add(token);
            }
        }
    };

    walk(root);

    return found;
};

// Parses the opt-in header. Returns null for docs that don't opt in.
const readDirectives = (text) => {
    const head = text.slice(0, 2000);

    const roots = head.match(/<!--\s*docs-check source-roots:\s*([^>]*?)\s*-->/);

    if (!roots) {
        return null;
    }

    const verified = head.match(/<!--\s*docs-check verified:\s*([^>]*?)\s*-->/);
    const ignore = head.match(/<!--\s*docs-check ignore:\s*([^>]*?)\s*-->/);

    return {
        roots: roots[1].split(/\s+/).filter(Boolean),
        verified: verified ? verified[1].trim() : null,
        ignore: new Set(ignore ? ignore[1].split(/\s+/).filter(Boolean) : []),
    };
};

// Strips fenced code blocks: they hold illustrative pseudo-code and call trees,
// not claims about names that must currently exist.
const stripFences = (text) => text.replace(/```[\s\S]*?```/g, "");

// A path claim is any backticked or markdown-linked token that looks like a repo path.
const collectPathClaims = (text, docPath) => {
    const claims = [];

    // `assets/js/foo.js` and `assets/js/foo/` — both repo-root-relative. Directory
    // paths matter as much as files: the pre-cutover `data-explorer-new/` tree was
    // cited five times and every mention was wrong.
    for (const [, token] of text.matchAll(/`([^`\s]+(?:\.[a-z]{2,5}|\/))`/g)) {
        if (token.includes("/") && !token.startsWith("http")) {
            claims.push({ raw: token, abs: join(REPO_ROOT, token) });
        }
    }

    // [text](../assets/js/foo.js) — relative to the doc itself.
    for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
        if (target.startsWith("http") || target.startsWith("#")) {
            continue;
        }

        const clean = target.split("#")[0];

        if (clean) {
            claims.push({ raw: target, abs: resolve(dirname(docPath), clean) });
        }
    }

    return claims;
};

// An identifier claim is a backticked multi-word camelCase token. Single lowercase
// words ( `overlay`, `links` ) are skipped — too easily ordinary prose to flag.
const collectIdentifierClaims = (text) => {
    const claims = new Set();

    for (const [, token] of text.matchAll(/`([A-Za-z_$][A-Za-z0-9_$]*)\(?\)?`/g)) {
        if (/^[a-z][A-Za-z0-9_$]*$/.test(token) && /[A-Z]/.test(token)) {
            claims.add(token);
        }
    }

    return [...claims];
};

// ----- run -----

const docs = readdirSync(DOCS_DIR).filter(name => name.endsWith(".md"));
const failures = [];
let checkedCount = 0;

for (const name of docs) {
    const docPath = join(DOCS_DIR, name);
    const original = readFileSync(docPath, "utf8");
    const directives = readDirectives(original);

    if (!directives) {
        continue;
    }

    checkedCount += 1;

    const text = stripFences(original);
    const problems = [];

    // ----- source roots must themselves exist -----

    for (const root of directives.roots) {
        if (!existsSync(join(REPO_ROOT, root))) {
            problems.push(`declared source root does not exist: ${root}`);
        }
    }

    // ----- provenance -----

    if (!directives.verified) {
        problems.push("missing `<!-- docs-check verified: <commit> <date> -->` line");
    }

    // ----- every path it names must exist -----

    for (const claim of collectPathClaims(text, docPath)) {
        if (!existsSync(claim.abs)) {
            problems.push(`path does not exist: ${claim.raw}`);
        }
    }

    // ----- every identifier it names must exist in the declared roots -----

    const known = new Set();

    for (const root of directives.roots) {
        const abs = join(REPO_ROOT, root);

        if (existsSync(abs) && statSync(abs).isDirectory()) {
            for (const token of collectIdentifiers(abs)) {
                known.add(token);
            }
        }
    }

    for (const identifier of collectIdentifierClaims(text)) {
        if (!known.has(identifier) && !directives.ignore.has(identifier)) {
            problems.push(`identifier not found in source: ${identifier}`);
        }
    }

    if (problems.length) {
        failures.push({ doc: relative(REPO_ROOT, docPath), problems: [...new Set(problems)] });
    }
}

// ----- report -----

if (checkedCount === 0) {
    console.log("docs-check: no docs opted in (add a `docs-check source-roots:` comment).");
    process.exit(0);
}

for (const failure of failures) {
    console.log(`\n${failure.doc}`);

    for (const problem of failure.problems) {
        console.log(`  - ${problem}`);
    }
}

const total = failures.reduce((sum, f) => sum + f.problems.length, 0);

if (total > 0) {
    console.log(`\ndocs-check FAILED — ${total} stale claim(s) across ${failures.length} of ${checkedCount} checked doc(s).`);
    process.exit(1);
}

console.log(`docs-check PASSED — ${checkedCount} doc(s) checked, no stale paths or identifiers.`);
