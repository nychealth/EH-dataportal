// ======================================================================= //
// bar.js
// ======================================================================= //

// console.log(">> bar.js");

// Bar-chart rendering, resize coordination, and Vega-Lite layer assembly

// ----------------------------------------------------------------------- //
// resize helpers
// ----------------------------------------------------------------------- //

// Tracks whether the tab-resize listener has been attached, since renderBar may be called repeatedly.
let barResizeEventRegistered = false;

// Defers Vega resize until the overlay pane has fully repainted.
const scheduleBarViewResize = () => {
    if (!window.myVegaView || typeof window.myVegaView.resize !== 'function') {
        return;
    }

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            window.myVegaView.resize().run();
        });
    });
};

// Registers one Bootstrap tab listener so hidden-pane charts can resize on reopen.
const registerBarTabResizeHandler = () => {

    if (barResizeEventRegistered) {
        return;
    }

    const barTab = document.getElementById('v-pills-bar-tab');
    if (!barTab) {
        return;
    }

    barTab.addEventListener('shown.bs.tab', () => {
        if (DE.state.overlay === 'bar' && window.myVegaView && typeof window.myVegaView.resize === 'function') {
            window.myVegaView.resize().run();
        }
    });

    barResizeEventRegistered = true;
};


// ----------------------------------------------------------------------- //
// bar chart rendering
// ----------------------------------------------------------------------- //

