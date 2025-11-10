console.log('Running bar.js')

// ======================================================================= //
// bar.js
// ======================================================================= //

const renderBar = (
    data, 
    metadata
) => {
console.log('Running renderBar()')

  var barSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Asthma emergency department visits (adults)",
    "subtitlePadding": 10,
    "fontWeight": "normal",
    "anchor": "start",
    "fontSize": 0,
    "font": "sans-serif",
    "baseline": "top",
    "subtitle": "Age-adjusted rate (per 10,000)",
    "subtitleFontSize": 10
  },
  "data": {
    "values": data,
    "format": {"parse": {"Value": "number"}}
  },
  "config": {
    "view": {"stroke": "transparent"},
    "axisY": {"domain": false, "ticks": false, "labelBaseline": "bottom"},
    "axisX": {"domain": false, "ticks": false},
    "legend": {"disable": true},
    "scale": {"invalid": {"color": {"value": "#808080"}}}
  },
  "autosize": { "type": "fit", "contains": "padding" },
  "transform": [
    {"calculate": "datum.DisplayValue + ' per 10,000'", "as": "valueLabel"}
  ],
  "height": 500,
  "width": "container",
  "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
  "params": [
    {
      "name": "highlight",
      "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
    }
  ],
  "encoding": {
    "x": {
      "field": "Value",
      "type": "quantitative",
      "title": null,
      "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
    },
    "tooltip": [
      {"field": "Geography", "title": "Neighborhood"},
      {"field": "valueLabel", "title": "Age-adjusted rate"},
      {"field": "TimePeriod", "title": "Time period"}
    ],
    "y": {"field": "GeoID", "sort": "-x", "axis": null},
    "color": {
      "bin": false,
      "field": "Value",
      "type": "quantitative",
      "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
      "legend": false
    },
    "stroke": {
      "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
      "value": "white"
    },
    "strokeWidth": {
      "condition": [{"param": "highlight", "empty": false, "value": 3}],
      "value": 0
    }
  }
}

  vegaEmbed("#barHolder", barSpec, {
    actions: {
      export: { png: false, svg: false },
      source: false,
      compiled: false,
      editor: true 
    }
  }).then(result => {
      let lastHighlightedLayer = null;

      result.view.addEventListener('mouseover', (event, item) => {
        if (item && item.datum && item.datum.GeoID) {
          const geoID = item.datum.GeoID;
          const layer = geoIDtoLayer[geoID];

          if (layer && layer !== lastHighlightedLayer) {

            // Reset previously highlighted layer
            if (lastHighlightedLayer) {
              geojsonLayer.resetStyle(lastHighlightedLayer);
            }

            // Highlight layer on the map
            highlightFeature({ target: layer });
            lastHighlightedLayer = layer;

            // Update UI / legend values
            updateHoverUI(layer.feature.properties);
          }
        }
      });

      result.view.addEventListener('mouseout', () => {
        if (lastHighlightedLayer) {
          geojsonLayer.resetStyle(lastHighlightedLayer);
          lastHighlightedLayer = null;
        }
        clearHoverUI();
      });

  });

}