// Resolve-or-start a Hugo dev server for the smoke test. Returns { baseURL, stop }.
// Three safety rules, each of which encodes a real failure mode:
//   - Never stop a server it didn't start (stop is a no-op for reused servers).
//   - Never start a SECOND server. Hugo defaults to :1313, so "a server is up on
//     a port we didn't probe" is the likely case, not a hypothetical, and a
//     second builder poisons the running one's fingerprint cache (resources/_gen
//     is shared and not namespaced by environment — see CLAUDE.md). If nothing
//     answers our probes but a hugo process exists, we ABORT rather than spawn.
//   - Spawn the command CLAUDE.md documents, not a paraphrase of it.
//   - Report whether Pagefind is served, and never guess. `hugo server` does
//     not build the search index, so a server without it serves a site whose
//     search UI is absent from every page. Consumers that compare against a
//     recorded site need to know which of the two they got.
//   - Report the Hugo version, flagged with whether we own the server, so a
//     baseline records which binary produced the site it describes.

import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

// Ports and path prefixes this repo's servers use. Probed in order; the first
// (port, prefix) pair returning HTTP 200 wins. The prefixes are the paths from
// each environment's baseURL in config/<env>/config.toml.
const PROBE_PORTS = [8080, 8081, 1313];
export const PREFIXES = ["/dev-stage/", "/dev-prod/", "/local-stage/", "/local-prod/", "/IndicatorPublic/", "/"];

// The server we start when none is running. dev_stage means STAGING data, so a
// page whose content differs between EHDP-data branches will differ here from
// production — that matters for anything comparing content, not for the console
// errors this harness reads.
const SPAWN_PORT = 8080;
const SPAWN_PREFIX = "/dev-stage/";
// The hugo this repo PINS (package.json, exactly 0.147.3), preferred over
// whatever a machine happens to have on PATH. Two reasons, one of them measured:
// nothing puts hugo on PATH inside CI, so the version probe below printed
// "/bin/sh: 1: hugo: not found" and recorded the version as unknown
// `[run 32771116783, 2026-08-24]`; and a spawn resolving through PATH can start
// a different binary from the one the probe reports, which would make the
// provenance in a baseline's _meta.json wrong rather than merely absent.
//
// Falls back to a bare `hugo` when the optional platform binary did not install
// — that is the case the "Confirm the locked Hugo is present" CI step exists to
// catch, and a local developer with only a PATH hugo is still served.
const VENDORED_HUGO = fileURLToPath(new URL(
    process.platform === "win32" ? "../node_modules/.bin/hugo.cmd" : "../node_modules/.bin/hugo",
    import.meta.url,
));
export const SPAWN_CMD = existsSync(VENDORED_HUGO) ? VENDORED_HUGO : "hugo";

// Shell-safe form of SPAWN_CMD. A resolved path can contain spaces where the
// bare name never could, and both the Windows spawn branch and hugoVersion()
// hand their command to a shell as one string.
const SPAWN_CMD_ARG = /\s/.test(SPAWN_CMD) ? `"${SPAWN_CMD}"` : SPAWN_CMD;

const SPAWN_ARGS = ["server", "--environment", "dev_stage", "--cleanDestinationDir", "--disableFastRender", "-p", String(SPAWN_PORT)];

// Repo root, derived from this file's own location rather than from cwd, so the
// pagefind build works whichever directory the harness was launched from.
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Hugo's publishDir (config/_default/config.toml) and the asset whose presence
// proves the index was built. `hugo server` >= 0.123 writes and serves this
// directory from disk, so a second process can write into it and the running
// server will serve what it finds `[verified 2026-08-24 on hugo v0.147.9]`.
const PUBLISH_DIR = "docs";
const PAGEFIND_PROBE = "pagefind/pagefind.js";

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

// True if the running server answers 200 for Pagefind's runtime script. This is
// asked on every path, including servers we did not start, because the answer
// changes what the site *is*: with the index built, the search UI mounts and
// adds a button and an input to every page.
async function pagefindServed(baseURL) {
    return responds(`${baseURL}${PAGEFIND_PROBE}`);
}

// Build the Pagefind index into the server's publishDir. Same command the deploy
// workflow runs (.github/workflows/hugo-build-to-prod-prod.yml), so what gets
// served here is what ships. Safe to run against a live server: Hugo watches
// source directories, not publishDir, so this triggers no rebuild — and a
// rebuild would not remove it either `[verified 2026-08-24: touched
// content/_index.md, server rebuilt in 1164ms, both pagefind assets still 200
// afterwards, with --cleanDestinationDir in the server's own args]`.
//
// Returns true on success. A failure is reported, never thrown: the caller's
// own pagefind probe is what decides, and a harness that can still run a
// degraded check is more useful than one that refuses to start.
function buildPagefind() {
    try {
        execSync(`npx -y pagefind --site ${PUBLISH_DIR}`, {
            cwd: REPO_ROOT,
            stdio: "ignore",
        });
        return true;
    } catch (e) {
        console.warn(`Pagefind index build failed (${e.message}); continuing without it.`);
        return false;
    }
}

