# Per-environment smoke invocation

**Status as of 2026-08-26: DONE. All seven tasks landed in one commit, `4955a0a006` on
`feature-smoke-env`, which is stacked on `feature-characterize-env` at `f5f780681b`.
`npm run smoke:prod_prod` passes 925/925 in 156s at `4955a0a006`; `npm run smoke:env prod_prod
sample` passes 33/33 in 128s.**

**Owed to the branch below — settled.** `characterize-env.mjs` needed the same `sample` second
positional that Task 7 added here, so the two `:env` scripts would keep one contract. Handed to the
session owning `feature-characterize-env` on 2026-08-26 and done there at `e92c7ac15c`, which
merged to `production` in PR #1482. Nothing outstanding.

Derive what a status line cannot hold:

```
git log --oneline f5f780681b..HEAD                                   # the task commits
git rev-list --left-right --count origin/production...HEAD           # right-hand number = unpushed
gh pr list --head feature-smoke-env                                  # a PR, and against which base
git merge-base --is-ancestor f5f780681b production                   # exit 0 once the branch below merged
```

## Why

`npm run smoke` and `npm run smoke:all` can only check whichever environment
`scripts/dev-server.mjs` happens to resolve: it reuses any server answering on :8080/:8081/:1313,
and otherwise spawns `dev_stage` (`dev-server.mjs`, `SPAWN_ARGS`). Checking `prod_prod` — the
environment that actually deploys — means starting a server by hand and exporting `DE_BASE_URL`.

Two axes make that worth fixing rather than tolerating. `head.html` branches on the environment
*name*, so only `prod_prod` emits production analytics and a non-`noindex` robots meta. And each
environment pins its own `data_branch`, which changes the EHDP-data URLs the page fetches **at
runtime** — a renamed or missing data file throws in the browser on one environment and not
another, which is exactly the class of failure smoke exists to catch and a build cannot.

`feature-characterize-env` solved the same problem for the characterization harness. This branch
is the second caller of the module that branch extracted for the purpose:
`scripts/isolated-server.mjs`, whose own header says so.

## Decisions taken

- **Stack on `feature-characterize-env` rather than copy `isolated-server.mjs`.** The branch is
  cut from `f5f780681b` and its PR retargets to `production` when the one below merges — the
  pattern CLAUDE.md settles under "Branching and deployment". The alternative was a second copy of
  a module whose failure mode is corrupting a running server's `resources/_gen`; the extraction
  commit `d14ab4e841` exists specifically so there would be one home for it.

- **Positional environment argument, `--flag` rejected.** Copied wholesale from
  `characterize-env.mjs`, including the reason: measured 2026-08-26 on npm 11.4.1 under
  PowerShell, `npm run x -- --env prod_prod` reaches the script as `argv ["prod_prod"]` — npm eats
  the flag NAME and PowerShell eats the `--`. Full measurement table in
  `characterize-env-plan-2026-08-26.md`.

- **`smoke:env` sweeps the full site by default.** Parallel to `characterize:site:env`, which
  hardcodes `--check --all`. A run that pays for a cold Hugo build should not then check 33 pages.
  **Amended 2026-08-26, same day:** the first version made this the *only* mode, which left no way
  to check the curated list against a named environment short of starting a server by hand — so
  Task 7 added the optional `sample` positional. The default is unchanged; `sample` is opt-in.

- **Shared port :8090 with `characterize-env.mjs`, deliberately.** Both refuse to start when
  something answers there, so the two cannot run concurrently. One isolated port is one thing to
  reason about, and a stray survivor is easier to find than one of two.

- **Concurrency default becomes `min(24, max(6, availableParallelism()))`, not a bare 24.** Same
  formula as `site-characterization.mjs` (`CONCURRENCY_FLOOR` / `CONCURRENCY_CEILING`), so the two
  harnesses agree, and so a 2-core CI runner is not handed 24-way browser concurrency. Both
  harnesses drive one `chromium` instance with `browser.newPage()` per URL, so the mechanism the
  characterization measurement covers is the same one here.

- **Cap the sequential re-check at 25, matching the characterization harness.** Scope beyond the
  original request, approved 2026-08-26. `smoke-pages.mjs`'s re-check is uncapped, and smoke's own
  target failure — a bad edit to `head.html` or `assets/js/` — fails every page. Each re-visit
  carries a fixed `page.waitForTimeout(2000)`, so ~925 sequential re-visits is 31 minutes at an
  absolute floor. CLAUDE.md records the same shape hitting characterization in CI: a one-line
  template edit sent it into a 12-minute sequential re-capture of all 925 and it hit
  `timeout-minutes: 20` having reported nothing (run 32802721473, 2026-08-25).

- **CI is out of scope.** `.github/workflows/` calls the scripts directly and passes
  `DE_BASE_URL`, which takes `ensureDevServer`'s path 1 and never reaches the spawn logic. The
  concurrency default is the one change here that CI *can* see; check what any smoke workflow
  passes before assuming it is insulated.

