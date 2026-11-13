# Data explorer improvements — ledger (2026-11-10)

**Status as of 2026-11-12: E5 done, merged via #1559; E6 done, merged via #1560; E7 done, merged
via #1561; E4 diagnosed and fixed on the staging database, waiting on the migration to production
and a metadata re-export; E3 done, merged via #1562; E1 done, merged via #1563; E2 done, merged via
#1564, and audit row A-032 closed. E4 is waiting on the database migration. E8–E14 were added
2026-11-12, with all their decisions made the same day: E8 and E9 are done, merged via #1566 and
#1567 the same day; E11 is built, PR held (Chris); E12–E14 are built, PR #1568 open 2026-11-13,
iOS check passed (Chris, 2026-11-13), ready to merge; E10 is not started. E15 was added and built
2026-11-13, PR #1569 open, iPhone check passed (Chris, 2026-11-13).**

**Where this file is edited.** Ledger changes are committed to `docs-de-improvements-ledger` and
pushed after each commit; the branch goes to `production` in one PR when the batch is done (Chris,
2026-11-12). Feature branches are cut from `production` and never merge this branch, so the copy
of this file on `production` lags the branch until that PR.

Seven improvements Chris listed on 2026-11-10, and seven more on 2026-11-12 (E8–E14). Each gets its own branch off `production` and its
own PR. This file is the single ledger for all seven: status, branch, commit and proof live here,
in the table below. Where an item needs more than its section here, a separate spec or plan is
written and linked from its row; the smaller items are specified in place and need no second doc.

Locators below were read on `production @ 1823af451d` on 2026-11-10. They are landmarks (file +
function or block name); line numbers are given only as hints and will move.

## Ledger

| # | Item | Branch (proposed) | Doc | Commit | Status | Proof that ran |
|---|---|---|---|---|---|---|
| E1 | Measure / Boundary / Time box collapsible on desktop, default open | `feature-de-desktop-details-collapse` | this file | `feature-de-desktop-details-collapse @ e234e4efb6`; re-baseline `abf3ce6ab4`; PR #1563, merge `55554654bd` | **DONE 2026-11-12** — header layout decided (D1c) | browser probe at 1440 / 960 / 959 / 390 and screenshots, see E1 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44 |
| E2 | Add Citywide and Borough to the table automatically | `feature-de-table-context-geos` | this file (design already recorded, see below) | `feature-de-table-context-geos @ fe17145b21`; DE harness baselines `627c4a7bfa`; PR #1564, merge `dae0ab25e6` | **DONE 2026-11-12** — A-032 closed in `documents/site-wide-audit-2026-10.md` | table probe on 2380 and 26 with a before arm, see E2 "Proof that ran"; `de-characterization` re-captured on both data branches; `npm run lint` exit 0; curated smoke 44/44 |
| E3 | Scrollable dropdowns (quarterly measures have 90+ time periods) | `feature-de-scrollable-dropdowns` | this file | `feature-de-scrollable-dropdowns @ 92c7919119`; PR #1562, merge `846378cf79` | **DONE 2026-11-12** — time slider deferred (Chris, 2026-11-12), so all three menus are covered | browser probe at desktop and phone with a no-handler control, see E3 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44 |
| E4 | Asthma ED / Hosp by NTA: 2 indicators have a number measure with no boundary or time | *none — no change in this repo* | this file | `cgettings-EHDP-work @ 9e972416` (step 6 script; run on local staging 2026-11-11) | **In progress** — staging fixed; BLOCKED on the staging→production migration, then `DE_metadata_json.R` re-export | browser menu probe, EHDP-data metadata sweep, database reads; see E4 "Proof that ran" |
| E5 | Disparities chart title much larger than correlate's | `hotfix-de-disparities-title-size` | this file | `hotfix-de-disparities-title-size @ e326c6c222`; PR #1559, merge `2c8f5e065e` | **DONE 2026-11-11** — scope widened to wrap the correlate title too (see E5) | browser on `dev_stage`, see E5 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44 |
| E6 | Allow many more "recently updated" datasets; home page shows ~10 | `feature-recently-updated-more` | this file | `feature-recently-updated-more @ c42a64596b`; re-baseline `af4bac8f6b`; PR #1560, merge `729b313e02` | **DONE 2026-11-11** — D6 decided: file order | isolated build, see E6 "Proof that ran"; site-characterization re-baseline, nothing unexplained |
| E7 | Initial "select dataset" modal has no "recently updated" flags | `hotfix-de-chooser-updated-badges` | this file | `hotfix-de-chooser-updated-badges @ 9700909479` | **DONE 2026-11-11** — cause browser-confirmed first | browser probe on both entry points, see E7 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44 |
| E8 | Dropdown's rotating icon: don't underline it | `hotfix-de-icon-underline` | this file | `hotfix-de-icon-underline @ df7e4926d8`; PR #1566, merge `d545957e0b` | **DONE 2026-11-12** | chevron probe at 1440 / 390 with a before arm, see E8 "Proof that ran"; curated smoke 44/44 |
| E9 | Topic chooser: 3 columns on desktop; topics and datasets as cards | `feature-de-topic-chooser-columns` | this file | `feature-de-topic-chooser-columns @ 64eb473573` (columns), `bb747a6aae` (cards); PR #1567, merge `2dc3f791a5` | **DONE 2026-11-12** — cards added (Chris, 2026-11-12) | column probe at five widths with a before arm, card probe at 1440 / 390, see E9 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44; site characterization `prod_prod` 840/840 |
| E10 | Selected neighborhood stays highlighted on bar, map and legend, and across overlay switches | `feature-de-persistent-selection` | this file; a spec if D10 widens it | — | Not started — D10 decided | — |
| E11 | Citywide-only indicators: no bar chart (it draws one large bar) | `feature-de-citywide-no-bar` | this file | `feature-de-citywide-no-bar @ 9c71cca181`, not pushed | **Built**; PR held (Chris, 2026-11-12) | bar probe, five arms incl. an injected one-of-many, see E11 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44; `de-characterization --check` passed |
| E12 | Map controls: zoom in/out and reset zoom | `feature-de-map-controls` (E12–E14 share it, D12) | this file | `feature-de-map-controls @ 913be741d7`; re-baseline `4244a5003a`; hints `a6487447bb`, `ac5b841181`, `a82e4ccd60`; PR #1568 | **Built**; PR open, ready to merge | probes in Chromium, Firefox and WebKit at 1440 / 960 / 959 / 390, see E12–E14 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44; site-characterization re-baseline, nothing unexplained; CI smoke and site characterization passed on `4244a5003a`, `a6487447bb` and `a82e4ccd60`; iPhone check on the preview (Chris, 2026-11-13) |
| E13 | Map control: turn the geography layer off | `feature-de-map-controls` | this file | as E12 | **Built** — one eye button with E14 (Chris, 2026-11-13) | as E12 |
| E14 | Map control: geography layer opacity | `feature-de-map-controls` | this file | as E12 | **Built** — slider shows actual opacity (Chris, 2026-11-13) | as E12 |
| E15 | Below lg, opening and closing the details soon after load leaves blank space under the map | `hotfix-de-map-details-gap` | this file | `hotfix-de-map-details-gap @ dfdc71cbe1`; PR #1569 | **Built**; PR open — D15 decided: the map keeps its size (Chris, 2026-11-13) | gap probe, three arms, before (Chromium) and after (Chromium, Firefox, WebKit), see E15 "Proof that ran"; `npm run lint` exit 0; curated smoke 44/44; CI smoke and site characterization passed on `dfdc71cbe1`; iPhone check on the preview (Chris, 2026-11-13) |

