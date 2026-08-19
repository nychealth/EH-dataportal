# Merging `production` / `merge/production` into the two feature branches

<!-- Deliberately does NOT declare a `docs-check source-roots` comment. This plan cites paths that
     exist on `merge/production` but not on this branch (themes/dohmh/layouts/nr-output/single.html,
     assets/js/uhflist.js) — that is the point of the document, and docs-check would fail it for
     naming them. Do not opt this file in. -->

**Goal:** Bring `merge/production` into `feature-MOD-Lab-NR-recode-refactor` and
`feature-new-data-explorer` without losing either branch's work, and without shipping the two
silent breakages this analysis found.

**Approach:** `merge/production` strictly contains `production`, so the choice is not *whether* to
absorb it but *when*. NR goes straight to `merge/production` (its `production`-only merge is nine
docs-and-config files with no code in it, and doing both means resolving eight of them twice). DE
takes `production` first — its `production` merge has twelve real code conflicts worth landing and
testing before the `head.html` gating refactor arrives on top of them.

**The findings that drive the plan.** Findings 1 and 2 are merge hazards — both merge *clean*, git
flags neither. Findings 3 and 4 are different in kind: they are already true of `merge/production`
today, so they ship whether or not these merges ever happen. Stage 0 fixes those two on
`merge/production` first, so Stages A and C inherit the fixes rather than each re-deriving them on
a different tree.

**Finding 3 was resolved in EHDP-data on 2026-08-17 — for two of the three data branches this plan
touches.** Read its entry below before running any build: which `data_branch` an environment points
at now determines whether that build succeeds, and `dev_stage` is still pointed at one that fails.

1. `merge/production` deletes `head.html`'s blanket library block. The NR branch's four
   `neighborhood-reports/` templates reference no `lib-*` partial, and three of the four don't
   exist on `merge/production`, so they merge with no conflict and load no Leaflet, no Vega and no
   Arquero `[verified 2026-08-16: grep -c 'partial "lib-' returns 0 for all four NR templates on
   the NR branch; git ls-tree of merge/production's neighborhood-reports/ lists only section.html
   and topiclanding.html]`.
2. The NR branch's `head.html` *generates* the `neighborhoods` global from
   `data/globals/uhflist.json` at build time. That generator sits inside the block
   `merge/production` deletes, and `assets/js/uhflist.js` — which `lib-uhflist.html` loads instead
   — does not exist on the NR branch. `demographics.js` guards with
   `typeof neighborhoods === 'undefined'`, so losing it blanks the demographics sidebar silently
   rather than erroring `[verified 2026-08-16: git ls-tree -r on the NR branch returns only
   data/globals/uhflist.json; merge/production's lib-uhflist.html reads resources.Get "js/uhflist.js"]`.
3. ~~**`merge/production` does not build.**~~ **Resolved 2026-08-17 — every environment this plan
   uses now builds.** `nr-output/single.html:419` aborts the
   render with `index of type map[string]interface {} with args [0 zip_code]`. `6fb89c0ffb`
   sentence-cased `report_topic` across `data/globals/NR_content/*.yml`, and that value is a path
   segment of the per-topic JSON URL built at `single.html:391`; when the EHDP-data branch being
   read publishes Title Case names, five `resources.GetRemote` calls miss, `$topic_data` stays the
   empty `dict` it was initialised as, and line 419 indexes a map with an int key.

   Chris landed a Linux-side data export on 2026-08-17 that carried the case-only renames through
   (a Windows-side export would not have — git treats a case-only rename as a no-op on a
   case-insensitive filesystem). All 26 sentence-cased filenames now exist on EHDP-data
   `production` and `staging`. `hotfix-geo-names` did not get the export and still carries only the
   26 Title Case names, so it remains a branch that cannot be built against — but
   `config/dev_stage/config.toml:3`, which used to pin it, was re-pointed at `staging` the same
   day. Task 0.1, all steps closed except the optional hardening in Step 2.
4. **The congestion pricing report loads none of the libraries it uses.**
   `data-features/congestion-pricing-report.html` has never carried a `lib-*` include — on
   `production` the blanket block supplied Leaflet, easyButton, Vega and D3 to it. Two maps and a
   Vega chart are dead on `merge/production`, and the page is absent from the smoke list, so
   nothing reports it. Task 0.2, **done 2026-08-17**.
5. **`topiclanding.html` is missing `lib-uhflist.html`, and smoke has been failing on it.** Found
   2026-08-17 by the first smoke run after Task 0.2 added its page. The template includes
   `lib-leaflet.html` and calls `partial "nr-leaflet"`, whose line 302 reads the `neighborhoods`
   global; nothing on the page defines it. `ReferenceError: neighborhoods is not defined` fires
   twice — once at page scope, once inside `loadList` — so the neighborhood list never populates.
   This is Finding 4's mechanism on a page that *is* in `PAGES`, which means `npm run smoke` was
   already red on `merge/production` before this plan's Stage 0 began. Task 0.3, **parked
   2026-08-17 by decision — the FAIL is expected and recorded, not fixed.**
6. **`topiclanding.html` carries a copy of `nr-show-zips.html`'s neighborhood-list loop without
   the markup that loop writes into — and on `feature-new-data-explorer` that is what fails, not
   Finding 5.** Found 2026-08-18 by B2 Step 3. `themes/dohmh/layouts/partials/nr-show-zips.html`
   both emits `<ul id="neighborhoodList">` (line 13) and `<ul id="neighborhoodList2">` (line 7)
   **and** holds its own copy of the `neighborhoods.forEach` loop that appends to them (lines
   19–20). `topiclanding.html` has a duplicate of that loop at lines 239–240 but never includes
   the partial, so both `getElementById` calls return `null` and the first `appendChild`
   throws `TypeError: Cannot read properties of null (reading 'appendChild')`. Net effect is the
   same as Finding 5 — the neighborhood list never populates — but the signature is different and
   it fires **once**, not twice `[verified 2026-08-18: id="neighborhoodList" occurs twice in the
   tree, both in nr-show-zips.html, and zero times in the rendered page; the thrown frame is the
   page's own inline script, and the same probe returns id="results" from themes/ so it is not a
   pattern that cannot match]`.

   **This is pre-existing on `feature-new-data-explorer`, not a Stage B symptom.** Both
   implicated templates are byte-identical to the branch's pre-merge `HEAD`, and the page was
   rendered from a detached worktree at `59c5d459b8` and produced a console-error set identical
   to the merged tree's, entry for entry `[verified 2026-08-18: staged blob == HEAD blob for
   topiclanding.html (c9bb61fca343) and nr-show-zips.html (c04fdc6e8512); two servers, ports 1313
   (merged) and 1314 (pre-merge control), same 5 errors on each, differing only in the port inside
   the URLs]`. **Not fixed, and no task is opened for it here** — it is outside this plan's scope,
   which is the merges. It is recorded because it is what B2 Step 3's baseline FAIL actually is.

   **It also changes what Stage C should expect.** Finding 5's `neighborhoods is not defined`
   does **not** occur on this branch — `neighborhoods` resolves, so execution reaches one step
   further and dies on the missing `<ul>`. Finding 5's error was masking this one. So restoring
   the `neighborhoods` global does not make this page pass; it moves the error. Do not read a
   surviving FAIL on this page after C2 as evidence the gating work failed.

Findings 3, 4, 5 and 6 share one mechanism worth naming, because it is the same one Finding 1 describes:
two branches changed complementary halves of an invariant without ever touching a common file, so
the merge was clean and no check owned the result. Nothing in this repo enforces "every page loads
the libraries it calls" or "every `report_topic` resolves to a file that exists."

---

## Ledger

**Status as of 2026-08-18: Stage 0 closed, Stage A merged and committed at `67b76b49ea`, Stage B
merged, verified and committed at `eda7c256c5`, and C1 and C2 both complete and committed at
`3210c5ee87` — 19 conflicts all resolved, one real gating defect found and fixed, the tree
builds.** **C3 closed 2026-08-19 with its Step 5 browser check, so every task in this plan is now
done.** Two decisions were taken on 2026-08-18 and both are recorded below: the four DE JS files
took the DE side, and the `dev_stage` pins stay put. ~~which means **C3 cannot use `npm run
smoke`'s own server spawn** and needs a `development` server with `DE_BASE_URL`~~ — **that
prediction was wrong and is retired**: `dev_stage` went green on the DE branch, and C3 Step 3 ran
`npm run smoke` bare against it, 35 of 35. The
Stage B merge commit has parents `59c5d459b8` (DE tip) and `c0931fbee6` (`production`'s tip),
and `production` is now an ancestor of `feature-new-data-explorer`
`[verified 2026-08-18: git merge-base --is-ancestor exits 0; both worktrees report a clean status]`.
B2's five checks all passed against it, one with a recorded baseline FAIL that is proven
pre-existing (Finding 6). Task 0.1 Step 2 (optional hardening) remains not started, and
Task 0.3 stays parked — narrowed 2026-08-18, since the DE branch fails that page for a different
reason than Finding 5. `rerere.enabled=true` is set (shared repo config, applies in every
worktree), and every merge in this plan is run with it disabled per-invocation.**

| Stage | Task | Status |
|---|---|---|
| 0 | 0.1 NR report-topic rename — build blocker | **Steps 1, 3, 4 DONE 2026-08-17; Step 5 DONE 2026-08-18** — the EHDP-data `feature-new-data-explorer` branch was recreated off `production`, re-exported from Linux against the site repo's `production` YAML, and force-pushed; `dev_stage` builds on the DE branch as a result. Step 2 re-scoped to optional hardening, not started |
| 0 | 0.2 CP report library includes | **DONE 2026-08-17** — all 3 steps; browser probe matches the `production` control (L/vegaEmbed/d3 defined, 2 maps drawn, 6 Vega views), page passes smoke |
| 0 | 0.3 `topiclanding.html` missing `lib-uhflist` (Finding 5) | **UNPARKED AND FIXED 2026-08-18, and committed with C1 at `3210c5ee87`** — one include added at `topiclanding.html:19`, proved by before/after built HTML; see "C2 progress". Fixed on the DE branch's merge, **not** on `merge/production`, which still carries the defect. History below. **PARKED 2026-08-17 by decision** — not fixed; the page is deleted by A2, so the one `npm run smoke` FAIL is expected. **Unparks if** Stage A is abandoned or `topiclanding.html` survives into production. **Stage A outcome 2026-08-17:** smoke is 33/33 on the merged NR branch, because A2 deleted the template — the expected FAIL is gone *there*. `merge/production` still carries it and still fails, so this **unparks for Stage C**, which merges `merge/production` into the DE branch. **Narrowed 2026-08-18 by B2 Step 3:** the DE branch fails on that same page for a *different* reason (Finding 6 — a missing `<ul>`, not a missing global), and Finding 5's error was masking it. So Stage C inherits **two** defects on one page, and fixing the `neighborhoods` global clears only one of them |
| A | A1 shared-infra conflicts | **DONE 2026-08-17** — all five steps, ten files staged (nine listed + this document, the unlisted 23rd conflict). Leaves A7 Step 9 a writing job, not a re-read: no `lib-*` prose exists in either `CLAUDE.md` |
| A | A2 retired-file modify/deletes | **DONE 2026-08-17** — nine `git rm`'d, all nine already absent at `HEAD` (the delete declines incoming files, it removes no NR work); `Crotona - Tremont` = 2 in `data/globals/uhflist.json`, old spelling 0 |
| A | A3 `head.html` — uhflist generator + gating | **DONE 2026-08-17** — generator relocated into a rewritten `lib-uhflist.html`; the NR `debugLog` block survives (a wholesale `--theirs` would have dropped it, 55 call sites); 4 stale `uhflist.js` comments fixed, not the 1 the step named |
| A | A4 `lib-*` includes for the four NR templates | **DONE 2026-08-17** — counts 2/4/2/2 as predicted, but **both placement instructions were wrong**: includes belong in `main`, not `js_bot` |
| A | A5 SCSS: `theme.scss`, `_custom.scss` | **DONE 2026-08-17** — Step 3's predicted collision was real: `.worse/.better::before` defined twice, one per side; `merge/production`'s copy removed |
| A | A6 duplicate comparison implementation — decision | **DONE 2026-08-17** — no decision needed, both partials orphaned once A2 removed their callers; `git rm -f` |
| A | A7 NR verification sweep | **DONE 2026-08-17** — 9/9 steps pass; pagefind re-baselined (diff verified item-by-item), `CLAUDE.md` prose rewritten and re-stamped |
| B | B1 DE ← `production` | **DONE — committed 2026-08-18 at `eda7c256c5`.** 23 conflicts, 0 rerere replays, 272 files staged (271 from the merge plus this document), 0 unmerged, 0 unstaged. Steps 1–6 done. **Step 3's stated expectation was wrong** — following it as written would have dropped three of `production`'s SCSS blocks silently; see the finding below |
| B | B2 DE verification sweep | **DONE 2026-08-18** — all five steps run, Step 4 struck. Unblocked by `npm install` (exit 0, merge untouched: 272 staged / 0 unstaged / 0 untracked after). Installed versions match B1's regenerated lock — playwright 1.62.1, eslint 10.7.0, hugo-extended 0.147.9 — which confirms the `devDependencies` decision took effect. **Step 1:** 16 files linted, 0 errors; **the control written into this plan was wrong and is corrected below.** **Step 2:** isolated `production` build exit 0, 0 ERROR, 1330 EN pages, `resources/` untouched. **Step 3:** 33 ok / 1 FAIL of 34 — the FAIL is **pre-existing, proven against a pre-merge control worktree**, and is Finding 6, not Finding 5. **Step 3 could not use `scripts/dev-server.mjs`'s own spawn** — see the `data_branch` table. **Step 5:** map, table and trend all render and all re-render on a CD→UHF42 switch. **B2 has no docs-check step and that is a real gap** — running it 2026-08-18 showed B1's `CLAUDE.md` resolution dropped the branch's `docs-check` header, so that file is now silently unchecked. Recorded, not fixed; it is an action for the Stage B commit |
| C | C1 DE ← `merge/production` | **DONE 2026-08-18 — all conflicts resolved and committed at `3210c5ee87`** (parents `eda7c256c5` + `4a260ea2a1`; 64 staged at commit time, not 63 — the extra path is this document, refreshed from `6757bcd8aa` so the merge carries the Stage C records). 19 conflicts (not 36 — see the Stage C header), 0 rerere replays, 63 staged while the merge was live, 0 unmerged, 0 unstaged, 0 untracked, no markers anywhere. Steps 1 and 2 done. **Step 3 does not fire** — the file does not conflict, and Chris decided to keep both DE pins and fix EHDP-data instead, which was expected to leave `dev_stage` red for C3 — it did not; it went green 2026-08-18 with the pin unchanged, see Task C3. The four `assets/js/data-explorer/` files took the DE side per Chris's `renderer: "svg"` decision (option 1), leaving an SVG rollout as separate work. Proof: isolated `production` build exit 0 / 1326 EN pages / 0 ERROR, `npm run lint` exit 0 over 16 files, `docs-check` 2 docs exit 0 |
| C | C2 DE gating reconciliation | **DONE 2026-08-18, committed with C1 at `3210c5ee87`.** Step 1 passes with a validated probe — zero library hits in `head.html` (211 lines). **Step 2 was answered against the built site, not the template counts** — the step's own prescribed proof, and the correction is recorded below: a template-level count is blind to relative-`src` and `resources.Get` loading. 1438 pages swept, **zero ordering violations** (probe validated by a synthetic control), 3 missing-library findings, all **pre-existing** and all one defect — `data-explorer-old`'s three templates call `de-topic-indicators` without `lib-arquero`; left unfixed by choice. Found and fixed one real defect: `topiclanding.html` missing `lib-uhflist.html` (Task 0.3 / Finding 5), proven by a pre/post build diff of 8→3 findings. Two probe defects corrected mid-sweep (82 false positives from a bundle-name pattern; 1 from `aq.` matching prose). **Finding 6 is also cleared** — by the merge itself, not by a fix — so **C3's smoke prediction is 35 of 35** — not 34, and not Stage B's 33; the merge added a `PAGES` entry, see C3 Step 6 |
| C | C3 DE verification sweep | **DONE — Steps 1, 2, 3 and 6 on 2026-08-18, Step 5 on 2026-08-19; Step 4 struck.** **Step 5: map, table and trend all render and all are rebuilt on a CD→UHF42 switch** — map 59→42 shapes, table 66→49 rows, both matching B2 exactly; the trend canvas *element* is replaced while its pixels are unchanged, because the trends view aggregates to Borough by design (`trend.js:206`), proven by a validated hash probe, an element-identity probe with a negative control, and a Vega warning ledger of 18 = 6 renders × 3. Console held exactly 4 errors throughout, all pagefind. **Two method findings: B2's painted-pixel metric is dead here** (it equals w×h at every reading), **and the table reads stale while its pane is hidden.** Step 1: 16 files, 0 errors, 0 warnings. **Step 2: exit 0, 0 ERROR, 1326 EN pages**, run beside a live server as a deliberate test of the isolation claim — `resources/_gen` came through byte-identical and the server was unharmed. **Step 3: 35 of 35, exit 0** — the corrected count, run bare against a reused `dev_stage` server, and the page carrying Findings 5 and 6 passed. Step 6 **found a coverage gap** — 5 of the 8 `data-features` templates this merge changed have no `PAGES` entry. Also recorded there: **`dev_stage` went green on the DE branch**, which retires four warnings elsewhere in this document |

**Stage A merged and committed 2026-08-17 at `67b76b49ea`**, parents `fb5b89df64` (NR tip) and `c59d614716` (`merge/production`). Stage B is next.

**`production` moved between this plan being written and Stage B starting, and two of the plan's
recorded hashes are now stale.** The plan was written against `production` at `f2d04146b1`; the tip
is `c0931fbee6`, ten commits later, because PR #1461 merged `feature-improve-NR-styles`
`[verified 2026-08-17: git log --oneline f2d04146b1..production returns 10 commits]`. Consequences,
all confirmed rather than assumed:

- **`merge/production` still strictly contains `production`**, so the plan's central premise holds
  `[verified 2026-08-17: git merge-base --is-ancestor c0931fbee6 merge/production exits 0]`.
- **Stage B's conflict count is 23, not 22.** The one addition is
  `themes/dohmh/layouts/partials/nr-indicator-new.html`, which the new `production` commits
  rewrote `[verified 2026-08-17: git merge-tree --write-tree --name-only production
  feature-new-data-explorer lists 23 paths — the 22 in B1's file list plus that one]`. Its
  resolution is B1 Step 5 below.
- **B1's "Leaves for: C1" hash is stale.** C1's merge-base becomes `c0931fbee6`, not `f2d04146b1`.
- **None of the seven commits in Step 1 changed**, and no eighth joined them: the ten new commits
  touch no path in Step 1's pathspec `[verified 2026-08-17: Step 1's command re-run against the
  current tip returns the same seven hashes in the same order]`.

**The DE branch carries a stale copy of this document and the Stage B merge will not update it.**
`production` does not have the file at all, so it merges clean and the DE branch keeps its
2026-08-15 original — 863 lines against this copy's 1793, 971 insertions behind
`[verified 2026-08-17: git diff --stat between the two blobs]`. A session opening the plan in the
DE worktree would read a ledger with no Stage A or Stage B status in it. **B1 Step 6 copies this
file across as part of the merge** so the branch carries a current ledger.

### Resuming after Stage B in a fresh session — read this first

**Stage B is done and committed at `eda7c256c5`** (parents `59c5d459b8` and `c0931fbee6`),
with the plan record committed just before it on `merge/production` at `4a260ea2a1`.
`node_modules` exists in that worktree, so the B2 checks are re-runnable as written.

**The rr-cache gained nothing from Stage B, so Stage C inherits no replays from it.** It still
holds 7 postimages against 21 preimages, the same counts recorded on 2026-08-17, because the merge
ran with `rerere` disabled for the invocation and so wrote no preimage to resolve
`[verified 2026-08-18: find .git/rr-cache after the merge commit]`. Keep using the
`-c rerere.enabled=false` form for C1 — the cache's older recordings are still capable of
answering a conflict on your behalf, and the `package.json` one is still wrong.

The state to expect in that worktree before Stage C starts — no merge in flight, nothing staged:

```
cd ../EH-dataportal.worktrees/feature-new-data-explorer
git log -1 --format='%H %P'          # eda7c256c5… with parents 59c5d459b8… c0931fbee6…
git status --short                   # expect no output
git rev-parse MERGE_HEAD             # expect "fatal: ambiguous argument 'MERGE_HEAD'"
```

`[verified 2026-08-18: all three, plus git merge-base --is-ancestor production
feature-new-data-explorer exits 0]`. The pre-commit reading this block used to record — `HEAD`
`59c5d459b8` with `MERGE_HEAD` `c0931fbee6` and 272 files staged — is now history, not a
checkable expectation.

**The next action is Stage C (Task C1).** Its gate is cleared: C1's merge-base is
`production`'s tip, which is now true of this branch.

### What B1 resolved, and the proof for each

Grouped by how the decision was reached rather than by file order. All 23 conflicts are covered.

**Take the DE side — eight files whose `production` side is entirely superseded commits.**
`app.js`, `data.js`, `global.js`, `table.js`, and `data-explorer/`'s `single.html`,
`data-index.html`, `indicator-catalog.html`, `section.html`. Each was first mapped to the
`production` commits touching it, and every one of those appears in Step 1's superseded list
`[verified 2026-08-18: git log --no-merges merge-base..production -- <path>, run per file; then
each staged blob compared by hash against the branch's own HEAD blob — 8 of 8 identical]`.

**Port `production`'s side — the unicode normalisation.** `carbon-monoxide-poisoning.md`,
`childhood-lead-exposure.md`, `heat-report-correction.html`: both sides changed all three, so
neither wholesale take was right. Took the DE side's formatting and re-applied `4a3185e056`'s
transform (U+00A0, U+2002, U+200A, U+202F become a space; U+200B is dropped). The character set
was derived from the commit and then validated against it — base 8/5/1, `production` 0/0/0 — before
being applied `[verified 2026-08-18: after the port, all 53 present files that 4a3185e056 touched
hold zero of those characters in the merged tree; the 12 absent ones are transient run outputs
deleted on production too. The same probe against the merge-base tree returns 327, so it is not
reporting zero because it cannot fire]`.

**Union — `data-stories/single.html`, the one functional port.** Kept the DE branch's per-page
`vega`/`d3` gate *and* added `production`'s `lazy-tab-embeds.js` script tag. Also kept the DE
side's `<article>` **without** `id="skip-header-target"`: `23a89dd34f` removed that duplicate from
44 templates deliberately, and `baseof.html:33` carries the canonical one. Both halves of the
lazy-embed feature are present — the `.js` arrived clean as an add-on-one-side, and the content
opt-in attributes survived the auto-merge `[verified 2026-08-18: the data-lazy-src and
data-lazy-embed-src count is 25 in the merged tree and 25 on production, matching per file across
all eight content files]`.

**`nr-indicator-new.html` takes `production`'s side** (Step 5). The staged blob equals
`production`'s blob by hash, and the step's own expected-after check passes: zero occurrences of
`boroJudgement` or `cityJudgement`.

**Shared infrastructure — nine files.**

- `package.json`: scripts unioned to five (`lint`, `characterize`, `characterize:cp`, `smoke`,
  `docs-check`), each one's target file confirmed to exist. **`devDependencies` differs from A1's
  case and was decided the other way, deliberately.** A1 found `playwright ^1.62.0` sitting in a
  dead duplicate JSON key that had never taken effect; here `production` has exactly one
  `devDependencies` block and `^1.62.0` is its live value `[verified 2026-08-18: a count of the
  devDependencies key in production's blob returns 1]`, so taking `^1.61.1` would have reverted a
  real bump. Result: one block holding `eslint ^10.7.0`, `globals ^17.7.0`, `playwright ^1.62.0`.
  `hugo-extended` likewise takes `production`'s newer `^0.147.3` over `^0.146.3`.
- `package-lock.json`: regenerated rather than hand-merged. `npm install --package-lock-only`
  exit 0; the lock's root block now matches `package.json` exactly and resolves playwright 1.62.1,
  eslint 10.7.0, hugo-extended 0.147.9.
- `.gitignore`: unioned and swept — 55 patterns from the DE side, 50 from `production`, 57 in the
  result, **zero missing from either side and zero present in neither**.
- `.claude/settings.json`: `production`'s copy. The two are semantically identical apart from
  `greptile`, and `production` carries `4bd2bc4f8d "turn off greptile"` on its side of the
  merge-base while the DE branch does not `[verified 2026-08-18: git merge-base --is-ancestor —
  ancestor of production, not of the DE branch]`. A `-S'greptile'` pickaxe does **not** find that
  commit, because `-S` counts occurrences and `true` to `false` leaves the count unchanged; `-G`
  is the form that works. Proof of no loss: zero `allow` entries and zero `ask` entries from the DE
  side are absent from the result, and `greptile` is the only `enabledPlugins` key that differs.
  Staging it needs `git add -f`, since `.claude/` is itself an ignore entry.
- `scripts/dev-server.mjs`: the same shape as A1's finding. The DE copy plus `production`'s two
  substantive contributions — its comment that `dev_stage` means *staging* data, and its 90s spawn
  timeout against the DE copy's 60s. Kept the DE copy's `--logLevel debug`, its probe order, and
  its `d5fb2ea700` citation (confirmed a real commit). `node --check` clean.
- `scripts/smoke-pages.mjs`: `production`'s copy is the far more developed one (32 pages against
  16, and better-scoped noise entries), so it is the base. **Removed `search-results/`** — the
  Tier 4.8 Pagefind audit deleted that page on this branch, so its entry would 404
  `[verified 2026-08-18: present on production, absent from the merged index; the other 13
  production page paths were each checked individually, one test per path, and all resolve]`.
  **Added back the three DE-only pages**: `birth-defects/?id=26` and `waterways/?id=2427` (the two
  unmapped-measure branches, audit §4.12) and `data-explorer-old/asthma/?id=2380`. Net **34 pages
  and 4 `KNOWN_NOISE` entries**, `node --check` clean. The DE branch's housing-Datawrapper and
  `rats`/`area.contains` exemptions were **not** carried over, for A1's reason: `production` runs
  both pages in its own `PAGES` and passes with no exemption, and the housing bug is the one
  `a0ce013172` fixed. **If B2 Step 3 fails on one of those pages, re-add that one entry only.**
