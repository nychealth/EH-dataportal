# Data Explorer — Consolidated Improvements

Integrated from reviews by Gemini 3.1 Pro, GPT-5.4, Haiku 4.5, and Opus 4.6.
Where suggestions overlap, the most efficient and least complex approach is kept.
Ordered from most important to least important.

---

---

## Tier 1 — Architecture and Data Flow

These are the highest-impact changes. They address the root causes of the hardest
bugs: unpredictable state, race conditions, tangled data pipelines, and fragile
URL handling.

---


### 1. Replace scattered globals with a single store and dispatcher

**Problem:** Over 100 mutable `let` declarations in `global.js` are read and
written from every file. Any module can mutate any variable at any time. Load
order matters, bugs are hard to trace, and partial updates are easy to miss.

**Suggestion:** Create one store with a stable shape. Update it only through
`patch` and read it through `getState`. Add a `dispatch` function so indicator
selection, dropdown changes, URL restoration, and tab clicks all flow through
one place.

```js
// store.js

const createStore = (initialState) => {
    let state = { ...initialState };
    const listeners = new Set();

    return {
        getState() {
            return state;
        },

        patch(partial) {
            state = { ...state, ...partial };
            listeners.forEach(fn => fn(state));
        },

        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
};

const store = createStore({
    IndicatorID: null,
    MeasureID: null,
    GeoType: null,
    TimePeriodID: null,
    overlay: 'none',
    status: 'idle',
    error: null
});
```

```js
// dispatch.js

const dispatch = (action) => {
    const current = store.getState();

    switch (action.type) {
        case 'SELECT_INDICATOR':
            store.patch({
                IndicatorID: Number(action.IndicatorID),
                MeasureID: null,
                GeoType: null,
                TimePeriodID: null
            });
            break;

        case 'SET_SELECTION':
            store.patch(action.patch);
            break;

        case 'SET_OVERLAY':
            store.patch({ overlay: action.overlay });
            break;
    }

    syncURLFromState();
    scheduleRender({ updateMap: action.updateMap === true });
};
```


### 2. Guard against stale async responses

**Problem:** Rapid indicator clicks trigger concurrent fetches. The completion
order is not guaranteed, so a slower earlier response can overwrite a newer one —
potentially mixing indicator A's metadata with indicator B's data.

**Suggestion:** Use an `AbortController` to cancel the previous request, and
a token counter as a secondary guard so stale completions are discarded.

```js
let fetchController = null;
let currentLoadToken = 0;

const loadIndicator = async (indicatorId) => {
    // Cancel any in-flight request
    if (fetchController) fetchController.abort();
    fetchController = new AbortController();

    const token = ++currentLoadToken;

    try {
        const res = await fetch(
            `${data_repo}${data_branch}/indicators/data/${indicatorId}.json`,
            { signal: fetchController.signal }
        );
        const rows = await res.json();

        // Discard if a newer request was started while we waited
        if (token !== currentLoadToken) return null;

        return rows;

    } catch (e) {
        if (e.name !== 'AbortError') throw e;
        return null;
    }
};
```


### 3. Build one immutable indicator model instead of mutating many globals

**Problem:** `joinData()` writes to `tableData`, `mapData`, `trendData`,
`linksData`, `aqTableTimesGeos`, `aqMapTimesGeos`, and `aqTrendTimesGeos`. It
is hard to tell what one load actually produced, and any file can read or
overwrite any of those globals independently.

**Suggestion:** Have the data pipeline return one model object that contains
every derived table and array. Downstream code receives the model explicitly.

```js
const buildIndicatorModel = ({ indicatorRows, geoRows, timeRows }) => {
    const joined = aq.from(indicatorRows)
        .derive({ GeoRank: aq.escape(d => assignGeoRank(d.GeoType)) })
        .join_left(aq.from(geoRows), [['GeoID', 'GeoType'], ['GeoID', 'GeoType']])
        .join(aq.from(timeRows), 'TimePeriodID')
        .reify();

    return {
        joined,
        tableRows: deriveTableRows(joined),
        mapRows: deriveMapRows(joined),
        trendRows: deriveTrendRows(joined)
    };
};

// Caller
const model = buildIndicatorModel({ indicatorRows, geoRows, timeRows });
store.patch({ model });
```


