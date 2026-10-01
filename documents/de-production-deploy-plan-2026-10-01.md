# Deploying the new data explorer: `production` → `feature-new-data-explorer` → `production`

<!-- Deliberately does NOT declare a `docs-check source-roots` comment. This plan cites paths that
     exist on `production` but not on this branch (assets/scss/_custom.scss,
     scripts/js-comment-spacing.py before the merge lands) — docs-check would fail it for naming
     them. Do not opt this file in. -->

**Goal:** Ship the new explorer (and the retired old one at `/data-explorer-old/`) to `production`,
without losing any of the 222 commits `production` gained since the August merge.

**Approach:** Merge `production` into `feature-new-data-explorer`, port production's old-explorer
changes onto `data-explorer-old/` as a separate commit, re-run the comment-spacing convergence tool
as a third commit, verify, then open the PR into `production`.

**The finding that shapes the plan.** On `production`, `assets/js/data-explorer/` and
`themes/dohmh/layouts/data-explorer/` hold the *old* explorer; on this branch they hold the *new*
one, and the old one lives at `data-explorer-old/` (90 files here, 0 on `production`). Git matches
by path, so every `production` edit to the old explorer lands on — or conflicts with — a
new-explorer file, and none of it reaches `data-explorer-old/` `[verified 2026-10-01: git ls-tree
-r on both branches; git diff --name-status 4a260ea2a1 production over the three data-explorer
roots lists 14 files, all under data-explorer/]`.

## Ledger

**Status as of 2026-10-01: Tasks 1–3 done; Tasks 4–6 not started.**

Analysis ran against `feature-new-data-explorer` at `f4a59ed843` and `production` at `ed63fa7603`
(= `origin/production`), merge base `4a260ea2a1`. If either tip has moved, re-run Task 1 Step 1
before trusting any count below:

```
git rev-list --left-right --count feature-new-data-explorer...production   # was: 505 222
git merge-base feature-new-data-explorer production                         # was: 4a260ea2a1
```

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Merge `production`, resolve 38 conflicts | `ec65e6f9c7` (parents `0f62c097a6` + `ed63fa7603`) | **DONE 2026-10-01** | 38 unmerged at start, identical to the dry-run list; 0 after. `npm run lint` exit 0 over 16 files, control `echo "notDefinedAnywhere123();" \| npx eslint --stdin --stdin-filename assets/js/data-explorer/zz-control.js` → exit 1, `no-undef`. Isolated build `HUGO_RESOURCEDIR=<tmp> npx hugo --environment prod_prod -d <tmp>` exit 0, 0 ERROR, 1249 EN pages, repo status unchanged. `npm install` exit 0, `package-lock.json` byte-unchanged. No conflict markers in tracked files. Per-file record in "Task 1 record" below |
| 2 | Port production's old-explorer changes onto `data-explorer-old/` | `2676f80653` | **DONE 2026-10-01** | Base corrected from `4a260ea2a1` to `aa173ade6c` (see "Task 2 record"). Per-file residual check: for all 14 files, the changed-line set of `production` → result equals that of `aa173ade6c` → this branch's old copy, less changes production also made. `git grep -c caclulated -- assets/js/data-explorer-old` → none (control: `f156df9078`, the pre-port tip → `app.js:2`). Staged paths outside `data-explorer-old/`: 0. Skip-target sweep → exactly `baseof.html`, `list.html`. `node --check` on `table.js` exit 0. Isolated `prod_prod` build exit 0, 0 ERROR, 1249 EN pages, repo status unchanged; built `/data-explorer-old/` has Pagefind-ignore only on the `de-topic-indicators` wrapper, and `groupByBoroughToggle` is on all 41 built topic pages. `npm run lint` does not apply: `eslint.config.mjs` excludes `data-explorer-old/` by design |
| 3 | Comment-spacing convergence run | `ca7feac713` | **DONE 2026-10-01** | Precondition: the script walks the filesystem, not the index, so untracked targets would be edited invisibly — on-disk vs tracked counts matched (66 `.js` under `assets/js`+`content`, 150 `.html` under `themes/dohmh/layouts`). Script: 634 blank lines across 29 files, exit 0. Both docstring checks → 0 and 0; `git diff --numstat` → 29 files, 634+, 0−, matching the script's count; 0 whitespace-only added lines. espree token streams of all 16 changed JS files identical between `HEAD` and the result (control: a blank line inside a template literal does change the stream). All 37 template insertions read: each between a `//` line and code in a `<script>` body, none in a string. `npx eslint assets/js/data-explorer` exit 0; same `no-undef` control as Task 1 → exit 1 |
| 4 | Verification sweep | | **Not started** | |
| 5 | PR into `production` | | **Not started** | |
| 6 | Post-deploy check | | **Not started** | |