- `documents/site-wide-audit-2026-06-27.md`: `production`'s copy. It is a strict heading superset
  (zero headings unique to the DE side, 16 unique to `production`) and three weeks newer
  (`f35497fbb4`, 2026-08-12, "with applicability checked", against `6f57780b7c`, 2026-07-25).
  Checked claim by claim rather than section by section: the 12 content lines unique to the DE copy
  all sit inside §5a, §5c and §11, sections `production` revised, and the DE branch's one
  substantive edit — §4a's `#skip-header-target` struck through as fixed — **is present in
  `production`'s copy too**, so nothing died.
- `documents/js-conventions.md`: the DE copy, on the same evidence A1 used, re-derived here. The
  only substantive divergence is the step-comment marker, and the code settles it: **183
  five-dash markers across 14 files in `assets/js/data-explorer/`, against 5 three-dash markers in
  2 files under `assets/js/congestion-pricing-report/`** `[verified 2026-08-18: the three-dash
  probe returns 1 against a control string, so the 5 is a real count and not a dead pattern]`. My
  first count of this was wrong — it matched the spaced separator rule, a different marker level.
- `CLAUDE.md`: `production`'s restructured copy as the base — the two files are nearly disjoint,
  and `production`'s is the newer organisation. Folded in a new **"The other three checks"**
  section covering `lint`, `de-characterization.mjs --check` and `docs-check`, which `production`'s
  copy has no equivalent for. **Corrected a claim this merge falsifies:** `production`'s text calls
  smoke "the only automated check in the repo", which stops being true the moment the DE branch's
  three scripts arrive. Also moved the smoke page count from 32 to 34.
  **Incomplete — found 2026-08-18, see "The docs-check stamp did not survive the merge" below.**
  Taking `production`'s copy as the base silently dropped the DE side's three `docs-check`
  header lines, which `production` has no equivalent of.

### Task B1 Step 3 was wrong, and that is the finding of this stage

Step 3 says to `git rm assets/scss/_custom.scss` and then "confirm production's 2-line change to
`_custom.scss` landed in its new home". **Both halves are wrong now, and following the step as
written would have shipped a silent regression.**

`production`'s change to `_custom.scss` is no longer two lines. Since the merge-base it has taken
three commits: `4dcbe069ec` (the `.comp-good` / `.comp-bad` / `.comp-null` tertile markers plus
`$comp-bad-text`), `1ffd7a06a6` (`.btn-light-green-bg` moved onto `$primary-dark` for a WCAG AA
contrast fix) and `06b06efdef` (`.overlay-topics` background image switched to a PNG).

**None of the three reached the merged tree.** The DE branch split `_custom.scss` into
`__portal-custom.scss` **and** `_de-custom.scss`; git's rename detection followed only the first,
so the auto-merge put 9 unrelated lines into `__portal-custom.scss` and dropped everything that
belonged in `_de-custom.scss` — which is where all three of these rules live on this branch.

The consequence is Finding 1's mechanism again on a new pair. `production`'s
`nr-tertile-inline-label.html` arrives clean as an add-on-one-side and **emits the `comp-good`,
`comp-bad` and `comp-null` class names**; Step 5 takes `production`'s `nr-indicator-new.html`,
which is the template that calls it. Deleting `_custom.scss` without porting would leave every NR
report rendering those classes **with no rule of any kind behind them** — no weight, no colour, no
glyph — which is precisely the WCAG 1.4.1 non-colour cue that `4dcbe069ec` exists to provide.
Nothing would have reported it: the build succeeds, and no smoke assertion covers CSS.

**Fix applied:** all three blocks ported verbatim into `_de-custom.scss` at the positions matching
`production`'s file, plus the one stale cross-reference each in `theme.scss` and
`nr-output/single.html` repointed from `_custom.scss` to `_de-custom.scss`.

`[verified 2026-08-18: a sweep of every distinct non-blank SCSS line production added since the
merge-base, compared against the merged tree's SCSS, returned 26 missing before the port and 0
after — a probe whose own 26 is the positive control. The line-level form of that sweep produced
one false negative: "color: $primary-dark;" matched under .btn-report, a different selector. Each
block was therefore re-checked selector-scoped: .btn-light-green-bg now reads $primary-dark, 9
.comp-* rule lines exist, and .overlay-topics points at the PNG]`.

**Carry this into Stage C.** C1 merges `merge/production`, which contains all three of these
commits, into this same branch. The `_custom.scss` modify/delete will present again there, and
`merge/production` may have moved the rules further. Re-run the same line-level sweep rather than
assuming Stage B settled it, and re-check selector-scoped, since the line form is demonstrably
capable of a false negative on this exact file.

### Task B2 Step 4 is struck — the script does not exist on this lineage

B2 Step 4 says to run `node scripts/pagefind-characterization.mjs --check`. **That file exists only
on `feature-MOD-Lab-NR-recode-refactor`.** It is absent from `production`, from
`feature-new-data-explorer`, and from `merge/production`, so no merge in this plan brings it to the
DE branch `[verified 2026-08-18: git cat-file -e against all four branches, plus a git ls-tree of
scripts/ on each listing every .mjs it has]`.

The Global-constraints build table also lists that command under "A7 Step 6, B2 Step 4". The A7
half was correct; the **B2 half of that row is wrong**. There is no pagefind check to run at Stage
B, and none at Stage C either. Do not substitute another check silently — if pagefind coverage is
wanted on this branch, that is new work rather than a step of this plan.

### What B2 actually verified, and the three corrections it forced

**Step 1 — lint.** `npm run lint` exits 0 over **16 files**, zero errors. The file count is part
of the proof: a bare exit 0 does not distinguish a clean pass from a run that matched no files
`[verified 2026-08-18: npx eslint assets/js/data-explorer -f json, 16 result objects, every one
errorCount=0]`.

**Correction — Step 1's positive control, as this plan wrote it, cannot fire.** The instruction was
to call a name declared in another `assets/js/data-explorer/` file and confirm `no-undef`
fires. By design it will not: `eslint.config.mjs` scans that directory's top-level declarations
at config-load time and injects them as shared globals, precisely so cross-file calls are not false
positives. The tree already contains that experiment — `bar.js` calls `prettifyGeoType`,
declared in `global.js`, and lint is green. So a cross-file call proves **the directory scan
loaded**, which is what A7 Step 1's wording ("confirm lint still passes") asks for and is the
correct control for that property. **To prove `no-undef` is live you need a name declared
nowhere** — not in a DE file, not in `EXTERNAL_GLOBALS`, not a browser global
`[verified 2026-08-18: appending zzzUndeclaredControlName() to bar.js produced exactly one error,
"'zzzUndeclaredControlName' is not defined  no-undef", exit 1; file restored from a byte-compared
copy and lint re-run to 0]`.

**Step 2 — isolated build.** Exit 0, **0 ERROR lines, 1 WARN** (`dev environment: production`,
which Hugo emits for the environment name and is not a defect), **1330 EN / 91 ES / 91 ZH pages**,
172 images processed. Isolation held: `resources/` held 0 files before and 0 after, with the 174
generated files landing in the `HUGO_RESOURCEDIR` temp directory instead
`[verified 2026-08-18: HUGO_RESOURCEDIR=<tmp> npx hugo --environment production -d <tmp>]`.

**Correction — Step 3 cannot use `scripts/dev-server.mjs`'s own spawn on this branch.** That
script always spawns `--environment dev_stage`, and `dev_stage` on `feature-new-data-explorer`
pins EHDP-data `feature-new-data-explorer`, which never received the 2026-08-17 sentence-case
export. The build aborts, the server never answers, and because the spawn uses `stdio: "ignore"`
the only symptom is `Spawned hugo server did not answer … within 90s`. Full detail and the
signature are in the `data_branch` table under Global constraints. **The substitute, stated
rather than made silently:** serve the branch under `development` (`data_branch = production`,
prefix `/dev-prod/`) and point the harness at it with `DE_BASE_URL`, which is the documented
escape hatch in `CLAUDE.md` and which `dev-server.mjs` honours as its Path 1 with a no-op
`stop`. This reads **production** data rather than staging — acceptable here because the harness
asserts on console errors, not content, and Stage B is the merge *of* `production`.

**Step 3 — smoke.** **33 ok, 1 FAIL of 34, exit 1.** This is now this branch's recorded baseline;
Stage A's expectation does not transfer and was never claimed to. The one FAIL is
`neighborhood-reports/active_design_physical_activity_and_health/`, one line,
`Cannot read properties of null (reading 'appendChild')` — **Finding 6, not Finding 5**, and
**proven pre-existing rather than a merge symptom** (see Finding 6 for the control). Two pages
whose DE-side `KNOWN_NOISE` exemptions B1 deliberately dropped, `data-stories/housing/` and
`data-features/rats-in-your-neighborhood/`, both **pass with no exemption**, so B1's call held and
the "re-add that one entry only" fallback was not needed.

**Step 4 — struck.** See the section above.

**Step 5 — browser check.** Passes, at a 1440×900 viewport. On
`data-explorer/asthma/?id=2380`: map draws (1 Leaflet container, 14 tiles), table renders 66 rows
× 8 columns, trend renders a Vega **canvas** (not SVG) of 657×804 with 262,800 non-transparent
pixels. Switching geography **CD → UHF42** through `#geoOptionsDropdownButton` re-renders all
three — URL updates to `GeoType=UHF42`, map redraws to 45 shapes, table drops to **49 rows**, and
the trend canvas repaints (425×469, 170,000 painted pixels). The changing row count is the part
that matters: it distinguishes a re-render from a stale view. Console holds only the four
allowlisted pagefind entries throughout, plus three Vega **warnings** (field-parse and axis-property
conflicts) which are spec-quality issues, not errors, and which smoke does not read. Note the geo
control is inside `#detailsContent.collapse.d-md-none` below the `md` breakpoint, so at
Playwright's default 1280-or-narrower window it is genuinely not clickable — resize before
concluding the control is broken. `npm run characterize:de` remains non-functional on this branch
(and is named `characterize` in the merged `package.json`, not `characterize:de`) — do not
read its failure as a regression signal.

### The docs-check stamp did not survive the merge

**B1's `CLAUDE.md` hand-merge dropped all three `docs-check` header lines**, because it took
`production`'s copy as the base and `production` carries none of them. The DE branch's pre-merge
copy opened with:

```
<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts scripts -->
<!-- docs-check verified: 52d5252e1a 2026-07-27 -->
<!-- docs-check ignore: fixedHeader -->
```

**The cost is not a failing check — it is a check that stops running and says nothing.**
`scripts/docs-check.mjs` gathers every `.md` in `documents/` plus `ROOT_DOCS`, which is
exactly `["CLAUDE.md"]` (line 34), but `readDirectives` returns `null` for any file without a
`source-roots` comment and the loop `continue`s past it. So the merged `CLAUDE.md` is skipped,
not checked-and-passing `[verified 2026-08-18: node scripts/docs-check.mjs on the merged tree —
exit 0, "1 doc(s) checked"; the one is documents/data-explorer-architecture.md, the only file of
the 20 candidates carrying a source-roots header]`.

**That also makes one sentence of the merged file false about itself.** Its own
"The other three checks" section says docs-check "scans the root docs listed in its `ROOT_DOCS`,
**this file among them**, so a path or identifier written here must be real and repo-root-relative."
As the file stands nothing enforces that.

**Restoring the header costs nothing — the merged text already passes.** With `source-roots` and
a `verified` line prepended, the run checks 2 docs and reports no stale paths or identifiers
`[verified 2026-08-18: exit 0, "2 doc(s) checked"; the file was then restored byte-identical and
the staged count re-confirmed at 272]`. The probe is not vacuous: appending one bogus backticked
path to `CLAUDE.md` produced `path does not exist:` against that file and exit 1.

Three things follow, and they constrain **how** it is restored:

- **The two lines must land together.** `source-roots` alone turns the check red — provenance is
  a required field, so the run fails with "missing `<!-- docs-check verified: … -->` line"
  `[verified 2026-08-18: exit 1]`.
- **Do not carry `docs-check ignore: fixedHeader` forward.** It was there to excuse a name the DE
  copy cited; `production`'s restructured text does not cite it. The merged file mentions
  `fixedHeader` **zero** times against the pre-merge copy's **two**, so re-adding the line would
  suppress nothing that exists.
- **The stamp cannot be written until the Stage B merge is a commit**, since a provenance line
  naming a commit that does not exist is worse than none. This is the same constraint C1's header
  already states for Stage C, arriving one stage earlier than that note anticipated.

**APPLIED 2026-08-18 at Chris's request.** The two lines are restored at the top of the staged
`CLAUDE.md`, stamped with **both merge parents** rather than a merge commit that does not exist —
the alternative this document's C1 header already sanctions, and accurate for a working tree that
is exactly that merge:

```
<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts scripts -->
<!-- docs-check verified: 59c5d459b8+c0931fbee6 2026-08-18 -->
```

`[verified 2026-08-18: node scripts/docs-check.mjs — "2 doc(s) checked", no stale paths or
identifiers, exit 0; the diff against the pre-stamp copy is 2 insertions and 0 deletions; staged
count unchanged at 272 with 0 unstaged]`. The `ignore: fixedHeader` line was **not** restored,
for the reason above. **The merge commit now exists (`eda7c256c5`)**, so the two-parent stamp may be
collapsed to that hash whenever the file is next touched. Nothing requires it — `docs-check`
validates the field's presence, not its format — and the two-parent form names the same tree, so
leaving it is also correct.

### What C1 resolved, and the proof for each

Merge started 2026-08-18 with `git -c rerere.enabled=false merge --no-commit --no-ff
merge/production` in the DE worktree: **19 conflicts, 0 rerere replays, exit 1 as expected.**
15 are resolved and staged; the four DE JS files are held for a decision (below).

- **Three `nr-*` partials → `merge/production`'s side** (`git checkout --theirs`), per Step 1.
  Each is byte-identical to `merge/production`'s blob afterwards
  `[verified 2026-08-18: git hash-object against git rev-parse merge/production:<path>, with a
  negative control — section.html reports "differs" through the same helper]`. This is not
  cosmetic: `nr-show-zips.html`'s incoming side carries the `{{ .urlSuffix }}` parameter and the
  `li.cloneNode(true)` fix for `appendChild` moving the node out of the first list, neither of
  which the DE side has. **Both callers pass the parameter**
  `[verified 2026-08-18: neighborhood-reports/section.html:93 passes "/" and topiclanding.html:36
  passes .Params.urlExtension; those are the only two invocations in the tree]`.
- **Five `data-features` templates → hand-merged, Step 2 done.** Four of the five were pure
  formatting: both branches did the same refactor independently and arrived at *identical*
  include sets, differing only in the `.html` suffix and line order
  `[verified 2026-08-18: include sets compared across production / merge/production / HEAD —
  production has none, the other two match on fvi, rats-in-your-neighborhood, realtime, rmz]`.
  Kept the `.html` form, which is the repo convention `[verified 2026-08-18: 75 suffixed against
  0 bare outside the conflicts]`, and kept `lib-leaflet.html` ahead of
  `lib-easybutton-coloricon.html` in all four, since the plugin needs Leaflet first.
- **`minimum-wage-with-maps.html` → `merge/production`'s side, dropping the DE-side
  `lib-topojson.html`.** The only genuine set difference of the five, and the include is dead:
  the page has no direct `topojson.` call, its only external script is a Datawrapper embed, and
  `lib-topojson.html`'s own header says Vega specs using `format: {type: "topojson"}` do not need
  it because vega-loader bundles topojson-client `[verified 2026-08-18: grep for `topojson.` in
  the template returns only the include line and three Vega `format:` strings]`.
- **Step 2's duplicate sweep passes over all 27 `data-features` templates, with a positive
  control** `[verified 2026-08-18: zero DUPLICATE lines; a planted second `lib-d3.html` include
  in a scratch copy makes the probe fire]`. **Correct the pattern in Step 2 above:
  `lib-[a-z-]*` cannot match a digit, so it reports `lib-d3` as `lib-d`.** It still *detects* a
  d3 duplicate — no name in the repo collides on that prefix — but the label it prints is wrong,
  so use `lib-[a-z0-9-]*`.
- **`data-explorer/section.html` → the DE side.** The incoming block is the pre-rewrite topic
  content (banner image, `de-topic-indicators`, "Find Datasets by Topic" accordion) that the DE
  rewrite replaced with a JS map shell, and it carries a second `lib-arquero.html` include —
  taking it would have produced exactly the duplicate Step 2's sweep exists to catch. The
  resolved file is byte-identical to the DE blob `[verified 2026-08-18: hash-object against
  HEAD:<path>; arquero include count is 1]`.
- **`data-explorer/data-index.html` → `merge/production`'s side.** The whole conflict is
  `id="skip-header-target"` on the `<article>`. It is site-wide a11y work the DE branch predates
  `[verified 2026-08-18: 49 templates carry the id on merge/production against 10 on the DE
  branch, and the DE copy of this file has none]`.
- **`.gitignore` → `merge/production`'s side** (a second copy of the characterization comment,
  annotating `scripts/de-characterization-current/` as well as the `documents/` one); the file
  is now identical to `merge/production`'s. **`.claude/settings.json` → union**, taking the
  incoming `"defaultMode": "default"` and keeping the DE branch's own permission entries; it
  parses `[verified 2026-08-18: node JSON.parse, valid]`.
- **`package.json` → union: `axe-core ^4.13.0` kept, `playwright` at the DE branch's `^1.62.0`.**
  `axe-core` arrived on `merge/production` in commit `52fde98740` and **has no consumer anywhere
  in the tree** `[verified 2026-08-18: the only git-grep hits for "axe" outside package-lock.json
  are JPEG/PNG bytes; there is no a11y script in either side's scripts block]`. Kept anyway,
  because deleting an incoming dependency is a cleanup decision that belongs on
  `merge/production`, not something a merge resolution should do silently. The scripts block did
  not conflict and the DE branch's five scripts win cleanly — `merge/production`'s block is
  byte-identical to `production`'s two-entry one, so there was nothing to lose there.
