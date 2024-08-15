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
let defaultTrendSources;
let defaultMapMetadata;
let defaultMapAbout;
let defaultMapSources;
let defaultPrimaryLinksMeasureMetadata;
let defaultSecondaryMeasureMetadata;
let defaultDisparitiesMetadata;
let defaultLinksAbout;
let defaultLinksSources;

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
let selectedComparisonSources = "";
let selectedComparisonMetadata;

let selectedLinksAbout;
let selectedLinksSources;
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

// store hash, so display knows where it just was
let currentHash;
let state;

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary

// get disparities button dom element, so it can be removed and appended as needed
let btnToggleDisparities = document.querySelector('.btn-toggle-disparities');

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
    "NYHarbor"
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
;
// ======================================================================= //
// data.js
// ======================================================================= //

// ======================================================================= //
//  fetch and load indicators metadata into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// full indicator metadata
// ----------------------------------------------------------------------- //

fetch(`${data_repo}${data_branch}/indicators/metadata/metadata.json`)
    .then(response => response.json())
    .then(async data => {

        // console.log("* fetch metadata.json");

        indicators = data;

        const paramId = url.searchParams.get('id') !== null ? parseInt(url.searchParams.get('id')) : false;
        
        renderIndicatorDropdown()
        renderIndicatorButtons()

        // calling loadIndicator calls loadData, etc, and eventually renderMeasures. Because all 
        //  of this depends on the global "indicator" object, we call loadIndicator here
        
        if (paramId) {
            loadIndicator(paramId)
            // console.log('param id is set')

            // fetch311(paramId)
        } else {
            // console.log('no param', url.searchParams.get('id'));
            loadIndicator()
        }

    })
    .catch(error => console.log(error));

// ======================================================================= //
//  fetch and load comparison chart data into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// function to fetch indicator comparisons metadata
// ----------------------------------------------------------------------- //

const fetch_comparisons = async () => {
    
    console.log("* fetch_comparisons.json");

    await fetch(`${data_repo}${data_branch}/indicators/metadata/comparisons.json`)
        .then(response => response.json())
        .then(async data => {
            
            comparisons = data;
            
            // console.log("comparisons:", comparisons);
            
        })
        .catch(error => console.log(error));
    
    // call function to create comparisons data

    createComparisonData(comparisons);

}


// ----------------------------------------------------------------------- //
// function to create data and metadata for comparisons chart
// ----------------------------------------------------------------------- //

const createComparisonData = async (comps) => {
    
    console.log("* createComparisonData");
    
    // console.log("comps [createComparisonData]:", comps);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get comparisons-specific metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // will be used by renderMeasures to create dropdown
    
    comparisonsMetadata = await comps.filter(
        d => indicatorComparisonId.includes(d.ComparisonID)
    )
        
    // console.log("comparisonsMetadata [createComparisonData]:", comparisonsMetadata);

    // merged metadata

    aqComparisonsMetadata = aq.from(comparisonsMetadata)
        .unroll("Indicators")
        .derive({
            IndicatorID: d => d.Indicators.IndicatorID,
            MeasureID:   d => d.Indicators.MeasureID,
            GeoTypeName: d => d.Indicators.GeoTypeName,
            GeoID:       d => d.Indicators.GeoID,
            Geography:   d => d.Indicators.Geography
        })
        .select(aq.not("Indicators"))

    // console.log("aqComparisonsMetadata [createComparisonData]");
    // aqComparisonsMetadata.print()


    // get unique combinations of indicators and measures

    let aqUniqueIndicatorMeasure = aqComparisonsMetadata
        .select("IndicatorID", "MeasureID")
        .dedupe()
        // .print({limit: Infinity})

    let uniqueIndicatorMeasure = aqUniqueIndicatorMeasure
        .groupby("IndicatorID")
        .objects({grouped: "entries"})

    let comparisonsIndicatorIDs = [... new Set(aqComparisonsMetadata.array("IndicatorID"))]
    let comparisonsMeasureIDs = [... new Set(aqComparisonsMetadata.array("MeasureID"))]

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // join comparisons metadata with indicators from metadata.json
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let comparisonsIndicatorsMetadata = indicators.filter(
        ind => comparisonsIndicatorIDs.includes(ind.IndicatorID)
    )

    // console.log("comparisonsIndicatorsMetadata:", comparisonsIndicatorsMetadata);


    aqComparisonsIndicatorsMetadata = aq.from(comparisonsIndicatorsMetadata)
        .select("IndicatorID", "IndicatorName", "IndicatorLabel", "Measures")
        .unroll("Measures")
        .derive({
            MeasureID:       d => d.Measures.MeasureID,
            MeasureName:     d => d.Measures.MeasureName,
            MeasurementType: d => d.Measures.MeasurementType,
            Sources:         d => d.Measures.Sources,
            how_calculated:  d => d.Measures.how_calculated,
            DisplayType:     d => d.Measures.DisplayType,
            TrendNoCompare:  d => d.Measures.TrendNoCompare
        })
        .derive({IndicatorMeasure: d => d.IndicatorLabel + ": " + d.MeasurementType})
        .select(aq.not("Measures"))
        .filter(aq.escape(d => comparisonsMeasureIDs.includes(d.MeasureID)))
    
    // console.log("aqComparisonsIndicatorsMetadata [createComparisonData]");
    // aqComparisonsIndicatorsMetadata.print()


    // join comparisons metadata tables

    aqCombinedComparisonsMetadata = aqComparisonsMetadata
        .join(aqComparisonsIndicatorsMetadata, [["MeasureID", "IndicatorID"], ["MeasureID", "IndicatorID"]])

    // console.log("aqCombinedComparisonsMetadata [createComparisonData]");
    // aqCombinedComparisonsMetadata.print()

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // fetch data files for all comp indicators
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // Promise.all takes the array of promises returned by map, and then the `then` callback executes after they've all resolved

    Promise.all(

        // map over indeicators, which have separate data files
        
        uniqueIndicatorMeasure.map(async ind => {

            let measures = ind[1].flatMap(m => Object.values(m));
            
            // get data for an indicator

            return aq.loadJSON(`${data_repo}${data_branch}/indicators/data/${ind[0]}.json`)
                .then(async data => {

                    // console.log("** aq.loadJSON [createComparisonData]");

                    // filter data to keep only measures and geos in the comparison chart, using semijoin with comparison metadata

                    let comp_data = data
                        .derive({IndicatorID: aq.escape(ind[0])})
                        .semijoin(
                            aqCombinedComparisonsMetadata, 
                            (a, b) => (op.equal(a.MeasureID, b.MeasureID) && op.equal(a.GeoType, b.GeoTypeName) && op.equal(a.GeoID, b.GeoID))
                        )
                        .reify()
                    
                    return comp_data;
                
                })
        })
    )

    .then(async dataArray => {

        // console.log("dataArray [createComparisonData]", dataArray);
        // dataArray.print()

        // take array of arquero tables and combine them into 1 arquero table - like bind_rows in dplyr

        aqComparisonsIndicatorData = await dataArray.flatMap(d => d).reduce((a, b) => a.concat(b))

        // console.log("aqComparisonsIndicatorData [createComparisonData]");
        // aqComparisonsIndicatorData.print()

    })
}


// ======================================================================= //
// data loading and manipulation functions
// ======================================================================= //

// I reversed the order of these function declarations to make the process
//  of data creation easier to understand

// ----------------------------------------------------------------------- //
// function to load indicator metadata
// ----------------------------------------------------------------------- //

const loadIndicator = async (this_indicatorId, dont_add_to_history) => {

    console.log("* loadIndicator");

    currentHash = window.location.hash;

    // if indicatorId isn't given, use the first indicator from the dropdown list
    //  (which is populated by Hugo reading the content frontmatter).

    const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    indicatorId = this_indicatorId ? parseFloat(this_indicatorId) : parseFloat(firstIndicatorId);

    // remove active class from every list element
    $(".indicator-dropdown-item").removeClass("active");
    $(".indicator-dropdown-item").attr('aria-selected', false);

    $(".indicator-arrows").addClass("hide");
    document.getElementById(`arrow-${indicatorId}`).classList.remove('hide')

    // get the list element for this indicator (in buttons and dropdowns)
    const thisIndicatorEl = document.querySelectorAll(`button[data-indicator-id='${indicatorId}']`)

    // set this element as active & selected
    $(thisIndicatorEl).addClass("active");
    $(thisIndicatorEl).attr('aria-selected', true);

    // indicatorId comes in as  a string, so "find" uses '==' instead of '==='

    indicator = indicators.find(indicator => indicator.IndicatorID == indicatorId);
    indicatorName = indicator?.IndicatorName ? indicator.IndicatorName : '';
    indicatorDesc = indicator?.IndicatorDescription ? indicator.IndicatorDescription : '';
    indicatorShortName = indicator?.IndicatorShortname ? indicator.IndicatorShortname : indicatorName;
    indicatorComparisonId = indicator?.Comparisons;
    indicatorMeasures = indicator?.Measures;

    // console.log("indicatorMeasures [loadIndicator]", indicatorMeasures);

    // create Citation

    createCitation(); // re-runs on updating Indicator

    // reset selected measure flags

    selectedMapMeasure = false;
    selectedMapTime = false;
    selectedMapGeo = false;
    selectedTrendMeasure = false;
    selectedLinksMeasure = false;
    selectedDisparity = false;
    selectedComparison = false;
    showingNormalTrend = false;
    showingComparisonsTrend = false;

    // if dont_add_to_history is true, then don't push the state
    // if dont_add_to_history is false, or not set, push the state
    // this prevents loadIndicator from setting new history entries when it's called
    //  on a popstate event, i.e. when the user is traversing the history stack

    // dont_add_to_history catches the pop state case, state.id != indicatorId catches the location change case
    // we don't want to add to the history stack if we've landed on this page by way of the history stack

    url.searchParams.set('id', parseFloat(indicatorId));

    if (!dont_add_to_history && (window.history.state === null || state === null || window.history.state.id != indicatorId)) {

        if (!url.hash) {

            // if loadIndicator is being called without a hash (like when a topic page is loaded), then show the first ID and table

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        } else {

            url.hash = currentHash;
            window.history.pushState({ id: indicatorId, hash: url.hash }, '', url);

        }

    }

    // call data loading function

    const indicatorTitle = document.getElementById('dropdownIndicator')

    indicatorTitle.innerHTML = indicatorName

    // call function to fetch comparisons data

    // console.log(">>>> indicatorComparisonId", indicatorComparisonId);
    
    // make sure metadata is empty, so that we can use its length for conditionals
    comparisonsMetadata = [];
    
    // why are we waiting for this?

    if (indicatorComparisonId !== null) {
        // await fetch_comparisons();
        fetch_comparisons();
    }

    loadData(indicatorId);

}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

const loadData = async (this_indicatorId) => {

    console.log("* loadData");

    fetch(`${data_repo}${data_branch}/indicators/data/${this_indicatorId}.json`)
        .then(response => response.json())
        .then(async data => {

            // console.log("data [loadData]", data);

            // add GeoRank

            aqIndicatorData = aq.table(data)
                .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
                .groupby("TimePeriodID", "GeoType", "GeoID")
                .orderby(aq.desc('TimePeriodID'), 'GeoRank')

            // call the geo file and time file loading functions
            
            await Promise.all([
                loadTime(),
                loadGeo()
            ])

            // call the data-to-geo joining function

            joinData();

            
        })

    draw311Buttons(this_indicatorId)

}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const loadGeo = async () => {

    console.log("* loadGeo");

    const geoUrl = `${data_repo}${data_branch}/geography/GeoLookup.json`; // col named "GeoType"

    await aq.loadJSON(geoUrl, {autoType: false})
        .then(async (data) => {

            geoTable = await data;

            //  console.log("geoTable [loadGeo]");
            //  geoTable.print()

    });
}

// ----------------------------------------------------------------------- //
// function to load time period data
// ----------------------------------------------------------------------- //

const loadTime = async () => {

    console.log("* loadTime");

    const timeUrl = `${data_repo}${data_branch}/indicators/metadata/TimePeriods.json`;

    await aq.loadJSON(timeUrl, {autoType: false})
        .then(async (data) => {

            timeTable = await data;

            // console.log("timeTable [loadTime]");
            // timeTable.print()

    });
}


// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

