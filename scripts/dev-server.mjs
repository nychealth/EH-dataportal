// Resolve-or-start a Hugo dev server for the characterization harness and the
// smoke test. Returns { baseURL, stop }. Safety rules (design §5.1), each of
// which encodes a real prior failure:
//   - Never stop a server it didn't start (stop is a no-op for reused servers).
//   - Never start a SECOND server. Hugo defaults to :1313, so "a server is up
//     on a port we didn't probe" is the likely case, not a hypothetical, and
//     starting another poisons the running one's fingerprint cache (d5fb2ea700,
//     which produced 87 console errors on the user's tab). If nothing answers
//     our probes but a hugo process exists, we ABORT rather than spawn.
//   - Spawn the exact command CLAUDE.md documents, nothing paraphrased.

import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// Ports and path prefixes we know this repo's servers use. Probed in order;
// the first (port, prefix) pair returning HTTP 200 wins.
const PROBE_PORTS = [8080, 1313];
const PREFIXES = ["/dev-stage/", "/local-stage/", "/dev-prod/", "/local-prod/", "/IndicatorPublic/", "/"];

const SPAWN_PORT = 8080;
const SPAWN_PREFIX = "/dev-stage/";
const SPAWN_CMD = "hugo";
const SPAWN_ARGS = ["server", "--environment", "dev_stage", "--cleanDestinationDir", "--logLevel", "debug", "-p", String(SPAWN_PORT)];

// True if a URL returns HTTP 200 within a short timeout.
async function responds(url) {
    try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(t);
        return res.status === 200;
    } catch {
        return false;
    }
}

// First reachable base URL among the known port/prefix combinations, or null.
async function findRunningServer() {
    for (const port of PROBE_PORTS) {
        for (const prefix of PREFIXES) {
            const base = `http://localhost:${port}${prefix}`;
            if (await responds(base)) return base;
        }
    }
    return null;
}

// True if any hugo process is currently running (platform-aware).
function hugoProcessExists() {
    try {
        if (process.platform === "win32") {
            const out = execSync("tasklist /fi \"imagename eq hugo.exe\" /nh", { encoding: "utf8" });
            return /hugo\.exe/i.test(out);
        }
        execSync("pgrep -x hugo", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

// Kill a spawned server and all its descendants. child.kill() alone doesn't
// reap descendants on Windows, so use taskkill /T there.
function makeStop(child) {
    return async () => {
        if (!child || child.killed) return;
        if (process.platform === "win32") {
            try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" }); } catch { /* already gone */ }
        } else {
            child.kill("SIGTERM");
        }
    };
}

export async function ensureDevServer() {

    // Path 1: explicit override — trust it, probe nothing, own nothing.
    // Force a trailing slash so consumers can join `baseURL + path` safely; the
    // probe/spawn paths already return slash-terminated prefixes.
    if (process.env.DE_BASE_URL) {
        return { baseURL: process.env.DE_BASE_URL.replace(/\/?$/, '/'), stop: async () => {} };
    }

    // Path 2: reuse a server that's already answering.
    const running = await findRunningServer();
    if (running) {
        return { baseURL: running, stop: async () => {} };
    }

    // Path 3: a hugo process exists but didn't answer our probes — it's on a
    // port/prefix we don't know. Starting another would poison its cache.
    if (hugoProcessExists()) {
        throw new Error(
            "A hugo process is running but did not answer on :8080 or :1313 " +
            "with any known path prefix. Refusing to start a second server " +
            "(it would poison the running server's fingerprint cache — see " +
            "d5fb2ea700). Set DE_BASE_URL to its address, e.g. " +
            "DE_BASE_URL=\"http://localhost:PORT/PREFIX/\", and re-run."
        );
    }

    // Path 4: nothing running — spawn one, wait for it, own its teardown.
    const child = spawn(SPAWN_CMD, SPAWN_ARGS, { stdio: "ignore", shell: process.platform === "win32" });
    const stop = makeStop(child);

    // Tear down on our own exit so Ctrl-C / normal exit doesn't orphan it.
    const onExit = () => { stop(); };
    process.once("exit", onExit);
    process.once("SIGINT", () => { stop(); process.exit(130); });

    const baseURL = `http://localhost:${SPAWN_PORT}${SPAWN_PREFIX}`;
    for (let i = 0; i < 60; i++) {
        if (await responds(baseURL)) return { baseURL, stop };
        await sleep(1000);
    }

    await stop();
    throw new Error(`Spawned hugo server did not answer at ${baseURL} within 60s.`);
}
