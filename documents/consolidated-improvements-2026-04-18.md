# Consolidated Improvements — 2026-04-18

## Architecture and Data Flow

These changes address the parts of the explorer that currently make behavior hardest to predict: shared state, selection changes, renderer timing, and bootstrapping. Fixing these first reduces the number of places where valid state can drift or rendering can happen in the wrong order.


### Single Explorer State

**Problem**  
Selection, fetched data, metadata, and UI flags are spread across many top-scope globals. That makes state mutations hard to trace, encourages cross-file side effects, and makes resets or debugging depend on script order.

**Suggestion**  
Keep one global explorer namespace with nested buckets for selection, data, metadata, and UI. Let all reads and writes go through that object so state is inspectable and resettable from one place.

**Example**

```js
window.de = window.de || {};

de.state = {
  selection: {
    indicatorId: null,
    measureId: null,
    geoType: null,
    timePeriodId: null,
    overlay: 'none'
  },

  data: {
    mapRows: [],
    trendRows: [],
    tableRows: [],
    linksRows: []
  },

  metadata: {
    indicator: null,
    availability: null
  },

  ui: {
    comparisonTrendOpen: false
  }
};

de.setState = function (patch) {
  if (patch.selection) Object.assign(de.state.selection, patch.selection);
  if (patch.data) Object.assign(de.state.data, patch.data);
  if (patch.metadata) Object.assign(de.state.metadata, patch.metadata);
  if (patch.ui) Object.assign(de.state.ui, patch.ui);
};
```


### Canonical Selection and URL Flow

**Problem**  
Indicator changes, dropdown changes, popstate handling, legacy URL aliases, and history updates are handled in different places. That splits the rules for valid selections, creates redundant `pushState` calls, and makes no-op interactions add useless history entries.

**Suggestion**  
Route all selection changes through one transition function that normalizes legacy inputs, skips no-op updates, writes state, and decides whether to `pushState` or `replaceState`.

**Example**

```js
function normalizeSelection(input) {
  return {
    indicatorId: input.indicatorId == null ? null : Number(input.indicatorId),
    measureId: input.measureId == null ? null : Number(input.measureId),
    geoType: input.geoType || input.geoTypeId || null,
    timePeriodId: input.timePeriodId == null ? null : Number(input.timePeriodId),
    overlay: input.overlay === 'map' ? 'bar' : (input.overlay || 'none')
  };
}

function buildSearch(selection) {
  var params = new URLSearchParams();

  params.set('id', selection.indicatorId);

  if (selection.measureId != null) params.set('MeasureID', selection.measureId);
  if (selection.geoType) params.set('GeoType', selection.geoType);
  if (selection.timePeriodId != null) params.set('TimePeriodID', selection.timePeriodId);
  if (selection.overlay && selection.overlay !== 'none') params.set('overlay', selection.overlay);

  return params.toString();
}

function applySelection(nextSelection, mode) {
  var next = normalizeSelection(nextSelection);
  var current = de.state.selection;

  if (
    current.indicatorId === next.indicatorId &&
    current.measureId === next.measureId &&
    current.geoType === next.geoType &&
    current.timePeriodId === next.timePeriodId &&
    current.overlay === next.overlay
  ) {
    return;
  }

  de.setState({ selection: next });

  if (mode === 'push') {
    window.history.pushState(next, '', '?' + buildSearch(next));
  } else {
    window.history.replaceState(next, '', '?' + buildSearch(next));
  }
}
```


### Availability Matrix for Valid Combinations

**Problem**  
Valid measures, geographies, time periods, and enabled tabs are recomputed in several places. That duplication makes it easy for menus, defaults, and disabled states to disagree.

**Suggestion**  
Build one availability object after indicator data is loaded, then use it everywhere selection validation, default picking, and tab enabling need the same facts.

**Example**

```js
function buildAvailability(indicator) {
  var availability = {
    measures: {},
    tabs: {
      bar: false,
      table: false,
      trend: false,
      links: false
    }
  };

  indicator.Measures.forEach(function (measure) {
    var mapOptions = measure.VisOptions[0].Map || [];

    availability.measures[measure.MeasureID] = {
      geos: mapOptions.map(function (item) {
        return prettifyGeoType(item.GeoType);
      }),

      timesByGeo: mapOptions.reduce(function (acc, item) {
        acc[prettifyGeoType(item.GeoType)] = item.TimePeriodID.slice();
        return acc;
      }, {})
    };
  });

  return availability;
}

de.setState({
  metadata: {
    indicator: indicator,
    availability: buildAvailability(indicator)
  }
});
```


