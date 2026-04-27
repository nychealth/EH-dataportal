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
var isPercent;
var displayType;

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
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0
    }).addTo(currentMap);

    console.log("* initBaseMap: tile layer ready");

};

// ----------------------------------------------------------------------- //
// Clear existing bubbles from the map
// ----------------------------------------------------------------------- //

const clearBubbles = () => {
    currentBubbleMarkers.forEach(marker => {
        currentMap.removeLayer(marker);
    });
    currentBubbleMarkers = [];
};

// Shared helpers for map rendering
const createDataLookup = (data) => {
    const dataLookup = {};
    data.forEach(item => {
        dataLookup[item.GeoID] = item;
    });
    return dataLookup;
};

const resetMapForRender = () => {
    clearBubbles();
    initBaseMap();
    if (currentGeojsonLayer) {
        currentMap.removeLayer(currentGeojsonLayer);
        currentGeojsonLayer = null;
    }
    return currentMap;
};

const getMapStats = (data) => {
    const values = data.map(d => d.Value).filter(v => v != null);
    return {
        values,
        minValue: values.length ? Math.min(...values) : 0,
        maxValue: values.length ? Math.max(...values) : 0
    };
};

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

const createColorScale = (minValue, maxValue) => {
    return d3.scaleSequential()
        .domain([maxValue, minValue])
        .interpolator(d3.interpolateViridis);
};

const formatMapValue = (value, digits) => {
    return value != null
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }) + displayType
        : '—';
};

const createMapPopupContent = (properties, metadata, options = {}) => {
    const requireGeoRank = options.requireGeoRank ?? true;
    const valueDigits = options.valueDigits ?? 2;

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
        document.getElementById('legend-tick').style.display = 'block';
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

    const hasCI = data.some(d => /\(.*\)/.test(d.CI));

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type
    // ----------------------------------------------------------------------- //

    topoFile = getGeoFile(mapGeoType);

    // ----------------------------------------------------------------------- //
    // Determine map type based on measurement type
    // ----------------------------------------------------------------------- //

    const isNumberMap = mapMeasurementType.includes('number') || 
                        mapMeasurementType.includes('Number') || 
                        mapMeasurementType.includes('Total');

    if (isNumberMap) {
        
        console.log(">>> NUMBER MAP - Bubble map rendering");
        return renderBubbleMap(data, metadata, mapGeoType, mapTime, topoFile);
                
    } else {
        
        console.log(">>> CHOROPLETH MAP - Rendering choropleth");
        
        // ----------------------------------------------------------------------- //
        // CHOROPLETH MAP RENDERING
        // ----------------------------------------------------------------------- //
        
        return renderChoroplethMap(data, metadata, mapGeoType, mapTime, topoFile);
    }

};

// ----------------------------------------------------------------------- //
// Choropleth map rendering function
// ----------------------------------------------------------------------- //

const renderChoroplethMap = (data, metadata, mapGeoType, mapTime, topoFile) => {

        // Switch units and subtitle formatting when the measure is percentage-based.
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

    setMapLegendValues(minValue, maxValue, 2);

    const colorScale = createColorScale(minValue, maxValue);

    const styleFeature = (feature) => {
        const value = feature.properties.Value;
        return {
            fillColor: value != null ? colorScale(value) : '#ccc',
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.8
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

    const createPopupContent = (properties) => createMapPopupContent(properties, metadata, {
        requireGeoRank: true,
        valueDigits: 2
    });

    const {
        updateHoverUI,
        clearHoverUI,
        calculatePercent
    } = createHoverUIHelpers(metadata, minValue, maxValue, 2);

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
            // Lookup to match GeoID → Leaflet layer
            // --------------------------------------------------------------------------- //
            const geoIDtoLayer = {};   
            // --------------------------------------------------------------------------- //

            // --- Add the GeoJSON to the map ---

            const geojsonLayer = L.geoJson(geojson, {

                style: styleFeature,
                onEachFeature: (feature, layer) => {
                    
                    // Store reference so we can highlight later using GeoID from chart
                    const geoID = feature.properties.GeoID || feature.properties.GEOCODE;
                    // Keep a direct GeoID-to-layer map for bar-to-map hover interop.
                    if (geoID) {
                        geoIDtoLayer[geoID] = layer;
                    }
                    
                    // ----------------------------------------------------------------------- //
                    
                    layer.bindPopup(createPopupContent(feature.properties));
                    
                    layer.on('click', (e) => {
                        const props = feature.properties;
                        console.log("** click", feature.properties);

                        if (window.myVegaView) {
                            // Forward map clicks into the bar chart only when the Vega view has finished loading.
                            window.myVegaView.signal("selectedGeo", props.GeoID).run();
                        }
                    });

                    let currentlyHighlighted = null;
                    
                    layer.on('mouseover', (e) => {
                        const props = feature.properties;

                        // 🔥 HARD RESET: clear ALL highlights
                        // Clear any previous highlight before applying the current hover state.
                        geojsonLayer.eachLayer((l) => {
                            geojsonLayer.resetStyle(l);
                        });

                        // Apply highlight to current
                        highlightFeature(e);

                        updateHoverUI(props);

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", props.GeoID).run();
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
    chartType = 'map';

    return mapRenderPromise;
};

// ----------------------------------------------------------------------- //
// Bubble map rendering function
// ----------------------------------------------------------------------- //

const renderBubbleMap = (data, metadata, mapGeoType, mapTime, topoFile) => {
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

    const createPopupContent = (properties) => createMapPopupContent(properties, metadata, {
        requireGeoRank: false,
        valueDigits: 0
    });

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
                updateHoverUI,
                clearHoverUI
            };

        });

    // send info for printing
    vizYear = mapTime;
    vizGeography = mapGeoType;
    chartType = 'bubble-map';

    return mapRenderPromise;
};