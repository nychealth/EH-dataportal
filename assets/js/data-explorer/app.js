// ======================================================================= //
// app.js
// ======================================================================= //

// URL management, view rendering, tab listeners, and popstate handler

// console.log(">> app.js");

// ----------------------------------------------------------------------- //
// write current globals to URL and push history
// ----------------------------------------------------------------------- //

// call this after any dropdown change to sync the URL
const buildCanonicalSearchParams = () => {

    const params = new URLSearchParams();

    if (DE.state.IndicatorID != null && !Number.isNaN(Number(DE.state.IndicatorID))) {
        params.set('id', DE.state.IndicatorID);
    }

    // Only persist sub-selections that currently exist, so defaults can repopulate the rest.
    if (DE.state.MeasureID) {
        params.set('MeasureID', DE.state.MeasureID);
    }

    if (DE.state.GeoType) {
        params.set('GeoType', DE.state.GeoType);
    }

    if (DE.state.TimePeriodID) {
        params.set('TimePeriodID', DE.state.TimePeriodID);
    }

    if (DE.state.overlay) {
        params.set('overlay', DE.state.overlay);
    }

    return params;

};


// ----------------------------------------------------------------------- //
// history state helpers
// ----------------------------------------------------------------------- //

// Centralizes history writes so replace/push state stay consistent.
const writeHistoryState = (historyMethod, nextState, nextURL) => {

    window.history[historyMethod](nextState, '', nextURL);
    debugLog(`${historyMethod} →`, nextURL.search);

};


// Resets sub-selections before loading a different indicator.
const resetSelectionForNewIndicator = (nextIndicatorID) => {

    // drop sub-selections so the new indicator starts with a clean slate
    DE.state.MeasureID = null;
    DE.state.GeoType = null;
    DE.state.TimePeriodID = null;

    // overlay is intentionally preserved across indicator selection

    const nextURL = new URL(window.location);
    nextURL.search = new URLSearchParams({ id: Number(nextIndicatorID) }).toString();

    writeHistoryState('replaceState', { id: Number(nextIndicatorID) }, nextURL);

};

// Pushes the current explorer state into the URL and history stack.
const pushSelectionToURL = () => {

    const url = new URL(window.location);

    // Rebuild the explorer params in a stable order and drop legacy aliases.
    url.search = buildCanonicalSearchParams().toString();

    writeHistoryState('pushState', {
        id: DE.state.IndicatorID,
        MeasureID: DE.state.MeasureID,
        GeoType: DE.state.GeoType,
        TimePeriodID: DE.state.TimePeriodID,
        overlay: DE.state.overlay
    }, url);
};


// ----------------------------------------------------------------------- //
// rewrite legacy URL aliases to canonical params
// ----------------------------------------------------------------------- //

// Renames legacy GeoTypeID params to the canonical GeoType param.
const normalizeLegacyGeoTypeURL = () => {

    // ----- parse query string, exit early if empty ----- //

    const nextURL = new URL(window.location.href);
    const rawSearch = nextURL.search.replace(/^\?/, '');

    if (!rawSearch) {
        return;
    }

    // ----- split into parts, detect canonical GeoType ----- //

    // split into individual key=value pairs, dropping empty strings
    const searchParts = rawSearch.split('&').filter(Boolean);
    // true if a canonical GeoType param is already present
    const hasCanonicalGeoType = searchParts.some(part => part.split('=')[0] === 'GeoType');
    let didChange = false;
    let renamedGeoType = null;

    // ----- rewrite GeoTypeID params to GeoType ----- //

    // Rewrite each key=value pair while preserving everything unrelated to GeoType.
    const normalizedParts = searchParts.flatMap(part => {
        const [key, ...rest] = part.split('=');
        const value = rest.join('=');

        // Leave unrelated params untouched so future query params survive this rewrite.
        // pass non-GeoTypeID params through unchanged
        if (key !== 'GeoTypeID') {
            return [part];
        }

        didChange = true;
        // capture the first GeoTypeID value for the history state
        renamedGeoType = renamedGeoType ?? decodeURIComponent(value || '');

        // - - - drop duplicate GeoTypeID when GeoType already exists - - - //

        if (hasCanonicalGeoType) {
            return [];
        }

        // - - - otherwise rename GeoTypeID to GeoType - - - //

        return [`GeoType=${value}`];
    });

    // ----- exit early if nothing changed ----- //

    if (!didChange) {
        return;
    }

    // ----- commit normalized URL ----- //

    nextURL.search = normalizedParts.join('&');

    writeHistoryState('replaceState', {
        id: DE.state.IndicatorID,
        MeasureID: DE.state.MeasureID,
        GeoType: DE.state.GeoType || renamedGeoType,
        TimePeriodID: DE.state.TimePeriodID,
        overlay: DE.state.overlay
    }, nextURL);

};


