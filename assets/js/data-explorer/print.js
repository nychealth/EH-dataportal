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


    console.log(printSpec)
    vegaEmbed("#printVis", printSpec)
}

function changeTrendSpec() {
    printSpec.encoding.color.condition.legend = {
        "orient": "bottom",
        "title": null
      }

    var sourceLayer = {
        "mark": {
          "type": "text",
          "fontSize": 12,
          "fontWeight": "normal",
          "align": "left",
          "baseline": "bottom",
          "dx": 5,
          "dy": 100
        },
        "encoding": {
          "text": {"value": `Source: ${vizSource}`},
          "x": {"value": 0},
          "y": {"value": 400},
          "color": {"value": "gray"}
        }
      }

    printSpec.layer.push(sourceLayer)
}

function changeMapSpec(x) {
    printSpec.title.subtitle += ` - ${x}`

    var sourceLayer =  {
        "mark": {
          "type": "text",
          "fontSize": 12,
          "fontWeight": "normal",
          "align": "left",
          "baseline": "bottom",
          "dx": 5,
          "dy": 0
        },
        "encoding": {
          "text": {"value": `Source: ${vizSource}`},
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

