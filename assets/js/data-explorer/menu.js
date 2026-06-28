// ======================================================================= //
// menu.js
// ======================================================================= //

// console.log(">> menu.js");

// Dropdown-menu defaults, cascading menu rebuilds, and selection handling


// ----------------------------------------------------------------------- //
// helpers
// ----------------------------------------------------------------------- //

// Selects the default measure using the project's priority order.
const getDefaultMeasure = (indicator) => {

    const priority = [
        'Age-adjusted rate',
        'rate',
        'Rate',
        'Percent',
        'percent',
        'Density'
    ];

    let matchedMeasure = null;

    // Formats whichever value is currently active into every cloned trigger label.
    // Walk the priority list until the first matching measurement type is found.
    for (let word of priority) {
        matchedMeasure = indicator.Measures.find(m =>
            m.MeasurementType.includes(word)
        );
        if (matchedMeasure) break;
    }

    // fallback
    if (!matchedMeasure) {
        return indicator.Measures[0];
    }

    return matchedMeasure;
};


// Converts a TimePeriodID into its display label for dropdown text.
const getTimeLabel = (id) => {
    return timeLookup[id]?.TimePeriod || id;
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
const printMenus = async (indicatorID) => {

    console.log('* printMenus');

    await ensureIndicatorsLoaded('printing menus');

    const indicator = indicators.find(d => d.IndicatorID === Number(indicatorID));

    if (!indicator || !indicator.Measures?.length) {
        console.warn('printMenus: no indicator or measures found for', indicatorID);
        return;
    }

    const selectedMeasure = indicator.Measures.find(m => m.MeasureID === MeasureID);

    // Fall back to the preferred default when the URL or globals point to an invalid measure.
    if (!MeasureID || !selectedMeasure) {
        const defaultMeasure = getDefaultMeasure(indicator);
        MeasureID = defaultMeasure.MeasureID;
    }

    updateAllMenus(indicator);
};


// ----------------------------------------------------------------------- //
// full menu rebuild
// ----------------------------------------------------------------------- //

// Rebuilds all dependent menus from current globals after one selection changes.
const updateAllMenus = (indicator) => {

    console.log('* updateAllMenus');
    console.log('Globals:', { MeasureID, GeoType, TimePeriodID });

    if (!indicator || !indicator.Measures?.length) {
        console.warn('updateAllMenus: no indicator or measures available');
        return;
    }

    let measure = indicator.Measures.find(m => m.MeasureID === MeasureID);

    if (!measure) {
        // Recover from stale globals or URL params by snapping back to the default measure.
        measure = getDefaultMeasure(indicator);
        MeasureID = measure.MeasureID;
    }

    // ----------------------------------------------------------------------- //
    // MEASURES MENU
    // ----------------------------------------------------------------------- //

    const measures = indicator.Measures.map(m => ({
        label: m.MeasurementType,
        value: m.MeasureID
    }));

    styleAndPrintMenu(measures, '.measures-holder', 'measure');

    setDropdownLabel('measure', measure.MeasurementType);

    // ----------------------------------------------------------------------- //
    // GEO MENU
    // ----------------------------------------------------------------------- //

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
    if (!GeoType || !availableGeoValues.includes(GeoType)) {

        // Favor the most detailed geography so the map opens at the richest available level.
        GeoType = availableGeoValues.reduce((best, current) => {
            return assignGeoRank(current) > assignGeoRank(best) ? current : best;
        });
    }

    styleAndPrintMenu(geos, '.geo-holder', 'geo');

    setDropdownLabel('geo', GeoType);

    // ----------------------------------------------------------------------- //
    // TIME MENU
    // ----------------------------------------------------------------------- //

    // Find the metadata entry whose raw GeoType prettifies to our selected GeoType

    const geoObj = measure.VisOptions[0].Map.find(d => prettifyGeoType(d.GeoType) === GeoType);

    // Look up labels and sort by end_period descending (most recent first)

    const times = (geoObj?.TimePeriodID || [])
        .map(id => {
            const tp = timeLookup[id];
            return {
                label: tp?.TimePeriod || id,
                value: id,
                endPeriod: tp?.end_period || ''
            };
        })
        .sort((a, b) => b.endPeriod - a.endPeriod);

    // default to the most recent available time period when the current one is invalid
    if (!TimePeriodID || !times.find(t => t.value === TimePeriodID)) {
        TimePeriodID = times.length ? times[0].value : null;
    }

    styleAndPrintMenu(times, '.time-holder', 'time');

    setDropdownLabel('time', getTimeLabel(TimePeriodID));
};


// ----------------------------------------------------------------------- //
// menu renderer
// ----------------------------------------------------------------------- //

// Renders a dropdown menu and binds its click behavior.
const styleAndPrintMenu = (items, destination, type) => {

    console.log("* styleAndPrintMenu:", type);

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
                (type === 'measure' && Number(item.value) === Number(MeasureID)) ||
                (type === 'geo' && item.value === GeoType) ||
                (type === 'time' && Number(item.value) === Number(TimePeriodID));

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

const handleSelection = (type, value) => {

    console.log(`* handleSelection — ${type}: ${value}`);

    // update exactly one global — updateAllMenus will cascade-reset siblings that no longer apply
    if (type === 'measure') {
        MeasureID = value;
    }

    if (type === 'geo') {
        GeoType = value;
    }

    if (type === 'time') {
        TimePeriodID = value;
    }

    // rebuild menus (fills in cascaded defaults for nulled-out values)

    const ind = indicators.find(d => d.IndicatorID === Number(IndicatorID));

    updateAllMenus(ind);

    if (type === 'measure' && typeof syncLinksSelectionsToMapSelection === 'function') {
        syncLinksSelectionsToMapSelection();
    }

    if ((type === 'geo' || type === 'time') && typeof syncTableFiltersToMapSelection === 'function') {
        // Geo and time changes can invalidate the current Area search, so clear and resync first.
        if (typeof clearTableAreaSearch === 'function') {
            clearTableAreaSearch();
        }

        syncTableFiltersToMapSelection();
    }

    // push full state to URL

    pushSelectionToURL();

    const analyticsOption = getLegacyMapControlAnalyticsOption(type);

    if (analyticsOption) {
        trackDataExplorerOption(analyticsOption);
    }

    // re-render the active tab, and update the Leaflet map for the new selection

    renderCurrentView(true);
};


// ----------------------------------------------------------------------- //
// dropdown ui
// ----------------------------------------------------------------------- //

// Reflects the clicked option text back into the visible dropdown trigger.
const updateDropdownText = (clickedItem) => {

    console.log("* updateDropdownText");

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
