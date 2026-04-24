// ======================================================================= //
// table.js
// ======================================================================= //

// builds and renders the Arquero-backed summary data table

// console.log('>> table.js')


// ----------------------------------------------------------------------- //
// render table
// ----------------------------------------------------------------------- //

// Returns the available time period and geography filter values for the table.
const getTableFilterOptions = (rows) => {

    const availableTimes = [...new Set(rows.map(d => d.TimePeriod))];

    const geoValues = [...new Set(rows.map(d => prettifyGeoType(d.GeoType)))];
    const availableGeos = geoTypes.filter(geo => geoValues.includes(geo));

    return { availableTimes, availableGeos };

};


// Escapes a string so it can be used safely inside a regex search.
const escapeRegexValue = (value) => {

    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

};


// Returns the raw rows that match the current table filter state.
const getSelectedTableRows = (rows) => {

    const selectedTimes = new Set(selectedTableTimes);
    const selectedGeos = new Set(selectedTableGeography);

    return rows.filter(d => {
        // Compare against prettified geotypes so checkbox labels and row filtering stay aligned.
        const matchesTime = !selectedTimes.size || selectedTimes.has(d.TimePeriod);
        const matchesGeo = !selectedGeos.size || selectedGeos.has(prettifyGeoType(d.GeoType));
        return matchesTime && matchesGeo;
    });

};


// Builds the regex search values for the current table time and geography filters.
const getTableColumnSearchValues = (rows) => {

    const { availableTimes, availableGeos } = getTableFilterOptions(rows);

    return {
        // '(?!)' is an always-false regex, which intentionally shows zero rows when nothing is selected.
        timeSearch: !selectedTableTimes.length
            ? '(?!)'
            // An empty regex means “no restriction” when every time period is selected.
            : selectedTableTimes.length === availableTimes.length
                ? ''
                : `^(${selectedTableTimes.map(escapeRegexValue).join('|')})$`,
        geoSearch: !selectedTableGeography.length
            ? '(?!)'
            : selectedTableGeography.length === availableGeos.length
                ? ''
                : `^(${selectedTableGeography.map(escapeRegexValue).join('|')})$`
    };

};


// Returns the table-filter values implied by the current map dropdown selections.
const getCurrentMapTableFilters = (rows) => {

    const { availableTimes, availableGeos } = getTableFilterOptions(rows);
    const currentTime = timeLookup[TimePeriodID]?.TimePeriod;
    const currentGeo = GeoType;

    const timeSelection = currentTime && availableTimes.includes(currentTime)
        ? [currentTime]
        : (availableTimes[0] ? [availableTimes[0]] : []);

    const rowsForSelectedTime = timeSelection.length
        ? rows.filter(d => timeSelection.includes(d.TimePeriod))
        : rows;

    const geoValuesForSelectedTime = [...new Set(rowsForSelectedTime.map(d => prettifyGeoType(d.GeoType)))];
    const availableGeosForSelectedTime = geoTypes.filter(geo => geoValuesForSelectedTime.includes(geo));

    return {
        timeSelection,
        geoSelection: currentGeo && availableGeosForSelectedTime.includes(currentGeo)
            ? [currentGeo]
            : (availableGeosForSelectedTime[0]
                ? [availableGeosForSelectedTime[0]]
                : (availableGeos[0] ? [availableGeos[0]] : []))
    };

};


