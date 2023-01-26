// ======================================================================= //
// global.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

let selectedSummaryYears = [];
let selectedSummaryGeography = [];
let aboutMeasures;
let dataSources;

let measureAbout = `N/A`;
let measureSources = `N/A`;
let geoTable;
let unreliabilityNotes;
let aqData;
let joinedAqData;

let fullDataTableObjects;
let fullDataMapObjects;
let fullDataTrendObjects;
let fullDataLinksObjects;
let joinedDataLinksObjects;
let disparitiyData; // used by disparities.js

let indicator;
let indicatorName;
let indicatorDesc;
let indicatorShortName;
let indicatorMeasures;
let indicatorId;
let primaryIndicatorName;
let secondaryIndicatorName;

let indicatorComparisonId;
let comparisons;
let comparisonsMetadata;
let aqComparisonsMetadata;
let aqComparisonsIndicatorsMetadata;
let aqComparisonsIndicatorData;

let defaultTrendMetadata = [];
let defaultTrendAbout;
let defaultTrendSources;
let defaultMapMetadata = [];
let defaultMapAbout;
let defaultMapSources;
let defaultLinksMetadata = [];
let defaultLinkMeasureTimes = [];
let defaultLinksAbout;
let defaultLinksSources;

let selectedMapMeasure;
let selectedTrendMeasure;
let selectedLinksMeasure;
let selectedComparison;
let selectedMapAbout;
let selectedMapSources;
let selectedTrendAbout;
let selectedTrendSources;
let selectedComparisonAbout = "";
let selectedComparisonSources = "";
let selectedLinksAbout;
let selectedLinksSources;
let selectedlinksSecondaryMeasureTime;

let primaryMeasureMetadata;
let secondaryMeasureMetadata;

let filteredMapData;
let filteredTrendData;
let filteredComparisonsData;
let filteredComparisonsMetadata;

let mapMeasures = [];
let trendMeasures = [];
let linksMeasures = [];

let tabTable;
let tabMap;
let tabTrend;
let tabLinks;

let showTable;
let showMap;
let showTrend;
let showLinks;

// store hash, so display knows where it just was
let currentHash;
let state;

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary

// get trend dropdown element; disparities button will be removed or appended
let tabTrendDropDown = document.querySelector('#tab-trend .dropdown');

// get disparities button dom element, so it can be removed and appended as needed
// let btnShowDisparities = document.querySelector('.btn-show-disparities');

// get comparisons button dom element, so it can be removed and appended as needed
let btnShowComparisons = document.querySelector('.btn-comparisons');

const url = new URL(window.location);

// hash change event, for firing on hash switch in renderMeasures

let hashchange = new Event('hashchange');

// ----------------------------------------------------------------------- //
// geo ranks
// ----------------------------------------------------------------------- //

// define georank function at top scope, so we can use it later

const assignGeoRank = (GeoType) => {
    switch (GeoType) {
        case 'Citywide':
            return 0;
        case 'Borough':
            return 1;
        case 'NYCKIDS2017':
            return 2;
        case 'NYCKIDS2019':
            return 2;
        case 'UHF34':
            return 3;
        case 'UHF42':
            return 4;
        case 'Subboro':
            return 5;
        case 'CD':
            return 6;
        case 'CDTA2020':
            return 6;
        case 'NTA2010':
            return 7;
        case 'NTA2020':
            return 7;
    }
}

// array of (pretty) geotypes in georank order

const geoTypes = [
    "Citywide",
    "Borough",
    "NYCKIDS",
    "UHF34",
    "UHF42",
    "Subboro",
    "CD",
    "CDTA",
    "NTA"
]

// ----------------------------------------------------------------------- //
// pretty generic geotypes
// ----------------------------------------------------------------------- //

// this allows us to have different versions of the same geotype on the back-end,
//  while keeping them generic on the front-end. We use this function to convert
//  versioned geotypes in the data into generic geotypes.

const prettifyGeoType = (GeoType) => {
    
    switch (GeoType) {
        
        case 'NYCKIDS2017':
        return 'NYCKIDS';
        
        case 'NYCKIDS2019':
        return 'NYCKIDS';
        
        case 'CDTA2020':
        return 'CDTA';
        
        case 'NTA2010':
        return 'NTA';
        
        case 'NTA2020':
        return 'NTA';
        
        default:
        return GeoType;
        
    }
}

// ----------------------------------------------------------------------- //
// measure info functions
// ----------------------------------------------------------------------- //

// Renders the Indicator Title and Description

const renderTitleDescription = (title, desc) => {

    // console.log("** renderTitleDescription");
    
    const indicatorTitle = document.getElementById('indicatorTitle');
    const indicatorDescription = document.querySelector('.indicator-description');
    indicatorTitle.innerHTML = title;
    indicatorDescription.innerHTML = `${desc}`;
}

// Renders copy for the About the measures and the Data sources sections

const renderAboutSources = (about, sources) => {

    aboutMeasures.innerHTML = about;
    dataSources.innerHTML = sources;
}

// ----------------------------------------------------------------------- //
// chart resize
// ----------------------------------------------------------------------- //

const updateChartPlotSize = () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 200)
    
}