// ======================================================================= //
// app.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// CSV download
// ----------------------------------------------------------------------- //

// Exports the active neighborhood's rows from the viz table as a CSV download
const downloadCSV = () => {

    debugLog('downloadCSV: enter:', { hasVizTable: !!vizTable, currentNeighborhood });

    // Export only if both the viz table and active neighborhood are available
    if (!vizTable || !currentNeighborhood) {
        debugLog('downloadCSV: branch-missing-prereqs');
        return;
    }

    // Remove columns that are not useful in the public CSV export
    const csv = vizTable
        .select(aq.not('report_id', 'indicator_id', 'indicator_data_name', 'start_date', 'end_date'))
        .filter(aq.escape(d => d.neighborhood === currentNeighborhood))
        .toCSV();

    const filename = 'NYC EH Data Portal - Neighborhood Report - ' +
        (reportConfig.reportName || 'Report') + ' - ' + currentNeighborhood + '.csv';

    // Use Blob URL download flow for broad browser compatibility
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

};


window.nrDownloadCSV = downloadCSV;


// ----------------------------------------------------------------------- //
// accordion controls
// ----------------------------------------------------------------------- //

// Returns the indicator detail panels within the report's accordion sections
const getAccordionPanels = () => $('.nr-report-accordion .collapse');


// Synchronizes the bulk-control label with the current expansion state
const updateAccordionToggle = () => {

    const button = document.getElementById('nr-toggle-accordions');

    if (!button) return;

    const panels = getAccordionPanels();
    const allExpanded = panels.length > 0 && panels.filter('.show').length === panels.length;
    const icon = button.querySelector('i');
    const label = button.querySelector('.nr-accordion-toggle-label');

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

    if (!reportConfig || !reportConfig.sections || !reportConfig.sections.length) {
        debugLog('bootstrap: missing-config:', reportConfig);
        return;
    }

    if (!document.getElementById('nr-map')) {
        debugLog('bootstrap: missing-map-container');
        return;
    }

    // Deferred to here rather than computed beside fetchesComplete, because the
    // section count is only trustworthy once the guard above has passed
    // The topic-indicator map counts unconditionally: loadTopicIndicators reports a
    // completed fetch on every path, including the one where it is not configured
    totalFetches = reportConfig.sections.length + (reportConfig.vizUrl ? 1 : 0) + 1;

    // Hook accordion expansion before data arrives so first open can render immediately
    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);
    $(document).on('shown.bs.collapse hidden.bs.collapse', '.nr-report-accordion .collapse', updateAccordionToggle);

    const accordionToggle = document.getElementById('nr-toggle-accordions');
    if (accordionToggle) accordionToggle.addEventListener('click', toggleAllAccordions);

    // Start map and data loads in parallel
    initLeafletMap();

    reportConfig.sections.forEach(section => {
        loadSection(section);
    });

    loadTopicIndicators();
    loadVizData();

};


bootstrap();
