// ======================================================================= //
// global.js
// ======================================================================= //

// top-scope shared state and utility functions available to all modules

// console.log(">> global.js");

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// Summary-table filter state persists across redraws until a new indicator resets it.
let selectedTableTimes = [];
let selectedTableGeography = [];
let tableAreaSearchValue = '';
let tableTimeFilterIsManual = false;
let tableGeoFilterIsManual = false;
let tableNeedsRender = false;

// Shared content holders are resolved after the page shell exists.
let aboutMeasures;
let dataSources;

let measureAbout = ``;
let measureSources = ``;

// Lookup tables are rebuilt on each indicator load and reused by menus and renderers.
let geoTable;
let timeTable;
// keyed by TimePeriodID; rebuilt on each indicator load for fast label lookup
let timeLookup = {};
let unreliabilityNotes;
let aqIndicatorData;
let joinedAqData;
let aqMeasureIdTimes;

// These plain-object arrays feed the currently active visualizations.
let tableData;
let mapData;
let trendData;
let linksData;
// joined primary + secondary measure data for the correlate/links chart
let joinedLinksDataObjects;
let disparityData; // used by disparities.js

// Active indicator metadata is promoted to globals so every view can read it.
let indicator;
let indicatorName;
let indicatorDesc;
let indicatorLabel;
let indicatorShortName;
let indicatorMeasures;
let primaryIndicatorName;
let secondaryIndicatorName;

let indicatorComparisonId;
let comparisons;
let comparisonMetadata;
let aqComparisonMetadata;
let aqComparisonIndicatorsMetadata;
let aqComparisonIndicatorData;

// Per-view default metadata and about/source text are recomputed per indicator.
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
let selectedDisparity;
let selectedComparison;
let showingBoroughTrend;
let showingComparisonTrend;
let selectedTrendMeasureId;
let selectedComparisonId;
let selectedLinksPrimaryMeasureId;
let selectedLinksSecondaryMeasureId;
let selectedDisparityPrimaryMeasureId;

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

// Filtered slices let one renderer hand work to the next without refetching.
let filteredMapData;
let filteredTrendData;
let aqFilteredTrendData;
let aqFilteredComparisonData;
let aqFilteredComparisonMetadata;
let aqCombinedComparisonMetadata;

// Joined Arquero tables capture which measures, times, and geographies each view supports.
let aqMeasureDisplay;
let aqTableTimesGeos;
let aqMapTimesGeos;
let aqTrendTimesGeos;

// These arrays describe which measures are valid for each overlay tab.
let mapMeasures = [];
let trendMeasures = [];
let linksMeasures = [];
let disparitiesMeasures = [];

// Tab refs and render closures are assigned lazily once the current indicator is known.
let tabBar;
let tabTrends;
let tabCorrelate;
let tabTable;

let showTable;
let showBar;
let showMap;
let showTrend;
let showBoroughTrend;
let showComparisonTrend;
let showLinks;
let syncTrendSelectionsToMapSelection;
let syncLinksSelectionsToMapSelection;

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

let state;

let IndicatorID;
let MeasureID;
let GeoType;
let TimePeriodID;
// tracks the active overlay tab: 'bar', 'table', 'trend', 'links', or 'none'
let overlay; 

let btnToggleDisparities;

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary


// ----------------------------------------------------------------------- //
// copy citation
// ----------------------------------------------------------------------- //

// Copies the current citation text to the clipboard and updates button feedback.
const copyCitation = () => {

    console.log("* copyCitation");

    const citeText = document.getElementById('citeText').innerText;
    
    // Create temporary textarea
    const temp = document.createElement('textarea');
    temp.value = citeText;
    document.body.appendChild(temp);
    temp.select();
    temp.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(temp.value).then(() => {
        const btn = document.getElementById('citeButton');
        btn.innerHTML = `<i class="fas fa-copy mr-1" aria-hidden="true"></i>Copied!`;
    });
    
    document.body.removeChild(temp); // clean up
}


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

// Writes About and Sources content while de-duplicating repeated source text.
const renderAboutSources = (about, sources) => {

    console.log("**** renderAboutSources");

    // Some new-explorer templates use ids instead of the legacy class hooks.
    if (!aboutMeasures) {
        aboutMeasures = document.querySelector('.indicator-measures') || document.getElementById('howCalculated');
    }

    if (!dataSources) {
        dataSources = document.querySelector('.indicator-sources') || document.getElementById('dataSources');
    }

    if (!aboutMeasures || !dataSources) {
        return;
    }

    dataSources.innerHTML = '';

    // de-dupe data sources
    let type = typeof sources;

    // Collapse repeated source arrays to one string before printing.
    if (type === 'object') {
        let singleSource;
        singleSource = sources.every((val, i, arr) => val === arr[0]);
        singleSource === true ? dataSources.innerHTML = sources[0] : dataSources.innerHTML = sources;
    } else {
        dataSources.innerHTML = sources;
    }

    aboutMeasures.innerHTML = about;

};

