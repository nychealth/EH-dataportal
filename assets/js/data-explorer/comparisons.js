// ======================================================================= //
// comparisons.js
// ======================================================================= //

const renderComparisonsChart = (
    data,
    metadata
) => {

    console.log("** renderComparisonsChart");

    console.log(">>> comp metadata");
    metadata.print()
    
    // console.log(">>> comp data:");
    // data.print(100)

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start

    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        
    });

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //

    // dimensions

    let columns = window.innerWidth < 576 ? 3 : 6;
    let height = window.innerWidth < 576 ? 350 : 500;

    // ticks

    let Value = data.array("Value");
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1

    // colors (black, blue, orange, magenta, green, purple)
    // alpha: hex 96 = 150(/255) = ~58/100

    let colors = ["#000000ff", "#1696d296", "#f2921496", "#ec008b96", "#55b74896", "#80008096"];

    // ----------------------------------------------------------------------- //
    // extract measure metadata for chart text
    // ----------------------------------------------------------------------- //
    
    let compName =            [... new Set(metadata.array("ComparisonName"))];
    let compIndicatorLabel =  [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes =    [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");


    // ----------------------------------------------------------------------- //
    // set chart text based on type of comparison
    // ----------------------------------------------------------------------- //

    let compGroupLabel;
    let plotSubtitle;
    let plotTitle;

    let suppressSubtitleBy = [564, 565, 566, 704, 715];

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    if (compName[0] === "Boroughs") {

        // ----- by boros: 1 indicator, 1 measure, 5 boros -------------------------------------------------- //

        console.log("boros");

        // if this is a boro comparison, tweak some things

        compGroupLabel = [... new Set(data.array("Geography"))];
        let hasBoros = compGroupLabel.length > 1 ? true : false; 
        
        plotTitle = indicatorName;
        plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? " by Borough" : "");
        comp_group_col = "Geography"


    } else if (compIndicatorLabel.length == 1) {

        // ----- by measure: 1 indicator, 2+ measures, 1 citywide -------------------------------------------------- //

        // console.log("1 indicator");
        
        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))]

        console.log("compId", compId);
        
        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title;

        } else {

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }


        // if there's only 1 indicator label, use measurement type to label the groups

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType"


    } else if (compMeasurementType.length == 1) {

        // ----- by indicator: 2+ indicators, 1 measure, 1 citywide -------------------------------------------------- //

        // console.log("1 measure");

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]

        console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compMeasurementType;

        } else {

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"


    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {
        
        // ----- by combo: 2+ indicators, 2+ measures, 1 citywide -------------------------------------------------- //

        // console.log("> 1 measure & indicator");

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))]

        console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title;

        } else {

            plotSubtitle = compName + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }

        // if there are more than 1 of both, use joined IndicatorMeasure 

        compGroupLabel = [... new Set(metadata.array("IndicatorMeasure"))];
        comp_group_col = "IndicatorMeasure"

    }


    // ----------------------------------------------------------------------- //
    // create tooltips JSON
    // ----------------------------------------------------------------------- //

    // will be spliced into the spec
    
    let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal"}})


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
                "tickMinStep": tickMinStep
            },
            "legend": {
                "columns": columns,
                // "columns": 3,
                "labelFontSize": 14,
                "symbolSize": 140
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
            "text": plotTitle,
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start", 
            "fontSize": 18, 
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": plotSubtitle,
            "dy": -10,
            "subtitleFontSize": 13
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