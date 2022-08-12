"use strict";

// STYLES AUTOCOMPLETE FORM

var selectEl = document.querySelector('#last-neighborhood')
accessibleAutocomplete.enhanceSelectElement({
    autoselect: true,
    confirmOnBlur: true,
    defaultValue: "",
    minLength: 2,
    selectElement: selectEl
})

// EVENT LISTENER ON FORM, RETRIEVE VALUE 

var neighborhoodName;
var ntaCode;
var ntaForm = document.getElementById('nta-form');

ntaForm.addEventListener('submit', function (event) {
    
    event.preventDefault();                      // prevent page re-load
    neighborhoodName = event.target[0].value;    // gives you full neighborhood name
    ntaCode = event.target[0].value.slice(0, 4); // gives you NTA code
    
    document.getElementById('NTA').innerHTML = 'Your neighborhood: <h3><span style="font-weight:bold;color:#15607a">' + DOMPurify.sanitize(neighborhoodName) + '</span></h3>';
    document.getElementById('yourneighb').style.display = "block";
    
    dataFilter();
    
    dataChange();
});

// import parameters passed from js.Build with Hugo

// import * as params from '@params';

console.log("data_branch [inside aqe.js]", data_branch);

// Create and initialize variables

var nyccasData = [];
var neighborhoodData = [];
var selectedNeighborhood = [''];
var selectedName = '';
var dPM = 0;
var dNO2 = 0;
var dBuildingEmissions = 0;
var dBuildingDensity = 0;
var dTrafficDensity = 0;
var dIndustrial = 0;
var tabShown = 'tab-01-a'; 
var aqe_path = "https://raw.githubusercontent.com/nychealth/EHDP-data/" + data_branch + "/key-topics/airqualityexplorer";
var nyccas_url = "https://raw.githubusercontent.com/nychealth/EHDP-data/" + data_branch + "/key-topics/airqualityexplorer/aqe-nta.csv";
var PMBarVGSpec = aqe_path + "/" + "PMBarSpec.vg.json";
var NO2BarVGSpec = aqe_path + "/" + "NO2BarSpec.vg.json";
var embed_opt = {
    actions:false
};

// LOAD MAP JSON

var nta_topojson = d3.json("https://raw.githubusercontent.com/nychealth/EHDP-data/" + data_branch + "/geography/NTA.topo.json"); 

// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

// LOAD DATA

var nyccasData = 
    d3.csv(nyccas_url, d3.autoType)
    .then(data => {
        data;
        console.log("data [nyccasData]", data);
    }); 

// FILTER DATA BASED ON SELECTION FROM FORM

function dataFilter() {
    
    neighborhoodData = nyccasData.filter(sf => {
        sf.NTACode === ntaCode;
    });
}

// at this point we have: neighborhoodName (full name), ntaCode (4-digit), and neighborhooData (array of data)

// UPON SELECTION, UPDATES DATA

function dataChange() {
    
    console.log('hi from dataChange function');
    selectedNeighborhood = ntaCode;
    
    selectedName = neighborhoodData[0].NTAName;
    
    dPM = neighborhoodData[0].Avg_annavg_PM25;
    dPM = numRound(dPM);
    dNO2 = neighborhoodData[0].Avg_annavg_NO2;
    dNO2 = numRound(dNO2);
    
    dBuildingEmissions = neighborhoodData[0].tertile_buildingemissions;
    dBuildingDensity = neighborhoodData[0].tertile_buildingdensity;
    dTrafficDensity = neighborhoodData[0].tertile_trafficdensity;
    dIndustrial = neighborhoodData[0].tertile_industrial;
    
    document.querySelector("#PM").innerHTML = dPM + ' μg/m<sup>3</sup>';
    document.querySelector("#NO2").innerHTML = dNO2 + ' ppb';
    document.querySelector("#BuildingEmissions").innerHTML = 'Building emissions<br><h5>' + tertileTranslate(dBuildingEmissions) + '</h5>';
    document.querySelector("#BuildingDensity").innerHTML = 'Building density<br><h5>' + tertileTranslate(dBuildingDensity) + '</h5>';
    document.querySelector("#TrafficDensity").innerHTML = 'Traffic density<br><h5>' + tertileTranslate(dTrafficDensity) + '</h5>';
    document.querySelector("#Industrial").innerHTML = 'Industrial area<br><h5>' + tertileTranslate(dIndustrial) + '</h5>';
    
    buildMap(
        mapUpdateID(tabShown), 
        aqe_path + "/" + mapUpdateSpec(tabShown), 
        nyccasData, 
        nta_topojson
    );
    // load the PM2.5 bar chart

    buildChart(
        "#PMbar", 
        PMBarVGSpec, 
        nyccasData
    );

    // load the NO2 bar chart

    buildChart(
        "#NO2bar", 
        NO2BarVGSpec, 
        nyccasData
    );
    
    console.log('changed');
    
} 


