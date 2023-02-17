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

    console.log(">>> comp metadata");
    metadata.print()
    
    // console.log(">>> comp data:");
    // data.print(100)

    let Value = data.array("Value");
    // let valueMin = Math.min.apply(null, Value);
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1

    // ----------------------------------------------------------------------- //
    // extract measure metadata
    // ----------------------------------------------------------------------- //
    
    let compName = [... new Set(metadata.array("ComparisonName"))];
    
    let compIndicatorLabel = [... new Set(metadata.array("IndicatorLabel"))];
    let compLegendTitle;
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes = [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    // let compDisplayTypes = metadata.array("DisplayType");
    console.log(">>>> compDisplayTypes", compDisplayTypes);

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    let compGroupLabel;
    let plotTitle;
    // let colors = ["black", "blue", "green", "orange", "red", "magenta"];
    // let colors = ["#000000FF", "#0000805F", "#0080005F", "#FFA5005F", "#FF00005F", "#FF00FF5F"];
    // black, blue, orange, magenta, green, purple
    let colors = ["#000000ff", "#1696d296", "#f2921496", "#ec008b96", "#55b74896", "#80008096"];

     if (compName[0] === "Boroughs") {

        // if this is a boro comparison, tweak some things

        compGroupLabel = [... new Set(data.array("Geography"))];
        let hasBoros = compGroupLabel.length > 1 ? true : false; 
        
        // add black to start of list for NYC
        // colors.splice(0, 0, "black");

        plotTitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? " by Borough" : "");
        comp_group_col = "Geography"

    } else if (compIndicatorLabel.length == 1) {
        
        compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        plotTitle = compIndicatorLabel + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        // if there's only 1 indicator label, use measurement type to label the groups

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType"

    } else if (compMeasurementType.length == 1) {

        compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        plotTitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"

    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {
        
        compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        plotTitle = compName + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        // if there are more than 1 of both, use joined IndicatorMeasure 

        compGroupLabel = [... new Set(metadata.array("IndicatorMeasure"))];
        comp_group_col = "IndicatorMeasure"

    }

    // create tooltips JSON

    let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal"}})

    // console.log(">>>> compTooltips:", compTooltips);
    // console.log(">>>> comp_group_col:", comp_group_col);
    // console.log(">>>> compGroupLabel:", compGroupLabel);
    
    // get dimensions

    let columns = window.innerWidth < 576 ? 3 : 6;
    let height = window.innerWidth < 576 ? 350 : 500;

    
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
                "columns": columns,
                "labelFontSize": 14,
                "symbolSize": 140
            },
            "title": {
                "fontWeight": "normal"
                },
            "view": {"stroke": "transparent"},
            "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5},
            
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
            "text": plotTitle,
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
                            "range": colors
                        },
                        "sort": null,
                        "legend": {
                            "orient": "bottom",
                            // "direction": "vertical",
                            "title": null,
                            "labelLimit": 1000
                        }
                    },
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "axis": {
                            "tickCount": 4
                        },
                        "scale": {"domainMin": 0, "nice": true} // change domainMin to valueMin to scale with data
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "line",
                            "interpolate": "monotone",
                            "point": { 
                                "filled": false, 
                                "fill": "white", 
                                "size": 40, 
                                "strokeWidth": 2.5
                                // "opacity": 100,
                                // "fillOpacity": 100
                            }
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