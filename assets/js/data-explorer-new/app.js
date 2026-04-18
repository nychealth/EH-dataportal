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

    params.set('id', IndicatorID);

    if (MeasureID)    params.set('MeasureID', MeasureID);
    if (GeoType)      params.set('GeoType', GeoType);
    if (TimePeriodID) params.set('TimePeriodID', TimePeriodID);
    if (overlay)      params.set('overlay', overlay);

    return params;

};


// Resets sub-selections before loading a different indicator.
const resetSelectionForNewIndicator = (nextIndicatorID) => {

    // drop sub-selections so the new indicator starts with a clean slate
    MeasureID = null;
    GeoType = null;
    TimePeriodID = null;
    // overlay is intentionally preserved across indicator selection

    const nextURL = new URL(window.location);
    nextURL.search = new URLSearchParams({ id: Number(nextIndicatorID) }).toString();

    window.history.replaceState(
        { id: Number(nextIndicatorID) },
        '',
        nextURL
    );

    console.log("replaceState →", nextURL.search);

};

// Pushes the current explorer state into the URL and history stack.
const pushSelectionToURL = () => {

    const url = new URL(window.location);

    // Rebuild the explorer params in a stable order and drop legacy aliases.

    url.search = buildCanonicalSearchParams().toString();

    window.history.pushState(
        { id: IndicatorID, MeasureID, GeoType, TimePeriodID, overlay },
        '',
        url
    );

    console.log("pushState →", url.search);
};


// ----------------------------------------------------------------------- //
// rewrite legacy URL aliases to canonical params
// ----------------------------------------------------------------------- //

// Renames legacy GeoTypeID params to the canonical GeoType param.
const normalizeLegacyGeoTypeURL = () => {

    const nextURL = new URL(window.location.href);
    const rawSearch = nextURL.search.replace(/^\?/, '');

    // Exit early when there is no query string to normalize.
    if (!rawSearch) {
        return;
    }

    // split into individual key=value pairs, dropping empty strings
    const searchParts = rawSearch.split('&').filter(Boolean);
    // true if a canonical GeoType param is already present
    const hasCanonicalGeoType = searchParts.some(part => part.split('=')[0] === 'GeoType');
    let didChange = false;
    let renamedGeoType = null;

    // Rewrite each key=value pair while preserving everything unrelated to GeoType.
    const normalizedParts = searchParts.flatMap(part => {
        const [key, ...rest] = part.split('=');
        const value = rest.join('=');

        // pass non-GeoTypeID params through unchanged
        if (key !== 'GeoTypeID') {
            return [part];
        }

        didChange = true;
        // capture the first GeoTypeID value for the history state
        renamedGeoType = renamedGeoType ?? decodeURIComponent(value || '');

        // if GeoType already exists, drop the duplicate GeoTypeID param
        if (hasCanonicalGeoType) {
            return [];
        }

        // otherwise rename GeoTypeID → GeoType
        return [`GeoType=${value}`];
    });

    if (!didChange) {
        return;
    }

    nextURL.search = normalizedParts.join('&');

    window.history.replaceState(
        { id: IndicatorID, MeasureID, GeoType: GeoType || renamedGeoType, TimePeriodID, overlay },
        '',
        nextURL
    );

    console.log("replaceState →", nextURL.search);

};


// Rewrites the legacy overlay=map value to the current overlay=bar alias.
const normalizeLegacyOverlayURL = () => {

    const nextURL = new URL(window.location.href);

    // 'map' was an old overlay value; 'bar' is its current equivalent
    if (nextURL.searchParams.get('overlay') !== 'map') {
        return;
    }

    nextURL.searchParams.set('overlay', 'bar');

    window.history.replaceState(
        { id: IndicatorID, MeasureID, GeoType, TimePeriodID, overlay: 'bar' },
        '',
        nextURL
    );

    console.log("replaceState →", nextURL.search);

};


// ----------------------------------------------------------------------- //
// render the active tab with current globals
// ----------------------------------------------------------------------- //

// updateMap controls whether the Leaflet map is re-rendered.
// Pass true from dropdown changes, initial load, and indicator changes.
// Tab clicks pass false (default) — the map doesn't need to redraw just because
// the overlay pane switches.

