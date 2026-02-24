// ======================================================================= //
// trend.js
// ======================================================================= //

console.log('>> trend.js')

const renderTrend = (data) => {
    
    var trendSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
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
            "axisY": {"labelAngle": 0, "labelFontSize": 11, "tickMinStep": 1},
            "legend": {
                "columns": 3,
                "labelFontSize": 12,
                "symbolSize": 140,
                "offset": 45
            },
            "view": {"stroke": "transparent"},
            "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5},
            "point": {"filled": true},
            "text": {"color": "#1696d2", "fontSize": 11, "fontWeight": 400, "size": 11}
        },
        "data": {
            "values": data.objects(),
            "format": {
                "parse": {
                    "TimePeriod": "string"
                }
            }
        },
        "height": 350,
        "width": "container",
        "title": {
            "text": "Indicator name",
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start",
            "fontSize": 0,
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": "Measure name (measurement type)",
            "dy": -10,
            "subtitleFontSize": 13
        },
        "transform": [
            {
                "calculate": "datum.DisplayValue + ' per 10,000'",
                "as": "valueWithDisplay"
            },
            {"window": [{"op": "row_number", "as": "index"}]},
            {
                "calculate": "datum.TimeType === 'quarter' ? replace(datum.TimePeriod, /-Q/, ' Q') : datum.TimePeriod",
                "as": "TimeSplit1"
            },
            {"calculate": "split(datum.TimeSplit1, ' ')", "as": "TimePeriodSplit"},
            {
                "calculate": "datum.TimePeriodSplit[datum.TimePeriodSplit.length - 1]",
                "as": "TimePeriodYear"
            },
            {"calculate": "year(datum.end_period)", "as": "year_end_period"},
            {
                "calculate": "(datum.TimeType !== 'quarter' && datum.year_end_period % 2 === 0) ? datum.TimePeriodSplit : (datum.TimeType === 'quarter' ? datum.TimePeriodSplit : '')",
                "as": "fallbackYear"
            }
        ],
        "encoding": {
            "x": {
                "field": "end_period",
                "type": "temporal",
                "title": null,
                "axis": {"ticks": false, "labels": false},
                "scale": {"padding": 20}
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
                            "fields": ["Geography"],
                            "on": "pointerover"
                        }
                    }
                ],
                "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
            },
            {
                "description": "Encoding layer",
                "encoding": {
                    "color": {
                        "field": "Geography",
                        "type": "nominal",
                        "sort": true,
                        "legend": null
                    },
                    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.2},
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "axis": {"tickCount": 4},
                        "scale": {"domainMin": 0, "nice": true}
                    },
                    "tooltip": [
                        {"title": "Time", "field": "TimePeriod", "type": "nominal"},
                        {"title": "Group", "field": "Geography"},
                        {"title": ["Estimated annual rate"], "field": "valueWithDisplay"}
                    ]
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
                        }
                    },
                    {
                        "description": "Hover text",
                        "transform": [
                            {
                                "aggregate": [
                                    {"op": "argmin", "field": "end_period", "as": "Value"},
                                    {"op": "min", "field": "end_period", "as": "end_period"}
                                ],
                                "groupby": ["Geography"]
                            }
                        ],
                        "encoding": {
                            "y": {"field": "Value['Value']"},
                            "text": {
                                "condition": {
                                    "param": "hover",
                                    "field": "Geography",
                                    "empty": false
                                },
                                "value": ""
                            }
                        },
                        "mark": {
                            "type": "text",
                            "align": "left",
                            "dx": -6,
                            "dy": -14,
                            "fontSize": 14,
                            "fontWeight": "bold"
                        }
                    }
                ]
            },
            {
                "mark": {"type": "tick"},
                "encoding": {
                    "x": {
                        "field": "end_period",
                        "type": "temporal",
                        "axis": {"labels": false, "grid": false, "ticks": true},
                        "scale": {"padding": 20}
                    },
                    "y": {"value": 350},
                    "color": {"value": "black"}
                }
            },
            {
                "mark": {"type": "text", "fontWeight": 100, "fontSize": 10},
                "transform": [
                    {
                        "aggregate": [
                            {"op": "min", "field": "end_period", "as": "min_end_period"}
                        ],
                        "groupby": ["TimePeriodSplit"]
                    }
                ],
                "encoding": {
                    "x": {
                        "field": "min_end_period",
                        "type": "temporal",
                        "axis": {"labels": false, "grid": false, "ticks": false}
                    },
                    "y": {"value": 365},
                    "text": {"field": "TimePeriodSplit", "type": "nominal"},
                    "color": {"value": "black"}
                }
            }
        ]
    }
    
    vegaEmbed("#trendHolder", trendSpec, {
        actions: {
            export: { png: false, svg: false },
            source: false,
            compiled: false,
            editor: true 
        }
    })
    
    
}