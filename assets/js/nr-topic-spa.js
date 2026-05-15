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

;(function () {
    
    // Startup marker so we can confirm this bundle executed on page load
    console.log('bootstrap: start');
    
    // Read server-injected SPA configuration from the global scope
    var config = window.NR_TOPIC_SPA_CONFIG;
    
    // Hard stop when required config is missing
    if (!config || !config.sections || !config.sections.length) {
        console.log('bootstrap: missing-config:', config);
        return;
    }
    
    // The interactive selector map is required for this page variant
    var mapContainer = document.getElementById('nr-map');
    
    // Stop if the layout does not include the map target node
    if (!mapContainer) {
        console.log('bootstrap: missing-map-container');
        return;
    }
    
    // Per-section data store: sectionId -> { neighborhoodName -> rows[] }
    var sectionData = {};
    
    // Arquero table for the viz dataset (all indicators, all neighborhoods)
    var vizTable = null;
    
    // Track which accordion panels have already had their chart rendered
    var renderedPanels = {};
    
    // Track loading: sections + viz = total fetches needed before first render
    var totalFetches = config.sections.length + (config.vizUrl ? 1 : 0);
    var fetchesComplete = 0;
    
    // Current neighborhood and geocode, updated on switch
    var currentNeighborhood = '';
    var currentGeocode = null;
    
    // Leaflet map and GeoJSON layer references
    var leafletMap = null;
    var uhfLayer = null;
    var dataReady = false;
    var mapReady = false;
    
    // --- URL param persistence ---
    
    function getNeighborhoodFromURL() {
        
        // Read the selected neighborhood from the current query string
        console.log('getNeighborhoodFromURL: enter:', window.location.search);
        
        var params = new URLSearchParams(window.location.search);
        
        return params.get('neighborhood') || '';
        
    }
    
    function setNeighborhoodInURL(name) {
        
        // Keep the browser URL synchronized with the current neighborhood selection
        console.log('setNeighborhoodInURL: enter:', name);
        
        var url = new URL(window.location);
        
        url.searchParams.set('neighborhood', name);
        history.replaceState(null, '', url);
        
    }
    
    function updateTopicLinks(neighborhoodName) {
        
        // Ensure in-page topic links preserve the active neighborhood context
        console.log('updateTopicLinks: enter:', neighborhoodName);
        
        var links = document.querySelectorAll('.nr-topic-link');
        
        links.forEach(function (a) {
            
            var url = new URL(a.href, window.location.origin);
            url.searchParams.set('neighborhood', neighborhoodName);
            a.href = url.toString();
            
        });
        
    }
    
    // --- helpers ---
    
    function getTertileLabel(rank, rankReverse) {
        
        // Normalize rank values that may arrive as numbers or strings
        var r = String(rank);
        // rankReverse indicates indicators where lower values are directionally better
        var reverse = rankReverse === true || rankReverse === 'true';
        
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
        
    }
    
    // Returns the production CSS pill class: worse, better, or middle
    function getTertilePillClass(rank, rankReverse) {
        
        // Normalize rank values that may arrive as numbers or strings
        var r = String(rank);
        var reverse = rankReverse === true || rankReverse === 'true';
        
        if (r === '1') return reverse ? 'better' : 'worse';
        if (r === '3') return reverse ? 'worse' : 'better';
        if (r === '2') return 'middle';
        
        return '';
        
    }
    
    // Returns the -sm variant class for inline comparison emojis
    function getTertileSmClass(rank, rankReverse) {
        
        // Normalize rank values that may arrive as numbers or strings
        var r = String(rank);
        var reverse = rankReverse === true || rankReverse === 'true';
        
        if (r === '1') return reverse ? 'better-sm' : 'worse-sm';
        if (r === '3') return reverse ? 'worse-sm' : 'better-sm';
        if (r === '2') return 'middle-sm';
        
        return '';
        
    }
    
    function getTertileInlineLabel(rank, rankReverse) {
        
        // Normalize rank values that may arrive as numbers or strings
        var r = String(rank);
        var reverse = rankReverse === true || rankReverse === 'true';
        
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
        
    }
    
    function getComparison(neighVal, refVal, rankReverse) {
        
        // Parse defensively because the source payload can contain string numerics
        var n = Number(neighVal);
        var r = Number(refVal);
        var reverse = rankReverse === true || rankReverse === 'true';
        
        // When either side is not numeric, omit comparison messaging
        if (isNaN(n) || isNaN(r)) {
            return { text: '', cssClass: '' };
        }
        
        var comp;
        var cls;
        
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
        
    }
    
    var accordionCounter = 0;
    
    function nextAccordionId() {
        // Generate unique IDs so collapse/expand controls are correctly paired
        return 'nr-acc-' + (++accordionCounter);
        
    }
    
    // Safe for double-quoted HTML attributes (e.g. data-legend-label)
    function escapeAttr(value) {
        
        if (value == null) return '';
        
        return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        
    }
    
    // uhflist.js has one known typo: "Crotona -Tremont" (missing space after dash)
    // EHDP-data report JSONs use "Crotona - Tremont". This map corrects it so
    // lookups against report data and sidebar demographics stay aligned
    
    var nameCorrections = {
        'Crotona -Tremont': 'Crotona - Tremont'
    };
    
    function getUhfIdForDisplayName(displayName) {
        
        // Neighborhood metadata may not be loaded in every page context
        if (!displayName || typeof neighborhoods === 'undefined') return null;
        
        var entry = neighborhoods.find(function (n) {
            var corrected = nameCorrections[n.UHF_name] || n.UHF_name;
            return corrected === displayName;
        });
        
        return entry ? entry.UHF_id : null;
        
    }
    
    // --- demographics sidebar ---
    
    function clearDemographicsSidebar() {
        
        var metricIds = [
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
        metricIds.forEach(function (id) {
            
            var node = document.getElementById(id);
            if (node) node.innerHTML = '';
            
        });
        
        var zipList = document.getElementById('nr-zip-list');
        if (zipList) zipList.textContent = '';
        
        var demoPanel = document.getElementById('nr-demographics');
        if (demoPanel) demoPanel.style.display = 'none';
        
        var zipPanel = document.getElementById('nr-zip-codes');
        if (zipPanel) zipPanel.style.display = 'none';
        
    }
    
    function renderDemographics(geocode) {
        
        // Populate the sidebar using the active neighborhood geocode
        console.log('renderDemographics: enter:', geocode);
        
        if (typeof neighborhoods === 'undefined' || geocode == null || geocode === '') {
            
            console.log('renderDemographics: branch-clear-missing-neighborhoods-or-geocode');
            clearDemographicsSidebar();
            
            return;
            
        }
        
        var here = neighborhoods.filter(function (n) { return n.UHF_id == geocode; });
        
        if (!here.length) {
            
            console.log('renderDemographics: branch-clear-no-match:', geocode);
            clearDemographicsSidebar();
            
            return;
            
        }
        
        var d = here[0];
        
        // The sidebar has a fixed set of target nodes, so keep the mapping explicit
        var el = function (id) { return document.getElementById(id); };
        
        if (el('nr-pop'))   el('nr-pop').innerHTML   = Number(d.TotalPopulation).toLocaleString();
        if (el('nr-old'))   el('nr-old').innerHTML   = Number(d.PercentOver65).toFixed(1) + '%';
        if (el('nr-young')) el('nr-young').innerHTML = Number(d.PercentUnder18).toFixed(1) + '%';
        if (el('nr-pov'))   el('nr-pov').innerHTML   = Number(d.PovertyPercent).toFixed(1) + '%';
        if (el('nr-grad'))  el('nr-grad').innerHTML  = Number(d.PercentGraduatedHighSchool).toFixed(1) + '%';
        if (el('nr-eng'))   el('nr-eng').innerHTML   = Number(d.PercentLimitedEnglish).toFixed(1) + '%';
        if (el('nr-own'))   el('nr-own').innerHTML   = Number(d.PercentOwnerOccupied).toFixed(1) + '%';
        if (el('nr-rent'))  el('nr-rent').innerHTML  = Number(d.PercentRentBurdened).toFixed(1) + '%';
        
        var demoPanel = document.getElementById('nr-demographics');
        if (demoPanel) demoPanel.style.display = '';
        
        if (el('nr-zip-list')) {
            el('nr-zip-list').textContent = d.Zipcodes || '';
        }
        
        var zipPanel = document.getElementById('nr-zip-codes');
        if (zipPanel && d.Zipcodes) zipPanel.style.display = '';
        
    }
    
    // --- rendering ---
    
    function buildIndicatorCard(row, sectionId, neighborhoodName, accordionParentId) {
        
        // Build unique IDs for the accordion heading/collapse pair
        var accId = nextAccordionId();
        var headingId = accId + '-h';
        var collapseId = accId + '-c';
        
        // Preserve dash placeholder when the row has no direct neighborhood value
        var value =
        row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
        ? row.data_value_geo_entity
        : '–';
        
        // Build a compact units label from optional type and unit fields
        var unitParts = [];
        
        if (row.measurement_type) unitParts.push(row.measurement_type);
        if (row.units) unitParts.push(row.units);
        var units = unitParts.join(' ').trim();
        
        // Tertile pill for the header row (production uses .worse/.better/.middle classes)
        
        var pillLabel = getTertileLabel(row.data_value_rank, row.rankReverse);
        var pillClass = getTertilePillClass(row.data_value_rank, row.rankReverse);
        var pillHTML = '';
        
        if (pillLabel && pillClass) {
            pillHTML = '<span class="' + pillClass + '">' + pillLabel + '</span>';
        }
        
        var headerHTML =
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
        
        // Some indicators do not have comparative rank metadata
        var hasRank = row.data_value_rank != null;
        
        // Comparison blocks rely on the unmodified values for direction and text
        var boroComp = getComparison(
            row.unmodified_data_value_geo_entity,
            row.data_value_boro,
            row.rankReverse
        );
        
        // Separate city comparison to keep borough and city messaging independent
        var cityComp = getComparison(
            row.unmodified_data_value_geo_entity,
            row.data_value_nyc,
            row.rankReverse
        );
        
        var boroName = row.borough_name || 'Borough';
        
        var boroVal = row.data_value_boro != null ? row.data_value_boro : '';
        var cityVal = row.data_value_nyc != null ? row.data_value_nyc : '';
        var unitSuffix = '';
        
        // Use percent suffix for percentage-like metrics, otherwise append units
        if (row.measurement_type && row.measurement_type.toLowerCase().indexOf('ercent') !== -1) {
            
            unitSuffix = '%';
            
        } else if (row.units) {
            
            unitSuffix = ' ' + row.units;
            
        }
        
        var tertileInlineHTML = getTertileInlineLabel(row.data_value_rank, row.rankReverse);
        
        // This HTML block is assembled as a string to match existing Bootstrap markup
        var comparisonsHTML = '';
        // Hide comparison copy when rank-derived context is unavailable
        var hideClass = hasRank ? '' : ' d-none';
        
        comparisonsHTML =
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
                    
                    // Keep data-* attributes on the collapse panel for lazy map rendering
                    var detailHTML =
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
                    
                }
                
                function renderSection(section, neighborhoodName) {
                    
                    // Render one report topic section for the active neighborhood
                    console.log('renderSection: enter:', {
                        sectionId: section && section.id,
                        neighborhoodName: neighborhoodName
                    });
                    
                    // Section containers are layout-driven and may be absent in some templates
                    var container = document.getElementById(section.containerId);
                    
                    if (!container) {
                        
                        console.log('renderSection: branch-missing-container:', section.containerId);
                        return;
                        
                    }
                    
                    // Neighborhood-level rows are pre-grouped during loadSection
                    var byNeighborhood = sectionData[section.id] || {};
                    var rows = byNeighborhood[neighborhoodName] || [];
                    
                    // Reset section contents before re-rendering cards
                    container.innerHTML = '';
                    
                    if (!rows.length) {
                        
                        console.log('renderSection: branch-no-rows:', {
                            sectionId: section.id,
                            neighborhoodName: neighborhoodName
                        });
                        
                        container.innerHTML =
                        '<p class="text-muted px-2 pb-2 mb-0">No data available for this neighborhood.</p>';
                        
                        return;
                        
                    }
                    
                    // Create a local accordion parent id so each section collapses independently
                    var accordionParentId = 'nr-accordion-' + section.id;
                    
                    rows.forEach(function (row) {
                        
                        var card = document.createElement('div');
                        card.innerHTML = buildIndicatorCard(row, section.id, neighborhoodName, accordionParentId);
                        container.appendChild(card);
                        
                    });
                    
                }
                
                function renderAll(neighborhoodName, mapGeocode) {
                    
                    console.log('renderAll: enter:', {
                        neighborhoodName: neighborhoodName,
                        mapGeocode: mapGeocode
                    });
                    
                    // Record the active neighborhood used by downloads and rerenders
                    currentNeighborhood = neighborhoodName;
                    renderedPanels = {};
                    accordionCounter = 0;
                    
                    // Start empty and resolve from rows first, then map click, then name lookup
                    currentGeocode = null;
                    
                    // Prefer geocodes found directly in loaded rows before fallback lookups
                    for (var sid in sectionData) {
                        
                        var nb = sectionData[sid][neighborhoodName];
                        
                        if (nb && nb.length) {
                            
                            var row0 = nb[0];
                            
                            var gj =
                            row0.geo_join_id != null && row0.geo_join_id !== ''
                            ? row0.geo_join_id
                            : row0.geo_entity_id;
                            
                            if (gj != null && gj !== '') {
                                
                                console.log('renderAll: branch-found-geocode-in-section:', {
                                    sectionId: sid,
                                    geocode: gj
                                });
                                
                                currentGeocode = gj;
                                
                                break;
                                
                            }
                        }
                    }
                    
                    // Map click geocode is used when no geocode is discoverable in report rows
                    if (
                        (currentGeocode == null || currentGeocode === '') &&
                        mapGeocode != null &&
                        mapGeocode !== ''
                    ) {
                        
                        console.log('renderAll: branch-fallback-map-geocode:', mapGeocode);
                        currentGeocode = mapGeocode;
                        
                    }
                    
                    // Last fallback: resolve geocode by matching display name in neighborhood metadata
                    if (currentGeocode == null || currentGeocode === '') {
                        
                        console.log('renderAll: branch-fallback-display-name-lookup:', neighborhoodName);
                        currentGeocode = getUhfIdForDisplayName(neighborhoodName);
                        
                    }
                    
                    // Render sections first so heading/sidebar updates reflect visible card state
                    config.sections.forEach(function (section) {
                        renderSection(section, neighborhoodName);
                    });
                    
                    // Show the report header and fill in the neighborhood name
                    
                    var reportHeader = document.getElementById('nr-report-header');
                    var headerNeighborhood = document.getElementById('nr-header-neighborhood');
                    
                    if (reportHeader) {
                        reportHeader.style.display = '';
                    }
                    
                    if (headerNeighborhood) {
                        headerNeighborhood.textContent = neighborhoodName;
                    }
                    
                    // Mobile title
                    
                    var mobileTitle = document.getElementById('nr-mobile-title');
                    var mobileNeighborhood = document.getElementById('nr-mobile-neighborhood');
                    if (mobileTitle) mobileTitle.style.display = '';
                    if (mobileNeighborhood) mobileNeighborhood.textContent = neighborhoodName;
                    
                    // Refresh demographics after geocode resolution is complete
                    renderDemographics(currentGeocode);
                    
                    // Synchronize deep-link state after the page content has been refreshed
                    setNeighborhoodInURL(neighborhoodName);
                    updateTopicLinks(neighborhoodName);
                    
                }
                
                // --- CSV download ---
                
                function downloadCSV() {
                    
                    // Export only if both the viz table and active neighborhood are available
                    console.log('downloadCSV: enter:', { hasVizTable: !!vizTable, currentNeighborhood: currentNeighborhood });
                    
                    if (!vizTable || !currentNeighborhood) {
                        
                        console.log('downloadCSV: branch-missing-prereqs');
                        
                        return;
                        
                    }
                    
                    // Remove columns that are not useful in the public CSV export
                    var csv = vizTable
                        .select(aq.not('report_id', 'indicator_id', 'indicator_data_name', 'start_date', 'end_date'))
                        .filter(aq.escape(function (d) { return d.neighborhood === currentNeighborhood; }))
                        .toCSV();
                    
                    var filename = 'NYC EH Data Portal - Neighborhood Report - ' +
                    (config.reportName || 'Report') + ' - ' + currentNeighborhood + '.csv';
                    
                    // Use Blob URL download flow for broad browser compatibility
                    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    var url = URL.createObjectURL(blob);
                    var link = document.createElement('a');
                    
                    link.href = url;
                    link.download = filename;
                    link.click();
                    
                    URL.revokeObjectURL(url);
                    
                }
                
                window.nrDownloadCSV = downloadCSV;
                
                // --- Vega map + bar chart ---
                
                function renderNRMap(data, destination, legendLabel, geocode) {
                    
                    console.log('renderNRMap: enter:', {
                        
                        rowCount: data && data.length,
                        destination: destination,
                        legendLabel: legendLabel,
                        geocode: geocode
                        
                    });
                    
                    // Build external geography URLs from the configured EHDP-data branch
                    // Build the overview chart directly from the loaded summary rows
                    var boroTopoUrl = config.dataRepo + config.dataBranch + '/geography/borough.topo.json';
                    var uhfTopoUrl = config.dataRepo + config.dataBranch + '/geography/UHF42.topo.json';
                    
                    // Vega-Lite spec combines a choropleth map with a compact sorted bar strip
                    var spec = {
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
                    
                    // Embed into the target container and keep action menu enabled for debugging/export
                    vegaEmbed(destination, spec, { actions: true });
                    
                }
                
                function onAccordionExpand(event) {
                    
                    // Render indicator map/chart lazily when a panel is first expanded
                    console.log('onAccordionExpand: enter:', event && event.target && event.target.id);
                    
                    var panel = event.target;
                    var panelId = panel.id;
                    
                    // Skip repeat renders for the same panel to avoid extra viz work
                    if (renderedPanels[panelId]) {
                        
                        console.log('onAccordionExpand: branch-already-rendered:', panelId);
                        return;
                        
                    }
                    
                    // Pull rendering inputs from data-* attributes stored on the collapse node
                    var indicatorName = panel.getAttribute('data-indicator-name');
                    var geocode = panel.getAttribute('data-geocode') || currentGeocode;
                    var mapEl = panel.querySelector('.nr-map-container');
                    
                    // If required inputs are missing, keep the panel open but do not attempt render
                    if (!indicatorName || !mapEl || !vizTable) {
                        
                        console.log('onAccordionExpand: branch-missing-prereqs:', {
                            indicatorName: indicatorName,
                            hasMapEl: !!mapEl,
                            hasVizTable: !!vizTable
                        });
                        
                        return;
                    }
                    
                    try {
                        // Collapse the dataset to the latest value per neighborhood before drawing
                        var summaryData = vizTable
                            .filter(aq.escape(function (d) { return d.indicator_data_name === indicatorName; }))
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
                        
                        // Draw map and bar chart once summary data is available
                        if (summaryData.length) {
                            
                            console.log('onAccordionExpand: branch-render-map:', {
                                panelId: panelId,
                                indicatorName: indicatorName,
                                summaryRows: summaryData.length
                            });
                            
                            mapEl.innerHTML = '';
                            
                            var legendLabel = panel.getAttribute('data-legend-label');
                            
                            // Fall back to a generic legend title when no unit text is available
                            if (!legendLabel || !String(legendLabel).trim()) {
                                
                                console.log('onAccordionExpand: branch-default-legend-label');
                                legendLabel = 'Value';
                                
                            }
                            
                            renderNRMap(summaryData, '#' + mapEl.id, legendLabel, geocode);
                            
                        } else {
                            
                            console.log('onAccordionExpand: branch-no-summary-data:', indicatorName);
                            mapEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
                            
                        }
                        
                    } catch (e) {
                        
                        console.error('onAccordionExpand: error rendering map for ' + indicatorName + ':', e);
                        mapEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
                        
                    }
                    
                    // Mark panel as rendered even on no-data/error to prevent repeated work
                    renderedPanels[panelId] = true;
                    
                }
                
                // --- Leaflet neighborhood selector map ---
                
                var defaultStyle = {
                    weight: 1.5,
                    opacity: 1,
                    color: 'black',
                    dashArray: '1',
                    fillOpacity: 0.05,
                    fillColor: '#008939'
                };
                
                var highlightStyle = {
                    weight: 3,
                    color: '#008939',
                    dashArray: '3',
                    fillOpacity: 0.5
                };
                
                function styleFeature() {
                    // Base style for all UHF polygons before hover/selection overrides
                    return defaultStyle;
                }
                
                function highlightFeature(e) {
                    
                    // Temporary hover state for visual affordance
                    var layer = e.target;
                    layer.setStyle({ weight: 5, color: '#444', dashArray: '' });
                    layer.bringToFront();
                    
                }
                
                function resetHighlight(e) {
                    
                    var layer = e.target;
                    var geocode = layer.feature.properties.GEOCODE;
                    
                    // Preserve selected style for the active neighborhood while mousing out
                    if (geocode == currentGeocode) return;
                    
                    layer.setStyle({ weight: 1.5, color: 'black', dashArray: '1' });
                    
                }
                
                function selectLayer(layer, zoom) {
                    
                    // Clear previous selection style first
                    if (uhfLayer) uhfLayer.resetStyle();
                    
                    layer.setStyle(highlightStyle);
                    layer.bringToFront();
                    
                    // Optionally animate map to selection bounds for click-driven navigation
                    if (zoom && leafletMap) {
                        leafletMap.flyToBounds(layer.getBounds(), { duration: 0.5 });
                    }
                    
                }
                
                function geocodeToName(geocode) {
                    
                    // Resolve UHF geocode to display name used by report rows
                    if (typeof neighborhoods === 'undefined') return null;
                    
                    var match = neighborhoods.find(function (n) { return n.UHF_id == geocode; });
                    
                    if (!match) return null;
                    
                    var name = match.UHF_name;
                    
                    return nameCorrections[name] || name;
                    
                }
                
                function findLayerByGeocode(geocode) {
                    
                    // Find the matching rendered Leaflet layer by UHF geocode
                    if (!uhfLayer) return null;
                    
                    var match = null;
                    
                    uhfLayer.eachLayer(function (layer) {
                        
                        if (layer.feature.properties.GEOCODE == geocode) {
                            match = layer;
                        }
                        
                    });
                    
                    return match;
                }
                
                function findLayerByName(name) {
                    
                    // Convert display name -> UHF id -> Leaflet layer
                    if (typeof neighborhoods === 'undefined' || !uhfLayer) return null;
                    
                    var entry = neighborhoods.find(function (n) {
                        
                        var corrected = nameCorrections[n.UHF_name] || n.UHF_name;
                        return corrected === name;
                        
                    });
                    
                    if (!entry) return null;
                    
                    return findLayerByGeocode(entry.UHF_id);
                    
                }
                
                function onMapClick(e) {
                    
                    // Map click drives neighborhood selection for the full report UI
                    var layer = e.target;
                    var geocode = layer.feature.properties.GEOCODE;
                    var name = geocodeToName(geocode) || layer.feature.properties.GEONAME;
                    
                    selectLayer(layer, true);
                    
                    // Ignore click-driven render until all report and viz payloads have loaded
                    if (dataReady) {
                        
                        console.log('onMapClick: branch-render-all:', { name: name, geocode: geocode });
                        renderAll(name, geocode);
                        
                    } else {
                        
                        console.log('onMapClick: branch-data-not-ready:', { name: name, geocode: geocode });
                        
                    }
                }
                
                function onEachFeature(feature, layer) {
                    
                    // Attach tooltip and pointer handlers for each UHF polygon
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
                    
                }
                
                function initLeafletMap() {
                    
                    // Initialize Leaflet with a neutral NYC-centered default view
                    console.log('initLeafletMap: enter:', config.geojsonUrl);
                    
                    leafletMap = L.map('nr-map', { zoomControl: false }).setView([40.7128, -74.006], 10);
                    
                    // Use CARTO basemap tiles to match existing portal styling
                    L.tileLayer(
                        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                        {
                            maxZoom: 15,
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        }
                    ).addTo(leafletMap);
                    
                    // Imperative scale control matches existing map UI expectations
                    L.control.scale({ metric: false, position: 'bottomleft' }).addTo(leafletMap);
                    
                    // Load the neighborhood polygons once, then wait for the data pipeline to finish
                    fetch(config.geojsonUrl)
                        .then(function (response) { return response.json(); })
                        .then(function (data) {
                            
                            console.log('initLeafletMap: branch-geojson-loaded:', {
                                featureCount: data && data.features && data.features.length
                                
                            });
                            uhfLayer = L.geoJSON(data, {
                                style: styleFeature,
                                onEachFeature: onEachFeature,
                                filter: function (feature) { return feature.properties.GEOCODE != 0; }
                            }).addTo(leafletMap);
                            
                            mapReady = true;
                            tryInitialRender();
                            
                        })
                        .catch(function (err) {
                            
                            console.error('Error loading UHF42 GeoJSON:', err);
                            console.log('initLeafletMap: branch-geojson-load-failed:', err);
                            
                            mapReady = true;
                            tryInitialRender();
                            
                        });
                }
                
                // --- data loading ---
                
                function tryInitialRender() {
                    
                    // Guard initial render until both data payloads and map geometry are ready
                    console.log('tryInitialRender: enter:', { dataReady: dataReady, mapReady: mapReady });
                    
                    if (!dataReady || !mapReady) {
                        console.log('tryInitialRender: branch-waiting');
                        return;
                        
                    }
                    
                    // If a neighborhood is already in the URL, honor it after both data sources are ready
                    
                    var fromURL = getNeighborhoodFromURL();
                    
                    if (fromURL) {
                        
                        console.log('tryInitialRender: branch-from-url:', fromURL);
                        
                        var layer = findLayerByName(fromURL);
                        
                        if (layer) {
                            console.log('tryInitialRender: branch-select-layer-from-url');
                            selectLayer(layer, true);
                        }
                        
                        // If URL neighborhood is unknown to map geometry, render still proceeds
                        renderAll(fromURL);
                        
                    }
                }
                
                function checkAllLoaded() {
                    
                    // Central gate that tracks when all asynchronous loading has completed
                    console.log('checkAllLoaded: enter:', {
                        fetchesCompleteBefore: fetchesComplete,
                        totalFetches: totalFetches
                    });
                    
                    // totalFetches includes every section JSON plus the optional viz dataset
                    fetchesComplete++;
                    
                    if (fetchesComplete >= totalFetches) {
                        
                        console.log('checkAllLoaded: branch-ready');
                        dataReady = true;
                        tryInitialRender();
                        
                    }
                }
                
                // GitHub raw URLs must not contain literal spaces in the path; some clients
                // reject them or fail inconsistently. Encode the last path segment if needed
                
                function normalizeReportUrl(url) {
                    
                    // Normalize only when needed so already-safe URLs remain untouched
                    console.log('normalizeReportUrl: enter:', url);
                    
                    if (!url || url.indexOf(' ') === -1) return url;
                    
                    try {
                        
                        // Parse via URL API so we can safely target only the path segment
                        var u = new URL(url);
                        var parts = u.pathname.split('/').filter(Boolean);
                        
                        if (!parts.length) return url;
                        
                        var last = parts[parts.length - 1];
                        
                        // Re-encode defensively for names that may already be partially encoded
                        try {
                            
                            last = encodeURIComponent(decodeURIComponent(last));
                            
                        } catch (e) {
                            
                            last = encodeURIComponent(last);
                            
                        }
                        
                        parts[parts.length - 1] = last;
                        u.pathname = '/' + parts.join('/');
                        console.log('normalizeReportUrl: branch-encoded:', u.href);
                        
                        return u.href;
                        
                    } catch (err) {
                        
                        console.log('normalizeReportUrl: branch-parse-failed:', err);
                        return url;
                        
                    }
                }
                
                function loadSection(section) {
                    
                    // Load a single topic report JSON and index rows by neighborhood name
                    console.log('loadSection: enter:', {
                        sectionId: section && section.id,
                        reportUrl: section && section.reportUrl
                    });
                    
                    fetch(normalizeReportUrl(section.reportUrl))
                        .then(function (response) {
                            
                            if (!response.ok) throw new Error('HTTP ' + response.status);
                            return response.json();
                            
                        })
                        .then(function (data) {
                            
                            // Non-array responses are treated as empty to keep rendering resilient
                            var rows = Array.isArray(data) ? data : [];
                            
                            console.log('loadSection: branch-data-loaded:', {
                                sectionId: section.id,
                                rowCount: rows.length
                                
                            });
                            
                            // Build neighborhood buckets once during load for faster rerenders
                            var byNeighborhood = {};
                            
                            rows.forEach(function (row) {
                                
                                var n = row.neighborhood;
                                
                                if (!n) return;
                                if (!byNeighborhood[n]) byNeighborhood[n] = [];
                                
                                byNeighborhood[n].push(row);
                                
                            });
                            
                            // Sort so higher-priority ranked indicators appear first in each section
                            Object.keys(byNeighborhood).forEach(function (n) {
                                
                                byNeighborhood[n].sort(function (a, b) {
                                    
                                    var ra = Number(a.data_value_rank);
                                    var rb = Number(b.data_value_rank);
                                    if (isNaN(ra) || isNaN(rb)) return 0;
                                    return rb - ra;
                                    
                                });
                            });
                            
                            // Group rows once so each neighborhood render can stay cheap
                            sectionData[section.id] = byNeighborhood;
                        })
                        .catch(function (error) {
                            
                            console.error('Error loading section "' + section.id + '":', error);
                            console.log('loadSection: branch-load-failed:', {
                                sectionId: section.id,
                                error: error
                            });
                            
                            sectionData[section.id] = {};
                            
                        })
                        .then(checkAllLoaded);
                }
                
                function loadVizData() {
                    
                    // Load the cross-indicator dataset used for accordion map/chart rendering
                    console.log('loadVizData: enter:', config.vizUrl);
                    
                    // If no viz URL is configured, continue with section-only rendering
                    if (!config.vizUrl) {
                        
                        console.log('loadVizData: branch-no-viz-url');
                        checkAllLoaded();
                        return;
                        
                    }
                    
                    aq.loadJSON(config.vizUrl, { autoMax: 10000, parse: { time: String } })
                        .then(function (table) {
                            
                            console.log('loadVizData: branch-data-loaded:', table && table.numRows && table.numRows());
                            vizTable = table;
                            
                        })
                        .catch(function (error) {
                            
                            console.error('Error loading viz data:', error);
                            console.log('loadVizData: branch-load-failed:', error);
                            vizTable = null;
                            
                        })
                        .then(checkAllLoaded);
                }
                
                // --- init ---
                
                // Register bootstrap collapse event listener for lazy per-indicator visualizations
                // Hook accordion expansion before data arrives so first open can render immediately
                $(document).on('shown.bs.collapse', '.collapse', onAccordionExpand);
                
                // Start map and data loads in parallel
                initLeafletMap();
                
                config.sections.forEach(section => loadSection(section));
                
                loadVizData();
                
            })();
