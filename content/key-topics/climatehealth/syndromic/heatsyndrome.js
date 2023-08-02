// Line chart spec

var spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "description": "Line chart of maximum daily temperature, and heat-related ED visits",
  "title": "",
  "width": "container",
  "config": {
    "bar": {"continuousBandSize": 1},
    "background": "#FFFFFF",
    "axisX": {
      "domain": true,
      "labels": true,
      "grid": false,
      "labelFontSize": 8,
      "tickColor": "#000000",
      "tickSize": 2,
      "titleFontSize": 12
    },
    "axisY": {
      "domain": false,
      "labelFlush": true,
      "labels": true,
      "grid": true,
      "ticks": false,
      "titleAngle": 0,
      "titleX": 20,
      "titleY": -10
    },
    "view": {"stroke": "transparent"}
  },
  "data": {
    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat2023_live.csv"
  },
  "vconcat": [
    {
      "width": "container",
      "height": 250,
      "mark": {
        "type": "line", 
        "tooltip": true,"interpolate": "monotone","point": {"filled": false, "fill": "white"}
    },
      "selection": {"brush": {"type": "interval", "encodings": ["x"]}},
      "encoding": {
        "y": {
          "field": "MAX_DAILY_TEMP",
          "type": "quantitative",
          "title": "Max daily temp",
          "scale": {"domain": [50, 110]},
          "axis": {
            "tickCount": 4,
            "labelExpr": "datum.value + '°F'"
          }
        },
        "x": {"field": "END_DATE", "type": "temporal", "title": ""},
        "color": {"value": "orange"},
        "tooltip": [
          {"field": "END_DATE", "title": "Date", "type": "temporal"},
          {"field": "MAX_DAILY_TEMP", "title": "Max daily temp (F)"},
          {"field": "HEAT_ED_VISIT_COUNT", "title": "Heat-related ED visits"}
        ]
      }
    },
    {
      "height": 250,
      "width": "container",
      "mark": {
        "type": "line", 
        "tooltip": true, 
        "strokeWidth":3,
        "interpolate": "monotone",
        "point": {"filled": false, "fill": "white"}
        },
      "encoding": {
        "y": {
          "field": "HEAT_ED_VISIT_COUNT",
          "type": "quantitative", 
          "title": "Heat ED visits",
          "axis": {
            "tickCount": 3
          }
        },
        "x": {
          "field": "END_DATE",
          "type": "temporal",
          "title": "",
          "scale": {
            "domain": {"selection": "brush"}
          }
        },
        "color": {"value": "darkred"},
        "tooltip": [
          {"field": "END_DATE", "title": "Date", "type": "temporal"},
          {"field": "HEAT_ED_VISIT_COUNT", "title": "Heat-related ED visits"},
          {"field": "MAX_DAILY_TEMP", "title": "Max daily temp (F)"}
        ]
      }
    }
  ]
}

// Initial embed of line chart
vegaEmbed('#vis1',spec)


// Scatterplot spec
var scatterplot = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Max daily temperature",
    "fontSize": 12,
    "align": "left",
    "anchor": "start"
  },
  "width": "container",
  "height": 500,
  "config": {
    "legend": {
      "orient": "right",
      "title": null,
      "labelFontSize": 16
    },
    "background": "#FFFFFF",
    "range": {
      "category": ['#ffffd4','#fee391','#fec44f','#fe9929','#d95f0e','#993404']
  },
  },
  "view": {"stroke": "transparent"},
  "data": {
    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/previous_years.csv"
  },
  "transform": [
    {"calculate": "year(datum.END_DATE)",
    "as": "Year"
    },
    {
      "filter": "datum.HEAT_ED_VISIT_COUNT > 0"
    }
  ],
  "mark": {
    "type": "point",
    "shape": "circle",
    "filled": true,
    "opacity": 0.2
    },
  "params": [
    {
      "name": "year",
      "select": {
        "type": "point",
        "fields": ["Year"],
        "on": "click"
      },
      "bind": "legend"
    },
    {
      "name": "hover",
      "value": "#7C7C7C",
      "select": { "type": "point", "on": "mouseover"}
    }
  ],
  "encoding": {
    "y": {
      "field": "MAX_DAILY_TEMP",
      "type": "quantitative",
      "scale": {"zero": false},
      "title": "",
      "axis": {
        "grid": true,
        "tickCount": 5,
        "labelExpr": "datum.value + '°F'"
      }
    },
    "x": {
      "field": "HEAT_ED_VISIT_COUNT",
      "type": "quantitative",
      "scale": {"zero": false},
      "title": "Heat-related ED visits",
      "axis": {
        "grid": false,
        "tickCount": 5
      }
    },
    "color": {"field": "Year", "type": "nominal"},
    "opacity": {
      "condition": {
        "param": "year",
        "empty": true,
        "value": 1
      },
      "value": 0.01
    },
    "stroke": {
      "condition": {
        "param": "hover",
        "empty": false,
        "value": "#3e3e3e"
      },
      "value": "#7C7C7C"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover",
        "empty": false,
        "value": 3
      },
      "value": 1
    },
    "size": {
      "condition": {
        "param": "hover",
        "empty": false,
        "value": 250
      },
      "value": 150
    },
    "tooltip": [
      {"field": "END_DATE", "type": "temporal","title": "Date"},
      {"field": "MAX_DAILY_TEMP", "type": "quantitative","title": "Maximum daily temperature"},
      {"field": "HEAT_ED_VISIT_COUNT", "type": "quantitative","title": "Number of heat-related ED visits"}    
    ]  
    }
}

// Initial embed of scatterplot
vegaEmbed('#vis2', scatterplot)


// Year change function powered by year buttons
function changeYear(x) {
  if (x == 2023) {
    spec.data.url = 'https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat2023_live.csv'
    vegaEmbed('#vis1', spec);
    document.getElementById('2023button').classList.add('btn-secondary')
    document.getElementById('2022button').classList.remove('btn-secondary')
    document.getElementById('2021button').classList.remove('btn-secondary')
    document.getElementById('2023button').classList.remove('btn-outline-secondary')
    document.getElementById('2022button').classList.add('btn-outline-secondary')
    document.getElementById('2021button').classList.add('btn-outline-secondary')
  } else if (x == 2022) {
    spec.data.url = 'https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat2022_live.csv'
    vegaEmbed('#vis1', spec);
    document.getElementById('2023button').classList.remove('btn-secondary')
    document.getElementById('2022button').classList.add('btn-secondary')
    document.getElementById('2021button').classList.remove('btn-secondary')
    document.getElementById('2023button').classList.add('btn-outline-secondary')
    document.getElementById('2022button').classList.remove('btn-outline-secondary')
    document.getElementById('2021button').classList.add('btn-outline-secondary')
  } else if (x == 2021) {
    spec.data.url = 'https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat2021_live.csv'
    vegaEmbed('#vis1', spec);
    document.getElementById('2023button').classList.remove('btn-secondary')
    document.getElementById('2022button').classList.remove('btn-secondary')
    document.getElementById('2021button').classList.add('btn-secondary')
    document.getElementById('2023button').classList.add('btn-outline-secondary')
    document.getElementById('2022button').classList.add('btn-outline-secondary')
    document.getElementById('2021button').classList.remove('btn-outline-secondary')
  } else {};
  document.getElementById('yearHeader').innerHTML = x
}
