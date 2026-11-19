// Compare the rendered STRUCTURE of two trees of this site — usually a PR (or
// your working tree) against the branch it will merge into — and report what
// changed.
//
//   node scripts/site-characterization-compare.mjs [environment] [sample]
//        [--base <ref> | --base-tree <dir>] [--expect <glob>]... [--content]
//        [--report <file.md>] [--report-only]
//
// Why this exists instead of a committed baseline: a baseline has to be
// re-captured whenever anything intended changes, and a report-only check that
// nobody re-baselines accumulates every merged change since the last capture.
// Capturing both sides in the same run means the report is exactly "what this
// tree changes", and both sides fetch EHDP-data minutes apart, so a data change
// moves both and cancels out. Plan and decisions:
// documents/characterization-pr-diff-plan-2026-11-18.md.
//
// Exit codes:
//   0  no difference that an --expect glob did not claim (or --report-only)
//   1  an unclaimed difference (strict, the local default)
//   2  the comparison itself could not be made — bad arguments, a port in use,
//      a server that would not build, a page that would not load, or Pagefind
//      served on one side only. Never "no changes": a report that did not run
//      must not read like one that found nothing.

import { execFileSync, execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { fetchDataCommit, githubSlug, project, recapture, walk } from "./site-characterization.mjs";
import { renderMarkdown, renderText, summarize } from "./site-characterization-summary.mjs";
import { startServer } from "./isolated-server.mjs";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Head on the port every earlier isolated caller used; base beside it. Both are
// off dev-server.mjs's probe list (8080, 8081, 1313), so no other harness run
// can discover these servers and sweep them by mistake.
const HEAD_PORT = 8090;
const BASE_PORT = 8091;

// Inside the repo and short: `git diff --no-index`-style tooling fails silently
// on long paths, and the CI artifact upload reads from here. Git-ignored.
const WORK_DIR = "scripts/.sc-compare";

// The local base worktree. A short path for the same reason, and outside the
// repo so it can never be committed or swept by a repo-wide grep.
const BASE_WORKTREE = `${tmpdir().replace(/\\/g, "/")}/sc-base`;
const LOCK_STAMP = `${BASE_WORKTREE}/.sc-lock-hash`;

// Same cap and same reasoning as the old --check: re-capturing guards against a
// per-page capture race, and a race does not reach dozens of pages at once — a
// difference that wide is systematic, and arbitrating it costs minutes for an
// answer that will not change.
const ARBITRATION_CAP = 25;

// The first line of every report. The CI comment job finds its own earlier
// comment by this, so it edits one comment per PR rather than adding one per push.
export const REPORT_MARKER = "<!-- site-characterization-report -->";

// How many page names the markdown report lists before saying "and N more".
// The field table above it already counts every page; the list is for clicking.
const MAX_LISTED_PAGES = 50;

// ----------------------------------------------------------------------- //
// arguments
// ----------------------------------------------------------------------- //

const environments = () => readdirSync(`${REPO_ROOT}/config`, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_default")
    .map((e) => e.name)
    .sort();

const USAGE = `Usage:
  node scripts/site-characterization-compare.mjs [environment] [sample]
       [--base <ref> | --base-tree <dir>] [--expect <glob>]... [--content]
       [--report <file.md>] [--report-only]

  environment     any directory in config/ (default prod_prod)
  sample          the curated one-page-per-template list instead of every page
  --base <ref>    the base to compare against (default production — the LOCAL
                  branch; a warning prints when it is behind origin)
  --base-tree     an already-prepared checkout to use as the base (CI)
  --expect <glob> claim the pages a glob matches as intended; repeatable.
                  "**" crosses "/", "*" does not
  --content       compare titles, heading text and link targets too
  --report <f>    also write the markdown report to <f>
  --report-only   exit 0 on differences (CI); still 2 on a harness failure

Through npm only the two positionals survive: npm run characterize:site:env dev_stage sample`;

const usage = (message) => {
    console.error(`${message}\n\n${USAGE}`);
    process.exit(2);
};

// Every flag that takes a value. Anything else starting with "-" is unknown and
// refused: an argument silently ignored is indistinguishable from a typo, which
// is how the old re-baseline tool came to re-capture every baseline on a
// mistyped key (CLAUDE.md, "Arguments to these are POSITIONAL").
const VALUE_FLAGS = new Set(["--base", "--base-tree", "--expect", "--report"]);
const BARE_FLAGS = new Set(["--content", "--report-only"]);

const parseArgs = (argv) => {

    const opts = { environment: "prod_prod", sample: false, base: null, baseTree: null,
        expect: [], content: false, report: null, reportOnly: false };
    const positionals = [];

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (VALUE_FLAGS.has(a)) {
            const v = argv[++i];
            if (v === undefined || v.startsWith("--")) usage(`${a} needs a value.`);
            if (a === "--base") opts.base = v;
            if (a === "--base-tree") opts.baseTree = v;
            if (a === "--expect") opts.expect.push(v);
            if (a === "--report") opts.report = v;
        } else if (BARE_FLAGS.has(a)) {
            if (a === "--content") opts.content = true;
            if (a === "--report-only") opts.reportOnly = true;
        } else if (a.startsWith("-")) {
            usage(`Unknown option "${a}".`);
        } else {
            positionals.push(a);
        }
    }

    if (positionals.length > 2) usage(`Expected at most an environment and "sample", got ${positionals.length} words.`);
    const [env, mode] = positionals;
    if (env !== undefined) {
        if (env === "sample" && mode === undefined) opts.sample = true;
        else opts.environment = env;
    }
    if (mode !== undefined) {
        if (mode !== "sample") usage(`Second word must be "sample" or absent, not "${mode}".`);
        opts.sample = true;
    }
    if (!environments().includes(opts.environment)) usage(`No config/${opts.environment}/ in this repo.`);
    if (opts.base && opts.baseTree) usage("Give --base or --base-tree, not both.");
    if (!opts.baseTree && !opts.base) opts.base = "production";

    return opts;
};

// ----------------------------------------------------------------------- //
// the base tree
// ----------------------------------------------------------------------- //

const git = (args, cwd = REPO_ROOT) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const tryGit = (args, cwd) => {
    try { return git(args, cwd); } catch { return null; }
};

// The local branch is what gets compared — never origin/<ref>, by the same rule
// that branches are cut from local branches here. Being behind is reported, not
// silently fixed: a stale base puts other people's merged changes in your report,
// and the fix (update the branch) is the user's to make.
const warnIfBehind = (ref) => {
    if (!tryGit(["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${ref}`])) return;
    const behind = Number(tryGit(["rev-list", "--count", `${ref}..origin/${ref}`]) ?? 0);
    if (behind > 0) {
        console.warn(`WARNING: local ${ref} is ${behind} commit(s) behind origin/${ref}. The report will `
            + `include whatever those commits change as if this tree changed it. Update ${ref} to compare `
            + `against what is actually merged.`);
    }
};

// A detached worktree of <ref>, reused across runs. node_modules is needed
// because Hugo mounts it into assets/, and each tree builds with its own
// lockfile's Hugo. `npm ci` is skipped when the lockfile is unchanged since the
// last run, which is the common case and saves a minute or so per run.
const prepareBaseWorktree = (ref) => {

    // Thrown, not process.exit(): main() has already fetched by now (the port
    // probe), and it turns any throw from here into exit 2.
    const sha = tryGit(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
    if (!sha) throw new Error(`--base ${ref} does not name a commit.`);
    warnIfBehind(ref);

    const worktrees = git(["worktree", "list", "--porcelain"]);
    const registered = worktrees.split("\n")
        .some((l) => l.startsWith("worktree ") && resolve(l.slice(9)) === resolve(BASE_WORKTREE));

    if (!registered) {
        if (existsSync(BASE_WORKTREE)) {
            throw new Error(`${BASE_WORKTREE} exists but is not a worktree of this repo. Remove it and re-run.`);
        }
        console.log(`Creating the base worktree at ${BASE_WORKTREE}`);
        git(["worktree", "add", "--detach", BASE_WORKTREE, sha]);
    } else {
        git(["checkout", "--detach", "--force", sha], BASE_WORKTREE);
    }

    const lockHash = git(["rev-parse", `${sha}:package-lock.json`]);
    const stamped = existsSync(LOCK_STAMP) ? readFileSync(LOCK_STAMP, "utf8").trim() : null;
    if (stamped !== lockHash || !existsSync(`${BASE_WORKTREE}/node_modules`)) {
        console.log("Installing the base tree's dependencies (npm ci)");
        execSync("npm ci --no-audit --no-fund", { cwd: BASE_WORKTREE, stdio: ["ignore", "ignore", "inherit"] });
        writeFileSync(LOCK_STAMP, lockHash + "\n");
    }

    return { dir: BASE_WORKTREE, sha };
};

// ----------------------------------------------------------------------- //
// serving and capturing
// ----------------------------------------------------------------------- //

// Any HTTP answer at all means the port is taken. responds() in
// isolated-server.mjs asks for a 200 on "/", which a server under a path prefix
// such as /IndicatorPublic/ answers with a 404 — so it would miss exactly the
// server most likely to be left running.
const portBusy = async (port) => {
    try {
        await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(3000) });
        return true;
    } catch {
        return false;
    }
};

const pagefindServed = async (baseURL) => {
    try {
        const res = await fetch(`${baseURL}pagefind/pagefind.js`, { signal: AbortSignal.timeout(3000) });
        return res.status === 200;
    } catch {
        return false;
    }
};

// One side: build the search index into its publishDir, then drive the existing
// harness's --out mode against it. Driven as a child process, like every other
// caller of the harness, so there is one implementation of the sweep.
const captureSide = (side, server, sample) => {
    const outDir = `${WORK_DIR}/${side}`;
    execSync(`npx -y pagefind --site "${server.destDir}"`, { cwd: REPO_ROOT, stdio: "ignore" });
    console.log(`\n=== capturing ${side} (${server.baseURL}) ===`);
    const args = ["scripts/site-characterization.mjs", "--out", outDir];
    if (!sample) args.push("--all");
    execFileSync(process.execPath, args, {
        cwd: REPO_ROOT,
        stdio: "inherit",
        env: { ...process.env, DE_BASE_URL: server.baseURL, DE_SERVER_OWNED: "1" },
    });
    return outDir;
};

// The EHDP-data repo and branch the site fetches, read off the served page:
// head.html declares them as inline-script `let`s, so they are not window
// properties and need the typeof guard.
const readDataSource = async (browser, baseURL) => {
    const page = await browser.newPage();
    try {
        await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30000 });
        return await page.evaluate(() => ({
            repo: typeof data_repo === "undefined" ? null : data_repo,
            branch: typeof data_branch === "undefined" ? null : data_branch,
        }));
    } finally {
        await page.close();
    }
};

// ----------------------------------------------------------------------- //
// comparing
// ----------------------------------------------------------------------- //

const readRecord = (dir, rel) => JSON.parse(readFileSync(`${dir}/${rel}`, "utf8"));

// Relative record files whose PROJECTED records differ, over the union of both
// trees. Projected, so a content-only edit (new copy on an existing page) is not
// a structural difference unless --content asked for it. The union matters: the
// harness's own differingPaths() walks one side only, so a page that exists on
// the head side alone would never be noticed there.
const differingRels = (baseProj, headProj) => {
    const rels = [...new Set([...walk(baseProj), ...walk(headProj)])].sort();
    const differ = rels.filter((rel) => {
        const a = `${baseProj}/${rel}`;
        const b = `${headProj}/${rel}`;
        if (!existsSync(a) || !existsSync(b)) return true;
        return readFileSync(a, "utf8") !== readFileSync(b, "utf8");
    });
    return { rels, differ };
};

// Copied verbatim from site-characterization-rebaseline.mjs, which this
// replaces. A glob over record paths — "", "404.html",
// "neighborhood-reports/bayside_little_neck/" — where `**` crosses separators
// and `*` does not. `**` goes through a placeholder first so the single-star
// rule cannot eat half of it.
const globToRegExp = (glob) => {
    const escaped = glob.replace(/[.+^${}()|[\]\\?]/g, "\\$&");
    const body = escaped.replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*");
    return new RegExp(`^${body}$`);
};

// Changed pages split into the ones an --expect glob claimed and the rest, plus
// per glob how many pages it claimed — a glob that claims nothing is usually a
// typo, and saying so is cheaper than a silent pass.
const partition = (rows, globs) => {
    const patterns = globs.map((g) => ({ glob: g, re: globToRegExp(g) }));
    const pages = [...new Set(rows.map((r) => r.page))];
    const claimedBy = (page) => patterns.some((p) => p.re.test(page));
    return {
        expected: pages.filter(claimedBy),
        unexplained: pages.filter((p) => !claimedBy(p)),
        claims: patterns.map(({ glob, re }) => ({ glob, matched: pages.filter((p) => re.test(p)).length })),
    };
};

// ----------------------------------------------------------------------- //
// the markdown report
// ----------------------------------------------------------------------- //

const shortSha = (sha) => (sha ? sha.slice(0, 10) : "unknown");

// shapeOf()'s "Fields:" line was written for a committed baseline, where
// EHDP-data could have moved since the capture and "re-run at the merge base"
// was the right advice. Here both sides fetch the same data branch minutes
// apart, so that advice is wrong; say what this comparison can and cannot rule
// out instead. Task 4 of the plan removes the baseline wording at its source.
const FIELDS_LINE = /^Fields: .*$/m;
const COMPARE_FIELDS = "Fields: both sides fetched the same EHDP-data branch minutes apart, so a data "
    + "change would have moved both and cancelled out; what is left came from the head tree.";
// summarize()'s one-sided rows say "baseline" and "this run" for the same reason.
const compareWording = (text) => text
    .replace(FIELDS_LINE, COMPARE_FIELDS)
    .replaceAll("new, absent from the baseline", "new in head")
    .replaceAll("in the baseline, absent from this run", "removed in head");

const pageList = (pages) => {
    const shown = pages.slice(0, MAX_LISTED_PAGES).map((p) => `\`${p || "(home)"}\``).join(", ");
    return pages.length > MAX_LISTED_PAGES ? `${shown}, and ${pages.length - MAX_LISTED_PAGES} more` : shown;
};

const buildMarkdown = ({ opts, base, head, dataLine, rows, totalPages, part, cleared, capped }) => {

    const changedPages = [...new Set(rows.map((r) => r.page))];
    const lines = [
        REPORT_MARKER,
        `## Site characterization: ${changedPages.length ? `${changedPages.length} page(s) changed` : "no structural changes"}`,
        "",
        `Compared \`${opts.environment}\` builds of **base** \`${shortSha(base.sha)}\` and **head** `
            + `\`${shortSha(head.sha)}\`${head.dirty ? " (plus uncommitted changes)" : ""}, `
            + `${opts.sample ? "sample pages" : "every page"}, `
            + `${opts.content ? "structure and content" : "structure only"}. ${dataLine}`,
        "",
    ];

    if (!rows.length) {
        lines.push(`No differences across ${totalPages} pages.`);
    } else {
        // renderMarkdown's own "###" heading is dropped in favour of the "##" above.
        lines.push(compareWording(renderMarkdown(rows, totalPages, "Changed fields").replace(/^### .*\n\n/, "")));
        if (part) {
            lines.push(`**Claimed by --expect:** ${part.expected.length ? pageList(part.expected) : "none"}`, "");
            lines.push(`**Not claimed:** ${part.unexplained.length ? pageList(part.unexplained) : "none"}`, "");
            for (const c of part.claims.filter((x) => x.matched === 0)) {
                lines.push(`- \`--expect ${c.glob}\` matched no changed page — a typo, or a prediction that did not happen.`);
            }
        } else {
            lines.push(`**Pages:** ${pageList(changedPages)}`, "");
        }
    }

    if (cleared.length) {
        lines.push("", `${cleared.length} page(s) differed under concurrency and matched on a sequential `
            + `re-capture, so they are not counted: ${pageList(cleared)}`);
    }
    if (capped) {
        lines.push("", `More than ${ARBITRATION_CAP} pages differed, so none was re-captured to rule out a `
            + "capture race. A difference that wide is systematic; treat each as real.");
    }

    return lines.join("\n") + "\n";
};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const main = async () => {

    const opts = parseArgs(process.argv.slice(2));

    for (const port of [HEAD_PORT, BASE_PORT]) {
        if (await portBusy(port)) {
            console.error(`Something is already answering on :${port}. This script needs it for its own `
                + "server. If a previous run was interrupted, look for a surviving hugo by its CommandLine.");
            return 2;
        }
    }

    // Which trees. Head is always this checkout, including uncommitted edits —
    // that is what a local strict run is for.
    let base;
    try {
        base = opts.baseTree
            ? { dir: resolve(opts.baseTree), sha: tryGit(["rev-parse", "HEAD"], resolve(opts.baseTree)) }
            : prepareBaseWorktree(opts.base);
    } catch (e) {
        console.error(`Could not prepare the base tree: ${e.message}`);
        return 2;
    }
    if (!existsSync(`${base.dir}/config/${opts.environment}`)) {
        console.error(`The base tree ${base.dir} has no config/${opts.environment}/.`);
        return 2;
    }
    const head = {
        dir: REPO_ROOT,
        sha: tryGit(["rev-parse", "HEAD"]),
        dirty: Boolean(tryGit(["status", "--porcelain", "--untracked-files=no"])),
    };
    console.log(`Base: ${opts.baseTree ?? opts.base} @ ${shortSha(base.sha)}`);
    console.log(`Head: this checkout @ ${shortSha(head.sha)}${head.dirty ? " + uncommitted changes" : ""}`);

    rmSync(WORK_DIR, { recursive: true, force: true });
    mkdirSync(WORK_DIR, { recursive: true });

    const servers = {};
    let browser = null;

    try {
        // Sequential starts, so two cold builds do not compete for the CPU.
        try {
            servers.base = await startServer(opts.environment, { cwd: base.dir, port: BASE_PORT, tag: "sc-base" });
        } catch (e) {
            console.error(`\nThe BASE tree did not build or serve: ${e.message}`);
            return 2;
        }
        try {
            servers.head = await startServer(opts.environment, { cwd: head.dir, port: HEAD_PORT, tag: "sc-head" });
        } catch (e) {
            console.error(`\nThe HEAD tree (this checkout) did not build or serve: ${e.message}`);
            return 2;
        }

        // Sequential captures for the same reason; each one already runs its
        // pages concurrently.
        let baseDir;
        let headDir;
        try {
            baseDir = captureSide("base", servers.base, opts.sample);
            headDir = captureSide("head", servers.head, opts.sample);
        } catch {
            console.error("\nA capture did not complete — the harness output above names the pages. No report.");
            return 2;
        }

        // A searched site against an unsearched one moves controls.button and
        // controls.input on every page, which would bury everything else.
        const pf = { base: await pagefindServed(servers.base.baseURL), head: await pagefindServed(servers.head.baseURL) };
        if (pf.base !== pf.head) {
            console.error(`Pagefind is served on the ${pf.base ? "base" : "head"} side only; every page would `
                + "differ on the search UI. No report.");
            return 2;
        }

        const keys = opts.content ? ["structure", "content"] : ["structure"];
        const baseProj = `${WORK_DIR}/proj/base`;
        const headProj = `${WORK_DIR}/proj/head`;
        const projectBoth = () => {
            project(baseDir, baseProj, keys);
            project(headDir, headProj, keys);
            return differingRels(baseProj, headProj);
        };

        let { rels, differ } = projectBoth();

        // Arbitrate pages present on both sides: re-capture each alone on both
        // servers. A page on one side only is a real difference and needs none.
        const both = differ.filter((rel) => existsSync(`${baseDir}/${rel}`) && existsSync(`${headDir}/${rel}`));
        const capped = both.length > ARBITRATION_CAP;
        let cleared = [];

        browser = await chromium.launch({ headless: true });
        const dataSource = await readDataSource(browser, servers.head.baseURL);

        if (both.length && !capped) {
            console.log(`\n${both.length} page(s) differ on both sides — re-capturing each one alone on both servers.`);
            const probe = await browser.newPage();
            const userAgent = (await probe.evaluate(() => navigator.userAgent)).replace("HeadlessChrome", "Chrome");
            await probe.close();
            const paths = both.map((rel) => readRecord(headDir, rel).path);
            for (const [side, dir] of [["base", baseDir], ["head", headDir]]) {
                const { baseURL } = servers[side];
                await recapture(browser, baseURL, userAgent, new URL(baseURL).pathname, dir, paths);
            }
            const before = new Set(both);
            ({ rels, differ } = projectBoth());
            const still = new Set(differ);
            cleared = [...before].filter((rel) => !still.has(rel)).map((rel) => readRecord(headDir, rel).path);
        } else if (capped) {
            console.log(`\n${both.length} pages differ — past the ${ARBITRATION_CAP}-page cap, so none is re-captured.`);
        }

        // The report.
        const rows = summarize(baseProj, headProj, rels);
        const totalPages = rels.length;
        const part = opts.expect.length ? partition(rows, opts.expect) : null;

        const dataCommit = await fetchDataCommit(dataSource.repo, dataSource.branch);
        const slug = githubSlug(dataSource.repo);
        const dataLine = dataCommit
            ? `EHDP-data \`${dataSource.branch}\` @ \`${shortSha(dataCommit.sha)}\`${slug ? ` (${slug})` : ""}.`
            : `EHDP-data \`${dataSource.branch ?? "unknown"}\` @ unknown.`;

        console.log("");
        console.log(rows.length ? compareWording(renderText(rows, totalPages)) : `No structural differences across ${totalPages} pages.`);
        if (cleared.length) console.log(`\nCleared on sequential re-capture: ${cleared.map((p) => p || "(home)").join(", ")}`);
        if (part) {
            console.log(`\nClaimed by --expect: ${part.expected.length}; not claimed: ${part.unexplained.length}`);
            for (const p of part.unexplained) console.log(`      ${p || "(home)"}`);
            for (const c of part.claims.filter((x) => x.matched === 0)) console.log(`  --expect ${c.glob} matched no changed page`);
        }

        const markdown = buildMarkdown({ opts, base, head, dataLine, rows, totalPages, part, cleared, capped });
        if (opts.report) {
            mkdirSync(dirname(resolve(opts.report)), { recursive: true });
            writeFileSync(opts.report, markdown);
            console.log(`\nReport written to ${opts.report}`);
        }
        if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

        // The verdict.
        const unclaimed = part ? part.unexplained.length : new Set(rows.map((r) => r.page)).size;
        if (!unclaimed) {
            console.log(`\nCharacterization compare: ${rows.length ? "every change claimed by --expect" : "no differences"}.`);
            return 0;
        }
        console.log(`\nCharacterization compare: ${unclaimed} page(s) changed${part ? " that no --expect claimed" : ""}.`);
        return opts.reportOnly ? 0 : 1;

    } finally {
        if (browser) await browser.close();
        for (const s of Object.values(servers)) s.stop();
    }
};

// process.exitCode rather than process.exit(): exiting straight after fetch()
// can abort Node on Windows with 127 (global CLAUDE.md, "process.exit() after a
// fetch()"). Exported REPORT_MARKER is the only reason to import this file.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().then((code) => { process.exitCode = code; }, (e) => {
        console.error(e);
        process.exitCode = 2;
    });
}
