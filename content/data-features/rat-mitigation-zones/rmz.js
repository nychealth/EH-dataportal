// ===== CREATE MAP ================================================== //
var name;
var id;
var ratData = [];
var rmzgeojson;
var geog;

var map = L.map('map').setView([40.7722226,-73.9638235],11); // [Lat,Long],Zoom
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 15,
    minZoom: 11
}).addTo(map);

L.control.scale({
    metric: false,
    position: 'bottomleft'
}).addTo(map)

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

// When style is run in const geojson, it returns these - default styles
function style(feature) {
    return {
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '1',
        fillOpacity: 0.2,
        fillColor: 'black'
    };
}

// ===== Fetch GeoJSON, add it to the map ================================================== //


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
        rmzgeojson = data; // Store the GeoJSON data in a global variable
          // console.log('GeoJSON data loaded:', rmzgeojson);
          resolve(); // Resolve the promise when the data is ready
          geog = L.geoJson(rmzgeojson,{
              style,
              onEachFeature
          }).addTo(map);
      })
      .catch(error => {
          console.error('Error fetching the GeoJSON file:', error);
          reject(error); // Reject the promise if there’s an error
      });
  });
}

getGeoJSON('https://raw.githubusercontent.com/nychealth/EHDP-data/refs/heads/production/geography/rmz.geojson')

       

// ===== Map styles ================================================== //

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        // mouseout: resetHighlight,
        click: zoomToFeature // Zooms on click.
    });
}

function resetHighlight(e) {
    geog.resetStyle(e.target);
}

function zoomToFeature(e) {
  // console.log('zoom to feature:'),
  // console.log(e)
  // console.log(rmzgeojson)
    geog.resetStyle()
    map.fitBounds(e.target.getBounds());
    id = e.target.feature.properties.OBJECTID
    // console.log('Filtering data for: ')
    // console.log('Name: ' + e.target.feature.properties.Label) 
    // console.log('ID: ', id)
    redrawChart(id)
    name = e.target.feature.properties.Label
    printToPage(id);
    interpretInitial(id)
    interpretCompliance(id)
    // The above gets id and name, puts them into global variables, for other selection display

    // this sets style on click (but it won't stick)

    const layer = e.target;
    layer.setStyle({ // Styles for hover-highlight
        weight: 3,
        color: 'black',
        dashArray: '5',
        fillOpacity: 0.7
    });

    layer.bringToFront();

}

function highlightFeature(e) {
    geog.resetStyle()
    // console.log('highlight feature:')
    // console.log(e)
    const layer = e.target;
    layer.setStyle({ // Styles for hover-highlight
        weight: 3,
        color: 'black',
        dashArray: '5',
        fillOpacity: 0.7
    });

layer.bringToFront();

}

// ===== PRINT INFO TO PAGE ================================================== //
function printToPage(x) {
    // console.log("id: " + x)
    document.getElementById('zoneName').innerHTML = name;

    const zoneData = ratData.filter(zone => zone.ID == x)
}

// update map and page from dropdown
function update(x) {
  // console.log('updated for: ', x)
  let zone = x - 1
  let layerzone = rmzgeojson.features[zone]

  var bounds = L.geoJSON(layerzone).getBounds()
  var center = bounds.getCenter()
  map.setView(center, 14)

  document.getElementById('zoneName').innerHTML = layerzone.properties.Label

  redrawChart(x)
  interpretInitial(x)
  interpretCompliance(x)
}

// ===== GET RECENT DATA (INITIAL, COMPLIANCE) ================================================== //
function interpretInitial(x) {
  // filter recent Initial Inspections data for this neighborhood
  thisRecent = recent.filter (y => y.zoneID == x)

  // get ARS fail number
  var ars = thisRecent.filter(y => y.Type === 'Active rat signs')
  var arsfail = ars[0].Number

  // get total inspections
  var entry = thisRecent.filter(y => y.Type === 'Initial inspections')
  var initial = entry[0].Number 

  // calculate percent
  var percent = 100 * arsfail / initial

  document.getElementById('failpercent').innerHTML = parseFloat(percent).toFixed(1)
  document.getElementById('interpret-1').classList.remove('hide')

}