const renderCurrentView = (updateMap = false) => {

    console.log("* renderCurrentView", { MeasureID, GeoType, TimePeriodID, overlay, updateMap });

    if (updateMap) showMap();

    // route the current overlay value to the matching show* renderer
    switch (overlay) {

        case 'none': {
            // close all overlay panes without rendering a chart
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
            showBar();
            break;

        case 'table':
            showTable();
            break;

        case 'map':
            // 'map' is treated as an alias for 'bar' (bar chart with geo context)
            showBar();
            break;

        case 'trend':
            showTrend();
            break;

        case 'links':
            showLinks();
            break;

        default:
            // fall back to bar chart if overlay value is unrecognized
            showBar();
            break;
    }
};


// ----------------------------------------------------------------------- //
// popstate — browser back / forward
// ----------------------------------------------------------------------- //

// Restores explorer state when the user navigates browser history.
window.addEventListener('popstate', async (event) => {

    console.log("popstate →", window.location.search, window.location.hash);

    const params = new URLSearchParams(window.location.search);

    // parse each URL param, coercing numeric fields to floats
    const urlID           = params.get('id')          ? parseFloat(params.get('id'))          : null;
    const urlMeasureID    = params.get('MeasureID')   ? parseFloat(params.get('MeasureID'))   : null;
    const urlGeoType      = params.get('GeoType') || params.get('GeoTypeID') || null;
    const urlTimePeriodID = params.get('TimePeriodID') ? parseFloat(params.get('TimePeriodID')) : null;
    const urlOverlay      = params.get('overlay')     || null;

    if (params.get('GeoTypeID') && !params.get('GeoType')) {
        // rewrite GeoTypeID alias before reading it into globals
        normalizeLegacyGeoTypeURL();
    }

    if (urlOverlay === 'map') {
        normalizeLegacyOverlayURL();
    }

    // restore overlay

    if (urlOverlay) overlay = urlOverlay === 'map' ? 'bar' : urlOverlay;

    // indicator changed → full reload

    // Reload the full indicator pipeline when history points to a different indicator.
    if (urlID && urlID !== IndicatorID) {

        await loadIndicator(urlID, true);
        printIndicatorInfo(urlID);
        printMenus(urlID);
        await renderMeasures();
        renderCurrentView(true);
        return;
    }

    // sub-indicator params changed → update globals, sync menus, re-render

    if (urlMeasureID)    MeasureID    = urlMeasureID;
    if (urlGeoType)      GeoType      = urlGeoType;
    if (urlTimePeriodID) TimePeriodID = urlTimePeriodID;

    // sync the dropdown menus to match the restored globals

    const ind = indicators?.find(d => d.IndicatorID === Number(IndicatorID));

    if (ind) updateAllMenus(ind);

    renderCurrentView(true);
});


// ----------------------------------------------------------------------- //
// tab event listeners
// ----------------------------------------------------------------------- //

// Wires tab clicks and shared DOM references after the page shell exists.
document.addEventListener("DOMContentLoaded", () => {

    tabBar       = document.querySelector('#v-pills-bar-tab');
    tabTrends    = document.querySelector('#v-pills-trends-tab');
    tabCorrelate = document.querySelector('#v-pills-correlate-tab');
    tabTable     = document.querySelector('#v-pills-table-tab');

    // grab DOM nodes for the measure-info and source sections
    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');
    btnToggleDisparities = document.querySelector('.btn-toggle-disparities');

    // tab clicks → set overlay, push URL, render

    // maps each tab selector to its overlay string value
    const tabMap = {
        '#v-pills-bar-tab':       'bar',
        '#v-pills-trends-tab':    'trend',
        '#v-pills-correlate-tab': 'links',
        '#v-pills-table-tab':     'table'
    };

    // Bind each Bootstrap tab to the overlay value it should activate.
    Object.entries(tabMap).forEach(([selector, value]) => {

        const el = document.querySelector(selector);
        if (!el) return;

        el.addEventListener('click', () => {

            overlay = value;
            pushSelectionToURL();
            renderCurrentView();

            gtag('event', 'click_tab', { tab: value });
        });
    });

});

// ----------------------------------------------------------------------- //
// content truncation
// ----------------------------------------------------------------------- //

// Expands the full metadata description after the user clicks Show more.
function reveal() {
    // toggle the truncated / full description blocks
    document.getElementById('truncate').classList.toggle('hide');
    document.getElementById('full').classList.toggle('show');
    document.getElementById('contenttoggle').innerHTML = `Show less... <i class="fas fa-caret-square-up" aria-hidden="true"></i>`;
}


// ----------------------------------------------------------------------- //
// add listeners to metadata buttons
// ----------------------------------------------------------------------- //

$('#howCalcButton').on('click', e => {
    gtag('event', 'click_how_calculated');
});

$('#citeButton').on('click', e => {
    gtag('event', 'click_citation');
});

$('#v-pills-ds-tab').on('click', e => {
    gtag('event', 'click_about');
});


// ----------------------------------------------------------------------- //
// add event listener to indicator links
// ----------------------------------------------------------------------- //

// Handles clicks on the indicator list and starts the indicator reload pipeline.
$('#indicatorButtons').on('click', e => {

    let IndicatorID = e.target.dataset.IndicatorID;

    // run the indicator loading function

    resetSelectionForNewIndicator(IndicatorID);
    loadIndicator(IndicatorID);

    // record google analytics event

    gtag('event', 'click_indicator', {
       IndicatorID: IndicatorID
    });

});
