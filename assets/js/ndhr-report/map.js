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


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// facility points
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Facility type → legend label and point color, in the colors the reviewers asked for
// (2026-10-20). Array order is legend order. `type` is the source CSV's own spelling,
// which scripts/ndhr-build-facilities.mjs holds to these five
const FACILITY_TYPES = [
    { type: 'Hospital', label: 'Hospital', color: '#00838f' },
    { type: 'Residential Health Care Facility - SNF', label: 'Skilled nursing facility', color: '#2e7d32' },
    { type: 'Adult Home', label: 'Adult home', color: '#1f5fbf' },
    { type: 'Enriched Housing Program', label: 'Enriched housing program', color: '#f29d0b' },
    { type: 'Hospice', label: 'Hospice', color: '#8e1b2e' }
];


// Looks up one facility type's entry, falling back to grey for a type the table lacks
const facilityTypeFor = type =>
    FACILITY_TYPES.find(t => t.type === type) || { type, label: type, color: '#666666' };


// Builds a facility's popup from DOM nodes rather than an HTML string, so a name like
// "Lincoln Medical & Mental Health Center" needs no escaping
const buildFacilityPopup = props => {

    const wrap = document.createElement('div');
    wrap.className = 'fs-sm';

    const lines = [
        [props.name, 'font-weight-bold'],
        [facilityTypeFor(props.type).label, ''],
        [Number(props.beds).toLocaleString() + ' beds', ''],
        [props.address + (props.zip ? ', ' + props.zip : ''), 'text-muted']
    ];

    lines.forEach(([text, className]) => {

        const p = document.createElement('div');
        p.textContent = text;
        if (className) p.className = className;
        wrap.appendChild(p);

    });

    return wrap;

};


// The points start hidden and load on first request: all 313 at once crowd out the
// district polygons the map exists to select (reviewer feedback, 2026-10-22). One layer
// group per type, so each checkbox adds or removes its own points

const facilityGroups = {};

// The one in-flight or settled fetch, so a second box ticked before the first load
// lands does not fetch again. Reset to null on failure so a later tick can retry

let facilitiesLoad = null;


// Fetches the facility points into their per-type groups, without adding any to the map.
// Their own pane rather than the overlay pane the polygons share: selectLayer brings the
// selected district to front, which would otherwise bury every point inside it
const loadFacilities = () => {

    if (facilitiesLoad) return facilitiesLoad;

    debugLog('loadFacilities: enter:', reportConfig.facilitiesUrl);

    if (!leafletMap.getPane('ndhr-facilities')) {
        leafletMap.createPane('ndhr-facilities').style.zIndex = 450;
    }

    facilitiesLoad = fetch(reportConfig.facilitiesUrl)
        .then(res => {

            if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + reportConfig.facilitiesUrl);

            return res.json();

        })
        .then(data => {

            debugLog('loadFacilities: branch-loaded:', { featureCount: data && data.features && data.features.length });

            FACILITY_TYPES.forEach(t => {
                facilityGroups[t.type] = L.layerGroup();
            });

            // Not added to the map: each marker goes into its type's group, and the
            // checkboxes decide which groups are on the map
            L.geoJSON(data, {
                pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
                    pane: 'ndhr-facilities',
                    radius: 4.5,
                    color: '#ffffff',
                    weight: 1,
                    fillColor: facilityTypeFor(feature.properties.type).color,
                    fillOpacity: 0.95
                }),
                onEachFeature: (feature, layer) => {

                    layer.bindPopup(() => buildFacilityPopup(feature.properties));

                    const group = facilityGroups[feature.properties.type];
                    if (group) group.addLayer(layer);

                }
            });

            return true;

        })
        .catch(err => {

            // The points are supplementary: a failure here leaves the district map working
            console.error('Error loading facilities GeoJSON:', err);
            debugLog('loadFacilities: branch-load-failed:', err);

            facilitiesLoad = null;

            const status = document.getElementById('ndhr-facilities-status');
            if (status) status.textContent = 'Facilities could not be loaded. Try again.';

            return false;

        });

    return facilitiesLoad;

};


