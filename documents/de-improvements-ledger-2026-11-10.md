# Data explorer improvements — ledger (2026-11-10)

**Status as of 2026-11-10: all seven items Not started; item E4 needs a diagnosis before it can be
specified; items E1, E2 and E6 each need a decision from Chris (listed under each).**

Seven improvements Chris listed on 2026-11-10. Each gets its own branch off `production` and its
own PR. This file is the single ledger for all seven: status, branch, commit and proof live here,
in the table below. Where an item needs more than its section here, a separate spec or plan is
written and linked from its row; the smaller items are specified in place and need no second doc.

Locators below were read on `production @ 1823af451d` on 2026-11-10. They are landmarks (file +
function or block name); line numbers are given only as hints and will move.

## Ledger

| # | Item | Branch (proposed) | Doc | Commit | Status | Proof that ran |
|---|---|---|---|---|---|---|
| E1 | Measure / Boundary / Time box collapsible on desktop, default open | `feature-de-desktop-details-collapse` | spec to write | *none yet* | Not started — decisions D1a, D1b open | — |
| E2 | Add Citywide and Borough to the table automatically | `feature-de-table-context-geos` | this file (design already recorded, see below) | *none yet* | Not started — decision D2 open | — |
| E3 | Scrollable dropdowns (quarterly measures have 90+ time periods) | `feature-de-scrollable-dropdowns` | this file | *none yet* | Not started — check overlap with `feature-de-time-slider` first | — |
| E4 | Asthma ED / Hosp by NTA: 2 indicators have a number measure with no boundary or time | `hotfix-de-asthma-nta-number` | diagnosis first | *none yet* | Not started — needs diagnosis (code or EHDP-data?) | — |
| E5 | Disparities chart title much larger than correlate's | `hotfix-de-disparities-title-size` | this file | *none yet* | Not started | — |
| E6 | Allow many more "recently updated" datasets; home page shows ~10 | `feature-recently-updated-more` | this file | *none yet* | Not started — decision D6 open | — |
| E7 | Initial "select dataset" modal has no "recently updated" flags | `hotfix-de-chooser-updated-badges` | this file | *none yet* | Not started — cause is a source reading, not yet browser-confirmed | — |

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

**Proof.** `?id=26` showed 3 table rows in the new explorer and 7 in the old (observed 2026-07-30);
after the change it should show Citywide + Borough + the map geography. `node
scripts/de-characterization.mjs --check` (table view is captured; expect a re-baseline), smoke,
`characterize:site`. Close A-032 in the audit when it lands (five places — see the audit's
"Closing a row" sentence).

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

## Next command

```
git switch production; git switch -c hotfix-de-disparities-title-size   # E5, smallest, no decisions
```

Then, on a dev server, open an indicator that has both a disparities and a correlate view (which
ones do was not checked when this was written), and read both titles' computed `font-size`.
