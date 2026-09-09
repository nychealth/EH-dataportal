# Data Explorer State Namespace Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the ~100 bare `let` globals declared in `assets/js/data-explorer/global.js` into a single grouped `const DE = { ... }` namespace (`DE.table`, `DE.disparities`, `DE.links`, `DE.trend`, `DE.map`, `DE.print`, `DE.lookups`, `DE.indicator`, `DE.state`), with zero behavior change, following the approved design in `documents/data-explorer-state-namespace-design-2026-07-10.md`.

**Architecture:** The data explorer is a vanilla-JS SPA of 14 classic (non-module) `<script>` files loaded synchronously in a fixed order from `themes/dohmh/layouts/data-explorer/single.html` (`global → app → data → measures → table → map → 311 → topic-indicator-selector → menu → bar → trend → correlate → disparities → print`), sharing state through top-level `let` declarations in `global.js` that all later scripts read and write lexically. Because top-level `let` cannot be aliased through `window` getters/setters (only `var` can), each migration stage must convert **every** file that reads or writes that stage's field group, and delete the group's bare `let` declarations, in one atomic commit — there is no partially-migrated state for a group. A one-time Playwright characterization script (built first, in Task 0) captures rendered outputs as a baseline and is re-run after every task as the regression check.

**Tech Stack:** Vanilla browser JS (no bundler, no modules, classic script tags), Hugo (asset fingerprinting via `short-fingerprint.html`), Arquero, Vega/Vega-Lite/vega-embed, DataTables (jQuery), Leaflet, d3, seedrandom. Playwright (Node library, new devDependency) for the characterization script only — dev tooling, never shipped.

## Global Constraints

- **No behavior change.** This is purely a relocation of where state lives, not a change to what any function computes or renders (design doc, Non-Goals).
- **No ES modules.** Script tags, load order, and the synchronous `<script>`-per-file model are unchanged (design doc, Non-Goals).
- **No new frameworks or build dependencies in browser-side JS** (project `CLAUDE.md`). The Playwright devDependency added in Task 0 is dev-only verification tooling explicitly sanctioned by the design doc's Verification section ("does not touch the shipped bundle or add a runtime dependency") — it never appears in any Hugo template or shipped asset.
- **No test-suite build-out beyond what this refactor needs.** Task 0 builds exactly one characterization script for this migration's own regression checking — not a general test harness, not per-function unit tests, not a broader Playwright suite (design doc, Non-Goals / Verification).
- **`DE_MEASURE_RULES`, `GEO_FILE_BY_TYPE`, `GEO_RANK_BY_PRETTY_TYPE`, and `geoTypes` are untouched.** They are static lookup constants, out of scope (design doc, Non-Goals).
- **Render closures, tab refs, and DOM caches stay bare:** `showTable`, `showBar`, `showMap`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks`, `syncTrendSelectionsToMapSelection`, `syncLinksSelectionsToMapSelection`, `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable`, `aboutMeasures`, `dataSources`, `btnToggleDisparities` (design doc, Explicitly excluded). Their **bodies** are converted when they touch a migrated field; their **names** are not.
- **No aliasing shims.** Top-level `let` cannot be intercepted via `Object.defineProperty(window, ...)` — that trick only works for `var`. Do not attempt it. Each task converts its whole group atomically (design doc, Migration mechanic).
- **4-space indentation; match each file's existing style.** Apply `documents/js-conventions.md` (file banners, four-level comment hierarchy, one-line function comments, generous vertical whitespace, orientation comments before code blocks). When editing an existing line, preserve its surrounding formatting exactly.
- **Field names are preserved verbatim** when moving into the namespace (`selectedTableTimes` → `DE.table.selectedTableTimes`, never `DE.table.selectedTimes`). Dead/write-only globals are migrated, not deleted — the design doc's group table itself lists dead fields (e.g. `indicatorLabel`), so parity beats cleanup here.
- **Line numbers in this plan are from branch HEAD `d986975115`** and shift as tasks land. Locate every edit by the quoted code text (Edit-tool `old_string` discipline), using line numbers only as orientation. After each file's conversion, run the task's residual grep to prove no bare reference survived.
- **This work stays on the current branch (`feature-new-data-explorer-refactor`).** Do **not** update `CLAUDE.md`, any memory note, or `documents/data-explorer-architecture.md` as part of this plan — the design doc explicitly defers all documentation updates until the branch actually merges.
- **Never edit `docs/`** — it is Hugo's generated output.
- **Per-task verification loop (every task):** Hugo rebuild (`hugo --environment dev_stage --cleanDestinationDir --logLevel debug`) must succeed → re-run the characterization script (`node documents/de-characterization.mjs --check`) against the running dev server and require a clean diff → fresh-browser-tab manual golden path for the affected tab(s) (fingerprinted JS is cached aggressively; an old tab will serve stale bundles) → commit. A task is not done until all four pass.

---

## Task numbering

**Task 0 builds the Playwright characterization harness** (the design doc's Verification prerequisite). **Tasks 1–10 map to the design doc's Stages 0–9** — i.e. **Task N implements design-doc Stage N−1**:

| Task | Design stage | Group | Commit subject |
|---|---|---|---|
| 0 | — (verification prerequisite) | characterization harness | `Add Playwright characterization harness for DE namespace refactor` |
| 1 | Stage 0 | rename `state` → `historyState` | `Rename history-comparison global state to historyState` |
| 2 | Stage 1 | `DE.table` | `Move summary-table state into DE.table` |
| 3 | Stage 2 | `DE.disparities` | `Move disparities state into DE.disparities` |
| 4 | Stage 3 | `DE.links` | `Move correlate/links state into DE.links` |
| 5 | Stage 4 | `DE.trend` | `Move trend and comparison-trend state into DE.trend` |
| 6 | Stage 5 | `DE.map` | `Move map state into DE.map` |
| 7 | Stage 6 | `DE.print` | `Move print/export state into DE.print` |
| 8 | Stage 7 | `DE.lookups` | `Move per-indicator lookup tables into DE.lookups` |
| 9 | Stage 8 | `DE.indicator` | `Move active-indicator metadata into DE.indicator` |
| 10 | Stage 9 | `DE.state` | `Move core identity state into DE.state` |

## Field-to-group map and design-doc corrections

This plan was written from a full read of every SPA file plus a per-identifier cross-reference grep. The design doc's staging **order and grouping scheme are followed exactly**; its per-stage *file lists* were approximations and are corrected below from the actual read/write sites. The design doc's own migration mechanic ("each stage converts **every file** that reads or writes a given group's fields") is the controlling rule.

| Group | Fields (names preserved) | Files actually touched (writers **bold**) | Design-doc file-list corrections |
|---|---|---|---|
| `DE.table` | `selectedTableTimes`, `selectedTableGeography`, `tableAreaSearchValue`, `tableTimeFilterIsManual`, `tableGeoFilterIsManual`, `tableNeedsRender`, `tableData` | **table.js**, **measures.js** (renderMeasures defaults + showTable), **data.js** (`tableData =`) | Doc said "table.js only"; measures.js resets/seeds every filter field and data.js writes `tableData` |
| `DE.disparities` | `selectedDisparity`, `selectedDisparityPrimaryMeasureId`, `defaultDisparitiesMetadata`, `disparityData` | **disparities.js**, **data.js** (resets), **measures.js** (toggle + defaults) | Doc said "disparities.js; print.js" — print.js touches none of these (its caption fields are all `DE.print` group) |
| `DE.links` | `selectedLinksMeasure`, `selectedLinksPrimaryMeasureId`, `selectedLinksSecondaryMeasureId`, `selectedLinksAbout`, `selectedLinksSources`, `defaultLinksAbout`†, `defaultLinksSources`†, `defaultPrimaryLinksMeasureMetadata`, `defaultSecondaryMeasureMetadata`, `selectedPrimaryMeasureMetadata`, `selectedSecondaryMeasureMetadata`, `linksData`, `joinedLinksDataObjects` | **data.js**, **measures.js** | Doc said "correlate.js; print.js" — **neither touches any links-group field**: `renderCorrelate` receives everything as parameters (its `primaryIndicatorName`/`secondaryIndicatorName` are parameter names, not the globals) |
| `DE.trend` | `selectedTrendMeasure`†, `selectedTrendMeasureId`†, `showingBoroughTrend`, `showingComparisonTrend`, `selectedTrendAbout`, `selectedTrendSources`, `aqSelectedTrendMetadata`, `defaultTrendMetadata`, `aqDefaultTrendMetadata`†, `defaultTrendAbout`†, `defaultTrendSources`†, `trendData`, `filteredTrendData`, `aqFilteredTrendData`, `selectedComparison`†, `selectedComparisonId`†, `selectedComparisonAbout`, `selectedComparisonSources`, `selectedComparisonMetadata`†, `aqFilteredComparisonData`, `aqFilteredComparisonMetadata` | **data.js**, **measures.js** | Doc said "trend.js; print.js" — **neither touches any trend-group field**: `renderTrendChart` receives data + metadata as parameters (its own globals are `timeTable` → Task 8, `indicatorName` → Task 9, print fields → Task 7) |
| `DE.map` | `mapData`, `filteredMapData`, `selectedMapMeasure`†, `selectedMapTime`†, `selectedMapGeo`†, `selectedMapMetadata`, `selectedMapAbout`†, `selectedMapSources`†, `defaultMapMetadata`, `defaultMapAbout`†, `defaultMapSources`† | **map.js**, **measures.js**, **data.js**, print.js (reads), correlate.js (reads) | Doc said "map.js + bar.js; print.js" — bar.js touches **no** map-group field (`showBar` in measures.js passes `filteredMapData` to `renderBar` as an argument); correlate.js reads `selectedMapMetadata` and was missing |
| `DE.print` | `printSpec`, `vizYear`, `vizGeography`, `vizSource`, `vizSourceSecond`, `chartType`, `CSVforDownload`, `downloadedIndicator`†, `downloadedIndicatorMeasurement`† | **global.js** (downloadData reads), **map.js**, **bar.js**, **trend.js**, **correlate.js**, **disparities.js**, print.js (reads) | Doc listed "map, table, trend, correlate, disparities" — table.js writes **no** print field (its CSV export goes through the DataTables Buttons API); **bar.js was missing** and writes three |
| `DE.lookups` | `geoTable`, `timeTable`, `timeLookup`, `unreliabilityNotes`†, `aqIndicatorData`, `joinedAqData`, `aqMeasureIdTimes`†, `aqMeasureDisplay`, `aqTableTimesGeos`, `aqMapTimesGeos`, `aqTrendTimesGeos`, `mapMeasures`, `trendMeasures`, `linksMeasures`, `disparitiesMeasures`, `measureAbout`†, `measureSources`†, `comparisons`, `indicatorComparisonId`, `comparisonMetadata`, `aqComparisonMetadata`, `aqComparisonIndicatorsMetadata`, `aqComparisonIndicatorData`, `aqCombinedComparisonMetadata` | **data.js**, **measures.js**, menu.js, table.js, trend.js (readers) | Matches the doc's shape; table.js/trend.js are the "renderer readers" made explicit (one `timeLookup` and one `timeTable` read respectively) |
| `DE.indicator` | `indicator`, `indicatorName`, `indicatorDesc`†, `indicatorLabel`†, `indicatorShortName`†, `indicatorMeasures`, `primaryIndicatorName`, `secondaryIndicatorName` | **data.js**, **measures.js**, map.js, bar.js, trend.js, table.js, print.js, disparities.js, global.js (readers) | Matches the doc |
| `DE.state` | `IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, `overlay` | **app.js**, **menu.js**, **topic-indicator-selector.js**, **data.js**, **measures.js**, **de-tab-content.js**, table.js, bar.js, print.js, global.js (readers) | **`assets/js/data-explorer/de-tab-content.js` is missing from the design doc's Stage 9 list.** It writes `overlay = 'none'` at lines 48 and 98 (tab toggle-off and close-button/Escape paths). If it were skipped, those sloppy-mode assignments would silently create `window.overlay` after the `let` is deleted, and pane-close state would stop persisting to the URL. It loads *before* global.js (from `de-tab-content.html`), but both writes are inside DOM event handlers that fire long after `global.js` has executed, so `DE.state.overlay = 'none'` is safe there. |

† Dead or write-only at branch HEAD (declared and possibly assigned, but never read anywhere in the bundle). Migrated as-is for parity — flag them for a possible later cleanup commit, but do not delete them in this refactor.