const joinData = () => {

    console.log("* joinData");

    // console.log("indicators [joinData]", indicators);
    // console.log("indicatorMeasures [joinData]", indicatorMeasures);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get metadata fields
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // create table column header with display type

    let measurementDisplayArray = [];

    let MeasureID = [];
    let MeasurementType = [];
    let DisplayType = [];

    indicatorMeasures.forEach(

        (measure, i) => {

            MeasureID.push(measure.MeasureID)
            MeasurementType.push(measure.MeasurementType)
            DisplayType.push(measure.DisplayType)

        }
    )
    
    aqMeasureDisplay = 
        aq.table({
            MeasureID: MeasureID,
            MeasurementType: MeasurementType,
            DisplayType: DisplayType
        })

    // take array of arquero tables and combine them into 1 arquero table - like bind_rows in dplyr

    // console.log("aqMeasureDisplay [joinData]");
    // aqMeasureDisplay.print()

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // getting time periods for each viz for each measure x geo combo
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // flatten MeasureID + TimePeriodID + GeoType

    let tableTimesGeos = [];
    let mapTimesGeos = [];
    let trendTimesGeos = [];

    indicatorMeasures.map(

        // map over measures

        (measure, i) => {

            // console.log(i, " > MeasureID", measure.MeasureID);

            // table -----------

            let aqTableTimesGeosMeasureArray =

                measure.VisOptions[0].Table.map(

                    // map over table geotypes

                    (table, i) => {

                        // create table of all time period IDs for this geotype

                        let aqTimePeriodID = aq.table({TimePeriodID: table.TimePeriodID})

                        // create 1-row table with measure ID and geotype

                        let aqMeasureGeo = aq.table({
                            GeoType:  [table.GeoType],
                            MeasureID: [measure.MeasureID]
                        })

                        // console.log("aqMeasureGeo");
                        // aqMeasureGeo.print()

                        // cross them to expand / recycle geotype & measure table rows

                        let aqTimeMeasureGeos = aqTimePeriodID.cross(aqMeasureGeo).filter(d => d.TimePeriodID).reify()

                        return aqTimeMeasureGeos;

                    }
                )

            // console.log("aqTableTimesGeosMeasureArray", aqTableTimesGeosMeasureArray);

            // combine array of arquero tables into 1 arquero table

            let aqTableTimesGeosMeasure = 
                aqTableTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // push table for this measure to array with all measures

            tableTimesGeos.push(aqTableTimesGeosMeasure);


            // map -----------

            let aqMapTimesGeosMeasureArray =

                measure.VisOptions[0].Map.map(

                    // map over map geotypes

                    (map, i) => {

                        // create table of all time period IDs for this geotype

                        let aqTimePeriodID = aq.table({TimePeriodID: map.TimePeriodID})

                        // create 1-row table with measure ID and geotype

                        let aqMeasureGeo = aq.table({
                            GeoType:  [map.GeoType],
                            MeasureID: [measure.MeasureID]
                        })

                        // cross them to expand / recycle geotype & measure table rows

                        let aqTimeMeasureGeos = aqTimePeriodID.cross(aqMeasureGeo).filter(d => d.TimePeriodID).reify()

                        return aqTimeMeasureGeos;

                    }
                )

            // console.log("aqMapTimesGeosMeasureArray", aqMapTimesGeosMeasureArray);

            // combine array of arquero tables into 1 arquero table

            let aqMapTimesGeosMeasure = 
                aqMapTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // push table for this measure to array with all measures

            mapTimesGeos.push(aqMapTimesGeosMeasure);


            // comparisons -----------

            let aqTrendTimesGeosMeasureArray =

                measure.VisOptions[0].Trend.map(

                    // map over trend geotypes

                    (trend, i) => {

                        // create table of all time period IDs for this geotype

                        let aqTimePeriodID = aq.table({TimePeriodID: trend.TimePeriodID})

                        // create 1-row table with measure ID and geotype

                        let aqMeasureGeo = aq.table({
                            GeoType:  [trend.GeoType],
                            MeasureID: [measure.MeasureID]
                        })

                        // cross them to expand / recycle geotype & measure table rows

                        let aqTimeMeasureGeos = aqTimePeriodID.cross(aqMeasureGeo).filter(d => d.TimePeriodID).reify()

                        return aqTimeMeasureGeos;

                    }
                )

            // console.log("aqTrendTimesGeosMeasureArray", aqTrendTimesGeosMeasureArray);

            // combine array of arquero tables into 1 arquero table

            let aqTrendTimesGeosMeasure = 
                aqTrendTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // push table for this measure to array with all measures

            trendTimesGeos.push(aqTrendTimesGeosMeasure);

        }
    )
    

    // take array of arquero tables and combine them into 1 arquero table defined globally - like bind_rows in dplyr
    
    // table

    aqTableTimesGeos = 
        tableTimesGeos
            .flatMap(d => d)
            .reduce((a, b) => a.concat(b))
            .join_left(timeTable, "TimePeriodID")
            .orderby(aq.desc('end_period'), "MeasureID")
    
    // map

    aqMapTimesGeos = 
        mapTimesGeos
            .flatMap(d => d)
            .reduce((a, b) => a.concat(b))
            .join_left(timeTable, "TimePeriodID")
            .orderby(aq.desc('end_period'), "MeasureID")
    
    // trend
    
    aqTrendTimesGeos = 
        trendTimesGeos
            .flatMap(d => d)
            .reduce((a, b) => a.concat(b))
            .join_left(timeTable, "TimePeriodID")
            .orderby(aq.desc('end_period'), "MeasureID")


    // console.log("aqTableTimesGeos [joinData]");
    // aqTableTimesGeos.print()

    // console.log("aqMapTimesGeos [joinData]");
    // aqMapTimesGeos.print()

    // console.log("aqTrendTimesGeos [joinData]");
    // aqTrendTimesGeos.print()

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // joining
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    // foundational joined dataset ----------

    // console.log(">>>> joinedAqData [joinData]");

    joinedAqData = aqIndicatorData
        // join the additional geo info
        .join_left(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
        .rename({'Name': 'Geography'})
        // join the additional time period info
        .join(timeTable, "TimePeriodID")
        .select(aq.not("BoroID", "Borough", "TimeType"))
        .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
        .reify()
    
    // console.log(">>>> joinedAqData [joinData]");
    // joinedAqData.print()


    // data for summary table ----------

    tableData = joinedAqData
        .join_left(aqMeasureDisplay, "MeasureID")
        // filter to keep only times and geos we want in the table
        .semijoin(aqTableTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .derive({
            MeasurementDisplay: d => op.trim(op.join([d.MeasurementType, d.DisplayType], " ")),
            DisplayCI: d => op.trim(op.join([d.DisplayValue, d.CI], " "))
        })
        .derive({ DisplayCI: d => op.replace(d.DisplayCI, /^$/, "-") }) // replace missing with "-"
        .select(aq.not("start_period", "end_period"))
        .reify()
        .objects()

    // console.log(">>>> tableData [joinData]", tableData);

    // data for map ----------

    mapData = joinedAqData
        // filter to keep only times and geos we want in the table
        .semijoin(aqMapTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby(aq.desc('end_period'), "MeasureID")
        .reify()
        .objects()

    // console.log(">>>> mapData [joinData]", mapData);
    

    // data for trend chart ----------

    trendData = joinedAqData
        // filter to keep only times and geos we want in the table
        .semijoin(aqTrendTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby("GeoRank", "GeoID")
        .reify()
        .objects()

    // console.log(">>>> trendData [joinData]", trendData);

    // data for links & disparities chart ----------

    // console.log(">>> linksData [joinData]");

    linksData = joinedAqData
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
        .objects()

    // console.log(">>>> linksData [joinData]", linksData);

    // call the measure rendering etc. function

    renderMeasures();

}


// ----------------------------------------------------------------------- //
// function to create data and metadata for links chart
// ----------------------------------------------------------------------- //

// WHAT'S THE MOST RECENT YEAR WHERE PRIMARY AND SECONDARY SHARE A GEOGRAPHY?

const createJoinedLinksData = async (primaryMeasureId, secondaryMeasureId) => {

    let returnData;

    // console.log("primaryMeasureId [createJoinedLinksData]", primaryMeasureId);
    // console.log("secondaryMeasureId [createJoinedLinksData]", secondaryMeasureId);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get metadata for the selected primary measure, assign to global variable
    // indicatorMeasures created in loadIndicator

    let primaryMeasureMetadata = indicatorMeasures.filter(
        measure => measure.MeasureID === primaryMeasureId
    )

    // console.log("primaryMeasureMetadata [createJoinedLinksData]", primaryMeasureMetadata);

    // get available geos for primary measure (excluding citywide and boro)

    const primaryMeasureGeos = primaryMeasureMetadata[0]?.AvailableGeoTypes
        .filter(g => !/Citywide|Borough/.test(g))

    // console.log("primaryMeasureGeos [createJoinedLinksData]", primaryMeasureGeos);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if no secondary measure ID is given, set it to the first in the primary measure's links list

    if (typeof secondaryMeasureId == "undefined") {
        secondaryMeasureId = primaryMeasureMetadata[0].VisOptions[0].Links[0]?.Measures[0]?.MeasureID;
    }

    // get the indicator element for the selected secondary measure

    const secondaryIndicator = indicators.filter(
        indicator => indicator.Measures.some(
            measure => measure.MeasureID === secondaryMeasureId
        )
    )

    // get secondary indicatorID, to get secondary data and metadata

    const secondaryIndicatorId = secondaryIndicator[0]?.IndicatorID

    // get metadata for the selected secondary measure, assign to global variable

    let secondaryMeasureMetadata = secondaryIndicator[0].Measures?.filter(
        measure => measure.MeasureID === secondaryMeasureId
    )

    // console.log("secondaryMeasureMetadata", secondaryMeasureMetadata);


    // ==== geography ==== //

    // get avilable geos for secondary measure (excluding citywide and boro)

    const secondaryMeasureGeos = secondaryMeasureMetadata[0]?.AvailableGeoTypes
        .filter(g => !/Citywide|Borough/.test(g))

    // console.log("secondaryMeasureGeos [createJoinedLinksData]", secondaryMeasureGeos);

    // ---- get primary x secondary intersection ---- //

    const sharedGeos = secondaryMeasureGeos.filter(g => primaryMeasureGeos.includes(g));

    // console.log("sharedGeos [createJoinedLinksData]", sharedGeos);


    // ==== times ==== //

    // get available time periods for secondary measure

    // console.log("aqSecondaryMeasureTimes");
    // aqSecondaryMeasureTimes.print(50)

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const filteredPrimaryMeasureData = linksData

        // keep primary measure
        .filter(d => d.MeasureID === primaryMeasureId)
        
        // get shared geos
        .filter(d => sharedGeos.includes(d.GeoType))

    // console.log("filteredPrimaryMeasureData [createJoinedLinksData]", filteredPrimaryMeasureData);


    // get most recent time period for primary measure
    //  (at shared geo level, which is why we're using the data, and not the metadata)

    const mostRecentPrimaryMeasureEndTime = Math.max(...filteredPrimaryMeasureData.map(d => d.end_period));

    // console.log("mostRecentPrimaryMeasureEndTime [createJoinedLinksData]", mostRecentPrimaryMeasureEndTime);

    // keep only most recent time period

    const filteredPrimaryMeasureTimesData = filteredPrimaryMeasureData
        .filter(d => d.end_period === mostRecentPrimaryMeasureEndTime)

    // console.log("filteredPrimaryMeasureTimesData [createJoinedLinksData]", filteredPrimaryMeasureTimesData);

    // get the geotype(s) of the most recent data - might only occur in 1 of the4 shared geos!

    let mostRecentPrimaryGeos = [...new Set(filteredPrimaryMeasureTimesData.map(d => d.GeoType))];

    // console.log("mostRecentPrimaryGeos [createJoinedLinksData]", mostRecentPrimaryGeos);

    // convert to arquero table

    const aqFilteredPrimaryMeasureTimesData = aq.from(filteredPrimaryMeasureTimesData);

    // console.log("aqFilteredPrimaryMeasureTimesData [createJoinedLinksData]");
    // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
    // aqFilteredPrimaryMeasureTimesData.print()


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get secondary data with shared geo and time period that is closest with most recent primary data
    //  (fetches run asynchronously by default, but we need this data to do other things, so we have to 
    //  `await` the result before continuing)

    await fetch(`${data_repo}${data_branch}/indicators/data/${secondaryIndicatorId}.json`)
        .then(response => response.json())
        .then(async data => {

            // join with geotable and times, keep only geos in primary data

            const aqFilteredSecondaryMeasureData = aq.table(data)

                // get secondary measure data
                .filter(`d => d.MeasureID === ${secondaryMeasureId}`)
                .join(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])

                // get same geotypes as most recent primary data
                .filter(aq.escape(d => mostRecentPrimaryGeos.includes(d.GeoType)))
                .derive({"GeoRank": aq.escape(d => assignGeoRank(d.GeoType))})
                .rename({'Name': 'Geography'})

                // get end periods
                .join_left(
                    timeTable,
                    "TimePeriodID"
                )
            
            // console.log("aqFilteredSecondaryMeasureData [createJoinedLinksData]");
            // aqFilteredSecondaryMeasureData.print()
            

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();

            // console.log("filteredSecondaryMeasureTimesDataObjects", filteredSecondaryMeasureTimesDataObjects);
            

            // ==== get closest data ==== //

            // get the secondary end time closest to most recent primary end time

            const closestSecondaryTime = filteredSecondaryMeasureTimesDataObjects.reduce((prev, curr) => {

                return (Math.abs(curr.end_period - mostRecentPrimaryMeasureEndTime) < Math.abs(prev.end_period - mostRecentPrimaryMeasureEndTime) ? curr : prev);

            });

            // console.log("closestSecondaryTime [createJoinedLinksData]", closestSecondaryTime);


            // use end time to get closest secondary data

            const aqClosestSecondaryData = aqFilteredSecondaryMeasureData

                // data with the latest end period
                .filter(`d => d.end_period === ${closestSecondaryTime.end_period}`)

                // get the finest geo left
                .filter(d => d.GeoRank === op.max(d.GeoRank))

                // in case there are two time periods left, get the one that starts the earliest,
                //  which will be yearly over seasonal
                .filter(d => d.start_period === op.min(d.start_period))


            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
            // join primary and secondary measure data
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

            // console.log("filteredPrimaryMeasureData", filteredPrimaryMeasureData);

            // console.log("aqFilteredPrimaryMeasureTimesData [createJoinedLinksData]");
            // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
            // aqFilteredPrimaryMeasureTimesData.print()

            // console.log("aqClosestSecondaryData [createJoinedLinksData]");
            // aqClosestSecondaryData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
            // aqClosestSecondaryData.print()

            const aqJoinedPrimarySecondaryData = aqFilteredPrimaryMeasureTimesData
                .join(
                    aqClosestSecondaryData,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )
                // .join_left(timeTable, "TimePeriodID")

            // console.log("aqJoinedPrimarySecondaryData [createJoinedLinksData]");
            // aqJoinedPrimarySecondaryData.print()

            // set the value of joinedLinksDataObjects, and make sure to wait for it

            return await aqJoinedPrimarySecondaryData.objects();

        })
        .then(d => {

            returnData = d;

            // console.log("data 2", returnData);

        })

    // console.log("data 3", returnData);

    // console.log(">> ret");
    // ret.print()

    return { 
        "data": returnData, 
        "primaryMeasureMetadata": primaryMeasureMetadata, 
        "secondaryMeasureMetadata": secondaryMeasureMetadata 
    };
}


// ======================================================================= //
//  fetch and load 311 Crosswalk into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// function to draw 311 buttons
// ----------------------------------------------------------------------- //

function draw311Buttons(indicator_id) {

    console.log("* draw311Buttons");

    let filteredCrosswalk = [];

    d3.csv(`${baseURL}311/311-crosswalk.csv`)
        .then(async data => {

            // console.log(">>> 311-crosswalk");
            return data;
        })
        .then((crosswalk) => {

            document.getElementById('311').innerHTML = ''

            // since we bring the takeaction partial in 2x on the DE page, we need to do this based on a class instead of an ID.
            var dest = document.querySelectorAll('.destination311')
            dest.forEach(element => element.innerHTML = '')

            filteredCrosswalk = crosswalk.filter(indicator => indicator.IndicatorID == indicator_id )

            // Creates label if there are 311 links
            if (filteredCrosswalk.length > 0) {
                document.getElementById('311label').innerHTML = '<i class="fas fa-external-link-alt mr-1"></i>Or, contact 311 to get resources about:'
                dest.forEach(element => element.classList.remove('hide'))
            } else {
                document.getElementById('311label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))
            };

            // draws 311 buttons
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {
                var title = filteredCrosswalk[i].topic
                var destination = filteredCrosswalk[i].kaLink
                var btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="mr-1" target="_blank" rel="noopener noreferrer">${title}</a>| `
                dest.forEach(element => element.innerHTML += btn)
            }
    })
}

;
// ======================================================================= //
// measures.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //

// ===== map ================================================== //

const setDefaultMapMeasure = (visArray) => {

    // console.log("* setDefaultMapMeasure");

    // modified so that defaultMapMetadata is explicitly set, instead of by reference
    //  through defaultArray
    
    let defaultArray = [];

    const hasAgeAdjustedRate = visArray.filter(measure =>
        measure.MeasurementType.includes('Age-adjusted rate')
    )

    const hasRate = visArray.filter(measure =>
        measure.MeasurementType.includes('rate')
    )

    const isRate = visArray.filter(measure =>
        measure.MeasurementType.includes('Rate')
    )

    const hasPercent = visArray.filter(measure =>
        measure.MeasurementType.includes('Percent')
    )

    const hasPercent2 = visArray.filter(measure =>
        measure.MeasurementType.includes('percent')
    )

    const hasDensity = visArray.filter(measure =>
        measure.MeasurementType.includes('Density')
    )

    if (hasAgeAdjustedRate.length) {

        const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
            measure.MeasurementType.includes('Total')
        )

        // Set total as default if available
        if (hasAgeAdjustedRateTotal.length) {
            defaultArray.push(hasAgeAdjustedRateTotal[0]);

        } else {
            defaultArray.push(hasAgeAdjustedRate[0]);

        }

    } else if (hasRate.length) {
        defaultArray.push(hasRate[0]);

    } else if (isRate.length) {
        defaultArray.push(isRate[0]);

    } else if (hasPercent.length) {
        defaultArray.push(hasPercent[0]);

    } else if (hasPercent2.length) {
        defaultArray.push(hasPercent2[0]);

    } else if (hasDensity.length) {
        defaultArray.push(hasDensity[0]);

    } else {
        defaultArray.push(visArray[0]);

    }

    // assigning to global object

    defaultMapMetadata = defaultArray;

}


// ===== trend ================================================== //

const setDefaultTrendMeasure = (visArray) => {

    // console.log("* setDefaultTrendMeasure");

    // modified so that defaultTrendMetadata is explicitly set, instead of by reference
    //  through defaultArray

    let defaultArray = [];

    if (visArray.length > 0) {

        const hasAgeAdjustedRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Age-adjusted rate')
        )

        const hasRate = visArray.filter(measure =>
            measure.MeasurementType.includes('rate')
        )

        const isRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Rate')
        )
        
        const hasPercent = visArray.filter(measure =>
            measure.MeasurementType.includes('Percent')
        )

        const hasPercent2 = visArray.filter(measure =>
            measure.MeasurementType.includes('percent')
        )

        const hasDensity = visArray.filter(measure =>
            measure.MeasurementType.includes('Density')
        )


        if (hasAgeAdjustedRate.length) {

            const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
                measure.MeasurementType.includes('Total')
            )
            // Set total as default if available
            if (hasAgeAdjustedRateTotal.length) {
                defaultArray.push(hasAgeAdjustedRateTotal[0]);

            } else {
                defaultArray.push(hasAgeAdjustedRate[0]);

            }


        } else if (hasRate.length) {
            defaultArray.push(hasRate[0]);

        } else if (isRate.length) {
            defaultArray.push(isRate[0]);

        } else if (hasPercent.length) {
            defaultArray.push(hasPercent[0]);

        } else if (hasPercent2.length) {
            defaultArray.push(hasPercent2[0]);

        } else if (hasDensity.length) {
            defaultArray.push(hasDensity[0]);

        } else {
            defaultArray.push(visArray[0]);

        }
    }

    // assigning to global object

    defaultTrendMetadata = defaultArray;
}


// ===== links ================================================== //

const setDefaultLinksMeasure = async (visArray) => {

    // console.log("* setDefaultLinksMeasure");

    // modified so that defaultPrimaryLinksMeasureMetadata is explicitly set, instead of by reference
    //  through defaultArray

    let defaultArray = [];

    if (visArray.length > 0) {

        const hasAgeAdjustedRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Age-adjusted rate')
        )

        const hasRate = visArray.filter(measure =>
            measure.MeasurementType.includes('rate')
        )

        const isRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Rate')
        )

        const hasPercent = visArray.filter(measure =>
            measure.MeasurementType.includes('Percent')
        )

        const hasPercent2 = visArray.filter(measure =>
            measure.MeasurementType.includes('percent')
        )

        const hasDensity = visArray.filter(measure =>
            measure.MeasurementType.includes('Density')
        )


        if (hasAgeAdjustedRate.length) {

            const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
                measure.MeasurementType.includes('Total')
            )
            // Set total as default if available
            if (hasAgeAdjustedRateTotal.length) {
                defaultArray.push(hasAgeAdjustedRateTotal[0]);

            } else {
                defaultArray.push(hasAgeAdjustedRate[0]);
            }


        } else if (hasRate.length) {
            defaultArray.push(hasRate[0]);

        } else if (isRate.length) {
            defaultArray.push(isRate[0]);

        } else if (hasPercent.length) {
            defaultArray.push(hasPercent[0]);

        } else if (hasPercent2.length) {
            defaultArray.push(hasPercent2[0]);

        } else if (hasDensity.length) {
            defaultArray.push(hasDensity[0]);

        } else {
            defaultArray.push(visArray[0]);

        }

        // defaultLinkMeasureTimes = defaultArray[0].AvailableTime; // <<<<<<<<<<

        const defaultPrimaryMeasureId = defaultArray[0].MeasureID;
        const defaultSecondaryMeasureId = defaultArray[0].VisOptions[0].Links[0].Measures[0]?.MeasureID;

        // assigning to global object
        defaultPrimaryLinksMeasureMetadata = defaultArray;

        // console.log("defaultPrimaryLinksMeasureMetadata [setDefaultLinksMeasure]", defaultPrimaryLinksMeasureMetadata);

        // using await here because createJoinedLinksData calls fetch, and we need that data

        let defaultLinksDataMetadata = await createJoinedLinksData(defaultPrimaryMeasureId, defaultSecondaryMeasureId)

        // console.log("defaultLinksDataMetadata [setDefaultLinksMeasure]", defaultLinksDataMetadata);

        // extract secondary metadata from data function return, assign to global object

        defaultSecondaryMeasureMetadata = defaultLinksDataMetadata.secondaryMeasureMetadata;

        // console.log("defaultSecondaryMeasureMetadata [setDefaultLinksMeasure]", defaultSecondaryMeasureMetadata);
        
        // extract data element from data function return, assign to global object

        // console.log("defaultLinksDataMetadata.data", defaultLinksDataMetadata.data);

        joinedLinksDataObjects = defaultLinksDataMetadata.data

        // console.log(">> joinedLinksDataObjects [setDefaultLinksMeasure]", joinedLinksDataObjects);

    }
}



// ===== disparities ================================================== //

const setDefaultDisparitiesMeasure = (visArray) => {

    // console.log("* setDefaultDisparitiesMeasure");

    let defaultArray = [];

    if (visArray.length > 0) {

        const hasAgeAdjustedRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Age-adjusted rate')
        )

        const hasRate = visArray.filter(measure =>
            measure.MeasurementType.includes('rate')
        )

        const isRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Rate')
        )
        
        const hasPercent = visArray.filter(measure =>
            measure.MeasurementType.includes('Percent')
        )

        const hasPercent2 = visArray.filter(measure =>
            measure.MeasurementType.includes('percent')
        )

        const hasDensity = visArray.filter(measure =>
            measure.MeasurementType.includes('Density')
        )


        if (hasAgeAdjustedRate.length) {

            const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
                measure.MeasurementType.includes('Total')
            )
            // Set total as default if available
            if (hasAgeAdjustedRateTotal.length) {
                defaultArray.push(hasAgeAdjustedRateTotal[0]);

            } else {
                defaultArray.push(hasAgeAdjustedRate[0]);

            }


        } else if (hasRate.length) {
            defaultArray.push(hasRate[0]);

        } else if (isRate.length) {
            defaultArray.push(isRate[0]);

        } else if (hasPercent.length) {
            defaultArray.push(hasPercent[0]);

        } else if (hasPercent2.length) {
            defaultArray.push(hasPercent2[0]);

        } else if (hasDensity.length) {
            defaultArray.push(hasDensity[0]);

        } else {
            defaultArray.push(visArray[0]);

        }
    }

    // assigning to global object

    defaultDisparitiesMetadata = defaultArray;
}


// ----------------------------------------------------------------------- //
// tab update functions
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// map
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const updateMapData = (e) => {

    console.log("* updateMapData");

    // ----- handle selection --------------------------------------------------- //

    let measureId;
    let time;
    let geo;

    if (typeof e.target.dataset.measureId != 'undefined') {

        // console.log("measureId", e.target.dataset);
        
        // get meaasureId of selected dropdown element
        
        measureId = parseInt(e.target.dataset.measureId);
        
        time = $('.maptimesbutton.active').attr("data-time")
        geo = $('.mapgeosbutton.active').attr("data-geo")

        // console.log(">>> measure", "measureId", measureId, "time", time);

        // persistent selection
        
        // measures
        
        $('.mapmeasuresbutton').removeClass("active");
        $('.mapmeasuresbutton').attr('aria-selected', false);

        // allow map to persist when changing tabs

        selectedMapMeasure = true;

    }
    
    if (typeof e.target.dataset.geo != 'undefined') {
        
        // console.log("geo", e.target.dataset);

        // get selected geo
        
        geo = String(e.target.dataset.geo);

        measureId = $('.mapmeasuresbutton.active').attr("data-measure-id")
        time = $('.maptimesbutton.active').attr("data-time")

        // console.log("*geo*:", geo, "*measureId*:", measureId, "*time*:", time);

        // persistent selection

        // geos

        $('.mapgeosbutton').removeClass("active");
        $('.mapgeosbutton').attr('aria-selected', false);

        // allow map to persist when changing tabs

        selectedMapGeo = true;

    }

    if (typeof e.target.dataset.time != 'undefined') {
        
        // console.log("time", e.target.dataset);

        // get selected time
        
        time = String(e.target.dataset.time);

        measureId = $('.mapmeasuresbutton.active').attr("data-measure-id")
        geo = $('.mapgeosbutton.active').attr("data-geo")

        // console.log(">>> time", "measureId", measureId, "time", time);

        // persistent selection

        // times

        $('.maptimesbutton').removeClass("active");
        $('.maptimesbutton').attr('aria-selected', false);

        // allow map to persist when changing tabs

        selectedMapTime = true;

    }


    // console.log("*measureId*", measureId, "*geo*", geo, "*time*", time);
    // console.log("geo", geo);
    // console.log("measureId", measureId);
    // console.log("time", time);


    // ----- get metatadata for selected measure --------------------------------------------------- //

    selectedMapMetadata = mapMeasures.filter(m => m.MeasureID == measureId);
    
    const measure = selectedMapMetadata[0].MeasurementType;
    const about   = selectedMapMetadata[0].how_calculated;
    const sources = selectedMapMetadata[0].Sources;


    // ----- set measure info boxes --------------------------------------------------- //

    // "indicatorName" is set in loadIndicator

    selectedMapAbout   = `<p><strong>${measure}:</strong> ${about}</p>`;
    selectedMapSources = `<p><strong>${measure}:</strong> ${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedMapAbout, selectedMapSources);


    // ----- create dataset --------------------------------------------------- //

    // filter map data using selected measure and time

    filteredMapData =
        mapData.filter(
            obj => obj.MeasureID == measureId &&
            obj.TimePeriod == time &&
            prettifyGeoType(obj.GeoType) == geo
        );

    // console.log("filteredMapData [updateMapData]", filteredMapData);


    // ----- format dropdowns --------------------------------------------------- //

    // set this element as active & selected

    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // called before renderMap in case it fails, so dropdowns will show available combos

    handleMapTimeDropdown(measureId, geo)
    handleMapGeoDropdown(measureId, time)
    
    // ----- render the map --------------------------------------------------- //

    renderMap(filteredMapData, selectedMapMetadata);

    updateChartPlotSize();

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// trend
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== normal trend ================================================== //

const updateTrendData = (e) => {

    console.log("* updateTrendData");

    // ----- handle selection --------------------------------------------------- //

    // get meaasureId of selected dropdown element

    const measureId = parseInt(e.target.dataset.measureId);

    // persistent selection

    // remove active class from every list element
    $('.trendbutton').removeClass("active");
    $('.trendbutton').attr('aria-selected', false);

    // also comparisons, which is in this combinded dropdown
    $('.comparisonsbutton').removeClass("active");
    $('.comparisonsbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // ----- get metatadata for selected measure --------------------------------------------------- //

    // trendMeasures is created by renderMeasures, which evals before this would be called

    let selectedTrendMetadata = trendMeasures.filter(m => m.MeasureID == measureId);

    const measure = selectedTrendMetadata[0].MeasurementType;
    const about   = selectedTrendMetadata[0].how_calculated;
    const sources = selectedTrendMetadata[0].Sources;

    aqSelectedTrendMetadata = aq.from(selectedTrendMetadata)
        .derive({
            IndicatorLabel: aq.escape(indicatorName),
            ComparisonName: aq.escape('Boroughs')
        })

    // console.log(">>> aqSelectedTrendMetadata");
    // aqSelectedTrendMetadata.print()

    // ----- set measure info boxes --------------------------------------------------- //

    selectedTrendAbout   = `<p><strong>${measure}</strong>: ${about}</p>`;
    selectedTrendSources = `<p><strong>${measure}</strong>: ${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedTrendAbout, selectedTrendSources);


    // ----- create dataset --------------------------------------------------- //

    // created filtered trend data, to be passed to render function

    filteredTrendData = trendData
        .filter(m => m.MeasureID === measureId)

    // console.log("filteredTrendData [updateTrendData]", filteredTrendData);


    // ----- render the chart --------------------------------------------------- //

    // chart only the annual average for the following measureIds:
    // 365 - PM2.5 (Fine particles), Mean
    // 370 - Black carbon, Mean
    // 375 - Nitrogen dioxide, Mean
    // 391 - Nitric oxide, Mean

    const measureIdsAnnualAvg = [365, 370, 375, 391];

    // chart only the summer average for the following measureIds:
    // 386 - Ozone (O3), Mean

    const measureIdsSummer = [386];

    if (measureIdsAnnualAvg.includes(measureId)) {

        const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.TimePeriod.startsWith('Annual Average'));

        let aqFilteredTrendDataAnnualAvg = aq.from(filteredTrendDataAnnualAvg);

        renderComparisonsChart(aqFilteredTrendDataAnnualAvg, aqSelectedTrendMetadata);

        updateChartPlotSize();

    } else if (measureIdsSummer.includes(measureId)) {

        const filteredTrendDataSummer = filteredTrendData.filter(d => d.TimePeriod.startsWith('Summer'));

        let aqFilteredTrendDataSummer = aq.from(filteredTrendDataSummer);

        renderComparisonsChart(aqFilteredTrendDataSummer, aqSelectedTrendMetadata);

        updateChartPlotSize();

    } else {

        let aqFilteredTrendData = aq.from(filteredTrendData);

        renderComparisonsChart(aqFilteredTrendData, aqSelectedTrendMetadata);

        updateChartPlotSize();

    }

    // allow trend chart to persist when changing tabs

    selectedTrendMeasure = true;
    selectedComparison = false;
    showingNormalTrend = true;
    showingComparisonsTrend = false;

}


// ===== trend comparisons ================================================== //

const updateTrendComparisonsData = (e) => {

    console.log("* updateTrendComparisonsData");

    // ----- handle selection --------------------------------------------------- //

    // get meaasureId of selected dropdown element

    const comparisonId = parseInt(e.target.dataset.comparisonId);

    // console.log("comparisonId", comparisonId);

    // persistent selection

    // remove active class from every list element
    $('.comparisonsbutton').removeClass("active");
    $('.comparisonsbutton').attr('aria-selected', false);

    // also trend, which is in this combinded dropdown
    $('.trendbutton').removeClass("active");
    $('.trendbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);


    // ----- set measure info boxes --------------------------------------------------- //

    // reset info boxes

    selectedComparisonAbout = [];
    selectedComparisonSources = [];

    // reset info boxes

    selectedComparisonAbout = [];
    selectedComparisonSources = [];

    // this iterates over all the indicators and measures in the chosen comparison

    aqCombinedComparisonsMetadata.objects()
        .filter(m => m.ComparisonID == comparisonId)
        .forEach(m => {
            selectedComparisonAbout   += `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.how_calculated}</p>`;
            selectedComparisonSources += `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.Sources}</p>`;
        })

    // render the measure info boxes

    renderAboutSources(selectedComparisonAbout, selectedComparisonSources);


    // ----- create dataset --------------------------------------------------- //

    // keep just the clicked comparison

    aqFilteredComparisonsMetadata = aqComparisonsMetadata
        .filter(aq.escape(d => d.ComparisonID == comparisonId))
        .join(aqComparisonsIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

    // console.log("aqFilteredComparisonsMetadata:");
    // aqFilteredComparisonsMetadata.print()
    
    // use filtered metadata to filter data

    // console.log("&&&& print x 4 [updateTrendComparisonsData]");

    aqFilteredComparisonsData = aqFilteredComparisonsMetadata
        .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
        .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])
        .join(timeTable, [["TimePeriodID"], ["TimePeriodID"]])

        // put host indicator first, so it gets the black line
        .orderby(aq.desc(aq.escape(d => d.IndicatorID == indicatorId)))
    
    // show only last 3 years of DWQ measures with quarterly data

    let hasQuarters = [858, 859, 860, 861, 862, 863];

    if (aqFilteredComparisonsMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {

        // console.log(">>>> aqFilteredComparisonsData [quarters]:");

        aqFilteredComparisonsData = aqFilteredComparisonsData
            .derive({"year": d => op.year(d.end_period)})
            .filter(d => d.year > op.max(d.year) - 3)
            .select(aq.not("TimePeriodID", "year"))
            .reify()
            // .print(20)

    }

    // console.log(">>>> aqFilteredComparisonsData [updateTrendComparisonsData]");
    // aqFilteredComparisonsData.print()


    // ----- render the chart --------------------------------------------------- //

    renderComparisonsChart(
        aqFilteredComparisonsData,
        aqFilteredComparisonsMetadata
    );

    updateChartPlotSize();

    // allow comparisons chart to persist when changing tabs

    selectedComparison = true;
    selectedTrendMeasure = false;
    showingNormalTrend = false;
    showingComparisonsTrend = true;

}


// ===== links ================================================== //

const updateLinksData = async (e) => {

    console.log("* updateLinksData");

    // ---- handle selection --------------------------------------------------- //

    // persistent selection

    // remove active class from every list element
    $('.linksbutton').removeClass("active");
    $('.linksbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // get meaasureIds of selected dropdown element

    const primaryMeasureId = parseInt(e.target.dataset.primaryMeasureId);
    const secondaryMeasureId = parseInt(e.target.dataset.secondaryMeasureId);


    // ----- create links data --------------------------------------------------- //

    // call createJoinedLinksData, which creates joinedLinksDataObjects

    let selectedLinksDataMetadata = await createJoinedLinksData(primaryMeasureId, secondaryMeasureId)

    // - - - primary measure metadata - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // extract secondary metadata from data function return, assign to global object

    selectedPrimaryMeasureMetadata = selectedLinksDataMetadata.primaryMeasureMetadata;

    // - - - secondary measure metadata - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // extract secondary metadata from data function return, assign to global object

    selectedSecondaryMeasureMetadata = selectedLinksDataMetadata.secondaryMeasureMetadata;

    // console.log("selectedSecondaryMeasureMetadata [updateLinksData]", selectedSecondaryMeasureMetadata);
    
    // extract data element from data function return, assign to global object

    joinedLinksDataObjects = selectedLinksDataMetadata.data

    // console.log(">> joinedLinksDataObjects [updateLinksData]", joinedLinksDataObjects);


    // ----- get indicator name for secondary measure --------------------------------------------------- //

    // for all indicators, get the ones that are linked to the current indicator

    const linksSecondaryIndicator = indicators.filter(
        indicator => indicator.Measures.some(
            m => m.MeasureID === secondaryMeasureId
        )
    )


    // get indicator names, for chart + about & sources

    primaryIndicatorName   = indicatorName // created in loadIndicator
    secondaryIndicatorName = linksSecondaryIndicator[0].IndicatorName

    // extract metadata for about & sources boxes

    const primaryMeasurementType   = selectedPrimaryMeasureMetadata[0].MeasurementType;
    const secondaryMeasurementType = selectedSecondaryMeasureMetadata[0].MeasurementType;

    const primaryAbout   = selectedPrimaryMeasureMetadata[0].how_calculated;
    const secondaryAbout = selectedSecondaryMeasureMetadata[0].how_calculated;

    const primarySources   = selectedPrimaryMeasureMetadata[0].Sources;
    const secondarySources = selectedSecondaryMeasureMetadata[0].Sources;


    // ----- set measure info boxes --------------------------------------------------- //

    selectedLinksAbout =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primaryAbout}</p>
        <p><strong>${secondaryIndicatorName} - ${secondaryMeasurementType}</strong>: ${secondaryAbout}</p>`;

    selectedLinksSources =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primarySources}</p>
        <p><strong>${secondaryIndicatorName} - ${secondaryMeasurementType}</strong>: ${secondarySources}</p>`;

    // render the measure info boxes

    renderAboutSources(selectedLinksAbout, selectedLinksSources);


    // ----- render the chart --------------------------------------------------- //

    renderLinksChart(
        joinedLinksDataObjects,
        selectedPrimaryMeasureMetadata,
        selectedSecondaryMeasureMetadata,
        primaryIndicatorName,
        secondaryIndicatorName
    );

    updateChartPlotSize();

    // allow links chart to persist when changing tabs

    selectedLinksMeasure = true;


    // ----- handle disparities button --------------------------------------------------- //

    if (disparitiesMeasures.length > 0) {

        // - - - has disparities - - - - - - - - - - - - - - - - - - - - - - - - - - //

        // console.log("has disparities");

        // make sure that the "links" button is active by default

        $("#show-links").addClass("active");
        $("#show-links").removeClass("disabled");
        $("#show-links").attr('aria-disabled', false);
        $("#show-links").attr('aria-selected', true);

        // make disparities inactive and enabled

        $("#show-disparities").removeClass("active");
        $("#show-disparities").removeClass("disabled");
        $("#show-disparities").attr('aria-disabled', false);

        // if disparities is enabled, show the button

        btnToggleDisparities.style.display = "inline";

    } else {

        // - - - no disparities - - - - - - - - - - - - - - - - - - - - - - - - - - //

        // console.log("no disparities");

        // make sure that the "links" button is active by default

        $("#show-links").addClass("active");
        $("#show-links").removeClass("disabled");
        $("#show-links").attr('aria-disabled', false);
        $("#show-links").attr('aria-selected', true);

        // if disparities is disabled, disable the button

        $("#show-disparities").removeClass("active");
        $("#show-disparities").addClass("disabled");
        $("#show-disparities").attr('aria-disabled', true);

        // remove click listeners to button that calls renderDisparitiesChart

        // console.log("btnToggleDisparities [updateLinksData]");
        $(btnToggleDisparities).off()

    }

}


// ----------------------------------------------------------------------- //
// table filtering functions
// ----------------------------------------------------------------------- //

// need to be defined before `renderMeasures`, where they're added as listener callbacks

// ===== time ================================================== //

// ----- add listener on each dropdown item --------------------------------------------------- //

const handleTableTimeFilter = (el) => {

    el.addEventListener('change', (e) => {

        // console.log("e", e);

        if (e.target.checked) {

            // selectedTableTimes = [e.target.value]
            selectedTableTimes.push(e.target.value)

        } else {

            // if the selected element is not checked, remove it from table times

            let index = selectedTableTimes.indexOf(e.target.value);

            if (index !== -1) {
                selectedTableTimes.splice(index, 1);
            }
        }
        renderTable()
    })
}

// ===== geo ================================================== //

const handleTableGeoFilter = (el) => {

    el.addEventListener('change', (e) => {

        if (e.target.checked) {
            selectedTableGeography.push(e.target.value)
        } else {
            selectedTableGeography = selectedTableGeography.filter(item => item !== e.target.value);
        }

        // only render table if a geography is checked

        if (selectedTableGeography.length > 0) {
            renderTable()

        } else {
            document.querySelector("#tableID").innerHTML = '';
        }
    })
}


// ----------------------------------------------------------------------- //
// functions to handle map dropdowns
// ----------------------------------------------------------------------- //

// ===== time period ================================================== //

const handleMapTimeDropdown = (MeasureID, GeoType) => {

    let allTimeButtons = document.querySelectorAll('.maptimesbutton');

    let mapTimesAvailable =
        [...new Set(
            aqMapTimesGeos
                .filter(aq.escape(
                    obj => obj.MeasureID == MeasureID && 
                        prettifyGeoType(obj.GeoType) == GeoType
                ))
                .array("TimePeriod")
        )]

    // console.log("mapTimesAvailable [handleMapTimeDropdown]", mapTimesAvailable);

    // - - - format - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // remove unavailable class from every time period button

    $(allTimeButtons).removeClass("unavailable");

    // now add unavailable class for time periods not available for this geo type

    for (const button of allTimeButtons) {

        if (!mapTimesAvailable.includes(button.dataset.time)) {
            
            // set this element as disabled
            $(button).addClass("unavailable");
            
        }
    }

}


// ===== geo type ================================================== //

const handleMapGeoDropdown = (MeasureID, TimePeriod) => {

    let allGeoButtons = document.querySelectorAll('.mapgeosbutton');

    let mapGeosAvailable =
        [...new Set(
            mapData
                .filter(obj => obj.MeasureID == MeasureID && obj.TimePeriod == TimePeriod)
                .map(d => prettifyGeoType(d.GeoType))
        )]

    // console.log("mapGeosAvailable [handleMapGeoDropdown]", mapGeosAvailable);

    // - - - format - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // remove unavailable class from every geo type button

    $(allGeoButtons).removeClass("unavailable");

    // now add unavailable class for time periods not available for this geo type

    for (const button of allGeoButtons) {

        if (!mapGeosAvailable.includes(button.dataset.geo)) {
            
            // set this element as disabled
            $(button).addClass("unavailable");
            
        }
    }

}


// ----------------------------------------------------------------------- //
// function to toggle links / disparities
// ----------------------------------------------------------------------- //

const clickLinksToggle = (e) => {

    // console.log("btnToggleDisparities [clickLinksToggle]");
    $(btnToggleDisparities).off()

    $(btnToggleDisparities).on("click", (e) => {

        // console.log("btnToggleDisparities", e);

        if (e.target && e.target.matches("#show-disparities") && !e.target.classList.contains("active") && !e.target.classList.contains("disabled")) {

            // MeasureID: 221 = neighborhood poverty percent

            // console.log("renderDisparitiesChart [clickLinksToggle]");

            renderDisparitiesChart(defaultDisparitiesMetadata, 221)

        } else if (e.target && e.target.matches("#show-links") && !e.target.classList.contains("active") && !e.target.classList.contains("disabled")) {

            showLinks();

        }
    })
}


// ----------------------------------------------------------------------- //
// function to render the measures
// ----------------------------------------------------------------------- //

const renderMeasures = async () => {

    console.log("* renderMeasures");

    selectedTableTimes = [];
    selectedTableGeography = [];

    const contentTable = document.querySelector('#tab-table');
    const contentMap   = document.querySelector('#tab-map')
    const contentTrend = document.querySelector('#tab-trend');
    const contentLinks = document.querySelector('#tab-links');

    // console.log("contentTrend", contentTrend);

    // ----- set dropdowns for this indicator ================================================== //

    const dropdownTableGeos = contentTable.querySelector('div[aria-labelledby="dropdownTableGeos"]');
    const dropdownTableTimes = contentTable.querySelector('div[aria-labelledby="dropdownTableTimes"]');

    const dropdownTrendComparisons = contentTrend.querySelector('div[aria-labelledby="dropdownTrendComparisons"]');

    const dropdownMapMeasures = contentMap.querySelector('div[aria-labelledby="dropdownMapMeasures"]');
    const dropdownMapTimes = contentMap.querySelector('div[aria-labelledby="dropdownMapTimes"]');
    const dropdownMapGeos = contentMap.querySelector('div[aria-labelledby="dropdownMapGeos"]');

    const dropdownLinksMeasures = contentLinks.querySelector('div[aria-labelledby="dropdownLinksMeasures"]');

    // console.log("dropdownTrendComparisons", dropdownTrendComparisons);


    // clear Measure Dropdowns

    dropdownTableGeos.innerHTML = ``;
    dropdownTableTimes.innerHTML = ``;

    dropdownTrendComparisons.innerHTML = ``;

    dropdownMapMeasures.innerHTML = ``;
    dropdownMapTimes.innerHTML = ``;
    dropdownMapGeos.innerHTML = ``;

    dropdownLinksMeasures.innerHTML = ``;

    // clear measure arrays

    mapMeasures = [];
    trendMeasures = [];
    linksMeasures = [];
    disparitiesMeasures = [];


    // ----- create dropdowns for table ================================================== //

    // ----- select all --------------------------------------------------- //

    dropdownTableTimes.innerHTML +=
        `<label class="dropdown-item checkbox-time-all"><input class="largerCheckbox" type="checkbox" name="time" value="all" /> Select all </label>`

    // ----- times --------------------------------------------------- //

    const tableTimes = [...new Set(aqTableTimesGeos.array("TimePeriod"))];

    // console.log("tableTimes", tableTimes);

    tableTimes.forEach((time, index) => {

        if (index === 0) {

            // default to most recent time

            selectedTableTimes = [time];

            dropdownTableTimes.innerHTML +=
                `<label class="dropdown-item checkbox-time"><input class="largerCheckbox" type="checkbox" name="time" value="${time}" checked /> ${time}</label>`;

        } else {

            dropdownTableTimes.innerHTML +=
                `<label class="dropdown-item checkbox-time"><input class="largerCheckbox" type="checkbox" name="time" value="${time}" /> ${time}</label>`;
        }

    });


    // ----- geo types --------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [... new Set(aqTableTimesGeos.array("GeoType").map(gt => prettifyGeoType(gt)))]
    const dropdownTableGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g))

    // console.log("tableGeoTypes:", tableGeoTypes);
    // console.log("geoTypes:", geoTypes);
    // console.log("dropdownTableGeoTypes:", dropdownTableGeoTypes);

    dropdownTableGeoTypes.forEach(geo => {

        selectedTableGeography.push(geo);
        
        // console.log("selectedTableGeography:", selectedTableGeography);

        dropdownTableGeos.innerHTML += `<label class="dropdown-item checkbox-geo"><input class="largerCheckbox" type="checkbox" value="${geo}" checked /> ${geo}</label>`;

    });


    // ----- create dropdowns for map ================================================== //

    // ----- geo types --------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const mapGeoTypes = [... new Set(aqMapTimesGeos.array("GeoType").map(gt => prettifyGeoType(gt)))]
    const dropdownMapGeoTypes = geoTypes.filter(g => mapGeoTypes.includes(g))

    // console.log("geoTypes:", geoTypes);
    // console.log("mapGeoTypes:", mapGeoTypes);
    // console.log("dropdownMapGeoTypes:", dropdownMapGeoTypes);

    dropdownMapGeoTypes.forEach(geo => {

        // selectedTableGeography.push(geo);
        
        // console.log("selectedTableGeography:", selectedTableGeography);

        dropdownMapGeos.innerHTML += `<button class="dropdown-item link-time mapgeosbutton pl-2"
            data-geo="${geo}">
            ${geo}
            </button>`;

    });


    // ----- times --------------------------------------------------- //

    const mapTimes = [... new Set(aqMapTimesGeos.array("TimePeriod"))]

    // console.log("mapTimes", mapTimes);

    mapTimes.map(time => {

        dropdownMapTimes.innerHTML += `<button class="dropdown-item link-time maptimesbutton pl-2"
            data-time="${time}">
            ${time}
            </button>`;

    });


    // ===== handle measures for this indicator ================================================== //

    let header = "";

    indicatorMeasures.map((measure, index) => {

        // console.log("index", index);
        // console.log("measure", measure);

        // check to see if the different viz types exist for this measure
        // if a viz type exists, the "aq[type]TimesGeos" arquero table for the measure should have > 0 rows

        const map         = aqMapTimesGeos   && aqMapTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const trend       = aqTrendTimesGeos && aqTrendTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const links       = measure.VisOptions[0].Links && measure.VisOptions[0].Links[0].Measures[0].MeasureID;
        const disparities = measure.VisOptions[0].Links[0].Disparities == 1
        const comparisons = indicatorComparisonId;
        
        const type  = measure.MeasurementType;
        const measureId = measure.MeasureID;

        // console.log("measure", measure.MeasureID, "type", type, "links", links, "map", map, "trend", trend);

        // console.log("disparities", measureId, measure.VisOptions[0].Links[0].Disparities);


        // ----- handle map measures --------------------------------------------------- //

        if (map) {
            
            mapMeasures.push(measure)
            
            dropdownMapMeasures.innerHTML += `<button class="dropdown-item link-measure mapmeasuresbutton pl-2"
                data-measure-id="${measureId}">
                ${type}
                </button>`;
            
        }


        // ----- handle trend measures --------------------------------------------------- //

        if (trend) {

            // console.log(">>>> trend");

            trendMeasures.push(measure)

            // if header hasn't been assigned yet, make it "Geography". If it's already been 
            //  assigned, make it 'undefined', which suppresses the header via the ternary. 
            //  This prevents us from having to map over indicatorMeasures twice.
            
            if (header === "") {
                header = "Geography";

            } else if (header === "Geography") {
                header = undefined;

            } else {
                header = undefined;
            }

            // console.log("header", header);
            // console.log("index", index);

            dropdownTrendComparisons.innerHTML += header ? '<div class="dropdown-title pl-2"><strong>' + header + '</strong></div>' : '';

            if (trendData) {
                dropdownTrendComparisons.innerHTML += `<button class="dropdown-item trendbutton pl-3"
                data-measure-id="${measureId}">
                ${type}
                </button>`;
            }
        }


        // ----- handle links measures --------------------------------------------------- //

        if (links) {

            // create linked measures object

            linksMeasures.push(measure)

            // get secondary measure id

            if (tableData) {

                dropdownLinksMeasures.innerHTML +=
                    `<div class="dropdown-title pl-2"><strong> ${type}</strong></div>`;

                measure?.VisOptions[0].Links[0].Measures?.map(link => {

                    // console.log("link", link);

                    const linksSecondaryIndicator = indicators.filter(indicator =>
                        indicator.Measures.some(m =>
                            m.MeasureID === link.MeasureID
                        )
                    );

                    const defaultSecondaryMeasureMetadata = linksSecondaryIndicator[0]?.Measures?.filter(m =>
                        m.MeasureID === link.MeasureID
                    );

                    // console.log("defaultSecondaryMeasureMetadata", defaultSecondaryMeasureMetadata);

                    dropdownLinksMeasures.innerHTML +=
                        `<button class="dropdown-item linksbutton pl-3"
                            data-primary-measure-id="${measureId}"
                            data-measure-id="${measure.MeasureID}"
                            data-secondary-measure-id="${link.MeasureID}">
                            ${defaultSecondaryMeasureMetadata[0]?.MeasureName}
                        </button>`;

                });
            }
        }


        // ----- handle disparities measures --------------------------------------------------- //

        if (disparities) {

            disparitiesMeasures.push(measure)

        }

        // ----- set all measure about & source here --------------------------------------------------- //

        measureAbout   += `<p><strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}</p>`;
        measureSources += `<p><strong>${measure.MeasurementType}:</strong> ${measure.Sources}</p>`;
        

    });

    // console.log("disparitiesMeasures [renderMeasures]", disparitiesMeasures);


    // ===== handle comparisons viz ================================================== //

    if (indicatorComparisonId) {

        let compLegendTitles = [... new Set(aqCombinedComparisonsMetadata.array("LegendTitle"))]

        compLegendTitles.map(title => {

            let titleGroup = aqCombinedComparisonsMetadata.filter(aq.escape(d => d.LegendTitle == title))

            // add each unique legend title as a header, with the included comparisons underneath

            dropdownTrendComparisons.innerHTML += title ? '<div class="dropdown-title pl-2"><strong>' + title + '</strong></div>' : '';

            let comparisonIDs = [... new Set(titleGroup.array("ComparisonID"))]

            comparisonIDs.map(comp => {

                // console.log("ComparisonID", comp);
                
                let compGroup = titleGroup.filter(aq.escape(d => d.ComparisonID == comp))
                
                let compIndicatorLabel  = [... new Set(compGroup.array("IndicatorLabel"))];
                let compMeasurementType = [... new Set(compGroup.array("MeasurementType"))];
                let compY_axis_title    = [... new Set(compGroup.array("Y_axis_title"))];
                let compGeoTypeName     = [... new Set(compGroup.array("GeoTypeName"))];
                let compGeography       = [... new Set(compGroup.array("Geography"))];
                let compName            = [... new Set(compGroup.array("ComparisonName"))];

                // console.log("compGeography", compGeography);

                // console.log("compGeography", compGeography);
                
                if (compIndicatorLabel.length == 1) {

                    // console.log("1 indicator [Y_axis_title]");
                    // console.log(compY_axis_title);

                    if (compGeoTypeName[0] == "Citywide") {

                    dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                        data-comparison-id="${comp}">
                        ${compY_axis_title}
                        </button>`;

                    } else {
                        // I am very unhappy with this kludge
                        dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                            data-comparison-id="${comp}">
                            ${compGeography[compGeography.length - 1]} 
                            </button>`;
                    }
                    
                } else if (compMeasurementType.length == 1) {

                    // console.log("1 measure [MeasurementType]");
                    // console.log(compMeasurementType);

                    dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                        data-comparison-id="${comp}">
                        ${compMeasurementType}
                        </button>`;
                    
                } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {

                    // console.log("> 1 measure & > 1 indicator [IndicatorMeasure]");
                    // console.log("compIndicatorMeasure", compIndicatorMeasure);
                    // console.log("compName", compName);

                    dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                        data-comparison-id="${comp}">
                        ${compName}
                        </button>`;
                    
                }
                
            })

        })
        
    }

    // ===== set metadata defaults ================================================== //

    setDefaultMapMeasure(mapMeasures);
    setDefaultTrendMeasure(trendMeasures);
    setDefaultDisparitiesMeasure(disparitiesMeasures);

    // set default measure for links; also calls (and waits for) createJoinedLinksData, which creates the joined data

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ================================================== //

    showTable = (e) => {

        console.log("* showTable");

        // ----- handle tab selection --------------------------------------------------- //

        // set hash to summary table

        if (window.location.hash !== '#display=summary' && window.location.hash !== 'display=summary') {
            window.location.hash = 'display=summary';
        }

        currentHash = 'display=summary'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', true);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- set measure info boxes --------------------------------------------------- //

        renderTitleDescription(indicatorShortName, indicatorDesc);
        renderAboutSources(measureAbout, measureSources);


        // ----- render the table --------------------------------------------------- //

        renderTable();

        updateChartPlotSize();

        $($.fn.dataTable.tables(false))
            .DataTable()
            .columns.adjust().draw();

    };


    // ===== map ================================================== //

    showMap = (e) => {

        console.log("* showMap");

        // ----- handle tab selection --------------------------------------------------- //

        // set hash to map

        window.location.hash = 'display=map'
        currentHash = 'display=map'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', true);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);

        // console.log("mapData [showMap]", mapData);

        if (!selectedMapGeo && !selectedMapTime && !selectedMapMeasure) {

            // console.log(">> no selected [showMap]");

            let latest_time;
            let maxGeoPretty;


            // ----- get metatadata for default measure --------------------------------------------------- //

            // get default measure id

            // console.log("mapData [showMap]", mapData);
            // console.log("defaultMapMetadata [showMap]", defaultMapMetadata);

            let defaultMapMeasureId = defaultMapMetadata[0].MeasureID;


            // ----- allow map to persist when changing tabs --------------------------------------------------- //

            // console.log(">> no selectedMapMeasure [showMap]");

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure --------------------------------------------------- //

            // get default measure id

            defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

            // extract metadata for info boxes

            const about   = defaultMapMetadata[0]?.how_calculated;
            const sources = defaultMapMetadata[0].Sources;
            const measure = defaultMapMetadata[0].MeasurementType;


            // ----- set measure info boxes --------------------------------------------------- //

            defaultMapAbout   = `<p><strong>${measure}:</strong> ${about}</p>`;
            defaultMapSources = `<p><strong>${measure}:</strong> ${sources}</p>`;

            // render measure info boxes

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultMapAbout, defaultMapSources);


            // ----- create dataset --------------------------------------------------- //
            
            // - - - default measure - - - - - - - - - - - - - - - - - - - - - - - - - - //

            // filter map data using default measure

            filteredMapData = mapData.filter(
                    obj => obj.MeasureID === defaultMapMeasureId
                );

            // console.log("filteredMapData [no selectedMapMeasure]", filteredMapData);


            // - - - latest time (for default measure) - - - - - - - - - - - - - - - - - - - - - - - - - - //

            // get the latest end_period

            let latest_end_period = Math.max(mapData[0].end_period);

            filteredMapData = filteredMapData.filter(
                    obj => obj.end_period === latest_end_period
                );

            latest_time = filteredMapData[0].TimePeriod

            // console.log("filteredMapData [no selectedMapTime]", filteredMapData);


            // - - - finest geography (for latest data) - - - - - - - - - - - - - - - - - - - - - - - - - - //

            // get the highest GeoRank for this measure and end_period

            let maxGeoRank = Math.max(filteredMapData[0].GeoRank);

            filteredMapData = filteredMapData.filter(
                obj => obj.GeoRank === maxGeoRank
            );

            let maxGeo = filteredMapData[0].GeoType
            maxGeoPretty = prettifyGeoType(maxGeo)

            // console.log("filteredMapData [no selectedMapGeo]", filteredMapData);

            // console.log("maxGeo", maxGeo);
            // console.log("maxGeoPretty", maxGeoPretty);


            // ----- format dropdowns --------------------------------------------------- //

            // called before renderMap in case it fails, so dropdowns will show available combos
            
            handleMapTimeDropdown(defaultMapMeasureId, maxGeoPretty)
            handleMapGeoDropdown(defaultMapMeasureId, latest_time)

            // ----- render the map --------------------------------------------------- //

            // console.log("filteredMapData [showMap 1]", filteredMapData);

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();

            // ----- persistent selection --------------------------------------------------- //

            // remove active class from every list element

            // geos
            $('.mapgeosbutton').removeClass("active");
            $('.mapgeosbutton').attr('aria-selected', false);
            
            // measures
            $('.mapmeasuresbutton').removeClass("active");
            $('.mapmeasuresbutton').attr('aria-selected', false);

            // times
            $('.maptimesbutton').removeClass("active");
            $('.maptimesbutton').attr('aria-selected', false);

            // set this element as active & selected

            let mapGeoEl = document.querySelector(`.mapgeosbutton[data-geo='${maxGeoPretty}']`)
            let mapMeasureEl = document.querySelector(`.mapmeasuresbutton[data-measure-id='${defaultMapMeasureId}']`)
            let mapTimeEl = document.querySelector(`.maptimesbutton[data-time='${latest_time}']`)

            $(mapMeasureEl).addClass("active");
            $(mapMeasureEl).attr('aria-selected', true);

            $(mapTimeEl).addClass("active");
            $(mapTimeEl).attr('aria-selected', true);

            $(mapGeoEl).addClass("active");
            $(mapGeoEl).attr('aria-selected', true);


        } else {

            // if there was a map already, restore it

            // console.log("else [showMap]");

            // ----- set measure info boxes --------------------------------------------------- //

            renderAboutSources(selectedMapAbout, selectedMapSources);

            // ----- get current dropdown values --------------------------------------------------- //

            let time = $('.maptimesbutton.active').attr("data-time")
            let geo = $('.mapgeosbutton.active').attr("data-geo")
            let measureId = $('.mapmeasuresbutton.active').attr("data-measure-id")

            // console.log("*measureId*", measureId, "*geo*", geo, "*time*", time);

            // ----- format dropdowns --------------------------------------------------- //

            // called before renderMap in case it fails, so dropdowns will show available combos
            
            handleMapTimeDropdown(measureId, geo)
            handleMapGeoDropdown(measureId, time)

            // ----- render the map --------------------------------------------------- //

            // console.log("filteredMapData [showMap 2]", filteredMapData);

            renderMap(filteredMapData, selectedMapMetadata);

            updateChartPlotSize();
        }


    };


    // ===== trend ================================================== //

    // ----- handle tab selection --------------------------------------------------- //

    showTrend = (e) => {

        console.log("* showTrend");

        // set hash to trend

        window.location.hash = 'display=trend'
        currentHash = 'display=trend'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', true);
        tabLinks.setAttribute('aria-selected', false);

        // handle different trend chart types

        // console.log("comparisonsMetadata.length === 0:", comparisonsMetadata.length === 0, "showingNormalTrend:", showingNormalTrend);

        // debugger;

        if (trendMeasures.length + comparisonsMetadata.length === 1) {

            dropdownTrendComparisons.setAttribute('aria-disabled', true);
            $('#dropdownTrendComparisons').addClass("disabled");

        } else {

            dropdownTrendComparisons.setAttribute('aria-disabled', false);
            $('#dropdownTrendComparisons').removeClass("disabled");

        }

        if (trendMeasures.length === 0 || showingComparisonsTrend) {

            // if there's not a normal trend availbale, or we we're looking at a comparisons chart, show comparisons

            showTrendComparisons()

        } else {
            
            // otherwise, show the normal trend

            showNormalTrend()

        }

    }

    // ----- show the normal trend chart --------------------------------------------------- //

    showNormalTrend = (e) => {

        console.log("** showNormalTrend");

        // chart only the annual average for the following measureIds:
        // 365 - PM2.5 (Fine particles), Mean
        // 370 - Black carbon, Mean
        // 391 - Nitric oxide, Mean
        // 375 - Nitrogen dioxide, Mean

        const measureIdsAnnualAvg = [365, 370, 375, 391];

        // chart only the summer average for the following measureIds:
        // 386 - Ozone (O3), Mean

        const measureIdsSummer = [386];

        // ----- allow chart to persist when changing tabs --------------------------------------------------- //

        // console.log("selectedTrendMeasure", selectedTrendMeasure);

        if (!selectedTrendMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function


            // ----- get metatadata for default measure --------------------------------------------------- //

            const about   = defaultTrendMetadata[0]?.how_calculated;
            const sources = defaultTrendMetadata[0].Sources;
            const measure = defaultTrendMetadata[0].MeasurementType;
            // const times   = defaultTrendMetadata[0].VisOptions[0].Trend[0]?.TimePeriod;

            aqDefaultTrendMetadata = aq.from(defaultTrendMetadata)
                .derive({
                    IndicatorLabel: aq.escape(indicatorName),
                    ComparisonName: aq.escape('Boroughs')
                })

            // console.log("aqDefaultTrendMetadata");
            // aqDefaultTrendMetadata.print()


            // ----- set measure info boxes --------------------------------------------------- //

            defaultTrendAbout   = `<p><strong>${measure}</strong>: ${about}</p>`;
            defaultTrendSources = `<p><strong>${measure}</strong>: ${sources}</p>`;

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultTrendAbout, defaultTrendSources);


            // ----- create dataset --------------------------------------------------- //

            const defaultTrendMeasureId = defaultTrendMetadata[0].MeasureID;

            filteredTrendData = trendData
                .filter(m => m.MeasureID === defaultTrendMeasureId)

            // console.log("filteredTrendData [showNormalTrend]", filteredTrendData);

            // ----- render the chart --------------------------------------------------- //

            // using 'aqFilteredTrendData' for all of the datasets allows the "else selected" block to use
            //  this same dataset. It will be whatever was most recently assigned to it.

            if (measureIdsAnnualAvg.includes(defaultTrendMeasureId)) {

                // console.log("measureIdsAnnualAvg.includes(defaultTrendMeasureId)");
                
                const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.TimePeriod.startsWith('Annual Average'));
                aqFilteredTrendData = aq.from(filteredTrendDataAnnualAvg);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);

                updateChartPlotSize();
                
            } else if (measureIdsSummer.includes(defaultTrendMeasureId)) {

                // console.log("measureIdsSummer.includes(defaultTrendMeasureId)");
                
                const filteredTrendDataSummer = filteredTrendData.filter(d => d.TimePeriod.startsWith('Summer'));
                aqFilteredTrendData = aq.from(filteredTrendDataSummer);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);

                updateChartPlotSize();
                
            } else {

                // console.log(">>>>> else");

                aqFilteredTrendData = aq.from(filteredTrendData);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);
                
                updateChartPlotSize();
                
            }


            // ----- persistent selection --------------------------------------------------- //

            // remove active class from every list element
            $('.trendbutton').removeClass("active");
            $('.trendbutton').attr('aria-selected', false);

            // also comparisons, which is in this combinded dropdown
            $('.comparisonsbutton').removeClass("active");
            $('.comparisonsbutton').attr('aria-selected', false);

            // set this element as active & selected

            let trendMeasureEl = document.querySelector(`.trendbutton[data-measure-id='${defaultTrendMeasureId}']`)

            $(trendMeasureEl).addClass("active");
            $(trendMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes --------------------------------------------------- //

            renderAboutSources(selectedTrendAbout, selectedTrendSources);

            // ----- render the chart --------------------------------------------------- //
            
            aqFilteredTrendData = aq.from(filteredTrendData);

            renderComparisonsChart(aqFilteredTrendData, aqSelectedTrendMetadata);

            updateChartPlotSize();

        }

        showingNormalTrend = true;
        showingComparisonsTrend = false;

    };
    

    // ----- show the trend comparisons chart --------------------------------------------------- //

    showTrendComparisons = (e) => {

        console.log("** showTrendComparisons");
        // console.log("selectedComparison", selectedComparison);

        // ----- allow chart to persist when changing tabs --------------------------------------------------- //

        if (!selectedComparison) {

            // console.log("comparisonsMetadata [showTrendComparisons]", comparisonsMetadata);

            // ----- handle selection --------------------------------------------------- //

            // get first comparisonId

            const comparisonId = parseInt(comparisonsMetadata[0].ComparisonID);

            // console.log("comparisonId", comparisonId);

            // persistent selection

            // remove active class from every list element
            $('.comparisonsbutton').removeClass("active");
            $('.comparisonsbutton').attr('aria-selected', false);

            // also trend, which is in this combinded dropdown
            $('.trendbutton').removeClass("active");
            $('.trendbutton').attr('aria-selected', false);

            // set this element as active & selected

            let trendMeasureEl = document.querySelector(`.comparisonsbutton[data-comparison-id='${comparisonId}']`)

            $(trendMeasureEl).addClass("active");
            $(trendMeasureEl).attr('aria-selected', true);


            // ----- set measure info boxes --------------------------------------------------- //

            // reset info boxes

            selectedComparisonAbout = [];
            selectedComparisonSources = [];

            aqComparisonsIndicatorsMetadata.objects().forEach(m => {

                selectedComparisonAbout +=
                    `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.how_calculated}</p>`;

                selectedComparisonSources +=
                    `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.Sources}</p>`;
            })

            // render the measure info boxes

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(selectedComparisonAbout, selectedComparisonSources);


            // ----- create dataset --------------------------------------------------- //

            // metadata

            aqFilteredComparisonsMetadata = aqComparisonsMetadata
                .filter(aq.escape(d => d.ComparisonID == comparisonId))
                .join(aqComparisonsIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

            // console.log("aqFilteredComparisonsMetadata:");
            // aqFilteredComparisonsMetadata.print({limit: Infinity})
            
            // data

            // console.log("&&&& print x 4 [showTrendComparisons]");

            aqFilteredComparisonsData = aqFilteredComparisonsMetadata
                .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
                .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])
                .join(timeTable, [["TimePeriodID"], ["TimePeriodID"]])

                // put host indicator first (then measure), so it gets the black line
                .orderby(aq.desc(aq.escape(d => d.IndicatorID == indicatorId)), d => d.MeasureID)


            // console.log(">>>> aqFilteredComparisonsData [showTrendComparisons 1]");
            // aqFilteredComparisonsData.print()

            // show only last 3 years of DWQ measures with quarterly data

            let hasQuarters = [858, 859, 860, 861, 862, 863];

            if (aqFilteredComparisonsMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {


                aqFilteredComparisonsData = aqFilteredComparisonsData
                    .derive({"year": d => op.year(d.end_period)})
                    .filter(d => d.year > op.max(d.year) - 3)
                    .select(aq.not("TimePeriodID", "year"))
                    .reify()
                
                // console.log(">>>> aqFilteredComparisonsData [quarters]:");
                // aqFilteredComparisonsData.print()

            }

            // console.log(">>>> aqFilteredComparisonsData [showTrendComparisons 2]");
            // aqFilteredComparisonsData.print()


            // ----- render the chart --------------------------------------------------- //

            renderComparisonsChart(
                aqFilteredComparisonsData,
                aqFilteredComparisonsMetadata
            );

            updateChartPlotSize();

        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes --------------------------------------------------- //

            renderAboutSources(selectedComparisonAbout, selectedComparisonSources);

            // ----- render the chart --------------------------------------------------- //

            renderComparisonsChart(
                aqFilteredComparisonsData,
                aqFilteredComparisonsMetadata
            );

            updateChartPlotSize();
            
        }
        
        showingNormalTrend = false;
        showingComparisonsTrend = true;
        
    }


    // ===== links ================================================== //

    // define function

    showLinks = (e) => {

        console.log("* showLinks");

        // ----- handle tab selection --------------------------------------------------- //

        // set hash to links

        window.location.hash = 'display=links'
        currentHash = 'display=links'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', true);

        // make sure the "Link to" button is enabled
        $("#dropdownLinksMeasures").removeClass("disabled");
        $("#dropdownLinksMeasures").attr('aria-disabled', false);


        // conditionals based on if any measures have links or not

        if (linksMeasures.length === 0) {

            // ----- no links --------------------------------------------------- //

            if (disparitiesMeasures.length > 0) {
                
                // - - - has disparities - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // console.log("has disparities");

                // if the tab is selected, show disparities

                if (tabLinksSelected && window.location.hash === '#display=links') {

                    // MeasureID: 221 = neighborhood poverty percent

                    // console.log("renderDisparitiesChart [showLinks (no links, has disp)]");

                    renderDisparitiesChart(defaultDisparitiesMetadata, 221)

                    updateChartPlotSize();

                }

                // make links inactive and disabled

                $("#show-links").removeClass("active");
                $("#show-links").addClass("disabled");
                $("#show-links").attr('aria-disabled', true);

                // make disparities active

                $("#show-disparities").addClass("active");
                $("#show-disparities").removeClass("disabled");
                $("#show-disparities").attr('aria-disabled', false);
                $("#show-disparities").attr('aria-selected', true);

                // turn off click listener
                
                // console.log("btnToggleDisparities [showLinks (no links, has disp)]");
                $(btnToggleDisparities).off()

                // if disparities is enabled, show the button

                btnToggleDisparities.style.display = "inline";

            } else {

                // - - - no disparities - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // conditionals at the end of `renderMeasures` will handle this case

            }

        } else {

            // ----- has links --------------------------------------------------- //

            if (!selectedLinksMeasure) {

                // - - - allow chart to persist when changing tabs - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // console.log(">>> not selected");

                // this is all inside the conditional, because if a user clicks on this tab again
                //  after selecting a measure, we don't want to recompute everything. We'll use the
                //  values created by the update function


                // ----- get metatadata for default measure - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // get first linked measure by default

                const secondaryMeasureId = defaultPrimaryLinksMeasureMetadata[0]?.VisOptions[0].Links[0].Measures[0].MeasureID;

                // console.log("secondaryMeasureId", secondaryMeasureId);

                // get linked indicator's metadata

                const linksSecondaryIndicator = indicators.filter(indicator =>
                    indicator.Measures.some(measure =>
                        measure.MeasureID === secondaryMeasureId
                    )
                )

                // use linked indicator's metadata to get linked measure's metadata

                defaultSecondaryMeasureMetadata = linksSecondaryIndicator[0]?.Measures?.filter(m =>
                    m.MeasureID === secondaryMeasureId
                )

                primaryIndicatorName   = indicatorName;
                secondaryIndicatorName = linksSecondaryIndicator[0]?.IndicatorName;

                // get measure metadata

                const primaryMeasure         = defaultPrimaryLinksMeasureMetadata[0]?.MeasurementType;
                const primaryAbout           = defaultPrimaryLinksMeasureMetadata[0]?.how_calculated;
                const primarySources         = defaultPrimaryLinksMeasureMetadata[0]?.Sources;

                const secondaryMeasure       = defaultSecondaryMeasureMetadata[0]?.MeasurementType;
                const secondaryAbout         = defaultSecondaryMeasureMetadata[0]?.how_calculated;
                const secondarySources       = defaultSecondaryMeasureMetadata[0]?.Sources;


                // ----- set measure info boxes - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // creating indicator & measure info

                defaultLinksAbout =
                    `<p><strong>${primaryIndicatorName} - ${primaryMeasure}</strong>: ${primaryAbout}</p>
                    <p><strong>${secondaryIndicatorName} - ${secondaryMeasure}</strong>: ${secondaryAbout}</p>`;

                defaultLinksSources =
                    `<p><strong>${primaryIndicatorName} - ${primaryMeasure}</strong>: ${primarySources}</p>
                    <p><strong>${secondaryIndicatorName} - ${secondaryMeasure}</strong>: ${secondarySources}</p>`;


                // ----- create dataset - - - - - - - - - - - - - - - - - - - - - - - - - - //

                renderTitleDescription(indicatorShortName, indicatorDesc);
                renderAboutSources(defaultLinksAbout, defaultLinksSources);


                // ----- render the chart - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // joined data and metadata created in createJoinedLinksData called fron setDefaultLinksMeasure

                // console.log("defaultSecondaryMeasureMetadata [showLinks 1]", defaultSecondaryMeasureMetadata);

                renderLinksChart(
                    joinedLinksDataObjects,
                    defaultPrimaryLinksMeasureMetadata,
                    defaultSecondaryMeasureMetadata,
                    primaryIndicatorName,
                    secondaryIndicatorName
                );

                updateChartPlotSize();


                // ----- persistent selection - - - - - - - - - - - - - - - - - - - - - - - - - - //

                // remove active class from every list element
                $('.linksbutton').removeClass("active");
                $('.linksbutton').attr('aria-selected', false);

                // set this element as active & selected

                let linksMeasureEl = document.querySelector(`.linksbutton[data-secondary-measure-id='${secondaryMeasureId}']`)

                $(linksMeasureEl).addClass("active");
                $(linksMeasureEl).attr('aria-selected', true);


                // - - - handle disparities button - - - - - - - - - - - - - - - - - - - - - - - - - - //

                if (disparitiesMeasures.length > 0) {

                    // >>>> has disparities <<<<

                    // console.log("has disparities");
                    
                    // make sure that the "links" button is active by default

                    $("#show-links").addClass("active");
                    $("#show-links").removeClass("disabled");
                    $("#show-links").attr('aria-disabled', false);
                    $("#show-links").attr('aria-selected', true);

                    // make disparities inactive and enabled

                    $("#show-disparities").removeClass("active");
                    $("#show-disparities").removeClass("disabled");
                    $("#show-disparities").attr('aria-disabled', false);

                    // set links/disparities click listener
                    
                    clickLinksToggle()


                    // if disparities is enabled, show the button

                    btnToggleDisparities.style.display = "inline";

                } else {

                    // >>>> no disparities <<<<

                    // console.log("no disparities");
                    
                    // make sure that the "links" button is active by default

                    $("#show-links").addClass("active");
                    $("#show-links").removeClass("disabled");
                    $("#show-links").attr('aria-disabled', false);
                    $("#show-links").attr('aria-selected', true);

                    // if disparities is disabled, disable the button

                    $("#show-disparities").removeClass("active");
                    $("#show-disparities").addClass("disabled");
                    $("#show-disparities").attr('aria-disabled', true);

                    // remove click listeners to button that calls renderDisparitiesChart
                    
                    // console.log("btnToggleDisparities [showLinks (has links, no disp)]");
                    $(btnToggleDisparities).off()

                }


            } else {

                // if there was a chart already, restore it

                // ----- set measure info boxes - - - - - - - - - - - - - - - - - - - - - - - - - - //

                renderAboutSources(selectedLinksAbout, selectedLinksSources);

                // ----- render the chart - - - - - - - - - - - - - - - - - - - - - - - - - - //

                renderLinksChart(
                    joinedLinksDataObjects,
                    selectedPrimaryMeasureMetadata,
                    selectedSecondaryMeasureMetadata,
                    primaryIndicatorName,
                    secondaryIndicatorName
                );

                updateChartPlotSize();
            }
        }

    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // disable tabs and switch to table if there are no measures
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // this is effectively the state of the tabs when the indicator is loaded or changed

    const tabMapSelected   = tabMap.getAttribute('aria-selected');
    const tabTrendSelected = tabTrend.getAttribute('aria-selected');
    const tabLinksSelected = tabLinks.getAttribute('aria-selected');

    const disableTab = (el) => {
        el.classList.add('disabled');
        el.setAttribute('aria-disabled', true);
    }

    const enableTab = (el) => {
        el.classList.remove('disabled');
        el.setAttribute('aria-disabled', false);
    }


    // if there's no data to display for a tab, disable it. If you're on that tab when you switch to
    //  a new indicator (which calls renderMeasures), then switch to the summary table


    // ===== map ================================================== //

    if (mapMeasures.length === 0) {

        if (tabMapSelected && window.location.hash === '#display=map') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        disableTab(tabMap);

    } else {

        enableTab(tabMap);
    }


    // ===== trend ================================================== //

    // if there's no trend data or only 1 time period in all of the measures, don't show the tab

    const onlyOneTime = trendMeasures.every(m => m.VisOptions[0].Trend[0]?.TimePeriodID.length <= 1)

    // debugger;

    // disable trend tab if there are no trend measures (or only 1 time period) and there are no comparisons

    if ((trendMeasures.length === 0 || onlyOneTime) && (typeof comparisonsMetadata === 'undefined' || comparisonsMetadata.length === 0)) {

        // console.log("turn off trend");

        if (tabTrendSelected && window.location.hash === '#display=trend') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        disableTab(tabTrend);

    } else {

        enableTab(tabTrend);
    }

    // console.log("not some disp [renderMeasures]", !disparitiesMeasures.length > 0);


    // ===== links (and disparities) ================================================== //

    // this actually might be superfluous. as long as show and update funs work thru this logic, all the case should be covered.

    if (linksMeasures.length === 0 && disparitiesMeasures.length === 0) {

        // console.log("no links, no disp");

        // - - - no links, no disparities - - - - - - - - - - - - - - - - - - - - - - - - - - //

        // no reason to enable the links tab, so if it's selected switch to table view and disable the tab

        if (tabLinksSelected && window.location.hash === '#display=links') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        // disable the links tab

        disableTab(tabLinks);

    } else {

        enableTab(tabLinks);
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // set tab based on hash
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let hash = window.location.hash.replace('#', "")

    switch (hash) {

        // using fallthrough

        case 'display=summary':
        case 'tab-table':
            $('#tab-btn-table').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=map':
        case 'tab-map':
            $('#tab-btn-map').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=trend':
        case 'tab-trend':
            $('#tab-btn-trend').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=links':
        case 'tab-links':
            $('#tab-btn-links').tab('show');
            window.dispatchEvent(hashchange);
            break;

        default:
            window.dispatchEvent(hashchange);
            $('#tab-btn-table').tab('show');
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // add event listeners to dropdown elements, will call the
    //  respective update functions
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // without custom class, selector would be '[aria-labelledby="dropdownMapMeasures"] button.link-measure'

    let mapMeasuresLinks = document.querySelectorAll('.mapmeasuresbutton');
    let mapTimesLinks = document.querySelectorAll('.maptimesbutton');
    let mapGeosLinks = document.querySelectorAll('.mapgeosbutton');
    let trendMeasuresLinks = document.querySelectorAll('.trendbutton');
    let trendComparisonsLinks = document.querySelectorAll('.comparisonsbutton');
    let linksMeasuresLinks = document.querySelectorAll('.linksbutton');

    // adding click listeners using update functions
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#memory_issues

    mapMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateMapData);
    })

    mapTimesLinks.forEach(link => {
        link.addEventListener('click', updateMapData);
    })

    mapGeosLinks.forEach(link => {
        link.addEventListener('click', updateMapData);
    })

    trendMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateTrendData);
    })

    trendComparisonsLinks.forEach(link => {
        link.addEventListener('click', updateTrendComparisonsData);
    })

    linksMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateLinksData);
    })


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // add event handler functions to summary tab checkboxes
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const checkboxTime    = document.querySelectorAll('.checkbox-time');
    const checkboxTimeAll = document.querySelectorAll('.checkbox-time-all');
    const checkboxGeo     = document.querySelectorAll('.checkbox-geo');

    // single time checkboxes

    checkboxTime.forEach(checkbox => {
        handleTableTimeFilter(checkbox);
    })

    // "select all" time checkbox

    checkboxTimeAll[0].addEventListener('change', (e) => {

        if (!e.target.checked) {

            // console.log("not checked");

            checkboxTime.forEach(checkbox => {

                // console.log("checkbox", checkbox);

                $(checkbox).find("input").prop("checked", false)
                selectedTableTimes = []

            })

            // console.log("selectedTableTimes [not checked]", selectedTableTimes);

        } else if (e.target.checked) {

            // console.log("checked");

            checkboxTime.forEach(checkbox => {

                // console.log("checkbox", checkbox);

                $(checkbox).find("input").prop("checked", true)
                selectedTableTimes.push($(checkbox).find("input").val())

            })

            // console.log("selectedTableTimes [checked]", selectedTableTimes);

        }

        renderTable()

    })

    // single geo checkboxes

    checkboxGeo.forEach(checkbox => {
        handleTableGeoFilter(checkbox);
    })


}

;
// ======================================================================= //
// table.js
// ======================================================================= //

const renderTable = () => {

    console.log("** renderTable");

    // ----------------------------------------------------------------------- //
    // prep data
    // ----------------------------------------------------------------------- //

    // console.log("tableData", tableData);

    const filteredTableTimeData = tableData.filter(d => selectedTableTimes.includes(d.TimePeriod))

    // ----------------------------------------------------------------------- //
    // format geography dropdown checkboxes
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get (pretty) geoTypes available for this time period
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const dataGeos = [...new Set(filteredTableTimeData.map(d => prettifyGeoType(d.GeoType)))];

    // console.log("dataGeos", dataGeos);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get all geo check boxes
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const allGeoChecks = document.querySelectorAll('.checkbox-geo');

    // console.log("allGeoChecks", allGeoChecks);

    let geosNotAvailable = [];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // format
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    // remove disabled class from every geo list element

    $(allGeoChecks).removeClass("disabled");
    $(allGeoChecks).attr('aria-disabled', false);
    
    // now add disabled class for geos not available for this year period

    for (const checkbox of allGeoChecks) {

        if (!dataGeos.includes(checkbox.children[0].value)) {
            
            geosNotAvailable.push(checkbox)
            
            // set this element as disabled
            $(checkbox).addClass("disabled");
            $(checkbox).attr('aria-disabled', true);
            
        }
    }


    // ----------------------------------------------------------------------- //
    // only render table if a geography is checked
    // ----------------------------------------------------------------------- //

    let filteredTableData;

    if (selectedTableGeography.length > 0) {
        
        filteredTableData = 
            filteredTableTimeData
            .filter(d => selectedTableGeography.includes(prettifyGeoType(d.GeoType)))

    } else {
        
        // if no selected geo, then set table to blank and return early

        document.getElementById('summary-table').innerHTML = '';

        return;
    }
    
    // if selected geos not in data, then set table to blank and return early

    if (filteredTableData.length === 0) {

        document.getElementById('summary-table').innerHTML = '';
        
        return;
    }
        
    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const table_unreliability = [...new Set(filteredTableData.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#table-unreliability").innerHTML = "" // blank to start
    document.getElementById("table-unreliability").classList.add('hide') // blank to start


    table_unreliability.forEach(element => {
        
        document.querySelector("#table-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        document.getElementById('table-unreliability').classList.remove('hide')
        
    });
    
    // ----------------------------------------------------------------------- //
    // create html table for DataTables
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // table column alignment
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const measureAlignMap = new Map();
    const measures = [...new Set(filteredTableData.map(d => d.MeasurementDisplay))];
    
    measures.forEach(m => measureAlignMap.set(m, "r"));

    const measureAlignObj = Object.fromEntries(measureAlignMap);
    
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // pivot data so measures are columns
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const filteredTableAqData = aq.from(filteredTableData)
        .groupby("TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
    
        // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
        // .impute(measureImputeObj) 
        
        // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
        .relocate(["TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank"], { before: 0 }) 
    
    // console.log("filteredTableAqData [renderTable]");
    // filteredTableAqData.print({limit: 40})
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // export Arquero table to HTML
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    document.getElementById('summary-table').innerHTML = 
        filteredTableAqData.toHTML({
            limit: Infinity,
            align: measureAlignObj, 
            null: () => "-" // use this to replace undefined
        });
    
    // this gives the table an ID (table code generated by Arquero)
    
    document.querySelector('#summary-table table').id = "tableID"
    
    // set some display properties 
    document.querySelector('#summary-table table').className = "cell-border stripe"
    document.querySelector('#summary-table table').width = "100%"
    

    // ----------------------------------------------------------------------- //
    // specify DataTable
    // ----------------------------------------------------------------------- //
    
    const groupColumnTime = 0
    const groupColumnGeo = 1;

    $('#tableID').DataTable({
        scrollY: 525,
        scrollX: true,
        scrollCollapse: true,
        searching: false,
        paging: false,
        select: true,
        buttons: [
            {
                extend: 'csvHtml5',
                name: "thisView",
                filename: 'NYC EH Data Portal - ' + indicatorName + " (filtered)"
            }
        ],
        bInfo: false,
        fixedHeader: true,
        orderFixed: [[ 0, 'desc' ], [ 3, 'asc' ]], // GeoRank
        columnDefs: [
            { type: 'natural', targets: '_all' },
            { targets: [0, 1, 2, 3], visible: false}
        ],
        "createdRow": function ( row, data, index ) {
            const time    = data[0];
            const GeoTypeDesc = data[1];
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-group`, `${time}-${GeoTypeDesc}`)
                row.setAttribute(`data-time`, `${time}`);
            }
        },
        "drawCallback": function ( settings ) {
            const api = this.api();
            const data = api.rows( {page:'current'} ).data()
            const rows = api.rows( {page:'current'} ).nodes();
            const totaleColumnsCount = api.columns().count()
            const visibleColumnsCount =  totaleColumnsCount - 4;
            
            let last = null;
            let lastTime = null;
            
            const createGroupRow = (groupColumn, lvl) => {

                // console.log("groupColumn", groupColumn);
                // console.log("lvl", lvl);
                
                api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {

                    // console.log("group", group);
                    // console.log("i", i);
                    
                    const time = data[i][0]
                    const groupName = `${time}-${group}`
                    
                    // console.log("time", time);

                    if ( last !== group || lastTime !== time ) {
                        
                        $(rows).eq( i ).before(
                            `<tr class="group"><td colspan="${visibleColumnsCount}" data-time="${time}" data-group="${group}" data-group-level="${lvl}"> ${group}</td></tr>`
                            );
                            last = group;
                            lastTime = time
                            
                    }
                });
            }
            
            createGroupRow(groupColumnTime, 0);
            createGroupRow(groupColumnGeo, 1);
            handleToggle();
        }
    })

}


