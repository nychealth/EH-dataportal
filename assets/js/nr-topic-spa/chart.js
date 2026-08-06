// ======================================================================= //
// chart.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// Vega map and bar chart
// ----------------------------------------------------------------------- //

// Draws one indicator across all neighborhoods, with geocode's own value highlighted
const renderIndicatorChart = (data, destination, legendLabel, geocode) => {

    debugLog('renderIndicatorChart: enter:', {
        rowCount: data && data.length,
        destination,
        legendLabel,
        geocode
    });

    // ----- build geography URLs ----- //

    // Topojson is fetched by Vega at render time from the configured EHDP-data branch
    const boroTopoUrl = spaConfig.dataRepo + spaConfig.dataBranch + '/geography/borough.topo.json';
    const uhfTopoUrl = spaConfig.dataRepo + spaConfig.dataBranch + '/geography/UHF42.topo.json';

    // ----- shared spec fragments ----- //

    // The choropleth and the bar strip mark the same neighborhood the same way, so
    // these three are written once and referenced from both halves of the vconcat

    // Vega expression, not JS: evaluated per datum inside the spec
    const selectedTest = "datum.geo_join_id == " + geocode;

    const valueScale = { "scheme": { "name": "viridis", "extent": [1, 0] } };

    const tooltipFields = [
        { "field": "neighborhood", "title": "Neighborhood", "type": "nominal" },
        { "field": "unmodified_data_value_geo_entity", "title": legendLabel, "type": "quantitative" }
    ];

    // ----- chart spec ----- //

    // Vega-Lite spec combines a choropleth map with a compact sorted bar strip
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "values": data,
            "format": { "parse": { "Value": "number" } }
        },
        "config": {
            "concat": { "spacing": 20 },
            "view": { "stroke": "transparent" },
            "axisY": { "domain": false, "ticks": false, "labelBaseline": "bottom" },
            "legend": { "disable": true },
            "scale": { "invalid": { "color": { "value": "#808080" } } }
        },
        "projection": { "type": "mercator" },
        "vconcat": [
            {
                "layer": [

                    // - - - borough fill, drawn first so it backs gaps in UHF coverage - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "data": {
                            "url": boroTopoUrl,
                            "format": { "type": "topojson", "feature": "collection" }
                        },
                        "mark": { "type": "geoshape", "stroke": "#fafafa", "fill": "#C5C5C5", "strokeWidth": 0.5 }
                    },

                    // - - - UHF42 outlines, drawn under the data layer - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "data": {
                            "url": uhfTopoUrl,
                            "format": { "type": "topojson", "feature": "collection" }
                        },
                        "mark": { "type": "geoshape", "stroke": "#a2a2a2", "fill": "#e7e7e7", "strokeWidth": 0.5 }
                    },

                    // - - - indicator values, with the selected neighborhood outlined - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "mark": { "type": "geoshape", "invalid": null },
                        "transform": [
                            {
                                "lookup": "geo_join_id",
                                "from": {
                                    "data": {
                                        "url": uhfTopoUrl,
                                        "format": { "type": "topojson", "feature": "collection" }
                                    },
                                    "key": "properties.GEOCODE"
                                },
                                "as": "geo"
                            }
                        ],
                        "encoding": {
                            "shape": { "field": "geo", "type": "geojson" },
                            "color": {
                                "field": "unmodified_data_value_geo_entity",
                                "type": "quantitative",
                                "scale": valueScale,
                                "legend": {
                                    "direction": "horizontal",
                                    "orient": "top-left",
                                    "title": legendLabel,
                                    "fontWeight": "normal",
                                    "tickCount": 3,
                                    "offset": -25,
                                    "gradientLength": 200
                                }
                            },
                            "order": {
                                "condition": { "test": selectedTest, "value": 1 },
                                "value": 0
                            },
                            "stroke": {
                                "condition": { "test": selectedTest, "value": "cyan" },
                                "value": "#2d2d2d"
                            },
                            "strokeWidth": {
                                "condition": { "test": selectedTest, "value": 2.5 },
                                "value": 0.5
                            },
                            "tooltip": tooltipFields
                        }
                    }
                ]
            },

            // - - - bar strip, one bar per neighborhood sorted by value - - - //

            {
                "height": 80,
                "width": "container",
                "mark": { "type": "bar", "tooltip": true, "stroke": "#161616" },
                "encoding": {
                    "y": {
                        "field": "unmodified_data_value_geo_entity",
                        "type": "quantitative",
                        "title": null,
                        "axis": { "labelAngle": 0, "labelFontSize": 11, "tickCount": 3 }
                    },
                    "x": { "field": "geo_join_id", "sort": "y", "axis": null },
                    "color": {
                        "field": "unmodified_data_value_geo_entity",
                        "type": "quantitative",
                        "scale": valueScale,
                        "legend": false
                    },
                    "order": {
                        "condition": { "test": selectedTest, "value": 1 },
                        "value": 0
                    },
                    "stroke": {
                        "condition": { "test": selectedTest, "value": "cyan" },
                        "value": "#2d2d2d"
                    },
                    "strokeWidth": {
                        "condition": { "test": selectedTest, "value": 2.5 },
                        "value": 0
                    },
                    "tooltip": tooltipFields
                }
            }
        ]
    };

    // ----- embed ----- //

    // Action menu stays enabled so readers can export the chart as PNG/SVG.
    // SVG renderer rather than vega-embed's canvas default, so the marks are real
    // DOM nodes: axis labels and the legend title (which carries the units from
    // data-legend-label) become selectable text with per-mark aria-labels, none of
    // which exists in a canvas bitmap. Verified to survive the accordion's
    // collapse/reopen cycle, which matters because renderedPanels suppresses a
    // re-render — a view that collapsed to zero width on hide would come back blank
    vegaEmbed(destination, spec, { actions: true, renderer: 'svg' });

};


