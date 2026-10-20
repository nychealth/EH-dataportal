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

    // Same payload production's downloadData() sent
    trackNREvent('file_download', {
        file_name: filename,
        file_extension: '.csv',
        link_text: 'Download Report Data'
    });

    // Revoked on the next task rather than this one, so the download has started reading
    // the blob before its URL goes away. HYPOTHESIS (unverified): an immediate revoke can
    // cancel the download in some browsers; only Chromium was available to test, and it
    // downloads either way
    setTimeout(() => URL.revokeObjectURL(url), 0);

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
    // The viz table and the topic-indicator map count unconditionally: loadVizData and
    // loadTopicIndicators each report a completed fetch on every path, including the one
    // where they are not configured. Counting the viz table only when vizUrl was set let a
    // page without one reach the total a fetch early, and render with a section still missing
    totalFetches = reportConfig.sections.length + 1 + 1;

    // Hook accordion expansion before data arrives so first open can render immediately
    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);
    $(document).on('shown.bs.collapse hidden.bs.collapse', '.nr-report-accordion .collapse', updateAccordionToggle);

    const accordionToggle = document.getElementById('nr-toggle-accordions');
    if (accordionToggle) accordionToggle.addEventListener('click', toggleAllAccordions);

    // Back and Forward across in-place switches re-render from the entry's state
    // (setNeighborhoodInURL writes it). An entry with no state, such as one a #fragment link
    // added, or the neighborhood already shown, needs nothing; before the first render the
    // initial render is still coming and will draw the page's own neighborhood
    
    window.addEventListener('popstate', event => {

        const name = event.state && event.state.neighborhood;

        if (!name || !dataReady || name === currentNeighborhood) {
            debugLog('popstate: branch-nothing-to-render:', { name, dataReady });
            return;
        }

        const layer = findLayerByName(name);
        if (layer) selectLayer(layer);

        renderAll(name, undefined, true);

    });

    // Start map and data loads in parallel
    initLeafletMap();

    reportConfig.sections.forEach(section => {
        loadSection(section);
    });

    loadTopicIndicators();
    loadVizData();

};


bootstrap();
