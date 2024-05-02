/* 
// ---- REALTIME AQ ---- //

CHOOSING DATA: Variable rtaqData is set in realtime.html template, determining whether this is local or live.

READING MONITORS: If a monitor is in the feed, it needs an entry in monitor_locations.csv; loc_col needs to equal SiteName in the datafeed.

USING DEC_AVG: This app excludes DEC_Avg from conventional functionality. monitors_group_noDEC sets the map bounds without the DEC Average monitor, which is given an abitrary off-coast lat/long. if (x != 'DEC_Avg') changes what happens to the map zoom on button click - just zooming to the initial extent if somebody selects the DEC_Avg option.

*/

// initialize variables (other variables are initialized closer to their prime use)
var current_spec;
var dt;
var fullTable;
var locSelect = "No location"
var res;
var floorDate;
var maxTime;
var maxTimeMinusDay;

 
// ---- INITIAL: ingest data feed ---- // 
aq.loadCSV(rtaqData).then(data => {

    dt = data
        .derive({starttime: d => op.parse_date(d.starttime)})
        .orderby("starttime");
    
    fullTable = dt.objects(); // puts the data into fullTable to use. 
    floorDate = new Date(fullTable[0].starttime) // creates earliest date in 7-day feed - used for time filter
    console.log('Showing data since: ' + floorDate)
    floorDate = Date.parse(floorDate) // converting to milliseconds

    // get most recent time
    var ftl = fullTable.length - 1
    maxTime = fullTable[ftl].starttime
    maxTime = Date.parse(maxTime)
    maxTimeMinusDay = maxTime - 86400000

    // console.log("fullTable:", fullTable);
    getStationsFromData();

    
});

// ---- Gets stations currently reporting data ---- // 
var stations = [];
function getStationsFromData() {
    var sites = [];
    for (let i = 0; i<fullTable.length; i++) {
        sites.push(fullTable[i].SiteName)
    }
    stations = [...new Set(sites)]

    // with stations in hand, load locations from data file
    loadMonitorLocations();
}

// ---- Creates list of active monitors and their metadata (lat/longs, colors, etc) and run other functions ---- //
var allMonitorLocations;
var activeMonitors = [];
function loadMonitorLocations() {
    d3.csv("data/monitor_locations.csv").then(data => {
        allMonitorLocations = data;
        for (let i = 0; i < allMonitorLocations.length; i++) {
            // if stations includes allMonitorLocations[i].loc_col, push allMonitorLocations[i] to activeMonitors
            if (stations.includes(allMonitorLocations[i].loc_col)) {
                activeMonitors.push(allMonitorLocations[i])
            }
        }
        // alphabetize activeMonitors for color coordination
        activeMonitors.sort(GetSortOrder("loc_col"))

        console.log('ACTIVE MONITORS:')
        console.table(activeMonitors)

        // Draws map, buttons, listener, and retrieves chart spec
        drawMap()
        drawCheckboxes();
        getSpec();
        getSpec2();
        printRecentAverage()
    })
}

