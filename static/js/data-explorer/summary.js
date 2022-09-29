const renderTable = () => {

        console.log("** renderTable");
        
        const groupColumnYear = 0
        const groupColumnGeo = 1;
        const groupId = 0;
        let filteredTableData;


        const contentSummary = document.querySelector('#tab-table');
        const dropdownTableGeo = contentSummary.querySelector('div[aria-labelledby="dropdownTableGeo"]');

        // create geo dropdown for table
        const renderGeographyDropdown = (data) => {
            // Get unique geotypes
            const availableGeoTypes = [...new Set(data.map(item => item.GeoType))];

            // clear selectedSelectedSummaryGeography and geoDropdown
            selectedSummaryGeography = [];
            dropdownTableGeo.innerHTML = '';

            availableGeoTypes.forEach((geoType, index) => {
                
                selectedSummaryGeography.push(geoType);                
                dropdownTableGeo.innerHTML += `<label class="dropdown-item checkbox-geo"><input type="checkbox" value="${geoType}" checked /> ${geoType}</label>`;
                
            });
            
        }

        // filtered table data by year
        const filteredTableDataYear = 
            fullDataTableObjects
            .filter(d => selectedSummaryYears.includes(d.Time))

        // render available geography drowpdown based on year
        renderGeographyDropdown(filteredTableDataYear);

        

        const renderFilteredTable = () => {
            
            const filteredTableData = 
            fullDataTableObjects
            .filter(d => selectedSummaryYears.includes(d.Time) && selectedSummaryGeography.includes(d.GeoType))

            // console.log("filteredTableData [renderTable]", filteredTableData);

            const measureAlignMap = new Map();
            // const measureImputeMap = new Map();
            const measures = [...new Set(filteredTableData.map(d => d.MeasurementDisplay))];

            measures.forEach((m) => {

                measureAlignMap.set(m, "r")
                // measureImputeMap.set(m, () => "-")

            });

            const measureAlignObj = Object.fromEntries(measureAlignMap);
            // const measureImputeObj = Object.fromEntries(measureImputeMap);

            // console.log("measureAlignObj", measureAlignObj);
            // console.log("measureImputeObj", measureImputeObj);

            // filter measurement types with number to relocate them them if they exist
            const dataHasNumber          = filteredTableData.filter(d => d.MeasurementType === 'Number').length > 0;
            const dataHasNumberHousholds = filteredTableData.filter(d => d.MeasurementType === 'Number of Households').length > 0;

            let filteredTableAqData = aq.from(filteredTableData)
                .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
                .pivot("MeasurementDisplay", "DisplayCI")

                // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
                // .impute(measureImputeObj) 

                // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
                .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 })
            if (dataHasNumber) {
                // relocate number if it is the measurement type
                filteredTableAqData = aq.from(filteredTableData)
                .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
                .pivot("MeasurementDisplay", "DisplayCI")

                // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
                // .impute(measureImputeObj) 

                // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
                .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 })
                // move number after geography
                .relocate(["Number"], { after: "Geography" })
            } else if (dataHasNumberHousholds) {
                // relocate number of households if it is the measurement type
                filteredTableAqData = aq.from(filteredTableData)
                .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
                .pivot("MeasurementDisplay", "DisplayCI")

                // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
                // .impute(measureImputeObj) 

                // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
                .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 })
                // move number of households after geography
                .relocate(["Number of Households"], { after: "Geography" })
            }

            // console.log("filteredTableAqData [renderTable]");
            // filteredTableAqData.print({limit: 2})
            
            // export Arquero table to HTML
            
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
            
            // call function to show table

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
                orderFixed: [ 3, 'asc' ], // GeoRank
                columnDefs: [
                    { targets: [0, 1, 2, 3], visible: false}
                ],
                "createdRow": function ( row, data, index ) {
                    // console.log('RENDER TABLE FUNCTION - CreatedRow')
                    const time    = data[0];
                    const geoType = data[1];
                    if (time && geoType) {
                        row.setAttribute(`data-group`, `${time}-${geoType}`)
                        row.setAttribute(`data-year`, `${time}`);
                    }
                },
                "drawCallback": function ( settings ) {
                    // console.log('RENDER TABLE FUNCTION - DrawCallback')
                    const api = this.api();
                    const data = api.rows( {page:'current'} ).data()
                    const rows = api.rows( {page:'current'} ).nodes();
                    const totaleColumnsCount = api.columns().count()
                    const visibleColumnsCount =  totaleColumnsCount - 4;
                    
                    let last = null;
                    let lastYr = null;

                    const createGroupRow = (groupColumn, lvl) => {

                        api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {

                            const year = data[i][0]
                            const groupName = `${year}-${group}`

                            if ( last !== group || lastYr !== year ) {

                                $(rows).eq( i ).before(
                                    `<tr class="group"><td colspan="${visibleColumnsCount}" data-year="${year}" data-group="${group}" data-group-level="${lvl}"> ${group}</td></tr>`
                                    );
                                    last = group;
                                    lastYr = year

                                }
                            });
                        }
                        
                        createGroupRow(groupColumnYear, 0);
                        createGroupRow(groupColumnGeo, 1);
                        handleToggle();
                    }
            })

        }
        

        // handles summery geo filtering
        const handleGeoFilter = (el) => {
            el.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedSummaryGeography.push(e.target.value)
                } else {
                    selectedSummaryGeography = selectedSummaryGeography.filter(item => item !== e.target.value);
                }

                // only render table if a geography is checked
                if (selectedSummaryGeography.length > 0) {
                    renderFilteredTable();
                } else {
                    document.querySelector('#tableID').innerHTML = '';
                }
                
            })
        }

        const checkboxGeo = document.querySelectorAll('.checkbox-geo');

        checkboxGeo.forEach(checkbox => {
            handleGeoFilter(checkbox);
        })

        renderFilteredTable();
}