**Next command** (Task 4 Steps 1–3, Bash, from the primary worktree). Argv read 2026-10-01:
`de-characterization.mjs` runs `--check` unless `--baseline` is present (the `mode` line in its
main block), so a bare run is safe; `smoke-pages.mjs` bare is the curated list. Both resolve a
server through `scripts/dev-server.mjs` — it reuses one on :8080/:8081/:1313, or starts
`dev_stage` (staging data) and stops it afterwards:

```
git rev-parse --abbrev-ref HEAD                       # must print feature-new-data-explorer
npm run lint                                          # exit 0
node scripts/de-characterization.mjs                  # zero diffs
node scripts/smoke-pages.mjs                          # 44 pages, all clean
```

## Task 1 record

- **rerere replayed two earlier resolutions** — `scripts/dev-server.mjs` and the August plan doc.
  Neither was trusted as replayed. Both ended as production's file byte-for-byte: the plan doc's
  version on this branch equals production's at `f1d6f02243`, which production then built on; the
  `dev-server.mjs` replay differed from production only in older comment wording and an
  equivalent `onExit` binding.
- **D3 had nothing to apply in the new explorer's `section.html` and `single.html`.** Both are
  full-width map shells with no visible `<h1>` or breadcrumb — the only `<h1>` is the hidden
  search-only copy — so `section-header.html` / `section-icon.html` have nowhere to go, and
  neither carried `id="skip-header-target"`: this branch had already removed it from 44 templates
  in its own `23a89dd34f` (2026-07-25). Both resolved to this branch's file, unchanged.
  `indicator-catalog.html` and the auto-merged `data-index.html` did get the section icon.
- **Step 6 predictions that did not hold:** `topiclanding.html` was one hunk (the `nr-leaflet.html`
  suffix, `31b08a3aa2`), not a duplicated `lib-uhflist` include — it is included once.
  `leading-causes.html` was not a re-apply job: this branch's only change since the merge base was
  the skip-target removal, which production's `b8771726c9` made identically, so production's file
  is the resolution.
- **`baseof.html`:** this branch's comment called the `tabindex="-1"` focus behaviour a
  HYPOTHESIS; production's `b8771726c9` measured it (5 pages, each with its own negative control),
  so production's comment replaced it.
- **`CLAUDE.md` carried two `docs-check source-roots` headers.** `docs-check.mjs` reads the first
  match, so this branch's 3-root header would have silently shadowed production's 7-root one;
  this branch's pair was removed. The smoke count reads 44 — the merged `PAGES` is 44, the union
  of both sides (45) minus `search-results/`, whose page this branch deleted in `7e5d0d12b1`.
  Production's own text said 33 against a 34-entry list.
- **`package.json`:** production's `"ci"` dependency stays out — this branch removed it as unused
  in `4260823794` (audit Tier 1.6).
- **Carried for Task 2:** the skip-target sweep
  (`grep -rln 'id="skip-header-target"' themes/dohmh/layouts`) lists `baseof.html`, `list.html`
  and the four `data-explorer-old/` templates. Task 2's port of `b8771726c9` removes those four;
  after it, the sweep must list exactly `baseof.html` and `list.html`.
- **Found, not fixed, for Task 4 Step 4:** project `CLAUDE.md`'s "Data explorer" section says
  `data-explorer/single.html` defines `renderIndicatorDropdown`, `renderIndicatorButtons` and
  `createCitation` in inline scripts. On this branch none of the three appears in that file or in
  any `data-explorer/` template; they live in `data-explorer-old/`. `docs-check` cannot catch it —
  the identifiers exist under its source roots, just in the other explorer.

