// ======================================================================= //
// app.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// CSV download
// ----------------------------------------------------------------------- //

// Exports the current district's rows as a CSV download.
//
// Built from indicatorRows rather than from an Arquero table: NR filters one shared viz
// table down to the active neighborhood, and there is no such table here — the rows this
// page holds are already exactly the ones to export. Written by hand rather than through
// aq.from().toCSV() so the column list is visible in this file, which is the thing a
// public export wants to be explicit about
const CSV_COLUMNS = [
    'indicator_name',
    'indicator_long_name',
    'geotype',
    'geo_entity_name',
    'data_value_geo_entity',
    'units',
    'measurement_type',
    'data_value_boro',
    'data_value_nyc',
    'data_value_rank',
    'time_period',
    'data_source_list'
];


// Wraps one value for CSV: quotes it and doubles any quote it contains
const csvCell = value => {

    if (value == null) return '';

    return '"' + String(value).replace(/"/g, '""') + '"';

};


const downloadCSV = () => {

    debugLog('downloadCSV: enter:', { rowCount: indicatorRows.length, currentDistrict });

    // Export only if there is something to export
    if (!indicatorRows.length || !currentDistrict) {
        debugLog('downloadCSV: branch-missing-prereqs');
        return;
    }

    const lines = [CSV_COLUMNS.join(',')];

    indicatorRows.forEach(row => {
        lines.push(CSV_COLUMNS.map(column => csvCell(row[column])).join(','));
    });

    const csv = lines.join('\n');

    const filename = 'NYC EH Data Portal - Neighborhood Development Health Report - ' +
        (reportConfig.reportName || 'Report') + ' - ' + currentDistrict + '.csv';

    // Use Blob URL download flow for broad browser compatibility
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

};


window.ndhrDownloadCSV = downloadCSV;


// ----------------------------------------------------------------------- //
// accordion controls
// ----------------------------------------------------------------------- //

// Returns the indicator detail panels within the report's accordion
const getAccordionPanels = () => $('.ndhr-report-accordion .collapse');


// Synchronizes the bulk-control label with the current expansion state
const updateAccordionToggle = () => {

    const button = document.getElementById('ndhr-toggle-accordions');

    if (!button) return;

    const panels = getAccordionPanels();
    const allExpanded = panels.length > 0 && panels.filter('.show').length === panels.length;
    const icon = button.querySelector('i');
    const label = button.querySelector('.ndhr-accordion-toggle-label');

    button.disabled = !panels.length;

    // The visible label already flips between "Expand all" and "Collapse all"; without this
    // the group state it controls reaches the accessibility tree through that text alone
    button.setAttribute('aria-expanded', allExpanded ? 'true' : 'false');

    if (icon) {
        icon.className = 'fas ' + (allExpanded ? 'fa-compress-alt' : 'fa-expand-alt') + ' mr-1';
    }

    if (label) label.textContent = allExpanded ? 'Collapse all' : 'Expand all';

};


// Opens every indicator panel unless they are already all open, then closes them
const toggleAllAccordions = () => {

    const panels = getAccordionPanels();
    const allExpanded = panels.length > 0 && panels.filter('.show').length === panels.length;

    panels.collapse(allExpanded ? 'hide' : 'show');

};


// ----------------------------------------------------------------------- //
// bootstrap
// ----------------------------------------------------------------------- //

// Entry point: verifies the page contract, then wires events and starts the loads
const bootstrap = () => {

    debugLog('bootstrap: start');

    if (!reportConfig) {
        debugLog('bootstrap: missing-config:', reportConfig);
        return;
    }

    // A category with no measures is a supported state, not a broken page: Mental Health
    // renders a server-side empty state (plan DECIDED-7) and has no indicator rows.
    //
    // It is NOT short-circuited here. An earlier version returned at this point, and that
    // also skipped everything the left column and the header need — none of which has
    // anything to do with measures. The cost was a blank bordered 450px box where the
    // district map belongs, a demographics panel still at display:none with all five
    // values empty, and no print QR code, on all 59 Mental Health report pages
    // `[verified 2026-09-12 against the same district's Housing page as the control:
    // mapPanes 0 against 7, map polygons 0 against 62, demographics display none/0px
    // against block/337px, qrcode children 0 against 1]`.
    //
    // The emptiness is handled where it belongs instead — loadDistrictRows returns an
    // empty result without fetching, so it holds for a map-driven district switch too,
    // and renderIndicators finds no #ndhr-indicators container because the template
    // rendered the empty-state branch in its place
    if (!document.getElementById('ndhr-map')) {
        debugLog('bootstrap: missing-map-container');
        return;
    }

    // Hook accordion expansion before data arrives so first open can render immediately
    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);
    $(document).on('shown.bs.collapse hidden.bs.collapse', '.ndhr-report-accordion .collapse', updateAccordionToggle);

    const accordionToggle = document.getElementById('ndhr-toggle-accordions');
    if (accordionToggle) accordionToggle.addEventListener('click', toggleAllAccordions);

    // Start map and data loads in parallel
    initLeafletMap();

    loadInitialRows();
    loadTopicIndicators();

};


bootstrap();
