// Initialize the map
const map = L.map('map', {
  zoomControl: false
}).setView([40.700142, -73.921546], 11);


// Add a basemap
L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright/" target="_blank">&copy; OpenStreetMap contributors</a>',
}).addTo(map);