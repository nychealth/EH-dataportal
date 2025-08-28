// ----------------------------------------------
// -------------------- INITIALIZE MAP 
// ----------------------------------------------

  var lat = 40.714912;
  var lng = -74.047509;
  var zoom = 11;
  let geojsonLayer; // so we can clear it later
  const customIcon = L.icon({
    iconUrl: 'images/map-marker.svg',
    iconSize: [32, 32],   // adjust depending on your SVG
    iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -32] // optional, where popups open relative to icon
  });

  var map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false
  }).setView([lat,lng],zoom); // [Lat,Long],Zoom
  L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
      maxZoom:15,
      minZoom: 11,
      attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }).addTo(map);


  // Add 'legend' (indicator info) to map
  const legend = L.control({position: 'topleft'});

  legend.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = document.getElementById('legendHolder').innerHTML
      return div;
  };

  legend.addTo(map);



function changeText(x) {
    console.log('Running text for ', x)

    var next = x+1
    var last = x-1
    var textHolder = document.getElementById('thisText')
    var nextButton = document.getElementById('nextButton')

    textHolder.innerHTML = config[x].text

    nextButton.setAttribute('onclick',`changeText(${next})`)
    nextButton.classList.remove('hide')

    // Add the "Go back" button
    if (x == 1) {
        document.getElementById('lastButton').classList.remove('hide')
    } else {}

    document.getElementById('lastButton').setAttribute('onclick',`changeText(${last})`)

    // load GeoJSON as specified in config, if it exists
    loadGeoJSON(config[x].geoFile)

    // if we're at the end of the config, then, remove the Next Button
    if (next == config.length) {
        console.log('We are done here!')
        nextButton.classList.add('hide')
        return
    } else {}

}

// function to load geojson
function loadGeoJSON(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
      }
      geojsonLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: customIcon });
        }
      }).addTo(map);
      // map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(err => console.error('Error loading GeoJSON:', err));
}



changeText(0)