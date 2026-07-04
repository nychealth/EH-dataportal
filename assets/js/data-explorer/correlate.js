// ======================================================================= //
// correlate.js
// ======================================================================= //

// console.log(">> correlate.js");

// Correlate scatterplot rendering, note handling, and CSV export

// ----------------------------------------------------------------------- //
// resize helpers
// ----------------------------------------------------------------------- //

let correlateResizeEventRegistered = false;

// Keeps the shared links pane width aligned with the current overlay width.
const updateCorrelatePaneLayout = () => {

    // The two elements whose fixed pixel width is kept in sync below.
    const correlateHolder = document.getElementById('correlateHolder');
    const linksChart = document.getElementById('links');

    if (!correlateHolder || !linksChart) {
        return;
    }

    // Derive a fixed width from the surrounding tab panel (minus its horizontal
    // padding) so the chart doesn't reflow as Vega measures its container.
    const deTabsPanel = correlateHolder.closest('.de-tabs');
    const fixedHolderWidth = Math.max(
        280,
        Math.round(
            deTabsPanel
                ? deTabsPanel.getBoundingClientRect().width - 64
                : correlateHolder.getBoundingClientRect().width
        )
    );

    correlateHolder.style.removeProperty('overflow');
    correlateHolder.style.setProperty('width', `${fixedHolderWidth}px`, 'important');
    correlateHolder.style.setProperty('min-width', `${fixedHolderWidth}px`, 'important');
    correlateHolder.style.setProperty('max-width', `${fixedHolderWidth}px`, 'important');

    linksChart.style.removeProperty('overflow');
    linksChart.style.width = '100%';
    linksChart.style.maxWidth = '100%';

};


// Waits for the overlay panel to repaint before resizing the embedded view.
const scheduleCorrelateViewResize = () => {

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            updateCorrelatePaneLayout();

            if (window.correlateVegaView && typeof window.correlateVegaView.resize === 'function') {
                window.correlateVegaView.resize().run();
            }
        });
    });

};


// Registers one window listener so the correlate chart follows viewport changes.
const registerCorrelateResizeHandler = () => {

    if (correlateResizeEventRegistered) {
        return;
    }

    window.addEventListener('resize', () => {

        if (chartType !== 'links') {
            return;
        }

        scheduleCorrelateViewResize();
    });

    correlateResizeEventRegistered = true;

};


// ----------------------------------------------------------------------- //
// correlate chart rendering
// ----------------------------------------------------------------------- //

// Builds the "no correlates available" message, resolving the label from the argument, then selectedMapMetadata's type, name, and a generic fallback, in order.
const getNoCorrelatesMessage = (measureLabel) => {

    const resolvedMeasureLabel = `${measureLabel || selectedMapMetadata?.MeasurementType || selectedMapMetadata?.MeasureName || 'the selected measure'}`;

    return `No correlates available for ${resolvedMeasureLabel}. Change the Measure on the map to see available correlates.`;

};


// Enables or disables the correlate tab's save-chart and download-data buttons together, including removing disabled controls from keyboard tab order.
const setCorrelateActionState = (isEnabled) => {

    // The two correlate-tab action controls this function enables/disables together.
    const saveChartButton = document.querySelector('.de-save-chart-button[data-print-context="correlate"]');
    const downloadDataButton = saveChartButton?.parentElement?.querySelector('a[onclick="downloadData()"]');

    [saveChartButton, downloadDataButton].forEach(button => {

        if (!button) {
            return;
        }

        button.classList.toggle('disabled', !isEnabled);
        button.setAttribute('aria-disabled', String(!isEnabled));
        button.style.pointerEvents = isEnabled ? '' : 'none';

        if (isEnabled) {
            button.removeAttribute('tabindex');
        } else {
            button.setAttribute('tabindex', '-1');
        }

    });

};


// Renders the no-correlates fallback: resets chart/note regions, shows a warning alert, clears shared print/export state, and disables tab actions.
const renderNoCorrelatesMessage = (measureLabel) => {

    // The correlate-tab regions this function clears/resets when no correlates exist.
    const viewDescription = document.getElementById('viewDescription');
    const correlateHolder = document.getElementById('correlateHolder');
    const linksChart = document.getElementById('links');
    const unreliabilityHolder = document.getElementById('links-unreliability');
    const linksViewNote = document.getElementById('linksViewNote');

    if (correlateHolder && linksChart) {
        correlateHolder.classList.remove('hide');
        linksChart.classList.add('d-flex', 'align-items-center', 'justify-content-center');
        linksChart.innerHTML = `<div class="alert alert-warning mb-0 w-100" role="alert">${getNoCorrelatesMessage(measureLabel)}</div>`;
    }

    if (viewDescription) {
        viewDescription.innerHTML = '';
    }

    if (linksViewNote) {
        linksViewNote.innerHTML = '';
        linksViewNote.classList.add('hide');
    }

    if (unreliabilityHolder) {
        unreliabilityHolder.innerHTML = '';
        unreliabilityHolder.classList.add('hide');
    }

    printSpec = null;
    CSVforDownload = '';
    vizSource = null;
    vizSourceSecond = null;
    window.correlateVegaView = null;

    setCorrelateActionState(false);

};

