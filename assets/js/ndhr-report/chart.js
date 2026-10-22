// ======================================================================= //
// chart.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// Vega bar chart
// ----------------------------------------------------------------------- //

// The area noun this chart's title uses moved to global.js as GEOTYPE_AREA_NOUN, because
// tertiles.js needs the same vocabulary in a sentence that takes no "NYC" prefix. The
// prefix is applied at the one use below, so this title's wording is unchanged


// Ranks one indicator across every area of its own geotype, with geocode's own bar
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

    // ----- shared spec fragments ----- //

    // Vega expression, not JS: evaluated per datum inside the spec
    const selectedTest = "datum.geo_join_id == " + geocode;

    const tooltipFields = [
        { "field": "area_name", "title": "Area", "type": "nominal" },
        { "field": "unmodified_data_value_geo_entity", "title": legendLabel, "type": "quantitative" }
    ];

    // ----- chart spec ----- //

    // One bar per area sorted by value. The choropleth that used to sit above it was
    // dropped on reviewer feedback (2026-10-20): the page's own Leaflet map already shows
    // where the district is, and the ranking is what the panel is for. With the map went
    // its legend, so the units it carried now title the y axis
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
            "view": { "stroke": "transparent" },
            "axisY": { "domain": false, "ticks": false, "labelBaseline": "bottom" },
            "legend": { "disable": true },
            "scale": { "invalid": { "color": { "value": "#808080" } } }
        },
        "height": 220,
        "width": "container",
        "mark": { "type": "bar", "tooltip": true, "stroke": "#161616", "description": "Bar chart of " + chartName + ", sorted by value" },
        "encoding": {
            "y": {
                "field": "unmodified_data_value_geo_entity",
                "type": "quantitative",
                "title": legendLabel,
                "axis": { "labelAngle": 0, "labelFontSize": 11, "tickCount": 4, "titleFontWeight": "normal" }
            },
            "x": { "field": "geo_join_id", "sort": "y", "axis": null },
            "color": {
                "field": "unmodified_data_value_geo_entity",
                "type": "quantitative",
                "scale": { "scheme": { "name": "viridis", "extent": [1, 0] } },
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

    }).catch(err => {

        // vegaEmbed rejects ASYNCHRONOUSLY, so onAccordionExpand's try/catch around the
        // call to this function cannot see it: the reader is left with an empty chart box
        // and its "Unable to render chart." fallback never runs. The failure is not silent
        // — it surfaces as an unhandled rejection, which `npm run smoke` does fail on — but
        // that carries only the underlying error and says nothing about WHICH chart or
        // panel died `[measured 2026-09-14 on the NR twin of this code, which still has no
        // handler: 1 pageerror, 0 code-level errors, no fallback, 1 empty box]`.
        // Reported here rather than re-thrown: there is no caller left to catch it
        console.error('Error embedding chart for ' + chartName + ':', err);
        debugLog('renderIndicatorChart: branch-embed-failed:', { destination, err });

        const container = document.querySelector(destination);
        if (container) container.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';

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
    const chartEl = panel.querySelector('.ndhr-chart-container');

    const summaryData = Number.isFinite(measureId) ? (indicatorSeries[measureId] || []) : [];

    // If required inputs are missing, keep the panel open but do not attempt render
    if (!Number.isFinite(measureId) || !chartEl) {
        debugLog('onAccordionExpand: branch-missing-prereqs:', { measureId, hasChartEl: !!chartEl });
        return;
    }

    try {

        if (summaryData.length) {

            debugLog('onAccordionExpand: branch-render-chart:', { panelId, measureId, summaryRows: summaryData.length });

            chartEl.innerHTML = '';

            let legendLabel = panel.getAttribute('data-legend-label');

            // Fall back to a generic legend title when no unit text is available. Every
            // Percent measure has an empty DisplayType, so this is the common path here
            if (!legendLabel || !String(legendLabel).trim()) {
                debugLog('onAccordionExpand: branch-default-legend-label');
                legendLabel = 'Value';
            }

            renderIndicatorChart(
                summaryData,
                '#' + chartEl.id,
                legendLabel,
                geocode,
                panel.getAttribute('data-indicator-label'),
                geoType
            );

        } else {
            debugLog('onAccordionExpand: branch-no-summary-data:', measureId);
            chartEl.innerHTML = '<p class="text-muted small">No chart data available.</p>';
        }

    } catch (e) {
        console.error('onAccordionExpand: error rendering chart for measure ' + measureId + ':', e);
        chartEl.innerHTML = '<p class="text-muted small">Unable to render chart.</p>';
    }

    // Mark panel as rendered even on no-data/error to prevent repeated work
    renderedPanels[panelId] = true;

};
