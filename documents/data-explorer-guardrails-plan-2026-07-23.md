# Data Explorer Tier 4.5 — Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks use `## Task N:` headings for task-brief compatibility.

**Goal:** Add the fresh audit's §4.5 guardrails — ESLint over the DE tree, the repo's first npm scripts, a shared dev-server module, a site-wide console-error smoke test, and DOMPurify on the DE tree's metadata-derived HTML sinks — before the Tier 4.1 `renderMeasures()` refactor lands.

**Architecture:** Relocate the existing Playwright characterization harness from `documents/` to a new `scripts/` directory (commit 0), then build each guardrail as its own commit. A single `scripts/dev-server.mjs` module resolves-or-starts a Hugo dev server for both the harness and the new smoke script, encoding the never-start-a-second-server safety rule. ESLint uses a flat config that derives the DE tree's shared globals at config-load time. DOMPurify is the only change touching shipped SPA runtime code.

**Tech Stack:** Node ESM scripts, Playwright (already a devDependency), ESLint 9 flat config, Hugo, DOMPurify (already loaded site-wide), npm scripts.

**Source spec:** `documents/data-explorer-guardrails-design-2026-07-23.md` — read it before starting; this plan implements it section for section.

## Global Constraints

- **Test framing:** these are tooling/config tasks, not feature code. Each task's acceptance test is a runnable command that must exit 0 (or abort as specified), not a unit test. Do not invent unit tests for scripts.
- **Lint scope is `assets/js/data-explorer/` only.** Never lint `assets/js/data-explorer-old/` (retired, "do not modify" per CLAUDE.md).
- **Never start a second Hugo server.** A static rebuild or a second server poisons the running server's fingerprint cache (CLAUDE.md "Build and validation"; commit `d5fb2ea700`). The dev-server module's path-3 abort exists for exactly this.
- **The spawned server command is verbatim:** `hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080`. Do not paraphrase its flags.
- **4-space indentation in all files** (CLAUDE.md).
- **Browser-side JS: no new frameworks or build dependencies.** ESLint/globals are devDependencies for tooling, not shipped bundle deps — permitted. Do not add runtime deps.
- **Archival docs are never rewritten.** `.superpowers/sdd/task-*.md` and `documents/data-explorer-state-namespace-plan-2026-07-10.md` reference the old harness path; they record work as performed and must stay unchanged. Only the live references in Task 0 change.
- **Node ESM:** all scripts are `.mjs` using `import`, matching the existing harness.
- **Verification path that starts a server** (Task 3, path-4 test) must be confirmed with the user before running — CLAUDE.md forbids starting a server unprompted.

---

## File structure

**Created:**
- `scripts/` — new directory, home for npm-invoked dev tooling.
- `scripts/dev-server.mjs` — `ensureDevServer()` → `{ baseURL, stop }`; resolve-or-start a Hugo server.
- `scripts/smoke-pages.mjs` — load one page per template kind, fail on any console error/pageerror.
- `eslint.config.mjs` — repo-root flat config, DE-tree-scoped, globals derived at load time.

**Moved (via `git mv`):**
- `documents/de-characterization.mjs` → `scripts/de-characterization.mjs`
- `documents/de-characterization-baseline/` → `scripts/de-characterization-baseline/`

**Modified:**
- `scripts/de-characterization.mjs` — path constants after the move (Task 0); rewire to `dev-server.mjs` (Task 3).
- `package.json` — add `scripts` block and `devDependencies` (`eslint`, `globals`).
- `.gitignore:81` — path update (Task 0).
- `assets/js/data-explorer/global.js:358,360,363` — DOMPurify (Task 5).
- `assets/js/data-explorer/topic-indicator-selector.js:542` — DOMPurify (Task 5).
- `assets/js/data-explorer/data.js:297-299` — delete dead commented sanitize call (Task 5).
- `CLAUDE.md` — repo-structure `scripts/` entry (Task 0); Guardrails block (Task 6).
- `documents/data-explorer-fresh-audit-2026-07-13.md` — stale paths (Task 0); §4.5 status (Task 6).
- `documents/site-wide-audit-2026-06-27.md` — four deferred items (Task 6).

---

## Task 0: Relocate the harness to `scripts/`

