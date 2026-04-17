# Data Explorer – Architecture & Logic Flow

This document describes the architecture, data flow, event handling, and rendering pipeline of the **new Data Explorer** (`data-explorer-new`). It covers what happens on page load, when users interact with tabs, dropdowns, and the browser back/forward buttons, and how state is synchronized between JavaScript globals and the URL.

---

## Table of Contents

- [Broad Overview](#broad-overview)
- [Script Loading Order](#script-loading-order)
- [File Responsibilities](#file-responsibilities)
- [State Management](#state-management)
- [Detailed Flow: Page Load](#detailed-flow-page-load)
- [Detailed Flow: Tab Click](#detailed-flow-tab-click)
- [Detailed Flow: Tab Toggle-Off (Close via Icon)](#detailed-flow-tab-toggle-off-close-via-icon)
- [Detailed Flow: Close Button (Arrow)](#detailed-flow-close-button-arrow)
- [Detailed Flow: Dropdown Selection](#detailed-flow-dropdown-selection)
- [Detailed Flow: Indicator Selection](#detailed-flow-indicator-selection)
- [Detailed Flow: Browser Back / Forward](#detailed-flow-browser-back--forward)
- [Event Listener Registration Order](#event-listener-registration-order)
- [Data Pipeline](#data-pipeline)
- [Tab Enable / Disable Logic](#tab-enable--disable-logic)
- [Suggestions for Improvement](#suggestions-for-improvement)

---

## Broad Overview

The Data Explorer is a single-page application (SPA) built on top of a Hugo static site. Each topic page (e.g., "Air Quality", "Asthma") loads the same set of JavaScript files. The user picks an indicator, and the app fetches indicator data from a JSON API, processes it with **Arquero** (a tabular data library), and renders visualizations using **Leaflet** (maps), **Vega-Lite** (bar charts, scatter plots), **DataTables** (summary tables), and custom trend charts.

**Core architecture pattern: globals + URL sync.**

1. **Global variables** (`IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay`) hold the current application state.
2. The **URL search params** are the source of truth on page load and on `popstate` (browser back/forward).
3. After any user interaction (tab click, dropdown change, indicator selection), the app updates globals first, then calls `pushSelectionToURL()` to sync globals → URL.
4. `renderCurrentView()` dispatches to the appropriate `show*()` function based on the `overlay` global.
5. The `show*()` functions (defined inside `renderMeasures()`) have closure access to the loaded indicator data and call the actual rendering functions (`renderMap`, `renderBar`, `renderTable`, `renderTrendChart`, `renderCorrelate`).

**Visual layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Indicator info bar (name, description, 311 buttons)     │
├──────────┬──────────────────────┬────────────────────────┤
│ Dropdowns│                      │  Green sidebar with    │
│ (Measure,│    Leaflet Map       │  tab icons (Bar,       │
│  Geo,    │    (always visible)  │  Trends, Correlate,    │
│  Time)   │                      │  Table, Data Sources)  │
│          │                      ├────────────────────────┤
│          │                      │  Right overlay pane    │
│          │                      │  (bar chart, table,    │
│          │                      │  trend, correlate, or  │
│          │                      │  data sources)         │
├──────────┴──────────────────────┴────────────────────────┤
│  About / How Calculated / Citation                       │
└──────────────────────────────────────────────────────────┘
```

The right overlay pane expands (50% width at ≥720px viewport) when a tab is active, controlled by the CSS class `has-open-panel` on the `.de-tabs` container. When `overlay=none`, the pane collapses to the icon sidebar width (72px).

---

## Script Loading Order

Defined in `themes/dohmh/layouts/data-explorer-new/single.html` (lines 41–81). All scripts are loaded synchronously (no `defer`), so they execute in this exact order:

| #  | File | Purpose |
|----|------|---------|
| 1  | `global.js` | Declares all global variables |
| 2  | `utilities.js` | Helper functions (`getGeoFile`, `assignGeoRank`, `prettifyGeoType`) |
| 3  | `app.js` | URL helpers, `renderCurrentView()`, tab click listeners, `popstate` handler |
| 4  | `data.js` | `loadIndicator()`, `loadData()`, `loadGeo()`, `loadTime()`, `joinData()` |
| 5  | `measures.js` | `renderMeasures()`, `setDefault*Measure()`, defines `show*()` functions |
| 6  | `table.js` | `renderTable()` — DataTables rendering |
| 7  | `map.js` | `initBaseMap()`, `renderMap()` — Leaflet map |
| 8  | `311.js` | `draw311Buttons()` — 311 complaint links |
| 9  | `topic-indicator-selector.js` | `checkURL()`, `selectIndicator()`, `printIndicators()`, metadata fetch |
| 10 | `menu.js` | `printMenus()`, `updateAllMenus()`, `handleSelection()`, dropdown rendering |
| 11 | `bar.js` | `renderBar()` — Vega-Lite bar chart |
| 12 | `trend.js` | `renderTrendChart()` — trend chart rendering |

After all scripts load, `single.html` has an inline `<script>` block that calls:
```js
printIndicators(these_indicators, destination);
checkURL();
```

Additionally, `de-tab-content.html` (included as a Hugo partial) registers its own `DOMContentLoaded` listeners **before** `app.js`'s `DOMContentLoaded` listeners fire, because inline `<script>` blocks in partials execute during HTML parsing while `DOMContentLoaded` callbacks run after parsing completes. However, since both use `DOMContentLoaded`, the order depends on registration: the partial's listeners register first (earlier in the DOM), so they fire first.

---

## File Responsibilities

### `global.js`
Declares every global variable used across files. This includes:
- **State globals**: `IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay`
- **Data globals**: `indicator`, `indicatorMeasures`, `mapData`, `trendData`, `linksData`, `tableData`, `joinedAqData`, etc.
- **UI element refs**: `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable`, `btnToggleDisparities`
- **Function refs**: `showTable`, `showMap`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks` (assigned inside `renderMeasures()`)
- **Selection flags**: `selectedMapMeasure`, `selectedTrendMeasure`, `selectedLinksMeasure`, etc.

### `utilities.js`
Pure helper functions:
- `getGeoFile(mapGeoType)` — maps a GeoType string to a TopoJSON filename
- `assignGeoRank(GeoType)` — returns a numeric rank (0=Citywide, 12=RMZ) used for sorting
- `geoTypes` — ordered array of pretty GeoType names
- `prettifyGeoType(GeoType)` — converts versioned geo types (`NTA2010`, `CDTA2020`) to generic display names (`NTA`, `CDTA`)
- `updateChartPlotSize()` — fires a window resize event after 200ms to trigger chart reflow

### `app.js`
Central orchestration:
- `buildCanonicalSearchParams()` — creates a `URLSearchParams` in stable key order: `id`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay`
- `resetSelectionForNewIndicator(id)` — nulls `MeasureID`/`GeoType`/`TimePeriodID` (preserves `overlay`), does `replaceState` to `?id=N`
- `pushSelectionToURL()` — writes current globals to the URL via `pushState`
- `normalizeLegacyGeoTypeURL()` — renames `GeoTypeID` → `GeoType` in the URL via `replaceState`
- `normalizeLegacyOverlayURL()` — rewrites `overlay=map` → `overlay=bar` via `replaceState`
- `renderCurrentView()` — switch on `overlay`: dispatches to `showMap()`, `showTable()`, `showTrend()`, `showLinks()`, or closes all panes for `'none'`
- `popstate` handler — restores globals from URL params, reloads indicator if changed, re-renders
- `DOMContentLoaded` handler — caches tab element refs, wires tab click → `overlay` set → `pushSelectionToURL()` → `renderCurrentView()`

### `data.js`
Data loading pipeline:
- `loadIndicator(id, dont_add_to_history)` — sets `IndicatorID`, looks up indicator metadata, resets selection flags, manages history entries, calls `loadData()`
- `loadData(id)` — fetches `indicators/data/{id}.json`, creates Arquero table, adds `GeoRank`, loads geo+time lookups in parallel, calls `joinData()`
- `loadGeo()` — fetches `GeoLookup.json` into `geoTable`
- `loadTime()` — fetches `TimePeriods.json` into `timeTable` and builds `timeLookup` object
- `joinData()` — joins indicator data with geo and time tables, creates per-visualization data subsets (`tableData`, `mapData`, `trendData`), creates `aqTableTimesGeos`/`aqMapTimesGeos`/`aqTrendTimesGeos`, calls `renderTable()`

### `measures.js`
Measure defaults and visualization functions:
- `setDefaultMapMeasure()`, `setDefaultTrendMeasure()`, `setDefaultLinksMeasure()`, `setDefaultDisparitiesMeasure()` — pick the best default measure using priority order (Age-adjusted rate > rate > Rate > Percent > percent > Density > first)
- `renderMeasures()` — the big orchestrator:
  1. Clears measure arrays and metadata
  2. Sets table defaults (time, geo)
  3. Populates `mapMeasures`, `trendMeasures`, `linksMeasures`, `disparitiesMeasures`
  4. Calls all `setDefault*Measure()` functions
  5. **Defines** `showTable()`, `showMap()`, `showTrend()`, `showBoroughTrend()`, `showComparisonTrend()`, `showLinks()` as closures that capture the current indicator data
  6. Enables/disables tabs based on data availability
  7. Activates the Bootstrap tab matching `overlay` (unless `overlay=none`)

### `topic-indicator-selector.js`
Entry point and indicator selection:
- Immediately starts fetching `metadata.json` into `indicators` global
- `ensureIndicatorsLoaded()` — resolves the indicators promise
- `printIndicators()` — renders the indicator selection modal
- `selectIndicator(id)` — modal selection handler: dismisses modal, resets state, runs full load pipeline
- `checkURL()` — the **page load entry point**: reads URL params, seeds globals, normalizes legacy params, runs full load pipeline
- `printIndicatorInfo(id)` — renders indicator name, description, how-calculated, data sources to the page

### `menu.js`
Dropdown menus:
- `getDefaultMeasure(indicator)` — priority-based default measure selection
- `printMenus(indicatorID)` — validates/defaults `MeasureID`, calls `updateAllMenus()`
- `updateAllMenus(indicator)` — rebuilds all three dropdowns (Measure, Geo, Time) from current globals with cascading defaults
- `styleAndPrintMenu(items, destination, type)` — renders dropdown items, highlights selected, attaches click handlers
- `handleSelection(type, value)` — dropdown click handler: updates globals with cascading resets, rebuilds menus, pushes URL, re-renders

### `table.js`
`renderTable(tableData)` — renders a DataTables summary table with pivoted measure columns, geo grouping, and column alignment.

### `map.js`
- `initBaseMap()` — creates the Leaflet map instance with CartoDB tiles (runs immediately on script load)
- `renderMap(data, metadata)` — renders a choropleth or bubble map on the Leaflet instance

### `bar.js`
`renderBar(data, metadata, geography, timePeriod)` — renders a Vega-Lite horizontal bar chart. Handles means (dot + gray bar), CI error bars, and standard bars.

### `trend.js`
`renderTrendChart(data, metadata)` — renders trend line charts (currently a stub that logs to console).

### `311.js`
`draw311Buttons(indicatorID)` — fetches the 311 crosswalk CSV, filters to the current indicator, renders contact links.

### `de-tab-content.html` (Hugo partial)
- HTML for all 5 tab panes (bar, table, trends, correlate, data sources) with close buttons
- Inline `<script>` with:
  - **Toggle-off handler**: If an already-active tab is clicked, calls `e.stopImmediatePropagation()`, closes the pane, sets `overlay='none'`, pushes URL
  - **`closeTabPane(paneId)`**: Closes a specific pane, sets `overlay='none'`, pushes URL
  - **`updateHasOpenPanelClass()`**: MutationObserver on `#v-pills-tabContent` style changes + Bootstrap tab events; toggles `has-open-panel` on `.de-tabs`
  - Mobile accordion toggle for details panel

### `de-tab-button.html` (Hugo partial)
Green sidebar with SVG tab icons. Uses Bootstrap pills navigation (`data-toggle="pill"`).

---

## State Management

### Global State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `IndicatorID` | Number | Currently loaded indicator |
| `MeasureID` | Number | Selected measurement type (e.g., "Age-adjusted rate") |
| `GeoType` | String | Selected geography type (e.g., "UHF42", "NTA") |
| `TimePeriodID` | Number | Selected time period |
| `overlay` | String | Active right-pane tab: `'bar'`, `'table'`, `'trend'`, `'links'`, `'none'` |

### URL ↔ Global Sync

```
URL params (source of truth on load/popstate)
    ↕  checkURL() reads → globals
    ↕  pushSelectionToURL() writes globals →  URL
    ↕  popstate reads URL → globals
```

The URL always uses canonical param names in a stable order:
```
?id=2133&MeasureID=239&GeoType=UHF42&TimePeriodID=123&overlay=bar
```

Legacy aliases handled on read:
- `GeoTypeID` → `GeoType` (normalized via `replaceState`)
- `overlay=map` → `overlay=bar` (normalized via `replaceState`)

---

## Detailed Flow: Page Load

When a user navigates to a topic page (e.g., `/data-explorer-new/asthma/?id=2133`):

### Phase 1: Script Loading & Initialization (synchronous)

1. **`global.js`** executes: all globals declared as `let` (initially `undefined`).
2. **`utilities.js`** executes: helper functions defined.
3. **`app.js`** executes:
   - URL helper functions defined (`buildCanonicalSearchParams`, `pushSelectionToURL`, etc.).
   - `renderCurrentView()` defined.
   - `popstate` listener registered.
   - `DOMContentLoaded` listener registered (queued — fires later).
4. **`data.js`** executes: `loadIndicator`, `loadData`, etc. defined.
5. **`measures.js`** executes: `setDefault*Measure`, `renderMeasures` defined.
6. **`table.js`** executes: `renderTable` defined.
7. **`map.js`** executes: `initBaseMap()` **runs immediately** — creates Leaflet map, adds tile layer. This means the map container is initialized before any data loads.
8. **`311.js`** executes: `draw311Buttons` defined.
9. **`topic-indicator-selector.js`** executes:
   - `fetch('metadata.json')` **starts immediately** (async, non-blocking).
   - `ensureIndicatorsLoaded`, `printIndicators`, `selectIndicator`, `checkURL` defined.
10. **`menu.js`** executes: menu functions defined.
11. **`bar.js`** executes: `renderBar` defined.
12. **`trend.js`** executes: `renderTrendChart` defined.

### Phase 2: Inline Script Execution

After all `<script>` tags have loaded, the inline block in `single.html` runs:

```js
printIndicators(these_indicators, destination);  // render indicator list in modal
checkURL();                                       // kick off the main load pipeline
```

### Phase 3: `checkURL()` — The Main Entry Point

```
checkURL()
│
├─ Read URL params (id, MeasureID, GeoType/GeoTypeID, TimePeriodID, overlay)
├─ If GeoTypeID present → normalizeLegacyGeoTypeURL()  [replaceState]
├─ If no id → open indicator selector modal; return
│
├─ Seed globals from URL params
│   MeasureID = paramsObj.MeasureID
│   GeoType = paramsObj.GeoType || paramsObj.GeoTypeID
│   TimePeriodID = paramsObj.TimePeriodID
│   overlay = paramsObj.overlay
│
├─ printIndicatorInfo(id)  ─── renders name, description, how-calculated
├─ draw311Buttons(id)  ─── fetches 311 crosswalk, renders buttons
│
├─ await ensureIndicatorsLoaded()  ─── waits for metadata.json fetch
├─ await loadIndicator(id)
│   ├─ Sets overlay = 'bar' if not already set
│   ├─ IndicatorID = id
│   ├─ Finds indicator in indicators array
│   ├─ Sets indicatorName, indicatorDesc, indicatorMeasures
│   ├─ Resets all selection flags
│   ├─ Manages history (replaceState on first load)
│   └─ await loadData(id)
│       ├─ fetch(`indicators/data/${id}.json`)
│       ├─ Create Arquero table, add GeoRank
│       ├─ await Promise.all([ loadGeo(), loadTime() ])
│       │   ├─ loadGeo() → fetch GeoLookup.json → geoTable
│       │   └─ loadTime() → fetch TimePeriods.json → timeTable, timeLookup
│       ├─ await joinData()
│       │   ├─ Build aqMeasureDisplay
│       │   ├─ Flatten measure × geo × time combos for Table, Map, Trend
│       │   ├─ Join indicator data with geo + time tables
│       │   ├─ Create tableData, mapData, trendData
│       │   └─ renderTable(tableData)  ← table rendered here
│       └─ draw311Buttons(id)
│
├─ await printMenus(id)
│   ├─ ensureIndicatorsLoaded()
│   ├─ Find indicator, validate MeasureID (fallback to getDefaultMeasure)
│   └─ updateAllMenus(indicator)
│       ├─ Build Measures dropdown
│       ├─ Build Geo dropdown (prettified, deduplicated)
│       │   └─ Default to finest available geo if current is invalid
│       ├─ Build Time dropdown (sorted most recent first)
│       │   └─ Default to most recent time if current is invalid
│       └─ Set dropdown labels and selected highlights
│
├─ await renderMeasures()
│   ├─ Clear and repopulate mapMeasures, trendMeasures, linksMeasures, disparitiesMeasures
│   ├─ setDefaultMapMeasure(), setDefaultTrendMeasure(),
│   │   setDefaultDisparitiesMeasure(), await setDefaultLinksMeasure()
│   ├─ Define showTable(), showMap(), showTrend(), showBoroughTrend(),
│   │   showComparisonTrend(), showLinks() as closures
│   ├─ Enable/disable tabs based on data availability
│   └─ Activate Bootstrap tab matching overlay (unless overlay='none')
│       └─ $(tabSelector[overlay]).tab('show')
│
├─ pushSelectionToURL()  ─── writes full state to URL via pushState
│   (fills in defaults the user didn't specify in the original URL)
│
└─ renderCurrentView()
    └─ switch(overlay):
        'bar'   → showMap()  → filters mapData, calls renderMap() + renderBar()
        'table' → showTable() → adjusts DataTables columns
        'trend' → showTrend() → delegates to showBoroughTrend() or showComparisonTrend()
        'links' → showLinks() → renders correlate or disparities chart
        'none'  → closes all panes
        default → showMap()
```

### Phase 4: DOMContentLoaded Fires

After the HTML is fully parsed:

1. **`de-tab-content.html` listeners** (registered first):
   - Toggle-off handler for already-active tabs
   - `closeTabPane()` function available
   - `updateHasOpenPanelClass()` called — sets initial panel state
   - Mobile accordion handlers

2. **`app.js` listener**:
   - Caches `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable` DOM refs
   - Registers tab click handlers (overlay set → pushURL → render)

---

## Detailed Flow: Tab Click

When the user clicks a tab icon (e.g., "Trends") in the green sidebar:

```
User clicks #v-pills-trends-tab
│
├─ [1] de-tab-content.html toggle-off handler fires first
│   ├─ Is this tab already active AND pane showing?
│   │   YES → stopImmediatePropagation(), close pane, overlay='none', pushURL, STOP
│   │   NO  → let event continue
│
├─ [2] de-tab-content.html document click listener
│   ├─ Is #v-pills-tabContent hidden?
│   │   YES → set display='block'
│   └─ Smooth scroll to top
│
├─ [3] app.js tab click handler fires
│   ├─ overlay = 'trend'
│   ├─ pushSelectionToURL()  ─── URL now has overlay=trend
│   ├─ renderCurrentView()
│   │   └─ showTrend()
│   │       ├─ overlay = 'trend'
│   │       ├─ If trendMeasures empty or showingComparisonTrend → showComparisonTrend()
│   │       └─ Else → showBoroughTrend()
│   │           ├─ Resolve measure metadata
│   │           ├─ Filter trend data
│   │           └─ renderTrendChart(data, metadata)
│   └─ gtag('event', 'click_tab', { tab: 'trend' })
│
├─ [4] Bootstrap processes the pill toggle
│   ├─ Deactivates old tab + pane
│   ├─ Activates new tab + pane
│   └─ Fires shown.bs.tab event
│
└─ [5] MutationObserver detects style change
    └─ updateHasOpenPanelClass() → adds 'has-open-panel' to .de-tabs
```

**On the page:** The previous overlay pane slides out, the new one slides in. The map remains visible. The right pane expands to 50% width (or stays expanded). The URL updates to reflect the new overlay.

---

## Detailed Flow: Tab Toggle-Off (Close via Icon)

When the user clicks an already-active tab icon:

```
User clicks #v-pills-bar-tab (already active)
│
├─ [1] de-tab-content.html toggle-off handler fires
│   ├─ this.classList.contains('active') === true
│   ├─ targetPane.classList.contains('show') === true
│   ├─ e.preventDefault()  ─── stops Bootstrap from processing
│   ├─ e.stopImmediatePropagation()  ─── stops app.js handler from firing
│   ├─ Remove 'active' from tab, set aria-selected='false'
│   ├─ Remove 'show', 'active' from pane
│   ├─ Hide #v-pills-tabContent (display='none')
│   ├─ overlay = 'none'
│   └─ pushSelectionToURL()  ─── URL now has overlay=none
│
└─ [2] MutationObserver detects style change
    └─ updateHasOpenPanelClass() → removes 'has-open-panel' from .de-tabs
```

**On the page:** The overlay pane closes. The map expands to full width. The green sidebar icons remain but no tab is highlighted. The URL shows `overlay=none`.

---

## Detailed Flow: Close Button (Arrow)

Each overlay pane has a `>` arrow button in its top-left corner:

```
User clicks close button on bar pane
│
├─ onclick="closeTabPane('v-pills-bar')"
│   ├─ Find pane (#v-pills-bar) and tab ([href="#v-pills-bar"])
│   ├─ Remove 'active' from tab
│   ├─ Remove 'show', 'active' from pane
│   ├─ Hide #v-pills-tabContent (display='none')
│   ├─ overlay = 'none'
│   └─ pushSelectionToURL()  ─── URL now has overlay=none
│
└─ MutationObserver detects style change
    └─ updateHasOpenPanelClass() → removes 'has-open-panel'
```

**On the page:** Same visual result as toggle-off — pane closes, map goes full width.

---

## Detailed Flow: Dropdown Selection

When the user picks a different option from the Measure, Geo, or Time dropdown:

```
User clicks "UHF42" in the Geo dropdown
│
├─ updateDropdownText(this)  ─── closes Bootstrap dropdown, updates button label
│
├─ handleSelection('geo', 'UHF42')  (menu.js)
│   ├─ GeoType = 'UHF42'
│   ├─ TimePeriodID = null  ─── cascading reset (geo change invalidates time)
│   │
│   ├─ updateAllMenus(indicator)
│   │   ├─ Measures dropdown: unchanged (measure didn't change)
│   │   ├─ Geo dropdown: highlights UHF42
│   │   ├─ Time dropdown: rebuilds for UHF42's available times
│   │   │   └─ TimePeriodID = most recent available time
│   │   └─ Updates all dropdown labels
│   │
│   ├─ pushSelectionToURL()  ─── URL: ?id=...&MeasureID=...&GeoType=UHF42&TimePeriodID=...&overlay=bar
│   │
│   ├─ gtag('event', 'click_option', { option: 'geo' })
│   │
│   └─ renderCurrentView()
│       └─ showMap()  (if overlay='bar')
│           ├─ Filter mapData by new MeasureID + GeoType + TimePeriodID
│           └─ renderMap(filteredData, metadata)  ─── map redraws with new geography
```

**Cascading resets:**
- Changing **Measure** → resets Geo and Time
- Changing **Geo** → resets Time
- Changing **Time** → no cascade

---

## Detailed Flow: Indicator Selection

When the user picks a new indicator from the modal:

```
User clicks "Fine particles (PM 2.5)" in indicator modal
│
├─ selectIndicator(2023)
│   ├─ dismissIndicatorModal()  ─── hides Bootstrap modal
│   │
│   ├─ resetSelectionForNewIndicator(2023)
│   │   ├─ MeasureID = null
│   │   ├─ GeoType = null
│   │   ├─ TimePeriodID = null
│   │   ├─ (overlay preserved — stays 'bar' or whatever it was)
│   │   └─ replaceState → URL: ?id=2023
│   │
│   ├─ printIndicatorInfo(2023)  ─── updates name, desc, how-calculated
│   ├─ draw311Buttons(2023)  ─── updates 311 links
│   │
│   ├─ await ensureIndicatorsLoaded()
│   ├─ await loadIndicator(2023)
│   │   └─ (same as page load — fetches data, builds Arquero tables)
│   ├─ await printMenus(2023)
│   │   └─ (builds fresh dropdowns with new indicator's measures/geos/times)
│   ├─ await renderMeasures()
│   │   └─ (redefines show* functions, enables/disables tabs, activates tab)
│   │
│   ├─ pushSelectionToURL()
│   │   └─ URL: ?id=2023&MeasureID=365&GeoType=UHF42&TimePeriodID=...&overlay=bar
│   │
│   └─ renderCurrentView()
│       └─ showMap() → renderMap()
```

**On the page:** Modal closes. Indicator info updates. Dropdowns repopulate. Map redraws with new data. Bar chart (or whichever overlay was active) redraws. URL updates.

---

## Detailed Flow: Browser Back / Forward

When the user clicks the browser back or forward button:

```
popstate event fires
│
├─ Read URL params
│   urlID, urlMeasureID, urlGeoType, urlTimePeriodID, urlOverlay
│
├─ Normalize legacy params
│   ├─ If GeoTypeID present → normalizeLegacyGeoTypeURL()
│   └─ If overlay=map → normalizeLegacyOverlayURL()
│
├─ Restore overlay global
│   overlay = urlOverlay (with 'map' → 'bar' alias)
│
├─ Indicator changed? (urlID !== IndicatorID)
│   │
│   YES ──────────────────────────────────
│   │  await loadIndicator(urlID, true)  ← dont_add_to_history=true
│   │  printIndicatorInfo(urlID)
│   │  printMenus(urlID)
│   │  await renderMeasures()
│   │  renderCurrentView()
│   │  return
│   │
│   NO ───────────────────────────────────
│   ├─ Restore sub-selection globals (MeasureID, GeoType, TimePeriodID)
│   ├─ Find indicator in global array
│   ├─ updateAllMenus(indicator)  ─── sync dropdowns
│   └─ renderCurrentView()  ─── re-render with restored state
```

**On the page:** The view rewinds/advances to the previous/next state. If the indicator changed, everything reloads. If only sub-selections changed, only the menus and active visualization update.

---

## Event Listener Registration Order

Understanding the registration order is critical because multiple listeners handle the same click events on tab icons:

| Priority | Source | Element | Event | Purpose |
|----------|--------|---------|-------|---------|
| 1 | `de-tab-content.html` DOMContentLoaded | `.nav-link[data-toggle="pill"]` | click | Toggle-off detection. Uses `stopImmediatePropagation()` to block later handlers when toggling off |
| 2 | `de-tab-content.html` DOMContentLoaded | `document` | click | Ensure `#v-pills-tabContent` visible; smooth scroll |
| 3 | `app.js` DOMContentLoaded | `#v-pills-bar-tab`, etc. | click | Set overlay, push URL, render |
| 4 | Bootstrap | `.nav-link[data-toggle="pill"]` | click | Pill tab toggle (activate/deactivate) |

When toggling off (clicking active tab), handler #1 fires, calls `stopImmediatePropagation()`, and handlers #3 and #4 never execute. This prevents the URL from being pushed with the wrong overlay value.

---

## Data Pipeline

```
metadata.json (indicator metadata)
     │
     └→ indicators[] (global array of all indicators with their Measures, VisOptions)

indicators/data/{id}.json (indicator data points)
     │
     ├→ aqIndicatorData (Arquero table with GeoRank)
     │
     ├─ GeoLookup.json → geoTable
     ├─ TimePeriods.json → timeTable, timeLookup
     │
     └→ joinData()
         ├→ aqTableTimesGeos  (measure × geo × time combos for Table)
         ├→ aqMapTimesGeos    (measure × geo × time combos for Map)
         ├→ aqTrendTimesGeos  (measure × geo × time combos for Trend)
         │
         ├→ joinedAqData  (indicator data joined with geo names and time labels)
         │
         ├→ tableData  (filtered + pivoted for DataTables) → renderTable()
         ├→ mapData    (filtered for map/bar)
         └→ trendData  (filtered for trends)
```

**Data shape at each stage:**

1. **Raw data** (`{id}.json`): Array of objects with `MeasureID`, `GeoType`, `GeoID`, `TimePeriodID`, `Value`, `DisplayValue`, `CI`, `Note`
2. **aqIndicatorData**: Same + `GeoRank` column
3. **joinedAqData**: + `Geography` (from GeoLookup), `TimePeriod`, `start_period`, `end_period` (from TimePeriods)
4. **tableData**: + `MeasurementDisplay`, `DisplayCI`, pivoted wide (one column per measure)
5. **mapData**: Filtered to map-valid measure × geo × time combos
6. **filteredMapData**: Further filtered by current `MeasureID` + `GeoType` + `TimePeriodID` (inside `showMap()`)

---

## Tab Enable / Disable Logic

At the end of `renderMeasures()`, tabs are enabled or disabled based on data availability:

| Tab | Enabled when |
|-----|-------------|
| Bar (Map) | `mapMeasures.length > 0` |
| Trends | `trendMeasures.length > 0` with >1 time period, OR `comparisonMetadata.length > 0` |
| Correlate | `linksMeasures.length > 0` OR `disparitiesMeasures.length > 0` |
| Table | Always enabled (table is rendered in `joinData()`) |
| Data Sources | Always enabled (static content) |

Disabled tabs get `class="disabled"` and `aria-disabled="true"`.

---

## Suggestions for Improvement

### 1. Eliminate Global Mutable State — Use a State Object

**Problem:** ~80 global `let` variables in `global.js` make it impossible to reason about state changes. Any function can mutate any variable at any time.

**Suggestion:** Consolidate into a single state object with controlled mutation:

```js
const state = {
    indicator: { id: null, name: '', desc: '', measures: [] },
    selection: { measureId: null, geoType: null, timePeriodId: null, overlay: 'bar' },
    data: { map: [], trend: [], table: [], links: [] },
    ui: { tabs: { bar: null, trends: null, correlate: null, table: null } }
};

function updateSelection(patch) {
    Object.assign(state.selection, patch);
    syncURLFromState();
    renderCurrentView();
}
```

This makes data flow explicit and debuggable.

### 2. Extract the Duplicated Default-Measure Logic

**Problem:** `setDefaultMapMeasure()`, `setDefaultTrendMeasure()`, `setDefaultLinksMeasure()`, and `setDefaultDisparitiesMeasure()` contain nearly identical priority-based filtering logic (Age-adjusted rate → rate → Rate → Percent → percent → Density → first). This is repeated 4 times (~250 lines of duplication).

**Suggestion:** Extract a single `pickDefaultMeasure(visArray)` function:

```js
const pickDefaultMeasure = (visArray) => {
    if (!visArray.length) return null;
    const priority = ['Age-adjusted rate', 'rate', 'Rate', 'Percent', 'percent', 'Density'];
    for (const keyword of priority) {
        const match = visArray.find(m => m.MeasurementType.includes(keyword));
        if (match) {
            if (keyword === 'Age-adjusted rate') {
                const total = visArray.find(m => m.MeasurementType.includes('Age-adjusted rate') && m.MeasurementType.includes('Total'));
                return total || match;
            }
            return match;
        }
    }
    return visArray[0];
};
```

Note: `menu.js` already has `getDefaultMeasure()` which does the same thing — these should be unified.

### 3. Move show\*() Functions Out of renderMeasures()

**Problem:** `showMap()`, `showTable()`, `showTrend()`, `showLinks()` are defined as closures inside `renderMeasures()`, then assigned to global variables. This means they're re-created every time an indicator loads, and their closure over local variables makes debugging difficult.

**Suggestion:** Make them top-level functions that read from the state object (see #1). If they need data, pass it explicitly or read from state.

### 4. Use ES Modules

**Problem:** All files share the global scope. The loading order is critical and fragile (adding a new script in the wrong position breaks everything). Variable name collisions are possible.

**Suggestion:** Convert to ES modules with `import`/`export`. Use a bundler (Vite, esbuild, or Hugo's built-in ESBuild support via `js.Build`):

```js
// state.js
export const state = { ... };

// data.js
import { state } from './state.js';
export async function loadIndicator(id) { ... }

// app.js
import { state } from './state.js';
import { loadIndicator } from './data.js';
```

Hugo natively supports `js.Build` with ESBuild, so this requires minimal tooling changes.

### 5. Decouple URL Sync from Render

**Problem:** `pushSelectionToURL()` and `renderCurrentView()` are always called together but are separate functions. Sometimes `renderCurrentView()` is called without pushing URL (popstate), and sometimes URL is pushed without rendering (resetSelectionForNewIndicator). This inconsistency can lead to URL/view desync bugs.

**Suggestion:** Create a single `dispatch(action)` function that determines whether to push URL and/or render based on the action type:

```js
function dispatch(action, { pushHistory = true } = {}) {
    applyAction(action);           // update state
    if (pushHistory) syncURL();    // push to history
    render();                      // re-render active view
}
```

### 6. Replace MutationObserver with Explicit Panel State

**Problem:** `updateHasOpenPanelClass()` uses a MutationObserver watching `style` attribute changes on `#v-pills-tabContent`, plus Bootstrap events, plus click listeners with `setTimeout`. This is complex and fragile.

**Suggestion:** Since the app already tracks `overlay` globally, just call a simple function after every overlay change:

```js
function updatePanelClass() {
    document.querySelector('.de-tabs')
        .classList.toggle('has-open-panel', overlay !== 'none');
}
```

Call this at the end of `renderCurrentView()` and `closeTabPane()`.

### 7. Lazy-Load Data Per Tab

**Problem:** `joinData()` eagerly creates `tableData`, `mapData`, and `trendData` for all measures and all visualizations, even if the user only views the bar chart. For large indicators, this wastes time and memory.

**Suggestion:** Compute only the data needed for the active tab. Defer other tab data until the user switches:

```js
showMap() {
    if (!mapData) mapData = computeMapData(joinedAqData);
    // ... render
}
```

### 8. Avoid Re-fetching Geo and Time Data

**Problem:** `loadGeo()` and `loadTime()` are called inside `loadData()` every time an indicator loads, even though `GeoLookup.json` and `TimePeriods.json` are the same for all indicators.

**Suggestion:** Fetch them once on page load and cache:

```js
const geoPromise = aq.loadJSON(geoUrl);
const timePromise = aq.loadJSON(timeUrl);

// In loadData:
const [geo, time] = await Promise.all([geoPromise, timePromise]);
```

### 9. Type-Safe URL Parsing

**Problem:** `parseFloat()` is used to convert URL params to numbers, but `parseFloat('abc')` returns `NaN` which then propagates. The `==` loose comparisons (`indicator.IndicatorID == IndicatorID`) work around this but hide type issues.

**Suggestion:** Use `Number()` instead of `parseFloat()` and add explicit NaN checks:

```js
const id = Number(params.get('id'));
if (!id || Number.isNaN(id)) { /* handle bad param */ }
```

### 10. Remove Commented-Out Code

**Problem:** Many files contain large blocks of commented-out code (old Vega specs, old rendering approaches, old event handlers). This makes files longer and harder to navigate.

**Suggestion:** Delete commented-out code. It's preserved in git history if ever needed again.

---

*Last updated: April 2026*
