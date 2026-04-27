// ======================================================================= //
// bar.js
// ======================================================================= //

// console.log(">> bar.js");

// Builds and renders the Vega-Lite bar chart for the active geography slice.
const renderBar = (
    data, 
    metadata,
    geography,
    timePeriod
) => {

    console.log("** renderBar");

    console.log("data [renderBar]", data);
    console.log("metadata [renderBar]", metadata);
    console.log("geo [renderBar]", geography);

    // Accept either a raw backend geotype or the prettified UI label.
    const barData = data.filter(item => {
        return item.GeoType === geography || prettifyGeoType(item.GeoType) === geography;
    });

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const barTimes =  [...new Set(barData.map(item => item.TimePeriod))];

    console.log("barTimes [bar.js]", barTimes);

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let barGeoType            = barData[0]?.GeoType;
    let barMeasurementType    = metadata[0]?.MeasurementType;
    let barTime = barTimes[0];
    let displayType;
    let subtitle;
    let isPercent;
    let topoFile = '';
    let barDisplay = [];
    let setHeight = 500;
    let setCircleSize = 250



    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // Determine data parameters that inform bar style
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const hasCI = barData.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    console.log('has CI [bar.js]', hasCI)

    // Switch units and subtitle formatting when the measure is percentage-based.
    if (barMeasurementType.includes('Percent') || barMeasurementType.includes('percent') && !barMeasurementType.includes('percentile')) {

        isPercent = true;
        displayType = '%';
        subtitle = barMeasurementType;
        
    } else {

        isPercent = false;
        displayType = metadata[0]?.DisplayType;
        subtitle = barMeasurementType + `${displayType ? ` (${displayType})` : ''}`;

    }

    console.log('is percent? [bar.js]', isPercent)


    /* ----------------------------------------------------------------------- //
    // modify bar spec:
        - If the measurement Type is a mean, then give it a dot with a gray bar. Dots better represent Means.
        - if the data has CIs, then, give a gray CI bar
        - Else, just give a standard bar
    // -----------------------------------------------------------------------  */

    
        // Keep the layer recipe branchy here so each data shape gets its own readable Vega encoding.
        // Choose the visual layer recipe based on whether the measure is a mean, has CIs, or is a plain bar.
        if (barMeasurementType.includes('Mean') || barMeasurementType.includes('mean') ) {
            
            // For means, show a dot against a light bar

            barDisplay = [
                {
                        "mark": {"type": "bar", "tooltip": true},
                        "encoding": {
                            "x": {
                                "field": "Value",
                                "type": "quantitative",
                                "title": null,
                                "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
                            },
                            "tooltip": [
                                {"field": "Geography", "title": "Neighborhood"},
                                {"field": "valueLabel", "title": metadata[0].MeasureName},
                                {"field": "TimePeriod", "title": 'Time period'}
                            ],
                            "y": {"field": "GeoID", "sort": "-x", "axis": null},
                            "color": {"value": "#f1f1f1"}
                        }
                },
                {
                    "mark": {
                        "type": "circle",
                        "size": setCircleSize,
                        "tooltip": true,
                        "stroke": "#161616"
                    },
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
                            {"field": "valueLabel", "title": metadata[0].MeasureName},
                            {"field": "TimePeriod", "title": 'Time period'}
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

                }
                */
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

        } else if (hasCI == true) {

            // If data has CIs, then show dots with a gray bar for the CIs
            barDisplay = [
                {
                    "height": setHeight,
                    "width": "container",
                    "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
                    "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
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
                    "encoding": {
                        "x": {
                        "field": "ciLow",
                        "type": "quantitative",
                        "title": null,
                        "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
                        },
                        "x2": {
                        "field": "ciHigh"
                        },
                        "tooltip": [
                            {
                                "field": "Geography", 
                                "title": "Neighborhood"
                            },
                            {
                                "field": "valueLabel",
                                "title": `${barMeasurementType}`
                            },
                            {
                                "field": "CInoParens",
                                "title": "Confidence interval"
                            },
                            {
                                "field": "TimePeriod",
                                "title": "Time period"
                            }
                        ],
                        "y": {"field": "GeoID", "sort": "Value", "axis": null},
                        "color": {"value": "#f1f1f1ff"},
                        "stroke": {
                            "condition": [
                                {"param": "highlight", "empty": false, "value": "black"}
                            ],
                            "value": "white"
                        },
                        "strokeWidth": {
                            "condition": [{"param": "highlight", "empty": false, "value": 2}],
                            "value": 0
                        }
                    }
                },
                {
                    "height": setHeight,
                    "width": "container",
                    "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
                    "mark": {
                        "type": "circle",
                        "size": setCircleSize,
                        "tooltip": true,
                        "stroke": "#161616"
                    },
                    "encoding": {
                        "x": {
                            "field": "Value",
                            "type": "quantitative",
                            "title": null,
                            "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
                        },
                        "tooltip": [
                            {
                                "field": "Geography", 
                                "title": "Neighborhood"
                            },
                            {
                                "field": "valueLabel",
                                "title": `${barMeasurementType}`
                            },
                            {
                                "field": "CInoParens",
                                "title": "Confidence interval"
                            },
                            {
                                "field": "TimePeriod",
                                "title": "Time period"
                            }
                        ],
                        "y": {"field": "GeoID", "sort": "x", "axis": null},
                        "color": {
                            "bin": false,
                            "field": "Value",
                            "type": "quantitative",
                            "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
                            "legend": false
                        },
                        "stroke": {
                            "value": "black"
                        },
                        "strokeWidth": {
                            "value": 0.5
                        }
                    }
                }
            ]
        }
        
        else {
        
            // Otherwise, standard display is fully color-encoded bars

            barDisplay = [
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
                            {"field": "valueLabel", "title": metadata[0].MeasureName},
                            {"field": "TimePeriod", "title": 'Time period'}
                        ],
                        "y": {"field": "GeoID", "sort": "x", "axis": null},
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


    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
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
            "subtitle": metadata[0].MeasureName,
            "subtitleFontSize": 10
        },
        "data": {
            "values": barData,
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
            // Precompute display strings once so tooltips and CI marks can reuse them across layers.
            {"calculate": `datum.DisplayValue + ' ${displayType}'`, "as": "valueLabel"},
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[0] : datum.Value * .95", // hard set for test
                "as": "ciLow"
            },
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[1] : datum.Value * 1.05", // hard set for test
                "as": "ciHigh"
            },
            {
            "calculate": "datum.CI ? replace(replace(datum.CI, /[()]/g, ''), /, /, ' to ') : null",
            "as": "CInoParens"
            }
        ],
        "height": setHeight,
        "width": "container",
        "layer": barDisplay
    }

    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    console.log('vega-lite spec:')
    console.log(barSpec)

    const vegaSpec = vegaLite.compile(barSpec).spec;

    // console.log("vegaSpec", vegaSpec);
    
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
        
        let lastHighlighted = null; // can be a Leaflet layer (choropleth) or geoID (bubble)

        // Mirror bar hover into the map by looking up the matching Leaflet layer by GeoID.
        result.view.addEventListener('mouseover', (event, item) => {

            // Ignore Vega events that do not map to a concrete geography row.
            if (item && item.datum && item.datum.GeoID) {

                const geoID = item.datum.GeoID;
                const mapAPI = window.mapInterop;

                if (!mapAPI) return; // map not ready yet

                // Check if it's a bubble map (has circleMarkers) or choropleth (has geoIDtoLayer)
                if (mapAPI.circleMarkers) {
                    // Bubble map
                    const markerObj = mapAPI.circleMarkers.find(c => c.geoID === geoID);
                    if (markerObj && markerObj !== lastHighlighted) {
                        // Reset previous highlight
                        if (lastHighlighted) {
                            mapAPI.resetBubble(lastHighlighted);
                        }
                        // Highlight new bubble
                        mapAPI.highlightBubble(geoID);
                        lastHighlighted = geoID;
                        // Update UI with bar data properties
                        mapAPI.updateHoverUI(item.datum);
                    }
                } else if (mapAPI.geoIDtoLayer) {
                    // Choropleth map
                    const layer = mapAPI.geoIDtoLayer[geoID];
                    if (layer && layer !== lastHighlighted) {
                        // Reset previous
                        if (lastHighlighted) {
                            mapAPI.resetHighlight(lastHighlighted);
                        }
                        // Highlight new
                        mapAPI.highlightFeature({ target: layer });
                        lastHighlighted = layer;
                        mapAPI.updateHoverUI(layer.feature.properties);
                    }
                }
            }
        });

        // Clear the linked map highlight when the cursor leaves the chart.
        result.view.addEventListener('mouseout', () => {

            const mapAPI = window.mapInterop;

            if (!mapAPI) return;

            if (lastHighlighted) {
                if (typeof lastHighlighted === 'string') {
                    // Bubble map: lastHighlighted is geoID
                    mapAPI.resetBubble(lastHighlighted);
                } else {
                    // Choropleth: lastHighlighted is layer
                    mapAPI.resetHighlight(lastHighlighted);
                }
                lastHighlighted = null;
            }

            mapAPI.clearHoverUI();
        });
        
    });

}