// ----------------------------------------------------------------------- //
// handler functions for summary table
// ----------------------------------------------------------------------- //

const handleToggle = () => {

    $('body').off('click', '#summary-table tr.group td');
    $('body').on('click', '#summary-table tr.group td', (e) => {

        const td = $(e.target);
        const tr = td.parent();
        const group = td.data('group');
        const groupLevel = td.data('group-level');

        const handleGroupToggle = () => {

            const subGroupToggle = $(`td[data-time="${group}"][data-group-level="1"]`);
            const subGroupRow = $(`tr[data-time="${group}"]`);

            if (subGroupToggle.css('display') === 'none') {

                subGroupToggle.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                td.removeClass('hidden');
                subGroupToggle.show();
                subGroupRow.show();

            } else {

                subGroupToggle.addClass('hidden');
                subGroupRow.addClass('hidden');
                td.addClass('hidden');
                subGroupToggle.hide();
                subGroupRow.hide();

            }
        }

        const handleSubGroupToggle = () => {

            const subDataGroup = tr.next(`tr`).data(`group`);
            const parentDataGroup = subDataGroup.split('-')[0];
            const subGroupRow = $(`tr[data-group="${subDataGroup}"]`);
            const parentGroupToggle = $(`td[data-group="${parentDataGroup}"]`);

            if (subGroupRow.css('display') == 'none')  {

                subGroupRow.show();
                td.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                parentGroupToggle.removeClass('hidden');

            } else {

                subGroupRow.hide();
                td.addClass('hidden');
                subGroupRow.addClass('hidden');
            }
        }

        if (groupLevel === 0) {

            handleGroupToggle();

        } else {

            handleSubGroupToggle();
            
        }

    });
}

