# Data Explorer — Deep Audit (2026-06-27)

Addendum to `consolidated-improvements-2026-04-17.md` and `-04-19.md`. Those
documents merged four model reviews into 33 (then 24) recommendations. This
audit was produced by reading every actively-loaded file in
`assets/js/data-explorer/` line-by-line against the current `production`
branch, plus the Hugo templates and partials that render the SPA.

> **Updated 2026-06-27 (post-cutover).** The SPA was promoted to the canonical
> `/data-explorer/` endpoint: its files moved from `assets/js/data-explorer-new/`
> to `assets/js/data-explorer/`, and the retired legacy explorer is now at
> `assets/js/data-explorer-old/`. All paths below have been updated to the
> post-cutover layout, and these findings now describe the **live production**
> explorer. (Line numbers were re-verified against the moved files — the cutover
> only renamed directories and rewrote layout resource paths; it did not change
> the SPA JavaScript, so every finding still stands.)

> **Updated 2026-07-01 (post-fix-commit).** The §7 "quick, high-confidence"
> tier shipped in `de8464ba2d` ("Fix Data Explorer bugs found in the deep
> audit", 2026-06-28) and is verified fixed in current code: §0/§2.9 (dead
> files + dead handler), §2.1, §2.2, §2.3, §2.4, §2.5, §2.7, §2.10, and the
> duplicate dropdown IDs in §3. Everything else below — §1 #9/#10/#14, §2.6,
> §2.8, §2.11, the remaining §3 accessibility items, §4, §5, and §6 — is still
> open and accurately described as of this date.