### 4. Split pure data derivation from UI side effects

**Problem:** `renderMeasures()` does at least four jobs: derive measure
availability, build about-and-source content, define view closures, and enable
or disable tabs. That violates single responsibility and makes the logic hard
to test or reuse.

**Suggestion:** Return a view model from one pure function, then apply it in a
separate UI-only function.

```js
// Pure — no DOM access

const deriveViewModel = (indicator, model) => {
    const mapMeasures = indicator.Measures
        .filter(m => hasMapData(model, m.MeasureID));

    const trendMeasures = indicator.Measures
        .filter(m => hasTrendData(model, m.MeasureID));

    return {
        mapMeasures,
        trendMeasures,
        defaultMapMeasure: pickDefaultMeasure(mapMeasures),
        defaultTrendMeasure: pickDefaultMeasure(trendMeasures),
        aboutHtml: buildAboutHtml(indicator.Measures),
        sources: buildSourcesList(indicator.Measures)
    };
};


// Side effects — updates the DOM

const applyViewModel = (viewModel) => {
    renderAboutSources(viewModel.aboutHtml, viewModel.sources);
    syncTabAvailability(viewModel);
};
```


### 5. Centralize URL parsing, serialization, and history management

**Problem:** URL parsing is split across `app.js` and
`topic-indicator-selector.js`. Legacy aliases (`GeoTypeID`, `overlay=map`) are
handled in different places. Every minor interaction pushes a new history entry,
making the browser Back button nearly unusable.

**Suggestion:** One module parses URLs into a normalized selection, writes them
back from the same shape, and uses `replaceState` when the query string is
unchanged.

```js
// url.js — parse

const parseExplorerUrl = (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const rawOverlay = params.get('overlay');

    return {
        IndicatorID: params.get('id') ? Number(params.get('id')) : null,
        MeasureID: params.get('MeasureID') ? Number(params.get('MeasureID')) : null,
        GeoType: params.get('GeoType') || params.get('GeoTypeID') || null,
        TimePeriodID: params.get('TimePeriodID') ? Number(params.get('TimePeriodID')) : null,
        overlay: rawOverlay === 'map' ? 'bar' : (rawOverlay || 'none')
    };
};


// url.js — serialize

const buildExplorerUrl = ({ IndicatorID, MeasureID, GeoType, TimePeriodID, overlay }) => {
    const params = new URLSearchParams();

    if (IndicatorID != null) params.set('id', IndicatorID);
    if (MeasureID != null) params.set('MeasureID', MeasureID);
    if (GeoType) params.set('GeoType', GeoType);
    if (TimePeriodID != null) params.set('TimePeriodID', TimePeriodID);
    if (overlay && overlay !== 'none') params.set('overlay', overlay);

    return params.toString();
};


// url.js — sync (push only when something actually changed)

const syncURLFromState = () => {
    const state = store.getState();
    const nextSearch = buildExplorerUrl(state);
    const currentSearch = window.location.search.replace(/^\?/, '');
    const url = new URL(window.location.href);

    url.search = nextSearch;

    if (nextSearch === currentSearch) {
        window.history.replaceState(state, '', url);
    } else {
        window.history.pushState(state, '', url);
    }
};
```

---

---

## Tier 2 — Coupling and Structure

These changes eliminate classes of bugs by making data flow explicit, reducing
duplication, and replacing ad-hoc inter-module contracts with clear interfaces.

---


### 6. Define renderers once in a stable view registry

**Problem:** `renderMeasures()` defines `showMap`, `showBar`, `showTable`,
`showTrend`, and `showLinks` as new closures every time the indicator changes.
Old closures linger if anything holds a stale reference. This also couples
view registration to one data-prep function.

**Suggestion:** Register each renderer once. Let one dispatcher call the
active renderer, passing current state.

```js
const views = {
    bar: {
        render(state) {
            renderBar(state.filteredMapData, state.selectedMapMetadata, state.GeoType);
        }
    },

    table: {
        render(state) {
            renderTable(state.tableRows);
        }
    },

    trend: {
        render(state) {
            renderTrendChart(state.trendRows, state.selectedTrendMetadata);
        }
    }
};

const renderCurrentView = (state, { updateMap = false } = {}) => {
    if (updateMap) renderMap(state);

    const active = views[state.overlay];
    if (active) active.render(state);
};
```


