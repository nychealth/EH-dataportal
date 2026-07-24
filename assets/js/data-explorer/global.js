// ======================================================================= //
// global.js
// ======================================================================= //

// Shared explorer state, rendering globals, and small cross-module utilities available to all modules

// console.log(">> global.js");

// ----------------------------------------------------------------------- //
// shared explorer state
// ----------------------------------------------------------------------- //

// Grouped namespace for shared explorer state. Each sub-object is introduced by the
// migration stage that converts its concern (see
// documents/data-explorer-state-namespace-design-2026-07-10.md). Render closures,
// tab refs, DOM element caches, and the static lookup constants below stay bare
// by design — they are module seams, not churning state.
const DE = {

    // Summary-table state: filter selections and manual-override flags persist across
    // redraws until a new indicator resets them; tableData holds the joined rows.
    table: {
        selectedTableTimes: [],
        selectedTableGeography: [],
        tableAreaSearchValue: '',
        tableTimeFilterIsManual: false,
        tableGeoFilterIsManual: false,
        tableNeedsRender: false,
        // sub-group smaller geo types by borough (Time > GeoType > Borough); toggleable in the UI
        groupByBorough: true,
        tableData: undefined
    },

    // Disparities-view state: the toggle flag, the primary measure the joined
    // poverty-comparison rows were built for, and the cached rows themselves.
    disparities: {
        selectedDisparity: undefined,
        selectedDisparityPrimaryMeasureId: undefined,
        defaultDisparitiesMetadata: undefined,
        disparityData: undefined
    },

    // Correlate/links-view state: manual selection flag + measure-pair IDs, the
    // joined scatter rows, per-pair metadata, and the About/Sources text blocks.
    links: {
        selectedLinksMeasure: undefined,
        selectedLinksPrimaryMeasureId: undefined,
        selectedLinksSecondaryMeasureId: undefined,
        selectedLinksAbout: undefined,
        selectedLinksSources: [],
        defaultLinksAbout: undefined,
        defaultLinksSources: [],
        defaultPrimaryLinksMeasureMetadata: undefined,
        defaultSecondaryMeasureMetadata: undefined,
        selectedPrimaryMeasureMetadata: undefined,
        selectedSecondaryMeasureMetadata: undefined,
        linksData: undefined,
        joinedLinksDataObjects: undefined
    },

    // Trend-view state: borough vs comparison mode flags, resolved metadata and
    // About/Sources text for the active mode, and the filtered chart data slices.
    trend: {
        selectedTrendMeasure: undefined,
        selectedTrendMeasureId: undefined,
        showingBoroughTrend: undefined,
        showingComparisonTrend: undefined,
        selectedTrendAbout: undefined,
        selectedTrendSources: undefined,
        aqSelectedTrendMetadata: undefined,
        defaultTrendMetadata: undefined,
        aqDefaultTrendMetadata: undefined,
        defaultTrendAbout: undefined,
        defaultTrendSources: [],
        trendData: undefined,
        filteredTrendData: undefined,
        aqFilteredTrendData: undefined,
        selectedComparison: undefined,
        selectedComparisonId: undefined,
        selectedComparisonAbout: "",
        selectedComparisonSources: [],
        selectedComparisonMetadata: undefined,
        aqFilteredComparisonData: undefined,
        aqFilteredComparisonMetadata: undefined
    },

    // Map-view state: the joined map rows, the filtered slice showMap hands to the
    // bar chart and print export, dropdown-selection flags, and measure metadata.
    map: {
        mapData: undefined,
        filteredMapData: undefined,
        selectedMapMeasure: undefined,
        selectedMapTime: undefined,
        selectedMapGeo: undefined,
        selectedMapMetadata: undefined,
        selectedMapAbout: undefined,
        selectedMapSources: undefined,
        defaultMapMetadata: undefined,
        defaultMapAbout: undefined,
        defaultMapSources: undefined,

        // One-shot flag: true only when loadIndicator() found no explicit/restored overlay to
        // respect, so renderMap()'s citywide-only branch may apply its trend-tab smart default.
        // Consumed (set false) the first time it fires so later re-renders triggered by
        // measure/geo/time changes don't repeatedly override the user's own tab choice.
        citywideTrendDefaultPending: false
    },

    // Print/export state: the current view's Vega spec, caption fields, and chart
    // type — set by each tab renderer, read back by print.js and downloadData().
    print: {
        printSpec: {},
        vizYear: undefined,
        vizGeography: undefined,
        vizSource: undefined,
        vizSourceSecond: undefined,
        chartType: undefined,
        CSVforDownload: undefined,
        downloadedIndicator: undefined,
        downloadedIndicatorMeasurement: undefined
    },

    // Per-indicator lookup tables, rebuilt on each indicator load: geo/time joins,
    // per-view times-geos tables, per-tab measure arrays, and the comparison-trend
    // metadata pipeline.
    lookups: {
        geoTable: undefined,
        timeTable: undefined,
        timeLookup: {},
        unreliabilityNotes: undefined,
        aqIndicatorData: undefined,
        joinedAqData: undefined,
        aqMeasureIdTimes: undefined,
        aqMeasureDisplay: undefined,
        aqTableTimesGeos: undefined,
        aqMapTimesGeos: undefined,
        aqTrendTimesGeos: undefined,
        mapMeasures: [],
        trendMeasures: [],
        linksMeasures: [],
        disparitiesMeasures: [],
        comparisons: undefined,
        indicatorComparisonId: undefined,
        comparisonMetadata: undefined,
        aqComparisonMetadata: undefined,
        aqComparisonIndicatorsMetadata: undefined,
        aqComparisonIndicatorData: undefined,
        aqCombinedComparisonMetadata: undefined
    },

    // Active-indicator metadata, promoted here by loadIndicator so every view can
    // read it. primary/secondary names serve the correlate About/Sources blocks.
    indicator: {
        indicator: undefined,
        indicatorName: undefined,
        indicatorDesc: undefined,
        indicatorLabel: undefined,
        indicatorShortName: undefined,
        indicatorMeasures: undefined,
        primaryIndicatorName: undefined,
        secondaryIndicatorName: undefined
    },

    // Core identity: which indicator/measure/geography/time is selected and which
    // overlay tab is open ('bar', 'table', 'trend', 'links', or 'none'). Read across
    // nearly every file and kept in sync with the URL by app.js.
    state: {
        IndicatorID: undefined,
        MeasureID: undefined,
        GeoType: undefined,
        TimePeriodID: undefined,
        overlay: undefined
    }

};

