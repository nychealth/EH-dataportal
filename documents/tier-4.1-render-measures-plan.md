# Tier 4.1 — Dismantle `renderMeasures()` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoist `renderMeasures()`'s three per-indicator closure clusters (trend-pill controls, links/disparities controls, and the seven `show*` renderers) to module scope so the function shrinks from ~1,338 lines to ~250, with zero behavioral change.

**Architecture:** Pure code relocation inside `assets/js/data-explorer/measures.js`. Each cluster's closures move from inside the `async renderMeasures` function up to module scope, reading the `DE.*` state namespace that the earlier DE-namespace refactor already established. The one captured mutable local moves to `DE.trend`; DOM references become module-scope lazy refs matching the existing `resolveTabReferences()` idiom. No new files, no load-order change, no new dependencies.

**Tech Stack:** Vanilla ES2020 browser JS (classic `<script>` tags sharing one global lexical scope, load order fixed at 15 files). Verification tooling: ESLint flat config (`npm run lint`), Playwright characterization harness (`npm run characterize`), Playwright console-error smoke test (`npm run smoke`), all pre-existing. Interactive verification via Playwright MCP driven by the orchestrator.

## Why this plan has no "write a failing test first" steps

This is a **behavior-preserving refactor**, not a feature. The regression test was written in advance: `scripts/de-characterization.mjs` captures the rendered output (selected labels, Leaflet layer counts, Vega mark counts, DataTables row counts) of three indicators across every view, and a committed baseline (`scripts/de-characterization-baseline/`) is the expected value. `npm run characterize -- --check` is therefore the standing "does behavior still match" test for every task — the TDD-for-refactors equivalent of a pre-written characterization test. Each task's cycle is: make the relocation → `lint` → `characterize -- --check` → `smoke` → Playwright interactive pass → commit. A task is done only when all five are green.

