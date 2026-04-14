// ======================================================================= //
// app.js
// ======================================================================= //

// console.log(">> app.js");

// ----------------------------------------------------------------------- //
// history traversal
// ----------------------------------------------------------------------- //

const url = new URL(window.location);

// hash change event, for firing on hash switch in renderMeasures

let hashchange = new Event('hashchange');


// ----------------------------------------------------------------------- //
// history traversal
// ----------------------------------------------------------------------- //

// clicking on the indicator dropdown calls loadIndicator with that IndicatorID

// call loadindicator when traversing through the history

window.onpopstate = function (event) {

    const new_url = new URL(window.location);
    let new_IndicatorID = parseFloat(new_url.searchParams.get('id'));

    if (new_IndicatorID != IndicatorID) {

       loadIndicator(new_IndicatorID, true)

    }
};


// ----------------------------------------------------------------------- //
// search params listener
// ----------------------------------------------------------------------- //

function handleSearchParams() {

    const params = new URLSearchParams(window.location.search);

    console.log("Processing search parameters:", params.toString());



    // TEST GLOBAL VARIABLES HERE, AND CALL DIFFERENT THINGS DEPENDING ON WHAT'S CHANGED
    // COMPARE NEW PARAMS TO CURRENT GLOBAL VARIABLE VALUES

    // global vars defined in global.js

    IndicatorID;
    MeasureID;
    GeoTypeID;
    TimePeriodID;
    overlay; 


    // Perform API calls or DOM updates here

}

// handle multiple quick changes

function debounce(func, delay) {

    let timeoutId;

    return (...args) => {

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {

            func.apply(this, args);

        }, delay);

    };

}

// Wrap the handler in the debounce function

const debouncedHandler = debounce(handleSearchParams, 300);

// Use debouncedHandler instead of handleSearchParams in your listeners

window.addEventListener('popstate', debouncedHandler);

// Override history handlers with custom wrappers

const originalPushState = history.pushState;

history.pushState = function(...args) {

    originalPushState.apply(this, args);
    debouncedHandler();

};

const originalReplaceState = history.replaceState;

history.replaceState = function(...args) {

    originalReplaceState.apply(this, args);
    debouncedHandler();

};


// ----------------------------------------------------------------------- //
// history traversal
// ----------------------------------------------------------------------- //

window.addEventListener("hashchange", () => {

    console.log("hashchange: ", location.hash);

    const hash = window.location.hash.replace('#', "");

    switch (hash) {

       // using fallthrough

       case 'display=summary':
       case 'tab-table':
          currentHash = 'display=summary';
          $('#tab-btn-table').tab('show');
          showTable();
          break;

       case 'display=map':
       case 'tab-map':
          currentHash = 'display=map';
          $('#tab-btn-map').tab('show');
          showMap();
          break;

       case 'display=trend':
       case 'tab-trend':
          currentHash = 'display=trend';
          $('#tab-btn-trend').tab('show');
          showTrend();
          break;

       case 'display=links':
       case 'tab-links':
          currentHash = 'display=links';
          $('#tab-btn-links').tab('show');
          showLinks();
          break;

       default:
          currentHash = 'display=summary';
          break;
    }

    state = window.history.state;


});

// ----------------------------------------------------------------------- //
// tab event listeners
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", () => {

    tabTable = document.querySelector('#tab-btn-table');
    tabMap = document.querySelector('#tab-btn-map');
    tabTrend = document.querySelector('#tab-btn-trend');
    tabLinks = document.querySelector('#tab-btn-links');

    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');

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
// add listeners to tabs
// ----------------------------------------------------------------------- //

// ===== table ===== /

$('#tab-btn-table').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=summary';
    gtag('event', 'click_tab', {
       tab: "table"
    });
});

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map';
    gtag('event', 'click_tab', {
       tab: "map"
    });
});

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend';
    gtag('event', 'click_tab', {
       tab: "trend"
    });
});

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links';
    gtag('event', 'click_tab', {
       tab: "links"
    });
});


// ----------------------------------------------------------------------- //
// add listeners to metadata buttons
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// how calculated
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

$('#howCalcButton').on('click', e => {
    // console.log("click_how_caclulated");
    gtag('event', 'click_how_caclulated');
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// how calculated
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

$('#citeButton').on('click', e => {
    // console.log("click_citation");
    gtag('event', 'click_citation');
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// measure about
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

$('#tab-btn-02-b').on('click', e => {
    // console.log("click_about");
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
