// ======================================================================= //
// menu.js
// ======================================================================= //

// console.log(">> menu.js");

// Measure / Boundary / Time controls: defaults, cascading rebuilds, and selection handling.
// Measure and Boundary render as one-click option pills, Time as a slider.

// ----------------------------------------------------------------------- //
// helpers
// ----------------------------------------------------------------------- //

// Selects the indicator's default measure via the shared priority order
// (pickDefaultMeasureByPriority in measures.js), so the selected pill matches the measure
// the map/trend tabs render by default. menu.js passes all Measures; the per-tab defaults pass
// their filtered subsets — but the ranking rules are now a single source of truth.

const getDefaultMeasure = (indicator) => pickDefaultMeasureByPriority(indicator.Measures);


// Converts a TimePeriodID into its display label for the Time control.

const getTimeLabel = (id) => {
    return DE.lookups.timeLookup[id]?.TimePeriod || id;
};


// Writes the current value's text into every copy (desktop and mobile) of the given control.
// Time shows it beside the slider; Measure and Boundary keep it in a hidden span, because their
// pills already show the selection, and announceSelection reads all three from here.

const setSelectionLabel = (type, value) => {

    let cls = type + '-name';  // measure-name, geo-name, time-name

    document.querySelectorAll(`.${cls}`).forEach(span => {
        span.textContent = value;
    });
};


// ----------------------------------------------------------------------- //
// menu initialization
// ----------------------------------------------------------------------- //

// Ensures one valid measure is selected before any menu rendering begins.

const renderMenus = async (indicatorID) => {

    debugLog('* renderMenus');

    await ensureIndicatorsLoaded('rendering menus');

    const indicator = getIndicatorById(indicatorID);

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

    setSelectionLabel('measure', measure.MeasurementType);

    // ----- rebuild geo menu, defaulting to finest available geography ----- //

    // Prettify and deduplicate geo types (e.g., NTA2010 + NTA2020 → one "NTA" entry)

    const seenGeos = new Set();
    const geos = [];

    // Collapse versioned backend geotypes into one prettified option per geography.
    // A measure whose Map VisOption carries a null GeoType prettifies to nothing, and an option
    // with no label is unusable and unreadable — the Boundary control must never contain one,
    // whatever the catalog says. See withCitywideMapFallback in global.js for the metadata side.

    (measure.VisOptions[0].Map || []).forEach(d => {

        const pretty = prettifyGeoType(d.GeoType);
        if (typeof pretty === 'string' && pretty && !seenGeos.has(pretty)) {
            seenGeos.add(pretty);
            geos.push({ label: pretty, value: pretty });
        }
    });

    const availableGeoValues = geos.map(g => g.value);

    // default to the finest available geography when the current one is missing or invalid

    if (!DE.state.GeoType || !availableGeoValues.includes(DE.state.GeoType)) {

        // Favor the most detailed geography so the map opens at the richest available level.
        // Seeded, because a measure with no mappable geography at all leaves this list empty and
        // an unseeded reduce throws on it.

        DE.state.GeoType = availableGeoValues.reduce(
            (best, current) => (assignGeoRank(current) > assignGeoRank(best) ? current : best),
            availableGeoValues[0] ?? null
        );
    }

    renderMenuSection(geos, '.geo-holder', 'geo');

    setSelectionLabel('geo', DE.state.GeoType);

    // ----- rebuild time menu, defaulting to most recent period ----- //

    // Find the metadata entry whose raw GeoType prettifies to our selected GeoType

    const geoObj = (measure.VisOptions[0].Map || []).find(d => prettifyGeoType(d.GeoType) === DE.state.GeoType);

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

    setSelectionLabel('time', getTimeLabel(DE.state.TimePeriodID));

};


// ----------------------------------------------------------------------- //
// control renderers
// ----------------------------------------------------------------------- //

// Renders one control into every desktop and mobile copy. Measure and Boundary become option
// pills; Time hands off to renderTimeSlider.

