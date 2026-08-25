// ======================================================================= //
// site-characterization-rebaseline.mjs
// ======================================================================= //

// Re-captures every committed site-characterization baseline after a change
// that moves the site ON PURPOSE, and reports what moved that you did not say
// would move.
//
// `--check` is built for the case where any difference is a finding. A
// deliberate site-wide change inverts that: hundreds of pages differ because
// they were supposed to, and the whole question is what ELSE came with them.
// Re-capturing by hand has three failure modes, and only the first is obvious:
//
//   1. --baseline opens with rmSync on the baseline directory, so the
//      before-side is destroyed before anything can be compared against it.
//   2. It writes only the key for whichever environment the server happens to
//      be, so the other committed key silently keeps describing an older commit.
//   3. Nothing records what was claimed to be intended, so the review reduces
//      to "the diff looked plausible" and leaves no artifact.
//
// So this snapshots first, drives every committed key in one run, and writes
// down the prediction it was given. It NEVER commits — the re-captured baseline
// and this report are what you review before doing that yourself.
//
// Each environment gets its own isolated `hugo server`: publishDir redirected
// with -d and the fingerprint cache redirected with HUGO_RESOURCEDIR, so it
// cannot poison a server you already have running. Servers are started and
// stopped ONE AT A TIME; the isolation is for YOUR server, not for ours.
// `[verified 2026-08-25 in both forms — see Task 17 of
// documents/site-characterization-plan-2026-08-23.md for the measurements]`
//
// Usage:
//   node scripts/site-characterization-rebaseline.mjs
//   node scripts/site-characterization-rebaseline.mjs --expect "neighborhood-reports/**"
//   node scripts/site-characterization-rebaseline.mjs --report-only
//
// Exit codes: 0 nothing unexplained; 1 unexplained changes to review; 2 the run
// could not be made at all.

import { spawn, execFileSync, execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { summarize, renderText } from "./site-characterization-summary.mjs";
import { SPAWN_CMD as HUGO_BIN, PREFIXES } from "./dev-server.mjs";

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

const BASELINE_ROOT = "scripts/site-characterization-baseline";
const WORK_DIR = "scripts/.sc-rebaseline";
const BEFORE_DIR = `${WORK_DIR}/before`;
const REPORT_FILE = `${WORK_DIR}/report.md`;
const META_FILE = "_meta.json";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Which Hugo environment produces each baseline key. The key is a property of
// the OUTPUT (data branch, plus prod_prod's environment-name branch in
// head.html); this maps back to one environment that produces it. Any
// environment in a key's row would do — these are just the ones the committed
// baselines were captured from.
const ENVIRONMENT_FOR = {
    staging: "dev_stage",
    production: "dev_prod",
    prod_prod: "prod_prod",
};

// Deliberately OFF dev-server.mjs's probe list (8080, 8081, 1313). On a probed
// port, any other harness invocation running at the same time would discover
// this script's private server and sweep the wrong environment against the
// wrong baseline.
const PORT = 8090;

// Where the isolated servers write. Outside the repo, so neither resources/_gen
// nor docs/ is reachable from them — that is the whole isolation claim.
const ISO_ROOT = `${tmpdir().replace(/\\/g, "/")}/sc-rebaseline`;

// A build of this site takes ~34s on this machine, plus Hugo's own startup.
const SERVER_TIMEOUT_S = 200;

// ----------------------------------------------------------------------- //
// small helpers
// ----------------------------------------------------------------------- //

const walk = (dir, base = "") => !existsSync(dir) ? [] :
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
        ? walk(`${dir}/${e.name}`, `${base}${e.name}/`)
        : [`${base}${e.name}`]);

// Every record file in a baseline tree. _meta.json describes the capture rather
// than a page, and its capturedAt and gitHead differ on every run — comparing
// it would report a difference on every re-baseline, always.
const records = (dir) => walk(dir).filter((rel) => rel !== META_FILE);

