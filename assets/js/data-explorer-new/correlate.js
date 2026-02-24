// ======================================================================= //
// correlate.js
// ======================================================================= //

console.log('>> correlate.js')

const renderCorrelate = (data) => {

    console.log('* renderCorrelate')
    
    var correlateSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": ["Primary indicator name"],
            "align": "left",
            "anchor": "start",
            "fontSize": 18,
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "subtitle": "Primary indicator measurement type (year)",
            "subtitleFontSize": 13,
            "limit": 1000
        },
        "width": "container",
        "height": 400,
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
                "columns": 6,
                "labelFontSize": 14,
                "symbolSize": 140,
                "orient": "bottom",
                "title": null
            },
            "view": {"stroke": "transparent"},
            "range": {
                "category": ["#374c80", "#ff764a", "#bc5090", "#ffa600", "#ef5675"]
            },
        },
        "data": {
            "values": data.objects()
        },
        "transform": [
            {"calculate": "format(datum.Value_2, '.1f') + ' %'", "as": "xLabel"},
            {
                "calculate": "format(datum.Value_1,  '.1f') + ' per 10,000'",
                "as": "yLabel"
            }
        ],
        "layer": [
            {
                "mark": {
                    "type": "circle",
                    "filled": true,
                    "size": 200,
                    "stroke": "#7C7C7C",
                    "strokeWidth": 2
                },
                "params": [
                    {
                        "name": "borough",
                        "select": {"type": "point", "fields": ["Borough"], "on": "click"},
                        "bind": "legend"
                    },
                    {
                        "name": "hover",
                        "value": "#7C7C7C",
                        "select": {"type": "point", "on": "mouseover"}
                    }
                ],
                "encoding": {
                    "y": {
                        "field": "Value_1",
                        "type": "quantitative",
                        "axis": {"tickCount": 4}
                    },
                    "x": {
                        "title": ["Secondary indicator name", "Measure (Year)"],
                        "field": "Value_2",
                        "type": "quantitative",
                        "scale": {"domainMin": 1.7, "nice": true},
                        "axis": {"titleAlign": "center", "tickCount": 4}
                    },
                    "tooltip": [
                        {
                            "title": "Neighborhood (UHF 42)",
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {"title": "Borough", "field": "Borough", "type": "nominal"},
                        {
                            "title": "Asthma ED visits (age 5 to 17), Estimated annual rate",
                            "field": "yLabel",
                            "type": "nominal"
                        },
                        {
                            "title": "Homes with 3+ housing problems, Percent",
                            "field": "xLabel",
                            "type": "nominal"
                        }
                    ],
                    "color": {"field": "Borough", "type": "nominal"},
                    "opacity": {
                        "condition": {"param": "borough", "empty": true, "value": 1},
                        "value": 0.2
                    },
                    "stroke": {
                        "condition": {"param": "hover", "empty": false, "value": "#7C7C7C"},
                        "value": null
                    }
                }
            },
            {
                "mark": {"type": "line", "color": "darkgray"},
                "transform": [{"regression": "Value_1", "on": "Value_2"}],
                "encoding": {
                    "x": {"field": "Value_2", "type": "quantitative"},
                    "y": {"field": "Value_1", "type": "quantitative"}
                }
            }
        ]
    }
    
    vegaEmbed('#correlateHolder', correlateSpec, {
        actions: {
            export: { png: false, svg: false },
            source: false,
            compiled: false,
            editor: true 
        }
    })
    
}