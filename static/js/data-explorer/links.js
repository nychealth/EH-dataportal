const renderLinksChart = (
  selectedData,
  selectedMeasure,
  selectedDisplay,
  selectedAxis,
  selectedMeasureId,
  selectedSecondaryMeasureId
) => {
  // console.log('==========================================================================')
  const defaultLinksMeasureId = defaultLinksMeasure[0].VisOptions[0].Links[0].MeasureID;
  const linkAxisMeasureId = selectedSecondaryMeasureId ? selectedSecondaryMeasureId : defaultLinksMeasureId;
  const secondaryIndicator =  indicators.filter(indicator =>
      indicator.Measures.some(measure => 
          measure.MeasureID === linkAxisMeasureId)
  )

  const secondaryMeasure = secondaryIndicator[0].Measures.filter(m =>
      m.MeasureID === linkAxisMeasureId
  )
  
  const defaultLinksAxis = defaultLinksMeasure[0].VisOptions[0].Links[0].Axis;
  const linkAxisMeasure = selectedData ? filterSecondaryIndicatorMeasure(selectedData) : filterSecondaryIndicatorMeasure(defaultLinksMeasure)
  
  const linksMeasure = selectedMeasure ? selectedMeasure : defaultLinksMeasure[0].MeasurementType;
  const linkAxis = selectedAxis ? selectedAxis : defaultLinksAxis;
  const linksDisplay = selectedDisplay ? selectedDisplay : defaultLinksMeasure[0].DisplayType;
  const linkAxisDisplay = secondaryMeasure[0].DisplayType;
  const linksTime = selectedData ? selectedData[0].AvailableTimes[0].TimeDescription : defaultLinksMeasure[0].AvailableTimes[0].TimeDescription;
  const linksAxisTime = selectedlinksSecondaryMeasureTime;

  // console.log('RENDER Links DATA ', linksMeasures)
  // console.log('RENDER LINKS DEFAULT MEASURE: ', defaultLinksMeasure)
  // console.log('RENDER LINKS DEFAULT MEASURE ID: ', defaultLinksMeasureId)
  // console.log('RENDER LINKS DEFAULT AXIS: ', defaultLinksAxis)
  // console.log('RENDER LINKS SELECTED DATA: ', selectedData)
  // console.log('RENDER LINKS SELECTED MEASURE: ', selectedMeasure)
  // console.log('RENDER LINKS SELECTED SECONDARY MEASURE ID: ', selectedSecondaryMeasureId)
  // console.log('RENDER LINKS SELECTED AXIS: ', selectedMeasureId)
  // console.log('RENDDER LINKS DISPLAY: ', linksDisplay)
  // console.log('indicators: ', indicators)

  

  const linkAxisMeas = secondaryMeasure[0].MeasurementType

  // console.log('this data: ', secondaryMeasure[0], secondaryIndicator)
  
  let xMeasure;
  let yMeasure;
  let xDisplay = null;
  let yDisplay = null;
  let xTime;
  let yTime;
  let xIndicatorName;
  let yIndicatorname;

  switch(linkAxis) {
      case 'y': 
          yMeasure = linkAxisMeas;
          xMeasure = linksMeasure;
          yDisplay = linkAxisDisplay ? linkAxisDisplay : '';
          xDisplay = linksDisplay ? linksDisplay : '';
          yTime = linksAxisTime;
          xTime = linksTime;
          yIndicatorName = secondaryIndicator[0].IndicatorName;
          xIndicatorName = indicatorName;
          break;
      case 'x':
          yMeasure = linksMeasure;
          xMeasure = linkAxisMeas;
          yDisplay = linksDisplay ? linksDisplay : '';
          xDisplay = linkAxisDisplay ? linkAxisDisplay : '';
          yTime = linksTime;
          xTime = linksAxisTime;
          yIndicatorName = indicatorName;
          xIndicatorName = secondaryIndicator[0].IndicatorName;
          break;
  }

  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> ', selectedlinksSecondaryMeasureData, selectedlinksSecondaryIndicatorData)

  /* var spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
      "width": "container",
      "height": 400,
      "config": {
          "background": "#FFFFFF",
          "title": {"anchor": "start", "fontSize": 18, "font": "Calibri"},
          "axisX": {
              "domain": true,
              "domainColor": "#000000",
              "domainWidth": 1,
              "grid": false,
              "labelFontSize": 12,
              "labelAngle": 0,
              "tickColor": "#000000",
              "tickSize": 5,
              "titleFontSize": 12,
              "titlePadding": 10,
              "title": null
          },
          "axisY": {
              "domain": false,
              "domainWidth": 1,
              "grid": true,
              "gridColor": "#DEDDDD",
              "gridWidth": 1,
              "labelFontSize": 12,
              "labelPadding": 8,
              "ticks": false,
              "titleFontSize": 12,
              "titlePadding": 10,
              "titleFont": "Lato",
              "titleAngle": 0,
              "titleY": -10,
              "titleX": 18,
              "title": null
          },
          "view": {"stroke": "transparent"},
          "range": {
              "category": [
                  "#1696d2",
                  "#000000",
                  "#fdbf11",
                  "#ec008b",
                  "#d2d2d2",
                  "#55b748"
              ]
          },
          "text": {
              "color": "#1696d2",
              "fontSize": 11,
              "align": "center",
              "fontWeight": 400,
              "size": 11
          }
      },
      "data": {"url": "https://gist.githubusercontent.com/mmontesanonyc/436de650b919784691ed42dd321c38f2/raw/074bd84e78473b8a2099e66a0d6bf8caba32b594/scatter-sample-data.csv"},
      "mark": {"type": "circle", "filled": true, "size": 500, "stroke": "#727272", "strokeWidth": 2},
          "params": [{
              "name": "Borough",
              "select": {"type": "point", "fields": ["Borough"]},
              "bind": "legend"
          }
      ],
      "encoding": {
          "y": {"field": "Estimated Annual Rate (per 10,000 residents)", "type": "quantitative"},
          "x": {"field": "Poverty (percent)", "type": "quantitative"},
          "tooltip": [{"field": "Geography", "type": "nominal"},
          {"field": "Estimated Annual Rate (per 10,000 residents)", "type": "quantitative"},
          {"field": "Poverty (percent)", "type": "quantitative"}
          ],
          "color": {
              "condition": {
              "param": "Borough", "field": "Borough", "type": "nominal"},
              "value": "#fafafa"
          }
      }
      }


      vegaEmbed("#links", spec);
      */

      setTimeout(() => {
          var spec2 = {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
          "width": "container",
          "height": "container",
          "config": {
              "background": "#FFFFFF",
              "title": {"anchor": "start", "fontSize": 18, "font": "Calibri"},
              "axisX": {
              // "domain": true,
              // "domainColor": "#000000",
              // "domainWidth": 1,
              // "grid": false,
              // "labelFontSize": 14,
              // "labelAngle": 0,
              // "tickColor": "#000000",
              // "tickSize": 5,
              // "titleFontSize": 12,
              // "titlePadding": 10
              },
              "axisY": {
                  // "domain": false,
                  // "domainWidth": 1,
                  // "grid": true,
                  // "gridColor": "#DEDDDD",
                  // "gridWidth": 1,
                  // "labelFontSize": 14,
                  // "labelPadding": 8,
                  // "ticks": false,
                  "titleFontSize": 12,
                  "titlePadding": 10,
                  // "titleFont": "Calibri",
                  // "titleAngle": -90,
                  // "titleY": 0,
                  // "titleX": 0
              },
              "legend": {
                  "labelFontSize": 14,
                  "symbolSize": 140
              },
              "view": {"stroke": "transparent"},
              "range": {
                  "category": [
                      "#1696d2",
                      "#fdbf11",
                      "#55b748",
                      "#ec008b",
                      "#d2d2d2"
                  ]
              },
              "text": {
              "color": "#1696d2",
              "fontSize": 11,
              "align": "center",
              "fontWeight": 400,
              "size": 11
              }
          },
          "data": {
              "values": joinedDataLinksObjects
          },
          "mark": {"type": "circle", "filled": true, "size": 500, "stroke": "#727272", "strokeWidth": 2},
          "params": [
              {
                  "name": "hover",
                  "select": {"type": "point", "on": "mouseover"}
              }
          ],
          "encoding": {
              "y": {
                  "title": [`${yIndicatorName && `${yIndicatorName}`}`, `- ${yMeasure} ${yDisplay && `(${yDisplay})`} ${yTime}`],
                  "field": yMeasure,
                  "type": "quantitative",
                  // "labelAngle": 0
              },
              "x": {
                  "title": `${xIndicatorName && `${xIndicatorName} - `} ${xMeasure} ${xDisplay && `(${xDisplay})`} ${xTime}`,
                  "field": xMeasure,
                  "type": "quantitative"
              },
              "tooltip": [
                  {
                      "title": "Time",
                      "field": "Time_2",
                      "type": "nominal"
                  },
                  {
                      "title": "Geography",
                      "field": "Geography_1",
                      "type": "nominal"
                  },
                  {
                      "field": yMeasure,
                      "type": "quantitative"},
                  {
                      "field": xMeasure,
                      "type": "quantitative"
                  }
              ],
              "color": {
                  "title": "Geography",
                  "field": "Geography_1",
                  "type": "nominal"
              },
              "opacity": {
                  "condition": {
                  "param": "hover",
                  "value": 1
                  },
                  "value": 0.5
              }
          }
      }

      vegaEmbed("#links", spec2);
      }, 300)
          
      
}