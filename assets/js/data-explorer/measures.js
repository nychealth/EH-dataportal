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

        // using await here because filterSecondaryIndicatorMeasure calls fetch, and we need that data

        await filterSecondaryIndicatorMeasure(defaultPrimaryMeasureId, defaultSecondaryMeasureId)

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

    if (typeof e.target.dataset.measureId != 'undefined') {

        // console.log("e", e.target.dataset);
        
        // get meaasureId of selected dropdown element
        
        measureId = parseInt(e.target.dataset.measureId);
        
        time = $('.maptimesbutton.active').attr("data-time")

        // console.log(">>> measure", "measureId", measureId, "time", time);

        // persistent selection
        
        // measures
        
        $('.mapmeasuresbutton').removeClass("active");
        $('.mapmeasuresbutton').attr('aria-selected', false);
        
    }
    
    if (typeof e.target.dataset.time != 'undefined') {
        
        // console.log("e", e.target.dataset);

        // get selected time
        
        time = String(e.target.dataset.time);

        measureId = $('.mapmeasuresbutton.active').attr("data-measure-id")
        
        // console.log(">>> time", "measureId", measureId, "time", time);

        // persistent selection

        // times

        $('.maptimesbutton').removeClass("active");
        $('.maptimesbutton').attr('aria-selected', false);

    }


    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);


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

    let mapMeasureData =
        mapData.filter(
            obj => obj.MeasureID == measureId &&
            obj.Time == time
        );

    // console.log("mapMeasureData", mapMeasureData);

    // get the highest GeoRank, then keep just that geo

    let maxGeoRank = Math.max(mapMeasureData[0].GeoRank);
    filteredMapData = mapMeasureData.filter(obj => obj.GeoRank === maxGeoRank)

    // ----- render the map -------------------------------------------------- //

    renderMap(filteredMapData, selectedMapMetadata);

    updateChartPlotSize();

    // allow map to persist when changing tabs

    selectedMapMeasure = true;

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// trend
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== normal trend ================================================== //

const updateTrendData = (e) => {

    console.log("updateTrendData");

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

}


// ===== trend comparisons ================================================== //

