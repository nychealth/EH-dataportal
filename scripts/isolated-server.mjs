// An isolated `hugo server` for one environment: a private port, and both
// writable outputs redirected outside the repo.
//
// Extracted from site-characterization-rebaseline.mjs so that the two callers
// that need a server for a NAMED environment — the re-baseline tool and
// characterize-env.mjs — share one implementation. The thing being shared is
// the isolation, whose failure mode is corrupting a running server's
// fingerprint cache, so it gets one home rather than a home and a copy.
//
// Deliberately NOT part of dev-server.mjs, which answers a different question:
// "what server should the harness use", including reusing one it finds and
// building into the repo's own docs/. This module never reuses and never
// touches the repo's outputs. dev-server.mjs is imported by the harness, the
// smoke test and the probe control, so it is left alone.

import { spawn, execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { SPAWN_CMD as HUGO_BIN, PREFIXES } from "./dev-server.mjs";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Which Hugo environment produces each baseline key. The key is a property of
// the OUTPUT (data branch, plus prod_prod's environment-name branch in
// head.html); this maps back to one environment that produces it. Any
// environment in a key's row would do — these are just the ones the committed
// baselines were captured from.
export const ENVIRONMENT_FOR = {
    staging: "dev_stage",
    production: "dev_prod",
    prod_prod: "prod_prod",
};

// Deliberately OFF dev-server.mjs's probe list (8080, 8081, 1313). On a probed
// port, any other harness invocation running at the same time would discover
// this script's private server and sweep the wrong environment against the
// wrong baseline.
export const PORT = 8090;

// Where the isolated servers write. Outside the repo, so neither resources/_gen
// nor docs/ is reachable from them — that is the whole isolation claim.
export const ISO_ROOT = `${tmpdir().replace(/\\/g, "/")}/sc-isolated`;

// A build of this site takes ~34s on this machine, plus Hugo's own startup.
const SERVER_TIMEOUT_S = 200;

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

export const responds = async (url) => {
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
export const startServer = async (environment) => {

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

