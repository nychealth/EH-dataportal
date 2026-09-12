// ======================================================================= //
// global.js
// ======================================================================= //

// Category-centric Neighborhood Development Health Report viewer: a Leaflet
// community district selector driving an accordion of indicator cards with Vega
// map and bar charts
//
// Forked from assets/js/nr-report/. The presentation is NR's; what differs is
// where the numbers come from. NR fetches precomputed per-section payloads that
// EHDP-data publishes; NDHR computes its rows in the browser from EHDP-data's own
// indicator files via buildRows (assets/js/report-data/normalize.js), per plan
// DECIDED-4. data.js and chart.js are where that shows.
//
// Expects window.NDHR_REPORT_CONFIG set by the Hugo layout with:
//   - measures: the category's rows from data/globals/NDHR_content/<category>.yml,
//     passed through verbatim — buildRows reads MeasureID, IndicatorID and geotype
//   - communityDistrict / communityDistrictSlug / borough: the district this page
//     was generated for
//   - geoIds: that district's id in each geography a measure may be read at
//   - geojsonUrl: EHDP-data's geography/CD.geojson for the Leaflet selector
//   - districtMap: slug -> display name for all 59 districts
//   - dataRepo / dataBranch: base URL and branch for EHDP-data
//
// Features:
//   - Interactive Leaflet map as sole community district selector
//   - Accordion expand/collapse per indicator row with detail panel
//   - Vega choropleth map + bar chart rendered on first accordion expand
//   - Borough/city comparison logic with judgment styling
//   - Demographics sidebar populated from the `communityDistricts` global
//     (lib-cdlist.html), which is also where a switched district's geoIds come from

// ----------------------------------------------------------------------- //
// shared state
// ----------------------------------------------------------------------- //

// These bindings are declared here and reached from the other nine files, which
// share one top-level scope because the template loads all ten as classic
// <script> tags. Each is annotated with the file that WRITES it and the files
// that READ it, for the reason the NR original gives: nothing in the language
// marks who owns a name in a shared scope, so a reader has to grep for it.

// Server-injected report configuration, read here so every function below can reach it.
// Whether it actually arrived is bootstrap()'s guard, not this line's.
// WRITE: never after this line  READ: app, cards, chart, data, map, report, url
const reportConfig = window.NDHR_REPORT_CONFIG;

// The current district's built rows, one per measure in config order.
// Replaced wholesale on every district switch rather than mutated
// WRITE: data, report  READ: report
let indicatorRows = [];

// Which district `indicatorRows` and `indicatorSeries` were built for. NR needs no
// equivalent: its payloads carry every neighborhood at once, so a switch is a lookup.
// Here a switch is a rebuild, and this is what tells renderAll whether the rows on hand
// are the ones it is about to draw
// WRITE: data, report  READ: report
let rowsDistrict = null;

// MeasureID -> every area's value at that measure's own geotype, for the Vega
// choropleth and bar strip. NR reads the equivalent out of one precomputed viz
// table; here it is derived in data.js from the same indicator files buildRows
// already fetched, so it costs no extra network (normalize.js caches by URL)
// WRITE: data  READ: chart
let indicatorSeries = {};

// IndicatorID (as a string key) -> data-explorer topic slug, reversed out of the
// topic-keyed JSON at load so each card is one lookup rather than a scan of 41 topics.
// Null until that fetch resolves and null again if it fails, which is what suppresses
// the "Full dataset" link rather than emitting one with no href
// WRITE: data  READ: cards
let indicatorTopicSlugs = null;

// Track which accordion panels have already had their chart rendered.
// Two writers of different kinds: report.js replaces the whole object to reset
// it per render, chart.js sets one key per panel it draws
// WRITE: report (reset), chart (keys)  READ: chart
let renderedPanels = {};

// The two halves of the load gate. NR counts fetches because it issues one per
// section plus the viz table; here buildRows owns its own fetching and resolves
// once, so this is a pair of flags rather than a counter
// WRITE: data  READ: data
let rowsLoaded = false;
let topicsLoaded = false;

// Current district and the ids it is read at, both rewritten on every switch.
// currentGeoIds is the whole {CD, CDTA2020, PUMA2020} map, not one id: which
// geography a row is read at is a property of the MEASURE, not of the page
// currentDistrict — WRITE: report  READ: app, cards, chart, data
// currentGeoIds  — WRITE: report  READ: chart, data, map, report
let currentDistrict = '';
let currentGeoIds = null;

// Leaflet map and GeoJSON layer references. Both are written and read only in
// map.js — they sit here with the rest of the shared state rather than because
// anything outside map.js needs them
// WRITE: map  READ: map
let leafletMap = null;
let cdLayer = null;

// The two halves of the initial-render gate: neither render happens until both
// the data and the map geometry are in. tryInitialRender() checks both
// dataReady — WRITE: data  READ: data, map
// mapReady  — WRITE: map   READ: data
let dataReady = false;
let mapReady = false;


// ----------------------------------------------------------------------- //
// value helpers
// ----------------------------------------------------------------------- //

// Treats null, undefined, and '' alike, since ids arrive from the config, the
// geojson and cdlist.json, which do not agree about how they spell "absent"
const isBlank = value => value == null || value === '';


// Shorthand for the demographics renderers, which touch many individually optional nodes
const ndhrById = id => document.getElementById(id);


// ----------------------------------------------------------------------- //
// district lookup
// ----------------------------------------------------------------------- //

// CD.geojson's GEONAME matches cdlist.json's CD_name on all 59 districts
// `[verified 2026-09-11 against the production branch]`, unlike UHF42.geojson, whose
// GEONAME disagrees with uhflist's UHF_name on 6 of 42 — which is why the NR original
// needs a name-correction path here and this file does not. The lookups below still go
// through cdlist rather than the geojson, because cdlist is what carries the other two
// geography ids and the demographics.

// The cdlist row for one CD id, or null. The `==` is deliberate: CD_id is a number in
// cdlist.json and arrives as a string from a geojson property in some paths
const districtRowById = cdId => {

    if (typeof communityDistricts === 'undefined' || isBlank(cdId)) return null;

    return communityDistricts.find(d => d.CD_id == cdId) || null;

};


// The cdlist row for a display name, or null
const districtRowByName = displayName => {

    if (typeof communityDistricts === 'undefined' || !displayName) return null;

    return communityDistricts.find(d => d.CD_name === displayName) || null;

};


// Looks up a district's CD id from the display name shown in the UI
const getDistrictIdForDisplayName = displayName => {

    const row = districtRowByName(displayName);

    return row ? row.CD_id : null;

};


// The three geography ids a district's measures may be read at.
//
// Derived from cdlist rather than read from reportConfig.geoIds even on first paint,
// so the load path and the in-place switch path are one path. The config still carries
// geoIds for this page's own district — it is the fallback when cdlist has not loaded,
// and it is what makes the server-rendered page self-describing
const geoIdsForDistrict = displayName => {

    const row = districtRowByName(displayName);

    if (!row) {
        debugLog('geoIdsForDistrict: branch-fallback-config:', displayName);
        return reportConfig.geoIds || null;
    }

    return {
        CD: row.CD_id,
        CDTA2020: row.CDTA_id,
        PUMA2020: row.PUMA2020_id
    };

};
