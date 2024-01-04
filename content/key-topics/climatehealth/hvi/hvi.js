// ======================================================================= //
// hvi.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// setting up
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// path variables
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// 'data_repo' and 'data_branch' are created from Hugo variables in the aqe.html template

let hvi_url    = "hvi-nta-2020.csv";
let HVImapSpec = "HVIMapSpec.vg.json";

// path to topo json, will be loaded by vega

let nta_topojson = data_repo + data_branch + "/geography/NTA_2020.topo.json"; 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// functions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== round ================================================== //

function round(x, d = 1) {
    return Number.parseFloat(x).toFixed(d);
}

// ===== load flexdatalist ================================================== //

const load_flexdatalist = async () => {

    // ----- get NTA with associated zipcodes -------------------------------------------------- //
    
    await fetch(`nta_zip_collapsed.json`)
        .then(response => response.json())
        .then(data => {

            let nta_zip_collapsed = data;
            console.log("nta_zip_collapsed", nta_zip_collapsed);
            
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
                
                document.querySelector("#NTA").innerHTML = '<h4>' + DOMPurify.sanitize(set.GEONAME) + '</h4>';
                
                // call dataChange

                dataChange(set.GEOCODE);
                
            })

            // ----- add clear button handler -------------------------------------------------- //

            $("#clear").on("click", (e) => {

                console.log("e [clear click]", e);

                $($input).find("~input").val("").trigger( "focus" )
                
            })

        })
}

// ----- call loader function -------------------------------------------------- //

load_flexdatalist()

// ----------------------------------------------------------------------- //
// main functionality
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// loading data
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

let hvidata;

d3.csv(hvi_url, d3.autoType).then(data => {

    hvidata = data;

    // load the map (with no selected neighborhood)
    
    buildMap('#mapvis', HVImapSpec, hvidata, nta_topojson, "");

    // console.log("hvidata", hvidata);
}); 


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// change neighborhood data
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// dataChange function updates selected neighborhood, then filter hvi data and get new neighborhood data, then adds to DOM

function dataChange(GEOCODE) {
    
    let neighborhoodData = hvidata.filter(hvi => {
        
        // using numeric version of the NTACode for operations
        
        return hvi.GEOCODE == GEOCODE;
        
    });
    
    console.log("neighborhoodData", neighborhoodData);
    
    // get values from CSV
    
    let nHVI_RANK = neighborhoodData[0].HVI_RANK;
    
    let nSURFACE_TEMP      = round(neighborhoodData[0].SURFACE_TEMP);
    let nGREENSPACE        = round(neighborhoodData[0].GREENSPACE);
    let nPCT_HOUSEHOLDS_AC = round(neighborhoodData[0].PCT_HOUSEHOLDS_AC);
    let nMEDIAN_INCOME     = neighborhoodData[0].MEDIAN_INCOME_chr;
    
    // get tertiles from CSV
    
    let nSURFACE_TEMP_TERT = neighborhoodData[0].SURFACE_TEMP_TERT;
    let nGREENSPACE_TERT   = neighborhoodData[0].GREENSPACE_TERT;
    let nAC_TERT           = neighborhoodData[0].AC_TERT;
    let nINCOME_TERT       = neighborhoodData[0].INCOME_TERT;
    
    // fill html elements
    
    document.querySelector("#hviVal").innerHTML = '<h4>' + nHVI_RANK + ' out of 5</h4>';
    
    document.querySelector("#tempVal").innerHTML = nSURFACE_TEMP + '° F';
    document.querySelector("#greenVal").innerHTML = nGREENSPACE + '%';
    document.querySelector("#acVal").innerHTML = nPCT_HOUSEHOLDS_AC + '%';
    document.querySelector("#incVal").innerHTML = "$" + nMEDIAN_INCOME;
    
    // adding tertile badge html
    
    document.querySelector("#tempTert").innerHTML = tertileTranslate(nSURFACE_TEMP_TERT, "tempTert");
    document.querySelector("#greenTert").innerHTML = tertileTranslate(nGREENSPACE_TERT, "greenTert");
    document.querySelector("#acTert").innerHTML = tertileTranslate(nAC_TERT, "acTert");
    document.querySelector("#incTert").innerHTML = tertileTranslate(nINCOME_TERT, "incTert");
    
    // rebuild map
    
    buildMap('#mapvis', HVImapSpec, hvidata, nta_topojson, GEOCODE);
    
} 


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// set comparison badge text and styles
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function tertileTranslate(tertileVal, category) {
    
    if (category == "tempTert") {
        
        if (tertileVal == 3) {
            return '<span class="badge badge-warning">Higher than most NYC neighborhoods</span>';
            
        } else if (tertileVal == 2) {
            return '<span class="badge badge-light">In the middle of NYC neighborhoods</span>';
            
        } else {
            return '<span class="badge badge-success">Lower than most NYC neighborhoods</span>';
        }
        
    } else if (category == "acTert") {
        
        if (tertileVal == 3) {
            return '<span class="badge badge-success">More than most NYC neighborhoods</span>';
            
        } else if (tertileVal == 2) {
            return '<span class="badge badge-light">In the middle of NYC neighborhoods</span>';
            
        } else {
            return '<span class="badge badge-warning">Less than most NYC neighborhoods</span>';
        }
        
    } else if (category == "greenTert") {
        
        if (tertileVal == 3) {
            return '<span class="badge badge-success">More than most NYC neighborhoods</span>';
            
        } else if (tertileVal == 2) {
            return '<span class="badge badge-light">In the middle of NYC neighborhoods</span>';
            
        } else {
            return '<span class="badge badge-warning">Less than most NYC neighborhoods</span>';
        }
        
    } else if (category == "incTert") {
        
        if (tertileVal == 3) {
            return '<span class="badge badge-success">Higher than most NYC neighborhoods</span>';
            
        } else if (tertileVal == 2) {
            return '<span class="badge badge-light">In the middle of NYC neighborhoods</span>';
            
        } else {
            return '<span class="badge badge-warning">Lower than most NYC neighborhoods</span>';
        }
        
    }
    
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to build maps
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function buildMap(div, spec, csv, topo, nbr) {
    
    // console.log("nbr", nbr);
    
    d3.json(spec).then(spec => {
        
        // get data object whose url is "topo"
        
        let topo_url = spec.data.filter(data => {return data.url === "topo"})[0];
        
        // update url element of this data array (which updates the spec), because
        //  top_url is a shallow copy / reference to the spec
        
        topo_url.url = topo;
        
        vegaEmbed(div, spec, {actions: true}).then(async res => {
                
            let res_view = await res.view
                .signal("selectedNTA", nbr)
                .insert("hviData", csv)
                .logLevel(vega.Info)
                .runAsync();
            
            // console.log("getState", res_view.getState());
            
        })
        .catch(console.error);
        
    });
}
