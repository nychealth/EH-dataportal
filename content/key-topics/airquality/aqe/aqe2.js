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

var ntaForm = document.getElementById('nta-form');

ntaForm.addEventListener('submit', function (event) {
    
    event.preventDefault();                      // prevent page re-load
    selectedName = event.target[0].value;    // gives you full neighborhood name
    selectedNeighborhood = event.target[0].value.slice(0, 4); // gives you NTA code

    document.getElementById('NTA').innerHTML = 'Your neighborhood: <h3><span style="font-weight:bold;color:#15607a">' + DOMPurify.sanitize(selectedName) + '</span></h3>';
    document.getElementById('yourneighb').style.display = "block";
    document.getElementById('outputContent').style.display = "block";
    vegaEmbed("#mapHolder", mapSpec, {actions: false})
    
    dataFilter(nyccasData);
    dataChange();
    
});

// Create and initialize variables

// 'data_repo' and 'data_branch' are created from Hugo variables in the aqe.html template

var nyccasData = [];
var neighborhoodData = [];
var selectedNeighborhood;
var selectedName = '';
var dPM = 0;
var dNO2 = 0;
var dBuildingEmissions = 0;
var dBuildingDensity = 0;
var dTrafficDensity = 0;
var dIndustrial = 0;
var tabShown = 'tab-01-a'; 

// path variables

var aqe_path   = data_repo + data_branch + "/key-topics/air-quality-explorer";
var nyccas_url = data_repo + data_branch + "/key-topics/air-quality-explorer/aqe-nta.csv";
var PMBarVGSpec  = "PMBarSpec.vg.json";
var NO2BarVGSpec = "NO2BarSpec.vg.json";
var embed_opt = {
    actions:false
};

// path to topo json, will be loaded by vega

var nta_topojson = data_repo + data_branch + "/geography/NTA.topo.json"; 

// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

// LOAD DATA

d3.csv(nyccas_url, d3.autoType).then(data => {
    nyccasData = data;
}); 

// FILTER DATA BASED ON SELECTION FROM FORM

function dataFilter(data) {
    
    neighborhoodData = data.filter(sf => {

        // geo code used in aqe.html is the character NTACode, so using that here instead of numeric GEOCODE

        return sf.NTACode === selectedNeighborhood;

    });


}



function changeFactor(x) {
    var mapButtons = document.querySelectorAll(".mapbtns")
    mapButtons.forEach(btn => {
        btn.classList.remove('active')
    })
    var selBtn = 'btn'+x
    document.getElementById(selBtn).classList.add('active')

    // hide all text
    var textDescr = document.querySelectorAll('.descriptionText')
        textDescr.forEach(text => {
            text.style.display = "none"
        })
    var text = 'text'+x
    document.getElementById(text).style.display = "block"


    if (x === 1) {
        // building emissions


    } else if (x === 2) {
        // building density


    } else if (x===3) {
        // industrial

    } else {
        // traffic density

    }
}

changeFactor(1)

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
          "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA.topo.json",
          "format": {"type": "topojson", "feature": "collection"}
        },
        "mark": {"type": "geoshape", "stroke": "#ffffff", "fill": "lightgray"}
      },
      {
        "data": {
          "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/NTA.topo.json",
          "format": {"type": "topojson", "feature": "collection"}
        },
        "transform": [
          {
            "lookup": "properties.NTACode",
            "from": {
              "data": {
                "url": "https://raw.githubusercontent.com/nychealth/EHDP-data/production/key-topics/air-quality-explorer/aqe-nta.csv"
              },
              "key": "NTACode",
              "fields": [
                "NTACode",
                "GEONAME",
                "GEOCODE",
                "tertile_buildingemissions",
                "tertile_buildingdensity",
                "tertile_industrial",
                "tertile_trafficdensity"
              ]
            }
          }
        ],
        "mark": {"type": "geoshape", "stroke": "#000000"},
        "encoding": {
          "color": {
            "bin": false,
            "field": "tertile_buildingemissions",
            "type": "ordinal",
            "scale": {"scheme": {"name": "purples", "extent": [-0.5, 1]}},
            "legend": null
          },
          "strokeWidth": {"value": 0.5},
          "tooltip": [
            {
                "field": "GEONAME",
                "type": "nominal",
                "title": "Neighborhood"
              },
              {
                "field": "tertile_buildingemissions",
                "type": "nominal",
                "title": "Building emissions"
              },
              {
                "field": "tertile_buildingdensity",
                "type": "nominal",
                "title": "Building density"
              },
              {
                "field": "tertile_industrial",
                "type": "nominal",
                "title": "Industrial area"
              },
              {
                "field": "tertile_trafficdensity",
                "type": "nominal",
                "title": "Traffic"
              }
          ]
        }
      }
    ]
  }