**Files:**
- Create dir: `scripts/`
- Move: `documents/de-characterization.mjs` → `scripts/de-characterization.mjs`
- Move: `documents/de-characterization-baseline/` → `scripts/de-characterization-baseline/`
- Modify: `scripts/de-characterization.mjs:48-49` (path constants), and its header usage comments (lines ~20-21)
- Modify: `.gitignore:81`
- Modify: `documents/data-explorer-fresh-audit-2026-07-13.md:26,187,321`
- Modify: `CLAUDE.md:44` (repo-structure block)

**Interfaces:**
- Produces: the harness runnable as `node scripts/de-characterization.mjs [--baseline|--check]`, writing to `scripts/de-characterization-baseline/` and `scripts/de-characterization-current/`.

- [ ] **Step 1: Create the directory and move the tracked files with git**

```bash
mkdir scripts
git mv documents/de-characterization.mjs scripts/de-characterization.mjs
git mv documents/de-characterization-baseline scripts/de-characterization-baseline
```

- [ ] **Step 2: Update the path constants in the moved script**

In `scripts/de-characterization.mjs`, change lines 48-49 from:

```javascript
const BASELINE_DIR = 'documents/de-characterization-baseline';
const CURRENT_DIR = 'documents/de-characterization-current';
```

to:

```javascript
const BASELINE_DIR = 'scripts/de-characterization-baseline';
const CURRENT_DIR = 'scripts/de-characterization-current';
```

- [ ] **Step 3: Update the usage header comments in the moved script**

In `scripts/de-characterization.mjs`, the usage block (around lines 20-21) reads:

```javascript
//   node documents/de-characterization.mjs --baseline
//   node documents/de-characterization.mjs --check
```

Change both `documents/` to `scripts/`:

```javascript
//   node scripts/de-characterization.mjs --baseline
//   node scripts/de-characterization.mjs --check
```

- [ ] **Step 4: Update `.gitignore`**

Line 81 reads:

```
documents/de-characterization-current/
```

Change to:

```
scripts/de-characterization-current/
```

- [ ] **Step 5: Update the three live references in the active audit doc**

In `documents/data-explorer-fresh-audit-2026-07-13.md`, replace `documents/de-characterization.mjs` with `scripts/de-characterization.mjs` on lines 26, 187, and 321. (Grep to confirm exactly three occurrences in this file before and after.)

Run: `grep -n "de-characterization.mjs" documents/data-explorer-fresh-audit-2026-07-13.md`
Expected before: 3 lines, all `documents/`. Expected after: 3 lines, all `scripts/`.

- [ ] **Step 6: Add a `scripts/` entry to CLAUDE.md's repo-structure block**

In `CLAUDE.md`, the repo-structure fenced block ends with:

```
docs/           Generated output — never edit directly
documents/      Internal audits and technical write-ups
```

Add a line after `documents/`:

```
documents/      Internal audits and technical write-ups
scripts/        Node dev tooling (characterization harness, smoke test, dev-server helper)
```

- [ ] **Step 7: Confirm no other live references remain**

Run: `grep -rn "documents/de-characterization" --include=*.md --include=*.mjs --include=*.json --include=*.yml . | grep -v "^./docs/\|node_modules\|.superpowers/sdd\|state-namespace-plan"`
Expected: no output. (The excluded SDD briefs and namespace plan are archival — leave them.)

- [ ] **Step 8: Prove the harness still runs from its new home**

A dev server must be running on :8080 for this. If one is, run:

Run: `node scripts/de-characterization.mjs --check`
Expected: `Characterization check PASSED — output matches baseline.` (exit 0). This proves the constants and the baseline directory survived the move.

If no server is running and you cannot start one under the pre-Task-3 rules, defer this step's execution to after Task 3 (which adds auto-start) and note it — but do not skip it permanently.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -F - <<'EOF'
Relocate characterization harness from documents/ to scripts/

documents/ is for write-ups; the harness is an executable that only landed
there because it was created alongside the namespace design docs. Moves it
and its baseline to a new scripts/ dir, updates the harness path constants,
.gitignore, and the three live references in the fresh-audit doc. The SDD
task briefs and namespace plan keep the old path — they record work as done.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 1: ESLint flat config + `lint` script

**Files:**
- Create: `eslint.config.mjs`
- Modify: `package.json` (add `devDependencies` and `scripts.lint`)

**Interfaces:**
- Produces: `npm run lint` → runs ESLint over `assets/js/data-explorer/`, exit 0 when clean.

- [ ] **Step 1: Install ESLint and globals as devDependencies**

```bash
npm install --save-dev eslint globals
```

