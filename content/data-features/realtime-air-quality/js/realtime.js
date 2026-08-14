/* 
// ---- REALTIME AQ ---- //

CHOOSING DATA: Variable rtaqData is set in realtime.html template, determining whether this is local or live.

READING MONITORS: If a monitor is in the feed, it needs an entry in monitor_locations.csv; loc_col needs to equal SiteName in the datafeed.

NULL HANDLING: in getStationsFromData, we get unique times and join that to the data for each station, getting dataWithNulls that has null values rather than no rows for each monitor-x-starttime. This creates interrupted lines when there are no readings.

USING DEC_AVG: This app excludes DEC_Avg from conventional functionality. monitors_group_noDEC sets the map bounds without the DEC Average monitor, which is given an abitrary off-coast lat/long. if (x != 'DEC_Avg') changes what happens to the map zoom on button click - just zooming to the initial extent if somebody selects the DEC_Avg option.


/*
IF HAMILTON BRIDGE ISN'T IN THE ACTIVE LOCATIONS,
THEN, ADD A UNIQUE PIN
*/

// ADDING A NOTE


// initialize variables (other variables are initialized closer to their prime use)
var rtaqData = 'https://raw.githubusercontent.com/nychealth/nyccas-data/refs/heads/main/portal/view.csv'
var current_spec;
var dt;
var times;
var fullTable;
var locSelect = "No location"
var res;
var floorDate;
var maxTime;
var maxTimeMinusDay;
var filter;
var stations = [];
var allMonitorLocations;
var activeMonitors = [];
var chosenSite;
var getChecked;
var boxes;
var revisedSpecTwo = {};
var opacity;
var stroke; 
var loc;
var locData = [];
var values = [];
var max;
var filter2;
var specTwo;
var ftl;
var dataWithNulls = aq.table();
var chartStart // takes either floorDate or filtered date
var myView;


// ---- INITIAL: ingest data feed ---- // 
aq.loadCSV(rtaqData).then(data => {
    
    dt = data
        .derive({starttime: d => op.parse_date(d.starttime)})
        .orderby("starttime")
        .print()
    
    fullTable = dt.objects();                       // puts the data into fullTable to use. 
    floorDate = new Date(fullTable[0].starttime)    // creates earliest date in 7-day feed - used for time filter
    console.log('Showing data since: ' + floorDate)
    floorDate = Date.parse(floorDate)               // converting to milliseconds
    chartStart = floorDate
    
    // get most recent time
    ftl = fullTable.length - 1
    maxTime = fullTable[ftl].starttime
    maxTime = Date.parse(maxTime)
    maxTimeMinusDay = maxTime - 86400000
    
    // console.log("fullTable:", fullTable);
    getStationsFromData();
    
});

// ---- NEXT: GET STATIONS REPORTING DATA & begin Null handling ---- // 

function getStationsFromData() {

    var sites = [];

    for (let i = 0; i<fullTable.length; i++) {
        sites.push(fullTable[i].SiteName)
    }
    stations = [...new Set(sites)]
    
    // Null Handling
    times = dt.select('starttime','timeofday').dedupe('starttime') // creats an arquero table of only times
    
    var accumulatedRows = [];
    for (let i = 0; i < stations.length; i++) {
        
        if (i == 0 ) {
            times = dt
            .select('starttime','timeofday')
            .dedupe('starttime')
            .derive({ SiteName: aq.escape(stations[i])})
            
            var thisStation = dt.filter(aq.escape(d => d.SiteName === stations[i]))      // for this station, get data
            thisStation = thisStation.select(aq.not('SiteName','Operator','timeofday'))  // drop the other cols but starttime and Value              
            
            var thisStationFull = times.join_full(thisStation, 'starttime')             // join to times
            
            dataWithNulls = thisStationFull; // sets up initial table
            
        } else {
            times = dt
            .select('starttime','timeofday')
            .dedupe('starttime')
            .derive({ SiteName: aq.escape(stations[i])})
            
            
            var thisStation = dt.filter(aq.escape(d => d.SiteName === stations[i]))      // for this station, get data
            thisStation = thisStation.select(aq.not('SiteName','Operator','timeofday'))  // drop the other cols but starttime and Value              
            
            var thisStationFull = times.join_full(thisStation, 'starttime')             // join to times
            
            // put thisStationFull into one table
            dataWithNulls = dataWithNulls.concat(thisStationFull); // adds subsequent loops to the fll table
        }
        
    }
    
    // with stations, load locations from data file
    loadMonitorLocations();
}

