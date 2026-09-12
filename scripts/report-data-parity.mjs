// ======================================================================= //
// report-data-parity.mjs
// ======================================================================= //

// Checks assets/js/report-data/normalize.js against ground truth: the precomputed
// Neighborhood Reports payloads EHDP-data has published for years.
//
// This is the evidence behind plan DECIDED-4 ("route A": compute in the browser
// instead of asking the data team for precomputed files at three more geographies).
// The claim route A rests on is that the numbers come out the same, and nothing else
// in this repo can test it — `lint` does not run the file, `smoke` would only prove
// it throws no console error, and no NDHR page existed when it was written.
//
// It runs `buildRows` at UHF42 over an NR report's own MeasureID list and diffs the
// result against that report's published JSON, field by field, area by area.
//
// Usage — POSITIONAL arguments only, for the reason in ndhr-indicator-availability.mjs
// (PowerShell eats the `--` in `npm run x -- --flag` and npm eats the flag name, so a
// flag reaches the script as no argument at all):
//
//   node scripts/report-data-parity.mjs                       the Active Design report
//   node scripts/report-data-parity.mjs all                   all five NR reports
//   node scripts/report-data-parity.mjs all dev_stage         ...on another environment
//   npm run report-data:parity
//
// Exit codes: 0 parity holds; 1 a field differs; 2 the run could not be made, or the
// control failed.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
// js-yaml 5.x ships named ESM exports and no default, so `import yaml from` fails at load.
import { load as loadYaml } from "js-yaml";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const HUGO_CLI = "node_modules/hugo-extended/lib/cli.js";
const MODULE_FILE = "assets/js/report-data/normalize.js";
const NR_CONTENT_DIR = "data/globals/NR_content";
const REPORT_DIR = "neighborhood-reports/data/report/";

const DEFAULT_ENV = "production";
const GEOTYPE = "UHF42";

const REPORTS = [
    "Active_Design_Physical_Activity_and_Health",
    "Asthma_and_the_Environment",
    "Climate_and_Health",
    "Housing_and_Health",
    "Outdoor_Air_and_Health"
];

const DEFAULT_REPORT = REPORTS[0];

// Fields compared, each paired with how to read it from the published row. Only fields
// with an upstream source are here — see EXPECTED_ABSENT below for the two that have none.
const COMPARED = [
    ["data_value_geo_entity", row => row.data_value_geo_entity, truth => truth.data_value_geo_entity],
    ["unmodified_data_value_geo_entity", row => row.unmodified_data_value_geo_entity, truth => truth.unmodified_data_value_geo_entity],
    ["data_value_boro", row => row.data_value_boro, truth => truth.data_value_boro],
    ["data_value_nyc", row => row.data_value_nyc, truth => truth.data_value_nyc],
    ["data_value_rank", row => row.data_value_rank, truth => truth.data_value_rank],
    ["rankReverse", row => row.rankReverse, truth => truth.rankReverse === true || truth.rankReverse === "true"],
    ["year_id", row => row.year_id, truth => truth.year_id],
    ["geo_entity_name", row => row.geo_entity_name, truth => truth.neighborhood],
    ["indicator_name", row => row.indicator_name, truth => truth.indicator_name],
    ["indicator_long_name", row => row.indicator_long_name, truth => truth.indicator_long_name],
    ["indicator_description", row => row.indicator_description, truth => truth.indicator_description],
    ["measurement_type", row => row.measurement_type, truth => truth.measurement_type],
    ["data_source_list", row => row.data_source_list, truth => truth.data_source_list],

    // Compared since 2026-09-11. It was in EXPECTED_ABSENT on the belief that metadata
    // carries no units field; metadata's `DisplayType` is that field, so this row is what
    // holds normalize.js to it across every NR measure rather than the 10 NDHR ones the
    // finding came from.
    ["units", row => row.units, truth => truth.units]
];

// Deliberately not compared, because no upstream source exists for either and both are
// authored in the site's own content YAML. Named here rather than silently omitted: a
// field that quietly leaves the comparison set is how a parity claim gets wider than the
// check behind it.
const EXPECTED_ABSENT = [
    "indicator_short_name — EHDP-data carries only the long form; the curated nr_indicator_names.json has no short-name column",
    "nbr_rank — carried by the published payloads and rendered by nothing; its tie convention was not recovered, so normalize.js does not emit it"
];