Expected: `package.json` gains `eslint` and `globals` under `devDependencies`; `package-lock.json` updates.

- [ ] **Step 2: Write the flat config with `no-undef` only, globals derived at load time**

Create `eslint.config.mjs`. This reads the 15 DE files at config-load time and extracts top-level declarations into the globals map (design §4.2). `no-unused-vars` is intentionally absent here — Step 4 measures whether it is usable before it is added.

```javascript
// ESLint flat config — scoped to the data-explorer SPA only.
//
// The 15 files in assets/js/data-explorer/ are classic <script> tags sharing
// one runtime global scope, but ESLint scopes each file separately. So a name
// declared in map.js and called in bar.js would be a false `no-undef` unless
// ESLint is told the two share globals. We derive that shared surface at
// config-load time by scanning the files' own top-level declarations, rather
// than hand-maintaining a 250+ name list that would go stale (a stale list
// produces false errors, which trains people to ignore the linter).
//
// data-explorer-old/ is deliberately NOT linted — it's retired ("do not
// modify"), so findings there are unactionable noise.

import globals from "globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DE_DIR = "assets/js/data-explorer";

// Names head.html and the loaded libraries inject into the global scope.
// These aren't declared in the DE files, so the scan below won't find them.
const EXTERNAL_GLOBALS = [
    "$", "jQuery", "L", "aq", "topojson", "vegaEmbed", "vega", "d3",
    "DOMPurify", "chroma", "qrcode",
    "hugoEnv", "baseURL", "data_repo", "data_branch", "debugLog"
];

// Extract top-level `function`/`const`/`let`/`var` names from the DE files.
// Anchored to column 0 so only module-scope declarations match, not indented
// (nested) ones — indented names are locals ESLint already sees in-file.
const declaredGlobals = {};
for (const file of readdirSync(DE_DIR)) {
    if (!file.endsWith(".js")) continue;
    const src = readFileSync(join(DE_DIR, file), "utf8");
    const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
    let m;
    while ((m = re.exec(src)) !== null) {
        declaredGlobals[m[1] ?? m[2]] = "writable";
    }
}

for (const name of EXTERNAL_GLOBALS) {
    declaredGlobals[name] = "readonly";
}

export default [
    {
        files: ["assets/js/data-explorer/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...declaredGlobals
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
```

- [ ] **Step 3: Add the `lint` script**

In `package.json`, add a `scripts` block (the repo currently has none) above `dependencies`:

```json
"scripts": {
    "lint": "eslint assets/js/data-explorer"
},
```

- [ ] **Step 4: Run lint and read the output — this is the measurement step**

Run: `npm run lint`

Two things to determine from the real output:

1. **Does it exit 0?** If `no-undef` reports names, each is either (a) a genuine external global missing from `EXTERNAL_GLOBALS` — add it; or (b) a real typo/bug — see Step 5.
2. **The `no-unused-vars` question (design §4.3):** temporarily add `"no-unused-vars": "warn"` to the rules and re-run. Read whether it flags top-level cross-file declarations (e.g. a `showMap` defined in one file, used in another, reported as unused). 
   - If it does NOT flag them → keep `"no-unused-vars": ["warn", { "args": "none" }]` in the config.
   - If it DOES flag them → remove the rule, and record in the Task 6 audit entry that `no-unused-vars` is deferred because it false-positives on this codebase's cross-file global pattern.

Record which outcome occurred in the commit message.

- [ ] **Step 5: Resolve any real findings**

