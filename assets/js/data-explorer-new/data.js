// ======================================================================= //
// data.js
// ======================================================================= //

// data loading and manipulation functions

// console.log(">> data.js");

// ----------------------------------------------------------------------- //
// function to load indicator metadata
// ----------------------------------------------------------------------- //

// Loads one indicator's metadata state and starts the downstream data pipeline.
const loadIndicator = async (this_IndicatorID, dont_add_to_history) => {

    console.log("* loadIndicator:", this_IndicatorID, typeof this_IndicatorID);

    // console.log("indicators [loadIndicator]", indicators);

    // preserve current tab; default to none (no overlay open) on first load

    // Default to no overlay until a tab is explicitly chosen or restored.
    if (!overlay) overlay = 'none';

    // if IndicatorID isn't given, use the first indicator from the dropdown list
    //  (which is populated by Hugo reading the content frontmatter).

    // const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    // coerce to float; HTML data attributes are strings, but IndicatorID comparisons use == throughout
    IndicatorID = parseFloat(this_IndicatorID);

    // remove active class from every list element
    // $(".indicator-dropdown-item").removeClass("active");
    // $(".indicator-dropdown-item").attr('aria-selected', false);

    // $(".indicator-arrows").addClass("hide");
    // document.getElementById(`arrow-${IndicatorID}`).classList.remove('hide')

    // get the list element for this indicator (in buttons and dropdowns)
    // const thisIndicatorEl = document.querySelectorAll(`button[data-indicator-id='${IndicatorID}']`)

    // set this element as active & selected
    // $(thisIndicatorEl).addClass("active");
    // $(thisIndicatorEl).attr('aria-selected', true);

    // IndicatorID comes in as  a string, so "find" uses '==' instead of '==='

    indicator = indicators.find(indicator => indicator.IndicatorID == IndicatorID);
    indicatorName = indicator?.IndicatorName ? indicator.IndicatorName : '';
    indicatorDesc = indicator?.IndicatorDescription ? indicator.IndicatorDescription : '';
    indicatorShortName = indicator?.IndicatorShortname ? indicator.IndicatorShortname : indicatorName;
    // indicatorComparisonId = indicator?.Comparisons;
    indicatorMeasures = indicator?.Measures;

    // console.log("indicatorMeasures [loadIndicator]", indicatorMeasures);

    // create Citation

    // createCitation(); // re-runs on updating Indicator

    // reset selected measure flags

    selectedMapMeasure = false;
    selectedMapTime = false;
    selectedMapGeo = false;
    selectedTrendMeasure = false;
    selectedLinksMeasure = false;
    selectedDisparity = false;
    selectedComparison = false;
    showingBoroughTrend = false;
    showingComparisonTrend = false;

    // if dont_add_to_history is true, then don't push the state
    // if dont_add_to_history is false, or not set, push the state
    // this prevents loadIndicator from setting new history entries when it's called
    //  on a popstate event, i.e. when the user is traversing the history stack

    // dont_add_to_history catches the pop state case, state.id != IndicatorID catches the location change case
    // we don't want to add to the history stack if we've landed on this page by way of the history stack

    // Use a fresh URL snapshot so we don't accidentally restore stale params.

    const nextURL = new URL(window.location);
    nextURL.searchParams.set('id', parseFloat(IndicatorID));

    // Replace the first entry or push a new one only when this load is not history-driven.
    if (!dont_add_to_history && (window.history.state === null || state === null || window.history.state.id != IndicatorID)) {

        if (window.history.state === null || state === null) {

            // first load — replace the initial history entry

            window.history.replaceState({ id: IndicatorID }, '', nextURL);

        } else {

            // indicator changed — push new history entry

            window.history.pushState({ id: IndicatorID }, '', nextURL);

        }

    }

    // call data loading function

    // const indicatorTitle = document.getElementById('indicatorNameMobile')

    // indicatorTitle.innerHTML = DOMPurify.sanitize(indicatorName)

    // call function to fetch comparisons data

    // console.log(">>>> indicatorComparisonId", indicatorComparisonId);
    
    // make sure metadata is empty, so that we can use its length for conditionals
    comparisonMetadata = [];
    
    // why are we waiting for this?

    if (indicatorComparisonId !== null) {
        // fetch_comparisons();
    }

    await loadData(IndicatorID);

}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

// Fetches indicator rows and prepares the shared Arquero tables used by all views.
const loadData = async (this_IndicatorID) => {

    console.log("* loadData");

    await fetch(`${data_repo}${data_branch}/indicators/data/${this_IndicatorID}.json`)
        .then(response => response.json())
        .then(async data => {

            // console.log("data [loadData]", data);

            // add GeoRank

            aqIndicatorData = aq.table(data)
                .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
                .groupby("TimePeriodID", "GeoType", "GeoID")
                .orderby(aq.desc('TimePeriodID'), 'GeoRank')

            // call the geo file and time file loading functions
            
            // Load time and geography metadata in parallel before joining anything.
            await Promise.all([
                loadTime(),
                loadGeo()
            ])

            // call the data-to-geo joining function

            await joinData();

            
        })

    // trigger 311 button render after all data fetches and joins have resolved
    draw311Buttons(this_IndicatorID)

}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

// Loads the geography lookup table used to decorate indicator rows.
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