const readMeta = (dir) => {
    const f = `${dir}/${META_FILE}`;
    return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
};

// Every page a baseline tree describes, named the way summarize() names them —
// by the record's own `path` field.
//
// Deriving the name from the FILENAME instead is wrong in a way that hides:
// fileFor() rewrites "data-explorer/asthma/" to ".../asthma/index.json", so the
// filename round-trips to "data-explorer/asthma" without the trailing slash and
// never equals the `path` a changed row carries. A glob denominator built that
// way reported "matched NO changed page" about a page the same glob had just
// matched.
const pagePaths = (dir) => records(dir)
    .map((rel) => JSON.parse(readFileSync(`${dir}/${rel}`, "utf8")).path ?? rel);

const git = (...args) => execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();

// A glob over record paths, which look like "", "404.html" and
// "neighborhood-reports/bayside_little_neck/" — URL paths with the environment
// prefix stripped, directories keeping their trailing slash.
//
// `**` crosses separators and `*` does not, which is the distinction that makes
// "data-explorer/*" mean the section's own pages rather than everything beneath
// it. `**` is substituted first via a placeholder no glob can contain, so the
// single-star rule cannot eat half of a double star.
const globToRegExp = (glob) => {
    const escaped = glob.replace(/[.+^${}()|[\]\\?]/g, "\\$&");
    const body = escaped.replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*");
    return new RegExp(`^${body}$`);
};

// ----------------------------------------------------------------------- //
// server lifecycle
// ----------------------------------------------------------------------- //

// Kill a spawned server and everything under it. child.kill() does not reap
// descendants on Windows, which is how a "stopped" server keeps serving.
//
// Idempotent via its own flag rather than via child.killed, which taskkill
// never sets: this is called once from recapture's finally block and again from
// the process exit handler, and a second taskkill would be aimed at a PID the
// OS is free to have reassigned by then.
const makeStop = (child) => {
    let stopped = false;
    return () => {
        if (!child || stopped) return;
        stopped = true;
        if (process.platform === "win32") {
            try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" }); } catch { /* already gone */ }
        } else {
            child.kill("SIGTERM");
        }
    };
};

const responds = async (url) => {
    try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(t);
        return res.status === 200;
    } catch {
        return false;
    }
};

// Start an isolated server for one environment and return its base URL.
//
// Both redirections are load-bearing and neither is optional: -d keeps the
// build out of docs/, HUGO_RESOURCEDIR keeps it out of resources/_gen, and
// resources/_gen is the one that corrupts a running server's asset paths.
//
// The prefix is PROBED rather than read from config/, because the served prefix
// is whatever that environment's baseURL says and probing cannot disagree with
// the running server.
const startServer = async (environment) => {

    const destDir = `${ISO_ROOT}/${environment}-docs`;
    const resourceDir = `${ISO_ROOT}/${environment}-resources`;
    rmSync(destDir, { recursive: true, force: true });
    rmSync(resourceDir, { recursive: true, force: true });

    const args = ["server", "--environment", environment, "--cleanDestinationDir",
        "--disableFastRender", "-p", String(PORT), "-d", destDir];

    console.log(`  starting isolated ${environment} server on :${PORT}`);
    console.log(`    HUGO_RESOURCEDIR=${resourceDir}`);
    console.log(`    -d ${destDir}`);

    // Shell mode on Windows because hugo only resolves through PATHEXT there,
    // and as one pre-joined string because an args array with shell:true trips
    // Node's DEP0190 warning. Quoting therefore happens at the one point where
    // the array has to become a string — a resolved binary path or a temp
    // directory can hold a space, which an args array never has to care about.
    const quote = (a) => (/\s/.test(a) ? `"${a}"` : a);
    const spawnEnv = { ...process.env, HUGO_RESOURCEDIR: resourceDir };
    const child = process.platform === "win32"
        ? spawn([HUGO_BIN, ...args].map(quote).join(" "),
            { cwd: REPO_ROOT, shell: true, stdio: "ignore", env: spawnEnv })
        : spawn(HUGO_BIN, args, { cwd: REPO_ROOT, stdio: "ignore", env: spawnEnv });

    const stop = makeStop(child);
    process.once("exit", stop);
    process.once("SIGINT", () => { stop(); process.exit(130); });

    for (let i = 0; i < SERVER_TIMEOUT_S; i++) {
        for (const prefix of PREFIXES) {
            const baseURL = `http://localhost:${PORT}${prefix}`;
            if (await responds(baseURL)) return { baseURL, destDir, stop };
        }
        await sleep(1000);
    }

    stop();
    throw new Error(`The ${environment} server did not answer on :${PORT} within ${SERVER_TIMEOUT_S}s.`);
};

