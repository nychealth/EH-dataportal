const renderLinksChart = (
    data,
    primaryMetadata,   // indicators.json for primary indicator
    secondaryMetadata, // indciators.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    // get measure metadata

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryMeasureName     = primaryMetadata[0].MeasureName;
    const primaryDisplay         = primaryMetadata[0].DisplayType;
    const primaryTime            = primaryMetadata[0].AvailableTimes[0].TimeDescription;

    const primaryGeoType = data[0].GeoType; // from the actual data we're charting

    const primaryGeoTypeDescription = 
        primaryMetadata[0].AvailableGeographyTypes.filter(
            gt => gt.GeoType === primaryGeoType
        )[0].GeoTypeDescription;    

    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0].MeasureName
    const secondaryMeasureId       = secondaryMetadata[0].MeasureID
    const secondaryDisplay         = secondaryMetadata[0].DisplayType;
    const secondaryTime            = selectedlinksSecondaryMeasureTime;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links.filter(
            l => l.MeasureID === secondaryMeasureId
        )[0].SecondaryAxis;

    // console.log("secondaryMetadata", secondaryMetadata);
    // console.log("primaryMetadata", primaryMetadata);
    console.log("SecondaryAxis", SecondaryAxis);
    console.log("secondaryMeasureId", secondaryMeasureId);


    // switch field assignment based on SecondaryAxis preference

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

    switch (SecondaryAxis) {
        case 'x':
            xMeasure = secondaryMeasurementType;
            yMeasure = primaryMeasurementType;
            xMeasureName = secondaryMeasureName;
            yMeasureName = primaryMeasureName;
            xValue = "Value_2";
            yValue = "Value_1";
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
            xDisplay = primaryDisplay ? primaryDisplay : '';
            yDisplay = secondaryDisplay ? secondaryDisplay : '';
            xTime = primaryTime;
            yTime = secondaryTime;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            break;
    }

    // define spec

    setTimeout(() => {

        let linkspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
            "title": {
                "text": `${yIndicatorName}, ${yTime}`,
                // "subtitle": `${yIndicatorName}`,
                "subtitlePadding": 10
            },            
            "width": "container",
            "height": 500,
            "config": {
                "background": "#FFFFFF",
                "title": { 
                    "anchor": "start", 
                    "fontSize": 14, 
                    "font": "sans-serif",
                    "baseline": "top"
                },
                "axisX": {
                    // "domain": true,
                    // "domainColor": "#000000",
                    // "domainWidth": 1,
                    // "grid": false,
                    "labelFontSize": 11,
                    "titleFontSize": 13,
                    "titleFont": "sans-serif"
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
                    "titleFontSize": 0, // to turn off axis title
                    // "labelPadding": 8,
                    "labelAngle": 0,
                    // "ticks": false,
                    "titlePadding": 10,
                    "titleFont": "sans-serif",
                    // "titleAngle": -90
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
                        "#ec008b",
                        "#d2d2d2",
                        "#55b748"
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
            "mark": { "type": "circle", "filled": true, "size": 200, "stroke": "#7C7C7C", "strokeWidth": 2 },
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