// ===== CREATE MAP ================================================== //
var name;
var id;
var ratData = [];

var map = L.map('map').setView([40.7722226,-73.9638235],11); // [Lat,Long],Zoom
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 15,
    minZoom: 11
}).addTo(map);

L.control.scale({
    metric: false,
    position: 'bottomleft'
}).addTo(map)

// L.Control.geocoder().addTo(map);

// Add the geocoder control
var geocoder = L.Control.geocoder().addTo(map);

// Listen for the geocode event and log lat and long. 
geocoder.on('markgeocode', function(e) {
    var latlng = e.geocode.center; // Get the LatLng object
    console.log(e) // log whole event
    console.log('Latitude:', latlng.lat, 'Longitude:', latlng.lng); // Log to the console
});



L.easyButton({
    position: "bottomleft",
    states: [{
        title: "Zoom to fit",
        icon: "fas fa-undo",
        
        onClick: function() {
            
            resetZoom();
        }
    }]
}).addTo(map);     

function resetZoom() {
    // console.log('reset zoom 3')
    window.location.hash = '#top'
    location.reload()
}

// When style is run in const geojson, it returns these - default styles
function style(feature) {
    return {
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '1',
        fillOpacity: 0.2,
        fillColor: 'black'
    };
}
   
// This actually calls our geojson, style, and onEachFeature
var geog = L.geoJson(rmz,{
  style
}).addTo(map);

// THIS IS THE POINT-IN-POLYGON CODE
var polygon = L.polygon([
  [51.51, -0.08],
  [51.503, -0.06],
  [51.51, -0.047]
]).addTo(map);
var m1 = L.marker([51.515, -0.07]); // Outside and north of polygon
var m2 = L.marker([51.506, -0.06]); // In polygon, not on border
var m3 = L.marker([51.505, -0.074]); // Inside polygon boundary box but outside of polygon. 
var m4 = L.marker([51.51, -0.067]); // On polygon border.

console.log(polygon.contains(m1.getLatLng()));
// ==> false
console.log(polygon.contains(m2.getLatLng()));
// ==> true
console.log(polygon.contains(m3.getLatLng()));
// ==> false
console.log(polygon.contains(m4.getLatLng()));
// ==> true

// END POINT-IN-POLYGON CODE


//----------------------- CODE TO DEVELOP -----------------------//
/*
  - Put a basic geocoder on the map (insert address, drop a pin)

  - Store GeoJSONS offsite, ingest them

  - Run code that loops through RMZ and CD geojson, and extracts each polygon

      rmz.features[0].geometry.coordinates[0]
      loop through rmz.features[x],
        and loop through rmz.features[x].geometry.coordinates[y]
        var name = rmz.features[x].properties.Label
        if polygon.contains(point.getLatLng()), then var in = true, and print name to page.
      after loops, if in /= true, then, loop through CDs.

      Alternatively, you can loop through CDs first.
      If it's in one of the CDs that overlaps an RMZ, then you can run an RMZ loop. 

  - Build a function that runs a point through all of those polygons
  - Stop if it's in one thing, and return aspects of that polygon... (info about it?)
*/