### 7. Decouple map ↔ bar hover via a lightweight event bus

**Problem:** `bar.js` reaches into `window.mapInterop` and `map.js` writes
`window.myVegaView`. Both depend on the other being initialized first. If
timing differs, hover silently fails.

**Suggestion:** Use a shared `EventTarget` so neither module needs a direct
reference to the other.

```js
// events.js

const bus = new EventTarget();

const emit = (name, detail) =>
    bus.dispatchEvent(new CustomEvent(name, { detail }));

const on = (name, fn) =>
    bus.addEventListener(name, e => fn(e.detail));


// bar.js — publish hover
view.addEventListener('mouseover', (event, item) => {
    if (item?.datum?.GeoID) emit('geo:hover', { GeoID: item.datum.GeoID });
});


// map.js — subscribe
on('geo:hover', ({ GeoID }) => {
    const layer = geoIDtoLayer[GeoID];
    if (layer) highlightFeature({ target: layer });
});

on('geo:clear', () => clearAllHighlights());
```


### 8. Pass data through function parameters, not implicit globals

**Problem:** `showBar()` silently depends on `filteredMapData` which is set as
a side effect of `showMap()` running first. If execution order changes, the bar
chart renders stale or empty data.

**Suggestion:** Derive shared data in a common pipeline step before rendering
and pass the result explicitly.

```js
const prepareViewData = (model, state) => {
    const mapData = filterBySelection(model.mapRows, state);
    const barData = mapData; // same slice for bar chart

    return { mapData, barData };
};

const viewData = prepareViewData(model, store.getState());
renderMap(viewData.mapData);
renderBar(viewData.barData);
```


### 9. Consolidate duplicated default-measure priority logic

**Problem:** The same fallback chain (Age-adjusted rate → rate → Percent →
Density) is duplicated in `setDefaultMapMeasure`, `setDefaultTrendMeasure`,
`setDefaultLinksMeasure`, `setDefaultDisparitiesMeasure`, and
`getDefaultMeasure`. A priority change must be patched in four or five places.

**Suggestion:** One utility function, called everywhere.

```js
const MEASURE_PRIORITY = [
    m => /Age-adjusted rate/i.test(m.MeasurementType) && /Total/i.test(m.MeasurementType),
    m => /Age-adjusted rate/i.test(m.MeasurementType),
    m => /\brate\b/i.test(m.MeasurementType),
    m => /percent/i.test(m.MeasurementType),
    m => /density/i.test(m.MeasurementType)
];

const pickDefaultMeasure = (measures = []) => {
    for (const test of MEASURE_PRIORITY) {
        const match = measures.find(test);
        if (match) return match;
    }

    return measures[0] || null;
};

// Usage
const defaultMapMeasure = pickDefaultMeasure(mapMeasures);
const defaultTrendMeasure = pickDefaultMeasure(trendMeasures);
```


### 10. Replace geography if/else/switch chains with a unified lookup table

**Problem:** `getGeoFile`, `prettifyGeoType`, and `assignGeoRank` in
`utilities.js` use three independent long `if/else` or `switch` statements that
all map the same set of geography type keys. Adding a new geography means
editing three separate blocks.

**Suggestion:** One frozen config object, three one-liner accessors.

