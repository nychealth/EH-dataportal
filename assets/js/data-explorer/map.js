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
// bar-chart interop contract
// ----------------------------------------------------------------------- //

// bar.js drives map highlighting through this object; the reverse direction goes through
// window.myVegaView. It is created once, here, and always exists — callers gate on `ready`,
// never on the object itself, and never on which map type is behind it. Both renderers
// attach the same two functions, so the bar chart holds no choropleth-vs-bubble knowledge.

const NO_MAP_INTEROP = {
    ready: false,
    highlight: () => {},    // highlight the geography for this GeoID + fill the legend hover panel
    reset: () => {}         // clear the tracked highlight + reset the legend hover panel
};

window.mapInterop = { ...NO_MAP_INTEROP };

// Publishes a renderer's implementations, once its geometry is on the map.
const attachMapInterop = ({ highlight, reset }) => {
    Object.assign(window.mapInterop, { ready: true, highlight, reset });
};

// The reverse direction: pushes a geography into the bar chart's linked-highlight signal, or
// null to clear it. No-op until the bar chart has published its Vega view, which is why every
// map handler can call it unconditionally.
const setBarSelection = (geoID) => {
    if (!window.myVegaView) return;

    window.myVegaView.signal("selectedGeo", geoID).run();
};

// Points the contract back at the no-ops. Called synchronously at the start of every render so
// that a bar hover during the geometry fetch can't reach the outgoing map's discarded layers —
// that used to silently no-op the highlight while still writing the previous geography's name
// and value into the legend panel.
const detachMapInterop = () => {
    Object.assign(window.mapInterop, NO_MAP_INTEROP);
};

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

    debugLog("* initBaseMap: tile layer ready");

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

// Builds a plain object mapping each row's GeoID to the row itself, for O(1) lookup when joining data onto GeoJSON features.
const createDataLookup = (data) => {
    const dataLookup = {};
    data.forEach(item => {
        dataLookup[item.GeoID] = item;
    });
    return dataLookup;
};

// Reuses the base map instance while clearing old geometry overlays between renders.
const resetMapForRender = () => {
    detachMapInterop();

    // The outgoing render's hover text describes geography that is about to disappear, and with
    // the interop detached no mouseout can clear it — so clear it here, at the render boundary.
    clearHoverUI();

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
    const minFormatted = minValue.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }) + displayType;
    const maxFormatted = maxValue.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }) + displayType;

    document.getElementById('minVal').innerHTML = minFormatted;
    document.getElementById('maxVal').innerHTML = maxFormatted;

    // Screen readers can't infer a data range from a color gradient; describe it in words instead.
    document.getElementById('viridisRect').setAttribute('aria-label', `Legend: ${minFormatted} (low) to ${maxFormatted} (high)`);
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
                        ${DE.indicator.indicator.IndicatorName}
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
                        ${DE.indicator.indicator.IndicatorName}
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

// Resets the legend hover panel to its idle, no-selection state. Module-level rather than
// per-render because it depends on nothing a render supplies, and resetMapForRender() needs
// it before the incoming render's helpers exist.
const clearHoverUI = () => {
    document.getElementById('hoveredGeo').textContent = 'Hover for details';
    document.getElementById('hoveredValue').textContent = '';
    document.getElementById('hoveredUnits').textContent = '';
    document.getElementById('legend-tick').style.display = 'none';
};

// Coordinates legend hover text and tick placement with hovered map features.
const createHoverUIHelpers = (metadata, minValue, maxValue, digits) => {
    // Converts a value into a 0-100 percent position along the legend's color range.
    const calculatePercent = (x) => {
        const range = maxValue - minValue;
        if (range === 0 || x == null) {
            return 0;
        }
        return 100 * (x - minValue) / range;
    };

    // Updates the legend hover panel and tick position to reflect the hovered feature.
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

    return {
        updateHoverUI,
        calculatePercent
    };
};

// Copies filtered indicator rows onto matching geometry features before rendering.
// Both branches build a new properties object rather than writing into the existing one:
// topojson.feature() hands back the *cached* topology's own properties objects (by
// reference), so an in-place write would leak this render's data into every later render
// of the same geotype. See loadMapGeojson below.
const attachDataToGeojsonFeatures = (geojson, dataLookup) => {
    geojson.features.forEach((feature) => {
        const geoID = feature.properties.GEOCODE;
        const matchedData = dataLookup[geoID];

        feature.properties = matchedData
            ? { ...feature.properties, ...matchedData }
            : { ...feature.properties, dataValue: null };
    });
    return geojson;
};

