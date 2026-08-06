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
        (spaConfig.reportName || 'Report') + ' - ' + currentNeighborhood + '.csv';

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
// bootstrap
// ----------------------------------------------------------------------- //

// Entry point: verifies the page contract, then wires events and starts the loads
const bootstrap = () => {

    debugLog('bootstrap: start');

    if (!spaConfig || !spaConfig.sections || !spaConfig.sections.length) {
        debugLog('bootstrap: missing-config:', spaConfig);
        return;
    }

    if (!document.getElementById('nr-map')) {
        debugLog('bootstrap: missing-map-container');
        return;
    }

    // Deferred to here rather than computed beside fetchesComplete, because the
    // section count is only trustworthy once the guard above has passed
    totalFetches = spaConfig.sections.length + (spaConfig.vizUrl ? 1 : 0);

    // Hook accordion expansion before data arrives so first open can render immediately
    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);

    // Start map and data loads in parallel
    initLeafletMap();

    spaConfig.sections.forEach(section => {
        loadSection(section);
    });

    loadVizData();

};


bootstrap();
