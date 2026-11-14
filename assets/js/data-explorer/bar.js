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

    if (barResizeEventRegistered) return;

    const barTab = document.getElementById('v-pills-bar-tab');
    if (!barTab) return;

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
    let setCircleSize = 250;

    // The selected geography (map.js, "persistent selection") is outlined in two tones, as on the
    // map: pinnedOutline below draws a black line and a white one over it, above every mark.

    const PINNED_BAR_TEST = "datum.Value != null && datum.GeoID == pinnedGeo";
    const PINNED_LINE_STYLE = 'pinnedOutline';


    // ----- display-rule resolution (CI detection, percent formatting) ----- //

    const hasCI = barData.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    debugLog('has CI [bar.js]', hasCI);

    // Switch units and subtitle formatting when the measure is percentage-based.

    ({ isPercent, displayUnit: displayType, measurementDisplay: subtitle } = resolveMeasureDisplay(barMeasurementType, metadata[0]?.DisplayType));

    debugLog('is percent? [bar.js]', isPercent);


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
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
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
                "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
                "value": "black"
                },
                "value": "transparent"
                }
                }
                }
                */
            ];  
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
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
                                    "value": "black"
                                }
                            ],
                            "value": "white"
                        },
                        "strokeWidth": {
                            "condition": [
                                {"param": "highlight", "empty": false, "value": 2},
                                {
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
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
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
                                    "value": "black"
                                }
                            ],
                            "value": "#161616"
                        },
                        "strokeWidth": {
                            "condition": [
                                {"param": "highlight", "empty": false, "value": 2},
                                {
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
                                    "value": 2
                                }
                            ],
                            "value": 0.5
                        }
                    }
                }
            ];
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
                                    "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
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
                                "test": "datum.Value != null && (datum.GeoID == selectedGeo || datum.GeoID == pinnedGeo)",
                                "value": "black"
                            },
                        "value": "transparent"
                        }
                    }
                }
                */
            ];   
        }


    // ----- selected geography's two-tone outline ----- //

    // Two layers per selectable mark, black then white: the same geometry, drawn unfilled over it,
    // coloured on the selected row and transparent on the rest. Both sit above all the marks,
    // because a mark's own stroke is painted over by any neighbour drawn after it, and marks are
    // drawn in data order, not rank order (seen on an iPhone 2026-11-14: the selected bar's widened
    // black stroke showed only at its ends). Each keeps every row rather than filtering to the
    // selected one: a filtered layer has its own y domain, and Vega-Lite drops the "-x" ranking
    // sort when it has to union two (measured 2026-11-13: 2380's bars fell back to GeoID order).
    // Width and height are copied for the same reason, since the layers that set them conflict
    // with one that doesn't. The compiled marks are made non-interactive below, so hover, tooltip
    // and click still reach the mark underneath.

    const isSelectableLayer = (layer) => [].concat(layer.encoding?.stroke?.condition ?? [])
        .some(condition => condition.test?.includes('pinnedGeo'));

    const pinnedOutline = (layer, colour, width) => {

        const { type, size } = layer.mark;
        const { x, x2, y } = layer.encoding;

        return {
            ...(layer.width != null && { "width": layer.width }),
            ...(layer.height != null && { "height": layer.height }),
            // Opacity 1: Vega-Lite draws unaggregated points at 0.7 by default, which greys both lines.
            // aria false: otherwise each layer adds one more screen-reader item per row.
            "mark": {
                type,
                ...(size != null && { size }),
                "filled": false,
                "opacity": 1,
                "aria": false,
                "style": PINNED_LINE_STYLE
            },
            "encoding": {
                "x": type === 'bar' && !x2 ? { ...x, "stack": null } : x,
                ...(x2 && { x2 }),
                y,
                "color": {
                    "condition": { "test": PINNED_BAR_TEST, "value": colour },
                    "value": "transparent"
                },
                "strokeWidth": { "value": width }
            }
        };
    };

    const selectableLayers = barDisplay.filter(isSelectableLayer);

    barDisplay = barDisplay.concat(
        selectableLayers.map(layer => pinnedOutline(layer, 'black', 4)),
        selectableLayers.map(layer => pinnedOutline(layer, 'white', 1.5))
    );


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
    };

    wrapChartTitle(barSpec.title, barSpec.width);


    // ----- compile & finalize spec ----- //

    debugLog('vega-lite spec:');
    debugLog(barSpec);

    const vegaSpec = vegaLite.compile(barSpec).spec;

    // Vega-Lite has no switch for this, so it is set on the compiled marks.

    vegaSpec.marks
        .filter(mark => [].concat(mark.style ?? []).includes(PINNED_LINE_STYLE))
        .forEach(mark => { mark.interactive = false; });

    // console.log("vegaSpec", vegaSpec);
    
    const geoSignal = {
        "name": "selectedGeo",
        "value": null
    };

    vegaSpec.signals.push(geoSignal);

    // The geography the visitor selected by a click (map.js, "persistent selection"), outlined
    // like a hovered one. Seeded from the shared state because a measure, time-period or view
    // change redraws this chart while the selection stands.

    vegaSpec.signals.push({
        "name": "pinnedGeo",
        "value": DE.map.selection?.geoID ?? null
    });

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

        // A click on a bar selects its geography, as a click on the map does (Chris, 2026-11-13).
        // A row with no value is never outlined (the stroke tests above), so it is not selectable.

        result.view.addEventListener('click', (event, item) => {

            const geoID = item?.datum?.GeoID;

            if (geoID == null || item.datum.Value == null) return;

            toggleMapSelection(geoID);

        });
    });
};