```js
const GEO_CONFIG = Object.freeze({
    Citywide:    { file: null,                              pretty: 'Citywide',  rank: 0  },
    Borough:     { file: 'borough.topo.json',               pretty: 'Borough',   rank: 1  },
    NYCKIDS2017: { file: 'NYCKids_2017.topo.json',          pretty: 'NYCKIDS',   rank: 2  },
    NYCKIDS2019: { file: 'NYCKids_2019.topo.json',          pretty: 'NYCKIDS',   rank: 2  },
    NYCKIDS2021: { file: 'NYCKids_2021.topo.json',          pretty: 'NYCKIDS',   rank: 2  },
    NYCKIDS2023: { file: 'NYCKids_2023.topo.json',          pretty: 'NYCKIDS',   rank: 2  },
    UHF34:       { file: 'UHF34.topo.json',                 pretty: 'UHF34',     rank: 3  },
    UHF42:       { file: 'UHF42.topo.json',                 pretty: 'UHF42',     rank: 4  },
    Subboro:     { file: 'PUMA_or_Subborough.topo.json',    pretty: 'Subboro',   rank: 5  },
    CD:          { file: 'CD.topo.json',                    pretty: 'CD',        rank: 6  },
    CDTA2020:    { file: 'CDTA_2020.topo.json',             pretty: 'CDTA',      rank: 7  },
    PUMA2010:    { file: 'PUMA2010.topo.json',              pretty: 'PUMA',      rank: 8  },
    PUMA2020:    { file: 'PUMA2020.topo.json',              pretty: 'PUMA',      rank: 8  },
    NTA2010:     { file: 'NTA_2010.topo.json',              pretty: 'NTA',       rank: 10 },
    NTA2020:     { file: 'NTA_2020.topo.json',              pretty: 'NTA',       rank: 10 },
    NYHarbor:    { file: 'ny_harbor.topo.json',             pretty: 'NYHarbor',  rank: 11 },
    RMZ:         { file: 'RMZ.topo.json',                   pretty: 'RMZ',       rank: 12 }
});

const getGeoFile     = (gt) => GEO_CONFIG[gt]?.file    ?? null;
const prettifyGeoType = (gt) => GEO_CONFIG[gt]?.pretty  ?? gt;
const assignGeoRank   = (gt) => GEO_CONFIG[gt]?.rank    ?? -1;
```

---

---

## Tier 3 — Performance

These changes reduce unnecessary network requests, DOM churn, and redundant
computation. Each one targets a measurable cost in the current implementation.

---


### 11. Cache static fetches with promise memoization

**Problem:** `metadata.json`, `GeoLookup.json`, `TimePeriods.json`, TopoJSON
files, and `311-crosswalk.csv` are stable assets that rarely change, but the
current code re-fetches some of them on every indicator switch or map render.

**Suggestion:** Cache the fetch promise (not just the result) so concurrent
callers share the same in-flight request.

```js
const fetchCache = new Map();

const fetchOnce = (url) => {
    if (!fetchCache.has(url)) {
        const promise = fetch(url).then(res => {
            if (!res.ok) throw new Error(`Fetch failed: ${url}`);
            return res.json();
        });

        fetchCache.set(url, promise);
    }

    return fetchCache.get(url);
};

// Usage
const loadGeoLookup  = () => fetchOnce(`${data_repo}${data_branch}/geography/GeoLookup.json`);
const loadTimePeriods = () => fetchOnce(`${data_repo}${data_branch}/indicators/metadata/TimePeriods.json`);
```


### 12. Reuse the Leaflet GeoJSON layer instead of rebuilding it

**Problem:** `renderMap()` removes the previous layer, re-fetches the TopoJSON,
rebuilds the layer, rebinds all event handlers, and recreates interop state on
every selection change — even when the geography type has not changed.

**Suggestion:** Cache the parsed topology per geography type. When only the data
changes (same `GeoType`), patch the existing layer's feature properties and
restyle in place.

```js
const topoCache = new Map();

const getTopology = async (geoType) => {
    if (!topoCache.has(geoType)) {
        const file = getGeoFile(geoType);
        topoCache.set(geoType, fetchOnce(`${data_repo}${data_branch}/geography/${file}`));
    }

    return topoCache.get(geoType);
};

const patchLayerData = (geojsonLayer, rows) => {
    const byGeoId = new Map(rows.map(r => [r.GeoID, r]));

    geojsonLayer.eachLayer(layer => {
        const geoId = layer.feature.properties.GEOCODE;
        const row = byGeoId.get(geoId);

        Object.assign(layer.feature.properties, row || {});
        layer.setStyle(styleFeature(layer.feature));
    });
};
```


### 13. Reuse the Vega view instead of re-embedding every render

**Problem:** `renderBar()` recompiles and re-embeds the full Vega-Lite spec on
every render. That is significantly heavier than pushing new data into an
existing view.

**Suggestion:** Create the chart once, then use `changeset()` to swap data.

