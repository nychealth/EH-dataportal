const renderMap = (
    selectedData,
    selectedMeasure,
    selectedDisplay,
    selectedDate
    ) => {

        console.log("** renderMap");

    // console.log("================ map.js / renderMap ================")

        // fullDataMapObjects = joinedAqData.objects();

        const mapYears =  [...new Set(fullDataMapObjects.map(item => item.Time))];

        // console.log("mapYears [map.js]", mapYears);
        // console.log("fullDataMapObjects [map.js]", fullDataMapObjects);

        // if no provided selected data, then use the most recent year
        
        const filteredfullDataMapObjects = fullDataMapObjects.filter(obj => obj.Time === mapYears[0]);

        // console.log("filteredfullDataMapObjects [map.js]", filteredfullDataMapObjects);

        // console.log("defaultMapMeasure [map.js]", defaultMapMeasure);

        let mapGeoType = selectedData ? selectedData[0].GeoType : filteredfullDataMapObjects[0].GeoType;
        let mapMeasure = selectedMeasure ? selectedMeasure : defaultMapMeasure[0].MeasurementType;


        // console.log("mapGeoType [map.js]", mapGeoType);
        // console.log("mapMeasure [map.js]", mapMeasure);
        
        let mapDisplay = selectedDisplay ? selectedDisplay : defaultMapMeasure[0].DisplayType;
        let mapDate = selectedDate ? selectedDate : filteredfullDataMapObjects[0].Time;
        let topoFile = '';
        let testData = selectedData ? selectedData : filteredfullDataMapObjects;

        // console.log("testData [map.js]", testData);
        
        // can add year to this

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

        // console.log("topoFile [map.js]", topoFile);
        
        let mapData = testData.filter(obj => obj.GeoType === mapGeoType && obj.MeasurementType === mapMeasure);
        
        // console.log("mapData [map.js]", mapData);
        // mapData_aq = aq.from(mapData)
        // // mapData_aq.print({ limit: 20 })
        // console.log(mapData_aq [map.js]);
        
        // console.log('default data: ', geoTypFilteredData)
        
        // console.log('TEST DATA: ', testData, 'selected: ', selectedData, 'mapMeasure: ', mapMeasure, 'defaultGeoTypFilteredData', geoTypFilteredData)
        
        // console.log('RENDER MAP DATA - topoFile ', topoFile)
        
        
        mapspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": `${mapDate} - ${mapMeasure} ${mapDisplay && `(${mapDisplay})`} `,
            "width": "container",
            "data": {
                "values": mapData,
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
                    "height": 550,
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
                            {"field": "Geography", "title": "Geography"},
                            {
                                // "field": mapMeasure,
                                "field": "Value",
                                "type": "quantitative",
                                "title": "Value"
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
                            {"field": "Geography", "title": "GeoID"},
                            {"field": "Value", "type": "quantitative", "title": "Value"},
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