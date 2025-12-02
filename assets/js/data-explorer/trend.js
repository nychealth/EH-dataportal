// ======================================================================= //
// trend.js
// ======================================================================= //

const renderTrendChart = (
    data,
    metadata
) => {

    console.log("*** renderTrendChart");

    let mdo = metadata.objects()
    mdo[0].ComparisonName === 'Boroughs' ? document.getElementById('viewDescription').innerHTML = 'Trends are shown by borough for stable rates.' : document.getElementById('viewDescription').innerHTML = ''

    // console.log("metadata [renderTrendChart]");
    // metadata.print()
    
    // console.log("data [renderTrendChart]");
    // data.print(Infinity)

    // console.log("data objects", data.objects());

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> "; // blank to start
    document.getElementById("trend-unreliability").classList.add('hide') // blank to start


    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-xs'>" + element + "</div>" ;
        document.getElementById('trend-unreliability').classList.remove('hide')
        
    });

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //

    // dimensions

    let columns ;
    let xAxisLabelField;
    if (window.innerWidth < 340) {
        columns = 1
    } else if (window.innerWidth < 440) {
        columns = 2
        xAxisLabelField = 'fallbackYear' // use fallbackYear for narrow screens, to label every other x-axis interval
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
    
    
    // ticks

    let Value = data.array("Value");
    let valueMax = Math.max.apply(null, Value);
    let tickMinStep = valueMax >= 3.0 ? 1 : 0.1


    // ----------------------------------------------------------------------- //
    // extract measure metadata for chart text
    // ----------------------------------------------------------------------- //
    
    let compName            = [... new Set(metadata.array("ComparisonName"))];
    let compIndicatorLabel  = [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compDisplayTypes    = [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    let compNoCompare       = [... new Set(metadata.array("TrendNoCompare"))].filter(nc => nc != null)[0]
    let compThresholds      = [... new Set(metadata.array("TrendThreshold"))]

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
    // create Threshold line
    // ----------------------------------------------------------------------- //
    
    // console.log(compThresholds)
    
    let dedupedThresholds = compThresholds.flat().filter(item => item !== null);
    
    // Step 2: Deduplicate the array of objects
    let uniqueThresholds = [
        ...new Map(dedupedThresholds.map(item => [JSON.stringify(item), item])).values()
    ];

    // console.log('unique thresholds')
    // console.log(uniqueThresholds);

    let thresholdSpec = []

    // loop through unique Thresholds
    for (let i = 0; i < uniqueThresholds.length; i ++ ) {

        let value = i + 1
        
        let thresholdLine = {
            "description": `line layer ${value}`,
            "mark": "line",
            "encoding": {
                "x": {"field": "end_period", "type": "temporal"},
                "y": {"datum": uniqueThresholds[i].yValue},
                "color": {"value": "#545454"},
                "size": {"value": 2},
                "strokeDash": {"value": [2, 2]}
            }
        }
        
        let thresholdLabel = {
            "description": `label layer ${value}`,
            "mark": {
                "type": "text",
                "align": "right",
                "baseline": "middle",
                "color": "#545454",
                "dy": -10,
                "dx": -45
            },
            "encoding": {
                "x": {"aggregate": "max", "field": "end_period", "type": "temporal"},
                "y": {"datum": uniqueThresholds[i].yValue, "type": "quantitative"},
                "text": {"value": uniqueThresholds[i].title}
            }
        }
        
        thresholdSpec.push(thresholdLine)
        thresholdSpec.push(thresholdLabel)
    }

      // console.log(thresholdSpec)

    // loop through uniqueThresholds and create line json


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
        // console.log('running noCompare')

        // print text
        let noCompareFootnote = `A change in sampling methods in ${compNoCompare} may explain some differences in estimates from earlier years.`
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-xs'>" + noCompareFootnote + "</div>" ;
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
                "color": {"value": "gray"},
                "size": {"value": 1},
                "strokeDash": {"value": [2, 2]}
            }
        }]

    } else {

        // if no time period, return an empty array

        noCompare = []

    }


    // ----------------------------------------------------------------------- //
    // Set tooltip differences for Air Quality AQ Action Days Indicators/measures
    // ----------------------------------------------------------------------- //

    let metadataObject = metadata.objects()
    let comparisonToolTipLabel;
    if (metadataObject[0].ComparisonID === 566 || metadataObject[0].ComparisonID === 565 || metadataObject[0].ComparisonID === 564) {
      // console.log('AQ action days comparison')
      comparisonToolTipLabel = 'Action days';
    }  else {
      // console.log('false')
      comparisonToolTipLabel = compMeasurementType;
    }

    // ----------------------------------------------------------------------- //
    // define spec
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
                "titlePadding": 10
            },
            "axisY": {"labelAngle": 0, "labelFontSize": 11, "tickMinStep": tickMinStep},
            "legend": {"columns": 3,"labelFontSize": 12,
                "symbolSize": 140,
                "offset": 45},
                "view": {"stroke": "transparent"},
                "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 2.5},
                "point": {"filled": true},
                "text": {"color": "#1696d2", "fontSize": 11, "fontWeight": 400, "size": 11}
            },
            "data": {
                "values": data.objects(),
                "format": {
                    "parse": {
                        "TimePeriod": "string"
                    }
                }
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
                // adds display to value
                {
                    "calculate": `datum.DisplayValue + ' ${compDisplayTypes}'`, "as": "valueWithDisplay"
                },
                // gets index position of row
                {
                    "window": [
                        {
                            "op": "row_number",
                            "as": "index"
                        }
                    ]
                },
                // splits quarters, if it's quarterly data
                {
                    "calculate": "datum.TimeType === 'quarter' ? replace(datum.TimePeriod, /-Q/, ' Q') : datum.TimePeriod",
                    "as": "TimeSplit1"
                    
                }, 
                // splits other data if it's long strings
                {
                    "calculate": "split(datum.TimeSplit1, ' ')",
                    "as": "TimePeriodSplit"
                    
                },
                
                {
                    "calculate": "datum.TimePeriodSplit[datum.TimePeriodSplit.length - 1]",
                    "as": "TimePeriodYear"
                },
                {
                    "calculate": "year(datum.end_period)", 
                    "as": "year_end_period"
                },
                // calculates every other year for x-axis label, as long as it's not quarterly data
                {
                    "calculate": "(datum.TimeType !== 'quarter' && datum.year_end_period % 2 === 0) ? datum.TimePeriodSplit : (datum.TimeType === 'quarter' ? datum.TimePeriodSplit : '')",
                    "as": "fallbackYear"
                },
                {
                    "joinaggregate": [
                    {"op": "max", "field": "Value", "as": "maxVal"}
                    ]
                }
            ],
            "encoding": {
                "x": {
                    "field": "end_period",
                    "type": "temporal",
                    "title": null,
                    "axis": {"ticks": false,"labels": false},
                    "scale": {
                        "padding": 20 
                    }
                }
            },
            "layer": [
                {
                    "description": "Transparent layer to trigger hover",
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
                    "mark": {"type": "line", "stroke": "transparent", "strokeWidth": 15}
                },
                {
                    "description": "Encoding layer",
                    "encoding": {
                        "color": {
                            "field": comp_group_col,
                            "type": "nominal",
                            "sort": true,
                            "legend": mobileLegend
                        },
                        "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.2},
                        "y": {
                            "field": "Value",
                            "type": "quantitative",
                            "title": null,
                            "axis": {"tickCount": 4},
                            "scale": {"domainMin": 0, "nice": true}
                        },
                        "tooltip": [
                            {
                                "title": "Time",
                                "field": "TimePeriod",
                                "type": "nominal"
                            },
                            {"title": "Group", "field": comp_group_col},
                            {"title": comparisonToolTipLabel, "field": "valueWithDisplay"}
                        ]
                    },
                    "layer": [
                        {
                            "description": "Establish line",
                            "mark": {
                                "type": "line",
                                "interpolate": "linear",
                                "point": {
                                    "filled": false,
                                    "fill": "white",
                                    "size": 40,
                                    "strokeWidth": 2.5,
                                    "tooltip": true
                                }
                            }
                        },
                        {
                            "description": "Hover text",
"transform": [
  {
    "aggregate": [
      {"op": "argmax", "field": "end_period", "as": "endDate"},
      {"op": "max", "field": "end_period", "as": "end_period"}
    ],
    "groupby": ["Geography"]
  },
  {
    "window": [{"op": "row_number", "as": "order"}],
    "sort": [{"field": "endDate.Value", "order": "ascending"}]
  },
  {"window": [{"op": "count", "as": "totalCount"}]},
  {"calculate": "(datum.totalCount + 1) / 2", "as": "medianOrder"},
  {
    "joinaggregate": [
      {"op": "median", "field": "endDate.Value", "as": "medianValue"},
      {"op": "max", "field": "endDate.Value", "as": "maxVal"}
    ]
  },
  {
    "calculate": "datum.medianValue - datum.endDate.Value",
    "as": "valueDiff"
  },
  {
    "calculate": "datum.endDate.Value + (datum.valueDiff / datum.maxVal * -15)",
    "as": "labelValue"
  }
],
                            "encoding": {
                                "y": {"field": "labelValue"},
                                "text": {
                                        "field": comp_group_col,
                                }
                            },
                            "mark": {
                                "type": "text",
                                "align": "left",
                                "dx": 5,
                                "dy": {
                                    "expr": "datum.dyOffset"
                                },
                                "fontSize": 11,
                                "fontWeight": "bold"
                            }
                        }
                    ]
                },
                ...noCompare,
                ...thresholdSpec,
                {
                    "mark": {"type": "tick"},
                    "encoding": {
                        "x": {
                            "field": "end_period",
                            "type": "temporal",
                            "axis": {"labels": false, "grid": false, "ticks": true},
                            "scale": {"padding": 20}
                        },
                        "y": {"value": 400},
                        "color": {"value": "black"}
                    }
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
                            "type": "temporal",
                            "axis": {"labels": false, "grid": false, "ticks": false}
                        },
                        "y": {"value": 415},
                        "text": {"field": xAxisLabelField, "type": "nominal"},
                        "color": {"value": "black"}
                    }
                },
            ]
        };
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //
    
    vegaEmbed("#trend", compspec2,{
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

    let dataForDownload = [...compspec2.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${plotTitle} ${plotSubtitle}'`}) // add indicator name and type column
        .select(aq.not("GeoType", "GeoTypeDesc", "GeoTypeShortDesc", "GeoRank", "MeasureID", "ban_summary_flag", "DisplayValue", "start_period", "end_period"))

    // console.log("downloadTable [renderTrendChart]");
    // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()
    
}