function interpretCompliance(x) {
  thisCompliance = complianceRecent.filter(y => y.zoneID == x)
  console.log('recent data compliance:', thisCompliance)
  var comp = thisCompliance.filter(y => y.Type === 'Compliance inspections')
  var compI = comp[0].Number

  var ars = thisCompliance.filter(y => y.Type === 'Active rat signs')
  var arsfail = ars[0].Number

  var percent = 100 * arsfail / compI
  document.getElementById('failpercent2').innerHTML = parseFloat(percent).toFixed(1)
  document.getElementById('interpret-2').classList.remove('hide')

}

// REVISED 311 COMPLAINTS SPEC //
var revSpecOne = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "",
  "height": 250,
  "width": "container",
  "title": {
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 12,
    "font": "sans-serif",
    "baseline": "top",
    "dy": -10,
    "subtitleFontSize": 13
  },
  "config": {
    "view": {"stroke": null},
    "axisX": {
      "labelAngle": 0,
      "grid": false,
      "tickCount": {"interval": "month", "step": 1}
    },
    "axisY": {"tickCount": 2}
  },
  "data": {
    "url": "311-complaints.csv"
  },
  "transform": [{"filter": "datum.zoneID == '2'"}],
  "encoding": {
    "x": {
      "field": "Date",
      "type": "temporal",
      "title": "",
      "axis": {
        "values": [
          1656561600000,
          1672462800000,
          1688097600000,
          1703998800000,
          1719705600000,
          1735689600000,
          1751328000000,
            1767302400000
        ],
        "format": "%b %Y"
      },
      "scale": {
        "domainMin": 1650841000000,
        "domainMax": 1759276800000}
    },
    "y": {"field": "Number", "type": "quantitative", "title": ""},
    "color": {
      "condition": {
        "param": "hover",
        "field": "ComplaintType",
        "legend": false,
        "type": "nominal",
        "scale": {
          "domain": [
            "Rat sighting",
            "Mouse sighting",
            "Signs of rodents",
            "Condition attracting rodents"
          ],
          "range": ["#2b3fde", "#8670e6", "#82ad49", "#1d8f3f"]
        }
      },
      "value": "grey"
    },
    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.35}
  },
  "layer": [
    {
      "description": "Transparent layer to trigger hover more easily",
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["ComplaintType"],
            "on": "pointerover"
          }
        }
      ],
      "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
    },
    {
      "mark": {"type": "line", "point": {"size": 70}},
      "encoding": {
        "tooltip": [
          {"title": "Complaint:", "field": "ComplaintType"},
          {"title": "Complaints:", "field": "Number","format": ","},
          {"title": "For 6 months ending:", "field": "Date", "type": "temporal"}
        ]
      }
    },
    {
      "encoding": {
        "x": {"aggregate": "min", "field": "Date"},
        "y": {"aggregate": {"argmin": "Date"}, "field": "Number"},
        "text": {
          "condition": {
            "param": "hover",
            "field": "ComplaintType",
            "empty": false
          },
          "value": ""
        }
      },
      "layer": [
        {"mark": {"type": "circle"}},
        {
          "mark": {"type": "text", "align": "left", "dx": -4, "dy": -15,        "fontSize": 12,
        "fontWeight": "bold"},
          "encoding": {"text": {"field": "ComplaintType", "type": "nominal"}}
        }
      ]
    },
    {
      "mark": "rule",
      "encoding": {
        "x": {"datum": "1680403200000"},
        "xOffset": {"value": 0.5},
        "color": {"value": "red"},
        "size": {"value": 0.5}
      }
    }
  ]
}