```js
let barView = null;

const makeBaseBarSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'barTable' },
    mark: 'bar',
    encoding: {
        x: { field: 'Value', type: 'quantitative' },
        y: { field: 'Geography', type: 'nominal', sort: '-x' }
    }
});

const ensureBarView = async () => {
    if (!barView) {
        const result = await vegaEmbed('#barHolder', makeBaseBarSpec(), { actions: false });
        barView = result.view;
    }

    return barView;
};

const updateBar = async (rows) => {
    const view = await ensureBarView();

    view.change('barTable',
        vega.changeset().remove(() => true).insert(rows)
    ).run();
};
```


### 14. Destroy DataTables before re-initialization and bind handlers once

**Problem:** `renderTable()` calls `new DataTable()` without destroying the
previous instance, leaking memory and event listeners. Separately,
`handleToggle()` is called inside the `drawCallback` (which fires on every sort,
search, and redraw), tearing down and re-attaching the same delegated handler
each time.

**Suggestion:** Always destroy the old instance. Bind the group-click handler
once at the module level.

```js
// Destroy before re-init

let summaryTableInstance = null;

const mountTable = (html, options) => {
    if ($.fn.DataTable.isDataTable('#tableID')) {
        $('#tableID').DataTable().destroy();
        $('#tableID').empty();
    }

    document.getElementById('summary-table').innerHTML = html;
    summaryTableInstance = $('#tableID').DataTable(options);

    return summaryTableInstance;
};


// Bind once — not inside drawCallback

$('body').on('click', '#summary-table tr.group td', function (e) {
    const td = $(e.target);
    const groupLevel = td.data('group-level');

    if (groupLevel === 0) {
        toggleTimeGroup(td);
    } else {
        toggleSubGroup(td);
    }
});
```


### 15. Track previous highlight instead of resetting all layers on mouseover

**Problem:** Every `mouseover` on the map calls
`geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l))`, iterating over all
features to clear highlights before applying the new one. On a map with 200+
polygons this is O(n) DOM style writes per mouse move.

**Suggestion:** Track the previously highlighted layer and reset only that one.

```js
let previousLayer = null;

layer.on('mouseover', (e) => {
    if (previousLayer) {
        geojsonLayer.resetStyle(previousLayer);
    }

    highlightFeature(e);
    previousLayer = e.target;
    updateHoverUI(e.target.feature.properties);
});

layer.on('mouseout', (e) => {
    geojsonLayer.resetStyle(e.target);
    previousLayer = null;
    clearHoverUI();
});
```


### 16. Batch render updates with requestAnimationFrame and dirty flags

**Problem:** A single selection change can rebuild menus, push history, redraw
the map, and redraw the active overlay all synchronously — even when several
state updates happen back-to-back (e.g., indicator switch sets multiple fields).

**Suggestion:** Queue render work once per frame and only refresh what is dirty.

```js
const dirty = { map: false, overlay: false, scheduled: false };

const scheduleRender = ({ updateMap = false } = {}) => {
    dirty.map = dirty.map || updateMap;
    dirty.overlay = true;

    if (dirty.scheduled) return;
    dirty.scheduled = true;

    requestAnimationFrame(() => {
        if (dirty.map) renderMap(store.getState());
        if (dirty.overlay) renderCurrentView(store.getState());

        dirty.map = false;
        dirty.overlay = false;
        dirty.scheduled = false;
    });
};
```


### 17. Memoize heavy Arquero operations

**Problem:** Arquero joins, folds, and derives run synchronously on every state
change, blocking the main thread — even when the underlying indicator data has
not actually changed.

**Suggestion:** Memoize based on input identity so the computation only runs
when the input table changes.

```js
let lastInput = null;
let lastResult = null;

const getDerivedTable = (aqTable) => {
    if (lastInput === aqTable) return lastResult;

    lastResult = aqTable
        .fold(['rate', 'count'])
        .derive({ /* ... */ });

    lastInput = aqTable;
    return lastResult;
};
```


### 18. Only render the active tab (lazy evaluation)

**Problem:** Stubs like `renderTrendChart()` execute and their data pipelines
run even when the corresponding tab is not visible. This wastes computation
and complicates reasoning about partial features.

