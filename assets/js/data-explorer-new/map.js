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

    // Clear any existing bubbles from previous renders
    clearBubbles();

    // --- Create a lookup for data and attributes ---
    const dataLookup = {};

    // Index rows by GeoID so each feature lookup stays O(1) during attachment.
    data.forEach(item => {
        dataLookup[item.GeoID] = item;  // store the full record
    });

    // Ensure base map is ready (no-op if already initialized)
    initBaseMap();

    // Remove previous data layer if it exists
    // Remove the previous thematic layer before drawing the next one.
    if (currentGeojsonLayer) {
        currentMap.removeLayer(currentGeojsonLayer);
        currentGeojsonLayer = null;
    }

    let map = currentMap;

    // --- Find the min and max values in your dataset ---
    const values = data.map(d => d.Value).filter(v => v != null);
    const minValue = Math.min(...values).toFixed(2);
    const maxValue = Math.max(...values).toFixed(2);

    document.getElementById('minVal').innerHTML = minValue;
    document.getElementById('maxVal').innerHTML = maxValue;

    // --- Create the color scale ---
    const colorScale = d3.scaleSequential()
        // domain inverted: high values map to the dark end of viridis, low to light
        .domain([maxValue, minValue]) 
        .interpolator(d3.interpolateViridis);

    // --- Define style functions ---

    // Returns the choropleth style object for one geography feature.
    const styleFeature = (feature) => {
        const value = feature.properties.Value;

        return {
            fillColor: value != null ? colorScale(value) : '#ccc',  // gray if no data
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.8
        };
    };

    // Emphasizes the hovered geography with a thicker outline.
    const highlightFeature = (e) => {
        const layer = e.target;
        layer.setStyle({
            weight: 3,
            color: '#000',
            fillOpacity: 0.9
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            // bring to front so the highlighted border renders above neighboring polygons
            layer.bringToFront();
        }
    };

    // Restores a feature's default style after hover or chart interop clears it.
    const resetHighlight = (layer, e) => {
        layer.resetStyle(e.target);
    };

    // --- Create popup content ---

    // Builds the HTML popup shown when a geography is clicked.
    const createPopupContent = (properties) => {
        // Only render a popup when the feature has joined indicator metadata.
        if (properties.GeoRank) {
            return `
            <div class="popup-content">
            <strong>${properties.Geography}</strong>
            <hr class="my-1">
            <em>${indicator.IndicatorName}</em>: <strong>${properties.Value != null ? properties.Value.toFixed(2) : '—'}</strong> ${metadata[0].DisplayType.toLowerCase()} (${properties.TimePeriod || 'Unknown'})
            <span style="font-size:12px">${properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
            </div>
        `;
        } else {
            return;
        }
    };

    // Updates the legend readout so map hover matches the active geography.
    const updateHoverUI = (props) => {
        // Update legend text
        document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
        document.getElementById('hoveredValue').textContent = props.Value != null ? props.Value.toFixed(2) : '—';
        document.getElementById('hoveredUnits').textContent = metadata[0].DisplayType.toLowerCase();
        
        // Show legend tick
        document.getElementById('legend-tick').style.display = 'block';
        
        // Move the legend tick
        const percentage = calculatePercent(props.Value);
        document.querySelector('.viridis-tick').style.left = percentage + '%';
    };

    // Resets the legend readout back to its idle placeholder state.
    const clearHoverUI = () => {
        document.getElementById('hoveredGeo').textContent = 'Hover for details';
        document.getElementById('hoveredValue').textContent = '';
        document.getElementById('hoveredUnits').textContent = '';
        document.getElementById('legend-tick').style.display = 'none';
    };

    // Converts a raw map value into a legend tick percentage.
    const calculatePercent = (x) => {
        const range = maxValue - minValue;
        const placement = x - minValue;
        const calculation = 100 * placement / range;
        return calculation;
    };

    const mapRenderPromise = fetch(`${data_repo}${data_branch}/geography/${topoFile}`)
        .then(response => response.json())
        .then(topology => {
            
            // --- Convert TopoJSON to GeoJSON ---
            let geojson = topojson.feature(topology, topology.objects.collection);

            // --- Attach data to each feature ---
            // Merge the filtered indicator row onto each matching geography feature.
            geojson.features.forEach((feature, i) => {

                if (i == 0) {
                    // console.log("***** properties", feature.properties)
                }

                const geoID = feature.properties.GEOCODE;
                const matchedData = dataLookup[geoID];

                // Preserve original geometry props and append joined indicator attributes when found.
                if (matchedData) {
                    feature.properties = {
                        ...feature.properties,  // keep original properties (like GEOCODE, GEONAME, etc)
                        ...matchedData          // add all fields from matchedData
                    };
                } else {
                    // Missing rows stay on the map so the style function can show them as no-data areas.
                    feature.properties.dataValue = null;  // mark as missing data
                }
            });

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

    // Clear any existing bubbles from previous renders
    clearBubbles();

    // --- Create a lookup for data and attributes ---
    const dataLookup = {};

    // Index rows by GeoID so each feature lookup stays O(1) during attachment.
    data.forEach(item => {
        dataLookup[item.GeoID] = item;  // store the full record
    });

    // Ensure base map is ready (no-op if already initialized)
    initBaseMap();

    // Remove previous data layer if it exists
    if (currentGeojsonLayer) {
        currentMap.removeLayer(currentGeojsonLayer);
        currentGeojsonLayer = null;
    }

    let map = currentMap;

    // --- Find the min and max values in your dataset ---
    const values = data.map(d => d.Value).filter(v => v != null);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    document.getElementById('minVal').innerHTML = minValue.toFixed(2);
    document.getElementById('maxVal').innerHTML = maxValue.toFixed(2);

    // --- Create the inverted Viridis color scale ---
    const colorScale = d3.scaleSequential()
        .domain([maxValue, minValue])  // Inverted: max first, min second
        .interpolator(d3.interpolateViridis);

    // --- Create a radius scale ---
    const radiusScale = d3.scaleSqrt()
        .domain([minValue, maxValue])
        .range([4, 20]);  // bubbles between 4px and 20px radius

    // --- Define style for the polygons (light gray overlay) ---
    const styleFeature = (feature) => {
        return {
            fillColor: '#eee',
            weight: 1,
            color: '#999',
            fillOpacity: 0.3
        };
    };

    // --- Create popup content ---
    const createPopupContent = (properties) => {
        // Only render a popup when the feature has joined indicator metadata.
        if (properties.GeoRank || properties.Value != null) {
            return `
            <div class="popup-content">
            <strong>${properties.Geography}</strong>
            <hr class="my-1">
            <em>${indicator.IndicatorName}</em>: <strong>${properties.Value != null ? properties.Value.toFixed(2) : '—'}</strong> ${metadata[0].DisplayType.toLowerCase()} (${properties.TimePeriod || 'Unknown'})
            <span style="font-size:12px">${properties.Note && properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
            </div>
        `;
        } else {
            return;
        }
    };

    // Updates the legend readout so map hover matches the active geography.
    const updateHoverUI = (props) => {
        // Update legend text
        document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
        document.getElementById('hoveredValue').textContent = props.Value != null ? props.Value.toFixed(2) : '—';
        document.getElementById('hoveredUnits').textContent = metadata[0].DisplayType.toLowerCase();
        
        // Show legend tick
        document.getElementById('legend-tick').style.display = 'block';
        
        // Move the legend tick
        const percentage = calculatePercent(props.Value);
        document.querySelector('.viridis-tick').style.left = percentage + '%';
    };

    // Resets the legend readout back to its idle placeholder state.
    const clearHoverUI = () => {
        document.getElementById('hoveredGeo').textContent = 'Hover for details';
        document.getElementById('hoveredValue').textContent = '';
        document.getElementById('hoveredUnits').textContent = '';
        document.getElementById('legend-tick').style.display = 'none';
    };

    // Converts a raw map value into a legend tick percentage.
    const calculatePercent = (x) => {
        const range = maxValue - minValue;
        const placement = x - minValue;
        const calculation = 100 * placement / range;
        return calculation;
    };

    const mapRenderPromise = fetch(`${data_repo}${data_branch}/geography/${topoFile}`)
        .then(response => response.json())
        .then(topology => {
            
            // --- Convert TopoJSON to GeoJSON ---
            let geojson = topojson.feature(topology, topology.objects.collection);

            // --- Attach data to each feature ---
            geojson.features.forEach((feature, i) => {
                const geoID = feature.properties.GEOCODE;
                const matchedData = dataLookup[geoID];

                // Preserve original geometry props and append joined indicator attributes when found.
                if (matchedData) {
                    feature.properties = {
                        ...feature.properties,  // keep original properties
                        ...matchedData          // add all fields from matchedData
                    };
                } else {
                    // Missing rows stay on the map
                    feature.properties.dataValue = null;  // mark as missing data
                }
            });

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