// Shared content holders are resolved after the page shell exists.
let aboutMeasures;
let dataSources;

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

// Compared against window.history.state in data.js to detect first-load vs. popstate
// navigation. Renamed from `state` so that bare name stays free for DE.state.
let historyState;

// DOM ref for the disparities-toggle button, resolved once the page shell exists.
let btnToggleDisparities;

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary


// ----------------------------------------------------------------------- //
// measure-rules constants
// ----------------------------------------------------------------------- //

// Backend MeasureIDs / ComparisonIDs that specific render branches key off of. These
// values live in the data (metadata.json / comparison records), not in code, so a data
// change can silently alter behavior here with no error. Centralized — with a note per
// entry — so the coupling is visible and greppable in one place instead of scattered as
// bare literals across measures.js and trend.js.
const DE_MEASURE_RULES = {

    // Poverty measure used as the fixed secondary (comparator) in every disparities view.
    disparitiesSecondaryMeasureId: 221,

    // Air-quality measures whose borough trend must be restricted to Annual-Average slices.
    trendAnnualAverageMeasureIds: [365, 370, 375, 391],

    // Air-quality measure(s) whose borough trend must be restricted to Summer slices.
    trendSummerMeasureIds: [386],

    // Quarterly comparison measures; their comparison trend is capped to the last 3 years.
    quarterlyComparisonMeasureIds: [858, 859, 860, 861, 862, 863],

    // Comparisons that drop the "by <group>" suffix from the trend subtitle.
    trendSuppressSubtitleComparisonIds: [564, 565, 566, 704, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730],

    // Comparisons whose trend tooltip label reads "Action days".
    actionDaysComparisonIds: [564, 565, 566]

};


// ----------------------------------------------------------------------- //
// session fetch cache
// ----------------------------------------------------------------------- //

// Promise cache for files that are static for the life of the page (geography lookup,
// time periods, comparison metadata, per-geotype TopoJSON, the 311 crosswalk). Without
// it every indicator switch re-fetched and re-parsed all of them, and the TopoJSON was
// re-fetched even on a time-period-only change.
//
// It stores the *promise*, not the resolved value, so callers that arrive while a load
// is still in flight share that one request instead of starting a second. A rejected
// load is evicted so the next caller can retry rather than inheriting the failure for
// the rest of the session.
const sessionFetchCache = new Map();