//Comparer Function    
function GetSortOrder(prop) {    
    return function(a, b) {    
        if (a[prop] > b[prop]) {    
            return 1;    
        } else if (a[prop] < b[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
}  



// ---- Getting the initial chart spec, inserts color and  earliest date in the data feed to it ---- // 
var filter
function getSpec() {
    d3.json("js/spec.json").then(data => {
        current_spec = $.extend({}, data);
        current_spec.data.url = rtaqData

        // get floor date and filter by floor date:
        filter = `datum.starttime > ${floorDate}`
        current_spec.layer[0].transform[0] = {"filter": filter}
        current_spec.layer[2].encoding.x2.datum = maxTimeMinusDay
        // drawChart(current_spec)
    });
}



// ---- Creates buttons based on active monitors coming via the file ---- // 
var holder = document.getElementById('buttonHolder')




function drawCheckboxes() {
    console.log('drawing checkboxes...')

    for (let i = 0; i < activeMonitors.length; i++) {

        let tableCheckBox = 
                `
                <tr id="row-${activeMonitors[i].loc_col}">
                <th scope="row">
                    <input type="checkbox" id="${activeMonitors[i].loc_col}" name="${activeMonitors[i].loc_col}" value="${activeMonitors[i].Color}">
                    <label for="${activeMonitors[i].loc_col}"><span style="color: ${activeMonitors[i].Color};"><i class="fas fa-square mx-1"></i></span>${activeMonitors[i].Location}</label>
                    </th>
                <td id="value-${activeMonitors[i].loc_col}-1" class="hide">XXX µg/m<sup>3</sup></td>
                <td id="value-${activeMonitors[i].loc_col}-2">XXX µg/m<sup>3</sup></td>

                </tr>
                `
        
        document.getElementById('tableBody').innerHTML += tableCheckBox


    }

    listenBoxes()
}

//-- Event listener on checkboxes --//
var checkedSites = [];
var getChecked;
var boxes
function listenBoxes() {

    boxes = document.querySelectorAll('input[type=checkbox]');
    boxes.forEach(box => {
        box.addEventListener('click', (ev) => {

            // console.log(ev.target.checked, ev.target.name, ev.target.value);

            // create nodelist of all checked items
            getChecked = document.querySelectorAll('input[type=checkbox]:checked');

            checkedSites = []; // clear the array of checked items
            for (let i = 0; i < getChecked.length; i++) {
                var siteName = getChecked[i].name
                var siteColor = getChecked[i].value
                var thisSite = {
                    "siteName": `${siteName}`,
                    "color": `${siteColor}`
                }
                checkedSites.push(thisSite)
            }
        
            updateSpec()
          
        })
    })

}

function getCheckedSites() {
    getChecked = document.querySelectorAll('input[type=checkbox]:checked');

    checkedSites = []; // clear the array of checked items
    for (let i = 0; i < getChecked.length; i++) {
        var siteName = getChecked[i].name
        var siteColor = getChecked[i].value
        var thisSite = {
            "siteName": `${siteName}`,
            "color": `${siteColor}`
        }
        checkedSites.push(thisSite)
    }

    updateSpec()

}

var revisedSpecTwo = {};

function updateSpec() {
    // console.log('checked sites:')
    // console.table(checkedSites)

    revisedSpecTwo = specTwo
    revisedSpecTwo.layer.length = 3

    // loop through checkedSites and add them to revisedSpecTwo

    for (let i = 0; i < checkedSites.length; i++) {

        var template =  {
            "mark": {
              "type": "line",
              "interpolate": "monotone",
              "point": {"size": 20, "opacity": 0},
              "tooltip": true
            },
            "transform": [
              {"filter": `datum.SiteName === '${checkedSites[i].siteName}'`}
              ],
            "encoding": {
              "x": {
                "field": "starttime",
                "type": "temporal",
                "title": ""
              },
              "y": {
                "field": "Value",
                "type": "quantitative",
                "title": " "
              },
              "color": {
                "condition": [
                  {
                    "test": `datum.SiteName === '${checkedSites[i].siteName}'`, 
                    "value": `${checkedSites[i].color}`
                  }
                ]
              },
              "opacity": {"value": 0.7},
              "strokeWidth": {"value": 1.5},
              "tooltip": [
                {"field": "SiteName", "title": "Location"},
                {"field": "Value", "title": "PM2.5 (µg/m3)"},
                {
                  "field": "starttime",
                  "type": "temporal",
                  "title": "Time",
                  "timeUnit": "hoursminutes",
                  "format": "%I:%M %p"
                },
                {"field": "starttime", "type": "temporal", "title": "Date"}
              ]
            }
          }

        // push it to spec
        revisedSpecTwo.layer.push(template)

    }

    vegaEmbed('#vis',revisedSpecTwo)
}





// ---- UPDATE DATA FUNCTION TO DEVELOP: takes loc_col as an argument ---- // 
var opacity;
var stroke; 
var loc;
var locData = [];



function getIndex(x) {
    for (let i = 0; i < activeMonitors.length; i++) {
        if (activeMonitors[i].loc_col === x) {
            return i
        }
    } 
}


// ---- PRINT RECENT AVERAGE TO TABLE ---- //
function printRecentAverage() {
    console.log('print recent average running...')
    // original getRecentAverage ran based on loc_col being passed into it.
    // new printRecentAverage should loop through activeMonitors and print for each. 

    // first, creating convertData that has starttime in milliseconds 
    var convertData = []
    for (let i = 0; i < fullTable.length; i++) {
        convertData.push(fullTable[i])
        const date = new Date(convertData[i].starttime)
        let dateInMsec = Date.parse(date)
        convertData[i].starttime = dateInMsec
    }

    // console.log('convertData', convertData)

    // then, get the largest one
    var mostRecentTime = convertData[convertData.length - 1].starttime
    console.log('most recent time:', mostRecentTime)

    var startingTime = mostRecentTime - 86400000
    console.log('starting time:',startingTime)

    // then, filter everything over largest one minus 24 hours of milliseconds
    var last24HoursData = []
    for (let i = 0; i < convertData.length; i++) {
        if (convertData[i].starttime > startingTime) {
            last24HoursData.push(convertData[i])
        } else {}
    }

    console.log('last 24 hours:', last24HoursData)

    // get all names of active Monitors
    for (let i = 0; i < activeMonitors.length; i++) {
        console.log(activeMonitors[i].loc_col)

        // for each of those names, filter last 24 hours of data
        var thisLast = []
        thisLast = last24HoursData.filter(s => s.SiteName === activeMonitors[i].loc_col)
        // console.log('this last:', thisLast)

        // count if there are 17 entries
        if (thisLast.length > 17) {
            var average;
            var sum = []
            for (let i = 0; i < thisLast.length; i ++ ) {
                sum.push(thisLast[i].Value)
            }
    
            let totals = 0
            for (let i = 0; i < sum.length; i ++ ) {
                totals += sum[i]
            }
    
            average = totals / 24
            average = Math.round(average * 100) / 100
    
            console.log(activeMonitors[i].loc_col + ' average for this location over the last 24 hours: ' + average)
            var print = 'value-'+activeMonitors[i].loc_col+'-1'
            var print2 = 'value-'+activeMonitors[i].loc_col+'-2'
            document.getElementById(print).innerHTML = average 
            document.getElementById(print2).innerHTML = average 

        } else {
            console.log(activeMonitors[i].loc_col + " doesn't have enough data")
            var print = 'value-'+activeMonitors[i].loc_col+'-1'
            var print2 = 'value-'+activeMonitors[i].loc_col+'-2'

            document.getElementById(print).innerHTML = 0
            document.getElementById(print2).innerHTML = '*'        
        }
    }

    sortTable()

}


// ---- Create leaflet map ---- // 
var map;
var monitors_group = L.featureGroup();
var monitors_group_noDEC = L.featureGroup();
var monitors;
var monitors_center = L.Point();
var monitors_bounds = L.Bounds();
var monitor_locations;

// draw map fires when data and monitor_locations load:
function drawMap() {
    monitor_locations = activeMonitors
    
    // adding each monitor to the feature group
    
    monitor_locations.forEach((monitor, i) => {
        
        let this_icon = L.colorIcon({
            iconSize : [30, 30],
            popupAnchor : [0, -15],
            iconUrl: "images/map-marker.svg",
            color: color_convert.to_hex(monitor_locations[i].Color)
        });
        
        var this_monitor = 
            L.marker([monitor.Latitude, monitor.Longitude], {icon: this_icon, riseOnHover: true, riseOffset: 2000})
            // .bindTooltip(monitor.Location, {permanent: true, opacity: 0.85, interactive: true})
            .addTo(monitors_group)
        
        // create group without the DEC Monitor, which we'll use to set the center and bounds
        if (monitor.Location != "DEC Monitor Average") {
            var those_monitors = 
            L.marker([monitor.Latitude, monitor.Longitude], {icon: this_icon, riseOnHover: true, riseOffset: 2000})
            .bindTooltip(monitor.Location, {permanent: true, opacity: 0.85, interactive: true})
            .addTo(monitors_group_noDEC)
        }

        // setting tooltip mouseover rise-to-top

        var this_tooltip = this_monitor.getTooltip();
        

        // setting up zoom on click
        
        this_monitor.on('click', function (e) {
            map.setView(e.latlng, 13);
            updateData2(monitor_locations[i].loc_col)
        });
        
    });

    monitors = monitors_group.getLayers();

    // getting the bounds of the markers
    
    monitors_bounds = monitors_group_noDEC.getBounds();
    
    // now getting the center of the bounds
    
    monitors_center = monitors_bounds.getCenter();
    
    // initiating the map object 
    
    map = L.map('map').setView(monitors_center, 10).fitBounds(monitors_bounds);

    // adding a tile layer
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    // adding the monitor markers to the map
    
    monitors_group.addTo(map);

    // ---- easyButton to clear the markers and lines ---- //
    
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

// ---- function to reset zoom on click ---- //

function resetZoom() {
    map.setView(monitors_center, 11).fitBounds(monitors_bounds);
    // loop through rows and remove .table-highlight
    var rows = document.querySelectorAll('.table-highlight')
    rows.forEach(row => row.classList.remove('table-highlight'))

    var sites = document.querySelectorAll('input[type=checkbox]:checked');
    sites.forEach(site => site.checked = false)

    checkedSites = [];
    updateSpec();
}

// ---- function to reset on Restore ---- //

function restore() {
    resetZoom();

    getSpec();
    document.getElementById('inputNum').value = 7

    document.getElementById('averageBox').classList.add('hide')
    current_spec.layer[2].encoding.opacity.value = 0.0
    vegaEmbed('#vis2', current_spec)

    document.getElementById('dropdownMenuButton').innerHTML = 'Choose location'


}

// ---- TIME FILTER ---- //

// event listener on the time-selection form
document.getElementById('inputNum').addEventListener('change', function (event) {
    event.preventDefault();
    inputNum = document.getElementById('inputNum').value;
    if (inputNum > 7) {
        console.log('too large');
        $("#sevenModal").modal()
    } else {
        updateTime(inputNum)
    }

});

// Time update function - uses transform[0].filter
function updateTime(x) {
    var last = fullTable.pop()
    const date = new Date(last.starttime)
    let dateInMsec = Date.parse(date)
    // console.log('most recent date: ' + dateInMsec) // this is the most recent date, in milliseconds since 1970
    // console.log('filter for dates larger than: ') // you could be able to filter starttime
    // console.log(dateInMsec - x * 86400000)
    var filterTo = dateInMsec - x * 86400000

    // send date filter to spec and re-draw Chart
    filter = `datum.starttime > ${filterTo}`
    specTwo.transform[0] = {"filter": filter}

    // use filter to filter data file; update activeMonitors
    // use new activeMonitors to get updated colors array
    // send updated colors array to spec

    // console.log(current_spec)
    reDrawSpecTwo()
}




/// drawing spectwo

var filter2;
var specTwo;
function getSpec2() {
    d3.json("js/spec2.json").then(data => {
        specTwo = $.extend({}, data);
        specTwo.data.url = rtaqData


        // get floor date and filter by floor date:
        filter = `datum.starttime > ${floorDate}`
        specTwo.transform[0] = {"filter": filter}
        specTwo.layer[2].encoding.x2.datum = maxTimeMinusDay
        // drawChart(current_spec)

        reDrawSpecTwo()
    });
}

function reDrawSpecTwo(){
    vegaEmbed("#vis", specTwo)
}


function updateData2(x) {
    console.log('running update data 2 for ' + x)

    // look in active monitors for x.
    var thisLocation = activeMonitors.filter(loc => loc.loc_col === x)

    var thisLoc = document.getElementById(thisLocation[0].loc_col)
    thisLoc.checked = true

    // loop through rows and remove .table-highlight
    var rows = document.querySelectorAll('.table-highlight')
    rows.forEach(row => row.classList.remove('table-highlight'))

    // add table row highlight...?
    var row = 'row-'+x
    document.getElementById(row).classList.add('table-highlight')

    // get all checked sites and update spec:
    getCheckedSites()

}



function sortTable() {
    console.log('sort table running')
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("table24");
    switching = true;
    // Make a loop that will continue until no switching has been done:*/
    while (switching) {
      //start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      // Loop through all table rows (except the first, which contains table headers):*/
      for (i = 1; i < (rows.length - 1); i++) {
        //start by saying there should be no switching:
        shouldSwitch = false;
        // Get the two elements you want to compare, one from current row and one from the next:*/
        x = rows[i].getElementsByTagName("td")[0];
        y = rows[i + 1].getElementsByTagName("td")[0];
        // check if the two rows should switch place:
        if (Number(x.innerHTML) < Number(y.innerHTML)) {
          // if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        // If a switch has been marked, make the switch and mark that a switch has been done:*/
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }