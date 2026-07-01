// ======================================================================= //
// map-regional.js
// ======================================================================= //

// Initializes the #cpRegional Leaflet map with state-colored markers for
// the NY/NJ/CT regional comparison.

    (function () {
        if (typeof L !== 'object' || typeof d3 !== 'object') {
            console.error('Leaflet or D3 is not available for cpRegional.');
            return;
        }

        var mapElement = document.getElementById('cpRegional');
        if (!mapElement || mapElement.dataset.mapInitialized === 'true') {
            return;
        }

        mapElement.dataset.mapInitialized = 'true';

        var map = createCpMap('cpRegional', { minZoom: 2, maxZoom: 16 }, [41.118333, -73.336667], 8);

        // add button to reset map to original zoom

        L.easyButton({
            position: "bottomleft",
            states: [{
                title: "Reset zoom",
                icon: "fas fa-undo",
                onClick: (btn, map) => map.setView([41.118333, -73.336667], 8) 
            }]
        }).addTo(map);

        var regionalDataUrl = "embeds/RegionalSites.csv";

        d3.csv(regionalDataUrl).then(function (sites) {
            sites.forEach(function (siteData) {
                var state = siteData.State || 'New York';
                var fillColor = CP_STATE_COLORS[state] || CP_STATE_COLORS['New York'];

                var site = L.circleMarker([Number(siteData.Lat), Number(siteData.Long)], {
                    radius: 8,
                    fillColor: fillColor,
                    color: '#333',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                })
                    .bindPopup('<strong>' + siteData['Site Name'] + '</strong><br>' + siteData.County + ' County, ' + siteData.State + '<br><strong>Monitor type:</strong> ' + siteData.Type)
                    .addTo(map);

                site.on('click', function (event) {
                    map.setView(event.latlng, 13);
                });
            });

            map.invalidateSize();
        });
    })();
