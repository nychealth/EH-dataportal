# Merging `production` into `feature-MOD-Lab-NR-recode-refactor-merge` (second time)

**Status as of 2026-09-27: Stages R, G and V done and staged — every check green, the Pagefind
baseline re-captured. The merge itself is uncommitted, awaiting the user's go. Stage C not started.**

The same job as `documents/nr-merge-production-2026-09-01.md`, which closed 2026-09-02 at
`79d5eb4804`; that document's shape and its decisions are the exemplar here. This one brings the
branch up to `production`'s tip again.

## Identity

| | |
|---|---|
| Branch (ours) | `feature-MOD-Lab-NR-recode-refactor-merge` at `da07fe94b4` |
| Worktree | `EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor-merge` |
| Merging in | `production` at `c33fe499ef` |
| Merge base | `0c860946cd` (the tip the previous merge brought in) |
| Divergence | 197 commits ours, 38 theirs (25 non-merge) |
| Backup branch | `feature-MOD-Lab-NR-recode-refactor-backup` (pre-existing, not cut for this merge) |

181 paths conflict, and `git merge-tree --write-tree --name-only HEAD MERGE_HEAD` (rerere-blind)
returns the same 181 as `git status`, so `rerere` replayed nothing `[verified 2026-09-26]`:

- 8 delete/modify — retired NR templates this branch deleted and production touched
- 168 NR page records (84 per key) + 2 `_meta.json` under `scripts/site-characterization-baseline/`
- 3 content conflicts: `themes/dohmh/layouts/404.html`, `themes/dohmh/layouts/partials/nr-leaflet.html`, `documents/site-wide-audit-2026-06-27.md`

## Environment state

- No `hugo.exe` running and nothing listening on 8080, 8081, 1313 or 8090 `[verified 2026-09-26:
  Win32_Process, Get-NetTCPConnection]`. Harnesses that spawn will spawn `dev_stage` — staging data.
- `rerere.enabled=true` in repo config, as last time.
- This ledger cannot be committed separately while the merge is live; it lands inside the merge
  commit, and the hash column is filled by a later commit.

## Decisions taken

| Decision | Rejected | Why |
|---|---|---|
| The 8 retired templates are **removed** | Restoring them | Production's only change to them is `9217d8b03c` (comment spacing), and every one of its 36 added lines is blank — 0 non-blank added, 0 removed `[verified 2026-09-26: git diff -U0 base..production over the 8 paths]`. Nothing to port |
| Baseline conflicts resolve to **ours** as a placeholder, then **both keys are re-captured in a separate commit** | Picking a side as final; re-capturing inside the merge commit | Neither side describes the merged tree: ours (`d53c718492`, 2026-09-02) has the NR rewrite on older data; production's (`22ad21187f`, 2026-09-21) has NYCCAS 2025 data on the retired NR pages. The ~98 baseline files that merged cleanly are already a mix. Separate commit follows the exemplar (`029e40f36e`, `d53c718492`), which kept a 262-file re-capture from burying the merge diff |
| Gap fixes git cannot flag go **in the merge commit** | A follow-up commit | Exemplar: G1 of the 09-01 merge landed in `79d5eb4804` |
| The Pagefind baseline is re-captured **in the merge commit**; the site-characterization baselines are not | Splitting both out, or keeping both in | Exemplar again: `79d5eb4804` carried a re-captured Pagefind baseline. That diff here is 8 lines; the site-characterization re-capture is hundreds of files per key and would bury the merge |
| Comment-spacing is **not** applied to `assets/js/nr-report/` in this merge | Running `scripts/js-comment-spacing.py` now | A codemod over 10 files is its own reviewable change. Follow-up F1 |

## Tasks

### Stage R — conflict resolutions

| # | File | Resolution | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
Content conflicts were resolved per hunk by a scratch script that keeps one side of each hunk and
leaves every other byte alone (read and written as bytes, so no LF became CRLF). A whole-file
`git checkout --ours` would have been wrong for R3: it drops production's auto-merged CARTO key.

