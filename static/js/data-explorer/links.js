const renderLinksChart = (
    joinedData,
    primaryMetadata, // indicators.json for main indicator
    secondaryMetadata, // indciators.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    // not working on load
    // axis indicator names not working on update

    // console.log("================ links.js / renderLinksChart ================")

    console.log("primaryMetadata [renderLinksChart]", primaryMetadata);
    console.log("primaryIndicatorName [renderLinksChart]", primaryIndicatorName);
    console.log("secondaryMetadata [renderLinksChart]", secondaryMetadata);
    console.log("secondaryIndicatorName [renderLinksChart]", secondaryIndicatorName);

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryDisplay = primaryMetadata[0].DisplayType;
    const primaryTime = primaryMetadata[0].AvailableTimes[0].TimeDescription;

    const primaryAxis = primaryMetadata[0].VisOptions[0].Links[0].Axis;

    // const secondaryMeasureId = secondaryMetadata[0].VisOptions[0].Links[0].MeasureID;
    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryDisplay = secondaryMetadata[0].DisplayType;
    const secondaryTime = selectedlinksSecondaryMeasureTime;

    // NEED INDICATOR IDS


    let xMeasure;
    let yMeasure;
    let xDisplay = null;
    let yDisplay = null;
    let xTime;
    let yTime;
    let xIndicatorName;
    let yIndicatorname;

    switch (primaryAxis) {
        case 'y':
            yMeasure = secondaryMeasurementType;
            xMeasure = primaryMeasurementType;
            yValue = "Value_2";
            xValue = "Value_1";
            yDisplay = secondaryDisplay ? secondaryDisplay : '';
            xDisplay = primaryDisplay ? primaryDisplay : '';
            yTime = secondaryTime;
            xTime = primaryTime;
            yIndicatorName = secondaryIndicatorName;
            xIndicatorName = primaryIndicatorName;
            break;
        case 'x':
            yMeasure = primaryMeasurementType;
            xMeasure = secondaryMeasurementType;
            yValue = "Value_1";
            xValue = "Value_2";
            yDisplay = primaryDisplay ? primaryDisplay : '';
            xDisplay = secondaryDisplay ? secondaryDisplay : '';
            yTime = primaryTime;
            xTime = secondaryTime;
            yIndicatorName = primaryIndicatorName;
            xIndicatorName = secondaryIndicatorName;
            break;
    }

    console.log("---------------------------------------------------------------------");
    console.log("indicatorName [links.js] ->", primaryIndicatorName);
    console.log("secondaryIndicator name [links.js] ->", secondaryIndicatorName);
    console.log("---------------------------------------------------------------------");
    console.log("primaryMeasurementType [links.js] ->", primaryMeasurementType)
    console.log("secondaryMeasurementType [links.js] ->", secondaryMeasurementType)
    console.log("---------------------------------------------------------------------");
    console.log("primaryTime [links.js] ->", primaryTime)
    console.log("secondaryTime [links.js] ->", secondaryTime)
    console.log("---------------------------------------------------------------------");

    // console.log("joinedDataLinksObjects [links.js]", joinedDataLinksObjects);
    // console.log("xMeasure [links.js]", xMeasure);
    // console.log("yIndicatorname [links.js]", indicatorName);
    // console.log("yMeasure [links.js]", yMeasure);

    setTimeout(() => {
        var spec2 = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
            "width": "container",
            "height": "container",
            "config": {
                "background": "#FFFFFF",
                "title": { "anchor": "start", "fontSize": 18, "font": "Calibri" },
                "axisX": {
                    // "domain": true,
                    // "domainColor": "#000000",
                    // "domainWidth": 1,
                    // "grid": false,
                    // "labelFontSize": 14,
                    // "labelAngle": 0,
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
                    // "labelFontSize": 14,
                    // "labelPadding": 8,
                    // "ticks": false,
                    "titleFontSize": 12,
                    "titlePadding": 10,
                    // "titleFont": "Calibri",
                    // "titleAngle": -90,
                    // "titleY": 0,
                    // "titleX": 0
                },
                "legend": {
                    "labelFontSize": 14,
                    "symbolSize": 140
                },
                "view": { "stroke": "transparent" },
                "range": {
                    "category": [
                        "#1696d2",
                        "#fdbf11",
                        "#55b748",
                        "#ec008b",
                        "#d2d2d2"
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
                "values": joinedData
            },
            "mark": { "type": "circle", "filled": true, "size": 500, "stroke": "#727272", "strokeWidth": 2 },
            "params": [
                {
                    "name": "hover",
                    "select": { "type": "point", "on": "mouseover" }
                }
            ],
            "encoding": {
                "y": {
                    "title": [`${yIndicatorName && `${yIndicatorName}`}`, `- ${yMeasure} ${yDisplay && `(${yDisplay})`} ${yTime}`],
                    "field": yValue,
                    "type": "quantitative",
                    // "labelAngle": 0
                },
                "x": {
                    "title": `${xIndicatorName && `${xIndicatorName} - `} ${xMeasure} ${xDisplay && `(${xDisplay})`} ${xTime}`,
                    "field": xValue,
                    "type": "quantitative"
                },
                "tooltip": [
                    {
                        "title": "Time",
                        "field": "Time_2",
                        "type": "nominal"
                    },
                    {
                        "title": "Geography",
                        "field": "Geography_1",
                        "type": "nominal"
                    },
                    {
                        "title": yMeasure,
                        "field": yValue,
                        "type": "quantitative"
                    },
                    {
                        "title": xMeasure,
                        "field": xValue,
                        "type": "quantitative"
                    }
                ],
                "color": {
                    "title": "Geography",
                    "field": "Geography_1",
                    "type": "nominal"
                },
                "opacity": {
                    "condition": {
                        "param": "hover",
                        "value": 1
                    },
                    "value": 0.5
                }
            }
        }

        vegaEmbed("#links", spec2);
    }, 300)


}