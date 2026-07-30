# Data Explorer Fresh Audit — 2026-07-13

## Context

Fresh line-by-line audit of the active data explorer SPA (`assets/js/data-explorer/`, 15 files, ~10,900 lines including `de-tab-content.js`) plus the templates that load it (`themes/dohmh/layouts/data-explorer/single.html`, `partials/head.html`) and `package.json`. Goal: consolidation, elegance, performance, and dependency reduction — anything on the table, delivered as tiered options with decision considerations.

This builds on (and does not re-report) the prior audits: every finding in `documents/data-explorer-deep-audit-2026-06-27.md` §0–§6 is closed as of 2026-07-04, and the state-namespace refactor (`const DE = {...}`) landed 2026-07-11 on this branch. What remains open from the consolidated 04-19 doc is the structural tier: renderer registry (#3), selectors (#4), stale-fetch guard (#6), URL module (#7), boot sequence (#12), mapInterop lifecycle (#13), fetch cache (#15), hover reset (#17), and the copy-citation cleanup (#26). This audit confirms those are all still live in current code, pins them to exact sites, and adds **new findings** the earlier passes missed.

## Status at a glance (updated 2026-07-27)

Every findings section below opens with its own **Status:** line and date; this block is the summary of those.

**Closed:** all of Tier 1, the `hotfix-table-sorting-by-geo` port, all of Tier 2 (2.1–2.7), all of Tier 3 (3.1, 3.1b, 3.2, 3.2b, 3.3), and Tier 4.1 (plus its naming sweep), 4.2, 4.3, 4.5, 4.6, 4.7, 4.8 and 4.9. All of them are **merged into `feature-new-data-explorer` and pushed** (4.3 merged 2026-07-27) — the per-tier branch names below (`feature-de-tier2-consolidation`, `feature-de-tier3-perf`, `feature-data-explorer-new-headhtml-gating`, `feature-new-data-explorer-pagefind-audit`, `feature-de-tier4.5-guardrails`, `feature-de-tier4.1-render-measures`, `feature-de-naming-cleanup`, `feature-de-tier4.2-load-pipeline`, `feature-de-tier4.3-mapinterop`) are labels lagging behind on the same linear history, not divergent branches. The older "kept unmerged per user choice" notes in the per-tier status blocks are superseded. No PR into `production` has been opened for any of it.

**Open:** **4.4** (parked until comparative user testing ends) is now the only substantial item. **4.12 is fixed** as of 2026-07-30 on `feature-de-tier4.12-null-geotype` — the map drew nothing and threw on 40 of 282 indicators; it now draws an explicit gray "not mapped" state with a message and a highlight on the visualization bar. That **unblocks 4.4**, whose gate was that these indicators rendered worse on the new explorer than the old. New from that work: **§4.13**, an upstream metadata question (10 measures have no `Citywide` row to fall back on, 9 of them `NYHarbor`-only despite the geometry file existing) — no crash, not urgent. Still logged-not-scheduled: the **4.2 follow-up** (URL updates 29–151 ms after the click; the recommendation is to leave it alone) and **4.11** (`DE.state` written from 23 sites across 5 files; the namespace refactor fixed naming, not ownership). **4.10** closed 2026-07-27 — measured first, and the perf case died; shipped as a clarity change.

**Standing won't-dos** — don't re-propose without asking: CSS `| minify` inside 3.3 (rejected by the user, verified absent from `head.html`), script bundling (2026-07-13 decision), and the `links` → `correlate` rename (deferred with its cost measured; options in site-wide audit §4).

## Decisions (2026-07-13, from review)

- **No script bundling.** Separate `<script>` tags stay — the team wants stack traces and devtools line numbers pointing at real source files. Consolidated #19 is closed as won't-do; dropped from Tier 3.
- **Old explorer stays** for comparative user testing; the new DE owns `/data-explorer/` (already true on this lineage). Branch divergence is low-stakes here: the SPA files exist *only* on this branch lineage and the branch doesn't touch the old explorer's files, so there's nothing to conflict with. The one real friction point is **shared shell files** (`head.html`, shared partials) that production also edits — keep Tier 3.3 changes in their own small commits so they cherry-pick/merge cleanly.
- **Keep the `leaflet-control-geocoder` npm package**; delete only its unused head.html script tag (Tier 1.6 updated).
- **Data download must work sensibly on every tab view** — added as Tier 1.7; a real defect was confirmed on the bar tab.
- **Split map print from chart print** — the Leaflet export machinery dwarfs the chart path in print.js; added as Tier 2.7.
- **`hotfix-table-sorting-by-geo` must be integrated** into the new DE — added as its own workstream (see "Pending integration" below Tier 1). It cannot be git-merged (branched before this branch's table rework); it has to be ported. All table-touching audit items are sequenced after/with the port.
- **(2026-07-22) Keep the "Data Explorer (Old)" Pagefind filter chip for now** (§4.8) — no separate action; it retires together with the old explorer's trees under Tier 4.4, not before.
- **(2026-07-22) Restore the topic-level content** dropped from the new explorer (§4.8) — see that section for the concrete restoration plan.

**Safety net for Tiers 2–4:** the characterization harness (`scripts/de-characterization.mjs`, 3 indicators × all 5 views) — re-baseline before starting and `--check` after each stage.

---

## Tier 1 — Small correctness fixes and dead weight (hours; near-zero risk)

**Status: closed 2026-07-13.** 1.3–1.7 shipped as Tasks 1–5 on `feature-de-tier1-audit-fixes` (merged at `55e59da7dc`); 1.1 and 1.2 shipped the same day inside the `hotfix-table-sorting-by-geo` port.

New findings from this pass. Each is independently shippable.

### 1.1 `type: 'natural'` sorting silently downgraded — real behavior gap
**Status: closed 2026-07-13** — resolved in the borough-grouping port by loading `naturalSort.js` on the new `single.html` (parity with the old explorer).

[table.js:652](../assets/js/data-explorer/table.js#L652) declares `{ type: 'natural', targets: ['_all'] }`, but the naturalSort plugin (`assets/js/naturalSort.js`) is loaded **only by the old explorer's** `single.html:1123-1128` — never by the new one. DataTables falls back to plain string detection, so the new explorer's table sorts differently than the old one for mixed alphanumeric columns.
**Decide:** load `naturalSort.js` on the new `single.html` (parity with old), or delete the columnDef (accept string sort). Column 9 already has its own numeric sort renderer, so check which hidden/visible columns actually change order before choosing. **Fold into the borough-grouping port PR** (see Pending integration): the port changes default sort behavior (Area-alphabetical when ungrouped), which is exactly where natural-vs-string sorting is most visible.

### 1.2 `select: true` is inert
**Status: closed 2026-07-13** — deleted as part of the borough-grouping port.

[table.js:636](../assets/js/data-explorer/table.js#L636) — the DataTables Select extension is not installed (`datatables.net-select` absent from package.json and head.html). The option does nothing. Delete it (also removes confusion with the CLAUDE.md "omit Select" gotcha). Fold into the borough-grouping port PR alongside 1.1.

### 1.3 Case-inconsistent percentile guard (6th copy disagrees with the other 5)
**Status: closed 2026-07-13** — Tier 1 SDD run.

The percent-display rule appears 6×; five use `!…includes('percentile')` but [trend.js:221](../assets/js/data-explorer/trend.js#L221) uses `!…includes('Percentile')` (capital P). A measure named "…percentile…" vs "…Percentile…" formats differently on the trend tab than everywhere else. Fixed for free by Tier 2.1's shared helper; or as a one-character fix now.

### 1.4 Write-only dead state: `DE.lookups.measureAbout` / `measureSources`
**Status: closed 2026-07-13** — Tier 1 SDD run.

Written at [measures.js:441-442, 516-517](../assets/js/data-explorer/measures.js#L516) and initialized in global.js, but **no reader exists anywhere** (the "used by table.js" comment is stale). Delete the fields, the accumulation loop lines, and the global.js entries.

### 1.5 Dead/vestigial code, one commit
**Status: closed 2026-07-13** — Tier 1 SDD run.

- [map.js:365-368](../assets/js/data-explorer/map.js#L365) unused `resetHighlight` (its own comment says so) and [map.js:458](../assets/js/data-explorer/map.js#L458) unused per-feature `let currentlyHighlighted` (an abandoned start on Tier 2.4's hover fix); `calculatePercent` destructured but unused at both renderer call sites.
- [global.js:306-315](../assets/js/data-explorer/global.js#L306) commented-out `renderTitleDescription`.
- [global.js:257-272](../assets/js/data-explorer/global.js#L257) `copyCitation` still builds/selects/removes a throwaway `<textarea>` that `navigator.clipboard.writeText` never uses (consolidated #26 — the last uncosed quick item).
- [global.js:653](../assets/js/data-explorer/global.js#L653) trailing comma-operator (`hiddenElement.download = …,` then `.click()`) — works by accident; make it two statements.
- [311.js:24-28](../assets/js/data-explorer/311.js#L24) a `.then()` that only returns its input.
- Pure-alias functions: `updateLinksSelectionSummary` ≡ `updateLinksDropdownToggle`, `getActiveTrendMeasureId` ≡ `getSyncedTrendMeasureId` (measures.js) — inline or keep one name.
- [global.js:423-436](../assets/js/data-explorer/global.js#L423) `geoTypes` array duplicates `GEO_RANK_BY_PRETTY_TYPE`'s keys in the same order → `const geoTypes = Object.keys(GEO_RANK_BY_PRETTY_TYPE);` (string-key insertion order is guaranteed).

### 1.6 Unused dependencies (package.json + head.html)
**Status: closed 2026-07-13** — Tier 1 SDD run; its RawGit fallout moved to the site-wide audit on 2026-07-23 (see immediately below).

- **`ci` (^2.3.0)** — referenced nowhere; almost certainly an accidental `npm i ci`. Remove.
- **`leaflet-control-geocoder`** — loaded in head.html:226-227 on every data-library page; its only reference in the entire repo is a *commented-out* line in `content/data-features/flood-vulnerability-index/fvi.js:70`. **Per decision: keep the npm package, delete only the head.html script tag** (stops shipping ~150 KB of unused JS to every data-library page while keeping the package available if the fvi geocoder idea is revived).
- **rawgit PointInPolygon CDN** ([head.html:230](../themes/dohmh/layouts/partials/head.html#L230)) — RawGit shut down in 2019; `@mapbox/leaflet-pip` is already in package.json as the replacement. (Known from the site-wide audit; the DE page eats this dead request on every load. **Fixed** — the `<script>` tag was removed as part of 1.6's execution.)

### 1.7 Make "Download data" work sensibly on every tab (user-requested; confirmed defect)
**Status: closed 2026-07-13** — Tier 1 SDD run.

The bar tab's Download link (de-tab-content.html:132) calls `downloadData()`, which serializes `DE.print.CSVforDownload` — but **only trend.js:679, correlate.js:612, and disparities.js:397 ever set it**. Neither `renderBar` nor the map path does. Consequences, verified in code:
- Fresh load → open bar tab → Download: `CSVforDownload` is `undefined`, so the file contains the literal string `undefined`.
- Visit trend, return to bar, Download: you get the **trend** CSV, but `getCurrentDataDownloadView()` names the file "(bar view)" because `showBar` sets `chartType = 'bar'` — wrong data under a confident filename.
Fix per tab:
- **Bar:** build a download table in `renderBar` from `barData` (mirror trend.js:673-679's pattern — derive an `Indicator` label column, drop internal columns, `.toCSV()`).
- **Table:** already sound via the DataTables `csvHtml5` button (`downloadTableData`, de-tab-content.html:198) — verify only.
- **Trend / links / disparities:** already set CSV correctly — verify only.
- **Defensive:** make `downloadData()` no-op (or disable the link) when `CSVforDownload` is empty, so a stale/missing CSV can never download again.

**Considerations for Tier 1:** all items are provable by grep + one `hugo` build + a click-through, except 1.7 which needs a per-tab download check (open each tab, download, open the CSV). 1.1 is the only one with a user-visible decision attached. The geocoder script-tag removal touches all data-library pages, not just DE — spot-check one data-feature page after the build.

**Tier 1 execution status (2026-07-13, SDD run):** items 1.3–1.7 shipped as Tasks 1–5 on `feature-de-tier1-audit-fixes`, merged into `feature-new-data-explorer` at `55e59da7dc`. 1.1/1.2 remain deferred to the `hotfix-table-sorting-by-geo` port PR per the decision above.

### New follow-up surfaced during 1.6's execution — moved out of this doc

**Status: moved out 2026-07-23** — tracked in §5c of `documents/site-wide-audit-2026-06-27.md`, not here.

Removing the dead RawGit PointInPolygon `<script>` tag from `head.html` (item 1.6) exposed — but did not cause — a pre-existing broken `area.contains(...)` call in the unrelated `rats-in-your-neighborhood` data feature, plus dead RawGit OpenLayers tags on three templates. None of it is data-explorer work.

**Moved to §5c of `documents/site-wide-audit-2026-06-27.md`; track status there, not here.** The move also picked up a third affected template the original note missed (`take-action/email-electeds.html`) and downgraded the "the rats map is probably broken in production" line to an explicitly unverified hypothesis pending a console check.

---

## Pending integration — port `hotfix-table-sorting-by-geo` (before any other table work)

**Status: closed 2026-07-13.** Ported (not merged) onto `feature-new-data-explorer`, with 1.1 and 1.2 folded in; live-browser verified. Details in the execution-status block at the end of this section.

**What the branch adds** (2 commits, `3eec76d023` + `4c06062296`; touches table.js ±201, single.html +20, app.js +24, global.js +1):
- A **"Group neighborhoods by borough" checkbox** (default on) in the table options panel, with a `groupTableByBorough` flag.
- A **third grouping level** — Time > GeoType > **Borough** — with fully-qualified hierarchical group keys (`time||geo||boro`), ancestry `data-time`/`data-geo`/`data-boro` attributes on rows and headers, and per-level indent/shading CSS.
- A **rewritten `handleToggle`** that resolves a header's descendants by level attribute — cleaner than the current next-row/`data-group` inference and it supports the 3-level hierarchy.
- **Conditional `orderFixed`**: BoroID added when grouping (keeps boroughs contiguous), dropped when ungrouped so users can sort any column freely; default sort = GeoID when grouped, Area-alphabetical when ungrouped.

**Why it can't git-merge:** it branched from `b73a26c7e6` — *before* this branch's DE-namespace refactor and all the 2026-06/07 table rework. It edits an older table.js shape: bare `let groupTableByBorough` global, no-arg `renderTable()`, Area at column index 7 / hidden `[0-6]` / `groupColumnGeo = 1` (current: Area at 8, hidden `[0-7]`, `groupColumnGeo = 2` — the pivot gained `GeoTypePretty`), `fixedHeader: true` still present in its base, and an app.js `$("#chartView")` handler that no longer exists. **Port the feature, don't merge the branch.**

**Porting notes:**
- State goes to `DE.table.groupByBorough` (not a bare global); toggle handler re-renders via `renderTable(DE.table.tableData)` and must respect the current lazy-render/`tableNeedsRender` flow (a toggle flip while the table pane is closed should mark `tableNeedsRender`, not render into a hidden pane).
- Shift all column indexes +1 for the current pivot shape; re-check `searchCols`, `columnDefs.visible`, `notSearchCols`, and the group column constants against the live column list.
- The ported `handleToggle` replaces the current one — **keep the single-bind-at-init fix** (current code deliberately binds once per table init, not per draw; see table.js:746-750).
- Do not carry over anything else from the old base (no `fixedHeader`, no old sort direction) — port the *feature*, not the file.
- The hotfix's default-sort change interacts with 1.1 (natural sort) — decide 1.1 in the same PR.

**Sequencing:** this lands **before** Tier 2.2 (notes renderer touches table.js) and before any other table.js edits, so consolidation work doesn't have to be redone under it. Verify with: harness `--check`, plus manual toggle on/off at NTA and Borough geographies, collapse/expand at all three levels, and column sorting in ungrouped mode.

**Port execution status (2026-07-13):** DONE on `feature-new-data-explorer`. Feature ported (not merged) with all indexes remapped +1 for the current pivot (`groupColumnGeo=2`, `groupColumnBoro=6`, `sortBy` 3/8, `orderFixed` GeoRank=4 / BoroID=5); state on `DE.table.groupByBorough`; toggle handler in app.js respects the lazy-render (`tableNeedsRender`) flow; drawCallback keeps the current branch's stale-group `.remove()` + `syncTableAreaSearchInput()`; single-bind `handleToggle` preserved with the new descendant-attr logic (renamed `bindTableGroupToggles` 2026-07-25); markup + nested-level CSS moved to `de-tab-content.html` (not single.html, where the current table markup lives). **1.2** folded in (deleted inert `select: true`). **1.1** resolved by loading `naturalSort.js` on the new `single.html` (parity with old explorer for user testing); verified the plugin now registers `natural-*` sort types. Live-browser verified: 3-level grouping + fully-qualified keys, toggle on/off (Area alpha-sort across boroughs when off), collapse/expand at borough + geotype levels, and the `hasBorough` guard suppressing borough sub-headers for Citywide and Borough geotypes.

---

## Tier 2 — Consolidation within the SPA (days; mechanical, characterization-checkable)

**Status: closed 2026-07-14.** All seven items shipped — 2.1, 2.2, 2.5, 2.6, 2.7 via SDD on `feature-de-tier2-consolidation`; 2.3 and 2.4 inline on the same branch. The one carve-out was the `window.mapInterop` dedup listed under 2.3, deliberately left to 4.3 — since closed there (2026-07-27).

### 2.1 One `resolveMeasureDisplay()` helper for the percent/display rule (6 sites)
**Status: closed 2026-07-14** — shipped via SDD on `feature-de-tier2-consolidation`.

map.js:322, bar.js:120, trend.js:221, correlate.js:247 + 267, disparities.js:92 all reimplement: *percent-ish and not percentile → `%` with bare subtitle; else DisplayType with parenthesized subtitle*. Extract one helper in global.js returning `{ isPercent, displayUnit, measurementDisplay }`. Fixes 1.3 as a side effect and makes the five tabs provably agree.
**Consider:** the sites differ slightly in what they build (subtitle vs. displayType only) — design the return shape off the union, don't force-fit; verify with the harness plus one percent, one rate, and one number measure.

### 2.2 One notes renderer (5 sites)
**Status: closed 2026-07-14** — shipped via SDD on `feature-de-tier2-consolidation`.

`updateTableReliabilityNotes` (table.js:187), the bar-notes block (bar.js:72-83), `renderTrendNotes` (trend.js:117), and the inline copies in correlate.js:361-371 / disparities.js:158-170 all do: dedupe `Note` values, `filter(Boolean)`, hide/show a holder, append `<div class='fs-xs'>` per note. Extract `renderUnreliabilityNotes(holderEl, rows→notes)`. Also fixes the `innerHTML +=` reparse loop (consolidated #18) in one place.

### 2.3 map.js internal deduplication
**Status: closed 2026-07-14** (`5b789f1788`), with one deliberate exception — the `window.mapInterop` dedup below was **not** done here; it shipped later as 4.3 (2026-07-27).

The choropleth and bubble renderers duplicate, nearly verbatim:
- the **citywide popup + one-shot trend-tab nudge** block (4 copies: map.js:497-518, 628-636, 677-693, 724-745);
- the **click-to-trend-tab** handler (5 copies);
- the topo `fetch → topojson.feature → attachDataToGeojsonFeatures` pipeline (2 copies);
- the `window.mapInterop` assembly (2 copies, different shapes — see Tier 4.3).
Extract `handleCitywideOnly(map, data, metadata)` and `switchToTrendTab()`; share the topo-load pipeline. ~150 lines removed, and the "consume the one-shot flag" logic exists once instead of twice.

### 2.4 O(n) hover reset → track-previous (also a perf fix)
**Status: closed 2026-07-14** (`3cddd6e4d2`) — and wider than planned: the sweep turned out to be load-bearing for bar.js-driven highlights, so those route through the same tracker.

[map.js:466-468](../assets/js/data-explorer/map.js#L466): every polygon `mouseover` runs `geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l))` — ~195 restyles per mousemove on NTA. Track the previously highlighted layer and reset only it (the pattern bar.js already uses for its side of the interop, bar.js:544-588). This is consolidated #17, the oldest still-open perf item; the abandoned `currentlyHighlighted` from 1.5 shows it was started once.

### 2.5 Shared CSV-download builder for correlate/disparities
**Status: closed 2026-07-14** — shipped via SDD on `feature-de-tier2-consolidation`.

correlate.js:588-612 and disparities.js:372-397 build the same `aq.select(aq.not(<17 identical columns>))` + two `derive`s. Extract one `buildLinksDownloadTable(rows, extraDrops, labels)`.

### 2.6 Hoist the static DOM-builder helpers out of `renderMeasures()`
**Status: closed 2026-07-14** — shipped via SDD on `feature-de-tier2-consolidation`; it was the first slice of 4.1.

Within Tier 2 scope (no behavior redesign): `setBadgePillState`, `createBadgePillButton`, `createBadgePillLabel`, `createDropdownIdFragment`, `createBadgePillDropdown`, `setDropdownMenuItemState` (measures.js:540-668) capture **nothing** per-indicator — they're pure DOM factories redefined on every indicator load. Move them to module scope above `renderMeasures`. This is the safe first slice of Tier 4.1 and shrinks `renderMeasures` by ~130 lines on its own.

### 2.7 Split map print out of print.js (user-requested)
**Status: closed 2026-07-14** — shipped via SDD on `feature-de-tier2-consolidation`.

print.js is 1,376 lines; roughly 1,000 of them are the off-screen Leaflet map-export machinery (constants at :20-32, everything from `buildMapExportFilename` through `exportLeafletMap`/`renderMapPreview`, :335-1301), while the chart path is a ~30-line vegaEmbed re-render. Split into:
- **`print.js`** — modal shell (`setPrintModalState`, loading/error states), shared text-wrapping helpers, chart preview, `bindPrintControls`;
- **`print-map.js`** — the map-export constants, off-screen Leaflet build, tile-coverage machinery, canvas compositing, and `renderMapPreview`.
Load `print-map.js` immediately before `print.js` in single.html (15th script tag — consistent with the no-bundling decision). Cross-file calls (`renderMapPreview` from `bindPrintControls`; `setPrintModalState`/`splitTextIntoPrintLines` from the map exporter) resolve at call time, so the only load-order constraint is "both before user interaction" — state it in the template comment like the existing ones.
**Consider:** keep the existing Leaflet-export gotchas intact and documented in the new file header (canvas renderer, `setView()` before adding vector layers — see CLAUDE.md's map-export note). This is a pure file move; the harness plus one manual map export (choropleth + bubble) proves it.

**Considerations for Tier 2:** all seven are behavior-preserving relocations/extractions — the kind the characterization harness was built for. Do them as separate commits so a `--check` failure pinpoints the stage. 2.3/2.4 change hot interaction paths; add a manual hover + citywide-indicator check (harness doesn't simulate hover). 2.7 needs a manual save-map + save-chart check on both map types.

**Tier 2 execution status (2026-07-14): COMPLETE.** 2.1, 2.2, 2.5, 2.6, 2.7 shipped via SDD on `feature-de-tier2-consolidation` (6 commits, whole-branch review clean). **2.3** (`5b789f1788`) and **2.4** (`3cddd6e4d2`) executed inline on the same branch: map.js 788 → 738 lines; `switchToTrendTabOnce()` (5 copies), `handleCitywideOnly()` (2), `loadMapGeojson()` (2) extracted; the per-mouseover `eachLayer` sweep replaced with a tracked `highlightedLayer`. Harness `--check` passes after each; clean `hugo` build.

Two things this surfaced, worth carrying forward:
- **The `eachLayer` sweep was load-bearing.** It was the only thing clearing a highlight applied by **bar.js** through `window.mapInterop`. A track-previous fix confined to map.js would leave *two* polygons highlighted after hovering the bar chart and then the map. The fix therefore routes bar-driven highlights through the same tracker (`highlightFeature`/`resetHighlight` on the interop), with `resetHighlight` falling back to the tracked layer when a caller passes a stale one. Verified in-browser across map-hover, bar-driven, and mixed sequences.
- **The `window.mapInterop` dedup listed under 2.3 was deliberately *not* done** — the two shapes differ and collapsing them means touching bar.js's shape-sniffing. That was Tier 4.3's work, done 2026-07-27; the tracked-highlight design described above survived it, with `reset()` now calling `resetHighlight()` with no argument so the fallback is the only path.
- Perf, measured (not estimated): the removed sweep cost ~0.09 ms/hover at 34 polygons and ~0.14–0.20 ms at 59, scaling linearly — so NTA's ~195 extrapolates to ~0.5 ms per mousemove — against a 0.03 ms new hover path. Note neither harness indicator (2380: Borough/CD/UHF42; 2414: UHF34) actually offers NTA, so the headline NTA number is extrapolated, not directly measured.

---

## Tier 3 — Performance (days; measurable wins, medium risk)

**Status: closed 2026-07-14.** 3.1, 3.1b, 3.2, 3.2b and 3.3 all shipped on `feature-de-tier3-perf`, verified in-browser. One standing won't-do inside 3.3: CSS `| minify`, rejected by the user.

### 3.1 Cache static fetches across indicator switches (consolidated #15 — biggest network win)
**Status: closed 2026-07-14** — `loadOnce()` cache (`0ddf4248bb`), extended by the 3.1b indicator-data cache (`9b758fe47c`).

Every indicator switch re-fetches: `GeoLookup.json`, `TimePeriods.json` (data.js:345-391), `comparisons.json` (data.js:19), the TopoJSON for the current geotype (map.js:389, 592 — re-fetched even on a **time-period-only** change), and the 311 crosswalk CSV (311.js:23). All five are static per session. A ~10-line `loadOnce(key, loader)` promise-cache eliminates 3–5 requests per indicator switch and the TopoJSON re-parse on every dropdown change.
**Consider:** TopoJSON per-geotype cache holds ~1-3 MB parsed per geography visited — bound it or accept it (fine for a session). `comparisons.json` is already fetched conditionally; cache the promise, not the filtered result.

### 3.2 Parallelize the comparison fetch with the data fetch
**Status: closed 2026-07-14** (`afc7f7893c`), extended by 3.2b's cold-load parallelization (`0b1130b8b3`).

`loadIndicator` awaits `fetch_comparisons()` **before** starting `loadData()` (data.js:284-290 — the code itself asks "why are we waiting for this?"). `createComparisonData` needs nothing from `loadData`; run them under `Promise.all`. Saves one full round-trip on every comparison-bearing indicator load.
**Consider:** `createComparisonData` reads `indicators` (already loaded) and `DE.lookups.indicatorComparisonId` (set before the await) — verify no hidden ordering dependency on `timeTable` (it joins `timeTable` only later, in showComparisonTrend — safe).

### 3.3 DE-page dependency slimming in head.html (shared with site shell)
**Status: closed 2026-07-14** — every bullet shipped except CSS `| minify`, which the user rejected during the commit split; don't re-propose without asking. Several bullets landed differently than first planned (the FA-woff loop is not dead; `leaflet-pip` was never in head.html) — the corrections are inline below.

Directly measurable on the explorer's LCP; all previously flagged site-wide, still unfixed, listed here because the DE page pays for them:
- **Font Awesome shipped twice** — CSS+webfonts *and* the big `all.min.js` SVG-injector (head.html:111-117). Drop the JS.
- **No CSS minification** (head.html:137-139) — add `| minify`. **Proposed and implemented 2026-07-14, then rejected by the user during the per-bullet commit split ("don't want the minify change") — reason not given.** Left out of the 3.3 commits; don't re-propose without checking in first.
- **Duplicates:** favicon 2× (head.html:49, 105); nyc-lib CSS loaded conditionally *and* unconditionally (head.html:91-94, 129-131).
- **The "dead FA-woff Hugo loop" (head.html:121-127) is NOT actually dead — verified 2026-07-14, correcting the earlier note.** It looks like dead code (`$woff_got` is assigned and never used), but evaluating `$woff.RelPermalink` as the argument to the inner `resources.Get` triggers Hugo's lazy-publish-on-access side effect for the *original* matched resource — confirmed empirically: `docs/node_modules/@fortawesome/fontawesome-free/webfonts/*.woff2` exist in the built output, and the published, fingerprinted FA CSS (`docs/node_modules/@fortawesome/fontawesome-free/css/all.min.<hash>.css`) has `@font-face` rules using relative `url(../webfonts/fa-solid-900.woff2)` that resolve to exactly that directory. Deleting this loop — as the earlier version of this plan said to do — would silently break every Font Awesome icon on the site (235 `class="fa..."` usages across 58 templates, including the shared header/footer) the moment `all.min.js` is also dropped and there's no SVG-injector fallback left. Fix instead of delete: replace the pointless double-`Get` with the `.Publish` idiom already used two blocks later in this same file for the Leaflet marker icons (head.html:230-231) — same intent (publish a resource for another file's relative reference, without printing its permalink), same effect, clearer than relying on an accidental `.RelPermalink`-read side effect.
- **DataTables bundle carries `buttons.print` and `rowgroup`** (head.html:171-179) — **verified 2026-07-14, correcting the note below:** both plugins are dead in *both* explorers. `data-explorer-old/table.js` builds its group rows manually via `drawCallback`/`createGroupRow` (same pattern as the new explorer) and its `buttons:` array only extends `csvHtml5` — no `rowGroup:` config or `extend: 'print'` anywhere in `assets/js` or `themes/dohmh/layouts`. The only other "rowgroup" string in the tree is an unrelated ARIA `role="rowgroup"` attribute in `responsive-table.js`. No per-section gating needed — drop both from the shared bundle outright. (Aside, out of scope for 3.3: `data-explorer-old/single.html:1093-1102` builds its *own* separate DataTables bundle, including these same two plugins, loaded inline in its `main` block — redundant with head.html's shared bundle, which also loads on these pages since Hugo's `.Kind` is `"page"` there. Old-explorer pages currently double-load all of DataTables. Left alone per "retired, do not modify.")
- **easybutton / colorIcon / uhflist** are loaded inside the same shared block as Vega/D3/DataTables/Leaflet (head.html:143-234) — **verified 2026-07-14: `leaflet-pip`, listed here in the earlier version of this plan, isn't loaded in head.html at all** (repo-wide grep found only a `data-features/heatstory.html`-local reference; nothing to gate in this file). `easyButton`/`colorIcon` are confirmed unused anywhere in `assets/js/data-explorer` and their only real consumer is `overlap-tool-with-map.html` → `data-features/neighborhood-overlap.html` — one page, not "data-features" broadly, but since the head.html condition already covers nearly every page on the site (`.Kind == "page"` is true for almost all leaf content), the achievable/minimal fix here is just excluding `.Section "data-explorer"` from these two, not scoping them down to that one page (that's a separate, bigger site-wide optimization outside this tier). `uhflist` is used by **neighborhood-reports** (see below) — DE pays for it and never touches it, matching the earlier note.

- **UHF neighborhood-file sprawl** — audited 2026-07-14 and written up in **§5a of `documents/site-wide-audit-2026-06-27.md`**, since most of it lives outside the DE. The piece that belongs to 3.3: `uhflist.js` (20 KB, `var neighborhoods`) is render-blocking on every DE page and the SPA never reads it — gate it to `neighborhood-reports`. The rest (a stale-vintage `uhflist.js` vs `uhflist.json` mismatch that changes numbers shown on neighborhood reports, three dead partials, an unreferenced `ccd-to-uhf42.json` and `static/UHF42.csv`, duplicate UHF42 geometry origins) is site-shell work, not DE work.

*(A fourth item — bundling the 14 SPA scripts, consolidated #19 — was here; dropped per the 2026-07-13 decision to keep separate script tags for source-line traceability.)*

**Tier 3.1 + 3.2 execution status (2026-07-14): DONE** on `feature-de-tier3-perf` (branched off `feature-de-tier2-consolidation`, since 3.1 edits the `loadMapGeojson` that Tier 2.3 had just extracted). **3.3 also DONE (2026-07-14)** — see write-up immediately below Tier 3.3 above (rowgroup/print, FA-woff loop, and easybutton/colorIcon/leaflet-pip corrections) for what changed and why each fix landed differently than first planned. All verified in-browser (Playwright) across a DE page, the old explorer, `find-your-uhf` (data-features), and neighborhood-reports, plus an A/B rebuild (`git stash` head.html) to rule out two pre-existing NR console errors as regressions.

- **3.1** (`0ddf4248bb`): `loadOnce(key, loader)` promise cache in global.js; the five static loads routed through it. Caches the *promise* (concurrent callers share one in-flight request) and evicts rejections so a failure isn't sticky for the session. **One real trap found:** `topojson.feature()` returns features whose `properties` are the topology's own objects **by reference** (verified in `node_modules/topojson-client/src/feature.js:14`), so `attachDataToGeojsonFeatures`'s `feature.properties.dataValue = null` in-place write would have leaked one render's data into every later render of that geotype once the topology was cached. Both branches now build a new properties object.
- **3.2** (`afc7f7893c`): `loadIndicator` runs `fetch_comparisons()` and `loadData()` under `Promise.all`. No-shared-state claim verified by grep, not assumed: all comparison reads live in measures.js (render time), and the comparison data's `timeTable` join is in `showComparisonTrend` (measures.js:1720), not in `createComparisonData`.
- **Verified in-browser** (the harness reloads per indicator, so it structurally *cannot* see a cross-switch cache — this needed a real session): after three in-app indicator switches, GeoLookup/TimePeriods/comparisons/311-crosswalk are fetched **once each** (was once per switch); revisiting an indicator reuses its cached topology; a **time-period-only change re-renders the map with zero new topo requests** and correct per-year values on all 59 CD features (15.5 → 14.4), proving no stale-data leak. For 3.2, the main data fetch and comparisons.json now start in the same tick (455 ms vs 456 ms). Harness `--check` green after each stage; clean `hugo` build.

- **3.2b** (`0b1130b8b3`, surfaced while measuring 3.2 and done on request): `loadGeo()`/`loadTime()` were nested *inside* `loadData()`'s `.then()`, so on a cold load they didn't start until the indicator data fetch had resolved — an extra round-trip for two files that don't depend on the indicator rows. All three now start under one `Promise.all` inside `loadData`; the `.then()` chain became a `try`/`catch` so the error path is unchanged (log, and `draw311Buttons()` still runs). First-load-only win — 3.1's cache already covered every later switch. Verified on a cold load: indicator rows, comparisons.json, TimePeriods.json and GeoLookup.json all issued **within 2 ms of each other**, with map/geo/time/table state all populating as before.

- **3.1b — indicator-data cache** (`9b758fe47c`, asked for after the 3.2 network trace showed `2380.json` fetched twice per load): the same indicator file is requested up to three times in one load — as the primary indicator (`loadData`), as one of its own comparison series (`createComparisonData` — **all 57** comparison-bearing indicators list themselves), and as a correlate's secondary series (`createJoinedLinksData`). ~200 KB re-downloaded and re-parsed each time. All three now go through a single `loadIndicatorData(id)` helper backed by `loadOnce`. **The cache holds the arquero table, not the raw JSON, deliberately:** arquero's `fromJSON` mutates the object it's handed (`col[i] = new Date(val)`, `from-json.js:192`) and for column-oriented input `parseJSONColumns` returns *that same object* — a raw-JSON cache would hand every later caller an already-mutated payload. Same family as the topojson properties-by-reference trap in 3.1. `autoType: false` unifies the three call sites (matches `loadGeo`, keeps primary and comparison tables identically typed for trend.js's concat) and costs nothing — verified empirically that autoType converts **no column in any of the 282 data files**. Verified: 4 data requests per load instead of 5.

- **Vega hidden-pane sizing bug, surfaced by 3.1b** (`35fb9c5235`): correlate/disparities embed into `#links` with `"width": "container"`, from the tab button's click handler — which returns *before* Bootstrap reveals the pane. Vega then measures a `display:none` container, pins the view to **0 px**, and paints a blank chart that nothing recovers (`view.resize()` re-runs layout but never re-measures the DOM). Whether a render lost that race came down to **how long its data fetch took** — the fetch had been an accidental "wait for the pane", so removing it exposed a latent bug (repro: load an indicator on the Bar tab, click Correlate → empty chart). Fix: `getChartContainerWidth(selector)` in global.js measures the container, laying the pane out invisibly (`display:block; visibility:hidden`, restored in the same task) if it hasn't been revealed yet, and the specs pass that number plus the `fit-x` autosize that `"container"` implies. **A first attempt that simply waited for the reveal was rejected by the user** — correct chart, but visibly empty pane for the length of the fade. Measuring instead paints the chart ~128 ms after the click while the pane is still fading in. Widths identical to before (correlate 483/447 px, disparities 431 px; screenshot pixel-identical).

**Extended to trend/bar (2026-07-14).** The same `#trend`/`#barHolder` containers sit inside identical `.tab-pane.fade` wrappers and both specs used a literal `"width": "container"` — same latent bug, just usually masked by enough compute/paint time between the click and `vegaEmbed` for Bootstrap to have already revealed the pane. Fixed the same way: `getChartContainerWidth('#trend') || "container"` ([trend.js:435](../assets/js/data-explorer/trend.js#L435), with the `fit-x` autosize it implies now made explicit since trend.js had no prior `autosize` key) and `getChartContainerWidth('#barHolder') || "container"` ([bar.js:486](../assets/js/data-explorer/bar.js#L486), whose pre-existing `"autosize": {"type": "fit", ...}` was left untouched — a deliberate, older difference from `fit-x`, not something this fix introduced). A brief flash can still remain after this: genuine Vega compile/render time (spec parsing, layout, first paint), not the pane race — flagged as a known, low-priority residual, not a bug. If it's ever worth chasing: trimming trend.js's layered label-collision transforms (`buildLabelCollisionTransforms(5)`) or reusing a persistent Vega view (`.data().run()`) instead of a full `vegaEmbed` teardown/rebuild per render — both un-investigated.

- **Harness base URL** (`d5fb2ea700`): `scripts/de-characterization.mjs` hardcoded `/dev-stage/`; `DE_BASE_URL` now overrides it. **Lesson: never start a second Hugo server in this repo** — spinning one up on :8081 to get the expected prefix rewrote the *running* server's asset URLs and livereload port (87 console errors on the user's tab). Point the harness at whatever server is already up instead: `DE_BASE_URL="http://localhost:8080/local-stage/"`.

**Considerations for Tier 3:** 3.1/3.2 are testable with the harness plus a network-tab before/after; 3.3 touches the shared shell — every change needs a spot-check on a data-feature page, a neighborhood report, *and the old explorer* (still shipping for user testing), not just DE. Measure first (Lighthouse on `/data-explorer/asthma/?id=2380`) so wins are demonstrable.

---

## Tier 4 — Structural (weeks; the remaining consolidated-doc backbone)

**Status: mixed, as of 2026-07-30.** Closed: 4.1 (+ its naming sweep), 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.12. **Open: §4.13** (upstream metadata question, no crash), plus the low-priority 4.2 follow-up and 4.11. **Deferred by decision: 4.4**, until comparative user testing ends — 4.12 was its gate and is now cleared.

These are the right long-term moves; each is a mini-project. Ordered by value-per-risk.

### 4.1 Dismantle `renderMeasures()` (measures.js:420-1915 — the 1,500-line function)
**Status: closed 2026-07-24** — 5 staged commits on `feature-de-tier4.1-render-measures`, merged at `62f9bc8798`; `renderMeasures` went from ~1,338 lines to 199. One incidental finding left open: the dead `DE_MEASURE_RULES` trend id lists noted at the end of this section.

It currently: resets per-indicator state, computes table defaults, sorts measures into per-tab arrays, defines ~35 closures (trend pills, links controls, and **all seven `show*` renderers**), and toggles tabs. The renderers are re-created per indicator purely so they can close over… almost nothing (`selectedComparisonLegendTitle` and four DOM refs). Staged plan:
1. Tier 2.6 (pure DOM factories) — done above.
2. Hoist the trend-pill control cluster to module scope; move `selectedComparisonLegendTitle` into `DE.trend`.
3. Hoist the links/disparities control cluster; its state already lives in `DE.links`/`DE.disparities`.
4. Define `showMap/showBar/showTable/showTrend/showBoroughTrend/showComparisonTrend/showLinks` **once at module scope** reading `DE.*` (consolidated #3/#4). `renderMeasures` shrinks to: reset state → build per-tab arrays → set defaults → build controls → toggle tabs (~250 lines).
**Consider:** this is the highest-value understandability change left, and the riskiest. The DE-namespace refactor was explicitly staged to enable exactly this. Requires the harness at every stage plus manual pill/dropdown interaction checks (harness doesn't click pills). Do not combine with any other tier in one PR.

**Execution status (2026-07-24, branch `feature-de-tier4.1-render-measures` off `feature-new-data-explorer`, 5 commits `7c0b3c7c3d`..`f5867cacf3`; fast-forward merged into `feature-new-data-explorer` at `62f9bc8798`).** `renderMeasures` dismantled from ~1,338 lines to **199**, now reading as a linear setup sequence (reset state → build per-tab arrays → set defaults → build controls → enable/disable tabs → activate tab). Design + plan in `documents/tier-4.1-render-measures-design.md` / `-plan.md` (planning artifacts kept uncommitted by user preference). Executed in 5 staged commits, each independently verified — `lint` 0 / `characterize --check` PASSED / `smoke` 13/13, plus interactive Playwright on asthma 2380 (all seven `show*` renderers, trend measure+comparison pills, correlate dropdown, disparities) and air-quality 2023 for the trend cluster:
- **Stage 0 / Task 1** (`7c0b3c7c3d`): `selectedComparisonLegendTitle` → `DE.trend`; dead `syncTrendSelectionsToMapSelection` global deleted.
- **Stage 1 / Task 2** (`fef831f817`): trend-pill cluster (12 closures + `buildTrendSelectionControls`) hoisted to module scope behind a new lazy `resolveMeasuresPillRefs()` (mirrors `resolveTabReferences`).
- **Stage 2 / Task 3** (`d247e35f5b`): links/disparities cluster (11 closures + `buildLinksSelectionControls` + the `syncLinksSelectionsToMapSelection` assignment) hoisted; 4 links DOM refs joined the resolver; misleading var `dropdownLinksMeasures` → `linksDropdownMenu`.
- **Stage 3 / Task 4** (`9da878f7db`): the 7 `show*` renderers + 2 table helpers hoisted, kept as **assignments** to global.js's `let`s (a `const` would redeclare → load-time SyntaxError on every page). Proven a pure move by reverse-transform byte-identity.
- **Stage 4 / Task 5** (`f5867cacf3`): toggle element id `dropdownLinksMeasures` → `linksDropdownToggle` (new explorer only) so each element's id matches its JS variable.

Pure relocation throughout — no behavioral change, and no load-order, `single.html`, `section.html`, `eslint.config.mjs`, or CLAUDE.md-architecture change. **Incidental finding (separate, pre-existing — not part of this tier):** `DE_MEASURE_RULES.trendAnnualAverageMeasureIds [365,370,375,391]` and `trendSummerMeasureIds [386]` match **zero** measures across all 282 current indicators (current PM2.5 = 1425/1426/1427), so `showBoroughTrend`'s annual-average/summer slice branches are dead code against the live data. Worth a follow-up prune; tracked here as a `DE_MEASURE_RULES` staleness item.

### 4.1 follow-up — naming sweep

**Status: closed 2026-07-25** (raised the same day) — 7 commits on `feature-de-naming-cleanup`, zero subagents. One item deliberately deferred with its cost measured: `links` → `correlate`.

4.1's Stage 4 renamed one element id whose name described something other than what the element was. The question that opened this sweep was whether that was a one-off; it was not. Branch `feature-de-naming-cleanup` off `feature-new-data-explorer`, executed inline (no subagents — every item is grep- or `no-undef`-provable, so the controller did the work directly).

**Finding A — names describing the wrong thing.** Shipped in three commits:

| Old | New | Why it misled |
|---|---|---|
| `.btn-toggle-disparities` / `btnToggleDisparities` | `.de-correlate-pill-row` / `correlatePillRow` | A *container* named as a button; it delegates clicks for both the Measures dropdown and the Disparities button (`befc1b2218`) |
| `clickLinksToggle` | `bindCorrelateControls` | Doesn't click; not limited to Links (`7858735931`) |
| `handleToggle` | `bindTableGroupToggles` | Names no particular toggle |
| `draw311Buttons` | `render311Links` | Renders `<a>` links, not buttons |
| `#tableCopy` | `#tableViewNote` | Reads as the copy-to-clipboard affordance the table also has |
| `printMenus` / `styleAndPrintMenu` / `printIndicators` / `printIndicatorInfo` | `renderMenus` / `renderMenuSection` / `renderIndicatorList` / `renderIndicatorInfo` | `print` meant both "render into the DOM" and "export/print-to-image" (`d3ed6ed93f`) |

The `print*` set was widened past the original plan on purpose: renaming only two of the four would have left `print` meaning "render" in one file, "export" in another and "render" again in a third — worse than a uniformly wrong vocabulary. Export-side `print*` (`print.js`, `DE.print`, `#printVis`, `printSpec`) is untouched and now unambiguous.

**Finding B — duplicate and invalid element ids** (`f963da0612`, `f0a4f06611`; ids kept to their own commits per CLAUDE.md):
- `#dropdownMenuButton` rendered **twice** on every explorer page — the desktop Take Action toggle (`header-de.html`) and the mobile one (`de-tab-button.html`), both in the DOM though only one is ever visible. Now `takeActionToggleDesktop` / `takeActionToggleMobile`.
- `#311` / `#311label` also rendered twice, and are **invalid CSS selectors** — a leading digit means `querySelector('#311')` throws `SyntaxError`, so only `getElementById` could ever reach them. `de-tab-button.html` had worked around the collision with `id="311-2"`, a suffix that names nothing. The two DE-only partials now use `#contact311Label` / `#contact311LinksDesktop` / `#contact311LinksMobile`. `takeaction.html` deliberately keeps the old names — it is **shared with `data-explorer-old/single.html`**, whose `data.js` still resolves both by those names. Renaming only the DE-only copies still cleared the duplication, since takeaction then holds the sole copy of each.
- `#printTopic` → `#selectedTopicName`, the last render-side `print`.
- A page-wide duplicate-id sweep in-browser went from `{skip-header-target, 311, 311label}` to `{skip-header-target}` alone. That remaining one is site-wide and out of DE scope — see site-wide audit §11. **Since fixed 2026-07-25** (site-wide audit §4a / row 18): the id now lives only on `baseof.html`'s `<main>`. Explorer pages under `data-explorer/` are clear; `data-explorer-old/` still double-renders it, and retires with the tree.

**Finding C — three modals with no accessible name** (`574e856432`). Surfaced by Finding B's sweep, unrelated to the renames and pre-existing: `#topicSelector`, `#indicatorSelector` and `#learnMore` each pointed `aria-labelledby` at an id that exists nowhere in the repo (Bootstrap boilerplate whose title element was replaced at some point). All three announced as bare "dialog", including the dataset picker that is the main way into the explorer. Note the first fix attempt was itself inadequate — labelling each modal with its whole breadcrumb `h4` gave the two picker dialogs the *same* name ("Choose topic > Select dataset"), so each now points at a span around only its own active step. Computed names are now "Choose topic", "Select dataset", "About <indicator>", confirmed against Playwright's accessibility tree.

**Deferred, with cost known:** `links` → `correlate`. The user-facing vocabulary is "Correlate"/"Correlations"; the code says `links` in 454 places across 11 files (222 in `measures.js` alone), plus three external contracts — the `?overlay=links` query param, the legacy `#display=links` / `#tab-links` hashes, and the `links_disparities` GA value. Left alone by decision; options costed in site-wide audit §4.

**Incidental, not acted on:** `documents/data-explorer-architecture.md` is broadly stale beyond the renames applied to it here — it still describes the tree as `data-explorer-new/` and calls `trend.js`, `correlate.js` and `disparities.js` console-logging stubs. Worth a refresh independent of this branch.

**Verification approach.** Deliberately not uniform, per CLAUDE.md's cheapest-sufficient-rung rule: JS identifier renames are proven outright by `npm run lint` (`no-undef`) — the old name ceases to exist — and needed no browser. Class, id and template-string renames are strings on *both* sides, which no static rule here can prove, so each got a targeted in-browser check (delegated click still bound and firing; `getElementById` still resolving; duplicate-id and `aria-labelledby` sweeps; all three 311 destinations still populating). Every commit also passed `characterize --check` and `smoke` 13/13.

### 4.2 One indicator-load pipeline + URL module (consolidated #7/#12, new pin)
**Status: closed 2026-07-26** — 4 commits on `feature-de-tier4.2-load-pipeline`; it also fixed four history defects this entry hadn't recorded. One follow-up left open, immediately below.

The sequence `loadIndicator → printIndicatorInfo → printMenus → renderMeasures → renderCurrentView` is duplicated three times with small drift: `checkURL` (topic-indicator-selector.js:636-705), `popstate` (app.js:374-438), and `selectIndicator` (topic-indicator-selector.js:570-628). URL parsing/coercion is likewise duplicated between `checkURL` and `popstate`, and history writes happen at 5 sites. Extract `loadAndRenderIndicator(id, { pushHistory })` plus `parseSelectionFromURL()`/`serializeSelection()`. Add the stale-response token (consolidated #6) inside the one pipeline while you're there — rapid back/forward or double-clicked indicators can currently interleave fetches.
**Consider:** popstate has subtle extra behavior (menu resync without reload when the indicator is unchanged) — the unified function needs an explicit `sameIndicator` branch, not a force-reload.

**Execution status (2026-07-26, branch `feature-de-tier4.2-load-pipeline` off `feature-new-data-explorer`, 4 commits `a411b1692f`..`3dbc31151d`).** Done, and wider than the entry above anticipated: reading the three call sites turned up **three history-semantics defects plus one missing normalizer call**, none of which this section had recorded. A no-code Stage 0 reproduced all four in a browser *before* any fix, per CLAUDE.md's root-cause rule; each was re-checked after.

- **Stage 1** (`a411b1692f`): `parseSelectionFromURL()` / `applySelectionToState()` added to `app.js` as the read counterparts to the existing `buildCanonicalSearchParams()` — which already *was* the `serializeSelection()` this section proposed adding, so it was reused rather than duplicated. The three legacy normalizers went behind one `normalizeLegacyURL()`, and `normalizeLegacyHashOverlayURL`'s raw `replaceState` now goes through `writeHistoryState`.
- **Stage 2** (`a18a66852e`): `loadAndRenderIndicator(id, { selection, history })` replaces all three copies of the sequence; history writes moved out of `loadIndicator` and `resetSelectionForNewIndicator`; stale-response token added.
- **Stage 3** (`3dbc31151d`): deleted the dead `historyState` global.
- **Stage 4** (this commit): architecture doc §2/§3/§4 rewritten and re-stamped; this entry.

**The four defects, with the browser evidence that established each:**

| | Symptom before | After |
|---|---|---|
| **(a)** `loadIndicator`'s own `replaceState`/`pushState` plus the caller's `pushSelectionToURL` made **two** history entries per load | Load `?id=2380`, press Back → **stays on the page** at bare `?id=2380` | Exactly 1 entry added, carrying the resolved defaults; Back leaves the page |
| **(b)** `resetSelectionForNewIndicator` **replaced** the current entry before the new one was pushed, destroying the outgoing indicator's entry | From 2380, pick 2414, Back → lands on bare `?id=2414` | Back returns to 2380 with its sub-selections and matching URL |
| **(c)** popstate's indicator-change branch returned *before* restoring `MeasureID`/`GeoType`/`TimePeriodID` | popstate into `?id=2414&MeasureID=1299&GeoType=Borough` → state came back `1298`/`UHF34` (2414's **defaults**) while the URL still read 1299/Borough | Restores 1299/Borough; URL and view agree |
| **(d)** `normalizeLegacyOverlayURL` had **no initial-load caller** — it ran only from popstate, unlike the other two normalizers | `?id=2380&overlay=map` kept `overlay=map` in the address bar forever, and every later push re-serialized the stale spelling | Canonicalizes to `overlay=bar` on load |

**The stale-response race is real, not hypothetical.** Firing `selectIndicator(2414)` and `selectIndicator(2392)` back to back produced a 404 on `…/EHDP-data/<branch>/geography/undefined` — a stale render resolving a GeoType the current indicator doesn't have. That error never appears on a single load, and does not appear after the token.

**Method note worth keeping.** The first attempt at the (c) test used `MeasureID=1298&GeoType=UHF34` as the "explicit" sub-selections — which are *exactly* 2414's defaults, so "restored from URL" and "fell back to defaults" produce identical output and the test passed while the bug was present. Any URL-restore test has to pick values the defaults would not produce.

**Deliberate trade-off:** with one history write per navigation instead of an eager replace plus a later push, the address bar now updates when the pipeline reaches its write rather than at click time. Measured at **29–151 ms** — see the 4.2 follow-up below, which corrects a much larger figure this paragraph originally carried.

**Incidental fix — a real gap in the 4.5 guardrails.** The four `typeof resetSelectionForNewIndicator === 'function'` guards that mean "is the full SPA loaded" now test `loadAndRenderIndicator`, the capability actually being asked about. Only `/data-explorer/` (`section.html`) exercises them, since it's the one page that loads `topic-indicator-selector.js` without the rest of the bundle — and **that page had no smoke coverage**: the `smoke-pages.mjs` entry commented `// DE section` is `/data-explorer/asthma/`, which is `single.html` (`content/data-explorer/asthma.md` is a page, not a section). Added `/data-explorer/` and corrected the comment; smoke is now **14 pages**.

### 4.2 follow-up — the address bar updates when the pipeline writes, not when the user clicks

**Status: open, not started (raised 2026-07-26).** Low priority — measured at 29–151 ms, below where a URL change reads as laggy, so the recommendation is to leave it alone unless someone reports it or the data host slows down.

**What changed and why.** Before 4.2, picking an indicator updated the URL twice: `resetSelectionForNewIndicator` did an immediate `replaceState` to `?id=<new>`, then `pushSelectionToURL` pushed the resolved params once the load finished. The immediate write was what made the address bar respond at click time — but it was also defect **(b)** above, because replacing the *current* entry destroyed the outgoing indicator's history entry. Removing it fixed (b) and left one write per navigation, made after `renderMeasures()` so the URL carries the defaults it just resolved. The cost is that the URL is momentarily stale during a load.

**Measured, not estimated — and smaller than first reported.** Click-to-URL-change on `data-explorer/asthma/`, dev server, data fetched from the live GitHub host:

| Indicator | ms | |
|---|---|---|
| 2429 | 123 | previously fetched this browser instance |
| 2380 | 86 | previously fetched |
| 2392 | 67 | previously fetched |
| 18 | 151 | **never** fetched in this browser instance |
| 2339 | 29 | never fetched |
| 2431 | 96 | never fetched |

**This section originally claimed "~1–2 s on a cold indicator". That was wrong** — it was inferred from the `setTimeout` durations used to let the verification tests settle, which measure *full render completion*, not the URL write. The write happens after `renderMeasures()` but before `renderCurrentView(true)`, so it lands well ahead of the map and chart paint that dominates the visible wait. Corrected here rather than left standing, since a wrong number is what would drive someone to spend effort on this.

At 29–151 ms this is below the threshold where a URL change reads as laggy, so **the recommendation is to leave it alone** unless someone reports it. Logged because the bound is the indicator's data fetch, not rendering: on a throttled connection or if the data host slows down, this scales with it, and then it would be worth fixing.

**If it does need fixing, the cheap option is not the one first considered.** The original note said restoring instant feedback would mean setting `DE.state.IndicatorID` before the data loads so `buildCanonicalSearchParams()` could serialize it — a real contract change, since plenty of code reads that field to mean "the indicator whose data is loaded". But that isn't required. At the point an early write would happen, `resetSelectionForNewIndicator()` has just nulled `MeasureID`/`GeoType`/`TimePeriodID`, so the only params that exist are `id` and the carried-over `overlay` — both available as locals inside `loadAndRenderIndicator`. So:

- for `history: 'push'` only, write `?id=<indicatorID>&overlay=<current>` as a `pushState` immediately after the reset, building the URL from the local `indicatorID` rather than from `DE.state`;
- change that path's final write from `pushState` to `replaceState`, refining the entry it just created.

Net history entries stay at exactly one per navigation, so fixes (a), (b) and (c) all hold — (b) was caused by a *replace* over the outgoing entry, and this is a *push* of a new one, leaving the outgoing entry intact. `'replace'` (initial load) and `'none'` (popstate) are untouched.

**Known wrinkle if implemented:** the early write happens before the first `await`, so it is not token-guarded. Two rapid selections would push two entries, and only the newer one gets refined by the final replace — leaving one bare `?id=…&overlay=…` entry in the stack. Harmless and arguably an accurate record of two navigations, but worth deciding on deliberately rather than discovering later.

**How to verify:** re-run the timing measurement above, then the 4.2 browser matrix in full — one entry per load, Back returns to the previous indicator *with its sub-selections*, the discriminating popstate restore (non-default values, per the method note above), and one entry per tab/dropdown/close.

### 4.3 Stable `window.mapInterop` contract (consolidated #13)
**Status: closed 2026-07-27** — two commits (`f1d0150ca3` contract, `a5bba916ca` the `setBarSelection` mirror), merged into `feature-new-data-explorer` and pushed the same day. 2.3 deliberately left the two interop shapes alone because collapsing them means touching bar.js's shape-sniffing — that was this item.

bar.js branch-sniffed which map type built the interop object (`if (mapAPI.circleMarkers) … else if (mapAPI.geoIDtoLayer)`, bar.js:558-590) because choropleth and bubble published different shapes. Define one interface created once at load; renderers attach implementations. Kills the shape-sniffing and the not-ready `if (!mapAPI) return` scattering.

**What shipped.** The contract is three members, not the five sketched above: `ready`, `highlight(geoID)`, `reset()`. `updateHoverUI`/`clearHoverUI` folded into those two — both call sites already invoked them as a pair, and map.js's own handlers use the local closures, never the interop — so the published surface is the smallest thing bar.js actually needs. `geoIDtoLayer`, `geojsonLayer` and `circleMarkers` are gone from it entirely; each renderer keeps its own highlight tracker, so bar.js holds no state at all and its `lastHighlighted` (a Leaflet layer in one mode, a geoID in the other) is deleted. The bubble renderer's `geoIDtoLayer` was deleted outright — bubble highlighting works on the markers, not the gray base polygons, so it had no remaining consumer.

**The lifecycle half was a real, silent defect — proven before the refactor, not after.** With the `*.topo.json` fetch delayed 4 s and geography switched CD→Borough through the real dropdown, `window.mapInterop` was still the *previous* object one second later, advertising 59 CD layers that had already been removed from the map (`layer._map === null`). A bar hover against it **did not throw** — Leaflet silently ignores a detached layer, which is why neither smoke nor grep could ever have caught this — but it still wrote the previous geography's name and value into the legend panel mid-switch. `resetMapForRender()` now calls `detachMapInterop()`, so `ready` is false for exactly that window. Detaching also means no mouseout can clear leftover panel text, so `clearHoverUI` — which depends on nothing a render supplies — moved to module scope and runs at the render boundary too.

**Two of the three claimed defects did not survive testing**, and were dropped rather than "fixed" (they disappear with the rewrite regardless):
- The bubble guard's `markerObj !== lastHighlighted` really does compare an object to a number, but it is **inert**: Vega fires `mouseover` only on item transitions, so four separate mouse moves inside one bar produced exactly one highlight call, and an A→B→A round trip one per bar.
- `resetBubble` was **unreachable**. Every reset in bubble mode went through `resetHighlight` instead, because `lastHighlighted` held a number — so bar.js's `typeof lastHighlighted === 'string'` branch and its "Bubble map: lastHighlighted is geoID" comment never executed. It worked only because map.js had added a geoID-accepting `resetHighlight` alias "to keep interop API shape consistent".
- Confirmed and removed: bar.js's `item.datum.GEOCODE` fallback lookups were dead — a bar datum has no `GEOCODE` key (it exists only on geojson feature properties).

**Mirror-image cleanup (same branch).** `if (window.myVegaView) window.myVegaView.signal("selectedGeo", x).run();` appeared six times in map.js; one `setBarSelection(geoID)` helper now owns the guard. Behavior preserved exactly, including the click handlers' skip-on-null and the choropleth mouseover's clear-for-no-data branch.

**Verification.** lint clean, `characterize -- --check` PASSED, smoke 14/14, plus a browser matrix reproducing pre-change legend text, value, units, tick position and highlighted geography **exactly** on both map types (choropleth `MeasureID=1199`, bubble `1197`) — the characterization baseline captures rendered views, not hover, so the browser was the only thing that could prove this. Also covered: map→bar signalling both ways, bar-then-map mixed sequences leaving exactly one highlight, the mid-load window, and the no-data branch (exercised by nulling one feature's `Value` in the page, since none of the three characterization indicators has a suppressed geography).

### 4.4 Retire the old explorer trees — deferred by decision
**Status: deferred by decision 2026-07-13.** Trigger: the end of comparative user testing. The "Data Explorer (Old)" Pagefind filter chip (§4.8) retires with it.

The old explorer (`assets/js/data-explorer-old/` + layouts + content, ~6,500 JS lines) **stays for comparative user testing** (2026-07-13 decision), so this is a future item, not current work. Park it with a trigger: *when user testing concludes*, deleting the three `-old` trees unlocks dropping `buttons.print` + `rowgroup` from the shared DataTables bundle, settles the `naturalSort` question (1.1) permanently, removes `responsive-table.js` (dead now regardless — no template loads it; deletable today), and ends the old explorer's GA event-name skew.

### 4.5 Guardrails worth adding while the code is hot (professionalization)
**Status: closed 2026-07-23** — 9 commits on `feature-de-tier4.5-guardrails`, merged at `a904b3efab`. `no-unused-vars` was measured and dropped; smoke has since grown to 14 pages (4.2 added `/data-explorer/`). The visual-regression piece 4.9 argues for is **not** part of this and remains unbuilt.

- **ESLint (flat config, `no-undef` + `no-unused-vars` only)** over `assets/js/data-explorer/` — with 15 files sharing one global scope, undefined-name typos are this codebase's most likely regression class, and `no-undef` with a shared-globals list catches them at commit time. Playwright is already a devDependency; there are currently **zero** npm scripts — add `lint` and `characterize` scripts as the first two.
- **Promote the characterization harness to a routine check** (`npm run characterize -- --check`), documented in CLAUDE.md, run before any Tier 2–4 merge.
- Optional, cheap: use the already-site-wide-loaded DOMPurify on the fetched-metadata `innerHTML` sinks (`how_calculated`, `Sources`, `IndicatorDescription` in topic-indicator-selector.js/measures.js) — the old explorer sanitized these, the new one doesn't. Low actual risk (DOHMH-controlled data repo) but the library is already paid for.
- **A console-error smoke test would have caught real bugs a clean build and static grep both missed.** During 4.6's execution (below), a `hugo --cleanDestinationDir` build passed with zero errors and static grep-vs-source-code checks looked correct, but the actual pages still had console errors: `data-explorer-old`'s map was fully broken (missing Leaflet/TopoJSON) and four data-features pages had `colorIcon`/`easyButton` undefined — all invisible to a build and to grep, all found only by loading real pages in a browser and checking the console (Playwright, already a devDependency, driving one representative page per template kind). Worth a small script (`npm run smoke-pages` or folded into the characterization harness) that loads a fixed page list and fails on any console `error`/`pageerror` event, run the same way as `characterize --check` before a merge that touches shared templates like head.html.

**Execution status (done 2026-07-23, branch `feature-de-tier4.5-guardrails`, 9 commits `03692a2293`..`b9307dc74c`).** All four guardrails shipped, plus one real bug the smoke test surfaced:
- **Harness relocation** (`03692a2293`): `de-characterization.mjs` + its baseline moved `documents/` → a new top-level `scripts/` dir (it's dev tooling, not a write-up).
- **ESLint + `lint` script** (`fd590ab479`): flat config scoped to `assets/js/data-explorer/`, shared globals derived at config-load time (a 250+-name hand-maintained list would go stale and train people to ignore the linter). `no-undef` = error. **`no-unused-vars` was measured and dropped** — it false-positives on the tree's cross-file top-level declarations (84 warnings, e.g. `showMap`/`DE_MEASURE_RULES` defined in one file and used in another). The 16 initial `no-undef` hits were all genuine externals (added `vegaLite`, `op`, `gtag` to the externals list, each verified injected site-wide); **zero real code bugs found.**
- **`dev-server.mjs`** (`bfd4d334eb`) + **harness rewired to it** (`8009c26df7`): `ensureDevServer()` resolve-or-starts a server and tears down only one it started; the abort-not-spawn guard encodes the `d5fb2ea700` never-start-a-second-server rule. Paths 1–3 (`DE_BASE_URL` override / probe-and-reuse / abort) verified against the running `local_stage` server (the baseline is environment-agnostic, so `--check` passes on either environment); Path 4 (spawn on a machine with no server) deferred to a no-server window.
- **`smoke-pages.mjs` + `smoke` script** (`3d73039521`, `3ca91e0bfb`, `83af9eca26`): 12 pages, one per template kind. Its first run surfaced **3 pre-existing (non-regression) console errors**: the housing §5b Datawrapper noise (the plan's CDN-host regex didn't match the browser's generic SVG "negative value" text — fixed to match the signature), a new external AirNow-widget CORS error on `realtime-air-quality` (site-wide audit §5d, allowlisted as third-party), and a real duplicate-declaration bug on `neighborhood-reports/` (fixed — see next). The allowlist is **page-scoped** so a bug-specific signature can't be silenced site-wide — a genuine negative-dimension regression on a DE Vega chart would still fail. Navigation waits on `load` + a settle delay, not `networkidle` (Datawrapper's continuous polling never idles).
- **NR duplicate-declaration fix** (`103c8197bd`): `neighborhood-reports/section.html` and the `nr-leaflet` partial both declared `intendedDestinationName` at global scope (`var` vs `let`) → `SyntaxError`, aborting the landing page's scripts. It is intentionally shared state (topic buttons set it; both the search-box and map-click handlers read it to route to the chosen topic), so the partial's `let` became `var` (two `var`s don't collide) rather than a rename. Site-wide audit §5d.
- **DOMPurify on 4 metadata sinks** (`b9307dc74c`): `global.js` (Sources ×2 + about) and `topic-indicator-selector.js` (`how_calculated`) wrapped in `DOMPurify.sanitize` (already loaded site-wide); a dead commented-out sanitize call removed from `data.js`. Parity with the old explorer; DOHMH-controlled data, so hygiene not a vuln fix.

**Verification:** `npm run lint` (exit 0), `npm run characterize -- --check` (PASSED — no rendered-view regression), and `npm run smoke` (12/12) all green. DOMPurify was additionally confirmed non-destructive by a browser before/after on asthma id=2380 — the Sources and how-calculated panels render byte-identically and the served bundle contains all four sanitize calls — because the harness baseline doesn't capture those panels. Items deliberately deferred out of scope (lint-in-CI, a pre-commit hook, a full ~40-sink `innerHTML` sweep, and the dead `nr-*` partials) are logged in the site-wide audit (§7 and §5d).

**Whole-branch review (post-Task-6).** A final review recommended adding an `nr-output` single-report page to the smoke list for full per-template coverage — trialing it immediately surfaced a **P1 pre-existing bug: `nr-output` report pages load no Arquero yet use `aq.` 48×, so their charts are broken** (`aq is not defined`; likely a 4.6 lib-gating regression — site-wide audit **§5e**). Per the maintainer, that fix was out of 4.5's scope at the time, so the `nr-output` smoke entry was deferred (left as a commented pointer in `smoke-pages.mjs`). **Update 2026-07-23: §5e is fixed** — `nr-output/single.html` now includes `lib-arquero.html` — and the `nr-output` page has been added to `PAGES`; smoke is green at **13 pages**. Two minor robustness fixes from the same review were applied: `DE_BASE_URL` now gets a forced trailing slash in `dev-server.mjs`, and `eslint.config.mjs`'s globals-derivation regex carries a caveat comment about top-level destructuring/multi-declarator names it doesn't capture (none exist today).

### 4.6 head.html's conditional-gating pattern needs a structural rethink (site-wide, not DE-specific)
**Status: closed 2026-07-16** (raised 2026-07-14) — implemented on `feature-data-explorer-new-headhtml-gating`, two commits, merged and pushed. Re-verification of the ported state caught nine real gaps, including four templates missing libraries they call.

Full write-up in **§2 of `documents/site-wide-audit-2026-06-27.md`** (added the same day, prompted by a question about 3.3's own approach). Flagged here because 3.3's fixes are more of the pattern this criticizes: every section-specific exception (easybutton/colorIcon excluded for `data-explorer`, `uhflist` restricted to `neighborhood-reports`, and everything already gated before them) is another branch in head.html's one big `{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") (eq .Section "data-explorer") }}` block. A page's actual dependencies end up living somewhere other than its own template — reading `data-explorer/single.html` doesn't tell you what it loads, head.html does — and two templates can collide silently: `data-explorer-old/single.html` builds its own DataTables bundle at the literal same `resources.Concat` target path (`js/dataTableBundle.js`) as head.html's, and Hugo serves whichever one it cached first with no build error (harmless today only because neither template's JS calls the plugins the two versions differ on — see 3.3's write-up above).
**Recommend:** per-template inclusion for anything that isn't truly universal — each template `{{ partial }}`s in only the libraries it needs (one line per library if each is its own tiny partial) — reserving head.html conditionals for what every page genuinely needs (charset, viewport, favicon, GA). This project's CLAUDE.md already endorses the equivalent pattern one level down, for page-specific JS ("externalize to `assets/js/<page-name>/*.js`... see `data-explorer/single.html`"); this is the same idea applied to which libraries a template pulls in.
**Consider:** Tier-4-sized, not a quick fix — head.html is shared with production's lineage, so this wants its own staged effort with the characterization harness plus manual checks across every page kind (DE, old explorer, data-features, neighborhood-reports, take-action), not a ride-along in a smaller PR. Natural trigger: whenever 4.4 (old explorer retirement) next requires touching this file anyway.

**Execution status (2026-07-16):** Implemented on `feature-data-explorer-new-headhtml-gating` — all Stages 0-6 from the standalone execution plan, plus data-stories Vega/D3 gated behind a per-page `vega: true` front-matter flag (a consumer the plan hadn't anticipated). The work was ported from prior unpushed effort on other local branches, then independently re-verified against actual JS/template usage rather than trusted as-is. That re-verification caught real gaps in the ported state: `data-explorer/single.html` had the unused `lib-uhflist.html` instead of the actually-needed `lib-vega.html`; `nr-output/single.html` carried an unused `lib-arquero.html`; `minimum-wage-with-maps.html` was missing `lib-topojson.html`; six data-stories pages (housing/geographies × 3 languages) needed the new `vega: true` flag. A further pass — prompted by a live bug report against a running dev server, since static analysis alone had missed it — found `data-explorer-old/single.html` had no Leaflet/TopoJSON of its own at all (it was relying entirely on the now-removed head.html blanket block), and that `fvi.html`/`rats-in-your-neighborhood.html`/`rmz.html`/`realtime.html` were each missing `lib-easybutton-coloricon.html` despite calling `L.easyButton`/`L.colorIcon`. All fixed and confirmed via a clean `hugo --cleanDestinationDir` build plus a Playwright pass against a live dev server (console-error-free on every checked page except one newly-surfaced, pre-existing issue — see 4.7 below). Landed as two commits (`47ffb33fde` functional, `dee3d1f892` documentation), now merged into `feature-new-data-explorer` and pushed.

### 4.7 `data-stories/housing` console errors — NOT a Vega/4.6 bug
**Status: closed here 2026-07-16, moved out** — misattributed at first; it's a Datawrapper-in-a-hidden-tab pattern affecting four data-stories pages. Tracked in §5b of `documents/site-wide-audit-2026-06-27.md`, not here.

Follow-up investigation (Playwright against `local-stage`) found the console errors seen during 4.6's verification are **not caused by the Vega-Lite chart at all** — `#housingmap`'s SVG rendered correctly (640×550, no errors) every time. The actual source is the page's separate "Scatterplot" Datawrapper iframe, which sits in a Bootstrap tab that isn't the active one on load; the errors come entirely from `datawrapper.dwcdn.net`'s own script computing `NaN`/negative sizes while its ancestor is `display:none`. This is a generic, pre-existing pattern that also reproduces on `redlining/`, `air-quality-snapshots/`, and `vectorborne-diseases-and-health/` — none of which load Vega or touch anything 4.6 changed. Confirmed harmless-but-noisy: the chart self-heals visually the moment its tab is clicked.
**Full write-up, affected-page table, and recommended fix moved to §5b of `documents/site-wide-audit-2026-06-27.md`** (site-wide, not DE-specific — the DE audit surfaced it, but it belongs in the site-wide backlog since data-stories pages aren't part of the SPA). Track status there, not here.

### 4.8 Pagefind / search audit

**Status: closed 2026-07-22** (raised the same day) — audited, then implemented and live-verified on `feature-new-data-explorer-pagefind-audit`, 8 commits. Two rounds of self-correction: both trees' "genuinely indexed" claims were initially wrong (nested inside blanket-ignored ancestors). The one remaining item, the "Data Explorer (Old)" filter chip, rides along with 4.4.

Two questions: how is Pagefind actually configured across the site (context for the rest), and — since the user specifically asked — what's the real difference in what's *searchable* between `data-explorer` and `data-explorer-old`, given the two trees' UI looks almost identical.

**How Pagefind is wired (site-wide, for context):**
- `data-pagefind-body` on `<main>` ([baseof.html:24](../themes/dohmh/layouts/_default/baseof.html)) correctly scopes indexing to content, excluding header/footer/nav automatically — standard Pagefind practice, no issue.
- Six `data-pagefind-filter="section[content]"` category filters ([head.html:140-162](../themes/dohmh/layouts/partials/head.html)): Data Stories, Data Features, Neighborhood Reports, Data Explorer, **Data Explorer (Old)**, Key Topics. The old explorer has its own live, user-facing filter chip in the public search UI — it isn't just an unlinked-from-nav URL, it's an actively advertised search category. Worth folding into the Tier 4.4 decision: "stays for comparative user testing" should probably also mean *someone decided* real visitors should be able to filter search results down to it, not that it's just riding along.
- A **dead, commented-out duplicate** of one of those six filters sits 85 lines earlier ([head.html:56](../themes/dohmh/layouts/partials/head.html)) — abandoned draft residue from before the real block existed; delete it.
- No filter exists for `resources`, `about`, or `take-action` — their results fall through unfiltered. Incomplete, not broken.
- Every page gets a `data-pagefind-meta="title:…"` tag carrying parent-title breadcrumb context into results ([head.html:196-212](../themes/dohmh/layouts/partials/head.html)) — a nice touch. The `class="d-none"` on that `<meta>` tag does nothing (`<meta>` never renders regardless); harmless, just confused.
- `data-pagefind-weight` is used as an ad hoc relevance boost (values 5.0-10.0) scattered directly in markup across ~10 `data-features/*` templates (e.g. [hvi.html:12,23,59](../themes/dohmh/layouts/data-features/hvi.html), [asthma-syndrome.html:21,66](../themes/dohmh/layouts/data-features/asthma-syndrome.html)) — an informal, undocumented tuning convention, not a defect, just tribal knowledge worth naming.
- `resources/single.html:4` and `resources/section.html:4` set `data-pagefind-weight="0"` — deprioritized, not excluded, so `health-code-reference`/`sugar-lookup` **are** searchable via the site's own search bar even though (site-wide audit §12) they're `noindex`ed for Google in every environment. Internal and external discoverability diverge for this section; cross-reference that finding if it gets resolved.
- **The one genuinely elegant piece:** [search-modal.html:46](../themes/dohmh/layouts/partials/search-modal.html) rewrites each sub-result's URL from `#IndicatorID-{id}` — the anchor Pagefind naturally builds from `de-indicator-names-pf.html`'s hidden `<h1 id="IndicatorID-{id}">` (see the SEO audit's write-up of that partial) — into the app's real deep-link query string, `?id={id}`, before the result is ever shown. The hidden-h1 workaround isn't just "give Pagefind something to see"; it's shaped specifically so this second piece of code can turn it into a working link. Traced start to finish, it's correct and deliberate.
- No separate `pagefind.yml`/config file anywhere in the repo — entirely `data-pagefind-*` attribute-driven, which is Pagefind's normal model (`package.json:35` pins `pagefind ^1.5.2`; CI builds the index with a bare `npx pagefind --site docs`, no flags). Not a defect, just confirms there's no config file to also audit.
- **A third, wholly separate search mechanism exists and isn't Pagefind at all:** [de-text-search.html](../themes/dohmh/layouts/partials/de-text-search.html) runs its own live `jquery-flexdatalist` typeahead over `metadata.json`'s indicator fields client-side — no relationship to Pagefind's build-time index. This resolves the site-wide audit §3's open "confirm actual use" question about the `jquery-flexdatalist` dependency: it **is** used, just for this, not for the site's main search.

**`data-explorer` vs. `data-explorer-old`: indicator-level search is at parity; topic-level search is only partly at parity.** The topic *chooser* page (`section.html`) indexes nothing on either tree today — that's parity, not a gap. The topic *viewer* page (`single.html`) is where the real divergence lives.

Both trees' `single.html` call the *identical* `de-indicator-names-pf.html` partial ([data-explorer/single.html:53](../themes/dohmh/layouts/data-explorer/single.html), [data-explorer-old/single.html:1059](../themes/dohmh/layouts/data-explorer-old/single.html)) — so the hidden per-indicator name/description dump, and the deep-link rewrite it enables, is shared infrastructure, not something the new explorer has and the old one lacks. The real divergence is everything *else* that used to ride along with it:

| | `data-explorer-old` | `data-explorer` |
|---|---|---|
| `data-index.html` / `indicator-catalog.html` | Real `.Content`, not ignored | Same — parity, no regression |
| `section.html` (topic chooser) | Outer `<article>` is **also** blanket `data-pagefind-ignore="all"` ([section.html:3](../themes/dohmh/layouts/data-explorer-old/section.html)) — the attribute has been there since commit `6cba677693` ("hiding more unwanted indexing", 2023-10-25), over 2.5 years before either tree existed separately; the "Promote new SPA to /data-explorer/, retire old explorer to /data-explorer-old/" commit (`18d94c510f`, 2026-06-27; confirmed via `git log --follow`) merely carried it forward unchanged when it copied the file into this tree. It still renders breadcrumb, `<h1>`, real `.Content` body, "recently updated" links, dataset-index/catalog links ([:27,35,55,57](../themes/dohmh/layouts/data-explorer-old/section.html)), and a live flexdatalist indicator-name search box ([de-text-search.html](../themes/dohmh/layouts/partials/de-text-search.html)) in the DOM — but none of it reaches Pagefind, since `data-pagefind-ignore="all"` excludes an element and all its children from every processing stage, no exceptions. | Outer `<article>` is blanket `data-pagefind-ignore="all"` ([section.html:5](../themes/dohmh/layouts/data-explorer/section.html)) and renders no `.Content`, no breadcrumb, no recently-updated list, no dataset-index/catalog links, and doesn't include `de-text-search` at all — just an empty map div and a tab button. **Parity, not a regression: neither tree currently indexes any topic-level content here.** |
| `single.html` (topic/indicator viewer) | Outer article not blanket-ignored, so the topic `<h1>{{ .Title }}</h1>` at [:377-378](../themes/dohmh/layouts/data-explorer-old/single.html) — outside the sidebar — genuinely reaches Pagefind. But `.Content` ([:429](../themes/dohmh/layouts/data-explorer-old/single.html)) and `takeaction.html` ([:455](../themes/dohmh/layouts/data-explorer-old/single.html)) are both nested *inside* the left-sidebar `<div class="col-lg-4 ... " data-pagefind-ignore="all">` that opens at [:401](../themes/dohmh/layouts/data-explorer-old/single.html) and doesn't close until [:466](../themes/dohmh/layouts/data-explorer-old/single.html) — `data-pagefind-ignore="all"` excludes an element and every descendant regardless of whether the descendant itself carries the attribute, so neither is actually indexed here either. Confirmed twice: by re-reading the template's nesting, and by a live Pagefind rebuild returning 0 results for take-action boilerplate text filtered to "Data Explorer (Old)". `related-data`/`keywords`/`related-footer` partials are also included but self-exclude via their own `data-pagefind-ignore="all"`, so they don't actually add anything either way. | Outer article is blanket `data-pagefind-ignore="all"` ([:10](../themes/dohmh/layouts/data-explorer/single.html)); no topic `<h1>`, no `.Content`, no related-data/keywords/takeaction equivalent anywhere in the template. Everything beyond the shared hidden-indicator dump is gone. |

**Net effect:** searching for a topic name today surfaces less on `/data-explorer/<topic>/` than it did on `/data-explorer-old/<topic>/`, but not for the reason first assumed — the old explorer's `.Content`/take-action text was never actually reaching Pagefind either (nested inside its own sidebar's blanket ignore, see table above). The real gap is narrower: only the topic `<h1>{{ .Title }}</h1>` was genuinely indexed on the old tree; the new tree indexed neither the `<h1>` nor anything else.

**Decided (2026-07-22): restore `single.html`'s indexing gap; add `section.html` indexing as new capability to both trees.** Concrete plan:
- **`single.html` — narrow the blanket ignore, add hidden content.** [single.html:10](../themes/dohmh/layouts/data-explorer/single.html) currently puts `data-pagefind-ignore="all"` on the *entire* outer `<article>`. Move the ignore attribute down onto the specific JS-populated shells that actually need it (the map div, `de-indicator-info.html`'s placeholder box, tab content) instead of the article as a whole — same fix shape as 2.6/4.1's "narrow the scope instead of the blanket" — then render `.Content` and `takeaction.html` in a hidden block so the topic prose and take-action link genuinely reach Pagefind. Note this ends up giving the *new* explorer better topic-level search coverage than the old explorer ever had (see the corrected table row above) — this was framed as "matching what the old explorer does" before the nesting error was caught, but the old explorer's `.Content`/`takeaction` were never actually indexed. `related-data`/`keywords` stay lower priority, since both partials self-exclude via their own `data-pagefind-ignore="all"` regardless of tree — restoring them is a UX call, not a search-parity one.
- **`section.html` — new capability, both trees.** Neither tree indexes anything here today (the old explorer's article is blanket-ignored too, per the table above), so there's no old-explorer reference behavior to restore parity with. Narrowing the old explorer's ignore attribute is enough on its own to start indexing its already-rendered breadcrumb/`.Content`/recently-updated/dataset-index markup. The new explorer's `section.html` doesn't render any of that markup at all today, so its `.Content` needs to be added before there's anything for a narrowed ignore attribute to expose. Scope this as new work for both trees, not a narrow-to-match-old-explorer fix.
- **UI treatment (decided this session): hidden/search-only.** None of this newly-indexed content — `single.html`'s `.Content`/`takeaction.html`, `section.html`'s `.Content` — gets a new visible panel (no "About this topic" box or similar). It follows the existing `de-indicator-names-pf.html` pattern instead: real markup present in the DOM but visually hidden (`<h1 class="d-none">`-style), there for Pagefind to index and for the search-modal's deep-link rewrite to use, not for a sighted user to see inline.
- **Implemented and verified (2026-07-22):** all of the above shipped on `feature-new-data-explorer-pagefind-audit`. Verified with a live Pagefind rebuild (`npx pagefind --site docs` against a clean local build) and modal searches: a phrase from `air-quality`'s restored `.Content` now returns a real `/data-explorer/air-quality/` result with no `?id=` (topic-level, not indicator-level) and no JS-shell placeholder text ("Loading indicator…" etc.) leaking into any result; take-action boilerplate now returns 41 matches under "Data Explorer" (previously would have been 0, and remains genuinely 0 under "Data Explorer (Old)" per the corrected table row above); the reused landing-page paragraph returns exactly one match each for `/data-explorer/` and `/data-explorer-old/`, confirming `section.html` indexing now works on both trees; existing indicator deep-links (`?id=`) are unaffected.

**A fourth, currently non-functional search surface: `/search-results/`.** [search-results/single.html](../themes/dohmh/layouts/search-results/single.html) is a full template with six category buckets (`data-stories`, `neighborhood-reports`, `key-topics`, `data-explorer-new`, `data-explorer`, `other`), each `hidden` with an empty `.search-results-title`/`.search-results-info` waiting to be filled in — and **nothing in the current JS codebase ever fills them in or un-hides them.** Confirmed by git history, not just a missing-reference grep: commit `bad2246281` ("delete old search", 2024-07-18) removed `assets/js/search-results.js` (434 lines), `assets/js/search.js` (20 lines), and their `js_bottom.html` script tags in one pass, with no replacement. Every commit to this template since has been cosmetic ("swap titles for Data Explorer and Data Explorer New sections", "add data-explorer-new to search results") — edits to a page whose driving logic has been gone for two years. It's reachable (`content/search-results/index.md` is a real 3-line stub, and it appears in the sitemap/robots outputs), but **nothing in the theme links to it** (repo-wide grep for the string finds only the template itself), and it isn't referenced from the working search-modal's `PagefindUI` config either. Anyone who does land on `/search-results/` — an old bookmark, a stale external link from before mid-2024 — sees a page title and six empty hidden headers: functionally a blank page. **Decide:** delete the orphaned template + stub content page (the modal-based search is the one actually-working experience today), or rebuild its JS against Pagefind's low-level API if a dedicated full-page results view is still wanted. Either is cheap; leaving it is the only bad option.

### 4.9 Modal close button: deformed focus ring + off-centre glyph, both from using a text `&times;` as an icon

**Status: closed 2026-07-23** (raised 2026-07-22) — both defects fixed on `feature-new-data-explorer` by replacing the text glyph with an inline SVG; measured in-browser. No follow-on work.

**Reported symptom:** the focus ring on the viz-pane close button (`.bl50`, [de-tab-content.html:118](../themes/dohmh/layouts/partials/de-tab-content.html)) is a clean arc, but the one on the modal close button (`.br50`, [header-de.html:400](../themes/dohmh/layouts/partials/header-de.html)) is "very oddly shaped" — despite the two buttons being the same shape, only mirrored. Two prior attempts had failed to fix it.

**The two buttons really are geometrically identical.** Measured in the live DOM before changing anything: both are 33 × 38.5px, both `box-sizing: border-box`, both resolve their `50%` corners to the same 16.5px horizontal / 19.25px vertical elliptical radii, just on opposite sides. The `.bg-white` wrapper div that only the viz-pane button has (the natural suspect, and the one named in the bug report) is **not** the cause — it has `overflow: visible` and `border-radius: 0`, and contributes nothing to either button's ring.

**Root cause: Chrome's `outline: auto` is drawn around the union of the focused element *and its descendants' visual rects*, not around its border box.** The modal button's `<span class="h3" aria-hidden="true">&times;</span>` inherits Bootstrap's `.h3 { margin-bottom: 0.5rem }`. That gives the flex item a 41.6px outer height against the button's 36.5px content box (38.5px minus 1px padding top and bottom), and `align-items: center` splits the 5.1px excess evenly — pushing the span **1.54px past both the top and bottom border edges** (measured, not inferred). Chrome unions that small overflow into the ring path, which deforms the `.br50` half-ellipse into a lumpy blob. The viz-pane button's child is an `<img>` that fits entirely inside its box, so nothing perturbs its ring — same mechanism, no overflow, clean arc. Demonstrated directly by hiding the span with everything else untouched: the native `outline: auto` immediately snapped to a correct D-shape.

**Why the earlier fix missed it.** The prior attempt diagnosed this as `outline` failing to follow an asymmetric `border-radius`, and swapped in `&:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.8) }`. That premise is wrong — `outline` does follow border-radius, as the viz-pane button proves on the mirrored shape. The workaround was also self-defeating in a second way: box-shadow spread scales the radii proportionally here (16.5→19.5 horizontal, 19.25→22.25 vertical over a 39 × 44.5 shadow box), so the ring's *shape* was fine, but a white ring at 0.8 alpha is invisible wherever it crosses the white `.modal-content` and only shows against the dark backdrop — reading as a partial crescent rather than a ring. Worth noting the distinction in evidence: the outline deformation was reproduced directly in the browser; the crescent is a geometry-and-compositing reading of the shipped box-shadow state, and is the most likely form the reported symptom actually took.

**A second defect surfaced by the first fix: the glyph was not vertically centred.** Zeroing the margin fixed the ring but left the `×` sitting visibly low, which a screenshot from the user caught. Cause is unrelated to the ring: the `×` ink rides *entirely above* the baseline (measured via canvas `TextMetrics` at 28px — from 15px above the baseline to 2px above it), so its optical centre sits **2.99px below** the centre of its line box. `align-items: center` centres the *box*, so the glyph lands low no matter how the box is positioned. Notably this was present before any of this session's changes and was missed twice by eyeballing magnified screenshots — including once by me, after asserting the glyph was "still optically centered" without measuring it.

**Fix (shipped): replace the text glyph with an inline SVG.** An intermediate CSS-only fix (`line-height: 1` + `position: relative; top: -3px`) did centre it exactly, but the nudge was font-metric-dependent and would drift wherever the stack resolves to something other than Segoe UI. Replacing the glyph removes the whole failure class instead:

```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M2.5 2.5 L13.5 13.5 M13.5 2.5 L2.5 13.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

An SVG's box *is* its ink, so plain flex centring is exact, on every platform, with no nudge — and the box can't overflow the button, so the original focus-ring bug cannot recur either. `stroke-width="2.5"` with round caps is taken from the existing [arrow-right.svg](../static/images/arrow-right.svg) used by the viz-pane button, so the two icons read as one family; `currentColor` picks up the `color: white` already on `.modal-close-tab` rather than hardcoding it. This also converges the two buttons on the same approach — the viz-pane button has always used an image child, which is why it never had either bug.

Applied at all three `.modal-close-tab` sites — `#topicSelector` ([header-de.html:294](../themes/dohmh/layouts/partials/header-de.html)), `#indicatorSelector` ([:361](../themes/dohmh/layouts/partials/header-de.html)), `#learnMore` ([:405](../themes/dohmh/layouts/partials/header-de.html)). The entire `.h3 { margin / line-height / position / top }` workaround block is deleted from [_de-custom.scss](../assets/scss/_de-custom.scss); the `:focus-visible` box-shadow override is gone too, so the native `outline: auto` is what renders.

**Verified (2026-07-23)** against the running dev server after SCSS recompile (new fingerprint confirmed served — the first check read a stale build and had to be re-run with a cache-buster), no DOM overrides in play: SVG box offset from the button's centre **0.00 / 0.00**, drawn path offset **0.00 / 0.00**, icon inset on all four sides (−11.25 / −11.25 / −8.5 / −8.5) so the ring stays clean, all three modals confirmed carrying the SVG with a white stroke, button's accessible name still `Close` with `aria-hidden="true"`/`focusable="false"` on the icon. Rendered ink is 13.5px across (11px geometry + 2.5px stroke) versus the old glyph's 15w × 13h.

**Generalizable trap worth naming:** any child that overflows a focused element's box will distort Chrome's focus ring, and any *text* child will sit wherever the font's baseline puts it rather than where its box is. Bootstrap 4's heading classes all carry `margin-bottom`, so reusing `.h1`–`.h6` as a glyph wrapper inside a fixed-size control hits both problems at once. **Prefer an SVG or image child for icon-only controls** — its box is its ink, which makes centring exact and overflow impossible, and it sidesteps per-platform font-metric drift. Related to 4.5's guardrails theme: both defects here were missed repeatedly by reading source and by eyeballing screenshots, and both were settled in seconds by measuring in the browser — a concrete argument for the visual-regression piece.

### 4.10 `renderMenuSection` binds two click listeners per button, on every menu rebuild

**Status: closed 2026-07-27** on `feature-de-tier4.10-menu-listeners`. Measured first, as the original entry demanded — **the performance case did not survive**, and the change shipped as a clarity cleanup on that basis, not as an optimization.

The original finding was accurate. `renderMenuSection` (menu.js:169) cleared each container with `innerHTML = ''` and rebuilt one `<button>` per option, binding **two separate `click` listeners to the same button** — one calling `updateDropdownText(button)`, the other `handleSelection(type, item.value)`. Containers come from `querySelectorAll` (2 per section: the mobile `#detailsContent` block and the desktop block in `themes/dohmh/layouts/partials/de-indicator-info.html`), so the work was options × 2 containers × 2 listeners, for all three sections at once, on every indicator load (`renderMenus`, app.js) *and* every dropdown change (`handleSelection` cascade-rebuilds all three menus).

**It was never a leak.** `innerHTML = ''` discards the old buttons and their listeners with them.

### What the measurement showed

Measured in Chrome against a `dev_stage` server, 25 timed `updateAllMenus()` calls per condition, A/B'd by patching `EventTarget.prototype.addEventListener` to a no-op for condition B (an upper bound on what delegation can recover, since it removes *all* per-button binding):

| Case | Options | Buttons built | Listeners bound | Rebuild, median | Attributable to binding |
|---|---|---|---|---|---|
| **Worst in the catalog** — Disinfection by-products (TTHM), id 2207 | 109 (8 measures + 100 time periods) | 218 | **436** | 1.3 ms (max 2.4) | **0.2 ms** |
| **Median indicator** — 11 options | 11 | 14 | 28 | 0.4 ms | **not measurable** (A/B delta came out −0.2 ms, i.e. noise below `performance.now()`'s coarsening) |

The 436 bindings were confirmed by counting, not inferred — they match the arithmetic exactly. Option counts were derived across all 282 indicators in the live `feature-new-data-explorer` `metadata.json`, so the TTHM case really is the ceiling.

**Conclusion: the doubling costs 0.2 ms on the single worst indicator in the portal, and nothing measurable on a typical one.** Nobody should have shipped this as a perf fix, and the original entry was right to forbid acting before measuring.

### What shipped, and why

One delegated `container.onclick` per container, replacing both per-button listeners — the same shape as the links dropdown in `measures.js` (`event.target.closest('.linksbutton')` + `data-` attributes), which was already in the codebase. `onclick =` assignment is idempotent across rebuilds, so handlers can't stack.

`updateDropdownText` was **deleted outright**, not merged in. Both of its jobs were already done elsewhere:

- Its text write was redundant with `setDropdownLabel`, called for all three menus by `updateAllMenus` immediately afterwards — and `setDropdownLabel` is strictly *better*, because it repaints **both** the desktop and mobile triggers where `updateDropdownText` only repainted the clicked one.
- Its `dropdownMenu.classList.remove('show')` was redundant with Bootstrap's own `_clearMenus`, which guards on the **parent** `.dropdown` carrying `.show` (`node_modules/bootstrap/js/dist/dropdown.js:406`) — a class `updateDropdownText` never touched, so BS ran its whole close path regardless.

**Proven in the browser before deleting anything**, not argued from source: a probe button bound to `handleSelection` *alone* was appended to an open measure dropdown and clicked with a real mouse. Result — menu closed (`.show` gone from both parent and menu, `display: none`), `aria-expanded` back to `"false"`, and *both* trigger labels updated. That is the post-fix behaviour, observed before the code changed.

### The trap that the obvious implementation would have hit

The natural delegated form is `button.dataset.value = item.value`, read back in the handler. **That would have been a real regression:** `dataset` stringifies, and **97 `Map` entries across the catalog carry `GeoType: null`** — so `prettifyGeoType` returns `null`, and `DE.state.GeoType` would have been set to the string `"null"` for those indicators. The shipped version stores a positional `data-option-index` and looks the option back up in the `items` array, which preserves each value's original type exactly. Verified post-change: `MeasureID`/`TimePeriodID` still land as `number`, `GeoType` as `string`.

Those null `GeoType`s turned out to be far more than a coercion hazard — chasing them produced **§4.12** below, a live map-breaking regression in 40 of 282 indicators.

### Verification

`npm run lint` (proves no dangling `updateDropdownText` — the identifier ceases to exist), `npm run characterize -- --check` **PASSED**, `npm run smoke` **PASSED** (14 pages). Browser click-through on the running server: measure and time selection at desktop width on the 2207 worst case — including the cascade, where switching measure moved `TimePeriodID` 346 → 298 and shrank the time menu from 200 buttons to 50 — and boundary selection at 414 px mobile width (`#detailsContent` expanded first; the mobile dropdowns are inside a collapsed panel and have zero width until it is). Every case: correct state, both labels repainted, menu closed, `aria-expanded="false"`, and **exactly one** history entry per selection (no double-fire).

**Provenance:** carried over from the pre-cutover Copilot analysis, where it sat in a memory note alongside a dozen claims that Tiers 2–4 have since falsified. Re-verified against current `menu.js` on 2026-07-27; the rest of that note was not salvaged.

### 4.11 `DE.state` is still written from anywhere — 23 sites across 5 files

**Status: open, not started (raised 2026-07-27).** No priority assigned; recorded because it is the one structural smell from the pre-cutover analysis that Tiers 2–4 did *not* close, and it is easy to assume the state-namespace refactor already handled it.

The state-namespace refactor (merged 2026-07-11, `documents/data-explorer-state-namespace-design-2026-07-10.md`) replaced ~100 bare globals with `DE.*` sub-objects. That fixed *naming*, not *ownership*: any file may still assign any field. Counted 2026-07-27 —

| File | Sites | What writes |
|---|---|---|
| `menu.js` | 7 | cascade defaults (`:60`, `:89`, `:125`, `:155`) and `handleSelection` (`:227`, `:231`, `:235`) |
| `app.js` | 8 | `applySelectionToState` (`:85`–`:88`), the new-indicator reset (`:110`–`:112`), tab click (`:591`) |
| `measures.js` | 4 | `overlay`, set inside four `show*` renderers (`:1416`, `:1485`, `:1505`, `:1671`) |
| `de-tab-content.js` | 2 | `overlay = 'none'` on close (`:48`, `:96`) |
| `data.js` | 2 | `overlay` default and `IndicatorID` (`:200`, `:208`) |

**The sharpest version: `overlay` is assigned at 9 sites across 4 files** — app.js, data.js, de-tab-content.js and measures.js — so "what is the current overlay, and who last set it" has no single answer. (bar.js and global.js reference `DE.state.overlay` but only read it.)

4.2 built the one piece of this that exists: `applySelectionToState()` (app.js:83) is the single writer for URL-derived selections, with two callers. Nothing equivalent governs the other 19 sites.

**Why this is not simply "do the same for the rest".** A renderer setting `DE.state.overlay = 'bar'` is recording which view it just drew, not requesting a navigation — routing those through a dispatcher that also writes history would be wrong. Any fix needs to separate "the user asked for X" from "X is now what's on screen" first; that distinction is the actual work, and it is why this is logged rather than scheduled.

**Provenance:** carried over from the pre-cutover Copilot analysis and re-verified against current source on 2026-07-27 before being recorded here. A sibling claim from the same note — that `topic-indicator-selector.js` is a heavy-async hot spot — was checked at the same time and **did not survive**: at 660 lines with 5 `await`, 1 `fetch` and 2 `.then`, it is unremarkable next to data.js (11 awaits/850 lines) or app.js (5/639). It is not recorded, deliberately.

### 4.12 `GeoType: null` means "not mappable" — the new explorer reads it as a geography, and breaks the map on 40 of 282 indicators

**Status: fixed 2026-07-30 on `feature-de-tier4.12-null-geotype`** (raised 2026-07-27, was the most severe open item and a gate on 4.4). The map no longer throws on any of these indicators; it draws an explicit "not mapped" state instead. The resolution is at the end of this section, and it is **not** the fix this section originally proposed — see the correction there.

Found while implementing 4.10, as a side-effect of asking what types the dropdown values can actually hold.

**The metadata is not malformed.** `GeoType: null` inside a `VisOptions[0].<VisType>` array is the catalog's way of encoding *"this visualization type is unavailable for this measure."* Anencephaly (id 26), measure "Number":

```
Table: [ { GeoType: "Borough" }, { GeoType: "Citywide" } ]     <- real geographies
Map:   [ { GeoType: null, TimePeriodID: [], RankReverse: null } ]   <- "no map for this measure"
Trend: [ null ]
Links: [ null ]
```

The old explorer reads that correctly: it greys out the Map, Trend and Correlate tabs, defaults to **Table**, and renders Boundaries (Citywide, Borough), a full time list and a populated data table. Verified in the browser at `/data-explorer-old/birth-defects/?id=26`.

**The new explorer builds its Boundary dropdown exclusively from `VisOptions[0].Map`** (menu.js, the `measure.VisOptions[0].Map.forEach` that feeds `prettifyGeoType`). For these indicators that array's only entry is the null placeholder, so:

- `prettifyGeoType(null)` returns `null`, and the geo dropdown gets **one blank option** — an empty `<button>` with no label.
- `DE.state.GeoType` is set to `null` (`assignGeoRank(null)` returns `undefined`, so the "finest available geography" reduce has nothing to rank).
- `DE.state.TimePeriodID` is `null` too, since the time list is derived from the same null `Map` entry — the Time dropdown is also blank.
- `renderMap` then throws: **`TypeError: Cannot read properties of undefined (reading 'AvailableGeoTypes')`** (map.js). The user gets a bare basemap with no data drawn, and empty Boundary and Time dropdowns.

**Scale — measured across all 282 indicators in the live `feature-new-data-explorer` catalog:**

| | Indicators |
|---|---|
| Have at least one null `GeoType` in a `Map` array | **40** |
| …of which **every** `Map` entry is null (no mappable measure at all) | **20** |
| …of which some measures map and some don't | **20** |

The 20 fully-null ones are largely the birth-defects family (ids 26–37 and neighbours). The partial ones are worse in a subtler way — Leukemia (id 73) has 3 unmapped measures of 6, so the indicator works until you pick one of the affected measures. Others: Carbon monoxide incidents (38), Restaurants with A grades (2065), and a run of cancer indicators (2077, 2088, 2090, 2091).

> **Correction (2026-07-30):** this paragraph read "3 null entries out of 12" for id 73. Re-measured in the browser during the fix: `DE.indicator.indicatorMeasures.length` is **6**, of which 3 are unmapped (MeasureIDs 136, 137, 139) and 3 map at Borough/PUMA/Subboro (138, 326, 327). The indicator-level counts in the table above were not re-derived; they date from 2026-07-27.

**Not caused by 4.10.** The failure happens on initial page load with no click involved, and `map.js` was not touched. Confirmed present with the delegation change in place and attributable entirely to the metadata read.

**What a fix has to do** — as written 2026-07-27, and item 2 was superseded:

1. Treat a null `GeoType` as *absence*, not as an option — filter it out of the geo list rather than prettifying it. That alone stops the blank dropdown entry and the `null` state write. **Done, and it is now an invariant rather than a patch:** the Boundary dropdown must never contain an unlabelled option, whatever the metadata says (menu.js).
2. ~~Decide what the SPA does when a measure has no mappable geography. The old explorer's answer — disable the Map/Trend/Correlate tabs and default the overlay to `table` — is the known-good behaviour.~~ **Superseded 2026-07-30.** The decision taken was to keep the map present and have it *state its own absence*: a gray citywide polygon with an automatic message, plus a highlight on the visualization bar. Copying the old explorer's tab-disabling would have meant inventing a disabled-vis-tab concept the SPA does not have, and it hides the fact that the data exists at other geographies — the Table and Trend views do hold real Borough/PUMA rows for these measures.
3. The same null-as-placeholder convention appears in `Trend` and `Links` too, so whatever handles it should be shared, not written three times. **Still true, still not done** — the fix normalises `Map` only. `Trend` and `Links` reach their consumers by other routes and did not throw, so widening the normaliser was left out rather than done speculatively. If a null `Trend`/`Links` defect surfaces, extend `withCitywideMapFallback` rather than writing a second handler.

Worth noting the new explorer is not *totally* broken on these: switching to the Table tab manually does render (3 rows for id 26, against a fuller table on the old explorer). But the landing view is a broken map, and nothing tells the user why.

#### Resolution (2026-07-30)

A third map render mode, beside choropleth and bubble. `withCitywideMapFallback` (global.js) marks any measure whose `Map` array holds no real geography with `MapUnavailable: true`, and substitutes the `Table` VisOption's `Citywide` entry so the Boundary and Time dropdowns still have something coherent to show. `renderMap` bails to `renderUnmappedCitywide` before reading any measure field, and that draws a flat gray citywide polygon, hides the legend and the Save map control, opens a message popup, and outlines `#v-pills-tab`.

The message, verbatim: *"Data not mapped for this indicator. Click or tap on the visualization bar for other data views."*

Five things the fix had to get right that were not obvious from reading the source, each found during the work:

- **There were four `indicators.find` sites, not one.** The plan assumed `data.js:235` was the single place measures enter the SPA. `menu.js` has two of its own and `app.js` one, and `menu.js:256` fires on **every dropdown change** — so normalising `indicatorMeasures` alone would have fixed first load and handed a raw null-`Map` measure straight back on the first geography change. All four now resolve through `getIndicatorById`.
- **Two crash sites, not one.** Guarding `metadata[0].AvailableGeoTypes` is insufficient: `mapMeasurementType.includes(...)` dereferences the same missing object one line later and throws regardless. The bail-out therefore sits at the top of `renderMap`.
- **A third crash, in `menu.js`:** the "finest available geography" `reduce` had no seed, so a measure with no mappable geography threw *Reduce of empty array with no initial value* once the null option was filtered out. Seeded.
- **`metadata[0]` is `undefined`, not merely flagged, for measures with no `Citywide` fallback in `Table`.** `measures.js` only pushes a measure into `DE.lookups.mapMeasures` when `aqMapTimesGeos` has rows for it, so those measures never arrive and `showMap`'s fallback hands `renderMap` an empty array. A `MapUnavailable` test alone can never fire for them — the `!metadata?.[0]` half of the branch is what reaches them, and it is why §4.13's measures get the same message rather than a blank basemap.
- **A popup opened with `L.popup().openOn(map)` is bound to no layer**, so `resetMapForRender` removing the geometry did not take it down. Switching from an unmapped measure to a mapped one left "Data not mapped for this indicator" sitting on top of a working choropleth (observed on id 73, measures 138/326/327). Fixed with `currentMap.closePopup()` at the render boundary, which also fixes the same latent bug for the pre-existing citywide-only popup.

Two things deliberately **not** changed. The citywide-only path (`isCitywideOnly` → `handleCitywideOnly`, 94 measures) keeps its coloured polygon, its value popup and its auto-switch to Trends — verified unchanged on `?id=55`, and it must stay a distinct state. And `CITYWIDE_POPUP_LATLNG` is untouched: it is "roughly lower Manhattan", which sits on the West Side shoreline, so the unmapped popup rendered over the Hudson with its body across New Jersey. The unmapped popup anchors to `map.getCenter()` instead. The polygon's own `getBounds().getCenter()` was tried first and is also too far west — Staten Island drags the bounding box south-west onto the harbour.

One inconsistency was found and closed by withholding a control rather than by fixing it: `print-map.js` builds its export from `DE.map.filteredMapData`, so on an unmapped measure it produced a **teal bubble with a viridis legend** — mapped-looking output for data the screen had just said is not mapped. Rather than teach the off-screen export path a third render mode (it is order-sensitive: `setView` before vector layers), the Save map control is hidden in this state. If someone later wants the export, that is the work, and this is the reason it was skipped.

**How this was verified:** runtime only — the failure was a render-time throw, the fix is a render, and the outline is a CSS box on a flex container that changes direction at 768px. `?id=26` (fully null), a per-measure sweep of all 6 measures on `?id=73` (both directions across the mapped/unmapped boundary), `?id=55` (must be unchanged), `?id=2427` (§4.13's bucket), the highlight's full dismiss-and-don't-re-arm lifecycle, and the outline at 390px and 1456px. `npm run lint`, `smoke`, `characterize -- --check` and `docs-check` all pass.

`npm run smoke` caught **none** of this before, because no affected indicator was in its `PAGES` list. Two are now: `data-explorer/birth-defects/?id=26` and `data-explorer/waterways/?id=2427`, one per branch of the bail-out.

One method note worth keeping: the first per-measure sweep of id 73 **reported success while proving nothing.** It collected the dropdown buttons once and clicked them in a loop, but `updateAllMenus` rebuilds those buttons on every change, so every click after the first landed on a detached node — `MeasureID` stayed at 136 for all 12 iterations while the output looked like a clean 12-row pass. It also matched `.measures-holder` twice, since the desktop and mobile menus are separate holders. Re-query per iteration, and scope to one holder.

### 4.13 Measures with no `Citywide` row to fall back on — an upstream metadata question, not a front-end bug

**Status: open (raised 2026-07-30). Not a crash, and not urgent** — these render §4.12's unmapped state correctly. What is open is a question for the data side.

§4.12's fallback substitutes the `Table` VisOption's `Citywide` entry for an unpopulated `Map` array. Two groups have no `Citywide` entry in `Table` either, so there is nothing to copy:

| Bucket | Measures | What the user gets |
|---|---|---|
| `AvailableGeoTypes` is `["NYHarbor"]` only — e.g. id 2427 (Enterococci bacteria), 5 measures | **9** | The unmapped polygon and message, correctly. Boundary and Time dropdowns are **empty** — no options at all, rather than blank ones |
| Neighborhood geographies but no `Citywide` — one measure of id 2176 | **1** | Same |

The measure counts are as gathered 2026-07-27 and were not re-derived; the id-2427 measure count (5, all `NYHarbor`) was confirmed in the browser on 2026-07-30.

Empty dropdowns are an improvement on the blank-option state they replace and on the throw before that, but they are still a dead end: the controls are present and offer nothing. Two things would resolve it properly, and both belong upstream rather than in the SPA:

1. **`NYHarbor` has geometry** — `ny_harbor.topo.json`, already in `GEO_FILE_BY_TYPE`. If these measures are genuinely mappable at harbour sites, the fix is to populate `VisOptions[0].Map` with a `NYHarbor` entry, and the SPA will map them with no code change. Worth asking before building anything: the front end already supports the geotype.
2. **Ask whether `Map: null` is deliberate suppression or an omission.** This is the question that decides whether §4.12's citywide fallback is permanent or a stopgap. For the 87 measures it covers, `AvailableGeoTypes`, `Table` and the data files all carry mappable geographies while `Map` alone is unpopulated — which reads more like an omission than a decision, but the catalog is the wrong place to guess from.

**Report upstream (EHDP-data):** `VisOptions[0].Map` is unpopulated for 40 of 282 indicators whose other views carry real geographies; separately, 10 measures have no `Citywide` row anywhere to fall back on, 9 of them `NYHarbor`-only despite `ny_harbor.topo.json` existing.

---

## What I recommend, concretely

**Status: superseded as of 2026-07-26**, when the last of it shipped. This is the original 2026-07-13 sequencing, kept as the record of what order the work was planned in; items 1–4 and 6–7 are all done, and the only live pieces left are 4.3 and 4.4 in item 5. The current to-do list is the at-a-glance block at the top.

1. **Port `hotfix-table-sorting-by-geo` first** (one PR, folding in 1.1 + 1.2) — it's wanted feature work, it rewrites `handleToggle` and the sort defaults, and every table-touching audit item is cheaper after it than under it.
2. **Rest of Tier 1** in parallel or right after (one short PR; 1.7 is the one user-facing defect in the set).
3. **Tier 2 next** (one PR per item, harness-checked) — best value-per-risk; 2.4 is a genuine UX improvement on dense geographies, 2.7 is your requested print split.
4. **Tier 3.1 + 3.2** after (network wins, easy to demonstrate); 3.3 whenever the site shell is next touched, in small isolated commits since those files are shared with production's lineage.
5. **Tier 4.1** only when there's appetite for a multi-week staged effort; 4.5's ESLint piece is cheap and worth doing before 4.1, not after. 4.4 waits for the end of comparative user testing.
6. **4.8 is closed.** The topic-content indexing work — `single.html`'s narrowed ignore + hidden `.Content`/`takeaction`, plus `section.html`'s new-capability indexing on both trees — shipped and was live-verified on `feature-new-data-explorer-pagefind-audit`, along with deleting the orphaned `/search-results/` page and the dead commented-out filter line at head.html:56. The remaining item — the "Data Explorer (Old)" filter chip — still rides along with Tier 4.4's retirement, no separate action needed.
7. **4.9 is closed** — two defects (deformed focus ring, off-centre glyph), both resolved by swapping the text `&times;` for an inline SVG; measured in-browser, shipped on `feature-new-data-explorer`. No follow-on work, but its generalizable trap (text children sit where the font's baseline puts them, and any overflowing child deforms Chrome's `outline: auto` — use an SVG/image child for icon-only controls) is a concrete argument for the visual-regression piece of 4.5.

## Suggested models per workstream

- **Tier 1** (deletions, inert config, 1.7's small CSV builder): **Sonnet 5** — fully specified, grep-provable; near-Opus coding at a third the cost.
- **Borough-grouping port**: **Opus 4.8** — real cross-version judgment (shifted column indexes, rewritten `handleToggle`, lazy-render interplay).
- **Tier 2 mechanical extractions** (2.1, 2.2, 2.5, 2.6, 2.7): **Sonnet 5**, harness-checked, one PR each.
- **Tier 2.3/2.4 + Tier 3.1/3.2** (map hot paths, async ordering): **Opus 4.8**.
- **Tier 4.1 + planning/review bookends**: **Fable 5** — long-horizon staged refactor with high blast radius.
- **SDD subagents**: orchestrator Fable/Opus, implementers Sonnet, reviewers Opus, Explore/search Haiku 4.5 (Agent tool `model` param per spawn).
- Switch models at task boundaries only — a mid-session model switch invalidates the prompt cache.

## Verification

- Rebuild: `hugo --environment dev_stage --cleanDestinationDir --logLevel debug`; fresh tab (fingerprinted-JS cache).
- Characterization: `node scripts/de-characterization.mjs --baseline` before starting, `--check` after each stage (dev server on :8080).
- Manual per-tier: borough-grouping port → toggle on/off at NTA + Borough geographies, collapse/expand all three levels, sort columns in ungrouped mode, and sort a mixed alphanumeric column both ways (covers 1.1); Tier 1.7 → download the CSV from every tab (bar, table, trend, links, disparities) and open each file; Tier 2.3/2.4 → hover NTA choropleth + open a citywide-only indicator; Tier 2.7 → save-map (choropleth **and** bubble) + save-chart end to end; Tier 3 → network tab: switch indicator twice, count requests; Lighthouse before/after for 3.3. **UHF sprawl** (site-wide audit §5a) → the deletions/gating are template-level, so verify with a clean `hugo` build + `git diff` of `docs/` (expect *no* rendered-output change), then click through: a neighborhood report (demographics + ZIP list still render), the NR section page and topic landing (neighborhood picker still populates from `neighborhoods`), and the overlap tool on both `neighborhood-reports/` and `data-features/neighborhood-overlap/`.
