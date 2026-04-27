// ======================================================================= //
// utilities.js
// ======================================================================= //

// shared geography helpers: geo file lookup, geo ranks, and geo type normalization

// console.log('>> utilities.js')

// ----------------------------------------------------------------------- //
// geo file
// ----------------------------------------------------------------------- //

const GEO_FILE_BY_TYPE = {
    NTA2010: 'NTA_2010.topo.json',
    NTA2020: 'NTA_2020.topo.json',
    NYHarbor: 'ny_harbor.topo.json',
    CD: 'CD.topo.json',
    CDTA2020: 'CDTA_2020.topo.json',
    PUMA2010: 'PUMA2010.topo.json',
    PUMA2020: 'PUMA2020.topo.json',
    Subboro: 'PUMA_or_Subborough.topo.json',
    UHF42: 'UHF42.topo.json',
    UHF34: 'UHF34.topo.json',
    NYCKIDS2017: 'NYCKids_2017.topo.json',
    NYCKIDS2019: 'NYCKids_2019.topo.json',
    NYCKIDS2021: 'NYCKids_2021.topo.json',
    NYCKIDS2023: 'NYCKids_2023.topo.json',
    Borough: 'borough.topo.json',
    RMZ: 'RMZ.topo.json'
};

// Maps a backend GeoType value to the corresponding TopoJSON filename.
function getGeoFile(mapGeoType) {

    console.log("*** getGeoFile");

    // Return the matching geography file for the requested map geography.
    return GEO_FILE_BY_TYPE[mapGeoType];
}

// ----------------------------------------------------------------------- //
// geo ranks
// ----------------------------------------------------------------------- //

// define georank function at top scope, so we can use it later

// Assigns a sortable rank so geographies can be ordered from broad to fine.
const assignGeoRank = (GeoType) => {

    // Normalize multiple backend variants into one numeric sort order.
    switch (GeoType) {
        case 'Citywide':
            return 0;
        case 'Borough':
            return 1;
        case 'NYCKIDS':
        case 'NYCKIDS2017':
        case 'NYCKIDS2019':
        case 'NYCKIDS2021':
        case 'NYCKIDS2023':
            return 2;
        case 'UHF34':
            return 3;
        case 'UHF42':
            return 4;
        case 'Subboro':
            return 5;
        case 'CD':
            return 6;
        case 'CDTA':
        case 'CDTA2020':
            return 7;
        case 'PUMA':
        case 'PUMA2010':
        case 'PUMA2020':
            return 8;
        case 'NTA':
        case 'NTA2010':
        case 'NTA2020':
            return 10;
        case 'NYHarbor':
            return 11;
        case 'RMZ':
            return 12;
    }
}

// array of (pretty) geotypes in georank order

const geoTypes = [
    "Citywide",
    "Borough",
    "NYCKIDS",
    "UHF34",
    "UHF42",
    "Subboro",
    "CD",
    "CDTA",
    "PUMA",
    "NTA",
    "NYHarbor",
    "RMZ"
]

// ----------------------------------------------------------------------- //
// pretty generic geotypes
// ----------------------------------------------------------------------- //

// this allows us to have different versions of the same geotype on the back-end,
//  while keeping them generic on the front-end. We use this function to convert
//  versioned geotypes in the data into generic geotypes.

// Collapses versioned backend geotypes into the generic labels shown in the UI.
const prettifyGeoType = (GeoType) => {

    // Group backend-specific geography versions under one front-end label.
    switch (GeoType) {

        case 'NYCKIDS2017':
            return 'NYCKIDS';

        case 'NYCKIDS2019':
            return 'NYCKIDS';

        case 'NYCKIDS2021':
            return 'NYCKIDS';

        case 'NYCKIDS2023':
            return 'NYCKIDS';

        case 'CDTA2020':
            return 'CDTA';

        case 'NTA2010':
            return 'NTA';

        case 'NTA2020':
            return 'NTA';

        case 'PUMA2010':
            return 'PUMA';

        case 'PUMA2020':
            return 'PUMA';

        default:
            return GeoType;

    }
}

// ----------------------------------------------------------------------- //
// chart resize
// ----------------------------------------------------------------------- //

// Nudges Vega and DataTables layouts to recompute after tab or panel changes.
const updateChartPlotSize = () => {

    console.log("* updateChartPlotSize");

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 200)

}
