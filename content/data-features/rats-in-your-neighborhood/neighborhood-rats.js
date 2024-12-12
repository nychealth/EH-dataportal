//----------------------- CODE TO DEVELOP -----------------------//
/*
- Consider making more robust error messages
*/


// initialize variables
var inputAddress;
var inputLat;
var inputLong;
var inputLatLong = []
var CDgeojson = 'https://gist.githubusercontent.com/mmontesanonyc/37c3ddb2bb368d3cd78dbd1e0cb4c22e/raw/0b5a7e8a6afbcb8e4a7c242ca320a135e920221f/cd.geojson'
var RMZgeojson = 'https://gist.githubusercontent.com/mmontesanonyc/7782a491c71c4cf52f2798f81428aa7a/raw/daec209b03f245a1ea25ca3994a4c5d48a63ce28/rmz.geojson'
let geojsonData;
let countyID;
var city;
var county;
var cdRMZOverlaps = [102,103,107,109,110,111,112,201,203,204,205,207,303,304,308]
var success;
var thisArea = []
var mapLayers = []
var mapMarkers = []
var cdData;
var rmzData;

// Initialize the map
const map = L.map('map').setView([40.7722226,-73.9638235],11);

// Add  tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 15,
    minZoom: 11
}).addTo(map);

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

function resetZoom() {
    // console.log('reset zoom 3')
    window.location.hash = '#top'
    location.reload()
}

// Initialize the geocoder
const geocoder = L.Control.Geocoder.nominatim();


//---------- 
// Form submission handler - geocoding initialized here
//---------- 
document.getElementById('geocode-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent form from reloading the page

    const address = document.getElementById('address').value;

    // Use the geocoder to search for the address
    geocoder.geocode(address, function(results) {
    if (results && results.length > 0) {
        const { center, name, html } = results[0];
        map.setView(center, 13); // Update map to the result location

        // Remove prior markers
        mapMarkers.forEach(marker => map.removeLayer(marker))

        // Add a marker
        L.marker(center).addTo(map)
        .bindPopup(html)
        .openPopup();

        // Get location details from results
        console.log('Location details:')
            console.log(results)
            inputLat = results[0].center.lat;
            inputLong = results[0].center.lng
            inputLatLong = [inputLat,inputLong]
        console.log('Latitude:', inputLat, 'Longitude:', inputLong)

        // check if it's an NYC address, and if it is, check to see what county it is.
        city = results[0].properties.address.city
        if (isInNYC(city) === true) {
            console.log('City is true, now check county')
            document.getElementById('formDisable').disabled = true
            checkCounty(results[0].properties.display_name)
        } 

    } else {
        alert('Address not found!');
    }
    });
});

//---------- 
// First checks to ensure point is in NYC.
//---------- 
function isInNYC(x) {
    if (x === 'New York') {
        console.log('Yes, it is a NYC address')
        document.getElementById('message1').innerHTML = 'This is a NYC address.'
        // checkCDs(countyID) // checks to see what CD this address is in
        return true;
   } else {
        console.log('No, it is not an NYC address')
        document.getElementById('message1').innerHTML = 'This address is not in NYC. Please try again.'
        alert('This address is not an NYC address - please try again.')
        return false;
   }
}

//---------- 
// from isInNYC, checks the point's county:
//---------- 
function checkCounty(y) {
    console.log('County checking for location: ', y)
    if (y.includes('New York County')) {countyID = 1} 
    else if (y.includes('Bronx County')) {countyID = 2} 
    else if (y.includes('Kings County')) {countyID = 3} 
    else if (y.includes('Queens County')) {countyID = 4} 
    else if (y.includes('Richmond County')) {countyID = 5} 
    // if we identify the county, run checkCDs to see what CD the point is in
    countyID ? checkCDs(countyID) : console.log('Could not ID county; stopping geocoding')
}


