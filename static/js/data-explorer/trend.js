const renderTrendChart = (
    data,
    metadata
    ) => {

        console.log("** renderTrendChart");

        // extract measure metadata

        let trendMeasurementType = metadata[0].MeasurementType;
        let trendDisplay = metadata[0].DisplayType;
        
        // define spec
        
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
            "data": {
                "values":  data,
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
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "field": "Bronx",
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "field": "Brooklyn",
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "field": "Manhattan",
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "field": "Queens",
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "field": "Staten Island",
                                "type": "quantitative",
                                "format": ",.1~f"
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