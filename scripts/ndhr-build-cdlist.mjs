// ======================================================================= //
// ndhr-build-cdlist.mjs
// ======================================================================= //

// Generates data/globals/cdlist.json — the CD analogue of
// data/globals/uhflist.json, which supplies the Leaflet selector's name map and
// the demographics sidebar.
//
// It is generated rather than hand-authored because 59 rows x 10 machine-derived
// fields is 590 values, five of the fields move with every EHDP-data refresh, and
// a wrong one is a number on a public page with nothing to catch it. `check`
// regenerates and diffs, so drift fails a command instead of ageing quietly.
//
// Usage — POSITIONAL arguments only, for the reason measured in
// scripts/ndhr-indicator-availability.mjs:
//   node scripts/ndhr-build-cdlist.mjs                    print what would be written
//   node scripts/ndhr-build-cdlist.mjs build              write the file
//   node scripts/ndhr-build-cdlist.mjs check              diff against the committed file
//   npm run ndhr:cdlist check
//
// Exit codes: 0 fine; 1 the committed file differs from what the data now says;
// 2 the run could not be made, or a control failed.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const HUGO_CLI = "node_modules/hugo-extended/lib/cli.js";
const DEFAULT_ENV = "production";

const OUT_FILE = "data/globals/cdlist.json";
const META_FILE = "data/globals/cdlist-source.json";

const GEO_LOOKUP = "geography/GeoLookup.json";
const TIME_PERIODS = "indicators/metadata/TimePeriods.json";
const INDICATOR_METADATA = "indicators/metadata/metadata.json";
const indicatorData = (id) => `indicators/data/${id}.json`;

// Two vintages of the same relationship, and they are NOT interchangeable — see the
// control that compares PUMA2010's merged groups against the demographic data, and the
// note beside it. Never collapse these into one `PUMA_id`.
const PUMA2020_CROSSWALK = "geography/puma2020_to_cd.csv";
const PUMA2010_CROSSWALK = "geography/puma2010_to_subboro_cd.csv";

const EXPECTED_CD_COUNT = 59;

// Each crosswalk is 59 CD rows resolving to 55 areas, because four PUMAs cover two CDs
// each. True of PUMA2010, PUMA2020 and Subboro alike `[verified 2026-09-11: all three
// key columns matched their own geography type's GeoID set in GeoLookup.json, 55 of 55,
// none missing and none extra]` — which is also why this count cannot tell the two
// vintages apart, and why the merged-group control below exists.
const EXPECTED_PUMA_COUNT = 55;

// The five NR sidebar rows that exist as EHDP indicators at CD. Each resolves to
// its indicator's single `Percent` measure — read off metadata rather than hard-coded,
// and asserted to be exactly one, since an indicator that gained a second percent
// measure would otherwise be picked between silently.
const DEMOGRAPHIC_FIELDS = [
    { field: "PovertyPercent", indicatorId: 103, name: "Neighborhood poverty" },
    { field: "PercentLimitedEnglish", indicatorId: 2335, name: "Limited English" },
    { field: "PercentGraduatedHighSchool", indicatorId: 2334, name: "Graduated high school" },
    { field: "PercentOwnerOccupied", indicatorId: 17, name: "Owner-occupied homes" },
    { field: "PercentRentBurdened", indicatorId: 2336, name: "Rent-burdened households" }
];

// No EHDP-data source exists at CD for these three. metadata.json carries no total
// population or age-structure indicator at community district — the only population
// indicator at CD is "Foreign-born population" (14), which is a different quantity
// `[verified 2026-09-10: every IndicatorName matching /popul|age|65|under 18/ swept for
// CD in AvailableGeoTypes; control: the same sweep returns 2146 "Older adults living
// alone (65+)" and 2176 "Child poverty (under age 5)" as CD-available, so it fires]`.
// They are emitted null rather than omitted: null is greppable and renders as absent,
// where a missing key reads as an oversight and a 0 reads as a measurement.
const ACS_FIELDS = ["TotalPopulation", "PercentOver65", "PercentUnder18"];

