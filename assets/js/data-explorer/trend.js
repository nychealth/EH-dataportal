// ======================================================================= //
// trend.js
// ======================================================================= //

// Trend rendering helpers, note handling, and Vega-Lite chart assembly

// ----------------------------------------------------------------------- //
// note helpers
// ----------------------------------------------------------------------- //

// Reuses the same note markup for unreliability notes and other trend footnotes.
const appendTrendNote = (trendUnreliability, note) => {

    if (!trendUnreliability || !note) {
        return;
    }

    trendUnreliability.innerHTML += `<div class='fs-xs'>${note}</div>`;
    trendUnreliability.classList.remove('hide');

};


// ----------------------------------------------------------------------- //
// layout helpers
// ----------------------------------------------------------------------- //

// Keeps the viewport-based chart layout choices in one place.
const getTrendLayoutConfig = (viewportWidth) => {

    // ----- legend columns by breakpoint ----- //

    let columns;
    let xAxisLabelField = 'fallbackYear'

    if (viewportWidth < 340) {
        columns = 1;
    } else if (viewportWidth < 440) {
        columns = 2;
        // xAxisLabelField = 'fallbackYear';
    } else if (viewportWidth < 1200) {
        columns = 3;
        // xAxisLabelField = 'fallbackYear';
    } else {
        columns = 6;
        // xAxisLabelField = 'TimePeriodSplit';
    }

    // ----- mobile legend override ----- //

    let mobileLegend = null;
    let endLabelFontSize = 10;

    if (viewportWidth < 720) {
        mobileLegend = {
            "columns": 3,
            "title": "",
            "labelFontWeight": "bold",
            "labelColor": {
                "expr": "scale('color', datum.label)"
            }
        };
        endLabelFontSize = 0;
    }

    return {
        columns,
        xAxisLabelField,
        mobileLegend,
        endLabelFontSize
    };

};


// ----------------------------------------------------------------------- //
// label-collision transform
// ----------------------------------------------------------------------- //

// Generates the repeated lag/window Vega-Lite transform pairs that stagger
// overlapping end-of-line label Y-positions apart. Vega has no loop construct
// of its own, so each pass is a lag of the previous pass's output; only the
// first pass gets the initial 0.025 * maxChartVal nudge off the line itself.
const buildLabelCollisionTransforms = (passCount) => {

    const transforms = [];

    for (let i = 1; i <= passCount; i++) {

        const prevField = i === 1 ? 'prevLabel' : `prevLabel${i}`;
        const nullCase = i === 1
            ? '(datum.labelValue - 0.025 * datum.maxChartVal)'
            : 'datum.labelValue';

        transforms.push({
            "window": [{ "op": "lag", "field": "labelValue", "as": prevField }],
            "sort": [{ "field": "endDateValue", "order": "ascending" }]
        });

        transforms.push({
            "calculate": `datum.${prevField} === null ? ${nullCase} : (datum.labelValue - datum.${prevField} < 0.05 * datum.maxChartVal ? datum.${prevField} + 0.05 * datum.maxChartVal : datum.labelValue)`,
            "as": "labelValue"
        });

    }

    return transforms;

};


// ----------------------------------------------------------------------- //
// note rendering
// ----------------------------------------------------------------------- //

// Resets the note area before populating the current trend-specific notes.
// The trend view uses the same shared note renderer as the other chart sites,
// but still passes through the display-note helper so chart-level notes can be
// filtered consistently before they reach the page.
const renderTrendNotes = (trendUnreliability, notes) => {

    renderUnreliabilityNotes(trendUnreliability, notes);

};


// ----------------------------------------------------------------------- //
// trend chart rendering
// ----------------------------------------------------------------------- //

