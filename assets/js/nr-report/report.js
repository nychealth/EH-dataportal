// ======================================================================= //
// report.js
// ======================================================================= //

// Returns the distinct data notes carried by a section's rows, in first-appearance order.
//
// A flagged value ships with its marker baked into the string ("6.1*", "N/A**") and the
// sentence explaining it in a sibling nbr_data_note field. Distinct rather than per-row:
// one sentence covers every row in the section carrying that marker, and a section holds
// at most two of them [measured 2026-09-15 over the 8 asthma report JSONs on the
// production data branch: 113 of 336 (neighborhood, section) pairs carry any note, 109
// of those exactly one].
//
// The guard tests the string, not the key. nbr_data_note is present on every row and
// empty on most of them — production's `isset .data "nbr_data_note"` guard is why the
// live page emits 22 .data-note divs of which 4 have text
const collectDataNotes = rows => {

    const notes = rows
        .map(row => (typeof row.nbr_data_note === 'string' ? row.nbr_data_note.trim() : ''))
        .filter(note => note);

    return [...new Set(notes)];

};


// Appends the section's data-note legend, so a marker in the always-visible card header can
// be read without expanding a panel.
//
// Placement is outside every .collapse deliberately, and that is what decided per-section
// over restoring production's per-row note: theme.scss hides `.report-section .collapse` in
// print with !important, on purpose, so a note inside a panel cannot reach the printed
// report at all — on this branch or on production [verified 2026-09-15: print-emulated
// innerText, panels forced open, note found in screen media and not in print].
//
// Built from the section's rows rather than from what the reader has expanded, so screen
// and print carry the same legend. textContent rather than an innerHTML concatenation
// because the text is prose from EHDP-data and needs no markup
const renderSectionNotes = (container, rows) => {

    const notes = collectDataNotes(rows);

    if (!notes.length) {
        debugLog('renderSectionNotes: branch-no-notes:', container.id);
        return;
    }

    debugLog('renderSectionNotes: rendering:', { containerId: container.id, count: notes.length });

    const wrapper = document.createElement('div');
    wrapper.className = 'nr-section-notes px-2 pt-2 pb-1';

    notes.forEach(note => {

        const line = document.createElement('p');
        line.textContent = note;
        wrapper.appendChild(line);

    });

    container.appendChild(wrapper);

};


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

    // Last, so the legend sits beneath the cards whose markers it explains
    renderSectionNotes(container, rows);

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


// Rewrites <title> and announces the switch, once the rebuilt report is in place.
//
// The title is rebuilt from the same two parts head.html composes .Params.seo_title from,
// rather than patched, so it cannot drift from the string the server sent. seoShortName is
// carried separately from reportName because the two differ on Active Design.
//
// The announcement is suppressed when nothing changed — renderAll also runs at load, and a
// reader who clicks the neighborhood already shown has moved nowhere. A role="status" region
// announces on content change, so writing the same string twice would say nothing anyway;
// returning early keeps that a deliberate contract rather than a coincidence
const announceNeighborhoodChange = (neighborhoodName, previousNeighborhood) => {

    if (reportConfig.seoShortName) {
        document.title = reportConfig.seoShortName + ' in ' + neighborhoodName;
    }

    if (!previousNeighborhood || previousNeighborhood === neighborhoodName) {
        debugLog('announceNeighborhoodChange: branch-nothing-changed:', { neighborhoodName, previousNeighborhood });
        return;
    }

    const status = document.getElementById('nr-report-status');

    if (!status) {
        debugLog('announceNeighborhoodChange: branch-missing-status-region');
        return;
    }

    status.textContent = 'Report updated. Now showing ' +
        (reportConfig.seoShortName || reportConfig.reportName || 'this report') +
        ' in ' + neighborhoodName + '.';

};


// Rebuilds the whole report for one neighborhood: cards, headers, demographics, URL
const renderAll = (neighborhoodName, mapGeocode) => {

    debugLog('renderAll: enter:', { neighborhoodName, mapGeocode });

    // ----- reset per-render state ----- //

    // Read before the overwrite below: it is null until the first render finishes, which is
    // what distinguishes first paint from an in-place switch for the announcement
    const previousNeighborhood = currentNeighborhood;

    // Record the active neighborhood used by downloads and rerenders
    currentNeighborhood = neighborhoodName;
    renderedPanels = {};
    accordionCounter = 0;

    // ----- resolve geocode ----- //

    currentGeocode = resolveGeocode(neighborhoodName, mapGeocode);

    // ----- render sections ----- //

    reportConfig.sections.forEach(section => {
        renderSection(section, neighborhoodName);
    });

    updateAccordionToggle();

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
    // than once at load. Defined in nr-report.html, which owns the qrcode library
    if (typeof renderQRCode === 'function') {
        renderQRCode();
    }

    // ----- announce ----- //

    // Last, so the region's text is written against a report that is already rebuilt
    announceNeighborhoodChange(neighborhoodName, previousNeighborhood);

};
