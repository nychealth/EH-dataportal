// ======================================================================= //
// ndhr-indicator-availability.mjs
// ======================================================================= //

// Which of the 28 NDHR indicators can actually be published at community-district
// geography, read from EHDP-data rather than asserted.
//
// documents/ndhr-prototype-plan-2026-09-10.md rests on a table of 18 renderable
// indicators and 10 that are not — 1 deferred for want of PUMA2020 data, 5 that
// exist only at UHF42, and 4 absent from EHDP-data entirely. (It read 15 and 13
// until DECIDED-6 brought the PUMA crosswalk forward and DECIDED-10 chose PUMA2020
// as the geography.) That table was produced by a throwaway script,
// and EHDP-data adds indicators and geotypes over time — so the table decays with
// nothing to announce it, and the plan's scope decision (DECIDED-1) decays with it.
// This makes it re-derivable, and `check` makes the decay visible at the moment it
// happens rather than at the moment someone acts on a stale row.
//
// Usage — POSITIONAL arguments only:
//   node scripts/ndhr-indicator-availability.mjs                    print the table
//   node scripts/ndhr-indicator-availability.mjs baseline           write the baseline
//   node scripts/ndhr-indicator-availability.mjs check              diff against it,
//                                                                   and validate the
//                                                                   Task 3 content YAML
//   node scripts/ndhr-indicator-availability.mjs check dev_stage    ...on another environment
//   npm run ndhr:availability check
//
// A flag would not survive npm intact: PowerShell eats the `--` in
// `npm run x -- --flag` and npm eats the flag NAME, so `--check` arrives as no
// argument at all — which here would print the table and exit 0, reading exactly
// like a check that passed. So any argument starting with `-` is refused outright.
//
// Exit codes: 0 nothing moved; 1 availability differs from the baseline;
// 2 the run could not be made, or a control failed.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
// js-yaml 5.x ships named ESM exports and no default, so `import yaml from` fails at load.
import { load as loadYaml } from "js-yaml";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const HUGO_CLI = "node_modules/hugo-extended/lib/cli.js";
const BASELINE_FILE = "scripts/ndhr-indicator-availability-baseline.json";
const METADATA_PATH = "indicators/metadata/metadata.json";

// The Task 3 content files this script also validates, in `check` mode.
const CATEGORIES_FILE = "data/globals/NDHR_categories.yml";
const CONTENT_DIR = "data/globals/NDHR_content";

// `production` rather than `development`: same data branch and data repo, but it is
// the environment whose name says which EHDP-data branch this is about. The two
// `local_*` environments point data_repo at http://localhost and are not fetchable
// from here, which is why the environment is a deliberate argument and not inferred
// from whatever server happens to be running.
const DEFAULT_ENV = "production";

