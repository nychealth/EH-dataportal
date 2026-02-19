console.log('>> bar.js')

// ======================================================================= //
// bar.js
// ======================================================================= //

const renderBar = (
    data, 
    metadata
) => {
    console.log('* renderBar')
    
    var barSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": "Indicator name",
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start",
            "fontSize": 0,
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": "Measure name (measurement type)",
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
        "autosize": {"type": "fit", "contains": "padding"},
        "transform": [
            {"calculate": "datum.DisplayValue + ' per 10,000'", "as": "valueLabel"}
        ],
        "height": 500,
        "width": "container",
        "layer": [
            {
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
                        {"field": "valueLabel", "title": "Age-adjusted rate"}
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
                        "condition": [
                            {"param": "highlight", "empty": false, "value": "black"},
                            {
                                "test": "datum.GeoID == selectedGeo",
                                "value": "black"
                            }
                        ],
                        "value": "transparent"
                    },
                    "strokeWidth": {
                        "value": 2
                    }
                }
            },
            /*
            {
            "description": "This layer was a rule that's triggered on map hover. Commented out in favor of keeping the stroke instead; we could use this to trigger a text label instead of using a Tooltip."
            "mark": {
            "type": "rule",
            "xOffset": 15,
            "strokeWidth": 1
            },
            "encoding": {
            "y": {"field": "GeoID", "sort": "-x"},
            "x": {"field": "Value", "type": "quantitative"},
            "color": {
            "condition": {
            "test": "datum.GeoID == selectedGeo",
            "value": "black"
            },
            "value": "transparent"
            }
            }
            }
            */
            
            
        ]
    }
    
    const vegaSpec = vegaLite.compile(barSpec).spec;
    
    const geoSignal = {
        "name": "selectedGeo",
        "value": null
    }
    
    vegaSpec.signals.push(geoSignal)
    
    
    vegaEmbed("#barHolder", vegaSpec, {

        actions: {
            export: { png: false, svg: false },
            source: false,
            compiled: false,
            editor: true 
        }
        
    }).then(result => {
        
        window.myVegaView = result.view; // store the vega view globally
        
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