// Fetches the geotype's TopoJSON, converts it to GeoJSON, and joins the filtered rows onto its features.
// The fetch + JSON parse is cached per geotype for the session — the geometry never changes, while
// this ran on every measure, time-period, and geography change. topojson.feature() still runs per
// render, rebuilding the GeoJSON wrapper so each render gets its own features to attach data to.
const loadMapGeojson = (topoFile, dataLookup) => {
    return loadOnce(topoFile, () =>
        fetch(`${data_repo}${data_branch}/geography/${topoFile}`).then(response => response.json())
    )
        .then(topology => {
            const geojson = topojson.feature(topology, topology.objects.collection);
            return attachDataToGeojsonFeatures(geojson, dataLookup);
        });
};

// ----------------------------------------------------------------------- //
// citywide-only handling
// ----------------------------------------------------------------------- //

// Roughly lower Manhattan — anchors the citywide popup over the middle of the city.
const CITYWIDE_POPUP_LATLNG = [40.711409, -74.016813];

// Sends the user to the trend tab, consuming the one-shot per-indicator-load flag.
// A citywide-only indicator has nothing to show per neighborhood, so the map nudges the
// user to the trend view — but only once per indicator load. Otherwise every measure/geo/
// time re-render, and every re-click on the popup, would keep overriding whatever tab the
// user actually picked. See citywideTrendDefaultPending in global.js.
const switchToTrendTabOnce = () => {

    if (!DE.map.citywideTrendDefaultPending) return;

    DE.map.citywideTrendDefaultPending = false;

    const element = document.getElementById('v-pills-trends-tab');

    if (element) {
        element.click();
    } else {
        console.warn("Trend tab element not found for citywide map click-through.");
    }

};

// Opens the citywide popup at the city center and nudges the user to the trend tab.
const handleCitywideOnly = (map, data, metadata) => {

    L.popup()
        .setLatLng(CITYWIDE_POPUP_LATLNG)
        .setContent(createCitywidePopupContent(data[0], metadata))
        .openOn(map);

    switchToTrendTabOnce();

};

// Fire immediately

initBaseMap();

// Derives shared time/geo/measurement metadata from the filtered data, then dispatches to renderBubbleMap or renderChoroplethMap.
const renderMap = (
    data, 
    metadata
) => {

    debugLog("** renderMap");
    debugLog("** renderMap: metadata", metadata);

    // ----- get unique time in data ----- //

    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // ----- set metadata ----- //

    let mapGeoType = data[0]?.GeoType;
    let mapMeasurementType = metadata[0]?.MeasurementType;
    let mapTime = mapTimes[0];
    let topoFile = '';

    // ----- set geo file based on geo type ----- //

    topoFile = getGeoFile(mapGeoType);

    // ----- check if the data are citywide only ----- //

    const isCitywideOnly = metadata[0].AvailableGeoTypes.length === 1 &&
                           metadata[0].AvailableGeoTypes[0] === 'Citywide';

    if (isCitywideOnly) {
        debugLog("** renderMap: citywide only");
    }

    // ----- determine map type based on measurement type ----- //

    const isNumberMap = mapMeasurementType.includes('number') ||
                        mapMeasurementType.includes('Number') ||
                        mapMeasurementType.includes('Total');

    if (isNumberMap) {

        debugLog("** renderMap: number map, rendering bubble map");
        return renderBubbleMap(data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly);

    } else {

        debugLog("** renderMap: choropleth map, rendering choropleth");

        // - - - choropleth map rendering - - - //

        return renderChoroplethMap(data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly);
    }

};

// ----------------------------------------------------------------------- //
// Choropleth map rendering function
// ----------------------------------------------------------------------- //

