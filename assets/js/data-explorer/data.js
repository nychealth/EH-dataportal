// ======================================================================= //
// data.js
// ======================================================================= //

// Fetch pipelines for indicator metadata, comparison joins, and derived data tables

// console.log(">> data.js");

// ----------------------------------------------------------------------- //
// indicator data files
// ----------------------------------------------------------------------- //

// Fetches one indicator's rows as an arquero table, reusing the cached table on later requests.
//
// The same file is asked for up to three times per load: as the primary indicator, as one of
// its own comparison series (every comparison-bearing indicator lists itself), and as a
// correlate's secondary series. Routing all three through loadOnce collapses that to a single
// fetch and a single parse; arquero tables are immutable, so the callers below can share one.
//
// autoType: false matches loadGeo, and keeps the primary and comparison tables identically
// typed — trend.js concatenates them, so they must not disagree about column types.
const loadIndicatorData = (indicator_id) => {

    const dataUrl = `${data_repo}${data_branch}/indicators/data/${indicator_id}.json`;

    return loadOnce(dataUrl, () => aq.loadJSON(dataUrl, { autoType: false }));

};

// ----------------------------------------------------------------------- //
// comparison metadata and data
// ----------------------------------------------------------------------- //

// Loads the comparison metadata file and expands it into the joined tables
// used by the comparison-trend chart.
const fetch_comparisons = async () => {

    debugLog("* fetch_comparisons.json");

    const comparisonsUrl = `${data_repo}${data_branch}/indicators/metadata/comparisons.json`;

    // Cache the fetch, not the filtered result — createComparisonData narrows the same
    // full list differently for each indicator.
    DE.lookups.comparisons = await loadOnce(comparisonsUrl, () =>
        fetch(comparisonsUrl).then(response => response.json())
    )
        .catch(error => {
            console.log(error);
            return [];
        });

    await createComparisonData(DE.lookups.comparisons || []);

};


// Builds the comparison metadata tables and fetches the comparison indicator rows.
const createComparisonData = async (comps) => {

    debugLog("* createComparisonData");

    // ----- bail if no comparisons selected ----- //

    if (!Array.isArray(DE.lookups.indicatorComparisonId) || DE.lookups.indicatorComparisonId.length === 0) {

        DE.lookups.comparisonMetadata = [];
        DE.lookups.aqComparisonMetadata = undefined;
        DE.lookups.aqComparisonIndicatorsMetadata = undefined;
        DE.lookups.aqCombinedComparisonMetadata = undefined;
        DE.lookups.aqComparisonIndicatorData = undefined;
        return;
    }

    // ----- filter to selected comparisons; bail if none match ----- //

    DE.lookups.comparisonMetadata = comps.filter(d => DE.lookups.indicatorComparisonId.includes(d.ComparisonID));

    if (!DE.lookups.comparisonMetadata.length) {

        DE.lookups.aqComparisonMetadata = undefined;
        DE.lookups.aqComparisonIndicatorsMetadata = undefined;
        DE.lookups.aqCombinedComparisonMetadata = undefined;
        DE.lookups.aqComparisonIndicatorData = undefined;
        return;
    }

    // ----- build aqComparisonMetadata ----- //

    DE.lookups.aqComparisonMetadata = aq.from(DE.lookups.comparisonMetadata)
        .unroll("Indicators")
        .derive({

            IndicatorID: d => d.Indicators.IndicatorID,
            MeasureID: d => d.Indicators.MeasureID,
            GeoTypeName: d => d.Indicators.GeoTypeName,
            GeoID: d => d.Indicators.GeoID,
            Geography: d => d.Indicators.Geography
        })
        .select(aq.not("Indicators"));

    // ----- derive unique indicator/measure keys ----- //

    const aqUniqueIndicatorMeasure = DE.lookups.aqComparisonMetadata
        .select("IndicatorID", "MeasureID")
        .dedupe();

    const uniqueIndicatorMeasure = aqUniqueIndicatorMeasure
        .groupby("IndicatorID")
        .objects({ grouped: "entries" });

    const comparisonIndicatorIDs = [...new Set(DE.lookups.aqComparisonMetadata.array("IndicatorID"))];
    const comparisonMeasureIDs = [...new Set(DE.lookups.aqComparisonMetadata.array("MeasureID"))];

    // ----- build aqComparisonIndicatorsMetadata ----- //

    const comparisonIndicatorsMetadata = indicators.filter(ind =>
        comparisonIndicatorIDs.includes(ind.IndicatorID)
    );

    DE.lookups.aqComparisonIndicatorsMetadata = aq.from(comparisonIndicatorsMetadata)
        .select("IndicatorID", "IndicatorName", "IndicatorLabel", "Measures")
        .unroll("Measures")
        .derive({

            MeasureID: d => d.Measures.MeasureID,
            MeasureName: d => d.Measures.MeasureName,
            MeasurementType: d => d.Measures.MeasurementType,
            Sources: d => d.Measures.Sources,
            how_calculated: d => d.Measures.how_calculated,
            DisplayType: d => d.Measures.DisplayType,
            TrendNoCompare: d => d.Measures.TrendNoCompare,
            TrendThreshold: d => d.Measures.TrendThreshold
        })
        .derive({ IndicatorMeasure: d => d.IndicatorLabel + ": " + d.MeasurementType })
        .select(aq.not("Measures"))
        .filter(aq.escape(d => comparisonMeasureIDs.includes(d.MeasureID)));

    // ----- join into aqCombinedComparisonMetadata ----- //

    DE.lookups.aqCombinedComparisonMetadata = DE.lookups.aqComparisonMetadata
        .join(DE.lookups.aqComparisonIndicatorsMetadata, [["MeasureID", "IndicatorID"], ["MeasureID", "IndicatorID"]]);

    // ----- fetch each comparison indicator's data; semijoin; concat ----- //

    const comparisonDataTables = await Promise.all(
        uniqueIndicatorMeasure.map(async ind => {

            return loadIndicatorData(ind[0])
                .then(data => {

                    return data
                        .derive({ IndicatorID: aq.escape(ind[0]) })
                        .semijoin(
                            DE.lookups.aqCombinedComparisonMetadata,
                            (a, b) => (
                                op.equal(a.MeasureID, b.MeasureID) &&
                                op.equal(a.GeoType, b.GeoTypeName) &&
                                op.equal(a.GeoID, b.GeoID)
                            )
                        )
                        .reify();

                });

        })
    );

    // reduce with no seed throws on an empty array (e.g. the semijoin above filtered out every candidate row);
    // undefined matches the "no comparison data" convention this function already uses above on early bail-out.
    const flatComparisonDataTables = comparisonDataTables.flatMap(d => d);

    DE.lookups.aqComparisonIndicatorData = flatComparisonDataTables.length
        ? flatComparisonDataTables.reduce((a, b) => a.concat(b))
        : undefined;

};

// ----------------------------------------------------------------------- //
// function to load indicator metadata
// ----------------------------------------------------------------------- //