## Task 2 record

- **The prescribed base was too late, and the plan's explanation of the drift was wrong.**
  `data-explorer-old/` was copied verbatim (JS; the templates were edited in the copy) at
  `18d94c510f` (2026-06-27) from a tree that never had 7 of production's old-explorer commits:
  `3eec76d023`, `4c06062296` (borough grouping), `05db5fd1cc`, `c03635c51e`, `dd16987cad`,
  `52fde98740`, `e8849a2790`. All 7 precede `4a260ea2a1`, so the planned patch could not carry
  them — and they, not fixes of this branch's, are what the "+79/−119 in `table.js`" drift was.
  The first apply showed it: `table.js`'s "theirs" side was merge-base content, and `global.js`
  "applied cleanly" while lacking the `groupTableByBorough` declaration `table.js` would then
  reference. That apply was discarded `[2026-10-01: git checkout HEAD on both old trees, 0 modified
  after]`.
- **Correct base: `aa173ade6c`** = `git merge-base 18d94c510f^ production` (2026-06-15). A tree
  diff from `18d94c510f^` would have been wrong too: this branch has 5 old-explorer commits before
  the copy that production lacks (`e92a5638be`, `4f6bd85bd7`, `50f610bf7e`, `7979292048`,
  `6d8e051f79`), which that diff would have reverted. From `aa173ade6c` the 3-way keeps them.
- **4 conflicts, not 7.** Resolutions: `table.js` — production's borough-grouping hunks; this
  branch's enabled `console.log`/`print` debug lines in `renderTable` (base had them commented,
  production left them, this branch enabled them). `data-index.html`, `single.html` —
  production's side (no skip-target id; one `lib-arquero` include, where the 3-way had produced
  two). `section.html` — production's section header and Arquero block, no skip-target id, plus
  this branch's `c2b7feb86f` Pagefind arrangement (ignore on the `de-topic-indicators` wrapper,
  not on `<article>`).
- **Result:** 9 of 10 JS files are byte-identical to production's old explorer; `table.js`
  differs only by the two debug lines. `links.js` needed nothing — already identical.
- **Found, not fixed:** production's own old-explorer `section.html` and `indicator-catalog.html`
  load Arquero twice — an inline `resources.Get` block plus `lib-arquero.html`, which emits the
  same tag. The port reproduces it (built `/data-explorer-old/` carries 2 Arquero script tags). A
  production-side condition, out of scope for a port.

## Decisions

| # | Decision | Who / when | Notes |
|---|---|---|---|
| D1 | `data-explorer-old` ships, and production's improvements to the old explorer carry onto it | Chris, 2026-10-01 | This is what creates Task 2. Audit §4.4 (retire the old trees) stays parked — consistent with D1 |
| D2 | The new explorer accepts the old explorer's URL format; the new format is built on it, with defaults filled in by the JS | Chris, 2026-10-01 | The author's statement, not independently checked. Task 4 Step 6 loads old-format links as a confirmation, not as a gate on the decision |
| D3 | Production's section-header (`7a995427a1`) and skip-link (`b8771726c9`) changes, written against the old explorer's templates, also go onto the new explorer's | Chris, 2026-10-01: **yes** | Applied in Task 1 to `indicator-catalog.html` and `data-index.html`; `section.html` and `single.html` have no markup for either change — see "Task 1 record" |
| D4 | Table default geographies: keep strict follow-the-map, no code change | Chris, 2026-10-01: **closed** | The Citywide + Borough context option is recorded and deferred in `documents/site-wide-audit-2026-06-27.md` §4c; the fresh audit's "Status at a glance" points there. History: Chris first asked to follow the old explorer's pattern unless that needed one-off conditionals. The audit's "Citywide + Borough" was one indicator's instance of the old rule, which is *every* available geography checked, most recent time only (`assets/js/data-explorer-old/measures.js`, the `tableTimes.forEach` and `dropdownTableGeoTypes.forEach` blocks). The new explorer's single-geography default is not a standalone default: the table *follows the map dropdowns* — the default in `renderMeasures`' "table defaults" block (`measures.js`), the re-sync on every geo/time dropdown change (`menu.js` → `syncTableFiltersToMapSelection`), the geo choice inside `getCurrentMapTableFilters` (`table.js`), the "Sync to map" button and the Synced/Custom summary (`table.js`). Adopting the old rule means redefining what "synced" means for geography, not adding a conditional. **Table-follows-the-map is an explicit team design choice (Chris, 2026-10-01)** — it is not up for removal, so the old rule as written is off the table. |