**Grouping judgment calls made while writing this plan** (all within the design doc's group descriptions, recorded so reviewers don't re-litigate them):
- `measureAbout`/`measureSources` (rebuilt per indicator by `renderMeasures`; currently never read back — global.js's "used by table.js" comment is stale) → `DE.lookups`, matching its writer set (data.js/measures.js).
- `aqIndicatorData`/`joinedAqData` (data.js's intermediate build tables) → `DE.lookups` ("per-indicator rebuilt tables").
- Comparison **lookup tables** (`comparisons`, `indicatorComparisonId`, `comparisonMetadata`, `aqComparisonMetadata`, `aqComparisonIndicatorsMetadata`, `aqComparisonIndicatorData`, `aqCombinedComparisonMetadata`) → `DE.lookups` (the doc's "comparison lookups"); comparison-trend **selection/view state** (`selectedComparison*`, `aqFilteredComparison*`, `showing*Trend`) → `DE.trend` (the doc's "borough/comparison-trend flags").
- Per-view `default*` metadata goes with its view group (`defaultMapMetadata` → `DE.map`, `defaultTrendMetadata` → `DE.trend`, `defaultDisparitiesMetadata` → `DE.disparities`, links defaults → `DE.links`).
- `DE.indicator.indicator` reads doubled-up but is kept — the design doc names the field `indicator`; renaming (e.g. to `record`) would violate "field names preserved" greppability. Note it as future-rename candidate only.

**Shadowing inventory — identifiers that look like migrating globals but are locals/parameters and must NOT be converted:**

| File:line | What it is | Rule |
|---|---|---|
| `data.js:448-468` | `let MeasureID = []`, `let MeasurementType = []`, `let DisplayType = []` — local accumulator arrays inside `joinData`, plus their `.push()` calls and the `aq.table({ MeasureID: MeasureID, ... })` keys | Leave every occurrence in this range untouched in Task 10 |
| `table.js:491-754` | `renderTable = (tableData) => {...}` — the parameter shadows the global; every `tableData` inside `renderTable` is the parameter | Only the *callers* (measures.js:1527) and `syncTableFiltersToMapSelection` (table.js:115, 119) use the global |
| `correlate.js:170-176` | `renderCorrelate(data, primaryMetadata, secondaryMetadata, primaryIndicatorName, secondaryIndicatorName)` — parameters shadow the `DE.indicator` globals throughout correlate.js | correlate.js needs **zero** edits in Task 9 |
| `disparities.js:80` | `const primaryIndicatorName = indicatorName;` — local const on the LHS; only the RHS `indicatorName` converts (Task 9) | |
| `topic-indicator-selector.js:462-498` | `printIndicatorInfo = async (IndicatorID)` — parameter shadows the global inside the function (lines 470, 494) | Untouched in Task 10 |
| `global.js:393, 434-470` | `assignGeoRank = (GeoType)`, `prettifyGeoType = (GeoType)` — parameters named `GeoType` | Untouched in Task 10 |
| arrow params named `indicator` | `data.js:196` (inside `.find()`), `disparities.js:103-104`, `measures.js:274-275, 492-493`, `topic-indicator-selector.js:366, 475` | Callback parameters; only surrounding global reads/writes convert |
| `menu.js:42-64` | `printMenus = async (indicatorID)` (lowercase `i`) and its local `const indicator` | Different identifiers; untouched |
| Arquero/data property keys | `d.MeasureID`, `d.GeoType`, `d.TimePeriodID`, `"MeasureID"` string column names, `measure.MeasureID`, `item.GeoID`, etc. | Object properties and column-name strings are never converted — only bare identifier reads/writes of the globals |

**Residual-grep discipline** (used in every task): after converting a group, run

```powershell
rg -n "\b(field1|field2|...)\b" assets/js/data-explorer/
```

and confirm every hit is either (a) a `DE.<group>.<field>` usage, (b) a documented shadow/parameter from the table above, (c) an object-property or string column name, or (d) a prose comment. Anything else is an unconverted site — fix it before committing.

---

### Task 0: Playwright characterization harness

Builds the one-time characterization script from the design doc's Verification section. It loads the dev server for three representative indicators, exercises every tab, and captures rendered outputs (labels, DataTables row counts, Leaflet layer counts, Vega chart descriptions and mark counts) as JSON — first as a committed baseline, then re-run after every later task as the regression diff.

**Files:**
- Create: `documents/de-characterization.mjs` (the script)
- Create: `documents/de-characterization-baseline/2380.json`, `2414.json`, `2023.json` (generated by the script's `--baseline` mode, committed)
- Modify: `package.json` (add `devDependencies.playwright`; currently the file has **no** `devDependencies` block — dependencies end at line 47 `"vega-lite": "^5.21.0"` followed by `optionalDependencies`), `package-lock.json` (regenerated by npm)
- Modify: `.gitignore` (append the `--check` output directory)

**Interfaces:**
- CLI: `node documents/de-characterization.mjs --baseline` writes `documents/de-characterization-baseline/<id>.json`; `node documents/de-characterization.mjs --check` writes `documents/de-characterization-current/<id>.json` and diffs it against the baseline via `git diff --no-index`, exiting non-zero on any difference. Every later task runs `--check` as its regression gate.
- Captured JSON shape per indicator: `{ target, labels: {measure, geo, time}, map: {interactivePathCount, legendMin, legendMax, legendAria}, bar: {present, ariaLabel, markCount}, trend: {...}, trendComparison: {...}|null, links: {...}, disparities: {...}|null, table: {rowCount, totalRowCount, columnCount, filterSummary}, consoleErrors: [] }`.
- **Hard rule baked into the script: it captures only DOM-rendered outputs and `window`-scoped objects — it must NEVER read the bare `let` globals it is characterizing** (their names change mid-migration, which would make the harness itself a moving target).
- Indicator set: **2380** and **2414** (asthma — both previously used for live Playwright verification of map/bar/trend/table/links/disparities in this repo, per `documents/`-adjacent session notes; 2380 exercises all five views including the poverty-221 disparities comparator) and **2023** (air quality — exercises the `DE_MEASURE_RULES` annual-average trend-slice branch and comparison pills). These live in the `TARGETS` const at the top of the script, each with the topic page that hosts it (`asthma`, `air-quality`) — that is the only place an implementer plugs in a different ID. On the first `--baseline` run, eyeball each JSON: if any of `trend`, `links`, or `disparities` captured `present: false` for **all three** indicators, that view is uncovered — swap in an indicator whose tab is enabled (check the tab button for the `disabled` class in the browser) before committing the baseline.

**Steps:**

- [ ] 1. Install Playwright as a devDependency and its browser binary:
  ```powershell
  npm install --save-dev playwright
  npx playwright install chromium
  ```
  This creates the `devDependencies` block in `package.json`. It must not appear in `dependencies` — nothing in the Hugo build may reference it.

- [ ] 2. Append the check-output directory to `.gitignore` (create the entry at the end of the file):
  ```
  # Playwright characterization --check output (baseline IS committed)
  documents/de-characterization-current/
  ```

- [ ] 3. Write `documents/de-characterization.mjs` with exactly this content:

  ```js
  // ======================================================================= //
  // de-characterization.mjs
  // ======================================================================= //

  // One-time characterization harness for the DE.* state-namespace refactor:
  // captures rendered outputs (selected labels, Leaflet layer counts, Vega chart
  // descriptions + mark counts, DataTables row counts) for a fixed set of
  // indicators, so every migration stage can be diffed against a baseline.
  // Dev-only tooling — not part of the Hugo build or the shipped bundle.
  //
  // IMPORTANT: this script must only read DOM output and window-scoped objects
  // (window.$, window.myVegaView). It must never read the bare `let` globals it
  // characterizes — their names change between stages, and the harness has to
  // stay valid across the whole migration.
  //
  // Usage (dev server must already be running in another terminal):
  //   hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080
  //   node documents/de-characterization.mjs --baseline
  //   node documents/de-characterization.mjs --check

  import { chromium } from 'playwright';
  import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
  import { execSync } from 'node:child_process';

  // ----------------------------------------------------------------------- //
  // configuration
  // ----------------------------------------------------------------------- //

  // Match the address `hugo server` prints ("Web Server is available at ...").
  // dev_stage keeps the /dev-stage/ path segment from its configured baseURL.
  const BASE_URL = 'http://localhost:8080/dev-stage/';

  // Indicators chosen to exercise every view: 2380 (asthma ED visits — map, bar,
  // trend, links, AND disparities via the poverty-221 comparator), 2414 (asthma
  // adult prevalence), 2023 (air quality — annual-average trend slices and
  // comparison pills). Swap entries here if a view comes back uncovered.
  const TARGETS = [
      { id: 2380, topic: 'asthma' },
      { id: 2414, topic: 'asthma' },
      { id: 2023, topic: 'air-quality' }
  ];

  const BASELINE_DIR = 'documents/de-characterization-baseline';
  const CURRENT_DIR = 'documents/de-characterization-current';

  // Console noise that predates this refactor and is not a regression signal
  // (Pagefind dev-asset 404s, resource-load failures from the dev basemap/CDN).
  const KNOWN_NOISE = /pagefind|favicon|Failed to load resource|net::ERR/i;

  // ----------------------------------------------------------------------- //
  // capture helpers
  // ----------------------------------------------------------------------- //

  // Captures a Vega chart's accessible description and rendered mark count.
  const captureVega = (page, containerSelector) => page.evaluate((sel) => {

      const svg = document.querySelector(`${sel} svg`);

      if (!svg) {
          return { present: false, ariaLabel: '', markCount: 0 };
      }

      return {
          present: true,
          ariaLabel: svg.getAttribute('aria-label') || '',
          markCount: document.querySelectorAll(`${sel} svg g[class*="role-mark"] > *`).length
      };

  }, containerSelector);


  // Clicks an overlay tab (skipping disabled ones) and waits for its pane to be ready.
  const clickTabAndWait = async (page, tabSelector, readyPredicate) => {

      const disabled = await page.$eval(tabSelector, el => el.classList.contains('disabled'));

      if (disabled) {
          return false;
      }

      await page.click(tabSelector);
      await page.waitForFunction(readyPredicate, null, { timeout: 60000 });

      // Let Vega/DataTables settle after their async embed/init.
      await page.waitForTimeout(750);

      return true;

  };


  // ----------------------------------------------------------------------- //
  // per-indicator capture
  // ----------------------------------------------------------------------- //

  // Loads one indicator page and walks map → bar → trend → links/disparities → table,
  // capturing rendered output at each step. Table goes last on purpose: it is the
  // heaviest init and mirrors the app's own map-before-table scheduling.
  const captureIndicator = async (browser, target) => {

      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      const consoleErrors = [];

      page.on('pageerror', err => consoleErrors.push(String(err)));
      page.on('console', msg => {
          if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) {
              consoleErrors.push(msg.text());
          }
      });

      const url = `${BASE_URL}data-explorer/${target.topic}/?id=${target.id}`;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // ----- initial load: wait for the choropleth/bubble layer to paint ----- //

      await page.waitForFunction(
          () => document.querySelectorAll('#map .leaflet-overlay-pane path.leaflet-interactive').length > 0,
          null,
          { timeout: 60000 }
      );
      await page.waitForTimeout(750);

      const labels = await page.evaluate(() => ({
          measure: document.querySelector('.measure-name')?.textContent.trim() || '',
          geo: document.querySelector('.geo-name')?.textContent.trim() || '',
          time: document.querySelector('.time-name')?.textContent.trim() || ''
      }));

      const map = await page.evaluate(() => ({
          interactivePathCount: document.querySelectorAll('#map .leaflet-overlay-pane path.leaflet-interactive').length,
          legendMin: document.getElementById('minVal')?.textContent.trim() || '',
          legendMax: document.getElementById('maxVal')?.textContent.trim() || '',
          legendAria: document.getElementById('viridisRect')?.getAttribute('aria-label') || ''
      }));

      // ----- bar tab ----- //

      let bar = { present: false, ariaLabel: '', markCount: 0 };

      if (await clickTabAndWait(page, '#v-pills-bar-tab', () => !!document.querySelector('#barHolder svg'))) {
          bar = await captureVega(page, '#barHolder');
      }

      // ----- trend tab (borough mode, then first comparison pill if any) ----- //

      let trend = { present: false, ariaLabel: '', markCount: 0, notes: '' };
      let trendComparison = null;

      const trendReady = () => !!document.querySelector('#trend svg')
          || /not available/i.test(document.getElementById('trend')?.textContent || '');

      if (await clickTabAndWait(page, '#v-pills-trends-tab', trendReady)) {

          trend = {
              ...(await captureVega(page, '#trend')),
              notes: await page.evaluate(() => document.getElementById('trend-unreliability')?.textContent.trim() || '')
          };

          const comparisonPill = await page.evaluate(() => {
              const pill = document.querySelector('#trendComparisonPills .trendmode-button');
              return pill && !pill.classList.contains('disabled') ? pill.textContent.trim() : null;
          });

          if (comparisonPill) {
              await page.click('#trendComparisonPills .trendmode-button');
              await page.waitForTimeout(2000);
              trendComparison = {
                  pillLabel: comparisonPill,
                  ...(await captureVega(page, '#trend'))
              };
          }

      }

      // ----- links tab (correlate, then disparities if the toggle is enabled) ----- //

      let links = { present: false, ariaLabel: '', markCount: 0, viewNote: '' };
      let disparities = null;

      const linksReady = () => !!document.querySelector('#links svg') || !!document.querySelector('#links .alert');

      if (await clickTabAndWait(page, '#v-pills-correlate-tab', linksReady)) {

          links = {
              ...(await captureVega(page, '#links')),
              viewNote: await page.evaluate(() => document.getElementById('linksViewNote')?.textContent.trim() || '')
          };

          const disparitiesEnabled = await page.evaluate(() => {
              const btn = document.getElementById('show-disparities');
              return !!btn && !btn.disabled && !btn.classList.contains('disabled') && !btn.classList.contains('active');
          });

          if (disparitiesEnabled) {

              await page.click('#show-disparities');

              // The disparities description always ends "and poverty scatterplot";
              // fall through on timeout so both baseline and check settle identically.
              try {
                  await page.waitForFunction(
                      () => (document.querySelector('#links svg')?.getAttribute('aria-label') || '').includes('poverty scatterplot'),
                      null,
                      { timeout: 20000 }
                  );
              } catch {
                  // aria-label may be absent; capture whatever rendered after the wait
              }

              await page.waitForTimeout(750);
              disparities = await captureVega(page, '#links');

          }

      }

      // ----- table tab (last: heaviest init) ----- //

      let table = { present: false, rowCount: 0, totalRowCount: 0, columnCount: 0, filterSummary: '' };

      // NOTE the lowercase `dataTable` — $.fn.dataTable.isDataTable, per CLAUDE.md.
      const tableReady = () => window.$ && window.$.fn && window.$.fn.dataTable
          && window.$.fn.dataTable.isDataTable('#tableID');

      if (await clickTabAndWait(page, '#v-pills-table-tab', tableReady)) {
          table = await page.evaluate(() => {
              const dt = window.$('#tableID').DataTable();
              return {
                  present: true,
                  rowCount: dt.rows({ search: 'applied' }).count(),
                  totalRowCount: dt.rows().count(),
                  columnCount: dt.columns().count(),
                  filterSummary: document.getElementById('tableFilterSummary')?.textContent.trim() || ''
              };
          });
      }

      await page.close();

      return {
          target,
          labels,
          map,
          bar,
          trend,
          trendComparison,
          links,
          disparities,
          table,
          consoleErrors
      };

  };


  // ----------------------------------------------------------------------- //
  // main
  // ----------------------------------------------------------------------- //

  // Captures every target into the mode's output directory; --check then diffs
  // against the committed baseline and fails the process on any difference.
  const main = async () => {

      const mode = process.argv.includes('--baseline') ? 'baseline' : 'check';
      const outDir = mode === 'baseline' ? BASELINE_DIR : CURRENT_DIR;

      rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });

      const browser = await chromium.launch({ headless: true });

      for (const target of TARGETS) {
          console.log(`Capturing indicator ${target.id} (${target.topic}) ...`);
          const result = await captureIndicator(browser, target);
          writeFileSync(`${outDir}/${target.id}.json`, JSON.stringify(result, null, 4) + '\n');
      }

      await browser.close();

      if (mode === 'check') {
          try {
              execSync(`git diff --no-index --exit-code ${BASELINE_DIR} ${CURRENT_DIR}`, { stdio: 'inherit' });
              console.log('\nCharacterization check PASSED — output matches baseline.');
          } catch {
              console.error('\nCharacterization check FAILED — differences shown above.');
              process.exitCode = 1;
          }
      } else {
          console.log(`\nBaseline written to ${BASELINE_DIR}/ — commit it.`);
      }

  };

  main();
  ```

- [ ] 4. Start the dev server in a separate terminal and leave it running for the rest of the migration (it live-rebuilds fingerprinted assets on every file save):
  ```powershell
  hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080
  ```
  Confirm the printed "Web Server is available at" address matches `BASE_URL` in the script (expected: `http://localhost:8080/dev-stage/`); if it differs, fix the `BASE_URL` const. Note the script needs network access to `raw.githubusercontent.com` (the `data_repo` the SPA fetches from).

- [ ] 5. Capture the baseline: `node documents/de-characterization.mjs --baseline`. Open each of the three JSONs and sanity-check: `labels.measure` is a real measurement-type string, `map.interactivePathCount` > 0, `bar.present`/`trend.present`/`links.present`/`table.present` true, `disparities` non-null for at least one indicator (expected: 2380 and 2414), `trendComparison` non-null for at least one (expected: 2023), and `consoleErrors` empty. If a view is uncovered across all three indicators, swap a `TARGETS` entry per the Interfaces note and re-run.

- [ ] 6. Prove determinism before trusting the harness: run `node documents/de-characterization.mjs --check` immediately, with no code changes. It must PASS. If any field flaps between runs (a count or label differs), the settle waits are too short for this machine — lengthen the relevant `waitForTimeout`/predicate in the script and re-capture the baseline until back-to-back runs are identical. Do not proceed until check-against-self passes twice in a row.

- [ ] 7. Note for later tasks (record in the commit body): the SPA fetches live data from the `nychealth/EHDP-data` repo (`data_repo`/`data_branch` in Hugo config). If a later task's `--check` diff shows changed *values* (row counts, legend numbers) with **zero** code cause, suspect an upstream data change: re-run `--check` on the previous commit (`git stash` the work first) — if it fails there too, the delta is data-caused; re-capture the baseline (`--baseline`), commit it separately with an explanatory message, and re-run the task's check.

- [ ] 8. Commit `documents/de-characterization.mjs`, `documents/de-characterization-baseline/*.json`, `package.json`, `package-lock.json`, and `.gitignore` with message: `Add Playwright characterization harness for DE namespace refactor`.

---

### Task 1: Rename `state` → `historyState` (design Stage 0)

Frees the `state` name for `DE.state` later. Trivial, near-zero-risk: one declaration, two read sites. Known pre-existing quirk preserved on purpose: the variable is never assigned anywhere in the bundle, so it is always `undefined`, and since `undefined === null` is `false`, both `state === null` half-conditions have always evaluated false — the checks are effectively driven by `window.history.state === null` alone. **Do not fix that here** (design doc, Explicitly excluded).

**Files:**
- Modify: `assets/js/data-explorer/global.js` (lines 163–164)
- Modify: `assets/js/data-explorer/data.js` (lines 246, 248)

**Interfaces:** After this task the bundle has a bare global `historyState` (still never assigned, still compared against `window.history.state` in `loadIndicator`), and **no** bare identifier named `state`. No later task touches `historyState` — it stays a bare global permanently (design doc, Explicitly excluded).

**Steps:**

- [ ] 1. In `global.js`, replace lines 163–164:
  ```js
  // Compared against window.history.state in data.js to detect first-load vs. popstate navigation.
  let state;
  ```
  with:
  ```js
  // Compared against window.history.state in data.js to detect first-load vs. popstate
  // navigation. Renamed from `state` so that bare name stays free for DE.state.
  let historyState;
  ```

- [ ] 2. In `data.js` line 246, replace:
  ```js
      if (!dont_add_to_history && (window.history.state === null || state === null || window.history.state.id != IndicatorID)) {
  ```
  with:
  ```js
      if (!dont_add_to_history && (window.history.state === null || historyState === null || window.history.state.id != IndicatorID)) {
  ```

- [ ] 3. In `data.js` line 248, replace:
  ```js
          if (window.history.state === null || state === null) {
  ```
  with:
  ```js
          if (window.history.state === null || historyState === null) {
  ```

- [ ] 4. Residual grep: `rg -n "\bstate\b" assets/js/data-explorer/*.js` — every remaining hit must be `window.history.state`, a prose comment, or part of a longer identifier that `\b` excluded anyway. Zero bare `state` reads/writes remain.

- [ ] 5. Rebuild: `hugo --environment dev_stage --cleanDestinationDir --logLevel debug` — must succeed.

- [ ] 6. Characterization: `node documents/de-characterization.mjs --check` — must PASS.

- [ ] 7. Fresh-tab manual check of the exact code path touched (history writes in `loadIndicator`): open `http://localhost:8080/dev-stage/data-explorer/asthma/?id=2380`, use Change dataset to pick a different asthma indicator (e.g. 2414), press the browser Back button (should return to 2380 with menus restored), then Forward. No console errors.

- [ ] 8. Commit `global.js` + `data.js` with message: `Rename history-comparison global state to historyState`.

---

### Task 2: `DE.table` (design Stage 1)

Narrowest real group; proves the pattern. Introduces the `DE` namespace object itself.

**Files:**
- Modify: `assets/js/data-explorer/global.js` (declare `DE` with the `table` sub-object; delete lines 13–19 and line 39)
- Modify: `assets/js/data-explorer/table.js` (~48 sites, lines 39–502)
- Modify: `assets/js/data-explorer/measures.js` (lines 429–481, 1526–1532)
- Modify: `assets/js/data-explorer/data.js` (line 539)

**Interfaces:** Produces `DE.table` with exactly these properties (initializers preserved from the old `let`s): `DE.table.selectedTableTimes` (`[]`), `DE.table.selectedTableGeography` (`[]`), `DE.table.tableAreaSearchValue` (`''`), `DE.table.tableTimeFilterIsManual` (`false`), `DE.table.tableGeoFilterIsManual` (`false`), `DE.table.tableNeedsRender` (`false`), `DE.table.tableData` (`undefined`). Writers after this task: table.js (filter handlers), measures.js (`renderMeasures` seeds defaults, `showTable` reads), data.js (`joinData` writes `tableData`). No later task renames any of these. Later tasks 8 and 10 will re-edit some of the *same lines* for their own fields (noted below) — convert only this task's fields now.

**Steps:**

- [ ] 1. In `global.js`, replace lines 13–19:
  ```js
  // Summary-table filter state persists across redraws until a new indicator resets it.
  let selectedTableTimes = [];
  let selectedTableGeography = [];
  let tableAreaSearchValue = '';
  let tableTimeFilterIsManual = false;
  let tableGeoFilterIsManual = false;
  let tableNeedsRender = false;
  ```
  with the namespace declaration (this is the one-time `DE` introduction; every later task appends its sub-object inside this literal):
  ```js
  // Grouped namespace for shared explorer state. Each sub-object is introduced by the
  // migration stage that converts its concern (see
  // documents/data-explorer-state-namespace-design-2026-07-10.md). Render closures,
  // tab refs, DOM element caches, and the static lookup constants below stay bare
  // by design — they are module seams, not churning state.
  const DE = {

      // Summary-table state: filter selections and manual-override flags persist across
      // redraws until a new indicator resets them; tableData holds the joined rows.
      table: {
          selectedTableTimes: [],
          selectedTableGeography: [],
          tableAreaSearchValue: '',
          tableTimeFilterIsManual: false,
          tableGeoFilterIsManual: false,
          tableNeedsRender: false,
          tableData: undefined
      }

  };
  ```

- [ ] 2. Still in `global.js`, delete the `tableData` declaration at line 39 (`let tableData;`) from the "These plain-object arrays feed the currently active visualizations." group — the comment and the `mapData`/`trendData`/`linksData`/`joinedLinksDataObjects`/`disparityData` lines under it stay for now (they migrate in Tasks 3–6).

- [ ] 3. Convert `table.js` — every bare occurrence below becomes `DE.table.<sameName>`:
  - `selectedTableTimes` at lines 39, 59, 62, 64, 124, 125, 128 (write), 163, 165, 167, 168, 169, 354, 355, 359, 366 (write + RHS read), 371, 423, 424, 433 (write), 464
  - `selectedTableGeography` at lines 40, 65, 67, 69, 137, 138, 141 (write), 171, 173, 175, 176, 177, 367 (write + RHS), 372 (write + RHS), 378, 379 (write), 445, 450, 451 (`.push`), 454 (write + RHS), 458 (write + RHS), 464 is times-only — not geography
  - `tableAreaSearchValue` at lines 221, 222, 230 (write), 237, 250 (write)
  - `tableTimeFilterIsManual` at lines 123, 132 (write), 179, 434 (write)
  - `tableGeoFilterIsManual` at lines 136, 145 (write), 179, 378, 459 (write)
  - `tableNeedsRender` at line 502 (write)
  - `tableData` (the **global**) at lines 115 (×2) and 119 only — inside `syncTableFiltersToMapSelection`
  - **Do NOT touch** `renderTable`'s parameter `tableData` (line 491) or any `tableData` use inside `renderTable` (lines 506, 508, 513, 521, 600) — those are the parameter.

  Two worked examples so the mechanical pattern is unambiguous. Line 379 (note `GeoType` stays bare until Task 10):
  ```js
              selectedTableGeography = [GeoType && dataGeos.includes(GeoType) ? GeoType : dataGeos[0]];
  ```
  becomes:
  ```js
              DE.table.selectedTableGeography = [GeoType && dataGeos.includes(GeoType) ? GeoType : dataGeos[0]];
  ```
  Line 458:
  ```js
              selectedTableGeography = availableGeos.filter(geo => selectedTableGeography.includes(geo));
  ```
  becomes:
  ```js
              DE.table.selectedTableGeography = availableGeos.filter(geo => DE.table.selectedTableGeography.includes(geo));
  ```

- [ ] 4. Convert `measures.js`:
  - Lines 429–430 (`renderMeasures` reset):
    ```js
      selectedTableTimes = [];
      selectedTableGeography = [];
    ```
    →
    ```js
      DE.table.selectedTableTimes = [];
      DE.table.selectedTableGeography = [];
    ```
  - Lines 454, 456, 458: `selectedTableTimes = [...]` writes → `DE.table.selectedTableTimes = [...]` (the `timeLookup[TimePeriodID]` read on line 451 stays bare — Tasks 8/10).
  - Lines 472, 474, 476: `selectedTableGeography = [...]` writes → `DE.table.selectedTableGeography` (`GeoType` on 471–472 stays bare — Task 10).
  - Lines 479–481:
    ```js
      tableTimeFilterIsManual = false;
      tableGeoFilterIsManual = false;
      tableNeedsRender = true;
    ```
    →
    ```js
      DE.table.tableTimeFilterIsManual = false;
      DE.table.tableGeoFilterIsManual = false;
      DE.table.tableNeedsRender = true;
    ```
  - Lines 1526–1532 (`showTable`): `tableData` ×5 and `tableNeedsRender` ×1. Line 1526–1527:
    ```js
          if (tableData && (!tableContainer.querySelector('table') || tableNeedsRender)) {
              renderTable(tableData);
    ```
    →
    ```js
          if (DE.table.tableData && (!tableContainer.querySelector('table') || DE.table.tableNeedsRender)) {
              renderTable(DE.table.tableData);
    ```
    and lines 1529, 1531, 1532 similarly (`tableData` → `DE.table.tableData` as the guard and both call arguments).

- [ ] 5. Convert `data.js` line 539: `tableData = joinedAqData` → `DE.table.tableData = joinedAqData` (the RHS `joinedAqData` stays bare until Task 8).

- [ ] 6. Residual grep:
  ```powershell
  rg -n "\b(selectedTableTimes|selectedTableGeography|tableAreaSearchValue|tableTimeFilterIsManual|tableGeoFilterIsManual|tableNeedsRender|tableData)\b" assets/js/data-explorer/
  ```
  Expected residuals only: `DE.table.*` usages, `renderTable`'s `tableData` parameter and its in-function uses (table.js 491–600), and prose comments (e.g. table.js:114, data.js:537/553). Anything else = missed site.

- [ ] 7. Rebuild: `hugo --environment dev_stage --cleanDestinationDir --logLevel debug`.

- [ ] 8. Characterization: `node documents/de-characterization.mjs --check` — must PASS (the table capture — row count, filter summary — is the sharp edge here).

- [ ] 9. Fresh-tab manual golden path (table): open `http://localhost:8080/dev-stage/data-explorer/asthma/?id=2380`, click the **Table** tab → grouped rows render; uncheck one time-period checkbox → rows narrow and the filter summary reads "Custom"; type a neighborhood into "Find a neighborhood:" → Area column filters; click **Sync to map** → summary returns to "Synced"; click a time group header → group collapses/expands; change the map Geography dropdown → table geo filter follows. No console errors.

- [ ] 10. Commit `global.js`, `table.js`, `measures.js`, `data.js` with message: `Move summary-table state into DE.table`.

---

### Task 3: `DE.disparities` (design Stage 2)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 45, 75, 85, 93)
- Modify: `assets/js/data-explorer/disparities.js` (lines 119–158, 244)
- Modify: `assets/js/data-explorer/data.js` (lines 220, 228)
- Modify: `assets/js/data-explorer/measures.js` (lines 144, 246, 339, 371, 1172, 1187, 1275–1276, 1347, 1819)

**Interfaces:** Produces `DE.disparities` with: `selectedDisparity` (`undefined`), `selectedDisparityPrimaryMeasureId` (`undefined`), `defaultDisparitiesMetadata` (`undefined`), `disparityData` (`undefined`). Writers: disparities.js (render caches), data.js (per-indicator resets), measures.js (toggle handlers + default). Note `print.js` is **not** touched (design-doc file-list correction — its "caption fields" are `DE.print`, Task 7).

**Steps:**

- [ ] 1. In `global.js`, append the sub-object inside the `DE` literal — after the closing `}` of `table:` add a comma and:
  ```js
      // Disparities-view state: the toggle flag, the primary measure the joined
      // poverty-comparison rows were built for, and the cached rows themselves.
      disparities: {
          selectedDisparity: undefined,
          selectedDisparityPrimaryMeasureId: undefined,
          defaultDisparitiesMetadata: undefined,
          disparityData: undefined
      }
  ```

- [ ] 2. In `global.js`, delete the four bare declarations: line 45 `let disparityData; // used by disparities.js`, line 75 `let defaultDisparitiesMetadata;`, line 85 `let selectedDisparity;`, line 93 `let selectedDisparityPrimaryMeasureId;`.

- [ ] 3. Convert `disparities.js`:
  - Lines 119–121 (staleness check):
    ```js
      const needsFreshDisparityData = !Array.isArray(disparityData)
          || !disparityData.length
          || Number(selectedDisparityPrimaryMeasureId) !== Number(primaryMeasureId);
    ```
    →
    ```js
      const needsFreshDisparityData = !Array.isArray(DE.disparities.disparityData)
          || !DE.disparities.disparityData.length
          || Number(DE.disparities.selectedDisparityPrimaryMeasureId) !== Number(primaryMeasureId);
    ```
  - Lines 143–144: `disparityData = aqDisparityData.objects();` → `DE.disparities.disparityData = ...`; `selectedDisparityPrimaryMeasureId = Number(primaryMeasureId);` → `DE.disparities.selectedDisparityPrimaryMeasureId = ...`
  - Line 148 debug: `debugLog("disparityData [renderDisparitiesChart]", disparityData);` → second arg `DE.disparities.disparityData`
  - Line 152: `selectedDisparity = true;` → `DE.disparities.selectedDisparity = true;`
  - Lines 154–156, 158 (×2): `disparityData[0]?...` / `disparityData.map(...)` reads → `DE.disparities.disparityData`
  - Line 244 (Vega spec): `"values": disparityData` → `"values": DE.disparities.disparityData`
  - Line 103–104's `indicator` arrow param is a shadow — untouched (see inventory).

- [ ] 4. Convert `data.js` lines 220 and 228 (in `loadIndicator`'s reset block): `selectedDisparity = false;` → `DE.disparities.selectedDisparity = false;` and `selectedDisparityPrimaryMeasureId = null;` → `DE.disparities.selectedDisparityPrimaryMeasureId = null;`.

- [ ] 5. Convert `measures.js`:
  - Line 144: `defaultDisparitiesMetadata = buildDefaultMetadataArray(visArray);` → `DE.disparities.defaultDisparitiesMetadata = ...`
  - Line 246: `const defaultPrimaryMeasureId = defaultDisparitiesMetadata?.[0]?.MeasureID;` → `... = DE.disparities.defaultDisparitiesMetadata?.[0]?.MeasureID;`
  - Lines 339, 371, 1347, 1819: `selectedDisparity = <bool>;` writes → `DE.disparities.selectedDisparity = <bool>;`
  - Lines 1172 (`&& selectedDisparity`), 1187 (`&& !selectedDisparity`): reads → `DE.disparities.selectedDisparity`
  - Lines 1275–1276:
    ```js
              if (selectedDisparity !== nextDisparityState) {
                  selectedDisparity = nextDisparityState;
    ```
    →
    ```js
              if (DE.disparities.selectedDisparity !== nextDisparityState) {
                  DE.disparities.selectedDisparity = nextDisparityState;
    ```

- [ ] 6. Residual grep: `rg -n "\b(selectedDisparity|selectedDisparityPrimaryMeasureId|defaultDisparitiesMetadata|disparityData)\b" assets/js/data-explorer/` — only `DE.disparities.*` and comments may remain.

- [ ] 7. Rebuild; `--check` must PASS (the 2380/2414 `disparities` capture covers this exact path, including seeded jitter determinism).

- [ ] 8. Fresh-tab manual golden path: `.../asthma/?id=2380` → **Correlations** tab → click the **Disparities** pill → poverty scatterplot renders with jittered points grouped Low→Very high; hover a point → tooltip shows geography, value, poverty category; About/Sources shows both the asthma measure and "Poverty" blocks; click **Download data** → CSV downloads. Switch back to the Measures (links) pill and back to Disparities — the chart re-renders without refetching (staleness check exercises `selectedDisparityPrimaryMeasureId`).

- [ ] 9. Commit `global.js`, `disparities.js`, `data.js`, `measures.js` with message: `Move disparities state into DE.disparities`.

---

### Task 4: `DE.links` (design Stage 3)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 42, 44, 73, 74, 76, 77, 84, 91, 92, 108, 109, 110, 111)
- Modify: `assets/js/data-explorer/data.js` (lines 219, 226, 227, 585, 679)
- Modify: `assets/js/data-explorer/measures.js` (lines 122, 128, 131, 232, 326–328, 338, 340–341, 356–358, 370, 372–373, 1162–1163, 1171, 1186, 1262–1280, 1346, 1348–1349, 1384–1387, 1399–1401, 1409, 1418–1423, 1425, 1429, 1435, 1438–1440, 1459, 1820–1821)

**Interfaces:** Produces `DE.links` with: `selectedLinksMeasure` (`undefined`), `selectedLinksPrimaryMeasureId` (`undefined`), `selectedLinksSecondaryMeasureId` (`undefined`), `selectedLinksAbout` (`undefined`), `selectedLinksSources` (`[]`), `defaultLinksAbout` (`undefined`, dead), `defaultLinksSources` (`[]`, dead), `defaultPrimaryLinksMeasureMetadata` (`undefined`), `defaultSecondaryMeasureMetadata` (`undefined`), `selectedPrimaryMeasureMetadata` (`undefined`), `selectedSecondaryMeasureMetadata` (`undefined`), `linksData` (`undefined`), `joinedLinksDataObjects` (`undefined`). `correlate.js` and `print.js` need **zero** edits (file-list correction — see Field-to-group table). `renderSelectedDisparities` (measures.js:1459) writes `selectedPrimaryMeasureMetadata` too — it is still a links-group field.

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `disparities: { ... }`:
  ```js
      // Correlate/links-view state: manual selection flag + measure-pair IDs, the
      // joined scatter rows, per-pair metadata, and the About/Sources text blocks.
      links: {
          selectedLinksMeasure: undefined,
          selectedLinksPrimaryMeasureId: undefined,
          selectedLinksSecondaryMeasureId: undefined,
          selectedLinksAbout: undefined,
          selectedLinksSources: [],
          defaultLinksAbout: undefined,
          defaultLinksSources: [],
          defaultPrimaryLinksMeasureMetadata: undefined,
          defaultSecondaryMeasureMetadata: undefined,
          selectedPrimaryMeasureMetadata: undefined,
          selectedSecondaryMeasureMetadata: undefined,
          linksData: undefined,
          joinedLinksDataObjects: undefined
      }
  ```

- [ ] 2. In `global.js`, delete these declarations (keeping their group comments where other fields remain under them): line 42 `let linksData;`, line 44 `let joinedLinksDataObjects;` (and its line-43 comment `// joined primary + secondary measure data for the correlate/links chart` moves into the namespace — delete it here), lines 73–74 (`defaultPrimaryLinksMeasureMetadata`, `defaultSecondaryMeasureMetadata`), lines 76–77 (`defaultLinksAbout`, `defaultLinksSources`), line 84 (`selectedLinksMeasure`), lines 91–92 (`selectedLinksPrimaryMeasureId`, `selectedLinksSecondaryMeasureId`), lines 108–111 (`selectedLinksAbout`, `selectedLinksSources`, `selectedPrimaryMeasureMetadata`, `selectedSecondaryMeasureMetadata`).

- [ ] 3. Convert `data.js`:
  - Lines 219, 226, 227 (reset block): `selectedLinksMeasure = false;` / `selectedLinksPrimaryMeasureId = null;` / `selectedLinksSecondaryMeasureId = null;` → `DE.links.<name> = ...`
  - Line 585: `linksData = joinedAqData` → `DE.links.linksData = joinedAqData`
  - Line 679: `const filteredPrimaryMeasureData = linksData` → `... = DE.links.linksData`

- [ ] 4. Convert `measures.js` (all `DE.links.<sameName>`):
  - 122 `defaultPrimaryLinksMeasureMetadata = defaultArray;` (write); 232 read
  - 128 `defaultSecondaryMeasureMetadata = ...` (write)
  - 131 `joinedLinksDataObjects = defaultLinksDataMetadata.data` (write); 1384–1385 reads; 1401 write; 1438 call argument
  - 326–328 / 356–358 (both read `selectedLinksPrimaryMeasureId` twice); 340, 372, 1348, 1820 writes; 1162, 1263–1264 read+write pair:
    ```js
              if (selectedLinksPrimaryMeasureId !== syncedLinksState.primaryMeasureId) {
                  selectedLinksPrimaryMeasureId = syncedLinksState.primaryMeasureId;
    ```
    →
    ```js
              if (DE.links.selectedLinksPrimaryMeasureId !== syncedLinksState.primaryMeasureId) {
                  DE.links.selectedLinksPrimaryMeasureId = syncedLinksState.primaryMeasureId;
    ```
  - 341, 373, 1349, 1821 `selectedLinksSecondaryMeasureId` writes; 1163, 1268–1269 read+write
  - 338, 370, 1346 `selectedLinksMeasure = true;`; 1280 `selectedLinksMeasure = false;`; 1171, 1186, 1262 reads
  - 1386–1387 reads (`Number(selectedPrimaryMeasureMetadata?.[0]?.MeasureID)` etc.); 1399–1400 writes; 1409 reads ×2; 1418–1423 reads ×6; 1439–1440 call arguments; 1459 write (`selectedPrimaryMeasureMetadata = primaryMeasureMetadata;`)
  - 1425 `selectedLinksAbout =` (multi-line template assignment) and 1429 `selectedLinksSources =`; 1435 `renderAboutSources(selectedLinksAbout, selectedLinksSources);` → `renderAboutSources(DE.links.selectedLinksAbout, DE.links.selectedLinksSources);`

- [ ] 5. Residual grep:
  ```powershell
  rg -n "\b(selectedLinksMeasure|selectedLinksPrimaryMeasureId|selectedLinksSecondaryMeasureId|selectedLinksAbout|selectedLinksSources|defaultLinksAbout|defaultLinksSources|defaultPrimaryLinksMeasureMetadata|defaultSecondaryMeasureMetadata|selectedPrimaryMeasureMetadata|selectedSecondaryMeasureMetadata|linksData|joinedLinksDataObjects)\b" assets/js/data-explorer/
  ```
  Only `DE.links.*`, comments (e.g. data.js:580/590/823), and nothing in correlate.js/print.js besides comments.

- [ ] 6. Rebuild; `--check` must PASS.

- [ ] 7. Fresh-tab manual golden path (links): `.../asthma/?id=2380` → **Correlations** tab → default correlate scatter renders with regression line; open the **Measures** dropdown → pick a different linked measure → chart, About, and Sources update; change the map Measure dropdown → links selection re-syncs (correlate re-renders for the new primary); toggle to Disparities and back to Measures (the Task-3 + Task-4 interplay: `clickLinksToggle` writes both groups). No console errors.

- [ ] 8. Commit `global.js`, `data.js`, `measures.js` with message: `Move correlate/links state into DE.links`.

---

### Task 5: `DE.trend` (design Stage 4)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 41, 66–69, 83, 86–90, 100–102, 104–106, 115–118)
- Modify: `assets/js/data-explorer/data.js` (lines 218, 221–225, 570)
- Modify: `assets/js/data-explorer/measures.js` (lines 96, 680, 851, 882, 941–942, 992–993, 1612, 1637, 1644, 1650–1653, 1657, 1665–1677, 1683, 1685–1686, 1705, 1718–1728, 1732, 1736, 1746–1747, 1757–1758, 1761–1762)

**Interfaces:** Produces `DE.trend` with: `selectedTrendMeasure` (`undefined`, write-only), `selectedTrendMeasureId` (`undefined`, write-only), `showingBoroughTrend` (`undefined`), `showingComparisonTrend` (`undefined`), `selectedTrendAbout` (`undefined`), `selectedTrendSources` (`undefined`), `aqSelectedTrendMetadata` (`undefined`), `defaultTrendMetadata` (`undefined`), `aqDefaultTrendMetadata` (`undefined`, dead), `defaultTrendAbout` (`undefined`, dead), `defaultTrendSources` (`[]`, dead), `trendData` (`undefined`), `filteredTrendData` (`undefined`), `aqFilteredTrendData` (`undefined`), `selectedComparison` (`undefined`, write-only), `selectedComparisonId` (`undefined`, write-only), `selectedComparisonAbout` (`""`), `selectedComparisonSources` (`[]`), `selectedComparisonMetadata` (`undefined`, dead), `aqFilteredComparisonData` (`undefined`), `aqFilteredComparisonMetadata` (`undefined`). `trend.js` and `print.js` need **zero** edits (file-list correction). The comparison **lookup** tables (`comparisonMetadata`, `aqComparisonMetadata`, `aqComparisonIndicatorsMetadata`, `aqComparisonIndicatorData`, `aqCombinedComparisonMetadata`) are **not** in this group — they stay bare until Task 8 (`DE.lookups`), so lines that mix both (e.g. measures.js:1732) get only their trend-group side converted now.

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `links: { ... }`:
  ```js
      // Trend-view state: borough vs comparison mode flags, resolved metadata and
      // About/Sources text for the active mode, and the filtered chart data slices.
      trend: {
          selectedTrendMeasure: undefined,
          selectedTrendMeasureId: undefined,
          showingBoroughTrend: undefined,
          showingComparisonTrend: undefined,
          selectedTrendAbout: undefined,
          selectedTrendSources: undefined,
          aqSelectedTrendMetadata: undefined,
          defaultTrendMetadata: undefined,
          aqDefaultTrendMetadata: undefined,
          defaultTrendAbout: undefined,
          defaultTrendSources: [],
          trendData: undefined,
          filteredTrendData: undefined,
          aqFilteredTrendData: undefined,
          selectedComparison: undefined,
          selectedComparisonId: undefined,
          selectedComparisonAbout: "",
          selectedComparisonSources: [],
          selectedComparisonMetadata: undefined,
          aqFilteredComparisonData: undefined,
          aqFilteredComparisonMetadata: undefined
      }
  ```

- [ ] 2. In `global.js`, delete: line 41 `let trendData;`; lines 66–69 (`defaultTrendMetadata`, `aqDefaultTrendMetadata`, `defaultTrendAbout`, `defaultTrendSources = [];`); line 83 (`selectedTrendMeasure`); lines 86–90 (`selectedComparison`, `showingBoroughTrend`, `showingComparisonTrend`, `selectedTrendMeasureId`, `selectedComparisonId`); lines 100–102 (`selectedTrendAbout`, `selectedTrendSources`, `aqSelectedTrendMetadata`); lines 104–106 (`selectedComparisonAbout = "";`, `selectedComparisonSources = [];`, `selectedComparisonMetadata`); lines 115–118 (`filteredTrendData`, `aqFilteredTrendData`, `aqFilteredComparisonData`, `aqFilteredComparisonMetadata`). The "Per-view default metadata..." comment (line 65) and "Filtered slices..." comment (line 113) stay while map fields remain under them.

- [ ] 3. Convert `data.js`:
  - Reset block lines 218, 221–225: `selectedTrendMeasure = false;`, `selectedComparison = false;`, `showingBoroughTrend = false;`, `showingComparisonTrend = false;`, `selectedTrendMeasureId = null;`, `selectedComparisonId = null;` → each `DE.trend.<name> = ...` (lines 219–220 and 226–228 were already converted in Tasks 3–4 — the reset block is deliberately edited by four different tasks, one group at a time).
  - Line 570: `trendData = joinedAqData` → `DE.trend.trendData = joinedAqData`.

- [ ] 4. Convert `measures.js`:
  - 96: `defaultTrendMetadata = buildDefaultMetadataArray(visArray);` → `DE.trend.defaultTrendMetadata = ...`; 680 and 1637 reads.
  - 851, 882: `(showingComparisonTrend && comparisonMetadata?.length)` → `(DE.trend.showingComparisonTrend && comparisonMetadata?.length)` (`comparisonMetadata` stays bare — Task 8).
  - 941–942, 992–993, 1685–1686, 1761–1762: paired mode-flag writes, e.g.:
    ```js
                  showingComparisonTrend = false;
                  showingBoroughTrend = true;
    ```
    →
    ```js
                  DE.trend.showingComparisonTrend = false;
                  DE.trend.showingBoroughTrend = true;
    ```
  - 1612: convert only `showingComparisonTrend` (the `trendMeasures`/`comparisonMetadata` reads stay bare — Task 8).
  - 1644: `aqSelectedTrendMetadata = aq.from(resolvedTrendMetadata)` → `DE.trend.aqSelectedTrendMetadata = ...`
  - 1650–1651 writes; 1653 `renderAboutSources(DE.trend.selectedTrendAbout, DE.trend.selectedTrendSources);`
  - 1657: `filteredTrendData = trendData` → `DE.trend.filteredTrendData = DE.trend.trendData` (both fields this group)
  - 1665–1677: three `aqFilteredTrendData = aq.from(...)` writes and the `filteredTrendData.filter(...)` / `aq.from(filteredTrendData)` reads inside them → `DE.trend.*`
  - 1683: `renderTrendChart(DE.trend.aqFilteredTrendData, DE.trend.aqSelectedTrendMetadata);`
  - 1705: `showingComparisonTrend = false;` → `DE.trend.showingComparisonTrend = false;`
  - 1718–1719 resets; 1722 `selectedComparisonAbout +=` → `DE.trend.selectedComparisonAbout +=`; 1723 `.push` on `DE.trend.selectedComparisonSources`; 1726 `DE.trend.selectedComparisonSources = [...new Set(DE.trend.selectedComparisonSources)];`; 1728 `renderAboutSources(DE.trend.selectedComparisonAbout, DE.trend.selectedComparisonSources);`
  - 1732: `aqFilteredComparisonMetadata = aqComparisonMetadata` → `DE.trend.aqFilteredComparisonMetadata = aqComparisonMetadata` (RHS stays bare — Task 8)
  - 1736: `aqFilteredComparisonData = aqFilteredComparisonMetadata` → both sides `DE.trend.*`
  - 1746: `if (aqFilteredComparisonMetadata.array("MeasureID")...` → `DE.trend.aqFilteredComparisonMetadata`
  - 1747: `aqFilteredComparisonData = aqFilteredComparisonData` → both sides `DE.trend.*`
  - 1757–1758: `renderTrendChart(DE.trend.aqFilteredComparisonData, DE.trend.aqFilteredComparisonMetadata);`

- [ ] 5. Residual grep:
  ```powershell
  rg -n "\b(trendData|filteredTrendData|aqFilteredTrendData|defaultTrendMetadata|aqDefaultTrendMetadata|defaultTrendAbout|defaultTrendSources|selectedTrendMeasure|selectedTrendMeasureId|showingBoroughTrend|showingComparisonTrend|selectedTrendAbout|selectedTrendSources|aqSelectedTrendMetadata|selectedComparison|selectedComparisonId|selectedComparisonAbout|selectedComparisonSources|selectedComparisonMetadata|aqFilteredComparisonData|aqFilteredComparisonMetadata)\b" assets/js/data-explorer/
  ```
  Only `DE.trend.*`, comments, and measures.js's **local** `selectedComparisonLegendTitle` (line 537 — a `renderMeasures` closure local, not a global; `\b` on the listed names will not match it, but don't "fix" it if noticed).

- [ ] 6. Rebuild; `--check` must PASS (2023's `trendComparison` capture covers the comparison-pill path; 2380's `trend.notes` covers borough mode).

- [ ] 7. Fresh-tab manual golden path (trend): `.../air-quality/?id=2023` → **Trends** tab → borough trend renders with staggered end-of-line labels (BX/Bklyn/MN/NYC/Qns/SI); click a comparison pill → comparison chart renders and About/Sources rebuilds; click **Geography** pill → borough mode returns. Then `.../asthma/?id=2380` → Trends renders; change map Measure → trend re-syncs. No console errors.

- [ ] 8. Commit `global.js`, `data.js`, `measures.js` with message: `Move trend and comparison-trend state into DE.trend`.

---

### Task 6: `DE.map` (design Stage 5)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 40, 70–72, 80–82, 96–98, 114)
- Modify: `assets/js/data-explorer/data.js` (lines 215–217, 557)
- Modify: `assets/js/data-explorer/measures.js` (lines 80, 182, 1564, 1568, 1574, 1579, 1595, 1599)
- Modify: `assets/js/data-explorer/map.js` (lines 532, 776)
- Modify: `assets/js/data-explorer/correlate.js` (line 94)
- Modify: `assets/js/data-explorer/print.js` (lines 340, 361, 390, 716, 756)

**Interfaces:** Produces `DE.map` with: `mapData` (`undefined`), `filteredMapData` (`undefined`), `selectedMapMeasure` (`undefined`, write-only), `selectedMapTime` (`undefined`, write-only), `selectedMapGeo` (`undefined`, write-only), `selectedMapMetadata` (`undefined`), `selectedMapAbout` (`undefined`, dead), `selectedMapSources` (`undefined`, dead), `defaultMapMetadata` (`undefined`), `defaultMapAbout` (`undefined`, dead), `defaultMapSources` (`undefined`, dead). The `showBar`-depends-on-`showMap` coupling (CLAUDE.md gotcha) now reads as `DE.map.filteredMapData` written by `showMap` (measures.js:1568) and passed to `renderBar` (measures.js:1599) — **bar.js itself is untouched** (it receives the slice as its `data` parameter). print.js's export path reads `DE.map.filteredMapData` directly (lines 716, 756).

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `trend: { ... }`:
  ```js
      // Map-view state: the joined map rows, the filtered slice showMap hands to the
      // bar chart and print export, dropdown-selection flags, and measure metadata.
      map: {
          mapData: undefined,
          filteredMapData: undefined,
          selectedMapMeasure: undefined,
          selectedMapTime: undefined,
          selectedMapGeo: undefined,
          selectedMapMetadata: undefined,
          selectedMapAbout: undefined,
          selectedMapSources: undefined,
          defaultMapMetadata: undefined,
          defaultMapAbout: undefined,
          defaultMapSources: undefined
      }
  ```

- [ ] 2. In `global.js`, delete: line 40 `let mapData;`; lines 70–72 (`defaultMapMetadata`, `defaultMapAbout`, `defaultMapSources`); lines 80–82 (`selectedMapMeasure`, `selectedMapTime`, `selectedMapGeo`); lines 96–98 (`selectedMapAbout`, `selectedMapSources`, `selectedMapMetadata`); line 114 (`filteredMapData`). After this task the line-38 comment covers only `linksData`… which is already gone — reconcile leftover group comments: the "These plain-object arrays feed the currently active visualizations." comment now has no declarations under it and is deleted; same check for "Per-view default metadata..." (still covers nothing → delete) and "Current per-tab selections..." / "About/sources/metadata..." / "Filtered slices..." comments (delete each once its last declaration is gone).

- [ ] 3. Convert `data.js`: lines 215–217 (`selectedMapMeasure = false;` etc.) → `DE.map.<name> = false;`; line 557 `mapData = joinedAqData` → `DE.map.mapData = joinedAqData`.

- [ ] 4. Convert `measures.js`:
  - 80: `defaultMapMetadata = buildDefaultMetadataArray(visArray);` → `DE.map.defaultMapMetadata = ...`
  - 182: `return getMeasureMetadataById(MeasureID)[0] || selectedMapMetadata || null;` → `... || DE.map.selectedMapMetadata || null;` (`MeasureID` stays bare — Task 10)
  - 1564 and 1595: `if (!metadata.length) metadata = defaultMapMetadata;` → `... = DE.map.defaultMapMetadata;`
  - 1568 (`showMap`): `filteredMapData = mapData.filter(obj =>` → `DE.map.filteredMapData = DE.map.mapData.filter(obj =>` (the `obj.MeasureID == MeasureID` etc. comparisons keep bare RHS globals until Task 10)
  - 1574: `debugLog("filteredMapData:", filteredMapData.length, "rows",` → `DE.map.filteredMapData.length`
  - 1579: `return renderMap(filteredMapData, metadata);` → `return renderMap(DE.map.filteredMapData, metadata);`
  - 1599: `renderBar(filteredMapData, metadata, GeoType);` → `renderBar(DE.map.filteredMapData, metadata, GeoType);` (`GeoType` → Task 10)

- [ ] 5. Convert `map.js` lines 532 and 776: `selectedMapMetadata = metadata[0] || null;` → `DE.map.selectedMapMetadata = metadata[0] || null;` (the neighboring `vizYear`/`vizGeography`/`vizSource`/`chartType` lines stay bare — Task 7).

- [ ] 6. Convert `correlate.js` line 94: both optional-chain reads → `DE.map.selectedMapMetadata?.MeasurementType || DE.map.selectedMapMetadata?.MeasureName`.

- [ ] 7. Convert `print.js`: lines 340, 361, 390 `selectedMapMetadata?.MeasurementType` → `DE.map.selectedMapMetadata?.MeasurementType`; line 716 `getMapStats(filteredMapData || [])` → `getMapStats(DE.map.filteredMapData || [])`; line 756 `filteredMapData.forEach(item => {` → `DE.map.filteredMapData.forEach(item => {`.

- [ ] 8. Residual grep:
  ```powershell
  rg -n "\b(mapData|filteredMapData|selectedMapMeasure|selectedMapTime|selectedMapGeo|selectedMapMetadata|selectedMapAbout|selectedMapSources|defaultMapMetadata|defaultMapAbout|defaultMapSources)\b" assets/js/data-explorer/
  ```
  Only `DE.map.*` and comments (measures.js:1584 comment, data.js:555/565, CLAUDE-quoted comments).

- [ ] 9. Rebuild; `--check` must PASS.

- [ ] 10. Fresh-tab manual golden path (map + bar **together** — the CLAUDE.md coupling gotcha): `.../asthma/?id=2380` → map paints; open **Bar chart** tab → ranked bars render from the same slice; hover a map polygon → matching bar outlines (linked highlight) and legend hover text updates; hover a bar → map polygon highlights; change Geography dropdown → map and bar both re-render; change Measure to a "Number"-type measure → bubble map renders with circle markers and the bar keeps working; open **Save map** → PNG preview composites (print.js reads `DE.map.filteredMapData`). No console errors.

- [ ] 11. Commit `global.js`, `data.js`, `measures.js`, `map.js`, `correlate.js`, `print.js` with message: `Move map state into DE.map`.

---

### Task 7: `DE.print` (design Stage 6)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 149–152 and 154–161; convert in-file reads at lines 590–591, 619)
- Modify: `assets/js/data-explorer/map.js` (lines 530–531, 533–534, 774–775, 777–778)
- Modify: `assets/js/data-explorer/bar.js` (lines 521–523)
- Modify: `assets/js/data-explorer/trend.js` (lines 669–671, 679)
- Modify: `assets/js/data-explorer/correlate.js` (lines 75, 159–162, 580–583, 612)
- Modify: `assets/js/data-explorer/disparities.js` (lines 364–367, 397)
- Modify: `assets/js/data-explorer/print.js` (lines 282, 300, 341–342, 362–363, 374–377, 1311)

**Interfaces:** Produces `DE.print` with: `printSpec` (`{}` — preserve the object initializer), `vizYear` (`undefined`), `vizGeography` (`undefined`), `vizSource` (`undefined`), `vizSourceSecond` (`undefined`), `chartType` (`undefined`), `CSVforDownload` (`undefined`), `downloadedIndicator` (`undefined`, dead), `downloadedIndicatorMeasurement` (`undefined`, dead). Every renderer *writes* these after rendering; print.js and global.js's `downloadData`/`getCurrentDataDownloadView` *read* them. table.js is **not** touched (no print fields — file-list correction); bar.js **is** (was missing from the doc's list).

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `map: { ... }`:
  ```js
      // Print/export state: the current view's Vega spec, caption fields, and chart
      // type — set by each tab renderer, read back by print.js and downloadData().
      print: {
          printSpec: {},
          vizYear: undefined,
          vizGeography: undefined,
          vizSource: undefined,
          vizSourceSecond: undefined,
          chartType: undefined,
          CSVforDownload: undefined,
          downloadedIndicator: undefined,
          downloadedIndicatorMeasurement: undefined
      }
  ```

- [ ] 2. In `global.js`, delete lines 149–152 (comment + `CSVforDownload`, `downloadedIndicator`, `downloadedIndicatorMeasurement`) and lines 154–161 (the two-line print-spec comment + `printSpec = {};`, `vizYear`, `vizGeography`, `vizSource`, `vizSourceSecond`, `chartType`).

- [ ] 3. Convert `global.js`'s own reads:
  - Lines 590–591 in `getCurrentDataDownloadView`:
    ```js
      if (chartType) {
          return chartType === 'bubble-map' ? 'map' : chartType;
    ```
    →
    ```js
      if (DE.print.chartType) {
          return DE.print.chartType === 'bubble-map' ? 'map' : DE.print.chartType;
    ```
    (the `overlay` reads at 594/598/602 stay bare — Task 10)
  - Line 619 in `downloadData`: `encodeURIComponent(CSVforDownload)` → `encodeURIComponent(DE.print.CSVforDownload)` (`indicatorName` on line 627 stays bare — Task 9).

- [ ] 4. Convert the renderer write blocks (mechanical; each is a contiguous "send info for printing" block):
  - `map.js` 530–534 → (532 already `DE.map.selectedMapMetadata` from Task 6):
    ```js
      vizYear = mapTime;
      vizGeography = mapGeoType;
      DE.map.selectedMapMetadata = metadata[0] || null;
      vizSource = metadata[0]?.Sources;
      chartType = 'map';
    ```
    →
    ```js
      DE.print.vizYear = mapTime;
      DE.print.vizGeography = mapGeoType;
      DE.map.selectedMapMetadata = metadata[0] || null;
      DE.print.vizSource = metadata[0]?.Sources;
      DE.print.chartType = 'map';
    ```
    and the same at 774–778 (with `chartType = 'bubble-map'`).
  - `bar.js` 521–523: `printSpec = vegaSpec;` / `vizSource = metadata[0]?.Sources;` / `chartType = 'bar';` → `DE.print.*`.
  - `trend.js` 669–671: `vizSource = metadataObjects[0].Sources;` / `printSpec = compspec2;` / `chartType = 'trend';` → `DE.print.*`; 679 `CSVforDownload = downloadTable.toCSV();` → `DE.print.CSVforDownload = ...`.
  - `correlate.js` 75 (`if (chartType !== 'links')` → `DE.print.chartType`), 159–162 (`printSpec = null;` / `CSVforDownload = '';` / `vizSource = null;` / `vizSourceSecond = null;`), 580–583, 612 → `DE.print.*`.
  - `disparities.js` 364–367 (`printSpec = disparitiesSpec;` / `vizSource = primaryMetadata[0]?.Sources;` / `vizSourceSecond = disparityMetadata[0].Sources;` / `chartType = 'disparities';`), 397 → `DE.print.*`.

- [ ] 5. Convert `print.js` reads: 282 `switch (chartType)` → `switch (DE.print.chartType)`; 300 `clonePrintSpec(printSpec)` → `clonePrintSpec(DE.print.printSpec)`; 341–342 and 362–363 (`vizGeography`, `vizYear` in the filename/subtitle arrays) → `DE.print.vizGeography` / `DE.print.vizYear`; 374–377:
  ```js
      if (Array.isArray(vizSource)) {
          sourceValues.push(...vizSource.filter(Boolean));
      } else if (typeof vizSource === 'string' && vizSource.trim()) {
          sourceValues.push(vizSource.trim());
  ```
  →
  ```js
      if (Array.isArray(DE.print.vizSource)) {
          sourceValues.push(...DE.print.vizSource.filter(Boolean));
      } else if (typeof DE.print.vizSource === 'string' && DE.print.vizSource.trim()) {
          sourceValues.push(DE.print.vizSource.trim());
  ```
  and 1311 `trackDataExplorerPrintView(chartType || overlay || 'chart');` → `trackDataExplorerPrintView(DE.print.chartType || overlay || 'chart');` (`overlay` → Task 10).

- [ ] 6. Residual grep:
  ```powershell
  rg -n "\b(printSpec|vizYear|vizGeography|vizSource|vizSourceSecond|chartType|CSVforDownload|downloadedIndicator|downloadedIndicatorMeasurement)\b" assets/js/data-explorer/
  ```
  Only `DE.print.*`, comments (global.js:154-era comment now gone; global.js:587/610/613 comments fine), and bar.js's **local** `chartType`-free zone — note bar.js line 105 declares a *local* `let displayType;` and map.js lines 18–19 declare module-level `isPercent`/`displayType`: different identifiers, untouched.

- [ ] 7. Rebuild; `--check` must PASS.

- [ ] 8. Fresh-tab manual golden path (print/export across all four chart types): `.../asthma/?id=2380` → Bar tab → **Save chart** → Vega preview renders in modal with PNG/SVG menu; **Download data** → CSV named "...(bar view).csv"; Trends tab → Save chart → trend preview + footnotes; Correlations tab → Save chart (correlate) and again after toggling Disparities; back on the map, **Save map** → PNG preview + Download PNG (filename includes measurement type, geography, year). No console errors.

- [ ] 9. Commit `global.js`, `map.js`, `bar.js`, `trend.js`, `correlate.js`, `disparities.js`, `print.js` with message: `Move print/export state into DE.print`.

---

### Task 8: `DE.lookups` (design Stage 7)

The widest mid-migration group: everything rebuilt per indicator load.

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 25–26, 28–36, 57–63, 119, 121–125, 127–131)
- Modify: `assets/js/data-explorer/data.js` (lines 19, 26, 38, 40–44, 50, 52, 54–57, 63, 77, 85–86, 90–94, 110, 114–115, 128, 146, 200, 275, 279, 306, 349, 371, 375, 378–379, 431, 464, 504–506, 523, 525, 528, 539–540, 542, 557, 560, 570, 573, 585, 745, 748, 754)
- Modify: `assets/js/data-explorer/measures.js` (lines 215, 238, 252, 322, 352, 434–437, 441–442, 448, 451, 466, 501–502, 509–512, 516–517, 524–526, 530, 674, 686, 694, 698, 709, 717, 725, 729, 770, 774, 793, 851–852, 881–883, 917, 927, 962, 964, 1053, 1110, 1121, 1213, 1238–1239, 1561, 1593, 1612, 1614, 1636, 1703–1704, 1714, 1732, 1734, 1738–1739, 1798, 1804, 1810, 1840, 1848, 1851, 1860)
- Modify: `assets/js/data-explorer/menu.js` (lines 22, 144)
- Modify: `assets/js/data-explorer/table.js` (line 79)
- Modify: `assets/js/data-explorer/trend.js` (line 338)

**Interfaces:** Produces `DE.lookups` with (initializers preserved): `geoTable` (`undefined`), `timeTable` (`undefined`), `timeLookup` (`{}`), `unreliabilityNotes` (`undefined`, dead), `aqIndicatorData` (`undefined`), `joinedAqData` (`undefined`), `aqMeasureIdTimes` (`undefined`, dead), `aqMeasureDisplay` (`undefined`), `aqTableTimesGeos` (`undefined`), `aqMapTimesGeos` (`undefined`), `aqTrendTimesGeos` (`undefined`), `mapMeasures` (`[]`), `trendMeasures` (`[]`), `linksMeasures` (`[]`), `disparitiesMeasures` (`[]`), `measureAbout` (`` ` ` `` empty string), `measureSources` (`` ` ` `` empty string — yes, the old initializer is a string even though measures.js:442 immediately makes it an array; preserve the odd initializer), `comparisons` (`undefined`), `indicatorComparisonId` (`undefined`), `comparisonMetadata` (`undefined`), `aqComparisonMetadata` (`undefined`), `aqComparisonIndicatorsMetadata` (`undefined`), `aqComparisonIndicatorData` (`undefined`), `aqCombinedComparisonMetadata` (`undefined`). Semantics note: `typeof DE.lookups.comparisonMetadata === 'undefined'` (measures.js:1851) still evaluates exactly as before, because an `undefined`-valued property gives `typeof` `'undefined'`.

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `print: { ... }`:
  ```js
      // Per-indicator lookup tables, rebuilt on each indicator load: geo/time joins,
      // per-view times-geos tables, per-tab measure arrays, accumulated About/Sources
      // text, and the comparison-trend metadata pipeline.
      lookups: {
          geoTable: undefined,
          timeTable: undefined,
          timeLookup: {},
          unreliabilityNotes: undefined,
          aqIndicatorData: undefined,
          joinedAqData: undefined,
          aqMeasureIdTimes: undefined,
          aqMeasureDisplay: undefined,
          aqTableTimesGeos: undefined,
          aqMapTimesGeos: undefined,
          aqTrendTimesGeos: undefined,
          mapMeasures: [],
          trendMeasures: [],
          linksMeasures: [],
          disparitiesMeasures: [],
          measureAbout: ``,
          measureSources: ``,
          comparisons: undefined,
          indicatorComparisonId: undefined,
          comparisonMetadata: undefined,
          aqComparisonMetadata: undefined,
          aqComparisonIndicatorsMetadata: undefined,
          aqComparisonIndicatorData: undefined,
          aqCombinedComparisonMetadata: undefined
      }
  ```

- [ ] 2. In `global.js`, delete: lines 25–26 (`measureAbout`, `measureSources` — keep lines 21–23, the DOM-cache comment + `aboutMeasures`/`dataSources`, which are excluded); lines 28–36 (lookup comment + `geoTable`, `timeTable`, timeLookup comment, `timeLookup = {};`, `unreliabilityNotes`, `aqIndicatorData`, `joinedAqData`, `aqMeasureIdTimes`); lines 57–63 (comparison comment + `indicatorComparisonId`, `comparisons`, `comparisonMetadata`, `aqComparisonMetadata`, `aqComparisonIndicatorsMetadata`, `aqComparisonIndicatorData`); line 119 (`aqCombinedComparisonMetadata` — last survivor of the "Filtered slices" group; delete its comment too if now empty); lines 121–125 (joined-tables comment + `aqMeasureDisplay`, `aqTableTimesGeos`, `aqMapTimesGeos`, `aqTrendTimesGeos`); lines 127–131 (measure-arrays comment + the four `= []` declarations).

- [ ] 3. Convert `data.js` — all sites become `DE.lookups.<sameName>`:
  - 19 `comparisons =` write; 26 `createComparisonData(comparisons || [])` read
  - 38 `if (!Array.isArray(indicatorComparisonId) || indicatorComparisonId.length === 0)`; 50 `comparisonMetadata = comps.filter(d => indicatorComparisonId.includes(d.ComparisonID));`; 52 `if (!comparisonMetadata.length)`; 200 `indicatorComparisonId = Array.isArray(indicator?.Comparisons) ? ... : ...;` (the `indicator` reads stay bare — Task 9); 275 `comparisonMetadata = [];`; 279 `if (indicatorComparisonId.length > 0)`
  - 40–44 and 54–57: the two undefined-reset blocks (`comparisonMetadata = [];` / `aqComparisonMetadata = undefined;` / `aqComparisonIndicatorsMetadata = undefined;` / `aqCombinedComparisonMetadata = undefined;` / `aqComparisonIndicatorData = undefined;`)
  - 63 `aqComparisonMetadata = aq.from(comparisonMetadata)`; 77 `const aqUniqueIndicatorMeasure = aqComparisonMetadata`; 85–86 `.array(...)` reads; 94 `aqComparisonIndicatorsMetadata = aq.from(...)`; 114–115 `aqCombinedComparisonMetadata = aqComparisonMetadata .join(aqComparisonIndicatorsMetadata, ...)`; 128 semijoin read; 146 `aqComparisonIndicatorData = ...`
  - 306 `aqIndicatorData = aq.table(data)`; 349 `geoTable = await data;`; 371 `timeTable = await data;`; 375 `timeLookup = {};`; 378 `timeTable.objects().forEach(...)`; 379 `timeLookup[t.TimePeriodID] = t;`; 431 `.join_left(timeTable, "TimePeriodID")`; 464 `aqMeasureDisplay =`; 504–506 the three `combineTimesGeos` assignments; 523 `joinedAqData = aqIndicatorData`; 525 `.join_left(geoTable, ...)`; 528 `.join(timeTable, "TimePeriodID")`; 539/557/570/585 RHS `joinedAqData` reads (LHS already converted in Tasks 2/6/5/4 respectively — `tableData`→Task 2, `mapData`→Task 6, `trendData`→Task 5, `linksData`→Task 4 — e.g. line 539 is now `DE.table.tableData = DE.lookups.joinedAqData`); 540 `.join_left(aqMeasureDisplay, "MeasureID")`; 542/560/573 the three `.semijoin(aq*TimesGeos, ...)` reads; 745 `.join(geoTable, ...)`; 748 stays (property read `d.GeoType`); 754 `timeTable` join read.

- [ ] 4. Convert `measures.js` — high-traffic sites, all `DE.lookups.<sameName>`:
  - Measure arrays: 434–437 resets (`mapMeasures = [];` etc.); 509–512 pushes; 524–526, 530 call args; reads at 215, 238, 252, 322, 352, 674, 686, 793, 852, 883, 917, 927, 1053, 1110, 1121, 1213, 1238–1239, 1561, 1593, 1612, 1614, 1636, 1704, 1798, 1804, 1810, 1840, 1848, 1851, 1860. Worked example, line 501–502 (mixed with `aq.escape` property reads that stay):
    ```js
          const map         = aqMapTimesGeos   && aqMapTimesGeos.filter(aq.escape(d => d.MeasureID === measure.MeasureID)).numRows() > 0;
          const trend       = aqTrendTimesGeos && aqTrendTimesGeos.filter(aq.escape(d => d.MeasureID === measure.MeasureID)).numRows() > 0;
    ```
    →
    ```js
          const map         = DE.lookups.aqMapTimesGeos   && DE.lookups.aqMapTimesGeos.filter(aq.escape(d => d.MeasureID === measure.MeasureID)).numRows() > 0;
          const trend       = DE.lookups.aqTrendTimesGeos && DE.lookups.aqTrendTimesGeos.filter(aq.escape(d => d.MeasureID === measure.MeasureID)).numRows() > 0;
    ```
  - About/sources accumulators: 441–442 resets; 516–517 (`measureAbout += ...`, `measureSources.push(...)`).
  - Table-defaults reads: 448 and 466 `aqTableTimesGeos.array(...)`; 451 `timeLookup[TimePeriodID]` → `DE.lookups.timeLookup[TimePeriodID]` (`TimePeriodID` stays bare — Task 10).
  - Comparison metadata: 694, 698, 709, 717, 851–852, 881–882, 962, 1612, 1851 `comparisonMetadata` reads — including 1851's `typeof comparisonMetadata === 'undefined'` → `typeof DE.lookups.comparisonMetadata === 'undefined'` (see Interfaces note); 725, 729, 770, 774, 964, 1714 `aqCombinedComparisonMetadata` reads; 1703 `if (comparisonId == null || !aqComparisonMetadata || !aqComparisonIndicatorData)`; 1732 RHS `aqComparisonMetadata` (LHS was Task 5); 1734 `.join(aqComparisonIndicatorsMetadata, ...)`; 1738 `.join(aqComparisonIndicatorData, ...)`; 1739 `.join(timeTable, ...)`.

- [ ] 5. Convert the single-site readers: `menu.js` 22 `return timeLookup[id]?.TimePeriod || id;` and 144 `const tp = timeLookup[id];` → `DE.lookups.timeLookup[id]`; `table.js` 79 `const currentTime = timeLookup[TimePeriodID]?.TimePeriod;` → `DE.lookups.timeLookup[TimePeriodID]`; `trend.js` 338 `? timeTable.filter(aq.escape(d => d.TimePeriod == compNoCompare)).array("end_period")[0]` → `DE.lookups.timeTable.filter(...)`.

- [ ] 6. Residual grep (split into two for readability):
  ```powershell
  rg -n "\b(geoTable|timeTable|timeLookup|unreliabilityNotes|aqIndicatorData|joinedAqData|aqMeasureIdTimes|aqMeasureDisplay|aqTableTimesGeos|aqMapTimesGeos|aqTrendTimesGeos|measureAbout|measureSources)\b" assets/js/data-explorer/
  rg -n "\b(mapMeasures|trendMeasures|linksMeasures|disparitiesMeasures|comparisons|indicatorComparisonId|comparisonMetadata|aqComparisonMetadata|aqComparisonIndicatorsMetadata|aqComparisonIndicatorData|aqCombinedComparisonMetadata)\b" assets/js/data-explorer/
  ```
  Only `DE.lookups.*` and comments. Watch for data.js:379's `timeLookup[t.TimePeriodID]` (bracket write — easy to miss) and topic-indicator-selector.js:687 (comment only).

- [ ] 7. Rebuild; `--check` must PASS (this task can break *everything* if a site is missed — the harness's three-indicator × five-view sweep is the point).

- [ ] 8. Fresh-tab manual golden path (menus + tab gating): `.../asthma/?id=2380` → all three dropdowns populated with correct labels; change Measure → Geo/Time menus cascade-rebuild; use Change dataset to load 2414 → menus rebuild, tabs enable/disable per data availability; go to `.../air-quality/?id=2023` → comparison pills present (comparison lookups pipeline); Trends and Table still render. No console errors.

- [ ] 9. Commit `global.js`, `data.js`, `measures.js`, `menu.js`, `table.js`, `trend.js` with message: `Move per-indicator lookup tables into DE.lookups`.

---

### Task 9: `DE.indicator` (design Stage 8)

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 47–55; convert line 627)
- Modify: `assets/js/data-explorer/data.js` (lines 196–203, 453, 487, 616)
- Modify: `assets/js/data-explorer/measures.js` (lines 158, 162, 497, 1415–1416, 1426–1431, 1441–1442, 1646)
- Modify: `assets/js/data-explorer/map.js` (lines 155, 179)
- Modify: `assets/js/data-explorer/bar.js` (line 454)
- Modify: `assets/js/data-explorer/trend.js` (lines 218, 676)
- Modify: `assets/js/data-explorer/table.js` (line 641)
- Modify: `assets/js/data-explorer/print.js` (lines 339, 353)
- Modify: `assets/js/data-explorer/disparities.js` (line 80)

**Interfaces:** Produces `DE.indicator` with: `indicator` (`undefined` — yes, `DE.indicator.indicator`; the doubled name is kept for grep parity, flag as future-rename candidate only), `indicatorName` (`undefined`), `indicatorDesc` (`undefined`, write-only), `indicatorLabel` (`undefined`, fully dead), `indicatorShortName` (`undefined`, write-only), `indicatorMeasures` (`undefined`), `primaryIndicatorName` (`undefined`), `secondaryIndicatorName` (`undefined`). Writers: data.js (`loadIndicator`), measures.js (`renderSelectedCorrelate` sets primary/secondary names). **correlate.js needs zero edits** — its `primaryIndicatorName`/`secondaryIndicatorName` are `renderCorrelate` parameters (shadow inventory).

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `lookups: { ... }`:
  ```js
      // Active-indicator metadata, promoted here by loadIndicator so every view can
      // read it. primary/secondary names serve the correlate About/Sources blocks.
      indicator: {
          indicator: undefined,
          indicatorName: undefined,
          indicatorDesc: undefined,
          indicatorLabel: undefined,
          indicatorShortName: undefined,
          indicatorMeasures: undefined,
          primaryIndicatorName: undefined,
          secondaryIndicatorName: undefined
      }
  ```

- [ ] 2. In `global.js`, delete lines 47–55 (the "Active indicator metadata is promoted to globals..." comment plus the eight `let` declarations `indicator` through `secondaryIndicatorName`). Convert line 627 in `downloadData`:
  ```js
          hiddenElement.download = 'NYC EH Data Portal - '  + indicatorName + ` (${view} view)` + '.csv',
  ```
  →
  ```js
          hiddenElement.download = 'NYC EH Data Portal - '  + DE.indicator.indicatorName + ` (${view} view)` + '.csv',
  ```
  (preserve the double space after the first string and the trailing comma — both are in the original.)

- [ ] 3. Convert `data.js` lines 196–203 (`loadIndicator`'s metadata block). Full before/after because it mixes globals, optional chains, and an arrow-param shadow:
  ```js
      indicator = indicators.find(indicator => indicator.IndicatorID == IndicatorID);
      indicatorName = indicator?.IndicatorName ? indicator.IndicatorName : '';
      indicatorDesc = indicator?.IndicatorDescription ? indicator.IndicatorDescription : '';
      indicatorShortName = indicator?.IndicatorShortname ? indicator.IndicatorShortname : indicatorName;
      indicatorComparisonId = Array.isArray(indicator?.Comparisons)
          ? indicator.Comparisons
          : (indicator?.Comparisons ? [indicator.Comparisons] : []);
      indicatorMeasures = indicator?.Measures;
  ```
  becomes (arrow param `indicator` untouched; `indicators` is topic-indicator-selector.js's own module global, untouched; `IndicatorID` stays bare — Task 10; `indicatorComparisonId` already `DE.lookups.` from Task 8):
  ```js
      DE.indicator.indicator = indicators.find(indicator => indicator.IndicatorID == IndicatorID);
      DE.indicator.indicatorName = DE.indicator.indicator?.IndicatorName ? DE.indicator.indicator.IndicatorName : '';
      DE.indicator.indicatorDesc = DE.indicator.indicator?.IndicatorDescription ? DE.indicator.indicator.IndicatorDescription : '';
      DE.indicator.indicatorShortName = DE.indicator.indicator?.IndicatorShortname ? DE.indicator.indicator.IndicatorShortname : DE.indicator.indicatorName;
      DE.lookups.indicatorComparisonId = Array.isArray(DE.indicator.indicator?.Comparisons)
          ? DE.indicator.indicator.Comparisons
          : (DE.indicator.indicator?.Comparisons ? [DE.indicator.indicator.Comparisons] : []);
      DE.indicator.indicatorMeasures = DE.indicator.indicator?.Measures;
  ```
  Then lines 453, 487, 616: `indicatorMeasures.forEach(` / `.filter(` → `DE.indicator.indicatorMeasures.*`.

- [ ] 4. Convert `measures.js`: 158 `if (!indicatorMeasures?.length || measureId == null)` and 162 `return indicatorMeasures.filter(...)` and 497 `indicatorMeasures.forEach(measure => {` → `DE.indicator.indicatorMeasures`; 1415–1416:
  ```js
          primaryIndicatorName = indicatorName;
          secondaryIndicatorName = linksSecondaryIndicator[0]?.IndicatorName;
  ```
  →
  ```js
          DE.indicator.primaryIndicatorName = DE.indicator.indicatorName;
          DE.indicator.secondaryIndicatorName = linksSecondaryIndicator[0]?.IndicatorName;
  ```
  1426–1427 and 1430–1431 template-literal reads (`${primaryIndicatorName}` / `${secondaryIndicatorName}`) → `${DE.indicator.primaryIndicatorName}` / `${DE.indicator.secondaryIndicatorName}`; 1441–1442 the `renderCorrelate(...)` call arguments → `DE.indicator.primaryIndicatorName, DE.indicator.secondaryIndicatorName` (the *parameters* inside correlate.js keep their bare names); 1646 `IndicatorLabel: aq.escape(indicatorName),` → `aq.escape(DE.indicator.indicatorName)`. The `indicator` arrow params at 274–275 and 492–493 stay.

- [ ] 5. Convert the readers: `map.js` 155 and 179 `${indicator.IndicatorName}` → `${DE.indicator.indicator.IndicatorName}`; `bar.js` 454 `` `Bar chart of ${indicatorName}: ...` `` → `${DE.indicator.indicatorName}`; `trend.js` 218 `plotTitle = indicatorName;` and 676 `aq.escape(`${indicatorName}: ...`)` → `DE.indicator.indicatorName`; `table.js` 641 `filename: 'NYC EH Data Portal - ' + indicatorName + " (filtered)"` → `+ DE.indicator.indicatorName +`; `print.js` 339 and 353 `indicatorName || document.querySelector('.indicator-name')?.textContent` → `DE.indicator.indicatorName || ...`; `disparities.js` 80 `const primaryIndicatorName = indicatorName;` → `const primaryIndicatorName = DE.indicator.indicatorName;` (LHS local stays).

- [ ] 6. Residual grep:
  ```powershell
  rg -n "\b(indicatorName|indicatorDesc|indicatorLabel|indicatorShortName|indicatorMeasures|primaryIndicatorName|secondaryIndicatorName)\b" assets/js/data-explorer/
  rg -n "\bindicator\b" assets/js/data-explorer/ | rg -v "DE\.indicator|=>|\bconst indicator\b|//|\* "
  ```
  Allowed residuals: `DE.indicator.*`; correlate.js's parameters and their uses (lines 174–175, 317–320, 343–346); disparities.js's local `primaryIndicatorName` uses (80, 173, 177, 192, 194, 394); arrow params named `indicator` (shadow inventory); topic-indicator-selector.js's locals (366, 475); comments.

- [ ] 7. Rebuild; `--check` must PASS (bar/trend/links/disparities `ariaLabel` captures embed the indicator name — a missed site shows up as a literally different chart description or a ReferenceError in `consoleErrors`).

- [ ] 8. Fresh-tab manual golden path (identity surfaces): `.../asthma/?id=2380` → page title block shows the indicator name; map popup (click a polygon) shows the indicator name; Bar chart subtitle shows the measure; Download data CSV filename contains the indicator name; Change dataset → 2414 → all of the above update. No console errors.

- [ ] 9. Commit `global.js`, `data.js`, `measures.js`, `map.js`, `bar.js`, `trend.js`, `table.js`, `print.js`, `disparities.js` with message: `Move active-indicator metadata into DE.indicator`.

---

### Task 10: `DE.state` (design Stage 9)

Broadest blast radius, saved for last: the five core identity fields, kept in sync with the URL by app.js. **Includes `de-tab-content.js`, which the design doc's Stage 9 file list missed** (it writes `overlay = 'none'` on the tab toggle-off and close/Escape paths; skipping it would silently break pane-close URL persistence via an implicit `window.overlay`). de-tab-content.js loads *before* global.js but only touches `overlay` inside DOM event handlers, which fire long after `DE` exists — same guarantee its header comment already documents for the bare global.

**Files:**
- Modify: `assets/js/data-explorer/global.js` (append sub-object; delete lines 166–173; convert lines 594, 598, 602)
- Modify: `assets/js/data-explorer/app.js` (lines 18–19, 23–24, 27–28, 31–32, 35–36, 61–63, 82, 149, 166, 271, 285, 293, 382, 387, 399–401, 405, 456)
- Modify: `assets/js/data-explorer/menu.js` (lines 55, 58, 60, 75, 84, 89, 122, 125, 132, 138, 154–155, 160, 190–192, 227, 231, 235, 241)
- Modify: `assets/js/data-explorer/data.js` (lines 168, 176, 196, 243, 246, 252, 258, 285)
- Modify: `assets/js/data-explorer/measures.js` (lines 182, 202, 327, 357, 451, 471–472, 674, 700–701, 710, 746–747, 755, 1087, 1479, 1520, 1561, 1569–1571, 1575, 1589, 1593, 1599, 1609, 1740, 1775, 1898, 1905)
- Modify: `assets/js/data-explorer/table.js` (lines 79, 80, 379)
- Modify: `assets/js/data-explorer/bar.js` (line 42)
- Modify: `assets/js/data-explorer/print.js` (line 1311)
- Modify: `assets/js/data-explorer/topic-indicator-selector.js` (lines 671, 675, 677, 678)
- Modify: `assets/js/data-explorer/de-tab-content.js` (lines 48, 98)

**Interfaces:** Produces `DE.state` with: `IndicatorID` (`undefined`), `MeasureID` (`undefined`), `GeoType` (`undefined`), `TimePeriodID` (`undefined`), `overlay` (`undefined`). After this task the migration is complete: `global.js` declares `const DE = { table, disparities, links, trend, map, print, lookups, indicator, state }` plus only the excluded bare globals (`aboutMeasures`, `dataSources`, `historyState`, `btnToggleDisparities`, tab refs, `show*`/`sync*` closures) and the untouched constants.

**Steps:**

- [ ] 1. In `global.js`, append inside the `DE` literal after `indicator: { ... }`:
  ```js
      // Core identity: which indicator/measure/geography/time is selected and which
      // overlay tab is open ('bar', 'table', 'trend', 'links', or 'none'). Read across
      // nearly every file and kept in sync with the URL by app.js.
      state: {
          IndicatorID: undefined,
          MeasureID: undefined,
          GeoType: undefined,
          TimePeriodID: undefined,
          overlay: undefined
      }
  ```

- [ ] 2. In `global.js`, delete lines 166–173 (the core-identity comment block plus `let IndicatorID;`, `let MeasureID;`, `let GeoType;`, `let TimePeriodID;`, the overlay comment, `let overlay;`). Convert `getCurrentDataDownloadView`'s reads at 594, 598, 602: `if (overlay === 'trend')` etc. → `if (DE.state.overlay === 'trend')` / `'links'` / `'table'`. Do **not** touch the `GeoType` *parameters* of `assignGeoRank` (393) and `prettifyGeoType` (434–470).

- [ ] 3. Convert `app.js`. The four shorthand-object sites need expansion — exact replacements:
  - Line 82:
    ```js
        writeHistoryState('pushState', { id: IndicatorID, MeasureID, GeoType, TimePeriodID, overlay }, url);
    ```
    →
    ```js
        writeHistoryState('pushState', {
            id: DE.state.IndicatorID,
            MeasureID: DE.state.MeasureID,
            GeoType: DE.state.GeoType,
            TimePeriodID: DE.state.TimePeriodID,
            overlay: DE.state.overlay
        }, url);
    ```
  - Line 149:
    ```js
        writeHistoryState('replaceState', { id: IndicatorID, MeasureID, GeoType: GeoType || renamedGeoType, TimePeriodID, overlay }, nextURL);
    ```
    →
    ```js
        writeHistoryState('replaceState', {
            id: DE.state.IndicatorID,
            MeasureID: DE.state.MeasureID,
            GeoType: DE.state.GeoType || renamedGeoType,
            TimePeriodID: DE.state.TimePeriodID,
            overlay: DE.state.overlay
        }, nextURL);
    ```
  - Line 166: same expansion with `overlay: 'bar'` kept literal:
    ```js
        writeHistoryState('replaceState', {
            id: DE.state.IndicatorID,
            MeasureID: DE.state.MeasureID,
            GeoType: DE.state.GeoType,
            TimePeriodID: DE.state.TimePeriodID,
            overlay: 'bar'
        }, nextURL);
    ```
  - Line 285:
    ```js
        debugLog("* renderCurrentView", { MeasureID, GeoType, TimePeriodID, overlay, updateMap });
    ```
    →
    ```js
        debugLog("* renderCurrentView", {
            MeasureID: DE.state.MeasureID,
            GeoType: DE.state.GeoType,
            TimePeriodID: DE.state.TimePeriodID,
            overlay: DE.state.overlay,
            updateMap
        });
    ```
    (`updateMap` is the function parameter — stays shorthand.)
  - Simple sites: 18 (`IndicatorID != null && !Number.isNaN(Number(IndicatorID))`), 19, 23–24, 27–28, 31–32, 35–36 → `DE.state.*`; 61–63 (`MeasureID = null;` etc.) → `DE.state.* = null;`; 271 `if (overlay === 'table' && ...)`; 293 `switch (overlay)` → `switch (DE.state.overlay)`; 382 `if (urlOverlay) overlay = urlOverlay === 'map' ? 'bar' : urlOverlay;` → `DE.state.overlay = ...`; 387 `if (urlID && urlID !== IndicatorID)`; 399–401 (`if (urlMeasureID)    MeasureID    = urlMeasureID;` etc. — keep the aligned-spaces style: `if (urlMeasureID)    DE.state.MeasureID    = urlMeasureID;`); 405 `Number(IndicatorID)`; 456 `overlay = value;` → `DE.state.overlay = value;`.

- [ ] 4. Convert `menu.js`: 55 `m.MeasureID === MeasureID` (RHS only); 58 `if (!MeasureID || !selectedMeasure)`; 60 and 89 `MeasureID = ...MeasureID;` → `DE.state.MeasureID = defaultMeasure.MeasureID;` / `= measure.MeasureID;`; 75 `debugLog('Globals:', { MeasureID, GeoType, TimePeriodID });` → `debugLog('Globals:', { MeasureID: DE.state.MeasureID, GeoType: DE.state.GeoType, TimePeriodID: DE.state.TimePeriodID });`; 84 RHS compare; 122 `if (!GeoType || !availableGeoValues.includes(GeoType))` (×2); 125 `GeoType = availableGeoValues.reduce(...)` write; 132 `setDropdownLabel('geo', GeoType);`; 138 `prettifyGeoType(d.GeoType) === GeoType` (RHS bare global only — `d.GeoType` stays); 154 (×2), 155 write, 160 read for `TimePeriodID`; 190–192 the three `isSelected` comparisons; 227/231/235 the `handleSelection` writes; 241 `Number(IndicatorID)`.

- [ ] 5. Convert `data.js`: 168 `if (!overlay) overlay = 'none';` → `if (!DE.state.overlay) DE.state.overlay = 'none';`; 176 `IndicatorID = parseFloat(this_IndicatorID);` → `DE.state.IndicatorID = ...`; 196 the trailing compare (line already namespaced in Task 9) → `... indicator.IndicatorID == DE.state.IndicatorID);`; 243 `nextURL.searchParams.set('id', parseFloat(IndicatorID));`; 246 `window.history.state.id != IndicatorID`; 252 and 258 the `{ id: IndicatorID }` history payloads → `{ id: DE.state.IndicatorID }`; 285 `await loadData(IndicatorID);`. **Do not touch** the `joinData` locals at 448–468 (shadow inventory) or any `d.TimePeriodID`/`"TimePeriodID"` column references.

- [ ] 6. Convert `measures.js`: 182 `getMeasureMetadataById(MeasureID)[0]`; 202 `getMeasureLinksMetadata(MeasureID)`; 327 and 357 `Number(MeasureID)`; 451 `DE.lookups.timeLookup[TimePeriodID]` → `[DE.state.TimePeriodID]`; 471–472 (`if (GeoType && dropdownTableGeoTypes.includes(GeoType))` and `[GeoType]`); 674 `Number(MeasureID)`; 700–701, 710, 746–747, 755 the `Number(ind.IndicatorID) === Number(IndicatorID)` / `Number(ind.MeasureID) === Number(MeasureID)` comparisons (bare globals only — `ind.*`/`row.*` properties stay); 1087 `MeasureID == null ? null : Number(MeasureID)`; 1479 `overlay !== 'table'`; 1520/1589/1609/1775 `overlay = '<tab>';` writes → `DE.state.overlay = '<tab>';`; 1561 and 1593 `m.MeasureID == MeasureID` (RHS); 1569–1571 the `showMap` filter comparisons:
  ```js
          DE.map.filteredMapData = DE.map.mapData.filter(obj =>
              obj.MeasureID == DE.state.MeasureID &&
              obj.TimePeriodID == DE.state.TimePeriodID &&
              prettifyGeoType(obj.GeoType) == DE.state.GeoType
          );
  ```
  1575 debug shorthand → `{ MeasureID: DE.state.MeasureID, GeoType: DE.state.GeoType, TimePeriodID: DE.state.TimePeriodID }`; 1599 `renderBar(DE.map.filteredMapData, metadata, DE.state.GeoType);`; 1740 `aq.desc(aq.escape(d => d.IndicatorID == IndicatorID))` → `== DE.state.IndicatorID))` (inside `aq.escape` the JS closure captures normally — property `d.IndicatorID` stays); 1898 `if (overlay !== 'none')` and 1905 `tabSelector[overlay]` → `DE.state.overlay`.

- [ ] 7. Convert the small files: `table.js` 79 `[DE.state.TimePeriodID]`, 80 `const currentGeo = DE.state.GeoType;`, 379 `[DE.state.GeoType && dataGeos.includes(DE.state.GeoType) ? DE.state.GeoType : dataGeos[0]]`; `bar.js` 42 `if (DE.state.overlay === 'bar' && ...)`; `print.js` 1311 `DE.print.chartType || DE.state.overlay || 'chart'`; `topic-indicator-selector.js` 671–678 (preserve alignment):
  ```js
      if (paramsObj.MeasureID)    DE.state.MeasureID    = parseFloat(paramsObj.MeasureID);
      if (paramsObj.GeoType || paramsObj.GeoTypeID) {

          // Seed the pretty geography label before menus build their available options.
          DE.state.GeoType = paramsObj.GeoType || paramsObj.GeoTypeID;
      }
      if (paramsObj.TimePeriodID) DE.state.TimePeriodID = parseFloat(paramsObj.TimePeriodID);
      if (paramsObj.overlay)      DE.state.overlay      = paramsObj.overlay;
  ```
  (`printIndicatorInfo`'s `IndicatorID` parameter at 462/470/494 stays — shadow inventory.)

- [ ] 8. Convert `de-tab-content.js` lines 48 and 98: `overlay = 'none';` → `DE.state.overlay = 'none';` in both handlers. Also update its file-header comment (lines 8–10), which currently reads "...only touches SPA globals (updateChartPlotSize, pushSelectionToURL, overlay) from inside deferred handlers..." → "...only touches SPA globals (updateChartPlotSize, pushSelectionToURL, DE.state.overlay) from inside deferred handlers, guarded so load order never matters." — the guarantee statement must stay true and name the new location.

- [ ] 9. Residual grep:
  ```powershell
  rg -n "\b(IndicatorID|MeasureID|GeoType|TimePeriodID|overlay)\b" assets/js/data-explorer/ | rg -v "DE\.state\.|DE\.lookups\.|DE\.map\.|DE\.print\.|d\.|obj\.|ind\.|row\.|item\.|measure\.|indicator\.|m\.|t\.|geo\.|link\.|comp\.|properties\.|datum\.|params\."
  ```
  Then hand-review the survivors against the shadow inventory: `data.js:448-468` locals, `global.js` `GeoType` params, `topic-indicator-selector.js` `printIndicatorInfo` param + `paramsObj.*`/`urlParams` reads, string column names (`"MeasureID"`, `"TimePeriodID"`, `'GeoType'`), URL param names in `params.get('MeasureID')`/`searchParams.set(...)` (string literals — untouched), and comments. Nothing else may remain.

- [ ] 10. Rebuild; `--check` must PASS.

- [ ] 11. Fresh-tab manual golden path (URL/identity — the widest sweep of the whole migration):
  1. Open `.../data-explorer/asthma/?id=2380&overlay=trend` → Trends pane opens on load with trend rendered.
  2. Change Measure, Geography, Time dropdowns → URL updates after each; view re-renders.
  3. Click each tab in turn → `overlay` param updates; click the **active** tab again → pane closes and URL shows `overlay=none` (de-tab-content.js toggle-off path); reopen a pane, press **Escape** → closes, `overlay=none` again (close-button/Escape path); click a pane's **X** button → same.
  4. Browser Back/Forward through several of the above → menus, map, and pane state restore each step (popstate path).
  5. Change dataset via the modal → new indicator, URL `id` updates, sub-selections reset to defaults.
  6. Legacy URLs: `?id=2380&GeoTypeID=UHF42` → normalizes to `GeoType=UHF42`; `?id=2380&overlay=map` → normalizes to `overlay=bar`; `?id=2380#display=trend` → hash converts to `overlay=trend`.
  7. Open the topic page with **no** params → indicator-selector modal opens.
  No console errors anywhere in the sequence.

- [ ] 12. Final sweep: `rg -n "^let |^    let " assets/js/data-explorer/global.js` — the only remaining bare `let` declarations must be: `aboutMeasures`, `dataSources`, `tabBar`, `tabTrends`, `tabCorrelate`, `tabTable`, `showTable`, `showBar`, `showMap`, `showTrend`, `showBoroughTrend`, `showComparisonTrend`, `showLinks`, `syncTrendSelectionsToMapSelection`, `syncLinksSelectionsToMapSelection`, `historyState`, `btnToggleDisparities` (17 — the design doc's excluded set exactly). Run `node documents/de-characterization.mjs --check` one more time after the sweep.

- [ ] 13. Commit `global.js`, `app.js`, `menu.js`, `data.js`, `measures.js`, `table.js`, `bar.js`, `print.js`, `topic-indicator-selector.js`, `de-tab-content.js` with message: `Move core identity state into DE.state`.

---

## Post-migration notes (not tasks)

- The characterization harness (`documents/de-characterization.mjs`, its baseline, and the Playwright devDependency) stays on the branch as-is — whether it survives the merge is a merge-time decision, alongside the deferred documentation updates (`CLAUDE.md` "Data explorer architecture" section, the architecture memory note, `documents/data-explorer-architecture.md`), none of which are touched by this plan.
- Dead fields carried through for parity (marked † in the field map) are a natural follow-up cleanup commit *after* merge, when deleting them can be reviewed on its own.
- `DE.indicator.indicator` is the one awkward name produced by strict name preservation; a rename (e.g. `DE.indicator.record`) is a candidate for that same post-merge cleanup, never for this migration.
