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

**Status as of 2026-10-02: Tasks 1–4 done (D5–D12 fixed); Task 5 in progress (PR #1462 open; checks
on `5d5732de13`: characterization green, smoke red only on the AirNow page production also fails;
D11, the propagation sweep and D12 are newer than that run; ultra refused the PR as too large; the
local review that replaced it ran on `c15317c74b` and found 39 issues; 15 of the 16 before-merge
rows are fixed in `8cf5f7abd3`..`66ca2b0113`, re-baselined in `098711a30b`, and #12 waits on D16 —
see "Review findings"); pushed to `f18dde8820`, where CI matches `5d5732de13` (characterization green,
smoke red only on AirNow's `cooling-info/`, red on `production` too) and the PR body was updated;
re-run on `9e38df2bdc` (docs only) adds one uncleared Datawrapper failure, see next action; merge
blocked on D15 (EHDP-data); Task 6 not started.**

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
| 4 | Verification sweep | Step 4's `CLAUDE.md` fix: `5fef286ec9`. Steps 1–3, 5–7 run against `5fef286ec9` or `7e73a5176f` (which differ only in `CLAUDE.md`). Step 7 re-baseline: `ddc26c8327` (at D9's `9dad6ab230`), then `79286c569c` (at D8's `dcf21609cf`) | **DONE 2026-10-01** — Step 7 check re-run at `19c3e93153` after D5 (`9ed813232d`), D6 (`625a2a0770`), D7 (`19c3e93153`) | Per step in "Task 4 record" |
| 5 | PR into `production` | PR #1462; first checks on `1b5b509cc9`; D10 fix `4f9bcb2c1f` | **In progress** — open; Step 4 DONE 2026-10-02 on `5d5732de13` (characterization green; smoke red only on AirNow's `cooling-info/`, red on `production` too); Step 3 ultra refused (too large), local review ran on `c15317c74b` (39 findings, 15 before merge; see "Review findings") | Per step in "Task 5 record" |
| 6 | Post-deploy check | | **Not started** | |

**Next action: Chris's answers to D15 and D16 (and D17, which does not gate the merge).** D15 is
a change in EHDP-data, not here. Already done on `f18dde8820`: push; PR checks read by SHA —
Site characterization run 37064754331 success; Smoke run 37064754317 failure on
`data-features/cooling-info/` only (AirNow `AQI`), its base-control job red on the same page against
`production`, and `data-features/heat-report/`, `data-stories/violence/` cleared on sequential
re-check; PR body updated (`gh pr edit 1462`, read back identical apart from GitHub's trailing
newline). Then on `9e38df2bdc` (`f21e43a2d3`, `abe04cd9e9`, `9e38df2bdc` change only `CLAUDE.md` and
`documents/`, no Hugo input): Site characterization run 37071805284 success; Smoke run 37071805202
failure on `cooling-info/` (AirNow, as before, base-control red on it too) and on
`data-features/heat-report-archive/2021/` — "Cannot read properties of undefined (reading 'vis')",
not cleared by the sequential re-check, not hit by base-control. No first-party code on that page
reads `.vis`; it embeds Datawrapper charts, so the likely cause is Datawrapper's shared runtime
(audit §16) — an inference: the CI log carries no stack and it was not reproduced. A smoke re-run
would settle intermittency. CI coverage of the explorer itself is planned separately on
`feature-smoke-explorer-indicators` (`documents/smoke-explorer-indicators-plan-2026-10-02.md`
there, `66f5867602`; its D3 is merge order with this PR). After D15 lands in EHDP-data: from the repo root run `node scripts/.sc-rebaseline/fix-probe.mjs f5`
(prod_prod by default; expect 1 path and the "not mapped" popup for 103/870 and 2383/1205), then
the merge (Chris), then Task 6. A new commit here re-runs both PR checks; re-read them by SHA.
The fixes' proofs are in "Review findings"; the probes are `scripts/.sc-rebaseline/race-probe.mjs`
and `fix-probe.mjs` (gitignored, `PROBE_ENV` picks the environment, default `prod_prod`). Local
checks on `66ca2b0113`: `node scripts/smoke-env.mjs prod_prod sample` 44/44 clean; `node
scripts/characterize-env.mjs prod_prod` 42 explorer pages across 5 fields, all from review fixes,
then re-baselined (`098711a30b`, both keys, EHDP-data unmoved); `npm run lint` exit 0.

The review, as agreed and run 2026-10-02 (kept for the record):
- **One review subagent (Opus), not a fleet.** Cross-file context between the JS and the templates
  is worth more than the speed of splitting them; split into two parallel agents (JS; templates +
  SCSS) only if one agent's read turns out too large. Cost not measured in advance; record what
  the run reports.
- **Scope — the code nothing has read for correctness:** `git diff production HEAD -- assets/js/data-explorer`
  (16 files, ~14.5K changed lines), `themes/dohmh/layouts` (58 files, ~8.8K), `assets/scss/_de-custom.scss`
  and `assets/scss/_custom.scss`. The reviewer reads the files whole where the diff is a rewrite.
- **Out of scope, with the reason:** the characterization baselines (generated), `documents/`
  (prose), `assets/js/data-explorer-old/` and `content/data-explorer-old/` (Task 2's per-file
  residual check), `static/css/nyc-basic-lib-v1.2.79.css` (vendored), topic `.md` text (the
  metadata sweep and Probe 3 covered it).
- **Prompt shape** (memory `feedback-review-prompt-enumeration`): ask for an enumeration, not a
  verdict — every defect with `file:line`, the input or state that triggers it, and what goes wrong;
  confirmed vs suspected marked apart; then a closing catch-all ("anything else that would worry you
  shipping this"). Give it the context it cannot derive: classic scripts sharing one global scope
  and the load order in `data-explorer/single.html`; `DE` as the state namespace; the
  table-follows-the-map design (D4) and other recorded decisions, so it does not re-report them;
  what is already proven (lint, smoke, characterization, D10/D11/D12) so it spends effort elsewhere.
- **After:** verify each finding before acting (reproduce or read the code), record the outcome per
  finding in a "Task 5 record" bullet, fix the confirmed ones with the usual proof.

Expect a push of any new commit, even a ledger-only one, to re-run both PR
checks: to my knowledge GitHub evaluates a `pull_request` `paths-ignore` against the whole PR's
changed files rather than the push (not re-read in GitHub's docs). Re-read the PR's runs by head SHA, never by
branch:

```
gh api "repos/nychealth/EH-dataportal/actions/runs?head_sha=$(git rev-parse HEAD)" --jq '.workflow_runs[] | [.id, .name, .status, .conclusion] | @tsv'
gh run view <id> --log-failed
```

Re-baselining again (any later Hugo-input change): `node scripts/site-characterization-rebaseline.mjs`,
bare. It takes no positional arguments and refuses unknown ones (`parseArgs` / the `unknownArgs`
check in `main`), and re-captures **every** committed key (`prod_prod`, `staging`). Exit 1 is
normal for a run with no `--expect`; 2 means it could not run. Discard a run with
`git checkout -- scripts/site-characterization-baseline && git clean -fd scripts/site-characterization-baseline`.

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

## Task 4 record

- **Step 1** `npm run lint` exit 0 at `7e73a5176f`.
- **Step 2 FAILED against its baseline, and the merge is not the cause.** `node scripts/de-characterization.mjs`
  → exit 1, `markCount` only: 2023 trend 214→222; 2380 trend 245→255, trendComparison 130→140,
  links 17→43; 2414 unchanged. Base control: the pre-merge tip `0f62c097a6`, in a detached
  worktree with its own harness, baseline and `node_modules`, gave the same four diffs, and its
  three capture files are byte-identical to `HEAD`'s (`cmp`, all 3). Ignoring blank lines, the merge
  changed no new-explorer file on these pages (`git diff --ignore-blank-lines 0f62c097a6 HEAD` over
  the DE JS and templates → `data-index.html`, `indicator-catalog.html` only). The baseline dates
  from `03692a2293` (2026-07-23) and is older than today's staging data; re-baselining it is D7.
- **Step 3** `node scripts/smoke-pages.mjs` exit 0, "44 pages clean", Pagefind index served
  (spawned `dev_stage` server).
- **Step 4** `npm run docs-check` exit 0. The `CLAUDE.md` "Data explorer" section was stale beyond
  the one bullet recorded in Task 1, on both branches before the merge: "ten files" and the old
  load order. Rewritten from `data-explorer/single.html`'s `<script>` tag order (15 files) plus
  `de-tab-content.js` via its partial. docs-check failed on the first draft's non-root-relative
  paths, which doubles as its positive control.
- **Step 5** isolated `prod_prod` build at `5fef286ec9`: exit 0, 0 ERROR, 1249 EN pages, repo status
  unchanged.
- **Step 6** (Playwright, fresh context per page, `dev_stage` server via `ensureDevServer`):
  new explorer on three indicators × views is covered by Step 2's capture identity, not re-done.
  Old indicator page `data-explorer-old/asthma/?id=2380`: table 122 rows; `#groupByBoroughToggle`
  on → off → on gives borough group rows 10 → 0 → 10 and rows 122 → 112 → 122; no page errors.
  Old data index: 267 table rows. Old indicator catalog has no `<table>` on either branch — it is
  search-and-detail; picking a search result fills `#indName` and `#measureList` (0 → 2) on both
  catalogs, no page errors. (Typing "asthma" listed indicator 1 first on both, so the typed text
  may not have filtered; not investigated.) Skip link → `activeElement` `BODY` → `skip-header-target`
  on `data-explorer/asthma/?id=2380` and `data-stories/housing/`. D2: `economic-conditions/?id=103`,
  `violence/?id=2375`, `asthma/?id=18` (production content's most-linked old-format URLs) load the
  same id and the same indicator name in both explorers.
- **Step 7 check** `node scripts/characterize-env.mjs prod_prod` at `5fef286ec9`: 994 of 994 pages
  differ from the `prod_prod` baseline (`451b2df450`). Production's tip `ed63fa7603`, same harness
  (byte-identical scripts) and same EHDP-data commit `d3558441d1`, passes against that baseline —
  so every difference is this branch's. `HEAD` capture vs production capture, 924 shared pages:
  - **Search UI absent from 535 pages** (keywords 388, categories 60, es 43, zh 43, tags 1); present
    on all 925 of production's. Mechanism: `_default/list.html` is a standalone document (own
    DOCTYPE, no `define "main"`) that includes `footer.html` but not `baseof.html`. Production
    keeps Pagefind UI in `footer.html`; this branch moved it to `partials/search-modal.html`,
    included from `baseof.html` (`00fbf2f9fc`, 2026-05-09). Pre-existing on the branch, ships with
    this PR. → D5.
  - **Heading order** changed on 924 pages: 372 are pure reorders (same multiset — the modal's
    `<h5>` now precedes the footer's `<h2>`); 510 are the D5 pages losing that `<h5>`; 42 are DE.
  - **69 pages only on `HEAD`**: 44 `data-explorer-old/` (D1) and 25 extra keyword/category
    paginator pages, because the old-explorer content carries its own `categories`/`keywords`
    (copied at `18d94c510f`) and is listed on 42 of 78 category pages and 153 of 705 keyword pages
    in the build. Also the source of `links.internal` +1 on 214 pages. → D6. (Corrected: this line
    first said 55 and 290 — that `grep -rl` counted every file under those folders, RSS `index.xml`
    included, against a denominator of `index.html` pages.)
  - **42 DE topic pages**: the explorer swap, expected. Noted for the PR, not judged: per page,
    `controls.noAccessibleName` 1→7, `img.missingAlt` 0→1, `img.emptyAlt` 0→4, `overflowX`
    false→true, `landmarks.footer` 1→0, `tables.total` 2→0 (example `data-explorer/accessibility/`).
  - `search-results/` absent on `HEAD`: this branch deleted that page in `7e5d0d12b1`.
- **Step 7 re-check** at `19c3e93153` (after D5–D7), same comparison against production's capture.
  Enumerated 924 pages (829 sitemap + 94 paginator + 1) against production's 925; the one missing
  is `search-results/`. Remaining differences:
  - Pagefind UI on 924 of 924 pages; none lost.
  - `headingLevels` on 924 pages: 880 pure reorders (modal before footer, `00fbf2f9fc`), 42 DE, 2
    category paginator pages whose items changed (below).
  - The 42 DE pages, as before.
  - `links.internal` −6 on `key-topics/accessibility/` and `categories/accessibility/page/2/`, −1
    on the public-space pair: the new explorer's topic files carry fewer categories. Production's
    `dc6c58fa33` (2025-08-12, "revise metadata") gave six old-explorer topics `accessibility`
    (`active-design`, `falls-among-older-adults`, `health-care`, `housing-safety`,
    `transportation-related-injuries`, `walking-driving-and-cycling`); their new-explorer files
    lack it. → D8. (Corrected 2026-10-02: the public-space −1 is not D8. It is `waterways`, which
    production's `ca6248ac40` put in `publicspace`; found when the D8 fix left that −1 standing.)
  - `assets` +`css/nyc-basic-lib-v1.2.79.css` on `take-action/`, `take-action/email-electeds/`,
    `data-features/congestion-pricing-report/`: this branch's `d43e01ba93` (2026-01-21, "adding
    basic lib as self-hosted dep") loads a self-hosted copy beside the CDN one under `mapLib`.
  - The 44 old-explorer pages are no longer enumerated (D6 took them out of the sitemap), so
    `smoke:all` and this sweep no longer cover them; the curated smoke list still has 4.
- **Step 7 re-baseline**, first run at `dea87c6c5a`: `node scripts/site-characterization-rebaseline.mjs`,
  exit 2, output discarded. Expectations, written before it ran: `prod_prod` moves exactly as the
  Step 7 re-check lists; `staging` the same, with any other field possibly EHDP-data drift.
  - `prod_prod` re-captured: 924 pages, EHDP-data `production` @ `d3558441d1`, both sweeps agreed,
    no arbitration. Compared field by field against production's capture (`wt-prod`): exactly the
    Step 7 re-check's set. `headingLevels` 924 = 878 non-DE pure reorders + `data-explorer/data-index/`
    and `data-explorer/indicator-catalog/` (pure reorders under the DE prefix) + 42 DE topics + the 2
    D8 category paginators; `links.internal` 46 = 42 DE + the 4 D8 pages; `assets` 45 = 42 DE + the 3
    basic-lib pages; every other field DE-only; `search-results/` the one removed record. Not
    pre-registered: `headingJumps` on 841 (799 non-DE), which is derived from `headingLevels`.
    Control: the committed `prod_prod` baseline against the same production capture differs on 0
    fields.
  - `staging` NOT re-captured. On this branch `config/dev_stage/config.toml` and
    `config/local_stage/config.toml` pin `data_branch = "feature-new-data-explorer"` (`e99b20a197`,
    2026-04-30, "switching data branch"); `production` pins `"staging"`. The harness derives the key
    from the data branch, so the `dev_stage` sweep (924 pages, EHDP-data
    `feature-new-data-explorer` @ `95c8e589c3`, 2026-08-18) was written to a new key directory,
    `scripts/site-characterization-baseline/feature-new-data-explorer/`; the script's closing
    gitHead assertion then failed on `staging` (still `451b2df450`). → D9.
- **Step 7 re-baseline**, second run at `9dad6ab230` (after D9), same command, exit 1 (nothing
  claimed), committed as `ddc26c8327`. Both keys: 924 pages, both sweeps agreed, no arbitration.
  `prod_prod` read EHDP-data `production` @ `d3558441d1`; `staging` read EHDP-data `staging` @
  `3a26d038eb`, the same data commit as the replaced `staging` baseline, so no data drift to
  separate. Field-by-field, `prod_prod` against production's capture and `staging` against its
  previous baseline: both 21 changed fields, the same counts as the first run's `prod_prod`, only
  `headingLevels`, `headingJumps`, `links.internal` and `assets` changing outside `data-explorer/`,
  on the pages listed above. 0 CR bytes over 50 changed records.
- **Step 7 re-baseline**, third run at `dcf21609cf` (after D8 `853dabe569`, `keyTopic` `cc32f5f90e`,
  `waterways` `dcf21609cf`), committed as `79286c569c`. A run started at `853dabe569` was stopped
  early in its first sweep when the `keyTopic` edit was asked for (the isolated server watches the
  tree); no `node`/`hugo` process survived and its partial output was discarded. Same data
  commits as the second run, no arbitration. Reference: both keys' baselines at `9dad6ab230`, the
  `prod_prod` one being the baseline that differed from production's capture on 0 fields.
  Expected before the run, and observed in both keys: `links.internal` differs on no non-DE page
  (was 4), all 880 non-DE `headingLevels` changes are pure reorders (was 878 + 2), and outside
  `data-explorer/` only `headingLevels`, `headingJumps` and `assets` (the 3 basic-lib pages) still
  differ, plus `search-results/` removed. Against `ddc26c8327`, 14 records per key changed, plus
  `_meta.json`: the seven edited topics, both key-topic pages, `categories/accessibility/page/2/`,
  and `categories/publicspace/` with its pages 2–4.
- **Topic metadata sweep** 2026-10-02: `categories`, `keywords` and `keyTopic` of all 74
  `content/data-explorer/*.md` files, parsed (`ruamel.yaml`, duplicate keys allowed: this branch's
  `dummy.md` repeats `vega`, the only file of the 74 on either side that does), compared against `production`'s file at the same path: 0 differences at
  `dcf21609cf`. Control at `9dad6ab230`: 8 (the six D8 categories, `active-design`'s `keyTopic`,
  `waterways`).
- **Found, not fixed:** production's `dd16987cad` (double spaces) is absent from
  `content/data-explorer-old/` (forward patch applies cleanly), and `4a3185e056` (unicode) applies
  in neither direction there. Both are cosmetic text fixes on retired, now-unlisted pages.

## Task 5 record

- **Step 1** pushed by Chris, 2026-10-02: `origin/feature-new-data-explorer` = `1b5b509cc9`.
- **Step 2** a PR from this branch already existed: #1462 (Chris, 2026-08-14), base
  `merge/production` — already an ancestor of `production` — template body unfilled, no comments
  or reviews. Retargeted to `production` with a written body (`gh pr edit 1462 --base production
  --body-file …`) rather than opening a second PR. The retarget started **no** runs: `head_sha`
  query → 0 (control: the newest run in the repo, `6ea01a9d0a`, → 4). Both check workflows use
  default `pull_request` types, which do not include a base change. `gh pr close` + `gh pr reopen`
  fired them; the close also fired `hugo-build-to-prod-prod` (job skipped, `merged == false`) and
  CodeQL (skipped).
- **Step 4** runs on `1b5b509cc9`, both red:
  - Smoke `37005530131`: 1 of 924, `data-features/cooling-info/` "Cannot read properties of
    undefined (reading 'AQI')". **Not this PR:** the base-control job against `production`'s tip
    failed on the same page, and `content/data-features/cooling-info/cooling-info.js` is identical
    on both branches. An AirNow response (`project-airnow-guard-hotfix` memory has the guard).
  - Site characterization `37005530108`: 42 of 924 pages, one field, `structure.img.zeroSize` 2 → 3,
    exactly the 42 new-explorer topic pages. The baseline was captured locally (Windows) at
    `dcf21609cf`; CI (Linux) ran `1b5b509cc9`, which differs only in this ledger. `total`,
    `missingAlt` and `emptyAlt` match, so the same 7 images were counted and one more had a zero
    box on CI. Locally (isolated `prod_prod`, `scripts/.sc-rebaseline/img-probe.mjs`, untracked) the
    zero two are `nyc-bubble-logo.svg` and the alt-less header `.ico`; the other five render, the
    same at widths 1240/1265/1280/1300 and at `domcontentloaded` vs settled, and local headless
    Chromium reserves no scrollbar width (`innerWidth` = `clientWidth`). Not reproduced; no
    Docker/WSL distribution here. The base-control job cannot speak to it: it compares
    `production`'s build against this PR's baseline and differs on all 925 pages. → D10.
  - **D10 diagnosed in CI** (Chris's choice): scratch branch `diag-d10-zero-size-img` (`f170acb002`,
    from `25234562c8`) added an `imgBoxes` field outside `structure`/`content` recording every
    counted image's box, `complete`, natural size and nearest hiding ancestor; run
    `37014189736` (`workflow_dispatch`, `scope=sample`) failed as predicted, `data-explorer/asthma/`
    `zeroSize` 2 → 3, and its artifact names the image: `indicator-menu-icon.svg`, `complete: true`,
    natural `0x0` (a failed load; locally `42x30`). The tracked file is
    `static/images/Indicator-menu-icon.svg`; `themes/dohmh/layouts/partials/header-de.html` asked
    for lowercase — Windows serves it, Linux does not. Branch-only: `header-de.html` is not on
    `production`. Fixed in `4f9bcb2c1f` by matching the `src` to the file (a case-only file rename
    is the hazard project `CLAUDE.md` warns about). Proof: isolated `prod_prod` build exit 0, 0
    ERROR; all 42 pages referencing the icon name a file present with exact case in the output's
    `images/`. Sweep of 311 site-root `images|img|icons|css|js/…` references in `themes/`,
    `content/`, `data/` against tracked `static/`+`assets/` paths: 1 case-only mismatch, this
    one. Scratch branch deleted from `origin` and locally, worktree removed.
- **Step 4 re-run** after Chris pushed `5d5732de13` (PR head), runs queried by `head_sha`:
  site characterization `37016219934` **success**, as predicted; smoke `37016219744` failure, 1 of
  924, `data-features/cooling-info/` `AQI` again, and the base-control job against `production`'s
  tip failed on the same page. Cleared on sequential re-check, not counted: this run's
  `data-features/heat-report-archive/2021/` (`reading 'vis'`), the base run's
  `data-explorer/waterways/` (`reading 'array'`). PR body updated with these results, the D10 fix,
  and the size (532 commits, 2,135 files, 1,852 of them baselines).
- **D11, CARTO key** (Chris asked, 2026-10-02): the new explorer's three CARTO tile URLs
  (`assets/js/data-explorer/map.js`, `print-map.js`, `themes/dohmh/layouts/data-explorer/section.html`)
  had no `?key=`; every other CARTO URL in the repo does, and `production` has no unkeyed one.
  Production's `598fba0b19` (2026-09-03, "add newly required CARTO API key to maps") keyed every
  map that existed on `production`; the merge in Task 1 carried that commit but it touched no file
  the new explorer owns. Unkeyed, CARTO answers **200** `image/png`, 2,049 B: a tile reading "API KEY
  REQUIRED" (viewed). Keyed: the real tile (27,116 B; `@2x` 74,844 B). Fixed in `39946d0c39` by
  appending the key after the retina suffix. Proof: `scripts/.sc-rebaseline/tile-probe.mjs`
  (untracked) on an isolated `prod_prod` server, `data-explorer/` and
  `data-explorer/asthma/?id=2380`: 48 tiles, 0 unkeyed, 0 placeholder-sized, 0 non-200. Control
  with the fix stashed: 48 of 48 unkeyed and placeholder-sized, 0 non-200 — so neither smoke nor
  characterization (which excludes Leaflet tiles) could have caught it. `print-map.js` runs only on
  export; its line is the same string. `npm run lint` exit 0.
- **Propagation sweep** (Chris's go, 2026-10-02), after D11 made three cases of one shape (Task 2,
  D8, D11): `propagation.py` (scratchpad, untracked), three probes over the 188 non-merge
  `production` commits in `4a260ea2a1..production`, generated baselines and `documents/` skipped.
  - **Probe 1, sweeps** (same substring inserted/deleted in ≥ 3 files in one commit; a branch line
    holding the insertion's anchor but not the insertion, or still holding the deletion). Control
    `39946d0c39^`: flags `598fba0b19`'s CARTO key on exactly the 3 DE files. `HEAD`: only
    `7a995427a1` (section icons) remains — 24 lines with `fas fa-`, all button/sub-heading icons, none
    an `<h1>` icon (the sweep replaced only those); the DE `<h1>`s match D3.
  - **Probe 2, production additions since divergence absent from the branch's copy** (same path or
    the `data-explorer-old` copy). Control `0f62c097a6` (pre-merge tip): 1,110 lines. `HEAD`: 56
    lines in 12 commit/file pairs, all recorded decisions or equivalents (D3's no-markup templates,
    Task 1's tooling merge, `CLAUDE.md`'s 44-page count, `js-comment-spacing.py`'s rewrite,
    reordered attributes in `list.html`, whitespace in `package.json`), and the old copy's narrower
    Pagefind ignore (a branch design, see D12).
  - **Probe 3, lines at the divergence point that production still has and the branch removed**
    — the D8 shape, which predates divergence (`dc6c58fa33`, `ca6248ac40` are ancestors of
    `4a260ea2a1`), so Probes 1–2 cannot see it. Control `9dad6ab230`: flags the D8 category lines.
    `HEAD`: 3,143 lines in 48 files; ~2,900 are the new explorer replacing the old at the same paths,
    51 the search modal leaving `footer.html` (`00fbf2f9fc`); the rest are this branch's own commits
    (`9f50307a62` reformatting, Tier 4.6 library gating, `b152f67c31` alt text, …) or cosmetic topic
    text (double spaces, `*` vs `-` bullets).
  - **Found:** old-explorer pages are in site search (D12); `nyccas_pollutant_maps.html` has
    `pagefind-ignore="all"` without the `data-` prefix, so it does nothing (`327c71f1ee`, branch
    only); `header-de.html`'s "Related data on:" opens `<h4>` and closes `</h5>` (copied from
    `related-data.html`'s `<h5>`; my reading of HTML parsing, not re-checked against the spec, is
    that `</h5>` still closes it).
  - **D12 evidence:** built old-explorer pages carry `data-pagefind-body` like the other 457 indexed
    pages; `scripts/.sc-rebaseline/search-probe.mjs` (untracked: isolated `prod_prod` build,
    `npx pagefind`, Pagefind's own `search()` in the page) — "asthma" top 30: 9 old-explorer, 8
    new; "carbon monoxide" 2/4; "active design" 3/4; "waterways" 2/1, including the retired
    landing page.
  - **D12 and the markup slips fixed** (`da9546b798`, `f872cd99b1`). Same search probe after:
    0 old-explorer results for all four queries, each total down by exactly its old count
    (13→11, 55→46, 28→25, 6→4), new-explorer results unchanged. Built: 0 of 44 retired pages carry
    `data-pagefind-body`, 413 of the other 923 real pages do (413 + 44 = the earlier 457). The NYCCAS
    title is built with `data-pagefind-ignore="all"`. `node scripts/characterize-env.mjs prod_prod`
    against the committed baseline: exit 0, 924 pages, so neither change moved structure — the
    `</h4>` fix included, consistent with `</h5>` having closed that heading already. That sweep
    does not enumerate the 44 retired pages (D6); the search probe covered them.
  - The first local probe did not block Google Analytics, and fired 6 GA hits from localhost
    (shown `ERR_ABORTED`; delivery not established). The second blocked it.
- **Step 3 replacement: local review** (Chris's go, 2026-10-02). One Opus subagent against
  `c15317c74b`, prompt as planned in the next-action block; 506,518 subagent tokens, 108 tool
  calls, ~22 minutes. Report: `documents/de-pre-ship-review-2026-10-02.md` — 39 findings, 10
  reproduced in Chromium by the reviewer on an isolated `prod_prod` server. Its coverage finding
  bears on this plan's own proofs, and is stronger than the reviewer put it: CI's smoke and
  characterization sweeps read topic URLs from the sitemap, without `?id=`, and a topic page with
  no id opens the indicator chooser and renders no indicator (the "open chooser if URL has no valid
  indicator ID" guard in `topic-indicator-selector.js`; measured 2026-10-02 on asthma, air-quality,
  waterways, economic-conditions: no `IndicatorID`, 0 map paths, no pane). So CI runs none of the
  explorer's rendering. The reviewer's "about 5 of 267" is the local checks' union: the curated
  smoke list (2380, 26, 2427) and `de-characterization` (2380, 2414, 2023). [Corrected
  2026-10-02: first recorded here, in audit §21 and in the PR body as the CI sweeps' count.] Chris, 2026-10-02: **fix the wrong-data/breakage items and the
  accessibility items before the merge; the rest become tracked follow-ups**, and the report
  becomes a tracked doc. Per-finding outcomes in "Review findings" below.

## Review findings

Numbers are the report's. **Before merge** = Chris's scope, 2026-10-02. Each is verified (reproduce
or read the path end to end) before its fix; a finding that does not verify is recorded as
rejected with the reason. Comments the report names as false (#29–#32) are fixed with the code
finding they describe.

| # | Finding | Report's label | Scope | Outcome |
|---|---|---|---|---|
| 2 | Quick Boundary/Time/Measure changes leave a stale map layer (no render token in `map.js`) | runtime | Before merge | **FIXED** `3427ebb1aa` — render generation in `map.js`. Probe with UHF42 geometry delayed 3s (`held: 1`): UHF42→CD 101 → 59 paths, →Borough 64 → 5 |
| 4 | Superseded indicator load still writes `DE` state and 311 links (`loadData`/`joinData`); comment `app.js` "stale load stops" false (#29) | trace | Before merge | **FIXED** `3427ebb1aa` (with #29) — `isIndicatorLoadCurrent` checked after the awaits in `loadData`, `fetch_comparisons`, `createComparisonData`, `renderMeasures`, `setDefaultLinksMeasure`. Worse than reported: the stale join emptied the new indicator. Probe, first indicator's data delayed 4s (`held: 1`): asthma 2392→18 and air-quality 2028→2027, map/table/trend 0/0/0 → equal to a fresh load of the second; 311 links wrong → right on the air-quality pair (the asthma pair shares one 311 link, so no power there) |
| 3 | Correlate reuses cached data under a stale key (`setDefaultLinksMeasure` vs `renderSelectedCorrelate`) | runtime | Before merge | **FIXED** `5951fe6003` — `setDefaultLinksMeasure` writes the key with the rows; disparities drops the rows when it changes the primary. Probe: after 2414 + Back, labelled 31/47 vs rows 363/41 → 31/47 vs 31/47 |
| 5 | Measure with no views inside a mapped indicator → `geography/undefined`, empty map, 0.0% legend (103, 2176, 2383, 2384); comments #30 | runtime | Before merge | **FIXED** `5a69468396` (with #30) — `resolveMapMetadata`. dev_stage: `geography/undefined`, 0 paths, 0.0–0.0 legend → gray outline + "not mapped" popup, map metadata 870/1205. On prod_prod no outline: see D15 |
| 12 | UHF33 / National rows unselectable, null area name (`GEO_RANK_BY_PRETTY_TYPE`, `geoTypes`) | runtime (UHF33) | Before merge | **OPEN, needs data** (D16) — verified: production GeoLookup has no UHF33 or National rows; UHF33 GeoIDs include merged ids (`105106107`, `207208`, …), so names cannot come from the JS |
| 1 | Same-indicator back/forward changes URL/state, not the visible pane (popstate in `app.js`) | runtime | Before merge | **FIXED** `1808f80eeb` — `showOverlayTab` (moved out of `renderMeasures`) also called on same-indicator popstate. Probe: Back after Trends→Bar, pane bar → trends; Forward, no pane → trends |
| 6 | Enter on a disabled tab switches state, not the pane | runtime | Before merge | **FIXED** `1808f80eeb` — click listeners ignore `.disabled`; a disabled overlay resolves to `none`. Probe on 2378: Enter on Trends, state trend/pane bar → bar everywhere; `overlay=trend` URL, open empty container → `none` |
| 7 | Exported map PNG legend reversed (`print-map.js` vs `createColorScale`) | trace | Before merge | **FIXED** `62aabf727f` — `interpolateViridis(1 - stop)`. Canvas pixel under "min" rgb(68,3,86) → rgb(248,230,35); min fill rgb(253,231,37) |
| 10 | Trends with no data: Save/Download export the previous view (`trend.js` early return); comment #31 | trace | Before merge | **FIXED** `48ea45e333` (with #31) — guard clears `DE.print`. Probe: after an empty `renderTrendChart`, bar's spec + 9,446 B CSV → none |
| 16 | Disparities after "No correlates" leaves Save/Download disabled | runtime | Before merge | **FIXED** `114a3cd447` — `setCorrelateActionState(true)` after a disparities render. Probe: both buttons disabled → enabled |
| 8 | Citation uses build date and `?id=`-less permalink (`de-tab-content.html`); production used visitor date + full URL | read | Before merge | **FIXED** `32f411c0f7` — `refreshCitation` on every URL write, popstate and copy. Probe: bare topic URL → live URL through CD→UHF42→Back; date half has no power on build day (rests on `new Date()`) |
| 18 | Unguarded `localStorage` read in `head.html` | trace; trigger suspected | Before merge | **FIXED** `48c604e506` — try/catch. Simulated throwing `localStorage` getter (not a real browser setting): `debugLog` ReferenceError, 0 map paths → function, 59 paths |
| 23 | No accessible name: topic-selector button, mobile Learn More; logo `<img>` lost its alt (`header-de.html`) | read | Before merge | **FIXED** `7a51797eab` — axe 4.13 `button-name`/`image-alt` at 1400/390 px with the site header expanded (axe skips hidden content; without expanding, the logo was never tested): 3 violations → 0 |
| 24 | Mobile Measure/Boundary/Time collapse is a `div` toggle, not keyboard-operable (`de-indicator-info.html`) | read | Before merge | **FIXED** `66ca2b0113` — +/- is a real `<button>`; bar keeps tap-anywhere via a handler that skips buttons. Probe at 390 px: no keyboard path → Tab reaches the button and Enter opens; "Change dataset" opened modal + details → modal only |
| 25 | `.btn-light-green-bg-outline` `#008939` on `#EFFAF4` = 4.24:1 (the `0007cf874f` pairing) | computed | Before merge | **FIXED** `1b0ec226e0` — text `$primary-dark`. Computed ratio 4.24 → 5.13 (14px/400). axe `color-contrast` flagged neither state — it misses these buttons |
| 9, 11, 13–15, 17, 19, 21, 22, 26–28, 32–39 | UX, inherited (#11), latent (#17), suspected (#26), maintainability | — | Follow-up | Deferred, Chris 2026-10-02; recorded as `documents/site-wide-audit-2026-06-27.md` §21. #26 since confirmed by axe `nested-interactive` on `#map` (still deferred) |
| 20 | "Email your elected officials" is `href="#"` (`header-de.html` desktop, `de-tab-button.html` mobile) | read | Before merge (D13: Chris, 2026-10-02, **point it at `take-action/email-electeds/`**) | Verified: no modal, plain `<a href="#">` — no `data-toggle`, no id or class, and no JS in `assets/js/data-explorer/` targets it (`311.js` drives only `.destination311`). **FIXED** `8cf5f7abd3` — both links → `take-action/email-electeds/`. Isolated prod_prod build: 82 links (desktop + mobile on 41 topic pages), 0 `#`, target page built |
| — | DE pages hide the site header toggle: no site nav, home link or search | design question | **Rejected** (D14) | Chris, 2026-10-02: the header expands to give the nav. The cascade agrees: the toggle wrapper (`header-de.html`, the `aria-label="Toggle Main Header"` button's parent) carries both `hide` and `d-flex`; `.hide` is `display: none` (`__portal-custom.scss`) while Bootstrap's `.d-flex` is `display: flex !important`, so the toggle shows. The reviewer read `.hide` alone. Not browser-checked by me; Chris's account is the runtime observation |

## Decisions

| # | Decision | Who / when | Notes |
|---|---|---|---|
| D1 | `data-explorer-old` ships, and production's improvements to the old explorer carry onto it | Chris, 2026-10-01 | This is what creates Task 2. Audit §4.4 (retire the old trees) stays parked — consistent with D1 |
| D2 | The new explorer accepts the old explorer's URL format; the new format is built on it, with defaults filled in by the JS | Chris, 2026-10-01 | The author's statement, not independently checked. Task 4 Step 6 loads old-format links as a confirmation, not as a gate on the decision |
| D3 | Production's section-header (`7a995427a1`) and skip-link (`b8771726c9`) changes, written against the old explorer's templates, also go onto the new explorer's | Chris, 2026-10-01: **yes** | Applied in Task 1 to `indicator-catalog.html` and `data-index.html`; `section.html` and `single.html` have no markup for either change — see "Task 1 record" |
| D4 | Table default geographies: keep strict follow-the-map, no code change | Chris, 2026-10-01: **closed** | The Citywide + Borough context option is recorded and deferred in `documents/site-wide-audit-2026-06-27.md` §4c; the fresh audit's "Status at a glance" points there. History: Chris first asked to follow the old explorer's pattern unless that needed one-off conditionals. The audit's "Citywide + Borough" was one indicator's instance of the old rule, which is *every* available geography checked, most recent time only (`assets/js/data-explorer-old/measures.js`, the `tableTimes.forEach` and `dropdownTableGeoTypes.forEach` blocks). The new explorer's single-geography default is not a standalone default: the table *follows the map dropdowns* — the default in `renderMeasures`' "table defaults" block (`measures.js`), the re-sync on every geo/time dropdown change (`menu.js` → `syncTableFiltersToMapSelection`), the geo choice inside `getCurrentMapTableFilters` (`table.js`), the "Sync to map" button and the Synced/Custom summary (`table.js`). Adopting the old rule means redefining what "synced" means for geography, not adding a conditional. **Table-follows-the-map is an explicit team design choice (Chris, 2026-10-01)** — it is not up for removal, so the old rule as written is off the table. |
| D5 | Search on `list.html` pages (535 taxonomy pages lose the Pagefind UI) | Chris, 2026-10-01: **fix it** — `9ed813232d` | `_default/list.html` now includes `search-modal.html` before the footer, as `baseof.html` does. Proof: isolated `prod_prod` build, real pages (`data-pagefind-meta=`) without `pagefind/pagefind-ui.js` 535 → 0, none with two (control: the pre-fix build reproduces 535). Playwright on `dev_stage`: modal present, opens, one input, 5 results for "asthma", no page errors, on `categories/accessibility/`, `keywords/`, `es/categories/` and the `baseof` control `data-stories/housing/`. Curated smoke 44/44 clean. Whether `list.html` should become a `baseof` template is a bigger change, not needed for the fix |
| D6 | Should `data-explorer-old/` pages appear in category and keyword listings? | Chris, 2026-10-01: **unlist** — `625a2a0770` | A `cascade: build: list: never` in `content/data-explorer-old/_index.md`, leaving the 73 content files' `categories`/`keywords` untouched. Isolated `prod_prod` builds: category/keyword pages linking `data-explorer-old/` 42/78, 153/705 → 0/66, 0/692; Hugo paginator pages 113 → 88; all 45 `data-explorer-old/**/index.html` byte-identical before and after (control: `categories/airquality/` differs). `list: local` was tried first and left the listings unchanged. Side effect: the old pages leave the sitemap (44 → 0), so sitemap-enumerated sweeps skip them |
| D7 | Re-baseline `scripts/de-characterization-baseline/` against today's staging data | Chris, 2026-10-01: **yes** — `19c3e93153` | `--baseline` diff = exactly the four `markCount` values, nothing else; `--check` then exit 0; 0 CR bytes, as at `HEAD` |
| D8 | Six new-explorer topics lack the `accessibility` category that production's old-explorer copies carry (`dc6c58fa33`) | Chris, 2026-10-02: **carry over** — `853dabe569` | Also matched on Chris's word, as the same kind of gap: `active-design`'s `keyTopic: publicspace`, which `dc6c58fa33` removed (`cc32f5f90e`; nothing reads `keyTopic` on a DE topic), and `waterways` → `publicspace` from `ca6248ac40` (`dcf21609cf`). The topic metadata sweep in the Task 4 record finds no other difference. Re-baselined in `79286c569c` |
| D9 | This PR would change `dev_stage` and `local_stage` from EHDP-data `staging` to `feature-new-data-explorer` (`e99b20a197`) | Chris, 2026-10-01: **revert the two `data_branch` lines to `"staging"`** — `9dad6ab230` | `local_stage`'s `maxAge = 0` kept. `dev_stage` is what `build-to-dev-stage` deploys, so after the merge the team's staging site would read that branch. EHDP-data compare API, 2026-10-01: `feature-new-data-explorer` is 386 behind / 183 ahead of `staging`, 1 ahead / 39 behind `production`, last commit 2026-08-18. Recommendation: revert both lines to `"staging"` before the PR (`local_stage`'s `maxAge = -1 → 0` from `77499c3896` is a separate line, left to Chris). The `prod_prod` checks read EHDP-data `production`. A `dev_stage` server on this tree reads the feature data branch, so D7's "staging data" most likely means that branch; which server D7 ran against was not recorded. No check in this plan is recorded as reading EHDP-data `staging` |
| D12 | Retired-explorer pages appear in site search beside the new ones | Chris, 2026-10-02: **exclude** — `da9546b798` | D6 took them out of listings and the sitemap; search was not part of it. `baseof.html` omits `data-pagefind-body` when `excludeFromSearch` is set; `content/data-explorer-old/_index.md` sets it on itself and by cascade. Proof in "Task 5 record". The sweep's two markup slips were fixed on the same answer, `f872cd99b1` |
| D11 | The new explorer's basemaps lacked the CARTO key and rendered "API KEY REQUIRED" tiles | Fixed, `39946d0c39` | See "Task 5 record". Same shape as Task 2: an upstream sweep reaches only the files upstream has, so branch-only siblings miss it |
| D10 | CI site characterization: one more zero-size image on each of the 42 new-explorer pages on Linux than on Windows | Chris, 2026-10-02: **diagnose in CI** → fixed, `4f9bcb2c1f` | A filename-case bug, not a platform rendering difference: the topic-selector icon failed to load on Linux on all 42 topic pages. See "Task 5 record". Rejected: accepting a red check, and re-baselining from CI's capture (which would have recorded the broken icon as expected) |
| D15 | EHDP-data `production` has no `geography/citywide.topo.json` (404); `staging` has it (200, added `cea4e876c1` 2026-04-29). The new explorer's unmapped state (`renderUnmappedCitywide`) draws from it | **Open — Chris**; blocks the merge | Found verifying #5. 223 of 722 live measures (68 indicators) in production's `metadata.json` have no mappable Map geography and take the unmapped path; on prod_prod they draw nothing and no "not mapped" message (the known-good unmapped case, 73/138, fails the same way). `borough.topo.json` on production answers 200, so the URL pattern is right. Fix is in EHDP-data: promote the file to `production` before or with this merge |
| D16 | #12: UHF33 and National rows have no GeoLookup names | **Open — Chris** | Options: (a) add UHF33 + National rows to EHDP-data's `GeoLookup.json` and the two geotypes to `GEO_RANK_BY_PRETTY_TYPE` (`data-index.html` already orders UHF33 between NYCKIDS and UHF34); (b) defer both to audit §21. JS alone would make 33 nameless rows selectable. Affects 2017, 2019, 2020 (UHF33) and 2214, 2215 (National) |
| D17 | `scripts/de-characterization-baseline/` fails `--check` on data, not code | **Open — Chris** (D7 precedent); does not gate CI | On `dev_stage` (EHDP-data `staging` since D9; D7's capture predates D9): 2023's latest period 2024 → 2025 with its legend and row counts; 2380's correlate `markCount` 43 → 17. The 17 is not from this session's code: the same probe gives 42 rows of pair 1199/41 and 17 SVG marks at `66ca2b0113`, with #3's hunk reverted, and with every fix file at `c15317c74b`. Re-baseline with `node scripts/de-characterization.mjs --baseline` on Chris's yes |

## Environment

- Primary worktree holds `feature-new-data-explorer`. Two linked worktrees exist
  (`feature-MOD-Lab-NR-recode-refactor-merge`, `update-characterization-baselines-2026-09-21`);
  this plan touches neither.
- 2,744 untracked files in the primary worktree (`documents/NDHR/`, `scripts/.sc-check/`,
  `scripts/site-characterization-current/`, …). None collide with a path in `production`'s tree,
  so they cannot block the merge `[verified 2026-10-01: git cat-file -e production:<path> for every
  git ls-files --others --exclude-standard entry, 0 hits]`. Leave them alone.
- The detached `production` worktree used for Step 7 (`wt-prod`) was removed after the re-baseline.
  To recapture production for comparison: `git worktree add --detach <dir> production`, then
  `node scripts/characterize-env.mjs prod_prod` inside it (exit 0 at `ed63fa7603`).
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
  **Corrected 2026-10-02:** the grep matched every `pull_request:` line regardless of its branch
  filter. Read from each `on:` block: `smoke.yml` and `site-characterization.yml` run on an open PR
  into `production` (default types, so not on a base change); `hugo-build-to-prod-prod.yml` and
  `codeql.yml` only on `closed`, the former's job guarded by `merged == true`;
  `hugo-build-to-dev-stage.yml` filters on `build-to-dev-stage` and never fires here.
- [ ] **Step 3:** `/code-review ultra <PR#>` (global CLAUDE.md: the billed review is for the merge
  into the deploy branch).
  **Corrected 2026-10-02: cannot run on this PR.** Chris ran `/ultrareview 1462` → "PR #1462 is too
  large for ultrareview (2135 files, 75,015 lines)". The limits, read from the installed Claude Code
  2.1.236 (`gdi()`): 500 files / 8,000 changed lines by default, overridable server-side. Without
  the baselines the diff is still 280 files / 46,520 lines; `assets/js/data-explorer` alone is
  14,516. No argument excludes paths; prose instructions work only in branch mode and cannot be
  combined with a named base. Replaced by the local review below (Chris, 2026-10-02).
- [ ] **Step 4:** Confirm checks ran: query runs by the PR's head SHA, not branch name (memory
  `project-pr-checks-need-a-mergeable-pr`).

## Task 6: Post-deploy check

- [ ] After the `prod-prod` build publishes: fresh tab on the live `/data-explorer/` and
  `/data-explorer-old/`, the Step 6 old-format links again, and smoke against the live base URL.
  Then close this ledger with one line: done, date, commit range.