// ----------------------------------------------------------------------- //
// re-capturing one key
// ----------------------------------------------------------------------- //

// Snapshot, capture, stop. The snapshot has to happen before --baseline runs,
// because --baseline opens by deleting the directory it is about to write.
const recapture = async (key, concurrency) => {

    const environment = ENVIRONMENT_FOR[key];
    console.log(`\n=== ${key} (${environment}) ===`);

    rmSync(`${BEFORE_DIR}/${key}`, { recursive: true, force: true });
    mkdirSync(`${BEFORE_DIR}/${key}`, { recursive: true });
    cpSync(`${BASELINE_ROOT}/${key}`, `${BEFORE_DIR}/${key}`, { recursive: true });
    console.log(`  snapshotted ${records(`${BEFORE_DIR}/${key}`).length} records`);

    const { baseURL, destDir, stop } = await startServer(environment);
    console.log(`  serving ${baseURL}`);

    try {
        // The harness refuses to compare a searched site against a search-less
        // baseline, and both committed baselines carry the index — so building
        // it here is not a nicety, it is what keeps the capture comparable.
        // Same command the deploy workflow runs.
        console.log("  building the Pagefind index");
        execSync(`npx -y pagefind --site "${destDir}"`, { cwd: REPO_ROOT, stdio: "ignore" });

        // Driven as a child process rather than imported: site-characterization
        // is a CLI that reads process.argv and calls process.exit, and one
        // implementation of the sweep is worth more than a shared entry point.
        // DE_SERVER_OWNED tells ensureDevServer that we started this server
        // ourselves, so the baseline records the Hugo version as the server's
        // rather than as the one this checkout would have used.
        const harnessArgs = ["scripts/site-characterization.mjs", "--baseline", "--all"];
        if (concurrency) harnessArgs.push("--concurrency", String(concurrency));

        execFileSync(process.execPath, harnessArgs, {
            cwd: REPO_ROOT,
            stdio: "inherit",
            env: { ...process.env, DE_BASE_URL: baseURL, DE_SERVER_OWNED: "1" },
        });
    } catch (e) {
        // The harness deletes the baseline directory before it sweeps and only
        // writes _meta.json once every page has answered, so a capture that
        // fails part-way leaves the COMMITTED baseline half-overwritten and
        // missing its _meta.json — which reads as a vast uncommitted diff, and
        // which a later --check refuses outright for want of a baseline.
        // `[observed 2026-08-25: 13 NR pages timed out, 912 records written,
        // _meta.json deleted, and the run said nothing about any of it]`
        //
        // The snapshot exists precisely so this is recoverable without git, so
        // put it back: a failed run must leave the tree exactly as it found it.
        rmSync(`${BASELINE_ROOT}/${key}`, { recursive: true, force: true });
        cpSync(`${BEFORE_DIR}/${key}`, `${BASELINE_ROOT}/${key}`, { recursive: true });
        console.error(`\n  CAPTURE FAILED — restored the ${key} baseline from the snapshot; `
            + `the tree is unchanged.`);
        throw new Error(`The ${key} capture did not complete (${e.message.split("\n")[0]}).\n`
            + `The harness's own output above says which pages failed. Nothing was re-baselined.`);
    } finally {
        stop();
        console.log(`  stopped the ${environment} server`);
    }
};

