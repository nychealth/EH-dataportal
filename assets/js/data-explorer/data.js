// ======================================================================= //
// data.js
// ======================================================================= //

// ======================================================================= //
//  fetch and load indicators metadata into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// full indicator metadata
// ----------------------------------------------------------------------- //

var globalID

fetch(data_repo + data_branch + '/indicators/indicators.json')
    .then(response => response.json())
    .then(async data => {

        // console.log("** fetch indicators.json");

        indicators = data;

        const paramId = url.searchParams.get('id') !== null ? parseInt(url.searchParams.get('id')) : false;
        
        renderIndicatorDropdown()
        renderIndicatorButtons()

        // calling loadIndicator calls loadData, etc, and eventually renderMeasures. Because all 
        //  of this depends on the global "indicator" object, we call loadIndicator here
        
        if (paramId) {
            loadIndicator(paramId)
            // console.log('param id is set')
            globalID = paramId

            // fetch311(paramId)
        } else {
            // console.log('no param', url.searchParams.get('id'));
            loadIndicator()
        }
        
    })
    .catch(error => console.log(error));

// ======================================================================= //
//  fetch and load 311 Crosswalk into global object
// ======================================================================= //

var crosswalk
d3.csv(baseURL + '/311/311-crosswalk.csv').then(data => {
    crosswalk = data;
    draw311Buttons(globalID);
});

// ======================================================================= //
//  fetch and load comparison chart data into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// function to fetch indicator comparisons metadata
// ----------------------------------------------------------------------- //

const fetch_comparisons = async () => {
    
    console.log("** fetch_comparisons.json");

    await fetch(data_repo + data_branch + '/indicators/comparisons.json')
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
    
    console.log("** createComparisonData");
    
    console.log("comps [createComparisonData]:", comps);

    // will be used by renderMeasures to create dropdown
    
    comparisonsMetadata = await comps.filter(
        d => indicatorComparisonId.includes(d.ComparisonID)
    )
        
    console.log("comparisonsMetadata [createComparisonData]:", comparisonsMetadata);

    // merged metadata
    
    console.log("aqComparisonsMetadata:");

    aqComparisonsMetadata = aq.from(comparisonsMetadata)
        .unroll("Indicators")
        .derive({
            IndicatorID: d => d.Indicators.IndicatorID,
            MeasureID:   d => d.Indicators.MeasureID,
            GeoTypeName: d => d.Indicators.GeoTypeName,
            GeoID:       d => d.Indicators.GeoID
        })
        .select(aq.not("Indicators"))
        .print()

    console.log("aqUniqueIndicatorMeasure:");

    // get unique combinations of indicators and measures

    let aqUniqueIndicatorMeasure = aqComparisonsMetadata
        .select("IndicatorID", "MeasureID")
        .dedupe()
        .print()

    let uniqueIndicatorMeasure = aqUniqueIndicatorMeasure
        .groupby("IndicatorID")
        .objects({grouped: "entries"})

    let comparisonsIndicatorIDs = [... new Set(aqComparisonsMetadata.array("IndicatorID"))]
    let comparisonsMeasureIDs = [... new Set(aqComparisonsMetadata.array("MeasureID"))]

    let comparisonsIndicatorsMetadata = indicators.filter(
        ind => comparisonsIndicatorIDs.includes(ind.IndicatorID)
    )
    // console.log("comparisonsIndicatorsMetadata:", comparisonsIndicatorsMetadata);

    // console.log("aqComparisonsIndicatorsMetadata:");

    aqComparisonsIndicatorsMetadata = aq.from(comparisonsIndicatorsMetadata)
        .select("IndicatorID", "IndicatorName", "IndicatorLabel", "Measures")
        .unroll("Measures")
        .derive({
            MeasureID: d => d.Measures.MeasureID,
            MeasureName: d => d.Measures.MeasureName,
            MeasurementType: d => d.Measures.MeasurementType,
            Sources: d => d.Measures.Sources,
            how_calculated: d => d.Measures.how_calculated,
            DisplayType: d => d.Measures.DisplayType
        })
        .derive({IndicatorMeasure: d => d.IndicatorLabel + ": " + d.MeasurementType})
        .select(aq.not("Measures"))
        .filter(aq.escape(d => comparisonsMeasureIDs.includes(d.MeasureID)))
        // .print()



    // join comparisons metadata tables

    // console.log("aqCombinedComparisonsMetadata:");

    aqCombinedComparisonsMetadata = aqComparisonsMetadata
        .join(aqComparisonsIndicatorsMetadata, [["MeasureID", "IndicatorID"], ["MeasureID", "IndicatorID"]])
        // .print()

    // for each indicator, get all measures
    // Promise.all takes the array of promises returned by map, and then the `then` callback executes after they've all resolved

    Promise.all(
        uniqueIndicatorMeasure.map(async ind => {

            let measures = ind[1].flatMap(m => Object.values(m));
            
            return aq.loadJSON(`${data_repo}${data_branch}/indicators/data/${ind[0]}.json`)
                .then(async data => {

                    console.log("@@ data:");
                    await data.print()

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

        aqComparisonsIndicatorData = await dataArray.flatMap(d => d).reduce((a, b) => a.concat(b))

        aqComparisonsIndicatorData = aqComparisonsIndicatorData
            // .filter(d => op.match(d.GeoType, /Citywide/))
            .reify()

        console.log("aqComparisonsIndicatorData:");
        aqComparisonsIndicatorData.print();

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

    console.log("** loadIndicator");

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
        await fetch_comparisons();
    }

    loadData(indicatorId);

}

// ----------------------------------------------------------------------- //
// function to draw 311 buttons
// ----------------------------------------------------------------------- //

var filteredCrosswalk = [];
function draw311Buttons(x) {
    document.getElementById('311').innerHTML = ''
    filteredCrosswalk = crosswalk.filter(indicator => indicator.IndicatorID == x )

    // Creates label if there are 311 links
    if (filteredCrosswalk.length > 0) {
        document.getElementById('311label').innerHTML = 'Contact 311 for help with:'
        document.getElementById('311').classList.remove('hide')
    } else {
        document.getElementById('311label').innerHTML = ''
        document.getElementById('311').classList.add('hide')
    };

    // draws 311 buttons
    for (let i = 0; i < filteredCrosswalk.length; i ++ ) {
        var title = filteredCrosswalk[i].topic
        var destination = filteredCrosswalk[i].kaLink
        var btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="btn btn-sm btn-outline-primary mr-1 mb-1" target="_blank" rel=”noopener noreferrer”><i class="fas fa-external-link-alt mr-1"></i>${title}</a>`
        document.getElementById('311').innerHTML += btn
    }
}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

const loadData = (this_indicatorId) => {

    console.log("** loadData");

    fetch(data_repo + data_branch + `/indicators/data/${this_indicatorId}.json`)
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

    console.log("** loadGeo");

    const geoUrl = data_repo + data_branch + `/geography/GeoLookup.csv`; // col named "GeoType"

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

    console.log("** joinData");

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

            const secondaryMeasureData = data.filter(d => d.MeasureID === secondaryMeasureId)

            // join with geotable and times, keep only geos in primary data

            const aqFilteredSecondaryMeasureData = aq.from(secondaryMeasureData)
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

        }
        )

    // console.log("*** ret", ret);

    return ret;
}