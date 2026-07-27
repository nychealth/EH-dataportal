<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts -->
<!-- docs-check verified: a5bba916ca 2026-07-27 -->

# Data Explorer — Interaction & Data Flow

How the Data Explorer SPA *sequences* — the load pipeline, what each interaction
triggers, how state and the URL stay in step, and where the ordering constraints
are. It deliberately does **not** inventory files or functions.

**Why the narrow scope.** This document previously carried a per-file function
table and a call-graph listing. Both rotted silently through five refactors —
by 2026-07-25 it named a file that had been merged away, omitted three that
existed, described three working chart renderers as console-logging stubs, and
cited ten identifiers that had been renamed. That content is also the least
useful kind to keep by hand: `grep` answers it faster and is never wrong. So the
inventory is gone, and what remains is the part that is genuinely hard to
reconstruct from source — *why* things happen in the order they do.

**Where the other content lives:**

| Looking for | Go to |
|---|---|
| Script load order, invariants, gotchas that must not be violated | `CLAUDE.md`, "Data explorer architecture" |
| What a given file or function does | The source. Start at `renderCurrentView` in `app.js`. |
| Known defects, findings, and their fix status | `documents/data-explorer-fresh-audit-2026-07-13.md` |
| Everything outside the SPA | `documents/site-wide-audit-2026-06-27.md` |

**Staleness guard.** `npm run docs-check` verifies every path and identifier this
document names against the source roots declared at the top. It cannot check
prose — that is what the `docs-check verified` commit stamp is for. If you change
behaviour described here, update the prose and re-stamp.

---

## 1. Shape of the thing

A full-screen Leaflet choropleth occupies the viewport. An overlay pane on the
right shows one of: bar chart, summary table, trend chart, or correlate chart.
Three dropdowns (Measure, Geography, Time Period) control what is displayed.
Indicators are chosen from a modal, and data plus metadata are fetched from a
GitHub-hosted JSON API at runtime.

There is no framework. Files are classic `<script>` tags sharing one global
lexical scope, loaded synchronously in a fixed order. They communicate through a
single namespace object, `DE`, declared in `global.js` — sub-objects `DE.state`,
`DE.table`, `DE.map`, `DE.trend`, `DE.links`, `DE.disparities`, `DE.print`,
`DE.lookups`, `DE.indicator`. Load order is load-bearing and enforced by nothing
but the template; see `CLAUDE.md`.

`renderCurrentView(updateMap)` in `app.js` is the central dispatcher. Everything
that changes what the user sees ends by calling it.

---

## 2. Initial load

1. `topic-indicator-selector.js` starts fetching `metadata.json` **at script
   parse time**, before any user interaction, and parks the promise. Everything
   that needs metadata goes through `ensureIndicatorsLoaded()`, which reuses the
   in-flight request rather than starting a second one.
2. `checkURL()` reads the query params via `parseSelectionFromURL()` and hands the
   result to `loadAndRenderIndicator()`, which is the pipeline.
3. `loadIndicator()` → `loadData()` fetches the indicator JSON, builds an Arquero
   table, fetches geography and time lookups in parallel, then `joinData()`
   produces the per-view tables.
4. `renderMeasures()` sorts measures into per-tab arrays, applies defaults, and
   builds the pill/dropdown controls.
5. `renderCurrentView(true)` renders the map plus whichever overlay `DE.state.overlay`
   names.

`renderIndicatorInfo()` and `render311Links()` write the indicator name,
description, and 311 action links independently of that chain — the pipeline
fires both before its first `await`, since neither waits on the data fetch.

---

## 3. Interactions

**Dropdown change** (`handleSelection`) — sets one field on `DE.state`, rebuilds
all three dropdowns (which also auto-corrects a now-invalid GeoType or
TimePeriodID), pushes to the URL, then `renderCurrentView(true)`.

**Tab click** — each of the four tabs maps to an overlay value (`bar`, `trend`,
`links`, `table`) in `app.js`'s `tabMap`. Sets `DE.state.overlay`, pushes to the
URL, then `renderCurrentView()` **without** `updateMap`: a tab switch reuses the
map already on screen.

**Tab toggle-off / close** — re-clicking the active tab, or its close button,
sets overlay to `'none'`. `renderCurrentView`'s `'none'` branch deactivates every
pill and hides the tab-content container. `closeExplorerTabPane()` in
`de-tab-content.js` handles the button.

**Indicator selection** (`selectIndicator`) — on a page that is not the target
indicator's own page, it simply navigates. Otherwise it runs the pipeline
in-place with `history: 'push'`, so the indicator being left behind keeps its
history entry.

