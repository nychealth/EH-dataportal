var current_spec;
var dt;
var fullTable;
var shortTable;
var locSelect = "No location"

d3.json("js/origSpec.json").then(data => {
    
    current_spec = $.extend({}, data);
    
}).then(() => {
    
    // ---- Loads the csv as an arquero table ---- //
    
    aq.loadCSV(
        "https://raw.githubusercontent.com/nychealth/realtime-air-quality/main/RT_flat.csv"
    ).then(data => {
        dt = data;
        
        fullTable = dt.objects(); // puts the data into fullTable to use. 
        shortTable = fullTable; // creating an array we'll slice for time-selection
        
        vegaEmbed("#vis2", current_spec).then((res) => {

            res.view.insert("lineData", fullTable).run()
            
        });
        
    });
});

var inputNum; // the number of days we want to select

// event listener on the time-selection form
document.getElementById('inputNum').addEventListener('change', function (event) {
    event.preventDefault();
    inputNum = document.getElementById('inputNum').value;
    updateChart(inputNum);
    
});


// ---- this function updates the chart based on timeselection ---- //

function updateChart(x) {
    
    var inputHours // hours in a day
    inputHours = x * 24;
    
    var startingPoint;
    startingPoint = fullTable.length - inputHours;
    // console.log('show chart for ' + inputHours + " hours");
    
    shortTable = fullTable.slice(startingPoint, fullTable.length)
    
    // inserts fullTable into the spec and draws the chart
    vegaEmbed("#vis2", current_spec).then((res) => {
        
        res.view.insert("lineData", shortTable).run()
        
    });
    
}

// ---- establish the spec that we'll manipulate and chart ---- //

// Grab the buttons for manipulation later
var buttons = document.querySelectorAll('.selectorbtn');
var buttons_orig = buttons;
var locSelect;
var color;

// Save the original locInfoBox & locInfoDesc
locInfoBox = document.getElementById('locInfoBox').outerHTML;
locInfoDesc = document.getElementById('locInfoDesc').innerHTML;

// this function updates the chart based on the location selection

function changeData(x) {
    
    // zoom to the corresponding leaflet marker
    map.setView(monitors[x].getLatLng(), 13);

    // open marker's popup
    monitors[x].openPopup();
    
    // create a color variable
    color = monitor_locations[x].Color;
    locSelect = monitor_locations[x].Location;
    
    // ensure `locInfoDesc` has original innerHTML elements
    
    document.getElementById('locInfoDesc').innerHTML = locInfoDesc
    
    // remove active class from buttons and add default class
    buttons.forEach(button => button.classList.remove('btn-secondary'))
    buttons.forEach(button => button.classList.add('btn-outline-secondary'))
    document.getElementById("btnrestore").classList.remove('btn-outline-secondary')
    
    // add active class for selected button and remove default class
    var btn = "btn" + x;
    document.getElementById(btn).classList.add('btn-secondary');
    document.getElementById(btn).classList.remove('btn-outline-secondary')
    document.getElementById("btnrestore").classList.remove('btn-secondary')
    
    // make all lines gray, thinner, and unmarked
    for (let i = 0; i < current_spec.layer.length; i++) {
        current_spec.layer[i].encoding.color.value = "lightgray"
        current_spec.layer[i].mark.strokeWidth = 1
        current_spec.layer[i].mark.point = false
    };
    
    // style the selected series
    current_spec.layer[x].encoding.color.value = color
    current_spec.layer[x].mark.strokeWidth = 2.5
    current_spec.layer[x].mark.point = true
    
    // redraw the chart
    vegaEmbed("#vis2", current_spec).then((res) => {
        
        res.view.insert("lineData", shortTable).run(); // shortTable is fullTable until updateChart is called
        
    });
    
    // show the summary box
    document.getElementById('locInfoBox').style.display = "block";
    
    // run getAverage
    getAverage();
    
}


var avTable; // creating an abridged data table
var selectedLoc;
var arqTable;

// Here, we'll calculate the most recent 24-hour average for a selected neighborhood.