> **Updated 2026-07-02 (post-comment-pass).** `1fb4d56479` ("Apply JS comment
> conventions to Data Explorer JavaScript") landed a comment/heading-formatting
> pass across all 14 SPA files per `documents/js-conventions.md`. It was
> comment- and whitespace-only — verified zero behavior change per file during
> implementation. All line-number citations in this document have been
> re-verified against current code as part of this update; no finding's
> substance changed.

Its purpose is twofold:

1. **Reconcile** the consolidated list against the code as it actually stands
   today (several items are now done; one widely-cited claim is stale).
2. **Add findings the model reviews missed** — chiefly concrete bugs,
   accessibility, and code-to-data coupling.

Severity tags: **P1** = real defect with user-visible or data-integrity impact,
**P2** = correctness/robustness risk, **P3** = maintainability/quality.

---

## 0. What actually loads (scope correction)

Only `single.html` loads the SPA. The Hugo template includes **14** scripts, in
order: global, app, data, measures, table, map, 311, topic-indicator-selector,
menu, bar, trend, correlate, disparities, print.

Not loaded by any template — **dead files totalling ~5,360 lines**:

| File | Lines | Reality |
|------|------:|---------|
| `geography.js` | 3807 | A hardcoded `const topojsonData = {…}`; the live map fetches TopoJSON from the data repo instead. 100% dead. |
| `_choroData.js` | 1122 | Prototype. Dead. |
| `_choro.js` | 259 | Prototype. Dead. |
| `_bar.js` | 173 | Prototype. Dead. |

`utilities.js` no longer exists as a separate file — it was concatenated into
`global.js` (see the `// utilities.js` section banner at
[global.js:295-297](../assets/js/data-explorer/global.js)). Any plan that still
references load-ordering `utilities.js` is out of date.

> **Recommendation (extends consolidated #14/#25):** delete the four dead files.
> They are far larger than the `_bar.js` example the consolidated doc cited, and
> `geography.js` alone is a quarter of the JS in the directory.

---

## 1. Status of the consolidated recommendations (verified against current code)

| # (04-17) | Topic | Status today | Evidence |
|---|---|---|---|
| 9 | Consolidate default-measure priority | **Partial** | Done in measures.js via `pickDefaultMeasureByPriority` ([measures.js:24](../assets/js/data-explorer/measures.js)); but menu.js still has its own `getDefaultMeasure` ([menu.js:14](../assets/js/data-explorer/menu.js)) with *different* rules. Two sources of truth. |
| 10 | Geo lookups → table | **Partial** | `getGeoFile` now uses `GEO_FILE_BY_TYPE` object ([global.js:307](../assets/js/data-explorer/global.js)); `prettifyGeoType` and `assignGeoRank` are still parallel `switch`es. |
| 14 | DataTables destroy before re-init | **Partial** | Destroy is done ([table.js:496](../assets/js/data-explorer/table.js)); the handler-rebind half is *not* — `handleToggle()` still `off/on`s a body-delegated click on every `drawCallback` ([table.js:737](../assets/js/data-explorer/table.js), [:772](../assets/js/data-explorer/table.js)). |
| 30 | Guard analytics | **Done** | `trackDataExplorerEvent` wraps `gtag` ([global.js:503](../assets/js/data-explorer/global.js)). |
| 18 | "Stub renderers" trend/correlate/disparities | **Stale claim** | All three are fully implemented (~630 / ~570 / ~360 lines). Do not treat them as stubs. |
| 1–8, 11–13, 15–17, 19–24, 26–29, 31–33 | State store, URL module, renderer registry, fetch cache, layer/Vega reuse, hover reset, event bus, inline handlers, dead code, execCommand, debug logger, etc. | **Still open** | Confirmed live in this read; specifics cited below where I found exact locations the model reviews didn't. |

Two consolidated items deserve a concrete pin:

- **#15/#17 (hover reset):** still O(n). Every map `mouseover` runs
  `geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l))`
  ([map.js:460](../assets/js/data-explorer/map.js)). There is even a
  `let currentlyHighlighted = null` declared and never used
  ([map.js:452](../assets/js/data-explorer/map.js)) — the fix was started and
  abandoned.
- **#26 (execCommand copy):** `copyCitation` no longer uses `execCommand`, but it
  still builds a throwaway `<textarea>`, selects it, then calls
  `navigator.clipboard.writeText(temp.value)` ([global.js:206](../assets/js/data-explorer/global.js)).
  The textarea is fully redundant — `writeText` uses the string, not the
  selection. Delete the textarea dance.

---

## 2. Confirmed bugs the model reviews missed (P1/P2)

### 2.1 `downloadData()` throws on every chart-data download — **P1**
[global.js:599-623](../assets/js/data-explorer/global.js). The function
signature is `downloadData()` (all params commented out), but the last line is
`e.stopPropagation();`. `e` is undefined → `ReferenceError` every time. It is
wired via inline `onclick="downloadData()"` in three places
([de-tab-content.html:132,231,280](../themes/dohmh/layouts/partials/de-tab-content.html)).
The CSV still saves (the `.click()` runs first), but an uncaught error is thrown
on each download and anything added after that line would never run. **Fix:**
delete the stray `e.stopPropagation();`.

### 2.2 Percentile measures mis-formatted as percent — **P1 (data display)**
[map.js:316](../assets/js/data-explorer/map.js) and
[bar.js:120](../assets/js/data-explorer/bar.js):

```js
if (mt.includes('Percent') || mt.includes('percent') && !mt.includes('percentile'))
```

`&&` binds tighter than `||`, so this is `Percent || (percent && !percentile)`.
A measure named with "Percentile" contains the substring "Percent", so it takes
the first branch → `isPercent = true`, `displayType = '%'`. A 90th-percentile
value renders as "90 %". The correct parenthesization `(A || B) && !C` already
exists in [trend.js:183](../assets/js/data-explorer/trend.js),
[correlate.js:247](../assets/js/data-explorer/correlate.js), and
[disparities.js:92](../assets/js/data-explorer/disparities.js) — map and bar
are simply the two that got it wrong. **Fix:** add the parentheses; extract one
shared `isPercentMeasure(measurementType)` helper so all five sites agree.

### 2.3 Citywide click-through targets a nonexistent element — **P2**
[map.js:500,614,667,718](../assets/js/data-explorer/map.js) call
`document.getElementById('v-pills-trend')`. The real pane is `v-pills-trends`
(plural) and the tab button is `v-pills-trends-tab`
([de-tab-content.html:205](../themes/dohmh/layouts/partials/de-tab-content.html)).
One spot inside the same file uses the correct `'v-pills-trends-tab'`
([map.js:436](../assets/js/data-explorer/map.js)). So for citywide-only
indicators the auto-switch-to-trend silently no-ops (and logs a warning). **Fix:**
use `v-pills-trends-tab` everywhere.

### 2.4 `setTimeout(updateChartPlotSize(), 1000)` runs immediately — **P2**
[print.js:325](../assets/js/data-explorer/print.js). The `()` invokes the
function now and passes its `undefined` return to `setTimeout`; the 1000 ms delay
is a no-op. **Fix:** `setTimeout(updateChartPlotSize, 1000)`.

### 2.5 Misspelled analytics event — **P2 (data quality)**
[app.js:486](../assets/js/data-explorer/app.js) fires
`'click_how_caclulated'` ("caclulated"). GA will bucket it under the typo.

### 2.6 `.reduce((a,b)=>a.concat(b))` with no seed can crash — **P2**
[data.js:485,531,579](../assets/js/data-explorer/data.js) (and
[:144](../assets/js/data-explorer/data.js)). If a measure's
`VisOptions[0].Table|Map|Trend` array is empty, the mapped array is empty and
`reduce` with no initial value throws *"Reduce of empty array with no initial
value."* **Fix:** pass an empty Arquero table as the seed, or guard for length.

### 2.7 Fabricated confidence intervals left in from testing — **P1 (data integrity)**
[bar.js:488,492](../assets/js/data-explorer/bar.js). The Vega transform sets
`ciLow = datum.Value * .95` / `ciHigh = datum.Value * 1.05` when `CI` is empty,
commented `// hard set for test`. In a dataset where *some* rows carry a real CI
(so `hasCI` is true) and others don't, the others render error bars at an
invented ±5 %. **Fix:** drop rows without a real CI out of the error-bar layer
rather than synthesizing one.

### 2.8 Duplicate `"test"` key silently dropped — **P3**
[bar.js:200-202](../assets/js/data-explorer/bar.js): two `"test"` keys in one
object literal; the first is overwritten. Harmless at runtime, but it signals the
intended condition isn't what runs.

### 2.9 Dead indicator-list handler carrying a casing bug — **P3 (fixed, historical)**
**Already deleted** in `app.js` per `de8464ba2d` (was `app.js:463-478`, no
line reference applies anymore). It bound
`$('#indicatorButtons').on('click', …)`, but `#indicatorButtons` exists only in
the *old* explorer (now `data-explorer-old/single.html`), never in the new SPA. The handler
never fired. If it ever did, `e.target.dataset.IndicatorID` would have read
`undefined` — HTML lowercases attributes, so the dataset key is `indicatorid`.
The live path is the modal's delegated `.de-select-indicator-button[data-indicator-id]`
([topic-indicator-selector.js:297-298](../assets/js/data-explorer/topic-indicator-selector.js)).

### 2.10 Table-tab "Download data" button does nothing — **P3**
Three tabs wire `onclick="downloadData()"`; the Table tab's button has no handler
([de-tab-content.html:198](../themes/dohmh/layouts/partials/de-tab-content.html)).
(DataTables' own CSV button covers it, so this stray button is just confusing —
remove or wire it.)

### 2.11 Disparities jitter likely non-deterministic — **P2 (verify)**
[disparities.js:127](../assets/js/data-explorer/disparities.js) uses
`Math.seedrandom` when present, else `Math.random`. `seedrandom` is referenced
only by the *old* explorer; it does not appear to be loaded on the new page, so
the fallback runs and the scatter jitter re-randomizes on every redraw (points
visibly jump). **Fix:** either load seedrandom on the new page or compute a
deterministic offset (e.g. hash of GeoID).

---

## 3. Accessibility — a near-total gap (P1 for a NYC.gov property)

The consolidated docs touch a11y only via "sanitize innerHTML." For a city
government site this is a legal exposure (WCAG 2.1 AA / Section 508). Findings:

- **The map has no accessible representation.** `<div id="map">`
  ([single.html:13](../themes/dohmh/layouts/data-explorer/single.html)) has
  no `role`, `aria-label`, or text alternative. The choropleth conveys all of its
  data through color and **hover only** — the legend readouts (`#hoveredGeo`,
  `#hoveredValue`) update on `mouseover`, and Leaflet vector features aren't in
  the tab order. Keyboard, touch, and screen-reader users get nothing from the
  map.
- **No announced equivalent.** The Table tab *is* the accessible equivalent but
  nothing tells assistive tech that. Add an aria-live summary of the current
  selection and a visible "View as table" affordance.
- **Legend label describes the decoration, not the data:**
  `aria-label="Rectangle filled with Viridis color scale"`
  ([de-indicator-info.html:178](../themes/dohmh/layouts/partials/de-indicator-info.html)).
  Replace with the actual range, e.g. "Legend: 2.1% (low) to 19.8% (high)."
- **Vega charts** are embedded with default options; the rendered SVG/canvas has
  no description or data-table fallback. At minimum set a Vega `description` and
  expose the same CSV the download uses.
- **Duplicate IDs break SR labeling** (also consolidated #23, now pinned):
  `geoOptionsDropdownButton`
  ([de-indicator-info.html:64](../themes/dohmh/layouts/partials/de-indicator-info.html),
  [:122](../themes/dohmh/layouts/partials/de-indicator-info.html)) and
  `timeOptionsDropdownButton` ([:81](../themes/dohmh/layouts/partials/de-indicator-info.html),
  [:137](../themes/dohmh/layouts/partials/de-indicator-info.html)) each render
  twice (mobile + desktop) and are each pointed at by `aria-labelledby`. The
  measure button was fixed (mobile got a `1` suffix); geo/time were not.
- **Contrast:** hardcoded `color:#FFED98` on `bg-primary` for the "Change
  dataset" link — verify it clears 4.5:1.

---

## 4. Code-to-data coupling via magic IDs (new theme — P2 maintainability/correctness)

Render logic is wired to specific backend MeasureIDs / ComparisonIDs. A data
change silently alters behavior with no error:

| Constant | Where | Meaning |
|---|---|---|
| `221` (×4) | [measures.js:341,494,1124,1179,1461](../assets/js/data-explorer/measures.js) | disparities secondary (poverty) measure |
| `[365,370,375,391]`, `[386]` | [measures.js:1630-1631](../assets/js/data-explorer/measures.js) | air-quality measures needing Annual-Average / Summer time slices |
| `[858,859,860,861,862,863]` | [measures.js:1744](../assets/js/data-explorer/measures.js) | "has quarters" comparison measures |
| `[564,565,566,704,715…730]` | [trend.js:171](../assets/js/data-explorer/trend.js) | comparisons that suppress the subtitle |
| `[566,565,564]` | [trend.js:337](../assets/js/data-explorer/trend.js) | "Action days" tooltip label |

> **Recommendation:** move these into metadata flags on the measure/comparison
> records, or failing that, a single `DE_MEASURE_RULES` constants block with a
> comment per entry. Today the knowledge is scattered and uncommented.

---

## 5. Duplication and structure not in the consolidated list (P3)

- **Triplicated join expansion.** [data.js:447-586](../assets/js/data-explorer/data.js)
  has three ~40-line blocks for Table / Map / Trend times-geos that differ only by
  the `VisOptions[0].Table|Map|Trend` key. Collapse to one helper.
- **Two default-measure pickers** (see §1, #9): unify menu.js onto
  `pickDefaultMeasureByPriority` so the dropdown highlight and the rendered
  default can't diverge.
- **5× copy-pasted label-collision transform.** [trend.js:558-597](../assets/js/data-explorer/trend.js)
  repeats the same `lag`/`calculate` pair as `prevLabel`…`prevLabel5`. Build the
  transform array in a loop.
- **~240 lines of behavioral JS inline in a partial.**
  [de-tab-content.html:321-565](../themes/dohmh/layouts/partials/de-tab-content.html)
  holds tab-toggle, accordion, and panel-state logic (with the close-pane logic
  duplicated between an inline handler and `closeExplorerTabPane`). This belongs
  in app.js; its presence is why "startup is spread across template + JS"
  (consolidated #12) is hard to fix.

---

## 6. Robustness and consistency (P2/P3)

- **Core fetches have no `.catch()`:** `loadData`
  ([data.js:290](../assets/js/data-explorer/data.js)), both topo fetches
  ([map.js:383,577](../assets/js/data-explorer/map.js)), 311 `d3.csv`
  ([311.js:23](../assets/js/data-explorer/311.js)). A single failed request
  leaves the UI broken with no message. (Consolidated #29, now with exact sites.)
- **Mixed Arquero filter styles.** String-interpolated predicates —
  `.filter(\`d => d.MeasureID === ${id}\`)` — at
  [data.js:859,907](../assets/js/data-explorer/data.js) and
  [measures.js:501-502](../assets/js/data-explorer/measures.js) sit next to
  `aq.escape(d => …)` elsewhere. The string form is an injection-shaped pattern
  and breaks on non-numeric/quoted values. Standardize on `aq.escape`.
- **String-interpolated `derive` with indicator names.**
  [trend.js:676](../assets/js/data-explorer/trend.js),
  [correlate.js:608-609](../assets/js/data-explorer/correlate.js),
  [disparities.js:392](../assets/js/data-explorer/disparities.js) embed
  `indicatorName` into an Arquero expression string; a name containing an
  apostrophe breaks the expression.
- **`.filter(d => !d == "")`** at [table.js:189](../assets/js/data-explorer/table.js)
  and [trend.js:140](../assets/js/data-explorer/trend.js) — parses as
  `(!d) == ""` and works only by coincidence. Use `.filter(Boolean)`.
- **Logging.** Nearly every function opens with `console.log`, and bar.js logs
  full data arrays and the compiled Vega spec on every render
  ([bar.js:65-67,507-508](../assets/js/data-explorer/bar.js)). Gate behind a
  `?debug` flag (consolidated #28) and drop the array dumps.

---

## 7. Suggested priority order

**Quick, high-confidence fixes (hours): DONE — shipped in `de8464ba2d` (2026-06-28), see note above.**
1. ~~Delete stray `e.stopPropagation()` in `downloadData` (§2.1).~~
2. ~~Parenthesize the percentile check in map.js + bar.js; extract one helper (§2.2).~~
3. ~~Fix `v-pills-trend` → `v-pills-trends-tab` (§2.3).~~
4. ~~Fix `setTimeout(updateChartPlotSize, 1000)` (§2.4).~~
5. ~~Fix `click_how_caclulated` typo (§2.5).~~
6. ~~Remove the fabricated-CI fallback (§2.7).~~
7. ~~Delete the four dead files + dead `#indicatorButtons` handler + dead table-tab download button (§0, §2.9, §2.10).~~
8. ~~De-duplicate `geoOptionsDropdownButton` / `timeOptionsDropdownButton` IDs (§3).~~

**Medium (days):**
9. Accessibility pass on the map + charts (§3).
10. Seed empty-array reduces; add `.catch()` to the four fetches (§2.6, §6).
11. Centralize magic MeasureIDs into metadata/constants (§4).
12. Unify the two default-measure pickers; collapse the triplicated join blocks (§1, §5).

**Structural (the consolidated docs' Tier 1–2):** single state object + dispatcher,
URL module, define renderers once, fetch/layer/Vega reuse, hover-reset fix,
event-bus for map↔bar. These remain the right long-term direction; the items
above make the codebase safer to refactor first.
