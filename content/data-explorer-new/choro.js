// Initialize the map
const map = L.map('map').setView([40.700142, -73.921546], 11);

// Add a basemap
L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright/" target="_blank">&copy; OpenStreetMap contributors</a>',
}).addTo(map);

// --- Convert TopoJSON to GeoJSON ---
const geojson = topojson.feature(topojsonData, topojsonData.objects.collection);

// --- Create a lookup for data and attributes ---
const dataLookup = {};
attributeData.forEach(item => {
  dataLookup[item.GeoID] = item;  // store the full record
});

// --- Attach data to each feature ---
geojson.features.forEach(feature => {
  const geoID = feature.properties.GEOCODE;
  const matchedData = dataLookup[geoID];
  if (matchedData) {
    feature.properties = {
      ...feature.properties,  // keep original properties (like GEOCODE, GEONAME, etc)
      ...matchedData          // add all fields from matchedData
    };
  } else {
    feature.properties.dataValue = null;  // mark as missing data
  }
});

// --- Find the min and max values in your dataset ---
const values = attributeData.map(d => d.Value).filter(v => v != null);
const minValue = Math.min(...values);
const maxValue = Math.max(...values);

// --- Create the color scale ---
const colorScale = d3.scaleSequential()
    .domain([maxValue, minValue])  // ✅ Correct order: min first, max second
    .interpolator(d3.interpolateViridis);

// --- Define style function ---
function styleFeature(feature) {
  const value = feature.properties.Value;  // use Value directly now
  return {
    fillColor: value != null ? colorScale(value) : '#ccc',  // gray if no data
    weight: 0.35,
    color: 'black',
    fillOpacity: 0.8
  };
}

// --- Function to create popup content ---
function createPopupContent(properties) {

  return `
    <div class="popup-content">
      <strong>${properties.Geography}</strong>
      <hr>
      <em>Asthma ED visits (age 5 to 17)</em>: in <strong>${properties.TimePeriod || 'Unknown'}</strong>, the estimated annual rate was <strong>${properties.Value}</strong> per 10,000.
      <span style="font-size:12px">${properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
    </div>
  `;
}

// --- Add the GeoJSON to the map ---
L.geoJson(geojson, {
  style: styleFeature,
  onEachFeature: function(feature, layer) {
    layer.bindPopup(createPopupContent(feature.properties));
  }
}).addTo(map);
