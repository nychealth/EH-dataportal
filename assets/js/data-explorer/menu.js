// ======================================================================= //
// menu.js
// ======================================================================= //

// console.log(">> menu.js");

// Dropdown-menu defaults, cascading menu rebuilds, and selection handling

// ----------------------------------------------------------------------- //
// helpers
// ----------------------------------------------------------------------- //

// Selects the indicator's default measure via the shared priority order
// (pickDefaultMeasureByPriority in measures.js), so the dropdown highlight matches the measure
// the map/trend tabs render by default. menu.js passes all Measures; the per-tab defaults pass
// their filtered subsets — but the ranking rules are now a single source of truth.
const getDefaultMeasure = (indicator) => pickDefaultMeasureByPriority(indicator.Measures);


// Converts a TimePeriodID into its display label for dropdown text.
const getTimeLabel = (id) => {
    return DE.lookups.timeLookup[id]?.TimePeriod || id;
};


// Updates every cloned dropdown trigger for the given menu type.
const setDropdownLabel = (type, value) => {

    let cls = type + '-name';  // measure-name, geo-name, time-name

    document.querySelectorAll(`.${cls}`).forEach(span => {
        span.textContent = value;
    });
}


// ----------------------------------------------------------------------- //
// menu initialization
// ----------------------------------------------------------------------- //

// Ensures one valid measure is selected before any menu rendering begins.
const renderMenus = async (indicatorID) => {

    debugLog('* renderMenus');

    await ensureIndicatorsLoaded('rendering menus');

    const indicator = indicators.find(d => d.IndicatorID === Number(indicatorID));

    if (!indicator || !indicator.Measures?.length) {
        console.warn('renderMenus: no indicator or measures found for', indicatorID);
        return;
    }

    const selectedMeasure = indicator.Measures.find(m => m.MeasureID === DE.state.MeasureID);

    // Fall back to the preferred default when the URL or globals point to an invalid measure.
    if (!DE.state.MeasureID || !selectedMeasure) {
        const defaultMeasure = getDefaultMeasure(indicator);
        DE.state.MeasureID = defaultMeasure.MeasureID;
    }

    updateAllMenus(indicator);
};


// ----------------------------------------------------------------------- //
// full menu rebuild
// ----------------------------------------------------------------------- //

// Rebuilds all dependent menus from current globals after one selection changes.
const updateAllMenus = (indicator) => {

    debugLog('* updateAllMenus');
    debugLog('Globals:', { MeasureID: DE.state.MeasureID, GeoType: DE.state.GeoType, TimePeriodID: DE.state.TimePeriodID });

    if (!indicator || !indicator.Measures?.length) {
        console.warn('updateAllMenus: no indicator or measures available');
        return;
    }

    // ----- resolve current measure, falling back to default if stale/invalid ----- //

    let measure = indicator.Measures.find(m => m.MeasureID === DE.state.MeasureID);

    if (!measure) {
        // Recover from stale globals or URL params by snapping back to the default measure.
        measure = getDefaultMeasure(indicator);
        DE.state.MeasureID = measure.MeasureID;
    }

    // ----- rebuild measures menu ----- //

    const measures = indicator.Measures.map(m => ({
        label: m.MeasurementType,
        value: m.MeasureID
    }));

    renderMenuSection(measures, '.measures-holder', 'measure');

    setDropdownLabel('measure', measure.MeasurementType);

    // ----- rebuild geo menu, defaulting to finest available geography ----- //

    // Prettify and deduplicate geo types (e.g., NTA2010 + NTA2020 → one "NTA" entry)

    const seenGeos = new Set();
    const geos = [];

    // Collapse versioned backend geotypes into one prettified dropdown option per geography.
    measure.VisOptions[0].Map.forEach(d => {
        const pretty = prettifyGeoType(d.GeoType);
        if (!seenGeos.has(pretty)) {
            seenGeos.add(pretty);
            geos.push({ label: pretty, value: pretty });
        }
    });

    const availableGeoValues = geos.map(g => g.value);

    // default to the finest available geography when the current one is missing or invalid
    if (!DE.state.GeoType || !availableGeoValues.includes(DE.state.GeoType)) {

        // Favor the most detailed geography so the map opens at the richest available level.
        DE.state.GeoType = availableGeoValues.reduce((best, current) => {
            return assignGeoRank(current) > assignGeoRank(best) ? current : best;
        });
    }

    renderMenuSection(geos, '.geo-holder', 'geo');

    setDropdownLabel('geo', DE.state.GeoType);

    // ----- rebuild time menu, defaulting to most recent period ----- //

    // Find the metadata entry whose raw GeoType prettifies to our selected GeoType

    const geoObj = measure.VisOptions[0].Map.find(d => prettifyGeoType(d.GeoType) === DE.state.GeoType);

    // Look up labels and sort by end_period descending (most recent first)

    const times = (geoObj?.TimePeriodID || [])
        .map(id => {
            const tp = DE.lookups.timeLookup[id];
            return {
                label: tp?.TimePeriod || id,
                value: id,
                endPeriod: tp?.end_period || ''
            };
        })
        .sort((a, b) => b.endPeriod - a.endPeriod);

    // default to the most recent available time period when the current one is invalid
    if (!DE.state.TimePeriodID || !times.find(t => t.value === DE.state.TimePeriodID)) {
        DE.state.TimePeriodID = times.length ? times[0].value : null;
    }

    renderMenuSection(times, '.time-holder', 'time');

    setDropdownLabel('time', getTimeLabel(DE.state.TimePeriodID));
};


