"use strict";

// Create and initialize variables
var hvidata = {};
var neighborhoodData = {};
var selectedNeighborhood = ['']; //document.querySelector("#ntaField")
var selectedName = '';

  // This script runs style/highlighting
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


  // This puts an event listener on the form, gets the neighborhood value, and dumps it into initial readout
  var neighborhoodName;
  var ntaCode;
  var ntaForm = document.getElementById('nta-form');
  ntaForm.addEventListener('submit', function (event) {
    event.preventDefault(); //prevent page re-load
    neighborhoodName = event.target[0].value; // gives you full neighborhood name
    ntaCode = event.target[0].value.slice(0, 4); //  gives you NTA code


    dataChange();
  });


// NTACODE,NTANAME,POV_PCT,PCT_BLACK_POP,GREENSPACE,SURFACETEMP,PCT_HOUSEHOLDS_AC,HVI_RANK,CD,HRI_HOSP_RATE

var nCD = "";
var nGREENSPACE = "";

var nHRI_HOSP_RATE = "";
var nHVI_RANK = "";
var nNTACODE = "";
var nNTANAME = "";
var nPCT_BLACK_POP = "";
var nPCT_HOUSEHOLDS_AC = "";
var nPOV_PCT = "";
var nSURFACETEMP = "";

// copy establishing variables for tertiles
var nPOV_PCTTERT = "";
var nGREENSPACETERT = "";
var nPCT_HOUSEHOLDS_ACTERT = "";
var nSURFACETEMPTERT = "";

// these variables hold the ids of the divs to hold the small circle graphs
var scLocTemp = "#tempTertile";
var scLocGreen = "#greenTertile";
var scLocAC = "#acTertile";
var scLocPov = "#povTertile";
var scLocBPop = "#bpopTertile";

var smallCircleMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "description": "A simple bar chart with named data.",
  "padding":1,
  "height":30,
  "width":"container",
  "autosize":"fit-x",
  "background":"#e6ecf7",
  "layer":[
  {
  "data":{"name":"hvi","url": "../../../visualizations/csv/hvi/hvi-nta.csv"},
  "mark": "circle",
  "encoding": {
    "x": {"field": "GREENSPACE","type": "quantitative","axis":null},
    "size":{"value":300},
    "opacity":{"value":0.1},
    "color": {"value":"gray"}
  }
  },{
  "data":{"name":"overlay","values": [{}]},
  "mark": "circle",
  "encoding": {
    "x": {"datum":30,"axis":null},
    "size":{"value":300},
    "color": {"value":"red"}
  }}]
};
//var SCM_spec = {};

var HVImapSpec = "HVIMapSpec.vg.json";  //"map/mapnta.vl.json"
var HospBarVGSpec = "HVIBarSpec.vg.json";

var embed_opt = {"renderer":"svg",
  actions:false
};





d3.csv("../../../visualizations/csv/hvi/hvi-nta.csv").then(function (data) {
  //console.log(data); // [{"Hello": "world"}, …]
  hvidata = data;

  console.log(hvidata);

}); 

// dataChange function updates selected neighborhood, then filter nyccas data and get new neighborhood data, then adds to DOM

