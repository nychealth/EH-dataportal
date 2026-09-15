// Run the characterization check against ONE named Hugo environment.
//
//   node scripts/characterize-env.mjs prod_prod            every page the site serves
//   node scripts/characterize-env.mjs prod_prod sample     the curated one-per-template list
//   node scripts/characterize-env.mjs prod_prod 8          every page, 8 in flight
//   npm run characterize:site:prod_prod
//   npm run characterize:site:env local_prod sample
//   npm run characterize:site:env local_prod sample 8
//
// The check itself needs no new flag: site-characterization.mjs derives the
// baseline key from the running site (prod_prod by environment name, otherwise
// by data branch). So the whole job here is starting the right server and
// pointing the harness at it — which is what isolated-server.mjs does, and what
// site-characterization-rebaseline.mjs already did for --baseline.
//
// HOW THIS DIFFERS FROM `npm run characterize:site`, which also ends in a
// --check and is the one to reach for by default:
//
//   characterize:site        resolves a server through dev-server.mjs: reuses
//                            whatever answers on :8080/:8081/:1313, and failing
//                            that spawns dev_stage and builds into the repo's
//                            own docs/ and resources/_gen. So WHICH environment
//                            it checks depends on what you have running.
//   characterize:site:env X  ignores every running server, spawns X on :8090
//                            with both writable outputs redirected outside the
//                            repo, and stops it afterwards. Deterministic, and
//                            it leaves docs/ and resources/_gen untouched.
//
// The page set is the whole site by default and the curated 41-page list with
// `sample`, matching `characterize:site` and `characterize:site:sample`. Note
// that a cold Hugo build and a Pagefind build run either way, so `sample` saves
// the sweep and not the build — it narrows WHAT is checked, not how long the
// command takes.
//
// Arguments are POSITIONAL on purpose. Measured 2026-08-26 (npm 11.4.1,
// PowerShell): `npm run x -- --env prod_prod` reaches the script as
// argv ["prod_prod"] — PowerShell eats the `--` and npm eats the flag NAME,
// leaving its value as a nameless positional. A bare positional survives both
// intact. So a `--flag` here is never what the caller thinks it is, and is
// rejected rather than half-honoured; flags remain available by calling
// site-characterization.mjs directly.

