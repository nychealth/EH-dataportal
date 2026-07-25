# Data Explorer — Architecture & Interaction Flow

This document describes the data explorer SPA built under `data-explorer-new/`. It covers every file, the data pipeline, state management, URL synchronization, interaction-by-interaction behavior.

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Key Files and Responsibilities](#2-key-files-and-responsibilities)
- [3. Initial Load Flow](#3-initial-load-flow)
- [4. Interaction Flows](#4-interaction-flows)
  - [4.1 Dropdown Change](#41-dropdown-change)
  - [4.2 Tab Click](#42-tab-click)
  - [4.3 Tab Toggle-Off (re-click active tab)](#43-tab-toggle-off-re-click-active-tab)
  - [4.4 Tab Close Button](#44-tab-close-button)
  - [4.5 Indicator Selection (modal)](#45-indicator-selection-modal)
  - [4.6 Browser Back / Forward](#46-browser-back--forward)
  - [4.7 Page Load Without Indicator ID](#47-page-load-without-indicator-id)
  - [4.8 Map / Bar Hover Interop](#48-map--bar-hover-interop)
- [5. State and URL Synchronization](#5-state-and-url-synchronization)
- [6. Rendering Pipeline](#6-rendering-pipeline)
- [7. Risks, Edge Cases, and Current Constraints](#7-risks-edge-cases-and-current-constraints)

---

## 1. Overview

The data explorer is a single-page application embedded inside a Hugo-generated page. A full-screen **Leaflet choropleth map** occupies the left side of the viewport. An **overlay pane** on the right can show a bar chart, data table, trend chart, or correlate chart. Three **dropdown menus** (Measure, Geography, Time Period) control what data is displayed. Users pick a health indicator from a modal, and the page loads data and metadata from a GitHub-hosted JSON API.

All JavaScript lives in `assets/js/data-explorer-new/`. Scripts are loaded synchronously (not bundled) in a specific order from the Hugo template. They communicate through global variables declared in `global.js`.

The architecture follows a **globals + functions** pattern rather than a framework. Each file declares functions that read from and write to a shared set of global variables. A central dispatcher, `renderCurrentView()`, switches on the `overlay` global to decide which tab-specific `show*` function to call.

---

## 2. Key Files and Responsibilities

Scripts are loaded in this order by `themes/dohmh/layouts/data-explorer-new/single.html`:

| # | File | Purpose |
|---|------|---------|
| 1 | **global.js** | Declares every shared variable: state globals (`IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay`), data holders (`mapData`, `trendData`, `tableData`, `filteredMapData`), function references (`showMap`, `showBar`, `showTable`, `showTrend`, `showLinks`), and DOM references (`tabBar`, `tabTrends`, etc.). Also contains `copyCitation()` and `renderAboutSources()`. |
| 2 | **utilities.js** | Pure helper functions with no side effects: `getGeoFile()` (geography → TopoJSON filename), `assignGeoRank()` (geography → numeric rank for sorting), `prettifyGeoType()` (versioned geo → generic label, e.g. NTA2020 → NTA), `updateChartPlotSize()` (fires a resize event on a delay). |
| 3 | **app.js** | URL helpers (`buildCanonicalSearchParams`, `pushSelectionToURL`, `resetSelectionForNewIndicator`, `normalizeLegacyGeoTypeURL`, `normalizeLegacyOverlayURL`), the central `renderCurrentView(updateMap)` dispatcher, the `popstate` handler, and `DOMContentLoaded` tab-click listeners. |
| 4 | **data.js** | `loadIndicator()` — sets `IndicatorID`, manages history state, resets per-indicator flags, calls `loadData()`. `loadData()` — fetches indicator JSON, creates Arquero table with GeoRank, calls `loadGeo()` + `loadTime()` in parallel, then `joinData()`. `joinData()` — builds `aqMeasureDisplay`, `aqTableTimesGeos`, `aqMapTimesGeos`, `aqTrendTimesGeos`. |
| 5 | **measures.js** | `renderMeasures()` — populates per-tab measure arrays (`mapMeasures`, `trendMeasures`, `linksMeasures`, `disparitiesMeasures`), sets metadata defaults, **defines the show\* function closures** (`showMap`, `showBar`, `showTable`, `showTrend`, `showLinks`, `showBoroughTrend`, `showComparisonTrend`), enables/disables tabs, activates the Bootstrap pill matching `overlay`. Also contains `setDefaultMapMeasure`, `setDefaultTrendMeasure`, `setDefaultLinksMeasure`, `setDefaultDisparitiesMeasure`, and `bindCorrelateControls`. |
| 6 | **table.js** | `renderTable(tableData)` — pivots Arquero data, builds an HTML table, initializes DataTables with grouping, sorting, and row-toggle behavior. |
| 7 | **map.js** | `initBaseMap()` (runs immediately on script load — sets up the Leaflet tile layer), `renderMap(data, metadata)` — fetches TopoJSON, attaches data, renders a GeoJSON layer with Viridis color scale, sets up hover/click interop with the bar chart via `window.mapInterop` and `window.myVegaView`. |
| 8 | **311.js** | `render311Links(indicator_id)` — fetches 311-crosswalk.csv and renders "Contact 311" links for the current indicator. |
| 9 | **topic-indicator-selector.js** | `indicators` global + `indicatorsPromise` (metadata.json fetch starts immediately), `ensureIndicatorsLoaded()`, `printIndicators()` (populate the indicator modal), `selectIndicator()` (SPA-style indicator switch), `checkURL()` (reads URL params on page load, seeds globals, triggers the full load pipeline), `printIndicatorInfo()` (writes indicator name/description to the DOM). |
| 10 | **menu.js** | `getDefaultMeasure()` (priority-based measure selection), `printMenus()` (initializes dropdowns), `updateAllMenus()` (rebuilds all three dropdowns from current globals, auto-corrects invalid GeoType/TimePeriodID), `styleAndPrintMenu()` (renders dropdown items with click handlers), `handleSelection()` (sets one global, calls `updateAllMenus` → `pushSelectionToURL` → `renderCurrentView(true)`). |
| 11 | **bar.js** | `renderBar(data, metadata, geography, timePeriod)` — builds a Vega-Lite spec (bar, dot+CI, or dot+gray-bar for means), compiles to Vega, embeds via `vegaEmbed`, stores `window.myVegaView`, and sets up bar → map hover interop via `window.mapInterop`. |
| 12 | **trend.js** | `renderTrendChart(data, metadata)` — **stub** (logs to console only). |
| 13 | **correlate.js** | `renderCorrelate(data, ...)` — **stub** (logs to console only). |
| 14 | **disparities.js** | `renderDisparitiesChart(data)` — **stub** (logs to console only). |

**Hugo template files:**

| File | Purpose |
|------|---------|
| **single.html** | Loads all scripts in order, injects indicator JSON from front matter, calls `printIndicators()` then `checkURL()`. |
| **de-tabs.html** | Wraps `de-tab-content` and `de-tab-button` partials inside the `de-tabs` container. |
| **de-tab-button.html** | Renders the vertical green icon-bar: four `nav-link[data-toggle="pill"]` links (Bar, Trends, Correlate, Table) plus a Data Sources link. Mobile "Take Action" dropdown. |
| **de-tab-content.html** | Renders tab panes (`#v-pills-bar`, `#v-pills-table`, `#v-pills-trends`, `#v-pills-correlate`, `#v-pills-ds`) and close buttons. Its tab-toggle / `closeExplorerTabPane` / mobile-accordion / `has-open-panel` MutationObserver logic was externalized (2026-07-03) to `assets/js/data-explorer/de-tab-content.js`, loaded via the fingerprint pipeline. |
| **de-indicator-info.html** | Upper-left indicator info box with name, description, "Change dataset" button, the three dropdown menus (Measure, Boundary, Year), and the Viridis legend with hover feedback. |

**Not loaded in the active pipeline** (legacy/prototype files present in the directory):

- `_bar.js` — earlier bar chart prototype (uses hardcoded spec, references the old `geoIDtoLayer`/`geojsonLayer` globals from `choro.js`).
- `basemap.js` — standalone Leaflet init (superseded by `initBaseMap()` in `map.js`).
- `choro.js` — standalone choropleth builder (superseded by `renderMap()` in `map.js`).
- `choroData.js` — hardcoded sample data array for prototyping.
- `geography.js` — hardcoded TopoJSON arcs for prototyping.

---

## 3. Initial Load Flow

This is the complete sequence when a user lands on a URL like `?id=2133&MeasureID=239&GeoType=CD&TimePeriodID=296`.

### 3.1 HTML Parse & Script Execution

1. Hugo renders `single.html`, which includes the tab/button/info partials.
2. Scripts load synchronously in order (see §2).
3. `global.js` — all shared variables initialized to `undefined`/`null`.
4. `utilities.js` — helper functions available.
5. `app.js` — `renderCurrentView`, URL helpers, `popstate` listener registered. `DOMContentLoaded` listener queued (fires later).
6. `data.js` — `loadIndicator` and data pipeline functions available.
7. `measures.js` — `renderMeasures` and default-measure functions available.
8. `table.js`, `map.js` — `renderTable` and `renderMap`/`initBaseMap` available. **`initBaseMap()` runs immediately**, creating the Leaflet map and tile layer.
9. `311.js`, `topic-indicator-selector.js` — `indicatorsPromise` starts fetching `metadata.json` immediately.
10. `menu.js`, `bar.js`, `trend.js`, `correlate.js` — remaining functions available.

### 3.2 Inline Script Block

After all `<script>` tags, the inline block runs:

```
printIndicators(these_indicators, destination)   // populate indicator modal
checkURL()                                        // read URL, load data, render
```

### 3.3 checkURL() — the main entry point

```
checkURL()
├── read URL params → seed IndicatorID, MeasureID, GeoType, TimePeriodID, overlay
├── normalizeLegacyGeoTypeURL()       // GeoTypeID → GeoType via replaceState
├── printIndicatorInfo(id)            // write name/description to DOM
├── render311Links(id)                // fetch + render 311 links
├── ensureIndicatorsLoaded()          // await metadata.json if not ready
├── loadIndicator(id)
│   ├── set overlay = 'none' if not already set
│   ├── set IndicatorID
│   ├── reset per-indicator flags (selectedMapMeasure, etc.)
│   ├── replaceState or pushState for indicator
│   └── loadData(id)
│       ├── fetch indicator JSON → build Arquero table with GeoRank
│       ├── loadGeo() + loadTime() in parallel
│       └── joinData() → aqMeasureDisplay, aqTableTimesGeos, aqMapTimesGeos, aqTrendTimesGeos
├── printMenus(id)
│   ├── validate MeasureID → fallback to getDefaultMeasure()
│   └── updateAllMenus(indicator)
│       ├── validate GeoType → fallback to finest available
│       ├── validate TimePeriodID → fallback to most recent
│       └── render all three dropdown menus
├── renderMeasures()
│   ├── populate mapMeasures, trendMeasures, linksMeasures, disparitiesMeasures
│   ├── set metadata defaults
│   ├── define showMap, showBar, showTable, showTrend, showLinks closures
│   ├── enable/disable tabs
│   └── activate Bootstrap pill if overlay !== 'none'
├── pushSelectionToURL()              // sync full state (including defaults) to URL
└── renderCurrentView(true)
    ├── showMap()                     // Leaflet choropleth (updateMap = true)
    └── switch(overlay) → showBar / showTable / showTrend / showLinks / close panes
```

### 3.4 DOMContentLoaded (fires after inline block)

- Caches DOM references: `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable`, `aboutMeasures`, `dataSources`, `correlatePillRow`.
- Registers tab click handlers (§4.2).
- `de-tab-content.html` inline scripts: toggle-off handler (§4.3), `closeTabPane` (§4.4), mobile accordion, `updateHasOpenPanelClass()` with MutationObserver.
- Calls `updateHasOpenPanelClass()` immediately to set the initial panel-expanded state.

---

## 4. Interaction Flows

### 4.1 Dropdown Change

**Trigger:** User clicks a Measure, Geography, or Time Period dropdown item.

**Files:** `menu.js`

**Sequence:**

1. `styleAndPrintMenu` bound `click` → `handleSelection(type, value)`.
2. `handleSelection` sets **only the clicked global** (`MeasureID`, `GeoType`, or `TimePeriodID`). Sibling globals are preserved.
3. `updateAllMenus(indicator)` validates siblings:
   - If `GeoType` is not in the current measure's available geographies → picks the finest available.
   - If `TimePeriodID` is not in the current geo's available time periods → picks the most recent.
   - Re-renders all three dropdown menus with `is-selected` highlighting.
4. `pushSelectionToURL()` → `pushState` with canonical params.
5. `renderCurrentView(true)` → `showMap()` re-renders the Leaflet choropleth, then the active overlay tab re-renders.

**UI change:** Map updates with new data. Active overlay (bar chart, table, etc.) refreshes. Dropdown labels update.

**Key design:** Sibling dropdowns are only reset when genuinely invalid for the new selection.

### 4.2 Tab Click

**Trigger:** User clicks a tab icon (Bar, Trends, Correlate, Table).

**Files:** `app.js` (DOMContentLoaded listener), `de-tab-content.html` (inline listener for `#v-pills-tabContent` visibility)

**Sequence:**

1. `app.js` tab click handler fires:
   - Sets `overlay` to the clicked tab's value (`'bar'`, `'trend'`, `'links'`, `'table'`).
   - `pushSelectionToURL()` → `pushState`.
   - `renderCurrentView()` — note: called **without** `true`, so `updateMap` defaults to `false`. The Leaflet map is **not** re-rendered.
2. Bootstrap processes `data-toggle="pill"` → shows the target pane, hides others.
3. `de-tab-content.html` click listener ensures `#v-pills-tabContent` is `display: block`.
4. MutationObserver detects style change → `updateHasOpenPanelClass()` adds `has-open-panel` to `.de-tabs`.

**UI change:** The overlay pane slides open (or switches) to the selected tab. The Leaflet map stays unchanged.

### 4.3 Tab Toggle-Off (re-click active tab)

**Trigger:** User clicks the already-active tab icon.

**Files:** `de-tab-content.html` (inline DOMContentLoaded listener)

**Sequence:**

1. The inline listener fires first because it's registered earlier in the DOM.
2. Detects `this.classList.contains('active') && targetPane.classList.contains('show')`.
3. Calls `e.preventDefault()` and `e.stopImmediatePropagation()` — prevents Bootstrap from re-showing the tab and prevents the `app.js` handler from firing.
4. Removes `active` / `show` classes, sets `#v-pills-tabContent` to `display: none`.
5. Sets `overlay = 'none'`, calls `pushSelectionToURL()`.
6. MutationObserver → `updateHasOpenPanelClass()` removes `has-open-panel`.

**UI change:** Overlay pane collapses. Map expands to full width.

### 4.4 Tab Close Button

**Trigger:** User clicks the `>` close button inside the overlay pane.

**Files:** `de-tab-content.html` (`closeTabPane()` function, called via `onclick`)

**Sequence:**

1. `closeTabPane(paneId)` — removes `active`/`show` from tab + pane, sets `display: none`, sets `overlay = 'none'`, calls `pushSelectionToURL()`.
2. MutationObserver → removes `has-open-panel`.

**UI change:** Same as toggle-off. Pane closes, map expands.

### 4.5 Indicator Selection (modal)

**Trigger:** User clicks an indicator in the modal.

**Files:** `topic-indicator-selector.js`

**Sequence:**

1. `selectIndicator(id)` fires.
2. `dismissIndicatorModal()` → hides the Bootstrap modal.
3. `resetSelectionForNewIndicator(id)` → nulls `MeasureID`, `GeoType`, `TimePeriodID` (`overlay` is preserved), does `replaceState` with just `?id=N`.
4. `printIndicatorInfo(id)` → updates name/description.
5. `render311Links(id)` → fetches 311 links.
6. `ensureIndicatorsLoaded()` → waits for metadata if needed.
7. `loadIndicator(id)` → full data pipeline (see §3.3).
8. `printMenus(id)` → sets default MeasureID, builds menus.
9. `renderMeasures()` → defines new `show*` closures, enables/disables tabs.
10. `pushSelectionToURL()` → `pushState` with new defaults.
11. `renderCurrentView(true)` → map + active overlay render.

**UI change:** Entire page refreshes with new indicator data. Dropdowns populate with new options. Map and active overlay show new data.

### 4.6 Browser Back / Forward

**Trigger:** User presses browser back or forward.

**Files:** `app.js` (`popstate` handler)

**Sequence:**

1. Read URL params → extract `id`, `MeasureID`, `GeoType` (with `GeoTypeID` fallback), `TimePeriodID`, `overlay`.
2. Normalize legacy aliases (`GeoTypeID` → `GeoType`, `overlay=map` → `overlay=bar`).
3. Restore `overlay` global.
4. **If indicator changed:** full reload pipeline (`loadIndicator` → `printIndicatorInfo` → `printMenus` → `renderMeasures` → `renderCurrentView(true)`).
5. **If same indicator:** update sub-globals, sync dropdown menus via `updateAllMenus`, call `renderCurrentView(true)`.

**UI change:** Page state matches the restored URL. Map and overlays update accordingly.

### 4.7 Page Load Without Indicator ID

**Trigger:** URL has no `?id=` parameter.

**Files:** `topic-indicator-selector.js` (`checkURL`)

**Sequence:**

1. `checkURL` detects no valid `id`.
2. Registers a `window.addEventListener('load', ...)` to open `#indicatorSelector.modal('show')` after Bootstrap loads.
3. No data is loaded, no map is rendered.

**UI change:** Indicator selection modal appears over an empty page.

### 4.8 Map / Bar Hover Interop

**Trigger:** User hovers over a map polygon or a bar chart bar.

**Files:** `map.js`, `bar.js`

**Map → Bar:**

1. Leaflet `mouseover` on a GeoJSON feature.
2. `highlightFeature(e)` styles the polygon.
3. `updateHoverUI(props)` updates the legend with geography name, value, and tick position.
4. If `window.myVegaView` exists, sets the `selectedGeo` Vega signal → highlights the corresponding bar.

**Bar → Map:**

1. Vega `mouseover` event fires.
2. Reads `item.datum.GeoID`, looks up `window.mapInterop.geoIDtoLayer[geoID]`.
3. Calls `highlightFeature({ target: layer })` on the map layer.
4. Calls `updateHoverUI(layer.feature.properties)` for legend feedback.

**Mouseout:** Both sides reset highlights and clear the legend.

---

## 5. State and URL Synchronization

### 5.1 Global State Variables

| Variable | Type | Set by |
|----------|------|--------|
| `IndicatorID` | number | `checkURL`, `loadIndicator`, `popstate` |
| `MeasureID` | number | `checkURL`, `printMenus`, `handleSelection`, `updateAllMenus`, `popstate` |
| `GeoType` | string | `checkURL`, `updateAllMenus`, `handleSelection`, `popstate` |
| `TimePeriodID` | number | `checkURL`, `updateAllMenus`, `handleSelection`, `popstate` |
| `overlay` | string | `checkURL`, `loadIndicator` (default `'none'`), tab clicks, toggle-off, close button, `popstate` |

### 5.2 URL Format

Canonical URL: `?id=2133&MeasureID=239&GeoType=CD&TimePeriodID=296&overlay=bar`

Parameters are written in a stable order by `buildCanonicalSearchParams()`: `id`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay`. Only non-null values are included.

### 5.3 pushState vs replaceState

| Function | History method | When used |
|----------|---------------|-----------|
| `pushSelectionToURL()` | `pushState` | Dropdown change, tab click, toggle-off, close, after initial load |
| `resetSelectionForNewIndicator()` | `replaceState` | Before loading a new indicator (clears stale params) |
| `normalizeLegacyGeoTypeURL()` | `replaceState` | Silently renames `GeoTypeID` → `GeoType` |
| `normalizeLegacyOverlayURL()` | `replaceState` | Silently renames `overlay=map` → `overlay=bar` |
| `loadIndicator()` | `replaceState` on first load, `pushState` on indicator change | Setting the indicator in history |

### 5.4 Legacy Aliases

- **`GeoTypeID`** — accepted on read (`checkURL`, `popstate`), normalized to `GeoType` via `replaceState`.
- **`overlay=map`** — accepted on read, normalized to `overlay=bar` via `replaceState`. The `renderCurrentView` switch also maps the `'map'` case to `showBar()`.

---

## 6. Rendering Pipeline

### 6.1 Data Flow

```
metadata.json (indicators)
    ↓
indicator JSON (per-indicator data)
    ↓ loadData()
Arquero table with GeoRank
    ↓ joinData()
aqTableTimesGeos, aqMapTimesGeos, aqTrendTimesGeos
    ↓ renderMeasures()
mapMeasures, trendMeasures, linksMeasures, disparitiesMeasures
    ↓ show* functions
filteredMapData → renderMap()   (Leaflet)
filteredMapData → renderBar()   (Vega)
tableData       → renderTable() (DataTables)
trendData       → renderTrendChart()  (stub)
linksData       → renderCorrelate()   (stub)
```

### 6.2 renderCurrentView(updateMap) Dispatch

```js
renderCurrentView(updateMap = false)
├── if updateMap && showMap → showMap()     // Leaflet choropleth
└── switch (overlay)
    ├── 'none'  → close all panes
    ├── 'bar'   → showBar()
    ├── 'table' → showTable()
    ├── 'map'   → showBar()                // legacy alias
    ├── 'trend' → showTrend()
    ├── 'links' → showLinks()
    └── default → showBar()
```

**`updateMap` is `true`** when called from: dropdown changes (`handleSelection`), initial load (`checkURL`), indicator selection (`selectIndicator`), `popstate`.

**`updateMap` is `false` (default)** when called from: tab clicks. The Leaflet map doesn't need to re-render when the user is just switching overlay panes.

### 6.3 showMap vs showBar (Decoupled)

Both are closures defined inside `renderMeasures()`:

- **`showMap()`** — filters `mapData` by `MeasureID`, `TimePeriodID`, `GeoType` → stores in `filteredMapData` → calls `renderMap(filteredMapData, metadata)`.
- **`showBar()`** — sets `overlay = 'bar'` → resolves metadata → calls `renderBar(filteredMapData, metadata, GeoType)`. Uses the already-filtered `filteredMapData` from `showMap()`.

They are fully independent. `renderMap` does not call `renderBar`, and vice versa.

---

## 7. Risks, Edge Cases, and Current Constraints

### 7.1 Stale Closures After Indicator Change

The `show*` functions are closures defined inside `renderMeasures()`. After `renderMeasures()` runs, the previous closures are replaced. If any code still holds a reference to an old closure, it will operate on stale data. Currently this is safe because all call sites go through the global `showMap`/`showBar`/etc. references, which are reassigned each time.

### 7.2 filteredMapData Dependency

`showBar()` reads `filteredMapData` (set by `showMap()`). If `showBar()` runs before `showMap()` has filtered the data, the bar chart will show stale or empty data. Currently this is safe because `renderCurrentView` always calls `showMap()` first when `updateMap` is true, and on tab clicks the data is already filtered from the most recent dropdown change.

### 7.3 Stub Renderers

`renderTrendChart`, `renderCorrelate`, and `renderDisparitiesChart` are stubs. The `showTrend`, `showLinks`, and `showComparisonTrend` functions contain full data-filtering logic but the final render calls do nothing visible.

### 7.4 DataTables Reinitialization

`renderTable` calls `#tableID.DataTable(...)` every time. If called a second time for the same indicator without the DataTable being properly destroyed, it can throw or silently fail. Currently, the table HTML is fully replaced (`innerHTML = ...`) before each init, which avoids double-init but doesn't explicitly destroy the old instance.

### 7.5 Race Conditions

`loadIndicator` is async. If a user rapidly switches indicators, multiple `loadIndicator` calls could overlap. There is no cancellation mechanism. The last one to complete wins, but intermediate state changes (flags, globals) could cause brief inconsistencies.

### 7.6 Duplicate DOM IDs

The mobile and desktop dropdown menus share some IDs (e.g., `measureOptionsDropdownButton` appears twice in `de-indicator-info.html`). `menu.js` uses `querySelectorAll('.measures-holder')` (class-based) to populate both, which works correctly, but the duplicate IDs are technically invalid HTML.

### 7.7 window.mapInterop Lifecycle

`window.mapInterop` is set inside `renderMap`'s `.then()` chain. If the bar chart renders before the map's TopoJSON fetch completes, bar → map hover interop will silently fail (no crash, but no highlight). This is typically not an issue because the map renders first.
