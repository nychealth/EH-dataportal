//----------------------- CODE TO DEVELOP -----------------------//
/*
Here's how this works:
- Form submission -> Marker, point, lat/long
- Details -> Check to see if it's in NYC (isInNYC), and if so, checks county (checkCounty)

- Does it make sense to write a generalizeable function to test a point against an area? Or would that be harder to make sequential?

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

// Form submission handler
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

// Report if address is or is not in NYC
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

// If address is in NYC, check to see what county it is in:
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

// With county information check to see what Community District it's in:
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


async function checkRMZs(x) {
    console.log('You are in CD ' + x)
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

/*
    cdRMZOverlaps:
    - Manhattan: CDs 2, 3, 7, 9, 10, 11, 12
    - Bronx: CDs 1 3 4 5 7
    - Brooklyn: CDs 3, 4, 8
*/


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

function swapFirstAndSecond(arrays) {
    // Iterate over each sub-array
    return arrays.map(subArray => {
      // Swap the first and second elements
      return [subArray[1], subArray[0]];
    });
  }
  
  // Example usage:
  const inputArray = [
    [40.73132318800003, -73.98247017299997],
    [40.73135843700004, -73.98255770399999],
    [40.731419548000076, -73.98238769799997],
    [40.73150619300003, -73.98232423699994]
  ];
  
  const outputArray = swapFirstAndSecond(inputArray);
  // console.log(outputArray);

  // THIS IS THE POINT-IN-POLYGON CODE
/*
    Point-in-polygon requires polygons formatted as:
        [
            [long, lat],
            [long, lat],
            etc
        ]
    ...but runs with points formatted (lat, long)

*/
function pointInPolygon() {
    var polygon = L.polygon( // this is part of RMZ EV/Chinatown
        [
            [40.73132318800003, -73.98247017299997],
            [40.73135843700004, -73.98255770399999],
            [40.731419548000076, -73.98238769799997],
            [40.73150619300003, -73.98232423699994],
            [40.73199086400007, -73.98196923199998],
            [40.73203861700006, -73.98207584299996],
            [40.73270701000007, -73.98364739199997],
            [40.73304155900007, -73.98444206799996],
            [40.73338068000004, -73.98524341599995],
            [40.73398650000007, -73.98668122199996],
            [40.73466730700005, -73.98828741599993],
            [40.73535764600007, -73.98991831399996],
            [40.73528377000008, -73.98993480399997],
            [40.73520940900005, -73.98994694499999],
            [40.73513471100006, -73.98995471099994],
            [40.73505982200004, -73.98995808899997],
            [40.734984893000046, -73.98995707199998],
            [40.73491007400003, -73.98995166099996],
            [40.73444309400003, -73.98990437399993],
            [40.73353541800003, -73.98986993499994],
            [40.732764588000066, -73.99002828999994],
            [40.732004638000035, -73.99021332299998],
            [40.73129682700005, -73.99039151399995],
            [40.73174646200005, -73.99146112499994],
            [40.73117460100008, -73.99192211099995],
            [40.73059951500005, -73.99240904999994],
            [40.730040925000026, -73.99108111099997],
            [40.72988699000007, -73.99072671699997],
            [40.72974913400003, -73.99075869799998],
            [40.729150599000036, -73.99093194899996],
            [40.72857626900003, -73.99112397999994],
            [40.72779077300004, -73.99136010499996],
            [40.727568087000066, -73.99136529899994],
            [40.72756804100004, -73.99136531899995],
            [40.72709777500006, -73.99154974699997],
            [40.72709772800005, -73.99154976399996],
            [40.726399763000074, -73.99179521399998],
            [40.72639971600006, -73.99179522999998],
            [40.72565074700003, -73.99206308799995],
            [40.72565070100006, -73.99206310499994],
            [40.72523959400007, -73.99221113099998],
            [40.72523954800005, -73.99221114699998],
            [40.72491653600008, -73.99232784199995],
            [40.724916489000066, -73.99232785799995],
            [40.72420985800005, -73.99258129499998],
            [40.724209812000026, -73.99258131099998],
            [40.724144753000076, -73.99260464299994],
            [40.72414470700005, -73.99260465999998],
            [40.72406516800004, -73.99263396399994],
            [40.723600841000064, -73.99280504199999],
            [40.72282739900004, -73.99309000699998],
            [40.72236161200004, -73.99326056799998],
            [40.72163999400004, -73.99352439499995],
            [40.720944744000064, -73.99379668799997],
            [40.72033131200004, -73.99403640699995],
            [40.71952739000005, -73.99437887299996],
            [40.71939960000003, -73.99442259199998],
            [40.71846572700008, -73.99480920399998],
            [40.717287543000054, -73.99543017299999],
            [40.71760446400003, -73.99632861599997],
            [40.71787791700007, -73.99710964999997],
            [40.71816699200008, -73.99793191399993],
            [40.71845266200006, -73.99875392399997],
            [40.718688575000044, -73.99942471999998],
            [40.71802539500004, -73.99995762499998],
            [40.71762770200007, -74.00027585199996],
            [40.71693800800006, -74.00081984199994],
            [40.71639989500005, -74.00121228699999],
            [40.715752423000026, -74.00168447799996],
            [40.715751354000076, -74.00168526599998],
            [40.715167215000065, -74.00211597299995],
            [40.714795743000025, -74.00131510099999],
            [40.71476910600006, -74.00126057799997],
            [40.71451865300003, -74.00074793899995],
            [40.714373366000075, -74.00045608399995],
            [40.71437330400005, -74.00045607199996],
            [40.71327155400007, -74.00093316499994],
            [40.71327151000003, -74.00093319099994],
            [40.713023356000065, -74.00089255999995],
            [40.71170522400007, -74.00087421099994],
            [40.71170522700004, -74.00087417799995],
            [40.711576458000025, -74.00086923099997],
            [40.71144695500004, -74.00084103999995],
            [40.71132040700007, -74.00078942899995],
            [40.711200432000055, -74.00071551199994],
            [40.71109028300003, -74.00062166599997],
            [40.71099256800005, -74.00051127599994],
            [40.71079610100003, -74.00066508499998],
            [40.710682130000066, -74.00075430899994],
            [40.71048613000005, -74.00090775199999],
            [40.71036232900008, -74.00100466899994],
            [40.71018426300003, -74.00113788299996],
            [40.70985017000004, -74.00065548599997],
            [40.70946789800007, -74.00012459799996],
            [40.70877410200006, -73.99928276799994],
            [40.70886951800003, -73.99865262699996],
            [40.70892947300007, -73.99802073899997],
            [40.709212867000076, -73.99606275599996],
            [40.709290330000044, -73.99608388799999],
            [40.70952122500006, -73.99614688599996],
            [40.70958049400008, -73.99616305899997],
            [40.709782104000055, -73.99621806799996],
            [40.70986533400003, -73.99623890699996],
            [40.70991720300003, -73.99625189399995],
            [40.71022726700005, -73.99632952999997],
            [40.71024295800004, -73.99621244399998],
            [40.71029530200008, -73.99616536999998],
            [40.71048099100003, -73.99606267899995],
            [40.71066630200007, -73.99597313499995]
          ]
    ).addTo(map);
      var m1 = L.marker([40.7193178,-73.9915172]); // 53 Delancey- should return true for the RMZ above.
      m1.addTo(map)
      console.log(m1.getLatLng())
      console.log(polygon.contains(m1.getLatLng()));
}


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


