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

Findings 3, 4 and 5 share one mechanism worth naming, because it is the same one Finding 1 describes:
two branches changed complementary halves of an invariant without ever touching a common file, so
the merge was clean and no check owned the result. Nothing in this repo enforces "every page loads
the libraries it calls" or "every `report_topic` resolves to a file that exists."

---

## Ledger

**Status as of 2026-08-17: no merge started. Task 0.1 is DONE apart from its optional hardening
step — the EHDP-data rename landed on `production` and `staging`, `dev_stage` was re-pointed from
`hotfix-geo-names` to `staging`, and `merge/production` now builds clean under both environments.
Task 0.2 is DONE and verified in a browser. Running its new smoke entry surfaced Finding 5, a
pre-existing missing include on `topiclanding.html` that has been failing smoke on this branch all
along — Task 0.3, **parked by decision on 2026-08-17**: the page is retired by Stage A's A2, so the
FAIL is recorded as expected rather than fixed. **Stage 0 is therefore closed and Stage A is the
next thing to run.** Nothing in this plan is blocked. `rerere.enabled=true` is set (shared repo
config, applies in every worktree).**

| Stage | Task | Status |
|---|---|---|
| 0 | 0.1 NR report-topic rename — build blocker | **Steps 1, 3, 4, 5 DONE 2026-08-17**; Step 2 re-scoped to optional hardening, not started |
| 0 | 0.2 CP report library includes | **DONE 2026-08-17** — all 3 steps; browser probe matches the `production` control (L/vegaEmbed/d3 defined, 2 maps drawn, 6 Vega views), page passes smoke |
| 0 | 0.3 `topiclanding.html` missing `lib-uhflist` (Finding 5) | **PARKED 2026-08-17 by decision** — not fixed; the page is deleted by A2, so the one `npm run smoke` FAIL is expected. **Unparks if** Stage A is abandoned or `topiclanding.html` survives into production |
| A | A1 shared-infra conflicts | **Steps 1, 2, 3, 5 DONE 2026-08-17** (+ this document, the unlisted 23rd conflict); Step 4 — `CLAUDE.md`, `js-conventions.md`, `.claude/settings.json`, `.gitignore` — not started |
| A | A2 retired-file modify/deletes | Not started |
| A | A3 `head.html` — uhflist generator + gating | Not started |
| A | A4 `lib-*` includes for the four NR templates | Not started |
| A | A5 SCSS: `theme.scss`, `_custom.scss` | Not started |
| A | A6 duplicate comparison implementation — decision | Not started |
| A | A7 NR verification sweep | Not started |
| B | B1 DE ← `production` | Not started |
| B | B2 DE verification sweep | Not started |
| C | C1 DE ← `merge/production` | Not started |
| C | C2 DE gating reconciliation | Not started |
| C | C3 DE verification sweep | Not started |

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
- **`rerere` covers exactly one file across these merges** — `scripts/dev-server.mjs`, the only
  shared-infra file byte-identical between the two branches
  `[verified 2026-08-15: git rev-parse of all nine shared-infra paths on both branches]`. Do not
  plan around it replaying anything else.
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
  | `npm run smoke` — A7 Step 3, B2 Step 3, C3 Step 6 | `dev_stage` (spawned by `scripts/dev-server.mjs:27`) | `staging` | **yes** `[verified 2026-08-17: exit 0, warns=0, errors=0, 1283 EN pages]` |
  | `node scripts/nr-characterization.mjs --check` — A7 Step 4 | `dev_stage`, same server | `staging` | **yes**, same build |
  | `node scripts/pagefind-characterization.mjs --check` — A7 Step 6, B2 Step 4 | `dev_stage`, same server | `staging` | **yes**, same build |

  `hotfix-geo-names` is the branch that fails, and `dev_stage` no longer points at it (Task 0.1
  Step 5). Anything still reading it — a stale worktree, a config not yet merged forward — will
  abort with five `Unable to get remote resource` warnings and four `ERROR render` lines citing
  `nr-output/single.html:419`. That is the signature to recognise, not a merge symptom.

---

## Stage 0 — fix `merge/production` before merging it into anything

Both tasks here are defects already present on `merge/production`, found 2026-08-16. Neither is a
merge artifact, and neither is visible in any conflict list — Stage A and Stage C would both carry
them forward silently. Fixing them on `merge/production` means both feature branches inherit the
fix through the merge they are already doing; fixing them afterwards means doing each twice and
re-testing on two branches.