;
// ======================================================================= //
// map.js
// ======================================================================= //

const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");

    // console.log("data [renderMap]", data);
    // console.log("metadata [renderMap]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // debugger;

    // console.log("mapTimes [map.js]", mapTimes);

    console.log(data[0])

    let mapGeoType            = data[0]?.GeoType;
    let geoTypeShortDesc      = data[0]?.GeoTypeShortDesc;
    let GeoTypeDesc           = data[0]?.GeoTypeDesc;
    let mapMeasurementType    = metadata[0]?.MeasurementType;
    let mapGeoTypeDescription = [...new Set(geoTable.filter(aq.escape(d => d.GeoType === mapGeoType)).array("GeoTypeShortDesc"))];
    var displayType;
    var subtitle;
    var isPercent;

    if (mapMeasurementType.includes('Percent') || mapMeasurementType.includes('percent') && !mapMeasurementType.includes('percentile')) {
        isPercent = true
        displayType         = '%'
        subtitle = mapMeasurementType
        
    } else {
        isPercent = false
        displayType         = metadata[0]?.DisplayType;
        subtitle = mapMeasurementType + `${displayType ? ` (${displayType})` : ''}`
    }

    let mapTime = mapTimes[0];
    let topoFile = '';

    // ----------------------------------------------------------------------- //
    // bubble map for non-rates (counts/numbers)
    // ----------------------------------------------------------------------- //
    let markType              = 'geoshape'  
    let encode                = {"shape": {"field": "geo", "type": "geojson"}}
    let strokeWidth = 1.25

    if (mapMeasurementType.includes('Number') ||
        mapMeasurementType.includes('number') || 
        mapMeasurementType.includes('Total population')) {
            markType = 'circle'
            encode = {        
                "latitude": {"field": "Lat", "type": "quantitative"},
                "longitude": {"field": "Long", "type": "quantitative"},
                "size": {"bin": false, "field": "Value","type": "quantitative","scale": {"range": [0,750]},"legend": {
                    "direction": "horizontal",
                    "title": "",
                    "offset": -25,
                    "orient": "top-left",
                    "tickCount": 4,
                    "fill": "color",
                    "gradientLength": {"signal": "clamp(childHeight, 64, 200)"},
                    "encode": {"gradient": {"update": {"opacity": {"value": 0.7}}}},
                    "symbolType": "circle",
                    "size": "size"
      }
                }
                    }
            strokeWidth = 2
            var legend = {}
    } else {        
            markType = 'geoshape'
            encode  = {
                "shape": {"field": "geo", "type": "geojson"}
                    }
            strokeWidth = 1.25
            var legend = {"legend": {
                "direction": "horizontal",
                "orient": "top-left",
                "title": null,
                "tickCount": 3,
                "offset": -25,
                "gradientLength": 200
            }}
    }


    var color = 'purplered'
    var rankReverse = defaultMapMetadata[0].VisOptions[0].Map[0]?.RankReverse
    if (rankReverse === 0) {
        color = 'reds'
    } else if (rankReverse === 1) {
        color = 'blues'
    }

    // console.log('rank reverse?', rankReverse)
    // console.log('color', color)

    // ----------------------------------------------------------------------- //
    // format geography dropdown items
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get (pretty) geoTypes available for this year
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // mapData has all the geos for every year
    // data has the one geo x year we're mapping

    const dataGeos = [...new Set(mapData.filter(d => d.TimePeriod == mapTime).map(d => prettifyGeoType(d.GeoType)))];

    // console.log("dataGeos [renderMap]", dataGeos);

    // if you're on a geo that's not availble for a year you just clicked on, show the gray base map


    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const map_unreliability = [...new Set(data.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#map-unreliability").innerHTML = ""; // blank to start
    document.getElementById("map-unreliability").classList.add('hide')  // blank to start


    map_unreliability.forEach(element => {

        document.querySelector("#map-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        document.getElementById('map-unreliability').classList.remove('hide')

        
    });

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type
    // ----------------------------------------------------------------------- //

    // console.log("mapGeoType [renderMap]", mapGeoType);

    if (mapGeoType === "NTA2010") {
        topoFile = 'NTA_2010.topo.json';
    } else if (mapGeoType === "NTA2020") {
        topoFile = 'NTA_2020.topo.json';
    } else if (mapGeoType === "NYHarbor") {
        topoFile = 'ny_harbor.topo.json';
    } else if (mapGeoType === "CD") {
        topoFile = 'CD.topo.json';
    } else if (mapGeoType === "CDTA2020") {
        topoFile = 'CDTA_2020.topo.json';
    } else if (mapGeoType === "PUMA") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "Subboro") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "UHF42") {
        topoFile = 'UHF42.topo.json';
    } else if (mapGeoType === "UHF34") {
        topoFile = 'UHF34.topo.json';
    } else if (mapGeoType === "NYCKIDS2017") {
        topoFile = 'NYCKids_2017.topo.json';
    } else if (mapGeoType === "NYCKIDS2019") {
        topoFile = 'NYCKids_2019.topo.json';
    } else if (mapGeoType === "NYCKIDS2021") {
        topoFile = 'NYCKids_2021.topo.json';
    } else if (mapGeoType === "Borough") {
        topoFile = 'borough.topo.json';
    }

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    let mapspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": indicatorName,
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start", 
            "fontSize": 18, 
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": subtitle,
            "subtitleFontSize": 13
        },
        "data": {
            "values": data,
            "format": {
                "parse": {
                    "Value": "number"
                }
            }
        },
        "config": {
            "concat": {"spacing": 20}, 
            "view": {"stroke": "transparent"},
            "axisY": {"domain": false,"ticks": false},
            "legend": {"disable": true}
        },
        "projection": {"type": "mercator"},
        "transform": [
            {
                "calculate": `datum.DisplayValue + ' ${displayType}'`,
                "as": "valueLabel"
            }
        ],
        "vconcat": [
            {
                "layer": [
                    {
                        "height": 500,
                        "width": "container",
                        "data": {
                            "url": `${data_repo}${data_branch}/geography/borough.topo.json`,
                            "format": {
                                "type": "topojson",
                                "feature": "collection"
                            }
                        },
                        "mark": {
                            "type": "geoshape",
                            "stroke": "#fafafa",
                            "fill": "#C5C5C5",
                            "strokeWidth": 0.5
                        }
                    }, 
                    // Second neighborhood data layer - for count-dot map underlayer (ok to leave on for rates)
                    {
                        "height": 500,
                        "width": "container",
                        "data": {
                            "url": `${data_repo}${data_branch}/geography/${topoFile}`,
                            "format": {
                                "type": "topojson",
                                "feature": "collection"
                            }
                        },
                        "mark": {
                            "type": "geoshape",
                            "stroke": "#a2a2a2",
                            "fill": "#e7e7e7",
                            "strokeWidth": 0.5
                        }
                    },
                    {
                        "height": 500,
                        "width": "container",
                        "mark": {"type": markType, "invalid": null},
                        "params": [
                            {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
                        ],
                        "transform": [
                            {
                                "lookup": "GeoID",
                                "from": {
                                    "data": {
                                        "url": `${data_repo}${data_branch}/geography/${topoFile}`,
                                        "format": {"type": "topojson", "feature": "collection"}
                                    },
                                    "key": "properties.GEOCODE"
                                },
                                "as": "geo"
                            }
                        ],
                        "encoding": {
                            ...encode,
                            "color": {
                                "condition": {
                                    "test": "isValid(datum.Value)",
                                    "bin": false,
                                    "field": "Value",
                                    "type": "quantitative",
                                    "scale": {"scheme": {"name": color, "extent": [0.125, 1.25]}},
                                    ...legend    
                                },
                                "value": "#808080"
                            },
                            "stroke": {
                                "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                                // "value": "#161616"
                                "value": "#2d2d2d"
                            },
                            "strokeWidth": {
                                "condition": [{"param": "highlight", "empty": false, "value": strokeWidth}],
                                "value": 0.5
                            },
                            "order": {
                                "condition": [{"param": "highlight", "empty": false, "value": 1}],
                                "value": 0
                            },
                            "tooltip": [
                                {
                                    "field": "Geography", 
                                    "title": "Neighborhood"
                                },
                                {
                                    "field": "valueLabel",
                                    "title": `${mapMeasurementType}`
                                },
                                {
                                    "field": "TimePeriod",
                                    "title": "Time period"
                                }
                            ],
                        },
                    }
                ]
            },
            {
                "height": 150,
                "width": "container",
                "config": {
                    "axisY": {
                        "labelAngle": 0,
                        "labelFontSize": 13,
                    }
                },
                "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
                "params": [
                    {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
                ],
                "encoding": {
                    "y": {
                        "field": "Value", 
                        "type": "quantitative", 
                        "title": null,
                        "axis": {
                            "labelAngle": 0,
                            "labelFontSize": 11,
                            "tickCount": 3
                        }
                    },
                    "tooltip": [
                        {
                            "field": "Geography", 
                            "title": "Neighborhood"
                        },
                        {
                            "field": "valueLabel",
                            "title": `${mapMeasurementType}`
                        },
                        {
                            "field": "TimePeriod",
                            "title": "Time period"
                        }
                    ],
                    "x": {"field": "GeoID", "sort": "y", "axis": null},
                    "color": {
                        "bin": false,
                        "field": "Value",
                        "type": "quantitative",
                        "scale": {"scheme": {"name": color, "extent": [0.125, 1.25]}},
                        "legend": false
                    },
                    "stroke": {
                        "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                        "value": "white"
                    },
                    "strokeWidth": {
                        "condition": [{"param": "highlight", "empty": false, "value": 3}],
                        "value": 0
                    }
                }
            }
        ]
    }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#map", mapspec);

    // console.log(mapspec)

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...mapspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${mapMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
        .select(aq.not('GeoRank', "end_period", "start_period", "ban_summary_flag", "GeoTypeShortDesc", "MeasureID", "DisplayValue")) // remove excess columns
    
    // console.log("downloadTable [renderMap]");
    // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}
;
// ======================================================================= //
// links.js
// ======================================================================= //

const renderLinksChart = (
    data,
    primaryMetadata,   // metadata.json for primary indicator
    secondaryMetadata, // metadata.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    // console.log("data [renderLinksChart]", data);

    // ----------------------------------------------------------------------- //
    // arquero table for extracting arrays easily
    // ----------------------------------------------------------------------- //

    let aqData = aq.from(data);
    let Value_1 = aqData.array("Value_1");
    let Value_2 = aqData.array("Value_2");

    // ----------------------------------------------------------------------- //
    // get measure metadata
    // ----------------------------------------------------------------------- //

    const primaryMeasurementType = primaryMetadata[0]?.MeasurementType;
    const primaryMeasureName     = primaryMetadata[0]?.MeasureName;

    let primaryDisplay
    let primaryMeasurementDisplay

    if (primaryMeasurementType.includes('Percent') || primaryMeasurementType.includes('percent') && !primaryMeasurementType.includes('percentile')) {
        primaryDisplay = '%' // assigns a % displayType for anything that includes percent (but NOT percentile) in its measurementType
        primaryMeasurementDisplay = primaryMeasurementType 
    } else {
        primaryDisplay         = "" + primaryMetadata[0]?.DisplayType; // else, the pre-existing assignment
        primaryMeasurementDisplay = primaryMeasurementType + ` (${primaryDisplay})`

    }

    const primaryTimePeriod      = data[0]?.TimePeriod_1;
    const geoTypeShortDesc       = data[0]?.GeoTypeShortDesc_1;

    const secondaryMeasurementType = secondaryMetadata[0]?.MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0]?.MeasureName
    const secondaryMeasureId       = secondaryMetadata[0]?.MeasureID

    let secondaryDisplay;
    let secondaryMeasurementDisplay;
    if (secondaryMeasurementType.includes('Percent') || secondaryMeasurementType.includes('percent') && !secondaryMeasurementType.includes('percentile')) {
        secondaryDisplay = '%' // assigns a % displayType for anything that includes percent (but NOT percentile) in its measurementType
        secondaryMeasurementDisplay = secondaryMeasurementType
    } else {
        secondaryDisplay         = "" + secondaryMetadata[0]?.DisplayType; // else, the pre-existing assignment
        secondaryMeasurementDisplay = secondaryMeasurementType + ` (${secondaryDisplay})`
    }

    const secondaryTimePeriod      = data[0]?.TimePeriod_2;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links[0].Measures.filter(
            l => l.MeasureID === secondaryMeasureId
        )[0].SecondaryAxis;

    // ----------------------------------------------------------------------- //
    // switch field assignment based on SecondaryAxis preference
    // ----------------------------------------------------------------------- //

    let xMeasure;
    let yMeasure;
    let xMeasureName;
    let yMeasureName;
    let xDisplay = null;
    let yDisplay = null;
    let xTimePeriod;
    let yTimePeriod;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;
    let xAxisLabel;
    let yAxisLabel;

    switch (SecondaryAxis) {
        case 'x':
            xMeasure       = secondaryMeasurementType;
            yMeasure       = primaryMeasurementType;
            xMeasureName   = secondaryMeasureName;
            yMeasureName   = primaryMeasureName;
            xValue         = "Value_2";
            yValue         = "Value_1";
            xMin           = Math.min.apply(null, Value_2); // get min value for adjusting axis
            xDisplay       = secondaryDisplay ? secondaryDisplay : '';
            yDisplay       = primaryDisplay ? primaryDisplay : '';
            xTimePeriod    = secondaryTimePeriod;
            yTimePeriod    = primaryTimePeriod;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            xAxisLabel     = [secondaryIndicatorName, `${secondaryMeasurementType} (${secondaryTimePeriod})`]
            yAxisLabel     = primaryMeasurementDisplay + ` (${yTimePeriod})` 
            break;
        case 'y':
            xMeasure       = primaryMeasurementType;
            yMeasure       = secondaryMeasurementType;
            xMeasureName   = primaryMeasureName;
            yMeasureName   = secondaryMeasureName;
            xValue         = "Value_1";
            yValue         = "Value_2";
            xMin           = Math.min.apply(null, Value_1); // get min value for adjusting axis
            xDisplay       = primaryDisplay ? primaryDisplay : '';
            yDisplay       = secondaryDisplay ? secondaryDisplay : '';
            xTimePeriod    = primaryTimePeriod;
            yTimePeriod    = secondaryTimePeriod;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            xAxisLabel     = [primaryIndicatorName, `${primaryMeasurementType} (${primaryTimePeriod})`]
            yAxisLabel     = secondaryMeasurementDisplay + ` (${yTimePeriod})`  
            break;
    }

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //
    
    let bubbleSize = window.innerWidth < 576 ? 100 : 200;
    let columns = window.innerWidth < 576 ? 3 : 6;
    let height = window.innerWidth < 576 ? 350 : 500;


    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comb_unreliability = data.map(d => d.Note_1).concat(data.map(d => d.Note_2))
    const links_unreliability = [...new Set(comb_unreliability)].filter(d => !d == "");

    // console.log("links_unreliability", links_unreliability);

    document.querySelector("#links-unreliability").innerHTML = ""; // blank to start

    links_unreliability.forEach(element => {

        document.querySelector("#links-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        document.getElementById('links-unreliability').classList.remove('hide')

        
    });

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //

    let linkspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": [`${yIndicatorName && `${yIndicatorName}`}`],
            "align": "left", 
            "anchor": "start", 
            "fontSize": 18, 
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "subtitle": yAxisLabel,
            "subtitleFontSize": 13,
            "limit": 1000
        },
        "width": "container",
        "height": height,
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelFontSize": 11,
                "titleFontSize": 15,
                "titleFont": "sans-serif",
                "titlePadding": 10,
                "titleFontWeight": "normal"
            },
            "axisY": {
                "labelFontSize": 11,
                "titleFontSize": 0, // to turn off axis title
                "labelAngle": 0,
                "titlePadding": 10,
                "titleFont": "sans-serif",
                "tickMinStep": 1
            },
            "legend": {
                "columns": columns,
                    "labelFontSize": 14,
                    "symbolSize": 140,
                    "orient": "bottom",
                    "title": null
                },
            "view": { "stroke": "transparent" },
            "range": {
                "category": [
                    "#1696d296", 
                    "#f2921496", 
                    "#ec008b96", 
                    "#55b74896", 
                    "#80008096"
                ]
            }
        },
        "data": {
            "values": data
        },
        "transform": [
            {
                "calculate": `format(datum.${xValue}, '.1f') + ' ${xDisplay}'`,
                "as": "xLabel"
            },
            {
                "calculate": `format(datum.${yValue},  '.1f') + ' ${yDisplay}'`,
                "as": "yLabel"
            }
        ],
        "layer":[
            {
                "mark": { 
                    "type": "circle", 
                    "filled": true, 
                    "size": bubbleSize, // update based on Screen Size.
                    "stroke": "#7C7C7C", 
                    "strokeWidth": 2
                },
                "params": [
                    {
                        "name": "borough",
                        "select": { "type": "point", "fields": ["Borough"], "on": "click" },
                        "bind": "legend"
                    },
                    {
                        "name": "hover",
                        "value": "#7C7C7C",
                        "select": { "type": "point", "on": "mouseover" }
                    }
                ],
                "encoding": {
                    "y": {
                        "field": yValue,
                        "type": "quantitative",
                        "axis": {
                            "tickCount": 4
                        },
                    },
                    "x": {
                        "title": xAxisLabel,
                        "field": xValue,
                        "type": "quantitative",
                        "scale": {"domainMin": xMin, "nice": true},
                        "axis": {
                            "titleAlign": "center",
                            "tickCount": 4
                          }
                    },
                    "tooltip": [
                        {
                            "title": geoTypeShortDesc,
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        {
                            "title": yMeasureName,
                            "field": "yLabel",
                            "type": "nominal"
                        },
                        {
                            "title": xMeasureName,
                            "field": "xLabel",
                            "type": "nominal"
                        }
                    ],
                    "color": {
                        // "title": "Borough",
                        "field": "Borough",
                        "type": "nominal"
                    },
                    "opacity": {
                        "condition": {
                            "param": "borough",
                            "empty": true,
                            "value": 1
                        },
                        "value": 0.2
                    },
                    "stroke": {
                        "condition": {
                            "param": "hover",
                            "empty": false,
                            "value": "#7C7C7C"
                        },
                        "value": null
                    }
                }
            },
            {
                "mark": {
                "type": "line",
                "color": "darkgray"
                },
                "transform": [
                {
                    "regression": yValue,
                    "on": xValue
                }
                ],
                "encoding": {
                "x": {
                    "field": xValue,
                    "type": "quantitative"
                },
                "y": {
                    "field": yValue,
                    "type": "quantitative"
                }
                }
            }
        ]

    }

    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#links", linkspec);

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...linkspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .select(aq.not("GeoType", "GeoTypeShortDesc_1", "GeoTypeShortDesc_2", "GeoRank_1", "GeoRank_2", "start_period_1", "end_period_1", "ban_summary_flag_1", "ban_summary_flag_2", "BoroID", "DisplayValue_1", "DisplayValue_2", "GeoTypeDesc_2", "Geography_2", "start_period_2", "end_period_2", "MeasureID_1", "MeasureID_2"))
        .derive({ Value_1_Indicator: `'${yIndicatorName} - ${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`}'`})
        .derive({ Value_2_Indicator: `'${xIndicatorName} - ${xMeasure} ${xDisplay && `(${xDisplay})`} '`})
        
        // console.log("downloadTable [renderLinksChart]");
        // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}
;
// ======================================================================= //
// disparities.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// function to render the disparities chart
// ----------------------------------------------------------------------- //

// this function is called when the "Show Disparities" button is clicked. it
//  in turn calls "loaddisparityData".

const renderDisparitiesChart = async (
    primaryMetadata, 
    disparityMeasureId
) => {

    console.log("** renderDisparitiesChart");

    // console.log("primaryMetadata [renderDisparitiesChart]", primaryMetadata);

    // ----------------------------------------------------------------------- //
    // toggle button
    // ----------------------------------------------------------------------- //

    // disable links measures dropdown
    $("#dropdownLinksMeasures").addClass("disabled");
    $("#dropdownLinksMeasures").attr('aria-disabled', true);

    // ----------------------------------------------------------------------- //
    // extract primary metadata
    // ----------------------------------------------------------------------- //

    const primaryIndicatorName   = indicatorName
    const primaryMeasurementType = primaryMetadata[0]?.MeasurementType;
    const primaryMeasureId       = primaryMetadata[0]?.MeasureID;
    const primaryMeasureName     = primaryMetadata[0]?.MeasureName;
    const primaryAbout           = primaryMetadata[0]?.how_calculated;
    const primarySources         = primaryMetadata[0]?.Sources;

    // console.log(primaryMetadata[0])

    var subtitle;

    let primaryDisplay;
    if (primaryMeasurementType.includes('Percent') || primaryMeasurementType.includes('percent') && !primaryMeasurementType.includes('percentile')) {
        primaryDisplay = '%' // assigns a % displayType for anything that includes percent (but NOT percentile) in its measurementType
        subtitle = primaryMeasurementType
    } else {
        primaryDisplay         = ' ' + primaryMetadata[0]?.DisplayType; // else, the pre-existing assignment
        subtitle = primaryMeasurementType + `${primaryMetadata[0]?.DisplayType ? ` (${primaryDisplay})` : ''}`
        console.log(primaryDisplay, primaryMeasurementType)
    }

    // console.log("primaryMeasureId [renderDisparitiesChart]", primaryMeasureId);

    // get disparities poverty indicator metadata - "indicators" is a global object created by loadIndicator

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === disparityMeasureId
        )
    );

    const disparityMetadata = disparityIndicator[0]?.Measures.filter(
        m => m.MeasureID === disparityMeasureId
    );

    // ----------------------------------------------------------------------- //
    // put metadata into fields
    // ----------------------------------------------------------------------- //

    const disparityIndicatorId     = disparityIndicator[0]?.IndicatorID
    const disparityIndicatorName   = disparityIndicator[0]?.IndicatorName

    const disparityMeasurementType = disparityMetadata[0]?.MeasurementType
    const disparityMeasureName     = disparityMetadata[0]?.MeasureName
    // const disparityMeasureId       = disparityMetadata[0]?.MeasureID
    const disparityDisplay         = disparityMetadata[0]?.DisplayType;

    const disparitySources         = disparityMetadata[0]?.Sources
    const disparitysAbout          = disparityMetadata[0]?.how_calculated


    // ----------------------------------------------------------------------- //
    // if disparity chart not already shown, create dataset again
    // ----------------------------------------------------------------------- //

    if (!selectedDisparity) {

        // console.log(">>> no selected disparity");
        
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
        // load disparities measure data (creates `disparityData`)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
        
        // use a seeded RNG to add a random offset to the categorical x-axis. Using
        //  primaryMeasureId as the seed means that the disparity chart for this measure
        //  will be the same every time
        
        const myrng = new Math.seedrandom(primaryMeasureId)
        
        // await loaddisparityData(disparityMetadata, disparityIndicatorId)
        let aqDisparityData = await createJoinedLinksData(primaryMeasureId, disparityMeasureId)
            .then(res => {

                let dispData = aq.from(res.data)
                    .derive({ PovRank: d => (d.Value_2 > 30 ? 4 : (d.Value_2 > 20 ? 3 : ( d.Value_2 > 10 ? 2 : 1))) })
                    .derive({ PovCat: d => (d.PovRank == 4 ? 'Very high (> 30%)' : (d.PovRank == 3  ? 'High (20-30%)' : ( d.PovRank == 2  ? 'Medium (10-20%)' : 'Low (0-10%)'))) })
                    .derive({ randomOffsetX: aq.escape(d => d.PovRank + (myrng()*2 - 1)) })
                
                return dispData;
            })
        
        disparityData = aqDisparityData.objects()
        
    } else {
        // console.log(">>> selected disparity");
    }

    // set this to true

    selectedDisparity = true;

    // console.log(">> disparityData [renderDisparitiesChart]", disparityData);

    // debugger;

    const primaryTime   = disparityData[0]?.TimePeriod_1;
    const disparityTime = disparityData[0]?.TimePeriod_2;
    const geoTypeShortDesc = disparityData[0]?.GeoTypeShortDesc_1;

    // console.log("primaryTime", primaryTime);
    // console.log("disparityTime", disparityTime);

    // ----------------------------------------------------------------------- //
    // get min value for adjusting axis
    // ----------------------------------------------------------------------- //

    // let aqData = aq.from(disparityData);
    // let median = aqData.array("median");
    // let medianMin = Math.min.apply(null, median);

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comb_unreliability = disparityData.map(d => d.Note_1).concat(disparityData.map(d => d.Note_2))
    const disp_unreliability = [...new Set(comb_unreliability)].filter(d => !d == "");

    // console.log("disp_unreliability", disp_unreliability);

    document.querySelector("#links-unreliability").innerHTML = ""; // blank to start
    document.getElementById("links-unreliability").classList.add('hide') // blank to start


    disp_unreliability.forEach(element => {

        document.querySelector("#links-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>";
        document.getElementById('links-unreliability').classList.remove('hide')


    });


    // ----------------------------------------------------------------------- //
    // created combined about and sources info
    // ----------------------------------------------------------------------- //

    const combinedAbout =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primaryAbout}</p>
        <p><strong>${disparityIndicatorName} - ${disparityMeasurementType}</strong>: ${disparitysAbout}</p>`;

    const combinedSources =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primarySources}</p>
        <p><strong>${disparityIndicatorName} - ${disparityMeasurementType}</strong>: ${disparitySources}</p>`;

    // render combined info

    renderAboutSources(combinedAbout, combinedSources);

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //
    
    let bubbleSize = window.innerWidth < 576 ? 100 : 200;
    let height = window.innerWidth < 576 ? 350 : 500;

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //

    // console.log('display types: ', primaryDisplay)

    let disspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `${primaryIndicatorName} ${primaryMeasurementType} and poverty scatterplot`,
        "title": {
            "text": [`${primaryIndicatorName && `${primaryIndicatorName}`}`],
            "align": "left", 
            "anchor": "start", 
            "fontSize": 18, 
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "limit": 1000,
            "subtitle": subtitle + ` (${primaryTime})`,
            "subtitleFontSize": 13
        },
        "width": "container",
        "height": height,
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelFontSize": 11,
                "titleFontSize": 15,
                "titleFont": "sans-serif",
                "titlePadding": 10,
                "titleFontWeight": "normal"
            },
            "axisY": {
                "labelFontSize": 11,
                "titleFontSize": 0, // to turn off axis title
                "labelAngle": 0,
                "titlePadding": 10,
                "titleFont": "sans-serif",
                "tickMinStep": 1
            },
            "view": { "stroke": "transparent" },
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "align": "center",
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values": disparityData
        },
        "transform": [
            {
              "calculate": `(datum.DisplayValue_1 + '${primaryDisplay}')`,
              "as": "valueLabel"
            },
            {
                "calculate": `(datum.DisplayValue_2 + '%')`,
                "as": "povLabel"
            }
          ],
        "layer": [
        {
            "mark": {
                "type": "circle",
                "filled": true,
                "size": bubbleSize,
                "stroke": "#7C7C7C",
                "strokeWidth": 2
            },
            "params": [
            {
                "name": "hover",
                "value": "#7C7C7C",
                "select": {"type": "point", "on": "mouseover"}
            }
            ],
            "encoding": {
                "y": {
                    "field": "Value_1",
                    "type": "quantitative",
                    "axis": {
                        "tickCount": 4
                    },
                },
                "x": {
                    "title": [`${disparityIndicatorName && `${disparityIndicatorName}`} (${disparityTime})`],
                    "field": "PovRank", // Changed
                    "type": "ordinal",
                    "axis": {
                        "labelExpr": "(datum.value == 4 ? 'Very high (over 30%)' : (datum.value == 3  ? 'High (20 - 29.9%)' : ( datum.value == 2  ? 'Medium (10 - 19.9%)' : 'Low (0 - 9.9%)')))",
                        "labelAlign": "center",
                        "labelAngle": 0,
                        "titleAlign": "center"
                    }
                },
                "xOffset": {"field": "randomOffsetX", "type": "quantitative"}, // Jitter
                "tooltip": [
                {
                    "title": geoTypeShortDesc, 
                    "field": "Geography_1", 
                    "type": "nominal"
                },
                {
                    "title": "Borough", 
                    "field": "Borough", 
                    "type": "nominal"
                },
                {
                    "title": primaryMeasureName,
                    "field": "valueLabel",
                    "type": "nominal"
                },
                {
                    "title": disparityMeasureName,
                    "field": "povLabel",
                    "type": "nominal"
                }
                ],
                "fill": {
                    "title": "PovCat", 
                    "field": "PovRank", 
                    "type": "nominal", 
                    "legend": null,
                    "scale": {
                        "range": [
                            "#1696d2", 
                            "#ffa500", 
                            "#ec008b", 
                            "#55b748"
                        ]
                    },
                },
                "stroke": {
                    "condition": {
                        "param": "hover", 
                        "empty": false, 
                        "value": "#7C7C7C"
                    },
                    "value": null
                }
            }
        }
        ]
    }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#links", disspec);

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...disspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .select(aq.not("GeoType", "GeoTypeShortDesc_1", "GeoTypeShortDesc_2", "GeoRank_1", "GeoRank_2", "start_period_1", "end_period_1", "ban_summary_flag_1", "ban_summary_flag_2", "BoroID", "DisplayValue_1", "DisplayValue_2", "GeoTypeDesc_2", "Geography_2", "start_period_2", "end_period_2", "MeasureID_1", "MeasureID_2", "randomOffsetX"))
        .derive({ Value_1_Indicator: `'${primaryIndicatorName && `${primaryIndicatorName}`}'`})
        .derive({ Value_2_Indicator: `'${disparityIndicatorName}'`})
    
    // console.log("downloadTable [renderDisparitiesChart]");
    // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}
