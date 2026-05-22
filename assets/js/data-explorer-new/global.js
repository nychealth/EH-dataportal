// ======================================================================= //
// global.js
// ======================================================================= //

// top-scope shared state and utility functions available to all modules

// Shared explorer state, rendering globals, and small cross-module utilities

// console.log(">> global.js");

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// ----------------------------------------------------------------------- //
// shared explorer state
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
const copyCitation = (button = null) => {

    console.log("* copyCitation");

    const citationTargetId = button?.dataset.citationTarget || 'citeText';
    const citationTextElement = document.getElementById(citationTargetId);

    if (!citationTextElement) {
        return;
    }

    const citeText = citationTextElement.innerText;
    
    // Create temporary textarea
    const temp = document.createElement('textarea');
    temp.value = citeText;
    document.body.appendChild(temp);
    temp.select();
    temp.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(temp.value).then(() => {
        const feedbackButton = button || document.querySelector(`.de-copy-citation-button[data-citation-target="${citationTargetId}"]`);

        if (feedbackButton) {
            feedbackButton.innerHTML = `<i class="fas fa-copy mr-1" aria-hidden="true"></i>Copied!`;
        }
    });
    
    document.body.removeChild(temp); // clean up
}


const bindCitationCopyButton = () => {

    // The citation markup provides the text source so this helper can support
    // more than one citation block without hard-coding element ids.
    const citationButtons = document.querySelectorAll('.de-copy-citation-button[data-citation-target]');

    citationButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            copyCitation(event.currentTarget);
        });
    });

};


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCitationCopyButton);
} else {
    bindCitationCopyButton();
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

    // De-dupe repeated sources so multi-measure views do not print identical lines twice.
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

const GEO_FILE_BY_TYPE = {
    NTA2010: 'NTA_2010.topo.json',
    NTA2020: 'NTA_2020.topo.json',
    NYHarbor: 'ny_harbor.topo.json',
    CD: 'CD.topo.json',
    CDTA2020: 'CDTA_2020.topo.json',
    PUMA2010: 'PUMA2010.topo.json',
    PUMA2020: 'PUMA2020.topo.json',
    Subboro: 'PUMA_or_Subborough.topo.json',
    UHF42: 'UHF42.topo.json',
    UHF34: 'UHF34.topo.json',
    NYCKIDS2017: 'NYCKids_2017.topo.json',
    NYCKIDS2019: 'NYCKids_2019.topo.json',
    NYCKIDS2021: 'NYCKids_2021.topo.json',
    NYCKIDS2023: 'NYCKids_2023.topo.json',
    Borough: 'borough.topo.json',
    Citywide: 'citywide.topo.json',
    RMZ: 'RMZ.topo.json'
};

// Maps a backend GeoType value to the corresponding TopoJSON filename.
function getGeoFile(mapGeoType) {

    console.log("*** getGeoFile");

    // Return the matching geography file for the requested map geography.
    return GEO_FILE_BY_TYPE[mapGeoType];
}

// ----------------------------------------------------------------------- //
// geo helpers
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

// Shared-geo helpers keep links and disparities limited to measures that can join.
const getLinksMeasureGeos = (measure) => (measure?.AvailableGeoTypes || []).filter(g => !/Citywide|Borough/.test(g));

const getSharedLinksGeos = (primaryMeasure, secondaryMeasure) => {

    const primaryMeasureGeos = getLinksMeasureGeos(primaryMeasure);
    const secondaryMeasureGeos = getLinksMeasureGeos(secondaryMeasure);

    return secondaryMeasureGeos.filter(g => primaryMeasureGeos.includes(g));

}

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

// Resizer for chart print modal
window.addEventListener('load', () => {
  const printVis = document.getElementById('printVis');
  
  if (!printVis) {
    console.error('Element printVis not found');
    return;
  }
  
  let resizeTimeout;
  
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateChartPlotSize();
    }, 1000);
  });
  
  resizeObserver.observe(printVis);
});


// ----------------------------------------------------------------------- //
// Download data
// ----------------------------------------------------------------------- //

const downloadData = (
    // data,
    // chartType
) => {
   
        console.log('Downloading data')

        // else, for chart view downloads: 
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(CSVforDownload);
        let hiddenElement = document.createElement('a');

        // set view to send to file name
        let view;
        if (window.location.hash == '#display=trend') {
            view = 'trend'
        } else if (window.location.hash == '#display=map') {
            view = 'map'
        } else {
            view = 'links'
        }

        hiddenElement.href = csvData;
        hiddenElement.target = '_blank';
        hiddenElement.download = 'NYC EH Data Portal - '  + indicatorName + ` (${view} view)` + '.csv',
        hiddenElement.click();

        // trigger GA event
        gtag('event', 'file_download', {
            'file_name': hiddenElement.download,
            'file_extension': '.csv',
            'link_text': 'Download chart data'
        });

        e.stopPropagation();
}