// ===== INITIAL INSPECTIONS SPEC ================================================== //
var revSpecTwo = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "",
  "height": 250,
  "width": "container",
  "title": {
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 12,
    "font": "sans-serif",
    "baseline": "top",
    "dy": -10,
    "subtitleFontSize": 13
  },
  "config": {
    "view": {"stroke": null},
    "axisX": {
      "labelAngle": 0,
      "grid": false,
      "tickCount": {"interval": "month", "step": 1}
    },
    "axisY": {"tickCount": 2}
  },
  "data": {
    "url": "initial-inspections.csv"
  },
  "transform": [
    {"filter": "datum.zoneID=='2'"},
    {"filter": "datum.Type!='City agency'"},
    {"filter": "datum.Type!='Private property'"}
  ],
  "encoding": {
    "x": {
      "field": "Date",
      "type": "temporal",
      "title": "",
      "axis": {
        "values": [
          1656561600000,
          1672462800000,
          1688097600000,
          1703998800000,
          1719705600000,
          1735689600000,
          1751328000000
        ],
        "format": "%b %Y"
      },
      "scale": {
        "domainMin": 1650841000000,
        "domainMax": 1759276800000}
    },
    "y": {"field": "Number", "type": "quantitative", "title": ""},
    "color": {
      "condition": {
        "param": "hover",
        "field": "Type",
        "legend": false,
        "type": "nominal",
        "scale": {
          "domain": ["Initial inspections", "Failed (any reason)", "Active rat signs"],
          "range": ["#00008B", "#c73866", "#D77393"]
        }
      },
      "value": "grey"
    },
    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.35}
  },
  "layer": [
    {
      "description": "Transparent layer to trigger hover more easily",
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["Type"],
            "on": "pointerover"
          }
        }
      ],
      "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
    },
    {
      "mark": {"type": "line", "point": {"size": 70}},
      "encoding": {
        "tooltip": [
          {"title": "Type", "field": "Type"},
          {"title": "Number", "field": "Number","format": ","},
          {"title": "For 6 months ending:", "field": "Date", "type": "temporal"}
        ]
      }
    },
    {
      "encoding": {
        "x": {"aggregate": "min", "field": "Date"},
        "y": {"aggregate": {"argmin": "Date"}, "field": "Number"},
        "text": {
          "condition": {
            "param": "hover",
            "field": "Type",
            "empty": false
          },
          "value": ""
        }
      },
      "layer": [
        {"mark": {"type": "circle"}},
        {
          "mark": {"type": "text", "align": "left", "dx": -4, "dy": -15,        "fontSize": 12,
        "fontWeight": "bold"},
          "encoding": {"text": {"field": "Type", "type": "nominal"}}
        }
      ]
    },
    {
      "mark": "rule",
      "encoding": {
        "x": {"datum": "1680403200000"},
        "xOffset": {"value": 0.5},
        "color": {"value": "red"},
        "size": {"value": 0.5}
      }
    }
  ]
}

// ===== COMPLIANCE INSPECTIONS SPEC ================================================== //
var revSpecThree = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "",
  "height": 250,
  "width": "container",
  "title": {
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 12,
    "font": "sans-serif",
    "baseline": "top",
    "dy": -10,
    "subtitleFontSize": 13
  },
  "config": {
    "view": {"stroke": null},
    "axisX": {
      "labelAngle": 0,
      "grid": false,
      "tickCount": {"interval": "month", "step": 1}
    },
    "axisY": {"tickCount": 2}
  },
  "data": {
    "url": "compliance-inspections.csv"
  },
  "transform": [
    {"filter": "datum.zoneID=='2'"},
    {"filter": "datum.Type!='Passed'"},
  ],
  "encoding": {
    "x": {
      "field": "Date",
      "type": "temporal",
      "title": "",
      "axis": {
        "values": [
          1656561600000,
          1672462800000,
          1688097600000,
          1703998800000,
          1719705600000,
          1735689600000,
          1751328000000
        ],
        "format": "%b %Y"
      },
      "scale": {
        "domainMin": 1650841000000,
        "domainMax": 1759276800000}
    },
    "y": {"field": "Number", "type": "quantitative", "title": ""},
    "color": {
      "condition": {
        "param": "hover",
        "field": "Type",
        "legend": false,
        "type": "nominal",
        "scale": {
          "domain": ["Compliance inspections", "Failed (any reason), summons issued", "Active rat signs"],
          "range": ["#00008B", "#c73866", "#D77393"]
        }
      },
      "value": "grey"
    },
    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.35}
  },
  "layer": [
    {
      "description": "Transparent layer to trigger hover more easily",
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["Type"],
            "on": "pointerover"
          }
        }
      ],
      "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
    },
    {
      "mark": {"type": "line", "point": {"size": 70}},
      "encoding": {
        "tooltip": [
          {"title": "Type", "field": "Type"},
          {"title": "Number", "field": "Number","format": ","},
          {"title": "For 6 months ending:", "field": "Date", "type": "temporal"}
        ]
      }
    },
    {
      "encoding": {
        "x": {"aggregate": "min", "field": "Date"},
        "y": {"aggregate": {"argmin": "Date"}, "field": "Number"},
        "text": {
          "condition": {
            "param": "hover",
            "field": "Type",
            "empty": false
          },
          "value": ""
        }
      },
      "layer": [
        {"mark": {"type": "circle"}},
        {
          "mark": {"type": "text", "align": "left", "dx": -4, "dy": -15,        "fontSize": 12,
        "fontWeight": "bold"},
          "encoding": {"text": {"field": "Type", "type": "nominal"}}
        }
      ]
    },
    {
      "mark": "rule",
      "encoding": {
        "x": {"datum": "1680403200000"},
        "xOffset": {"value": 0.5},
        "color": {"value": "red"},
        "size": {"value": 0.5}
      }
    }
  ]
};

