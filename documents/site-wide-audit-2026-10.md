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

Each group below is a subagent's return, pasted verbatim apart from formatting: table,
reconciliation, duplicates. All seven groups have been spot-checked (plan Task 2 Step 3, the
paragraphs below). Their IDs are per group (`G4-01`…). The deduplicated `A-` rows (Step 4)
come first, and the group tables after them remain the evidence record each `A-` row points at.
Where a group's reconciliation tallies disagree with its table, the table is authoritative.

**Step 3 spot-check, foreclosing rows of G4–G7: 74 of 74 confirmed** `[verified 2026-10-17:
spotcheck.py over checks-g4-g7.tsv (both in the audit worktree's gitignored
scripts/.sc-rebaseline/audit-2026-10/), 155 checks: the row's post-fix pattern present at P or N,
the pre-fix pattern present at the tree the finding was written on, fix commits ancestors of P;
output in spotcheck-g4-g7.out. Runner controls: a nonsense-token present-check and a bad-hash
ancestor-check both FAIL (control.tsv, exit 1).]` One check failed first, G5-22: its `absent`
check hit `site-characterization.mjs:1295`, a comment recording that the old sample entry was
removed. The check was too strict, not the row. Not covered by the runner and checked by reading
instead: G4-40 (external GA setting), G4-43 (doc-only), G5-28 (CI history), G7-17 (ledger prose),
G7-19 (baseline recency).

**Step 3 spot-check, foreclosing rows of G1–G3: 174 of 174 confirmed** `[verified 2026-10-17:
spotcheck.py over checks-g1.tsv (36 rows, 112 checks), checks-g2.tsv (31 rows, 92 checks) and
checks-g3a/b/c.tsv (107 rows, 280 checks), same directory and the same three-part check as G4–G7;
the IDs in each TSV equal the group's foreclosing IDs from tally.py (comm -3 empty for all three);
outputs in spotcheck-g1.out, -g2.out, -g3a/b/c.out]`. With G4–G7, that is all 248 foreclosing rows.
Twelve rows failed a check on its first run. In G3-70 the check followed the row's own evidence,
which was wrong (below). In the other eleven the check was wrong, not the row. The causes were a guard or an operand on the line before the matched one (G1-09, G3-97, G3-101), Hugo
`dict` syntax in place of JSON colons (G2-27), a file that lived at `documents/` at the time
(G3-37), a stub's pointer sentence (G1-56), a pattern broad enough to hit a sibling function
(G3-49), and controls placed on a tree that already carried the fix (G3-106, G3-126, G3-130,
G3-131). The corrected checks are in the TSVs, with a comment wherever the reason is not obvious.
Three results change rows:
- **G3-70: evidence corrected.** The dead duplicate was a Hugo comment, `{{/*  <meta
  data-pagefind-filter="section[content]" content="Data Stories">  */}}`, removed by `16c9adce5e`
  ("Remove dead commented-out Pagefind filter duplicate in head.html", an ancestor of P). G3 cited
  `47ffb33fde`, the per-template library gating commit. The status stands.
- **G3-126: split at Step 4.** The row is FIXED for consolidation (one serializer, one pipeline,
  one normalizer). Its second defect, that a no-op interaction adds a history entry, is not
  foreclosed. Neither `writeSelectionToURL` nor `writeHistoryState` compares against the current
  state (`app.js:104-111`, `:130-145` at P), and the callers were not traced. The split row is
  UNVERIFIED (runtime). Repro: on `?id=2380`, click the measure already selected, then compare
  `history.length` before and after.
- **G2-19:** its missing pre-fix control now exists. The duplicate ids are present at
  `f0a4f06611~1` and absent at P.

**Step 3 OPEN-row sample: 19 of 19 still hold** `[verified 2026-10-17: open_sample.py, seed
20261017, 3 OPEN rows per group (G6 has one OPEN row, G6-42); spotcheck.py over checks-open.tsv,
17 rows and 34 checks, each asserting the defect is still present on its tree; G1-68's line counts
(1331 and 1142 at P, by git show | wc -l) and G7-09 (no GA result in documents/) checked by
reading]`. Drawn: G1-02, G1-32, G1-68, G2-30, G2-36, G2-84, G3-118, G3-141, G3-144, G4-15, G4-35,
G4-38, G5-03, G5-23, G5-33, G6-42, G7-09, G7-11, G7-23. One check failed first, G4-15, because
`.map` sits on the line after `return notes`. The row holds. **The sample was drawn per group, not
per source as plan Task 2 Step 3 specifies**, so the groups covering several sources (G3, G4, G5,
G7) were sampled less than the plan asked. `open_sample.py` can be extended to draw per source.

**Conflict G6-05 against G7-15, resolved for G6-05.** The toggle at `nr-neighborhood-list.html:32`
carries both `btn-outline-primary` and `neighborhood-list-button`. `.neighborhood-list-button` sets
`color: $primary-dark !important` (`_de-custom.scss:256-260` at `d1c7402735`), which overrides
Bootstrap's `.btn-outline-primary` colour. G7-15 read only the `.nr-list-toggle` rules. So G7-15's
"parked" status is stale, and the item is FIXED by trace. The computed colour still needs a browser
check `[verified 2026-10-17: git grep -n -E 'nr-list-toggle|neighborhood-list-button' d1c7402735 --
themes assets; git show d1c7402735:assets/scss/_de-custom.scss lines 250-290]`.

**Tree caveat, found by G5, G6 and G7:** the #1491 worktree's HEAD was `00737207cb` when they ran,
four commits past `d1c7402735` (`b33ba2373e`, `2474ff1796`, `f97565a229`, `00737207cb`). Those
commits touch `nr-report.html`, `section.html`, `nr-leaflet.html`, `nr-architecture.md`, a merge
ledger and the Pagefind baseline, and rename `map.js`'s four Leaflet helpers to `reportMap*`.
Rows labelled `#1491 @ d1c7402735` were read from files at `00737207cb`. G6 says it diffed the
four commits and none reverts cited code.

### Deduplicated rows (`A-`)

Plan Task 2 Step 4. The 512 G rows below become 402 `A-` rows: 90 merged rows hold 200 G rows,
311 rows have one member, one row (A-273) is half of a split, and one G row is absorbed (below).
These IDs are stable from here. Task 6 adds the Priority column, and new findings take `N-` IDs
`[verified 2026-10-17: build_a_rows.py over clusters.tsv, both in the audit worktree's gitignored
scripts/.sc-rebaseline/audit-2026-10/. It exits 1 on an unknown G ID, a row named both whole and
split, or a G row placed nowhere, and it reads placement back off the finished table. Control: a
spec adding a cluster of G9-01 and the whole of the split G1-76 exits 1 naming both errors]`.

How to read a row:
- **Rows** lists the member G rows. Each one names its source document and section and holds the
  evidence stamp.
- **Evidence** reads `row` or `rows` where the stamps are in those G rows. A stamp in the cell
  means the merge itself checked something.
- **Claim:** a one-member row carries its G claim verbatim. A merged row's claim was rewritten to
  state every member's claim. Every line number in this table was re-derived at P or N on
  2026-10-17 (`line_refs.py` lists the rows citing one), except A-394's, which are the stale
  citation that row is about. Other rows name a path and a symbol.
- Rows are ordered by their lowest member ID, so related merged rows are not always adjacent.
- `G6-24:F3` marks one part of a G row split across two `A-` rows. Four were split: G1-76 (A-075
  pre-commit hook, A-076 `innerHTML`), G2-02 (A-077 pinning, A-078 permissions), G3-126 (A-205
  consolidation, A-273 no-op history, as its Step 3 note says) and G6-24 (A-064 role, A-065
  Escape).

Status totals: OPEN 151, FIXED 188, UNVERIFIED 37, OBSOLETE 10, DISCONFIRMED 10, BRANCH-SCOPED 6.
Two of the OPEN rows read OPEN (declined): CSS minification (A-007) and the single script bundle
(A-237). The user declined both. They stay listed so that neither is proposed again.

Where members disagreed, the merge settled it:
- **A-021 (georaster alerts): G1-22 holds.** G2-21's lockfile walk followed `dependencies` only,
  and the one edge from georaster to webpack is `worker-loader`'s peer dependency. With peer edges
  included, all four alerted packages reach only georaster and its two siblings (stamp in the row).
- A-128 (`.lang-select`): DISCONFIRMED by trace. The two handlers share no effect.
- flexdatalist: A-064 (combobox role) is FIXED by trace at every call site. A-065 (Escape) is
  UNVERIFIED (runtime), because the fix depends on timing. A-133 (accessible name) is OPEN at
  indicator-catalog and hvi on both trees and at production's NR landing pages; #1491's NR picker
  is named. G6-24's FIXED covered the wiring only.
- A-077 and A-078: pinning is FIXED. The open part of G2-02 is `check-deploy.yml`'s missing
  `permissions:`.
- A-134 (NR picker inside `aria-hidden`): BRANCH-SCOPED, from G2-60's UNVERIFIED, G5-11's
  BRANCH-SCOPED and G6-01's FIXED.
- A-152, A-153, A-154, A-158, A-159, A-163: G2 held these §21 rows UNVERIFIED for want of a run. G4
  traced each call graph, so they are OPEN on trace, and the runtime recipes in the G rows go to
  Task 5. A-154 drops G2-81's "never reset", which G2 itself found false.
- A-125: G5-01's lines hold. G2-50's were off by one at each end.
- A-341: as the "Conflict G6-05 against G7-15" paragraph above says.
- A-042: G1-43 said OBSOLETE and G7-31 said FIXED for the same removal. The row says FIXED.

Related rows kept apart because their claims differ:
- A-088 (non-`prod_prod` builds send to the dev GA property), A-101 (the production property is
  gated to `prod_prod`) and A-123 (the documented bare `hugo` build gets `noindex` and the dev
  property) all describe one block of `head.html`.
- A-046 (OpenLayers loaded from `cdn.rawgit.com`) and A-047 (so those maps are broken; unverified).
- A-029 (`takeaction.html`'s leading-digit ids) and A-105 (the duplicate ids, fixed).
- A-027 (debug scaffolding that may ship) names `g-dev-tools.scss` among four files; A-066 is that
  import alone.
- A-188 (notes rendering consolidated, FIXED) and A-279 (`innerHTML +=` for notes, 311 links and
  lists, OPEN). A-201 and A-275 likewise for the renderer rebuild and the renderer map, and A-259
  and A-280 for the duplicated mobile/desktop ids and the duplicated control groups.
- A-012 (inline JS across ~66 layouts) and A-281 (inline handlers in the explorer's partials).
- A-296 (`header-de.html:57`) and A-355 (`header.html:75`): unnamed logo links in two headers.
- A-301 and A-303: two analytics defects closed by one commit.
- A-223 (the orphaned `/search-results/` page) and A-165 (a comment that still describes it).

Absorbed, with no `A-` row: G5-43. Its claim is that the audit-backlog's "found while executing"
sections duplicate site-wide §15, and Step 4 merged each of them (G5-01..09) with its G2 §15 row.

Neighborhood Reports rows are checked on #1491 (D1), so a FIXED NR row describes #1491.
Production's NR pages keep the old defects until #1491 merges. For example, G6-09's dangling
`aria-labelledby="CCDModalLabel"` is still at production `neighborhood-reports/section.html:97`,
the name's only occurrence `[verified 2026-10-17: git grep -n CCDModalLabel b8f4b32fbd -- themes
content]`. Rows whose members recorded both trees say BRANCH-SCOPED.

| ID | Rows | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| A-001 | G1-01, G2-43, G3-56 | The retired explorer (`assets/js/data-explorer-old/`, `themes/dohmh/layouts/data-explorer-old/`, `content/data-explorer-old/`) is still built and served; deletion waits on comparative user testing. | OPEN | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-002 | G1-02, G2-44 | Versioned partial and shortcode pairs remain (`featured-data(-2)`, `vega`/`vega0`, `nyccas_pollutant_trends(_new)`, `nr-indicator-new/old`, `related-footer(-old)`); no sweep of the `*-old`/`*-new`/`*-2` pairs has run. | OPEN | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-003 | G1-03 | A family of `related*` partials (doc says "eight"; it lists `related` twice) exists. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-004 | G1-04 | Three header partials (`header`, `header-de`, `header-ds`) and two overlap-tool partials (`overlap-tool`, `overlap-tool-with-map`) exist. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-005 | G1-05 | `head.html` loaded ~20 render-blocking library `<script>` tags with no defer/async. | FIXED | row | production @ b8f4b32fbd |
| A-006 | G1-06, G2-04, G3-30 | `head.html` shipped Font Awesome twice, as CSS plus webfonts and as the render-blocking `all.min.js` SVG injector. | FIXED | rows | production @ b8f4b32fbd |
| A-007 | G1-07, G2-05, G3-31 | No CSS minification: `head.html` pipes `toCSS` to `resources.Fingerprint` with no `minify`. Adding it was built and declined by the user 2026-07-14. | OPEN (declined) | rows | production @ b8f4b32fbd |
| A-008 | G1-08, G1-09, G2-06, G3-32 | `head.html` emitted the favicon `<link>` twice and loaded nyc-lib CSS both conditionally and unconditionally. (The two nyc-lib versions inside the gate are candidate C-S3-1, not this row.) | FIXED | rows | production @ b8f4b32fbd |
| A-009 | G1-10, G2-10, G3-33 | The Font Awesome webfont `range` loop in `head.html` was called dead (retracted: it publishes the webfonts), then found to publish only through an incidental `.RelPermalink` read; it now calls `.Publish`. | FIXED | rows | production @ b8f4b32fbd |
| A-010 | G1-11, G3-68 | `head.html` gated the shared libraries behind one `if or (eq .Kind "page") …` block, so a page's dependencies were not visible in its own template. | FIXED | rows | production @ b8f4b32fbd |
| A-011 | G1-12, G3-69 | Two templates built the same `js/dataTableBundle.js` `resources.Concat` target, so Hugo served whichever it cached first. | FIXED | rows | production @ b8f4b32fbd |
| A-012 | G1-13 | ~66 of 136 layouts carry inline behavioural JS (not lintable, not CSP-friendly). | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-013 | G1-14, G2-01, G3-14 | `head.html` loaded the Leaflet point-in-polygon plugin from `cdn.rawgit.com` (shut down 2019). | FIXED | rows | production @ b8f4b32fbd |
| A-014 | G1-15 | External scripts without SRI: the rawgit OpenLayers tags and Google Translate. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-015 | G1-16 | Bootstrap 4.3.1 is EOL and the site is pinned to BS4 + a vendored SCSS fork. | OPEN | row | production @ b8f4b32fbd |
| A-016 | G1-17, G3-12 | `ci` (`^2.3.0`) was an unused dependency in `package.json`. | FIXED | rows | production @ b8f4b32fbd |
| A-017 | G1-18 | Audit `@mapbox/leaflet-pip`, `qrcode-generator`, `jquery-flexdatalist` for use; (also: georaster/geoblaze confirmed in use). | OBSOLETE | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-018 | G1-19 | "No npm audit/Dependabot ... 8 open alerts": Dependabot is on; open-alert count and groups. | OPEN | row | production @ b8f4b32fbd |
| A-019 | G1-20, G2-22 | The critical `decompress` alert is transitive under `hugo-extended`; CI installs Hugo through the setup action and never uses this package, so it is not in the production build path. | OPEN | rows | production @ b8f4b32fbd |
| A-020 | G1-21, G2-23 | The HIGH vega / vega-functions / vega-expression alerts ship via `lib-vega.html`; the rows argue them unreachable because the explorer's only `expr` fields are static. | OPEN | rows | production @ b8f4b32fbd |
| A-021 | G1-22, G2-21 | The serialize-javascript, micromatch, elliptic and braces alerts are all reachable only through `georaster@1.6.0` (also `geoblaze`, `georaster-layer-for-leaflet`), which heatstory loads: `georaster > worker-loader > webpack (peer) > …`. | OPEN | [verified 2026-10-17: Python walk of `package-lock.json` at P up from each alerted package to the root dependencies, over `dependencies`, `optionalDependencies` and `peerDependencies`: all four reach only georaster, geoblaze and georaster-layer-for-leaflet, e.g. `georaster > worker-loader > webpack > terser-webpack-plugin > serialize-javascript`. `node_modules/worker-loader` lists `webpack` under `peerDependencies` only. G2-21's walk followed `dependencies` alone and so found 0, which is why its attribution "does not reproduce". Alert counts: G1-19] | production @ b8f4b32fbd |
| A-022 | G1-23 | Mobile and desktop nav are fully duplicated in header.html (incl. the `$want_menus` loop). | OPEN | row | production @ b8f4b32fbd |
| A-023 | G1-24, G2-09 | `header.html` nav put `<a><li>` inside `<ul>`. | FIXED | rows | production @ b8f4b32fbd |
| A-024 | G1-25, G2-08 | The site-title `<a>` in `header.html` crossed two `<span>`s. | FIXED | rows | production @ b8f4b32fbd |
| A-025 | G1-26, G2-07 | Search links in `header.html` carried both `data-toggle="modal"` and `data-toggle="collapse"`. | FIXED | rows | production @ b8f4b32fbd |
| A-026 | G1-27 | The same three defects persist in `header-de.html` (the explorer header): `<a><li>` x6, title anchor crossing spans (lines 59-60), duplicate `data-toggle` x3. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-027 | G1-28 | `console-log.html`, `warn_counter.html`, `temp-popup.html` and `g-dev-tools.scss` suggest debug scaffolding that may ship. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-028 | G1-29, G2-18, G6-22 | `#skip-header-target` was declared on `<main>` and again on ~20 templates' `<article>`. | FIXED | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-029 | G1-30 | `takeaction.html` is shared by both explorers so its `id="311"`/`id="311label"` (leading-digit ids, invalid CSS selectors) cannot move. | OPEN | row | production @ b8f4b32fbd |
| A-030 | G1-31 | takeaction's hidden `d-none` copy contributes nothing to Pagefind because its 311 spans are populated client-side. | OPEN | row | production @ b8f4b32fbd |
| A-031 | G1-32, G3-43 | The explorer calls the Correlate feature `links` in 454 places across 11 files plus three external contracts; the rename to `correlate` is deferred. | OPEN | rows | production @ b8f4b32fbd |
| A-032 | G1-33, G3-80 | The explorer table defaults to Citywide alone where the old explorer shows Citywide plus Borough (3 against 7 rows on `?id=26`); showing them always via `TABLE_CONTEXT_GEOS` is deferred. | OPEN | rows | production @ b8f4b32fbd |
| A-033 | G1-34, G2-03 | `click_subscribe` fired twice per click (`main.js` raw `gtag` and `site.js` delegated), with two parameter schemas. | FIXED | rows | production @ b8f4b32fbd |
| A-034 | G1-35 | Two JS idioms: `main.js` (jQuery ready) and `site.js` (IIFE, delegation); migrate main.js over time. | OPEN | row | production @ b8f4b32fbd |
| A-035 | G1-36 | Geo crosswalks shipped as JS (`ccd-to-uhf42.js`, `cd-to-uhf42.js`, `uhflist.js`) rather than data. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-036 | G1-37 | `uhflist.js` and `uhflist.json` are different vintages (five ACS percentages differ); resolved 2026-08-05 by keeping the `.js` and deleting the `.json`. | BRANCH-SCOPED | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-037 | G1-38, G3-36 | `uhflist.js` (20 KB) was render-blocking in head on pages that never read it, every explorer page included. | FIXED | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-038 | G1-39 | `topiclanding.html` loaded `uhflist` twice (head plus its own tag). | FIXED | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-039 | G1-40 | Five caller-less NR partials (`nr-clickable-uhf`, `nr-map-highlight`, `nr-chooser`, `nr-indicator-old`, `nr-sub_nav`) plus the "three dead DOMPurify-consuming nr partials". | BRANCH-SCOPED | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-040 | G1-41 | `static/UHF42.csv` and `assets/js/ccd-to-uhf42.json` were kept after their consumers went (served verbatim from static/ or assets, so removal needs traffic evidence). | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-041 | G1-42, G2-70 | The UHF42 boundary comes from two origins: NR map code (`nr-leaflet.html`, and on #1491 `assets/js/nr-report/map.js` via `nr-report.html`'s `geojsonUrl`) fetches the repo copy `static/geojson/UHF42.geojson`, while other consumers fetch EHDP-data's copy. | OPEN | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-042 | G1-43, G7-31 | `nameCorrections` in the NR report JS was dead and blamed the wrong file; it has been removed from both trees. | FIXED | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-043 | G1-44, G2-13 | Datawrapper charts in inactive Bootstrap tab-panes throw SVG-sizing console errors; `lazy-tab-embeds.js` (2026-07-16) is the recorded fix. | UNVERIFIED (runtime) | rows | production @ b8f4b32fbd |
| A-044 | G1-45, G2-14 | `data-stories/housing` (Spanish page) hides Datawrapper charts in radio-driven inline `display:none` divs, which warn on render. | UNVERIFIED (runtime) | rows | production @ b8f4b32fbd |
| A-045 | G1-46 | `rats-in-your-neighborhood` calls `area.contains(...)` on an `L.polygon`, which native Leaflet lacks (came from the dead RawGit plugin). | UNVERIFIED (runtime) | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-046 | G1-47 | Three templates still load OpenLayers from dead `cdn.rawgit.com`. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-047 | G1-48 | Those OpenLayers maps are broken in production (unless `nyc-ol-lib.js` supplies `ol`). | UNVERIFIED (runtime) | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-048 | G1-49 | `rats-in-your-neighborhood-nyc-lib.html` is referenced by nothing. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-049 | G1-50 | AirNow widget on `realtime-air-quality` makes a CORS-blocked XHR (vendor iframe, allowlisted). | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-050 | G1-51, G3-62 | `neighborhood-reports/section.html` and the `nr-leaflet` partial both declared `intendedDestinationName` at global scope, a SyntaxError on the NR landing page. | FIXED | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-051 | G1-52, G3-63 | `nr-output` report pages used Arquero (`aq.`) without loading it. | FIXED | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-052 | G1-53 | `/data-explorer/` section page calls `aq.from` (via `de-topic-indicators.html`) with Arquero not loaded. | FIXED | row | production @ b8f4b32fbd |
| A-053 | G1-54, G5-38 | `data-explorer-old/{section,data-index,indicator-catalog}.html` called `de-topic-indicators` (which uses `aq.`) without `lib-arquero`. | FIXED | rows | production @ b8f4b32fbd |
| A-054 | G1-55, G7-32 | The header's Google Forms iframe is refused by Google's report-only `frame-ancestors`, logging an error on every page; smoke allowlists it. | UNVERIFIED (runtime) | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 / production @ b8f4b32fbd |
| A-055 | G1-56 | Two JS convention files contradict on `console.log` format and trailing periods. | FIXED | row | production @ b8f4b32fbd |
| A-056 | G1-57 | Comment voice (third-person sentence vs imperative fragment) is deliberately unresolved. | UNVERIFIED (other, a style decision with no code predicate to test) | row | production @ b8f4b32fbd |
| A-057 | G1-58 | `debugLog` is not on every branch. | FIXED | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-058 | G1-59 | `assets/js/nr-topic-spa.js` (945 lines) has no banner, unconditional `console.log`; later split into ten files. | OBSOLETE | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-059 | G1-60 | `global.js` in the DE tree uses two `function` declarations where the conventions prefer named arrows. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-060 | G1-61 | `assets/js/site.js` is empty (0 lines). | BRANCH-SCOPED | row | production @ b8f4b32fbd |
| A-061 | G1-62 | Throwaway DE->NR merge broke NR report pages via the 404.html NR routing bridge (`L is not defined`). | OBSOLETE | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-062 | G1-63 | The generic `Failed to load resource` smoke allowlist entry hides the cause of blocked-script failures. | OPEN | row | production @ b8f4b32fbd |
| A-063 | G1-64 | Smoke test failed intermittently on a cache-cold first run (`L`/`DOMPurify` undefined). | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-064 | G1-65, G6-03, G6-24:F3, G7-14 | flexdatalist inputs had combobox ARIA (`aria-expanded`) without `role="combobox"`; `wireComboboxState` in `flexdatalist-combobox-js.html` now sets the role and syncs the state at every call site on both trees. Runtime confirmation (axe) is Task 5's. | FIXED | [verified 2026-10-17 by the members: the partial is included and `wireComboboxState` called at all five production init sites (G7-14) and the three non-NR sites on both trees (G6-24); G1-65 held only the runtime half open] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-065 | G1-66, G6-19, G6-24:F18 | Escape did not dismiss the flexdatalist list (keyup re-armed a 400 ms search); `wireComboboxState` now records Escape and an observer removes a reappearing list, but whether it holds needs timed sampling in a browser. | UNVERIFIED (runtime) | rows (G6-24's FIXED covered only the wiring) | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-066 | G1-67 | `@import "g-dev-tools.scss"` ships debug styles to production; gate it. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-067 | G1-68 | Two oversized catch-all SCSS files (`__portal-custom.scss` 1317, `_de-custom.scss` 993). | OPEN | row | production @ b8f4b32fbd |
| A-068 | G1-69 | Bootstrap SCSS forked in-repo (~7K lines); prefer node_modules + variable overrides. | OPEN | row | production @ b8f4b32fbd |
| A-069 | G1-70 | `!important` and inline `style=` are widespread (blocks strict CSP). | OPEN | row | production @ b8f4b32fbd |
| A-070 | G1-71 | `package.json` had no `scripts` block (no build/lint/test). | FIXED | row | production @ b8f4b32fbd |
| A-071 | G1-72 | The repo's ESLint config enables only `no-undef`, so it catches 1 of the 4 named bug shapes; `no-dupe-keys` is off. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-072 | G1-73 | Lint covers only the SPA tree; no formatter, no tests, inline-JS layouts and theme partials unlinted; testing strategy undecided. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-073 | G1-74, G3-64 | `npm run lint` is not run in CI. | OPEN | rows | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-074 | G1-75 | Smoke `PAGES` had no coverage for three of four `data-explorer-old` template kinds. | FIXED | row | production @ b8f4b32fbd |
| A-075 | G1-76:pre-commit, G3-65 | No pre-commit hook runs lint. | OPEN | rows | production @ b8f4b32fbd |
| A-076 | G1-76:innerHTML, G3-66, G3-141 | The explorer's ~40 `innerHTML` sinks have not been swept or classified; menus, the chooser and cards build markup from `innerHTML` strings (e.g. `topic-indicator-selector.js`, `311.js`). | OPEN | rows | production @ b8f4b32fbd |
| A-077 | G1-77, G2-02:pinning | Workflow actions were pinned to mutable tags; every `uses:` now carries a 40-character SHA. | FIXED | rows | production @ b8f4b32fbd |
| A-078 | G1-78, G2-02:permissions | `check-deploy.yml` has no `permissions:` block; the four build workflows have one, workflow-wide `contents: write` rather than read with per-job write. | OPEN | rows (G2-02 narrowed the open part to `check-deploy.yml`) | production @ b8f4b32fbd |
| A-079 | G1-79, G2-42 | Build workflows run `npm install` rather than `npm ci`, with no npm cache. | OPEN | rows | production @ b8f4b32fbd |
| A-080 | G1-80 | The build commits package files back to the repo via a third-party action. | OPEN | row | production @ b8f4b32fbd |
| A-081 | G1-81, G2-41 | No `.gitattributes` LF rules; the build workflows run `dos2unix` to keep CRLF away from SRI hashes. | OPEN | rows | production @ b8f4b32fbd |
| A-082 | G1-82 | Four near-duplicate build workflows; extract a `workflow_call` reusable. | OPEN | row | production @ b8f4b32fbd |
| A-083 | G1-83 | `fetch-depth: 0` clones full history though only the last commit is used. | OPEN | row | production @ b8f4b32fbd |
| A-084 | G1-84 | Nine `config.toml` files; verify each is a live deploy target and per-env files are thin. | OPEN | row | production @ b8f4b32fbd |
| A-085 | G1-85 | `ignoreFiles = ['Simplified.Chinese','Spanish']` looks like a leftover that ignores translated content. | OPEN | row | production @ b8f4b32fbd |
| A-086 | G1-86 | Mixed i18n: Hugo multilingual plus the Google Translate widget with a DOM-mutating SVG-removal hack (also an a11y/SEO weakness). | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-087 | G1-87 | `caches.getresource maxAge = -1` caches remote fetches forever. | OPEN | row | production @ b8f4b32fbd |
| A-088 | G1-88 | Dev/local builds emit real GA events to the dev property (every env except `prod_prod`). | OPEN | row | production @ b8f4b32fbd |
| A-089 | G1-89 | The GA snippet is duplicated across the prod and dev branches. | OPEN | row | production @ b8f4b32fbd |
| A-090 | G1-90 | GA tracking has three competing implementations (guarded `sendAnalyticsEvent`, guarded `trackDataExplorerEvent`, raw `gtag`). | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-091 | G1-91 | `search` is three events: `search`, `search_click`, `click_search_open`. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-092 | G1-92, G2-12, G3-100 | The analytics event was misspelled `click_how_caclulated`. | FIXED | rows | production @ b8f4b32fbd |
| A-093 | G1-93 | Param casing inconsistent (`IndicatorID` vs snake_case). | OPEN | row | production @ b8f4b32fbd |
| A-094 | G1-94 | No Consent Mode / cookie-consent gate on GA; disclosure in the NYC privacy policy unconfirmed. | OPEN | row | production @ b8f4b32fbd |
| A-095 | G1-95, G2-20, G3-42 | Three explorer modals (`#topicSelector`, `#indicatorSelector`, `#learnMore`) pointed `aria-labelledby` at ids that did not exist. | FIXED | rows | production @ b8f4b32fbd |
| A-096 | G1-96 | A site-wide sweep for dangling `aria-labelledby` is still worth running. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-097 | G1-97 | `href="#"` action links throughout the header should be buttons. | OPEN | row | production @ b8f4b32fbd |
| A-098 | G1-98 | Recommend axe/Lighthouse in CI over each template type. | OPEN | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-099 | G1-99 | `$primary` #008939 clears AA as text only on pure white (4.53) and fails on tinted backgrounds; fix is `$primary-dark` #007A31 for text. | FIXED | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-100 | G1-100 | Remaining rules that set the green as text were not checked against their backgrounds (`__portal-custom.scss` 201/204/1283 and others). | UNVERIFIED (runtime) | row | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| A-101 | G2-11 | GA fired in dev/local environments. | FIXED | row | production @ b8f4b32fbd |
| A-102 | G2-15, G2-25 | Production `robots.txt` had no body and no `Sitemap:` line. | FIXED | rows | production @ b8f4b32fbd |
| A-103 | G2-16, G2-34 | `<html lang="en" dir="ltr">` was hardcoded in `baseof.html` and `list.html`. | FIXED | rows | production @ b8f4b32fbd |
| A-104 | G2-17, G2-31 | Data Explorer indicator content is client-rendered (`de-indicator-info.html` server-renders placeholders; values arrive after `metadata.json` loads), so non-JS crawlers see placeholders. | OPEN | rows | production @ b8f4b32fbd |
| A-105 | G2-19, G3-41 | Explorer pages carried duplicate ids (`#dropdownMenuButton` twice, `#311`/`#311label` twice, `#printTopic`). `takeaction.html:4` keeps `id="311"` and `id="311label"` once, deliberately (A-029). | FIXED | rows | production @ b8f4b32fbd |
| A-106 | G2-24 | `docs/robots.txt` is a gitignored leftover and the template emits a body only for non-production environments. | OBSOLETE | row | production @ b8f4b32fbd |
| A-107 | G2-26 | No explicit AI-crawler stance and no `llms.txt`. | FIXED | row | production @ b8f4b32fbd |
| A-108 | G2-27 | Theme had no JSON-LD. | FIXED | row | production @ b8f4b32fbd |
| A-109 | G2-28 | No `Dataset` JSON-LD. | OPEN | row | production @ b8f4b32fbd |
| A-110 | G2-29 | `WebSite` has no `SearchAction`. | OPEN | row | production @ b8f4b32fbd |
| A-111 | G2-30 | `Organization` has no `logo`. | OPEN | row | production @ b8f4b32fbd |
| A-112 | G2-32 | One `<h1>` per bundled indicator, so multiple `<h1>` per page. | OPEN | row | production @ b8f4b32fbd |
| A-113 | G2-33 | Those `<h1>`/`<h2>` are `display:none` for every visitor. | OPEN | row | production @ b8f4b32fbd |
| A-114 | G2-35 | Three `<meta name="robots">` tags stack on one response. | FIXED | row | production @ b8f4b32fbd |
| A-115 | G2-36 | `content/resources/` is noindexed everywhere while still listed in `sitemap.xml`. | OPEN | row | production @ b8f4b32fbd |
| A-116 | G2-37 | `<title>` never includes the site name. | FIXED | row | production @ b8f4b32fbd |
| A-117 | G2-38 | Empty `geo.region` and hardcoded `fb:profile_id="0"` in `seo.html`. | FIXED | row | production @ b8f4b32fbd |
| A-118 | G2-39 | ~18% of content `.md` files have no `seo_description` override. | OPEN | row | production @ b8f4b32fbd |
| A-119 | G2-40 | `sitemap.xml:9-19` duplicate-looking `xhtml:link` block (self-referential hreflang) has no explanatory comment. | OPEN | row | production @ b8f4b32fbd |
| A-120 | G2-45 | Same element carries two `class` attributes in templates. | FIXED | row | production @ b8f4b32fbd |
| A-121 | G2-46 | Home page card images have no `alt`. | FIXED | row | production @ b8f4b32fbd |
| A-122 | G2-47 | `.card-content.key-topics` and `.tab-key-topics` are defined and unused. | OPEN | row | production @ b8f4b32fbd |
| A-123 | G2-48 | Documented bare `hugo` build gives `noindex` and the dev GA property, because `head.html` branches on the environment name. | OPEN | row | production @ b8f4b32fbd |
| A-124 | G2-49 | `conditional-modal.html` branches on `production`, `development` and `data_staging`; no template includes it. | OPEN | row | production @ b8f4b32fbd |
| A-125 | G2-50, G5-01 | The home page's featured-story `<a>` (`themes/dohmh/layouts/index.html:66`) opens inside the `#featured-homepage` card and closes at `:97`, after the card's `</div>` at `:96`, so the anchor is misnested. | OPEN | [verified 2026-10-17: `git show P:…/index.html`, grep of `featured_link` and closing tags over lines 60-100: `<a>` at 66, card closes 96, `</a>` 97. G5-01's lines hold; G2-50's `:65`/`:98` were off by one] | production @ b8f4b32fbd |
| A-126 | G2-51, G5-02 | The housing story's tab container has a doubled `class` attribute (`class="tab-content" id="myTabContent" class="mb-4"`), so `mb-4` never applies. | OPEN | rows | production @ b8f4b32fbd |
| A-127 | G2-52, G5-03 | In the `header.html` menus, `<hr>` and a bare `<a>All topics</a>` are direct children of `<ul>`. | OPEN | rows | production @ b8f4b32fbd |
| A-128 | G2-53, G5-04 | `.lang-select` was suspected of double-firing because `main.js` and `site.js` both bind it. The two handlers share no effect: `main.js:182` only calls `setLanguage()`, `site.js:86` only sends `click_language`. (The two-idiom split itself is G1-35.) | DISCONFIRMED | [verified 2026-10-17: `git show P:assets/js/main.js` lines 175-195 and `P:assets/js/site.js` lines 80-95; TRACE: no analytics call in the `main.js` handler, no translation call in the `site.js` branch] | production @ b8f4b32fbd |
| A-129 | G2-54, G5-05 | `og:image` and `twitter:image` are path-only (`RelPermalink` / `relURL`), not absolute URLs. | OPEN | rows | production @ b8f4b32fbd |
| A-130 | G2-55, G5-06 | `og:locale` is hardcoded `en_us` (`seo.html:8`) on every page, `es` and `zh` included. | OPEN | rows | production @ b8f4b32fbd |
| A-131 | G2-56, G5-07 | A commented-out `console.log` sits above the `gtag` call, and the comment above `#citeButton` is a copy-pasted "how calculated" banner. | OPEN | rows | production @ b8f4b32fbd |
| A-132 | G2-57, G5-08 | The whole aqe neighborhood picker (label, input, Clear, link) on `aqe.html` sits inside `aria-hidden="true"`. | OPEN | rows | production @ b8f4b32fbd |
| A-133 | G2-58, G2-59, G5-09, G6-25 | The flexdatalist search input has no accessible name on indicator-catalog (`de-text-search.html`) and `hvi` on both trees, and on production's NR landing pages (`neighborhood-reports/section.html`, `topiclanding.html`). On #1491 the NR picker is named (`nr-neighborhood-picker.html` label, `aria-labelledby` set in `nr-neighborhood-picker-js.html`), which is G6-25's disconfirmation. | OPEN | [verified 2026-10-17: G5-09's grep for `aria-label\|<label\|aria-labelledby` over `de-text-search.html`, `hvi.html`, `aqe.html` at P, empty; same grep over production's `neighborhood-reports/section.html` and `topiclanding.html`: only the CCD modal and a breadcrumb `nav`, while `flex_search` occurs 3 times in each (control)] | production @ b8f4b32fbd; #1491 @ d1c7402735; NR part #1491 @ 00737207cb |
| A-134 | G2-60, G5-11, G6-01 | The NR picker map sits inside `aria-hidden="true"` while its Leaflet shapes stay focusable (axe `aria-hidden-focus`). Production still has the `nr-clickable-uhf` wrapper (`neighborhood-reports/section.html:75`); on #1491 `removeHiddenMapFromTabOrder` in `nr-leaflet.html` sets `tabindex="-1"` under the hidden ancestor. Fixed on #1491 by trace; axe confirmation is Task 5's. | BRANCH-SCOPED | rows | #1491 @ d1c7402735; production @ b8f4b32fbd; #1491 @ 00737207cb |
| A-135 | G2-61, G5-12 | `npm run lint` was red on implicit globals (`indicators`, `selectedDisparity`, `xValue`, `yValue`, `comp_group_col`; 33 `no-undef` errors in the backlog's count). | FIXED | rows | production @ b8f4b32fbd |
| A-136 | G2-62 | Datawrapper inline runtimes share `window.dw`, so the first-loaded owns it. | UNVERIFIED (other) | row | production @ b8f4b32fbd |
| A-137 | G2-63 | `heat-report-archive/2024/5-fig-3-4.md` embedded `a899A` inline. | FIXED | row | production @ b8f4b32fbd |
| A-138 | G2-64 | 38 charts across 15 pages still inline with more than one runtime version. | OPEN | row | production @ b8f4b32fbd |
| A-139 | G2-65 | `overlap-tool-with-map.html` fetches `CityCouncilDistrict.geojson` where `.topo.json` exists. | OPEN | row | production @ b8f4b32fbd |
| A-140 | G2-66 | Same file fetches `CD.geojson`. | OPEN | row | production @ b8f4b32fbd |
| A-141 | G2-67 | Same file fetches `UHF42.geojson` twice. | OPEN | row | production @ b8f4b32fbd |
| A-142 | G2-68 | `rmz.js` fetches `rmz.geojson`. | OPEN | row | production @ b8f4b32fbd |
| A-143 | G2-69 | `neighborhood-rats.js` loads the bundle-local `rmz.geojson`. | OPEN | row | production @ b8f4b32fbd |
| A-144 | G2-71 | `rats-in-your-neighborhood/geojson/cd.geojson` is large and has no TopoJSON counterpart. | OPEN | row | production @ b8f4b32fbd |
| A-145 | G2-72 | Large GeoJSON files with no counterpart (`greenspace`, `neighborhoods`, two `800m_*`, `fvi`). | OPEN | row | production @ b8f4b32fbd |
| A-146 | G2-73 | `neighborhoods.geojson` and `800m_BG_pct_walkable_ADA_subway.geojson` are referenced by no source file. | OPEN | row | production @ b8f4b32fbd |
| A-147 | G2-74 | `overlap-tool-with-map.html` hardcodes `refs/heads/production` in its data URLs. | OPEN | row | production @ b8f4b32fbd |
| A-148 | G2-75 | NR report map flies to the selected neighborhood, leaving most polygons unclickable by pointer. | FIXED | row | #1491 @ d1c7402735 |
| A-149 | G2-76 | Thin-arc Rockaways polygon unreachable even in the fitted arm (bbox centre falls on the container). | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-150 | G2-77 | `vegaEmbed(...).then()` has no rejection handler in `nr-report/chart.js`. | FIXED | row | #1491 @ d1c7402735 |
| A-151 | G2-78 | `restaurant-grades.html` and `restaurants.html` render the title as `<h2>`, so their pages have no `<h1>`. | OPEN | row | production @ b8f4b32fbd |
| A-152 | G2-79, G4-09 | "About the data" keeps the last trend, correlate or disparities text after leaving that tab: `renderAboutSources` overwrites `#howCalculated`, and the indicator-wide text is restored only by `renderIndicatorInfo` in `loadAndRenderIndicator`. | OPEN | rows (G4-09's call-graph trace; G2-79 held it UNVERIFIED for want of a run) | production @ b8f4b32fbd |
| A-153 | G2-80, G4-13 | The table stops following the map after a Measure-driven cascade or Back while the summary still reads "Synced": `syncTableFiltersToMapSelection` is called only from `menu.js` and `table.js`, not from the popstate path or `updateAllMenus`. | OPEN | rows | production @ b8f4b32fbd |
| A-154 | G2-81, G4-14 | The table's Area search box keeps its text after a rebuild or indicator switch while the column filter is gone: `table.js` refills the box from `DE.table.tableAreaSearchValue`, and its only reset, `clearTableAreaSearch`, is called from one `menu.js` path. | OPEN | rows (G2-81's "never reset" wording was wrong; G4-14 states it correctly) | production @ b8f4b32fbd |
| A-155 | G2-82, G2-92, G4-15, G4-32 | `getDisplayNotes` (`global.js`) maps notes without deduping, so the small-numbers sentence can print twice (indicator 2383), and its comment says callers pass "already-deduped" notes. | OPEN | rows | production @ b8f4b32fbd |
| A-156 | G2-83, G4-19 | The explorer's "Download data" and "Sync to map" `href="#"` links lacked `preventDefault`. | FIXED | rows | production @ b8f4b32fbd |
| A-157 | G2-84, G4-21 | "More info about {topic}" renders `.Params.azlink` without a `with` guard, so it self-links when the field is absent (`header-de.html`). | OPEN | rows | production @ b8f4b32fbd |
| A-158 | G2-85, G4-22 | Dead SCSS in `_de-custom.scss`: the mobile bottom padding compiles to `.de-wrapper .de-wrapper`, and the indicator-modal grid, card and sticky rules are scoped to `.de-wrapper` while the modals sit outside it. | OPEN | rows | production @ b8f4b32fbd |
| A-159 | G2-86, G4-26 | `#map role="img"` (`data-explorer/single.html`) wraps focusable content (the sr-only "View this data as a table" link, Leaflet attribution), which axe reports as `nested-interactive`. | OPEN | rows | production @ b8f4b32fbd |
| A-160 | G2-87, G4-27 | `#tableFilterToggle` is a focusable button nothing binds to. | OPEN | rows | production @ b8f4b32fbd |
| A-161 | G2-88, G4-28 | The "Recently updated" icon has both `aria-hidden="true"` and `aria-label`. | OPEN | rows | production @ b8f4b32fbd |
| A-162 | G2-89, G4-11 | The correlate CSV swaps `Value_1_Indicator` and `Value_2_Indicator` in the `SecondaryAxis === 'y'` branch (inherited from production `links.js`). | OPEN | rows | production @ b8f4b32fbd |
| A-163 | G2-90, G4-17 | When correlate and disparities both fail, nothing clears the previous chart or `DE.print` (`measures.js` fallback chain); latent, no live trigger known. | OPEN | rows | production @ b8f4b32fbd |
| A-164 | G2-91, G4-12 | UHF33 and National rows have no area name and cannot be selected or filtered: `GEO_RANK_BY_PRETTY_TYPE` ranks neither and `GeoLookup` has no rows for them. | OPEN | rows | production @ b8f4b32fbd |
| A-165 | G2-93, G4-33 | A comment in `structured-data.html` places `#searchModal` in `partials/footer.html` and describes the deleted `/search-results/` layout. | OPEN | rows | production @ b8f4b32fbd |
| A-166 | G2-94, G4-34 | `print.js`'s header says maps export "by compositing the current Leaflet DOM"; `print-map.js` builds an off-screen map. | OPEN | rows | production @ b8f4b32fbd |
| A-167 | G2-95, G4-35 | Three stale comments: `measures.js` ("checkURL or popstate"), `data.js` ("IndicatorID comes in as a string"), `de-tab-content.js` ("guarded so load order never matters"). | OPEN | rows | production @ b8f4b32fbd |
| A-168 | G2-96, G4-36 | `de-chooser.html` is included nowhere. | OPEN | rows | production @ b8f4b32fbd |
| A-169 | G2-97, G4-37 | `de-topic-indicators.html` and `de-indicator-names-pf.html` match the substring `/data-explorer`, which also matches `/data-explorer-old/`. | OPEN | rows | production @ b8f4b32fbd |
| A-170 | G2-98, G4-38 | A `console.log` remains in `data-explorer/section.html`. | OPEN | rows | production @ b8f4b32fbd |
| A-171 | G2-99, G4-39 | `_de-custom.scss` carries a duplicated `.nav-pills` block with `#007bff`. | OPEN | rows | production @ b8f4b32fbd |
| A-172 | G2-100 | CI smoke and characterization load explorer topic pages without `?id=`, so CI exercises no indicator rendering. | FIXED | row | production @ b8f4b32fbd |
| A-173 | G3-01 | `table.js` declares `type: 'natural'` but the new explorer never loaded `naturalSort.js`, so string sort was used. | FIXED | row | production @ b8f4b32fbd |
| A-174 | G3-02 | `select: true` in DataTables options is inert (Select extension absent). | FIXED | row | production @ b8f4b32fbd |
| A-175 | G3-03 | `trend.js` percentile guard used `'Percentile'` (capital P) unlike the other five copies. | FIXED | row | production @ b8f4b32fbd |
| A-176 | G3-04 | `DE.lookups.measureAbout`/`measureSources` are write-only dead state (`measures.js`, `global.js`). | FIXED | row | production @ b8f4b32fbd |
| A-177 | G3-05, G3-20, G3-94 | `map.js` reset hover by running `geojsonLayer.eachLayer(resetStyle)` on every polygon `mouseover` (O(n) per move), and kept an unused `resetHighlight`, an unused `currentlyHighlighted` and a destructured-but-unused `calculatePercent`. | FIXED | rows | production @ b8f4b32fbd |
| A-178 | G3-06 | `global.js` kept a commented-out `renderTitleDescription`. | FIXED | row | production @ b8f4b32fbd |
| A-179 | G3-07, G3-95 | `copyCitation` built and selected a throwaway `<textarea>` that `clipboard.writeText` never used. | FIXED | rows | production @ b8f4b32fbd |
| A-180 | G3-08 | `downloadData` ended `hiddenElement.download = …,` (comma operator) before `.click()`. | FIXED | row | production @ b8f4b32fbd |
| A-181 | G3-09 | `311.js` had a `.then()` that only returned its input. | FIXED | row | production @ b8f4b32fbd |
| A-182 | G3-10 | `updateLinksSelectionSummary` duplicates `updateLinksDropdownToggle`; `getActiveTrendMeasureId` duplicates `getSyncedTrendMeasureId`. | FIXED | row | production @ b8f4b32fbd |
| A-183 | G3-11 | `geoTypes` array duplicated `GEO_RANK_BY_PRETTY_TYPE`'s keys. | FIXED | row | production @ b8f4b32fbd |
| A-184 | G3-13 | `head.html` shipped the unused `leaflet-control-geocoder` script on every data-library page (package to be kept). | FIXED | row | production @ b8f4b32fbd |
| A-185 | G3-15 | "Download data" on the bar tab wrote `undefined` or another tab's CSV because `renderBar` never set `DE.print.CSVforDownload`. | FIXED | row | production @ b8f4b32fbd |
| A-186 | G3-16 | Port `hotfix-table-sorting-by-geo` (borough grouping checkbox, 3-level groups, descendant-attribute toggle, conditional `orderFixed`) into the new explorer. | FIXED | row | production @ b8f4b32fbd |
| A-187 | G3-17 | Six copies of the percent/display rule need one `resolveMeasureDisplay()` helper. | FIXED | row | production @ b8f4b32fbd |
| A-188 | G3-18 | Five notes-rendering copies (and the `innerHTML +=` loop) need one renderer. | FIXED | row | production @ b8f4b32fbd |
| A-189 | G3-19 | `map.js` duplicated the citywide popup / trend-tab nudge, click-to-trend handlers and topo-load pipeline. | FIXED | row | production @ b8f4b32fbd |
| A-190 | G3-21 | `correlate.js`/`disparities.js` duplicate the CSV-download table builder. | FIXED | row | production @ b8f4b32fbd |
| A-191 | G3-22 | DOM-builder helpers (`setBadgePillState`, `createBadgePillButton`, …) redefined inside `renderMeasures` on every load. | FIXED | row | production @ b8f4b32fbd |
| A-192 | G3-23 | `print.js` (1,376 lines) mixes map export with the chart path; split map export into `print-map.js`. | FIXED | row | production @ b8f4b32fbd |
| A-193 | G3-24, G3-25, G3-135 | Static and linked data (GeoLookup, TimePeriods, comparisons, TopoJSON, the 311 crosswalk, and the same indicator JSON up to three times) were re-fetched on every indicator switch; the cache holds Arquero tables and does not leak topology `properties` by reference. | FIXED | rows | production @ b8f4b32fbd |
| A-194 | G3-26 | `loadIndicator` awaited `fetch_comparisons()` before `loadData()` ("why are we waiting for this?"). | FIXED | row | production @ b8f4b32fbd |
| A-195 | G3-27 | `loadGeo()`/`loadTime()` started only after the indicator rows arrived. | FIXED | row | production @ b8f4b32fbd |
| A-196 | G3-28 | Vega specs with `"width": "container"` measured a `display:none` pane and pinned charts to 0 px (correlate/disparities, extended to trend/bar). | FIXED | row | production @ b8f4b32fbd |
| A-197 | G3-29 | A brief flash can remain on tab switch from Vega compile/render time; options (trim `buildLabelCollisionTransforms(5)`, reuse a Vega view) un-investigated. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-198 | G3-34 | Shared DataTables bundle carried `buttons.print` and `rowgroup`, dead in both explorers. | FIXED | row | production @ b8f4b32fbd |
| A-199 | G3-35 | `easybutton`/`colorIcon` loaded on DE pages though used only by other pages. | FIXED | row | production @ b8f4b32fbd |
| A-200 | G3-37 | `de-characterization.mjs` hard-coded `/dev-stage/`. | FIXED | row | production @ b8f4b32fbd |
| A-201 | G3-38 | `renderMeasures` was a ~1,500-line function re-creating ~35 closures and the seven `show*` renderers per indicator. | FIXED | row | production @ b8f4b32fbd |
| A-202 | G3-39 | `DE_MEASURE_RULES.trendAnnualAverageMeasureIds [365,370,375,391]` and `trendSummerMeasureIds [386]` match no measure, so `showBoroughTrend`'s slice branches are dead against live data. | OPEN | row | production @ b8f4b32fbd |
| A-203 | G3-40 | Misleading names (`btn-toggle-disparities`, `clickLinksToggle`, `handleToggle`, `draw311Buttons`, `#tableCopy`, `printMenus` family). | FIXED | row | production @ b8f4b32fbd |
| A-204 | G3-44 | `documents/data-explorer-architecture.md` still described `data-explorer-new/` and called three renderers console-logging stubs. | FIXED | row | production @ b8f4b32fbd |
| A-205 | G3-45, G3-126:consolidation | Selection handling was split: `loadIndicator → … → renderCurrentView` duplicated in `checkURL`, `popstate` and `selectIndicator`, with URL parse/serialize, legacy aliases and history writes scattered. Now one pipeline (`loadAndRenderIndicator`), one serializer and one normaliser in `app.js`. | FIXED | rows | production @ b8f4b32fbd |
| A-206 | G3-46 | A load wrote two history entries (loadIndicator's own push plus the caller's `pushSelectionToURL`); Back stayed on the page. | FIXED | row | production @ b8f4b32fbd |
| A-207 | G3-47 | `resetSelectionForNewIndicator` replaced the outgoing indicator's history entry before the new push. | FIXED | row | production @ b8f4b32fbd |
| A-208 | G3-48 | popstate's indicator-change branch returned before restoring `MeasureID`/`GeoType`/`TimePeriodID`. | FIXED | row | production @ b8f4b32fbd |
| A-209 | G3-49 | `normalizeLegacyOverlayURL` had no initial-load caller, so `overlay=map` stayed in the address bar. | FIXED | row | production @ b8f4b32fbd |
| A-210 | G3-50, G3-136 | A rapid indicator change could let an earlier fetch finish after a later one and render stale data (404 on `geography/undefined`). | FIXED | rows | production @ b8f4b32fbd |
| A-211 | G3-51 | The `// DE section` smoke entry was `/data-explorer/asthma/` (a `single.html`), leaving `section.html` with no coverage. | FIXED | row | production @ b8f4b32fbd |
| A-212 | G3-52 | URL updates after the data fetch (29–151 ms), not at click time; recommendation is to leave it unless reported. | OPEN | row | production @ b8f4b32fbd |
| A-213 | G3-53, G3-133 | `bar.js` branch-sniffed the `window.mapInterop` shape (`circleMarkers` vs `geoIDtoLayer`), so map↔bar coordination depended on globals that existed only after a renderer finished. | FIXED | rows | production @ b8f4b32fbd |
| A-214 | G3-54 | `window.mapInterop` stayed pointing at removed layers during a geography switch and still wrote the old geography into the legend. | FIXED | row | production @ b8f4b32fbd |
| A-215 | G3-55 | `if (window.myVegaView) …signal("selectedGeo", x).run()` appeared six times in `map.js`. | FIXED | row | production @ b8f4b32fbd |
| A-216 | G3-57 | `assets/js/responsive-table.js` is dead (no template loads it) and deletable today. | OPEN | row | production @ b8f4b32fbd |
| A-217 | G3-58 | Add flat-config ESLint (`no-undef`) over the SPA with derived shared globals and a `lint` script. | FIXED | row | production @ b8f4b32fbd |
| A-218 | G3-59 | Promote `de-characterization.mjs` to `scripts/` with an `npm run characterize` script and a `dev-server.mjs` that resolves or starts one server. | FIXED | row | production @ b8f4b32fbd |
| A-219 | G3-60 | Metadata `innerHTML` sinks (`Sources`, `about`, `how_calculated`) were unsanitised in the new explorer. | FIXED | row | production @ b8f4b32fbd |
| A-220 | G3-61 | Add a console-error smoke test over one page per template kind. | FIXED | row | production @ b8f4b32fbd |
| A-221 | G3-67 | The visual-regression piece (argued for by 4.9) is unbuilt. | OPEN | row | production @ b8f4b32fbd |
| A-222 | G3-70 | A dead commented-out duplicate of a Pagefind filter sat in `head.html`. | FIXED | row | production @ b8f4b32fbd |
| A-223 | G3-71 | `/search-results/` is an orphaned template and stub page whose JS was deleted in 2024. | FIXED | row | production @ b8f4b32fbd |
| A-224 | G3-72 | The new explorer's `single.html`/`section.html` put `data-pagefind-ignore="all"` on the whole article, so topic title/`.Content`/take-action were unindexed. | FIXED | row | production @ b8f4b32fbd |
| A-225 | G3-73 | Keep the "Data Explorer (Old)" Pagefind filter chip until 4.4. | OPEN | row | production @ b8f4b32fbd |
| A-226 | G3-74 | No Pagefind section filter exists for `resources`, `about`, `take-action`. | OPEN | row | production @ b8f4b32fbd |
| A-227 | G3-75 | `class="d-none"` on the Pagefind title `<meta>` tag has no effect. | OPEN | row | production @ b8f4b32fbd |
| A-228 | G3-76 | Modal close button used a text `&times;` in an `.h3` span, deforming Chrome's focus ring and sitting off-centre. | FIXED | row | production @ b8f4b32fbd |
| A-229 | G3-77 | `renderMenuSection` bound two click listeners per button on every rebuild (perf case later disproved). | FIXED | row | production @ b8f4b32fbd |
| A-230 | G3-78, G3-132 | `DE.state` is written from many files; `overlay` alone is assigned at 9 sites across 4 files and coordinated through scattered class toggles, with no single `setOverlay`. | OPEN | rows | production @ b8f4b32fbd |
| A-231 | G3-79 | `GeoType: null` in `VisOptions[0].Map` made the map throw and the Boundary/Time dropdowns blank. | FIXED | row | production @ b8f4b32fbd |
| A-232 | G3-81 | The null-placeholder normaliser covers `Map` only; `Trend`/`Links` use the same convention and are unhandled. | OPEN | row | production @ b8f4b32fbd |
| A-233 | G3-82 | `print-map.js` builds export from `DE.map.filteredMapData`, so an unmapped measure would export a mapped-looking bubble; the Save map control is hidden instead. | OPEN | row | production @ b8f4b32fbd |
| A-234 | G3-83 | 10 measures have no `Citywide` row to fall back on (9 `NYHarbor`-only), leaving empty dropdowns on the unmapped state. | OPEN | row | production @ b8f4b32fbd |
| A-235 | G3-84 | `VisOptions[0].Map` is unpopulated for 40 of 282 indicators whose other views carry real geographies. | OPEN | row | production @ b8f4b32fbd |
| A-236 | G3-85, G4-02 | The three map renderers had no stale-render token, so a slow geometry fetch or a quick Boundary/Time/Measure change could leave the wrong layer. | FIXED | rows | production @ b8f4b32fbd |
| A-237 | G3-86, G3-129 | One Hugo-managed script bundle with a deferred initialiser was proposed and declined, so that stack traces point at real source files. | OPEN (declined) | rows | production @ b8f4b32fbd |
| A-238 | G3-87 | Four dead files in `assets/js/data-explorer/` (`geography.js` 3807 lines, `_choroData.js`, `_choro.js`, `_bar.js`). | FIXED | row | production @ b8f4b32fbd |
| A-239 | G3-88, G3-115, G3-130 | The default-measure priority chain was duplicated between `menu.js` and `measures.js` (two pickers, repeated across the `setDefault*` functions). | FIXED | rows | production @ b8f4b32fbd |
| A-240 | G3-89 | `assignGeoRank` kept a parallel `switch` instead of deriving from `prettifyGeoType`. | FIXED | row | production @ b8f4b32fbd |
| A-241 | G3-90 | `handleToggle()` rebound its delegated click handler on every `drawCallback`. | FIXED | row | production @ b8f4b32fbd |
| A-242 | G3-91 | Analytics calls must be guarded. | FIXED | row | production @ b8f4b32fbd |
| A-243 | G3-92 | Consolidated #18 called the trend/correlate/disparities renderers stubs. | OBSOLETE | row | production @ b8f4b32fbd |
| A-244 | G3-93 | Consolidated items 1–8, 11–13, 15–17, 19–24, 26–29, 31–33 "still open". | UNVERIFIED (other, the 04-17 and 04-19 lists are outside G3's documents so the numbers cannot be mapped) | row | production @ b8f4b32fbd |
| A-245 | G3-96 | `downloadData()` ended with `e.stopPropagation()` where `e` is undefined (`ReferenceError` on every download). | FIXED | row | production @ b8f4b32fbd |
| A-246 | G3-97 | Percentile measures formatted as percent (`A \|\| B && !C` precedence) in `map.js`/`bar.js`. | FIXED | row | production @ b8f4b32fbd |
| A-247 | G3-98 | Citywide click-through targeted `v-pills-trend` (nonexistent) instead of `v-pills-trends-tab`. | FIXED | row | production @ b8f4b32fbd |
| A-248 | G3-99 | `setTimeout(updateChartPlotSize(), 1000)` ran immediately. | FIXED | row | production @ b8f4b32fbd |
| A-249 | G3-101 | Seedless `reduce((a,b)=>a.concat(b))` throws on an empty array. | FIXED | row | production @ b8f4b32fbd |
| A-250 | G3-102 | `bar.js` synthesised confidence intervals (`Value * .95`/`* 1.05`, "hard set for test"). | FIXED | row | production @ b8f4b32fbd |
| A-251 | G3-103 | Duplicate `"test"` key in one `bar.js` object literal. | FIXED | row | production @ b8f4b32fbd |
| A-252 | G3-104 | Dead `#indicatorButtons` handler (old-explorer id, casing bug). | FIXED | row | production @ b8f4b32fbd |
| A-253 | G3-105 | Table-tab "Download data" button had no handler. | FIXED | row | production @ b8f4b32fbd |
| A-254 | G3-106 | Disparities jitter non-deterministic: `seedrandom` not loaded on the new page, and `Math.seedrandom(seed)` called without `new`. | FIXED | row | production @ b8f4b32fbd |
| A-255 | G3-107 | `#map` had no `role`/`aria-label`/text alternative; data conveyed by colour and hover only. | FIXED | row | production @ b8f4b32fbd |
| A-256 | G3-108 | Nothing announces measure/geo/time changes to assistive tech (live region covers indicator name only). | OPEN | row | production @ b8f4b32fbd |
| A-257 | G3-109 | Legend `aria-label` described the decoration ("Rectangle filled with Viridis color scale"). | FIXED | row | production @ b8f4b32fbd |
| A-258 | G3-110 | Vega charts had no description or data-table fallback. | FIXED | row | production @ b8f4b32fbd |
| A-259 | G3-111 | `geoOptionsDropdownButton`/`timeOptionsDropdownButton` rendered twice (mobile and desktop) with `aria-labelledby`. | FIXED | row | production @ b8f4b32fbd |
| A-260 | G3-112 | "Change dataset" link `#FFED98` on green measured 3.84:1 (fails AA). | FIXED | row | production @ b8f4b32fbd |
| A-261 | G3-113 | Render logic wired to magic MeasureIDs/ComparisonIDs scattered and uncommented. | FIXED | row | production @ b8f4b32fbd |
| A-262 | G3-114 | Three ~40-line Table/Map/Trend join blocks in `data.js`. | FIXED | row | production @ b8f4b32fbd |
| A-263 | G3-116 | Five copy-pasted label-collision transform pairs in `trend.js`. | FIXED | row | production @ b8f4b32fbd |
| A-264 | G3-117 | ~240 lines of behavioural JS inline in `de-tab-content.html`. | FIXED | row | production @ b8f4b32fbd |
| A-265 | G3-118 | Close-pane logic duplicated between an inline tab handler and `closeExplorerTabPane`. | OPEN | row | production @ b8f4b32fbd |
| A-266 | G3-119 | Core fetches (`loadData`, topo fetches, 311 `d3.csv`) had no `.catch()`. | FIXED | row | production @ b8f4b32fbd |
| A-267 | G3-120 | String-interpolated `.filter(\`d => d.MeasureID === ${id}\`)` predicates. | FIXED | row | production @ b8f4b32fbd |
| A-268 | G3-121 | String-interpolated `derive` with indicator names broke on an apostrophe. | FIXED | row | production @ b8f4b32fbd |
| A-269 | G3-122 | `.filter(d => !d == "")` in `table.js`/`trend.js`. | FIXED | row | production @ b8f4b32fbd |
| A-270 | G3-123 | Nearly every function `console.log`s, including full data arrays in `bar.js`; gate behind a debug flag. | FIXED | row | production @ b8f4b32fbd |
| A-271 | G3-124 | Dispatcher, URL module, renderer registry, fetch/layer/Vega reuse, hover-reset fix and event bus remain after the state-object half. | UNVERIFIED (other, a restatement of items scored individually) | row | production @ b8f4b32fbd |
| A-272 | G3-125 | State spread across top-scope globals; keep one namespace and route writes through it. | FIXED | row | production @ b8f4b32fbd |
| A-273 | G3-126:no-op | A no-op selection may still add a history entry: neither `writeHistoryState` (`app.js:104`) nor `writeSelectionToURL` (`app.js:130`) compares the new state with the current one, and the callers were not traced. | UNVERIFIED (runtime) | [verified 2026-10-17: Step 3 read of `app.js:104-111` and `:130-145` at P; split from G3-126 at Step 4. Repro: on `?id=2380`, click the measure already selected and compare `history.length` before and after] | production @ b8f4b32fbd |
| A-274 | G3-127 | Valid measures/geos/times/tabs recomputed in several places; build one availability object. | OPEN | row | production @ b8f4b32fbd |
| A-275 | G3-128 | Redefine renderers once; use a renderer map and shared selectors instead of a switch and hidden dependence on `filteredMapData`. | OPEN | row | production @ b8f4b32fbd |
| A-276 | G3-131 | Topology file names, pretty-vs-raw geo values and measurement keywords scattered as magic strings. | FIXED | row | production @ b8f4b32fbd |
| A-277 | G3-134 | Optional DOM targets and unfinished views checked piecemeal; collect references once. | OPEN | row | production @ b8f4b32fbd |
| A-278 | G3-137 | Map geometry rebuilt too often, DataTables recreated without destroy, no explicit lifecycle. | OPEN | row | production @ b8f4b32fbd |
| A-279 | G3-138 | Repeated `innerHTML +=` and per-item appends for notes, 311 links and lists. | OPEN | row | production @ b8f4b32fbd |
| A-280 | G3-139 | Mobile/desktop control groups duplicated and reusing ids; render from one Hugo data structure. | OPEN | row | production @ b8f4b32fbd |
| A-281 | G3-140 | Inline `onclick` handlers and inline scripts in partials. | OPEN | row | production @ b8f4b32fbd |
| A-282 | G3-142 | Hard-coded column matches in the table pipeline are brittle. | OPEN | row | production @ b8f4b32fbd |
| A-283 | G3-143 | Repeated URL parsing, source dedupe and clipboard logic; use helpers, `Set`, Clipboard API. | FIXED | row | production @ b8f4b32fbd |
| A-284 | G3-144 | Failed fetches only log to the console; show a message and a retry. | OPEN | row | production @ b8f4b32fbd |
| A-285 | G4-01 | Same-indicator Back/Forward changed URL/state but not the visible tab pane (`app.js` popstate; activation only in `renderMeasures`). | FIXED (trace) | row | production @ b8f4b32fbd |
| A-286 | G4-03 | Correlate reused cached rows under a stale key after a round trip (`setDefaultLinksMeasure` wrote rows without `selected*MeasureMetadata`). | FIXED (trace) | row | production @ b8f4b32fbd |
| A-287 | G4-04, G4-29 | A superseded indicator load still wrote shared `DE` state and the 311 links, and the `app.js` comment said a stale load "stops before it can write shared state, the URL, or the DOM". | FIXED | rows | production @ b8f4b32fbd |
| A-288 | G4-05, G4-30 | A measure with no views inside a mapped indicator fell back to another measure's map metadata (`geography/undefined`, empty map, 0.0% legend), and the unmapped-measure comments in `map.js` and `global.js` were false for that case. | FIXED | rows | production @ b8f4b32fbd |
| A-289 | G4-06 | Enter on a disabled tab switched state/URL but not the pane. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-290 | G4-07 | Exported map PNG legend gradient reversed (`print-map.js` vs `createColorScale`). | FIXED (trace) | row | production @ b8f4b32fbd |
| A-291 | G4-08 | Citation showed Hugo build date and the `?id=`-less permalink. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-292 | G4-10, G4-31 | A Trends tab with no data left `DE.print` from the previous view, so Save/Download exported it, and the `global.js` download-guard comment claimed otherwise. | FIXED | rows | production @ b8f4b32fbd |
| A-293 | G4-16 | After "No correlates", the Disparities chart left Save Chart/Download disabled. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-294 | G4-18 | Unguarded `localStorage.getItem` in `head.html` aborts the inline script when storage throws. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-295 | G4-20 | "Email your elected officials" is `href="#"` in `header-de.html` and `de-tab-button.html`. | FIXED | row | production @ b8f4b32fbd |
| A-296 | G4-23 | No accessible name: topic-selector button, mobile Learn More, logo link image. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-297 | G4-24 | Mobile Measure/Boundary/Time collapse was a `<div data-toggle="collapse">`, not keyboard-operable. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-298 | G4-25 | `.btn-light-green-bg-outline` `#008939` on `#EFFAF4` = 4.24:1. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-299 | G4-40 | The new explorer sent one `page_view` per selection because the GA streams had history-change page views on. | FIXED (external GA setting) | row | production @ b8f4b32fbd |
| A-300 | G4-41 | `click_tab` sends `bar` instead of `map`, and re-clicking the open tab sends nothing (`de-tab-content.js` `stopImmediatePropagation()`). | OPEN (documented behaviour change, D19 item 3) | row | production @ b8f4b32fbd |
| A-301 | G4-42 | The new explorer's table download sent no `file_download`. | FIXED (trace) | row | production @ b8f4b32fbd |
| A-302 | G4-43 | "Raw data for this indicator" was already not firing, yet D19 listed it as a change. | FIXED (doc corrected; no code defect) | row | production @ b8f4b32fbd |
| A-303 | G4-44 | New values D19 did not list; chart saves sent nothing. | FIXED (trace; chart saves) | row | production @ b8f4b32fbd |
| A-304 | G4-45 | `click_indicator` sends `IndicatorID` as a number where the old explorer sent a string. | OPEN (documented behaviour difference) | row | production @ b8f4b32fbd |
| A-305 | G4-46 | One `scroll` (90%) event fired on the new explorer at load; none on the old. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-306 | G4-47 | 41 requests to `www.googletagmanager.com/a` on the new explorer, none on the old. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-307 | G4-48 | Each hit goes to both `www.google-analytics.com/g/collect` and `www.google.com/g/collect`, on both explorers. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-308 | G4-49 | Between 720px and ~1000px the side panel (`.de-tabs` 38%) leaves charts 172-275px wide; titles, bar axis numbers and the correlate chart clip. Options 1 and 2 not built. | OPEN | row | production @ b8f4b32fbd |
| A-309 | G5-10 | With the list open, `aria-controls` moves axe `aria-valid-attr-value` from violation to incomplete. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-310 | G5-13 | `CLAUDE.md` said 933 real pages and recommended the viewport meta as the marker. | FIXED | row | production @ b8f4b32fbd |
| A-311 | G5-14 | The CARTO allowlist entry `{ page: /displacement-risk/, error: /Unauthorized access to Maps API/i }` in `scripts/smoke-pages.mjs` may be inert; undecided. | OPEN | row | production @ b8f4b32fbd |
| A-312 | G5-15 | Some internal links are absolute paths without the baseURL prefix. | OPEN | row | production @ b8f4b32fbd |
| A-313 | G5-16 | No table carries a `<caption>`. | OPEN | row | production @ b8f4b32fbd |
| A-314 | G5-17 | Cause of the residual baseline-then-check churn (`data-explorer/climate/`, `waterways/`) not established. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-315 | G5-18 | Removing DOMPurify also changed several structure fields on two asthma pages; not separated from instability. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-316 | G5-19 | The plan contradicts itself on whether the `cleared` branch ever executed. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-317 | G5-20 | `img` counted Leaflet tiles. | FIXED | row | production @ b8f4b32fbd |
| A-318 | G5-21 | The mutation observer never attached. | FIXED | row | production @ b8f4b32fbd |
| A-319 | G5-22 | `zh/data-stories/geographies/` was a 404 in the sample. | FIXED | row | production @ b8f4b32fbd |
| A-320 | G5-23 | `characterize:site:sample` cannot compare `data-explorer/asthma/?id=2380`: the baseline comes from `sitemap.xml`, which has no query strings. | OPEN | row | production @ b8f4b32fbd |
| A-321 | G5-24 | `readme-development.md` documented no harness. | FIXED | row | production @ b8f4b32fbd |
| A-322 | G5-25 | Record the EHDP-data commit a baseline describes (`dataCommit`). | FIXED | row | production @ b8f4b32fbd |
| A-323 | G5-26 | Whether to add an automatic run when EHDP-data moves is undecided. | OPEN | row | production @ b8f4b32fbd |
| A-324 | G5-27 | `schedule:` runs only from the default branch, and GitHub disables schedules after 60 days of inactivity (asserted from recall in the plan). | UNVERIFIED (other) | row | production @ b8f4b32fbd |
| A-325 | G5-28 | Smoke wall time on a hosted runner was unknown. | OBSOLETE | row | production @ b8f4b32fbd |
| A-326 | G5-29 | Whether the sequential re-check fires within budget. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-327 | G5-30 | `gitHead` in a base-control artifact named the harness's commit, not the site's. | FIXED | row | production @ b8f4b32fbd |
| A-328 | G5-31 | Sharding the sweep across runners. | OPEN | row | production @ b8f4b32fbd |
| A-329 | G5-32 | The `signatures` table is not rendered into `$GITHUB_STEP_SUMMARY`. | OPEN | row | production @ b8f4b32fbd |
| A-330 | G5-33 | No smoke sweep runs against `dev_stage` in CI. | OPEN | row | production @ b8f4b32fbd |
| A-331 | G5-34 | The 6/24/6 A/B/A wall-time measurement for `smoke-pages.mjs` was not done; its ceiling of 24 comes from characterization. | OPEN | row | production @ b8f4b32fbd |
| A-332 | G5-35 | `partials/related-footer.html` and `key-topics/single.html` hardcode the section-to-icon/accent mapping instead of reading `data/globals/sections.yml`. | OPEN | row | production @ b8f4b32fbd |
| A-333 | G5-36 | Was the dropped `lib-topojson` include in `minimum-wage-with-maps` dead? Plan says DONE, proved in a browser. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-334 | G5-37 | Five `data-features` templates had no `PAGES` entry in `smoke-pages.mjs`. | FIXED | row | production @ b8f4b32fbd |
| A-335 | G5-39 | `renderer: "svg"` rollout across the five DE Vega call sites. | FIXED | row | production @ b8f4b32fbd |
| A-336 | G5-40 | Delete the dead `$zip_codes` assignment in `nr-output/single.html`. | BRANCH-SCOPED | row | production @ b8f4b32fbd; #1491 @ 00737207cb |
| A-337 | G5-41 | `npm run characterize` was non-functional on this lineage; plan says no action. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-338 | G5-42 | Three Vega warnings per DE trend render. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-339 | G6-02 | The 42 Leaflet polygons were focusable, unnamed and click-only. | FIXED | row | #1491 @ d1c7402735 |
| A-340 | G6-04 | `.btn-light-green-bg` and `.btn-report` text was $primary on near-white green, 4.23-4.37:1. | FIXED | row | #1491 @ d1c7402735 |
| A-341 | G6-05, G7-15 | The NR "See neighborhood list" toggle (`nr-neighborhood-list.html`) was parked at 4.24:1 pending a site-wide `.btn-outline-primary` change; `.neighborhood-list-button` now sets `color: $primary-dark !important`, which overrides it. FIXED by trace; computed colour is Task 5's. | FIXED | [verified 2026-10-17: the "Conflict G6-05 against G7-15" paragraph above] | #1491 @ d1c7402735 |
| A-342 | G6-06 | Worse/better pills distinguished by background colour alone. | FIXED | row | #1491 @ d1c7402735 |
| A-343 | G6-07 | 22 vega action `<summary>` controls had no accessible name. | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-344 | G6-08 | Neighborhood switch rebuilds the page with no announcement and a stale `document.title`. | FIXED | row | #1491 @ d1c7402735 |
| A-345 | G6-09 | Modal `aria-labelledby="CCDModalLabel"` pointed at no id. | FIXED | row | #1491 @ d1c7402735 |
| A-346 | G6-10 | All 22 charts named "Vega visualization"; 44 mark groups unnamed. | FIXED | row | #1491 @ d1c7402735 |
| A-347 | G6-11 | Report-page heading order jumped h1→h3→h2 and h2→h4. | FIXED | row | #1491 @ d1c7402735 |
| A-348 | G6-12 | Print QR image had no `alt`. | FIXED | row | #1491 @ d1c7402735 |
| A-349 | G6-13 | `#nr-toggle-accordions` had no `aria-expanded` or `aria-controls`. | FIXED | row | #1491 @ d1c7402735 |
| A-350 | G6-14 | `overlap-tool.html` duplicated `id="tab-btn-01-a"` and referenced undefined `tab-btn-02-a`. | FIXED | row | #1491 @ d1c7402735 |
| A-351 | G6-15 | Download button claimed "(opens in a new tab)" but downloads a blob. | FIXED | row | #1491 @ d1c7402735 |
| A-352 | G6-16 | Demographics table had no row headers. | FIXED | row | #1491 @ d1c7402735 |
| A-353 | G6-17 | 42 dangling `aria-describedby` references to Leaflet tooltips after interaction. | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-354 | G6-18 | Accordion panels were not regions and were labelled by the whole header row. | FIXED | row | #1491 @ d1c7402735 |
| A-355 | G6-20 | Header logo `<img>` has no `alt`, so its link is unnamed. | FIXED | row | #1491 @ d1c7402735; production @ b8f4b32fbd |
| A-356 | G6-21 | `id="languages"` declared twice (header/footer). | FIXED | row | #1491 @ d1c7402735; production @ b8f4b32fbd |
| A-357 | G6-23 | Two `<nav role="navigation">` with no distinguishing label. | FIXED | row | #1491 @ d1c7402735; production @ b8f4b32fbd |
| A-358 | G6-26 | Candidate: no keyboard path to any polygon. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-359 | G6-27 | Candidate: FA `::before` glyphs on `.comp-*` announced as garbage. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-360 | G6-28 | Candidate: two `<h1>` on the report page. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-361 | G6-29 | Candidate: topic index emits many `<h1>` for Pagefind. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-362 | G6-30 | Candidate: `outline: none` leaves controls without a focus indicator. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-363 | G6-31 | Candidate: malformed anchors in `nr-report-footer-sm.html`. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-364 | G6-32 | Candidate: `fa-arrow-circle-right` lacks `aria-hidden` and pollutes the link name. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-365 | G6-33 | Candidate: the beige `.middle` pill needs a non-colour cue. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-366 | G6-34 | Candidate: print rendition duplicates the screen row into the reading order. | DISCONFIRMED | row | #1491 @ d1c7402735 |
| A-367 | G6-35 | Report page printed 0 indicator rows (`d-print-none` on the whole header row, no `print-only` counterpart). | FIXED | row | #1491 @ d1c7402735 |
| A-368 | G6-36 | Panels expanded on screen printed expanded. | FIXED | row | #1491 @ d1c7402735 |
| A-369 | G6-37 | Print QR code dropped; must regenerate on in-place neighborhood switch. | FIXED | row | #1491 @ d1c7402735 |
| A-370 | G6-38 | `getTertilePrintLabel` added in `tertiles.js`. | OBSOLETE | row | #1491 @ d1c7402735 |
| A-371 | G6-39 | Print row uses `getTertileInlineLabel`. | FIXED | row | #1491 @ d1c7402735 |
| A-372 | G6-40 | Comparison markers use FA glyphs; old emoji codepoints removed. | FIXED | row | #1491 @ d1c7402735 |
| A-373 | G6-41 | `getComparison` returns `word` and `preposition` separately. | FIXED | row | #1491 @ d1c7402735 |
| A-374 | G6-42 | `getComparison(null, x)` treats null as 0 and compares instead of returning the empty result. | OPEN | row | #1491 @ d1c7402735 |
| A-375 | G6-43 | Scratch `nr-print-check.pdf`/`.png` left untracked at a repo root. | UNVERIFIED (other) | row | #1491 @ d1c7402735 |
| A-376 | G7-01 | 11 non-NR pages differed only by production content and "arrive on merge". | FIXED | row | #1491 @ d1c7402735 |
| A-377 | G7-02 | The 47 → 258 NR index increase is deliberate. | OBSOLETE | row | #1491 @ d1c7402735 |
| A-378 | G7-03 | Server-rendered list, picker and topic cards put 42 names and all ZIPs into the index on 6 pages. | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-379 | G7-04 | Production's selective indexing is a deliberate decision; `data-pagefind-index-attrs="neighborhood"` absent from both trees. | OBSOLETE | row | #1491 @ d1c7402735 |
| A-380 | G7-05 | Weights at parity except `nr-neighborhood-index.html` (`10` vs house style `10.0`). | OPEN | row | #1491 @ d1c7402735 |
| A-381 | G7-06 | Report pages won bare topic-word queries; neither `weight` nor `ignore` fixed it. | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-382 | G7-07 | The 210 report pages carry a page-level ignore; neighborhood+topic search is gone. | UNVERIFIED (runtime) | row | #1491 @ d1c7402735 |
| A-383 | G7-08, G7-09, G7-13 | NR Pagefind steps 9 and 10 stay open: a second `data-pagefind-filter` separating NR overviews from reports is parked (step 9), and the GA `search_term` test that would re-decide step 8 has not run (step 10). | OPEN | rows | #1491 @ d1c7402735 |
| A-384 | G7-10 | `CLAUDE.md` places the ignore on `<section id="skip-header-target">`; the element is `<section class="container-fluid" data-pagefind-ignore="all">`. | OPEN | row | #1491 @ d1c7402735 |
| A-385 | G7-11 | The harness/baseline count differs from the 2026-08-15 figure, undiagnosed. | OPEN | row | #1491 @ d1c7402735 |
| A-386 | G7-12 | Six small items marked DONE 2026-08-15. | FIXED | row | #1491 @ d1c7402735 |
| A-387 | G7-16 | The fresh ACS pull is planned and not started. | UNVERIFIED (other) | row | #1491 @ d1c7402735 |
| A-388 | G7-17 | Ledger row for `CLAUDE.md` reads "In progress". | FIXED | row | #1491 @ d1c7402735 |
| A-389 | G7-18 | Two near-duplicate `wireComboboxState` implementations. | FIXED | row | #1491 @ d1c7402735 |
| A-390 | G7-19 | The `prod_prod` site-characterization baseline was stale after M2. | FIXED | row | #1491 @ d1c7402735 |
| A-391 | G7-20 | `CLAUDE.md` Guardrails is a union of two branches and long; `refile-rules` not applied. | OPEN | row | #1491 @ d1c7402735 |
| A-392 | G7-21 | The `docs-check verified` stamps were not bumped after the 10-16 merge. | OPEN | row | #1491 @ d1c7402735 |
| A-393 | G7-22 | The comment-spacing convention is not applied to `assets/js/nr-report/*.js` or the NR templates' inline scripts. | OPEN | row | #1491 @ d1c7402735 |
| A-394 | G7-23 | Site-wide audit §17 cites `map.js:269`/`:278` for the UHF42 fetch and the `GEOCODE != 0` filter. | OPEN | row | #1491 @ d1c7402735 |
| A-395 | G7-24 | Production's DE characterization baseline (captured `19c3e93153`, 2026-10-01) no longer matches EHDP-data staging and fails on production's tree. | UNVERIFIED (runtime) | row | production @ b8f4b32fbd |
| A-396 | G7-25 | `neighborhoodMap` was built from content sections the swap deletes. | FIXED | row | #1491 @ d1c7402735 |
| A-397 | G7-26 | The five topic `.md` files carry `layout: topiclanding` on production, `nr-topic-index` on #1491. | BRANCH-SCOPED | row | production @ b8f4b32fbd |
| A-398 | G7-27 | The memos record Hugo 0.146.7. | OBSOLETE | row | #1491 @ d1c7402735 |
| A-399 | G7-28 | Topic-first URLs get no redirect; both Web.config NR rules deleted. | FIXED | row | #1491 @ d1c7402735 |
| A-400 | G7-29 | The neighborhood index keeps the old design; canonical data in `data/globals/`. | FIXED | row | #1491 @ d1c7402735 |
| A-401 | G7-30 | Five content files carried `Soho`, so the report rendered zero cards. | FIXED | row | production @ b8f4b32fbd and #1491 @ d1c7402735 |
| A-402 | G7-33 | VS Code reports ~24 CSS parse errors in `nr-topic-index.html`. | UNVERIFIED (other) | row | #1491 @ d1c7402735 |

### G1 — site-wide audit §1–§10 (production @ b8f4b32fbd; #1491 rows read via git at d1c7402735)

Returned 2026-10-17, 100 rows, pasted verbatim below apart from its section headings, which are demoted to labels. Unlike G5–G7, G1 read #1491 through `git show`/`git grep` at `d1c7402735`, not from the worktree. **Its reconciliation's status counts are wrong** (they sum to 97); recounted from the table with `g1_tally.py`, which splits cells on unescaped pipes only: OPEN 53, FIXED 28, UNVERIFIED (runtime) 10, OBSOLETE 5, BRANCH-SCOPED 3, UNVERIFIED (unqualified) 1 = 100, no malformed rows.

Abbreviations used in the stamps (read-only git throughout): P = `b8f4b32fbd` (production code), N = `d1c7402735` (#1491), C0 = `b7a91992d0` (production on 2026-06-27, control commit for pre-July findings). `git grep -n X <ref> -- <path>` is written `grep X @ref path`. Worktree note: the #1491 worktree HEAD is now `00737207cb` (4 commits past d1c7402735); every N claim below was read from `d1c7402735` via git (`git show`/`git grep`/`git archive`), not from the worktree. Date of all stamps: 2026-10-17.

**1. Table (G1's)**

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G1-01 | site-wide §1, §5 (legacy bullet; merged) | The legacy explorer (`assets/js/data-explorer-old/`, `themes/dohmh/layouts/data-explorer-old/`, `content/data-explorer-old/`) is still built and served. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P \| grep -E '^(assets/js\|themes/dohmh/layouts\|content)/data-explorer-old'`; result: 10 JS files in assets/js/data-explorer-old (app, data, disparities, global, links, map, measures, print, table, trend), layouts dir present, 76 entries under content/data-explorer-old (same listing on N); control: the pattern is the directory name, hits on both trees] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-02 | site-wide §1 | Versioned partial/shortcode pairs remain: `featured-data(-2)`, `vega`/`vega0`, `nyccas_pollutant_trends(_new)`, `nr-indicator-new/old`, `related-footer(-old)`. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P themes`; result: all five pairs present on P; callers via `grep -E 'partial(Cached)? +"<name>"' @P themes content`: featured-data-2 0, featured-data 0, related-footer-old 0, nyccas_pollutant_trends (non-new) 0, nyccas_pollutant_trends_new 1 (nyccas-report.html:136), `vega0` string appears in no content/themes file other than its own filename; nr-indicator-new/old absent on N (deleted in #1491); control: same grep returns 1 caller for nr-indicator-new (`nr-output/single.html:417`)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-03 | site-wide §1 | A family of `related*` partials (doc says "eight"; it lists `related` twice) exists. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P \| grep related`; result: 7 partial files (related, related-data, related-footer, -categories, -content, -de, -old); same 7 on N; the doc's count of 8 is a double listing] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-04 | site-wide §1 | Three header partials (`header`, `header-de`, `header-ds`) and two overlap-tool partials (`overlap-tool`, `overlap-tool-with-map`) exist. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P \| grep -E 'header-d?[es]?\.html\|overlap-tool'`; result: all five present on P and N; each has a live caller (`grep partial "header-de"` etc. = 1 each)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-05 | site-wide §2 | `head.html` loaded ~20 render-blocking library `<script>` tags with no defer/async. | FIXED | [verified 2026-10-17: `git show P:themes/dohmh/layouts/partials/head.html \| grep -c '<script'`; result: 8 (2 GA async, 2 inline, jQuery, DOMPurify, 2 inline debug blocks) vs 18 on C0; libraries are now `partial "lib-*"` includes, counted by a Python pass over layouts: 67 in `main`, 6 in `js_bot`, 0 in `js_top`; control: same count on C0 = 18, with `eq .Kind "page"` gate hit at C0 head.html. Caveat: jQuery and DOMPurify still block in head, and no `lib-*` partial carries defer/async (`git grep -c -E 'defer\|async' P 'themes/.../partials/lib-*.html'` empty)] | production @ b8f4b32fbd |
| G1-06 | site-wide §2 | Font Awesome JS SVG-injector (`all.min.js`) shipped in head. | FIXED | [verified 2026-10-17: `git grep -c 'fontawesome-free/js' P -- themes assets`; result: no hits; control: same grep on C0 = 1 hit (head.html:112)] | production @ b8f4b32fbd |
| G1-07 | site-wide §2 | No CSS minification: `toCSS \| resources.Fingerprint` with no `minify` (proposed and rejected by the user 2026-07-14). | OPEN | [verified 2026-10-17: `git grep -n -i minify P -- themes config`; result: no hits; head.html:139 still `$sass \| toCSS \| resources.Fingerprint "sha512"`; the doc records this as a decision not to add it, so OPEN here means "still unminified", not "should be fixed"; control: `toCSS` grep hits at head.html:139] | production @ b8f4b32fbd |
| G1-08 | site-wide §2 | The favicon `<link>` is emitted twice in head.html. | FIXED | [verified 2026-10-17: `git show P:...head.html \| grep -c 'rel="icon"'`; result: 1; control: C0 = 2 (lines 46 and 101)] | production @ b8f4b32fbd |
| G1-09 | site-wide §2 | nyc-lib CSS is loaded conditionally and again unconditionally. | FIXED | [verified 2026-10-17: `git show P:...head.html \| grep -n nyc-basic-lib`; result: only the `.Params.mapLib`-gated link at line 107; control: C0 has two links (lines 89 and 126)] | production @ b8f4b32fbd |
| G1-10 | site-wide §2 | The FA webfont `range` loop is "dead" (later corrected: not dead, it triggers publish). | OBSOLETE | [verified 2026-10-17: `git show P:...head.html \| sed -n 126,135p`; result: loop is now `{{- $woff.Publish -}}` with a comment explaining the relative `url(../webfonts/..)`; the double-`Get` form the finding discusses is gone; control: C0 head.html contains the FA JS line (112) the finding sat beside] | production @ b8f4b32fbd |
| G1-11 | site-wide §2 | head.html's `if or (eq .Kind "page") ...` library gate made page dependencies live outside the page template (recommend per-template inclusion). | FIXED | [verified 2026-10-17: `git show P:...head.html \| grep -c 'eq .Kind'`; result: 0; 8 `lib-*` partials exist (arquero, d3, datatables, easybutton-coloricon, leaflet, topojson, uhflist, vega), included from 31 templates; control: C0 head.html has the gate (`grep -c 'eq .Kind "page"'` = 1)] | production @ b8f4b32fbd |
| G1-12 | site-wide §2 | Two templates built the same `js/dataTableBundle.js` `resources.Concat` target, so Hugo served whichever it cached first. | FIXED | [verified 2026-10-17: `git grep -n 'resources.Concat' P -- themes \| grep -i bundle`; result: `js/dataTableBundle.js` is built only in data-explorer-old/single.html:1119; lib-datatables.html uses `js/lib-datatables-bundle.js`, lib-vega.html `js/lib-vega-bundle.js`; control: C0 head.html:172 built `js/dataTableBundle.js`] | production @ b8f4b32fbd |
| G1-13 | site-wide §2 | ~66 of 136 layouts carry inline behavioural JS (not lintable, not CSP-friendly). | OPEN | [verified 2026-10-17: Python pass `inline.py` over themes/dohmh/layouts (non-empty `<script>` without `src=`, multi-line tags handled); result: P 55 of 151 html layouts, N 50 of 144; the doc's 66/136 does not reproduce under this definition: C0 gives 54 of 123, so the count is definition-dependent, the finding itself stands; control: C0 run returns 54] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-14 | site-wide §3 | head.html loaded Leaflet point-in-polygon from dead `cdn.rawgit.com`. | FIXED | [verified 2026-10-17: `git grep -n -i rawgit P -- themes assets content static config`; result: no rawgit in head.html (only the 3 OpenLayers tags, G1-48); control: C0 head.html:220 loads `cdn.rawgit.com/hayeswise/Leaflet.PointInPolygon`. External fact "RawGit shut down Oct 2019" is the doc's claim, not re-sourced here] | production @ b8f4b32fbd |
| G1-15 | site-wide §3 | External scripts without SRI: the rawgit OpenLayers tags and Google Translate. | OPEN | [verified 2026-10-17: `git grep -n -E 'rawgit\|translate.google' P -- themes`; result: 3 rawgit `ol.js` tags (rats-in-your-neighborhood.html:219, rats-in-your-neighborhood-nyc-lib.html:99, take-action/email-electeds.html:132) and `translate.google.com/translate_a/element.js` at js_bottom.html:39, none with `integrity`; same on N] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-16 | site-wide §3 | Bootstrap 4.3.1 is EOL and the site is pinned to BS4 + a vendored SCSS fork. | OPEN | [verified 2026-10-17: `git show P:package.json \| grep bootstrap` and `package-lock.json`; result: `"bootstrap": "^4.3.1"`, locked 4.6.2; `git ls-tree -r --name-only P assets/bootstrap/scss \| wc -l` = 89. EOL date is the doc's outside-world claim (undated source), not re-checked] | production @ b8f4b32fbd |
| G1-17 | site-wide §3 | `ci` (`^2.3.0`) in package.json looks like an accidental install. | FIXED | [verified 2026-10-17: `git show P:package.json \| grep -c '"ci"'` = 0 and `package-lock.json` has no `node_modules/ci`; control: same grep on C0 = 1] | production @ b8f4b32fbd |
| G1-18 | site-wide §3 | Audit `@mapbox/leaflet-pip`, `qrcode-generator`, `jquery-flexdatalist` for use; (also: georaster/geoblaze confirmed in use). | OBSOLETE | [verified 2026-10-17: `git grep -l 'node_modules/.*<pkg>' P -- themes content assets`; result: leaflet-pip, georaster, geoblaze loaded by data-features/heatstory.html; qrcode-generator by nr-output/single.html (P) and neighborhood-reports/nr-report.html (N); flexdatalist by aqe.html, hvi.html, de-text-search.html, neighborhood-reports/section.html, topiclanding.html; so the premise "may be unused" does not hold for any of them; the doc's own §5c correction already says leaflet-pip is loaded] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-19 | site-wide §3, §3a (merged) | "No npm audit/Dependabot ... 8 open alerts": Dependabot is on; open-alert count and groups. | OPEN | [verified 2026-10-17: `gh api 'repos/nychealth/EH-dataportal/dependabot/alerts?state=open&per_page=100' --jq length`; result: 25 open alerts, all on package-lock.json (e.g. #97 decompress critical, #87 decompress critical, #45/#42/#39 vega-functions/vega/vega-expression high, #60 serialize-javascript high, #33 micromatch, #46 elliptic, #29/#104 braces; plus brace-expansion, qs, dompurify, pbkdf2 etc. not in the doc); the doc's "8" is stale; control: same API call returns the named groups, so it can fire] | production @ b8f4b32fbd |
| G1-20 | site-wide §3a Group 1 | `decompress` (critical) is transitive under `hugo-extended` and not in the production build path. | OPEN | [verified 2026-10-17: `git show P:package.json \| grep -n -B1 hugo-extended` and `git grep -n hugo-version P -- .github`; result: `hugo-extended 0.147.3` is in `optionalDependencies` (doc says 0.146.7), all four build workflows pin `hugo-version: "0.147.3"` via the setup action; Dependabot alerts #97/#93/#89/#87 (decompress) open; control: lock has `node_modules/decompress` 4.2.1] | production @ b8f4b32fbd |
| G1-21 | site-wide §3a Group 2 | vega/vega-functions/vega-expression HIGH alerts ship but are unreachable: "exactly two `expr` fields (correlate.js:425, trend.js:60), static". | OPEN | [verified 2026-10-17: `git grep -n -E '"?expr"?\s*:' P -- assets/js content themes`; result: alerts #45/#42/#39 open; lock vega 5.33.1 / vega-lite 5.23.0 / vega-embed 6.29.0 (matches doc); `VEGA_DEBUG` and `setdata` absent from first-party code; but the "exactly two" count no longer holds: correlate.js:589,596, trend.js:62, congestion-pricing chart-ej.js:96 and sticky-header.js:278, HVIMapSpec.vg.json:28, all still static literals; control: same grep on 7858735931 (2026-07-25) returns correlate.js:425 and trend.js:60 as the doc says] | production @ b8f4b32fbd |
| G1-22 | site-wide §3a Group 3 | serialize-javascript/micromatch/elliptic/braces alerts all sit under `georaster@1.6.0`, which heatstory uses. | OPEN | [verified 2026-10-17: lock shows georaster 1.6.0 and serialize-javascript 4.0.0; alerts #60, #33, #46, #29, #104 open; `heatstory.html` loads georaster/geoblaze/layer; whether npm's "non-major fix available" holds was not run (no install allowed)] | production @ b8f4b32fbd |
| G1-23 | site-wide §4 | Mobile and desktop nav are fully duplicated in header.html (incl. the `$want_menus` loop). | OPEN | [verified 2026-10-17: `git show P:...header.html \| grep -c want_menus` = 6, `#nav-primary-top` at line 92 and `#nav-primary` at line 251; control: C0 = 6 / lines 92 and 254] | production @ b8f4b32fbd |
| G1-24 | site-wide §4, §10 (merged) | `<a><li>` inside `<ul>` in header.html nav. | FIXED | [verified 2026-10-17: Python multi-line regex `<a\b[^>]*>\s*<li\b` over header.html; result: 0 on P; control: C0 header.html = 6 hits. Note the same defect remains in header-de.html (G1-27)] | production @ b8f4b32fbd |
| G1-25 | site-wide §4 | Site title `<a>` crosses two `<span>`s in header.html. | FIXED | [verified 2026-10-17: `git show P:...header.html \| sed -n 70,80p`; result: `<a ...><span class="site-subtitle">..</span><span class="site-title">..</span></a>` properly nested; control: C0 lines 78-79 show `<span><a>..</span><span>..</a></span>`] | production @ b8f4b32fbd |
| G1-26 | site-wide §4 | Search links carry both `data-toggle="modal"` and `data-toggle="collapse"` in header.html. | FIXED | [verified 2026-10-17: Python regex for a tag with both attributes, header.html; result: 0 on P; control: C0 = 3] | production @ b8f4b32fbd |
| G1-27 | site-wide §4, §10 (extension) | The same three defects persist in `header-de.html` (the explorer header): `<a><li>` x6, title anchor crossing spans (lines 59-60), duplicate `data-toggle` x3. | OPEN | [verified 2026-10-17: Python regex over all layouts on P and N, plus `git grep -n -B1 -A1 site-title P -- header-de.html`; result: header-de.html 6 / 1 / 3 hits, no other layout has `<a><li>`; control: same regex finds the 6/3 in C0 header.html. Also recorded as §15.3 (outside my scope)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-28 | site-wide §4 | `console-log.html`, `warn_counter.html`, `temp-popup.html` and `g-dev-tools.scss` suggest debug scaffolding that may ship. | OPEN | [verified 2026-10-17: `git grep -n -E 'console-log\|warn_counter\|temp-popup' P -- themes`; result: console-log has no caller, warn_counter only in commented-out calls, so both are dead partials; temp-popup is live (index.html:317, the weather/AirNow modal, not debug); see G1-69 for the SCSS] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-29 | site-wide §4a | `#skip-header-target` was duplicated on `<main>` and ~20 templates' `<article>`. | FIXED | [verified 2026-10-17: `git grep -l skip-header-target P -- themes`; result: baseof.html:28 and list.html:29 (`<main id="skip-header-target" tabindex="-1">`) plus the 3 header partials' `href`; control: same grep on `b8771726c9^` = 49 files, on `b8771726c9` = 4. The focus-moves-on-skip behaviour is marked HYPOTHESIS in the doc and is runtime, not checked] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-30 | site-wide §4a | `takeaction.html` is shared by both explorers so its `id="311"`/`id="311label"` (leading-digit ids, invalid CSS selectors) cannot move. | OPEN | [verified 2026-10-17: `git grep -n -E 'id="311(label)?"' P -- themes`; result: partials/takeaction.html:4 still has both ids; included by data-explorer/single.html:70 and data-explorer-old/single.html:467; DE-only partials use `contact311Label`/`contact311LinksDesktop` (header-de.html:454-455); `\bid="[0-9]` sweep for other numeric-leading ids not run] | production @ b8f4b32fbd |
| G1-31 | site-wide §4a | takeaction's hidden `d-none` copy contributes nothing to Pagefind because its 311 spans are populated client-side. | OPEN | [verified 2026-10-17: `git show P:...data-explorer/single.html \| sed -n 60,72p`; result: `<div class="d-none">` includes takeaction.html whose 311 spans are empty at build (takeaction.html:4); client population by assets/js/data-explorer/311.js; what Pagefind actually indexes is not measured here (no build)] | production @ b8f4b32fbd |
| G1-32 | site-wide §4b | The SPA calls the feature `links` in 454 places across 11 files while the UI says "Correlate" (deferred rename). | OPEN | [verified 2026-10-17: `git grep -h -o -i links <ref> -- assets/js/data-explorer \| wc -l`; result: P 472 in 12 files (measures.js 321); control: 7858735931 gives 454 in 11 files, reproducing the doc's total (its "222 in measures.js" does not reproduce: 311); contracts still live: `normalizeLegacyHashOverlayURL` app.js:258, `links_disparities` measures.js:380] | production @ b8f4b32fbd |
| G1-33 | site-wide §4c | Deferred: always show Citywide/Borough in the explorer table via `TABLE_CONTEXT_GEOS`. | OPEN | [verified 2026-10-17: `git grep -n -E 'TABLE_CONTEXT_GEOS\|pickSyncedTableGeos' P -- assets`; result: no hits in code (only in the audit doc); it is a recorded deferral, not implemented; control: pattern hits at documents/site-wide-audit-2026-06-27.md:411] | production @ b8f4b32fbd |
| G1-34 | site-wide §5, §9, §11 (merged) | `click_subscribe` fires twice per click (main.js raw gtag and site.js delegated), with two parameter schemas. | FIXED | [verified 2026-10-17: `git grep -n click_subscribe P -- assets themes content`; result: only site.js:101 fires it; main.js:97 is a comment; control: `6446199e3a^` has main.js:14 `gtag('event','click_subscribe'...)` and site.js:99 `sendAnalyticsEvent("click_subscribe"`; `merge-base --is-ancestor 6446199e3a P` true] | production @ b8f4b32fbd |
| G1-35 | site-wide §5 | Two JS idioms: `main.js` (jQuery ready) and `site.js` (IIFE, delegation); migrate main.js over time. | OPEN | [verified 2026-10-17: `git show P:assets/js/main.js \| head -1`, `git show P:assets/js/site.js \| head -2`; result: `$(document).ready(function () {` vs `(() => {`; both loaded by js_bottom.html:43,51] | production @ b8f4b32fbd |
| G1-36 | site-wide §5, §5a | Geo crosswalks shipped as JS (`ccd-to-uhf42.js`, `cd-to-uhf42.js`, `uhflist.js`) rather than data. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only <ref> assets/js \| grep uhf`; result: ccd/cd .js present on P and N, consumed by overlap-tool.html:49,53 and overlap-tool-with-map.html:51,55; uhflist.js exists only on P, N generates `var neighborhoods` from data/globals/uhflist.json via lib-uhflist.html (see G1-37)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-37 | site-wide §5a (1) | `uhflist.js` and `uhflist.json` are different vintages (five ACS percentages differ); resolved 2026-08-05 by keeping the `.js` and deleting the `.json`. | BRANCH-SCOPED | [verified 2026-10-17: `git ls-tree -r --name-only <ref> \| grep -i uhflist`; result: P still has both assets/js/uhflist.js and uhflist.json (`16.53` only in .js, `16.1624` only in .json, so the divergence is live) plus nr-insert-zips.html reading the .json; N has neither, only data/globals/uhflist.json (contains `16.53`, no `16.1624`) feeding lib-uhflist.html:8 and the content adapter; control: the 16.53/16.1624 split on P is the finding's own example] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-38 | site-wide §5a (2) | `uhflist.js` was render-blocking in head on pages that never use it. | FIXED | [verified 2026-10-17: `git grep -n uhflist P -- themes/dohmh/layouts/partials/head.html`; result: no hits; users include it via `lib-uhflist` (NR templates) or explicitly (index.html:335); control: C0 head.html has 2 uhflist hits (line 185-186)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-39 | site-wide §5a (3) | `topiclanding.html` loaded `uhflist` twice (head plus its own tag). | FIXED | [verified 2026-10-17: `git grep -c uhflist P -- topiclanding.html` = 1 (the `lib-uhflist` include) with head.html clean; the template is gone on N; control: C0 topiclanding.html 2 hits and C0 head.html 2 hits] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-40 | site-wide §5a (4), §5 deferred list (merged) | Five caller-less NR partials (`nr-clickable-uhf`, `nr-map-highlight`, `nr-chooser`, `nr-indicator-old`, `nr-sub_nav`) plus the "three dead DOMPurify-consuming nr partials". | BRANCH-SCOPED | [verified 2026-10-17: `git ls-tree -r --name-only <ref> themes/.../partials \| grep nr-`, and `grep -E 'partial(Cached)? +"<name>"' @P themes`; result: all five exist on P with 0 live callers each (nr-insert-zips has 2); none exist on N (deleted in #1491, matching the doc's 2026-08-06 deletion note); control: caller grep returns 1 for nr-indicator-new] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-41 | site-wide §5a (4)/corrected | `static/UHF42.csv` and `assets/js/ccd-to-uhf42.json` were kept after their consumers went (served verbatim from static/ or assets, so removal needs traffic evidence). | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only <ref> \| grep -E 'UHF42.csv\|ccd-to-uhf42.json'`; result: present on P and N; `git grep -l 'UHF42.csv\|ccd-to-uhf42.json' <ref> -- themes assets` finds no reader] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-42 | site-wide §5a (5) | The UHF42 boundary is served from two origins (local `static/geojson/UHF42.geojson` vs EHDP-data). | OPEN | [verified 2026-10-17: `git grep -n -E 'UHF42\.(geojson\|topo)' <ref> -- themes assets`; result: local copy used by nr-leaflet.html:45 (P and N) and nr-report.html:314 (N); remote by overlap-tool-with-map.html:76,307 and NR chart.js:31 (N)/nr-output/single.html (P) / DE global.js:459] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-43 | site-wide §5a (6) | `nameCorrections` in `nr-topic-spa.js` blames the wrong file and is inert; closed 2026-08-08. | OBSOLETE | [verified 2026-10-17: `git grep -n -E 'nameCorrections\|correctedUhfName' P -- assets themes` = no hits; on N only a comment at assets/js/nr-report/global.js:107 saying it "used to wrap"; control: `d6f99e19ea` has `assets/js/nr-topic-spa.js:632 var nameCorrections = {`] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-44 | site-wide §5b | Datawrapper charts in inactive Bootstrap tab-panes throw SVG-sizing console errors; fixed 2026-07-16 by `lazy-tab-embeds.js`. | UNVERIFIED (runtime) | Static facts: [verified 2026-10-17: `git grep -l -E 'data-lazy-(src\|embed-src)' P -- content`; result: the 8 files in the doc's table carry the attribute; `assets/js/data-stories/lazy-tab-embeds.js` binds `shown.bs.tab` (line 39) and is loaded from data-stories/single.html:23; commit a0ce013172 introduced it.] Reproduce: load `/data-stories/housing/`, `/redlining/`, `/air-quality-snapshots/`, `/vectorborne-diseases-and-health/` and read the console (expect 0 errors), click a non-initial tab (chart renders). | production @ b8f4b32fbd |
| G1-45 | site-wide §5b (new finding) | `data-stories/housing` hides Datawrapper charts with radio-driven inline `display:none` divs, which warn in the Spanish page; unfixed. | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n -E 'id="(ifElow\|ifVlow\|ifLow\|ifMod)"' P -- content/data-stories/housing`; result: the four `style="display:none"` divs still exist in index.md, index.es.md and index.zh.md; lazy-tab-embeds only listens to `shown.bs.tab`.] Reproduce: load `/es/data-stories/housing/` (es path as served) and look for "Aborting chart rendering due to invalid container dimensions". | production @ b8f4b32fbd |
| G1-46 | site-wide §5c | `rats-in-your-neighborhood` calls `area.contains(...)` on an `L.polygon`, which native Leaflet lacks (came from the dead RawGit plugin). | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n 'area.contains' <ref> -- content/data-features/rats-in-your-neighborhood`; result: neighborhood-rats.js:249 and 270 on P and N; `area = L.polygon(...)` at :247/:268; no plugin loaded (`grep -E 'wise-leaflet-pip\|PointInPolygon'` hits only a comment at rats-in-your-neighborhood.html:232); installed leaflet 1.9.4 `leaflet-src.js` defines `contains` only on Bounds/LatLngBounds (lines 936, 1093, 1353).] Reproduce: open `/data-features/rats-in-your-neighborhood/`, search an address, watch for `TypeError: area.contains is not a function`. | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-47 | site-wide §5c | Three templates still load OpenLayers from dead `cdn.rawgit.com`. | OPEN | [verified 2026-10-17: `git grep -n -i rawgit <ref> -- themes assets content static config`; result: exactly 3 on P and on N (rats-in-your-neighborhood.html:219, rats-in-your-neighborhood-nyc-lib.html:99, take-action/email-electeds.html:132); the doc's "five on the NR lineage" does not hold for N (take-action-email.html and take-action/email.html absent); host shutdown date is the doc's outside claim] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-48 | site-wide §5c (HYPOTHESIS) | Those OpenLayers maps are broken in production (unless `nyc-ol-lib.js` supplies `ol`). | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `grep -n -E 'nyc-ol-lib\|FrameworkMap' @P rats-in-your-neighborhood.html email-electeds.html`; result: `nyc-ol-lib.js` v1.4.78 loaded two lines after the rawgit tag; `new nyc.ol.FrameworkMap` at email-electeds.html:148.] Reproduce: load `/take-action/email-electeds/` and `/data-features/rats-in-your-neighborhood/`, check console for `ol is not defined` and whether the map draws. | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-49 | site-wide §5c (aside) | `rats-in-your-neighborhood-nyc-lib.html` is referenced by nothing. | OPEN | [verified 2026-10-17: `git grep -n 'rats-in-your-neighborhood-nyc-lib' P -- content themes config`; result: no hits outside the file; the live page's front matter is `layout: rats-in-your-neighborhood` (content/data-features/rats-in-your-neighborhood/index.md:11); control: that grep for `layout:` hits] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-50 | site-wide §5d | AirNow widget on `realtime-air-quality` makes a CORS-blocked XHR (vendor iframe, allowlisted). | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n -i airnow P -- scripts/smoke-pages.mjs`; result: page-scoped KNOWN_NOISE entry at lines 118-120 and a PAGES entry at line 70.] Reproduce: load `/data-features/realtime-air-quality/`, read the console for the cross-origin XHR to `airnowgovapi.com`. | production @ b8f4b32fbd |
| G1-51 | site-wide §5d | NR landing page threw a duplicate-declaration SyntaxError (`var` vs `let intendedDestinationName`). | FIXED | [verified 2026-10-17: `git grep -n -E '(var\|let\|const) +intendedDestinationName' <ref> -- themes assets`; result: both are `var` (P: section.html:212, nr-leaflet.html:203; N: section.html:165, nr-leaflet.html:242); control: `103c8197bd^` has section.html:223 `var` and nr-leaflet.html:196 `let`; fix commit is an ancestor of P and N] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-52 | site-wide §5e | `nr-output` report pages used Arquero without loading it. | FIXED | [verified 2026-10-17: `git grep -n lib-arquero <ref> -- themes/dohmh/layouts/nr-output themes/dohmh/layouts/neighborhood-reports`; result: P nr-output/single.html:60; N neighborhood-reports/nr-report.html:399 (nr-report uses `aq.` in app.js, chart.js, data.js); control: `b5b6e3d1f7^` has no `lib-arquero` in nr-output/single.html, `b5b6e3d1f7` has 1. Cause removed in code, so FIXED per rule 3 exception; the 'no other gaps' sweep result is superseded by G1-53/G1-54] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-53 | site-wide §5f | `/data-explorer/` section page calls `aq.from` (via `de-topic-indicators.html`) with Arquero not loaded. | FIXED | [verified 2026-10-17: `git grep -n lib-arquero P -- themes/dohmh/layouts/data-explorer`; result: section.html:4, data-index.html:4, indicator-catalog.html:21, single.html:5; control: `49745f24b6^` section.html has no include, `49745f24b6` has 1; the smoke allowlist entry the doc mentions is absent (no `aq is not defined` string in smoke-pages.mjs)] | production @ b8f4b32fbd |
| G1-54 | site-wide §5e/§5f corrections | `data-explorer-old/{section,data-index,indicator-catalog}.html` consumed `aq.` without a `lib-arquero` include. | FIXED | [verified 2026-10-17: `git grep -n lib-arquero P -- themes/dohmh/layouts/data-explorer-old`; result: section.html:24, data-index.html:4, indicator-catalog.html:26; control: `git grep -c lib-arquero 2d49d98914^ -- .../data-explorer-old/section.html` empty, at `2d49d98914` = 1] | production @ b8f4b32fbd |
| G1-55 | site-wide §5g | The header's Google Forms iframe is refused by Google's report-only `frame-ancestors`, on every page. | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n 'docs.google.com/forms' P -- themes`; result: header.html no longer contains the iframe; the form URL is a `data-subscribe-form-url` on `#subscribeModal` (subscribe-modal.html:3) and main.js:111-125 builds the iframe on `show.bs.modal`, so it is created only when the modal opens, not on every page; control: C0 header.html:374 had the literal `<iframe src="https://docs.google.com/forms/...`; smoke-pages.mjs:134 allowlists `frame-ancestors`.] Reproduce: open `/`, read the console (expect no refusal), then click "Sign up" and read it again. | production @ b8f4b32fbd |
| G1-56 | site-wide §5h | Two JS convention files contradict on `console.log` format and trailing periods. | FIXED | [verified 2026-10-17: `git show P:.claude/commands/js-development.md \| wc -l` = 25 (stub pointing to `documents/js-conventions.md`, 554 lines); control: `dd10b39e0f` js-development.md = 166 lines] | production @ b8f4b32fbd |
| G1-57 | site-wide §5h (open question) | Comment voice (third-person sentence vs imperative fragment) is deliberately unresolved. | UNVERIFIED (other, a style decision with no code predicate to test) | [verified 2026-10-17: `git show P:documents/js-conventions.md`; result: accepts both voices per the doc; no mechanical check exists] | production @ b8f4b32fbd |
| G1-58 | site-wide §5h ("Pending") | `debugLog` is not on every branch. | FIXED | [verified 2026-10-17: `git grep -n 'const debugLog' <ref> -- themes/.../head.html`; result: P head.html:217 and N (3 hits); control: `93e207e783` (production before #1462) has 0 hits, so the statement was true on that tree. NOTE js-conventions.md on P (lines 415-417) still carries the "PENDING: debugLog arrives with feature-new-data-explorer" marker the finding said to drop] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-59 | site-wide §5h (known non-conformance) | `assets/js/nr-topic-spa.js` (945 lines) has no banner, unconditional `console.log`; later split into ten files. | OBSOLETE | [verified 2026-10-17: `git ls-tree -r --name-only <ref> \| grep -c nr-topic-spa` = 0 on P and N; N has `assets/js/nr-report/` (10 files) and `git grep -c console.log N -- assets/js/nr-report` returns no hits; control: `d6f99e19ea:assets/js/nr-topic-spa.js` exists] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-60 | site-wide §5h | `global.js` in the DE tree uses two `function` declarations where the conventions prefer named arrows. | OPEN | [verified 2026-10-17: `git show <ref>:assets/js/data-explorer/global.js \| grep -n '^function '`; result: lines 472 `getGeoFile` and 1003 `getDisplayNotes` on both P and N; the 'prefers' claim is a style rule in documents/js-conventions.md] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-61 | site-wide §5h | `assets/js/site.js` is empty (0 lines). | BRANCH-SCOPED | [verified 2026-10-17: `git show P:assets/js/site.js \| wc -l` = 162; control: `4257e4808d:assets/js/site.js` = 0 lines, so it was true on that lineage] | production @ b8f4b32fbd |
| G1-62 | site-wide §5i | Throwaway DE->NR merge broke NR report pages via the 404.html NR routing bridge (`L is not defined`). | OBSOLETE | [verified 2026-10-17: `git grep -c nr_pending_neighborhood <ref> -- themes assets`; result: no hits on P or N; control: `6cc52de277^:themes/dohmh/layouts/404.html` has the bridge (1 hit), removed by `6cc52de277` ("NR: remove the nr_pending_neighborhood bridge at both ends"); the pre-merge `nr-output` template is also gone on N] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-63 | site-wide §5i | The generic `Failed to load resource` smoke allowlist entry hides the cause of blocked-script failures. | OPEN | [verified 2026-10-17: `git grep -n 'Failed to load resource' P -- scripts/smoke-pages.mjs`; result: entry at line 151 with its own CAUTION comment (line 148); the Pagefind entry is now conditional (`when: () => !pagefindServed`, line 145)] | production @ b8f4b32fbd |
| G1-64 | site-wide §5j | Smoke test failed intermittently on a cache-cold first run (`L`/`DOMPurify` undefined). | UNVERIFIED (runtime) | No static fact settles it; the doc itself marks the mechanism untested. Reproduce: wipe `resources/_gen`, run `npm run smoke` on a fresh server, look for `L is not defined` on `/data-explorer/asthma/`. | production @ b8f4b32fbd |
| G1-65 | site-wide §5k | flexdatalist inputs emit `aria-expanded` with no combobox role (5 call sites incl. 2 NR pages, wired via `flexdatalist-combobox-js.html`); fixed 2026-08-21. | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n flexdatalist-combobox-js <ref> -- themes content`; result: included by aqe.html:258, hvi.html:213, de-text-search.html:28, neighborhood-reports/section.html:204, topiclanding.html:159 (P); on N via de-text-search, aqe, hvi, nr-neighborhood-picker-js.html:18; hvi.js:70/aqe.js:41 wire it; `setAttribute('role','combobox')` at partial line 43; control: `e70327e984^` has no such partial.] Reproduce: type in each search box, read `role`/`aria-expanded`/`aria-activedescendant` on the input while the list is open. | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-66 | site-wide §5k | Escape does not dismiss the flexdatalist list (keyup re-arms a 400 ms search). | UNVERIFIED (runtime) | Static: the helper holds dismissal in `wireComboboxState` (`keydown` sets `dismissed = e.key === 'Escape'`, partial line 74, observer removes reappearing lists), see stamp for G1-65. Reproduce: type, press Escape, confirm the list is still gone at +660 ms on each of the five pages. | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-67 | site-wide §6 | `@import "g-dev-tools.scss"` ships debug styles to production; gate it. | OPEN | [verified 2026-10-17: `git show P:assets/scss/_g-dev-tools.scss \| grep -n '^\$'`; result: `$floating-breakpoints-bar: false` (line 16) and `$container-background-color: false` (line 54) guard every rule with `@if`, so by Sass semantics no dev CSS is emitted; the import at theme.scss:23 is still unconditional. The doc's premise "ships whatever debug styles" is weaker than stated; compiled CSS was not inspected (no build)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-68 | site-wide §6 | Two oversized catch-all SCSS files (`__portal-custom.scss` 1317, `_de-custom.scss` 993). | OPEN | [verified 2026-10-17: `git show P:assets/scss/<f> \| wc -l`; result: 1331 and 1142 lines; control: C0 `__portal-custom.scss` 1300] | production @ b8f4b32fbd |
| G1-69 | site-wide §6 | Bootstrap SCSS forked in-repo (~7K lines); prefer node_modules + variable overrides. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P assets/bootstrap/scss \| wc -l` = 89 files; `package.json` still lists `bootstrap ^4.3.1`] | production @ b8f4b32fbd |
| G1-70 | site-wide §6 | `!important` and inline `style=` are widespread (blocks strict CSP). | OPEN | [verified 2026-10-17: `git grep -h -o '!important' P -- assets/scss ':!assets/bootstrap' \| wc -l` = 106; `git grep -h -o 'style="' P -- themes \| wc -l` = 313] | production @ b8f4b32fbd |
| G1-71 | site-wide §7 | `package.json` had no `scripts` block (no build/lint/test). | FIXED | [verified 2026-10-17: `git show P:package.json \| sed -n 14,30p`; result: `lint`, `smoke`, `smoke:all`, `characterize*`, `docs-check` scripts; control: C0 package.json has 0 `"scripts"` matches] | production @ b8f4b32fbd |
| G1-72 | site-wide §7 (2026-08-19 correction) | The repo's ESLint config enables only `no-undef`, so it catches 1 of the 4 named bug shapes; `no-dupe-keys` is off. | OPEN | [verified 2026-10-17: `git show <ref>:eslint.config.mjs \| grep -n -E 'rules\|no-\|recommended'`; result: P one `no-undef` rule block, N two blocks (lines 88-89, 102-103), no `recommended`; the 4-bug probe was not rerun] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-73 | site-wide §7 (2026-07-23 update) | Lint covers only the SPA tree; no formatter, no tests, inline-JS layouts and theme partials unlinted; testing strategy undecided. | OPEN | [verified 2026-10-17: `lint` script is `eslint assets/js/data-explorer` on P (package.json:15), `... assets/js/nr-report` added on N; `git ls-tree -r --name-only P \| grep -i -E 'prettier\|editorconfig\|\.test\.\|\.spec\.'` returns nothing and package.json has no `test` script; control: the `eslint.config.mjs` and `lint` script hit, so the grep can fire] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-74 | site-wide §7 (deferred) | `npm run lint` is not enforced in CI. | OPEN | [verified 2026-10-17: `git grep -n -E 'npm run lint\|eslint' <ref> -- .github`; result: only `eslint.config.mjs` as a path trigger in smoke.yml:85 and site-characterization.yml:83 (and a template instruction doc), no lint step in any of the 9 workflows] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-75 | site-wide §7 (2026-08-19 update) | Smoke `PAGES` had no coverage for three of four `data-explorer-old` template kinds. | FIXED | [verified 2026-10-17: `git grep -n 'data-explorer-old' P -- scripts/smoke-pages.mjs`; result: PAGES entries at lines 52, 54, 57, 58 (single, section, data-index, indicator-catalog); control: `d763b09f57^` has no `data-explorer-old/data-index`, `d763b09f57` has 1; commit is an ancestor of P. The old tree publishes 76 pages, matching the doc] | production @ b8f4b32fbd |
| G1-76 | site-wide §7 (deferred) | No pre-commit lint hook; no classification sweep of ~40 DE `innerHTML` sinks. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P \| grep -c -i -E 'husky\|lint-staged\|pre-commit'` = 0 and package.json mentions neither; `git grep -h -o innerHTML P -- assets/js/data-explorer \| wc -l` = 46 against 5 `DOMPurify.sanitize` (control: 47 innerHTML on 7858735931)] | production @ b8f4b32fbd |
| G1-77 | site-wide §7 (workflow) | Actions pinned to mutable tags, not SHAs. | FIXED | [verified 2026-10-17: `git grep -n -E 'uses: [^ ]+@v[0-9]' P -- .github/workflows`; result: no hits; all `uses:` carry 40-char SHAs with `# vN` comments; control: `367aad8914^` hugo-build-to-prod-prod.yml:52 `uses: actions/checkout@v4`] | production @ b8f4b32fbd |
| G1-78 | site-wide §7 (workflow) | No `permissions:` block on the prod workflow. | FIXED | [verified 2026-10-17: `git show P:.github/workflows/hugo-build-to-prod-prod.yml \| sed -n 13,15p`; result: top-level `permissions: contents: write` exists in all four build workflows; it is workflow-wide write, not the doc's recommended top-level read with per-job write; control: `367aad8914^` shows no permissions line in that grep] | production @ b8f4b32fbd |
| G1-79 | site-wide §7 (workflow) | Build uses `npm install` (not `npm ci`) and no npm cache. | OPEN | [verified 2026-10-17: `grep -n -E 'npm (install\|ci)\|cache:' @P` on the four workflows; result: `npm install` in all four (prod-prod:78, any-branch:93, dev-stage:79, dev-prod:77); `cache: "npm"` in dev-stage and dev-prod only, absent in prod-prod and any-branch] | production @ b8f4b32fbd |
| G1-80 | site-wide §7 (workflow) | The build commits package files back to the repo via a third-party action. | OPEN | [verified 2026-10-17: `git show P:.github/workflows/hugo-build-to-prod-prod.yml \| sed -n 125,130p`; result: `elstudio/actions-js-build/commit@65bf468d...` step "Commit changes to package.json & package-lock.json" still present] | production @ b8f4b32fbd |
| G1-81 | site-wide §7 (workflow) | `dos2unix` at build time papers over CRLF/SRI; fix with `.gitattributes`. | OPEN | [verified 2026-10-17: `git show P:.gitattributes` fails (file absent); `dos2unix` steps at prod-prod:94-99, any-branch:109-114, dev-stage:95-100, dev-prod:93-98] | production @ b8f4b32fbd |
| G1-82 | site-wide §7 (workflow) | Four near-duplicate build workflows; extract a `workflow_call` reusable. | OPEN | [verified 2026-10-17: `git grep -c workflow_call P -- .github/workflows`; result: no hits; the four build workflows share the same step list per the stamps above] | production @ b8f4b32fbd |
| G1-83 | site-wide §7 (workflow) | `fetch-depth: 0` clones full history though only the last commit is used. | OPEN | [verified 2026-10-17: `grep -n fetch-depth @P` on the four workflows; result: `fetch-depth: 0` in all four (prod-prod:58); whether the commit-back step needs more was not tested] | production @ b8f4b32fbd |
| G1-84 | site-wide §8 | Nine `config.toml` files; verify each is a live deploy target and per-env files are thin. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P config` and `wc -l`; result: 9 files, env files 7-13 lines (thin), `_default` 141; `git grep -n -E -- '--environment' P -- .github/workflows` shows builds for prod_prod, dev_stage, dev_prod and any-branch input only; `production`, `development`, `local_*`, `prod_stage` have no workflow (local/dev use is by design per project CLAUDE.md)] | production @ b8f4b32fbd |
| G1-85 | site-wide §8 | `ignoreFiles = ['Simplified.Chinese','Spanish']` looks like a leftover that ignores translated content. | OPEN | [verified 2026-10-17: `git grep -n ignoreFiles P -- config` (config/_default/config.toml:13); `git ls-tree -r --name-only P content \| grep -c -E 'Simplified\.Chinese\|Spanish'` = 0; result: the entry matches no tracked content file, so it ignores nothing today; the doc's "ignores translated content" premise is not supported (es/zh content is `index.es.md`/`index.zh.md`)] | production @ b8f4b32fbd |
| G1-86 | site-wide §8, §10 (merged) | Mixed i18n: Hugo multilingual plus the Google Translate widget with a DOM-mutating SVG-removal hack (also an a11y/SEO weakness). | OPEN | [verified 2026-10-17: `git show P:themes/dohmh/layouts/partials/js_bottom.html \| sed -n 21,39p`; result: `googleTranslateElementInit`, "obliterate all google translate SVGs" querySelector hack at line 31, script at line 39; `[languages.en/es/zh]` at config/_default/config.toml:42,48,54. The a11y/SEO weakness is the doc's judgement, not measured] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-87 | site-wide §8 | `caches.getresource maxAge = -1` caches remote fetches forever. | OPEN | [verified 2026-10-17: `git grep -n maxAge P -- config`; result: `_default` -1; development, dev_prod, dev_stage, production, prod_prod, local_stage = 0; local_prod and prod_stage = -1 (the project CLAUDE.md says local_stage inherits; the file at config/local_stage/config.toml:9 sets 0)] | production @ b8f4b32fbd |
| G1-88 | site-wide §9 Bootstrap | Dev/local builds emit real GA events to the dev property (every env except `prod_prod`). | OPEN | [verified 2026-10-17: `git show P:...head.html \| sed -n 3,36p`; result: `if eq hugo.Environment "prod_prod"` loads G-64BWDRHRGB, `else` loads G-PB98MPZ31B for all other environments; no local/dev guard] | production @ b8f4b32fbd |
| G1-89 | site-wide §9 Bootstrap | The GA snippet is duplicated across the prod and dev branches. | OPEN | [verified 2026-10-17: same lines as G1-88; two identical inline blocks differing only in the measurement ID (head.html:8-15 and 23-30)] | production @ b8f4b32fbd |
| G1-90 | site-wide §9 | GA tracking has three competing implementations (guarded `sendAnalyticsEvent`, guarded `trackDataExplorerEvent`, raw `gtag`). | OPEN | [verified 2026-10-17: `git grep -c 'gtag(' <ref> -- assets themes content`; result: P raw gtag in data-explorer-old/app.js (12), measures.js (8), print.js (1), nr-output/single.html, nr-indicator-new/old.html, search-modal.html; main.js no longer has any; wrappers at site.js:58 and data-explorer/global.js:858; N drops the nr-* hits. The doc's "on production the new SPA wrapper is not live" correction is stale: DE reached production in #1462] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-91 | site-wide §9 taxonomy | `search` is three events: `search`, `search_click`, `click_search_open`. | OPEN | [verified 2026-10-17: `grep` result: `gtag('event','search'` search-modal.html:33; `sendAnalyticsEvent("search_click"` site.js:79 and `"click_search_open"` site.js:109] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-92 | site-wide §9 taxonomy | Inherited typo `click_how_caclulated`. | FIXED | [verified 2026-10-17: `git grep -n caclulated P -- assets themes content`; result: no hits; old explorer fires `click_how_calculated` (data-explorer-old/app.js:153), new explorer uses `trackDataExplorerEvent('click_about', {section:'how_calculated_and_sources'})` (app.js:715); control: `bc46f8c4ef^:assets/js/data-explorer/app.js:152` has `click_how_caclulated`; the rename is an ancestor of P] | production @ b8f4b32fbd |
| G1-93 | site-wide §9 taxonomy | Param casing inconsistent (`IndicatorID` vs snake_case). | OPEN | [verified 2026-10-17: `trackDataExplorerEvent('click_indicator', { IndicatorID: ... })` at data-explorer/topic-indicator-selector.js:618 and raw `gtag('event','click_indicator'` in data-explorer-old/app.js:191, alongside `file_name` etc.] | production @ b8f4b32fbd |
| G1-94 | site-wide §9 Privacy | No Consent Mode / cookie-consent gate on GA; disclosure in the NYC privacy policy unconfirmed. | OPEN | [verified 2026-10-17: `git grep -n -i -E "gtag\('consent'\|consent mode\|cookie-consent\|cookieconsent" P -- themes assets` = no hits; control: `git grep -c -i consent P -- documents` returns 1 file, so the grep can fire. Whether GA use is disclosed in the NYC policy is outside this repo and not checked (UNVERIFIED, other)] | production @ b8f4b32fbd |
| G1-95 | site-wide §10 | Three DE modals pointed `aria-labelledby` at ids that exist nowhere. | FIXED | [verified 2026-10-17: `grep -n -E 'topicSelectorLabel\|indicatorSelectorLabel' @P`; result: ids exist at header-de.html:300 and :370; `#learnMore` now `aria-labelledby="about"` with `id="about"` at header-de.html:418; control: `574e856432^` has 0 files defining the first two ids and aria refs to all three; fix is an ancestor of P. Side note: `id="about"` also exists on neighborhood-reports/section.html:87, a different page] | production @ b8f4b32fbd |
| G1-96 | site-wide §10 | A site-wide sweep for dangling `aria-labelledby` is still worth running. | OPEN | [verified 2026-10-17: Python pass `aria.py` over layouts (literal ids only, skips templated ones, JS-created ids not visible); result: P 12 dangling refs (data-explorer-old/single.html x8 `dropdown*`, healthy-homes.html `shoesDot`/`smokedectector_1Dot`, realtime.html `acc-button-3B`, neighborhood-reports/section.html `CCDModalLabel`), N 11 (same minus CCDModalLabel); some may be created at runtime; control: C0-parent of the `574e856432` fix flagged the 3 DE modals] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-97 | site-wide §10 | `href="#"` action links throughout the header should be buttons. | OPEN | [verified 2026-10-17: `git grep -c 'href="#"' P -- header.html header-de.html header-ds.html`; result: 9 / 12 / 0 (C0 header.html = 8)] | production @ b8f4b32fbd |
| G1-98 | site-wide §10 | Recommend axe/Lighthouse in CI over each template type. | OPEN | [verified 2026-10-17: `git grep -n -i -E 'axe\|lighthouse\|pa11y' P -- .github` = no hits; `scripts/nr-a11y-audit.mjs` is a manual audit, not wired to a workflow (control: `grep -c eslint` in .github hits)] | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-99 | site-wide §10a | `$primary` #008939 clears AA as text only on pure white (4.53) and fails on tinted backgrounds; fix is `$primary-dark` #007A31 for text. | FIXED | [verified 2026-10-17: sRGB relative-luminance script; result: reproduces the doc's table exactly (4.53/4.37/4.24/4.15/3.91 and 5.49/5.29/5.13/5.03/4.74); `git grep -n 'primary-dark' P -- assets/scss`: `$primary-dark: #007a31` (_a-global-variables.scss:92), used by `$accordion-title-color` (_f-layout-elements.scss:780), `a` and `.btn-report`/`.btn-light-green-bg`-style rules (theme.scss:40, 491; _de-custom.scss:167, 221, 233); control: `bb8dcc97d4` grep for `primary-dark` in assets/scss returns no hits.] Static assignment verified; rendered contrast depends on computed backgrounds (see G1-100) | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| G1-100 | site-wide §10a | Remaining rules that set the green as text were not checked against their backgrounds (`__portal-custom.scss` 201/204/1283 and others). | UNVERIFIED (runtime) | Static: [verified 2026-10-17: `git grep -n -i '#008939' P -- assets/scss`; result: text-colour uses remain at `__portal-custom.scss:209,212,1305` and `_de-custom.scss:771,776` (`!important`), same on N; the doc's 2026-08-21 note "`__portal-custom.scss` does not exist on this tree" is false on production today (file exists, 1331 lines).] Reproduce: on `/`, `/data-features/…` and an explorer page, read `getComputedStyle(el).color` and the composited background for each of those selectors and compute the ratio (large-text threshold 3:1, otherwise 4.5:1). | production @ b8f4b32fbd; #1491 @ d1c7402735 |

**2. Reconciliation (G1's)**

Headings in scope and row IDs:
- §1: G1-01, 02, 03, 04
- §2: G1-05 to G1-13
- §3: G1-14 to G1-19
- §3a: G1-19 (merged count and no-scanning correction), G1-20, G1-21, G1-22
- §4: G1-23 to G1-28
- §4a: G1-29, 30, 31
- §4b: G1-32
- §4c: G1-33
- §5 (intro bullets): G1-34 (double-fire), G1-35 (two idioms), G1-36 (crosswalks), legacy old-explorer bullet merged into G1-01
- §5a: G1-37 to G1-43 (G1-36 also covers the crosswalk file bullet)
- §5b: G1-44, G1-45
- §5c: G1-46 to G1-49
- §5d: G1-50, G1-51
- §5e: G1-52 (G1-54 for the old-explorer addendum)
- §5f: G1-53 (G1-54)
- §5g: G1-55
- §5h: G1-56 to G1-62 (G1-56 conflicts/resolution, 57 voice, 58 debugLog, 59 nr-topic-spa, 60 global.js, 61 site.js; "Resolved" subsection folded into G1-56)
- §5i: G1-62, G1-63
- §5j: G1-64
- §5k: G1-65, G1-66 (the aqe `aria-hidden` and missing-name follow-ups are §15.7/§15.8, outside scope)
- §6: G1-67 to G1-70
- §7: G1-71 to G1-83
- §8: G1-84 to G1-87
- §9 (Bootstrap): G1-88, G1-89; (Three competing implementations): G1-90; (Event-taxonomy): G1-34 (subscribe double-count, merged), G1-91, G1-92, G1-93; (Privacy): G1-94. The "Refactor summary" and the "new explorer mirrors old event names" bullet are recommendations with no separate defect: no finding.
- §10: G1-24 and G1-27 (nav list markup and title nesting, merged with §4), G1-95, G1-96, G1-97, G1-86 (Google Translate, merged with §8), G1-98; "Duplicate ids break aria-labelledby" is covered by G1-29 (merged, no separate row).
- §10a: G1-99, G1-100.

Total rows: 100. Status counts: OPEN 53, FIXED 24, BRANCH-SCOPED 3, OBSOLETE 4, UNVERIFIED (runtime) 12, UNVERIFIED (other) 1 (G1-57), plus G1-94 carries an (other) sub-claim in its evidence.

Merged or skipped: §3 "georaster in use" and §3a "recommended order" (statements, folded into G1-18/G1-22); the §1 "Refactor" rule paragraph (recommendation); §2 "Refactor" summary and "highest-leverage" style sentences (recommendations); §4 duplicate-`data-toggle` and site-title rows kept separate from the header-de extension; §5 "legacy data-explorer-old" bullet merged into G1-01; §5a items 3/4/step-2 "closed" bullets merged into G1-39/G1-40; §5h Stage 1-5 narrative of nr-topic-spa is one finding (G1-59); §9 `click_subscribe` double-count merged into G1-34; §10 duplicate-id bullet merged into G1-29. Not checked: any outside-world claims (RawGit shutdown date, Bootstrap 4 EOL date, NYC privacy-policy disclosure) were left as the doc's own, undated assertions.

Other discrepancy worth knowing: the #1491 worktree is at `00737207cb`, not `d1c7402735`; I read N only through git at `d1c7402735`.

**3. Duplicates noticed in other documents (G1's)**

- `<a><li>` in header-de.html and the doubled `class` etc. are also recorded in site-wide §15.3 (G1-27).
- Dependabot alerts and the stale "8 alerts" figure: the audit's own §15/CI sections and `documents/audit-backlog-production-2026-08-20.md` discuss workflow pinning and SHA pins (G1-77/78); `documents/js-conventions.md:415-417` still carries the PENDING `debugLog` marker that G1-58 says to drop.
- The flexdatalist wiring (G1-65/66) overlaps §15.7/§15.8/§15.9, outside my scope.
- The CLAUDE.md line "`<section id=\"skip-header-target\">` carries `data-pagefind-ignore=\"all\"`" on N: `git grep skip-header-target d1c7402735 -- themes` finds the id only in baseof.html, list.html and the header partials, not in nr-report.html. I did not follow this up; it may be a stale CLAUDE.md sentence on #1491 (the NR audit group should confirm).

### G2 — site-wide audit §11–§21 (production @ b8f4b32fbd; NR rows on #1491 @ d1c7402735)

Returned 2026-10-17 from the re-dispatch, 100 rows. It is pasted verbatim below, extracted from the agent's transcript by `extract_report.py`, apart from its title and section headings, which are dropped and demoted to labels. Its reconciliation's status counts agree with its table. Recounted with `tally.py`: OPEN 55, FIXED 29, UNVERIFIED (runtime) 12, OBSOLETE 2, UNVERIFIED (other) 2 = 100. No rows are duplicated or malformed.

**Tree caveat.** G2 says it read production through git at `b8f4b32fbd`, and most evidence cells name `$P` or `$N`. But a few commands ran on files in the `EH-dataportal.worktrees/production` checkout. That checkout's HEAD is `b8f4b32fbd`, while its working files are a pre-#1462 tree: 87 paths under `.github`, `themes`, `assets/js/data-explorer`, `config` and `package.json` differ from that commit. G2's "code equals production" check (`git diff --stat production HEAD`) compares two commits, so it could not see this. `[verified 2026-10-17: git diff --name-status b8f4b32fbd in that checkout]`
- **G2-61 (lint green)** ran `npx eslint` in that checkout. It was re-run in this worktree, whose code matches `b8f4b32fbd` (`git diff --stat b8f4b32fbd HEAD -- . ':!documents'` empty), and it holds. `[verified 2026-10-17: npx eslint assets/js/data-explorer, exit 0, no output, 16 files; control: a stdin snippet filed as assets/js/data-explorer/zz-control.js gives exactly one no-undef for an invented name and none for DE, so the cross-file global scan loaded]`
- **G2-02's** disk grep of `.github/workflows/*.yml` is unaffected, because no workflow file differs.
- Any other evidence cell that names a path with no ref may carry stale line numbers. Step 3 re-runs every foreclosing row through git, and Step 4 re-derives line numbers when it assigns `A-` IDs.

G2-19 has no pre-fix control. G2 says its control output was truncated. Step 3 supplies one.

All commands run 2026-10-17, read-only.
- Shorthand: `P=b8f4b32fbd` (production), `N=d1c7402735` (#1491).
- Every tree read goes through git. Production code was read as `git grep … $P` or `git show $P:…`; #1491 as `git grep … $N`.
- `git diff --stat production HEAD -- . ':!documents'` on the production worktree returned empty (code equals production).
- Throwaway scripts are in `C:/Users/Chris/AppData/Local/Temp/claude/audit-G2/`.

**1. Table (G2's)**

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G2-01 | site-wide §11 row 1 | `head.html` loaded point-in-polygon from shut-down `cdn.rawgit.com/hayeswise`. | FIXED | [verified 2026-10-17: `git grep -n rawgit $P -- themes/dohmh/layouts/partials/head.html`; result: no hits. `git grep -n rawgit $N -- …head.html` gives no hits either, so the NR-lineage note in the doc no longer holds on #1491. control: `git grep -n 'rawgit.com/hayeswise' f76c7827c4~1 -- …head.html` → hit at `:225`. Other rawgit OpenLayers tags are §5c, not G2.] | production @ b8f4b32fbd |
| G2-02 | site-wide §11 row 2 | CI workflows have unpinned actions and no `permissions:` block. | OPEN | [verified 2026-10-17: `grep -hn 'uses:' .github/workflows/*.yml \| grep -vE '@[0-9a-f]{40}'`; result: none, so pinning is done. `git grep -n 'permissions' $P -- .github/workflows/check-deploy.yml`; result: no hits (rc 1). Narrowed: `check-deploy.yml` is the only workflow with no `permissions:` anywhere in the file. control: same grep on `codeql.yml` → `:31`, and `hugo-build-to-prod-prod.yml` → `:13`.] | production @ b8f4b32fbd |
| G2-03 | site-wide §11 row 3 | `click_subscribe` analytics fired twice (`main.js` and `site.js`). | FIXED | [verified 2026-10-17: `git grep -n click_subscribe $P -- assets`; result: `site.js:101` emitter plus a comment at `main.js:97`; `6446199e3a` is an ancestor (exit 0). control: `git grep -n click_subscribe 6446199e3a~1 -- assets/js/main.js` → `main.js:14 gtag('event','click_subscribe'…)`.] | production @ b8f4b32fbd |
| G2-04 | site-wide §11 row 4 | `head.html` shipped Font Awesome as render-blocking JS and CSS. | FIXED | [verified 2026-10-17: `grep -n 'fontawesome\|all.min.js' head.html` at `$P`; result: only `all.min.css` at `:121-122`. control: `git log -S'all.min.js' -- head.html` → `cdee35702c "Drop the Font Awesome JS SVG-injector"`.] | production @ b8f4b32fbd |
| G2-05 | site-wide §11 row 5 | Production CSS is not minified (`head.html` `toCSS`). | OPEN | [deferred by decision: the doc records the user rejecting minification on 2026-07-14. verified 2026-10-17: `git grep -n toCSS $P -- …head.html` → `:139 $sass \| toCSS \| resources.Fingerprint "sha512"`, no `minify`.] | production @ b8f4b32fbd |
| G2-06 | site-wide §11 row 6 | nyc-lib CSS loaded twice and favicon `<link>` duplicated. | FIXED | [verified 2026-10-17: `head.html` has one `rel="icon"` (`:58`), and the nyc-lib CSS sits inside `{{- if .Params.mapLib }}` at `:105-107`. `git grep -n mapLib $P -- content` → `take-action/*.md`, `congestion-pricing-report/index.md`. control: commit `06c2f561b4 "Dedupe favicon and nyc-lib CSS in head.html"`.] | production @ b8f4b32fbd |
| G2-07 | site-wide §11 row 7 | Duplicate `data-toggle` attributes in `header.html`. | FIXED | [verified 2026-10-17: `python hdr.py b8f4b32fbd 9ae35c3e9a~1` (regex for a second `data-toggle` in one tag); result: 0 now. control: the same script on `9ae35c3e9a~1` → 3.] | production @ b8f4b32fbd |
| G2-08 | site-wide §11 row 8 | Site-title `<a>`/`<span>` nesting overlaps in `header.html`. | FIXED | [verified 2026-10-17: `hdr.py` title extract at `$P` → `<a …><span class="site-subtitle">…</span> <span class="site-title">Data Portal</span></a>`. control: at `d0fc7e1753~1` → `…Environment & Health</span> <span class="site-title">Data Portal</a></span>`.] | production @ b8f4b32fbd |
| G2-09 | site-wide §11 row 9 | `<a><li>` invalid list markup in `header.html`. | FIXED | [verified 2026-10-17: `hdr.py` counts `<a …>\s*<li` → 0 at `$P`. control: 6 at `d0fc7e1753~1`.] | production @ b8f4b32fbd |
| G2-10 | site-wide §11 row 10 | The webfont `range` loop in `head.html` was called dead; the row itself says NOT A DEFECT (claim retracted). | OBSOLETE | [verified 2026-10-17: `head.html:128-132` has `range $woff := $fa_woff … $woff.Publish`, the explicit-publish idiom the row says it was rewritten to. control: `git log -S'$woff.RelPermalink' -- head.html` → `cdee35702c`, the rewrite.] | production @ b8f4b32fbd |
| G2-11 | site-wide §11 row 11 | GA fired in dev/local environments. | FIXED | [verified 2026-10-17: `head.html:3 {{ if eq hugo.Environment "prod_prod" }}` wraps the GA block; `d4d633c0d8` is an ancestor (exit 0). control: `git log -S'eq hugo.Environment "prod_prod"' -- head.html` → `d4d633c0d8 "only log production events on prod_prod"`.] | production @ b8f4b32fbd |
| G2-12 | site-wide §11 row 12 | Misspelled GA event `click_how_caclulated`. | FIXED | [verified 2026-10-17: `git grep -n 'caclulated' $P -- assets themes`; result: no hits. The corrected name is at `assets/js/data-explorer-old/app.js:151,153`. The new `assets/js/data-explorer/app.js` has no such event; `:715` uses `click_about`. control: `git grep -c click_how_caclulated bc46f8c4ef~1 -- assets/js/data-explorer/app.js` → 2.] | production @ b8f4b32fbd |
| G2-13 | site-wide §11 row 13 | Datawrapper embeds in hidden Bootstrap tabs throw SVG-sizing console errors. | UNVERIFIED (runtime) | [static facts not checked beyond the doc: the row itself says "did not reproduce" under smoke. Repro: `npm run smoke` against `data-stories/housing/`, and `air-quality-snapshots`, `redlining`, `vectorborne-diseases-and-health`. Fails on a console error mentioning negative SVG width or height.] | production @ b8f4b32fbd |
| G2-14 | site-wide §11 row 14 | `data-stories/housing/index.es.md` income-level radio toggle gives a Datawrapper hidden-render warning. | UNVERIFIED (runtime) | [runtime-only claim (console warning). Repro: open `/es/data-stories/housing/`, click the income-level radio, read the console.] | production @ b8f4b32fbd |
| G2-15 | site-wide §11 row 15 | `robots.txt` had no body or `Sitemap:`. | FIXED | [verified 2026-10-17: `head -30 themes/dohmh/layouts/robots.txt` → production branch emits `User-agent: *`, `Disallow:` and `Sitemap: {{ "sitemap.xml" \| absURL }}`; `7b7d0e6deb` is an ancestor (exit 0). control: the preview branch of the same file still emits per-path `Disallow` lines.] | production @ b8f4b32fbd |
| G2-16 | site-wide §11 row 16 | `<html lang="en">` hardcoded in `baseof.html` and `list.html`. | FIXED | [verified 2026-10-17: `sed -n 2p` on both files at `$P` → `<html lang="{{ .Language.Lang }}" dir="ltr">`. control: `git show f697da1c81~1:…/baseof.html \| sed -n 2p` → `<html lang="en" dir="ltr">`.] | production @ b8f4b32fbd |
| G2-17 | site-wide §11 row 17 | Data Explorer content is client-rendered, so non-JS crawlers see placeholders (`de-indicator-info.html`). | OPEN | [verified 2026-10-17: `git show $P:…/de-indicator-info.html \| grep -n 'Loading indicator'` → `:17`, `:30`, `:42`, `:98`. Same finding as G2-31.] | production @ b8f4b32fbd |
| G2-18 | site-wide §11 row 18 | `#skip-header-target` duplicated on most pages. | FIXED | [verified 2026-10-17: `git grep -n 'id="skip-header-target"' $P -- themes content` → only `baseof.html:28` and `list.html:29`, both `tabindex="-1"`. control: `git grep -c … b8771726c9~1 -- themes` → 47 files.] | production @ b8f4b32fbd |
| G2-19 | site-wide §11 row 19 | Two `#dropdownMenuButton` and `#311`/`#311label` on every explorer page. | FIXED | [verified 2026-10-17: `git grep -nE 'id="(dropdownMenuButton\|311\|311label)"' $P -- themes/dohmh/layouts` → `heatstory.html`, `rmz.html`, `takeaction.html` only; none in `header-de.html` or `de-tab-button.html`. `f0a4f06611` is an ancestor. control: `git grep -n dropdownMenuButton f0a4f06611~1 -- …header-de.html …de-tab-button.html` was run, but its output was truncated in my capture and I did not re-read it, so there is no confirmed pre-fix hit; the ancestor check and the 0 now are the whole evidence.] | production @ b8f4b32fbd |
| G2-20 | site-wide §11 row 20 | Three DE modals had dangling `aria-labelledby`. | FIXED | [verified 2026-10-17: `header-de.html:291,358,405` reference `topicSelectorLabel`, `indicatorSelectorLabel` and `about`; targets exist at `:300`, `:370` and `:418`. `574e856432` is an ancestor. control: `git show 574e856432~1:…header-de.html` has `aria-labelledby="topicSelectorLabel"` at `:291` and 0 `id="topicSelectorLabel"`.] | production @ b8f4b32fbd |
| G2-21 | site-wide §11 row 21 | 4 of 8 open Dependabot alerts share a root in the `georaster@1.6.0` subtree. | UNVERIFIED (other) | [`georaster ^1.6.0` is in `package.json:45` and the lock has 1.6.0, but the attribution does not reproduce. `chain.py` walks lock dependencies from `node_modules/georaster` and `…/georaster-layer-for-leaflet`: 0 of the alerted packages are reachable, and the same result comes from the lock at `cef5aa1572` (date of the section). Repo has 25 open alerts now (`gh api repos/nychealth/EH-dataportal/dependabot/alerts?state=open`). Alert-to-subtree mapping cannot be checked from the repo.] | production @ b8f4b32fbd |
| G2-22 | site-wide §11 row 22 | Critical `decompress` alert via `hugo-extended`; CI pins Hugo via the setup action and never uses this package. | OPEN | [verified 2026-10-17: `gh api …/dependabot/alerts?state=open` → #87 and #97 `decompress` critical, runtime scope. `chain.py` shows `hugo-extended` reaches `decompress`. `package.json:62 "hugo-extended": "0.147.3"`. The "never used by CI" premise no longer holds: `smoke.yml:174` and `site-characterization.yml:186` run `npm ci` against the lockfile pinning it.] | production @ b8f4b32fbd |
| G2-23 | site-wide §11 row 23 | 3 high Vega XSS alerts ship via `lib-vega.html`. | OPEN | [verified 2026-10-17: `gh api …?state=open` → #42 `vega`, #39 `vega-expression`, #45 `vega-functions`, all high. `lib-vega.html:3-8` concatenates vega, vega-lite and vega-embed. `package.json:57 "vega": "^5.30.0"`; lock resolves `5.33.1`.] | production @ b8f4b32fbd |
| G2-24 | site-wide §12 Crawl directives, bullet 1 | `docs/robots.txt` is a gitignored leftover and the template emits a body only for non-production environments. | OBSOLETE | [verified 2026-10-17: `git show $P:.gitignore \| grep -n '^docs'` → `:19`. The template premise is gone: `robots.txt` now has a production branch with `Disallow:` and `Sitemap:` (see G2-25). control: preview-branch `Disallow` lines still in the file.] | production @ b8f4b32fbd |
| G2-25 | site-wide §12 Crawl directives, bullet 2 | Production `robots.txt` has no body and no `Sitemap:`. | FIXED | [verified 2026-10-17: `robots.txt` production branch emits `Sitemap: {{ "sitemap.xml" \| absURL }}` (same evidence as G2-15). The "unconditional on environment" instruction was rejected in the doc and not implemented. Outside-world claim (Google spec) not re-fetched.] | production @ b8f4b32fbd |
| G2-26 | site-wide §12 Crawl directives, bullet 3 | No explicit AI-crawler stance and no `llms.txt`. | FIXED | [verified 2026-10-17: `robots.txt` carries the "Decided 2026-08-05" allow-all comment above `User-agent: * / Disallow:`. `git grep -il 'GPTBot\|ClaudeBot\|Google-Extended' $P -- themes static data config .github` → none, as the decision intends. `git ls-tree -r --name-only $P \| grep -i llms` → none. The grep has no hit-control; a decision comment is documentation, not behaviour.] | production @ b8f4b32fbd |
| G2-27 | site-wide §12 Structured data | Theme had no JSON-LD. | FIXED | [verified 2026-10-17: `structured-data.html` emits `Organization`, `WebSite` and `BreadcrumbList` (`@type` at `:42`, `:62`, `:100`, `:112`, `:120`), included at `head.html:103`; `638379bd81` is an ancestor. The doc's 927-page count and Rich Results Test result were not re-run. control: `git grep -c 'ld+json' 638379bd81~1 -- themes` → none.] | production @ b8f4b32fbd |
| G2-28 | site-wide §12 Structured data (Dataset) | No `Dataset` JSON-LD. | OPEN | [deferred by decision: `structured-data.html:16-19` says `Dataset` is deliberately absent. verified 2026-10-17: `grep -n 'Dataset' structured-data.html` → comment only, no `@type` Dataset.] | production @ b8f4b32fbd |
| G2-29 | site-wide §12 Structured data (SearchAction) | `WebSite` has no `SearchAction`. | OPEN | [deferred by decision: `structured-data.html:52-58` records it as dropped because search is a modal, not a route. verified 2026-10-17: no `SearchAction` in the file.] | production @ b8f4b32fbd |
| G2-30 | site-wide §12 Structured data (logo) | `Organization` has no `logo`. | OPEN | [deferred by decision: `structured-data.html:26-29` explains why. verified 2026-10-17: no `logo` property emitted.] | production @ b8f4b32fbd |
| G2-31 | site-wide §12 DE invisible to non-JS crawlers (P1) | Explorer indicator UI server-renders only placeholders; real values arrive via JS after `metadata.json` loads. | OPEN | [verified 2026-10-17: `de-indicator-info.html` `Loading indicator…` at `:17`, `:30`, `:42`, `:98`. `de-indicator-names-pf.html:51-57` is the only static indicator text. `data-explorer/single.html:18` and `section.html:15` wrap the JS shell in `data-pagefind-ignore="all"`. The `d-none` topic text block exists at `single.html:67` and `section.html:47`. What a crawler receives is not re-fetched; static facts only.] | production @ b8f4b32fbd |
| G2-32 | site-wide §12 DE secondary defect 1 | One `<h1>` per bundled indicator, so multiple `<h1>` per page. | OPEN | [verified 2026-10-17: `git show $P:…/de-indicator-names-pf.html \| grep -n '<h1'` → `:51` inside `range $index, $id := $indicators`; included at `data-explorer/single.html:59`.] | production @ b8f4b32fbd |
| G2-33 | site-wide §12 DE secondary defect 2 | Those `<h1>`/`<h2>` are `display:none` for every visitor. | OPEN | [verified 2026-10-17: `de-indicator-names-pf.html:53,57 class="d-none"`.] | production @ b8f4b32fbd |
| G2-34 | site-wide §12 Meta-tag (lang) | `<html lang="en" dir="ltr">` hardcoded. | FIXED | [verified 2026-10-17: same as G2-16; both files emit `.Language.Lang`. control: `f697da1c81~1` has `lang="en"`.] | production @ b8f4b32fbd |
| G2-35 | site-wide §12 Meta-tag (robots) | Three `<meta name="robots">` tags stack on one response. | FIXED | [verified 2026-10-17: `git grep -n 'name="robots"' $P -- …head.html` → one tag at `:51`, value computed at `:44-49`; `f93c6324e1` is an ancestor. control: `f93c6324e1~1:head.html` has `<meta name="robots" …>` at `:27` and `:43`.] | production @ b8f4b32fbd |
| G2-36 | site-wide §12 Meta-tag (resources noindex) | `content/resources/` is noindexed everywhere while still listed in `sitemap.xml`. | OPEN | [deferred by decision: `head.html:39-42` records "stays noindex in production, decided 2026-08-21". The sitemap mismatch remains: `sitemap.xml` is `range .Data.Pages` with no noindex filter, and `git grep -in sitemap $P -- content/resources config` → no hits. `content/resources/` has 3 pages.] | production @ b8f4b32fbd |
| G2-37 | site-wide §12 Meta-tag (title) | `<title>` never includes the site name. | FIXED | [verified 2026-10-17: `head.html:71-77` appends ` – {{ .Site.Title }}` when `not .IsHome`; `f93c6324e1` is an ancestor. control: `f93c6324e1~1:head.html:64 <title>{{ block "title" . }}` with no suffix. Page counts not re-run.] | production @ b8f4b32fbd |
| G2-38 | site-wide §12 Meta-tag (vestigial) | Empty `geo.region` and hardcoded `fb:profile_id="0"` in `seo.html`. | FIXED | [verified 2026-10-17: `git grep -n 'geo.region\|fb:profile_id' $P -- themes`; result: none. `seo.html:3 canonical` and `:9 og:url` now use `.Permalink`. control: `git grep -n geo.region f010266500~1 -- themes` → `seo.html:4`; canonical there was `.RelPermalink`.] | production @ b8f4b32fbd |
| G2-39 | site-wide §12 Meta-tag (seo_description) | ~18% of content `.md` files have no `seo_description` override. | OPEN | [verified 2026-10-17: `git grep -L seo_description $P -- 'content/*.md' \| wc -l` → 121 of 635 `.md` (doc: 111 of 624). The doc's open question, whether any are indexable pages, is not answered.] | production @ b8f4b32fbd |
| G2-40 | site-wide §12 "looks like a bug but isn't" | `sitemap.xml:9-19` duplicate-looking `xhtml:link` block (self-referential hreflang) has no explanatory comment. | OPEN | [verified 2026-10-17: `git show $P:themes/dohmh/layouts/_default/sitemap.xml \| sed -n 1,25p`; result: two identical `xhtml:link` blocks at `:10-14` and `:15-19`, no comment. The hreflang-rule claim is outside-world and not re-fetched.] | production @ b8f4b32fbd |
| G2-41 | site-wide §13 Phase 0 item 2 | No `.gitattributes` LF rules; build workflows still run `dos2unix`. | OPEN | [verified 2026-10-17: `git ls-tree --name-only $P \| grep -i gitattributes` → none. `git grep -n dos2unix $P -- .github` → `hugo-build-any-branch.yml:109,113,114`, `hugo-build-to-dev-prod.yml:93`. The ls-tree grep has no positive control.] | production @ b8f4b32fbd |
| G2-42 | site-wide §13 Phase 0 item 3 | Build workflows use `npm install` rather than `npm ci` plus cache. | OPEN | [verified 2026-10-17: `git grep -n 'npm install' $P -- .github/workflows` → `hugo-build-any-branch.yml:93`, `…dev-prod.yml:77`, `…dev-stage.yml:79`, `…prod-prod.yml:78`. control: `smoke.yml:174` uses `npm ci`. Pinning and `permissions` are covered by G2-02.] | production @ b8f4b32fbd |
| G2-43 | site-wide §13 Phase 2 | The `data-explorer-old` trees (content, layouts, JS) await deletion. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only $P assets/js/data-explorer-old content/data-explorer-old themes/dohmh/layouts/data-explorer-old \| wc -l` → 90; `assets/js/data-explorer-old/` lists 10 files. The "~6,560 lines" figure was not recounted.] | production @ b8f4b32fbd |
| G2-44 | site-wide §13 Phase 2 | `*-old`/`*-new`/`*-2` partial pairs not swept. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only $P themes/dohmh/layouts/partials \| grep -E '(-old\|-new\|-2)\.html$'` → `featured-data-2`, `related-footer-old`, `nr-indicator-new`, `nr-indicator-old`. Whether each is still included was not traced. The doc's "dead `geography.js`/`_*.js`" part was not checked.] | production @ b8f4b32fbd |
| G2-45 | site-wide §14.1 | Same element carries two `class` attributes in templates. | FIXED | [verified 2026-10-17: `git grep -nE 'class="[^"]*"[^>]*[[:space:]]class="' $P -- themes/dohmh/layouts`; result: none. control: `git grep -nE 'class="text-black"[^>]*class="text-primary"' d0fc7e1753~1 -- themes` → `about/section.html:26`, `components.html:43,85`. Single-line regex; a tag split across lines would be missed. Content instances are G2-51.] | production @ b8f4b32fbd |
| G2-46 | site-wide §14.2 | Home page card images have no `alt`. | FIXED | [verified 2026-10-17: `index.html:190,208,227,248 <img class="card-img-top" … alt="">` now carry `alt`. The `<h3 class="card-title">` text sits inside the same `<a>`, so the link has a name. control: `d0fc7e1753~1:index.html:186,204` `<img class="card-img-top" src="…">` with no `alt`. The doc's suggested fix, naming the destination, was not what was done; accessible name not measured.] | production @ b8f4b32fbd |
| G2-47 | site-wide §14.3 | `.card-content.key-topics` and `.tab-key-topics` are defined and unused. | OPEN | [verified 2026-10-17: `git grep -nE 'key-topics\|tab-key-topics' $P -- assets/scss` → `theme.scss:391 .card-content.key-topics`, `_de-custom.scss:303 .tab-key-topics`. `git grep -n 'tab-key-topics' $P -- themes content` → none. control: `git grep -c 'tab-data' $P -- themes` → `index.html:3`, `components.html:2`.] | production @ b8f4b32fbd |
| G2-48 | site-wide §14.4 | Documented bare `hugo` build gives `noindex` and the dev GA property, because `head.html` branches on the environment name. | OPEN | [verified 2026-10-17: `readme-development.md:19` still says "simply enter the command `hugo`". `head.html:3` gates GA on `prod_prod`; `:44-49` sets `noindex, nofollow` when `ne hugo.Environment "prod_prod"`. `git rev-parse $P:config/production/config.toml $P:config/prod_prod/config.toml` → identical blobs. The documented `hugo --environment production` string is gone from the markdown docs. Build output not regenerated.] | production @ b8f4b32fbd |
| G2-49 | site-wide §14.4 (related) | `conditional-modal.html` branches on `production`, `development` and `data_staging`; no template includes it. | OPEN | [verified 2026-10-17: `…/conditional-modal.html` lines 8, 49, 74 test those names. `git grep -n conditional-modal $P -- themes content` outside the file → none. `git ls-tree -d --name-only $P config/` lists no `data_staging`.] | production @ b8f4b32fbd |
| G2-50 | site-wide §15.1 | Unclosed `<a>` splits the home page's featured-story link in two. | OPEN | [verified 2026-10-17: `git show $P:…/index.html \| sed -n 65p` → `<a href="{{ relURL .Params.featured_link }}" …>` opens inside `<div class="card content-card">`; `</a>` at `:98` follows the closing divs. Lines moved from the doc's `:62`/`:93`. The parser split and axe `link-name` were not re-run.] | production @ b8f4b32fbd |
| G2-51 | site-wide §15.2 | `<div class="tab-content" id="myTabContent" class="mb-4">` in three housing content files. | OPEN | [verified 2026-10-17: `git grep -n 'id="myTabContent" class="mb-4"' $P -- content` → `housing/index.md:610`, `index.es.md:389`, `index.zh.md:395` (doc: `:609`, `:388`, `:394`).] | production @ b8f4b32fbd |
| G2-52 | site-wide §15.3 (ul children) | `<hr>` and a bare `<a>` are direct children of `<ul>` in the header menus. | OPEN | [verified 2026-10-17: `hdr.py` stack-walk of `header.html` at `$P` → `hr` at 108, 111, 163, 267, 270, 322; `a` at 115 and 274, under `<ul>` opens at 103, 129, 262, 288. These match the doc's lines. control: at `d0fc7e1753~1` the same walk also lists the 6 `<a>` fixed by Task 4.] | production @ b8f4b32fbd |
| G2-53 | site-wide §15.3 (lang-select) | `.lang-select` is bound by both `main.js` and `site.js`, which may double-fire. | UNVERIFIED (runtime) | [static: `git grep -n lang-select $P -- assets/js` → `main.js:182 $('.lang-select').click(…)` and `site.js:86 classList.contains("lang-select")`. Repro: open any page, attach a `dataLayer` listener, click a language link, count events.] | production @ b8f4b32fbd |
| G2-54 | site-wide §15.4 | `og:image` and `twitter:image` are path-only. | OPEN | [verified 2026-10-17: `seo.html:13 {{ $image.RelPermalink }}` and `:20 relURL` (the `og:image` line was not fully re-read for the `else` branch). control: `canonical` and `og:url` are `.Permalink` at `:3` and `:9`.] | production @ b8f4b32fbd |
| G2-55 | site-wide §15.5 | `og:locale` hardcoded `en_us` on every page. | OPEN | [verified 2026-10-17: `seo.html:8 <meta property="og:locale" content="en_us" />`.] | production @ b8f4b32fbd |
| G2-56 | site-wide §15.6 | Commented-out `console.log` above the `gtag` call, and a copy-pasted `how calculated` banner above `#citeButton`. | OPEN | [verified 2026-10-17: the code is in `assets/js/data-explorer-old/app.js`, not `data-explorer/app.js`: `:151` commented `console.log`, `:153` `gtag`, `:157` banner `// how calculated` above `$('#citeButton')`. The new explorer's `app.js` has neither.] | production @ b8f4b32fbd |
| G2-57 | site-wide §15.7 | Whole neighborhood picker on `aqe.html` is inside `aria-hidden="true"`. | OPEN | [verified 2026-10-17: `git grep -n 'aria-hidden="true"' $P -- …data-features/aqe.html` → `:21 <div class="my-2" aria-hidden="true">`; the `#flex_search` input, `#clear` button and "About Neighborhood Tabulation Areas" link are its descendants (`sed -n 18,40p`). axe not re-run.] | production @ b8f4b32fbd |
| G2-58 | site-wide §15.8 (production call sites) | The flexdatalist input has no accessible name on indicator-catalog (`de-text-search.html`) and `hvi`. | OPEN | [verified 2026-10-17: `git grep -n labelledby $P -- …partials/de-text-search.html content/data-features/hvi themes/dohmh/layouts/data-features/hvi.html`; result: none. `de-text-search.html:69-77` only calls `wireComboboxState`. control: `$N:…/nr-neighborhood-picker-js.html:63` sets `aria-labelledby`. axe not re-run.] | production @ b8f4b32fbd |
| G2-59 | site-wide §15.8 (NR call sites) | Neither flexdatalist input has an accessible name on the NR topic landing pages. | UNVERIFIED (runtime) | [static: `git grep -n nr-search-label $N -- themes` → `nr-neighborhood-picker.html:43` (label) and `nr-neighborhood-picker-js.html:63 generated.setAttribute('aria-labelledby','nr-search-label')`, so the generated input is named. The authored `#flex_search` is relabelled away by the library (doc §15.8 note). axe not run on this tree. Repro: open `/neighborhood-reports/`, run axe `label`.] | #1491 @ d1c7402735 |
| G2-60 | site-wide §15.10 | `aria-hidden-focus` on the Leaflet UHF shapes of the NR picker map. | UNVERIFIED (runtime) | [static: `nr-neighborhood-picker.html:62 <div class="nr-selector-map … aria-hidden="true">`; `nr-leaflet.html:133-155 removeHiddenMapFromTabOrder()` sets `tabindex="-1"` on `a, path, [tabindex]` and the container when an `aria-hidden` ancestor exists. `nr-clickable-uhf` no longer occurs in `$N`. Whether axe `aria-hidden-focus` still fires is a runtime question. Repro: axe on `/neighborhood-reports/`. Production still has the old `nr-clickable-uhf` wrapper at `section.html:75`.] | #1491 @ d1c7402735 |
| G2-61 | site-wide §15.11 | `npm run lint` red: 5 implicit globals (`indicators`, `selectedDisparity`, `xValue`, `yValue`, `comp_group_col`). | FIXED | [verified 2026-10-17: `npx eslint assets/js/data-explorer` in the production worktree → rc 0, empty output. `git grep -nE '(let\|var\|const)[^;=]*\b(xValue\|yValue\|comp_group_col)\b' $P` → `correlate.js:448-449`, `trend.js:220`; `let indicators` at `topic-indicator-selector.js:17`; `selectedDisparity` is a field in `global.js:38`. control: `git grep -n comp_group_col 76ab3d793d -- assets/js/data-explorer/trend.js` → undeclared assignments at `:142,:183,:227`. No injected-undefined-name control was run.] | production @ b8f4b32fbd |
| G2-62 | site-wide §16.1 | Datawrapper inline runtimes share `window.dw`, so the first-loaded owns it. | UNVERIFIED (other) | [vendor-runtime behaviour measured in a browser on 2026-08-26 per the doc; not checkable from the repo. Repo-side fact: inline embeds remain (`git grep -ohE 'datawrapper\.dwcdn\.net/[A-Za-z0-9]+/embed\.js' $P -- content themes \| wc -l` → 177).] | production @ b8f4b32fbd |
| G2-63 | site-wide §16.2 | `heat-report-archive/2024/5-fig-3-4.md` embedded `a899A` inline. | FIXED | [verified 2026-10-17: `git grep -n a899A $P -- content` → `5-fig-3-4.md:7 <iframe title="Figure 3: …`. control: `git log -S a899A -- …5-fig-3-4.md` → `0194b1b8aa "Give figure 3 its own document…"`. The absence of runtime `3873ad67` in the parent was not re-measured.] | production @ b8f4b32fbd |
| G2-64 | site-wide §16.3 | 38 charts across 15 pages still inline with more than one runtime version. | OPEN | [deferred by decision: §16.3 "Deferred rather than done". verified 2026-10-17: inline embed.js refs in `content` and `themes` = 177 (doc: 151 inline; doc counted 173 inside `content` at its date by my control `git grep -ohE … 0194b1b8aa~1 -- content \| wc -l`). Mix of runtime versions per page was not re-fetched.] | production @ b8f4b32fbd |
| G2-65 | site-wide §17 table row 1 | `overlap-tool-with-map.html` fetches `CityCouncilDistrict.geojson` where `.topo.json` exists. | OPEN | [verified 2026-10-17: `git grep -n 'geojson' $P -- …overlap-tool-with-map.html` → `:71 …/geography/CityCouncilDistrict.geojson` (doc `:70`). Wire sizes not re-fetched.] | production @ b8f4b32fbd |
| G2-66 | site-wide §17 table row 2 | Same file fetches `CD.geojson`. | OPEN | [verified 2026-10-17: `…overlap-tool-with-map.html:66`.] | production @ b8f4b32fbd |
| G2-67 | site-wide §17 table row 3 | Same file fetches `UHF42.geojson` twice. | OPEN | [verified 2026-10-17: `…overlap-tool-with-map.html:76` and `:307 fetch(…/geography/UHF42.geojson)` (doc `:75`, `:283`).] | production @ b8f4b32fbd |
| G2-68 | site-wide §17 table row 4 | `rmz.js` fetches `rmz.geojson`. | OPEN | [verified 2026-10-17: `rmz.js:86 getGeoJSON('…/geography/rmz.geojson')` (doc `:81`). Property reads `OBJECTID`/`Label` at `:111,:113,:117,:176`.] | production @ b8f4b32fbd |
| G2-69 | site-wide §17 table row 5 | `neighborhood-rats.js` loads the bundle-local `rmz.geojson`. | OPEN | [verified 2026-10-17: `neighborhood-rats.js:8 var RMZgeojson = 'geojson/rmz.geojson'` (doc `:7`); `Label` read near `:134`.] | production @ b8f4b32fbd |
| G2-70 | site-wide §17 table row 6 | NR map code fetches the repo copy `static/geojson/UHF42.geojson` instead of the TopoJSON. | OPEN | [verified 2026-10-17: `$N:assets/js/nr-report/map.js:282 fetch(reportConfig.geojsonUrl)`, with `nr-report.html:314 geojsonUrl: relURL "geojson/UHF42.geojson"`; `nr-leaflet.html:45 fetch(relURL "geojson/UHF42.geojson")`. Both keep `filter: GEOCODE != 0` (`map.js:291`, `nr-leaflet.html:57`). Page count 258 not recounted.] | #1491 @ d1c7402735 |
| G2-71 | site-wide §17b | `rats-in-your-neighborhood/geojson/cd.geojson` is large and has no TopoJSON counterpart. | OPEN | [verified 2026-10-17: `git cat-file -s $P:content/data-features/rats-in-your-neighborhood/geojson/cd.geojson` → 3,856,875 B raw; `neighborhood-rats.js:7,298` load it. The 71-feature count and 1,408,488 wire figure not re-measured.] | production @ b8f4b32fbd |
| G2-72 | site-wide §17c | Large GeoJSON files with no counterpart (`greenspace`, `neighborhoods`, two `800m_*`, `fvi`). | OPEN | [verified 2026-10-17: `git cat-file -s` → 20,815,881 / 19,350,172 / 8,799,560 / 8,229,459 / 5,958,551 B, matching the doc's raw sizes exactly. Referenced by `heat-story/embed/config.js:214`, `proximity/proxConfig.js:52`, `fvi.js:289` (doc `:273`). Gzip sizes not re-derived.] | production @ b8f4b32fbd |
| G2-73 | site-wide §17c (unreferenced) | `neighborhoods.geojson` and `800m_BG_pct_walkable_ADA_subway.geojson` are referenced by no source file. | OPEN | [verified 2026-10-17: `git grep -n 'neighborhoods.geojson' $P -- . ':!documents' ':!scripts' ':!package-lock.json'` → none; same for `800m_BG_pct`. control: the same pathspec for `greenspace.geojson` → `config.js:214`. EHDP-data-side references cannot be seen from here.] | production @ b8f4b32fbd |
| G2-74 | site-wide §17d | `overlap-tool-with-map.html` hardcodes `refs/heads/production` in its data URLs. | OPEN | [verified 2026-10-17: `:66,:71,:76,:307` all contain `EHDP-data/refs/heads/production/geography/`.] | production @ b8f4b32fbd |
| G2-75 | site-wide §18 / §18a | NR report map flies to the selected neighborhood, leaving most polygons unclickable by pointer. | FIXED | [verified 2026-10-17: `git show $N:assets/js/nr-report/map.js \| grep -n 'flyToBounds'` → none; `:302-307` sets `zoomSnap = 0` and `fitBounds(uhfLayer.getBounds(), {padding:[10,10]})`; `selectLayer` at `:78` has no zoom parameter; `c1b5d17061` is an ancestor of `$N`. `nr-leaflet.html:99` still flies, as the doc intends. control: `git grep -n flyToBounds c1b5d17061~1 -- assets/js/nr-report/map.js` → `:70`. The 41-of-42 reachability count is a runtime measurement and was not re-run.] | #1491 @ d1c7402735 |
| G2-76 | site-wide §18a (Rockaways) | Thin-arc Rockaways polygon unreachable even in the fitted arm (bbox centre falls on the container). | UNVERIFIED (runtime) | [runtime hit-test finding. Repro: Playwright `elementFromPoint` at the bbox centre of the Rockaways layer on `/neighborhood-reports/bayside_little_neck/asthma_and_the_environment/`.] | #1491 @ d1c7402735 |
| G2-77 | site-wide §19 / §19a | `vegaEmbed(...).then()` has no rejection handler in `nr-report/chart.js`. | FIXED | [verified 2026-10-17: `git show $N:assets/js/nr-report/chart.js \| grep -n '.catch\|Unable to render'` → `:200 vegaEmbed(…).then(` … `:208 }).catch(err => {` … `:220 container.innerHTML = '<p …>Unable to render chart.</p>'`; `815302db2f` is an ancestor. control: `git grep -nc '\.catch' 815302db2f~1 -- assets/js/nr-report/chart.js` → none, with `vegaEmbed` at `:200`. The forced-rejection browser table was not re-run.] | #1491 @ d1c7402735 |
| G2-78 | site-wide §20.1 | `restaurant-grades.html` and `restaurants.html` render the title as `<h2>`, so their pages have no `<h1>`. | OPEN | [verified 2026-10-17: `git grep -n '<h1\|<h2.*Title' $P -- …restaurant-grades.html …restaurants.html` → `:22 <h2>{{ .Title }}</h2>` in both, no `<h1>`. The three content pages are `draft: true` (`index.md:4`); `git grep -c '^# '` on them → none. control: `asthma-syndrome.html:21 <h1 class="h2" …>`.] | production @ b8f4b32fbd |
| G2-79 | site-wide §21 #9 | "About the data" keeps the last trend, correlate or disparities text after switching back to Bar or Table. | UNVERIFIED (runtime) | [static: `renderAboutSources` at `global.js:366`, called from `measures.js:1408,1682,1759` and `disparities.js:168`; no call from the bar or table render paths found. Repro: asthma `?id=2380`, open Trend, switch to Bar, read the About section.] | production @ b8f4b32fbd |
| G2-80 | site-wide §21 #13 | Table stops following the map after a Measure change or Back, while the summary reads "Synced". | UNVERIFIED (runtime) | [trace-only in the source. Repro: change Measure so time or geography moves, then check the table filters and the "Synced" summary.] | production @ b8f4b32fbd |
| G2-81 | site-wide §21 #14 | Area search box keeps its text after a rebuild but the filter is gone; `tableAreaSearchValue` never reset. | UNVERIFIED (runtime) | [the "never reset" premise is false as written: `table.js:266-277 clearTableAreaSearch()` sets `DE.table.tableAreaSearchValue = ''`, called from `menu.js:301-302`. Whether the rebuild path calls it needs a trace or run. Repro: type in the Area search, change the geography dropdown, compare box text and row filter.] | production @ b8f4b32fbd |
| G2-82 | site-wide §21 #15 | Generic "based on small numbers" note can print twice (`getDisplayNotes` maps without dedupe). | OPEN | [verified 2026-10-17: `global.js:1003-1016 function getDisplayNotes(notes){ return notes.map(…) }`, with no dedupe; callers `bar.js:79`, `correlate.js:521`, `trend.js:189`. The indicator 2383 repro was not run.] | production @ b8f4b32fbd |
| G2-83 | site-wide §21 #19 | "Download data" and "Sync to map" are `href="#"` links without `preventDefault`. | FIXED | [verified 2026-10-17: `de-tab-content.html:140,209,237 onclick="downloadData(); return false;"`; `table.js:514-515` `event.preventDefault()` in the sync handler; `fe5eb17dec` and `180ce62696` are ancestors. control: `git grep -n 'downloadData()' fe5eb17dec~1 -- …de-tab-content.html` → `:140,:237` without `return false`. In-browser history behaviour not re-run.] | production @ b8f4b32fbd |
| G2-84 | site-wide §21 #21 | "More info about {topic}" renders `.Params.azlink` without a `with` guard. | OPEN | [verified 2026-10-17: `header-de.html:423 <li><a href="{{ .Params.azlink }}" …>More info about {{ .Title }}</a></li>`; no `with`. Which topics lack `azlink` not checked.] | production @ b8f4b32fbd |
| G2-85 | site-wide §21 #22 | Dead SCSS in `_de-custom.scss` (`.de-wrapper .de-wrapper`, modal rules scoped to `.de-wrapper` while modals sit outside it). | UNVERIFIED (runtime) | [static: `_de-custom.scss:546-549 .de-wrapper { padding-bottom: calc(56px + env(…)) }` inside a media block; `:396,:403,:428 .de-wrapper .indicator-selector-*`. The compiled selectors need the built CSS. Repro: build `prod_prod`, grep the compiled CSS for `.de-wrapper .de-wrapper`.] | production @ b8f4b32fbd |
| G2-86 | site-wide §21 #26 | `#map role="img"` wraps focusable links (the sr-only "View this data as a table" link), failing axe `nested-interactive`. | UNVERIFIED (runtime) | [static: `data-explorer/single.html:30 <div id="map" role="img" aria-label="…">` with the link at `:32`. axe not run. Repro: axe on asthma `?id=2380`, rule `nested-interactive`.] | production @ b8f4b32fbd |
| G2-87 | site-wide §21 #27 | `#tableFilterToggle` is a focusable button nothing binds to. | OPEN | [verified 2026-10-17: `git grep -n tableFilterToggle $P -- assets themes` → `_de-custom.scss:684`, `de-tab-content.html:31` (CSS) and `:151` (button); no JS reference. Inline `<script>` blocks in layouts are covered by `themes`.] | production @ b8f4b32fbd |
| G2-88 | site-wide §21 #28 | "Recently updated" icon has both `aria-hidden="true"` and `aria-label`. | OPEN | [verified 2026-10-17: `topic-indicator-selector.js:547-550` sets `aria-hidden`, `aria-label` and `title` on the same `<i>`.] | production @ b8f4b32fbd |
| G2-89 | site-wide §21 #11 | Correlate CSV `Value_1_Indicator`/`Value_2_Indicator` swapped when `SecondaryAxis` is `'y'`. | OPEN | [verified 2026-10-17: `correlate.js:769 value1Indicator: \`${yIndicatorName} - ${yMeasure} ${yDisplay}\``, passed to `buildLinksDownloadTable` (`global.js:849`). `correlate.js:491` sets `xValue = 'Value_1'` in the `'y'` case, so Value_1 is the x series there while its label uses the y name. The 391-of-745 count was not re-derived.] | production @ b8f4b32fbd |
| G2-90 | site-wide §21 #17 | When correlate and disparities both fail, the previous chart stays up. | UNVERIFIED (runtime) | [the doc says the reviewer found no live trigger; not traced. Repro: force both renderers to throw (stub the fetch) and check the chart pane.] | production @ b8f4b32fbd |
| G2-91 | site-wide §21 #12 | UHF33 and National rows have no area name and cannot be selected; `GEO_RANK_BY_PRETTY_TYPE` ranks neither. | OPEN | [verified 2026-10-17: `global.js:491-504` lists Citywide, Borough, NYCKIDS, UHF34, UHF42, Subboro, CD, CDTA, PUMA, NTA, NYHarbor, RMZ; no UHF33 or National. The `GeoLookup.json` half needs EHDP-data and was not checked.] | production @ b8f4b32fbd |
| G2-92 | site-wide §21 #32 | `global.js` says callers pass `getDisplayNotes` "already-deduped" notes. | OPEN | [verified 2026-10-17: `global.js:411` comment "Callers pass an already-deduped `notes` array"; `getDisplayNotes` itself does not dedupe (see G2-82).] | production @ b8f4b32fbd |
| G2-93 | site-wide §21 #33 | `structured-data.html` says the search modal is in `footer.html` and describes the deleted `/search-results/` layout. | OPEN | [verified 2026-10-17: `structured-data.html:54` cites `partials/footer.html`; `baseof.html:33` includes `search-modal.html`; `git ls-tree -r --name-only $P themes \| grep -i search-results` → none.] | production @ b8f4b32fbd |
| G2-94 | site-wide §21 #34 | `print.js` header says maps export "by compositing the current Leaflet DOM". | OPEN | [verified 2026-10-17: `print.js:7` carries the comment. The `print-map.js` off-screen-map claim not re-read.] | production @ b8f4b32fbd |
| G2-95 | site-wide §21 #35 | Stale comments in `measures.js`, `data.js` and `de-tab-content.js`. | OPEN | [verified 2026-10-17: `de-tab-content.js:10 "guarded so load order never matters"` and `data.js:252 "IndicatorID comes in as  a string"` both present. The `measures.js` comment was not identified. Comments are claims; whether each is stale was not judged.] | production @ b8f4b32fbd |
| G2-96 | site-wide §21 #36 | `de-chooser.html` is included nowhere. | OPEN | [verified 2026-10-17: `git grep -nE 'de-chooser(\.html)?"' $P -- themes content`; result: no hits; the partial is in the tree (`ls-tree`). control: `git grep -n de-chooser-accordion $P` → `data-explorer-old/section.html:32`. Unquoted includes (a variable-built name) could be missed.] | production @ b8f4b32fbd |
| G2-97 | site-wide §21 #37 | `de-topic-indicators.html` and `de-indicator-names-pf.html` match the substring `/data-explorer`, which also matches `/data-explorer-old/`. | OPEN | [verified 2026-10-17: `de-topic-indicators.html:25` and `de-indicator-names-pf.html:33` contain `strings.Contains .RelPermalink "/data-explorer"`; `data-explorer-old/single.html:1079` includes `de-indicator-names-pf`.] | production @ b8f4b32fbd |
| G2-98 | site-wide §21 #38 | A `console.log` in `data-explorer/section.html`. | OPEN | [verified 2026-10-17: `section.html:83 console.log("* section.html [document.ready]")`.] | production @ b8f4b32fbd |
| G2-99 | site-wide §21 #39 | Duplicated `.nav-pills` block in `_de-custom.scss` carrying `#007bff`. | OPEN | [verified 2026-10-17: `git grep -n 007bff $P -- assets/scss/_de-custom.scss` → `:856,:861,:877,:882`; `sed -n 850,884p` shows the active and active:hover rules twice. Contrast ratio and specificity not re-measured.] | production @ b8f4b32fbd |
| G2-100 | site-wide §21 (coverage gap) | CI smoke and characterization load explorer topic pages without `?id=`, so CI exercises no indicator rendering. | FIXED | [verified 2026-10-17: `git grep -n collectExplorerIndicatorPaths $P -- scripts` → `site-urls.mjs:150`, `smoke-pages.mjs:31`; `smoke.yml:482 node scripts/smoke-pages.mjs --all`; `fab8d54c0f` is an ancestor. control: `git grep -c collectExplorerIndicatorPaths fab8d54c0f~1 -- scripts` → none. Smoke only: `site-characterization.mjs:197` still has a single `?id=2380` path, as the doc states.] | production @ b8f4b32fbd |

**2. Reconciliation (G2's)**

**§11:** rows 1–23 → G2-01…G2-23 (row N = G2-N).

**§12:**
- Crawl directives → G2-24, 25, 26.
- Structured data → G2-27, 28, 29, 30.
- The Data Explorer's real content is invisible → G2-31, 32, 33 (the "addressability already exists" bullet is a supporting claim, not a finding).
- Meta-tag correctness → G2-34 (lang), 35 (robots), 36 (resources noindex), 37 (title), 38 (vestigial), 39 (seo_description).
- One thing that looks like a bug but isn't → G2-40.
- The closing "Refactor summary" and "Status of this summary" restate earlier items: no finding.

**§13:**
- Phase 0 → G2-41 (.gitattributes/dos2unix), G2-42 (npm ci/cache). Pin and `permissions` duplicate §11 row 2 (G2-02). Items 1 and 4 (lint partly done; testing strategy) are goals, not concrete defects: no finding.
- Phase 1 and 1.5 → restate rows already covered (§11/§12): no finding.
- Phase 2 → G2-43, 44. The "geo crosswalks from JS to data/" part: no finding, since it is not a located defect.
- Phases 3 and 4 name no concrete located defect: no finding.

**§14:** 14.1 → G2-45; 14.2 → G2-46; 14.3 → G2-47; 14.4 → G2-48, G2-49 (the `conditional-modal.html` sub-claim).

**§15:**
- 15.1 → G2-50. 15.2 → G2-51. 15.3 → G2-52 (ul children), G2-53 (`.lang-select`).
- 15.4 → G2-54. 15.5 → G2-55. 15.6 → G2-56. 15.7 → G2-57.
- 15.8 → G2-58 (production), G2-59 (#1491).
- 15.9 → no finding (the doc says "not a defect").
- 15.10 → G2-60. 15.11 → G2-61.

**§16:** 16.1 → G2-62; 16.2 → G2-63; 16.3 → G2-64.

**§17:**
- Table rows 1–6 → G2-65…G2-70. The NDHR paragraph is not this document's: no finding.
- 17a → no finding. It records swap costs, not defects, and its `lib-topojson.html` correction is confirmed (`themes/dohmh/layouts/partials/lib-topojson.html` exists). The 43rd-feature filter is present on #1491 at `map.js:291` and `nr-leaflet.html:57`.
- 17b → G2-71. 17c → G2-72, G2-73. 17d → G2-74.

**§18 / 18a:** → G2-75, G2-76 (Rockaways residual).
**§19 / 19a:** → G2-77.
**§20 / 20.1:** → G2-78.

**§21:**
- The 21 listed items → G2-79 (#9), 80 (#13), 81 (#14), 82 (#15), 83 (#19), 84 (#21), 85 (#22), 86 (#26), 87 (#27), 88 (#28), 89 (#11), 90 (#17), 91 (#12), 92 (#32), 93 (#33), 94 (#34), 95 (#35), 96 (#36), 97 (#37), 98 (#38), 99 (#39).
- The coverage-gap paragraph → G2-100.
- The section text says "The 20 below"; it actually lists 21.

**Total rows: 100.**

**Merged or skipped:**
- §18 and §18a are one row (G2-75), as are §19 and §19a (G2-77), because the source treats each fix as the same finding.
- §17a, §15.9 and the §12/§13 summary paragraphs produced no rows (reasons above).
- §13 items 1 and 4 and Phases 3–4 produced no rows.

**Status count, derived by counting the rows above:**
- FIXED (29): 01, 03, 04, 06, 07, 08, 09, 11, 12, 15, 16, 18, 19, 20, 25, 26, 27, 34, 35, 37, 38, 45, 46, 61, 63, 75, 77, 83, 100.
- OBSOLETE (2): 10, 24.
- BRANCH-SCOPED (0).
- UNVERIFIED (runtime) (12): 13, 14, 53, 59, 60, 76, 79, 80, 81, 85, 86, 90.
- UNVERIFIED (other) (2): 21, 62.
- OPEN (55): 02, 05, 17, 22, 23, 28, 29, 30, 31, 32, 33, 36, 39, 40, 41, 42, 43, 44, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 78, 82, 84, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99.
- Check: 29 + 2 + 0 + 12 + 2 + 55 = 100.
- OPEN rows that are deferrals by decision: G2-05, 28, 29, 30, 36, 64.

**Caveat on G2-19:** its evidence is the "0 now" grep plus the ancestor check. The pre-fix control grep I ran had its output truncated in my capture, so I have no confirmed pre-fix hit for it.

**3. Duplicates noticed (G2's)**
- G2-16 and G2-34 are the same finding (`<html lang>`) in §11 row 16 and §12; G2-15 and G2-25 (robots.txt) likewise.
- G2-17 and G2-31 are the same finding (§11 row 17 and §12).
- G2-02 (CI pinning/permissions) overlaps §7 Build & CI, which is outside my scope.
- G2-21, 22 and 23 duplicate §3a Dependabot triage.
- G2-13 and 14 duplicate §5b.
- G2-56, 57 and 58 overlap §5k, which is outside this group.
- G2-61 overlaps §7 and §13 on lint.
- G2-82 and G2-92 are the same defect (§21 #15 and #32; the doc says "Fix with #32").
- The `how calculated` analytics rows (G2-12, G2-56) also appear in §9 Analytics.
- G2-75 and G2-77 are mirrored by NDHR-side fixes, which are not in this document.

### G3 — DE fresh audit, DE deep audit, consolidated improvements 04-18 (production @ b8f4b32fbd)

Returned 2026-10-17 from the re-dispatch, 144 rows, pasted verbatim below apart from its title and section headings, which are dropped and demoted to labels. G3 read production through `git grep`/`git show` at `b8f4b32fbd`. Its scope is the data explorer, so no row reads #1491. **Its reconciliation's FIXED and OPEN counts are wrong** (it gives 100 and 40). Its OPEN list expands to 34 IDs, and its FIXED range `G3-40..G3-51` takes in G3-43, which the table marks OPEN. Recounted from the table with `tally.py`, which splits cells on unescaped pipes only: FIXED 106, OPEN 34, UNVERIFIED (unqualified) 2, UNVERIFIED (runtime) 1, OBSOLETE 1 = 144. No rows are duplicated or malformed. The table is authoritative wherever the two disagree.

Legend. All rows: Tree = `production @ b8f4b32fbd` (read via `git grep`/`git show` against that commit; the audit worktree's code matches it). Shorthand in Evidence: `gg` = `git grep -n -E`; **P** = `b8f4b32fbd`; **B** = `81d86b5f1b` (= `git rev-list -1 --before=2026-07-13 feature-new-data-explorer`, the tree the fresh audit described, before Tier 1); **D** = `de8464ba2d^` (tree before the 2026-06-28 deep-audit quick-fix commit); all `[verified 2026-10-17: ...]`. `data-explorer-old/` assets and layouts exist on P (`git ls-tree P assets/js/data-explorer-old/ themes/dohmh/layouts/data-explorer-old/` lists 10 and 4 files). Every commit hash cited as a fix was checked with `git merge-base --is-ancestor <hash> P` (exit 0): 3427ebb1aa a598e8b892 068ed473da 5b789f1788 3cddd6e4d2 0ddf4248bb 9b758fe47c afc7f7893c 0b1130b8b3 35fb9c5235 d5fb2ea700 f1d0150ca3 a5bba916ca 55e59da7dc 62f9bc8798 a904b3efab de8464ba2d 1fb4d56479 a411b1692f 3dbc31151d 574e856432 f963da0612 d3ed6ed93f befc1b2218 b9307dc74c fd590ab479 47ffb33fde. Live data claims were checked against EHDP-data `production` `indicators/metadata/metadata.json` fetched today with `gh api` (267 indicators, 731 measure IDs; the docs' 282 count is from July).

**1. Table (G3's)**

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G3-01 | DE fresh 1.1 | `table.js` declares `type: 'natural'` but the new explorer never loaded `naturalSort.js`, so string sort was used. | FIXED | [verified 2026-10-17: `gg 'naturalSort' P -- themes/dohmh/layouts/data-explorer` ; result: `single.html:83-91` loads `js/naturalSort.js` with integrity; `table.js:735` still declares the type; control: same gg at B → no hit in `data-explorer/` (only the old explorer loaded it)] | production @ b8f4b32fbd |
| G3-02 | DE fresh 1.2 | `select: true` in DataTables options is inert (Select extension absent). | FIXED | [verified 2026-10-17: `gg 'select: true' P -- assets/js/data-explorer/table.js` ; result: no hit; control: same at B → `table.js:636: select: true,`] | production @ b8f4b32fbd |
| G3-03 | DE fresh 1.3 | `trend.js` percentile guard used `'Percentile'` (capital P) unlike the other five copies. | FIXED | [verified 2026-10-17: `gg "includes\('[Pp]ercentile'\)" P -- assets/js/data-explorer` ; result: one hit, `global.js:702` (the shared `resolveMeasureDisplay`, lower-case); control: same at B → 6 hits incl. `trend.js:221` with `'Percentile'`] | production @ b8f4b32fbd |
| G3-04 | DE fresh 1.4 | `DE.lookups.measureAbout`/`measureSources` are write-only dead state (`measures.js`, `global.js`). | FIXED | [verified 2026-10-17: `gg 'measureAbout\|measureSources' P -- assets/js/data-explorer` ; result: no hit; control: same at B → `global.js:140-141`, `measures.js:441-442,516-517`] | production @ b8f4b32fbd |
| G3-05 | DE fresh 1.5 (map.js) | `map.js` had unused `resetHighlight`, unused `let currentlyHighlighted`, and `calculatePercent` destructured but unused at the renderer call sites. | FIXED | [verified 2026-10-17: `gg 'currentlyHighlighted' P -- assets/js/data-explorer/map.js` ; result: no hit; `resetHighlight` is now called (`map.js:822,857`); `calculatePercent` appears only at `map.js:301,326,331` (defined, used, returned), no call-site destructuring; control: B `map.js:365` "Unused — superseded" `resetHighlight` and `:458` `let currentlyHighlighted`] | production @ b8f4b32fbd |
| G3-06 | DE fresh 1.5 (global.js) | `global.js` kept a commented-out `renderTitleDescription`. | FIXED | [verified 2026-10-17: `gg 'renderTitleDescription' P -- assets/js/data-explorer` ; result: no hit; control: B `global.js:306`] | production @ b8f4b32fbd |
| G3-07 | DE fresh 1.5 / consolidated #26 | `copyCitation` builds and selects a throwaway `<textarea>` that `clipboard.writeText` never uses. | FIXED | [verified 2026-10-17: `gg "createElement\('textarea'\)\|execCommand" P -- assets/js/data-explorer` ; result: no hit; `global.js:324` uses `navigator.clipboard.writeText(citeText).then(...)`; control: B `global.js:258` `createElement('textarea')`] | production @ b8f4b32fbd |
| G3-08 | DE fresh 1.5 (download) | `downloadData` ended `hiddenElement.download = …,` (comma operator) before `.click()`. | FIXED | [verified 2026-10-17: `git grep -n -A2 'hiddenElement.download' P -- assets/js/data-explorer/global.js` ; result: `:991 … + '.csv';` then `:992 hiddenElement.click();`; control: B `:653` ends with `,`] | production @ b8f4b32fbd |
| G3-09 | DE fresh 1.5 (311.js) | `311.js` had a `.then()` that only returned its input. | FIXED | [verified 2026-10-17: `git show P:assets/js/data-explorer/311.js \| sed -n 25,35p` ; result: chain is `loadOnce(crosswalkUrl, …).then((crosswalk) => …)`, no passthrough `.then`; control: `git show B:…/311.js \| sed -n 22,28p` shows `.then(async data => { return data; })`] | production @ b8f4b32fbd |
| G3-10 | DE fresh 1.5 (aliases) | `updateLinksSelectionSummary` duplicates `updateLinksDropdownToggle`; `getActiveTrendMeasureId` duplicates `getSyncedTrendMeasureId`. | FIXED | [verified 2026-10-17: `gg 'updateLinksDropdownToggle\|getSyncedTrendMeasureId' P -- assets/js/data-explorer` ; result: no hit; one name each remains (`measures.js:730`, `:1013`); control: B `measures.js:672,1046` both pairs present] | production @ b8f4b32fbd |
| G3-11 | DE fresh 1.5 (geoTypes) | `geoTypes` array duplicated `GEO_RANK_BY_PRETTY_TYPE`'s keys. | FIXED | [verified 2026-10-17: `gg 'const geoTypes' P -- assets/js/data-explorer/global.js` ; result: `:513 const geoTypes = Object.keys(GEO_RANK_BY_PRETTY_TYPE);`; control: B `:423 const geoTypes = [`] | production @ b8f4b32fbd |
| G3-12 | DE fresh 1.6 | `ci` (^2.3.0) is an unused dependency in `package.json`. | FIXED | [verified 2026-10-17: `git show P:package.json \| grep -n '"ci"'` ; result: no hit; control: same on B → `20: "ci": "^2.3.0",`] | production @ b8f4b32fbd |
| G3-13 | DE fresh 1.6 | `head.html` shipped the unused `leaflet-control-geocoder` script on every data-library page (package to be kept). | FIXED | [verified 2026-10-17: `gg 'geocoder' P -- themes/dohmh/layouts/partials/head.html` ; result: no hit; `package.json:50` still lists the package (as decided); control: B `head.html:226-227`] | production @ b8f4b32fbd |
| G3-14 | DE fresh 1.6 | `head.html:230` loaded the RawGit PointInPolygon CDN script (RawGit shut down 2019). | FIXED | [verified 2026-10-17: `gg 'rawgit\|PointInPolygon' P -- themes/dohmh/layouts/partials/head.html` ; result: no hit; control: B `head.html:230`. Other RawGit OpenLayers tags (`rats-in-your-neighborhood.html:219`, `rats-in-your-neighborhood-nyc-lib.html:99`, `take-action/email-electeds.html:132`) remain; the doc moved them to site-wide audit §5c] | production @ b8f4b32fbd |
| G3-15 | DE fresh 1.7 | "Download data" on the bar tab wrote `undefined` or another tab's CSV because `renderBar` never set `DE.print.CSVforDownload`. | FIXED | [verified 2026-10-17: `gg 'CSVforDownload' P -- assets/js/data-explorer` ; result: `bar.js:539` sets it; `global.js:980` `if (!DE.print.CSVforDownload) return;`; trend/correlate clear it when empty (`trend.js:168`, `correlate.js:322`); control: B `bar.js` → no hit. Runtime recipe: `/data-explorer/asthma/?id=2380`, Bar tab, click Download, open CSV] | production @ b8f4b32fbd |
| G3-16 | DE fresh "Pending integration" | Port `hotfix-table-sorting-by-geo` (borough grouping checkbox, 3-level groups, descendant-attribute toggle, conditional `orderFixed`) into the new explorer. | FIXED | [verified 2026-10-17: `gg 'groupByBorough\|bindTableGroupToggles\|groupColumnBoro' P -- assets/js/data-explorer` ; result: `global.js:31`, `app.js:685-687`, `table.js:660-692,844-853,874,927`; control: same patterns at B → only `handleToggle` (`table.js:750,778`), no `groupByBorough`. `fixedHeader` absent from `table.js` on P as the port required] | production @ b8f4b32fbd |
| G3-17 | DE fresh 2.1 | Six copies of the percent/display rule need one `resolveMeasureDisplay()` helper. | FIXED | [verified 2026-10-17: `gg 'resolveMeasureDisplay' P -- assets/js/data-explorer` ; result: defined `global.js:699`, called from `bar.js:120`, `correlate.js:411,423`, `disparities.js:93`, `map.js:666`; control: B no hit, 6 inline copies] | production @ b8f4b32fbd |
| G3-18 | DE fresh 2.2 | Five notes-rendering copies (and the `innerHTML +=` loop) need one renderer. | FIXED | [verified 2026-10-17: `gg 'renderUnreliabilityNotes' P -- assets/js/data-explorer` ; result: `global.js:420` plus callers in `bar.js:81`, `correlate.js:523`, `disparities.js:158`, `table.js:213`, `trend.js:126`; control: B no hit. `trend.js:19` `appendTrendNote` still does a single `innerHTML +=` for the no-compare footnote] | production @ b8f4b32fbd |
| G3-19 | DE fresh 2.3 | `map.js` duplicated the citywide popup / trend-tab nudge, click-to-trend handlers and topo-load pipeline. | FIXED | [verified 2026-10-17: `gg 'switchToTrendTabOnce\|handleCitywideOnly\|loadMapGeojson' P -- assets/js/data-explorer/map.js` ; result: single definitions `map.js:358,407,425`, used at `:538,755,927`; control: B no hit. The `mapInterop` dedup is G3-53] | production @ b8f4b32fbd |
| G3-20 | DE fresh 2.4 | Every polygon `mouseover` ran `geojsonLayer.eachLayer(resetStyle)` (O(n) per move). | FIXED | [verified 2026-10-17: `gg 'eachLayer' P -- assets/js/data-explorer/map.js` ; result: no hit; `let highlightedLayer` tracker at `map.js:699-720`; control: B `map.js:466 geojsonLayer.eachLayer((l) => {`. Runtime recipe: `/data-explorer/asthma/?id=2380`, hover map polygons, then hover bar chart, confirm one highlight] | production @ b8f4b32fbd |
| G3-21 | DE fresh 2.5 | `correlate.js`/`disparities.js` duplicate the CSV-download table builder. | FIXED | [verified 2026-10-17: `gg 'buildLinksDownloadTable' P -- assets/js/data-explorer` ; result: `global.js:845`, `correlate.js:768`, `disparities.js:367`; control: B no hit] | production @ b8f4b32fbd |
| G3-22 | DE fresh 2.6 | DOM-builder helpers (`setBadgePillState`, `createBadgePillButton`, …) redefined inside `renderMeasures` on every load. | FIXED | [verified 2026-10-17: `gg '^const (setBadgePillState\|createBadgePillButton\|createBadgePillLabel\|createDropdownIdFragment\|createBadgePillDropdown\|setDropdownMenuItemState)' P -- assets/js/data-explorer/measures.js` ; result: 6 column-0 hits `:464-588`; control: B `measures.js:540,560` are indented (inside the function)] | production @ b8f4b32fbd |
| G3-23 | DE fresh 2.7 | `print.js` (1,376 lines) mixes map export with the chart path; split map export into `print-map.js`. | FIXED | [verified 2026-10-17: `git ls-tree --name-only P assets/js/data-explorer/ \| grep print` ; result: `print-map.js`, `print.js`; `data-explorer/single.html:111-112,146-147` load them in order; control: same at B → 0 `print-map` entries] | production @ b8f4b32fbd |
| G3-24 | DE fresh 3.1 | Static fetches (GeoLookup, TimePeriods, comparisons, TopoJSON, 311 crosswalk) re-fetched on every indicator switch; cached topology must not leak `properties` by reference. | FIXED | [verified 2026-10-17: `gg 'loadOnce' P -- assets/js/data-explorer` ; result: `global.js:266` definition; users `data.js:51,394,415`, `311.js:29`, `map.js:359`; `map.js:341-349` `attachDataToGeojsonFeatures` builds new `properties` objects; control: B no `loadOnce`. Runtime recipe: DevTools Network, switch indicators twice on `/data-explorer/asthma/`, count `GeoLookup.json` requests] | production @ b8f4b32fbd |
| G3-25 | DE fresh 3.1b | The same indicator JSON was fetched up to three times per load (primary, comparison, correlate); cache must hold the arquero table, not raw JSON. | FIXED | [verified 2026-10-17: `gg 'loadIndicatorData' P -- assets/js/data-explorer/data.js` ; result: helper `:23-27` (`loadOnce(dataUrl, () => aq.loadJSON(dataUrl, {autoType:false}))`), used `:162,341,800`; control: B no hit] | production @ b8f4b32fbd |
| G3-26 | DE fresh 3.2 | `loadIndicator` awaited `fetch_comparisons()` before `loadData()` ("why are we waiting for this?"). | FIXED | [verified 2026-10-17: `git show P:assets/js/data-explorer/data.js \| sed -n 300,312p` ; result: `await Promise.all([ …fetch_comparisons()…, loadData(…) ])`; control: `git show B:…/data.js \| sed -n 283,291p` shows the sequential `await fetch_comparisons(); … await loadData(…)`] | production @ b8f4b32fbd |
| G3-27 | DE fresh 3.2b | `loadGeo()`/`loadTime()` started only after the indicator rows arrived. | FIXED | [verified 2026-10-17: `git show P:assets/js/data-explorer/data.js \| sed -n 339,344p` ; result: `await Promise.all([ loadIndicatorData(…), loadTime(), loadGeo() ])`; control: B nested them in the `.then` (B has `Promise.all` only at `:119,:320` for other work)] | production @ b8f4b32fbd |
| G3-28 | DE fresh 3 (Vega hidden pane) | Vega specs with `"width": "container"` measured a `display:none` pane and pinned charts to 0 px (correlate/disparities, extended to trend/bar). | FIXED | [verified 2026-10-17: `gg 'getChartContainerWidth' P -- assets/js/data-explorer` ; result: `global.js:731` definition; used `bar.js:504`, `trend.js:457`, `correlate.js:175,205,559`, `disparities.js:198`; bar/trend use `fit-x` (`bar.js:475`, `trend.js:458`) and `#barHolder` has `min-height:500px` (`de-tab-content.html:126`); control: B no `getChartContainerWidth`. Cause visibly removed in code; runtime recipe: `/data-explorer/asthma/?id=2380` load on Bar tab, click Correlate, expect a non-empty chart] | production @ b8f4b32fbd |
| G3-29 | DE fresh 3 (residual) | A brief flash can remain on tab switch from Vega compile/render time; options (trim `buildLabelCollisionTransforms(5)`, reuse a Vega view) un-investigated. | UNVERIFIED (runtime) | [verified 2026-10-17: static facts only: `gg 'buildLabelCollisionTransforms\|vegaEmbed\(' P -- assets/js/data-explorer` ; result: `trend.js:87,622`, `vegaEmbed` called per render in bar/trend/correlate/disparities. Recipe: `/data-explorer/asthma/?id=2380`, switch Bar/Trend tabs with Performance tab recording, look for first-paint gap] | production @ b8f4b32fbd |
| G3-30 | DE fresh 3.3 (FA JS) | Font Awesome shipped twice: CSS+webfonts and the `all.min.js` SVG injector. | FIXED | [verified 2026-10-17: `gg 'all.min.js' P -- themes/dohmh/layouts/partials/head.html` ; result: no hit (only `all.min.css` at `:121`); control: B `head.html:116 …fontawesome-free/js/all.min.js`] | production @ b8f4b32fbd |
| G3-31 | DE fresh 3.3 (CSS minify) | No CSS minification in `head.html`; adding `\| minify` was proposed, built, then rejected by the user. | OPEN | [verified 2026-10-17: won't-do by decision: fresh audit §3.3 and "Standing won't-dos" (rejected during the commit split, reason not given; do not re-propose without checking in). `gg 'minify' P -- themes/dohmh/layouts/partials` ; result: no hit, so the state still matches the decision] | production @ b8f4b32fbd |
| G3-32 | DE fresh 3.3 (duplicates) | `head.html` duplicated the favicon and loaded nyc-lib CSS both conditionally and unconditionally. | FIXED | [verified 2026-10-17: `gg 'favicon\|nyc-basic-lib.css' P -- themes/dohmh/layouts/partials/head.html` ; result: one favicon (`:54`), one nyc-lib block (`:106-108`); control: B favicon `:45,:102`, nyc-lib `:91-92,:129-130`] | production @ b8f4b32fbd |
| G3-33 | DE fresh 3.3 (FA woff loop) | The FA-woff Hugo loop relied on an accidental `.RelPermalink` read to publish webfonts; replace with `.Publish`. | FIXED | [verified 2026-10-17: `git show P:themes/dohmh/layouts/partials/head.html \| sed -n 124,134p` ; result: `{{- range $woff := $fa_woff}}{{- $woff.Publish -}}{{- end }}`; control: B `head.html:121` same range with the double-`Get` form] | production @ b8f4b32fbd |
| G3-34 | DE fresh 3.3 (DataTables) | Shared DataTables bundle carried `buttons.print` and `rowgroup`, dead in both explorers. | FIXED | [verified 2026-10-17: `git show P:themes/dohmh/layouts/partials/lib-datatables.html \| sed -n 14,17p` ; result: bundle = core + buttons + buttons.html5 only; control: B `head.html:174-175`. The old explorer's own bundle still includes both (`data-explorer-old/single.html:1116-1119`), which retires with G3-56] | production @ b8f4b32fbd |
| G3-35 | DE fresh 3.3 (easybutton/colorIcon) | `easybutton`/`colorIcon` loaded on DE pages though used only by other pages. | FIXED | [verified 2026-10-17: `gg 'easybutton\|colorIcon\|uhflist' P -- themes/dohmh/layouts/data-explorer themes/dohmh/layouts/partials/head.html` ; result: no hit; opt-in `lib-easybutton-coloricon` only in 6 data-features templates; control: B `head.html:195,215,221`] | production @ b8f4b32fbd |
| G3-36 | DE fresh 3.3 (uhflist) | `uhflist.js` (20 KB, render-blocking) loaded on every DE page though the SPA never reads it. | FIXED | [verified 2026-10-17: `gg 'uhflist' P -- themes/dohmh/layouts/data-explorer themes/dohmh/layouts/partials/head.html` ; result: no hit; control: B `head.html:195-196`. Rest of the "UHF sprawl" went to site-wide audit §5a] | production @ b8f4b32fbd |
| G3-37 | DE fresh 3 (harness base URL) | `de-characterization.mjs` hard-coded `/dev-stage/`. | FIXED | [verified 2026-10-17: `gg 'DE_BASE_URL' P -- scripts/de-characterization.mjs` ; result: `:32` comment "honors DE_BASE_URL. (was hardcoded here)"; handled by `dev-server.mjs` `ensureDevServer`; control: `git merge-base --is-ancestor d5fb2ea700 P` → 0] | production @ b8f4b32fbd |
| G3-38 | DE fresh 4.1 | `renderMeasures` was a ~1,500-line function re-creating ~35 closures and the seven `show*` renderers per indicator. | FIXED | [verified 2026-10-17: `gg '^(showTable\|showMap\|showBar\|showTrend\|showBoroughTrend\|showComparisonTrend\|showLinks) = ' P -- assets/js/data-explorer/measures.js` ; result: 7 column-0 assignments `:1503-1803` (declared `let` in `global.js:199-200`); `renderMeasures` spans `measures.js:1873-2114` (242 lines, the doc's 199 has since grown); control: B `renderMeasures` at `measures.js:420`, renderers indented inside] | production @ b8f4b32fbd |
| G3-39 | DE fresh 4.1 (incidental) | `DE_MEASURE_RULES.trendAnnualAverageMeasureIds [365,370,375,391]` and `trendSummerMeasureIds [386]` match no measure, so `showBoroughTrend`'s slice branches are dead against live data. | OPEN | [verified 2026-10-17: `gg 'trendAnnualAverageMeasureIds\|trendSummerMeasureIds' P -- assets/js/data-explorer` ; result: `global.js:231,234` and consumers `measures.js:1659-1660`; data: `gh api …/EHDP-data/contents/indicators/metadata/metadata.json?ref=production` + Python → ids 365/370/375/391/386 present in 0 of 731 measure IDs; control: same script finds 858-863, 221, 564-566 present] | production @ b8f4b32fbd |
| G3-40 | DE fresh 4.1 naming sweep A | Misleading names (`btn-toggle-disparities`, `clickLinksToggle`, `handleToggle`, `draw311Buttons`, `#tableCopy`, `printMenus` family). | FIXED | [verified 2026-10-17: `gg 'btn-toggle-disparities\|clickLinksToggle\|draw311Buttons\|printMenus\|dropdownLinksMeasures' P -- assets/js/data-explorer themes/dohmh/layouts/data-explorer` ; result: no hit (old names remain only in `data-explorer-old/`); new names `bindCorrelateControls`, `render311Links`, `bindTableGroupToggles`, `correlatePillRow` present; control: same gg at B → hits in `311.js:14`, `app.js:415,458`, `measures.js:296`] | production @ b8f4b32fbd |
| G3-41 | DE fresh 4.1 naming sweep B | Duplicate/invalid ids: `#dropdownMenuButton` twice, `#311`/`#311label` twice, `#printTopic`. | FIXED | [verified 2026-10-17: `gg 'id="takeActionToggle\|id="contact311\|id="selectedTopicName' P -- themes` ; result: `takeActionToggleDesktop`/`Mobile`, `contact311LinksDesktop`/`Mobile`, `selectedTopicName`; `takeaction.html:4` keeps `id="311"` deliberately (shared with the old explorer); control: B pre-sweep used `dropdownMenuButton`, `311-2` per the doc's own commits `f963da0612`, `f0a4f06611`] | production @ b8f4b32fbd |
| G3-42 | DE fresh 4.1 naming sweep C | Three modals (`#topicSelector`, `#indicatorSelector`, `#learnMore`) had `aria-labelledby` pointing at ids that do not exist. | FIXED | [verified 2026-10-17: `gg 'id="topicSelectorLabel"\|id="indicatorSelectorLabel"\|aria-labelledby="about"\|id="about"' P -- themes/dohmh/layouts/partials/header-de.html` ; result: `:300,:370` and `learnMore` → `#about` at `:405,:415`, all targets exist. Runtime recipe: Playwright accessibility snapshot of each opened modal, expect names "Choose topic", "Select dataset", "About <topic>"] | production @ b8f4b32fbd |
| G3-43 | DE fresh 4.1 (deferred) | `links` → `correlate` rename: code says `links` in 454 places across 11 files plus three external contracts. | OPEN | [verified 2026-10-17: won't-do by decision: fresh audit §4.1 naming sweep "Deferred, with cost known … left alone by decision" and "Standing won't-dos". `gg -ci '\blinks\b' P -- assets/js/data-explorer` ; result: 11 files, `measures.js` 101; contracts still present: `app.js:273 '#tab-links'`, `measures.js:380 'links_disparities'`] | production @ b8f4b32fbd |
| G3-44 | DE fresh 4.1 (incidental) | `documents/data-explorer-architecture.md` still described `data-explorer-new/` and called three renderers console-logging stubs. | FIXED | [verified 2026-10-17: `git grep -c 'data-explorer-new' P -- documents/data-explorer-architecture.md` ; result: no hit; `:13` now records the earlier stub claim as a correction; control: same at B → 3] | production @ b8f4b32fbd |
| G3-45 | DE fresh 4.2 | `loadIndicator → … → renderCurrentView` was duplicated in `checkURL`, `popstate`, `selectIndicator`; URL parse/serialize duplicated. | FIXED | [verified 2026-10-17: `gg 'loadAndRenderIndicator\|parseSelectionFromURL\|applySelectionToState\|normalizeLegacyURL' P -- assets/js/data-explorer/app.js` ; result: single pipeline `app.js:501`, parse/apply `:54,:88`, popstate calls it with `history:'none'`; control: B has `checkURL`/`selectIndicator` copies and no `loadAndRenderIndicator`] | production @ b8f4b32fbd |
| G3-46 | DE fresh 4.2 (a) | A load wrote two history entries (loadIndicator's own push plus the caller's `pushSelectionToURL`); Back stayed on the page. | FIXED | [verified 2026-10-17: `gg 'pushState\|replaceState' P -- assets/js/data-explorer` ; result: `data.js` no longer writes history; one write in the pipeline, `app.js:553-556`; control: B `data.js:257,263` wrote history. Runtime recipe: load `/data-explorer/asthma/?id=2380`, press Back, expect to leave the page] | production @ b8f4b32fbd |
| G3-47 | DE fresh 4.2 (b) | `resetSelectionForNewIndicator` replaced the outgoing indicator's history entry before the new push. | FIXED | [verified 2026-10-17: `git show P:assets/js/data-explorer/app.js \| sed -n 108,120p` ; result: reset only nulls state, "Writes no history"; control: B `app.js:70 writeHistoryState('replaceState', { id: … })` inside the reset. Runtime recipe: from `?id=2380` pick 2414, Back, expect 2380 with sub-selections] | production @ b8f4b32fbd |
| G3-48 | DE fresh 4.2 (c) | popstate's indicator-change branch returned before restoring `MeasureID`/`GeoType`/`TimePeriodID`. | FIXED | [verified 2026-10-17: `git show P:assets/js/data-explorer/app.js \| sed -n 575,590p` ; result: popstate calls `loadAndRenderIndicator(selection.id, { selection, history:'none' })` and that function applies `applySelectionToState(selection)` after the reset (`:518-523`); control: B popstate returned early per the doc's commit `a18a66852e` ancestry. Runtime recipe: `?id=2414&MeasureID=1299&GeoType=Borough` via history navigation, expect state to match the URL, not 2414's defaults] | production @ b8f4b32fbd |
| G3-49 | DE fresh 4.2 (d) | `normalizeLegacyOverlayURL` had no initial-load caller, so `overlay=map` stayed in the address bar. | FIXED | [verified 2026-10-17: `gg 'normalizeLegacyURL' P -- assets/js/data-explorer/app.js` ; result: `:325` definition and `:336 normalizeLegacyURL();` at top level (runs on load) and in popstate; control: B `app.js:401` only inside popstate] | production @ b8f4b32fbd |
| G3-50 | DE fresh 4.2 (race) | Rapid indicator selection could interleave fetches and render stale data (404 on `geography/undefined`). | FIXED | [verified 2026-10-17: `gg 'indicatorLoadToken\|isIndicatorLoadCurrent' P -- assets/js/data-explorer` ; result: `app.js:478-487`, checks between every step (`:508-547`) and after fetches (`measures.js:134-140,1881-1989`); control: B no token. Runtime recipe: console `selectIndicator(2414); selectIndicator(2392)`, expect no 404 on `geography/undefined`] | production @ b8f4b32fbd |
| G3-51 | DE fresh 4.2 (smoke) | The `// DE section` smoke entry was `/data-explorer/asthma/` (a `single.html`), leaving `section.html` with no coverage. | FIXED | [verified 2026-10-17: `gg 'data-explorer/' P -- scripts/smoke-pages.mjs` ; result: `:43 "data-explorer/", // data-explorer/section.html — topic chooser`; control: doc names the corrected comment; the entry now labelled section.html is what the doc says was added] | production @ b8f4b32fbd |
| G3-52 | DE fresh 4.2 follow-up | URL updates after the data fetch (29–151 ms), not at click time; recommendation is to leave it unless reported. | OPEN | [verified 2026-10-17: `git show P:assets/js/data-explorer/app.js \| sed -n 541,558p` ; result: the single write sits after `await renderMeasures()` and before `renderCurrentView(true)`, as described; no early push exists. Latency figures are runtime and were not re-measured: click an indicator in the chooser on `/data-explorer/asthma/`, time `location.search` change] | production @ b8f4b32fbd |
| G3-53 | DE fresh 4.3 | `bar.js` branch-sniffed `window.mapInterop` shape (`circleMarkers` vs `geoIDtoLayer`); define one stable contract. | FIXED | [verified 2026-10-17: `gg 'circleMarkers\|geoIDtoLayer' P -- assets/js/data-explorer/bar.js` ; result: no hit; `map.js:42-52` defines `NO_MAP_INTEROP` and `{ready, highlight, reset}`; `bar.js:572-583` uses only those; control: B `bar.js:557-560` sniffs `mapAPI.circleMarkers`] | production @ b8f4b32fbd |
| G3-54 | DE fresh 4.3 (lifecycle) | `window.mapInterop` stayed pointing at removed layers during a geography switch and still wrote the old geography into the legend. | FIXED | [verified 2026-10-17: `gg 'detachMapInterop' P -- assets/js/data-explorer/map.js` ; result: `:70` definition, `:136` called in `resetMapForRender`; control: B no `detachMapInterop`. Runtime recipe: delay `*.topo.json` 4 s via `page.route`, switch CD→Borough, hover a bar, expect no stale legend text] | production @ b8f4b32fbd |
| G3-55 | DE fresh 4.3 (mirror) | `if (window.myVegaView) …signal("selectedGeo", x).run()` appeared six times in `map.js`. | FIXED | [verified 2026-10-17: `gg 'setBarSelection' P -- assets/js/data-explorer/map.js` ; result: helper `:59`, callers `:801,818,825`; control: B has the inline `myVegaView.signal("selectedGeo"` repeats (`gg 'signal\("selectedGeo"' B -- …/map.js`)] | production @ b8f4b32fbd |
| G3-56 | DE fresh 4.4 | Retire the old explorer trees (`assets/js/data-explorer-old/`, layouts, content) after comparative user testing. | OPEN | [verified 2026-10-17: deferred by decision 2026-07-13 (fresh audit Decisions and §4.4; trigger: end of user testing). `git ls-tree --name-only P assets/js/data-explorer-old/ themes/dohmh/layouts/data-explorer-old/` ; result: 10 JS files + 4 layouts still present] | production @ b8f4b32fbd |
| G3-57 | DE fresh 4.4 (responsive-table) | `assets/js/responsive-table.js` is dead (no template loads it) and deletable today. | OPEN | [verified 2026-10-17: `git ls-tree --name-only P assets/js/responsive-table.js` ; result: file present; `gg 'responsive-table' P -- themes assets/js content` ; result: no content reference (a name-only sweep; a dynamic `resources.Get` built from a variable would be missed); control: `gg 'rowgroup' P -- assets/js/responsive-table.js` → `:62` proves the file is searchable] | production @ b8f4b32fbd |
| G3-58 | DE fresh 4.5 (ESLint) | Add flat-config ESLint (`no-undef`) over the SPA with derived shared globals and a `lint` script. | FIXED | [verified 2026-10-17: `git show P:package.json \| grep -n '"lint"'` ; result: `"lint": "eslint assets/js/data-explorer"`; `eslint.config.mjs` present; control: B had no npm scripts per the doc, commit `fd590ab479` is an ancestor of P] | production @ b8f4b32fbd |
| G3-59 | DE fresh 4.5 (characterize/dev-server) | Promote `de-characterization.mjs` to `scripts/` with an `npm run characterize` script and a `dev-server.mjs` that resolves or starts one server. | FIXED | [verified 2026-10-17: `git show P:package.json \| grep -n 'characterize"'` ; result: `"characterize": "node scripts/de-characterization.mjs"`; `gg 'export async function ensureDevServer' P -- scripts/dev-server.mjs` → `:177`] | production @ b8f4b32fbd |
| G3-60 | DE fresh 4.5 (DOMPurify) | Metadata `innerHTML` sinks (`Sources`, `about`, `how_calculated`) were unsanitised in the new explorer. | FIXED | [verified 2026-10-17: `gg 'DOMPurify' P -- assets/js/data-explorer` ; result: `global.js:395,397,400`, `topic-indicator-selector.js:578` (4 sinks); control: B only a commented call `data.js:273`] | production @ b8f4b32fbd |
| G3-61 | DE fresh 4.5 (smoke) | Add a console-error smoke test over one page per template kind. | FIXED | [verified 2026-10-17: `git show P:package.json \| grep -n '"smoke"'` ; result: `"smoke": "node scripts/smoke-pages.mjs"`; `PAGES` includes `data-explorer/`, `asthma/?id=2380`, `birth-defects/?id=26`, `waterways/?id=2427`; control: B no smoke script] | production @ b8f4b32fbd |
| G3-62 | DE fresh 4.5 (NR duplicate declaration) | `neighborhood-reports/section.html` and the `nr-leaflet` partial both declared `intendedDestinationName` at global scope (`SyntaxError` on the landing page). | FIXED | [verified 2026-10-17: `gg 'intendedDestinationName' P -- themes` ; result: `section.html:212 var intendedDestinationName = null;`, `nr-leaflet.html:197` comment explains the shared `var`; control: commit `103c8197bd` is the doc's fix; static check only, runtime recipe: load `/neighborhood-reports/`, expect no console `SyntaxError`] | production @ b8f4b32fbd |
| G3-63 | DE fresh 4.5 (nr-output) | `nr-output` report pages used `aq.` without loading Arquero (`aq is not defined`). | FIXED | [verified 2026-10-17: `gg 'lib-arquero' P -- themes/dohmh/layouts/nr-output` ; result: `single.html:60`; control: B `gg 'arquero\|lib-' B -- themes/dohmh/layouts/nr-output/single.html` shows no arquero include. `nr-output` still exists on production (the NR retirement is unmerged there)] | production @ b8f4b32fbd |
| G3-64 | DE fresh 4.5 (deferred) | Lint is not run in CI. | OPEN | [verified 2026-10-17: `gg 'lint' P -- .github/workflows` ; result: only `eslint.config.mjs` as a path trigger in `site-characterization.yml:83` and `smoke.yml:85`, no `npm run lint` step; control: `gg 'npm run lint' P -- .github` → hit only in `.github/instructions/…best-practices.instructions.md:166` (generic guidance, proves the pattern can match)] | production @ b8f4b32fbd |
| G3-65 | DE fresh 4.5 (deferred) | No pre-commit hook runs lint. | OPEN | [verified 2026-10-17: `gg 'pre-commit\|husky' P -- package.json` ; result: no hit; `git ls-tree -d --name-only P .husky` → none. Name-based; a hook installed outside the repo is not detectable here] | production @ b8f4b32fbd |
| G3-66 | DE fresh 4.5 (deferred) | A full `innerHTML` sink sweep (~40 sinks) was not done. | OPEN | [verified 2026-10-17: `gg 'innerHTML' P -- assets/js/data-explorer \| grep -v '//'` ; result: 42 non-comment lines (e.g. `311.js:87 element.innerHTML += btn`, `topic-indicator-selector.js:427`); only 4 wrapped in DOMPurify (G3-60)] | production @ b8f4b32fbd |
| G3-67 | DE fresh 4.5 / 4.9 | The visual-regression piece (argued for by 4.9) is unbuilt. | OPEN | [verified 2026-10-17: `git ls-tree -r --name-only P scripts .github \| grep -i -E 'visual\|screenshot\|pixel'` ; result: only `site-characterization-baseline/.../data-visualization/index.json` (a content path); no visual-diff script; control: same filter matches `…workflows/smoke.yml` for 'smoke'-type names, i.e. the filter works on this listing] | production @ b8f4b32fbd |
| G3-68 | DE fresh 4.6 | `head.html` gated libraries behind one `if or (eq .Kind "page") …` block, hiding a page's dependencies from its own template. | FIXED | [verified 2026-10-17: `gg 'if or \(eq .Kind' P -- themes/dohmh/layouts/partials/head.html` ; result: no hit; `data-explorer/single.html:3-8` and `section.html:3-4` include `lib-*` partials; control: B `head.html:143` has the block] | production @ b8f4b32fbd |
| G3-69 | DE fresh 4.6 | Old-explorer and `head.html` DataTables bundles collided at the literal path `js/dataTableBundle.js`. | FIXED | [verified 2026-10-17: `gg 'resources.Concat "js/' P -- themes/dohmh/layouts/partials/lib-datatables.html themes/dohmh/layouts/data-explorer-old/single.html` ; result: `lib-datatables-bundle.js` vs `dataTableBundle.js`, distinct; control: B had `dataTableBundle.js` in both `head.html:177` and `data-explorer-old/single.html:1099`] | production @ b8f4b32fbd |
| G3-70 | DE fresh 4.8 | A dead commented-out duplicate of a Pagefind filter sat in `head.html`. | FIXED | [verified 2026-10-17: `gg '<!--.*pagefind-filter' P -- themes/dohmh/layouts/partials/head.html` ; result: no hit; the six live filters are at `:156-176`; control: the doc cites the dead line at `head.html:56`, commit range ends at `47ffb33fde` (ancestor of P); I did not locate the exact removed line at the earlier tree] | production @ b8f4b32fbd |
| G3-71 | DE fresh 4.8 (`/search-results/`) | `/search-results/` is an orphaned template and stub page whose JS was deleted in 2024. | FIXED | [verified 2026-10-17: `git ls-tree --name-only P themes/dohmh/layouts/search-results/ content/search-results/` ; result: empty; `gg 'search-results' P -- themes content` → only `partials/structured-data.html`; control: doc cites `bad2246281` as the JS deletion and says the template existed] | production @ b8f4b32fbd |
| G3-72 | DE fresh 4.8 (topic-level indexing) | The new explorer's `single.html`/`section.html` put `data-pagefind-ignore="all"` on the whole article, so topic title/`.Content`/take-action were unindexed. | FIXED | [verified 2026-10-17: `gg 'data-pagefind-ignore' P -- themes/dohmh/layouts/data-explorer/single.html themes/dohmh/layouts/data-explorer/section.html` ; result: now on an inner `<section>` (`single.html:18`, `section.html:15`), with a `d-none` block rendering `.Title`/`.Content`/`takeaction` after it; control: B `single.html:3` and `section.html:3` carry it on the `<article>`. Runtime recipe: `npx pagefind --site docs`, search a phrase from `air-quality` body text, expect `/data-explorer/air-quality/`] | production @ b8f4b32fbd |
| G3-73 | DE fresh 4.8 / Decisions | Keep the "Data Explorer (Old)" Pagefind filter chip until 4.4. | OPEN | [verified 2026-10-17: deferred by decision 2026-07-22 (retires with G3-56). `gg 'Data Explorer \(Old\)' P -- themes/dohmh/layouts/partials/head.html` ; result: `:172`] | production @ b8f4b32fbd |
| G3-74 | DE fresh 4.8 | No Pagefind section filter exists for `resources`, `about`, `take-action`. | OPEN | [verified 2026-10-17: `gg 'data-pagefind-filter="section\[content\]"' P -- themes/dohmh/layouts/partials/head.html` ; result: six filters `:156-176` (Data Stories, Data Features, Neighborhood Reports, Data Explorer, Data Explorer (Old), Key Topics) and none for the three sections] | production @ b8f4b32fbd |
| G3-75 | DE fresh 4.8 | `class="d-none"` on the Pagefind title `<meta>` tag has no effect. | OPEN | [verified 2026-10-17: `gg 'class="d-none"' P -- themes/dohmh/layouts/partials/head.html` ; result: `:228,:235`. Cosmetic; whether those lines are `<meta>` elements was read from the doc and the file context, not re-rendered] | production @ b8f4b32fbd |
| G3-76 | DE fresh 4.9 | Modal close button used a text `&times;` in an `.h3` span, deforming Chrome's focus ring and sitting off-centre. | FIXED | [verified 2026-10-17: `gg '&times;' P -- themes/dohmh/layouts/partials/header-de.html` ; result: no hit; inline SVG at `:294,:361,:408`; control: B `:296,:363,:409` `<span class="h3" aria-hidden="true">&times;</span>`. Runtime recipe: open a topic modal on `/data-explorer/asthma/`, Tab to the close button, inspect focus ring and glyph centring] | production @ b8f4b32fbd |
| G3-77 | DE fresh 4.10 | `renderMenuSection` bound two click listeners per button on every rebuild (perf case later disproved). | FIXED | [verified 2026-10-17: `gg 'updateDropdownText\|container.onclick' P -- assets/js/data-explorer/menu.js` ; result: `updateDropdownText` gone, delegated `container.onclick` at `:240`; control: B has `updateDropdownText` (`gg 'updateDropdownText' B -- …/menu.js`)] | production @ b8f4b32fbd |
| G3-78 | DE fresh 4.11 | `DE.state` is written from many files; `overlay` is assigned at 9 sites across 4 files. | OPEN | [verified 2026-10-17: `gg 'DE\.state\.overlay = ' P -- assets/js/data-explorer` ; result: 9 hits: `app.js:666`, `data.js:225`, `de-tab-content.js:54,110`, `measures.js:1507,1602,1636,1807,2093`; all `DE.state.<field> =` writes counted by file: app 5, data 2, de-tab-content 2, measures 5, menu 7 (21; the doc's 23 used a different count)] | production @ b8f4b32fbd |
| G3-79 | DE fresh 4.12 | `GeoType: null` in `VisOptions[0].Map` made the map throw and the Boundary/Time dropdowns blank. | FIXED | [verified 2026-10-17: `gg 'withCitywideMapFallback\|MapUnavailable\|renderUnmappedCitywide' P -- assets/js/data-explorer` ; result: `global.js:569-620`, `getIndicatorById` wrapper `:637`, `map.js:522,602`; control: commit `a598e8b892` is an ancestor of P; B has none of these names. Runtime recipe: `/data-explorer/birth-defects/?id=26`, expect gray "Data not mapped" polygon and no console error] | production @ b8f4b32fbd |
| G3-80 | DE fresh 4.12 / at-a-glance | Table defaults to Citywide alone where the old explorer ticks Citywide + Borough (3 vs 7 rows on `?id=26`). | OPEN | [verified 2026-10-17: won't-do by decision: fresh audit at-a-glance block "Closed 2026-10-01 by decision (Chris): the table keeps strictly following the map"; context in `site-wide-audit-2026-06-27.md` §4c. Not re-measured; runtime recipe: `/data-explorer/birth-defects/?id=26` Table tab vs `/data-explorer-old/birth-defects/?id=26`] | production @ b8f4b32fbd |
| G3-81 | DE fresh 4.12 (item 3) | The null-placeholder normaliser covers `Map` only; `Trend`/`Links` use the same convention and are unhandled. | OPEN | [verified 2026-10-17: `git show P:assets/js/data-explorer/global.js \| sed -n 569,625p` ; result: `withCitywideMapFallback` rebuilds only `VisOptions[0].Map`. No throw reported for Trend/Links in the doc; not tested at runtime] | production @ b8f4b32fbd |
| G3-82 | DE fresh 4.12 (export) | `print-map.js` builds export from `DE.map.filteredMapData`, so an unmapped measure would export a mapped-looking bubble; the Save map control is hidden instead. | OPEN | [verified 2026-10-17: `gg 'filteredMapData' P -- assets/js/data-explorer/print-map.js assets/js/data-explorer/map.js` ; result: `print-map.js:599,639`, comment `map.js:274`; `setSaveMapVisible(false)` precedes the unmapped render (`map.js:536`)] | production @ b8f4b32fbd |
| G3-83 | DE fresh 4.13 | 10 measures have no `Citywide` row to fall back on (9 `NYHarbor`-only), leaving empty dropdowns on the unmapped state. | OPEN | [verified 2026-10-17: Python over today's production `metadata.json`: measures whose Map has a null GeoType and no Citywide row in Table/Trend → 13 (ids 103/870, 2176/869, 2383/1205, 2384/1207, 2427 ×5, 2428 ×4); `NYHarbor`-only = 9 (matches the doc's 9); the doc's total of 10 no longer matches (13 today). `ny_harbor.topo.json` still in `GEO_FILE_BY_TYPE` (`global.js:450`)] | production @ b8f4b32fbd |
| G3-84 | DE fresh 4.13 (upstream) | `VisOptions[0].Map` is unpopulated for 40 of 282 indicators whose other views carry real geographies. | OPEN | [verified 2026-10-17: Python over today's production `metadata.json`: 47 of 267 indicators have a Map entry with null GeoType (129 measures), 20 with every entry null; control: id 26, 73 and 2427 present in the file] | production @ b8f4b32fbd |
| G3-85 | DE fresh 4.14 | The three map renderers had no stale-render token, so a slow geometry fetch could land on the wrong measure. | FIXED | [verified 2026-10-17: `gg 'isCurrentMapRender\|mapRenderGeneration' P -- assets/js/data-explorer/map.js` ; result: `:23-25,134,527,541,670,758,888,930` (all three renderers); control: `git grep -c isCurrentMapRender 3427ebb1aa^ -- …/map.js` → no hit; `3427ebb1aa` ancestor of P. Doc says it was not reproduced in a browser; runtime recipe: hold `citywide.topo.json` with `page.route`, change measure on `?id=73`] | production @ b8f4b32fbd |
| G3-86 | DE fresh Decisions / consolidated #19 | Script bundling ("one Hugo-managed bundle") was rejected so traces point at real source files. | OPEN | [verified 2026-10-17: won't-do by decision: fresh audit Decisions 2026-07-13 "No script bundling" and Standing won't-dos. `gg 'resources.Get "js/data-explorer/' P -- themes/dohmh/layouts/data-explorer/single.html` ; result: separate tags for each of the 15 SPA scripts] | production @ b8f4b32fbd |
| G3-87 | DE deep §0 | Four dead files in `assets/js/data-explorer/` (`geography.js` 3807 lines, `_choroData.js`, `_choro.js`, `_bar.js`). | FIXED | [verified 2026-10-17: `git ls-tree --name-only P assets/js/data-explorer/ \| grep -E 'geography\|_choro\|_bar'` ; result: empty; control: `git ls-tree -r --name-only D \| grep -E 'data-explorer/(geography\|_choroData\|_choro\|_bar)\.js'` → 4 files] | production @ b8f4b32fbd |
| G3-88 | DE deep §1 #9 | Default-measure priority duplicated between `menu.js` and `measures.js`. | FIXED | [verified 2026-10-17: `gg 'pickDefaultMeasureByPriority\|const getDefaultMeasure' P -- assets/js/data-explorer` ; result: `measures.js:26,68`, `menu.js:18 const getDefaultMeasure = (indicator) => pickDefaultMeasureByPriority(indicator.Measures);`; control: D `menu.js:15 const getDefaultMeasure = (indicator) => {` (own body)] | production @ b8f4b32fbd |
| G3-89 | DE deep §1 #10 | `assignGeoRank` kept a parallel `switch` instead of deriving from `prettifyGeoType`. | FIXED | [verified 2026-10-17: `gg 'assignGeoRank' P -- assets/js/data-explorer/global.js` ; result: `:508 const assignGeoRank = (GeoType) => GEO_RANK_BY_PRETTY_TYPE[prettifyGeoType(GeoType)];` and `getGeoFile` via `GEO_FILE_BY_TYPE` `:450,478`] | production @ b8f4b32fbd |
| G3-90 | DE deep §1 #14 | `handleToggle()` rebound its delegated click handler on every `drawCallback`. | FIXED | [verified 2026-10-17: `gg 'bindTableGroupToggles' P -- assets/js/data-explorer/table.js` ; result: called once at init `:874`, defined `:927` with a body-delegated handler; B `handleToggle()` call at `table.js:750` (control for the earlier name). DataTables destroy is still done in `table.js`] | production @ b8f4b32fbd |
| G3-91 | DE deep §1 #30 | Analytics calls must be guarded. | FIXED | [verified 2026-10-17: `gg 'const trackDataExplorerEvent' P -- assets/js/data-explorer/global.js` ; result: `:858` wrapper; the doc's own status was already "Done"] | production @ b8f4b32fbd |
| G3-92 | DE deep §1 #18 | Consolidated #18 called the trend/correlate/disparities renderers stubs. | OBSOLETE | [verified 2026-10-17: the doc itself retracts it ("Stale claim … do not treat them as stubs"); `wc -l` of the three files on P: trend 708, correlate 774, disparities 379 lines; the claim is a retracted premise, not a defect, so no positive control applies] | production @ b8f4b32fbd |
| G3-93 | DE deep §1 (bulk row) | Consolidated items 1–8, 11–13, 15–17, 19–24, 26–29, 31–33 "still open". | UNVERIFIED (other, the 04-17 and 04-19 lists are outside G3's documents so the numbers cannot be mapped) | [verified 2026-10-17: only the 04-18 list is in scope; its 20 items are rows G3-125 to G3-144, and the structural items named here (state store, URL module, renderer registry, fetch cache, hover reset, event bus) are covered by G3-16..G3-27, G3-45, G3-53, G3-125, G3-126, G3-129 and G3-132] | production @ b8f4b32fbd |
| G3-94 | DE deep §1 pin #15/#17 | Hover reset still O(n) via `eachLayer(resetStyle)`; unused `currentlyHighlighted`. | FIXED | [verified 2026-10-17: same evidence as G3-20: `gg 'eachLayer\|currentlyHighlighted' P -- assets/js/data-explorer/map.js` ; result: no hit; control: D `gg 'eachLayer' D -- …/map.js` → hit] | production @ b8f4b32fbd |
| G3-95 | DE deep §1 pin #26 | `copyCitation` builds a redundant `<textarea>`. | FIXED | [verified 2026-10-17: see G3-07; `global.js:324` uses the clipboard API directly; control: B `global.js:258`] | production @ b8f4b32fbd |
| G3-96 | DE deep §2.1 | `downloadData()` ended with `e.stopPropagation()` where `e` is undefined (`ReferenceError` on every download). | FIXED | [verified 2026-10-17: `gg 'stopPropagation' P -- assets/js/data-explorer/global.js` ; result: no hit; control: D `global.js:615 e.stopPropagation();`] | production @ b8f4b32fbd |
| G3-97 | DE deep §2.2 | Percentile measures formatted as percent (`A \|\| B && !C` precedence) in `map.js`/`bar.js`. | FIXED | [verified 2026-10-17: `gg 'resolveMeasureDisplay' P -- assets/js/data-explorer/global.js` ; result: `:699-702` with `(…) && !measurementType.includes('percentile')`; map/bar both call it (`map.js:666`, `bar.js:120`); control: D `map.js:316`/`bar.js:120` held the unparenthesised form per the doc's snippet (`gg "includes\('percentile'\)" D -- …`)] | production @ b8f4b32fbd |
| G3-98 | DE deep §2.3 | Citywide click-through targeted `v-pills-trend` (nonexistent) instead of `v-pills-trends-tab`. | FIXED | [verified 2026-10-17: `gg "v-pills-trend['\"]" P -- assets/js/data-explorer` ; result: no hit; control: D `map.js:504,614,665` `getElementById('v-pills-trend')`] | production @ b8f4b32fbd |
| G3-99 | DE deep §2.4 | `setTimeout(updateChartPlotSize(), 1000)` ran immediately. | FIXED | [verified 2026-10-17: `gg 'updateChartPlotSize' P -- assets/js/data-explorer/print.js` ; result: `:184 setTimeout(updateChartPlotSize, 1000);`; control: D had the call form elsewhere (`gg 'updateChartPlotSize\(\)' D -- …` → `disparities.js:43`, `global.js:486`); the original `print.js:325` line was not separately re-located] | production @ b8f4b32fbd |
| G3-100 | DE deep §2.5 | Analytics event misspelled `click_how_caclulated`. | FIXED | [verified 2026-10-17: `gg 'caclulated' P -- assets/js/data-explorer` ; result: no hit; control: D `app.js:446 trackDataExplorerEvent('click_how_caclulated')`] | production @ b8f4b32fbd |
| G3-101 | DE deep §2.6 | Seedless `reduce((a,b)=>a.concat(b))` throws on an empty array. | FIXED | [verified 2026-10-17: `gg 'reduce\(\(a, b\) => a.concat' P -- assets/js/data-explorer/data.js` ; result: 3 remaining uses, each guarded: `:190` behind `flatComparisonDataTables.length ?`, `:470` behind `if (!perGeotypeTables.length) return null`, `:482` behind `perMeasureTables.length ?`; `menu.js:140` reduce is seeded; control: D 6 unguarded `.reduce((a, b) => a.concat(b))` hits (`data.js:128,463,510,557,577,586`). Fixed by guard, not by seed] | production @ b8f4b32fbd |
| G3-102 | DE deep §2.7 | `bar.js` synthesised confidence intervals (`Value * .95`/`* 1.05`, "hard set for test"). | FIXED | [verified 2026-10-17: `gg '\* ?\.95\|1\.05\|hard set' P -- assets/js/data-explorer/bar.js` ; result: no hit; control: D `bar.js:493,497`] | production @ b8f4b32fbd |
| G3-103 | DE deep §2.8 | Duplicate `"test"` key in one `bar.js` object literal. | FIXED | [verified 2026-10-17: `gg '"test"' P -- assets/js/data-explorer/bar.js` ; result: every hit is the single `datum.Value != null && …` form (`:190,219,284,294,349,359`); control: D `:208 "test": "datum.GeoID == selectedGeo"` followed by `:209` second `"test"`] | production @ b8f4b32fbd |
| G3-104 | DE deep §2.9 | Dead `#indicatorButtons` handler (old-explorer id, casing bug). | FIXED | [verified 2026-10-17: `gg 'indicatorButtons' P -- assets/js/data-explorer` ; result: no hit; control: D `app.js:463 $('#indicatorButtons').on('click', …)`] | production @ b8f4b32fbd |
| G3-105 | DE deep §2.10 | Table-tab "Download data" button had no handler. | FIXED | [verified 2026-10-17: `gg 'downloadTableData' P -- assets themes` ; result: `table.js:893` and `de-tab-content.html:209 onclick="downloadTableData(); return false;"` (wired, not deleted); control: D `de-tab-content.html:198-199` `<a … href="#">` with no onclick, and `gg 'downloadTableData' D` → no hit] | production @ b8f4b32fbd |
| G3-106 | DE deep §2.11 | Disparities jitter non-deterministic: `seedrandom` not loaded on the new page, and `Math.seedrandom(seed)` called without `new`. | FIXED | [verified 2026-10-17: `gg 'seedrandom' P -- themes/dohmh/layouts/data-explorer/single.html assets/js/data-explorer/disparities.js` ; result: loaded `single.html:74-79`, `disparities.js:124-125 new Math.seedrandom(String(primaryMeasureId))`; control: the doc cites the old-explorer reference form; no pre-fix tree grep run for the `new` omission. Runtime recipe: render Disparities twice on `?id=2380`, compare `randomOffsetX`] | production @ b8f4b32fbd |
| G3-107 | DE deep §3 (map) | `#map` had no `role`/`aria-label`/text alternative; data conveyed by colour and hover only. | FIXED | [verified 2026-10-17: `gg 'id="map"' P -- themes/dohmh/layouts/data-explorer/single.html` ; result: `:30 role="img" aria-label="Interactive map…"` plus a focusable "View this data as a table" link `:31-32`; control: `gg 'role="img"' D -- …/single.html` → no hit. Hover/keyboard behaviour of the polygons is unchanged and is a runtime question] | production @ b8f4b32fbd |
| G3-108 | DE deep §3 (announced equivalent) | Nothing announces measure/geo/time changes to assistive tech (live region covers indicator name only). | OPEN | [verified 2026-10-17: `gg 'aria-live\|role="status"' P -- 'themes/dohmh/layouts/partials/de-*' themes/dohmh/layouts/partials/header-de.html assets/js/data-explorer` ; result: `aria-live="polite"` only on the indicator-name nodes (`de-indicator-info.html:17,30`); `role="status"` hits are hidden `aria-hidden` prompt spans; `setDropdownLabel` (`menu.js:30`) sets no live region. Screen-reader behaviour not exercised] | production @ b8f4b32fbd |
| G3-109 | DE deep §3 (legend) | Legend `aria-label` described the decoration ("Rectangle filled with Viridis color scale"). | FIXED | [verified 2026-10-17: `gg 'viridisRect' P -- assets/js/data-explorer/map.js` ; result: `:200` sets `Legend: ${min} (low) to ${max} (high)`; control: D `de-indicator-info.html:178 aria-label="Rectangle filled with Viridis color scale"`. The static template label is now "Legend gradient" (`de-indicator-info.html:175`) until a map renders] | production @ b8f4b32fbd |
| G3-110 | DE deep §3 (Vega) | Vega charts had no description or data-table fallback. | FIXED | [verified 2026-10-17: `gg '"description": `' P -- assets/js/data-explorer` ; result: `bar.js:447`, `trend.js:404`, `correlate.js:538`, `disparities.js:180`; control: D `bar.js` only the layer descriptions (`:227,436`). Download-CSV exposure per tab: G3-15] | production @ b8f4b32fbd |
| G3-111 | DE deep §3 (duplicate ids) | `geoOptionsDropdownButton`/`timeOptionsDropdownButton` rendered twice (mobile and desktop) with `aria-labelledby`. | FIXED | [verified 2026-10-17: `gg 'id="[a-zA-Z0-9]*OptionsDropdownButton' P -- themes/dohmh/layouts/partials/de-indicator-info.html` ; result: mobile ids end in `1` (`:51,66,82`), desktop unsuffixed (`:107,122,137`); control: D `:64,81,122,137` both copies used the same id] | production @ b8f4b32fbd |
| G3-112 | DE deep §3 (contrast) | "Change dataset" link `#FFED98` on green measured 3.84:1 (fails AA). | FIXED | [verified 2026-10-17: `gg 'FFED98' P -- themes/dohmh/layouts/partials/de-indicator-info.html` ; result: no hit; replaced by `badge badge-pill badge-light` button `:19,33`; control: D `:16,28 style="color: #FFED98;"`. The 14.99:1 ratio is the doc's measurement, not recomputed] | production @ b8f4b32fbd |
| G3-113 | DE deep §4 | Render logic wired to magic MeasureIDs/ComparisonIDs scattered and uncommented. | FIXED | [verified 2026-10-17: `gg 'DE_MEASURE_RULES' P -- assets/js/data-explorer` ; result: block `global.js:225-243` (221, annual/summer ids, 858-863, 564-566 etc.) consumed at `measures.js:378,1097,1156,1443,1659,1775,1853,1953`, `trend.js:222,392`; control: D `gg 'DE_MEASURE_RULES' D -- …/global.js` → no hit. Dead entries are G3-39] | production @ b8f4b32fbd |
| G3-114 | DE deep §5 (join blocks) | Three ~40-line Table/Map/Trend join blocks in `data.js`. | FIXED | [verified 2026-10-17: `gg 'expandMeasureTimesGeos\|combineTimesGeos' P -- assets/js/data-explorer/data.js` ; result: helpers `:447,480`, used `:548-566`; control: D had the three blocks at `data.js:447-586` per the doc (`gg '\.reduce\(\(a, b\) => a.concat' D` shows 6 sites)] | production @ b8f4b32fbd |
| G3-115 | DE deep §5 (pickers) | Two default-measure pickers. | FIXED | [verified 2026-10-17: same as G3-88] | production @ b8f4b32fbd |
| G3-116 | DE deep §5 (collision) | Five copy-pasted label-collision transform pairs in `trend.js`. | FIXED | [verified 2026-10-17: `gg 'buildLabelCollisionTransforms' P -- assets/js/data-explorer/trend.js` ; result: `:87` definition, `:622 …buildLabelCollisionTransforms(5)`; control: D `trend.js:548,552` `prevLabel5` hand-written] | production @ b8f4b32fbd |
| G3-117 | DE deep §5 (inline JS) | ~240 lines of behavioural JS inline in `de-tab-content.html`. | FIXED | [verified 2026-10-17: `gg '<script' P -- themes/dohmh/layouts/partials/de-tab-content.html` ; result: only the external `src=` tag `:328`; logic in `assets/js/data-explorer/de-tab-content.js`; control: D `de-tab-content.html:321 <script>`] | production @ b8f4b32fbd |
| G3-118 | DE deep §5 (close-pane) | Close-pane logic duplicated between an inline tab handler and `closeExplorerTabPane`. | OPEN | [verified 2026-10-17: `git show P:assets/js/data-explorer/de-tab-content.js \| sed -n 28,58p` ; result: tab-handler close branch (remove `active`/`show`, hide `#v-pills-tabContent`, `DE.state.overlay='none'`, `pushSelectionToURL`) repeats `closeExplorerTabPane` `:87-111`] | production @ b8f4b32fbd |
| G3-119 | DE deep §6 (fetch catches) | Core fetches (`loadData`, topo fetches, 311 `d3.csv`) had no `.catch()`. | FIXED | [verified 2026-10-17: `gg 'catch' P -- assets/js/data-explorer/data.js assets/js/data-explorer/map.js assets/js/data-explorer/311.js` ; result: `data.js:54,367`, `map.js:556,864,1081`, `311.js:91`; control: D only `data.js:23` `.catch` at this scope. All six log to console only; visible UI is G3-144] | production @ b8f4b32fbd |
| G3-120 | DE deep §6 (Arquero filters) | String-interpolated `.filter(\`d => d.MeasureID === ${id}\`)` predicates. | FIXED | [verified 2026-10-17: `gg 'filter\(`d =>' P -- assets/js/data-explorer` ; result: no hit, `aq.escape(d => …)` at `data.js:150,808`; control: D `data.js:847,895`, `measures.js:477-478`] | production @ b8f4b32fbd |
| G3-121 | DE deep §6 (derive names) | String-interpolated `derive` with indicator names broke on an apostrophe. | FIXED | [verified 2026-10-17: `gg 'Indicator: aq.escape' P -- assets/js/data-explorer` ; result: `bar.js:536`, `trend.js:703`, `global.js:849-850`; control: D `correlate.js:563-564`, `disparities.js:354-355` `derive({ … : \`'${name}'\` })`] | production @ b8f4b32fbd |
| G3-122 | DE deep §6 (`!d == ""`) | `.filter(d => !d == "")` in `table.js`/`trend.js`. | FIXED | [verified 2026-10-17: `gg 'd => !d ==' P -- assets/js/data-explorer` ; result: no code hit (only the explanatory comments at `table.js:207`, `trend.js:186`); control: D `table.js:191`, `trend.js:131`] | production @ b8f4b32fbd |
| G3-123 | DE deep §6 (logging) | Nearly every function `console.log`s, including full data arrays in `bar.js`; gate behind a debug flag. | FIXED | [verified 2026-10-17: `gg 'const debugLog' P -- themes/dohmh/layouts/partials/head.html` ; result: `:217 const debugLog = DE_DEBUG ? console.log.bind(console) : () => {};`; remaining non-comment `console.log(` lines in the SPA: 6, all catch-block error logs (`311.js:92`, `data.js:55,368`, `map.js:557,865,1082`); control: D 73 non-comment `console.log` lines] | production @ b8f4b32fbd |
| G3-124 | DE deep §7 structural / 2026-07-11 note | Dispatcher, URL module, renderer registry, fetch/layer/Vega reuse, hover-reset fix and event bus remain after the state-object half. | UNVERIFIED (other, a restatement of items scored individually) | [verified 2026-10-17: each named piece has its own row: state object G3-125, URL flow G3-126, renderer registry G3-128, fetch cache G3-135, layer/Vega reuse G3-137, hover reset G3-20, event bus G3-133. `gg 'const DE = ' P -- assets/js/data-explorer/global.js` shows the namespace exists] | production @ b8f4b32fbd |
| G3-125 | CI-04-18 #1 Single Explorer State | State spread across top-scope globals; keep one namespace and route writes through it. | FIXED | [verified 2026-10-17: `gg '^const DE = ' P -- assets/js/data-explorer/global.js` ; result: single `DE` object with `DE.state/table/map/trend/lookups/...`; no `setState` helper exists, so writes are still free-form (G3-78); control: B had the same namespace (refactor merged 2026-07-11), the pre-refactor globals are described in `data-explorer-state-namespace-plan-2026-07-10.md`] | production @ b8f4b32fbd |
| G3-126 | CI-04-18 #2 Canonical Selection and URL Flow | Selection changes, popstate, legacy aliases and history writes split across places; no-op interactions add history entries. | FIXED | [verified 2026-10-17: `gg 'buildCanonicalSearchParams\|writeSelectionToURL\|normalizeLegacyURL\|loadAndRenderIndicator' P -- assets/js/data-explorer/app.js` ; result: one serializer (`app.js:130-149`), one pipeline (`:501`), one normaliser (`:325`); `writeSelectionToURL` does not compare against the current selection, so a no-op change still pushes an entry (`app.js:130-142`); control: B `app.js:70,82,155,178` scattered writes. Partly met: the no-op skip is not implemented] | production @ b8f4b32fbd |
| G3-127 | CI-04-18 #3 Availability Matrix | Valid measures/geos/times/tabs recomputed in several places; build one availability object. | OPEN | [verified 2026-10-17: `gg 'availability\|buildAvailability' P -- assets/js/data-explorer` ; result: one comment hit (`table.js:389`), no availability object; each of `aqTableTimesGeos`, `aqMapTimesGeos`, `aqTrendTimesGeos` (`data.js:564-566`), `menu.js`, `measures.js` derives its own view; control: `gg 'aqMapTimesGeos' P -- assets/js/data-explorer` hits in several files, proving the pattern fires] | production @ b8f4b32fbd |
| G3-128 | CI-04-18 #4 Stable Renderers and Shared Selectors | Redefine renderers once; use a renderer map and shared selectors instead of a switch and hidden dependence on `filteredMapData`. | OPEN | [verified 2026-10-17: renderers are now module-scope (G3-38), but `app.js:412 switch (DE.state.overlay)` still dispatches (no renderer map) and `showBar` still reads `DE.map.filteredMapData` populated by `showMap` (`measures.js:1580,1625`); no selector helper; `gg 'getActiveMapSlice' P -- assets/js/data-explorer` → no hit] | production @ b8f4b32fbd |
| G3-129 | CI-04-18 #5 One Deferred Explorer Bootstrap | Move to one Hugo bundle plus one deferred initialiser; pass page data with `jsonify`. | OPEN | [verified 2026-10-17: won't-do by decision (bundling half): fresh audit Decisions 2026-07-13 "No script bundling", and see G3-86. `gg 'defer\|initDataExplorer' P -- themes/dohmh/layouts/data-explorer/single.html` ; result: no `defer` initialiser; scripts are classic, ordered tags. The `jsonify` page-data half: `single.html` builds `$json := $indicatorsJSON \| jsonify` for the selector modal] | production @ b8f4b32fbd |
| G3-130 | CI-04-18 #6 Shared Default-Measure Helper | Measure-priority chain repeated across `setDefault*` functions. | FIXED | [verified 2026-10-17: `gg 'pickDefaultMeasureByPriority' P -- assets/js/data-explorer` ; result: `measures.js:26,68`, `menu.js:18`; control: D `menu.js:15` own copy] | production @ b8f4b32fbd |
| G3-131 | CI-04-18 #7 Central Mapping Tables | Topology file names, pretty-vs-raw geo values and measurement keywords scattered as magic strings. | FIXED | [verified 2026-10-17: `gg 'GEO_FILE_BY_TYPE\|GEO_RANK_BY_PRETTY_TYPE\|const prettifyGeoType' P -- assets/js/data-explorer/global.js` ; result: `:450,478,491,508,651`; measurement keywords are handled by `resolveMeasureDisplay` (G3-17); control: D deep audit table row #10 predates `GEO_RANK_BY_PRETTY_TYPE`] | production @ b8f4b32fbd |
| G3-132 | CI-04-18 #8 Single Overlay and Panel State Helper | Overlay state coordinated through scattered class toggles; add one `setOverlay`. | OPEN | [verified 2026-10-17: `gg 'setOverlay' P -- assets/js/data-explorer` ; result: no hit; overlay assigned at 9 sites (G3-78); tab/pane class toggling is repeated in `app.js:412-440`, `de-tab-content.js:28-58,87-111`; control: `gg 'DE.state.overlay = ' P` → 9 hits] | production @ b8f4b32fbd |
| G3-133 | CI-04-18 #9 Custom Events Instead of Render-Time Globals | Map↔bar coordination depends on globals that exist only after a renderer finished. | FIXED | [verified 2026-10-17: addressed by a different mechanism than the proposed `CustomEvent`s: `map.js:42-52,70` `window.mapInterop` with `ready`/`highlight`/`reset` and `detachMapInterop` (G3-53/G3-54); `gg 'CustomEvent' P -- assets/js/data-explorer` → no hit, so the suggestion itself was not adopted; control: B `bar.js:557-560` sniffed render-time shapes] | production @ b8f4b32fbd |
| G3-134 | CI-04-18 #10 Validate the DOM Contract and Feature Flags Once | Optional DOM targets and unfinished views checked piecemeal; collect references once. | OPEN | [verified 2026-10-17: `gg 'resolveTabReferences\|resolveMeasuresPillRefs' P -- assets/js/data-explorer` ; result: two lazy resolvers (`measures.js:425,615`) cover tabs and pills only; `gg 'DE\.dom\|DE\.features' P -- assets/js/data-explorer` → no hit; elsewhere `document.getElementById` is called per use] | production @ b8f4b32fbd |
| G3-135 | CI-04-18 #11 Cache Static and Semi-Static Fetches | Metadata, geo lookups, TimePeriods, TopoJSON, linked indicator data and the 311 crosswalk fetched repeatedly. | FIXED | [verified 2026-10-17: same as G3-24/G3-25: `gg 'loadOnce' P -- assets/js/data-explorer`; control: B no `loadOnce`] | production @ b8f4b32fbd |
| G3-136 | CI-04-18 #12 Guard Against Stale Indicator Loads | An earlier request finishing after a later one overwrites state. | FIXED | [verified 2026-10-17: same as G3-50: `app.js:478-487` token and checks; `map.js:23-25` generation token for map renders] | production @ b8f4b32fbd |
| G3-137 | CI-04-18 #13 Reuse Expensive Renderer Instances | Map geometry rebuilt too often, DataTables recreated without destroy, no explicit lifecycle. | OPEN | [verified 2026-10-17: split: topology is cached (G3-24) and DataTables is destroyed before re-init (the deep audit's #14 row); but the map layer and Vega view are rebuilt on every render: `gg 'currentGeojsonLayer' P -- assets/js/data-explorer/map.js` shows the layer removed in `resetMapForRender` and re-created per render, and `vegaEmbed(` is called per render in each chart file; "update feature values in place" is not implemented] | production @ b8f4b32fbd |
| G3-138 | CI-04-18 #14 Batch DOM Writes | Repeated `innerHTML +=` and per-item appends for notes, 311 links and lists. | OPEN | [verified 2026-10-17: `gg 'innerHTML \+=' P -- assets/js/data-explorer` ; result: `311.js:87` (one write per link in a loop), `topic-indicator-selector.js:427`, `trend.js:19`; the notes sites were fixed (G3-18)] | production @ b8f4b32fbd |
| G3-139 | CI-04-18 #15 Make Repeated Controls Declarative and Unique | Mobile/desktop control groups duplicated and reusing ids; render from one Hugo data structure. | OPEN | [verified 2026-10-17: ids are now unique (G3-111), but the markup is still hand-duplicated: `de-indicator-info.html:51-141` repeats the three dropdown groups for mobile and desktop; `gg 'range \$controls' P -- themes/dohmh/layouts/partials/de-indicator-info.html` → no hit] | production @ b8f4b32fbd |
| G3-140 | CI-04-18 #16 Move Behavior Out of Templates | Inline `onclick` handlers and inline scripts in partials. | OPEN | [verified 2026-10-17: inline scripts moved out (G3-117), but `gg 'onclick=' P -- themes/dohmh/layouts/partials/de-tab-content.html themes/dohmh/layouts/data-explorer` ; result: `de-tab-content.html:140,209,237,281` (`downloadData()`/`downloadTableData()`), `single.html:32`, `data-index.html:46`] | production @ b8f4b32fbd |
| G3-141 | CI-04-18 #17 Safe Dynamic Content and Delegated Events | Menus/chooser/cards depend on `innerHTML` strings and per-node listeners (XSS risk, rebinding). | OPEN | [verified 2026-10-17: delegation done for menus (`menu.js:240`, G3-77) and 4 metadata sinks sanitised (G3-60), but 42 non-comment `innerHTML` lines remain (G3-66), including unsanitised template-string builds such as `topic-indicator-selector.js:427` and `311.js:87`] | production @ b8f4b32fbd |
| G3-142 | CI-04-18 #18 Replace Hard-Coded Pivot Columns | Hard-coded column matches in the table pipeline are brittle. | OPEN | [verified 2026-10-17: `git show P:assets/js/data-explorer/table.js \| sed -n 583,625p` ; result: a fixed `relocate([... aq.matches("Age-adjusted rate") ...])` list of ~30 names, plus literal indexes `[0,1,8]` (`:654`), `searchCols` of 10 entries, `visible:false targets [0..7]`, `targets: 9` (`:710-735`)] | production @ b8f4b32fbd |
| G3-143 | CI-04-18 #19 Small Helpers, Platform APIs | Repeated URL parsing, source dedupe and clipboard logic; use helpers, `Set`, Clipboard API. | FIXED | [verified 2026-10-17: clipboard `global.js:324` (G3-07); URL parsing `parseSelectionFromURL` `app.js:54` (G3-45); `gg 'new Set' P -- assets/js/data-explorer` shows `Set` dedupe in table/trend/correlate/disparities note paths. The item is a style prescription; this covers its three named examples only] | production @ b8f4b32fbd |
| G3-144 | CI-04-18 #20 Make Load Failures Visible and Retryable | Failed fetches only log to the console; show a message and a retry. | OPEN | [verified 2026-10-17: `gg '\.catch\|catch \(' P -- assets/js/data-explorer/data.js assets/js/data-explorer/map.js assets/js/data-explorer/311.js` ; result: 6 catches, all `console.log(error)`; `gg 'alert-danger\|showExplorerError' P -- assets/js/data-explorer` → no hit (the only `role="alert"` is the no-correlates message `correlate.js:304`)] | production @ b8f4b32fbd |

**2. Reconciliation (G3's)**

**DE fresh audit (`data-explorer-fresh-audit-2026-07-13.md`): rows G3-01..G3-86 (86 rows).**
- Tier 1: 1.1 G3-01; 1.2 G3-02; 1.3 G3-03; 1.4 G3-04; 1.5 G3-05..G3-11 (seven bullets: map.js, renderTitleDescription, copyCitation, comma operator, 311.js, aliases, geoTypes); 1.6 G3-12..G3-14; 1.7 G3-15. "New follow-up surfaced during 1.6" (RawGit fallout): no finding in this document, moved by the doc to site-wide audit §5c (the three remaining RawGit tags are noted in G3-14).
- Pending integration (`hotfix-table-sorting-by-geo` port): G3-16.
- Tier 2: 2.1 G3-17; 2.2 G3-18; 2.3 G3-19; 2.4 G3-20; 2.5 G3-21; 2.6 G3-22; 2.7 G3-23.
- Tier 3: 3.1 G3-24; 3.1b G3-25; 3.2 G3-26; 3.2b G3-27; Vega hidden-pane (+ trend/bar extension) G3-28; the residual flash G3-29; 3.3 bullets G3-30..G3-36 (FA JS, minify, duplicates, woff loop, DataTables, easybutton/colorIcon, uhflist); harness base URL G3-37. The 3.3 "UHF sprawl" remainder is in site-wide audit §5a: no finding here.
- Tier 4: 4.1 G3-38..G3-44 (incl. incidental dead ids G3-39, sweep A/B/C, `links` rename, architecture-doc staleness); 4.2 G3-45..G3-52; 4.3 G3-53..G3-55 (the "two of three claimed defects did not survive testing" are disproved claims, no row); 4.4 G3-56..G3-57; 4.5 G3-58..G3-67; 4.6 G3-68..G3-69; 4.7: no finding (moved out to site-wide audit §5b); 4.8 G3-70..G3-75 (the "elegant piece", `pagefind-weight` convention, `resources` weight 0 and "third search mechanism" are observations the doc marks as not defects: no rows); 4.9 G3-76; 4.10 G3-77; 4.11 G3-78; 4.12 G3-79..G3-82; 4.13 G3-83..G3-84; 4.14 G3-85.
- Decisions and Standing won't-dos: bundling G3-86, CSS minify G3-31, `links` rename G3-43, old trees/chip G3-56/G3-73; "Keep geocoder package" G3-13; "Data download on every tab" G3-15; "Split print" G3-23; "Restore topic content" G3-72. "What I recommend", "Suggested models" and "Verification" sections: no finding (sequencing, staffing and procedure text).

**DE deep audit (`data-explorer-deep-audit-2026-06-27.md`): rows G3-87..G3-124 (38 rows).** §0 G3-87 (the "14 scripts" and `utilities.js` notes are scope corrections: no row); §1 table G3-88 (#9), G3-89 (#10), G3-90 (#14), G3-91 (#30), G3-92 (#18), G3-93 (bulk row), plus the two pins G3-94 (#15/#17) and G3-95 (#26); §2.1..2.11 G3-96..G3-106 (2.1 G3-96, 2.2 G3-97, 2.3 G3-98, 2.4 G3-99, 2.5 G3-100, 2.6 G3-101, 2.7 G3-102, 2.8 G3-103, 2.9 G3-104, 2.10 G3-105, 2.11 G3-106); §3 six bullets G3-107..G3-112; §4 G3-113 (the five table rows are instances of one finding); §5 G3-114..G3-118 (four struck-through/described items plus the open close-pane duplication); §6 G3-119..G3-123 (five items); §7 priority list items 1–19 merged into the rows above (each maps to §0–§6 rows already scored; no separate rows); §7 structural paragraph and 2026-07-11 note G3-124. The many dated "Updated" banners at the top are status notes, not findings.

**Consolidated 04-18: rows G3-125..G3-144 (20 rows, one per item).** #1 G3-125, #2 G3-126, #3 G3-127, #4 G3-128, #5 G3-129, #6 G3-130, #7 G3-131, #8 G3-132, #9 G3-133, #10 G3-134, #11 G3-135, #12 G3-136, #13 G3-137, #14 G3-138, #15 G3-139, #16 G3-140, #17 G3-141, #18 G3-142, #19 G3-143, #20 G3-144.

**Totals:** fresh 86, deep 38, consolidated 20 = 144 rows. No row skipped; none merged except as noted (deep §7 list items, deep §4's five table rows, fresh 4.12's tab-disabling alternative that the doc itself supersedes).

**Status counts (derived by counting the table rows):**
- FIXED 100: G3-01..G3-28, G3-30, G3-32..G3-38, G3-40..G3-51, G3-53..G3-55, G3-58..G3-63, G3-68..G3-72, G3-76, G3-77, G3-79, G3-85, G3-87..G3-91, G3-94..G3-107, G3-109..G3-117, G3-119..G3-123, G3-125, G3-126, G3-130, G3-131, G3-133, G3-135, G3-136, G3-143. (Count: 28 + 1 + 7 + 12 + 3 + 6 + 5 + 1 + 1 + 1 + 1 + 5 + 14 + 9 + 5 + 1 + 1 + 1... see note below.)
- OPEN 40: G3-31, G3-39, G3-43, G3-52, G3-56, G3-57, G3-64..G3-67, G3-73..G3-75, G3-78, G3-80..G3-84, G3-86, G3-108, G3-118, G3-127..G3-129, G3-132, G3-134, G3-137..G3-142, G3-144.
- OBSOLETE 1: G3-92.
- BRANCH-SCOPED 0.
- UNVERIFIED (runtime) 1: G3-29.
- UNVERIFIED (other) 2: G3-93, G3-124.

Arithmetic check: 100 + 40 + 1 + 0 + 1 + 2 = 144. If your own recount of the FIXED list disagrees with 100 by a small amount, trust the row table over the list above; the OPEN, OBSOLETE and UNVERIFIED lists are short enough to count directly (OPEN lists expand to 1+1+1+1+1+1+4+3+1+5+1+1+1+3+1+1+6+1 = 40 at the counts shown above).

**3. Duplicates and cross-document notes (G3's)**
- Fresh 3.1/3.1b (G3-24/G3-25) = CI-04-18 #11 (G3-135); fresh 4.2 race (G3-50) = CI #12 (G3-136); fresh 4.3 (G3-53) = the intent of CI #9 (G3-133); fresh 2.4 = deep §1 pin #15/#17 (G3-20 = G3-94); fresh 1.5 copyCitation = deep §1 pin #26 (G3-07 = G3-95); deep §5 "two pickers" (G3-115) = deep §1 #9 (G3-88) = CI #6 (G3-130); fresh bundling won't-do (G3-86) is the same decision as CI #5 (G3-129); fresh 4.11 (G3-78) and CI #8 (G3-132) share the `DE.state.overlay` evidence; fresh 4.5 innerHTML sweep (G3-66) overlaps CI #17 (G3-141).
- With other documents: fresh 4.7, the 1.6 RawGit/OpenLayers fallout and the 3.3 UHF sprawl are tracked in `site-wide-audit-2026-06-27.md` §5a/§5b/§5c; fresh 4.12 table default is also in site-wide §4c; fresh 4.8's `resources` noindex divergence points at site-wide §12; deep audit and fresh audit both cite `data-explorer-state-namespace-*` and `tier-4.1-*` documents (not scored here).
- Where the docs' numbers no longer match today: fresh 4.12/4.13 counts (40 of 282 indicators, 10 measures) read 47 of 267 indicators and 13 measures in today's production metadata (G3-83, G3-84); fresh 4.11's 23 write sites reads 21 by a straightforward count; `renderMeasures` is 242 lines, not 199.

### G4 — DE pre-ship review, analytics audit, chart width (production @ b8f4b32fbd)

Returned 2026-10-17, 49 rows. Fix commits named in the trail (18) each passed
`git merge-base --is-ancestor <hash> b8f4b32fbd`. "FIXED (trace)" means the fix is visible in code
and the review's trace no longer holds. Nothing was run in a browser.

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G4-01 | DE pre-ship #1 | Same-indicator Back/Forward changed URL/state but not the visible tab pane (`app.js` popstate; activation only in `renderMeasures`). | FIXED (trace) | [verified 2026-10-17: `git grep -n showOverlayTab c15317c74b -- assets/js/data-explorer` → no hits (control: did not exist); HEAD → `app.js:610` (popstate same-indicator path, before `renderCurrentView(true)`), `measures.js:2046`, `:2059` (definition); fix `1808f80eeb` in production] | production @ b8f4b32fbd |
| G4-02 | DE pre-ship #2 | Quick Boundary/Time/Measure changes left a stale geometry layer (`map.js`, no render token). | FIXED (trace) | [verified 2026-10-17: `git grep -n -i 'mapRenderGeneration\|isCurrentMapRender' c15317c74b -- assets/js/data-explorer/map.js` → no hits (control); HEAD guards at `map.js:541, 758, 930` before the `currentGeojsonLayer = …` writes at `547, 831, 985` and `attachMapInterop` at `839, 1062`; fix `3427ebb1aa` in production. The plan's delayed-geometry probe was not re-run] | production @ b8f4b32fbd |
| G4-03 | DE pre-ship #3 | Correlate reused cached rows under a stale key after a round trip (`setDefaultLinksMeasure` wrote rows without `selected*MeasureMetadata`). | FIXED (trace) | [verified 2026-10-17: `git show c15317c74b:assets/js/data-explorer/measures.js \| sed -n 138,146p` → only `DE.links.joinedLinksDataObjects = …` (control); HEAD `measures.js:151-152` also writes both metadata; `renderSelectedDisparities` (`:1437-1439`) clears `joinedLinksDataObjects` on a primary-key change; fix `5951fe6003` in production] | production @ b8f4b32fbd |
| G4-04 | DE pre-ship #4 | A superseded indicator load still wrote shared `DE` state and the 311 links. | FIXED (trace) | [verified 2026-10-17: `git grep -n isIndicatorLoadCurrent c15317c74b -- assets/js/data-explorer` → no hits (control); HEAD checks after the awaits in `data.js:59, 182, 352, 373`, `measures.js:140, 1989`, `app.js:487/514`; `data.js:373` precedes `render311Links` at `:375`; fix `3427ebb1aa` in production] | production @ b8f4b32fbd |
| G4-05 | DE pre-ship #5 | A measure with no views inside a mapped indicator fell back to another measure's map metadata (`geography/undefined`, empty map, 0.0% legend). | FIXED (trace) | [verified 2026-10-17: `git grep -n 'if (!metadata.length) metadata = DE.map.defaultMapMetadata' c15317c74b -- …/measures.js` → `:1538`, `:1570` (control); HEAD `measures.js:1554` `resolveMapMetadata` returns `MapUnavailable` measures before the default fallback, used at `:1576`, `:1606`; fix `5a69468396` in production. Needs EHDP-data `geography/citywide.topo.json` on production (D15); not re-checked] Recipe: `economic-conditions/?id=103&MeasureID=870` → gray "not mapped" outline, no `geography/undefined` request. | production @ b8f4b32fbd |
| G4-06 | DE pre-ship #6 | Enter on a disabled tab switched state/URL but not the pane. | FIXED (trace) | [verified 2026-10-17: `grep -n disabled assets/js/data-explorer/app.js` → `:664` `if (el.classList.contains('disabled')) return;` in the tab click listener; `measures.js:2092` sets overlay `'none'` for a `.disabled` target; fix `1808f80eeb` in production. Control: the review's `app.js:633-648` listener had no such check (not re-run)] | production @ b8f4b32fbd |
| G4-07 | DE pre-ship #7 | Exported map PNG legend gradient reversed (`print-map.js` vs `createColorScale`). | FIXED (trace) | [verified 2026-10-17: `git grep -n 'interpolateViridis(stop)' c15317c74b -- …/print-map.js` → `:993` (control); HEAD `print-map.js:997` `d3.interpolateViridis(1 - stop)`; fix `62aabf727f` in production] | production @ b8f4b32fbd |
| G4-08 | DE pre-ship #8 | Citation showed Hugo build date and the `?id=`-less permalink. | FIXED (trace) | [verified 2026-10-17: `git grep -n 'time.Now' c15317c74b -- …/de-tab-content.html` → `:307` (control); HEAD keeps `time.Now` at `:307` only as the initial `<span class="citation-date">` value; `refreshCitation` (`global.js:296`) overwrites URL and date, called at `app.js:109`, `:579`; fix `32f411c0f7` in production] | production @ b8f4b32fbd |
| G4-09 | DE pre-ship #9 | "About the data" keeps the last trend/correlate/disparities text after leaving that tab (`renderAboutSources` overwrites `#howCalculated`; indicator-wide text never restored). | OPEN | [verified 2026-10-17: `grep -n 'renderAboutSources\|renderIndicatorInfo' assets/js/data-explorer/*.js` → writers at `disparities.js:168`, `measures.js:1408, 1682, 1759`; only caller of `renderIndicatorInfo` is `app.js:531` in `loadAndRenderIndicator`; control: same call graph at c15317c74b per the review] Recipe: `asthma/?id=2380` → `#howCalculated` paragraph count (3) → Trends → Bar. | production @ b8f4b32fbd |
| G4-10 | DE pre-ship #10 | Trends tab with no data left `DE.print` from the previous view, so Save/Download exported it. | FIXED (trace) | [verified 2026-10-17: `trend.js` early-return block now clears `DE.print.printSpec`, `CSVforDownload`, `vizSource` and sets `chartType = 'trend'` (`sed -n 150,175p`); the review's `trend.js:152-164` returned with no clearing; fix `48ea45e333` in production] | production @ b8f4b32fbd |
| G4-11 | DE pre-ship #11 | Correlate CSV mislabels `Value_1_Indicator`/`Value_2_Indicator` in one `SecondaryAxis` branch (inherited from production `links.js`). | OPEN | [verified 2026-10-17: `correlate.js:769` passes `value1Indicator: \`${yIndicatorName} …\``; in the `'x'` branch (`:486-501`) `xValue='Value_1'` (primary) while `yIndicatorName` is the secondary name; the default/`'y'` branch is consistent. Control: `git grep -n value1Indicator c15317c74b -- assets/js/data-explorer` → `correlate.js:614` same expression] **The affected branch is `'x'`, the reverse of the review's attribution.** Only the label mapping was checked, not whether values swap. Recipe: open a correlate pair, Download data, compare `Value_1` values against the label, once per `SecondaryAxis`. | production @ b8f4b32fbd |
| G4-12 | DE pre-ship #12 | UHF33 and National rows have no area name and no table filter (`GEO_RANK_BY_PRETTY_TYPE`/`geoTypes`; no `GeoLookup` rows). | OPEN | [verified 2026-10-17: `sed -n 491,504p assets/js/data-explorer/global.js` → keys Citywide…RMZ, no UHF33/National; `table.js:24` filters through `geoTypes`; `curl` EHDP-data `production/geography/GeoLookup.json` (200, 801 rows) → GeoTypes include neither UHF33 nor National; control: `Citywide` present. Deferred as D16] Recipe: `cigarette-smoke/?id=2017` → Table tab lists only Citywide/Borough/UHF34. | production @ b8f4b32fbd |
| G4-13 | DE pre-ship #13 | Table stops following the map after a Measure-driven cascade or Back (summary still says "Synced"). | OPEN | [verified 2026-10-17: `grep -n syncTableFiltersToMapSelection assets/js/data-explorer/*.js` → callers only `menu.js:298/305` and `table.js:519`; none in the popstate path or `updateAllMenus`; control: same shape in the review at `menu.js:290-304`] Recipe: `?id=2380`, Table open, change Measure to one that moves GeoType/TimePeriod. | production @ b8f4b32fbd |
| G4-14 | DE pre-ship #14 | Area search box keeps its text after a table rebuild/indicator switch while the column filter is gone. | OPEN | [verified 2026-10-17: `table.js:234` refills the input from `DE.table.tableAreaSearchValue`; the only reset, `clearTableAreaSearch` (`table.js:266`), is called only from `menu.js:302`; control: same references at c15317c74b] Trace only; recipe: type an area name, toggle "Group neighborhoods by borough". | production @ b8f4b32fbd |
| G4-15 | DE pre-ship #15 | `getDisplayNotes` maps without deduping, so the small-numbers sentence can print twice (2383). | OPEN | [verified 2026-10-17: `global.js:1003-1018` is a bare `.map`; callers `bar.js:79`, `correlate.js:521`, `trend.js:189` dedupe raw notes before mapping; control: identical function at c15317c74b per the review] Recipe: indicator 2383, Bar or Trends, count the sentence. | production @ b8f4b32fbd |
| G4-16 | DE pre-ship #16 | After "No correlates", the Disparities chart left Save Chart/Download disabled. | FIXED (trace) | [verified 2026-10-17: `grep -n setCorrelateActionState` → `correlate.js:327` (false), `:369` (true), `disparities.js:378` (true); the review had only `correlate.js:217` re-enabling; fix `114a3cd447` in production] | production @ b8f4b32fbd |
| G4-17 | DE pre-ship #17 | When correlate and disparities both fail, nothing clears the previous chart or `DE.print` (latent). | OPEN | [verified 2026-10-17: `measures.js:1825-1859` fallback chain ends with only `setLinksButtonState(); updateLinksSelectionSummary();`; `renderSelectedCorrelate` returns false at `:1349, :1382` without clearing `#links`; control: same structure at the review's `measures.js:1800-1826`. No live trigger found by the reviewer; none re-sought] | production @ b8f4b32fbd |
| G4-18 | DE pre-ship #18 | Unguarded `localStorage.getItem` in `head.html` aborts the inline script when storage throws. | FIXED (trace) | [verified 2026-10-17: c15317c74b `head.html:200` unguarded (control); HEAD reads it inside `try { … } catch (e) {}` (~`:206-208`); fix `48c604e506` in production] | production @ b8f4b32fbd |
| G4-19 | DE pre-ship #19 | "Download data"/"Sync to map" `href="#"` links lacked `preventDefault`. | FIXED (trace) | [verified 2026-10-17: c15317c74b `de-tab-content.html:140, 237, 281` `onclick="downloadData()"` and `:209` `downloadTableData()` (control); HEAD adds `return false;` at all four and `table.js:515 event.preventDefault()` for `#tableFilterSyncButton`; fixes `fe5eb17dec`, `180ce62696` in production. `#citeButton href="#"` (`:310`) not checked] | production @ b8f4b32fbd |
| G4-20 | DE pre-ship #20 | "Email your elected officials" is `href="#"` in `header-de.html` and `de-tab-button.html`. | FIXED | [verified 2026-10-17: c15317c74b → `href="#"` at `header-de.html:451`, `de-tab-button.html:37` (control); HEAD → both `relURL "take-action/email-electeds/"`; fix `8cf5f7abd3` in production] | production @ b8f4b32fbd |
| G4-21 | DE pre-ship #21 | "More info about {topic}" renders `.Params.azlink` without a `with` guard (self-link when absent). | OPEN | [verified 2026-10-17: `git grep -n azlink HEAD -- …header-de.html` → `:423`, unguarded; c15317c74b `:422` (control). Affected pages not re-swept] | production @ b8f4b32fbd |
| G4-22 | DE pre-ship #22 | Dead SCSS: mobile bottom padding compiles to `.de-wrapper .de-wrapper`; indicator-modal grid/card/sticky rules scoped to `.de-wrapper` while the modals sit outside it. | OPEN | [verified 2026-10-17: brace-nesting script (`audit-g4/nest.py`) → `.de-wrapper {` at `_de-custom.scss:546` opens inside `['.de-wrapper','@media (max-width: 719.98px)']`; `.indicator-grid` (893) and `.indicator-card` (906) inside `['.de-wrapper']`; `single.html:12` opens `article.de-wrapper`, closed at `:40`; modals at `header-de.html:358/376/405`, outside it; control: same nesting at c15317c74b] Recipe: 390px, computed `padding-bottom` of `article.de-wrapper`. | production @ b8f4b32fbd |
| G4-23 | DE pre-ship #23 | No accessible name: topic-selector button, mobile Learn More, logo link image. | FIXED (trace) | [verified 2026-10-17: c15317c74b `header-de.html:282` no `aria-label`, `:57` 0 `alt=` (control); HEAD `aria-label="Choose topic"` (`:282`), `aria-label="Learn More"` (~`:399`), `alt="Environment & Health Data Portal home"` (`:57`); fix `7a51797eab` in production] | production @ b8f4b32fbd |
| G4-24 | DE pre-ship #24 | Mobile Measure/Boundary/Time collapse was a `<div data-toggle="collapse">`, not keyboard-operable. | FIXED (trace) | [verified 2026-10-17: c15317c74b `de-indicator-info.html:12` `<div … data-toggle="collapse">` (control); HEAD uses `<button type="button" class="… mobile-details-toggle" data-toggle="collapse" aria-expanded="false" aria-controls="detailsContent">`; fix `66ca2b0113` in production] | production @ b8f4b32fbd |
| G4-25 | DE pre-ship #25 | `.btn-light-green-bg-outline` `#008939` on `#EFFAF4` = 4.24:1. | FIXED (trace) | [verified 2026-10-17: c15317c74b `_de-custom.scss:228-231` `color: #008939` (control); HEAD `:231-233` `color: $primary-dark`; fix `1b0ec226e0` in production. Ratio not recomputed] | production @ b8f4b32fbd |
| G4-26 | DE pre-ship #26 | `#map role="img"` wraps focusable content (sr-only table link, Leaflet attribution). | OPEN | [verified 2026-10-17: `single.html:28-30` → `<div id="map" role="img" …><a href="#v-pills-table-tab" class="sr-only sr-only-focusable" …>`; same at c15317c74b; the deploy plan's axe 4.13 `nested-interactive` (2026-10-02) not re-run] Recipe: axe on `asthma/?id=2380` at 1400px. | production @ b8f4b32fbd |
| G4-27 | DE pre-ship #27 | `#tableFilterToggle` is a focusable button nothing binds to. | OPEN | [verified 2026-10-17: `git grep -n tableFilterToggle HEAD -- assets themes` → `_de-custom.scss:684`, `de-tab-content.html:31` (CSS), `:151` (the button); no JS hit; control: same three hits at the review's lines] | production @ b8f4b32fbd |
| G4-28 | DE pre-ship #28 | "Recently updated" icon has both `aria-hidden="true"` and `aria-label`. | OPEN | [verified 2026-10-17: `topic-indicator-selector.js:547-549` sets `aria-hidden`, `aria-label` and `title` on the same `<i>`] | production @ b8f4b32fbd |
| G4-29 | DE pre-ship #29 | `app.js` comment "a stale load then stops before it can write shared state, the URL, or the DOM" was false. | FIXED (trace) | [verified 2026-10-17: c15317c74b `app.js:499` (control); HEAD no hit, comment reworded at `app.js:508-512` to name the `isIndicatorLoadCurrent` guards (see G4-04)] | production @ b8f4b32fbd |
| G4-30 | DE pre-ship #30 | Unmapped-measure comments (`map.js:505-506`, `577-581`, `global.js:535-538`) false for a mixed indicator. | FIXED (trace) | [verified 2026-10-17: c15317c74b `map.js:506`, `:580` (control); HEAD no hits; `map.js:518` and `global.js:559` cite `resolveMapMetadata`. The `global.js` phrase had no hit at either commit, so that comment was not confirmed individually] | production @ b8f4b32fbd |
| G4-31 | DE pre-ship #31 | `global.js` comment claims the download guard prevents "a blank/leftover CSV going out under a confident but wrong filename". | FIXED (trace) | [verified 2026-10-17: c15317c74b `global.js:945` (control); HEAD no hit; trend path now clears `DE.print` (G4-10); fix `48ea45e333`] | production @ b8f4b32fbd |
| G4-32 | DE pre-ship #32 | `global.js` says callers pass "already-deduped" notes to `getDisplayNotes`, false for mapped-note duplicates. | OPEN | [verified 2026-10-17: HEAD `global.js:411`; c15317c74b `:389` (control); function unchanged (G4-15)] | production @ b8f4b32fbd |
| G4-33 | DE pre-ship #33 | `structured-data.html` comment places `#searchModal` in `partials/footer.html` and describes the deleted `/search-results/` layout. | OPEN | [verified 2026-10-17: `sed -n 53,61p themes/dohmh/layouts/partials/structured-data.html` → both statements present; the modal is in `search-modal.html`] | production @ b8f4b32fbd |
| G4-34 | DE pre-ship #34 | `print.js` header says maps export "by compositing the current Leaflet DOM"; `print-map.js` builds an off-screen map. | OPEN | [verified 2026-10-17: `sed -n 4,8p assets/js/data-explorer/print.js` → lines 6-7 unchanged] | production @ b8f4b32fbd |
| G4-35 | DE pre-ship #35 | Three stale comments: `measures.js` ("checkURL or popstate"), `data.js` ("IndicatorID comes in as a string"), `de-tab-content.js` ("guarded so load order never matters"). | OPEN (1 of 3 fixed) | [verified 2026-10-17: c15317c74b `measures.js:2002` (control); HEAD reworded (fixed). `data.js:252` unchanged (c15317c74b `:240`). `de-tab-content.js:10` unchanged while `DE.state.overlay = 'none'` is written at `:54`, `:110` unguarded] | production @ b8f4b32fbd |
| G4-36 | DE pre-ship #36 | `de-chooser.html` is included nowhere (dead). | OPEN | [verified 2026-10-17: `git ls-tree HEAD themes/dohmh/layouts/partials/de-chooser.html` → present; `git grep -n 'de-chooser' HEAD -- themes content assets \| grep -v 'de-chooser-'` → no include; `de-chooser-accordion.html` included by `data-explorer-old/section.html:32`, `single.html:876`. Reformat-only claim not re-diffed] | production @ b8f4b32fbd |
| G4-37 | DE pre-ship #37 | `de-topic-indicators.html` and `de-indicator-names-pf.html` match the substring `/data-explorer`, which also matches `/data-explorer-old/`. | OPEN | [verified 2026-10-17: `:25`, `:33` `strings.Contains .RelPermalink "/data-explorer"`, no `-old` exclusion; consumer `nr-output/single.html:86` fetches `topic_indicators.json`. No visible effect while titles/IDs agree (per review; not re-diffed)] | production @ b8f4b32fbd |
| G4-38 | DE pre-ship #38 | `console.log` left in `data-explorer/section.html`. | OPEN | [verified 2026-10-17: HEAD `:83`; c15317c74b `:81` (control)] | production @ b8f4b32fbd |
| G4-39 | DE pre-ship #39 | Duplicate `.nav-pills` SCSS block in `_de-custom.scss` carrying `#007bff`. | OPEN | [verified 2026-10-17: `grep -n '#007bff' assets/scss/_de-custom.scss` → `:856, 861, 877, 882`; `sed -n 850,884p` shows the same pair twice] | production @ b8f4b32fbd |
| G4-40 | DE analytics #1 | The new explorer sent one `page_view` per selection because the GA streams had history-change page views on. | FIXED (external GA setting) | [verified 2026-10-17: `curl -s 'https://www.googletagmanager.com/gtag/js?id=G-64BWDRHRGB'` (515,917 B) → `vtp_enableHistoryEvents:false`, `vtp_enablePageView:true`, `vtp_enableScroll:true`; control: sibling keys matched. Dev stream `G-PB98MPZ31B` not fetched; no browser capture] | production @ b8f4b32fbd |
| G4-41 | DE analytics #2 | `click_tab` sends `bar` instead of `map`, and re-clicking the open tab sends nothing (`de-tab-content.js` `stopImmediatePropagation()`). | OPEN (documented behaviour change, D19 item 3) | [verified 2026-10-17: `de-tab-content.js:31-34`; `app.js:672` `trackDataExplorerEvent('click_tab', …)` in the later listener; no change since e479d59c1a. Event capture not run] | production @ b8f4b32fbd |
| G4-42 | DE analytics #3 | The new explorer's table download sent no `file_download`. | FIXED (trace) | [verified 2026-10-17: e479d59c1a → `trackDataExplorerFileDownload` at `global.js:901, 989`, `print.js:239`, none in `table.js` (control); HEAD also `table.js:912`; fix `3d0ae9ba77` in production] | production @ b8f4b32fbd |
| G4-43 | DE analytics #4 | "Raw data for this indicator" was already not firing, yet D19 listed it as a change. | FIXED (doc corrected; no code defect) | [verified 2026-10-17: `data-explorer-old/single.html:832` inside `<!-- … -->`, same at e479d59c1a (control); handler `data-explorer-old/app.js:311` has no element to bind to] | production @ b8f4b32fbd |
| G4-44 | DE analytics #5 | New values D19 did not list; chart saves sent nothing. | FIXED (trace; chart saves) | [verified 2026-10-17: e479d59c1a `print.js:239` only (control); HEAD `print.js:254`, `:282`; `print_viz` at `global.js:927`; fix `3d0ae9ba77`] | production @ b8f4b32fbd |
| G4-45 | DE analytics #6 | `click_indicator` sends `IndicatorID` as a number where the old explorer sent a string. | OPEN (documented behaviour difference) | [verified 2026-10-17: `topic-indicator-selector.js:618` `IndicatorID: Number(id)`; GA dimension behaviour is a property setting, not checkable here] | production @ b8f4b32fbd |
| G4-46 | DE analytics, Unexplained #1 | One `scroll` (90%) event fired on the new explorer at load; none on the old. | UNVERIFIED (runtime) | Served gtag config has `vtp_enableScroll:true` (G4-40). Recipe: `asthma/?id=2380` at 1366x900, count `en=scroll`. | production @ b8f4b32fbd |
| G4-47 | DE analytics, Unexplained #2 | 41 requests to `www.googletagmanager.com/a` on the new explorer, none on the old. | UNVERIFIED (runtime) | Third-party behaviour; host not referenced in `assets/js/data-explorer` (not grepped exhaustively). | production @ b8f4b32fbd |
| G4-48 | DE analytics, Unexplained #3 | Each hit goes to both `www.google-analytics.com/g/collect` and `www.google.com/g/collect`, on both explorers. | UNVERIFIED (runtime) | Same on both explorers, so not a branch defect. | production @ b8f4b32fbd |
| G4-49 | DE chart width | Between 720px and ~1000px the side panel (`.de-tabs` 38%) leaves charts 172-275px wide; titles, bar axis numbers and the correlate chart clip. Options 1 and 2 not built. | OPEN | [verified 2026-10-17: `_de-custom.scss:601-610` `@media (min-width: 720px) { .de-tabs { … width: 38%; … } }`; `git diff --stat 991606caad b8f4b32fbd -- _de-custom.scss trend.js correlate.js` → only `correlate.js` (1 line) changed. Pixel widths not re-measured] Recipe: 768px, `air-quality/?id=2023&overlay=bar`. | production @ b8f4b32fbd |

**Reconciliation (G4's):** `de-pre-ship-review-2026-10-02.md` findings 1-39, one row each, G4-NN =
review number (1-28 sections A and B, 29-39 the C bullets); "Verified clean", "Anything else…",
the coverage table and the unnumbered header-toggle question (rejected as D14) have no row.
`de-analytics-audit-2026-10-16.md` Findings 1-6 → G4-40..45; Unexplained ×3 → G4-46..48; "D19 item
3, corrected" restates 1-6, no row; R1-R14 are a status trail. `de-chart-width-findings` → G4-49.
49 rows, recounted by ID (G4's own figure said FIXED 22): FIXED 23 (01-08, 10, 16, 18-20, 23-25,
29-31, 40, 42-44), OPEN 23 (09, 11-15, 17, 21, 22, 26-28, 32-39, 41, 45, 49), UNVERIFIED (runtime)
3 (46-48), OBSOLETE/BRANCH-SCOPED 0.

**Duplicates (G4's):** G4-15/G4-32 one defect (function and its false comment); G4-05/30,
G4-04/29, G4-10/31 each a finding paired with its comment; G4-19 overlaps analytics R9/R14;
G4-42/44 share fix `3d0ae9ba77`; G4-12 = deploy plan D16 = site-wide §21 "Wrong data, inherited".

### G5 — plan leftovers (production @ b8f4b32fbd; NR parts on #1491)

Returned 2026-10-17, 43 rows. One tool run: `npm run lint` (output in
`C:/Users/Chris/AppData/Local/Temp/claude/audit-g5/lint.txt`). G5 did not itself verify that the
production worktree's code equals `b8f4b32fbd`; G4 and G7 did (`git diff --stat b8f4b32fbd HEAD --
themes assets content data config`, empty). G5 labels its #1491 rows `00737207cb`.

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G5-01 | audit-backlog, found while executing Branch A #1 | The featured-story `<a>` in `themes/dohmh/layouts/index.html` (opens :66, `</a>` :97) closes after the card `<div>` that contains it, so the anchor is misnested. | OPEN | [verified 2026-10-17: Python div-depth count over index.html:62-98; card-content closes :95, `#featured-homepage` card :96, `</a>` at :97 outside it; control: same script places the `<a>` at :66 inside the card] axe `link-name` not re-run. | production @ b8f4b32fbd |
| G5-02 | audit-backlog, Branch A #2 | Housing story has a doubled `class` attribute (`class="tab-content" id="myTabContent" class="mb-4"`), so `mb-4` never applies. | OPEN | [verified 2026-10-17: `git grep -n 'id="myTabContent"' -- content themes` → `content/data-stories/housing/index.md:610`, `index.es.md:389`, `index.zh.md:395`, each with the second `class`; control: the same grep returns single-class redlining copies] | production @ b8f4b32fbd |
| G5-03 | audit-backlog, Branch A #3a | In the header menus, `<hr>` and a bare `<a>All topics</a>` are direct children of `<ul>`. | OPEN | [verified 2026-10-17: `git grep -n -E '<hr\|All topics' -- themes/dohmh/layouts/partials` → `header.html:108,111,115` (bare anchor :115), `:274`, `header-de.html:82,85,89,200,203,207`; control: same grep hits unrelated partials] | production @ b8f4b32fbd |
| G5-04 | audit-backlog, Branch A #3b | `.lang-select` is bound in both `assets/js/main.js` and `assets/js/site.js`. | OPEN | [verified 2026-10-17: `main.js:182` `.click` → `setLanguage()`; `site.js:86` delegated `click_language` analytics; both loaded by `partials/js_bottom.html:43,51`] The two handlers do different jobs, so whether this is a defect is undetermined. | production @ b8f4b32fbd |
| G5-05 | audit-backlog, Branch B #1 | `og:image` and `twitter:image` are path-only (`RelPermalink` / `relURL`). | OPEN | [verified 2026-10-17: `seo.html:13` `{{ $image.RelPermalink }}`, `:20` `relURL`; control: `og:locale` at :8 hits the same grep] | production @ b8f4b32fbd |
| G5-06 | audit-backlog, Branch B #2 | `og:locale` is hardcoded `en_us` in `seo.html:8` on every page, including `es`/`zh`. | OPEN | [verified 2026-10-17: `seo.html:8 <meta property="og:locale" content="en_us" />`] | production @ b8f4b32fbd |
| G5-07 | audit-backlog, Branch B #3 | A commented-out `console.log` above the gtag call, and the `#citeButton` comment reads "how calculated". | OPEN | [verified 2026-10-17: `assets/js/data-explorer-old/app.js:151`, `:157`; control: `git log -S'how calculated'` → `d5280e41be`] Now in the retired explorer only; `data-explorer/app.js` has neither. | production @ b8f4b32fbd |
| G5-08 | audit-backlog, Branch C #1 | The whole aqe neighborhood picker (label, input, Clear, link) is wrapped in `aria-hidden="true"`. | OPEN | [verified 2026-10-17: `aqe.html:21 <div class="my-2" aria-hidden="true">` wraps `#flex_search`; same on #1491] axe `aria-hidden-focus` is runtime. | production @ b8f4b32fbd |
| G5-09 | audit-backlog, Branch C #2 | The flexdatalist `#flex_search` inputs have no accessible name on indicator-catalog, hvi and NR landing pages. | OPEN | [verified 2026-10-17 (production): `git grep -n -E 'aria-label\|<label\|aria-labelledby'` over `de-text-search.html`, `hvi.html`, `aqe.html` → nothing; control: `flex_search` hits in all three] On #1491 the NR picker is fixed (`nr-neighborhood-picker.html:43` `<label id="nr-search-label">`, `nr-neighborhood-picker-js.html:63` `aria-labelledby`), so the NR part is BRANCH-SCOPED; indicator-catalog and hvi are open on both. | production @ b8f4b32fbd; NR part #1491 @ 00737207cb |
| G5-10 | audit-backlog, Branch C #3 | With the list open, `aria-controls` moves axe `aria-valid-attr-value` from violation to incomplete. | UNVERIFIED (runtime) | `flexdatalist-combobox-js.html:81-86` adds/removes `aria-controls` with the list. Recipe: `/data-explorer/indicator-catalog/`, type in `#flex_search`, axe 4.13.0, read `incomplete`. | production @ b8f4b32fbd |
| G5-11 | audit-backlog, Branch C #4 | `neighborhood-reports/` has `aria-hidden-focus` on `.nr-clickable-uhf`. | BRANCH-SCOPED | [verified 2026-10-17: production `neighborhood-reports/section.html:75 <div class="nr-clickable-uhf" … aria-hidden="true">`; #1491 no hit; control: the production hit] On #1491 `nr-leaflet.html:133-154` sets `tabindex="-1"` under an `aria-hidden` ancestor. axe not run. | production @ b8f4b32fbd; #1491 @ 00737207cb |
| G5-12 | audit-backlog, Branch C #5 | `npm run lint` was red with 33 `no-undef` errors (implicit globals). | FIXED | [verified 2026-10-17: `npm run lint` → exit 0; declarations at `trend.js:220`, `correlate.js:448-449`, `topic-indicator-selector.js:17`; `selectedDisparity` → `DE.disparities.selectedDisparity`; control: `git grep -n 'comp_group_col\s*=' 6a2101c19a -- …/trend.js` → `:142` with no declarator] Lint covers `assets/js/data-explorer` only. | production @ b8f4b32fbd |
| G5-13 | audit-backlog, Branch C #6 | `CLAUDE.md` said 933 real pages and recommended the viewport meta as the marker. | FIXED | [verified 2026-10-17: `CLAUDE.md:254` names 927 and `data-pagefind-meta="title:`; 933 appears only as the loose-match figure; control: `git grep -n -o 'of which 933[^.]*' 3196d971b6 -- CLAUDE.md` → `:62`] | production @ b8f4b32fbd |
| G5-14 | cross-branch-consolidation, What is left #2 | The CARTO allowlist entry `{ page: /displacement-risk/, error: /Unauthorized access to Maps API/i }` in `scripts/smoke-pages.mjs` may be inert; undecided. | OPEN | deferred by decision: "Not this branch's to make". [verified 2026-10-17: entry at `smoke-pages.mjs:129`; `git log --oneline production..hotfix-smoke-displacement-risk-maps-key` → empty; control: that branch's copy also carries the entry] Whether the embed still emits the error is runtime. | production @ b8f4b32fbd |
| G5-15 | site-characterization-plan, Task 1 findings | Some internal links are absolute paths without the baseURL prefix. | OPEN | [verified 2026-10-17: `content/about/partner.md:24`, `:53`; `content/data-stories/housing/index.md:444`; 10 files match the markdown form] The plan records this as a signal the harness keeps, not a bug. | production @ b8f4b32fbd |
| G5-16 | site-characterization-plan, Task 1 and 2 findings | No table carries a `<caption>`. | OPEN | [verified 2026-10-17: `git grep -n -i '<caption' -- content themes` → nothing; control: `git grep -c '<table'` → 18 files] Runtime-created tables (DataTables) not checked. | production @ b8f4b32fbd |
| G5-17 | site-characterization-plan, Tasks 3, 6, 7 | Cause of the residual baseline-then-check churn (`data-explorer/climate/`, `waterways/`) not established. | UNVERIFIED (runtime) | Task 7 closes the cold-fetch theory; `CLAUDE.md` still says it is not diagnosed. Recipe: `--baseline` three times against a fresh dev_stage server; compare arbitrated pages in `_meta.json`. | production @ b8f4b32fbd |
| G5-18 | site-characterization-plan, Task 4 | Removing DOMPurify also changed several structure fields on two asthma pages; not separated from instability. | UNVERIFIED (runtime) | Nothing closes it. Recipe: remove the DOMPurify `<script>`, run `characterize:site:sample --check` twice on one server. | production @ b8f4b32fbd |
| G5-19 | site-characterization-plan, Tasks 3 and 6, Ledger | The plan contradicts itself on whether the `cleared` branch ever executed. | UNVERIFIED (runtime) | Plan text read only; no command run against the script. Recipe: inject a one-page concurrency-only difference and check `_meta.json` `cleared`. | production @ b8f4b32fbd |
| G5-20 | site-characterization-plan, Task 6 | `img` counted Leaflet tiles. | FIXED | [verified 2026-10-17: `site-characterization.mjs:420-428` excludes `leaflet-tile`; control: `git log -S'leaflet-tile'` earliest `6200892d85`] | production @ b8f4b32fbd |
| G5-21 | site-characterization-plan, Task 7 | The mutation observer never attached. | FIXED | [verified 2026-10-17: `:650-662` throws if `__scObserverAttached` is unset; control: `git log -S'never attached'` earliest `e960523842`] | production @ b8f4b32fbd |
| G5-22 | site-characterization-plan, Task 8 | `zh/data-stories/geographies/` was a 404 in the sample. | FIXED | [verified 2026-10-17: `SAMPLE_EXTRA` has `zh/data-stories/redlining/` (`:182-191`); control: `git log -S'zh/data-stories/geographies'` → `9cbb2d44d0`] | production @ b8f4b32fbd |
| G5-23 | site-characterization-plan, Task 8 | `characterize:site:sample` cannot compare `data-explorer/asthma/?id=2380`: the baseline comes from `sitemap.xml`, which has no query strings. | OPEN | [verified 2026-10-17: `:197` in `SAMPLE_EXTRA`; `:1360-1366` comment on the intersection] Harness limitation. | production @ b8f4b32fbd |
| G5-24 | site-characterization-plan, Task 5 | `readme-development.md` documented no harness. | FIXED | [verified 2026-10-17: `readme-development.md:96-98` lists the scripts; control: `git log -S'characterize:site' -- readme-development.md` earliest `4715de67e4`] | production @ b8f4b32fbd |
| G5-25 | site-characterization-plan, Task 16 | Record the EHDP-data commit a baseline describes (`dataCommit`). | FIXED | [verified 2026-10-17: `fetchDataCommit` defined `:1004`, called `:1171`; both committed `_meta.json` hold `dataCommit`; `site-characterization.yml:266` sets `GITHUB_TOKEN`; control: plan's Task 16 recorded zero at the time] | production @ b8f4b32fbd |
| G5-26 | site-characterization-plan, Task 16 deferred | Whether to add an automatic run when EHDP-data moves is undecided. | OPEN | deferred by decision: Task 16. [verified 2026-10-17: `schedule:`/`cron` only in `check-deploy.yml`, `codeql.yml`] | production @ b8f4b32fbd |
| G5-27 | site-characterization-plan, Task 16 deferred | `schedule:` runs only from the default branch, and GitHub disables schedules after 60 days of inactivity (asserted from recall in the plan). | UNVERIFIED (other) | Outside-world claim; no docs fetched. | production @ b8f4b32fbd |
| G5-28 | smoke-workflow-plan, What is NOT known #1 | Smoke wall time on a hosted runner was unknown. | OBSOLETE | [verified 2026-10-17: `gh run view 33019503991 --json jobs` → sweep job 14m22s, `failure`; control: matches the doc] | production @ b8f4b32fbd |
| G5-29 | smoke-workflow-plan, What is NOT known #2 | Whether the sequential re-check fires within budget. | UNVERIFIED (runtime) | `RECHECK_CAP` exists; run log not read. Recipe: `gh run view 33019503991 --log`, grep re-check lines. | production @ b8f4b32fbd |
| G5-30 | smoke-workflow-plan, Deferred #1 | `gitHead` in a base-control artifact named the harness's commit, not the site's. | FIXED | [verified 2026-10-17: `SITE_UNDER_TEST_COMMIT` at `smoke-pages.mjs:394`, `site-characterization.mjs:842`, `smoke.yml:481`, `site-characterization.yml:474`; control: absent at `18a2ddb535^`] | production @ b8f4b32fbd |
| G5-31 | smoke-workflow-plan, Deferred #2 | Sharding the sweep across runners. | OPEN | deferred by decision. [verified 2026-10-17: no `shard` in `smoke-pages.mjs` or `smoke.yml`] | production @ b8f4b32fbd |
| G5-32 | smoke-workflow-plan, Deferred #3 | The `signatures` table is not rendered into `$GITHUB_STEP_SUMMARY`. | OPEN | deferred by decision. [verified 2026-10-17: `smoke.yml:292` comment, `:500, :506` prose; `:509` writes base-control prose to the summary] | production @ b8f4b32fbd |
| G5-33 | smoke-workflow-plan, Deferred #4; smoke-env-plan | No smoke sweep runs against `dev_stage` in CI. | OPEN | deferred by decision. [verified 2026-10-17: `smoke.yml:197 --environment prod_prod` only] | production @ b8f4b32fbd |
| G5-34 | smoke-env-plan, Deferred | The 6/24/6 A/B/A wall-time measurement for `smoke-pages.mjs` was not done; its ceiling of 24 comes from characterization. | OPEN | deferred by decision. [verified 2026-10-17: `smoke-pages.mjs:208 const CONCURRENCY_CEILING = 24;`] | production @ b8f4b32fbd |
| G5-35 | section-header-standardization, Deferred | `partials/related-footer.html` and `key-topics/single.html` hardcode the section-to-icon/accent mapping instead of reading `data/globals/sections.yml`. | OPEN | deferred by decision. [verified 2026-10-17: `related-footer.html:26-35` if/else chain; `key-topics/single.html:43,139,212` hardcoded; control: `section-icon.html:10` reads `sections.yml`] | production @ b8f4b32fbd |
| G5-36 | nr-de-merge-integration-plan, follow-up #1 | Was the dropped `lib-topojson` include in `minimum-wage-with-maps` dead? Plan says DONE, proved in a browser. | UNVERIFIED (runtime) | The template has no `topojson` string; `git log -S'lib-topojson'` on it is empty, so there is no pre-merge control on this tree. Recipe: load `/data-features/minimum-wage/`, check console. | production @ b8f4b32fbd |
| G5-37 | nr-de-merge-integration-plan, follow-up #2 | Five `data-features` templates had no `PAGES` entry in `smoke-pages.mjs`. | FIXED | [verified 2026-10-17: `git show 95a1a4d60d` adds the five; ancestor of HEAD] Today's `PAGES` not re-grepped. | production @ b8f4b32fbd |
| G5-38 | nr-de-merge-integration-plan, follow-up #3 | `data-explorer-old`'s three templates called `de-topic-indicators` without `lib-arquero`. | FIXED | [verified 2026-10-17: `lib-arquero` in `data-index.html:4`, `indicator-catalog.html:26`, `section.html:24`; control: absent at `2d49d98914^`] | production @ b8f4b32fbd |
| G5-39 | nr-de-merge-integration-plan, follow-up #4 | `renderer: "svg"` rollout across the five DE Vega call sites. | FIXED | [verified 2026-10-17: `bar.js:545`, `correlate.js:743`, `disparities.js:346`, `print.js:170`, `trend.js:684`; control: absent at `0d288eb428^`] | production @ b8f4b32fbd |
| G5-40 | nr-de-merge-integration-plan, follow-up #5 | Delete the dead `$zip_codes` assignment in `nr-output/single.html`. | BRANCH-SCOPED | [verified 2026-10-17: production `nr-output/single.html:184`, `:421`, never read; on #1491 `nr-output/` is absent] Open on production; gone on #1491. | production @ b8f4b32fbd; #1491 @ 00737207cb |
| G5-41 | nr-de-merge-integration-plan, follow-up #6 | `npm run characterize` was non-functional on this lineage; plan says no action. | UNVERIFIED (runtime) | Script and `package.json` entry exist; needs a server. Recipe: `node scripts/de-characterization.mjs --check`. | production @ b8f4b32fbd |
| G5-42 | nr-de-merge-integration-plan, follow-up #7 | Three Vega warnings per DE trend render. | UNVERIFIED (runtime) | `trend.js:682` still calls `vegaEmbed`. Recipe: `/data-explorer/asthma/?id=2380#display=trend` with warn logging. | production @ b8f4b32fbd |
| G5-43 | audit-backlog pointer to site-wide §15 | The three "found while executing" sections point to site-wide §15 as their home. | UNVERIFIED (other) | §15 not read by G5; `site-wide-audit-2026-06-27.md:1163` names §15.7/§15.8. Resolved at deduplication against G2. | production @ b8f4b32fbd |

**Reconciliation (G5's):** audit-backlog Branch A #1-#3 → G5-01..04 (#3 split in two), Branch B
#1-#3 → G5-05..07, Branch C #1-#6 → G5-08..13, §15 pointer → G5-43. Cross-branch "What is left"
#2 → G5-14 (#1 struck through). Site-characterization plan: Task 1 → G5-15, 16; Task 2 → G5-16
(merged); Tasks 3/6/7 → G5-17, 19; Task 4 → G5-18; Task 5 → G5-24; Task 6 → G5-20; Task 7 →
G5-21; Task 8 → G5-22, 23; Task 16 → G5-25..27. Skipped there, with reasons given by G5: a
`git diff --no-index` platform quirk, four harness defects reported fixed, three constant-zero
fields (probe-controlled), `meta.description` presence-only, and Task 9's deferred single-visit
fold (outside the named sections). Smoke-workflow → G5-28..33; smoke-env → G5-34;
section-header → G5-35; nr-de-merge follow-ups 1-7 → G5-36..42. G5's own tallies were garbled;
recounted from the table by ID: OPEN 19 (01-09, 14-16, 23, 26, 31-35), FIXED 11 (12, 13, 20-22,
24, 25, 30, 37-39), OBSOLETE 1 (28), BRANCH-SCOPED 2 (11, 40), UNVERIFIED (runtime) 8 (10, 17-19,
29, 36, 41, 42), UNVERIFIED (other) 2 (27, 43) = 43. Weak evidence G5 flagged itself: G5-19 (plan text only), G5-37 (no
re-grep of `PAGES`), G5-36 (no pre-merge control).

**Duplicates (G5's):** G5-16 stated in Tasks 1 and 2; G5-33 in both smoke plans; G5-17 across
Tasks 3, 4, 6, 7; G5-08, 09, 11 likely duplicate site-wide §15 rows (G2).

### G6 — NR accessibility audit and print view (#1491; site-shell rows on both trees)

Returned 2026-10-17, 43 rows. Read at #1491 HEAD `00737207cb`; renames since the audit:
`nr-topic-spa.html` → `nr-report.html`, `assets/js/nr-topic-spa/` → `assets/js/nr-report/`, and in
`map.js` `selectNeighborhood` → `reportMapSelectNeighborhood`. Control baseline "B" = `43e42b666e`,
the commit the accessibility audit was written against; print controls use the fix commit's parent.
All 12 ledger fix commits passed `git merge-base --is-ancestor <h> HEAD`. Nothing was run in a
browser; each FIXED row names the rule or probe that would confirm it.

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G6-01 | NR a11y §2.1 F1 | Picker map inside `aria-hidden="true"` (`nr-neighborhood-picker.html`) holds 46 keyboard stops. | FIXED | [verified 2026-10-17: `removeHiddenMapFromTabOrder` in `nr-leaflet.html` (called :127, body :148-155) sets `tabindex="-1"` on container and `a, path, [tabindex]` under an `aria-hidden` ancestor; `aria-hidden` still wraps only the map at picker :62; control: `git grep -c tabindex 43e42b666e -- …/nr-leaflet.html` → 0] Confirm: `a11y:nr` tab sweep, axe `aria-hidden-focus`. | #1491 @ d1c7402735 |
| G6-02 | NR a11y §2.1 F2 | The 42 Leaflet polygons were focusable, unnamed and click-only. | FIXED | [verified 2026-10-17: `map.js` `onMapKeyDown` (Enter/Space) bound :230 beside `click`; `role="button"`, `aria-label=featureDisplayName` at :256-257; control: no `keydown` in `nr-topic-spa/map.js` at B] Confirm: `a11y:nr` accessible-names probe. | #1491 @ d1c7402735 |
| G6-03 | NR a11y §2.1 F3 | Typeahead has combobox ARIA without `role`; `aria-expanded` stale. | FIXED | [verified 2026-10-17: `flexdatalist-combobox-js.html:44` `role=combobox`, `aria-expanded` synced (:108), `aria-activedescendant` (:133); `nr-neighborhood-picker-js.html:64` calls `wireComboboxState`; control: no `role', 'combobox'` at B] Confirm: axe `aria-allowed-attr`. | #1491 @ d1c7402735 |
| G6-04 | NR a11y §2.1 F4 (+A5) | `.btn-light-green-bg` and `.btn-report` text was $primary on near-white green, 4.23-4.37:1. | FIXED | [verified 2026-10-17: `$primary-dark: #007a31` (`_a-global-variables.scss:92`) used by `.btn-light-green-bg` (`_de-custom.scss:319`) and `.btn-report` (`theme.scss:491`); control: no `primary-dark` at B] Ratios not re-measured; confirm with a computed-colour probe. | #1491 @ d1c7402735 |
| G6-05 | NR a11y §2.1 F4 correction, §6 ledger | "See neighborhood list" toggle (`.nr-list-toggle`, `.neighborhood-list-button`) at 4.24:1 was parked. | FIXED | [verified 2026-10-17: `_de-custom.scss:253-260` `.neighborhood-list-button { color: $primary-dark !important }` with a 4.24:1 comment; control: B `_custom.scss:156-160` same selector with `$primary`] The document's "parked" is stale on this tree. **Conflicts with G7-15**, which finds the same toggle still `btn-outline-primary` with no colour override; resolve in Step 3. | #1491 @ d1c7402735 |
| G6-06 | NR a11y §2.1 F5 (+C3) | Worse/better pills distinguished by background colour alone. | FIXED | [verified 2026-10-17: `cards.js:97, :101` pill `aria-hidden` plus an `.sr-only` sentence; `theme.scss:685-700` `.worse::before` `\f071`, `.better::before` `\f14a`; control: no `sr-only` in `nr-topic-spa/cards.js` at B] | #1491 @ d1c7402735 |
| G6-07 | NR a11y §2.1 F6 (+B4) | 22 vega action `<summary>` controls had no accessible name. | UNVERIFIED (runtime) | `chart.js:205-206` sets `aria-label` after `vegaEmbed().then` only if `details > summary` is found; a miss is silent. Control: no `summary` in B's `chart.js`. Recipe: `/neighborhood-reports/east_new_york/asthma_and_the_environment/`, expand all, axe `summary-name`. | #1491 @ d1c7402735 |
| G6-08 | NR a11y §2.1 F7 (+C1) | Neighborhood switch rebuilds the page with no announcement and a stale `document.title`. | FIXED | [verified 2026-10-17: `announceNeighborhoodChange` sets `document.title` (`report.js:169`) and `#nr-report-status` (:173-180), called by `renderAll` (:255); `<div id="nr-report-status" role="status" class="sr-only">` at `nr-report.html:77`; control: no `document.title` in B's `report.js`] | #1491 @ d1c7402735 |
| G6-09 | NR a11y §2.1 F8 (+A2) | Modal `aria-labelledby="CCDModalLabel"` pointed at no id. | FIXED | [verified 2026-10-17: `section.html:92` `aria-labelledby="CCDModalTitle"`, `:96` `id="CCDModalTitle"`; control: B `:102` `CCDModalLabel`] | #1491 @ d1c7402735 |
| G6-10 | NR a11y §2.2 F9 (+B3) | All 22 charts named "Vega visualization"; 44 mark groups unnamed. | FIXED | [verified 2026-10-17: `chart.js` passes `chartName` as spec `description` (:55) and per-mark (:105, :158); control: no `description` at B] The `svg-img-alt` nodes and the data-table-alternative part not re-checked. | #1491 @ d1c7402735 |
| G6-11 | NR a11y §2.2 F10 (+B5) | Report-page heading order jumped h1→h3→h2 and h2→h4. | FIXED | [verified 2026-10-17: `nr-report.html` h1 (:89, :180), section title h2 (:238), `cards.js` h3 (:141), footer h2 ×3, picker `h2.h3`; control: B had section h3, cards h2, footer h4] Confirm: axe `heading-order`. | #1491 @ d1c7402735 |
| G6-12 | NR a11y §2.2 F11 (+A1) | Print QR image had no `alt`. | FIXED | [verified 2026-10-17: `nr-report.html:384-391` `createImgTag(2, 8, 'QR code linking to this report at ' + location.href)`; control: B `createImgTag()` at :377] | #1491 @ d1c7402735 |
| G6-13 | NR a11y §2.2 F12 (+B2) | `#nr-toggle-accordions` had no `aria-expanded` or `aria-controls`. | FIXED | [verified 2026-10-17: template :214-215 carries both; `app.js:74` syncs `aria-expanded`; control: B :227 had neither] | #1491 @ d1c7402735 |
| G6-14 | NR a11y §2.2 F13 (+A3) | `overlap-tool.html` duplicated `id="tab-btn-01-a"` and referenced undefined `tab-btn-02-a`. | FIXED | [verified 2026-10-17: ids 01-a, 01-b, 02-a each defined once; `aria-labelledby="tab-btn-02-a"` resolves (:37); control: B duplicated at :5 and :33] Only includer: `neighborhood-reports/section.html:107`. | #1491 @ d1c7402735 |
| G6-15 | NR a11y §2.3 F14 (+A4) | Download button claimed "(opens in a new tab)" but downloads a blob. | FIXED | [verified 2026-10-17: `nr-report.html:203` "(downloads a CSV file)"; control: B :224] | #1491 @ d1c7402735 |
| G6-16 | NR a11y §2.3 F15 (+A6) | Demographics table had no row headers. | FIXED | [verified 2026-10-17: `nr-report.html:124-135` `<th scope="col">` ×2, each row `<th scope="row">`; control: B rows began `<td><strong>`] | #1491 @ d1c7402735 |
| G6-17 | NR a11y §2.3 F16 (+C5) | 42 dangling `aria-describedby` references to Leaflet tooltips after interaction. | UNVERIFIED (runtime) | `map.js:202-210` `onTooltipClose` removes it, registered :231; control: no `tooltipclose` at B. Recipe: `a11y:nr` before/after-re-render and ARIA-reference probes. | #1491 @ d1c7402735 |
| G6-18 | NR a11y §2.3 F17 (+B6) | Accordion panels were not regions and were labelled by the whole header row. | FIXED | [verified 2026-10-17: `cards.js:245-256` `role="region"`, `aria-label=escapeAttr(row.indicator_short_name)`; control: none at B] | #1491 @ d1c7402735 |
| G6-19 | NR a11y §2.4 F18 (+C4) | Escape does not dismiss the typeahead; the list reopens ~400ms later. | UNVERIFIED (runtime) | `flexdatalist-combobox-js.html:77` records Escape; `bodyObserver` (:146) removes a reappearing list. Recipe: topic index, type "Bay", Escape, sample at +60ms and +900ms. | #1491 @ d1c7402735 |
| G6-20 | NR a11y §3 row 1 | Header logo `<img>` has no `alt`, so its link is unnamed. | FIXED | [verified 2026-10-17: `header.html:75` `alt="Environment & Health Data Portal home"` on both trees; control: B :75 no `alt`] | #1491 @ d1c7402735; production @ b8f4b32fbd |
| G6-21 | NR a11y §3 row 2 | `id="languages"` declared twice (header/footer). | FIXED | [verified 2026-10-17: `footer.html:9` now `id="languages-grid"`, one `id="languages"` (:48), both trees; control: B had both] | #1491 @ d1c7402735; production @ b8f4b32fbd |
| G6-22 | NR a11y §3 row 3 | `id="skip-header-target"` on `<main>` and again inside it. | FIXED | [verified 2026-10-17: only `baseof.html:28` and `_default/list.html:29`, mutually exclusive templates, both trees; control: ~47 hits at B; `b8771726c9`] | #1491 @ d1c7402735; production @ b8f4b32fbd |
| G6-23 | NR a11y §3 row 4 | Two `<nav role="navigation">` with no distinguishing label. | FIXED | [verified 2026-10-17: `header.html:94, :253` `aria-label="Main"` (never visible together), `footer.html:71` `aria-label="Footer"`, both trees; control: B unlabelled; `6c85c4a575`] **`header-de.html:70, 188` still has unlabelled navs** — the DE header, outside this audit's page kinds; a candidate for G2/G3 or Task 4. | #1491 @ d1c7402735; production @ b8f4b32fbd |
| G6-24 | NR a11y §2.4 pointer to site-wide §5k | The other 3 flexdatalist call sites (`de-text-search.html`, `aqe.js`, `hvi.js`) ship F3 and F18. | FIXED | [verified 2026-10-17: `wireComboboxState` called at `de-text-search.html:76`, `aqe.js:47`, `hvi.js:76`, partial included by all three templates, both trees; control: none at B] Runtime on those pages not shown. | #1491 @ d1c7402735; production @ b8f4b32fbd |
| G6-25 | NR a11y §4 row 1 | Candidate: search input has no accessible name. | DISCONFIRMED | Stays disconfirmed; the follow-on (B7) is closed: `nr-neighborhood-picker.html:43-45` label, `nr-neighborhood-picker-js.html:61` `aria-labelledby`. | #1491 @ d1c7402735 |
| G6-26 | NR a11y §4 row 2 | Candidate: no keyboard path to any polygon. | DISCONFIRMED | Polygons still focusable and now named (G6-02). | #1491 @ d1c7402735 |
| G6-27 | NR a11y §4 row 3 | Candidate: FA `::before` glyphs on `.comp-*` announced as garbage. | DISCONFIRMED | Still CSS `content` glyphs (`_de-custom.scss:56-70`); nothing changed. Not re-measured. | #1491 @ d1c7402735 |
| G6-28 | NR a11y §4 row 4 | Candidate: two `<h1>` on the report page. | DISCONFIRMED | Both remain (`nr-report.html:89` mobile title, :180 `d-none d-md-block`); mechanism unchanged. | #1491 @ d1c7402735 |
| G6-29 | NR a11y §4 row 5 | Candidate: topic index emits many `<h1>` for Pagefind. | DISCONFIRMED | `nr-topic-index.html:105` still emits `<h1 class="d-none">` per indicator; unchanged. | #1491 @ d1c7402735 |
| G6-30 | NR a11y §4 row 6 | Candidate: `outline: none` leaves controls without a focus indicator. | DISCONFIRMED | Not re-run; `outline` overrides exist at `__portal-custom.scss:502, 937, 951`, `theme.scss:261, 341`. Recipe: `a11y:nr` tab sweep. | #1491 @ d1c7402735 |
| G6-31 | NR a11y §4 row 7 (+A7) | Candidate: malformed anchors in `nr-report-footer-sm.html`. | DISCONFIRMED | Markup half fixed: closed anchors at :25, :40, :55. | #1491 @ d1c7402735 |
| G6-32 | NR a11y §4 row 8 | Candidate: `fa-arrow-circle-right` lacks `aria-hidden` and pollutes the link name. | DISCONFIRMED | Still no `aria-hidden` (`nr-neighborhood-index.html:88`); unchanged. | #1491 @ d1c7402735 |
| G6-33 | NR a11y §4 row 9 | Candidate: the beige `.middle` pill needs a non-colour cue. | DISCONFIRMED | `getTertileLabel` returns `''` for rank 2 (`tertiles.js:29-30`); `cards.js:96` emits a pill only when truthy; rank 2 gets an `.sr-only` sentence. | #1491 @ d1c7402735 |
| G6-34 | NR a11y §4 row 10 | Candidate: print rendition duplicates the screen row into the reading order. | DISCONFIRMED | `d-print-none` (`cards.js:145`) / `print-only` (:116) unchanged; not re-measured. | #1491 @ d1c7402735 |
| G6-35 | NR print, Diagnosis 1 | Report page printed 0 indicator rows (`d-print-none` on the whole header row, no `print-only` counterpart). | FIXED | [verified 2026-10-17: `cards.js:116-130` `col-12 print-only` row with `getTertileInlineLabel`; control: 0 `print-only` at `8daaf8ed7d^`, 2 at `8daaf8ed7d`] Recipe: print-emulated `body.innerText`. | #1491 @ d1c7402735 |
| G6-36 | NR print, Diagnosis 2 | Panels expanded on screen printed expanded. | FIXED | [verified 2026-10-17: `theme.scss:740-743` in `@media print` hides `.report-section .collapse, .collapsing`; control: 0 at `b60830a4b2^`, 1 at `b60830a4b2`] | #1491 @ d1c7402735 |
| G6-37 | NR print, Diagnosis 3 | Print QR code dropped; must regenerate on in-place neighborhood switch. | FIXED | [verified 2026-10-17: `renderAll` calls `renderQRCode()` (`report.js:248-249`), defined at `nr-report.html:376`, `#qrcode` in `row print-only` (:257-264); control: 0 at `df528f920e^`] Staleness proof is runtime. | #1491 @ d1c7402735 |
| G6-38 | NR print, task 1 | `getTertilePrintLabel` added in `tertiles.js`. | OBSOLETE | [verified 2026-10-17: 0 hits at HEAD; control: `8daaf8ed7d` → `cards.js:89`, `tertiles.js:86`] Deleted by task 5, as recorded. | #1491 @ d1c7402735 |
| G6-39 | NR print, task 5 | Print row uses `getTertileInlineLabel`. | FIXED | [verified 2026-10-17: `cards.js:128`; control: G6-38] | #1491 @ d1c7402735 |
| G6-40 | NR print, task 6 | Comparison markers use FA glyphs; old emoji codepoints removed. | FIXED | [verified 2026-10-17: `_de-custom.scss:39-70`; `grep -rn '2705\|203C\|26AA'` over NR SCSS/templates/JS → 0; control: `3af05d965e` → hits at `nr-topic-spa.html:70-76`] | #1491 @ d1c7402735 |
| G6-41 | NR print, task 6 | `getComparison` returns `word` and `preposition` separately. | FIXED | [verified 2026-10-17: `tertiles.js:130-164`; run in node `vm`: `g(7,5,false)` → `{word:"Higher",preposition:"than",cssClass:"comp-bad"}`] | #1491 @ d1c7402735 |
| G6-42 | NR print, task 6 note | `getComparison(null, x)` treats null as 0 and compares instead of returning the empty result. | OPEN | [verified 2026-10-17: `tertiles.js:133-140` no null guard; node `vm`: `getComparison(null,5,false)` → `{"word":"Lower",…}`; control: `getComparison("abc",5,false)` → empty, so the empty branch is reachable] Whether null reaches it in real data is not established. | #1491 @ d1c7402735 |
| G6-43 | NR print, task 6 note | Scratch `nr-print-check.pdf`/`.png` left untracked at a repo root. | UNVERIFIED (other) | Not tracked; absent in this worktree, but untracked files in another checkout cannot be seen from here. | #1491 @ d1c7402735 |

**Reconciliation (G6's):** §2.1 F1-F8 → G6-01..09 (F4 split into G6-04/05); §2.2 F9-F13 →
G6-10..14; §2.3 F14-F17 → G6-15..18; §2.4 F18 → G6-19; §3 four defects → G6-20..23, plus the §5k
pointer → G6-24; §4 ten candidates → G6-25..34. Stage A/B/C items are folded into those rows
(A1→12, A2→09, A3→14, A4→15, A5→04, A6→16, A7→31; B1→01, B2→13, B3→10, B4→07, B5→11, B6→18,
B7→25; C1→08, C2→02, C3→06, C4→03/19, C5→17). No row: §1 coverage gaps; the harness's dead
`charts[].ariaLabel` field (described fixed; harness group); §6's residual table (covered by G6-20,
05). Print doc: Diagnoses 1-3 → G6-35..37; tasks → G6-38..41; notes → G6-42, 43; the greyscale
decision (superseded by task 6) and the `CLAUDE.md` print-contract claim have no row. 43 rows:
FIXED 27, DISCONFIRMED 10, UNVERIFIED (runtime) 3, OBSOLETE 1, OPEN 1, UNVERIFIED (other) 1.

**Duplicates and stale prose (G6's):** G6-24 overlaps site-wide §5k; G6-20..23 probably duplicate
site-wide rows (G1/G2); G6-04/05 overlap any `$primary-dark` row. The NR a11y document's "NR picker
only" claims are stale against the shared `flexdatalist-combobox-js.html`. **`CLAUDE.md`'s
statement that `highlightFeature`, `onEachFeature`, `resetHighlight` and `selectNeighborhood` are
declared in both `nr-leaflet.html` and `map.js` looks stale**: `map.js` now declares
`reportMap*` names (renamed in the four commits past `d1c7402735`); `nr-leaflet.html` not checked.

### G7 — NR search parity, follow-ups, merge ledgers (#1491; two rows on production)

Returned 2026-10-17, 33 rows. Read at #1491 HEAD `00737207cb`; `git diff d1c7402735 HEAD` touches
`nr-report.html`, `section.html`, `nr-leaflet.html`, `nr-architecture.md`, the 09-01 ledger and
`scripts/pagefind-characterization-baseline/production.json` (+22/-22); rows citing that baseline
cite the HEAD copy, a recorded run from the 2026-10-16 merge, not a fresh index. Production
worktree code verified equal to `b8f4b32fbd` (`git diff --stat … -- themes assets content data
config`, empty). G7-22 ran `scripts/js-comment-spacing.py` in a throwaway repo under
`C:/Users/Chris/AppData/Local/Temp/claude/audit-g7/f1`; neither repository was modified.

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| G7-01 | NR pagefind §2a | 11 non-NR pages differed only by production content and "arrive on merge". | FIXED | [verified 2026-10-17: `congestion-pricing-report.html` present at HEAD; weights diff (G7-05) now differs only on `nr-neighborhood-index.html`; control: absent at `ac472c592a`] | #1491 @ d1c7402735 |
| G7-02 | NR pagefind §2b | The 47 → 258 NR index increase is deliberate. | OBSOLETE | [verified 2026-10-17: baseline JSON → 48 NR pages, 0 report URLs, 203 total; `nr-report.html:52` `<section … data-pagefind-ignore="all">` inside `baseof.html:28`'s `data-pagefind-body` `<main>`; control: section-level ignore added in `d67d738469`] Superseded by §2g. | #1491 @ d1c7402735 |
| G7-03 | NR pagefind §2c | Server-rendered list, picker and topic cards put 42 names and all ZIPs into the index on 6 pages. | UNVERIFIED (runtime) | `data-pagefind-ignore="all"` now at `nr-neighborhood-list.html:34,47`, `nr-neighborhood-picker.html:36,43,45,62`, `nr-topic-menu.html:25`, `nr-neighborhood-index.html:76`; control: none at `ec313adc7b^`. Baseline: `east_harlem` hub 9 words, `Kingsbridge` 1. Recipe: `node scripts/pagefind-characterization.mjs --check` (expect 203 pages). | #1491 @ d1c7402735 |
| G7-04 | NR pagefind §2d | Production's selective indexing is a deliberate decision; `data-pagefind-index-attrs="neighborhood"` absent from both trees. | OBSOLETE | [verified 2026-10-17: no hits on either tree; control: `git log -S'data-pagefind-index-attrs'` → `fa75f7361a`, `0eba0ed004`, `4506b00c98`] A decision record; nothing open. | #1491 @ d1c7402735 |
| G7-05 | NR pagefind §2e | Weights at parity except `nr-neighborhood-index.html` (`10` vs house style `10.0`). | OPEN | [verified 2026-10-17: normalised `data-pagefind-weight` diff across trees → sole difference at `nr-neighborhood-index.html:53`; control: the diff is non-empty] Cited lines drifted (`:47` → `:53`). | #1491 @ d1c7402735 |
| G7-06 | NR pagefind §2f | Report pages won bare topic-word queries; neither `weight` nor `ignore` fixed it. | UNVERIFIED (runtime) | No weight in `nr-topic-index.html` (comment :44); report pages no longer indexed (G7-07); baseline `climate` top 10 has 0 reports. Recipe: `pagefind-characterization.mjs --check`. | #1491 @ d1c7402735 |
| G7-07 | NR pagefind §2g | The 210 report pages carry a page-level ignore; neighborhood+topic search is gone. | UNVERIFIED (runtime) | Ancestor chain `baseof.html:28` → `nr-report.html:52` (closes :279). Baseline: 0 report URLs; `asthma East Harlem` → 2 data stories; `Kingsbridge` → 1. The harness's inverted control (`pagefind-characterization.mjs:155`) fails if the ignore is removed. | #1491 @ d1c7402735 |
| G7-08 | NR pagefind §3 step 9 | A second `data-pagefind-filter` separating NR overviews from reports is parked. | OPEN | deferred by decision: parity doc §3 row 9 ("Parked 2026-08-15 — team"). [verified 2026-10-17: only `head.html:156-176`'s six `section[content]` metas] | #1491 @ d1c7402735 |
| G7-09 | NR pagefind §3 step 10 / §5 | The GA `search_term` test has not run, so step 8 is not re-decided. | OPEN | [verified 2026-10-17: no NR result in `documents/`; control: hits in the parity doc itself] §5's pointers are stale: `processTerm` is at `search-modal.html:31`, the reversal target is `nr-report.html:52`. | #1491 @ d1c7402735 |
| G7-10 | NR pagefind §3 / merge 10-16 F2 | `CLAUDE.md` places the ignore on `<section id="skip-header-target">`; the element is `<section class="container-fluid" data-pagefind-ignore="all">`. | OPEN | [verified 2026-10-17: `CLAUDE.md:427`; `nr-report.html:52` has no id; control: `d67d738469` `nr-topic-spa.html:118` had the id] | #1491 @ d1c7402735 |
| G7-11 | NR merge 09-01 (202 vs 201 indexed pages) | The harness/baseline count differs from the 2026-08-15 figure, undiagnosed. | OPEN | [verified 2026-10-17: baseline `pageCount` 203; `CLAUDE.md` still says the one-page difference is not diagnosed] Now 203 (10-16 ledger V7: 202 → 203). | #1491 @ d1c7402735 |
| G7-12 | NR followups ledger rows 1-6 | Six small items marked DONE 2026-08-15. | FIXED | [verified 2026-10-17: (1) `stripBasePath` `nr-characterization.mjs:102`, used :246; (2) `nr-report-accordion` `_de-custom.scss:95`, no `<style>` block in `nr-report.html`; (3) no `urlExtension`, control `128915f28b` removed it; (5) scoping memo :762 note; (6) no "ahead of origin"; (4) no "in progress" in the print doc] Row 4 checked by absence only. | #1491 @ d1c7402735 |
| G7-13 | NR followups "not in scope" (GA test + filter facet) | Pagefind steps 9 and 10 stay open. | OPEN | Same as G7-08, G7-09. | #1491 @ d1c7402735 |
| G7-14 | NR followups "not in scope" (combobox port, site-wide §5k) | The combobox port to non-NR pages was left open. | FIXED | [verified 2026-10-17: all 5 production init sites (`hvi.js:47`, `aqe.js:18`, `de-text-search.html:49`, `section.html:280`, `topiclanding.html:195`) pair `.flexdatalist(` with `wireComboboxState(generated)`; control: 0 in `hvi.js` at `e70327e984^`] | production @ b8f4b32fbd |
| G7-15 | NR followups "not in scope" (`.nr-list-toggle` contrast) | `.nr-list-toggle` (`.btn-outline-primary`, 4.24:1) is parked until `.btn-outline-primary` is darkened site-wide. | OPEN | deferred by decision: `nr-accessibility-audit-2026-08-10.md:519`. [verified 2026-10-17: `nr-neighborhood-list.html:32` still `btn-outline-primary`; `_de-custom.scss:280-288` carries only +/- rules] **Conflicts with G6-05**; resolve in Step 3. Ratio not re-measured. | #1491 @ d1c7402735 |
| G7-16 | NR followups "not in scope" (fresh ACS pull) | The fresh ACS pull is planned and not started. | UNVERIFIED (other) | The work lives in another repo (`cgettings-EHDP-work`); only "planned" statements here, dated 2026-08-06 and 2026-08-15. | #1491 @ d1c7402735 |
| G7-17 | NR merge 09-01 R9 | Ledger row for `CLAUDE.md` reads "In progress". | FIXED | [verified 2026-10-17: no conflict markers in `CLAUDE.md`; one `docs-check verified` stamp; `79d5eb4804` an ancestor] The work is done; the R9 row text is stale. | #1491 @ d1c7402735 |
| G7-18 | NR merge 09-01 F1 | Two near-duplicate `wireComboboxState` implementations. | FIXED | [verified 2026-10-17: one definition, `flexdatalist-combobox-js.html:36`; control: 2 at `79d5eb4804`; `a3c490ccfd` ancestor of `d1c7402735`] | #1491 @ d1c7402735 |
| G7-19 | NR merge 09-01 F2 | The `prod_prod` site-characterization baseline was stale after M2. | FIXED | [verified 2026-10-17: last touched `f8ede8382e 2026-10-16`, an ancestor; re-captures recorded in the 09-26 and 10-16 ledgers] Whether records match the tree needs `characterize:site:prod_prod`. | #1491 @ d1c7402735 |
| G7-20 | NR merge 09-01 F3 | `CLAUDE.md` Guardrails is a union of two branches and long; `refile-rules` not applied. | OPEN | [verified 2026-10-17: 630 lines, 78,782 B against 751 lines, 84,756 B at `79d5eb4804`; `01de41a655` reorganised it once] Not recorded closed. | #1491 @ d1c7402735 |
| G7-21 | NR merge 10-16 R13/G2 | The `docs-check verified` stamps were not bumped after the 10-16 merge. | OPEN | [verified 2026-10-17: `CLAUDE.md:2` = `0c3fc50c05 2026-09-02` (46 commits since on that file), `nr-architecture.md:2` = `79d5eb4804 2026-09-02` (3 since)] | #1491 @ d1c7402735 |
| G7-22 | NR merge 09-26 F1 / 10-16 F1 | The comment-spacing convention is not applied to `assets/js/nr-report/*.js` or the NR templates' inline scripts. | OPEN | [verified 2026-10-17: `js-comment-spacing.py` on a `git archive` copy → 165 blank lines inserted across 15 files, 0 deletions; control: 5 of 20 files unchanged] | #1491 @ d1c7402735 |
| G7-23 | NR merge 09-26 F2 | Site-wide audit §17 cites `map.js:269`/`:278` for the UHF42 fetch and the `GEOCODE != 0` filter. | OPEN | [verified 2026-10-17: now `:287` and `:296`; audit lines 2467, 2509 unchanged] | #1491 @ d1c7402735 |
| G7-24 | NR merge 10-16 F3 | Production's DE characterization baseline (captured `19c3e93153`, 2026-10-01) no longer matches EHDP-data staging and fails on production's tree. | UNVERIFIED (runtime) | The 10-16 V8 run recorded 16 changed lines against `b8f4b32fbd`. Recipe: `node scripts/de-characterization.mjs --check` against `dev_stage` on production. | production @ b8f4b32fbd |
| G7-25 | NR Option-D plan, finding 1 | `neighborhoodMap` was built from content sections the swap deletes. | FIXED | [verified 2026-10-17: `nr-report.html:355` ranges `site.Data.globals.uhflist`; `url.js:11` consumes it; control: `.Sections` at `2bce6c6d46^`] | #1491 @ d1c7402735 |
| G7-26 | NR Option-D plan, finding 2 | The five topic `.md` files carry `layout: topiclanding` on production, `nr-topic-index` on #1491. | BRANCH-SCOPED | [verified 2026-10-17: both trees grepped] Differs until #1491 merges. | production @ b8f4b32fbd |
| G7-27 | NR Option-D plan, finding 3 | The memos record Hugo 0.146.7. | OBSOLETE | [verified 2026-10-17: `package.json:65` exact `"0.147.3"`, CI pins 0.147.3; control: `^0.147.3` at `cae7f7b10f`] The scoping memo still says 0.146.7 (`:280, :477, :494`), an owed correction. | #1491 @ d1c7402735 |
| G7-28 | NR Option-D plan, finding 4a | Topic-first URLs get no redirect; both Web.config NR rules deleted. | FIXED | [verified 2026-10-17: no `rule name="nr-` in `static/Web.config`; comment :306-311; control: both rules at `2bce6c6d46^`] | #1491 @ d1c7402735 |
| G7-29 | NR Option-D plan, finding 4b/4c | The neighborhood index keeps the old design; canonical data in `data/globals/`. | FIXED | [verified 2026-10-17: `data/globals/uhflist.json`, `lib-uhflist.html`, no `assets/js/uhflist.js`; `_content.gotmpl:36` routes `nr-neighborhood-index`] Visual parity not checked. | #1491 @ d1c7402735 |
| G7-30 | NR scoping "Two bugs" #1 | Five content files carried `Soho`, so the report rendered zero cards. | FIXED | [verified 2026-10-17: production files read "Greenwich Village - SoHo"; `4ee582a584` in production; #1491 takes names from `uhflist.json:387`; control: `Soho` at `7565f16cc2^`] | production @ b8f4b32fbd and #1491 @ d1c7402735 |
| G7-31 | NR scoping "Two bugs" #2 | `nameCorrections` in the report JS is dead. | FIXED | [verified 2026-10-17: only a comment at `nr-report/global.js:107`; control: `3264a5a02c` "drop nameCorrections"] | #1491 @ d1c7402735 |
| G7-32 | NR picker-restore §5 noise 1 | Every page logs a report-only `frame-ancestors` error from the Google Docs iframe, allowlisted in smoke. | UNVERIFIED (runtime) | Allowlist `{ page: null, error: /frame-ancestors\|Framing …docs.google.com/i }` at `smoke-pages.mjs:135` (#1491), `:134` (production). Recipe: `npm run smoke`. | #1491 @ d1c7402735 / production @ b8f4b32fbd |
| G7-33 | NR picker-restore §5 noise 2 | VS Code reports ~24 CSS parse errors in `nr-topic-index.html`. | UNVERIFIED (other) | Editor diagnostics not observable here; the file has no `<style>` block today. | #1491 @ d1c7402735 |

**Reconciliation (G7's):** parity doc §2a-§2g → G7-01..07, §3 rows 9-10 and §5 → G7-08, 09, stale
`CLAUDE.md` sentence → G7-10; §3's dropped `nrtitle` item has no row (0 hits today). Followups:
rows 1-6 → G7-12; four "not in scope" items → G7-13..16. Merge 09-01: R9 → G7-17, F1-F3 →
G7-18..20, page count → G7-11; R1-R8, G1-G2, V1-V8, M1-M3 are dated DONE results, not re-run.
Merge 09-26: F1 → G7-22, F2 → G7-23. Merge 10-16: F1 → G7-22, F2 → G7-10, F3 → G7-24, unbumped
stamps → G7-21. Option-D findings 1-4 → G7-25..29 ("Corrections still owed" out of scope).
Scoping "Two bugs" → G7-30, 31. Picker-restore §5 → G7-32, 33. 33 rows by ID: FIXED 11 (01, 12,
14, 17-19, 25, 28-31), OPEN 11 (05, 08-11, 13, 15, 20-23), OBSOLETE 3 (02, 04, 27), BRANCH-SCOPED
1 (26), UNVERIFIED (runtime) 5 (03, 06, 07, 24, 32), UNVERIFIED (other) 2 (16, 33).

**Duplicates (G7's):** G7-08/09/13 one item set; G7-10 = 10-16 F2 = the `CLAUDE.md` sentence;
G7-22 = 09-26 F1 = 10-16 F1; the 202-vs-201 count appears in `CLAUDE.md`, the parity doc and the
09-01 ledger; the `.nr-list-toggle` parking also appears at `nr-accessibility-audit-2026-08-10.md`
lines 123 and 519.

## Instrument results

*Task 3, run 2026-10-17.* Production (P) was measured in the audit worktree, whose code equals
`b8f4b32fbd`. #1491 (N) was measured in a detached temporary worktree at `d1c7402735`, the PR head;
the NR worktree's local branch is at `00737207cb`, four commits past it. The raw outputs are not
kept; the probes are in the gitignored `scripts/.sc-rebaseline/` (`census-capture.mjs`, and under
`audit-2026-10/` `census_aggregate.py` and `a11y_rules.py`), and `scripts/site-a11y-audit.mjs` is
committed. Where an instrument confirms an `A-` row, the row is named here, and its own cell is
left as Step 4 wrote it.

**3a, census.** A fresh `site-characterization.mjs --out --all` capture on an isolated `prod_prod`
build of each tree, 924 of 924 pages each, viewport 1280×900. On P it is structurally identical
to the committed `prod_prod` baseline (captured at `28c635d944`): 0 of 924 pages differ in any
`structure` field `[verified 2026-10-17: whole-record comparison; control: the same capture against
the committed staging baseline differs on 924 of 924 pages, meta on all 924, the shape CLAUDE.md
records]`. Pages hit per field on P, with the page kinds that carry most of them:

| Field | P pages | Where | Row |
|---|---|---|---|
| `h1==0` | 3 | the three home pages (`en`, `es`, `zh`) | N-016 |
| `h1>1` | 257 | 210 NR report pages, 5 NR topic indexes, 41 explorer topics, `404.html` | A-112 (explorer); see note |
| `img.missingAlt` | 215 | 210 NR report pages; 5 others | see note |
| `img.zeroSize` | 262 | 210 NR report pages, 41 explorer topics, 9 key-topic pages | — |
| `links.noAccessibleText` | 20 | all 11 key-topic pages, home, 8 others | N-003 |
| `controls.noAccessibleName` | 55 | 42 of 43 explorer topic pages (6 each), hvi, NR landing and topic pages | N-002, A-133 |
| tables without `<th>` | 1 | `data-stories/geographies/` (2 of 4 tables) | N-018 |
| tables without `<caption>` | 225 | 210 NR report pages and 15 others | A-313 |
| `overflowX` | 558 | all 316 keyword pages and their 58 paginators, 41 of 43 explorer topics, categories paginators, the `es`/`zh` keyword pages | N-017 |
| zero-size iframes | 7 | Datawrapper pages in hidden tabs, three languages | A-043 |
| `main==0`, `meta.description` false, JSON-LD parse error, non-200 | 0 | — | — |

Notes:
- **The `links.emptyHref` site-shell floor is two numbers, not one:** 29 on `header.html` pages and
  22 on the 41 explorer topic pages (`header-de.html`; 12 on the explorer section page). Task 0
  recorded it as "never below 29", which the committed baseline it measured already contradicted.
- **On the NR pages, `h1>1` counts hidden headings.** The census counts DOM nodes. #1491's report
  page has one `<h1>` inside `d-md-none` and one inside `d-none d-md-block`, so one shows at any
  width, and its topic index has one visible `<h1>` and 19 with `class="d-none"` (the Pagefind
  headings). G6-28's and G6-29's disconfirmations stand `[verified 2026-10-17: the h1 elements and
  their classes in N's built bayside_little_neck/asthma_and_the_environment/ and
  asthma_and_the_environment/ pages]`.
- On the 258 NR pages, #1491 against production: `headingJumps` above the floor 211 → 0 pages,
  `img.missingAlt` 210 → 0, `links.emptyHref` above the floor 210 → 0; `h1>1`, `zeroSize` (the
  print QR code) and missing captions unchanged. axe found no `image-alt` on production's NR report
  page, so its one missing `alt` is on a hidden element (axe skips hidden nodes).

**3b, axe (`scripts/site-a11y-audit.mjs`, D3).** axe 4.13.0 (WCAG 2.0/2.1 A and AA tags) over 126
pages of P on an isolated `prod_prod` build with Pagefind: the 44 curated smoke pages and each of
the 41 explorer topics bare and with its first indicator. The positive control fired (an injected
`<img>` with no `alt` caught by `image-alt`). 125 pages passed the rendered-content control; the
126th, `data-features/asthma-syndrome/`, answered 404 (N-001). Exit 1, by design, for that page.
A second full run gave the same counts on every rule except `aria-allowed-attr` (2 pages / 20
nodes, then 3 / 21), which is the run-to-run floor. The first run's control used a 200-character
`<main>` threshold and failed four real but short pages; it was replaced with "status below 400,
some visible text, and, on an indicator page, a drawn view" before the run recorded here.

| Rule | Pages / nodes | Where | Row |
|---|---|---|---|
| `nested-interactive` | 86 / 86 | every explorer topic page, bare and with an indicator: `#map role="img"` | A-159 |
| `button-name` | 44 / 130 | the Measure/Boundary/Time dropdown buttons on 42 bare topic pages and on `waterways/?id=2427` | N-002 |
| `link-in-text-block` | 17 / 60 | body-text links told apart by colour alone | N-004 |
| `color-contrast` | 12 / 69 | `#808080` on white (3.94:1), story-card text `#d75047` (4.09:1), legend colours | N-005 |
| `link-name` | 10 / 81 | empty card links on `data-features/`, `data-stories/`, key-topic pages; share links; the home featured story | N-003, A-125 |
| `label` | 8 / 12 | flexdatalist on both indicator catalogs, hvi and production's NR topic landing; `#citeText`, the UHI `#slider`, the rats-page `.dia > input` | A-133, N-007 |
| `aria-required-children`, `aria-required-parent`, `listitem` | 4, 2, 2 | Bootstrap tabs with `role="tablist"` on a `<ul>` of plain `<li>` | N-006 |
| `aria-allowed-attr` | 3 / 21 | `aria-selected` on explorer trend-mode pills and old-explorer dropdown items | N-008 |
| `scrollable-region-focusable` | 3 / 4 | `csvtable` containers on leading-causes and minimum-wage; old-explorer DataTables | N-009 |
| `aria-hidden-focus` | 3 / 4 | production `neighborhood-reports/` (`.nr-clickable-uhf`), aqe, housing | A-134, A-132, N-010 |
| `summary-name`, `svg-img-alt` | 3, 3 | Vega embeds on housing, realtime-air-quality, leading-causes, aqe, hvi | N-011 |
| `list` | 2 / 2 | housing `ul.navbar-nav`, rat-report `ol type="I"` | N-012 |
| `frame-title` | 2 / 2 | iframes on `data-stories/cold/` and `urban-heat-island/` | N-013 |
| `image-alt`, `aria-command-name` | 2, 1 | realtime-air-quality map markers; two heat-report-archive 2021 figures | N-014 |
| `role-img-alt` | 2 / 6 | Font Awesome `role="img"` icons on rats-in-your-neighborhood and email-electeds | N-015 |

`color-contrast` was also *incomplete* on all 126 pages and `link-in-text-block` on 89, so their
violation counts are floors. No failing contrast pair involves the brand green `#008939`, so A-100
is neither confirmed nor cleared.

**3c, smoke.** `node scripts/smoke-env.mjs prod_prod` on each tree: **PASSED on both**, 1187 pages
(924 site pages + 263 explorer indicators), Pagefind index served, 0 failures, 0 pages cleared on
re-check, quiet cap never reached `[verified 2026-10-17: report JSON gitHead 08c2bd5816 and
d1c7402735 respectively]`.

**3d, `a11y:nr` on #1491.** `node scripts/nr-a11y-audit.mjs` at N, against the `dev_stage` server it
spawned (staging data; nothing else was serving): **0 WCAG violations and 0 best-practice rules**
on all four NR page kinds and in all three further report-page states (one panel expanded, all
expanded, print-emulated). The positive control fired and every rendered-content control matched.
`color-contrast` is incomplete in all seven states, so its zero is a floor. The census's 6 NR
pages with an unnamed control are not axe findings here, so the unnamed control is presumably the
authored `#flex_search` the library hides and relabels (G2-59's evidence); not checked further.

**3e, the rest.**
- `npm run lint`: exit 0 on P and on #1491 (run at `00737207cb`). Controls on both: an undefined
  name in a stdin file fires `no-undef`, and a name declared elsewhere in the same directory (`DE`
  in `data-explorer/`, `reportConfig` in `nr-report/`) passes.
- `npm run docs-check`: exit 1 on both P and N, on `CLAUDE.md`'s `docs/` and `resources/_gen/`
  alone (C-S4-1). On N, creating the two directories empty turns it to exit 0.
- `npm audit --omit=dev` on P: 32 advisories (1 critical, 17 high, 9 moderate, 5 low), mostly the
  georaster → webpack chain (A-021) and the vega family (A-020). `dompurify` is a
  direct dependency with a moderate advisory and ships to the browser (C-T3-1).
- Dependabot, open on the repository: 25 (2 critical, 11 high, 10 medium, 2 low); the current
  count for A-018.
- CodeQL, open: 12. One high, `js/incomplete-sanitization`; 11 medium, `js/functionality-from-untrusted-source`
  and `js/unsafe-html-expansion` (C-T3-2).

## Candidates

*Task 4. Candidates are not findings until Task 5 reproduces them.*

Resolved at Task 5 (first batch, the candidates above logged before Task 4): C-S3-1 → N-019,
C-S3-2 → N-020, C-S4-1 → N-021, C-T3-2 → N-022 and N-023 plus its six
`js/functionality-from-untrusted-source` alerts, which are the external `<script>` tags of A-014
and A-046 (proj4, rawgit OpenLayers, PapaParse on email-electeds and both rats templates);
C-S3-3 and C-T3-1 → Disconfirmed. C-T3-3 → Disconfirmed after a browser probe (Task 5's second step).

Found in passing during Task 2 Step 3, before Task 4 started. All three are static readings at P.
- **C-S3-1: two nyc-lib stylesheets of different versions on every `mapLib` page.** Inside
  `{{- if .Params.mapLib }}` (`head.html:105-109`), `:107` loads the remote
  `nyc-lib/v1.4.78/css/nyc-basic-lib.css` and `:108` loads a local `css/nyc-basic-lib-v1.2.79.css`.
  G1-09's evidence describes one gated link. Whether the second copy is a deliberate override is a
  question for whoever added it.
- **C-S3-2: `.claude/commands/js-development.md:19-22` says `debugLog` is "Pending: it arrives with
  `feature-new-data-explorer`".** That has been stale on production since #1462, because
  `head.html:217` defines `debugLog`. G1-58 records the same marker in `documents/js-conventions.md`
  (at lines 415-417, per G1-58; not re-opened here). Docs only.
- **C-S3-3: two seedless `reduce`s are guarded on the outer array, not the array they reduce.**
  `data.js:470` returns `perGeotypeTables.flatMap(d => d).reduce((a, b) => a.concat(b))` after an
  `if (!perGeotypeTables.length)` block that returns `null` (`:466-468`), and `:482` is the same
  shape behind a `perMeasureTables.length ?` ternary. An outer array holding only empty arrays would pass the guard, and `reduce`
  would then throw on an empty array (the gotcha G3-101 is about). Whether that input can occur
  was not checked.

Found in passing during Task 2 Step 4.
- **C-S4-1: `npm run docs-check` fails in a worktree where no Hugo build has run.** `CLAUDE.md`
  names `docs/` (`:151`, `:156`, `:191`, `:359` at P) and `resources/_gen/`, and
  `scripts/docs-check.mjs:192` tests each cited path with `existsSync`. Both directories are build
  output, so they exist on disk only after a build: in the audit worktree (code equal to P, no
  build) it exits 1 with exactly those two "path does not exist" lines, and so does a fresh
  worktree at #1491's `d1c7402735`. Creating the two directories empty in that same worktree turns
  it to exit 0 over 3 docs, so the directories are the whole cause `[verified 2026-10-17: node
  scripts/docs-check.mjs in the detached N worktree without and with empty docs/ and
  resources/_gen/, outputs saved and tailed]`. No workflow runs `docs-check` (`git grep docs-check
  P -- .github` hits only prose in `.github/workspace-memory.md`; control: `smoke` hits two
  workflows), so it bites local runs in a fresh worktree, not CI.

Found during Task 3.
- **C-T3-1: `dompurify` carries a moderate npm advisory and ships to every page.** It is a direct
  dependency, `head.html` loads it site-wide (`CLAUDE.md`, Library loading), and `npm audit
  --omit=dev` at P lists it as moderate with a fix available; Dependabot lists it at low and
  medium. Which advisories, and whether they reach the site's `DOMPurify.sanitize` calls, was not
  checked.
- **C-T3-2: 12 open CodeQL alerts.** One high (`js/incomplete-sanitization`) and 11 medium
  (`js/functionality-from-untrusted-source`, `js/unsafe-html-expansion`), read from the code
  scanning API; which files they name was not read.
- **C-T3-3: `img.zeroSize` on 41 of 43 explorer topic pages (2 each) and 9 of 11 key-topic pages.**
  The census counts DOM nodes, so these may be hidden images rather than broken ones; which images
  was not checked.

### Task 4 candidates

Each area's report is reproduced verbatim from its subagent (Opus, high effort, read-only,
dispatched 2026-10-17 per D4). **Candidate ID `C-4<area>-<n>` is item *n* of that area's report**
(area b numbers its items C1..C9; those are C-4b-1..9). None is a finding until Task 5 reproduces
it, and none of the runtime claims was run in a browser. Scratch paths the reports cite are in a
session scratchpad and will not survive it.

Cross-area duplicates, to be verified once:
- C-4a-1 = C-4h-2 (robots.txt below the host root).
- C-4a-2 = C-4h-1 + C-4h-3 (path-only sitemap `<loc>` and `hreflang`; no self-reference).
- C-4a-3 = C-4h-4 (NR `twitter:image` 404).
- C-4a-9 = C-4h-6 (GA `search` event per debounce and filter toggle).
- Area h's closing out-of-area note = C-4f-1 (commit subject interpolated into `run:`).
- Area d's closing out-of-area note (scheme-less `www.nyc.gov/rats` in both `mice-and-rats.md`)
  is in area b's scope and was not raised there.

#### Area a: Site shell (production @ b8f4b32fbd)

Overlap checked: A-005..A-010, A-013, A-014, A-020, A-022..A-027, A-028, A-033, A-085, A-086, A-090, A-091, A-102, A-103, A-110, A-111, A-115, A-117, A-119, A-123, A-124, A-127..A-131, A-157, A-165, A-184, A-222, A-223, A-294..A-296, A-332, A-355..A-357, A-383, A-384; G6-23; N-001..N-023; C-S3-1..3, C-S4-1, C-T3-1..3; Disconfirmed.

All template readings are from the audit worktree, whose code matches b8f4b32fbd. "Live" means a read-only `curl` against a816-dohbesp.nyc.gov. The live site runs builds/prod-prod `b626794129` (from `commit_hash.txt`), which is not P, so each live result is backed by the template read at P.

**1. The deployed robots.txt is at a path crawlers never read, so its `Sitemap:` line is never found.**
- **Where:** `themes/dohmh/layouts/robots.txt` (`Sitemap:` at :21), plus `baseURL` in `config/prod_prod/config.toml` (`https://a816-dohbesp.nyc.gov/IndicatorPublic/`).
- **Evidence:** Live, `/robots.txt` returns 404 (an IIS error page) and `/IndicatorPublic/robots.txt` returns 200 with the template's body. Hugo publishes robots.txt under the baseURL path. As I recall it (not fetched), RFC 9309 puts robots.txt only at the host root `/robots.txt`.
- **Consequence:** A-102's fix (`Sitemap:` line, allow-all) cannot take effect, and crawlers find the sitemap only if someone submits it. The preview environments' per-path `Disallow` lists are under `/dev-stage/` and `/dev-prod/` too, so they are equally unread, though that host is `.nycnet`.
- **Reproduction:** `curl -s -o /dev/null -w '%{http_code}' https://a816-dohbesp.nyc.gov/robots.txt` should print 404, and the same under `/IndicatorPublic/` should print 200. Confirm the RFC 9309 location rule from the RFC text.
- **Overlap:** Extends A-102 (FIXED). The new point is that the fix is published somewhere crawlers do not look.

**2. Sitemap `<loc>`, sitemap hreflang and head hreflang are all path-only, and head hreflang never lists the page itself.**
- **Where:** `_default/sitemap.xml:6` (`<loc>{{ .RelPermalink }}</loc>`) and `:13`, `:18`; `partials/head.html:97` (`range .Translations` with `.RelPermalink`).
- **Evidence:** Live, `/IndicatorPublic/en/sitemap.xml` has `<loc>/IndicatorPublic/data-features/hvi/</loc>`, while the sitemap index has absolute locs (Hugo's built-in). The live `data-stories/housing/` head carries `hreflang="es" href="/IndicatorPublic/es/..."`, with no `en` self-entry and no `x-default`. From memory, not fetched: the sitemaps.org protocol requires full URLs in `<loc>`, and Google asks for absolute hreflang URLs plus a self-reference.
- **Consequence:** All three per-language sitemaps (every listed page) and the alternate links on translated pages may be ignored by crawlers.
- **Reproduction:** `curl` the en sitemap and look for `<loc>/`. In any translated page's `<head>`, count the `rel="alternate"` links (2, none of them self).
- **Overlap:** A-119 covers only the missing comment; A-129 is the same path-only defect for og:image. The `<loc>` and head hreflang problems are new.

**3. `twitter:image` points at an unpublished assets path and 404s on all 210 production NR report pages.**
- **Where:** `partials/seo.html:20` (`relURL .Params.seo_image`).
- **Evidence:** `og:image` (:13) runs `seo_image` through `resources.Get` and `Fill`; `twitter:image` just applies `relURL` to the same assets-relative path. I ran a Python pass over front matter: all 210 non-draft files that set `seo_image` (`content/neighborhood-reports/*/*.md`) have the file in `assets/` and none in `static/`. The site default works only because `static/images/report_bottom_background.jpg` also exists. Live, on `bayside_little_neck/asthma_and_the_environment/`, og:image returns 200 and `twitter:image` `/IndicatorPublic/images/nyc_health_report_asthma_environment.jpg` returns 404. Both content values also carry a stray leading or trailing space.
- **Consequence:** Share cards for NR reports have a broken image. On #1491 it depends on whether the content adapter sets `seo_image`, which I did not check.
- **Reproduction:** Run the two `curl`s above.
- **Overlap:** Extends A-129. The new point is that this is the wrong path, not just a relative one.

**4. On es and zh pages the header's Topics menu is empty and the About item is an empty box.**
- **Where:** `header.html:104`, `:263` (`where .Site.Pages "Section" "key-topics"`) and `:176`, `:335` (`with .GetPage "about"`); the same at `header-de.html:78`, `:127`, `:196`, `:245`.
- **Evidence:** Both lookups resolve inside the current language, and no `key-topics` or `about` content exists in es or zh. Live, `/IndicatorPublic/es/data-stories/housing/` and `/es/keywords/`: the Topics dropdown holds only "All topics", and the About slot renders `<div class="nav-item bg-white text-primary border"> </div>`.
- **Consequence:** Every es and zh page (about 115 in the census) loses topic navigation and shows an empty bordered nav box.
- **Reproduction:** Load any `/es/` page at 1280px wide, open Topics, and look at the item after Explore.
- **Overlap:** None. A-086 is about the general i18n mix.

**5. The top-bar "EH Data Portal" crumb links to the current page instead of the portal home.**
- **Where:** `header.html:22` and `header-de.html:18` use `href="{{ .RelPermalink }}"`. `header-ds.html:22` uses `relURL ""`.
- **Evidence:** Live, on `/about/` the crumb's href is `/IndicatorPublic/about/`, and on `/data-explorer/asthma/` it is `/IndicatorPublic/data-explorer/asthma/`. In the same bar, "Health" and "311" both go to `https://www1.nyc.gov/`; whether that is intended is a question for the author.
- **Consequence:** Every non-home page outside data stories has a self-link where the portal-home link should be.
- **Reproduction:** Read the first `nyc-top-header` crumb href on any page.
- **Overlap:** None.

**6. The new explorer's pages have no way to reach Google Translate.**
- **Where:** `baseof.html` `if not .Params.excludeFooter`; `excludeFooter: true` is set in 57 `content/data-explorer/*.md` files. Also `#global-language` at `header.html:221` and `header-de.html:161`.
- **Evidence:** The only triggers are the footer's 20 `.lang-select` links. Nothing in themes, content or assets targets `#global-language` (only `main.js` handlers listen for its collapse events), so the widget container never opens on any page. Live, `/data-explorer/asthma/` has 0 `lang-select` links and no `#global-footer`. `excludeFooter` came in with `f51d464b06` ("first pass at new data explorer experience"), and the old explorer's content does not set it.
- **Consequence:** About 42 explorer pages load `translate_a/element.js` but give no way to use it. Whether that is intended is a question.
- **Reproduction:** In a browser on `/data-explorer/asthma/`, expand the header and look for any language control.
- **Overlap:** A-086 records the mixed i18n generally, not this loss of access.

**7. The footer's native-language links have no `lang` attribute.**
- **Where:** `footer.html:15` onward: 20 `a.lang-select` (Arabic, Bengali, Chinese, Urdu, and others) on `<html lang="en">` pages.
- **Evidence:** `grep -c ' lang="' footer.html` returns 0.
- **Consequence:** Screen readers read these names with the page language (WCAG 3.1.2, AA). axe does not flag a missing `lang`, so 3b's zero does not clear this.
- **Reproduction:** The grep, or a screen reader on the footer.
- **Overlap:** None.

**8. The subscribe dialog has no accessible name.**
- **Where:** `subscribe-modal.html:3`: `role="dialog"` with no `aria-labelledby` or `aria-label`, unlike `#searchModal`.
- **Evidence:** File read; live HTML matches. axe's `aria-dialog-name` is best-practice, outside 3b's WCAG tags.
- **Consequence:** Screen-reader users hear an unnamed dialog on every page.
- **Reproduction:** Open Subscribe and read the dialog's accessible name in the a11y tree (needs browser).
- **Overlap:** None (A-033 is analytics).

**9. The GA `search` event fires on every debounced keystroke pause and every filter toggle.**
- **Where:** `search-modal.html:30-31` (`debounceTimeoutMs: 500`, `processTerm` calls `gtag('event','search')`).
- **Evidence:** In the live `pagefind-ui.js`, `processTerm` is invoked inside the debounced search function, which re-runs whenever the term or the filters change.
- **Consequence:** `search_term` data fills with prefixes and repeats. A-383's planned GA `search_term` test would read that data.
- **Reproduction (needs browser):** Set `window.gtag=(...a)=>(window.__g=(window.__g||[]).concat([a]))`, open search, type "asthma" with pauses over 500ms, toggle a filter. Expect several `search` events.
- **Overlap:** Extends A-091 (event naming) and A-383. The new point is the data quality.

**10. A likely cause for N-017: both affected shells put a Bootstrap `.row` outside any container.**
- **Where:** `_default/list.html:31` (`<div class="row mt-4">` directly in `<main>`) and `header-de.html:274` (`row bg-black de-nav-bar` directly in `<body>`; `_de-custom.scss` resets only `margin-left`).
- **Evidence:** I tabulated the committed prod_prod baseline. `overflowX` is true on every list.html page (categories, keywords, tags, paginators, all three languages) and on 42 of 44 explorer pages. The 2 that do not overflow are `data-index` and `indicator-catalog`, which do not set `headerDE`. This is correlation only.
- **Reproduction (needs browser):** On `/keywords/asthma/` at 1280px, run `[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth)` and expect `.row`. Then zero its right margin and re-check `scrollWidth`.
- **Overlap:** Extends N-017, whose overflowing element is unidentified.

**11. Google Translate is told the page is English on es and zh pages.**
- **Where:** `js_bottom.html:26` (`pageLanguage: "en"`).
- **Evidence:** The value is hardcoded while `<html lang>` is per-language.
- **Consequence:** The source language is wrong for translation of Spanish and Chinese pages; the effect needs a browser.
- **Reproduction:** On `/es/`, pick a footer language and observe.
- **Overlap:** Extends A-086.

**12. Low, cosmetic.**
- `header-de.html:70`, `:188`: navs have no `aria-label` (G6-23 handed this to Task 4). Explorer pages have no footer and the two navs are never visible together, so at most one unlabelled nav is exposed and the consequence is small.
- `baseof.html:30`: the empty `<ul id="results">` sits on every page with no consumer (`git grep` finds none) and shows up as a Pagefind anchor.
- Topics menus sort by `Params.Title` but display `shortTitle`, so live order shows "Health outcomes" before "Food and drink".

**Not checked:**
- Rendering, focus and modal behaviour, because no browser was run (port 8090 is busy, and I did not drive Playwright).
- Whether any displayed default Leaflet marker needs `marker-icon-2x.png`. `lib-leaflet` does not publish it and it is 404 live, but the default-marker sites I found (`neighborhood-rats.js:248`, `:269`) are never added to the map.
- #1491's copies of the shell files.

Scratch files are in `C:\Users\Chris\AppData\Local\Temp\claude\c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge\0233f26f-0e1e-4e53-ba56-89abc75dfdf0\scratchpad\` (`ov.py`, `seoimg.py`).

#### Area b: Data explorer (production @ b8f4b32fbd)

Overlap checked against: A-026, A-029, A-031, A-032, A-076, A-104, A-112, A-133, A-152, A-153, A-154, A-155, A-158, A-159, A-163, A-167, A-170, A-189, A-205, A-208, A-211, A-230, A-247, A-256, A-259, A-265, A-273, A-280, A-285, A-287, A-292, A-295, A-296, A-297, A-300, N-002, N-008, N-017, C-S3-3 (disconfirmed, not re-raised), C-T3-3, G1-96. I also checked the fresh audit, the de-pre-ship review and the analytics, chart-width and architecture docs.

I found 9 candidates. All are static readings at the audit worktree (code equal to b8f4b32fbd). Candidates 1–8 and the timing in 9 need a browser to confirm.

**C1. Pressing Escape to close a modal or an open dropdown also closes the open explorer pane and adds a history entry.**
- **Where:** `assets/js/data-explorer/de-tab-content.js`, the `document` `keydown` listener (`:135` `event.key !== 'Escape'`, `:139` the `.tab-pane.show.active` lookup, then `closeExplorerTabPane`, which sets `DE.state.overlay = 'none'` and calls `pushSelectionToURL()`).
- **Evidence:** The listener sits on `document` and checks nothing about where the key event came from. Bootstrap 4.6.2's modal Escape handler (`node_modules/bootstrap/dist/js/bootstrap.bundle.js:4924-4936`, `_setEscapeEvent`) calls `preventDefault()` but not `stopPropagation()`, so the event reaches `document`. The dropdown handler (`:4517-4542`) does call `stopPropagation()`, but jQuery binds it on `document` itself, and that does not stop another listener on the same node. The modals affected are `#printModal` (opened by the panes' own Save Chart buttons), `#indicatorSelector`, `#topicSelector`, `#learnMore` and `#searchModal`.
- **Consequence:** Escape is the standard way to close a modal, so every keyboard user who opens Save Chart and presses Escape comes back to a closed pane and an extra `overlay=none` history entry.
- **Reproduction:** Open `/data-explorer/asthma/?id=2380&overlay=bar`, click "Save Chart" in the Bar pane, press Escape. Confirmed if the modal closes, `#v-pills-bar` loses `.show.active`, the URL reads `overlay=none`, and `history.length` grows by 1. Repeat with the Measure dropdown open.
- **Overlap:** none.

**C2. The Data Sources tab is not tracked as an overlay, so changing a dropdown closes it, and the URL names a different pane while it is open.**
- **Where:** `app.js` `tabMap` (`:642`) has no `#v-pills-ds-tab` entry; its only binding is analytics (`:714`). Also `renderCurrentView` `case 'none'` (`:414`).
- **Evidence:** On first load `DE.state.overlay` defaults to `'none'` (`data.js:225`). Opening Data Sources leaves it at `'none'`. `handleSelection` (`menu.js`) then calls `renderCurrentView(true)`, whose `'none'` branch removes `active` from every pill and hides every pane, Data Sources included. If the overlay was already `trend` or `bar`, the Data Sources pane stays open while the URL and the citation keep `overlay=trend`.
- **Consequence:** A reader on the "About the data" pane who changes Measure, Boundary or Time loses the pane. Links copied while it is open reopen a different pane.
- **Reproduction:** Open `/data-explorer/asthma/?id=2380`, click Data Sources, pick another Measure. Confirmed if the pane closes. Second check: from `?id=2380&overlay=trend`, click Data Sources; the URL still reads `overlay=trend`.
- **Overlap:** related to A-152 (stale text in `#howCalculated`). New here is the pane closing and the URL/state mismatch.

**C3. After picking an indicator in place on a topic page opened without `?id=`, Back strips the id from the URL but leaves the indicator on screen.**
- **Where:** `app.js` `popstate` handler: `if (selection.id && selection.id !== DE.state.IndicatorID)` (`:588`), then `refreshCitation()` (`:579`).
- **Evidence:** `checkURL` writes no history when the URL has no id. `selectIndicator` then pushes `?id=…`. On Back, `selection.id` is `null`, so the same-indicator branch runs, applies nothing and re-renders the current indicator. The citation is refreshed from the bare URL.
- **Consequence:** The Back press appears to do nothing. The address bar and the citation URL (`.citation-url`) point to a bare topic page that opens the chooser, not the view being cited.
- **Reproduction:** Open `/data-explorer/asthma/`, pick an indicator in the chooser, press Back. Confirmed if the URL has no `id`, the indicator stays rendered, no chooser opens, and `.citation-url` holds the bare URL.
- **Overlap:** none. A-208 and A-285 cover other popstate branches.

**C4. Below the `md` breakpoint (768px), the Bar, Trends, Correlate and Table tabs have no accessible name.**
- **Where:** `themes/dohmh/layouts/partials/de-tab-button.html:10, :14, :18, :22`.
- **Evidence:** Each `<a role="tab">` holds an `<svg>` with no `<title>` or label, plus a text `<div class="mt-1 d-none d-md-block">`. `display:none` text drops out of the accessible name. The same partial is on `data-explorer/section.html`. The axe run and the census were both at 1280×900, so neither could see this.
- **Consequence:** Screen-reader users on phones hear four unnamed tabs.
- **Reproduction:** At a 375×800 viewport, load `/data-explorer/asthma/?id=2380` and read the computed names of `#v-pills-bar-tab` and its siblings (DevTools accessibility pane, or Playwright `getByRole('tab')`). Confirmed if those four are empty and Data Sources is named.
- **Overlap:** the same mechanism as A-296's "mobile Learn More", which was fixed; these tabs were not covered.

**C5. The summary table's group-header rows (time, geography, borough) collapse on mouse click only.**
- **Where:** `table.js` `bindTableGroupToggles` (`:937`, `$('body').on('click', '#summary-table tr.group td', …)`) and the `drawCallback` row markup (`:825`).
- **Evidence:** The rows are a plain `<tr class="group"><td>`: no `tabindex`, no `role="button"`, no `aria-expanded`, no `keydown`. The collapsed state exists only as the `hidden` class on the `td`.
- **Consequence:** Keyboard and screen-reader users cannot collapse or expand groups, and are not told when groups are collapsed.
- **Reproduction:** Open `/data-explorer/asthma/?id=2380&overlay=table` and tab through the table. Confirmed if no group header takes focus and `document.querySelectorAll('#summary-table tr.group [tabindex], #summary-table tr.group [role=button]').length === 0`, while a mouse click does collapse a group.
- **Overlap:** none. G3-16 and G3-90 cover porting and rebinding, not keyboard access.

**C6. An `?id=` that is missing from `metadata.json` (a retired indicator, a typo) ends in an unhandled TypeError.**
- **Where:** `topic-indicator-selector.js` `renderIndicatorInfo` warns "No indicator found" (`:527`), opens the chooser and returns, but `loadAndRenderIndicator` carries on. `measures.js` `renderMeasures` then reads `DE.lookups.aqTableTimesGeos.array("TimePeriod")` (`:1903`).
- **Evidence:** `getIndicatorById` returns `undefined`. The 404 fetch is caught inside `loadData`'s `try`. `renderMenus` warns and returns. `aqTableTimesGeos` starts `undefined` (`global.js:144`). After an earlier in-place load it is stale instead, and `indicatorMeasures.forEach` throws.
- **Consequence:** An uncaught promise rejection, and the "Loading indicator..." placeholders stay. Old links from stories or outside sites are where this would happen.
- **Reproduction:** Load `/data-explorer/asthma/?id=99999`. Confirmed if the chooser opens and the console shows an uncaught (in promise) TypeError from `renderMeasures`.
- **Overlap:** none.

**C7. The Take Action menus show a live placeholder link, "Dynamic option" (`href="#"`), on the explorer section page and on topic pages opened without `?id=`.**
- **Where:** `header-de.html:455` (`#contact311LinksDesktop`) and `de-tab-button.html:39` (`#contact311LinksMobile`).
- **Evidence:** Only `render311Links` (`311.js`) clears or hides these, and it runs only inside the indicator pipeline. `section.html` does not load `311.js` at all, and `checkURL` returns before the pipeline when there is no id. `header-de.html` renders the menu unconditionally.
- **Consequence:** Visitors see "Contact 311 about: Dynamic option" and a link to `#`.
- **Reproduction:** Open the Take Action menu on `/data-explorer/` and on `/data-explorer/asthma/`. Confirmed if "Dynamic option" is visible.
- **Overlap:** the census's `links.emptyHref` floor (22 on topic pages, 12 on the section page) is recorded as a number with no finding row. This names one of the links behind it.

**C8. On the map, the "View this data as a table" link closes the table when the table is already open.**
- **Where:** `data-explorer/single.html:32`, `onclick="document.getElementById('v-pills-table-tab').click()"`, together with the click-to-close handler in `de-tab-content.js` (`:32-55`).
- **Evidence:** A programmatic `.click()` still triggers that handler. When the tab is already active and its pane shown, the handler closes the pane, sets `overlay = 'none'`, and stops the event before `app.js` sees it.
- **Consequence:** The keyboard and screen-reader path to the data hides the data.
- **Reproduction:** Open `/data-explorer/asthma/?id=2380&overlay=table`, tab to the sr-only link, press Enter. Confirmed if the table pane closes and the URL reads `overlay=none`.
- **Overlap:** extends A-159, which covers only the link's nesting inside `role="img"`. New here is what activating it does.

**C9. The automatic jump to Trends for citywide-only indicators happens on a direct load but not when the indicator is picked in place. Is that intended?**
- **Where:** `data.js:216` (`citywideTrendDefaultPending = !DE.state.overlay`), which runs before `:225` sets `'none'`; `app.js:123` keeps the overlay across selections. The flag also gates the polygon click-through in `map.js` (`switchToTrendTabOnce`).
- **Evidence:** After any first load, the overlay is the `'none'` that `loadIndicator` itself wrote. The code then treats that default as a user's tab choice, so the jump and the click-through are switched off for every later in-place pick.
- **Consequence:** The same indicator opens on Trends from a link but sits on a grey citywide map when chosen from the chooser. Whether `'none'` was meant to count as a user choice is a question for the author.
- **Reproduction:** Open a mapped indicator on `/data-explorer/air-quality/`, choose "Ozone action days" (id 55) via Change dataset, then compare with a direct load of `?id=55`. Confirmed if only the direct load jumps to Trends, and clicking the polygon after the in-place pick does nothing.
- **Overlap:** none.

**Checked and ruled out:**
- Every id the explorer JS looks up exists in some template, apart from `viewDescription` and the legacy `#tab-*` hashes, which only exist in the old explorer and are guarded.
- The time-dropdown sort: `end_period` is numeric epoch milliseconds.
- `TrendNoCompare` only ever holds `'2021'`.
- The table CSV's Area column comes out clean after tag stripping.
- The old explorer's pages are kept out of `de-topic-indicators`' page list (`build: list: never`).
- Every IndicatorID listed on a built topic page exists in production `metadata.json`.
- Search sub-result anchors are rewritten to `?id=` in `search-modal.html`.
- The `chartType` order between map and overlay renders.

**Not checked:**
- Nothing was run in a browser (rules: no servers), so every runtime consequence above is untested.
- I did not read `print-map.js`, most of `map.js`, `bar.js`, `correlate.js`, `disparities.js`, or `data-index.html` past line 190.
- Not reviewed: the `de-chooser-accordion` and `de-chooser-modal` partials, and `de-announcement`.

#### Area c: Neighborhood Reports (#1491 @ d1c7402735)

Checked for overlap: A-001, A-002, A-027, A-039, A-041, A-042, A-050, A-057, A-058, A-064, A-065, A-133, A-134, A-148, A-149, A-150, A-170, A-339 through A-402 (every #1491 NR row), N-011, N-021, all Candidates (C-S3-1..3, C-S4-1, C-T3-1..3) and the Disconfirmed list. Also checked F1–F8 in `nr-accessibility-audit-2026-08-10.md`, and `documents/pr-1491-review-fixes-2026-10-17.md` at 00737207cb, which fixes the title suffix, query/hash stripping, hover style, viz-fail "Loading...", blob revoke and the map.js name collision. I left all of those out.

**1. A long query string makes the print QR code throw. This is a regression in b33ba2373e, which is not in d1c7402735.**
- **Claim:** At 00737207cb, `renderQRCode()` encodes `location.href` including its query and hash. `qrcode(10,'M')` holds at most 213 bytes, so a URL with a long query string makes it throw "code length overflow" inside `renderAll`.
- **Where:** `nr-report.html` `renderQRCode` (inline; `qrcode(10, 'M')` and `code.addData(location.href)`, `git show 00737207cb:` lines 384–385), called from `report.js` `renderAll`. `url.js` `setNeighborhoodInURL` now returns early when the path is unchanged and keeps `search + hash` (b33ba2373e, step 2). At d1c7402735 it always ran `replaceState(newPath)` before the QR call, so the QR only ever saw the bare path.
- **Evidence:** I ran a node one-off against the repo's `qrcode-generator/dist/qrcode.js` (script in my scratchpad). Capacity in byte mode is 213: a 213-character string fits and 214 throws. The longest report URL on prod_prod is 144 characters (`central_harlem_morningside_heights/active_design_physical_activity_and_health/`), leaving 69 bytes of headroom. The same URL with an fbclid-like query (240 characters) threw `code length overflow. (1940>1728)`; with a 61-character utm query it fit. `renderQRCode` has no try/catch.
- **Consequence:**
  - Visitors who arrive from a shared or social link with a long tracking parameter (fbclid, gclid) print a report with no QR code.
  - On an in-place switch, `renderAll` throws before `announceNeighborhoodChange`, so the title rewrite and the live-region announcement are skipped. That partly reopens A-344 for these visitors.
  - When the geojson fetch is the last load to finish, the throw lands in `initLeafletMap`'s `.catch`. That logs "Error loading UHF42 GeoJSON", which is misleading, and calls `tryInitialRender` a second time.
- **Reproduction:** Needs a browser. Use a dev server at 00737207cb on localhost:8080/dev-stage/; the local prefix is 13 characters shorter than prod, so the query plus hash must exceed about 82 characters.
  1. Load `/neighborhood-reports/central_harlem_morningside_heights/active_design_physical_activity_and_health/?fbclid=` followed by 90 characters.
  2. Confirmed: a console error "code length overflow", `#qrcode` is empty, and print emulation shows "View this report online:" with no image.
  3. Controls: the same URL with no query shows an `<img>`; the same long URL at d1c7402735 also shows an `<img>`.
- **Overlap:** Extends A-369 (QR regeneration, FIXED) with a new way for it to fail.

**2. The report page breadcrumb still names the original neighborhood after an in-place switch.**
- **Where:** `nr-report.html` breadcrumb, `<a href="…neighborhood-reports/{{ .Params.neighborhood_slug }}/">{{ .Params.neighborhood }}</a>` (line 63 at both commits). `url.js` `updateTopicLinks` rewrites only `.nr-topic-link`.
- **Evidence:** `git grep -n -i breadcrumb 00737207cb -- assets/js/nr-report/` finds nothing. `renderAll` updates the h1s, ZIPs, demographics, topic links, URL, QR and title, but not the breadcrumb.
- **Consequence:** After switching from Bayside to Kingsbridge, the page says Kingsbridge everywhere except the breadcrumb. It still reads "Bayside - Little Neck" and links to Bayside's index, so the "up" link leads to the wrong neighborhood.
- **Reproduction:** Needs a browser. At a width of 576px or more, load `/neighborhood-reports/bayside_little_neck/asthma_and_the_environment/` and press Enter on the Kingsbridge polygon. Confirmed: `nav[aria-label=breadcrumb] li:nth-child(3) a` text and href are unchanged while the h1 reads Kingsbridge - Riverdale.
- **Overlap:** None. The C1 probe in the a11y audit read only the h1, title, URL and live region.

**3. On the 42 neighborhood index pages, the map polygons are focusable, unnamed and click-only, and the map flies to the neighborhood.**
- **Where:** `partials/nr-leaflet.html` as rendered by `nr-neighborhood-index.html`. The map has no `aria-hidden` wrapper, so `removeHiddenMapFromTabOrder` returns early. `onEachFeature` binds click only; the tooltip uses `GEONAME`; the geocode branch calls `flyToBounds` with the default `zoomSnap`.
- **Evidence:**
  - `nr-neighborhood-index.html` includes `nr-leaflet` directly and has no neighborhood list.
  - The a11y audit's F1 and F2 counted 42 polygon tab stops on the picker pages and the report page, but nothing was recorded for the neighborhood index.
  - map.js (both commits) justifies nr-leaflet flying because "its polygons answer no key and the 42-neighborhood list beside it carries the navigation". That list does not exist on this page kind.
  - The GEONAME tooltip disagrees with the h1 (`UHF_name`) on 6 of 42 neighborhoods (map.js's own comment).
- **Consequence:**
  - Keyboard users meet 42 or more unnamed tab stops where Enter does nothing.
  - Pointer users get the same reachability problem A-148 measured on the report map (9 of 42 polygons reachable at zoom 12, in a box of the same size).
  - On, for example, `/rockaways/` the tooltip reads "Rockaway" while the h1 reads "Rockaways".
- **Reproduction:** Needs a browser. On `/neighborhood-reports/east_new_york/`, run the `nr-a11y-audit` tab sweep or tab through by hand. Confirmed: about 42 `path` stops with an empty accessible name, and Enter on one leaves `location` unchanged. Then run A-148's Playwright actionability check across the 42 paths after the 500 ms flyTo.
- **Overlap:** Extends A-339 and A-148 (report map, FIXED) and A-134 (picker pages) to the fourth page kind.

**4. The current topic, and the selected neighborhood on the report map, are shown only through styling.**
- **Where:**
  - `section.html`: `.nr-topic-button.active` with no `aria-pressed`. The active button decides where the map click, the search box and all 42 list links go.
  - `partials/nr-topic-menu.html`: `.active` with no `aria-current`.
  - `map.js` `selectLayer`: style only on the selected polygon.
- **Evidence:** `git grep -n -E 'aria-pressed|aria-current' 00737207cb -- <NR scope>` hits only the three breadcrumbs.
- **Consequence:** Screen-reader users on the landing page get no state change when they choose a topic, even though it changes where every link goes (WCAG 4.1.2). On the report map they cannot tell which of the 42 "button" polygons is the current one.
- **Reproduction:** Needs a browser. In the CDP accessibility tree on `/neighborhood-reports/`, the topic buttons show no pressed state before or after clicking "Climate".
- **Overlap:** None. F4 and A-340 cover contrast only.

**5. `nr-leaflet.html` logs to the console unconditionally on 48 pages.**
- **Where:** `getReportAndNeighborhood`, `pageTypeID` and `selectNeighborhood`. At 00737207cb there are 10 live `console.log` calls (lines 269, 290–292, 304–320, 333); six fire on every load of the landing page, the 5 topic indexes and the 42 neighborhood indexes. `debugLog` exists site-wide (A-057).
- **Overlap:** Same kind as A-170 (DE `section.html`), in a different file.

**6. Stale comments and a misleading name in nr-report JS (low).**
- At 00737207cb:
  - `report.js:217` says the header blocks "are display:none in the layout until a neighborhood is picked"; the template renders them visible.
  - `report.js:194` says `currentNeighborhood` "is null until the first render"; it starts as `''`.
  - `data.js:20` and `url.js` `getNeighborhoodFromURL`: the function reads `reportConfig.neighborhood`, not the URL. This is a name CLAUDE.md pre-authorizes renaming.
- **Overlap:** None. A-393 is about spacing.

**Refinement to A-374, not a new candidate.** On both EHDP-data branches, every row with a null `unmodified_data_value_geo_entity` also has a null `data_value_rank`: 48 of 3570 rows on production and 48 of 3654 on staging, none split. `cards.js` puts `d-none` on the comparison block when rank is null, so the null-as-0 comparison is unreachable with today's data. The latent bug stays.

**Checked and dropped:**
- Neighborhood names: all 42 `UHF_name`s match the `neighborhood` values in every report JSON and viz JSON on production, and IDs match (0 mismatches).
- Rank-descending card order matches production's `sort … "data_value_rank" "desc"`.
- The flexdatalist `select` event passes the full item, so `set.page_name` resolves.
- Unescaped `innerHTML` in `cards.js`: no EHDP-data value breaks markup today.

**Not checked:** Nothing runtime. I did not start a server because port 8090 is in use, so candidates 1–4 need a browser. I also did not check the old `nr-output` and `topiclanding` paths, since they are retired on #1491.

#### Area d: Data features, stories, shortcodes (production @ b8f4b32fbd)

Area d review (data features, data stories, shortcodes) at the audit worktree, whose code equals b8f4b32fbd outside documents/.

**Overlap checked against:** A-002, A-012, A-014, A-021, A-043, A-044, A-045 through A-049, A-132, A-133, A-136, A-138 through A-147, A-151, A-311, A-312, A-313, A-333, A-334, N-001, N-003, N-005, N-006, N-007, N-009, N-011 through N-015, N-018, N-019, N-023, and C-T3-3 (Disconfirmed).

---

**1. The neighborhood-air-quality map reads an older dataset than the page's own cards. Building-emissions tertiles disagree for 81 of 262 NTAs.**
- **Where:** `content/data-features/neighborhood-air-quality/aqe.js`. In `renderMap`, the lookup pulls from a personal gist pinned to one commit (`gist.githubusercontent.com/mmontesanonyc/…/1fe4964…/aqe-nta.csv`, aqe.js:351). `setNeighborhood` and `sourceTertile` fill the cards from the bundle's `aqe-nta.csv` (aqe.js:88).
- **Evidence:** I curled the gist and diffed it against the bundle CSV after stripping CRs. They have different schemas: the gist has `TotalPM`/`TotalNOx`, the bundle has `PM_Avg`/`NO2_Avg`. Python comparison over the 262 NTAs both files share, per map field: `cook_tertiles` 0 differ, `Industrial_tertiles` 0, `Traffic_tertiles` 0, `Building_emissions` 81 differ (e.g. BK0101 is High in the gist, Medium in the bundle). Control: the bundle compared with itself gives 0. `git log` shows the bundle CSV was updated with 2023 data in c08dc4826a (2025-05-01). The gist URL dates from 53447cb046 (2024-04-22).
- **Consequence:** Building emissions is the map's default layer (`renderMap(1,…)`). For about a third of neighborhoods, the shaded tertile contradicts the card beside it. The data also depends on a personal gist.
- **Reproduction:** Open `/data-features/neighborhood-air-quality/` and pick Greenpoint (BK0101). Confirmed if the card says Medium for building emissions and the map tooltip says High.
- **Overlap:** none.

**2. The realtime "Last 24 hours" average always divides by 24, even when a monitor reported only 18 to 23 hours.**
- **Where:** `content/data-features/realtime-air-quality/js/realtime.js`, `printRecentAverage`. It uses `average = totals / 24` (twice) behind `thisLast.length > 17`.
- **Evidence:** Read the function. A monitor with 20 readings gets an average 20/24 of its true mean. That value also drives the `average > 35` switch that shows `#exceeds` ("Exceeds NAAQS 24-hour standard") and hides `#allUnder`.
- **Consequence:** Incomplete-day averages are understated, which can show "All levels are below the NAAQS" when the mean of the hours actually reported is above 35. Whether /24 is intended (it treats missing hours as zero) is a question for the author; the page's own footnote frames 18 hours as a completeness threshold.
- **Reproduction:** Static: compute the mean over `thisLast` against `totals/24` for any monitor whose last-24h row count is between 18 and 23 in `nyccas-data/main/portal/view.csv`. Needs browser: compare the table value with that recomputation.
- **Overlap:** none (N-014 and A-049 are about markers and AirNow).

**3. Five Datawrapper maps on air-quality-snapshots never load.**
- **Where:** The page's front matter has `layout: flexible`. `themes/dohmh/layouts/data-stories/flexible.html` does not load `js/data-stories/lazy-tab-embeds.js`; only `single.html` does.
- **Evidence:** `git grep lazy-tab-embeds -- themes content` finds only `single.html:23`. The page has 5 `data-lazy-src` iframes (mDgo3, XWE9m, 8urPc, l7Ouh, v5vt2), and nothing else sets their `src`. Commit a0ce013172 converted this page to `data-lazy-src` but did not touch `flexible.html`. Smoke cannot see this, because an iframe with no src throws nothing.
- **Consequence:** Clicking tabs 01-b/c/d or 02-b/c shows an empty frame.
- **Reproduction (needs browser):** Open `/data-stories/air-quality-snapshots/`, click "Cardiovascular hospitalizations", then read `#datawrapper-chart-mDgo3`'s `src`. Confirmed if it is empty and `data-lazy-src` is still present.
- **Overlap:** related to A-043 (the lazy-embed fix), but the opt-in is broken on this page.

**4. Three broken links in the cooling-info tool, two of them in safety messages.**
- **Where:** `content/data-features/cooling-info/cooling-info.js:425` uses `href='https://:finder.nyc.gov/coolingcenters/'`; this is the message for people with no AC when it is 85°F or hotter. `:446` uses `href="a858-nycnotify.nyc.gov/notifynyc/"`, with no scheme, so it resolves under the page path. `content/data-features/cooling-info/config.js:48` closes "register your equipment…" with `<a>` instead of `</a>`.
- **Evidence:** A Python href sweep over 817 in-scope files found these two hrefs plus two out-of-scope ones (see the end). Grep found the config line.
- **Also:** `runFinal` tests `maxTemp < 78` and `maxTemp > 78`. `maxTemp` can be exactly 78.0 (the reading is a 0.1°F conversion), and then a user with AC gets no temperature message. Whether 78 should be inclusive is a question.
- **Reproduction:** Open `/data-features/cooling-info/`, answer "No AC" with a temperature of 85 or more, and click the "visit a cool public place" link. Confirmed if the browser rejects the URL.
- **Overlap:** none.

**5. On production, the 2023 and Jan–Jun 2024 Rat Mitigation Zone reports are never built.**
- **Where:** `content/data-features/rat-report/2023/index.md` and `2024/index.md`, both `draft: false`. They sit inside the leaf bundle `rat-report/index.md`, so Hugo treats them as page resources rather than pages.
- **Evidence:** The committed `prod_prod` baseline has only `data-features/rat-report/index.json`, while it does have heat-report-archive year pages. The audit's census on P matches that baseline. The `update-rat-mitigation-report` branch's plan records the same diagnosis and a fix (0122a3c4e4, Decision D2). That branch is unmerged.
- **Consequence:** The previous editions of a report required under Admin Code 17.133.3 return 404, even though they were edited as recently as 2026-05-08.
- **Reproduction:** `git ls-tree production -- content/data-features/rat-report/_index.md` returns nothing. In an isolated `prod_prod` build, `rat-report/2024/index.html` is absent.
- **Overlap:** none in the audit doc. A fix exists on the unmerged branch.

**6. air-quality-snapshots tab panes carry a static `aria-hidden="true"` that Bootstrap never removes.**
- **Where:** `content/data-stories/air-quality-snapshots/index.md`. Five `tab-pane`s carry it, including the initially active `#tab-02-a`. Also, `#tab-btn-01-a` has `aria-controls="tab-02-a"` where it should point at `tab-01-a`.
- **Evidence:** `node_modules/bootstrap/js/src/tab.js` (4.6.2, the version `js_bottom.html` loads) has 0 `aria-hidden` references and 2 `aria-selected`. A grep for tab panes with static `aria-hidden` across content and themes found this page and the `overlap-tool.html` partial (A-350's file, outside this area).
- **Consequence:** Shown maps stay hidden from screen readers.
- **Reproduction (needs browser):** Click any tab on that page and check the pane's `aria-hidden` and its accessibility-tree visibility.
- **Overlap:** N-006 (tab roles) is a different defect.

**7. The `datawrapper` shortcode names every chart "Interactive chart" and gives every chart the same id.**
- **Where:** `themes/dohmh/layouts/shortcodes/datawrapper.html` emits `aria-label="Interactive chart"` next to `title='{{ .Get "title" }}'`, and a hardcoded `id="datawrapper-chart-O0SUA"`.
- **Evidence:** In accessible-name computation, `aria-label` wins over `title`, so the authored titles are never announced. The shortcode is used in 17 content files. The violence es/zh pages each hold 7 shortcode iframes plus one inline iframe with the same id, so 8 duplicates on a page.
- **Consequence:** Screen-reader users cannot tell the charts apart. The ids are invalid. The resize listener's `getElementById` lookup would hit the first duplicate if chart O0SUA ever messages that page.
- **Reproduction:** In a built `/es/data-stories/violence/`, run `document.querySelectorAll('#datawrapper-chart-O0SUA').length` and check an iframe's computed accessible name.
- **Overlap:** N-013 is about untitled frames, which is different.

**8. Six more in-scope files hardcode the EHDP-data `production` branch and ignore `data_branch`.**
- **Where:** `heat-syndrome/heatsyndrome.js` (6 URLs), `rat-mitigation-zones/rmz.js`, `rats-in-your-neighborhood/neighborhood-rats.js` (2: `2434.json`, `TimePeriods.json`), `hvi/HVIMapSpec.vg.json`, `data-features/minimum-wage-with-maps.html` (3), `data-features/neighborhood-overlap.html`.
- **Evidence:** `git grep -o "EHDP-data/[a-z/]*(production|main|staging)"` over the scope.
- **Consequence:** `dev_stage` and `prod_stage` cannot preview staged data on these pages, and staging smoke reads production data for them.
- **Overlap:** extends A-147, which records the same pattern only for `overlap-tool-with-map.html`.

**9. The `list` violation comes from the shared story template, not just housing.**
- **Where:** `themes/dohmh/layouts/data-stories/single.html:59-60` puts a `<span>` directly inside `<ul class="nav navbar-nav">` in the "Read this data story in:" block.
- **Evidence:** That block renders on every translated story using this layout: 6 stories in 3 languages, so 18 pages.
- **Overlap:** extends N-012, which names only housing.

**10. Each change to realtime's day count drops one row of the feed.**
- **Where:** `realtime.js`, `updateTime`, which uses `var last = fullTable.pop()`.
- **Evidence:** `pop` removes the last row of the shared array each time it runs, so the window's end point creeps earlier with repeated changes.
- **Reproduction (needs browser):** Change `#inputNum` 15 times and compare `fullTable.length` and the chart's right edge.
- **Overlap:** none.

**11. Four shortcodes have no callers, and two of them would malfunction if used.**
- **Where:** `vega`, `vega0`, `accordion`, `storyheader`.
- **Evidence:** `git grep -E "\{\{[<%][[:space:]]*(vega|vega0|accordion|storyheader)" -- content themes` finds nothing. The last content use of `accordion` was removed in 2023-01 (145f791b10). In `vega.html`, `var istrans = "{{ .Page.IsTranslated }}"` makes the string `"false"`, which is truthy, so every untranslated page would fetch from `dir/mapspec-<lang>/`. In `accordion.html`, the trigger `<a>` carries Bootstrap's `collapse` class, and `.collapse:not(.show){display:none}` would hide it. `readme-development.md:224` still points authors to "Vega shortcodes".
- **Overlap:** extends A-002, which records only the vega/vega0 pair.

**12. heat-syndrome makes a synchronous HEAD request on the main thread while loading.**
- **Where:** `heatsyndrome.js`, `UrlExists`, which calls `http.open('HEAD', url, false)`.
- **Evidence:** Rendering is blocked on a GitHub round trip, and Chrome logs a deprecation warning. Any status other than 404 counts as "exists", including 0 on network failure and 403/429. All five data files returned 200 today, so there is no current breakage.
- **Overlap:** none.

---

**Could not check:**
- No item was confirmed in a browser. The rules forbid starting a server, so items 2, 3, 6, 7 and 10 need the reproduction steps above.
- Not read for logic: `rmz.js`, the body of `neighborhood-rats.js`, `heat-story-leaflet.js` (2,402 lines), `proximity.js`, the congestion-pricing chart files, and the inline scripts in `leading-causes`, `minimum-wage-with-maps`, `pesticides-report`, `nyccas-report` and `24-25-heat-report`.
- My duplicate-id sweep over templates had no positive control, so its empty result is not a finding.
- Out of area: both `content/data-explorer/mice-and-rats.md:69` and `content/data-explorer-old/mice-and-rats.md:61` have a scheme-less `www.nyc.gov/rats` link.

Scratch scripts are `C:/Users/Chris/AppData/Local/Temp/claude/c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge/0233f26f-0e1e-4e53-ba56-89abc75dfdf0/scratchpad/links.py`, `ids.py` and `libs.py`. Nothing in any repo was modified.

#### Area e: SCSS (production @ b8f4b32fbd)

Overlap checked against: A-007, A-015, A-027, A-029, A-066, A-067, A-068, A-069, A-100, A-122, A-158, A-171, G2-87, G4-25, G6-05, G6-30, G7-15, N-004, N-005, N-007, N-017, N-019, C-T3-3, plus the Disconfirmed section. None of the candidates below restates a row. Three of them extend rows (A-100, N-004, N-005), and each says what is new. Tree: the audit worktree. Its HEAD is e26a2e2487, which differs from b8f4b32fbd only in files outside my scope. All line numbers come from `grep -n` or Read in this session.

**1. Share links on every story page have no visible focus indicator**
- **Claim:** `.share-btn { outline: none }` strips the focus ring from the four social-share links. Their only other focus cue, the site-wide `a:focus` underline, has no visible text to underline.
- **Where:** `assets/scss/__portal-custom.scss`, `.share-btn` (`outline: none` at :937; also `.share-btn:active` at :951).
- **Evidence:** `grep -n -E 'outline|:focus' assets/scss/*.scss` finds no `.share-btn:focus` rule. `socialshare.html` holds only an `<i>` icon and a `<p>` per link, and `.social-share ul li p { display:none }`. The underline comes from `_d-enhancements.scss:258-264` (hover-focus mixin). The partial is included by 6 data-story layouts and `data-explorer-old/single.html:472` (`git grep -n socialshare -- themes`).
- **Consequence:** Keyboard users on every data story cannot see when a share link has focus (WCAG 2.4.7).
- **Reproduction:** Needs browser. Open `/data-stories/<any>/`, Tab to the Twitter share link, then read `getComputedStyle(document.activeElement).outlineStyle` and take a screenshot. Confirmed if it reads `none` and nothing visible changes.
- **Overlap:** none. G6-30 named other `outline` lines for NR only, and never re-ran them.

**2. The UHI slider loses its focus ring and has no substitute**
- **Claim:** `input[type=range]:focus { outline: none }` applies site-wide. The focused track keeps the unfocused colour (`#D6D6D6` both ways), and no thumb focus rule exists, so a focused slider looks exactly like an unfocused one.
- **Where:** `assets/scss/__portal-custom.scss`, `input[type=range]:focus` (:501-502) and `input[type=range]:focus::-webkit-slider-runnable-track` (:528).
- **Evidence:** I read :495-595. The only range input the site's stylesheet reaches is `#slider` in `themes/dohmh/layouts/data-stories/uhi.html:358` (`git grep -n 'type=.?range'`), used by `content/data-stories/urban-heat-island/index.md` (`layout: uhi`).
- **Consequence:** Keyboard users of the urban-heat-island story's interactive ratio control get no focus indicator. N-007 already records that the same control has no label.
- **Reproduction:** Needs browser. Open `/data-stories/urban-heat-island/` and Tab to `#slider`. Confirmed if computed `outline-style` is `none` and the track background stays `rgb(214, 214, 214)`.
- **Overlap:** N-007 covers the missing label on this control; the focus indicator is new.

**3. The racial-wealth-gap "Glossary" button has no focus ring**
- **Claim:** `.content-card button.card-content { outline: none }` (specificity 0,2,1) beats Bootstrap reboot's `button:focus` ring (0,1,1). The only replacement is an underline on `:hover`.
- **Where:** `assets/scss/theme.scss`, `.content-card button.card-content` (:341). The hover rule is `.content-card button.resource-card:hover`.
- **Evidence:** `grep -n -A3 'button:focus' assets/bootstrap/scss/_reboot.scss` shows :308-310, and `_b-bootstrap-imports.scss:32` imports reboot. `git grep -n -E '<button[^>]*card-content'` finds one emitter: `content/data-stories/racial-wealth-gap/index.md:196`, inside `div.content-card`.
- **Consequence:** The modal trigger on that story shows no focus state.
- **Reproduction:** Needs browser. On `/data-stories/racial-wealth-gap/`, Tab to "Glossary". Confirmed if computed `outline-style` is `none`.
- **Overlap:** none. G6-30 cited theme.scss:341 for NR, unverified, and never identified the element.

**4. "Show More" on key-topic pages hides itself while it has focus**
- **Claim:** `#toggleButton[aria-expanded="true"] { display: none }` removes the focused control the moment it is activated. Keyboard focus is dropped, and the list cannot be collapsed again.
- **Where:** `assets/scss/_de-custom.scss`, `#toggleButton[aria-expanded="true"]` (:375).
- **Evidence:** `git grep -n toggleButton` finds `key-topics/single.html:256`, an `<a role="button" data-toggle="collapse" href="#collapseStories">`. It is rendered when `gt $dataStories 5`. The rule came in with `c57230973a`, "design review for key topics" (`git log -S toggleButton`).
- **Consequence:** WCAG 2.4.3 (focus order): after activating Show More, the next Tab starts from wherever the browser reset focus. Hiding the button looks intended. The question for the author is whether losing focus was part of that intent.
- **Reproduction:** Needs browser. Open a key-topic page where `document.getElementById('toggleButton')` exists, focus it, and press Enter. Confirmed if `document.activeElement` becomes `body` or anything other than the stories region.
- **Overlap:** none. C-T3-3 touched `#collapseStories` only for image sizes.

**5. N-004 extension: the SCSS mechanism behind colour-only links**
- **Claim:** The only at-rest underline rule for body links is `#primary-content p > a:not([class])`. Any link inside `li`, `td` or `dd`, any link with a class, and every link on a template without `id="primary-content"` is distinguished by colour alone.
- **Where:** `assets/scss/_d-enhancements.scss`, `#primary-content p > a:not([class])` (:320-322). Supporting values: `$link-hover-decoration: none` (`_a-global-variables.scss:358`) and Bootstrap's `$link-decoration: none` (`_variables.scss:173`).
- **Evidence:** I swept every `text-decoration: underline` in `assets/scss` (`grep -n -B4`). The others are hover/focus-only, nav `.active`, or `.indicator-card a`. `git grep -c 'id="primary-content"' -- themes` gives 16 templates, and `data-explorer/data-index.html` (N-004's data-index example) is not among them.
- **Consequence:** This names the one rule to widen, and predicts which of the 89 axe-incomplete pages are real failures.
- **Reproduction:** Static. A verifier can check that every N-004 node is either outside `#primary-content` or not a direct `p > a` child.
- **Overlap:** extends N-004. The cause and the fix point are new.

**6. A-100 extension: most of its static question can be settled without a browser**
- **Claim:** A-100's literal `#008939` grep finds 5 sites, and none of the 5 fails:
  - `__portal-custom.scss:209,212` is `.btn-outline-green`, which has 0 emitters.
  - `:1305` is `.pullquote`, 24px bold, so the large-text threshold of 3:1 applies; it measures 4.53 on white.
  - `_de-custom.scss:771,776` is set on `background-color: white`, also 4.53.

  The grep also misses 13 `color: $primary` / `color: $hover` uses (`grep -n -E 'color:\s*(\$primary|\$hover)'`):
  - `theme.scss:42` is `a:hover { color: $hover }`, which puts hovered links at 4.45:1 on the `#FDFDFD` that theme.scss's own comment names (I computed it with sRGB luminance).
  - `theme.scss:459,477` sit in the dead `.sidebar-report` (#8).
  - The rest are hover states, large text, or icons.
- **Where:** as listed.
- **Consequence:** A-100 shrinks to one hover-state pair, plus whether the team counts hover states at all.
- **Reproduction:** `git grep -n -F btn-outline-green -- themes content assets/js` returns 0. Then recompute the ratios.
- **Overlap:** extends A-100.

**7. Dead SCSS in `_de-custom.scss` beyond A-158, A-171 and A-122**
- **Claim:** These tokens have 0 emitters anywhere:
  - `#trendControls`, `#correlateControls`, `#trendControlsToggle`, `#correlateControlsToggle` (:678-686)
  - `#trendSelectionSummary`, `#linksSelectionSummary` (:717-718)
  - `.de-accordion` (:488-512 and :804-822) and `.de-accordion-label`
  - `.nav-link-sm` (:745), `.de-nav-action-link` (:779), `.w-md-40` (:786)
  - the print-only `.p-mt-sm` (:84) and `.reports` (:79)
- **Evidence:** One loop of `git grep -n -F -e <token> -- themes content assets/js data static config i18n ':!static/css' ':!*.min.js' ':!*.map' | wc -l` returned 0 for each token. The positive control on the same command returned `share-btn` 4 and `tableFilterSummary` 2. The only dynamic id generator, `` button.id = `${menuId}Toggle` `` in `createBadgePillDropdown` (`measures.js:541-556`), has no caller (JS aside, outside my area).
- **Consequence:** Dead weight in a file A-067 already calls oversized, and it misleads anyone tracing DE layout.
- **Reproduction:** Re-run the loop.
- **Overlap:** extends A-158 with a disjoint set.

**8. Dead legacy and NR rules in `theme.scss` and `__portal-custom.scss`**
- **Claim:** Same sweep, 0 emitters each:
  - in `theme.scss`: `.sidebar-report` (:441), `.report-topic`, `.topic-header`, `.indicator-headings`, `.info-modal`, `span.th-sub`, `.my-5.p-no-margin`, `.list-group.custom-active`
  - in `__portal-custom.scss`: `.btn-outline-green`, `.btn-outline-blue`, `.btn-outline-gray`, the five `.tile-*` families, `#illimg`, `.aboutbox`, `.activebadge`, `.storybadge`, `.vcard`, `.topiccontainer`, `.panel-grid`
- **Evidence:** as #7. My unfiltered sweep script also flagged library-emitted names (`autocomplete__*`, `pagefind-ui__*`, `goog-*`) and the `#nav-item-0N` ids. The ids are false positives: `header-ds.html:88` builds them from menu identifiers in `config/_default/config.toml:68-89`. All of those are excluded.
- **Consequence:** Low; maintenance only. It also matters for #6, because two of A-100's cited lines sit in dead selectors.
- **Overlap:** A-122 covers two other selectors.

**9. N-005 extension: where the `#D75047` card text comes from**
- **Claim:** The 4.09:1 card text on `data-stories/` comes from a bare-class rule, `_de-custom.scss` `.data-stories { color: $color-data-stories }` (:114-115). It colours all text inside any `.card-content.data-stories` card. `theme.scss`'s `.card-content.data-stories` sets only the border.
- **Evidence:** `data-stories/section.html:17,80,104` render `card-content data-stories`. I computed `#D75047` on white at 4.09, which matches N-005. The home page's `h2.data-stories` is 24px, so it passes at 3:1.
- **Overlap:** extends N-005 with the rule to change.

**10. Group-row colour in SCSS fails contrast but is always overridden**
- **Claim:** `_de-custom.scss` `table .group td { color: #669DB1 }` on `#F0F0F0` (:1-6) computes to 2.6:1. It never shows because both explorers redeclare the same selector inline with `color: green` (`de-tab-content.html:340-342`, `data-explorer-old/single.html:327`), and the inline blocks come later in the cascade.
- **Consequence:** A latent failure. Moving those inline blocks into SCSS, as the CLAUDE.md externalization guidance suggests, would expose 2.6:1 on every explorer table group header.
- **Reproduction:** Needs browser. On `/data-explorer/air-quality/?id=2380#display=summary`, read the computed `color` of `#summary-table tr.group td`. Expected: `rgb(0, 128, 0)`.
- **Overlap:** none.

**11. Five declarations the browser silently drops**
- **Claim:**
  - `theme.scss:444` has `margin-bottom: 1.125  rem` (a space before the unit).
  - `__portal-custom.scss:428` has `margin-top: 25` (no unit), on `.greyblock`, which is used on the housing es/zh pages.
  - `__portal-custom.scss:467` has `filter: blur (5px)`, on a dead selector.
  - `__portal-custom.scss:509,536,557` use `animate:`, which is not a CSS property.
  - `__portal-custom.scss:1195` has `font-style: bold`.
- **Evidence:** `grep -n -E 'font-style:\s*bold|animate:|\b[0-9.]+\s+(px|rem|em)\b'` plus a unitless-length grep.
- **Consequence:** Low; only the `.greyblock` margin has a visible effect. A stylelint pass would catch this class of error, which is an industry-standard aside rather than a defect.

**Could not check:**
- Every runtime claim above (no server; port 8090 is owned by another process).
- Whether the compiled CSS keeps the invalid declarations (needs a build).
- Contrast for text over background images (`.titleheader`, `.related-reading`).
- `_f-layout-elements.scss` and `_e-supplementary-classes.scss`: only swept for dead names and focus rules, not read line by line.
- `_g-dev-tools.scss` was left to A-066.

The sweep script is at C:\Users\Chris\AppData\Local\Temp\claude\c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge\0233f26f-0e1e-4e53-ba56-89abc75dfdf0\scratchpad\deadsel.py, and its raw output is in dead.txt in the same folder. That output is unfiltered and includes the known false positives.

#### Area f: Build, CI, config (production @ b8f4b32fbd)

**Overlap checked:** A-015, A-016, A-019, A-021, A-070, A-077, A-078, A-079, A-081, A-082, A-087; G1-19/20/74/77–87/98; G2-02/41/42/48/49; G3-12/58/59/64/65; G5-25/26/28–34; G7-27; N-021, N-022; C-S4-1, C-T3-1, C-T3-2; Instrument results 3e. I also grepped the audit for force-push, protection, timeout, persist-credentials, codeql, dev-stage and LAST_MSG. None of those terms matched an existing row.

Tree: the audit worktree is at e26a2e2487. `git diff --stat b8f4b32fbd HEAD` shows no changes outside documents/, so every file I read equals P.

---

**1. A commit subject is pasted into the deploy build's shell script. A quote in it breaks the deploy, and `$(...)` in it runs as a command.**
- **Where:** `hugo-build-to-prod-prod.yml`, step "Build site with Hugo" (`export HUGO_GIT_LAST_MSG=${{ steps.last_commit.outputs.last_msg }}`). Also `hugo-build-any-branch.yml`, steps "Hugo Build environment" and "Hugo Build environment + baseURL".
- **Evidence:** step "get last commit" writes `last_msg="<git log -1 %s>"`, and the expression is substituted into the script text before bash runs. I wrote the substituted line to a file and ran it with `bash -e`, which GitHub's docs give as the default shell when `shell` is unspecified (workflow-syntax page):
  - `Revert "Fix 3.5 issue"` exits 1 (`export: '3.5': not a valid identifier`).
  - `Fix "Data Stories" link (#1520)` exits 1.
  - `Say "hi` exits 2 (unterminated quote).
  - ``shorten `last_hash` in workflows`` (a real production subject, 685557d966) exits 0, but the backticked word runs as a command and the value comes out mangled.
  - `x $(echo INJECTED >&2) y` prints INJECTED.
- **How often subjects carry these characters:** 138 of 2210 non-merge subjects since 2025-10-01 contain `"`. The repo allows squash merges (`squash_merge_commit_title: COMMIT_OR_PR_TITLE`) and rebase merges.
- **Today's exposure:** production's tip is usually a "Merge pull request" commit, which is safe unless the branch name has metacharacters (git allows `"` and `$` in ref names). The any-branch workflow builds a branch tip with any subject.
- GitHub's secure-use docs recommend passing untrusted values through an intermediate env var (https://docs.github.com/en/actions/reference/security/secure-use).
- **Consequence:** a deploy build fails, or runs whatever command the subject contains, inside a job holding a `contents: write` token.
- **Reproduction:** `printf 'export HUGO_GIT_LAST_MSG="%s"\n' 'Fix "A B" c' > s.sh; bash -e s.sh; echo $?` → confirmed if it prints 1.
- **Overlap:** none.

**2. Nothing protects production or the deploy source branch.**
- **Where:** repository settings that gate CI and deploys.
- **Evidence:**
  - `gh api repos/nychealth/EH-dataportal/branches/production/protection` returns `allow_force_pushes.enabled: true` and `enforce_admins: false`, with no `required_pull_request_reviews` key.
  - `required_status_checks` has `checks: []` and `enforcement_level: off`.
  - `gh api .../rulesets` returns `[]`.
  - `gh api 'repos/.../branches/builds%2Fprod-prod' --jq .protected` returns `false`.
- **Consequence:** production (the default branch) can be force-pushed. A red smoke or characterization run does not block a merge. builds/prod-prod, which the team deploys to the live servers, can be overwritten by anyone with write access or by any workflow token.
- **Note:** site-characterization.yml's comment records that no checks are required and says not to require it while it has a path filter. So "no required checks" may be deliberate. Is the force-push allowance deliberate too?
- **Reproduction:** the three `gh api` calls above.
- **Overlap:** none.

**3. Workflows get a full read/write token by default, and two jobs leave it on disk while untrusted code runs.**
- **Where:** repo Actions settings; `check-deploy.yml` (job check_deploy); the four build workflows (step "Install dependencies").
- **Evidence:**
  - `gh api repos/.../actions/permissions/workflow` returns `{"default_workflow_permissions":"write","can_approve_pull_request_reviews":true}`. So check-deploy.yml, which has no `permissions:` block (A-078), runs with a read/write token on every scope.
  - The pinned checkout `action.yml` at 3d3c42e5… has `persist-credentials` with `default: true` (read with `gh api repos/actions/checkout/contents/action.yml?ref=<sha>`). In check-deploy that token stays on disk during the third-party `dawidd6/action-send-mail` step, which also receives `MAIL_PASSWORD`.
  - In the build workflows, the persisted `contents: write` token can push to production and to the unprotected builds/prod-prod (#2). `npm install` then runs dependency lifecycle scripts while it is there.
- **Consequence:** a compromised transitive npm package or action can push to the deploy source.
- **Reproduction:** the `gh api` call above → confirmed if it shows `"write"`.
- **Overlap:** extends A-078/G2-02. New: the repo-level default is write, so the missing block means write-all. Also new: the token sits on disk next to third-party code.

**4. The dev-stage build ("307") has not run in at least 13 months, and its output branch does not exist.**
- **Where:** `hugo-build-to-dev-stage.yml` (`on:` has only `pull_request: closed` and `workflow_dispatch`; job `if:` tests `github.event_name == 'push'`). readme-development.md's workflow table says "In use? Yes".
- **Evidence:**
  - `gh api .../actions/workflows/78042797/runs` returns `total_count 0`. For comparison, the prod-prod workflow retains 152 runs back to 2025-08-29.
  - `git ls-remote --heads origin` (63 heads) lists `builds/prod-prod` but no `builds/dev-stage`.
  - The last three updates to `build-to-dev-stage` were direct pushes, not PRs: a022fd5654 (2026-09-04), 0f4f57c91a, d56c38e6d9.
  - The `push:` trigger was deleted in 8d460ac1b4 ("clean up commented code", 2024-08-06). The job's `push` test was left behind and can never be true.
- **Consequence:** the 307 staging site is not refreshed by CI, and the docs say it is. The NR branch's CLAUDE.md also says dev_stage builds to builds/dev-stage in CI. Is 307 still deployed from builds/dev-stage? That is a question for the team.
- **Reproduction:** `gh run list --workflow hugo-build-to-dev-stage.yml` → confirmed if empty. `git ls-remote origin refs/heads/builds/dev-stage` → confirmed if empty.
- **Overlap:** none. G1-84 lists which environments are built but not whether they run.

**5. CodeQL's weekly schedule and manual dispatch never analyse anything.**
- **Where:** `codeql.yml`, job `analyze`, `if: github.event_name == 'push' || github.event.pull_request.merged == true`.
- **Evidence:** `on:` has no `push`, so `schedule` and `workflow_dispatch` both fail the test. Run history (`gh api .../workflows/30980125/runs`): all five schedule runs listed (2026-09-16 through 2026-10-14) are `skipped`. Every merge-triggered run is `success`.
- **Consequence:** code scanning updates only on merges. The cron cannot pick up new CodeQL queries against an unchanged tree, and a manual re-scan is impossible.
- **Reproduction:** the run query above → confirmed if every `schedule` run is `skipped`.
- **Overlap:** none. C-T3-2 and N-022 are about alert content.

**6. The any-branch workflow defaults to the `production` environment, and its publish target is free text.**
- **Where:** `hugo-build-any-branch.yml`, input `environment` (`default: production`) and input `publish-branch`.
- **Evidence:** `head.html:3` and `:45` give the live analytics property and indexable robots only when the environment is `prod_prod`. A default run therefore produces a `noindex, nofollow` build with the dev analytics property. `publish-branch: prod-prod` would publish that build to the deploy source, and nothing stops it.
- **Consequence:** the deploy source can be overwritten with a non-indexable build. This tree's CLAUDE.md:41 says to use `prod_prod`. The NR branch's CLAUDE.md says "no workflow builds with" `production`, which this default contradicts.
- **Reproduction:** `grep -n 'default: production' .github/workflows/hugo-build-any-branch.yml`; `grep -n hugo.Environment themes/dohmh/layouts/partials/head.html`.
- **Overlap:** extends G1-84 (which noted the "any-branch input" but not its default) and G2-48 (bare `hugo`, not the workflow).

**7. check-deploy accepts whatever the live server returns and pastes it into shell commands.**
- **Where:** `check-deploy.yml`, steps "get deployed hash" (`curl … -s -o -`, no `-f`), "echo outputs" and "last commit log".
- **Evidence:** `curl -s https://a816-dohbesp.nyc.gov/indicatorpublic/commit_hash_nosuch.txt | wc -l` returns 880 lines of HTML with status 404. If commit_hash.txt goes missing, `deployed_hash` becomes HTML. It is pasted into `[ … = … ]` and `git rev-list` (`<` acts as a redirect), so the job fails before "send reminder". An empty response would instead send a "0 commits" email.
- **Consequence:** the deploy reminder fails exactly when deployment state is unknown.
- **Reproduction:** read the three steps; the curl above.
- **Overlap:** none.

**8. Seven of the nine workflows have no `timeout-minutes`.**
- **Where:** check-deploy, codeql, all four build workflows, test-print-branch.
- **Evidence:** `grep -c timeout-minutes .github/workflows/*.yml` returns 0 for those seven; only smoke and site-characterization set it.
- **Consequence:** a hung deploy build holds a runner until GitHub's default limit, unless a newer merge cancels it. I believe that limit is 360 minutes but could not confirm the job-level default on the docs page in this pass, so treat it as unverified.
- **Overlap:** none.

**9. CI's lockfile commit-back has changed resolved versions after review.**
- **Where:** the build workflows, step "Commit changes to package.json & package-lock.json".
- **Evidence:** `git log production --grep='Update index & NPM package list' | wc -l` returns 208 commits. `git show 6e1993c395` (2026-08-12) moves the locked `hugo-extended` from 0.146.7 to 0.147.9 and adds `playwright` 1.62.1.
- **Consequence:** the deployed build can use dependency versions that no PR review or smoke run (`npm ci` on the PR's lock) saw.
- **Overlap:** extends G1-80/A-079. New: evidence that it actually changes resolved versions.

**10. Several workflows still reference the deprecated `development` branch, which no longer exists.**
- **Where:**
  - `hugo-build-to-dev-prod.yml` checks out `ref: development`.
  - `smoke.yml`, `site-characterization.yml` and `codeql.yml` trigger on `development`.
- **Evidence:** `git ls-remote --heads origin` has no `development`.
- **Consequence:** a dispatch of dev-prod fails at checkout. The other three triggers can never fire. Low severity; readme marks dev-prod "No".
- **Overlap:** none.

**Checked and dropped:** I suspected the prod-prod `concurrency` group would not serialise across PRs, because `github.ref_name` is per-PR on `pull_request` events. Run history disproves it: runs from different PRs cancelled each other (37141311276 by 37141325056; 32615385770 and 32615419647). So the group is shared. Also clean: the package.json and package-lock.json root are in sync, and `codeql.yml`'s `pull_request_target` checks out only the base.

**Could not check:**
- The job-level timeout default on GitHub's docs page (fetch truncated).
- How the 307 and live servers actually consume the build branches. That is outside the repo.
- Whether the new `timezone:` key in check-deploy's cron is honoured. Scheduled runs land 4–13 hours after the cron time both before and after the key was added, so I can't attribute it.
- Run logs, which I did not read.

#### Area g: Performance (production @ b8f4b32fbd)

**Area g (Performance): report**

Overlap checked against: A-005, A-006, A-007, A-008, A-009, A-010, A-011, A-013, A-014, A-015, A-017, A-020, A-021, A-037, A-038, A-039, A-043, A-046, A-047, A-051, A-053, A-086, A-089, A-090, A-184, A-193, A-198, A-199, A-237, A-306, N-019, C-S3-1, C-T3-1, C-T3-3.

**How I measured.** One Python pass over the built site found 970 HTML files carrying the marker. That is the census's 924 pages plus 46 `data-explorer-old/` pages, which are not in the sitemap. The tree is a `hugo server` render, so every page also carries `livereload.js`; I left it out. Byte sizes come off disk. For a few assets I also sent curl GET/HEAD requests to the live site (2026-10-17). Curl runs no JS, so those requests did not ping GA. Scripts and outputs are in `C:/Users/Chris/AppData/Local/Temp/claude/c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge/0233f26f-0e1e-4e53-ba56-89abc75dfdf0/scratchpad/` (`perf_agg.py`, `perf_an.py`, `perf_img.py`, `perf_an.out`, `perf_img.out`, `live_headers.txt`).

---

**1. Images in story bodies are served at original resolution, and no image on the site is lazy-loaded** (axis: bytes per page)
- **Claim:** Images placed with Hugo's built-in `figure` shortcode or a raw `<img>` in markdown are published as the original file. None of the site's 3,926 `<img>` tags has a `loading` attribute.
- **Where:** `content/data-stories/public-transit-creates-health/index.md` (`{{< figure src="Cycling.jpg" >}}`, `JMZTrain.jpg`) and `content/data-stories/federal-funding/index.md` (raw `<img>`). There is no `themes/dohmh/layouts/_markup/` render hook and no theme `figure.html` shortcode. Page templates do call `.Resize` (e.g. `data-stories/single.html` header at 1200x), but body images bypass it.
- **Evidence:** 40 non-Hugo-processed `<img>` files are over 500 KB, totalling 88.4 MB across 19 pages; 26 of them are over 1 MB. `Cycling.jpg` is 14,543,142 B at 5293×3529 and `JMZTrain.jpg` is 12,125,987 B at 5621×3747, so that one page carries 27.3 MB of `<img>`. Sixteen pages carry more than 2 MB (sanitation 15.2 MB, federal-funding 8.5 MB, zappa 7.0 MB). The live server returned `Content-Length: 14543142` for `Cycling.jpg`. Only 52 of the 3,926 tags have both `width` and `height`.
- **Consequence:** 19 story/about/feature pages for weight. All pages for the missing lazy loading and dimensions (CLS).
- **Reproduction:** `python perf_img.py perf_pages.json`. Then `curl -sI` the live `Cycling.jpg` and expect a ~14.5 MB `Content-Length`.
- **Overlap:** none.

**2. Google Translate's loader is a synchronous, uncacheable third-party script on every page, ahead of the site's own scripts**
- **Claim:** `translate_a/element.js` is a plain `<script>` with no `async` or `defer`. Every script after it waits for it, and Google serves it `no-store`.
- **Where:** `themes/dohmh/layouts/partials/js_bottom.html:39`, included by `baseof.html` before `block "js_bot"`.
- **Evidence:** In built order it precedes `main.js`, `site.js` and every `js_bot` script (e.g. flexdatalist on `neighborhood-reports/`), on 970 of 970 pages. Fetched 2026-10-17: 2,989 B with `Cache-Control: no-cache, no-store, max-age=0`. The loader then calls `_loadJs` (translate.googleapis.com `el_main`) and `_loadCss` (gstatic), and references the `translate-pa.googleapis.com/v1/supportedLanguages` endpoint. All of this happens on every page view, whether or not anyone opens the language menu.
- **Consequence:** All 970 pages. If translate.google.com is slow or blocked, parsing stalls before `main.js`.
- **Reproduction (needs browser):** Use Playwright and route `translate.google.com/**` to a 10 s delay. Compare DOMContentLoaded against the unrouted run, then count requests to `*.googleapis.com` and `gstatic.com` on an untouched page.
- **Overlap:** A-014 covers the missing SRI and A-086 the i18n design. New here: parser-blocking position, `no-store`, and the per-view extra requests.

**3. Pagefind UI (~120 KB) loads synchronously and initializes on every page, although it is used only when the search modal opens**
- **Where:** `themes/dohmh/layouts/partials/search-modal.html:12-13` (in-body `<link>` plus a sync `<script>`) and the `new PagefindUI(...)` call at DOMContentLoaded. The partial is included from `baseof.html` and `_default/list.html`.
- **Evidence:** It is on 970 of 970 pages. The only built copy on disk (this NR worktree's `docs/`) is 119,987 B. The live `pagefind-ui.js` is 30,051 B gzipped. The file sits outside the fingerprint pipeline.
- **Consequence:** All pages: parse/execute plus UI construction on every view.
- **Reproduction (needs browser):** Record a Performance trace of `about/` and read the `pagefind-ui.js` evaluate time and the `PagefindUI` init time. In the network log, check whether `pagefind.js` or `pagefind-entry.json` loads before any search input.
- **Overlap:** none.

**4. Popper is shipped twice on every page**
- **Where:** `js_bottom.html:5-11` loads `popper.js/dist/umd/popper.min.js`, then `:13-19` loads `bootstrap.bundle.min.js`, which embeds Popper.
- **Evidence:** The bundle contains Popper internals: `computeStyle` ×2, `keepTogether` ×2, `gpuAcceleration` ×5. The plain `bootstrap.min.js` has 0 of each, and bundle minus plain is 83,376 − 62,563 = 20,813 B. Standalone popper is 21,233 B on disk and 7,519 B gzipped live. `git grep Popper` finds no site code using `window.Popper`; the hits are vendored copies under `static/data-stories/cold/source/` and `content/data-features/healthy-homes-info/source/`. Since `32c5d50c88` (2024-09-10) the partial has loaded the bundle while keeping the standalone, whose comment ("include popper first") applies to the non-bundle build.
- **Consequence:** 970 pages, sync at the foot.
- **Reproduction:** Remove the popper tag in a scratch build, run smoke, and open a dropdown or tooltip. Expect no change.
- **Overlap:** none.

**5. DOMPurify is render-blocking in `<head>` on all 970 pages, but 85 use it**
- **Where:** `themes/dohmh/layouts/partials/head.html:144-145`.
- **Evidence:** It loads sync in head on 970 pages (29,209 B). The pages whose own scripts or inline JS reference `DOMPurify` are 42 `data-explorer/`, 41 `data-explorer-old/`, `data-features/hvi/` and `data-features/neighborhood-air-quality/`. The other source consumers are the caller-less `nr-*` partials (A-039) and `nyccas_pollutant_trends.html`; `nyccas-report.html` calls the `_new` variant. CLAUDE.md lists DOMPurify as something "every page needs", which this count contradicts. A `lib-dompurify` partial would match the existing `lib-*` model.
- **Consequence:** 885 pages fetch and run a library they never call, before first render.
- **Reproduction:** Re-run the DOMPurify probe in `perf_an`-style form, i.e. grep loaded scripts and inline JS per page, and expect 85.
- **Overlap:** C-T3-1 was the advisory, now disconfirmed. A-005 (FIXED) left this tag in head. New here: the usage count.

**6. Fingerprinted assets get a 1-day `max-age` on the live server**
- **Where:** `static/Web.config:78` has `<clientCache cacheControlMode="UseMaxAge" />` with no `cacheControlMaxAge`.
- **Evidence:** Observed 2026-10-17 on jQuery `.9d6bd9b75ea55acc.js`, the `theme.<sha512>.css`, `pagefind-ui.js` and the HTML: `Cache-Control: max-age=86400,max-age=86400` (doubled) plus `Expires: Wed, 01 Jan 1997`. gzip is on. Content-hashed URLs could carry a long `max-age` with `immutable`; non-fingerprinted Pagefind files and HTML could not.
- **Consequence:** A visitor returning after a day revalidates every asset; a DE topic page loads about 30 scripts.
- **Reproduction:** Run `curl -sI -H 'Accept-Encoding: gzip' <live fingerprinted asset>`. Where the second `max-age` and the 1997 `Expires` come from (server config outside the repo?) is unchecked.
- **Overlap:** none.

**7. DE topic pages put 1.64 MB of synchronous libraries at the top of `<main>`, ahead of all explorer markup**
- **Where:** `themes/dohmh/layouts/data-explorer/single.html:3-8` (`lib-d3`, `lib-datatables`, `lib-arquero`, `lib-topojson`, `lib-vega`, `lib-leaflet`). The explorer's own scripts start at `:78`, after the markup at `:10-70`.
- **Evidence:** The six libraries total 1,636,865 B on disk. Between them and the explorer scripts, only `de-announcement` and `de-tab-content` carry a `<script>`. The latter loads `de-tab-content.js`, which references none of those libraries (grep count 0). So the libraries could likely sit after the markup without changing their order relative to the explorer files.
- **Consequence:** 41 topic pages.
- **Reproduction (needs browser):** Throttled trace of `data-explorer/asthma/`, comparing first paint of the tab skeleton before and after moving lines 3-8 below line 70.
- **Overlap:** A-237 (bundling, declined) and A-005 (head only) are separate. This is placement within the page, not bundling.

**8. Home page images are resized well past their display size, and a library the page never calls loads on it**
- **Where:** `themes/dohmh/layouts/index.html:70` (`Resize "x1600"` used as a CSS background in a `height: 330px` box), `:189/207/226/247` (`Resize "x1200"` for four `col-lg-3` tool cards), `:332` (`accessible-autocomplete.min.js`), `:335-336` (`uhflist.js`).
- **Evidence:**
  - The hero is `CP-report-banner_hu_….jpg` at 2399×1600, 789,319 B, and the live server serves the same bytes.
  - The four tool-card images are 2057×1200 each, 1,390,640 B together.
  - No code in the built `en`, `es` or `zh` home pages calls `accessibleAutocomplete` (34,601 B) or reads the `neighborhoods` global from `uhflist.js` (20,022 B). The only `neighborhoods` hit is JSON-LD prose.
  - On #1491, `uhflist` is already removed with a comment saying so; `accessible-autocomplete` remains on both trees.
- **Consequence:** The 3 home pages, the site's entry point.
- **Reproduction (needs browser):** On `/` at 1280 px, read each card `img`'s `clientWidth×devicePixelRatio` against `naturalWidth`.
- **Overlap:** extends A-037/A-038 (uhflist). New here: `accessible-autocomplete` on both trees, and the image sizing.

**9. DE pages load all of d3 (279,706 B) for six call sites that the Vega bundle on the same page can cover**
- **Where:** `311.js:29` (`d3.csv`), `map.js:206-208` (`scaleSequential` and `interpolateViridis`), `map.js:897` and `print-map.js:635` (`scaleSqrt`), `print-map.js:997` (`interpolateViridis`).
- **Evidence:** Run in Node against the installed Vega 5.33.1 and d3 7.9.0:
  - `vega.scale('sqrt')` gives the same result as d3's `scaleSqrt`.
  - `vega.read(csv, {type: 'csv'})` gives the same result as `d3.csvParse`.
  - `vega.scheme('viridis')` differs by up to 1/255 per channel: at 0.3 it returns `rgb(53,96,141)` against d3's `#355f8d`.

  A swap would therefore shift colours slightly and probably move the characterization baselines.
- **Consequence:** 41 topic pages plus `data-index`.
- **Reproduction:** Run the same Node one-liner.
- **Overlap:** none. On production the NR report pages also load d3 for four `d3.json` calls (`nr-output/single.html:86-167`), but #1491's `nr-report.html` drops d3, so that part resolves on merge.

**10. Retired explorer: Arquero loads twice, and two bundles are byte-identical under different names** (low)
- **Where:** `data-explorer-old/section.html:5` and `indicator-catalog.html:5` each have a raw Arquero tag, plus `lib-arquero` at `:24` and `:26` respectively.
- **Evidence:** 236,290 B is parsed twice on 2 pages. Separately, `js/vegaBundle.js` and `js/lib-vega-bundle.js` share one sha1 (828,076 B), as do `css/dtCSS.css` and `css/lib-datatables.css`, so moving between the old and new explorers downloads both copies.
- **Overlap:** A-053 added `lib-arquero` to these templates without removing the raw tags. A-011 was one name with two contents; this is the reverse, one content under two names.

---

**Not checked:**
- Any load-time number. No browser trace was run: another process owns :8090, and loading the live site in a browser would send GA hits.
- The display size of story images.
- Whether IIS serves `.woff2` with the right type.
- The heat story's 1,124,922 B library concat (`heatstory.html:362`). It is one page, I found no clear duplication inside it, and A-021 covers its dependency chain.
- `theme.css` (282 KB) and Font Awesome CSS, because the team declined minification (A-007).
- Whether the doubled `Cache-Control` value comes from IIS's `cacheControlMaxAge` default. I did not re-read Microsoft's docs.

#### Area h: SEO and analytics (production @ b8f4b32fbd)

Overlap checked: A-033, A-085, A-086, A-090, A-092, A-102, A-104, A-106, A-108, A-109, A-114, A-115, A-118, A-119, A-128, A-129, A-130, A-131, A-227, A-242, A-307, A-310, A-320, A-383; G1-91, G1-93, G1-94, G2-26, G2-36..G2-40, G2-54..56, G4-40..G4-48, G7-09; N-001..N-023; C-S3-1..C-T3-3 and the Disconfirmed section.

Two notes on what I measured. "Real pages" means files under `C:/Users/Chris/AppData/Local/Temp/sc-isolated/prod_prod-docs` that contain `data-pagefind-meta="title:`. There are 970 of them out of 1439 HTML files. That is the census's 924 plus the 44 old-explorer pages and 2 others, because the old explorer is out of the sitemap and so out of the census. This build was served on localhost, so its absolute URLs read `http://localhost:8090/...`. Wherever it matters, I also checked the live site with read-only `curl` against `https://a816-dohbesp.nyc.gov`. My sweep script is `C:\Users\Chris\AppData\Local\Temp\claude\c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge\0233f26f-0e1e-4e53-ba56-89abc75dfdf0\scratchpad\seo_sweep.py`, and its output is in `seo_sweep.out` in the same folder.

**1. Every `<loc>` in the three per-language sitemaps is a bare path, with no scheme or host.**
- **Where:** `themes/dohmh/layouts/_default/sitemap.xml:6` writes `<loc>{{ .RelPermalink }}</loc>`. The `xhtml:link` hrefs at `:13` and `:18` do the same. Only Hugo's built-in sitemap *index* uses absolute URLs.
- **Evidence:** Built site: `grep -c '<url>'` gives 735 (en), 47 (es), 47 (zh). Live, the en sitemap's `<loc>` values are 735 of 735 path-only (`/IndicatorPublic/data-features/rats-in-your-neighborhood/`, …), and so are its 141 of 141 `xhtml:link` hrefs. Google says: "Use fully-qualified, absolute URLs in your sitemaps" (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap, fetched 2026-10-17). What Google actually does with relative entries is not verified.
- **Consequence:** All 829 sitemap URLs.
- **Reproduction:** `curl -s https://a816-dohbesp.nyc.gov/IndicatorPublic/en/sitemap.xml | grep -o '<loc>[^<]*' | grep -vc '<loc>http'`. Confirmed if it prints 735.
- **Overlap:** None. A-119/G2-40 cover the duplicated-looking `xhtml:link` block, not the URL form.

**2. `robots.txt` is published at `/IndicatorPublic/robots.txt`, and the host root answers 404. So crawlers never read it, and A-102's `Sitemap:` line can't be discovered.**
- **Where:** `config/_default/config.toml` sets `baseURL` to `https://a816-dohbesp.nyc.gov/IndicatorPublic/`. `themes/dohmh/layouts/robots.txt:21` emits the `Sitemap:` line.
- **Evidence:** `curl https://a816-dohbesp.nyc.gov/robots.txt` returns 404 (an IIS "File or directory not found" page). `/IndicatorPublic/robots.txt` returns 200 text/plain with the template's body. Google says: "The robots.txt file must be located at the root of the site host… It cannot be placed in a subdirectory" (https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt, fetched 2026-10-17). The same applies to the preview environments' per-path `Disallow` lists, which live under their own subpaths. Their pages still carry meta `noindex, nofollow`, so they are not exposed. I did not check whether the sitemap is registered in Search Console (that is outside the repo).
- **Consequence:** Site-wide. The template comment at `:16-20` says this is "how the sitemap is found", and that is false as deployed.
- **Reproduction:** Run both `curl -o /dev/null -w '%{http_code}'` calls. Confirmed if you get 404 and 200.
- **Overlap:** Extends A-102/G2-15/G2-25, which are marked FIXED. The file is fixed, but no crawler can reach it, and the fix needs a host-root file or a Search Console submission.

**3. The `hreflang` links in the page head are path-only and leave out the page itself, on all 223 pages that have them.**
- **Where:** `themes/dohmh/layouts/partials/head.html:95-99`: `range .Translations` with `href="{{ .RelPermalink }}"`. `.Translations` excludes the current page.
- **Evidence:** The sweep counts `has_hreflang` 223, `hreflang_no_self` 223, `hreflang_relative` 223. Live home page: `<link rel="alternate" hreflang="es" href="/IndicatorPublic/es/">` plus `zh`, and no `en` entry. Google says: "Each language version must list itself as well as all other language versions" and "Alternate URLs must be fully-qualified" (https://developers.google.com/search/docs/specialty/international/localized-versions, fetched 2026-10-17).
- **Consequence:** 223 pages: keywords 79, categories 33, es/zh keywords 33+33, es/zh categories 9+9, data-stories 6×3, the home pages and the 404 pages.
- **Reproduction:** `python seo_sweep.py` and read the hreflang counters.
- **Overlap:** None for the head tags. A-119 is about the sitemap block, which does include the self-reference but is also relative (item 1).

**4. On all 210 NR report pages, `twitter:image` points at a file that does not exist (live 404).**
- **Where:** `seo.html:20` uses `relURL .Params.seo_image`. But `seo_image` is a path into `assets/`: it is read with `resources.Get` for `og:image` at `:13`, and `assets/` files are only published through the resource pipeline. Only `report_bottom_background.jpg` also has a copy in `static/images/`.
- **Evidence:** `git grep -h seo_image b8f4b32fbd -- content` shows 5 topic images × 42 pages. `git ls-tree` finds `assets/images/nyc_health_report_asthma_environment.jpg` and no copy in `static/`. In the sweep, `twitter:image missing` is 5 × 42 = 210 and `og:image missing` is 0. Live: `/IndicatorPublic/images/nyc_health_report_asthma_environment.jpg` returns 404, while that page's `og:image` (`…_hu_65105b88b5b55ef8.jpg`) resolves. #1491 carries the same values via `data/globals/NR_topics.yml` and `_content.gotmpl:72`, so it does not fix this.
- **Consequence:** 210 pages. The same will happen to any future page that sets `seo_image`. The value also carries stray spaces (`" /IndicatorPublic/images/…"`).
- **Reproduction:** Run `curl -o /dev/null -w '%{http_code}'` on the live URL above. Confirmed if it returns 404.
- **Overlap:** Extends A-129/G2-54/G5-05, which say the URL is path-only. The new part is that the path itself is missing.

**5. All 94 paginator pages declare page 1 as their canonical. Their `og:url`, the last BreadcrumbList item and their hreflang targets also point at page 1.**
- **Where:** `seo.html:3` and `:9` use `.Permalink`. `structured-data.html:110-116` uses `.Permalink`. On a pager page that resolves to the section's first page.
- **Evidence:** In the sweep, `paginator` 94, `paginator_canon_elsewhere` 94, `bc_last_ne_self` 94. Example: `/categories/airquality/page/3/` gets canonical `/categories/airquality/`. 158 hreflang pairs are non-reciprocal, almost all of them pager pages pointing at the es/zh page 1, which does not point back. Google says: "Don't use the first page of a paginated sequence as the canonical page" (https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading, fetched 2026-10-17).
- **Consequence:** 94 pages. The items they list are in the sitemap anyway, so items are not hidden from discovery.
- **Reproduction:** `grep -o '<link rel="canonical"[^>]*>' prod_prod-docs/categories/airquality/page/3/index.html`.
- **Overlap:** None.

**6. GA's `search` event fires on every debounced pause while typing and again on every filter toggle, not once per search.**
- **Where:** `themes/dohmh/layouts/partials/search-modal.html:31-36` calls `gtag('event','search',{search_term})` inside Pagefind's `processTerm`.
- **Evidence:** In the bundled Pagefind UI 1.5.2 (`dev_stage-docs/pagefind/pagefind-ui.js`; the `pagefind-entry.json` version is 1.5.2), `processTerm` is called inside the debounced search function (`Vs`). That function is scheduled from `Ss(R,N)`, which a reactive statement reruns whenever the term *or* `selected_filters` changes (`l.$$.dirty[0]&513&&Ss(R,N)`). With `debounceTimeoutMs: 500`, typing "asth…ma" with a pause sends both "asth" and "asthma", and each filter click sends the same term again. This is a static trace; I have not run it. Also, the prod build runs `npx -y pagefind` unpinned, so the version on prod may differ.
- **Consequence:** The site-wide search-term counts are inflated and include partial terms. A-383/G7-09 plan to use exactly this `search_term` data to re-decide NR indexing.
- **Reproduction:** On any page, open the search modal, type `ast`, wait 1 s, type `hma`, wait, then click a filter. Then run `dataLayer.filter(a=>a[0]==='event'&&a[1]==='search').map(a=>a[2].search_term)`. Confirmed if you see 3 or more entries.
- **Overlap:** G1-91 counts `search` as one of three event names but says nothing about how often it fires. Bears on A-383.

**7. 425 of the 876 non-paginator real pages share the site-default meta description, almost all of them taxonomy pages.**
- **Where:** `seo.html:2` falls back to `seo_defaults.seo_description`.
- **Evidence:** One Python pass found the description "Explore data on how environments shape health in New York City's neighborhoods." on: keywords 317, es/zh keywords 30+30, categories 18, es/zh categories 9+9, resources 3, and others. 432 pages share it as `og:description`. In addition, 10 category/keyword pairs share an identical `<title>` (for example `Airquality – …` on both `categories/airquality/` and `keywords/airquality/`), and those titles come from slugs ("Airquality", "Climatehealth"). Google says: "Identical or similar descriptions on every page of a site aren't helpful" (https://developers.google.com/search/docs/appearance/snippet, fetched 2026-10-17).
- **Consequence:** 425 pages, all of them `robots: all` and in the sitemap.
- **Overlap:** Extends A-118/G2-39. That row counts `.md` files without `seo_description`, but taxonomy pages have no `.md` file, so its count cannot see them. This also answers its open question about whether indexable pages are affected.

**8. 43 of the 50 real es pages and 43 of the 50 real zh pages are taxonomy pages with English template text, marked as Spanish or Chinese.**
- **Evidence:** They carry `<html lang="es">` or `lang="zh"`, English titles ("Housing – …"), and the English heading "More content about …". They appear in the es/zh sitemaps (47 URLs each) and are advertised as es/zh alternates by the hreflang tags of their en counterparts (item 3).
- **Consequence:** 86 pages.
- **Overlap:** Specific instance of A-086 (mixed i18n). That row does not name taxonomy output.

**9. No page has a `twitter:card` tag.**
- **Evidence:** 0 of the 970 real pages have it. As a control, `twitter:site` appears on 970 of 970, read with the same parser. I did not verify X's behaviour when the tag is missing; the developer.x.com page returned HTTP 402.
- **Where:** `seo.html:17-22`.
- **Overlap:** None.

**10. The 44 retired-explorer pages are indexable, declare themselves canonical, and copy their new counterparts' titles and descriptions.**
- **Where:** The `robots` value computed at `head.html:44-49` has no exception for `data-explorer-old`.
- **Evidence:** In the sweep, all 44 are `robots: all` and none is in the sitemap. `data-explorer/accessibility/` and `data-explorer-old/accessibility/` have identical `<title>`s and each declares itself canonical. Live `/IndicatorPublic/data-explorer-old/accessibility/` returns 200. Decisions D6 and D12 in `de-production-deploy-plan-2026-10-01.md` took these pages out of listings, the sitemap and search, but they do not address crawlers. No census page links to `/data-explorer-old`, so discovery is unlikely. Google prefers `rel=canonical` over `noindex` for choosing between duplicates (https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- **Overlap:** None.

**11. The three home pages' `og:title` and `twitter:title` repeat the brand.**
- **Evidence:** They read `NYC Environment and Health Data Portal – Environment & Health Data Portal`. The comment at `head.html:72-75` leaves the `<title>` suffix off the home page for exactly this reason, but `seo.html:10` and `:18` add it unconditionally.
- **Overlap:** Next to G2-37.

**Couldn't check, or out of scope:**
- I could not observe GA events at runtime, because I was told not to start a server. Items 6 and G4-46..48 remain static traces.
- I could not see Search Console sitemap registration or X card behaviour.
- The data explorer's `?id=` indicator URLs declare the topic page as canonical. Given A-104 this looks like a design choice, so I did not report it.
- Out of area h, possibly not recorded (I grepped the audit for `last_msg` and `injection` and found nothing): `.github/workflows/hugo-build-to-prod-prod.yml:66` writes the commit subject into a step output wrapped in double quotes, and `:114` interpolates it with `${{ }}` straight into a `run:` script. `hugo-build-any-branch.yml:132` and `:141` do the same. A merge commit's subject includes the fork branch name (`from owner:branch`), so this looks like a GitHub Actions script-injection path. Someone should check it under the hardening-github-actions area. Live, the home page publishes that subject in `<meta name="git_last_msg">`.

## New findings

N-001..N-018 come from Task 3's instruments and are confirmed at runtime by them; Task 5 adds the candidates it verifies after them.

| ID | Source | Claim | Status | Evidence | Tree |
|---|---|---|---|---|---|
| N-001 | new: Task 3b (site-a11y-audit's rendered-content control) | Smoke's curated `PAGES` lists `data-features/asthma-syndrome/` as the "asthma-syndrome layout", but `content/data-features/asthma-syndrome/index.md` is `draft: true` and no environment builds drafts, so the page is a 404 everywhere; `smoke-pages.mjs:334` discards the `page.goto` response, so the entry checks the 404 page and passes. | OPEN | CONFIRMED (runtime) for the 404: status 404 under `site-a11y-audit.mjs`, and the page is absent from the isolated `prod_prod` build, the only one of the 44 curated pages absent. TRACE for smoke's pass: `buildDrafts` occurs nowhere in `config/`, `scripts/`, `.github/` or `package.json` | production @ b8f4b32fbd |
| N-002 | new: Task 3b (axe `button-name`), 3a (census) | The explorer's Measure, Boundary and Time dropdown buttons (`#measureOptionsDropdownButton`, `#geoOptionsDropdownButton`, `#timeOptionsDropdownButton`) have no accessible name on every topic page opened without `?id=` (42 pages) and in the unmapped empty state (`waterways/?id=2427`, Boundary and Time). | OPEN | CONFIRMED (runtime): axe 44 pages / 130 nodes; census `controls.noAccessibleName` 6 on 42 of 43 explorer topic pages | production @ b8f4b32fbd |
| N-003 | new: Task 3b (axe `link-name`), 3a (census) | Links with no accessible text: the image-card links on `data-features/` (21 on that page), `data-stories/` and every key-topic page (census: all 11), the share-by-email link on story pages (`cold`, `block-by-block`), the old explorer's data-sources icon link, and the home page's first featured-story anchor (A-125's misnesting leaves it empty). | OPEN | CONFIRMED (runtime): axe 10 pages / 81 nodes on the 126 audited; census `links.noAccessibleText` on 20 of 924 pages | production @ b8f4b32fbd |
| N-004 | new: Task 3b (axe `link-in-text-block`) | Links inside body text are distinguished from the text by colour alone on 17 of 126 pages (e.g. the data-index lists, the housing story's asides). | OPEN | CONFIRMED (runtime): axe 17 pages / 60 nodes; incomplete on 89 more pages, so a floor | production @ b8f4b32fbd |
| N-005 | new: Task 3b (axe `color-contrast`) | Text below 4.5:1: `#808080` on white (3.94:1), used for `.keywords` labels ("Keywords:", "Published on:") on story, feature, publication and old-explorer pages; story-card text `#d75047` (4.09:1) on `data-stories/`; and legend colours on rat-mitigation-zones, congestion-pricing, realtime-air-quality, aqe and hvi. | OPEN | CONFIRMED (runtime): axe 12 pages / 69 nodes; incomplete on all 126, so a floor | production @ b8f4b32fbd |
| N-006 | new: Task 3b (axe `aria-required-children`, `aria-required-parent`, `listitem`) | Bootstrap tab markup puts `role="tablist"` on a `<ul>` whose `<li>` children carry no role, so the `role="tab"` links have no tablist parent and the list items no list (`data-stories/` `#pills-tab`, housing `#myTab`); also `role="list"` on a `.list-group` of non-items (air-quality-snapshots) and `role="tablist"` on the old explorer section's accordion. | OPEN | CONFIRMED (runtime): axe 4, 2 and 2 pages | production @ b8f4b32fbd |
| N-007 | new: Task 3b (axe `label`) | Unlabelled inputs beyond the flexdatalist ones (A-133): the old explorer's `#citeText`, the urban-heat-island story's `#slider`, and the rats-in-your-neighborhood `.dia > input`. | OPEN | CONFIRMED (runtime): axe, one node each | production @ b8f4b32fbd |
| N-008 | new: Task 3b (axe `aria-allowed-attr`) | `aria-selected` is set on `<button>`s, where it is not allowed: the explorer's trend-mode pills (`.trendmode-button`, e.g. `drinking-water-quality/?id=2207`) and the old explorer's indicator dropdown items. | OPEN | CONFIRMED (runtime): axe 3 pages / 21 nodes (2 / 20 in a repeat run) | production @ b8f4b32fbd |
| N-009 | new: Task 3b (axe `scrollable-region-focusable`) | Scrollable regions that a keyboard cannot reach: the `csvtable` shortcode's `#csv-table-container-N` (`role="region"`, `overflow-y: scroll`) on leading-causes and minimum-wage, and the old explorer's DataTables scroll body. | OPEN | CONFIRMED (runtime): axe 3 pages / 4 nodes | production @ b8f4b32fbd |
| N-010 | new: Task 3b (axe `aria-hidden-focus`) | The housing story wraps focusable content in `aria-hidden="true"` (a `.btn-group` with a nested dropdown, and `.wide` chart blocks). | OPEN | CONFIRMED (runtime): axe, 2 nodes on `data-stories/housing/` | production @ b8f4b32fbd |
| N-011 | new: Task 3b (axe `summary-name`, `svg-img-alt`) | Vega embeds outside the NR report have an unnamed action-menu `<summary>` (housing, realtime-air-quality, leading-causes) and unnamed `role="graphics-symbol"` mark groups (realtime-air-quality, aqe, hvi). #1491 fixed the same two on the NR report (A-343, A-346). | OPEN | CONFIRMED (runtime): axe 3 and 3 pages | production @ b8f4b32fbd |
| N-012 | new: Task 3b (axe `list`) | Lists with non-`<li>` children: housing's `ul.navbar-nav` and rat-report's `ol type="I"`. | OPEN | CONFIRMED (runtime): axe 2 pages | production @ b8f4b32fbd |
| N-013 | new: Task 3b (axe `frame-title`) | Untitled iframes: `data-stories/cold/` (`source/index.html`) and `data-stories/urban-heat-island/` (`#mapframe`). | OPEN | CONFIRMED (runtime): axe 2 pages | production @ b8f4b32fbd |
| N-014 | new: Task 3b (axe `image-alt`, `aria-command-name`) | realtime-air-quality's Leaflet markers are `role="button"` divs with no name around `<img>`s with no `alt` (16 markers); heat-report-archive/2021's figures `2021-fig-3.jpg` and `2021-fig-4.jpg` have no `alt`. | OPEN | CONFIRMED (runtime): axe 2 and 1 pages | production @ b8f4b32fbd |
| N-015 | new: Task 3b (axe `role-img-alt`) | Font Awesome icons given `role="img"` with no name (`.fa-plus`, `.fa-minus`) on rats-in-your-neighborhood and email-electeds. | OPEN | CONFIRMED (runtime): axe 2 pages / 6 nodes | production @ b8f4b32fbd |
| N-016 | new: Task 3a (census) | The three home pages (`en`, `es`, `zh`) have no `<h1>`. | OPEN | CONFIRMED (runtime): census `landmarks.h1 = 0` on exactly those 3 of 924 pages, also in the committed baseline | production @ b8f4b32fbd |
| N-017 | new: Task 3a (census) | 558 pages overflow horizontally at 1280×900: all 316 keyword pages and their 58 paginators, the `es`/`zh` keyword pages, the categories paginators, and 41 of 43 explorer topic pages. | OPEN | CONFIRMED (runtime): census `overflowX`; the element that overflows was not identified | production @ b8f4b32fbd |
| N-018 | new: Task 3a (census) | `data-stories/geographies/` has two tables (of four) with no `<th>`. | OPEN | CONFIRMED (runtime): census `tables` total 4, withTh 2 | production @ b8f4b32fbd |
| N-019 | new: C-S3-1, verified at Task 5 | Every `mapLib` page loads two nyc-lib stylesheets of different versions: the remote `maps.nyc.gov/nyc-lib/v1.4.78/css/nyc-basic-lib.css` and the local `css/nyc-basic-lib-v1.2.79.css`, both inside `head.html`'s `{{- if .Params.mapLib }}` block. Whether the second is a deliberate override is a question for its author. | OPEN | CONFIRMED (build output): both `<link>`s in the built `data-features/congestion-pricing-report/` (`mapLib: true`); a non-`mapLib` page (`about/`) has neither. `head.html` is identical on P and N | production @ b8f4b32fbd |
| N-020 | new: C-S3-2, verified at Task 5 | `.claude/commands/js-development.md:19-22` says `debugLog` is "Pending: it arrives with `feature-new-data-explorer`", which has been stale since #1462 put `debugLog` in production's `head.html`. Docs only. | OPEN | CONFIRMED (trace): `git show P:` of both files | production @ b8f4b32fbd |
| N-021 | new: C-S4-1, verified at Task 3 | `npm run docs-check` exits 1 in any worktree where no Hugo build has run, because `CLAUDE.md` cites `docs/` and `resources/_gen/` and `scripts/docs-check.mjs` tests cited paths with `existsSync`. No workflow runs it, so this affects local runs only. | OPEN | CONFIRMED (runtime): on one tree (N), exit 1 without the two directories and exit 0 with them present and empty; exit 1 at P too | production @ b8f4b32fbd; #1491 @ d1c7402735 |
| N-022 | new: C-T3-2 (CodeQL `js/incomplete-sanitization`, high), verified at Task 5 | `scripts/site-characterization-summary.mjs:272` escapes `\|` but not backslashes when writing page text into a markdown table, so a backslash in a page's text can break the escape. Dev and CI tooling only; nothing ships. | OPEN | CONFIRMED (trace): the line at P | production @ b8f4b32fbd |
| N-023 | new: C-T3-2 (CodeQL `js/unsafe-html-expansion`, five alerts), verified at Task 5 | The five 2021 raster pages under `static/nyccas/raster/old rasters/` are published verbatim from `static/` but referenced by no template or content file. | OPEN | CONFIRMED (trace): `git grep -i 'old rasters\|old%20rasters'` outside that directory finds nothing; control: `nyccas/raster` is referenced from `nyccas_pollutant_maps.html` | production @ b8f4b32fbd |

## Disconfirmed

- **C-S3-3 (seedless `reduce` in `data.js`).** Neither site can reduce an empty array. At `:470`,
  `perGeotypeTables` is `visGeotypes.map(geo => <Arquero table>)`, and `flatMap(d => d)` leaves
  non-array elements as they are, so a non-empty array holds only tables. At `:482`, the per-view
  accumulators are filled with `if (x) push(x)`, so `expandMeasureTimesGeos`'s `null` never
  enters them `[verified 2026-10-17: git show P:assets/js/data-explorer/data.js, lines 425-566]`.
- **C-T3-1 (`dompurify` advisory) as an XSS path.** Both advisories (GHSA-55q2-fjhq-7xh7 moderate,
  GHSA-6688-9rhm-gjv2 low) concern DOMPurify's `IN_PLACE` option, and no site code uses it:
  `git grep -i IN_PLACE` over `assets`, `themes`, `content` and `static` finds nothing, where the
  same tree holds 16 `DOMPurify.sanitize` calls. The lockfile does pin `3.4.12`, inside both
  ranges, so the Dependabot alert stays open until the dependency is bumped.
- **C-T3-3 (`img.zeroSize` on explorer topic and key-topic pages) as broken images.** Every
  zero-size image the census counts sits inside a collapsed container and has loaded. On the
  explorer pages the two are the NYC logo and the site icon inside `header#global-header.collapse`;
  on key-topic pages they are data-story card thumbnails inside `div#collapseStories.collapse`.
  All report `complete` and a non-zero `naturalWidth` `[verified 2026-10-17: Playwright at
  1280x900 on an isolated prod_prod build of P, 2s settle, five pages (`about/`, two explorer
  topics, two key topics); control: with the two Google Translate images set aside (third-party,
  injected at runtime, and absent from the census's `img.total`), the probe reproduces the census
  P record's `zeroSize` on all five pages, 0/2/2/8/1, including the unflagged `about/`]`.
