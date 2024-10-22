// ======================================================================= //
// comparisons.js
// ======================================================================= //

const renderComparisonsChart = (
    data,
    metadata
) => {

    console.log("*** renderComparisonsChart");


    document.getElementById('viewDescription').innerHTML = 'Trends are shown by boro for stable rates.'

    // console.log("metadata [renderComparisonsChart]");
    // metadata.print()

    
    // console.log("data [renderComparisonsChart]");
    // data.print(Infinity)

    // console.log("data objects", data.objects());

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> "; // blank to start
    document.getElementById("trend-unreliability").classList.add('hide') // blank to start


    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += element;
        document.getElementById('trend-unreliability').classList.remove('hide')
        
    });

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //

    // dimensions

    let columns ;
    let xAxisLabelField;
    let chartView = document.getElementById('trend')
        if (window.innerWidth < 340) {
            columns = 1
        } else if (window.innerWidth < 440) {
            columns = 2
            xAxisLabelField = 'fallbackYear'
        } else if (window.innerWidth < 1200) {
            columns = 3
            xAxisLabelField = 'fallbackYear'
        } else {
            columns = 6
            xAxisLabelField = 'TimePeriodSplit'
        }

    let mobileLegend;
    if (window.innerWidth < 720) {
      mobileLegend =  {
        "orient": "bottom",
        "columns": 3,
        "title": ''
      }
    } else {
      mobileLegend = null
    }
    
    
    let height = window.innerWidth < 576 ? 350 : 500;

    // ticks

    let Value = data.array("Value");
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1

    // colors (black, blue, orange, magenta, green, purple)
    // alpha: hex 96 = 150(/255) = ~58/100

    let colors = [
        "#000000ff",
        "#374c80",
        "#bc5090",
        "#ef5675",
        "#ff764a",
        "#ffa600"
          ];

    // ----------------------------------------------------------------------- //
    // extract measure metadata for chart text
    // ----------------------------------------------------------------------- //
    
    let compName            = [... new Set(metadata.array("ComparisonName"))];
    let compIndicatorLabel  = [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes    = [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    let compNoCompare       = [... new Set(metadata.array("TrendNoCompare"))].filter(nc => nc != null)[0]

    // console.log('compMeasurementType', compMeasurementType)
    // console.log('compDisplayTypes', compDisplayTypes)

    // console.log(">>>> compNoCompare", compNoCompare);

    // console.log(">> compName", compName);
    // console.log(">> compIndicatorLabel", compIndicatorLabel);
    // console.log(">> compMeasurementType", compMeasurementType);


    // ----------------------------------------------------------------------- //
    // set chart text based on type of comparison
    // ----------------------------------------------------------------------- //

    let compGroupLabel;
    let plotSubtitle;
    let plotTitle;

    let suppressSubtitleBy = [564, 565, 566, 704, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730];

    // comparison group label is either measure, indicator, or combo. can include geo eventually

    if (compName[0] === "Boroughs") {

        // ----- by boros: 1 indicator, 1 measure, 5 boros --------------------------------------------------- //

        // console.log("boros");

        // console.log("indicatorName", indicatorName);

        // if this is a boro comparison, tweak some things

        compGroupLabel = [... new Set(data.array("Geography"))];
        let hasBoros = compGroupLabel.length > 1 ? true : false; 
        
        plotTitle = indicatorName;
        plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + (hasBoros ? "" : "");
        // console.log('compDisplayTypes 0: ', compDisplayTypes)
        
        if (compMeasurementType[0].includes('Percent') | compMeasurementType[0].includes('percent') && !compMeasurementType[0].includes('Percentile')) {
            compDisplayTypes = '%'
        } else {}

        comp_group_col = "Geography"

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);


    } else if (compIndicatorLabel.length == 1) {

        // ----- by measure: 1 indicator, 2+ measures, 1 citywide --------------------------------------------------- //

        // console.log("1 indicator");

        // console.log("indicatorName", indicatorName);
        
        let compId           = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle  = [... new Set(metadata.array("LegendTitle"))];
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))];

        // console.log("compId", compId);
        
        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");

        } else {

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }


        // if there's only 1 indicator label, use measurement type to label the groups

        compGroupLabel = compMeasurementType;
        comp_group_col = "MeasurementType"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length == 1) {

        // ----- by indicator: 2+ indicators, 1 measure, 1 citywide --------------------------------------------------- //

        // console.log("1 measure");

        // console.log("indicatorName", indicatorName);

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]

        // console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");
            // console.log('compDisplayTypes 1: ', compDisplayTypes)

        } else {

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
            // console.log('compDisplayTypes 2: ', compDisplayTypes)

        }

        // if there's only 1 measurement type, use indicator label to label the groups

        compGroupLabel = compIndicatorLabel;
        comp_group_col = "IndicatorLabel"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    } else if (compMeasurementType.length > 1 && compIndicatorLabel.length > 1) {
        
        // ----- by combo: 2+ indicators, 2+ measures, 1 citywide --------------------------------------------------- //

        // console.log("> 1 measure & indicator");

        // console.log("indicatorName", indicatorName);

        let compId = [... new Set(metadata.array("ComparisonID"))][0];
        let compLegendTitle = [... new Set(metadata.array("LegendTitle"))]
        let compY_axis_title = [... new Set(metadata.array("Y_axis_title"))]

        // console.log("compId", compId);

        plotTitle = compName;

        // suppress subtitle "by" part

        if (suppressSubtitleBy.includes(compId)) {

            // console.log(">>> SUPPRESS by", compId);

            plotSubtitle = compY_axis_title + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "");

        } else {

            plotSubtitle = compName + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;

        }

        // if there are more than 1 of both, use joined IndicatorMeasure 

        compGroupLabel = [... new Set(metadata.array("IndicatorMeasure"))];
        comp_group_col = "IndicatorMeasure"

        // reset column count based on number of lines

        columns = compGroupLabel.length > 3 ? 3 : columns;

        // console.log(">> compGroupLabel", compGroupLabel);
        // console.log(">> plotTitle", plotTitle);
        // console.log(">> plotSubtitle", plotSubtitle);

    }


    // ----------------------------------------------------------------------- //
    // create transform after pivot that replaces "undefined" with ""
    // ----------------------------------------------------------------------- //

    let compReplaceInvalid = compGroupLabel.map(x => {return {"calculate": `isValid(datum[\"${x}\"]) ? (datum[\"${x}\"] + ' ${compDisplayTypes}') : ""`, "as": `${x}`}})
    // console.log(compReplaceInvalid)

    // ----------------------------------------------------------------------- //
    // create tooltips JSON
    // ----------------------------------------------------------------------- //

    // will be spliced into the spec
    
    // let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal", "format": ",.1~f"}})
    let compTooltips = compGroupLabel.map(x => {return {"field": x, "type": "nominal"}})

    // console.log("compTooltips", compTooltips);


    // ----------------------------------------------------------------------- //
    // create "don't compare" line JSON
    // ----------------------------------------------------------------------- //

    // getting latest end period in the data

    let maxDataEndPeriod = Math.max(...new Set(data.array("end_period")))
    
    // getting "no compare" end period from time period metadata

    let noCompareEndPeriod = timeTable
        .filter(`d => d.TimePeriod == ${compNoCompare}`)
        .array("end_period")[0]

    // testing to see if the data has later time periods than the "no compare" time

    let hasGreaterEndPeriod = maxDataEndPeriod >= noCompareEndPeriod;

    // if there's a "no compare" time, and there's data later than that, show the line

    let noCompare;

    if (compNoCompare && hasGreaterEndPeriod) {

        // if a time period exists, return vertical rule JSON
        console.log('running noCompare')

        // print text
        let noCompareFootnote = `Because of a method change, data before ${compNoCompare} shouldn't be compared to later time periods.`
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-xs text-muted'>" + noCompareFootnote + "</div>" ;
        document.getElementById("trend-unreliability").classList.remove('hide')

        // convert to milliseconds format - this is necessary for compspec2
        const year = new Date(`${compNoCompare}-01-01T00:00:00Z`);
        compNoCompare = year.getTime() + 15768000000 // add half a year, for placement

        noCompare = [{
            "mark": "rule",
            "encoding": {
                "x": {
                    "datum": compNoCompare
                },
                "y": {}, // necessary to avoid multi-layering
                // "xOffset": {"value": 0.5},
                "color": {"value": "gray"},
                "size": {"value": 1},
                // "opacity": {"value": 0.5}
                "strokeDash": {"value": [2, 2]}
            }
        }]

    } else {

        // if no time period, return an empty array

        noCompare = []

    }




    // ----------------------------------------------------------------------- //
    // define spec [older spec, with vert rule tooltip]
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
            // "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5},
            
            "point": {"filled": true},
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values":  data.objects(),
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
                "field": "TimePeriod",
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
                            "interpolate": "linear",
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
                        "value": "DisplayValue",
                        "groupby": ["TimePeriod"],
                        "op": "max"
                    },
                    ...compReplaceInvalid
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
                            "field": "TimePeriod",
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
                                "TimePeriod"
                            ],
                            "nearest": true,
                            "on": "mouseover",
                            "clear": "mouseout"
                        }
                    }
                ]
            },
            ...noCompare
        ]
    }

    // ----------------------------------------------------------------------- //
    // Set tooltip differences for Air Quality AQ Action Days Indicators/measures
    // ----------------------------------------------------------------------- //

    let metadataObject = metadata.objects()
    // console.log(metadataObject)
    let comparisonToolTipLabel;
    if (metadataObject[0].ComparisonID === 566 || metadataObject[0].ComparisonID === 565 || metadataObject[0].ComparisonID === 564) {
      // console.log('AQ action days comparison')
      // actionDays = true
      comparisonToolTipLabel = 'Action days'
    }  else {
      // console.log('false')
      // actionDays = false
      comparisonToolTipLabel = compMeasurementType
    }

    // ----------------------------------------------------------------------- //
    // define alternate spec [currently using this one]
    // ----------------------------------------------------------------------- //

    let compspec2 = {
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
            "titlePadding": 10,
            "padding": 50
          },
          "axisY": {
            "labelAngle": 0, 
            "labelFontSize": 11, 
            "tickMinStep": tickMinStep, 
            "orient": "left",
            "labelBaseline": "bottom",
            "domain": false, 
            "ticks": false
          },
          "legend": {
            "columns": 6,
            "labelFontSize": 14,
            "symbolSize": 140,
            "offset": 55.55555555555556
          },
          "view": {"stroke": "transparent"},
          "line": {"color": "#1696d2", "stroke": "#1696d2"},
          "point": {"filled": true},
          "text": {"color": "#1696d2", "fontSize": 11, "fontWeight": 400, "size": 11}
        },
        "data": {
            "values": data.objects()
        },
        "width": "container",
        "height": 400,
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
        "transform": [
          {
            "calculate": `format(datum.Value, ',') + ' ${compDisplayTypes}'`, "as": "valueWithDisplay"
          },
          {"calculate": "split(datum.TimePeriod, ' ')", "as": "TimePeriodSplit"},
          {
            "calculate": "datum.TimePeriodSplit[datum.TimePeriodSplit.length - 1]",
            "as": "TimePeriodYear"
          },
          {"calculate": "year(datum.end_period)", "as": "year_end_period"},
          {
            "calculate": "datum.year_end_period % 2 === 0 ? datum.TimePeriodSplit : ''",
            "as": "fallbackYear"
          }
        ],
        "encoding": {
          "x": {
            "field": "end_period",
            "type": "quantitative",
            "title": null,
            "axis": {"labels": false, "grid": false, "ticks": false}
          },
          "y": {
            "field": "Value",
            "type": "quantitative",
            "title": null,
            "axis": {"tickCount": 4},
            "scale": {"domainMin": 0, "nice": true}
          },
          "color": {
            "condition": {
              "param": "hover",
              "field": comp_group_col,
              "type": "nominal",
              "sort": true,
              "legend": mobileLegend
            },
            "value": "gray"
          },
          "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.35},
          "strokeWidth": {
            "condition": { "test": "datum.Geography === 'New York City'", "value": 4},
            "value": 2.5
          },
          "tooltip": [
            {"title": "Time", "field": "TimePeriod"},
            {"title": "Group", "field": comp_group_col},
            {"title": comparisonToolTipLabel, "field": "valueWithDisplay"}
          ]
        },
        "layer": [
          {
            "description": "Transparent layer to easier trigger hover",
            "params": [
              {
                "name": "hover",
                "select": {
                  "type": "point",
                  "fields": [comp_group_col],
                  "on": "pointerover"
                }
              }
            ],
            "mark": {"type": "line", "stroke": "transparent","strokeWidth": 10}
          },
          {"mark": {
            "type": "line", 
            "point": {
                "size": 40, 
                "filled": false, 
                "fill": "white"
              }
            }
          },
          {
            "transform": [
              {
                "aggregate": [
                  {"op": "argmin", "field": "end_period", "as": "Value"},
                  {"op": "min", "field": "end_period", "as": "end_period"}
                ],
                "groupby": [comp_group_col]
              }
            ],
            "encoding": {
              "x": {"field": "end_period"},
              "y": {"field": "Value['Value']"},
              "text": {
                "condition": {"param": "hover", "field": comp_group_col, "empty": false},
                "value": ""
              }
            },
            "mark": {
                "type": "text", 
                "align": "left",
                "dx": -6, 
                "dy": -14,
                "fontSize": 14, 
                "fontWeight": "bold"}
          },
          {
            "mark": {"type": "text", "fontWeight": 100, "fontSize": 10},
            "transform": [
              {
                "aggregate": [{"op": "min", "field": "end_period", "as": "min_end_period"}],
                "groupby": [`${xAxisLabelField}`]
              }
            ],
            "encoding": {
              "x": {
                "field": "min_end_period",
                "type": "quantitative",
                "axis": {"labels": false, "grid": false, "ticks": false}
              },
              "y": {"value": 425},
              "text": {"field": xAxisLabelField, "type": "nominal"},
              "color": {"value": "black"}
            }
          },
          {
            "mark": {"type": "tick"},
            "encoding": {
              "x": {
                "field": "end_period",
                "type": "quantitative",
                "axis": {"labels": false, "grid": false, "ticks": true}
              },
              "y": {"value": 400},
              "color": {"value": "black"}
            }
          },
          ...noCompare
        ]
      }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    let vegaSpec = vegaLite.compile(compspec2).spec // compile to Vega to set axis layers as non-interactive
    console.log(compspec2)
    console.log(vegaSpec)
    vegaSpec.marks[3].interactive = false;          // set text layers to non-interactive
    vegaSpec.marks[4].interactive = false;          // set axis layers to non-interactive
    vegaSpec.marks[5].interactive = false;

    vegaSpec.marks[6] ? vegaSpec.marks[6].interactive = false : {}; // if noCompare, set that layer to interactive: false

    if (vegaSpec.marks[6]) {
      console.log('no compare layer exists')
    } else {
      console.log('no no compare layer')
    }

    console.log(vegaSpec)
    
    vegaEmbed("#trend", vegaSpec,{
      actions: {
        export: { png: false, svg: false },
        source: false,  
        compiled: false, 
        editor: true 
      }
    });

    // send info for printing
    vizSource = metadataObject[0].Sources
    printSpec = compspec2;
    chartType = 'trend'


    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...compspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${plotTitle} ${plotSubtitle}'`}) // add indicator name and type column
        .select(aq.not("GeoType", "GeoTypeDesc", "GeoTypeShortDesc", "GeoRank", "MeasureID", "ban_summary_flag", "DisplayValue", "start_period", "end_period"))

        // console.log("downloadTable [renderComparisonsChart]");
        // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()
    
}