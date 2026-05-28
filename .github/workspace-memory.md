# Workspace Memory Snapshot

This file mirrors repo-scoped workspace memory notes for easier in-repo review.
Source memories:
- /memories/repo/data-explorer-analysis.md
- /memories/repo/geotype-normalization.md
- /memories/repo/shared-shell-modals.md
- /memories/repo/leaflet-map-export.md

Last mirrored: 2026-05-28

---

## data-explorer-analysis.md

# Data Explorer JavaScript Codebase Analysis

## Overview
Two parallel implementations of the data explorer:
- **data-explorer/** (legacy/older): Original implementation, less structured
- **data-explorer-new/** (active): Current SPA implementation with better separation of concerns

## Working Preference
- In `assets/js/data-explorer-new`, prefer generous vertical whitespace inside functions, especially around guard clauses, setup blocks, and major conditionals.
- Use `measures.js` as the spacing reference when adjusting readability in the newer explorer scripts.

## Local Validation
- `hugo --environment local_stage --cleanDestinationDir --logLevel debug` rebuilds the static output in `docs`.
- The localhost static-server flow can keep serving cached HTML that references old fingerprinted JS bundles; use a fresh page or a cache-busting query param when validating rebuilt explorer assets.

## Links / Disparities State
- In `assets/js/data-explorer-new/measures.js`, a manual disparities selection must override synced correlate defaults whenever the selected primary measure is disparities-capable, or `#show-disparities` can reopen the correlate chart.


## Architecture Summary

### State Management
- **Global variables pattern**: 50+ globals in `global.js` (IndicatorID, MeasureID, GeoType, TimePeriodID, overlay, etc.)
- **No encapsulation**: Any file can mutate any global directly
- **Closure-based function definitions**: `showMap()`, `showBar()`, `showTable()`, etc. are closures defined inside `renderMeasures()` that capture the current state

### Load Order (Critical)
Scripts loaded synchronously in specific order from Hugo template:
1. global.js - declares all globals
2. utilities.js - pure helpers
3. app.js - URL/state sync, renderCurrentView dispatcher
4. data.js - data loading and Arquero table construction
5. measures.js - default measure selection, show* closures
6. table.js, map.js, bar.js, trend.js, correlate.js - renderers
7. topic-indicator-selector.js - indicator selection
8. menu.js - dropdown menu handling

Load order matters because globals must be declared first, and functions depend on earlier functions.

### Data Flow
```
metadata.json → indicators array (global)
indicator JSON → Arquero table with GeoRank
→ loadGeo() + loadTime() parallel
→ joinData() → aqTableTimesGeos, aqMapTimesGeos, aqTrendTimesGeos
→ renderMeasures() → define show* closures
→ show* functions filter and render
```

### Rendering Pattern
- Central dispatcher: `renderCurrentView(updateMap)`
- Each tab (Map, Bar, Table, Trend, Links) has a `show*` function
- Only Map always renders; overlay tabs render conditionally
- `updateMap` flag controls whether Leaflet map re-renders

## Known Issues & Code Smells

### 1. **Stale Closures After Indicator Change**
- Every time `renderMeasures()` runs, it redefines `showMap()`, `showBar()`, `showTable()`, etc.
- Old closures are replaced but if any lingering references exist, they operate on stale data
- Currently safe because all calls go through global references, but fragile design

### 2. **Implicit Dependency: filteredMapData**
- `showBar()` uses `filteredMapData` set by `showMap()`
- If `showBar()` runs without `showMap()` first, chart is empty or stale
- Works because `renderCurrentView()` always calls `showMap()` when `updateMap=true`
- But creates hidden coupling between functions

### 3. **Multiple Global Variable Mutations**
- Same global can be mutated by multiple files: `MeasureID` updated by handleSelection, updateAllMenus, loadIndicator, popstate
- No single place to see where mutations originate
- Hard to trace bugs involving state inconsistency

### 4. **Race Conditions on Indicator Change**
- `loadIndicator()` is async, but no cancellation if user switches indicators rapidly
- Multiple overlapping fetches could complete in wrong order
- Last one to complete wins, but intermediate state changes could cause issues

### 5. **DataTables Not Explicitly Destroyed**
- `renderTable()` calls `DataTable()` on every render
- Old instance not explicitly destroyed first
- HTML is replaced (`innerHTML=`), preventing double-init, but unclean

### 6. **Duplicate DOM IDs**
- Mobile and desktop dropdowns share IDs like `measureOptionsDropdownButton`
- HTML validation error, though works because menu.js uses `querySelectorAll` with classes

### 7. **Repeated Default-Measure Logic**
- Same priority chain (Age-adjusted rate → rate → Rate → Percent → Density) repeated 4 times:
  - `setDefaultMapMeasure()`
  - `setDefaultTrendMeasure()`
  - `setDefaultLinksMeasure()`
  - `setDefaultDisparitiesMeasure()`

### 8. **Stub Renderers**
- `renderTrendChart()`, `renderCorrelate()`, `renderDisparitiesChart()` are empty stubs
- Data is fully prepared but no visualization
- Features appear enabled but non-functional

### 9. **Inline Template Behavior**
- `de-tab-content.html` contains click handlers, close logic, panel observers inline
- Mixes template markup with behavior
- Harder to test interaction model

### 10. **Per-Item Click Listeners in Menus**
- Every menu rebuild in `styleAndPrintMenu()` creates new button and binds 2 listeners per item
- Could use event delegation instead
- Performance impact on frequent menu updates

### 11. **Type Inconsistency in URL Parsing**
- TimePeriodID arrives as string from URL but compared with `==` sometimes, `===` other times
- parseFloat/Number used inconsistently
- Potential type-coercion bugs

### 12. **window.mapInterop Lifecycle**
- Set inside `renderMap()` after TopoJSON fetch completes
- If bar chart renders before map fetch completes, bar→map interop fails silently
- No error handling, just missing highlight

## Code Structure Summary

### Well-Organized Files
- **utilities.js** - Pure helpers, no side effects
- **data.js** - Clear data pipeline
- **app.js** - URL/history management centralized
- **menu.js** - Dropdown logic consolidated
- **map.js**, **bar.js**, **table.js** - Renderer logic clear and separate

### Problematic Files
- **measures.js** - Too many responsibilities (default selection, closure definition, tab enabling/disabling)
- **global.js** - 50+ globals with no organization
- **topic-indicator-selector.js** - Heavy async orchestration

## Coupling Analysis

### High Coupling
- All files depend on globals in global.js
- renderMeasures → all show* functions
- app.js renderCurrentView depends on all show* functions
- data.js ↔ measures.js ↔ menu.js (circular through globals)

### Loose Coupling (Good)
- map.js ↔ bar.js (only through window.mapInterop, window.myVegaView)
- utilities.js is dependency-free
- 311.js is mostly isolated

## Rendering Issues

### URL State Sync
- Works well overall
- pushState/replaceState used appropriately
- Legacy aliases handled (GeoTypeID → GeoType, overlay=map → overlay=bar)
- Some redundant history entries possible (e.g., dropdowns push state even if values unchanged)

### Map/Chart Interop
- Hover from map → bar: works by setting Vega signal
- Hover from bar → map: looks up geoIDtoLayer and highlights
- Mouseout clears both
- Clean implementation in window.mapInterop

## Performance Concerns

1. **Fetch caching**: metadata.json, GeoLookup.json, TimePeriods.json, TopoJSON fetched fresh each time
2. **Menu rebuilds**: Full menu HTML regenerated on every selection change
3. **Arquero operations**: Complex chain of joins and transforms for each indicator load
4. **No request cancellation**: Rapid indicator clicks cause overlapping fetches

## Legacy Files (data-explorer/ and old prototypes)
- _bar.js: Prototype, references undefined global geoIDtoLayer
- basemap.js: Standalone Leaflet init, duplicated by map.js
- choro.js: Standalone choropleth, duplicated by map.js
- choroData.js, geography.js: Hardcoded sample data, not used

## Recommended Improvements (Already Documented in improvements files)
1. Replace write-anywhere globals with single state object
2. Centralize state changes in one dispatcher
3. Normalize URL parsing/serialization in one module
4. Avoid duplicate history entries for no-op changes
5. Guard against stale async responses (request tokens)
6. Cache fetch results
7. Stop redefining show* functions each render
8. Extract shared default-measure logic
9. Move inline template behavior to JS files
10. Use event delegation for menu items instead of per-item listeners

---

## geotype-normalization.md

# Data Explorer Bugs and Fixes

## Geotype Normalization (bar.js)

- In data-explorer-new, UI state stores prettified geotypes like `NTA`, `CDTA`, and `PUMA`, while data rows can still carry raw versioned values like `NTA2020`, `CDTA2020`, and `PUMA2020`.

---

## shared-shell-modals.md

# Shared Shell Modal Placement

- Render the shared search modal once from `baseof.html` so footerless `headerDE` pages still have `#searchModal`.
- Do not embed a second `#searchModal` in `footer.html`; footered pages then initialize Pagefind twice and show duplicate search inputs.
- After shell template changes, validate both `/dev-stage/` and a footerless `/dev-stage/data-explorer-new/.../` page.
- `showMap()` already filters with `prettifyGeoType(obj.GeoType) == GeoType` in `measures.js`.
- Renderer-specific filtering must not compare raw `datum.GeoType` directly to the UI `GeoType` value, or versioned geotypes will disappear.
- `bar.js` was fixed by normalizing geotypes before building the Vega spec and by accepting either raw or prettified geography values.

## Topic Switcher URL Update (topic-indicator-selector.js)

- When switching topics via the topic selector modal, the URL pathname was not being updated to the new topic page.
- `selectIndicator` was always using the SPA flow, which keeps the current pathname and only updates the query string.
- Fixed by detecting when the destination topic URL (pathname) differs from the current page and using full navigation in that case instead of SPA flow.

## Dataset Loading Hang (data.js, measures.js)

- Loading a new dataset was slow because `renderTable(tableData)` was being called inside `joinData()` during the initial load, before the user clicked the Table tab.
- DataTables initialization is expensive and blocks the browser UI.
- Fixed by removing the premature `renderTable()` call from `joinData()` and deferring it until `showTable()` is invoked (when user clicks the Table tab).
- Added lazy initialization guard in `showTable()` to check if the table container is empty before rendering, so renderTable is only called once on first access.


## Table Filters and Lazy Render Interaction (table.js, measures.js, de-tab-content.html)

- Table-specific globals (`selectedTableTimes`, `selectedTableGeography`) should drive row filtering in `renderTable()`.
- Template placeholder text (`DE table goes here`) is a child node, so lazy render guards should check for a rendered `<table>` element, not `hasChildNodes()`.
- Added table-tab dropdown controls for time period and geography and defaulted selections to all options on indicator load.
- For the new explorer table tab, filters now default to the current `TimePeriodID` label and current prettified `GeoType`, not all options.
- The table filter UI uses a collapsed checkbox panel modeled on the old explorer, and geography checkboxes are muted/disabled when the currently selected time period(s) have no rows for that geography.
- `renderTable()` now destroys any existing DataTable instance before re-rendering so repeated checkbox changes do not stack table instances.
- Map `GeoType`/`TimePeriodID` dropdown changes now sync table filters automatically only while the corresponding table filter is still in synced mode.
- Manual table checkbox changes set per-filter override flags, so later map dropdown changes no longer overwrite that dimension until the user clicks the `Sync to map` action.
- Table checkbox changes in the new explorer now use DataTables native `column().search(...).draw()` against hidden `TimePeriod` and `GeoTypePretty` columns instead of rebuilding the table DOM on every filter change.
- Full table HTML is still rebuilt per indicator load, but time/geo filter changes and map-sync updates reuse the existing DataTable instance.
- The summary table injects synthetic `tr.group` rows in DataTables `drawCallback`; those rows must be removed at the start of each draw or repeated search/sort redraws can accumulate group headers and distort table width/layout.
- The custom Area-only search binding should avoid overlapping `input`/`keyup` redraws; one deduplicated search-driven draw per user interaction is sufficient.
- The shared DataTables search box is wired to global search by default, so reusing it for a column-only Area search needs explicit state sync; otherwise the input can look empty while `column(8).search(...)` is still active internally.
- On geo/time dropdown changes, clear the Area-only search before the next table redraw so a stale neighborhood filter does not survive into a different geography context.
- The table width drift was caused by DataTables writing only `max-height` on `.dataTables_scrollBody`; as row counts changed, the scroll body collapsed and the scroll wrapper accumulated roughly one scrollbar-width on each redraw.
- Fix by locking `.dataTables_scrollBody` to a real fixed height (`height`, `min-height`, and `max-height` all `500px`, with `overflow-y: scroll`) immediately after DataTable initialization. This kept width stable in live browser tests for repeated Area searches and Citywide/Borough geography changes.
- `checkURL()` is invoked directly from the new-explorer template before `app.js`'s `DOMContentLoaded` listener assigns `tabBar`, `tabTrends`, and `tabCorrelate`.
- `renderMeasures()` must resolve those tab references lazily and `disableTab` / `enableTab` must tolerate missing elements, or direct `overlay=table` startup can crash before the page finishes initializing.
- On `overlay=table` loads or map-driven dropdown updates, `renderCurrentView(true)` should not run `showTable()` in the same turn as `showMap()`, because synchronous DataTables initialization can block the browser before Leaflet gets a paint.
- Deferring `showTable()` by two animation frames from `app.js` let the map path exist immediately while the table did not initialize until a later frame, which avoided table work competing with the map's first render.
- Returning the `renderMap()` fetch/layer promise from `showMap()` and waiting on it before scheduling `showTable()` prevents DataTables work from starting while the map's TopoJSON fetch and Leaflet layer creation are still pending.
- Live check on the `lead` NTA page showed the map layer returned before the table initialized when `overlay=table` was active, and the map layer returned on the same or earlier frame than the `overlay=none` case.
- Waiting for the `renderMap()` promise alone was not sufficient because `requestAnimationFrame(() => showTable())` still runs before the browser paints that next frame. The table initializer can therefore delay the map's first visible paint even though the Leaflet layer already exists in the DOM.
- On a live `lead` NTA page, `showTable()` took about 94 ms, which is enough to cause a noticeable stall if it runs on the map's first post-render frame.
- Using a double-RAF after the map promise gives the map one visible frame before summary-table initialization begins.
- Initial table open still spent most of its time in DataTables, not in the Arquero pivot/HTML build. A live check on the `lead` NTA page measured about 9 ms for pivot + HTML, versus about 90 ms total for `showTable()` before follow-up optimizations.
- Seeding the current time/geography searches into DataTables `searchCols` avoids an immediate second draw on first render while keeping later filter changes on the fast DataTables API path.
- Skipping the first-render `columns.adjust()` call cut a live first-open measurement from about 90 ms to about 64 ms, while a later DataTables filter change still completed in about 5.6 ms.
- The new explorer summary table was carrying unused DataTables Buttons and Select extension setup. Removing those configs reduced a live first-open measurement on the `lead` NTA page from about 63.6 ms to about 48.9 ms, with the table still opening already filtered.
- The new explorer page runtime exposed that `$.fn.DataTable.isDataTable` was not available in this environment; the working helper is `$.fn.dataTable.isDataTable`, so table instance checks should use the lowercase namespace.
- After the Buttons and Select removals, a live `applyTableFilters(tableData)` check still completed in about 15.4 ms for a geo/time filter change, so the fast DataTables API path remained intact.
- Live investigation on the `lead` NTA page showed `fixedHeader` added meaningful startup cost while producing no floating header DOM in this overlay table. Baseline first-open time was about 75.5 ms with `fixedHeader`; removing it in the runtime probe dropped the same path to about 52.2 ms, so the source config should omit it.
- The summary-table grouping `drawCallback` was not the main bottleneck on the same page. Instrumented callback time was about 0.9 ms on initial draw and about 0.5 ms on a geo filter redraw, with about a 6 ms difference between full init with and without the callback.
- After removing `fixedHeader` from source, the live first-open table path measured about 50.2 ms, and a later API-driven geo filter change measured about 9.2 ms with the grouped rows still present.
- The persistent table-panel width ratchet was a layout bug in the `de-tabs` flex shell, not a DataTables redraw bug by itself. The panel wrapper was an unconstrained flex item, so the DataTables scroll container's min-content width was allowed to resize the whole overlay when geography changes changed the table's intrinsic width.
- Fix by wrapping the panel content in a dedicated `.de-tabs-panel-shell` and, on desktop, setting that flex item to `flex: 1 1 0` with `min-width: 0`. That keeps the overlay width fixed and lets DataTables scroll horizontally inside it. After this fix, the table-overlay measure/time workaround branches in `menu.js` were no longer needed and were removed.













- On indicator changes, clear `#summary-table` so first table-tab open rebuilds with new data and fresh filter options.

---

## leaflet-map-export.md

# Leaflet Map Export

- New explorer map export is owned by `assets/js/data-explorer-new/print.js` and builds a separate off-screen Leaflet map instead of screen-capturing the live map.
- Export paths should use an export-only canvas renderer with `L.canvas({ padding: 0 })`; Leaflet's default padded path canvas produced a negative-origin overlay canvas and contributed to browser-zoom-sensitive export drift.
- `buildTemporaryLeafletExport()` should keep `preferCanvas: true` so bubble and choropleth overlays render to canvas before PNG compositing.
- Number-measure export can fail if vector layers are added before the export map view is set; fit or set the view first, then add pending layers.
