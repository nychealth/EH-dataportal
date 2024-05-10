// ---------- INITIALIZE: draw buttons and set up data source variables ---------- // 
    // Initialize by getting date and drawing buttons
    const today = new Date()
    const month   = today.getUTCMonth() + 1; // months from 1-12
    const day     = today.getUTCDate();
    const year    = today.getUTCFullYear();
    const date    = today.getDate();
    var allYears  = [];    
    var fileExists;
    var yearURL   = 'https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat' + year + '_live.csv'

function init() {

    // check if this year's URL exists, and if it does, draw this year's button
    UrlExists(yearURL)

    if (fileExists == true) {
      for (let i = year; i > 2016; i--) {
        allYears.push(i)
        changeYear(year)
      }
    } else {
      for (let i = year-1; i > 2016; i--) {
        allYears.push(i)
        var lastYear = year-1
        changeYear(lastYear)
      }
    }

    console.log(allYears)

    for (let i = 0; i < allYears.length; i++) {
      var oneYear = allYears[i]
      var btnID = oneYear + 'button'
      var yearButton = `<button class='btn btn-sm btn-outline-secondary yearButtons ml-1' id='${btnID}' onclick='changeYear(${oneYear})'>${oneYear}</button>`
      document.getElementById('yearButtonHolder').innerHTML += yearButton

      if (i == 0) {
        document.getElementById(btnID).classList.add('btn-secondary')
        document.getElementById(btnID).classList.remove('btn-outline-secondary')

      } else {}

    }

    // check if it's after September
    if (month > 8) {
      console.log('Updates have ended for the year.')
    }
}

