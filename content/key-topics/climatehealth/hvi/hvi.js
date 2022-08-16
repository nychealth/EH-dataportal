"use strict";

// Create and initialize variables

var hvidata = {};
var neighborhoodData = {};
var selectedNeighborhood = [''];
var selectedName = '';

// This script runs style/highlighting

var selectEl = document.querySelector('#last-neighborhood')

accessibleAutocomplete.enhanceSelectElement({
    autoselect: true,
    confirmOnBlur: true,
    defaultValue: "",
    minLength: 2,
    selectElement: selectEl
})


// This puts an event listener on the form, gets the neighborhood value, and dumps it into initial readout

var neighborhoodName;
var selectedNeighborhood;
var ntaForm = document.getElementById('nta-form');

ntaForm.addEventListener('submit', function (event) {
    
    event.preventDefault();                                   // prevent page re-load
    neighborhoodName = event.target[0].value;                 // gives you full neighborhood name
    selectedNeighborhood = event.target[0].value.slice(0, 4); // gives you NTA code

    dataChange();
    
});

// interactive variables

var nCD = "";
var nGREENSPACE = "";

var nHRI_HOSP_RATE = "";
var nHVI_RANK = "";
var nNTACode = "";
var nNTAName = "";
var nPCT_BLACK_POP = "";
var nPCT_HOUSEHOLDS_AC = "";
var nPOV_PCT = "";
var nSURFACETEMP = "";

// path variables

var hvi_path   = data_repo + "/" + data_branch + "/key-topics/heat-vulnerability-index";
var hvi_url    = hvi_path + "/hvi-nta.csv";
var HVImapSpec = "HVIMapSpec.vg.json";

// path to topo json, will be loaded by vega

var nta_topojson = data_repo + "/" + data_branch + "/geography/NTA3.topo.json"; 

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

//var SCM_spec = {};

var embed_opt = {
    "renderer": "svg",
    actions: false
};


// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

d3.csv(hvi_url, d3.autoType).then(data => {
    hvidata = data;
    console.log("hvidata [load]", hvidata);
}); 


// dataChange function updates selected neighborhood, then filter hvi data and get new neighborhood data, then adds to DOM

function dataChange() {

    neighborhoodData = hvidata.filter(sf => {

        return sf.NTACode === selectedNeighborhood;

    });

    selectedName = neighborhoodName;
    nCD = neighborhoodData[0].CD;
    nGREENSPACE = neighborhoodData[0].GREENSPACE;  // green  *
    nHVI_RANK = neighborhoodData[0].HVI_RANK; // hvi  **
    nNTACode = neighborhoodData[0].NTACode;
    nNTAName = neighborhoodData[0].NTAName; // nta1,2,3 etc
    nPCT_BLACK_POP = neighborhoodData[0].PCT_BLACK_POP;  // bpop  *
    nPCT_HOUSEHOLDS_AC = neighborhoodData[0].PCT_HOUSEHOLDS_AC; // ac  *
    nPOV_PCT = neighborhoodData[0].POV_PCT;  // pov  *
    nSURFACETEMP = neighborhoodData[0].SURFACETEMP;  // temp  *

    // copy this but for our tertiles

    nGREENSPACETERT = neighborhoodData[0].GREENSPACE_TERT; // GREENSPACETERTILE
    nSURFACETEMPTERT = neighborhoodData[0].SURFACETEMP_TERT;
    nPOV_PCTTERT = neighborhoodData[0].POV_TERT;
    nPCT_HOUSEHOLDS_ACTERT = neighborhoodData[0].AC_TERT;

    document.querySelector("#NTA").innerHTML = '<h4>' + DOMPurify.sanitize(selectedName) + '</h4>';
    document.querySelector("#tempVal").innerHTML = nSURFACETEMP + '° F';
    document.querySelector("#greenVal").innerHTML = nGREENSPACE + '%';
    document.querySelector("#hviVal").innerHTML = '<h4>' + nHVI_RANK + ' out of 5</h4>';
    document.querySelector("#bpopVal").innerHTML = nPCT_BLACK_POP + '%';
    document.querySelector("#acVal").innerHTML = nPCT_HOUSEHOLDS_AC + '%';
    document.querySelector("#povVal").innerHTML = nPOV_PCT + '%';

    // adding tertile delivery
    document.querySelector("#tempTert").innerHTML = nSURFACETEMPTERT;
    document.querySelector("#greenTert").innerHTML = nGREENSPACETERT;
    document.querySelector("#povTert").innerHTML = nPOV_PCTTERT;
    document.querySelector("#acTert").innerHTML = nPCT_HOUSEHOLDS_ACTERT;

    buildMap('#mapvis', HVImapSpec, hvidata, nta_topojson, selectedNeighborhood);

} 

// rounding function lets us round all numbers the same

function numRound(x) {
    return Number.parseFloat(x).toFixed(1);
} 


// Returns block-level badges for the tabs

function tertileTranslate(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse btn-block">high</span>';
        
    } else if (tertileVal == 2) {
        return '<span class="badge badge-medium btn-block">medium</span>';
        
    } else {
        return '<span class="badge badge-better btn-block">low</span>';
        
    }
}


// Returns in-line badges for text

function tertileTranslate2(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse">high</span>';
        
    } else if (tertileVal == 2) {
        return '<span class="badge badge-medium">medium</span>';
        
    } else {
        return '<span class="badge badge-better">low</span>';
        
    }
} 


// function to build maps

function buildMap(div, spec, csv, topo, nbr) {
    
    var new_view;

    // console.log("csv 1 [buildMap]", csv);

    d3.json(spec).then(spec => {
            
        // console.log("csv 2 [then(spec => {", csv);

        // get data object whose url is "topo"
        
        var topo_url = spec.data.filter(data => {return data.url === "topo"})[0];
        
        console.log("topo_url", topo_url);
        
        // update url element of this data array (which updates the spec), because
        //  top_url is a shallow copy / reference to the spec
        
        topo_url.url = topo;
        
        vegaEmbed(div, spec, embed_opt)
            .then(async res => {

                // console.log("csv 3 [then(res => {]", csv);

                new_view = 
                    await res.view
                        .signal("selectNTA", nbr)
                        .insert("hviData", csv)
                        .logLevel(vega.Info)
                        .runAsync();

                console.log("getState", new_view.getState());
                
            })
            .catch(console.error);

    });
}


// load the charts after the page loads

$( window ).on( "load", function() {

    // console.log("load");

    // load the map
    
    buildMap('#mapvis', HVImapSpec, hvidata, nta_topojson, selectedNeighborhood);

});


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