// at this point we have: neighborhoodName (full name), ntaCode (4-digit), and neighborhooData (array of data)

// UPON SELECTION, UPDATES DATA

function dataChange() {
    
    selectedName = neighborhoodData[0].GEONAME;
    
    dPM = numRound(neighborhoodData[0].Avg_annavg_PM25);
    dNO2 = numRound(neighborhoodData[0].Avg_annavg_NO2);
    
    dBuildingEmissions = neighborhoodData[0].tertile_buildingemissions;
    dBuildingDensity = neighborhoodData[0].tertile_buildingdensity;
    dTrafficDensity = neighborhoodData[0].tertile_trafficdensity;
    dIndustrial = neighborhoodData[0].tertile_industrial;

    document.querySelector("#PM").innerHTML = dPM + ' μg/m<sup>3</sup>';
    document.querySelector("#NO2").innerHTML = dNO2 + ' ppb';
    document.querySelector("#buildingEmissions").innerHTML = tertileTranslate(dBuildingEmissions);
    document.querySelector("#buildingDensity").innerHTML = tertileTranslate(dBuildingDensity);
    document.querySelector("#trafficDensity").innerHTML = tertileTranslate(dTrafficDensity);
    document.querySelector("#industrial").innerHTML = tertileTranslate(dIndustrial) ;
    

    // load the PM2.5 bar chart

    buildChart(
        "#PMbar", 
        PMBarVGSpec, 
        nyccasData,
        selectedNeighborhood
    );

    // load the NO2 bar chart

    buildChart(
        "#NO2bar", 
        NO2BarVGSpec, 
        nyccasData,
        selectedNeighborhood
    );
    
} 


// rounding function lets us round all numbers the same

function numRound(x) {
    return Number.parseFloat(x).toFixed(1);
} 


// Returns block-level badges for the tabs

function tertileTranslate(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse ml-1">High</span>';
        
    } else if (tertileVal == 2) {
        return '<span class="badge badge-medium ml-1">Medium</span>';
        
    } else {
        return '<span class="badge badge-better ml-1">Low</span>';
        
    };
}


// Returns in-line badges for text

function tertileTranslate2(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse">high</span>';
        
    } else if (tertileVal == 2) {
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







// function to build charts
        
function buildChart(div, spec, csv, nbr) {

    d3.json(spec).then(spec => {

        vegaEmbed(div, spec, {actions: false})
            .then(res => {

                var res_view = 
                    res.view
                        .insert("nyccasData", csv)
                        .signal("selectNTA", nbr)
                        .logLevel(vega.Info)
                        .runAsync();

            })
            .catch(console.error);
        });
    }

// load the charts after the page loads

$( window ).on( "load", function() {

    console.log("load");

    // load the map
    // buildMap(mapUpdateID(tabShown), aqe_path + "/" + mapUpdateSpec(tabShown), nyccasData, nta_topojson, selectedNeighborhood);
    
    // load the PM2.5 bar chart
    
    buildChart("#PMbar", PMBarVGSpec, nyccasData, selectedNeighborhood);
    
    // load the NO2 bar chart
    
    buildChart("#NO2bar", NO2BarVGSpec, nyccasData, selectedNeighborhood);

});

// change maps when tabs change

$(document).ready(function () {
    
    $(document).alert('hi from jquery');
    
    $(".nav-pills a").click(function () {
        $(this).tab('show');
    });
    
    $('.nav-pills a').on('shown.bs.tab', function (event) {

        console.log(".nav-pills a");
        
        tabShown = $(event.target).attr('aria-controls'); // active tab
        
        $(".act span").text(tabShown);
        $(".prev span").text("did it again");


        // load the PM2.5 bar chart
    
        buildChart(
            "#PMbar", 
            PMBarVGSpec, 
            nyccasData,
            selectedNeighborhood
        );
    
        // load the NO2 bar chart
    
        buildChart(
            "#NO2bar", 
            NO2BarVGSpec, 
            nyccasData,
            selectedNeighborhood
        );
        
    });
}); 



