# Tier 4.1 — Dismantle `renderMeasures()` (design spec)

**Date:** 2026-07-24
**Branch (planned):** `feature-de-tier4.1-render-measures` off `feature-new-data-explorer`
**Source item:** `documents/data-explorer-fresh-audit-2026-07-13.md` §4.1
**Status:** implemented 2026-07-24 on `feature-de-tier4.1-render-measures` (5 commits `7c0b3c7c3d`..`f5867cacf3`; `renderMeasures` 1,338 → 199 lines), verified per-stage (lint / characterize / smoke + Playwright on 2380 & 2023). Fast-forward merged into `feature-new-data-explorer` at `62f9bc8798`. See fresh-audit §4.1 execution-status block.

## Problem

`renderMeasures()` ([measures.js:559-1896](../assets/js/data-explorer/measures.js#L559)) is a single ~1,338-line `async` function that runs once per indicator load. It does eight unrelated jobs:

| Block | Lines | Job |
|---|---|---|
| A | 563-621 | reset per-indicator state; compute table time/geo defaults |
| B | 626-648 | sort measures into `DE.lookups.{map,trend,links,disparities}Measures` |
| C | 653-659 | the four `setDefault*Measure` calls |
| **D** | 664-1014 | trend-pill control cluster: 3 locals + 12 closures + `buildTrendSelectionControls()` |
| **E** | 1019-1449 | links/disparities control cluster: 4 DOM refs + 11 closures + `buildLinksSelectionControls()` |
| **F** | 1455-1813 | 2 table helpers + the seven `show*` renderer assignments |
| G | 1816-1845 | tab enable/disable (three if/else blocks) |
| H | 1848-1894 | tab activation (`tabSelector` map + `resetOverlayTabState()`) |

Clusters D, E, and F are **re-created on every indicator switch** purely so their closures can capture almost nothing. A direct audit of lines 664-1813 confirms the only `renderMeasures` locals they close over are:

- **DOM references** (`trendMeasurePills`, `trendComparisonPills`, `linksDropdownMenu`, `dropdownLinksMeasures`, `linksToggleLabel`, `show-disparities`) — indicator-independent; the same elements for the life of the page.
- **One mutable local:** `selectedComparisonLegendTitle` ([measures.js:666](../assets/js/data-explorer/measures.js#L666)), 10 reference lines (1 declaration + 9 usages).

Everything else they touch is already on the `DE.*` namespace or is a module-scope helper/constant. (The one apparent exception, a `tableContainer` reference inside `showTable`, is that function's **own** `const` shadow at [measures.js:1506](../assets/js/data-explorer/measures.js#L1506), not a capture of block A's local.) The DE-namespace refactor was explicitly staged to enable this extraction.

## Goal

Define D, E, and F **once at module scope** reading `DE.*`, so `renderMeasures` shrinks to ~250 lines that read top-to-bottom: reset state → build per-tab arrays → set defaults → build controls → enable/disable tabs → activate tab. **Pure relocation — no behavioral change intended anywhere.**

## Non-goals / deferred

- **Splitting measures.js into multiple files** (`trend-controls.js` / `links-controls.js` / `views.js`) — considered and explicitly deferred (2026-07-24 decision). Everything stays in measures.js so the 15-file synchronous load order, `single.html`, CLAUDE.md's documented order, and `eslint.config.mjs` are all untouched. Revisit as a separate pass once 4.1 has settled.
- No other audit tier rides along in this PR (audit's explicit rule: 4.1 is the riskiest change and goes alone).

## Design

### File layout
All definitions remain in measures.js, hoisted from inside `renderMeasures` to module scope, landing after the existing badge-pill DOM factories (the Tier 2.6 block ending ~line 552) and before `renderMeasures` itself. Relative order among the hoisted clusters: **D, then E, then F**, so a reader meets the control builders before the renderers that call them.

### DOM-reference resolution
The six pill/dropdown DOM refs become module-scope `let`s, resolved lazily by a new `resolveMeasuresPillRefs()` helper that mirrors the existing `resolveTabReferences()` pattern ([measures.js:387](../assets/js/data-explorer/measures.js#L387)). One genuinely misleading name is fixed as part of the move (understandability is the goal of this refactor): the *menu* element (id `linksDropdownMenu`) was held by a variable named `dropdownLinksMeasures`, which reads like the *toggle* — rename that variable to `linksDropdownMenu` (8 use sites), proven complete by `no-undef` + grep. The element **ids** are load-bearing (templates + other JS), so they aren't changed *during* the hoist; the one genuinely confusing id — the toggle's `dropdownLinksMeasures`, whose variable is already the clear `linksDropdownToggle` — is renamed to match in the separate Stage 4 below. The other four ref names carry over unchanged:

```js
let trendMeasurePills;
let trendComparisonPills;
let linksDropdownMenu;       // renamed from dropdownLinksMeasures; holds the #linksDropdownMenu element
let linksDropdownToggle;     // holds the #dropdownLinksMeasures element (id kept; oddly named)
let linksToggleLabel;
let showDisparitiesButton;

const resolveMeasuresPillRefs = () => {
    trendMeasurePills    ??= document.getElementById('trendMeasurePills');
    trendComparisonPills ??= document.getElementById('trendComparisonPills');
    linksDropdownMenu    ??= document.getElementById('linksDropdownMenu');
    linksDropdownToggle  ??= document.getElementById('dropdownLinksMeasures');
    linksToggleLabel     ??= document.getElementById('linksToggleLabel');
    showDisparitiesButton ??= document.getElementById('show-disparities');
};
```

`renderMeasures` calls `resolveMeasuresPillRefs()` alongside its existing `resolveTabReferences()` call near the top. (Eager `getElementById` at module scope would also work — the SPA `<script>` tags load after the markup, and measures.js loads only on `data-explorer/single.html`, never on `section.html` — but lazy `??=` matches the file's own established idiom and is null-safe.)

### The `show*` / `sync*` assignment pattern (load-order-critical)
`showTable`, `showBar`, `showMap`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks`, and `syncLinksSelectionsToMapSelection` are declared `let` in [global.js:187-195](../assets/js/data-explorer/global.js#L187) and **assigned** inside `renderMeasures` today (`showMap = () => {…}`).

The hoist **relocates those assignments to module scope; it does not convert them to `const`.** A `const showMap = …` in measures.js would collide with the `let showMap;` in global.js — both live in the shared top-level lexical scope of the concatenated classic scripts — and throw `Identifier 'showMap' has already been declared` at load, breaking every page. The `let` declarations stay in global.js as the single declaration site; measures.js keeps assigning to them, just from module scope instead of from inside the function.

### `selectedComparisonLegendTitle` → `DE.trend`
Add `selectedComparisonLegendTitle: null` to the comparison-field group in `DE.trend` ([global.js:78-84](../assets/js/data-explorer/global.js#L78)). Replace all 10 reference lines in cluster D (measures.js lines 666, 792, 794, 800, 812, 813, 956, 957, 980, 1002) with `DE.trend.selectedComparisonLegendTitle` (line 666 is the local declaration, removed; the other 9 are usages, rewritten). This removes the last mutable local the trend cluster captured, which is what lets D hoist cleanly.

### Dead-code removal (in scope, same neighborhood)
`syncTrendSelectionsToMapSelection` is declared `let` in [global.js:194](../assets/js/data-explorer/global.js#L194) and **never assigned or called anywhere** in the tree. Delete the declaration. (Its sibling `syncLinksSelectionsToMapSelection` is real — assigned in measures.js, called from menu.js — and stays.)

### What `renderMeasures` looks like after (≈250 lines)
```
resolveTabReferences(); resolveMeasuresPillRefs();
reset per-indicator state (block A)
build per-tab measure arrays (block B)
set metadata defaults + await setDefaultLinksMeasure (block C)
buildTrendSelectionControls();          // now module-scope
buildLinksSelectionControls();          // now module-scope
enable/disable tabs (block G)
activate the tab matching DE.state.overlay (block H)
```

## Staging

Five commits, each independently verified (see below) before the next. Staged by provability: the isolated state move first, then one cluster per stage, the `show*` renderers hardest-last, and finally the template id-clarity rename as its own isolated commit.

### Stage 0 — state move + dead-code delete
- Add `DE.trend.selectedComparisonLegendTitle`; migrate the 8 references.
- Delete the dead `syncTrendSelectionsToMapSelection` global.
- No hoisting yet. Smallest provable step; leaves `renderMeasures` otherwise intact.

### Stage 1 — hoist trend cluster D
- Move lines 664-1014 (the 12 closures + `buildTrendSelectionControls`) to module scope.
- `trendMeasurePills` / `trendComparisonPills` become module-scope `let`s via `resolveMeasuresPillRefs()`.
- `renderMeasures` keeps its `buildTrendSelectionControls()` **call**.

### Stage 2 — hoist links/disparities cluster E
- Move lines 1019-1449 (11 closures + `buildLinksSelectionControls`, including `renderSelectedCorrelate` / `renderSelectedDisparities` and the `syncLinksSelectionsToMapSelection` assignment) to module scope.
- The 4 links DOM refs become module-scope `let`s via `resolveMeasuresPillRefs()`.
- State already lives in `DE.links` / `DE.disparities`; no new `DE.*` fields expected.
- `renderMeasures` keeps its `buildLinksSelectionControls()` **call**.

### Stage 3 — hoist the seven `show*` renderers F
- Move lines 1455-1813 (the 2 table helpers `adjustVisibleSummaryTable` / `scheduleVisibleSummaryTableAdjust` + the 7 `show*` assignments) to module scope, preserving the assignment pattern (§ above).
- `renderMeasures` shrinks to the ~250-line skeleton above.

### Stage 4 — rename the confusing toggle element id (template + JS clarity)
- Separate, isolated commit after the JS hoist is fully verified. Rename the correlate-tab toggle button's element id `dropdownLinksMeasures` → `linksDropdownToggle` so it matches the JS variable that holds it (already `linksDropdownToggle` after Stage 2) and no longer reads like the measures menu. Four sites, all new-explorer-only: the `id` and the menu's `aria-labelledby` in `de-tab-content.html`, plus the `clickLinksToggle` selector and the resolver's `getElementById` argument in measures.js.
- `de-tab-content.html` renders only on `data-explorer/single.html` (via `de-tabs.html`); the retired `data-explorer-old` tree keeps its own independent copy of this id and is not touched. Verified by a new-explorer-scoped grep (zero remaining) plus a Playwright check that the dropdown still opens and the `aria-labelledby` link stays valid.

## Verification (per stage, before each commit)

The characterization harness **cannot click trend pills or the links dropdown** — precisely the controls in D and E — so a green `characterize --check` is necessary but not sufficient. Each stage adds a live interactive pass, per this project's root-cause rule (runtime evidence, not source reasoning).

1. **Automated:** `npm run lint` (`no-undef` catches any missed reference from the move), `npm run characterize -- --check` (no rendered-view regression vs. baseline), `npm run smoke` (no non-allowlisted console error).
2. **Interactive (Playwright MCP), on asthma id=2380** — exercises map, bar, trend, links, **and** disparities (poverty-221 comparator):
   - click the **Geography** trend pill and **each comparison pill**; assert the trend chart re-renders and the console stays clean;
   - open the **links dropdown**, select **each correlate**; click **Disparities**; assert the correlate/disparities chart re-renders, console clean.
3. **Second indicator (Stages 1-2 only):** repeat the pill checks on **air quality id=2023**, whose comparison pills and annual-average trend slices differ from 2380 — this is what the per-indicator closures used to rebuild, so it must still produce the right pills after the clusters are built once at module scope.

A stage is done only when 1-3 pass; then commit. If any interactive check fails, stop and gather runtime evidence before a second attempt (root-cause rule — two speculative fixes in a row means the premise is wrong).

## Risks

- **Highest-risk change remaining in the SPA** (audit's own framing). Mitigated by: pure relocation with no logic edits, per-stage commits that revert cleanly, `no-undef` linting, and the interactive Playwright pass that covers the harness's blind spot.
- **Redeclaration trap:** covered above — keep `show*`/`sync*` as assignments, never `const`.
- **Closure-capture surprise:** audited to only DOM refs + `selectedComparisonLegendTitle`; the `no-undef` lint plus the two-indicator interactive pass would surface any missed capture immediately.

## Acceptance

- `renderMeasures` is ~250 lines and reads as a linear setup sequence.
- D, E, F defined exactly once at module scope; no per-indicator re-creation.
- `npm run lint` / `characterize -- --check` / `smoke` all green after every stage.
- Interactive Playwright pass clean on both 2380 and 2023.
- No changes to load order, `single.html`, `section.html`, `eslint.config.mjs`, or CLAUDE.md's documented architecture (beyond the audit-doc status update recorded on completion).
- Audit `documents/data-explorer-fresh-audit-2026-07-13.md` §4.1 updated with execution status when merged.
