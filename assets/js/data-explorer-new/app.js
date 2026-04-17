// ======================================================================= //
// app.js
// ======================================================================= //

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


const resetSelectionForNewIndicator = (nextIndicatorID) => {

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


const normalizeLegacyGeoTypeURL = () => {

    const nextURL = new URL(window.location.href);
    const rawSearch = nextURL.search.replace(/^\?/, '');

    if (!rawSearch) {
        return;
    }

    const searchParts = rawSearch.split('&').filter(Boolean);
    const hasCanonicalGeoType = searchParts.some(part => part.split('=')[0] === 'GeoType');
    let didChange = false;
    let renamedGeoType = null;

    const normalizedParts = searchParts.flatMap(part => {
        const [key, ...rest] = part.split('=');
        const value = rest.join('=');

        if (key !== 'GeoTypeID') {
            return [part];
        }

        didChange = true;
        renamedGeoType = renamedGeoType ?? decodeURIComponent(value || '');

        if (hasCanonicalGeoType) {
            return [];
        }

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


const normalizeLegacyOverlayURL = () => {

    const nextURL = new URL(window.location.href);

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

const renderCurrentView = () => {

    console.log("* renderCurrentView", { MeasureID, GeoType, TimePeriodID, overlay });

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
            if (typeof showMap === 'function') showMap();
            break;

        case 'table':
            if (typeof showTable === 'function') showTable();
            break;

        case 'map':
            if (typeof showMap === 'function') showMap();
            break;

        case 'trend':
            if (typeof showTrend === 'function') showTrend();
            break;

        case 'links':
            if (typeof showLinks === 'function') showLinks();
            break;

        default:
            if (typeof showMap === 'function') showMap();
            break;
    }
};


// ----------------------------------------------------------------------- //
// popstate — browser back / forward
// ----------------------------------------------------------------------- //

window.addEventListener('popstate', async (event) => {

    console.log("popstate →", window.location.search, window.location.hash);

    const params = new URLSearchParams(window.location.search);

    const urlID           = params.get('id')          ? parseFloat(params.get('id'))          : null;
    const urlMeasureID    = params.get('MeasureID')   ? parseFloat(params.get('MeasureID'))   : null;
    const urlGeoType      = params.get('GeoType') || params.get('GeoTypeID') || null;
    const urlTimePeriodID = params.get('TimePeriodID') ? parseFloat(params.get('TimePeriodID')) : null;
    const urlOverlay      = params.get('overlay')     || null;

    if (params.get('GeoTypeID') && !params.get('GeoType')) {
        normalizeLegacyGeoTypeURL();
    }

    if (urlOverlay === 'map') {
        normalizeLegacyOverlayURL();
    }

    // restore overlay

    if (urlOverlay) overlay = urlOverlay === 'map' ? 'bar' : urlOverlay;

    // indicator changed → full reload

    if (urlID && urlID !== IndicatorID) {

        await loadIndicator(urlID, true);
        printIndicatorInfo(urlID);
        printMenus(urlID);
        await renderMeasures();
        renderCurrentView();
        return;
    }

    // sub-indicator params changed → update globals, sync menus, re-render

    if (urlMeasureID)    MeasureID    = urlMeasureID;
    if (urlGeoType)      GeoType      = urlGeoType;
    if (urlTimePeriodID) TimePeriodID = urlTimePeriodID;

    // sync the dropdown menus to match the restored globals

    const ind = indicators?.find(d => d.IndicatorID === Number(IndicatorID));

    if (ind) updateAllMenus(ind);

    renderCurrentView();
});




// ----------------------------------------------------------------------- //
// tab event listeners
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", () => {

    tabBar       = document.querySelector('#v-pills-bar-tab');
    tabTrends    = document.querySelector('#v-pills-trends-tab');
    tabCorrelate = document.querySelector('#v-pills-correlate-tab');
    tabTable     = document.querySelector('#v-pills-table-tab');

    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');
    btnToggleDisparities = document.querySelector('.btn-toggle-disparities');

    // tab clicks → set overlay, push URL, render

    const tabMap = {
        '#v-pills-bar-tab':       'bar',
        '#v-pills-trends-tab':    'trend',
        '#v-pills-correlate-tab': 'links',
        '#v-pills-table-tab':     'table'
    };

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

function reveal() {
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