E5 and E7 are small enough to share one branch if Chris prefers; they touch different files
(`disparities.js` and `section.html` / `topic-indicator-selector.js`), so a combined PR has no
ordering problem. E6 and E7 both read `data/recently_updated_data.yml`; if E6 changes that file's
shape, do E7 second or on top of it.

## E1 — Collapsible details box on desktop

**What exists.** On phones the Measure / Boundary / Time dropdowns already sit in a collapsed
`#detailsContent`, opened by a "+" toggle; the handlers are the "mobile accordion" block in
`assets/js/data-explorer/de-tab-content.js` (the `show.bs.collapse` / `hide.bs.collapse`
listeners, and the click-anywhere-on-the-header-bar handler). The markup is
`themes/dohmh/layouts/partials/de-indicator-info.html` ("Dropdown 1/2/3"). That mobile work landed
on `production` through `c5c4a1a225` and `c1801a007b`; its record is
`documents/de-mobile-layout-options-2026-11-05.md`, whose F10 row is a worked case of the toggle's
`aria-expanded` falling out of step with Bootstrap's `collapsing` state.

**Likely shape.** Extend the existing collapse to desktop rather than add a second mechanism, with
`show` present at load on desktop and absent on phones. Exemplar rule: read how the mobile toggle
is wired before writing anything.

**Decisions for Chris.**
- D1a: Does the collapsed state persist (per viewer, `localStorage`) across indicator loads and
  page visits, or reset to open on every load?
- D1b: On desktop, does collapsing free the space for the map/chart (layout reflows), or just hide
  the dropdowns in place?

**Decided (Chris, 2026-11-12).** D1a: not remembered — every load opens on desktop. D1b: just
hide the dropdowns; the layout does not reflow.

**D1c, decided (Chris, 2026-11-12).** With the toggle beside the title and the "Change dataset"
pill, short titles wrapped to a second line ("Fine particles (PM 2.5)": title 190px → 171px wide,
header 51px → 70px, measured by hiding the toggle in the same page). Chosen: lay the desktop
header out as the phone's is — title, pill under it, toggle at the right. Rejected: keep it
beside the title; a "Hide details" link on its own row under the header.

**What was built** (`e234e4efb6`). `de-indicator-info.html`: the desktop header is rearranged as
above, with a `.desktop-details-toggle` button; the desktop description and three dropdowns sit
in `#detailsContentDesktop` (`collapse show`). Save map stays outside it, visible when collapsed.
`de-tab-content.js`: the phone toggle's icon / `aria-expanded` sync is now
`syncDetailsToggleIcon(toggle, content)`, used by both toggles; the phone's tap-the-bar handler
is unchanged and the desktop toggle has no bar handler.

**Proof that ran** `[2026-11-12, dev_stage on :8080, /data-explorer/air-quality/?id=2023]`. Probe
`scripts/.sc-rebaseline/e1/e1-collapse.mjs`, logs and screenshots beside it.
- 1440x900 and 960x800 (desktop): open at load (`aria-expanded` true, minus icon); click
  collapses (false, plus, Time dropdown hidden, Save map shown, box 509 → 127px with the phone-style header); click reopens;
  Enter on the focused toggle collapses; a reload opens again. The `.leaflet-container` rect is
  identical in every state (`[131,0,1440,836]` / `[131,0,960,736]`).
- 959x800 and 390x844 (phone): the desktop toggle is not shown; the phone box loads closed and
  its toggle opens it, as before (`de-tab-content.2474d731…` → `7de0d985…`, same readings).
- Screenshots `before-*.png` / `after-*.png`: open, collapsed, and the "Choose dataset" prompt
  (closing the chooser with no dataset). The prompt now sits under the pill inside the box,
  where it hung off the box's right edge before.
- 0 page errors. `npm run lint` exit 0. Curated smoke 44/44.
- Site characterization, re-baselined at `32a59cb200` (E1 plus `production` with #1562 merged in):
  `node scripts/site-characterization-rebaseline.mjs --expect "data-explorer/**"` reported, for
  both `prod_prod` and `staging`, 41 of 840 pages changed, all 41 under the glob, "Nothing
  unexplained". `git diff -U0` tally: 82 changed lines, every one `controls.button` +1 (41 topic
  pages x 2 keys); no other field. Unchanged under the glob: `data-explorer/` (the chooser),
  `data-index/` and `indicator-catalog/`, none of which renders the details box. Each
  `_meta.json` changes only `capturedAt`, `gitHead` and the EHDP-data `fetchedAt`.

