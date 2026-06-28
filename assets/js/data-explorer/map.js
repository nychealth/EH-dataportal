// ======================================================================= //
// map.js
// ======================================================================= //

// Leaflet choropleth map: initialization, data join, color scale, and tooltips

// console.log(">> map.js");

// ----------------------------------------------------------------------- //
// module-level state
// ----------------------------------------------------------------------- //

let currentMap = null;
let currentGeojsonLayer = null;
let currentBubbleMarkers = [];

// Display Parameters
let isPercent;
let displayType;

// ----------------------------------------------------------------------- //
// base map initialization (fires immediately on script load)
// ----------------------------------------------------------------------- //

// Initialize the base tile layer early so it loads in the background

// Creates the shared Leaflet base map once and reuses it across renders.
const initBaseMap = () => {

    // Skip re-initialization when the base Leaflet instance already exists.
    if (currentMap) return; // already initialized

    currentMap = L.map('map', {
        zoomControl: false
    }).setView([40.700142, -73.921546], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        crossOrigin: true,
        subdomains: 'abcd',
        maxZoom: 11,
        minZoom: 7
    }).addTo(currentMap);

    console.log("* initBaseMap: tile layer ready");

};

// ----------------------------------------------------------------------- //
// Clear existing bubbles from the map
// ----------------------------------------------------------------------- //

// Removes any bubble overlays left from number-map rendering.
const clearBubbles = () => {
    currentBubbleMarkers.forEach(marker => {
        currentMap.removeLayer(marker);
    });
    currentBubbleMarkers = [];
};

// ----------------------------------------------------------------------- //
// shared render helpers
// ----------------------------------------------------------------------- //

// Shared helpers for map rendering
const createDataLookup = (data) => {
    const dataLookup = {};
    data.forEach(item => {
        dataLookup[item.GeoID] = item;
    });
    return dataLookup;
};

// Reuses the base map instance while clearing old geometry overlays between renders.
const resetMapForRender = () => {
    clearBubbles();
    initBaseMap();
    if (currentGeojsonLayer) {
        currentMap.removeLayer(currentGeojsonLayer);
        currentGeojsonLayer = null;
    }
    return currentMap;
};

// Calculates legend bounds from the currently filtered map rows.
const getMapStats = (data) => {
    const values = data.map(d => d.Value).filter(v => v != null);
    return {
        values,
        minValue: values.length ? Math.min(...values) : 0,
        maxValue: values.length ? Math.max(...values) : 0
    };
};

// Prints current legend endpoints using the active display units.
const setMapLegendValues = (minValue, maxValue, digits) => {
    document.getElementById('minVal').innerHTML = minValue.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }) + displayType;
    document.getElementById('maxVal').innerHTML = maxValue.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }) + displayType;
};

// Uses a reversed Viridis scale so larger values remain visually darker.
const createColorScale = (minValue, maxValue) => {
    return d3.scaleSequential()
        .domain([maxValue, minValue])
        .interpolator(d3.interpolateViridis);
};

// Centralizes map value formatting for tooltips, legend hover, and popups.
const formatMapValue = (value, digits) => {
    return value != null
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }) + displayType
        : '—';
};

// Builds shared popup markup for both choropleth polygons and bubble markers.
const createMapPopupContent = (properties, metadata, options = {}) => {
    const requireGeoRank = options.requireGeoRank ?? true;
    const valueDigits = options.valueDigits ?? 1;

    if (requireGeoRank && !properties.GeoRank) {
        return;
    }

    if (!requireGeoRank && properties.Value == null && !properties.GeoRank) {
        return;
    }

    const note = properties.Note && properties.Note.length > 1
        ? `<div class="popup-note">${properties.Note}</div>`
        : '';

    return `
        <div class="popup-content">
            <div class="popup-header">
                <strong>${properties.Geography}</strong>
            </div>
            <div class="popup-body">
                <div class="popup-row">
                    <div class="popup-indicator">
                        ${indicator.IndicatorName}
                        <div class="popup-period">(${properties.TimePeriod || 'Unknown'})</div>
                    </div>
                    <div class="popup-value">
                        <span class="value-number">${formatMapValue(properties.Value, valueDigits)}</span>
                        <span class="value-unit">${metadata[0].DisplayType.toLowerCase()}</span>
                    </div>
                </div>
            </div>
            ${note}
        </div>
    `;
};

