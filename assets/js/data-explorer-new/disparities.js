// ======================================================================= //
// disparities.js
// ======================================================================= //

// console.log(">> disparities.js");

// Disparities scatterplot rendering, poverty grouping, and CSV export

// ----------------------------------------------------------------------- //
// disparities chart rendering
// ----------------------------------------------------------------------- //

// Renders the disparities scatterplot for the selected primary measure.
const renderDisparitiesChart = async (
    primaryMetadata,
    disparityMeasureId
) => {

    console.log("** renderDisparitiesChart");

    if (!primaryMetadata?.length) {
        return;
    }

    const viewDescription = document.getElementById('viewDescription');
    const linksViewNote = document.getElementById('linksViewNote');
    const unreliabilityHolder = document.getElementById('links-unreliability');

    if (viewDescription) {
        viewDescription.innerHTML = 'Hover on points for more information.';
    }

    if (linksViewNote) {
        linksViewNote.innerHTML = 'The <strong>disparities view</strong> groups neighborhoods by poverty category to show how this measure varies by neighborhood poverty.';
    }

    const primaryIndicatorName = indicatorName;
    const primaryMeasurementType = primaryMetadata[0]?.MeasurementType;
    const primaryMeasureId = primaryMetadata[0]?.MeasureID;
    const primaryMeasureName = primaryMetadata[0]?.MeasureName;
    const primaryAbout = primaryMetadata[0]?.how_calculated;
    const primarySources = primaryMetadata[0]?.Sources;

    let subtitle;
    let primaryDisplay;

    if ((primaryMeasurementType.includes('Percent') || primaryMeasurementType.includes('percent')) && !primaryMeasurementType.includes('percentile')) {
        primaryDisplay = '%';
        subtitle = primaryMeasurementType;
    } else {
        primaryDisplay = primaryMetadata[0]?.DisplayType;
        subtitle = `${primaryMeasurementType}${primaryMetadata[0]?.DisplayType ? ` (${primaryDisplay})` : ''}`;
    }

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(measure => measure.MeasureID === disparityMeasureId)
    );

    const disparityMetadata = disparityIndicator[0]?.Measures.filter(
        measure => measure.MeasureID === disparityMeasureId
    );

    const disparityIndicatorName = disparityIndicator[0]?.IndicatorName;
    const disparityMeasurementType = disparityMetadata[0]?.MeasurementType;
    const disparityMeasureName = disparityMetadata[0]?.MeasureName;
    const disparitySources = disparityMetadata[0]?.Sources;
    const disparitiesAbout = disparityMetadata[0]?.how_calculated;

    const needsFreshDisparityData = !Array.isArray(disparityData)
        || !disparityData.length
        || Number(selectedDisparityPrimaryMeasureId) !== Number(primaryMeasureId);

    if (needsFreshDisparityData) {

        // Seed jitter by primary measure so redraws stay visually stable for one selection.
        const seededRandom = typeof Math.seedrandom === 'function'
            ? Math.seedrandom(String(primaryMeasureId))
            : Math.random;

        // Join the poverty measure once, then derive poverty buckets used by the plot.
        const aqDisparityData = await createJoinedLinksData(primaryMeasureId, disparityMeasureId)
            .then(res => {
                return aq.from(res.data)
                    .derive({ PovRank: d => (d.Value_2 > 30 ? 4 : (d.Value_2 > 20 ? 3 : (d.Value_2 > 10 ? 2 : 1))) })
                    .derive({ PovCat: d => (d.PovRank == 4 ? 'Very high (> 30%)' : (d.PovRank == 3 ? 'High (20-30%)' : (d.PovRank == 2 ? 'Medium (10-20%)' : 'Low (0-10%)'))) })
                    .derive({ randomOffsetX: aq.escape(d => d.PovRank + (seededRandom() * 2 - 1)) });
            });

        disparityData = aqDisparityData.objects();
        selectedDisparityPrimaryMeasureId = Number(primaryMeasureId);
    }

    selectedDisparity = true;

    const primaryTime = disparityData[0]?.TimePeriod_1;
    const disparityTime = disparityData[0]?.TimePeriod_2;
    const geoTypeShortDesc = disparityData[0]?.GeoTypeShortDesc_1;

    const combinedUnreliability = disparityData.map(d => d.Note_1).concat(disparityData.map(d => d.Note_2));
    const disparityUnreliability = [...new Set(combinedUnreliability)].filter(note => note);

    if (unreliabilityHolder) {
        // Show each note once even when both joined measures carry the same warning.
        unreliabilityHolder.innerHTML = "" // "<span class='fs-xs'><strong>Notes:</strong></span> ";
        unreliabilityHolder.classList.add('hide');

        disparityUnreliability.forEach(note => {
            unreliabilityHolder.innerHTML += `<div class='fs-xs'>${note}</div>`;
            unreliabilityHolder.classList.remove('hide');
        });
    }

    const combinedAbout =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primaryAbout}</p>
        <p><strong>${disparityIndicatorName} - ${disparityMeasurementType}</strong>: ${disparitiesAbout}</p>`;

    const combinedSources =
        `<p><strong>${primaryIndicatorName} - ${primaryMeasurementType}</strong>: ${primarySources}</p>
        <p><strong>${disparityIndicatorName} - ${disparityMeasurementType}</strong>: ${disparitySources}</p>`;

    renderAboutSources(combinedAbout, combinedSources);

    const bubbleSize = window.innerWidth < 576 ? 100 : 200;
    const height = window.innerWidth < 576 ? 350 : 500;

    // Build the disparities scatterplot after jitter, notes, and subtitle text are ready.
    const disparitiesSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `${primaryIndicatorName} ${primaryMeasurementType} and poverty scatterplot`,
        "title": {
            "text": [`${primaryIndicatorName}`],
            "align": "left",
            "anchor": "start",
            "fontSize": 18,
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "limit": 1000,
            "subtitle": `${subtitle} (${primaryTime})`,
            "subtitleFontSize": 13
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
            "view": { "stroke": "transparent" },
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "align": "center",
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values": disparityData
        },
        "transform": [
            {
                "calculate": `(datum.DisplayValue_1 + ' ${primaryDisplay || ''}')`,
                "as": "valueLabel"
            },
            {
                "calculate": `(datum.DisplayValue_2 + '%')`,
                "as": "povLabel"
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
                        "name": "hover",
                        "value": "#7C7C7C",
                        "select": { "type": "point", "on": "mouseover" }
                    }
                ],
                "encoding": {
                    "y": {
                        "field": "Value_1",
                        "type": "quantitative",
                        "axis": {
                            "tickCount": 4
                        }
                    },
                    "x": {
                        "title": [`${disparityIndicatorName} (${disparityTime})`],
                        "field": "PovRank",
                        "type": "ordinal",
                        "axis": {
                            "labelExpr": "(datum.value == 4 ? 'Very high (over 30%)' : (datum.value == 3 ? 'High (20 - 29.9%)' : (datum.value == 2 ? 'Medium (10 - 19.9%)' : 'Low (0 - 9.9%)')))",
                            "labelAlign": "center",
                            "labelAngle": 0,
                            "titleAlign": "center"
                        }
                    },
                    "xOffset": { "field": "randomOffsetX", "type": "quantitative" },
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
                            "title": primaryMeasureName,
                            "field": "valueLabel",
                            "type": "nominal"
                        },
                        {
                            "title": disparityMeasureName,
                            "field": "povLabel",
                            "type": "nominal"
                        }
                    ],
                    "fill": {
                        "title": "PovCat",
                        "field": "PovRank",
                        "type": "nominal",
                        "legend": null,
                        "scale": {
                            "range": [
                                "#374c80",
                                "#bc5090",
                                "#ef5675",
                                "#ff764a",
                                "#ffa600"
                            ]
                        }
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
            }
        ]
    };

    vegaEmbed('#links', disparitiesSpec, {
        actions: {
            export: { png: false, svg: false },
            source: false,
            compiled: false,
            editor: true
        }
    });

    printSpec = disparitiesSpec;
    vizSource = primaryMetadata[0]?.Sources;
    vizSourceSecond = disparityMetadata[0].Sources;
    chartType = 'disparities';

    // Export raw joined rows without internal plotting-only helper columns.
    const dataForDownload = [...disparitiesSpec.data.values];

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
            'MeasureID_2',
            'randomOffsetX'
        ))
        .derive({ Value_1_Indicator: `'${primaryIndicatorName}'` })
        .derive({ Value_2_Indicator: `'${disparityIndicatorName}'` });

    CSVforDownload = downloadTable.toCSV();

};