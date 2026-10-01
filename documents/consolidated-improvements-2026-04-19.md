# Consolidated Improvements — 2026-04-19

This document consolidates the independent review outputs for `assets/js/data-explorer-new/` and the Hugo partials and templates that render its UI.

Overlapping suggestions have been merged. Where models disagreed, this version favors the simplest incremental change that fits the current architecture: Hugo-rendered HTML, globally loaded browser scripts, plain JavaScript, and existing libraries already on the page.

## 1. Architecture and Data Flow

These changes matter most because the explorer's current behavior depends on scattered mutable globals, render-order assumptions, and asynchronous paths that are hard to reason about. Tightening the data flow first reduces the cost and risk of every later cleanup.

### 1. Consolidate mutable explorer state into one object

**Problem**

Selection state, derived datasets, UI flags, and metadata are spread across many top-scope variables. That makes partial updates easy, increases hidden coupling, and makes it hard to reason about which values are authoritative.

**Suggestion**

Create one global state object with clear namespaces such as `selection`, `datasets`, `ui`, and `metadata`. Migrate the URL-backed fields first, then move derived slices and UI flags incrementally.

**Example**

```js
window.explorerState = window.explorerState || {
    selection: {
        indicatorId: null,
        measureId: null,
        geoType: null,
        timePeriodId: null,
        overlay: 'none'
    },
    datasets: {
        mapRows: [],
        tableRows: [],
        trendRows: []
    },
    ui: {
        activeTab: null,
        isLoading: false
    },
    metadata: {
        aboutMeasures: '',
        dataSources: ''
    }
};
```

### 2. Funnel state changes through a small action layer

**Problem**

Indicator, measure, geography, time period, and overlay state are mutated from multiple entry points. Each path resets different fields and applies type coercion differently, so behavior drifts over time.

**Suggestion**

Route state updates through a single action function or dispatcher. Keep it small and explicit. The main goal is consistency, not a full framework-style store.

**Example**

```js
const applyAction = (type, payload) => {
    const selection = window.explorerState.selection;

    if (type === 'select-indicator') {
        Object.assign(selection, {
            indicatorId: Number(payload.id),
            measureId: null,
            geoType: null,
            timePeriodId: null,
            overlay: 'none'
        });
    }

    if (type === 'select-measure') selection.measureId = Number(payload.id);
    if (type === 'select-geo') selection.geoType = payload.geoType;
    if (type === 'select-time') selection.timePeriodId = Number(payload.id);
    if (type === 'select-overlay') selection.overlay = payload.overlay;
};
```

### 3. Stop redefining renderer functions during measure setup

**Problem**

`showMap`, `showBar`, `showTable`, and related functions are effectively redefined around the current indicator and measure context. That makes render behavior depend on which setup path ran most recently and creates fragile closure coupling.

**Suggestion**

Define renderers once, then let them read current state through selectors. That makes render order predictable and removes stale-closure risk.

**Example**

```js
const renderers = {
    map() {
        const view = getCurrentMapView();
        renderMap(view.rows, view.metadata);
    },
    bar() {
        const view = getCurrentMapView();
        renderBar(view.rows, view.metadata, view.geoType);
    },
    table() {
        renderTable(window.explorerState.datasets.tableRows);
    }
};
```

### 4. Replace shared mutable intermediary slices with selectors

**Problem**

Some views depend on filtered data prepared by another view first. That creates hidden ordering requirements and makes one renderer's side effects a dependency of another renderer.

**Suggestion**

Build small selector helpers that derive the current slice directly from state. Shared selectors are easier to test and make view rendering independent.

**Example**

```js
const getCurrentMapView = () => {
    const { selection, datasets } = window.explorerState;

    const rows = datasets.mapRows.filter(row =>
        row.MeasureID === selection.measureId &&
        row.TimePeriodID === selection.timePeriodId &&
        prettifyGeoType(row.GeoType) === selection.geoType
    );

    return {
        rows,
        metadata: datasets.mapMeasures.find(m => m.MeasureID === selection.measureId) || null,
        geoType: selection.geoType
    };
};
```

### 5. Separate data loading, dataset building, and DOM rendering

**Problem**

Several paths fetch data, shape it, update metadata, and render DOM in one routine. That increases side effects, complicates retry behavior, and makes it harder to reuse data preparation logic.

**Suggestion**

Split the flow into three explicit steps: fetch and join data, build derived datasets, then render the current view.

**Example**

