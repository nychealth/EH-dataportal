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
reconciliation, duplicates. **Status: spot-check pending (plan Task 2 Step 3)** until a group's
heading says otherwise. IDs are per group (`G4-01`…); stable `A-` IDs are assigned at
deduplication (Step 4). Where a group's reconciliation tallies disagree with its table, the table
is authoritative.

**Tree caveat, found by G5, G6 and G7:** the #1491 worktree's HEAD was `00737207cb` when they ran,
four commits past `d1c7402735` (`b33ba2373e`, `2474ff1796`, `f97565a229`, `00737207cb`). Those
commits touch `nr-report.html`, `section.html`, `nr-leaflet.html`, `nr-architecture.md`, a merge
ledger and the Pagefind baseline, and rename `map.js`'s four Leaflet helpers to `reportMap*`.
Rows labelled `#1491 @ d1c7402735` were read from files at `00737207cb`. G6 says it diffed the
four commits and none reverts cited code.

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

## Instrument results

*Task 3.*

## Candidates

*Task 4. Candidates are not findings until Task 5 reproduces them.*

## New findings

*Task 5.*

## Disconfirmed

*Task 5.*
