// ======================================================================= //
// utilities.js
// ======================================================================= //

// shared geography helpers: geo file lookup, geo ranks, and geo type normalization

// console.log('>> utilities.js')

// ----------------------------------------------------------------------- //
// geo file
// ----------------------------------------------------------------------- //

// Maps a backend GeoType value to the corresponding TopoJSON filename.
function getGeoFile(mapGeoType) {

    console.log("*** getGeoFile");

    // Return the matching geography file for the requested map geography.
    if (mapGeoType === "NTA2010") {
        return 'NTA_2010.topo.json';

    } else if (mapGeoType === "NTA2020") {
        return 'NTA_2020.topo.json';

    } else if (mapGeoType === "NYHarbor") {
        return 'ny_harbor.topo.json';

    } else if (mapGeoType === "CD") {
        return 'CD.topo.json';

    } else if (mapGeoType === "CDTA2020") {
        return 'CDTA_2020.topo.json';

    } else if (mapGeoType === "PUMA2010") {
        return 'PUMA2010.topo.json';

    } else if (mapGeoType === "PUMA2020") {
        return 'PUMA2020.topo.json';

    } else if (mapGeoType === "Subboro") {
        return 'PUMA_or_Subborough.topo.json';

    } else if (mapGeoType === "UHF42") {
        return 'UHF42.topo.json';

    } else if (mapGeoType === "UHF34") {
        return 'UHF34.topo.json';

    } else if (mapGeoType === "NYCKIDS2017") {
        return 'NYCKids_2017.topo.json';

    } else if (mapGeoType === "NYCKIDS2019") {
        return 'NYCKids_2019.topo.json';

    } else if (mapGeoType === "NYCKIDS2021") {
        return 'NYCKids_2021.topo.json';

    } else if (mapGeoType === "NYCKIDS2023") {
        return 'NYCKids_2023.topo.json';

    } else if (mapGeoType === "Borough") {
        return 'borough.topo.json';

    } else if (mapGeoType === "RMZ") {
        return 'RMZ.topo.json';   
    }
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

// Placeholder for legacy time-period label replacement behavior.
function replaceTimePeriodID() {

}

// Placeholder for future logic that picks the finest available geography.
function getFinestGeography() {}