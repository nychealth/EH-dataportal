// ESLint flat config — two blocks, both running `no-undef` over classic (non-module)
// browser scripts: the data-explorer SPA, and the Neighborhood Reports report page.
//
// Both are directories of classic <script> tags sharing one runtime global scope,
// but ESLint scopes each file separately. So a name declared in map.js and called
// in bar.js would be a false `no-undef` unless ESLint is told the two share
// globals. We derive that shared surface at config-load time by scanning the files'
// own top-level declarations, rather than hand-maintaining a large name list that
// would go stale (a stale list produces false errors, which trains people to ignore
// the linter).
//
// data-explorer-old/ is deliberately NOT linted — it's retired ("do not
// modify"), so findings there are unactionable noise.

import globals from "globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DE_DIR = "assets/js/data-explorer";
const NR_DIR = "assets/js/nr-report";

// Names head.html and the loaded libraries inject into the global scope.
// These aren't declared in the DE files, so the scan below won't find them.
const DE_EXTERNAL_GLOBALS = [
    "$", "jQuery", "L", "aq", "op", "topojson", "vegaEmbed", "vega", "vegaLite", "d3",
    "DOMPurify", "chroma", "qrcode",
    "hugoEnv", "baseURL", "data_repo", "data_branch", "debugLog", "gtag"
];

// The NR equivalent. Each is annotated with its source so a dead entry is
// traceable rather than merely inherited.
const NR_EXTERNAL_GLOBALS = {
    $: "readonly",              // jquery, loaded in head.html
    L: "readonly",              // leaflet
    aq: "readonly",             // arquero
    op: "readonly",             // arquero's op namespace
    vegaEmbed: "readonly",      // vega-embed, in the vegaBundle concat
    neighborhoods: "readonly",  // `var`, generated from data/globals/uhflist.json in partials/lib-uhflist.html
    debugLog: "readonly",       // inline <script> in partials/head.html
    gtag: "readonly",           // inline <script> in partials/head.html
    renderQRCode: "readonly"    // inline <script> in neighborhood-reports/nr-report.html
};

// Extract top-level `function`/`const`/`let`/`var` names from one directory's files.
// Anchored to column 0 so only module-scope declarations match, not indented
// (nested) ones — indented names are locals ESLint already sees in-file.
// KNOWN LIMITATION: only the first identifier of a simple declaration is
// captured — top-level destructuring (`const { a, b } = …`) and multi-declarator
// (`const a = 1, b = 2`) names are missed. None exist in either tree today; if a
// future one is used cross-file it would surface as a spurious `no-undef` (add the
// name to that directory's externals list or broaden this regex), not a silently-wrong
// lint pass.
const scanDeclaredGlobals = dir => {

    const declared = {};

    for (const file of readdirSync(dir)) {
        if (!file.endsWith(".js")) continue;
        const src = readFileSync(join(dir, file), "utf8");
        const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
        let m;
        while ((m = re.exec(src)) !== null) {
            declared[m[1] ?? m[2]] = "writable";
        }
    }

    return declared;

};

const deGlobals = scanDeclaredGlobals(DE_DIR);
for (const name of DE_EXTERNAL_GLOBALS) {
    deGlobals[name] = "readonly";
}

const nrGlobals = { ...scanDeclaredGlobals(NR_DIR), ...NR_EXTERNAL_GLOBALS };

export default [
    {
        files: ["assets/js/data-explorer/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...deGlobals
            }
        },
        rules: {
            "no-undef": "error"
        }
    },
    {
        files: ["assets/js/nr-report/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...nrGlobals
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
