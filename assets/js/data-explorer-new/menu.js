// ======================================================================= //
// menu.js
// ======================================================================= //

// console.log(">> menu.js");


// ----------------------------------------------------------------------- //
// HELPERS
// ----------------------------------------------------------------------- //

// Priority-based default measure
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


// Replace TimePeriodIDs with Time Periods
const getTimeLabel = (id) => {
    return timeLookup[id]?.TimePeriod || id;
};


// Update dropdown button label text
const setDropdownLabel = (type, value) => {
    let cls = type + '-name';  // measure-name, geo-name, time-name
    document.querySelectorAll(`.${cls}`).forEach(span => {
        span.textContent = value;
    });
}


// ----------------------------------------------------------------------- //
// INIT — set default measure, then build all menus
// ----------------------------------------------------------------------- //

const printMenus = async (indicatorID) => {

    console.log('* printMenus');

    await ensureIndicatorsLoaded('printing menus');

    const indicator = indicators.find(d => d.IndicatorID === Number(indicatorID));

    // set default measure if one isn't already set from URL

    if (!MeasureID) {
        const defaultMeasure = getDefaultMeasure(indicator);
        MeasureID = defaultMeasure.MeasureID;
    }

    updateAllMenus(indicator);
};


// ----------------------------------------------------------------------- //
// CORE UPDATE — rebuild all three dropdowns from globals
// ----------------------------------------------------------------------- //

const updateAllMenus = (indicator) => {

    console.log('* updateAllMenus');
    console.log('Globals:', { MeasureID, GeoTypeID, TimePeriodID });

    const measure = indicator.Measures.find(m => m.MeasureID === MeasureID);

    // ---------------------------
    // MEASURES MENU
    // ---------------------------

    const measures = indicator.Measures.map(m => ({
        label: m.MeasurementType,
        value: m.MeasureID
    }));

    styleAndPrintMenu(measures, '.measures-holder', 'measure');

    setDropdownLabel('measure', measure.MeasurementType);

    // ---------------------------
    // GEO MENU
    // ---------------------------

    const geos = measure.VisOptions[0].Map.map(d => ({
        label: d.GeoType,
        value: d.GeoType
    }));

    const availableGeoValues = geos.map(g => g.value);

    // pick finest available geo if current is invalid

    if (!GeoTypeID || !availableGeoValues.includes(GeoTypeID)) {

        GeoTypeID = availableGeoValues.reduce((best, current) => {
            return assignGeoRank(current) > assignGeoRank(best) ? current : best;
        });
    }

    styleAndPrintMenu(geos, '.geo-holder', 'geo');

    setDropdownLabel('geo', GeoTypeID);

    // ---------------------------
    // TIME MENU
    // ---------------------------

    const geoObj = measure.VisOptions[0].Map.find(d => d.GeoType === GeoTypeID);

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

    // Default to most recent time if current is invalid

    if (!TimePeriodID || !times.find(t => t.value === TimePeriodID)) {
        TimePeriodID = times.length ? times[0].value : null;
    }

    styleAndPrintMenu(times, '.time-holder', 'time');

    setDropdownLabel('time', getTimeLabel(TimePeriodID));
};


// ----------------------------------------------------------------------- //
// MENU RENDERER
// ----------------------------------------------------------------------- //

const styleAndPrintMenu = (items, destination, type) => {

    console.log("* styleAndPrintMenu:", type);

    const containers = document.querySelectorAll(destination);

    containers.forEach(container => {

        container.innerHTML = '';

        items.forEach(item => {

            const button = document.createElement('button');
            button.className = 'dropdown-item';
            button.type = 'button';

            // keep existing dropdown-close behavior
            button.setAttribute('onclick', 'updateDropdownText(this)');

            button.addEventListener('click', () => {
                handleSelection(type, item.value);
            });

            button.textContent = item.label;

            container.appendChild(button);
        });
    });
};


// ----------------------------------------------------------------------- //
// SELECTION HANDLER — update globals, push URL, rebuild menus, re-render
// ----------------------------------------------------------------------- //

const handleSelection = (type, value) => {

    console.log(`* handleSelection — ${type}: ${value}`);

    // update globals with cascading resets

    if (type === 'measure') {
        MeasureID = value;

        // force geo + time to reset when measure changes
        GeoTypeID = null;
        TimePeriodID = null;
    }

    if (type === 'geo') {
        GeoTypeID = value;

        // reset time when geo changes
        TimePeriodID = null;
    }

    if (type === 'time') {
        TimePeriodID = value;
    }

    // rebuild menus (fills in cascaded defaults for nulled-out values)

    const ind = indicators.find(d => d.IndicatorID === Number(IndicatorID));

    updateAllMenus(ind);

    // push full state to URL

    pushSelectionToURL();

    // Google Analytics

    if (typeof gtag === 'function') {
        gtag('event', 'click_option', { option: type });
    }

    // re-render the active tab

    renderCurrentView();
};


// ----------------------------------------------------------------------- //
// EXISTING FUNCTION (UNCHANGED)
// ----------------------------------------------------------------------- //

const updateDropdownText = (clickedItem) => {

    console.log("* updateDropdownText");

    const dropdown = clickedItem.closest('.dropdown');
    const button = dropdown.querySelector('button[id$="OptionsDropdownButton"]');

    const span = button.querySelector('span');
    span.textContent = clickedItem.textContent;

    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    dropdownMenu.classList.remove('show');
};
