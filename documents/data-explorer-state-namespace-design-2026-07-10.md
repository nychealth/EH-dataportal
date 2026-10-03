# Data Explorer — Global-State Namespace Consolidation (Design)

## Status

**Exploratory — developed on a separate branch, not merged.** This is a proposal,
not a decision. The live data explorer's architecture is unchanged until this
lands. Do not treat this document, or the `DE.*` namespace it describes, as
canonical — and do not update `CLAUDE.md`'s "Data explorer architecture"
section or any memory note describing the current global-state model until
this work actually merges.

---

## Motivation

There is no active bug driving this. Two things motivate it:

1. **Speculative cleanup.** `global.js` declares roughly 90 shared `let`
   variables, read and written across all 14 synchronously-loaded SPA files
   (see `CLAUDE.md` → Data explorer architecture). The coupling between files
   is implicit — visible only by reading every file, not by grepping a
   boundary.
2. **Onboarding/readability.** For a self-trained team, an explicit namespace
   is a more approachable, more "professional" idiom than bare globals, and
   documents ownership (which module writes what) in the code itself.

A full ES-modules rewrite was considered and explicitly deferred to a
possible future phase — this design is an incremental step that does not
block or preclude that later work.

---

## Non-Goals

- **No ES modules.** Script tags, load order, and the synchronous
  `<script>`-per-file model are unchanged.
- **No behavior change.** This is purely a relocation of where state lives,
  not a change to what any function computes or renders.
- **No change to `DE_MEASURE_RULES`, `GEO_FILE_BY_TYPE`,
  `GEO_RANK_BY_PRETTY_TYPE`, or `geoTypes`.** These are static lookup
  constants, not churning per-session state, and are out of scope (see
  "Explicitly excluded" below).
- **No change to `show*` render closures, tab DOM refs, or DOM element
  caches.** See "Explicitly excluded."
- **No test-suite build-out beyond what this refactor needs.** See
  "Verification."

---

## Approach: grouped namespace object (`DE.*`)

A single top-level `const DE = { ... }` declared in `global.js`, with state
grouped into per-concern sub-objects (`DE.map`, `DE.table`, etc.) rather than
one flat bag holding every property. (Note: the flat alternative isn't named
here to avoid confusion with the actual `DE.state` group below, which holds
only the core identity fields — `IndicatorID`/`MeasureID`/`GeoType`/
`TimePeriodID`/`overlay` — not everything.)

**Why grouped over flat:**

- Each stage of the migration (see "Staging order") can introduce its own
  sub-object at the point where that concern is converted, rather than every
  stage funneling through one shared flat declaration.
- The grouping mirrors the module boundaries a future ES-module split would
  use — this is a real stepping stone toward that later phase, not just a
  readability preference.
- An unexpected cross-module write (e.g. `trend.js` writing into `DE.map.*`)
  is immediately visible/greppable in a way a flat namespace wouldn't surface.
- **Lower-regret direction:** collapsing grouped → flat later is a mechanical
  rename at each call site (e.g. `DE.map.foo` → `DE.all.foo`, or whatever a
  future flat bag is named), modulo resolving any name collisions across
  groups. Going the other way — flat → grouped — requires inventing the
  categorization from scratch. If grouping turns out to be over-engineered,
  the fallback is cheap; the reverse is not.

**Naming:** the top-level object is named `DE`. This continues a convention
already established by `DE_MEASURE_RULES`, and a repo-wide search confirms
`DE` is not currently used as a bare identifier anywhere in
`assets/js/data-explorer/`.

---

## Proposed groups

> **Corrected 2026-07-11.** The "files" column below was originally written
> during brainstorming, from `global.js`'s comments and a general sense of
> which tab owns which state — before any consuming file had been read
> line-by-line. Writing the implementation plan required grounding every
> group against the actual read/write sites, which turned up six corrections:
> most notably, `trend.js` and `correlate.js` touch **none** of their
> eponymous group's fields (both receive their data as function parameters),
> and `bar.js` / `de-tab-content.js` were missing entirely from the groups
> they do write to. The table below reflects the corrected, verified version.
> Full reasoning and exact line numbers are in
> `documents/data-explorer-state-namespace-plan-2026-07-10.md`'s "Field-to-group
> map and design-doc corrections" table — that document is the authoritative
> reference for implementation; this one stays the summary of intent.