// Syncs table filters back to the current map dropdown selections.
const syncTableFiltersToMapSelection = (force = false) => {

    if (!tableData || !tableData.length) {
        return false;
    }

    const { timeSelection, geoSelection } = getCurrentMapTableFilters(tableData);
    let didChange = false;

    // Respect manual overrides unless the caller explicitly forces a full resync.
    if (force || !tableTimeFilterIsManual) {
        const sameTimeSelection = selectedTableTimes.length === timeSelection.length &&
            selectedTableTimes.every((time, index) => time === timeSelection[index]);

        if (!sameTimeSelection) {
            selectedTableTimes = timeSelection;
            didChange = true;
        }

        tableTimeFilterIsManual = false;
    }

    // Geography sync follows the same rule so users can customize one dimension independently.
    if (force || !tableGeoFilterIsManual) {
        const sameGeoSelection = selectedTableGeography.length === geoSelection.length &&
            selectedTableGeography.every((geo, index) => geo === geoSelection[index]);

        if (!sameGeoSelection) {
            selectedTableGeography = geoSelection;
            didChange = true;
        }

        tableGeoFilterIsManual = false;
    }

    return didChange;

};


// Summarizes the current table filter state in the collapsed toggle button.
const updateTableFilterSummary = (availableTimes, availableGeos) => {

    const summary = document.getElementById('tableFilterSummary');

    if (!summary) {
        return;
    }

    const timeSummary = !selectedTableTimes.length
        ? 'No time periods'
        : selectedTableTimes.length === availableTimes.length
            ? 'All time periods'
            : selectedTableTimes.length === 1
                ? selectedTableTimes[0]
                : `${selectedTableTimes.length} time periods`;

    const geoSummary = !selectedTableGeography.length
        ? 'No geographies'
        : selectedTableGeography.length === availableGeos.length
            ? 'All geographies'
            : selectedTableGeography.length === 1
                ? selectedTableGeography[0]
                : `${selectedTableGeography.length} geographies`;

    const syncState = tableTimeFilterIsManual || tableGeoFilterIsManual ? 'Custom' : 'Synced';

    summary.textContent = `${timeSummary} | ${geoSummary} | ${syncState}`;

};