```js
const buildIndicatorDatasets = (joinedRows) => ({
    tableRows: buildTableRows(joinedRows),
    mapRows: buildMapRows(joinedRows),
    trendRows: buildTrendRows(joinedRows)
});

const loadIndicatorData = async (indicatorId) => {
    const joinedRows = await fetchAndJoinIndicator(indicatorId);
    window.explorerState.datasets = buildIndicatorDatasets(joinedRows);
    renderCurrentView(true);
};
```

### 6. Guard async indicator loads against stale responses

**Problem**

Rapid indicator changes can start overlapping fetches. If an older request resolves last, the UI can be hydrated with stale data and inconsistent metadata.

**Suggestion**

Use a request token or `AbortController` for async load paths. Ignore or cancel stale requests.

**Example**

```js
let activeIndicatorRequest = 0;

const loadIndicator = async (indicatorId) => {
    const requestId = ++activeIndicatorRequest;

    const response = await fetch(`${data_repo}${data_branch}/indicators/data/${indicatorId}.json`);
    const rows = await response.json();

    if (requestId !== activeIndicatorRequest) return;

    hydrateIndicator(rows);
};
```

### 7. Centralize URL parsing and serialization

**Problem**

URL parsing, legacy parameter normalization, and history updates are spread across multiple paths. That creates duplicated logic, inconsistent coercion, and avoidable back-button noise.

**Suggestion**

Add one parse helper and one serialize helper. Normalize types and legacy keys once at the boundary, and skip history writes when the query string would not change.

**Example**

```js
const parseSelectionFromUrl = (search) => {
    const params = new URLSearchParams(search);

    return {
        indicatorId: Number(params.get('id')) || null,
        measureId: Number(params.get('MeasureID')) || null,
        geoType: params.get('GeoType') || params.get('GeoTypeID') || null,
        timePeriodId: Number(params.get('TimePeriodID')) || null,
        overlay: params.get('overlay') || 'none'
    };
};

const serializeSelection = (selection) => {
    const params = new URLSearchParams();
    params.set('id', selection.indicatorId);
    if (selection.measureId) params.set('MeasureID', selection.measureId);
    if (selection.geoType) params.set('GeoType', selection.geoType);
    if (selection.timePeriodId) params.set('TimePeriodID', selection.timePeriodId);
    if (selection.overlay && selection.overlay !== 'none') params.set('overlay', selection.overlay);
    return params.toString();
};
```

### 8. Put unfinished views behind explicit feature gates

**Problem**

Stubbed or partially wired views create dead branches in the code and expose UI that can fail silently or appear broken.

**Suggestion**

Gate incomplete views behind explicit availability checks. Disable the tab or render a clear placeholder until the feature is actually ready.

**Example**

```js
const renderUnavailable = (holderId, message) => {
    const holder = document.getElementById(holderId);
    holder.innerHTML = `<p class="fs-sm mb-0">${message}</p>`;
};

if (!supportsTrendForCurrentIndicator) {
    disableTab(tabTrends);
    renderUnavailable('trendHolder', 'Trend view is not available for this indicator.');
}
```

## 2. Coupling and Structure

These suggestions reduce the number of places that need to change together. The current code works largely because script order, duplicated markup, and implicit contracts happen to line up; making those contracts explicit will improve maintainability without changing the browser-side model.

### 9. Centralize geography and measure configuration helpers

**Problem**

Geography file lookup, geo alias normalization, geo ranking, and default-measure priority all appear in multiple places. Repeated rules make drift likely.

**Suggestion**

Move those rules into shared configuration objects and helper functions in one utility layer.

**Example**

```js
const GEO_FILES = {
    UHF42: 'UHF42.topo.json',
    UHF34: 'UHF34.topo.json',
    Borough: 'borough.topo.json'
};

const MEASURE_PRIORITY = [
    'Age-adjusted rate',
    'rate',
    'Rate',
    'Percent',
    'percent',
    'Density'
];

const pickPreferredMeasure = (measures) => {
    for (const keyword of MEASURE_PRIORITY) {
        const match = measures.find(m => m.MeasurementType.includes(keyword));
        if (match) return match;
    }
    return measures[0] || null;
};
```

### 10. Replace inline template behavior with delegated JavaScript

**Problem**

Inline `onclick` handlers and template-embedded behavior couple Hugo markup to JS implementation details and make refactors brittle.

**Suggestion**

Render `data-*` attributes in templates and handle interaction through delegated listeners in the browser scripts.

**Example**

```html
<button type="button" class="close-tab-pane" data-close-pane="v-pills-bar" aria-label="Close">
    <img src="/images/arrow-right.svg" alt="">
</button>
```

