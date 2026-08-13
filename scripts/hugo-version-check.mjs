// Compare what two Hugo versions actually publish, before trusting an upgrade.
//
// A `hugo` build exiting 0 proves the templates compile. It does not prove the
// output is the same: between 0.147 and 0.164 this site kept building while
// Hugo's built-in alias template quietly dropped `<meta name="robots"
// content="noindex">` from 442 redirect stubs. Nothing in the build log said so.
// The only way to see that class of change is to render both versions and diff.
//
//   node scripts/hugo-version-check.mjs 0.164.0
//   node scripts/hugo-version-check.mjs 0.164.0 --baseline 0.147.3
//   node scripts/hugo-version-check.mjs 0.164.0 --environment dev_stage
//   node scripts/hugo-version-check.mjs 0.164.0 --keep      # keep build dirs
//
// NOTE: invoke with `node`, not `npm run ... --`. PowerShell eats the `--` in
// npm's argument-forwarding form, so the script would receive an empty argv and
// print this usage instead of running.
//
// Both builds are isolated: HUGO_RESOURCEDIR and -d point at temp directories,
// so neither touches the repo's shared resources/_gen fingerprint cache or
// docs/. That isolation is what makes it safe to run beside a dev server.
// Hugo binaries are fetched via npm into a cache outside the repo, so the
// repo's own node_modules and the hugo-extended pin are left alone.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CACHE = join(tmpdir(), "hugo-version-check");
const IS_WIN = process.platform === "win32";

// Hugo renames processed images when its image-processing hash changes, which it
// did between 0.147 and 0.164 for all 171 processed images. That is a real
// deploy consequence (every image URL changes) but it is not a content change,
// so it gets counted separately rather than drowning the semantic diff.
const IMAGE_HASH = /_hu_[0-9a-f]+/g;

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const VALUE_FLAGS = new Set(["--baseline", "--environment"]);

const flag = (name, fallback = null) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
};

// The positional argument is the target version. Skip flags and the values that
// belong to them, so `--baseline 0.147.3` cannot be mistaken for the target.
const positional = argv.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(argv[i - 1]));
const target = positional[0];
const environment = flag("environment", "prod_prod");
const keep = argv.includes("--keep");

if (!target) {
    console.error(`
Usage: node scripts/hugo-version-check.mjs <target-version> [options]

  --baseline <version>    version to compare against (default: the pin in package.json)
  --environment <env>     Hugo environment to build (default: prod_prod, what deploys)
  --keep                  keep the build output directories for manual inspection

Example: node scripts/hugo-version-check.mjs 0.164.0
`);
    process.exit(2);
}

// The baseline defaults to whatever the repo currently pins, so the comparison
// is against what actually ships rather than against a version someone typed.
// package.json and the workflows are pinned separately and can drift, so read
// both and say so when they disagree.
const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
const pinnedInPkg = (pkg.optionalDependencies?.["hugo-extended"] ?? "").replace(/^[\^~]/, "");
const baseline = flag("baseline", pinnedInPkg);

if (!baseline) {
    console.error("No baseline version found in package.json; pass --baseline <version>.");
    process.exit(2);
}

// ---------------------------------------------------------------------------
// Getting the binaries
// ---------------------------------------------------------------------------

