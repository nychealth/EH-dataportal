// ======================================================================= //
// aq-covid-difference-maps.js
// ======================================================================= //

// NO2 / PM2.5 change maps in the air-quality-and-covid-part-2 story's modal.
// Replaces two iframed R htmlwidgets: each was a basemap, one pre-rendered PNG
// overlay, and a gradient legend, so the overlays, bounds and legend stops below
// are copied verbatim from those widgets' JSON.

// ----------------------------------------------------------------------- //
// map definitions
// ----------------------------------------------------------------------- //

// Image paths are relative to the story page, whose bundle holds the PNGs.
// `stops` is a CSS gradient stop list; `p1`/`pn` are where the first and last
// labels sit along the gradient, as fractions of its height (R leaflet's p_1/p_n)

const aqCovidMaps = {
    no2: {
        image: 'no2-difference-spring-2019-2020.png',
        bounds: [[40.9149302007904, -74.2572306719853], [40.4957127049342, -73.6992599865934]],
        title: 'Change in NO2<br/><em>Spring 2019 to Spring 2020<br/>(in ppb)</em>',
        stops: '#FCFBFD , #F3F1F7 8.86931331971566%, #DADAEB 24.9695874114076%, #B3B3D6 41.0698615030996%, #8D89C0 57.1701355947916%, #6D57A6 73.2704096864836%, #51228C 89.3706837781756%, #3F007D ',
        labels: ['0', '2', '4', '6', '8', '10'],
        p1: 0.0886931331971566,
        pn: 0.893706837781756
    },
    pm25: {
        image: 'pm25-difference-spring-2019-2020.png',
        bounds: [[40.9150324472897, -74.256604493553], [40.4958183965934, -73.70059073013]],
        title: 'Change in PM2.5<br/><em>Spring 2019 to Spring 2020<br/>(in µg/m<sup>3</sup>)</em>',
        stops: '#F7FBFF , #E6F0FA 8.35005849426232%, #D2E3F3 18.755922840603%, #B9D5EA 29.1617871869438%, #96C5DF 39.5676515332845%, #6BAED6 49.9735158796252%, #4A97C9 60.379380225966%, #2E7CBB 70.7852445723067%, #1761A9 81.1911089186474%, #09468C 91.5969732649882%, #08306B ',
        labels: ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5'],
        p1: 0.0835005849426232,
        pn: 0.915969732649882
    }
};

// Created on first modal open, because Leaflet cannot size a map inside a hidden modal

let aqCovidMap;
let aqCovidOverlay;
let aqCovidLegend;


// ----------------------------------------------------------------------- //
// legend
// ----------------------------------------------------------------------- //

// Builds R leaflet's numeric legend: labels 20px apart, the gradient stretched so
// p1 and pn land on the first and last label

const buildLegend = (def) => {

    const binHeight = 20;
    const binFraction = (def.pn - def.p1) / (def.labels.length - 1);
    const gradientHeight = binHeight / binFraction + 1;
    const firstLabelTop = binHeight / binFraction * def.p1;

    const labels = def.labels.map((label, i) =>
        '<span class="aq-legend-label" style="top: ' + (firstLabelTop + i * binHeight) + 'px">' + label + '</span>'
    ).join('');

    return (
        '<div class="aq-legend-title"><strong>' + def.title + '</strong></div>' +
        '<div class="aq-legend-scale" style="height: ' + gradientHeight + 'px">' +
            '<span class="aq-legend-gradient" style="background: linear-gradient(' + def.stops + ')"></span>' +
            labels +
        '</div>'
    );

};


// ----------------------------------------------------------------------- //
// map
// ----------------------------------------------------------------------- //

// Swaps the overlay and legend to one pollutant, and syncs the toggle buttons

const showAqCovidMap = (key) => {

    const def = aqCovidMaps[key];

    if (aqCovidOverlay) {
        aqCovidMap.removeLayer(aqCovidOverlay);
    }

    aqCovidOverlay = L.imageOverlay(def.image, def.bounds, { alt: '' }).addTo(aqCovidMap);
    aqCovidLegend.getContainer().innerHTML = buildLegend(def);
    aqCovidMap.fitBounds(def.bounds);

    document.querySelectorAll('[data-aq-map]').forEach(button => {

        const isActive = button.dataset.aqMap === key;
        button.classList.toggle('btn-primary', isActive);
        button.classList.toggle('btn-outline-primary', !isActive);
        button.setAttribute('aria-pressed', isActive);

    });

};


// Creates the map once; later opens only re-measure it, since the modal may have resized

const initAqCovidMap = () => {

    if (aqCovidMap) {
        aqCovidMap.invalidateSize();
        return;
    }

    aqCovidMap = L.map('aq-covid-map');

    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2vaf_1_f87644104deb54c869cef554',
        {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    ).addTo(aqCovidMap);

    aqCovidLegend = L.control({ position: 'topright' });
    aqCovidLegend.onAdd = () => L.DomUtil.create('div', 'info legend aq-legend');
    aqCovidLegend.addTo(aqCovidMap);

    document.querySelectorAll('[data-aq-map]').forEach(button => {
        button.addEventListener('click', () => showAqCovidMap(button.dataset.aqMap));
    });

    showAqCovidMap('no2');

};


// shown.bs.modal fires after the fade, once the map container has a size; it is a
// jQuery event, so it is bound through jQuery (see lazy-tab-embeds.js)

$('#ModalCenter').on('shown.bs.modal', initAqCovidMap);