### Stable Renderers and Shared Selectors

**Problem**  
Renderer functions are redefined during indicator loads, and some overlays rely on other renderers having already populated shared globals such as filtered map data. That creates hidden dependencies and stale-closure risk.

**Suggestion**  
Define renderers once at top scope, keep them stable, and let them read current state or shared selector helpers. Use a renderer map instead of a long switch chain.

**Example**

```js
function getActiveMapSlice() {
  var selection = de.state.selection;

  return de.state.data.mapRows.filter(function (row) {
    return row.MeasureID === selection.measureId &&
      row.TimePeriodID === selection.timePeriodId &&
      prettifyGeoType(row.GeoType) === selection.geoType;
  });
}

function renderMapPanel() {
  renderMap(getActiveMapSlice(), getActiveMapMetadata());
}

function renderBarOverlay() {
  renderBar(getActiveMapSlice(), getActiveMapMetadata(), de.state.selection.geoType);
}

var overlayRenderers = {
  bar: renderBarOverlay,
  table: renderTableOverlay,
  trend: renderTrendOverlay,
  links: renderLinksOverlay
};

function renderCurrentView(updateMap) {
  if (updateMap) renderMapPanel();

  var overlay = de.state.selection.overlay;

  if (overlay === 'none') {
    closeOverlayPanel();
    return;
  }

  (overlayRenderers[overlay] || renderBarOverlay)();
}
```


### One Deferred Explorer Bootstrap

**Problem**  
Explorer startup is spread across templates, partials, and many separate script tags. That makes load order brittle and mixes page data injection with UI behavior.

**Suggestion**  
Keep the current plain-JavaScript, global-script pattern, but move to one Hugo-managed bundle plus one deferred initializer. Pass page data directly with `jsonify` instead of remapping it by hand in templates.

**Example**

```html
{{ $explorer := slice
  (resources.Get "js/data-explorer-new/global.js")
  (resources.Get "js/data-explorer-new/utilities.js")
  (resources.Get "js/data-explorer-new/app.js")
  (resources.Get "js/data-explorer-new/data.js")
  (resources.Get "js/data-explorer-new/measures.js")
  (resources.Get "js/data-explorer-new/table.js")
  (resources.Get "js/data-explorer-new/map.js")
  (resources.Get "js/data-explorer-new/menu.js")
  (resources.Get "js/data-explorer-new/bar.js")
  (resources.Get "js/data-explorer-new/trend.js")
  (resources.Get "js/data-explorer-new/correlate.js")
  | resources.Concat "js/data-explorer-new.js"
  | partial "short-fingerprint.html" }}

<script src="{{ $explorer.RelPermalink }}" integrity="{{ $explorer.Data.Integrity }}" defer></script>

<script defer>
  window.addEventListener('DOMContentLoaded', function () {
    initDataExplorerNew({
      indicators: {{ .Params.indicators | jsonify | safeJS }}
    });
  });
</script>
```


## Coupling and Structure

These items reduce avoidable duplication and make relationships between files more explicit. The goal is to keep modules loosely connected without changing the repository’s current plain JavaScript and Hugo rendering model.


### Shared Default-Measure Helper

**Problem**  
The same measure-priority chain is repeated in multiple `setDefault*` functions. That makes one business rule live in several places and increases the chance of inconsistent defaults.

**Suggestion**  
Move preferred-measure selection into one helper and reuse it for map, trend, links, and any other defaulting path.

**Example**

```js
var MEASURE_PRIORITY = [
  'Age-adjusted rate',
  'rate',
  'Rate',
  'Percent',
  'percent',
  'Density'
];

function pickPreferredMeasure(measures) {
  for (var i = 0; i < MEASURE_PRIORITY.length; i++) {
    var match = measures.find(function (measure) {
      return measure.MeasurementType.indexOf(MEASURE_PRIORITY[i]) !== -1;
    });

    if (match) return match;
  }

  return measures[0] || null;
}
```


### Central Mapping Tables for Geography and Measurement Semantics

**Problem**  
Topology file names, pretty-vs-raw geography values, and measurement-type keywords are scattered as magic strings. Adding a new geography or changing a label requires touching several unrelated functions.

**Suggestion**  
Keep one mapping registry for geography families, reverse lookups, file names, and measurement labels so the explorer has one source of truth for these conversions.

**Example**