// Renders the linked-measure scatterplot used by the correlate tab.
const renderCorrelate = (
    data,
    primaryMetadata,
    secondaryMetadata,
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    debugLog("** renderCorrelate");

    // ----- guard clauses & element setup ----- //

    if (
        !Array.isArray(data)
        || !data.length
        || !primaryMetadata?.length
        || !secondaryMetadata?.length
    ) {
        return;
    }

    // The correlate-tab regions this function populates for a successful render.
    const viewDescription = document.getElementById('viewDescription');
    const correlateHolder = document.getElementById('correlateHolder');
    const linksChart = document.getElementById('links');
    const unreliabilityHolder = document.getElementById('links-unreliability');
    const linksViewNote = document.getElementById('linksViewNote');

    if (!correlateHolder || !linksChart || !unreliabilityHolder) {
        return;
    }

    linksChart.classList.remove('d-flex', 'align-items-center', 'justify-content-center');
    linksChart.innerHTML = '';

    setCorrelateActionState(true);

    // ----- view text & pane layout sync ----- //

    if (viewDescription) {
        viewDescription.innerHTML = 'Hover on points for more information.';
    }

    if (linksViewNote) {
        linksViewNote.innerHTML = '<strong>Correlates</strong> shows data at the finest available geography for both indicators. It may be different than what is on the map.';
        linksViewNote.classList.remove('hide');
    }

    correlateHolder.classList.remove('hide');

    // Keep the holder width fixed to the current overlay width, but refresh it
    // whenever the window changes so the correlate chart stays responsive.
    updateCorrelatePaneLayout();
    registerCorrelateResizeHandler();

    // ----- extract plot values & resolve measurement-display formatting ----- //

    // Pull plotting values up front so axis/domain logic stays readable.
    const aqData = aq.from(data);
    const value1 = aqData.array('Value_1');
    const value2 = aqData.array('Value_2');

    // console.log("aqData [renderCorrelate]");
    // aqData.print(100)

    // Resolve display formatting (percent vs. other units) and time period for the
    // primary measure, then repeat the same resolution for the secondary measure —
    // the two branches mirror each other by design, one per joined indicator.

    // - - - primary measure - - - //

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

    // - - - secondary measure - - - //

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

    // ----- resolve axis assignment via secondaryAxis switch ----- //

    const secondaryAxis = primaryMetadata[0].VisOptions[0].Links[0].Measures.filter(
        link => link.MeasureID === secondaryMeasureId
    )[0]?.SecondaryAxis;

    // Resolve which measure belongs on each axis from metadata instead of hard-coding.
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

            // - - - secondary measure on x, primary on y - - - //

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

            // - - - primary measure on x, secondary on y - - - //

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

    // ----- responsive layout constants & unreliability notes ----- //

    const bubbleSize = window.innerWidth < 576 ? 100 : 200;
    const columns = window.innerWidth < 576 ? 3 : 6;
    const height = window.innerWidth < 576 ? 350 : 400;

    const combinedUnreliability = data.map(d => d.Note_1).concat(data.map(d => d.Note_2));
    const linksUnreliability = [...new Set(combinedUnreliability)].filter(note => note);

    // Show each distinct note once even if both joined measures repeat it.
    unreliabilityHolder.innerHTML =  "" // "<span class='fs-xs'><strong>Notes:</strong></span> ";
    unreliabilityHolder.classList.add('hide');

    linksUnreliability.forEach(note => {
    unreliabilityHolder.innerHTML += `<div class='fs-xs'>${note}</div>`;
        unreliabilityHolder.classList.remove('hide');
    });

    // ----- Vega-Lite spec assembly (correlateSpec) ----- //

    // Build the scatterplot after axis labels and joined-value formatting are settled.
    const correlateSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `Scatterplot correlating ${xIndicatorName} and ${yIndicatorName}`,
        "title": {
            "text": [`${yIndicatorName}`],
            "align": "left",
            "anchor": "start",
            "fontSize": 14,
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "subtitle": yAxisLabel,
            "subtitleFontSize": 12,
            "limit": 1000
        },
        "width": "container",
        "height": height,
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelFontSize": 12,
                "titleFontSize": 14,
                "titleFont": "sans-serif",
                "titlePadding": 10,
                "titleFontWeight": "normal",
                "labelExpr":
                    "(isObject(datum) ? datum.value : datum) === 0 ? '' : (isObject(datum) ? datum.value : datum)",

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
                "labelBaseline": "bottom",
                "labelExpr":
                    "(isObject(datum) ? datum.value : datum) === 0 ? '' : (isObject(datum) ? datum.value : datum)",

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

    // ----- render, bookkeeping & CSV export ----- //

    vegaEmbed('#links', correlateSpec, {

        actions: false
        // {
        //     export: { png: false, svg: false },
        //     source: false,
        //     compiled: false,
        //     editor: true
        // }

    }).then((result) => {
        window.correlateVegaView = result.view;
        scheduleCorrelateViewResize();
    });

    printSpec = correlateSpec;
    chartType = 'links';
    vizSource = primaryMetadata[0].Sources;
    vizSourceSecond = secondaryMetadata[0].Sources;

    // Export only analyst-facing columns, then append readable measure labels.
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
        .derive({ Value_1_Indicator: aq.escape(`${yIndicatorName} - ${yMeasure} ${yDisplay}`) })
        .derive({ Value_2_Indicator: aq.escape(`${xIndicatorName} - ${xMeasure} ${xDisplay ? `(${xDisplay})` : ''}`) });

    CSVforDownload = downloadTable.toCSV();

};