// ======================================================================= //
// measures.js
// ======================================================================= //

// console.log(">> measures.js");

// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //

// ===== map ================================================== //

// Chooses the default measure for map and bar rendering.
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

    // Apply the shared preference order from age-adjusted rates down to the first available measure.
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

// Chooses the default measure for the trend tab.
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


        // Apply the shared preference order from age-adjusted rates down to the first available measure.
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

// Chooses the default linked measure pair and fetches the joined comparison data.
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


        // Apply the shared preference order from age-adjusted rates down to the first available measure.
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

// Chooses the default measure for the disparities tab.
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


        // Apply the shared preference order from age-adjusted rates down to the first available measure.
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

// Binds the Links versus Disparities toggle without stacking duplicate handlers.
const clickLinksToggle = (e) => {

    // turn off click listener

    $(btnToggleDisparities).off(".toggle")

    // set on click listener

    $(btnToggleDisparities).on("click.toggle", (e) => {

        // remove active class from both options

        $("#show-disparities").removeClass("active");
        $("#show-links").removeClass("active");

        // determine which function to call

        // Route the toggle click to the correct correlate or disparities renderer.
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
// tab enable / disable helpers
// ----------------------------------------------------------------------- //

// Resolves tab button references on demand for startup paths that run before
// app.js assigns the shared globals in its DOMContentLoaded handler.
const resolveTabReferences = () => {
    tabBar ??= document.querySelector('#v-pills-bar-tab');
    tabTrends ??= document.querySelector('#v-pills-trends-tab');
    tabCorrelate ??= document.querySelector('#v-pills-correlate-tab');
    tabTable ??= document.querySelector('#v-pills-table-tab');
};

// Marks a Bootstrap tab as disabled when that view has no usable data.
const disableTab = (el) => {
    if (!el) {
        return;
    }

    el.classList.add('disabled');
    el.setAttribute('aria-disabled', true);
};

// Re-enables a Bootstrap tab when the current indicator supports that view.
const enableTab = (el) => {
    if (!el) {
        return;
    }

    el.classList.remove('disabled');
    el.setAttribute('aria-disabled', false);
};


// ----------------------------------------------------------------------- //
// function to render the measures
// ----------------------------------------------------------------------- //

// Prepares per-tab measure metadata and defines the active show* render functions.
const renderMeasures = async () => {

    console.log("* renderMeasures");

    resolveTabReferences();

    // Throw away any sticky table selection state before deriving new defaults for this indicator.
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

    // collect unique time period labels available in the data for the table tab
    const tableTimes = [...new Set(aqTableTimesGeos.array("TimePeriod"))];

    // Default the table to the currently selected time period when available.
    const selectedTableTime = timeLookup[TimePeriodID]?.TimePeriod;

    if (selectedTableTime && tableTimes.includes(selectedTableTime)) {
        selectedTableTimes = [selectedTableTime];
    } else if (tableTimes.length) {
        selectedTableTimes = [tableTimes[0]];
    } else {
        selectedTableTimes = [];
    }


    // ----- geo types --------------------------------------------------- //

    // create geo dropdown for table (using pretty geotypes, keeping georank order)

    const tableGeoTypes = [...new Set(aqTableTimesGeos.array("GeoType").map(gt => prettifyGeoType(gt)))];
    // filtering through geoTypes preserves canonical rank order instead of data insertion order
    const dropdownTableGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g));

    // Default the table to the currently selected geography when available.
    if (GeoType && dropdownTableGeoTypes.includes(GeoType)) {
        selectedTableGeography = [GeoType];
    } else if (dropdownTableGeoTypes.length) {
        selectedTableGeography = [dropdownTableGeoTypes[0]];
    } else {
        selectedTableGeography = [];
    }

    tableTimeFilterIsManual = false;
    tableGeoFilterIsManual = false;
    tableNeedsRender = true;

    // Force first table-tab visit to rebuild table and filter controls for this indicator.
    const tableContainer = document.getElementById('summary-table');
    if (tableContainer) {
        tableContainer.innerHTML = '';
    }


    // ===== populate per-tab measure arrays ================================================== //

    // Sort each measure into the tabs where its metadata says data exists.
    indicatorMeasures.map((measure, index) => {

        // check which viz types exist for this measure

        const map         = aqMapTimesGeos   && aqMapTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const trend       = aqTrendTimesGeos && aqTrendTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const links       = measure.VisOptions[0].Links && measure.VisOptions[0].Links[0].Measures[0]?.MeasureID;
        // Disparities == 1 in metadata signals this measure supports the disparities chart
        const disparities = measure.VisOptions[0].Links[0].Disparities == 1;

        // Each tab only gets measures that actually have data for that view.
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


    // ===== trend selection controls ============================================ //

    const contentTrend = document.querySelector('#v-pills-trends');
    const dropdownTrendSelection = contentTrend?.querySelector('div[aria-labelledby="dropdownTrendSelection"]');
    const dropdownCompSelection = contentTrend?.querySelector('div[aria-labelledby="dropdownCompSelection"]');
    const trendSelectionLabel = document.getElementById('tc1');
    const compSelectionLabel = document.getElementById('tc2');
    const trendMenuHolder = document.getElementById('trendMenuHolder');
    const compMenu = document.getElementById('compMenu');
    const trendSelectionSummary = document.getElementById('trendSelectionSummary');
    const trendSyncButton = document.getElementById('trendSyncButton');

    const getSyncedTrendMeasureId = () => {

        const matchingMapMeasure = trendMeasures.find(m => Number(m.MeasureID) === Number(MeasureID));

        if (matchingMapMeasure) {
            return Number(matchingMapMeasure.MeasureID);
        }

        const defaultTrendMeasureId = defaultTrendMetadata?.[0]?.MeasureID;

        if (defaultTrendMeasureId != null) {
            return Number(defaultTrendMeasureId);
        }

        return trendMeasures[0] ? Number(trendMeasures[0].MeasureID) : null;

    };


    const getSyncedComparisonId = () => {

        if (!comparisonMetadata?.length) {
            return null;
        }

        const matchingMeasureComparison = comparisonMetadata.find(comp =>
            comp.Indicators?.some(ind =>
                Number(ind.IndicatorID) === Number(IndicatorID) &&
                Number(ind.MeasureID) === Number(MeasureID)
            )
        );

        if (matchingMeasureComparison) {
            return Number(matchingMeasureComparison.ComparisonID);
        }

        const matchingIndicatorComparison = comparisonMetadata.find(comp =>
            comp.Indicators?.some(ind => Number(ind.IndicatorID) === Number(IndicatorID))
        );

        if (matchingIndicatorComparison) {
            return Number(matchingIndicatorComparison.ComparisonID);
        }

        return Number(comparisonMetadata[0].ComparisonID);

    };


    const getActiveTrendMeasureId = () => {

        const manualMeasureId = selectedTrendMeasureId == null ? null : Number(selectedTrendMeasureId);
        const hasManualMeasure = selectedTrendMeasure && trendMeasures.some(m => Number(m.MeasureID) === manualMeasureId);

        return hasManualMeasure ? manualMeasureId : getSyncedTrendMeasureId();

    };


    const getActiveComparisonId = () => {

        const manualComparisonId = selectedComparisonId == null ? null : Number(selectedComparisonId);
        const hasManualComparison = selectedComparison && comparisonMetadata?.some(comp =>
            Number(comp.ComparisonID) === manualComparisonId
        );

        return hasManualComparison ? manualComparisonId : getSyncedComparisonId();

    };


    const clearTrendButtonState = () => {

        document.querySelectorAll('.trendbutton, .comparisonbutton').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

    };


    const setTrendButtonState = () => {

        clearTrendButtonState();

        const useComparisonState = (showingComparisonTrend && comparisonMetadata?.length) ||
            (!trendMeasures.length && comparisonMetadata?.length);

        if (useComparisonState) {

            const comparisonId = getActiveComparisonId();
            const comparisonButton = comparisonId == null
                ? null
                : document.querySelector(`.comparisonbutton[data-comparison-id='${comparisonId}']`);

            if (comparisonButton) {
                comparisonButton.classList.add('active');
                comparisonButton.setAttribute('aria-selected', 'true');
            }

            return;

        }

        const trendMeasureId = getActiveTrendMeasureId();
        const trendButton = trendMeasureId == null
            ? null
            : document.querySelector(`.trendbutton[data-measure-id='${trendMeasureId}']`);

        if (trendButton) {
            trendButton.classList.add('active');
            trendButton.setAttribute('aria-selected', 'true');
        }

    };


    const updateTrendSelectionSummary = () => {

        if (!trendSelectionSummary) {
            return;
        }

        const trendMeasure = trendMeasures.find(m => Number(m.MeasureID) === Number(getActiveTrendMeasureId()));
        const trendLabel = trendMeasure?.MeasurementType || 'No borough trend';

        const comparisonId = getActiveComparisonId();
        const comparisonButton = comparisonId == null
            ? null
            : dropdownCompSelection?.querySelector(`.comparisonbutton[data-comparison-id='${comparisonId}']`);
        const comparisonLabel = comparisonButton?.textContent.trim() || 'No comparison';

        const syncState = selectedTrendMeasure || selectedComparison ? 'Custom' : 'Synced';

        trendSelectionSummary.textContent = `Trend: ${trendLabel} | Comparison: ${comparisonLabel} | ${syncState}`;

    };


    syncTrendSelectionsToMapSelection = (force = false) => {

        let didChange = false;

        const syncedTrendMeasureId = getSyncedTrendMeasureId();

        if (force || !selectedTrendMeasure) {
            if (selectedTrendMeasureId !== syncedTrendMeasureId) {
                selectedTrendMeasureId = syncedTrendMeasureId;
                didChange = true;
            }

            selectedTrendMeasure = false;
        }

        const syncedComparisonId = getSyncedComparisonId();

        if (force || !selectedComparison) {
            if (selectedComparisonId !== syncedComparisonId) {
                selectedComparisonId = syncedComparisonId;
                didChange = true;
            }

            selectedComparison = false;
        }

        setTrendButtonState();
        updateTrendSelectionSummary();

        return didChange;

    };


    const buildTrendSelectionControls = () => {

        if (trendSelectionLabel) {
            trendSelectionLabel.textContent = 'By geography';
        }

        if (compSelectionLabel) {
            compSelectionLabel.textContent = 'Show with:';
        }

        if (dropdownTrendSelection) {
            dropdownTrendSelection.innerHTML = '';
        }

        if (dropdownCompSelection) {
            dropdownCompSelection.innerHTML = '';
        }

        trendMenuHolder?.classList.add('d-none');
        compMenu?.classList.add('hide');

        if (trendMeasures.length > 0 && dropdownTrendSelection) {

            trendMenuHolder?.classList.remove('d-none');

            trendMeasures.forEach(measure => {
                dropdownTrendSelection.innerHTML += DOMPurify.sanitize(`<button class="btn btn-primary dropdown-item trendbutton pl-2"
                    data-measure-id="${measure.MeasureID}" title="${measure.MeasurementType}">
                    ${measure.MeasurementType}
                </button>`);
            });

            dropdownTrendSelection.onclick = event => {

                const button = event.target.closest('.trendbutton');

                if (!button) {
                    return;
                }

                selectedTrendMeasure = true;
                selectedTrendMeasureId = parseInt(button.dataset.measureId);
                showingComparisonTrend = false;
                showingBoroughTrend = true;

                setTrendButtonState();
                updateTrendSelectionSummary();
                showBoroughTrend();

            };

        } else if (dropdownTrendSelection) {

            dropdownTrendSelection.onclick = null;

        }

        if (comparisonMetadata?.length && aqCombinedComparisonMetadata && dropdownCompSelection) {

            const compLegendTitles = [...new Set(aqCombinedComparisonMetadata.array('LegendTitle'))];

            if (compLegendTitles.length) {
                compMenu?.classList.remove('hide');
            }

            compLegendTitles.forEach(title => {

                const titleGroup = aqCombinedComparisonMetadata.filter(aq.escape(d => d.LegendTitle == title));

                dropdownCompSelection.innerHTML += DOMPurify.sanitize(`<span class="fs-xs"><strong>${title}</strong></span>`);

                const comparisonIDs = [...new Set(titleGroup.array('ComparisonID'))];

                comparisonIDs.forEach(comp => {

                    const compGroup = titleGroup.filter(aq.escape(d => d.ComparisonID == comp));
                    const compIndicatorLabel = [...new Set(compGroup.array('IndicatorLabel'))];
                    const compMeasurementType = [...new Set(compGroup.array('MeasurementType'))];
                    const compY_axis_title = [...new Set(compGroup.array('Y_axis_title'))];
                    const compGeoTypeName = [...new Set(compGroup.array('GeoTypeName'))];
                    const compGeography = [...new Set(compGroup.array('Geography'))];
                    const compName = [...new Set(compGroup.array('ComparisonName'))];

                    let buttonTitle;
                    let buttonLabel;

                    if (compIndicatorLabel.length === 1) {

                        if (compGeoTypeName[0] === 'Citywide') {
                            buttonTitle = compY_axis_title;
                            buttonLabel = compY_axis_title;
                        } else {
                            buttonTitle = compGeography[compGeography.length - 1];
                            buttonLabel = compGeography[compGeography.length - 1];
                        }

                    } else if (compMeasurementType.length === 1) {

                        buttonTitle = compMeasurementType;
                        buttonLabel = compMeasurementType;

                    } else {

                        buttonTitle = compName;
                        buttonLabel = compName;

                    }

                    dropdownCompSelection.innerHTML += DOMPurify.sanitize(`<button class="btn btn-primary dropdown-item comparisonbutton pl-2"
                        data-comparison-id="${comp}" title="${buttonTitle}">
                        ${buttonLabel}
                    </button>`);

                });

            });

            dropdownCompSelection.onclick = event => {

                const button = event.target.closest('.comparisonbutton');

                if (!button) {
                    return;
                }

                selectedComparison = true;
                selectedComparisonId = parseInt(button.dataset.comparisonId);
                showingComparisonTrend = true;
                showingBoroughTrend = false;

                setTrendButtonState();
                updateTrendSelectionSummary();
                showComparisonTrend();

            };

        } else if (dropdownCompSelection) {

            dropdownCompSelection.onclick = null;

        }

        if (trendSyncButton) {
            trendSyncButton.onclick = () => {

                selectedTrendMeasure = false;
                selectedComparison = false;

                syncTrendSelectionsToMapSelection(true);

                if (overlay === 'trend') {
                    showTrend();
                }

            };
        }

        syncTrendSelectionsToMapSelection(true);

    };


    buildTrendSelectionControls();


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ================================================== //

    const adjustVisibleSummaryTable = () => {
        const tablePane = document.querySelector('#v-pills-table');

        // Delayed adjusts should no-op if the user already closed or switched away from the table pane.
        if (!tablePane || overlay !== 'table' || getComputedStyle(tablePane).display === 'none') {
            return;
        }

        // On first page load the lazy table may not exist yet, so skip until it does.
        if (!$.fn.dataTable.isDataTable('#tableID')) {
            return;
        }

        $('#tableID').DataTable().columns.adjust();

        // Reapply the fixed scroll-body height after width math changes so redraws stay stable.
        if (typeof lockSummaryTableScrollBodyHeight === 'function') {
            lockSummaryTableScrollBodyHeight();
        }
    };

    const scheduleVisibleSummaryTableAdjust = () => {
        // Closing the pane hides the whole tab container, so one immediate adjust often runs too early.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                adjustVisibleSummaryTable();
            });
        });

        // Follow up once more after Bootstrap/layout changes settle on slower redraw paths.
        window.setTimeout(() => {
            adjustVisibleSummaryTable();
        }, 180);
    };

    // Refreshes the summary table layout after it becomes the active overlay.
    showTable = (e) => {

        console.log("* showTable");

        overlay = 'table';
        let didRenderTable = false;

        // Render the table on first access (lazy initialization for performance).
        // The placeholder text node in the template should not block first render.
        const tableContainer = document.getElementById('summary-table');
        if (tableData && (!tableContainer.querySelector('table') || tableNeedsRender)) {
            renderTable(tableData);
            didRenderTable = true;
        } else if (tableData && typeof renderTableFilterControls === 'function' && typeof applyTableFilters === 'function') {
            // Reopen path: keep the existing DataTable and just resync controls + hidden searches.
            renderTableFilterControls(tableData);
            applyTableFilters(tableData);
        }

        // updateChartPlotSize();

        const dataTables = $.fn.dataTable.tables(false);
        if (!didRenderTable && dataTables.length) {
            $(dataTables)
                .DataTable()
                .columns.adjust();

            // Reopen width fixes belong only to existing tables; first render sizes itself during init.
            scheduleVisibleSummaryTableAdjust();
        }

    };


    // ===== map (Leaflet — always visible) ======================== //

    // Redraws the Leaflet map (always visible on the left) with the current selection.
    showMap = () => {

        console.log("* showMap");

        // --- resolve metadata for the current MeasureID --- //

        let metadata = mapMeasures.filter(m => m.MeasureID == MeasureID);

        // Fall back to the default map measure when the current MeasureID is unavailable here.
        if (!metadata.length) metadata = defaultMapMetadata;

        // --- filter data by current globals --- //

        filteredMapData = mapData.filter(obj =>
            obj.MeasureID == MeasureID &&
            obj.TimePeriodID == TimePeriodID &&
            prettifyGeoType(obj.GeoType) == GeoType
        );

        console.log("filteredMapData:", filteredMapData.length, "rows",
            { MeasureID, GeoType, TimePeriodID });

        // --- render the Leaflet map only --- //

        return renderMap(filteredMapData, metadata);

    };


    // ===== bar chart (right overlay pane) ======================= //

    // Renders the right-side bar overlay from the filtered map rows.
    showBar = (e) => {

        console.log("* showBar");

        overlay = 'bar';

        // --- resolve metadata for the bar chart --- //

        let metadata = mapMeasures.filter(m => m.MeasureID == MeasureID);

        if (!metadata.length) metadata = defaultMapMetadata;

        // --- render the bar chart using the already-filtered map data --- //

        renderBar(filteredMapData, metadata, GeoType);

    };


    // ===== trend ================================================== //

    // Chooses between borough trend mode and comparison trend mode.
    showTrend = (e) => {

        console.log("* showTrend");

        overlay = 'trend';

        syncTrendSelectionsToMapSelection();

        // Use comparison mode when no borough trend data exists or comparison mode is already active.
        if ((trendMeasures.length === 0 && comparisonMetadata?.length) || (showingComparisonTrend && comparisonMetadata?.length)) {
            showComparisonTrend();
        } else if (trendMeasures.length > 0) {
            showBoroughTrend();
        }

        setTrendButtonState();
        updateTrendSelectionSummary();

    }

    // ----- show the normal trend chart --------------------------------------------------- //

    // Renders the standard borough trend chart for the selected measure.
    showBoroughTrend = (e) => {

        console.log("** showBoroughTrend");

        // special time-period filtering for certain air quality measures

        const measureIdsAnnualAvg = [365, 370, 375, 391];
        const measureIdsSummer = [386];

        // --- resolve measure: use global if it has trend data, else default --- //

        const trendMeasureId = getActiveTrendMeasureId();
        const trendMetadataArr = trendMeasures.filter(m => Number(m.MeasureID) === Number(trendMeasureId));
        const resolvedTrendMetadata = trendMetadataArr.length ? trendMetadataArr : defaultTrendMetadata;
        const resolvedTrendMeasureId = resolvedTrendMetadata?.[0]?.MeasureID;

        if (resolvedTrendMeasureId == null) {
            return;
        }

        selectedTrendMeasureId = Number(resolvedTrendMeasureId);
        aqSelectedTrendMetadata = aq.from(resolvedTrendMetadata)
            .derive({
                IndicatorLabel: aq.escape(indicatorName),
                ComparisonName: aq.escape('Boroughs')
            });

        selectedTrendAbout = `<p><strong>${resolvedTrendMetadata[0].MeasurementType}</strong>: ${resolvedTrendMetadata[0].how_calculated}</p>`;
        selectedTrendSources = [resolvedTrendMetadata[0].Sources];

        renderAboutSources(selectedTrendAbout, selectedTrendSources);

        // --- build Arquero metadata table --- //

        // --- filter data by resolved measure --- //

        filteredTrendData = trendData
            .filter(m => Number(m.MeasureID) === Number(resolvedTrendMeasureId));

        // --- handle special time-period subsets --- //

        // Restrict special air-quality measures to the season or annual slices they expect.
        if (measureIdsAnnualAvg.includes(resolvedTrendMeasureId)) {

            aqFilteredTrendData = aq.from(
                filteredTrendData.filter(d => d.TimePeriod.startsWith('Annual Average'))
            );

        } else if (measureIdsSummer.includes(resolvedTrendMeasureId)) {

            aqFilteredTrendData = aq.from(
                filteredTrendData.filter(d => d.TimePeriod.startsWith('Summer'))
            );

        } else {

            aqFilteredTrendData = aq.from(filteredTrendData);

        }

        // --- render --- //

        renderTrendChart(aqFilteredTrendData, aqSelectedTrendMetadata);

        updateChartPlotSize();

        showingBoroughTrend = true;
        showingComparisonTrend = false;

        setTrendButtonState();
        updateTrendSelectionSummary();

    };
    

    // ----- show the trend comparison chart --------------------------------------------------- //

    // Renders the multi-indicator comparison trend chart when comparison metadata exists.
    showComparisonTrend = (e) => {

        console.log("** showComparisonTrend");

        const comparisonId = getActiveComparisonId();

        if (comparisonId == null || !aqComparisonMetadata || !aqComparisonIndicatorData) {
            if (trendMeasures.length > 0) {
                showingComparisonTrend = false;
                showBoroughTrend();
            }

            return;
        }

        selectedComparisonId = Number(comparisonId);

        const selectedComparisonRows = aqCombinedComparisonMetadata
            .objects()
            .filter(m => Number(m.ComparisonID) === Number(comparisonId));

        selectedComparisonAbout = '';
        selectedComparisonSources = [];

        selectedComparisonRows.forEach(m => {
            selectedComparisonAbout += `<p><strong>${m.IndicatorName} - ${m.MeasurementType}:</strong> ${m.how_calculated}</p>`;
            selectedComparisonSources.push(m.Sources);
        });

        selectedComparisonSources = [...new Set(selectedComparisonSources)];

        renderAboutSources(selectedComparisonAbout, selectedComparisonSources);

        aqFilteredComparisonMetadata = aqComparisonMetadata
            .filter(aq.escape(d => d.ComparisonID == comparisonId))
            .join(aqComparisonIndicatorsMetadata, [["IndicatorID", "MeasureID"], ["IndicatorID", "MeasureID"]]);

        aqFilteredComparisonData = aqFilteredComparisonMetadata
            .select("ComparisonID", "IndicatorID", "MeasureID", "IndicatorLabel", "MeasurementType", "IndicatorMeasure", "GeoTypeName", "GeoID")
            .join(aqComparisonIndicatorData, [["IndicatorID", "MeasureID", "GeoTypeName", "GeoID"], ["IndicatorID", "MeasureID", "GeoType", "GeoID"]])
            .join(timeTable, [["TimePeriodID"], ["TimePeriodID"]])
            .orderby(aq.desc(aq.escape(d => d.IndicatorID == IndicatorID)), d => d.MeasureID);

        const hasQuarters = [858, 859, 860, 861, 862, 863];

        if (aqFilteredComparisonMetadata.array("MeasureID").some(m => hasQuarters.includes(m))) {
            aqFilteredComparisonData = aqFilteredComparisonData
                .derive({ "year": d => op.year(d.end_period) })
                .filter(d => d.year > op.max(d.year) - 3)
                .select(aq.not("TimePeriodID", "year"))
                .reify();
        }

        renderTrendChart(
            aqFilteredComparisonData,
            aqFilteredComparisonMetadata
        );

        updateChartPlotSize();

        showingBoroughTrend = false;
        showingComparisonTrend = true;

        setTrendButtonState();
        updateTrendSelectionSummary();

    }


    // ===== links ================================================== //

    // Renders the links view, or falls back to disparities when links are unavailable.
    showLinks = (e) => {

        console.log("* showLinks");

        overlay = 'links';

        // Fall back to disparities when metadata offers no linked secondary measure.
        if (linksMeasures.length === 0) {

            // no links available

            if (disparitiesMeasures.length > 0) {
                renderDisparitiesChart(defaultDisparitiesMetadata, 221);
            }

        } else {

            // has links

            // Build default linked metadata only on the first links render for this indicator.
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

    // map

    // Disable the bar tab when there is no map-compatible measure metadata.
    if (mapMeasures.length === 0) {
        disableTab(tabBar);
    } else {
        enableTab(tabBar);
    }

    // trend — disable if no trend measures (or only 1 time period) and no comparisons

    const onlyOneTime = trendMeasures.every(m => m.VisOptions[0].Trend[0]?.TimePeriodID.length <= 1);

    // Disable the trend tab when there is neither a meaningful trend nor a comparison fallback.
    if ((trendMeasures.length === 0 || onlyOneTime) && (typeof comparisonMetadata === 'undefined' || comparisonMetadata.length === 0)) {
        disableTab(tabTrends);
    } else {
        enableTab(tabTrends);
    }

    // links + disparities

    // Disable the correlate tab only when both links and disparities are unavailable.
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
        'bar':   '#v-pills-bar-tab',
        'map':   '#v-pills-bar-tab',
        'trend': '#v-pills-trends-tab',
        'links': '#v-pills-correlate-tab',
        'table': '#v-pills-table-tab'
    };

    // Re-open the tab that matches the restored overlay after menus are rebuilt.
    if (overlay !== 'none') {
        const target = tabSelector[overlay] || '#v-pills-bar-tab';
        $(target).tab('show');
    }

}

