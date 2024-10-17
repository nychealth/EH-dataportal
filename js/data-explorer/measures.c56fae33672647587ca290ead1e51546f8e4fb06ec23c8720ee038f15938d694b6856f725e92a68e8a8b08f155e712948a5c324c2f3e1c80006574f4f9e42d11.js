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

        // console.log("defaultSecondaryMeasureId", defaultSecondaryMeasureId);

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

    selectedMapAbout   = `<strong>${measure}:</strong> ${about}</p>`;
    selectedMapSources = `${sources}`;

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
    selectedTrendSources = `<p>${sources}</p>`;

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
            selectedComparisonSources.push(m.Sources)
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

    selectedLinksSources = [];
    selectedLinksSources.push(primarySources)
    selectedLinksSources.push(secondarySources)

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
        $(btnToggleDisparities).off(".toggle")

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

    // turn off click listener

    $(btnToggleDisparities).off(".toggle")

    // set on click listener

    $(btnToggleDisparities).on("click.toggle", (e) => {

        // remove active class from both options

        $("#show-disparities").removeClass("active");
        $("#show-links").removeClass("active");

        // determine which function to call

        if (
            e.target && 
            !e.target.classList.contains("active") && 
            !e.target.classList.contains("disabled") &&
            e.target.matches("#show-disparities")
        ) {

            // MeasureID: 221 = neighborhood poverty percent

            // console.log("renderDisparitiesChart [clickLinksToggle]");

            renderDisparitiesChart(defaultDisparitiesMetadata, 221);

            // set this option to active

            $(e.target).addClass("active")

        } else if (
            e.target && 
            !e.target.classList.contains("active") && 
            !e.target.classList.contains("disabled") &&
            e.target.matches("#show-links")
        ) {

            // console.log("showLinks [clickLinksToggle]");

            showLinks();

            // set this option to active

            $(e.target).addClass("active")

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

    // clear measure about used by table.js

    measureAbout = "";
    measureSources = [];

    // clear on click event handlers from view options

    $(dropdownTableGeos).off(".gtag")
    $(dropdownTableTimes).off(".gtag")
    $(dropdownTrendComparisons).off(".gtag")
    $(dropdownMapMeasures).off(".gtag")
    $(dropdownMapTimes).off(".gtag")
    $(dropdownMapGeos).off(".gtag")
    $(dropdownLinksMeasures).off(".gtag")
    $(btnToggleDisparities).off(".gtag")


    // ----- create dropdowns for table ================================================== //

    // ----- select all --------------------------------------------------- //

    dropdownTableTimes.innerHTML +=
        `<label class="btn btn-primary dropdown-item checkbox-time-all"><input class="largerCheckbox" type="checkbox" name="time" value="all" /> Select all </label>`

    // ----- times --------------------------------------------------- //

    const tableTimes = [...new Set(aqTableTimesGeos.array("TimePeriod"))];

    // console.log("tableTimes", tableTimes);

    tableTimes.forEach((time, index) => {

        if (index === 0) {

            // default to most recent time

            selectedTableTimes = [time];

            dropdownTableTimes.innerHTML +=
                `<label class="btn btn-primary dropdown-item checkbox-time"><input class="largerCheckbox" type="checkbox" name="time" value="${time}" checked /> ${time}</label>`;

        } else {

            dropdownTableTimes.innerHTML +=
                `<label class="btn btn-primary dropdown-item checkbox-time"><input class="largerCheckbox" type="checkbox" name="time" value="${time}" /> ${time}</label>`;
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

        dropdownTableGeos.innerHTML += `<label class="btn btn-primary dropdown-item checkbox-geo"><input class="largerCheckbox" type="checkbox" value="${geo}" checked /> ${geo}</label>`;

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

        dropdownMapGeos.innerHTML += `<button class="btn btn-primary dropdown-item link-time mapgeosbutton pl-2"
            data-geo="${geo}">
            ${geo}
            </button>`;

    });


    // ----- times --------------------------------------------------- //

    const mapTimes = [... new Set(aqMapTimesGeos.array("TimePeriod"))]

    // console.log("mapTimes", mapTimes);

    mapTimes.map(time => {

        dropdownMapTimes.innerHTML += `<button class="btn btn-primary dropdown-item link-time maptimesbutton pl-2"
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
            
            dropdownMapMeasures.innerHTML += DOMPurify.sanitize(`<button class="btn btn-primary dropdown-item link-measure mapmeasuresbutton pl-2"
                data-measure-id="${measureId}" title="${type}">
                ${type}
                </button>`);
            
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

            dropdownTrendComparisons.innerHTML += header ? '<div class="dropdown-title"><strong>' + header + '</strong></div>' : '';

            if (trendData) {
                dropdownTrendComparisons.innerHTML += DOMPurify.sanitize(`<button class="btn btn-primary dropdown-item trendbutton pl-2"
                data-measure-id="${measureId}" title="${type}">
                ${type}
                </button>`);
            }
        }


        // ----- handle links measures --------------------------------------------------- //

        if (links) {

            // create linked measures object

            linksMeasures.push(measure)

            // get secondary measure id

            if (tableData) {

                dropdownLinksMeasures.innerHTML +=
                    DOMPurify.sanitize(`<div class="dropdown-title"><strong> ${type}</strong></div>`);

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
                        DOMPurify.sanitize(`<button class="btn btn-primary dropdown-item linksbutton pl-2"
                            data-primary-measure-id="${measureId}"
                            data-measure-id="${measure.MeasureID}"
                            data-secondary-measure-id="${link.MeasureID}" title="${defaultSecondaryMeasureMetadata[0]?.MeasureName}">
                            ${defaultSecondaryMeasureMetadata[0]?.MeasureName}
                        </button>`);

                });
            }
        }


        // ----- handle disparities measures --------------------------------------------------- //

        if (disparities) {

            disparitiesMeasures.push(measure)

        }

        // ----- set all measure about & source here --------------------------------------------------- //

        measureAbout   += `<p><strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}</p>`;
        measureSources.push(measure.Sources);
        

    });

    // console.log("disparitiesMeasures [renderMeasures]", disparitiesMeasures);


    // ===== handle comparisons viz ================================================== //

    if (indicatorComparisonId) {

        let compLegendTitles = [... new Set(aqCombinedComparisonsMetadata.array("LegendTitle"))]

        compLegendTitles.map(title => {

            let titleGroup = aqCombinedComparisonsMetadata.filter(aq.escape(d => d.LegendTitle == title))

            // add each unique legend title as a header, with the included comparisons underneath

            dropdownTrendComparisons.innerHTML += title ? '<div class="dropdown-title"><strong>' + title + '</strong></div>' : '';

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

                    dropdownTrendComparisons.innerHTML += `<button class="btn btn-primary dropdown-item comparisonsbutton pl-2"
                        data-comparison-id="${comp}"  title="${compY_axis_title}">
                        ${compY_axis_title}
                        </button>`;

                    } else {
                        // I am very unhappy with this kludge
                        dropdownTrendComparisons.innerHTML += `<button class="btn btn-primary dropdown-item comparisonsbutton pl-2"
                            data-comparison-id="${comp}"  title="${compGeography[compGeography.length - 1]} ">
                            ${compGeography[compGeography.length - 1]} 
                            </button>`;
                    }
                    
                } else if (compMeasurementType.length == 1) {

                    // console.log("1 measure [MeasurementType]");
                    // console.log(compMeasurementType);

                    dropdownTrendComparisons.innerHTML += `<button class="btn btn-primary dropdown-item comparisonsbutton pl-2"
                        data-comparison-id="${comp}" title="${compMeasurementType}">
                        ${compMeasurementType}
                        </button>`;
                    
                } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {

                    // console.log("> 1 measure & > 1 indicator [IndicatorMeasure]");
                    // console.log("compIndicatorMeasure", compIndicatorMeasure);
                    // console.log("compName", compName);

                    dropdownTrendComparisons.innerHTML += `<button class="btn btn-primary dropdown-item comparisonsbutton pl-2"
                        data-comparison-id="${comp}" title="${compName}">
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
            defaultMapSources = `${sources}`;

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
            defaultTrendSources = [];
            defaultTrendSources.push(sources)

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
                    `<p>${m.Sources}</p>`;
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
                $(btnToggleDisparities).off(".toggle")

                // if disparities is enabled, show the button

                // btnToggleDisparities.style.display = "inline";

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

                defaultLinksSources = [];
                defaultLinksSources.push(primarySources)
                defaultLinksSources.push(secondarySources)                

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

                    // btnToggleDisparities.style.display = "inline";

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
                    $(btnToggleDisparities).off(".toggle")

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
    // add event handler functions to options boxes for Google Analytics
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    $(dropdownTableGeos).on("click.gtag", e => {
        
        console.log("click [dropdownTableGeos]", e);

        // only register event on the checkbox
        //  if you click on the containing div, it fires 2 events: one with the div as target and one 
        //  with the checkbox as target. If you click on the checkbox, it fires on the checkbox. In either
        //  case, there's an event with the checkbox as target. So, use that.

        if (e.target.classList.contains("largerCheckbox")) {

            console.log("gtag [dropdownTableGeos]");

            gtag('event', 'click_option', {
                option: "table_geo"
            });

        }

    });

    $(dropdownTableTimes).on("click.gtag", e => {

        console.log("click [dropdownTableTimes]", e);
        
        // only register event on the checkbox
        //  if you click on the containing div, it fires 2 events: one with the div as target and one 
        //  with the checkbox as target. If you click on the checkbox, it fires on the checkbox. In either
        //  case, there's an event with the checkbox as target. So, use that.
        
        if (e.target.classList.contains("largerCheckbox")) {

            console.log("gtag [dropdownTableTimes]");

            gtag('event', 'click_option', {
                option: "table_time"
            });
            
        }
        

    });

    $(dropdownMapMeasures).on("click.gtag", e => {

        console.log("click [dropdownMapMeasures]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [dropdownMapMeasures]");

            gtag('event', 'click_option', {
                option: "map_measure"
            });
            
        }
        
    });

    $(dropdownMapTimes).on("click.gtag", e => {

        console.log("click [dropdownMapTimes]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [dropdownMapTimes]");

            gtag('event', 'click_option', {
                option: "map_time"
            });
            
        }
        
    });

    $(dropdownMapGeos).on("click.gtag", e => {

        console.log("click [dropdownMapGeos]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [dropdownMapGeos]");

            gtag('event', 'click_option', {
                option: "map_geo"
            });
            
        }
        
    });

    $(dropdownTrendComparisons).on("click.gtag", e => {

        console.log("click [dropdownTrendComparisons]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [dropdownTrendComparisons]");

            gtag('event', 'click_option', {
                option: "trend_comparison"
            });
            
        }
        
    });

    $(dropdownLinksMeasures).on("click.gtag", e => {

        console.log("click [dropdownLinksMeasures]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [dropdownLinksMeasures]");

            gtag('event', 'click_option', {
                option: "links_measure"
            });
            
        }

    });

    $(btnToggleDisparities).on("click.gtag", e => {

        console.log("click [dropdownLinksMeasures]", e);

        // if (e.target.classList.contains("dropdown-item") && !e.target.classList.contains("active")) {
        if (e.target.classList.contains("dropdown-item")) {

            // console.log("gtag [btnToggleDisparities]");

            gtag('event', 'click_option', {
                option: "links_disparities"
            });
            
        }
        
    });


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
