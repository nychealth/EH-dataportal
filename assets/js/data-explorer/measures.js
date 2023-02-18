// ======================================================================= //
// measures.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// function to create data and metadata for links chart
// ----------------------------------------------------------------------- //

// WHAT'S THE MOST RECENT YEAR WHERE PRIMARY AND SECONDARY SHARE A GEOGRAPHY?

const filterSecondaryIndicatorMeasure = async (primaryMeasureId, secondaryMeasureId) => {

    console.log("primaryMeasureId", primaryMeasureId);
    console.log("secondaryMeasureId", secondaryMeasureId);

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

    // ==== times ==== //

    // get available time periods for secondary measure

    const secondaryMeasureTimes   = secondaryMeasureMetadata[0].AvailableTimes;
    const aqSecondaryMeasureTimes = aq.from(secondaryMeasureTimes);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const filteredPrimaryMeasureData = fullDataLinksObjects

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

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();
            

            // ==== get closest data ==== //

            // get the secondary end time closest to most recent primary end time

            const closestSecondaryTime = filteredSecondaryMeasureTimesDataObjects.reduce((prev, curr) => {

                return (Math.abs(curr.end_period - mostRecentPrimaryMeasureEndTime) < Math.abs(prev.end_period - mostRecentPrimaryMeasureEndTime) ? curr : prev);

            });


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
            
            const aqJoinedPrimarySecondaryData = aqFilteredPrimaryMeasureTimesData
                .join(
                    aqClosestSecondaryData,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )

            // set the value of joinedDataLinksObjects, and make sure to wait for it

            joinedDataLinksObjects = await aqJoinedPrimarySecondaryData.objects();

        })
}


// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //

// ===== map ===== //

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

    } else {
        defaultArray.push(visArray[0]);

    }

    // assigning to global object

    defaultMapMetadata = defaultArray;

}


// ===== trend ===== //

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

        } else {
            defaultArray.push(visArray[0]);

        }
    }

    // assigning to global object

    defaultTrendMetadata = defaultArray;
}


// ===== links ===== //

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


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// tab update functions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== map ===== //

const updateMapData = (e) => {

    // ----- handle selection ----- //

    // get meaasureId of selected dropdown element

    const measureId = parseInt(e.target.dataset.measureId);

    // get selected time

    const time = e.target.dataset.time;

    // persistent selection

    // remove active class from every list element
    $('.mapbutton').removeClass("active");
    $('.mapbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);


    // ----- get metatadata for selected measure ----- //

    const measureMetadata = mapMeasures.filter(m => m.MeasureID == measureId);
    const measurementType = measureMetadata[0].MeasurementType;
    const about           = measureMetadata[0].how_calculated;
    const sources         = measureMetadata[0].Sources;


    // ----- set measure info boxes ----- //

    // "indicatorName" is set in loadIndicator

    selectedMapAbout   =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedMapSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedMapAbout, selectedMapSources);


    // ----- create dataset ----- //

    // filter map data using selected measure and time

    let mapMeasureData =
        fullDataMapObjects.filter(
            obj => obj.MeasureID === measureId &&
            obj.Time === time
        );

    // get the highest GeoRank, then keep just that geo

    let maxGeoRank = Math.max(mapMeasureData[0].GeoRank);
    filteredMapData = mapMeasureData.filter(obj => obj.GeoRank === maxGeoRank)

    // ----- render the map ----- //

    renderMap(filteredMapData, measureMetadata);

    updateChartPlotSize();

    // allow map to persist when changing tabs

    selectedMapMeasure = true;

}


// ===== trend ===== //

