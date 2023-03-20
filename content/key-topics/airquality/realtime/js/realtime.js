/*
// ---- REALTIME AQ ---- //
This app is built to be durable to monitors coming online and offline. If a monitor is in the datafeed, it will need an entry in monitor_locations.csv. In that file, loc_col will need to equal SiteName in the datafeed. 

*/


// initialize variables (other variables are initialized closer to their prime use)
var current_spec;
var dt;
var fullTable;
var locSelect = "No location"
var res;
var floorDate;


// ---- INITIAL: ingest data feed ---- // 
aq.loadCSV(
     "data/nyccas_realtime_DEC.csv" // temporary local placeholder
     // "https://azdohv2staticweb.blob.core.windows.net/$web/nyccas_realtime_DEC.csv" // actual live data feed. Also update this in spec json.

).then(data => {

    dt = data
        .derive({starttime: d => op.parse_date(d.starttime)})
        .orderby("starttime");
    
    fullTable = dt.objects(); // puts the data into fullTable to use. 
    floorDate = new Date(fullTable[0].starttime) // creates earliest date in 7-day feed - used for time filter
    console.log('Showing data since: ' + floorDate)
    floorDate = Date.parse(floorDate) // converting to milliseconds
    
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
        // Draws map, buttons, listener, and retrieves chart spec
        drawMap()
        drawButtons()
        listenButtons();
        getSpec();
    })
}




// ---- Getting the initial chart spec, inserts color and  earliest date in the data feed to it ---- // 
var filter
function getSpec() {
    d3.json("js/spec.json").then(data => {
        current_spec = $.extend({}, data);
        getColors(); // gets colors from monitor_locations and inserts them into spec

        // get floor date and filter by floor date:
        filter = `datum.starttime > ${floorDate}`
        current_spec.transform[0] = {"filter": filter}
        drawChart(current_spec)
    });
}

// ---- DRAWS CHART! ---- //
function drawChart(spec) {
    vegaEmbed("#vis2", spec)
}

// ---- Create array of colors based on colors in activeMonitors. This gets sent to the json spec ---- //
var colors = [];
function getColors() {
    for (let i = 0; i < activeMonitors.length; i++) {
        colors.push(activeMonitors[i].Color)
    }
    current_spec.encoding.color.scale.range = colors
}


// ---- Creates buttons based on active monitors coming via the file ---- // 
var holder = document.getElementById('buttonHolder')
var btns;
function drawButtons() {
    var button = 'hi :) '
    for (let i = 0; i < activeMonitors.length; i++) {
        button = `<button type="button" id="${activeMonitors[i].loc_col}" class="mb-1 ml-1 selectorbtn btn btn-sm btn-outline-secondary no-underline">
        <span style="color: ${activeMonitors[i].Color};">
            <i class="fas fa-square mr-1"></i>
        </span>
        ${activeMonitors[i].Location}
    </button>`
        holder.innerHTML += button;
    };
    btns = document.querySelectorAll('.selectorbtn')

}

// ---- Event listener on the buttons runs updateData and passes in the button's id (loc_col) ---- // 
function listenButtons() {
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            updateData(btn.id)
        })
    })

}

// ---- UPDATE DATA FUNCTION TO DEVELOP: takes loc_col as an argument ---- // 
var opacity;
var stroke; 
function updateData(x) {
    // document to console:
    console.log('Showing data for: ' + x)

    // /remove active classes, and highilght selected
    btns.forEach(x => {
        x.classList.remove('active') // remove from all 
    })
    document.getElementById(x).classList.add('active')

    // find index of where x = activeMonitors.loc_col
    var index = getIndex(x)

    // zoom to the corresponding leaflet marker
    map.setView(monitors[index].getLatLng(), 13);

    // update opacity for selected and deselected series, and redraw Chart:
    opacity = {
        "condition": {
              "test": "datum['SiteName'] === 'CCNY'",
              "value": 1
            },
          "value": 0.2
        }
    stroke = {
        "condition": {
              "test": "datum['SiteName'] === 'CCNY'",
              "value": 2.5
            },
          "value": 1
        }

    current_spec.encoding.opacity = opacity
    current_spec.encoding.opacity.condition.test = `datum['SiteName'] === '${x}'`
    current_spec.encoding.strokeWidth = stroke
    current_spec.encoding.strokeWidth.condition.test = `datum['SiteName'] === '${x}'`
    vegaEmbed('#vis2', current_spec)


}

function getIndex(x) {
    for (let i = 0; i < activeMonitors.length; i++) {
        if (activeMonitors[i].loc_col === x) {
            return i
        }
    } 
}



// ---- Create leaflet map ---- // 
var map;
var monitors_group = L.featureGroup();
var monitors;
var monitors_center = L.Point();
var monitors_bounds = L.Bounds();
var monitor_locations;

// draw map fires when data and monitor_locations load:
function drawMap() {
    monitor_locations = activeMonitors;
    
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
            .bindTooltip(monitor.Location, {permanent: true, opacity: 0.85, interactive: true})
            .addTo(monitors_group)

        // setting tooltip mouseover rise-to-top

        var this_tooltip = this_monitor.getTooltip();
        
        this_monitor.on('mouseover', function (e) {

            this_tooltip._container.style.borderColor = color_convert.to_hex(monitor_locations[i].Color);
            this_tooltip.bringToFront();
            this_tooltip.setOpacity(1.0);
        });

        this_monitor.on('mouseout', function (e) {

            this_tooltip.setOpacity(0.85);
            this_tooltip._container.style.borderColor = "";

        });

        // setting up zoom on click
        
        this_monitor.on('click', function (e) {
            map.setView(e.latlng, 13);
            updateData(monitor_locations[i].loc_col)
        });
        
    });

    monitors = monitors_group.getLayers();
    
    // getting the bounds of the markers
    
    monitors_bounds = monitors_group.getBounds();
    
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
}

// ---- function to reset on Restore ---- //

function restore() {
    resetZoom();
    btns.forEach(x => {
        x.classList.remove('active') // remove from all 
    })
    getSpec();
    document.getElementById('inputNum').value = 7

}

// ---- TIME FILTER ---- //

// event listener on the time-selection form
document.getElementById('inputNum').addEventListener('change', function (event) {
    event.preventDefault();
    inputNum = document.getElementById('inputNum').value;
    updateTime(inputNum)
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
    current_spec.transform[0] = {"filter": filter}
    // console.log(current_spec)
    drawChart(current_spec)
}