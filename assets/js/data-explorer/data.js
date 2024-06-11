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
    // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
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

            // join with geotable and times, keep only geos in primary data

            const aqFilteredSecondaryMeasureData = aq.table(data)

                // get secondary measure data
                .filter(`d => d.MeasureID === ${secondaryMeasureId}`)
                .join(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])

                // get same geotypes as primary data (no citywide or boro)
                .filter(aq.escape(d => sharedGeos.includes(d.GeoType)))
                .derive({"GeoRank": aq.escape(d => assignGeoRank(d.GeoType))})
                .rename({'Name': 'Geography'})

                // get end periods
                .join_left(
                    timeTable,
                    "TimePeriodID"
                )
            
            // console.log("aqFilteredSecondaryMeasureData");
            // aqFilteredSecondaryMeasureData.print()
            

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();

            // console.log("filteredSecondaryMeasureTimesDataObjects", filteredSecondaryMeasureTimesDataObjects);
            

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
            // aqFilteredPrimaryMeasureTimesData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
            // aqFilteredPrimaryMeasureTimesData.print(10)
            
            // console.log("aqClosestSecondaryData");
            // aqClosestSecondaryData.groupby("MeasureID", "GeoType", "TimePeriod").count().print(50)
            // aqClosestSecondaryData.print(10)
            
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
                document.getElementById('311label').innerHTML = 'Or, contact 311 to get resources about:'
                dest.forEach(element => element.classList.remove('hide'))
            } else {
                document.getElementById('311label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))
            };

            // draws 311 buttons
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {
                var title = filteredCrosswalk[i].topic
                var destination = filteredCrosswalk[i].kaLink
                var btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="mr-1" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt mr-1"></i>${title}</a>`
                dest.forEach(element => element.innerHTML += btn)
            }
    })
}
