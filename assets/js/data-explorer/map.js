// ======================================================================= //
// map.js
// ======================================================================= //

const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");

    // console.log("data [renderMap]", data);
    // console.log("metadata [renderMap]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // debugger;

    // console.log("mapTimes [map.js]", mapTimes);

    let mapGeoType            = data[0]?.GeoType;
    let geoTypeShortDesc      = data[0]?.GeoTypeShortDesc;
    let mapMeasurementType    = metadata[0]?.MeasurementType;
    let displayType           = metadata[0]?.DisplayType;
    let mapGeoTypeDescription = [...new Set(geoTable.filter(aq.escape(d => d.GeoType === mapGeoType)).array("GeoTypeShortDesc"))];

    let mapTime = mapTimes[0];
    let topoFile = '';

    var color = 'purplered'
    var rankReverse = defaultMapMetadata[0].VisOptions[0].Map[0]?.RankReverse
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

    document.querySelector("#map-unreliability").innerHTML = ""; // blank to start

    map_unreliability.forEach(element => {

        document.querySelector("#map-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>" ;
        
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
    }

            // get dimensions for hconcat
            var holderWidth = document.getElementById('tabs-01-content').offsetWidth
            var mapHeight = document.getElementById('map').offsetHeight
            console.log('mapHeight: ', mapHeight)
            console.log('holder width: ', holderWidth)
            let barWidth = holderWidth / 4
            let mapWidth = 3 * holderWidth / 4

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
            "subtitle": `${mapMeasurementType}${displayType && ` (${displayType})`}, by ${mapGeoTypeDescription} (${mapTime})`,
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
            "axisY": {"domain": false,"ticks": false},
        },
        "projection": {"type": "mercator"},
        "hconcat": [
            /*
            {
                "width": barWidth,
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
                    "x": {
                        "field": "Value", 
                        "type": "quantitative", 
                        "title": null,
                        "axis": {
                            "labelAngle": 0,
                            "labelFontSize": 11,
                            "tickCount": 3,
                            "orient": "top"
                        }
                    },
                    "tooltip": [
                        {
                            "field": "Geography", 
                            "title": geoTypeShortDesc
                        },
                        {
                            "field": "DisplayValue", 
                            "title": mapMeasurementType
                        },
                    ],
                    "y": {"field": "GeoID", "sort": "-x", "axis": null},
                    "color": {
                        "bin": false,
                        "field": "Value",
                        "type": "quantitative",
                        "scale": {"scheme": {"name": color, "extent": [0.25, 1.25]}},
                        "legend": null
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
            },*/
            {
                "layer": [
                    {
                        "height": "container",
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
                    {
                        "height": "container",
                        "mark": {"type": "geoshape", "invalid": null},
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
                            "shape": {"field": "geo", "type": "geojson"},
                            "color": {
                                "condition": {
                                    "test": "isValid(datum.Value)",
                                    "bin": false,
                                    "field": "Value",
                                    "type": "quantitative",
                                    "scale": {"scheme": {"name": color, "extent": [0.125, 1.125]}}
                                },
                                "value": "#808080"
                            },
                            "stroke": {
                                "condition": [{"param": "highlight", "empty": false, "value": "cyan"}],
                                // "value": "#161616"
                                "value": "#dadada"
                            },
                            "strokeWidth": {
                                "condition": [{"param": "highlight", "empty": false, "value": 1.25}],
                                "value": 0.5
                            },
                            "order": {
                                "condition": [{"param": "highlight", "empty": false, "value": 1}],
                                "value": 0
                            },
                            "tooltip": [
                                {
                                    "field": "Geography", 
                                    "title": geoTypeShortDesc
                                },
                                {
                                    "field": "DisplayValue",
                                    "title": mapMeasurementType
                                },
                            ],
                        },
                    }
                ]
            }
        ]
    }
    
    // ----------------------------------------------------------------------- //
    // render chart
    // ----------------------------------------------------------------------- //

    vegaEmbed("#map", mapspec);

    console.log(mapspec)


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