## Tasks

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | `scripts/smoke-env.mjs` — positional env, :8090 guard, `startServer`, pagefind build, drive `smoke-pages.mjs` as a child | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: four argument arms — no args, `nonsuch`, `--env prod_prod`, two positionals — each exit 2 with its own message; `node --check` clean]`. Task 7 then made two positionals legal and re-ran the arms |
| 2 | `DEFAULT_CONCURRENCY` formula in `smoke-pages.mjs` | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: formula resolves to 24 on this box (24 logical processors)]`. **The planned A/B/A wall-time was NOT run** — see Deferred |
| 3 | Cap the sequential re-check at 25 in `smoke-pages.mjs` | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: two-arm control on a copy reading the cap from an env var, same 33 forced failures (bogus `DE_BASE_URL`) at `--concurrency 4`; cap 2 -> capped message, no `Re-checking` line; cap 100 -> `Re-checking 33 failing page(s) sequentially`, no capped message]` |
| 4 | `package.json`: `smoke:env`, `smoke:prod_prod` | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: `npm run smoke:env` prints usage, exit 2; `npm run smoke:env nonsuch` reaches the script with the positional intact]` |
| 5 | Docs: CLAUDE.md smoke section, `readme-development.md` | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: `npm run docs-check` reports the same 2 pre-existing failures with and without these edits (stash control), and a bogus path injected into the added sentence WAS caught — so the zero-new-failures reading is from a probe proved able to fire]` |
| 6 | End-to-end: `npm run smoke:prod_prod` | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: exit 0 in 171s wall, cold prod_prod build + Pagefind + sweep included. "Pagefind index: served". 925 pages = 830 sitemap + 94 paginator + 1, matching the breakdown CLAUDE.md records. Report JSON parses to a dict with concurrency 24, mode "all", pagesChecked 925, recheckCapped False (real bool), failures [], baseURL http://localhost:8090/IndicatorPublic/. One page failed concurrently and cleared on the sequential re-run, which exercised the below-cap branch in the real harness. `hugo.exe` gone and :8090 free afterwards]`. **Re-run after Task 7 refactored the hardcoded `--all` into `sweepArgs`, because the first run was a fact about the older code** `[2026-08-26: exit 0 in 156s, 925/925, zero FAIL lines, report mode "all" / concurrency 24 / failures [] / clearedOnRecheck []]` |
| 7 | Optional second positional `sample` in `smoke-env.mjs`, plus its doc lines | `feature-smoke-env @ 4955a0a006` | **DONE 2026-08-26** | `[2026-08-26: five rejection arms each exit 2 — no args, bad env, `--env`, `prod_prod typo`, three positionals. End-to-end `npm run smoke:env prod_prod sample` exit 0 in 128s, 33/33 clean; its report reads mode "curated", pagesChecked 33, concurrency 1 against the SAME baseURL http://localhost:8090/IndicatorPublic/ that the full run used — so the word, and only the word, changed the page set. Server reaped, :8090 free]` |

## Environment state

- Worktree `EH-dataportal.worktrees/feature-smoke-env`; `feature-characterize-env` is checked out
  in a **separate worktree** and moved once mid-session already (`4715de67e4` → `f5f780681b`).
  Re-read anything imported from it rather than trusting an earlier read.
- No upstream is set on this branch (`git config --get branch.feature-smoke-env.merge` is empty),
  which is correct — it was cut from a local ref.
- Task 6 spawns a Hugo server on :8090 and writes under `%TEMP%/sc-isolated`. If a run is
  interrupted, look for a surviving `hugo.exe` before re-running; `TaskStop` does not reap the
  process tree. After the 2026-08-26 runs, no `hugo.exe` remained and :8090 had no listener. Note
  that `Get-NetTCPConnection -LocalPort 8090` still lists entries for a few minutes afterwards —
  those are `TimeWait` with `OwningProcess 0`, not a leak. The guard in `smoke-env.mjs` issues an
  HTTP GET rather than reading the port table, and gets `ECONNREFUSED` against them, so it is
  unaffected `[verified 2026-08-26]`.
- **`docs/` and `resources/_gen/` do not exist in this worktree** — no build has ever run here.
  That is why `npm run docs-check` reports two "path does not exist" failures on CLAUDE.md, on a
  clean tree as much as a dirty one; they are not caused by anything on this branch. It also means
  the end-to-end run did **not** test the isolation claim in any strong sense: both were absent
  before and after, so there was nothing there to corrupt. To actually test it, run a build in this
  worktree first, snapshot `resources/_gen`, then run `smoke:env`.

## Deferred

- **The 6-vs-24 A/B/A wall-time measurement for this harness.** Task 2's concurrency ceiling is
  carried over from `site-characterization.mjs`, whose 24 was measured on *that* harness
  (925 pages, 12 -> 198s, 24 -> 114s, 12 -> 199s `[2026-08-24]`). The mechanism transfers — both
  drive one `chromium` with `browser.newPage()` per URL — but smoke adds a fixed
  `page.waitForTimeout(2000)` per page that characterization does not, so its wall time has a floor
  the other lacks and the 114s figure must not be quoted for a smoke run. Nothing here asserts a
  smoke timing that was not measured, so this is a nice-to-have, not a correction owed.
  **What would un-defer it:** wanting to move `CONCURRENCY_CEILING` off 24. Raising the ceiling
  requires measuring above it first, per the comment in the file. Run it as A/B/A against one
  already-running isolated server (`node scripts/smoke-pages.mjs --all --concurrency N`, three
  sweeps, 6/24/6) — a single 6-vs-24 pair measures order, not concurrency, because the first sweep
  warms the caches for the rest.
