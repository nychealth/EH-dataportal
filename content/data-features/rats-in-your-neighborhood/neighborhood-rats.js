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
var success = false;
var isRMZ = false;
var thisArea = []
var mapLayers = []
var mapMarkers = []
var cdData = {};
var rmzData = {};
var marbleHill;

var nycMap;
var locationDetails;
var thisCD;
var thisBBL;

/*
REVISIONS, SCOPE:
1: Add RMZs to map; add legend
2: in the checkPointInRMZ function, replace what happens if it's a yes
3: Create If RMZ = Yes output: an additional card? 

*/

//----------------------------------------
// INITIALIZE NYC-MAP LIBRARY 
//---------------------------------------- 
function initializeNYCLIB() {
    nycMap = new nyc.ol.FrameworkMap({
        mapTarget: '#nycMap',
        searchTarget: '#map-search1',
        geoclientUrl: 'https://maps.nyc.gov/geoclient/v1/search.json?app_key=74DF5DB1D7320A9A2&app_id=nyc-lib-example'
    });

    document.addEventListener("DOMContentLoaded", function() {
        var searchButton = document.querySelector('.btn.btn-srch');
    
        // Check if the button exists to avoid errors
        if (searchButton) {
            searchButton.onclick = function() {
                setTimeout(geocode,2500)
            };
        }

        // add event listener to form
        document.querySelector('#map-search1').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                console.log('***Form submitted')
                setTimeout(geocode,2500)
            }
        });
    });
}

initializeNYCLIB();


//----------------------------------------
// INITIALIZE LEAFLET MAP 
//---------------------------------------- 
const leafletMap = L.map('leafletMap').setView([40.7722226,-73.9638235],11);

// Add  tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 15,
    minZoom: 11
}).addTo(leafletMap);

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
}).addTo(leafletMap);     

function resetZoom() {
    // console.log('reset zoom 3')
    window.location.hash = '#top'
    location.reload()
}

//----------------------------------------
// GEOCODE THROUGH NYC-MAP 
//---------------------------------------- 
function geocode() {
    console.log('***Geocoding')
    document.getElementById('status').innerHTML = 'Getting data...'
    if (nycMap.location.type === 'geocoded') {
        console.log('- location found. Details:') // get data...
        locationDetails = nycMap.location
        console.log(locationDetails)

        /*
            Data to use:
                nycMap.location.name                    sentence name
                nycMap.location.data.latitude           to put into Leaflet
                nycMap.location.data.longitude          to put into Leaflet
                nycMap.location.data.bbl                BBL for passing into open data api?
                nycMap.location.data.communityDistrict  Community District
        */

        thisCD  = nycMap.location.data.communityDistrict
        thisBBL = nycMap.location.data.bbl

        // place marker on leaflet map
        addMarker(nycMap.location.data.latitude,nycMap.location.data.longitude,nycMap.location.name)

        // get property data
        getPropertyData(thisBBL)

    } else {
        console.log('***Location not found :( ')
    }
}

//----------------------------------------
// TAKE INPUTS FROM NYC-MAP AND ADD TO LEAFLET 
//---------------------------------------- 
function addMarker(lat,long,locationName) {
    // Remove prior markers
    mapMarkers.forEach(marker => map.removeLayer(marker))

    console.log('- adding marker...')

    // set icon
    let this_icon = L.colorIcon({
        iconSize : [30, 30],
        popupAnchor : [0, -15],
        iconUrl: "images/map-marker.svg",
        color: 'darkgray'
    });

    // add marker
    var marker = L.marker([lat,long],{icon: this_icon}).addTo(leafletMap);
    marker.bindPopup(locationName)
    .openPopup();
    mapMarkers.push(marker)

    leafletMap.setView([lat, long], 13);

    // check if this point is in RMZs
    checkPointInRMZ(lat,long)

}