// The 28 indicators named across the two NDHR source documents.
//
// `label` is the source document's wording and is the diff key — it is ours, so it
// is stable across anything EHDP-data does. `metadataName` is the exact
// `IndicatorName` string in EHDP-data metadata, or null where the document names
// something EHDP-data does not carry under any name.
//
// Exact whole-string matching is load-bearing, not fussiness. Two of these names
// are prefixes of a DIFFERENT indicator: "Violence-related emergency department
// visits (all ages)" sits beside "(ages 15-34)", and "Asthma emergency department
// visits (age 5 to 17)" beside "..., by NTA". A prefix match resolves either to the
// wrong IndicatorID and reports the wrong geotypes with nothing visibly wrong.
const NDHR_INDICATORS = [

    // Climate & Active Design
    { category: "Climate & Active Design", label: "Walking distance to a park", metadataName: "Walking distance to a park" },
    { category: "Climate & Active Design", label: "Walking distance to a subway station", metadataName: "Walking distance to a subway station" },
    { category: "Climate & Active Design", label: "Walkability index", metadataName: "Walkability index" },
    { category: "Climate & Active Design", label: "Heat Vulnerability Index", metadataName: "Heat vulnerability index" },
    { category: "Climate & Active Design", label: "Households with air conditioning", metadataName: "Household air conditioning" },
    { category: "Climate & Active Design", label: "Households w/ electric medical equipment", metadataName: "Households using electric medical equipment" },

    // Housing
    { category: "Housing", label: "Household crowding", metadataName: "Household crowding" },
    { category: "Housing", label: "Homes with 3+ housing problems", metadataName: "Homes with 3+ housing problems" },
    { category: "Housing", label: "Homes with cockroaches", metadataName: "Homes with cockroaches" },
    { category: "Housing", label: "Rent burdened households", metadataName: "Rent-burdened households" },
    { category: "Housing", label: "Independent living difficulty", metadataName: "Independent living difficulty (adults)" },
    { category: "Housing", label: "Evictions (court-ordered)", metadataName: "Evictions (court-ordered)" },

    // Neighborhood Conditions
    { category: "Neighborhood Conditions", label: "Vegetative cover", metadataName: "Vegetative cover" },
    { category: "Neighborhood Conditions", label: "Violence-related ED visits (all ages)", metadataName: "Violence-related emergency department visits (all ages)" },
    { category: "Neighborhood Conditions", label: "Perception of neighborhood safety", metadataName: "Perception of neighborhood safety" },
    { category: "Neighborhood Conditions", label: "Public bathroom availability", metadataName: "Public bathroom availability" },
    { category: "Neighborhood Conditions", label: "Unhealthy food access", metadataName: "Unhealthy food access" },
    { category: "Neighborhood Conditions", label: "Displacement risk", metadataName: null },
    { category: "Neighborhood Conditions", label: "School absenteeism", metadataName: "School absenteeism" },
    { category: "Neighborhood Conditions", label: "Litter basket coverage", metadataName: "Litter basket coverage" },
    { category: "Neighborhood Conditions", label: "Social cohesion", metadataName: null },

    // Health Outcomes & Care Access
    { category: "Health Outcomes & Care Access", label: "Maternal mortality", metadataName: null },
    { category: "Health Outcomes & Care Access", label: "Heat stress: yearly ED visits", metadataName: "Heat stress: yearly emergency department visits" },
    { category: "Health Outcomes & Care Access", label: "Premature mortality", metadataName: "Premature mortality" },
    { category: "Health Outcomes & Care Access", label: "Psychiatric hospitalizations", metadataName: "Psychiatric hospitalizations (adults)" },
    { category: "Health Outcomes & Care Access", label: "Premature mortality attributed to drug use", metadataName: null },
    { category: "Health Outcomes & Care Access", label: "Asthma ED visits (age 5 to 17)", metadataName: "Asthma emergency department visits (age 5 to 17)" },
    { category: "Health Outcomes & Care Access", label: "Health insurance (adults)", metadataName: "Health insurance (adults)" }

];

// CD is the page geography and CDTA2020 joins it 59-to-59 (plan DECIDED-2), so both
// are renderable. PUMA2010/PUMA2020/Subboro do not nest into CDs, so they stay a
// bucket of their own — but no longer an unrenderable one: DECIDED-6 published the
// crosswalk and DECIDED-10 picked PUMA2020, so three of this bucket's rows are in
// the prototype. Which ones is a decision, recorded per indicator as `geotype` in
// data/globals/NDHR_content/ and checked there, not derivable from this bucket.
const CD_FAMILY = ["CD", "CDTA2020"];
const PUMA_FAMILY = ["PUMA2010", "PUMA2020", "Subboro"];

const BUCKETS = ["cd-family", "puma-subboro", "uhf42-only", "other-geography", "not-found"];

// Two arms, because a single one leaves the other explanation standing. A fetch that
// silently returned an empty or non-indicator document would report EVERY row
// "not-found" — the 2143 arm catches that. Bucket logic that read AvailableGeoTypes
// as always-present would report every row "cd-family" — only the 2133 arm catches
// that, and 2133 is a real UHF42-only indicator, not a synthetic case.
const CONTROLS = [
    { indicatorId: 2143, label: "Vegetative cover", expectBucket: "cd-family", expectGeo: "CD", present: true },
    { indicatorId: 2133, label: "Walkability index", expectBucket: "uhf42-only", expectGeo: "CD", present: false }
];

// ----------------------------------------------------------------------- //
// arguments
// ----------------------------------------------------------------------- //

const MODES = ["print", "baseline", "check"];