let colors = [
    "#e41a1c",  // strong red
    "#377eb8",  // medium blue
    "#4daf4a",  // medium green
    "#984ea3",  // purple
    "#ff7f00",  // orange
    "#dca936",  // golden yellow
    "#a65628",  // brown
    "#f781bf",  // pink
    "#66c2a5",  // teal
    "#fc8d62",  // salmon
    "#1fbfc3",  // cyan (replacing light blue)
    "#c85a9f",  // magenta
    "#6ba54a",  // darker lime green
    "#b15928"   // dark brown/rust
];


// ---- LOAD LOCATIONS: Creates list of active monitors and their metadata (lat/longs, colors, etc) ---- //
function loadMonitorLocations() {

    d3.csv("https://raw.githubusercontent.com/nychealth/nyccas-data/refs/heads/main/portal/station-new.csv").then(data => {
        allMonitorLocations = data;
        
        // assign .Color to each item in allMonitorLocations, from colors
        for (let i = 0; i < allMonitorLocations.length; i++) {
            
            // make DEC gray, else, assign color from colors array
            if (allMonitorLocations[i].loc_col === 'DEC_Avg') {
                console.log('We are making DEC gray')
                allMonitorLocations[i].Color = '#999999'
            } else {
                allMonitorLocations[i].Color = colors[i % colors.length];
                
            }
            
        }
        
        
        // make DEC gray. #999999
        
        console.log('all monitor locations:')
        console.log(allMonitorLocations)
        
        for (let i = 0; i < allMonitorLocations.length; i++) {
            // if stations includes allMonitorLocations[i].loc_col, push to activeMonitors
            if (stations.includes(allMonitorLocations[i].loc_col)) {
                activeMonitors.push(allMonitorLocations[i]);
            }
        }
        
        // alphabetize activeMonitors for color coordination
        activeMonitors.sort(GetSortOrder("loc_col"));
        console.log('active Monitors:')
        console.log(activeMonitors)
        
        // Draw page
        drawMap();
        drawCheckboxes();
        renderSpec(dataWithNulls.objects());
        printRecentAverage();

    });
}

// ---- DRAW CHECKBOXES, table, and box listener ---- //

function drawCheckboxes() {
    // console.log('drawing checkboxes...')
    
    for (let i = 0; i < activeMonitors.length; i++) {
        
        let tableCheckBox = 
        `
                <tr id="row-${activeMonitors[i].loc_col}" class="location-row lineLabel" data-loc="${activeMonitors[i].loc_col}" data-color="${activeMonitors[i].Color}">
                  <th scope="row">
                    <span style="color: ${activeMonitors[i].Color};"><i class="fas fa-square mx-1"></i></span>${activeMonitors[i].Location}
                  </th>
                <td id="value-${activeMonitors[i].loc_col}-1" class="hide">
                  Invisible column with all values - for sorting
                </td>
                <td>
                    <div id="value-${activeMonitors[i].loc_col}-2" style="background-color:lightblue;width:0%;" class="pr-1 my-1 barchart">
                    </div>
                </td>
        
                </tr>
                `
        
        document.getElementById('tableBody').innerHTML += tableCheckBox
        
    }
    
    listenTable()
    
}


function listenTable() {
    var rows = document.querySelectorAll('.location-row')
    
    rows.forEach(row => {
        
        row.addEventListener('click',(e) => {
            // console.log('table listener:')
            // console.log(e.currentTarget)
            
            // remove previous active classes, add Active to clicked item
            rows.forEach(row => {
                row.classList.remove('row-active')
                row.classList.remove('table-highlight')
            })
            
            e.currentTarget.classList.add('table-highlight')
            
            chosenSite = {
                "siteName": e.currentTarget.dataset.loc,
                "color"   : e.currentTarget.dataset.color
            }
            
            // send to zoom to
            zoomTo(e.currentTarget.dataset.loc)
            
            // pass chosenSite into renderSpec for use in highlighted layer
            renderSpec(dataWithNulls, chosenSite)
            
        })
    })
}