## Environment

- Primary worktree holds `feature-new-data-explorer`. Two linked worktrees exist
  (`feature-MOD-Lab-NR-recode-refactor-merge`, `update-characterization-baselines-2026-09-21`);
  this plan touches neither.
- 2,744 untracked files in the primary worktree (`documents/NDHR/`, `scripts/.sc-check/`,
  `scripts/site-characterization-current/`, …). None collide with a path in `production`'s tree,
  so they cannot block the merge `[verified 2026-10-01: git cat-file -e production:<path> for every
  git ls-files --others --exclude-standard entry, 0 hits]`. Leave them alone.
- Never run two Hugo builders against this tree at once (project `CLAUDE.md`). Task 4's build uses
  `HUGO_RESOURCEDIR` and `-d` into temp directories.

## Task 1: Merge `production`, resolve the conflicts

**Files:** the 38 conflicted paths below, plus `themes/dohmh/layouts/data-explorer/data-index.html`
and `assets/js/data-explorer/links.js`, which merge silently (see Step 5).

Dry run: `git merge-tree --write-tree --name-only --messages feature-new-data-explorer production`
→ exit 1, 38 conflicted paths: 36 content, 1 add/add (`eslint.config.mjs`), 1 modify/delete
(`assets/scss/_custom.scss`) `[verified 2026-10-01]`. The production commits behind each conflict
were mapped with `git log 4a260ea2a1..production --no-merges -- <path>`; that mapping is what the
categories below rest on.

- [ ] **Step 1: Start the merge.** Commands in the Ledger's next-command block. Expect 38 unmerged
  paths: `git diff --name-only --diff-filter=U | wc -l` → 38. A different number means a tip moved
  — stop and re-derive the categories.

- [ ] **Step 2: Category A — production's side is only the comment-spacing sweep (`9217d8b03c`).
  Take this branch's side; Task 3 re-applies the convention.** 15 files:

  ```
  assets/js/data-explorer/{data,disparities,global,map,measures,print,table,trend}.js
  themes/dohmh/layouts/partials/{de-chooser,js_bottom,overlap-tool,pesticides-section,realtime-download,render-accessible-table,render-table}.html
  ```

  Plus `assets/js/data-explorer/app.js`, whose production side is `9217d8b03c` and `bc46f8c4ef`
  (the `click_how_caclulated` → `click_how_calculated` rename). Take ours there too: the new
  explorer has no `click_how_calculated` or `click_how_caclulated` event at all; the typo survives
  only in `assets/js/data-explorer-old/app.js` (2 hits), which Task 2 fixes `[verified 2026-10-01:
  git grep -c on both branches]`.

  `git checkout --ours -- <the 16 paths>` then `git add` them. Expected: `git diff --name-only
  --diff-filter=U | wc -l` → 22.

- [ ] **Step 3: Category B — `assets/scss/_custom.scss` (modify/delete).** This branch renamed it
  to `assets/scss/_de-custom.scss` (`04eb4e09d9`, 2025-11-12), and the merged `theme.scss` imports
  `de-custom.scss`, not `custom.scss` `[verified 2026-10-01: git show <merged-tree>:assets/scss/theme.scss]`.
  `git rm assets/scss/_custom.scss`, then port production's one change (`0007cf874f`) by hand: in
  `_de-custom.scss`, the `.neighborhood-list-button, …:hover, ….active` rule changes
  `color: $primary !important` → `color: $primary-dark !important`, with production's two-line
  contrast comment above the rule. Expected: `git grep -c 'primary-dark !important' --
  assets/scss/_de-custom.scss` ≥ 1, and `assets/scss/_custom.scss` absent.

