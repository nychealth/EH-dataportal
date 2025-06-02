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

    // console.log("filteredTableData", filteredTableData);
        
    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const table_unreliability = [...new Set(filteredTableData.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#table-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> " // blank to start
    document.getElementById("table-unreliability").classList.add('hide') // blank to start


    table_unreliability.forEach(element => {
        
        document.querySelector("#table-unreliability").innerHTML += "<div class='fs-xs'>" + element + "</div>" ;
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
        .groupby("TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI", {sort: false})
        .derive({
            Area: aq.escape(d => {  // create Area field: Borough + Neighborhood; xx and yy are used to replace later with HTML
                if (d.Borough && d.GeoTypeDesc != 'Borough') {
                    return `${d.Geography} xx ${d.Borough} yy`;
                } else {
                    return d.Geography; 
                }
            })
        })
        .relocate([
                // these columns always exist, and we always want to hide all except the last one, so let's put them first, respecting the original relative order
                "TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography", "Area",

                // set order for table columns (this is half a priori, half ad hoc): standard is Number, Crude Rate, Age-adjusted rate; left to right in order of calculated complexity; or general to specific. 
                aq.matches(/everyday/i),
                aq.matches(/sometimes/i),
                aq.matches(/never/i),
                aq.matches(/^Average annual number$/),
                aq.matches(/^Average annual number \(Males\)$/),
                aq.matches("Average annual number"),
                aq.matches("Number tested"),
                aq.matches(/^Number$/),
                aq.matches("Number (total)"),
                aq.matches(/number/i),
                aq.matches("Density"),
                aq.matches(/total/i),
                aq.matches(/count/i),
                aq.matches(/mean/i),
                aq.matches(/^Rate$/),
                aq.matches("Estimated annual rate"),
                aq.matches("Rate per 100,000"),
                aq.matches(/^Age-adjusted rate per 100,000$/),
                aq.matches("Age-adjusted rate (Males)"),
                aq.matches("Age-adjusted rate"),
                aq.matches("Average annual rate"),
                aq.matches(/rate/i),
                aq.matches(/^Percent$/),
                aq.matches("Age-adjusted percent"),
                aq.matches("General"),
                aq.matches("Sensitive"),
                aq.matches(/percent/i),
                aq.matches(/density/i),
                aq.matches(/average/i),
                aq.matches("Solid"),
                aq.matches("Liquid")
            ], 
            { before: 0 }
        )
    
    // console.log("filteredTableAqData [renderTable]");
    // filteredTableAqData.print({limit: 100})
    
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

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // set some properties
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get the number of columns

    const dataColumnsCount = filteredTableAqData.numCols();

    // console.log("dataColumnsCount:", dataColumnsCount);

    // create array with indexes of all columns except the search col, to set as "searchable = false"

    const notSearchCols = Array.from({length: dataColumnsCount}, (_, i) => i).filter(x => x != 7);

    const sortBy = dataColumnsCount - 1 // get index position of last column

    // define which column indexes define which groups
    
    const groupColumnTime = 0
    const groupColumnGeo = 1;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // initialize the table
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    $('#tableID').DataTable({
        scrollY: 500,
        scrollX: true,
        scrollCollapse: true,
        searching: true,
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
        order: [[sortBy, 'desc']],                  // Initial sort by the last column
        orderFixed: [[ 0, 'desc' ], [ 3, 'asc' ]],  // TimePeriod, GeoRank 
        columnDefs: [
            { visible: false, targets: [0, 1, 2, 3, 4, 5, 6] },
            { searchable: false, targets: [...notSearchCols] },
            { type: 'natural', targets: ['_all'] }, // enforces natural sorting - which handles number/string combos
            {
                targets: 8, // replace with correct index
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        // Remove commas and try to parse as float
                        const cleaned = data.replace(/,/g, '');
                        const num = parseFloat(cleaned);
                        return isNaN(num) ? -Infinity : num;
                    }
                    return data; // For display and filtering, return original
                }
            },
            {
                targets: 7, // Adjust to the column index where you need formatting
                render: function (data, type, row) {
                    if (type === 'display') {
                        return data.replace(/xx/g, '<br><span style="font-size:.65rem; color: #434343;">')
                                   .replace(/yy/g, '</span>');
                    }
                    return data;
                }
            },

        ],
        language: {
            search: "Find a neighborhood:"  // Change the search box prompt text
        },
        dom: 'rt<"bottom"flp>',
        createdRow: function ( row, data, index ) {
            const time        = data[0];
            const GeoTypeDesc = data[1];
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-group`, `${time}-${GeoTypeDesc}`)
                row.setAttribute(`data-time`, `${time}`);
            }
        },
        drawCallback: function ( settings ) {
            const api = this.api();
            const data = api.rows( {page:'current'} ).data()
            const rows = api.rows( {page:'current'} ).nodes();
            const visibleColumnsCount =  dataColumnsCount - 7;

            let last = null;
            let lastTime = null;
            
            const createGroupRow = (groupColumn, lvl) => {

                // console.log("groupColumn", groupColumn);
                // console.log("lvl", lvl);
                
                api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {

                    // console.log("group", group);
                    // console.log("i", i);
                    
                    const time = data[i][0]
                    
                    // console.log("time", time);

                    if ( last !== group || lastTime !== time ) {
                        
                        $(rows)
                            .eq( i )
                            .before(
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
