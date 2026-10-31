# DE characterization baselines filed per EHDP-data branch — plan and ledger (2026-10-31)

**Status as of 2026-10-31: Tasks 1–4 done (`0b259e9a95`; the audit closure is the commit after it). Task 5 found
that merging R3 would silently overwrite `production/2380.json`; the fix (reverting `987d8397dc` on R3) waits on
Chris.** Branch `feature-de-harness-branch-baselines`, cut from local `production` when it matched
`origin/production` (`git rev-list --left-right --count production...origin/production` read `0 0`).

## Why

`scripts/de-characterization.mjs` kept one baseline, `scripts/de-characterization-baseline/`, and checked whichever
server it reached against it. Staging and production EHDP-data disagree on what it captures (indicator 2380's links
`markCount`, below), so one baseline failed on one of the two data branches whatever it held.
`scripts/nr-characterization.mjs` already solved this by reading `data_branch` off the served page and filing under
`scripts/nr-characterization-baseline/<branch>/`; this copies that.

It also closes audit row A-395 (batch R9): the committed baseline failed `--check` on `dev_stage` by the 16 lines
EHDP-data had moved.

## Ledger

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Harness reads `data_branch` off the page, files baseline and current captures under `<dir>/<branch>/`, refuses an unreadable branch (exit 2) and a `--check` with no baseline for the branch (exit 1); old baseline moved to `staging/` | `0b259e9a95` | **DONE 2026-10-31** | `node --check` passes; no `BASELINE_DIR`/`CURRENT_DIR` left. Unreadable: `DE_BASE_URL` at a port nothing serves (:8097) → exit 2, "REFUSING TO RUN" |
| 2 | Re-capture `staging/` on a `dev_stage` server (A-395) | `0b259e9a95` | **DONE 2026-10-31** | `--check` on a harness-started `dev_stage` server, before re-capturing: "EHDP-data branch: staging", exit 1 on 16 lines (the old baseline, now read from `staging/`). `--baseline` then `--check`: PASSED. All three files have the same blob hashes as R3's `987d8397dc` copy; 2023 and 2380 differ from `production`'s, so the comparison discriminates |
| 3 | Capture `production/` on a production-data server, after a `--check` there has refused for want of a baseline | `0b259e9a95` | **DONE 2026-10-31** | Isolated `prod_prod` build of this branch served on :8096 via `DE_BASE_URL`. `--check` with no `production/` → exit 1, "NO BASELINE for EHDP-data branch \"production\"". `--baseline` then `--check`: PASSED. `staging/` against `production/`: one line, 2380 links `markCount` 17 → 43 |
| 4 | Docs: CLAUDE.md's harness bullet; close A-395 in `documents/site-wide-audit-2026-10.md` | `0b259e9a95` (CLAUDE.md); audit in the commit after it | **DONE 2026-10-31** | `npm run docs-check` PASSED. `close_a395.py`: row FIXED, counts OPEN 15/59/131/2 = 207, FIXED 252, Roadmap total 74, R9 0/5. `recount.py` reproduced the parent's table first (208 / 251), then read the new one; `check_batches.py`: ordered, 74 ids, none missing or extra. `git diff --numstat` 7/7 |
| 5 | `git merge-tree --write-tree` against `feature-audit-r3-explorer-behaviour` | — | **BLOCKED on Chris** | Exit 0, no conflict, but the merged `production/2380.json` is R3's staging capture (`cee4619d1d`, 17), not this branch's (`99abcb0fb2`, 43): git follows the rename to `production/` and applies R3's in-place edit to it. Either merge order goes through the same rename detection. Proposed fix: revert `987d8397dc` on R3, whose staging capture this branch carries byte-identically; then re-run this merge-tree and expect `production/2380.json` = `99abcb0fb2` |

Scripts and logs: `scripts/.sc-rebaseline/de-baselines/` (git-ignored, on the machine that ran them): `close_a395.py`
and the `check-*.log` / `baseline-*.log` files named above.

## Next commands

```
git log --oneline production..HEAD
node scripts/de-characterization.mjs --check     # with no server running, starts dev_stage; expect PASS against staging/
# after R3's revert of 987d8397dc:
git merge-tree --write-tree HEAD feature-audit-r3-explorer-behaviour   # then:
git rev-parse <tree>:scripts/de-characterization-baseline/production/2380.json   # expect 99abcb0fb2...
```