const updateTrendComparisonsData = (e) => {

    console.log("updateTrendComparisonsData");

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
        .select("IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure")
        .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

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
            .print(20)

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

    // call filterSecondaryIndicatorMeasure, which creates joinedDataLinksObjects,
    //  primaryMeasureMetadata, secondaryMeasureMetadata

    await filterSecondaryIndicatorMeasure(primaryMeasureId, secondaryMeasureId)


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
        joinedDataLinksObjects,
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

const handleYearFilter = (el) => {

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

const handleGeoFilter = (el) => {

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
// function to render the measures
// ----------------------------------------------------------------------- //

const renderMeasures = async () => {

    console.log("** renderMeasures");

    selectedTableYears = [];
    selectedTableGeography = [];

    linksMeasures.length = 0

    const contentTable = document.querySelector('#tab-table');
    const contentMap     = document.querySelector('#tab-map')
    const contentTrend   = document.querySelector('#tab-trend');
    const contentLinks   = document.querySelector('#tab-links');

    // console.log("contentTrend", contentTrend);

    // ----- set dropdowns for this indicator ================================================== //

    const dropdownTableGeo = contentTable.querySelector('div[aria-labelledby="dropdownTableGeo"]');
    const dropdownTableTime = contentTable.querySelector('div[aria-labelledby="dropdownTableTime"]');

    const dropdownTrendComparisons = contentTrend.querySelector('div[aria-labelledby="dropdownTrendComparisons"]');

    const dropdownMapMeasures = contentMap.querySelector('div[aria-labelledby="dropdownMapMeasures"]');
    const dropdownMapTimes = contentMap.querySelector('div[aria-labelledby="dropdownMapTimes"]');
    const dropdownLinksMeasures = contentLinks.querySelector('div[aria-labelledby="dropdownLinksMeasures"]');

    // console.log("dropdownTrendComparisons", dropdownTrendComparisons);


    // clear Measure Dropdowns

    dropdownTableGeo.innerHTML = ``;
    dropdownTableTime.innerHTML = ``;

    dropdownTrendComparisons.innerHTML = ``;

    dropdownMapMeasures.innerHTML = ``;
    dropdownMapTimes.innerHTML = ``;
    dropdownLinksMeasures.innerHTML = ``;

    mapMeasures.length = 0;
    trendMeasures.length = 0;


    // create years dropdown for table

    const tableYears = [...new Set(tableData.map(item => item.Time))];

    // console.log("tableYears", tableYears);

    tableYears.forEach((year, index) => {

        if (index === 0) {

            // default to most recent year

            selectedTableYears = [year];

            dropdownTableTime.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" checked /> ${year}</label>`;

        } else {

            dropdownTableTime.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" /> ${year}</label>`;
        }

    });


    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [...new Set(tableData.map(item => prettifyGeoType(item.GeoType)))];
    const dropdownGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g))

    // console.log("geoTypes:", geoTypes);
    // console.log("dropdownGeoTypes:", dropdownGeoTypes);

    dropdownGeoTypes.forEach(geo => {

        selectedTableGeography.push(geo);
        
        // console.log("selectedTableGeography:", selectedTableGeography);

        dropdownTableGeo.innerHTML += `<label class="dropdown-item checkbox-geo"><input class="largerCheckbox" type="checkbox" value="${geo}" checked /> ${geo}</label>`;

    });


    // ----- handle measures for this indicator -------------------------------------------------- //

    const mapTimes = [...new Set(mapData.map(item => item.Time))];

    // console.log("mapTimes", mapTimes);

    mapTimes.map(time => {

        dropdownMapTimes.innerHTML += `<button class="dropdown-item link-time maptimesbutton pl-2"
            data-time="${time}">
            ${time}
            </button>`;

    });


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


        // ----- handle map measures ----------------------------------------------------------------------------------------------- //

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


    // ----- handle comparisons viz -------------------------------------------------- //

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
                
                let compIndicatorLabel = [... new Set(compGroup.array("IndicatorLabel"))];
                let compMeasurementType = [... new Set(compGroup.array("MeasurementType"))];
                let compY_axis_title = [... new Set(compGroup.array("Y_axis_title"))];
                let compIndicatorMeasure = [... new Set(compGroup.array("IndicatorMeasure"))];
                let compName = [... new Set(compGroup.array("ComparisonName"))];
                
                if (compIndicatorLabel.length == 1) {

                    console.log("1 indicator [Y_axis_title]");
                    console.log(compY_axis_title);

                    dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                        data-comparison-id="${comp}">
                        ${compY_axis_title}
                        </button>`;
                    
                } else if (compMeasurementType.length == 1) {

                    console.log("1 measure [MeasurementType]");
                    console.log(compMeasurementType);

                    dropdownTrendComparisons.innerHTML += `<button class="dropdown-item comparisonsbutton pl-3"
                        data-comparison-id="${comp}">
                        ${compMeasurementType}
                        </button>`;
                    
                } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {

                    console.log("> 1 measure & > 1 indicator [IndicatorMeasure]");
                    console.log("compGroup:", compGroup);
                    console.log("compIndicatorLabel:", compIndicatorLabel);
                    console.log("compMeasurementType:", compMeasurementType);
                    console.log("compY_axis_title:", compY_axis_title);
                    // console.log("compIndicatorMeasure:", "compIndicatorMeasure", compIndicatorMeasure);
                    console.log("compName", compName);

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

    // set default measure for links; also calls (and waits for) filterSecondaryIndicatorMeasure, which creates the joined data

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ================================================== //

    showTable = (e) => {

        console.log("showTable");

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

        // ----- handle tab selection -------------------------------------------------- //

        // set hash to map

        window.location.hash = 'display=map'
        currentHash = 'display=map'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', true);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- allow map to persist when changing tabs -------------------------------------------------- //

        if (!selectedMapMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure -------------------------------------------------- //

            // get default measure id

            const defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

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

            let mapMeasureData = mapData.filter(
                    obj => obj.MeasureID === defaultMapMeasureId
                );

            // get the latest end_period

            let latest_end_period = Math.max(mapMeasureData[0].end_period);

            let mapTimeData = mapMeasureData.filter(
                    obj => obj.end_period === latest_end_period
                );

            let latest_time = mapTimeData[0].Time

            // get the highest GeoRank for this measure and end_period

            let maxGeoRank = Math.max(mapTimeData[0].GeoRank);

            filteredMapData = mapTimeData.filter(
                obj => obj.GeoRank === maxGeoRank
            );


            // ----- render the map -------------------------------------------------- //

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();

            // ----- persistent selection -------------------------------------------------- //

            // remove active class from every list element
            
            // measures
            $('.mapmeasuresbutton').removeClass("active");
            $('.mapmeasuresbutton').attr('aria-selected', false);

            // times
            $('.maptimesbutton').removeClass("active");
            $('.maptimesbutton').attr('aria-selected', false);

            // set this element as active & selected

            let mapMeasureEl = document.querySelector(`.mapmeasuresbutton[data-measure-id='${defaultMapMeasureId}']`)
            let mapTimeEl = document.querySelector(`.maptimesbutton[data-time='${latest_time}']`)

            $(mapMeasureEl).addClass("active");
            $(mapMeasureEl).attr('aria-selected', true);

            $(mapTimeEl).addClass("active");
            $(mapTimeEl).attr('aria-selected', true);


        } else {

            // if there was a map already, restore it

            // ----- set measure info boxes -------------------------------------------------- //

            renderAboutSources(selectedMapAbout, selectedMapSources);

            // ----- render the map -------------------------------------------------- //

            renderMap(filteredMapData, defaultMapMetadata);

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

        // if (trendMeasures.length === 0 || onlyOneTime || showingNormalTrend) {
        if (comparisonsMetadata.length === 0 || showingNormalTrend) {
            
            // if there's not a comparisons trend available, show the normal trend

            showNormalTrend()

        } else {

            // If there is a comparisons trend available, show comparisons

            showTrendComparisons()

        }

    }

    // ----- show the normal trend chart -------------------------------------------------- //

    showNormalTrend = (e) => {

        console.log("* showNormalTrend");

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


            // ----- handle disparities button -------------------------------------------------- //

            // switch on/off the disparities button

            const disparities =
                defaultTrendMetadata[0].VisOptions[0].Trend &&
                defaultTrendMetadata[0].VisOptions[0].Trend[0]?.Disparities;


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

    };
    

    // ----- show the trend comparisons chart -------------------------------------------------- //

    showTrendComparisons = (e) => {

        console.log("* showTrendComparisons");
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

            // ----- get metatadata for selected measure -------------------------------------------------- //

            // aqCombinedComparisonsMetadata
            // aqComparisonsIndicatorData

            // extract metadata for about & sources boxes


            // ----- set measure info boxes -------------------------------------------------- //

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
            // aqFilteredComparisonsMetadata.print()
            
            // data

            aqFilteredComparisonsData = aqFilteredComparisonsMetadata
                .select("IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure")
                .join(aqComparisonsIndicatorData, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]])

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
                    .print(20)

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
        
    }


    // ===== links ================================================== //

    // define function

    showLinks = (e) => {

        // ----- handle tab selection -------------------------------------------------- //

        // set hash to links

        window.location.hash = 'display=links'
        currentHash = 'display=links'

        // reset aria attributes for tabs

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', true);


        // ----- allow chart to persist when changing tabs -------------------------------------------------- //

        if (!selectedLinksMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

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

            // joined data and metadata created in filterSecondaryIndicatorMeasure called fron setDefaultLinksMeasure

            renderLinksChart(
                joinedDataLinksObjects,
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
                joinedDataLinksObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();
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
    // add event listeners to measure dropdown elements, will call the
    //  respective update functions
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // without custom class, selector would be '[aria-labelledby="dropdownMapMeasures"] button.link-measure'

    let mapMeasuresLinks = document.querySelectorAll('.mapmeasuresbutton');
    let mapTimesLinks = document.querySelectorAll('.maptimesbutton');
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
    const checkboxGeo = document.querySelectorAll('.checkbox-geo');

    checkboxYear.forEach(checkbox => {
        handleYearFilter(checkbox);
    })
    checkboxGeo.forEach(checkbox => {
        handleGeoFilter(checkbox);
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
