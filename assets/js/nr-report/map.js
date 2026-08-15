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


// The one name a polygon answers to, in the tooltip and in the accessibility tree alike.
//
// Same resolution selectNeighborhood uses to pick what the report renders, so the string a
// reader sees on hover, the string a screen reader announces, and the string that lands in
// the <h1> after activating it are one string. They were not: GEONAME disagrees with
// uhflist's UHF_name on 6 of the 42 — "Fordham - Bronx Park" against "Fordham - Bronx Pk",
// "Rockaway" against "Rockaways" [verified 2026-08-11: diff of static/geojson/UHF42.geojson
// against data/globals/uhflist.json by GEOCODE]. GEONAME stays the fallback for a geocode
// uhflist does not carry
const featureDisplayName = feature =>
    geocodeToName(feature.properties.GEOCODE) || feature.properties.GEONAME;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// event handlers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Switches the report to one polygon's neighborhood. Shared by the pointer and keyboard
// paths so the two cannot diverge — the map is the report's only in-place switcher, and a
// keyboard route that did something subtly different from the mouse one would be its own defect
const selectNeighborhood = (layer, source) => {

    const geocode = layer.feature.properties.GEOCODE;
    const name = featureDisplayName(layer.feature);

    selectLayer(layer, true);

    // Ignore selection-driven render until all report and viz payloads have loaded
    if (dataReady) {
        debugLog(source + ': branch-render-all:', { name, geocode });
        renderAll(name, geocode);
    } else {
        debugLog(source + ': branch-data-not-ready:', { name, geocode });
    }

};


// Map click drives neighborhood selection for the full report UI
const onMapClick = e => selectNeighborhood(e.target, 'onMapClick');


// Enter and Space on a focused polygon do what a click does.
//
// The 42 polygons were already in the tab order and already receiving these key events —
// Leaflet's map container listens for keydown and routes it to the layer under e.target
// (leaflet-src.js:4435, 4466-4491, 4556-4565), skipping only the coordinate computation it
// does for mouse events. Nothing was listening, so 42 tab stops did nothing. This is the
// listener, not new plumbing. Leaflet binds neither key itself, so there is no contention
const onMapKeyDown = e => {

    const key = e.originalEvent && e.originalEvent.key;

    if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;

    // Space would otherwise scroll the page out from under the report being rebuilt
    e.originalEvent.preventDefault();

    selectNeighborhood(e.target, 'onMapKeyDown');

};


// Leaflet points aria-describedby at the tooltip it just opened
// (leaflet-src.js:10998-11002) and never takes it back, so after a hover sweep all 42
// polygons reference tooltip nodes that no longer exist. tooltipclose fires on the source
// layer (:10710-10712), which is the hook the library does not use itself
const onTooltipClose = e => {

    const el = typeof e.target.getElement === 'function' && e.target.getElement();

    if (el) el.removeAttribute('aria-describedby');

};


// Attaches the tooltip and interaction handlers to one UHF polygon
const onEachFeature = (feature, layer) => {

    // Same string the aria-label carries, so the visible label is contained in the
    // accessible name (WCAG 2.5.3) rather than differing from it on 6 of the 42
    layer.bindTooltip(featureDisplayName(feature), {
        permanent: false,
        opacity: 0.9,
        className: 'fs-md'
    });

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: onMapClick,
        keydown: onMapKeyDown,
        tooltipclose: onTooltipClose
    });

};


// Names the polygons for the accessibility tree, once they have DOM nodes to carry it.
//
// Not in onEachFeature: that runs while L.geoJSON builds the group, before the renderer has
// created each layer's <path>, so getElement() is null there. role="button" rather than the
// graphics-symbol a bare <path> computes to, because after onMapKeyDown these are activatable
// controls and that is what tells a keyboard user Enter will do something
const nameMapPolygons = () => {

    if (!uhfLayer) return;

    let named = 0;

    uhfLayer.eachLayer(layer => {

        const el = typeof layer.getElement === 'function' && layer.getElement();
        const name = featureDisplayName(layer.feature);

        if (!el || !name) return;

        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', name);
        named++;

    });

    debugLog('nameMapPolygons: named:', named);

};


// Sets up the Leaflet map and loads UHF polygon geometry onto it
const initLeafletMap = () => {

    debugLog('initLeafletMap: enter:', reportConfig.geojsonUrl);

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
    fetch(reportConfig.geojsonUrl)
        .then(res => res.json())
        .then(data => {

            debugLog('initLeafletMap: branch-geojson-loaded:', { featureCount: data && data.features && data.features.length });

            uhfLayer = L.geoJSON(data, {
                style: styleFeature,
                onEachFeature,
                filter: feature => feature.properties.GEOCODE != 0
            }).addTo(leafletMap);

            // addTo is synchronous, so every polygon has its <path> by here
            nameMapPolygons();

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