// Rewrites the legacy overlay=map value to the current overlay=bar alias.
const normalizeLegacyOverlayURL = () => {

    const nextURL = new URL(window.location.href);

    // 'map' was an old overlay value; 'bar' is its current equivalent
    if (nextURL.searchParams.get('overlay') !== 'map') {
        return;
    }

    nextURL.searchParams.set('overlay', 'bar');

    writeHistoryState('replaceState', {
        id: DE.state.IndicatorID,
        MeasureID: DE.state.MeasureID,
        GeoType: DE.state.GeoType,
        TimePeriodID: DE.state.TimePeriodID,
        overlay: 'bar'
    }, nextURL);

};

// Converts legacy hash-based display state into the canonical overlay query param.
const normalizeLegacyHashOverlayURL = () => {

    // ----- legacy hash-to-overlay lookup table ----- //

    // Keep the mapping aligned with the legacy explorer's hash vocabulary so old bookmarks and
    // server-side path rewrites land on the intended overlay without duplicating view logic.
    const legacyOverlayByHash = {
        '#display=summary': 'table',
        '#display=map': 'bar',
        '#display=trend': 'trend',
        '#display=links': 'links',
        '#tab-table': 'table',
        '#tab-map': 'bar',
        '#tab-trend': 'trend',
        '#tab-links': 'links'
    };

    // ----- resolve current hash, exit if unmapped ----- //

    const nextOverlay = legacyOverlayByHash[window.location.hash];

    if (!nextOverlay) {
        return;
    }

    const nextURL = new URL(window.location.href);
    let didChange = false;

    // ----- backfill missing overlay param ----- //

    // Respect a query-string overlay when it already exists. That value is the canonical state in
    // the new explorer, so the legacy hash should only backfill missing information.
    if (!nextURL.searchParams.has('overlay')) {
        nextURL.searchParams.set('overlay', nextOverlay);
        didChange = true;
    }

    // ----- strip legacy hash fragment ----- //

    // Remove the legacy fragment after conversion so later startup code reads one authoritative
    // representation instead of having query params and hash state compete with each other.
    if (nextURL.hash) {
        nextURL.hash = '';
        didChange = true;
    }

    // ----- commit if changed ----- //

    if (!didChange) {
        return;
    }

    // This is a normalization pass, not a user navigation event, so replaceState keeps history
    // clean while still making the URL canonical for refreshes and copied links.
    window.history.replaceState(window.history.state, '', nextURL);
    debugLog('replaceState →', nextURL.search);

};

normalizeLegacyHashOverlayURL();


// ----------------------------------------------------------------------- //
// render the active tab with current globals
// ----------------------------------------------------------------------- //

// updateMap controls whether the Leaflet map is re-rendered.
// Pass true from dropdown changes, initial load, and indicator changes.
// Tab clicks pass false (default) — the map doesn't need to redraw just because
// the overlay pane switches.

// Incremented on every scheduled table render so a stale deferred render can detect it has
// been superseded and skip itself instead of clobbering a newer one.
let pendingTableOverlayToken = 0;

