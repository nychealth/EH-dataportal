// ======================================================================= //
// chart.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// Vega map and bar chart
// ----------------------------------------------------------------------- //

// The topojson each geotype is drawn on. All three are published by EHDP-data at the
// environment's own data_branch and share one shape — objects.collection, with
// properties.GEOCODE carrying the id the rows join on — so the spec below needs the URL
// to vary and nothing else `[verified 2026-09-11 against the production branch: CD 59
// geometries, CDTA2020 71, PUMA2020 55; all 59 cdlist CDTA_id and PUMA2020_id values are
// present in their own file's GEOCODE set]`
const GEOTYPE_TOPOJSON = {
    CD: 'geography/CD.topo.json',
    CDTA2020: 'geography/CDTA2020.topo.json',
    PUMA2020: 'geography/PUMA2020.topo.json'
};

// The area noun this chart's title uses moved to global.js as GEOTYPE_AREA_NOUN, because
// tertiles.js needs the same vocabulary in a sentence that takes no "NYC" prefix. The
// prefix is applied at the one use below, so this title's wording is unchanged


// Draws one indicator across every area of its own geotype, with geocode's own value
// highlighted
const renderIndicatorChart = (data, destination, legendLabel, geocode, indicatorLabel, geoType) => {

    debugLog('renderIndicatorChart: enter:', {
        rowCount: data && data.length,
        destination,
        legendLabel,
        geocode,
        indicatorLabel,
        geoType
    });

    const areaLabel = 'NYC ' + areaNounFor(geoType);

    // Every chart on the page is otherwise named "Vega visualization" — vega's default, and
    // identical for all of them, so nothing says which indicator a chart shows. Falls back
    // to the generic phrasing rather than to vega's default when the card has no short name
    const chartName = indicatorLabel
        ? indicatorLabel + ' across all ' + areaLabel
        : 'Indicator values across all ' + areaLabel;

    // ----- build geography URLs ----- //

    // Topojson is fetched by Vega at render time from the configured EHDP-data branch
    const base = reportConfig.dataRepo + reportConfig.dataBranch + '/';
    const boroTopoUrl = base + 'geography/borough.topo.json';
    const areaTopoUrl = base + (GEOTYPE_TOPOJSON[geoType] || GEOTYPE_TOPOJSON.CD);

    // ----- shared spec fragments ----- //

    // The choropleth and the bar strip mark the same area the same way, so these three are
    // written once and referenced from both halves of the vconcat

    // Vega expression, not JS: evaluated per datum inside the spec
    const selectedTest = "datum.geo_join_id == " + geocode;

    const valueScale = { "scheme": { "name": "viridis", "extent": [1, 0] } };

    const tooltipFields = [
        { "field": "area_name", "title": "Area", "type": "nominal" },
        { "field": "unmodified_data_value_geo_entity", "title": legendLabel, "type": "quantitative" }
    ];

    // ----- chart spec ----- //

    // Vega-Lite spec combines a choropleth map with a compact sorted bar strip
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        // Becomes the aria-label on the .chart-wrapper vega emits with
        // role="graphics-document"; without it every chart computes to "Vega visualization"
        "description": chartName,
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

                    // - - - borough fill, drawn first so it backs gaps in area coverage - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "data": {
                            "url": boroTopoUrl,
                            "format": { "type": "topojson", "feature": "collection" }
                        },
                        // aria:false — a plain grey backdrop behind gaps in coverage. It
                        // carries no value a reader needs, and left in the tree it is one more
                        // unnamed graphics-symbol group per chart
                        "mark": { "type": "geoshape", "stroke": "#fafafa", "fill": "#C5C5C5", "strokeWidth": 0.5, "aria": false }
                    },

                    // - - - area outlines, drawn under the data layer - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "data": {
                            "url": areaTopoUrl,
                            "format": { "type": "topojson", "feature": "collection" }
                        },
                        // aria:false for the same reason: area outlines under the data
                        "mark": { "type": "geoshape", "stroke": "#a2a2a2", "fill": "#e7e7e7", "strokeWidth": 0.5, "aria": false }
                    },

                    // - - - indicator values, with the selected area outlined - - - //

                    {
                        "height": 300,
                        "width": "container",
                        "mark": { "type": "geoshape", "invalid": null, "description": "Choropleth map of " + chartName },
                        "transform": [
                            {
                                "lookup": "geo_join_id",
                                "from": {
                                    "data": {
                                        "url": areaTopoUrl,
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

            // - - - bar strip, one bar per area sorted by value - - - //

            {
                "height": 80,
                "width": "container",
                "mark": { "type": "bar", "tooltip": true, "stroke": "#161616", "description": "Bar chart of " + chartName + ", sorted by value" },
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
    // SVG renderer rather than vega-embed's canvas default, so the marks are real DOM
    // nodes: axis labels and the legend title (which carries the units from
    // data-legend-label) become selectable text with per-mark aria-labels, none of which
    // exists in a canvas bitmap
    vegaEmbed(destination, spec, { actions: true, renderer: 'svg' }).then(() => {

        // vega-embed's actions control is a <summary> containing only an SVG, so it computes
        // to a bare "DisclosureTriangle" with no name while sitting in the tab order. There
        // is no embed option for its label, so it is set on the rendered node
        const summary = document.querySelector(destination + ' details > summary');
        if (summary) summary.setAttribute('aria-label', 'Export or view source for ' + chartName);

    });

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

    // buildIndicatorCard stashed these on the collapse node as data-* attributes.
    // The series is keyed by MeasureID rather than NR's indicator_data_name, because that
    // is the key buildRows and the content YAML share
    const measureId = Number(panel.getAttribute('data-measure-id'));
    const geoType = panel.getAttribute('data-geotype') || 'CD';
    const geocode = panel.getAttribute('data-geocode');
    const mapEl = panel.querySelector('.ndhr-map-container');

    const summaryData = Number.isFinite(measureId) ? (indicatorSeries[measureId] || []) : [];

    // If required inputs are missing, keep the panel open but do not attempt render
    if (!Number.isFinite(measureId) || !mapEl) {
        debugLog('onAccordionExpand: branch-missing-prereqs:', { measureId, hasMapEl: !!mapEl });
        return;
    }

    try {

        if (summaryData.length) {

            debugLog('onAccordionExpand: branch-render-map:', { panelId, measureId, summaryRows: summaryData.length });

            mapEl.innerHTML = '';

            let legendLabel = panel.getAttribute('data-legend-label');

            // Fall back to a generic legend title when no unit text is available. Every
            // Percent measure has an empty DisplayType, so this is the common path here
            if (!legendLabel || !String(legendLabel).trim()) {
                debugLog('onAccordionExpand: branch-default-legend-label');
                legendLabel = 'Value';
            }

            renderIndicatorChart(
                summaryData,
                '#' + mapEl.id,
                legendLabel,
                geocode,
                panel.getAttribute('data-indicator-label'),
                geoType
            );

        } else {
            debugLog('onAccordionExpand: branch-no-summary-data:', measureId);
            mapEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
        }

    } catch (e) {
        console.error('onAccordionExpand: error rendering map for measure ' + measureId + ':', e);
        mapEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
    }

    // Mark panel as rendered even on no-data/error to prevent repeated work
    renderedPanels[panelId] = true;

};