//----------------------------------------
// CHECKS IF POINT IS IN RMZ 
//---------------------------------------- 
async function checkPointInRMZ(lat,long) {
    console.log('***Checking if location is in RMZ')
    await getGeoJSON(RMZgeojson)

    inputLatLong = [lat,long]

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
                        console.log('- this address is RMZ ', geojsonData.features[i].properties.Label)
                        getRMZIndicatorData(geojsonData.features[i].id)
                        isRMZ = true
                        mapLayers.forEach(layer => map.removeLayer(layer)) // remove previous layers
                        area.addTo(leafletMap) // add RMZ layer
                        break; // stop the loop
                    }
                }
            }
        } 
        // and nested polygons
        else if (geojsonData.features[i].geometry.type === "Polygon") {
            for (let j = 0; j < geojsonData.features[i].geometry.coordinates.length; j++) {
                thisArea = geojsonData.features[i].geometry.coordinates[j];
                thisArea     = swapFirstAndSecond(thisArea)
                let area     = L.polygon(thisArea)
                let location = L.marker(inputLatLong)
                if (area.contains(location.getLatLng())) {
                    console.log('- this address is RMZ ', geojsonData.features[i].properties)
                    getRMZIndicatorData(geojsonData.features[i].id)
                    isRMZ = true
                    area.addTo(leafletMap)
                    break; // stop the loop
                }     
            }
        }
    }

    if (isRMZ === false) {
        console.log('- not in an RMZ.')
        showParentCD(lat,long)
    }

}

//----------------------------------------
// IF NO RMZ, SHOW PARENT CD ON MAP
//---------------------------------------- 
async function showParentCD(lat,long) {
    // get CD geojson
    await getGeoJSON(CDgeojson)

    // filter for geocoded CD
    const thisCDArea = {
        type: "FeatureCollection",
        features: geojsonData.features.filter(feature => feature.properties.boro_cd === thisCD),
      };
    
    // Add to map
    const CDlayer = L.geoJSON(thisCDArea).addTo(leafletMap)

    // get data for CD
    getCDIndicatorData(thisCD)
}

//----------------------------------------
// GET RMZ INDICATOR DATA 
//---------------------------------------- 

var RMZIndicatorData;
function getRMZIndicatorData(x) {
    console.log('***Getting indicator data for RMZ ', x)
    const URL = 'https://raw.githubusercontent.com/nychealth/EHDP-data/refs/heads/production/indicators/data/2433.json';
    
    // passes geoID into function

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

                // FILTER FOR THIS RMZ
                RMZIndicatorData = reformattedData.filter(item => item.GeoID === x) // 
                console.log('- RMZIndicatorData:', RMZIndicatorData);
                printRMZData(RMZIndicatorData);
                resolve(reformattedData); // Resolve promise 
            })
            .catch(error => {
                console.error('Error fetching the Indicator data:', error);
                reject(error); // Reject the promise if there’s an error
            });
    });
    
}

//----------------------------------------
// GET CD INDICATOR DATA 
//---------------------------------------- 

var CDIndicatorData;
function getCDIndicatorData(x) {
    console.log('***Getting CD Indicator data for ', x)

    const URL = 'https://raw.githubusercontent.com/nychealth/EHDP-data/refs/heads/production/indicators/data/2434.json';
        // passes geoID into function

        return new Promise((resolve, reject) => {
            fetch(URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json(); // Parse data
                })
                .then(data => {
                    // Get the keys and length of data
                    const keys = Object.keys(data);
                    const dataLength = data[keys[0]].length;

                    // Restructure the data
                    const restructuredData = [];
                    for (let i = 0; i < dataLength; i++) {
                        const record = {};
                        keys.forEach(key => {
                            record[key] = data[key][i];
                        });
                        restructuredData.push(record);
                    }
    
                    // FILTER FOR COMMUINTY DISTRICTS, and THIS CD
                    CDIndicatorData = restructuredData.filter(item => item.GeoType === 'CD') 
                    CDIndicatorData = CDIndicatorData.filter(item => item.GeoID == x)

                    console.log('- CDIndicatorData:',CDIndicatorData);
                    printCDData(CDIndicatorData);
                    resolve(); // Resolve promise 
                })
                .catch(error => {
                    console.error('Error fetching the Indicator data:', error);
                    reject(error); // Reject the promise if there’s an error
                });
        });
}

//----------------------------------------
// GET PROPERTY INSPECTION DATA 
//---------------------------------------- 

var propertyData;
async function getPropertyData(x) {

    var openDataSource = 'https://data.cityofnewyork.us/resource/a2h9-9z38.json?bbl=' + x

    return new Promise((resolve, reject) => {
        // Fetch the GeoJSON data
        fetch(openDataSource)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse data
        })
        .then(data => {
            propertyData = data; // Store  data in a global variable
            console.log('***Getting property data')
            console.log(propertyData)
            printPropertyData(propertyData)
            resolve(); // Resolve the promise when the data is ready
        })
        .catch(error => {
            console.error('Error fetching the data file:', error);
            reject(error); // Reject the promise if there’s an error
        });
    });

}