// Builds and renders the Vega-Lite bar chart for the active geography slice.
const renderBar = (
    data, 
    metadata,
    geography,
    timePeriod
) => {

    debugLog("** renderBar");

    debugLog("data [renderBar]", data);
    debugLog("metadata [renderBar]", metadata);
    debugLog("geo [renderBar]", geography);

    // ----- notes rendering & data filtering ----- //

    // Render notes
    const barUnreliability = document.getElementById('bar-unreliability');
    const uniqueNotes = [...new Set(data.map(item => item.Note))].filter(note => note);
    const displayNotes = getDisplayNotes(uniqueNotes);

    renderUnreliabilityNotes(barUnreliability, displayNotes);

    // Accept either a raw backend geotype or the prettified UI label.
    const barData = data.filter(item => {
        return item.GeoType === geography || prettifyGeoType(item.GeoType) === geography;
    });

    // - - - get unique time in data - - - //

    const barTimes =  [...new Set(barData.map(item => item.TimePeriod))];

    debugLog("barTimes [bar.js]", barTimes);

    // ----- metadata & working-state setup ----- //

    // Working state for the display-rule branch and chart spec below: data-derived
    // metadata, formatting flags set inside the percent check, and layout constants
    // shared across the mean/CI/plain-bar layer variants.
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


    // ----- display-rule resolution (CI detection, percent formatting) ----- //

    const hasCI = barData.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    debugLog('has CI [bar.js]', hasCI);

    // Switch units and subtitle formatting when the measure is percentage-based.
    ({ isPercent, displayUnit: displayType, measurementDisplay: subtitle } = resolveMeasureDisplay(barMeasurementType, metadata[0]?.DisplayType));

    debugLog('is percent? [bar.js]', isPercent)


    // ----- layer-variant selection (Mean / CI / plain) ----- //

        // Keep layer selection explicit so each data shape keeps its own readable spec branch.
        if (barMeasurementType.includes('Mean') || barMeasurementType.includes('mean') ) {

            // - - - Mean: dot marker on a light bar — dots read better than solid bars for means - - - //

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
                                {"field": "valueLabelWithNote", "title": metadata[0].MeasureName},
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
                            {"field": "valueLabelWithNote", "title": metadata[0].MeasureName},
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
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
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
                "test": "datum.Value != null && datum.GeoID == selectedGeo",
                "value": "black"
                },
                "value": "transparent"
                }
                }
                }
                */
            ]  

        } else if (hasCI == true) {

            // - - - CI: gray error bar plus point-estimate marker for confidence-interval rows - - - //

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
                                "field": "valueLabelWithNote",
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
                                {"param": "highlight", "empty": false, "value": "black"},
                                {
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
                                    "value": "black"
                                }
                            ],
                            "value": "white"
                        },
                        "strokeWidth": {
                            "condition": [
                                {"param": "highlight", "empty": false, "value": 2},
                                {
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
                                    "value": 2
                                }
                            ],
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
                                "field": "valueLabelWithNote",
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
                            "condition": [
                                {
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
                                    "value": "black"
                                }
                            ],
                            "value": "#161616"
                        },
                        "strokeWidth": {
                            "condition": [
                                {"param": "highlight", "empty": false, "value": 2},
                                {
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
                                    "value": 2
                                }
                            ],
                            "value": 0.5
                        }
                    }
                }
            ]
        } else {

            // - - - Plain: standard single-layer ranked bar (no mean dot or CI) - - - //

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
                            {"field": "valueLabelWithNote", "title": metadata[0].MeasureName},
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
                                    "test": "datum.Value != null && datum.GeoID == selectedGeo",
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
                                "test": "datum.Value != null && datum.GeoID == selectedGeo",
                                "value": "black"
                            },
                        "value": "transparent"
                        }
                    }
                }
                */
            ]   

        }


    // ----- bar spec assembly (barSpec) ----- //

    var barSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `Bar chart of ${DE.indicator.indicatorName}: ${metadata[0].MeasureName}`,
        "title": {
            "text": "Indicator name",
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start",
            "fontSize": 0,
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": metadata[0].MeasureName,
            "subtitleFontSize": 12
        },
        "data": {
            "values": barData,
            "format": {"parse": {"Value": "number"}}
        },
        "config": {
            "view": {"stroke": "transparent"},
            "axisY": {"domain": false, "ticks": false, "labelBaseline": "bottom"},
            "axisX": {
                "domain": false, 
                "ticks": false,
                "labelExpr":
                    "(isObject(datum) ? datum.value : datum) === 0 ? '' : (isObject(datum) ? datum.value : datum)",
            },
            "legend": {"disable": true},
            "scale": {"invalid": {"color": {"value": "#808080"}}}
        },
        "autosize": {"type": "fit-x", "contains": "padding"},
        "transform": [
            // add value and note field

            // Precompute display strings once so tooltips and CI marks can reuse them across layers.
            {"calculate": `datum.DisplayValue + ' ${displayType}'`, "as": "valueLabel"},
            {
                "calculate": "datum.valueLabel + (datum.Note ? ' — ' + datum.Note : '')",
                "as": "valueLabelWithNote"
            },
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[0] : null",
                "as": "ciLow"
            },
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[1] : null",
                "as": "ciHigh"
            },
            {
            "calculate": "datum.CI ? replace(replace(datum.CI, /[()]/g, ''), /, /, ' to ') : null",
            "as": "CInoParens"
            }
        ],
        "height": setHeight,
        // A measured width, so the chart still sizes correctly when this render beats
        // Bootstrap's reveal of the pane and "container" would resolve to 0px. The explicit
        // autosize above already matches what "container" applies implicitly, so a numeric
        // width lays out identically.
        "width": getChartContainerWidth('#barHolder') || "container",
        "layer": barDisplay
    }


    // ----- compile & finalize spec ----- //

    debugLog('vega-lite spec:')
    debugLog(barSpec)

    const vegaSpec = vegaLite.compile(barSpec).spec;

    // console.log("vegaSpec", vegaSpec);
    
    const geoSignal = {
        "name": "selectedGeo",
        "value": null
    }
    
    vegaSpec.signals.push(geoSignal)

    DE.print.printSpec = vegaSpec;
    DE.print.vizSource = metadata[0]?.Sources;
    DE.print.chartType = 'bar';

    // ----- download-CSV table (mirrors trend.js's downloadTable pattern) ----- //

    // Label rows with the indicator/measure, then drop the join/helper columns
    // (raw GeoType code, GeoRank, numeric period bounds, etc.) that are meaningless
    // outside the app and shouldn't appear in a user-facing export.
    const downloadTable = aq.from(barData)
        .derive({ Indicator: aq.escape(`${DE.indicator.indicatorName}: ${metadata[0].MeasureName}`) })
        .select(aq.not("GeoType", "GeoTypeDesc", "GeoTypeShortDesc", "GeoRank", "MeasureID", "ban_summary_flag", "DisplayValue", "start_period", "end_period"));

    DE.print.CSVforDownload = downloadTable.toCSV();

    // ----- render & map-hover interop ----- //

    return vegaEmbed("#barHolder", vegaSpec, {

        renderer: "svg",

        actions: false

        // {
        //     export: { png: false, svg: false },
        //     source: false,
        //     compiled: false,
        //     editor: true
        // }

    }).then(result => {

        window.myVegaView = result.view; // store the vega view globally
        registerBarTabResizeHandler();
        scheduleBarViewResize();

        // Mirror bar hover into the map. Which map type is behind the contract, and which
        // geography is currently highlighted, are both the map's business — see map.js's
        // interop section. Vega fires mouseover only when the hovered item changes.
        result.view.addEventListener('mouseover', (event, item) => {

            // Ignore Vega events that do not map to a concrete geography row.
            const geoID = item?.datum?.GeoID;

            if (geoID == null || !window.mapInterop.ready) return;

            window.mapInterop.highlight(geoID);
        });

        // Clear the linked map highlight when the cursor leaves a bar or the chart.
        result.view.addEventListener('mouseout', () => {

            if (!window.mapInterop.ready) return;

            window.mapInterop.reset();
        });

    });

};