- **`package-lock.json` → regenerated, not hand-merged**, per B1 Step 2's form: `git checkout
  --ours` then `npm install --package-lock-only` `[verified 2026-08-18: exit 0; root devDeps now
  match the resolved package.json, axe-core resolves to 4.13.0 and playwright stays at 1.62.1,
  which is the version B2 recorded as installed]`.
- **`CLAUDE.md` → hand-merged as a union, and this time nothing was lost.** One hunk: the DE side
  contributes its whole "The other three checks" section (lint / characterization / docs-check),
  `merge/production` contributes the heading rename from "Two ways a local check silently lies"
  to "Three ways", which is the correct one because the third bullet arrived unconflicted. Kept
  both. **The `docs-check` header survived this time** — it is a clean add relative to the base,
  since neither `production` nor `merge/production` carries those two lines. Re-stamped
  `verified:` to name this merge's two parents, `eda7c256c5+4a260ea2a1`, which also collapses the
  stale Stage B stamp. `[verified 2026-08-18: node scripts/docs-check.mjs — "2 doc(s) checked",
  exit 0; and a sorted-line diff against `merge/production`'s copy shows only two lines absent,
  both superseded in place by DE-side edits — the smoke page count 32→34, and the
  `smoke-pages.mjs` sentence with "the only automated check in the repo" removed, which is
  correct on a branch that has four]`.

- **The four DE JS files → the DE side**, per Chris's decision of 2026-08-18 (option 1 below).
  Each is byte-identical to the DE blob and differs from `merge/production`'s, and no
  `renderer: "svg"` leaked in `[verified 2026-08-18: hash-object against both HEAD:<path> and
  merge/production:<path> for all four; the only `renderer` hits left in map.js and trend.js are
  four prose comments]`.

**C1 is fully resolved: 0 unmerged, 63 staged, 0 unstaged, 0 untracked, and no conflict markers
in any tracked file** `[verified 2026-08-18: git grep -E '^(<{7}|={7}|>{7})( |$)' returns nothing
outside documents/, and the same pattern against a three-line scratch file matches 3, so the
probe fires]`.

**The merge builds.** Isolated `production` build in the DE worktree: **exit 0, 1326 EN pages,
zero ERROR lines** (one `WARN dev environment: production`, which is Hugo's own environment
note) `[verified 2026-08-18: HUGO_RESOURCEDIR=<scratch> npx hugo --environment production -d
<scratch>, 32.7s]`. **This run also supplies the concurrency proof the isolated-build note in
`CLAUDE.md` says it never took**: a `hugo serve` process was live throughout, and all 174 files
under the worktree's `resources/_gen` are unchanged in path, size and mtime across the build,
with `docs/` clean `[verified 2026-08-18: find -printf '%p %s %T@' snapshots before and after
diff to zero lines]`.

**One number I cannot attribute, carried into C3 rather than explained away.** B2 recorded 1330
EN pages for the same build on the Stage B tree; this is 1326. Three `.html` files under
`content/` are deleted by this merge, but they do not account for it cleanly — only
`healthy-homes-info/source/index.html` is a page in Hugo's sense; the two
`*_differences_leaflet.html` files are non-index resources inside a leaf bundle. No staged
frontmatter change touches page visibility `[verified 2026-08-18: the staged content/ diff has
no ±line matching draft|headless|_build|expiryDate|publishDate|aliases|url:]`. **I did not
re-derive B2's 1330 against the pre-merge tree, and this build fetches EHDP-data at build time,
so the count can move without any change in this repo.** C3's build should be diffed against
this one page-for-page rather than compared by count.

**The three deletions are inherited, not introduced here, and one of them is worth a look.** All
three come from `df7f0fbb6e` on `merge/production` (2026-08-13, non-merge), whose subject is
"Normalize taxonomy keyword casing to lowercase" — the deletions are 262 of its 272 deleted
lines and are not mentioned in the message. The two `*_differences_leaflet.html` files have
`static/data-stories/air-quality-and-covid-part-2/` counterparts on `merge/production`, so those
are the documented page-bundle-to-`static/` move; `healthy-homes-info/source/index.html` has no
counterpart `[verified 2026-08-18: git ls-tree of static/ on merge/production]`.

### C2 progress — Step 1 passes, Step 2 swept, and Task 0.3 is now fixed

**Step 1 passes.** No library block remains in `head.html` (211 lines)
`[verified 2026-08-18: grep -inE 'leaflet|vega|arquero|d3|datatables|uhflist' returns nothing,
and the same pattern against data-features/realtime.html matches 5, so the probe fires]`.

**Step 2 is done, but not by reading the template sweep's 31 zero rows — that sweep cannot answer
the question, and this is the correction to make to the step.** A template-level count is blind
to how most of these pages actually load their JS: `data-features/proximity.html` pulls
`proximity.js` by relative `src`, `heatstory.html` pulls the Leaflet-ecosystem bundles
(`leaflet-pip`, `georaster-layer-for-leaflet`, `geoblaze`) through `resources.Get` rather than a
`lib-*` partial, and the three `take-action` templates load d3 from a CDN. Judged by include
count all four look like gaps or dead includes, and none of them is either.

**So Step 2 was answered against the built site instead, which is the proof the step's own last
paragraph prescribes** — and it answers a stronger question than "does the count look right":
*does any page use a library global that the page never loads, or load it after the code that
calls into it?* The sweep reads each built page's inline script **and** every same-origin `.js`
it loads, so a consumer living in an external file still counts. Files copied verbatim from
`static/` are excluded — no template renders them, so C2's question does not apply; that is 28
files. **A template that renders no page needs no separate check: there is no page to break.**

**Result on the C1 tree: 1438 pages swept, 366 of them using at least one gated library, zero
ordering violations, and three missing-library findings — all three pre-existing.**

- **Zero pages load a library after first calling into it.** That is the placement check A4 got
  wrong in Stage A, answered for every page at once rather than for the 29 templates.
- **Both halves of the probe are validated on the final configuration.** For "missing": it
  reports three real findings. For "ordering", which is a null result: appending an arquero
  `<script>` to the end of a copy of a page that uses `aq.from` at line 494 makes it fire —
  `script@1432 after use@494` — and the missing-finding for that page correctly disappears at
  the same time `[verified 2026-08-18: single-page control directory]`.
- **The uhflist fix is proven by before/after on real data.** The pre-fix build reports 8
  missing-library findings, five of them `uhflist` on the neighborhood-report topic pages; the
  post-fix build reports 3, and the delta is exactly those five pages.

**Two probe defects were found and corrected mid-sweep, both worth knowing because they are the
shapes that manufacture confident wrong answers:**

- **Script-name patterns of the form `/vega[.-]…js/` cannot match this repo's concatenated
  bundles**, which are named `vegaBundle.<hash>.js` and `dataTableBundle.<hash>.js` — the
  character after the library name is a capital letter, not punctuation. That single miss
  produced **82 false "missing library" findings** across the 41 `data-explorer-old` pages before
  the patterns were widened to match the name anywhere in the filename.
- **`\baq\.` matches prose.** A `quant-aq.com` link in body copy on
  `data-features/realtime-air-quality/` read as an arquero call and produced the sweep's only
  ordering finding, at line 844, against a script at 1295. Requiring a real arquero API name
  (`aq.from`, `aq.escape`, `aq.op`, …) retires it. **That finding was spurious; there is no
  ordering defect on that page.**

**The three surviving findings are one defect on three pages, and it predates this merge.**
`data-explorer-old/`'s `data-index.html`, `section.html` and `indicator-catalog.html` all call
`partial "de-topic-indicators.html"`, which emits `aq.from(topic_indicators)` at its line 75, and
**none of the three includes `lib-arquero.html`** — while all three of their `data-explorer/`
counterparts do `[verified 2026-08-18: grep -c 'lib-arquero' across the six templates returns
1,1,1 for the new set and 0,0,0 for the old]`. The three pages are published and reach
`aq.from` with `aq` undefined. **C1 did not cause it and does not touch it**
`[verified 2026-08-18: git diff --cached --name-only over themes/dohmh/layouts/data-explorer-old/
and partials/de-topic-indicators.html is empty]`, and it is identical in the pre-fix and post-fix
builds. **Left unfixed deliberately** — the one-line fix is obvious and mirrors the new
templates, but whether `data-explorer-old` should publish at all is a larger question than this
merge, and fixing it is wasted work if the answer is that it should not.

**Separately, `CLAUDE.md`'s "nothing loads from a CDN" is false for template-rendered pages.**
The claim sits under "JS architecture" and describes the bundling pipeline, but four
template-rendered pages load third-party script off-site: `take-action/index.html` and
`take-action/email-electeds/index.html` (d3 from `d3js.org`, plus `cdnjs.cloudflare.com` and
`cdn.rawgit.com` on the second), `data-features/rats-in-your-neighborhood/index.html`
(`cdnjs.cloudflare.com`, `cdn.rawgit.com`) and `data-stories/cold/index.html`
(`code.jquery.com`) `[verified 2026-08-18: every off-site <script src> host across the 1438-page
build, classified against the list of files copied from static/]`. The remaining off-site loads
are all in `static/` passthrough files. Out of scope here; recorded because a doc claim that
reads as a guarantee is what the next gating decision will be made against.

**Task 0.3 / Finding 5 is fixed — one line, and it unparked exactly where this document said it
would.** `neighborhood-reports/topiclanding.html` included `lib-leaflet.html` and nothing else,
while consuming the `neighborhoods` global that `lib-uhflist.html` defines. The working sibling
settles both the diagnosis and the placement: `neighborhood-reports/section.html:86-93` includes
`lib-leaflet.html` **and** `lib-uhflist.html` before calling the same two partials, `nr-leaflet`
and `nr-show-zips`, and both of those consume the global
`[verified 2026-08-18: nr-leaflet.html:308 `neighborhoods.find(`, nr-show-zips.html:23
`neighborhoods.forEach(`]`. Added the include beside `lib-leaflet.html` at line 19, in `main`,
per A4's ordering rule.

**Proved from the built HTML with a before/after control, which is the proof Step 2 prescribes.**
In the post-fix build the `uhflist.js` `<script>` is at line 482 of
`neighborhood-reports/active_design_physical_activity_and_health/index.html` and its three
consumers are at 791, 861 and 1109 — all after it. In the pre-fix build of the same merged tree,
that page contains **zero** occurrences of `uhflist`, which is Finding 5's cause stated as an
observation `[verified 2026-08-18: two isolated production builds into separate temp
directories, both exit 0 / 1326 EN pages / 0 ERROR]`. **Runtime confirmation is C3's** — the
build proves the script is emitted and ordered, not that the console is clean.

**Finding 6 is fixed by this merge, as a side effect rather than by intent — and the ledger row
above describes it too loosely to see that.** The row calls it "a missing `<ul>`", which sends
you to `nr-show-zips.html`, where both `<ul>` elements are present on both sides and always were.
The accurate description is the one in the Stage B commit message: **`topiclanding.html` carried
its own second copy of the neighborhood-list loop, without the markup that `nr-show-zips` emits**,
so `getElementById` returned null and `appendChild` threw.

That duplicate existed only on the DE branch, at `topiclanding.html:239-246` of the pre-merge
copy. `merge/production` has no copy of the loop at all — it delegates to the partial, which
emits the markup and the loop together — and `topiclanding.html` auto-merged toward that
structure, so the merged template contains no `neighborhoodList` reference of its own
`[verified 2026-08-18: grep for neighborhoodList and appendChild across all three versions of the
template returns lines 239-246 on the DE branch's copy and nothing on either `merge/production`'s
or the merged one; in the built post-C1 page the only two `appendChild` calls, at 864 and 867,
target ids defined at 845 and 851, ahead of the script at 858]`.

**So C3 has a real prediction to test, not an expectation to carry forward: smoke should now be
35 of 35** — 35, not 34, because the merge also added a `PAGES` entry; see Task C3 Step 6. **Both
defects on
`neighborhood-reports/active_design_physical_activity_and_health/` are addressed — Finding 5 by
the `lib-uhflist.html` include added above, Finding 6 by this merge. The recorded baseline of
"33 ok, 1 FAIL" belongs to Stage B and does **not** transfer. A surviving FAIL on that page means
one of these two conclusions is wrong and should be re-derived from the console output rather
than explained.

### The `renderer: "svg"` decision — the four DE JS files

**The plan calls these "one line each", and that is true of the incoming change but not of the
conflict.** What `merge/production` contributes over the base is exactly one line per file —
`renderer: "svg"`, added to a `vegaEmbed` options object by commit `52fde98740`, "Render Vega
charts as SVG with responsive sizing" (2026-08-11) `[verified 2026-08-18: git diff production
merge/production -- assets/js/data-explorer/ is 5 files, 5 insertions, all identical]`. But the
DE branch rewrote all four files, so the conflict hunks are whole superseded implementations and
**the options object the incoming line targets no longer exists**: DE's `disparities.js` and
`trend.js` pass `actions: false` with the old block commented out, and DE's `map.js` has no
`vegaEmbed` call at all — that page is Leaflet now.

**Taking the DE side is not neutral, because the other half of `52fde98740` lands anyway.** That
commit also edited `assets/scss/__portal-custom.scss`, which auto-merged into this merge with no
conflict: `.vega-embed` loses `height: 500px` for `height: auto`, and a new
`.vega-embed > svg { display: block; max-width: 100% }` rule arrives `[verified 2026-08-18: git
diff --cached -- assets/scss/__portal-custom.scss, 6 insertions 1 deletion]`. A canvas-rendered
chart does not match that `> svg` selector. So the DE side alone leaves the commit half-applied
on this branch.

The options, and what each costs:

1. **Take the DE side, treat the SVG rollout as separate work.** Mechanically the correct merge —
   the merge does not invent a behavior change. The new explorer keeps Vega's default canvas
   renderer, which is what it was built and browser-verified against. Cost: `52fde98740`'s
   renderer decision does not reach the explorer, and the branch carries its SCSS half only.
2. **Carry `renderer: "svg"` onto the three DE call sites that correspond** —
   `disparities.js:340`, `trend.js:661`, `print.js:150` (`map.js` has no counterpart). Keeps the
   commit whole for the files it named. Cost: the new explorer's other two Vega charts,
   `bar.js:532` and `correlate.js:570`, stay canvas, so the branch is internally inconsistent.
3. **Carry it onto all five DE Vega call sites**, matching `52fde98740`'s stated scope of "all
   Vega embed call sites". Cost: the largest untested surface — five charts change renderer on a
   branch whose print/export path (`print.js`, `print-map.js`) was developed against canvas.

**2 and 3 both need a browser check before C3 signs anything off**, not just a clean build:
renderer choice is a runtime property. **Recommendation: option 1**, with the SVG rollout raised
as its own task so it gets the browser pass it needs rather than riding in on a merge resolution.

**Decided 2026-08-18 by Chris: option 1.** The four files took the DE side. **This leaves open
work that is not part of this plan:** the new explorer's five Vega call sites
(`disparities.js:340`, `trend.js:661`, `print.js:150`, `bar.js:532`, `correlate.js:570`) still
use Vega's default canvas renderer while the branch now carries `52fde98740`'s SCSS half, whose
`.vega-embed > svg` rule matches nothing under canvas. Applying `renderer: "svg"` across those
five is its own task with its own browser pass — **not** something a later merge should pick up
by accident.

**One inherited defect, not caused by this merge and not fixed here.** `52fde98740` removed the
fixed height but left the comment above `#cpVis2.vega-embed` explaining that "the fixed height
above acts as a cap", and left the `#cpVis2` override that the comment justifies. Both are stale
on `merge/production` itself `[verified 2026-08-18: the comment and the override are present in
merge/production:assets/scss/__portal-custom.scss with height: auto above them]`. Fixing it
belongs on `merge/production`, not in this merge.

### The exact next commands

**C1 and C2 are both committed at `3210c5ee87` in the DE worktree. The next and last task is
C3**, the verification sweep. The merge is no longer live, so the abort hazard this section used
to carry is gone — all 19 resolutions and the `topiclanding.html` fix are in that commit. The
`docs-check` stamp came through Stage B and was re-stamped to name C1's own parents
`[verified 2026-08-18: CLAUDE.md line 2 reads eda7c256c5+4a260ea2a1 2026-08-18 at 3210c5ee87,
against 59c5d459b8+c0931fbee6 2026-08-18 at eda7c256c5]`.

**The stray server question is closed.** The `hugo serve` running on 2026-08-18 was the main
worktree's own `dev_stage` server on :8081, and Chris stopped it. Identification and the
consequence — which is *not* that `npm run smoke` now works bare — are recorded under Task C3
`[verified 2026-08-18 after the stop: no hugo process; nothing listening on 1313, 8080 or 8081]`.

Re-establish where you are:

```
cd ../EH-dataportal.worktrees/feature-new-data-explorer
git log -1 --format='%H %p'          # expect 3210c5ee87…, parents eda7c256c5 + 4a260ea2a1
git status --porcelain | wc -l       # expect 0 — the merge is committed and the tree is clean
git log --oneline @{u}..             # expect 29 unpushed commits; nothing here is on the remote
```

**`merge/production` is not fully merged into the DE branch, by one commit.** The merge's second
parent is `4a260ea2a1`, the tip at merge time; `6757bcd8aa` ("Record Stage C execution") landed on
`merge/production` afterwards and touches **only this document**. Its content *is* in the DE tree —
the staged copy was refreshed from it before the merge was committed — but git does not record it
as merged `[verified 2026-08-18: git merge-base --is-ancestor 6757bcd8aa HEAD exits 1; the same
check on 4a260ea2a1 exits 0; git diff --name-only 4a260ea2a1 6757bcd8aa lists this file alone]`.
Consequence for whoever closes this out: a later `git merge merge/production` on the DE branch will
still produce a merge commit, and it should be an empty one. A non-empty diff there means something
landed on `merge/production` after `6757bcd8aa` that this note does not cover.


To re-run any check on the current tree:

```
cd ../EH-dataportal.worktrees/feature-new-data-explorer
npm run lint                                              # 16 files, 0 errors
HUGO_RESOURCEDIR="$TEMP/hugo-res" npx hugo --environment production -d "$TEMP/hugo-out"

hugo server --environment development --disableFastRender -p 1313    # in this worktree
DE_BASE_URL="http://localhost:1313/dev-prod/" node scripts/smoke-pages.mjs   # expect 35 of 35
```

`33 ok, 1 FAIL of 34` is **B2's recorded result. C3's prediction is 35 of 35**, because both
defects on that page are now addressed — Finding 5 by the `lib-uhflist.html` include and
Finding 6 by the merge itself. Treat a surviving FAIL there, a second failing page, or a
different signature as something to re-derive from the console output.

~~Do **not** run `node scripts/smoke-pages.mjs` bare here — it spawns a `dev_stage` server that
cannot build on this branch.~~ **Retired 2026-08-18: `dev_stage` builds on this branch now.** Bare
`npm run smoke` is the form that ran for C3 Step 3, and it passed 35 of 35 — see "`dev_stage` went
green on the DE branch" under Task C3. Two caveats survive the retirement: it reuses a server only
if one already answers on :8080 or :1313, and it reads **staging** data either way.

Update the row **in the commit that finishes the task**, not at the end of a session. Record the
proof that actually ran in the house form — `[verified <date>: how]` — naming the command, its
flags, and the numbers that came back. If a prescribed check turns out not to work in this repo,
correct the step here and say why, rather than silently substituting another.

---

## Global constraints

These apply to every task below.

- **Never run two Hugo builders against this tree at once.** A static build beside a running dev
  server poisons the shared `resources/_gen` fingerprint cache and every fingerprinted asset 404s
  under the other environment's prefix. The safe static build is the isolated form in the
  Commands appendix.
- **PowerShell eats the `--` in `npm run <script> -- --flag`.** Every characterization command in
  this plan is written as the underlying `node` invocation for that reason. Do not "fix" them back
  to the npm forwarding form.
- **Nothing commits without Chris's say-so, and he raises committing.** Each task below ends at a
  verified working tree, not at a commit. Do not draft commit messages until asked.
- **Run every merge in this plan with `rerere` disabled for that invocation:**
  `git -c rerere.enabled=false merge --no-commit --no-ff <branch>`. This replaces the 2026-08-15
  constraint, which read "`rerere` covers exactly one file across these merges —
  `scripts/dev-server.mjs` … do not plan around it replaying anything else." **Both halves were
  wrong, and the correction is the reason for the flag.** The shared cache holds **seven** recorded
  resolutions, none of which is `dev-server.mjs`
  `[verified 2026-08-17: seven postimages under .git/rr-cache, all mtime 13:55–13:57 that day;
  preimages identify package.json, package-lock.json, .gitignore, an SCSS file, two
  `define "main"` templates and realtime.js]`. Three of those files are not in Stage A's conflict
  set at all, so the cache is carrying resolutions from some other merge.

  **The `package.json` recording is actively wrong for Stage A** and would be applied silently: its
  postimage keeps only `smoke` and `characterize:cp`, dropping `lint`, `characterize:de`,
  `characterize:nr`, `characterize:pagefind`, `a11y:nr` and `docs-check`, and it preserves *both*
  `devDependencies` blocks `[verified 2026-08-17: cat of the postimage]`. Git announces this as one
  line — "Resolved 'package.json' using previous resolution" — and stages it, so A1 Step 1 would
  look already-done while six scripts A7 runs had vanished.

  **A related premise was also wrong: an aborted merge records nothing.** `rerere` writes a
  preimage when the conflict appears but only stores the resolution when the merge is *committed*.
  The five resolutions made on 2026-08-17 before the abort left preimages and no postimages
  `[verified 2026-08-17: 21 preimages against 7 postimages, and every postimage predates that
  merge]`. Restarting a stage therefore replays nothing you resolved in it — budget the redo.
- **`npm run smoke` does not currently return zero on `merge/production`**, and three later steps
  say it should — A7 Step 3, B2 Step 3, C3 Step 6. One page fails, for a defect that predates every
  merge in this plan: `neighborhood-reports/active_design_physical_activity_and_health/`, two
  `neighborhoods is not defined`, Finding 5 / Task 0.3
  `[verified 2026-08-17: node scripts/smoke-pages.mjs — 32 ok, 1 FAIL of 33, exit 1; re-run
  independently the same day, identical result]`. **Task 0.3 is parked, so this is the standing
  expectation, not a temporary one:** read those three steps as "no failures other than this one,
  and this one unchanged". A second failing page, or a different signature on this one, is a merge
  symptom. The signature to match is the page
  `neighborhood-reports/active_design_physical_activity_and_health/` and exactly two
  `neighborhoods is not defined` lines — a count of one or three is a different defect wearing the
  same words.
- **Every branch this plan touches is checked out in a linked worktree, so no stage can `git
  switch`** `[verified 2026-08-17: git worktree list]`. The correction written into Stage A's
  header applies to **Stages B and C too** — `feature-new-data-explorer` has its own worktree and
  the primary tree holds `merge/production`. One trap in that listing: the directory named
  `…worktrees/production` holds **`build-to-dev-stage`**, not `production`, so a task that says
  "the production worktree" is naming a directory, not a branch — check before building in it.
- **Task 0.1 Step 2's target no longer exists on the NR branch.** A2 deleted
  `themes/dohmh/layouts/nr-output/single.html`, so the `$zip_codes` hardening can only be applied
  on `merge/production` or `feature-new-data-explorer`, where the file survives
  `[verified 2026-08-17: git cat-file -e on both]`. If it is ever done, do it on
  `merge/production` **before Stage C**, or the DE branch keeps the trap that aborts a build on a
  `GetRemote` miss. It is moot for Stage A.
- **`node -e` and the `Bash` tool disagree about `/tmp` on this machine** — node resolves it to
  `C:\tmp` and fails with `ENOENT` on a file the shell just wrote. Hand node Windows-style absolute
  paths (the session scratchpad) rather than `/tmp/...`. Cost 2026-08-17: one failed run mid-sweep.
- Resolve conflicts in a scratch worktree first where a task says so. Nothing lands on
  `feature-MOD-Lab-NR-recode-refactor` or `feature-new-data-explorer` until its stage verifies.