// Both Name strings carry the community district number, but they are spelled
// differently — CD is "Financial District (CD1)" and CDTA2020 is
// "Melrose-Mott Haven-Port Morris (CD 1)" — so the optional space is load-bearing.
//
// The names are parsed rather than the ids joined, because a GeoID is unique only
// within its own geotype: CD 501 is Staten Island CD1 and CDTA2020 501 is Bronx CD1, so
// a GeoID join does not error, it swaps boroughs. Nothing upstream is broken by this —
// each geotype's geometry, GeoLookup rows and indicator data agree with each other,
// which is the only thing an arbitrary internal key has to do.
//
// It looks like it ought to work because under the other available scheme it would.
// EHDP-data's geography/create_TopoJSON.r:279-283 concatenates CountyFIPS rather than
// BoroCode; under BoroCode the CDTA ids would equal the CD ids exactly, 59 of 59.
//
// That is a pattern carried forward, not a slip. The same construction appears at :329
// for NTA2010 and :381 for NTA2020, and at NTA2010 the FIPS prefix bought something
// real — under BoroCode, 27 of the 195 NTA2010 ids would have collided with a CD id
// `[verified 2026-09-11: reconstructed from GeoLookup.json and intersected]`. NTA2020
// and CDTA2020 then followed the established pattern. By then it had expired: NTA2020's
// four-digit unit numbers cannot collide with a CD id either way, and the NTA-under-CDTA
// nesting holds 197 of 197 under both schemes. So the cost lands entirely on
// CDTA-against-CD, which is this file's problem and nobody else's.
//
// If those ids are ever corrected, `check` reports 59 changed CDTA_id values — re-run
// `build`, and do NOT switch this to a GeoID join. The name parse is correct under
// either scheme and depends on no id convention at all.
const CD_NUMBER = /\(\s*CD\s*(\d+)\s*\)\s*$/;

// ----------------------------------------------------------------------- //
// arguments
// ----------------------------------------------------------------------- //

const MODES = ["print", "build", "check"];

const usage = (why) => {
    console.error(`\n${why}\n`);
    console.error("Usage — positional arguments only, no flags:");
    console.error("  node scripts/ndhr-build-cdlist.mjs [print|build|check] [environment]\n");
    // Safe here only because argument parsing runs before any fetch. See the note
    // beside the main() call.
    process.exit(2);
};

const parseArgs = (argv) => {

    const flag = argv.find((a) => a.startsWith("-"));
    if (flag) usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (argv.length > 2) usage(`Expected at most a mode and an environment, got ${argv.length} arguments.`);

    const [mode = "print", environment = DEFAULT_ENV] = argv;
    if (!MODES.includes(mode)) usage(`Unknown mode "${mode}".`);
    if (!existsSync(`config/${environment}`)) usage(`No config/${environment}/ in this repo.`);

    return { mode, environment };

};

// ----------------------------------------------------------------------- //
// reading EHDP-data
// ----------------------------------------------------------------------- //

const readSiteConfig = (environment) => {

    const out = spawnSync(process.execPath, [HUGO_CLI, "config", "--environment", environment, "--format", "json"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024
    });

    if (out.status !== 0) return null;

    try {
        const cfg = JSON.parse(out.stdout);
        const repo = cfg.params?.data_repo ?? null;
        const branch = cfg.params?.data_branch ?? null;
        return (repo && branch) ? { dataRepo: repo, dataBranch: branch } : null;
    } catch {
        return null;
    }

};

const getJson = async (base, path) => {
    const url = `${base}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);
    return res.json();
};

// The two PUMA crosswalks are the only CSV sources here: a plain header, integer cells,
// no quoting or embedded commas, so a CSV library would be more machinery than the
// format warrants. What it would buy — noticing a malformed row instead of coercing it —
// is bought here instead by asserting the header, every row's width, and every cell's
// integer-ness, since a quietly mis-parsed id is precisely the failure this file exists
// to prevent.
const getCsv = async (base, path, expectedColumns) => {

    const url = `${base}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);

    const lines = (await res.text()).trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error(`${path} has ${lines.length} line(s), so no data rows`);

    const header = lines[0].split(",").map((h) => h.trim());
    if (header.join(",") !== expectedColumns.join(",")) {
        throw new Error(`${path} header is "${header.join(",")}", expected "${expectedColumns.join(",")}"`);
    }

    return lines.slice(1).map((line, i) => {

        const cells = line.split(",").map((c) => c.trim());
        if (cells.length !== header.length) {
            throw new Error(`${path} line ${i + 2} has ${cells.length} cell(s), expected ${header.length}: ${JSON.stringify(line)}`);
        }

        return Object.fromEntries(header.map((h, j) => {
            const n = Number(cells[j]);
            if (!Number.isInteger(n)) throw new Error(`${path} line ${i + 2}: ${h} is ${JSON.stringify(cells[j])}, not an integer id`);
            return [h, n];
        }));

    });

};