// ----------------------------------------------------------------------- //
// arguments
// ----------------------------------------------------------------------- //

const usage = (why) => {
    console.error(`\n${why}\n`);
    console.error("Usage — positional arguments only, no flags:");
    console.error("  node scripts/report-data-parity.mjs [report-key|all] [environment]");
    console.error(`\nReport keys: ${REPORTS.join(", ")}, or "all" (default: ${DEFAULT_REPORT})`);
    console.error(`Environment: any directory under config/ (default: ${DEFAULT_ENV})\n`);
    // Safe: argument parsing runs before any fetch, so there is no socket teardown to
    // race. Every later exit sets process.exitCode instead — see the note at main().
    process.exit(2);
};

const parseArgs = (argv) => {

    const flag = argv.find((a) => a.startsWith("-"));
    if (flag) usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (argv.length > 2) usage(`Expected at most a report key and an environment, got ${argv.length} arguments.`);

    const [report = DEFAULT_REPORT, environment = DEFAULT_ENV] = argv;
    if (report !== "all" && !REPORTS.includes(report)) usage(`Unknown report key "${report}".`);
    if (!existsSync(`config/${environment}`)) usage(`No config/${environment}/ in this repo.`);

    return { reports: report === "all" ? REPORTS : [report], environment };

};

// ----------------------------------------------------------------------- //
// loading the module under test
// ----------------------------------------------------------------------- //

// normalize.js is a classic browser script, not an ES module — it declares top-level
// consts and exports nothing, exactly as assets/js/nr-report/ does. Evaluating the real
// file in a fresh context is what lets this harness test the file the site ships rather
// than a Node-shaped copy of it, which would be free to drift.
//
// `patch` exists for the control below: it rewrites the source before evaluation, so a
// deliberately wrong rule can be run through the same comparison.
const loadModule = (patch) => {

    let source = readFileSync(MODULE_FILE, "utf8");

    if (patch) {
        const patched = patch(source);
        if (patched === source) throw new Error("control patch matched nothing — the anchor has moved");
        source = patched;
    }

    const context = { fetch, console, URL };
    runInNewContext(source + "\n;buildRows", context);

    return runInNewContext("buildRows", context);

};

// ----------------------------------------------------------------------- //
// reading EHDP-data and the site's own content
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

// The MeasureID list for one report, read from the site's own NR_content YAML rather
// than from the published payload — so the harness compares two independently-sourced
// lists and a payload that dropped a measure shows up as a missing row.
const readMeasureIds = (reportKey) => {

    const file = `${NR_CONTENT_DIR}/${reportKey}.yml`;
    if (!existsSync(file)) throw new Error(`no ${file}`);

    const doc = loadYaml(readFileSync(file, "utf8"));
    if (!doc || !Array.isArray(doc.report_topics)) throw new Error(`${file} has no report_topics`);

    const byTopic = new Map();
    for (const topic of doc.report_topics) {
        byTopic.set(topic.report_topic, (topic.MeasureID ?? []).map(Number));
    }

    return byTopic;

};

const fetchReportPayload = async (base, reportKey, topic) => {

    const url = base + REPORT_DIR + encodeURIComponent(`${reportKey} ${topic}`) + ".json";
    const res = await fetch(url);

    if (!res.ok) return { url, rows: null, status: res.status };

    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error(`${url} parsed as ${typeof rows}, not an array of report rows`);

    return { url, rows, status: 200 };

};

// The 42 UHF42 areas, read from GeoLookup so the harness supplies geoIds from the same
// place a page would, not from the payload it is checking.
const fetchAreas = async (base) => {

    const res = await fetch(base + "geography/GeoLookup.json");
    if (!res.ok) throw new Error(`HTTP ${res.status} from GeoLookup.json`);

    const columns = await res.json();
    const out = [];

    for (let i = 0; i < columns.GeoID.length; i++) {
        if (columns.GeoType[i] === GEOTYPE) out.push({ GeoID: columns.GeoID[i], Name: columns.Name[i] });
    }

    if (!out.length) throw new Error(`GeoLookup.json carries no ${GEOTYPE} rows`);

    return out;

};

