# Merging `production` into `feature-MOD-Lab-NR-recode-refactor-merge` (third time — the new data explorer)

**Closed 2026-10-16.** Merge landed at `5cca304284`; both site-characterization baselines re-captured in `f8ede8382e`. Range `aff2a412d7..f8ede8382e`. Follow-ups F1–F3 remain open below.

Same job as `documents/nr-merge-production-2026-09-26.md`, whose shape and decisions are the
exemplar. What differs: this merge brings in #1462 (`feature-new-data-explorer`), so production
now has the new explorer at `assets/js/data-explorer/` and the old one at
`assets/js/data-explorer-old/`, and several conflicts are real code rather than retired templates.

## Identity

| | |
|---|---|
| Branch (ours) | `feature-MOD-Lab-NR-recode-refactor-merge` at `aff2a412d7` |
| Worktree | `EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor-merge` |
| Merging in | `production` at `b8f4b32fbd` (Merge PR #1462) |
| Merge base | `c33fe499ef` (the tip the previous merge brought in) |
| Divergence | 199 commits ours, 630 theirs |
| Abort path | `git merge --abort` returns the tree to `aff2a412d7`. `feature-MOD-Lab-NR-recode-refactor-backup` is at `fb5b89df64`, older — not a backup of this tip |

441 unmerged paths `[verified 2026-10-16: git diff --name-only --diff-filter=U]`:

- 422 site-characterization records under `scripts/site-characterization-baseline/` (210 NR page records + `_meta.json`, per key, `prod_prod` and `staging`)
- 6 delete/modify (DU): retired NR templates ours deleted and production touched
- 1 modify/delete (UD): `assets/scss/_custom.scss`, which production renamed to `_de-custom.scss`
- 3 both-added (AA): `documents/data-explorer-architecture.md`, `documents/data-explorer-fresh-audit-2026-07-13.md`, `scripts/de-characterization.mjs`
- 9 content: `CLAUDE.md`, `assets/js/data-explorer/global.js`, `assets/scss/theme.scss`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `themes/dohmh/layouts/partials/head.html`, `themes/dohmh/layouts/partials/overlap-tool.html`, `themes/dohmh/layouts/neighborhood-reports/section.html` (the last replayed by `rerere`)

## Environment state

- No `hugo.exe` running; nothing listening on 8080, 8081, 1313 or 8090 `[verified 2026-10-16:
  Win32_Process, Get-NetTCPConnection]`. Harnesses that spawn will spawn `dev_stage` — staging data.
- `rerere.enabled=true`. It replayed `section.html` only.
- This ledger landed inside the merge commit `5cca304284`; the hash column was filled by a later commit.

## Decisions

| # | Decision | Rejected | Why | Status |
|---|---|---|---|---|
| — | `_custom.scss` → `git rm`; ours' +124/−16 applied to `_de-custom.scss` | Keeping `_custom.scss` and importing both | `04eb4e09d9` is a rename: all 284 non-blank lines of the base `_custom.scss` are in `_de-custom.scss` `[verified 2026-10-16: trimmed-line membership]`. Git missed it because production also grew the file 344 → 1142 lines. Two files would duplicate every base rule | Taken |
| — | `assets/js/data-explorer/global.js` → theirs | Ours | Ours' side is the old explorer's whole declaration block; theirs is the new explorer's namespace. Ours' only intent there (`81db17d33c`, declaring `indicators`/`selectedDisparity` for lint) has no meaning in the new file | Taken |
| — | Ours' old-explorer lint fixes are **not** ported to `data-explorer-old/`; the 2 lines that auto-merged into `data-explorer-old/links.js` are reverted to theirs | Porting all three | Production's `eslint.config.mjs` header: `data-explorer-old/` is "deliberately NOT linted — it's retired (\"do not modify\")" | Taken |
| — | Retired NR templates (6 DU) → `git rm` | Restoring them | Production's substantive edits to them are `7a995427a1`'s `section-icon` partial in the `<h1>`s (see D1) plus `var`→`let` and line reflow in code ours replaced `[verified 2026-10-16: git diff -w base..production]` | Taken |
| — | Baselines → ours as placeholder, both keys re-captured in a separate commit (Stage C) | Picking a side as final | Exemplar's decision, same reasons | Taken |
| D1 | Port `7a995427a1`'s section icon to ours' 4 NR `<h1>`s (`nr-topic-index.html`, `nr-neighborhood-index.html`, both in `nr-report.html`) | Leaving NR without icons | Production applied it to the retired templates these replace; without the port NR is the one section without the icon. `report.js` rewrites only the neighborhood `<span>`s' `textContent`, so the icon would survive an in-place switch (source-read, unverified) | **Taken 2026-10-16** (Chris) |
| D2 | DE harness npm script named `characterize` (production) | `characterize:de` (ours) | ~30 references on production (docs, the script's own usage comment) against ~6 on ours, mostly in a dated plan that already notes the merged name is `characterize` | **Taken 2026-10-16** (Chris) |
| D3 | `CLAUDE.md`: resolve the 5 hunks, and in the merge commit replace the sections the merge makes false (Architecture → Data explorer; the "Data explorer harness" bullet calling it non-functional; `_custom.scss` paths). A wider reconciliation is a follow-up | Hunks only; or a full reconciliation inside the merge | Hunks only leaves a file that describes an explorer that is no longer here; a full pass would bury the merge diff | **Taken 2026-10-16** (Chris) |

## Tasks

### Stage R — conflict resolutions

| # | File | Resolution | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| R1 | 6 retired NR templates | `git rm` | `5cca304284` | **DONE 2026-10-16** | Staged as deletions; the only consumers of the old `js/uhflist.js`/`js/uhflist.json` resources were among them |
| R2 | `assets/scss/_custom.scss` / `_de-custom.scss` | `git rm` the first; 3-way merge (base `_custom.scss`, ours `_custom.scss`) into `_de-custom.scss`; its one conflict keeps production's `.btn-light-green-bg-outline` and ours' `.nr-selector-map`, dropping `.nr-flexdatalist` (ours' removal; 0 consumers in the tree) | `5cca304284` | **DONE 2026-10-16** | `git merge-file` gave 1 conflict; resolved by script (bytes in/out). Result vs production's `_de-custom.scss`: +124/−16, the same counts as ours' base→ours diff of `_custom.scss`; `.nr-flexdatalist` absent; 0 CR bytes |
| R3 | `assets/scss/theme.scss` | 1 comment hunk: ours' text, path → `_de-custom.scss` | `5cca304284` | **DONE 2026-10-16** | Per-hunk script, 1 hunk, then the path edited |
| R4 | `assets/js/data-explorer/global.js` | Theirs | `5cca304284` | **DONE 2026-10-16** | `git diff --cached --quiet MERGE_HEAD` → 0 |
| R5 | `assets/js/data-explorer-old/links.js` (auto-merged, not flagged) | Theirs | `5cca304284` | **DONE 2026-10-16** | `git diff --cached --quiet MERGE_HEAD` → 0 |
| R6 | `eslint.config.mjs` | Ours' two-block structure; DE externals list from theirs (drops `renderIndicatorDropdown`/`renderIndicatorButtons`/`createCitation`, adds `debugLog`); header notes `data-explorer-old/` is unlinted | `5cca304284` | **DONE 2026-10-16** | Hand-written; `git diff HEAD` shows only the header note, the comment line naming `bar.js`, and the externals list; 0 CR bytes |
| R7 | `package.json` | Ours' script set, with the D2 name; `ci` stays removed (production's `4260823794`) | `5cca304284` | **DONE 2026-10-16** | Per-hunk script then `characterize:de` → `characterize`; vs production only ours' `lint` scope and `characterize:nr`/`:pagefind`/`a11y:nr` differ; `ci` absent from both files |
| R8 | `package-lock.json` | Ours (eslint 10.8.0, globals 17.8.0), then `npm install` to reconcile | `5cca304284` | **DONE 2026-10-16** | Per-hunk script, 2 hunks; `npm install` is V2 |
| R9 | `themes/dohmh/layouts/partials/head.html` | Theirs, 2 hunks (`localStorage` throw guard) | `5cca304284` | **DONE 2026-10-16** | Per-hunk script; result equals production's file. Ours' base→ours change (the `debugLog` block) is present in it at `const debugLog` |
| R10 | `themes/dohmh/layouts/partials/overlap-tool.html` | Theirs' one-line form, ours' id `tab-btn-02-a` (`726a6eba4a`, NR a11y A3) | `5cca304284` | **DONE 2026-10-16** | Per-hunk script then the button id edited; the panel's `aria-labelledby="tab-btn-02-a"` had already auto-merged |
| R11 | `themes/dohmh/layouts/neighborhood-reports/section.html` | `rerere`'s replay: production's `section-header` partial over ours' body. Reviewed, correct; stage it | `5cca304284` | **DONE 2026-10-16** | Diff vs ours is exactly `7a995427a1`'s breadcrumb/title block → `section-header` partial |
| R12 | 3 AA files | Theirs; `de-characterization.mjs` usage comment per D2 | `5cca304284` | **DONE 2026-10-16** | `git diff --cached --quiet MERGE_HEAD` → 0 for all 3. The usage comment already says `characterize` (D2's recommendation) |
| R13 | `CLAUDE.md` | Per D3 | `5cca304284` | **DONE 2026-10-16** | 0 markers. Hunk 1 → "Eleven" (8 shared + 2 ours + 1 theirs, counted per side); hunks 2, 4, 5 → ours; hunk 3 → ours' Environment bullets. Production's DE text replaced the Architecture → Data explorer body (with the `isDataTable`, `#searchModal` and `head.html` gotchas corrected to this tree); the DE harness bullet rewritten; production's layout-fix root-cause bullet and its "merge does not change the live site" sentences ported; SCSS section corrected to the vendored Bootstrap (`_b-bootstrap-imports.scss` imports `../bootstrap/scss/`); lint bullet no longer cites `single.html` inline scripts. The `docs-check verified` stamp was **not** bumped: no full re-read |
| R14 | 422 baseline records | Ours, placeholder | `5cca304284` | **DONE 2026-10-16** | 422 paths; `git diff --cached --quiet HEAD` per path, 0 differ |

### Stage G — gaps the merge does not flag

| # | Gap | Commit | Status | Proof that ran |
|---|---|---|---|---|
| G1 | Section icon on ours' NR `<h1>`s (D1) | `5cca304284` | **DONE 2026-10-16** (code) | Template edit only here; browser proof is V9 |
| G2 | `_custom.scss` path references: `themes/dohmh/layouts/neighborhood-reports/nr-report.html` (header comment), `documents/nr-architecture.md` (3, opted into docs-check), `CLAUDE.md` (2) | `5cca304284` | **DONE 2026-10-16** | `grep -c 'assets/scss/_custom\.scss'` → 0 in all three files afterwards; `nr-architecture.md`'s stamp not bumped |

Sweeps checked and found to need nothing: `23a89dd34f` (duplicate `skip-header-target`: no NR
template carries the id), `47ffb33fde` (library gating: ours' NR templates include `lib-*`
partials; every `lib-*` partial equals theirs except `lib-uhflist.html`, which is ours'
generator), `77863da154` (`onclick` → listeners: DE-scoped, and no CSP in the tree). Old
`js/uhflist.js`/`js/uhflist.json` resources are referenced only by templates R1 deletes.

### Stage V — verification

| # | Check | Status | Proof that ran |
|---|---|---|---|
| V1 | 0 unmerged, 0 conflict markers | **DONE 2026-10-16** | 0 unmerged; `git grep --cached -E '^(<<<<<<< |>>>>>>> )'` 0 lines, pattern shown to match a marker line |
| V2 | `npm install`; lockfile drops `ci` | **DONE 2026-10-16** | exit 0; `package.json` and `package-lock.json` unchanged by it; no `node_modules/ci` in the lock; eslint v10.8.0 |
| V3 | `npm run lint`, with a negative control | **DONE 2026-10-16** | exit 0 over both directories. Negative controls: an undefined call appended to `data-explorer/bar.js` and to `nr-report/app.js` each gave exit 1 naming it; both restored, matching the index |
| V4 | `npm run docs-check` | **DONE 2026-10-16** | **exit 1 on first run, then fixed**: one claim was mine (`_default/list.html`, made repo-root-relative). The other two, `docs/` and `resources/_gen/`, are claims `HEAD`'s copy already makes about build output this unbuilt worktree lacks. Control: with both created empty, exit 0, "3 doc(s) checked"; directories removed afterwards |
| V5 | `npm run smoke:prod_prod` (full sweep, isolated) | **DONE 2026-10-16** | exit 0, **1187 of 1187 pages clean** = 924 site pages (829 sitemap + 94 paginator + 1) + 263 explorer indicators, `Pagefind index: served`, server on :8090 stopped. Report `scripts/smoke-reports/smoke-2026-10-16T20-40-08-380Z.json`. The sitemap count is one below the 830 of `921b165625`: production deleted `content/search-results/index.md` (`7e5d0d12b1`), and the merge's non-modify `content/` changes equal production's own since the base (`git diff --name-status` both ways). The 74 `data-explorer-old/` content files (`git ls-files … | grep -c .md$`) add none, because `content/data-explorer-old/_index.md` keeps them out of every page collection — so this sweep does not visit them |
| V6 | `node scripts/nr-characterization.mjs --check` | **DONE 2026-10-16** | exit 0, 3 of 3 targets match the `staging` baseline, against a spawned `dev_stage` server |
| V7 | `node scripts/pagefind-characterization.mjs --check` | **DONE 2026-10-16**, re-baselined | First run **exit 1, controls passing**: 202 → 203 indexed pages and per-page changes. Predicted before `--baseline`: only `data-explorer/` pages and pages production edited would move, and no NR record. `--baseline` (controls passed) then a per-record diff of the JSON against `HEAD`: **49 records changed, 0 of them NR** — 43 `data-explorer/` pages (anchors, words, content), `/data-explorer/` newly indexed (the new explorer's landing), and 6 others, each traced to production commits with none from ours since the base: `/data-features/`, `/data-features/nyccas/`, `/es/data-stories/`, `/zh/data-stories/` (`7a995427a1`), `/data-features/proximity/` (`105857624f`, `dddd0e5bf6`), `/data-stories/air-quality-and-covid-part-2/` anchors (`49a923c7b3`, `0ddbafaa5a`). 5 of 9 queries changed totals or order ("neighborhood reports" 108 → 117); each query's top-result URL set is unchanged. Since `contentHash` is `sha(f.content)` over the full indexed text, a query can only find something new among the 49 changed records. JSON +303/−1932, mostly the explorer pages' anchor lists; 0 CR bytes |
| V8 | `node scripts/de-characterization.mjs --check` — first run on this branch where it can pass | **DONE 2026-10-16**: **fails, and production fails identically** — not re-baselined | exit 1, 16 changed lines: indicator 2023 time 2024 → 2025 with its legend range, `markCount` 222 → 235, `totalRowCount` 2004 → 2145; indicator 2380 correlate `markCount` 43 → 17. **Control arm**: production's tree (`b8f4b32fbd`) in a detached worktree, served by an isolated `hugo server --environment dev_stage` on :8091 (`HUGO_RESOURCEDIR` and `-d` in `C:/temp`), harness run with `DE_BASE_URL` — which `scripts/dev-server.mjs` honours before any reuse or spawn path: exit 1 with the **identical 16 lines**. So EHDP-data staging moved after production's own re-capture (`19c3e93153`, 2026-10-01), and the merge contributes nothing. The baseline is production's file, so it is left for production to re-capture (F3). Control server stopped by PID after its command line was checked; worktree and temp dirs removed |
| V9 | G1 in the browser: icon present after an in-place neighborhood switch | **DONE 2026-10-16** | Scratch Playwright script (not kept) against a spawned `dev_stage` server, counting `<h1>`s that contain `.nr-accent i.fa-map-marked-alt[aria-hidden]`: topic index 1 of 21 (the other 20 are the hidden indicator-name headings); neighborhood index 1 of 1; report page 2 of 2; **after Enter on a map polygon switched the report in place to High Bridge - Morrisania, still 2 of 2**. Control: `/about/` 0 of 1, so the probe can read zero. No `hugo.exe` left afterwards |

### Stage C — characterization baselines (separate commit)

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| C1 | `npm run characterize:site:prod_prod` and `:dev_stage` against `5cca304284` | *no commit* — a check | **DONE 2026-10-16** | **First pair: no verdict.** Both stopped at 923 of 924 pages: `data-features/displacement-risk/` never fired `load` within 30s in either environment. That page embeds `https://equitableexplorer.planning.nyc.gov/map/drm/nta`; loaded directly in headless Chromium (scratch script, not kept) it sat 30s with 16 of its own `_next/static` scripts pending, then on a second fresh-browser try reached `load` in 205 ms — an intermittent external host. The page's only change since the base is production's `7a995427a1`; none from ours. **Second pair: both keys exit 1 with 924 of 924 captured and the same 211 pages differing, all under `neighborhood-reports/`, 0 elsewhere** — Chris's prediction (only NR changes, since production re-baselined on the DE branch before the merge). Two causes, both read off `content.headingText` beside `structure.headingLevels`: **(a)** 210 report pages, last two headings `(2 Page Footer, 5 Search)` → `(5 Search, 2 Page Footer)`. Ours' `footer.html` held `#searchModal` (1 match at `aff2a412d7`); production includes `search-modal.html` from `baseof.html` (line 33) ahead of the footer (line 36). These records were ours' placeholders (R14), so only they still carried the old order. **(b)** NR landing `headingJumps` 2 → 1 with an identical heading sequence on both sides (`1,2,2,5,5,2`, one jump): the committed record was not a conflict but a line-merged hybrid — production's `headingLevels` with ours' `headingJumps` — matching no real render. The 09-26 ledger named this risk for line-merged records |
| C2 | `node scripts/site-characterization-rebaseline.mjs --expect "neighborhood-reports/**" --expect "neighborhood-reports/"` | `f8ede8382e` | **DONE 2026-10-16** | exit 0, both keys re-captured at `5cca304284`, both sweeps agreeing on every page (no arbitration); report "211 of 924 pages changed … 211 covered by --expect, 0 not. Nothing unexplained" for each key. `git status`: 424 modified, 0 untracked, 0 deleted. A per-field JSON diff of all 424 against `HEAD`: `structure.headingLevels` + `content.headingText` on 420 records, `structure.headingJumps` on 2, nothing else; **all 422 page records' (level, text) pairs are a permutation of the old ones**, so no text or data change rode along. `_meta.json` changes: `pages` 925 → 924 (`/search-results/`, whose two records the merge commit already deleted), `prod_prod`'s `arbitrated` emptied, `dataCommit` production `8df3a04825` → `7b61f6653b`, staging `3a26d038eb` → `2de9129c38`, plus `capturedAt`/`gitHead`. 0 CR bytes; all 424 parse as JSON objects |

## The exact next commands

None — the merge is closed. What remains is the follow-ups below, each its own piece of work.

## Follow-ups

- **F1** (carried from 09-26) — comment-spacing convention not yet applied to `assets/js/nr-report/`.
- **F3** — production's DE characterization baseline (`scripts/de-characterization-baseline/`, captured `19c3e93153` 2026-10-01) no longer matches EHDP-data staging; it fails on production's own tree (V8). Production's to re-capture.
- **F2** — `CLAUDE.md` describes `nr-report.html`'s page-level ignore as on `<section id="skip-header-target">`; the element is `<section class="container-fluid" data-pagefind-ignore="all">` (`nr-report.html:52`). Predates this merge.