function dataChange() {
  console.log('hi from dataChange function');

  neighborhoodData = hvidata.filter(function (sf) {
    return sf.NTACODE === ntaCode;
  });
  console.log(ntaCode);
  console.log(neighborhoodData);
  selectedNeighborhood = ntaCode; //document.querySelector("#ntaField").value;

  neighborhoodData = hvidata.filter(function (sf) {
    return sf.NTACODE === selectedNeighborhood;
  });
  selectedName = neighborhoodName; //neighborhoodData[0].NTAName;

  console.log(neighborhoodData[0]);
  nCD = neighborhoodData[0].CD;
  nGREENSPACE = neighborhoodData[0].GREENSPACE;  //green  *
  nHRI_HOSP_RATE = neighborhoodData[0].HRI_HOSP_RATE;  //hosp  **
  nHVI_RANK = neighborhoodData[0].HVI_RANK; //hvi  **
  nNTACODE = neighborhoodData[0].NTACODE; 
  nNTANAME = neighborhoodData[0].NTANAME; //nta1,2,3 etc
  nPCT_BLACK_POP = neighborhoodData[0].PCT_BLACK_POP;  //bpop  *
  nPCT_HOUSEHOLDS_AC = neighborhoodData[0].PCT_HOUSEHOLDS_AC; //ac  *
  nPOV_PCT = neighborhoodData[0].POV_PCT;  //pov  *
  nSURFACETEMP = neighborhoodData[0].SURFACETEMP;  //temp  *

  //copy this but for our tertiles
  nGREENSPACETERT = neighborhoodData[0].GREENSPACE_TERT; //GREENSPACETERTILE
  nSURFACETEMPTERT = neighborhoodData[0].SURFACETEMP_TERT;
  nPOV_PCTTERT = neighborhoodData[0].POV_TERT;
  nPCT_HOUSEHOLDS_ACTERT = neighborhoodData[0].AC_TERT;

  console.log(nPCT_HOUSEHOLDS_ACTERT);



  document.querySelector("#NTA").innerHTML = '<h4>' + selectedName + '</h4>';
  //document.querySelector("#NTA2").innerHTML = selectedName;
  //document.querySelector("#NTA3").innerHTML = selectedName;
  document.querySelector("#tempVal").innerHTML = nSURFACETEMP + '° F';
  document.querySelector("#greenVal").innerHTML = nGREENSPACE + '%';
  document.querySelector("#hospVal").innerHTML = nHRI_HOSP_RATE + ' per 100,000 people';
  document.querySelector("#hviVal").innerHTML = '<h4>' + nHVI_RANK + ' out of 5</h4>';
  document.querySelector("#bpopVal").innerHTML = nPCT_BLACK_POP + '%';
  document.querySelector("#acVal").innerHTML = nPCT_HOUSEHOLDS_AC + '%';
  document.querySelector("#povVal").innerHTML = nPOV_PCT + '%';

  //adding tertile delivery
  document.querySelector("#tempTert").innerHTML = nSURFACETEMPTERT;
  document.querySelector("#greenTert").innerHTML = nGREENSPACETERT;
  document.querySelector("#povTert").innerHTML = nPOV_PCTTERT;
  document.querySelector("#acTert").innerHTML = nPCT_HOUSEHOLDS_ACTERT;

  loadMap();

  //load_smallCircles(scLocTemp,"SURFACETEMP",neighborhoodData[0].SURFACETEMP); 
  //load_smallCircles(scLocGreen,"GREENSPACE",neighborhoodData[0].GREENSPACE); 
  //load_smallCircles(scLocAC,"PCT_HOUSEHOLDS_AC",neighborhoodData[0].PCT_HOUSEHOLDS_AC); 
  //load_smallCircles(scLocPov,"POV_PCT",neighborhoodData[0].POV_PCT); 
  //load_smallCircles(scLocBPop,"PCT_BLACK_POP",neighborhoodData[0].PCT_BLACK_POP); 
  loadHospBar();
  console.log('changed');
  console.log(selectedNeighborhood);
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
    loadHospBar();
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




function loadMap() {
  //console.log(mapUpdateID(tabShown));
  vegaEmbed('#mapvis', HVImapSpec, embed_opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    //result.view.insert('selectedNabe',selectedNeighborhood).run()
    result.view.signal("selectNTA", selectedNeighborhood).runAsync();
  }).catch(console.error);
} // load the maps initially


loadMap(); 

function load_smallCircles(loc,field,val) {
  //console.log(mapUpdateID(tabShown));
  smallCircleMapSpec.layer[0].encoding.x.field = field;
  smallCircleMapSpec.layer[1].encoding.x.datum = val;
  vegaEmbed(loc, smallCircleMapSpec, embed_opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    //result.view.insert('selectedNabe',selectedNeighborhood).run()
    //result.view.signal("selectNTA", selectedNeighborhood).runAsync();
  }).catch(console.error);
} // load the maps initially


//load_smallCircles(smallCircleLoc,1); 

// load the Hospitalization Bar Chart
var el = document.getElementById('PMbar');
var pmBarView = vegaEmbed("#PMbar", HospBarVGSpec, embed_opt)
//.catch(function (error) {
//  return showError(el, error);
//})
.then(function (res) {
  return res.view.signal("selectNTA", selectedNeighborhood).runAsync();
}).catch(console.error);

function loadHospBar() {
  pmBarView = vegaEmbed("#PMbar", HospBarVGSpec, embed_opt)
 // .catch(function (error) {
 //   return showError(el, error);
 // })
  .then(function (res) {
    return res.view.signal("selectNTA", selectedNeighborhood).runAsync();
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