const usage = (why) => {
    console.error(`\n${why}\n`);
    console.error("Usage — positional arguments only, no flags:");
    console.error("  node scripts/ndhr-indicator-availability.mjs [print|baseline|check] [environment]");
    console.error(`\nModes: ${MODES.join(", ")} (default: print)`);
    console.error(`Environment: any directory under config/ (default: ${DEFAULT_ENV})\n`);
    // The one safe process.exit() in this file: argument parsing runs before the fetch,
    // so there is no socket teardown to race. See the note beside the main() call.
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

// The data repo and branch come from the merged Hugo config rather than from a
// constant, so this script fetches exactly what a build of that environment would.
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

// Asserts the SHAPE, not merely that parsing returned. A 200 carrying an error page,
// or a document double-encoded as a JSON string literal, both parse without throwing
// and would otherwise read as "no indicators available".
const fetchMetadata = async (url) => {

    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);

    const body = await res.json();
    if (!Array.isArray(body)) throw new Error(`${url} parsed as ${typeof body}, not an array of indicators`);
    if (body.length === 0) throw new Error(`${url} parsed as an empty array`);
    if (!("IndicatorID" in body[0]) || !("IndicatorName" in body[0])) {
        throw new Error(`${url} rows carry ${Object.keys(body[0]).join(", ")} — not indicator records`);
    }

    return body;

};

// ----------------------------------------------------------------------- //
// the sweep
// ----------------------------------------------------------------------- //

const bucketFor = (geoTypes) => {
    if (CD_FAMILY.some((g) => geoTypes.includes(g))) return "cd-family";
    if (PUMA_FAMILY.some((g) => geoTypes.includes(g))) return "puma-subboro";
    if (geoTypes.includes("UHF42")) return "uhf42-only";
    return "other-geography";
};

// Case-insensitive whole-string match. Case-only renames upstream do not break the
// join — IndicatorID is what the site uses — but they DO change the recorded
// `metadataName`, so `check` still surfaces one instead of failing to resolve.
const sweep = (metadata) => {

    const byName = new Map();
    const collisions = [];

    for (const row of metadata) {
        const key = (row.IndicatorName ?? "").toLowerCase();
        if (byName.has(key)) collisions.push(row.IndicatorName);
        byName.set(key, row);
    }

    // A duplicated name makes "exact match" ambiguous and silently picks the last one.
    if (collisions.length) {
        throw new Error(`Duplicate IndicatorName in metadata, so an exact match is ambiguous: ${collisions.join("; ")}`);
    }

    return NDHR_INDICATORS.map(({ category, label, metadataName }) => {

        const row = metadataName === null ? undefined : byName.get(metadataName.toLowerCase());

        if (!row) {
            return { category, label, soughtName: metadataName, metadataName: null, indicatorId: null, geoTypes: [], bucket: "not-found" };
        }

        const geoTypes = [...new Set((row.Measures ?? []).flatMap((m) => m.AvailableGeoTypes ?? []))].sort();

        return {
            category,
            label,
            soughtName: metadataName,
            metadataName: row.IndicatorName,
            indicatorId: row.IndicatorID,
            geoTypes,
            bucket: bucketFor(geoTypes)
        };

    });

};

// ----------------------------------------------------------------------- //
// controls
// ----------------------------------------------------------------------- //

const runControls = (rows) => {

    const failures = [];

    for (const c of CONTROLS) {

        const row = rows.find((r) => r.indicatorId === c.indicatorId);

        if (!row) {
            failures.push(`${c.indicatorId} (${c.label}) did not resolve at all`);
            continue;
        }
        if (row.bucket !== c.expectBucket) {
            failures.push(`${c.indicatorId} (${c.label}) bucketed "${row.bucket}", expected "${c.expectBucket}"`);
        }
        if (row.geoTypes.includes(c.expectGeo) !== c.present) {
            const had = row.geoTypes.includes(c.expectGeo) ? "reports" : "does not report";
            const want = c.present ? "should" : "should not";
            failures.push(`${c.indicatorId} (${c.label}) ${had} ${c.expectGeo} and ${want}`);
        }

    }

    return failures;

};

// ----------------------------------------------------------------------- //
// the Task 3 content files
// ----------------------------------------------------------------------- //