```js
var GEO_GROUPS = {
  NTA: ['NTA2010', 'NTA2020'],
  PUMA: ['PUMA2010', 'PUMA2020'],
  CDTA: ['CDTA2020'],
  NYCKIDS: ['NYCKIDS2017', 'NYCKIDS2019', 'NYCKIDS2021', 'NYCKIDS2023']
};

var GEO_FILES = {
  NTA2010: 'NTA_2010.topo.json',
  NTA2020: 'NTA_2020.topo.json',
  UHF42: 'UHF42.topo.json',
  UHF34: 'UHF34.topo.json',
  Borough: 'borough.topo.json'
};

function rawGeoTypesFor(prettyGeoType) {
  return GEO_GROUPS[prettyGeoType] || [prettyGeoType];
}

function getGeoFile(rawGeoType) {
  return GEO_FILES[rawGeoType] || null;
}
```


### Single Overlay and Panel State Helper

**Problem**  
Overlay state is currently coordinated through scattered class toggles, tab activation code, style changes, and panel-close logic. That makes a simple open or close action harder to reason about than it should be.

**Suggestion**  
Use one `setOverlay` helper that updates selection state, active tab classes, panel visibility, and wrapper state together.

**Example**

```js
function setOverlay(name) {
  var paneMap = {
    bar: 'v-pills-bar',
    table: 'v-pills-table',
    trend: 'v-pills-trends',
    links: 'v-pills-correlate'
  };

  de.setState({
    selection: {
      overlay: name
    }
  });

  document.querySelectorAll('.tab-pane').forEach(function (pane) {
    var active = pane.id === paneMap[name];

    pane.classList.toggle('show', active);
    pane.classList.toggle('active', active);
  });

  document.querySelector('.de-tabs').classList.toggle('has-open-panel', name !== 'none');
}
```


### Custom Events Instead of Render-Time Globals

**Problem**  
Map and chart coordination depends on globals that appear only after a renderer has finished loading. That makes hover sync and map-ready timing fragile.

**Suggestion**  
Publish and subscribe to document-level custom events for cross-renderer coordination, including “map ready” and hover interactions.

**Example**

```js
function emitGeoHover(geoId) {
  document.dispatchEvent(new CustomEvent('de:hover-geo', {
    detail: { geoId: geoId }
  }));
}

window.dispatchEvent(new CustomEvent('de:map-ready'));

document.addEventListener('de:hover-geo', function (event) {
  highlightGeoOnMap(event.detail.geoId);
  highlightGeoInBar(event.detail.geoId);
});
```


### Validate the DOM Contract and Feature Flags Once

**Problem**  
Optional DOM targets, legacy placeholders, and unfinished views are checked piecemeal throughout the code. That creates null-sensitive branches and leaves incomplete features looking partially active.

**Suggestion**  
Collect DOM references once during initialization, mark optional features explicitly, and let helpers no-op when an element or feature is intentionally absent.

**Example**

```js
de.dom = {
  map: document.getElementById('map'),
  tabContent: document.getElementById('v-pills-tabContent'),
  aboutMeasures: document.querySelector('.indicator-measures'),
  dataSources: document.querySelector('.indicator-sources')
};

de.features = {
  bar: true,
  table: true,
  trend: false,
  links: false
};

function canUseFeature(name) {
  return de.features[name] === true;
}

function renderAboutSources(aboutHtml, sourcesHtml) {
  if (!de.dom.aboutMeasures || !de.dom.dataSources) return;

  de.dom.aboutMeasures.innerHTML = aboutHtml;
  de.dom.dataSources.innerHTML = sourcesHtml;
}
```


## Performance

These improvements reduce unnecessary network work, avoid wasted rendering, and make fast user interactions safer. They are incremental changes that fit the current browser-side architecture.


### Cache Static and Semi-Static Fetches by URL

**Problem**  
Metadata, geography lookups, time periods, TopoJSON, linked indicator data, and the 311 crosswalk are fetched repeatedly even though they do not change during a session.

**Suggestion**  
Use a small promise cache keyed by URL and reuse it anywhere the same JSON or CSV asset is requested.

**Example**

```js
var fetchCache = new Map();

function fetchJSONCached(url) {
  if (!fetchCache.has(url)) {
    fetchCache.set(url, fetch(url).then(function (response) {
      return response.json();
    }));
  }

  return fetchCache.get(url);
}

function fetchTextCached(url) {
  if (!fetchCache.has(url)) {
    fetchCache.set(url, fetch(url).then(function (response) {
      return response.text();
    }));
  }

  return fetchCache.get(url);
}
```


