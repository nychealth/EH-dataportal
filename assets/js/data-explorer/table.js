// ======================================================================= //
// table.js
// ======================================================================= //

// builds and renders the Arquero-backed summary data table, with filtering, DataTables integration, and grouped-row toggles

// console.log('>> table.js')

// ----------------------------------------------------------------------- //
// filter helpers
// ----------------------------------------------------------------------- //

// Returns the available time period and geography filter values for the table.
const getTableFilterOptions = (rows) => {

    // Time labels come straight from the joined table rows.
    const availableTimes = [...new Set(rows.map(d => d.TimePeriod))];

    // Geography options are normalized to the same pretty labels used in the UI controls.
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

    const selectedTimes = new Set(DE.table.selectedTableTimes);
    const selectedGeos = new Set(DE.table.selectedTableGeography);

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
        timeSearch: !DE.table.selectedTableTimes.length
            ? '(?!)'
            // An empty regex means “no restriction” when every time period is selected.
            : DE.table.selectedTableTimes.length === availableTimes.length
                ? ''
                : `^(${DE.table.selectedTableTimes.map(escapeRegexValue).join('|')})$`,
        geoSearch: !DE.table.selectedTableGeography.length
            ? '(?!)'
            : DE.table.selectedTableGeography.length === availableGeos.length
                ? ''
                : `^(${DE.table.selectedTableGeography.map(escapeRegexValue).join('|')})$`
    };

};