function UrlExists(url) {
    console.log('checking ' + url)
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    if (http.status == 404 ) {
      fileExists = false
    } else {
      fileExists = true
    }
    console.log(fileExists)
    return http.status!=404;

}


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
      "titleAlign": "left",
      "titleY": -8
    },
    "view": {"stroke": "transparent"}
  },
  "data": {
    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/edheat2023_live.csv",
  "format": {"type":"csv", "parse":{"END_DATE": "date:'%Y-%m-%d'", "MAX_DAILY_TEMP":"number","HEAT_ED_VISIT_COUNT":"number"}} //format.parse -> END_DATE resolves UTC time issues

  },
  "transform": [
    {"calculate": "year(datum.END_DATE)", "as": "Year"},
    {"filter": "datum.Year == 2023"}
    ],
  "vconcat": [
    {
      "width": "container",
      "height": 250,
      "mark": {
        "type": "line",
        "tooltip": true,
        "interpolate": "monotone",
        "point": {"filled": false, "fill": "white"}
      },
      "selection": {"brush": {"type": "interval", "encodings": ["x"]}},
      "encoding": {
        "y": {
          "field": "MAX_DAILY_TEMP",
          "type": "quantitative",
          "title": "Maximum daily temp or heat index",
          "scale": {"domain": [50, 110]},
          "axis": {"tickCount": 4, "labelExpr": "datum.value + '°F'"}
        },
        "x": {
          "field": "END_DATE", 
          "type": "temporal", 
          "title": "",
          "format": "%m-%d"
          },
        "color": {"value": "orange"},
        "tooltip": [
          {"field": "END_DATE","title": "Date", "type": "temporal"},
          {"field": "MAX_DAILY_TEMP", "title": "Max daily temp (F)"},
          {"field": "HEAT_ED_VISIT_COUNT", "title": "Heat-related illness ED visits"}
        ]
      }
    },
    {
      "height": 250,
      "width": "container",
      "mark": {
        "type": "line",
        "tooltip": true,
        "strokeWidth": 3,
        "interpolate": "monotone",
        "point": {"filled": false, "fill": "white"}
      },
      "encoding": {
        "y": {
          "field": "HEAT_ED_VISIT_COUNT",
          "type": "quantitative",
          "title": "Heat-related illness ED visits",
          "axis": {"tickCount": 3}
        },
        "x": {
          "field": "END_DATE",
          "type": "temporal",
          "title": "",
          "scale": {
            "type": "utc",
            "domain": {"selection": "brush"}}
        },
        "color": {"value": "darkred"},
        "tooltip": [
          {"field": "END_DATE","title": "Date", "type": "temporal"},
          {"field": "HEAT_ED_VISIT_COUNT", "title": "Heat-related illness ED visits"},
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
    "text": "Heat-related illness ED visits",
    "fontSize": 12,
    "align": "left",
    "anchor": "start"
  },
  "width": "container",
  "height": 500,
  "config": {
    "legend": {"orient": "right", "title": null, "labelFontSize": 16},
    "background": "#FFFFFF",
    "range": {
      "category": [
        "#7fc97f",
        "#beaed4",
        "#fdc086",
        "#ffff99",
        "#386cb0",
        "#f0027f"
      ]
    }
  },
  "view": {"stroke": "transparent"},
  "data": {
    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/previous_years.csv"
  },
  "transform": [
    {"calculate": "year(datum.END_DATE)", "as": "Year"},
    {"filter": "datum.HEAT_ED_VISIT_COUNT > 0"}
  ],
  "mark": {"type": "point", "shape": "circle", "filled": true},
  "params": [
    {
      "name": "year",
      "select": {"type": "point", "fields": ["Year"], "on": "mouseover"},
      "bind": "legend"
    },
    {
      "name": "hover",
      "value": "#7C7C7C",
      "select": {"type": "point", "on": "mouseover"}
    }
  ],
  "encoding": {
    "x": {
      "field": "MAX_DAILY_TEMP",
      "type": "quantitative",
      "scale": {"zero": false},
      "title": "Maximum daily temp or heat index",
      "axis": {"grid": true, "tickCount": 5, "labelExpr": "datum.value + '°F'"}
    },
    "y": {
      "field": "HEAT_ED_VISIT_COUNT",
      "type": "quantitative",
      "scale": {"zero": false},
      "title": "",
      "axis": {"grid": false, "tickCount": 5}
    },
    "color": {"field": "Year", "title": "Year", "type": "nominal"},
    "opacity": {
      "condition": {"param": "year", "empty": true, "value": 1},
      "value": 0.15
    },
    "stroke": {
      "condition": {"param": "hover", "empty": false, "value": "#3e3e3e"},
      "value": "#7C7C7C"
    },
    "strokeWidth": {
      "condition": {"param": "hover", "empty": false, "value": 3},
      "value": 1
    },
    "size": {
      "condition": {"param": "hover", "empty": false, "value": 250},
      "value": 150
    },
    "tooltip": [
      {"field": "END_DATE", "type": "temporal", "title": "Date"},
      {
        "field": "MAX_DAILY_TEMP",
        "type": "quantitative",
        "title": "Maximum daily temperature"
      },
      {
        "field": "HEAT_ED_VISIT_COUNT",
        "type": "quantitative",
        "title": "Heat-related illness ED visits"
      }
    ]
  }
}

// Initial embed of scatterplot
vegaEmbed('#vis2', scatterplot)


// Year change function powered by year buttons
function changeYear(x) {
  spec.transform[1].filter = `datum.Year == ${x}`;

  if ( x == allYears[0]) {
    spec.data.url = yearURL
  }
  else {
    spec.data.url = 'https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/previous_years.csv'
  }
  document.getElementById('yearHeader').innerHTML = x;
  vegaEmbed('#vis1',spec);

  var buttons = document.querySelectorAll('.yearButtons')
  for (let i = 0; i < buttons.length; i ++ ) {
    buttons[i].classList.remove('btn-secondary')
    buttons[i].classList.add('btn-outline-secondary')
  }

  var buttonName = x + 'button'
  document.getElementById(buttonName).classList.add('btn-secondary')
  document.getElementById(buttonName).classList.remove('btn-outline-secondary')


}

var scatterCount = 0
function toggleScatter(x) {
  scatterCount = Number(scatterCount + 1)
  console.log(scatterCount)
  if ( scatterCount % 2 == 0) {
    console.log('even')
    document.getElementById('scattertoggle').innerHTML = 'Show time'
    vegaEmbed('#vis2', scatterplot)
  } else {
    console.log('odd')
    document.getElementById('scattertoggle').innerHTML = 'Show scatter'
    vegaEmbed('#vis2', scatterplotTwo)

  }
}



var scatterplotTwo = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Maximum daily temp or heat index",
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
      "category": [
        "#7fc97f",
        "#beaed4",
        "#fdc086",
        "#ffff99",
        "#386cb0",
        "#f0027f"
      ]
    }
  },
  "view": {"stroke": "transparent"},
  "data": {
    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/heat-syndrome/previous_years.csv"
  },
  "transform": [
    {"calculate": "year(datum.END_DATE)", "as": "Year"},
    {"calculate": "dayofyear(datum.END_DATE)", "as": "Day"},
    {"filter": "datum.HEAT_ED_VISIT_COUNT > 0"}
  ],
  "mark": {
    "type": "point", 
    "shape": "circle", 
    "filled": true,
    "opacity": 1
  },
  "params": [
    {
      "name": "year",
      "select": {"type": "point", "fields": ["Year"], "on": "mouseover"},
      "bind": "legend"
    },
    {
      "name": "hover",
      "value": "#7C7C7C",
      "select": {"type": "point", "on": "mouseover"}
    }
  ],
  "encoding": {
    "size": {
      "title": "Heat-related illness ED visits",
      "field": "HEAT_ED_VISIT_COUNT",
      "type": "quantitative",
      "legend": {"symbolFillColor": "white", "values": [10, 50, 100]},
      "scale": {"range": [10, 1500]}
    },
    "x": {
      "field": "END_DATE",
      "timeUnit": "dayofyear",
      "type": "temporal",
      "title": "Date",
      "axis": {"labelExpr": "[timeFormat(datum.value, '%-b %-d')]"}
    },
    "y": {
      "field": "MAX_DAILY_TEMP",
      "type": "quantitative",
      "scale": {"zero": false},
      "title": "",
      "axis": {"tickCount": 5, "labelExpr": "datum.value + '°F'"}
    },
    "color": {"field": "Year", "title": "Year", "type": "nominal"},
    "opacity": {
      "condition": {"param": "year", "empty": true, "value": 1},
      "value": 0.15
    },
    "stroke": {
      "condition": {"param": "hover", "empty": false, "value": "#3e3e3e"},
      "value": "#7C7C7C"
    },
    "strokeWidth": {
      "condition": {"param": "hover", "empty": false, "value": 3},
      "value": 1
    },
    "tooltip": [
      {"field": "END_DATE", "type": "temporal", "title": "Date"},
      {
        "field": "MAX_DAILY_TEMP",
        "type": "quantitative",
        "title": "Maximum daily temperature"
      },
      {
        "field": "HEAT_ED_VISIT_COUNT",
        "type": "quantitative",
        "title": "Heat-related illness ED visits"
      }
    ]
  }
}


init()