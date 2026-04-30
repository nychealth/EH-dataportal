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
let measureDataSourceLinks = [];
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
let defaultMapDataSourceLinks;
let defaultPrimaryLinksMeasureMetadata;
let defaultSecondaryMeasureMetadata;
let defaultDisparitiesMetadata;
let defaultLinksAbout;
let defaultLinksSources = [];
let defaultLinksDataSourceLinks = [];

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
let selectedMapDataSourceLinks;
let selectedMapMetadata;

let selectedTrendAbout;
let selectedTrendSources;
let selectedTrendDataSourceLinks;
let aqSelectedTrendMetadata;

let selectedComparisonAbout = "";
let selectedComparisonSources = [];
let selectedComparisonDataSourceLinks = [];
let selectedComparisonMetadata;

let selectedLinksAbout;
let selectedLinksSources = [];
let selectedLinksDataSourceLinks = [];
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
        case 'CDTA2020':
            return 7;
        case 'PUMA2010':
            return 8;
        case 'PUMA2020':
            return 8;
        case 'NTA2010':
            return 9;
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

const prettifyGeoType = (GeoType) => {

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
// measure info functions
// ----------------------------------------------------------------------- //

// Renders the Indicator Title and Description

const renderTitleDescription = (title, desc) => {

    const indicatorTitle = document.getElementById('indicatorTitle');
    const indicatorDescription = document.querySelectorAll('.indicator-description');
    indicatorTitle.innerHTML = title;

    indicatorDescription.forEach((element) => {
        element.innerHTML = `${desc}`;
    });    
}

// Maps known source names to their URLs for inline hyperlinking

const sourcesLinkMap = {
    'New York City Community Health Survey (CHS)': 'https://www.nyc.gov/site/doh/data/data-sets/community-health-survey-public-use-data.page',
    'Metropolitan Transportation Authority':        'https://www.mta.info/developers',
    'New York City Housing and Vacancy Survey (NYCHVS)': 'https://www.nyc.gov/site/hpd/about/research.page',
    'American Community Survey':                    'https://www.census.gov/programs-surveys/acs/data.html'
};

const linkifySource = (text, overrideMap = {}) => {
    if (!text) return text;
    const combined = { ...sourcesLinkMap, ...overrideMap };
    let result = text;
    for (const [name, url] of Object.entries(combined)) {
        if (result.includes(name)) {
            result = result.replace(name, `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`);
        }
    }
    return result;
};

// Renders copy for the About the measures and the Data sources sections

const renderAboutSources = (about, sources, dataSourceLinks = null) => {

    console.log("**** renderAboutSources");
    dataSources.innerHTML = ''

    // build override map from DataSourceLink entries: label is the source text to match
    const overrideMap = {};
    if (Array.isArray(dataSourceLinks)) {
        dataSourceLinks.forEach(({ label, url }) => { overrideMap[label] = url; });
    }

    // de-dupe data sources
    let type = typeof sources

    if (type === 'object') {
        let singleSource;
        singleSource = sources.every( (val, i, arr) => val === arr[0] )
        singleSource === true ? dataSources.innerHTML = linkifySource(sources[0], overrideMap) : dataSources.innerHTML = sources.map(s => linkifySource(s, overrideMap)).join(',')
    } else {
        dataSources.innerHTML = linkifySource(sources, overrideMap)
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