console.log('print vis js running')

// Runs on button click to fire the 'print' modal, and, on delay, draw the chart
function printModal() {
    $('#printModal').modal('show');
    setTimeout(printViz,500)
}


function printViz() {
    let chartType = currentHash.slice(8)
    chartType === 'trend' ? changeTrendSpec() : {}
    chartType === 'map' ? changeMapSpec(vizYear) : {}

    vegaEmbed("#printVis", printSpec,{
        actions: {
          export: { png: true, svg: true },
          source: false,  
          compiled: false, 
          editor: true 
        }
      })
}

function changeTrendSpec() {
    printSpec.encoding.color.condition.legend = {
        "orient": "bottom",
        "title": null
      }

    var sourceLayer = {
        "mark": {
          "type": "text",
          "fontSize": 11,
          "fontWeight": "normal",
          "align": "left",
          "baseline": "bottom",
          "dx": 5,
          "dy": 100
        },
        "data": {
            "values": [{}]  // Use an empty object as a dummy value
          },
        "encoding": {
            "text": {"value": [`Source: ${vizSource}`,"Chart: NYC Health Department - Environment and Health Data Portal"]},
            "x": {"value": 0},
            "y": {"value": 400},
          "color": {"value": "gray"}
        }
      }

    printSpec.layer.push(sourceLayer)
}

function changeMapSpec(x) {
    printSpec.title.text += ` - ${x}`

    var sourceLayer =  {
        "mark": {
          "type": "text",
          "fontSize": 11,
          "fontWeight": "normal",
          "align": "left",
          "baseline": "bottom",
          "dx": 5,
          "dy": 0
        },
        "data": {
            "values": [{}]  // Use an empty object as a dummy value
          },
        "encoding": {
          "text": {"value": [`Source: ${vizSource}`,"Chart: NYC Health Department - Environment and Health Data Portal"]},
          "x": {"value": 0},
          "y": {"value": 0},
          "color": {"value": "gray"}
        }
      }

      printSpec.vconcat.push(sourceLayer)

}



/* Other arguments to pass in:
- Map: year, neighborhood
- Trend: turn legend on [can use currentHash]
- Footnote (and add textfield) - with source

- Fix dimensions of modal's chart template - or chart height

*/

