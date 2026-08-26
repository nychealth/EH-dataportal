# Automatic smoke check in GitHub Actions

**Status as of 2026-08-26: PLANNED. No task work has landed.** Branch `feature-smoke-GHA`, cut
from `production` at `9ebb11e85f`. Tasks 1–6 below are unstarted; the only commit on the branch is
the one carrying this document.

Derive what a status line cannot hold:

```
git log --oneline 9ebb11e85f..HEAD -- ':!documents/'                  # the task commits
git rev-list --left-right --count origin/production...HEAD           # right-hand number = unpushed
gh pr list --head feature-smoke-GHA                                  # a PR, and against which base
gh run list --workflow smoke.yml                                     # has the workflow ever run
```

## Why

`scripts/smoke-pages.mjs` is the only check in this repo that runs the site's JavaScript. The
site's browser JS is classic `<script>` tags sharing one global scope, so a bad edit throws at
load while `hugo` still exits 0 — a build proves the templates compile and nothing more. Today
that check runs only when someone remembers to run it.

`site-characterization.yml` already automates the breadth-first structural counterpart on every PR
into `production`. The two catch disjoint failures: characterization fails on a page whose
rendered structure moved, smoke fails on a page whose JS threw. Neither sees what the other does.
Automating one and not the other leaves the JS half on human memory.

The second reason is specific to smoke and does not apply to the build: each environment pins its
own `data_branch`, and pages `fetch` EHDP-data from raw GitHub URLs **at runtime**. A renamed data
file throws in the browser and in nothing else. `prod_prod` pins `data_branch = "production"`
(`config/prod_prod/config.toml`), which is the data the site deploys against.

## Decisions taken

- **`prod_prod`, with `www.googletagmanager.com` blocked in the harness.** Chosen 2026-08-26 over
  `dev_prod`, which pins the same `data_branch` and emits no analytics tag at all.

  `head.html:3-15` emits `gtag/js?id=G-64BWDRHRGB` and an inline `gtag('config', …)` **only** when
  `hugo.Environment` is `prod_prod`. `site-characterization.mjs` aborts that host at the network
  layer (`BLOCKED_HOSTS`, `:167-172`; the `page.route` that applies it, `:698-700`).
  `smoke-pages.mjs` has no such route — a grep for `route`, `abort` and `googletagmanager` returns
  nothing across the file `[2026-08-26]`. So a 925-page sweep under `prod_prod` has an unblocked
  path to the live analytics property. **Not measured** that hits are sent, only that the
  mechanism is present and unblocked; Task 1's positive control settles it.

  This is a pre-existing local exposure, not one CI would create: `npm run smoke:prod_prod` has
  the same unblocked path and was run twice on 2026-08-26
  (`documents/smoke-env-plan-2026-08-26.md` Task 6).

  Blocking rather than switching environment keeps two things `dev_prod` would cost: the inline
  `gtag()` block is first-party JS that executes only under `prod_prod`, and it stays under test
  because only the *external* script is aborted; and the CI environment stays identical to the
  characterization workflow's, so a red smoke and a red characterization on one PR describe the
  same site rather than two.

- **Full 925-page sweep on `pull_request`, `sample` available on `workflow_dispatch`.** Matches
  `site-characterization.yml`, which sweeps `--all` on every PR. CLAUDE.md's smoke section is
  explicit that a curated pass proves nothing about a page kind absent from `PAGES`, and a
  pre-merge sweep is the case `--all` exists for.

- **A base-branch control job, gated on the sweep failing.** Smoke's external failure sources are
  stronger than characterization's, not weaker: EHDP-data renames throw at runtime, third-party
  embeds go down, and CLAUDE.md already records an AirNow CORS error appearing on `(home)` once
  between two passes on an unchanged tree `[verified 2026-08-17]`. Rebuilding the base tip and
  re-running the **same harness** separates "this PR broke it" from "the world moved".

  Holding the harness at the PR's head matters more here than in the characterization workflow:
  `KNOWN_NOISE` lives inside `smoke-pages.mjs`, so a PR that adds an allowlist entry would make a
  wholesale-base-checkout control incomparable with the sweep it is controlling for.