### Task 0.1: NR report-topic rename — the build blocker

> **Status 2026-08-17: the blocker is down for `production` and `staging`.** Chris landed the
> EHDP-data export from a Linux machine, which is what let the case-only renames through. Steps 1,
> 3 and 4 are done and carry their proofs below. Step 2 no longer unblocks anything and is
> re-scoped to hardening. Step 5 is new and is the only part still open.

**Files:**
- Modify: `themes/dohmh/layouts/nr-output/single.html` (delete the `$zip_codes` declaration and its
  one assignment — Step 2, now optional hardening)
- ~~Coordinate in the **EHDP-data** repo~~ — **done 2026-08-17**, `production` and `staging` only
- ~~Decide: `config/dev_stage/config.toml:3` `data_branch`~~ — **done 2026-08-17**, re-pointed
  from `hotfix-geo-names` to `staging` in `5acffbf727` (Step 5).

**Depends on:** nothing.
**Leaves for:** A7 Step 2, B2 Step 2, C3 — the isolated builds, which now pass. The `dev_stage`
checks (A7 Steps 3, 4, 6; B2 Steps 3, 4; C3) still wait on Step 5.

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
  already flags for a comment fix.
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
- Modify: `scripts/dev-server.mjs` (add/add — rerere may replay this one)
- Modify: `scripts/smoke-pages.mjs` (add/add)

**Depends on:** nothing.
**Leaves for:** A7, which runs `npm run smoke` and `npm run lint` — both read `package.json`'s
script block and `eslint.config.mjs`'s file arguments, so the merged `package.json` must retain
every `scripts` entry from both sides.

> **Progress 2026-08-17: Steps 1, 2, 3 and 5 done and staged; Step 4 (the four prose/config files)
> not started.** The merge is live in the worktree — 18 conflicts remain, 5 resolved (this document,
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
library block and must survive — the build-time `neighborhoods` generator, currently at
`themes/dohmh/layouts/partials/head.html:176-184`, identified by the comment "Generated from
data/globals/uhflist.json, which is the single source of truth".

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
- The nine shared-infra files from A1 (resolve the same way; only `scripts/dev-server.mjs` will
  replay from rerere)
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

### Task B2: DE verification sweep

**Depends on:** B1.

- [ ] **Step 1:** `npm run lint` — zero errors, with the same positive control as A7 Step 1
      (call a name declared in another file of `assets/js/data-explorer/`).
- [ ] **Step 2:** Isolated build — exit 0.
- [ ] **Step 3:** `npm run smoke` — zero non-allowlisted console errors.
- [ ] **Step 4:** `node scripts/pagefind-characterization.mjs --check` — zero diffs.
- [ ] **Step 5:** Browser check of the data explorer: load a topic page, switch geography, confirm
      the table, map and trend chart render. **`npm run characterize:de` is non-functional on this
      branch** — it was written against a different explorer and waits on DOM this branch never
      produces. Do not read its failure as a regression signal, and do not use it as this step's
      proof.

---

## Stage C — `feature-new-data-explorer` ← `merge/production`

36 conflicted files `[verified 2026-08-16: git merge-tree --write-tree --name-only, re-confirmed]`,
of which 22 are Stage B's set. The +14 (the 2026-08-15 text said +15, but the list it gives holds
14): `disparities.js`, `map.js`, `print.js`, `trend.js` (one line each),
`config/dev_stage/config.toml`, five `data-features` templates (`fvi`, `minimum-wage-with-maps`,
`rats-in-your-neighborhood`, `realtime`, `rmz`), and four `nr-*` partials.

**Run Stage C only after Stage B has verified.** Its merge-base is `production`'s tip, so none of
Stage B's resolutions are re-presented.

### Task C1: DE ← `merge/production`

**Depends on:** B2 verified.

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

Hold the value deliberately whatever it is: the characterization harnesses file baselines per
EHDP-data branch, so changing this silently refiles every result against a different baseline
directory.

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

### Task C3: DE verification sweep

**Depends on:** C2. Same five steps as B2, plus:

- [ ] **Step 6:** `npm run smoke` is the gate for the gating refactor across every page kind, not
      just the explorer. Before relying on it, confirm the five `data-features` templates touched
      in C1 Step 2 have entries in `PAGES` in `scripts/smoke-pages.mjs` — those comments are claims
      that rot like doc prose, and a page kind absent from `PAGES` is not covered.

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

rerere keeps its recordings, so a restart replays what you already resolved in that merge.

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
