const renderLinksChart = (
    data,
    primaryMetadata,   // indicators.json for main indicator
    secondaryMetadata, // indciators.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    // get measure metadata

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryDisplay         = primaryMetadata[0].DisplayType;
    const primaryTime            = primaryMetadata[0].AvailableTimes[0].TimeDescription;
    const primaryAxis            = primaryMetadata[0].VisOptions[0].Links[0].Axis;

    const primaryGeoType = data[0].GeoType;
    const primaryGeoTypeDescription = 
        primaryMetadata[0].AvailableGeographyTypes.filter(
            gt => gt.GeoType === primaryGeoType
        )[0].GeoTypeDescription;    

    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryDisplay         = secondaryMetadata[0].DisplayType;
    const secondaryTime            = selectedlinksSecondaryMeasureTime;

    // get measureNames from data
    
    const measureName_1 = [...new Set(data.map(d => d.MeasureName_1))][0];
    const measureName_2 = [...new Set(data.map(d => d.MeasureName_2))][0];


    // switch field assignment based on axis preference

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

    switch (primaryAxis) {
        case 'y':
            yMeasure = secondaryMeasurementType;
            xMeasure = primaryMeasurementType;
            yMeasureName = measureName_2;
            xMeasureName = measureName_1;
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
            yMeasureName = measureName_1;
            xMeasureName = measureName_2;
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

    // define spec

    setTimeout(() => {

        var linkspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
            "title": {
                "text": `${yIndicatorName}`,
                // "subtitle": `${yIndicatorName}`,
                "subtitlePadding": 10
            },            
            "width": "container",
            "height": "container",
            "config": {
                "background": "#FFFFFF",
                "title": { "anchor": "start", "fontSize": 12, "font": "Calibri" },
                "axisX": {
                    // "domain": true,
                    // "domainColor": "#000000",
                    // "domainWidth": 1,
                    // "grid": false,
                    "labelFontSize": 11,
                    "titleFontSize": 12,
                    "titleFont": "Calibri"
                    // "labelAngle": 0,
                    // "tickColor": "#000000",
                    // "tickSize": 5,
                    // "titlePadding": 10
                },
                "axisY": {
                    // "domain": false,
                    // "domainWidth": 1,
                    // "grid": true,
                    // "gridColor": "#DEDDDD",
                    // "gridWidth": 1,
                    "labelFontSize": 11,
                    "titleFontSize": 0,
                    // "labelPadding": 8,
                    "labelAngle": 0,
                    // "ticks": false,
                    "titlePadding": 10
                    // "titleFont": "Calibri",
                    // "titleAngle": -90
                    // "titleY": 0,
                    // "titleX": 0
                },
                // "legend": {
                //     "labelFontSize": 14,
                //     "symbolSize": 140
                // },
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
                "values": data
            },
            "mark": { "type": "circle", "filled": true, "size": 250, "stroke": "#7C7C7C", "strokeWidth": 2 },
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
                    "title": [`${yIndicatorName && `${yIndicatorName}`}`, `- ${yMeasure} ${yDisplay && `(${yDisplay})`} ${yTime}`],
                    "field": yValue,
                    "type": "quantitative"
                },
                "x": {
                    "title": [`${xIndicatorName && `${xIndicatorName}`}`, `- ${xMeasure} ${xDisplay && `(${xDisplay})`} ${xTime}`],
                    "field": xValue,
                    "type": "quantitative"
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
                    "title": "Borough",
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
                        "value": "#252525"
                    },
                    "value": "#7C7C7C"
                }
            }
        }

        vegaEmbed("#links", linkspec);

    }, 300)

}