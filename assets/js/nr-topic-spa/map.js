// ======================================================================= //
// map.js
// ======================================================================= //

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

// Resolves a UHF geocode to the display name report rows use
const geocodeToName = geocode => {

    if (typeof neighborhoods === 'undefined') return null;

    const match = neighborhoods.find(n => n.UHF_id == geocode);
    if (!match) return null;

    return match.UHF_name;

};


// Finds the rendered Leaflet layer carrying a given UHF geocode
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


// Converts a display name to its Leaflet layer, by way of the UHF id
const findLayerByName = name => {

    const uhfId = getUhfIdForDisplayName(name);

    return uhfId == null ? null : findLayerByGeocode(uhfId);

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


// Attaches the tooltip and pointer handlers to one UHF polygon
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

    debugLog('initLeafletMap: enter:', spaConfig.geojsonUrl);

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
    fetch(spaConfig.geojsonUrl)
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
