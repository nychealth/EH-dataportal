// ----------------------------------------------
// -------------------- INITIALIZE MAP 
// ----------------------------------------------

var map = L.map('map').setView([40.715554,-74.0026642],10); // [Lat,Long],Zoom

function initializeMap() {

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 15,
      minZoom: 11
  }).addTo(map);

  // L.Control.geocoder().addTo(map);

  // add reset button
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

}


initializeMap()