- **Its own workflow file, not a second job in `site-characterization.yml`.** Sharing one Hugo
  build would save ~62s of build per run `[run 32771116783, 2026-08-24: 62s to a serving
  prod_prod build]`, but the two sweeps would then run sequentially in one job — measured 370s for
  characterization at concurrency 6, plus an unmeasured smoke sweep whose settle floor alone is
  308s — against a `timeout-minutes` that already fired once on that workflow
  `[run 32802721473, 2026-08-25]`. Separate files also keep the two failures separable in the PR
  checks list.

- **`production` now carries `smoke-pages.mjs`, and the base-control design does not rely on it.**
  `git ls-tree --name-only production -- scripts/` lists `smoke-pages.mjs`, `smoke-env.mjs`,
  `site-characterization.mjs` and `site-characterization-baseline` `[verified 2026-08-26]`. That
  falsifies the comment in `site-characterization.yml`'s `base-control` job, which reads
  "`production` carries neither `scripts/site-characterization.mjs` nor a baseline directory
  `[verified 2026-08-24: git ls-tree production, both ABSENT]`" — true when written, made false by
  PR #1482 and PR #1483. Task 6 corrects it. The split-checkout shape stays regardless, for the
  `KNOWN_NOISE` reason above.

- **`timeout-minutes` is set from a measurement, not before one.** No smoke sweep has ever been
  timed at concurrency 6. Task 5 reads the real number off the first run and Task 6 writes it in.

## What is NOT known

- **The smoke sweep's wall time on a GitHub-hosted runner.** What is measured: 925 pages in 156s
  *total*, including a cold `prod_prod` build and Pagefind, at concurrency 24 on a
  24-logical-processor box `[2026-08-26, smoke-env-plan Task 6]`. `ubuntu-24.04` reports 4 logical
  processors `[run 32777189174: "Concurrency: 6 (4 logical processors)"]`, so
  `min(24, max(6, availableParallelism()))` floors at 6 there.

  The only figure derivable without measuring is a floor, and it comes from the harness's own
  constant rather than from the system: `visit()` does a fixed `page.waitForTimeout(2000)` per
  page, so 925 pages at concurrency 6 spend **308s in settle alone**, before any navigation. For
  scale, characterization swept the same 925 pages at concurrency 6 on the runner in 370s
  *without* any settle `[run 32771116783, 2026-08-24]` — but that is a different harness, and
  adding the two numbers is arithmetic, not a measurement. Task 5 measures it.

- **Whether the sequential re-check fires within budget.** Below `RECHECK_CAP` (25) each failing
  page is re-visited sequentially at the same 2s floor, so 25 failures add roughly a minute plus
  navigation. Above 25 the re-check is skipped outright and the run says so — both branches are
  proved to fire `[2026-08-26: same 33 forced failures at concurrency 4, cap 2 -> capped message
  and no re-check, cap 100 -> sequential re-check ran]`.

## Tasks

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Block `www.googletagmanager.com` in `smoke-pages.mjs` | — | **TODO** | Two-arm request-count control, below |
| 2 | `.github/workflows/smoke.yml` — sweep job | — | **TODO** | `actionlint`; the first PR run |
| 3 | `smoke.yml` — Pagefind pre-flight assertion | — | **TODO** | Forced-absent arm, below |
| 4 | `smoke.yml` — base-branch control job | — | **TODO** | Injected regression, below |
| 5 | Calibration run: open the PR into `production`, read the wall time | — | **TODO** | The run's own step timings |
| 6 | Set `timeout-minutes` from Task 5; docs; correct the stale `site-characterization.yml` comment | — | **TODO** | `npm run docs-check` with a stash control |

## Task 1: Block the analytics host in `smoke-pages.mjs`

**Files:** `scripts/smoke-pages.mjs` — add a `BLOCKED_HOSTS` constant near `KNOWN_NOISE`
(`:89-122`), and a `page.route` in `visit()` (`:203-227`) before `page.goto`.

**Interfaces:** produces nothing for later tasks except the guarantee that Task 2's `prod_prod`
sweep sends no analytics. Consumes nothing.

Steps:

1. Add the constant with a comment naming why this list is one host and not four:
   `site-characterization.mjs` blocks the Google Translate hosts as well, because its baseline
   records injected DOM and Translate injects on Google's network timing. Smoke reads console
   errors, not DOM, so Translate's injection is not a churn source here — block only what has an
   outward side effect.
2. In `visit()`, register the route on the new page before navigating, aborting a request whose
   host is in the list and continuing everything else. Same shape as
   `site-characterization.mjs:698-700`.
