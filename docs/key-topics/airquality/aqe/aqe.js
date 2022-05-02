"use strict";

  // STYLES AUTOCOMPLETE FORM
  var selectEl = document.querySelector('#last-neighborhood')
  accessibleAutocomplete.enhanceSelectElement({
    autoselect: true,
    confirmOnBlur: true,
    defaultValue: "",
    minLength: 2,
    selectElement: selectEl
    // setTimeout(function(){ alert("Hello"); }, 3000);
    //,onConfirm: setTimeout(function(){document.querySelector("form").requestSubmit()},7000)
    //,onConfirm: (val) => {console.log('hi '+val)}
  })

    // EVENT LISTENER ON FORM, RETRIEVE VALUE 
    var neighborhoodName;
    var ntaCode;
    var ntaForm = document.getElementById('nta-form');
    ntaForm.addEventListener('submit', function (event) {
      event.preventDefault(); //prevent page re-load
      neighborhoodName = event.target[0].value; // gives you full neighborhood name
      ntaCode = event.target[0].value.slice(0, 4); //  gives you NTA code
  
      document.getElementById('NTA').innerHTML = 'Your neighborhood: <h3><span style="font-weight:bold;color:#15607a">' + neighborhoodName + '</span></h3>';
      document.getElementById('yourneighb').style.display = "block";

     dataFilter();
     
    dataChange();
    });



// Create and initialize variables
var nyccasData = [];
var neighborhoodData = [];
var selectedNeighborhood = ['']; //document.querySelector("#ntaField")

var selectedName = '';
var dPM = 0;
var dNO2 = 0;
var dBuildingEmissions = 0;
var dBuildingDensity = 0;
var dTrafficDensity = 0;
var dIndustrial = 0;
var tabShown = 'tab-01-a'; //let tabSpec = '';
//const trafficMapSpec = "./js/TrafficmapSpec.vl.json";    //These spec definitions were moved to a tab function
//const industrialMapSpec = "./js/IndustrialmapSpec.vl.json";
//const BDmapSpec = "./js/BDmapSpec.vl.json";
//const BEmapSpec = "/js/BEmapSpec.vl.json";

var PMBarVGSpec = `PMBarSpec.vg.json`;
var NO2BarVGSpec = `NO2BarSpec.vg.json`;
var embed_opt = {
  actions:false
};

// LOAD MAP JSON
var nta_topojson = d3.json("https://grantpezeshki.github.io/NYC-topojson/NTA.json"); //the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

// LOAD DATA
d3.csv(`../../../visualizations/csv/aqe/aqe-nta.csv`).then(function (data) {
  nyccasData = data;
  console.log(nyccasData);
}); 

// FILTER DATA BASED ON SELECTION FROM FORM
function dataFilter() {
  neighborhoodData = nyccasData.filter(function (sf) {
    return sf.NTACode === ntaCode;
  });
}

// at this point we have: neighborhoodName (full name), ntaCode (4-digit), and neighborhooData (array of data)

// UPON SELECTION, UPDATES DATA
function dataChange() {
  console.log('hi from dataChange function');
  selectedNeighborhood = ntaCode; //document.querySelector("#ntaField").value;

  selectedName = neighborhoodData[0].NTAName; //neighborhoodData[0].NTAName;

  dPM = neighborhoodData[0].Avg_annavg_PM25;
  dPM = numRound(dPM);
  dNO2 = neighborhoodData[0].Avg_annavg_NO2;
  dNO2 = numRound(dNO2);
  dBuildingEmissions = neighborhoodData[0].tertile_buildingemissions;
  dBuildingDensity = neighborhoodData[0].tertile_buildingdensity;
  dTrafficDensity = neighborhoodData[0].tertile_trafficdensity;
  dIndustrial = neighborhoodData[0].tertile_industrial;
  // document.querySelector("#NTA").innerHTML = 'Your neighborhood: <h3><span style="font-weight:bold;color:#15607a">' + selectedName + '</span></h3>';
  document.querySelector("#PM").innerHTML = dPM + ' μg/m<sup>3</sup>';
  document.querySelector("#NO2").innerHTML = dNO2 + ' ppb';
  document.querySelector("#BuildingEmissions").innerHTML = 'Building emissions<br><h5>' + tertileTranslate(dBuildingEmissions) + '</h5>';
  document.querySelector("#BuildingDensity").innerHTML = 'Building density<br><h5>' + tertileTranslate(dBuildingDensity) + '</h5>';
  document.querySelector("#TrafficDensity").innerHTML = 'Traffic density<br><h5>' + tertileTranslate(dTrafficDensity) + '</h5>';
  document.querySelector("#Industrial").innerHTML = 'Industrial area<br><h5>' + tertileTranslate(dIndustrial) + '</h5>';
  loadMap(tabShown);
  loadPMBar();
  loadNO2Bar();
  console.log('changed');
} // rounding function lets us round all numbers the same


function numRound(x) {
  return Number.parseFloat(x).toFixed(1);
} // jquery commands track tab changes


$(document).ready(function () {
  $(document).alert('hi from jquery');
  $(".nav-pills a").click(function () {
    $(this).tab('show');
  });
  $('.nav-pills a').on('shown.bs.tab', function (event) {
    tabShown = $(event.target).attr('aria-controls'); // active tab
    // var y = $(event.relatedTarget).text();  // previous tab

    $(".act span").text(tabShown);
    $(".prev span").text("did it again");
    loadMap(tabShown);
    loadPMBar();
    loadNO2Bar();
  });
}); //Returns block-level badges for the tabs

