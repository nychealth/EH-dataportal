(() => {
  // ns-params:@params
  var devpath = "/ehs-data-portal-frontend-temp";

  // <stdin>
  var indicatorDataPath = `${devpath}/visualizations/csv/`;
  var indicatorMapPath = `${devpath}/visualizations/json/`;
  var summarySpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": "container",
    "height": "container",
    "autosize": "fit",
    "config": {
      "axisX": {
        "labelFontSize": 14
      },
      "axisY": {
        "labelFontSize": 14
      },
      "legend": {
        "labelFontSize": 14
      },
      "view": { "stroke": "transparent" }
    },
    "data": { "url": "visualizations/csv/bikeLanP.csv" },
    "mark": { "type": "bar", "tooltip": true },
    "encoding": {
      "x": {
        "field": "neighborhood",
        "type": "nominal",
        "sort": { "op": "mean", "field": "data_value" },
        "axis": null
      },
      "y": {
        "field": "data_value",
        "type": "quantitative",
        "axis": { "title": null }
      },
      "color": {
        "condition": {
          "test": "datum.neighborhood=='Canarsie - Flatlands'",
          "value": "#1CA970"
        },
        "value": "#D8D8D8"
      },
      "tooltip": [
        { "field": "neighborhood", "type": "nominal", "title": "Neighborhood" },
        { "field": "data_value", "type": "quantitative", "title": "Value" }
      ]
    }
  };
  window.buildSummarySpec = function(neighborhood, dataSlug) {
    const temp = JSON.parse(JSON.stringify(summarySpec));
    temp.encoding.color.condition.test = "datum.neighborhood=='" + neighborhood + "'";
    temp.data.url = indicatorDataPath + dataSlug + ".csv";
    return temp;
  };
  var trendSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": "container",
    "height": "container",
    "autosize": "fit",
    "config": {
      "axisX": {
        "labelFontSize": 14
      },
      "axisY": {
        "labelFontSize": 14
      },
      "legend": {
        "labelFontSize": 14
      },
      "view": { "stroke": "transparent" }
    },
    "data": { "url": "visualizations/csv/poveACSP_trend.csv" },
    "layer": [{
      "mark": { "type": "line", "point": false, "tooltip": true },
      "encoding": {
        "x": {
          "field": "time",
          "type": "ordinal",
          "axis": { "title": null, "labelAngle": 45 }
        },
        "y": {
          "field": "data_value",
          "type": "quantitative",
          "axis": { "title": null }
        },
        "detail": {
          "field": "neighborhood",
          "type": "nominal"
        },
        "color": {
          "value": "lightgrey"
        },
        "tooltip": [
          { "field": "neighborhood", "title": "Neighborhood" },
          { "field": "data_value", "title": "Value" }
        ]
      }
    }, {
      "mark": { "type": "line", "point": true, "tooltip": true },
      "encoding": {
        "x": {
          "field": "time",
          "type": "ordinal",
          "axis": { "title": null, "labelAngle": 45 }
        },
        "y": {
          "field": "data_value",
          "type": "quantitative",
          "axis": { "title": null }
        },
        "detail": {
          "field": "neighborhood",
          "type": "nominal"
        },
        "color": {
          "condition": {
            "test": "datum.neighborhood=='Canarsie - Flatlands'",
            "value": "#1CA970"
          },
          "value": null
        },
        "tooltip": [
          { "field": "neighborhood", "title": "Your Neighborhood" },
          { "field": "data_value", "title": "Value" }
        ]
      }
    }]
  };
  window.buildTrendSpec = function(neighborhood, dataSlug) {
    const temp = JSON.parse(JSON.stringify(trendSpec));
    temp.layer[1].encoding.color.condition.test = "datum.neighborhood=='" + neighborhood + "'";
    temp.data.url = indicatorDataPath + dataSlug + "_trend.csv";
    return temp;
  };
  var mapSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": "container",
    "height": "container",
    "autosize": "fit",
    "config": {
      "axisX": {
        "labelFontSize": 14
      },
      "axisY": {
        "labelFontSize": 14
      },
      "legend": {
        "labelFontSize": 14
      },
      "view": { "stroke": "transparent" }
    },
    "data": {
      "url": "/visualizations/json/UHF42.topo.json",
      "format": { "type": "topojson", "feature": "collection" }
    },
    "transform": [
      {
        "lookup": "id",
        "from": {
          "data": { "url": "visualizations/csv/bikeLanP.csv" },
          "key": "geo_join_id",
          "fields": ["data_value", "neighborhood", "message"]
        }
      }
    ],
    "layer": [
      {
        "mark": {
          "type": "geoshape",
          "color": "lightgray",
          "stroke": "white",
          "strokeWidth": 1,
          "tooltip": true
        },
        "encoding": {
          "tooltip": [
            { "field": "neighborhood", "type": "nominal", "title": "Neighborhood" }
          ]
        }
      },
      {
        "mark": { "type": "geoshape", "tooltip": false },
        "encoding": {
          "color": {
            "field": "data_value",
            "type": "quantitative",
            "scale": { "scheme": "greens" },
            "legend": { "orient": "top-left", "title": null }
          },
          "stroke": { "value": "white" },
          "strokeWidth": { "value": 1 },
          "tooltip": [
            { "field": "neighborhood", "type": "nominal", "title": "Neighborhood" },
            { "field": "data_value", "type": "quantitative", "title": "Value" }
          ]
        }
      },
      {
        "mark": { "type": "geoshape" },
        "encoding": {
          "color": { "value": null },
          "stroke": {
            "condition": {
              "test": "datum.properties.GEONAME=='Bedford Stuyvesant - Crown Heights'",
              "value": "#000000"
            }
          },
          "strokeWidth": { "value": 3 }
        }
      }
    ]
  };
  window.buildMapSpec = function(neighborhood, dataSlug) {
    const temp = JSON.parse(JSON.stringify(mapSpec));
    temp.layer[2].encoding.stroke.condition.test = "datum.neighborhood=='" + neighborhood + "'";
    temp.transform[0].from.data.url = indicatorDataPath + dataSlug + ".csv";
    temp.data.url = indicatorMapPath + "UHF42.topo.json";
    return temp;
  };
})();
