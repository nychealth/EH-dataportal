// ======================================================================= //
// measures.js
// ======================================================================= //

// console.log(">> measures.js");

// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //


// Picks one default measure using the shared priority order used by all tabs.
const findFirstMeasureByType = (visArray, typeMatcher) => {

    return visArray.find(measure => typeMatcher(measure.MeasurementType || ''));

};

const pickDefaultMeasureByPriority = (visArray) => {

    if (!visArray.length) {
        return null;
    }

    // Keep explicit case handling so behavior matches legacy priority checks.
    const ageAdjustedRateTotal = findFirstMeasureByType(visArray, measurementType =>
        measurementType.includes('Age-adjusted rate') && measurementType.includes('Total')
    );

    if (ageAdjustedRateTotal) {
        return ageAdjustedRateTotal;
    }

    const priorityMatchers = [
        measurementType => measurementType.includes('Age-adjusted rate'),
        measurementType => measurementType.includes('rate'),
        measurementType => measurementType.includes('Rate'),
        measurementType => measurementType.includes('Percent'),
        measurementType => measurementType.includes('percent'),
        measurementType => measurementType.includes('Density')
    ];

    for (const matcher of priorityMatchers) {
        const matchedMeasure = findFirstMeasureByType(visArray, matcher);

        if (matchedMeasure) {
            return matchedMeasure;
        }
    }

    return visArray[0];

};


// Builds one-item metadata arrays used by tab defaults.
const buildDefaultMetadataArray = (visArray) => {

    const defaultMeasure = pickDefaultMeasureByPriority(visArray);

    return defaultMeasure ? [defaultMeasure] : [];

};

// ===== map ================================================== //

// Chooses the default measure for map and bar rendering.
const setDefaultMapMeasure = (visArray) => {

    console.log("* setDefaultMapMeasure");

    defaultMapMetadata = buildDefaultMetadataArray(visArray);

    // console.log(">> defaultMapMetadata", defaultMapMetadata);

}


// ===== trend ================================================== //

// Chooses the default measure for the trend tab.
const setDefaultTrendMeasure = (visArray) => {

    // console.log("* setDefaultTrendMeasure");

    defaultTrendMetadata = buildDefaultMetadataArray(visArray);

    // console.log(">> defaultTrendMetadata", defaultTrendMetadata);

}


// ===== links ================================================== //

// Chooses the default linked measure pair and fetches the joined comparison data.
const setDefaultLinksMeasure = async (visArray) => {

    console.log("* setDefaultLinksMeasure");

    const defaultArray = buildDefaultMetadataArray(visArray);

    if (!defaultArray.length) {
        return;
    }

    const defaultPrimaryMeasureId = defaultArray[0].MeasureID;
    const defaultSecondaryMeasureId = defaultArray[0].VisOptions[0].Links[0].Measures[0]?.MeasureID;

    // assigning to global object
    defaultPrimaryLinksMeasureMetadata = defaultArray;

    // using await here because createJoinedLinksData calls fetch, and we need that data
    const defaultLinksDataMetadata = await createJoinedLinksData(defaultPrimaryMeasureId, defaultSecondaryMeasureId)

    // extract secondary metadata from data function return, assign to global object
    defaultSecondaryMeasureMetadata = defaultLinksDataMetadata.secondaryMeasureMetadata;
    
    // extract data element from data function return, assign to global object
    joinedLinksDataObjects = defaultLinksDataMetadata.data
}



// ===== disparities ================================================== //

// Chooses the default measure for the disparities tab.
const setDefaultDisparitiesMeasure = (visArray) => {

    console.log("* setDefaultDisparitiesMeasure");

    defaultDisparitiesMetadata = buildDefaultMetadataArray(visArray);

    // console.log(">> defaultDisparitiesMetadata", defaultDisparitiesMetadata);
    
}


// ----------------------------------------------------------------------- //
// links / disparities metadata helpers
// ----------------------------------------------------------------------- //

// Returns metadata for one measure on the active indicator.
const getMeasureMetadataById = (measureId) => {

    if (!indicatorMeasures?.length || measureId == null) {
        return [];
    }

    return indicatorMeasures.filter(measure => Number(measure.MeasureID) === Number(measureId));

};


// Whether the active indicator exposes correlate links for a measure.
const measureSupportsLinks = (measureId) => {
    return linksMeasures.some(measure => Number(measure.MeasureID) === Number(measureId));
};


// Whether the active indicator exposes disparities for a measure.
const measureSupportsDisparities = (measureId) => {
    return disparitiesMeasures.some(measure => Number(measure.MeasureID) === Number(measureId));
};


