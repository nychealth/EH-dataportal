// Run the smoke test against ONE named Hugo environment.
//
//   node scripts/smoke-env.mjs prod_prod            every page the site serves
//   node scripts/smoke-env.mjs prod_prod sample     the curated one-per-template list
//   npm run smoke:env prod_prod
//   npm run smoke:env prod_prod sample
//
// The smoke test itself needs no new flag: dev-server.mjs honours DE_BASE_URL
// and probes Pagefind on whatever it is pointed at. So the whole job here is
// starting the right server and pointing the harness at it — which is what
// isolated-server.mjs does, and what characterize-env.mjs already does for the
// characterization harness. This is that module's second caller.
//
// WHY per-environment smoke is worth a script, given that a console error is
// mostly environment-independent: two axes are not. head.html branches on the
// environment NAME, so only prod_prod gets production analytics and a
// non-noindex robots meta. And each environment pins its own data_branch, which
// changes the EHDP-data URLs the page fetches AT RUNTIME — a renamed or missing
// data file throws in the browser on one environment and not another. That is
// the class of failure smoke exists to catch and a green build cannot see.
//
// HOW THIS DIFFERS FROM `npm run smoke` / `npm run smoke:all`:
//
//   smoke, smoke:all   resolve a server through dev-server.mjs: reuse whatever
//                      answers on :8080/:8081/:1313, and failing that spawn
//                      dev_stage and build into the repo's own docs/ and
//                      resources/_gen. So WHICH environment gets checked
//                      depends on what you have running.
//   smoke:env X        ignores every running server, spawns X on :8090 with
//                      both writable outputs redirected outside the repo, and
//                      stops it afterwards. Deterministic, and it leaves docs/
//                      and resources/_gen untouched.
//
// The page set is the full site by default and the curated list with `sample`.
// Note that a cold Hugo build runs either way, so `sample` saves the sweep and
// not the build — it is for narrowing WHAT is checked, not for a quick check.
//
// Arguments are POSITIONAL on purpose, and a `--flag` is rejected rather than
// half-honoured. Measured 2026-08-26 (npm 11.4.1, PowerShell): `npm run x --
// --env prod_prod` reaches the script as argv ["prod_prod"] — PowerShell eats
// the `--` and npm eats the flag NAME, leaving its value as a nameless
// positional. A bare positional survives both intact. Flags remain available by
// calling smoke-pages.mjs directly. Same contract as characterize-env.mjs; the
// full measurement table is in documents/characterize-env-plan-2026-08-26.md.

import { execFileSync, execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ISO_ROOT, PORT, responds, startServer } from "./isolated-server.mjs";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Where a full-site run leaves its JSON report — the same directory and the
// same timestamped filenames `npm run smoke:all` uses, so the two modes' runs
// sit side by side. Gitignored.
const REPORT_DIR = "scripts/smoke-reports/";

// Every environment config/ actually holds. Read from disk rather than listed
// here, so adding an environment needs no edit in this file — and so a typo is
// caught before a cold Hugo build, not after one.
const environments = () => readdirSync(`${REPO_ROOT}/config`, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_default")
    .map((e) => e.name)
    .sort();

// The optional second positional. A bare word rather than a flag, for the same
// reason the environment is: measured on the branch below, `npm run x local_prod
// extra` reaches the script as argv ["local_prod","extra"] — positionals survive
// npm and PowerShell intact where a `--flag` does not. Spelled out rather than
// accepted loosely, so a typo stops the run instead of silently sweeping 925
// pages when 33 were wanted.
const SAMPLE = "sample";

const usage = (message) => {
    console.error(`${message}\n`);
    console.error("  node scripts/smoke-env.mjs <environment> [sample]");
    console.error("  npm run smoke:env <environment> [sample]\n");
    console.error(`Environments: ${environments().join(", ")}\n`);
    console.error("Sweeps every page the site serves, like `npm run smoke:all`. Add the word");
    console.error(`\`${SAMPLE}\` for the curated one-page-per-template list instead, like \`npm run smoke\`.`);
    console.error("Flags are not accepted here — npm and PowerShell mangle them; for those, call");
    console.error("node scripts/smoke-pages.mjs directly.");
    process.exit(2);
};

async function main() {

    const args = process.argv.slice(2);

    const flag = args.find((a) => a.startsWith("-"));
    if (flag) usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (args.length < 1) usage("No environment given.");
    if (args.length > 2) usage(`Expected an environment and optionally "${SAMPLE}", got ${args.length} arguments.`);

    const [environment, mode] = args;
    if (!environments().includes(environment)) usage(`No config/${environment}/ in this repo.`);
    if (mode !== undefined && mode !== SAMPLE) usage(`Second argument must be "${SAMPLE}" or absent, not "${mode}".`);

    // Full site unless asked otherwise. --all is what makes smoke-pages.mjs
    // enumerate the site; without it, it reads its curated PAGES list.
    const sweepArgs = mode === SAMPLE ? [] : ["--all"];

    // Same guard characterize-env.mjs keeps, and it now guards against that
    // script too: :8090 is this port precisely because nothing else probes it,
    // so anything answering there is either a sibling run or a server a
    // previous run failed to reap.
    if (await responds(`http://localhost:${PORT}/`)) {
        console.error(`Something is already answering on :${PORT}. This script needs that port `
            + `for its own server. If a previous run was interrupted, look for a surviving hugo.`);
        process.exit(2);
    }

    console.log(`Isolated build under ${ISO_ROOT}`);
    const { baseURL, destDir, stop } = await startServer(environment);
    console.log(`  serving ${baseURL}`);

    try {
        // Not optional. `hugo server` never builds the search index, and
        // dev-server.mjs only builds one for servers it STARTS — a DE_BASE_URL
        // server gets a probe and nothing else. Without the index, PagefindUI
        // is undefined on every page: with the conditional allowlist entry
        // forced off, smoke failed 33 of 33 `[2026-08-24, recorded in
        // CLAUDE.md]`. Allowing it through the allowlist instead would work,
        // but would mean this mode alone never checks the search UI.
        //
        // Same command the deploy workflow runs.
        console.log("  building the Pagefind index");
        execSync(`npx -y pagefind --site "${destDir}"`, { cwd: REPO_ROOT, stdio: "ignore" });

        // Driven as a child rather than imported, for the reason
        // characterize-env.mjs gives: smoke-pages.mjs is a CLI that reads
        // process.argv and sets process.exitCode. DE_BASE_URL takes
        // ensureDevServer's path 1, which trusts the URL, probes Pagefind on it
        // and returns a no-op stop — teardown stays this script's job.
        execFileSync(process.execPath, ["scripts/smoke-pages.mjs", ...sweepArgs, "--report", REPORT_DIR], {
            cwd: REPO_ROOT,
            stdio: "inherit",
            env: { ...process.env, DE_BASE_URL: baseURL },
        });
    } catch (e) {
        // The harness's own output above names the failing pages. Its exit code
        // is the verdict and is passed straight through.
        process.exitCode = typeof e.status === "number" ? e.status : 1;
    } finally {
        stop();
        console.log(`  stopped the ${environment} server`);
    }
}

main();
