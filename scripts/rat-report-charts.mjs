// Produce the rat report's 32 Datawrapper charts for a new reporting period.
//
//   node scripts/rat-report-charts.mjs pull              read the 32 live charts into scripts/rat-report-charts/
//   node scripts/rat-report-charts.mjs dryrun            report what push would do; writes nothing
//   node scripts/rat-report-charts.mjs push table-2-1    one slot, end to end
//   node scripts/rat-report-charts.mjs push              every slot not already done
//   node scripts/rat-report-charts.mjs repush table-2-1  correct a chart already made, in place
//   node scripts/rat-report-charts.mjs apply             rewrite index.md from the run's own map
//   node scripts/rat-report-charts.mjs folders           list folder ids, to feed the next line
//   node scripts/rat-report-charts.mjs makefolders 214216 2026   build this year's folder tree
//   node scripts/rat-report-charts.mjs move              file the new charts out of last year's tree
//
// WHY THIS EXISTS. The annual update duplicates 32 Datawrapper charts, pastes a
// new CSV into each, publishes each, and copies 32 new 5-character IDs into
// content/data-features/rat-report/index.md. Through the UI that is several
// hundred manual steps, and the characteristic mistake — a correct ID pasted
// into the wrong slot — renders a working page and throws nothing, so the smoke
// sweep passes it. See documents/rat-report-2026-update-plan-2026-09-14.md
// Task 3, which is also where the API reference citations live.
//
// THE ONE THING THIS MUST NEVER DO is write to a chart that a published page
// already renders. content/data-features/rat-report-archive/2025/ renders the
// same 32 IDs the live page does, so editing one in place would silently
// rewrite a published report. writeGuard() returns a wrapper around api() that
// reads the target chart id out of the request path and refuses it if anything
// under content/ renders it. Data upload, metadata patch and publish all go
// through that wrapper, so the guard sits above the whole write class rather
// than above the one call site whose mistake was imagined first. The single
// exception is POST /charts/{id}/copy, which names a published chart on purpose
// and creates a new one instead of modifying it.
//
// ARGUMENTS ARE POSITIONAL, and an argument starting with `-` is rejected
// rather than half-honoured. Measured 2026-08-26 (npm 11.4.1, PowerShell):
// `npm run x -- --flag value` reaches the script as argv ["value"] — PowerShell
// eats the `--` and npm eats the flag NAME, leaving a nameless positional. Same
// contract, and the same reason, as scripts/characterize-env.mjs.
//
// NO process.exit() ANYWHERE AFTER A fetch(). On Windows, Node aborts on a
// libuv assertion and returns 127 while every message the script printed stays
// correct — so the exit code the caller reads is not the one the run earned.
// main() returns its code and the caller sets process.exitCode instead.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const API = "https://api.datawrapper.de/v3";
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const PAGE = `${REPO_ROOT}/content/data-features/rat-report/index.md`;
const WORK = `${REPO_ROOT}/scripts/rat-report-charts`;
const MAP = `${WORK}/chart-map.json`;
const TITLES = `${WORK}/next-titles.json`;
const CHARTS = `${WORK}/current-charts.json`;
const FOLDERMAP = `${WORK}/folder-map.json`;
// Where repush saves each chart's metadata.data before clearing its inherited
// cell overrides. Tracked, because it is the only copy that survives the patch.
const CHANGES_BACKUP = `${WORK}/changes-backup`;