// ----------------------------------------------------------------------- //
// the comparison
// ----------------------------------------------------------------------- //

// A tertile can differ for a reason no implementation can fix: NTILE(3) splits by
// POSITION, so a run of tied values straddling a boundary comes out in two tertiles,
// and which area lands on which side is not a function of any field in the data — the
// published payloads order such ties inconsistently between measures. Those rows are
// counted separately so the harness reports a real difference rather than hiding one:
// a `data_value_rank` mismatch on a row whose value is NOT tied across a boundary is a
// failure, and this is exactly the set that is not.
const straddlingTieValues = (truthRows) => {

    const byValue = new Map();

    for (const row of truthRows) {
        const value = row.unmodified_data_value_geo_entity;
        if (value === null || value === undefined) continue;
        if (!byValue.has(value)) byValue.set(value, new Set());
        byValue.get(value).add(String(row.data_value_rank));
    }

    return new Set([...byValue.entries()].filter(([, ranks]) => ranks.size > 1).map(([value]) => value));

};

// Seven rows where the published payload rounds an exact half-way value the other way,
// and no single rule reproduces both regimes.
//
// EHDP-data's `Value` column carries the unrounded figure and every published number is
// that value at one decimal. Rounding the stored double — `Number(v.toFixed(1))` — agrees
// with the payload on 2,598 of the 2,603 area values in these 22 sections, and rounding
// `DisplayValue` instead agrees on 2,171, so the first is the rule. The residual is not
// scattered: it clusters on measures 687, 755 and 645, where the payload instead matches
// DisplayValue, against 221 and 1128 where DisplayValue is the one that disagrees — two
// upstream pipelines rounding differently, on values like 99.95 and 2.05 whose binary
// representation falls the opposite side of the half `[all verified 2026-09-11]`.
//
// Listed row by row rather than tolerated as a count, and an entry that stops being
// needed fails the run: an allowance nobody notices has gone stale is how a real
// regression gets absorbed into "the known seven".
const KNOWN_DIFFERENCES = [
    { field: "unmodified_data_value_geo_entity", measureId: 687, area: "Bensonhurst - Bay Ridge", note: "Value 53.35" },
    { field: "unmodified_data_value_geo_entity", measureId: 687, area: "Upper East Side", note: "Value 28.05" },
    { field: "unmodified_data_value_geo_entity", measureId: 687, area: "Rockaways", note: "Value 99.95" },
    { field: "unmodified_data_value_geo_entity", measureId: 755, area: "Long Island City - Astoria", note: "Value 12.55" },
    { field: "unmodified_data_value_geo_entity", measureId: 645, area: "Fordham - Bronx Pk", note: "Value 2.05" },
    { field: "data_value_geo_entity", measureId: 1128, area: "Bedford Stuyvesant - Crown Heights", note: "Value 22.05; here the payload's own string disagrees with DisplayValue" },
    { field: "data_value_geo_entity", measureId: 1128, area: "Bayside - Little Neck", note: "Value 2.45; same" }
];

const knownDifferenceKey = (field, measureId, area) => `${field}|${measureId}|${area}`;

const KNOWN_KEYS = new Set(KNOWN_DIFFERENCES.map(d => knownDifferenceKey(d.field, d.measureId, d.area)));