const renderMenuSection = (items, destination, type) => {

    debugLog("* renderMenuSection:", type);

    if (type === 'time') {
        renderTimeSlider(items, destination);
        return;
    }

    const containers = document.querySelectorAll(destination);

    containers.forEach(container => {

        // A rebuild replaces the radio that has focus: arrow keys select and rebuild in one step.
        // Note whether focus was here so it can move to the new checked radio afterwards.

        const hadFocus = container.contains(document.activeElement);

        container.innerHTML = '';

        // Build one pill per available option. Each pill is a native radio inside its label, so a
        // click anywhere on the pill selects it, and arrow keys and screen readers treat the set as
        // one radio group (the container carries role="radiogroup" and its label).

        items.forEach((item, index) => {

            const pill = document.createElement('label');
            pill.className = 'de-option-pill';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.className = 'sr-only';

            // Each copy has its own radio name (data-radio-name), so the desktop and mobile
            // groups don't share one checked state.

            radio.name = container.dataset.radioName;

            // The change handler below looks the option back up by position rather than reading
            // its value off the radio: an input's value is always a string, and 97 Map entries in
            // the catalog carry GeoType: null, which would reach handleSelection as "null".

            radio.value = index;

            // Number() coercion on both sides: MeasureID may be string or float depending on source

            const isSelected =
                (type === 'measure' && Number(item.value) === Number(DE.state.MeasureID)) ||
                (type === 'geo' && item.value === DE.state.GeoType);

            if (isSelected) {
                radio.checked = true;
                pill.classList.add('is-selected');
            }

            pill.append(radio, document.createTextNode(item.label));

            container.appendChild(pill);

        });

        // One delegated listener per container. Assigning `onchange` (rather than
        // addEventListener) is idempotent, so repeated rebuilds can't stack handlers.
        // updateAllMenus repaints every copy's pills and labels, so nothing else is needed here.

        container.onchange = event => {

            const radio = event.target.closest('input[type="radio"]');

            if (!radio) return;

            const item = items[Number(radio.value)];

            handleSelection(type, item.value, item.label);

        };

        if (hadFocus) container.querySelector('input:checked')?.focus();

    });
};


// Builds the Time slider in each copy on first use, then updates it in place. Updating rather
// than rebuilding keeps keyboard focus on the slider across selections. Left is the oldest period,
// right the most recent. Dragging previews the period in the label; the view re-renders on
// release (the change event), which keyboard steps also fire, one per key press.

const renderTimeSlider = (items, destination) => {

    // updateAllMenus sorts most recent first; the slider reads left to right, so oldest first.

    const periods = [...items].reverse();

    const selectedIndex = Math.max(0, periods.findIndex(p => Number(p.value) === Number(DE.state.TimePeriodID)));

    document.querySelectorAll(destination).forEach(container => {

        // ----- build once: the slider and its start/end labels ----- //

        let slider = container.querySelector('.de-time-slider');

        if (!slider) {

            slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'de-time-slider';
            slider.min = 0;
            slider.step = 1;

            if (container.dataset.labelId) slider.setAttribute('aria-labelledby', container.dataset.labelId);

            // Tick marks under the track, one per period (filled in below). Decorative:
            // the slider's aria-valuetext already names the period.

            const ticks = document.createElement('div');
            ticks.className = 'de-time-ticks';
            ticks.setAttribute('aria-hidden', 'true');

            const ends = document.createElement('div');
            ends.className = 'de-time-ends';
            ends.setAttribute('aria-hidden', 'true');
            ends.append(document.createElement('span'), document.createElement('span'));

            container.append(slider, ticks, ends);

        }

        const ticks = container.querySelector('.de-time-ticks');
        const ends = container.querySelector('.de-time-ends');

        // ----- update to the current periods and selection ----- //

        // One period (or none) leaves nothing to slide between; the label above names it.

        const hasRange = periods.length > 1;

        slider.hidden = !hasRange;
        ticks.hidden = !hasRange;
        ends.hidden = !hasRange;

        slider.max = Math.max(0, periods.length - 1);
        slider.value = selectedIndex;

        // Screen readers announce the period name rather than the slider's position number.

        slider.setAttribute('aria-valuetext', periods[selectedIndex]?.label ?? '');

        ends.children[0].textContent = periods[0]?.label ?? '';
        ends.children[1].textContent = periods[periods.length - 1]?.label ?? '';

        renderTimeTicks(ticks, periods.length);

        // ----- handlers (assigned, so repeated renders replace rather than stack) ----- //

        // While dragging: the label follows the thumb, without re-rendering the view yet.

        slider.oninput = () => {

            const period = periods[Number(slider.value)];

            if (!period) return;

            slider.setAttribute('aria-valuetext', period.label);
            setSelectionLabel('time', period.label);

        };

        // On release: select the period. A drag that ends where it started changes nothing.

        slider.onchange = () => {

            const period = periods[Number(slider.value)];

            if (!period || Number(period.value) === Number(DE.state.TimePeriodID)) return;

            handleSelection('time', period.value, period.label);

        };
    });
};


