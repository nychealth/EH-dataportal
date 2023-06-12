// "use strict";

// Create and initialize variables

var hvidata = {};
var neighborhoodData;
var selectedNeighborhood = [''];
var selectedName = '';

// This script runs style/highlighting

var selectEl = document.querySelector('#last-neighborhood')

// accessibleAutocomplete.enhanceSelectElement({
//     autoselect: true,
//     confirmOnBlur: true,
//     defaultValue: "",
//     minLength: 2,
//     selectElement: selectEl
// })


// This puts an event listener on the form, gets the neighborhood value, and dumps it into initial readout

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to load flexdatalist
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const load_flexdatalist = async () => {

    console.log("** load_flexdatalist");

    // get NTA with associated zipcodes

    let nta_zip_collapsed;

    await fetch(`nta_zip_collapsed.json`)
        .then(response => response.json())
        .then(data => {
            nta_zip_collapsed = data;
            console.log("nta_zip_collapsed", nta_zip_collapsed);
        })
    
    // init flexdatalist

    let $input = $('.flexdatalist').flexdatalist({
        minLength: 0,
        valueProperty: ["NTACode", "NTAName"],
        textProperty: "{NTACode}: {NTAName}",
        selectionRequired: false,
        focusFirstResult: true,
        visibleProperties: ["NTACode", "NTAName", "zipcode"],
        searchIn: ["NTACode", "NTAName", "zipcode"],
        searchContain: true,
        searchByWord: true,
        redoSearchOnFocus: true,
        cache: false,
        data: nta_zip_collapsed
    });


    // console.log("$input [load_flexdatalist]:", $input);
        
    $input.on('select:flexdatalist', (e, set) => {

        console.log(">> select:flexdatalist");

        console.log("set", set);

        selectedName = set.NTAName;

        dataChange(set.NTACode);

    })
}


// interactive variables

var nCD = "";
var nGREENSPACE = "";

// var nHRI_HOSP_RATE = "";
var nHVI_RANK = "";
var nNTACode = "";
var nNTAName = "";
var nPCT_BLACK_POP = "";
var nPCT_HOUSEHOLDS_AC = "";
var nMEDIAN_INCOME = "";
var nSURFACE_TEMP = "";

// path variables

// 'data_repo' and 'data_branch' are created from Hugo variables in the aqe.html template

// var hvi_path   = data_repo + data_branch + "/key-topics/heat-vulnerability-index";
// var hvi_path   = data_repo + data_branch + "/key-topics/heat-vulnerability-index";
// var hvi_url    = hvi_path + "/hvi-nta-2020.csv";
var hvi_url    = "hvi-nta-2020.csv";
var HVImapSpec = "HVIMapSpec.vg.json";

// path to topo json, will be loaded by vega

var nta_topojson = data_repo + data_branch + "/geography/NTA_2020.topo.json"; 

// copy establishing variables for tertiles

var nINCOME_TERT= "";
var nGREENSPACE_TERT = "";
var nAC_TERT = "";
var nSURFACE_TEMP_TERT = "";

// these variables hold the ids of the divs to hold the small circle graphs

var scLocTemp = "#tempTertile";
var scLocGreen = "#greenTertile";
var scLocAC = "#acTertile";
var scLocInc = "#incTertile";
var scLocBPop = "#bpopTertile";

//var SCM_spec = {};

var embed_opt = {
    actions: false
};


// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

d3.csv(hvi_url, d3.autoType).then(data => {
    hvidata = data;
    console.log("hvidata", hvidata);
}); 

function round(x, d = 1) {
  return Number.parseFloat(x).toFixed(d);
}


// dataChange function updates selected neighborhood, then filter hvi data and get new neighborhood data, then adds to DOM

function dataChange(selectedNeighborhood) {

    neighborhoodData = hvidata.filter(sf => {
        
        // geo code used in hvi.html is the character NTACode, so using that here instead of numeric GEOCODE

        return sf.NTACode === selectedNeighborhood;

    });


    nSURFACE_TEMP = round(neighborhoodData[0].SURFACE_TEMP);  // temp  *
    nGREENSPACE = round(neighborhoodData[0].GREENSPACE);  // green  *
    nHVI_RANK = neighborhoodData[0].HVI_RANK; // hvi  **
    nPCT_BLACK_POP = neighborhoodData[0].PCT_BLACK_POP;  // bpop  *
    nPCT_HOUSEHOLDS_AC = round(neighborhoodData[0].PCT_HOUSEHOLDS_AC); // ac  *
    nMEDIAN_INCOME = neighborhoodData[0].MEDIAN_INCOME_chr;  // inc  *

    // copy this but for our tertiles

    nSURFACE_TEMP_TERT = neighborhoodData[0].SURFACE_TEMP_TERT;
    nGREENSPACE_TERT = neighborhoodData[0].GREENSPACE_TERT; // GREENSPACE_TERTILE
    nINCOME_TERT= neighborhoodData[0].POV_TERT;
    nAC_TERT = neighborhoodData[0].AC_TERT;

    // fill html elements

    document.querySelector("#NTA").innerHTML = '<h4>' + DOMPurify.sanitize(selectedName) + '</h4>';
    document.querySelector("#tempVal").innerHTML = nSURFACE_TEMP + '° F';
    document.querySelector("#greenVal").innerHTML = nGREENSPACE + '%';
    document.querySelector("#hviVal").innerHTML = '<h4>' + nHVI_RANK + ' out of 5</h4>';
    document.querySelector("#bpopVal").innerHTML = nPCT_BLACK_POP + '%';
    document.querySelector("#acVal").innerHTML = nPCT_HOUSEHOLDS_AC + '%';
    document.querySelector("#incVal").innerHTML = "$" + nMEDIAN_INCOME;

    // adding tertile delivery

    document.querySelector("#tempTert").innerHTML = tertileTranslate2(nSURFACE_TEMP_TERT);
    document.querySelector("#greenTert").innerHTML = tertileTranslate2(nGREENSPACE_TERT);
    document.querySelector("#incTert").innerHTML = tertileTranslate2(nINCOME_TERT);
    document.querySelector("#acTert").innerHTML = tertileTranslate2(nAC_TERT);

    // rebuild map

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

    console.log("nbr", nbr);
    
    d3.json(spec).then(spec => {
            
        // get data object whose url is "topo"
        
        var topo_url = spec.data.filter(data => {return data.url === "topo"})[0];
        
        // update url element of this data array (which updates the spec), because
        //  top_url is a shallow copy / reference to the spec
        
        topo_url.url = topo;
        
        vegaEmbed(div, spec, embed_opt)
            .then(async res => {

                var res_view = 
                    await res.view
                        .signal("selectNTA", nbr)
                        .insert("hviData", csv)
                        .logLevel(vega.Info)
                        .runAsync();

                // console.log("getState", res_view.getState());
                
            })
            .catch(console.error);

    });
}


// load the charts after the page loads

$( window ).on( "load", function() {

    // load the map

    load_flexdatalist()
    
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
