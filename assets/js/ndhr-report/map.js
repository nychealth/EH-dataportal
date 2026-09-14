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


// Applies the selected style to a layer. Styling ONLY — no fly-to, which this function
// used to do for both its callers and which made most of the city unclickable.
//
// This map is the page's sole district selector (see the header comment in global.js), so
// every polygon has to stay reachable by pointer. Zoomed to one district the other 58 sit
// outside a 324x450 viewport: as the page left it, an un-forced click could reach 9 of 59
// polygons at zoom 13, against 55 of 59 with the same map fitted to all of them at zoom 9.
// A click event dispatched directly on the same node navigated correctly in both arms, so
// the handler was never the problem — the pointer could not reach the polygon
// `[verified 2026-09-13: two arms on one page, run A -> B -> A so ordering cannot explain it]`.
//
// ndhr-leaflet.html reached the same conclusion for the picker map on 2026-09-12 and carries
// the longer version of this reasoning. nr-leaflet.html still flies, and can afford to: its
// polygons answer no key and its neighborhood index offers the navigation elsewhere
const selectLayer = layer => {

    // Clear previous selection style first
    if (cdLayer) cdLayer.resetStyle();

    layer.setStyle(highlightStyle);
    layer.bringToFront();

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

    selectLayer(layer);

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
        .then(res => {

            // Check the response before parsing. res.json() on a 404 body throws a
            // SyntaxError naming a stray '<', which says nothing about which URL failed —
            // and a renamed EHDP-data file is precisely what `npm run smoke:env` exists to
            // catch, so the diagnostic is the point. Same shape normalize.js throws for
            // the same class of fetch
            if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + reportConfig.geojsonUrl);

            return res.json();

        })
        .then(data => {

            debugLog('initLeafletMap: branch-geojson-loaded:', { featureCount: data && data.features && data.features.length });

            cdLayer = L.geoJSON(data, {
                style: styleFeature,
                onEachFeature,
                filter: feature => feature.properties.GEOCODE != 0
            }).addTo(leafletMap);

            // addTo is synchronous, so every polygon has its <path> by here
            nameMapPolygons();

            // Fit the whole city rather than keeping the fixed zoom-10 view above, which is
            // centered on lower Manhattan and cuts off the outer boroughs in this column's
            // width. With the fly-to gone this is the framing every district is selected
            // from, so it has to hold all 59.
            //
            // zoomSnap has to be 0: the default of 1 makes fitBounds round DOWN to a whole
            // zoom level, which on the NR picker left the city spanning 59% of its box
            // `[measured 2026-08-09]`. Same padding as ndhr-leaflet.html, for the same reason
            leafletMap.options.zoomSnap = 0;
            leafletMap.fitBounds(cdLayer.getBounds(), { padding: [10, 10] });

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
