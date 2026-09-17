// Produce the rat report's 32 Datawrapper charts for a new reporting period.
//
//   node scripts/rat-report-charts.mjs pull              read the 32 live charts into scripts/rat-report-charts/
//   node scripts/rat-report-charts.mjs dryrun            report what push would do; writes nothing
//   node scripts/rat-report-charts.mjs push table-2-1    one slot, end to end
//   node scripts/rat-report-charts.mjs push              every slot not already done
//   node scripts/rat-report-charts.mjs apply             rewrite index.md from the run's own map
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
    console.error("  node scripts/rat-report-charts.mjs apply\n");
    console.error("pull    GET every live chart's data and metadata into scripts/rat-report-charts/.");
    console.error("        Read-only against Datawrapper. Also writes next-titles.json prefilled with");
    console.error("        the current titles, and will not overwrite it once it exists.");
    console.error("dryrun  Name every slot missing a next/ CSV or a title entry. One read call to");
    console.error("        check the token; no writes.");
    console.error("push    Copy, upload, retitle and publish. With a slot name, just that one — run");
    console.error("        a single slot first and look at it in the UI. Resumable: a slot already in");
    console.error("        chart-map.json is skipped, not copied again.");
    console.error("apply   Swap each slot's ID in index.md and delete its TODO marker. Local only.\n");
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
function protectedIds() {
    const ids = new Set();
    for (const file of markdownFiles(`${REPO_ROOT}/content`)) {
        const text = readFileSync(file, "utf8");
        for (const m of text.matchAll(/dwcdn\.net\/([A-Za-z0-9]{5})\//g)) ids.add(m[1]);
        for (const m of text.matchAll(/datawrapper[^\n]*?src="([A-Za-z0-9]{5})/g)) ids.add(m[1]);
    }
    return ids;
}

// Returns the function every write must call first. The scan above is a null
// detector, so it validates itself before being trusted: a scan that silently
// found nothing — wrong path, changed markup — would permit every write this
// guard exists to block, and would look identical to a clean pass.
function writeGuard(slots) {
    const ids = protectedIds();
    const absent = slots.filter((s) => !ids.has(s.id)).map((s) => s.slot);
    if (absent.length || ids.size < slots.length) {
        throw new Error(
            `The protected-id scan cannot be trusted, so nothing will be written. It found ${ids.size} `
            + `chart id(s) across content/, and ${absent.length} of the live page's own slots are not among `
            + `them (${absent.join(", ") || "none"}). Expected at least ${slots.length}, including all of them.`,
        );
    }
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

    let pushed = 0;
    for (const { slot, id } of targets) {
        if (map[slot]) {
            console.log(`  ${slot.padEnd(12)} skipped — already copied to ${map[slot].to}`);
            continue;
        }

        const csvPath = `${WORK}/next/${slot}.csv`;
        if (!existsSync(csvPath)) {
            console.log(`  ${slot.padEnd(12)} skipped — no ${csvPath}`);
            continue;
        }
        const csv = assertCsv(readFileSync(csvPath, "utf8"), csvPath);
        const wanted = titles[slot];
        if (!wanted?.title) {
            console.log(`  ${slot.padEnd(12)} skipped — no title in next-titles.json`);
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

        // Always PATCH the title, whether or not the copy endpoint appended
        // "(Copy)". The single-chart copy form takes no request body, so it has
        // no markAsCopy to set — the patch is the only control there is.
        await write("PATCH", `/charts/${copy.id}`, {
            body: JSON.stringify({
                title: wanted.title,
                metadata: {
                    describe: { intro: wanted.intro ?? "" },
                    annotate: { notes: wanted.notes ?? "" },
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

    console.log(`\nPushed ${pushed} slot(s). Map: ${MAP}`);
    if (pushed) console.log("Look at the new charts in the Datawrapper UI before running apply.");
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

async function main() {
    const args = process.argv.slice(2);

    const flag = args.find((a) => a.startsWith("-"));
    if (flag) return usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (!args.length) return usage("No command given.");
    if (args.length > 2) return usage(`Expected a command and at most one slot, got ${args.length} arguments.`);

    const [command, slotArg] = args;
    if (slotArg !== undefined && command !== "push") return usage(`Only \`push\` takes a slot, not \`${command}\`.`);

    // An unset token is a setup mistake, not a run that failed, so it exits 2
    // like a usage error rather than 1 from the middle of the first request.
    if (["pull", "dryrun", "push"].includes(command) && !process.env.DATAWRAPPER_TOKEN) {
        console.error("DATAWRAPPER_TOKEN is not set in the environment.");
        console.error("Create a token in the Datawrapper UI and export it; never put it in a file here.");
        return 2;
    }

    const slots = readSlots(PAGE);
    console.log(`${slots.length} live embed slots in content/data-features/rat-report/index.md`);

    switch (command) {
        case "pull": return cmdPull(slots);
        case "dryrun": return cmdDryrun(slots);
        case "push": return cmdPush(slots, slotArg);
        case "apply": return cmdApply(slots);
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
