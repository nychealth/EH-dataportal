// ======================================================================= //
// links.js
// ======================================================================= //

const renderLinksChart = (
    data,
    primaryMetadata,   // metadata.json for primary indicator
    secondaryMetadata, // metadata.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    document.getElementById('viewDescription').innerHTML = 'View scatterplots, correlations, and disparities.'
    document.getElementById('correlateHolder').classList.remove('hide')


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

    const primaryMeasurementType = primaryMetadata[0]?.MeasurementType;
    const primaryMeasureName     = primaryMetadata[0]?.MeasureName;

    let primaryDisplay
    let primaryMeasurementDisplay

    if (primaryMeasurementType.includes('Percent') || primaryMeasurementType.includes('percent') && !primaryMeasurementType.includes('percentile')) {
        primaryDisplay = '%' // assigns a % displayType for anything that includes percent (but NOT percentile) in its measurementType
        primaryMeasurementDisplay = primaryMeasurementType 
    } else {
        primaryDisplay         = "" + primaryMetadata[0]?.DisplayType; // else, the pre-existing assignment
        primaryMeasurementDisplay = primaryMeasurementType + ` (${primaryDisplay})`

    }

    const primaryTimePeriod      = data[0]?.TimePeriod_1;
    const geoTypeShortDesc       = data[0]?.GeoTypeShortDesc_1;

    const secondaryMeasurementType = secondaryMetadata[0]?.MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0]?.MeasureName
    const secondaryMeasureId       = secondaryMetadata[0]?.MeasureID

    let secondaryDisplay;
    let secondaryMeasurementDisplay;
    if (secondaryMeasurementType.includes('Percent') || secondaryMeasurementType.includes('percent') && !secondaryMeasurementType.includes('percentile')) {
        secondaryDisplay = '%' // assigns a % displayType for anything that includes percent (but NOT percentile) in its measurementType
        secondaryMeasurementDisplay = secondaryMeasurementType
    } else {
        secondaryDisplay         = "" + secondaryMetadata[0]?.DisplayType; // else, the pre-existing assignment
        secondaryMeasurementDisplay = secondaryMeasurementType + ` (${secondaryDisplay})`
    }

    const secondaryTimePeriod      = data[0]?.TimePeriod_2;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links[0].Measures.filter(
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
    let xTimePeriod;
    let yTimePeriod;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;
    let xAxisLabel;
    let yAxisLabel;

    switch (SecondaryAxis) {
        case 'x':
            xMeasure       = secondaryMeasurementType;
            yMeasure       = primaryMeasurementType;
            xMeasureName   = secondaryMeasureName;
            yMeasureName   = primaryMeasureName;
            xValue         = "Value_2";
            yValue         = "Value_1";
            xMin           = Math.min.apply(null, Value_2); // get min value for adjusting axis
            xDisplay       = secondaryDisplay ? secondaryDisplay : '';
            yDisplay       = primaryDisplay ? primaryDisplay : '';
            xTimePeriod    = secondaryTimePeriod;
            yTimePeriod    = primaryTimePeriod;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            xAxisLabel     = [secondaryIndicatorName, `${secondaryMeasurementType} (${secondaryTimePeriod})`]
            yAxisLabel     = primaryMeasurementDisplay + ` (${yTimePeriod})` 
            break;
        case 'y':
            xMeasure       = primaryMeasurementType;
            yMeasure       = secondaryMeasurementType;
            xMeasureName   = primaryMeasureName;
            yMeasureName   = secondaryMeasureName;
            xValue         = "Value_1";
            yValue         = "Value_2";
            xMin           = Math.min.apply(null, Value_1); // get min value for adjusting axis
            xDisplay       = primaryDisplay ? primaryDisplay : '';
            yDisplay       = secondaryDisplay ? secondaryDisplay : '';
            xTimePeriod    = primaryTimePeriod;
            yTimePeriod    = secondaryTimePeriod;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            xAxisLabel     = [primaryIndicatorName, `${primaryMeasurementType} (${primaryTimePeriod})`]
            yAxisLabel     = secondaryMeasurementDisplay + ` (${yTimePeriod})`  
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
        document.getElementById('links-unreliability').classList.remove('hide')
 
    });

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //

    let linkspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": [`${yIndicatorName && `${yIndicatorName}`}`],
            "align": "left", 
            "anchor": "start", 
            "fontSize": 18, 
            "fontWeight": "normal",
            "font": "sans-serif",
            "baseline": "top",
            "dy": -10,
            "subtitle": yAxisLabel,
            "subtitleFontSize": 13,
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
                "tickMinStep": 1,
                "domain": false,
                "ticks": false,
                "labelBaseline": "bottom"
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
                    "#40826D",
                    "#000F89",
                    "#a05195",
                    "#d45087",
                    "#ffa600" 
                    ]
            }
        },
        "data": {
            "values": data
        },
        "transform": [
            {
                "calculate": `format(datum.${xValue}, '.1f') + ' ${xDisplay}'`,
                "as": "xLabel"
            },
            {
                "calculate": `format(datum.${yValue},  '.1f') + ' ${yDisplay}'`,
                "as": "yLabel"
            }
        ],
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
                        "title": xAxisLabel,
                        "field": xValue,
                        "type": "quantitative",
                        "scale": {"domainMin": xMin, "nice": true},
                        "axis": {
                            "titleAlign": "center",
                            "tickCount": 4
                          }
                    },
                    "tooltip": [
                        {
                            "title": geoTypeShortDesc,
                            "field": "Geography_1",
                            "type": "nominal"
                        },
                        {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        {
                            "title": yMeasureName,
                            "field": "yLabel",
                            "type": "nominal"
                        },
                        {
                            "title": xMeasureName,
                            "field": "xLabel",
                            "type": "nominal"
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
            {
                "mark": {
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

    vegaEmbed("#links", linkspec,{
        actions: {
          export: { png: false, svg: false },
          source: false,  
          compiled: false, 
          editor: true 
        }
      });

    // set for printing
    printSpec = linkspec;
    chartType = 'links'
    vizSource = primaryMetadata[0].Sources
    vizSourceSecond = secondaryMetadata[0].Sources

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...linkspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .select(aq.not("GeoType", "GeoTypeShortDesc_1", "GeoTypeShortDesc_2", "GeoRank_1", "GeoRank_2", "start_period_1", "end_period_1", "ban_summary_flag_1", "ban_summary_flag_2", "BoroID", "DisplayValue_1", "DisplayValue_2", "GeoTypeDesc_2", "Geography_2", "start_period_2", "end_period_2", "MeasureID_1", "MeasureID_2"))
        .derive({ Value_1_Indicator: `'${yIndicatorName} - ${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`}'`})
        .derive({ Value_2_Indicator: `'${xIndicatorName} - ${xMeasure} ${xDisplay && `(${xDisplay})`} '`})
        
        // console.log("downloadTable [renderLinksChart]");
        // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}