The characterization harness **cannot click trend pills or the links dropdown** — exactly the controls in the clusters being moved — so each task adds a scripted Playwright MCP interactive pass (run by the orchestrator, per the human's decision to drive it) that clicks every pill and dropdown option and asserts a clean console + correct re-render. This is required by the project's root-cause rule: runtime evidence, not source reasoning.

## Global Constraints

_Every task's requirements implicitly include this section._

- **Changes stay in `assets/js/data-explorer/measures.js`** — except: the two explicitly-listed `global.js` edits in Task 1, and the toggle-id rename in `themes/dohmh/layouts/partials/de-tab-content.html` (+ its two measures.js string references) in Task 5. No changes to script load order, `data-explorer/single.html`, `data-explorer/section.html`, `eslint.config.mjs`, `CLAUDE.md`, or **anything under `data-explorer-old/`** (retired — it has its own independent copy of these ids and JS; never touch it).
- **`show*` and `sync*` stay assignments, never `const`.** `showTable`, `showBar`, `showMap`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks`, and `syncLinksSelectionsToMapSelection` are declared `let` in `global.js` (lines 187-195) and assigned in `measures.js`. Relocating an assignment to module scope keeps it an assignment (`showMap = () => {…}`). Writing `const showMap = …` would redeclare the `global.js` `let` in the shared top-level scope → `Identifier 'showMap' has already been declared` at load, breaking every page.
- **Behavior-preserving relocation.** Do not change what any moved statement *does* — no re-ordered arguments, no logic edits, no altered control flow. **Clarity renames of genuinely misleading identifiers ARE in scope** (understandability is the point of this refactor; the codebase mixes hand-written and prior-AI-generated names), but keep them targeted — rename a name that actively misleads, not every name you'd have chosen differently — and every rename must be proven complete by `no-undef` (the old name ceases to exist, so any missed reference errors) plus a grep showing zero variable-position uses of the old name. Element **ids** in the HTML are load-bearing (referenced by templates and other JS) and are NOT renamed here. Each task names its explicit transformations (DOM-ref resolution, the `selectedComparisonLegendTitle` → `DE.trend` swap, the `dropdownLinksMeasures` → `linksDropdownMenu` variable rename).
- **4-space indentation; generous vertical whitespace** — match the surrounding `measures.js` style (see `measures.js` / `documents/js-conventions.md`). Moved code keeps its existing internal formatting.
- **Line numbers below are as of the pre-Task-1 committed state** (`feature-new-data-explorer` @ `6559b9078f`) and **shift after every task.** Anchor edits by the named function / comment-banner landmarks given, then confirm against the current file; treat the numbers as a starting hint, not gospel.
- **Never run a static `hugo` build while a dev server is running, and never start a second Hugo server** (shared fingerprint cache; see CLAUDE.md). The verification tooling reuses a running server via `scripts/dev-server.mjs`.
- **Root-cause rule:** any claim about runtime behavior cites a running-browser observation, at any change size.

## File Structure

| File | Responsibility | This plan's change |
|---|---|---|
| `assets/js/data-explorer/measures.js` | Per-tab defaults, control clusters, `show*` renderers, `renderMeasures` orchestration | The entire refactor: three clusters hoisted to module scope; `renderMeasures` shrinks to a linear setup sequence |
| `assets/js/data-explorer/global.js` | `DE` state namespace + `let` declarations for cross-file bindings | Task 1 only: add `DE.trend.selectedComparisonLegendTitle`; delete the dead `syncTrendSelectionsToMapSelection` declaration |
| `themes/dohmh/layouts/partials/de-tab-content.html` | The new explorer's tab markup (map/bar/table/trend/correlate panes + pill controls) | Task 5 only: rename the toggle button's `id`/`aria-labelledby` `dropdownLinksMeasures` → `linksDropdownToggle` (renders only on `data-explorer/single.html`) |

## Setup (before Task 1)

Create the dedicated branch off the current feature branch. Nothing else in this branch's history — 4.1 ships alone (audit rule).

```bash
git switch feature-new-data-explorer
git switch -c feature-de-tier4.1-render-measures
```

Confirm the tooling is green on the untouched baseline before changing anything (establishes that any later red is caused by this work, not pre-existing):

```bash
npm run lint                      # expect: exit 0, no output
npm run characterize -- --check   # expect: "PASSED" (no rendered-view diff)
npm run smoke                     # expect: "13/13" pages clean
```

If any of the three is not green on the untouched baseline, **stop and report** — do not start the refactor on a red baseline.

---

## Task 1: Stage 0 — move `selectedComparisonLegendTitle` to `DE.trend`; delete dead global

**Files:**
- Modify: `assets/js/data-explorer/global.js` (DE.trend object ~line 78-84; dead `let` ~line 194)
- Modify: `assets/js/data-explorer/measures.js` (10 reference lines: 666, 792, 794, 800, 812, 813, 956, 957, 980, 1002)

**Interfaces:**
- Produces: `DE.trend.selectedComparisonLegendTitle` (string | null) — the new home for the comparison-pill selection, replacing the `renderMeasures`-local `selectedComparisonLegendTitle`. Read/written by the trend cluster in Task 2.
- Removes: `syncTrendSelectionsToMapSelection` global (never assigned or called anywhere — verified by repo-wide grep).

- [ ] **Step 1: Add the field to `DE.trend`.** In `global.js`, inside the `trend: { … }` object, add the new field next to the other comparison fields. Change:

```js
        selectedComparison: undefined,
        selectedComparisonId: undefined,
        selectedComparisonAbout: "",
```

to:

```js
        selectedComparison: undefined,
        selectedComparisonId: undefined,
        selectedComparisonLegendTitle: null,
        selectedComparisonAbout: "",
```

- [ ] **Step 2: Delete the dead global.** In `global.js`, remove the line:

```js
let syncTrendSelectionsToMapSelection;
```

Leave the adjacent `let syncLinksSelectionsToMapSelection;` (line 195) — it is real (assigned in measures.js, called from menu.js).

- [ ] **Step 3: Convert the local declaration into a per-indicator reset.** In `measures.js`, the declaration at line 666 currently re-initializes the value to `null` on every `renderMeasures` call. Preserve that exact reset semantics by turning the declaration into an assignment to the `DE.trend` field. Change:

```js
    let selectedComparisonLegendTitle = null;
```

to:

```js
    // Reset the comparison-pill selection for each indicator load (was a per-call `let`
    // re-initialization before selectedComparisonLegendTitle moved onto DE.trend).
    DE.trend.selectedComparisonLegendTitle = null;
```

> This line stays inside `renderMeasures` permanently — it is per-indicator state reset, and it must NOT move out when the trend cluster hoists in Task 2.

- [ ] **Step 4: Rewrite the 9 usage sites.** In `measures.js`, replace every remaining bare `selectedComparisonLegendTitle` (lines 792, 794, 800, 812, 813, 956, 957, 980, 1002 — including the two occurrences on line 956) with `DE.trend.selectedComparisonLegendTitle`. After this step, `grep -n "selectedComparisonLegendTitle" measures.js` must show only `DE.trend.`-qualified references and zero bare ones. The rewritten lines read, in context:

```js
        if (DE.trend.selectedComparisonLegendTitle) {
            const comparisonIdForLegendTitle = getComparisonIdForLegendTitle(DE.trend.selectedComparisonLegendTitle);
```
```js
            DE.trend.selectedComparisonLegendTitle = null;
```
```js
        if (DE.trend.selectedComparisonLegendTitle) {
            return DE.trend.selectedComparisonLegendTitle;
```
```js
            if (DE.trend.selectedComparisonLegendTitle && !compLegendTitles.includes(DE.trend.selectedComparisonLegendTitle)) {
                DE.trend.selectedComparisonLegendTitle = null;
```
```js
                    DE.trend.selectedComparisonLegendTitle = title;
```
```js
            DE.trend.selectedComparisonLegendTitle = null;
```

- [ ] **Step 5: Lint.** Run:

```bash
npm run lint
```

Expected: exit 0, no output. (`no-undef` would fire here if any bare `selectedComparisonLegendTitle` were left after its declaration was removed — a useful catch.)

- [ ] **Step 6: Characterization + smoke.** Run:

```bash
npm run characterize -- --check
npm run smoke
```

Expected: `characterize` prints `PASSED`; `smoke` reports `13/13`.

- [ ] **Step 7: Interactive pass (orchestrator, Playwright MCP).** On the running dev server, navigate to the asthma trend view and confirm comparison-pill selection still works and does not leak across indicators:
  1. Navigate to `<DE_BASE_URL>data-explorer/asthma/?id=2380` (match `<DE_BASE_URL>` to the running server, e.g. `http://localhost:8080/dev-stage/` for a `--environment dev_stage -p 8080` server).
  2. Click `#v-pills-trends-tab`. Wait for `#trend` to contain a chart.
  3. In `#trendComparisonPills`, click a `.trendmode-button` (a comparison pill); assert the trend chart re-renders and `#trendComparisonPills .trendmode-button.active` reflects the click. Capture console — assert no non-allowlisted `error`/`pageerror`.
  4. Click the `#trendMeasurePills` Geography pill (`.trendmode-button[data-trend-mode="geography"]`); assert the borough trend renders and console stays clean.
  5. Switch indicator without reload: navigate to `<DE_BASE_URL>data-explorer/asthma/?id=2414`, open the trend tab, and assert the comparison pills rebuild for 2414 (no stale 2380 selection persists) — this confirms the per-indicator reset (Step 3) preserved behavior.

- [ ] **Step 8: Commit.**

```bash
git add assets/js/data-explorer/global.js assets/js/data-explorer/measures.js
git commit -m "$(cat <<'EOF'
Tier 4.1 Stage 0: move selectedComparisonLegendTitle to DE.trend

Convert the per-call `let selectedComparisonLegendTitle` local into a
DE.trend.selectedComparisonLegendTitle reset + qualified references, so
the trend-pill cluster can hoist to module scope in Stage 1 with no
captured mutable local left. Also delete the never-assigned dead global
syncTrendSelectionsToMapSelection. Pure state relocation, no behavior
change (per-indicator reset preserved; characterize/smoke green,
Playwright pill pass clean on 2380 + 2414).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Stage 1 — hoist the trend-pill control cluster to module scope

**Files:**
- Modify: `assets/js/data-explorer/measures.js` (trend cluster ~lines 664-1014; new module-scope helper + refs before `renderMeasures` ~line 558)

**Interfaces:**
- Consumes: `DE.trend.selectedComparisonLegendTitle` (from Task 1).
- Produces at module scope: `resolveMeasuresPillRefs()`; module-scope `let trendMeasurePills`, `let trendComparisonPills`; and the 12 trend closures (`getSyncedComparisonId`, `getComparisonRowsForLegendTitle`, `getComparisonIdForLegendTitle`, `getComparisonLegendTitleById`, `getActiveTrendMeasureId`, `getActiveTrendMeasureLabel`, `getActiveComparisonId`, `getActiveComparisonLegendTitle`, `clearTrendButtonState`, `setTrendButtonState`, `updateTrendSelectionSummary`, `buildTrendSelectionControls`). Names and bodies unchanged; used by the `show*` renderers (still inside `renderMeasures` until Task 4) and by the pill click handlers.

- [ ] **Step 1: Add module-scope refs + lazy resolver.** In `measures.js`, immediately before the `// function to render the measures` banner (~line 554), add:

```js
// ----------------------------------------------------------------------- //
// pill / dropdown DOM references
// ----------------------------------------------------------------------- //

// Resolved lazily (like resolveTabReferences) because the trend/links control
// clusters are defined at module scope but the elements only exist once the
// SPA shell markup has parsed. measures.js loads only on data-explorer/single.html.
let trendMeasurePills;
let trendComparisonPills;

const resolveMeasuresPillRefs = () => {
    trendMeasurePills    ??= document.getElementById('trendMeasurePills');
    trendComparisonPills ??= document.getElementById('trendComparisonPills');
};
```

- [ ] **Step 2: Call the resolver inside `renderMeasures`.** Find the existing `resolveTabReferences();` call near the top of `renderMeasures` (~line 565) and add the new call right after it:

```js
    resolveTabReferences();
    resolveMeasuresPillRefs();
```

- [ ] **Step 3: Remove the two local ref declarations.** In `renderMeasures`, delete these two lines (~664-665), which are now module-scope:

```js
    const trendMeasurePills = document.getElementById('trendMeasurePills');
    const trendComparisonPills = document.getElementById('trendComparisonPills');
```

Leave the `DE.trend.selectedComparisonLegendTitle = null;` reset line immediately below them (from Task 1) in place — it stays in `renderMeasures`.

- [ ] **Step 4: Move the 12 closures to module scope.** Cut the contiguous block from `const getSyncedComparisonId = () => {` (~669) through the closing `};` of `buildTrendSelectionControls` (~1011) — all 12 closure definitions, unchanged — and paste it at module scope directly below the `resolveMeasuresPillRefs` helper added in Step 1. Do not alter any statement inside the block; they already reference `DE.*`, the module-scope refs, and each other.

  **Leave behind** in `renderMeasures`, at the cut location, the call that followed the block:

```js
    buildTrendSelectionControls();
```

  So after this task, `renderMeasures` reads: …block C… → `DE.trend.selectedComparisonLegendTitle = null;` → `buildTrendSelectionControls();` → …the correlate/links section (untouched, Task 3)….

- [ ] **Step 5: Lint.** Run:

```bash
npm run lint
```

Expected: exit 0. (`no-undef` catches any trend closure that referenced a `renderMeasures` local not accounted for — none should exist per the audit, so a hit here means investigate before proceeding.)

- [ ] **Step 6: Characterization + smoke.** Run:

```bash
npm run characterize -- --check
npm run smoke
```

Expected: `PASSED`; `13/13`.

- [ ] **Step 7: Interactive pass (orchestrator, Playwright MCP), two indicators.** The trend cluster is now built once at module scope instead of once per indicator; verify per-indicator pill correctness on two indicators with different comparison sets:
  1. `<DE_BASE_URL>data-explorer/asthma/?id=2380` → open `#v-pills-trends-tab`. Click the Geography pill and **each** `#trendComparisonPills .trendmode-button` in turn; after each, assert the trend chart re-renders and the console is clean.
  2. `<DE_BASE_URL>data-explorer/air-quality/?id=2023` → open the trend tab. Assert the comparison pills that build are 2023's (annual-average / air-quality comparisons), not 2380's; click Geography and each comparison pill; assert clean re-render + console.

- [ ] **Step 8: Commit.**

```bash
git add assets/js/data-explorer/measures.js
git commit -m "$(cat <<'EOF'
Tier 4.1 Stage 1: hoist trend-pill control cluster to module scope

Move the 12 trend closures (getSyncedComparisonId … buildTrendSelection-
Controls) out of renderMeasures to module scope; they close over only
DE.* plus the two pill DOM refs, now module-scope lazy refs via
resolveMeasuresPillRefs() (mirrors resolveTabReferences). renderMeasures
keeps the per-indicator reset and the buildTrendSelectionControls() call.
Pure relocation; lint/characterize/smoke green; Playwright pill pass
clean on 2380 and 2023 (distinct comparison sets).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Stage 2 — hoist the links/disparities control cluster to module scope

**Files:**
- Modify: `assets/js/data-explorer/measures.js` (links cluster ~lines 1019-1449; extend `resolveMeasuresPillRefs`)

**Interfaces:**
- Consumes: `resolveMeasuresPillRefs()` (from Task 2); `DE.links.*`, `DE.disparities.*` state (pre-existing).
- Produces at module scope: `let linksDropdownMenu` (renamed from `dropdownLinksMeasures`), `let linksDropdownToggle`, `let linksToggleLabel`, `let showDisparitiesButton`; and the 11 links closures (`getLinksOptionCount`, `updateLinksSelectionSummary`, `getLinksButtonLabel`, `getSyncedLinksState`, `getVisibleLinksMeasures`, `getActiveLinksState`, `setLinksButtonState`, `syncLinksSelectionsToMapSelection` [assignment to the `global.js` `let`], `buildLinksSelectionControls`, `renderSelectedCorrelate`, `renderSelectedDisparities`). Used by `showLinks` (still inside `renderMeasures` until Task 4) and by menu.js (`syncLinksSelectionsToMapSelection`).

- [ ] **Step 1: Extend the ref resolver.** In `measures.js`, add the four links refs to the module-scope declarations and to `resolveMeasuresPillRefs` created in Task 2. The menu variable is **renamed** `dropdownLinksMeasures` → `linksDropdownMenu` to match the element it actually holds (id `linksDropdownMenu`) — the old name pointed at the menu while *reading* like the toggle. The other three keep their already-clear names:

```js
let trendMeasurePills;
let trendComparisonPills;
let linksDropdownMenu;
let linksDropdownToggle;
let linksToggleLabel;
let showDisparitiesButton;

const resolveMeasuresPillRefs = () => {
    trendMeasurePills    ??= document.getElementById('trendMeasurePills');
    trendComparisonPills ??= document.getElementById('trendComparisonPills');
    linksDropdownMenu    ??= document.getElementById('linksDropdownMenu');
    // NB: the toggle button's element id is the oddly-named `dropdownLinksMeasures`
    // (id is load-bearing in de-tab-content.html + clickLinksToggle's selector, so it
    // stays); the variable `linksDropdownToggle` is the clear name to rely on.
    linksDropdownToggle  ??= document.getElementById('dropdownLinksMeasures');
    linksToggleLabel     ??= document.getElementById('linksToggleLabel');
    showDisparitiesButton ??= document.getElementById('show-disparities');
};
```

- [ ] **Step 2: Remove the four local ref declarations.** In `renderMeasures`, delete these lines (~1019-1022). The module-scope `let`s from Step 1 replace them; `linksDropdownToggle` / `linksToggleLabel` / `showDisparitiesButton` keep their names, so their uses are unchanged, while `dropdownLinksMeasures` is renamed at its 8 downstream use sites in Step 3:

```js
    const dropdownLinksMeasures = document.getElementById('linksDropdownMenu');
    const linksDropdownToggle = document.getElementById('dropdownLinksMeasures');
    const linksToggleLabel = document.getElementById('linksToggleLabel');
    const showDisparitiesButton = document.getElementById('show-disparities');
```

- [ ] **Step 3: Move the 11 closures to module scope and rename the menu variable.** Cut the contiguous block from `const getLinksOptionCount = () => {` (~1025) through the closing `};` of `renderSelectedDisparities` (~1446) and paste it at module scope directly below the moved trend cluster (from Task 2). This block includes the `syncLinksSelectionsToMapSelection = (force = false) => {…}` assignment (~1238); it stays an **assignment** (see Global Constraints), now at module scope.

  In the moved block, **rename the variable** `dropdownLinksMeasures` → `linksDropdownMenu` at all 8 use sites (originally ~lines 1277, 1278, 1285, 1296, 1311, 1319, 1338, 1340 — inside `buildLinksSelectionControls`). Do not touch the `getElementById('dropdownLinksMeasures')` **string** in the resolver (Step 1) or the `#dropdownLinksMeasures` **selector string** in `clickLinksToggle` (~line 352) — those refer to the toggle's element id, which is legitimately named `dropdownLinksMeasures`. This is the only rename in the task; make no other identifier changes to the moved code.

  **Leave behind** in `renderMeasures`, at the cut location, the call that followed the block:

```js
    buildLinksSelectionControls();
```

- [ ] **Step 4: Lint + confirm rename completeness.** Run:

```bash
npm run lint
```

Expected: exit 0. This is the primary rename check: the variable `dropdownLinksMeasures` no longer exists, so **any missed use fails `no-undef`** (`'dropdownLinksMeasures' is not defined`). A missed links-closure capture of a `renderMeasures` local also fails here. Then confirm two things by grep:

```bash
# (a) No variable-position uses of the old menu-variable name remain.
grep -n "dropdownLinksMeasures" assets/js/data-explorer/measures.js
# Expected: exactly 2 hits, BOTH id-strings referring to the toggle's element id —
#   the getElementById('dropdownLinksMeasures') in resolveMeasuresPillRefs, and the
#   '#dropdownLinksMeasures' selector in clickLinksToggle (~line 352). No bare-variable hits.

# (b) The four const links locals are gone from inside renderMeasures.
grep -n "const linksDropdownMenu\|const linksDropdownToggle\|const linksToggleLabel\|const showDisparitiesButton" assets/js/data-explorer/measures.js
# Expected: zero hits (their only declarations are now the module-scope `let`s).
```

- [ ] **Step 5: Characterization + smoke.** Run:

```bash
npm run characterize -- --check
npm run smoke
```

Expected: `PASSED`; `13/13`.

- [ ] **Step 6: Interactive pass (orchestrator, Playwright MCP), correlate + disparities.** On asthma 2380 (has both correlates and the poverty-221 disparities view):
  1. `<DE_BASE_URL>data-explorer/asthma/?id=2380` → click `#v-pills-correlate-tab`. Wait for the correlate chart.
  2. Open the links dropdown (`#dropdownLinksMeasures`); for **each** item in `#linksDropdownMenu`, click it and assert the correlate chart re-renders + console clean.
  3. Click `#show-disparities`; assert the disparities scatter renders and console is clean.
  4. Switch a map measure (via the map measure dropdown) and reopen the correlate tab; assert `syncLinksSelectionsToMapSelection` still syncs the dropdown to the new map measure (the menu.js call path). Console clean.
  5. Second indicator: `<DE_BASE_URL>data-explorer/air-quality/?id=2023` → correlate tab → confirm the links options rebuild for 2023 and render cleanly.

- [ ] **Step 7: Commit.**

```bash
git add assets/js/data-explorer/measures.js
git commit -m "$(cat <<'EOF'
Tier 4.1 Stage 2: hoist links/disparities control cluster to module scope

Move the 11 links closures (getLinksOptionCount … renderSelectedDispari-
ties, including the syncLinksSelectionsToMapSelection assignment and
buildLinksSelectionControls) out of renderMeasures to module scope. Their
state already lives in DE.links/DE.disparities; the four dropdown DOM refs
join resolveMeasuresPillRefs. Rename the misleading menu variable
dropdownLinksMeasures -> linksDropdownMenu (it holds the #linksDropdownMenu
element; the old name read like the toggle); element ids unchanged.
renderMeasures keeps the buildLinksSelectionControls() call. Behavior-
preserving; lint/characterize/smoke green (no-undef proves the rename is
complete); Playwright correlate+disparities pass clean on 2380 and 2023,
map-measure sync intact.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Stage 3 — hoist the seven `show*` renderers to module scope

**Files:**
- Modify: `assets/js/data-explorer/measures.js` (`show*` block + two table helpers ~lines 1452-1813)

**Interfaces:**
- Consumes: the module-scope trend cluster (Task 2) and links cluster (Task 3); `DE.*`; the `global.js` `let show*` declarations (lines 187-193).
- Produces at module scope: `const adjustVisibleSummaryTable`, `const scheduleVisibleSummaryTableAdjust`, and the seven `show*` **assignments** (`showTable`, `showMap`, `showBar`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks`). Called by app.js (`renderCurrentView`, `runOverlayRenderer`) at runtime — unchanged call sites.

- [ ] **Step 1: Move the block to module scope.** Cut the contiguous block from the `// ----- functions to show to tabs ----- //` banner (~1452) through the closing `};` of `showLinks` (~1813) and paste it at module scope directly below the moved links cluster (from Task 3). The block contains, in order: `adjustVisibleSummaryTable` (`const`), `scheduleVisibleSummaryTableAdjust` (`const`), then the seven `show* = …` **assignments**. Move it verbatim — the two helpers stay `const` (they are not declared in `global.js`, so no collision), and every `show*` stays an assignment (do **not** add `const`/`let`).

- [ ] **Step 2: Verify `renderMeasures`' remaining body.** After the cut, `renderMeasures` should contain only: the reset/table-defaults (block A), per-tab measure arrays (block B), the `setDefault*` calls + `await setDefaultLinksMeasure` (block C), the `DE.trend.selectedComparisonLegendTitle = null;` reset, `buildTrendSelectionControls();`, `buildLinksSelectionControls();`, the tab enable/disable (block G, `if (DE.lookups.mapMeasures.length === 0) …`), and the tab-activation section (block H, `const tabSelector = {…}` through `resetOverlayTabState()` and the final `$(target).tab('show')`). Read the function start-to-finish and confirm it is ~250 lines with nothing but that sequence. No dangling references, no orphaned comments.

- [ ] **Step 3: Lint.** Run:

```bash
npm run lint
```

Expected: exit 0. A `no-undef` hit here would most likely be a `show*` accidentally converted to `const` colliding-then-shadowing, or a helper reference left dangling — investigate, do not suppress.

- [ ] **Step 4: Characterization + smoke.** Run:

```bash
npm run characterize -- --check
npm run smoke
```

Expected: `PASSED`; `13/13`.

- [ ] **Step 5: Full interactive regression (orchestrator, Playwright MCP).** The `show*` renderers drive every tab; exercise all of them plus tab-switching on both indicators:
  1. `<DE_BASE_URL>data-explorer/asthma/?id=2380`: confirm the map renders on load (console clean). Click through `#v-pills-bar-tab` (bar), `#v-pills-table-tab` (table renders, rows present), `#v-pills-trends-tab` (Geography + each comparison pill), `#v-pills-correlate-tab` (each links option + Disparities). After each, assert correct render + clean console.
  2. Change time period and geography via the map dropdowns; assert the map + open overlay re-render correctly (exercises `renderCurrentView` → `show*`).
  3. `<DE_BASE_URL>data-explorer/air-quality/?id=2023`: repeat the tab sweep; verify the annual-average trend slice still renders (2023's special-case path in `showBoroughTrend`).
  4. Confirm no console `error`/`pageerror` beyond the smoke allowlist on any step.

- [ ] **Step 6: Confirm the shrink and commit.** Run:

```bash
awk '/^const renderMeasures = async/,/^}$/' assets/js/data-explorer/measures.js | wc -l
```

Expected: roughly 240-260 lines (down from ~1,338). Then commit:

```bash
git add assets/js/data-explorer/measures.js
git commit -m "$(cat <<'EOF'
Tier 4.1 Stage 3: hoist the seven show* renderers to module scope

Move the show* block (adjustVisibleSummaryTable, scheduleVisibleSummary-
TableAdjust, and showTable/showMap/showBar/showTrend/showBoroughTrend/
showComparisonTrend/showLinks) out of renderMeasures to module scope.
show* stay ASSIGNMENTS to the global.js `let` bindings (const would
redeclare and break load); the two table helpers stay const. renderMeasures
is now ~250 lines: reset -> per-tab arrays -> defaults -> build controls ->
enable/disable tabs -> activate tab. Pure relocation; lint/characterize/
smoke green; full Playwright tab-sweep clean on 2380 and 2023.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Stage 4 — rename the confusing toggle element id (template + JS)

**Files:**
- Modify: `themes/dohmh/layouts/partials/de-tab-content.html` (button id ~line 251; menu `aria-labelledby` ~line 255)
- Modify: `assets/js/data-explorer/measures.js` (the `clickLinksToggle` selector ~line 352; the resolver's `getElementById` argument in `resolveMeasuresPillRefs`)

**Rationale:** the correlate-tab **toggle button**'s element id is `dropdownLinksMeasures`, which reads like it names the measures dropdown/menu rather than the toggle. After Task 3 the JS variable holding it is already the clear `linksDropdownToggle`; renaming the id to match completes a clean scheme where each element's id equals its JS variable (`linksDropdownMenu` menu / `linksDropdownToggle` toggle / `linksToggleLabel` label). This markup renders **only** on the new explorer (`de-tab-content.html` → `de-tabs.html` → `data-explorer/single.html`, verified). The retired `data-explorer-old` tree has its own inline copy of this id and its own JS referencing it — **do not touch anything under `data-explorer-old/`**.

**Interfaces:**
- Consumes: the Task 3 module-scope resolver line `linksDropdownToggle ??= document.getElementById('dropdownLinksMeasures');`.
- Produces: element id `linksDropdownToggle` on the toggle button, with matching `aria-labelledby` and `getElementById` argument. No JS variable names change in this task (only two string literals).

- [ ] **Step 1: Rename the button id in the template.** In `de-tab-content.html` (~line 251), change the toggle button's id. Before:

```html
                            <button class="badge badge-pill badge-light border-0 de-viz-pill-button" type="button" id="dropdownLinksMeasures" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
```

After (only `id="dropdownLinksMeasures"` → `id="linksDropdownToggle"`):

```html
                            <button class="badge badge-pill badge-light border-0 de-viz-pill-button" type="button" id="linksDropdownToggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
```

- [ ] **Step 2: Update the menu's `aria-labelledby` to match.** In `de-tab-content.html` (~line 255), the menu points back at the toggle for accessibility; keep that link valid. Before:

```html
                            <div id="linksDropdownMenu" class="dropdown-menu dropdown-menu-right fs-sm de-viz-pill-menu" aria-labelledby="dropdownLinksMeasures">
```

After (only `aria-labelledby="dropdownLinksMeasures"` → `aria-labelledby="linksDropdownToggle"`):

```html
                            <div id="linksDropdownMenu" class="dropdown-menu dropdown-menu-right fs-sm de-viz-pill-menu" aria-labelledby="linksDropdownToggle">
```

- [ ] **Step 3: Update the two JS string references in `measures.js`.** (a) In `clickLinksToggle` (~line 352), the delegated-click guard matches the toggle by id — change only the `#dropdownLinksMeasures` fragment, leave `#show-links` alone:

```js
        if (!button.matches('#show-links, #linksDropdownToggle') || !DE.lookups.linksMeasures.length) {
```

(b) In `resolveMeasuresPillRefs` (module scope, from Task 3), change the resolver's argument:

```js
    linksDropdownToggle  ??= document.getElementById('linksDropdownToggle');
```

- [ ] **Step 4: Confirm the rename is complete and scoped to the new explorer.** Hugo's dev server live-reloads on the template change; no manual rebuild (and never a static build while the server runs). Then grep — the new-explorer references must be zero, and the untouched old-explorer references must remain:

```bash
# New-explorer JS + templates: expect ZERO hits.
grep -rn "dropdownLinksMeasures" assets/js/data-explorer/ themes/dohmh/layouts/data-explorer/ themes/dohmh/layouts/partials/de-tab-content.html

# Old explorer: expect its pre-existing hits, UNCHANGED (sanity that nothing there was edited).
git diff --name-only | grep -i "data-explorer-old" && echo "!! old explorer touched — revert" || echo "old explorer clean"
```

Expected: first grep prints nothing; second branch prints `old explorer clean`.

- [ ] **Step 5: Lint + characterize + smoke.** Run:

```bash
npm run lint
npm run characterize -- --check
npm run smoke
```

Expected: exit 0; `PASSED`; `13/13`. (Lint won't catch an id-string typo — the interactive pass in Step 6 is the real check that the toggle still wires up.)

- [ ] **Step 6: Interactive pass (orchestrator, Playwright MCP) — dropdown wiring.** On asthma 2380, in a fresh tab (fingerprinted JS is cached hard):
  1. `<DE_BASE_URL>data-explorer/asthma/?id=2380` → click `#v-pills-correlate-tab`.
  2. Assert the toggle button now has `id="linksDropdownToggle"` and `#linksDropdownMenu`'s `aria-labelledby` equals `linksDropdownToggle` (accessibility link intact).
  3. Click `#linksDropdownToggle` to open the menu; assert it opens (`aria-expanded="true"`, menu visible) and `#linksToggleLabel` updates as options are chosen.
  4. Select each option in `#linksDropdownMenu`; assert the correlate chart re-renders and the console stays clean.
  5. Click `#show-disparities`; assert the disparities view renders. Console clean throughout.

- [ ] **Step 7: Commit.**

```bash
git add themes/dohmh/layouts/partials/de-tab-content.html assets/js/data-explorer/measures.js
git commit -m "$(cat <<'EOF'
Tier 4.1 Stage 4: rename toggle id dropdownLinksMeasures -> linksDropdownToggle

The correlate-tab toggle button's element id read like the measures menu,
not the toggle; rename it (id + menu aria-labelledby + the two measures.js
string refs) so each element's id matches its JS variable (linksDropdownMenu
menu / linksDropdownToggle toggle). Renders only on the new explorer's
single.html; data-explorer-old untouched (its own copy stays). Verified:
grep clean in new-explorer files, characterize/smoke green, Playwright
confirms the dropdown opens, aria-labelledby link intact, options render.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Post-completion (not a task; do on merge)

- Update `documents/data-explorer-fresh-audit-2026-07-13.md` §4.1 with an execution-status block (branch, commit range, what shipped, verification), matching the format the other completed tiers use in that doc.
- The design spec (`documents/tier-4.1-render-measures-design.md`) can note "implemented" once merged.

## Self-Review

**Spec coverage** — every design-spec element maps to a task:
- `selectedComparisonLegendTitle` → `DE.trend` + reset semantics → Task 1 (Steps 1, 3, 4).
- Dead `syncTrendSelectionsToMapSelection` removal → Task 1 (Step 2).
- Trend cluster D hoist + lazy DOM refs → Task 2.
- Links cluster E hoist + DOM refs + `sync*` assignment preserved → Task 3.
- `show*` cluster F hoist + assignment-not-`const` rule → Task 4.
- Toggle-id clarity rename (`dropdownLinksMeasures` → `linksDropdownToggle`) across template + JS, scoped to the new explorer → Task 5.
- Lazy `resolveMeasuresPillRefs()` mirroring `resolveTabReferences()` → Task 2 Step 1, extended Task 3 Step 1.
- Per-stage lint/characterize/smoke + two-indicator Playwright interactive pass → every task's verification steps.
- Stays in measures.js, no load-order/config change → Global Constraints + File Structure.
- Branch off feature-new-data-explorer, alone → Setup.

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". Bulk moves are described by exact named boundaries + the concrete changed lines (ref declarations, `DE.trend` swaps, the stays-behind calls) rather than re-pasting hundreds of unchanged lines — the honest representation of a relocation.

**Type/name consistency:** `resolveMeasuresPillRefs` spelled identically in Tasks 2 and 3. Five of the six DOM-ref variable names are carried over unchanged (`trendMeasurePills`, `trendComparisonPills`, `linksDropdownToggle`, `linksToggleLabel`, `showDisparitiesButton`); the sixth is renamed `dropdownLinksMeasures` → `linksDropdownMenu` at its declaration + 8 use sites (Task 3 Steps 1-4), with `no-undef` + grep proving completeness. Element **ids** are untouched, so the toggle's id stays `dropdownLinksMeasures` (an NB comment marks it). The seven `show*` names match `global.js:187-193` and stay assignments.
