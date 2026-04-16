// ======================================================================= //
// app.js
// ======================================================================= //

// console.log(">> app.js");

// ----------------------------------------------------------------------- //
// URL object (shared across files)
// ----------------------------------------------------------------------- //

const url = new URL(window.location);


// ----------------------------------------------------------------------- //
// write current globals to URL and push history
// ----------------------------------------------------------------------- //

// call this after any dropdown change to sync the URL

const pushSelectionToURL = () => {

    const url = new URL(window.location);

    // always write the current globals

    url.searchParams.set('id', IndicatorID);

    if (MeasureID)    url.searchParams.set('MeasureID', MeasureID);
    if (GeoTypeID)    url.searchParams.set('GeoTypeID', GeoTypeID);
    if (TimePeriodID) url.searchParams.set('TimePeriodID', TimePeriodID);
    if (overlay)      url.searchParams.set('overlay', overlay);

    window.history.pushState(
        { id: IndicatorID, MeasureID, GeoTypeID, TimePeriodID, overlay },
        '',
        url
    );

    console.log("pushState →", url.search);
};


// ----------------------------------------------------------------------- //
// render the active tab with current globals
// ----------------------------------------------------------------------- //

const renderCurrentView = () => {

    console.log("* renderCurrentView", { MeasureID, GeoTypeID, TimePeriodID, overlay });

    switch (overlay) {

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
    const urlGeoTypeID    = params.get('GeoTypeID')   ? params.get('GeoTypeID')               : null;
    const urlTimePeriodID = params.get('TimePeriodID') ? parseFloat(params.get('TimePeriodID')) : null;
    const urlOverlay      = params.get('overlay')     || null;

    // restore overlay

    if (urlOverlay) overlay = urlOverlay;

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
    if (urlGeoTypeID)    GeoTypeID    = urlGeoTypeID;
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
        '#v-pills-bar-tab':       'map',
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

    loadIndicator(IndicatorID);

    // record google analytics event

    gtag('event', 'click_indicator', {
       IndicatorID: IndicatorID
    });

});