// Renders the choropleth map variant, joining data to GeoJSON polygons and wiring popup, hover, and click interactions linked to the bar chart.
const renderChoroplethMap = (data, metadata, mapGeoType, mapTime, topoFile, isCitywideOnly = false) => {

    // Percent measures show percent-formatted legends; everything else stays unitless here.
    ({ isPercent, displayUnit: displayType } = resolveMeasureDisplay(metadata[0].MeasurementType));

    const dataLookup = createDataLookup(data);
    const map = resetMapForRender();
    const { minValue, maxValue } = getMapStats(data);

    setMapLegendValues(minValue, maxValue, 1);

    const colorScale = createColorScale(minValue, maxValue);

    // Colors each polygon by its value using the shared color scale, falling back to gray when data is missing.
    const styleFeature = (feature) => {
        const value = feature.properties.Value;
        return {
            fillColor: value != null ? colorScale(value) : '#ccc',
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.65
        };
    };

    // Assigned once the GeoJSON layer is built inside the fetch chain below. The hover helpers
    // are defined before that resolves, so they close over this binding and read it at hover time.
    let geojsonLayer = null;

    // Only one polygon is ever highlighted at a time, so tracking it lets a hover reset restyle
    // that single layer instead of sweeping every layer in the collection (~195 on NTA) on each
    // mousemove. Bar-chart hovers highlight through these same helpers via window.mapInterop,
    // so a highlight from either source lands in this tracker and gets cleared correctly.
    let highlightedLayer = null;

    // Applies the hover-highlight outline, clearing any previous highlight, and brings the feature to the front of the layer stack.
    const highlightFeature = (e) => {
        const layer = e.target;

        if (highlightedLayer && highlightedLayer !== layer) {
            geojsonLayer.resetStyle(highlightedLayer);
        }

        layer.setStyle({
            weight: 3,
            color: '#000',
            fillOpacity: 0.9
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        highlightedLayer = layer;
    };

    // Restores a layer's base style. Falls back to the tracked layer so callers that don't hold a
    // reference (or pass a stale one) still clear the highlight that is actually on screen.
    const resetHighlight = (layer) => {
        const target = layer ?? highlightedLayer;

        if (!target || !geojsonLayer) return;

        geojsonLayer.resetStyle(target);

        if (target === highlightedLayer) {
            highlightedLayer = null;
        }
    };

    // Builds popup markup for a feature, substituting the citywide popup when the data is citywide-only.
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

    const { updateHoverUI } = createHoverUIHelpers(metadata, minValue, maxValue, 1);

    const mapRenderPromise = loadMapGeojson(topoFile, dataLookup)
        .then(geojson => {

            // - - - lookup to match GeoID → Leaflet layer - - - //

            const geoIDtoLayer = {};

            // ----- Add the GeoJSON to the map ----- //

            geojsonLayer = L.geoJson(geojson, {

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
                    
                    // - - - bind popup content - - - //

                    layer.bindPopup(createPopupContent(feature.properties));
                    
                    layer.on('click', (e) => {
                        const props = feature.properties;
                        debugLog("** click", feature.properties);

                        if (isCitywideOnly) {
                            switchToTrendTabOnce();
                        }

                        const linkedGeoID = props.GeoID ?? props.GEOCODE;

                        if (linkedGeoID != null) {
                            setBarSelection(linkedGeoID);
                        }
                    });

                    layer.on('mouseover', (e) => {
                        const props = feature.properties;
                        const linkedGeoID = props.GeoID ?? props.GEOCODE;
                        const hasMappedValue = props.Value != null;

                        // highlightFeature clears the previously highlighted polygon itself.
                        highlightFeature(e);

                        updateHoverUI(props);

                        // Do not push no-data geographies into the linked bar highlight.
                        setBarSelection(hasMappedValue && linkedGeoID != null ? linkedGeoID : null);
                    });
                    
                    layer.on('mouseout', (e) => {
                        resetHighlight(e.target);
                        clearHoverUI();

                        setBarSelection(null);
                    });
                    
                }
            }).addTo(map);

            currentGeojsonLayer = geojsonLayer;

            if (isCitywideOnly) {
                handleCitywideOnly(map, data, metadata);
            }

            // ----- publish the hover contract for bar.js ----- //

            attachMapInterop({

                highlight: (geoID) => {
                    // The lookup registers both GeoID and GEOCODE, raw and stringified, so a
                    // single fallback covers the number-vs-string mismatch between the two sources.
                    const layer = geoIDtoLayer[geoID] ?? geoIDtoLayer[String(geoID)];

                    if (!layer) return;

                    highlightFeature({ target: layer });
                    updateHoverUI(layer.feature.properties);
                },

                reset: () => {
                    // No argument: resetHighlight falls back to whichever layer is tracked, so a
                    // highlight from either source (map hover or bar chart) clears correctly.
                    resetHighlight();
                    clearHoverUI();
                }

            });

        })
        .catch(error => {
            console.log(error);
        });

    // send info for printing
    DE.print.vizYear = mapTime;
    DE.print.vizGeography = mapGeoType;
    DE.map.selectedMapMetadata = metadata[0] || null;
    DE.print.vizSource = metadata[0]?.Sources;
    DE.print.chartType = 'map';

    return mapRenderPromise;
};

// ----------------------------------------------------------------------- //
// Bubble map rendering function
// ----------------------------------------------------------------------- //

// Renders the number/total map variant, joining data to circle markers sized and colored by value, with popup, hover, and click interactions mirroring the choropleth map.
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

    // Styles the base polygons as light gray fill so the circle-marker bubbles remain the visual focus.
    const styleFeature = () => ({
        fillColor: '#eee',
        weight: 1,
        color: '#999',
        fillOpacity: 0.3
    });

    // Builds popup markup for a bubble or polygon, substituting the citywide popup when the data is citywide-only.
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

    const { updateHoverUI } = createHoverUIHelpers(metadata, minValue, maxValue, 0);

    const mapRenderPromise = loadMapGeojson(topoFile, dataLookup)
        .then(geojson => {

            // - - - bubble lookup for chart interop - - - //

            // Bubble-map highlighting works on the circle markers, not the gray base polygons,
            // so this map needs no GeoID → polygon-layer lookup of its own.
            const circleMarkers = [];

            // Only one bubble is highlighted at a time. Tracking it here — rather than in each
            // handler — means a map hover and a bar-chart hover clear each other correctly,
            // the same way highlightedLayer works for the choropleth.
            let highlightedMarker = null;

            // Applies the hover-highlight style to a marker entry, clearing any previous one.
            const highlightMarker = (markerEntry) => {
                if (!markerEntry || markerEntry === highlightedMarker) return;

                if (highlightedMarker) {
                    highlightedMarker.marker.setStyle(highlightedMarker.originalStyle);
                }

                markerEntry.marker.setStyle({
                    weight: 3,
                    color: '#000',
                    fillOpacity: 1
                });

                highlightedMarker = markerEntry;
            };

            // Restores whichever marker is currently highlighted, whoever highlighted it.
            const resetMarkerHighlight = () => {
                if (!highlightedMarker) return;

                highlightedMarker.marker.setStyle(highlightedMarker.originalStyle);
                highlightedMarker = null;
            };

            // ----- Add the GeoJSON overlay (light gray polygons) ----- //

            const geojsonLayer = L.geoJson(geojson, {
                style: styleFeature,
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(createPopupContent(feature.properties));

                    if (isCitywideOnly) {
                        layer.on('click', switchToTrendTabOnce);
                    }
                }
            }).addTo(map);

            currentGeojsonLayer = geojsonLayer;

            // ----- Add bubbles on top ----- //

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

                    // Store reference for chart interop. `row` is kept so a bar-driven highlight
                    // can fill the legend panel from the same source the map's own hover uses.
                    const markerEntry = {
                        geoID: item.GeoID,
                        marker: circle,
                        row: item,
                        originalStyle: {
                            radius: radiusScale(item.Value),
                            fillColor: colorScale(item.Value),
                            color: '#333',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.9
                        }
                    };

                    circleMarkers.push(markerEntry);

                    // - - - Add hover and click interactions to bubbles - - - //

                    circle.on('click', (e) => {
                        debugLog("** click", item);

                        if (isCitywideOnly) {
                            switchToTrendTabOnce();
                        }

                        setBarSelection(item.GeoID);
                    });

                    circle.on('mouseover', (e) => {
                        highlightMarker(markerEntry);

                        updateHoverUI(item);

                        setBarSelection(item.GeoID);
                    });

                    circle.on('mouseout', (e) => {
                        resetMarkerHighlight();

                        clearHoverUI();

                        setBarSelection(null);
                    });
                }
            });

            if (isCitywideOnly) {
                handleCitywideOnly(map, data, metadata);
            }

            // ----- publish the hover contract for bar.js ----- //

            attachMapInterop({

                highlight: (geoID) => {
                    const markerEntry = circleMarkers.find(c => c.geoID === geoID);

                    if (!markerEntry) return;

                    highlightMarker(markerEntry);
                    updateHoverUI(markerEntry.row);
                },

                reset: () => {
                    resetMarkerHighlight();
                    clearHoverUI();
                }

            });

        })
        .catch(error => {
            console.log(error);
        });

    // send info for printing
    DE.print.vizYear = mapTime;
    DE.print.vizGeography = mapGeoType;
    DE.map.selectedMapMetadata = metadata[0] || null;
    DE.print.vizSource = metadata[0]?.Sources;
    DE.print.chartType = 'bubble-map';

    return mapRenderPromise;
};