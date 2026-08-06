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

// Server-injected SPA configuration, read here so every function below can reach it.
// Whether it actually arrived is bootstrap()'s guard, not this line's
const spaConfig = window.NR_TOPIC_SPA_CONFIG;

// Per-section data store: sectionId -> { neighborhoodName -> rows[] }
const sectionData = {};

// Arquero table for the viz dataset (all indicators, all neighborhoods)
let vizTable = null;

// Track which accordion panels have already had their chart rendered
let renderedPanels = {};

// Track loading: sections + viz = total fetches needed before first render.
// bootstrap() sets the total, since module scope runs before the config guard
let totalFetches = 0;
let fetchesComplete = 0;

// Current neighborhood and geocode, updated on switch
let currentNeighborhood = '';
let currentGeocode = null;

// Leaflet map and GeoJSON layer references
let leafletMap = null;
let uhfLayer = null;
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