//----------------------------------------
// PRINT DATA FUNCTIONS 
//---------------------------------------- 

//----------
// Print RMZ data

function printRMZData(data) {
    console.log('- Printing RMZ data to page.')

    document.getElementById('cdOutput').classList.add('hide')
    document.getElementById('rmzOutput').classList.remove('hide')

    // Find the max TimePeriodID, and filter for it
    const maxTimePeriodID = Math.max(...data.map(item => item.TimePeriodID));
    const mostRecentData = data.filter(item => item.TimePeriodID === maxTimePeriodID);

    console.log(mostRecentData);

    document.getElementById('rmzProp').innerHTML = mostRecentData
        .filter(item => item.MeasureID === 1378)
        .map(item => item.DisplayValue);
    const ars = mostRecentData
        .filter(item => item.MeasureID === 1380)
        .map(item => item.DisplayValue);
    document.getElementById('rmzARS').innerHTML = ars + '%'

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
}

//----------
// Print CD data

function printCDData(data) {
    console.log('- Printing CD data to page.')

    document.getElementById('cdOutput').classList.remove('hide')
    document.getElementById('rmzOutput').classList.add('hide')

    document.getElementById('cdID').innerHTML = 'Community District ' + thisCD;

    // Find the max TimePeriodID, and filter for it
    const maxTimePeriodID = Math.max(...data.map(item => item.TimePeriodID));
    const mostRecentData = data.filter(item => item.TimePeriodID === maxTimePeriodID);


    const inspected = mostRecentData
        .filter(item => item.MeasureID === 1381)
        .map(item => item.DisplayValue);

    document.getElementById('cdProp').innerHTML = inspected + '%'

    const failed = mostRecentData
        .filter(item => item.MeasureID === 1383)
        .map(item => item.DisplayValue);

    document.getElementById('cdFail').innerHTML = failed + '%'

    var ratActivity;
    if (failed > 20) {
        ratActivity = 'high'
    } else if (failed < 5) {
        ratActivity = 'low'
    } else {
        ratActivity = 'moderate'
    }

    document.getElementById('activityValue').innerHTML = ratActivity

    const ratClass = ratActivity + '-activity'
    document.getElementById('activityValue').classList.add(ratClass)

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
}

//----------
// Print property data to page
function printPropertyData(data) {
    console.log("- printing property data")
    document.getElementById('propertyOutput').classList.remove('hide')
    document.getElementById('noOutput').classList.add('hide')

    // convert date
    data.forEach(property => {
        property.approved_date = new Date(property.approved_date);
    });

    // filter for last 5 years
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const recentInspections = propertyData.filter(property => property.approved_date >= fiveYearsAgo);
    console.log(recentInspections);

    document.getElementById('numOfInspections').innerHTML = recentInspections.length + ' time' + (recentInspections.length != 1 ? 's' : '')

    // Get most recent inspection
    const mostRecentInspection = propertyData.reduce((latest, property) => {
        return property.approved_date > latest.approved_date ? property : latest;
    }, propertyData[0]); // Start with the first item as the initial "latest"
    
    // Format date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const mostRecentDate = mostRecentInspection.approved_date.toLocaleDateString('en-US', options)
    document.getElementById('mostRecentInspection').innerHTML = mostRecentDate

    // Print result
    const resultClass = (mostRecentInspection.result === 'Passed' ? 'passed-fill' : 'failed-fill')
    document.getElementById('result').classList.add(resultClass)
    document.getElementById('result').innerHTML = (mostRecentInspection.result === 'Passed' ? 'passed' : 'failed')
    
    
}


//----------------------------------------
// OTHER HELPER FUNCTIONS 
//---------------------------------------- 

// retrieves geoJSON files

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
            // console.log('GeoJSON data loaded.');
            resolve(); // Resolve the promise when the data is ready
        })
        .catch(error => {
            console.error('Error fetching the GeoJSON file:', error);
            reject(error); // Reject the promise if there’s an error
        });
    });
}

// Point re-formatter

function swapFirstAndSecond(arrays) {
    // Iterate over each sub-array
    return arrays.map(subArray => {
      // Swap the first and second elements
      return [subArray[1], subArray[0]];
    });
  }
  