;
// ======================================================================= //
// comparisons.js
// ======================================================================= //

const renderComparisonsChart = (
    data,
    metadata
) => {

    console.log("*** renderComparisonsChart");

    // console.log("metadata [renderComparisonsChart]");
    // metadata.print()
    
    // console.log("data [renderComparisonsChart]");
    // data.print(Infinity)

    // console.log("data objects", data.objects());

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start
    document.getElementById("trend-unreliability").classList.add('hide') // blank to start


    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        document.getElementById('trend-unreliability').classList.remove('hide')

        
    });

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //

    // dimensions

    let columns ;
        if (window.innerWidth < 340) {
            columns = 1
        } else if (window.innerWidth < 440) {
            columns = 2
        } else if (window.innerWidth > 440 && window.innerWidth < 576) {
            columns = 3
        } else {
            columns = 6
        }
    
    
    let height = window.innerWidth < 576 ? 350 : 500;

    // ticks

    let Value = data.array("Value");
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1

    // colors (black, blue, orange, magenta, green, purple)
    // alpha: hex 96 = 150(/255) = ~58/100

    let colors = ["#000000ff", "#1696d296", "#f2921496", "#ec008b96", "#55b74896", "#80008096"];

    // ----------------------------------------------------------------------- //
    // extract measure metadata for chart text
    // ----------------------------------------------------------------------- //
    
    let compName            = [... new Set(metadata.array("ComparisonName"))];
    let compIndicatorLabel  = [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes    = [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    let compNoCompare       = [... new Set(metadata.array("TrendNoCompare"))].filter(nc => nc != null)[0]

    console.log('compMeasurementType', compMeasurementType)
    console.log('compDisplayTypes', compDisplayTypes)

    console.log(">>>> compNoCompare", compNoCompare);

    // console.log(">> compName", compName);
    // console.log(">> compIndicatorLabel", compIndicatorLabel);
    // console.log(">> compMeasurementType", compMeasurementType);


    // ----------------------------------------------------------------------- //
    // set chart text based on type of comparison
    // ----------------------------------------------------------------------- //

    let compGroupLabel;
    let plotSubtitle;
    let plotTitle;

    let suppressSubtitleBy = [564, 565, 566, 704, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730];

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    if (compName[0] === "Boroughs") {

        // ----- by boros: 1 indicator, 1 measure, 5 boros --------------------------------------------------- //

        // console.log("boros");

        // console.log("indicatorName", indicatorName);

        // if this is a boro comparison, tweak some things

        compGroupLabel = [... new Set(data.array("Geography"))];
        let hasBoros = compGroupLabel.length > 1 ? true : false; 
        
        plotTitle = indicatorName;
        plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? "" : "");
        console.log('compDisplayTypes 0: ', compDisplayTypes)
        
        if (compMeasurementType[0].includes('Percent') | compMeasurementType[0].includes('percent') && !compMeasurementType[0].includes('Percentile')) {
            compDisplayTypes = '%'
        } else {}

        comp_group_col = "Geography"

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);


    } else if (compIndicatorLabel.length == 1) {

        // ----- by measure: 1 indicator, 2+ measures, 1 citywide --------------------------------------------------- //

        // console.log("1 indicator");

        // console.log("indicatorName", indicatorName);
        
        let compId           = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle  = [... new Set(metadata.array("LegendTitle"))];
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))];

        // console.log("compId", compId);
        
        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");

        } else {

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }


        // if there's only 1 indicator label, use measurement type to label the groups

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length == 1) {

        // ----- by indicator: 2+ indicators, 1 measure, 1 citywide --------------------------------------------------- //

        // console.log("1 measure");

        // console.log("indicatorName", indicatorName);

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]

        // console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");
            console.log('compDisplayTypes 1: ', compDisplayTypes)

        } else {

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
            console.log('compDisplayTypes 2: ', compDisplayTypes)

        }

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {
        
        // ----- by combo: 2+ indicators, 2+ measures, 1 citywide --------------------------------------------------- //

        // console.log("> 1 measure & indicator");

        // console.log("indicatorName", indicatorName);

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))]

        // console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");

        } else {

            plotSubtitle = compName + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }

        // if there are more than 1 of both, use joined IndicatorMeasure 

        compGroupLabel = [... new Set(metadata.array("IndicatorMeasure"))];
        comp_group_col = "IndicatorMeasure"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    }


    // ----------------------------------------------------------------------- //
    // create transform after pivot that replaces "undefined" with ""
    // ----------------------------------------------------------------------- //

    let compReplaceInvalid = compGroupLabel.map(x => {return {"calculate": `isValid(datum[\"${x}\"]) ? (datum[\"${x}\"] + ' ${compDisplayTypes}') : ""`, "as": `${x}`}})

    // ----------------------------------------------------------------------- //
    // create tooltips JSON
    // ----------------------------------------------------------------------- //

    // will be spliced into the spec
    
    // let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal", "format": ",.1~f"}})
    let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal"}})

    // console.log("compTooltips", compTooltips);


    // ----------------------------------------------------------------------- //
    // create "don't compare" line JSON
    // ----------------------------------------------------------------------- //

    // getting latest end period in the data

    let maxDataEndPeriod = Math.max(...new Set(data.array("end_period")))
    
    // getting "no compare" end period from time period metadata

    let noCompareEndPeriod = timeTable
        .filter(`d => d.TimePeriod == ${compNoCompare}`)
        .array("end_period")[0]

    // testing to see if the data has later time periods than the "no compare" time

    let hasGreaterEndPeriod = maxDataEndPeriod >= noCompareEndPeriod;

    // if there's a "no compare" time, and there's data later than that, show the line

    let noCompare;

    if (compNoCompare && hasGreaterEndPeriod) {

        // if a time period exists, return vertical rule JSON

        noCompare = [{
            "mark": "rule",
            "encoding": {
                "x": {
                    "datum": compNoCompare
                },
                "xOffset": {"value": 0.5},
                "color": {"value": "gray"},
                "size": {"value": 2},
                "strokeDash": {"value": [2, 2]}
            }
        }]

        let noCompareFootnote = `Because of a method change, data before ${compNoCompare} shouldn't be compared to later time periods.`
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + noCompareFootnote + "</div>" ;


    } else {

        // if no time period, return an empty array

        noCompare = []

    }


    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    let compspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelAngle": 0,
                "labelOverlap": "parity",
                "labelFontSize": 11,
                "titleFontSize": 13,
                "titleFont": "sans-serif",
                "titlePadding": 10
            },
            
            "axisY": {
                "labelAngle": 0,
                "labelFontSize": 11,
                "tickMinStep": tickMinStep
            },
            "legend": {
                "columns": columns,
                // "columns": 3,
                "labelFontSize": 14,
                "symbolSize": 140
            },
            "view": {"stroke": "transparent"},
            "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5},
            
            "point": {"filled": true},
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values":  data.objects(),
        },
        "width": "container",
        "height": height,
        "title": { 
            "text": plotTitle,
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start", 
            "fontSize": 18, 
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": plotSubtitle,
            "dy": -10,
            "subtitleFontSize": 13
        },
        "encoding": {
            "x": {
                "field": "TimePeriod",
                "type": "nominal",
                "title": null
            }
        },
        "layer": [
            {
                "encoding": {
                    "color": {
                        "field": comp_group_col, // this is combo of indicator + measure or geo
                        "type": "nominal",
                        "scale": {
                            "range": colors
                        },
                        "sort": null,
                        "legend": {
                            "orient": "bottom",
                            "title": null,
                            "labelLimit": 1000
                        }
                    },
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "axis": {
                            "tickCount": 4
                        },
                        "scale": {"domainMin": 0, "nice": true} // change domainMin to valueMin to scale with data
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "line",
                            "interpolate": "linear",
                            "point": { 
                                "filled": false, 
                                "fill": "white", 
                                "size": 40, 
                                "strokeWidth": 2.5
                            }
                        }
                        
                    },
                    {
                        "transform": [
                            {
                                "filter": {
                                    "param": "hover",
                                    "empty": false
                                }
                            }
                        ],
                        "mark": "point"
                    }
                ]
            },
            {
                "transform": [
                    {
                        "pivot": comp_group_col,
                        "value": "DisplayValue",
                        "groupby": ["TimePeriod"],
                        "op": "max"
                    },
                    ...compReplaceInvalid
                ],
                "mark": "rule",
                "encoding": {
                    "opacity": {
                        "condition": {
                            "value": 0.3,
                            "param": "hover",
                            "empty": false
                        },
                        "value": 0
                    },
                    "tooltip": [
                        {
                            "title": "Year",
                            "field": "TimePeriod",
                            "type": "nominal"
                        },
                        ...compTooltips,
                    ]
                },
                "params": [
                    {
                        "name": "hover",
                        "select": {
                            "type": "point",
                            "fields": [
                                "TimePeriod"
                            ],
                            "nearest": true,
                            "on": "mouseover",
                            "clear": "mouseout"
                        }
                    }
                ]
            },
            ...noCompare
        ]
    }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //
    
    vegaEmbed("#trend", compspec);

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...compspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${plotTitle} ${plotSubtitle}'`}) // add indicator name and type column
        .select(aq.not("GeoType", "GeoTypeDesc", "GeoTypeShortDesc", "GeoRank", "MeasureID", "ban_summary_flag", "DisplayValue", "start_period", "end_period"))

        // console.log("downloadTable [renderComparisonsChart]");
        // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()
    
}
;
// ======================================================================= //
// app.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// history traversal
// ----------------------------------------------------------------------- //

