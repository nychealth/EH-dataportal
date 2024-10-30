// ======================================================================= //
// table.js
// ======================================================================= //

const renderTable = () => {

    console.log("** renderTable");

    document.getElementById('viewDescription').innerHTML = 'This table shows all data for this dataset.'

    // ----------------------------------------------------------------------- //
    // prep data
    // ----------------------------------------------------------------------- //

    // console.log("tableData", tableData);

    const filteredTableTimeData = tableData.filter(d => selectedTableTimes.includes(d.TimePeriod))

    // ----------------------------------------------------------------------- //
    // format geography dropdown checkboxes
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get (pretty) geoTypes available for this time period
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const dataGeos = [...new Set(filteredTableTimeData.map(d => prettifyGeoType(d.GeoType)))];

    // console.log("dataGeos", dataGeos);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get all geo check boxes
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const allGeoChecks = document.querySelectorAll('.checkbox-geo');

    // console.log("allGeoChecks", allGeoChecks);

    let geosNotAvailable = [];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // format
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    // remove disabled class from every geo list element

    $(allGeoChecks).removeClass("disabled");
    $(allGeoChecks).attr('aria-disabled', false);
    
    // now add disabled class for geos not available for this year period

    for (const checkbox of allGeoChecks) {

        if (!dataGeos.includes(checkbox.children[0].value)) {
            
            geosNotAvailable.push(checkbox)
            
            // set this element as disabled
            $(checkbox).addClass("disabled");
            $(checkbox).attr('aria-disabled', true);
            
        }
    }


    // ----------------------------------------------------------------------- //
    // only render table if a geography is checked
    // ----------------------------------------------------------------------- //

    let filteredTableData;

    if (selectedTableGeography.length > 0) {
        
        filteredTableData = 
            filteredTableTimeData
            .filter(d => selectedTableGeography.includes(prettifyGeoType(d.GeoType)))

    } else {
        
        // if no selected geo, then set table to blank and return early

        document.getElementById('summary-table').innerHTML = '';

        return;
    }
    
    // if selected geos not in data, then set table to blank and return early

    if (filteredTableData.length === 0) {

        document.getElementById('summary-table').innerHTML = '';
        
        return;
    }
        
    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const table_unreliability = [...new Set(filteredTableData.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#table-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> " // blank to start
    document.getElementById("table-unreliability").classList.add('hide') // blank to start


    table_unreliability.forEach(element => {
        
        document.querySelector("#table-unreliability").innerHTML += element;
        document.getElementById('table-unreliability').classList.remove('hide')
        
    });
    
    // ----------------------------------------------------------------------- //
    // create html table for DataTables
    // ----------------------------------------------------------------------- //

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // table column alignment
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const measureAlignMap = new Map();
    const measures = [...new Set(filteredTableData.map(d => d.MeasurementDisplay))];
    
    measures.forEach(m => measureAlignMap.set(m, "r"));

    const measureAlignObj = Object.fromEntries(measureAlignMap);
    
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // pivot data so measures are columns
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const filteredTableAqData = aq.from(filteredTableData)
        .groupby("TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
    
        // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
        // .impute(measureImputeObj) 
        
        // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
        .relocate(["TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank"], { before: 0 }) 
    
    // console.log("filteredTableAqData [renderTable]");
    // filteredTableAqData.print({limit: 40})
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // export Arquero table to HTML
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    document.getElementById('summary-table').innerHTML = 
        filteredTableAqData.toHTML({
            limit: Infinity,
            align: measureAlignObj, 
            null: () => "-" // use this to replace undefined
        });
    
    // this gives the table an ID (table code generated by Arquero)
    
    document.querySelector('#summary-table table').id = "tableID"
    
    // set some display properties 
    document.querySelector('#summary-table table').className = "cell-border stripe"
    document.querySelector('#summary-table table').width = "100%"
    

    // ----------------------------------------------------------------------- //
    // specify DataTable
    // ----------------------------------------------------------------------- //
    
    const groupColumnTime = 0
    const groupColumnGeo = 1;

    $('#tableID').DataTable({
        scrollY: 500,
        scrollX: true,
        scrollCollapse: true,
        searching: false,
        paging: false,
        select: true,
        buttons: [
            {
                extend: 'csvHtml5',
                name: "thisView",
                filename: 'NYC EH Data Portal - ' + indicatorName + " (filtered)"
            }
        ],
        bInfo: false,
        fixedHeader: true,
        orderFixed: [[ 0, 'desc' ], [ 3, 'asc' ]], // GeoRank
        columnDefs: [
            { type: 'natural', targets: '_all' },
            { targets: [0, 1, 2, 3], visible: false}
        ],
        "createdRow": function ( row, data, index ) {
            const time    = data[0];
            const GeoTypeDesc = data[1];
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-group`, `${time}-${GeoTypeDesc}`)
                row.setAttribute(`data-time`, `${time}`);
            }
        },
        "drawCallback": function ( settings ) {
            const api = this.api();
            const data = api.rows( {page:'current'} ).data()
            const rows = api.rows( {page:'current'} ).nodes();
            const totaleColumnsCount = api.columns().count()
            const visibleColumnsCount =  totaleColumnsCount - 4;
            
            let last = null;
            let lastTime = null;
            
            const createGroupRow = (groupColumn, lvl) => {

                // console.log("groupColumn", groupColumn);
                // console.log("lvl", lvl);
                
                api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {

                    // console.log("group", group);
                    // console.log("i", i);
                    
                    const time = data[i][0]
                    const groupName = `${time}-${group}`
                    
                    // console.log("time", time);

                    if ( last !== group || lastTime !== time ) {
                        
                        $(rows).eq( i ).before(
                            `<tr class="group"><td colspan="${visibleColumnsCount}" data-time="${time}" data-group="${group}" data-group-level="${lvl}"> ${group}</td></tr>`
                            );
                            last = group;
                            lastTime = time
                            
                    }
                });
            }
            
            createGroupRow(groupColumnTime, 0);
            createGroupRow(groupColumnGeo, 1);
            handleToggle();
        }
    })

}


// ----------------------------------------------------------------------- //
// handler functions for summary table
// ----------------------------------------------------------------------- //

const handleToggle = () => {

    $('body').off('click', '#summary-table tr.group td');
    $('body').on('click', '#summary-table tr.group td', (e) => {

        const td = $(e.target);
        const tr = td.parent();
        const group = td.data('group');
        const groupLevel = td.data('group-level');

        const handleGroupToggle = () => {

            const subGroupToggle = $(`td[data-time="${group}"][data-group-level="1"]`);
            const subGroupRow = $(`tr[data-time="${group}"]`);

            if (subGroupToggle.css('display') === 'none') {

                subGroupToggle.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                td.removeClass('hidden');
                subGroupToggle.show();
                subGroupRow.show();

            } else {

                subGroupToggle.addClass('hidden');
                subGroupRow.addClass('hidden');
                td.addClass('hidden');
                subGroupToggle.hide();
                subGroupRow.hide();

            }
        }

        const handleSubGroupToggle = () => {

            const subDataGroup = tr.next(`tr`).data(`group`);
            const parentDataGroup = subDataGroup.split('-')[0];
            const subGroupRow = $(`tr[data-group="${subDataGroup}"]`);
            const parentGroupToggle = $(`td[data-group="${parentDataGroup}"]`);

            if (subGroupRow.css('display') == 'none')  {

                subGroupRow.show();
                td.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                parentGroupToggle.removeClass('hidden');

            } else {

                subGroupRow.hide();
                td.addClass('hidden');
                subGroupRow.addClass('hidden');
            }
        }

        if (groupLevel === 0) {

            handleGroupToggle();

        } else {

            handleSubGroupToggle();
            
        }

    });
}
