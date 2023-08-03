
// set year default
var year = '2011' 

// set gray overlay defaults:
var lower = 1277956800000 // 2010.5
var mid = 1293840000000 // value for 2011
var upper = 1309492800000 // 2011.5; one year: 31536000000; 1/2 year: 15768000000

// changeYear runs on button click
function changeYear(x) {
    year = Number(year);
    year = year + x
    document.getElementById('2020note').innerHTML = ''

    // run interactions
    if (year < 2011) {
    year = 2011
    } else if (year == 2011) {
    document.getElementById('downButton').disabled = true
    } else if (year > 2020) {
    year = 2020
    } else if (year == 2020) {
    document.getElementById('upButton').disabled = true
    document.getElementById('2020note').innerHTML = 'Data for 2020 are through 3/31/2020 only.'
    } else {
    document.getElementById('downButton').disabled = false
    document.getElementById('upButton').disabled = false
    }
    console.log('year is:' + year)
    document.getElementById('year').innerHTML = year
    document.getElementById('year2').innerHTML = year
    document.getElementById('year3').innerHTML = year
    year = year.toString()
    spec.transform[0].filter = `datum.Time == ${year}` // update spec with chosen year
    vegaEmbed("#map", spec) // re-run map
    updateValues(year)

    // get date for overlay
    var date = year + '/01/01'
    date = Math.floor(new Date(date).getTime())
    console.log(date)
    lower = date - 15768000000
    upper = date + 15768000000
    line.layer[1].encoding.x.datum = lower;
    line.layer[1].encoding.x2.datum = upper;
    vegaEmbed('#lineVis', line)

}

// ingest data for filtering and page printing
var fullData = [];
var partData = [];
var uhfData = [];
var cityValue = [];
d3.csv('resto-data-full.csv').then(data => {
    fullData = data;
    // console.log(fullData)
    updateValues(year)
})

// updateValues runs on button click, and updates page-printed values
function updateValues(x) {
    // console.log('to filter for:' + x)
    partData = fullData.filter(row => row.Time == year)
    // console.log(partData)

    // get Citywide Value
    cityValue = partData.filter(row => row.GeoTypeDesc == 'Citywide')
    document.getElementById('citywide').innerHTML = cityValue[0].Percent + '%'

    // get lowest value
    const lowValue = partData.reduce(
    (acc, loc) =>
        acc.Percent < loc.Percent
        ? acc
        : loc
    )
    document.getElementById('lowest').innerHTML = lowValue.Percent + "%"

    // get highest value
    const highValue = partData.reduce(
    (acc, loc) => 
        acc.Percent > loc.Percent
        ? acc
        : loc
    )
    document.getElementById('highest').innerHTML = highValue.Percent + "%"

    // get median
    uhfData = partData.filter(row => row.GeoTypeDesc == 'UHF 42')
    // console.log('uhf data:')
    // console.log(uhfData)
    var valuesArray = [];
    for (let i = 0; i < uhfData.length; i++) {
    valuesArray.push(uhfData[i].Percent);
    }

    valuesArray.sort(function(a,b) {
    return a - b;
    })
    // console.log(valuesArray)
    valuesArray.splice(0,20) // remove first 21 values
    // document.getElementById('median').innerHTML = valuesArray[0] + '%'
}