- **Every build-based proof in this document is only as good as the `data_branch` it read.** `hugo`
  exits 1 against any `data_branch` lacking the sentence-cased report JSON filenames, and a red
  build there is not evidence about the merge. As of 2026-08-17 every check reads a branch that has
  them, so this constraint is satisfied — but it is the thing to re-check first when a build goes
  red for no reason the diff explains:

  | Check | Environment | `data_branch` | Builds? |
  |---|---|---|---|
  | Isolated build (appendix) — A7 Step 2, B2 Step 2, C3 | `production` | `production` | **yes** `[verified 2026-08-17: exit 0, warns=0, errors=0, 1282 EN pages]` |
  | `npm run smoke` — A7 Step 3, C3 Step 6, **on `merge/production` and the NR branch only** | `dev_stage` (spawned by `scripts/dev-server.mjs:27`) | `staging` | **yes** `[verified 2026-08-17: exit 0, warns=0, errors=0, 1283 EN pages]` |
  | `npm run smoke` — **B2 Step 3, on `feature-new-data-explorer`** | `dev_stage`, same spawn | `feature-new-data-explorer` | **NO** `[verified 2026-08-18: isolated dev_stage build, exit 1, 5 GetRemote warns + 4 ERROR render at single.html:419]` — see below |
  | `node scripts/nr-characterization.mjs --check` — A7 Step 4 | `dev_stage`, same server | `staging` | **yes**, same build |
  | `node scripts/pagefind-characterization.mjs --check` — A7 Step 6, B2 Step 4 | `dev_stage`, same server | `staging` | **yes**, same build |

  `hotfix-geo-names` is the branch that fails, and `dev_stage` no longer points at it (Task 0.1
  Step 5). Anything still reading it — a stale worktree, a config not yet merged forward — will
  abort with five `Unable to get remote resource` warnings and four `ERROR render` lines citing
  `nr-output/single.html:419`. That is the signature to recognise, not a merge symptom.

  **`hotfix-geo-names` is not the only such branch, and the second one was found by walking into
  it (2026-08-18, B2 Step 3).** `config/dev_stage/config.toml:3` on `feature-new-data-explorer`
  reads `data_branch = "feature-new-data-explorer"`, and that EHDP-data branch never received the
  2026-08-17 export either. `config/local_stage/config.toml` pins the same value. So on the DE
  branch, `dev_stage` **was** a red environment, and `scripts/dev-server.mjs:27` spawns exactly
  that environment with `stdio: "ignore"` — which converts a build abort into the far less
  informative `Spawned hugo server did not answer at http://localhost:8080/dev-stage/ within 90s`.
  The underlying failure is only visible if you re-run the build yourself. **`dev_stage` went green
  on the DE branch 2026-08-18 with the pin unchanged** — see the section of that name under Task
  C3. The diagnosis-swallowing `stdio: "ignore"` is unchanged and still bites on any future red
  environment, which is why this paragraph stays.

  **The signature the paragraph above describes was reproduced exactly — five `Unable to get
  remote resource` warnings and four `ERROR render` lines at `nr-output/single.html:419`,
  `value has type int; should be string`** `[verified 2026-08-18: HUGO_RESOURCEDIR=… npx hugo
  --environment dev_stage -d … in the DE worktree, exit 1; the five missing URLs are
  .../EHDP-data/feature-new-data-explorer/neighborhood-reports/data/report/<Title_Case>.json]`. So
  the recognition rule generalises and only its branch list was short: **enumerate which EHDP-data
  branch each environment pins on the branch you are standing on, rather than trusting this table's
  environment names, which were written from `merge/production`.**

  **Still red after a 2026-08-18 re-export, and the cause is now pinned exactly.** Chris copied the
  `production` NR report files onto EHDP-data `feature-new-data-explorer` that day. The files
  arrived; **the case-only renames did not.** Enumerating both directories through the GitHub
  contents API rather than probing name by name: 26 files on each branch, **26 of `production`'s
  26 absent from the DE branch, and all 26 of those differing from a DE file by case alone — zero
  genuinely missing** `[verified 2026-08-18: /repos/nychealth/EHDP-data/contents/neighborhood-reports/data/report
  at ref=feature-new-data-explorer and ref=production; and by direct fetch, the sentence-cased
  "…Injury and health.json" returns 404 on the DE branch and 200 on production, while the Title
  Case "…Injury and Health.json" returns 200 on the DE branch]`. This is precisely the two-repo,
  two-OS hazard `CLAUDE.md` records: a Windows-side export drops case-only renames silently,
  because git treats them as no-ops on a case-insensitive filesystem. It is the same failure that
  Finding 3's 2026-08-17 Linux-side export existed to avoid.

  **Two ways out, and the second is already in this plan.** Re-export from Linux (or `git mv` the
  26 files on that branch) — or let **C1 Step 3** re-point `config/dev_stage/config.toml` at
  `staging`, which carries the correct names, after which the DE branch's own EHDP-data branch
  stops gating any build here. Nothing in Stage B depends on either: B2 Step 3's proof was taken
  under `development`, which reads `production`.

---

## Stage 0 — fix `merge/production` before merging it into anything

Both tasks here are defects already present on `merge/production`, found 2026-08-16. Neither is a
merge artifact, and neither is visible in any conflict list — Stage A and Stage C would both carry
them forward silently. Fixing them on `merge/production` means both feature branches inherit the
fix through the merge they are already doing; fixing them afterwards means doing each twice and
re-testing on two branches.

### Task 0.1: NR report-topic rename — the build blocker

> **Status 2026-08-18: the blocker is down everywhere this plan touches, and Step 5 is closed.**
> Chris landed the EHDP-data export from a Linux machine 2026-08-17 for `production` and
> `staging`, which is what let the case-only renames through; on 2026-08-18 he did the same for
> `feature-new-data-explorer` by recreating that EHDP-data branch off `production`, re-exporting
> from Linux against the **site** repo's `production` YAML, and force-pushing. `dev_stage` on the
> DE branch now builds and serves. The account, its proof and two residual traps are under Task C3,
> "`dev_stage` went green on the DE branch". Steps 1, 3, 4 and 5 are done; Step 2 no longer
> unblocks anything and is re-scoped to optional hardening.

**Files:**
- Modify: `themes/dohmh/layouts/nr-output/single.html` (delete the `$zip_codes` declaration and its
  one assignment — Step 2, now optional hardening)
- ~~Coordinate in the **EHDP-data** repo~~ — **done 2026-08-17**, `production` and `staging` only
- ~~Decide: `config/dev_stage/config.toml:3` `data_branch`~~ — **done 2026-08-17**, re-pointed
  from `hotfix-geo-names` to `staging` in `5acffbf727` (Step 5).

**Depends on:** nothing.
**Leaves for:** A7 Step 2, B2 Step 2, C3 — the isolated builds, which now pass. ~~The `dev_stage`
checks (A7 Steps 3, 4, 6; B2 Steps 3, 4; C3) still wait on Step 5.~~ **Cleared 2026-08-18** — Step
5 is done for every branch this plan merges, and C3 Step 3 ran against `dev_stage` and passed
35 of 35.

`6fb89c0ffb` sentence-cased `report_topic` across `data/globals/NR_content/*.yml`. That value is
interpolated into the per-topic JSON URL at `single.html:391`, so the site now requests
`Asthma_and_the_Environment Adult asthma.json` while EHDP-data still publishes
`Asthma_and_the_Environment Adult Asthma.json`.

That commit's message predicts a soft failure — "only warnf fires, leaving the accordions empty on
a build that still succeeds." It does not succeed. `$topic_data` is initialised as an empty `dict`
at `single.html:393`, so a missed fetch leaves a map behind; `where` over a map returns a map; and
line 419's `index $neighborhood_topic_data 0 "zip_code"` runs unconditionally, indexing a map with
an int key and aborting the render.

This is the shape the Verification rules call out: a plan's expected result was wrong, so the
premise behind it is the suspect. The premise here was that a `GetRemote` miss degrades gracefully.
It does not, anywhere this pattern is used — worth a look before trusting the same shape elsewhere.

- [x] **Step 1: Reproduce, so a later red build is attributable.** DONE.

Isolated build (Commands appendix). On `merge/production` before the export: exit 1, five
`Unable to get remote resource` warnings, four `ERROR render` lines, all citing
`nr-output/single.html:419`
`[verified 2026-08-16: isolated build, --environment production, exit 1, warns=5, errors=4]`.

The control that makes this a regression rather than an environment fault — same toolchain, same
machine, same command, `production` instead:
`[verified 2026-08-16: build in the existing production worktree, exit 0, warns=0, errors=0,
1286 pages, and both pages that fail above present in the output at 257489 and 188318 bytes]`.

**The failure signature was reproduced once more on 2026-08-17, which is what makes Steps 4 and 5
readings meaningful rather than merely uneventful.** With `config/dev_stage/config.toml` still
reading `hotfix-geo-names`, an isolated `dev_stage` build returned the identical shape
`[verified 2026-08-17: HUGO_RESOURCEDIR="$TEMP/hugo-res-stage" npx hugo --environment dev_stage -d
"$TEMP/hugo-out-stage" — exit 1, warns=5, errors=4, the warned URLs naming
raw.githubusercontent.com/nychealth/EHDP-data/hotfix-geo-names/…]`.

**That control is no longer reproducible by running the same command**, because Step 5 re-pointed
`dev_stage` at `staging` and the identical invocation now exits 0. To re-arm it, set
`data_branch` to `hotfix-geo-names` in a scratch copy of the config — do not reproduce it by
editing the tracked file. A green `dev_stage` build today is evidence only in combination with the
red one recorded above, on the same command, hours apart.

- [ ] **Step 2: Delete the dead assignment.** Re-scoped 2026-08-17: **hardening, not the
      unblocker.** The content fix in Step 3 is what unblocked the build; this step removes the
      trap so the *next* `GetRemote` miss degrades instead of aborting. Step 5 is a live instance
      of exactly that miss, so the case for doing it is stronger now than when it was written, but
      it no longer gates anything and can be sequenced freely.

`$zip_codes` is declared `""` at `single.html:182`, assigned at line 419, and **never read**.
`[verified 2026-08-16: grep -rn 'zip_codes' across themes/ and assets/ returns exactly four hits —
these two, plus two in nr-insert-zips.html.]` The two in `nr-insert-zips.html` are a separate,
identically-named template-local variable built from `uhflist`'s `Zipcodes` field; that partial is
what renders the ZIP list on the page. Nothing consumes line 419's value.

So the line that aborts the build computes something no one uses. Delete both lines rather than
guarding them — it is the smaller change and it removes the trap permanently instead of leaving a
guarded version of it. `production` carries the same dead pair (lines 194 and 433) and only
survives because its fetch resolves.

Expected after: no change to the `production` build, which already exits 0. Against `dev_stage` the
build should go from exit 1 to exit 0 while the five `Unable to get remote resource` warnings
**remain** — which is precisely the half-fixed state this step produces and Step 5 exists to close.
It is the reason this step is hardening and not a fix.

- [x] **Step 3: Land the rename in EHDP-data.** DONE 2026-08-17 — `production` and `staging`.

Chris ran the data export from a Linux machine, so the case-only renames survived; a Windows-side
export would have dropped them, since git records no change for a case-only rename on a
case-insensitive filesystem.

All 26 sentence-cased filenames are present on both branches, with none missing
`[verified 2026-08-17: gh api contents listing of neighborhood-reports/data/report --paginate,
set-differenced against feature-improve-NR-styles — zero names missing from either production or
staging]`.

**The export added the new names without removing the old ones, and that had to be cleaned up
separately.** For part of 2026-08-17 `production` and `staging` each held 52 files — 26
sentence-cased plus the 26 Title Case originals `[verified 2026-08-17: contents listing; comm -13
against feature-improve-NR-styles returned 26 extras]`. EHDP-data `fcb1a540` (production) and
`b2b63d06` (staging), both "delete upper case NR report files", removed the duplicates; both
branches now list 26 `[verified 2026-08-17, later the same day: contents listing re-run]`.

**That intermediate state is not a harmless orphan, which is why it was worth deleting rather than
leaving.** Two filenames differing only in case cannot coexist in a working tree on a
case-insensitive filesystem, so a Windows clone pulling the 52-file state hits a checkout
collision — Hugo builds are unaffected, because they fetch by URL and never check the tree out,
which is exactly what makes the problem invisible from this repo. See the corresponding gotcha in
`CLAUDE.md`.

The rejected alternative stays rejected: reverting `6fb89c0ffb`'s YAML casing would re-introduce
the acronym mangling that commit fixed ("Health Burden: Fine Particles (PM2.5)" rendering as
"(pm2.5)").

- [x] **Step 4: Verify content, not just exit code.** DONE 2026-08-17.

`[verified 2026-08-17: HUGO_RESOURCEDIR="$TEMP/hugo-res-prod" npx hugo --environment production -d
"$TEMP/hugo-out-prod" — exit 0, warns=0, errors=0, 1282 EN pages, 42.7s]`.

Exit code alone would not have settled this, because Step 2 also produces an exit 0 — with empty
accordions. The content check:

```
grep -c 'zip_code\|report-section\|accordion' "$TMP/hugo-out-prod/neighborhood-reports/bayside_little_neck/asthma_and_the_environment/index.html"
```

Returned **33**, identical to the count from the same page built on `production` on 2026-08-16
`[verified 2026-08-17]`. `warns=0` is the direct evidence that all five `GetRemote` calls resolved;
the 33 is the corroborating evidence that what they returned actually reached the page.

Note the pattern: the 2026-08-16 draft of this step wrote the command as
`grep -c 'data_value_rank\|accordion'` while quoting a control measured with
`zip_code|report-section|accordion`. Those are different patterns and their counts are not
comparable — the prescribed check could not have been read against the control beside it. Corrected
above to the pattern the control was actually measured with. (`data_value_rank\|accordion` returns
31 on the same file, for anyone reconciling against the old text.)

- [x] **Step 5 (added 2026-08-17): decide what `dev_stage` reads.** DONE 2026-08-17 — Chris
      re-pointed it at `staging`.

`config/dev_stage/config.toml:3` read `data_branch = "hotfix-geo-names"`, an EHDP-data branch that
did not receive the export: 26 files, all Title Case, none of the sentence-cased names
`[verified 2026-08-17: gh api contents listing; all 26 feature-branch names absent]`. Since
`scripts/dev-server.mjs:27` spawns `dev_stage`, that blocked smoke and both characterization
harnesses. Chris changed the value to `staging`, which carries the sentence-cased files.

Proof, the same command that failed on the old value:

```
HUGO_RESOURCEDIR="$TEMP/hugo-res-stage2" npx hugo --environment dev_stage -d "$TEMP/hugo-out-stage2"
```

`[verified 2026-08-17: exit 0, warns=0, errors=0, 1283 EN pages, 34.4s — against exit 1, warns=5,
errors=4 on the same command two hours earlier with data_branch = "hotfix-geo-names"]`. That
before/after pair on one unchanged command is what makes this attributable to the config value
rather than to anything else that moved.

Content check on the same page Step 4 used: **34**
`[verified 2026-08-17: grep -c 'zip_code\|report-section\|accordion']`. One above the `production`
build's 33 — a data difference between the `staging` and `production` EHDP-data branches, not a
fetch failure. `warns=0` is the direct evidence that every `GetRemote` resolved; the count is
corroboration and is not expected to match across branches carrying different data.

**Two consequences to carry forward:**

- The NR characterization baseline directory follows the `data_branch` value, so it is
  `scripts/nr-characterization-baseline/staging/` — which is what A7 Step 4 said before the pin was
  discovered. Confirm from the harness's own path construction anyway; see that step.
- Whatever `hotfix-geo-names` was pinned for is not recorded anywhere in this repo, so if that pin
  had a live purpose it is now silently off. `5acffbf727` is the commit that changed it. Raise it
  before merging any stage — `config/dev_stage/config.toml` is not in any stage's conflict list, so
  no task in this plan will surface it again.

---

### Task 0.2: Give the congestion pricing report its library includes

**Files:**
- Modify: `themes/dohmh/layouts/data-features/congestion-pricing-report.html` (`js_bot` block,
  immediately before the `$cpShared` resource declarations at line 425)
- Modify: `scripts/smoke-pages.mjs` (`PAGES`)

**Depends on:** nothing, as of 2026-08-17 — it depended on Task 0.1 only because the verification
build could not run, and the `--environment production` build now exits 0. Step 3's browser check
needs a served build; take it from the isolated `production` output, not from a `dev_stage` server.
**Consumes:** `lib-leaflet.html`, `lib-easybutton-coloricon.html`, `lib-vega.html`, `lib-d3.html`
— all present on `merge/production`.

The page mounts its own seven JS files and no libraries. It has never had a `lib-*` include
`[verified 2026-08-16: git log -S 'partial "lib-' on that path returns no commits]`; on
`production` the blanket block covered it, gated `{{ if or (eq .Kind "page") ... }}`, which a leaf
bundle satisfies. `assets/js/congestion-pricing-report/` did not exist in the tree at
`fd416aee7f`, so that commit's sweep was correct when it ran — the gap opened when
`feature-summer-CP-report` and `feature-headhtml-gating` merged without sharing a file.

Note that `mapLib: true` in the page's front matter is a decoy. `head.html:92` uses it only to load
a maps.nyc.gov stylesheet, identically on both branches; it has never provisioned Leaflet.

Library needs, derived from the globals the page's own JS actually calls
`[verified 2026-08-16: per-library grep across assets/js/congestion-pricing-report/]`:

| Library | Calls | Files |
|---|---|---|
| `lib-leaflet.html` | 9 × `L.<method>(` — `map`, `tileLayer`, `geoJSON`, `marker`, `icon`, `control`, `circleMarker` | `shared.js`, `map-monitoring.js`, `map-regional.js` |
| `lib-easybutton-coloricon.html` | 2 × `L.easyButton(` | `map-monitoring.js`, `map-regional.js` |
| `lib-vega.html` | 3 × `vegaEmbed(` | `shared.js` (2), `sticky-header.js` |
| `lib-d3.html` | 2 × `d3.csv(` | `map-monitoring.js`, `map-regional.js` |

Arquero, DataTables and uhflist are in no row: `aq.`, `.DataTable(` and `neighborhoods` as an
identifier all return zero across that directory. `production` served all three to this page from
the blanket block, so they will appear in a before/after diff of the built page — do not read their
absence as a regression and do not add them back. `L.colorIcon` is also unused, but
`lib-easybutton-coloricon.html` is the only partial carrying `easyButton` and ships both; take it
whole rather than splitting it for one page.

- [x] **Step 1: Add the four includes.** DONE 2026-08-17.

The usage table above was re-derived rather than trusted
`[verified 2026-08-17: grep -rncE across assets/js/congestion-pricing-report/ — L.<method>( 9
(map-monitoring 5, map-regional 2, shared 2), L.easyButton( 2, vegaEmbed( 3, d3.<fn>( 2,
.DataTable( 0, aq. 0]`. The three `neighborhoods` hits in `shared.js` are the English word inside
report copy strings (lines 28, 41, 63), not the global — so the "no uhflist" row holds, and a
count-only grep would have read them as a fifth library need.

In the `js_bot` block, **before** the `$cpShared` resource declarations at line 425 — the report
modules call these libraries at load, and the block's own comment already states the files run in
declaration order with no `defer`:

```gotemplate
{{- partial "lib-leaflet.html" . }}
{{- partial "lib-easybutton-coloricon.html" . }}
{{- partial "lib-vega.html" . }}
{{- partial "lib-d3.html" . }}
```

`lib-leaflet.html` must precede `lib-easybutton-coloricon.html`: both easyButton and colorIcon
extend the global `L`, which that partial's own header comment states.

- [x] **Step 2: Add the page to the smoke list.** DONE 2026-08-17, at
      `scripts/smoke-pages.mjs:43`, after the `rats-in-your-neighborhood` entry.

It is absent from `PAGES`, which is why nothing caught this
`[verified 2026-08-16: 32 entries, no congestion-pricing URL among them]`. Add it with a comment
naming the template, matching the file's existing convention:

```javascript
"data-features/congestion-pricing-report/",      // congestion-pricing-report layout — Leaflet + easyButton, Vega, D3
```

The page's JS guards its own library access, so the failure surfaces as `console.error` rather than
a throw. Those strings match no `KNOWN_NOISE` entry, so smoke fails on them once the page is listed
— checked against the four allowlist patterns, none of which mention Leaflet, Vega or D3.

**That prediction was never observed, because Step 1 landed before Step 2.** The entry has only ever
been run against the fixed page, where it passes
`[verified 2026-08-17: node scripts/smoke-pages.mjs — "ok  data-features/congestion-pricing-report/"
at line 19 of the log]`. The instrument is not unvalidated, though: the same run failed a *different*
page on the same class of defect (Finding 5 below), and the browser probe in Step 3 returned
`undefined` there for the global that page is missing — so both checks are known to be able to fire
on this branch, from an instance neither was written against.

- [x] **Step 3: Verify in a browser — nothing below it proves this.** DONE 2026-08-17, all six
      readings match the `production` control.

Build, serve the output, load `/data-features/congestion-pricing-report/` and read the globals:

```javascript
({ L: typeof L, vegaEmbed: typeof vegaEmbed, d3: typeof d3,
   leafletContainers: document.querySelectorAll('.leaflet-container').length })
```

Expected after the fix: `L` `"object"`, `vegaEmbed` `"function"`, `d3` `"object"`, and **2**
`.leaflet-container` elements. Those are the `production` values, measured on the built control
`[verified 2026-08-16: production build served locally — L=object, vegaEmbed=function, d3=object,
aq=object, neighborhoods=object, 2 leaflet containers]`.

Before the fix the same probe on `merge/production` returns `undefined` for all three and **0**
containers, with `Leaflet or D3 is not available for cpReportMap.`, `... for cpRegional.` and
`TOD Traffic Vega render failed: ReferenceError: vegaEmbed is not defined` on the console
`[verified 2026-08-16: merge/production build served locally]`. That is the positive control for
this probe — it is known to distinguish the two states, so a clean reading after the fix means
something.

**Result 2026-08-17: `L` `"object"`, `vegaEmbed` `"function"`, `d3` `"object"`, 2
`.leaflet-container`** — the four values the control predicts — plus `L.easyButton` `"function"` and
`L.ColorIcon` `"function"`, which the probe was extended to read because
`lib-easybutton-coloricon.html` is the one include whose absence Leaflet itself would not reveal.
The libraries are not merely parsed but used: both maps drew (`cpReportMap` and `cpRegional`, the
same two ids the failure messages name, 15 tiles between them), 6 `.vega-embed` nodes each hold a
rendered `canvas`/`svg`, and 2 `.easy-button-container` elements exist
`[verified 2026-08-17: Playwright evaluate against the isolated production build served statically]`.

Method, because it differs from the one the Commands appendix describes and the difference matters:
the build went to `<scratch>/cp-serve/IndicatorPublic` and was served by `python3 -m http.server`
rather than by Hugo. `baseURL` carries the `/IndicatorPublic/` path prefix and `relativeURLs` is
`false`, so every asset href is site-absolute — serving the output at a server root would 404 every
one of them and look exactly like the breakage under test. A plain file server is also not a Hugo
builder, so it cannot poison `resources/_gen`; nothing was listening on :8080 or :1313 at the time
`[verified 2026-08-17: netstat before the build]`.

The build behind it: `[verified 2026-08-17: HUGO_RESOURCEDIR=<scratch>/hugo-res-cp npx hugo
--environment production -d <scratch>/cp-serve/IndicatorPublic — exit 0, 1282 EN pages, 30.3s,
0 ERROR lines, 1 WARN line]`. That single WARN is `dev environment: production`, present on every
build of this branch and unrelated to resources — worth naming rather than reporting `warns=0`,
since the earlier entries in this plan use a warn count as the evidence that `GetRemote` resolved.

Three console errors remain on the page and are not regressions: two 404s for
`pagefind/pagefind-ui.{css,js}` and the `PagefindUI is not defined` they cause. Pagefind's index is
a post-build step that neither `hugo` nor `hugo server` runs, so these appear on every page under
every local check; all three match the site-wide `pagefind` / `Failed to load resource` entries in
`KNOWN_NOISE`.

