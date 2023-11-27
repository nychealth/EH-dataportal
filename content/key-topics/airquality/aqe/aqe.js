"use strict";


// flexdatalist initial:

// ===== load flexdatalist ================================================== //

const load_flexdatalist = async () => {

  // ----- get NTA with associated zipcodes -------------------------------------------------- //
  
  await fetch(`nta_zip_collapsed.json`)
      .then(response => response.json())
      .then(data => {

          let nta_zip_collapsed = data;
          // console.log("nta_zip_collapsed", nta_zip_collapsed);
          
          // ----- init flexdatalist -------------------------------------------------- //
          
          let $input = $('.flexdatalist').flexdatalist({
              minLength: 0,
              valueProperty: ["GEOCODE", "GEONAME"],
              textProperty: "{GEONAME}",
              selectionRequired: false,
              focusFirstResult: true,
              visibleProperties: ["NTACode", "GEONAME", "zipcode"],
              searchIn: ["GEONAME", "zipcode"],
              searchContain: true,
              searchByWord: true,
              redoSearchOnFocus: true,
              toggleSelected: true,
              cache: false,
              data: nta_zip_collapsed
          });

          console.log("$input", $input);
          
          // ----- add flexdatalist select handler -------------------------------------------------- //

          $input.on('select:flexdatalist', (e, set) => {
              
              console.log("set", set);

              // set neighborhood name on page
              
                // document.querySelector("#NTA").innerHTML = '<h4>' + DOMPurify.sanitize(set.GEONAME) + '</h4>';
              
              // call dataChange

              // dataChange(set.GEOCODE);

              // call tester Function
              setNeighborhood(set.NTACode, set.GEONAME)
              
          })

          // ----- add clear button handler -------------------------------------------------- //

          $("#clear").on("click", (e) => {

              console.log("e [clear click]", e);

              $($input).find("~input").val("").trigger( "focus" )
              
          })

      })
}

// ----- Load data and call loader function -------------------------------------------------- //
var allData = [];
var neighborhoodData = [];

d3.csv('aqe-nta.csv', d3.autoType).then(data => {

  allData = data;

  // console.table(allData);

  load_flexdatalist()

  renderChart('#NODestination','NOx','BK0102')

  renderChart('#PMDestination','PM','BK0101')

}); 




function setNeighborhood(x, y) {
  console.log('geocode',x)
  console.log(y)
  document.getElementById('NTA2').innerHTML = y

  // ingest data file and filter by GEOCODE
  neighborhoodData = allData.filter(neighb => neighb.NTACODE == x)

  console.table(neighborhoodData)

  document.getElementById('thisPM').innerHTML = Number(neighborhoodData[0].TotalPM).toFixed(2)
  document.getElementById('thisNOx').innerHTML = Number(neighborhoodData[0].TotalNOx).toFixed(2)

  sourceTertile(neighborhoodData[0].Building_emissions,"BE")
  sourceTertile(neighborhoodData[0].cook_tertiles,"CC")
  sourceTertile(neighborhoodData[0].Industrial_tertiles,"IA")
  sourceTertile(neighborhoodData[0].Traffic_tertiles,"TD")

}

function sourceTertile(x,dest) {

  var destination = document.getElementById(dest)

  if (x === 'High') {
    // change class
    destination.classList.add('badge-worse')
  } else if (x === 'Medium') {
    // change class
    destination.classList.add('badge-medium')
  } else if (x === 'Low') {
    // change class
    destination.classList.add('badge-better')
  }

  destination.innerHTML = x

}






const renderChart = (
  destination, // #PMDestination or #NODestination
  variable,    // PM or NOx 
  neighborhood // NTACode
) => {

  // add conditionals for TITLE, units, etc.
  var title
  var units

  if (variable === 'PM') {
    title = "PM2.5 (μg/m3)"
  } else if (variable === 'NOx') {
    title = "NOx (ppb)"
  }

  var barSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": title,
      "subtitlePadding": 10,
      "fontWeight": "normal",
      "anchor": "start",
      "fontSize": 12,
      "font": "sans-serif",
      "baseline": "top"
    },
    "data": {
      "url": "aqe-nta.csv"
    },
    "transform": [
      {"calculate": "toNumber(datum.TotalPM)", "as": "PM"},
      {"calculate": "toNumber(datum.TotalNOx)", "as": "NOx"}
    ],
    "config": {
      "concat": {"spacing": 20},
      "view": {"stroke": "transparent"},
      "axisY": {"domain": false, "ticks": false,"orient": "left"}
    },
    "layer": [
          {
        "height": "container",
        "width": "container",
        "config": {"axisY": {"labelAngle": 0, "labelFontSize": 13}},
        "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
        "encoding": {
          "y": {
            "field": `${variable}`,
            "type": "quantitative",
            "title": null,
            "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
          },
          "tooltip": [
            {"field": "NTA_NAME", "title": "Neighborhood"},
            {"field": `${variable}`, "title": `${title}`,"format": ".2f"}
          ],
          "x": {
            "field": "NTA_NAME", 
            "sort": "y", 
            "axis": null
            },
          "color": {
            "condition": {
              "test": `datum['NTACODE'] === '${neighborhood}'`,
              "value": "cyan"
              },
            "value": "darkgray"
            },
          "strokeWidth": {
            "condition": {
              "test": `datum['NTACODE'] === '${neighborhood}'`,
              "value": 1  
            },
            "value": 0
          } 
        }
      }
    ]
  }

  console.log(barSpec)

  vegaEmbed(destination, barSpec, {actions:false})
}