const updateTrendData = (e) => {

    console.log("updateTrendData");

    // ----- handle selection ----- //

    // get meaasureId of selected dropdown element

    const measureId = parseInt(e.target.dataset.measureId);

    // persistent selection

    // remove active class from every list element
    $('.trendbutton').removeClass("active");
    $('.trendbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // ----- get metatadata for selected measure ----- //

    // trendMeasures is created by renderMeasures, which evals before this would be called
    const measureMetadata = trendMeasures.filter(m => m.MeasureID == measureId);
    const measurementType = measureMetadata[0].MeasurementType;
    const about           = measureMetadata[0].how_calculated;
    const sources         = measureMetadata[0].Sources;


    // ----- set measure info boxes ----- //

    selectedTrendAbout =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedTrendSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedTrendAbout, selectedTrendSources);


    // ----- handle disparities button ----- //

    // check if disparities is enabled for this measure

    const disparities =
        measureMetadata[0].VisOptions[0].Trend &&
        measureMetadata[0].VisOptions[0].Trend[0]?.Disparities;

    // hide or how disparities button

    if (disparities == 0) {

        // if disparities is disabled, hide the button

        btnShowDisparities.style.display = "none";

        // remove click listeners to button that calls renderDisparities

        $(btnShowDisparities).off()

    } else if (disparities == 1) {

        // remove event listener added when/if button was clicked

        btnShowDisparities.innerText = "Show Disparities";
        $(btnShowDisparities).off()

        // if disparities is enabled, show the button

        btnShowDisparities.style.display = "inline";

        // add click listener to button that calls renderDisparities

        $(btnShowDisparities).on("click", () => renderDisparities(measureMetadata, 221));

    }


    // ----- create dataset ----- //

    // created filtered trend data, to be passed to render function

    filteredTrendData = fullDataTrendObjects.filter(m => m.MeasureID === measureId);


    // ----- render the chart ----- //

    // chart only the annual average for the following measureIds:
    // 365 - PM2.5 (Fine particles), Mean
    // 370 - Black carbon, Mean
    // 391 - Nitric oxide, Mean
    // 375 - Nitrogen dioxide, Mean

    const measureIdsAnnualAvg = [365, 370, 375, 391];

    // chart only the summer average for the following measureIds:
    // 386 - Ozone (O3), Mean

    const measureIdsSummer = [386];

    if (measureIdsAnnualAvg.includes(measureId)) {

        const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));

        renderTrendChart(filteredTrendDataAnnualAvg, measureMetadata);
        updateChartPlotSize();

    } else if (measureIdsSummer.includes(measureId)) {

        const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));

        renderTrendChart(filteredTrendDataSummer, measureMetadata);
        updateChartPlotSize();

    } else {

        renderTrendChart(filteredTrendData, measureMetadata);
        updateChartPlotSize();

    }

    // allow trend chart to persist when changing tabs

    selectedTrendMeasure = true;

}


// ===== links ===== //