// Runs renderer only when module has assigned active show* function.
const runOverlayRenderer = (renderer) => {

    if (typeof renderer !== 'function') {
        return false;
    }

    renderer();

    return true;

};

// Give the map one full paint before starting heavy table work.
const scheduleTableOverlayRender = (afterRender = Promise.resolve()) => {

    pendingTableOverlayToken += 1;
    const token = pendingTableOverlayToken;

    // Token-gate delayed work so stale map renders cannot reopen an old table state later.
    Promise.resolve(afterRender)
        .catch(() => null)
        .then(() => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    if (DE.state.overlay === 'table' && token === pendingTableOverlayToken) {
                        showTable();
                    }
                });
            });
        });

};

// Routes to the show* renderer for the current overlay after kicking off the optional map redraw promise.
const renderCurrentView = (updateMap = false) => {

    // ----- kick off map render promise ----- //

    debugLog("* renderCurrentView", {
        MeasureID: DE.state.MeasureID,
        GeoType: DE.state.GeoType,
        TimePeriodID: DE.state.TimePeriodID,
        overlay: DE.state.overlay,
        updateMap
    });

    // Normalize sync and async map work into one promise so overlay timing can treat both the same.
    const mapRenderPromise = updateMap ? Promise.resolve(showMap()) : Promise.resolve();

    // ----- dispatch on overlay via switch ----- //

    // route the current overlay value to the matching show* renderer
    switch (DE.state.overlay) {

        case 'none': {

            // - - - close all overlay panes - - - //

            document.querySelectorAll('.nav-link[data-toggle="pill"]').forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('#v-pills-tabContent .tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            const tabContent = document.querySelector('#v-pills-tabContent');
            if (tabContent) tabContent.style.display = 'none';
            break;
        }

        case 'bar':
            runOverlayRenderer(showBar);
            break;

        case 'table':
            // If the map also changed, let that redraw settle before starting heavy table work.
            if (updateMap) {
                scheduleTableOverlayRender(mapRenderPromise);
            } else {
                runOverlayRenderer(showTable);
            }
            break;

        case 'map':
            // 'map' is treated as an alias for 'bar' (bar chart with geo context)
            runOverlayRenderer(showBar);
            break;

        case 'trend':
            runOverlayRenderer(showTrend);
            break;

        case 'links':
            runOverlayRenderer(showLinks);
            break;

        default:
            // fall back to bar chart if overlay value is unrecognized
            runOverlayRenderer(showBar);
            break;
    }
};


// ----------------------------------------------------------------------- //
// popstate — browser back / forward
// ----------------------------------------------------------------------- //

// Restores explorer state when the user navigates browser history.
window.addEventListener('popstate', async (event) => {

    // ----- normalize incoming URL ----- //

    debugLog("popstate →", window.location.search, window.location.hash);

    normalizeLegacyHashOverlayURL();

    // ----- parse URL params ----- //

    const params = new URLSearchParams(window.location.search);

    // parse each URL param, coercing numeric fields to floats
    const urlID           = params.get('id')          ? parseFloat(params.get('id'))          : null;
    const urlMeasureID    = params.get('MeasureID')   ? parseFloat(params.get('MeasureID'))   : null;
    const urlGeoType      = params.get('GeoType') || params.get('GeoTypeID') || null;
    const urlTimePeriodID = params.get('TimePeriodID') ? parseFloat(params.get('TimePeriodID')) : null;
    const urlOverlay      = params.get('overlay')     || null;

    // ----- rewrite legacy param aliases ----- //

    if (params.get('GeoTypeID') && !params.get('GeoType')) {
        // rewrite GeoTypeID alias before reading it into globals
        normalizeLegacyGeoTypeURL();
    }

    if (urlOverlay === 'map') {
        normalizeLegacyOverlayURL();
    }

    // ----- restore overlay global ----- //

    if (urlOverlay) DE.state.overlay = urlOverlay === 'map' ? 'bar' : urlOverlay;

    // ----- reload full pipeline on indicator change ----- //

    // Reload the full indicator pipeline when history points to a different indicator.
    if (urlID && urlID !== DE.state.IndicatorID) {

        await loadIndicator(urlID, true);
        printIndicatorInfo(urlID);
        printMenus(urlID);
        await renderMeasures();
        renderCurrentView(true);
        return;
    }

    // ----- sync sub-indicator globals, rebuild menus ----- //

    if (urlMeasureID)    DE.state.MeasureID    = urlMeasureID;
    if (urlGeoType)      DE.state.GeoType      = urlGeoType;
    if (urlTimePeriodID) DE.state.TimePeriodID = urlTimePeriodID;

    // sync the dropdown menus to match the restored globals

    const ind = indicators?.find(d => d.IndicatorID === Number(DE.state.IndicatorID));

    // Rebuild dropdowns only when indicator metadata is already available in memory.
    if (ind) updateAllMenus(ind);

    // ----- re-render ----- //

    renderCurrentView(true);

});


// ----------------------------------------------------------------------- //
// tab event listeners
// ----------------------------------------------------------------------- //

// Wires tab clicks and shared DOM references after the page shell exists.
document.addEventListener("DOMContentLoaded", () => {

    // ----- resolve shared tab/content DOM refs ----- //

    tabBar       = document.querySelector('#v-pills-bar-tab');
    tabTrends    = document.querySelector('#v-pills-trends-tab');
    tabCorrelate = document.querySelector('#v-pills-correlate-tab');
    tabTable     = document.querySelector('#v-pills-table-tab');

    // grab DOM nodes for the measure-info and source sections
    aboutMeasures = document.querySelector('.indicator-measures') || document.getElementById('howCalculated');
    dataSources = document.querySelector('.indicator-sources') || document.getElementById('dataSources');
    correlatePillRow = document.querySelector('.de-correlate-pill-row');

    // ----- define tab-to-overlay map ----- //

    // maps each tab selector to its overlay string value
    const tabMap = {
        '#v-pills-bar-tab':       'bar',
        '#v-pills-trends-tab':    'trend',
        '#v-pills-correlate-tab': 'links',
        '#v-pills-table-tab':     'table'
    };

    // ----- bind tab click listeners ----- //

    // Bind each Bootstrap tab to the overlay value it should activate.
    Object.entries(tabMap).forEach(([selector, value]) => {

        const el = document.querySelector(selector);
        if (!el) return;

        el.addEventListener('click', () => {

            DE.state.overlay = value;
            pushSelectionToURL();
            // Tab switches reuse the current map state, so they do not request a map redraw.
            renderCurrentView();

            trackDataExplorerEvent('click_tab', { tab: value });
        });
    });

});

// ----------------------------------------------------------------------- //
// table view options
// ----------------------------------------------------------------------- //

// Toggle borough sub-grouping in the summary table. When off, areas are ungrouped
//  between boroughs so columns can be sorted freely (by value, alphabetically, etc.)
$("#groupByBoroughToggle").on("change", (e) => {

    DE.table.groupByBorough = e.target.checked;

    // Re-render now if the table already exists; otherwise defer to the lazy
    //  first-render path so we never build into a still-hidden pane.
    if (DE.table.tableData && $.fn.dataTable.isDataTable('#tableID')) {
        renderTable(DE.table.tableData);
    } else {
        DE.table.tableNeedsRender = true;
    }

});


// ----------------------------------------------------------------------- //
// add listeners to metadata buttons
// ----------------------------------------------------------------------- //

$('.de-copy-citation-button[data-citation-target]').on('click', e => {
    trackDataExplorerEvent('click_citation');
});

// The old explorer tracked "how calculated" separately, because it was its own button
// opening its own modal. The new explorer shows that text and the data sources in one
// pane behind this single tab click, so a second event here would double-count one
// action. Carry the coverage as a parameter instead.
$('#v-pills-ds-tab').on('click', e => {
    trackDataExplorerEvent('click_about', { section: 'how_calculated_and_sources' });
});


