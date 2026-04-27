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

// Fire immediately

initBaseMap();

// Joins filtered data onto geography features and renders the choropleth layer.
const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");

    // document.getElementById('viewDescription').innerHTML = 'Hover over the map or chart for more information.'

    // console.log("data [renderMap]", data);
    // console.log("metadata [renderMap]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // console.log("mapTimes [map.js]", mapTimes);

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let mapGeoType            = data[0]?.GeoType;
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


    topoFile = getGeoFile(mapGeoType)

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    // Ensure base map is ready (no-op if already initialized)

    initBaseMap();

    // Remove previous data layer if it exists

    // Remove the previous thematic layer before drawing the next one.
    if (currentGeojsonLayer) {

        currentMap.removeLayer(currentGeojsonLayer);
        currentGeojsonLayer = null;

    }

    let map = currentMap;


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
        
        document.getElementById('legend-tick').style.display = 'block';
        
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

            // console.log("geojson [renderMap fetch]", geojson);

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

            // console.log("geojson [renderMap]", geojson);

            const geojsonLayer = L.geoJson(geojson, {

                style: styleFeature,
                onEachFeature: (feature, layer) => {

                    // console.log(">>> feature", feature.properties);
                    // console.log(">>> layer", layer);
                    
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

                    let currentlyHighlighted = null
                    
                    layer.on('mouseover', (e) => {

                        const props = feature.properties;
                        const linkedGeoID = props.GeoID ?? props.GEOCODE;

                        // 🔥 HARD RESET: clear ALL highlights
                        // Clear any previous highlight before applying the current hover state.
                        geojsonLayer.eachLayer((l) => {
                            geojsonLayer.resetStyle(l);
                        });

                        // Apply highlight to current
                        highlightFeature(e);

                        updateHoverUI(props);

                        if (window.myVegaView && linkedGeoID !== undefined && linkedGeoID !== null) {
                            window.myVegaView.signal("selectedGeo", linkedGeoID).run();
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
    // vizSource = metadata[0].Sources
    // printSpec = mapspec;
    chartType = 'map'

    return mapRenderPromise;

}