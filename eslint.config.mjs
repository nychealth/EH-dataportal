// ESLint flat config — scoped to the data-explorer SPA only.
//
// The 10 files in assets/js/data-explorer/ are classic <script> tags sharing
// one runtime global scope, but ESLint scopes each file separately. So a name
// declared in map.js and called in trend.js would be a false `no-undef` unless
// ESLint is told the two share globals. We derive that shared surface at
// config-load time by scanning the files' own top-level declarations, rather
// than hand-maintaining a large name list that would go stale (a stale list
// produces false errors, which trains people to ignore the linter).

import globals from "globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DE_DIR = "assets/js/data-explorer";

// Names head.html, the loaded libraries, and the page templates inject into the
// global scope. These aren't declared in the DE files, so the scan below won't
// find them.
const EXTERNAL_GLOBALS = [
    "$", "jQuery", "L", "aq", "op", "topojson", "vegaEmbed", "vega", "vegaLite", "d3",
    "DOMPurify", "chroma", "qrcode",
    "hugoEnv", "baseURL", "data_repo", "data_branch", "gtag",

    // Declared in inline <script> blocks in data-explorer/single.html, which
    // Hugo has to render there (they read template markup), and called from
    // data.js. Classic scripts share one top-level lexical scope, so this works
    // at runtime — but the declarations live in a .html file the scan can't see.
    "renderIndicatorDropdown", "renderIndicatorButtons", "createCitation"
];

// Extract top-level `function`/`const`/`let`/`var` names from the DE files.
// Anchored to column 0 so only module-scope declarations match, not indented
// (nested) ones — indented names are locals ESLint already sees in-file.
// KNOWN LIMITATION: only the first identifier of a simple declaration is
// captured — top-level destructuring (`const { a, b } = …`) and multi-declarator
// (`const a = 1, b = 2`) names are missed. None exist in the DE tree today; if a
// future one is used cross-file it would surface as a spurious `no-undef` (add
// the name here or broaden this regex), not a silently-wrong lint pass.
const declaredGlobals = {};
for (const file of readdirSync(DE_DIR)) {
    if (!file.endsWith(".js")) continue;
    const src = readFileSync(join(DE_DIR, file), "utf8");
    const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
    let m;
    while ((m = re.exec(src)) !== null) {
        declaredGlobals[m[1] ?? m[2]] = "writable";
    }
}

for (const name of EXTERNAL_GLOBALS) {
    declaredGlobals[name] = "readonly";
}

export default [
    {
        files: ["assets/js/data-explorer/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...declaredGlobals
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