**Suggestion:** Skip data preparation and rendering entirely for inactive tabs.
Gate unimplemented views with feature flags so they are never entered.

```js
const featureFlags = {
    bar: true,
    table: true,
    trend: false,
    links: false,
    disparities: false
};

const renderCurrentView = (state) => {
    const { overlay } = state;

    if (!featureFlags[overlay]) return;

    const active = views[overlay];
    if (active) active.render(state);
};

// On DOMContentLoaded, disable tabs for unimplemented features
const applyFeatureFlags = () => {
    document.querySelector('#v-pills-trends-tab')
        ?.classList.toggle('disabled', !featureFlags.trend);

    document.querySelector('#v-pills-correlate-tab')
        ?.classList.toggle('disabled', !featureFlags.links);
};
```

---

---

## Tier 4 — DOM and Template Hygiene

These changes improve correctness, accessibility, and Content Security Policy
compliance by cleaning up how the application interacts with the DOM.

---


### 19. Move inline onclick handlers out of templates and generated HTML

**Problem:** `de-tab-content.html` injects inline `onclick="..."` handlers, and
`printIndicators()` generates `onclick='selectIndicator(${id})'` in HTML
strings. This requires globals, bypasses CSP `unsafe-inline` restrictions, and
makes handlers hard to manage.

**Suggestion:** Keep markup declarative with `data-*` attributes and wire
behavior programmatically.

```html
<!-- Template: data attribute only, no inline JS -->
<button
    type="button"
    class="close-tab-pane"
    aria-label="Close"
    data-close-pane="v-pills-bar">
    <img src="/images/arrow-right.svg" alt="">
</button>
```

```js
// Programmatic: one delegated listener
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-close-pane]');
    if (!btn) return;

    closeTabPane(btn.dataset.closePane);
});
```

```js
// Indicator buttons: addEventListener instead of onclick string
const btn = document.createElement('button');
btn.className = 'h6 btn btn-link text-left p-0';
btn.textContent = indicator.IndicatorName;
btn.addEventListener('click', () => selectIndicator(indicator.IndicatorID));
```


### 20. Use event delegation for dropdown menus

**Problem:** Every menu rebuild creates new button elements and binds click
listeners to each one individually. That creates listener churn and makes
menu regeneration more expensive than it needs to be.

**Suggestion:** Render buttons with data attributes and attach one delegated
listener at the document level.

```js
const renderMenu = (container, items, type, selectedValue) => {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dropdown-item';
        button.dataset.menuType = type;
        button.dataset.value = String(item.value);
        button.textContent = item.label;

        if (String(item.value) === String(selectedValue)) {
            button.classList.add('is-selected');
        }

        fragment.appendChild(button);
    });

    container.replaceChildren(fragment);
};


// One listener for all menus
document.addEventListener('click', (e) => {
    const option = e.target.closest('[data-menu-type][data-value]');
    if (!option) return;

    handleSelection(option.dataset.menuType, option.dataset.value);
});
```


### 21. Build DOM with DocumentFragment instead of innerHTML +=

**Problem:** `311.js` and `printIndicators()` append HTML using
`el.innerHTML += btn`, which forces the browser to serialize, concatenate, and
re-parse the entire DOM subtree on every iteration. Event listeners on existing
children are silently destroyed.

**Suggestion:** Collect nodes into a DocumentFragment and assign once.

```js
const fragment = document.createDocumentFragment();

filtered.forEach(item => {
    const a = document.createElement('a');
    a.href = `https://portal.311.nyc.gov/article/?kanumber=${encodeURIComponent(item.kaLink)}`;
    a.className = 'mr-1';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = item.topic;

    fragment.appendChild(a);
    fragment.appendChild(document.createTextNode('| '));
});

dest.forEach(el => {
    el.innerHTML = '';
    el.appendChild(fragment.cloneNode(true));
});
```


### 22. Prefer DOM nodes and textContent over raw innerHTML for dynamic content

**Problem:** Several render paths build markup with `innerHTML` using content
from metadata and data files. That is brittle and makes it easy to forget
sanitization.

**Suggestion:** Use `createElement` + `textContent` for plain text. Reserve
`innerHTML` for trusted static markup or sanitize with `DOMPurify`.

```js
const appendMeasureDescription = (container, measure) => {
    const p = document.createElement('p');
    const label = document.createElement('strong');

    label.textContent = `${measure.MeasurementType}: `;
    p.append(label, document.createTextNode(measure.how_calculated || ''));

    container.appendChild(p);
};