//---------- 
// With county information check to see what Community District the point is in:
//---------- 
async function checkCDs(x) {
    // First, remove any existing layers
    mapLayers.forEach(layer => map.removeLayer(layer)) // remove CD layer
    mapMarkers.forEach(marker => map.removeLayer(marker))

    console.log('County ID:', x)
    console.log('We will now check to see what CD this is in.')
    await getGeoJSON(CDgeojson); // load geoJSON

    // loop through geojsonData; match countyID to first character of geojsonData.features[0].properties.boro_cd
    for (let i = 0; i < geojsonData.features.length; i++) {
        let cdCode = geojsonData.features[i].properties.boro_cd
        let thisCDCounty = cdCode.substring(0,1)

        // if we find a geography in the right county (boro)...
        if (x == thisCDCounty) {

            // ...go into that geometry (CD)

            for (let j = 0; j < geojsonData.features[i].geometry.coordinates.length; j++) {

                // Loop through the geometry's nested polygons
                for (let k = 0; k < geojsonData.features[i].geometry.coordinates[j].length; k++) {

                    // grab each geometry, and test point (inputLatLong) against it
                    thisArea = geojsonData.features[i].geometry.coordinates[j][k];
                        // HERE HERE HERE, we will need to reverse the order of the lat/longs in the polygon...!
                        thisArea = swapFirstAndSecond(thisArea)

                    let area     = L.polygon(thisArea)
                    let location    = L.marker(inputLatLong)
                    mapMarkers.push(location)   // add point to array
                    mapLayers.push(area)        // add area to map layers array

                    // one approach (currently redundant, but works)
                    // isMarkerInsidePolygon(location,area)
                    
                    // another approach
                    if (area.contains(location.getLatLng())) {
                         console.log('This address is in CD ', cdCode)
                         document.getElementById('message2').innerHTML = 'This address is in CD ' + cdCode + "."
                         success = true
                         area.addTo(map)
                         checkOverlap(cdCode)
                         break; // stop the loop
                     }
                }
            }
        } 
    }

    if (!success) {console.log('We did not successfully identify a parent geography.')} // error message

}

//---------- 
// From CD geocoder, checks overlap array to see if point is in an RMZ-adjacent/overlapping CD
//---------- 
var overlap
function checkOverlap(x) {
    var cd = Number(x)
    if (cdRMZOverlaps.includes(cd)) {
        document.getElementById('message3').innerHTML = 'This might be in an RMZ...'
        overlap = true
        checkRMZs(x)
    } else {
        document.getElementById('message3').innerHTML = 'This is not an RMZ.'
        overlap = false
    }
}

//---------- 
// From CD geocoder, checks RMZ geojson for parent polygons. Note: separate loops for type: Polygon and type: MultiPolygon
//---------- 
async function checkRMZs(x) {
    console.log('You are in CD ' + x)

        // Here's where we can get CD Inspection Data.

    console.log('We will now check to see if you are in an RMZ...')
    await getGeoJSON(RMZgeojson)

    for (let i = 0; i < geojsonData.features.length; i++) {
        // console.log(i)

        // Loop through all the nested multipolygons
        if (geojsonData.features[i].geometry.type === "MultiPolygon") {
            for (let j = 0; j < geojsonData.features[i].geometry.coordinates.length; j++) {
                for (let k = 0; k < geojsonData.features[i].geometry.coordinates[j].length; k++) {
                    thisArea = geojsonData.features[i].geometry.coordinates[j][k];
                    thisArea     = swapFirstAndSecond(thisArea)
                    let area     = L.polygon(thisArea)
                    let location = L.marker(inputLatLong)
                    if (area.contains(location.getLatLng())) {
                        console.log('This address is RMZ ', geojsonData.features[i].properties.Label)
                        document.getElementById('message4').innerHTML = 'This IS in an RMZ: ' + geojsonData.features[i].properties.Label + " RMZ."

                            // Here's where we can get RMZ Inspection Data.

                        success = true
                        mapLayers.forEach(layer => map.removeLayer(layer)) // remove CD layer
                        area.addTo(map) // add RMZ layer
                        break; // stop the loop
                    }
                }
            }
        } 
        // and nested polygons
        else if (geojsonData.features[i].geometry.type === "Polygon") {
            console.log(geojsonData.features[i], geojsonData.features[i].geometry.type)
            for (let j = 0; j < geojsonData.features[i].geometry.coordinates.length; j++) {
                thisArea = geojsonData.features[i].geometry.coordinates[j];
                thisArea     = swapFirstAndSecond(thisArea)
                let area     = L.polygon(thisArea)
                let location = L.marker(inputLatLong)
                if (area.contains(location.getLatLng())) {
                    console.log('This address is RMZ ', geojsonData.features[i].properties.Label)
                    document.getElementById('message4').innerHTML = 'This IS in an RMZ: ' + geojsonData.features[i].properties.Label + " RMZ"
                    success = true
                    area.addTo(map)
                    break; // stop the loop
                }       
            }
        }
    }
}

//---------- 
// retrieves geoJSON files
//---------- 