---

### Task 0.3: `topiclanding.html` — missing `lib-uhflist.html` (PARKED)

**Files:**
- Would modify: `themes/dohmh/layouts/neighborhood-reports/topiclanding.html` (one line, beside the
  existing `lib-leaflet.html` include at line 18)

**Depends on:** nothing.
**Blocks:** nothing mechanically — but it is why `npm run smoke` does not currently reach zero on
this branch, so A7 Step 3, B2 Step 3 and C3 Step 6 will each read one pre-existing FAIL unless it is
resolved first. **Do not read that FAIL as a merge symptom**; it is the same signature-recognition
point the `data_branch` table makes for red builds.

**PARKED 2026-08-17 — Chris chose option 2 below.** The one-line fix is obvious; whether it should
be made was not, because Stage A `git rm`s this exact file (A2) — so on the NR branch the fix is
discarded, while on the DE branch it would be inherited and ship. The call was to spend nothing on
a page Stage A retires, and to carry the FAIL as a known signature instead.

**What unparks it:** Stage A being abandoned or deferred indefinitely, or `topiclanding.html`
otherwise surviving into `production`. Either makes a live page's broken neighborhood matching
permanent rather than temporary, and the one-line fix becomes worth making.

**The cost accepted, stated so it is not rediscovered as a surprise:** `npm run smoke` exits 1 on
this branch until Stage A lands, so every later smoke step reads a red suite and must distinguish
this failure from a new one by signature rather than by exit code.

Evidence, gathered 2026-08-17:

- The template carries exactly one `lib-*` include, `lib-leaflet.html` at line 18, and calls
  `partial "nr-leaflet"` at line 19. `nr-leaflet.html:302` runs `neighborhoods.find(...)`. Its
  line 301 comment still says the global "is a variable set in uhflist.js" — the file A3 Step 3
  already flags for a comment fix. **Those two line numbers are `merge/production`'s**; the same
  comment sits at 340 on the NR branch and in the merged tree, which is the number A3 Step 3 uses
  `[verified 2026-08-17: grep across both blobs]`. Neither citation is wrong — they describe
  different trees, so check which one you are in before trusting a line number in this document.
- Pre-existing, not introduced by Task 0.2: at `HEAD` the template had the same single include
  `[verified 2026-08-17: git show HEAD:…/topiclanding.html | grep -c 'partial "lib-' returns 1]`,
  and the built page contains no `uhflist` reference at all
  `[verified 2026-08-17: grep -c uhflist on the built production page returns 0]`. Task 0.2's diff
  is two files, neither in this page's render path.
- Runtime, on the same statically-served production build Task 0.2 Step 3 used, so it is not an
  artifact of the `dev_stage` server: `L` `"object"`, `neighborhoods` `"undefined"`, 1
  `.leaflet-container` drawing 6 tiles, and the two `ReferenceError`s above
  `[verified 2026-08-17: Playwright evaluate + console read]`. The map renders; only the
  neighborhood-name matching is dead — which is why nothing surfaced this from looking at the page.

Three ways to close it were offered:

1. **Add the include here.** One line, ships the fix to the DE branch through Stage C, discarded by
   A2 on the NR branch. Would turn smoke green on `merge/production` now.
2. **Leave it and record the expected FAIL**, on the argument that the page is retired by the NR
   work anyway. Costs a red guardrail until Stage A reaches production, which is the condition
   under which a real failure hides in a familiar one. **← chosen 2026-08-17.**
3. **Remove the entry from `PAGES`** — rejected rather than offered neutrally: it deletes the only
   thing that reports the defect, on a page that is still live.

- [x] **Step 1: decide.** DONE 2026-08-17 — option 2. No code change; the expectation is recorded
      in Global constraints and in the ledger row, with the exact signature to match.

**If this is ever unparked, the fix and its proof:** add `{{- partial "lib-uhflist.html" . }}`
after `topiclanding.html:18`, then `node scripts/smoke-pages.mjs` — expected 33 `ok`, zero `FAIL`,
exit 0, against the 32/1/exit-1 measured twice on 2026-08-17.

---

## Stage A — `feature-MOD-Lab-NR-recode-refactor` ← `merge/production`

**23 conflicted files, not the 22 this section carried until 2026-08-17**
`[verified 2026-08-17: git merge-tree --write-tree --name-only, re-derived against merge/production
at 7ebd567eb8]`. The extra is **this plan document**, which the NR branch also carries — copied
there by `fb5b89df64`, and diverged since, because Stage 0's records were written on
`merge/production` only. It is an add/add conflict and belongs to A1; resolve it first, before
anything else in the stage, since it is the ledger the rest of the stage writes into. Take
`merge/production`'s copy whole (`git checkout --theirs`): it is the maintained one, and the NR
branch's is a snapshot taken before Stage 0 existed.

The other 22 are as the task lists describe them. The count was re-derived rather than trusted
because `merge/production` has moved three commits since 2026-08-15; none of the three added a
conflict, and the 23rd was present all along and simply unlisted.

**The `git switch` in the 2026-08-15 draft does not work in this repo and was never run.**
`feature-MOD-Lab-NR-recode-refactor` is checked out in a linked worktree, so the primary tree
refuses `[verified 2026-08-17: fatal: 'feature-MOD-Lab-NR-recode-refactor' is already used by
worktree at …EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor]`. Work in that worktree
instead — which is better anyway, since it leaves `merge/production` checked out in the primary
tree for the isolated builds and for reading this document while the merge sits conflicted:

```
cd ../EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor
git merge --no-commit --no-ff merge/production
```

Expect it to stop with 23 conflicts. Do not `git merge --abort` between tasks — the tasks share
one conflicted working tree.

> **BEFORE THE STAGE A MERGE COMMIT: refresh this document in the merge worktree.** Stage A is
> being *recorded* in the primary tree's copy (on `merge/production`) and *executed* in the merge
> worktree, whose copy was staged from `merge/production` back at A1 and has not moved since. As of
> 2026-08-17 they are 1748 lines and 1448 lines respectively — the 300-line gap is every A3–A7
> record. Committing the merge without refreshing captures a plan that describes none of the work
> it ships with. Order: commit the plan updates on `merge/production` first, then bring that
> version into the merge worktree and re-stage it, then commit the merge.

### Task A1: Shared-infrastructure conflicts

**Files:**
- Modify: `.claude/settings.json` (add/add)
- Modify: `.gitignore` (content)
- Modify: `CLAUDE.md` (add/add)
- Modify: `documents/js-conventions.md` (add/add)
- Modify: `documents/nr-de-merge-integration-plan-2026-08-15.md` (add/add — this document; take
  `merge/production`'s copy, resolve first, see the stage header)
- Modify: `documents/site-wide-audit-2026-06-27.md` (add/add)
- Modify: `package.json` (content)
- Modify: `package-lock.json` (content)
- Modify: `scripts/dev-server.mjs` (add/add — resolve by hand; the cache holds no recording for
  this file, contrary to the 2026-08-15 note here)
- Modify: `scripts/smoke-pages.mjs` (add/add)

**Depends on:** nothing.
**Leaves for:** A7, which runs `npm run smoke` and `npm run lint` — both read `package.json`'s
script block and `eslint.config.mjs`'s file arguments, so the merged `package.json` must retain
every `scripts` entry from both sides.

> **A1 COMPLETE 2026-08-17 — all ten files staged, 13 conflicts left in the tree (A2's nine, A3's
> `head.html`, A5's two SCSS, A4's `neighborhood-reports/section.html`).** Step 4's four files went
> as follows, and three of the step's own premises were wrong:
>
> - **`scripts/dev-server.mjs` is not byte-identical between the branches** — nine hunks, and the
>   A1 file list called it the one file rerere would replay. Resolved to the NR copy plus two things
>   from `merge/production`: its comment that `dev_stage` means *staging* data, and its spawn
>   timeout of 90s against the NR copy's 60s. The timeout is the functional half — a cold build
>   here has measured 30–42s, so 60 leaves no margin and the failure would read as "server never
>   came up." The NR copy's `--logLevel debug` and probe order are kept.
> - **Neither `CLAUDE.md` mentions `lib-` at all** `[verified 2026-08-17: grep -ci 'lib-' returns 0
>   on both sides]`. Step 4 says to fold in "`merge/production`'s additions that describe things the
>   merge is bringing in (the `lib-*` partials model)" — there is nothing to fold. **A7 Step 9 must
>   write that prose from the merged tree, not re-read it.** What was folded in is what genuinely
>   had no counterpart: the Human-facing docs section, the page-bundle-vs-`static/` rule, and the
>   on-demand build-trigger paragraph (all three cited paths verified present).
> - **`documents/js-conventions.md` was not a two-sided union.** Audit §5h records the two
>   convention documents as unified on 2026-07-29, and the NR copy is that unification — it carries
>   every section `merge/production`'s copy has. The one substantive divergence is the step-comment
>   marker, and the code settles it: 110 five-dash markers across `assets/js/data-explorer/` and
>   `assets/js/nr-report/`, zero three-dash `[verified 2026-08-17]`. Taking the NR copy whole.
> - **`.claude/settings.json` reduced to one boolean.** The `allow` arrays are identical entry for
>   entry (72 each) and the NR copy's `ask` is a superset (54 against 28), so only
>   `greptile@claude-plugins-official` differed. Resolved to `false`, `merge/production`'s value,
>   because that side carries a commit whose message states the intent ("turn off greptile",
>   `4bd2bc4f8d`) while the NR value came in with a file created wholesale on 2026-07-29.
> - **`.gitignore` unioned**, proven by sweeping every pattern from both sides against the result —
>   zero missing, 60 patterns from 50 and 57. Staging `.claude/settings.json` then needs `git add
>   -f`, because `.claude/` is itself an ignore entry. That contradiction is pre-existing on the NR
>   branch, not introduced here `[verified 2026-08-17: HEAD carries both the ignore line and the
>   tracked file]`, and it is harmless — the ignore only governs the untracked siblings.
>
> **Progress 2026-08-17: Steps 1, 2, 3 and 5 done and staged; Step 4 (the four prose/config files)
> not started.** The stage was aborted and restarted once, with `rerere` disabled per Global
> constraints — the restart cost the five resolutions below and bought two things: `MERGE_HEAD` is
> now `c59d614716`, `merge/production`'s tip, so this document arrives through the merge instead of
> being hand-copied, and no conflict was pre-answered from the cache
> `[verified 2026-08-17: zero "previous resolution" lines in the merge output; 23 conflicts, all
> presented]`. The merge is live in the worktree — 18 conflicts remain, 5 resolved (this document,
> `package.json`, `package-lock.json`, `documents/site-wide-audit-2026-06-27.md`,
> `scripts/smoke-pages.mjs`). Two things came up that the step text did not predict:
>
> **`package.json` is not only a `scripts` union — `merge/production` carries two
> `devDependencies` keys.** One at line 18 holding `playwright ^1.62.0`, one at line 55 holding
> axe-core, eslint, globals and `playwright ^1.61.1`. JSON keeps the last, so the first has been
> dead since `e81913e8d9` added it `[verified 2026-08-17: node -e require('./package.json') on
> merge/production reports only the line-55 block]`. The resolution emits exactly one block, the
> line-55 one, so nothing about what npm installs changes. **The `^1.62.0` bump has therefore never
> taken effect on any branch, and reviving it is a decision, not a merge resolution — flagged for
> Chris rather than taken.** Installed today is playwright 1.62.1, which satisfies either range.
>
> **Three of the NR branch's `KNOWN_NOISE` entries were dropped, deliberately.** The merged file is
> `merge/production`'s copy with only the three NR report URLs relabelled to the Option D templates
> `[verified 2026-08-17: diff against merge/production's blob shows exactly those lines; 33 PAGES,
> 4 KNOWN_NOISE, node --check clean]`. The NR branch additionally excused the housing Datawrapper
> negative-SVG signature, `rats-in-your-neighborhood`'s `area.contains`, and `aq is not defined` on
> `/data-explorer/` (§5b, §5c, §5f). All three pages are in `merge/production`'s own `PAGES` and all
> three passed there with no entry excusing them
> `[verified 2026-08-17: the 32-ok smoke log — "ok data-explorer/", "ok data-stories/housing/",
> "ok data-features/rats-in-your-neighborhood/"]`, and §5f is what production's `c03635c51e`
> fixed. Since those pages render from `merge/production`'s templates after this merge, carrying
> the entries forward would leave three dead exemptions hiding future regressions. **If A7 Step 3
> fails on any of those three, re-add that one entry — do not re-add all three.**
>
> The topic-index row is where Task 0.3 lands: `neighborhood-reports/active_design_physical_
> activity_and_health/` stays in `PAGES` but is rendered by `nr-topic-index.html` here, since A2
> retires `topiclanding.html`. That is the URL currently failing smoke on `merge/production`, so on
> this branch it should go **green** — and if it does not, A4's includes are wrong, not Task 0.3.

- [ ] **Step 1: Union the two `scripts` blocks in `package.json`.**

The NR branch owns `characterize:nr`, `a11y:nr`, `characterize:pagefind`, `characterize:de`,
`docs-check`. `merge/production` adds its own. Take both; there is no overlap in names to
arbitrate. Confirm with:

```
node -e "console.log(Object.keys(require('./package.json').scripts).sort().join('\n'))"
```

Expected: every script named in `CLAUDE.md`'s Guardrails section is present.

- [ ] **Step 2: Regenerate `package-lock.json` rather than hand-merging it.**

```
git checkout --ours package-lock.json
npm install --package-lock-only
git add package-lock.json
```

Expected: `npm install --package-lock-only` exits 0 and rewrites the lock to match the unioned
`package.json`. Hand-resolving a 790-line lockfile conflict is the failure mode this avoids.

- [ ] **Step 3: `documents/site-wide-audit-2026-06-27.md` — keep the NR branch's copy.**

CLAUDE.md names this the active findings log for this branch (§5f–§5j). `merge/production` deletes
719 lines of it from a different lineage.

```
git checkout --ours documents/site-wide-audit-2026-06-27.md
git add documents/site-wide-audit-2026-06-27.md
```

Then read `§5f–§5j` and confirm those five findings are still present:

```
grep -nE '^#+ *5[fghij]' documents/site-wide-audit-2026-06-27.md
```

Expected: five headings. If fewer, `--ours` picked the wrong side — stop and re-check.

- [ ] **Step 4: `CLAUDE.md`, `documents/js-conventions.md`, `.claude/settings.json`, `.gitignore`
      — union by hand.**

These are prose and config; both sides added real content. For `CLAUDE.md` specifically, the NR
branch's copy is the one that documents the current NR architecture — keep all of it, and fold in
`merge/production`'s additions that describe things the merge is bringing in (the `lib-*` partials
model). Do not resolve `CLAUDE.md` by taking one side wholesale.

`CLAUDE.md` carries a `docs-check verified: <commit> <date>` stamp. Leave it stale for now; A7
re-stamps it after the prose has been re-read against the merged tree.

- [ ] **Step 5: `scripts/smoke-pages.mjs` — union the `PAGES` list.**

Both sides added page entries. The merged list must include one entry per template kind on the
merged branch. Check the NR page kinds specifically survive:

```
grep -nE 'neighborhood-reports' scripts/smoke-pages.mjs
```

Expected: at least one report-page URL, one neighborhood-index URL, one topic-index URL. A7
depends on these being present — a smoke run that doesn't load the NR pages cannot catch the
Task A3/A4 breakages.

---

### Task A2: Retired-file modify/deletes

**Files (all resolve as delete):**
- Delete: `themes/dohmh/layouts/nr-output/section.html`
- Delete: `themes/dohmh/layouts/nr-output/single.html`
- Delete: `themes/dohmh/layouts/neighborhood-reports/topiclanding.html`
- Delete: `themes/dohmh/layouts/partials/nr-clickable-uhf.html`
- Delete: `themes/dohmh/layouts/partials/nr-indicator-new.html`
- Delete: `themes/dohmh/layouts/partials/nr-indicator-old.html`
- Delete: `themes/dohmh/layouts/partials/nr-map-highlight.html`
- Delete: `themes/dohmh/layouts/partials/nr-show-zips.html`
- Delete: `assets/js/uhflist.json`

**Depends on:** nothing.
**Leaves for:** A3, which must *not* reintroduce `assets/js/uhflist.js`/`.json` — the merged branch
generates `neighborhoods` from `data/globals/uhflist.json` instead.

- [ ] **Step 1: Confirm each file is genuinely retired before deleting.**

Everything in this list was removed by the Option D swap. Before `git rm`, confirm nothing on the
NR branch still references it:

```
git grep -nE 'nr-clickable-uhf|nr-indicator-new|nr-indicator-old|nr-map-highlight|nr-show-zips|topiclanding|nr-output' -- themes/ assets/ content/ config/
```

Expected: no hits outside comments and this plan. A hit in a live template means the retirement is
incomplete and the delete is wrong — stop and report.

