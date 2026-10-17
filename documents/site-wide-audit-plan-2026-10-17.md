# Site-wide audit, October 2026: plan

<!-- Deliberately does NOT declare a `docs-check source-roots` comment: it cites NR-branch paths
     (`assets/js/nr-report/`, `scripts/nr-a11y-audit.mjs`) that do not exist on `production`. -->

**Goal:** one audit document, `documents/site-wide-audit-2026-10.md`, that (a) carries forward every
open finding from the existing audits, each re-verified against today's tree with the command that
verified it, and (b) adds new findings, each reproduced before it is recorded.

**Why now:** the new data explorer reached `production` via #1462 (`b8f4b32fbd`, 2026-10-16), and
the audits on record describe trees that no longer exist. `site-wide-audit-2026-06-27.md` is one
blob on both trees (`e9dd5403f3`, 2884 lines, §1–§21) and records each finding against the branch it
was found on. The DE audits were written against `feature-new-data-explorer` before its merge.
Findings are spread across 48 documents in two branch-scoped sets: 33 on `production`, all also on
#1491's branch, plus 15 that exist only there (Task 1 classifies them). (Corrected 2026-10-17: the
first draft of this paragraph gave 2761 lines on `production`, read from the stale
`EH-dataportal.worktrees/production` checkout that Environment state warns against.)

**Not a `/code-review` job:** that reviews a diff, and an audit needs the whole tree. Whether its
path-target form can review a directory wholesale is unverified, and Task 0 checks it.

## Ledger