function zoomTo(locationColumn) {
    console.log('Zooming to ' + locationColumn + ' from table click')
    
    // filter activeMonitors to locationColumn
    const thisLocation = activeMonitors.filter((loc) => loc.loc_col === locationColumn)
    
    console.log('this location:', thisLocation, thisLocation[0].Latitude, thisLocation[0].Longitude)
    
    // map zoom to lat/long.
    map.setView([thisLocation[0].Latitude, thisLocation[0].Longitude],13)
    
}


// ---- PRINT RECENT AVERAGE TO TABLE ---- //

function printRecentAverage() {
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
    var startingTime = mostRecentTime - 86400000
    
    // then, filter everything over largest one minus 24 hours of milliseconds
    var last24HoursData = []
    for (let i = 0; i < convertData.length; i++) {
        if (convertData[i].starttime > startingTime) {
            last24HoursData.push(convertData[i])
        } else {}
    }
    
    // first, loop through and get values, and get max value
    for (let i = 0; i < activeMonitors.length; i++) {
        var thisLast = []
        thisLast = last24HoursData.filter(s => s.SiteName === activeMonitors[i].loc_col)
        
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
            
            values.push(average)
        }
    }
    
    // get max value
    max = Math.max(...values)
    var maxWidth = max * 1
    
    // get all names of active Monitors
    for (let i = 0; i < activeMonitors.length; i++) {
        // console.log(activeMonitors[i].loc_col)
        
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
            
            values.push(average)
            
            // console.log(activeMonitors[i].loc_col + ' average for this location over the last 24 hours: ' + average)
            var print = 'value-'+activeMonitors[i].loc_col+'-1'
            var print2 = 'value-'+activeMonitors[i].loc_col+'-2'
            document.getElementById(print).innerHTML = average 
            document.getElementById(print2).innerHTML = Math.round(average) // round to integer
            
            if (average > 35 ) {
                document.getElementById('exceeds').classList.remove('hide')
                document.getElementById('allUnder').classList.add('hide')
                document.getElementById(print2).innerHTML += '<i class="fas fa-exclamation-circle ml-1" style="color:red">'
            }
            
            var cont = 'value-' + activeMonitors[i].loc_col + '-2';
            var widthPercent = 100 * Math.round(average)  / maxWidth
            document.getElementById(cont).style.width = widthPercent + "%"
            
        } else {
            // console.log(activeMonitors[i].loc_col + " doesn't have enough data")
            var print = 'value-'+activeMonitors[i].loc_col+'-1'
            var print2 = 'value-'+activeMonitors[i].loc_col+'-2'
            
            document.getElementById(print).innerHTML = 0
            document.getElementById(print2).innerHTML = '*'    
            
            var cont = 'value-' + activeMonitors[i].loc_col + '-2';
            document.getElementById(cont).style.backgroundColor = "white";
            document.getElementById('insufficient').classList.remove('hide')
            
        }
    }
    
    sortTable()
}