// Loads one indicator's metadata state and starts the downstream data pipeline.
const loadIndicator = async (this_IndicatorID, dont_add_to_history) => {

    debugLog("* loadIndicator:", this_IndicatorID, typeof this_IndicatorID);

    // console.log("indicators [loadIndicator]", indicators);

    // ----- resolve overlay default; coerce IndicatorID ----- //

    // preserve current tab; default to none (no overlay open) on first load

    // Only allow renderMap()'s citywide-only smart default (auto-jump to trend) when nothing
    // has already resolved an overlay — an explicit URL param or a carried-over tab choice
    // must always win over that nudge.
    DE.map.citywideTrendDefaultPending = !DE.state.overlay;

    // Default to no overlay until a tab is explicitly chosen or restored.
    if (!DE.state.overlay) DE.state.overlay = 'none';

    // if IndicatorID isn't given, use the first indicator from the dropdown list
    //  (which is populated by Hugo reading the content frontmatter).

    // const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    // coerce to float; HTML data attributes are strings, but IndicatorID comparisons use == throughout
    DE.state.IndicatorID = parseFloat(this_IndicatorID);

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

    // ----- look up indicator record; assign metadata globals ----- //

    // IndicatorID comes in as  a string, so "find" uses '==' instead of '==='

    DE.indicator.indicator = indicators.find(indicator => indicator.IndicatorID == DE.state.IndicatorID);
    DE.indicator.indicatorName = DE.indicator.indicator?.IndicatorName ? DE.indicator.indicator.IndicatorName : '';
    DE.indicator.indicatorDesc = DE.indicator.indicator?.IndicatorDescription ? DE.indicator.indicator.IndicatorDescription : '';
    DE.indicator.indicatorShortName = DE.indicator.indicator?.IndicatorShortname ? DE.indicator.indicator.IndicatorShortname : DE.indicator.indicatorName;
    DE.lookups.indicatorComparisonId = Array.isArray(DE.indicator.indicator?.Comparisons)
        ? DE.indicator.indicator.Comparisons
        : (DE.indicator.indicator?.Comparisons ? [DE.indicator.indicator.Comparisons] : []);
    DE.indicator.indicatorMeasures = DE.indicator.indicator?.Measures;

    // Reset per-view manual selection state so new indicator starts from clean defaults.

    // console.log("indicatorMeasures [loadIndicator]", indicatorMeasures);

    // create Citation

    // createCitation(); // re-runs on updating Indicator

    // ----- reset per-view selection-state flags ----- //

    DE.map.selectedMapMeasure = false;
    DE.map.selectedMapTime = false;
    DE.map.selectedMapGeo = false;
    DE.trend.selectedTrendMeasure = false;
    DE.links.selectedLinksMeasure = false;
    DE.disparities.selectedDisparity = false;
    DE.trend.selectedComparison = false;
    DE.trend.showingBoroughTrend = false;
    DE.trend.showingComparisonTrend = false;
    DE.trend.selectedTrendMeasureId = null;
    DE.trend.selectedComparisonId = null;
    DE.links.selectedLinksPrimaryMeasureId = null;
    DE.links.selectedLinksSecondaryMeasureId = null;
    DE.disparities.selectedDisparityPrimaryMeasureId = null;

    // ----- sync URL/history state ----- //

    // if dont_add_to_history is true, then don't push the state
    // if dont_add_to_history is false, or not set, push the state
    // this prevents loadIndicator from setting new history entries when it's called
    //  on a popstate event, i.e. when the user is traversing the history stack

    // dont_add_to_history catches the pop state case, state.id != IndicatorID catches the location change case
    // we don't want to add to the history stack if we've landed on this page by way of the history stack

    // Use a fresh URL snapshot so we don't accidentally restore stale params.

    const nextURL = new URL(window.location);
    nextURL.searchParams.set('id', parseFloat(DE.state.IndicatorID));

    // Skip history writes during popstate replays so back/forward does not create duplicate entries.
    if (!dont_add_to_history && (window.history.state === null || historyState === null || window.history.state.id != DE.state.IndicatorID)) {

        if (window.history.state === null || historyState === null) {

            // - - - first load: replace the initial history entry - - - //

            window.history.replaceState({ id: DE.state.IndicatorID }, '', nextURL);

        } else {

            // - - - indicator changed: push new history entry - - - //

            window.history.pushState({ id: DE.state.IndicatorID }, '', nextURL);

        }

    }

    // call data loading function

    // ----- reset comparison metadata; conditionally fetch ----- //

    // console.log(">>>> indicatorComparisonId", indicatorComparisonId);
    
    // Clear comparison metadata early so downstream branches can rely on simple length checks.
    DE.lookups.comparisonMetadata = [];

    // ----- kick off the comparison and data pipelines together ----- //

    // These two share no state: the comparison pipeline reads only `indicators` and
    // indicatorComparisonId (both resolved above) and writes DE.lookups.comparison*, while
    // loadData writes the indicator/geo/time tables. Nothing reads the comparison tables until
    // renderMeasures runs, after both have resolved — so the comparison fetch no longer blocks
    // the data fetch, saving a full round-trip on every comparison-bearing indicator.

    await Promise.all([

        DE.lookups.indicatorComparisonId.length > 0
            ? fetch_comparisons()
            : Promise.resolve(),

        loadData(DE.state.IndicatorID)

    ]);

}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