- [ ] **Step 4: Category C — the new explorer's own templates.** Production's edits here were
  written against the *old* explorer's versions of these files:

  ```
  themes/dohmh/layouts/data-explorer/indicator-catalog.html   # 7a995427a1 9217d8b03c b8771726c9
  themes/dohmh/layouts/data-explorer/section.html             # 7a995427a1 b8771726c9
  themes/dohmh/layouts/data-explorer/single.html              # 7a995427a1 9217d8b03c b8771726c9
  ```

  D3 is settled: the new explorer gets these changes. For each file, keep this branch's structure
  and carry production's header/icon (`7a995427a1`) and skip-target (`b8771726c9`) changes onto it.
  Do not take production's hunks wholesale — they are the old explorer's markup. Read
  `git show 7a995427a1 -- <path>` and `git show b8771726c9 -- <path>` for what each changed.

- [ ] **Step 5: Review the two silent merges.** Neither conflicts, so nothing will flag them:
  - `themes/dohmh/layouts/data-explorer/data-index.html` — production's +55/−2
    (`7a995427a1`, `9217d8b03c`, `b8771726c9`) applied onto the new explorer's copy. Read
    `git diff HEAD -- <path>` and confirm the header/icon and skip-target changes landed in the
    right places on the new explorer's markup (D3: they should be there).
  - `assets/js/data-explorer/links.js` — production's +1 is comment spacing only. No action
    beyond reading the one-line diff.

- [ ] **Step 6: Category D — genuine two-sided template merges.** Resolve line by line; production
  carries accessibility and content fixes in each:

  ```
  themes/dohmh/layouts/_default/baseof.html                   # b8771726c9 ac27116b14 (<html lang>)
  themes/dohmh/layouts/_default/list.html                     # b8771726c9 ac27116b14
  themes/dohmh/layouts/partials/header.html                   # 6c85c4a575 9ae35c3e9a d0fc7e1753 712c74a33c
  themes/dohmh/layouts/partials/footer.html                   # 6c85c4a575 3ce4b8f2b3
  themes/dohmh/layouts/key-topics/section.html                # 7a995427a1 b8771726c9
  themes/dohmh/layouts/partials/df-front-block.html           # 7a995427a1
  themes/dohmh/layouts/partials/de-text-search.html           # 9217d8b03c e70327e984 (combobox role)
  themes/dohmh/layouts/partials/nr-chooser.html               # 9217d8b03c cad179b26c
  themes/dohmh/layouts/neighborhood-reports/topiclanding.html # 7a995427a1 9217d8b03c e70327e984 b8771726c9 31b08a3aa2 ab831a000c
  themes/dohmh/layouts/data-features/leading-causes.html      # 9217d8b03c c08f9e8dec 9d3f161b8e c475878344 baec8972df b8771726c9
  ```

  `topiclanding.html`: `ab831a000c` ("include lib-uhflist.html") likely duplicates the include this
  branch added at C1 (`3210c5ee87`, `topiclanding.html:19` per the August plan) — not compared;
  check, and keep exactly one. `leading-causes.html`: `baec8972df` is titled "Reformat
  leading-causes.html to 4-space indent", so expect a whole-file conflict; the recommendation is to
  start from production's side and re-apply this branch's changes, found with
  `git diff 4a260ea2a1 feature-new-data-explorer -- <path>`.

- [ ] **Step 7: Category E — tooling.** `package.json`, `eslint.config.mjs` (add/add: production
  ported the guardrails from the NR branch in `393e3cbac7`; this branch has its own),
  `scripts/smoke-pages.mjs`, `scripts/dev-server.mjs`. Union both sides: `eslint.config.mjs` must
  still derive the DE globals for `assets/js/data-explorer/`; `smoke-pages.mjs`'s `PAGES` must keep
  both sides' entries, including the three `data-explorer-old` pages (`d763b09f57`) and production's
  `c4b1920350` entry; `package.json` keeps production's exact `hugo-extended` pin (`90328b504e`).
  Then `npm install` and check `git status` shows `package-lock.json` unchanged or consistent.

