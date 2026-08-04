// ======================================================================= //
// nr-topic-spa.js
// ======================================================================= //

// Topic-centric Neighborhood Reports viewer: a Leaflet neighborhood selector
// driving an accordion of indicator cards with Vega map and bar charts
//
// Expects window.NR_TOPIC_SPA_CONFIG set by the Hugo layout with:
//   - sections: array of { id, containerId, reportUrl } objects, one per report_topic
//   - geojsonUrl: URL to UHF42 GeoJSON for the Leaflet selector map
//   - vizUrl: EHDP-data viz JSON URL for map/chart rendering
//   - dataRepo: base URL for EHDP-data (used to build geography TopoJSON URLs)
//   - dataBranch: branch name for EHDP-data
//
// Features:
//   - Interactive Leaflet map as sole neighborhood selector
//   - Accordion expand/collapse per indicator row with detail panel
//   - Vega choropleth map + bar chart rendered on first accordion expand
//   - Borough/city comparison logic with judgment styling
//   - Demographics sidebar populated from uhflist.js
//   - Neighborhood persistence via path + sessionStorage bridging

// Named init function used in place of an IIFE so early returns remain available
const init = () => {

    debugLog('bootstrap: start');

    // Read server-injected SPA configuration from the global scope
    const config = window.NR_TOPIC_SPA_CONFIG;

    if (!config || !config.sections || !config.sections.length) {
        debugLog('bootstrap: missing-config:', config);
        return;
    }

    if (!document.getElementById('nr-map')) {
        debugLog('bootstrap: missing-map-container');
        return;
    }


    // ----------------------------------------------------------------------- //
    // shared state
    // ----------------------------------------------------------------------- //

    // Per-section data store: sectionId -> { neighborhoodName -> rows[] }
    const sectionData = {};

    // Arquero table for the viz dataset (all indicators, all neighborhoods)
    let vizTable = null;

    // Track which accordion panels have already had their chart rendered
    let renderedPanels = {};

    // Track loading: sections + viz = total fetches needed before first render
    const totalFetches = config.sections.length + (config.vizUrl ? 1 : 0);
    let fetchesComplete = 0;

    // Current neighborhood and geocode, updated on switch
    let currentNeighborhood = '';
    let currentGeocode = null;

    // Leaflet map and GeoJSON layer references
    let leafletMap = null;
    let uhfLayer = null;
    let dataReady = false;
    let mapReady = false;


    // ----------------------------------------------------------------------- //
    // neighborhood persistence
    // ----------------------------------------------------------------------- //

    // Resolves the neighborhood for this page load, from the path first and the bridge second
    const getNeighborhoodFromURL = () => {

        // ----- step 1: neighborhood slug in the path ----- //

        // Covers externally shared and bookmarked URLs like
        //   /neighborhood-reports/asthma_and_the_environment/east_new_york
        // On production IIS rewrites those to serve the topic page, leaving the slug
        // visible in the path for this lookup to read
        const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const slug = pathParts[pathParts.length - 1];

        debugLog('getNeighborhoodFromURL: enter:', { pathname: window.location.pathname, slug });

        if (config.neighborhoodMap[slug]) {
            return config.neighborhoodMap[slug];
        }

        // ----- step 2: the sessionStorage bridge ----- //

        // Covers internal navigation from the landing page, topic tabs, neighborhood
        // cards, and the 404 fallback. Each of those stores the slug before navigating
        // to the clean topic URL, so the page load never reaches the server with a
        // neighborhood in the path
        const pending = sessionStorage.getItem('nr_pending_neighborhood');

        // Consumed on read so it cannot bleed into a later page load in the same tab
        if (pending && config.neighborhoodMap[pending]) {
            sessionStorage.removeItem('nr_pending_neighborhood');
            return config.neighborhoodMap[pending];
        }

        return '';

    };


    // Rewrites the address bar to carry the neighborhood, making the current view shareable
    const setNeighborhoodInURL = name => {

        debugLog('setNeighborhoodInURL: enter:', name);

        // ----- resolve the slug for this neighborhood ----- //

        const slug = Object.keys(config.neighborhoodMap).find(k => config.neighborhoodMap[k] === name);

        if (!slug) {
            return;
        }

        // ----- splice it in after the topic segment ----- //

        // Replacing everything after the topic slug, rather than appending to the current
        // path, preserves any site path prefix (e.g. /dev-prod/) and is idempotent when a
        // neighborhood slug is already present
        const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const topicIdx = pathParts.findIndex(p => p === config.topicSlug);

        if (topicIdx === -1) {
            return;
        }

        const newPath = '/' + pathParts.slice(0, topicIdx + 1).join('/') + '/' + slug;

        // replaceState rather than a navigation: the SPA has already rendered this
        // neighborhood, so the path change is cosmetic — it makes the URL shareable and
        // bookmarkable without a reload or a server request
        history.replaceState(null, '', newPath);

    };


    // Arms every topic tab to carry the current neighborhood over to the topic it opens
    const updateTopicLinks = neighborhoodName => {

        debugLog('updateTopicLinks: enter:', neighborhoodName);

        // The neighborhood travels through sessionStorage rather than the link href: a
        // href carrying the neighborhood 404s in dev and depends on the IIS rewrite in
        // production, so the slug is stored as the navigation fires and read back by
        // getNeighborhoodFromURL on the next page load
        const slug = Object.keys(config.neighborhoodMap).find(k => config.neighborhoodMap[k] === neighborhoodName);
        const links = document.querySelectorAll('.nr-topic-link');

        links.forEach(a => {

            a.onclick = () => {
                if (slug) {
                    sessionStorage.setItem('nr_pending_neighborhood', slug);
                }
            };

        });

    };


    // ----------------------------------------------------------------------- //
    // tertile and comparison helpers
    // ----------------------------------------------------------------------- //

    // Reduces a tertile rank to the bare "Higher"/"Lower" word shown on the card pill
    const getTertileLabel = (rank, rankReverse) => {

        // Normalize rank values that may arrive as numbers or strings
        const r = String(rank);
        // rankReverse indicates indicators where lower values are directionally better
        const reverse = rankReverse === true || rankReverse === 'true';

        if (r === '1') {
            return reverse ? 'Lower' : 'Higher';
        }

        if (r === '2') {
            return '';
        }

        if (r === '3') {
            return reverse ? 'Higher' : 'Lower';
        }

        return '';

    };


    // Returns the pill class the production report styling expects: worse, better, or middle
    const getTertilePillClass = (rank, rankReverse) => {

        const r = String(rank);
        const reverse = rankReverse === true || rankReverse === 'true';

        if (r === '1') return reverse ? 'better' : 'worse';
        if (r === '3') return reverse ? 'worse' : 'better';
        if (r === '2') return 'middle';

        return '';

    };


    // Expands the same rank into a full sentence fragment with the judgment word colored
    const getTertileInlineLabel = (rank, rankReverse) => {

        const r = String(rank);
        const reverse = rankReverse === true || rankReverse === 'true';

        if (r === '1') {
            return reverse
                ? '<span class="comp-good">Lower</span> than most neighborhoods'
                : '<span class="comp-bad">Higher</span> than most neighborhoods';
        }

        if (r === '2') {
            return '<span class="comp-null">In the middle of</span> neighborhoods';
        }

        if (r === '3') {
            return reverse
                ? '<span class="comp-bad">Higher</span> than most neighborhoods'
                : '<span class="comp-good">Lower</span> than most neighborhoods';
        }

        return '';

    };


    // Compares a neighborhood value against a borough or city value, with the judgment class
    const getComparison = (neighVal, refVal, rankReverse) => {

        // Parse defensively because the source payload can contain string numerics
        const n = Number(neighVal);
        const r = Number(refVal);
        const reverse = rankReverse === true || rankReverse === 'true';

        // When either side is not numeric, omit comparison messaging
        if (isNaN(n) || isNaN(r)) {
            return { text: '', cssClass: '' };
        }

        let comp;
        let cls;

        // rankReverse flips "good" vs "bad" judgment for metrics where lower values are better
        if (n > r) {
            comp = 'Higher than';
            cls = reverse ? 'comp-good' : 'comp-bad';
        } else if (n < r) {
            comp = 'Lower than';
            cls = reverse ? 'comp-bad' : 'comp-good';
        } else {
            comp = 'Equal to';
            cls = 'comp-null';
        }

        return { text: comp, cssClass: cls };

    };


    // ----------------------------------------------------------------------- //
    // id, escaping, and name lookup
    // ----------------------------------------------------------------------- //

    // Cards are numbered in one sequence across all sections, in render order
    let accordionCounter = 0;

    // Generates the unique id that pairs a collapse control with its panel
    const nextAccordionId = () => 'nr-acc-' + (++accordionCounter);


    // Escapes a value for interpolation into a double-quoted HTML attribute
    const escapeAttr = value => {

        if (value == null) return '';
        return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

    };


    // uhflist.js has one known typo: "Crotona -Tremont" (missing space after dash)
    // EHDP-data report JSONs use "Crotona - Tremont". This map corrects it so
    // lookups against report data and sidebar demographics stay aligned
    const nameCorrections = {
        'Crotona -Tremont': 'Crotona - Tremont'
    };


    // Looks up a neighborhood's UHF id from the display name shown in the UI
    const getUhfIdForDisplayName = displayName => {

        // Neighborhood metadata may not be loaded in every page context
        if (!displayName || typeof neighborhoods === 'undefined') return null;

        const entry = neighborhoods.find(n => {
            const corrected = nameCorrections[n.UHF_name] || n.UHF_name;
            return corrected === displayName;
        });

        return entry ? entry.UHF_id : null;

    };


    // ----------------------------------------------------------------------- //
    // demographics sidebar
    // ----------------------------------------------------------------------- //

    // Blanks every sidebar metric and hides both panels, for when no neighborhood resolves
    const clearDemographicsSidebar = () => {

        const metricIds = [
            'nr-pop',
            'nr-old',
            'nr-young',
            'nr-pov',
            'nr-grad',
            'nr-eng',
            'nr-own',
            'nr-rent'
        ];

        // Clear each field explicitly so stale values do not persist between selections
        metricIds.forEach(id => {
            const node = document.getElementById(id);
            if (node) node.innerHTML = '';
        });

        const zipList = document.getElementById('nr-zip-list');
        if (zipList) zipList.textContent = '';

        const demoPanel = document.getElementById('nr-demographics');
        if (demoPanel) demoPanel.style.display = 'none';

        const zipPanel = document.getElementById('nr-zip-codes');
        if (zipPanel) zipPanel.style.display = 'none';

    };


    // Fills the sidebar from the uhflist row matching geocode, clearing it if there is none
    const renderDemographics = geocode => {

        debugLog('renderDemographics: enter:', geocode);

        if (typeof neighborhoods === 'undefined' || geocode == null || geocode === '') {
            debugLog('renderDemographics: branch-clear-missing-neighborhoods-or-geocode');
            clearDemographicsSidebar();
            return;
        }

        const here = neighborhoods.filter(n => n.UHF_id == geocode);

        if (!here.length) {
            debugLog('renderDemographics: branch-clear-no-match:', geocode);
            clearDemographicsSidebar();
            return;
        }

        const d = here[0];

        // The sidebar has a fixed set of target nodes, so keep the mapping explicit
        const el = id => document.getElementById(id);

        if (el('nr-pop'))   el('nr-pop').innerHTML   = Number(d.TotalPopulation).toLocaleString();
        if (el('nr-old'))   el('nr-old').innerHTML   = Number(d.PercentOver65).toFixed(1) + '%';
        if (el('nr-young')) el('nr-young').innerHTML = Number(d.PercentUnder18).toFixed(1) + '%';
        if (el('nr-pov'))   el('nr-pov').innerHTML   = Number(d.PovertyPercent).toFixed(1) + '%';
        if (el('nr-grad'))  el('nr-grad').innerHTML  = Number(d.PercentGraduatedHighSchool).toFixed(1) + '%';
        if (el('nr-eng'))   el('nr-eng').innerHTML   = Number(d.PercentLimitedEnglish).toFixed(1) + '%';
        if (el('nr-own'))   el('nr-own').innerHTML   = Number(d.PercentOwnerOccupied).toFixed(1) + '%';
        if (el('nr-rent'))  el('nr-rent').innerHTML  = Number(d.PercentRentBurdened).toFixed(1) + '%';

        const demoPanel = document.getElementById('nr-demographics');
        if (demoPanel) demoPanel.style.display = '';

        if (el('nr-zip-list')) {
            el('nr-zip-list').textContent = d.Zipcodes || '';
        }

        const zipPanel = document.getElementById('nr-zip-codes');
        if (zipPanel && d.Zipcodes) zipPanel.style.display = '';

    };


    // ----------------------------------------------------------------------- //
    // indicator card rendering
    // ----------------------------------------------------------------------- //

    // Returns one indicator's accordion HTML — header button plus its collapse panel
    const buildIndicatorCard = (row, neighborhoodName, accordionParentId) => {

        // ----- resolve ids, value, and units ----- //

        const accId = nextAccordionId();
        const headingId = accId + '-h';
        const collapseId = accId + '-c';

        // Preserve dash placeholder when the row has no direct neighborhood value
        const value =
            row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
                ? row.data_value_geo_entity
                : '–';

        // Build a compact units label from optional type and unit fields
        const unitParts = [];
        if (row.measurement_type) unitParts.push(row.measurement_type);
        if (row.units) unitParts.push(row.units);
        const units = unitParts.join(' ').trim();

        // ----- tertile pill ----- //

        // Tertile pill for the header row (production uses .worse/.better/.middle classes)
        const pillLabel = getTertileLabel(row.data_value_rank, row.rankReverse);
        const pillClass = getTertilePillClass(row.data_value_rank, row.rankReverse);
        let pillHTML = '';

        if (pillLabel && pillClass) {
            pillHTML = '<span class="' + pillClass + '">' + pillLabel + '</span>';
        }

        // ----- header HTML ----- //

        const headerHTML =
            '<div class="card-header border-top" id="' + headingId + '">' +
                '<h2 class="mb-0">' +
                    '<button class="btn btn-block btn-sm text-left" type="button" ' +
                        'data-toggle="collapse" data-target="#' + collapseId + '" ' +
                        'aria-expanded="false" aria-controls="' + collapseId + '">' +
                        '<div class="row no-gutters d-print-none" style="width:100%">' +
                            '<div class="col-7">' +
                                '<span class="font-weight-bold fs-md">' + (row.indicator_short_name || '') + '</span><br>' +
                                '<span class="fs-sm font-weight-normal">' + (row.indicator_long_name || '') + '</span>' +
                            '</div>' +
                            '<div class="col-3 pl-1">' +
                                '<span class="font-weight-bold fs-lg">' + value + '</span><br>' +
                                '<span class="fs-xs font-weight-normal">' + units + '</span>' +
                            '</div>' +
                            '<div class="col-2">' +
                                '<div class="float-right mt-1">' + pillHTML + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</button>' +
                '</h2>' +
            '</div>';

        // ----- comparison blocks ----- //

        // Some indicators do not have comparative rank metadata
        const hasRank = row.data_value_rank != null;

        // Comparison blocks rely on the unmodified values for direction and text
        const boroComp = getComparison(
            row.unmodified_data_value_geo_entity,
            row.data_value_boro,
            row.rankReverse
        );

        const cityComp = getComparison(
            row.unmodified_data_value_geo_entity,
            row.data_value_nyc,
            row.rankReverse
        );

        const boroName = row.borough_name || 'Borough';
        const boroVal = row.data_value_boro != null ? row.data_value_boro : '';
        const cityVal = row.data_value_nyc != null ? row.data_value_nyc : '';

        let unitSuffix = '';

        // Use percent suffix for percentage-like metrics, otherwise append units
        if (row.measurement_type && row.measurement_type.toLowerCase().indexOf('ercent') !== -1) {
            unitSuffix = '%';
        } else if (row.units) {
            unitSuffix = ' ' + row.units;
        }

        const tertileInlineHTML = getTertileInlineLabel(row.data_value_rank, row.rankReverse);

        // Hide comparison copy when rank-derived context is unavailable
        const hideClass = hasRank ? '' : ' d-none';

        const comparisonsHTML =
            '<div class="col-md-5 h-100 p-1' + hideClass + '">' +
                '<p class="fs-rg">' + (row.indicator_short_name || '') + ' in <strong>' + neighborhoodName + '</strong>:</p>' +
                '<div class="fs-md">' +
                    (tertileInlineHTML
                        ? '<p>' + tertileInlineHTML + '</p>'
                        : '') +
                    (boroComp.text
                        ? '<p><span class="' + boroComp.cssClass + '">' + boroComp.text + '</span> the <strong>' + boroName + ' average</strong>' +
                        '<br><span class="fs-sm pl-3">(' + boroVal + unitSuffix + ')</span></p>'
                        : '') +
                    (cityComp.text
                        ? '<p><span class="' + cityComp.cssClass + '">' + cityComp.text + '</span> the <strong>Citywide average</strong>' +
                        '<br><span class="fs-sm pl-3">(' + cityVal + unitSuffix + ')</span></p>'
                        : '') +
                '</div>' +
            '</div>';

        // ----- detail panel HTML ----- //

        // Keep data-* attributes on the collapse panel for lazy chart rendering
        const detailHTML =
            '<div id="' + collapseId + '" class="collapse border-bottom" ' +
                'aria-labelledby="' + headingId + '" ' +
                'data-parent="#' + accordionParentId + '" ' +
                'data-indicator-name="' + (row.indicator_data_name || '') + '" ' +
                'data-legend-label="' + escapeAttr(units) + '" ' +
                'data-geocode="' + (row.geo_join_id || row.geo_entity_id || '') + '">' +
                '<div class="card-body card-body-no-top">' +
                    '<div class="row no-gutters fs-sm">' +
                        '<div class="col-12">' +
                            '<p class="fs-md mt-1 mb-2">' + (row.indicator_description || '') + '</p>' +
                        '</div>' +
                        '<div class="col-md-7 border-right h-100">' +
                            '<div class="nr-map-container" id="map-' + accId + '" style="width:100%;min-height:350px;">' +
                                '<p class="text-muted small">Chart loads when expanded...</p>' +
                            '</div>' +
                        '</div>' +
                        comparisonsHTML +
                    '</div>' +
                    '<div class="row no-gutters">' +
                        '<div class="col-7">' +
                            '<p class="fs-xs"><strong>Source:</strong> ' + (row.data_source_list || '') + '</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        return headerHTML + detailHTML;

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

        // Create a local accordion parent id so each section collapses independently
        const accordionParentId = 'nr-accordion-' + section.id;

        rows.forEach(row => {

            const card = document.createElement('div');
            card.innerHTML = buildIndicatorCard(row, neighborhoodName, accordionParentId);
            container.appendChild(card);

        });

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

        // Ordered fallback: rows already loaded, then the map click, then a name lookup
        currentGeocode = null;

        // - - - from rows already loaded - - - //

        for (const sid in sectionData) {

            const nb = sectionData[sid][neighborhoodName];

            if (nb && nb.length) {

                const row0 = nb[0];
                const gj =
                    row0.geo_join_id != null && row0.geo_join_id !== ''
                        ? row0.geo_join_id
                        : row0.geo_entity_id;

                if (gj != null && gj !== '') {
                    debugLog('renderAll: branch-found-geocode-in-section:', { sectionId: sid, geocode: gj });
                    currentGeocode = gj;
                    break;
                }

            }

        }

        // - - - from the map click - - - //

        if (
            (currentGeocode == null || currentGeocode === '') &&
            mapGeocode != null &&
            mapGeocode !== ''
        ) {
            debugLog('renderAll: branch-fallback-map-geocode:', mapGeocode);
            currentGeocode = mapGeocode;
        }

        // - - - from display-name lookup - - - //

        if (currentGeocode == null || currentGeocode === '') {
            debugLog('renderAll: branch-fallback-display-name-lookup:', neighborhoodName);
            currentGeocode = getUhfIdForDisplayName(neighborhoodName);
        }

        // ----- render sections ----- //

        config.sections.forEach(section => {
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

    };


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
            (config.reportName || 'Report') + ' - ' + currentNeighborhood + '.csv';

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
    // Vega map and bar chart
    // ----------------------------------------------------------------------- //

    // Draws one indicator across all neighborhoods, with geocode's own value highlighted
    const renderNRMap = (data, destination, legendLabel, geocode) => {

        debugLog('renderNRMap: enter:', {
            rowCount: data && data.length,
            destination,
            legendLabel,
            geocode
        });

        // ----- build geography URLs ----- //

        // Topojson is fetched by Vega at render time from the configured EHDP-data branch
        const boroTopoUrl = config.dataRepo + config.dataBranch + '/geography/borough.topo.json';
        const uhfTopoUrl = config.dataRepo + config.dataBranch + '/geography/UHF42.topo.json';

        // ----- chart spec ----- //

        // Vega-Lite spec combines a choropleth map with a compact sorted bar strip
        const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {
                "values": data,
                "format": { "parse": { "Value": "number" } }
            },
            "config": {
                "concat": { "spacing": 20 },
                "view": { "stroke": "transparent" },
                "axisY": { "domain": false, "ticks": false, "labelBaseline": "bottom" },
                "legend": { "disable": true },
                "scale": { "invalid": { "color": { "value": "#808080" } } }
            },
            "projection": { "type": "mercator" },
            "vconcat": [
                {
                    "layer": [

                        // - - - borough fill, drawn first so it backs gaps in UHF coverage - - - //

                        {
                            "height": 300,
                            "width": "container",
                            "data": {
                                "url": boroTopoUrl,
                                "format": { "type": "topojson", "feature": "collection" }
                            },
                            "mark": { "type": "geoshape", "stroke": "#fafafa", "fill": "#C5C5C5", "strokeWidth": 0.5 }
                        },

                        // - - - UHF42 outlines, drawn under the data layer - - - //

                        {
                            "height": 300,
                            "width": "container",
                            "data": {
                                "url": uhfTopoUrl,
                                "format": { "type": "topojson", "feature": "collection" }
                            },
                            "mark": { "type": "geoshape", "stroke": "#a2a2a2", "fill": "#e7e7e7", "strokeWidth": 0.5 }
                        },

                        // - - - indicator values, with the selected neighborhood outlined - - - //

                        {
                            "height": 300,
                            "width": "container",
                            "mark": { "type": "geoshape", "invalid": null },
                            "transform": [
                                {
                                    "lookup": "geo_join_id",
                                    "from": {
                                        "data": {
                                            "url": uhfTopoUrl,
                                            "format": { "type": "topojson", "feature": "collection" }
                                        },
                                        "key": "properties.GEOCODE"
                                    },
                                    "as": "geo"
                                }
                            ],
                            "encoding": {
                                "shape": { "field": "geo", "type": "geojson" },
                                "color": {
                                    "field": "unmodified_data_value_geo_entity",
                                    "type": "quantitative",
                                    "scale": { "scheme": { "name": "viridis", "extent": [1, 0] } },
                                    "legend": {
                                        "direction": "horizontal",
                                        "orient": "top-left",
                                        "title": legendLabel,
                                        "fontWeight": "normal",
                                        "tickCount": 3,
                                        "offset": -25,
                                        "gradientLength": 200
                                    }
                                },
                                "order": {
                                    "condition": { "test": "datum.geo_join_id == " + geocode, "value": 1 },
                                    "value": 0
                                },
                                "stroke": {
                                    "condition": { "test": "datum.geo_join_id == " + geocode, "value": "cyan" },
                                    "value": "#2d2d2d"
                                },
                                "strokeWidth": {
                                    "condition": { "test": "datum.geo_join_id == " + geocode, "value": 2.5 },
                                    "value": 0.5
                                },
                                "tooltip": [
                                    { "field": "neighborhood", "title": "Neighborhood", "type": "nominal" },
                                    { "field": "unmodified_data_value_geo_entity", "title": legendLabel, "type": "quantitative" }
                                ]
                            }
                        }
                    ]
                },

                // - - - bar strip, one bar per neighborhood sorted by value - - - //

                {
                    "height": 80,
                    "width": "container",
                    "mark": { "type": "bar", "tooltip": true, "stroke": "#161616" },
                    "encoding": {
                        "y": {
                            "field": "unmodified_data_value_geo_entity",
                            "type": "quantitative",
                            "title": null,
                            "axis": { "labelAngle": 0, "labelFontSize": 11, "tickCount": 3 }
                        },
                        "x": { "field": "geo_join_id", "sort": "y", "axis": null },
                        "color": {
                            "field": "unmodified_data_value_geo_entity",
                            "type": "quantitative",
                            "scale": { "scheme": { "name": "viridis", "extent": [1, 0] } },
                            "legend": false
                        },
                        "order": {
                            "condition": { "test": "datum.geo_join_id == " + geocode, "value": 1 },
                            "value": 0
                        },
                        "stroke": {
                            "condition": { "test": "datum.geo_join_id == " + geocode, "value": "cyan" },
                            "value": "#2d2d2d"
                        },
                        "strokeWidth": {
                            "condition": { "test": "datum.geo_join_id == " + geocode, "value": 2.5 },
                            "value": 0
                        },
                        "tooltip": [
                            { "field": "neighborhood", "title": "Neighborhood", "type": "nominal" },
                            { "field": "unmodified_data_value_geo_entity", "title": legendLabel, "type": "quantitative" }
                        ]
                    }
                }
            ]
        };

        // ----- embed ----- //

        // Action menu stays enabled so readers can export the chart as PNG/SVG
        vegaEmbed(destination, spec, { actions: true });

    };


    // Draws a panel's chart the first time it opens, so closed panels cost nothing
    const onAccordionExpand = event => {

        const panel = event.target;
        const panelId = panel.id;

        debugLog('onAccordionExpand: enter:', panelId);

        // ----- guard already-rendered ----- //

        if (renderedPanels[panelId]) {
            debugLog('onAccordionExpand: branch-already-rendered:', panelId);
            return;
        }

        // ----- read rendering inputs ----- //

        // buildIndicatorCard stashed these on the collapse node as data-* attributes
        const indicatorName = panel.getAttribute('data-indicator-name');
        const geocode = panel.getAttribute('data-geocode') || currentGeocode;
        const mapEl = panel.querySelector('.nr-map-container');

        // If required inputs are missing, keep the panel open but do not attempt render
        if (!indicatorName || !mapEl || !vizTable) {
            debugLog('onAccordionExpand: branch-missing-prereqs:', { indicatorName, hasMapEl: !!mapEl, hasVizTable: !!vizTable });
            return;
        }

        try {

            // ----- summarize to the latest value per neighborhood ----- //

            const summaryData = vizTable
                .filter(aq.escape(d => d.indicator_data_name === indicatorName))
                .select('geo_join_id', 'neighborhood', 'unmodified_data_value_geo_entity', 'end_date')
                .dedupe()
                .groupby('neighborhood')
                .orderby('neighborhood', aq.desc('end_date'))
                .slice(0, 1)
                .ungroup()
                .derive({ unmodified_data_value_geo_entity: function (d) { return op.parse_float(d.unmodified_data_value_geo_entity); } })
                .orderby('unmodified_data_value_geo_entity')
                .select(aq.not('end_date'))
                .objects();

            // ----- render ----- //

            if (summaryData.length) {

                debugLog('onAccordionExpand: branch-render-map:', { panelId, indicatorName, summaryRows: summaryData.length });

                mapEl.innerHTML = '';

                let legendLabel = panel.getAttribute('data-legend-label');

                // Fall back to a generic legend title when no unit text is available
                if (!legendLabel || !String(legendLabel).trim()) {
                    debugLog('onAccordionExpand: branch-default-legend-label');
                    legendLabel = 'Value';
                }

                renderNRMap(summaryData, '#' + mapEl.id, legendLabel, geocode);

            } else {
                debugLog('onAccordionExpand: branch-no-summary-data:', indicatorName);
                mapEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
            }

        } catch (e) {
            console.error('onAccordionExpand: error rendering map for ' + indicatorName + ':', e);
            mapEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
        }

        // Mark panel as rendered even on no-data/error to prevent repeated work
        renderedPanels[panelId] = true;

    };


    // ----------------------------------------------------------------------- //
    // Leaflet selector map
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // polygon styles
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const defaultStyle = {
        weight: 1.5,
        opacity: 1,
        color: 'black',
        dashArray: '1',
        fillOpacity: 0.05,
        fillColor: '#008939'
    };


    const highlightStyle = {
        weight: 3,
        color: '#008939',
        dashArray: '3',
        fillOpacity: 0.5
    };


    // Base style for all UHF polygons before hover/selection overrides
    const styleFeature = () => defaultStyle;


    // Temporary hover state for visual affordance
    const highlightFeature = e => {

        const layer = e.target;
        layer.setStyle({ weight: 5, color: '#444', dashArray: '' });
        layer.bringToFront();

    };


    // Reverts hover style on mouseout, unless this layer is the active selection
    const resetHighlight = e => {

        const layer = e.target;
        const geocode = layer.feature.properties.GEOCODE;

        // Preserve selected style for the active neighborhood while mousing out
        if (geocode == currentGeocode) return;

        layer.setStyle({ weight: 1.5, color: 'black', dashArray: '1' });

    };


    // Applies the selected style to a layer, optionally flying the map to it
    const selectLayer = (layer, zoom) => {

        // Clear previous selection style first
        if (uhfLayer) uhfLayer.resetStyle();

        layer.setStyle(highlightStyle);
        layer.bringToFront();

        // Optionally animate map to selection bounds for click-driven navigation
        if (zoom && leafletMap) {
            leafletMap.flyToBounds(layer.getBounds(), { duration: 0.5 });
        }

    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // layer lookup
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // Resolve UHF geocode to display name used by report rows
    const geocodeToName = geocode => {

        if (typeof neighborhoods === 'undefined') return null;

        const match = neighborhoods.find(n => n.UHF_id == geocode);
        if (!match) return null;

        const name = match.UHF_name;
        return nameCorrections[name] || name;

    };


    // Find the matching rendered Leaflet layer by UHF geocode
    const findLayerByGeocode = geocode => {

        if (!uhfLayer) return null;

        let match = null;

        uhfLayer.eachLayer(layer => {
            if (layer.feature.properties.GEOCODE == geocode) {
                match = layer;
            }
        });

        return match;

    };


    // Convert display name -> UHF id -> Leaflet layer
    const findLayerByName = name => {

        if (typeof neighborhoods === 'undefined' || !uhfLayer) return null;

        const entry = neighborhoods.find(n => {
            const corrected = nameCorrections[n.UHF_name] || n.UHF_name;
            return corrected === name;
        });

        if (!entry) return null;

        return findLayerByGeocode(entry.UHF_id);

    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // event handlers
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // Map click drives neighborhood selection for the full report UI
    const onMapClick = e => {

        const layer = e.target;
        const geocode = layer.feature.properties.GEOCODE;
        const name = geocodeToName(geocode) || layer.feature.properties.GEONAME;

        selectLayer(layer, true);

        // Ignore click-driven render until all report and viz payloads have loaded
        if (dataReady) {
            debugLog('onMapClick: branch-render-all:', { name, geocode });
            renderAll(name, geocode);
        } else {
            debugLog('onMapClick: branch-data-not-ready:', { name, geocode });
        }

    };


    // Attach tooltip and pointer handlers for each UHF polygon
    const onEachFeature = (feature, layer) => {

        layer.bindTooltip(feature.properties.GEONAME, {
            permanent: false,
            opacity: 0.9,
            className: 'fs-md'
        });

        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: onMapClick
        });

    };


    // Sets up the Leaflet map and loads UHF polygon geometry onto it
    const initLeafletMap = () => {

        debugLog('initLeafletMap: enter:', config.geojsonUrl);

        // Initialize Leaflet with a neutral NYC-centered default view
        leafletMap = L.map('nr-map', { zoomControl: false }).setView([40.7128, -74.006], 10);

        // Use CARTO basemap tiles to match existing portal styling
        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 15,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
        ).addTo(leafletMap);

        L.control.scale({ metric: false, position: 'bottomleft' }).addTo(leafletMap);

        // Load the neighborhood polygons once, then wait for the data pipeline to finish
        fetch(config.geojsonUrl)
            .then(res => res.json())
            .then(data => {

                debugLog('initLeafletMap: branch-geojson-loaded:', { featureCount: data && data.features && data.features.length });

                uhfLayer = L.geoJSON(data, {
                    style: styleFeature,
                    onEachFeature,
                    filter: feature => feature.properties.GEOCODE != 0
                }).addTo(leafletMap);

                mapReady = true;
                tryInitialRender();

            })
            .catch(err => {

                console.error('Error loading UHF42 GeoJSON:', err);
                debugLog('initLeafletMap: branch-geojson-load-failed:', err);
                mapReady = true;
                tryInitialRender();

            });

    };


    // ----------------------------------------------------------------------- //
    // data loading
    // ----------------------------------------------------------------------- //

    // Renders the URL-selected neighborhood once both map and data are ready
    const tryInitialRender = () => {

        debugLog('tryInitialRender: enter:', { dataReady, mapReady });

        // Guard initial render until both data payloads and map geometry are ready
        if (!dataReady || !mapReady) {
            debugLog('tryInitialRender: branch-waiting');
            return;
        }

        // If a neighborhood is already in the URL, honor it after both data sources are ready
        const fromURL = getNeighborhoodFromURL();

        if (fromURL) {

            debugLog('tryInitialRender: branch-from-url:', fromURL);

            const layer = findLayerByName(fromURL);
            if (layer) {
                debugLog('tryInitialRender: branch-select-layer-from-url');
                selectLayer(layer, true);
            }

            renderAll(fromURL);

        }

    };


    // Counts a completed fetch and triggers the initial render once all are in
    const checkAllLoaded = () => {

        debugLog('checkAllLoaded: enter:', { fetchesCompleteBefore: fetchesComplete, totalFetches });

        fetchesComplete++;

        // Trigger initial render once all sections and viz data have loaded
        if (fetchesComplete >= totalFetches) {
            debugLog('checkAllLoaded: branch-ready');
            dataReady = true;
            tryInitialRender();
        }

    };


    // Encodes the last path segment of a report URL so it is safe to fetch
    const normalizeReportUrl = url => {

        debugLog('normalizeReportUrl: enter:', url);

        // GitHub raw URLs must not contain literal spaces in the path; some
        // clients reject them or fail inconsistently. Skip already-safe URLs
        if (!url || url.indexOf(' ') === -1) return url;

        try {

            // Parse via URL API so we can safely target only the path segment
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);

            if (!parts.length) return url;

            let last = parts[parts.length - 1];

            // Re-encode defensively for names that may already be partially encoded
            try {
                last = encodeURIComponent(decodeURIComponent(last));
            } catch (e) {
                last = encodeURIComponent(last);
            }

            parts[parts.length - 1] = last;
            u.pathname = '/' + parts.join('/');

            debugLog('normalizeReportUrl: branch-encoded:', u.href);
            return u.href;

        } catch (err) {
            debugLog('normalizeReportUrl: branch-parse-failed:', err);
            return url;
        }

    };


    // Fetches one report section's rows and buckets/sorts them by neighborhood
    const loadSection = section => {

        debugLog('loadSection: enter:', { sectionId: section.id, reportUrl: section.reportUrl });

        // ----- fetch ----- //

        fetch(normalizeReportUrl(section.reportUrl))
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {

                // Non-array responses are treated as empty to keep rendering resilient
                const rows = Array.isArray(data) ? data : [];

                debugLog('loadSection: branch-data-loaded:', { sectionId: section.id, rowCount: rows.length });

                // ----- bucket by neighborhood ----- //

                // Build neighborhood buckets once during load for faster rerenders
                const byNeighborhood = {};

                rows.forEach(row => {

                    const n = row.neighborhood;
                    if (!n) return;

                    if (!byNeighborhood[n]) byNeighborhood[n] = [];
                    byNeighborhood[n].push(row);

                });

                // ----- sort by rank ----- //

                // Sort each neighborhood's rows by rank descending so higher-ranked
                // indicators appear at the top of the accordion
                Object.keys(byNeighborhood).forEach(n => {

                    byNeighborhood[n].sort((a, b) => {
                        const ra = Number(a.data_value_rank);
                        const rb = Number(b.data_value_rank);
                        if (isNaN(ra) || isNaN(rb)) return 0;
                        return rb - ra;
                    });

                });

                sectionData[section.id] = byNeighborhood;

            })
            .catch(error => {
                console.error('Error loading section "' + section.id + '":', error);
                debugLog('loadSection: branch-load-failed:', { sectionId: section.id, error });
                sectionData[section.id] = {};
            })
            .then(checkAllLoaded);

    };


    // Loads the shared viz table used by all per-indicator Vega charts
    const loadVizData = () => {

        debugLog('loadVizData: enter:', config.vizUrl);

        // If no viz URL is configured, continue with section-only rendering
        if (!config.vizUrl) {
            debugLog('loadVizData: branch-no-viz-url');
            checkAllLoaded();
            return;
        }

        aq.loadJSON(config.vizUrl, { autoMax: 10000, parse: { time: String } })
            .then(table => {
                debugLog('loadVizData: branch-data-loaded:', table && table.numRows && table.numRows());
                vizTable = table;
            })
            .catch(error => {
                console.error('Error loading viz data:', error);
                debugLog('loadVizData: branch-load-failed:', error);
                vizTable = null;
            })
            .then(checkAllLoaded);

    };


    // ----------------------------------------------------------------------- //
    // bootstrap
    // ----------------------------------------------------------------------- //

    // Hook accordion expansion before data arrives so first open can render immediately
    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);

    // Start map and data loads in parallel
    initLeafletMap();

    config.sections.forEach(section => {
        loadSection(section);
    });

    loadVizData();

};

init();
