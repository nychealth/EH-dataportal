# JavaScript Conventions — Data Explorer

Synthesized from `assets/js/data-explorer-old/` (formatting preferences) and
`assets/js/data-explorer/` (organizational improvements made during Copilot refactor).
Apply to all files in `assets/js/data-explorer/` and, when revising, to any other
browser-side JS in this repo.

---

## File header

Every file opens with a banner, the filename, and a one-sentence module description.
No blank line between the description line and the first section header.

```js
// ======================================================================= //
// filename.js
// ======================================================================= //

// One sentence describing what this file owns — noun-phrase style.
```

---

## Comment hierarchy

Four levels, each with a distinct marker. Use only the level appropriate to context —
don't promote a minor step to a section header just to add visual weight.

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
// --- step heading --- //
```

Use this level to break up functions that have 3+ distinct phases. If a function only
does one thing, no step comments are needed.

### Level 4 — Fine detail
Sub-steps, conditional branches, or inline clarifications within a phase.

```js
// - - - detail label - - - //
```

---

## Variable declarations

Group related variables under a short prose comment that explains what the group is
for — not just what the variables are. One blank line between groups.

```js
// Summary-table filter state persists across redraws until a new indicator resets it.
let selectedTableTimes = [];
let selectedTableGeography = [];

// Lookup tables are rebuilt on each indicator load and reused by menus and renderers.
let geoTable;
let timeTable;

// Per-view default metadata is recomputed per indicator load.
let defaultTrendMetadata;
let defaultMapMetadata;
```

Avoid long uncommented runs of variable declarations — they obscure intent and make it
hard to know what changed when.

---

## Function-level comments

Place a one-line purpose sentence directly above every named function or closure,
with no blank line between the comment and the function keyword.

```js
// Assigns a sortable rank so geographies can be ordered from broad to fine.
const assignGeoRank = (GeoType) => {
    ...
};
```

Rules:
- Complete sentence, active voice, present tense.
- One line only. If it takes more than one line the function may be doing too much.
- Describes the *why* or *contract*, not just a restatement of the name.
- This applies to `const fn = () =>`, `function fn()`, and method-style definitions alike.

---

## Internal step comments

For functions longer than ~20 lines, mark major phases with level-3 step comments.
Put a blank line before and after each step block.

```js
showMap = () => {

    // --- resolve metadata for the current MeasureID --- //

    let metadata = mapMeasures.filter(m => m.MeasureID == MeasureID);
    if (!metadata.length) metadata = defaultMapMetadata;

    // --- filter data by current globals --- //

    filteredMapData = mapData.filter(obj =>
        obj.MeasureID == MeasureID &&
        obj.TimePeriodID == TimePeriodID &&
        prettifyGeoType(obj.GeoType) == GeoType
    );

    // --- render --- //

    return renderMap(filteredMapData, metadata);

};
```

Use level-4 (`// - - - label - - - //`) for conditional branches or sub-steps within
a phase when the phase itself is long.

---

## Vertical whitespace

- Blank line after the opening `{` of any block longer than ~3 lines.
- Blank line before the closing `}`.
- Blank line between each logical group inside a function.
- Two blank lines between top-level function definitions.
- One blank line between variable groups in module-level declarations.

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

---

## Debug `console.log` naming

The `console.log` trace convention is load-bearing for debugging — preserve the
existing depth markers when adding to or modifying functions:

- `"* functionName"` — main render/show functions called by `renderCurrentView`
- `"** functionName"` — sub-functions called by a main function
- `"*** functionName"` — utility helpers one level deeper

---

## Worked example

```js
// ======================================================================= //
// example.js
// ======================================================================= //

// Geo helpers and default-measure selection used by all tab renderers.

// ----------------------------------------------------------------------- //
// geo helpers
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// geo rank
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Assigns a sortable rank so geographies can be ordered from broad to fine.
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

// Finds the first measure in visArray whose MeasurementType satisfies typeMatcher.
const findFirstMeasureByType = (visArray, typeMatcher) => {

    return visArray.find(measure => typeMatcher(measure.MeasurementType || ''));

};


// Picks one default measure using the shared priority order used by all tabs.
const pickDefaultMeasureByPriority = (visArray) => {

    if (!visArray.length) {
        return null;
    }

    // --- age-adjusted rate total has highest priority --- //

    const ageAdjustedTotal = findFirstMeasureByType(visArray, t =>
        t.includes('Age-adjusted rate') && t.includes('Total')
    );

    if (ageAdjustedTotal) {
        return ageAdjustedTotal;
    }

    // --- fall through remaining priority list --- //

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
