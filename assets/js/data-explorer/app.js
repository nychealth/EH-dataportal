// ======================================================================= //
// app.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// history traversal
// ----------------------------------------------------------------------- //

// clicking on the indicator dropdown calls loadIndicator with that IndicatorID

// call loadindicator when traversing through the history

window.onpopstate = function (event) {

    const new_url = new URL(window.location);
    let new_indicatorId = parseFloat(new_url.searchParams.get('id'));

    if (new_indicatorId != indicatorId) {

        loadIndicator(new_indicatorId, true)

    }
};

window.addEventListener("hashchange", () => {

    const hash = window.location.hash.replace('#', "");

    switch (hash) {

        // using fallthrough

        case 'display=summary':
        case 'tab-table':
            currentHash = 'display=summary';
            $('#tab-btn-table').tab('show');
            showTable();
            break;

        case 'display=map':
        case 'tab-map':
            currentHash = 'display=map';
            $('#tab-btn-map').tab('show');
            showMap();
            break;

        case 'display=trend':
        case 'tab-trend':
            currentHash = 'display=trend';
            $('#tab-btn-trend').tab('show');
            showTrend();
            break;

        case 'display=links':
        case 'tab-links':
            currentHash = 'display=links';
            $('#tab-btn-links').tab('show');
            showLinks();
            break;

        default:
            currentHash = 'display=summary';
            break;
    }

    state = window.history.state;


});

// ----------------------------------------------------------------------- //
// tab event listeners
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", () => {

    tabTable = document.querySelector('#tab-btn-table');
    tabMap = document.querySelector('#tab-btn-map');
    tabTrend = document.querySelector('#tab-btn-trend');
    tabLinks = document.querySelector('#tab-btn-links');

    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');

});

// ----------------------------------------------------------------------- //
// content truncation
// ----------------------------------------------------------------------- //

function reveal() {
    document.getElementById('truncate').classList.toggle('hide');
    document.getElementById('full').classList.toggle('show');
    document.getElementById('contenttoggle').innerHTML = `Show less... <i class="fas fa-caret-square-up" aria-hidden="true"></i>`;
}

// ----------------------------------------------------------------------- //
// add listeners to tabs
// ----------------------------------------------------------------------- //

// ===== table ===== /

$('#tab-btn-table').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=summary'
})

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map'
})   

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend'
})  

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links'
})


// ----------------------------------------------------------------------- //
// export functions
// ----------------------------------------------------------------------- //

// export current table view

$("#thisView").on("click", (e) => {

    let summaryTable = $('#tableID').DataTable();
    summaryTable.button("thisView:name").trigger();

    gtag('event', 'file_download', {
        'file_name': 'NYC EH Data Portal - ' + indicatorName + " (filtered)" + '.csv',
        'file_extension': '.csv',
        'link_text': 'Current table view'
    });

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

    gtag('event', 'file_download', {
        'file_name': hiddenElement.download,
        'file_extension': '.csv',
        'link_text': 'Full table for this indicator'
    });

    e.stopPropagation();

});

// export raw dataset

$("#rawData").on("click", (e) => {

    let dataURL = data_repo + data_branch + '/indicators/data/' + indicatorId + '.json'

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

        gtag('event', 'file_download', {
            'file_name': hiddenElement.download,
            'file_extension': '.csv',
            'link_text': 'Raw data for this indicator'
        });

        e.stopPropagation();

    })
});
