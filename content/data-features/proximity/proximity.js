/*
  Content is stored in proxConfig.js - a simple JSON content config with fields for text, geofile, and some other fields.
  changeText() runs on button click and brings us through the content in proxConfig
  loadGeoJSON() renders the map based on the settings in proxConfig
*/

// ----------------------------------------------
// -------------------- PRELOAD GEOJSON FILES
// ----------------------------------------------
const geojsonCache = {};

async function preloadGeoJSONs() {
  const uniqueFiles = [...new Set(config.map(c => c.geoFile))];

  const promises = uniqueFiles.map(file =>
    fetch(file)
      .then(res => res.json())
      .then(data => {
        geojsonCache[file] = data;
      })
      .catch(err => console.error("Error preloading", file, err))
  );

  await Promise.all(promises);
  console.log("✅ All GeoJSONs preloaded:", Object.keys(geojsonCache));
}

// ----------------------------------------------
// -------------------- INITIALIZE MAP 
// ----------------------------------------------

  var lat = 40.714912;
  var lng = -74.047509;
  var zoom = 11;
  let geojsonLayer; // so we can clear it later
  const customIcon = L.icon({
    iconUrl: 'images/map-pin-hollow_P.svg',
    iconSize: [32, 32],   // adjust depending on your SVG
    iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -32] // optional, where popups open relative to icon
  });

  var map = L.map('map', {
      zoomControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: true
  }).setView([lat,lng],zoom); // [Lat,Long],Zoom
  L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
      maxZoom:15,
      minZoom: 11,
      attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }).addTo(map);

// ----------------------------------------------
// -------------------- Function to change text on button click 
// ----------------------------------------------

function changeText(x) {
    // console.log('Running text for ', x)

    var next = x+1
    var last = x-1
    var textHolder = document.getElementById('thisText')
    var nextButton = document.getElementById('nextButton')

    textHolder.innerHTML = config[x].text
    textHolder.classList.add('overflower')

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
    loadGeoJSON(config[x])

    // if we're at the end of the config, then, remove the Next Button
    if (next == config.length) {
        console.log('We are done here!')
        nextButton.classList.add('hide')
        return
    } else {}

}


// ----------------------------------------------
// -------------------- Load geoJSON and config content 
// ----------------------------------------------
function loadGeoJSON(config = {}) {
  const {
    geoFile = null,
    choropleth = null,
    valueField = null,
    geonameField = null,
    labelName = null,
    zoom = false,
    pin = false,
    suppressTooltip = false
  } = config;

  // Make sure we have a file to load
  if (!geoFile) {
    console.warn("loadGeoJSON: Missing geoFile (URL). Skipping load.");
    return;
  }

  // --- Load data from cache if available ---
  let dataPromise;
  if (geojsonCache && geojsonCache[geoFile]) {
    dataPromise = Promise.resolve(geojsonCache[geoFile]);
  } else {
    console.warn("GeoJSON not preloaded, fetching:", geoFile);
    dataPromise = fetch(geoFile).then(res => res.json());
  }

  dataPromise
    .then(data => {
      // Clear existing GeoJSON layer
      if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
      }

      let min = Infinity;
      let max = -Infinity;

      // --- Determine range for choropleth ---
      if (choropleth && valueField) {
        data.features.forEach(f => {
          const val = f.properties[valueField];
          if (typeof val === "number") {
            if (val < min) min = val;
            if (val > max) max = val;
          }
        });
      }

      // --- Handle Zoom ---
      if (zoom === true) {
        map.setView([40.675377, -73.872106], 15);
      } else {
        map.setView([lat, lng], 11);
      }

      // --- Handle Pins ---
      if (pin === true) {
        // Add pin to isochrone center
        L.marker([40.675377, -73.872106], { icon: customIcon }).addTo(map);

        // Add pin for block group
        L.marker([40.67777173561341, -73.87902747921927], { icon: customIcon })
          .addTo(map)
          .bindPopup(
            `This block group:<br>
            Population outside walkable area: <strong>67.93%</strong><br>
            Population inside walkable area: <strong>32.07%</strong>`,
            {
              autoClose: false,
              closeOnClick: false,
              className: 'my-popup-box'
            }
          )
          .openPopup();
      } else {
        // Clear all popups and pins
        map.eachLayer(layer => {
          if (layer instanceof L.Popup || layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });
      }

      // --- Helper: map value -> color ---
      function getColor(value) {
        if (!choropleth || value == null || min === max) {
          return "green"; // fallback
        }

        const t = (value - min) / (max - min); // normalize
        const start = [255, 255, 255]; // white
        const end = [0, 51, 0];        // dark green

        const r = Math.round(start[0] + t * (end[0] - start[0]));
        const g = Math.round(start[1] + t * (end[1] - start[1]));
        const b = Math.round(start[2] + t * (end[2] - start[2]));

        return `rgb(${r},${g},${b})`;
      }

      // --- Create GeoJSON Layer ---
      geojsonLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) =>
          L.marker(latlng, { icon: customIcon }),

        style: feature => {
          if (choropleth && valueField && feature.properties[valueField] !== undefined) {
            const value = feature.properties[valueField];
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

        onEachFeature: (feature, layer) => {
          if (choropleth) {
            // --- Choropleth case ---
            if (suppressTooltip === true) return; // suppress tooltip in zoom mode

            const name = feature.properties[geonameField];
            let val = feature.properties[valueField];

            if (labelName === "Block Group") {
              val *= 100;
            }

            val = val.toFixed(2);
            const tooltipContent = `${labelName} <b>${name}</b>: ${val}% of residents<br>live in walking distance of an accessible subway station.`;

            layer.bindTooltip(tooltipContent, { sticky: true });
          } else {
            // --- Non-choropleth case ---
            const displayValue = feature.properties[labelName];
            if (displayValue !== undefined) {
              const popupContent = `<strong>${labelName}:</strong> ${displayValue}`;
              layer.bindPopup(popupContent);
            }
          }
        }

      }).addTo(map);
    })
    .catch(err => console.error("Error loading GeoJSON:", err));
}


// ----------------------------------------------
// -------------------- Run initial
// ----------------------------------------------
preloadGeoJSONs().then(() => {
  changeText(0);
});