// Draws a panel's chart the first time it opens, so closed panels cost nothing
const onAccordionExpand = event => {

    const panel = event.target;
    const panelId = panel.id;

    debugLog('onAccordionExpand: enter:', panelId);

    // ----- guard already-rendered ----- //

    if (renderedPanels[panelId]) {
        debugLog('onAccordionExpand: branch-already-rendered:', panelId);
        return;
    }

    // ----- read rendering inputs ----- //

    // buildIndicatorCard stashed these on the collapse node as data-* attributes
    const indicatorName = panel.getAttribute('data-indicator-name');
    const geocode = panel.getAttribute('data-geocode') || currentGeocode;
    const mapEl = panel.querySelector('.nr-map-container');

    // If required inputs are missing, keep the panel open but do not attempt render
    if (!indicatorName || !mapEl || !vizTable) {
        debugLog('onAccordionExpand: branch-missing-prereqs:', { indicatorName, hasMapEl: !!mapEl, hasVizTable: !!vizTable });
        return;
    }

    try {

        // ----- summarize to the latest value per neighborhood ----- //

        const summaryData = vizTable
            .filter(aq.escape(d => d.indicator_data_name === indicatorName))
            .select('geo_join_id', 'neighborhood', 'unmodified_data_value_geo_entity', 'end_date')
            .dedupe()
            .groupby('neighborhood')
            .orderby('neighborhood', aq.desc('end_date'))
            .slice(0, 1)
            .ungroup()
            .derive({ unmodified_data_value_geo_entity: function (d) { return op.parse_float(d.unmodified_data_value_geo_entity); } })
            .orderby('unmodified_data_value_geo_entity')
            .select(aq.not('end_date'))
            .objects();

        // ----- render ----- //

        if (summaryData.length) {

            debugLog('onAccordionExpand: branch-render-map:', { panelId, indicatorName, summaryRows: summaryData.length });

            mapEl.innerHTML = '';

            let legendLabel = panel.getAttribute('data-legend-label');

            // Fall back to a generic legend title when no unit text is available
            if (!legendLabel || !String(legendLabel).trim()) {
                debugLog('onAccordionExpand: branch-default-legend-label');
                legendLabel = 'Value';
            }

            renderIndicatorChart(summaryData, '#' + mapEl.id, legendLabel, geocode);

        } else {
            debugLog('onAccordionExpand: branch-no-summary-data:', indicatorName);
            mapEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
        }

    } catch (e) {
        console.error('onAccordionExpand: error rendering map for ' + indicatorName + ':', e);
        mapEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
    }

    // Mark panel as rendered even on no-data/error to prevent repeated work
    renderedPanels[panelId] = true;

};