### Guard Against Stale Indicator Loads

**Problem**  
If a user changes indicators quickly, an earlier request can finish after a later one and overwrite the newer selection with stale data.

**Suggestion**  
Add a request token to indicator-scoped loading so only the most recent response is allowed to update state and render.

**Example**

```js
var activeLoadToken = 0;

async function loadIndicator(indicatorId) {
  var token = ++activeLoadToken;
  var rows = await fetchJSONCached(data_repo + data_branch + '/indicators/data/' + indicatorId + '.json');

  if (token !== activeLoadToken) {
    return;
  }

  de.setState({
    selection: { indicatorId: Number(indicatorId) },
    data: { mapRows: rows }
  });

  renderCurrentView(true);
}
```


### Reuse Expensive Renderer Instances and Manage Lifecycle Explicitly

**Problem**  
The map path rebuilds expensive geometry too often, and the table path recreates DataTables without an explicit destroy step. Replacing DOM alone hides lifecycle problems instead of fixing them.

**Suggestion**  
Cache reusable map geometry when geography stays the same, update feature values in place when possible, and explicitly destroy old table or map instances before rebuilding.

**Example**

```js
var topoCache = {};
var summaryTable = null;

function getTopologyForGeo(geoType) {
  var file = getGeoFile(geoType);

  if (!topoCache[file]) {
    topoCache[file] = fetchJSONCached(data_repo + data_branch + '/geography/' + file);
  }

  return topoCache[file];
}

function mountSummaryTable() {
  if ($.fn.DataTable.isDataTable('#tableID')) {
    $('#tableID').DataTable().destroy();
  }

  summaryTable = $('#tableID').DataTable({
    paging: false,
    searching: true
  });
}
```


### Batch DOM Writes

**Problem**  
Repeated `innerHTML +=` calls and per-item appends inside loops cause unnecessary parsing and layout work, especially for notes, 311 links, and other repeated UI lists.

**Suggestion**  
Build the full fragment or string in memory, then replace the target content once per render.

**Example**

```js
function render311Links(items, container) {
  var fragment = document.createDocumentFragment();

  items.forEach(function (item, index) {
    var link = document.createElement('a');

    link.href = 'https://portal.311.nyc.gov/article/?kanumber=' + encodeURIComponent(item.kaLink);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.topic;

    fragment.appendChild(link);

    if (index < items.length - 1) {
      fragment.appendChild(document.createTextNode(' | '));
    }
  });

  container.replaceChildren(fragment);
}
```


## DOM and Template Hygiene

These items keep the Hugo markup declarative and make the browser-side contract clearer. They also reduce invalid HTML, eliminate brittle inline behavior, and make dynamic content safer to maintain.


### Make Repeated Controls Declarative and Unique

**Problem**  
Mobile and desktop control groups duplicate nearly identical markup, and several controls reuse the same `id` values. That produces invalid HTML and forces behavior to rely on brittle workarounds.

**Suggestion**  
Render repeated control groups from one Hugo data structure, generate unique IDs only where accessibility needs them, and use `data-role` hooks for behavior.

**Example**

```html
{{ $controls := slice
  (dict "key" "measure" "label" "Measure" "nameClass" "measure-name" "menuClass" "measures-holder")
  (dict "key" "geo" "label" "Boundary" "nameClass" "geo-name" "menuClass" "geo-holder")
  (dict "key" "time" "label" "Year" "nameClass" "time-name" "menuClass" "time-holder") }}

{{ range $controls }}
  <button
    id="{{ printf "%s-button-%s" .key "desktop" }}"
    data-role="{{ .key }}-button"
    type="button"
    aria-haspopup="true"
    aria-expanded="false">
    <span class="{{ .nameClass }}"></span>
  </button>

  <div
    class="dropdown-menu {{ .menuClass }}"
    aria-labelledby="{{ printf "%s-button-%s" .key "desktop" }}">
  </div>
{{ end }}
```


### Move Behavior Out of Templates

**Problem**  
Inline `onclick` handlers and inline scripts inside partials mix behavior with markup, complicate debugging, and make CSP-friendly templates harder.

**Suggestion**  
Keep templates declarative with `data-action` and `data-pane` attributes, then wire behavior from a deferred JavaScript initializer.

**Example**

```html
<button
  type="button"
  class="close-tab-pane"
  data-action="close-tab"
  data-pane="v-pills-bar"
  aria-label="Close">
  <img src="{{ relURL "images/arrow-right.svg" }}" alt="">
</button>
```