3. Note in the comment that the aborted request's own console error is already swallowed by the
   existing broad `/favicon|Failed to load resource|net::ERR/i` entry, so this adds no failures —
   and that this is the entry CLAUDE.md warns hides the *cause* of a blocked script.

**Proof — a two-arm request-count control, because a request counter reading zero is exactly what
a probe that never attached also reads.** Start one `prod_prod` server, then, in a scratch
Playwright script that loads a single page and counts `request` events whose host is
`www.googletagmanager.com`:

- **arm A, route registered:** count must be 0.
- **arm B, route commented out:** count must be **at least 1**. If arm B also reads 0 the
  instrument is dead and arm A proves nothing — check the served HTML actually carries the gtag
  `<script>` before believing either number.
- **arm C, both arms:** the inline `gtag()` block must still produce no unallowlisted console
  error, i.e. `npm run smoke:prod_prod` still passes 925/925.

Record all three counts in the ledger row, not just arm A.

## Task 2: The sweep job

**Files:** new `.github/workflows/smoke.yml`.

**Interfaces:** consumes Task 1's route. Produces the run whose timings Task 5 reads.

Copy the structure of `site-characterization.yml`'s `characterize` job, which is the working
example, and change only what differs. Same as it:

- `on: pull_request: branches: [production, development]`, with the **same `paths-ignore` list,
  copied verbatim** — `documents/**`, `memories/**`, `.claude/**`, `.agents/**`, `CLAUDE.md`,
  `README.md`, `readme-components.md`, `readme-content.md`, `readme-development.md`, `LICENSE`.
  Carry its warning across too: do not make this a required status check while it has a path
  filter, because a workflow skipped by path filtering leaves its check Pending and blocks merging
  `[docs.github.com, read 2026-08-24 — cited in site-characterization.yml]`.
- `permissions: contents: read`.
- `concurrency` group keyed on workflow + `github.ref_name`, `cancel-in-progress: true`.
- `env: SERVER_PORT: 8080`, `SERVER_URL: http://localhost:8080/IndicatorPublic/`.
- Checkout at `fetch-depth: 1`, `setup-node` 24.x with `cache: npm`, `npm ci`, `npx hugo version`,
  `npx playwright install --with-deps chromium`.
- Action `uses:` pinned to the **same commit SHAs already in `site-characterization.yml`** — one
  pin per action across the repo, so a bump is one edit:
  `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`,
  `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0`,
  `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4`.
- The server steps verbatim: start `npx hugo server --environment prod_prod
  --cleanDestinationDir --disableFastRender -p "$SERVER_PORT"` into `hugo-server.log`, record
  `HUGO_PID`, then the **clock-bounded** wait loop (300s deadline, `curl --max-time 120`,
  `kill -0` liveness check). Keep the comment explaining why it is bounded by the clock and not by
  an attempt count: Hugo accepts the connection before the build finishes and holds it open, so
  one `curl` blocked for 61s inside a single iteration `[run 32771116783, 2026-08-24]`.
- `npx -y pagefind --site docs`.
- Teardown with `pkill -TERM -x hugo` plus the `HUGO_PID` kill, `if: always()`, and the comment
  explaining that two attempts to reach the process by descent both failed.

Different from it:

- **No `GITHUB_TOKEN` in the check step's env.** Characterization needs it for the `dataCommit`
  lookup against `api.github.com`. `smoke-pages.mjs` makes no API call — its only subprocess is
  `git rev-parse HEAD` in `gitHead()` (`:258-264`). Say so in a comment, so the omission reads as
  deliberate rather than forgotten.
- **The check step** builds its arguments the way the characterization one does:

  ```
  args="--report scripts/smoke-reports/"
  if [ "${{ inputs.scope }}" != "sample" ]; then args="$args --all"; fi
  node scripts/smoke-pages.mjs $args
  ```

  with `DE_BASE_URL: ${{ env.SERVER_URL }}` — which takes `ensureDevServer`'s path 1, so the
  script trusts this server, owns nothing, and probes Pagefind rather than building it
  (`dev-server.mjs:182-199`). `inputs.scope` is empty on a `pull_request` event, so PRs get
  `--all`. Give the workflow a `workflow_dispatch` with the same `scope: all|sample` choice input.
