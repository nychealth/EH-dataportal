# Per-environment characterization invocation

**Status as of 2026-08-26: branch `feature-characterize-env` cut from `production` at
`3d5438830c`; task 1 done at `d14ab4e841`, tasks 2-5 not started.**

## Why

`npm run characterize:site` can only check the environment `scripts/dev-server.mjs` happens to
resolve — it reuses whatever answers on :8080/:8081/:1313 and otherwise spawns `dev_stage`
(`dev-server.mjs:56`). Checking `prod_prod`, the environment that actually deploys, currently
means starting a server by hand and exporting `DE_BASE_URL`.

The check itself needs no new flag: `site-characterization.mjs:1015` derives the baseline key
from the running site (`env.hugoEnv === "prod_prod" ? "prod_prod" : env.dataBranch`). So the whole
feature is "start the right server and point the harness at it" — which
`site-characterization-rebaseline.mjs:187-228` already does correctly, for `--baseline`.

## Decisions taken

- **A dedicated npm script per environment, plus one generic script taking a positional.** Not
  `--env prod_prod` and not `--prod_prod`. Measured 2026-08-26, npm 11.4.1 under PowerShell, with
  a throwaway package printing `process.argv` and `npm_config_*`:

  | Invocation | Script sees |
  |---|---|
  | `npm run show --prod_prod` | `argv: []`, `npm_config_prod_prod=true` |
  | `npm run show --env prod_prod` | `argv: ["prod_prod"]`, `npm_config_env=true` |
  | `npm run show -- --env prod_prod` | identical — PowerShell ate the `--` |
  | `npm run show local_prod` | `argv: ["local_prod"]` |
  | `npm run show local_prod extra` | `argv: ["local_prod","extra"]` |
  | `npm run show local_prod --concurrency 8` | `argv: ["local_prod","8"]` |

  Bare positionals survive npm untouched; any `--flag` has its NAME eaten and its value left as a
  nameless positional. Hence: environments as positionals, and the wrapper REJECTS any argument
  starting with `--` rather than let `8` be read as an environment name. Flags stay available
  through a direct `node scripts/site-characterization.mjs` call.

- **Extract the server lifecycle rather than export it from `rebaseline.mjs`.** The shared piece
  is the isolation logic whose failure mode is corrupting a running server's `resources/_gen`; it
  should have one home, not a home and an importer.

- **Do NOT converge `.github/workflows/site-characterization.yml` onto the new wrapper.** Rejected
  deliberately. CI's server wait is clock-bounded (`$SECONDS` against a 300s deadline,
  `--max-time 120` per attempt, `kill -0 $HUGO_PID` to tell "still building" from "Hugo died",
  `tail hugo-server.log` on failure), tuned for a cold runner with no EHDP-data cache — one `curl`
  blocked 61s inside a single iteration on run 32771116783. Converging makes a local convenience
  script load-bearing for the deploy gate and trades a diagnosable failure for a generic timeout.

- **CI is out of scope and must stay that way.** It calls `node scripts/site-characterization.mjs`
  directly (`site-characterization.yml:240`, `:423`), never an npm script, and passes
  `DE_BASE_URL`, which takes `ensureDevServer`'s path 1 and never reaches the spawn logic. Nothing
  CI runs imports `rebaseline.mjs`. **The constraint that keeps this true: do not touch
  `dev-server.mjs`** — it IS imported by `site-characterization.mjs`, `smoke-pages.mjs`, and
  `site-characterization-probe-control.mjs`.

## Environment-to-key mapping

Derived by the harness, not by the wrapper. Only `staging` and `prod_prod` are committed, so the
rest exit 2 with the "No baseline" message at `site-characterization.mjs:1075-1092`.

| Environment | Key | Baseline committed? |
|---|---|---|
| `prod_prod` | `prod_prod` | yes |
| `dev_stage`, `local_stage`, `prod_stage` | `staging` | yes |
| `dev_prod`, `development`, `local_prod`, `production` | `production` | no |