- [ ] **Step 8: Category F — data and records.**
  - `data/recently_updated_data.yml` — **keep this branch's structure.** This branch changed the
    file's data structure for the new explorer's badges (`dd4d9e660e`, 2026-06-22, "update data
    structure for alignment"); production's only change is `3b66dbf41b` (2026-09-10, "add NYCCAS
    indicators to recently updated"), written in the old structure `[verified 2026-10-01: git log
    4a260ea2a1..<each branch> -- <path>]`. Re-express production's NYCCAS entries in this branch's
    structure; never take `--theirs`. Confirm in Task 4 Step 6 that the badges render.
  - `documents/nr-de-merge-integration-plan-2026-08-15.md` — both sides edited it after the
    August merges: this branch at `0500e5ddf1` (2026-08-19), production at seven record commits
    through `a67f957ba7` (2026-08-20). Start from production's side, then
    `git diff 3210c5ee87 0500e5ddf1 -- <path>` shows what this branch alone added; re-apply that.
  - `CLAUDE.md`, `documents/js-conventions.md` — union. Keep this branch's `docs-check` header on
    `CLAUDE.md`; Stage B dropped it once (August plan, B2 row).

- [ ] **Step 9: Close out.** `git diff --name-only --diff-filter=U | wc -l` → 0;
  `git grep -nE '^(<<<<<<<|>>>>>>>|=======$)' -- assets themes content config scripts data` → no
  output; `npm run lint` exit 0. Then commit the merge. Record the hash in the Ledger.

## Task 2: Port production's old-explorer changes onto `data-explorer-old/`

**Files:** the 14 `data-explorer-old/` counterparts of the files production changed (10 JS, 4
templates). A separate commit after Task 1, so the merge commit stays a merge.

**Corrected 2026-10-01 during execution** — the base was `4a260ea2a1` and is now `aa173ade6c`;
why is in "Task 2 record". This branch does carry its own old-explorer changes (5 before the copy,
3 template commits after it, e.g. `2d49d98914`'s `lib-arquero` includes), so a copy-over of
production's files would still be wrong. Apply production's diff with a 3-way fallback.

- [x] **Step 1: Build the path-rewritten patch** (Bash; `$SCRATCH` = any temp directory):

  ```
  git diff aa173ade6c production -- 'themes/dohmh/layouts/data-explorer/' 'assets/js/data-explorer/' \
    | sed -E 's#(a|b)/(themes/dohmh/layouts|assets/js)/data-explorer/#\1/\2/data-explorer-old/#g' \
    > "$SCRATCH/old-port.patch"
  grep -c '^diff --git' "$SCRATCH/old-port.patch"     # expect 14 (370+/111− before rewriting)
  ```

  One `data-explorer/` survives the rewrite, in `indicator-catalog.html`: a `${baseURL}data-explorer/`
  link inside a context line, identical in this branch's copy. Leave it.

- [x] **Step 2: Apply.** `git apply --3way "$SCRATCH/old-port.patch"` → exit 1, 10 clean, 4
  conflicted: `table.js`, `data-index.html`, `section.html`, `single.html`. Resolutions are in
  "Task 2 record". (The pre-merge dry run's "7 conflict" list was against the wrong base.)

- [x] **Step 3: Prove it, then commit.** The proofs that ran are in Ledger row 2. The prescribed
  `npm run lint` is replaced by the per-file residual check there: lint excludes
  `data-explorer-old/`. Commit; record the hash.

## Task 3: Comment-spacing convergence run

**Files:** whatever `scripts/js-comment-spacing.py` (arrives with Task 1) touches. Its own header
names this case: "this exists for the moment old code arrives, which is the merge of a long-lived
branch. Run it, review the diff, commit separately."

After the merge it newly reaches 17 JS files not on `production`: the 10 under
`assets/js/data-explorer-old/` and 7 new-explorer files (`311.js`, `bar.js`, `correlate.js`,
`de-tab-content.js`, `menu.js`, `print-map.js`, `topic-indicator-selector.js`) — none vendored, so
the script's exclusion list needs no addition `[verified 2026-10-01: comm -23 of the two branches'
assets/js + content .js listings]`. It also reaches every template `<script>` on this branch that
production never had.

**What ran instead (2026-10-01):** 16 JS files, all new-explorer, and 13 templates; zero in
`data-explorer-old/`. The prediction above was written before Task 2 was corrected — the port
made those 10 files production's already-swept text. It also missed the 9 new-explorer files that
share a name with production's old ones (`app.js`, `data.js`, …): Category A took this branch's
unswept side for them.

- [ ] **Step 1:** Clean tree, then `python scripts/js-comment-spacing.py`.
- [ ] **Step 2: The script's required checks, both must print 0:**

  ```
  git diff -U0 | grep -E '^\+' | grep -v '^+++' | grep -c '[^+[:space:]]'
  git diff -U0 | grep -E '^-'  | grep -v '^---' | wc -l
  ```

- [ ] **Step 3:** `npm run lint` exit 0. Commit; record the hash.

## Task 4: Verification sweep

Production changed the harness interfaces (`4955a0a006`, `4a91dd94f9`: smoke takes a named
environment and refuses arguments npm would mangle). Use the commands the merged `CLAUDE.md`
documents, and read each script's argv handling before the first run.

- [ ] **Step 1:** `npm run lint` → exit 0.
- [ ] **Step 2:** `node scripts/de-characterization.mjs --check` → zero diffs. A diff here after
  Category A/Task 3 means a resolution changed new-explorer behaviour.
- [ ] **Step 3:** smoke, curated list → all clean. Expect 44 pages (the merged `PAGES`, counted
  from the source in Task 1); the script's own "N pages clean" line is the authority.
- [ ] **Step 4:** `npm run docs-check` → exit 0. Then fix the stale `CLAUDE.md` claim recorded
  in "Task 1 record" (the three inline-script functions), which `docs-check` cannot see.
- [ ] **Step 5:** isolated `prod_prod` build:
  `HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment prod_prod -d "$TEMP/iso-docs"` → exit
  0, 0 ERROR; record the page count.
- [ ] **Step 6: Browser, fresh tab.** New explorer on three indicators across map/table/trend; the
  three `/data-explorer-old/` pages render with tables, and on an old-explorer topic page the
  `#groupByBoroughToggle` (production's `4c06062296`, new to this copy in Task 2) regroups the
  table both ways — production runs that code under its own `head.html`, this branch under the
  per-template gating of `47ffb33fde`, so it has not run here before; the skip link focuses
  `#skip-header-target` on a DE page and a non-DE page; and per D2, three old-format
  `/data-explorer/<topic>/?id=<n>` links taken from `production`'s content load the right indicator.