// Runs `loader` the first time `key` is requested and replays its result thereafter.
const loadOnce = (key, loader) => {

    if (!sessionFetchCache.has(key)) {

        const pending = Promise.resolve()
            .then(loader)
            .catch(error => {
                sessionFetchCache.delete(key);
                throw error;
            });

        sessionFetchCache.set(key, pending);

    }

    return sessionFetchCache.get(key);

};


// ----------------------------------------------------------------------- //
// copy citation
// ----------------------------------------------------------------------- //

// Copies the current citation text to the clipboard and updates button feedback.
const copyCitation = (button = null) => {

    debugLog("* copyCitation");

    const citationTargetId = button?.dataset.citationTarget || 'citeText';
    const citationTextElement = document.getElementById(citationTargetId);

    if (!citationTextElement) {
        return;
    }

    const citeText = citationTextElement.innerText;

    navigator.clipboard.writeText(citeText).then(() => {
        const feedbackButton = button || document.querySelector(`.de-copy-citation-button[data-citation-target="${citationTargetId}"]`);

        if (feedbackButton) {
            feedbackButton.innerHTML = `<i class="fas fa-copy mr-1" aria-hidden="true"></i>Copied!`;
        }
    });
}


// Attaches click handlers to all citation-copy buttons in the DOM, each invoking copyCitation with the clicked button as context.
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

// Writes About and Sources content while de-duplicating repeated source text.
const renderAboutSources = (about, sources) => {

    debugLog("** renderAboutSources");

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
        singleSource === true ? dataSources.innerHTML = DOMPurify.sanitize(sources[0]) : dataSources.innerHTML = DOMPurify.sanitize(sources);
    } else {
        dataSources.innerHTML = DOMPurify.sanitize(sources);
    }

    aboutMeasures.innerHTML = DOMPurify.sanitize(about);

};


// ----------------------------------------------------------------------- //
// reliability notes
// ----------------------------------------------------------------------- //

// Shared "Notes:" block renderer for table/bar/trend/correlate/disparities: clears
// the holder, then re-reveals it only if there are notes to show. Callers pass an
// already-deduped `notes` array — each site's dedupe source differs enough (table
// rows vs. joined Note_1/Note_2 pairs) that the dedupe/filter step stays inline at
// the call site rather than folding into this helper.
// `wrapNote` lets bar.js keep its `<p>` markup while the other four keep
// `<div class='fs-xs'>` — a real markup divergence between sites, not an oversight
// to silently unify. Builds the joined markup once and assigns it, instead of the
// `innerHTML +=` per-note pattern the old sites used, which re-parses the whole
// accumulated string on every iteration.
const renderUnreliabilityNotes = (holderEl, notes, wrapNote = (note) => `<div class='fs-xs'>${note}</div>`) => {

    if (!holderEl) {
        return;
    }

    holderEl.innerHTML = '';
    holderEl.classList.add('hide');

    if (!notes.length) {
        return;
    }

    holderEl.innerHTML = notes.map(wrapNote).join('');
    holderEl.classList.remove('hide');

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

    debugLog("*** getGeoFile");

    // Return the matching geography file for the requested map geography.
    return GEO_FILE_BY_TYPE[mapGeoType];
}

// ----------------------------------------------------------------------- //
// geo helpers
// ----------------------------------------------------------------------- //

// define georank function at top scope, so we can use it later

// Rank for each generic (prettified) geotype, broad to fine. Keyed by prettifyGeoType's output
// (defined below) so a new versioned variant only needs adding there — this table never needs
// its own copy of the version list, unlike the parallel switch it replaced.
const GEO_RANK_BY_PRETTY_TYPE = {
    'Citywide': 0,
    'Borough': 1,
    'NYCKIDS': 2,
    'UHF34': 3,
    'UHF42': 4,
    'Subboro': 5,
    'CD': 6,
    'CDTA': 7,
    'PUMA': 8,
    'NTA': 10,
    'NYHarbor': 11,
    'RMZ': 12
};

// Assigns a sortable rank so geographies can be ordered from broad to fine.
const assignGeoRank = (GeoType) => GEO_RANK_BY_PRETTY_TYPE[prettifyGeoType(GeoType)];

// array of (pretty) geotypes in georank order — derived from GEO_RANK_BY_PRETTY_TYPE so the
// two lists can't drift apart (JS guarantees string-key insertion order)

const geoTypes = Object.keys(GEO_RANK_BY_PRETTY_TYPE);