function getAverage() {
    
    var startAt = fullTable.length - 24; // get a starting point of most recent 24 hours
    avTable = fullTable.slice(startAt, fullTable.length) // slicing the table to most recent 24 hours

    arqTable = aq.from(avTable);

    // ---- Filter by selected neighborhood ---- //

    // deriving a new column `new_col` for the parsed selected column. I want the parsed column to have the 
    //	selected column's name, so I'm creating a Map object which will rename "new_col" to the value of `locSelect`

    const new_col = new Map()

    new_col.set("new_col", locSelect)
    console.log("new_col:", new_col)

    // you can use an object that contains a variable name by enclosing the whole expression in back-ticks, then 
    //	using `${var}` to insert the value
    // described at https://uwdata.github.io/arquero/api/expressions#limitations

    arqTable = arqTable
        .derive({new_col: `d => aq.op.parse_float(d['${locSelect}'])`})
        .rename(new_col)
    
    console.log("arqTable (after parse_float and rename):")
    arqTable.slice(-24,).print(Infinity)
    
    // Count number of valid entries.
    valid_vals = aq.agg(arqTable, aq.op.valid(locSelect));
    console.log("valid_vals:", valid_vals)
    
    // ---- change info in locInfoBox depending on number of valid values ---- //

    if (valid_vals >= 18) {
        
        // If there are 18 or more valid values, average them

        avg_24 = aq.agg(arqTable, aq.op.mean(locSelect));
        
        // Print this value to 24av (NEED TO ROUND)
        
        document.getElementById('24av').innerHTML = avg_24.toFixed(1)
        
        if (avg_24 > 35) {

            // If this is above 35, print "above" to `comparison`
            
            document.getElementById('comparison').innerHTML = "above"
            document.getElementById('comparison').classList.remove('badge-custom-below')
            document.getElementById('comparison').classList.add('badge-custom-above')
            
            // That's not great!

            document.getElementById('goodBad').innerHTML = "That's not great!"
            document.getElementById('goodBad').classList.remove('badge-custom-below')
            document.getElementById('goodBad').classList.add('badge-custom-above')

            
        } else if (avg_24 <= 35) {
            
            // if less than 35, print "below" to `comparison`

            document.getElementById('comparison').innerHTML = "below"
            document.getElementById('comparison').classList.remove('badge-custom-above')
            document.getElementById('comparison').classList.add('badge-custom-below')
            
            // That's good!

            document.getElementById('goodBad').innerHTML = "That's good!"
            document.getElementById('goodBad').classList.remove('badge-custom-above')
            document.getElementById('goodBad').classList.add('badge-custom-below')
        
        }

    } else if (valid_vals < 18) {
        
        // If there are less than 18 valid values, print a 'no-value' message

        document.getElementById('locInfoDesc').innerHTML = "<p class=fs-sm><strong>No value:</strong> sometimes monitors go down or have other problems. We only produce average values if there are more than 18 hourly readings over the last 24 hours.</p>"

    }

    // Note - this may be easier with long version; location-selection buttons can apply a filter to the long file, which we can then pipe into the chart. 
    
}


// ---- function to reset zoom on click ---- //

function resetZoom() {
    map.setView(monitors_center, 11).fitBounds(monitors_bounds);
}

// ---- creating variables for leaflet objects ---- //

var map;
var monitors_group = L.featureGroup();
var monitors;
var monitors_center = L.Point();
var monitors_bounds = L.Bounds();
var monitor_locations;

d3.csv("data/monitor_locations.csv").then(data => {
    
    monitor_locations = data;
    
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
            changeData(i);
        });
        
    });

    monitors = monitors_group.getLayers();
    
    // getting the bounds of the markers
    
    monitors_bounds = monitors_group.getBounds();
    
    // now getting the center of the counds
    
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
    
});

// ---- restore defaults ---- //

function restore() {

    // chart vars
    
    locSelect = "No location";
    inputNum = [];
    color = [];
    
    // reset map zoom
    
    resetZoom();

    // close popups

    monitors.forEach(monitor => {monitor.closePopup()})
    
    // reset info box to be blank (like initial)

    document.getElementById('locInfoBox').outerHTML = locInfoBox;
    document.getElementById('inputNum').value = "";
    
    // remove active class from buttons and add default class

    buttons.forEach(button => button.classList.remove('btn-secondary'))
    buttons.forEach(button => button.classList.add('btn-outline-secondary'))     
    document.getElementById("btnrestore").classList.remove('btn-outline-secondary')

    var restore_spec;
    
    d3.json("js/origSpec.json")
    .then(data => {
        
        // create 1-time use spec
        restore_spec = $.extend({}, data);

        // reset current_spec to default
        current_spec = $.extend({}, data);
        
        // redraw the chart
        vegaEmbed("#vis2", restore_spec).then((res) => {
                
                res.view.insert("lineData", fullTable).run(); // shortTable is fullTable until updateChart is called
                
            });

        })
    }
    