// Locate the hugo executable inside an installed hugo-extended. The package has
// not kept one layout: 0.147.3 ships it as vendor/hugo.exe, 0.164.0 as
// bin/hugo.exe. Probe the known spots, then fall back to a search, so a third
// layout in some future version doesn't break the harness.
function findBinary(dir) {
    const pkgRoot = join(dir, "node_modules", "hugo-extended");
    const name = IS_WIN ? "hugo.exe" : "hugo";
    for (const sub of ["bin", "vendor", "dist", "."]) {
        const candidate = join(pkgRoot, sub, name);
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    const search = (root) => {
        if (!existsSync(root)) return null;
        for (const entry of readdirSync(root, { withFileTypes: true })) {
            const full = join(root, entry.name);
            if (entry.isDirectory()) {
                const hit = search(full);
                if (hit) return hit;
            } else if (entry.name === name) return full;
        }
        return null;
    };
    return search(pkgRoot);
}

// Install one hugo-extended into its own prefix under the cache and return the
// binary path. Installing under a version-specific prefix means repeat runs are
// free and two versions never contend for the same node_modules.
function hugoBinary(version) {
    const dir = join(CACHE, `v${version}`);

    let bin = findBinary(dir);
    if (!bin) {
        mkdirSync(dir, { recursive: true });
        console.log(`  fetching hugo-extended@${version} …`);
        const res = spawnSync(
            "npm",
            ["install", `hugo-extended@${version}`, "--no-audit", "--no-fund", "--no-save", "--prefix", dir],
            { cwd: dir, stdio: "pipe", shell: IS_WIN, encoding: "utf8" },
        );
        bin = findBinary(dir);
        if (res.status !== 0 || !bin) {
            console.error(`  could not install hugo-extended@${version}`);
            console.error((res.stderr || res.stdout || "").trim().split("\n").slice(-8).join("\n"));
            process.exit(1);
        }
    }
    return bin;
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

// Build the site with one binary into a temp destination. Returns the build log
// and exit status; a non-zero status is a finding, not a crash, so the caller
// decides what to report.
// `role` ("baseline" or "target") rather than version names the output dir, so
// that comparing a version against itself — the obvious way to sanity-check this
// script — really builds twice into two places instead of overwriting one and
// trivially reporting no differences. The resource cache stays keyed by version,
// since that is what makes repeat runs fast.
function build(version, bin, role) {
    const out = join(CACHE, `out-${role}-${version}`);
    const res = join(CACHE, `res-${version}`);
    rmSync(out, { recursive: true, force: true });

    const started = Date.now();
    const proc = spawnSync(bin, ["--environment", environment, "-d", out], {
        cwd: REPO,
        env: { ...process.env, HUGO_RESOURCEDIR: res },
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });

    return {
        out,
        status: proc.status,
        seconds: ((Date.now() - started) / 1000).toFixed(1),
        log: `${proc.stdout ?? ""}${proc.stderr ?? ""}`,
    };
}

// Every file under a directory, as paths relative to it, with POSIX separators
// so the two builds' listings compare directly.
function listFiles(root) {
    const found = [];
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else found.push(relative(root, full).split(sep).join("/"));
        }
    };
    if (existsSync(root)) walk(root);
    return found.sort();
}

// ---------------------------------------------------------------------------
// Reporting helpers
// ---------------------------------------------------------------------------

const heading = (text) => console.log(`\n${text}\n${"-".repeat(text.length)}`);
const bullet = (text) => console.log(`  ${text}`);