// Returns the table-filter values implied by the current map dropdown selections.
const getCurrentMapTableFilters = (rows) => {

    const { availableTimes, availableGeos } = getTableFilterOptions(rows);
    const currentTime = DE.lookups.timeLookup[DE.state.TimePeriodID]?.TimePeriod;
    const currentGeo = DE.state.GeoType;

    // Prefer the current map time when it exists in the table; otherwise fall back to the first table time.
    const timeSelection = currentTime && availableTimes.includes(currentTime)
        ? [currentTime]
        : (availableTimes[0] ? [availableTimes[0]] : []);

    // Geography fallback depends on the chosen time slice so we do not sync to a geo with zero rows.
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


// ----------------------------------------------------------------------- //
// table filter sync + summary helpers
// ----------------------------------------------------------------------- //

// Syncs table filters back to the current map dropdown selections.
const syncTableFiltersToMapSelection = (force = false) => {

    // Sync requests can arrive before a new indicator has finished building tableData.
    if (!DE.table.tableData || !DE.table.tableData.length) {
        return false;
    }

    const { timeSelection, geoSelection } = getCurrentMapTableFilters(DE.table.tableData);
    let didChange = false;

    // Respect manual overrides unless the caller explicitly forces a full resync.
    if (force || !DE.table.tableTimeFilterIsManual) {
        const sameTimeSelection = DE.table.selectedTableTimes.length === timeSelection.length &&
            DE.table.selectedTableTimes.every((time, index) => time === timeSelection[index]);

        if (!sameTimeSelection) {
            DE.table.selectedTableTimes = timeSelection;
            didChange = true;
        }

        DE.table.tableTimeFilterIsManual = false;
    }

    // Geography sync follows the same rule so users can customize one dimension independently.
    if (force || !DE.table.tableGeoFilterIsManual) {
        const sameGeoSelection = DE.table.selectedTableGeography.length === geoSelection.length &&
            DE.table.selectedTableGeography.every((geo, index) => geo === geoSelection[index]);

        if (!sameGeoSelection) {
            DE.table.selectedTableGeography = geoSelection;
            didChange = true;
        }

        DE.table.tableGeoFilterIsManual = false;
    }

    return didChange;

};


// Summarizes the current table filter state in the collapsed toggle button.
const updateTableFilterSummary = (availableTimes, availableGeos) => {

    const summary = document.getElementById('tableFilterSummary');

    // The collapsed button gets a terse summary instead of listing every checked option.
    if (!summary) {
        return;
    }

    const timeSummary = !DE.table.selectedTableTimes.length
        ? 'No time periods'
        : DE.table.selectedTableTimes.length === availableTimes.length
            ? 'All time periods'
            : DE.table.selectedTableTimes.length === 1
                ? DE.table.selectedTableTimes[0]
                : `${DE.table.selectedTableTimes.length} time periods`;

    const geoSummary = !DE.table.selectedTableGeography.length
        ? 'No geographies'
        : DE.table.selectedTableGeography.length === availableGeos.length
            ? 'All geographies'
            : DE.table.selectedTableGeography.length === 1
                ? DE.table.selectedTableGeography[0]
                : `${DE.table.selectedTableGeography.length} geographies`;

    const syncState = DE.table.tableTimeFilterIsManual || DE.table.tableGeoFilterIsManual ? 'Custom' : 'Synced';

    summary.textContent = `${timeSummary} | ${geoSummary} | ${syncState}`;

};


// Updates the notes block to reflect only the currently filtered rows.
const updateTableReliabilityNotes = (rows) => {

    // `.filter(Boolean)` drops blank/null/undefined notes; equivalent to the prior
    // `!d == ""` coercion (kept working by accident, but unreadable) — see deep-audit §6.
    const tableUnreliability = [...new Set(rows.map(d => d.Note))].filter(Boolean);

    const tableUnreliabilityEl = document.getElementById('table-unreliability');

    renderUnreliabilityNotes(tableUnreliabilityEl, tableUnreliability);

};


// ----------------------------------------------------------------------- //
// DataTables search helpers
// ----------------------------------------------------------------------- //

// Keeps the visible DataTables search box aligned with the Area column-search state.
const syncTableAreaSearchInput = () => {

    const filterInput = $('#tableID_filter input[type="search"]');

    // DataTables redraws can replace the search box DOM, so always resolve it fresh.
    if (!filterInput.length) {
        return;
    }

    filterInput.val(DE.table.tableAreaSearchValue);
    filterInput.data('areaOnlySearchValue', DE.table.tableAreaSearchValue);

};


// Applies the Area-only search term to DataTables, optionally without drawing immediately.
const setTableAreaSearch = (dataTable, nextValue, shouldDraw = true) => {

    DE.table.tableAreaSearchValue = nextValue || '';

    // Mirror the shared state back into the visible input before changing DataTables internals.
    syncTableAreaSearchInput();

    // Clear DataTables' global search so only the Area column-specific search stays active.
    dataTable.search('');
    dataTable.column(8).search(DE.table.tableAreaSearchValue);

    // Some callers batch search updates and will trigger the draw themselves.
    if (shouldDraw) {
        dataTable.draw();
    }

};


// Clears the Area-only search so dropdown-driven redraws do not keep a stale hidden filter.
const clearTableAreaSearch = () => {

    DE.table.tableAreaSearchValue = '';

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

    // Bail out when DataTables has not created its wrapper yet.
    if (!scrollBody) {
        return;
    }

    // A real fixed height keeps the scrollbar footprint stable across redraws and filter changes.
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

    // Replace DataTables' default global-search handler with our Area-only behavior.
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


// ----------------------------------------------------------------------- //
// filter-control rendering
// ----------------------------------------------------------------------- //

// Renders table checkbox controls and wires them to re-rendering.
const renderTableFilterControls = (rows) => {

    // ----- resolve DOM holders, bail if markup absent ----- //

    const timeHolder = document.getElementById('tableTimeCheckboxes');
    const geoHolder = document.getElementById('tableGeoCheckboxes');

    // The control panel may be absent on partial templates or before the tab markup loads.
    if (!timeHolder || !geoHolder) {
        return;
    }

    // ----- compute available time and geography option sets ----- //

    const { availableTimes, availableGeos } = getTableFilterOptions(rows);
    const filteredTableTimeData = DE.table.selectedTableTimes.length
        ? rows.filter(d => DE.table.selectedTableTimes.includes(d.TimePeriod))
        : [];

    // Geography availability depends on the currently checked time periods.
    const dataGeos = DE.table.selectedTableTimes.length
        ? [...new Set(filteredTableTimeData.map(d => prettifyGeoType(d.GeoType)))]
        : availableGeos;

    // ----- prune stale selections, fall back to a valid geography ----- //

    // Keep only valid selections when indicator data changes.
    DE.table.selectedTableTimes = DE.table.selectedTableTimes.filter(time => availableTimes.includes(time));
    DE.table.selectedTableGeography = DE.table.selectedTableGeography.filter(geo => availableGeos.includes(geo));

    // Match the old explorer behavior by muting geography options that are unavailable
    // for the currently selected time period(s).
    if (DE.table.selectedTableTimes.length) {
        DE.table.selectedTableGeography = DE.table.selectedTableGeography.filter(geo => dataGeos.includes(geo));

        // - - - fall back to a valid geography when the synced value is unavailable - - - //

        // Keep synced table filters on a valid geography when the current map geo
        // is unavailable for the selected table time period.
        if (!DE.table.selectedTableGeography.length && dataGeos.length && !DE.table.tableGeoFilterIsManual) {
            DE.table.selectedTableGeography = [DE.state.GeoType && dataGeos.includes(DE.state.GeoType) ? DE.state.GeoType : dataGeos[0]];
        }
    }

    // Rebuilds a checkbox list for one filter dimension, marking checked/disabled state and wiring change events back to the caller.
    const renderCheckboxes = (holder, options, selectedValues, checkboxClass, name, onChange, isDisabled = () => false) => {

        // Rebuild the whole checkbox block so checked and disabled states stay in sync.
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

    // ----- render time checkboxes ----- //

    renderCheckboxes(timeHolder, availableTimes, DE.table.selectedTableTimes, 'checkbox-time', 'table-time', (value, checked) => {
        const nextTimes = new Set(DE.table.selectedTableTimes);

        if (checked) {
            nextTimes.add(value);
        } else {
            nextTimes.delete(value);
        }

        // Preserve display order from availableTimes instead of checkbox click order.
        DE.table.selectedTableTimes = availableTimes.filter(time => nextTimes.has(time));
        DE.table.tableTimeFilterIsManual = true;
        trackDataExplorerOption('table_time');
        renderTableFilterControls(rows);
        applyTableFilters(rows);
    });

    // ----- render geography checkboxes ----- //

    renderCheckboxes(
        geoHolder,
        availableGeos,
        DE.table.selectedTableGeography,
        'checkbox-geo',
        'table-geo',
        (value, checked) => {
            if (checked) {
                if (!DE.table.selectedTableGeography.includes(value)) {
                    DE.table.selectedTableGeography.push(value);
                }
            } else {
                DE.table.selectedTableGeography = DE.table.selectedTableGeography.filter(geo => geo !== value);
            }

            // Re-sort to canonical geography order before redrawing controls and rows.
            DE.table.selectedTableGeography = availableGeos.filter(geo => DE.table.selectedTableGeography.includes(geo));
            DE.table.tableGeoFilterIsManual = true;
            trackDataExplorerOption('table_geo');
            renderTableFilterControls(rows);
            applyTableFilters(rows);
        },
        (option) => DE.table.selectedTableTimes.length > 0 && !dataGeos.includes(option)
    );

    // ----- wire sync-to-map button, refresh filter summary ----- //

    const syncButton = document.getElementById('tableFilterSyncButton');

    if (syncButton) {
        syncButton.onclick = () => {
            // Force both dimensions back into map-following mode in one click.
            syncTableFiltersToMapSelection(true);
            trackDataExplorerOption('table_sync');
            renderTableFilterControls(rows);
            applyTableFilters(rows);
        };
    }

    updateTableFilterSummary(availableTimes, availableGeos);

};


// ----------------------------------------------------------------------- //
// table rendering
// ----------------------------------------------------------------------- //

// Builds the summary table HTML and activates the DataTables wrapper around it.
const renderTable = (tableData) => {

    debugLog("** renderTable");

    // ----- destroy existing table instance ----- //

    // Rebuilding the table means throwing away the old DataTable instance and its injected wrapper DOM.
    if ($.fn.dataTable.isDataTable('#tableID')) {
        $('#tableID').DataTable().destroy();
    }

    DE.table.tableNeedsRender = false;

    // ----- prep data (table filters) ----- //

    renderTableFilterControls(tableData);

    updateTableReliabilityNotes(getSelectedTableRows(tableData));

    // ----- table column alignment (unchanged) ----- //

    const measureAlignMap = new Map();
    const measures = [...new Set(tableData.map(d => d.MeasurementDisplay))];

    // Default all value columns to right alignment after the Arquero pivot creates the final shape.
    measures.forEach(m => measureAlignMap.set(m, "r"));
    const measureAlignObj = Object.fromEntries(measureAlignMap);

    // ----- pivot data (UNCHANGED) ----- //

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

    // ----- render HTML table (unchanged) ----- //

    document.getElementById('summary-table').innerHTML = 
        filteredTableAqData.toHTML({
            limit: Infinity,
            align: measureAlignObj,
            null: () => "-"
        });

    // DataTables expects a concrete table element in the DOM before initialization.
    document.querySelector('#summary-table table').id = "tableID";
    document.querySelector('#summary-table table').className = "cell-border stripe";
    document.querySelector('#summary-table table').width = "100%";

    // ----- DataTables setup ----- //

    // - - - set some properties - - - //

    // get the names of columns

    const dataColumnNames = filteredTableAqData.columnNames();

    // get the number of columns
    const dataColumnsCount = filteredTableAqData.numCols();
    const { timeSearch, geoSearch } = getTableColumnSearchValues(tableData);

    const notSearchCols = Array.from({length: dataColumnsCount}, (_, i) => i)
        .filter(x => ![0, 1, 8].includes(x));

    // default sort: when grouped by borough, GeoID keeps boroughs in a sensible
    //  order; when ungrouped, sort areas alphabetically so the flat list is useful
    //  (the user can still re-sort any column by clicking its header)
    const sortBy = DE.table.groupByBorough ? 3 : 8;  // 3 = GeoID, 8 = Area
    const sortName = dataColumnNames[sortBy];

    // group/borough label columns (indexes into the pivoted, relocated table)
    const groupColumnTime = 0;
    const groupColumnGeo = 2;  // GeoTypeDesc
    const groupColumnBoro = 6; // Borough

    // ----- hierarchical group keys ----- //

    // Keys are fully-qualified (they include their parents) so that, e.g., the
    //  same borough appearing under different geo types / time periods stays a
    //  distinct group. They're used both to insert group header rows and to let
    //  the collapse/expand handler find a header's descendant rows.

    // Borough is only a meaningful sub-group for the smaller geo types: not
    //  Citywide (no borough) and not Borough itself (the borough *is* the row).
    //  Null boroughs render as "-", so guard against that too. Mirrors the
    //  condition used to build the "Area" column above.
    const hasBorough = (geoTypeDesc, borough) =>
        Boolean(borough) && borough !== '-' && geoTypeDesc !== 'Borough';

    const timeKey = (time) => `${time}`;
    const geoKey  = (time, geoTypeDesc) => `${time}||${geoTypeDesc}`;
    const boroKey = (time, geoTypeDesc, borough) => `${time}||${geoTypeDesc}||${borough}`;

    // Borough grouping is optional. When on, BoroID joins the fixed order so
    //  boroughs stay contiguous (required for grouping). When off we drop it so
    //  the user can sort columns freely across boroughs within a geo type.
    const tableOrderFixed = DE.table.groupByBorough
        ? [[0, 'desc'], [4, 'asc'], [5, 'asc']]  // TimePeriod, GeoRank, BoroID
        : [[0, 'desc'], [4, 'asc']];             // TimePeriod, GeoRank

    // - - - initialize the table - - - //

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
        buttons: [
            {
                extend: 'csvHtml5',
                name: "thisView",
                filename: 'NYC EH Data Portal - ' + DE.indicator.indicatorName + " (filtered)"
            }
        ],
        bInfo: false,
        // Keep time groups together, then sort rows within each group by geography rank
        //  (+ BoroID when grouping by borough); sortBy is the initial user-sortable column.
        order: [[sortBy, 'asc']],
        orderFixed: tableOrderFixed,
        columnDefs: [
            // Hide helper columns that power filtering, grouping, and sort order.
            { visible: false, targets: [0, 1, 2, 3, 4, 5, 6, 7] },
            { searchable: false, targets: [...notSearchCols] },
            { type: 'natural', targets: ['_all'] },
            {
                targets: 9,
                // Parses the numeric-value column to a sortable float for sort/type requests, leaving the display text untouched.
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
                // Replaces the xx/yy placeholder delimiters in the Area column with a styled line break for display only.
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
        // The table body and filter input are the only visible chrome we need here.
        dom: 'rt<"bottom"flp>',
        // Stamps ancestry data-* attributes on each row at build time so drawCallback
        //  can detect group boundaries and the toggle handler can find descendants later.
        createdRow: function (row, data) {
            const time = data[0];
            const GeoTypeDesc = data[2];
            const borough = data[6];
            // Ancestry attributes let a group header find (and toggle) all of its
            //  descendant rows: nested group headers + data rows.
            if (time && GeoTypeDesc) {
                row.setAttribute(`data-time`, timeKey(time));
                row.setAttribute(`data-geo`, geoKey(time, GeoTypeDesc));
                if (hasBorough(GeoTypeDesc, borough)) {
                    row.setAttribute(`data-boro`, boroKey(time, GeoTypeDesc, borough));
                }
            }
        },
        // Rebuilds the collapsible group-header rows and resyncs the search box after each draw, since DataTables replaces the row DOM every time.
        drawCallback: function () {

            const api = this.api();
            // Remove previously injected group rows before rebuilding them for this draw.
            $(api.table().body()).find('tr.group').remove();
            const data = api.rows({page:'current'}).data();
            const rows = api.rows({page:'current'}).nodes();
            const visibleColumnsCount = dataColumnsCount - 8;

            // Insert a group header row for one level of the hierarchy.
            //  - keyFn:   builds the fully-qualified key for a row at this level
            //  - attrsFn: builds the ancestry data-* attributes for the header,
            //             matching those put on descendant rows in createdRow
            //  - skipFn:  (optional) true for rows that get no header at this level
            //             (e.g. boroughs for Citywide / Borough geo types)
            const createGroupRow = (groupColumn, lvl, keyFn, attrsFn, skipFn) => {

                let last = null;

                api.column(groupColumn, {page:'current'}).data().each(function (group, i) {

                    const time        = data[i][0];
                    const geoTypeDesc = data[i][2];
                    const borough     = data[i][6];

                    if (skipFn && skipFn(geoTypeDesc, borough)) {
                        return;
                    }

                    const key = keyFn(time, geoTypeDesc, borough);

                    // Start a new group header each time the fully-qualified key changes.
                    if (last !== key) {

                        $(rows).eq(i).before(
                            `<tr class="group" data-group-level="${lvl}" ${attrsFn(time, geoTypeDesc, borough)}><td colspan="${visibleColumnsCount}" data-group-level="${lvl}"> ${group}</td></tr>`
                        );

                        last = key;
                    }
                });
            };

            // level 0: time period
            createGroupRow(
                groupColumnTime, 0,
                (time) => timeKey(time),
                (time) => `data-time="${time}"`
            );

            // level 1: geo type
            createGroupRow(
                groupColumnGeo, 1,
                (time, geoTypeDesc) => geoKey(time, geoTypeDesc),
                (time, geoTypeDesc) => `data-time="${time}" data-geo="${geoKey(time, geoTypeDesc)}"`
            );

            // level 2: borough (only for the smaller geo types, and only when the toggle is on)
            if (DE.table.groupByBorough) {
                createGroupRow(
                    groupColumnBoro, 2,
                    (time, geoTypeDesc, borough) => boroKey(time, geoTypeDesc, borough),
                    (time, geoTypeDesc, borough) => `data-time="${time}" data-geo="${geoKey(time, geoTypeDesc)}" data-boro="${boroKey(time, geoTypeDesc, borough)}"`,
                    (geoTypeDesc, borough) => !hasBorough(geoTypeDesc, borough)
                );
            }

            // Group rows are rebuilt every draw, so the search-box text needs to be resynced here.
            syncTableAreaSearchInput();
        }
    });

    // ----- lock scroll height + bind group-toggle handler + rebind search ----- //

    lockSummaryTableScrollBodyHeight();

    // Bind the delegated group-toggle handler once per table init, not once per draw: it's
    // delegated from `body`, so it already covers the group rows drawCallback recreates on
    // every redraw without needing to be rebound.
    bindTableGroupToggles();

    // Rebind the search box after init because DataTables has now created its wrapper DOM.
    bindAreaOnlySearch(dataTable);
};


// ----------------------------------------------------------------------- //
// table data download
// ----------------------------------------------------------------------- //

// Triggers the table's configured CSV export via the Buttons API, since the CSV button is not present in the table's dom-string chrome.
const downloadTableData = () => {

    if (!$.fn.dataTable.isDataTable('#tableID')) {
        return;
    }

    $('#tableID').DataTable().button(0).trigger();

};


// ----------------------------------------------------------------------- //
// grouped-row toggles
// ----------------------------------------------------------------------- //

// Binds click handlers that expand and collapse grouped summary-table rows.
const bindTableGroupToggles = () => {

    // ----- unbind stale delegated handler ----- //

    // Delegate from body because drawCallback recreates the synthetic group rows on every redraw.
    $('body').off('click', '#summary-table tr.group td');

    // ----- bind new delegated click handler ----- //

    $('body').on('click', '#summary-table tr.group td', (e) => {

        // - - - resolve clicked header + its level - - - //

        const td    = $(e.currentTarget);
        const tr    = td.closest('tr.group');
        const level = parseInt(tr.attr('data-group-level'), 10);

        // Descendants share this header's value on one attribute:
        //  level 0 (time) -> data-time, level 1 (geo) -> data-geo, level 2 (boro) -> data-boro
        const descendantAttr = level === 0 ? 'data-time'
                             : level === 1 ? 'data-geo'
                             : 'data-boro';

        const key = tr.attr(descendantAttr);

        // - - - collect this header's descendants - - - //

        // Every row carrying this key (data rows + nested group headers),
        //  excluding the clicked header itself.
        const descendants = $('#summary-table tr[' + descendantAttr + ']')
            .filter(function () {
                return this.getAttribute(descendantAttr) === key && this !== tr[0];
            });

        // - - - expand / collapse - - - //

        if (td.hasClass('hidden')) {

            // expand: reveal everything beneath, and reset nested headers to expanded (− icon)
            td.removeClass('hidden');
            descendants.show();
            descendants.find('td').removeClass('hidden');

        } else {

            // collapse: hide everything beneath
            td.addClass('hidden');
            descendants.hide();

        }

    });
};