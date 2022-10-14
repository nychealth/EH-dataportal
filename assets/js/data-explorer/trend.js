const renderTrendChart = (
    data,
    metadata
) => {

        console.log("** renderTrendChart");

        // arquero table for extracting arrays easily

        let aqData = aq.from(data);
        let Value = aqData.array("Value");
        let valueMin = Math.min.apply(null, Value);

        // extract measure metadata

        let trendMeasurementType = metadata[0].MeasurementType;
        let trendDisplay = metadata[0].DisplayType;
        
        // define spec
        
        let trendspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "config": {
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
                },
                "legend": {
                    "labelFontSize": 14,
                    "symbolSize": 140
                },
                
                "view": {"stroke": "transparent"},
                
                "range": {
                    "category": [
                        "#1696d2",
                        "#fdbf11",
                        "#ec008b",
                        "#000000",
                        "#a8a8a8",
                        "#55b748"
                    ]
                },
                
                "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3},
                
                "point": {"filled": true},
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values":  data,
            },
            "width": "container",
            "height": 500,
            "title": { 
                "anchor": "start", 
                "fontSize": 13, 
                "font": "sans-serif",
                "baseline": "top",
                "text": `${trendMeasurementType}${trendDisplay && ` (${trendDisplay})`}`,
                "dy": -10
            },
            "encoding": {
                "x": {
                    "field": "Time",
                    "type": "nominal",
                    "title": null
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
                            "title": null,
                            "scale": {"domainMin": valueMin, "nice": true}
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