**Proof.** Browser, at desktop (≥960px, this site's `lg`) and phone widths: toggle state,
`aria-expanded`, icon, and that phones still default closed. `npm run smoke`; `characterize:site`
(adds a control on every explorer page, so expect a re-baseline of the explorer topic pages).

## E2 — Citywide and Borough always in the table

**Design already recorded.** This is audit row **A-032** (OPEN, P3) in
`documents/site-wide-audit-2026-10.md`, deferred by Chris on 2026-10-01. The full option is in
`documents/site-wide-audit-2026-06-27.md` §4c: keep follow-the-map, and always add Citywide and
Borough beside the map's geography via a `TABLE_CONTEXT_GEOS` list and a `pickSyncedTableGeos`
helper in `global.js`, called from the three sites that choose the table's geography — the "table
defaults" block in `renderMeasures` (`measures.js`), and `getCurrentMapTableFilters` and the
fallback in `renderTableFilterControls` (`table.js`). Neither name exists in code yet.

**Constraint.** Table-follows-the-map is an explicit team design choice (Chris, 2026-10-01; deploy
plan D4 in `documents/de-production-deploy-plan-2026-10-01.md`). E2 adds context rows alongside it;
it does not replace it. §4c's option fits that.

**Decision for Chris.**
- D2: When the map is on Citywide or Borough itself, the helper simply returns those; confirm. And
  when the user unchecks Citywide in the table, does "Sync to map" bring it back (§4c's reading:
  yes, since synced now means map geo + context)?

**Decided (Chris, 2026-11-12).** Both yes: on a Citywide or Borough map the helper returns just
those, and "Sync to map" restores Citywide and Borough after the user unchecks them.

**Proof.** `?id=26` showed 3 table rows in the new explorer and 7 in the old (observed 2026-07-30);
after the change it should show Citywide + Borough + the map geography. `node
scripts/de-characterization.mjs --check` (table view is captured; expect a re-baseline), smoke,
`characterize:site`. Close A-032 in the audit when it lands (five places — see the audit's
"Closing a row" sentence).

**What was built** (`fe17145b21`). `global.js`: `TABLE_CONTEXT_GEOS` and
`pickSyncedTableGeos(availableGeos, mapGeo)`, as §4c wrote them. Called from the "table defaults"
block in `renderMeasures` (`measures.js`), `getCurrentMapTableFilters` (`table.js`), and the
fallback in `renderTableFilterControls` (`table.js`), each keeping its fall-back to the first
available geography. The last passes `dataGeos` through `geoTypes` first, since `dataGeos` is in
data order. All three files load only from `data-explorer/single.html`, which loads `global.js`
before them.

**Proof that ran** `[2026-11-12, dev_stage on :8080, 1440x900]`. Probe
`scripts/.sc-rebaseline/e2/e2-table.mjs`, logs beside it; it opens the table view and reads
`DE.table.selectedTableGeography`, the checked filter boxes, and the rendered `#tableID` rows.
- Before (`table.dc5702f9…`), 2380 (asthma; map offers Borough / CD / UHF42): the table shows the
  map's geography alone — CD 59 rows, UHF42 42, Borough 5. 26 (birth defects, unmapped): Citywide,
  1 row.
- After (`table.012d69c5…`), 2380: Citywide + Borough + CD, 65 rows; + UHF42, 48; a Borough map
  gives Citywide + Borough, 6. 26: Citywide + Borough, 6 rows. Rows are coarsest-first.
- D2 part 2: unchecking Citywide in the table, then "Sync to map", restores Citywide on both
  indicators (`tableGeoFilterIsManual` true, then false).
- Not exercised on its own: the `renderTableFilterControls` fallback, which runs only when every
  checked geography is pruned away.
- 0 page errors. `npm run lint` exit 0. Curated smoke 44/44.
- `de-characterization` (not run by CI). Production: the old baseline still matched the
  unmodified tree (`--check` exit 0, on an isolated `development` server on :8091 with temp `-d`
  and `HUGO_RESOURCEDIR`, stopped after); re-captured with E2, the diff is the table's `rowCount`
  +6 and `filterSummary` ("3 geographies", or "All geographies" for 2414, whose table offers only
  Citywide, Borough and UHF34) on 2023, 2380 and 2414, nothing else. Staging: the same two fields,
  plus EHDP-data changes since the last capture (2380 and 2414 default to newer time periods),
  separated by diffing same-day captures of the unmodified tree and of E2; the new baseline
  matches an earlier E2 capture byte for byte.
- `characterize:site` not run locally: its sweep loads explorer pages without `?id=`, which
  render no indicator table.

## E3 — Scrollable dropdowns

**What exists.** `.dropdown-menu-de` in `assets/scss/_de-custom.scss` sets no `max-height` on
desktop (the `max-height` / `overflow-y` rules found there are inside mobile media queries or
other components) `[2026-11-10: grep of max-height|overflow-y over that file]`. The Time menu is
`.time-holder` in `de-indicator-info.html`.

**Check first.** `origin/feature-de-time-slider` (2 commits, last 2026-11-08, not in `production`)
replaces the Time control with a slider/timeline. If that branch is going ahead, E3 may only need
to cover Measure and Boundary — or nothing. Ask Chris before building.

**Likely shape.** `max-height` (e.g. a viewport fraction) + `overflow-y: auto` on the menu, scoped
under `.de-tabs-panel-shell` or the details container so the retired explorer's shared ids are not
hit (CLAUDE.md, Data explorer). Keyboard: the selected item must scroll into view when the menu
opens.

**Proof.** Browser on a quarterly indicator with 90+ periods: menu bottom within the viewport,
scroll reaches the last item, arrow-key navigation keeps focus visible.

**Decided (Chris, 2026-11-12).** The time slider is deferred, so E3 covers all three menus.

**What was built.** `.dropdown-menu-de` (`_de-custom.scss`, inside `.de-wrapper`, which the
retired explorer does not use) gets `max-height: 50vh; overflow-y: auto`. A delegated
`shown.bs.dropdown` handler at the end of `menu.js` ("selected item in view") centres the
`.is-selected` item when a menu opens. Bootstrap 4 fires that event through jQuery, which
`addEventListener` does not receive, so the handler uses `$(document).on`.

**Proof that ran** `[2026-11-12, dev_stage server on :8080, /data-explorer/drinking-water-quality/?id=2207,
1440x900 and 390x844]`. 2207 (TTHM) is the only indicator in EHDP-data `staging` metadata whose
menus reach 90+ periods: 100, on its three measures' Citywide Map (`e3-longest-menus.py`; the next
longest is 28). Probe `scripts/.sc-rebaseline/e3/e3-menus.mjs`, logs beside it.
- Before (`menu.04e48a7e…`): the Time menu was 3824px tall, top 7 to bottom 3831 against a 900px
  viewport, no inner scroll.
- After (`menu.ab3c3334…`): 450px on desktop (89–539), 422px on the phone (292–714); it scrolls.
  ArrowDown x30 focuses 2016-Q3 and it is in view (`scrollTop` 794 / 922). Measure (8 items) and
  Boundary (1) menus are unchanged and do not scroll.
- Selected item on open: a fresh load of `TimePeriodID=154` (2006-Q2, item 70) opens with it in
  view (`scrollTop` 2466 / 2480). Control, same load with the handler removed
  (`E3_NO_HANDLER=1`): `scrollTop` 0, 2006-Q2 out of view. Reopening in the same page cannot test
  this — the menu keeps its earlier scroll, and a hidden element ignores `scrollTop` writes — which
  is why the probe uses a fresh load.
- 0 page errors in every arm. `npm run lint` exit 0. Curated smoke 44/44 on the second run; the
  first failed 3 pages on `net::ERR_NETWORK_CHANGED` at navigation, a network change on this
  machine. `characterize:site` not run locally: the menus are `display:none` until opened.

## E4 — Asthma ED / Hosp by NTA: number measure with no boundary or time

**Unknown: which two indicators, and whether the cause is code or data.** The asthma topic
(`content/data-explorer/asthma.md`) lists ED visits as 2380, 2384, 2048, 2378, 2379, 2383 and
hospitalizations as 2382, 2387, 84, 2385, 2381, 2386. Which are the NTA ones was not checked.

**Diagnosis step (no code).** Load each NTA indicator in the browser on `prod_prod` data, select
the number measure, read the Boundary and Time menus; then read that measure's rows in the
EHDP-data indicator file. Three readings to tell apart: (a) the data has no NTA/time rows for the
number measure — EHDP-data fix, or the explorer should hide the measure; (b) rows exist under a
versioned geotype (`NTA2020`) the menu build does not normalize — `prettifyGeoType` in `global.js`;
(c) something else in the menu build. Related but distinct: audit A-234 (measures with no Citywide
row leave empty dropdowns in the unmapped state).

**Diagnosis: (a), in the database's display flags, not the data or the explorer.** The two are
2384 (adult ED visits by NTA, measure 1207) and 2383 (ED visits age 5 to 17 by NTA, measure 1205).
Each is a plain "Number" measure: a 3-year total at period 282 (2017-2019), 3.0x the "Average
annual number" measure beside it (1218 / 1217) at the median across all 194 geographies. Chain:

- `subtopic_indicators` rows 43112–43114 and 43121–43123 (Borough, Citywide, NTA2010, subtopic 11)
  were loaded 2021-01-12 with `ban_summary_flag = 1`, `mapping = 0`, `trend_time_graph = 0`, but
  `creator_id = 1` (the stage flag) under a public subtopic.
- The `DE_metadata` view maps those to `Table = 1 − ban_summary_flag`, `Map = mapping`,
  `Trend = trend_time_graph`, and keeps any row with a public subtopic and stage flag 1.
- `EHDP-data/export-scripts/DE_metadata_json.R` builds `VisOptions` only from rows where a flag is
  1, so both measures were exported with `{"GeoType": null, "TimePeriodID": []}` in every view.
- The explorer builds Boundary and Time from `VisOptions[0].Table/Map/Trend`
  (`expandMeasureTimesGeos` in `assets/js/data-explorer/data.js`), so it listed the measure and
  then offered nothing.

**Decided** (Chris, 2026-11-11): hide them (option A), by setting the stage flag to 0. That is the
state of the third family member, 2378's average-annual-number measure 1296, which is hidden
under a non-public subtopic. Rejected: B, showing them as a 3-year total, which also needed 1207's
truncated `how_calculated` completed; C, an explorer guard hiding measures with no geotypes, which
would also have changed the 7 other measures with the same shape (poverty rank 870 and 869, and
NY Harbor standards 1357–1361), none of them checked.

