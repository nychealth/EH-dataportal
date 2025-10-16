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
      scrollWheelZoom: true,
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
    } else if (x == 0 ) {
        document.getElementById('lastButton').classList.add('hide')
    } else {}

    document.getElementById('lastButton').setAttribute('onclick',`changeText(${last})`)

    // load GeoJSON as specified in config, if it exists
    loadGeoJSON(config[x].geoFile,config[x].choropleth, config[x].valueField,config[x].geonameField,config[x].labelName,config[x].zoom)

    // if we're at the end of the config, then, remove the Next Button
    if (next == config.length) {
        console.log('We are done here!')
        nextButton.classList.add('hide')
        return
    } else {}

}

function loadGeoJSON(url, choro, propertyField, nameField, labelField,zoom) {

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
      }

      let min = Infinity;
      let max = -Infinity;

      if (choro && propertyField) {
        data.features.forEach(f => {
          const val = f.properties[propertyField];
          if (typeof val === "number") {
            if (val < min) min = val;
            if (val > max) max = val;
          }
        });
      }

      if (zoom == true) {
        console.log('zoom yes')

        // Tell the map to zoom to a specific lat / long

        // And, open two popups for specific points. 

      } else if (zoom == false) {
        console.log('zoom no')
      }

      // --- helper to map value -> color ---
      function getColor(value) {
        if (!choro || value == null || min === max) {
          return "green"; // fallback
        }
        const t = (value - min) / (max - min); // normalize

        // interpolate between white and dark green
        const start = [255, 255, 255]; // white
        const end   = [0, 51, 0];      // dark green

        const r = Math.round(start[0] + t * (end[0] - start[0]));
        const g = Math.round(start[1] + t * (end[1] - start[1]));
        const b = Math.round(start[2] + t * (end[2] - start[2]));

        return `rgb(${r},${g},${b})`;
      }

      geojsonLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: customIcon });
        },
        style: function (feature) {
          if (choro && propertyField && feature.properties[propertyField] !== undefined) {
            const value = feature.properties[propertyField];
            return {
              color: "#333333",
              weight: 1,
              opacity: 1,
              fillColor: getColor(value),
              fillOpacity: 0.7
            };
          } else {
            return {
              color: "#333333",
              weight: 2,
              opacity: 1,
              fillColor: "green",
              fillOpacity: 0.3
            };
          }
        },
        onEachFeature: choro
          ? function (feature, layer) {
            console.log(feature)
              const label = labelField
              const name = feature.properties[nameField];
              var val = feature.properties[propertyField];
              if (label === "Block Group") {
                val *= 100;
              }
              val = val.toFixed(2)
              const tooltipContent = `${labelField} <b>${name}</b>, ${val}% of residents<br>live in walking distance of an accessible subway station.`;
              layer.bindTooltip(tooltipContent, { sticky: true });
            }
          : undefined
      }).addTo(map);

      // Optional: fit map view to new layer
      // map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(err => console.error("Error loading GeoJSON:", err));
}






changeText(0)