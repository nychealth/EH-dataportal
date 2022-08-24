const renderTrendChart = (
    trendData,
    trendMetadata
    ) => {

        console.log("** renderTrendChart");

        
        let trendMeasurementType = trendMetadata[0].MeasurementType;
        let trendDisplay = trendMetadata[0].DisplayType;
        
        // console.log("trendData", trendData);
        // console.log("trendMetadata", trendMetadata);
        // console.log("trendMeasurementType", trendMeasurementType);
        // console.log("trendDisplay", trendDisplay);
        
        var trendspec = {
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
                
                
                "view": {"stroke": "transparent"},
                
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
                
                "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3},
                
                
                "point": {"filled": true},
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
                "values":  trendData,
            },
            "width": "container",
            "height": 550,
            "encoding": {
                "x": {
                    "field": "Time",
                    "type": "nominal",
                    "title": "Year"
                }
            },
            "layer": [
                {
                    "encoding": {
                        "color": {
                            "field": "Geography",
                            "type": "nominal",
                            "legend": {
                                "orient": "right",
                                "title": null
                            }
                        },
                        "y": {
                            "field": "Value",
                            "type": "quantitative",
                            "title": `${trendMeasurementType} ${trendDisplay && `(${trendDisplay})`} `
                        }
                    },
                    "layer": [
                        {
                            "mark": {
                                "type": "line",
                                "point": {"filled": false, "fill": "white"}
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
                            "pivot": "Geography",
                            "value": "Value",
                            "groupby": [
                                "Time"
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
                                "field": "Time",
                                "type": "nominal"
                            },
                            {
                                "field": "New York City",
                                "type": "quantitative"
                            },
                            {
                                "field": "Bronx",
                                "type": "quantitative"
                            },
                            {
                                "field": "Brooklyn",
                                "type": "quantitative"
                            },
                            {
                                "field": "Manhattan",
                                "type": "quantitative"
                            },
                            {
                                "field": "Queens",
                                "type": "quantitative"
                            },
                            {
                                "field": "Staten Island",
                                "type": "quantitative"
                            }
                        ]
                    },
                    "params": [
                        {
                            "name": "hover",
                            "select": {
                                "type": "point",
                                "fields": [
                                    "Time"
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
        
        vegaEmbed("#trend", trendspec);
        
    }