const compare = (built, truthRows, seenKnown) => {

    const truthByKey = new Map(truthRows.map(row => [`${row.MeasureID}|${row.geo_entity_id}`, row]));
    const straddling = straddlingTieValues(truthRows);

    const result = { compared: 0, mismatches: [], tieExplained: 0, missing: [], errored: [] };

    for (const row of built) {

        if (row.error) {
            result.errored.push(`${row.MeasureID}: ${row.error}`);
            continue;
        }

        const truth = truthByKey.get(`${row.MeasureID}|${row.geo_entity_id}`);

        if (!truth) {
            result.missing.push(`${row.MeasureID}|${row.geo_entity_id}`);
            continue;
        }

        for (const [field, fromRow, fromTruth] of COMPARED) {

            result.compared++;

            const mine = fromRow(row);
            const theirs = fromTruth(truth);

            if (String(mine) === String(theirs)) continue;

            if (field === "data_value_rank" && straddling.has(truth.unmodified_data_value_geo_entity)) {
                result.tieExplained++;
                continue;
            }

            const knownKey = knownDifferenceKey(field, row.MeasureID, truth.neighborhood);

            if (KNOWN_KEYS.has(knownKey)) {
                seenKnown.add(knownKey);
                continue;
            }

            result.mismatches.push(`${field} ${row.MeasureID}/${truth.neighborhood}: got ${JSON.stringify(mine)}, published ${JSON.stringify(theirs)}`);

        }

    }

    return result;

};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const runReport = async (buildRows, base, dataRepo, dataBranch, reportKey, areas, seenKnown) => {

    const byTopic = readMeasureIds(reportKey);
    const totals = { compared: 0, mismatches: [], tieExplained: 0, missing: [], errored: [], sections: 0, skipped: [] };

    for (const [topic, measureIds] of byTopic) {

        const payload = await fetchReportPayload(base, reportKey, topic);

        // A section with no published payload has no ground truth, so it is named and
        // skipped. Silently passing it would let the harness's coverage shrink with
        // EHDP-data and still report green.
        if (payload.rows === null) {
            totals.skipped.push(`${topic} (HTTP ${payload.status})`);
            continue;
        }

        const specs = measureIds.map(id => ({ MeasureID: id, geotype: GEOTYPE }));
        const built = [];

        for (const area of areas) {
            const rows = await buildRows({
                measures: specs,
                geoIds: { [GEOTYPE]: area.GeoID },
                dataRepo,
                dataBranch
            });
            built.push(...rows);
        }

        const result = compare(built, payload.rows, seenKnown);

        totals.sections++;
        totals.compared += result.compared;
        totals.tieExplained += result.tieExplained;
        totals.mismatches.push(...result.mismatches.map(m => `${topic}: ${m}`));
        totals.missing.push(...result.missing.map(m => `${topic}: ${m}`));
        totals.errored.push(...[...new Set(result.errored)].map(m => `${topic}: ${m}`));

    }

    return totals;

};