// ----------------------------------------------------------------------- //
// menu renderer
// ----------------------------------------------------------------------- //

// Renders a dropdown menu and binds its click behavior.
const renderMenuSection = (items, destination, type) => {

    debugLog("* renderMenuSection:", type);

    const containers = document.querySelectorAll(destination);

    // Mirror the same menu contents into every desktop and mobile dropdown container.
    containers.forEach(container => {

        container.innerHTML = '';

        // Build one button per available option in the current menu.
        items.forEach(item => {

            const button = document.createElement('button');
            button.className = 'dropdown-item';
            button.type = 'button';

            // Subtly highlight the currently selected value in each dropdown.
            // Number() coercion on both sides: MeasureID and TimePeriodID may be string or float depending on source
            const isSelected =
                (type === 'measure' && Number(item.value) === Number(DE.state.MeasureID)) ||
                (type === 'geo' && item.value === DE.state.GeoType) ||
                (type === 'time' && Number(item.value) === Number(DE.state.TimePeriodID));

            // Mark the currently selected option so the menu reflects global state.
            if (isSelected) {
                button.classList.add('is-selected');
                button.setAttribute('aria-current', 'true');
            }

            // keep existing dropdown-close behavior
            button.addEventListener('click', () => updateDropdownText(button));

            button.addEventListener('click', () => {
                handleSelection(type, item.value);
            });

            button.textContent = item.label;

            container.appendChild(button);
        });
    });
};


// ----------------------------------------------------------------------- //
// selection handler
// ----------------------------------------------------------------------- //

// Applies a dropdown selection to global state, cascades dependent menus, and re-renders the view.
const handleSelection = (type, value) => {

    debugLog(`* handleSelection — ${type}: ${value}`);

    // ----- update the one changed global ----- //

    if (type === 'measure') {
        DE.state.MeasureID = value;
    }

    if (type === 'geo') {
        DE.state.GeoType = value;
    }

    if (type === 'time') {
        DE.state.TimePeriodID = value;
    }

    // ----- cascade-rebuild dependent menus ----- //

    // updateAllMenus fills in cascaded defaults for any sibling selection that no longer applies
    const ind = indicators.find(d => d.IndicatorID === Number(DE.state.IndicatorID));

    updateAllMenus(ind);

    // ----- resync dependent tab selections ----- //

    // - - - resync links secondary measure - - - //

    if (type === 'measure' && typeof syncLinksSelectionsToMapSelection === 'function') {
        syncLinksSelectionsToMapSelection();
    }

    // - - - resync table filters - - - //

    if ((type === 'geo' || type === 'time') && typeof syncTableFiltersToMapSelection === 'function') {
        // Geo and time changes can invalidate the current Area search, so clear and resync first.
        if (typeof clearTableAreaSearch === 'function') {
            clearTableAreaSearch();
        }

        syncTableFiltersToMapSelection();
    }

    // ----- push new state to the url ----- //

    pushSelectionToURL();

    // ----- fire legacy analytics event ----- //

    const analyticsOption = getLegacyMapControlAnalyticsOption(type);

    if (analyticsOption) {
        trackDataExplorerOption(analyticsOption);
    }

    // ----- re-render the active view and update the map ----- //

    renderCurrentView(true);
};


// ----------------------------------------------------------------------- //
// dropdown ui
// ----------------------------------------------------------------------- //

// Reflects the clicked option text back into the visible dropdown trigger.
const updateDropdownText = (clickedItem) => {

    debugLog("* updateDropdownText");

    const dropdown = clickedItem.closest('.dropdown');
    // Resolve the trigger by role, not by id suffix, so mobile/desktop variants
    // (which now carry unique ids) both match.
    const button = dropdown.querySelector('button[data-toggle="dropdown"]');
    const span = button?.querySelector('span');

    if (!span) {
        return;
    }

    span.textContent = clickedItem.textContent;

    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    dropdownMenu.classList.remove('show');
};