const renderHowCalculated = (container, measures) => {
    container.replaceChildren();
    measures.forEach(m => appendMeasureDescription(container, m));
};
```


### 23. Eliminate duplicate DOM IDs across desktop and mobile menus

**Problem:** Desktop and mobile navigation menus share identical IDs like
`measureOptionsDropdownButton`, breaking HTML semantics and risking selector
collisions.

**Suggestion:** Use `data-role` attributes for JavaScript targeting instead of
relying on IDs that must be unique.

```js
document.querySelectorAll('[data-role="measure-dropdown-button"]').forEach(btn => {
    btn.addEventListener('click', handleMenuClick);
});
```


### 24. Standardize the DOM interaction layer

**Problem:** The codebase mixes jQuery, raw DOM APIs, Bootstrap tab helpers,
and global `onclick`. That makes behavior harder to predict and raises the
maintenance cost of small changes.

**Suggestion:** For new code, pick one style and hide the remaining differences
behind a tiny helper.

```js
const dom = {
    qs: (sel, root = document) => root.querySelector(sel),
    qsa: (sel, root = document) => [...root.querySelectorAll(sel)],

    on(root, event, selector, handler) {
        root.addEventListener(event, e => {
            const match = e.target.closest(selector);
            if (match) handler(e, match);
        });
    }
};

// Usage
dom.on(document, 'click', '.nav-link[data-toggle="pill"]', (e, tab) => {
    dispatch({ type: 'SET_OVERLAY', overlay: tab.dataset.overlay });
});
```

---

---

## Tier 5 — Code Quality and Maintenance

These changes improve clarity, remove noise, and add safety nets. None change
user-visible behavior, but each one makes the codebase easier to work with.

---


### 25. Delete dead code and commented-out blocks

**Problem:** `measures.js` has disabled handler references, `map.js` has a
deactivated bubble-map branch, `bar.js` has commented Vega rule layers, and
`global.js` has a disabled `renderTitleDescription` function. This noise
obscures active logic and inflates files.

**Suggestion:** Remove it. Git history preserves everything.

```diff
- // let markType = 'geoshape'
- // let encode = {"shape": {"field": "geo", "type": "geojson"}}
- // let strokeWidth = 1.25
- // let legend;
-
- // if (mapMeasurementType.includes('Number') || ... ) {
- //     // circle
- // } else {
- //     // choro
- // }
```


### 26. Replace deprecated execCommand copy with Clipboard API

**Problem:** `copyCitation()` creates a hidden `<textarea>` and calls
`document.execCommand('select')`, then also calls
`navigator.clipboard.writeText`. The textarea path is redundant.

**Suggestion:** Clipboard API only.

```js
const copyCitation = async () => {
    const text = document.getElementById('citeText').innerText;

    try {
        await navigator.clipboard.writeText(text);
        document.getElementById('citeButton').innerHTML =
            '<i class="fas fa-copy mr-1" aria-hidden="true"></i>Copied!';
    } catch (err) {
        console.error('Copy failed:', err);
    }
};
```


### 27. Centralize endpoint paths in a config object

**Problem:** Paths to JSON files (`/IndicatorData/`, `/geography/`, etc.) are
hardcoded inside individual fetch calls across multiple files. Swapping between
staging and production requires Hugo variable injection or find-and-replace.

**Suggestion:** One config object, referenced everywhere.

```js
const CONFIG = {
    dataRepo: data_repo,
    dataBranch: data_branch,

    endpoints: {
        metadata: () => `${CONFIG.dataRepo}${CONFIG.dataBranch}/indicators/metadata/metadata.json`,
        geoLookup: () => `${CONFIG.dataRepo}${CONFIG.dataBranch}/geography/GeoLookup.json`,
        timePeriods: () => `${CONFIG.dataRepo}${CONFIG.dataBranch}/indicators/metadata/TimePeriods.json`,
        indicatorData: (id) => `${CONFIG.dataRepo}${CONFIG.dataBranch}/indicators/data/${id}.json`,
        geography: (file) => `${CONFIG.dataRepo}${CONFIG.dataBranch}/geography/${file}`
    }
};
```


### 28. Replace console.log with a configurable debug logger

**Problem:** Nearly every function starts with `console.log("* functionName")`.
In production, dozens of log lines pollute the console.

**Suggestion:** Gate behind a URL flag.

```js
const DEBUG = new URLSearchParams(window.location.search).has('debug');

