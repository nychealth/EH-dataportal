// ======================================================================= //
// map.js
// ======================================================================= //

const renderMap = (
    data,
    metadata
    ) => {

        console.log("** renderMap");

        // console.log("data [renderMap]", data);

        // ----------------------------------------------------------------------- //
        // get unique time in data
        // ----------------------------------------------------------------------- //
        
        const mapYears =  [...new Set(data.map(item => item.Time))];

        // debugger;

        // console.log("mapYears [map.js]", mapYears);

        let mapGeoType            = data[0].GeoType;
        let geoTypeShortDesc      = data[0].GeoTypeShortDesc;
        let mapMeasurementType    = metadata[0].MeasurementType;
        let displayType           = metadata[0].DisplayType;
        let mapGeoTypeDescription = 
            metadata[0].AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        let mapTime = mapYears[0];
        let topoFile = '';

        var color = 'purplered'
        var rankReverse = defaultMapMetadata[0].VisOptions[0].Map[0].RankReverse
        if (rankReverse === 0) {
            color = 'reds'
        } else if (rankReverse === 1) {
            color = 'blues'
        }

        // console.log('rank reverse?', rankReverse)
        // console.log('color', color)


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

        // ----------------------------------------------------------------------- //
        // define spec
        // ----------------------------------------------------------------------- //
        
        mapspec = {
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
                        {
                            "height": 500,
                            "width": "container",
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
                },
                {
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
                                "title": geoTypeShortDesc
                            },
                            {
                                "field": "DisplayValue", 
                                "title": mapMeasurementType
                            },
                        ],
                        "x": {"field": "GeoID", "sort": "y", "axis": null},
                        "color": {
                            "bin": false,
                            "field": "Value",
                            "type": "quantitative",
                            "scale": {"scheme": {"name": color, "extent": [0.25, 1.25]}},
                            "legend": {
                                "direction": "horizontal", 
                                "orient": "top-left",
                                "title": null,
                                "offset": -30,
                                "padding": 10,
                            }
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
            ]
        }
        
        // ----------------------------------------------------------------------- //
        // render chart
        // ----------------------------------------------------------------------- //

        vegaEmbed("#map", mapspec);

        // ----------------------------------------------------------------------- //
        // Send chart data to download
        // ----------------------------------------------------------------------- //

        let dataForDownload = [...mapspec.data.values] // create a copy
        // console.log(dataForDownload===mapspec.data.values) 

        let downloadTable = aq.from(dataForDownload)
            .derive({Indicator: `'${indicatorName}: ${mapMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
            .select(aq.not('GeoRank',"end_period","start_period","ban_summary_flag","GeoTypeShortDesc","MeasureID","DisplayValue")) // remove excess columns
            // .print()

        CSVforDownload = downloadTable.toCSV()

    }