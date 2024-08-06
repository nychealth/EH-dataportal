// ======================================================================= //
// comparisons.js
// ======================================================================= //

const renderComparisonsChart = (
    data,
    metadata
) => {

    console.log("*** renderComparisonsChart");

    // console.log("metadata [renderComparisonsChart]");
    // metadata.print()
    
    // console.log("data [renderComparisonsChart]");
    // data.print()

    // console.log("data objects", data.objects());

    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comp_unreliability = [...new Set(data.objects().map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start
    document.getElementById("trend-unreliability").classList.add('hide') // blank to start


    comp_unreliability.forEach(element => {

        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        document.getElementById('trend-unreliability').classList.remove('hide')

        
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
    
    let compName            = [... new Set(metadata.array("ComparisonName"))];
    let compIndicatorLabel  = [... new Set(metadata.array("IndicatorLabel"))];
    let compMeasurementType = [... new Set(metadata.array("MeasurementType"))];
    let compMeasureIDs      = [... new Set(metadata.array("MeasureID"))];
    let compDisplayTypes    = [... new Set(metadata.array("DisplayType"))].filter(dt => dt != "");
    let compNoCompare       = [... new Set(metadata.array("TrendNoCompare"))].filter(nc => nc != null)[0]

    console.log('compMeasurementType', compMeasurementType)
    console.log('compDisplayTypes', compDisplayTypes)

    console.log(">>>> compNoCompare", compNoCompare);

    // console.log(">> compName", compName);
    // console.log(">> compIndicatorLabel", compIndicatorLabel);
    // console.log(">> compMeasurementType", compMeasurementType);

    // determining quarters

    let hasQuarters = [858, 859, 860, 861, 862, 863];

    let quarter_measure = hasQuarters.some(item => compMeasureIDs.includes(item));

    console.log("MeasureIDs", compMeasureIDs, "hasQuarters", hasQuarters, "quarter_measure", quarter_measure);

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
        console.log('compDisplayTypes 0: ', compDisplayTypes)
        
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
            console.log('compDisplayTypes 1: ', compDisplayTypes)

        } else {

            plotSubtitle = compMeasurementType + (compDisplayTypes.length > 0 ? ` (${compDisplayTypes})` : "") + " by " + compLegendTitle;
            console.log('compDisplayTypes 2: ', compDisplayTypes)

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

        noCompare = [{
            "mark": "rule",
            "encoding": {
                "x": {
                    "datum": compNoCompare
                },
                "xOffset": {"value": 0.5},
                "color": {"value": "gray"},
                "size": {"value": 2},
                "strokeDash": {"value": [2, 2]}
            }
        }]

        let noCompareFootnote = `Because of a method change, data before ${compNoCompare} shouldn't be compared to later time periods.`
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + noCompareFootnote + "</div>" ;


    } else {

        // if no time period, return an empty array

        noCompare = []

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
                "title": null,
                // "labelExpre": "datum.TimePeriod[0]"
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
                        "groupby": ["end_period", "TimePeriod"],
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
    // render chart
    // ----------------------------------------------------------------------- //
    
    vegaEmbed("#trend", compspec);

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