const log = (...args) => {
    if (DEBUG) console.log(...args);
};

// Usage
const renderMeasures = async () => {
    log('* renderMeasures');
    // ...
};
```


### 29. Add explicit loading, error, and empty states

**Problem:** The current flow assumes everything loads successfully. If a
request fails or an indicator has no data for the chosen combination, the UI
has very little structured fallback.

**Suggestion:** Track request state in the store and render status-specific UI.

```js
const setStatus = (status, error = null) => {
    store.patch({ status, error });
    renderStatusPanel(store.getState());
};

const refreshIndicator = async (indicatorId) => {
    setStatus('loading');

    try {
        const model = await loadIndicator(indicatorId);
        if (!model) return; // stale request, discarded

        store.patch({ model });
        setStatus('ready');

    } catch (err) {
        setStatus('error', err);
    }
};
```


### 30. Guard analytics calls

**Problem:** Event handlers call `gtag(...)` directly. If analytics is
unavailable in a local or test context, that causes runtime errors.

**Suggestion:** One safe wrapper.

```js
const track = (eventName, payload = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, payload);
};

track('click_tab', { tab: 'bar' });
```


### 31. Declare map.js helper functions before use

**Problem:** `styleFeature`, `highlightFeature`, `createPopupContent`, and
others are defined as `const` arrow functions *after* the `fetch().then()` chain
that references them. `const` is not hoisted. This works only because the fetch
is asynchronous and finishes after script evaluation, but it is fragile.

**Suggestion:** Move definitions above the fetch call, or use hoisted `function`
declarations.

```js
// Define first
function styleFeature(feature) {
    const value = feature.properties.Value;
    return {
        fillColor: value != null ? colorScale(value) : '#ccc',
        weight: 0.35,
        color: 'black',
        fillOpacity: 0.8
    };
}

function highlightFeature(e) { /* ... */ }
function createPopupContent(properties) { /* ... */ }

// Then fetch
fetchOnce(topoFile).then(topology => {
    // uses styleFeature, highlightFeature, etc.
});
```


### 32. Cache frequently queried DOM elements

**Problem:** Multiple files repeatedly query the same nodes — tab buttons, tab
content, metadata containers, legend labels — across different render cycles.

**Suggestion:** Resolve once after `DOMContentLoaded`.

```js
const deDOM = {};

const cacheDOM = () => {
    deDOM.tabContent = document.querySelector('#v-pills-tabContent');
    deDOM.aboutMeasures = document.querySelector('.indicator-measures');
    deDOM.dataSources = document.querySelector('.indicator-sources');
    deDOM.minVal = document.getElementById('minVal');
    deDOM.maxVal = document.getElementById('maxVal');
};

document.addEventListener('DOMContentLoaded', cacheDOM);
```


### 33. Add lightweight tests for pure URL and menu logic

**Problem:** URL normalization and cascading menu defaults are behavior-heavy
and easy to regress, but they cannot be verified quickly without spinning up
the full UI.

**Suggestion:** Extract the pure functions and cover them with simple assertion
tests.

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('parseExplorerUrl normalizes legacy params', () => {
    const state = parseExplorerUrl('?id=2133&GeoTypeID=CDTA2020&overlay=map');

    assert.equal(state.IndicatorID, 2133);
    assert.equal(state.GeoType, 'CDTA2020');
    assert.equal(state.overlay, 'bar');
});

test('pickDefaultMeasure prefers age-adjusted rates', () => {
    const measures = [
        { MeasurementType: 'Percent' },
        { MeasurementType: 'Age-adjusted rate per 100,000' }
    ];

    assert.equal(
        pickDefaultMeasure(measures).MeasurementType,
        'Age-adjusted rate per 100,000'
    );
});
```