// rounding function lets us round all numbers the same

function numRound(x) {
    return Number.parseFloat(x).toFixed(1);
} 


// jquery commands track tab changes

$(document).ready(function () {
    
    $(document).alert('hi from jquery');
    
    $(".nav-pills a").click(function () {
        $(this).tab('show');
    });
    
    $('.nav-pills a').on('shown.bs.tab', function (event) {
        
        tabShown = $(event.target).attr('aria-controls'); // active tab
        
        $(".act span").text(tabShown);
        $(".prev span").text("did it again");
        
        buildMap(
            mapUpdateID(tabShown), 
            aqe_path + "/" + mapUpdateSpec(tabShown), 
            nyccasData, 
            nta_topojson
        );
        // load the PM2.5 bar chart
    
        buildChart(
            "#PMbar", 
            PMBarVGSpec, 
            nyccasData
        );
    
        // load the NO2 bar chart
    
        buildChart(
            "#NO2bar", 
            NO2BarVGSpec, 
            nyccasData
        );
        
    });
}); 


//  **** MIGHT BE SOMETHING WITH THE SPECS **** //
//  **** MIGHT BE SOMETHING WITH THE SPECS **** //
//  **** MIGHT BE SOMETHING WITH THE SPECS **** //
//  **** MIGHT BE SOMETHING WITH THE SPECS **** //
//  **** MIGHT BE SOMETHING WITH THE SPECS **** //


// Returns block-level badges for the tabs

function tertileTranslate(tertileVal) {
    
    if (tertileVal === "3") {
        return '<span class="badge badge-worse btn-block">high</span>';
        
    } else if (tertileVal === "2") {
        return '<span class="badge badge-medium btn-block">medium</span>';
        
    } else {
        return '<span class="badge badge-better btn-block">low</span>';
        
    };
}


// Returns in-line badges for text

function tertileTranslate2(tertileVal) {
    
    if (tertileVal === "3") {
        return '<span class="badge badge-worse">high</span>';
        
    } else if (tertileVal === "2") {
        return '<span class="badge badge-medium">medium</span>';
        
    } else {
        return '<span class="badge badge-better">low</span>';
        
    };
} 


// Returns map insert/update div IDs

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
    };
} 


// Returns map specs for proper tab context

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
        
    };
} 


// function to build maps

function buildMap(div, spec, csv, topo) {
    
    d3.json(spec)
        .then(spec => {
            
            // get data object whose url is "topo"
            
            var topo_url = spec.data.filter(data => data.url === "topo")[0];
            
            // update url element of this data array (which updates the spec), because
            //  top_url is a shallow copy / reference to the spec
            
            topo_url.url = topo;
            
            // csv is a promise resulting from d3.csv

            csv.then(csv => {
            
                vegaEmbed(
                    div, 
                    spec, 
                    {actions: false}
                    )
                    .then(res => {
                        res.view
                        .insert("nyccasData", csv)
                        .signal("selectNTA", selectedNeighborhood)
                        .runAsync();
                    })
                    .catch(console.error);
        });
    });
}

// initialize the map (tabShown has a value already)

console.log("nyccasData", nyccasData);

buildMap(
    mapUpdateID(tabShown), 
    aqe_path + "/" + mapUpdateSpec(tabShown), 
    nyccasData, 
    nta_topojson
);
    
// function to build charts
        
function buildChart(div, spec, csv) {

    d3.json(spec).then(spec => {
        
        // csv is a promise resulting from d3.csv
        
        csv.then(csv => {
            
            vegaEmbed(
                div, 
                spec, 
                {actions: false}
                )
                .then(res => {
                    res.view
                    .insert("nyccasData", csv)
                    .signal("selectNTA", selectedNeighborhood)
                    .runAsync();
                })
                .catch(console.error);
            });
        });
    }

// load the PM2.5 bar chart

buildChart(
    "#PMbar", 
    PMBarVGSpec, 
    nyccasData
);

// load the NO2 bar chart

buildChart(
    "#NO2bar", 
    NO2BarVGSpec, 
    nyccasData
);


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