**Back / forward** (`popstate`) — normalizes any legacy URL form, parses the
selection, then branches: if the indicator changed, run the pipeline with
`history: 'none'` (this URL *is* the entry being navigated to); if only
sub-selections changed, apply them to `DE.state`, rebuild the menus from metadata
already in memory, and re-render. Both paths end in `renderCurrentView(true)`.

---

## 4. State and the URL

The URL is the canonical record of a view. `buildCanonicalSearchParams()` writes
params in a stable order — `id`, `MeasureID`, `GeoType`, `TimePeriodID`,
`overlay` — omitting null values, so a fresh indicator can repopulate defaults.
`parseSelectionFromURL()` is its read counterpart, and `applySelectionToState()`
copies a parsed selection onto `DE.state`. Every entry point uses that pair, so
none of them can drift in how it coerces or aliases a param.

Three legacy forms are rewritten on arrival so the rest of the app only ever sees
canonical params: the `GeoTypeID` alias, the `overlay=map` value (now `bar`), and
hash-based state (`#display=…`, `#tab-…`). Each has its own normalizer, but
callers invoke them only through `normalizeLegacyURL()`, which runs all three —
they self-guard, so there is nothing to pre-check. It runs once at `app.js` parse
time (before `checkURL()` boots the app) and again on every `popstate`.

**One history write per navigation.** `loadAndRenderIndicator()` owns the URL for
the whole load; `loadIndicator()` and `resetSelectionForNewIndicator()` write no
history of their own. Its `history` option says which write to make — `'push'`
for a user-chosen view, `'replace'` for the initial load (the browser already
made that entry; it just lacks the resolved defaults), `'none'` for `popstate`.
The write happens *after* `renderMeasures()` so the URL carries the defaults it
just resolved. All history writes funnel through `writeHistoryState()`.

**Stale-load guard.** `loadAndRenderIndicator()` takes a token at entry and
re-checks it after each `await`; a load that has been superseded returns before
touching state, the URL, or the DOM. Without it, two loads started close together
interleave and the slower one finishes last, writing over the newer one.

**Naming seam:** the correlate view is called `links` throughout the code and in
the `?overlay=links` param, while the UI says "Correlate". Deliberate, deferred,
and costed in site-wide audit §4b — don't half-rename it.

---

## 5. Map ↔ bar interop

The map exposes `window.mapInterop`; the bar chart exposes its Vega view as
`window.myVegaView`. Hovering either highlights the matching geography in the
other. This is a genuine global contract between two files with no other
coupling, which is why it lives on `window` rather than in `DE`: it is behavior
handed across a seam, not app state.

**The contract is fixed and tiny.** `window.mapInterop` is created once, at
load, with `ready: false` and no-op members, and it has exactly three:
`ready`, `highlight(geoID)` and `reset()`. Callers gate on `ready` — never on
the object existing, and never on which map type is behind it. Both renderers
attach the same two functions once their geometry is on the map, so the bar
chart carries no choropleth-vs-bubble knowledge and no highlight state of its
own; each renderer tracks its own highlighted layer or marker, which is what
lets a map hover and a bar hover clear each other.

**`resetMapForRender()` detaches it.** Every render starts by pointing the
contract back at the no-ops, because the outgoing map's layers are removed
before the incoming geometry has been fetched. Without that, a hover landing in
the gap reached discarded layers — silently, since Leaflet ignores a detached
layer — while still writing the previous geography into the legend panel. The
same boundary clears the hover panel, which is why `clearHoverUI` sits at module
scope instead of inside `createHoverUIHelpers` with its per-render siblings.

The reverse direction goes through `setBarSelection(geoID)` in map.js — one
guard over `window.myVegaView`, called unconditionally by every map handler,
with `null` meaning "clear the linked highlight".

---

## 6. Ordering constraints

These are the failure modes that are invisible in the source and expensive to
rediscover. `CLAUDE.md` carries the full list; the ones that shape the flows
above:

- **`showBar()` depends on `filteredMapData`, which `showMap()` sets.** The bar
  chart cannot render before the map.
- **`showTable()` must not run in the same turn as `showMap()`.** DataTables
  initialization blocks Leaflet's first paint for 50–90 ms. When a redraw
  requests both, the table is scheduled behind the map's promise rather than run
  inline — hence the `updateMap` branch in `renderCurrentView`'s `table` case.
- **The seven `show*` renderers are declared `let` in `global.js` and *assigned*
  in `measures.js`.** Writing `const showMap = …` redeclares in the shared scope
  and throws at load time on every page. `npm run smoke` is the runtime catch.
- **Metadata is fetched once, at parse time.** Anything reading `indicators`
  directly rather than awaiting `ensureIndicatorsLoaded()` is a race.