// Fetches indicator rows and prepares the shared Arquero tables used by all views.
const loadData = async (this_IndicatorID) => {

    debugLog("* loadData");

    try {

        // ----- fetch indicator rows, time, and geography together ----- //

        // None of the three depends on the others — only the join below needs all of them.
        // The time and geography lookups used to start only after the indicator rows had
        // already arrived, which cost an extra round-trip on the first load of the session.
        // (After that they come straight from the loadOnce cache.)

        const [data] = await Promise.all([

            loadIndicatorData(this_IndicatorID),

            loadTime(),
            loadGeo()

        ]);

        // console.log("data [loadData]", data);

        // ----- add GeoRank ----- //

        DE.lookups.aqIndicatorData = data
            .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
            .groupby("TimePeriodID", "GeoType", "GeoID")
            .orderby(aq.desc('TimePeriodID'), 'GeoRank')

        // call the data-to-geo joining function

        await joinData();

    } catch (error) {
        console.log(error);
    }

    // trigger 311 button render after all data fetches and joins have resolved
    render311Links(this_IndicatorID)

}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

// Loads the geography lookup table used to decorate indicator rows.
const loadGeo = async () => {

    debugLog("* loadGeo");

    const geoUrl = `${data_repo}${data_branch}/geography/GeoLookup.json`; // col named "GeoType"

    // Safe to share one table across indicators: arquero tables are immutable, and every
    // consumer joins against this one rather than modifying it.
    DE.lookups.geoTable = await loadOnce(geoUrl, () => aq.loadJSON(geoUrl, {autoType: false}));

    //  console.log("geoTable [loadGeo]");
    //  geoTable.print()
}

// ----------------------------------------------------------------------- //
// function to load time period data
// ----------------------------------------------------------------------- //

// Loads time-period metadata and rebuilds the TimePeriodID lookup object.
const loadTime = async () => {

    debugLog("* loadTime");

    const timeUrl = `${data_repo}${data_branch}/indicators/metadata/TimePeriods.json`;

    // The table and the lookup derived from it are both static per session, so cache the
    // pair together and skip rebuilding the lookup on every indicator switch.
    const { table, lookup } = await loadOnce(timeUrl, async () => {

        const table = await aq.loadJSON(timeUrl, {autoType: false});

        // Mirror the Arquero time table into a plain object for fast menu lookups.
        const lookup = {};

        table.objects().forEach(t => {
            lookup[t.TimePeriodID] = t;
        });

        return { table, lookup };

    });

    DE.lookups.timeTable = table;
    DE.lookups.timeLookup = lookup;

    // console.log("timeTable [loadTime]");
    // timeTable.print()
}


// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