- [ ] **Step 7: Site characterization against `prod_prod`.** Expect differences on every DE page —
  replacing the explorer is the change. Read the diff to confirm it is confined to DE pages and the
  shared-template changes of Task 1, then re-baseline. **`scripts/site-characterization-rebaseline.mjs`
  re-captures every committed baseline when run bare** (global CLAUDE.md, 2026-08-26 incident); read
  its argv parsing before invoking it.

## Task 5: PR into `production`

- [ ] **Step 1:** Push. (D4 closed with no code change.)
- [ ] **Step 2:** `gh pr create --base production --head feature-new-data-explorer`. Five workflows
  trigger on `pull_request` on `production`: `codeql.yml`, `hugo-build-to-dev-stage.yml`,
  `hugo-build-to-prod-prod.yml`, `site-characterization.yml`, `smoke.yml` `[verified 2026-10-01:
  grep '^\s*pull_request' over production's .github/workflows/]`. Read what the two `hugo-build-to-*`
  workflows do on a PR event before opening — not checked.
- [ ] **Step 3:** `/code-review ultra <PR#>` (global CLAUDE.md: the billed review is for the merge
  into the deploy branch).
- [ ] **Step 4:** Confirm checks ran: query runs by the PR's head SHA, not branch name (memory
  `project-pr-checks-need-a-mergeable-pr`).

## Task 6: Post-deploy check

- [ ] After the `prod-prod` build publishes: fresh tab on the live `/data-explorer/` and
  `/data-explorer-old/`, the Step 6 old-format links again, and smoke against the live base URL.
  Then close this ledger with one line: done, date, commit range.