// Reads data/globals/NDHR_categories.yml and data/globals/NDHR_content/*.yml.
//
// Throws rather than returning an empty result when the files cannot be read: a
// validator that finds nothing reports zero failures, which is indistinguishable
// from a clean pass. The caller turns a throw into exit 2 ("the run could not be
// made") and a returned failure list into exit 1 ("something disagrees").
const readContent = () => {

    if (!existsSync(CATEGORIES_FILE)) throw new Error(`no ${CATEGORIES_FILE}`);
    if (!existsSync(CONTENT_DIR)) throw new Error(`no ${CONTENT_DIR}/`);

    const categories = loadYaml(readFileSync(CATEGORIES_FILE, "utf8"));
    if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error(`${CATEGORIES_FILE} did not parse as a non-empty array`);
    }

    const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".yml"));
    if (files.length === 0) throw new Error(`${CONTENT_DIR}/ holds no .yml files`);

    const content = new Map();
    for (const f of files) {
        const doc = loadYaml(readFileSync(`${CONTENT_DIR}/${f}`, "utf8"));
        if (!doc || !Array.isArray(doc.measures)) {
            throw new Error(`${CONTENT_DIR}/${f} has no \`measures\` array`);
        }
        content.set(f.replace(/\.yml$/, ""), doc);
    }

    return { categories, content };

};

// Every row in a content file must name a MeasureID that exists in metadata, sits
// under the IndicatorID the row also names, carries the MeasureName the row claims,
// and publishes at the geography the row reads it at.
//
// Checked against METADATA, not against the baseline, and the baseline could not do
// this job. Its `geoTypes` is the union across an indicator's measures, so a row
// declaring a geotype that only a SIBLING measure publishes at would pass — and
// those siblings are exactly what a per-measure spec exists to tell apart. Three of
// the eighteen indicators have measures that disagree on geography: 2185, 107 and 45
// `[verified 2026-09-11: per-measure AvailableGeoTypes against the indicator union.
// "Households with AC, Number" (782) publishes at Subboro and NOT PUMA2020, while
// its indicator's union includes PUMA2020, so that row would pass a baseline check
// and produce an empty series]`.
//
// This also outgrew the plan's wording for the assertion, "...present in the
// availability baseline with a CD-family geotype", which DECIDED-10 outdated —
// three of the eighteen are read at PUMA2020, which is not CD-family.
const validateContent = ({ categories, content }, metadata) => {

    const failures = [];

    // MeasureID -> the measure and its parent indicator. MeasureIDs are unique
    // across all of EHDP-data, which is what makes them the join key.
    const byMeasure = new Map();
    for (const ind of metadata) {
        for (const ms of ind.Measures || []) byMeasure.set(ms.MeasureID, { ms, ind });
    }

    const declaredKeys = categories.map((c) => c.key);
    for (const key of declaredKeys) {
        if (!content.has(key)) failures.push(`${CATEGORIES_FILE} declares "${key}" with no ${CONTENT_DIR}/${key}.yml`);
    }
    for (const key of content.keys()) {
        if (!declaredKeys.includes(key)) failures.push(`${CONTENT_DIR}/${key}.yml has no entry in ${CATEGORIES_FILE}`);
    }

    // One measure on two pages would be a content mistake, not a design: each row
    // carries its own strategy text, and a duplicate silently forks it.
    const seen = new Map();

    for (const [key, doc] of content) {

        const rows = doc.measures;

        // DECIDED-7's requirement, made checkable. An absent empty_state on an empty
        // category is exactly the case a reader cannot tell from a broken template.
        if (rows.length === 0 && !doc.empty_state) {
            failures.push(`${key}.yml declares no measures and carries no empty_state`);
        }
        if (rows.length > 0 && doc.empty_state) {
            failures.push(`${key}.yml declares ${rows.length} measure(s) and an empty_state, which cannot both apply`);
        }

        for (const row of rows) {

            const where = `${key}.yml / measure ${row.MeasureID}`;

            if (seen.has(row.MeasureID)) {
                failures.push(`${where} is already declared in ${seen.get(row.MeasureID)}.yml`);
            }
            seen.set(row.MeasureID, key);

            if (!row.indicator_short_name) failures.push(`${where} has no indicator_short_name`);
            if (!row.strategy) failures.push(`${where} has no strategy`);

            const found = byMeasure.get(row.MeasureID);
            if (!found) {
                failures.push(`${where} is in no measure of the metadata`);
                continue;
            }
            if (found.ind.IndicatorID !== row.IndicatorID) {
                failures.push(`${where} is declared under indicator ${row.IndicatorID}, metadata puts it under ${found.ind.IndicatorID} (${found.ind.IndicatorName})`);
            }
            if (found.ms.MeasureName !== row.MeasureName) {
                failures.push(`${where} names it "${row.MeasureName}", metadata "${found.ms.MeasureName}"`);
            }
            if (!found.ms.AvailableGeoTypes.includes(row.geotype)) {
                failures.push(`${where} reads at ${row.geotype}, which this measure does not publish (${found.ms.AvailableGeoTypes.join(", ")})`);
            }

        }

    }

    return { failures, categoryCount: categories.length, measureCount: seen.size };

};