// Resolves the comparison-driven title/grouping, builds threshold and no-compare markers, then assembles and renders the trend chart's Vega-Lite spec with its CSV export table.
const renderTrendChart = (
    data,
    metadata
) => {

    debugLog("*** renderTrendChart");

    // ----- guard clause & element lookup ----- //

    const trendContainer = document.getElementById('trend');
    const trendUnreliability = document.getElementById('trend-unreliability');
    const viewDescription = document.getElementById('viewDescription');

    // Guard against incomplete inputs and show a clear fallback message.
    if (!trendContainer || !data || !metadata || data.numRows() === 0 || metadata.numRows() === 0) {

        if (trendContainer) {
            trendContainer.innerHTML = `<p class="fs-sm mb-0">Trend data are not available for this selection.</p>`;
        }

        if (trendUnreliability) {
            trendUnreliability.innerHTML = '';
            trendUnreliability.classList.add('hide');
        }

        return;

    }

    // ----- notes & layout / value-domain setup ----- //

    const metadataObjects = metadata.objects();

    if (viewDescription) {
        viewDescription.innerHTML = 'Hover on lines for more information.';
    }

    // Aggregate unique notes so repeated values do not duplicate in the note list.
    // `.filter(Boolean)` drops blank/null/undefined notes; equivalent to the prior
    // `!d == ""` coercion (kept working by accident, but unreadable) — see deep-audit §6.
    const compUnreliability = [...new Set(data.objects().map(d => d.Note))].filter(Boolean);
    const displayNotes = getDisplayNotes(compUnreliability);

    renderTrendNotes(trendUnreliability, displayNotes);

    let {
        columns,
        xAxisLabelField,
        mobileLegend,
        endLabelFontSize
    } = getTrendLayoutConfig(window.innerWidth);

    const values = data.array("Value");
    const valueMax = Math.max.apply(null, values);
    const tickMinStep = valueMax >= 3.0 ? 1 : 0.1;

    // ----- comparison-type resolution (title / subtitle / grouping) ----- //

    // Unique comparison-metadata values drive which title/grouping branch runs below.
    const compName = [...new Set(metadata.array("ComparisonName"))];
    const compIndicatorLabel = [...new Set(metadata.array("IndicatorLabel"))];
    const compMeasurementType = [...new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes = [...new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    let compNoCompare = [...new Set(metadata.array("TrendNoCompare"))].filter(nc => nc != null)[0];
    const compThresholds = [...new Set(metadata.array("TrendThreshold"))];

    // Set inside whichever branch of the if/else-if chain below matches this comparison.
    let compGroupLabel;
    let plotSubtitle;
    let plotTitle;
    let comp_group_col;

    const suppressSubtitleBy = DE_MEASURE_RULES.trendSuppressSubtitleComparisonIds;

    if (compName[0] === "Boroughs") {

        // - - - Boroughs comparison - - - //

        compGroupLabel = [...new Set(data.array("Geography"))];
        const hasBoros = compGroupLabel.length > 1;

        plotTitle = DE.indicator.indicatorName;
        plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? "" : "");

        const { isPercent, displayUnit } = resolveMeasureDisplay(compMeasurementType[0]);

        if (isPercent) {
            compDisplayTypes = displayUnit;
        }

        comp_group_col = "GeographyShort"; // point to calculated field to create abbreviated borough labels

    } else if (compIndicatorLabel.length == 1) {

        // - - - single indicator label - - - //

        const compId = [...new Set(metadata.array("ComparisonID"))][0];
        const compLegendTitle = [...new Set(metadata.array("LegendTitle"))];
        const compY_axis_title = [...new Set(metadata.array("Y_axis_title"))];

        plotTitle = compName;

        if (suppressSubtitleBy.includes(compId)) {
            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");
        } else {
            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
        }

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType";
        columns = compGroupLabel.length > 3 ? 3 : columns;

    } else if (compMeasurementType.length == 1) {

        // - - - single measurement type - - - //

        const compId = [...new Set(metadata.array("ComparisonID"))][0];
        const compLegendTitle = [...new Set(metadata.array("LegendTitle"))];

        plotTitle = compName;

        if (suppressSubtitleBy.includes(compId)) {
            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");
        } else {
            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
        }

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel";
        columns = compGroupLabel.length > 3 ? 3 : columns;

    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {

        // - - - multiple measurement types & indicators - - - //

        const compId = [...new Set(metadata.array("ComparisonID"))][0];
        const compLegendTitle = [...new Set(metadata.array("LegendTitle"))];
        const compY_axis_title = [...new Set(metadata.array("Y_axis_title"))];

        plotTitle = compName;

        if (suppressSubtitleBy.includes(compId)) {
            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");
        } else {
            plotSubtitle = compName + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
        }

        compGroupLabel = [...new Set(metadata.array("IndicatorMeasure"))];
        comp_group_col = "IndicatorMeasure";
        columns = compGroupLabel.length > 3 ? 3 : columns;

    }

    // ----- threshold layer construction ----- //

    const dedupedThresholds = compThresholds.flat().filter(item => item !== null);
    const uniqueThresholds = [
        ...new Map(dedupedThresholds.map(item => [JSON.stringify(item), item])).values()
    ];

    // Build paired line + label layers so each threshold stays self-contained.
    const thresholdSpec = [];

    for (let i = 0; i < uniqueThresholds.length; i++) {

        const thresholdLine = {
            "description": `line layer ${i + 1}`,
            "mark": "line",
            "encoding": {
                "x": { "field": "end_period", "type": "temporal" },
                "y": { "datum": uniqueThresholds[i].yValue },
                "color": { "value": "#545454" },
                "size": { "value": 2 },
                "strokeDash": { "value": [2, 2] }
            }
        };

        const thresholdLabel = {
            "description": `label layer ${i + 1}`,
            "mark": {
                "type": "text",
                "align": "right",
                "baseline": "middle",
                "color": "#545454",
                "dy": -10,
                "dx": -45
            },
            "encoding": {
                "x": { "aggregate": "max", "field": "end_period", "type": "temporal" },
                "y": { "datum": uniqueThresholds[i].yValue, "type": "quantitative" },
                "text": { "value": uniqueThresholds[i].title }
            }
        };

        thresholdSpec.push(thresholdLine);
        thresholdSpec.push(thresholdLabel);

    }

    // ----- no-compare marker & tooltip label resolution ----- //

    const maxDataEndPeriod = Math.max(...new Set(data.array("end_period")));
    const noCompareEndPeriod = compNoCompare
        ? DE.lookups.timeTable.filter(aq.escape(d => d.TimePeriod == compNoCompare)).array("end_period")[0]
        : null;
    const hasGreaterEndPeriod = noCompareEndPeriod != null && maxDataEndPeriod >= noCompareEndPeriod;

    let noCompare;

    if (compNoCompare && hasGreaterEndPeriod) {

        // Add the method-change marker only when charted dates reach the break point.
        const noCompareFootnote = `A change in sampling methods in ${compNoCompare} may explain some differences in estimates from earlier years.`;

        appendTrendNote(trendUnreliability, noCompareFootnote);

        const year = new Date(`${compNoCompare}-01-01T00:00:00Z`);
        compNoCompare = year.getTime() + 15768000000;

        noCompare = [{
            "mark": "rule",
            "encoding": {
                "x": { "datum": compNoCompare },
                "y": {},
                "color": { "value": "gray" },
                "size": { "value": 1 },
                "strokeDash": { "value": [2, 2] }
            }
        }];

    } else {

        noCompare = [];

    }

    // - - - resolve comparison tooltip label - - - //

    let comparisonToolTipLabel;

    if (DE_MEASURE_RULES.actionDaysComparisonIds.includes(Number(metadataObjects[0].ComparisonID))) {
        comparisonToolTipLabel = 'Action days';
    } else {
        comparisonToolTipLabel = compMeasurementType;
    }

    // ----- Vega-Lite spec assembly (compspec2) ----- //

    // Assemble the full trend spec after titles, thresholds, and layout are resolved.
    const compspec2 = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `Trend chart of ${plotTitle}: ${plotSubtitle}`,
        "config": {
            "range": {
                "category": [
                    "#000000ff",
                    "#374c80",
                    "#ff764a",
                    "#bc5090",
                    "#ffa600",
                    "#ef5675"
                ]
            },
            "background": "#FFFFFF",
            "axisX": {
                "labelAngle": 0,
                "labelOverlap": "parity",
                "labelFontSize": 11,
                "titleFontSize": 13,
                "titleFont": "sans-serif",
                "titlePadding": 10
            },
            "axisY": { 
                "labelAngle": 0, 
                "labelFontSize": 11, 
                "tickMinStep": tickMinStep,
                "labelExpr":
                    "(isObject(datum) ? datum.value : datum) === 0 ? '' : (isObject(datum) ? datum.value : datum)",
            },
            "legend": {
                "columns": columns,
                "labelFontSize": 10,
                "symbolSize": 50,
                "offset": 45,
                "symbolType": "stroke",
                "orient": "top"
            },
            "view": { "stroke": "transparent" },
            "line": { "color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5 },
            "point": { "filled": true },
            "text": { "color": "#1696d2", "fontSize": 11, "fontWeight": 400, "size": 11 }
        },
        "data": {
            "values": data.objects(),
            "format": {
                "parse": {
                    "TimePeriod": "string"
                }
            }
        },
        // A measured width, so the chart still sizes correctly when this render beats
        // Bootstrap's reveal of the pane and "container" would resolve to 0px. fit-x is
        // what Vega-Lite applies implicitly for "container" — declared here so a numeric
        // width lays out identically.
        "width": getChartContainerWidth('#trend') || "container",
        "autosize": { "type": "fit-x", "contains": "padding" },
        "height": 400,
        "title": {
            "text": plotTitle,
            "subtitlePadding": 5,
            "fontWeight": "normal",
            "anchor": "start",
            "fontSize": 14,
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": plotSubtitle,
            "dy": -5,
            "subtitleFontSize": 12
        },
        "transform": [
            {
                "calculate": "datum.Geography === 'New York City' ? 'NYC' : datum.Geography === 'Bronx' ? 'BX' : datum.Geography === 'Brooklyn' ? 'Bklyn' : datum.Geography === 'Manhattan' ? 'MN' : datum.Geography === 'Queens' ? 'Qns' : datum.Geography === 'Staten Island' ? 'SI' : datum.Geography",
                "as": "GeographyShort"
            },
           
            {
                "calculate": `replace(datum.${comp_group_col}, /(.{1,15})(\\s+|$)/g, '$1\\n')`,
                "as": "textLabel"
            },
            {
                "calculate": `datum.DisplayValue + ' ${compDisplayTypes}'`,
                "as": "valueWithDisplay"
            },
            {
                "calculate": "datum.valueWithDisplay + (datum.Note ? ' — ' + datum.Note : '')",
                "as": "valueWithDisplayWithNote"
            },
            {
                "window": [
                    { "op": "row_number", "as": "index" }
                ],
                "sort": [{ "field": "end_period", "order": "ascending" }]
            },
            {
                "calculate": "datum.TimeType === 'quarter' ? replace(datum.TimePeriod, /-Q/, ' Q') : datum.TimePeriod",
                "as": "TimeSplit1"
            },
            {
                "calculate": "split(datum.TimeSplit1, ' ')",
                "as": "TimePeriodSplit"
            },
            {
                "calculate": "datum.TimePeriodSplit[datum.TimePeriodSplit.length - 1]",
                "as": "TimePeriodYear"
            },
            {
                "calculate": "year(datum.end_period)",
                "as": "year_end_period"
            },
            {
                "calculate": "(datum.TimeType !== 'quarter' && datum.index % 2 === 0) ? datum.TimePeriodSplit : (datum.TimeType === 'quarter' ? datum.TimePeriodSplit : '')",
                "as": "fallbackYear"
            },
            {
                "joinaggregate": [
                    { "op": "max", "field": "Value", "as": "maxVal" }
                ]
            }
        ],
        "encoding": {
            "x": {
                "field": "end_period",
                "type": "temporal",
                "title": null,
                "axis": { "ticks": false, "labels": false },
                "scale": {
                    "padding": 20
                }
            }
        },
        "layer": [
            {
                "description": "Transparent layer to trigger hover",
                "params": [
                    {
                        "name": "hover",
                        "select": {
                            "type": "point",
                            "fields": [comp_group_col],
                            "on": "pointerover"
                        }
                    }
                ],
                "mark": { "type": "line", "stroke": "transparent", "strokeWidth": 15 }
            },
            {
                "description": "Encoding layer",
                "encoding": {
                    "color": {
                        "field": comp_group_col,
                        "type": "nominal",
                        "sort": true,
                        "legend": mobileLegend
                    },
                    "opacity": { "condition": { "param": "hover", "value": 1 }, "value": 0.2 },
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "axis": { "tickCount": 4 },
                        "scale": { "domainMin": 0, "nice": true }
                    }
                },
                "layer": [
                    {
                        "description": "Establish line",
                        "mark": {
                            "type": "line",
                            "interpolate": "linear",
                            "point": {
                                "filled": false,
                                "fill": "white",
                                "size": 40,
                                "strokeWidth": 2.5,
                                "tooltip": true
                            }
                        },
                        "encoding": {
                            "tooltip": [
                                {
                                    "title": "Time",
                                    "field": "TimePeriod",
                                    "type": "nominal"
                                },
                                { "title": "Group", "field": comp_group_col === "GeographyShort" ? "Geography" : comp_group_col },
                                { "title": comparisonToolTipLabel, "field": "valueWithDisplayWithNote" }
                            ]
                        }
                    },
                    {
                        "description": "Hover text",
                        "transform": [
                            {
                                "joinaggregate": [
                                    { "op": "max", "field": "Value", "as": "maxVal" }
                                ]
                            },
                            {
                                "aggregate": [
                                    { "op": "argmax", "field": "end_period", "as": "endDate" },
                                    { "op": "max", "field": "end_period", "as": "end_period" }
                                ],
                                "groupby": [comp_group_col]
                            },
                            {
                                "calculate": "datum.endDate ? datum.endDate.Value : null",
                                "as": "endDateValue"
                            },
                            {
                                "calculate": "datum.endDate.maxVal",
                                "as": "maxChartVal"
                            },
                            {
                                "calculate": "datum.endDateValue",
                                "as": "labelValue"
                            },

                            // - - - repeated lag/window passes stagger overlapping end-of-line label Y-positions apart - - - //

                            ...buildLabelCollisionTransforms(5)
                        ],
                        "encoding": {
                            "y": { "field": "labelValue" },
                            "text": {
                                "field": "endDate.textLabel"
                            },
                            "tooltip": []
                        },
                        "mark": {
                            "type": "text",
                            "lineBreak": "\n",
                            "align": "left",
                            "dx": 8,
                            "dy": 5,
                            "fontSize": endLabelFontSize,
                            "fontWeight": "bold"
                        }
                    }
                ]
            },
            ...noCompare,
            ...thresholdSpec,
            {
                "mark": { "type": "tick" },
                "encoding": {
                    "x": {
                        "field": "end_period",
                        "type": "temporal",
                        "axis": { "labels": false, "grid": false, "ticks": true },
                        "scale": { "padding": 20 }
                    },
                    "y": { "value": 400 },
                    "color": { "value": "black" }
                }
            },
            {
                "mark": { "type": "text", "fontWeight": 100, "fontSize": 10 },
                "transform": [
                    {
                        "aggregate": [{ "op": "min", "field": "end_period", "as": "min_end_period" }],
                        "groupby": [xAxisLabelField]
                    }
                ],
                "encoding": {
                    "x": {
                        "field": "min_end_period",
                        "type": "temporal",
                        "axis": { "labels": false, "grid": false, "ticks": false }
                    },
                    "y": { "value": 415 },
                    "text": { "field": xAxisLabelField, "type": "nominal" },
                    "color": { "value": "black" }
                }
            }
        ]
    };

    // ----- render & export ----- //

    vegaEmbed("#trend", compspec2, {

        actions: false
        // {
        //     export: { png: false, svg: false },
        //     source: false,
        //     compiled: false,
        //     editor: true
        // }

    });

    DE.print.vizSource = metadataObjects[0].Sources;
    DE.print.printSpec = compspec2;
    DE.print.chartType = 'trend';

    const dataForDownload = [...compspec2.data.values];

    const downloadTable = aq.from(dataForDownload)
        .derive({ Indicator: aq.escape(`${DE.indicator.indicatorName}: ${plotTitle} ${plotSubtitle}`) })
        .select(aq.not("GeoType", "GeoTypeDesc", "GeoTypeShortDesc", "GeoRank", "MeasureID", "ban_summary_flag", "DisplayValue", "start_period", "end_period"));

    DE.print.CSVforDownload = downloadTable.toCSV();

};