```js
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-close-pane]');
    if (!button) return;
    closePane(button.dataset.closePane);
});
```

### 11. Replace duplicate IDs and duplicated menu structures with shared roles

**Problem**

Mobile and desktop controls duplicate menu markup and sometimes reuse IDs across both versions. That produces invalid HTML and doubles DOM update work.

**Suggestion**

Use one shared structural pattern with `data-menu` roles and classes instead of ID-based coupling. If both desktop and mobile variants must remain, keep them role-based and render/update them through the same menu code.

**Example**

```html
<div class="dropdown" data-menu-root="measure">
    <button class="btn js-menu-trigger" type="button" data-menu-trigger="measure">
        <span class="measure-name"></span>
    </button>
    <div class="dropdown-menu measures-holder" data-menu="measure"></div>
</div>
```

### 12. Make the explorer boot sequence explicit

**Problem**

Startup logic is spread across top-level script execution, multiple event handlers, and template-side behavior. The app depends on load order more than it should.

**Suggestion**

Add one `bootDataExplorer()` entry point that caches DOM references, loads static prerequisites, restores URL state, and then renders.

**Example**

```js
const bootDataExplorer = async () => {
    cacheDom();
    await ensureIndicatorsLoaded();
    await checkURL();
};

document.addEventListener('DOMContentLoaded', bootDataExplorer);
```

### 13. Stabilize the map and chart interop lifecycle

**Problem**

Cross-highlighting between the chart and map depends on objects that are only ready after the map is fully built. Interop can silently fail while async map work is still in flight.

**Suggestion**

Create a stable interop object up front, then attach the real behavior once map layers exist.

**Example**

```js
window.mapInterop = window.mapInterop || {
    ready: false,
    geoIDtoLayer: {},
    highlightGeo() {},
    clear() {}
};

const attachMapInterop = (geoIDtoLayer, highlightFeature, clearHoverUI) => {
    window.mapInterop.ready = true;
    window.mapInterop.geoIDtoLayer = geoIDtoLayer;
    window.mapInterop.highlightGeo = (geoId) => {
        const layer = geoIDtoLayer[geoId];
        if (layer) highlightFeature({ target: layer });
    };
    window.mapInterop.clear = clearHoverUI;
};
```

### 14. Remove dead prototype files and other misleading leftovers

**Problem**

Unused prototype files and commented-out alternatives increase ambiguity about which implementation is real and can accidentally re-enter the build later.

**Suggestion**

Delete dead prototype files that are no longer referenced and move any historical reference material into documentation instead of leaving it in active asset paths.

**Example**

```text
Delete legacy files such as _bar.js when they are no longer referenced by the Hugo templates.
```

## 3. Performance

These improvements target repeated network work, unnecessary DOM churn, and rendering paths that do more work than the UI requires. They are especially valuable once the state and rendering flow are predictable.

### 15. Cache static reference data and reusable fetch results

**Problem**

Static resources such as `GeoLookup.json`, `TimePeriods.json`, TopoJSON files, and the 311 crosswalk are fetched or rebuilt repeatedly across indicator and menu changes.

**Suggestion**

Add small in-memory caches for stable resources and keyed fetch results.

**Example**

```js
const resourceCache = new Map();

const loadOnce = (key, loader) => {
    if (!resourceCache.has(key)) {
        resourceCache.set(key, loader());
    }
    return resourceCache.get(key);
};

const loadTopo = (file) => loadOnce(`topo:${file}`, () =>
    fetch(`${data_repo}${data_branch}/geography/${file}`).then(r => r.json())
);
```

### 16. Reduce DataTables churn during table updates

**Problem**

The table is rebuilt through full HTML replacement and re-initialization. That increases reflow cost and leaves cleanup to incidental DOM replacement.

**Suggestion**

At minimum, destroy any existing DataTable before rebuilding. If the current table shape allows it, move toward using the DataTables API to clear, add rows, and redraw instead of replacing the whole table.

**Example**

```js
const renderTable = (rows) => {
    if ($.fn.DataTable.isDataTable('#tableID')) {
        $('#tableID').DataTable().destroy();
    }

    document.getElementById('summary-table').innerHTML = buildTableHtml(rows);
    $('#tableID').DataTable(tableOptions);
};
```

### 17. Stop resetting every map layer on hover

**Problem**

Resetting all map layers on every hover event is one of the most expensive interaction paths in the explorer, especially on dense geographies.

**Suggestion**