// Expands one measure's vis geotypes for a single view (its VisOptions Table/Map/Trend array)
// into one combined arquero table with a row per time-period × geo, or null when this view has no
// geotypes for the measure (an unseeded reduce would throw on the empty array).
const expandMeasureTimesGeos = (measure, visGeotypes) => {

    // one arquero table per geotype: cross the geotype's time-period IDs with the measure + geotype
    const perGeotypeTables = visGeotypes.map(geo => {

        let aqTimePeriodID = aq.table({TimePeriodID: geo.TimePeriodID})

        let aqMeasureGeo = aq.table({
            GeoType:  [geo.GeoType],
            MeasureID: [measure.MeasureID]
        })

        // cross to expand / recycle the geotype & measure row across every time period
        return aqTimePeriodID.cross(aqMeasureGeo).filter(d => d.TimePeriodID).reify()

    });

    if (!perGeotypeTables.length) {
        return null;
    }

    return perGeotypeTables.flatMap(d => d).reduce((a, b) => a.concat(b));

};


// Row-binds an array of per-measure arquero tables into one, joins the time lookup, and orders it
// (like bind_rows + a left join in dplyr). The empty fallback carries the columns downstream views
// read (MeasureID, TimePeriodID, GeoType) so join/filter/orderby keep working when no measure had
// data for that view.
const combineTimesGeos = (perMeasureTables) =>
    (perMeasureTables.length
        ? perMeasureTables.flatMap(d => d).reduce((a, b) => a.concat(b))
        : aq.table({ MeasureID: [], TimePeriodID: [], GeoType: [] })
    )
        .join_left(DE.lookups.timeTable, "TimePeriodID")
        .orderby(aq.desc('end_period'), "MeasureID");