```js
document.addEventListener('click', function (event) {
  var closeButton = event.target.closest('[data-action="close-tab"]');

  if (closeButton) {
    closeTabPane(closeButton.getAttribute('data-pane'));
  }
});
```


### Safe Dynamic Content and Delegated Events

**Problem**  
Menus, chooser links, and injected indicator cards currently depend on `innerHTML` strings and per-node event binding. That creates XSS risk, repeated rebinding work, and brittle coupling between markup shape and behavior.

**Suggestion**  
Create nodes with DOM APIs or `textContent`, store behavior data in `data-*` attributes, and attach one delegated listener for each interaction family.

**Example**

```js
function buildIndicatorButton(indicator) {
  var button = document.createElement('button');

  button.type = 'button';
  button.className = 'btn btn-link text-left p-0';
  button.textContent = indicator.IndicatorName;
  button.dataset.indicatorId = indicator.IndicatorID;

  return button;
}

document.addEventListener('click', function (event) {
  var selection = event.target.closest('[data-selection-type]');
  if (selection) {
    handleSelection(
      selection.getAttribute('data-selection-type'),
      selection.getAttribute('data-selection-value')
    );
    return;
  }

  var indicator = event.target.closest('[data-indicator-id]');
  if (indicator) {
    selectIndicator(Number(indicator.getAttribute('data-indicator-id')));
  }
});
```


## Code Quality and Maintenance

These changes are smaller, but they remove recurring maintenance traps and make future edits cheaper. They favor simple helpers, clearer intent, and fewer hard-coded assumptions.


### Replace Hard-Coded Pivot Columns with Derived Lists

**Problem**  
Hard-coded column matches in the table pipeline are brittle. A label change or new measure name can break the table layout even though the data is otherwise valid.

**Suggestion**  
Derive display columns from the current measure metadata instead of maintaining a long static list of expected names.

**Example**

```js
function getMeasureColumns(measures) {
  return measures.map(function (measure) {
    return measure.DisplayName;
  });
}

var orderedColumns = ['TimePeriod', 'GeoTypeDesc', 'GeoID'].concat(getMeasureColumns(activeMeasures));

var filteredTable = aq.from(rows).relocate(orderedColumns);
```


### Prefer Small Helpers, Platform APIs, and Concise Intent-Focused Code

**Problem**  
Several paths repeat the same URL parsing, optional-property fallback, source deduplication, and clipboard logic. Large separator comments and repetitive conditionals add noise without adding clarity.

**Suggestion**  
Use small utility helpers, nullish defaults, `Set` for deduplication, and browser APIs such as the Clipboard API. Keep comments brief and reserve them for non-obvious logic.

**Example**

```js
function getNumberParam(params, key) {
  var value = params.get(key);
  return value == null || value === '' ? null : Number(value);
}

function uniqueSources(sources) {
  var list = Array.isArray(sources) ? sources : [sources];
  return Array.from(new Set(list));
}

function getIndicatorDetails(indicator) {
  var details = indicator || {};

  return {
    name: details.IndicatorName ?? '',
    shortName: details.IndicatorShortname ?? details.IndicatorName ?? ''
  };
}

async function copyCitation() {
  var citeText = document.getElementById('citeText').innerText;
  await navigator.clipboard.writeText(citeText);
}
```


### Make Load Failures Visible and Retryable

**Problem**  
Failed fetches currently fall back mostly to console logging. That leaves the user with partial UI state and no clear next step.

**Suggestion**  
Wrap load paths in explicit error handling, show a visible message near the explorer, and offer a retry action for recoverable failures.

**Example**

```js
function showExplorerError(message, retryFn) {
  var alert = document.createElement('div');

  alert.className = 'alert alert-danger';
  alert.role = 'alert';
  alert.textContent = message;

  if (retryFn) {
    var retry = document.createElement('button');

    retry.type = 'button';
    retry.className = 'btn btn-sm btn-outline-danger ml-2';
    retry.textContent = 'Retry';
    retry.addEventListener('click', retryFn);

    alert.appendChild(retry);
  }

  document.querySelector('.de-wrapper').prepend(alert);
}

async function loadData(indicatorId) {
  try {
    return await fetchJSONCached(data_repo + data_branch + '/indicators/data/' + indicatorId + '.json');
  } catch (error) {
    showExplorerError('Failed to load indicator data.', function () {
      loadData(indicatorId);
    });

    throw error;
  }
}
```