**Proof that ran:**
- `[2026-11-11: dev_stage server, Playwright probe selecting each measure]`: on 2384 and 2383,
  Number left Boundary and Time empty, and every other measure offered Borough and NTA plus two
  periods. On control 2378, Number offered Borough, NTA and 2014-2016. No page errors. Staging's
  metadata for all 7 measures is the same as production's.
- `[2026-11-11: EHDP-data production metadata.json, all 731 measures]`: 9 have no geotype in any
  view; control, 714 name a Table geotype. Grouping the local `BESP_Indicator` `DE_metadata` view
  by measure gives the same 9, so the local database is the one the JSON was exported from.
- `[2026-11-11: local BESP_Indicator, every integer indicator_id / MeasureID column]`: outside their
  own data, definitions and sources, 1205 and 1207 appear only in 1 `keyword_indicator` row; no
  `i_to_i` links, `report_content` or `nr_indicators`.
- `[2026-11-11: cgettings-EHDP-work code/Asthma/06-hide-nta-ed-number-measures.R on local
  BESP_IndicatorAnalysis]`: dry run passed its checks. The real run updated 6 rows in one
  transaction. Its verify read stage flag 0 on all 6, 0 `DE_metadata` rows for 1205 / 1207, and
  both 1217 and 1218 still present. A separate read showed local `BESP_Indicator` still at stage
  flag 1.

**Remaining.** The migration (`migrate_stag_to_prod_push_ready`) copies every `push_ready = 1`
`subtopic_indicators` row, stage flag included; all 6 are `push_ready = 1`. After it, re-export
`metadata.json` with `DE_metadata_json.R` against production, then re-run the menu probe: 2384
should list 3 measures and 2383 two, each filling Boundary and Time. The probe is
`e4-menus.mjs`, saved beside this repo's other E4 evidence in `scripts/.sc-rebaseline/e4/`.

## E5 — Disparities title size

