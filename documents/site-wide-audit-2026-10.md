# Site-Wide Audit (2026-10)

<!-- Not opted into docs-check: carried-forward rows cite paths on the tree each was found on. -->

The plan, ledger and decisions are in `documents/site-wide-audit-plan-2026-10-17.md`. Neighborhood
Reports rows are checked on #1491's branch (`feature-MOD-Lab-NR-recode-refactor-merge`), everything
else on `production` (D1). Every row names the tree and commit it was checked on.

## Row schema

| Field | Values |
|---|---|
| ID | `A-001`… carried forward, `N-001`… new |
| Source | document + section, or `new` with the instrument or area that found it |
| Claim | one sentence: what is wrong and where (`path` + symbol, line as a hint only) |
| Status | OPEN · FIXED · OBSOLETE (the code it describes is gone) · BRANCH-SCOPED · DISCONFIRMED · UNVERIFIED |
| Evidence | CONFIRMED (runtime) · CONFIRMED (trace) · TRACE · the `[verified …]` stamp |
| Tree | `production @ <hash>` or `#1491 @ <hash>` |
| Priority | set in plan Task 6 only |

## Sources

Enumerated from `git ls-tree -r <ref> -- documents/` on `production` (`b8f4b32fbd`, 33 files) and
#1491's branch (`d1c7402735`, 48 files: the same 33 plus 15 NR documents) `[2026-10-17]`.
"Units" counts `###`/`####` headings plus numbered table rows in the document as a whole, by one
regex pass. It is an upper bound on findings, inflated on plans by ledger rows. Each Task 2 group
reconciles its rows against the scope column, not against this number.

| Group | Source | Tree | Lines | Units | Scope for Task 2 |
|---|---|---|---|---|---|
| G1 | `site-wide-audit-2026-06-27.md` §1–§10 | production | 2884 (whole) | 89 (whole) | every finding in §1–§10, including FIXED ones |
| G2 | `site-wide-audit-2026-06-27.md` §11–§21 | production | — | — | every row of §11's table and every finding in §12–§21 |
| G3 | `data-explorer-fresh-audit-2026-07-13.md` | production | 691 | 45 | every tier item and follow-up |
| G3 | `data-explorer-deep-audit-2026-06-27.md` | production | 476 | 16 | closed per its own status; re-check each FIXED claim |
| G3 | `consolidated-improvements-2026-04-18.md` | production | 790 | 20 | all 20 items; no other document reconciles this list |
| G4 | `de-pre-ship-review-2026-10-02.md` | production | 338 | 28 | findings 1–26 and any later; status trail in `de-production-deploy-plan-2026-10-01.md` "Review findings" and site-wide §21 |
| G4 | `de-analytics-audit-2026-10-16.md` | production | 284 | 26 | "Findings" 1–6, "Unexplained, recorded only" |
| G4 | `de-chart-width-findings-2026-10-15.md` | production | 106 | 10 | the one finding and its options |
| G5 | `audit-backlog-production-2026-08-20.md` | production | 1002 | 56 | the three "Found while executing…" sections only (12 items by their titles; Tasks 1–22 are done) |
| G5 | `cross-branch-consolidation-2026-09-18.md` | production | 228 | 10 | "What is left" item 2 (CARTO allowlist) |
| G5 | `site-characterization-plan-2026-08-23.md` | production | 2332 | 98 | the findings sections under Tasks 1–7 that are not marked fixed, and Task 16 (owed) |
| G5 | `smoke-workflow-plan-2026-08-26.md`, `smoke-env-plan-2026-08-26.md`, `section-header-standardization-2026-09-24.md` | production | 567 / 128 / 50 | — | their "Deferred" and "What is NOT known" sections |
| G5 | `nr-de-merge-integration-plan-2026-08-15.md` | production | 2992 | 37 | "Open follow-ups after this plan closed" only |
| G6 | `nr-accessibility-audit-2026-08-10.md` | #1491 | 637 | 26 | §2 findings, §3 site-shell defects (these are checked on `production` too), §4 disconfirmed (kept as disconfirmed unless re-run says otherwise) |
| G6 | `nr-print-view-fix-2026-08-10.md` | #1491 | 249 | 10 | anything not marked done |
| G7 | `nr-pagefind-parity-2026-08-15.md` | #1491 | 439 | 21 | §2 findings |
| G7 | `nr-followups-2026-08-15.md`, `nr-merge-production-2026-09-01.md`, `-09-26.md`, `-10-16.md` | #1491 | 127 / 212 / 103 / 112 | — | ledger rows not marked done; each "Follow-ups" section |
| G7 | `nr-output-option-d-execution-plan-2026-08-06.md`, `nr-output-retirement-scoping-2026-08-04.md`, `nr-topic-index-picker-restore-2026-08-09.md` | #1491 | 409 / 1064 / 147 | — | "Findings that the scoping memos do not record"; "Two bugs the capture surfaced"; §5 known noise |

**Left out, with the reason:**

- `consolidated-improvements-2026-04-17.md` and `-04-19.md`. `data-explorer-deep-audit-2026-06-27.md`
  opens as an addendum to both, and its §1 is "Status of the consolidated recommendations (verified
  against current code)". G3 re-checks that section.
- Architecture, convention and design documents with no findings sections: `data-explorer-architecture.md`,
  `nr-architecture.md`, `js-conventions.md`, `cp-report-analytics-events.md`, the DE state-namespace
  and guardrails design/plan pairs, the tier-4.1 pair, `characterize-env-plan-2026-08-26.md`,
  `smoke-explorer-indicators-plan-2026-10-02.md` (closed 2026-10-03), `merge-merge-production-into-production-2026-08-19.md`,
  `nr-comparison-buildtime-brief-2026-08-12.md`, `nr-style-port-2026-08-12.md`,
  `nr-characterization-environment-options-2026-08-11.md`, `nr-decisions-and-sequencing-2026-08-04.md`,
  `nr-landing-list-unification-2026-08-09.md`, `nr-neighborhood-picker-options-2026-08-09.md`,
  `hotfix-smoke-test-issues.md` (no headings below `##`; G5 may read it if a finding there is cited),
  `plan-data-explorer-structural-cleanup.prompt.md`.

**Divergent copies of the site-wide audit:** none hold anything `production`'s copy lacks.
`production`'s blob (`e9dd5403f3`) is the same on #1491's branch. Of the 9 other blobs across 123
local and remote refs, 7 are past versions of the file in `production`'s own history. The other two,
on `feature-MOD-Lab-NR-recode-refactor-backup` and `feature-new-data-explorer-backup` (last edited
2026-08-11 and 2026-07-25), differ only in earlier states of §11 rows and headings that `production`
carries in later form `[verified 2026-10-17: audit_copies.py grouping by blob; git log production --
<file> blob set (19 blobs, control: e9dd5403f3 present); every line of the two backup copies absent
from production's copy, read in full]`.

## Carried forward

*Task 2.*

## Instrument results

*Task 3.*

## Candidates

*Task 4. Candidates are not findings until Task 5 reproduces them.*

## New findings

*Task 5.*

## Disconfirmed

*Task 5.*