// Finds the first linked secondary measure configured for one primary measure.
const getDefaultLinksSecondaryMeasureId = (primaryMeasureId) => {

    const primaryMeasureMetadata = getMeasureMetadataById(primaryMeasureId)[0];
    const defaultSecondaryMeasureId = primaryMeasureMetadata?.VisOptions?.[0]?.Links?.[0]?.Measures?.[0]?.MeasureID;

    return defaultSecondaryMeasureId != null ? Number(defaultSecondaryMeasureId) : null;

};


// Falls back to the active default correlate measure when map MeasureID is not link-capable.
const getDefaultLinksPrimaryMeasureId = () => {

    const defaultPrimaryMeasureId = defaultPrimaryLinksMeasureMetadata?.[0]?.MeasureID;

    if (defaultPrimaryMeasureId != null) {
        return Number(defaultPrimaryMeasureId);
    }

    return linksMeasures[0] ? Number(linksMeasures[0].MeasureID) : null;

};


// Falls back to the active default disparities measure when map MeasureID is not disparities-capable.
const getDefaultDisparitiesPrimaryMeasureId = () => {

    const defaultPrimaryMeasureId = defaultDisparitiesMetadata?.[0]?.MeasureID;

    if (defaultPrimaryMeasureId != null) {
        return Number(defaultPrimaryMeasureId);
    }

    return disparitiesMeasures[0] ? Number(disparitiesMeasures[0].MeasureID) : null;

};


// Validates that the selected primary measure can link to the selected secondary measure.
const primaryLinksToSecondary = (primaryMeasureId, secondaryMeasureId) => {

    const primaryMeasureMetadata = getMeasureMetadataById(primaryMeasureId)[0];

    return primaryMeasureMetadata?.VisOptions?.[0]?.Links?.[0]?.Measures?.some(link =>
        Number(link.MeasureID) === Number(secondaryMeasureId)
    ) || false;

};