| Group | Holds | Files that read/write it (verified against source) |
|---|---|---|
| `DE.state` | `IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay` | app.js, menu.js, topic-indicator-selector.js, data.js, measures.js, **de-tab-content.js** (writers); table.js, bar.js, print.js (readers) — highest blast radius |
| `DE.indicator` | Active indicator metadata (`indicator`, `indicatorName`, `indicatorDesc`, `indicatorLabel`, `indicatorShortName`, `indicatorMeasures`, `primaryIndicatorName`, `secondaryIndicatorName`) | data.js, measures.js (writers); map.js, bar.js, trend.js, table.js, print.js, disparities.js (readers) |
| `DE.lookups` | Per-indicator rebuilt tables (`geoTable`, `timeTable`, `timeLookup`, `aqMeasureDisplay`, `aqTableTimesGeos`, `aqMapTimesGeos`, `aqTrendTimesGeos`, `mapMeasures`, `trendMeasures`, `linksMeasures`, `disparitiesMeasures`, comparison lookups) | data.js, measures.js (writers); menu.js, table.js, trend.js (readers) |
| `DE.map` | `filteredMapData`, `mapData`, `selectedMapMeasure/Time/Geo`, map about/sources/metadata | map.js, measures.js, data.js (writers); print.js, correlate.js (readers) — **not** bar.js, which receives `filteredMapData` as a function parameter |
| `DE.table` | `selectedTableTimes`, `selectedTableGeography`, filter-manual flags, `tableNeedsRender`, `tableData` | table.js, measures.js (defaults + `showTable`), data.js (writes `tableData`) — not fully self-contained as originally thought |
| `DE.trend` | `selectedTrendMeasure(Id)`, borough/comparison-trend flags, trend about/sources/metadata, `trendData` | data.js, measures.js — **not** `trend.js` itself, whose renderer receives its data via function parameters |
| `DE.links` | Correlate-tab selections, primary/secondary measure metadata, `linksData` | data.js, measures.js — **not** `correlate.js` itself, whose renderer receives its data via function parameters |
| `DE.disparities` | `selectedDisparity`, comparison selections/metadata, `disparityData` | disparities.js, data.js (resets), measures.js (toggle + defaults) |
| `DE.print` | `printSpec`, `vizYear`, `vizGeography`, `vizSource`, `vizSourceSecond`, `chartType`, `CSVforDownload`, `downloadedIndicator*` | global.js, map.js, **bar.js**, trend.js, correlate.js, disparities.js (writers); print.js (reader) — **not** table.js, whose CSV export goes through the DataTables Buttons API |

---

## Explicitly excluded from the namespace

- **`DE_MEASURE_RULES`, `GEO_FILE_BY_TYPE`, `GEO_RANK_BY_PRETTY_TYPE`,
  `geoTypes`** — static lookup constants, not stateful. `DE_MEASURE_RULES` in
  particular is already a documented, working pattern (`CLAUDE.md` instructs
  future magic-ID additions to go there) — folding it into `DE.*` would be
  pure churn on something already correct.
- **`show*` render closures and tab refs** (`showMap`, `showBar`, `showTrend`,
  `showTable`, `showLinks`, `showBoroughTrend`, `showComparisonTrend`,
  `syncTrendSelectionsToMapSelection`, `syncLinksSelectionsToMapSelection`,
  `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable`) — these are closer to
  "module exports" than mutable state, and are the natural seam a future
  ES-module split would cut along. Namespacing them now would be churn
  without addressing the coupling this refactor targets.
- **DOM element ref caches** (`aboutMeasures`, `dataSources`,
  `btnToggleDisparities`) — element handles, not app data. Left bare for the
  same reason as the render closures.
- **The history-comparison global** (currently named `state` at
  `global.js:164`, compared against `window.history.state` in `data.js` to
  detect first-load vs. popstate navigation) — unrelated to app selection
  state, and stays a bare global. It is, however, renamed to `historyState`
  as **Stage 0** (see "Staging order"), specifically to free the `state` name
  for `DE.state`. This is a trivial, near-zero-risk rename: the variable is
  read at exactly two sites (`data.js:246`, `data.js:248`) and — worth noting
  in passing, though out of scope to fix here — is never actually assigned
  anywhere in the bundle, so it is always `undefined`. Since
  `undefined === null` is `false` in JS, the `state === null` half of both
  conditions has always evaluated to `false` — a pre-existing dead-condition
  quirk (the checks are effectively driven by `window.history.state === null`
  alone), unrelated to this refactor.