// clicking on the indicator dropdown calls loadIndicator with that IndicatorID

// call loadindicator when traversing through the history

window.onpopstate = function (event) {

    const new_url = new URL(window.location);
    let new_indicatorId = parseFloat(new_url.searchParams.get('id'));

    if (new_indicatorId != indicatorId) {

        loadIndicator(new_indicatorId, true)

    }
};

window.addEventListener("hashchange", () => {

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
    window.location.hash = 'display=summary'
});

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map'
});

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend'
});

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links'
});


// ----------------------------------------------------------------------- //
// export functions
// ----------------------------------------------------------------------- //

// export current table or chart view
$("#chartView").on("click", (e) => {

    // if it's summary table... (uses DataTables.net methods)
    if (window.location.hash == '#display=summary') {
        
        let summaryTable = $('#tableID').DataTable();
        summaryTable.button("thisView:name").trigger();
    
        gtag('event', 'file_download', {
            'file_name': 'NYC EH Data Portal - ' + indicatorName + " (filtered table)" + '.csv',
            'file_extension': '.csv',
            'link_text': 'Current table view'
        });
    
        e.stopPropagation();
    
    } else {
        // else, for chart view downloads: 
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(CSVforDownload);
        let hiddenElement = document.createElement('a');

        // set view to send to file name
        var view;
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

});

// export full table data (i.e., original view)

$("#allData").on("click", (e) => {

    // pivot the full dataset

    let allData = aq.from(tableData)
        .groupby("TimePeriod", "GeoType", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
        .relocate(["TimePeriod", "GeoType", "GeoID", "GeoRank"], { before: 0 })

    let downloadTableCSV = allData.toCSV();

    // Data URI
    let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
    let hiddenElement = document.createElement('a');

    hiddenElement.href = csvData;
    hiddenElement.target = '_blank';
    hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (full table)" + '.csv';
    hiddenElement.click();

    gtag('event', 'file_download', {
        'file_name': hiddenElement.download,
        'file_extension': '.csv',
        'link_text': 'Full table for this indicator'
    });

    e.stopPropagation();

});

// export raw dataset

$("#rawData").on("click", (e) => {

    let dataURL = `${data_repo}${data_branch}/indicators/data/${indicatorId}.json`

    // console.log('Data are at: ' + dataURL)

    aq.loadJSON(`${dataURL}`).then(function(data) {

        let downloadTable = data;
        let downloadTableCSV = downloadTable.toCSV();

        // Data URI
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
        let hiddenElement = document.createElement('a');

        hiddenElement.href = csvData;
        hiddenElement.target = '_blank';
        hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (raw)" + '.csv';
        hiddenElement.click();

        gtag('event', 'file_download', {
            'file_name': hiddenElement.download,
            'file_extension': '.csv',
            'link_text': 'Raw data for this indicator'
        });

        e.stopPropagation();

    })

});