// Draws the tick marks under the Time slider, one per period, at the points the thumb stops at.
// Most measures have 22 periods or fewer (90th percentile across the catalog); a few have up to
// 100, and a tick for each of those would run together into a solid bar on a ~250px track. So
// past MAX_TIME_TICKS the ticks are spaced every few periods, always including both ends.

const MAX_TIME_TICKS = 25;

const renderTimeTicks = (ticks, count) => {

    ticks.textContent = '';

    if (count < 2) return;

    const lastIndex = count - 1;
    const every = Math.ceil(lastIndex / (MAX_TIME_TICKS - 1));

    for (let index = 0; index <= lastIndex; index++) {

        if (index % every !== 0 && index !== lastIndex) continue;

        // The thumb's center travels from one thumb-radius in from the left edge to one radius in
        // from the right, so ticks are placed across that same span (--de-thumb in the SCSS).

        const tick = document.createElement('span');
        tick.className = 'de-time-tick';
        tick.style.left = `calc(var(--de-thumb) / 2 + (100% - var(--de-thumb)) * ${index / lastIndex})`;

        ticks.appendChild(tick);

    }
};


// ----------------------------------------------------------------------- //
// selection handler
// ----------------------------------------------------------------------- //

// Applies a Measure, Boundary or Time selection to global state, cascades dependent menus, and re-renders the view.

const handleSelection = (type, value, label) => {

    debugLog(`* handleSelection — ${type}: ${value}`);

    // ----- update the one changed global ----- //

    const previousGeoTime = [DE.state.GeoType, DE.state.TimePeriodID];

    if (type === 'measure') DE.state.MeasureID = value;

    if (type === 'geo') DE.state.GeoType = value;

    if (type === 'time') DE.state.TimePeriodID = value;

    // ----- cascade-rebuild dependent menus ----- //

    // updateAllMenus fills in cascaded defaults for any sibling selection that no longer applies

    const ind = getIndicatorById(DE.state.IndicatorID);

    updateAllMenus(ind);

    // ----- resync dependent tab selections ----- //

    // - - - resync links secondary measure - - - //

    if (type === 'measure' && typeof syncLinksSelectionsToMapSelection === 'function') {
        syncLinksSelectionsToMapSelection();
    }

    // - - - resync table filters - - - //

    // A measure change counts when updateAllMenus cascaded it into a new geo or time.

    const geoTimeChanged = DE.state.GeoType !== previousGeoTime[0] || DE.state.TimePeriodID !== previousGeoTime[1];

    if ((type === 'geo' || type === 'time' || geoTimeChanged) && typeof syncTableFiltersToMapSelection === 'function') {

        // Geo and time changes can invalidate the current Area search, so clear and resync first.

        if (typeof clearTableAreaSearch === 'function') {
            clearTableAreaSearch();
        }

        syncTableFiltersToMapSelection();

    }

    // ----- push new state to the url ----- //

    pushSelectionToURL();

    // ----- fire legacy analytics event ----- //

    // option_label carries the menu text a reader can recognize. The IDs are not sent: the URL
    // was updated just above, and GA attaches it to every event as page_location (observed
    // 2026-10-16, documents/de-analytics-audit-2026-10-16.md).

    const analyticsOption = getLegacyMapControlAnalyticsOption(type);

    if (analyticsOption) {
        trackDataExplorerOption(analyticsOption, label ? { option_label: label } : null);
    }

    // ----- re-render the active view and update the map ----- //

    renderCurrentView(true);

    // ----- tell screen readers what is now shown ----- //

    announceSelection();

};


// ----------------------------------------------------------------------- //
// selection announcement
// ----------------------------------------------------------------------- //

// Writes the full selection ("Showing Age-adjusted rate, CD, 2023") into the #selectionStatus live
// region after a measure, boundary or time change (A-256; Chris, 2026-10-31). It reads the value
// labels updateAllMenus has just written (setSelectionLabel), so a cascaded boundary or time is
// announced as it now reads.
// The region is emptied first and refilled on the next tick so the same text twice is still spoken.

const announceSelection = () => {

    const status = document.getElementById('selectionStatus');

    if (!status) return;

    const text = ['measure', 'geo', 'time']
        .map(type => document.querySelector(`.${type}-name`)?.textContent.trim())
        .filter(Boolean)
        .join(', ');

    status.textContent = '';

    if (text) {
        setTimeout(() => { status.textContent = `Showing ${text}`; }, 100);
    }

};
