// ======================================================================= //
// global.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

let selectedTableYears = [];
let selectedTableGeography = [];
let aboutMeasures;
let dataSources;

let measureAbout = `N/A`;
let measureSources = `N/A`;
let geoTable;
let unreliabilityNotes;
let aqData;
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

let defaultTrendMetadata = [];
let aqDefaultTrendMetadata;
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
let selectedLinksMetadata;
let selectedlinksSecondaryMeasureTime;

let primaryMeasureMetadata;
let secondaryMeasureMetadata;

let filteredMapData;
let filteredTrendData;
let aqFilteredTrendData;
let aqFilteredComparisonsData;
let aqFilteredComparisonsMetadata;
let aqCombinedComparisonsMetadata;

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

fetch(`${data_repo}${data_branch}/indicators/indicators.json`)
    .then(response => response.json())
    .then(async data => {

        // console.log("* fetch indicators.json");

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

    await fetch(`${data_repo}${data_branch}/indicators/comparisons.json`)
        .then(response => response.json())
        .then(async data => {
            
            comparisons = data;
            
            console.log("comparisons:", comparisons);
            
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
            DisplayType:     d => d.Measures.DisplayType
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

    // for each indicator, get all measures
    // Promise.all takes the array of promises returned by map, and then the `then` callback executes after they've all resolved

    Promise.all(

        // map over indeicators, which have separate data files
        
        uniqueIndicatorMeasure.map(async ind => {

            let measures = ind[1].flatMap(m => Object.values(m));
            
            // get data for an indicator

            return aq.loadJSON(`${data_repo}${data_branch}/indicators/data/${ind[0]}.json`)
                .then(async data => {

                    // console.log("*** aq.loadJSON");
                    console.log("** comp_data:");

                    let comp_data = data
                        .derive({IndicatorID: aq.escape(ind[0])})
                        // .print()
                        .semijoin(
                            aqCombinedComparisonsMetadata, 
                            (a, b) => (op.equal(a.MeasureID, b.MeasureID) && op.equal(a.GeoType, b.GeoTypeName) && op.equal(a.GeoID, b.GeoID))
                        )
                        .reify()
                        .print()
                    
                    return comp_data;
                
                })
        })
    )

    .then(async dataArray => {

        // take array of arquero tables and combine them into 1 arquero table - like bind_rows in dplyr

        aqComparisonsIndicatorData = await dataArray.flatMap(d => d).reduce((a, b) => a.concat(b))

        // console.log("aqComparisonsIndicatorData [createComparisonData]");
        // aqComparisonsIndicatorData.print()
        
        // console.log("loadTime [createComparisonData]");

        aqComparisonsIndicatorData = aqComparisonsIndicatorData
            // .filter(d => op.match(d.GeoType, /Citywide/))
            .reify()

        // console.log("aqComparisonsIndicatorData:");
        // aqComparisonsIndicatorData.print({limit: Infinity});

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

    if (indicatorComparisonId !== null) {
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

            // call the geo file loading function

            loadGeo();

            ful = aq.from(data)
                .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
                .groupby("Time", "GeoType", "GeoID", "GeoRank")


            aqData = ful
                .groupby("Time", "GeoType", "GeoID")
                .orderby(aq.desc('Time'), 'GeoRank')
        })

    draw311Buttons(this_indicatorId)

}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const loadGeo = () => {

    console.log("* loadGeo");

    const geoUrl = `${data_repo}${data_branch}/geography/GeoLookup.csv`; // col named "GeoType"

    aq.loadCSV(geoUrl)
        .then(data => {

            geoTable = data.select(aq.not('Lat', 'Long'));
            
            // console.log("@@ geoTable");
            // geoTable.print()

            // call the data-to-geo joining function

            joinData();

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

    // flatten MeasureID + TimeDescription

    let availableTimes = [];

    // create table column header with display type

    let measurementDisplay = [];

    indicatorMeasures.map(

        measure => {

            let aqAvailableTimes =
                aq.from(measure.AvailableTimes)
                .derive({MeasureID: `${measure.MeasureID}`})

            availableTimes.push(aqAvailableTimes);

            let aqMeasurementDisplay =
                aq.table(
                {
                    MeasureID: [measure.MeasureID],
                    MeasurementType: [measure.MeasurementType],
                    DisplayType: [measure.DisplayType]
                })

            measurementDisplay.push(aqMeasurementDisplay);

        }
    )
    
    // bind rows of Arquero tables in arrays

    aqMeasureIdTimes     = availableTimes.reduce((a, b) => a.concat(b))
    let aqMeasurementDisplay = measurementDisplay.reduce((a, b) => a.concat(b))

    // foundational joined dataset

    joinedAqData = aqData
        .join_left(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
        .rename({'Name': 'Geography'})
        .join(aqMeasureIdTimes, [["MeasureID", "Time"], ["MeasureID", "TimeDescription"]])
        .select(
            "GeoID",
            "GeoType",
            "GeoTypeDesc",
            "GeoTypeShortDesc",
            "GeoRank",
            "Geography",
            "MeasureID",
            "Time",
            "Value",
            "DisplayValue",
            "CI",
            "Note",
            "start_period",
            "end_period",
            "ban_summary_flag"
        )
        .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
        .reify()

    // joinedAqData.print()

    // data for summary table

    tableData = joinedAqData
        .filter(d => d.ban_summary_flag == 0)
        .join_left(aqMeasurementDisplay, "MeasureID")
        .derive({
            MeasurementDisplay: d => op.trim(op.join([d.MeasurementType, d.DisplayType], " ")),
            DisplayCI: d => op.trim(op.join([d.DisplayValue, d.CI], " "))
        })
        .derive({ DisplayCI: d => op.replace(d.DisplayCI, /^$/, "-") }) // replace missing with "-"
        .select(aq.not("start_period", "end_period"))
        .objects()

    // data for map

    mapData = joinedAqData
        // remove Citywide
        .filter(
            d => !op.match(d.GeoType, /Citywide/),
            d => !op.match(d.Geography, /Harborwide/)
        ) 
        // .impute({ Value: () => NaN })
        .objects()
    
    // console.log("mapData", mapData);

    // map for trend chart

    trendData = joinedAqData
        .filter(d => op.match(d.GeoType, /Citywide|Borough/)) // keep only Citywide and Boro
        .orderby("GeoRank", "GeoID")
        .objects()

    // data for links & disparities chart

    linksData = joinedAqData
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
        .objects()

    // call the measure rendering etc. function

    renderMeasures();

}

// ----------------------------------------------------------------------- //
// function to create data and metadata for links chart
// ----------------------------------------------------------------------- //

// WHAT'S THE MOST RECENT YEAR WHERE PRIMARY AND SECONDARY SHARE A GEOGRAPHY?

const createJoinedLinksData = async (primaryMeasureId, secondaryMeasureId) => {

    let ret;

    // console.log("primaryMeasureId", primaryMeasureId);
    // console.log("secondaryMeasureId", secondaryMeasureId);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get metadata for the selected primary measure, assign to global variable
    // indicatorMeasures created in loadIndicator

    primaryMeasureMetadata = linksMeasures.filter(
        measure => measure.MeasureID === primaryMeasureId
    )

    // get available geos for primary measure (excluding citywide and boro)

    const primaryMeasureGeos = primaryMeasureMetadata[0].AvailableGeographyTypes
        .map(g => g.GeoType)
        .filter(g => !/Citywide|Borough/.test(g))


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if no secondary measure ID is given, set it to the first in the primary measure's links list

    if (typeof secondaryMeasureId == "undefined") {
        secondaryMeasureId = primaryMeasureMetadata[0].VisOptions[0].Links[0].MeasureID;
    }

    // get the indicator element for the selected secondary measure

    const secondaryIndicator = indicators.filter(
        indicator => indicator.Measures.some(
            measure => measure.MeasureID === secondaryMeasureId
        )
    )

    // get secondary indicatorID, to get secondary data and metadata

    const secondaryIndicatorId = secondaryIndicator[0].IndicatorID

    // get metadata for the selected secondary measure, assign to global variable

    secondaryMeasureMetadata =
        secondaryIndicator[0].Measures.filter(
        measure => measure.MeasureID === secondaryMeasureId
    )


    // ==== geography ==== //

    // get avilable geos for secondary measure (excluding citywide and boro)

    const secondaryMeasureGeos = secondaryMeasureMetadata[0].AvailableGeographyTypes
        .map(g => g.GeoType)
        .filter(g => !/Citywide|Borough/.test(g))


    // ---- get primary x secondary intersection ---- //

    const sharedGeos = secondaryMeasureGeos.filter(g => primaryMeasureGeos.includes(g));

    // console.log("sharedGeos", sharedGeos);

    // ==== times ==== //

    // get available time periods for secondary measure

    const secondaryMeasureTimes   = secondaryMeasureMetadata[0].AvailableTimes;
    const aqSecondaryMeasureTimes = aq.from(secondaryMeasureTimes);

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

    // console.log("filteredPrimaryMeasureData", filteredPrimaryMeasureData);


    // get most recent time period for primary measure
    //  (at shared geo level, which is why we're using the data, and not the metadata)

    const mostRecentPrimaryMeasureEndTime = Math.max(...filteredPrimaryMeasureData.map(d => d.end_period));

    // keep only most recent time period

    const filteredPrimaryMeasureTimesData = filteredPrimaryMeasureData

        .filter(d => d.end_period === mostRecentPrimaryMeasureEndTime)

    // convert to arquero table

    const aqFilteredPrimaryMeasureTimesData = aq.from(filteredPrimaryMeasureTimesData);

    // console.log("aqFilteredPrimaryMeasureTimesData");
    // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "Time").count().print(50)
    // aqFilteredPrimaryMeasureTimesData.print(10)


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get secondary data with shared geo and time period that is closest with most recent primary data
    //  (fetches run asynchronously by default, but we need this data to do other things, so we have to 
    //  `await` the result before continuing)

    await fetch(`${data_repo}${data_branch}/indicators/data/${secondaryIndicatorId}.json`)
        .then(response => response.json())
        .then(async data => {

            // get secondary measure data

            const aqFilteredSecondaryMeasureData = aq.from(data)

                // get secondary measure data

                .filter(`d => d.MeasureID === ${secondaryMeasureId}`)
                
                .join(
                    geoTable,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )

                // get same geotypes as primary data (no citywide or boro)
                .filter(aq.escape(d => sharedGeos.includes(d.GeoType)))

                .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
                .rename({'Name': 'Geography'})

                // get end periods
                .join(
                    aqSecondaryMeasureTimes,
                    ["Time", "TimeDescription"]
                )
                .select(aq.not("TimeDescription"))
            
            // console.log("aqFilteredSecondaryMeasureData");
            // aqFilteredSecondaryMeasureData.groupby("MeasureID", "GeoType", "Time").count().print(50)
            // aqFilteredSecondaryMeasureData.print(10)

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();
            

            // ==== get closest data ==== //

            // get the secondary end time closest to most recent primary end time

            const closestSecondaryTime = filteredSecondaryMeasureTimesDataObjects.reduce((prev, curr) => {

                return (Math.abs(curr.end_period - mostRecentPrimaryMeasureEndTime) < Math.abs(prev.end_period - mostRecentPrimaryMeasureEndTime) ? curr : prev);

            });

            // console.log("closestSecondaryTime", closestSecondaryTime);


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
            
            // console.log("aqFilteredPrimaryMeasureTimesData");
            // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "Time").count().print(50)
            // aqFilteredPrimaryMeasureTimesData.print(10)
            
            // console.log("aqClosestSecondaryData");
            // aqClosestSecondaryData.groupby("MeasureID", "GeoType", "Time").count().print(50)
            // aqClosestSecondaryData.print(10)
            
            const aqJoinedPrimarySecondaryData = aqFilteredPrimaryMeasureTimesData
                .join(
                    aqClosestSecondaryData,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )

            // set the value of joinedLinksDataObjects, and make sure to wait for it

            ret = await aqJoinedPrimarySecondaryData;

        })

    // console.log(">> ret");
    // ret.print()

    return ret;
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

    d3.csv(`${baseURL}/311/311-crosswalk.csv`)
        .then(async data => {

            console.log(">>> 311-crosswalk");
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
                document.getElementById('311label').innerHTML = 'Contact 311 about:'
                dest.forEach(element => element.classList.remove('hide'))
            } else {
                document.getElementById('311label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))
            };

            // draws 311 buttons
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {
                var title = filteredCrosswalk[i].topic
                var destination = filteredCrosswalk[i].kaLink
                var btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="badge badge-pill badge-primary mr-1" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt mr-1"></i>${title}</a>`
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

    // modified so that defaultLinksMetadata is explicitly set, instead of by reference
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

        } else if (hasDensity.length) {
            defaultArray.push(hasDensity[0]);

        } else {
            defaultArray.push(visArray[0]);

        }

        defaultLinkMeasureTimes = defaultArray[0].AvailableTime;

        const defaultPrimaryMeasureId = defaultArray[0].MeasureID;
        const defaultSecondaryMeasureId = defaultArray[0].VisOptions[0].Links[0].MeasureID;

        // assigning to global object
        defaultLinksMetadata = defaultArray;

        // using await here because createJoinedLinksData calls fetch, and we need that data

        let aqJoinedLinksDataObjects = await createJoinedLinksData(defaultPrimaryMeasureId, defaultSecondaryMeasureId)

        joinedLinksDataObjects = aqJoinedLinksDataObjects.objects()

        // console.log(">> joinedLinksDataObjects [setDefaultLinksMeasure]", joinedLinksDataObjects);

    }
}


// ----------------------------------------------------------------------- //
// tab update functions
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// map
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const updateMapData = (e) => {

    // ----- handle selection -------------------------------------------------- //

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
        
        // console.log("geo [updateMapData]", e.target.dataset);

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
        
        // console.log("time [updateMapData]", e.target.dataset);

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


    console.log("*measureId*", measureId, "*geo*", geo, "*time*", time);
    // console.log("geo", geo);
    // console.log("measureId", measureId);
    // console.log("time", time);


    // ----- get metatadata for selected measure -------------------------------------------------- //

    selectedMapMetadata = mapMeasures.filter(m => m.MeasureID == measureId);
    
    const measurementType = selectedMapMetadata[0].MeasurementType;
    const about           = selectedMapMetadata[0].how_calculated;
    const sources         = selectedMapMetadata[0].Sources;


    // ----- set measure info boxes -------------------------------------------------- //

    // "indicatorName" is set in loadIndicator

    selectedMapAbout   =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedMapSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedMapAbout, selectedMapSources);


    // ----- create dataset -------------------------------------------------- //

    // filter map data using selected measure and time

    filteredMapData =
        mapData.filter(obj => 
            obj.MeasureID == measureId &&
            obj.Time == time &&
            prettifyGeoType(obj.GeoType) == geo
        );

    console.log("filteredMapData [updateMapData]", filteredMapData);

    // get the highest GeoRank, then keep just that geo

    // let maxGeoRank = Math.max(filteredMapData[0].GeoRank);
    // filteredMapData = filteredMapData.filter(obj => obj.GeoRank === maxGeoRank)


    // ----- format dropdowns -------------------------------------------------- //

    // set this element as active & selected

    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // called before renderMap in case it fails, so dropdowns will show available combos

    handleMapTimeDropdown(measureId, geo)
    handleMapGeoDropdown(measureId, time)
    
    // ----- render the map -------------------------------------------------- //

    renderMap(filteredMapData, selectedMapMetadata);

    updateChartPlotSize();

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// trend
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== normal trend ================================================== //

const updateTrendData = (e) => {

    console.log("* updateTrendData");

    // ----- handle selection -------------------------------------------------- //

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

    // ----- get metatadata for selected measure -------------------------------------------------- //

    // trendMeasures is created by renderMeasures, which evals before this would be called
    let selectedTrendMetadata = trendMeasures.filter(m => m.MeasureID == measureId);
    const measurementType = selectedTrendMetadata[0].MeasurementType;
    const about           = selectedTrendMetadata[0].how_calculated;
    const sources         = selectedTrendMetadata[0].Sources;

    aqSelectedTrendMetadata = aq.from(selectedTrendMetadata)
        .derive({
            IndicatorLabel: aq.escape(indicatorName),
            ComparisonName: aq.escape('Boroughs')
        })

    // ----- set measure info boxes -------------------------------------------------- //

    selectedTrendAbout =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedTrendSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedTrendAbout, selectedTrendSources);


    // ----- create dataset -------------------------------------------------- //

    // created filtered trend data, to be passed to render function

    filteredTrendData = trendData.filter(m => m.MeasureID === measureId);


    // ----- render the chart -------------------------------------------------- //

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

        const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));

        let aqFilteredTrendDataAnnualAvg = aq.from(filteredTrendDataAnnualAvg);

        // renderTrendChart(filteredTrendDataAnnualAvg, aqMeasureMetadata);
        renderComparisonsChart(aqFilteredTrendDataAnnualAvg, aqSelectedTrendMetadata);
        updateChartPlotSize();

    } else if (measureIdsSummer.includes(measureId)) {

        const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));

        let aqFilteredTrendDataSummer = aq.from(filteredTrendDataSummer);

        // renderTrendChart(filteredTrendDataSummer, aqMeasureMetadata);
        renderComparisonsChart(aqFilteredTrendDataSummer, aqSelectedTrendMetadata);
        updateChartPlotSize();

    } else {

        let aqFilteredTrendData = aq.from(filteredTrendData);

        // renderTrendChart(filteredTrendData, aqMeasureMetadata);
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

    // ----- handle selection -------------------------------------------------- //

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


    // ----- set measure info boxes -------------------------------------------------- //

    // this iterates over all the indicators and measures in the comparison

    aqComparisonsIndicatorsMetadata.objects().forEach(m => {

        selectedComparisonAbout +=
            `<h6>${m.IndicatorName} - ${m.MeasurementType}</h6>
            <p>${m.how_calculated}</p>`;

        selectedComparisonSources +=
            `<h6>${m.IndicatorName} - ${m.MeasurementType}</h6>
            <p>${m.Sources}</p>`;
    })

    // render the measure info boxes

    renderAboutSources(selectedComparisonAbout, selectedComparisonSources);


    // ----- create dataset -------------------------------------------------- //

    // keep just the clicked comparison

    aqFilteredComparisonsMetadata = aqComparisonsMetadata
        .filter(aq.escape(d => d.ComparisonID == comparisonId))
        .join(aqComparisonsIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

    // console.log("aqFilteredComparisonsMetadata:");
    // aqFilteredComparisonsMetadata.print()
    
    // use filtered metadata to filter data

    aqFilteredComparisonsData = aqFilteredComparisonsMetadata
        .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
        .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])

        // put host indicator first, so it gets the black line
        .orderby(aq.desc(aq.escape(d => d.IndicatorID == indicatorId)))
    
    // console.log(">>>> aqFilteredComparisonsData:");
    // aqFilteredComparisonsData.print()

    // show only last 3 years of DWQ measures with quarterly data

    let hasQuarters = [858, 859, 860, 861, 862, 863];

    if (aqFilteredComparisonsMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {

        // console.log(">>>> aqFilteredComparisonsData [quarters]:");

        aqFilteredComparisonsData = aqFilteredComparisonsData
            .join(aqMeasureIdTimes, [["MeasureID", "Time"], ["MeasureID", "TimeDescription"]])
            .derive({"year": d => op.year(d.end_period)})
            .filter(d => d.year > op.max(d.year) - 3)
            .select(aq.not("TimeDescription", "year"))
            // .print(20)

    }


    // ----- render the chart -------------------------------------------------- //

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

    // ---- handle selection -------------------------------------------------- //

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

    // call createJoinedLinksData, which creates joinedLinksDataObjects,
    //  primaryMeasureMetadata, secondaryMeasureMetadata

    let aqJoinedLinksDataObjects = await createJoinedLinksData(primaryMeasureId, secondaryMeasureId)
    
    joinedLinksDataObjects = aqJoinedLinksDataObjects.objects()

    // console.log(">> joinedLinksDataObjects [updateLinksData]", joinedLinksDataObjects);


    // ----- get metatadata for selected measure -------------------------------------------------- //

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

    const primaryMeasurementType = primaryMeasureMetadata[0].MeasurementType;
    const secondaryMeasurementType = secondaryMeasureMetadata[0].MeasurementType;

    const primaryAbout = primaryMeasureMetadata[0].how_calculated;
    const secondaryAbout = secondaryMeasureMetadata[0].how_calculated;

    const primarySources = primaryMeasureMetadata[0].Sources;
    const secondarySources = secondaryMeasureMetadata[0].Sources;


    // ----- set measure info boxes -------------------------------------------------- //

    selectedLinksAbout =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${secondaryIndicatorName} - ${secondaryMeasurementType}</h6>
        <p>${secondaryAbout}</p>`;

    selectedLinksSources =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${secondaryIndicatorName} - ${secondaryMeasurementType}</h6>
        <p>${secondarySources}</p>`;

    // render the measure info boxes

    renderAboutSources(selectedLinksAbout, selectedLinksSources);


    // ----- render the chart -------------------------------------------------- //

    renderLinksChart(
        joinedLinksDataObjects,
        primaryMeasureMetadata,
        secondaryMeasureMetadata,
        primaryIndicatorName,
        secondaryIndicatorName
    );

    updateChartPlotSize();

    // allow links chart to persist when changing tabs

    selectedLinksMeasure = true;

}


// ----------------------------------------------------------------------- //
// table filtering functions
// ----------------------------------------------------------------------- //

// need to be defined before `renderMeasures`, where they're added as listener callbacks

// ===== year ================================================== //

// ----- add listener on each dropdown item -------------------------------------------------- //

const handleTableYearFilter = (el) => {

    el.addEventListener('change', (e) => {

        // console.log("e", e);

        if (e.target.checked) {

            // selectedTableYears = [e.target.value]
            selectedTableYears.push(e.target.value)

        } else {

            // if the selected element is not checked, remove it from table years

            let index = selectedTableYears.indexOf(e.target.value);

            if (index !== -1) {
                selectedTableYears.splice(index, 1);
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
            mapData
                .filter(obj => obj.MeasureID == MeasureID && prettifyGeoType(obj.GeoType) == GeoType)
                .map(d => d.Time)
        )]

    console.log("mapTimesAvailable [handleMapTimeDropdown]", mapTimesAvailable);

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

const handleMapGeoDropdown = (MeasureID, Time) => {

    let allGeoButtons = document.querySelectorAll('.mapgeosbutton');

    let mapGeosAvailable =
        [...new Set(
            mapData
                .filter(obj => obj.MeasureID == MeasureID && obj.Time == Time)
                .map(d => prettifyGeoType(d.GeoType))
        )]

    console.log("mapGeosAvailable [handleMapGeoDropdown]", mapGeosAvailable);

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
// function to render the measures
// ----------------------------------------------------------------------- //

const renderMeasures = async () => {

    console.log("* renderMeasures");

    selectedTableYears = [];
    selectedTableGeography = [];

    linksMeasures.length = 0

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

    mapMeasures.length = 0;
    trendMeasures.length = 0;


    // ----- create dropdowns for table ================================================== //

    // ----- select all -------------------------------------------------- //

    dropdownTableTimes.innerHTML +=
        `<label class="dropdown-item checkbox-year-all"><input class="largerCheckbox" type="checkbox" name="year" value="all" /> Select all </label>`

    // ----- years -------------------------------------------------- //

    const tableYears = [...new Set(tableData.map(item => item.Time))];

    // console.log("tableYears", tableYears);

    tableYears.forEach((year, index) => {

        if (index === 0) {

            // default to most recent year

            selectedTableYears = [year];

            dropdownTableTimes.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" checked /> ${year}</label>`;

        } else {

            dropdownTableTimes.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" /> ${year}</label>`;
        }

    });


    // ----- geo types -------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [...new Set(tableData.map(item => prettifyGeoType(item.GeoType)))];
    const dropdownTableGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g))

    // console.log("geoTypes:", geoTypes);
    // console.log("dropdownTableGeoTypes:", dropdownTableGeoTypes);

    dropdownTableGeoTypes.forEach(geo => {

        selectedTableGeography.push(geo);
        
        // console.log("selectedTableGeography:", selectedTableGeography);

        dropdownTableGeos.innerHTML += `<label class="dropdown-item checkbox-geo"><input class="largerCheckbox" type="checkbox" value="${geo}" checked /> ${geo}</label>`;

    });


    // ----- create dropdowns for map ================================================== //

    // ----- geo types -------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const mapGeoTypes = [...new Set(mapData.map(item => prettifyGeoType(item.GeoType)))];
    const dropdownMapGeoTypes = geoTypes.filter(g => mapGeoTypes.includes(g))

    // console.log("geoTypes:", geoTypes);
    // console.log("dropdownMapGeoTypes:", dropdownMapGeoTypes);

    dropdownMapGeoTypes.forEach(geo => {

        // selectedTableGeography.push(geo);
        
        // console.log("selectedTableGeography:", selectedTableGeography);

        dropdownMapGeos.innerHTML += `<button class="dropdown-item link-time mapgeosbutton pl-2"
            data-geo="${geo}">
            ${geo}
            </button>`;

    });


    // ----- times -------------------------------------------------- //

    const mapTimes = [...new Set(mapData.map(item => item.Time))];

    // console.log("mapTimes", mapTimes);

    mapTimes.map(time => {

        dropdownMapTimes.innerHTML += `<button class="dropdown-item link-time maptimesbutton pl-2"
            data-time="${time}">
            ${time}
            </button>`;

    });


    // ----- handle measures for this indicator ================================================== //

    let header = "";

    indicatorMeasures.map((measure, index) => {

        // console.log("index", index);
        // console.log("measure", measure);

        const type = measure?.MeasurementType;
        const links = measure?.VisOptions[0].Links && measure?.VisOptions[0]?.Links[0];
        const map = measure?.VisOptions[0].Map && measure?.VisOptions[0].Map[0]?.On;
        const trend = measure?.VisOptions[0].Trend && measure?.VisOptions[0].Trend[0]?.On;
        const measureId = measure.MeasureID;

        // console.log("type", type, "links", links, "map", map, "trend", trend);


        // ----- handle map measures -------------------------------------------------- //

        if (map === 1) {
            
            mapMeasures.push(measure)
            
            dropdownMapMeasures.innerHTML += `<button class="dropdown-item link-measure mapmeasuresbutton pl-2"
                data-measure-id="${measureId}">
                ${type}
                </button>`;
            
        }


        // ----- handle trend measures -------------------------------------------------- //

        if (trend === 1) {

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


        // ----- handle links measures -------------------------------------------------- //

        if (links) {

            // create linked measures object

            linksMeasures.push(measure)

            // get secondary measure id

            if (tableData) {

                dropdownLinksMeasures.innerHTML +=
                    `<div class="dropdown-title pl-2"><strong> ${type}</strong></div>`;

                measure.VisOptions[0].Links.map(link => {

                    const linksSecondaryIndicator = indicators.filter(indicator =>
                        indicator.Measures.some(m =>
                            m.MeasureID === link.MeasureID
                        )
                    );

                    const linksSecondaryMeasure = linksSecondaryIndicator[0].Measures.filter(m =>
                        m.MeasureID === link.MeasureID
                    );

                    dropdownLinksMeasures.innerHTML +=
                        `<button class="dropdown-item linksbutton pl-3"
                            data-primary-measure-id="${measureId}"
                            data-measure-id="${measure.MeasureID}"
                            data-secondary-measure-id="${link.MeasureID}">
                            ${linksSecondaryMeasure[0].MeasureName}
                        </button>`;

                });
            }
        }
    });


    // ===== handle comparisons viz ================================================== //

    if (indicatorComparisonId !== null) {

        let compLegendTitles = [... new Set(aqCombinedComparisonsMetadata.array("LegendTitle"))]

        compLegendTitles.map(title => {

            let titleGroup = aqCombinedComparisonsMetadata.filter(aq.escape(d => d.LegendTitle == title))

            // add each unique legend title as a header, with the included comparisons underneath

            dropdownTrendComparisons.innerHTML += title ? '<div class="dropdown-title pl-2"><strong>' + title + '</strong></div>' : '';

            let comparisonIDs = [... new Set(titleGroup.array("ComparisonID"))]

            comparisonIDs.map(comp => {

                // console.log("ComparisonID", comp);
                
                let compGroup = titleGroup.filter(aq.escape(d => d.ComparisonID == comp))
                
                let compIndicatorLabel   = [... new Set(compGroup.array("IndicatorLabel"))];
                let compMeasurementType  = [... new Set(compGroup.array("MeasurementType"))];
                let compY_axis_title     = [... new Set(compGroup.array("Y_axis_title"))];
                // let compIndicatorMeasure = [... new Set(compGroup.array("IndicatorMeasure"))];
                let compGeoTypeName      = [... new Set(compGroup.array("GeoTypeName"))];
                let compGeography        = [... new Set(compGroup.array("Geography"))];
                let compName             = [... new Set(compGroup.array("ComparisonName"))];

                console.log("compGeography", compGeography);
                
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


    setDefaultMapMeasure(mapMeasures);
    setDefaultTrendMeasure(trendMeasures);

    // set default measure for links; also calls (and waits for) createJoinedLinksData, which creates the joined data

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ================================================== //

    showTable = (e) => {

        console.log("* showTable");

        // ----- handle tab selection -------------------------------------------------- //

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


        // ----- set measure info boxes -------------------------------------------------- //

        renderTitleDescription(indicatorShortName, indicatorDesc);
        renderAboutSources(measureAbout, measureSources);


        // ----- render the table -------------------------------------------------- //

        renderTable();

        updateChartPlotSize();

        $($.fn.dataTable.tables(false))
            .DataTable()
            .columns.adjust().draw();

    };


    // ===== map ================================================== //

    showMap = (e) => {

        console.log("* showMap");

        // ----- handle tab selection -------------------------------------------------- //

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

            console.log(">> no selected [showMap]");

            let latest_time;
            let maxGeoPretty;


            // ----- get metatadata for default measure -------------------------------------------------- //

            // get default measure id

            let defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

            // ----- create dataset -------------------------------------------------- //

            // filter map data using default measure

            filteredMapData = mapData.filter(
                    obj => obj.MeasureID === defaultMapMeasureId
                );

            console.log("filteredMapData [showMap]", filteredMapData);

            // ----- allow map to persist when changing tabs -------------------------------------------------- //

            if (!selectedMapMeasure) {
            if (!selectedMapMeasure) {

                console.log(">> no selectedMapMeasure");
                console.log(">> no selectedMapMeasure");

                // this is all inside the conditional, because if a user clicks on this tab again
                //  after selecting a measure, we don't want to recompute everything. We'll use the
                //  values created by the update function

                // ----- get metatadata for default measure -------------------------------------------------- //

                // get default measure id

                defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

                // extract metadata for info boxes

                const about   = defaultMapMetadata[0]?.how_calculated;
                const sources = defaultMapMetadata[0].Sources;
                const measure = defaultMapMetadata[0].MeasurementType;


                // ----- set measure info boxes -------------------------------------------------- //

                defaultMapAbout   =
                    `<h6>${indicatorName} - ${measure}</h6>
                    <p>${about}</p>`;

                defaultMapSources =
                    `<h6>${indicatorName} - ${measure}</h6>
                    <p>${sources}</p>`;

                // render measure info boxes

                renderTitleDescription(indicatorShortName, indicatorDesc);
                renderAboutSources(defaultMapAbout, defaultMapSources);


                // ----- create dataset -------------------------------------------------- //

                // filter map data using default measure

                filteredMapData = filteredMapData.filter(
                        obj => obj.MeasureID === defaultMapMeasureId
                    );

                console.log("filteredMapData [no selectedMapMeasure]", filteredMapData);

            }


            if (!selectedMapTime) {

                console.log(">> no selectedMapTime");

                // get the latest end_period

                let latest_end_period = Math.max(filteredMapData[0].end_period);

                filteredMapData = filteredMapData.filter(
                        obj => obj.end_period === latest_end_period
                    );

                latest_time = filteredMapData[0].Time

                console.log("filteredMapData [no selectedMapTime]", filteredMapData);

            }

            if (!selectedMapGeo) {

                console.log(">> no selectedMapGeo [showMap]");

                // get the highest GeoRank for this measure and end_period

                let maxGeoRank = Math.max(filteredMapData[0].GeoRank);

                // console.log("maxGeoRank [showMap]", maxGeoRank);

                filteredMapData = filteredMapData.filter(
                    obj => obj.GeoRank === maxGeoRank
                );

                let maxGeo = filteredMapData[0].GeoType
                maxGeoPretty = prettifyGeoType(maxGeo)

                console.log("filteredMapData [no selectedMapGeo]", filteredMapData);

                // console.log("maxGeo [showMap]", maxGeo);
                // console.log("maxGeoPretty [showMap]", maxGeoPretty);

            }

            // ----- format dropdowns -------------------------------------------------- //

            // called before renderMap in case it fails, so dropdowns will show available combos
            
            handleMapTimeDropdown(defaultMapMeasureId, maxGeoPretty)
            handleMapGeoDropdown(defaultMapMeasureId, latest_time)

            // ----- render the map -------------------------------------------------- //

            // console.log("filteredMapData [showMap 1]", filteredMapData);

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();

            // ----- persistent selection -------------------------------------------------- //

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

            console.log("else [showMap]");

            // ----- set measure info boxes -------------------------------------------------- //

            renderAboutSources(selectedMapAbout, selectedMapSources);

            // ----- get current dropdown values -------------------------------------------------- //

            let time = $('.maptimesbutton.active').attr("data-time")
            let geo = $('.mapgeosbutton.active').attr("data-geo")
            let measureId = $('.mapmeasuresbutton.active').attr("data-measure-id")

            console.log("*measureId*", measureId, "*geo*", geo, "*time*", time);

            // ----- format dropdowns -------------------------------------------------- //

            // called before renderMap in case it fails, so dropdowns will show available combos
            
            handleMapTimeDropdown(measureId, geo)
            handleMapGeoDropdown(measureId, time)

            // ----- render the map -------------------------------------------------- //

            // console.log("filteredMapData [showMap 2]", filteredMapData);

            renderMap(filteredMapData, selectedMapMetadata);

            updateChartPlotSize();
        }


    };


    // ===== trend ================================================== //

    // ----- handle tab selection -------------------------------------------------- //

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

    // ----- show the normal trend chart -------------------------------------------------- //

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

        // ----- allow chart to persist when changing tabs -------------------------------------------------- //

        // console.log("selectedTrendMeasure", selectedTrendMeasure);

        if (!selectedTrendMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function


            // ----- get metatadata for default measure -------------------------------------------------- //

            const about   = defaultTrendMetadata[0]?.how_calculated;
            const sources = defaultTrendMetadata[0].Sources;
            const measure = defaultTrendMetadata[0].MeasurementType;

            aqDefaultTrendMetadata = aq.from(defaultTrendMetadata)
                .derive({
                    IndicatorLabel: aq.escape(indicatorName),
                    ComparisonName: aq.escape('Boroughs')
                })

            // console.log("aqDefaultTrendMetadata");
            // aqDefaultTrendMetadata.print()


            // ----- set measure info boxes -------------------------------------------------- //

            defaultTrendAbout =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${about}</p>`;

            defaultTrendSources =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${sources}</p>`;

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultTrendAbout, defaultTrendSources);


            // ----- create dataset -------------------------------------------------- //

            const defaultTrendMeasureId = defaultTrendMetadata[0].MeasureID;
            filteredTrendData = trendData.filter(m => m.MeasureID === defaultTrendMeasureId);


            // ----- render the chart -------------------------------------------------- //

            // using 'aqFilteredTrendData' for all of the datasets allows the "else selected" block to use
            //  this same dataset. It will be whatever was most recently assigned to it.

            if (measureIdsAnnualAvg.includes(defaultTrendMeasureId)) {

                // console.log("measureIdsAnnualAvg.includes(defaultTrendMeasureId)");
                
                const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));
                aqFilteredTrendData = aq.from(filteredTrendDataAnnualAvg);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);
                updateChartPlotSize();
                
            } else if (measureIdsSummer.includes(defaultTrendMeasureId)) {

                // console.log("measureIdsSummer.includes(defaultTrendMeasureId)");
                
                const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));
                aqFilteredTrendData = aq.from(filteredTrendDataSummer);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);
                updateChartPlotSize();
                
            } else {

                // console.log(">>>>> else");

                aqFilteredTrendData = aq.from(filteredTrendData);
                
                renderComparisonsChart(aqFilteredTrendData, aqDefaultTrendMetadata);
                updateChartPlotSize();
                
            }


            // ----- persistent selection -------------------------------------------------- //

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

            // ----- set measure info boxes -------------------------------------------------- //

        } else {

            // if there was a chart already, restore it
            // ----- render the chart -------------------------------------------------- //

            // ----- set measure info boxes -------------------------------------------------- //

            renderAboutSources(selectedTrendAbout, selectedTrendSources);

            // ----- render the chart -------------------------------------------------- //
            
            aqFilteredTrendData = aq.from(filteredTrendData);

            // renderTrendChart(filteredTrendData, aqDefaultTrendMetadata);
            renderComparisonsChart(aqFilteredTrendData, aqSelectedTrendMetadata);

            updateChartPlotSize();

        }

        showingNormalTrend = true;
        showingComparisonsTrend = false;

    };
    

    // ----- show the trend comparisons chart -------------------------------------------------- //

    showTrendComparisons = (e) => {

        console.log("** showTrendComparisons");
        // console.log("selectedComparison", selectedComparison);

        // ----- allow chart to persist when changing tabs -------------------------------------------------- //

        if (!selectedComparison) {

            // ----- handle selection -------------------------------------------------- //

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


            // ----- set measure info boxes -------------------------------------------------- //

            // reset info boxes

            selectedComparisonAbout = [];
            selectedComparisonSources = [];

            aqComparisonsIndicatorsMetadata.objects().forEach(m => {

                selectedComparisonAbout +=
                    `<h6>${m.IndicatorName} - ${m.MeasurementType}</h6>
                    <p>${m.how_calculated}</p>`;

                selectedComparisonSources +=
                    `<h6>${m.IndicatorName} - ${m.MeasurementType}</h6>
                    <p>${m.Sources}</p>`;
            })

            // render the measure info boxes

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(selectedComparisonAbout, selectedComparisonSources);


            // ----- create dataset -------------------------------------------------- //

            // metadata

            aqFilteredComparisonsMetadata = aqComparisonsMetadata
                .filter(aq.escape(d => d.ComparisonID == comparisonId))
                .join(aqComparisonsIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

            // console.log("aqFilteredComparisonsMetadata:");
            // aqFilteredComparisonsMetadata.print({limit: Infinity})
            
            // data

            aqFilteredComparisonsData = aqFilteredComparisonsMetadata
                .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
                .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])

                // put host indicator first (then measure), so it gets the black line
                .orderby(aq.desc(aq.escape(d => d.IndicatorID == indicatorId)), d => d.MeasureID)

            // console.log(">>>> aqFilteredComparisonsData:");
            // aqFilteredComparisonsData.print({limit: Infinity})

            // show only last 3 years of DWQ measures with quarterly data

            let hasQuarters = [858, 859, 860, 861, 862, 863];

            if (aqFilteredComparisonsMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {

                // console.log(">>>> aqFilteredComparisonsData [quarters]:");

                aqFilteredComparisonsData = aqFilteredComparisonsData
                    .join(aqMeasureIdTimes, [["MeasureID", "Time"], ["MeasureID", "TimeDescription"]])
                    .derive({"year": d => op.year(d.end_period)})
                    .filter(d => d.year > op.max(d.year) - 3)
                    .select(aq.not("TimeDescription", "year"))
                    // .print(20)

            }

            // console.log("aqFilteredComparisonsData:");
            // aqFilteredComparisonsData.print()


            // ----- render the chart -------------------------------------------------- //

            renderComparisonsChart(
                aqFilteredComparisonsData,
                aqFilteredComparisonsMetadata
            );

            updateChartPlotSize();

        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes -------------------------------------------------- //

            renderAboutSources(selectedComparisonAbout, selectedComparisonSources);

            // ----- render the chart -------------------------------------------------- //

            // renderTrendChart(filteredTrendData, aqDefaultTrendMetadata);
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

        // ----- handle tab selection -------------------------------------------------- //

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


        // ----- allow chart to persist when changing tabs -------------------------------------------------- //

        if (!selectedLinksMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function


            // ----- handle disparities button -------------------------------------------------- //

            // switch on/off the disparities button

            const disparities =
                defaultLinksMetadata[0].VisOptions[0].Trend &&
                defaultLinksMetadata[0].VisOptions[0].Trend[0]?.Disparities;

            // hide or how disparities button

            if (disparities == 0) {

                // if disparities is disabled, hide the button

                btnToggleDisparities.style.display = "none";

                // remove click listeners to button that calls renderDisparities

                // $(btnToggleDisparities).off()

            } else if (disparities == 1) {

                // remove event listener added when/if button was clicked

                // btnToggleDisparities.innerText = "Show Disparities";
                // $(btnToggleDisparities).off()

                // make sure that the "links" button is active by default
                $("#show-links").addClass("active");
                $("#show-disparities").removeClass("active");

                // if disparities is enabled, show the button
                btnToggleDisparities.style.display = "inline";


            }

            // ----- get metatadata for default measure -------------------------------------------------- //

            // get first linked measure by default

            const secondaryMeasureId = defaultLinksMetadata[0]?.VisOptions[0].Links[0].MeasureID;

            // get linked indicator's metadata

            const linksSecondaryIndicator = indicators.filter(indicator =>
                indicator.Measures.some(measure =>
                    measure.MeasureID === secondaryMeasureId
                )
            )

            // use linked indicator's metadata to get linked measure's metadata

            const linksSecondaryMeasure = linksSecondaryIndicator[0].Measures.filter(m =>
                m.MeasureID === secondaryMeasureId
            )

            primaryIndicatorName   = indicatorName;
            secondaryIndicatorName = linksSecondaryIndicator[0].IndicatorName;

            // get measure metadata

            const primaryMeasure         = defaultLinksMetadata[0].MeasurementType;
            const primaryAbout           = defaultLinksMetadata[0].how_calculated;
            const primarySources         = defaultLinksMetadata[0].Sources;

            const secondaryMeasure       = linksSecondaryMeasure[0].MeasurementType;
            const secondaryAbout         = linksSecondaryMeasure[0].how_calculated;
            const secondarySources       = linksSecondaryMeasure[0].Sources;


            // ----- set measure info boxes -------------------------------------------------- //

            // creating indicator & measure info

            defaultLinksAbout =
                `<h6>${primaryIndicatorName} - ${primaryMeasure}</h6>
                <p>${primaryAbout}</p>
                <h6>${secondaryIndicatorName} - ${secondaryMeasure}</h6>
                <p>${secondaryAbout}</p>`;

            defaultLinksSources =
                `<h6>${primaryIndicatorName} - ${primaryMeasure}</h6>
                <p>${primarySources}</p>
                <h6>${secondaryIndicatorName} - ${secondaryMeasure}</h6>
                <p>${secondarySources}</p>`;


            // ----- create dataset -------------------------------------------------- //

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultLinksAbout, defaultLinksSources);


            // ----- render the chart -------------------------------------------------- //

            // joined data and metadata created in createJoinedLinksData called fron setDefaultLinksMeasure

            renderLinksChart(
                joinedLinksDataObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();


            // ----- persistent selection -------------------------------------------------- //

            // remove active class from every list element
            $('.linksbutton').removeClass("active");
            $('.linksbutton').attr('aria-selected', false);

            // set this element as active & selected

            let linksMeasureEl = document.querySelector(`.linksbutton[data-secondary-measure-id='${secondaryMeasureId}']`)

            $(linksMeasureEl).addClass("active");
            $(linksMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes -------------------------------------------------- //

            renderAboutSources(selectedLinksAbout, selectedLinksSources);

            // ----- render the chart -------------------------------------------------- //

            renderLinksChart(
                joinedLinksDataObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();
        }


        // add click listener to button that calls renderDisparities

        $(btnToggleDisparities).off()

        $(btnToggleDisparities).on("click", (e) => {

            // console.log("btnToggleDisparities", e);

            if (e.target && e.target.matches("#show-disparities") && !e.target.classList.contains("active")) {

                renderDisparities(defaultLinksMetadata, 221)

            } else if (e.target && e.target.matches("#show-links") && !e.target.classList.contains("active")) {

                showLinks();

            }

        });

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

    // if there's no trend data or only 1 time period, don't show the tab

    const onlyOneTime = trendMeasures.every(m => m.AvailableTimes.length <= 1)

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


    if (linksMeasures.length === 0) {

        if (tabLinksSelected && window.location.hash === '#display=links') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

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

    const checkboxYear = document.querySelectorAll('.checkbox-year');
    const checkboxYearAll = document.querySelectorAll('.checkbox-year-all');
    const checkboxGeo = document.querySelectorAll('.checkbox-geo');

    checkboxYear.forEach(checkbox => {
        handleTableYearFilter(checkbox);
    })

    checkboxYearAll[0].addEventListener('change', (e) => {

        if (!e.target.checked) {

            // console.log("not checked");

            checkboxYear.forEach(checkbox => {

                // console.log("checkbox", checkbox);

                $(checkbox).find("input").prop("checked", false)
                selectedTableYears = []

            })

            // console.log("selectedTableYears [not checked]", selectedTableYears);

        } else if (e.target.checked) {

            // console.log("checked");

            checkboxYear.forEach(checkbox => {

                // console.log("checkbox", checkbox);

                $(checkbox).find("input").prop("checked", true)
                selectedTableYears.push($(checkbox).find("input").val())

            })

            // console.log("selectedTableYears [checked]", selectedTableYears);


        }

        renderTable()

    })


    checkboxGeo.forEach(checkbox => {
        handleTableGeoFilter(checkbox);
    })




    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // Render default Measure About and Sources
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    measureAbout = '';
    measureSources = '';
    indicatorMeasures.map(measure => {

        measureAbout +=
            `<h6>${measure.MeasurementType}</h6>
            <p>${measure.how_calculated}</p>`;

        measureSources +=
            `<h6>${measure.MeasurementType}</h6>
            <p>${measure.Sources}</p>`;

    })

    renderAboutSources(measureAbout, measureSources);

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

    const filteredTableYearData = tableData.filter(d => selectedTableYears.includes(d.Time))

    // ----------------------------------------------------------------------- //
    // format geography dropdown checkboxes
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get (pretty) geoTypes available for this year
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const dataGeos = [...new Set(filteredTableYearData.map(d => prettifyGeoType(d.GeoType)))];

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
    
    // now add disabled class for geos not available for this year

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
            filteredTableYearData
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

    table_unreliability.forEach(element => {
        
        document.querySelector("#table-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        
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
        .groupby("Time", "GeoTypeDesc", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
    
        // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
        // .impute(measureImputeObj) 
        
        // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
        .relocate(["Time", "GeoTypeDesc", "GeoID", "GeoRank"], { before: 0 }) 
    
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
    
    const groupColumnYear = 0
    const groupColumnGeo = 1;

    $('#tableID').DataTable({
        scrollY: 475,
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
                row.setAttribute(`data-year`, `${time}`);
            }
        },
        "drawCallback": function ( settings ) {
            const api = this.api();
            const data = api.rows( {page:'current'} ).data()
            const rows = api.rows( {page:'current'} ).nodes();
            const totaleColumnsCount = api.columns().count()
            const visibleColumnsCount =  totaleColumnsCount - 4;
            
            let last = null;
            let lastYr = null;
            
            const createGroupRow = (groupColumn, lvl) => {

                // console.log("groupColumn", groupColumn);
                // console.log("lvl", lvl);
                
                api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {

                    // console.log("group", group);
                    // console.log("i", i);
                    
                    const year = data[i][0]
                    const groupName = `${year}-${group}`
                    
                    // console.log("year", year);

                    if ( last !== group || lastYr !== year ) {
                        
                        $(rows).eq( i ).before(
                            `<tr class="group"><td colspan="${visibleColumnsCount}" data-year="${year}" data-group="${group}" data-group-level="${lvl}"> ${group}</td></tr>`
                            );
                            last = group;
                            lastYr = year
                            
                        }
                    });
                }
                
                createGroupRow(groupColumnYear, 0);
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

            const subGroupToggle = $(`td[data-year="${group}"][data-group-level="1"]`);
            const subGroupRow = $(`tr[data-year="${group}"]`);

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

        const mapYears =  [...new Set(data.map(item => item.Time))];

        // ----------------------------------------------------------------------- //
        // pull metadata
        // ----------------------------------------------------------------------- //

        // debugger;

        // console.log("mapYears [map.js]", mapYears);

        let mapGeoType            = data[0].GeoType;
        let geoTypeShortDesc      = data[0].GeoTypeShortDesc;
        let mapMeasurementType    = metadata[0].MeasurementType;
        let displayType           = metadata[0].DisplayType;
        let mapGeoTypeDescription = 
            metadata[0].AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        let mapTime = mapYears[0];
        let topoFile = '';

        var color = 'purplered'
        var rankReverse = defaultMapMetadata[0].VisOptions[0].Map[0].RankReverse
        if (rankReverse === 0) {
            color = 'reds'
        } else if (rankReverse === 1) {
            color = 'blues'
        }

        // console.log('rank reverse?', rankReverse)
        // console.log('color', color)


        // ----------------------------------------------------------------------- //
        // get unique unreliability notes (dropping empty)
        // ----------------------------------------------------------------------- //

        const map_unreliability = [...new Set(data.map(d => d.Note))].filter(d => !d == "");

        document.querySelector("#map-unreliability").innerHTML = ""; // blank to start

        map_unreliability.forEach(element => {

            document.querySelector("#map-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
            
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
        } else if (mapGeoType === "NYHarbor") {
            topoFile = 'ny_harbor.topo.json';
        }

        // ----------------------------------------------------------------------- //
        // define spec
        // ----------------------------------------------------------------------- //
        
        mapspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": indicatorName,
                "subtitlePadding": 10,
                "fontWeight": "normal",
                "anchor": "start", 
                "fontSize": 18, 
                "font": "sans-serif",
                "baseline": "top",
                "subtitle": `${mapMeasurementType}${displayType && ` (${displayType})`}, by ${mapGeoTypeDescription} (${mapTime})`,
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
            },
            "projection": {"type": "mercator"},
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
                        {
                            "height": 500,
                            "width": "container",
                            "mark": {"type": "geoshape", "invalid": null},
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
                                "shape": {"field": "geo", "type": "geojson"},
                                "color": {
                                    "condition": {
                                        "test": "isValid(datum.Value)",
                                        "bin": false,
                                        "field": "Value",
                                        "type": "quantitative",
                                        "scale": {"scheme": {"name": color, "extent": [0.125, 1.125]}}
                                    },
                                    "value": "#808080"
                                },
                                "stroke": {
                                    "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                                    // "value": "#161616"
                                    "value": "#dadada"
                                },
                                "strokeWidth": {
                                    "condition": [{"param": "highlight", "empty": false, "value": 1.25}],
                                    "value": 0.5
                                },
                                "order": {
                                    "condition": [{"param": "highlight", "empty": false, "value": 1}],
                                    "value": 0
                                },
                                "tooltip": [
                                    {
                                        "field": "Geography", 
                                        "title": geoTypeShortDesc
                                    },
                                    {
                                        "field": "DisplayValue",
                                        "title": mapMeasurementType
                                    },
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
                                "title": geoTypeShortDesc
                            },
                            {
                                "field": "DisplayValue", 
                                "title": mapMeasurementType
                            },
                        ],
                        "x": {"field": "GeoID", "sort": "y", "axis": null},
                        "color": {
                            "bin": false,
                            "field": "Value",
                            "type": "quantitative",
                            "scale": {"scheme": {"name": color, "extent": [0.25, 1.25]}},
                            "legend": {
                                "direction": "horizontal", 
                                "orient": "top-left",
                                "title": null,
                                "offset": -30,
                                "padding": 10,
                            }
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

        // ----------------------------------------------------------------------- //
        // Send chart data to download
        // ----------------------------------------------------------------------- //

        let dataForDownload = [...mapspec.data.values] // create a copy
        // console.log(dataForDownload===mapspec.data.values) 

        let downloadTable = aq.from(dataForDownload)
            .derive({Indicator: `'${indicatorName}: ${mapMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
            .select(aq.not('GeoRank',"end_period","start_period","ban_summary_flag","GeoTypeShortDesc","MeasureID","DisplayValue")) // remove excess columns
            // .print()

        CSVforDownload = downloadTable.toCSV()

    }
;
// ======================================================================= //
// links.js
// ======================================================================= //

const renderLinksChart = (
    data,
    primaryMetadata,   // indicators.json for primary indicator
    secondaryMetadata, // indciators.json for secondary indicator
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

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryMeasureName     = primaryMetadata[0].MeasureName;
    const primaryDisplay         = primaryMetadata[0].DisplayType;
    const primaryTime            = data[0].Time_1;
    const geoTypeShortDesc       = data[0].GeoTypeShortDesc_1;

    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0].MeasureName
    const secondaryMeasureId       = secondaryMetadata[0].MeasureID
    const secondaryDisplay         = secondaryMetadata[0].DisplayType;
    const secondaryTime            = data[0].Time_2;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links.filter(
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
    let xTime;
    let yTime;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;

    switch (SecondaryAxis) {
        case 'x':
            xMeasure = secondaryMeasurementType;
            yMeasure = primaryMeasurementType;
            xMeasureName = secondaryMeasureName;
            yMeasureName = primaryMeasureName;
            xValue = "Value_2";
            yValue = "Value_1";
            xMin = Math.min.apply(null, Value_2); // get min value for adjusting axis
            xDisplay = secondaryDisplay ? secondaryDisplay : '';
            yDisplay = primaryDisplay ? primaryDisplay : '';
            xTime = secondaryTime;
            yTime = primaryTime;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            break;
        case 'y':
            xMeasure = primaryMeasurementType;
            yMeasure = secondaryMeasurementType;
            xMeasureName = primaryMeasureName;
            yMeasureName = secondaryMeasureName;
            xValue = "Value_1";
            yValue = "Value_2";
            xMin = Math.min.apply(null, Value_1); // get min value for adjusting axis
            xDisplay = primaryDisplay ? primaryDisplay : '';
            yDisplay = secondaryDisplay ? secondaryDisplay : '';
            xTime = primaryTime;
            yTime = secondaryTime;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
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
            "subtitle": `${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`} (${yTime})`,
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
            },
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "align": "center",
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values": data
        },
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
                        "title": [`${xIndicatorName && `${xIndicatorName}`}`, `${xMeasure} ${xDisplay && `(${xDisplay})`} (${xTime})`],
                        "field": xValue,
                        "type": "quantitative",
                        "scale": {"domainMin": xMin, "nice": true}
                    },
                    "tooltip": [
                        {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        {
                            "title": geoTypeShortDesc,
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {
                            "title": "Time",
                            "field": "Time_2",
                            "type": "nominal"
                        },
                        {
                            "title": yMeasureName,
                            "field": yValue,
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "title": xMeasureName,
                            "field": xValue,
                            "type": "quantitative",
                            "format": ",.1~f"
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
            {"mark": {
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

    // Deliver data for download
    let dataForDownload = [...linkspec.data.values]

    var dltable = aq.from(dataForDownload)
        .select(aq.not("GeoType","GeoTypeShortDesc_1","GeoTypeShortDesc_2","GeoRank_1","GeoRank_2","start_period_1","end_period_1","ban_summary_flag_1","ban_summary_flag_2","BoroID","DisplayValue_1","DisplayValue_2","GeoTypeDesc_2","Geography_2","start_period_2","end_period_2","MeasureID_1","MeasureID_2"))
        .derive({ Value_1_Indicator: `'${yIndicatorName} - ${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`}'`})
        .derive({ Value_2_Indicator: `'${xIndicatorName} - ${xMeasure} ${xDisplay && `(${xDisplay})`} '`})
        .print()

    CSVforDownload = dltable.toCSV()

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

const renderDisparities = async (primaryMetadata, disparityMeasureId) => {

    console.log("** renderDisparities");

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
    const primaryDisplay         = primaryMetadata[0]?.DisplayType;

    // get disparities poverty indicator metadata - "indicators" is a global object created by loadIndicator

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === disparityMeasureId
        )
    );

    const disparityMetadata = disparityIndicator[0].Measures.filter(
        m => m.MeasureID === disparityMeasureId
    );

    // ----------------------------------------------------------------------- //
    // put metadata into fields
    // ----------------------------------------------------------------------- //

    const disparityIndicatorId     = disparityIndicator[0].IndicatorID
    const disparityIndicatorName   = disparityIndicator[0].IndicatorName

    const disparityMeasurementType = disparityMetadata[0].MeasurementType
    const disparityMeasureName     = disparityMetadata[0].MeasureName
    // const disparityMeasureId       = disparityMetadata[0].MeasureID
    const disparityDisplay         = disparityMetadata[0].DisplayType;

    const disparitySources         = disparityMetadata[0].Sources
    const disparitysAbout          = disparityMetadata[0].how_calculated


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
            .then(data => {
                
                let dispData = data
                    .derive({ PovRank: d => (d.Value_2 > 30 ? 4 : (d.Value_2 > 20 ? 3 : ( d.Value_2 > 10 ? 2 : 1))) })
                    .derive({ PovCat: d => (d.PovRank == 4 ? 'Very high (> 30%)' : (d.PovRank == 3  ? 'High (20-30%)' : ( d.PovRank == 2  ? 'Medium (10-20%)' : 'Low (0-10%)'))) })
                    .derive({ randomOffsetX: aq.escape(d => d.PovRank + (myrng()*2 - 1)) })
                
                // console.log("dispData");
                // dispData.print()
                
                return dispData;
            })
        
        disparityData = aqDisparityData.objects()
        
    } else {
        // console.log(">>> selected disparity");
    }

    // set this to true

    selectedDisparity = true;

    // console.log(">> disparityData [renderDisparities]", disparityData);

    // debugger;

    const primaryTime   = disparityData[0].Time_1;
    const disparityTime = disparityData[0].Time_2;
    const geoTypeShortDesc = disparityData[0].GeoTypeShortDesc_1;

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

    disp_unreliability.forEach(element => {

        document.querySelector("#links-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>";

    });


    // ----------------------------------------------------------------------- //
    // created combined about and sources info
    // ----------------------------------------------------------------------- //

    const combinedAbout =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitysAbout}</p>`;

    const combinedSources =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitySources}</p>`;

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

    setTimeout(() => {

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
                "subtitle": `${primaryMeasurementType && `${primaryMeasurementType}`} ${primaryDisplay && `${primaryDisplay}`} (${primaryTime})`,
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
                        "title": [`${disparityIndicatorName && `${disparityIndicatorName}`}`, `(${disparityTime})`],
                        "field": "PovRank", // Changed
                        "type": "ordinal",
                        "axis": {
                            "labelExpr": "(datum.value == 4 ? 'Very high (over 30%)' : (datum.value == 3  ? 'High (20 - 29.9%)' : ( datum.value == 2  ? 'Medium (10 - 19.9%)' : 'Low (0 - 9.9%)')))",
                            "labelAlign": "center",
                            "labelAngle": 0
                        }
                    },
                    "xOffset": {"field": "randomOffsetX", "type": "quantitative"}, // Jitter
                    "tooltip": [
                    {
                        "title": "Borough", 
                        "field": "Borough", 
                        "type": "nominal"
                    },
                    {
                        "title": geoTypeShortDesc, 
                        "field": "Geography_1", 
                        "type": "nominal"
                    },
                    {
                        "title": "Time", 
                        "field": "Time_2", 
                        "type": "nominal"
                    },
                    {
                        "title": primaryMeasureName,
                        "field": "Value_1",
                        "type": "quantitative",
                        "format": ",.1~f"
                    },
                    {
                        "title": disparityMeasureName,
                        "field": "Value_2",
                        "type": "quantitative",
                        "format": ",.1~f"
                    },
                    {
                        "title": disparityIndicatorName,
                        "field": "PovCat",
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
        vegaEmbed("#links", disspec);
        console.log(disspec.data.values)
        let dataForDownload = [...disspec.data.values]
        var dltable = aq.from(dataForDownload)
            .select(aq.not("GeoType","GeoTypeShortDesc_1","GeoTypeShortDesc_2","GeoRank_1","GeoRank_2","start_period_1","end_period_1","ban_summary_flag_1","ban_summary_flag_2","BoroID","DisplayValue_1","DisplayValue_2","GeoTypeDesc_2","Geography_2","start_period_2","end_period_2","MeasureID_1","MeasureID_2","randomOffsetX"))
            .derive({ Value_1_Indicator: `'${primaryIndicatorName && `${primaryIndicatorName}`}'`})
            .derive({ Value_2_Indicator: `'${disparityIndicatorName}'`})
            .print()

        CSVforDownload = dltable.toCSV()


    }, 300)


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

    console.log(">>> comp metadata");
    metadata.print()
    
    console.log(">>> comp data:");
    data.print(20)

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start

    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        
    });

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //

    // dimensions

    let columns = window.innerWidth < 576 ? 3 : 6;
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
    let compGeoIDs          = metadata.objects()[0].GeoID ? [... new Set(metadata.array("GeoID"))] : null;

    console.log(">>>> compGeoIDs", compGeoIDs);

    console.log(">> compName", compName);
    console.log(">> compIndicatorLabel", compIndicatorLabel);
    console.log(">> compMeasurementType", compMeasurementType);


    // ----------------------------------------------------------------------- //
    // set chart text based on type of comparison
    // ----------------------------------------------------------------------- //

    let compGroupLabel;
    let plotSubtitle;
    let plotTitle;

    let suppressSubtitleBy = [564, 565, 566, 704, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730];

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    if (compName[0] === "Boroughs") {

        // ----- by boros: 1 indicator, 1 measure, 5 boros -------------------------------------------------- //

        console.log("boros");

        console.log("indicatorName", indicatorName);

        // if this is a boro comparison, tweak some things

        compGroupLabel = [... new Set(data.array("Geography"))];
        let hasBoros = compGroupLabel.length > 1 ? true : false; 
        
        plotTitle = indicatorName;
        plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? " by Borough" : "");
        comp_group_col = "Geography"

        console.log(">> compGroupLabel", compGroupLabel);
        console.log(">> plotTitle", plotTitle);
        console.log(">> plotSubtitle", plotSubtitle);


    } else if (compIndicatorLabel.length == 1) {

        // ----- by measure: 1 indicator, 2+ measures, 1 citywide -------------------------------------------------- //

        console.log("1 indicator");

        console.log("indicatorName", indicatorName);
        
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

        console.log(">> compGroupLabel", compGroupLabel);
        console.log(">> plotTitle", plotTitle);
        console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length == 1) {

        // ----- by indicator: 2+ indicators, 1 measure, 1 citywide -------------------------------------------------- //

        console.log("1 measure");

        console.log("indicatorName", indicatorName);

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]

        // console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");

        } else {

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        console.log(">> compGroupLabel", compGroupLabel);
        console.log(">> plotTitle", plotTitle);
        console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {
        
        // ----- by combo: 2+ indicators, 2+ measures, 1 citywide -------------------------------------------------- //

        console.log("> 1 measure & indicator");

        console.log("indicatorName", indicatorName);

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

        console.log(">> compGroupLabel", compGroupLabel);
        console.log(">> plotTitle", plotTitle);
        console.log(">> plotSubtitle", plotSubtitle);

    }


    // ----------------------------------------------------------------------- //
    // create tooltips JSON
    // ----------------------------------------------------------------------- //

    // will be spliced into the spec
    
    let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal"}})


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
            "values":  data,
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
                "field": "Time",
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
                        "value": "Value",
                        "groupby": [
                            "Time"
                        ]
                    }
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
                            "field": "Time",
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
                                "Time"
                            ],
                            "nearest": true,
                            "on": "mouseover",
                            "clear": "mouseout"
                        }
                    }
                ]
            }
        ]
    }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //
    
    vegaEmbed("#trend", compspec);

    let dataForDownload = [...compspec.data.values] // create a copy
    // console.log(dataForDownload===mapspec.data.values) 

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${plotTitle} ${plotSubtitle}'`}) // add indicator name and type column
        .select(aq.not("GeoType","GeoTypeDesc","GeoTypeShortDesc","GeoRank","MeasureID","ban_summary_flag","DisplayValue","start_period","end_period"))
        .print()

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
})

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map'
})   

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend'
})  

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links'
})


// ----------------------------------------------------------------------- //
// export functions
// ----------------------------------------------------------------------- //

// export current table or chart view
$("#chartView").on("click", (e) => {

    // if it's summary table... (uses DataTables.net methods)
    if (window.location.hash == '#display=summary') {
        console.log('we are on summary table')
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




})

// export full table data (i.e., original view)

$("#allData").on("click", (e) => {

    // pivot the full dataset

    let allData = aq.from(tableData)
        .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
        .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 })

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
