// URL to your ArcGIS Online table's REST API endpoint
const tableUrl = 'https://services3.arcgis.com/A6Zjpzrub8ESZ3c7/arcgis/rest/services/FS_Active_Commissaries/FeatureServer/1/query?where=1%3D1&outFields=CommissaryName,Address,Borough,ZipCode,Phone,Frozen&f=json';

// Fetch the data from the ArcGIS Online table
fetch(tableUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();  // Parse the JSON from the response
    })
    .then(data => {
        let features = data.features;

        // Function to render the table
        function renderTable(features) {
            let tableHTML = `
                <table tabindex="0" id="dataTable">
                    <thead>
                        <tr>
                            <th data-column="CommissaryName" tabindex="0" role="button" aria-label="Sort by Commissary Name">Commissary</th>
                            <th data-column="Address" tabindex="0" role="button" aria-label="Sort by Address">Address</th>
                            <th data-column="Borough" tabindex="0" role="button" aria-label="Sort by Borough">Borough</th>
                            <th data-column="ZipCode" tabindex="0" role="button" aria-label="Sort by Zip Code">Zip Code</th>
                            <th data-column="Phone" tabindex="0" role="button" aria-label="Sort by Phone">Phone</th>
                            <th data-column="Frozen" tabindex="0" role="button" aria-label="Sort by Frozen">Frozen</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            features.forEach(feature => {
                tableHTML += `
                    <tr>
                        <td>${feature.attributes.CommissaryName}</td>
                        <td>${feature.attributes.Address}</td>
                        <td>${feature.attributes.Borough}</td>
                        <td>${feature.attributes.ZipCode}</td>
                        <td>${feature.attributes.Phone}</td>
                        <td>${feature.attributes.Frozen}</td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            document.getElementById('tableContainer').innerHTML = tableHTML;

            // Add sorting functionality to headers
            document.querySelectorAll('th[data-column]').forEach(header => {
                header.addEventListener('click', () => {
                    sortTable(header.getAttribute('data-column'));
                });

                // Enable sorting via keyboard (Enter key)
                header.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        sortTable(header.getAttribute('data-column'));
                    }
                });
            });

            // Allow table container scrolling via keyboard
            document.getElementById('tableContainer').focus();
        }

        // Function to sort the table
        function sortTable(column) {
            const sortAscending = column === lastSortedColumn ? !isAscending : true;
            isAscending = sortAscending;
            lastSortedColumn = column;

            features.sort((a, b) => {
                const valueA = a.attributes[column] || ''; // Default to empty string if undefined
                const valueB = b.attributes[column] || '';
                if (valueA < valueB) return sortAscending ? -1 : 1;
                if (valueA > valueB) return sortAscending ? 1 : -1;
                return 0;
            });

            renderTable(features); // Re-render the table with sorted data
        }

        // Initial rendering
        let lastSortedColumn = null;
        let isAscending = true;
        renderTable(features);
    })
    .catch(error => console.error('Error fetching data:', error));