Track the previously highlighted layer and reset only that layer.

**Example**

```js
let previouslyHighlighted = null;

layer.on('mouseover', (e) => {
    if (previouslyHighlighted && previouslyHighlighted !== e.target) {
        geojsonLayer.resetStyle(previouslyHighlighted);
    }

    highlightFeature(e);
    previouslyHighlighted = e.target;
});
```

### 18. Replace repeated `innerHTML +=` loops and repeated DOM queries

**Problem**

Repeated string concatenation into `innerHTML` reparses containers over and over, and repeated DOM queries inside loops add unnecessary work.

**Suggestion**

Cache DOM references before loops and build a fragment or element list in one pass.

**Example**

```js
const target = document.getElementById('table-unreliability');
const fragment = document.createDocumentFragment();

notes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'fs-xs';
    item.textContent = note;
    fragment.appendChild(item);
});

target.innerHTML = '';

target.appendChild(fragment);
```

### 19. Bundle the ordered explorer scripts with Hugo and load them deferred

**Problem**

The explorer currently depends on many ordered script tags, which increases parser blocking and makes load order harder to maintain.

**Suggestion**

Use Hugo's asset pipeline to concatenate the ordered explorer scripts into one fingerprinted bundle, then load that bundle with `defer` once inline boot logic has been moved into the main script path.

**Example**

```gohtml
{{- $bundle := slice
    (resources.Get "js/data-explorer-new/global.js")
    (resources.Get "js/data-explorer-new/utilities.js")
    (resources.Get "js/data-explorer-new/app.js")
    (resources.Get "js/data-explorer-new/data.js")
    | resources.Concat "js/data-explorer-new/bundle.js"
    | partial "short-fingerprint.html"
-}}

<script src="{{ $bundle.RelPermalink }}" integrity="{{ $bundle.Data.Integrity }}" defer></script>
```

## 4. DOM and Template Hygiene

These recommendations reduce invalid markup, brittle selectors, and unsafe content insertion. They also make the templates easier to evolve without silently breaking client-side behavior.

### 20. Sanitize or avoid `innerHTML` for fetched content

**Problem**

Some UI text and rich content pulled from data files are inserted directly with `innerHTML`. Even in trusted systems, that widens the XSS surface and makes intent unclear.

**Suggestion**

Use `textContent` whenever HTML is not required. When HTML is required from fetched content, sanitize it before insertion.

**Example**

```js
const renderAboutSources = (about, sources) => {
    aboutMeasures.innerHTML = DOMPurify.sanitize(about);
    dataSources.innerHTML = DOMPurify.sanitize(sources);
};
```

### 21. Prefer stable data hooks and constants over brittle selectors and magic strings

**Problem**

Behavior is often tied to presentation classes or repeated string literals such as overlay names. That makes refactors risky and encourages typo-driven bugs.

**Suggestion**

Use `data-*` hooks for behavior and small constants objects for repeated values.

**Example**

```js
const OVERLAYS = Object.freeze({
    NONE: 'none',
    BAR: 'bar',
    TABLE: 'table'
});
```

## 5. Code Quality and Maintenance

These are lower-risk cleanup steps that improve reliability and readability. They do not replace the structural changes above, but they become much easier to apply once the core data flow is simplified.

### 22. Normalize types at boundaries and use strict equality

**Problem**

IDs enter the system as strings from URLs and `data-*` attributes, but the code mixes raw strings, `Number`, `parseFloat`, loose equality, and strict equality.

**Suggestion**

Normalize numeric values once at the boundary and use strict equality after that.

**Example**

```js
const indicatorId = Number(params.get('id'));
const indicator = indicators.find(item => Number(item.IndicatorID) === indicatorId);
```

### 23. Wrap analytics and fetch errors in safe helpers

**Problem**

Analytics calls and fetch paths are handled inline in multiple places. If analytics is absent or a fetch fails, unrelated UI code can become harder to reason about.

**Suggestion**

Use small wrappers for analytics and common fetch error handling so failures degrade cleanly.

**Example**

```js
const track = (eventName, payload) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, payload || {});
};
```

### 24. Converge on one DOM access style where practical

**Problem**

The explorer mixes jQuery and vanilla DOM access in the same files. That increases cognitive load and makes simple event code inconsistent.

**Suggestion**

Use vanilla DOM for ordinary event binding and element lookup, while keeping jQuery only where it is still required by Bootstrap or DataTables.

**Example**

```js
document.getElementById('howCalcButton')?.addEventListener('click', () => {
    track('click_how_calculated');
});
```