// --------------------------------------- CREATE LEAFLET MAP ---- // 
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
                .bindPopup(monitor.Location, {permanent: true, opacity: 0.85, interactive: true})
                .addTo(monitors_group)
        
        // create group without the DEC Monitor, which we'll use to set the center and bounds
        if (monitor.Location != "DEC Monitor Average") {

            var those_monitors = 
                L.marker([monitor.Latitude, monitor.Longitude], {icon: this_icon, riseOnHover: true, riseOffset: 2000})
                    .bindTooltip(monitor.Location, {permanent: false, opacity: 0.85, interactive: true})
                    .addTo(monitors_group_noDEC)

        }
        
        // setting tooltip mouseover rise-to-top
        
        var this_tooltip = this_monitor.getTooltip();
        
        
        // setting up zoom on click
        
        this_monitor.on('click', function (e) {
            map.setView(e.latlng, 13);
            updateData(monitor_locations[i].loc_col)
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
    
    // if Hamilton Bridge isn't reporting, add the marker anyway
    if (!stations.includes('Hamilton Bridge')) {drawHamiltonBridge()} 
    
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

// ---- reset zoom on click ---- //

function resetZoom() {
    map.setView(monitors_center, 11).fitBounds(monitors_bounds);
    
    var rows = document.querySelectorAll('.location-row')
    rows.forEach(row => row.classList.remove('row-active'))
    rows.forEach(row => row.classList.remove('table-highlight'))
    
    chosenSite = undefined;
    renderSpec(dataWithNulls,null)
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
    var filterTo = dateInMsec - x * 86400000
    
    chartStart = filterTo                   
    
    renderSpec(dataWithNulls, chosenSite)
    
}


// ---- Update data based on map click ---- // 
function updateData(x) {
    // look in active monitors for x.
    console.log('updating data for ', x)
    var thisLocation = activeMonitors.filter(mon => mon.loc_col === x)
    
    console.log(thisLocation)
    
    chosenSite = {
        "siteName": thisLocation[0].loc_col,
        "color":    thisLocation[0].Color
    }
    
    // loop through rows and remove .table-highlight
    var rows = document.querySelectorAll('.location-row')
    rows.forEach(row => row.classList.remove('row-active'))
    rows.forEach(row => row.classList.remove('table-highlight'))
    
    // add table row highlight...?
    var row = 'row-'+x
    document.getElementById(row).classList.add('table-highlight')
    
    renderSpec(dataWithNulls, chosenSite)
    
    // scroll chart into view (for mobile)
    document.getElementById('vis').scrollIntoView();
    
}

// -- DRAW HAMILTON BRIDGE ---- //
function drawHamiltonBridge() {
    console.log('Hamilton Bridge not reporting. Drawing point anyway')
    const hamiltonBridgeLocation = allMonitorLocations.filter(item => item.Location === 'Hamilton Bridge');
    
    let this_icon = L.colorIcon({
        iconSize : [30, 30],
        popupAnchor : [0, -15],
        iconUrl: "images/map-marker.svg",
        color: color_convert.to_hex(hamiltonBridgeLocation[0].Color)
    });
    
    var this_monitor = 
    L.marker([hamiltonBridgeLocation[0].Latitude, hamiltonBridgeLocation[0].Longitude], {icon: this_icon, riseOnHover: true, riseOffset: 2000})
    .bindPopup(`Hamilton Bridge`) // Add a popup with the location name
    .addTo(map)
}


// --- SORT TABLE FUNCTION ---- //
/*
Note: relies on an invisible column of just values. Values displayed as * are given a 0 in this column. 
*/
function sortTable() {
    // console.log('sort table running')
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

// Comparer Function - used later    
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


// ---- RENDER CHART SPEC ---- // 
async function renderSpec(
    data,
    site
) { 
    
    let chartSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "PM2.5 in micrograms per cubic meter",
        "data": {
            "values": data,
            "format": {
                "parse": {
                    "Value": "number"
                }
            }
        },
        "config": {
            "legend": {"disable": true},
            "background": "#ffffff00",
            "axisX": {
                "grid": false, "ticks": true, "labels": true,
                "offset": 0,
                "domainDashOffset": 30,
                "labelAlign": "center",
                "labelExpr": "[timeFormat(datum.value, '%H') == 0 ? timeFormat(datum.value, '%b %e') : timeFormat(datum.value, '%-I %p')]",
                "labelPadding": 4,
                "labelOverlap": "parity",
                "tickSize": {
                    "condition": {
                        "test": {"field": "value", "timeUnit": "hours", "equal": 0},
                        "value": 15
                    },
                    "value": 9
                },
                "tickWidth": {
                    "condition": {
                        "test": {"field": "value", "timeUnit": "hours", "equal": 0},
                        "value": 1.25
                    },
                    "value": 0.5
                }
            },
            "axisY": {"domain": false, "ticks": false, "gridDash": [2], "gridWidth": 1,"offset": 10},
            "view": {"stroke": "transparent"}
        },
        "height": "container",
        "width": "container",
        "transform": [{"filter": `datum.starttime > ${chartStart}`}],
        "layer": [
            {
                "mark": {
                    "type": "line",
                    "tooltip": false
                },
                "encoding": {
                    "x": {"field": "starttime", "type": "temporal", "title": ""},
                    "y": {"field": "Value", "type": "quantitative", "title": " "},
                    "color": {
                        "condition": {
                            "test": "datum.SiteName === locFilter",
                            "value": {"signal": "colorlabel"}
                        },
                        "field": "SiteName",
                        "type": "nominal",
                        "scale": {"range": ["lightgray"]}
                    },
                    
                    "strokeWidth": {
                        "condition": {
                            "test": "datum.SiteName === locFilter",
                            "value": 2
                        },
                        "value": 0.5
                    }
                }
            },
            
            {
                "mark": "rule",
                "encoding": {
                    "y": {"datum": 35},
                    "color": {"value": "red"},
                    "size": {"value": 2},
                    "strokeDash": {"value": [2, 2]}
                }
            }
        ]
    }
    
    // if checked, layer:
    
    if ( site != null) {
        console.log('drawing chart with selected sites', site.siteName, site.color)
        var checkedLayer =     // needs sitename and color inserted, see below. 
        {
            "mark": {
                "type": "line",
                "interpolate": "monotone",
                "point": {"size": 20, "opacity": 0},
                "tooltip": true
            },
            "transform": [
                {"filter": `datum.SiteName === '${site.siteName}'`},
                {"calculate": "datum.Value + ' µg/m3'", "as": "ValueWithText"}
            ],
            "encoding": {
                "x": {"field": "starttime", "type": "temporal", "title": ""},
                "y": {"field": "Value", "type": "quantitative", "title": " "},
                "color": {"value": `${site.color}`},
                "opacity": {"value": 0.7},
                "strokeWidth": {"value": 1.5},
                "tooltip": [
                    {"field": "SiteName", "title": "Location"},
                    {"field": "ValueWithText", "title": "PM2.5"},
                    {
                        "field": "starttime",
                        "type": "temporal",
                        "title": "Time (EST)",
                        "timeUnit": "hoursminutes",
                        "format": "%I:%M %p"
                    },
                    {"field": "starttime", "type": "temporal", "title": "Date"}
                ]
            }
        }
        
        chartSpec.layer.push(checkedLayer)
        
    } else {
        var checkedLayer
        console.log('No selected sites')
    }
    
    
    // vega-Lite spec
    // console.log('vega-lite spec:')
    // console.log(chartSpec)
    
    // compile chartSpec to vega
    const vegaSpec = vegaLite.compile(chartSpec).spec;
    
    const colorSignal = {
        "name": "colorlabel",
        "value": "lightgray",
        "on": [
            {
                "events": ".lineLabel:mouseenter",
                "update": "event.currentTarget.dataset.color",
                "force":  true
            }
        ]
    }
    
    const locSignal =  {
        "name": "locFilter", 
        "value": "",
        "on": [
            {
                "events": ".lineLabel:mouseenter",
                "update": "event.currentTarget.dataset.loc",
                "force": true
            }
        ]
    }
    
    vegaSpec.signals.push(colorSignal)
    vegaSpec.signals.push(locSignal)
    
    const textSignal = {
        "name": "textlabel",
        "value": "BQE",
        "on": [
            {
                "events": ".lineLabel:mouseenter",
                "update": "event.currentTarget.dataset.loc",
                "force":  true
            }
        ]
    }
    
    const textMark =  {
        "type": "text",
        "encode": {
            "enter": {
                "x": {"value": 0},
                "y": {"value": 20}
            },
            "update": {
                "text": {"signal": "textlabel"}
            }
        }
    }
    
    
    
    // vegaSpec.signals.push(textSignal)
    // vegaSpec.marks.push(textMark)
    
    // console.log('vega spec:')
    // console.log(vegaSpec)
    
    
    vegaEmbed('#vis',vegaSpec).then(res => {
        myView = res.view // save the vega view 
        // console.log('myView, vega with marks pushed:')
        // console.log(myView)
    })
}
