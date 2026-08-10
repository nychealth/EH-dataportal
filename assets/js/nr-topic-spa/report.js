// ======================================================================= //
// report.js
// ======================================================================= //

// Fills one section's container with that neighborhood's cards, or a no-data message
const renderSection = (section, neighborhoodName) => {

    debugLog('renderSection: enter:', { sectionId: section.id, neighborhoodName });

    // Section containers are layout-driven and may be absent in some templates
    const container = document.getElementById(section.containerId);

    if (!container) {
        debugLog('renderSection: branch-missing-container:', section.containerId);
        return;
    }

    // Neighborhood-level rows are pre-grouped during loadSection
    const byNeighborhood = sectionData[section.id] || {};
    const rows = byNeighborhood[neighborhoodName] || [];

    // Reset section contents before re-rendering cards
    container.innerHTML = '';

    if (!rows.length) {
        debugLog('renderSection: branch-no-rows:', { sectionId: section.id, neighborhoodName });
        container.innerHTML =
            '<p class="text-muted px-2 pb-2 mb-0">No data available for this neighborhood.</p>';
        return;
    }

    rows.forEach(row => {

        const card = document.createElement('div');
        card.innerHTML = buildIndicatorCard(row, neighborhoodName);
        container.appendChild(card);

    });

};


// Finds the UHF geocode for a neighborhood, preferring the sources most likely to
// agree with the report rows: loaded rows first, then the clicked map layer, then a
// name lookup against uhflist. Returns null when none of the three resolve
const resolveGeocode = (neighborhoodName, mapGeocode) => {

    // ----- from rows already loaded ----- //

    for (const sid in sectionData) {

        const nb = sectionData[sid][neighborhoodName];

        if (nb && nb.length) {

            const row0 = nb[0];
            const gj = !isBlank(row0.geo_join_id) ? row0.geo_join_id : row0.geo_entity_id;

            if (!isBlank(gj)) {
                debugLog('resolveGeocode: branch-found-geocode-in-section:', { sectionId: sid, geocode: gj });
                return gj;
            }

        }

    }

    // ----- from the map click ----- //

    if (!isBlank(mapGeocode)) {
        debugLog('resolveGeocode: branch-fallback-map-geocode:', mapGeocode);
        return mapGeocode;
    }

    // ----- from display-name lookup ----- //

    debugLog('resolveGeocode: branch-fallback-display-name-lookup:', neighborhoodName);

    return getUhfIdForDisplayName(neighborhoodName);

};


// Rebuilds the whole report for one neighborhood: cards, headers, demographics, URL
const renderAll = (neighborhoodName, mapGeocode) => {

    debugLog('renderAll: enter:', { neighborhoodName, mapGeocode });

    // ----- reset per-render state ----- //

    // Record the active neighborhood used by downloads and rerenders
    currentNeighborhood = neighborhoodName;
    renderedPanels = {};
    accordionCounter = 0;

    // ----- resolve geocode ----- //

    currentGeocode = resolveGeocode(neighborhoodName, mapGeocode);

    // ----- render sections ----- //

    spaConfig.sections.forEach(section => {
        renderSection(section, neighborhoodName);
    });

    // ----- fill headers ----- //

    // Both header blocks are display:none in the layout until a neighborhood is picked
    const reportHeader = document.getElementById('nr-report-header');
    const headerNeighborhood = document.getElementById('nr-header-neighborhood');

    if (reportHeader) {
        reportHeader.style.display = '';
    }

    if (headerNeighborhood) {
        headerNeighborhood.textContent = neighborhoodName;
    }

    // The narrow layout carries its own copy of the title
    const mobileTitle = document.getElementById('nr-mobile-title');
    const mobileNeighborhood = document.getElementById('nr-mobile-neighborhood');

    if (mobileTitle) mobileTitle.style.display = '';
    if (mobileNeighborhood) mobileNeighborhood.textContent = neighborhoodName;

    // ----- demographics and deep-link state ----- //

    // Sidebar metrics are keyed by geocode, so this has to follow the resolution above
    renderDemographics(currentGeocode);

    // Synchronize deep-link state after the page content has been refreshed
    setNeighborhoodInURL(neighborhoodName);
    updateTopicLinks(neighborhoodName);

    // The printed report carries a QR code back to itself, and the map can switch
    // neighborhood in place — so it has to be regenerated from the rewritten URL rather
    // than once at load. Defined in nr-topic-spa.html, which owns the qrcode library
    if (typeof renderQRCode === 'function') {
        renderQRCode();
    }

};
