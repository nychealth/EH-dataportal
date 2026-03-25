// ======================================================================= //
// menu.js
// ======================================================================= //

console.log(">> menu.js");

// ----------------------------------------------------------------------- //
// STATE
// ----------------------------------------------------------------------- //

let currentState = {
    indicatorID: null,
    measureID: null,
    geoType: null,
    timePeriodID: null
};

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

// Repalce TimePeriodIDs with Time Periods
const getTimeLabel = (id) => {
    if (!timeTable) return id; // fallback
    const tp = timeTable.find(t => t.TimePeriodID === id);
    return tp ? tp.TimePeriod : id;
};


// Update dropdown button label text
const setDropdownLabel = (type, value) => {
    let cls = type + '-name';  // measure-name, geo-name, time-name
    document.querySelectorAll(`.${cls}`).forEach(span => {
        span.textContent = value;
    });
}

// ----------------------------------------------------------------------- //
// INIT
// ----------------------------------------------------------------------- //

const printMenus = async (indicatorID) => {

    console.log('* printMenus');

    await ensureIndicatorsLoaded('printing menus');

    const indicator = indicators.find(d => d.IndicatorID === Number(indicatorID));

    currentState.indicatorID = indicatorID;

    // DEFAULT MEASURE (priority-based)
    const defaultMeasure = getDefaultMeasure(indicator);
    currentState.measureID = defaultMeasure.MeasureID;

    updateAllMenus(indicator);
};

// ----------------------------------------------------------------------- //
// CORE UPDATE FUNCTION
// ----------------------------------------------------------------------- //

const updateAllMenus = (indicator) => {

    console.log('* updateAllMenus');
    console.log('Current state:', currentState);

    const measure = indicator.Measures.find(m => m.MeasureID === currentState.measureID);

    // ---------------------------
    // MEASURES MENU
    // ---------------------------

    const measures = indicator.Measures.map(m => ({
        label: m.MeasurementType,
        value: m.MeasureID
    }));

    styleAndPrintMenu(measures, '.measures-holder', 'measure');

    // SET MEASURE LABEL (AFTER BUILDING MEASURES)
    setDropdownLabel('measure', measure.MeasurementType);

    // ---------------------------
    // GEO MENU
    // ---------------------------

    const geos = measure.VisOptions[0].Map.map(d => ({
        label: d.GeoType,
        value: d.GeoType
    }));

    // SET DEFAULT GEO (USING assignGeoRank)
    const availableGeoValues = geos.map(g => g.value);

    if (!currentState.geoType || !availableGeoValues.includes(currentState.geoType)) {

        currentState.geoType = availableGeoValues.reduce((best, current) => {
            return assignGeoRank(current) > assignGeoRank(best) ? current : best;
        });

    }

// NOW RENDER MENU
styleAndPrintMenu(geos, '.geo-holder', 'geo');

// THEN UPDATE LABEL
setDropdownLabel('geo', currentState.geoType);

    // ---------------------------
    // TIME MENU
    // ---------------------------

    const geoObj = measure.VisOptions[0].Map.find(d => d.GeoType === currentState.geoType);

    const times = (geoObj?.TimePeriodID || []).map(t => ({
        label: t,
        value: t
    }));

    // Ensure valid time (default = latest)
    if (!currentState.timePeriodID || !times.find(t => t.value === currentState.timePeriodID)) {
        currentState.timePeriodID = times.length ? times[times.length - 1].value : null;
    }

    styleAndPrintMenu(times, '.time-holder', 'time');

    // SET TIME LABEL (AFTER SETTING TIME)
    setDropdownLabel('time', currentState.timePeriodID);
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

            // Keep your existing behavior
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
// SELECTION HANDLER
// ----------------------------------------------------------------------- //

const handleSelection = (type, value) => {

    console.log(`change - ${type}: ${value}`);

    if (type === 'measure') {
        currentState.measureID = value;

        // 🔑 force geo + time to reset when measure changes
        currentState.geoType = null;
        currentState.timePeriodID = null;
    }

    if (type === 'geo') {
        currentState.geoType = value;

        // reset time when geo changes
        currentState.timePeriodID = null;
    }

    if (type === 'time') {
        currentState.timePeriodID = value;
    }

    const indicator = indicators.find(d => d.IndicatorID === Number(currentState.indicatorID));

    updateAllMenus(indicator);
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