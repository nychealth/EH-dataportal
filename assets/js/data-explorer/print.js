// ======================================================================= //
// print.js
// ======================================================================= //

// console.log('print vis js running')

// ----------------------------------------------------------------------- //
// Fire print modal and drawy chart on delay
// ----------------------------------------------------------------------- //

function printModal() {
    $('#printModal').modal('show');
    setTimeout(printViz,500)
}


// ----------------------------------------------------------------------- //
// Draw chart
// ----------------------------------------------------------------------- //
function printViz() {
    chartType === 'trend' ? changeTrendSpec() : {}
    chartType === 'map' ? changeMapSpec(vizYear) : {}
    chartType === 'links' ? changeLinksSpec() : {}
    chartType === 'disparities' ? changeDisparitiesSpec() : {};

    vegaEmbed("#printVis", printSpec,{
        actions: {
          export: { png: true, svg: true },
          source: false,  
          compiled: false, 
          editor: true 
        }
      })
}

// ----------------------------------------------------------------------- //
// Modify trend spec
// ----------------------------------------------------------------------- //
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

// ----------------------------------------------------------------------- //
// Modify map spec
// ----------------------------------------------------------------------- //
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

// ----------------------------------------------------------------------- //
// Modify links spec
// ----------------------------------------------------------------------- //

function changeLinksSpec() {
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
            "text": {"value": [
                `Sources: ${vizSource},`,
                `${vizSourceSecond}.`,
                "Chart: NYC Health Department - Environment and Health Data Portal"]},
            "x": {"value": 0},
            "y": {"value": 525},
          "color": {"value": "gray"}
        }
      }

    printSpec.layer.push(sourceLayer)
}


// ----------------------------------------------------------------------- //
// Modify disparities spec
// ----------------------------------------------------------------------- //

function changeDisparitiesSpec() {
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
            "text": {"value": [
                `Sources: ${vizSource},`,
                `${vizSourceSecond}.`,
                "Chart: NYC Health Department - Environment and Health Data Portal"]},
            "x": {"value": 0},
            "y": {"value": 475},
          "color": {"value": "gray"}
        }
      }

    printSpec.layer.push(sourceLayer)
}