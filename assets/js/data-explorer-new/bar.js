// ======================================================================= //
// bar.js
// ======================================================================= //

console.log(">> bar.js");

const renderBar = (
    data, 
    metadata
) => {

    console.log("** renderBar");

    // document.getElementById('viewDescription').innerHTML = 'Hover over the map or chart for more information.'

    console.log("data [renderBar]", data);
    console.log("metadata [renderBar]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const barTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // console.log("barTimes [bar.js]", barTimes);

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let barGeoType            = data[0]?.GeoType;
    // let barMeasurementType    = metadata[0]?.MeasurementType;
    let barTime = barTimes[0];
    let displayType;
    let subtitle;
    let isPercent;
    let topoFile = '';

    const hasCI = data.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    // console.log('has CI?', hasCI)



    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // use some conditionals
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if (barMeasurementType.includes('Percent') || barMeasurementType.includes('percent') && !barMeasurementType.includes('percentile')) {
    //     isPercent = true;
    //     displayType = '%';
    //     subtitle = barMeasurementType;
        
    // } else {
    //     isPercent = false;
    //     displayType = metadata[0]?.DisplayType;
    //     subtitle = barMeasurementType + `${displayType ? ` (${displayType})` : ''}`;
    // }


    /* ----------------------------------------------------------------------- //
    // modify bar spec:
        - If the measurement Type is a mean, then give it a dot with a gray bar. Dots better represent Means.
        - if the data has CIs, then, give a gray CI bar
        - Else, just give a standard bar
    // -----------------------------------------------------------------------  */

    let barChart
    
    // if (barMeasurementType.includes('Mean') || barMeasurementType.includes('mean')) {

    // } else if (hasCI == true) {

    // } else {
        
    // }


    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    let barspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
            "text": indicatorName,
            "subtitlePadding": 10,
            "fontWeight": "normal",
            "anchor": "start", 
            "fontSize": 18, 
            "font": "sans-serif",
            "baseline": "top",
            "subtitle": subtitle,
            "subtitleFontSize": 13
        },
        "data": {
            "values": data,
            "format": {
                "parse": {
                    "Value": "number"
                }
            }
        },
        "config": {
            "concat": {"spacing": 20}, 
            "view": {"stroke": "transparent"},
            "axisY": {"domain": false,"ticks": false,"labelBaseline": "bottom",},
            "legend": {"disable": true},
            "scale": {"invalid": {color: {value: '#808080'}}}
        },
        "transform": [
            {
                "calculate": `datum.DisplayValue + ' ${displayType}'`,
                "as": "valueLabel"
            },
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[0] : null",
                "as": "ciLow"
            },
            {
                "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[1] : null",
                "as": "ciHigh"
            },
            {
            "calculate": "datum.CI ? replace(replace(datum.CI, /[()]/g, ''), /, /, ' to ') : null",
            "as": "CInoParens"
            }
        ],
        "height": 500,
        "width": "container",
        "layer": [
            {
                "mark": {"type": markType, "invalid": null},
                "params": [
                    {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
                ],
                "transform": [
                    {
                        "lookup": "GeoID",
                        "from": {
                            "data": {
                                "url": `${data_repo}${data_branch}/geography/${topoFile}`,
                                "format": {"type": "topojson", "feature": "collection"}
                            },
                            "key": "properties.GEOCODE"
                        },
                        "as": "geo"
                    }
                ],
                "encoding": {
                    ...encode,
                    "color": {
                        "bin": false,
                        "field": "Value",
                        "type": "quantitative",
                        "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
                        ...legend    
                    },
                    "stroke": {
                        "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                        "value": "#2d2d2d"
                    },
                    "strokeWidth": {
                        "condition": [{"param": "highlight", "empty": false, "value": strokeWidth}],
                        "value": 0.5
                    },
                    "order": {
                        "condition": [{"param": "highlight", "empty": false, "value": 1}],
                        "value": 0
                    },
                    "tooltip": [
                        {
                            "field": "Geography", 
                            "title": "Neighborhood"
                        },
                        {
                            "field": "valueLabel",
                            "title": `${barMeasurementType}`
                        },
                        {
                            "field": "TimePeriod",
                            "title": "Time period"
                        }
                    ],
                },
            }
        ]
    }

    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#bar", barspec,{
        actions: {
            export: { png: false, svg: false },
            source: false,  
            compiled: false, 
            editor: true 
        }
    });

    // send info for printing
    vizYear = barTime;
    vizGeography = barGeoType;
    // vizSource = metadata[0].Sources
    printSpec = barspec;
    chartType = 'bar'

    // console.log(barspec)

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...barspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${barMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
        .select(aq.not('GeoRank', "end_period", "start_period", "ban_summary_flag", "GeoTypeShortDesc", "MeasureID", "DisplayValue")) // remove excess columns
    
    // console.log("downloadTable [renderBar]");
    // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}