// ----------------------------------------------------------------------- //
// classifying what moved
// ----------------------------------------------------------------------- //

// Split the changed rows into the ones a glob claimed and the ones nobody did.
// Also reports, per glob, how many of the pages it COULD match actually moved —
// a glob written after reading the first report can only ever match things that
// changed, so an over-prediction is the one form of dishonesty the numbers can
// still expose.
const partition = (rows, globs, allPages) => {

    const patterns = globs.map((g) => ({ glob: g, re: globToRegExp(g) }));
    const covers = (page) => patterns.some((p) => p.re.test(page));

    const expected = rows.filter((r) => covers(r.page));
    const unexplained = rows.filter((r) => !covers(r.page));
    const changedPages = new Set(rows.map((r) => r.page));

    const claims = patterns.map(({ glob, re }) => {
        const candidates = allPages.filter((p) => re.test(p));
        const moved = candidates.filter((p) => changedPages.has(p));
        return { glob, candidates: candidates.length, moved: moved.length };
    });

    return { expected, unexplained, claims };
};

// One key's report. Structure and content are rendered differently on purpose.
//
// `renderText` ends with shapeOf(), whose data-sensitivity verdict rests on
// Task 8's measurement of `structure.controls`, `.links` and `.headingLevels` —
// a structure-only calibration. Handing it content rows would produce a
// confident "no changed field has a data path to it" about fields the data
// moves all the time, so content is reported as counts and never shaped.
const classify = (key, globs) => {

    const beforeDir = `${BEFORE_DIR}/${key}`;
    const afterDir = `${BASELINE_ROOT}/${key}`;

    if (!existsSync(beforeDir)) {
        throw new Error(`No snapshot at ${beforeDir}. Run without --report-only first.`);
    }

    const rels = [...new Set([...records(beforeDir), ...records(afterDir)])];
    // Union of both sides, so a page present only in the baseline still counts
    // toward the denominator a glob is measured against.
    const allPages = [...new Set([...pagePaths(afterDir), ...pagePaths(beforeDir)])];
    const rows = summarize(beforeDir, afterDir, rels);
    const { expected, unexplained, claims } = partition(rows, globs, allPages);

    // A record carries four top-level fields — path (summarize skips it; it is
    // the identity), status, structure and content — plus navError when a
    // capture failed outright. So "page-level" is a closed set rather than a
    // leftover bucket: the page appeared, vanished, changed HTTP status, or
    // failed to load. `other` stays as the guard for a field added later.
    const pageLevel = unexplained.filter((r) => r.field === "(whole page)"
        || r.field === "status" || r.field === "navError");
    const structure = unexplained.filter((r) => r.field.startsWith("structure."));
    const content = unexplained.filter((r) => r.field.startsWith("content."));
    const other = unexplained.filter((r) => !pageLevel.includes(r)
        && !structure.includes(r) && !content.includes(r));

    const lines = [];
    const total = records(afterDir).length;

    lines.push(`## ${key}`, "");
    lines.push(`${new Set(rows.map((r) => r.page)).size} of ${total} pages changed in all; `
        + `${new Set(expected.map((r) => r.page)).size} covered by --expect, `
        + `${new Set(unexplained.map((r) => r.page)).size} not.`);

    if (claims.length) {
        lines.push("", "Claimed as intended:");
        for (const c of claims) {
            // The empty glob claims the home page, whose path is "". Printed as
            // a name so the line does not read as a blank.
            const shown = c.glob === "" ? '"" (the home page)' : c.glob;
            lines.push(c.moved === 0
                ? `  ${shown} — matched NO changed page (${c.candidates} pages exist under it)`
                : `  ${shown} — ${c.moved} of ${c.candidates} pages under it changed`);
        }
    }

    if (!unexplained.length) {
        lines.push("", "Nothing unexplained.");
        return { key, lines, unexplained: 0 };
    }

    // Page-level findings go first and are never collapsed into a count: a page
    // the site stopped serving is the loudest thing this harness can find, and
    // it is one line either way.
    if (pageLevel.length) {
        lines.push("", `### Pages added, removed, or answering differently (${pageLevel.length})`, "");
        for (const r of pageLevel) {
            lines.push(r.field === "(whole page)"
                ? `  ${r.page || "(home)"} — ${r.text}`
                : `  ${r.page || "(home)"} ${r.field} — ${r.text}`);
        }
    }

    if (structure.length) {
        lines.push("", "### Unexplained structure changes — this is what `--check` gates on");
        lines.push(renderText(structure, total));
    }

    if (content.length) {
        const byField = new Map();
        for (const r of content) {
            if (!byField.has(r.field)) byField.set(r.field, new Set());
            byField.get(r.field).add(r.page);
        }
        lines.push("", "### Unexplained content changes — NOT gated by `--check`, context only", "");
        for (const [field, pages] of [...byField].sort((a, b) => b[1].size - a[1].size)) {
            lines.push(`  ${field} — ${pages.size} page(s)`);
        }
    }

    if (other.length) {
        lines.push("", `### Other (${other.length})`, "");
        for (const r of other) lines.push(`  ${r.page || "(home)"} ${r.field} — ${r.text}`);
    }

    return { key, lines, unexplained: new Set(unexplained.map((r) => r.page)).size };
};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const parseArgs = (argv) => {
    const expect = [];
    for (let i = 0; i < argv.length; i++) {
        // Presence, not truthiness: the home page's `path` is the EMPTY STRING,
        // so `--expect ""` is the only way to claim it and a falsy check would
        // drop it silently.
        if (argv[i] === "--expect" && i + 1 < argv.length) expect.push(argv[++i]);
    }
    const at = (flag) => {
        const i = argv.indexOf(flag);
        return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
    };
    return {
        expect,
        // Passed straight through to the harness, which owns the default. Null
        // here means "say nothing", so the harness's machine-derived value
        // stands rather than being overridden by a number chosen in this file.
        concurrency: Number(at("--concurrency")) || null,
        reportOnly: argv.includes("--report-only"),
        help: argv.includes("--help") || argv.includes("-h"),
    };
};