// Hugo prints deprecation warnings that are easy to lose in a long build log,
// and they are the early-warning system for the NEXT upgrade: today's WARN is
// the version-after-next's hard error. Pull them out and de-duplicate.
function deprecations(log) {
    const seen = new Map();
    for (const line of log.split("\n")) {
        if (!/deprecated/i.test(line)) continue;
        // Collapse per-language repeats (languages.es.x, languages.zh.x) so one
        // config mistake reports once rather than once per language.
        const key = line.trim().replace(/languages\.[a-z-]+\./g, "languages.<lang>.");
        seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return seen;
}

// Line-level change summary between two texts. This compares line multisets
// rather than computing a true diff: the question here is "what kinds of line
// changed across the whole site", and a multiset difference answers that
// directly and cheaply. It would misreport pure reordering, which Hugo output
// does not do within a file.
function changedLines(before, after) {
    const count = (text) => {
        const m = new Map();
        for (const line of text.split("\n")) {
            const t = line.trim();
            if (t) m.set(t, (m.get(t) ?? 0) + 1);
        }
        return m;
    };
    const a = count(before);
    const b = count(after);
    const removed = [];
    const added = [];
    for (const [line, n] of a) {
        const d = n - (b.get(line) ?? 0);
        if (d > 0) removed.push([line, d]);
    }
    for (const [line, n] of b) {
        const d = n - (a.get(line) ?? 0);
        if (d > 0) added.push([line, d]);
    }
    return { removed, added };
}

// Fold volatile substrings so that 400 pages differing only by URL or timestamp
// collapse into one reportable pattern.
const generalize = (line) =>
    line
        .replace(/https?:\/\/[^"'<>\s]+/g, "URL")
        .replace(/\b[0-9a-f]{16,}\b/g, "HASH")
        .replace(/\b\d{2}:\d{2}:\d{2}\b/g, "TIME");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nHugo version check: ${baseline}  ->  ${target}   (environment: ${environment})`);

// Fingerprint the working tree. The two builds run minutes apart against the
// same checkout, so anything that edits content in between — switching branches,
// a save from an editor — lands in one build and not the other and shows up as a
// version difference that is not one. This happened during development of this
// script: a mid-run branch switch produced two phantom taxonomy-title changes
// that vanished on a stable tree. Cheap to detect, expensive to chase.
function treeState() {
    try {
        const opts = { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
        const head = execFileSync("git", ["rev-parse", "HEAD"], opts).trim();
        const dirty = execFileSync("git", ["status", "--porcelain"], opts).trim();
        return `${head}:${dirty.length}`;
    } catch {
        return null; // not a git checkout — skip the guard rather than fail
    }
}
const treeBefore = treeState();

// A workflow pin that disagrees with package.json means the version this script
// calls "baseline" is not the version that builds the live site.
const workflowPins = new Set();
const wfDir = join(REPO, ".github", "workflows");
if (existsSync(wfDir)) {
    for (const f of readdirSync(wfDir)) {
        const m = readFileSync(join(wfDir, f), "utf8").match(/hugo-version:\s*"([^"]+)"/g) ?? [];
        for (const hit of m) workflowPins.add(hit.match(/"([^"]+)"/)[1]);
    }
}
if (workflowPins.size && !workflowPins.has(baseline)) {
    bullet(`NOTE: workflows pin ${[...workflowPins].join(", ")}, package.json pins ${pinnedInPkg}.`);
}

heading("1. Binaries");
const bins = { [baseline]: hugoBinary(baseline), [target]: hugoBinary(target) };
for (const [v, bin] of Object.entries(bins)) {
    bullet(`${v}: ${execFileSync(bin, ["version"], { encoding: "utf8" }).trim()}`);
}

heading("2. Builds");
const builds = {};
for (const [role, v] of [["baseline", baseline], ["target", target]]) {
    builds[role] = build(v, bins[v], role);
    const b = builds[role];
    bullet(`${v} (${role}): exit ${b.status} in ${b.seconds}s`);
}

// A build that fails is the whole answer — report the error and stop, rather
// than diffing against a directory that was never fully written.
for (const role of ["baseline", "target"]) {
    if (builds[role].status !== 0) {
        heading(`BUILD FAILED on ${role === "baseline" ? baseline : target} — upgrade is blocked`);
        // Hugo's fatal error can run to many lines (a rejected security policy
        // prints the whole active config), so print from the first ERROR on
        // rather than grepping single lines out of it.
        const log = builds[role].log;
        const start = log.search(/^ERROR/m);
        console.log(start === -1 ? log.slice(-3000) : log.slice(start));

        heading("Deprecation warnings (still worth fixing)");
        const found = deprecations(log);
        if (!found.size) bullet("none");
        for (const [line, n] of found) bullet(`${n}x  ${line.replace(/^WARN\s+deprecated:\s*/, "")}`);
        process.exit(1);
    }
}

// A tree that moved between the two builds invalidates every number below it,
// so say so loudly rather than reporting a diff nobody can trust.
const treeAfter = treeState();
if (treeBefore && treeAfter && treeBefore !== treeAfter) {
    heading("!! WORKING TREE CHANGED DURING THE RUN");
    bullet("The two builds saw different source content, so the differences below mix");
    bullet("version changes with content changes. Re-run on a settled tree.");
}

heading("3. Deprecation warnings");
const targetDeprecations = deprecations(builds.target.log);
const baselineDeprecations = deprecations(builds.baseline.log);
if (!targetDeprecations.size) {
    bullet("none");
} else {
    for (const [line, n] of targetDeprecations) {
        const isNew = !baselineDeprecations.has(line);
        bullet(`${isNew ? "NEW " : "    "}${n}x  ${line.replace(/^WARN\s+deprecated:\s*/, "")}`);
    }
    bullet("");
    bullet("These are warnings now and hard errors in a later release — fix them before the next upgrade.");
}

heading("4. Published files");
const filesBase = listFiles(builds.baseline.out);
const filesTarget = listFiles(builds.target.out);
const setBase = new Set(filesBase);
const setTarget = new Set(filesTarget);
const onlyTarget = filesTarget.filter((f) => !setBase.has(f));
const onlyBase = filesBase.filter((f) => !setTarget.has(f));

bullet(`${baseline}: ${filesBase.length} files`);
bullet(`${target}: ${filesTarget.length} files`);

// Separate "renamed because the image hash changed" from "genuinely appeared or
// disappeared". Only the latter is a broken or new URL.
//
// Count re-hashed FILES, not unique stripped names: one source image is resized
// into several variants that all strip to the same base name, so de-duplicating
// here would under-report the deploy churn by roughly half.
const strip = (f) => f.replace(IMAGE_HASH, "");
const renamedFrom = new Set(onlyBase.map(strip));
const renamedTo = new Set(onlyTarget.map(strip));
const reHashed = onlyTarget.filter((f) => renamedFrom.has(strip(f)));
const trulyAdded = onlyTarget.filter((f) => !renamedFrom.has(strip(f)));
const trulyRemoved = onlyBase.filter((f) => !renamedTo.has(strip(f)));

bullet(`ADDED:   ${trulyAdded.length}`);
bullet(`REMOVED: ${trulyRemoved.length}`);
for (const f of trulyRemoved.slice(0, 25)) console.log(`      - ${f}`);
for (const f of trulyAdded.slice(0, 25)) console.log(`      + ${f}`);
if (reHashed.length) {
    bullet("");
    bullet(`NOTE: ${reHashed.length} processed images change filename. Every one is a new URL on deploy,`);
    bullet("      so expect a large deploy diff and cold caches for those assets.");
}

heading("5. Content differences");
const common = filesTarget.filter((f) => setBase.has(f));

// Three tiers, narrowing from "any byte" to "something a reader would notice".
// Reporting all three is the point: a large tier-1 number with an empty tier-3
// is the signature of a pure formatting change in Hugo's built-in templates,
// which is exactly what the 0.147 -> 0.164 pagination and RSS changes were.
let differByte = 0;
let differNoHash = 0;
const semantic = [];
const lineCounts = new Map();

for (const f of common) {
    const [a, b] = await Promise.all([
        readFile(join(builds.baseline.out, f)),
        readFile(join(builds.target.out, f)),
    ]);
    if (a.equals(b)) continue;
    differByte++;

    // Only text formats can be compared line-wise; a differing binary is
    // reported at tier 1 and left alone.
    if (!/\.(html|xml|json|txt|css|js|svg|webmanifest)$/i.test(f)) continue;

    const textA = a.toString("utf8").replace(IMAGE_HASH, "");
    const textB = b.toString("utf8").replace(IMAGE_HASH, "");
    if (textA === textB) continue;
    differNoHash++;

    // Drop indentation AND blank lines. Hugo's built-in templates were
    // re-indented between these versions and the RSS template gained empty
    // lines where conditionals collapsed; neither reaches a reader, and
    // counting them would have inflated this tier by ~60 files.
    const squash = (t) =>
        t.split("\n").map((l) => l.replace(/[ \t]+/g, "")).filter(Boolean).join("\n");
    const squashA = squash(textA);
    const squashB = squash(textB);
    if (squashA === squashB) continue;
    semantic.push(f);

    const { removed, added } = changedLines(squashA, squashB);
    for (const [line, n] of removed) {
        const k = `- ${generalize(line)}`;
        lineCounts.set(k, (lineCounts.get(k) ?? 0) + n);
    }
    for (const [line, n] of added) {
        const k = `+ ${generalize(line)}`;
        lineCounts.set(k, (lineCounts.get(k) ?? 0) + n);
    }
}

bullet(`differ in any byte:                 ${differByte} / ${common.length}`);
bullet(`still differ ignoring image hashes: ${differNoHash}`);
bullet(`still differ ignoring whitespace:   ${semantic.length}   <- the ones that matter`);

if (semantic.length) {
    heading("6. What actually changed (most frequent first)");
    const ranked = [...lineCounts.entries()].sort((x, y) => y[1] - x[1]);
    for (const [line, n] of ranked.slice(0, 30)) {
        const shown = line.length > 150 ? `${line.slice(0, 150)}…` : line;
        console.log(`  ${String(n).padStart(5)}x  ${shown}`);
    }
    if (ranked.length > 30) bullet(`… and ${ranked.length - 30} more distinct changed lines`);

    heading("7. Most-affected pages");
    for (const f of semantic.slice(0, 15)) console.log(`  ${f}`);
    if (semantic.length > 15) bullet(`… and ${semantic.length - 15} more`);
}

heading("Next step");
bullet("A clean diff here still only covers rendered output. For runtime behaviour, run the");
bullet("smoke test against a server on the new version, and against the old one as a control:");
bullet("");
bullet(`  <cached-hugo> server --environment dev_stage -p 8080`);
bullet(`  DE_BASE_URL="http://localhost:8080/dev-stage/" node scripts/smoke-pages.mjs`);
bullet("");
bullet(`Cached binaries: ${CACHE}`);
if (keep) {
    bullet(`Build output kept: ${builds.baseline.out}  and  ${builds.target.out}`);
} else {
    for (const role of ["baseline", "target"]) rmSync(builds[role].out, { recursive: true, force: true });
}
console.log("");