// Builds popup markup specifically for citywide-only data
const createCitywidePopupContent = (citywideData, metadata) => {
    return `
        <div class="popup-content">
            <div class="popup-header">
                <strong>NYC</strong>
            </div>
            <div class="popup-body">
                <div class="popup-row">
                    <div class="popup-indicator">
                        ${indicator.IndicatorName}
                        <div class="popup-period">(${citywideData.TimePeriod || 'Unknown'})</div>
                    </div>
                    <div class="popup-value">
                        <span class="value-number">${citywideData.Value}</span>
                        <span class="value-unit">${metadata[0].DisplayType.toLowerCase()}</span>
                    </div>
                </div>
            </div>
            <div class="popup-note fs-xs">This dataset isn't available broken down by neighborhood.</div>
        </div>
    `;
};

// Coordinates legend hover text and tick placement with hovered map features.
const createHoverUIHelpers = (metadata, minValue, maxValue, digits) => {
    const calculatePercent = (x) => {
        const range = maxValue - minValue;
        if (range === 0 || x == null) {
            return 0;
        }
        return 100 * (x - minValue) / range;
    };

    const updateHoverUI = (props) => {
        document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
        document.getElementById('hoveredValue').textContent = formatMapValue(props.Value, digits);
        document.getElementById('hoveredUnits').textContent = metadata[0].DisplayType.toLowerCase();

        const legendTick = document.getElementById('legend-tick');

        // Keep no-data hover text visible without drawing a stray tick on the legend.
        if (props.Value == null) {
            legendTick.style.display = 'none';
            return;
        }

        legendTick.style.display = 'block';
        document.querySelector('.viridis-tick').style.left = calculatePercent(props.Value) + '%';
    };

    const clearHoverUI = () => {
        document.getElementById('hoveredGeo').textContent = 'Hover for details';
        document.getElementById('hoveredValue').textContent = '';
        document.getElementById('hoveredUnits').textContent = '';
        document.getElementById('legend-tick').style.display = 'none';
    };

    return {
        updateHoverUI,
        clearHoverUI,
        calculatePercent
    };
};

// Copies filtered indicator rows onto matching geometry features before rendering.
const attachDataToGeojsonFeatures = (geojson, dataLookup) => {
    geojson.features.forEach((feature) => {
        const geoID = feature.properties.GEOCODE;
        const matchedData = dataLookup[geoID];

        if (matchedData) {
            feature.properties = {
                ...feature.properties,
                ...matchedData
            };
        } else {
            feature.properties.dataValue = null;
        }
    });
    return geojson;
};

// Fire immediately

initBaseMap();

// Joins filtered data onto geography features and renders the choropleth layer.
const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");
    console.log(metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let mapGeoType = data[0]?.GeoType;
    let mapMeasurementType = metadata[0]?.MeasurementType;
    let mapTime = mapTimes[0];
    let topoFile = '';

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type
    // ----------------------------------------------------------------------- //

    topoFile = getGeoFile(mapGeoType);

    // ----------------------------------------------------------------------- //
    // Check if the data are citywide only
    // ----------------------------------------------------------------------- //
    
    const isCitywideOnly = metadata[0].AvailableGeoTypes.length === 1 && 
                           metadata[0].AvailableGeoTypes[0] === 'Citywide';
    
    if (isCitywideOnly) {
        console.log(">>> CITYWIDE ONLY - Rendering citywide map");
    }

    // ----------------------------------------------------------------------- //
    // Determine map type based on measurement type
    // ----------------------------------------------------------------------- //

    const isNumberMap = mapMeasurementType.includes('number') || 
                        mapMeasurementType.includes('Number') || 
                        mapMeasurementType.includes('Total');

    if (isNumberMap) {
        
        console.log(">>> NUMBER MAP - Bubble map rendering");
        return renderBubbleMap(data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly);
                
    } else {
        
        console.log(">>> CHOROPLETH MAP - Rendering choropleth");
        
        // ----------------------------------------------------------------------- //
        // CHOROPLETH MAP RENDERING
        // ----------------------------------------------------------------------- //
        
        return renderChoroplethMap(data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly);
    }

};