- **Artifact:** `scripts/smoke-reports/` and `hugo-server.log`, gated
  `if: always() && steps.check.outcome != 'success'` — never `if: failure()`, because a job
  cancelled by `timeout-minutes` skips a `failure()` step while still running an `always()` one
  `[run 32802721473, 2026-08-25]`. **No `include-hidden-files`**: that flag exists in the
  characterization workflow for `.sc-check`, a dot directory, and smoke writes no dot path. Say
  that in a comment so the next person does not read its absence as an oversight.
  `scripts/smoke-reports/` is already gitignored (`.gitignore:92-93`).
- **`timeout-minutes: 30` as a placeholder**, with a comment saying it is unmeasured and that
  Tasks 5 and 6 replace it.

**Proof:** `actionlint` if it is available. YAML alone proves little here — the real proof is
Task 5, and this task is not done until that run exists.

## Task 3: Pagefind pre-flight assertion

**Files:** `.github/workflows/smoke.yml`, one step between the Pagefind build and the check.

**Interfaces:** consumes Task 2's server; produces nothing.

`KNOWN_NOISE` has one **conditional** entry — `{ page: null, error: /pagefind/i, when: () =>
!pagefindServed }` (`smoke-pages.mjs:115`). If the index is absent, every Pagefind error on every
page is allowlisted and the run goes green while blind. CLAUDE.md records what that hides: with
the predicate forced off and no index, smoke failed 33 of 33, and the masked errors included
`PagefindUI is not defined` on every page `[2026-08-24]`.

A green CI run must therefore assert the index was actually served, not assume the build step
worked. Add a step that curls the same asset `dev-server.mjs` probes (`PAGEFIND_PROBE`, `:67`) —
through the server rather than the filesystem, so it tests what the browser will get:

```
- name: Confirm Pagefind is served
  run: curl -fsS -o /dev/null "${SERVER_URL}pagefind/pagefind.js"
```

**Proof:** run that `curl` against a server whose `docs/pagefind/` has been removed and confirm it
exits non-zero — a pre-flight that cannot fail is not a pre-flight. Then restore and confirm
exit 0.

## Task 4: The base-branch control job

**Files:** `.github/workflows/smoke.yml`, second job `base-control`.