const updateLinksData = async (e) => {

    // ---- handle selection ----- //

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


    // ----- get metatadata for selected measure ----- //

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


    // ----- set measure info boxes ----- //

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


    // ----- render the chart ----- //

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

// ===== year ===== //

const handleYearFilter = (el) => {

    el.addEventListener('change', (e) => {

        // console.log("e", e);

        if (e.target.checked) {

            // selectedSummaryYears = [e.target.value]
            selectedSummaryYears.push(e.target.value)

        } else {

            // if the selected element is not checked, remove it from summary years

            let index = selectedSummaryYears.indexOf(e.target.value);

            if (index !== -1) {
                selectedSummaryYears.splice(index, 1);
            }
        }
        renderTable()
    })
}

// ===== geo ===== //

const handleGeoFilter = (el) => {

    el.addEventListener('change', (e) => {

        if (e.target.checked) {
            selectedSummaryGeography.push(e.target.value)
        } else {
            selectedSummaryGeography = selectedSummaryGeography.filter(item => item !== e.target.value);
        }

        // only render table if a geography is checked

        if (selectedSummaryGeography.length > 0) {
            renderTable()

        } else {
            document.querySelector("#tableID").innerHTML = '';
        }
    })
}

// ----------------------------------------------------------------------- //
// finally, render the measures
// ----------------------------------------------------------------------- //

const renderMeasures = async () => {

    console.log("** renderMeasures");

    selectedSummaryYears = [];
    selectedSummaryGeography = [];

    linksMeasures.length = 0

    const contentSummary = document.querySelector('#tab-table');
    const contentMap     = document.querySelector('#tab-map')
    const contentTrend   = document.querySelector('#tab-trend');
    const contentLinks   = document.querySelector('#tab-links');

    // ----- set dropdowns for this indicator ----- //

    const dropdownTableYear = contentSummary.querySelector('div[aria-labelledby="dropdownTableYear"]');
    const dropdownMapMeasures = contentMap.querySelector('div[aria-labelledby="dropdownMapMeasures"]');

    const dropdownTableGeo = contentSummary.querySelector('div[aria-labelledby="dropdownTableGeo"]');
    const dropdownTrendMeasures = contentTrend.querySelector('div[aria-labelledby="dropdownTrendMeasures"]');
    const dropdownLinksMeasures = contentLinks.querySelector('div[aria-labelledby="dropdownLinksMeasures"]');

    // clear Measure Dropdowns

    dropdownTableYear.innerHTML = ``;
    dropdownTableGeo.innerHTML = ``;
    dropdownMapMeasures.innerHTML = ``;
    dropdownTrendMeasures.innerHTML = ``;
    dropdownLinksMeasures.innerHTML = ``;

    mapMeasures.length = 0;
    trendMeasures.length = 0;

    // create years dropdown for table

    const tableYears = [...new Set(fullDataTableObjects.map(item => item.Time))];

    // console.log("tableYears", tableYears);

    tableYears.forEach((year, index) => {

        if (index === 0) {

            // default to most recent year

            selectedSummaryYears = [year];

            dropdownTableYear.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" checked /> ${year}</label>`;

        } else {

            dropdownTableYear.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input class="largerCheckbox" type="checkbox" name="year" value="${year}" /> ${year}</label>`;
        }

    });

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [...new Set(fullDataTableObjects.map(item => prettifyGeoType(item.GeoType)))];
    const dropdownGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g))

    // console.log("geoTypes:", geoTypes);
    // console.log("dropdownGeoTypes:", dropdownGeoTypes);

    dropdownGeoTypes.forEach(geo => {

        selectedSummaryGeography.push(geo);
        
        // console.log("selectedSummaryGeography:", selectedSummaryGeography);

        dropdownTableGeo.innerHTML += `<label class="dropdown-item checkbox-geo"><input class="largerCheckbox" type="checkbox" value="${geo}" checked /> ${geo}</label>`;

    });


    // ----- handle measures for this indicator ----- //

    const mapYears = [...new Set(fullDataMapObjects.map(item => item.Time))];

    indicatorMeasures.map((measure, index) => {

        const type = measure?.MeasurementType;
        const links = measure?.VisOptions[0].Links && measure?.VisOptions[0]?.Links[0];
        const map = measure?.VisOptions[0].Map && measure?.VisOptions[0].Map[0]?.On;
        const trend = measure?.VisOptions[0].Trend && measure?.VisOptions[0].Trend[0]?.On;
        const measureId = measure.MeasureID;


        // ----- handle map measures ----- //

        if (map === 1) {

            mapMeasures.push(measure)

            dropdownMapMeasures.innerHTML += `<div class="dropdown-column-${index}"><div class="dropdown-title"><strong> ${type}</strong></div></div>`;

            const dropdownMapMeasuresColumn = document.querySelector(`.dropdown-column-${index}`);

            mapYears.map(time => {
                dropdownMapMeasuresColumn.innerHTML += `<button class="dropdown-item link-measure mapbutton"
                data-measure-id="${measureId}"
                data-time="${time}">
                ${time}
                </button>`;

            });
        }


        // ----- handle trend measures ----- //

        if (trend === 1) {

            trendMeasures.push(measure)

            if (fullDataTrendObjects) {
                dropdownTrendMeasures.innerHTML += `<button class="dropdown-item link-measure trendbutton"
                data-measure-id="${measureId}">
                ${type}
                </button>`;
            }
        }


        // ----- handle links measures ----- //

        if (links) {

            // create linked measures object

            linksMeasures.push(measure)

            // get secondary measure id

            if (fullDataTableObjects) {

                dropdownLinksMeasures.innerHTML +=
                    `<div class="dropdown-title"><strong> ${type}</strong></div>`;

                measure.VisOptions[0].Links.map(link => {

                    const linksSecondaryIndicator = indicators.filter(indicator =>
                        indicator.Measures.some(m =>
                            m.MeasureID === link.MeasureID)
                    );

                    const linksSecondaryMeasure = linksSecondaryIndicator[0].Measures.filter(m =>
                        m.MeasureID === link.MeasureID
                    );

                    dropdownLinksMeasures.innerHTML +=
                        `<button class="dropdown-item link-measure linksbutton"
                        data-primary-measure-id="${measureId}"
                        data-measure-id="${measure.MeasureID}"
                        data-secondary-measure-id="${link.MeasureID}">
                        ${linksSecondaryMeasure[0].MeasureName}
                    </button>`;

                });
            }
        }
    });


    setDefaultMapMeasure(mapMeasures);
    setDefaultTrendMeasure(trendMeasures);

    // set default measure for links; also calls filterSecondaryIndicatorMeasure, which creates the joined data

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ===== //

    // define function

    showTable = (e) => {

        console.log("showTable");

        // ----- handle tab selection ----- //

        // set hash to summary

        if (window.location.hash !== '#display=summary' && window.location.hash !== 'display=summary') {
            window.location.hash = 'display=summary';
        }

        currentHash = 'display=summary'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', true);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- set measure info boxes ----- //

        renderTitleDescription(indicatorShortName, indicatorDesc);
        renderAboutSources(measureAbout, measureSources);


        // ----- render the table ----- //

        renderTable();

        updateChartPlotSize();

        $($.fn.dataTable.tables(false))
            .DataTable()
            .columns.adjust().draw();

    };


    // ===== map ===== //

    // define function

    showMap = (e) => {

        // ----- handle tab selection ----- //

        // set hash to map

        window.location.hash = 'display=map'
        currentHash = 'display=map'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', true);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- allow map to persist when changing tabs ----- //

        if (!selectedMapMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure ----- //

            // get default measure id

            const defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

            // extract metadata for info boxes

            const about   = defaultMapMetadata[0]?.how_calculated;
            const sources = defaultMapMetadata[0].Sources;
            const measure = defaultMapMetadata[0].MeasurementType;


            // ----- set measure info boxes ----- //

            defaultMapAbout   =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${about}</p>`;

            defaultMapSources =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${sources}</p>`;

            // render measure info boxes

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultMapAbout, defaultMapSources);


            // ----- create dataset ----- //

            // filter map data using default measure

            let mapMeasureData = fullDataMapObjects.filter(
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


            // ----- render the map ----- //

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();

            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.mapbutton').removeClass("active");
            $('.mapbutton').attr('aria-selected', false);

            // set this element as active & selected

            let mapMeasureEl = document.querySelector(`.mapbutton[data-measure-id='${defaultMapMeasureId}'][data-time='${latest_time}']`)

            $(mapMeasureEl).addClass("active");
            $(mapMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a map already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedMapAbout, selectedMapSources);

            // ----- render the map ----- //

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();
        }

    };


    // ===== trend ===== //

    // define function

    showTrend = (e) => {

        // ----- handle tab selection ----- //

        // set hash to trend

        window.location.hash = 'display=trend'
        currentHash = 'display=trend'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', true);
        tabLinks.setAttribute('aria-selected', false);


        // ----- allow chart to persist when changing tabs ----- //

        if (!selectedTrendMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function


            // ----- get metatadata for default measure ----- //

            const about   = defaultTrendMetadata[0]?.how_calculated;
            const sources = defaultTrendMetadata[0].Sources;
            const measure = defaultTrendMetadata[0].MeasurementType;


            // ----- set measure info boxes ----- //

            defaultTrendAbout =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${about}</p>`;

            defaultTrendSources =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${sources}</p>`;

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultTrendAbout, defaultTrendSources);


            // ----- handle disparities button ----- //

            // switch on/off the disparities button

            const disparities =
                defaultTrendMetadata[0].VisOptions[0].Trend &&
                defaultTrendMetadata[0].VisOptions[0].Trend[0]?.Disparities;

            // hide or show disparities button

            if (disparities == 0) {

                // if disparities is disabled, hide the button

                btnShowDisparities.style.display = "none";

                // remove click listeners to button that calls renderDisparities

                $(btnShowDisparities).off()

            } else if (disparities == 1) {

                // remove event listener added when/if button was clicked

                btnShowDisparities.innerText = "Show Disparities";
                $(btnShowDisparities).off()

                // if disparities is enabled, show the button

                btnShowDisparities.style.display = "inline";

                // add click listener to button that calls renderDisparities

                $(btnShowDisparities).on("click", () => renderDisparities(defaultTrendMetadata, 221))

            }


            // ----- create dataset ----- //

            const defaultTrendMeasureId = defaultTrendMetadata[0].MeasureID;
            filteredTrendData = fullDataTrendObjects.filter(m => m.MeasureID === defaultTrendMeasureId);


            // ----- render the chart ----- //

            // chart only the annual average for the following measureIds:
            // 365 - PM2.5 (Fine particles), Mean
            // 370 - Black carbon, Mean
            // 391 - Nitric oxide, Mean
            // 375 - Nitrogen dioxide, Mean

            const measureIdsAnnualAvg = [365, 370, 375, 391];

            // chart only the summer average for the following measureIds:
            // 386 - Ozone (O3), Mean

            const measureIdsSummer = [386];

            if (measureIdsAnnualAvg.includes(defaultTrendMeasureId)) {

                const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));

                renderTrendChart(filteredTrendDataAnnualAvg, defaultTrendMetadata);
                updateChartPlotSize();

            } else if (measureIdsSummer.includes(defaultTrendMeasureId)) {

                const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));

                renderTrendChart(filteredTrendDataSummer, defaultTrendMetadata);
                updateChartPlotSize();

            } else {

                renderTrendChart(filteredTrendData, defaultTrendMetadata);
                updateChartPlotSize();

            }


            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.trendbutton').removeClass("active");
            $('.trendbutton').attr('aria-selected', false);

            // set this element as active & selected

            let trendMeasureEl = document.querySelector(`.trendbutton[data-measure-id='${defaultTrendMeasureId}']`)

            $(trendMeasureEl).addClass("active");
            $(trendMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedTrendAbout, selectedTrendSources);

            // ----- render the chart ----- //

            renderTrendChart(filteredTrendData, defaultTrendMetadata);

            updateChartPlotSize();
        }

    };


    // ===== links ===== //

    // define function

    showLinks = (e) => {

        // ----- handle tab selection ----- //

        // set hash to links

        window.location.hash = 'display=links'
        currentHash = 'display=links'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', true);


        // ----- allow chart to persist when changing tabs ----- //

        if (!selectedLinksMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure ----- //

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


            // ----- set measure info boxes ----- //

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


            // ----- create dataset ----- //

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultLinksAbout, defaultLinksSources);


            // ----- render the chart ----- //

            // joined data and metadata created in filterSecondaryIndicatorMeasure called fron setDefaultLinksMeasure

            renderLinksChart(
                joinedDataLinksObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();


            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.linksbutton').removeClass("active");
            $('.linksbutton').attr('aria-selected', false);

            // set this element as active & selected

            let linksMeasureEl = document.querySelector(`.linksbutton[data-secondary-measure-id='${secondaryMeasureId}']`)

            $(linksMeasureEl).addClass("active");
            $(linksMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedLinksAbout, selectedLinksSources);

            // ----- render the chart ----- //

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
    // disable tabs and switch to summary if there are no measures
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

    if (trendMeasures.length === 0 || onlyOneTime) {

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

    let mapMeasuresLinks = document.querySelectorAll('.mapbutton');
    let trendMeasuresLinks = document.querySelectorAll('.trendbutton');
    let linksMeasuresLinks = document.querySelectorAll('.linksbutton');

    // adding click listeners using update functions
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#memory_issues

    mapMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateMapData);
    })

    trendMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateTrendData);
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