**Measured in source** `[2026-11-10]`: the disparities spec's `title.fontSize` is 18 and
`subtitleFontSize` 13 (`assets/js/data-explorer/disparities.js`, the "schema, title, and
chart-level config" block); correlate's is 14 and 12 (`correlate.js`, the spec's `title` block).
Not yet compared in a browser — the rendered size is what Chris saw, and the fix should be checked
there.

**Likely fix.** Set disparities to 14 / 12 to match correlate. Check the other charts (bar, trend)
while there, so all four agree.

**Proof.** Browser: computed font size of the two chart titles' SVG `text` nodes, same indicator
pair. N-105 (chart titles clipped at 992 and 1024px, fixed by `4f29000c69`) touched title layout —
re-check those widths.

**What landed (`e326c6c222`).** Disparities title 18 → 14, subtitle 13 → 12. Re-checking N-105's
widths showed the disparities title overflowing the SVG at 992 and 1024px, and the font change
alone left 12px of overflow at 992. So the scope widened (Chris, 2026-11-11, "Option A"): both
`disparities.js` and `correlate.js` now pass `title.text` as a string, not a one-element array,
and call `wrapChartTitle(spec.title, spec.width)` before `vegaEmbed`. Until then the helper was
called only from `bar.js` and `trend.js`, and it does nothing when given an array. Bar and trend
were not changed.

**Proof that ran** `[2026-11-11: dev_stage server on :8080, Playwright probes, served fingerprints
read from each page so a before/after run could not measure the same file]`:
- Size: disparities 18px/13px before (`disparities.18a1b15773…`), 14px/12px after, on 2380 and
  2382, the same as correlate.
- Disparities wrap on 2380 (`disparities.0209e0c45fda596c.js`): past the SVG edge by 92px at 992
  and 80px at 1024 before; after, 2 lines ending 39px and 51px inside. One line that fits at 400
  and 1280.
- Correlate wrap on 2380 (`correlate.00acfa20bef1b708.js`), longest option selected: 2 lines
  ending 44px (992) and 51px (1024) inside the SVG. Its overflow before the fix was not measured.
- No page errors in any probe. `npm run lint` exit 0; `npm run smoke` against :8080, 44 pages
  passed.
- `node scripts/de-characterization.mjs --check` exited 1, and no title field differed. The diffs
  are staging data movement: years 2023→2024 and 2020→2022, legends, mark and row counts. The
  `staging` baseline under `scripts/de-characterization-baseline/` predates them. Not caused by
  E5, and not re-baselined here.

**Known limit.** Line breaks are computed at render. The correlate/disparities resize handler
re-widens the view without re-wrapping, so narrowing the window after load can still clip a long
title. A reload or tab switch re-renders it. Before this change these titles did not wrap at all.

## E6 — More "recently updated" datasets; home page shows ~10

**What exists.** `data/recently_updated_data.yml` has one list, `featured`, of 13 entries
`[2026-11-10: grep -c '^- copy']`. Three consumers range over all of it:
`themes/dohmh/layouts/index.html` (home page "Recently updated data" column),
`themes/dohmh/layouts/partials/de-indicator-info.html` (the id list behind the explorer's badges),
and `themes/dohmh/layouts/data-explorer-old/section.html`. No CloudCannon config references the
file.

**Likely shape.** Home page takes `first 10` of the list; the explorer badges keep the full list.
File order is the ranking.

**Decision for Chris.**
- D6: Is "top" file order (editor puts newest first), or should entries carry a date and sort by
  it? A date also allows aging entries out automatically instead of by hand.

**Proof.** Isolated build: home page link count = 10 with >10 entries in the file; badge id list in
`.de-main-details[data-recently-updated-ids]` = full count. `characterize:site` on `(home)` if the
link count changes.

**Decided** (Chris, 2026-11-11): D6 is file order, newest first. Rejected: a date on each entry,
which costs a hand-entered field per entry and needs a rule for undated ones.

**What landed (`c42a64596b`).** The home page loop in `index.html` is `range first 10`, with a
comment that file order is the ranking. A comment at the top of `data/recently_updated_data.yml`
says the same for editors. The badge partial and the retired explorer still read the whole list.
The file's shape is unchanged, so E7 does not depend on E6.

**Proof that ran:**
- `[2026-11-11: isolated development build into temp dirs, exit 0]`: the English, Spanish and
  Chinese home pages each show 10 links. On the English page the link text matches the file's
  first 10 entries, in order. The air-quality topic page's badge attribute still carries all 13
  ids.
- `[2026-11-11: site-characterization-rebaseline.mjs --expect "" --expect "es/" --expect "zh/",
  both keys, at c42a64596b]`: 3 of 840 pages changed per key, all claimed, nothing unexplained.
  Tally of changed fields: `internal` link count −3 on each home page, and the link targets lose
  `/data-explorer/climate/` and `/data-explorer/accessibility/`. The third dropped entry links to
  `chronic-disease`, which entries still shown also link to. Committed as `af4bac8f6b`.
- Production (with #1559) was merged in after the re-baseline. #1559's own site-characterization
  CI run passed without a re-baseline, so the merge should move no recorded structure; CI on this
  PR checks that.

**Open for Chris.** With the current 13 entries, the home page drops "Dialysis patients",
"Residents living in a hurricane evacuation zone" and "Walking distance to an accessible subway
station". The current file order was not checked against update dates; if it is not newest first,
reorder it.

## E7 — No "recently updated" flags in the initial select-dataset modal

**Cause, from source only (unverified in a browser).** `topic-indicator-selector.js`'s modal
builder reads the badge ids from `document.querySelector('.de-main-details')`, falling back to
`'[]'`. `.de-main-details` is emitted by `de-indicator-info.html`, which only
`data-explorer/single.html` includes; `data-explorer/section.html` (the chooser page with the
`#topics` / `#indicators` modals) does not `[2026-11-10: grep -rn 'de-indicator-info'
themes/dohmh/layouts]`. So on the chooser page the list is empty and no badge renders, while the
same modal opened from inside a topic page does get badges.

**Confirm first.** Open `/data-explorer/`, pick a topic containing a listed id (air quality, 2023),
and look for the badge; then the same modal from `/data-explorer/air-quality/`. If the chooser
"initial modal" Chris meant is a different one, re-scope.

**Likely fix.** Emit the id list somewhere the selector can read on both templates (e.g. a
`data-recently-updated-ids` attribute on an element `section.html` renders, or a shared partial),
and have the selector read that instead of `.de-main-details`.

**Proof.** Browser on both entry points: badge count in the modal equals the number of listed ids
in that topic. Smoke over the curated list (both templates are in `PAGES`; confirm).

**What landed (`9700909479`).** The id list is built in a new partial,
`themes/dohmh/layouts/partials/de-recently-updated-ids.html`, which returns it as JSON.
`de-indicator-info.html` calls it on the `.de-main-details` box, as before. `data-explorer/section.html`
calls it on an empty `hidden` element. Both lookups in `topic-indicator-selector.js` (the modal
builder `renderIndicatorList`, and the title clock icon) read `[data-recently-updated-ids]`, with
the local variable renamed from `indicatorInfoRoot` to `recentlyUpdatedSource`.

**Proof that ran** `[2026-11-11: dev_stage server on :8080, Playwright probe opening the modal from
/data-explorer/ (Air quality topic) and from /data-explorer/air-quality/?id=2023 ("Change
dataset")]`:
- Before (`topic-indicator-selector.ccff339b…`): the chooser badged 0 of 10 cards and the page had
  no `.de-main-details`. The topic page badged 5 (2023, 2024, 2028, 2025, 2027). The cause
  matched the source reading.
- After (`topic-indicator-selector.6b6b119b…`): both entry points badge the same 5. The topic
  page's attribute still carries all 13 ids. No page errors.
- `npm run lint` exit 0. `npm run smoke` against :8080: 44 pages passed. `data-explorer/` and
  `data-explorer/asthma/` are both in its list.
- Not probed: the title clock icon (second lookup). On topic pages the attribute is still on the
  same element, `.de-main-details`. Site characterization was not run locally; CI runs it on the
  PR.

## E8–E14 — added 2026-11-12

Locators below were read on 2026-11-12 on a tree whose `assets/` and `themes/` are identical to
`production @ dae0ab25e6` (`git diff --name-only` empty).

**Against the audit.** None of the seven is a row in `documents/site-wide-audit-2026-10.md`
`[2026-11-12: keyword sweep of the audit and of every documents/*.md — underline, rotate /
chevron / caret, column, highlight / persist / selected, citywide-only / single bar, zoom,
opacity / transparent, layer / toggle / basemap]`. A row worded in other terms could still be
missed. Related rows and records, none of which covers an item:
- N-048 (OPEN, question): the automatic jump to Trends for citywide-only indicators happens on a
  direct load but not after an in-place pick. Touches the same case as E11.
- `documents/data-explorer-architecture.md`, "The substituted entry is not inert": the bar chart
  plotting the single citywide row is recorded there as intended. E11 reverses that, so that
  paragraph changes with it.
- N-101 (FIXED): every leaflet-easybutton had an empty accessible name until `aria-label` was set
  by hand. E12's reset button needs the same.

### E8 — Rotating dropdown icon underlined

**Confirm first: which icon.** The explorer has three rotating or dropdown icons, and the source
does not say which one underlines:
- `fa-chevron-down` in the Measure / Boundary / Time buttons (`de-indicator-info.html`, six
  copies across the desktop and phone boxes). It rotates only under `.card-header
  .btn[aria-expanded="true"]` (`_de-custom.scss`, "Rotate chevron when accordion is open").
- The `.de-accordion` button `svg`, rotated on `aria-expanded="true"` (`_de-custom.scss`); the
  same block already sets `text-decoration: none` on `.de-accordion button:hover`.
- `fa-chevron-circle-down` on the chart pills (`#linksDropdownToggle` in `de-tab-content.html`,
  and `createBadgePillDropdown` in `measures.js`). No rotate rule.

The underline is likely a hover rule on the button reaching the icon's inline box; that is a
guess until read off computed styles.

**D8 for Chris:** which icon, on which page, and on hover or at rest.

**Decided (Chris, 2026-11-12):** the chevron — read as the rotating `fa-chevron-down` in the
Measure / Boundary / Time buttons, since the pills' `fa-chevron-circle-down` does not rotate.
Hover or at rest was not said; the browser check before the fix settles it.

**Proof.** Browser: the icon's computed `text-decoration-line` (and the button's) on hover and at
rest, before and after; the button's label text keeps whatever underline it had.

**Cause, browser-confirmed.** `_d-enhancements.scss` underlines every `.btn` on `:hover` and
`:focus` (`a, .btn, .nav-link, …` with `hover-focus`). The button keeps focus while its menu is
open, so the underline stays. These buttons are flex containers, so the chevron is a blockified
flex item and the button's underline carries down into it; rotated open, it draws above the icon.

**What was built** (`df7e4926d8`). One rule in `_de-custom.scss`, inside `.de-wrapper`:
`.btn[data-toggle="dropdown"]` drops its own underline on hover and focus and its label
`> span` takes it, the pattern `_d-enhancements.scss` uses for `.btn.file-choose`. Inside
`.de-wrapper` it matches only these six buttons; the site's other `.btn` dropdowns (heatstory,
rmz) are outside it.

**Proof that ran** `[2026-11-12, isolated dev_stage server on :8091 with temp -d and
HUGO_RESOURCEDIR, /data-explorer/air-quality/?id=2023]`. Probe
`scripts/.sc-rebaseline/e8/e8-chevron.mjs`, logs and screenshots beside it.
- The :8080 `dev_stage` server was not used: all 37 fingerprinted assets on the page pointed
  under `/local-prod/` and returned 404 (the two-builders symptom), with `renderIndicatorList is
  not defined` on load.
- Each visible button read at rest, hover, open + hover and open at rest, at 1440 and 390. The
  button's own underline: 18 of 24 readings before, 0 of 24 after. The label is underlined in
  exactly the states the button was. Screenshots: before, a line under the chevron on hover and
  above it when open; after, none.
- The new rule was confirmed in the served stylesheet before the after run. 0 page errors.
- Curated smoke 44/44. CI on #1566: smoke and site characterization passed.

### E9 — Topic chooser in 3 columns on desktop

**What exists.** `themes/dohmh/layouts/partials/de-chooser-modal.html` splits the topic list into
two `col-md-6` halves by `$half := div (len $pages | add 1) 2`, then appends the
`hideFromRange` pages as `col-6` rows. `$pages` includes the `hideFromRange` pages it later skips,
so the two halves can hold unequal numbers of visible topics. Included from `header-de.html`
(the `de-chooser-modal` call).

**Likely shape.** Filter `hideFromRange` out first, then three `col-md-6 col-lg-4` thirds (two
columns between 720 and 960, three from this site's `lg`, 960px), keeping alphabetical order down
each column. The two halves' bodies are duplicated, so a `range` over the three slices removes
the copy.

**Proof.** Browser at 1440, 960, 959 and 390: column count, alphabetical order down then across,
no topic lost (link count equals the number of non-hidden topic pages). `characterize:site` on
the chooser pages (structure should not move; links are reordered only).

**Cards (Chris, 2026-11-12).** After the columns, Chris asked whether each topic should be a
small card. A mock-up (CSS injected on the served page, `e9-cards-mock.mjs`) showed both steps,
topics and datasets, as cards; Chris chose cards on both. Notes from it: the site's
`content-card` carries a 200px image, too heavy here, so the card is a light one; the dataset
list was the same divider-row style, so both steps change together.

**What was built.**
- `64eb473573`: `de-chooser-modal.html` drops the `hideFromRange` pages first, then splits the
  41 topics into three `col-md-6 col-lg-4` columns (14 / 14 / 13). One `range` over three slices
  replaces the two copied halves. Below 960px the dialog is 500px, so the third column wraps
  under the first.
- `bb747a6aae`: each topic (`de-chooser-modal.html`) and dataset (`topic-indicator-selector.js`)
  is a `.de-chooser-card`, its title carrying Bootstrap's `.stretched-link`. The rule is at the
  top level of `_de-custom.scss`, since the modals render in `header-de.html`, outside
  `.de-wrapper`. On hover and focus the border and fill turn green and the title switches to
  `$primary-dark`.

**Proof that ran** `[2026-11-12, isolated dev_stage server on :8091]`. Probes
`scripts/.sc-rebaseline/e9/e9-columns.mjs` and `e9-cards.mjs`, logs and screenshots beside them.
- Columns, before (old partial stashed; the served page checked for 0 `col-lg-4` wrappers) and
  after (checked for 3), at 1440, 960, 959, 720 and 390: the same 41 topic links at every width,
  alphabetical down then across, both hidden-topic links listed, no horizontal scroll. Before:
  two columns of 21 / 20 (the halving counted the hidden pages). After: three across at 960 and
  1440; two across with the third wrapping at 720 and 959. Re-run after the cards: same link set.
- Cards, at 1440 and 390: 41 topic cards, 18 for Asthma. A click on a card's blank corner opens
  the dataset step, and on a dataset card loads it (`?id=2414`, modal closed). Focusing a title
  gives its card the green border.
- Contrast: the first build's hover title was `#008939` on `#EFFAF4`, 4.24:1, under 4.5:1 for the
  16px dataset titles; with `$primary-dark` both steps read 5.13:1.
- Height of the scrollable list, rows → cards: topics 1241 → 1412px at desktop (+14%), 2868 →
  3258px on the phone; Asthma's datasets 1981 → 2143px (+8%), 2937 → 3265px.
- `npm run lint` exit 0; curated smoke 44/44; 0 page errors. Site characterization
  (`characterize-env.mjs prod_prod`, uncommitted cards included): 840/840 match the baseline. The
  change adds no links or buttons, so this rules out a structural change and cannot see the
  restyle. CI on #1567: smoke and site characterization passed.

**Found, not changed.** The `.indicator-card` and `.indicator-grid` rules in `_de-custom.scss`
match no element: they are nested under `.de-wrapper`, and the only element with either class is
the dataset card, in the modal outside it.

### E10 — Selected neighborhood stays highlighted

**What exists.** The map↔bar highlight is hover only. In `renderChoroplethMap` (`map.js`) each
polygon's `click` calls `setBarSelection(geoID)`, but its `mouseout` calls `resetHighlight`,
`clearHoverUI` and `setBarSelection(null)`, so a click's highlight ends when the pointer leaves.
The bubble map (`renderBubbleMap`) has the same `click` / `mouseout` pair on its circles. The bar
side is the Vega `selectedGeo` signal in `bar.js`, set from the map by `setBarSelection`; the
map side is `window.mapInterop.highlight` / `reset`, published by each renderer. The legend's
hover panel is filled by `updateHoverUI` and cleared by `clearHoverUI`. Polygons also open a
popup on click (`bindPopup`).

**Likely shape.** A selected GeoID in shared state (`global.js`), set by a click on a polygon,
bubble or bar, and cleared by a second click on it or a click elsewhere. Hover still highlights
on top; on `mouseout`, the highlight returns to the selection instead of to nothing. Each
renderer re-applies the selection after drawing.

**D10 for Chris.**
- D10a: what selects — click (and Enter, for the keyboard) on the map and on the bar? And what
  clears — a second click, a click on empty map, an explicit "clear" control?
- D10b: which changes keep the selection: overlay switch (named), time period, measure? A
  boundary change (UHF42 → CD) leaves the GeoID meaningless; drop it then?
- D10c: does the selection go in the URL, so a shared link opens with it?
- D10d: the click popup stays as it is?

**Decided (Chris, 2026-11-12).**
- D10a: a click selects. A second click on the selected one, a click off the map, or Escape
  clears it. A click on a different one moves the selection to it; it does not clear.
- D10b: the selection survives an overlay switch, a time-period change and a measure change; a
  boundary change clears it.
- D10c: the selection does not go in the URL. D10d: the click popup stays (Chris, 2026-11-12).

**Proof.** Browser, choropleth and bubble indicators: select on the map, move the pointer away,
read the polygon style, the bar's highlighted mark and the legend panel; the same after each
change D10b keeps, and cleared after each it drops. Keyboard path. `de-characterization --check`
(map and bar views are captured).

### E11 — Citywide-only indicators: no bar chart

**What exists.** `renderMap` (`map.js`) sets `isCitywideOnly` when the measure's only map
geography is Citywide, and uses it to draw the citywide polygon and to send a click to Trends
(`switchToTrendTabOnce`, the N-048 behaviour). The bar chart is drawn regardless (`showBar` in
`bar.js`), one bar. `measures.js` disables the map/bar tab only when `DE.lookups.mapMeasures` is
empty, which an unmapped measure's substituted Citywide entry prevents (architecture doc, above).

**D11 for Chris.** "Citywide-only" can mean (a) the selected map geography is Citywide, (b) the
measure offers no other map geography, or (c) the indicator has no other geography in any view.
They differ when a user picks Citywide in the Boundary menu of a measure that also has
neighborhoods. And what fills the bar's space: nothing (the map widens), or a short note?

**Decided (Chris, 2026-11-12):** the test is the outcome — if the current selection would draw a
single bar, the bar chart is off. That covers (a), (b) and (c). In its place, a short note
like correlate's: `correlate.js` writes `<div class="alert alert-warning mb-0 w-100"
role="alert">` with text from `getNoCorrelatesMessage` ("No correlates available for … Change
the Measure on the map to see available correlates.") into the chart container.

**Proof.** Browser on a citywide-only indicator (`?id=55` is the one N-048 used) and on a mapped
one with Citywide picked, per D11: bar container absent or hidden, map and legend unaffected, no
page errors. `de-characterization --check`; `characterize:site` if the bar container is removed
from the DOM rather than hidden.

**Built (`9c71cca181`).** `renderBar` (`bar.js`) counts the bars the chart would draw — distinct
GeoIDs over rows with a numeric `Value` — and when there is exactly one, `renderSingleBarMessage`
writes correlate's `alert alert-warning` note into `#barHolder` instead of embedding the chart:
"No bar chart: {measure} has only one reported value for {boundary}.", plus "Change the Boundary
on the map to compare areas." when the measure's `AvailableGeoTypes` has more than one entry. The
caption under the chart is hidden, Save Chart disabled (`aria-disabled`, `tabindex=-1`, as
correlate's `setCorrelateActionState`), `DE.print.printSpec` and `window.myVegaView` nulled;
Download data still exports the rows. A later render that draws bars restores all three.

Counting rows with a value rather than areas widens D11's reading: Vega-Lite draws no bar for a
suppressed (`**`, null) value, so one reported value among suppressed ones also draws one bar.
Found on 2076 / measure 538 at CD, whose 59 rows are all suppressed at the default period and
draw an empty chart. That all-suppressed case (zero bars) is outside D11 and unchanged.

**Proof that ran** (`scripts/.sc-rebaseline/e11/e11-single-bar.mjs`, isolated `dev_stage`
server on :8091, 1440px; output `scripts/.sc-rebaseline/e11/probe.log`):
- `?id=55` (citywide-only): note without the hint, no SVG, caption hidden, Save disabled, 1
  Boundary option, 1 map path, CSV 2 lines.
- `?id=2076&MeasureID=538` — the only staging measure whose map offers Citywide plus another
  boundary — then Citywide picked: note with the hint; map 1 path.
- Then Borough: chart back (3 bars drawn), caption visible, Save enabled; map 8 paths.
- Injected: those Borough rows with all but one `Value` nulled, through `renderBar`: note.
- No page errors in any arm. `npm run lint` exit 0; curated smoke 44/44 against :8091;
  `de-characterization --check` passed. `characterize:site` not run: `#barHolder` stays in the
  DOM.
- Save Chart is not visibly dimmed when disabled (these buttons are not `.btn`, so Bootstrap's
  `.disabled` style does not reach them) — the same as correlate's.

### E12–E14 — Map controls

**What exists.** `initBaseMap` (`map.js`) creates the map with `zoomControl: false`. Below `lg`
the stacked layout fits the city through `layoutStackedMap`, which records the fit in
`fittedView`; on desktop the view is a fixed `setView([40.700142, -73.921546], 11)`. Choropleth
polygons are drawn at `fillOpacity` 0.65 (hover 0.9); the bubble map puts circles over gray
polygons at 0.3. The off-screen export map (`print-map.js`) builds its own layers and is separate.

**Exemplar for E12.** The NR maps: Leaflet's zoom control plus a "Reset zoom" `L.easyButton`
(`fas fa-undo`) with `aria-label` set by hand (N-101) — `nr-leaflet.html` and
`assets/js/nr-report/map.js`'s map setup. The explorer does not load easyButton:
`data-explorer/single.html` includes `lib-leaflet` but not `lib-easybutton-coloricon`, which must
follow it.

**E12 — zoom and reset.** Turn `zoomControl` on and add the reset button. Reset returns to the
same view load gives: `fittedView` (or a fresh `layoutStackedMap`) when stacked, the fixed
centre and zoom on desktop.

**E13 / E14 — layer off, opacity.** No control of either kind exists in the explorer or the
site's own Leaflet code; the only opacity slider on the site is a generated widget,
`static/maps/HOLC-shootings/map.html`. A shared style setting (in `DE.map` state) is needed so
a re-render — boundary, time or measure change — keeps the user's choice rather than resetting
to 0.65.

**D12 for Chris:** one branch and PR for E12–E14 (they share `initBaseMap` and the control
corner), or E12 first on its own?

**D13 for Chris.**
- D13a: what "the geography layer" is on the bubble map — the circles, the gray polygons, or both.
- D13b: does the opacity control also change the hover fill (0.9), or only the resting fill?
- D13c: is "layer off" a separate button, or opacity 0 on the same control?
- D13d: should the choices carry into the saved map (`print-map.js`)?

**Decided (Chris, 2026-11-12).** D12: one branch and PR for E12–E14. The purpose of E13 / E14
is to let people see the map features, specifically the neighborhood boundaries, unobscured.
- D13a: on the bubble map, the circles only.
- Possible addition (Chris "might want" it, so build it so it can be shown and judged): a gray,
  no-fill boundary layer under the choropleth, so the boundaries stay visible when the fill is
  off or faint.
- D13b: the hover fill scales by the same ratio as the resting fill (hover 0.9 x chosen / 0.65 on
  the choropleth).
- D13c: "off" is its own button; it may be implemented as opacity 0.
- D13d: neither choice carries into the saved map.

**Proof.** Browser at desktop and phone widths: zoom buttons work and have accessible names;
reset after a zoom and a pan returns to the load view (centre and zoom read off the map); layer
off removes the polygons and keeps the basemap; opacity reads back on the polygons' `fill-opacity`
and survives a boundary change. Keyboard reaches every control. `npm run lint`; smoke;
`characterize:site` (adds controls on every explorer page, so expect a re-baseline of the topic
pages, as E1 did).

**Changed during the build (Chris, 2026-11-13).** Reviewed in screenshots after the first build:
- Placement kept: zoom, then the explorer's own stack, beside the details card from 960px.
- The opacity slider folds behind a button, and its row is the button's 30px height (slimmer
  copy of the site's range style, label visually hidden).
- D13c reversed: "off" is not its own button. One eye button does both: hover or a first tap
  unfolds the slider, a click or second tap hides the layer (opacity 0), the next restores the
  level from before.
- The gray no-fill boundary layer was built, shown, and dropped: the choropleth's own thin black
  borders stay when it is hidden.
- The slider shows the layer's actual fill opacity (65 on a choropleth, 90 on the bubble map's
  circles), not a 0–100 multiplier.
- Hover still highlights a hidden choropleth area, and hidden circles cannot be hovered: both
  accepted as they are.

**Built (`913be741d7`).** `addMapControls` (`map.js`), called once from `initBaseMap`: Leaflet's
zoom control plus a custom `L.Control` (`.de-map-tools`) holding a Reset `<button>` and the eye
`<button>` (`aria-pressed`, name "Hide data layer") with the slider panel. `<button>`s rather than
easyButton, so Space works and no library is added. `DE.map.fillScale` (`global.js`) is a
multiplier on the default fills, 0 meaning hidden, and `DE.map.fillRestore` the level the eye
restores; `fillOpacityFor` applies it to resting and hover fills, capped at 1, and
`applyFillSettings` re-styles the layer on the map. A render calls `syncMapControls` so the slider
shows the new layer's opacity, snapped to its 5-point step. Styles under `.de-map-tools` in
`_de-custom.scss`; from 960px the control corner moves beside the details card. `print-map.js`
is untouched, so the saved map ignores both settings (D13d).

**Proof that ran** (probes in `scripts/.sc-rebaseline/e12/`, against an isolated `dev_stage`
server on :8091; `PW_BROWSER` picks the browser):
- `e12-controls.mjs` at 1440, 960, 959 and 390: no control overlaps the details card or the view
  tabs; accessible names Zoom in, Zoom out, Reset zoom, Hide data layer, Opacity; Reset by click
  and by Space returns to the load view (same zoom, within 0.71px).
- `e12-eye.mjs`: mouse, touch-emulated and keyboard sequences — fill 0.65 → 0 → 0.65, from 40:
  0.4 → 0 → 0.4; slider dragged to 0 counts as hidden and the eye restores the default; hidden
  survives a change to Borough; bubble map 42 circles off and back on; Tab order zoom in, zoom out,
  Reset, eye, slider; Escape folds and leaves focus on the eye.
- `e12-real-opacity.mjs`: slider 65 / fill 0.65 at load, 40 / 0.4 (hover 0.554), 100 / 1 (hover
  1); bubble map 90 / 0.9, 45 / 0.45; then the Percent measure (a choropleth) reads 35 / 0.35.
- Chromium, Firefox 1538 and WebKit 2336 (Playwright 1.62.1) gave the same panel state, fill,
  slider value and `aria-pressed` at every step. WebKit differs only in focus: a click does not
  focus the eye, and Tab skips Leaflet's Zoom out link (WebKit's default tabs to form controls,
  not links). `e12-clickaway.mjs`: a press on the map folds the panel in all three.
- 0 page errors in every run. `npm run lint` exit 0; curated smoke 44/44 against :8091.
- Site characterization (`4244a5003a`), `--expect "data-explorer/**"`: nothing unexplained; in
  each key 41 of 840 pages changed, and all 82 records move by `controls.button` +2,
  `controls.input` +1, `links.internal` +2, `links.emptyHref` +2 (Leaflet's `<a href="#">` zoom
  links). The `_meta.json` files record `gitHead` `2dc3f791a5`: the capture ran on the
  uncommitted tree.
- iOS Safari, by hand: Playwright's WebKit on Windows is a desktop build, and the first-tap /
  second-tap sequence depends on iOS's tap event order. CloudCannon site 161357
  (`feature-de-map-controls`, `serene-wolverine.cloudvent.net`) was created 2026-11-13 for that
  check; Chris ran it on an iPhone against the build of `a82e4ccd60` and reported it working
  (2026-11-13).

**Hover hints, added after review (Chris, 2026-11-13).** The eye's only label was its native
`title`, and the slider had none and showed no number.
- `a6487447bb`: the eye and slider get the explorer's own hint (`hover-hints.js`): "Hide data
  layer" / "Show data layer" off `aria-pressed`, and "Data layer opacity". A hint's text may now
  be a function of its trigger. A focus leaving a trigger lifts its click suppression unless a
  modal is open, so a keyboard user sees the eye's hint again. A fixed-width `aria-hidden`
  readout beside the slider ("65%") shows the value on touch, where hints do not show. One
  Escape hides a hint, the next folds the panel.
- `ac5b841181`: Zoom in, Zoom out and Reset move from native `title` tooltips to the same hint
  (the `title` comes off Leaflet's links after creation, since an empty `zoomInTitle` also
  empties their `aria-label`). A hint below one zoom button covered the next, so entries can be
  placed `'right'`, falling back to below; the three zoom buttons use it.
- `a82e4ccd60`: from a sweep of every visible control without visible text
  (`e12-icon-controls.mjs`, `?id=2380` at 1440 and 390, at rest and with each view open), hints on
  the header logo ("Show site menu" / "Hide site menu"; it expands `#global-header`), the details
  card's minus / plus ("Hide dataset details" / "Show dataset details", off `aria-expanded`) and a
  view pane's × ("Close this view"). Not hinted: the announcement's ×, and table inputs with
  visible labels.

Proof (probes in `scripts/.sc-rebaseline/e12/`, Chromium, Firefox and WebKit, 0 page errors):
`e12-hints.mjs` — hints on mouse rest and keyboard focus, none on touch, Learn More's hint still
down after its modal closes, "100%" (30.7px) inside the readout (34.8px), one panel width from 5%
to 100%. `e12-zoom-hints.mjs` — all five map controls hinted, no `title`, names kept, no hint
overlapping another control (`e12-covers-control.mjs`: the old placement reports Zoom out
covered), no `title` at maximum zoom. `e12-more-hints.mjs` — the three new hints on mouse rest,
toggles reversed after a click, keyboard focus in Chromium and Firefox (WebKit's default Tab
order kept the probe off the close button). `npm run lint` exit 0. CI's smoke and site
characterization passed on `a6487447bb`: the readout and the removed `title`s move no recorded
field.

## E15 — Blank space under the stacked map after the details open and close (added 2026-11-13)

**Report (Chris, 2026-11-13).** Below lg, on an iPhone and in a narrow desktop window, on
`production` and on the #1568 preview: open the details box right after an indicator loads, and
the map re-fits to the smaller space; close it, and a large blank space is left between the
legend and the tab bar. Waiting a few seconds before opening avoids it. Not part of the map
controls, so on its own branch from local `production` (`2dc3f791a5`).

**Cause, browser-confirmed.** `layoutStackedMap` (`assets/js/data-explorer/map.js`) sizes the
map to fill the screen below the details card, measured from the card's bottom edge, and only a
window `resize` re-runs it. One synthetic `resize` (`isTrusted: false`) fires about 1.2s after
`load` (1192–1273ms across the runs below). Its timing matches the `#printVis` `ResizeObserver` in
`global.js` (1000ms debounce, then `updateChartPlotSize`'s 200ms `setTimeout`), but no stack was
captured. If the details are open when any `resize` arrives, the map is sized for the open card,
here the 200px floor, and closing the details re-runs nothing. A real resize while the details are
open does the same, for example a phone rotation.

**D15 (Chris, 2026-11-13): the map keeps its size.** It is always sized as if the details were
closed, and open details push it down the page, as already happened when the visitor waited. The
rejected option was to re-fit on every open and close, which leaves the map at the 200px floor
with the details open at 390×844.

**Built.** `layoutStackedMap` subtracts `#detailsContent`'s rendered height from the card's
bottom edge. That height is 0 while the details are closed (`display: none`) and the animated
height while they open or close. Above lg the function returns before measuring, so desktop is
unchanged.

**Proof that ran.** `scripts/.sc-rebaseline/e15/details-gap.mjs` (git-ignored; logs beside it), on
2380 at 390×844 on an isolated `dev_stage` server, with the served `map.js` fingerprint checked
for the edit before each arm. Map height after the details close, where 431px is the closed-layout
height:

| Arm | Before (Chromium) | After (Chromium, Firefox, WebKit) |
|---|---|---|
| open at `load`, close after 3s | 200 | 431, 431, 431 |
| open 5s after `load`, close | 431 | 431, 431, 431 |
| open 5s after `load`, resize to 390×800 and back, close | 200 | 431, 431, 431 |

0 page errors in every run. `npm run lint` exit 0. Curated smoke 44/44 against the same server.
Site characterization not run locally: it loads at 1280×900, where `layoutStackedMap` returns
early. Merges cleanly with #1568's `feature-de-map-controls` (`git merge-tree` exit 0; the merged
`map.js` carries the fix and #1568's `fillOpacityFor`). CI's smoke (run 43512627665) and site
characterization (run 43512627695) passed on `dfdc71cbe1`. On an iPhone, Chris checked CloudCannon site 161374
(`haloed-wolf.cloudvent.net`, built 2026-11-13 and serving `map.066b802d3554941a.js`, the fixed
file) and reported it working (2026-11-13).

## Next command

E8–E14: D8, D10, D11, D12 and D13 all decided 2026-11-12; nothing open. E8 and E9 merged
(#1566 `d545957e0b`, #1567 `2dc3f791a5`). E11 built at `9c71cca181` on
`feature-de-citywide-no-bar`, not pushed; Chris is holding its PR. E12–E14 built on
`feature-de-map-controls` (`913be741d7`, re-baseline `4244a5003a`, hover hints `a6487447bb`,
`ac5b841181`, `a82e4ccd60`), PR #1568 open; Chris's iPhone check passed 2026-11-13, so it
is ready to merge. E15 built at `dfdc71cbe1` on `hotfix-de-map-details-gap`; it merges cleanly with #1568, which
also edits `map.js` (`git merge-tree --write-tree feature-de-map-controls dfdc71cbe1` exit 0,
merged `map.js` carrying both changes); PR #1569 open, CI passed, iPhone check passed 2026-11-13, ready to merge. Neither
PR depends on the other's merge order. Next: E10, cut from local `production`. Before building,
ask Chris whether a click on a bar selects too: D10a's question named the map and the bar, and
its recorded answer says only "a click selects".

E4, after Chris has run the staging→production migration and the `DE_metadata_json.R` re-export
(EHDP-data `production`), against a server on production data:

```
DE_BASE_URL=<server>/ node scripts/.sc-rebaseline/e4/e4-menus.mjs 2384 2383 2378
```

Pass: no measure on any of the three has an empty Boundary or Time menu, and 2384 / 2383 list 3
and 2 measures.

Of E1–E7, E4 is the only open item: after Chris's staging→production migration and the
`DE_metadata_json.R` re-export, run the E4 probe above.
