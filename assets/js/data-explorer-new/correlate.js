// ======================================================================= //
// correlate.js
// ======================================================================= //

// console.log(">> correlate.js");

// Renders the linked-measure scatterplot used by the correlate tab.
const renderCorrelate = (
    data,
    primaryMetadata,
    secondaryMetadata,
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderCorrelate");

    if (!Array.isArray(data) || !data.length || !primaryMetadata?.length || !secondaryMetadata?.length) {
        return;
    }

    const viewDescription = document.getElementById('viewDescription');
    const correlateHolder = document.getElementById('correlateHolder');
    const linksChart = document.getElementById('links');
    const unreliabilityHolder = document.getElementById('links-unreliability');
    const linksMenuHolder = document.getElementById('linksMenuHolder');
    const linksViewNote = document.getElementById('linksViewNote');

    if (!correlateHolder || !linksChart || !unreliabilityHolder) {
        return;
    }

    if (viewDescription) {
        viewDescription.innerHTML = 'Hover on points for more information.';
    }

    if (linksViewNote) {
        linksViewNote.innerHTML = 'The <strong>correlates view</strong> shows data at the finest available geography shared by both indicators on the chart. That means that the chart may show a different geography (or set of neighborhood boundaries) than what is on the map.';
    }

    correlateHolder.classList.remove('hide');
    linksMenuHolder?.classList.remove('d-none');

    const aqData = aq.from(data);
    const value1 = aqData.array('Value_1');
    const value2 = aqData.array('Value_2');

    const primaryMeasurementType = primaryMetadata[0]?.MeasurementType;
    const primaryMeasureName = primaryMetadata[0]?.MeasureName;

    let primaryDisplay;
    let primaryMeasurementDisplay;

    if ((primaryMeasurementType.includes('Percent') || primaryMeasurementType.includes('percent')) && !primaryMeasurementType.includes('percentile')) {
        primaryDisplay = '%';
        primaryMeasurementDisplay = primaryMeasurementType;
    } else {
        primaryDisplay = `${primaryMetadata[0]?.DisplayType || ''}`;
        primaryMeasurementDisplay = `${primaryMeasurementType}${primaryDisplay ? ` (${primaryDisplay})` : ''}`;
    }

    const primaryTimePeriod = data[0]?.TimePeriod_1;
    const geoTypeShortDesc = data[0]?.GeoTypeShortDesc_1;

    const secondaryMeasurementType = secondaryMetadata[0]?.MeasurementType;
    const secondaryMeasureName = secondaryMetadata[0]?.MeasureName;
    const secondaryMeasureId = secondaryMetadata[0]?.MeasureID;

    let secondaryDisplay;
    let secondaryMeasurementDisplay;

    if ((secondaryMeasurementType.includes('Percent') || secondaryMeasurementType.includes('percent')) && !secondaryMeasurementType.includes('percentile')) {
        secondaryDisplay = '%';
        secondaryMeasurementDisplay = secondaryMeasurementType;
    } else {
        secondaryDisplay = `${secondaryMetadata[0]?.DisplayType || ''}`;
        secondaryMeasurementDisplay = `${secondaryMeasurementType}${secondaryDisplay ? ` (${secondaryDisplay})` : ''}`;
    }

    const secondaryTimePeriod = data[0]?.TimePeriod_2;

    const secondaryAxis = primaryMetadata[0].VisOptions[0].Links[0].Measures.filter(
        link => link.MeasureID === secondaryMeasureId
    )[0]?.SecondaryAxis;

    let xMeasure;
    let yMeasure;
    let xMeasureName;
    let yMeasureName;
    let xDisplay = null;
    let yDisplay = null;
    let xTimePeriod;
    let yTimePeriod;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;
    let xAxisLabel;
    let yAxisLabel;
    let xValue;
    let yValue;

    switch (secondaryAxis) {
        case 'x':
            xMeasure = secondaryMeasurementType;
            yMeasure = primaryMeasurementType;
            xMeasureName = secondaryMeasureName;
            yMeasureName = primaryMeasureName;
            xValue = 'Value_2';
            yValue = 'Value_1';
            xMin = Math.min.apply(null, value2);
            xDisplay = secondaryDisplay || '';
            yDisplay = primaryDisplay || '';
            xTimePeriod = secondaryTimePeriod;
            yTimePeriod = primaryTimePeriod;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            xAxisLabel = [
                secondaryIndicatorName,
                `${secondaryMeasurementType}${secondaryMetadata[0].DisplayType ? `, ${secondaryMetadata[0].DisplayType}` : ''} (${secondaryTimePeriod})`
            ];
            yAxisLabel = `${primaryMeasurementDisplay} (${yTimePeriod})`;
            break;
        case 'y':
        default:
            xMeasure = primaryMeasurementType;
            yMeasure = secondaryMeasurementType;
            xMeasureName = primaryMeasureName;
            yMeasureName = secondaryMeasureName;
            xValue = 'Value_1';
            yValue = 'Value_2';
            xMin = Math.min.apply(null, value1);
            xDisplay = primaryDisplay || '';
            yDisplay = secondaryDisplay || '';
            xTimePeriod = primaryTimePeriod;
            yTimePeriod = secondaryTimePeriod;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            xAxisLabel = [
                primaryIndicatorName,
                `${primaryMeasurementType}${primaryMetadata[0].DisplayType ? `, ${primaryMetadata[0].DisplayType}` : ''} (${primaryTimePeriod})`
            ];
            yAxisLabel = `${secondaryMeasurementDisplay} (${yTimePeriod})`;
            break;
    }

    const bubbleSize = window.innerWidth < 576 ? 100 : 200;
    const columns = window.innerWidth < 576 ? 3 : 6;
    const height = window.innerWidth < 576 ? 350 : 500;

    const combinedUnreliability = data.map(d => d.Note_1).concat(data.map(d => d.Note_2));
    const linksUnreliability = [...new Set(combinedUnreliability)].filter(note => note);

    unreliabilityHolder.innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> ";
    unreliabilityHolder.classList.add('hide');

    linksUnreliability.forEach(note => {
        unreliabilityHolder.innerHTML += `<div class='fs-xs'>${note}</div>`;
        unreliabilityHolder.classList.remove('hide');
    });

    const correlateSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": [`${yIndicatorName}`],
            "align": "left",
            "anchor": "start",
            "fontSize": 18,
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "subtitle": yAxisLabel,
            "subtitleFontSize": 13,
            "limit": 1000
        },
        "width": "container",
        "height": height,
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelFontSize": 11,
                "titleFontSize": 15,
                "titleFont": "sans-serif",
                "titlePadding": 10,
                "titleFontWeight": "normal"
            },
            "axisY": {
                "labelFontSize": 11,
                "titleFontSize": 0,
                "labelAngle": 0,
                "titlePadding": 10,
                "titleFont": "sans-serif",
                "tickMinStep": 1,
                "domain": false,
                "ticks": false,
                "labelBaseline": "bottom"
            },
            "legend": {
                "columns": columns,
                "labelFontSize": 12,
                "labelFontWeight": "bold",
                "symbolSize": 140,
                "orient": "bottom",
                "title": null,
                "labelColor": {
                    "expr": "scale('color', datum.label)"
                }
            },
            "view": { "stroke": "transparent" },
            "range": {
                "category": [
                    "#40826D",
                    "#000F89",
                    "#a05195",
                    "#d45087",
                    "#ffa600"
                ]
            }
        },
        "data": {
            "values": data
        },
        "transform": [
            {
                "calculate": `format(datum.${xValue}, '.1f') + ' ${xDisplay}'`,
                "as": "xLabel"
            },
            {
                "calculate": `format(datum.${yValue}, '.1f') + ' ${yDisplay}'`,
                "as": "yLabel"
            }
        ],
        "layer": [
            {
                "mark": {
                    "type": "circle",
                    "filled": true,
                    "size": bubbleSize,
                    "stroke": "#7C7C7C",
                    "strokeWidth": 2
                },
                "params": [
                    {
                        "name": "borough",
                        "select": { "type": "point", "fields": ["Borough"], "on": "click" },
                        "bind": "legend"
                    },
                    {
                        "name": "hover",
                        "value": "#7C7C7C",
                        "select": { "type": "point", "on": "mouseover" }
                    }
                ],
                "encoding": {
                    "y": {
                        "field": yValue,
                        "type": "quantitative",
                        "axis": {
                            "tickCount": 4
                        }
                    },
                    "x": {
                        "title": xAxisLabel,
                        "field": xValue,
                        "type": "quantitative",
                        "scale": { "domainMin": xMin, "nice": true },
                        "axis": {
                            "titleAlign": "center",
                            "tickCount": 4
                        }
                    },
                    "tooltip": [
                        {
                            "title": geoTypeShortDesc,
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        {
                            "title": yMeasureName,
                            "field": "yLabel",
                            "type": "nominal"
                        },
                        {
                            "title": xMeasureName,
                            "field": "xLabel",
                            "type": "nominal"
                        }
                    ],
                    "color": {
                        "field": "Borough",
                        "type": "nominal"
                    },
                    "opacity": {
                        "condition": {
                            "param": "borough",
                            "empty": true,
                            "value": 1
                        },
                        "value": 0.2
                    },
                    "stroke": {
                        "condition": {
                            "param": "hover",
                            "empty": false,
                            "value": "#7C7C7C"
                        },
                        "value": null
                    }
                }
            },
            {
                "mark": {
                    "type": "line",
                    "color": "darkgray"
                },
                "transform": [
                    {
                        "regression": yValue,
                        "on": xValue
                    }
                ],
                "encoding": {
                    "x": {
                        "field": xValue,
                        "type": "quantitative"
                    },
                    "y": {
                        "field": yValue,
                        "type": "quantitative"
                    }
                }
            }
        ]
    };

    vegaEmbed('#links', correlateSpec, {
        actions: {
            export: { png: false, svg: false },
            source: false,
            compiled: false,
            editor: true
        }
    });

    printSpec = correlateSpec;
    chartType = 'links';
    vizSource = primaryMetadata[0].Sources;
    vizSourceSecond = secondaryMetadata[0].Sources;

    const dataForDownload = [...correlateSpec.data.values];

    const downloadTable = aq.from(dataForDownload)
        .select(aq.not(
            'GeoType',
            'GeoTypeShortDesc_1',
            'GeoTypeShortDesc_2',
            'GeoRank_1',
            'GeoRank_2',
            'start_period_1',
            'end_period_1',
            'ban_summary_flag_1',
            'ban_summary_flag_2',
            'BoroID',
            'DisplayValue_1',
            'DisplayValue_2',
            'GeoTypeDesc_2',
            'Geography_2',
            'start_period_2',
            'end_period_2',
            'MeasureID_1',
            'MeasureID_2'
        ))
        .derive({ Value_1_Indicator: `'${yIndicatorName} - ${yMeasure} ${yDisplay}'` })
        .derive({ Value_2_Indicator: `'${xIndicatorName} - ${xMeasure} ${xDisplay ? `(${xDisplay})` : ''}'` });

    CSVforDownload = downloadTable.toCSV();

};