**Interfaces:** consumes the sweep job's failure (`needs:` the sweep job, `if: failure() &&
github.event_name == 'pull_request'`). Produces a `$GITHUB_STEP_SUMMARY` verdict.

Copy `site-characterization.yml`'s `base-control` job, which is the working example, including:

- Two checkouts — this PR at the root (the harness, `KNOWN_NOISE`, Task 1's route), and
  `github.event.pull_request.base.sha` into `base/` (the site under test). `base.sha` is the base
  **branch tip**, not the merge base `[verified 2026-08-24 on PR #1480]`; the tip is what the PR
  merges into and needs no history, where a real merge base would need `fetch-depth: 0`.
- Two `npm ci`, because the two trees play different parts: the root runs the harness and needs
  Playwright, `base/` builds the site and needs its own locked `hugo-extended`.
- Server started with `working-directory: base`, log to `../hugo-server-base.log`, the same
  clock-bounded wait, `npx -y pagefind --site base/docs`.
- The check step `continue-on-error: true` with an `id`, because RED here is a **finding**, not a
  failure of this job — `outcome` is the result before `continue-on-error` is applied.
- A `Verdict` step writing to `$GITHUB_STEP_SUMMARY`: green base means the PR caused it, red base
  means the world moved and the PR is probably innocent.
- Artifact upload gated on the control step's `outcome == 'failure'`.

Two things to change from the characterization copy:

1. The verdict prose. Smoke's "the world moved" causes are an EHDP-data rename that throws at
   runtime, or a third-party embed being down — not a baseline mismatch. Say that, and point the
   reader at the sweep artifact's `signatures` array, which groups failures by exact error text
   and is the actionable half of the report (`smoke-pages.mjs:235-246`).
2. Drop the stale claim that `production` carries no harness (see Decisions). Replace it with the
   reason the split checkout still holds: `KNOWN_NOISE` is inside the harness, so a PR that adds
   an allowlist entry must not have the control run without it.

**Proof — the discriminating arm must edit the SITE SOURCE, not a shared input.** Both jobs run
the same harness, so a change to `smoke-pages.mjs` moves both arms together and the test passes
whichever way the mechanism works. On a throwaway branch, inject a one-line JS error into a shared
template (a bad identifier in an inline `<script>` in `head.html`) and open a PR into
`production`:

- expected: sweep RED on hundreds of pages, `recheckCapped: true` in the report, base-control
  **GREEN**, verdict reads "this PR's changes are".
- Then run the other arm — an injection both arms share — only to confirm it goes **both-red**,
  which is the branch that has never executed on the characterization workflow either.

Write these two expectations down before the run, and check the result against them rather than
reading the result to fit.

## Task 5: Calibration run

**Files:** none. This is a run, not an edit.

Open the PR into `production`. Do **not** merge to test it: `hugo-build-to-prod-prod.yml` is
`types: [closed]` with a `merged == true` guard, so a PR into `production` does not deploy, and
`workflow_dispatch` will not register until the file is on the default branch anyway
(CLAUDE.md, "Branching and deployment"). The PR's own `pull_request` run is the calibration.

Record from the run's step timings, each as its own number:

1. seconds to a serving `prod_prod` build (the wait step's own "Server answered after Ns"),
2. the Pagefind build,
3. the sweep,
4. total job wall time,
5. the concurrency and processor count the harness printed,
6. `pagesChecked` and `recheckCapped` from the uploaded report, if it failed.

**A green run proves only the unconditional steps.** The artifact upload, the base-control job and
the Pagefind pre-flight's failing branch are all conditional and are proved by Tasks 3 and 4, not
by this one.

## Task 6: Set the timeout, docs, and the stale comment

**Files:** `.github/workflows/smoke.yml`, `CLAUDE.md` (the Smoke test section),
`.github/workflows/site-characterization.yml` (one comment).

1. Replace the placeholder `timeout-minutes` with a figure derived from Task 5's measured total.
   `site-characterization.yml` uses 2.4x its measured 8m13s; state the multiple and the
   measurement it is a multiple of, so the next person can re-derive it.
2. CLAUDE.md's Smoke test section: add that CI runs the full sweep on every PR into `production`
   under `prod_prod`, that the harness blocks `www.googletagmanager.com`, and that a failure gets
   a base-branch control job. Keep it to the section's existing bullet style.
3. Correct `site-characterization.yml`'s `base-control` comment, which asserts `production`
   carries neither the harness nor a baseline. Both are there now `[verified 2026-08-26:
   git ls-tree --name-only production -- scripts/]`. Restate the design reason that survives —
   holding the harness constant so only the site source varies.
4. `readme-development.md`'s workflow table lists deploy workflows only and does not carry
   `site-characterization.yml` `[verified 2026-08-26: a grep for .yml returns four table rows, all
   hugo-build-*]`. Leave the smoke workflow out for consistency rather than adding one of two.

**Proof:** `npm run docs-check` with a stash control — the pre-existing failures must be identical
with and without these edits — plus an injected bogus path in one added sentence, to prove the
zero-new-failures reading comes from a probe able to fire. Note that this worktree has never
built, so `docs/` and `resources/_gen` are absent and `docs-check` reports two "path does not
exist" failures on CLAUDE.md on a clean tree.

## Environment state

- Worktree `EH-dataportal.worktrees/feature-smoke-GHA`, branch cut from local `production` at
  `9ebb11e85f`. Confirm no upstream is set: `git config --get branch.feature-smoke-GHA.merge`
  should be empty.
- Tasks 1 and 3 need a running `prod_prod` server. `smoke-env.mjs` and `characterize-env.mjs`
  share :8090 and each refuses to start while the other holds it. If a run is interrupted, look
  for a surviving `hugo.exe` before re-running — `TaskStop` does not reap the process tree.
- Never run a second Hugo builder against this tree while one is up; `resources/_gen` is shared
  and not namespaced by environment.

## Deferred

- **Sharding the sweep across runners.** If Task 5 shows the job is uncomfortably long,
  `smoke-pages.mjs` has no shard flag and would need one (`--shard i/n` over `collectAllPaths`'s
  output). Not worth building before there is a measured number saying it is needed.
- **Rendering the `signatures` table into `$GITHUB_STEP_SUMMARY`.** The report JSON already
  carries it; a small node step would turn a 900-line log into a table. Genuinely useful, entirely
  cosmetic, and it should not delay the first working run.
- **A smoke run against `dev_stage` as well.** The two environments pin different `data_branch`
  values, so a staging-only data break is invisible to a `prod_prod`-only check.
  `npm run smoke:env dev_stage` exists for it; whether CI should pay for a second full sweep is a
  separate decision.