// ----------------------------------------------------------------------- //
// Choropleth map rendering function
// ----------------------------------------------------------------------- //

const renderChoroplethMap = (data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly = false) => {

    // Percent measures show percent-formatted legends; everything else stays unitless here.
    if (metadata[0].MeasurementType.includes('Percent') || metadata[0].MeasurementType.includes('percent') && !metadata[0].MeasurementType.includes('percentile')) {

        isPercent = true;
        displayType = '%';
        
    } else {
        isPercent = false;
        displayType = '';
    }

    const dataLookup = createDataLookup(data);
    const map = resetMapForRender();
    const { minValue, maxValue } = getMapStats(data);

    setMapLegendValues(minValue, maxValue, 1);

    const colorScale = createColorScale(minValue, maxValue);

    const styleFeature = (feature) => {
        const value = feature.properties.Value;
        return {
            fillColor: value != null ? colorScale(value) : '#ccc',
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.65
        };
    };

    const highlightFeature = (e) => {
        const layer = e.target;
        layer.setStyle({
            weight: 3,
            color: '#000',
            fillOpacity: 0.9
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    };

    const resetHighlight = (layer, e) => {
        layer.resetStyle(e.target);
    };

    const createPopupContent = (properties) => {
        // Use citywide-specific popup if this is citywide-only data
        if (isCitywideOnly) {
            return createCitywidePopupContent(data[0], metadata);
        }
        
        return createMapPopupContent(properties, metadata, {
            requireGeoRank: true,
            valueDigits: 1
        });
    };

    const {
        updateHoverUI,
        clearHoverUI,
        calculatePercent
    } = createHoverUIHelpers(metadata, minValue, maxValue, 1);

    const mapRenderPromise = fetch(`${data_repo}${data_branch}/geography/${topoFile}`)
        .then(response => response.json())
        .then(topology => {
            
            // Convert TopoJSON once, then enrich each feature with filtered indicator data.
            // --- Convert TopoJSON to GeoJSON ---
            let geojson = topojson.feature(topology, topology.objects.collection);

            // --- Attach data to each feature ---
            geojson = attachDataToGeojsonFeatures(geojson, dataLookup);

            return geojson;
            
        })
        .then(geojson => {
            
            // --------------------------------------------------------------------------- //
            // Lookup to match GeoID → Leaflet layer
            // --------------------------------------------------------------------------- //
            const geoIDtoLayer = {};   
            // --------------------------------------------------------------------------- //

            // --- Add the GeoJSON to the map ---

            const geojsonLayer = L.geoJson(geojson, {

                style: styleFeature,
                onEachFeature: (feature, layer) => {
                    
                    // Store reference so we can highlight later using GeoID from chart
                    
                    const joinedGeoID = feature.properties.GeoID;
                    const featureGeoCode = feature.properties.GEOCODE;

                    // Keep a direct GeoID-to-layer map for bar-to-map hover interop.
                    // Register both joined GeoID and source GEOCODE in raw and string form.
                    [joinedGeoID, featureGeoCode].forEach((candidate) => {
                        if (candidate !== undefined && candidate !== null && candidate !== '') {
                            geoIDtoLayer[candidate] = layer;
                            geoIDtoLayer[String(candidate)] = layer;
                        }
                    });
                    
                    // ----------------------------------------------------------------------- //
                    
                    layer.bindPopup(createPopupContent(feature.properties));
                    
                    layer.on('click', (e) => {
                        const props = feature.properties;
                        console.log("** click", feature.properties);

                        // For citywide-only data, switch to trend tab
                        if (isCitywideOnly) {
                            const element = document.getElementById('v-pills-trends-tab');
                            if (element) {
                                element.click();
                            } else {
                                console.warn("Trend tab element not found for citywide map click-through.");
                            }
                        }

                        const linkedGeoID = props.GeoID ?? props.GEOCODE;

                        if (window.myVegaView && linkedGeoID !== undefined && linkedGeoID !== null) {
                            // Forward map clicks into the bar chart only when the Vega view has finished loading.
                            window.myVegaView.signal("selectedGeo", linkedGeoID).run();
                        }
                    });

                    let currentlyHighlighted = null;
                    
                    layer.on('mouseover', (e) => {
                        const props = feature.properties;
                        const linkedGeoID = props.GeoID ?? props.GEOCODE;
                        const hasMappedValue = props.Value != null;

                        // Clear any previous highlight before applying the current hover state.
                        geojsonLayer.eachLayer((l) => {
                            geojsonLayer.resetStyle(l);
                        });

                        // Apply highlight to current
                        highlightFeature(e);

                        updateHoverUI(props);

                        // Do not push no-data geographies into the linked bar highlight.
                        if (window.myVegaView && hasMappedValue && linkedGeoID !== undefined && linkedGeoID !== null) {
                            window.myVegaView.signal("selectedGeo", linkedGeoID).run();
                        } else if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", null).run();
                        }
                    });
                    
                    layer.on('mouseout', (e) => {
                        geojsonLayer.resetStyle(e.target);
                        clearHoverUI();

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", null).run();
                        }
                    });
                    
                }
            }).addTo(map);

            currentGeojsonLayer = geojsonLayer;

            // For citywide-only data, open the popup immediately at map center
            if (isCitywideOnly) {
                const citywidePopupContent = createCitywidePopupContent(data[0], metadata);
                L.popup()
                    .setLatLng([40.711409, -74.016813])
                    .setContent(citywidePopupContent)
                    .openOn(map);
                
                // Switch to trend tab
                const element = document.getElementById('v-pills-trend');
                if (element) {
                    element.click();
                } else {
                    console.warn("Trend tab element not found for citywide map click-through.");
                }
            }

            // exposes map functions globally for chart-to-map hover cross-linking
            window.mapInterop = {
                geoIDtoLayer,
                geojsonLayer,
                highlightFeature,
                resetHighlight: (layer) => geojsonLayer.resetStyle(layer),
                updateHoverUI,
                clearHoverUI
            };

        });

    // send info for printing
    vizYear = mapTime;
    vizGeography = mapGeoType;
    selectedMapMetadata = metadata[0] || null;
    vizSource = metadata[0]?.Sources;
    chartType = 'map';

    return mapRenderPromise;
};

