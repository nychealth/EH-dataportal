// ======================================================================= //
// global.js
// ======================================================================= //

// console.log(">> global.js");

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
let comparisonMetadata;
let aqComparisonMetadata;
let aqComparisonIndicatorsMetadata;
let aqComparisonIndicatorData;

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
let showingBoroughTrend;
let showingComparisonTrend;

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
let aqFilteredComparisonData;
let aqFilteredComparisonMetadata;
let aqCombinedComparisonMetadata;

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
let showBoroughTrend;
let showComparisonTrend;
let showLinks;

let CSVforDownload; 
let downloadedIndicator;
let downloadedIndicatorMeasurement;

// variables for print specs
let printSpec = {};
let vizYear;
let vizGeography;
let vizSource;
let vizSourceSecond;
let chartType;

// store hash, so display knows where it just was
let currentHash;
let state;

// const btnToggleDisparities = document.querySelector('.btn-toggle-disparities');

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary

const url = new URL(window.location);

// hash change event, for firing on hash switch in renderMeasures

let hashchange = new Event('hashchange');


// ----------------------------------------------------------------------- //
// measure info functions
// ----------------------------------------------------------------------- //

// Renders the Indicator Title and Description

// const renderTitleDescription = (title, desc) => {

//     const indicatorTitle = document.getElementById('indicatorTitle');
//     const indicatorDescription = document.querySelectorAll('.indicator-description');
//     indicatorTitle.innerHTML = title;

//     indicatorDescription.forEach((element) => {
//         element.innerHTML = `${desc}`;
//     });    
// }

// Renders copy for the About the measures and the Data sources sections

// const renderAboutSources = (about, sources) => {

//     console.log("**** renderAboutSources");
//     dataSources.innerHTML = ''

//     // de-dupe data sources
//     let type = typeof sources

//     if (type === 'object') {
//         let singleSource;
//         singleSource = sources.every( (val, i, arr) => val === arr[0] )  
//         singleSource === true ? dataSources.innerHTML = sources[0] : dataSources.innerHTML = sources
//     } else {
//         dataSources.innerHTML = sources
//     }

//     aboutMeasures.innerHTML = about;
    
// }
