// ======================================================================= //
// table.js
// ======================================================================= //

// console.log('>> table.js')


const renderTable = (tableData) => {

    console.log("** renderTable");

    // ----------------------------------------------------------------------- //
    // prep data (REMOVED time + geo filtering)
    // ----------------------------------------------------------------------- //

    const filteredTableData = tableData;

    if (!filteredTableData || filteredTableData.length === 0) {
        document.getElementById('summary-table').innerHTML = '';
        return;
    }

    // ----------------------------------------------------------------------- //
    // unreliability notes (unchanged)
    // ----------------------------------------------------------------------- //

    const table_unreliability = [...new Set(filteredTableData.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#table-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> "
    document.getElementById("table-unreliability").classList.add('hide')

    table_unreliability.forEach(element => {
        document.querySelector("#table-unreliability").innerHTML += "<div class='fs-xs'>" + element + "</div>";
        document.getElementById('table-unreliability').classList.remove('hide')
    });

    // ----------------------------------------------------------------------- //
    // table column alignment (unchanged)
    // ----------------------------------------------------------------------- //

    const measureAlignMap = new Map();
    const measures = [...new Set(filteredTableData.map(d => d.MeasurementDisplay))];
    measures.forEach(m => measureAlignMap.set(m, "r"));
    const measureAlignObj = Object.fromEntries(measureAlignMap);

    // ----------------------------------------------------------------------- //
    // pivot data (UNCHANGED)
    // ----------------------------------------------------------------------- //

    const filteredTableAqData = aq.from(filteredTableData)
        .groupby("TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI", {sort: false})
        .derive({
            Area: aq.escape(d => {
                if (d.Borough && d.GeoTypeDesc != 'Borough') {
                    return `${d.Geography} xx ${d.Borough} yy`;
                } else {
                    return d.Geography; 
                }
            })
        })
        .relocate([
            "TimePeriod", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography", "Area",

            aq.matches(/everyday/i),
            aq.matches(/sometimes/i),
            aq.matches(/never/i),
            aq.matches(/^Average annual number$/),
            aq.matches(/^Average annual number \(Males\)$/),
            aq.matches("Average annual number"),
            aq.matches("Number tested"),
            aq.matches(/^Number$/),
            aq.matches("Number (total)"),
            aq.matches("Number (3.5+"),
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
            aq.matches("Rate (3.5+"),
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
        );

    // ----------------------------------------------------------------------- //
    // render HTML table (unchanged)
    // ----------------------------------------------------------------------- //

    document.getElementById('summary-table').innerHTML = 
        filteredTableAqData.toHTML({
            limit: Infinity,
            align: measureAlignObj,
            null: () => "-"
        });

    document.querySelector('#summary-table table').id = "tableID";
    document.querySelector('#summary-table table').className = "cell-border stripe";
    document.querySelector('#summary-table table').width = "100%";

    // ----------------------------------------------------------------------- //
    // DataTables setup (UNCHANGED)
    // ----------------------------------------------------------------------- //

    const dataColumnsCount = filteredTableAqData.numCols();

    const notSearchCols = Array.from({length: dataColumnsCount}, (_, i) => i).filter(x => x != 7);

    const sortBy = dataColumnsCount - 1;

    const groupColumnTime = 0;
    const groupColumnGeo = 1;

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
        order: [[sortBy, 'desc']],
        orderFixed: [[0, 'desc'], [3, 'asc']],
        columnDefs: [
            { visible: false, targets: [0, 1, 2, 3, 4, 5, 6] },
            { searchable: false, targets: [...notSearchCols] },
            { type: 'natural', targets: ['_all'] },
            {
                targets: 8,
                render: function (data, type) {
                    if (type === 'sort' || type === 'type') {
                        const cleaned = data.replace(/,/g, '');
                        const num = parseFloat(cleaned);
                        return isNaN(num) ? -Infinity : num;
                    }
                    return data;
                }
            },
            {
                targets: 7,
                render: function (data, type) {
                    if (type === 'display') {
                        return data.replace(/xx/g, '<br><span style="font-size:.65rem; color: #434343;">')
                                   .replace(/yy/g, '</span>');
                    }
                    return data;
                }
            }
        ],
        language: {
            search: "Find a neighborhood:"
        },
        dom: 'rt<"bottom"flp>',
        createdRow: function (row, data) {
            const time = data[0];
            const GeoTypeDesc = data[1];
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-group`, `${time}-${GeoTypeDesc}`);
                row.setAttribute(`data-time`, `${time}`);
            }
        },
        drawCallback: function () {

            const api = this.api();
            const data = api.rows({page:'current'}).data();
            const rows = api.rows({page:'current'}).nodes();
            const visibleColumnsCount = dataColumnsCount - 7;

            let last = null;
            let lastTime = null;

            const createGroupRow = (groupColumn, lvl) => {

                api.column(groupColumn, {page:'current'}).data().each(function (group, i) {

                    const time = data[i][0];

                    if (last !== group || lastTime !== time) {

                        $(rows).eq(i).before(
                            `<tr class="group">
                                <td colspan="${visibleColumnsCount}" 
                                    data-time="${time}" 
                                    data-group="${group}" 
                                    data-group-level="${lvl}">
                                    ${group}
                                </td>
                            </tr>`
                        );

                        last = group;
                        lastTime = time;
                    }
                });
            };

            createGroupRow(groupColumnTime, 0);
            createGroupRow(groupColumnGeo, 1);

            // ✅ THIS is what you were missing
            handleToggle();
        }
    });
};

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

                subGroupToggle.show().removeClass('hidden');
                subGroupRow.show().removeClass('hidden');
                td.removeClass('hidden');

            } else {

                subGroupToggle.hide().addClass('hidden');
                subGroupRow.hide().addClass('hidden');
                td.addClass('hidden');
            }
        };

        const handleSubGroupToggle = () => {

            const subDataGroup = tr.next('tr').data('group');
            const subGroupRow = $(`tr[data-group="${subDataGroup}"]`);

            if (subGroupRow.css('display') === 'none') {

                subGroupRow.show().removeClass('hidden');
                td.removeClass('hidden');

            } else {

                subGroupRow.hide().addClass('hidden');
                td.addClass('hidden');
            }
        };

        if (groupLevel === 0) {
            handleGroupToggle();
        } else {
            handleSubGroupToggle();
        }

    });
};