// EHDP-data's geography and indicator files are COLUMN-oriented: an object of equal
// length arrays, one per field. Everything downstream wants records, so expand once
// here. An object whose columns disagree in length would silently truncate, so the
// lengths are asserted rather than assumed.
const expandColumns = (doc, what) => {

    if (Array.isArray(doc)) return doc;
    if (doc === null || typeof doc !== "object") throw new Error(`${what} parsed as ${typeof doc}, not a table`);

    const columns = Object.keys(doc);
    if (columns.length === 0) throw new Error(`${what} has no columns`);

    const lengths = [...new Set(columns.map((c) => (Array.isArray(doc[c]) ? doc[c].length : -1)))];
    if (lengths.includes(-1)) throw new Error(`${what} has a column that is not an array`);
    if (lengths.length !== 1) throw new Error(`${what} columns disagree in length: ${lengths.join(", ")}`);
    if (lengths[0] === 0) throw new Error(`${what} has zero rows`);

    return Array.from({ length: lengths[0] }, (_, i) =>
        Object.fromEntries(columns.map((c) => [c, doc[c][i]])));

};

// ----------------------------------------------------------------------- //
// building the rows
// ----------------------------------------------------------------------- //

// Matches uhflist.json's own page_name style — lowercase, underscore-separated,
// punctuation dropped, and no id in the slug.
const slugify = (name) => name
    .replace(CD_NUMBER, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// Borough plus community district number, which is the CD's actual identity and the
// only thing the two name spellings share.
const crosswalkKey = (row) => {
    const m = CD_NUMBER.exec(row.Name ?? "");
    return m ? `${row.Borough}|${Number(m[1])}` : null;
};

// The LATEST period is the one whose coverage ends last, NEVER the highest
// TimePeriodID. On production today the highest id (288) is "2007-11" and the latest
// period (287) is "2015-19" — taking max(id) would publish eight-year-old figures on
// all five demographic fields, correctly formatted and silently wrong
// `[verified 2026-09-10: all five disagree, every one of them max-id 288 "2007-11"
// against end_period-latest 287 "2015-19"]`.
//
// NO CONTROL BELOW CATCHES A WRONG CHOICE HERE, and that is worth knowing rather than
// assuming. Forcing this reducer to take max(TimePeriodID) builds a complete, plausible
// file — 59 of 59 rows, no nulls, every control passing, every value eight years stale
// `[verified 2026-09-10: the injection ran and exited 0 with "Controls: passed"]`. The
// only things that would surface it are the period printed in the report, the
// timePeriod recorded per field in cdlist-source.json, and `check` once a correct file
// is committed. Read the period; do not read a green run as one.
const latestPeriod = (periodIds, periodsById, what) => {

    const known = periodIds.map((id) => periodsById.get(id)).filter(Boolean);
    if (known.length === 0) throw new Error(`${what}: none of its time periods are in TimePeriods.json`);
    if (known.length !== periodIds.length) {
        const missing = periodIds.filter((id) => !periodsById.has(id));
        throw new Error(`${what}: time period(s) ${missing.join(", ")} are not in TimePeriods.json`);
    }

    return known.reduce((a, b) => (b.end_period > a.end_period ? b : a));

};

const buildRows = ({ geoLookup, periods, metadata, demographicData, crosswalks }) => {

    const periodsById = new Map(periods.map((p) => [p.TimePeriodID, p]));

    const cdRows = geoLookup.filter((r) => r.GeoType === "CD");
    const cdtaRows = geoLookup.filter((r) => r.GeoType === "CDTA2020");

    // --- the crosswalk --------------------------------------------------- //

    const unparsedCd = cdRows.filter((r) => !crosswalkKey(r));
    const unparsedCdta = cdtaRows.filter((r) => !crosswalkKey(r));
    if (unparsedCd.length || unparsedCdta.length) {
        throw new Error(`the (CD n) parse failed on ${unparsedCd.length} CD and ${unparsedCdta.length} CDTA2020 names: ` +
            [...unparsedCd, ...unparsedCdta].map((r) => JSON.stringify(r.Name)).join(", "));
    }

    const cdtaByKey = new Map();
    for (const r of cdtaRows) {
        const k = crosswalkKey(r);
        if (cdtaByKey.has(k)) throw new Error(`two CDTA2020 rows parse to the same (borough, CD number) ${k}`);
        cdtaByKey.set(k, r);
    }

    // --- the PUMA crosswalks --------------------------------------------- //

    // Keyed on CD, not on PUMA, because CD is the page's geography and every CD appears
    // exactly once in each file. Unlike CDTA above, these are joined on ids rather than
    // parsed from names: the CD column carries DCP BoroCode ids that ARE CD's own GeoID
    // values, and PUMA names carry no "(CD n)" suffix to parse in the first place
    // `[verified 2026-09-11: PUMA2020 GeoLookup names are "Lower East Side & Chinatown"
    // and the like; both files' CD columns matched the published CD GeoID set exactly,
    // 59 of 59 in both directions]`. That is a join within the crosswalk's own declared
    // key space, not the cross-geotype GeoID join the comment on CD_NUMBER forbids.
    const pumaByCd = new Map();

    for (const r of crosswalks.puma2020) {
        if (pumaByCd.has(r.CD)) throw new Error(`${PUMA2020_CROSSWALK} lists CD ${r.CD} more than once`);
        pumaByCd.set(r.CD, { PUMA2020_id: r.PUMA2020 });
    }

    for (const r of crosswalks.puma2010) {
        const hit = pumaByCd.get(r.CD);
        if (!hit) throw new Error(`${PUMA2010_CROSSWALK} has CD ${r.CD}, which is not in ${PUMA2020_CROSSWALK}`);
        if (hit.PUMA2010_id !== undefined) throw new Error(`${PUMA2010_CROSSWALK} lists CD ${r.CD} more than once`);
        hit.PUMA2010_id = r.PUMA2010;
        hit.Subboro_id = r.Subboro;
    }

    // --- the demographic fields ------------------------------------------ //

    const demographics = DEMOGRAPHIC_FIELDS.map(({ field, indicatorId, name }) => {

        const indicator = metadata.find((m) => m.IndicatorID === indicatorId);
        if (!indicator) throw new Error(`indicator ${indicatorId} (${name}) is not in metadata.json`);

        const percentMeasures = (indicator.Measures ?? []).filter((m) => m.MeasurementType === "Percent");
        if (percentMeasures.length !== 1) {
            throw new Error(`indicator ${indicatorId} (${name}) has ${percentMeasures.length} Percent measures, expected exactly 1: ` +
                percentMeasures.map((m) => `${m.MeasureID} ${m.MeasureName}`).join("; "));
        }

        const measureId = percentMeasures[0].MeasureID;
        const rows = demographicData[indicatorId].filter((r) => r.GeoType === "CD" && r.MeasureID === measureId);
        if (rows.length === 0) throw new Error(`indicator ${indicatorId} (${name}) has no CD rows for measure ${measureId}`);

        const period = latestPeriod([...new Set(rows.map((r) => r.TimePeriodID))], periodsById, `indicator ${indicatorId} (${name})`);
        const atLatest = rows.filter((r) => r.TimePeriodID === period.TimePeriodID);

        const byGeoId = new Map();
        for (const r of atLatest) {
            if (byGeoId.has(r.GeoID)) throw new Error(`indicator ${indicatorId} (${name}) has two rows for CD ${r.GeoID} at ${period.TimePeriod}`);
            byGeoId.set(r.GeoID, r);
        }

        return { field, indicatorId, name, measureId, measureName: percentMeasures[0].MeasureName, period, byGeoId };

    });

    // --- the rows -------------------------------------------------------- //

    const rows = cdRows.map((cd) => {

        const cdta = cdtaByKey.get(crosswalkKey(cd));
        const puma = pumaByCd.get(cd.GeoID) ?? {};

        // PUMA2020_id is the one the report reads (plan DECIDED-10). The other two ride
        // along at no extra cost — Subboro shares a file with PUMA2010 — and keep open
        // the one option that would return indicator 2377, which has no PUMA2020 rows.
        const row = {
            CD_id: cd.GeoID,
            CD_name: cd.Name,
            page_name: slugify(cd.Name),
            borough: cd.Borough,
            CDTA_id: cdta ? cdta.GeoID : null,
            PUMA2020_id: puma.PUMA2020_id ?? null,
            PUMA2010_id: puma.PUMA2010_id ?? null,
            Subboro_id: puma.Subboro_id ?? null
        };

        for (const f of ACS_FIELDS) row[f] = null;

        for (const d of demographics) {
            const hit = d.byGeoId.get(cd.GeoID);
            const v = hit?.Value;
            row[d.field] = (typeof v === "number" && Number.isFinite(v)) ? Math.round(v * 100) / 100 : null;
        }

        return row;

    });

    return { rows, demographics };

};

// EHDP-data does not report every community district separately on these five. Four
// pairs carry one value between them, identically across all five fields, and the pairs
// are the same four every time: Manhattan CD1/CD2, Manhattan CD4/CD5, Bronx CD1/CD2,
// Bronx CD3/CD6 — so 59 rows carry 55 distinct measurements. The merge structure is
// PUMA's (plan DECIDED-3 names the two Manhattan ones), but the values are NOT copied
// Subboro values: 9 to 20 CD values per field appear at no Subboro area
// `[verified 2026-09-10: exact Value comparison, CD against Subboro, all five indicators
// at TimePeriodID 287]`.
//
// Recorded rather than corrected — it is upstream. It matters downstream because the
// sidebar shows Manhattan CD1 and CD2 as identical, and a reader comparing two
// neighbouring districts reads that as a bug unless the page says otherwise.
// The CD groups that share one value of `field` — the crosswalk's own account of which
// districts are reported together, as against mergedAreas() below, which reads the same
// structure off the published values instead. Comparing the two is the whole point.
const groupsSharing = (rows, field) => {

    const byValue = new Map();
    for (const r of rows) {
        if (!byValue.has(r[field])) byValue.set(r[field], []);
        byValue.get(r[field]).push(r.CD_id);
    }

    return [...byValue.values()].filter((g) => g.length > 1);

};

// Sorted and joined so two groupings compare as strings regardless of row order.
const groupKey = (cdIds) => [...cdIds].sort((a, b) => a - b).join("+");

const mergedAreas = (rows) => {

    const byTuple = new Map();
    for (const r of rows) {
        const key = DEMOGRAPHIC_FIELDS.map((d) => JSON.stringify(r[d.field])).join("|");
        if (!byTuple.has(key)) byTuple.set(key, []);
        byTuple.get(key).push(r);
    }

    return [...byTuple.values()]
        .filter((g) => g.length > 1)
        .map((g) => g.map((r) => ({ CD_id: r.CD_id, CD_name: r.CD_name, borough: r.borough })));

};

// ----------------------------------------------------------------------- //
// controls
// ----------------------------------------------------------------------- //

// Each one is a way the build could produce a plausible-looking file that is wrong,
// and each is checked against the artifact rather than against the code that made it.
const runControls = ({ rows, demographics }) => {

    const failures = [];

    if (rows.length !== EXPECTED_CD_COUNT) failures.push(`${rows.length} rows, expected ${EXPECTED_CD_COUNT}`);

    const nullCrosswalk = rows.filter((r) => r.CDTA_id === null);
    if (nullCrosswalk.length) failures.push(`${nullCrosswalk.length} row(s) have a null CDTA_id: ${nullCrosswalk.map((r) => r.CD_name).join(", ")}`);

    const cdtaIds = rows.map((r) => r.CDTA_id).filter((v) => v !== null);
    if (new Set(cdtaIds).size !== cdtaIds.length) failures.push("CDTA_id is not distinct across the 59 rows — two CDs are pointing at one CDTA");

    const cdIds = rows.map((r) => r.CD_id);
    if (new Set(cdIds).size !== cdIds.length) failures.push("CD_id is not distinct");

    const slugs = rows.map((r) => r.page_name);
    if (new Set(slugs).size !== slugs.length) {
        const counts = {};
        for (const s of slugs) counts[s] = (counts[s] ?? 0) + 1;
        failures.push(`page_name collides, so two CDs would share a URL: ${Object.entries(counts).filter(([, n]) => n > 1).map(([s]) => s).join(", ")}`);
    }
    if (slugs.some((s) => s === "")) failures.push("a page_name slugified to the empty string");

    // A field that came back null on every row reads the same as a field whose source
    // moved — so each is required complete, which is what 59/59 coverage was measured at.
    for (const d of demographics) {
        const missing = rows.filter((r) => r[d.field] === null);
        if (missing.length) failures.push(`${d.field} is null on ${missing.length} of ${rows.length} rows (${d.name}, ${d.period.TimePeriod})`);
    }

    // --- the PUMA crosswalk columns --------------------------------------- //

    for (const field of ["PUMA2020_id", "PUMA2010_id", "Subboro_id"]) {

        const missing = rows.filter((r) => r[field] === null);
        if (missing.length) {
            failures.push(`${field} is null on ${missing.length} of ${rows.length} rows: ${missing.map((r) => r.CD_name).join(", ")}`);
            continue;
        }

        const distinct = new Set(rows.map((r) => r[field])).size;
        if (distinct !== EXPECTED_PUMA_COUNT) {
            failures.push(`${field} resolves to ${distinct} distinct values across ${rows.length} CDs, expected ${EXPECTED_PUMA_COUNT}`);
        }

    }

    // THE control that can tell the two vintages apart — and the reason the three above
    // cannot. Both crosswalks are 59 CD rows resolving to 55 areas with four merged
    // pairs, so every count, null check and distinctness check passes identically under
    // either. What separates them is WHICH districts they merge: PUMA2010 merges
    // Manhattan CD4+CD5 and leaves CD6 alone, PUMA2020 merges CD5+CD6 and leaves CD4
    // alone, and the other three merged pairs are the same in both.
    //
    // EHDP-data's CD-level demographic indicators are published on the PUMA2010
    // structure, and mergedAreas() recovers that structure from the values themselves —
    // so this compares the crosswalk against data computed without reference to it,
    // rather than restating the file back to itself.
    //
    // A swap is correct on 56 of 59 districts, all three errors in one borough, which is
    // the shape a spot check anywhere else passes `[verified 2026-09-11: the two files'
    // merged groups differ only in Manhattan; the same comparison against PUMA2020
    // returns false, so this control discriminates rather than merely firing]`.
    const fromData = new Set(mergedAreas(rows).map((g) => groupKey(g.map((r) => r.CD_id))));
    const fromCrosswalk = new Set(groupsSharing(rows, "PUMA2010_id").map(groupKey));
    const sameGrouping = fromData.size === fromCrosswalk.size && [...fromData].every((k) => fromCrosswalk.has(k));

    if (!sameGrouping) {
        failures.push(
            `PUMA2010_id merges CD groups [${[...fromCrosswalk].join(", ") || "none"}], but the demographic data reports ` +
            `[${[...fromData].join(", ") || "none"}] as one area. Either the two crosswalk vintages were swapped ` +
            `(PUMA2020 merges 105+106 where PUMA2010 merges 104+105), or EHDP-data changed which districts it reports together.`);
    }

    // The inverse control for the ACS gap: if a source is ever found, these stop being
    // null and this line is the reminder to delete the control rather than the finding.
    const acsFilled = ACS_FIELDS.filter((f) => rows.some((r) => r[f] !== null));
    if (acsFilled.length && acsFilled.length !== ACS_FIELDS.length) {
        failures.push(`ACS fields are half-filled (${acsFilled.join(", ")}), which is neither the documented gap nor a complete source`);
    }

    return failures;

};

// ----------------------------------------------------------------------- //
// output
// ----------------------------------------------------------------------- //

const serialize = (rows) => `${JSON.stringify(rows, null, 4)}\n`;

const report = ({ rows, demographics }) => {

    console.log(`\nCommunity districts: ${rows.length}   crosswalked to CDTA2020: ${rows.filter((r) => r.CDTA_id !== null).length}`);

    console.log("\nDemographic fields, each at its own latest period:");
    for (const d of demographics) {
        console.log(`  ${d.field.padEnd(28)} indicator ${String(d.indicatorId).padStart(4)} measure ${String(d.measureId).padStart(4)}  ${d.period.TimePeriod} (TimePeriodID ${d.period.TimePeriodID})`);
    }

    const merged = mergedAreas(rows);
    const distinct = rows.length - merged.reduce((n, g) => n + g.length - 1, 0);
    console.log(`\nReported as one area (identical on all five fields): ${merged.length} group(s), so ${rows.length} rows carry ${distinct} distinct measurements.`);
    for (const g of merged) console.log(`  ${g.map((r) => `${r.borough} ${r.CD_name}`).join("  ==  ")}`);

    // Printed because no control reads which vintage the report consumes — the controls
    // check that PUMA2010 agrees with the demographic data, which is a different claim.
    const distinctIn = (field) => new Set(rows.map((r) => r[field])).size;
    console.log(`\nPUMA2020 — what the report reads (DECIDED-10): ${distinctIn("PUMA2020_id")} distinct across ${rows.length} CDs.`);
    for (const g of groupsSharing(rows, "PUMA2020_id")) {
        console.log(`  one PUMA2020 covers CD ${g.join(" and CD ")}`);
    }
    console.log(`  Also emitted, unread by the report: PUMA2010_id (${distinctIn("PUMA2010_id")} distinct), Subboro_id (${distinctIn("Subboro_id")} distinct).`);
    console.log("  The sidebar's demographics are on the PUMA2010 merge structure, so the two disagree in Manhattan.");
    console.log("  Task 7 must label BOTH, not only the PUMA rows.");

    console.log(`\n  ACS fields (${ACS_FIELDS.join(", ")}): null on all ${rows.length} rows.`);
    console.log("  No EHDP-data source exists at CD. Task 7 must render a null as absent, never as 0.");

    const sample = rows[0];
    console.log(`\nFirst row:\n${JSON.stringify(sample, null, 4).split("\n").map((l) => `  ${l}`).join("\n")}\n`);

};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const gitHead = () => {
    const out = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
    return out.status === 0 ? out.stdout.trim() : null;
};

async function main() {

    const { mode, environment } = parseArgs(process.argv.slice(2));

    const site = readSiteConfig(environment);
    if (!site) {
        console.error(`\nREFUSING TO RUN — could not read data_repo and data_branch from the merged config for --environment ${environment}.\n`);
        return 2;
    }

    const base = `${site.dataRepo}${site.dataBranch}/`;
    console.log(`Environment: ${environment}   EHDP-data branch: ${site.dataBranch}`);
    console.log(`Source: ${base}`);

    let built;
    try {

        const [geoDoc, periodsDoc, metadataDoc] = await Promise.all([
            getJson(base, GEO_LOOKUP),
            getJson(base, TIME_PERIODS),
            getJson(base, INDICATOR_METADATA)
        ]);

        const demographicDocs = await Promise.all(
            DEMOGRAPHIC_FIELDS.map((d) => getJson(base, indicatorData(d.indicatorId))));

        const [puma2020, puma2010] = await Promise.all([
            getCsv(base, PUMA2020_CROSSWALK, ["PUMA2020", "CD"]),
            getCsv(base, PUMA2010_CROSSWALK, ["PUMA2010", "Subboro", "CD"])
        ]);

        // Unlike the geography and indicator-data files, metadata.json is a plain array
        // of indicator records rather than a column table.
        if (!Array.isArray(metadataDoc) || metadataDoc.length === 0) throw new Error(`${INDICATOR_METADATA} is not a non-empty array of indicators`);
        const metadata = metadataDoc;

        const demographicData = Object.fromEntries(
            DEMOGRAPHIC_FIELDS.map((d, i) => [d.indicatorId, expandColumns(demographicDocs[i], indicatorData(d.indicatorId))]));

        built = buildRows({
            geoLookup: expandColumns(geoDoc, GEO_LOOKUP),
            periods: expandColumns(periodsDoc, TIME_PERIODS),
            metadata,
            demographicData,
            crosswalks: { puma2020, puma2010 }
        });

    } catch (err) {
        console.error(`\nREFUSING TO RUN — ${err.message}\n`);
        return 2;
    }

    const controlFailures = runControls(built);
    console.log(`Controls: ${controlFailures.length ? "FAILED" : "passed"}`);

    if (controlFailures.length) {
        console.error("\nCONTROL FAILURE — the generated list cannot be trusted, so nothing is written:");
        for (const f of controlFailures) console.error(`  ${f}`);
        console.error("");
        return 2;
    }

    report(built);

    const json = serialize(built.rows);

    if (mode === "print") return 0;

    const meta = {
        generatedBy: "scripts/ndhr-build-cdlist.mjs",
        generatedAt: new Date().toISOString(),
        gitHead: gitHead(),
        environment,
        dataBranch: site.dataBranch,
        source: base,
        communityDistricts: built.rows.length,
        demographicFields: built.demographics.map((d) => ({
            field: d.field,
            indicatorId: d.indicatorId,
            indicatorName: d.name,
            measureId: d.measureId,
            measureName: d.measureName,
            timePeriod: d.period.TimePeriod,
            timePeriodId: d.period.TimePeriodID
        })),
        acsFieldsWithNoSource: ACS_FIELDS,
        // Which file each PUMA column came from, and which one the report actually
        // reads — the sidecar is where a later reader checks that without re-deriving it.
        crosswalks: {
            PUMA2020_id: PUMA2020_CROSSWALK,
            PUMA2010_id: PUMA2010_CROSSWALK,
            Subboro_id: PUMA2010_CROSSWALK,
            readByTheReport: "PUMA2020_id",
            demographicsAreOn: "PUMA2010_id"
        },
        reportedAsOneArea: mergedAreas(built.rows)
    };

    if (mode === "build") {
        writeFileSync(OUT_FILE, json, "utf8");
        writeFileSync(META_FILE, `${JSON.stringify(meta, null, 4)}\n`, "utf8");
        console.log(`Wrote ${OUT_FILE} (${built.rows.length} rows) and ${META_FILE}.\n`);
        return 0;
    }

    // mode === "check"
    if (!existsSync(OUT_FILE)) {
        console.error(`\nNO FILE at ${OUT_FILE}. Run: node scripts/ndhr-build-cdlist.mjs build\n`);
        return 2;
    }

    const committed = readFileSync(OUT_FILE, "utf8");

    if (committed === json) {
        console.log(`UNCHANGED — ${OUT_FILE} matches what EHDP-data ${site.dataBranch} says today.\n`);
        return 0;
    }

    // Field-level rather than a text diff, because a whitespace-only difference and a
    // moved value are not the same finding and read identically in a line diff.
    const before = JSON.parse(committed);
    const after = built.rows;
    const byId = new Map(before.map((r) => [r.CD_id, r]));
    const lines = [];

    for (const r of after) {
        const b = byId.get(r.CD_id);
        if (!b) { lines.push(`  + CD ${r.CD_id} ${r.CD_name}: not in the committed file`); continue; }
        for (const k of Object.keys(r)) {
            if (JSON.stringify(b[k]) !== JSON.stringify(r[k])) {
                lines.push(`  ~ CD ${r.CD_id} ${r.CD_name}: ${k} ${JSON.stringify(b[k])} -> ${JSON.stringify(r[k])}`);
            }
        }
    }
    const afterIds = new Set(after.map((r) => r.CD_id));
    for (const b of before) if (!afterIds.has(b.CD_id)) lines.push(`  - CD ${b.CD_id} ${b.CD_name}: in the committed file, not in the data`);

    if (lines.length === 0) lines.push("  (values identical; only formatting differs — re-run `build`)");

    console.log(`\nCDLIST MOVED — ${lines.length} difference(s) against ${OUT_FILE}:\n`);
    for (const l of lines.slice(0, 60)) console.log(l);
    if (lines.length > 60) console.log(`  ... and ${lines.length - 60} more`);
    console.log("\nRe-run `build` once you have read why, and re-check the demographics period in the report above.\n");

    return 1;

}

// process.exit() is NOT usable here, for the reason measured in
// scripts/ndhr-indicator-availability.mjs: on Node v24.0.1 / Windows it aborts after
// a fetch() with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file
// src\win\async.c, line 76` and yields exit 127.
process.exitCode = await main();
