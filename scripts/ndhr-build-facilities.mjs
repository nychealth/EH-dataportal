// ======================================================================= //
// ndhr-build-facilities.mjs
// ======================================================================= //

// Generates static/geojson/ndhr-facilities.geojson — the health care and residential
// care facilities drawn as points on every NDHR report map that carries district data
// (assets/js/ndhr-report/map.js).
//
// The source is scripts/ndhr-facilities-source.csv, a geocoded facility list
// committed as received. Not in data/ beside cdlist-source.json: Hugo parses every CSV
// there, and this one fails the build with "unexpected data type [][]string". It is converted rather than read in the browser so the page
// fetches one small file Leaflet takes as-is, and so the conversion's checks — five
// known facility types, coordinates inside the city, a numeric bed count — run once
// here rather than silently not at all on a public page. To update the points, replace
// the CSV and run `build`.
//
// Usage — POSITIONAL arguments only, matching scripts/ndhr-build-cdlist.mjs:
//   node scripts/ndhr-build-facilities.mjs                print what would be written
//   node scripts/ndhr-build-facilities.mjs build          write the file
//   node scripts/ndhr-build-facilities.mjs check          diff against the committed file
//   npm run ndhr:facilities check
//
// Exit codes: 0 fine; 1 the committed file differs from what the CSV now says;
// 2 the run could not be made, or a control failed.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const SOURCE_FILE = "scripts/ndhr-facilities-source.csv";
const OUT_FILE = "static/geojson/ndhr-facilities.geojson";

// The five types map.js colors. A sixth in a future CSV would draw in no legend entry,
// so it fails the build here instead
const FACILITY_TYPES = [
    "Adult Home",
    "Enriched Housing Program",
    "Hospice",
    "Hospital",
    "Residential Health Care Facility - SNF"
];

// A loose box around the five boroughs — catches a swapped lat/long or a geocoder miss,
// which lands in the Gulf of Guinea at 0,0
const NYC_BOUNDS = { minLat: 40.49, maxLat: 40.92, minLon: -74.26, maxLon: -73.69 };

const MODES = ["print", "build", "check"];


// ----------------------------------------------------------------------- //
// parsing
// ----------------------------------------------------------------------- //

// Splits RFC 4180 CSV text into rows of fields. Quoted fields are what the source uses for
// names carrying a comma ("Cobble Hill Health Center, Inc")

const parseCSV = text => {

    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const c = text[i];

        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
            continue;
        }

        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c !== "\r") field += c;

    }

    if (field || row.length) { row.push(field); rows.push(row); }

    return rows.filter(r => r.some(f => f.trim()));

};


// The geocoder returns addresses upper-cased with a trailing space ("234 EAST 149 STREET ");
// popups show them in title case

const titleCaseAddress = address =>
    address.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|\s)([a-z])/g, (m, s, ch) => s + ch.toUpperCase());


// ----------------------------------------------------------------------- //
// build
// ----------------------------------------------------------------------- //

// Converts the CSV to a FeatureCollection, collecting every failed control rather than
// stopping at the first

const build = () => {

    // Strip the BOM the source arrives with, or the first header name carries it
    const text = readFileSync(SOURCE_FILE, "utf8").replace(/^﻿/, "");
    const [header, ...records] = parseCSV(text);
    const col = name => header.indexOf(name);

    const errors = [];

    const required = [
        "INPUT_1_Facility_Type", "INPUT_1_Total_Beds", "INPUT_1_Facility_Name",
        "OUTPUT_Community_District", "OUTPUT_Geocoded_Standardized_Address",
        "OUTPUT_Latitude", "OUTPUT_Longitude", "OUTPUT_Zip_Code"
    ];

    for (const name of required) {
        if (col(name) < 0) errors.push(`missing column ${name}`);
    }

    if (errors.length) return { errors };

    const features = records.map((r, i) => {

        const line = i + 2;
        const type = r[col("INPUT_1_Facility_Type")].trim();
        const beds = Number(r[col("INPUT_1_Total_Beds")]);
        const lat = Number(r[col("OUTPUT_Latitude")]);
        const lon = Number(r[col("OUTPUT_Longitude")]);

        if (!FACILITY_TYPES.includes(type)) errors.push(`line ${line}: unknown facility type "${type}"`);
        if (!Number.isInteger(beds)) errors.push(`line ${line}: bed count "${r[col("INPUT_1_Total_Beds")]}" is not a whole number`);

        if (!(lat >= NYC_BOUNDS.minLat && lat <= NYC_BOUNDS.maxLat && lon >= NYC_BOUNDS.minLon && lon <= NYC_BOUNDS.maxLon)) {
            errors.push(`line ${line}: ${lat},${lon} is outside New York City`);
        }

        // Six decimal places is ~10 cm, past what a geocoded street address can claim,
        // and trims a third off the file
        return {
            type: "Feature",
            properties: {
                type,
                name: r[col("INPUT_1_Facility_Name")].trim(),
                beds,
                address: titleCaseAddress(r[col("OUTPUT_Geocoded_Standardized_Address")]),
                zip: r[col("OUTPUT_Zip_Code")].trim(),
                cd: Number(r[col("OUTPUT_Community_District")])
            },
            geometry: {
                type: "Point",
                coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
            }
        };

    });

    return { errors, features };

};


// One feature per line: small enough to diff by facility in a PR, unlike a single line

const serialize = features =>
    '{"type":"FeatureCollection","features":[\n' +
    features.map(f => JSON.stringify(f)).join(",\n") +
    "\n]}\n";


// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const main = () => {

    const mode = process.argv[2] || "print";

    if (!MODES.includes(mode)) {
        console.error(`\nUnknown mode "${mode}". Usage:`);
        console.error("  node scripts/ndhr-build-facilities.mjs [print|build|check]\n");
        return 2;
    }

    const { errors, features } = build();

    if (errors.length) {
        console.error(`\n${errors.length} problem(s) in ${SOURCE_FILE}:\n`);
        for (const e of errors.slice(0, 40)) console.error("  " + e);
        console.error("");
        return 2;
    }

    const counts = {};
    for (const f of features) counts[f.properties.type] = (counts[f.properties.type] || 0) + 1;

    const json = serialize(features);

    if (mode === "print") {
        console.log(`\n${features.length} facilities from ${SOURCE_FILE}:`);
        for (const t of FACILITY_TYPES) console.log(`  ${String(counts[t] || 0).padStart(4)}  ${t}`);
        console.log(`\nRun with \`build\` to write ${OUT_FILE}.\n`);
        return 0;
    }

    if (mode === "build") {
        writeFileSync(OUT_FILE, json, "utf8");
        console.log(`Wrote ${OUT_FILE} (${features.length} facilities).\n`);
        return 0;
    }

    // mode === "check"
    if (!existsSync(OUT_FILE)) {
        console.error(`\nNO FILE at ${OUT_FILE}. Run: node scripts/ndhr-build-facilities.mjs build\n`);
        return 2;
    }

    if (readFileSync(OUT_FILE, "utf8") === json) {
        console.log(`UNCHANGED — ${OUT_FILE} matches ${SOURCE_FILE}.\n`);
        return 0;
    }

    console.log(`\nFACILITIES MOVED — ${OUT_FILE} no longer matches ${SOURCE_FILE}. Re-run \`build\`.\n`);

    return 1;

};

process.exitCode = main();