// Shared-geo helpers keep links and disparities limited to measures that can join.
const getLinksMeasureGeos = (measure) => (measure?.AvailableGeoTypes || []).filter(g => !/Citywide|Borough/.test(g));

// Returns the intersection of link-eligible geo types for two measures — geographies where both measures have data.
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
// measure display resolution
// ----------------------------------------------------------------------- //

// Shared by map/bar/trend/correlate/disparities: decides whether a measure's values
// are percent-formatted (unit "%") or fall back to the site's own DisplayType, and
// builds the "MeasurementType (DisplayType)" string used in subtitles/axis labels.
// "percentile" is excluded even though it contains "percent" as a substring.
const resolveMeasureDisplay = (measurementType, displayTypeFallback = '') => {

    const isPercent = (measurementType.includes('Percent') || measurementType.includes('percent'))
        && !measurementType.includes('percentile');

    const displayUnit = isPercent ? '%' : displayTypeFallback;

    const measurementDisplay = isPercent
        ? measurementType
        : `${measurementType}${displayUnit ? ` (${displayUnit})` : ''}`;

    return { isPercent, displayUnit, measurementDisplay };

};

// ----------------------------------------------------------------------- //
// chart sizing
// ----------------------------------------------------------------------- //

// Measures a chart container, even when its tab pane hasn't been revealed yet.
//
// The overlay renders are kicked off from the tab button's click handler, which finishes
// before Bootstrap reveals the pane. A `"width": "container"` spec therefore measures a
// display:none container, pins the Vega view to 0px, and paints a blank chart that nothing
// recovers — view.resize() re-runs layout but never re-measures the DOM. (Whether a render
// lost that race used to come down to how long its data fetch took, which is what kept the
// bug hidden.) Waiting for the reveal would fix it but leaves the pane visibly empty for
// the length of the fade, so measure the hidden pane instead and hand Vega a real number:
// the chart then renders while the pane is still fading in.
//
// Returns 0 if the width can't be resolved, so callers can fall back to "container".
const getChartContainerWidth = (selector) => {

    const container = document.querySelector(selector);

    if (!container) {
        return 0;
    }

    if (container.offsetWidth > 0) {
        return container.offsetWidth;
    }

    const pane = container.closest('.tab-pane');

    if (!pane) {
        return 0;
    }

    // Lay the pane out without showing it. Kept in normal flow (no position change) so the
    // container resolves against the same parent width it will have once revealed, and
    // restored in the same task, so the browser never paints this state.
    const priorDisplay = pane.style.display;
    const priorVisibility = pane.style.visibility;

    pane.style.display = 'block';
    pane.style.visibility = 'hidden';

    const width = container.offsetWidth;

    pane.style.display = priorDisplay;
    pane.style.visibility = priorVisibility;

    return width;

};

// ----------------------------------------------------------------------- //
// chart resize
// ----------------------------------------------------------------------- //

