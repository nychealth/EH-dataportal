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
// read current selection from the URL
// ----------------------------------------------------------------------- //

// The read counterpart to buildCanonicalSearchParams(). Every entry point that
// boots or restores a view (initial load, back/forward) parses through this one
// function, so they cannot drift in how they coerce or alias params again.
const parseSelectionFromURL = () => {

    const params = new URLSearchParams(window.location.search);

    // parseFloat, not Number: it was already the convention for MeasureID and
    // TimePeriodID, and unifying on it only changes malformed input like
    // "2380abc", which was never a supported URL.
    const toNumber = (value) => (value ? parseFloat(value) : null);

    const rawOverlay = params.get('overlay');

    return {

        id:           toNumber(params.get('id')),
        MeasureID:    toNumber(params.get('MeasureID')),

        // GeoTypeID is the legacy alias. normalizeLegacyURL() rewrites it out of the
        // URL, but read it too so a hand-typed link still parses.
        GeoType:      params.get('GeoType') || params.get('GeoTypeID') || null,

        TimePeriodID: toNumber(params.get('TimePeriodID')),

        // 'map' is the legacy spelling of the bar overlay.
        overlay:      rawOverlay === 'map' ? 'bar' : (rawOverlay || null)

    };

};


// Copies a parsed selection onto the shared state, skipping absent fields so
// anything the URL omits is left for the defaults to fill in.
const applySelectionToState = (selection) => {

    if (selection.MeasureID)    DE.state.MeasureID    = selection.MeasureID;
    if (selection.GeoType)      DE.state.GeoType      = selection.GeoType;
    if (selection.TimePeriodID) DE.state.TimePeriodID = selection.TimePeriodID;
    if (selection.overlay)      DE.state.overlay      = selection.overlay;

};


// ----------------------------------------------------------------------- //
// history state helpers
// ----------------------------------------------------------------------- //

// Centralizes history writes so replace/push state stay consistent.
const writeHistoryState = (historyMethod, nextState, nextURL) => {

    window.history[historyMethod](nextState, '', nextURL);
    debugLog(`${historyMethod} →`, nextURL.search);

};


// Resets sub-selections so the indicator about to load starts from its own defaults.
// Writes no history — loadAndRenderIndicator owns that for the whole pipeline.
const resetSelectionForNewIndicator = () => {

    DE.state.MeasureID = null;
    DE.state.GeoType = null;
    DE.state.TimePeriodID = null;

    // overlay is intentionally preserved across indicator selection

};

// Writes the current explorer state into the URL, either as a new history entry
// or over the current one.
const writeSelectionToURL = (historyMethod = 'pushState') => {

    const url = new URL(window.location);

    // Rebuild the explorer params in a stable order and drop legacy aliases.
    url.search = buildCanonicalSearchParams().toString();

    writeHistoryState(historyMethod, {
        id: DE.state.IndicatorID,
        MeasureID: DE.state.MeasureID,
        GeoType: DE.state.GeoType,
        TimePeriodID: DE.state.TimePeriodID,
        overlay: DE.state.overlay
    }, url);
};

// Adds a history entry — what every user-initiated change (dropdown, tab, close) does.
const pushSelectionToURL = () => writeSelectionToURL('pushState');


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
    writeHistoryState('replaceState', window.history.state, nextURL);

};


// Rewrites every legacy URL form in one pass. Each normalizer self-guards and is a
// no-op on an already-canonical URL, so callers don't pre-check which form they have.
// Hash first: it can add an overlay param that the query-param passes then canonicalize.
const normalizeLegacyURL = () => {

    normalizeLegacyHashOverlayURL();
    normalizeLegacyGeoTypeURL();
    normalizeLegacyOverlayURL();

};

// Runs at parse time, before checkURL() boots the app from the template, so every
// later reader sees canonical params.
normalizeLegacyURL();


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
// the one indicator-load pipeline
// ----------------------------------------------------------------------- //

// Bumped on every indicator load so a superseded one can tell it lost the race.
// Without this, two loads started close together (a double-clicked indicator, a
// held-down back button) interleave their awaits and the slower one finishes last,
// writing its state over the newer one's — observed as a fetch of
// `geography/undefined` when a stale render resolves a GeoType the current
// indicator doesn't have.
let indicatorLoadToken = 0;

// The single path from "an indicator ID" to "a rendered view". Every entry point
// goes through here: initial load (checkURL), modal selection (selectIndicator),
// and back/forward (popstate). They differ only in the two options below.
//
//   selection — parsed URL selection to restore, or null to take the indicator's
//               own defaults.
//   history   — 'push'    a new entry (the user chose this view)
//               'replace' overwrite the current entry (initial load: the entry
//                         already exists, it just lacks the resolved defaults)
//               'none'    write nothing (popstate: the URL is already the entry
//                         being navigated to)
const loadAndRenderIndicator = async (id, { selection = null, history = 'push' } = {}) => {

    const indicatorID = Number(id);

    debugLog("* loadAndRenderIndicator:", indicatorID, { selection, history });

    indicatorLoadToken += 1;
    const token = indicatorLoadToken;

    // False once a newer load has started; a stale load then stops before it can
    // write shared state, the URL, or the DOM.
    const isCurrent = () => token === indicatorLoadToken;

    // ----- reset sub-selections, then layer the URL's back on top ----- //

    // Reset unconditionally: without it, a sub-selection belonging to the
    // previously viewed indicator leaks into one whose URL doesn't name it.
    resetSelectionForNewIndicator();

    if (selection) {
        applySelectionToState(selection);
    }

    // ----- paint what metadata alone can render ----- //

    // Neither waits on the data fetch, so both can start before it.
    renderIndicatorInfo(indicatorID);
    render311Links(indicatorID);

    // ----- load metadata, indicator, menus, and measures in sequence ----- //

    // Metadata first so timeLookup is populated before menus build.
    await ensureIndicatorsLoaded('loadAndRenderIndicator');
    if (!isCurrent()) return;

    await loadIndicator(indicatorID);
    if (!isCurrent()) return;

    await renderMenus(indicatorID);
    if (!isCurrent()) return;

    await renderMeasures();
    if (!isCurrent()) return;

    // ----- sync URL + render ----- //

    // Runs after renderMeasures so the URL carries the defaults it just resolved.
    if (history !== 'none') {
        writeSelectionToURL(history === 'replace' ? 'replaceState' : 'pushState');
    }

    renderCurrentView(true);

};


// ----------------------------------------------------------------------- //
// popstate — browser back / forward
// ----------------------------------------------------------------------- //

// Restores explorer state when the user navigates browser history.
window.addEventListener('popstate', async (event) => {

    // ----- normalize incoming URL, then read the canonical selection ----- //

    debugLog("popstate →", window.location.search, window.location.hash);

    normalizeLegacyURL();

    const selection = parseSelectionFromURL();

    // ----- reload full pipeline on indicator change ----- //

    // history: 'none' — this URL *is* the history entry being navigated to, so
    // writing it again would stack a duplicate on top of it.
    if (selection.id && selection.id !== DE.state.IndicatorID) {

        await loadAndRenderIndicator(selection.id, { selection, history: 'none' });
        return;
    }

    // ----- sync sub-indicator globals, rebuild menus ----- //

    applySelectionToState(selection);

    // sync the dropdown menus to match the restored globals

    const ind = getIndicatorById(DE.state.IndicatorID);

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