> **Run this sweep against `HEAD`, not the working tree — the 2026-08-17 run shows why.** Mid-merge
> the tree still holds conflict markers, so a grep reports both sides of every unresolved hunk as
> if both were live. It surfaced `{{ partial "nr-show-zips" ... }}` at
> `neighborhood-reports/section.html:101`, which reads as the stop-and-report condition and is not:
> that line sits between `=======` and `>>>>>>> merge/production`, on the side A4 replaces. The
> NR side of the same hunk calls `nr-neighborhood-list` instead. `git grep … HEAD -- themes/`
> answers the question the step is actually asking — which templates *survive* — and returned zero
> callers for all six names, against a positive control of 2 files each for `nr-leaflet`,
> `nr-neighborhood-list` and `nr-neighborhood-picker` `[verified 2026-08-17]`.
>
> Two things that sweep is worth extending to catch, both checked 2026-08-17 and both clean:
> no content file routes to a deleted template (`nr-output` appears nowhere under `content/`, which
> covers the quoted form too — the tree's one `type:` declaration is quoted), and the deletions
> the *merge itself* carries in are separately accounted for. There were three, none of them in
> A2's list: two `air-quality-and-covid-part-2` embeds and one under `healthy-homes-info`, all
> removed by `df7f0fbb6e` on `merge/production`. The two air-quality files are the page-bundle fix
> CLAUDE.md documents — `static/data-stories/…` carries both, and the iframes resolve there. The
> healthy-homes one has no consumer: `healthy-homes.html` contains no `iframe` at all.
>
> `data-stories/cold.html:47` looks like the same defect and is not — its relative
> `<iframe src="source/index.html">` resolves against the published page URL to
> `static/data-stories/cold/source/index.html`, which exists. Do not "fix" it into a bundle path.

- [ ] **Step 2: Delete them.**

```
git rm themes/dohmh/layouts/nr-output/section.html \
       themes/dohmh/layouts/nr-output/single.html \
       themes/dohmh/layouts/neighborhood-reports/topiclanding.html \
       themes/dohmh/layouts/partials/nr-clickable-uhf.html \
       themes/dohmh/layouts/partials/nr-indicator-new.html \
       themes/dohmh/layouts/partials/nr-indicator-old.html \
       themes/dohmh/layouts/partials/nr-map-highlight.html \
       themes/dohmh/layouts/partials/nr-show-zips.html \
       assets/js/uhflist.json
```

- [ ] **Step 3: Confirm the one name-correction carried in `assets/js/uhflist.json` is not lost.**

`hotfix-geo-names` changed exactly one value there: `"Crotona -Tremont"` → `"Crotona - Tremont"`.
The NR branch already made the same correction independently in `data/globals/uhflist.json`.

```
grep -c 'Crotona - Tremont' data/globals/uhflist.json
```

Expected: `2` (the `UHF_name` and the `namezip` field)
`[verified 2026-08-15: count on all four branches — NR data/globals=2, merge/production
assets/js=2, production assets/js=0]`.

If this returns 0, the delete *did* lose the fix and it must be applied to
`data/globals/uhflist.json` by hand before continuing.

---

### Task A3: `head.html` — preserve the uhflist generator through the gating change

This is the load-bearing conflict. Resolving it by taking either side wholesale breaks the branch.

> **A3 COMPLETE 2026-08-17.** All four steps done. Two things the step text did not anticipate:
>
> **Taking `merge/production`'s `head.html` wholesale would have dropped 18 lines that merged
> cleanly.** The conflict is a single hunk — working-tree lines 128–226 are HEAD's blanket library
> block, and theirs' side is *empty* — but the file is 309 lines conflicted and 209 resolved,
> against 191 on `merge/production`. The 18-line difference is the NR branch's site-wide
> `DE_DEBUG` / `debugLog` block, which auto-merged outside the hunk. So the resolution is "delete
> the conflict region", not "check out theirs"; a `--theirs` here silently removes `debugLog` from
> a branch with 55 call sites `[verified 2026-08-17: grep across assets/js and themes/]`. Swept for
> a second definition first, since a duplicate top-level `const debugLog` in a classic script is a
> load-time SyntaxError — exactly one definition exists.
>
> **Step 3 named one stale comment; the defect it describes had four instances.** Three name
> `uhflist.js`, a file the NR branch retired before this merge, so all three were already stale on
> the branch: `nr-leaflet.html:340` (the one named), `nr-report.html:117`, and
> `assets/js/nr-report/global.js:20`. The fourth, `index.html:332`, was made stale *by this task* —
> it describes `head.html`'s `.Kind "page"` gating for a uhflist tag that A3 moved out of
> `head.html` entirely. All four rewritten. Fixing only the named one would have left the branch
> in the state the step exists to prevent.
>
> **Step 4's build had to wait for A5.** A Hugo build aborts on conflict markers, so no build is
> possible until the last conflict is resolved; A3's proof was run after A4 and A5 and covers all
> three. Result exactly as specified: one `js/uhflist-data.0d6ddfbfb4b4d479.js` in the build,
> holding `var neighborhoods = [` and 42 `UHF_id` rows
> `[verified 2026-08-17: isolated production build, exit 0, 0 errors, 1283 EN pages; grep -l over
> the built js/ directory returned exactly one file]`.

**Files:**
- Modify: `themes/dohmh/layouts/partials/head.html` (NR 306 lines, `merge/production` 191,
  `production` 280)
- Create: `themes/dohmh/layouts/partials/lib-uhflist.html` — replacing `merge/production`'s
  version, which loads a file this branch does not have

**Depends on:** A2 (which deletes `assets/js/uhflist.json`).
**Leaves for:** A4, which adds `{{- partial "lib-uhflist.html" . }}` to NR templates and therefore
requires this partial to work without `assets/js/uhflist.js`. Produces the global
`neighborhoods` — an array of rows from `data/globals/uhflist.json`, each carrying `UHF_id` and
`UHF_name`, read by `demographics.js` (`neighborhoods.filter(n => n.UHF_id == geocode)`) and by
`featureDisplayName` in `global.js` (`neighborhoods.find(n => n.UHF_name === displayName)`).

- [ ] **Step 1: Take `merge/production`'s `head.html` as the base, then re-add the NR generator.**

The gating model is the direction of travel; the NR branch's blanket block is what's being
retired. But the NR branch's `head.html` carries one block that is *not* part of the blanket
library block and must survive — the build-time `neighborhoods` generator, at
`themes/dohmh/layouts/partials/head.html:176-184` on the NR branch itself, identified by the
comment "Generated from data/globals/uhflist.json, which is the single source of truth".

**In the conflicted working tree it sits at 177–185**, shifted by a marker
`[verified 2026-08-17: grep in the live merge]` — so search for the comment text, not the line
range. The two lines that matter are the `$uhflist_js := printf "var neighborhoods = %s"`
assignment and the `<script>` tag beneath it; they are what Step 2 relocates.

```
git show feature-MOD-Lab-NR-recode-refactor:themes/dohmh/layouts/partials/head.html | sed -n '174,186p'
```

Read it, then resolve `head.html` to `merge/production`'s version with that block **removed** — it
moves to `lib-uhflist.html` in Step 2, so it is not lost, it is relocated.

- [ ] **Step 2: Rewrite `lib-uhflist.html` to generate from `data/globals/uhflist.json`.**

`merge/production`'s version loads `resources.Get "js/uhflist.js"`, which does not exist on this
branch — a nil resource into `short-fingerprint.html` fails the build. Replace its entire contents
with the NR branch's generator:

```gotemplate
{{- /*  UHF42 neighborhood list (defines the global `neighborhoods`).
        Generated from data/globals/uhflist.json rather than loaded from assets/js/uhflist.js,
        which this branch retired — the JSON is the single source of truth for the 42
        neighborhoods and their names, and the content adapter reads the same file.  */}}

{{- $uhflist_js := printf "var neighborhoods = %s" (jsonify site.Data.globals.uhflist) | resources.FromString "js/uhflist-data.js" | partial "short-fingerprint.html" -}}
<script type="text/javascript" src="{{ $uhflist_js.RelPermalink }}" integrity="{{ $uhflist_js.Data.Integrity }}"></script>
```

- [ ] **Step 3: Fix the stale comment in `nr-leaflet.html`.**

`themes/dohmh/layouts/partials/nr-leaflet.html:340` reads "'neighborhoods' is a variable set in
uhflist.js". After Step 2 it is set in `lib-uhflist.html` from `data/globals/uhflist.json`. Update
the comment to say so. A comment naming a file that no longer exists is what sends the next
reader looking for `assets/js/uhflist.js`.

- [ ] **Step 4: Prove the generator survived — build, then assert the global is emitted.**

Isolated static build (exact form in the Commands appendix). Then, against the built output:

```
grep -l 'var neighborhoods' "$TMP/nr-merge-build/js/"*.js
```

Expected: exactly one generated `uhflist-data.<hash>.js` containing `var neighborhoods = [`. Zero
files means the generator was dropped in Step 1 and the demographics sidebar will silently blank —
`demographics.js` guards on `typeof neighborhoods === 'undefined'` and clears rather than throwing,
so nothing downstream will tell you.

---

### Task A4: Give the four NR templates their library includes

> **A4 COMPLETE 2026-08-17 — but both of its placement instructions were wrong, and for one
> shared reason.** Steps 1 and 2 say to put the includes in `js_bot`. `baseof.html` emits
> `block "main"` at line 23 and `block "js_bot"` at line 29, and `nr-leaflet.html:25` calls
> `L.map(...)` at the top level of an inline `<script>` that `main` renders. A `js_bot` include is
> therefore parsed *after* the call that needs it: `ReferenceError: L is not defined` on the three
> picker/map pages, at load, every time.
>
> The premise underneath both steps is that a library include belongs beside the scripts that use
> it at the foot of the page — true when the consumer is an external script, false when it is
> inline in `main`. That premise came from Task 0.2, which is where the `lib-*` include pattern in
> this plan was first written. **Task 0.2 itself is unaffected**
> `[verified 2026-08-17: congestion-pricing-report.html's main block, lines 1–418, contains no
> `<script>` tag at all; every consumer is an external file loaded in js_bot after the partials]` —
> which is precisely why the pattern looked general.
>
> Two further corrections to the step text:
> - **`nr-report.html` has no `js_bot` block.** A single `{{- define "main" -}}` runs from line 1
>   to `{{- end -}}` at 411, script tags included. The includes went inside `main`, immediately
>   before the ten report-module tags — the position Step 1 intended, under a block name that does
>   not exist in that file.
> - **`section.html`'s two `lib-*` lines came from theirs' side of the conflict**, as the note in
>   Step 2 predicted, but they could not stay where they were: theirs placed them next to a
>   `nr-leaflet` div that the NR side does not have. They moved above the
>   `nr-neighborhood-picker` call, which is what renders `nr-leaflet` on this branch.
>
> Step 3's sweep passes with the counts it predicts — 2 / 4 / 2 / 2. All seven `lib-*` partials
> referenced anywhere in the layouts exist on disk, and all seven that exist are referenced.
> `[verified 2026-08-17: first run of that existence check used `lib-[a-z-]+\.html`, which cannot
> match `lib-d3.html`, and silently reported six of seven; re-run with digits allowed.]`
>
> **Proved against built output, not just the build's exit code** — per page kind, the number of
> times each library is loaded, from an enumeration of every `<script src>` basename rather than a
> guessed pattern:
>
> | page (template) | leaflet | uhflist | vega | arquero | d3 | datatables | `L.map(` after libs |
> |---|---|---|---|---|---|---|---|
> | `/neighborhood-reports/` (section) | 1 | 1 | 0 | 0 | 0 | 0 | yes (531 < 579) |
> | topic index | 1 | 1 | 0 | 0 | 0 | 0 | yes (518 < 568) |
> | neighborhood index | 1 | 1 | 0 | 0 | 0 | 0 | yes (481 < 513) |
> | report | 1 | 1 | 1 | 1 | 0 | 0 | n/a — no inline map |
>
> Every cell matches the requirements table below, with no double-loading and no d3/DataTables
> anywhere `[verified 2026-08-17: isolated production build]`. A first pass at this table read
> vega 0 / arquero 0 on the report page from patterns that could not match `lib-vega-bundle.<hash>.js`
> (hyphen) or `arquero.min.<hash>.js` (the `.min`) — the enumeration replaced the guesswork.

**Files:**
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-report.html` (js_bot block, near the
  `$nrGlobal`/`$nrUrl` resource declarations around line 290)
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-neighborhood-index.html` (which includes
  `nr-leaflet` at line 37)
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-topic-index.html` (which includes
  `nr-neighborhood-picker` at line 64)
- Modify: `themes/dohmh/layouts/neighborhood-reports/section.html` (which includes
  `nr-neighborhood-picker` at line 71 and `overlap-tool` at 119)

**Depends on:** A3 (`lib-uhflist.html` must generate rather than load).
**Consumes:** `lib-leaflet.html`, `lib-vega.html`, `lib-arquero.html`, `lib-uhflist.html` — all
present on `merge/production`, the last rewritten by A3.
**Leaves for:** A7's smoke and characterization runs, which are what prove the includes are right.

Library needs, derived from the globals each page's JS actually calls
`[verified 2026-08-15: git grep for the library globals across assets/js/nr-report/ and the four
templates]`:

| Template | leaflet | uhflist | vega | arquero | d3 | datatables |
|---|---|---|---|---|---|---|
| `nr-report.html` | yes (`map.js`, `L.`) | yes (`demographics.js`, `global.js`) | yes (`chart.js`, `vegaEmbed`) | yes (`app.js`, `chart.js`, `data.js` — `aq.not`, `aq.escape`, `aq.loadJSON`, `aq.desc`) | no | no |
| `nr-neighborhood-index.html` | yes (`nr-leaflet`) | yes (`nr-leaflet` reads `neighborhoods`) | no | no | no | no |
| `nr-topic-index.html` | yes (picker's map) | yes | no | no | no | no |
| `section.html` | yes (picker's map) | yes | no | no | no | no |

`d3` and `datatables` are in no column: `git grep 'd3\.'` and `git grep 'DataTable'` across
`assets/js/nr-report/` both return zero files. Do not add them "to be safe" — the whole point of
the gating refactor is that pages load only what they use.

The QR code library needs no `lib-*` partial. `nr-report.html` already mounts it itself from
`node_modules/qrcode-generator/dist/qrcode.js` at line 361, deliberately, because the template
owns both the `#qrcode` element and the resource.

- [ ] **Step 1: Add includes to `nr-report.html`.**

In the `js_bot` block, **before** the `assets/js/nr-report/` script tags — the report modules call
these libraries at load, so the libraries must be parsed first, the same ordering constraint the
QR library already has:

```gotemplate
{{- partial "lib-leaflet.html" . }}
{{- partial "lib-uhflist.html" . }}
{{- partial "lib-vega.html" . }}
{{- partial "lib-arquero.html" . }}
```

- [ ] **Step 2: Add includes to the three picker/map pages.**

Same block position in each of `nr-neighborhood-index.html`, `nr-topic-index.html`,
`section.html`:

```gotemplate
{{- partial "lib-leaflet.html" . }}
{{- partial "lib-uhflist.html" . }}
```

> **For `section.html`, these two lines already exist on `merge/production`'s side of the
> unresolved conflict** — noticed 2026-08-17 while sweeping for A2, at lines 94–95 of the
> conflicted file, inside the same hunk whose NR side calls `nr-neighborhood-list` where theirs
> calls `nr-show-zips`. So resolving that hunk is not "take the NR side and then add includes":
> it is take the NR side's body **and** theirs' two `lib-*` lines. Read the whole hunk before
> resolving — taking either side wholesale loses one half or the other.

For `nr-topic-index.html` and `section.html` these go **before** the existing
`{{ partial "nr-neighborhood-picker-js" . }}` call — the picker's JS wires the combobox against a
map that Leaflet must already have built.

- [ ] **Step 3: Sweep for any NR template left without includes.**

One labelled sweep across every candidate, rather than four separate greps whose empty results are
easy to misattribute:

```
for f in themes/dohmh/layouts/neighborhood-reports/*.html; do
  printf '%-64s %s\n' "$f" "$(grep -c 'partial "lib-' "$f")"
done
```

Expected, in the glob's alphabetical order:

```
nr-neighborhood-index.html   2
nr-report.html               4
nr-topic-index.html          2
section.html                 2
```

All four read `0` before this task `[verified 2026-08-15: the same sweep on the unmerged branch]`,
which is the breakage this task exists to fix. A zero remaining anywhere afterwards is a page that
will load no libraries.

---

### Task A5: SCSS — `theme.scss` and `_custom.scss`

> **A5 COMPLETE 2026-08-17. Step 3's predicted collision was real** — the one thing in this stage
> that a conflict-marker sweep could never have surfaced, because the two implementations never
> conflicted textually.
>
> After the merge, `theme.scss` defined `.worse::before` / `.better::before` **twice** — two
> identical rule blocks with the same `\f071` / `\f14a` codepoints, each under its own near-identical
> comment. Each side carries exactly one copy; the merge kept both
> `[verified 2026-08-17: '.worse::before' occurs twice in each side's blob and four times in the
> merged file; 'f071' once per side, twice merged]`. Attributed by comment text — the surviving
> block is the NR branch's, identified by its `§4 of the audit` and `cards.js carries the .sr-only
> sentence` references, neither of which appears on `merge/production`. `merge/production`'s copy
> was removed, per this task's own instruction to keep the one whose JS emits the classes.
>
> **Both conflicts were otherwise comment-only, and both sides' comments were factually wrong
> about the merged branch:**
> - `theme.scss`: theirs' comment states `.nr-map-container` "does not exist on this branch" and
>   points at a `d-print-none` wrapper in `nr-output/single.html`. On the merged branch the class
>   is real (`cards.js:265` emits it, `chart.js:233` reads it) and `nr-output/` no longer exists at
>   all — A2 deleted the directory. HEAD's rule was kept and the comment rewritten to say why the
>   rule, rather than a wrapper, is what hides the map.
> - `_custom.scss`: HEAD's comment claims the `.comp-*` markers are "shared by the expanded panel
>   and the print-only header row". They are not — `tertiles.js` returns the class and `cards.js`
>   applies it in exactly one place, `comparisonsHTML`, which is inserted at `cards.js:269` inside
>   the detail panel. The print row carries the pill classes (`.worse` / `.middle` / `.better`)
>   instead. Corrected in both files: the same overclaim appears in `theme.scss`'s surviving block,
>   and fixing one instance while leaving its twin is the failure this plan warns about elsewhere.
>
> Steps 1 and 2 pass as written: three `.nr-report-accordion` occurrences, and the `@media print`
> block hiding `.report-section .collapse` / `.collapsing` intact.

**Files:**
- Modify: `assets/scss/theme.scss` (content conflict)
- Modify: `assets/scss/_custom.scss` (content conflict)

**Depends on:** nothing.
**Leaves for:** A7's print check, which reads `.print-only` and the `@media print` rules, and A7's
`.nr-report-accordion` scope check.

- [ ] **Step 1: Preserve the `.nr-report-accordion` scope.**

`_custom.scss` gained the report page's CSS on 2026-08-15 under a "Neighborhood Reports report
page" heading. Three of those rules are scoped to `.nr-report-accordion` and the scope is
load-bearing: unscoped, `.card-header` repaints every card header on the site
`[verified 2026-08-15: 8 headers on /data-features/realtime-air-quality/ went #EFFAF4 → white with
the scope removed, and back with it restored]`. Whatever the merge produces, the scope must
survive.

```
grep -n 'nr-report-accordion' assets/scss/_custom.scss
```

Expected: at least three occurrences.

- [ ] **Step 2: Union `theme.scss`'s import list.**

`merge/production` changed 71 lines of `theme.scss` and the NR branch has its own `@media print`
block hiding `.report-section .collapse` and `.collapsing`. Both must survive. Confirm after
resolving:

```
grep -nE 'report-section|collapsing' assets/scss/theme.scss
```

Expected: the print block intact — panels never print, whatever the reader expanded.

- [ ] **Step 3: Check for a `.comp-*` / `.worse|.middle|.better` collision.**

`merge/production` ports NR comparison markers to Font Awesome too (commit `4dcbe069ec`). The NR
branch already did this in `_custom.scss` (`.comp-good` `\f14a`, `.comp-bad` `\f071`) and
`theme.scss` (`.worse` `\f071`, `.better` `\f14a`). Two independent implementations of the same
thing will not conflict textually if they landed in different rule blocks.

```
grep -rn 'f14a\|f071' assets/scss/
```

Expected: each codepoint defined once per class. A duplicate definition of the same class is the
tell that both implementations survived — resolve to the NR branch's, which is the one its JS
emits classes for.

---

### Task A6: The duplicate comparison implementation — decision required

> **A6 COMPLETE 2026-08-17 — no decision was required.** Both partials are orphaned on the merged
> branch. The only hit across `themes/`, `assets/`, `content/` and `data/` is a cross-reference
> inside `nr-comparison-label.html:12` naming the other file; no template calls either
> `[verified 2026-08-17: positive control — the same grep for `nr-neighborhood-picker` returns four
> callers, so it finds live callers when they exist]`. Both were byte-identical to
> `merge/production`'s versions, so nothing local was lost. Removed with `git rm -f` — plain
> `git rm` refuses a file the merge has staged as an addition.
>
> The build-time-versus-runtime question the task reserved for Chris therefore never arose: the
> build-time implementation lost its callers when A2 deleted `nr-indicator-new.html` and
> `nr-output/single.html`, and the runtime one in `tertiles.js` is the only survivor.

**Files:**
- Evaluate: `themes/dohmh/layouts/partials/nr-comparison-label.html` (arrives from
  `merge/production`, absent on this branch)
- Evaluate: `themes/dohmh/layouts/partials/nr-tertile-inline-label.html` (same)
- Compare against: `assets/js/nr-report/tertiles.js` (`getTertileSentenceParts`,
  `getTertileInlineLabel`, `getTertileSentence`, `getComparison`)

**Depends on:** A2, A5.
**Leaves for:** A7. Whichever survives, exactly one implementation may emit comparison markup.

These two partials are **not** in the conflict list — they are new files on `merge/production` and
absent here, so they arrive as clean additions. `merge/production` renders the borough/citywide
comparison at build time in Hugo (commit `d021d753e3`); this branch renders it at runtime in JS.
Both survive a merge silently.

- [ ] **Step 1: Establish whether anything on the merged branch calls them.**

```
git grep -n 'nr-comparison-label\|nr-tertile-inline-label' -- themes/
```

The templates that called them (`nr-indicator-new.html`, `nr-output/single.html`) are deleted by
A2. If this returns only the partial files themselves, they are orphaned.

- [ ] **Step 2: Delete the orphans, or stop and report.**

If Step 1 shows no callers:

```
git rm themes/dohmh/layouts/partials/nr-comparison-label.html \
       themes/dohmh/layouts/partials/nr-tertile-inline-label.html
```

If Step 1 shows a live caller, **stop and report** rather than choosing. Build-time versus runtime
comparison rendering is a design decision with consequences for the print rendition and the
accessibility tree, and it is Chris's call, not the implementer's.

---

### Task A7: NR verification sweep

> **A7 RUN 2026-08-17 — eight of nine steps pass. Two items are open and both are Chris's call.**
>
> | Step | Result |
> |---|---|
> | 1 lint | exit 0, **both controls run**: an injected undefined name makes `no-undef` fire (exit 1), a cross-file name does not (exit 0) |
> | 2 build | exit 0 under **both** `production` and `dev_stage`, 0 errors, 1283 EN pages each |
> | 3 smoke | **PASSED, 33/33** |
> | 4 NR characterization | **PASSED, 3/3**, harness self-reported `EHDP-data branch: staging` |
> | 5 demographics sidebar | populated — 8 metric rows with values, `neighborhoods.length === 42` |
> | 6 pagefind | **PASSED** after a re-baseline whose diff was verified item-by-item; see below |
> | 7 print rendition | 25 `.print-only` blocks, QR present, 0 panels and 0 maps visible under print media |
> | 8 a11y | controls passed (axe positive control fired, all 4 rendered controls matched); no new rule ids |
> | 9 CLAUDE.md | prose rewritten, re-stamped, `docs-check` passes |
>
> **Step 3 closes the parked Finding 5 for Stage A.** Smoke was 32 ok / 1 FAIL on
> `merge/production` because `topiclanding.html` loaded `lib-leaflet` without `lib-uhflist`. A2
> deleted that template, and the URL it served is now rendered by `nr-topic-index.html`, which A4
> gave both includes. **Task 0.3 stays open for Stage C** — `merge/production` still carries the
> broken template, so the DE branch will inherit the failure unless it is fixed before C.
>
> **Step 6's 11 differences are all `merge/production` content arriving, not an NR regression.**
> No NR page entered or left the index, and the inverted control (report pages deliberately
> un-indexed) still passes. Attribution: 9 of 12 affected pages have content files this merge
> changes directly; the other three are aggregators — `/data-features/` gains the new
> congestion-pricing-report card, and `/key-topics/airquality/` and `/key-topics/public-space/`
> each gain one because that page's frontmatter carries `categories: airquality, publicspace`
> `[verified 2026-08-17]`. The one-word shift on `/data-stories/urban-heat-island/` traces to
> `data-stories/uhi.html`, which the merge edits. **Re-baselined 2026-08-17 on Chris's instruction**, and the new
> baseline was diffed field-by-field against the old rather than trusted, because `--baseline`
> records whatever it finds and cannot fail. The recapture changes exactly the predicted set and
> nothing else: `pageCount` 201 → 202, `sections.data-features` 26 → 27, one page added
> (`/data-features/congestion-pricing-report/`), 11 pages with changed `words`/`contentHash`, and
> the one query `"neighborhood reports"` 109 → 110. **No page was removed, no
> `neighborhood-reports` page changed at all, and that section's count held at 48** — which is the
> reading that matters, since an NR regression is the only failure this stage could plausibly have
> caused. `--check` then passes against it.
>
> **Step 9: prose updated, stamp left stale on purpose.** Two claims were false after A3 and were
> rewritten: the bullet stating `head.html` gates a library block on page kind and section (it now
> carries no library block at all), and the rationale that the picker JS sits in `js_bot` "because
> flexdatalist is not in `head.html`". A new **Library loading** subsection documents the seven
> `lib-*` partials, the `lib-leaflet` → `lib-easybutton-coloricon` ordering, the `neighborhoods`
> generator, the `main`-versus-`js_bot` placement rule A4 discovered, and the templates that still
> load libraries inline. `docs-check` failed the first draft on four non-repo-relative paths and
> passes now. **Re-stamped 2026-08-17 as
> `fb5b89df64+c59d614716`** — both merge parents, not one commit. The convention is to name the
> commit whose tree the prose was read against; that tree here is the merge of the two, and no
> single existing commit holds it. `docs-check` only checks the stamp is *present*, so the hash is
> a provenance claim for a human reader — and naming either parent alone would point at a tree that
> never carried this prose. Re-point it at the merge commit's own hash if the merge is rebased or
> rewritten.
>
> **Two environment findings, both of which cost a wrong turn here:**
> - **A `hugo serve --environment dev_prod` on :8082 was running throughout, serving the *primary*
>   worktree** (identified by the page requesting `uhflist.<hash>.js`, which only `merge/production`
>   has). `dev-server.mjs` probes only :8080 and :1313, so it correctly refuses to spawn — every
>   harness run in this worktree needs `DE_BASE_URL`. A separate `dev_stage` server was started on
>   :8081 for these checks and stopped afterwards; the user's was left alone.
> - **Git Bash mangles `tasklist /fi` and `taskkill /PID` into paths** (`C:/Program Files/Git/fi`),
>   so both error out and print nothing matching. A "no hugo process is running" reading here was a
>   false null from exactly that. Use the `PowerShell` tool for either command.

**Files:** none modified. This task runs checks.

**Depends on:** A1–A6.

Climb only as far as the change requires — but this change genuinely can break at runtime, in CSS,
and in the search index, so it needs the top of the ladder.

- [ ] **Step 1: Lint — proves no undefined names across the NR global scope.**

```
npm run lint
```

Expected: zero errors. Positive control, because a green run proves nothing on its own — add a
call to a name declared in another file of `assets/js/nr-report/`, confirm lint still passes, then
remove it. That is what proves the directory scan loaded.

- [ ] **Step 2: Build — proves the templates compile and `lib-uhflist.html` resolves.**

Isolated build (Commands appendix). Expected: exit 0. A nil-resource failure here is
`lib-uhflist.html` still pointing at `assets/js/uhflist.js` — go back to A3 Step 2.

- [ ] **Step 3: Smoke — proves the library includes actually landed.**

```
npm run smoke
```

Expected: zero non-allowlisted console errors. **This is the check that catches Task A4 failing.**
A missing include shows as `L is not defined`, `vegaEmbed is not defined` or `aq is not defined`
on the NR page kinds. Note the generic `Failed to load resource` allowlist entry hides the *cause*
of blocked-script failures — if you see a bare `X is not defined`, diagnose with a separate
unfiltered probe rather than trusting the allowlisted output.

- [ ] **Step 4: NR characterization — proves the rendered report is unchanged.**

```
node scripts/nr-characterization.mjs --check
```

Expected: zero diffs across three topic/neighborhood pairs. Written as the `node` form on purpose;
the npm forwarding form loses the flag under PowerShell.

**Read the diff before re-baselining, never instead.** `--baseline` cannot fail — it records
whatever it finds, including three empty pages if the merge broke rendering.

The harness files baselines per EHDP-data branch and the dev server it spawns is `dev_stage`, which
reads `data_branch = "staging"` as of 2026-08-17 (Task 0.1 Step 5) — so this checks against
`scripts/nr-characterization-baseline/staging/`.

**Confirm that directory from the harness's own path construction before trusting a pass.** The
name is right only because the config value happens to be `staging`; it tracks `data_branch`, and
that value was something else earlier the same day. The baseline tree is not present on
`merge/production`, so this could not be checked from here
`[verified 2026-08-17: scripts/nr-characterization-baseline/ does not exist on merge/production]`.
Checking against an empty or wrong baseline directory is a pass that means nothing.

- [ ] **Step 5: Demographics sidebar — the specific thing A3 protects.**

The characterization harness captures the neighborhood header and ZIP list but the demographics
sidebar blanking is exactly the failure that guard hides. Check it directly in the browser:

Navigate to a report page and read the sidebar's metric rows. Expected: populated values, not
empty cells. An empty sidebar with no console error is the A3 failure mode.

- [ ] **Step 6: Pagefind — proves the search index did not shift.**

```
node scripts/pagefind-characterization.mjs --check
```

Expected: zero diffs, and the inverted control asserting the report page is *not* indexed still
passing. The merge touches `head.html` and shared partials, which is exactly this harness's
trigger condition.

- [ ] **Step 7: Print rendition — nothing below a browser proves this.**

Emulate print media and read `document.body.innerText`, which respects `display:none`. Expected:
one shape regardless of what is expanded, the print-only rows present, the QR code present.

- [ ] **Step 8: Accessibility audit — instrument, not gate.**

```
npm run a11y:nr
```

Read `wcag.incompleteIds` in the per-page JSON, not only `wcag.violations` — `color-contrast` sits
in the deferred bucket on all four pages, so a zero there is a floor, not a census. Compare
against the triage in `documents/nr-accessibility-audit-2026-08-10.md`; new findings are a
regression signal, not a new backlog.

- [ ] **Step 9: Re-stamp `CLAUDE.md`.**

Re-read the NR sections against the merged tree — the `head.html` and `lib-*` changes make several
paragraphs describing the library model false. Update the prose, then update the
`docs-check verified: <commit> <date>` stamp. Bumping the stamp without re-reading is a false
claim, not bookkeeping.

```
npm run docs-check
```

Expected: exit 0.

---

## Stage B — `feature-new-data-explorer` ← `production`

22 conflicted files `[verified 2026-08-16: git merge-tree --write-tree --name-only, re-counted.
The 2026-08-15 header read 21 and the self-review repeated it, but B1's file list below has always
had 22 entries — the list was right and the integer was wrong.]` Nine are the same shared-infra set
as A1; thirteen are DE-specific.

### Task B1: DE ← `production`

**Files:**
- The nine shared-infra files from A1 (resolve the same way; nothing replays from rerere, and this
  stage is run with the flag from Global constraints — note the cache's `data-stories/single.html`
  and `realtime.js` recordings appear to come from a merge in *this* stage's shape, so the risk of
  a silent auto-resolution is higher here than in Stage A, not lower)
- Modify: `assets/js/data-explorer/table.js` — 9 hunks, 256 conflicted lines of 1073
- Modify: `assets/js/data-explorer/global.js` — 1 hunk, 169 of 947
- Modify: `assets/js/data-explorer/app.js` — 1 hunk, 162 of 801
- Modify: `assets/js/data-explorer/data.js` — 1 hunk, 66 of 920
- Modify: `themes/dohmh/layouts/data-explorer/single.html` — 1 hunk, 1109 of 1236
- Modify: `themes/dohmh/layouts/data-explorer/data-index.html` — 14 lines
- Modify: `themes/dohmh/layouts/data-explorer/indicator-catalog.html` — 10 lines
- Modify: `themes/dohmh/layouts/data-explorer/section.html` — 12 lines
- Modify: `themes/dohmh/layouts/data-stories/single.html` — 23 lines
- Modify: `themes/dohmh/layouts/partials/heat-report-correction.html` — 99 of 192
- Modify: `content/data-explorer/carbon-monoxide-poisoning.md` — 2 hunks, 27 of 85
- Modify: `content/data-explorer/childhood-lead-exposure.md` — 5 of 66
- Delete: `assets/scss/_custom.scss` (modify/delete — see Step 3)

**Depends on:** nothing. Independent of Stage A.
**Leaves for:** C1, whose merge-base becomes `production`'s tip
`[verified 2026-08-15: git merge-base of a simulated merge commit against merge/production returned
f2d04146b1, identical to git rev-parse production]`.

Resolve by taking the DE version and re-applying production's changes, which are seven named
commits totalling +217/−98 across these paths — against the DE branch's +10,812/−7,206. You are
porting seven small changes into a rewrite, not reconciling two large files.

- [ ] **Step 1: Read production's seven commits before resolving anything.**

```
git log --oneline --no-merges $(git merge-base production feature-new-data-explorer)..production -- assets/js/data-explorer/ themes/dohmh/layouts/data-explorer/ themes/dohmh/layouts/data-stories/single.html themes/dohmh/layouts/partials/heat-report-correction.html content/data-explorer/
```

Expected, in order:

```
4a3185e056  replacing exotic unicode with regular unicode
dd16987cad  correcting extraneous double spaces
c03635c51e  Add Arquero script to data index, indicator catalog, and de section page
05db5fd1cc  don't render vertical bar on last 311 item
a0ce013172  Defer Datawrapper embeds in hidden tabs until their tab is shown
4c06062296  neighborhood gouping by borough - toggleable
3eec76d023  change sort column, and prep for adding sort column name
```

For each, decide: still applies to the rewritten explorer, or superseded. Record the decision per
commit in the ledger — the next session cannot re-derive it.

> **Step 1 DONE 2026-08-17. Five of the seven are superseded; two must be ported.** The command
> above was re-run against `production` at `c0931fbee6` and returns the same seven hashes in the
> same order, so the drift recorded in the ledger does not touch this step. Each verdict was
> reached by reading the DE branch's own code, not by reasoning from the commit message:
>
> | Commit | Verdict | Evidence |
> |---|---|---|
> | `4a3185e056` exotic → regular unicode | **PORT** | Content-only, and the DE branch predates it. Two of its files conflict (`carbon-monoxide-poisoning.md`, `childhood-lead-exposure.md`); the other 15 auto-merge |
> | `dd16987cad` extraneous double spaces | **PORT** | Same shape — whitespace normalisation in content plus one line of `data-explorer/single.html` |
> | `c03635c51e` Arquero include | **SUPERSEDED** | The DE branch loads Arquero through its own partial in all four templates `[verified 2026-08-17: git grep -n 'lib-arquero' on the branch returns data-index.html:4, indicator-catalog.html:21, section.html:4, single.html:5]`. This is also the fix for audit §5f, which is why A1 dropped that `KNOWN_NOISE` entry |
> | `05db5fd1cc` no vertical bar on last 311 item | **SUPERSEDED** | The DE branch split `draw311Buttons` out of `data.js` into `311.js` and the fix is already there, comment wording included `[verified 2026-08-17: 311.js:68 reads `let verticalBar = (i < filteredCrosswalk.length - 1) ? ' | ' : '';`, and `grep -c draw311Buttons` on the branch's data.js returns 0]` |
> | `a0ce013172` defer Datawrapper embeds in hidden tabs | **PORT — this is the one that matters** | `assets/js/data-stories/lazy-tab-embeds.js` does not exist on the DE branch `[verified 2026-08-17: git cat-file -e on the branch fails]`, and the branch has no other lazy-tab mechanism `[verified 2026-08-17: git grep -n 'lazy-tab-embeds|lazyTab' across themes/ and assets/ returns nothing]`. The `.js` file itself is an add-on-one-side and arrives clean; the `<script>` block in `data-stories/single.html` is inside a conflict and is what can be lost. Dropping it re-opens audit §5b — up to ~190 console errors per load on four data-stories pages |
> | `4c06062296` borough grouping, toggleable | **SUPERSEDED** | The DE branch implements the same feature under its namespaced state `[verified 2026-08-17: app.js:608 binds `#groupByBoroughToggle`, global.js:30 declares `groupByBorough: true`, table.js:630 branches `tableOrderFixed` on it]`. This is Step 2's question, answered: take the DE side for all nine `table.js` hunks |
> | `3eec76d023` change sort column | **SUPERSEDED** | The DE branch carries both halves — `sortBy` and the `sortName` lookup — and improves on them: production hard-codes `sortBy = 2`, the DE branch picks 3 or 8 depending on whether borough grouping is on `[verified 2026-08-17: table.js:601-602]`. Taking the DE side also avoids re-importing the bare `console.log` this commit uncommented, which the DE branch replaced with `debugLog` |
>
> **The net porting job for Step 1 is therefore two commits, not seven,** and only one of them is
> functional. Steps 2 and 4 below both resolve to "take the DE side" as a result — their questions
> are answered here, so run them as confirmations rather than investigations.

- [ ] **Step 2: `table.js` — the one real merge.**

Both sides have borough-grouping code: 35 references on the DE branch, 33 on production
`[verified 2026-08-15: git grep -c -i borough on both]`. Determine first whether these are the same
feature arrived at twice or two different behaviors, by reading `4c06062296`'s diff against the DE
branch's implementation:

```
git show 4c06062296 -- assets/js/data-explorer/table.js
```

If the DE branch already implements the toggle, take the DE side for all 9 hunks and record that
`4c06062296` is superseded. If it does not, port the toggle. Do not merge hunk-by-hunk without
answering this — nine independent hunk decisions on one feature is how half a feature lands.

- [ ] **Step 3: `_custom.scss` — resolve the modify/delete deliberately.**

The DE branch split `_custom.scss` into `__portal-custom.scss` + `_de-custom.scss`. Git followed
the rename into `__portal-custom.scss` *and left production's `_custom.scss` in the tree*. Commit
as-is and the branch ships both.

```
git rm assets/scss/_custom.scss
grep -n 'custom' assets/scss/theme.scss
```

Expected after: `theme.scss` imports `__portal-custom` and `_de-custom`, and no import of
`_custom`. Then confirm production's 2-line change to `_custom.scss` landed in its new home —
`git show $(git merge-base production feature-new-data-explorer)..production -- assets/scss/_custom.scss`
shows what to look for.

- [ ] **Step 4: `single.html` — a large conflict block with a small decision.**

1109 of 1236 lines conflict, but production changed only 22 lines of this file while the DE branch
moved 1406 lines out of it. Take the DE version, then check whether production's 22 lines
(from `c03635c51e`, the Arquero include) are still needed — the DE branch has its own `lib-*`
partials, so this may already be solved.

```
git show c03635c51e -- themes/dohmh/layouts/data-explorer/single.html
git grep -n 'lib-arquero' feature-new-data-explorer -- themes/dohmh/layouts/data-explorer/
```

If the DE branch already includes `lib-arquero.html`, record `c03635c51e` as superseded.

- [ ] **Step 5: `nr-indicator-new.html` — take `production`'s side wholesale.**

Not in B1's original file list; it became a conflict when PR #1461 landed on `production` (see the
ledger). The two sides are not comparable in kind. `production` rewrote the partial's behaviour
across three commits — `4dcbe069ec` ported the comparison markers to Font Awesome, `d021d753e3`
moved the borough and citywide comparison from an inline `<script>` to build-time Hugo, and
`d320fe7726` fixed inherited bold and resize values. The DE branch's only change to the file is
`9f50307a62` "mostly formatting and spacing": re-indentation, tag-boundary reflow, and five
`var` → `let` conversions — three of them inside the very `<script>` block `d021d753e3` deletes.
A `-w` diff does not settle this, because the reflow moves `>` and element content between lines
and survives whitespace folding. What settles it is comparing the semantic content as sets: the
two blobs hold **identical** Hugo expressions, `class` attributes and `id` attributes
`[verified 2026-08-17: grep -oE of `{{...}}`, `class="..."` and `id="..."` from each blob, sorted
and diffed — 109/109, 54/54, 10/10, zero differing lines; `var` count 5→0 and `let` count 7→12.
The same probe run against the base-vs-`production` pair, which is known to differ, returns 37, 14
and 4 differing lines, so it is not reporting zero because it cannot fire]`.

```
git checkout --theirs themes/dohmh/layouts/partials/nr-indicator-new.html
git add themes/dohmh/layouts/partials/nr-indicator-new.html
```

Expected after: the file contains no `boroJudgement` or `cityJudgement` identifier — those live in
the inline script `production` removed. If they are still there, `--theirs` took the wrong side.

- [ ] **Step 6: carry this document across to the DE branch.**

`production` does not have this file, so the merge leaves the DE branch's 2026-08-15 original in
place and the branch ends Stage B with a ledger that shows Stage A as unstarted. Copy the
`merge/production` copy over the DE worktree's before finishing the merge:

```
cp documents/nr-de-merge-integration-plan-2026-08-15.md    ../EH-dataportal.worktrees/feature-new-data-explorer/documents/
```

Expected after: `git diff --stat` of the two working copies is empty. This makes the same document
conflict in Stage C that C1 already expects, which is the intended outcome — a conflict between two
current copies is resolvable; a silent 971-line regression is not.

### Task B2: DE verification sweep

**Depends on:** B1.

**All five steps run 2026-08-18. Full results, and the three corrections they forced, are in
"What B2 actually verified" near the top of this document — read that, not just these boxes.**

- [x] **Step 1:** `npm run lint` — **0 errors over 16 files**. The step's positive control as
      written here was wrong: a name declared in another `assets/js/data-explorer/` file
      **cannot** raise `no-undef`, because `eslint.config.mjs` injects that directory's
      top-level declarations as shared globals. That form is the right control for A7 Step 1's
      property ("the directory scan loaded"); to prove `no-undef` is live, use a name declared
      nowhere.
- [x] **Step 2:** Isolated build — **exit 0**, 0 ERROR, 1 benign WARN, 1330 EN pages,
      `resources/` untouched.
- [x] **Step 3:** **33 ok, 1 FAIL of 34.** Baseline established for this branch. The FAIL is
      Finding 6 and is **proven pre-existing** against a pre-merge control worktree.
      **`npm run smoke` bare did not work at the time** — `dev-server.mjs` spawns `dev_stage`,
      which could not then build on this branch, so B2 served `development` and passed
      `DE_BASE_URL`. **That constraint lifted 2026-08-18**; see Task C3.
- [x] ~~**Step 4:** `node scripts/pagefind-characterization.mjs --check`~~ — **STRUCK.** The
      script exists on no branch this plan merges.
- [x] **Step 5:** Browser check — map, table and trend all render, and all three **re-render** on a
      CD→UHF42 geography switch (table 66 → 49 rows). Needs a viewport ≥ the `md` breakpoint: the
      geo control sits inside `#detailsContent.collapse.d-md-none`. **`npm run characterize:de`
      is non-functional on this branch** — it was written against a different explorer and waits on
      DOM this branch never produces. Do not read its failure as a regression signal, and do not use
      it as this step's proof. (It is also spelled `characterize`, not `characterize:de`, in the
      merged `package.json`.)

