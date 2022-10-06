
{{/*  clicking on the indicator dropdown calls loadIndicator with that IndicatorID  */}}
    
// let data_branch = {{ site.Params.data_branch }};
// let data_repo = {{ site.Params.data_repo }};


// console.log("btnShowDisparities", btnShowDisparities);

// const url = new URL(window.location);

// const updateChartPlotSize = () => {
//     setTimeout(() => {
//         window.dispatchEvent(new Event('resize'));
//     }, 200)
    
// }

// hash change event, for firing on hash switch in renderMeasures

// let hashchange = new Event('hashchange');

window.onpopstate = function (event) {
    if (event.state != null){
        // console.log('EVENT: ', event.state.id)
        document.url = event.state.url;
        // console.log("** loadIndicator [onpopstate]");
        loadIndicator(event.state.id, true)
    }
};

window.addEventListener("hashchange", function () {
    // console.log("< hashchange > currentHash 1: ", currentHash);

    const hash = window.location.hash.replace('#', "");
    // console.log("< hashchange > hash: ", hash);
    
    switch (hash) {

        // using fallthrough

        case 'display=summary':
        case 'tab-table':
            // console.log("< hashchange > summary");
            $('#tab-btn-table').tab('show');
            showTable();
            break;

        case 'display=map':
        case 'tab-map':
            // console.log("< hashchange > map");
            $('#tab-btn-map').tab('show');
            showMap();
            break;

        case 'display=trend':
        case 'tab-trend':
            // console.log("< hashchange > trend");
            $('#tab-btn-trend').tab('show');
            showTrend();
            break;

        case 'display=links':
        case 'tab-links':
            // console.log("< hashchange > links");
            $('#tab-btn-links').tab('show');
            showLinks();
            break;

        default:
            // console.log("< hashchange > default");
            // window.location.hash = 'display=summary';
            $('#tab-btn-table').tab('show');
            showTable();
            break;
    }

    currentHash = hash;

});


document.addEventListener("DOMContentLoaded", () => {

    tabTable = document.querySelector('#tab-btn-table');
    tabMap = document.querySelector('#tab-btn-map');
    tabTrend = document.querySelector('#tab-btn-trend');
    tabLinks = document.querySelector('#tab-btn-links');

    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');

});

function reveal() {
    document.getElementById('truncate').classList.toggle('hide');
    document.getElementById('full').classList.toggle('show');
    document.getElementById('contenttoggle').innerHTML = `Show less... <i class="fas fa-caret-square-up" aria-hidden="true"></i>`;
}    

{{/* =================================================================== */}}
{{/*  fetch and load indicators metadata into global object              */}}
{{/* =================================================================== */}}

// fetch(data_repo + "/" + data_branch + '/indicators/indicators.json')
//     .then(response => response.json())
//     .then(async data => {

//         // console.log("** fetch indicators.json");

//         indicators = data;

//         const paramId = url.searchParams.get('id') !== null ? parseInt(url.searchParams.get('id')) : false;
        
//         renderIndicatorDropdown()

//         // calling loadIndicator calls loadData, etc, and eventually renderMeasures. Because all 
//         //  of this depends on the global "indicator" object, we call loadIndicator here
        
//         if (paramId) {
//             await loadIndicator(paramId)
//         } else {
//             console.log('no param', url.searchParams.get('id'));
//             await loadIndicator()
//         }
        
//     })
//     .catch(error => console.log(error));
    
    
    


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// add listeners to tabs
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== table ===== /

$('#tab-btn-table').on('click', e => {
    {{/*  console.log("e", e);  */}}
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=summary'
    {{/*  showTable(e);  */}}
})

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    {{/*  console.log("e", e);  */}}
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map'
    {{/*  showMap(e);  */}}
})   

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    {{/*  console.log("e", e);  */}}
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend'
    {{/*  showTrend(e);  */}}
})  

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    {{/*  console.log("e", e);  */}}
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links'
    {{/*  showLinks(e);  */}}
})


function copyCitation(){
    let citeText = document.getElementById('citeText')
    citeText.select()
    citeText.setSelectionRange(0,99999);
    navigator.clipboard.writeText(citeText.value)
    let btn = document.getElementById('citeButton')
    btn.innerHTML = `<i class="fas fa-copy mr-1"></i>Copied!`
    // console.log('citation copied!')
}

createCitation();

// export current table view

$("#thisView").on("click", (e) => {

    let summaryTable = $('#tableID').DataTable();
    summaryTable.button("thisView:name").trigger();

    e.stopPropagation();

});

// export full table data (i.e., original view)

$("#allData").on("click", (e) => {

    // pivot the full dataset

    let allData = aq.from(fullDataTableObjects)
        .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
        .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 }) 

    let downloadTableCSV = allData.toCSV();

    // Data URI
    let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
    let hiddenElement = document.createElement('a');
    
    hiddenElement.href = csvData;
    hiddenElement.target = '_blank';
    hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (full)" + '.csv';
    hiddenElement.click();

    e.stopPropagation();

});

// export raw dataset

$("#rawData").on("click", (e) => {

    let dataURL = data_repo + "/" + data_branch + '/indicators/data/' + indicatorId + '.json'

    // console.log('Data are at: ' + dataURL)

    aq.loadJSON(`${dataURL}`).then(function(data) {

        let downloadTable = data;
        let downloadTableCSV = downloadTable.toCSV();

        // Data URI
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
        let hiddenElement = document.createElement('a');

        hiddenElement.href = csvData;
        hiddenElement.target = '_blank';
        hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (raw)" + '.csv';
        hiddenElement.click();

        e.stopPropagation();

    })
});