// Where each slot's chart belongs inside a year's folder. Read off the 2025
// tree with GET /folders and GET /folders/{id} on 2026-09-17, not guessed from
// the slot names: #1, #16 and #17 carry no table number, and #1 sits in the
// year folder itself rather than in any subfolder. 2024 and 2025 both have this
// shape, so it is the convention rather than one year's accident.
//
// Order does not matter here — the patterns are mutually exclusive, since
// "table-33-1" cannot match /^table-5?-/ and "table-5a-1" cannot match
// /^table-5-/ — but every slot must match exactly one, and makefolders refuses
// to run if any does not. A slot silently missing a rule would be left in the
// 2025 tree while the run reported success.
const FOLDER_FOR_SLOT = [
    [/^#1$/, null],
    [/^table-2-/, "Table 2"],
    [/^table-3-/, "Table 3"],
    [/^table-33-/, "Table 3a"],
    [/^#16$/, "Table 4"],
    [/^#17$/, "Table 4a"],
    [/^table-5-/, "Table 5"],
    [/^table-5a-/, "Table 5a"],
    [/^table-6-[1-4]$/, "Table 6"],

    // table-6-5 is the Totals panel and it sits in Table 6a, alone, where every
    // other group's Totals panel sits with its siblings `[verified 2026-09-17:
    // GET /folders/363793 holds table-6-1..4 and GET /folders/363795 holds
    // table-6-5; 2024 has the same 4/1 split]`. Mirrored here because two years
    // agree, but two years agreeing evidences a common origin and not
    // necessarily a decision — a copy-paste would look identical. Worth asking
    // whoever files these whether Table 6a is meant, rather than reading this
    // comment as authority that it is.
    [/^table-6-5$/, "Table 6a"],
];

// Conservative and deliberately not tuned: no rate limit was measured or read
// from the reference, so this is a low fixed floor between calls rather than a
// number chosen against a documented budget. A 429 is handled properly below.
const PAUSE_MS = 400;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const usage = (message) => {
    console.error(`${message}\n`);
    console.error("  node scripts/rat-report-charts.mjs pull");
    console.error("  node scripts/rat-report-charts.mjs dryrun");
    console.error("  node scripts/rat-report-charts.mjs push [slot]");
    console.error("  node scripts/rat-report-charts.mjs repush [slot]");
    console.error("  node scripts/rat-report-charts.mjs apply\n");
    console.error("pull    GET every live chart's data and metadata into scripts/rat-report-charts/.");
    console.error("        Read-only against Datawrapper. Also writes next-titles.json prefilled with");
    console.error("        the current titles, and will not overwrite it once it exists.");
    console.error("dryrun  Name every slot missing a next/ CSV or a title entry. One read call to");
    console.error("        check the token; no writes.");
    console.error("push    Copy, upload, retitle and publish. With a slot name, just that one — run");
    console.error("        a single slot first and look at it in the UI. Resumable: a slot already in");
    console.error("        chart-map.json is skipped, not copied again.");
    console.error("repush  Push a corrected CSV or title into a chart already made, in place. This is what");
    console.error("        push's skip makes necessary: after a number changes, push would report the slot");
    console.error("        already done and do nothing. Refuses any chart an archive renders.");
    console.error("apply   Swap each slot's ID in index.md and delete its TODO marker. Local only.");
    console.error("folders      List the folders you can reach, with their numeric ids. Needs folder:read.");
    console.error("makefolders  Create <year>'s folder tree under a parent folder id, mirroring last");
    console.error("             year's per-table shape, and write folder-map.json. Reuses a folder that");
    console.error("             already has the right name, so a re-run cannot duplicate the tree.");
    console.error("move         File the charts in chart-map.json where folder-map.json says. A copy");
    console.error("             lands in its SOURCE's folder, so without this the new charts sit under");
    console.error("             last year's tree. Filing only — the page references charts by id.");
    console.error("             Takes an explicit folder id and an optional slot as an escape hatch.\n");
    console.error("Needs DATAWRAPPER_TOKEN in the environment. Never put the token in a file here.");
    console.error("Flags are not accepted — npm and PowerShell mangle them.");
    return 2;
};

// ---------------------------------------------------------------------------
// Reading the page
// ---------------------------------------------------------------------------

// Derive slot -> embed ID from index.md itself, so there is no second copy of
// the mapping to drift out of date with the file it describes. This mirrors the
// Python probe in the plan document deliberately but is NOT shared with it: the
// proof diffs that probe's output against this script's map, and two artifacts
// produced by the same code would only ever prove self-consistency.
function readSlots(mdPath) {
    const lines = readFileSync(mdPath, "utf8").split("\n");

    // The commented-out "old by buttons incase needed?" block holds 5 embed IDs
    // that are not slots. A single-line `<!-- TODO 2026 chart -->` opens and
    // closes on one line, so it never starts a dead range.
    const dead = new Set();
    let open = null;
    lines.forEach((ln, i) => {
        const n = i + 1;
        if (ln.includes("<!--") && !ln.includes("-->")) {
            open = n;
        } else if (ln.includes("-->") && open !== null) {
            for (let k = open; k <= n; k++) dead.add(k);
            open = null;
        }
    });

    // A panel id claims the next embed it sees. The three stand-alone tables
    // have no switcher and so no panel id; they are named by ordinal position,
    // which is what keeps every row in the plan's 32-slot table diffable.
    const rows = [];
    let panel = null;
    lines.forEach((ln, i) => {
        const n = i + 1;
        if (dead.has(n)) return;
        const p = ln.match(/<div id="(table-[\w-]+)"/);
        if (p) panel = p[1];
        const e = ln.match(/datawrapper-vis-([A-Za-z0-9]+)/);
        if (e) {
            rows.push({ slot: panel, id: e[1], line: n });
            panel = null;
        }
    });
    rows.forEach((r, i) => {
        if (r.slot === null) r.slot = `#${i + 1}`;
    });

    const seen = rows.map((r) => r.id);
    const dupes = [...new Set(seen.filter((id) => seen.indexOf(id) !== seen.lastIndexOf(id)))];
    if (dupes.length) throw new Error(`index.md renders the same chart in two slots: ${dupes.join(", ")}`);

    return rows;
}

// Every .md under content/, for the protected-ID scan.
function markdownFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) out.push(...markdownFiles(full));
        else if (entry.name.endsWith(".md")) out.push(full);
    }
    return out;
}