For each genuine `no-undef` (not an external-global omission): if the fix is a trivially safe, obviously-correct typo correction, make it in the same commit. If it is anything less than obvious, do not fix it here — log it to the fresh-audit §4.5 status entry (Task 6) as a follow-up and leave the code alone (CLAUDE.md: don't refactor untouched code). Re-run `npm run lint` until it exits 0 (with any deferred real bugs suppressed via a line-level `// eslint-disable-next-line no-undef` carrying a `TODO(4.5):` note, so the script stays green and the finding stays visible).

- [ ] **Step 6: Verify final green state**

Run: `npm run lint`
Expected: exit 0, no output.

- [ ] **Step 7: Commit**

```bash
git add eslint.config.mjs package.json package-lock.json assets/js/data-explorer/
git commit -F - <<'EOF'
Add ESLint (no-undef) over the data-explorer SPA + lint npm script

First linting in the repo. Flat config scoped to assets/js/data-explorer/
only; derives the tree's shared globals at config-load time so the 15
one-scope files don't false-positive on each other's declarations. no-undef
is the target rule — undefined-name typos are this codebase's most likely
regression class. no-unused-vars: <RECORD OUTCOME FROM STEP 4>.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `dev-server.mjs` module

**Files:**
- Create: `scripts/dev-server.mjs`

**Interfaces:**
- Produces: `export async function ensureDevServer()` → resolves to `{ baseURL: string, stop: () => Promise<void> }`. `baseURL` ends with a trailing slash. `stop` is a no-op when the server was pre-existing or `DE_BASE_URL` was set; it tears down only a server this module spawned.

- [ ] **Step 1: Write the module**

Create `scripts/dev-server.mjs`. This is process-management code, not feature code — its acceptance test is the four-path manual exercise in Task 3, Step 4. Write it complete:

```javascript
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
    if (process.env.DE_BASE_URL) {
        return { baseURL: process.env.DE_BASE_URL, stop: async () => {} };
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
```

- [ ] **Step 2: Syntax-check the module loads**

Run: `node --check scripts/dev-server.mjs`
Expected: exit 0, no output (parses clean).

- [ ] **Step 3: Commit**

```bash
git add scripts/dev-server.mjs
git commit -F - <<'EOF'
Add scripts/dev-server.mjs — resolve-or-start a Hugo dev server

ensureDevServer() returns { baseURL, stop }. Reuses DE_BASE_URL or a server
already answering on :8080/:1313; aborts rather than starting a second one
when a hugo process exists on an unprobed port (the d5fb2ea700 cache-poison
guard); otherwise spawns the CLAUDE.md-documented command and owns teardown,
including Windows taskkill /T for descendants. Wired into the harness and
smoke test in the next commits.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: Rewire the harness to `dev-server.mjs` + `characterize` script

**Files:**
- Modify: `scripts/de-characterization.mjs` (BASE_URL constant → module; teardown in `main`)
- Modify: `package.json` (add `scripts.characterize`)

**Interfaces:**
- Consumes: `ensureDevServer` from `./dev-server.mjs`.
- Produces: `npm run characterize -- --check` / `-- --baseline`, needing no manual server setup.

- [ ] **Step 1: Import the module and replace the hardcoded BASE_URL**

In `scripts/de-characterization.mjs`, add near the top imports:

```javascript
import { ensureDevServer } from './dev-server.mjs';
```

Then remove the hardcoded constant (lines ~31-36, the comment block + `const BASE_URL = process.env.DE_BASE_URL ?? 'http://localhost:8080/dev-stage/';`). `BASE_URL` becomes a value obtained in `main()` instead — see Step 2. Leave a one-line comment where the constant was:

```javascript
// BASE_URL is resolved at runtime by ensureDevServer() in main() — reuses a
// running server, starts one if none, honors DE_BASE_URL. (was hardcoded here)
```

- [ ] **Step 2: Resolve the server in `main()` and tear it down after**

The current `main()` (around lines 353-383) opens with mode/dir setup and ends by closing the browser. Wrap it so the server is resolved first and stopped last. Change the top of `main`:

```javascript
const main = async () => {

    const { baseURL, stop } = await ensureDevServer();

    const mode = process.argv.includes('--baseline') ? 'baseline' : 'check';
    const outDir = mode === 'baseline' ? BASELINE_DIR : CURRENT_DIR;

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });

    try {
        for (const target of TARGETS) {
            console.log(`Capturing indicator ${target.id} (${target.topic}) ...`);
            const result = await captureIndicator(browser, target, baseURL);
            writeFileSync(`${outDir}/${target.id}.json`, JSON.stringify(result, null, 4) + '\n');
        }
    } finally {
        await browser.close();
        await stop();
    }

    if (mode === 'check') {
        // ... existing git diff --no-index block unchanged ...
    } else {
        // ... existing baseline message unchanged ...
    }

};
```

- [ ] **Step 3: Thread `baseURL` into `captureIndicator`**

The capture function currently reads the module-level `BASE_URL`. Add a `baseURL` parameter to its signature and use it where the page URL is built. Find the `captureIndicator` definition and its `page.goto(...)` (search for `BASE_URL` inside it), change the signature to `const captureIndicator = async (browser, target, baseURL) => {` and replace the `BASE_URL` reference in the goto with `baseURL`.

Run: `grep -n "BASE_URL" scripts/de-characterization.mjs`
Expected after: no matches (every use replaced by the threaded `baseURL` parameter or removed).

- [ ] **Step 4: Add the `characterize` script**

In `package.json`, extend the `scripts` block:

```json
"scripts": {
    "lint": "eslint assets/js/data-explorer",
    "characterize": "node scripts/de-characterization.mjs"
},
```

- [ ] **Step 5: Exercise all four resolution paths by hand**

This is the module's real test (design §10, commit 2 verification). **Path 4 starts a server, which CLAUDE.md forbids doing unprompted — confirm with the user before running that sub-step.**

1. **Path 1 (override):** with a server already up, `DE_BASE_URL="http://localhost:8080/dev-stage/" npm run characterize -- --check` → PASSES, and does not kill the server afterward (it's still answering).
2. **Path 2 (reuse):** with a server up and `DE_BASE_URL` unset, `npm run characterize -- --check` → PASSES, server still answering afterward.
3. **Path 3 (abort):** simulate a hugo process on an unprobed port. If a real one isn't available, verify the abort branch by temporarily pointing `PROBE_PORTS` at a port nothing serves while a hugo process runs, and confirm the thrown message names `DE_BASE_URL`. Restore `PROBE_PORTS`.
4. **Path 4 (spawn):** with NO server running and no hugo process, `npm run characterize -- --check` → the script starts one, runs, and stops it (confirm with `tasklist`/`pgrep` that no hugo lingers after exit).

- [ ] **Step 6: Confirm a clean check still passes through the module**

Run (server available via whichever path): `npm run characterize -- --check`
Expected: `Characterization check PASSED — output matches baseline.` (exit 0).

- [ ] **Step 7: Commit**

```bash
git add scripts/de-characterization.mjs package.json
git commit -F - <<'EOF'
Wire the characterization harness through dev-server.mjs + characterize script

Replaces the harness's hardcoded BASE_URL with ensureDevServer(), so
`npm run characterize -- --check|--baseline` needs no manual server setup and
tears down only a server it started. All four resolution paths exercised by
hand, including the abort-not-spawn guard.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `smoke-pages.mjs` + `smoke` script

**Files:**
- Create: `scripts/smoke-pages.mjs`
- Modify: `package.json` (add `scripts.smoke`)

**Interfaces:**
- Consumes: `ensureDevServer` from `./dev-server.mjs`.
- Produces: `npm run smoke` → loads the fixed page list, exit 1 on any non-allowlisted console error/pageerror, exit 0 otherwise.

- [ ] **Step 1: Write the smoke script**

Create `scripts/smoke-pages.mjs`. The allowlist is load-bearing (design §6.2): two pages are known-red today, each entry cites its audit section so fixing the bug deletes the entry.

```javascript
// Console-error smoke test across one page per template kind. Fails on any
// console `error` or `pageerror`. Exists because Tier 4.6 shipped bugs that a
// clean `hugo` build and static grep both missed — the old explorer's map was
// broken and four data-features pages threw on colorIcon/easyButton, visible
// only by loading real pages. Runs the same way as the characterization
// check: `npm run smoke` before a merge that touches shared templates.

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

// One page per template kind, weighted toward Tier 4.6's actual casualties.
// Prefix-relative — joined onto whatever baseURL ensureDevServer() returns.
const PAGES = [
    "",                                              // home
    "data-explorer/asthma/?id=2380",                 // DE single
    "data-explorer/asthma/",                         // DE section
    "data-explorer-old/asthma/?id=2380",             // old explorer single
    "data-features/flood-vulnerability-index/",      // fvi layout — easyButton/colorIcon
    "data-features/rats-in-your-neighborhood/",      // KNOWN-RED (see allowlist)
    "data-features/rat-mitigation-zones/",           // rmz layout — easyButton/colorIcon
    "data-features/realtime-air-quality/",           // realtime layout — easyButton/colorIcon
    "data-features/find-your-uhf/",                  // renders neighborhood-overlap.html — sole real easyButton/colorIcon consumer
    "neighborhood-reports/",                         // NR section
    "data-stories/housing/",                         // KNOWN-RED (see allowlist)
    "take-action/",                                  // take-action
];

// Pre-existing, documented console noise that is NOT a regression. Each entry
// names the page it excuses and the audit section that tracks the real fix, so
// resolving that bug is what removes the entry — the allowlist trends to zero.
const KNOWN_NOISE = [
    // Datawrapper iframe computing NaN/negative size in a hidden Bootstrap tab.
    // Reproduces on redlining/, air-quality-snapshots/, vectorborne-diseases/.
    // site-wide audit §5b. Match on the CDN host so only Datawrapper noise passes.
    /dwcdn\.net|datawrapper/i,
    // rats-in-your-neighborhood: area.contains() has thrown since 2019 (RawGit
    // fallout). site-wide audit §5c. Remove when that template is fixed.
    /area\.contains|is not a function.*contains/i,
    // Generic dev-only resource noise, same set the harness ignores.
    /pagefind|favicon|Failed to load resource|net::ERR/i,
];

const isKnownNoise = (text) => KNOWN_NOISE.some((re) => re.test(text));

const main = async () => {

    const { baseURL, stop } = await ensureDevServer();
    const browser = await chromium.launch({ headless: true });
    const failures = [];

    try {
        for (const path of PAGES) {
            const url = baseURL + path;
            const page = await browser.newPage();
            const errors = [];

            page.on("console", (msg) => {
                if (msg.type() === "error" && !isKnownNoise(msg.text())) errors.push(msg.text());
            });
            page.on("pageerror", (err) => {
                if (!isKnownNoise(err.message)) errors.push(err.message);
            });

            try {
                await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
            } catch (e) {
                errors.push(`navigation failed: ${e.message}`);
            }

            if (errors.length) {
                failures.push({ path, errors });
                console.error(`FAIL  ${path}`);
                for (const e of errors) console.error(`        ${e}`);
            } else {
                console.log(`ok    ${path}`);
            }

            await page.close();
        }
    } finally {
        await browser.close();
        await stop();
    }

    if (failures.length) {
        console.error(`\nSmoke test FAILED — ${failures.length} page(s) had unexpected console errors.`);
        process.exitCode = 1;
    } else {
        console.log(`\nSmoke test PASSED — ${PAGES.length} pages clean (known noise allowlisted).`);
    }

};

main();
```

- [ ] **Step 2: Syntax-check**

Run: `node --check scripts/smoke-pages.mjs`
Expected: exit 0.

- [ ] **Step 3: Verify the page slugs resolve**

The slugs in `PAGES` were verified against the content tree when this plan was written (`flood-vulnerability-index`, `rat-mitigation-zones`, `realtime-air-quality`, `rats-in-your-neighborhood` all exist under `content/data-features/`; `find-your-uhf` renders `neighborhood-overlap.html`). Re-confirm they still resolve — content can move:

Run: `ls content/data-features/ | grep -iE "flood-vuln|rat-mitig|realtime|rats-in|find-your-uhf"`
Expected: five matching content dirs. Also confirm `content/data-stories/housing`, `content/neighborhood-reports`, and `content/take-action` exist. If any slug has changed, correct the `PAGES` entry to the real URL.

- [ ] **Step 4: Add the `smoke` script**

In `package.json`:

```json
"scripts": {
    "lint": "eslint assets/js/data-explorer",
    "characterize": "node scripts/de-characterization.mjs",
    "smoke": "node scripts/smoke-pages.mjs"
},
```

- [ ] **Step 5: Run the smoke test**

Run: `npm run smoke`
Expected: `Smoke test PASSED — 12 pages clean (known noise allowlisted).` (exit 0).

If a page fails: determine whether it's a real regression (fix or log per CLAUDE.md) or a genuinely pre-existing, already-documented issue. Only add to `KNOWN_NOISE` if a) it's pre-existing and b) an audit section already tracks it — cite that section in the comment. Do not silence a finding that has no audit home; that's how a smoke test rots into uselessness.

- [ ] **Step 6: Commit**

```bash
git add scripts/smoke-pages.mjs package.json
git commit -F - <<'EOF'
Add scripts/smoke-pages.mjs — console-error smoke test + smoke script

Loads one page per template kind and fails on any non-allowlisted console
error/pageerror — the check Tier 4.6 lacked when it shipped a broken old-
explorer map and four colorIcon/easyButton throws past a clean build. The
allowlist names each known-red page (Datawrapper §5b, rats §5c) with its
audit section, so fixing the bug deletes the entry.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: DOMPurify on metadata-derived sinks

**Files:**
- Modify: `assets/js/data-explorer/global.js:358,360,363`
- Modify: `assets/js/data-explorer/topic-indicator-selector.js:542`
- Modify: `assets/js/data-explorer/data.js:297-299` (delete dead comment)

**Interfaces:**
- Consumes: `DOMPurify` global (loaded site-wide via `head.html:128-129`; already in `EXTERNAL_GLOBALS` from Task 1).

- [ ] **Step 1: Sanitize the sources/about sinks in global.js**

In `assets/js/data-explorer/global.js`, wrap the three data-derived assignments. The `dataSources.innerHTML = ''` at line 349 is a static clear — leave it. Change lines 358, 360, 363:

Line 358, from:
```javascript
        singleSource === true ? dataSources.innerHTML = sources[0] : dataSources.innerHTML = sources;
```
to:
```javascript
        singleSource === true ? dataSources.innerHTML = DOMPurify.sanitize(sources[0]) : dataSources.innerHTML = DOMPurify.sanitize(sources);
```

Line 360, from:
```javascript
        dataSources.innerHTML = sources;
```
to:
```javascript
        dataSources.innerHTML = DOMPurify.sanitize(sources);
```

Line 363, from:
```javascript
    aboutMeasures.innerHTML = about;
```
to:
```javascript
    aboutMeasures.innerHTML = DOMPurify.sanitize(about);
```

- [ ] **Step 2: Sanitize the how_calculated sink in topic-indicator-selector.js**

In `assets/js/data-explorer/topic-indicator-selector.js`, line 542, from:
```javascript
        p.innerHTML = `<strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}`;
```
to:
```javascript
        p.innerHTML = DOMPurify.sanitize(`<strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}`);
```

- [ ] **Step 3: Delete the dead commented-out sanitize call in data.js**

In `assets/js/data-explorer/data.js`, remove the three dead comment lines (297-299):
```javascript
    // const indicatorTitle = document.getElementById('indicatorNameMobile')

    // indicatorTitle.innerHTML = DOMPurify.sanitize(indicatorName)
```
(CLAUDE.md: no commented-out dead code.)

- [ ] **Step 4: Lint still passes**

Run: `npm run lint`
Expected: exit 0 (`DOMPurify` is in `EXTERNAL_GLOBALS`, so no `no-undef`).

- [ ] **Step 5: Characterization check — no rendered-output regression**

A server must be resolvable. Run: `npm run characterize -- --check`
Expected: `Characterization check PASSED — output matches baseline.` The harness captures the sources/about panels, so a clean diff confirms sanitizing stripped nothing the metadata legitimately renders.

- [ ] **Step 6: Browser confirmation (design §8)**

Because sanitizing can strip legitimate markup — a rendering regression the `--check` diff would catch only if a captured field changed — load a DE indicator in a fresh browser tab and visually confirm the **Sources** and **How is this calculated** panels render their formatting (links, bold, line breaks) as before. Confirm with the user before starting a server if none is running.

- [ ] **Step 7: Commit**

```bash
git add assets/js/data-explorer/global.js assets/js/data-explorer/topic-indicator-selector.js assets/js/data-explorer/data.js
git commit -F - <<'EOF'
Sanitize metadata-derived HTML sinks in the data-explorer SPA with DOMPurify

The old explorer sanitized fetched-metadata HTML; the new tree didn't. Wraps
the four data-derived innerHTML assignments (how_calculated, Sources ×2, about)
in DOMPurify.sanitize — already loaded site-wide, so no new dependency — and
deletes a dead commented-out sanitize call. Parity/hygiene, not a vuln fix
(the data repo is DOHMH-controlled). Characterization check clean; Sources and
How-calculated panels visually unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: Documentation + audit status

**Files:**
- Modify: `CLAUDE.md` (Guardrails block under Build and validation)
- Modify: `documents/data-explorer-fresh-audit-2026-07-13.md` (§4.5 status entry)
- Modify: `documents/site-wide-audit-2026-06-27.md` (four deferred items)

**Interfaces:** none (docs only).

- [ ] **Step 1: Add the Guardrails block to CLAUDE.md**

In `CLAUDE.md`, after the "Never run a static `hugo` rebuild while a `hugo server`…" paragraph (end of the Build and validation section, ~line 19), add:

```markdown
### Guardrails (Tier 4.5)

Three npm scripts, run from the repo root:

- `npm run lint` — ESLint (`no-undef`) over `assets/js/data-explorer/`. Catches the undefined-name typos that a shared-global-scope SPA is most prone to.
- `npm run characterize -- --check` — Playwright characterization harness; diffs 3 indicators × 5 views against a committed baseline. `-- --baseline` re-captures.
- `npm run smoke` — loads one page per template kind, fails on any non-allowlisted console error. Run this before any merge that touches a shared template like `head.html`.

`characterize` and `smoke` **reuse a running dev server, start one if none is running, and never stop a server they didn't start.** Set `DE_BASE_URL` to point them at a server on a non-default port/environment. If a `hugo` process is running but they can't find it on :8080/:1313, they abort with instructions rather than start a second server (which would poison the running server's fingerprint cache).

Run `characterize -- --check` and `smoke` before any Tier 2–4 merge.
```

- [ ] **Step 2: Add the §4.5 execution-status entry to the fresh audit**

In `documents/data-explorer-fresh-audit-2026-07-13.md`, at the end of the §4.5 block (after the smoke-test bullet, ~line 219), add an execution-status paragraph modeled on the §3.3 / §4.6 status entries already in the doc. Record: the six commits; the `scripts/` relocation; the **actual `no-unused-vars` outcome measured in Task 1 Step 4**; any real lint findings fixed vs. deferred; and that verification was `lint`/`characterize --check`/`smoke` all green plus a browser check of the Sources panel. Use the real commit SHAs.

- [ ] **Step 3: Log the four deferred items in the site-wide audit**

In `documents/site-wide-audit-2026-06-27.md`, add a short entry (new subsection or appended to the existing §7 testing-strategy note, whichever fits the doc's structure) recording the items deferred out of Tier 4.5 scope: (1) run `npm run lint` as a CI job in the build workflows; (2) a git pre-commit hook running lint; (3) a full classification sweep of all ~40 DE-tree `innerHTML` sinks for sanitization; (4) the three dead `nr-*` DOMPurify-consuming partials (cross-reference §5a). Frame each as "considered and deferred during 4.5, with reason", not as new findings.

- [ ] **Step 4: Verify the docs build cleanly (no broken internal links introduced)**

Run: `grep -n "scripts/de-characterization\|npm run" CLAUDE.md documents/data-explorer-fresh-audit-2026-07-13.md`
Expected: the new references are all present and use `scripts/` (not `documents/`) paths and the real script names.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md documents/data-explorer-fresh-audit-2026-07-13.md documents/site-wide-audit-2026-06-27.md
git commit -F - <<'EOF'
Document Tier 4.5 guardrails; record §4.5 status and deferred items

CLAUDE.md gains a Guardrails block (the three npm scripts, the reuse/start/
never-stop-others server contract, DE_BASE_URL). Fresh-audit §4.5 gets its
execution-status entry with the measured no-unused-vars outcome and the six
commit SHAs. Site-wide audit records the four items deferred out of 4.5 scope
(lint-in-CI, pre-commit hook, full innerHTML sweep, dead nr-* partials).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Self-review (completed against the spec)

- **§2 scope** → Tasks 0 (relocation), 1 (ESLint+lint), 2+3 (dev-server, scripts), 4 (smoke), 5 (DOMPurify), 6 (docs + deferred items). All covered.
- **§3 relocation, live vs archival refs** → Task 0 Steps 5/7 update the three audit lines and assert the SDD/plan refs stay. ✓
- **§4.3 no-unused-vars open question** → Task 1 Step 4 measures it before configuring; outcome recorded in commit + Task 6 §4.5 entry. ✓
- **§5.1 safety invariants** → all four encoded in Task 2's module (override/reuse no-op stop, path-3 abort, verbatim command, SIGINT+taskkill teardown) and exercised in Task 3 Step 5. ✓
- **§6.2 allowlist** → Task 4's `KNOWN_NOISE` names both known-red pages with audit citations. ✓
- **§8 four DOMPurify sinks, `=''` clears excluded** → Task 5 Steps 1-3 target exactly lines 358/360/363 + 542, delete data.js:297-299, leave the clears. ✓
- **§10 six commits, each green** → six tasks, each ending in a passing acceptance command + commit. ✓
- **Operational note (server-start needs user confirm)** → flagged in Global Constraints and at Task 3 Step 5 / Task 5 Step 6. ✓
- **Type/name consistency** → `ensureDevServer` → `{ baseURL, stop }` used identically in Tasks 2/3/4; `captureIndicator(browser, target, baseURL)` signature consistent across Task 3 Steps 2-3. ✓