function tertileTranslate(tertileVal) {
  if (tertileVal === "3") {
    return '<span class="badge badge-worse btn-block">high</span>';
  } else if (tertileVal === "2") {
    return '<span class="badge badge-medium btn-block">medium</span>';
  } else {
    return '<span class="badge badge-better btn-block">low</span>';
  }

  ;
} //Returns in-line badges for text


function tertileTranslate2(tertileVal) {
  if (tertileVal === "3") {
    return '<span class="badge badge-worse">high</span>';
  } else if (tertileVal === "2") {
    return '<span class="badge badge-medium">medium</span>';
  } else {
    return '<span class="badge badge-better">low</span>';
  }

  ;
} //Returns map insert/update div IDs


function mapUpdateID(tabShown) {
  if (tabShown === "tab-01-a") {
    return '#BEmap';
  } else if (tabShown === "tab-01-d") {
    return '#BDmap';
  } else if (tabShown === "tab-01-b") {
    return '#Industrialmap';
  } else if (tabShown === "tab-01-c") {
    return '#Trafficmap';
  } else {
    console.log('Error: not sure which map to update');
  }

  ;
} //Returns map specs for proper tab context


function mapUpdateSpec(tabShown) {
  if (tabShown === "tab-01-a") {
    return `BEmapSpec.vg.json`;
  } else if (tabShown === "tab-01-d") {
    return `BDmapSpec.vg.json`;
  } else if (tabShown === "tab-01-b") {
    return `IndustrialmapSpec.vg.json`;
  } else if (tabShown === "tab-01-c") {
    return `TrafficmapSpec.vg.json`;
  } else {
    console.log('Error: not sure which map to update');
  }

  ;
} //create a function to load the Building Density map. Invoked when user clicks the tab or when neighborhood changes.


function loadMap() {
  //console.log(mapUpdateID(tabShown));
  vegaEmbed(mapUpdateID(tabShown), mapUpdateSpec(tabShown), embed_opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    //result.view.insert('selectedNabe',selectedNeighborhood).run()
    result.view.signal("selectNTA", selectedNeighborhood).runAsync();
  }).catch(console.error);
} // load the maps initially


loadMap(); 

// load the PM Bar Chart
var el = document.getElementById('PMbar');
var pmBarView = vegaEmbed("#PMbar", PMBarVGSpec, embed_opt)
//.catch(function (error) {
//  return showError(el, error);
//})
.then(function (res) {
  return res.view.signal("selectNTA", selectedNeighborhood).runAsync();
}).catch(console.error);

function loadPMBar() {
  pmBarView = vegaEmbed("#PMbar", PMBarVGSpec, embed_opt)
 // .catch(function (error) {
 //   return showError(el, error);
 // })
  .then(function (res) {
    return res.view.signal("selectNTA", selectedNeighborhood).runAsync();
  }).catch(console.error);
} 

// load the NO2 Bar Chart


var ele = document.getElementById('NO2bar');
var NO2BarView = vegaEmbed("#NO2bar", NO2BarVGSpec, embed_opt)
//.catch(function (error) {
//  return showError(ele, error);
//})
.then(function (res) {
  return res.view.insert("nyccasData", nyccasData).signal("selectNTA", selectedNeighborhood).runAsync();
}).catch(console.error);

function loadNO2Bar() {
  NO2BarView = vegaEmbed("#NO2bar", NO2BarVGSpec, embed_opt)
//  .catch(function (error) {
//    return showError(ele, error);
 // })
  .then(function (res) {
    return res.view.insert("nyccasData", nyccasData).signal("selectNTA", selectedNeighborhood).runAsync();
  }).catch(console.error);
}
/*   //These scripts load the maps initially but once a neighborhood is selected this is not needed
 //var spec = "https://raw.githubusercontent.com/vega/vega/master/docs/examples/bar-chart.vg.json";
var PMmapSpec = "./js/PMmapSpec.vl.json"
vegaEmbed('#PMmap', PMmapSpec).then(function(result) {
  // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
  //result.view.insert('selectedNabe',selectedNeighborhood).run()
}).catch(console.error);
  // these load the maps initially. 
 vegaEmbed('#BEmap', BEmapSpec).then(function(result) {
  // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
  //result.view.insert('selectedNabe',selectedNeighborhood).run()
}).catch(console.error);
 vegaEmbed('#BDmap', BDmapSpec).then(function(result) {
  // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
  //result.view.insert('selectedNabe',selectedNeighborhood).run()
}).catch(console.error);
 vegaEmbed('#Industrialmap', industrialMapSpec).then(function(result) {
  // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
  //result.view.insert('selectedNabe',selectedNeighborhood).run()
}).catch(console.error);
 vegaEmbed('#Trafficmap', trafficMapSpec).then(function(result) {
  // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
  //result.view.insert('selectedNabe',selectedNeighborhood).run()
}).catch(console.error);
*/

// Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('append')) {
      return;
    }
    Object.defineProperty(item, 'append', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function append() {
        var argArr = Array.prototype.slice.call(arguments),
          docFrag = document.createDocumentFragment();
        
        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });
        
        this.appendChild(docFrag);
      }
    });
  });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);