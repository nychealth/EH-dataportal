// ======================================================================= //
// print.js
// ======================================================================= //

// console.log('print vis js running')

// ----------------------------------------------------------------------- //
// Fire print modal and drawy chart on delay
// ----------------------------------------------------------------------- //

var visWidth;

function printModal() {
    $('#printModal').modal('show');
    setTimeout(printViz,500)
}


// ----------------------------------------------------------------------- //
// Draw chart
// ----------------------------------------------------------------------- //

var wrapLegend = false;

function printViz() {

    window.innerWidth < 960 ? wrapLegend = true : wrapLegend = false

    chartType === 'trend' ? changeTrendSpec() : {}
    chartType === 'map' ? changeMapSpec(vizYear) : {}
    chartType === 'links' ? changeLinksSpec() : {}
    chartType === 'disparities' ? changeDisparitiesSpec() : {};


    vegaEmbed("#printVis", printSpec, {
        actions: {
          export: { png: true, svg: true },
          source: false,  
          compiled: false, 
          editor: true 
        }
      });
    
    updateChartPlotSize();
}

// ----------------------------------------------------------------------- //
// Modify trend spec
// ----------------------------------------------------------------------- //

function changeTrendSpec() {

    let columns;
    wrapLegend === true ? columns = 3 : columns = 6;

    printSpec.encoding.color.condition.legend = {
        "orient": "bottom",
        "title": null,
        "columns": columns
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

    var modalFootnotes = document.getElementById('modalFootnotes')

    modalFootnotes.innerHTML = document.getElementById('trend-unreliability').innerHTML

    modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};

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

      var modalFootnotes = document.getElementById('modalFootnotes')

      modalFootnotes.innerHTML = document.getElementById('map-unreliability').innerHTML
  
      modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};

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

      var modalFootnotes = document.getElementById('modalFootnotes')

      modalFootnotes.innerHTML = document.getElementById('links-unreliability').innerHTML
  
      modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};

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

      var modalFootnotes = document.getElementById('modalFootnotes')

      modalFootnotes.innerHTML = document.getElementById('links-unreliability').innerHTML
  
      modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};
    printSpec.layer.push(sourceLayer)
}

// ----------------------------------------------------------------------- //
// Deactive Save Button for table
// ----------------------------------------------------------------------- //
window.addEventListener('hashchange', function() {
  var chartbtn = document.getElementById('chartSaver')
  currentHash === 'display=summary' ? chartbtn.classList.add('disabled') : chartbtn.classList.remove('disabled')
});
