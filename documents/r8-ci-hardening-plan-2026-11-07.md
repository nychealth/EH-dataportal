# Audit batch R8: CI and repository hardening (2026-11-07)

Batch R8 of `documents/site-wide-audit-2026-10.md`: 13 P2 rows, all in `.github/workflows/` apart
from A-071 (ESLint config) and N-031 (repository settings). Branch `feature-audit-r8-ci-hardening`,
cut from the local `production` at `b730ddf7d3`. This document is the ledger.

**Status as of 2026-11-07: Tasks 1–7 committed (`0a817b4be3`..`b75dda4d50`, and 7b in `e43f967978`) and checked locally on `feature-audit-r8-ci-hardening`; Task 8 (GitHub dispatches, audit rows) not started.**

## Decisions

Chris, 2026-11-07:

1. **Build workflows use `npm ci` with the npm cache and drop the lockfile commit-back** (A-079,
   A-080, N-038). `smoke.yml` and `site-characterization.yml` already do this, and they are the
   exemplar. The commit-back step (`elstudio/actions-js-build/commit`) made one commit on
   `production` between 2026-06-01 and 2026-11-07, touching only `package-lock.json`. `docs/` is
   git-ignored, so it never committed the built site. With it gone, no build step pushes with the
   checkout's credentials, so checkouts take `persist-credentials: false` (N-032). The publish step
   passes its own `github_token`.
2. **Delete `hugo-build-to-dev-stage.yml` and its two trigger scripts, and record that they existed**
   (N-033). Their purpose was superseded by CloudCannon branch previews. The record goes in
   `readme-development.md`'s workflow table.
3. **`hugo-build-any-branch.yml` refuses to publish to `builds/prod-prod` at all** (N-035). That
   branch belongs to `hugo-build-to-prod-prod.yml` alone.
4. **A-073 now, as a step in `smoke.yml`'s sweep job; A-071 separately.** Enabling more ESLint rules
   may surface existing violations, so it gets its own measurement. A-071 stays OPEN in R8.

Not in this branch: N-031 (branch protection) and the repository's default workflow permission
(`default_workflow_permissions: write`, half of N-032). Both are repository settings, and they are
the team's decision. N-032's workflow half (permissions blocks, `persist-credentials`) is here.

## Tasks

| # | Rows | Change | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| 1 | N-030 | Commit subject and dispatch inputs reach `run:` scripts through `env:`, never `${{ }}` inside the script (`hugo-build-to-prod-prod.yml`, `hugo-build-to-dev-prod.yml`, `hugo-build-any-branch.yml`); the builds' commit message keeps its `Build <hash> ("<subject>")` form | `0a817b4be3` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 2 | A-079, A-080, N-038, N-032 (workflow half), A-078 (build half) | Three build workflows: `npm ci` + `cache: "npm"`, commit-back step removed, `persist-credentials: false`, `contents: write` moved from workflow to job | `0a817b4be3` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 3 | N-033 | Delete `hugo-build-to-dev-stage.yml`, `trigger_dev-stage_workflow.ps1` and `.sh`; their `paths-ignore` entries in `smoke.yml` and `site-characterization.yml`; `readme-development.md` and `CLAUDE.md` rows | `7195ba1fa6` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 4 | N-035 | `hugo-build-any-branch.yml`: a first step fails when the publish branch resolves to `prod-prod` | `0a817b4be3` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 5 | N-034 | `codeql.yml`: the job's `if:` lets `schedule` and `workflow_dispatch` through | `6349501fcb` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 6 | A-078, N-032, N-036 | `check-deploy.yml`: `permissions: contents: read`, `persist-credentials: false`, `curl -fsS`, and the deployed hash checked against `^[0-9a-f]{40}$` before use | `d5e49cc67b` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 7 | A-073 | `smoke.yml`: `npm run lint` after `npm ci` in the sweep job | `b75dda4d50` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | local, below |
| 7b | none (Chris, 2026-11-07, not an audit row) | `fetch-depth: 1` in the three build workflows: their only git reads are `git log -1`, and `enableGitInfo` is commented out in `config/_default/config.toml`. check-deploy keeps `0` for its `rev-list` and `log` between hashes | `e43f967978` | **DONE 2026-11-07** locally; GitHub proof is Task 8 | `grep` of every `git ` command in the three files: the two `git log -1` lines and `git config` only |
| 8 | all | Proof on GitHub, then the audit rows | | Not started | |

## Proof plan (Task 8)

Build workflows run only on a merge or a dispatch, so the PR's own checks exercise only Task 7
(`smoke.yml`). The rest needs dispatches from this branch, which is possible because each file
already exists on `production` (`gh workflow run <wf> --ref <branch>` runs the branch's copy).
Each dispatch below is outward-facing and gets asked about first:

- `hugo-build-any-branch.yml` with `branch=feature-audit-r8-ci-hardening`,
  `publish-branch=r8-ci-test`, `environment=dev_stage`. Exercises Tasks 1, 2 and 4's pass path:
  npm ci and the cache, no commit-back, publish without persisted credentials. Afterwards, check
  `builds/r8-ci-test`'s commit message for the quoted subject, then delete that branch.
- The same with `publish-branch=prod-prod`. Expected: fails at the guard, nothing published.
- `codeql.yml` dispatched on this branch. Expected: the Analyze job runs instead of `skipped`.
- `check-deploy.yml`: not dispatched (Chris, 2026-11-07), because it emails the team when the live site trails
  `builds/prod-prod`. Its first scheduled run after the merge is its proof.

Local, before pushing: every edited workflow parses as YAML, and N-030's injection is reproduced
in `bash` against the old line form and shown inert against the new one.

## Local proof (Tasks 1–7)

- `[verified 2026-11-07: every workflow parses with PyYAML 6, 9 files on HEAD and 8 after (one deleted); a sweep listing every ${{ }} inside a run: script (`scripts/.sc-rebaseline/r8/run_exprs.py`, with `n030.sh` beside it, run on HEAD's copies first as the control) finds the commit subject, inputs.environment and inputs.baseURL in run: scripts on HEAD (prod-prod and any-branch) and none after. What remains: check-deploy's hashes (40-hex-checked or git output), and smoke, characterization and test-print-branch dispatch inputs, which only a writer can set]`
- N-030 at runtime, `bash -e` as GitHub's default shell: the old form exits 1 on `Revert "Fix 3.5 issue"`, exits 2 on `Say "hi`, and runs both `$(echo INJECTED >&2)` and a backticked command. That reproduces the row's evidence. The new form, with the value passed as an env var, holds all five subjects intact with exit 0, and a "Merge pull request" subject is unchanged under both `[verified 2026-11-07]`.
- N-036's check against the live server: `commit_hash.txt` gives 40 hex characters and passes; a missing path under `/indicatorpublic/` gives empty output under `curl -f` and fails `[verified 2026-11-07]`.
- `npm run lint` exits 0 on this tree in 0.9 s. docs-check passes, but its `source-roots` exclude the repo root and `.github/`: a control line naming the deleted `trigger_dev-stage_workflow.ps1` also passed. So the proof that no reference survives is `git grep --untracked` for the three deleted names, which finds only the dated records and the new history notes in `readme-development.md` and `CLAUDE.md` `[verified 2026-11-07]`.

## Next command

Push, open a PR into `production`, then Task 8's dispatches, each asked about first.
