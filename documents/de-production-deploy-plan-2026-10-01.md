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

**Status as of 2026-10-01: ledger written, nothing executed. Tasks 1–6 not started.**

Analysis ran against `feature-new-data-explorer` at `f4a59ed843` and `production` at `ed63fa7603`
(= `origin/production`), merge base `4a260ea2a1`. If either tip has moved, re-run Task 1 Step 1
before trusting any count below:

```
git rev-list --left-right --count feature-new-data-explorer...production   # was: 505 222
git merge-base feature-new-data-explorer production                         # was: 4a260ea2a1
```

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Merge `production`, resolve 38 conflicts | | **Not started** | |
| 2 | Port production's old-explorer changes onto `data-explorer-old/` | | **Not started** | |
| 3 | Comment-spacing convergence run | | **Not started** | |
| 4 | Verification sweep | | **Not started** | |
| 5 | PR into `production` | | **Not started** | |
| 6 | Post-deploy check | | **Not started** | |

**Next command** (Task 1 Step 1, from the primary worktree, which holds this branch):

```
git rev-parse --abbrev-ref HEAD          # must print feature-new-data-explorer
git status --porcelain --untracked-files=no | wc -l   # must print 0
git merge --no-ff production
```

## Decisions

| # | Decision | Who / when | Notes |
|---|---|---|---|
| D1 | `data-explorer-old` ships, and production's improvements to the old explorer carry onto it | Chris, 2026-10-01 | This is what creates Task 2. Audit §4.4 (retire the old trees) stays parked — consistent with D1 |
| D2 | The new explorer accepts the old explorer's URL format; the new format is built on it, with defaults filled in by the JS | Chris, 2026-10-01 | The author's statement, not independently checked. Task 4 Step 6 loads old-format links as a confirmation, not as a gate on the decision |
| D3 | Production's section-header (`7a995427a1`) and skip-link (`b8771726c9`) changes, written against the old explorer's templates, also go onto the new explorer's | Chris, 2026-10-01: **yes** | Task 1 Steps 4–5 carry them onto `indicator-catalog.html`, `section.html`, `single.html` and the auto-merged `data-index.html` |
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

The copies on this branch have drifted from the old explorer production had at the merge base (by
+0/−1 lines in most files, up to +79/−119 in `table.js`), so a copy-over would discard this
branch's fixes, e.g. `2d49d98914`'s `lib-arquero` includes. Apply production's diff with a 3-way
fallback instead.

- [ ] **Step 1: Build the path-rewritten patch** (Bash; `$SCRATCH` = any temp directory):

  ```
  git diff 4a260ea2a1 production -- 'themes/dohmh/layouts/data-explorer/' 'assets/js/data-explorer/' \
    | sed -E 's#(a|b)/(themes/dohmh/layouts|assets/js)/data-explorer/#\1/\2/data-explorer-old/#g' \
    > "$SCRATCH/old-port.patch"
  grep -c '^diff --git' "$SCRATCH/old-port.patch"     # expect 14
  ```

- [ ] **Step 2: Apply.** `git apply --3way "$SCRATCH/old-port.patch"`. Pre-merge dry run
  (`git apply --check -v`): 7 of 14 apply cleanly, 7 need the 3-way fallback — `app.js`, `data.js`,
  `table.js`, `data-index.html`, `indicator-catalog.html`, `section.html`, `single.html`
  `[verified 2026-10-01, against f4a59ed843]`. Resolve those 7 by hand: keep this branch's
  `data-explorer-old` fixes, add production's changes.

- [ ] **Step 3: Prove it.** `git grep -c caclulated -- assets/js/data-explorer-old` → no output
  (was 2). `git diff --stat` touches only `data-explorer-old/` paths. No conflict markers. Commit;
  record the hash.

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
- [ ] **Step 3:** smoke, full page list (43 on this branch before the merge; production's count may
  differ — record the merged number) → all clean.
- [ ] **Step 4:** `npm run docs-check` → exit 0.
- [ ] **Step 5:** isolated `prod_prod` build:
  `HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment prod_prod -d "$TEMP/iso-docs"` → exit
  0, 0 ERROR; record the page count.
- [ ] **Step 6: Browser, fresh tab.** New explorer on three indicators across map/table/trend; the
  three `/data-explorer-old/` pages render with tables; the skip link focuses
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