// Every Datawrapper chart ID this repo's content renders, in all three embed
// forms the site actually uses:
//   dwcdn.net/<id>/embed.js        the rat report and the 2024 archive
//   dwcdn.net/<id>/embed.js?v=2    the 2023 archive's older script-injection form
//   {{< datawrapper src="<id>/1/"  the shortcode, used by 17 data-story files
// The third carries no dwcdn.net host in the content file, so a host-only
// pattern would miss every shortcode chart — which is exactly the kind of
// protected ID this set exists to hold.
// Returns id -> the set of files that render it, not a bare set of ids, because
// the two guards below need different answers from the same scan. push refuses
// every id anything renders; repush refuses only the ones rendered from
// somewhere OTHER than the live page, since a chart this tool created and only
// the live page shows is ours to correct.
function protectedIds() {
    const ids = new Map();
    const add = (id, file) => {
        if (!ids.has(id)) ids.set(id, new Set());
        ids.get(id).add(file);
    };
    for (const file of markdownFiles(`${REPO_ROOT}/content`)) {
        const text = readFileSync(file, "utf8");
        for (const m of text.matchAll(/dwcdn\.net\/([A-Za-z0-9]{5})\//g)) add(m[1], file);
        for (const m of text.matchAll(/datawrapper[^\n]*?src="([A-Za-z0-9]{5})/g)) add(m[1], file);
    }
    return ids;
}

// Shared by both guards. The scan is a null detector, so it validates itself
// before anything trusts it: one that silently found nothing would permit every
// write the guards exist to block, and would look identical to a clean pass.
function assertScanUsable(ids, slots) {
    const absent = slots.filter((s) => !ids.has(s.id)).map((s) => s.slot);
    if (absent.length || ids.size < slots.length) {
        throw new Error(
            `The protected-id scan cannot be trusted, so nothing will be written. It found ${ids.size} `
            + `chart id(s) across content/, and ${absent.length} of the live page's own slots are not among `
            + `them (${absent.join(", ") || "none"}). Expected at least ${slots.length}, including all of them.`,
        );
    }
}

// Returns the function every write must call first. The scan above is a null
// detector, so it validates itself before being trusted: a scan that silently
// found nothing — wrong path, changed markup — would permit every write this
// guard exists to block, and would look identical to a clean pass.
function writeGuard(slots) {
    const ids = protectedIds();
    assertScanUsable(ids, slots);
    console.log(`  guard: ${ids.size} published chart ids under content/ are off limits`);

    // Returned as a wrapper around api() rather than as a check to remember to
    // call, so that it cannot be bypassed by a later write forgetting it. It
    // reads the target id out of the path, which is the only thing every write
    // has in common — a guard that fires on one call site is a guard against
    // the one mistake already imagined.
    return function write(method, path, opts) {
        const target = path.match(/^\/charts\/([A-Za-z0-9]{5})/);
        if (target && ids.has(target[1])) {
            throw new Error(
                `Refusing ${method} ${path}: a tracked page under content/ renders chart ${target[1]}. Published `
                + `charts are never written to — copying one and writing to the copy is the point of this tool.`,
            );
        }
        return api(method, path, opts);
    };
}

// The guard repush writes through. Deliberately narrower than writeGuard: the
// charts this run created are the ones repush exists to correct, and after
// `apply` they are rendered by the live page, so writeGuard would refuse the
// whole point of the verb. What must still be refused is any id an ARCHIVE
// renders — editing one of those rewrites a report that has already been
// published, which is the constraint the archive imposes and the only one.
function repushGuard(slots) {
    const ids = protectedIds();
    assertScanUsable(ids, slots);

    // The comparison below is path equality, which fails silently if PAGE is
    // spelled differently from the paths the scan built. Prove they match
    // rather than assume it: PAGE renders 32 charts, so it must be in there.
    const scanned = new Set([...ids.values()].flatMap((files) => [...files]));
    if (!scanned.has(PAGE)) {
        throw new Error(
            `The scan did not produce ${PAGE} as one of its file paths, so "rendered only by the live `
            + `page" cannot be evaluated and nothing will be written. This is a path-spelling bug, not a `
            + `missing file.`,
        );
    }
    console.log(`  guard: ${ids.size} chart ids under content/; only those rendered solely by ${PAGE.split("/").pop()} may be rewritten`);

    return function write(method, path, opts) {
        const target = path.match(/^\/charts\/([A-Za-z0-9]{5})/);
        const files = target && ids.get(target[1]);
        if (files) {
            const elsewhere = [...files].filter((f) => f !== PAGE);
            if (elsewhere.length) {
                throw new Error(
                    `Refusing ${method} ${path}: chart ${target[1]} is rendered by ${elsewhere.length} page(s) `
                    + `besides the live report — ${elsewhere.map((f) => f.replace(REPO_ROOT, "")).join(", ")}. `
                    + `Rewriting it would change an already-published report.`,
                );
            }
        }
        return api(method, path, opts);
    };
}

// ---------------------------------------------------------------------------
// The API
// ---------------------------------------------------------------------------

async function api(method, path, { body, contentType, asText = false } = {}) {
    const token = process.env.DATAWRAPPER_TOKEN;
    if (!token) throw new Error("DATAWRAPPER_TOKEN is not set in the environment.");

    const headers = { Authorization: `Bearer ${token}` };
    if (contentType) headers["Content-Type"] = contentType;

    for (let attempt = 0; ; attempt++) {
        const res = await fetch(`${API}${path}`, { method, headers, body });

        // Honour what the response says rather than a guessed backoff.
        if (res.status === 429 && attempt < 5) {
            const wait = Number(res.headers.get("retry-after")) || 10;
            console.log(`  rate limited; waiting ${wait}s`);
            await sleep(wait * 1000);
            continue;
        }

        // Read the whole body on failure. A status code alone collapses
        // distinguishable causes into one number — "no such chart" and "your
        // token cannot see that folder" are both a 404 with different text.
        if (!res.ok) {
            throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}\n${(await res.text()).slice(0, 600)}`);
        }
        if (res.status === 204) return null;
        return asText ? res.text() : res.json();
    }
}

// A 200 is not the same as a usable answer: assert the shape, not that the call
// returned. A chart object with no id, or a CSV that is a one-line error page,
// both pass a bare "did it succeed" check.
function assertChart(obj, where) {
    if (!obj || typeof obj !== "object" || typeof obj.id !== "string" || obj.id.length !== 5) {
        throw new Error(`${where}: expected a chart object with a 5-character id, got ${JSON.stringify(obj).slice(0, 200)}`);
    }
    return obj;
}

function assertCsv(text, where) {
    if (typeof text !== "string" || !text.trim() || text.trim().split("\n").length < 2) {
        throw new Error(`${where}: expected a CSV with a header and at least one row, got ${JSON.stringify(text ?? "").slice(0, 200)}`);
    }
    return text;
}

// Rows-per-page has to grow with the data, and nothing else in this tool would
// notice if it didn't. Pagination is enabled on all 32 charts, so a chart whose
// perPage is below its row count silently hides the newest periods behind a
// page-2 arrow. That is not hypothetical: bMzMo was set to 5, the 2026 data is
// 7 rows, and the copy published as zVvyR put Jul-Dec 2025 and Jan-Jun 2026 —
// the periods this year's report exists to publish — on page 2.
//
// It is one chart, not a class. Surveyed 2026-09-17 over all 32 published
// charts: bMzMo alone sits at 5; 20 slots are at 15 and 11 at 20, against 4-7
// data rows each. So only table-2-1 overflows today and the rest have room for
// roughly eight more annual periods.
//
// max(), never assignment. Setting perPage to the row count would shrink the
// charts at 20 down to 4 for no benefit, and re-create this bug the first year
// they grow. Growing to fit is a no-op on 31 of 32 slots and can never hide a
// row, which is why it is safe to run unconditionally.
//
// The header row is read off the chart rather than inferred from the CSV: the
// 32 files disagree about whether row 1 is a header, and metadata.data's
// horizontal-header is the flag that tracks it. firstRowIsHeader is NOT that
// flag — it reads false on charts that do have a header row, so keying on it
// would overcount rows by one on every header-bearing slot.
function fitPerPage(chart, csv, header = chart?.metadata?.data?.["horizontal-header"] === true) {
    const current = chart?.metadata?.visualize?.perPage;

    // An unreadable perPage means the response shape moved. Leave the setting
    // alone rather than write a number derived from a guess — the failure this
    // guards against is hiding rows, and omitting the field hides none.
    if (typeof current !== "number") return null;

    const lines = csv.split("\n").filter((line) => line.trim()).length;
    return Math.max(current, lines - (header ? 1 : 0));
}

// The column-format patch repush sends. Keyed by column name, and merged into
// what the chart already has, so it only ever sets fields.
//
// Every existing entry gets number-divisor 0, because the CSV holds true
// values -- #1's source scaled `Total lots` by 1000 (divisor -3) to undo its
// own `8,283` being read as 8.283, and once the CSV said 8283 the chart drew
// 8,283,000 [2026-09-22, render check].
//
// It also blanks number-append on every `(%)` column: the sign belongs to the
// table's own column format (percentColumns below), and appending it here as
// well drew `67%%` on the three charts that already had one [2026-09-22].
function columnFormats(chart, csv, hasHeader) {
    const out = Object.fromEntries(
        Object.keys(chart?.metadata?.data?.["column-format"] ?? {})
            .map((col) => [col, { "number-divisor": 0 }]));
    for (const col of percentHeadings(csv, hasHeader)) {
        out[col] = { ...out[col], "number-append": "" };
    }
    return out;
}

// The visualize.columns patch: every column headed `(%)` draws with the table's
// `0%` format, which appends the sign without scaling (67 -> `67%`). Datawrapper
// parses `26%` in the data as the number 26 and draws `26`; the 2025 charts
// set this format under names like `COTA` or `X.4`, which match nothing once
// horizontal-header gives the columns their real names -- 30 of 37 percentage
// columns drew bare numbers [2026-09-22]. `Failed (%)` on three Table 5a
// charts is the one name that already matched, and is the working example.
function percentColumns(csv, hasHeader) {
    return Object.fromEntries(percentHeadings(csv, hasHeader)
        .map((col) => [col, { format: "0%", append: "", prepend: "" }]));
}

function percentHeadings(csv, hasHeader) {
    if (!hasHeader) return [];
    return csv.split("\n", 1)[0].split("\t").filter((col) => col.trim().endsWith("(%)"));
}

// Whether a CSV opens with a header row rather than a data row. Every data row
// but #1's starts with a period label, and #1's CSV opens with its `RMZ`
// header, so a first cell that is not a period label is a header.
function csvHasHeader(csv) {
    const first = csv.split("\n", 1)[0].split("\t")[0].trim();
    return !/^(Jan-Jun|Jul-Dec)\s+\d{4}$/.test(first);
}

// ---------------------------------------------------------------------------
// State on disk
// ---------------------------------------------------------------------------

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback);
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`, "utf8");

// ---------------------------------------------------------------------------
// pull
// ---------------------------------------------------------------------------

async function cmdPull(slots) {
    mkdirSync(`${WORK}/current`, { recursive: true });
    mkdirSync(`${WORK}/next`, { recursive: true });

    const charts = {};
    for (const { slot, id, line } of slots) {
        const meta = assertChart(await api("GET", `/charts/${id}`), `GET /charts/${id}`);
        await sleep(PAUSE_MS);
        const csv = assertCsv(await api("GET", `/charts/${id}/data`, { asText: true }), `GET /charts/${id}/data`);
        await sleep(PAUSE_MS);

        writeFileSync(`${WORK}/current/${slot}.csv`, csv, "utf8");
        charts[slot] = {
            id,
            line,
            title: meta.title ?? "",
            intro: meta.metadata?.describe?.intro ?? "",
            notes: meta.metadata?.annotate?.notes ?? "",
        };
        console.log(`  ${slot.padEnd(12)} ${id}  ${csv.trim().split("\n").length} rows  ${charts[slot].title}`);
    }

    writeJson(CHARTS, charts);

    // Prefilled with this year's values so the edit is a fill-in rather than a
    // blank page — and never overwritten, because by the second pull it holds
    // hand-written text that nothing else has a copy of.
    if (existsSync(TITLES)) {
        console.log(`\n${TITLES} already exists and was left alone.`);
    } else {
        const seed = {};
        for (const [slot, c] of Object.entries(charts)) seed[slot] = { title: c.title, intro: c.intro, notes: c.notes };
        writeJson(TITLES, seed);
        console.log(`\nWrote ${TITLES} prefilled with the current titles. Edit it for the new period.`);
    }

    console.log(`Pulled ${slots.length} charts into ${WORK}/current/.`);
    return 0;
}

// ---------------------------------------------------------------------------
// dryrun
// ---------------------------------------------------------------------------

async function cmdDryrun(slots) {
    // One read call, against a chart we know exists, to establish that the
    // token works before reporting on anything else. A readiness report that
    // never touched the API would read as ready with no token at all.
    assertChart(await api("GET", `/charts/${slots[0].id}`), "token check");
    console.log(`  token: reads ${slots[0].id} (${slots[0].slot})`);

    const titles = readJson(TITLES, null);
    const done = readJson(MAP, {});

    const noCsv = slots.filter((s) => !existsSync(`${WORK}/next/${s.slot}.csv`)).map((s) => s.slot);
    const noTitle = titles ? slots.filter((s) => !titles[s.slot]?.title).map((s) => s.slot) : slots.map((s) => s.slot);
    const already = slots.filter((s) => done[s.slot]).map((s) => s.slot);

    console.log(`\n${slots.length} slots; ${already.length} already pushed; ${slots.length - already.length} to go.`);
    if (already.length) console.log(`  done: ${already.join(", ")}`);
    if (noCsv.length) console.log(`  NO next/*.csv: ${noCsv.join(", ")}`);
    if (!titles) console.log(`  NO ${TITLES} — run pull first, then edit it.`);
    else if (noTitle.length) console.log(`  NO title entry: ${noTitle.join(", ")}`);

    const blocked = new Set([...noCsv, ...noTitle].filter((s) => !done[s]));
    if (blocked.size) {
        console.log(`\nNot ready: ${blocked.size} slot(s) would be skipped by push.`);
        return 1;
    }
    console.log("\nReady: every outstanding slot has a CSV and a title.");
    return 0;
}

// ---------------------------------------------------------------------------
// push
// ---------------------------------------------------------------------------

async function cmdPush(slots, only) {
    const write = writeGuard(slots);

    const titles = readJson(TITLES, null);
    if (!titles) throw new Error(`${TITLES} does not exist. Run pull first, then edit it.`);

    const map = readJson(MAP, {});
    const targets = only ? slots.filter((s) => s.slot === only) : slots;
    if (only && !targets.length) throw new Error(`No slot named "${only}". Slots: ${slots.map((s) => s.slot).join(", ")}`);

    // Three counters, not one. A slot already in the map is a resume and is
    // fine; a slot missing its CSV or its title is a job this run was asked to
    // do and did not, and the two must not land in the same number. A per-slot
    // "skipped" line is not a failure signal — nobody reads 32 lines looking
    // for the 3 that say it — so the run reconciles its own count at the end
    // and exits non-zero when anything was blocked.
    let pushed = 0;
    let resumed = 0;
    const blocked = [];
    for (const { slot, id } of targets) {
        if (map[slot]) {
            console.log(`  ${slot.padEnd(12)} skipped — already copied to ${map[slot].to}`);
            resumed += 1;
            continue;
        }

        const csvPath = `${WORK}/next/${slot}.csv`;
        if (!existsSync(csvPath)) {
            console.log(`  ${slot.padEnd(12)} BLOCKED — no ${csvPath}`);
            blocked.push(slot);
            continue;
        }
        const csv = assertCsv(readFileSync(csvPath, "utf8"), csvPath);
        const wanted = titles[slot];
        if (!wanted?.title) {
            console.log(`  ${slot.padEnd(12)} BLOCKED — no title in next-titles.json`);
            blocked.push(slot);
            continue;
        }

        // The one write that legitimately names a published chart: copying it
        // creates a new chart and does not modify the source, so it goes
        // through api() directly. Every write after this names copy.id and goes
        // through write(), which would refuse a published id.
        const copy = assertChart(await api("POST", `/charts/${id}/copy`), `POST /charts/${id}/copy`);
        if (copy.id === id) throw new Error(`The copy of ${id} came back with the same id. Refusing to continue.`);
        await sleep(PAUSE_MS);

        await write("PUT", `/charts/${copy.id}/data`, { body: csv, contentType: "text/csv" });
        await sleep(PAUSE_MS);

        // Read the copy back rather than trusting the copy response to carry
        // metadata: fitPerPage needs perPage and horizontal-header, and the
        // single-chart copy form documents no response body beyond the id.
        const fresh = assertChart(await api("GET", `/charts/${copy.id}`), `GET /charts/${copy.id}`);
        await sleep(PAUSE_MS);
        const perPage = fitPerPage(fresh, csv);

        // Always PATCH the title, whether or not the copy endpoint appended
        // "(Copy)". The single-chart copy form takes no request body, so it has
        // no markAsCopy to set — the patch is the only control there is.
        await write("PATCH", `/charts/${copy.id}`, {
            body: JSON.stringify({
                title: wanted.title,
                metadata: {
                    describe: { intro: wanted.intro ?? "" },
                    annotate: { notes: wanted.notes ?? "" },
                    ...(perPage === null ? {} : { visualize: { perPage } }),
                },
            }),
            contentType: "application/json",
        });
        await sleep(PAUSE_MS);

        const published = await write("POST", `/charts/${copy.id}/publish`, {
            body: JSON.stringify({}),
            contentType: "application/json",
        });

        map[slot] = {
            from: id,
            to: copy.id,
            title: wanted.title,
            version: published?.version ?? null,
            url: published?.url ?? null,
            publishedAt: new Date().toISOString(),
        };

        // Written after every slot, not at the end. A run that dies on slot 20
        // must not leave 19 published charts that nothing on disk names.
        writeJson(MAP, map);
        pushed += 1;
        console.log(`  ${slot.padEnd(12)} ${id} -> ${copy.id}  v${map[slot].version}  ${wanted.title}`);
        await sleep(PAUSE_MS);
    }

    console.log(`\n${pushed} pushed, ${resumed} already done, ${blocked.length} blocked `
        + `— ${pushed + resumed} of ${targets.length} slot(s) now have a chart. Map: ${MAP}`);
    if (pushed) console.log("Look at the new charts in the Datawrapper UI before running apply.");
    if (blocked.length) {
        console.log(`\nBLOCKED: ${blocked.join(", ")}. These have no chart and apply will refuse until they do.`);
        return 1;
    }
    return 0;
}

// ---------------------------------------------------------------------------
// repush
// ---------------------------------------------------------------------------

// Push a corrected CSV or title into a chart this run already made, instead of
// making another one. This is the verb that makes "we can fix it later" true:
// push deliberately skips a slot already in chart-map.json, so after a number
// changes, re-running push prints "already copied to" and exits 0 having done
// nothing. Numbers do change here — the partner is still confirming 31 values
// the 2026 document restates — so the correcting path has to exist before
// anyone is told the charts are ready to look at.
async function cmdRepush(slots, only) {
    const write = repushGuard(slots);

    const titles = readJson(TITLES, null);
    if (!titles) throw new Error(`${TITLES} does not exist. Run pull first, then edit it.`);

    const map = readJson(MAP, null);
    if (!map) throw new Error(`${MAP} does not exist. Nothing has been pushed, so there is nothing to re-push.`);

    const targets = only ? slots.filter((s) => s.slot === only) : slots;
    if (only && !targets.length) throw new Error(`No slot named "${only}". Slots: ${slots.map((s) => s.slot).join(", ")}`);

    let updated = 0;
    const blocked = [];
    for (const { slot } of targets) {
        const entry = map[slot];
        if (!entry) {
            // Not an error when re-pushing everything — most slots simply have
            // no chart yet — but it is one when a slot was named explicitly.
            if (only) throw new Error(`${slot} is not in ${MAP}. It has no chart yet; use push.`);
            continue;
        }

        const csvPath = `${WORK}/next/${slot}.csv`;
        if (!existsSync(csvPath)) {
            console.log(`  ${slot.padEnd(12)} BLOCKED — no ${csvPath}`);
            blocked.push(slot);
            continue;
        }
        const csv = assertCsv(readFileSync(csvPath, "utf8"), csvPath);
        const wanted = titles[slot];
        if (!wanted?.title) {
            console.log(`  ${slot.padEnd(12)} BLOCKED — no title in next-titles.json`);
            blocked.push(slot);
            continue;
        }

        // No copy: every call names the id this tool already created.
        await write("PUT", `/charts/${entry.to}/data`, { body: csv, contentType: "text/csv" });
        await sleep(PAUSE_MS);

        // Read before patching, for the same reason push does. This is also the
        // path that fixes a chart pushed before fitPerPage existed.
        const fresh = assertChart(await api("GET", `/charts/${entry.to}`), `GET /charts/${entry.to}`);
        await sleep(PAUSE_MS);
        const hasHeader = csvHasHeader(csv);
        const perPage = fitPerPage(fresh, csv, hasHeader);

        // Save metadata.data before the patch below empties its `changes`.
        // Those overrides exist only in the live chart: `git checkout` does not
        // restore them and re-running this verb cannot recreate them, so
        // clearing without saving would be the one irreversible thing this
        // script does. Written per slot, before the write that destroys it.
        //
        // Skipped when the chart has no overrides left: there is nothing to
        // lose, and writing would replace the backup of an earlier repush with
        // `changes: []` -- which is how two of the nine first backups ended up
        // empty on 2026-09-22. The originals then survive only on the source
        // chart this one was copied from (chart-map.json `from`).
        if ((fresh?.metadata?.data?.changes ?? []).length) {
            mkdirSync(CHANGES_BACKUP, { recursive: true });
            writeJson(`${CHANGES_BACKUP}/${slot}.json`, fresh.metadata.data);
        }

        // Drop the cell overrides this chart inherited from the one it was
        // copied from. Datawrapper stores a UI cell edit in
        // metadata.data.changes keyed by (row, column) rather than by content,
        // and a copy keeps them — so once the new data has more rows than the
        // edits were made against, an override lands on a cell it was never
        // written for and the chart DRAWS a number that is in neither dataset.
        // Measured 2026-09-21: 9 of the 32 charts rendered 64 such cells, and
        // clearing the array took table-6-1 from 9 wrong cells to 0.
        //
        // `repush` does this and `push` does not, deliberately. repush exists to
        // correct a chart already made, so discarding hand-edits is its job.
        // push creates a chart from a copy whose overrides may still be the only
        // source of a wanted heading — the "Period" label that ten of these
        // charts show for a column their CSV leaves blank, and table-5a-5's
        // `Failed (#)` duplicate corrected to `Failed (%)`. Clearing on push
        // would silently drop those. Repushing such a slot will drop them too:
        // re-supply the text in the CSV header before repushing one.
        //
        // The merge PATCH empties the array without disturbing its siblings
        // `[verified 2026-09-21 on WKLmL: 147 changes -> 0, and transpose,
        // vertical-header, horizontal-header, column-format and upload-method
        // all still present afterwards]`. horizontal-header surviving is the
        // one that matters — it sets the row alignment, and losing it would
        // move every heading rather than fix any cell.
        await write("PATCH", `/charts/${entry.to}`, {
            body: JSON.stringify({
                title: wanted.title,
                metadata: {
                    describe: { intro: wanted.intro ?? "" },
                    annotate: { notes: wanted.notes ?? "" },
                    // horizontal-header follows the CSV. On a chart where it
                    // was false, row 0 is Datawrapper's X.1, X.2 ... and the
                    // headings were overrides typed over them -- so clearing
                    // the overrides without turning this on leaves the chart
                    // with no headings at all, which is what table-2-1..4
                    // drew on 2026-09-22.
                    // column-format: see columnFormats().
                    data: {
                        changes: [],
                        "horizontal-header": hasHeader,
                        "column-format": columnFormats(fresh, csv, hasHeader),
                    },
                    visualize: {
                        columns: percentColumns(csv, hasHeader),
                        ...(perPage === null ? {} : { perPage }),
                    },
                },
            }),
            contentType: "application/json",
        });
        await sleep(PAUSE_MS);

        const published = await write("POST", `/charts/${entry.to}/publish`, {
            body: JSON.stringify({}),
            contentType: "application/json",
        });

        // A republish mints a new public version, so the recorded url and
        // version go stale the moment this runs. Overwrite them rather than
        // leaving the map describing the version this just replaced.
        entry.title = wanted.title;
        entry.version = published?.version ?? null;
        entry.url = published?.url ?? null;
        entry.updatedAt = new Date().toISOString();

        writeJson(MAP, map);
        updated += 1;
        console.log(`  ${slot.padEnd(12)} ${entry.to}  v${entry.version}  ${wanted.title}`);
        await sleep(PAUSE_MS);
    }

    const inMap = targets.filter((s) => map[s.slot]).length;
    console.log(`\n${updated} re-pushed, ${blocked.length} blocked — ${updated} of ${inMap} slot(s) `
        + `with a chart were updated. Map: ${MAP}`);
    if (blocked.length) {
        console.log(`\nBLOCKED: ${blocked.join(", ")}. Their charts still hold what was pushed before.`);
        return 1;
    }
    return 0;
}

// ---------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------

function cmdApply(slots) {
    const map = readJson(MAP, null);
    if (!map) throw new Error(`${MAP} does not exist. Nothing has been pushed.`);

    const missing = slots.filter((s) => !map[s.slot]).map((s) => s.slot);
    if (missing.length) throw new Error(`${missing.length} slot(s) have no chart yet: ${missing.join(", ")}`);

    const lines = readFileSync(PAGE, "utf8").split("\n");
    const drop = new Set();

    for (const { slot, id, line } of slots) {
        const to = map[slot].to;
        const index = line - 1;

        // The ID appears four times on the embed's single line — twice as
        // datawrapper-vis-<id> and twice in a dwcdn.net URL — and carries no
        // version segment, so replacing every occurrence on that line is the
        // whole edit. Verified 2026-09-17 against index.md: 74 occurrences of
        // datawrapper-vis-[A-Za-z0-9]{5} across 37 lines, exactly 2 per line,
        // and dwcdn\.net/[A-Za-z0-9]{5}/[0-9]+/ returns 0 while the same
        // pattern ending [a-z]+ returns the embed/full hits.
        const before = lines[index];
        const after = before.split(id).join(to);
        const hits = before.split(id).length - 1;
        if (hits !== 4) throw new Error(`${slot}: expected ${id} 4 times on line ${line}, found ${hits}. The markup has changed shape.`);
        lines[index] = after;

        // The TODO marker sits on its own line immediately above the embed.
        if (index > 0 && lines[index - 1].trim() === "<!-- TODO 2026 chart -->") drop.add(index - 1);
    }

    writeFileSync(PAGE, lines.filter((_, i) => !drop.has(i)).join("\n"), "utf8");
    console.log(`Rewrote ${slots.length} slot(s) in index.md and removed ${drop.size} TODO marker(s).`);

    // For pasting into the plan document's 32-slot table AFTER the proof passes.
    console.log("\n| Slot | Was | Now |\n|---|---|---|");
    for (const { slot } of slots) console.log(`| \`${slot}\` | \`${map[slot].from}\` | \`${map[slot].to}\` |`);

    console.log("\nNow run the plan document's Task 3 proof. The check that matters is its Python");
    console.log("probe's output diffed against chart-map.json — not against the table above, which");
    console.log("this script printed and so cannot independently confirm.");
    return 0;
}

// ---------------------------------------------------------------------------
// folders and move
// ---------------------------------------------------------------------------

// A copy lands in its SOURCE's folder — verified in the Datawrapper UI
// 2026-09-17: zVvyR, copied from bMzMo, appeared at BESP > Live Charts > Data
// Features > Rat Report > Rat Report 2025 > Table 2. The single-chart copy form
// takes no destination, so every 2026 chart this tool makes is filed under a
// tree named for 2025 until something moves it. Nothing about the page breaks
// either way — index.md references charts by id and never by folder — so this
// is filing, and it is the reason this verb exists rather than a correctness fix.
//
// Folder ids are numeric and the UI does not put them in front of you, which is
// what `folders` is for.
async function cmdFolders() {
    const res = await api("GET", "/folders");
    const list = res?.list ?? [];
    if (!Array.isArray(list) || !list.length) {
        throw new Error(`GET /folders returned no folder list. Got ${JSON.stringify(res).slice(0, 200)}`);
    }
    // GET /folders returns CONTAINERS, not folders: one per team plus the
    // personal archive, each carrying its own `folders` array. Nesting is
    // `folders` all the way down — there is no `children` key, which an earlier
    // draft of this assumed and which printed every name as "undefined"
    // `[against the live API 2026-09-17]`. A container's id can be a team slug
    // like "KeHyhPba" and is NOT a folderId; `move` takes the numeric id of a
    // real folder.
    const walk = (nodes, depth) => {
        for (const f of nodes) {
            console.log(`${String(f.id).padEnd(10)}${"  ".repeat(depth)}${f.name} (${f.charts?.length ?? 0} charts)`);
            if (Array.isArray(f.folders) && f.folders.length) walk(f.folders, depth + 1);
        }
    };
    for (const container of list) {
        console.log(`\n[${container.type ?? "container"} ${container.id}]`);
        walk(Array.isArray(container.folders) ? container.folders : [], 1);
    }
    console.log(`\nPass a numeric id from above to \`move\`. Needs the folder:read scope.`);
    return 0;
}

// Find a folder anywhere in the tree, and say which container owns it. The
// container matters: POST /folders takes a teamId, and a folder created without
// one lands in the personal archive rather than beside its siblings.
function locateFolder(list, wantedId) {
    for (const container of list) {
        const stack = [...(container.folders ?? [])];
        while (stack.length) {
            const folder = stack.pop();
            if (Number(folder.id) === wantedId) return { folder, container };
            if (Array.isArray(folder.folders)) stack.push(...folder.folders);
        }
    }
    return null;
}

// Create this year's folder tree under an existing parent, mirroring the shape
// FOLDER_FOR_SLOT records, and write the slot -> folderId map that `move` reads.
//
// Reuses a folder that already carries the right name instead of creating a
// second one. Without that, a re-run after any failure leaves a duplicate tree
// that has to be cleaned up by hand in the UI — and the failure most likely to
// prompt a re-run is a partial one, which is exactly when half the folders
// already exist.
async function cmdMakeFolders(slots, parentArg, yearArg) {
    const parentId = Number(parentArg);
    if (!Number.isInteger(parentId) || parentId <= 0) {
        throw new Error(`"${parentArg}" is not a folder id. Run \`folders\` to list them; ids are positive integers.`);
    }
    const year = Number(yearArg);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error(`"${yearArg}" is not a year. Usage: makefolders <parentFolderId> <year>`);
    }

    // Reconcile before creating anything. A slot with no rule would be left
    // behind in last year's tree while the run printed a success line.
    const wanted = new Map();
    const unmatched = [];
    for (const { slot } of slots) {
        const rule = FOLDER_FOR_SLOT.find(([re]) => re.test(slot));
        if (!rule) unmatched.push(slot);
        else wanted.set(slot, rule[1]);
    }
    if (unmatched.length) {
        throw new Error(
            `${unmatched.length} slot(s) have no folder rule in FOLDER_FOR_SLOT: ${unmatched.join(", ")}. `
            + `Add a rule for each before running this, or they would be left behind.`,
        );
    }

    const tree = await api("GET", "/folders");
    const here = locateFolder(tree?.list ?? [], parentId);
    if (!here) throw new Error(`Folder ${parentId} is not in any tree this token can read. Run \`folders\`.`);
    const teamId = here.container.type === "team" ? here.container.id : undefined;
    console.log(`  parent: ${here.folder.name} (${parentId}) in ${here.container.type} ${here.container.id}`);

    const ensure = async (name, parent, siblings) => {
        const existing = (siblings ?? []).find((f) => f.name === name);
        if (existing) {
            console.log(`  ${String(existing.id).padEnd(8)} ${name} — already there, reusing`);
            return { id: Number(existing.id), folders: existing.folders ?? [] };
        }
        const made = await api("POST", "/folders", {
            body: JSON.stringify({ name, parentId: parent, ...(teamId ? { teamId } : {}) }),
            contentType: "application/json",
        });
        await sleep(PAUSE_MS);
        const id = Number(made?.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(`POST /folders for "${name}" did not return a folder id. Got ${JSON.stringify(made).slice(0, 200)}`);
        }
        console.log(`  ${String(id).padEnd(8)} ${name} — created`);
        return { id, folders: [] };
    };

    const yearFolder = await ensure(`Rat Report ${year}`, parentId, here.folder.folders);

    const byName = new Map();
    for (const name of new Set([...wanted.values()].filter(Boolean))) {
        byName.set(name, (await ensure(name, yearFolder.id, yearFolder.folders)).id);
    }

    const folderMap = {};
    for (const [slot, name] of wanted) folderMap[slot] = name === null ? yearFolder.id : byName.get(name);

    const missing = Object.entries(folderMap).filter(([, id]) => !Number.isInteger(id)).map(([s]) => s);
    if (missing.length) throw new Error(`No folder id resolved for: ${missing.join(", ")}. Nothing written.`);

    writeJson(FOLDERMAP, folderMap);
    console.log(`\n${byName.size + 1} folder(s) in place, ${Object.keys(folderMap).length} slot(s) mapped. Map: ${FOLDERMAP}`);
    console.log("Now run `move` with no arguments to file the charts into them.");
    return 0;
}

// Move the charts this run created into a folder. Takes the whole map by
// default, or one slot, so the 2025 tree's per-table subfolders can be mirrored
// by running it once per group rather than by teaching this script a structure
// that lives in someone else's UI.
async function cmdMove(folderArg, only) {
    // No folder id: every slot goes where folder-map.json puts it, which is the
    // normal path once makefolders has run. An explicit id overrides the map for
    // every slot named, and stays as the escape hatch for a one-off.
    let folderId = null;
    let destinations = {};
    if (folderArg === undefined) {
        destinations = readJson(FOLDERMAP, null);
        if (!destinations) {
            throw new Error(`${FOLDERMAP} does not exist. Run \`makefolders <parentFolderId> <year>\` first, or pass a folder id.`);
        }
    } else {
        folderId = Number(folderArg);
        if (!Number.isInteger(folderId) || folderId <= 0) {
            throw new Error(`"${folderArg}" is not a folder id. Run \`folders\` to list them; ids are positive integers.`);
        }
    }

    const map = readJson(MAP, null);
    if (!map) throw new Error(`${MAP} does not exist. Nothing has been pushed, so there is nothing to move.`);

    const entries = Object.entries(map).filter(([slot]) => !only || slot === only);
    if (only && !entries.length) throw new Error(`${only} is not in ${MAP}. It has no chart yet.`);
    if (!entries.length) throw new Error(`${MAP} is empty.`);

    // The per-id guard cannot help here. PATCH /charts is the documented way to
    // move charts and its path carries no id, so the regex in write() does not
    // match it and would pass the call through unchecked. Check the ids here
    // instead, before the call, or this verb is a hole in the protection every
    // other write goes through.
    const ids = protectedIds();
    assertScanUsable(ids, readSlots(PAGE));
    console.log(`  guard: ${ids.size} chart ids under content/; only charts no archive renders may be moved`);
    const offLimits = [];
    for (const [slot, entry] of entries) {
        const files = ids.get(entry.to);
        const elsewhere = files ? [...files].filter((f) => f !== PAGE) : [];
        if (elsewhere.length) offLimits.push(`${slot} (${entry.to}) rendered by ${elsewhere.map((f) => f.replace(REPO_ROOT, "")).join(", ")}`);
    }
    if (offLimits.length) {
        throw new Error(
            `Refusing to move ${offLimits.length} chart(s) that a page other than the live report renders:\n  `
            + `${offLimits.join("\n  ")}\nMoving one would reorganize a published report's charts.`,
        );
    }

    // One batch call per destination. With no folder id given, each slot goes
    // where folder-map.json says, which is how the per-table tree gets mirrored
    // without running this once per slot.
    const byFolder = new Map();
    for (const [slot, entry] of entries) {
        const dest = folderId ?? destinations[slot];
        if (!Number.isInteger(dest)) {
            throw new Error(`${slot} has no destination in ${FOLDERMAP}. Run makefolders first, or name a folder id.`);
        }
        if (!byFolder.has(dest)) byFolder.set(dest, []);
        byFolder.get(dest).push([slot, entry.to]);
    }

    let moved = 0;
    for (const [dest, group] of byFolder) {
        const chartIds = group.map(([, id]) => id);
        console.log(`  folder ${String(dest).padEnd(8)} ${chartIds.length} chart(s): ${group.map(([s]) => s).join(", ")}`);
        await api("PATCH", "/charts", {
            body: JSON.stringify({ ids: chartIds, patch: { folderId: dest } }),
            contentType: "application/json",
        });
        await sleep(PAUSE_MS);

        // A 200 does not prove anything moved. Read one chart back per group and
        // check the folder it reports, so a silently-ignored patch fails here
        // rather than being discovered in the UI weeks later.
        const check = assertChart(await api("GET", `/charts/${chartIds[0]}`), `GET /charts/${chartIds[0]}`);
        if (Number(check.folderId) !== dest) {
            throw new Error(
                `The move reported success but ${chartIds[0]} still reports folderId ${check.folderId}, not ${dest}. `
                + `${moved} group(s) moved before this one; the map records only those. Check the token's chart:write scope.`,
            );
        }
        await sleep(PAUSE_MS);

        const at = new Date().toISOString();
        for (const [slot] of group) {
            map[slot].folderId = dest;
            map[slot].movedAt = at;
        }
        // Written per group, not once at the end: a failure partway through has
        // already moved charts, and a map that does not say so is worse than no
        // map at all.
        writeJson(MAP, map);
        moved += 1;
    }

    console.log(`\nMoved ${entries.length} chart(s) into ${byFolder.size} folder(s). Map: ${MAP}`);
    return 0;
}

// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);

    const flag = args.find((a) => a.startsWith("-"));
    if (flag) return usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (!args.length) return usage("No command given.");
    if (args.length > 3) return usage(`Expected a command and at most two arguments, got ${args.length}.`);

    // move is the only verb taking two, because it names a destination AND may
    // name one slot. Validate per command rather than with one shared rule, so
    // an argument in the wrong place is a usage error instead of being ignored.
    const [command, arg1, arg2] = args;
    if (command === "makefolders") {
        if (arg1 === undefined || arg2 === undefined) return usage("Usage: makefolders <parentFolderId> <year>");
    } else if (command === "move") {
        // No arguments is the normal path — folder-map.json holds the destinations.
    } else if (["push", "repush"].includes(command)) {
        if (arg2 !== undefined) return usage(`\`${command}\` takes at most one slot, got two arguments.`);
    } else if (arg1 !== undefined) {
        return usage(`\`${command}\` takes no arguments.`);
    }

    // An unset token is a setup mistake, not a run that failed, so it exits 2
    // like a usage error rather than 1 from the middle of the first request.
    if (["pull", "dryrun", "push", "repush", "folders", "makefolders", "move"].includes(command) && !process.env.DATAWRAPPER_TOKEN) {
        console.error("DATAWRAPPER_TOKEN is not set in the environment.");
        console.error("Create a token in the Datawrapper UI and export it; never put it in a file here.");
        return 2;
    }

    const slots = readSlots(PAGE);
    console.log(`${slots.length} live embed slots in content/data-features/rat-report/index.md`);

    switch (command) {
        case "pull": return cmdPull(slots);
        case "dryrun": return cmdDryrun(slots);
        case "push": return cmdPush(slots, arg1);
        case "repush": return cmdRepush(slots, arg1);
        case "apply": return cmdApply(slots);
        case "folders": return cmdFolders();
        case "makefolders": return cmdMakeFolders(slots, arg1, arg2);
        case "move": return cmdMove(arg1, arg2);
        default: return usage(`Unknown command "${command}".`);
    }
}

main().then(
    (code) => { process.exitCode = code; },
    (err) => {
        console.error(`\n${err.message}`);
        process.exitCode = 1;
    },
);
