const renderMap = (
    data,
    metadata
    ) => {

        console.log("** renderMap");

        // get unique time in data

        const mapYears =  [...new Set(data.map(item => item.Time))];

        console.log("mapYears [map.js]", mapYears);

        let mapGeoType            = data[0].GeoType;
        let mapMeasurementType    = metadata[0].MeasurementType;
        let mapGeoTypeDescription = 
            metadata[0].AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        // console.log("mapGeoTypeDescription [map.js]", mapGeoTypeDescription);
        // console.log("mapGeoType [map.js]", mapGeoType);
        // console.log("mapMeasurementType [map.js]", mapMeasurementType);
        
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
                "text": `${mapTime} - ${mapMeasurementType} ${mapDisplay && `(${mapDisplay})`}`,
                "subtitle": mapGeoTypeDescription,
                "subtitlePadding": 10
            },
            "width": "container",
            "data": {
                "values": data,
                "format": {
                    "parse": {
                        "Value": "number"
                    }
                }
            },
            "params": [
                {"name": "highlight", "select": {"type": "point", "on": "mouseover"}}
            ],
            "projection": {"type": "mercator"},
            "vconcat": [
                {
                    "height": 500,
                    "width": "container",
                    "mark": {"type": "geoshape", "stroke": "#000000", "invalid": null},
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
                            "value": "lightgray"
                        },
                        "strokeWidth": {
                            "condition": [{"param": "highlight", "empty": false, "value": 2}],
                            "value": 0.5
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
                    "transform": [
                        {
                            "lookup": "GeoID",
                            "from": {
                                "data": {
                                    "url": data_repo + "/" + data_branch + `/geography/${topoFile}`,
                                    "format": {"type": "topojson", "feature": "collection"}
                                },
                                "key": "properties.GEOCODE"
                            },
                            "as": "geo"
                        }
                    ]
                },
                {
                    "height": 150,
                    "width": "container",
                    "mark": {"type": "bar", "tooltip": true, "stroke": "#000000"},
                    "encoding": {
                        "y": {"field": "Value", "type": "quantitative", "title": null},
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
                            "legend": null
                        },
                        "strokeWidth": {
                            "condition": [{"param": "highlight", "empty": false, "value": 2}],
                            "value": 0.5
                        }
                    }
                }
            ]
        }
        
        vegaEmbed("#map", mapspec);
    }