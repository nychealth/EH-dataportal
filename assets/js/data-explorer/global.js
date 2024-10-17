// ======================================================================= //
// global.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

let globalID;

let selectedTableTimes = [];
let selectedTableGeography = [];
let aboutMeasures;
let dataSources;

let measureAbout = ``;
let measureSources = ``;
let geoTable;
let timeTable;
let unreliabilityNotes;
let aqIndicatorData;
let joinedAqData;
let aqMeasureIdTimes;

let tableData;
let mapData;
let trendData;
let linksData;
let joinedLinksDataObjects;
let disparityData; // used by disparities.js

let indicator;
let indicatorName;
let indicatorDesc;
let indicatorLabel;
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

let defaultTrendMetadata;
let aqDefaultTrendMetadata;
let defaultTrendAbout;
let defaultTrendSources = [];
let defaultMapMetadata;
let defaultMapAbout;
let defaultMapSources;
let defaultPrimaryLinksMeasureMetadata;
let defaultSecondaryMeasureMetadata;
let defaultDisparitiesMetadata;
let defaultLinksAbout;
let defaultLinksSources = [];

let selectedMapMeasure;
let selectedMapTime;
let selectedMapGeo;
let selectedTrendMeasure;
let selectedLinksMeasure;
let selectedComparison;
let showingNormalTrend;
let showingComparisonsTrend;

let selectedMapAbout;
let selectedMapSources;
let selectedMapMetadata;

let selectedTrendAbout;
let selectedTrendSources;
let aqSelectedTrendMetadata;

let selectedComparisonAbout = "";
let selectedComparisonSources = [];
let selectedComparisonMetadata;

let selectedLinksAbout;
let selectedLinksSources = [];
let selectedPrimaryMeasureMetadata;
let selectedSecondaryMeasureMetadata;

let filteredMapData;
let filteredTrendData;
let aqFilteredTrendData;
let aqFilteredComparisonsData;
let aqFilteredComparisonsMetadata;
let aqCombinedComparisonsMetadata;

let aqMeasureDisplay;
let aqTableTimesGeos;
let aqMapTimesGeos;
let aqTrendTimesGeos;

let mapMeasures = [];
let trendMeasures = [];
let linksMeasures = [];
let disparitiesMeasures = [];

let tabTable;
let tabMap;
let tabTrend;
let tabLinks;

let showTable;
let showMap;
let showTrend;
let showNormalTrend;
let showTrendComparisons;
let showLinks;

var CSVforDownload; 
var downloadedIndicator;
var downloadedIndicatorMeasurement;

// variables for print specs
var printSpec = {};
var vizYear;
var vizSource;
var vizSourceSecond;
var chartType;

// store hash, so display knows where it just was
let currentHash;
let state;

const btnToggleDisparities = document.querySelector('.btn-toggle-disparities');

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary

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
        case 'NYCKIDS2021':
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
            return 7;
        case 'NTA2010':
            return 8;
        case 'NTA2020':
            return 9;
        case 'NYHarbor':
            return 10;
        case 'RMZ':
            return 11;
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
    "NTA",
    "NYHarbor",
    "RMZ"
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
        
        case 'NYCKIDS2021':
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

    const indicatorTitle = document.getElementById('indicatorTitle');
    const indicatorDescription = document.querySelector('.indicator-description');
    indicatorTitle.innerHTML = title;
    indicatorDescription.innerHTML = `${desc}`;
}

// Renders copy for the About the measures and the Data sources sections

const renderAboutSources = (about, sources) => {

    console.log("**** renderAboutSources");
    dataSources.innerHTML = ''

    // de-dupe data sources
    let type = typeof sources

    if (type === 'object') {
        var singleSource;
        singleSource = sources.every( (val, i, arr) => val === arr[0] )  
        singleSource === true ? dataSources.innerHTML = sources[0] : dataSources.innerHTML = sources
    } else {
        dataSources.innerHTML = sources
    }

    aboutMeasures.innerHTML = about;
    
}

// ----------------------------------------------------------------------- //
// chart resize
// ----------------------------------------------------------------------- //

const updateChartPlotSize = () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 200)
    
}