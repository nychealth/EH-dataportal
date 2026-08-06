# JavaScript Conventions — Browser-Side JS

## Scope

Applies to all browser-side JavaScript authored in this repo: everything under
`assets/js/`, plus inline `<script>` blocks in `themes/dohmh/layouts/`.

**Not** covered — vendored or generated files, which are left exactly as they
arrive: `accessible-autocomplete.min.js`, `naturalSort.js`, `color-convert.js`,
`L.colorIcon.js`, `uhflist.js`, `ccd-to-uhf42.js`, `cd-to-uhf42.js`. Also exempt is
`assets/js/data-explorer-old/` on `feature-new-data-explorer` — the retiring
explorer.

**Forward-only.** These rules govern new files and code you are already editing.
Existing files are not swept into conformance; the known gaps are listed in §5h of
`documents/site-wide-audit-2026-06-27.md`.

The data-explorer examples below describe the explorer on
`feature-new-data-explorer`, which is the tree that survives. Formatting
preferences were originally synthesized from the pre-refactor explorer, and the
organizational conventions from the Copilot-era refactor of
`assets/js/data-explorer/`.

This document supersedes the earlier directory-scoped split between it and
`.claude/commands/js-development.md`, which is now a stub pointing here.

---

## Indentation

4 spaces per level. No tabs.

---

## File header

Files over ~100 lines open with a banner, the filename, and a one-sentence module
description. No blank line between the description line and the first section
header. Shorter files may have one; if a file already has one, keep it.

```js
// ======================================================================= //
// filename.js
// ======================================================================= //

// One sentence describing what this file owns — noun-phrase style
```

---

## Comment hierarchy

Four levels, each with a distinct marker. Use only the level appropriate to context —
don't promote a minor step to a section header just to add visual weight. Headings are
nested, so a lower heading shouldn't appear without an equal or higher heading preceding it.

The banner levels (1 and 2) are for files over ~100 lines, same as the file header.
Levels 3 and 4 apply at any file size.

### Level 1 — Major section
Top-level named divisions within a file (`shared state`, `geo helpers`, `render functions`).

```js
// ----------------------------------------------------------------------- //
// section name
// ----------------------------------------------------------------------- //
```

### Level 2 — Named sub-group
Like-items grouped within a section, typically by tab or feature area (`map`, `trend`, `links`).

```js
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// sub-group name
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
```

### Level 3 — Step within a function
Major logical phases inside a longer function (`resolve metadata`, `filter data`, `render`).

```js
// ----- step heading ----- //
```

Use this level to break up functions that have 3+ distinct phases. If a function only
does one thing, no step comments are needed.

### Level 4 — Fine detail
Sub-steps, conditional branches, or inline clarifications within a phase.

```js
// - - - detail label - - - //
```

---

## Scope and module structure

### No IIFEs

Do not wrap code in an immediately-invoked function expression. `let` and `const`
at the top level of a script do not create `window.*` properties, so an IIFE adds
no safety benefit over just writing module-level declarations.

When a value genuinely needs to be reachable from outside the file, expose it
explicitly:

```js
// expose one function; everything else stays file-scoped
window.nrDownloadCSV = downloadCSV;
```

### The data explorer's shared scope

`assets/js/data-explorer/` is a set of classic `<script>` tags sharing one global
scope, with load order set in `themes/dohmh/layouts/data-explorer/single.html`.
Two kinds of name live at that top level, and the distinction is deliberate.
`global.js` states it for itself:

> Render closures, tab refs, DOM element caches, and the static lookup constants
> below stay bare by design — they are module seams, not churning state.

So: churning cross-file state goes in the grouped `DE` namespace (`const DE = { … }`
in `global.js`, one sub-object per concern); module seams stay bare, declared once
in `global.js` and assigned in the file that owns them.

Either way the name is **declared** somewhere. Never assign to an undeclared name —
an implicit global works at runtime but defeats `npm run lint`, which is the thing
that proves a rename complete.

---

## Variables

- `const` by default.
- `let` only when the binding is reassigned.
- Never `var`.

```js
// good
const spaConfig = window.NR_TOPIC_SPA_CONFIG;
let currentNeighborhood = '';

// bad
var spaConfig = window.NR_TOPIC_SPA_CONFIG;
```

