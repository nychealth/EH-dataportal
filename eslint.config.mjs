// ESLint flat config — two blocks, both running `no-undef` over classic (non-module)
// browser scripts: the data-explorer SPA, and the Neighborhood Reports report page.
//
// Both are directories of classic <script> tags sharing one runtime global scope,
// but ESLint scopes each file separately. So a name declared in map.js and called
// in trend.js would be a false `no-undef` unless ESLint is told the two share
// globals. We derive that shared surface at config-load time by scanning the files'
// own top-level declarations, rather than hand-maintaining a large name list that
// would go stale (a stale list produces false errors, which trains people to ignore
// the linter).

import globals from "globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DE_DIR = "assets/js/data-explorer";
const NR_DIR = "assets/js/nr-report";
const NDHR_DIR = "assets/js/ndhr-report";
const RD_DIR = "assets/js/report-data";

// Names head.html, the loaded libraries, and the page templates inject into the
// global scope. These aren't declared in the DE files, so the scan below won't
// find them.
const DE_EXTERNAL_GLOBALS = [
    "$", "jQuery", "L", "aq", "op", "topojson", "vegaEmbed", "vega", "vegaLite", "d3",
    "DOMPurify", "chroma", "qrcode",
    "hugoEnv", "baseURL", "data_repo", "data_branch", "gtag",

    // Declared in inline <script> blocks in data-explorer/single.html, which
    // Hugo has to render there (they read template markup), and called from
    // data.js. Classic scripts share one top-level lexical scope, so this works
    // at runtime — but the declarations live in a .html file the scan can't see.
    "renderIndicatorDropdown", "renderIndicatorButtons", "createCitation"
];

// The NR equivalent. Each is annotated with its source so a dead entry is
// traceable rather than merely inherited.
const NR_EXTERNAL_GLOBALS = {
    $: "readonly",              // jquery, loaded in head.html
    L: "readonly",              // leaflet
    aq: "readonly",             // arquero
    op: "readonly",             // arquero's op namespace
    vegaEmbed: "readonly",      // vega-embed, in the vegaBundle concat
    neighborhoods: "readonly",  // `var`, generated from data/globals/uhflist.json in head.html
    debugLog: "readonly",       // inline <script> in partials/head.html
    renderQRCode: "readonly"    // inline <script> in neighborhood-reports/nr-report.html
};

// The NDHR equivalent. Shorter than NR's in one place and longer in another: no
// `neighborhoods` and no arquero, because the report page loads neither — and five names
// from assets/js/report-data/, which the scan below cannot see because it reads one
// directory at a time and those live in a sibling.
const NDHR_EXTERNAL_GLOBALS = {
    $: "readonly",                          // jquery, loaded in head.html
    L: "readonly",                          // leaflet
    vegaEmbed: "readonly",                  // vega-embed, in the vegaBundle concat
    communityDistricts: "readonly",         // `var`, generated from data/globals/cdlist.json by lib-cdlist.html
    debugLog: "readonly",                   // inline <script> in partials/head.html
    renderQRCode: "readonly",               // inline <script> in ndhr/ndhr-report.html

    // assets/js/report-data/normalize.js, loaded as a classic script ahead of these ten.
    // A name added there and used here has to be added to this list too — the scan is
    // per-directory, so nothing else will notice
    buildRows: "readonly",
    reportDataFetchJSON: "readonly",
    reportDataExpandColumns: "readonly",
    reportDataIsUsable: "readonly",
    reportDataNumericValue: "readonly"
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

const ndhrGlobals = { ...scanDeclaredGlobals(NDHR_DIR), ...NDHR_EXTERNAL_GLOBALS };

// The shared report-compute module. Only two names come from outside it, both injected by
// head.html, and both are read through a `typeof` guard so the file also runs under Node
// in scripts/report-data-parity.mjs — but the ternary's other branch is still a bare
// reference, which `no-undef` sees.
const RD_EXTERNAL_GLOBALS = {
    data_repo: "readonly",
    data_branch: "readonly"
};

const rdGlobals = { ...scanDeclaredGlobals(RD_DIR), ...RD_EXTERNAL_GLOBALS };

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
        files: ["assets/js/report-data/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...rdGlobals
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
    },
    {
        files: ["assets/js/ndhr-report/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...ndhrGlobals
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
