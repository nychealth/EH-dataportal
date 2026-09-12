// ======================================================================= //
// report.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// indicator rendering
// ----------------------------------------------------------------------- //

// Fills the single indicator container with this district's cards, or a no-data message.
//
// One container, not one per section: the NDHR content YAML has no report_topics layer —
// neither NDHR source document groups indicators below the five categories — so there is
// no second heading level to render and no per-section loop to run
const renderIndicators = districtName => {

    debugLog('renderIndicators: enter:', { districtName, rowCount: indicatorRows.length });

    const container = document.getElementById('ndhr-indicators');

    if (!container) {
        debugLog('renderIndicators: branch-missing-container');
        return;
    }

    container.innerHTML = '';

    if (!indicatorRows.length) {
        debugLog('renderIndicators: branch-no-rows:', districtName);
        container.innerHTML =
            '<p class="text-muted px-2 pb-2 mb-0">No data available for this community district.</p>';
        return;
    }

    // Rows are rendered in the order the content YAML lists them, which is the order the
    // NDHR source documents list the indicators in. NR instead sorts by rank descending,
    // because its rows arrive from a payload with no authored order to preserve
    indicatorRows.forEach(row => {

        const card = document.createElement('div');
        card.innerHTML = buildIndicatorCard(row, districtName);
        container.appendChild(card);

    });

};


// Shows a placeholder in the indicator container while a switched district's rows build.
// The rows are computed from several fetches rather than read from one payload, so this
// gap is real and visible — leaving the previous district's cards on screen under a new
// district's heading would be the wrong thing to show during it
const showIndicatorsLoading = () => {

    const container = document.getElementById('ndhr-indicators');

    if (container) {
        container.innerHTML = '<p class="text-muted px-2 pb-2 mb-0">Loading indicators…</p>';
    }

};


// ----------------------------------------------------------------------- //
// headers and announcement
// ----------------------------------------------------------------------- //

// Rewrites <title> and announces the switch, once the rebuilt report is in place.
//
// The title is rebuilt from the same part head.html composes .Params.seo_title from,
// rather than patched, so it cannot drift from the string the server sent.
//
// The announcement is suppressed when nothing changed — renderAll also runs at load, and a
// reader who clicks the district already shown has moved nowhere. A role="status" region
// announces on content change, so writing the same string twice would say nothing anyway;
// returning early keeps that a deliberate contract rather than a coincidence
const announceDistrictChange = (districtName, previousDistrict) => {

    if (reportConfig.seoShortName) {
        document.title = reportConfig.seoShortName + ' in ' + districtName;
    }

    if (!previousDistrict || previousDistrict === districtName) {
        debugLog('announceDistrictChange: branch-nothing-changed:', { districtName, previousDistrict });
        return;
    }

    const status = document.getElementById('ndhr-report-status');

    if (!status) {
        debugLog('announceDistrictChange: branch-missing-status-region');
        return;
    }

    status.textContent = 'Report updated. Now showing ' +
        (reportConfig.seoShortName || reportConfig.reportName || 'this report') +
        ' in ' + districtName + '.';

};


// Fills both header blocks, which the layout renders display:none until a district resolves
const renderHeaders = districtName => {

    const reportHeader = document.getElementById('ndhr-report-header');
    const headerDistrict = document.getElementById('ndhr-header-district');

    if (reportHeader) {
        reportHeader.style.display = '';
    }

    if (headerDistrict) {
        headerDistrict.textContent = districtName;
    }

    // The narrow layout carries its own copy of the title
    const mobileTitle = document.getElementById('ndhr-mobile-title');
    const mobileDistrict = document.getElementById('ndhr-mobile-district');

    if (mobileTitle) mobileTitle.style.display = '';
    if (mobileDistrict) mobileDistrict.textContent = districtName;

};


// ----------------------------------------------------------------------- //
// full render
// ----------------------------------------------------------------------- //

// Rebuilds the whole report for one district: cards, headers, demographics, URL.
//
// Split into a synchronous half and an asynchronous one, which NR does not need. Everything
// the server already knows — the name, the sidebar, the address bar, the QR code — renders
// at once; the indicator rows are computed from EHDP-data and land when they land
const renderAll = districtName => {

    debugLog('renderAll: enter:', districtName);

    // ----- reset per-render state ----- //

    // Read before the overwrite below: it is '' until the first render finishes, which is
    // what distinguishes first paint from an in-place switch for the announcement
    const previousDistrict = currentDistrict;

    currentDistrict = districtName;
    currentGeoIds = geoIdsForDistrict(districtName);
    renderedPanels = {};
    accordionCounter = 0;

    // ----- indicator rows ----- //

    if (rowsDistrict === districtName) {

        renderIndicators(districtName);

    } else {

        // A switch the rows have not caught up with. Render the placeholder now, then
        // re-enter renderAll when they arrive — by which point rowsDistrict matches and
        // this branch is not taken again
        debugLog('renderAll: branch-rows-stale:', { districtName, rowsDistrict });
        showIndicatorsLoading();

        loadDistrictRows(districtName).then(result => {

            // Another switch may have landed while this one was in flight; only the
            // district currently on screen may write the shared row state
            if (currentDistrict !== districtName) {
                debugLog('renderAll: branch-discard-stale-rows:', { districtName, currentDistrict });
                return;
            }

            indicatorRows = result.rows || [];
            indicatorSeries = result.series || {};
            rowsDistrict = districtName;

            accordionCounter = 0;
            renderedPanels = {};

            renderIndicators(districtName);
            updateAccordionToggle();

        });

    }

    updateAccordionToggle();

    // ----- headers ----- //

    renderHeaders(districtName);

    // ----- demographics and deep-link state ----- //

    // Sidebar metrics are keyed by CD id, so this has to follow the geoIds resolution above
    renderDemographics(currentGeoIds ? currentGeoIds.CD : null);

    // Synchronize deep-link state after the page content has been refreshed
    setDistrictInURL(districtName);
    updateCategoryLinks(districtName);

    // The printed report carries a QR code back to itself, and the map can switch district
    // in place — so it has to be regenerated from the rewritten URL rather than once at
    // load. Defined in ndhr-report.html, which owns the qrcode library
    if (typeof renderQRCode === 'function') {
        renderQRCode();
    }

    // ----- announce ----- //

    // Last, so the region's text is written against a report that is already rebuilt
    announceDistrictChange(districtName, previousDistrict);

};
