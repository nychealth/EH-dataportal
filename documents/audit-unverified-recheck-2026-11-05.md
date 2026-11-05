# Audit: re-check five UNVERIFIED rows (2026-11-05)

Ledger for re-checking five of the 14 UNVERIFIED rows in `documents/site-wide-audit-2026-10.md`, chosen 2026-11-05 (Chris). Branch `docs-audit-unverified-rows`, cut from `production` at `bd7008bda8` (#1545's merge). Each row's result is written into its audit row; this file records status and the proof that ran.

**Status as of 2026-11-05: four rows checked and written into the audit; A-324's row waits on the commit holding its plan edit.**

Left alone, by decision: A-063, A-314 and A-315 (past harness runs; the plan's 2026-10-17 decision not to re-run them), A-306 and A-307 (settling them sends real hits to the production GA property), and A-056, A-244, A-271 and A-387 (questions for a person, not checks).

| Row | Check | Commit | Status | Proof that ran |
|---|---|---|---|---|
| A-375 | scratch `nr-print-check.*` at the repo root | *no commit* (the files are not in the repo) | **DONE 2026-11-05**, OBSOLETE | `ls` and `git status --porcelain --ignored`: neither file |
| A-402 | VS Code CSS diagnostics on `nr-topic-index.html` | *no commit*; the block went in `6e368b6e98` | **DONE 2026-11-05**, OBSOLETE | `git log -S'<style'` on the file: present only from `0eb7e79589` to `6e368b6e98`; 0 style blocks or attributes now; VS Code diagnostics `[]` (low power alone: the file may not be analyzed) |
| A-324 | GitHub's docs on `schedule:` and the 60-day disable | plan edit in `site-characterization-plan-2026-08-23.md` Task 16 | **In progress**: quote added; the audit row needs the commit's hash | WebFetch of docs.github.com "Events that trigger workflows", `schedule` section, 2026-11-05; `gh repo view --json visibility` → PUBLIC |
| A-136 | Datawrapper's shared `window.dw` | *no commit* (vendor code) | **DONE 2026-11-05**, OPEN P3, closes with A-138 | Planned a browser probe; ran a trace instead, since the claim is about the bundle's code: `curl` of `a899A/embed.js`, `dw-2.0.min.8ebff7da.js` and `web-component.c1b2531a.js`, grep for the merge line and the guard |
| A-353 | dangling `aria-describedby` on NR report-map tooltips | `ace23eef17` (2026-08-11) | **DONE 2026-11-05**, FIXED | `scripts/.sc-rebaseline/unverified-2026-11-05/a353-probe.mjs` (git-ignored), isolated prod_prod at `bd7008bda8`: shipped 42 opened / 0 dangling, control (listener detached) 42 / 42; output beside it |

Next, after the work commit lands:

```
git log -1 --format=%h -- documents/site-characterization-plan-2026-08-23.md   # A-324's Fixed-by hash
```

then A-324 → FIXED in the audit (UNVERIFIED 10 → 9, FIXED 283 → 284, the Summary paragraph), recounted.

Closing a row edits five places in the audit (its Summary paragraph says which). Recount with the scripts in the `project-audit-recount-method` memory, after reproducing `HEAD`'s table first.