---

## Stage C — `feature-new-data-explorer` ← `merge/production`

**Re-derived 2026-08-18 against the committed Stage B merge: 19 conflicted files, not 36.** The
36 was measured on 2026-08-16, when the merge-base was still the older `production` and Stage B's
set was re-presented; with `eda7c256c5` in place the base is `c0931fbee6` and most of that set is
gone `[verified 2026-08-18: git merge-tree --write-tree --name-only merge/production
feature-new-data-explorer, run in the DE worktree, lists 19 paths]`. The set is:

- **Four DE JS files** — `disparities.js`, `map.js`, `print.js`, `trend.js` (one line each).
- **Five `data-features` templates** — `fvi`, `minimum-wage-with-maps`,
  `rats-in-your-neighborhood`, `realtime`, `rmz` (Step 2).
- **Three `nr-*` partials** — `nr-clickable-uhf.html`, `nr-map-highlight.html`,
  `nr-show-zips.html` (Step 1).
- **Seven files Stage B also conflicted on, because `merge/production` changed them too** —
  `.claude/settings.json`, `.gitignore`, `CLAUDE.md`, `package.json`, `package-lock.json`, and
  `data-explorer/`'s `data-index.html` and `section.html`. Stage B's resolutions for these are
  recorded above and are the starting point, not the answer: the incoming side is different.

**Two files the older count named are not in it, and each changes a step:**

