// ======================================================================= //
// map-monitoring.js
// ======================================================================= //

// Initializes the #cpReportMap Leaflet map: legend, CRZ boundary, site
// markers, and window.cpReportZoomToSite (called by sticky-header.js).

(function () {

    // ----------------------------------------------------------------------- //
    // guard + one-time init
    // ----------------------------------------------------------------------- //

    if (typeof L !== 'object' || typeof d3 !== 'object') {
        console.error('Leaflet or D3 is not available for cpReportMap.');
        return;
    }

    var mapElement = document.getElementById('cpReportMap');
    if (!mapElement || mapElement.dataset.mapInitialized === 'true') {
        return;
    }

    mapElement.dataset.mapInitialized = 'true';

    var map = createCpMap('cpReportMap', { minZoom: 8, maxZoom: 16 }, [40.715554, -74.0026642], 10);

    // ----------------------------------------------------------------------- //
    // legend
    // ----------------------------------------------------------------------- //

    var legend = L.control({ position: 'topright' });

    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'legend');

        div.innerHTML = [
            '<div class="legend-item"><div class="legend-color traffic"></div><span>Traffic Counter</span></div>',
            '<div class="legend-item"><div class="legend-color integrated-monitor"></div><span>Integrated Monitor</span></div>',
            '<div class="legend-item"><div class="legend-color pm-monitor"></div><span>PM2.5 Real-Time Monitor</span></div>',
            '<div class="legend-item"><div class="legend-color crz"></div><span>CRZ</span></div>'
        ].join('');

        return div;

    };
    legend.addTo(map);

    // ----------------------------------------------------------------------- //
    // CRZ boundary
    // ----------------------------------------------------------------------- //

    // Hand-digitized outline of the Congestion Relief Zone boundary

    var cpAreaGeoJSON = {

        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-73.9928192, 40.7733783], [-73.9817404, 40.7686493], [-73.9819419, 40.7682679],
                        [-73.9741867, 40.7649115], [-73.9731796, 40.765293], [-73.9589786, 40.7589613],
                        [-73.9609929, 40.7560623], [-73.9688488, 40.7469066], [-73.9717695, 40.7440833],
                        [-73.9728774, 40.7423283], [-73.9731796, 40.7409547], [-73.9732803, 40.7397337],
                        [-73.9749925, 40.7366812], [-73.9738851, 40.7309571], [-73.9720722, 40.729507],
                        [-73.9722736, 40.7267593], [-73.9751944, 40.7214926], [-73.9755972, 40.7176759],
                        [-73.9766044, 40.7153094], [-73.9781151, 40.7127139], [-73.9791223, 40.7114924],
                        [-73.9967476, 40.7093547], [-74.0039091, 40.7062205], [-74.0080385, 40.7033192],
                        [-74.0100528, 40.7023266], [-74.013345, 40.7014514], [-74.0155607, 40.7023676],
                        [-74.0165679, 40.7049636], [-74.0186829, 40.7048109], [-74.0188844, 40.7068723],
                        [-74.0179779, 40.7079412], [-74.0188844, 40.708323], [-74.0176758, 40.7121402],
                        [-74.0166686, 40.7120638], [-74.016165, 40.7133617], [-74.0173736, 40.7138197],
                        [-74.0167693, 40.7185526], [-74.0129421, 40.7183236], [-74.0110132, 40.7285625],
                        [-74.0099352, 40.739836], [-74.0093961, 40.7439201], [-74.007779, 40.7480856],
                        [-74.0089649, 40.7509441], [-74.0023886, 40.7606623], [-74.0012027, 40.7618055],
                        [-73.9957044, 40.7679295], [-73.9939795, 40.7699707], [-73.9927936, 40.7733998],
                        [-73.9927936, 40.7734815]
                    ]
                }
            }
        ]
    };

    var cpAreaLayer = L.geoJSON(cpAreaGeoJSON, {
        style: {
            color: '#2a72d8',
            weight: 4,
            opacity: 0.8,
            dashArray: '6,4'
        }
    }).addTo(map);

    if (cpAreaLayer.getBounds && cpAreaLayer.getBounds().isValid()) {
        map.fitBounds(cpAreaLayer.getBounds(), { padding: [20, 20] });
    }
    cpAreaLayer.bringToFront();

    // Reset-zoom control, back to the CRZ boundary (or the citywide default
    // if the boundary layer failed to produce valid bounds)

    L.easyButton({
        position: "bottomleft",
        states: [{
            title: "Reset zoom",
            icon: "fas fa-undo",
            onClick: (btn, map) => { 
                if (cpAreaLayer.getBounds && cpAreaLayer.getBounds().isValid()) {
                    map.fitBounds(cpAreaLayer.getBounds(), { padding: [20, 20] });
                } else {
                    map.setView([40.715554, -74.0026642], 10)
                }
            }
        }]
    }).addTo(map);

    // Exposed globally so sticky-header.js's badge-click handler can pan
    // this map to a site without a direct module reference to `map`

    window.cpReportZoomToSite = function (siteName) {
        var coords = CP_SITES[siteName] && CP_SITES[siteName].mapCoords;
        if (!coords) {
            return;
        }
        map.setView([coords.lat, coords.lng], coords.zoom);
    };

    // ----------------------------------------------------------------------- //
    // site markers
    // ----------------------------------------------------------------------- //

    var iconUrl = "embeds/map-pin-hollow_P.svg";
    var monitoringDataUrl = "embeds/MonitoringLocations.csv";

    var markerIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [-3, -30]
    });

    d3.csv(monitoringDataUrl).then(function (data) {

        var sites = data.filter(function (site) {
            return site.SiteType !== 'Retired Site';
        });

        sites.forEach(function (siteData) {

            var site = L.marker([Number(siteData.Latitude), Number(siteData.Longitude)], { icon: markerIcon })
                .bindPopup('Site ID: ' + siteData.SiteID + '<br><strong>Type: </strong>' + siteData.SiteType + '<br>Group: ' + siteData.Group)
                .addTo(map);

            // Clicking a marker zooms in on it
            site.on('click', function (event) {
                map.setView(event.latlng, 13);
            });

            if (!site._icon) {
                return;
            }

            // - - - color-code the pin by site type - - - //

            if (siteData.SiteType === 'Traffic Counter') {
                site._icon.classList.add('traffic');
            } else if (siteData.SiteType === 'Integrated Monitor') {
                site._icon.classList.add('integrated-monitor');
            } else if (siteData.SiteType === 'PM2.5 Real-Time Monitor') {
                site._icon.classList.add('PM-monitor');
            }
        });

        map.invalidateSize();

    });
    
})();