import { execFileSync, execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ISO_ROOT, PORT, responds, startServer } from "./isolated-server.mjs";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Every environment config/ actually holds. Read from disk rather than listed
// here, so adding an environment needs no edit in this file — and so a typo is
// caught before a cold Hugo build, not after one.
const environments = () => readdirSync(`${REPO_ROOT}/config`, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_default")
    .map((e) => e.name)
    .sort();

// The optional second positional. A bare word rather than a flag, for the same
// reason the environment is: `npm run x local_prod extra` reaches the script as
// argv ["local_prod","extra"] — positionals survive npm and PowerShell intact
// where a `--flag` does not. Spelled out rather than accepted loosely, so a typo
// stops the run instead of silently sweeping every page when 41 were wanted.
const SAMPLE = "sample";

// The other optional positional, and the reason it exists rather than being left
// to the harness: this script spawns a SECOND Hugo server, so it runs on a
// machine that is by definition already busy. At the harness default of
// min(24, cores) beside a dev server on this box, a run on 2026-09-14 lost 62
// pages to `page.goto` timeouts and refused a verdict; the same sweep at 8
// captured 1285 of 1285. Lowering it is a workaround for an undiagnosed sweep
// failure and not a fix — Task 17 of documents/site-characterization-plan-2026-08-23.md
// is where that is being chased — but with no way to pass one, the alternative
// was a hand-written copy of this file, which is what happened twice.
//
// Digits only, so it cannot be confused with a mistyped `sample`. Note what npm
// does to the flag form: `npm run characterize:site:env prod_prod --concurrency 8`
// arrives here as ["prod_prod","8"], which this now reads as the caller meant.
const isConcurrency = (arg) => /^[1-9][0-9]*$/.test(arg);

const usage = (message) => {
    console.error(`${message}\n`);
    console.error("  node scripts/characterize-env.mjs <environment> [sample] [concurrency]");
    console.error("  npm run characterize:site:env <environment> [sample] [concurrency]\n");
    console.error(`Environments: ${environments().join(", ")}\n`);
    console.error("Checks every page the site serves, like `npm run characterize:site`. Add the");
    console.error(`word \`${SAMPLE}\` for the curated one-page-per-template list instead, like`);
    console.error("`npm run characterize:site:sample`.\n");
    console.error("A bare number is how many browser pages run in flight. Omit it and the harness");
    console.error("picks from the machine; lower it when this server is sharing the box with");
    console.error("another one.\n");
    console.error("Only `staging` (dev_stage, local_stage, prod_stage) and `prod_prod` have a");
    console.error("committed baseline; the rest exit 2 saying so. Flags are not accepted here —");
    console.error("npm and PowerShell mangle them; use node scripts/site-characterization.mjs.");
    process.exit(2);
};

async function main() {

    const args = process.argv.slice(2);

    const flag = args.find((a) => a.startsWith("-"));
    if (flag) usage(`This script takes no flags, and "${flag}" would not have survived npm intact.`);
    if (args.length < 1) usage("No environment given.");
    if (args.length > 3) usage(`Expected an environment and optionally "${SAMPLE}" and a concurrency, got ${args.length} arguments.`);

    const [environment, ...rest] = args;
    if (!environments().includes(environment)) usage(`No config/${environment}/ in this repo.`);

    // Each remaining argument must identify itself, and each may appear once —
    // a repeat means the caller believes it is setting two different things.
    let mode;
    let concurrency;
    for (const arg of rest) {
        if (arg === SAMPLE) {
            if (mode) usage(`"${SAMPLE}" given twice.`);
            mode = SAMPLE;
        } else if (isConcurrency(arg)) {
            if (concurrency) usage(`Two concurrencies given: "${concurrency}" and "${arg}".`);
            concurrency = arg;
        } else {
            usage(`Arguments after the environment must be "${SAMPLE}" or a number, not "${arg}".`);
        }
    }

    // Full site unless asked otherwise. --all is what makes site-characterization.mjs
    // sweep every page; without it, it reads its curated sample list.
    const sweepArgs = mode === SAMPLE ? ["--check"] : ["--check", "--all"];

    // Absent, say nothing: the harness owns the default, and passing a number
    // chosen here would override the machine-derived one on every run.
    if (concurrency) sweepArgs.push("--concurrency", concurrency);

    // Same guard the re-baseline tool keeps: :8090 is this port precisely
    // because nothing else probes it, so anything answering there is either a
    // sibling run or a server a previous run failed to reap.
    if (await responds(`http://localhost:${PORT}/`)) {
        console.error(`Something is already answering on :${PORT}. This script needs that port `
            + `for its own server. If a previous run was interrupted, look for a surviving hugo.`);
        process.exit(2);
    }

    console.log(`Isolated build under ${ISO_ROOT}`);
    const { baseURL, destDir, stop } = await startServer(environment);
    console.log(`  serving ${baseURL}`);

    try {
        // Not optional. The harness refuses to compare a searched site against
        // a search-less baseline, and both committed baselines carry the index
        // — so without this every run would exit 2 on the pagefind mismatch.
        // Same command the deploy workflow runs.
        console.log("  building the Pagefind index");
        execSync(`npx -y pagefind --site "${destDir}"`, { cwd: REPO_ROOT, stdio: "ignore" });

        // Driven as a child rather than imported, for the reason rebaseline.mjs
        // gives: site-characterization.mjs is a CLI that reads process.argv and
        // calls process.exit. DE_SERVER_OWNED tells dev-server.mjs we spawned
        // this server ourselves, so the run records the Hugo version as this
        // server's rather than as the one the checkout would have used.
        execFileSync(process.execPath, ["scripts/site-characterization.mjs", ...sweepArgs], {
            cwd: REPO_ROOT,
            stdio: "inherit",
            env: { ...process.env, DE_BASE_URL: baseURL, DE_SERVER_OWNED: "1" },
        });
    } catch (e) {
        // The harness's own output above says what moved. Its exit code is the
        // verdict and is passed straight through: 1 regressions, 2 could not run.
        process.exitCode = typeof e.status === "number" ? e.status : 1;
    } finally {
        stop();
        console.log(`  stopped the ${environment} server`);
    }
}

main();
