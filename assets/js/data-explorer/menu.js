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
// than rebuilding keeps keyboard focus on the slider across selections. Left is the oldest, right
// the most recent. Dragging previews the period in the label; the view re-renders on release (the
// change event), which keyboard steps also fire, one per key press.
//
// The slider moves between stops. Usually each stop is one period. Quarterly data has up to 100
// periods, too many to tell apart on a ~250px track, so there each stop is a year, and a bubble
// above the thumb holds that year's quarters (renderQuarterBubble).

const renderTimeSlider = (items, destination) => {

    // updateAllMenus sorts most recent first; the slider reads left to right, so oldest first.

    const periods = [...items].reverse();

    const selectedPeriod = periods.find(p => Number(p.value) === Number(DE.state.TimePeriodID)) ?? periods[0];

    const quarterly = isQuarterlyPeriods(periods);

    // Each stop carries either one period or one year's quarters.

    const stops = quarterly
        ? groupPeriodsByYear(periods).map(year => ({ label: String(year.year), year }))
        : periods.map(period => ({ label: period.label, period }));

    const selectedStopIndex = Math.max(0, quarterly
        ? stops.findIndex(stop => stop.year.year === getPeriodYear(selectedPeriod))
        : periods.indexOf(selectedPeriod));

    // Moving to a year keeps the selected quarter where that year has it, else the nearest one.

    const selectedQuarter = quarterly ? getPeriodQuarter(selectedPeriod) : null;

    const periodForStop = (stop) => stop.period ?? pickNearestQuarter(stop.year.quarters, selectedQuarter);

    document.querySelectorAll(destination).forEach(container => {

        // ----- build once: the slider, its ticks, the quarter bubble, the start/end labels ----- //

        let slider = container.querySelector('.de-time-slider');

        if (!slider) {

            slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'de-time-slider';
            slider.min = 0;
            slider.step = 1;

            if (container.dataset.labelId) slider.setAttribute('aria-labelledby', container.dataset.labelId);

            // Tick marks across the track (filled in by renderTimeTicks), drawn as SVG; see
            // renderTimeTicks for why. Decorative: the slider's aria-valuetext names the period.

            const ticks = document.createElementNS(SVG_NS, 'svg');
            ticks.setAttribute('class', 'de-time-ticks');
            ticks.setAttribute('aria-hidden', 'true');
            ticks.setAttribute('focusable', 'false');

            // Quarter picker for quarterly data. It sits above the thumb on screen but after the
            // slider in the page, so Tab goes from choosing the year to choosing the quarter.

            const bubble = document.createElement('div');
            bubble.className = 'de-quarter-bubble';
            bubble.setAttribute('role', 'radiogroup');
            bubble.setAttribute('aria-label', 'Quarter');

            const arrow = document.createElement('div');
            arrow.className = 'de-quarter-bubble-arrow';
            arrow.setAttribute('aria-hidden', 'true');

            const ends = document.createElement('div');
            ends.className = 'de-time-ends';
            ends.setAttribute('aria-hidden', 'true');
            ends.append(document.createElement('span'), document.createElement('span'));

            container.append(slider, ticks, bubble, arrow, ends);

            if (!timeTickRatioWatchStarted) watchTimeTickPixelRatio();

        }

        const ticks = container.querySelector('.de-time-ticks');
        const bubble = container.querySelector('.de-quarter-bubble');
        const arrow = container.querySelector('.de-quarter-bubble-arrow');
        const ends = container.querySelector('.de-time-ends');

        // ----- update to the current stops and selection ----- //

        // One stop (or none) leaves nothing to slide between; the label above names the period.

        const hasRange = stops.length > 1;

        slider.hidden = !hasRange;
        ticks.toggleAttribute('hidden', !hasRange);   // an SVG element has no .hidden property
        ends.hidden = !hasRange;

        // The quarterly layout leaves room above the slider for the bubble (see the SCSS).

        container.classList.toggle('is-quarterly', quarterly);
        bubble.hidden = !quarterly;
        arrow.hidden = !quarterly;

        slider.max = Math.max(0, stops.length - 1);
        slider.value = selectedStopIndex;

        // Screen readers announce the period name rather than the slider's position number.

        slider.setAttribute('aria-valuetext', selectedPeriod?.label ?? '');

        ends.children[0].textContent = stops[0]?.label ?? '';
        ends.children[1].textContent = stops[stops.length - 1]?.label ?? '';

        renderTimeTicks(ticks, stops.length);

        if (quarterly) renderQuarterBubble(container, stops, selectedStopIndex, selectedQuarter);

        // ----- handlers (assigned, so repeated renders replace rather than stack) ----- //

        // While dragging: the label (and on quarterly data the bubble) follows the thumb, without
        // re-rendering the view yet.

        slider.oninput = () => {

            const stop = stops[Number(slider.value)];
            const period = stop && periodForStop(stop);

            if (!period) return;

            slider.setAttribute('aria-valuetext', period.label);
            setSelectionLabel('time', period.label);

            if (quarterly) renderQuarterBubble(container, stops, Number(slider.value), getPeriodQuarter(period));

        };

        // On release: select the period. A drag that ends where it started changes nothing.

        slider.onchange = () => {

            const stop = stops[Number(slider.value)];
            const period = stop && periodForStop(stop);

            if (!period || Number(period.value) === Number(DE.state.TimePeriodID)) return;

            handleSelection('time', period.value, period.label);

        };
    });
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// quarterly time periods
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// True when every period is a quarter (TimeType in TimePeriods.json).

const isQuarterlyPeriods = (periods) =>
    periods.length > 0 && periods.every(p => DE.lookups.timeLookup[p.value]?.TimeType === 'quarter');

// Returns the calendar year a period starts in. start_period is a UTC timestamp on a quarter
// boundary (checked across all 101 quarterly periods, 2026-11-04); the label's leading year is
// the fallback for a period missing from the lookup.

const getPeriodYear = (period) => {

    const start = DE.lookups.timeLookup[period.value]?.start_period;

    return start != null ? new Date(start).getUTCFullYear() : Number(String(period.label).slice(0, 4));

};

// Returns a quarterly period's quarter, 1 to 4, from its start month; the label's "Q<n>" is the
// fallback ("2021-Q4" style for all 101 quarterly periods, 2026-11-04).

const getPeriodQuarter = (period) => {

    const start = DE.lookups.timeLookup[period.value]?.start_period;

    if (start != null) return Math.floor(new Date(start).getUTCMonth() / 3) + 1;

    return Number(String(period.label).match(/Q([1-4])/)?.[1]) || 1;

};

// Groups quarterly periods into one entry per year, oldest first, each with its periods by
// quarter: quarters[0] is Q1, and a quarter the year has no data for is null.

const groupPeriodsByYear = (periods) => {

    const years = [];

    periods.forEach(period => {

        const year = getPeriodYear(period);
        let entry = years[years.length - 1];

        if (!entry || entry.year !== year) {
            entry = { year, quarters: [null, null, null, null] };
            years.push(entry);
        }

        entry.quarters[getPeriodQuarter(period) - 1] = period;

    });

    return years;

};

// Returns the year's period for the wanted quarter, or for the nearest quarter it has, preferring
// the later of two equally near ones (the more recent data).

const pickNearestQuarter = (quarters, wantedQuarter) => {

    const wanted = (wantedQuarter ?? 4) - 1;

    for (let distance = 0; distance < 4; distance++) {

        const later = quarters[wanted + distance];
        const earlier = quarters[wanted - distance];

        if (later) return later;
        if (earlier) return earlier;

    }

    return null;

};

// Fills the quarter bubble with Q1 to Q4 for the year at stopIndex and moves it over that year's
// stop. Quarters the year has no data for are shown but disabled, so the four keep their places.
// Each quarter is a native radio inside its label, like the Measure and Boundary pills.

const renderQuarterBubble = (container, stops, stopIndex, checkedQuarter) => {

    const bubble = container.querySelector('.de-quarter-bubble');
    const stop = stops[stopIndex];

    if (!bubble || !stop?.year) return;

    // Where along the thumb's travel the bubble and its arrow point, 0 to 1 (used in the SCSS).

    container.style.setProperty('--de-stop', stops.length > 1 ? stopIndex / (stops.length - 1) : 0);

    // Rebuilding replaces a radio that may have focus; hand focus to the new checked one.

    const hadFocus = bubble.contains(document.activeElement);

    bubble.replaceChildren();

    stop.year.quarters.forEach((period, index) => {

        const option = document.createElement('label');
        option.className = 'de-quarter-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'sr-only';

        // One group per copy (desktop and mobile), named after that copy's Time label id.

        radio.name = `${container.dataset.labelId || 'time'}Quarter`;
        radio.value = index;
        radio.disabled = !period;
        radio.checked = index + 1 === checkedQuarter;

        option.classList.toggle('is-selected', radio.checked);
        option.classList.toggle('is-disabled', radio.disabled);

        // The visible text is short; the accessible name says which year's quarter it is.

        radio.setAttribute('aria-label', `Quarter ${index + 1}, ${stop.year.year}`);

        option.append(radio, document.createTextNode(`Q${index + 1}`));
        bubble.appendChild(option);

    });

    bubble.onchange = (event) => {

        const radio = event.target.closest('input[type="radio"]');
        const period = radio && stop.year.quarters[Number(radio.value)];

        if (!period || Number(period.value) === Number(DE.state.TimePeriodID)) return;

        handleSelection('time', period.value, period.label);

    };

    if (hadFocus) bubble.querySelector('input:checked')?.focus();

};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// time slider ticks
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Most measures have 22 periods or fewer (90th percentile across the catalog), and each stop gets
// a tick. Quarterly data has a stop per year, at most 25 today. Past this many stops, ticks would
// run together on a ~250px track, so they are thinned to every few stops, both ends included.

const MAX_TIME_TICKS = 25;

// Returns the stop indexes that get a tick.

const pickTimeTicks = (count) => {

    const lastIndex = count - 1;
    const every = Math.ceil(lastIndex / (MAX_TIME_TICKS - 1));

    return Array.from({ length: count }, (_unused, index) => index)
        .filter(index => index % every === 0 || index === lastIndex);

};

const SVG_NS = 'http://www.w3.org/2000/svg';

// Draws the tick marks across the Time slider's track, one per picked stop, as rects in an SVG
// that spans exactly the thumb center's travel (CSS insets it by half a thumb on each side), so a
// tick's x is simply its fraction of the way along, as a percentage, and stays right at any width.
//
// Why SVG and not positioned boxes: some ticks drew darker and bolder than others on screens with
// fractional scaling (Windows at 125% or 175%, or browser zoom). Measured in Chromium, 2026-11-04,
// on air quality indicator 2023, from full-viewport screenshots: box ticks drew in 4 different pixel
// patterns at 1.25x, 2 at 1.5x and 4 at 1.75x, and 1 at 1x and 2x. Those counts are how many
// different fractional screen positions a whole CSS pixel can fall on at each scale, which fits
// Chrome rounding boxes to whole CSS pixels before scaling them; placing boxes on exact screen
// pixels from script left the patterns unchanged or worse. SVG with shape-rendering: crispEdges
// (set in the SCSS) draws each rect straight onto screen pixels without blending, and a rect a whole
// number of screen pixels wide then covers that many pixels wherever it lands.

const renderTimeTicks = (ticks, count) => {

    ticks.replaceChildren();

    if (count < 2) return;

    const lastIndex = count - 1;

    pickTimeTicks(count).forEach(index => {

        const tick = document.createElementNS(SVG_NS, 'rect');

        tick.setAttribute('class', 'de-time-tick');
        tick.setAttribute('x', `${(index / lastIndex) * 100}%`);

        // The full height of the 16px SVG (--de-tick-box), which is centered on the 6px track,
        // so each tick shows 5px above and below it.

        tick.setAttribute('y', 0);
        tick.setAttribute('height', 16);

        ticks.appendChild(tick);

    });

    sizeTimeTicks(ticks);

};

// Sets every tick's width to a whole number of screen pixels (1 up to 1.5x scaling, 2 from there
// to 2.5x, and so on) and centers it on its x. Width is in CSS px, so it depends on the current
// pixel ratio, and is redone when that changes (watchTimeTickPixelRatio).

const sizeTimeTicks = (ticks) => {

    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(ratio)) / ratio;

    ticks.querySelectorAll('.de-time-tick').forEach(tick => {
        tick.setAttribute('width', width);
        tick.setAttribute('transform', `translate(${-width / 2} 0)`);
    });
};

// Re-sizes ticks when the screen's pixel ratio changes (browser zoom, or dragging the window to a
// monitor with different scaling). A resolution media query matches only the ratio it was made for,
// so each change re-arms it for the new one.

let timeTickRatioWatchStarted = false;

const watchTimeTickPixelRatio = () => {

    timeTickRatioWatchStarted = true;

    window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener('change', () => {

        document.querySelectorAll('.de-time-ticks').forEach(sizeTimeTicks);
        watchTimeTickPixelRatio();

    }, { once: true });
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