---

## Migration mechanic

**The "keep old bare names as aliases during a straddled transition" idea
does not work as a general technique here**, and this is worth stating
explicitly because it's a real technical constraint, not a style choice.
Every one of these ~90 globals is declared with `let`, not `var`. Top-level
`let`/`const` across separate classic `<script>` tags share the same global
*lexical* environment (which is exactly why this architecture works today —
`map.js` can read a `let` declared in `global.js`), but they are **not**
properties of `window`. A `var` could be aliased with a
`Object.defineProperty(window, name, { get, set })` shim; a `let` cannot be
intercepted that way, because reads of the bare identifier resolve via
lexical scoping, not the global object.

**Consequence:** no aliasing shim is used. Instead, each stage converts
**every file that reads or writes a given group's fields**, and deletes that
group's bare `let` declarations from `global.js`, in the same commit. A stage
is either fully converted or not started — there is no partially-migrated
state for a given group. Cross-cutting files (`print.js`, `menu.js`,
`data.js`, `measures.js`, `app.js`) are touched incrementally, once per stage
whose group they read or write, rather than once at the end.

---

## Staging order

Ordered narrowest blast radius first, so the pattern is proven before the
highest-stakes groups:

Files-touched below are the corrected lists (see the note under "Proposed
groups"); the stage order and grouping itself are unchanged from the
original design.

| Stage | Group | Files touched |
|---|---|---|
| 0 | rename `state` → `historyState` | global.js (declaration); data.js (2 read sites) — prerequisite, frees the `state` name for `DE.state` |
| 1 | `DE.table` | table.js, measures.js, data.js |
| 2 | `DE.disparities` | disparities.js, data.js, measures.js |
| 3 | `DE.links` | data.js, measures.js (**not** correlate.js — parameter-shadowed) |
| 4 | `DE.trend` | data.js, measures.js (**not** trend.js — parameter-shadowed) |
| 5 | `DE.map` | map.js, measures.js, data.js; print.js + correlate.js (readers) (**not** bar.js — parameter-shadowed) |
| 6 | `DE.print` | global.js, map.js, **bar.js**, trend.js, correlate.js, disparities.js (writers); print.js (reader) (**not** table.js) |
| 7 | `DE.lookups` | data.js, measures.js (writers); menu.js, table.js, trend.js (readers) |
| 8 | `DE.indicator` | data.js, measures.js (writers); map.js, bar.js, trend.js, table.js, print.js, disparities.js (readers) |
| 9 | `DE.state` | app.js, menu.js, topic-indicator-selector.js, data.js, measures.js, **de-tab-content.js**, table.js, bar.js, print.js — broadest, saved for last |

---

## Verification

No automated test suite currently exists for this app (confirmed in
`documents/site-wide-audit-2026-06-27.md` §7: no npm scripts, no lint, no
test). Given that, two things happen before Stage 1:

1. **A one-time Playwright characterization script.** Loads the dev server
   for a small set of representative indicators, exercises each tab
   (map/table/trend/links/disparities), and captures rendered outputs
   (selected measure labels, table row counts, marker counts, chart data
   attributes) as a baseline. This is dev-only tooling — it does not touch
   the shipped bundle or add a runtime dependency.
2. That same script is **re-run after every stage's conversion** as the
   regression check. It pays for itself specifically because there are 9
   stages to verify against one script.

Each stage is additionally verified with a Hugo rebuild + a fresh-tab manual
walkthrough of the affected tab(s), exercising the specific coupling gotchas
`CLAUDE.md` already documents for that area (e.g. Stage 5 must exercise map
*and* bar together, since `showBar` depends on `filteredMapData` set by
`showMap`).

---

## Documentation debt (deferred until merge)

Once — and only once — this refactor actually merges, the following need to
be updated to describe `DE.*` namespacing instead of the current bare-global
model:

- `CLAUDE.md` → "Data explorer architecture" section
- The `project-data-explorer-architecture` memory note
- Possibly `documents/data-explorer-architecture.md` (note: this document is
  already stale independent of this refactor — it describes the pre-cutover
  `data-explorer-new/` path and describes trend/correlate/disparities as
  console-log stubs, which they no longer are. That staleness is out of
  scope for this refactor and is not addressed here.)

None of this is touched by the current branch.