const main = async () => {

    const { reports, environment } = parseArgs(process.argv.slice(2));

    if (!existsSync(MODULE_FILE)) {
        console.error(`\n${MODULE_FILE} is missing — nothing to check.\n`);
        return 2;
    }

    const config = readSiteConfig(environment);
    if (!config) {
        console.error(`\nCould not read data_repo / data_branch from the merged Hugo config for "${environment}".\n`);
        return 2;
    }

    const { dataRepo, dataBranch } = config;
    const base = dataRepo + dataBranch + "/";

    console.log(`\nEnvironment: ${environment} — EHDP-data ${dataBranch}`);
    console.log(`Module under test: ${MODULE_FILE}`);
    console.log(`Geography: ${GEOTYPE}\n`);

    const buildRows = loadModule(null);
    const areas = await fetchAreas(base);

    console.log(`${areas.length} ${GEOTYPE} areas from GeoLookup.json\n`);

    let compared = 0, tieExplained = 0;
    const mismatches = [], missing = [], errored = [], skipped = [];
    const seenKnown = new Set();

    for (const reportKey of reports) {
        const totals = await runReport(buildRows, base, dataRepo, dataBranch, reportKey, areas, seenKnown);
        compared += totals.compared;
        tieExplained += totals.tieExplained;
        mismatches.push(...totals.mismatches.map(m => `${reportKey} / ${m}`));
        missing.push(...totals.missing.map(m => `${reportKey} / ${m}`));
        errored.push(...totals.errored.map(m => `${reportKey} / ${m}`));
        skipped.push(...totals.skipped.map(m => `${reportKey} / ${m}`));
        console.log(`${reportKey}: ${totals.sections} sections, ${totals.compared} field comparisons, ${totals.mismatches.length} mismatched`);
    }

    // Only meaningful over the full corpus — a single report cannot reach entries filed
    // against another, so a partial run would report every one of them as stale.
    const fullRun = reports.length === REPORTS.length;
    const staleKnown = fullRun ? KNOWN_DIFFERENCES.filter(d => !seenKnown.has(knownDifferenceKey(d.field, d.measureId, d.area))) : [];

    console.log(`\n${compared} field comparisons, ${mismatches.length} mismatched.`);
    console.log(`${seenKnown.size} of ${KNOWN_DIFFERENCES.length} known upstream rounding difference(s) reached and allowed.`);
    console.log(`${tieExplained} tertile difference(s) not counted: the value is tied with a row on the other side of a tertile boundary, where the published order is not a function of any field in the data.`);

    if (errored.length) {
        console.log(`\n${errored.length} measure(s) could not be computed — the published payload carries them, EHDP-data does not export them as indicators:`);
        for (const line of errored) console.log(`  ${line}`);
    }

    if (skipped.length) {
        console.log(`\n${skipped.length} section(s) skipped, no published payload to compare against:`);
        for (const line of skipped) console.log(`  ${line}`);
    }

    console.log("\nNot compared, no upstream source exists:");
    for (const line of EXPECTED_ABSENT) console.log(`  ${line}`);

    // ----- controls ----- //

    // A parity run that finds nothing and a harness that never reached the module under
    // test print the same zero. So the real file is re-evaluated with one rule broken at
    // a time and the same comparison re-run; each arm must produce mismatches.
    //
    // Three arms rather than one, because one arm only proves the rule it perturbs is
    // live. The first version of this harness had a single arm that removed NTILE's
    // remainder distribution — and every NR section has exactly 42 areas, which divides
    // by 3, so that branch never executes and the control returned 0 against a run that
    // was in fact correct. A control the data cannot see reports the treatment arm's own
    // number; the fix is to perturb something that must move.
    const CONTROLS = [
        {
            name: "tertile boundary shifted by one",
            patch: src => src.replace(
                "    const firstSize = base + (remainder > 0 ? 1 : 0);",
                "    const firstSize = base + 1;"
            )
        },
        {
            name: "rounding removed (rank and compare the unrounded Value)",
            patch: src => src.replace(
                "const reportDataRoundToPublished = value => Number(Number(value).toFixed(1));",
                "const reportDataRoundToPublished = value => Number(value);"
            )
        },
        {
            name: "rankReverse forced off",
            patch: src => src.replace(
                "const reportDataRankReverse = (measure, geoType, declared) => {",
                "const reportDataRankReverse = (measure, geoType, declared) => { if (true) return false;"
            )
        }
    ];

    const controlResults = [];

    for (const control of CONTROLS) {
        const patched = loadModule(control.patch);
        const totals = await runReport(patched, base, dataRepo, dataBranch, reports[0], areas, new Set());
        controlResults.push({ name: control.name, fired: totals.mismatches.length });
        console.log(`Control — ${control.name}: ${totals.mismatches.length} mismatches`);
    }

    const dead = controlResults.filter(c => c.fired === 0);

    if (dead.length) {
        console.error("\nCONTROL FAILED: these deliberately wrong rules produced no mismatch, so this run's result is not evidence:");
        for (const c of dead) console.error(`  ${c.name}`);
        console.error("");
        return 2;
    }

    if (staleKnown.length) {
        console.error(`\n${staleKnown.length} allowed difference(s) no longer occur — EHDP-data has moved, so delete these entries rather than leave them absorbing a future regression:\n`);
        for (const d of staleKnown) console.error(`  ${d.field} ${d.measureId}/${d.area} (${d.note})`);
        console.error("");
        return 1;
    }

    if (mismatches.length) {
        console.error(`\n${mismatches.length} field(s) differ from the published payload:\n`);
        for (const line of mismatches.slice(0, 40)) console.error(`  ${line}`);
        if (mismatches.length > 40) console.error(`  … and ${mismatches.length - 40} more`);
        console.error("");
        return 1;
    }

    if (missing.length) {
        console.error(`\n${missing.length} computed row(s) have no published counterpart:\n`);
        for (const line of missing.slice(0, 20)) console.error(`  ${line}`);
        console.error("");
        return 1;
    }

    console.log("\nParity holds.\n");
    return 0;

};

// process.exit() after a fetch() aborts on a libuv assertion on Windows and returns 127,
// so the exit code a caller reads is not the one this script decided on. Setting
// process.exitCode lets Node tear its sockets down first.
main()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
        console.error(`\n${error.message}\n`);
        process.exitCode = 2;
    });