// Loads time-period metadata and rebuilds the TimePeriodID lookup object.
const loadTime = async () => {

    console.log("* loadTime");

    const timeUrl = `${data_repo}${data_branch}/indicators/metadata/TimePeriods.json`;

    await aq.loadJSON(timeUrl, {autoType: false})
        .then(async (data) => {

            timeTable = await data;

            // Build a plain JS lookup keyed by TimePeriodID

            timeLookup = {};
            // Mirror the Arquero time table into a plain object for fast menu lookups.
            timeTable.objects().forEach(t => {
                timeLookup[t.TimePeriodID] = t;
            });

            // console.log("timeTable [loadTime]");
            // timeTable.print()

    });
}


// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

// Joins indicator rows with geography and time metadata for every downstream view.
const joinData = async () => {

    console.log("* joinData");

    // console.log("indicators [joinData]", indicators);
    // console.log("indicatorMeasures [joinData]", indicatorMeasures);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get metadata fields
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // create table column header with display type

    let MeasureID = [];
    let MeasurementType = [];
    let DisplayType = [];

    // Extract display metadata into a lightweight table that can be joined onto view data.
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

    // Expand each measure's Table, Map, and Trend metadata into explicit time-by-geo combinations.
    indicatorMeasures.map(

        // map over measures

        (measure, i) => {

            // console.log(i, " > MeasureID", measure.MeasureID);

            // table -----------

            let aqTableTimesGeosMeasureArray =

                // Expand every table geography into one row per allowed time period.
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


            // combine array of arquero tables into 1 arquero table

            let aqTableTimesGeosMeasure = 
                aqTableTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // console.log(">> aqTableTimesGeosMeasure [joinData]");
            // aqTableTimesGeosMeasure.print()

            // push table for this measure to array with all measures

            tableTimesGeos.push(aqTableTimesGeosMeasure);


            // map -----------

            let aqMapTimesGeosMeasureArray =

                // Expand every map geography into one row per allowed time period.
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


            // combine array of arquero tables into 1 arquero table

            let aqMapTimesGeosMeasure = 
                aqMapTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // console.log(">> aqMapTimesGeosMeasure [joinData]");
            // aqMapTimesGeosMeasure.print()

            // push table for this measure to array with all measures

            mapTimesGeos.push(aqMapTimesGeosMeasure);


            // comparisons -----------

            let aqTrendTimesGeosMeasureArray =

                // Expand every trend geography into one row per allowed time period.
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


            // combine array of arquero tables into 1 arquero table

            let aqTrendTimesGeosMeasure = 
                aqTrendTimesGeosMeasureArray
                    .flatMap(d => d)
                    .reduce((a, b) => a.concat(b))

            // console.log(">> aqTrendTimesGeosMeasure [joinData]");
            // aqTrendTimesGeosMeasure.print()

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


    // console.log(">> aqTableTimesGeos [joinData]");
    // aqTableTimesGeos.print()

    // console.log(">> aqMapTimesGeos [joinData]");
    // aqMapTimesGeos.print()

    // console.log(">> aqTrendTimesGeos [joinData]");
    // aqTrendTimesGeos.print()

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // joining
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    // foundational joined dataset ----------

    // console.log(">>>> joinedAqData [joinData]");

    // Build one fully decorated dataset first, then derive view-specific slices from it.
    joinedAqData = aqIndicatorData
        // join the additional geo info
        .join_left(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
        .rename({'Name': 'Geography'})
        // join the additional time period info
        .join(timeTable, "TimePeriodID")
        .select(aq.not("TimeType"))
        .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
        .reify()
    
    // console.log(">>>> joinedAqData [joinData]");
    // joinedAqData.print()


    // data for summary table ----------

    tableData = joinedAqData
        .join_left(aqMeasureDisplay, "MeasureID")
        // filter to keep only times and geos we want in the table
        .semijoin(aqTableTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        // MeasurementDisplay: column header string; DisplayCI: data value joined with confidence interval for each cell
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
        .select(aq.not("BoroID", "Borough"))
        // filter to keep only times and geos we want in the table
        .semijoin(aqMapTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby(aq.desc('end_period'), "MeasureID")
        .reify()
        .objects()

    // console.log(">>>> mapData [joinData]", mapData);
    

    // data for trend chart ----------

    trendData = joinedAqData
        .select(aq.not("BoroID", "Borough"))
        // filter to keep only times and geos we want in the table
        .semijoin(aqTrendTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby("GeoRank", "GeoID")
        .reify()
        .objects()

    // console.log(">>>> trendData [joinData]", trendData);

    // data for links & disparities chart ----------

    // console.log(">>> linksData [joinData]");

    // Keep only non-citywide, non-borough rows for links and disparities comparisons.
    linksData = joinedAqData
        .select(aq.not("BoroID", "Borough"))
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
        .objects()

    // console.log(">>>> linksData [joinData]", linksData);

    // call the measure rendering etc. function

    // checkURL();

}


// ----------------------------------------------------------------------- //
// function to create data and metadata for links chart
// ----------------------------------------------------------------------- //

// WHAT'S THE MOST RECENT YEAR WHERE PRIMARY AND SECONDARY SHARE A GEOGRAPHY?

// Aligns primary and secondary measures on shared geography and closest available time.
const createJoinedLinksData = async (primaryMeasureId, secondaryMeasureId) => {

    let returnData;

    // console.log("primaryMeasureId [createJoinedLinksData]", primaryMeasureId);
    // console.log("secondaryMeasureId [createJoinedLinksData]", secondaryMeasureId);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get metadata for the selected primary measure, assign to global letiable
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

    // Default the secondary measure to the first linked measure in metadata.
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

    // get metadata for the selected secondary measure, assign to global letiable

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

    // Load the secondary indicator data only after the shared-geo primary slice is known.
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

            // Choose the secondary time period whose end date is closest to the primary measure's latest end date.
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