// Full version identity of SPAWN_CMD — the repo's pinned hugo where it
// installed, a PATH hugo otherwise — e.g. "0.147.3-05417512bd...+extended". The
// commit hash is the useful half: it is what distinguishes two builds of the
// same version number.
//
// Reported alongside `owned` and never on its own, because it is only a fact
// about the SERVER when we spawned it. For a reused or DE_BASE_URL server it
// describes the binary this checkout WOULD have used, and the one that actually
// built the served site is not observable from here — the site emits no
// generator meta.
function hugoVersion() {
    try {
        // stderr ignored, not inherited: a missing hugo is a null return here,
        // and letting the shell's "hugo: not found" reach the console makes a
        // recorded absence look like a broken run.
        const out = execSync(`${SPAWN_CMD_ARG} version`, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        });
        return out.match(/hugo v(\S+)/)?.[1] ?? null;
    } catch {
        return null;
    }
}

// Kill a spawned server and all its descendants. child.kill() alone doesn't reap
// descendants on Windows, so use taskkill /T there.
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
    // probe and spawn paths already return slash-terminated prefixes.
    if (process.env.DE_BASE_URL) {
        const baseURL = process.env.DE_BASE_URL.replace(/\/?$/, "/");
        return {
            baseURL,
            stop: async () => {},
            pagefind: await pagefindServed(baseURL),
            // `owned` asserts the recorded version IS this server's, rather than
            // the binary this checkout would have used. A DE_BASE_URL server is
            // usually someone else's, so false is the right default — but a
            // caller that spawned it ITSELF with SPAWN_CMD knows otherwise, and
            // an env var is the only way that fact crosses a process boundary.
            // site-characterization-rebaseline.mjs is the one such caller: it
            // starts an isolated server per environment and drives this harness
            // as a child. Never set it by hand for a server you merely found.
            hugo: { version: hugoVersion(), owned: process.env.DE_SERVER_OWNED === "1" },
        };
    }

    // Path 2: reuse a server that's already answering. We don't own it, so we
    // don't build into its publishDir — we only report what it serves.
    const running = await findRunningServer();
    if (running) {
        return {
            baseURL: running,
            stop: async () => {},
            pagefind: await pagefindServed(running),
            hugo: { version: hugoVersion(), owned: false },
        };
    }

    // Path 3: a hugo process exists but didn't answer our probes — it's on a
    // port or prefix we don't know. Starting another would poison its cache.
    if (hugoProcessExists()) {
        throw new Error(
            "A hugo process is running but did not answer on :8080, :8081 or :1313 " +
            "with any known path prefix. Refusing to start a second server " +
            "(two builders share resources/_gen and corrupt each other's asset " +
            "paths). Set DE_BASE_URL to its address, e.g. " +
            "DE_BASE_URL=\"http://localhost:PORT/PREFIX/\", and re-run."
        );
    }

    // Path 4: nothing running — spawn one, wait for it, own its teardown.
    // On Windows, `hugo` only resolves through a shell (PATHEXT), so use shell
    // mode there — but pass the command as one pre-joined string rather than an
    // args array, which is how Node wants shell invocations (an args array with
    // shell:true triggers the DEP0190 arg-escaping warning). The args are fixed
    // constants, so there is no injection surface. Off-Windows keeps the clean
    // array form with no shell.
    const child = process.platform === "win32"
        ? spawn(`${SPAWN_CMD_ARG} ${SPAWN_ARGS.join(" ")}`, { stdio: "ignore", shell: true })
        : spawn(SPAWN_CMD, SPAWN_ARGS, { stdio: "ignore" });
    const stop = makeStop(child);

    // Tear down on our own exit so Ctrl-C or a normal exit doesn't orphan it.
    process.once("exit", () => { stop(); });
    process.once("SIGINT", () => { stop(); process.exit(130); });

    const baseURL = `http://localhost:${SPAWN_PORT}${SPAWN_PREFIX}`;
    for (let i = 0; i < 90; i++) {
        if (await responds(baseURL)) {
            // We own this server, so we know its publishDir is on disk and whose
            // it is. Build the index before handing the URL back, so the first
            // page a consumer loads already has the search UI.
            buildPagefind();
            return {
                baseURL,
                stop,
                pagefind: await pagefindServed(baseURL),
                hugo: { version: hugoVersion(), owned: true },
            };
        }
        await sleep(1000);
    }

    await stop();
    throw new Error(`Spawned hugo server did not answer at ${baseURL} within 90s.`);
}
