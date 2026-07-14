// ======================================================================= //
// print.js
// ======================================================================= //

// Save-modal rendering for the new explorer.
// Charts still use Vega's built-in export actions, while maps are exported
// by compositing the current Leaflet DOM into a PNG preview.

// console.log(" >> print.js");

const printVis = document.getElementById('printVis');
const printModalInstructions = document.getElementById('printModalInstructions');
const printModalDownload = document.getElementById('printModalDownload');
const modalFootnotes = document.getElementById('modalFootnotes');


// ----------------------------------------------------------------------- //
// modal helpers
// ----------------------------------------------------------------------- //

// Keeps modal copy and controls in one place so map and chart exports can
// share the same shell without duplicating DOM mutations.
const setPrintModalState = ({
    instructions = '',
    contentHTML = '',
    footnotesHTML = '',
    showDownload = false,
    downloadHref = '',
    downloadName = '',
    downloadLabel = 'Download PNG'
}) => {

    if (printModalInstructions) {
        printModalInstructions.textContent = instructions;
    }

    if (printVis) {
        printVis.innerHTML = contentHTML;
        printVis.scrollTop = 0;
    }

    if (modalFootnotes) {
        modalFootnotes.innerHTML = footnotesHTML;
        modalFootnotes.classList.toggle('hide', !modalFootnotes.textContent.trim());
    }

    if (printModalDownload) {
        printModalDownload.textContent = downloadLabel;
        printModalDownload.href = downloadHref || '#';

        if (downloadName) {
            printModalDownload.setAttribute('download', downloadName);
        } else {
            printModalDownload.removeAttribute('download');
        }

        printModalDownload.classList.toggle('d-none', !showDownload);
    }

};


// Displays the print/export modal using Bootstrap's jQuery modal API.
const openPrintModal = () => {
    $('#printModal').modal('show');
};


// Puts the modal into a "preparing preview" placeholder state while an export renders.
const showPrintLoadingState = (message) => {

    setPrintModalState({
        instructions: message,
        contentHTML: '<div class="d-flex align-items-center justify-content-center h-100 text-muted">Preparing visualization preview...</div>',
        footnotesHTML: '',
        showDownload: false
    });

};


// Puts the modal into a warning-styled error state and hides the download control.
const showPrintErrorState = (message) => {

    setPrintModalState({
        instructions: 'The current visualization could not be prepared for download.',
        contentHTML: `<div class="alert alert-warning mb-0" role="alert">${message}</div>`,
        footnotesHTML: '',
        showDownload: false
    });

};


// ----------------------------------------------------------------------- //
// shared formatting helpers
// ----------------------------------------------------------------------- //

// Deep-clones a Vega spec via JSON round-trip so preview rendering can't mutate the shared spec.
const clonePrintSpec = (spec) => {

    if (!spec) {
        return null;
    }

    return JSON.parse(JSON.stringify(spec));

};


// ----------------------------------------------------------------------- //
// chart export
// ----------------------------------------------------------------------- //

// Returns the pre-rendered unreliability-footnote HTML for the current chart type, if any.
const getChartFootnotesHTML = () => {

    switch (DE.print.chartType) {
        case 'trend':
            return document.getElementById('trend-unreliability')?.innerHTML || '';

        case 'links':
        case 'disparities':
            return document.getElementById('links-unreliability')?.innerHTML || '';

        default:
            return '';
    }

};


// Clones the current spec and embeds it via vegaEmbed for the modal preview, showing an error state on failure.
const renderChartPreview = () => {

    const spec = clonePrintSpec(DE.print.printSpec);

    if (!spec) {
        showPrintErrorState('Nothing is available to save for this view yet.');
        return;
    }

    setPrintModalState({
        instructions: 'Use the chart menu in the upper-right corner to save as PNG or SVG.',
        contentHTML: '',
        footnotesHTML: getChartFootnotesHTML(),
        showDownload: false
    });

    vegaEmbed('#printVis', spec, {
        actions: {
            export: { png: true, svg: true },
            source: false,
            compiled: false,
            editor: true
        }
    }).catch(() => {
        showPrintErrorState('This chart preview could not be rendered.');
    });

    setTimeout(updateChartPlotSize, 1000);

};


// ----------------------------------------------------------------------- //
// public modal entrypoint
// ----------------------------------------------------------------------- //

// Public entry point that tracks the event, opens the modal, and renders the chart preview.
const openChartSaveModal = () => {

    trackDataExplorerPrintView(DE.print.chartType || DE.state.overlay || 'chart');
    openPrintModal();
    renderChartPreview();

};

// Public entry point that tracks the event, opens the modal, and renders the map preview.
const openMapSaveModal = () => {

    trackDataExplorerPrintView('map');
    openPrintModal();
    renderMapPreview();

};


// Wires click handlers for the map-save, chart-save, and download-tracking controls.
const bindPrintControls = () => {

    // ----- bind the map-save button ----- //

    // These triggers live in server-rendered partials, so keep the modal
    // entrypoints private here instead of exporting window-level helpers.
    const mapSaveButton = document.getElementById('deSaveMapButton');

    if (mapSaveButton) {
        mapSaveButton.addEventListener('click', event => {
            event.preventDefault();
            openMapSaveModal();
        });
    }

    // ----- bind chart-save buttons ----- //

    const chartSaveButtons = document.querySelectorAll('.de-save-chart-button[data-print-target="chart"]');

    chartSaveButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            openChartSaveModal();
        });
    });

    // ----- bind download-link tracking ----- //

    if (printModalDownload) {
        printModalDownload.addEventListener('click', () => {

            const fileName = printModalDownload.getAttribute('download');

            if (!fileName) {
                return;
            }

            trackDataExplorerFileDownload({
                fileName,
                fileExtension: '.png',
                linkText: printModalDownload.textContent.trim() || 'Download PNG'
            });

        });
    }

};


bindPrintControls();