// Updates the notes block to reflect only the currently filtered rows.
const updateTableReliabilityNotes = (rows) => {

    const tableUnreliability = [...new Set(rows.map(d => d.Note))].filter(d => !d == "");

    document.querySelector("#table-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> ";
    document.getElementById("table-unreliability").classList.add('hide');

    tableUnreliability.forEach(element => {
        document.querySelector("#table-unreliability").innerHTML += "<div class='fs-xs'>" + element + "</div>";
        document.getElementById('table-unreliability').classList.remove('hide');
    });

};


// Keeps the visible DataTables search box aligned with the Area column-search state.
const syncTableAreaSearchInput = () => {

    const filterInput = $('#tableID_filter input[type="search"]');

    if (!filterInput.length) {
        return;
    }

    filterInput.val(tableAreaSearchValue);
    filterInput.data('areaOnlySearchValue', tableAreaSearchValue);

};


// Applies the Area-only search term to DataTables, optionally without drawing immediately.
const setTableAreaSearch = (dataTable, nextValue, shouldDraw = true) => {

    tableAreaSearchValue = nextValue || '';

    syncTableAreaSearchInput();

    dataTable.search('');
    dataTable.column(8).search(tableAreaSearchValue);

    if (shouldDraw) {
        dataTable.draw();
    }

};


// Clears the Area-only search so dropdown-driven redraws do not keep a stale hidden filter.
const clearTableAreaSearch = () => {

    tableAreaSearchValue = '';

    // Only touch DataTables internals after the lazy table has actually been created.
    if ($.fn.dataTable.isDataTable('#tableID')) {
        const dataTable = $('#tableID').DataTable();
        dataTable.search('');
        dataTable.column(8).search('');
    }

    syncTableAreaSearchInput();

};


// Locks the scroll body to a consistent height so redraws do not keep widening the wrapper.
const lockSummaryTableScrollBodyHeight = () => {

    const scrollBody = document.querySelector('#tableID_wrapper .dataTables_scrollBody');

    if (!scrollBody) {
        return;
    }

    scrollBody.style.height = '500px';
    scrollBody.style.minHeight = '500px';
    scrollBody.style.maxHeight = '500px';
    scrollBody.style.overflowY = 'scroll';

};


// Rebinds the built-in DataTables search box so it searches only the Area column.
const bindAreaOnlySearch = (dataTable) => {

    const filterInput = $('#tableID_filter input[type="search"]');

    if (!filterInput.length) {
        return;
    }

    filterInput.off('.DT');

    filterInput.on('input.DT search.DT', function () {
        const nextValue = this.value || '';

        // Skip redundant redraws when the browser fires multiple search-related events.
        if ($(this).data('areaOnlySearchValue') === nextValue) {
            return;
        }

        // Scope the shared DataTables search box to Area only.
        setTableAreaSearch(dataTable, nextValue);
    });

    syncTableAreaSearchInput();

};


// Applies the current table filters through DataTables' native search API.
const applyTableFilters = (rows) => {

    // Checkbox and sync actions can fire before the table tab has been opened for the first time.
    if (!$.fn.dataTable.isDataTable('#tableID')) {
        return;
    }

    const dataTable = $('#tableID').DataTable();
    const filteredRows = getSelectedTableRows(rows);
    const { timeSearch, geoSearch } = getTableColumnSearchValues(rows);

    updateTableReliabilityNotes(filteredRows);

    // Write filter regexes into the hidden time and geography columns, then let one draw refresh the table.
    dataTable.column(0).search(timeSearch, true, false);
    dataTable.column(1).search(geoSearch, true, false);
    dataTable.draw();

};


// Renders table checkbox controls and wires them to re-rendering.
const renderTableFilterControls = (rows) => {

    const timeHolder = document.getElementById('tableTimeCheckboxes');
    const geoHolder = document.getElementById('tableGeoCheckboxes');

    // The control panel may be absent on partial templates or before the tab markup loads.
    if (!timeHolder || !geoHolder) {
        return;
    }

    const { availableTimes, availableGeos } = getTableFilterOptions(rows);
    const filteredTableTimeData = selectedTableTimes.length
        ? rows.filter(d => selectedTableTimes.includes(d.TimePeriod))
        : [];

    const dataGeos = selectedTableTimes.length
        ? [...new Set(filteredTableTimeData.map(d => prettifyGeoType(d.GeoType)))]
        : availableGeos;

    // Keep only valid selections when indicator data changes.
    selectedTableTimes = selectedTableTimes.filter(time => availableTimes.includes(time));
    selectedTableGeography = selectedTableGeography.filter(geo => availableGeos.includes(geo));

    // Match the old explorer behavior by muting geography options that are unavailable
    // for the currently selected time period(s).
    if (selectedTableTimes.length) {
        selectedTableGeography = selectedTableGeography.filter(geo => dataGeos.includes(geo));

        // Keep synced table filters on a valid geography when the current map geo
        // is unavailable for the selected table time period.
        if (!selectedTableGeography.length && dataGeos.length && !tableGeoFilterIsManual) {
            selectedTableGeography = [GeoType && dataGeos.includes(GeoType) ? GeoType : dataGeos[0]];
        }
    }

    const renderCheckboxes = (holder, options, selectedValues, checkboxClass, name, onChange, isDisabled = () => false) => {

        holder.innerHTML = '';

        options.forEach(option => {
            const label = document.createElement('label');
            const unavailable = isDisabled(option);

            // Leave unavailable options visible so users can see why a geography disappeared for this time slice.
            label.className = `btn btn-light dropdown-item text-left ${checkboxClass}`;
            label.setAttribute('aria-disabled', unavailable ? 'true' : 'false');

            if (unavailable) {
                label.classList.add('disabled');
            }

            const input = document.createElement('input');
            input.className = 'largerCheckbox';
            input.type = 'checkbox';
            input.name = name;
            input.value = option;
            input.checked = selectedValues.includes(option);
            input.disabled = unavailable;

            input.addEventListener('change', (event) => {
                // Bubble one normalized value + checked pair back to the caller's filter logic.
                onChange(event.target.value, event.target.checked);
            });

            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${option}`));
            holder.appendChild(label);
        });

    };

    renderCheckboxes(timeHolder, availableTimes, selectedTableTimes, 'checkbox-time', 'table-time', (value, checked) => {
        const nextTimes = new Set(selectedTableTimes);

        if (checked) {
            nextTimes.add(value);
        } else {
            nextTimes.delete(value);
        }

        selectedTableTimes = availableTimes.filter(time => nextTimes.has(time));
        tableTimeFilterIsManual = true;
        renderTableFilterControls(rows);
        applyTableFilters(rows);
    });

    renderCheckboxes(
        geoHolder,
        availableGeos,
        selectedTableGeography,
        'checkbox-geo',
        'table-geo',
        (value, checked) => {
            if (checked) {
                if (!selectedTableGeography.includes(value)) {
                    selectedTableGeography.push(value);
                }
            } else {
                selectedTableGeography = selectedTableGeography.filter(geo => geo !== value);
            }

            selectedTableGeography = availableGeos.filter(geo => selectedTableGeography.includes(geo));
            tableGeoFilterIsManual = true;
            renderTableFilterControls(rows);
            applyTableFilters(rows);
        },
        (option) => selectedTableTimes.length > 0 && !dataGeos.includes(option)
    );

    const syncButton = document.getElementById('tableFilterSyncButton');
    if (syncButton) {
        syncButton.onclick = () => {
            // Force both dimensions back into map-following mode in one click.
            syncTableFiltersToMapSelection(true);
            renderTableFilterControls(rows);
            applyTableFilters(rows);
        };
    }

    updateTableFilterSummary(availableTimes, availableGeos);

};

// Builds the summary table HTML and activates the DataTables wrapper around it.
const renderTable = (tableData) => {

    console.log("** renderTable");

    // Rebuilding the table means throwing away the old DataTable instance and its injected wrapper DOM.
    if ($.fn.dataTable.isDataTable('#tableID')) {
        $('#tableID').DataTable().destroy();
    }

    tableNeedsRender = false;

    // ----------------------------------------------------------------------- //
    // prep data (table filters)
    // ----------------------------------------------------------------------- //

    renderTableFilterControls(tableData);

    updateTableReliabilityNotes(getSelectedTableRows(tableData));

    // ----------------------------------------------------------------------- //
    // table column alignment (unchanged)
    // ----------------------------------------------------------------------- //

    const measureAlignMap = new Map();
    const measures = [...new Set(tableData.map(d => d.MeasurementDisplay))];
    measures.forEach(m => measureAlignMap.set(m, "r"));
    const measureAlignObj = Object.fromEntries(measureAlignMap);

    // ----------------------------------------------------------------------- //
    // pivot data (UNCHANGED)
    // ----------------------------------------------------------------------- //

    const filteredTableAqData = aq.from(tableData)
        .derive({ GeoTypePretty: aq.escape(d => prettifyGeoType(d.GeoType)) })
        .groupby("TimePeriod", "GeoTypePretty", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI", {sort: false})
        // Build a grouped Area label that optionally appends borough context for nested geographies.
        .derive({
            Area: aq.escape(d => {
                // Append borough context only for non-borough rows that have it.
                if (d.Borough && d.GeoTypeDesc != 'Borough') {
                    return `${d.Geography} xx ${d.Borough} yy`;
                } else {
                    return d.Geography; 
                }
            })
        })
        .relocate([
            "TimePeriod", "GeoTypePretty", "GeoTypeDesc", "GeoID", "GeoRank", "BoroID", "Borough", "Geography", "Area",

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
    const { timeSearch, geoSearch } = getTableColumnSearchValues(tableData);

    const notSearchCols = Array.from({length: dataColumnsCount}, (_, i) => i)
        .filter(x => ![0, 1, 8].includes(x));

    const sortBy = dataColumnsCount - 1;

    const groupColumnTime = 0;
    const groupColumnGeo = 2;

    const dataTable = $('#tableID').DataTable({
        scrollY: 500,
        scrollX: true,
        scrollCollapse: false,
        autoWidth: false,
        // Seed the initial filters here so the first draw starts narrowed instead of drawing everything first.
        searchCols: [
            { search: timeSearch, regex: true, smart: false },
            { search: geoSearch, regex: true, smart: false },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        ],
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
        order: [[sortBy, 'desc']],
        orderFixed: [[0, 'desc'], [4, 'asc']],
        columnDefs: [
            { visible: false, targets: [0, 1, 2, 3, 4, 5, 6, 7] },
            { searchable: false, targets: [...notSearchCols] },
            { type: 'natural', targets: ['_all'] },
            {
                targets: 9,
                render: function (data, type) {
                    // Strip formatting so numeric sorts use the raw number rather than display text.
                    if (type === 'sort' || type === 'type') {
                        const cleaned = data.replace(/,/g, '');
                        const num = parseFloat(cleaned);
                        return isNaN(num) ? -Infinity : num;
                    }
                    return data;
                }
            },
            {
                targets: 8,
                render: function (data, type) {
                    // Inject line breaks only for display mode so sorting/searching sees plain text.
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
            const GeoTypeDesc = data[2];
            // Store grouping metadata on each row so drawCallback can rebuild collapsible headers.
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-group`, `${time}-${GeoTypeDesc}`);
                row.setAttribute(`data-time`, `${time}`);
            }
        },
        drawCallback: function () {

            const api = this.api();
            // Remove previously injected group rows before rebuilding them for this draw.
            $(api.table().body()).find('tr.group').remove();
            const data = api.rows({page:'current'}).data();
            const rows = api.rows({page:'current'}).nodes();
            const visibleColumnsCount = dataColumnsCount - 8;

            let last = null;
            let lastTime = null;

            // Inserts one synthetic group header row whenever the grouping value changes.
            const createGroupRow = (groupColumn, lvl) => {

                api.column(groupColumn, {page:'current'}).data().each(function (group, i) {

                    const time = data[i][0];

                    // Start a new group header each time the group label or time bucket changes.
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

            // Group rows are rebuilt every draw, so event handlers and search-box text need to be rebound here.
            handleToggle();
            syncTableAreaSearchInput();
        }
    });

    lockSummaryTableScrollBodyHeight();

    bindAreaOnlySearch(dataTable);
};

// Binds click handlers that expand and collapse grouped summary-table rows.
const handleToggle = () => {

    // Delegate from body because drawCallback recreates the synthetic group rows on every redraw.
    $('body').off('click', '#summary-table tr.group td');

    $('body').on('click', '#summary-table tr.group td', (e) => {

        const td = $(e.target);
        const tr = td.parent();
        const group = td.data('group');
        const groupLevel = td.data('group-level');

        // Toggles an entire top-level time group and all of its subgroup rows.
        const handleGroupToggle = () => {

            const subGroupToggle = $(`td[data-time="${group}"][data-group-level="1"]`);
            const subGroupRow = $(`tr[data-time="${group}"]`);

            // Show or hide every subgroup row that belongs to the clicked time header.
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

        // Toggles the data rows that sit under one geography subgroup header.
        const handleSubGroupToggle = () => {

            const subDataGroup = tr.next('tr').data('group');
            const subGroupRow = $(`tr[data-group="${subDataGroup}"]`);

            // Show or hide only the rows nested under the clicked subgroup header.
            if (subGroupRow.css('display') === 'none') {

                subGroupRow.show().removeClass('hidden');
                td.removeClass('hidden');

            } else {

                subGroupRow.hide().addClass('hidden');
                td.addClass('hidden');
            }
        };

        // Route clicks to either the time-level or subgroup-level toggle behavior.
        if (groupLevel === 0) {
            handleGroupToggle();
        } else {
            handleSubGroupToggle();
        }

    });
};