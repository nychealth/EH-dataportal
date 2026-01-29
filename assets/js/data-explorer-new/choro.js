console.log(">> choro.js");

// Initialize the map
const map = L.map('map', {
    zoomControl: false
}).setView([40.700142, -73.921546], 11);


// Add a basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
    attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
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

document.getElementById('minVal').innerHTML = minValue
document.getElementById('maxVal').innerHTML = maxValue


// --- Create the color scale ---

const colorScale = d3.scaleSequential()
    .domain([maxValue, minValue]) 
    .interpolator(d3.interpolateViridis);


// --- Define style functions ---

const styleFeature = (feature) => {

    console.log("* styleFeature");

    const value = feature.properties.Value;

    return {
        fillColor: value != null ? colorScale(value) : '#ccc',  // gray if no data
        weight: 0.35,
        color: 'black',
        fillOpacity: 0.8
    };

}

const highlightFeature = (e) => {

    console.log("* highlightFeature");

    const layer = e.target;
    layer.setStyle({
        weight: 3,
        color: '#000',
        fillOpacity: 0.9
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

}

const resetHighlight = (e) => {

    console.log("* resetHighlight");

    geojsonLayer.resetStyle(e.target);
}

// --- Create popup content ---

// add parameters for names

const createPopupContent = (properties) => {

    console.log("* createPopupContent");
    
    return `
    <div class="popup-content">
      <strong>${properties.Geography}</strong>
      <hr class="my-1">
      <em>Asthma ED visits (age 5 to 17)</em>: in <strong>${properties.TimePeriod || 'Unknown'}</strong>, the estimated annual rate was <strong>${properties.Value}</strong> per 10,000.
      <span style="font-size:12px">${properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
    </div>
  `;
}

const updateHoverUI = (props) => {

    console.log("* updateHoverUI");

    // Update legend text
    document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
    document.getElementById('hoveredValue').textContent = props.Value ?? '—';
    document.getElementById('hoveredUnits').textContent = 'per 10,000';
    
    // Show legend tick
    document.getElementById('legend-tick').style.display = 'block';
    
    // Move the legend tick
    const percentage = calculatePercent(props.Value);
    document.querySelector('.viridis-tick').style.left = percentage + '%';

}

const clearHoverUI = () => {

    console.log("* clearHoverUI");
    
    document.getElementById('hoveredGeo').textContent = 'Hover for details';
    document.getElementById('hoveredValue').textContent = '';
    document.getElementById('hoveredUnits').textContent = '';
    document.getElementById('legend-tick').style.display = 'none';

}


// --------------------------------------------------------------------------- //
// Lookup to match GeoID → Leaflet layer
// --------------------------------------------------------------------------- //
const geoIDtoLayer = {};   // <--- ADD THIS
// --------------------------------------------------------------------------- //

// --- Add the GeoJSON to the map ---

const geojsonLayer = L.geoJson(geojson, {

    style: styleFeature,
    onEachFeature: (feature, layer) => {
        
        // Store reference so we can highlight later using GeoID from chart
        
        const geoID = feature.properties.GeoID || feature.properties.GEOCODE;
        if (geoID) {
            geoIDtoLayer[geoID] = layer;
        }
        
        // ----------------------------------------------------------------------- //
        
        layer.bindPopup(createPopupContent(feature.properties));
        
        layer.on('mouseover', (e) => {

            console.log("** mouseover");

            const props = feature.properties;

            updateHoverUI(props);
            highlightFeature(e); 
            
            if (window.myVegaView) {
                window.myVegaView.signal("selectedGeo", props.GeoID).run();
            }
            
        });
        
        layer.on('mouseout', (e) => {

            console.log("** mouseout");

            clearHoverUI();
            resetHighlight(e);
            
            if (window.myVegaView) {
                window.myVegaView.signal("selectedGeo", null).run();
            }
            
        });
        
    }
}).addTo(map);


const calculatePercent = (x) => {
    const range = maxValue - minValue;
    const placement = x - minValue;
    const calculation = 100 * placement / range;
    return calculation;
}