const USAGE = `Re-capture every committed characterization baseline after a deliberate site change.

  node scripts/site-characterization-rebaseline.mjs [--expect <glob>]...
  node scripts/site-characterization-rebaseline.mjs --report-only [--expect <glob>]...

  --expect <glob>   page paths whose change is intended; repeatable. Globs run
                    against record paths like "neighborhood-reports/harlem/",
                    where ** crosses / and * does not.
  --report-only     re-classify the last run's snapshot without sweeping again.
  --concurrency N   browser pages in flight, passed through to the harness.
                    Omit it and the harness picks from the machine. Lowering it
                    is a WORKAROUND for an undiagnosed sweep failure, not a fix
                    — see Task 17 in the plan.

Never commits. Review the re-captured baseline, then commit it yourself.`;

// Which baselines are committed, and can therefore be re-captured. Discovered
// rather than listed, so adding a `production` baseline needs no edit here.
const committedKeys = () => {
    if (!existsSync(BASELINE_ROOT)) return [];
    return readdirSync(BASELINE_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(`${BASELINE_ROOT}/${d.name}/${META_FILE}`))
        .map((d) => d.name)
        .sort();
};

async function main() {

    const { expect, reportOnly, help, concurrency } = parseArgs(process.argv.slice(2));

    if (help) {
        console.log(USAGE);
        return;
    }

    const keys = committedKeys();

    if (!keys.length) {
        console.error(`No committed baselines under ${BASELINE_ROOT}/. Nothing to re-capture.`);
        process.exit(2);
    }

    const unknown = keys.filter((k) => !ENVIRONMENT_FOR[k]);
    if (unknown.length && !reportOnly) {
        console.error(`No environment mapped for baseline key(s): ${unknown.join(", ")}.\n`
            + `Add them to ENVIRONMENT_FOR in this file.`);
        process.exit(2);
    }

    if (!reportOnly) {

        // The before-side has to be restorable with one `git checkout --`, and
        // the resulting diff has to be the proof that only this run wrote it.
        // Both stop being true if the tree was already dirty here.
        const dirty = git("status", "--porcelain", "--", BASELINE_ROOT);
        if (dirty) {
            console.error(`${BASELINE_ROOT}/ has uncommitted changes:\n${dirty}\n\n`
                + `Commit or discard them first — this run overwrites that directory, and a `
                + `dirty starting point makes the resulting diff unreadable as evidence.`);
            process.exit(2);
        }

        if (await responds(`http://localhost:${PORT}/`)) {
            console.error(`Something is already answering on :${PORT}. `
                + `This script needs that port for its own servers.`);
            process.exit(2);
        }

        const head = git("rev-parse", "HEAD");
        console.log(`HEAD ${head}`);
        console.log(`Re-capturing ${keys.length} baseline(s): ${keys.join(", ")}`);
        console.log(`Isolated builds under ${ISO_ROOT}`);

        mkdirSync(BEFORE_DIR, { recursive: true });

        for (const key of keys) await recapture(key, concurrency);

        // Failure mode 2 from the header, asserted rather than hoped for: every
        // key must now describe the same commit, or the set is internally
        // inconsistent and a later --check will be comparing across commits.
        const heads = keys.map((k) => [k, readMeta(`${BASELINE_ROOT}/${k}`)?.gitHead ?? "(none)"]);
        const disagree = heads.filter(([, h]) => h !== head);
        if (disagree.length) {
            console.error(`\nBaseline gitHead mismatch — expected every key at ${head}:`);
            for (const [k, h] of heads) console.error(`  ${k}: ${h}`);
            process.exit(2);
        }
        console.log(`\nAll ${keys.length} baselines re-captured at ${head}.`);
    }

    // ------------------------------------------------------------------- //
    // the report
    // ------------------------------------------------------------------- //

    const results = keys.filter((k) => existsSync(`${BEFORE_DIR}/${k}`)).map((k) => classify(k, expect));

    const report = [
        `# Characterization re-baseline`,
        "",
        `Generated ${new Date().toISOString()} at ${git("rev-parse", "HEAD")}.`,
        "",
        expect.length
            ? `Claimed as intended: ${expect.map((g) => `\`${g}\``).join(", ")}`
            : `Nothing was claimed as intended — every change below is unexplained by construction. `
              + `That first report IS the review; add --expect globs as you confirm each group.`,
        "",
        ...results.flatMap((r) => [...r.lines, ""]),
    ].join("\n");

    mkdirSync(WORK_DIR, { recursive: true });
    writeFileSync(REPORT_FILE, report + "\n");

    console.log(`\n${report}`);
    console.log(`\nReport written to ${REPORT_FILE}`);

    const unexplained = results.reduce((n, r) => n + r.unexplained, 0);

    if (unexplained) {
        console.log(`\n${unexplained} page(s) changed that nothing claimed. Review them, then either `
            + `add --expect globs and re-run with --report-only, or fix what they found.`);
    }

    console.log(`\nNothing has been committed. To keep this re-baseline:`);
    console.log(`  git add ${BASELINE_ROOT}`);
    console.log(`To discard it:`);
    console.log(`  git checkout -- ${BASELINE_ROOT}`);

    process.exitCode = unexplained ? 1 : 0;
}

// A server that never answers, or a Hugo that will not build, throws out of
// recapture(). Reported as a message and exit 2 — the code this harness family
// uses for "could not be compared at all" — rather than as an unhandled
// rejection, which reads like a crash in the tool instead of a failed run.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((e) => {
        console.error(`\n${String(e?.message ?? e)}`);
        process.exit(2);
    });
}