// Keeps the "All facilities" box in step with the five type boxes — checked when every
// type is on, mixed when some are
const syncAllFacilitiesToggle = boxes => {

    const all = document.getElementById('ndhr-facility-all');

    if (!all) return;

    const onCount = boxes.filter(b => b.checked).length;

    all.checked = onCount === boxes.length;
    all.indeterminate = onCount > 0 && onCount < boxes.length;

};


// Puts each type's group on the map or takes it off, to match its checkbox. Reads the
// boxes again once the load resolves, so ticks made while it was in flight still count
const applyFacilityToggles = () => {

    const readBoxes = () => [...document.querySelectorAll('.ndhr-facility-toggle')];

    syncAllFacilitiesToggle(readBoxes());

    // Nothing ticked and nothing loaded yet: no reason to fetch
    if (!readBoxes().some(b => b.checked) && !facilitiesLoad) return;

    loadFacilities().then(ok => {

        if (!ok) return;

        const status = document.getElementById('ndhr-facilities-status');
        if (status) status.textContent = '';

        readBoxes().forEach(box => {

            const group = facilityGroups[box.value];

            if (!group) return;

            if (box.checked) group.addTo(leafletMap);
            else group.remove();

        });

    });

};


// Builds the facility checkboxes beneath the map, which double as the legend. Outside the
// map rather than an L.control on it, because at this column's ~320px a six-row control
// covers most of Staten Island
const renderFacilitiesControls = () => {

    const container = document.getElementById('ndhr-facilities-legend');

    if (!container) return;

    const typeItems = FACILITY_TYPES.map((t, i) =>
        '<li class="mb-1">' +
            '<input type="checkbox" class="ndhr-facility-toggle mr-1" id="ndhr-facility-' + i + '" value="' + escapeAttr(t.type) + '">' +
            '<label for="ndhr-facility-' + i + '" class="mb-0">' +
                '<span class="ndhr-facility-swatch" style="background:' + t.color + ';" aria-hidden="true"></span>' +
                t.label +
            '</label>' +
        '</li>'
    ).join('');

    // The fieldset takes the portal's own form styling (_f-layout-elements.scss): a bordered
    // box under a green legend bar. mb-3 replaces that rule's 3rem bottom margin, which
    // pushed the demographics table a long way down the column
    container.innerHTML =
        '<fieldset class="mb-3">' +
            '<legend class="fs-sm font-weight-bold">Health care facilities</legend>' +
            '<ul class="list-unstyled fs-sm px-2 pt-2 pb-1 mb-0">' +
                '<li class="mb-1">' +
                    '<input type="checkbox" class="mr-1" id="ndhr-facility-all">' +
                    '<label for="ndhr-facility-all" class="mb-0">All facilities</label>' +
                '</li>' +
                '<li>' +
                    '<ul class="list-unstyled ml-3 mb-0">' + typeItems + '</ul>' +
                '</li>' +
            '</ul>' +
            '<p id="ndhr-facilities-status" class="fs-xs text-danger px-2 mb-0" aria-live="polite"></p>' +
        '</fieldset>';

    // "All" sets every type box to its own state; mixed resolves to all-on, the browser's
    // default when an indeterminate box is clicked
    document.getElementById('ndhr-facility-all').addEventListener('change', e => {

        document.querySelectorAll('.ndhr-facility-toggle').forEach(box => {
            box.checked = e.target.checked;
        });

        applyFacilityToggles();

    });

    document.querySelectorAll('.ndhr-facility-toggle').forEach(box => {
        box.addEventListener('change', applyFacilityToggles);
    });

    container.classList.remove('d-none');

};


// Sets up the Leaflet map and loads community district geometry onto it
const initLeafletMap = () => {

    debugLog('initLeafletMap: enter:', reportConfig.geojsonUrl);

    // Initialize Leaflet with a neutral NYC-centered default view
    leafletMap = L.map('ndhr-map', { zoomControl: false }).setView([40.7128, -74.006], 10);

    // Use CARTO basemap tiles to match existing portal styling
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2vaf_1_f87644104deb54c869cef554',
        {
            maxZoom: 15,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    ).addTo(leafletMap);

    L.control.scale({ metric: false, position: 'bottomleft' }).addTo(leafletMap);

    // Null on categories whose facilities_layer is off in NDHR_categories.yml. Only the
    // checkboxes are drawn here; the points load when one is first ticked
    if (reportConfig.facilitiesUrl) renderFacilitiesControls();

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