| # | File | Resolution | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| R1 | 8 retired NR templates (`topiclanding.html`, `nr-output/single.html`, `partials/nr-chooser.html`, `nr-clickable-uhf.html`, `nr-indicator-new.html`, `nr-indicator-old.html`, `nr-map-highlight.html`, `nr-show-zips.html`) | `git rm` | | **DONE 2026-09-26**, staged | Port check: production's 36 added lines in them are all blank |
| R2 | `themes/dohmh/layouts/404.html` | Ours, 1 hunk | | **DONE 2026-09-26**, staged | 1 marker, 1 resolved, 0 left; result byte-identical to stage 2 (all 5 of production's blank lines were inside the hunk); 0 CR bytes of 2357 |
| R3 | `themes/dohmh/layouts/partials/nr-leaflet.html` | Ours, 2 hunks | | **DONE 2026-09-26**, staged | 2 markers, 2 resolved, 0 left. Against stage 2 the result differs by exactly the CARTO `?key=` line plus 2 blank lines — production's auto-merged changes, kept; 0 CR bytes |
| R4 | `documents/site-wide-audit-2026-06-27.md` | Theirs, 1 hunk | | **DONE 2026-09-26**, staged | 1 resolved, 0 left. Against stage 2: +147 lines, 0 removed. `## ` headings run 12–19 in order with no duplicate heading — a duplicate detector that fires on a deliberately doubled §17 found none |
| R5 | 168 NR page records + `prod_prod/_meta.json` + `staging/_meta.json` | Ours (whole file, stage 2), placeholder until C1 | | **DONE 2026-09-26**, staged | 170 paths; all 170 identical to `HEAD` afterwards (`git diff --quiet HEAD` per path, 0 mismatches) |

### Stage G — gaps the merge does not flag

| # | Gap | Commit | Status | Proof that ran |
|---|---|---|---|---|
| G1 | `assets/js/nr-report/map.js` (the `L.tileLayer` call in the map setup) uses the CARTO voyager URL **without** `?key=`. Production's `598fba0b19` added the key to 27 files, `nr-leaflet.html` among them; this file does not exist on production so it was not one of them | | **DONE 2026-09-26**, staged | **The gap is real and invisible to every harness**: the same tile (`voyager/11/602/769.png`) returns HTTP 200 `image/png` either way — 2,049 bytes without the key, a placeholder reading "API KEY REQUIRED", against 34,107 bytes of map with it `[verified 2026-09-26: curl, both images viewed]`. A 200 raises no console error, so smoke cannot see it, and site characterization stopped counting map tiles. After the fix, `git grep --cached 'basemaps\.cartocdn\.com'` (excluding baselines and `docs/`) returns 28 references, all 28 carrying `key=` |

### Stage V — verification

| # | Check | Commit | Status | Proof that ran |
|---|---|---|---|---|
| V1 | 0 conflict markers across the tree; `git diff --name-only --diff-filter=U` empty | | **DONE 2026-09-26** | 0 unmerged; `git grep --cached -E '^(<<<<<<< \|>>>>>>> )'` 0 lines, pattern shown to match a marker line |
| V2 | `npm install` if `package.json`/lockfile changed | *no commit* — neither file changes | **DONE 2026-09-26, not needed** | `git diff --cached --name-only HEAD -- package.json package-lock.json` empty |
| V3 | `npm run lint` | | **DONE 2026-09-26** | exit 0 over `assets/js/data-explorer` and `assets/js/nr-report`. Negative control: an undefined call appended to `nr-report/app.js` gave exit 1 naming it; file restored and matches the index |
| V4 | `npm run docs-check` | | **DONE 2026-09-26** | exit 0, "2 doc(s) checked" |
| V5 + V6 | Isolated `prod_prod` build and full smoke, in one run: `npm run smoke:prod_prod` | | **DONE 2026-09-27** | exit 0, **925 of 925 pages clean** (830 sitemap + 94 paginator + 1), `Pagefind index: served`, isolated server on :8090 stopped afterwards. Smoke cannot see G1 (see G1), so G1 had its own check below |
| V6a | G1 in the browser | | **DONE 2026-09-27** | Scratch Playwright script (not kept) against a spawned `dev_stage` server, on `neighborhood-reports/bayside_little_neck/asthma_and_the_environment/`, hashing every CARTO tile body against the known placeholder. **As served: 12 tiles, 12 keyed, 0 placeholder. Control arm, same page with `key=` stripped by a route: 12 tiles, 0 keyed, 12 placeholder** — so the probe discriminates |
| V7 | `node scripts/nr-characterization.mjs --check` | | **DONE 2026-09-27** | exit 0, 3 of 3 targets match the `staging` baseline |
| V8 | `node scripts/pagefind-characterization.mjs --check` | | **DONE 2026-09-27, re-baselined** | First run **exit 1 with controls passing**: 4 pages changed `words` — `/` 420→432, `/es/` 405→417, `/zh/` 624→646, `/data-features/leading-causes/` 644→656. All production content, both causes shown: **(a)** `data/recently_updated_data.yml` swaps "Rat inspections" for five NYCCAS items, net +12 words, which the home pages list. Proved by control, not arithmetic, because `/zh/`'s +22 cannot be counted by hand: with only that file reverted to our side, the three home pages leave the diff and `leading-causes` alone remains. **(b)** `leading-causes`: production's copy edits in `leading-causes.html` (+12 "These data are for NYC residents, for deaths that happened in NYC.", −2 on the "public health sources" sentence) and the en-dash removal in its `index.md` (+2), net +12. `--baseline` then changed exactly those 4 records, `words` and `contentHash` each, 8 lines; re-check exit 0. 0 CR bytes in the rewritten JSON |

### Stage C — characterization baselines (separate commit)

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| C1 | `npm run characterize:site:prod_prod` against the merge commit; diagnose the differing set before re-capturing. Expected: NR pages (production's NYCCAS movement is absent from our records) plus whatever EHDP-data moved since 2026-09-21 | | Not started | |
| C2 | Re-capture with `node scripts/site-characterization-rebaseline.mjs` (takes no arguments; re-captures every committed key), then re-classify with `--report-only` | | Not started | |

## The exact next commands

```bash
# M1 — commit the merge. Everything is staged; the ledger rides in it (it cannot be committed alone
# while the merge is live). Commit from the worktree root, never with `git -C`.
git diff --name-only --diff-filter=U        # must print nothing
git commit                                   # merge message; signed, allow > 2 min for pinentry
git log -1 --format='%H %P'                  # two parents: da07fe94b4 and c33fe499ef

# C1 — diagnose before re-capturing. Expect exit 1; classify the differing pages.
npm run characterize:site:prod_prod
npm run characterize:site:dev_stage

# C2 — re-capture every committed key (no arguments; unknown arguments are refused), then
# re-classify until nothing is unexplained.
node scripts/site-characterization-rebaseline.mjs
```

Staging the re-captured records may need `core.longpaths` (already set in this repo's config by
the 09-01 merge — the longest `prod_prod` record path is 260 characters).

## Follow-ups this merge creates

- **F1** — `assets/js/nr-report/*.js` and the NR templates' inline scripts predate production's
  comment-spacing convention (`380b0d967d`, applied by `9217d8b03c`). `scripts/js-comment-spacing.py`
  arrives with this merge.
- **F2** — §17 of the site-wide audit cites `assets/js/nr-report/map.js:269` and `:278`; on this
  branch the `GEOCODE != 0` filter is at `:291`. Audit docs are dated records, so this is noted,
  not edited.
