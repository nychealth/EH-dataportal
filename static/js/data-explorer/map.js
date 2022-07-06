const renderMap = (
  selectedData,
  selectedMeasure,
  selectedDisplay,
  selectedDate,
  selectedAbout, 
  selectedSources
) => {
  const mapYears =  [...new Set(fullDataMapObjects.map(item => item.Time))];
  const filteredfullDataMapObjects = fullDataMapObjects.filter(obj => 
      obj.Time === mapYears[0]
  );
  let mapGeoType = selectedData ? selectedData[0].GeoType : filteredfullDataMapObjects[0].GeoType;
  let mapMeasure = selectedMeasure ? selectedMeasure : defaultMapMeasure[0].MeasurementType;
 
  let mapDisplay = selectedDisplay ? selectedDisplay : defaultMapMeasure[0].DisplayType;
  let mapDate = selectedDate ? selectedDate : filteredfullDataMapObjects[0].Time;
  let topoFile = '';

  let testData = selectedData ? selectedData :filteredfullDataMapObjects;

  console.log('==========================================================================')
  // console.log('MAP DATA: ',filteredfullDataMapObjects[0].GeoType,  mapData)
  console.log('RENDER MAP DATA - GeoType ', mapGeoType)
  console.log('RENDER MAP DATA - Measure Default: ', defaultMapMeasure)
  console.log('RENDER MAP DATA - Measure Selected: ', selectedMeasure)
  console.log('RENDER MAP DATA - Measure Filtered Default Data: ', filteredfullDataMapObjects)
  console.log('RENDER MAP DATA - Measure Filtered Selcted Data: ', selectedData)


  
  const filterGeoTypeMeasurementType = (geoType) => {
      //chnging geotype to geoType renders subborro but no names match
      const data = testData.filter(obj => obj.Geotype === geoType && obj[mapMeasure])
      const data2 = testData.filter(obj => obj.GeoType === geoType && obj[mapMeasure]) 
      console.log('test data 1: ', geoType, data.length, data2.length )
      if (data.length > data2.length) {
        return data
      } else if (data.length < data2.length) {
        return data2
      } else {
        return data
      }
      
  }
  const filterGeoType = (geoType) => {
      //chnging geotype to geoType renders subborro but no names match
      const data = testData.filter(obj => obj.Geotype === geoType)
      const data2 = testData.filter(obj => obj.GeoType === geoType)
      console.log('test data 2: ', geoType, data.length, data2.length )
      if (data.length > data2.length) {
        return data
      } else if (data.length < data2.length) {
        return data2
      } else {
        return data
      }

      
  }

  let mapData = null;

  const cdDataResults = filterGeoTypeMeasurementType('CD');
  const uhf42DataResults = filterGeoTypeMeasurementType('UHF42');
  const uhf34DataResults = filterGeoTypeMeasurementType('UHF34');
  const pumaDataResults = filterGeoTypeMeasurementType('PUMA');
  const subboroDataResults = filterGeoTypeMeasurementType('Subboro');
  const ntaDataResults = filterGeoTypeMeasurementType('NTA');
  
  const cdData = filterGeoType('CD');
  const uhf42Data = filterGeoType('UHF42');
  const uhf34Data = filterGeoType('UHF34');
  const pumaData = filterGeoType('Puma');
  const subboroData = filterGeoType('Subboro');
  const ntaData = filterGeoType('NTA');

  console.log('NTA: ', ntaDataResults.length, pumaDataResults.length)

  if (ntaDataResults.length > 0) {
      console.log('## NTA')
      mapData = ntaData;
      topoFile = 'NTA2.topo.json';
  } else if (cdDataResults.length > 0) {
      console.log('## CD')
      mapData = cdData;
      topoFile = 'CD.topo.json';
} else if (pumaDataResults.length > 0) {
    console.log('## Puma')
    mapData = pumaData;
    topoFile = 'PUMA_or_Subborough.topo.json';
  } else if (subboroDataResults.length > 0) {
      console.log('## Subboro')
      mapData = subboroData;
      topoFile = 'PUMA_or_Subborough.topo.json';
  } else if (uhf42DataResults.length > 0) {
      console.log('## UHF42')
      mapData = uhf42Data;
      topoFile = 'UHF42.topo.json';
  } else if (uhf34DataResults.length > 0) {
      console.log('## UHF34')
      mapData = uhf34Data;
      topoFile = 'UHF34.topo.json';
  }

  aq.from(mapData).print({ limit: 60 })

  // console.log('default data: ', geoTypFilteredData)

  // console.log('TEST DATA: ', testData, 'selected: ', selectedData, 'mapMeasure: ', mapMeasure, 'defaultGeoTypFilteredData', geoTypFilteredData)

  console.log('RENDER MAP DATA - topoFile ', topoFile)

  

  // let spec2 = {
  //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  //     "title": "This is my good schema!",
  //     "width": 700,
  //     "data": {
  //         "url": "https://gist.githubusercontent.com/mmontesanonyc/28953366ac41a0ecf24470a3cefb6cea/raw/4b2869cc9fe93a4ae4e33b2acc0aad5570c498a0/2380-reduced.csv"
  //     },
  //     "params": [
  //         {"name": "highlight", "select": {"type": "point", "on": "mouseover"}}
  //     ],
  //     "projection": {"type": "mercator"},
  //     "vconcat": [
  //         {
  //         "height": 550,
  //         "width": 900,
  //         "mark": {"type": "geoshape", "stroke": "#000000"},
  //         "encoding": {
  //             "shape": {"field": "geo", "type": "geojson"},
  //             "color": {
  //             "bin": false,
  //             "field": "Value",
  //             "type": "quantitative",
  //             "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}}
  //             },
  //             "strokeWidth": {
  //             "condition": [{"param": "highlight", "empty": false, "value": 2}],
  //             "value": 0.5
  //             },
  //             "tooltip": [
  //                 {"field": "GeoID", "title": "GeoID"},
  //                 {
  //                     "field": "Value",
  //                     "type": "quantitative",
  //                     "title": "Value"
  //                 },
  //                 {"field":"MeasureID","title":"Measure"}
  //             ],
  //         },
  //         "transform": [
  //             {
  //             "lookup": "Geography-ID",
  //             "from": {
  //                 "data": {
  //                 "url": "https://raw.githubusercontent.com/nycehs/NYC_geography/master/UHF42.topo.json",
  //                 "format": {"type": "topojson", "feature": "collection"}
  //                 },
  //                 "key": "properties.GEOCODE"
  //             },
  //             "as": "geo"
  //             }
  //         ]
  //         },
  //         {
  //         "height": 150,
  //         "width": "container",
  //         "mark": {"type": "bar", "tooltip": true, "stroke": "#000000"},
  //         "encoding": {
  //             "y": {"field": "Value", "type": "quantitative", "title": null},
  //             "tooltip": [
  //             {"field": "Geography-ID", "title": "GeoID"},
  //             {"field": "Value", "type": "quantitative", "title": "Value"},
  //             {"field": "MeasureID", "title": "Measure"}
  //             ],
  //             "x": {"field": "Geography-ID", "sort": true, "axis": null},
  //             "color": {
  //             "bin": false,
  //             "field": "Value",
  //             "type": "quantitative",
  //             "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}}
  //             },
  //             "strokeWidth": {
  //             "condition": [{"param": "highlight", "empty": false, "value": 2}],
  //             "value": 0.5
  //             }
  //         }
  //         }
  //     ]
  // }

  spec3 = {
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
    //   "config": {
    //       "mark": {"invalid": null}
    //   },
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
              "bin": false,
              "field": mapMeasure,
              "type": "quantitative",
              "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}}
              },
              "strokeWidth": {
              "condition": [{"param": "highlight", "empty": false, "value": 2}],
              "value": 0.5
              },
              "tooltip": [
                  {"field": "Geography", "title": "Geography"},
                  {
                      "field": mapMeasure,
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
                  "url": `https://raw.githubusercontent.com/nycehs/NYC_geography/master/${topoFile}`,
                  "format": {"type": "topojson", "feature": "collection"}
                  },
                  "key": "properties.GEOCODE"
              },
              "as": "geo"
              }
          ]
          },
          // {
          //     "mark": {
          //         "type": "bar", 
          //         "tooltip": true, 
          //         "stroke": "#000000"},
          //         "orient": "x",
          //     "encoding": {
          //         "color": {
          //             "field": "valiues",
          //             "type": "quantitative",
          //             "legend": {
          //                 "direction": "horizontal",
          //                 "orient": "bottom",
          //             }
          //         }
          //     }
          // },
          {
          "height": 150,
          "width": "container",
          "mark": {"type": "bar", "tooltip": true, "stroke": "#000000"},
          "encoding": {
              "y": {"field": mapMeasure, "type": "quantitative", "title": null},
              "tooltip": [
                  {"field": "Geography", "title": "GeoID"},
                  {"field": mapMeasure, "type": "quantitative", "title": "Value"},
                  // {"field": "MeasureID", "title": "Measure"}
              ],
              "x": {"field": "GeoID", "sort": true, "axis": null},
                  "color": {
                  "bin": false,
                  "field": mapMeasure,
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

  vegaEmbed("#map", spec3);
}