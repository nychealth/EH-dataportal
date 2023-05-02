// ======================================================================= //
// links.js
// ======================================================================= //

const renderLinksChart = (
    data,
    primaryMetadata,   // indicators.json for primary indicator
    secondaryMetadata, // indciators.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    // console.log("data [renderLinksChart]", data);

    // ----------------------------------------------------------------------- //
    // arquero table for extracting arrays easily
    // ----------------------------------------------------------------------- //

    let aqData = aq.from(data);
    let Value_1 = aqData.array("Value_1");
    let Value_2 = aqData.array("Value_2");

    // ----------------------------------------------------------------------- //
    // get measure metadata
    // ----------------------------------------------------------------------- //

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryMeasureName     = primaryMetadata[0].MeasureName;
    const primaryDisplay         = primaryMetadata[0].DisplayType;
    const primaryTime            = data[0].Time_1;

    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0].MeasureName
    const secondaryMeasureId       = secondaryMetadata[0].MeasureID
    const secondaryDisplay         = secondaryMetadata[0].DisplayType;
    const secondaryTime            = data[0].Time_2;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links.filter(
            l => l.MeasureID === secondaryMeasureId
        )[0].SecondaryAxis;

    // ----------------------------------------------------------------------- //
    // switch field assignment based on SecondaryAxis preference
    // ----------------------------------------------------------------------- //

    let xMeasure;
    let yMeasure;
    let xMeasureName;
    let yMeasureName;
    let xDisplay = null;
    let yDisplay = null;
    let xTime;
    let yTime;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;

    switch (SecondaryAxis) {
        case 'x':
            xMeasure = secondaryMeasurementType;
            yMeasure = primaryMeasurementType;
            xMeasureName = secondaryMeasureName;
            yMeasureName = primaryMeasureName;
            xValue = "Value_2";
            yValue = "Value_1";
            xMin = Math.min.apply(null, Value_2); // get min value for adjusting axis
            xDisplay = secondaryDisplay ? secondaryDisplay : '';
            yDisplay = primaryDisplay ? primaryDisplay : '';
            xTime = secondaryTime;
            yTime = primaryTime;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            break;
        case 'y':
            xMeasure = primaryMeasurementType;
            yMeasure = secondaryMeasurementType;
            xMeasureName = primaryMeasureName;
            yMeasureName = secondaryMeasureName;
            xValue = "Value_1";
            yValue = "Value_2";
            xMin = Math.min.apply(null, Value_1); // get min value for adjusting axis
            xDisplay = primaryDisplay ? primaryDisplay : '';
            yDisplay = secondaryDisplay ? secondaryDisplay : '';
            xTime = primaryTime;
            yTime = secondaryTime;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            break;
    }

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //
    
    let bubbleSize = window.innerWidth < 576 ? 100 : 200;
    let columns = window.innerWidth < 576 ? 3 : 6;
    let height = window.innerWidth < 576 ? 350 : 500;

    
    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comb_unreliability = data.map(d => d.Note_1).concat(data.map(d => d.Note_2))
    const links_unreliability = [...new Set(comb_unreliability)].filter(d => !d == "");

    // console.log("links_unreliability", links_unreliability);

    document.querySelector("#links-unreliability").innerHTML = ""; // blank to start

    links_unreliability.forEach(element => {

        document.querySelector("#links-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        
    });

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //

    let linkspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": [`${yIndicatorName && `${yIndicatorName}`}`, `${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`} (${yTime})`],
            "align": "left", 
            "anchor": "start", 
            "fontSize": 15, 
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "limit": 1000
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
                "titleFontSize": 0, // to turn off axis title
                "labelAngle": 0,
                "titlePadding": 10,
                "titleFont": "sans-serif",
                "tickMinStep": 1
            },
            "legend": {
                "columns": columns,
                    "labelFontSize": 14,
                    "symbolSize": 140,
                    "orient": "bottom",
                    "title": null
                },
            "view": { "stroke": "transparent" },
            "range": {
                "category": [
                    "#1696d296", 
                    "#f2921496", 
                    "#ec008b96", 
                    "#55b74896", 
                    "#80008096"
                ]
            },
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "align": "center",
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values": data
        },
        "layer":[
            {
                "mark": { 
                    "type": "circle", 
                    "filled": true, 
                    "size": bubbleSize, // update based on Screen Size.
                    "stroke": "#7C7C7C", 
                    "strokeWidth": 2
                },
                "params": [
                    {
                        "name": "borough",
                        "select": { "type": "point", "fields": ["Borough"], "on": "click" },
                        "bind": "legend"
                    },
                    {
                        "name": "hover",
                        "value": "#7C7C7C",
                        "select": { "type": "point", "on": "mouseover" }
                    }
                ],
                "encoding": {
                    "y": {
                        "field": yValue,
                        "type": "quantitative",
                        "axis": {
                            "tickCount": 4
                        },
                    },
                    "x": {
                        "title": [`${xIndicatorName && `${xIndicatorName}`}`, `${xMeasure} ${xDisplay && `(${xDisplay})`} (${xTime})`],
                        "field": xValue,
                        "type": "quantitative",
                        "scale": {"domainMin": xMin, "nice": true}
                    },
                    "tooltip": [
                        {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        {
                            "title": "Neighborhood",
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {
                            "title": "Time",
                            "field": "Time_2",
                            "type": "nominal"
                        },
                        {
                            "title": yMeasureName,
                            "field": yValue,
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "title": xMeasureName,
                            "field": xValue,
                            "type": "quantitative",
                            "format": ",.1~f"
                        }
                    ],
                    "color": {
                        // "title": "Borough",
                        "field": "Borough",
                        "type": "nominal"
                    },
                    "opacity": {
                        "condition": {
                            "param": "borough",
                            "empty": true,
                            "value": 1
                        },
                        "value": 0.2
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
            },
            {"mark": {
                "type": "line",
                "color": "darkgray"
                },
                "transform": [
                {
                    "regression": yValue,
                    "on": xValue
                }
                ],
                "encoding": {
                "x": {
                    "field": xValue,
                    "type": "quantitative"
                },
                "y": {
                    "field": yValue,
                    "type": "quantitative"
                }
                }
            }
        ]

    }

    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#links", linkspec);

}