// Finds the indicator record that owns one secondary linked measure.
const getSecondaryMeasureIndicator = (secondaryMeasureId) => {

    if (!indicators?.length || secondaryMeasureId == null) {
        return [];
    }

    return indicators.filter(indicator =>
        indicator.Measures.some(measure => Number(measure.MeasureID) === Number(secondaryMeasureId))
    );

};


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

    if (!btnToggleDisparities) {
        return;
    }

    $(btnToggleDisparities).off('.toggle');

    $(btnToggleDisparities).on('click.toggle', event => {

        const button = event.target.closest('button');

        if (!button || button.classList.contains('active') || button.classList.contains('disabled')) {
            return;
        }

        if (button.matches('#show-disparities')) {

            if (!disparitiesMeasures.length) {
                return;
            }

            const activePrimaryMeasureId = selectedLinksPrimaryMeasureId == null
                ? Number(MeasureID)
                : Number(selectedLinksPrimaryMeasureId);

            const nextPrimaryMeasureId = measureSupportsDisparities(activePrimaryMeasureId)
                ? activePrimaryMeasureId
                : getDefaultDisparitiesPrimaryMeasureId();

            if (nextPrimaryMeasureId == null) {
                return;
            }

            selectedLinksMeasure = true;
            selectedDisparity = true;
            selectedLinksPrimaryMeasureId = nextPrimaryMeasureId;
            selectedLinksSecondaryMeasureId = 221;

            showLinks();
            return;

        }

        if (!button.matches('#show-links, #dropdownLinksMeasures') || !linksMeasures.length) {
            return;
        }

        const activePrimaryMeasureId = selectedLinksPrimaryMeasureId == null
            ? Number(MeasureID)
            : Number(selectedLinksPrimaryMeasureId);

        const nextPrimaryMeasureId = measureSupportsLinks(activePrimaryMeasureId)
            ? activePrimaryMeasureId
            : getDefaultLinksPrimaryMeasureId();

        const nextSecondaryMeasureId = getDefaultLinksSecondaryMeasureId(nextPrimaryMeasureId);

        if (nextPrimaryMeasureId == null || nextSecondaryMeasureId == null) {
            return;
        }

        selectedLinksMeasure = true;
        selectedDisparity = false;
        selectedLinksPrimaryMeasureId = nextPrimaryMeasureId;
        selectedLinksSecondaryMeasureId = nextSecondaryMeasureId;

        showLinks();

    });

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

    const disparitiesSecondaryMeasure = indicators
        .flatMap(indicator => indicator.Measures)
        .find(measure => measure.MeasureID === 221);

    // Sort each measure into the tabs where its metadata says data exists.
    indicatorMeasures.forEach(measure => {

        // check which viz types exist for this measure

        const map         = aqMapTimesGeos   && aqMapTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const trend       = aqTrendTimesGeos && aqTrendTimesGeos.filter(`d => d.MeasureID === ${measure.MeasureID}`).numRows() > 0;
        const links       = measure.VisOptions[0].Links && measure.VisOptions[0].Links[0].Measures[0]?.MeasureID;
        // Disparities == 1 in metadata signals this measure supports the disparities chart
        const disparities = measure.VisOptions[0].Links[0].Disparities == 1
            && getSharedLinksGeos(measure, disparitiesSecondaryMeasure).length > 0;

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

    const trendMeasurePills = document.getElementById('trendMeasurePills');
    const trendComparisonPills = document.getElementById('trendComparisonPills');
    let selectedComparisonLegendTitle = null;

    // Normalizes active and disabled styles so the new visible pills stay in sync.
    const setBadgePillState = (button, isActive, isDisabled = false) => {

        if (!button) {
            return;
        }

        button.classList.toggle('active', isActive && !isDisabled);
        button.classList.remove('badge-primary', 'badge-light', 'text-white');
        button.classList.add(isActive && !isDisabled ? 'badge-primary' : 'badge-light');
        button.classList.toggle('text-white', isActive && !isDisabled);
        button.classList.toggle('disabled', isDisabled);
        button.disabled = isDisabled;
        button.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
        button.setAttribute('aria-pressed', isActive && !isDisabled ? 'true' : 'false');
        button.setAttribute('aria-selected', isActive && !isDisabled ? 'true' : 'false');

    };


    const createBadgePillButton = ({
        buttonClass,
        label,
        title,
        dataAttributes = {}
    }) => {

        const button = document.createElement('button');

        button.type = 'button';
        button.className = `badge badge-pill badge-light border-0 de-viz-pill-button ${buttonClass}`;
        button.textContent = label;

        if (title) {
            button.title = title;
        }

        Object.entries(dataAttributes).forEach(([key, value]) => {
            button.dataset[key] = value;
        });

        return button;

    };


    const createBadgePillLabel = (label) => {

        const span = document.createElement('span');

        span.className = 'de-viz-pill-label';
        span.textContent = label;

        return span;

    };


    const createDropdownIdFragment = (label) => {

        const nextIdFragment = String(label || 'option')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        return nextIdFragment || 'option';

    };


    const createBadgePillDropdown = ({
        buttonClass,
        label,
        menuId
    }) => {

        const dropdown = document.createElement('div');
        const button = document.createElement('button');
        const icon = document.createElement('i');
        const labelSpan = document.createElement('span');
        const menu = document.createElement('div');

        dropdown.className = 'dropdown d-inline-block';

        button.type = 'button';
        button.id = `${menuId}Toggle`;
        button.className = `badge badge-pill badge-light border-0 de-viz-pill-button ${buttonClass}`;
        button.dataset.baseLabel = label;
        button.setAttribute('data-toggle', 'dropdown');
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');

        icon.className = 'fas fa-chevron-circle-down mr-1';
        icon.setAttribute('aria-hidden', 'true');

        labelSpan.className = 'de-viz-pill-toggle-label';
        labelSpan.textContent = label;

        button.append(icon, labelSpan);

        menu.id = menuId;
        menu.className = 'dropdown-menu dropdown-menu-right fs-sm de-viz-pill-menu';
        menu.setAttribute('aria-labelledby', button.id);

        dropdown.append(button, menu);

        return {
            dropdown,
            button,
            menu
        };

    };


    const setDropdownMenuItemState = (button, isActive) => {

        if (!button) {
            return;
        }

        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');

    };
    // Mirrors map measure when possible, otherwise falls back to trend defaults.
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


    // Picks comparison that best matches current indicator and active measure.
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


    // Resolves one comparison button back to the comparison rows it owns.
    const getComparisonRowsForLegendTitle = (legendTitle) => {

        if (!legendTitle || !aqCombinedComparisonMetadata) {
            return [];
        }

        return aqCombinedComparisonMetadata
            .objects()
            .filter(row => row.LegendTitle === legendTitle);

    };


    // Keeps comparison buttons synced to the current MBT measure when possible.
    const getComparisonIdForLegendTitle = (legendTitle) => {

        const comparisonRows = getComparisonRowsForLegendTitle(legendTitle);

        if (!comparisonRows.length) {
            return null;
        }

        const matchingMeasureRow = comparisonRows.find(row =>
            Number(row.IndicatorID) === Number(IndicatorID) &&
            Number(row.MeasureID) === Number(MeasureID)
        );

        if (matchingMeasureRow) {
            return Number(matchingMeasureRow.ComparisonID);
        }

        const matchingIndicatorRow = comparisonRows.find(row =>
            Number(row.IndicatorID) === Number(IndicatorID)
        );

        if (matchingIndicatorRow) {
            return Number(matchingIndicatorRow.ComparisonID);
        }

        return Number(comparisonRows[0].ComparisonID);

    };


    const getComparisonLegendTitleById = (comparisonId) => {

        if (comparisonId == null || !aqCombinedComparisonMetadata) {
            return null;
        }

        return aqCombinedComparisonMetadata
            .objects()
            .find(row => Number(row.ComparisonID) === Number(comparisonId))
            ?.LegendTitle || null;

    };


    const getActiveTrendMeasureId = () => {

        return getSyncedTrendMeasureId();

    };


    const getActiveTrendMeasureLabel = () => {

        const trendMeasure = trendMeasures.find(m => Number(m.MeasureID) === Number(getActiveTrendMeasureId()));

        return trendMeasure?.MeasurementType || 'No borough trend';

    };


    const getActiveComparisonId = () => {

        if (selectedComparisonLegendTitle) {

            const comparisonIdForLegendTitle = getComparisonIdForLegendTitle(selectedComparisonLegendTitle);

            if (comparisonIdForLegendTitle != null) {
                return comparisonIdForLegendTitle;
            }

            selectedComparisonLegendTitle = null;

        }

        return getSyncedComparisonId();

    };


    const getActiveComparisonLegendTitle = () => {

        if (selectedComparisonLegendTitle) {
            return selectedComparisonLegendTitle;
        }

        return getComparisonLegendTitleById(getActiveComparisonId()) || 'Comparison';

    };


    // Clears active styling before one trend or comparison button is reselected.
    const clearTrendButtonState = () => {

        trendMeasurePills?.querySelectorAll('.trendmode-button').forEach(button => {
            setBadgePillState(button, false);
        });

        trendComparisonPills?.querySelectorAll('.trendmode-button').forEach(button => {
            setBadgePillState(button, false);
        });

    };


    // Highlights whichever control currently owns trend rendering state.
    const setTrendButtonState = () => {

        clearTrendButtonState();

        const useComparisonState = (showingComparisonTrend && comparisonMetadata?.length) ||
            (!trendMeasures.length && comparisonMetadata?.length);

        if (useComparisonState) {

            const activeLegendTitle = getActiveComparisonLegendTitle();
            const comparisonButton = Array.from(trendComparisonPills?.querySelectorAll('.trendmode-button') || [])
                .find(button => button.dataset.legendTitle === activeLegendTitle);

            if (comparisonButton) {
                setBadgePillState(comparisonButton, true);
            }

            return;

        }

        const trendButton = trendMeasurePills?.querySelector('.trendmode-button[data-trend-mode="geography"]');

        if (trendButton) {
            setBadgePillState(trendButton, true);
        }

    };


    // Rebuilds compact summary line from current trend/comparison selection state.
    const updateTrendSelectionSummary = () => {

        const trendLabel = getActiveTrendMeasureLabel();
        const comparisonLabel = comparisonMetadata?.length ? getActiveComparisonLegendTitle() : 'No comparison';
        const useComparisonState = (showingComparisonTrend && comparisonMetadata?.length) ||
            (!trendMeasures.length && comparisonMetadata?.length);

        const geographyButton = trendMeasurePills?.querySelector('.trendmode-button[data-trend-mode="geography"]');

        if (geographyButton) {
            geographyButton.title = `Geography. Current selection: ${trendLabel}.`;
            geographyButton.setAttribute('aria-label', `Geography trend button. Current selection: ${trendLabel}.`);
        }

        trendComparisonPills?.querySelectorAll('.trendmode-button').forEach(button => {

            const legendTitle = button.dataset.legendTitle || button.textContent.trim() || 'Comparison';
            const isActive = legendTitle === comparisonLabel && useComparisonState;

            button.title = `${legendTitle}.`;
            button.setAttribute(
                'aria-label',
                isActive
                    ? `${legendTitle} comparison button. Current selection.`
                    : `${legendTitle} comparison button.`
            );

        });

    };


    // Rebuilds visible trend measure and comparison pills for current indicator context.
    const buildTrendSelectionControls = () => {

        if (trendMeasurePills) {
            trendMeasurePills.innerHTML = '';
            trendMeasurePills.hidden = trendMeasures.length === 0;
        }

        if (trendComparisonPills) {
            trendComparisonPills.innerHTML = '';
            trendComparisonPills.hidden = true;
        }

        if (trendMeasures.length > 0 && trendMeasurePills) {

            const geographyButton = createBadgePillButton({
                buttonClass: 'trendmode-button',
                label: 'Geography',
                title: 'Geography'
            });

            geographyButton.dataset.trendMode = 'geography';

            geographyButton.addEventListener('click', () => {

                showingComparisonTrend = false;
                showingBoroughTrend = true;

                setTrendButtonState();
                updateTrendSelectionSummary();
                showBoroughTrend();

            });

            trendMeasurePills.appendChild(geographyButton);

        } else if (trendMeasurePills) {

            trendMeasurePills.onclick = null;

        }

        if (comparisonMetadata?.length && aqCombinedComparisonMetadata && trendComparisonPills) {

            const compLegendTitles = [...new Set(aqCombinedComparisonMetadata.array('LegendTitle'))];
            let comparisonButtonCount = 0;

            if (selectedComparisonLegendTitle && !compLegendTitles.includes(selectedComparisonLegendTitle)) {
                selectedComparisonLegendTitle = null;
            }

            compLegendTitles.forEach(title => {

                const comparisonId = getComparisonIdForLegendTitle(title);

                if (comparisonId == null) {
                    return;
                }

                const comparisonButton = createBadgePillButton({
                    buttonClass: 'trendmode-button',
                    label: title,
                    title
                });

                comparisonButton.dataset.legendTitle = title;

                comparisonButton.addEventListener('click', () => {

                    selectedComparisonLegendTitle = title;
                    showingComparisonTrend = true;
                    showingBoroughTrend = false;

                    setTrendButtonState();
                    updateTrendSelectionSummary();
                    showComparisonTrend();

                });

                trendComparisonPills.appendChild(comparisonButton);
                comparisonButtonCount += 1;

            });

            trendComparisonPills.hidden = comparisonButtonCount === 0;

        } else if (trendComparisonPills) {

            trendComparisonPills.onclick = null;
            selectedComparisonLegendTitle = null;

        }

        setTrendButtonState();
        updateTrendSelectionSummary();

    };


    buildTrendSelectionControls();


    // ===== correlate / disparities selection controls ======================== //

    const dropdownLinksMeasures = document.getElementById('linksDropdownMenu');
    const linksDropdownToggle = document.getElementById('dropdownLinksMeasures');
    const linksToggleLabel = document.getElementById('linksToggleLabel');
    const linksSyncButton = document.getElementById('linksSyncButton');
    const showDisparitiesButton = document.getElementById('show-disparities');

    const getLinksOptionCount = () => {

        return linksMeasures.reduce((count, measure) => {
            return count + (measure?.VisOptions?.[0]?.Links?.[0]?.Measures?.length || 0);
        }, 0);

    };


    const updateLinksDropdownToggle = () => {

        if (!linksDropdownToggle || !linksToggleLabel) {
            return;
        }

        const activeLinksState = getActiveLinksState();
        const linksOptionCount = getLinksOptionCount();
        const hasMultipleLinksOptions = linksOptionCount > 1;
        const activeSecondaryLabel = activeLinksState.secondaryMeasureId == null
            ? 'Show with'
            : getLinksButtonLabel(activeLinksState.secondaryMeasureId);

        linksToggleLabel.textContent = hasMultipleLinksOptions ? 'Measures' : activeSecondaryLabel;

        if (hasMultipleLinksOptions) {
            linksDropdownToggle.setAttribute('data-toggle', 'dropdown');
            linksDropdownToggle.setAttribute('aria-haspopup', 'true');
        } else {
            linksDropdownToggle.removeAttribute('data-toggle');
        }

    };

    const getLinksButtonLabel = (secondaryMeasureId) => {

        const secondaryIndicator = getSecondaryMeasureIndicator(secondaryMeasureId);
        const secondaryMetadata = secondaryIndicator[0]?.Measures?.filter(measure =>
            Number(measure.MeasureID) === Number(secondaryMeasureId)
        );

        return secondaryMetadata?.[0]?.MeasureName || secondaryIndicator[0]?.IndicatorName || 'Linked measure';

    };


    const getSyncedLinksState = () => {

        if (measureSupportsLinks(MeasureID)) {
            const syncedPrimaryMeasureId = Number(MeasureID);

            return {
                primaryMeasureId: syncedPrimaryMeasureId,
                secondaryMeasureId: getDefaultLinksSecondaryMeasureId(syncedPrimaryMeasureId),
                view: 'links'
            };
        }

        if (measureSupportsDisparities(MeasureID)) {
            return {
                primaryMeasureId: Number(MeasureID),
                secondaryMeasureId: 221,
                view: 'disparities'
            };
        }

        if (linksMeasures.length) {
            const defaultPrimaryMeasureId = getDefaultLinksPrimaryMeasureId();

            return {
                primaryMeasureId: defaultPrimaryMeasureId,
                secondaryMeasureId: getDefaultLinksSecondaryMeasureId(defaultPrimaryMeasureId),
                view: 'links'
            };
        }

        if (disparitiesMeasures.length) {
            return {
                primaryMeasureId: getDefaultDisparitiesPrimaryMeasureId(),
                secondaryMeasureId: 221,
                view: 'disparities'
            };
        }

        return {
            primaryMeasureId: null,
            secondaryMeasureId: null,
            view: 'links'
        };

    };


    const getActiveLinksState = () => {

        const manualPrimaryMeasureId = selectedLinksPrimaryMeasureId == null ? null : Number(selectedLinksPrimaryMeasureId);
        const manualSecondaryMeasureId = selectedLinksSecondaryMeasureId == null ? null : Number(selectedLinksSecondaryMeasureId);

        const hasManualDisparities = selectedLinksMeasure
            && selectedDisparity
            && manualPrimaryMeasureId != null
            && measureSupportsDisparities(manualPrimaryMeasureId);

        if (hasManualDisparities) {
            return {
                primaryMeasureId: manualPrimaryMeasureId,
                secondaryMeasureId: 221,
                view: 'disparities'
            };
        }

        const hasManualLinks = selectedLinksMeasure
            && !selectedDisparity
            && manualPrimaryMeasureId != null
            && manualSecondaryMeasureId != null
            && measureSupportsLinks(manualPrimaryMeasureId)
            && primaryLinksToSecondary(manualPrimaryMeasureId, manualSecondaryMeasureId);

        if (hasManualLinks) {
            return {
                primaryMeasureId: manualPrimaryMeasureId,
                secondaryMeasureId: manualSecondaryMeasureId,
                view: 'links'
            };
        }

        return getSyncedLinksState();

    };


    const setLinksButtonState = () => {

        const activeLinksState = getActiveLinksState();

        document.querySelectorAll('.linksbutton').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

        if (activeLinksState.view === 'links') {
            const activeLinksButton = document.querySelector(`.linksbutton[data-primary-measure-id='${activeLinksState.primaryMeasureId}'][data-secondary-measure-id='${activeLinksState.secondaryMeasureId}']`);

            if (activeLinksButton) {
                activeLinksButton.classList.add('active');
                activeLinksButton.setAttribute('aria-selected', 'true');
            }
        }

        setBadgePillState(
            linksDropdownToggle,
            activeLinksState.view === 'links' && linksMeasures.length > 0,
            linksMeasures.length === 0
        );

        if (showDisparitiesButton) {
            setBadgePillState(
                showDisparitiesButton,
                activeLinksState.view === 'disparities' && disparitiesMeasures.length > 0,
                disparitiesMeasures.length === 0
            );
        }

        updateLinksDropdownToggle();

    };


    const updateLinksSelectionSummary = () => {

        const activeLinksState = getActiveLinksState();
        const primaryMeasure = getMeasureMetadataById(activeLinksState.primaryMeasureId)[0];
        const primaryLabel = primaryMeasure?.MeasurementType || 'No measure';
        const syncState = selectedLinksMeasure ? 'Custom' : 'Synced';

        if (activeLinksState.view === 'disparities') {
            if (linksSyncButton) {
                linksSyncButton.title = `Measure: ${primaryLabel} | Disparities | ${syncState}`;
                linksSyncButton.setAttribute('aria-label', `Sync correlate selections to map. Current selection: ${primaryLabel}; Disparities; ${syncState}.`);
            }

            updateLinksDropdownToggle();
            return;
        }

        const secondaryLabel = getLinksButtonLabel(activeLinksState.secondaryMeasureId);

        if (linksSyncButton) {
            linksSyncButton.title = `Measure: ${primaryLabel} | With: ${secondaryLabel} | ${syncState}`;
            linksSyncButton.setAttribute('aria-label', `Sync correlate selections to map. Current selection: ${primaryLabel}; ${secondaryLabel}; ${syncState}.`);
        }

        updateLinksDropdownToggle();

    };


    syncLinksSelectionsToMapSelection = (force = false) => {

        let didChange = false;
        const syncedLinksState = getSyncedLinksState();

        if (force || !selectedLinksMeasure) {
            if (selectedLinksPrimaryMeasureId !== syncedLinksState.primaryMeasureId) {
                selectedLinksPrimaryMeasureId = syncedLinksState.primaryMeasureId;
                didChange = true;
            }

            if (selectedLinksSecondaryMeasureId !== syncedLinksState.secondaryMeasureId) {
                selectedLinksSecondaryMeasureId = syncedLinksState.secondaryMeasureId;
                didChange = true;
            }

            const nextDisparityState = syncedLinksState.view === 'disparities';

            if (selectedDisparity !== nextDisparityState) {
                selectedDisparity = nextDisparityState;
                didChange = true;
            }

            selectedLinksMeasure = false;
        }

        setLinksButtonState();
        updateLinksSelectionSummary();

        return didChange;

    };


    const buildLinksSelectionControls = () => {

        if (dropdownLinksMeasures) {
            dropdownLinksMeasures.innerHTML = '';
        }

        if (linksMeasures.length > 0 && dropdownLinksMeasures) {

            linksMeasures.forEach(measure => {

                const heading = document.createElement('h6');

                heading.className = 'dropdown-header';
                heading.textContent = measure.MeasurementType;

                dropdownLinksMeasures.appendChild(heading);

                measure?.VisOptions?.[0]?.Links?.[0]?.Measures?.forEach(link => {

                    const secondaryLabel = getLinksButtonLabel(link.MeasureID);

                    const button = document.createElement('button');

                    button.type = 'button';
                    button.className = 'dropdown-item linksbutton';
                    button.dataset.primaryMeasureId = String(measure.MeasureID);
                    button.dataset.secondaryMeasureId = String(link.MeasureID);
                    button.title = secondaryLabel;
                    button.textContent = secondaryLabel;

                    dropdownLinksMeasures.appendChild(button);

                });

            });

            dropdownLinksMeasures.onclick = event => {

                const button = event.target.closest('.linksbutton');

                if (!button) {
                    return;
                }

                selectedLinksMeasure = true;
                selectedDisparity = false;
                selectedLinksPrimaryMeasureId = parseInt(button.dataset.primaryMeasureId, 10);
                selectedLinksSecondaryMeasureId = parseInt(button.dataset.secondaryMeasureId, 10);

                showLinks();

            };

        } else if (dropdownLinksMeasures) {

            dropdownLinksMeasures.onclick = null;

        }

        if (linksSyncButton) {
            linksSyncButton.onclick = () => {

                selectedLinksMeasure = false;

                syncLinksSelectionsToMapSelection(true);

                if (overlay === 'links') {
                    showLinks();
                }

            };
        }

        clickLinksToggle();
        syncLinksSelectionsToMapSelection(true);

    };


    const renderSelectedCorrelate = async (primaryMeasureId, secondaryMeasureId) => {

        if (primaryMeasureId == null || secondaryMeasureId == null) {
            return false;
        }

        const canReuseCurrentSelection = Array.isArray(joinedLinksDataObjects)
            && joinedLinksDataObjects.length > 0
            && Number(selectedPrimaryMeasureMetadata?.[0]?.MeasureID) === Number(primaryMeasureId)
            && Number(selectedSecondaryMeasureMetadata?.[0]?.MeasureID) === Number(secondaryMeasureId);

        if (!canReuseCurrentSelection) {

            const selectedLinksDataMetadata = await createJoinedLinksData(primaryMeasureId, secondaryMeasureId);

            if (!selectedLinksDataMetadata?.data?.length) {
                return false;
            }

            selectedPrimaryMeasureMetadata = selectedLinksDataMetadata.primaryMeasureMetadata;
            selectedSecondaryMeasureMetadata = selectedLinksDataMetadata.secondaryMeasureMetadata;
            joinedLinksDataObjects = selectedLinksDataMetadata.data;

        }

        const linksSecondaryIndicator = getSecondaryMeasureIndicator(secondaryMeasureId);

        if (!selectedPrimaryMeasureMetadata?.length || !selectedSecondaryMeasureMetadata?.length || !linksSecondaryIndicator.length) {
            return false;
        }

        primaryIndicatorName = indicatorName;
        secondaryIndicatorName = linksSecondaryIndicator[0]?.IndicatorName;

        const primaryMeasurementType = selectedPrimaryMeasureMetadata[0]?.MeasurementType;
        const secondaryMeasurementType = selectedSecondaryMeasureMetadata[0]?.MeasurementType;
        const primaryAbout = selectedPrimaryMeasureMetadata[0]?.how_calculated;
        const secondaryAbout = selectedSecondaryMeasureMetadata[0]?.how_calculated;
        const primarySources = selectedPrimaryMeasureMetadata[0]?.Sources;
        const secondarySources = selectedSecondaryMeasureMetadata[0]?.Sources;

        selectedLinksAbout =
            `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primaryAbout}</p>
            <p><strong>${secondaryIndicatorName} - ${secondaryMeasurementType}</strong>: ${secondaryAbout}</p>`;

        selectedLinksSources =
            `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primarySources}</p>
            <p><strong>${secondaryIndicatorName} - ${secondaryMeasurementType}</strong>: ${secondarySources}</p>`;

        renderAboutSources(selectedLinksAbout, selectedLinksSources);

        renderCorrelate(
            joinedLinksDataObjects,
            selectedPrimaryMeasureMetadata,
            selectedSecondaryMeasureMetadata,
            primaryIndicatorName,
            secondaryIndicatorName
        );

        return true;

    };


    const renderSelectedDisparities = async (primaryMeasureId) => {

        const primaryMeasureMetadata = getMeasureMetadataById(primaryMeasureId);

        if (!primaryMeasureMetadata.length) {
            return false;
        }

        selectedPrimaryMeasureMetadata = primaryMeasureMetadata;

        await renderDisparitiesChart(primaryMeasureMetadata, 221);

        return true;

    };


    buildLinksSelectionControls();


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
        if (didRenderTable && dataTables.length) {
            // First-open path still initializes while pane is hidden, so headers need one
            // follow-up width pass after Bootstrap finishes showing the panel.
            scheduleVisibleSummaryTableAdjust();
        } else if (!didRenderTable && dataTables.length) {
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

        showingBoroughTrend = false;
        showingComparisonTrend = true;

        setTrendButtonState();
        updateTrendSelectionSummary();

    }


    // ===== links ================================================== //

    // Renders the links view, or falls back to disparities when links are unavailable.
    showLinks = async (e) => {

        console.log("* showLinks");

        overlay = 'links';

        syncLinksSelectionsToMapSelection();

        const activeLinksState = getActiveLinksState();
        let didRender = false;

        if (activeLinksState.view === 'disparities' && disparitiesMeasures.length > 0) {
            didRender = await renderSelectedDisparities(activeLinksState.primaryMeasureId);
        }

        if (!didRender && linksMeasures.length > 0) {
            didRender = await renderSelectedCorrelate(activeLinksState.primaryMeasureId, activeLinksState.secondaryMeasureId);
        }

        if (!didRender && disparitiesMeasures.length > 0) {

            const fallbackPrimaryMeasureId = measureSupportsDisparities(activeLinksState.primaryMeasureId)
                ? activeLinksState.primaryMeasureId
                : getDefaultDisparitiesPrimaryMeasureId();

            if (fallbackPrimaryMeasureId != null) {
                selectedDisparity = true;
                selectedLinksPrimaryMeasureId = fallbackPrimaryMeasureId;
                selectedLinksSecondaryMeasureId = 221;

                didRender = await renderSelectedDisparities(fallbackPrimaryMeasureId);
            }
        }

        setLinksButtonState();
        updateLinksSelectionSummary();

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

    const tabContent = document.querySelector('#v-pills-tabContent');
    const tabLinks = document.querySelectorAll('#v-pills-tab .nav-link[data-toggle="pill"]');
    const tabPanes = document.querySelectorAll('#v-pills-tabContent > .tab-pane');

    const resetOverlayTabState = () => {

        tabLinks.forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        });

        tabPanes.forEach(pane => {
            pane.classList.remove('show', 'active');
        });

    };

    // Re-open the tab that matches the restored overlay after menus are rebuilt.
    if (overlay !== 'none') {
        resetOverlayTabState();

        if (tabContent) {
            tabContent.style.display = 'block';
        }

        const target = tabSelector[overlay] || '#v-pills-bar-tab';
        $(target).tab('show');
    } else {
        resetOverlayTabState();

        if (tabContent) {
            tabContent.style.display = 'none';
        }
    }

}

