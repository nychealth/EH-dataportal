const renderDisparities = (
    trendData,
    selectedMeasureType,
    selectedDisplay,
    selectedDisparities,
    selectedMeasure,
) => {

    // console.log("================ trend.js / renderTrendChart ================")

    let trendMeasure = selectedMeasure ? selectedMeasure : defaultTrendMeasure;
    let trendMeasurementType = selectedMeasureType ? selectedMeasureType : defaultTrendMeasure[0].MeasurementType;
    // let trendData = selectedData ? selectedData : fullDataTrendObjects.filter(d => d.MeasurementType === trendMeasurementType)
    let trendDisplay = selectedDisplay ? selectedDisplay : defaultTrendMeasure[0].DisplayType;
    let trendDisparity = selectedDisparities ? selectedDisparities : defaultTrendMeasure[0].VisOptions[0]?.Trend[0]?.Disparities

    console.log("trendMeasure", trendMeasure);
    console.log("trendMeasurementType", trendMeasurementType);
    console.log("trendData", trendData);
    console.log("trendDisplay", trendDisplay);
    console.log("trendDisparity", trendDisparity);

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === 221)
    );

    const disparityMeasure = disparityIndicator[0].Measures.filter(
        m => m.MeasureID === 221
    );

    // console.log('TREND DISPARITIS - POVERTY INDICATOR', disparityIndicator )
    // console.log('TREND DISPARITIS - POVERTY MEASURE', disparityMeasure )
    const disparityIndicatorName = disparityIndicator[0].IndicatorName
    const disparityMeasureType = disparityMeasure[0].MeasurementType
    const disparitySources = disparityMeasure[0].Sources
    const disparitysAbout = disparityMeasure[0].how_calculated
    const trendSources = selectedTrendSources ? selectedTrendSources : defaultTrendSources;
    const trendAbout = selectedTrendAbout ? selectedTrendAbout : defaultTrendAbout;


    loadDisparitiyData(disparityIndicator, trendMeasure)

    const combinedAbout = `${trendAbout}<h6>${disparityIndicatorName} - ${disparityMeasureType}</h6><p>${disparitysAbout}</p>`;
    const combinedSources = `${trendSources}<h6>${disparityIndicatorName} - ${disparityMeasureType}</h6><p>${disparitySources}</p>`;

    renderAboutSources(combinedAbout, combinedSources);
    setTimeout(() => {
        // console.log('joined etc: ', joinedDataTrendDisparityObjects)

        var disspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "config": {
                "background": "#FFFFFF",
                // "title": {"anchor": "start", "fontSize": 18, "font": "Calibri"},
                "axisX": {
                    // "domain": true,
                    // "domainColor": "#000000",
                    // "domainWidth": 1,
                    // "grid": false,
                    // "labelFontSize": 12,
                    "labelAngle": 0,
                    // "tickColor": "#000000",
                    // "tickSize": 5,
                    // "titleFontSize": 12,
                    // "titlePadding": 10
                },

                "axisY": {
                    // "domain": false,
                    // "domainWidth": 1,
                    // "grid": true,
                    // "gridColor": "#DEDDDD",
                    // "gridWidth": 1,
                    // "labelFontSize": 12,
                    // "labelPadding": 8,
                    // "ticks": false,
                    // "titleFontSize": 12,
                    // "titlePadding": 10,
                    // "titleFont": "Lato",
                    // "titleAngle": 0,
                    // "titleY": -10,
                    // "titleX": 18
                },


                "view": { "stroke": "transparent" },

                "range": {
                    "category": [
                        "#1696d2",
                        "#000000",
                        "#fdbf11",
                        "#ec008b",
                        "#d2d2d2",
                        "#55b748"
                    ]
                },

                "line": { "color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3 },


                "point": { "filled": true },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "align": "center",
                    "fontWeight": 400,
                    "size": 11
                }
            },
            // "data": {
            //     "url": "https://gist.githubusercontent.com/mmontesanonyc/6b0aa75affc6a60978f73e11d2f58bb3/raw/e944d335042e3da0c8e99a4df0fbebc8aac4cc15/asthmatrend.csv"
            // },
            "data": {
                "values": joinedDataTrendDisparityObjects,
            },
            "width": "container",
            "height": 550,
            "encoding": {
                "x": {
                    "field": "Time_1",
                    "type": "nominal",
                    "title": `${disparityIndicatorName} - ${disparityMeasureType}`
                }
            },
            "layer": [
                {
                    "encoding": {
                        "color": {
                            "field": "Tertile",
                            "type": "nominal",
                            "legend": {
                                "orient": "right",
                                "title": null
                            }
                        },
                        "y": {
                            "field": "median",
                            "type": "quantitative",
                            "title": `${trendMeasurementType} ${trendDisplay && `(${trendDisplay})`} (Median of Neighborhood)`
                        }
                    },
                    "layer": [
                        {
                            "mark": {
                                "type": "line",
                                "point": { "filled": false, "fill": "white" }
                            }

                        },
                        {
                            "transform": [
                                {
                                    "filter": {
                                        "param": "hover",
                                        "empty": false
                                    }
                                }
                            ],
                            "mark": "point"
                        }
                    ]
                },
                {
                    "transform": [
                        {
                            "pivot": "Tertile",
                            "value": "median",
                            "groupby": [
                                "Time_1"
                            ]
                        }
                    ],
                    "mark": "rule",
                    "encoding": {
                        "opacity": {
                            "condition": {
                                "value": 0.3,
                                "param": "hover",
                                "empty": false
                            },
                            "value": 0
                        },
                        "tooltip": [
                            {
                                "title": "Year",
                                "field": "Time_1",
                                "type": "nominal"
                            },
                            {
                                "field": "hi",
                                "type": "nominal"
                            },
                            {
                                "field": "med",
                                "type": "nominal"
                            },
                            {
                                "field": "low",
                                "type": "nominal"
                            },
                        ]
                    },
                    "params": [
                        {
                            "name": "hover",
                            "select": {
                                "type": "point",
                                "fields": [
                                    "Time_1",
                                    "Tertile"
                                ],
                                "nearest": true,
                                "on": "mouseover",
                                "clear": "mouseout"
                            }
                        }
                    ]
                }
            ]
        }

        vegaEmbed("#trend", disspec);
    }, 300)
}