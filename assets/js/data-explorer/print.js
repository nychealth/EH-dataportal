// ======================================================================= //
// print.js
// ======================================================================= //

// console.log('print vis js running')

const el = document.getElementById("printVis");

const ro = new ResizeObserver(() => {
  updateChartPlotSize();
});

ro.observe(el);

let view;

// ----------------------------------------------------------------------- //
// Fire print modal and draw chart on delay
// ----------------------------------------------------------------------- //

let visWidth;

let initialSource = ["Chart: NYC Health Department - Environment and Health Data Portal"];


function printModal() {
    $('#printModal').modal('show');
    setTimeout(printViz,500)
}


// ----------------------------------------------------------------------- //
// Draw chart
// ----------------------------------------------------------------------- //

let wrapLegend = false;

function printViz() {

    window.innerWidth < 960 ? wrapLegend = true : wrapLegend = false

    chartType === 'trend' ? changeTrendSpec() : {}
    chartType === 'map' ? changeMapSpec(vizYear,vizGeography) : {}
    chartType === 'links' ? changeLinksSpec() : {}
    chartType === 'disparities' ? changeDisparitiesSpec() : {};



    vegaEmbed("#printVis", printSpec, {
      renderer: "svg",
        actions: {
          export: { png: true, svg: true },
          source: false,  
          compiled: false, 
          editor: true 
        }
      })
    
    updateChartPlotSize();

    gtag('event', 'print_viz', {
        chart_type: chartType
    });

}

// ----------------------------------------------------------------------- //
// Modify trend spec
// ----------------------------------------------------------------------- //

function changeTrendSpec() {

    printSpec.height = 400

    checkSourceLength()

    let sourceArray = ["Chart: NYC Health Department - Environment and Health Data Portal"]

    if (Array.isArray(vizSource)) {
          sourceArray.push(...vizSource); // Spread to add each item separately
      } else if (typeof vizSource === "string") {
          sourceArray.push(vizSource); // Add string directly
      }

    let columns;
    wrapLegend === true ? columns = 3 : columns = 6;

    printSpec.layer[1].encoding.color.legend = {
        "orient": "top",
        "title": null,
        "columns": columns,
        "labelFontWeight": "bold",
        "labelColor": {
          "expr": "scale('color', datum.label)"
          }
      }

    let sourceLayer = {
        "description": "layer with source info",
        "mark": {
          "type": "text",
          "fontSize": 11,
          "fontWeight": "normal",
          "align": "left",
          "baseline": "bottom",
          "dx": 5,
          "dy": 75
        },
        "data": {
            "values": [{}]  // Use an empty object as a dummy value
          },
        "encoding": {
            "text": {"value": sourceArray},
            "x": {"value": 0},
            "y": {"value": 400},
          "color": {"value": "gray"}
        }
      }

    let modalFootnotes = document.getElementById('modalFootnotes')

    modalFootnotes.innerHTML = document.getElementById('trend-unreliability').innerHTML

    modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};

    printSpec.layer.push(sourceLayer)
}

// ----------------------------------------------------------------------- //
// Modify map spec
// ----------------------------------------------------------------------- //

function changeMapSpec(x,y) {
  checkSourceLength();

  let sourceArray = initialSource;

  console.log(y)

  // Safely add sources only once
  if (Array.isArray(vizSource)) {
      const allElementsExist = vizSource.every(item => sourceArray.includes(item));
      console.log('do all elements exist in this array?', allElementsExist);

      if (!allElementsExist) {
          vizSource.forEach(item => {
              if (!sourceArray.includes(item)) {
                  sourceArray.push(item);
              }
          });
      }
  } else if (typeof vizSource === "string") {
      if (!sourceArray.includes(vizSource)) {
          sourceArray.push(vizSource);
      }
  }

  // Update the title safely
  if (!printSpec.title.text.includes(x)) {
      printSpec.title.text += ` - ${x} (${y})`;
  }

  // Check if a sourceLayer has already been added
  const sourceLayerExists = printSpec.vconcat.some(layer => {
      return layer.mark && layer.mark.type === 'text' && layer.encoding && layer.encoding.text && layer.encoding.text.value === sourceArray;
  });

  if (!sourceLayerExists) {
      let sourceLayer = {
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
              "text": { "value": sourceArray },
              "x": { "value": 0 },
              "y": { "value": 0 },
              "color": { "value": "gray" }
          }
      };

      printSpec.vconcat.push(sourceLayer);
  }

  // Update modal footnotes
  let modalFootnotes = document.getElementById('modalFootnotes');
  modalFootnotes.innerHTML = document.getElementById('map-unreliability').innerHTML;

  if (modalFootnotes.textContent.length < 8) {
      modalFootnotes.classList.add('hide');
  }
}


// ----------------------------------------------------------------------- //
// Modify links spec
// ----------------------------------------------------------------------- //

function changeLinksSpec() {
  checkSourceLength()

  let sourceArray = ["Chart: NYC Health Department - Environment and Health Data Portal"]

      if (Array.isArray(vizSource)) {
        sourceArray.push(...vizSource); // Spread to add each item separately
    } else if (typeof vizSource === "string") {
        sourceArray.push(vizSource); // Add string directly
    }

    sourceArray.push(vizSourceSecond)


    printSpec.config.legend = {
        "orient": "top",
        "title": null,
        "labelFontSize": 12,
        "labelFontWeight": "bold",
        "labelColor": {
          "expr": "scale('color', datum.label)"
          }
      }


    let sourceLayer = {
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
            "text": {"value": sourceArray},
            "x": {"value": 0},
            "y": {"value": 525},
          "color": {"value": "gray"}
        }
      }

      let modalFootnotes = document.getElementById('modalFootnotes')

      modalFootnotes.innerHTML = document.getElementById('links-unreliability').innerHTML
  
      modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};

    printSpec.layer.push(sourceLayer)
}


// ----------------------------------------------------------------------- //
// Modify disparities spec
// ----------------------------------------------------------------------- //

function changeDisparitiesSpec() {
    checkSourceLength()

    let sourceLayer = {
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

      let modalFootnotes = document.getElementById('modalFootnotes')

      modalFootnotes.innerHTML = document.getElementById('links-unreliability').innerHTML
  
      modalFootnotes.textContent.length < 8 ? modalFootnotes.classList.add('hide') : {};
    printSpec.layer.push(sourceLayer)
}

// ----------------------------------------------------------------------- //
// Deactive Save Button for table
// ----------------------------------------------------------------------- //
window.addEventListener('hashchange', function() {
  let chartbtn = document.getElementById('chartSaver')
  currentHash === 'display=summary' ? chartbtn.classList.add('disabled') : chartbtn.classList.remove('disabled')
});


// ----------------------------------------------------------------------- //
// Text splitter for long source text
// ----------------------------------------------------------------------- //


function checkSourceLength() {
  // console.log('vizSource')
  // console.log(vizSource.length)
  // console.log(vizSource)

  if (vizSource.length > 200) {
    vizSource = splitTextIntoLines(vizSource,200)
   // console.log('new vizSource array')
   // console.log(vizSource)
  } else {}
}

function splitTextIntoLines(text, maxLength) {
  let words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach(word => {
      if ((currentLine + word).length > maxLength) {
          lines.push(currentLine.trim()); // Push the current line
          currentLine = word + " "; // Start a new line
      } else {
          currentLine += word + " ";
      }
  });

  if (currentLine.trim()) {
      lines.push(currentLine.trim()); // Push the last line
  }

  return lines; // Return an array of split lines
}