var specThree = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": "container",
  "height": "container",
  "title": {
    "text": "",
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 13,
    "font": "sans-serif",
    "baseline": "top",
    "dy": -10,
    "subtitleFontSize": 13
  },
  "config": {
    "view": {"stroke": null},
    "axisX": {"labelAngle": 0, "grid": false, "tickCount": {"interval": "month", "step": 6}},
    "axisY": {"tickCount": 3}
  },
  "data": {
    "url": "compliance-inspections.csv"
  },
  "transform": [
    {"filter": "datum.zoneID=='2'"},
    {"filter": "datum.Type!='Passed'"},
  ],
  "encoding": {
    "x": {
      "field": "Date",
      "type": "temporal",
      "title": "",
      "axis": {
        "values": [1656561600000,1672462800000,1688097600000,1703998800000,1719705600000,1735689600000,
          1751328000000],
        "format": "%b %Y"},
      "scale": {
        "domainMin": 1650841000000,
        "domainMax": 1759276800000}
    }
  },
  "layer": [
    {
      "encoding": {
        "color": {
          "field": "Type",
          "type": "nominal",
          "legend": null,
          "scale": {
            "domain": ["Compliance inspections", "Failed (any reason), summons issued", "Active rat signs"],
            "range": ["#00008B", "#c73866", "#D77393"]
          }
        },
        "y": {"field": "Number", "type": "quantitative", "title": ""}
      },
      "layer": [
          {"mark": {"type": "line", "point": {"size": 100}, "strokeWidth": 4}},
        {
          "transform": [{"filter": {"param": "hover", "empty": false}}],
          "mark": "point"
        },
        {
          "encoding": {
            "x": {"aggregate": "max", "field": "Date"},
            "y": {"aggregate": {"argmax": "Date"}, "field": "Number"}
          },
          "layer": [
            {"mark": {"type": "circle"}},
            {
              "mark": {"type": "text", "align": "left", "dx": 14},
              "encoding": {"text": {"field": "Type", "type": "nominal"}}
            }
          ]
        }
      ]
    },
    {
      "transform": [
        {"pivot": "Type", "value": "Number", "groupby": ["Date"]}
      ],
      "mark": "rule",
      "encoding": {
        "opacity": {
          "condition": {"value": 0.3, "param": "hover", "empty": false},
          "value": 0
        },
        "tooltip": [
          {"field": "Compliance inspections", "type": "quantitative"},
          {"field": "Failed (any reason), summons issued", "type": "quantitative"},
          {"field": "Active rat signs", "type": "quantitative","title": "Active rat signs"},
          {"field": "Date", "type": "temporal", "title": "For 6 months ending"}
        ]
      },
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["Date"],
            "nearest": true,
            "on": "pointerover",
            "clear": "pointerout"
          }
        }
      ]
    },{
      "mark": "rule",
      "encoding": {
        "x": {
          "datum": "1680403200000"          
          },
        "xOffset": {"value": 0.5},
        "color": {"value": "red"},
        "size": {"value": 2},
        "strokeDash": {"value": [2, 2]}
      }
    }
  ]
}

