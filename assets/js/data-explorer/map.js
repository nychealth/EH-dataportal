// ======================================================================= //
// map.js
// ======================================================================= //

const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");

    document.getElementById('viewDescription').innerHTML = 'This map shows data by different boundaries.'

    // console.log("data [renderMap]", data);
    // console.log("metadata [renderMap]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // console.log("mapTimes [map.js]", mapTimes);

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let mapGeoType            = data[0]?.GeoType;
    // let geoTypeShortDesc      = data[0]?.GeoTypeShortDesc;
    // let GeoTypeDesc           = data[0]?.GeoTypeDesc;
    let mapMeasurementType    = metadata[0]?.MeasurementType;
    let mapGeoTypeDescription = [...new Set(geoTable.filter(aq.escape(d => d.GeoType === mapGeoType)).array("GeoTypeShortDesc"))];
    let mapTime = mapTimes[0];
    let displayType;
    let subtitle;
    let isPercent;
    let topoFile = '';


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // use some conditionals
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    if (mapMeasurementType.includes('Percent') || mapMeasurementType.includes('percent') && !mapMeasurementType.includes('percentile')) {
        isPercent = true
        displayType         = '%'
        subtitle = mapMeasurementType
        
    } else {
        isPercent = false
        displayType         = metadata[0]?.DisplayType;
        subtitle = mapMeasurementType + `${displayType ? ` (${displayType})` : ''}`
    }


    // ----------------------------------------------------------------------- //
    // bubble map for non-rates (counts/numbers)
    // ----------------------------------------------------------------------- //

    let markType = 'geoshape'  
    let encode = {"shape": {"field": "geo", "type": "geojson"}}
    let strokeWidth = 1.25
    let legend;

    if (mapMeasurementType.includes('Number') ||
        mapMeasurementType.includes('number') || 
        mapMeasurementType.includes('Total population')
    ) {
        markType = 'circle';
        encode = {
            "latitude": {"field": "Lat", "type": "quantitative"},
            "longitude": {"field": "Long", "type": "quantitative"},
            "size": {"bin": false, "field": "Value","type": "quantitative","scale": {"range": [0,750]},"legend": {
                "direction": "horizontal",
                "title": "",
                "offset": -25,
                "orient": "top-left",
                "tickCount": 4,
                "fill": "color",
                "gradientLength": {"signal": "clamp(childHeight, 64, 200)"},
                "encode": {"gradient": {"update": {"opacity": {"value": 0.7}}}},
                "symbolType": "circle",
                "size": "size"
            }}
        };
        strokeWidth = 2;
        legend = {};
    } else {
        markType = 'geoshape';
        encode = {"shape": {"field": "geo", "type": "geojson"}};
        strokeWidth = 1.25
        legend = {"legend": {
            "direction": "horizontal",
            "orient": "top-left",
            "title": null,
            "tickCount": 3,
            "offset": -25,
            "gradientLength": 200
        }}
    }

    // ----------------------------------------------------------------------- //
    // modify spec for means
    // ----------------------------------------------------------------------- //

    var barChart

    if (mapMeasurementType.includes('Mean') || mapMeasurementType.includes('mean')) {
        barChart =     {
            "layer": [
              {
                "height": 150,
                "width": "container",
                "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
                "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
                "encoding": {
                  "y": {
                    "field": "Value",
                    "type": "quantitative",
                    "title": null,
                    "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
                  },
                  "tooltip": [
                    {
                        "field": "Geography", 
                        "title": "Neighborhood"
                    },
                    {
                        "field": "valueLabel",
                        "title": `${mapMeasurementType}`
                    },
                    {
                        "field": "TimePeriod",
                        "title": "Time period"
                    }
                ],
                  "x": {"field": "GeoID", "sort": "y", "axis": null},
                  "color": {"value": "#f9f9f9"},
                  "stroke": {"value": "white"},
                  "strokeWidth": {"value": 3}
                }
              },
              {
                "height": 150,
                "width": "container",
                "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
                "mark": {
                  "type": "circle",
                  "size": 80,
                  "tooltip": true,
                  "stroke": "#161616"
                },
                "params": [
                  {
                    "name": "highlight",
                    "select": {
                      "type": "point",
                      "on": "mouseover",
                      "clear": "mouseout"
                    }
                  }
                ],
                "encoding": {
                  "y": {
                    "field": "Value",
                    "type": "quantitative",
                    "title": null,
                    "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
                  },
                  "tooltip": [
                    {
                        "field": "Geography", 
                        "title": "Neighborhood"
                    },
                    {
                        "field": "valueLabel",
                        "title": `${mapMeasurementType}`
                    },
                    {
                        "field": "TimePeriod",
                        "title": "Time period"
                    }
                ],
                  "x": {"field": "GeoID", "sort": "y", "axis": null},
                  "color": {
                    "bin": false,
                    "field": "Value",
                    "type": "quantitative",
                    "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
                    "legend": false
                  },
                  "stroke": {
                    "condition": [
                      {"param": "highlight", "empty": false, "value": "cyan"}
                    ],
                    "value": "white"
                  },
                  "strokeWidth": {
                    "condition": [{"param": "highlight", "empty": false, "value": 3}],
                    "value": 0
                  }
                }
              }
            ]
          }
    } else {
        barChart = {
            "height": 150,
            "width": "container",
            "config": {
                "axisY": {
                    "labelAngle": 0,
                    "labelFontSize": 13,
                }
            },
            "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
            "params": [
                {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
            ],
            "encoding": {
                "y": {
                    "field": "Value", 
                    "type": "quantitative", 
                    "title": null,
                    "axis": {
                        "labelAngle": 0,
                        "labelFontSize": 11,
                        "tickCount": 3
                    }
                },
                "tooltip": [
                    {
                        "field": "Geography", 
                        "title": "Neighborhood"
                    },
                    {
                        "field": "valueLabel",
                        "title": `${mapMeasurementType}`
                    },
                    {
                        "field": "TimePeriod",
                        "title": "Time period"
                    }
                ],
                "x": {"field": "GeoID", "sort": "y", "axis": null},
                "color": {
                    "bin": false,
                    "field": "Value",
                    "type": "quantitative",
                    "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
                    "legend": false
                },
                "stroke": {
                    "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                    "value": "white"
                },
                "strokeWidth": {
                    "condition": [{"param": "highlight", "empty": false, "value": 3}],
                    "value": 0
                }
            }
        }
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // change color scale based on rankReverse
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let color = 'purplered';
    let rankReverse = defaultMapMetadata[0].VisOptions[0].Map[0]?.RankReverse;

    if (rankReverse === 0) {
        color = 'reds'
    } else if (rankReverse === 1) {
        color = 'blues'
    }

    // console.log('rank reverse?', rankReverse)
    // console.log('color', color)

    // ----------------------------------------------------------------------- //
    // format geography dropdown items
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get (pretty) geoTypes available for this year
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // mapData has all the geos for every year
    // data has the one geo x year we're mapping

    const dataGeos = [...new Set(mapData.filter(d => d.TimePeriod == mapTime).map(d => prettifyGeoType(d.GeoType)))];

    // console.log("dataGeos [renderMap]", dataGeos);

    // if you're on a geo that's not availble for a year you just clicked on, show the gray base map


    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const map_unreliability = [...new Set(data.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#map-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> "; // blank to start
    document.getElementById("map-unreliability").classList.add('hide')  // blank to start


    map_unreliability.forEach(element => {

        document.querySelector("#map-unreliability").innerHTML += element;
        document.getElementById('map-unreliability').classList.remove('hide')

    });

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type
    // ----------------------------------------------------------------------- //

    // console.log("mapGeoType [renderMap]", mapGeoType);

    if (mapGeoType === "NTA2010") {
        topoFile = 'NTA_2010.topo.json';
    } else if (mapGeoType === "NTA2020") {
        topoFile = 'NTA_2020.topo.json';
    } else if (mapGeoType === "NYHarbor") {
        topoFile = 'ny_harbor.topo.json';
    } else if (mapGeoType === "CD") {
        topoFile = 'CD.topo.json';
    } else if (mapGeoType === "CDTA2020") {
        topoFile = 'CDTA_2020.topo.json';
    } else if (mapGeoType === "PUMA") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "Subboro") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "UHF42") {
        topoFile = 'UHF42.topo.json';
    } else if (mapGeoType === "UHF34") {
        topoFile = 'UHF34.topo.json';
    } else if (mapGeoType === "NYCKIDS2017") {
        topoFile = 'NYCKids_2017.topo.json';
    } else if (mapGeoType === "NYCKIDS2019") {
        topoFile = 'NYCKids_2019.topo.json';
    } else if (mapGeoType === "NYCKIDS2021") {
        topoFile = 'NYCKids_2021.topo.json';
    } else if (mapGeoType === "Borough") {
        topoFile = 'borough.topo.json';
    } else if (mapGeoType === "RMZ") {
        topoFile = 'RMZ.topo.json';
    }

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    let mapspec = {
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
        "projection": {"type": "mercator"},
        "transform": [
            {
                "calculate": `datum.DisplayValue + ' ${displayType}'`,
                "as": "valueLabel"
            }
        ],
        "vconcat": [
            {
                "layer": [
                    {
                        "height": 500,
                        "width": "container",
                        "data": {
                            "url": `${data_repo}${data_branch}/geography/borough.topo.json`,
                            "format": {
                                "type": "topojson",
                                "feature": "collection"
                            }
                        },
                        "mark": {
                            "type": "geoshape",
                            "stroke": "#fafafa",
                            "fill": "#C5C5C5",
                            "strokeWidth": 0.5
                        }
                    }, 
                    // Second neighborhood data layer - for count-dot map underlayer (ok to leave on for rates)
                    {
                        "height": 500,
                        "width": "container",
                        "data": {
                            "url": `${data_repo}${data_branch}/geography/${topoFile}`,
                            "format": {
                                "type": "topojson",
                                "feature": "collection"
                            }
                        },
                        "mark": {
                            "type": "geoshape",
                            "stroke": "#a2a2a2",
                            "fill": "#e7e7e7",
                            "strokeWidth": 0.5
                        }
                    },
                    {
                        "height": 500,
                        "width": "container",
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
                                    "title": `${mapMeasurementType}`
                                },
                                {
                                    "field": "TimePeriod",
                                    "title": "Time period"
                                }
                            ],
                        },
                    }
                ]
            },
            barChart
        ]
    }

    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#map", mapspec,{
        actions: {
          export: { png: false, svg: false },
          source: false,  
          compiled: false, 
          editor: true 
        }
      });

    // send info for printing
    vizYear = mapTime;
    vizSource = metadata[0].Sources
    printSpec = mapspec;
    chartType = 'map'

    // console.log(mapspec)

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    let dataForDownload = [...mapspec.data.values] // create a copy

    let downloadTable = aq.from(dataForDownload)
        .derive({Indicator: `'${indicatorName}: ${mapMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
        .select(aq.not('GeoRank', "end_period", "start_period", "ban_summary_flag", "GeoTypeShortDesc", "MeasureID", "DisplayValue")) // remove excess columns
    
    // console.log("downloadTable [renderMap]");
    // downloadTable.print()

    CSVforDownload = downloadTable.toCSV()

}