// ----------------------------------------------------------------------- //
// Bubble map rendering function
// ----------------------------------------------------------------------- //

const renderBubbleMap = (data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly = false) => {
    const dataLookup = createDataLookup(data);
    const map = resetMapForRender();
    const { minValue, maxValue } = getMapStats(data);
    isPercent = false;
    displayType = '';

    setMapLegendValues(minValue, maxValue, 0);

    const colorScale = createColorScale(minValue, maxValue);

    const radiusScale = d3.scaleSqrt()
        .domain([minValue, maxValue])
        .range([4, 20]);

    const styleFeature = () => ({
        fillColor: '#eee',
        weight: 1,
        color: '#999',
        fillOpacity: 0.3
    });

    const createPopupContent = (properties) => {
        // Use citywide-specific popup if this is citywide-only data
        if (isCitywideOnly) {
            return createCitywidePopupContent(data[0], metadata);
        }
        
        return createMapPopupContent(properties, metadata, {
            requireGeoRank: false,
            valueDigits: 0
        });
    };

    const {
        updateHoverUI,
        clearHoverUI,
        calculatePercent
    } = createHoverUIHelpers(metadata, minValue, maxValue, 0);

    const mapRenderPromise = fetch(`${data_repo}${data_branch}/geography/${topoFile}`)
        .then(response => response.json())
        .then(topology => {
            
            // --- Convert TopoJSON to GeoJSON ---
            let geojson = topojson.feature(topology, topology.objects.collection);

            // --- Attach data to each feature ---
            geojson = attachDataToGeojsonFeatures(geojson, dataLookup);

            return geojson;
            
        })
        .then(geojson => {
            
            // --------------------------------------------------------------------------- //
            // Lookup to match GeoID → Leaflet layer (for chart interop)
            // --------------------------------------------------------------------------- //
            const geoIDtoLayer = {};
            const circleMarkers = [];  // Store all circle markers for interop
            // --------------------------------------------------------------------------- //

            // --- Add the GeoJSON overlay (light gray polygons) ---
            const geojsonLayer = L.geoJson(geojson, {
                style: styleFeature,
                onEachFeature: (feature, layer) => {
                    const geoID = feature.properties.GeoID || feature.properties.GEOCODE;
                    if (geoID) {
                        geoIDtoLayer[geoID] = layer;
                    }
                    
                    layer.bindPopup(createPopupContent(feature.properties));
                    
                    // For citywide-only data, add click handler to switch to trend tab
                    if (isCitywideOnly) {
                        layer.on('click', () => {
                            const element = document.getElementById('v-pills-trend');
                            if (element) {
                                element.click();
                            } else {
                                console.warn("Trend tab element not found for citywide map click-through.");
                            }
                        });
                    }
                }
            }).addTo(map);

            currentGeojsonLayer = geojsonLayer;

            // --- Add bubbles on top ---
            data.forEach(item => {
                if (item.Lat != null && item.Long != null && item.Value != null) {
                    const latlng = [item.Lat, item.Long];
                    const circle = L.circleMarker(latlng, {
                        radius: radiusScale(item.Value),
                        fillColor: colorScale(item.Value),
                        color: '#333',  // dark stroke
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.9
                    }).addTo(map);

                    // Track for cleanup
                    currentBubbleMarkers.push(circle);

                    circle.bindPopup(createPopupContent(item));

                    // Store reference for chart interop
                    circleMarkers.push({
                        geoID: item.GeoID,
                        marker: circle,
                        originalStyle: {
                            radius: radiusScale(item.Value),
                            fillColor: colorScale(item.Value),
                            color: '#333',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.9
                        }
                    });

                    // --- Add hover and click interactions to bubbles ---
                    circle.on('click', (e) => {
                        console.log("** click", item);

                        // For citywide-only data, switch to trend tab
                        if (isCitywideOnly) {
                            const element = document.getElementById('v-pills-trend');
                            if (element) {
                                element.click();
                            } else {
                                console.warn("Trend tab element not found for citywide map click-through.");
                            }
                        }

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", item.GeoID).run();
                        }
                    });

                    circle.on('mouseover', (e) => {
                        // Highlight the bubble
                        circle.setStyle({
                            weight: 3,
                            color: '#000',
                            fillOpacity: 1
                        });

                        updateHoverUI(item);

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", item.GeoID).run();
                        }
                    });

                    circle.on('mouseout', (e) => {
                        // Reset the bubble style
                        const original = circleMarkers.find(c => c.marker === circle).originalStyle;
                        circle.setStyle(original);

                        clearHoverUI();

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", null).run();
                        }
                    });
                }
            });

            // For citywide-only data, open the popup immediately at map center
            if (isCitywideOnly) {
                const citywidePopupContent = createCitywidePopupContent(data[0], metadata);
                L.popup()
                    .setLatLng([40.711409, -74.016813])
                    .setContent(citywidePopupContent)
                    .openOn(map);
                
                // Switch to trend tab
                const element = document.getElementById('v-pills-trend');
                if (element) {
                    element.click();
                } else {
                    console.warn("Trend tab element not found for citywide map click-through.");
                }
            }

            // --- Expose map functions globally for chart-to-map hover cross-linking ---
            window.mapInterop = {
                geoIDtoLayer,
                geojsonLayer,
                circleMarkers,
                highlightBubble: (geoID) => {
                    const markerObj = circleMarkers.find(c => c.geoID === geoID);
                    if (markerObj) {
                        markerObj.marker.setStyle({
                            weight: 3,
                            color: '#000',
                            fillOpacity: 1
                        });
                    }
                },
                resetBubble: (geoID) => {
                    const markerObj = circleMarkers.find(c => c.geoID === geoID);
                    if (markerObj) {
                        markerObj.marker.setStyle(markerObj.originalStyle);
                    }
                },
                // Keep interop API shape consistent with choropleth mode.
                resetHighlight: (geoID) => {
                    const markerObj = circleMarkers.find(c => c.geoID === geoID);
                    if (markerObj) {
                        markerObj.marker.setStyle(markerObj.originalStyle);
                    }
                },
                updateHoverUI,
                clearHoverUI
            };

        });

    // send info for printing
    vizYear = mapTime;
    vizGeography = mapGeoType;
    selectedMapMetadata = metadata[0] || null;
    vizSource = metadata[0]?.Sources;
    chartType = 'bubble-map';

    return mapRenderPromise;
};