// ----------------------------------------------------------------------- //
// output
// ----------------------------------------------------------------------- //

const pad = (s, n) => String(s).padEnd(n);

const printTable = (capture) => {

    const rows = capture.rows;
    const widths = {
        label: Math.max(14, ...rows.map((r) => r.label.length)),
        bucket: Math.max(6, ...rows.map((r) => r.bucket.length))
    };

    let lastCategory = null;

    for (const r of rows) {
        if (r.category !== lastCategory) {
            console.log(`\n${r.category}`);
            lastCategory = r.category;
        }
        const id = r.indicatorId === null ? "--" : String(r.indicatorId);
        const geo = r.geoTypes.length ? r.geoTypes.join(", ") : "(none)";
        console.log(`  ${pad(r.label, widths.label)}  ${id.padStart(5)}  ${pad(r.bucket, widths.bucket)}  ${geo}`);
    }

    console.log("");
    for (const b of BUCKETS) {
        const n = rows.filter((r) => r.bucket === b).length;
        if (n) console.log(`  ${pad(b, 16)} ${String(n).padStart(3)}`);
    }
    console.log(`  ${pad("TOTAL", 16)} ${String(rows.length).padStart(3)}\n`);

};

// Compares `rows` only. capturedAt and gitHead describe the capture, not the data,
// and comparing them would report a difference on every single run.
const diff = (baseline, current) => {

    const lines = [];

    const key = (r) => `${r.category} / ${r.label}`;
    const before = new Map(baseline.rows.map((r) => [key(r), r]));
    const after = new Map(current.rows.map((r) => [key(r), r]));

    for (const k of before.keys()) if (!after.has(k)) lines.push(`  - ${k}: in the baseline, not in the indicator list any more`);
    for (const k of after.keys()) if (!before.has(k)) lines.push(`  + ${k}: in the indicator list, not in the baseline`);

    for (const [k, b] of before) {

        const a = after.get(k);
        if (!a) continue;

        if (b.indicatorId !== a.indicatorId) lines.push(`  ~ ${k}: IndicatorID ${b.indicatorId} -> ${a.indicatorId}`);
        if (b.metadataName !== a.metadataName) lines.push(`  ~ ${k}: IndicatorName ${JSON.stringify(b.metadataName)} -> ${JSON.stringify(a.metadataName)}`);
        if (b.bucket !== a.bucket) lines.push(`  ~ ${k}: bucket ${b.bucket} -> ${a.bucket}`);

        const bg = b.geoTypes.join(", ");
        const ag = a.geoTypes.join(", ");
        if (bg !== ag) lines.push(`  ~ ${k}: geotypes [${bg}] -> [${ag}]`);

    }

    return lines;

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

    const url = `${site.dataRepo}${site.dataBranch}/${METADATA_PATH}`;
    console.log(`Environment: ${environment}   EHDP-data branch: ${site.dataBranch}`);
    console.log(`Metadata: ${url}`);

    let metadata;
    try {
        metadata = await fetchMetadata(url);
    } catch (err) {
        console.error(`\nREFUSING TO RUN — ${err.message}\n`);
        return 2;
    }

    let rows;
    try {
        rows = sweep(metadata);
    } catch (err) {
        console.error(`\nREFUSING TO RUN — ${err.message}\n`);
        return 2;
    }

    // Controls gate every mode, `baseline` included: a baseline written from a broken
    // sweep looks exactly like a real one and every later check passes against it.
    const controlFailures = runControls(rows);
    console.log(`Indicators in metadata: ${metadata.length}   controls: ${controlFailures.length ? "FAILED" : `${CONTROLS.length} of ${CONTROLS.length} passed`}`);

    if (controlFailures.length) {
        console.error("\nCONTROL FAILURE — the sweep cannot be trusted, so nothing is reported:");
        for (const f of controlFailures) console.error(`  ${f}`);
        console.error("");
        return 2;
    }

    const capture = {
        capturedAt: new Date().toISOString(),
        gitHead: gitHead(),
        environment,
        dataBranch: site.dataBranch,
        metadataUrl: url,
        indicatorCount: metadata.length,
        rows
    };

    if (mode === "print") {
        printTable(capture);
        return 0;
    }

    if (mode === "baseline") {
        printTable(capture);
        writeFileSync(BASELINE_FILE, `${JSON.stringify(capture, null, 4)}\n`, "utf8");
        console.log(`Wrote ${BASELINE_FILE} (${rows.length} rows, EHDP-data ${site.dataBranch}).\n`);
        return 0;
    }

    // mode === "check"
    if (!existsSync(BASELINE_FILE)) {
        console.error(`\nNO BASELINE at ${BASELINE_FILE}. Run: node scripts/ndhr-indicator-availability.mjs baseline\n`);
        return 2;
    }

    const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));

    // Staging and production carry different indicator sets, so a cross-branch diff
    // reports real differences that mean nothing about whether anything moved.
    if (baseline.dataBranch !== site.dataBranch) {
        console.error(`\nREFUSING TO CHECK — the baseline is EHDP-data "${baseline.dataBranch}", this run is "${site.dataBranch}".`);
        console.error(`Run against an environment on ${baseline.dataBranch}, or re-baseline deliberately.\n`);
        return 2;
    }

    // Checked against this run's metadata rather than the baseline: the baseline
    // records indicator-level geotype unions, and a per-measure spec needs the
    // measure's own AvailableGeoTypes. The branch refusal above already guarantees
    // this metadata and the baseline describe the same EHDP-data branch.
    let content;
    try {
        content = validateContent(readContent(), metadata);
    } catch (err) {
        console.error(`\nREFUSING TO CHECK the content files — ${err.message}.\n`);
        return 2;
    }

    console.log(`Content: ${content.categoryCount} categories, ${content.measureCount} measures — ${content.failures.length ? "FAILED" : "consistent with the metadata"}`);

    const lines = diff(baseline, capture);

    if (lines.length === 0 && content.failures.length === 0) {
        console.log(`\nUNCHANGED — all ${rows.length} rows match ${BASELINE_FILE} (captured ${baseline.capturedAt}).\n`);
        return 0;
    }

    if (content.failures.length) {
        console.log(`\nCONTENT DISAGREES WITH THE BASELINE — ${content.failures.length} problem(s) in ${CATEGORIES_FILE} and ${CONTENT_DIR}/:\n`);
        for (const f of content.failures) console.log(`  ${f}`);
    }

    if (lines.length) {
        console.log(`\nAVAILABILITY MOVED — ${lines.length} difference(s) against ${BASELINE_FILE} (captured ${baseline.capturedAt}):\n`);
        for (const l of lines) console.log(l);
        console.log("\nRead documents/ndhr-prototype-plan-2026-09-10.md §3 before re-baselining — DECIDED-1's scope rests on this table.");
    }

    console.log("");
    return 1;

}

// process.exit() is NOT usable here. On Node v24.0.1 / Windows, calling it after a
// fetch() aborts the process with `Assertion failed: !(handle->flags &
// UV_HANDLE_CLOSING), file src\win\async.c, line 76` and yields exit 127, so a
// caller reading exit codes sees a crash instead of the code this script meant.
// `[verified 2026-09-10: an 8-line repro — fetch, console.error, process.exit(2) —
// exits 127; the same script with process.exitCode = 2 exits 2, and faster.]`
// It is a race against the socket teardown, so the paths that do more work before
// exiting merely win it more often; they are not exempt.
process.exitCode = await main();
