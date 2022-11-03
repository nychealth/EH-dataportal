const renderMap = (
    data,
    metadata
    ) => {

        console.log("** renderMap");

        // get unique time in data

        const mapYears =  [...new Set(data.map(item => item.Time))];

        // console.log("mapYears [map.js]", mapYears);

        let mapGeoType            = data[0].GeoType;
        let mapMeasurementType    = metadata[0].MeasurementType;
        let mapGeoTypeDescription = 
            metadata[0].AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        
        let mapDisplay = metadata[0].DisplayType;
        let mapTime = mapYears[0];
        let topoFile = '';

        // console.log("testData [map.js]", testData);
        
        // can add year to this

        console.log("mapGeoType [renderMap]", mapGeoType);

        if (mapGeoType === "NTA") {
            topoFile = 'NTA.topo.json';
        } else if (mapGeoType === "CD") {
            topoFile = 'CD.topo.json';
        } else if (mapGeoType === "PUMA") {
            topoFile = 'PUMA_or_Subborough.topo.json';
        } else if (mapGeoType === "Subboro") {
            topoFile = 'PUMA_or_Subborough.topo.json';
        } else if (mapGeoType === "UHF42") {
            topoFile = 'UHF42.topo.json';
        } else if (mapGeoType === "UHF34") {
            topoFile = 'UHF34.topo.json';
        } else if (mapGeoType === "NYCKIDS") {
            topoFile = 'NYCKids.topo.json';
        }

        
    // define spec
        
        mapspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `By ${mapGeoTypeDescription}, ${mapTime}`,
                "subtitlePadding": 10
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
                "title": {
                    "fontWeight": "normal"
                  },
                "legend": {
                    "offset": -25,
                    "titleFontWeight": "normal",
                }
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
                                        "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}}
                                    },
                                    "value": "#808080"
                                },
                                "stroke": {
                                    "condition": [{"param": "highlight", "empty": false, "value": "orange"}],
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
                                    {"field": "Geography", "title": "Neighborhood"},
                                    {
                                        "field": "Value",
                                        "type": "quantitative",
                                        "title": mapMeasurementType,
                                        "format": ",.1~f"
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
                            }
                        },
                        "tooltip": [
                            {
                                "field": "Geography", 
                                "title": "Neighborhood"
                            },
                            {
                                "field": "Value", 
                                "type": "quantitative", 
                                "title": mapMeasurementType,
                                "format": ",.1~f"
                            },
                        ],
                        "x": {"field": "GeoID", "sort": "y", "axis": null},
                        "color": {
                            "bin": false,
                            "field": "Value",
                            "type": "quantitative",
                            "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}},
                            "legend": {"direction": "horizontal","orient": "top-left","title": `${mapMeasurementType}`}
                        },
                        "stroke": {
                            "condition": [{"param": "highlight", "empty": false, "value": "orange"}],
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
        
        vegaEmbed("#map", mapspec);
    }