// Joins indicator rows with geography and time metadata for every downstream view.
const joinData = async () => {

    debugLog("* joinData");

    // console.log("indicators [joinData]", indicators);
    // console.log("indicatorMeasures [joinData]", indicatorMeasures);

    // ----- build aqMeasureDisplay lookup table ----- //

    // create table column header with display type

    // Parallel accumulator arrays filled by the loop below, joined into the aqMeasureDisplay lookup table.
    let MeasureID = [];
    let MeasurementType = [];
    let DisplayType = [];

    // Extract display metadata into a lightweight table that can be joined onto view data.
    DE.indicator.indicatorMeasures.forEach(

        (measure, i) => {

            MeasureID.push(measure.MeasureID)
            MeasurementType.push(measure.MeasurementType)
            DisplayType.push(measure.DisplayType)

        }
    )
    
    DE.lookups.aqMeasureDisplay =
        aq.table({
            MeasureID: MeasureID,
            MeasurementType: MeasurementType,
            DisplayType: DisplayType
        })

    // take array of arquero tables and combine them into 1 arquero table - like bind_rows in dplyr

    // console.log("aqMeasureDisplay [joinData]");
    // aqMeasureDisplay.print()

    // ----- expand Table/Map/Trend time × geo combinations per measure ----- //

    // flatten MeasureID + TimePeriodID + GeoType

    // Per-view accumulators filled by the loop below, then combined into aqTableTimesGeos, aqMapTimesGeos, and aqTrendTimesGeos.
    let tableTimesGeos = [];
    let mapTimesGeos = [];
    let trendTimesGeos = [];

    // Expand each measure's Table, Map, and Trend metadata into explicit time-by-geo combinations,
    // pushing one combined table per measure into the matching per-view accumulator.
    DE.indicator.indicatorMeasures.forEach(measure => {

        const tableTimesGeosMeasure = expandMeasureTimesGeos(measure, measure.VisOptions[0].Table);
        if (tableTimesGeosMeasure) tableTimesGeos.push(tableTimesGeosMeasure);

        const mapTimesGeosMeasure = expandMeasureTimesGeos(measure, measure.VisOptions[0].Map);
        if (mapTimesGeosMeasure) mapTimesGeos.push(mapTimesGeosMeasure);

        const trendTimesGeosMeasure = expandMeasureTimesGeos(measure, measure.VisOptions[0].Trend);
        if (trendTimesGeosMeasure) trendTimesGeos.push(trendTimesGeosMeasure);

    })


    // ----- combine into aqTableTimesGeos / aqMapTimesGeos / aqTrendTimesGeos ----- //

    // Row-bind each per-view accumulator into its global table (see combineTimesGeos above).
    DE.lookups.aqTableTimesGeos = combineTimesGeos(tableTimesGeos);
    DE.lookups.aqMapTimesGeos   = combineTimesGeos(mapTimesGeos);
    DE.lookups.aqTrendTimesGeos = combineTimesGeos(trendTimesGeos);


    // console.log(">> aqTableTimesGeos [joinData]");
    // aqTableTimesGeos.print()

    // console.log(">> aqMapTimesGeos [joinData]");
    // aqMapTimesGeos.print()

    // console.log(">> aqTrendTimesGeos [joinData]");
    // aqTrendTimesGeos.print()

    // ----- build the foundational joinedAqData join ----- //

    // console.log(">>>> joinedAqData [joinData]");

    // Build one fully decorated dataset first, then derive view-specific slices from it.
    DE.lookups.joinedAqData = DE.lookups.aqIndicatorData
        // join the additional geo info
        .join_left(DE.lookups.geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
        .rename({'Name': 'Geography'})
        // join the additional time period info
        .join(DE.lookups.timeTable, "TimePeriodID")
        .select(aq.not("TimeType"))
        .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
        .reify()
    
    // console.log(">>>> joinedAqData [joinData]");
    // joinedAqData.print()


    // ----- derive tableData ----- //

    DE.table.tableData = DE.lookups.joinedAqData
        .join_left(DE.lookups.aqMeasureDisplay, "MeasureID")
        // Semijoin trims the shared dataset down to only the geos and times allowed in the table tab.
        .semijoin(DE.lookups.aqTableTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
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

    // ----- derive mapData ----- //

    DE.map.mapData = DE.lookups.joinedAqData
        .select(aq.not("BoroID", "Borough"))
        // filter to keep only times and geos we want in the table
        .semijoin(DE.lookups.aqMapTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby(aq.desc('end_period'), "MeasureID")
        .reify()
        .objects()

    // console.log(">>>> mapData [joinData]", mapData);
    

    // ----- derive trendData ----- //

    DE.trend.trendData = DE.lookups.joinedAqData
        .select(aq.not("BoroID", "Borough"))
        // filter to keep only times and geos we want in the table
        .semijoin(DE.lookups.aqTrendTimesGeos, [["MeasureID", "TimePeriodID", "GeoType"], ["MeasureID", "TimePeriodID", "GeoType"]])
        .orderby("GeoRank", "GeoID")
        .reify()
        .objects()

    // console.log(">>>> trendData [joinData]", trendData);

    // ----- derive linksData ----- //

    // console.log(">>> linksData [joinData]");

    // Keep only non-citywide, non-borough rows for links and disparities comparisons.
    DE.links.linksData = DE.lookups.joinedAqData
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

// Aligns primary and secondary measures on shared geography and closest available time.
const createJoinedLinksData = async (primaryMeasureId, secondaryMeasureId) => {

    let returnData;

    // console.log("primaryMeasureId [createJoinedLinksData]", primaryMeasureId);
    // console.log("secondaryMeasureId [createJoinedLinksData]", secondaryMeasureId);

    // ----- resolve primary measure metadata ----- //

    // get metadata for the selected primary measure, assign to global letiable
    // indicatorMeasures created in loadIndicator

    let primaryMeasureMetadata = DE.indicator.indicatorMeasures.filter(
        measure => measure.MeasureID === primaryMeasureId
    )

    // console.log("primaryMeasureMetadata [createJoinedLinksData]", primaryMeasureMetadata);

    // ----- resolve secondary measure metadata; default secondary ID ----- //

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


    // ----- resolve shared geography intersection; bail if none ----- //

    // - - - get primary x secondary intersection - - - //

    const sharedGeos = getSharedLinksGeos(primaryMeasureMetadata[0], secondaryMeasureMetadata[0]);

    // console.log("sharedGeos [createJoinedLinksData]", sharedGeos);

    if (!sharedGeos.length) {

        return {
            "data": [],
            "primaryMeasureMetadata": primaryMeasureMetadata,
            "secondaryMeasureMetadata": secondaryMeasureMetadata
        };
    }


    // ----- filter/resolve primary measure's most-recent time+geo slice; bail if empty ----- //

    // get available time periods for secondary measure

    // console.log("aqSecondaryMeasureTimes");
    // aqSecondaryMeasureTimes.print(50)

    // - - - primary measure data - - - //

    const filteredPrimaryMeasureData = DE.links.linksData

        // keep primary measure
        .filter(d => d.MeasureID === primaryMeasureId)
        
        // get shared geos
        .filter(d => sharedGeos.includes(d.GeoType))

    // console.log("filteredPrimaryMeasureData [createJoinedLinksData]", filteredPrimaryMeasureData);

    if (!filteredPrimaryMeasureData.length) {

        return {
            "data": [],
            "primaryMeasureMetadata": primaryMeasureMetadata,
            "secondaryMeasureMetadata": secondaryMeasureMetadata
        };
    }


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


    // ----- fetch secondary indicator data; filter/derive to shared geos ----- //

    // get secondary data with shared geo and time period that is closest with most recent primary data
    //  (fetches run asynchronously by default, but we need this data to do other things, so we have to 
    //  `await` the result before continuing)

    // Load the secondary indicator data only after the shared-geo primary slice is known.
    await loadIndicatorData(secondaryIndicatorId)
        .then(async data => {

            // join with geotable and times, keep only geos in primary data

            const aqFilteredSecondaryMeasureData = data

                // get secondary measure data
                .filter(aq.escape(d => d.MeasureID === secondaryMeasureId))
                .join(DE.lookups.geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])

                // get same geotypes as most recent primary data
                .filter(aq.escape(d => mostRecentPrimaryGeos.includes(d.GeoType)))
                .derive({"GeoRank": aq.escape(d => assignGeoRank(d.GeoType))})
                .rename({'Name': 'Geography'})

                // get end periods
                .join_left(
                    DE.lookups.timeTable,
                    "TimePeriodID"
                )
            
            // console.log("aqFilteredSecondaryMeasureData [createJoinedLinksData]");
            // aqFilteredSecondaryMeasureData.print()
            

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();

            // console.log("filteredSecondaryMeasureTimesDataObjects", filteredSecondaryMeasureTimesDataObjects);

            if (!filteredSecondaryMeasureTimesDataObjects.length) {
                return [];
            }
            

            // ----- find the most recent year primary and secondary share a geography ----- //

            // get the secondary end time closest to most recent primary end time

            // Choose the secondary time period whose end date is closest to the primary measure's latest end date.
            const closestSecondaryTime = filteredSecondaryMeasureTimesDataObjects.reduce((prev, curr) => {

                return (Math.abs(curr.end_period - mostRecentPrimaryMeasureEndTime) < Math.abs(prev.end_period - mostRecentPrimaryMeasureEndTime) ? curr : prev);

            }, filteredSecondaryMeasureTimesDataObjects[0]);

            // console.log("closestSecondaryTime [createJoinedLinksData]", closestSecondaryTime);


            // - - - use end time to get closest secondary data - - - //

            const aqClosestSecondaryData = aqFilteredSecondaryMeasureData

                // data with the latest end period
                .filter(aq.escape(d => d.end_period === closestSecondaryTime.end_period))

                // get the finest geo left
                .filter(d => d.GeoRank === op.max(d.GeoRank))

                // in case there are two time periods left, get the one that starts the earliest,
                //  which will be yearly over seasonal
                .filter(d => d.start_period === op.min(d.start_period))


            // ----- join primary and secondary measure data; return combined result ----- //

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

