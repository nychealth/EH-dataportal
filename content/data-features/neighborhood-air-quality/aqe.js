"use strict";

/* STILL NEEDS:
- Passing the geography into the renderChart and renderMap functions properly to highlight the selected neighborhood
- A tolerable Initial State that draws attention to "Choose a neighborhood"

*/

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
              setNeighborhood(set.NTACode, set.GEONAME, set.zipcode)
              
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

  renderChart('#NODestination','NO2','')

  renderChart('#PMDestination','PM','')

  renderMap(1,'')

}); 



var thisGeocode
function setNeighborhood(x, y, z) {
  document.getElementById('showNeighb').classList.remove('hide')

  console.log('geocode',x)
  thisGeocode = x
  console.log(y)
  document.getElementById('NTA2').innerHTML = y
  document.getElementById('NTA2').classList.add('yourN')
  document.getElementById('NTA3').classList.add('yourN')
  document.getElementById('NTA3').innerHTML = y
  document.getElementById('NTA4').innerHTML = y
  document.getElementById('NTA4').classList.add('yourN')
  document.getElementById('zips').innerHTML = z

  // ingest data file and filter by GEOCODE
  neighborhoodData = allData.filter(neighb => neighb.NTACODE == x)

  console.table(neighborhoodData)

  document.getElementById('thisPM').innerHTML = Number(neighborhoodData[0].PM_Avg).toFixed(2)
  document.getElementById('thisNO2').innerHTML = Number(neighborhoodData[0].NO2_Avg).toFixed(2)

  sourceTertile(neighborhoodData[0].Building_emissions,"BE")
  sourceTertile(neighborhoodData[0].cook_tertiles,"CC")
  sourceTertile(neighborhoodData[0].Industrial_tertiles,"IA")
  sourceTertile(neighborhoodData[0].Traffic_tertiles,"TD")

  renderChart('#NODestination','NO2',x)

  renderChart('#PMDestination','PM',x)

  renderMap(1,x)

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
  variable,    // PM or NO2
  neighborhood // NTACode
) => {

  // add conditionals for TITLE, units, etc.
  var title
  var units

  if (variable === 'PM') {
    title = "PM2.5 (μg/m3)"
  } else if (variable === 'NO2') {
    title = "NO2 (ppb)"
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
      {"calculate": "toNumber(datum.PM_Avg)", "as": "PM"},
      {"calculate": "toNumber(datum.NO2_Avg)", "as": "NO2"}
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
          },
          "stroke": {
            "condition": {"test": `datum.NTACODE === '${neighborhood}'`, "value": "cyan"},
            "value": "darkgray"
            }
        }
      }
    ]
  }

  console.log(barSpec)

  vegaEmbed(destination, barSpec, {actions:false})
}



function changeSource(x) {
  console.log(x)

  // get all class sourceBox and remove active
  var sourceBoxes = document.querySelectorAll(".sourceBox")
  for (let i = 0; i < sourceBoxes.length; i++) {
      sourceBoxes[i].classList.remove('sourceBox-active')
  }

  // highlight what you clicked on
  var thisBox = 'sourceBox' + x
  document.getElementById(thisBox).classList.add('sourceBox-active')

  // change map
  var title;

  if (x==1) {
      title = 'Building emissions'
  } else if (x==2) {
      title = "Commercial cooking"
  } else if (x==3) {
      title = "Industrial area"
  } else if (x==4) {
      title = "Traffic density"
  }

  document.getElementById('mapTitle').innerHTML = title
  renderMap(x,thisGeocode)
}

const renderMap = (
  x,           // indicator
  neighborhood // NTACode
) => {
    var title;
    var indicator
    var label;

    if (x===1) {
        title = 'Building emissions'
        indicator = 'numeric_Building_emissions'
        label = 'Building_emissions'
    } else if (x===2) {
        title = "Commercial cooking"
        indicator = 'numeric_cook_tertiles'
        label = 'cook_tertiles'
    } else if (x===3) {
        title = "Industrial area"
        indicator = 'numeric_Industrial_tertiles'
        label = 'Industrial_tertiles'
    } else if (x===4) {
        title = "Traffic density"
        indicator = 'numeric_Traffic_tertiles'
        label = 'Traffic_tertiles'
    }

    var mapSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "width": "container",
      "height": "container",
      "autosize": {"type": "fit", "contains": "padding"},
      "config": {
          "view": {"stroke": "transparent"},
      },
      "layer": [
        {
          "data": {
            "url": data_repo + data_branch + "/geography/NTA_2020.topo.json",
            "format": {"type": "topojson", "feature": "collection"}
          },
          "mark": {"type": "geoshape", "stroke": "#ffffff", "fill": "lightgray"}
        },
        {
          "data": {
            "url": data_repo + data_branch + "/geography/NTA_2020.topo.json",
            "format": {"type": "topojson", "feature": "collection"}
          },
          "transform": [
            {
              "lookup": "properties.NTA2020",
              "from": {
                "data": {
                  "url": "https://gist.githubusercontent.com/mmontesanonyc/1d27a5ab8fbbfea417e3308c733725f3/raw/1fe4964652a361b0e3c9b95b26a1116da723fe8e/aqe-nta.csv"
                },
                "key": "NTACODE",
                "fields": [
                  "NTACODE",
                  "NTA_NAME",
                  "PM_Avg",
                  "NO2_Avg",
                  "cook_tertiles",
                  "Building_emissions",
                  "Industrial_tertiles",
                  "Traffic_tertiles"
                ]
              }
            },
            {
              "calculate": "if(datum.cook_tertiles === 'Low', 1, if(datum.cook_tertiles === 'Medium', 2, 3))",
              "as": "numeric_cook_tertiles"
            },
            {
              "calculate": "if(datum.Building_emissions === 'Low', 1, if(datum.Building_emissions === 'Medium', 2, 3))",
              "as": "numeric_Building_emissions"
            },
            {
              "calculate": "if(datum.Industrial_tertiles === 'Low', 1, if(datum.Industrial_tertiles === 'Medium', 2, 3))",
              "as": "numeric_Industrial_tertiles"
            },            {
              "calculate": "if(datum.Traffic_tertiles === 'Low', 1, if(datum.Traffic_tertiles === 'Medium', 2, 3))",
              "as": "numeric_Traffic_tertiles"
            }
          ],
          "mark": {"type": "geoshape", "stroke": "#000000"},
          "encoding": {
            "color": {
              "field": indicator,
              "type": "nominal",
              "scale": {
                "type": "ordinal",
                "range": ["#f5f1f8","#bcbcdc","#8077b6"]
                },
              "legend": null
            },
            "strokeWidth": {
              "condition": {"test": `datum.NTACODE === '${neighborhood}'`, "value": 2.5},
              "value": 0.5
              },
            "stroke": {
              "condition": {"test": `datum.NTACODE === '${neighborhood}'`, "value": "cyan"},
              "value": "darkgray"
              },
            "order": {
              "condition": {"test": `datum.NTACODE === '${neighborhood}'`, "empty": false, "value": 1},
                "value": 0
            },
            "tooltip": [
              {
                  "field": "properties.GEONAME",
                  "type": "nominal",
                  "title": "Neighborhood"
                },
                {
                  "field": label,
                  "type": "nominal",
                  "title": title
                }
            ]
          }
        }
      ]
    }
    
    vegaEmbed("#mapHolder", mapSpec, {actions:false})


}