**Status as of 2026-10-17: plan written on `documentation-site-wide-audit-2026-10`, cut from local
`production` at `b8f4b32fbd`. D1–D5 decided. Tasks 0–2 done (Task 2: 512 G rows re-verified, deduplicated into 402 `A-` rows); Task 3 done (instrument results and N-001..N-018 in the audit doc); Task 4 (judgment pass, 8 subagents per D4) next; Tasks 4–7 not started.**

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Evidence: `/code-review` path target, and the census fields | *no commit* (read-only probes) | **DONE 2026-10-17** | **Step 2: outcome (ii), so `/code-review` is not used in Task 4** `[verified 2026-10-17: code-review skill, args "low scripts/site-urls.mjs", run in the clean NR worktree rather than the audit worktree (both clean; the file is the same on both); it ran git diff @{upstream}...HEAD and git diff HEAD restricted to the path, both empty, and returned "no changes to review"]`. The path target narrows a diff and does not review a file. **Step 3** `[verified 2026-10-17: census_power.py, one Python walk over the 924 records in scripts/site-characterization-baseline/prod_prod/, captured at gitHead 28c635d944, 14 commits behind production b8f4b32fbd]`. Pages hit per field: `headingJumps>0` 920 · `landmarks.h1==0` 3 · `h1>1` 257 · `img.missingAlt>0` 215 · `img.zeroSize>0` 262 · `links.emptyHref>0` 924 · `links.noAccessibleText>0` 20 · `controls.noAccessibleName>0` 55 · `tables` without `th` 1 · `overflowX` 558 · iframe `zeroSize` 7 (23 same-origin iframes, 9 Datawrapper). Constant across all 924: `landmarks.main==0` false (constant non-zero, live by sign), `meta.description` true (same), `jsonld.parseError` false (constant zero; its probe fired under injection in `site-characterization-plan-2026-08-23.md`, 11 of 11 probes). **Two fields carry a site-shell floor and must be read above it, not as counts:** `emptyHref` is 29 on 603 pages and never below 29; `headingJumps` is 1 on 639 pages. **Corrected at Task 3: `emptyHref` has two floors, 29 on `header.html` pages and 22 on the 41 explorer topic pages (`header-de.html`; 12 on the explorer section page), and the baseline this probe read already carried them** `[verified 2026-10-17: the 42 pages below 29 listed from a fresh capture and the committed baseline, identical values]`. Task 3a reports each field per template, minus the shell floor. Correction to this probe: its first iframe predicate tested a `height` key the records lack (they carry `host`, `zeroSize`), so it counted pages with any iframe (53); fixed before recording |
| 1 | Inventory of existing findings, and a cost estimate | `38f75c9f4b` — `site-wide-audit-2026-10.md` Sources | **DONE 2026-10-17**; stopped for D5 | `[verified 2026-10-17]` Step 1: `doc_inventory.py` over `git ls-tree` on both refs: 48 files (33 on `production`, all on #1491 too; `js-conventions.md` differs between them; 15 NR-only). Classified into 7 groups (Sources table) and a left-out list with reasons. Step 2: `audit_copies.py`: 123 refs, 10 blobs; 7 non-production blobs are in `production`'s own file history; the 2 `-backup` branch blobs read in full, nothing `production` lacks. Step 3: regex unit counts per source (upper bound, 721 over the 28 sources counted; inflated by plan ledger rows), so each group reconciles against its scope column instead. `consolidated-improvements-2026-04-18.md` is referenced by no other document (`git grep '04-18'`, empty; control `04-19` hits the deep audit), so it is in G3. Correction: the plan's Why paragraph gave 2761 lines on `production`, read from the stale `production` worktree; fixed in place |
| 2 | Compile and re-verify existing findings | G4, G5: `8525123a28`; G6, G7: `a7d6ae5c4c`; G1: `ca67d6cb3d`; G2, G3: `4ca15d8fd2`. Step 3: `7e6bba7091` (G4–G7), `b95c713485` (G1–G3). Step 4: the next commit on this branch after `b95c713485` | **DONE 2026-10-17** — **Step 1 DONE 2026-10-17**: 7 Sonnet subagents, G1–G7, briefs as in Appendix A. **Landed: G1 (100 rows), G2 (100) and G3 (144) from the 09:03 re-dispatch, G4 (49), G5 (43), G6 (43), G7 (33): 512 rows**, each recounted from the audit doc with `tally.py` (no duplicate or malformed rows). G2 read some files from the stale `EH-dataportal.worktrees/production` checkout; its one foreclosing disk-read row (G2-61, lint) was re-run here and holds (G2 preamble in the audit doc). G2 and G3 originally stopped early on the account's session limit (HTTP 429, "resets 3:40am America/New_York", 2026-10-17). A group counts as landed only once its rows are committed under its heading in "Carried forward"; a new session re-dispatches G2 and G3 from Appendix A. Four of the seven groups (G1, G3, G4, G5) gave status tallies that disagree with their own tables; every tally in the audit doc was recounted by ID. **2026-10-17 09:03: G2 and G3 re-dispatched** as fresh agents (not resumed), with #1491 reads pinned to `d1c7402735` through git, because the local NR branch is at `00737207cb` while `origin` and PR #1491 are at `d1c7402735`. **Step 2 DONE** inside each group's own reconciliation section, against the Sources scope column (Task 1's decision, since the regex counts are an upper bound); those per-section mappings were not independently re-derived. **Step 3 DONE 2026-10-17:** all 248 foreclosing rows confirmed (G4–G7 74/74 on 155 checks; G1 36/36 on 112, G2 31/31 on 92, G3 107/107 on 280), and an OPEN sample of 19/19 still holds (`open_sample.py`, seed 20261017). That sample was drawn per group, not per source as Step 3 says; this is recorded in the audit doc. **Deferred, the user's call:** re-drawing it per source (`open_sample.py` would need a per-source pool); nothing downstream waits on it. Three rows changed (G3-70 evidence corrected; G3-126 split at Step 4; G2-19 control supplied), and three candidates were logged as C-S3-1..3. All of this is in the audit doc's two "Step 3" paragraphs and Candidates. **Step 4 DONE 2026-10-17:** 512 G rows → 402 `A-` rows (90 merged rows holding 200 G rows, 311 one-member rows, one split-only row, G5-43 absorbed); G1-76, G2-02, G3-126 and G6-24 split across two rows each. Statuses: OPEN 151 (two "OPEN (declined)"), FIXED 188, UNVERIFIED 37, OBSOLETE 10, DISCONFIRMED 10, BRANCH-SCOPED 6. Members that disagreed were settled from their evidence, and four needed a new check: A-021 (G2-21's lockfile walk missed `worker-loader`'s webpack peer edge, so G1-22 holds), A-128 (`.lang-select` handlers share no effect: DISCONFIRMED), A-133 (production's NR landing templates carry an unnamed `flex_search` too), A-125 (G2-50's lines off by one). Every line number in an `A-` claim was re-derived at P or N. One candidate logged, C-S4-1: `docs-check` exits 1 in a worktree with no build output, on `CLAUDE.md`'s `docs/` and `resources/_gen/`. All of this is in the audit doc's "Deduplicated rows (`A-`)" preamble `[verified 2026-10-17: build_a_rows.py over clusters.tsv reports 512 = 511 placed + 1 absorbed, reading placement off the finished table; control: a spec naming G9-01 and the whole of split G1-76 exits 1 with both errors; a re-dump of the G rows after insertion is byte-identical to the dump before (cmp); 0 CR bytes in the doc]` | Per group, in each group's heading block. Found by G5–G7: the #1491 worktree HEAD had moved to `00737207cb`, four commits past `d1c7402735` (recorded in the audit doc's tree caveat). Re-dispatching G1–G3 should name the then-current hashes (Appendix A) |
| 3 | Instrument pass on both trees | the next commit on this branch after `08c2bd5816` | **DONE 2026-10-17** | All in the audit doc's "Instrument results"; P measured in the audit worktree (code = `b8f4b32fbd`), N in a detached worktree at `d1c7402735`. **3a:** census 924/924 pages per tree; P is structurally identical to the committed `prod_prod` baseline (0 of 924 differ; control: 924 of 924 differ from the `staging` baseline). **3b:** `scripts/site-a11y-audit.mjs` built and run over 126 pages; positive control fired; exit 1 by design for one unaudited page, `data-features/asthma-syndrome/`, a 404 (N-001). Correction to the built script before the recorded run: its first rendered-content control (200 characters of `<main>`) failed four real short pages and was replaced. A repeat run matched on every rule but one (`aria-allowed-attr` 2 → 3 pages). **3c:** smoke-env `prod_prod` PASSED on both trees, 1187 pages, 0 failures, 0 cleared on re-check. **3d:** `a11y:nr` at N, 0 violations in all 7 states, control fired (ran on the `dev_stage` server it spawned, the planned environment being unstated). **3e:** lint exit 0 on both with positive controls; docs-check exit 1 on both, C-S4-1, mechanism shown by creating the two directories; npm audit 32, Dependabot 25 open, CodeQL 12 open. **Output:** 18 `N-` rows and candidates C-T3-1..3 |
| 4 | Judgment pass, by area | — | Not started | — |
| 5 | Verify every candidate | — | Not started | — |
| 6 | Prioritize and write up | — | Not started | — |
| 7 | Point the old audits and `CLAUDE.md` at the new one; PR | — | Not started | — |

Environment state:

- Worktree for this branch: `EH-dataportal.worktrees/documentation-site-wide-audit-2026-10`.
- NR-branch reads use the existing worktree `EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor-merge`
  (PR #1491), or `git show feature-MOD-Lab-NR-recode-refactor-merge:<path>` from any worktree.
- **Do not use `EH-dataportal.worktrees/production` as a reading copy.** Its HEAD is `b8f4b32fbd`,
  but its index and files are an older tree: `git status` there shows staged deletions and
  modifications, and its `documents/` holds 16 files against 33 in HEAD `[verified 2026-10-17]`.
  Nobody in this plan owns that state, so leave it alone and read `production` through `git show production:<path>`.

- Probe scripts from Tasks 0–1 (`census_power.py`, `doc_inventory.py`, `audit_copies.py`) are in
  the gitignored `scripts/.sc-rebaseline/audit-2026-10/` of this branch's worktree, which exists on
  this machine only. Each takes the path it reads as `argv[1]`: the baseline directory, or the
  worktree root. Task 2's tools are in the same directory. `tally.py <doc> <Gn>` counts a group's
  rows by status and lists its foreclosing IDs. `spotcheck.py <worktree> <checks.tsv> [-v]` is the
  Step 3 runner, with the `checks-*.tsv` files it ran and their `spotcheck-*.out` outputs.
  `open_sample.py <doc> [seed]` draws the OPEN sample. `insert_group.py` and `extract_report.py`
  pasted the returns into the doc. Step 4: `clusters.tsv` is the merge spec (merged and split rows
  only; every other G row becomes a one-member row), `build_a_rows.py <doc> <clusters.tsv> <out.md>`
  builds and reconciles the table, `insert_a_rows.py` placed it with `a_preamble.md` above G1,
  `show_rows.py <doc> <ids…> [--max N]` prints rows' evidence, `rows_dump.py` dumps all G rows, and
  `line_refs.py <a_rows.md> [--all]` lists `A-` claims citing a line. Changing a claim's text in
  `clusters.tsv` keeps the IDs; adding or removing a cluster renumbers every row after it, so once
  the IDs are cited anywhere, edit the doc's rows directly instead of rebuilding. Task 3:
  `scripts/.sc-rebaseline/census-capture.mjs <environment> <out-dir>` (run from the worktree to
  capture), `census_aggregate.py <capture-dir> [path-prefix]`, `a11y_rules.py <a11y-out-dir>`, and
  `insert_t3.py`, which placed `t3_results.md` and `t3_nrows.md`.
- **A detached worktree at #1491's PR head, `C:/Users/Chris/AppData/Local/Temp/nrN`
  (`d1c7402735`), was added for Task 3 and left in place for Task 4's area c.** Its own checkout
  hook installed `node_modules`. It is clean apart from gitignored files. Remove it with `git
  worktree remove C:/Users/Chris/AppData/Local/Temp/nrN` once Task 5 is done, or earlier if #1491's
  head moves (then re-add it at the new head).

Resume commands:

```
git log --oneline production..documentation-site-wide-audit-2026-10   # the task commits
git rev-list --left-right --count origin/documentation-site-wide-audit-2026-10...HEAD   # 0 0 = pushed
gh pr view 1491 --json state,mergedAt     # if MERGED, D1's split collapses: see D1
grep -c '^| A-[0-9]' documents/site-wide-audit-2026-10.md   # 402 = Task 2 landed
grep -c '^| N-0' documents/site-wide-audit-2026-10.md       # 18 = Task 3 landed
git -C C:/Users/Chris/AppData/Local/Temp/nrN rev-parse --short=10 HEAD   # d1c7402735, or re-add it
```

**Resuming in a new session:** Tasks 2 and 3 are complete when the two greps print 402 and 18. The
next action is Task 4: eight subagents, one per area in the Task 4 table, each `model: opus`,
`effort: high` (D4), read-only, area c on the `nrN` worktree and the rest on the audit worktree.
Each brief names the area's scope and tree, the audit doc's `A-` and `N-` rows and Candidates in
that area (so nothing is re-found), and the return shape: claim, `path` + symbol, and a proposed
reproduction. Candidates land in the audit doc's Candidates section; they are not findings until
Task 5.

## Decisions

| # | Decision | Who / when | Notes |
|---|---|---|---|
| D1 | Which tree is audited? | **Split — Chris, 2026-10-17** | Everything outside Neighborhood Reports is audited on `production`. NR (report page, the two index kinds, `assets/js/nr-report/`, the NR harnesses) is audited on #1491's branch, `feature-MOD-Lab-NR-recode-refactor-merge`, 207 commits ahead of `production` at the time of the decision. Rejected: waiting for #1491 (blocks Tasks 2–5), and `production` alone (NR findings would describe the `nr-output` pages #1491 retires). **If #1491 merges mid-audit**, re-run the NR rows' checks on `production` and drop the split; every row records which tree it was checked on, so this is mechanical |
| D2 | Output form: a new compiled document, or extend `site-wide-audit-2026-06-27.md`? | **New document — Chris, 2026-10-17** | Recommended: a new document, `documents/site-wide-audit-2026-10.md`, with stable IDs (`A-001`…) and one status table. The old audits stay as dated records, each gaining a one-line pointer (Task 7). Extending the old one means a third divergent copy of a 2761-line file, a problem `cross-branch-consolidation-2026-09-18.md` has already had to fix once (Step 2 there) |
| D3 | Build a site-wide axe instrument? | **Yes, Task 3b — Chris, 2026-10-17** | No site-wide accessibility instrument exists: `a11y:nr` covers the four NR page kinds, and only on #1491's branch `[verified 2026-10-17: git ls-tree --name-only production scripts/ \| grep -iE 'a11y\|axe' → nothing, and no scripts/*.mjs on production mentions axe-core; control: the same ls-tree on #1491's branch → scripts/nr-a11y-audit.mjs]`. `axe-core ^4.13.0` is already a devDependency on `production`. Recommend Task 3b: `scripts/site-a11y-audit.mjs`, axe over the curated smoke `PAGES` (44) plus the 41 topic pages, reusing `nr-a11y-audit.mjs`'s positive control (an injected `<img>` with no `alt` must fire `image-alt`) and its rendered-content control. **Deferring it** means the accessibility area of Task 4 rests on the census (Task 3a) and on reading code, which misses everything computed (contrast, accessible names produced by JS). Bringing it forward later costs the same script, so deferring saves nothing unless the audit is cut short |
| D4 | Model and effort for Task 4 | **Opus at high effort — Chris, 2026-10-17** | Each Task 4 subagent is dispatched with `model: opus`, `effort: high`, so the orchestrating session's own effort level does not change (global `CLAUDE.md`: an effort switch rewrites the whole cached prefix). **The paired Fable 5.1 run is deferred, not rejected.** There is no measured comparison of the two models on this kind of work, and the test would cost one extra area run plus its Task 5 verification. To bring it forward: re-run area e (SCSS) under Fable and compare confirmed-candidate counts after Task 5, not raw counts, since unverified counts reward volume |
| D5 | Task 2's delegation | **As proposed, full spot-check — Chris, 2026-10-17** | **Proposed:** 7 Sonnet subagents, one per group G1–G7 in the Sources table of `site-wide-audit-2026-10.md`, read-only, run in the background in parallel, each returning rows in the schema. Groups rather than one per document, because 12 of the 28 sources contribute one section each. Approximate scale: ~250–300 findings, from the audit documents' heading and row counts plus the scoped sections; the exact figure is each group's reconciliation. **Cost:** the subagents' own token use is not recorded anywhere I can measure (global `CLAUDE.md`, the 2026-07-29 delegation measurement and its caveat), so I can't price it. What lands in this session is the returned rows (estimated at a few thousand tokens per group), plus Step 3's spot-check, which re-runs every FIXED / OBSOLETE / BRANCH-SCOPED row's command. How many rows that is won't be known until Task 2 returns: the regex marks 238 units closed across the 28 whole documents, but most are plan ledger rows outside the scopes. The re-runs are batched as scripts, not one call per row. **Cheaper alternative:** spot-check a sample of the foreclosing rows instead of all of them. That gives up the guarantee that no FIXED status in the new document rests on a subagent's unrun grep |

## Global Constraints

- **Every row records the tree and commit it was checked on.** `production @ <hash>` or
  `#1491 @ <hash>`. A status without a commit is a relationship that expires (keep-ledger §3).
- **No status from reading alone where a run is possible.** FIXED, OBSOLETE and BRANCH-SCOPED are
  foreclosing claims: each carries the command that established it and a positive control, in the
  form `[verified <date>: <command>; control: <command that returns a hit>]`. A grep returning
  nothing is not evidence of FIXED until the same grep is shown to hit on the tree where the finding
  was written (`git grep <pattern> <old-commit> -- <path>`).
- **Runtime claims need a browser.** CSS, DOM, layout, timing, console behaviour: Playwright on an
  isolated server, per the project `CLAUDE.md` Root-cause claims section. A runtime finding verified
  only by reading is marked `TRACE`, not `CONFIRMED`, in the same vocabulary
  `de-pre-ship-review-2026-10-02.md` uses.
- **Never run two Hugo builders against one tree.** Use `node scripts/smoke-env.mjs <env>`,
  `node scripts/characterize-env.mjs <env>`, or `scripts/isolated-server.mjs`. These serve on :8090
  and refuse to run concurrently with each other.
- Throwaway probes go in the gitignored `scripts/.sc-rebaseline/` and block
  `www.googletagmanager.com` and `www.google-analytics.com`.
- Subagents in Tasks 2 and 4 are **read-only** and return rows; only the orchestrating session
  writes the audit document. They are given the row schema below and this Constraints section.

Row schema for `site-wide-audit-2026-10.md`:

| Field | Values |
|---|---|
| ID | `A-001`… for carried-forward, `N-001`… for new |
| Source | document + section, or `new` with the instrument or area that found it |
| Claim | one sentence: what is wrong and where (`path` + symbol, line as a hint only) |
| Status | OPEN · FIXED · OBSOLETE (the code it describes is gone) · BRANCH-SCOPED · DISCONFIRMED · UNVERIFIED |
| Evidence | CONFIRMED (runtime) · CONFIRMED (trace) · TRACE · the `[verified …]` stamp |
| Tree | `production @ <hash>` or `#1491 @ <hash>` |
| Priority | set in Task 6 only |

## Instrument inventory

What can measure the site today, what each is blind to, and its cost. Enumerated from `production`'s
`package.json` scripts and devDependencies, the NR branch's additions, and `.github/workflows/`
`[verified 2026-10-17]`.

| Instrument | Finds | Blind to | Tree | Cost |
|---|---|---|---|---|
| `node scripts/smoke-env.mjs prod_prod` | console errors and EHDP-data 4xx on ~1188 pages, one DE indicator per unique id | anything that doesn't throw: layout, a11y, wrong data | both | ~220 s local (smoke plan, 2026-10-02) |
| `site-characterization.mjs --out <dir>` on an isolated `prod_prod` | **a census**: per page `headingJumps`, `landmarks.h1`, `img.missingAlt`, `links.emptyHref`, `links.noAccessibleText`, `controls.noAccessibleName`, `tables.withTh`, `overflowX`, zero-height iframes, JSON-LD parse | contrast, focus, anything after interaction | both | ~130 s with build (project `CLAUDE.md`) |
| `--check` against a baseline (`characterize:site`, `:nr`, `:pagefind`, `:cp`, DE `characterize`) | change since the baseline | **any defect present at capture**, so not a defect finder; harness health only | — | not run for findings |
| `npm run lint` | `no-undef` | everything else | `production`: `assets/js/data-explorer/` only; #1491 adds `assets/js/nr-report/` | seconds |
| `npm run docs-check` | stale paths and identifiers in opted-in docs | prose; docs that don't opt in | both | seconds |
| `npm run a11y:nr` | axe plus keyboard, heading, ARIA-reference probes on 4 NR page kinds | every non-NR page | #1491 only | minutes |
| axe-core (devDependency) | WCAG rules, in-page | needs a harness outside NR: D3 | both | — |
| `npm audit`; Dependabot | vulnerable dependencies | unused or duplicated deps | `production` | 25 open Dependabot alerts `[2026-10-17: gh api …/dependabot/alerts?state=open]` |
| CodeQL (`codeql.yml`) | code-scanning alerts | — | `production` | `gh api repos/{owner}/{repo}/code-scanning/alerts?state=open` |
| skills `reviewing-web-performance`, `hardening-github-actions` | checklists for Task 4 areas g and f | — | — | — |
| `/code-review` (skill, non-ultra) | correctness, given a diff; path target unverified | — | — | Task 0 |
| Lighthouse | — | — | not installed (`node_modules` has no `lighthouse`) `[verified 2026-10-17]`; not proposed |

---

## Task 0: Evidence: `/code-review` path target, and the census fields

**Files:** none written; observations go to the Ledger.

**Interfaces:** produces (a) whether Task 4 can use `/code-review <path>` per area, and (b) the
list of census fields Task 3a aggregates.

- [ ] **Step 1: pre-register.** Write in the Ledger before running: `/code-review low` on a clean
  tree with path target `scripts/site-urls.mjs` either (i) reviews the file's contents (findings
  cite lines across the whole file), (ii) reports no diff and stops, or (iii) reviews the path's
  last commit. Only (i) makes it usable in Task 4.
- [ ] **Step 2:** run it on the audit worktree, which has a clean tree. Record which of (i)–(iii) happened.
- [ ] **Step 3: census fields have power.** In the committed `scripts/site-characterization-baseline/prod_prod/`
  records, count pages where each candidate field is non-zero or `false`, with one Python walk.
  Expected: `_home.json` has `landmarks.h1 = 0` and `headingJumps = 1`, so both fields can fire. Any
  field that is constant across every record is dead (global `CLAUDE.md`, "A fixture field identical
  across every case it covers"). Constant `0` needs an injection control before Task 3a uses it.
  `site-characterization-probe-control.mjs` already proves three such fields live. Name which.

## Task 1: Inventory of existing findings, and a cost estimate

**Files:** create `documents/site-wide-audit-2026-10.md` with its header, the row schema, and a
**Sources** table.

**Interfaces:** produces the Sources table that Task 2 dispatches from, with one row per source:
path, tree, line count, finding count, and whether it is already superseded.

- [ ] **Step 1: enumerate, don't pick.** List `documents/` on `production` and on #1491's branch
  (`git ls-tree -r --name-only <ref> -- documents/`). Classify every file as audit/findings, plan
  with a findings section ("Found while executing…", "What is left"), architecture/conventions,
  or closed. Do not filter by filename: `nr-pagefind-parity-2026-08-15.md` and
  `nr-print-view-fix-2026-08-10.md` hold findings and their names contain no "audit".
- [ ] **Step 2: divergent copies.** For `site-wide-audit-2026-06-27.md`, take its blob on every
  local and remote branch, group by blob, and for each blob that differs from both `production`'s
  and #1491's, list the sections it adds (`git diff production:<f> <branch>:<f> | grep '^+#'`).
  `cross-branch-consolidation-2026-09-18.md` Step 2 is the method. Its union merged as #1500
  (`ab3379dc8b`, 2026-09-21). Branches holding a distinct blob on 2026-10-17 included
  `feature-upgrade-hugo`, `content-pesticides`, `RMZ-feature-update`, `feature-base-control-provenance`
  and `build-to-dev-stage`; most are probably older, not ahead. Show which.
- [ ] **Step 3: count findings per source.** Count finding headings (`^### ` under a findings
  section) plus list items in "open items" sections. Record the denominator per document, so Task 2
  can reconcile against it.
- [ ] **Step 4: estimate and stop.** State the Task 2 dispatch: N subagents, which documents each
  takes, model Sonnet, and the approximate total finding count. **Stop and report for D5.**

## Task 2: Compile and re-verify existing findings

**Files:** modify `documents/site-wide-audit-2026-10.md`: a **Carried forward** table of `A-` rows.

**Interfaces:** consumes the Sources table (Task 1). Produces `A-` rows. Rows needing a browser are
marked `UNVERIFIED (runtime)` and handed to Task 5.

- [ ] **Step 1:** dispatch per D5. Each subagent gets: its source documents, the tree each finding
  is checked on (D1), the row schema, Global Constraints, and the instruction to return one row per
  finding, **including findings already marked FIXED in the source**, re-checked.
- [ ] **Step 2: reconcile counts.** Rows returned per source must equal Task 1 Step 3's count; a
  difference is named, never absorbed (global `CLAUDE.md`, "A loop that skips what it cannot
  process must reconcile its own count").
- [ ] **Step 3: spot-check.** The orchestrating session re-runs the command of **every** FIXED,
  OBSOLETE and BRANCH-SCOPED row (they foreclose) and of 3 random OPEN rows per source. Any
  disagreement sends that whole source back.
- [ ] **Step 4: deduplicate.** The same defect recorded in two sources becomes one row whose
  Source names both. Check claim by claim, not by section title.

## Task 3: Instrument pass on both trees

**Files:** modify `documents/site-wide-audit-2026-10.md`: an **Instrument results** section, plus
`N-` rows for anything new. Create `scripts/site-a11y-audit.mjs` (D3).

**Interfaces:** consumes Task 0's field list. Produces `N-` rows with Evidence `CONFIRMED (runtime)`
from the instrument output, and a list of instrument-reported items that Task 2 already holds
(those update the `A-` row's evidence rather than creating a new row).

- [ ] **Step 3a, census, `production`:** fresh capture on an isolated `prod_prod`, not the committed
  baseline, which predates the latest merges. `isolated-server.mjs` has no CLI, so write a probe
  `scripts/.sc-rebaseline/census-capture.mjs` copying `scripts/characterize-env.mjs`'s sequence:
  `startServer("prod_prod")` → `npx -y pagefind --site <destDir>` → spawn
  `node scripts/site-characterization.mjs --all --out <tmp>` with `DE_BASE_URL=<baseURL>` and
  `DE_SERVER_OWNED=1` → `stop()` in a `finally`. Aggregate each Task 0 field across pages, by
  template kind. Expected: at least one page with `landmarks.h1 = 0`, since the committed
  `_home.json` has one.
- [ ] **Step 3a, census, #1491:** the same capture on #1491's worktree, NR pages only (path prefix
  `neighborhood-reports/`).
- [ ] **Step 3b (D3):** build and run `scripts/site-a11y-audit.mjs` on `production`. Its
  positive control must fire before any zero is reported.
- [ ] **Step 3c:** `node scripts/smoke-env.mjs prod_prod` on both trees, saved with
  `> <file> 2>&1`, then `tail`. Record failures that survive the sequential re-check.
- [ ] **Step 3d:** `npm run a11y:nr` on #1491's worktree; read `wcag.incompleteIds` as well as
  `wcag.violations`.
- [ ] **Step 3e:** `npm run lint` and `npm run docs-check` on both trees; `npm audit --omit=dev` and
  the Dependabot and CodeQL counts on `production`.

## Task 4: Judgment pass, by area

**Files:** modify `documents/site-wide-audit-2026-10.md`: a **Candidates** section. Candidates
are not findings.

**Interfaces:** consumes Tasks 2 and 3, so subagents are told what is already recorded and don't
re-find it. Produces candidates with: claim, `path` + symbol, and a proposed reproduction (command
or browser steps). Model and effort per D4.

Areas, one subagent each (tree per D1):

| | Area | Scope | Tree |
|---|---|---|---|
| a | Site shell | `head.html`, `baseof.html`, header/footer partials, `search-modal.html`, `lib-*` partials | `production` |
| b | Data explorer | `assets/js/data-explorer/`, `themes/dohmh/layouts/data-explorer/` | `production` |
| c | Neighborhood Reports | `assets/js/nr-report/`, NR layouts, `_content.gotmpl` | #1491 |
| d | Data features, stories, shortcodes | `themes/dohmh/layouts/data-features/`, `data-stories/`, `shortcodes/`, `content/**/*.js` | `production` |
| e | SCSS | `assets/scss/` | `production` |
| f | Build, CI, config | `.github/workflows/`, `config/`, `package.json` (skill `hardening-github-actions`) | `production` |
| g | Performance | per-template asset weight and blocking scripts (skill `reviewing-web-performance`); census `assets` lists as input | `production` |
| h | SEO and analytics | metas, JSON-LD, `gtag` events; `de-analytics-audit-2026-10-16.md` is prior work | `production` |

- [ ] **Step 1:** dispatch. Task 0 found `/code-review <path>` reviews only a diff restricted to the
  path, so it is not an input here.
- [ ] Each dispatch: `model: opus`, `effort: high` (D4). The paired Fable run on area e is deferred (D4).

## Task 5: Verify every candidate

**Files:** modify `documents/site-wide-audit-2026-10.md`: candidates become `N-` rows or move to a
**Disconfirmed** section, with what was run. `nr-accessibility-audit-2026-08-10.md` §4 is the form.

**Interfaces:** consumes Task 4's candidates and Task 2's `UNVERIFIED (runtime)` rows.

- [ ] **Step 1:** runtime candidates are verified in Playwright on an isolated server; static ones by
  the command that shows them. One failed reproduction is a DISCONFIRMED row, not a retry with a
  second theory (project `CLAUDE.md`: "After one failed fix attempt, stop and gather runtime evidence").
- [ ] **Step 2:** record per area: candidates in, confirmed, disconfirmed. If D4's deferred Fable
  run is brought forward, this ratio is what it compares.

## Task 6: Prioritize and write up

**Files:** modify `documents/site-wide-audit-2026-10.md`: priority on every OPEN row, a summary at
the top, and a roadmap grouped into independently mergeable batches.

- [ ] **Step 1:** priority on a stated axis. P1 = visitors see breakage or wrong data, or a WCAG A/AA
  failure on a public page. P2 = a defect with a workaround, or a maintenance cost with a measured
  instance. P3 = hygiene. Superlatives ("biggest", "highest-leverage") only beside the comparison
  that earns them.
- [ ] **Step 2:** the summary counts rows by status and priority from the table, by script, not by hand.

## Task 7: Point the old audits and `CLAUDE.md` at the new one; PR

**Files:** modify the first lines of each source document Task 1 classified as an audit, on
`production` (one line: "Superseded for status by `site-wide-audit-2026-10.md`; kept as a dated
record"); modify `CLAUDE.md` §Audit documents.

- [ ] **Step 1:** add the pointers. NR-branch documents get theirs when #1491 merges. Record that
  as a follow-up row, not as done.
- [ ] **Step 2:** `npm run docs-check`; expect PASS.
- [ ] **Step 3:** run `reconcile-records` over memory entries that cite the old audits' status.
- [ ] **Step 4:** PR into `production`.

---

## Appendix A: Task 2 dispatch brief

Dispatched 2026-10-17 as seven prompts, each this common brief with `<G>` replaced by the group
id, plus the group's scope and tree note below. Re-dispatch a group with the same text. If the
trees have moved, update the two hashes first (`git rev-parse production feature-MOD-Lab-NR-recode-refactor-merge`).

### Common brief

> You are re-verifying findings from existing documents against today's code, for a new compiled
> audit. You are READ-ONLY: do not edit, create or delete any file in either repository, do not
> commit, and do not start Hugo or any server. You may run git, gh (read-only queries), and
> read/grep files. Write throwaway scripts only under `C:/Users/Chris/AppData/Local/Temp/claude/audit-<G>/`.
>
> **Trees.** production code: worktree
> `C:/Users/Chris/Documents/DOHMH/Programming/EH-dataportal.worktrees/documentation-site-wide-audit-2026-10`
> (its code equals `production` @ `b8f4b32fbd`; only `documents/` differ); record as
> `production @ b8f4b32fbd`. #1491 (Neighborhood Reports branch): worktree
> `C:/Users/Chris/Documents/DOHMH/Programming/EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor-merge`
> @ `d1c7402735`; record as `#1491 @ d1c7402735`. Findings about Neighborhood Reports (report page,
> NR index pages, `assets/js/nr-report/`, NR layouts, `nr-*.html` partials) are checked on #1491;
> everything else on production. Use `git -C <worktree> …` or `git grep <pattern> <ref> -- <path>`.
>
> **Row schema** — return a markdown table `| ID | Source | Claim | Status | Evidence | Tree |`.
> ID `<G>-01`…; Source = document + section; Claim = one sentence, what is wrong and where (`path` +
> symbol, line only as a hint); Status = OPEN · FIXED · OBSOLETE (the code it describes is gone) ·
> BRANCH-SCOPED · DISCONFIRMED (G6 only) · UNVERIFIED (runtime) · UNVERIFIED (other, say why);
> a deferral by decision is OPEN with Evidence beginning "deferred by decision: <where>";
> Evidence = `[verified 2026-10-17: <exact command>; result: <what came back>; control: <command that hits> → <result>]`.
> ONE ROW PER FINDING, including findings the source marks FIXED — re-check those too.
>
> **Verification rules.** (1) FIXED, OBSOLETE and BRANCH-SCOPED need a POSITIVE CONTROL: a grep
> returning nothing today proves nothing unless the same pattern HITS on the tree where the finding
> was written (`git log -S'<string>' --oneline -- <path>`, or `git rev-list -1 --before=<doc date> <branch>`,
> then `git grep -n '<pattern>' <commit> -- <path>`). No control → UNVERIFIED (other). (2) OPEN
> needs the hit that shows it is still there, with the command. (3) Runtime claims (CSS, DOM,
> layout, console errors, timing, rendering, search index, CI behaviour) → `UNVERIFIED (runtime)`
> with the static facts checked plus a one-line reproduction recipe; FIXED only if the cause is
> visibly removed in code, shown with a control. When a fix commit is named,
> `git merge-base --is-ancestor <hash> <ref>` plus the code showing the fix is good evidence.
> (4) Code comments are not evidence of behaviour; a grep hit proves a string exists, not that it
> runs — show the caller when that matters. Cascading attributes (`aria-hidden`,
> `data-pagefind-ignore`) need the full ancestor chain. (5) Describe code, not people. (6) Search
> distinctive stems and check for renamed equivalents; line-oriented grep misses multi-line tags;
> say so when a search could have missed a variant. (7) Windows/Git Bash: no per-file process loops
> over many files — one `git grep` or one Python pass; don't print whole large files.
>
> **Return** (1) the table; (2) a reconciliation block: every section, item or row in scope with
> the row IDs it produced ("no finding: <why>" otherwise), totals per document, anything merged or
> skipped with the reason; (3) duplicates noticed with other documents (don't go looking).
> Minimal prose outside those parts.

### Group scopes

| Group | Scope added to the brief |
|---|---|
| G1 | `site-wide-audit-2026-06-27.md` §1–§10 inclusive, all subsections (§3a, §4a–4c, §5a–5k, §10a); one row per distinct defect |
| G2 | `site-wide-audit-2026-06-27.md`: every row of the §11 table, and every finding in §12–§21 (§13 roadmap items only if they name a concrete defect) |
| G3 | `data-explorer-fresh-audit-2026-07-13.md` (every tier item, follow-up and "Pending integration"); `data-explorer-deep-audit-2026-06-27.md` (every finding and FIXED claim, including its §1 status table, which stands in for the 04-17 and 04-19 lists); `consolidated-improvements-2026-04-18.md` (all 20 items). Tree note: the new explorer reached production via #1462 on 2026-10-16; these were written against `feature-new-data-explorer`. Won't-do decisions are OPEN with "won't-do by decision" or OBSOLETE if the code is gone |
| G4 | `de-pre-ship-review-2026-10-02.md` (every numbered finding; its status trail is `de-production-deploy-plan-2026-10-01.md` "Review findings" and `site-wide-audit-2026-06-27.md` §21); `de-analytics-audit-2026-10-16.md` (Findings 1–6, "Unexplained, recorded only", "D19 item 3, corrected" if it states a defect); `de-chart-width-findings-2026-10-15.md`. The review's tree is `feature-new-data-explorer @ c15317c74b`, which is the control tree. Recipes as `/data-explorer/<topic>/?id=<n>` + steps |
| G5 | `audit-backlog-production-2026-08-20.md` three "Found while executing…" sections only; `cross-branch-consolidation-2026-09-18.md` "What is left" item 2; `site-characterization-plan-2026-08-23.md` findings sections under Tasks 1–7 not marked fixed, plus Task 16; "What is NOT known"/"Deferred" in `smoke-workflow-plan-2026-08-26.md`, "Deferred" in `smoke-env-plan-2026-08-26.md` and `section-header-standardization-2026-09-24.md`; `nr-de-merge-integration-plan-2026-08-15.md` "Open follow-ups after this plan closed" only. CI reads: `gh run list --workflow <file> --limit 5 --json conclusion,headSha,createdAt` |
| G6 | Read from #1491: `nr-accessibility-audit-2026-08-10.md` §2 (2.1–2.4), §3 site-shell defects (checked on both trees), §4 disconfirmed (kept DISCONFIRMED unless the code changed), §5–§6 for what was claimed fixed; `nr-print-view-fix-2026-08-10.md`. Name the `npm run a11y:nr` rule or probe that would re-run each runtime row |
| G7 | Read from #1491: `nr-pagefind-parity-2026-08-15.md` §2; `nr-followups-2026-08-15.md` open ledger rows and risks; `nr-merge-production-2026-09-01.md`, `-09-26.md`, `-10-16.md` open ledger rows and "Follow-ups"; `nr-output-option-d-execution-plan-2026-08-06.md` "Findings that the scoping memos do not record"; `nr-output-retirement-scoping-2026-08-04.md` "Two bugs the capture surfaced"; `nr-topic-index-picker-restore-2026-08-09.md` §5. `npm run characterize:pagefind` is the instrument for index claims |