- **`nr-indicator-new.html` does not conflict — it is byte-identical on all three branches**
  `[verified 2026-08-18: git rev-parse on each of production, merge/production and
  feature-new-data-explorer returns blob 5d87670af3]`. Stage B carried `production`'s rewrite of
  it onto the DE branch (it was Stage B's 23rd conflict). **Step 1 covers three partials, not
  four.**
- **`config/dev_stage/config.toml` does not conflict, and that is the trap.** `production` and
  `merge/production` both read `data_branch = "staging"`, so the incoming side changed nothing
  relative to the base and git keeps the DE side — `data_branch = "feature-new-data-explorer"` —
  with no prompt `[verified 2026-08-18: git show <branch>:config/dev_stage/config.toml on all
  three; the path is absent from the merge-tree conflict list]`. **Step 3 is therefore an explicit
  edit after the merge, not a conflict resolution**, and doing nothing leaves the DE-pinned `dev_stage`
  environment in place. `config/local_stage/config.toml` has the identical shape and the same
  DE-side pin, and is likewise untouched by the merge.

**Run Stage C only after Stage B has verified.** Its merge-base is `production`'s tip, so none of
Stage B's resolutions are re-presented.

### Task C1: DE ← `merge/production`

**Depends on:** B2 verified.

> **Two documents conflict in this merge and neither appears in the steps below. Resolve both
> before anything else, the way Stage A's header directs for the same reason: one of them is the
> ledger the rest of the stage writes into.** Stage A had to discover this the hard way — the plan
> document was its unlisted 23rd conflict.
>
> - **This plan document resolves like Stage A's did: take `merge/production`'s copy whole**
>   (`git checkout --theirs`). The DE branch carries a stale snapshot predating Stage 0
>   `[verified 2026-08-17: 863 lines on `feature-new-data-explorer` against 1767 on
>   `merge/production`]`. It is the maintained copy and the DE branch has no records of its own in it.
> - **`CLAUDE.md` does *not* resolve that way — it needs a hand-merge**, as A1 Step 4 did for the
>   NR branch. Both sides carry real, divergent content
>   `[verified 2026-08-17: 139 lines on the DE branch against 192 on `merge/production`]`, and the
>   DE copy is the *smaller* of the two, so a side-take silently drops whichever half loses.
>   Re-stamp `docs-check verified:` only once the merge commit exists, or name both parents.
>   **This already went wrong once, in Stage B** — taking one side whole dropped the `source-roots`
>   line as well as the stamp, which does not fail the check but silently removes the file from it.
>   Before resolving, list the `<!-- docs-check … -->` lines on **both** sides and reconcile them
>   deliberately; see "The docs-check stamp did not survive the merge".
>
> **Stage B hits the second of these too**, before ever reaching Stage C: `production`'s
> `CLAUDE.md` is 189 lines against the DE branch's 139. `production` does **not** carry this plan
> document, so Stage B leaves it alone.
>
> **Do not copy this document into the DE worktree in order to read it while working.** Keep
> `merge/production` checked out in the primary tree and read it from there — the arrangement the
> Stage A header prescribes. Copying it in early manufactures the divergence you would then have to
> resolve. At commit time the Stage A ordering applies again: commit plan updates on
> `merge/production` first, refresh the merge worktree's staged copy from that commit, then commit
> the merge.

- [ ] **Step 1: The four `nr-*` partials resolve differently here than in Stage A.**

Unlike the NR branch, the DE branch still *has* `nr-clickable-uhf.html`, `nr-indicator-new.html`,
`nr-map-highlight.html`, `nr-show-zips.html` — these are content conflicts, not modify/deletes.
Take `merge/production`'s side: the DE branch has no NR work of its own, and these files are on
their way to being retired by Stage A anyway.

- [ ] **Step 2: The five `data-features` templates are two versions of the same refactor.**

`merge/production` adds `lib-*` includes; the DE branch already has its own. Reconcile so each
template includes exactly the libraries it uses, with no duplicate include. Sweep after:

```
for f in themes/dohmh/layouts/data-features/*.html; do
  d=$(grep -o 'partial "lib-[a-z-]*' "$f" | sort | uniq -d)
  [ -n "$d" ] && printf '%-58s DUPLICATE: %s\n' "$f" "$d"
done
```

Expected: no output. Any line printed is a template including the same library twice.

- [ ] **Step 3: `config/dev_stage/config.toml`.**

A one-line conflict. **The answer is `data_branch = "staging"`, and it is settled — but read why
before resolving, because the reasoning is what tells you whether it is still right.**

On 2026-08-16 this file read `data_branch = "hotfix-geo-names"`
`[verified 2026-08-16: config/dev_stage/config.toml:3]`, and the 2026-08-15 draft's instruction to
confirm `"staging"` survives would have overwritten that pinned value while looking like a
correctness check. Chris changed it to `staging` on 2026-08-17 as Task 0.1 Step 5, because
`hotfix-geo-names` lacks the sentence-cased report filenames and no `dev_stage` build against it
succeeds. So the value the 2026-08-15 draft would have produced by reflex is the value that is now
correct, for a reason it did not know.

Resolve to `staging`. If you find any other value on either side, stop — it means something changed
after 2026-08-17, and Task 0.1 Step 5 is the record to re-read, not this line.

**Amended 2026-08-18: the DE side of this conflict reads `data_branch = "feature-new-data-explorer"`,
and that is expected, not the stop condition above.** The stop rule was written about
`merge/production`'s side. The DE branch has pinned its own EHDP-data branch here for as long as
it has existed `[verified 2026-08-18: config/dev_stage/config.toml:3 on feature-new-data-explorer;
config/local_stage/config.toml carries the same value]`. Stop only if **`merge/production`'s**
side is something other than `staging`.

**Superseded 2026-08-18 — this step does not fire, and the decision went the other way.** Two
things changed at once:

- **There is no conflict to resolve.** `production` and `merge/production` both already read
  `data_branch = "staging"`, so the incoming side changed nothing relative to the merge-base and
  git kept the DE branch's own `data_branch = "feature-new-data-explorer"` without prompting.
  Re-pointing it would have been a deliberate edit to an unconflicted file, not a resolution.
- **Chris decided 2026-08-18 to leave both pins alone** — `config/dev_stage/config.toml` and
  `config/local_stage/config.toml` keep `feature-new-data-explorer` — **and to fix the EHDP-data
  side instead**, by re-exporting those 26 report files from Linux or `git mv`-ing them on that
  branch so the case-only renames actually land. This keeps the DE branch's per-branch data
  isolation, which re-pointing at `staging` would have given up.

**Consequences for C3, which are the reason this is recorded rather than struck:**

- ~~**`dev_stage` stays red on the DE branch until that EHDP-data work is done.**~~ **Overtaken
  2026-08-18 — it went green with the pin unchanged.** See "`dev_stage` went green on the DE
  branch" under Task C3. The old signature, for whoever meets it again: five `Unable to get
  remote resource` warnings and four `ERROR render` lines at `nr-output/single.html:419`.
- ~~**So C3 must not use `scripts/dev-server.mjs`'s own spawn.**~~ **Also overtaken** — C3 Step 3
  ran bare `npm run smoke` against a reused `dev_stage` server and passed 35 of 35. The
  `development` + `DE_BASE_URL` form B2 Step 3 used still works and reads production data.
- **The `dev_stage` build check was a gate on the EHDP-data fix, not on this merge**, and it now
  passes. Task 0.1 Step 5 is closed on the strength of it — see Task C3.

Hold the value deliberately whatever it is — but **not for the reason this paragraph used to
give.** It said "the characterization harnesses file baselines per EHDP-data branch, so changing
this silently refiles every result against a different baseline directory". That is true of
`nr-characterization.mjs`, which lives on the **NR** branch and keys on the branch name
(`scripts/nr-characterization.mjs:345`). It is **not** true of either harness that exists on the
DE branch: `de-characterization.mjs:44` and `cp-characterization.mjs:46` both hardcode a single
baseline directory `[verified 2026-08-18: grep -rn data_branch scripts/ on the DE worktree returns
0 hits, while the same string returns 1 in config/dev_stage/config.toml — so the search can
match]`. **The real hazard here is worse, not milder:** with no key at all, a data-branch change
invalidates the DE baselines with nothing to notice it by. The pins stayed for the isolation
reason above; this second reason does not apply on this branch.

### Task C2: DE gating reconciliation

**Depends on:** C1.

- [ ] **Step 1: `head.html` sweep.**

DE's `head.html` is 211 lines, `merge/production`'s 191, production's 280 — the two are close
because both did this refactor. After resolving, confirm no library block remains in `head.html`:

```
grep -inE 'leaflet|vega|arquero|d3|datatables|uhflist' themes/dohmh/layouts/partials/head.html
```

Expected: no hits. `merge/production`'s `head.html` returns zero here
`[verified 2026-08-15]`.

- [ ] **Step 2: Every page template includes what it uses.**

One labelled sweep, per the audit rule — derive the candidate list from the template directory,
not from what has already been flagged:

```
for f in $(git ls-files 'themes/dohmh/layouts/**/*.html' | grep -vE 'partials/|shortcodes/'); do
  printf '%-72s %s\n' "$f" "$(grep -c 'partial "lib-' "$f")"
done
```

Read the zero rows and confirm each is a page that genuinely uses no library. This is the sweep
that would have caught the NR breakage in Stage A.

> **A non-zero count is not enough — check *where* the includes sit. Stage A's A4 got this wrong
> and would have shipped three broken pages.** `baseof.html` renders `block "main"` before
> `block "js_bot"`, so a `lib-*` partial included in `js_bot` is parsed *after* any inline
> `<script>` that `main` emitted. On the NR side `nr-leaflet.html` calls `L.map(...)` at the top
> level of such a script, so the include had to go in `main`, above the markup that renders it.
>
> The DE templates are the likelier place for this to bite again, not the less likely:
> `data-explorer/single.html` defines `renderIndicatorDropdown` and friends in inline
> `<script>` blocks precisely because they read markup Hugo has to render first. **For each
> template the sweep reports, find the earliest thing on the page that touches the library and
> confirm the include precedes it.** A page whose consumers are all external scripts in `js_bot`
> is fine either way — that is why the pattern looked general when Task 0.2 established it.
>
> Cheapest proof, from the built HTML rather than the template: for each page kind, compare the
> line number of the library's `<script src>` against the first line calling into it. A4's is
> recorded above with a worked table.

### Task C3: DE verification sweep

**Depends on:** C2. Same five steps as B2, plus Step 6. **ALL STEPS RUN. Steps 1, 2, 3 and 6 ran
2026-08-18 against the committed merge `3210c5ee87`; Step 5 ran 2026-08-19 against `5001fed68b`,
which is that merge plus one settings-only commit. Step 4 is struck. C3 is closed, and with it this
plan's task list.**

- [x] **Step 1:** `npx eslint assets/js/data-explorer -f json` — **16 files, 0 errors, 0 warnings**
      `[verified 2026-08-18 on 3210c5ee87]`. Use B2's correction, not this plan's original control:
      a name declared in another `assets/js/data-explorer/` file cannot raise `no-undef`.
- [x] **Step 2: DONE — exit 0, 0 ERROR, 1 benign WARN, 1326 EN pages in 31.1s**, matching C1's
      recorded figure exactly `[verified 2026-08-18: HUGO_RESOURCEDIR=<temp> npx hugo
      --environment production -d <temp> in the DE worktree, run deliberately *beside* Chris's
      live dev_stage server on :8080]`. The 1330 B2 recorded is not the comparison — see the
      unattributed-count note above.
- [x] **Step 3: DONE — 35 of 35, exit 0**, matching the corrected prediction exactly
      `[verified 2026-08-18: npm run smoke in the DE worktree, reusing Chris's dev_stage server on
      :8080; "Smoke test PASSED — 35 pages clean (known noise allowlisted)"; output saved]`.
      `neighborhood-reports/active_design_physical_activity_and_health/` is **ok**, which is the
      page both Findings 5 and 6 were on — so both are confirmed cleared at runtime, not just by
      inspection. `(home)` also passed, so the intermittent airnowapi.org CORS noise did not fire.
      **This ran under `dev_stage`, i.e. STAGING data** — legitimate for this harness, which reads
      console errors rather than content (`scripts/dev-server.mjs` header), but name the
      environment in any claim built on it.
- [x] ~~**Step 4**~~ — STRUCK, as at B2. The script exists on no branch this plan merges.
- [x] **Step 5: DONE — all three render, and all three are rebuilt on a CD→UHF42 switch**
      `[verified 2026-08-19 at a 1440x900 viewport on data-explorer/asthma/?id=2380, served by
      Chris's live dev_stage server on :8080 from the DE worktree at 5001fed68b]`. No renderer check
      is owed: Chris's option-1 decision spun the SVG rollout out as separate work, and the trend
      does still draw to a **canvas**, as expected.

**The worktree is one commit past the merge, and that commit is site-inert.** Steps 1, 2, 3 and 6
ran on `3210c5ee87`; the tree Step 5 was served from is `5001fed68b`, whose entire diff is one
deleted line in `.claude/settings.json` — no content, template, asset or config path
`[verified 2026-08-19: git show --stat 5001fed68b is 1 file, 1 deletion]`. So the runtime result
carries back to the merge commit.

| Signal | CD (start) | UHF42 (after switch) | back to CD |
|---|---|---|---|
| URL `GeoType=` | `CD` | `UHF42` | `CD` |
| Map shapes (`.leaflet-overlay-pane path`) | **59** | **42** | **59** |
| Table `tbody` rows | **66** | **49** | — |
| Trend canvas | 425x469, hash `3803aa50` | 425x469, hash `3803aa50` | 425x469, hash `3803aa50` |
| Trend canvas *element* | tagged | — | **replaced** |

Map and table match B2's recorded numbers exactly (59 CD shapes / 66 rows to 42 / 49), and 59 and 42
are the right counts for community districts and UHF42 neighborhoods. The table's UHF42 rows carry
UHF names (`Kingsbridge - Riverdale`, `Northeast Bronx`) and the filter chip reads `2023 | UHF42 |
Synced`, so it is the geography that changed and not just the row count.

**The trend's pixel output does not change on a geotype switch, and that is by design, not a stale
view.** The pane's own copy says the trends view aggregates neighborhood data to the Borough level,
and `assets/js/data-explorer/trend.js:206` branches on the trend's **own** comparison control
(`compName[0] === "Boroughs"`), not on the map's `GeoType`. Three separate checks say the view is
nonetheless torn down and rebuilt on the switch:

- **Element identity.** The canvas element carrying a tag before the switch is gone after it — Vega
  built a new one. Negative control: the tag survives a no-op read on the same element, so `false`
  means replacement and not tag loss.
- **A validated content probe.** An FNV hash over the canvas pixels moves `3803aa50` -> `8bf7a8a5`
  when the trend's Age comparison is selected, and returns to `3803aa50` when Geography is restored.
  So the probe can see a repaint; it reports "unchanged" across the geotype switch because the
  drawing genuinely is the same.
- **A warning ledger that agrees.** Vega emits the same three warnings per trend render; the session
  ended with 18, which is exactly 6 renders x 3, and 6 is the number of times the trend was drawn
  (first tab open, two geotype switches, one tab re-open, two comparison-pill clicks).

**A metric B2's Step 5 leaned on is dead on this page: non-transparent pixel count.** It read
199,325 at every single measurement — which is 425 x 469 exactly, the whole canvas, because Vega
paints an opaque background. It cannot vary, so it can neither confirm nor deny a repaint. The hash
is what carries the signal. (B2's own numbers came from a differently-defined count and are not
comparable; what B2 recorded as trend re-render evidence was largely a **size** change, 657x804 to
425x469, which is pane layout rather than data.)

**The table is lazy and holds the previous geography while its pane is hidden.** Measured at the
moment of the switch with the trend tab active, the table still read 66 rows; it re-rendered to 49
on being shown. Not a defect — but a check that samples a hidden pane will read a stale value, so
show the pane before measuring it.

**Console held exactly 4 errors from first load to last interaction, all four the pagefind
MIME-type/404 entries** that `hugo serve` always produces because it never builds pagefind. No new
error appeared at any point in the sequence. The only non-Vega warning was one Canvas2D
`willReadFrequently` notice raised by the probe itself.

**Unrelated finding, on the DE branch and outside this plan's scope: `.claude/settings.json` is now
invalid JSON.** `5001fed68b` deleted the `"defaultMode": "default"` line but left the comma on the
preceding `]`, so the file fails to parse at line 108
`[verified 2026-08-19: JSON.parse reports "Expected double-quoted property name in JSON at position
3176 (line 108 column 3)"]`. It is a one-character fix and it is Chris's call whether it rides with
this branch's work or goes in alone.
- [x] **Step 6: DONE, and it found a gap.** `npm run smoke` is the gate for the gating refactor
      across every page kind, not just the explorer, so a page kind absent from `PAGES` is not
      covered — and the `PAGES` comments are claims that rot like doc prose.

**Step 6's finding: 5 of the 8 `data-features` templates this merge changed have no `PAGES` entry.**
The step as written said "the five templates touched in C1 Step 2", which is the *conflict* list.
The set that matters is the set the merge actually changed, and it is eight — a conflict can
resolve to the first parent's bytes, and a file that never conflicted can still change. Derived by
mapping each changed template to its content URL through its `layout:` frontmatter, then testing
that URL against `PAGES`:

| Template | Content URL | In `PAGES`? |
|---|---|---|
| `aqe.html` | `data-features/neighborhood-air-quality` | **no** |
| `asthma-syndrome.html` | `data-features/asthma-syndrome` | **no** |
| `congestion-pricing-report.html` | `data-features/congestion-pricing-report` | yes |
| `hvi.html` | `data-features/hvi` | **no** |
| `leading-causes.html` | `data-features/leading-causes` | **no** |
| `minimum-wage-with-maps.html` | `data-features/minimum-wage` | **no** |
| `realtime.html` | `data-features/realtime-air-quality` | yes |
| `rmz.html` | `data-features/rat-mitigation-zones` | yes |

`[verified 2026-08-18 on 3210c5ee87: git diff --name-only eda7c256c5 3210c5ee87 --
themes/dohmh/layouts/data-features/ lists the eight; each layout name grepped against content/
frontmatter returns exactly one page, so the mapping has no holes; and two independent checks
agree on all eight verdicts — a parse of the PAGES array compared by normalized URL, and a bare
grep of scripts/smoke-pages.mjs per URL returning 0/0/1/0/0/0/1/1. The three yes rows are the
grep's positive control]`.

**`minimum-wage-with-maps` is the one that matters most**, because C1 Step 2 deliberately dropped
a `lib-topojson` include from it. That decision currently rests on a clean build and the C2
ordering sweep, and on no runtime check at all — smoke never loads the page.

**This is the third instance of the pattern the Self-review already names** (Findings 4 and 5): a
missing-coverage defect found by a check aimed at something else. Closing the gap is five `PAGES`
lines; whether to add them *before* Step 3 runs, or raise them as separate work, is a decision for
Chris — adding them moves the expected count again and puts five never-smoked pages into the gate
at once, which may surface failures that have nothing to do with this merge.

**Step 3's expected count moved from 34 to 35, and the plan's old number was measured on a
different harness.** The merge took `merge/production`'s `PAGES` addition of
`data-features/congestion-pricing-report/`, so the array holds 35 entries where B2 measured 34
`[verified 2026-08-18: 34 entries at eda7c256c5, 33 at 4a260ea2a1, 35 at 3210c5ee87; the merge's
diff of scripts/smoke-pages.mjs is 1 insertion and touches no KNOWN_NOISE entry]`. Smoke reports
against `PAGES.length` (`scripts/smoke-pages.mjs:148,151`), so a run that reads "of 34" means the
wrong tree is being served.

### `dev_stage` went green on the DE branch, and that retires four warnings in this plan

**The premise behind C1 Step 3, B2 Step 3 and this task's original Step 3 is no longer true.**
All three rest on "`dev_stage` cannot build on `feature-new-data-explorer`, because that
EHDP-data branch never received the 2026-08-17 case-only rename export". On 2026-08-18 Chris
built and served `dev_stage` from the DE worktree on :8080, and it works
`[verified 2026-08-18: hugo serve --environment dev_stage -p 8080, PID 41940, answers 200 on
/dev-stage/; the DE worktree's newest resources/_gen file is stamped 22:21 against the main
worktree's 18:00, so the server is that worktree's; config/dev_stage/config.toml:3 still reads
data_branch = "feature-new-data-explorer" and the worktree is clean, so no pin was changed;
npm run smoke then loaded all 35 pages from it, including the four nr-output report pages whose
report_topic JSON was the original failure]`.

**What changed on the EHDP-data side, from Chris 2026-08-18:** he deleted his local copy of
EHDP-data's `feature-new-data-explorer`, recreated a branch of that name off EHDP-data's
`production`, set its upstream to the existing origin branch, re-ran the exports **from the Linux
machine**, and force-pushed. Linux is the load-bearing detail — a Windows-side export drops
case-only renames silently, which is the original defect. **So Task 0.1 Step 5 is closed for this
branch.**

**And the exports were pointed at the *site* repo's `production` branch**, so they picked up the
sentence-cased `report_topic` values from `6fb89c0ffb` that the site's `feature-new-data-explorer`
branch did not carry at export time. That makes the ordering load-bearing rather than incidental:
**the merge is what brought the DE branch's YAML into agreement with the exports.** They agree now
`[verified 2026-08-18: 57 report_topic values on each of production, merge/production and
feature-new-data-explorer, all three hashing identically; a direct diff of the sorted values
between production and the DE branch is empty]`. The green `dev_stage` build is the stronger
proof of the same thing — a missing report JSON aborts the build, so it covers all 57 values, not
just the one report page smoke happens to load.

**Two traps the force-push leaves behind, neither of them currently biting:**

- **`[caches.getresource]` sets `maxAge = -1`** (`config/_default/config.toml:21-23`) — cache
  forever. A force-push changes content at URLs that did not change, so a machine holding a warm
  cache from before 2026-08-18 will keep serving the pre-push resources and reproduce the old
  failure exactly. **If the five `Unable to get remote resource` warnings and four `ERROR render`
  lines at `nr-output/single.html:419` reappear after this date, bust the cache before diagnosing
  anything** — `--ignoreCache`, or `maxAge = 0` for that cache.
- **`nr-characterization.mjs` files baselines under the EHDP-data branch *name*** (`BASELINE_ROOT`
  plus the branch, `scripts/nr-characterization.mjs:345`, on the NR branch). A force-push leaves
  the name fixed while the data moves, so the key cannot express what happened. Not currently a
  problem: the only filed baselines are `production` and `staging`
  `[verified 2026-08-18: ls scripts/nr-characterization-baseline/ on feature-MOD-Lab-NR-recode-refactor
  lists exactly those two]`, and neither was force-pushed.

**Four instructions elsewhere in this document are now stale and are corrected in place:** the
"do not run smoke bare" warning under "The exact next commands", the `dev_stage`-is-red note in
Global constraints, the two C3 consequences under C1 Step 3, and B2 Step 3's own aside. Each now
points here. The earlier stray server — `… -p 8081`, PID 26812, the **main** worktree's, which
Chris stopped — is a closed question and not related to this one.

---

## Commands appendix

**Isolated static build** — safe beside a running dev server, because the poisoning hazard is
`resources/_gen` and `HUGO_RESOURCEDIR` moves it:

```
HUGO_RESOURCEDIR="$TEMP/hugo-res-$$" npx hugo --environment production -d "$TEMP/hugo-out-$$"
```

**The `--environment` here is load-bearing, not incidental.** It selects the `data_branch`, and as
of 2026-08-17 `production` builds while `dev_stage` does not (Task 0.1 Step 5). Swapping the
environment to match a harness's expectations without reading that step turns a green build red for
a reason unrelated to whatever you are testing.

Expected: exit 0 `[verified 2026-08-17 on merge/production: warns=0, errors=0, 1282 EN pages]`. The isolation is proven by `resources/` being untouched, not by the page count —
a full production build processing 172 images left zero files under `resources/` modified, and the
server on :8080 served a page 200 immediately after
`[verified 2026-08-09: project-isolated-hugo-build memory, EH-dataportal store]`.

**Leave `cacheDir` shared** — do not add `--cacheDir`. It keys `getresource` by URL and the two
environments read different `data_repo` URLs, so there is no collision; isolating it only buys a
~33s cold fetch.

**Check whether a server is actually holding :8080 before reaching for this at all.** With nothing
running, `ensureDevServer()` spawns its own `dev_stage` server on :8080 — which is the environment
the NR baseline was captured under, so the harnesses just work with no workaround. A process list
is a point-in-time observation; re-probe before acting on one from several turns ago.

**Characterization harnesses** — always the `node` form under PowerShell:

```
node scripts/nr-characterization.mjs --check
node scripts/nr-characterization.mjs --baseline     # only after reading a --check diff
node scripts/pagefind-characterization.mjs --check
```

**Dry-run any merge without touching a working tree:**

```
git merge-tree --write-tree --name-only <branch-a> <branch-b>
```

Exit 1 means conflicts; the first output line is a real tree oid you can `git cat-file -p <oid>:<path>`
to inspect the merged content, including conflict markers.

**Abort and restart a stage:**

```
git merge --abort
```

**A restart replays nothing you resolved in the aborted merge** — `rerere` stores a resolution only
when the merge is committed, so an abort leaves preimages and no postimages. Budget the redo, and
restart with the `rerere.enabled=false` form from Global constraints so the cache's *older*
recordings cannot answer a conflict on your behalf.

---

## Self-review

**Spec coverage.** Every conflicted file from all three dry-runs is assigned to a task: NR's 22
across A1 (9), A2 (9), A3 (1), A5 (2), plus `neighborhood-reports/section.html` in A4 — 22. DE's 22
in B1, and the +14 in C1/C2 `[all three counts re-derived 2026-08-16]`. The two clean-merge
breakages have dedicated tasks (A3, A4) and dedicated proofs (A7 Steps 3, 4, 5). The two defects
already on `merge/production` have Stage 0 and proofs that were measured against a working control
rather than predicted (0.1 Step 4, 0.2 Step 3).

**What the 2026-08-16 draft got wrong, recorded rather than quietly patched (2026-08-17).** Task
0.1 Step 4's prescribed command grepped `data_value_rank\|accordion` while the control quoted
beside it had been measured with `zip_code|report-section|accordion` — two different patterns whose
counts are not comparable, so the step as written could not have been read against its own control.
This is the shape the Verification rules name directly: the proof was written when the step was
planned and never run, and a written-but-unexecuted proof is worse than none because the next
session follows it. Corrected in place to the pattern the control used; it returns 33, matching.

Two premises in that draft also turned out narrower than stated. "`merge/production` does not
build" was true of the tree only in combination with a `data_branch`, which the sentence never
named — so the fix landing on two of three data branches left the claim half-true in a way the
original phrasing had no room to express. And Task 0.1 Step 2 was called "what unblocks the build"
when the content fix was; the code change is hardening. Per the sibling-premise rule, the thing
both share is *which data branch a check reads*, which is why that is now a table in Global
constraints rather than a sentence inside one task.

**What the 2026-08-15 draft got wrong, recorded rather than quietly patched.** Three of its
integers were off — Stage B's 21, Stage C's +15, and the self-review repeating both — in every case
because the summary line was written separately from the file list beside it, and only the summary
drifted. The `config/dev_stage` step asserted a current value instead of reading one, which turned
a verification step into an instruction to overwrite. None of these were caught by re-reading the
plan; they were caught by re-running the commands the plan cites, which is the argument for keeping
the commands in it.

**What this plan still does not check.** It verifies the branches it merges, not the invariants
those merges depend on. Findings 3 and 4 were both found by asking a question no task in the
2026-08-15 draft asked — "does `merge/production` itself build and load its libraries?" Stage 0 now
covers those two instances. The general check does not exist: C2 Step 2's sweep is the closest
thing, it runs only on the DE branch, and it reads `partial "lib-` counts rather than comparing
them against what each page's JS calls. A sweep that derives the requirement from the JS and
resolves partial includes transitively is what would have caught Finding 4 without being told to
look — worth building, and out of scope here.

**Finding 5 (2026-08-17) is the second instance and moves that from "worth building" to a known
count: two pages, found one at a time, each by a check aimed at something else.** It also narrows
what such a sweep must do. `topiclanding.html` does not call `neighborhoods` itself — a template
that includes `partial "nr-leaflet"` inherits that requirement from the partial's line 302, so a
sweep reading only each template's own JS would have passed it. Finding 5 was caught instead by
running the existing smoke suite, which had been failing on it unnoticed; the cheapest real
improvement may be reading smoke's exit code rather than its per-page lines, not new tooling.

**Placeholder scan.** No "TBD", no "handle edge cases", no "similar to Task N". A6 Step 2 and B1
Step 2 stop and escalate rather than deferring — both are decisions with consequences outside the
merge, and naming who decides is not a placeholder.

**Name consistency.** `lib-uhflist.html` is created in A3 Step 2 and consumed in A4 Steps 1–2 under
that exact name. The global it defines is `neighborhoods` throughout — matching
`demographics.js`'s `neighborhoods.filter(n => n.UHF_id == geocode)` and `global.js`'s
`neighborhoods.find(n => n.UHF_name === displayName)`. `getTertileSentenceParts`,
`getTertileInlineLabel`, `getTertileSentence` and `getComparison` in A6 match `tertiles.js`.

**One gap, stated rather than papered over.** Whether `4c06062296` (borough grouping) is already
implemented on the DE branch is not resolved here — B1 Step 2 makes answering it the first action,
because the answer changes whether `table.js` is a short resolution or a feature port, and it
cannot be answered without reading both implementations.