// ===== EXTERMINATOR SPEC ================================================== //
var revSpecFour = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "",
  "height": 250,
  "width": "container",
  "title": {
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 12,
    "font": "sans-serif",
    "baseline": "top",
    "dy": -10,
    "subtitleFontSize": 13
  },
  "config": {
    "view": {"stroke": null},
    "axisX": {
      "labelAngle": 0,
      "grid": false,
      "tickCount": {"interval": "month", "step": 1}
    },
    "axisY": {"tickCount": 2}
  },
  "data": {
    "url": "exterminator-visits.csv"
  },
  "transform": [
    {"filter": "datum.zoneID=='2'"}
  ],
  "encoding": {
    "x": {
      "field": "Date",
      "type": "temporal",
      "title": "",
      "axis": {
        "values": [
          1656561600000,
          1672462800000,
          1688097600000,
          1703998800000,
          1719705600000,
          1735689600000,
          1751328000000
        ],
        "format": "%b %Y"
      },
      "scale": {
        "domainMin": 1650841000000,
        "domainMax": 1759276800000}
    },
    "y": {"field": "Number", "type": "quantitative", "title": ""},
    "color": {
      "condition": {
        "param": "hover",
        "field": "Thing",
        "legend": false,
        "type": "nominal",
        "scale": {
          "domain": ["Exterminator visits", "Bait applied"],
          "range": ["#00008B", "#c73866"]
        }
      },
      "value": "grey"
    },
    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.35}
  },
  "layer": [
    {
      "description": "Transparent layer to trigger hover more easily",
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["Thing"],
            "on": "pointerover"
          }
        }
      ],
      "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
    },
    {
      "mark": {"type": "line", "point": {"size": 70}},
      "encoding": {
        "tooltip": [
          {"title": "Event", "field": "Thing"},
          {"title": "Number", "field": "Number","format": ","},
          {"title": "For 6 months ending:", "field": "Date", "type": "temporal"}
        ]
      }
    },
    {
      "encoding": {
        "x": {"aggregate": "min", "field": "Date"},
        "y": {"aggregate": {"argmin": "Date"}, "field": "Number"},
        "text": {
          "condition": {
            "param": "hover",
            "field": "Thing",
            "empty": false
          },
          "value": ""
        }
      },
      "layer": [
        {"mark": {"type": "circle"}},
        {
          "mark": {"type": "text", "align": "left", "dx": -4, "dy": -15,        "fontSize": 12,
        "fontWeight": "bold"},
          "encoding": {"text": {"field": "Thing", "type": "nominal"}}
        }
      ]
    },
    {
      "mark": "rule",
      "encoding": {
        "x": {"datum": "1680403200000"},
        "xOffset": {"value": 0.5},
        "color": {"value": "red"},
        "size": {"value": 0.5}
      }
    }
  ]
};


// ===== GET MOST RECENT DATA (INITIAL COMPLIANCE) ================================================== //

  var initialData = [];
  var recent = [];
  var thisRecent = [];
  d3.csv('initial-inspections.csv').then(data => {
    // ingest data
    initialData = data

    // get final date
    var finalPos = initialData.length - 1    
    var mostRecentDate = initialData[finalPos].Date

    // get data for final date installment
    recent = initialData.filter(x => x.Date === mostRecentDate)
  })

    //// ----- Get most recent data for Compliance Inspections ------ ////
  var complianceData = [];
  var complianceRecent = [];
  var thisCompliance = [];
  d3.csv('compliance-inspections.csv').then(data => {
    complianceData = data;
    var finalPosition = complianceData.length - 1
    var mostRecentDate = complianceData[finalPosition].Date
    complianceRecent = complianceData.filter(x => x.Date === mostRecentDate)
  })

  // ===== REDRAW CHARTS ON NEIGHBORHOOD SELECTION ================================================== //

function redrawChart(zoneID) {

  console.log('drawing chart for zone ', zoneID);

  if (zoneID == '4') {
    revSpecOne.layer[3].encoding.color.value = "red";
    revSpecTwo.layer[3].encoding.color.value = "red";
    revSpecThree.layer[3].encoding.color.value = "red";
    revSpecFour.layer[3].encoding.color.value = "red";
    const harlemNotes = document.querySelectorAll('.harlem-note');
    harlemNotes.forEach(note => {
        note.classList.remove('hide');
    });
  } else {
    revSpecOne.layer[3].encoding.color.value = "transparent";
    revSpecTwo.layer[3].encoding.color.value = "transparent";
    revSpecThree.layer[3].encoding.color.value = "transparent";
    revSpecFour.layer[3].encoding.color.value = "transparent";
    const harlemNotes = document.querySelectorAll('.harlem-note');
    harlemNotes.forEach(note => {
        note.classList.add('hide');
    });
  }


  revSpecOne.transform[0].filter = `datum.zoneID == '${zoneID}'`
  vegaEmbed("#vizOne", revSpecOne)

  revSpecTwo.transform[0].filter = `datum.zoneID == '${zoneID}'`
  vegaEmbed("#vizTwo", revSpecTwo)

  revSpecThree.transform[0].filter = `datum.zoneID == '${zoneID}'`
  vegaEmbed("#vizThree", revSpecThree)

  revSpecFour.transform[0].filter = `datum.zoneID == '${zoneID}'`
  vegaEmbed("#vizFour", revSpecFour)
}