// Nudges Vega and DataTables layouts to recompute after tab or panel changes.
const updateChartPlotSize = () => {

    debugLog("* updateChartPlotSize");

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

// Columns dropped from both correlate.js's and disparities.js's download CSVs: internal
// join/plotting-only fields (raw geo ranks, duplicate display values, per-side measure IDs,
// etc.) that aren't meant for analyst-facing export.
const LINKS_DOWNLOAD_DROP_COLUMNS = [
    'GeoType',
    'GeoTypeShortDesc_1',
    'GeoTypeShortDesc_2',
    'GeoRank_1',
    'GeoRank_2',
    'start_period_1',
    'end_period_1',
    'ban_summary_flag_1',
    'ban_summary_flag_2',
    'BoroID',
    'DisplayValue_1',
    'DisplayValue_2',
    'GeoTypeDesc_2',
    'Geography_2',
    'start_period_2',
    'end_period_2',
    'MeasureID_1',
    'MeasureID_2'
];

// Shared by correlate.js/disparities.js: drops the internal-only columns above from the
// joined rows, then appends the two human-readable label columns each site's chart already
// builds for its subtitle/legend. `extraDrops` appends to the shared base list instead of
// duplicating it — disparities.js passes ['randomOffsetX'] for its jitter-only field, which
// has no counterpart in correlate.js's data shape. `labels.value1Indicator`/
// `value2Indicator` are the final strings each caller wants written into
// Value_1_Indicator/Value_2_Indicator; the two sites build those strings differently
// (interpolated template literal vs. pre-built variable), so that step stays at the call site.
const buildLinksDownloadTable = (rows, extraDrops, labels) => {

    return aq.from(rows)
        .select(aq.not(LINKS_DOWNLOAD_DROP_COLUMNS, extraDrops))
        .derive({ Value_1_Indicator: aq.escape(labels.value1Indicator) })
        .derive({ Value_2_Indicator: aq.escape(labels.value2Indicator) });

};


// Centralizes GA calls so new explorer interactions stay aligned with the
// legacy explorer event names and payload shapes.
const trackDataExplorerEvent = (eventName, eventParams = null) => {

    if (typeof gtag !== 'function') {
        return;
    }

    if (eventParams && Object.keys(eventParams).length > 0) {
        gtag('event', eventName, eventParams);
        return;
    }

    gtag('event', eventName);

};


// Fires a 'click_option' GA event for the given option name; no-op if option is falsy.
const trackDataExplorerOption = (option) => {

    if (!option) {
        return;
    }

    trackDataExplorerEvent('click_option', { option });

};


// Maps a menu type ('measure'/'geo'/'time') to the legacy GA option label used by the old explorer; returns null for unrecognized types.
const getLegacyMapControlAnalyticsOption = (type) => {

    const optionMap = {
        measure: 'map_measure',
        geo: 'map_geo',
        time: 'map_time'
    };

    return optionMap[type] || null;

};


// Fires a 'file_download' GA event with file name, extension, and link-text params, guarding against incomplete data.
const trackDataExplorerFileDownload = ({ fileName, fileExtension, linkText }) => {

    if (!fileName || !fileExtension || !linkText) {
        return;
    }

    trackDataExplorerEvent('file_download', {
        file_name: fileName,
        file_extension: fileExtension,
        link_text: linkText
    });

};


// Fires a 'print_viz' GA event for the current chart type, normalizing 'bubble-map' to 'map' for analytics.
const trackDataExplorerPrintView = (chartView) => {

    if (!chartView) {
        return;
    }

    trackDataExplorerEvent('print_viz', {
        chart_type: chartView === 'bubble-map' ? 'map' : chartView
    });

};


// Determines the view label for the downloaded CSV filename: prefers the last-rendered chart type, falls back to the current overlay tab, defaults to 'bar'.
const getCurrentDataDownloadView = () => {

    if (DE.print.chartType) {
        return DE.print.chartType === 'bubble-map' ? 'map' : DE.print.chartType;
    }

    if (DE.state.overlay === 'trend') {
        return 'trend';
    }

    if (DE.state.overlay === 'links') {
        return 'links';
    }

    if (DE.state.overlay === 'table') {
        return 'table';
    }

    return 'bar';

};

// Builds a CSV data-URI from CSVforDownload, names the file from indicator name + view, triggers download via a hidden anchor click, and fires a file_download GA event.
const downloadData = (
    // data,
    // chartType
) => {

        debugLog('Downloading data')

        // Guard against a never-set or stale CSVforDownload (e.g. the download button is
        // clicked before any tab has rendered) so a blank/leftover CSV can't go out under
        // a confident but wrong filename. Mirrors the early-return guard-clause pattern
        // used throughout the renderers (e.g. renderTrendChart, renderCorrelate) rather
        // than introducing a new disable/hide mechanism.
        if (!DE.print.CSVforDownload) {
            return;
        }

        // else, for chart view downloads:
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(DE.print.CSVforDownload);
        let hiddenElement = document.createElement('a');

        // set view to send to file name
        const view = getCurrentDataDownloadView();

        hiddenElement.href = csvData;
        hiddenElement.target = '_blank';
        hiddenElement.download = 'NYC EH Data Portal - '  + DE.indicator.indicatorName + ` (${view} view)` + '.csv';
        hiddenElement.click();

        trackDataExplorerFileDownload({
            fileName: hiddenElement.download,
            fileExtension: '.csv',
            linkText: 'Download chart data'
        });
}

// Revises the notes that are displayed under each chart - meant to work in concert with tooltip notes at each datapoint. This lets you display chart-specific notes, rather than datapoint-specific notes (which should show in tooltips)
function getDisplayNotes(notes) {
  return notes
    .map(note => {
      if (note.includes('based on small numbers')) {
        return 'Some estimates are based on small numbers and should be interpreted with caution.';
      }

      if (note.includes('suppressed due to insufficient data')) {
        return 'Some estimates are suppressed due to insufficient data.';
      }

      return note;
    });
}