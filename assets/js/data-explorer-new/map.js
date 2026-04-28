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

    const hasCI = data.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    // console.log('has CI?', hasCI)



    // --- Create a lookup for data and attributes ---
    const dataLookup = {};

    // Index rows by GeoID so each feature lookup stays O(1) during attachment.
    data.forEach(item => {
        dataLookup[item.GeoID] = item;  // store the full record
    });

    const hasCI = data.some(d => /\(.*\)/.test(d.CI));

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type
    // ----------------------------------------------------------------------- //

    topoFile = getGeoFile(mapGeoType);

    // Determine if the data are citywide only
    if (metadata[0].AvailableGeoTypes.length === 1 && metadata[0].AvailableGeoTypes[0] === 'Citywide') {
        console.log(">>> CITYWIDE ONLY - Rendering citywide map");
        
        // Render choro or bubble, as necessary

        // Pop up the map popup, with additional content explaining citywide data

        // Fire event to open the Trend chart
        
    }

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

    // ----------------------------------------------------------------------- //
    // data-derived values and display helpers
    // (defined before the fetch so they read top-to-bottom in usage order)
    // ----------------------------------------------------------------------- //

    const values = data.map(d => d.Value).filter(v => v != null);
    const minValue = Math.min(...values).toFixed(2);
    const maxValue = Math.max(...values).toFixed(2);

    document.getElementById('minVal').innerHTML = minValue
    document.getElementById('maxVal').innerHTML = maxValue

    const colorScale = d3.scaleSequential()
        // domain inverted: high values map to the dark end of viridis, low to light
        .domain([maxValue, minValue]) 
        .interpolator(d3.interpolateViridis);


    // Returns the choropleth style object for one geography feature.
    const styleFeature = (feature) => {

        const value = feature.properties.Value;

        return {
            fillColor: value != null ? colorScale(value) : '#ccc',  // gray if no data
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.8
        };

    }


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

    }

    // Restores a feature's default style after hover or chart interop clears it.
    const resetHighlight = (layer, e) => {

        layer.resetStyle(e.target);

    }


    // Builds the HTML popup shown when a geography is clicked.
    const createPopupContent = (properties) => {

        // Only render a popup when the feature has joined indicator metadata.
        if (properties.GeoRank) {
            
            return `
            <div class="popup-content">
            <strong>${properties.Geography}</strong>
            <hr class="my-1">
            <em>${indicator.IndicatorName}</em>: <strong>${properties.Value != null ? properties.Value.toFixed(2) : '\u2014'}</strong> ${metadata[0].DisplayType.toLowerCase()} (${properties.TimePeriod || 'Unknown'})
            <span style="font-size:12px">${properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
            </div>
        `;

        } else {
            return;
        }
    }


    // Converts a raw map value into a legend tick percentage.
    const calculatePercent = (x) => {

        const range = maxValue - minValue;
        const placement = x - minValue;
        const calculation = 100 * placement / range;

        return calculation;
    }


    // Updates the legend readout so map hover matches the active geography.
    const updateHoverUI = (props) => {

        document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
        document.getElementById('hoveredValue').textContent = props.Value != null ? props.Value.toFixed(2) : '\u2014';
        document.getElementById('hoveredUnits').textContent = metadata[0].DisplayType.toLowerCase();

        const legendTick = document.getElementById('legend-tick');

        // Missing values still get the text readout, but they should not draw a tick on the legend.
        if (props.Value == null) {
            legendTick.style.display = 'none';
            return;
        }

        legendTick.style.display = 'block';

        const percentage = calculatePercent(props.Value);
        document.querySelector('.viridis-tick').style.left = percentage + '%';

    }

    // Resets the legend readout back to its idle placeholder state.
    const clearHoverUI = () => {
        
        document.getElementById('hoveredGeo').textContent = 'Hover for details';
        document.getElementById('hoveredValue').textContent = '';
        document.getElementById('hoveredUnits').textContent = '';
        document.getElementById('legend-tick').style.display = 'none';

    }


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

                        // 🔥 HARD RESET: clear ALL highlights
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