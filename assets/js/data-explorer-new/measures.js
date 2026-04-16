// ======================================================================= //
// measures.js
// ======================================================================= //

// console.log(">> measures.js");

// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //

// ===== map ================================================== app//

const setDefaultMapMeasure = (visArray) => {

    console.log("* setDefaultMapMeasure");

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

    // console.log(">> defaultMapMetadata", defaultMapMetadata);

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

    // console.log(">> defaultTrendMetadata", defaultTrendMetadata);

}


// ===== links ================================================== //

const setDefaultLinksMeasure = async (visArray) => {

    console.log("* setDefaultLinksMeasure");

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

    console.log("* setDefaultDisparitiesMeasure");

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

    // console.log(">> defaultDisparitiesMetadata", defaultDisparitiesMetadata);
    
}


// ----------------------------------------------------------------------- //
// NOTE: Old per-tab update functions (updateMapData, updateBoroughTrendData,
// updateComparisonTrendData, updateLinksData) and per-tab dropdown handlers
// (handleTableTimeFilter, handleTableGeoFilter, handleMapTimeDropdown,
// handleMapGeoDropdown) have been removed. Their functionality is now
// handled by menu.js → handleSelection → pushState → renderCurrentView →
// show* functions defined inside renderMeasures.
// ----------------------------------------------------------------------- //


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

    // clear measure arrays

    mapMeasures = [];
    trendMeasures = [];
    linksMeasures = [];
    disparitiesMeasures = [];

    // clear measure about used by table.js

    measureAbout = "";
    measureSources = [];


    // ===== table defaults ================================================== //

    const tableTimes = [...new Set(aqTableTimesGeos.array("TimePeriod"))];

    tableTimes.forEach((time, index) => {
        if (index === 0) {
            selectedTableTimes = [time];
        }
    });


    // ----- geo types --------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [...new Set(aqTableTimesGeos.array("GeoType").map(gt => prettifyGeoType(gt)))];
    const dropdownTableGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g));

    dropdownTableGeoTypes.forEach(geo => {
        selectedTableGeography.push(geo);
    });


    // ===== populate per-tab measure arrays ================================================== //

    indicatorMeasures.map((measure, index) => {

        // check which viz types exist for this measure

        const map         = aqMapTimesGeos   && aqMapTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const trend       = aqTrendTimesGeos && aqTrendTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const links       = measure.VisOptions[0].Links && measure.VisOptions[0].Links[0].Measures[0]?.MeasureID;
        const disparities = measure.VisOptions[0].Links[0].Disparities == 1;

        if (map)         mapMeasures.push(measure);
        if (trend)       trendMeasures.push(measure);
        if (links)       linksMeasures.push(measure);
        if (disparities) disparitiesMeasures.push(measure);

        // accumulate about & sources across all measures

        measureAbout   += `<p><strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}</p>`;
        measureSources.push(measure.Sources);

    });


    // ===== set metadata defaults ================================================== //

    setDefaultMapMeasure(mapMeasures);
    setDefaultTrendMeasure(trendMeasures);
    setDefaultDisparitiesMeasure(disparitiesMeasures);

    // also calls (and waits for) createJoinedLinksData

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ================================================== //

    showTable = (e) => {

        console.log("* showTable");

        overlay = 'table';

        updateChartPlotSize();

        $($.fn.dataTable.tables(false))
            .DataTable()
            .columns.adjust().draw();

    };


    // ===== map ================================================== //

    showMap = (e) => {

        console.log("* showMap");

        overlay = 'map';

        // --- resolve metadata for the current MeasureID --- //

        let metadata = mapMeasures.filter(m => m.MeasureID == MeasureID);

        if (!metadata.length) metadata = defaultMapMetadata;

        // --- filter data by current globals --- //

        filteredMapData = mapData.filter(obj =>
            obj.MeasureID == MeasureID &&
            obj.TimePeriodID == TimePeriodID &&
            prettifyGeoType(obj.GeoType) == GeoTypeID
        );

        console.log("filteredMapData:", filteredMapData.length, "rows",
            { MeasureID, GeoTypeID, TimePeriodID });

        // --- render --- //

        renderMap(filteredMapData, metadata);

    };


    // ===== trend ================================================== //

    showTrend = (e) => {

        console.log("* showTrend");

        overlay = 'trend';

        if (trendMeasures.length === 0 || showingComparisonTrend) {
            showComparisonTrend();
        } else {
            showBoroughTrend();
        }

    }

    // ----- show the normal trend chart --------------------------------------------------- //

    showBoroughTrend = (e) => {

        console.log("** showBoroughTrend");

        // special time-period filtering for certain air quality measures

        const measureIdsAnnualAvg = [365, 370, 375, 391];
        const measureIdsSummer = [386];

        // --- resolve measure: use global if it has trend data, else default --- //

        const hasTrend = trendMeasures.find(m => m.MeasureID == MeasureID);
        const trendMetadataArr = hasTrend ? [hasTrend] : defaultTrendMetadata;
        const trendMeasureId = trendMetadataArr[0].MeasureID;

        // --- build Arquero metadata table --- //

        const aqMetadata = aq.from(trendMetadataArr)
            .derive({
                IndicatorLabel: aq.escape(indicatorName),
                ComparisonName: aq.escape('Boroughs')
            });

        // --- filter data by resolved measure --- //

        filteredTrendData = trendData
            .filter(m => m.MeasureID === trendMeasureId);

        // --- handle special time-period subsets --- //

        if (measureIdsAnnualAvg.includes(trendMeasureId)) {

            aqFilteredTrendData = aq.from(
                filteredTrendData.filter(d => d.TimePeriod.startsWith('Annual Average'))
            );

        } else if (measureIdsSummer.includes(trendMeasureId)) {

            aqFilteredTrendData = aq.from(
                filteredTrendData.filter(d => d.TimePeriod.startsWith('Summer'))
            );

        } else {

            aqFilteredTrendData = aq.from(filteredTrendData);

        }

        // --- render --- //

        renderTrendChart(aqFilteredTrendData, aqMetadata);

        showingBoroughTrend = true;
        showingComparisonTrend = false;

    };
    

    // ----- show the trend comparison chart --------------------------------------------------- //

    showComparisonTrend = (e) => {

        console.log("** showComparisonTrend");

        if (!selectedComparison) {

            const comparisonId = parseInt(comparisonMetadata[0].ComparisonID);

            // build measure info

            selectedComparisonAbout = [];
            selectedComparisonSources = [];

            aqComparisonIndicatorsMetadata.objects().forEach(m => {
                selectedComparisonAbout +=
                    `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.how_calculated}</p>`;
                selectedComparisonSources.push(m.Sources);
            });

            // metadata

            aqFilteredComparisonMetadata = aqComparisonMetadata
                .filter(aq.escape(d => d.ComparisonID == comparisonId))
                .join(aqComparisonIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]]);

            // data

            aqFilteredComparisonData = aqFilteredComparisonMetadata
                .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
                .join(aqComparisonIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])
                .join(timeTable, [["TimePeriodID"], ["TimePeriodID"]])
                // put host indicator first (then measure), so it gets the black line
                .orderby(aq.desc(aq.escape(d => d.IndicatorID == IndicatorID)), d => d.MeasureID);

            // show only last 3 years of DWQ measures with quarterly data

            let hasQuarters = [858, 859, 860, 861, 862, 863];

            if (aqFilteredComparisonMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {
                aqFilteredComparisonData = aqFilteredComparisonData
                    .derive({"year": d => op.year(d.end_period)})
                    .filter(d => d.year > op.max(d.year) - 3)
                    .select(aq.not("TimePeriodID", "year"))
                    .reify();
            }

            renderTrendChart(
                aqFilteredComparisonData,
                aqFilteredComparisonMetadata
            );

        } else {

            // restore existing chart

            renderAboutSources(selectedComparisonAbout, selectedComparisonSources);

            renderTrendChart(
                aqFilteredComparisonData,
                aqFilteredComparisonMetadata
            );

        }

        showingBoroughTrend = false;
        showingComparisonTrend = true;

    }


    // ===== links ================================================== //

    // define function

    showLinks = (e) => {

        console.log("* showLinks");

        overlay = 'links';

        if (linksMeasures.length === 0) {

            // no links available

            if (disparitiesMeasures.length > 0) {
                renderDisparitiesChart(defaultDisparitiesMetadata, 221);
            }

        } else {

            // has links

            if (!selectedLinksMeasure) {

                // first load — compute defaults

                const secondaryMeasureId = defaultPrimaryLinksMeasureMetadata[0]?.VisOptions[0].Links[0].Measures[0].MeasureID;

                const linksSecondaryIndicator = indicators.filter(indicator =>
                    indicator.Measures.some(measure =>
                        measure.MeasureID === secondaryMeasureId
                    )
                );

                defaultSecondaryMeasureMetadata = linksSecondaryIndicator[0]?.Measures?.filter(m =>
                    m.MeasureID === secondaryMeasureId
                );

                primaryIndicatorName   = indicatorName;
                secondaryIndicatorName = linksSecondaryIndicator[0]?.IndicatorName;

                const primaryMeasure   = defaultPrimaryLinksMeasureMetadata[0]?.MeasurementType;
                const primaryAbout     = defaultPrimaryLinksMeasureMetadata[0]?.how_calculated;
                const primarySources   = defaultPrimaryLinksMeasureMetadata[0]?.Sources;

                const secondaryMeasure = defaultSecondaryMeasureMetadata[0]?.MeasurementType;
                const secondaryAbout   = defaultSecondaryMeasureMetadata[0]?.how_calculated;
                const secondarySources = defaultSecondaryMeasureMetadata[0]?.Sources;

                defaultLinksAbout =
                    `<p><strong>${primaryIndicatorName} - ${primaryMeasure}</strong>: ${primaryAbout}</p>
                    <p><strong>${secondaryIndicatorName} - ${secondaryMeasure}</strong>: ${secondaryAbout}</p>`;

                defaultLinksSources = [];
                defaultLinksSources.push(primarySources);
                defaultLinksSources.push(secondarySources);

                renderCorrelate(
                    joinedLinksDataObjects,
                    defaultPrimaryLinksMeasureMetadata,
                    defaultSecondaryMeasureMetadata,
                    primaryIndicatorName,
                    secondaryIndicatorName
                );

                // set up links / disparities toggle

                if (disparitiesMeasures.length > 0) {
                    clickLinksToggle();
                }

            } else {

                // restore existing chart

                renderAboutSources(selectedLinksAbout, selectedLinksSources);

                renderCorrelate(
                    joinedLinksDataObjects,
                    selectedPrimaryMeasureMetadata,
                    selectedSecondaryMeasureMetadata,
                    primaryIndicatorName,
                    secondaryIndicatorName
                );

            }
        }

    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // disable tabs when no data is available
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const disableTab = (el) => {
        el.classList.add('disabled');
        el.setAttribute('aria-disabled', true);
    };

    const enableTab = (el) => {
        el.classList.remove('disabled');
        el.setAttribute('aria-disabled', false);
    };

    // map

    if (mapMeasures.length === 0) {
        disableTab(tabBar);
    } else {
        enableTab(tabBar);
    }

    // trend — disable if no trend measures (or only 1 time period) and no comparisons

    const onlyOneTime = trendMeasures.every(m => m.VisOptions[0].Trend[0]?.TimePeriodID.length <= 1);

    if ((trendMeasures.length === 0 || onlyOneTime) && (typeof comparisonMetadata === 'undefined' || comparisonMetadata.length === 0)) {
        disableTab(tabTrends);
    } else {
        enableTab(tabTrends);
    }

    // links + disparities

    if (linksMeasures.length === 0 && disparitiesMeasures.length === 0) {
        disableTab(tabCorrelate);
    } else {
        enableTab(tabCorrelate);
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // activate the Bootstrap tab matching overlay
    // (the caller — checkURL or popstate — calls renderCurrentView after)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const tabSelector = {
        'map':   '#v-pills-bar-tab',
        'trend': '#v-pills-trends-tab',
        'links': '#v-pills-correlate-tab',
        'table': '#v-pills-table-tab'
    };

    const target = tabSelector[overlay] || '#v-pills-bar-tab';
    $(target).tab('show');

}