// ======================================================================= //
// utilities.js
// ======================================================================= //

// shared geography helpers: geo file lookup, geo ranks, and geo type normalization

// console.log('>> utilities.js')

// ----------------------------------------------------------------------- //
// geo file
// ----------------------------------------------------------------------- //

// Maps a backend GeoType value to the corresponding TopoJSON filename.
function getGeoFile(mapGeoType) {

    console.log("*** getGeoFile");

    // Return the matching geography file for the requested map geography.
    if (mapGeoType === "NTA2010") {
        return 'NTA_2010.topo.json';

    } else if (mapGeoType === "NTA2020") {
        return 'NTA_2020.topo.json';

    } else if (mapGeoType === "NYHarbor") {
        return 'ny_harbor.topo.json';

    } else if (mapGeoType === "CD") {
        return 'CD.topo.json';

    } else if (mapGeoType === "CDTA2020") {
        return 'CDTA_2020.topo.json';

    } else if (mapGeoType === "PUMA2010") {
        return 'PUMA2010.topo.json';

    } else if (mapGeoType === "PUMA2020") {
        return 'PUMA2020.topo.json';

    } else if (mapGeoType === "Subboro") {
        return 'PUMA_or_Subborough.topo.json';

    } else if (mapGeoType === "UHF42") {
        return 'UHF42.topo.json';

    } else if (mapGeoType === "UHF34") {
        return 'UHF34.topo.json';

    } else if (mapGeoType === "NYCKIDS2017") {
        return 'NYCKids_2017.topo.json';

    } else if (mapGeoType === "NYCKIDS2019") {
        return 'NYCKids_2019.topo.json';

    } else if (mapGeoType === "NYCKIDS2021") {
        return 'NYCKids_2021.topo.json';

    } else if (mapGeoType === "NYCKIDS2023") {
        return 'NYCKids_2023.topo.json';

    } else if (mapGeoType === "Borough") {
        return 'borough.topo.json';

    } else if (mapGeoType === "RMZ") {
        return 'RMZ.topo.json';   
    }
}

// ----------------------------------------------------------------------- //
// geo ranks
// ----------------------------------------------------------------------- //

// define georank function at top scope, so we can use it later

// Assigns a sortable rank so geographies can be ordered from broad to fine.
const assignGeoRank = (GeoType) => {

    // Normalize multiple backend variants into one numeric sort order.
    switch (GeoType) {
        case 'Citywide':
            return 0;
        case 'Borough':
            return 1;
        case 'NYCKIDS':
        case 'NYCKIDS2017':
        case 'NYCKIDS2019':
        case 'NYCKIDS2021':
        case 'NYCKIDS2023':
            return 2;
        case 'UHF34':
            return 3;
        case 'UHF42':
            return 4;
        case 'Subboro':
            return 5;
        case 'CD':
            return 6;
        case 'CDTA':
        case 'CDTA2020':
            return 7;
        case 'PUMA':
        case 'PUMA2010':
        case 'PUMA2020':
            return 8;
        case 'NTA':
        case 'NTA2010':
        case 'NTA2020':
            return 10;
        case 'NYHarbor':
            return 11;
        case 'RMZ':
            return 12;
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
    "PUMA",
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

// Collapses versioned backend geotypes into the generic labels shown in the UI.
const prettifyGeoType = (GeoType) => {

    // Group backend-specific geography versions under one front-end label.
    switch (GeoType) {

        case 'NYCKIDS2017':
            return 'NYCKIDS';

        case 'NYCKIDS2019':
            return 'NYCKIDS';

        case 'NYCKIDS2021':
            return 'NYCKIDS';

        case 'NYCKIDS2023':
            return 'NYCKIDS';

        case 'CDTA2020':
            return 'CDTA';

        case 'NTA2010':
            return 'NTA';

        case 'NTA2020':
            return 'NTA';

        case 'PUMA2010':
            return 'PUMA';

        case 'PUMA2020':
            return 'PUMA';

        default:
            return GeoType;

    }
}

// ----------------------------------------------------------------------- //
// chart resize
// ----------------------------------------------------------------------- //

// Nudges Vega and DataTables layouts to recompute after tab or panel changes.
const updateChartPlotSize = () => {

    console.log("* updateChartPlotSize");

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 200)

}