function getGeoJSON(x) {
    return new Promise((resolve, reject) => {
        // Fetch the GeoJSON data
        fetch(x)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the GeoJSON data
        })
        .then(data => {
            geojsonData = data; // Store the GeoJSON data in a global variable
            console.log('GeoJSON data loaded:', geojsonData);
            resolve(); // Resolve the promise when the data is ready
        })
        .catch(error => {
            console.error('Error fetching the GeoJSON file:', error);
            reject(error); // Reject the promise if there’s an error
        });
    });
}

//---------- 
// Point re-formatter
//---------- 

function swapFirstAndSecond(arrays) {
    // Iterate over each sub-array
    return arrays.map(subArray => {
      // Swap the first and second elements
      return [subArray[1], subArray[0]];
    });
  }
  
//---------- 
// Retrieve indicators
//---------- 

function getIndicatorData(x) {
    const URL = 'https://raw.githubusercontent.com/nychealth/EHDP-data/refs/heads/production/indicators/data/' + x + '.json';
    
    // Takes IndicatorID: Rat Inspections (CD) - 2434; in RMZs, 2433
    return new Promise((resolve, reject) => {
        fetch(URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse data
            })
            .then(data => {
                // REFORMAT DATA
                const keys = Object.keys(data);
                const numRows = data[keys[0]].length; // Assuming all arrays are the same length
                
                const reformattedData = Array.from({ length: numRows }, (_, i) => {
                    return keys.reduce((obj, key) => {
                        obj[key] = data[key][i];
                        return obj;
                    }, {});
                });

                // console.log('Reformatted Data:', reformattedData);
                resolve(reformattedData); // Resolve the promise with reformatted data
            })
            .catch(error => {
                console.error('Error fetching the Indicator data:', error);
                reject(error); // Reject the promise if there’s an error
            });
    });
}


getIndicatorData(2434)
    .then(cdData => {
        console.log('cdData:', cdData);
        // Filter the cdData here
        cdData = cdData.filter(entry => entry.GeoType === "CD");
        console.log('Filtered Data:', cdData);

        // Get most recent data
        const maxTimePeriodID = Math.max(...cdData.map(item => item.TimePeriodID));
        cdData = cdData.filter(item => item.TimePeriodID === maxTimePeriodID);
        console.log('Most recent data,', cdData)

        /* Metadata
        "MeasureID": 1381,
        "MeasureName": "Rat inspections, Percent of properties inspected",
        ---
        "MeasureID": 1382,
        "MeasureName": "Rat inspections, Failed (any reason)",
        ---
        "MeasureID": 1383,
        "MeasureName": "Rat inspections, Failed (active rat signs)",
        */

    })
    .catch(error => {
        console.error('Error:', error);
    });


getIndicatorData(2433)
    .then(rmzData => {
        console.log('rmzData:', rmzData);
        // Filter the rmzData here
        const maxTimePeriodID = Math.max(...rmzData.map(item => item.TimePeriodID));
        rmzData = rmzData.filter(item => item.TimePeriodID === maxTimePeriodID)

        /*  Metadata
        "MeasureID": 1378,
        "MeasureName": "Rat indexing in Rat Mitigation Zones (RMZs), Number of properties inspected",
        ---
        "MeasureID": 1379,
        "MeasureName": "Rat indexing in Rat Mitigation Zones (RMZs), Failed (any reason)",
        ---
        "MeasureID": 1380,
        "MeasureName": "Rat indexing in Rat Mitigation Zones (RMZs), Failed (active rat signs)",
        */
    })
    .catch(error => {
        console.error('Error:', error);
    });


//----------  
// Ray casting algorithm: this works, but we're not using it.
// https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
//----------  

function isMarkerInsidePolygon(marker, poly) {
    console.log('**isMarkerInsidePolygon**')
    var inside = false;
    var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
    for (var ii=0;ii<poly.getLatLngs().length;ii++){
        var polyPoints = poly.getLatLngs()[ii];
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }

    if (inside === true) {
        console.log('inside:', inside)
        return inside;
    }
};

//---------- 
// Point In Polygon: https://github.com/hayeswise/Leaflet.PointInPolygon
//---------- 

function originalPointInPolygon() {
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
}

/*
Note that geojson formats the points [lat, long], but pointInPolygon (and leaflet polygons) run on [long, lat].
Points/markers are also formatted [lat, long].
We run the polygons through `swapFirstAndSecond()` to reverse the order, so that we can use it to define polygons we can add to Leaflet. 
*/
