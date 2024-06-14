function initialize() {

  console.log('ICE JS RUNNING')

  var options = ["Asian", "Black", "Hispanic", "Other", "White","Total"]

  var ddElement = document.getElementById('dd')
  var dd2Element = document.getElementById('dd2')

  options.forEach(option => {

    var thisOption = `<a href="#dd" onclick="popOne('${option}')" class="dropdown-item">${option}</a>`
    ddElement.innerHTML += thisOption

  });

  options.forEach(option => {

    var thisOption = `<a href="#dd" onclick="popTwo('${option}')" class="dropdown-item">${option}</a>`
    dd2Element.innerHTML += thisOption

  });

  var iceSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "",
      "subtitlePadding": 10,
      "fontWeight": "normal",
      "anchor": "start",
      "fontSize": 18,
      "font": "sans-serif",
      "baseline": "top",
      "subtitle": "",
      "subtitleFontSize": 13
    },
    "data": {
      "url": "https://gist.githubusercontent.com/mmontesanonyc/3a708df63fcb885fbefb169f3f8fe789/raw/843e7a3e9845a3c38ee087f7a7fafa5fea0d404e/race-counts.csv",
      "format": {
        "type": "csv",
        "parse": {
          "Asian": "number",
          "Total": "number",
          "Black": "number",
          "Hispanic": "number",
          "Other": "number",
          "White": "number"
        }
      }
    },
    "transform": [
      {
        "calculate": "datum.Black + datum.Hispanic + datum.Asian + datum.Other",
        "as": "POC"
      },
      {"calculate": "(datum.White - datum.Black) / datum.Total", "as": "ICE"}
    ],
    "config": {
      "concat": {"spacing": 20},
      "view": {"stroke": "transparent"},
      "axisY": {"domain": false, "ticks": false},
      "legend": {"disable": true}
    },
    "projection": {"type": "mercator"},
    "hconcat": [
      {
        "height": 550,
        "width": 200,
        "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
        "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
        "params": [
          {
            "name": "highlight",
            "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
          }
        ],
        "encoding": {
          "x": {
            "field": "ICE",
            "type": "quantitative",
            "title": null,
            "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3,"orient": "top"}
          },
          "tooltip": [
            {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
            {
              "field": "Total",
              "title": "Total population",
              "type": "quantitative",
              "format": ","
            },
            {"field": "ICE", "title": "ICE Score", "format": ".2f"}
          ],
          "y": {"field": "GeoID", "sort": "-x", "axis": null},
          "color": {
            "bin": false,
            "field": "ICE",
            "type": "quantitative",
            "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
            "legend": false
          },
          "stroke": {
            "condition": [
              {"param": "highlight", "empty": false, "value": "cyan"}
            ],
            "value": "white"
          },
          "strokeWidth": {
            "condition": [{"param": "highlight", "empty": false, "value": 3}],
            "value": 0
          }
        }
      },
      {
        "layer": [
          {
            "height": 550,
            "width": 550,
            "data": {
              "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/borough.topo.json",
              "format": {"type": "topojson", "feature": "collection"}
            },
            "mark": {
              "type": "geoshape",
              "stroke": "#fafafa",
              "fill": "#C5C5C5",
              "strokeWidth": 0.5
            }
          },
          {
            "height": 500,
            "width": "container",
            "data": {
              "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
              "format": {"type": "topojson", "feature": "collection"}
            },
            "mark": {
              "type": "geoshape",
              "stroke": "#a2a2a2",
              "fill": "#e7e7e7",
              "strokeWidth": 0.5
            }
          },
          {
            "height": 500,
            "width": "container",
            "mark": {"type": "geoshape", "invalid": null},
            "params": [
              {
                "name": "highlight",
                "select": {
                  "type": "point",
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ],
            "transform": [
              {
                "lookup": "GeoID",
                "from": {
                  "data": {
                    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
                    "format": {"type": "topojson", "feature": "collection"}
                  },
                  "key": "properties.GEOCODE"
                },
                "as": "geo"
              }
            ],
            "encoding": {
              "shape": {"field": "geo", "type": "geojson"},
              "color": {
                "condition": {
                  "test": "isValid(datum.ICE)",
                  "bin": false,
                  "field": "ICE",
                  "type": "quantitative",
                  "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
                  "legend": {
                    "direction": "horizontal",
                    "orient": "top-left",
                    "title": null,
                    "tickCount": 3,
                    "offset": -25,
                    "gradientLength": 200
                  }
                },
                "value": "#808080"
              },
              "stroke": {
                "condition": [
                  {"param": "highlight", "empty": false, "value": "cyan"}
                ],
                "value": "#2d2d2d"
              },
              "strokeWidth": {
                "condition": [
                  {"param": "highlight", "empty": false, "value": 1.25}
                ],
                "value": 0.5
              },
              "order": {
                "condition": [{"param": "highlight", "empty": false, "value": 1}],
                "value": 0
              },
              "tooltip": [
                {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
                {
                  "field": "Total",
                  "title": "Total population",
                  "type": "quantitative",
                  "format": ","
                },
                {"field": "ICE", "title": "ICE Score", "format": ".2f"}
              ]
            }
          }
        ]
      }
  ]
  }

  vegaEmbed("#iceMap", iceSpec);

}


initialize()

var chosenPopOne
var chosenPopTwo

function popOne(x) {
  console.log('population One is ' + x)
  chosenPopOne = x
  document.getElementById('firstPop').innerHTML = x
  if (typeof chosenPopTwo !== 'undefined') {
    reRunMap()
  } else {}

}

function popTwo(x) {
  console.log('population Two is ' + x)
  chosenPopTwo = x
  document.getElementById('secondPop').innerHTML = x
  if (typeof chosenPopOne !== 'undefined') {
    reRunMap()
  } else {}
}

function reRunMap() {
  console.log('running map two')

  var yourICE = `(datum.${chosenPopOne} - datum.${chosenPopTwo} ) / datum.Total`

  var yourIceSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "",
      "subtitlePadding": 10,
      "fontWeight": "normal",
      "anchor": "start",
      "fontSize": 18,
      "font": "sans-serif",
      "baseline": "top",
      "subtitle": "",
      "subtitleFontSize": 13
    },
    "data": {
      "url": "https://gist.githubusercontent.com/mmontesanonyc/3a708df63fcb885fbefb169f3f8fe789/raw/843e7a3e9845a3c38ee087f7a7fafa5fea0d404e/race-counts.csv",
      "format": {
        "type": "csv",
        "parse": {
          "Asian": "number",
          "Total": "number",
          "Black": "number",
          "Hispanic": "number",
          "Other": "number",
          "White": "number"
        }
      }
    },
    "transform": [
      {
        "calculate": "datum.Black + datum.Hispanic + datum.Asian + datum.Other",
        "as": "People of Color"
      },
      {"calculate": `${yourICE}`, "as": "ICE"}
    ],
    "config": {
      "concat": {"spacing": 20},
      "view": {"stroke": "transparent"},
      "axisY": {"domain": false, "ticks": false},
      "legend": {"disable": true}
    },
    "projection": {"type": "mercator"},
    "hconcat": [
      {
        "height": 550,
        "width": 200,
        "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
        "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
        "params": [
          {
            "name": "highlight",
            "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
          }
        ],
        "encoding": {
          "x": {
            "field": "ICE",
            "type": "quantitative",
            "title": null,
            "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3,"orient": "top"}
          },
          "tooltip": [
            {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
            {
              "field": "Total",
              "title": "Total population",
              "type": "quantitative",
              "format": ","
            },
            {"field": "ICE", "title": "ICE Score", "format": ".2f"}
          ],
          "y": {"field": "GeoID", "sort": "-x", "axis": null},
          "color": {
            "bin": false,
            "field": "ICE",
            "type": "quantitative",
            "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
            "legend": false
          },
          "stroke": {
            "condition": [
              {"param": "highlight", "empty": false, "value": "cyan"}
            ],
            "value": "white"
          },
          "strokeWidth": {
            "condition": [{"param": "highlight", "empty": false, "value": 3}],
            "value": 0
          }
        }
      },
      {
        "layer": [
          {
            "height": 550,
            "width": 550,
            "data": {
              "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/borough.topo.json",
              "format": {"type": "topojson", "feature": "collection"}
            },
            "mark": {
              "type": "geoshape",
              "stroke": "#fafafa",
              "fill": "#C5C5C5",
              "strokeWidth": 0.5
            }
          },
          {
            "height": 500,
            "width": "container",
            "data": {
              "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
              "format": {"type": "topojson", "feature": "collection"}
            },
            "mark": {
              "type": "geoshape",
              "stroke": "#a2a2a2",
              "fill": "#e7e7e7",
              "strokeWidth": 0.5
            }
          },
          {
            "height": 500,
            "width": "container",
            "mark": {"type": "geoshape", "invalid": null},
            "params": [
              {
                "name": "highlight",
                "select": {
                  "type": "point",
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ],
            "transform": [
              {
                "lookup": "GeoID",
                "from": {
                  "data": {
                    "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
                    "format": {"type": "topojson", "feature": "collection"}
                  },
                  "key": "properties.GEOCODE"
                },
                "as": "geo"
              }
            ],
            "encoding": {
              "shape": {"field": "geo", "type": "geojson"},
              "color": {
                "condition": {
                  "test": "isValid(datum.ICE)",
                  "bin": false,
                  "field": "ICE",
                  "type": "quantitative",
                  "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
                  "legend": {
                    "direction": "horizontal",
                    "orient": "top-left",
                    "title": null,
                    "tickCount": 3,
                    "offset": -25,
                    "gradientLength": 200
                  }
                },
                "value": "#808080"
              },
              "stroke": {
                "condition": [
                  {"param": "highlight", "empty": false, "value": "cyan"}
                ],
                "value": "#2d2d2d"
              },
              "strokeWidth": {
                "condition": [
                  {"param": "highlight", "empty": false, "value": 1.25}
                ],
                "value": 0.5
              },
              "order": {
                "condition": [{"param": "highlight", "empty": false, "value": 1}],
                "value": 0
              },
              "tooltip": [
                {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
                {
                  "field": "Total",
                  "title": "Total population",
                  "type": "quantitative",
                  "format": ","
                },
                {"field": "ICE", "title": "ICE Score", "format": ".2f"}
              ]
            }
          }
        ]
      }
  ]
  }

  vegaEmbed("#mapTwo", yourIceSpec)
}

var specTwo = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "",
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 18,
    "font": "sans-serif",
    "baseline": "top",
    "subtitle": "",
    "subtitleFontSize": 13
  },
  "data": {
    "url": "https://gist.githubusercontent.com/mmontesanonyc/3a708df63fcb885fbefb169f3f8fe789/raw/843e7a3e9845a3c38ee087f7a7fafa5fea0d404e/race-counts.csv",
    "format": {
      "type": "csv",
      "parse": {
        "Asian": "number",
        "Total": "number",
        "Black": "number",
        "Hispanic": "number",
        "Other": "number",
        "White": "number"
      }
    }
  },
  "transform": [
    {
      "calculate": "datum.Black + datum.Hispanic + datum.Asian + datum.Other",
      "as": "POC"
    },
    {"calculate": "(datum.White - datum.Black) / datum.Total", "as": "ICEx"}
  ],
  "config": {
    "concat": {"spacing": 20},
    "view": {"stroke": "transparent"},
    "axisY": {"domain": false, "ticks": false},
    "legend": {"disable": true}
  },
  "projection": {"type": "mercator"},
  "hconcat": [
    {
      "height": 550,
      "width": 200,
      "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
      "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
      "params": [
        {
          "name": "highlight",
          "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
        }
      ],
      "encoding": {
        "x": {
          "field": "ICE",
          "type": "quantitative",
          "title": null,
          "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3,"orient": "top"}
        },
        "tooltip": [
          {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
          {
            "field": "Total",
            "title": "Total population",
            "type": "quantitative",
            "format": ","
          },
          {"field": "ICE", "title": "ICE Score", "format": ".2f"}
        ],
        "y": {"field": "GeoID", "sort": "-x", "axis": null},
        "color": {
          "bin": false,
          "field": "ICE",
          "type": "quantitative",
          "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
          "legend": false
        },
        "stroke": {
          "condition": [
            {"param": "highlight", "empty": false, "value": "cyan"}
          ],
          "value": "white"
        },
        "strokeWidth": {
          "condition": [{"param": "highlight", "empty": false, "value": 3}],
          "value": 0
        }
      }
    },
    {
      "layer": [
        {
          "height": 550,
          "width": 550,
          "data": {
            "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/borough.topo.json",
            "format": {"type": "topojson", "feature": "collection"}
          },
          "mark": {
            "type": "geoshape",
            "stroke": "#fafafa",
            "fill": "#C5C5C5",
            "strokeWidth": 0.5
          }
        },
        {
          "height": 500,
          "width": "container",
          "data": {
            "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
            "format": {"type": "topojson", "feature": "collection"}
          },
          "mark": {
            "type": "geoshape",
            "stroke": "#a2a2a2",
            "fill": "#e7e7e7",
            "strokeWidth": 0.5
          }
        },
        {
          "height": 500,
          "width": "container",
          "mark": {"type": "geoshape", "invalid": null},
          "params": [
            {
              "name": "highlight",
              "select": {
                "type": "point",
                "on": "mouseover",
                "clear": "mouseout"
              }
            }
          ],
          "transform": [
            {
              "lookup": "GeoID",
              "from": {
                "data": {
                  "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA_2020.topo.json",
                  "format": {"type": "topojson", "feature": "collection"}
                },
                "key": "properties.GEOCODE"
              },
              "as": "geo"
            }
          ],
          "encoding": {
            "shape": {"field": "geo", "type": "geojson"},
            "color": {
              "condition": {
                "test": "isValid(datum.ICE)",
                "bin": false,
                "field": "",
                "type": "quantitative",
                "scale": {"scheme": {"name": "purpleorange", "extent": [1, 0]}},
                "legend": {
                  "direction": "horizontal",
                  "orient": "top-left",
                  "title": null,
                  "tickCount": 3,
                  "offset": -25,
                  "gradientLength": 200
                }
              },
              "value": "#808080"
            },
            "stroke": {
              "condition": [
                {"param": "highlight", "empty": false, "value": "cyan"}
              ],
              "value": "#2d2d2d"
            },
            "strokeWidth": {
              "condition": [
                {"param": "highlight", "empty": false, "value": 1.25}
              ],
              "value": 0.5
            },
            "order": {
              "condition": [{"param": "highlight", "empty": false, "value": 1}],
              "value": 0
            },
            "tooltip": [
              {"field": "Neighborhood-name", "title": "Neighborhood (NTA)"},
              {
                "field": "Total",
                "title": "Total population",
                "type": "quantitative",
                "format": ","
              },
              {"field": "ICE", "title": "ICE Score", "format": ".2f"}
            ]
          }
        }
      ]
    }
]
}

vegaEmbed("#mapTwo", specTwo)
