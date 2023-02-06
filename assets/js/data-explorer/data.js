// ======================================================================= //
// data.js
// ======================================================================= //

// ======================================================================= //
//  fetch and load indicators metadata into global object
// ======================================================================= //

// ----------------------------------------------------------------------- //
// full indicator metadata
// ----------------------------------------------------------------------- //

fetch(data_repo + data_branch + '/indicators/indicators.json')
    .then(response => response.json())
    .then(async data => {

        console.log("** fetch indicators.json");

        indicators = data;

        const paramId = url.searchParams.get('id') !== null ? parseInt(url.searchParams.get('id')) : false;
        
        renderIndicatorDropdown()
        renderIndicatorButtons()

        // calling loadIndicator calls loadData, etc, and eventually renderMeasures. Because all 
        //  of this depends on the global "indicator" object, we call loadIndicator here
        
        if (paramId) {
            loadIndicator(paramId)
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
    
    console.log("** fetch_comparisons.json");

    await fetch(data_repo + data_branch + '/indicators/comparisons.json')
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
    
    console.log("** createComparisonData");
    
    // console.log("comps [createComparisonData]:", comps);

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
            MeasureID: d => d.Indicators.Measures
        })
        .unroll("MeasureID")
        .select(aq.not("Indicators"))
        .print()

    console.log("aqUniqueIndicatorMeasure:");

    // get unique combinations of indicators and measures

    let aqUniqueIndicatorMeasure = aqComparisonsMetadata
        .select("IndicatorID", "MeasureID")
        .dedupe()

    let uniqueIndicatorMeasure = aqUniqueIndicatorMeasure
        .groupby("IndicatorID")
        .objects({grouped: "entries"})

    let comparisonsIndicatorIDs = [... new Set(aqComparisonsMetadata.array("IndicatorID"))]
    let comparisonsMeasureIDs = [... new Set(aqComparisonsMetadata.array("MeasureID"))]

    let comparisonsIndicatorsMetadata = indicators.filter(
        ind => comparisonsIndicatorIDs.includes(ind.IndicatorID)
    )
    console.log("comparisonsIndicatorsMetadata:", comparisonsIndicatorsMetadata);

    console.log("aqComparisonsIndicatorsMetadata:");


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
        .print()



    // join comparisons metadata tables

    // console.log("aqCombinedComparisonsMetadata:");

    // aqCombinedComparisonsMetadata = aqComparisonsMetadata
    //     .join(aqComparisonMeasuresMetadata, "MeasureID")
    //     .print()


    // Promise.all takes the array of promises returned by map, and then the `then` callback executes after they've all resolved

    Promise.all(uniqueIndicatorMeasure.map(async ind => {

        let measures = ind[1].flatMap(m => Object.values(m));
        
        return aq.loadJSON(`${data_repo}${data_branch}/indicators/data/${ind[0]}.json`)
            .then(async data => {

                // console.log("*** aq.loadJSON");

                let comp_data = data
                    .derive({IndicatorID: aq.escape(ind[0])})
                    .filter(
                        aq.escape(d => measures.includes(d.MeasureID)), 
                        d => op.match(d.GeoType, /Citywide/) // keep only Citywide
                    )
                    .reify()
                
                return comp_data;
            
            })

    }))

    .then(async dataArray => {

        aqComparisonsIndicatorData = await dataArray.flatMap(d => d).reduce((a, b) => a.concat(b))

        aqComparisonsIndicatorData = aqComparisonsIndicatorData
            .filter(d => op.match(d.GeoType, /Citywide/))
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

const loadIndicator = (this_indicatorId, dont_add_to_history) => {

    console.log("** loadIndicator");

    currentHash = window.location.hash;

    // if indicatorId isn't given, use the first indicator from the dropdown list
    //  (which is populated by Hugo reading the content frontmatter).

    const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    indicatorId = this_indicatorId ? parseFloat(this_indicatorId) : parseFloat(firstIndicatorId);

    // remove active class from every list element
    $(".indicator-dropdown-item").removeClass("active");
    $(".indicator-dropdown-item").attr('aria-selected', false);

    // get the list element for this indicator
    const thisIndicatorEl = document.querySelector(`button[data-indicator-id='${indicatorId}']`)

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

    // send Indicator Title to vis headers

    document.getElementById('summaryTitle').innerHTML = indicatorName;
    document.getElementById('mapTitle').innerHTML     = indicatorName;
    document.getElementById('trendTitle').innerHTML   = indicatorName;

    // reset selected measure flags

    selectedMapMeasure = false;
    selectedTrendMeasure = false;
    selectedLinksMeasure = false;

    // if dont_add_to_history is true, then don't push the state
    // if dont_add_to_history is false, or not set, push the state
    // this prevents loadIndicator from setting new history entries when it's called
    //  on a popstate event, i.e. when the user is traversing the history stack

    // dont_add_to_history catches the pop state case, state.id != indicatorId catches the location change case
    // we don't want to add to the history stack if we've landed on this page by way of the history stack

    url.searchParams.set('id', parseFloat(indicatorId));

    if (!dont_add_to_history && (window.history.state === null || state === null || window.history.state.id != indicatorId)) {

        if (!url.hash) {

            // if loadIndicator is being called without a hash (like when a topic page is loaded), then show the first ID and summary

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        } else {

            url.hash = currentHash;
            window.history.pushState({ id: indicatorId, hash: url.hash }, '', url);

        }

    } else {


    }

    // call data loading function

    const indicatorTitle = document.getElementById('dropdownIndicator')

    indicatorTitle.innerHTML = indicatorName

    loadData(indicatorId)

    // call function to fetch comparisons data

    if (indicatorComparisonId !== null) {
        fetch_comparisons();
    }

}


// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

const loadData = (this_indicatorId) => {

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
}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const loadGeo = () => {

    const geoUrl = data_repo + data_branch + `/geography/GeoLookup.csv`; // col named "GeoType"

    aq.loadCSV(geoUrl)
        .then(data => {

            geoTable = data.select(aq.not('Lat', 'Long'));

            // call the data-to-geo joining function

            joinData();

    });
}

// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

const joinData = () => {

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

    let aqMeasureIdTimes     = availableTimes.reduce((a, b) => a.concat(b))
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
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
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
