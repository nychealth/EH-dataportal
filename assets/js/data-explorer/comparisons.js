// ======================================================================= //
// comparisons.js
// ======================================================================= //

const renderComparisonsChart = (
    data,
    metadata
) => {

    console.log("** renderComparisonsChart");

    // ----------------------------------------------------------------------- //
    // arquero table for extracting arrays easily
    // ----------------------------------------------------------------------- //
    
    let aqData = aq.from(data);
    let Value = aqData.array("Value");
    // let valueMin = Math.min.apply(null, Value);
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1

    // ----------------------------------------------------------------------- //
    // extract measure metadata
    // ----------------------------------------------------------------------- //
    
    let compName = [... new Set(metadata.array("ComparisonName"))];
    
    let compIndicatorLabel = [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compIndicatorMeasure = [... new Set(metadata.array("IndicatorMeasure"))];
    // let compDisplayTypes = metadata.array("DisplayType");

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    let compGroupLabel;

    if (compIndicatorLabel.length == 1) {
        
        // if there's only 1 indicator label, use measurement type to label the groups

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType"

    } else if (compMeasurementType.length == 1) {

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"

    } else {
        
        // if there are more than 1 of both, use joined IndicatorMeasure 

        compGroupLabel = compIndicatorMeasure;
        comp_group_col = "IndicatorMeasure"

    } 

    // create tooltips JSON

    let compTooltips = compGroupLabel.map(x => {return {"field": x}})

    console.log(">>>> comp_group_col:", comp_group_col);
    console.log(">>>> compGroupLabel:", compGroupLabel);
    
    // get dimensions

    var columns = 1;
    var height = 500
    window.innerWidth < 576 ? columns = 3 : columns = 6;
    window.innerWidth < 576 ? height = 350 : columns = 500;
    
    
    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const trend_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    // console.log("trend_unreliability", trend_unreliability);

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start

    for (let i = 0; i < trend_unreliability.length; i++) {
        
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + trend_unreliability[i] + "</div>" ;
        
    }

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    let compspec = {
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
                // "columns": columns,
                "labelFontSize": 14,
                "symbolSize": 140
            },
            "title": {
                "fontWeight": "normal"
                },
            "view": {"stroke": "transparent"},
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
        "height": height,
        "title": { 
            "anchor": "start", 
            "fontSize": 13, 
            "font": "sans-serif",
            "baseline": "top",
            "text": compName,
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
                        "field": comp_group_col, // this is combo of indicator + measure or geo
                        "type": "nominal",
                        "scale": {
                            "range": ["blue", "green", "orange", "red", "magenta","gray"]
                        },
                        "legend": {
                            "orient": "bottom",
                            "direction": "vertical",
                            "title": null,
                            "labelLimit": 1000
                        }
                    },
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "scale": {"domainMin": 0, "nice": true} // change domainMin to valueMin to scale with data
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "line",
                            "interpolate": "monotone",
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
                        "pivot": comp_group_col,
                        "value": "DisplayValue",
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
                        ...compTooltips,
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
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //
    
    vegaEmbed("#trend", compspec);
    
}