// initial chart spec, updated and re-printed on year change
var spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": "container",
    "data": {
    "url": "resto-data-full.csv",
    "format": {
        "type": "csv",
        "parse": {
        "Value": "number"
        }
    }
    },
    "transform": [
    {"filter": `datum.Time == ${year}`},
    {"filter": "datum.GeoTypeDesc === 'UHF 42'"}
    ],
    "params": [
    {"name": "highlight", "select": {"type": "point", "on": "mouseover"}}
    ],
    "projection": {"type": "mercator"},
    "vconcat": [
    {
        "height": 450,
        "width": "container",
        "mark": {"type": "geoshape", "stroke": "#000000"},
        "encoding": {
        "shape": {"field": "geo", "type": "geojson"},
        "color": {
            "bin": false,
            "field": "Percent",
            "type": "quantitative",
            "scale": {
            "domain": [61.9, 98],  // Hardcoded domain values 
            "range": ["#d8e7f3", "#230798"]  // Corresponding colors 
            },
            "legend": {
            "orient": "top",
            "title": "",
            "labelExpr": "datum.value + '%'"
            }
        },
        "strokeWidth": {
            "condition": [{"param": "highlight", "empty": false, "value": 2}],
            "value": 0.5
        },
        "tooltip": [
            {"field": "Geography", "type": "nominal", "title": "Neighborhood (UHF42)"},
            {"field": "Percent", "type": "quantitative", "title": "Percent of restaurants with A grades"},
            {"field": "Time", "type": "quantitative", "title": "Year"}
        ]
        },
        "transform": [
        {
            "lookup": "GeoID",
            "from": {
            "data": {
                "url": "https://raw.githubusercontent.com/nycehs/NYC_geography/master/UHF42.topo.json",
                "format": {"type": "topojson", "feature": "collection"}
            },
            "key": "properties.GEOCODE"
            },
            "as": "geo"
        }
        ]
    },
        {
        "height": 150,
        "width": "container",
        "mark": {"type": "bar", "tooltip": true, "stroke": "#000000"},
        "encoding": {
        "y": {
            "field": "Percent", 
            "type": "quantitative", 
            "title": null,
            "axis": {
            "grid": true,
            "tickCount": 3,
            "labelExpr": "datum.value + '%'"
            },
            "scale": {"domain": [0, 100]}
        },
        "tooltip": [
            {"field": "Geography", "type": "nominal", "title": "Neighborhood (UHF42)"},
            {"field": "Percent", "type": "quantitative", "title": "Percent of restaurants with A grades"},
            {"field": "Time", "type": "quantitative", "title": "Year"}
        ],
        "x": {"field": "GeoID", "sort": "y", "axis": null},
        "color": {
            "bin": false,
            "field": "Percent",
            "type": "quantitative"
        },
        "strokeWidth": {
            "condition": [{"param": "highlight", "empty": false, "value": 2}],
            "value": 0.5
        }
        }
    }
    ]
}

// initial embedding of the map
vegaEmbed("#map", spec)

/*
// Event listener for the slider
var slider = document.getElementById('input')
slider.addEventListener("input",function() {
    document.getElementById('yearOutput').innerHTML = slider.value
    year = slider.value
    spec.transform[0].filter = `datum.Time == ${year}` // update spec with chosen year
    vegaEmbed("#map", spec) // re-run map
})
*/

// Line vis
var line = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "height": 150,
    "width": "container",
    "title": {
    "text": "Percent of restaurants with A grades",
    "fontSize": 12,
    "align": "left",
    "anchor": "start"
    },
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
    "url": "resto-data-full.csv",
    "format": {
        "type": "csv", 
        "parse": {
        "Value": "number"}
        }
    },
    "transform": [
    {"filter": "datum.GeoTypeDesc === 'Citywide'"}
    ],
    "layer": [
        {
            "mark": "rect",
            "encoding": {
                "x": {"datum": `${lower}`, "type": "temporal"},
                "x2": {"datum": `${upper}`, "type": "temporal"},
                "opacity": {"value": 0.02},
                "color": {"value": "gray"}
            }
        },
    {
        "mark": {
    "type": "line", 
    "tooltip": true,
    "strokeWidth": 3,
    "interpolate": "monotone",
    "point": {"filled": false, "fill": "white"}
    },
    "encoding": {
    "y": {
        "field": "Percent",
        "type": "quantitative",
        "title": "",
        "axis": {
        "grid": true,
        "tickCount": 3,
        "labelExpr": "datum.value + '%'"
        },
        "scale": {"domain": [60, 100]}
    },
    "x": {
        "field": "Time", 
        "type": "temporal",
        "title": "",
        "scale": {"domain": [1262322000000, 1609477200000]}

        },
        "tooltip": [
        {"field": "Percent", "type": "quantitative", "title": "Percent of restaurants with A grades"}
        ]
    }
    }
    ]
}

vegaEmbed('#lineVis', line)