Group related declarations under a short prose comment that explains what the group
is *for* — not just what the variables are. One blank line between groups.

```js
// Summary-table filter state persists across redraws until a new indicator resets it
let selectedTableTimes = [];
let selectedTableGeography = [];

// Lookup tables are rebuilt on each indicator load and reused by menus and renderers
let geoTable;
let timeTable;

// Per-view default metadata is recomputed per indicator load
let defaultTrendMetadata;
let defaultMapMetadata;
```

Avoid long uncommented runs of declarations — they obscure intent and make it hard
to know what changed when.

---

## Functions

Prefer named arrow functions assigned to `const` over `function` declarations.

```js
// good
const getTertileLabel = (rank, rankReverse) => {
    ...
};

// bad
function getTertileLabel(rank, rankReverse) {
    ...
}
```

Use a `function` declaration only when you specifically need hoisting or a `this`
binding — document why if you do.

Inline callbacks use arrow functions:

```js
rows.forEach(row => {
    ...
});

fetch(url)
    .then(res => res.json())
    .then(data => { ... });
```

Single-expression bodies can drop braces and `return`:

```js
const styleFeature = () => defaultStyle;
const nrById = id => document.getElementById(id);
```

### The comment above every function

One line, directly above the function, no blank line between it and the function
keyword. Applies to `const fn = () =>`, `function fn()`, and method-style
definitions alike.

```js
// Assigns a sortable rank so geographies can be ordered from broad to fine
const assignGeoRank = (GeoType) => {
    ...
};
```

Rules:
- One line only. If it takes more than one line the function may be doing too much.
- Describes the *why* or the contract, not a restatement of the name.

Two things this document deliberately does **not** mandate: whether comments end in
a period, and whether they are third-person sentences ("Assigns a sortable rank…")
or imperative fragments ("Assign a sortable rank…"). Both forms exist in the tree
and both are acceptable. The voice question is logged as open in §5h of
`documents/site-wide-audit-2026-06-27.md`.

Inline comments before non-obvious branches or variable groups follow the same
why-not-what rule:

```js
// Normalize rank values that may arrive as numbers or strings
const r = String(rank);
// rankReverse indicates indicators where lower values are directionally better
const reverse = rankReverse === true || rankReverse === 'true';
```

---

## Vertical whitespace

Functions should breathe — a reader should be able to scan one and immediately see
its distinct phases.

- Blank line after the opening `{` of any block longer than ~3 lines.
- Blank line before the closing `}`.
- Blank line between each logical group inside a function, and before each `return`.
- Two blank lines between top-level function definitions.
- One blank line between variable groups in module-level declarations.
- Inside `forEach`, `then`, and similar callbacks: blank line after the opening
  brace and before the closing brace when the body is more than one line.

```js
// correct
const myFunction = (arg) => {

    const x = compute(arg);

    return x;

};


// next top-level definition
const otherFunction = () => {
    ...
};
```

A longer example, showing the group-and-`return` spacing:

```js
const renderSection = (section, neighborhoodName) => {

    // Section containers are layout-driven and may be absent in some templates
    const container = document.getElementById(section.containerId);

    if (!container) {
        return;
    }

    // Neighborhood-level rows are pre-grouped during loadSection
    const byNeighborhood = sectionData[section.id] || {};
    const rows = byNeighborhood[neighborhoodName] || [];

    container.innerHTML = '';

    if (!rows.length) {
        container.innerHTML =
            '<p class="text-muted px-2 pb-2 mb-0">No data available for this neighborhood.</p>';
        return;
    }

    rows.forEach(row => {

        const card = document.createElement('div');
        card.innerHTML = buildIndicatorCard(row, section.id, neighborhoodName);
        container.appendChild(card);

    });

};
```

---

## Internal step comments

For functions longer than ~20 lines, mark major phases with level-3 step comments.
Put a blank line before and after each step block.

```js
showMap = () => {

    // ----- resolve metadata for the current MeasureID ----- //

    let metadata = mapMeasures.filter(m => m.MeasureID == MeasureID);
    if (!metadata.length) metadata = defaultMapMetadata;

    // ----- filter data by current globals ----- //

    filteredMapData = mapData.filter(obj =>
        obj.MeasureID == MeasureID &&
        obj.TimePeriodID == TimePeriodID &&
        prettifyGeoType(obj.GeoType) == GeoType
    );

    // ----- render ----- //

    return renderMap(filteredMapData, metadata);

};
```

