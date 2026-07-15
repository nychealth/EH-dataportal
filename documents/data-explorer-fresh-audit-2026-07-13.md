# Data Explorer Fresh Audit — 2026-07-13

## Context

Fresh line-by-line audit of the active data explorer SPA (`assets/js/data-explorer/`, 15 files, ~10,900 lines including `de-tab-content.js`) plus the templates that load it (`themes/dohmh/layouts/data-explorer/single.html`, `partials/head.html`) and `package.json`. Goal: consolidation, elegance, performance, and dependency reduction — anything on the table, delivered as tiered options with decision considerations.

This builds on (and does not re-report) the prior audits: every finding in `documents/data-explorer-deep-audit-2026-06-27.md` §0–§6 is closed as of 2026-07-04, and the state-namespace refactor (`const DE = {...}`) landed 2026-07-11 on this branch. What remains open from the consolidated 04-19 doc is the structural tier: renderer registry (#3), selectors (#4), stale-fetch guard (#6), URL module (#7), boot sequence (#12), mapInterop lifecycle (#13), fetch cache (#15), hover reset (#17), and the copy-citation cleanup (#26). This audit confirms those are all still live in current code, pins them to exact sites, and adds **new findings** the earlier passes missed.

## Decisions (2026-07-13, from review)

- **No script bundling.** Separate `<script>` tags stay — the team wants stack traces and devtools line numbers pointing at real source files. Consolidated #19 is closed as won't-do; dropped from Tier 3.
- **Old explorer stays** for comparative user testing; the new DE owns `/data-explorer/` (already true on this lineage). Branch divergence is low-stakes here: the SPA files exist *only* on this branch lineage and the branch doesn't touch the old explorer's files, so there's nothing to conflict with. The one real friction point is **shared shell files** (`head.html`, shared partials) that production also edits — keep Tier 3.3 changes in their own small commits so they cherry-pick/merge cleanly.
- **Keep the `leaflet-control-geocoder` npm package**; delete only its unused head.html script tag (Tier 1.6 updated).
- **Data download must work sensibly on every tab view** — added as Tier 1.7; a real defect was confirmed on the bar tab.
- **Split map print from chart print** — the Leaflet export machinery dwarfs the chart path in print.js; added as Tier 2.7.
- **`hotfix-table-sorting-by-geo` must be integrated** into the new DE — added as its own workstream (see "Pending integration" below Tier 1). It cannot be git-merged (branched before this branch's table rework); it has to be ported. All table-touching audit items are sequenced after/with the port.

**Safety net for Tiers 2–4:** the characterization harness (`documents/de-characterization.mjs`, 3 indicators × all 5 views) — re-baseline before starting and `--check` after each stage.

---

## Tier 1 — Small correctness fixes and dead weight (hours; near-zero risk)

New findings from this pass. Each is independently shippable.

### 1.1 `type: 'natural'` sorting silently downgraded — real behavior gap
[table.js:652](../assets/js/data-explorer/table.js#L652) declares `{ type: 'natural', targets: ['_all'] }`, but the naturalSort plugin (`assets/js/naturalSort.js`) is loaded **only by the old explorer's** `single.html:1123-1128` — never by the new one. DataTables falls back to plain string detection, so the new explorer's table sorts differently than the old one for mixed alphanumeric columns.
**Decide:** load `naturalSort.js` on the new `single.html` (parity with old), or delete the columnDef (accept string sort). Column 9 already has its own numeric sort renderer, so check which hidden/visible columns actually change order before choosing. **Fold into the borough-grouping port PR** (see Pending integration): the port changes default sort behavior (Area-alphabetical when ungrouped), which is exactly where natural-vs-string sorting is most visible.

### 1.2 `select: true` is inert
[table.js:636](../assets/js/data-explorer/table.js#L636) — the DataTables Select extension is not installed (`datatables.net-select` absent from package.json and head.html). The option does nothing. Delete it (also removes confusion with the CLAUDE.md "omit Select" gotcha). Fold into the borough-grouping port PR alongside 1.1.

### 1.3 Case-inconsistent percentile guard (6th copy disagrees with the other 5)
The percent-display rule appears 6×; five use `!…includes('percentile')` but [trend.js:221](../assets/js/data-explorer/trend.js#L221) uses `!…includes('Percentile')` (capital P). A measure named "…percentile…" vs "…Percentile…" formats differently on the trend tab than everywhere else. Fixed for free by Tier 2.1's shared helper; or as a one-character fix now.

### 1.4 Write-only dead state: `DE.lookups.measureAbout` / `measureSources`
Written at [measures.js:441-442, 516-517](../assets/js/data-explorer/measures.js#L516) and initialized in global.js, but **no reader exists anywhere** (the "used by table.js" comment is stale). Delete the fields, the accumulation loop lines, and the global.js entries.

### 1.5 Dead/vestigial code, one commit
- [map.js:365-368](../assets/js/data-explorer/map.js#L365) unused `resetHighlight` (its own comment says so) and [map.js:458](../assets/js/data-explorer/map.js#L458) unused per-feature `let currentlyHighlighted` (an abandoned start on Tier 2.4's hover fix); `calculatePercent` destructured but unused at both renderer call sites.
- [global.js:306-315](../assets/js/data-explorer/global.js#L306) commented-out `renderTitleDescription`.
- [global.js:257-272](../assets/js/data-explorer/global.js#L257) `copyCitation` still builds/selects/removes a throwaway `<textarea>` that `navigator.clipboard.writeText` never uses (consolidated #26 — the last uncosed quick item).
- [global.js:653](../assets/js/data-explorer/global.js#L653) trailing comma-operator (`hiddenElement.download = …,` then `.click()`) — works by accident; make it two statements.
- [311.js:24-28](../assets/js/data-explorer/311.js#L24) a `.then()` that only returns its input.
- Pure-alias functions: `updateLinksSelectionSummary` ≡ `updateLinksDropdownToggle`, `getActiveTrendMeasureId` ≡ `getSyncedTrendMeasureId` (measures.js) — inline or keep one name.
- [global.js:423-436](../assets/js/data-explorer/global.js#L423) `geoTypes` array duplicates `GEO_RANK_BY_PRETTY_TYPE`'s keys in the same order → `const geoTypes = Object.keys(GEO_RANK_BY_PRETTY_TYPE);` (string-key insertion order is guaranteed).

### 1.6 Unused dependencies (package.json + head.html)
- **`ci` (^2.3.0)** — referenced nowhere; almost certainly an accidental `npm i ci`. Remove.
- **`leaflet-control-geocoder`** — loaded in head.html:226-227 on every data-library page; its only reference in the entire repo is a *commented-out* line in `content/data-features/flood-vulnerability-index/fvi.js:70`. **Per decision: keep the npm package, delete only the head.html script tag** (stops shipping ~150 KB of unused JS to every data-library page while keeping the package available if the fvi geocoder idea is revived).
- **rawgit PointInPolygon CDN** ([head.html:230](../themes/dohmh/layouts/partials/head.html#L230)) — RawGit shut down in 2019; `@mapbox/leaflet-pip` is already in package.json as the replacement. (Known from the site-wide audit, still unfixed; the DE page eats this dead request on every load.)

### 1.7 Make "Download data" work sensibly on every tab (user-requested; confirmed defect)
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

### New follow-up surfaced during 1.6's execution (not part of Tier 1, no code changed here)

Removing the dead RawGit PointInPolygon `<script>` tag from `head.html` (item 1.6) exposes — but does not cause — a **pre-existing latent bug** in the unrelated `rats-in-your-neighborhood` data feature: `content/data-features/rats-in-your-neighborhood/neighborhood-rats.js:230,250` calls `area.contains(location.getLatLng())` on an `L.polygon(...)` object for its RMZ check, a method only the RawGit-hosted `Leaflet.PointInPolygon` plugin provided (native Leaflet has no `.contains()`). Since `cdn.rawgit.com` shut down in 2019, that call has been silently throwing `TypeError: area.contains is not a function` in production for years — this cleanup just removes the already-dead script tag that used to (fail to) load it.
- **Fix:** switch to the already-installed `@mapbox/leaflet-pip` (`leafletPip.pointInLayer(...)`, exactly as `content/data-features/heat-story/embed/heat-story-leaflet.js:1728` already does) or Turf/manual ray-casting.
- **Related:** the same page (`rats-in-your-neighborhood.html:219`) also loads a second, separate dead RawGit tag for OpenLayers — the core map library for that feature. If the rats map itself looks broken in production, this is the likely cause. Worth fixing in the same pass since this audit already established RawGit is dead.

---

## Pending integration — port `hotfix-table-sorting-by-geo` (before any other table work)

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

**Port execution status (2026-07-13):** DONE on `feature-new-data-explorer`. Feature ported (not merged) with all indexes remapped +1 for the current pivot (`groupColumnGeo=2`, `groupColumnBoro=6`, `sortBy` 3/8, `orderFixed` GeoRank=4 / BoroID=5); state on `DE.table.groupByBorough`; toggle handler in app.js respects the lazy-render (`tableNeedsRender`) flow; drawCallback keeps the current branch's stale-group `.remove()` + `syncTableAreaSearchInput()`; single-bind `handleToggle` preserved with the new descendant-attr logic; markup + nested-level CSS moved to `de-tab-content.html` (not single.html, where the current table markup lives). **1.2** folded in (deleted inert `select: true`). **1.1** resolved by loading `naturalSort.js` on the new `single.html` (parity with old explorer for user testing); verified the plugin now registers `natural-*` sort types. Live-browser verified: 3-level grouping + fully-qualified keys, toggle on/off (Area alpha-sort across boroughs when off), collapse/expand at borough + geotype levels, and the `hasBorough` guard suppressing borough sub-headers for Citywide and Borough geotypes.

---

## Tier 2 — Consolidation within the SPA (days; mechanical, characterization-checkable)

### 2.1 One `resolveMeasureDisplay()` helper for the percent/display rule (6 sites)
map.js:322, bar.js:120, trend.js:221, correlate.js:247 + 267, disparities.js:92 all reimplement: *percent-ish and not percentile → `%` with bare subtitle; else DisplayType with parenthesized subtitle*. Extract one helper in global.js returning `{ isPercent, displayUnit, measurementDisplay }`. Fixes 1.3 as a side effect and makes the five tabs provably agree.
**Consider:** the sites differ slightly in what they build (subtitle vs. displayType only) — design the return shape off the union, don't force-fit; verify with the harness plus one percent, one rate, and one number measure.

### 2.2 One notes renderer (5 sites)
`updateTableReliabilityNotes` (table.js:187), the bar-notes block (bar.js:72-83), `renderTrendNotes` (trend.js:117), and the inline copies in correlate.js:361-371 / disparities.js:158-170 all do: dedupe `Note` values, `filter(Boolean)`, hide/show a holder, append `<div class='fs-xs'>` per note. Extract `renderUnreliabilityNotes(holderEl, rows→notes)`. Also fixes the `innerHTML +=` reparse loop (consolidated #18) in one place.

### 2.3 map.js internal deduplication
The choropleth and bubble renderers duplicate, nearly verbatim:
- the **citywide popup + one-shot trend-tab nudge** block (4 copies: map.js:497-518, 628-636, 677-693, 724-745);
- the **click-to-trend-tab** handler (5 copies);
- the topo `fetch → topojson.feature → attachDataToGeojsonFeatures` pipeline (2 copies);
- the `window.mapInterop` assembly (2 copies, different shapes — see Tier 4.3).
Extract `handleCitywideOnly(map, data, metadata)` and `switchToTrendTab()`; share the topo-load pipeline. ~150 lines removed, and the "consume the one-shot flag" logic exists once instead of twice.

### 2.4 O(n) hover reset → track-previous (also a perf fix)
[map.js:466-468](../assets/js/data-explorer/map.js#L466): every polygon `mouseover` runs `geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l))` — ~195 restyles per mousemove on NTA. Track the previously highlighted layer and reset only it (the pattern bar.js already uses for its side of the interop, bar.js:544-588). This is consolidated #17, the oldest still-open perf item; the abandoned `currentlyHighlighted` from 1.5 shows it was started once.

### 2.5 Shared CSV-download builder for correlate/disparities
correlate.js:588-612 and disparities.js:372-397 build the same `aq.select(aq.not(<17 identical columns>))` + two `derive`s. Extract one `buildLinksDownloadTable(rows, extraDrops, labels)`.

### 2.6 Hoist the static DOM-builder helpers out of `renderMeasures()`
Within Tier 2 scope (no behavior redesign): `setBadgePillState`, `createBadgePillButton`, `createBadgePillLabel`, `createDropdownIdFragment`, `createBadgePillDropdown`, `setDropdownMenuItemState` (measures.js:540-668) capture **nothing** per-indicator — they're pure DOM factories redefined on every indicator load. Move them to module scope above `renderMeasures`. This is the safe first slice of Tier 4.1 and shrinks `renderMeasures` by ~130 lines on its own.

### 2.7 Split map print out of print.js (user-requested)
print.js is 1,376 lines; roughly 1,000 of them are the off-screen Leaflet map-export machinery (constants at :20-32, everything from `buildMapExportFilename` through `exportLeafletMap`/`renderMapPreview`, :335-1301), while the chart path is a ~30-line vegaEmbed re-render. Split into:
- **`print.js`** — modal shell (`setPrintModalState`, loading/error states), shared text-wrapping helpers, chart preview, `bindPrintControls`;
- **`print-map.js`** — the map-export constants, off-screen Leaflet build, tile-coverage machinery, canvas compositing, and `renderMapPreview`.
Load `print-map.js` immediately before `print.js` in single.html (15th script tag — consistent with the no-bundling decision). Cross-file calls (`renderMapPreview` from `bindPrintControls`; `setPrintModalState`/`splitTextIntoPrintLines` from the map exporter) resolve at call time, so the only load-order constraint is "both before user interaction" — state it in the template comment like the existing ones.
**Consider:** keep the existing Leaflet-export gotchas intact and documented in the new file header (canvas renderer, `setView()` before adding vector layers — see CLAUDE.md's map-export note). This is a pure file move; the harness plus one manual map export (choropleth + bubble) proves it.

**Considerations for Tier 2:** all seven are behavior-preserving relocations/extractions — the kind the characterization harness was built for. Do them as separate commits so a `--check` failure pinpoints the stage. 2.3/2.4 change hot interaction paths; add a manual hover + citywide-indicator check (harness doesn't simulate hover). 2.7 needs a manual save-map + save-chart check on both map types.

**Tier 2 execution status (2026-07-14): COMPLETE.** 2.1, 2.2, 2.5, 2.6, 2.7 shipped via SDD on `feature-de-tier2-consolidation` (6 commits, whole-branch review clean). **2.3** (`5b789f1788`) and **2.4** (`3cddd6e4d2`) executed inline on the same branch: map.js 788 → 738 lines; `switchToTrendTabOnce()` (5 copies), `handleCitywideOnly()` (2), `loadMapGeojson()` (2) extracted; the per-mouseover `eachLayer` sweep replaced with a tracked `highlightedLayer`. Harness `--check` passes after each; clean `hugo` build.

Two things this surfaced, worth carrying forward:
- **The `eachLayer` sweep was load-bearing.** It was the only thing clearing a highlight applied by **bar.js** through `window.mapInterop`. A track-previous fix confined to map.js would leave *two* polygons highlighted after hovering the bar chart and then the map. The fix therefore routes bar-driven highlights through the same tracker (`highlightFeature`/`resetHighlight` on the interop), with `resetHighlight` falling back to the tracked layer when a caller passes a stale one. Verified in-browser across map-hover, bar-driven, and mixed sequences.
- **The `window.mapInterop` dedup listed under 2.3 was deliberately *not* done** — the two shapes differ and collapsing them means touching bar.js's shape-sniffing. That is Tier 4.3, and it stays there.
- Perf, measured (not estimated): the removed sweep cost ~0.09 ms/hover at 34 polygons and ~0.14–0.20 ms at 59, scaling linearly — so NTA's ~195 extrapolates to ~0.5 ms per mousemove — against a 0.03 ms new hover path. Note neither harness indicator (2380: Borough/CD/UHF42; 2414: UHF34) actually offers NTA, so the headline NTA number is extrapolated, not directly measured.

---

## Tier 3 — Performance (days; measurable wins, medium risk)

### 3.1 Cache static fetches across indicator switches (consolidated #15 — biggest network win)
Every indicator switch re-fetches: `GeoLookup.json`, `TimePeriods.json` (data.js:345-391), `comparisons.json` (data.js:19), the TopoJSON for the current geotype (map.js:389, 592 — re-fetched even on a **time-period-only** change), and the 311 crosswalk CSV (311.js:23). All five are static per session. A ~10-line `loadOnce(key, loader)` promise-cache eliminates 3–5 requests per indicator switch and the TopoJSON re-parse on every dropdown change.
**Consider:** TopoJSON per-geotype cache holds ~1-3 MB parsed per geography visited — bound it or accept it (fine for a session). `comparisons.json` is already fetched conditionally; cache the promise, not the filtered result.

### 3.2 Parallelize the comparison fetch with the data fetch
`loadIndicator` awaits `fetch_comparisons()` **before** starting `loadData()` (data.js:284-290 — the code itself asks "why are we waiting for this?"). `createComparisonData` needs nothing from `loadData`; run them under `Promise.all`. Saves one full round-trip on every comparison-bearing indicator load.
**Consider:** `createComparisonData` reads `indicators` (already loaded) and `DE.lookups.indicatorComparisonId` (set before the await) — verify no hidden ordering dependency on `timeTable` (it joins `timeTable` only later, in showComparisonTrend — safe).

### 3.3 DE-page dependency slimming in head.html (shared with site shell)
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

- **Harness base URL** (`d5fb2ea700`): `documents/de-characterization.mjs` hardcoded `/dev-stage/`; `DE_BASE_URL` now overrides it. **Lesson: never start a second Hugo server in this repo** — spinning one up on :8081 to get the expected prefix rewrote the *running* server's asset URLs and livereload port (87 console errors on the user's tab). Point the harness at whatever server is already up instead: `DE_BASE_URL="http://localhost:8080/local-stage/"`.

**Considerations for Tier 3:** 3.1/3.2 are testable with the harness plus a network-tab before/after; 3.3 touches the shared shell — every change needs a spot-check on a data-feature page, a neighborhood report, *and the old explorer* (still shipping for user testing), not just DE. Measure first (Lighthouse on `/data-explorer/asthma/?id=2380`) so wins are demonstrable.

---

## Tier 4 — Structural (weeks; the remaining consolidated-doc backbone)

These are the right long-term moves; each is a mini-project. Ordered by value-per-risk.

### 4.1 Dismantle `renderMeasures()` (measures.js:420-1915 — the 1,500-line function)
It currently: resets per-indicator state, computes table defaults, sorts measures into per-tab arrays, defines ~35 closures (trend pills, links controls, and **all seven `show*` renderers**), and toggles tabs. The renderers are re-created per indicator purely so they can close over… almost nothing (`selectedComparisonLegendTitle` and four DOM refs). Staged plan:
1. Tier 2.6 (pure DOM factories) — done above.
2. Hoist the trend-pill control cluster to module scope; move `selectedComparisonLegendTitle` into `DE.trend`.
3. Hoist the links/disparities control cluster; its state already lives in `DE.links`/`DE.disparities`.
4. Define `showMap/showBar/showTable/showTrend/showBoroughTrend/showComparisonTrend/showLinks` **once at module scope** reading `DE.*` (consolidated #3/#4). `renderMeasures` shrinks to: reset state → build per-tab arrays → set defaults → build controls → toggle tabs (~250 lines).
**Consider:** this is the highest-value understandability change left, and the riskiest. The DE-namespace refactor was explicitly staged to enable exactly this. Requires the harness at every stage plus manual pill/dropdown interaction checks (harness doesn't click pills). Do not combine with any other tier in one PR.

### 4.2 One indicator-load pipeline + URL module (consolidated #7/#12, new pin)
The sequence `loadIndicator → printIndicatorInfo → printMenus → renderMeasures → renderCurrentView` is duplicated three times with small drift: `checkURL` (topic-indicator-selector.js:636-705), `popstate` (app.js:374-438), and `selectIndicator` (topic-indicator-selector.js:570-628). URL parsing/coercion is likewise duplicated between `checkURL` and `popstate`, and history writes happen at 5 sites. Extract `loadAndRenderIndicator(id, { pushHistory })` plus `parseSelectionFromURL()`/`serializeSelection()`. Add the stale-response token (consolidated #6) inside the one pipeline while you're there — rapid back/forward or double-clicked indicators can currently interleave fetches.
**Consider:** popstate has subtle extra behavior (menu resync without reload when the indicator is unchanged) — the unified function needs an explicit `sameIndicator` branch, not a force-reload.

### 4.3 Stable `window.mapInterop` contract (consolidated #13)
bar.js currently branch-sniffs which map type built the interop object (`if (mapAPI.circleMarkers) … else if (mapAPI.geoIDtoLayer)`, bar.js:558-590) because choropleth and bubble publish different shapes. Define one interface (`highlight(geoID)`, `reset(geoID|handle)`, `updateHoverUI`, `clearHoverUI`, `ready`) created once at load; renderers attach implementations. Kills the shape-sniffing and the not-ready `if (!mapAPI) return` scattering.

### 4.4 Retire the old explorer trees — deferred by decision
The old explorer (`assets/js/data-explorer-old/` + layouts + content, ~6,500 JS lines) **stays for comparative user testing** (2026-07-13 decision), so this is a future item, not current work. Park it with a trigger: *when user testing concludes*, deleting the three `-old` trees unlocks dropping `buttons.print` + `rowgroup` from the shared DataTables bundle, settles the `naturalSort` question (1.1) permanently, removes `responsive-table.js` (dead now regardless — no template loads it; deletable today), and ends the old explorer's GA event-name skew.

### 4.5 Guardrails worth adding while the code is hot (professionalization)
- **ESLint (flat config, `no-undef` + `no-unused-vars` only)** over `assets/js/data-explorer/` — with 15 files sharing one global scope, undefined-name typos are this codebase's most likely regression class, and `no-undef` with a shared-globals list catches them at commit time. Playwright is already a devDependency; there are currently **zero** npm scripts — add `lint` and `characterize` scripts as the first two.
- **Promote the characterization harness to a routine check** (`npm run characterize -- --check`), documented in CLAUDE.md, run before any Tier 2–4 merge.
- Optional, cheap: use the already-site-wide-loaded DOMPurify on the fetched-metadata `innerHTML` sinks (`how_calculated`, `Sources`, `IndicatorDescription` in topic-indicator-selector.js/measures.js) — the old explorer sanitized these, the new one doesn't. Low actual risk (DOHMH-controlled data repo) but the library is already paid for.

### 4.6 head.html's conditional-gating pattern needs a structural rethink (site-wide, not DE-specific — added 2026-07-14)
Full write-up in **§2 of `documents/site-wide-audit-2026-06-27.md`** (added the same day, prompted by a question about 3.3's own approach). Flagged here because 3.3's fixes are more of the pattern this criticizes: every section-specific exception (easybutton/colorIcon excluded for `data-explorer`, `uhflist` restricted to `neighborhood-reports`, and everything already gated before them) is another branch in head.html's one big `{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") (eq .Section "data-explorer") }}` block. A page's actual dependencies end up living somewhere other than its own template — reading `data-explorer/single.html` doesn't tell you what it loads, head.html does — and two templates can collide silently: `data-explorer-old/single.html` builds its own DataTables bundle at the literal same `resources.Concat` target path (`js/dataTableBundle.js`) as head.html's, and Hugo serves whichever one it cached first with no build error (harmless today only because neither template's JS calls the plugins the two versions differ on — see 3.3's write-up above).
**Recommend:** per-template inclusion for anything that isn't truly universal — each template `{{ partial }}`s in only the libraries it needs (one line per library if each is its own tiny partial) — reserving head.html conditionals for what every page genuinely needs (charset, viewport, favicon, GA). This project's CLAUDE.md already endorses the equivalent pattern one level down, for page-specific JS ("externalize to `assets/js/<page-name>/*.js`... see `data-explorer/single.html`"); this is the same idea applied to which libraries a template pulls in.
**Consider:** Tier-4-sized, not a quick fix — head.html is shared with production's lineage, so this wants its own staged effort with the characterization harness plus manual checks across every page kind (DE, old explorer, data-features, neighborhood-reports, take-action), not a ride-along in a smaller PR. Natural trigger: whenever 4.4 (old explorer retirement) next requires touching this file anyway.

---

## What I recommend, concretely

1. **Port `hotfix-table-sorting-by-geo` first** (one PR, folding in 1.1 + 1.2) — it's wanted feature work, it rewrites `handleToggle` and the sort defaults, and every table-touching audit item is cheaper after it than under it.
2. **Rest of Tier 1** in parallel or right after (one short PR; 1.7 is the one user-facing defect in the set).
3. **Tier 2 next** (one PR per item, harness-checked) — best value-per-risk; 2.4 is a genuine UX improvement on dense geographies, 2.7 is your requested print split.
4. **Tier 3.1 + 3.2** after (network wins, easy to demonstrate); 3.3 whenever the site shell is next touched, in small isolated commits since those files are shared with production's lineage.
5. **Tier 4.1** only when there's appetite for a multi-week staged effort; 4.5's ESLint piece is cheap and worth doing before 4.1, not after. 4.4 waits for the end of comparative user testing.

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
- Characterization: `node documents/de-characterization.mjs --baseline` before starting, `--check` after each stage (dev server on :8080).
- Manual per-tier: borough-grouping port → toggle on/off at NTA + Borough geographies, collapse/expand all three levels, sort columns in ungrouped mode, and sort a mixed alphanumeric column both ways (covers 1.1); Tier 1.7 → download the CSV from every tab (bar, table, trend, links, disparities) and open each file; Tier 2.3/2.4 → hover NTA choropleth + open a citywide-only indicator; Tier 2.7 → save-map (choropleth **and** bubble) + save-chart end to end; Tier 3 → network tab: switch indicator twice, count requests; Lighthouse before/after for 3.3. **UHF sprawl** (site-wide audit §5a) → the deletions/gating are template-level, so verify with a clean `hugo` build + `git diff` of `docs/` (expect *no* rendered-output change), then click through: a neighborhood report (demographics + ZIP list still render), the NR section page and topic landing (neighborhood picker still populates from `neighborhoods`), and the overlap tool on both `neighborhood-reports/` and `data-features/neighborhood-overlap/`.