## Tasks

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Extract `startServer` / `makeStop` / `responds` / `ENVIRONMENT_FOR` from `site-characterization-rebaseline.mjs` into a new `scripts/isolated-server.mjs`; import them back | `feature-characterize-env @ d14ab4e841` | **DONE 2026-08-26** | Reverse-transform: rebuilt the pre-move file from the two current ones, undoing only the declared normalizations (5 `export` prefixes, `sc-rebaseline`->`sc-isolated`, the import lines, one comment pointer). `diff` against the pre-move snapshot exits 0, byte-identical, 629 lines both sides. Plus `node --check` on both files; `import()` of the module lists exactly `ENVIRONMENT_FOR, ISO_ROOT, PORT, responds, startServer`; a symbol sweep shows `spawn`/`tmpdir`/`sleep`/`HUGO_BIN`/`PREFIXES`/`makeStop`/`SERVER_TIMEOUT_S` now at 0 occurrences in rebaseline and non-zero in the module; `--help` runs clean through the new import. The extracted `startServer` was also exercised for real, unintentionally — see the incident below |
| 2 | New `scripts/characterize-env.mjs <environment> [positional concurrency?]` — validate the name against `config/`, reject `--` args, start server, build Pagefind into its isolated `destDir`, run `site-characterization.mjs --check --all` as a child with `DE_BASE_URL` + `DE_SERVER_OWNED=1`, stop in `finally` | | Not started | *planned:* `--help`-style rejection cases run by hand; full run is task 5 |
| 3 | `package.json`: `characterize:site:env`, `characterize:site:prod_prod`, `characterize:site:dev_stage` | | Not started | *planned:* `npm run characterize:site:env` with no argument exits non-zero naming the valid environments |
| 4 | Document the split: comment block in `characterize-env.mjs` and a CLAUDE.md line saying how `characterize:site:dev_stage` (isolated, private :8090 server, never reuses) differs from `characterize:site` (reuses whatever is up, builds into `docs/`) | | Not started | *planned:* prose diffed against the actual script bodies |
| 5 | End-to-end: `npm run characterize:site:prod_prod` against this tree | | Not started | *planned:* exit 0 against the committed `prod_prod` baseline; `docs/` and `resources/_gen` unchanged afterward (path+size+mtime manifest before and after) |

## Incident 2026-08-26: an unintended re-baseline

`node scripts/site-characterization-rebaseline.mjs nosuchkey` was run as what was believed to be
an unknown-key error path. **That script takes no positional arguments at all** — `main()` sets
`keys = committedKeys()`, read from disk, and unrecognized argv is silently ignored. So the
invocation was the bare, destructive one: it began re-capturing BOTH committed baselines.

Killed after ~2 minutes, mid-sweep of `prod_prod`. Restored with the script's own documented pair,
`git checkout -- scripts/site-characterization-baseline` then `git clean -fd` on the same path.
Verified: `git status --porcelain` on that path is silent, both keys hold 926 files, and
`capturedAt` reads the original `2026-08-25T19:22:10.988Z` / `19:28:12.257Z`. `scripts/.sc-rebaseline`
removed; no `hugo.exe` survives and :8090 is free.

Two things it did establish, before it was killed: the extracted `startServer` works — it brought up
an isolated `prod_prod` server on :8090 serving `/IndicatorPublic/`, with `HUGO_RESOURCEDIR` and
`-d` under `C:/Users/Chris/AppData/Local/Temp/sc-isolated/` — and the harness then selected the
`prod_prod` baseline unaided and enumerated 925 pages.

**Open, not actioned:** `site-characterization-rebaseline.mjs` ignores unrecognized arguments and
proceeds to overwrite every committed baseline. Rejecting unknown argv would have made this a
one-line error. Out of scope for this branch unless asked.

## Environment state

- Branch `feature-characterize-env`, cut from local `production` at `3d5438830c`. No upstream set.
- No Hugo server running at branch time (`Get-NetTCPConnection -LocalPort 8080,8081,1313` returned
  nothing; no `hugo.exe`).
- Task 5 spawns a private server on :8090 and writes an isolated build under the temp root
  `rebaseline.mjs:87` defines. If a run is interrupted, check for a surviving `hugo.exe` on :8090.

## Next command

```
git -C . rev-parse --abbrev-ref HEAD     # expect feature-characterize-env
git log --oneline 3d5438830c..HEAD       # the task commits; empty means task 1 has not landed
```

Then start task 1 by reading `scripts/site-characterization-rebaseline.mjs` lines 140-230.