Use level-4 (`// - - - label - - - //`) for conditional branches or sub-steps within
a phase when the phase itself is long.

---

## Debug logging

### Route trace logs through `debugLog`, not `console.log`

`themes/dohmh/layouts/partials/head.html` defines a `debugLog` that binds
`console.log` in every Hugo environment except `production` and `prod_prod`, with a
per-browser `localStorage.setItem('de_debug', '1' | '0')` override either way. It is
bound rather than wrapped so DevTools attributes each line to the caller. Being
defined in `head.html`, it is available site-wide to any script loaded after that
point — not data-explorer-specific.

> **PENDING:** `debugLog` arrives with `feature-new-data-explorer`. Branches without
> it have `hugoEnv` in `head.html` but no wrapper, so raw `console.log` is
> acceptable there in the interim. Prefer `debugLog` as soon as it exists on your
> branch.

### Two formats, scoped by file

**Call-depth markers** — the default, and what every data-explorer file uses. The
markers are load-bearing for debugging: preserve the existing depth when adding to
or modifying a function.

- `"* functionName"` — main render/show functions called by `renderCurrentView`
- `"** functionName"` — sub-functions called by a main function
- `"*** functionName"` — utility helpers one level deeper

```js
debugLog("* renderCurrentView");
debugLog("** renderBar");
debugLog("*** getGeoFile");
```

**Structured `'scope: event: value'`** — used by `assets/js/nr-topic-spa/`, where
the traces track a state machine rather than a call tree, and greppability by event
matters more than depth.

```js
debugLog('renderSection: enter:', { sectionId: section.id, neighborhoodName });
debugLog('renderSection: branch-missing-container:', section.containerId);
debugLog('bootstrap: start');
```

---

## HTML string indentation

When building HTML in a string — concatenated or a template literal — indent each
nested element to reflect the actual DOM hierarchy:

```js
const headerHTML =
    '<div class="card-header" id="' + headingId + '">' +
        '<h2 class="mb-0">' +
            '<button class="btn" type="button" ' +
                'data-toggle="collapse" data-target="#' + collapseId + '">' +
                '<div class="row">' +
                    '<div class="col-7">' +
                        '<span>' + row.indicator_short_name + '</span>' +
                    '</div>' +
                '</div>' +
            '</button>' +
        '</h2>' +
    '</div>';
```

---

## Worked example

```js
// ======================================================================= //
// example.js
// ======================================================================= //

// Geo helpers and default-measure selection used by all tab renderers

// ----------------------------------------------------------------------- //
// geo helpers
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// geo rank
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Assigns a sortable rank so geographies can be ordered from broad to fine
const assignGeoRank = (GeoType) => {

    switch (GeoType) {
        case 'Citywide': return 0;
        case 'Borough':  return 1;
        case 'UHF34':    return 3;
        // ...
    }

};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// default measure selection
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Finds the first measure in visArray whose MeasurementType satisfies typeMatcher
const findFirstMeasureByType = (visArray, typeMatcher) => {

    return visArray.find(measure => typeMatcher(measure.MeasurementType || ''));

};


// Picks one default measure using the shared priority order used by all tabs
const pickDefaultMeasureByPriority = (visArray) => {

    if (!visArray.length) {
        return null;
    }

    // ----- age-adjusted rate total has highest priority ----- //

    const ageAdjustedTotal = findFirstMeasureByType(visArray, t =>
        t.includes('Age-adjusted rate') && t.includes('Total')
    );

    if (ageAdjustedTotal) {
        return ageAdjustedTotal;
    }

    // ----- fall through remaining priority list ----- //

    const priorityMatchers = [
        t => t.includes('Age-adjusted rate'),
        t => t.includes('rate'),
        t => t.includes('Rate'),
        t => t.includes('Percent'),
        t => t.includes('percent'),
        t => t.includes('Density')
    ];

    for (const matcher of priorityMatchers) {
        const match = findFirstMeasureByType(visArray, matcher);
        if (match) {
            return match;
        }
    }

    return visArray[0];

};
```
