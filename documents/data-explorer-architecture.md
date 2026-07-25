<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts -->
<!-- docs-check verified: cef5aa1572 2026-07-25 -->

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
2. `checkURL()` reads query params, seeds `DE.state`, and triggers the pipeline.
3. `loadIndicator()` → `loadData()` fetches the indicator JSON, builds an Arquero
   table, fetches geography and time lookups in parallel, then `joinData()`
   produces the per-view tables.
4. `renderMeasures()` sorts measures into per-tab arrays, applies defaults, and
   builds the pill/dropdown controls.
5. `renderCurrentView(true)` renders the map plus whichever overlay `DE.state.overlay`
   names.

`renderIndicatorInfo()` and `render311Links()` write the indicator name,
description, and 311 action links independently of that chain.

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
indicator's own page, it simply navigates. Otherwise it runs the full pipeline
in-place: reset sub-selections → `renderIndicatorInfo` → `render311Links` →
`loadIndicator` → `renderMenus` → `renderMeasures` → push URL → render.

**Back / forward** (`popstate`) — normalizes any legacy URL form first, restores
overlay, then branches: if the indicator changed, re-run the whole pipeline; if
only sub-selections changed, sync `DE.state`, rebuild the menus from metadata
already in memory, and re-render. Both paths end in `renderCurrentView(true)`.

---

## 4. State and the URL

The URL is the canonical record of a view. `buildCanonicalSearchParams()` writes
params in a stable order — `id`, `MeasureID`, `GeoType`, `TimePeriodID`,
`overlay` — omitting null values, so a fresh indicator can repopulate defaults.

Three legacy forms are rewritten on arrival, each by its own normalizer, so the
rest of the app only ever sees canonical params: the `GeoTypeID` alias, the
`overlay=map` value (now `bar`), and hash-based state (`#display=…`, `#tab-…`).
All history writes funnel through `writeHistoryState()` so push and replace stay
consistent.

**Naming seam:** the correlate view is called `links` throughout the code and in
the `?overlay=links` param, while the UI says "Correlate". Deliberate, deferred,
and costed in site-wide audit §4b — don't half-rename it.

---

## 5. Map ↔ bar interop

The map exposes `window.mapInterop`; the bar chart exposes its Vega view as
`window.myVegaView`. Hovering either highlights the matching geography in the
other. This is a genuine global contract between two files with no other
coupling, which is why it is on `window` rather than in `DE` — and why the audit
tracks hardening it as Tier 4.3.

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
