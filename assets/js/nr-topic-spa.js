// Topic-centric Neighborhood Reports viewer
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
//   - Neighborhood persistence via URL query parameter

// Named init function used in place of an IIFE so early returns remain available
const init = () => {

    const config = window.NR_TOPIC_SPA_CONFIG;

    if (!config || !config.sections || !config.sections.length) {
        return;
    }

    if (!document.getElementById('nr-map')) {
        return;
    }

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

    // --- URL param persistence ---

    const getNeighborhoodFromURL = () => {

        // Two-step lookup for the active neighborhood on page load.
        //
        // Step 1 — path: handles externally shared or bookmarked URLs like
        //   /neighborhood-reports/asthma_and_the_environment/east_new_york
        // On production, IIS rewrites these to serve the topic page, and the slug
        // is still visible in the path for us to read here.
        const config = window.NR_TOPIC_SPA_CONFIG;
        const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const slug = pathParts[pathParts.length - 1];

        if (config.neighborhoodMap[slug]) {
            return config.neighborhoodMap[slug];
        }

        // Step 2 — sessionStorage: handles internal navigation from the landing page,
        // topic tabs, neighborhood cards, and the 404 fallback. Each of those entry
        // points stores the neighborhood slug before navigating to the clean topic URL,
        // so the page load never hits the server with a neighborhood in the path.
        // The item is consumed immediately so it doesn't bleed into subsequent page loads.
        const pending = sessionStorage.getItem('nr_pending_neighborhood');
        if (pending && config.neighborhoodMap[pending]) {
            sessionStorage.removeItem('nr_pending_neighborhood');
            return config.neighborhoodMap[pending];
        }

        return '';

    };

    const setNeighborhoodInURL = name => {

        // Update the browser's address bar to show the neighborhood in the path, e.g.
        //   /neighborhood-reports/asthma_and_the_environment/east_new_york
        // Uses history.replaceState so the page does not reload — this is purely cosmetic,
        // making the URL shareable and bookmarkable without triggering a new server request.
        const config = window.NR_TOPIC_SPA_CONFIG;
        const slug = Object.keys(config.neighborhoodMap).find(k => config.neighborhoodMap[k] === name);

        if (!slug) {
            return;
        }

        // Find the topic slug in the current path and replace everything after it
        // with the neighborhood slug, preserving any site path prefix (e.g. /dev-prod/)
        const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const topicIdx = pathParts.findIndex(p => p === config.topicSlug);

        if (topicIdx === -1) {
            return;
        }

        const newPath = '/' + pathParts.slice(0, topicIdx + 1).join('/') + '/' + slug;
        history.replaceState(null, '', newPath);

    };

    const updateTopicLinks = neighborhoodName => {

        // When the user clicks a topic tab (e.g. switching from Asthma to Housing),
        // we need the new topic page to open with the same neighborhood pre-selected.
        // Rather than embedding the neighborhood in the link href (which would cause a
        // 404 in dev and requires IIS rewrite in production), we store the slug in
        // sessionStorage just before the navigation fires. The new topic SPA reads it
        // on load via getNeighborhoodFromURL above.
        const config = window.NR_TOPIC_SPA_CONFIG;
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

    // --- helpers ---

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

    // Returns the production CSS pill class: worse, better, or middle
    const getTertilePillClass = (rank, rankReverse) => {

        const r = String(rank);
        const reverse = rankReverse === true || rankReverse === 'true';

        if (r === '1') return reverse ? 'better' : 'worse';
        if (r === '3') return reverse ? 'worse' : 'better';
        if (r === '2') return 'middle';

        return '';

    };

    // Returns the -sm variant class for inline comparison indicators
    const getTertileSmClass = (rank, rankReverse) => {

        const r = String(rank);
        const reverse = rankReverse === true || rankReverse === 'true';

        if (r === '1') return reverse ? 'better-sm' : 'worse-sm';
        if (r === '3') return reverse ? 'worse-sm' : 'better-sm';
        if (r === '2') return 'middle-sm';

        return '';

    };

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

    const getComparison = (neighVal, refVal, rankReverse) => {

        const n = Number(neighVal);
        const r = Number(refVal);
        const reverse = rankReverse === true || rankReverse === 'true';

        if (isNaN(n) || isNaN(r)) {
            return { text: '', cssClass: '' };
        }

        let comp;
        let cls;

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

    let accordionCounter = 0;

    const nextAccordionId = () => 'nr-acc-' + (++accordionCounter);

    // Safe for double-quoted HTML attributes (e.g. data-legend-label)
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

    const getUhfIdForDisplayName = displayName => {

        if (!displayName || typeof neighborhoods === 'undefined') return null;

        const entry = neighborhoods.find(n => {
            const corrected = nameCorrections[n.UHF_name] || n.UHF_name;
            return corrected === displayName;
        });

        return entry ? entry.UHF_id : null;

    };

    // --- demographics sidebar ---

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

    const renderDemographics = geocode => {

        if (typeof neighborhoods === 'undefined' || geocode == null || geocode === '') {
            clearDemographicsSidebar();
            return;
        }

        const here = neighborhoods.filter(n => n.UHF_id == geocode);

        if (!here.length) {
            clearDemographicsSidebar();
            return;
        }

        const d = here[0];
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

    // --- rendering ---

    const buildIndicatorCard = (row, sectionId, neighborhoodName, accordionParentId) => {

        const accId = nextAccordionId();
        const headingId = accId + '-h';
        const collapseId = accId + '-c';

        const value =
            row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
                ? row.data_value_geo_entity
                : '–';

        const unitParts = [];
        if (row.measurement_type) unitParts.push(row.measurement_type);
        if (row.units) unitParts.push(row.units);
        const units = unitParts.join(' ').trim();

        // Tertile pill for the header row (production uses .worse/.better/.middle classes)
        const pillLabel = getTertileLabel(row.data_value_rank, row.rankReverse);
        const pillClass = getTertilePillClass(row.data_value_rank, row.rankReverse);
        let pillHTML = '';

        if (pillLabel && pillClass) {
            pillHTML = '<span class="' + pillClass + '">' + pillLabel + '</span>';
        }

        const headerHTML =
            '<div class="card-header border-top" id="' + headingId + '">' +
                '<h2 class="mb-0">' +
                '<button class="btn btn-block btn-sm text-left" type="button" ' +
                    'data-toggle="collapse" data-target="#' + collapseId + '" ' +
                    'aria-expanded="false" aria-controls="' + collapseId + '">' +
                    '<div class="row no-gutters" style="width:100%">' +
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

        // Some indicators do not have comparative rank metadata
        const hasRank = row.data_value_rank != null;

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
        if (row.measurement_type && row.measurement_type.toLowerCase().indexOf('ercent') !== -1) {
            unitSuffix = '%';
        } else if (row.units) {
            unitSuffix = ' ' + row.units;
        }

        const tertileInlineHTML = getTertileInlineLabel(row.data_value_rank, row.rankReverse);

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

    const renderSection = (section, neighborhoodName) => {

        // Section containers are layout-driven and may be absent in some templates
        const container = document.getElementById(section.containerId);

        if (!container) return;

        // Neighborhood-level rows are pre-grouped during loadSection
        const byNeighborhood = sectionData[section.id] || {};
        const rows = byNeighborhood[neighborhoodName] || [];

        // Reset section contents before re-rendering cards
        container.innerHTML = '';

        if (!rows.length) {
            container.innerHTML =
                '<p class="text-muted px-2 pb-2 mb-0">No data available for this neighborhood.</p>';
            return;
        }

        // Create a local accordion parent id so each section collapses independently
        const accordionParentId = 'nr-accordion-' + section.id;

        rows.forEach(row => {

            const card = document.createElement('div');
            card.innerHTML = buildIndicatorCard(row, section.id, neighborhoodName, accordionParentId);
            container.appendChild(card);

        });

    };

    const renderAll = (neighborhoodName, mapGeocode) => {

        // Record the active neighborhood used by downloads and rerenders
        currentNeighborhood = neighborhoodName;
        renderedPanels = {};
        accordionCounter = 0;

        // Start empty and resolve from rows first, then map click, then name lookup
        currentGeocode = null;

        // Prefer geocodes found directly in loaded rows before fallback lookups
        for (const sid in sectionData) {

            const nb = sectionData[sid][neighborhoodName];

            if (nb && nb.length) {

                const row0 = nb[0];
                const gj =
                    row0.geo_join_id != null && row0.geo_join_id !== ''
                        ? row0.geo_join_id
                        : row0.geo_entity_id;

                if (gj != null && gj !== '') {
                    currentGeocode = gj;
                    break;
                }

            }

        }

        // Fall back to the geocode supplied by the map click event
        if (
            (currentGeocode == null || currentGeocode === '') &&
            mapGeocode != null &&
            mapGeocode !== ''
        ) {
            currentGeocode = mapGeocode;
        }

        // Last resort: resolve geocode by display name from uhflist
        if (currentGeocode == null || currentGeocode === '') {
            currentGeocode = getUhfIdForDisplayName(neighborhoodName);
        }

        config.sections.forEach(section => {
            renderSection(section, neighborhoodName);
        });

        // Show the report header and fill in the neighborhood name
        const reportHeader = document.getElementById('nr-report-header');
        const headerNeighborhood = document.getElementById('nr-header-neighborhood');

        if (reportHeader) {
            reportHeader.style.display = '';
        }

        if (headerNeighborhood) {
            headerNeighborhood.textContent = neighborhoodName;
        }

        // Mobile title
        const mobileTitle = document.getElementById('nr-mobile-title');
        const mobileNeighborhood = document.getElementById('nr-mobile-neighborhood');

        if (mobileTitle) mobileTitle.style.display = '';
        if (mobileNeighborhood) mobileNeighborhood.textContent = neighborhoodName;

        renderDemographics(currentGeocode);

        setNeighborhoodInURL(neighborhoodName);
        updateTopicLinks(neighborhoodName);

    };

    // --- CSV download ---

    const downloadCSV = () => {

        if (!vizTable || !currentNeighborhood) return;

        const csv = vizTable
            .select(aq.not('report_id', 'indicator_id', 'indicator_data_name', 'start_date', 'end_date'))
            .filter(aq.escape(d => d.neighborhood === currentNeighborhood))
            .toCSV();

        const filename = 'NYC EH Data Portal - Neighborhood Report - ' +
            (config.reportName || 'Report') + ' - ' + currentNeighborhood + '.csv';

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);

    };

    window.nrDownloadCSV = downloadCSV;

    // --- Vega map + bar chart ---

    const renderNRMap = (data, destination, legendLabel, geocode) => {

        const boroTopoUrl = config.dataRepo + config.dataBranch + '/geography/borough.topo.json';
        const uhfTopoUrl = config.dataRepo + config.dataBranch + '/geography/UHF42.topo.json';

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
                        {
                            "height": 300,
                            "width": "container",
                            "data": {
                                "url": boroTopoUrl,
                                "format": { "type": "topojson", "feature": "collection" }
                            },
                            "mark": { "type": "geoshape", "stroke": "#fafafa", "fill": "#C5C5C5", "strokeWidth": 0.5 }
                        },
                        {
                            "height": 300,
                            "width": "container",
                            "data": {
                                "url": uhfTopoUrl,
                                "format": { "type": "topojson", "feature": "collection" }
                            },
                            "mark": { "type": "geoshape", "stroke": "#a2a2a2", "fill": "#e7e7e7", "strokeWidth": 0.5 }
                        },
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

        vegaEmbed(destination, spec, { actions: true });

    };

    const onAccordionExpand = event => {

        const panel = event.target;
        const panelId = panel.id;

        // Skip panels that have already been rendered
        if (renderedPanels[panelId]) return;

        const indicatorName = panel.getAttribute('data-indicator-name');
        const geocode = panel.getAttribute('data-geocode') || currentGeocode;
        const mapEl = panel.querySelector('.nr-map-container');

        if (!indicatorName || !mapEl || !vizTable) return;

        try {

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

            if (summaryData.length) {

                mapEl.innerHTML = '';

                let legendLabel = panel.getAttribute('data-legend-label');
                if (!legendLabel || !String(legendLabel).trim()) {
                    legendLabel = 'Value';
                }

                renderNRMap(summaryData, '#' + mapEl.id, legendLabel, geocode);

            } else {
                mapEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
            }

        } catch (e) {
            console.error('Error rendering map for ' + indicatorName + ':', e);
            mapEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
        }

        renderedPanels[panelId] = true;

    };

    // --- Leaflet neighborhood selector map ---

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

    const styleFeature = () => defaultStyle;

    const highlightFeature = e => {

        const layer = e.target;
        layer.setStyle({ weight: 5, color: '#444', dashArray: '' });
        layer.bringToFront();

    };

    const resetHighlight = e => {

        const layer = e.target;
        const geocode = layer.feature.properties.GEOCODE;

        // Preserve the selected neighborhood's highlight on mouseout
        if (geocode == currentGeocode) return;

        layer.setStyle({ weight: 1.5, color: 'black', dashArray: '1' });

    };

    const selectLayer = (layer, zoom) => {

        if (uhfLayer) uhfLayer.resetStyle();

        layer.setStyle(highlightStyle);
        layer.bringToFront();

        if (zoom && leafletMap) {
            leafletMap.flyToBounds(layer.getBounds(), { duration: 0.5 });
        }

    };

    const geocodeToName = geocode => {

        if (typeof neighborhoods === 'undefined') return null;

        const match = neighborhoods.find(n => n.UHF_id == geocode);
        if (!match) return null;

        const name = match.UHF_name;
        return nameCorrections[name] || name;

    };

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

    const findLayerByName = name => {

        if (typeof neighborhoods === 'undefined' || !uhfLayer) return null;

        const entry = neighborhoods.find(n => {
            const corrected = nameCorrections[n.UHF_name] || n.UHF_name;
            return corrected === name;
        });

        if (!entry) return null;

        return findLayerByGeocode(entry.UHF_id);

    };

    const onMapClick = e => {

        const layer = e.target;
        const geocode = layer.feature.properties.GEOCODE;
        const name = geocodeToName(geocode) || layer.feature.properties.GEONAME;

        selectLayer(layer, true);

        if (dataReady) {
            renderAll(name, geocode);
        }

    };

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

    const initLeafletMap = () => {

        leafletMap = L.map('nr-map', { zoomControl: false }).setView([40.7128, -74.006], 10);

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 15,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
        ).addTo(leafletMap);

        L.control.scale({ metric: false, position: 'bottomleft' }).addTo(leafletMap);

        fetch(config.geojsonUrl)
            .then(res => res.json())
            .then(data => {

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
                mapReady = true;
                tryInitialRender();

            });

    };

    // --- data loading ---

    const tryInitialRender = () => {

        if (!dataReady || !mapReady) return;

        const fromURL = getNeighborhoodFromURL();

        if (fromURL) {

            const layer = findLayerByName(fromURL);
            if (layer) {
                selectLayer(layer, true);
            }

            renderAll(fromURL);

        }

    };

    const checkAllLoaded = () => {

        fetchesComplete++;

        // Trigger initial render once all sections and viz data have loaded
        if (fetchesComplete >= totalFetches) {
            dataReady = true;
            tryInitialRender();
        }

    };

    // GitHub raw URLs must not contain literal spaces in the path; some clients
    // reject them or fail inconsistently. Encode the last path segment if needed
    const normalizeReportUrl = url => {

        if (!url || url.indexOf(' ') === -1) return url;

        try {

            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);

            if (!parts.length) return url;

            let last = parts[parts.length - 1];

            try {
                last = encodeURIComponent(decodeURIComponent(last));
            } catch (e) {
                last = encodeURIComponent(last);
            }

            parts[parts.length - 1] = last;
            u.pathname = '/' + parts.join('/');

            return u.href;

        } catch (err) {
            return url;
        }

    };

    const loadSection = section => {

        fetch(normalizeReportUrl(section.reportUrl))
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {

                const rows = Array.isArray(data) ? data : [];
                const byNeighborhood = {};

                rows.forEach(row => {

                    const n = row.neighborhood;
                    if (!n) return;

                    if (!byNeighborhood[n]) byNeighborhood[n] = [];
                    byNeighborhood[n].push(row);

                });

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
                sectionData[section.id] = {};
            })
            .then(checkAllLoaded);

    };

    const loadVizData = () => {

        if (!config.vizUrl) {
            checkAllLoaded();
            return;
        }

        aq.loadJSON(config.vizUrl, { autoMax: 10000, parse: { time: String } })
            .then(table => {
                vizTable = table;
            })
            .catch(error => {
                console.error('Error loading viz data:', error);
                vizTable = null;
            })
            .then(checkAllLoaded);

    };

    // --- init ---

    $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);

    initLeafletMap();

    config.sections.forEach(section => {
        loadSection(section);
    });

    loadVizData();

};

init();
