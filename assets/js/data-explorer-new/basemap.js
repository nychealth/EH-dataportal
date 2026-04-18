// ======================================================================= //
// basemap.js
// ======================================================================= //

// console.log(">> basemap.js");

// Creates the lightweight Leaflet map used on the section chooser page.
// Initialize the map
const map = L.map('map', {
    zoomControl: false
}).setView([40.700142, -73.921546], 11);


// Adds the shared CARTO basemap tiles behind the chooser page map.
// Add a basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
    attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
}).addTo(map);