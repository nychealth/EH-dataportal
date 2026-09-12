// ======================================================================= //
// map.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// Leaflet selector map
// ----------------------------------------------------------------------- //

// This file and themes/dohmh/layouts/partials/nr-leaflet.html declare four of the same
// top-level names — highlightFeature, onEachFeature, resetHighlight and selectDistrict's
// NR counterpart. Two `const`s of one name in a single classic-script scope is a
// SyntaxError that kills every script on the page, and `no-undef` cannot see it, so
// nr-leaflet must never load on an NDHR report page.

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


// Base style for all district polygons before hover/selection overrides
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

    // Preserve selected style for the active district while mousing out
    if (currentGeoIds && geocode == currentGeoIds.CD) return;

    layer.setStyle({ weight: 1.5, color: 'black', dashArray: '1' });

};


// Applies the selected style to a layer, optionally flying the map to it
const selectLayer = (layer, zoom) => {

    // Clear previous selection style first
    if (cdLayer) cdLayer.resetStyle();

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

// Resolves a CD geocode to the display name the report rows use
const geocodeToName = geocode => {

    const row = districtRowById(geocode);

    return row ? row.CD_name : null;

};


// Finds the rendered Leaflet layer carrying a given CD geocode
const findLayerByGeocode = geocode => {

    if (!cdLayer) return null;

    let match = null;

    cdLayer.eachLayer(layer => {
        if (layer.feature.properties.GEOCODE == geocode) {
            match = layer;
        }
    });

    return match;

};


// Converts a display name to its Leaflet layer, by way of the CD id
const findLayerByName = name => {

    const cdId = getDistrictIdForDisplayName(name);

    return cdId == null ? null : findLayerByGeocode(cdId);

};


// The one name a polygon answers to, in the tooltip and in the accessibility tree alike.
//
// CD.geojson's GEONAME matches cdlist.json's CD_name on all 59 districts, so unlike the NR
// original this resolution cannot disagree with itself `[verified 2026-09-11 against the
// production branch; UHF42.geojson's GEONAME disagrees with uhflist's UHF_name on 6 of 42,
// which is what the NR version of this function exists to reconcile]`. It still reads
// through cdlist rather than the geojson, so that a future divergence resolves the same way
// NR's does instead of silently going the other way. GEONAME stays the fallback
const featureDisplayName = feature =>
    geocodeToName(feature.properties.GEOCODE) || feature.properties.GEONAME;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// event handlers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Switches the report to one polygon's district. Shared by the pointer and keyboard paths
// so the two cannot diverge — the map is the report's only in-place switcher, and a
// keyboard route that did something subtly different from the mouse one would be its own defect
const selectDistrict = (layer, source) => {

    const geocode = layer.feature.properties.GEOCODE;
    const name = featureDisplayName(layer.feature);

    selectLayer(layer, true);

    // Ignore selection-driven render until the first row build has landed
    if (dataReady) {
        debugLog(source + ': branch-render-all:', { name, geocode });
        renderAll(name);
    } else {
        debugLog(source + ': branch-data-not-ready:', { name, geocode });
    }

};


// Map click drives district selection for the full report UI
const onMapClick = e => selectDistrict(e.target, 'onMapClick');


// Enter and Space on a focused polygon do what a click does.
//
// The polygons are already in the tab order and already receiving these key events —
// Leaflet's map container listens for keydown and routes it to the layer under e.target,
// skipping only the coordinate computation it does for mouse events. Without this listener
// they would be tab stops that do nothing. Leaflet binds neither key itself, so there is
// no contention
const onMapKeyDown = e => {

    const key = e.originalEvent && e.originalEvent.key;

    if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;

    // Space would otherwise scroll the page out from under the report being rebuilt
    e.originalEvent.preventDefault();

    selectDistrict(e.target, 'onMapKeyDown');

};


// Leaflet points aria-describedby at the tooltip it just opened and never takes it back,
// so after a hover sweep every polygon references tooltip nodes that no longer exist.
// tooltipclose fires on the source layer, which is the hook the library does not use itself
const onTooltipClose = e => {

    const el = typeof e.target.getElement === 'function' && e.target.getElement();

    if (el) el.removeAttribute('aria-describedby');

};


// Attaches the tooltip and interaction handlers to one district polygon
const onEachFeature = (feature, layer) => {

    // Same string the aria-label carries, so the visible label is contained in the
    // accessible name (WCAG 2.5.3)
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
// graphics-symbol a bare <path> computes to, because after onMapKeyDown these are
// activatable controls and that is what tells a keyboard user Enter will do something
const nameMapPolygons = () => {

    if (!cdLayer) return;

    let named = 0;

    cdLayer.eachLayer(layer => {

        const el = typeof layer.getElement === 'function' && layer.getElement();
        const name = featureDisplayName(layer.feature);

        if (!el || !name) return;

        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', name);
        named++;

    });

    debugLog('nameMapPolygons: named:', named);

};


// Sets up the Leaflet map and loads community district geometry onto it
const initLeafletMap = () => {

    debugLog('initLeafletMap: enter:', reportConfig.geojsonUrl);

    // Initialize Leaflet with a neutral NYC-centered default view
    leafletMap = L.map('ndhr-map', { zoomControl: false }).setView([40.7128, -74.006], 10);

    // Use CARTO basemap tiles to match existing portal styling
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
            maxZoom: 15,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    ).addTo(leafletMap);

    L.control.scale({ metric: false, position: 'bottomleft' }).addTo(leafletMap);

    // The geometry comes from EHDP-data at the environment's own data_branch, not from a
    // copy in static/geojson/ where NR keeps UHF42.geojson — the data repository generates
    // and owns that file, and fetching it at data_branch makes the map move with the data
    // the page already fetches at data_branch
    fetch(reportConfig.geojsonUrl)
        .then(res => res.json())
        .then(data => {

            debugLog('initLeafletMap: branch-geojson-loaded:', { featureCount: data && data.features && data.features.length });

            cdLayer = L.geoJSON(data, {
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

            console.error('Error loading CD GeoJSON:', err);
            debugLog('initLeafletMap: branch-geojson-load-failed:', err);
            mapReady = true;
            tryInitialRender();

        });

};
