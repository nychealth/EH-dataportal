// ======================================================================= //
// global.js
// ======================================================================= //

// Topic-centric Neighborhood Reports viewer: a Leaflet neighborhood selector
// driving an accordion of indicator cards with Vega map and bar charts
//
// Expects window.NR_TOPIC_SPA_CONFIG set by the Hugo layout with:
//   - sections: array of { id, containerId, reportUrl } objects, one per report_topic
//   - geojsonUrl: URL to UHF42 GeoJSON for the Leaflet selector map
//   - vizUrl: EHDP-data viz JSON URL for map/chart rendering
//   - dataRepo: base URL for EHDP-data (used to build geography TopoJSON URLs)
//   - dataBranch: branch name for EHDP-data
//
// Features:
//   - Interactive Leaflet map as sole neighborhood selector
//   - Accordion expand/collapse per indicator row with detail panel
//   - Vega choropleth map + bar chart rendered on first accordion expand
//   - Borough/city comparison logic with judgment styling
//   - Demographics sidebar populated from uhflist.js
//   - Neighborhood persistence via path + sessionStorage bridging

// ----------------------------------------------------------------------- //
// shared state
// ----------------------------------------------------------------------- //

// These bindings are declared here and reached from the other nine files, which
// share one top-level scope because the template loads all ten as classic
// <script> tags. Each is annotated with the file that WRITES it and the files
// that READ it, because that is the thing a shared-scope split makes invisible:
// nothing in the language marks who owns a name, so a reader has to grep for it.
// Derived by sweep, 2026-08-06 — re-run it rather than trusting these if the
// call graph moves.

// Server-injected SPA configuration, read here so every function below can reach it.
// Whether it actually arrived is bootstrap()'s guard, not this line's.
// WRITE: never after this line  READ: app, chart, data, map, report, url
const spaConfig = window.NR_TOPIC_SPA_CONFIG;

// Per-section data store: sectionId -> { neighborhoodName -> rows[] }.
// The binding is never reassigned; data.js fills it key by key
// WRITE (keys): data  READ: report
const sectionData = {};

// Arquero table for the viz dataset (all indicators, all neighborhoods)
// WRITE: data  READ: app (CSV export), chart (per-indicator summary)
let vizTable = null;

// Track which accordion panels have already had their chart rendered.
// Two writers of different kinds: report.js replaces the whole object to reset
// it per render, chart.js sets one key per panel it draws
// WRITE: report (reset), chart (keys)  READ: chart
let renderedPanels = {};

// Track loading: sections + viz = total fetches needed before first render.
// bootstrap() sets the total, since module scope runs before the config guard.
// fetchesComplete never leaves data.js; it lives here to stay beside its pair
// WRITE: app (total), data (complete)  READ: data
let totalFetches = 0;
let fetchesComplete = 0;

// Current neighborhood and geocode, updated on switch
// WRITE: report  READ: app, chart, map, report
let currentNeighborhood = '';
let currentGeocode = null;

// Leaflet map and GeoJSON layer references. Both are written and read only in
// map.js — they sit here with the rest of the map state rather than because
// anything outside map.js needs them
// WRITE: map  READ: map
let leafletMap = null;
let uhfLayer = null;

// The two halves of the initial-render gate: neither render happens until both
// the data fetches and the map geometry are in. tryInitialRender() checks both
// WRITE: data (dataReady), map (mapReady)  READ: data, map
let dataReady = false;
let mapReady = false;


// ----------------------------------------------------------------------- //
// value helpers
// ----------------------------------------------------------------------- //

// Treats null, undefined, and '' alike, since geocodes arrive from three sources
// that disagree about how they spell "absent"
const isBlank = value => value == null || value === '';


// Shorthand for the demographics renderers, which touch many individually optional nodes
const nrById = id => document.getElementById(id);


// ----------------------------------------------------------------------- //
// name lookup
// ----------------------------------------------------------------------- //

// uhflist.js has one known typo: "Crotona -Tremont" (missing space after dash)
// EHDP-data report JSONs use "Crotona - Tremont". This map corrects it so
// lookups against report data and sidebar demographics stay aligned
const nameCorrections = {
    'Crotona -Tremont': 'Crotona - Tremont'
};


// Maps a raw uhflist.js name onto the spelling report data uses
const correctedUhfName = name => nameCorrections[name] || name;


// Looks up a neighborhood's UHF id from the display name shown in the UI
const getUhfIdForDisplayName = displayName => {

    // Neighborhood metadata may not be loaded in every page context
    if (!displayName || typeof neighborhoods === 'undefined') return null;

    const entry = neighborhoods.find(n => correctedUhfName(n.UHF_name) === displayName);

    return entry ? entry.UHF_id : null;

};
