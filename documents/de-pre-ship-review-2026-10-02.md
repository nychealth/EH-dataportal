# DE pre-ship review: `feature-new-data-explorer` @ `c15317c74b` vs `production` @ `ed63fa7603`

Written by one Opus review subagent on 2026-10-02 (Task 5 of
`documents/de-production-deploy-plan-2026-10-01.md`): 506,518 subagent tokens, 108 tool calls,
~22 minutes. **These are the reviewer's findings, not verified ones.** Each finding's outcome
(verified, fixed, deferred, rejected) is recorded in the deploy plan's "Review findings" table,
not here. Every `file:line` below is as of `c15317c74b` and moves with later commits; the
landmark (function, selector, partial) is the stable locator.

## How the findings were established

- **Read-only.** `git status` was clean at the end. The two runtime probes ran through `scripts/.sc-rebaseline/de-review-probe.mjs` and `de-review-probe2.mjs` (gitignored) against `startServer("prod_prod")` on :8090, with GTM and GA aborted. Afterwards no `hugo.exe` was running and nothing was listening on :8090.
- **Runtime console noise.** The isolated server has no Pagefind index, so every page logs pagefind-ui 404 and MIME errors. These come from the harness, not the branch.
- **Data checks.** To check what the code assumes about the data, I read the production EHDP-data `metadata.json`, `comparisons.json`, `GeoLookup.json` and about ten indicator data files (downloaded 2026-10-02).
- **Labels.**
  - **CONFIRMED (runtime)**: reproduced in Chromium.
  - **CONFIRMED (trace)**: traced end to end in the code, not run.
  - **SUSPECTED**: plausible, but the trace or the trigger is not closed.

---

## A. User-visible breakage or wrong data shown

### 1. Back/forward within one indicator does not switch the visible tab pane. CONFIRMED (runtime)

- **Where:**
  - `assets/js/data-explorer/app.js:557-593`, the popstate handler's same-indicator path.
  - The only code that activates a Bootstrap tab is `measures.js:2033-2041`, inside `renderMeasures`. That function runs only when the indicator changes.
- **Trigger:** `asthma/?id=2380`. Click Trends, then click Bar, then press Back.
- **What goes wrong:**
  - The URL and `DE.state.overlay` change to `trend`, but the Bar pane and Bar tab stay active. `showTrend` renders into the hidden Trends pane.
  - Pressing Forward from the `overlay=none` entry leaves `overlay=trend` with no pane shown and `#v-pills-tabContent` set to `display:none`.
  - In short, the URL and the screen disagree after any same-indicator back or forward between tabs.
- **Severity:** user-visible breakage.

### 2. Two quick Boundary/Time/Measure changes leave a stale geometry layer on the map permanently. CONFIRMED (runtime)

- **Where:**
  - `map.js:123` (`resetMapForRender`) runs synchronously and only removes `currentGeojsonLayer`.
  - The geometry fetch resolves later at `map.js:736` and `map.js:905`.
  - Each resolution then unconditionally sets `currentGeojsonLayer` (`map.js:810`, `961`) and `attachMapInterop` (`818`, `1038`).
  - There is no render token.
- **Trigger:** on `asthma/?id=2380`, call `handleSelection('geo','UHF42')` and then `handleSelection('geo','CD')` straight away. UHF42 geometry is not cached yet; CD is.
- **What goes wrong:**
  - Afterwards the map holds both layers: 59 CD paths plus 42 UHF42 paths (101 total). The UHF42 layer drew last, on top, coloured by the earlier selection.
  - Changing to Borough then left 59 CD paths plus 5 Borough paths. The CD layer had been orphaned, because `currentGeojsonLayer` pointed at the stale UHF42 layer, and no later render removes it.
  - Bar-to-map hover interop is wired to the stale layer.
  - The same race applies to indicator switches and to the unmapped render.
- **Severity:** wrong data shown, and it persists until reload.

### 3. The Correlate chart draws the wrong measure pair's data after a round trip. CONFIRMED (runtime)

- **Where:**
  - `measures.js:142`: `setDefaultLinksMeasure` writes `DE.links.joinedLinksDataObjects` (the cached value) without writing its cache key, `DE.links.selected{Primary,Secondary}MeasureMetadata`.
  - `measures.js:1346-1349`: `renderSelectedCorrelate` trusts the key and reuses the cached value.
  - `measures.js:1422`: `renderSelectedDisparities` writes only the primary half of the key. That is a second way to break the same invariant (trace only).
- **Trigger:**
  1. Load `asthma/?id=18&MeasureID=31&overlay=links`. It correctly draws 31 vs 47.
  2. Run `selectIndicator(2414)`, an indicator with no correlates.
  3. Press Back.
- **What goes wrong:** the chart is labelled and annotated for 31 vs 47, but its data rows and print spec are pair 363/41, the indicator's default pair. The CSV export carries the same wrong rows.
- **Severity:** wrong data shown.

### 4. A superseded indicator load still writes shared state and the 311 links. CONFIRMED (trace)

- **Where:**
  - `data.js:323-351`: `loadData` → `joinData` writes `DE.lookups.aqIndicatorData`, `joinedAqData`, `DE.table.tableData`, `DE.map.mapData`, `DE.trend.trendData` and `DE.links.linksData`.
  - Then `render311Links(this_IndicatorID)` (`data.js:351`) rewrites the 311 DOM.
  - None of this checks the load token. The token is checked only *between* the awaits in `app.js:526-536`.
- **The comment at `app.js:499-500` is false.** It says "a stale load then stops before it can write shared state, the URL, or the DOM".
- **Trigger:** pick indicator A, whose data file is not cached yet, then pick B, which is cached or fast, before A's fetch returns.
- **What goes wrong:**
  - A's `joinData` runs with B's `DE.indicator.indicatorMeasures` (set synchronously in `loadIndicator`) and A's rows. The result overwrites B's map, table, trend and links data with rows semijoined to B's measures, which is mostly empty.
  - B's view rendered first, so the corruption shows on the next interaction (dropdown, tab): an empty map, table or trend.
  - The 311 links for A are left showing on B's page.
- Not reproduced; the timing needs a slow first fetch.
- **Severity:** wrong data shown.

### 5. A measure with no views at all, inside an indicator that has mapped measures, breaks the map. CONFIRMED (runtime)

- **Where:**
  - `measures.js:1534-1538`: `showMap` falls back to `DE.map.defaultMapMetadata`, which is *another* measure's metadata, whenever the current MeasureID is not in `mapMeasures`.
  - The `MapUnavailable` flag therefore never reaches `renderMap`.
- **Affected indicators** (from `metadata.json`): 103 (measure 870, Rank), 2176 (869), 2383 (1205), 2384 (1207). In each, the Map, Table and Trend VisOptions all have `GeoType: null`.
- **Trigger:** `economic-conditions/?id=103&MeasureID=870`, or picking "Rank" in the Measure dropdown.
- **What goes wrong:**
  - The page fetches `.../geography/undefined` (404).
  - No polygons and no "not mapped" message are drawn.
  - The legend stays visible, reading `0.0%`–`0.0%`.
  - `DE.map.selectedMapMetadata` is measure 221 (Percent) while the dropdown says "Rank". The Bar tab charts an empty bar under 221's labels.
- **Comments made false by this case:**
  - `map.js:505-506`: "showMap hands this an empty array".
  - `map.js:577-581`: "showMap's fallback left `metadata` empty".
  - `global.js:535-538`: "the flag is what carries the meaning".
  - All three hold only when *every* measure in the indicator is unmapped.
- **Severity:** user-visible breakage.

### 6. Activating a disabled tab from the keyboard switches state but not the view. CONFIRMED (runtime) and CONFIRMED (trace)

- **Where:**
  - `measures.js:423-430`: `disableTab` only adds a class and `aria-disabled`. Bootstrap's `.nav-link.disabled` blocks pointer events, not keyboard activation.
  - `app.js:633-648`: the click listener does not check `disabled`.
- **Trigger:** `asthma/?id=2378&overlay=bar` (Trends is disabled). Focus Trends and press Enter.
- **What goes wrong:**
  - Runtime: the URL and `DE.state.overlay` become `trend` while the Bar pane stays visible.
  - Trace: every later dropdown change calls `showTrend`, which renders nothing for this indicator. The visible bar chart is therefore never redrawn and stops matching the map.
- **Severity:** wrong data shown (keyboard users).

### 7. The exported map PNG has its legend reversed. CONFIRMED (trace)

- **Where:**
  - `map.js:195`: `createColorScale` uses domain `[max, min]`, so min draws yellow (viridis(1)) and max draws purple.
  - `print-map.js:992-993` draws the export legend with `addColorStop(stop, d3.interpolateViridis(stop))`: purple on the left, yellow on the right.
  - `print-map.js:1014` puts `minLabel` on the left and `print-map.js:1017` puts `maxLabel` on the right.
- **What goes wrong:** in the exported image the lowest values (yellow) sit against a legend that says yellow means Max.
- The on-screen legend (`.viridis-rect`, yellow on the left) is correct.
- **Severity:** wrong data shown (exported artifact).

### 8. The citation shows the build date and the topic URL. CONFIRMED (trace; read both versions)

- **Where:** `themes/dohmh/layouts/partials/de-tab-content.html:302-307`.
- **New behaviour:** the text is `Accessed at {{ .Permalink }} on {{ time.Now ... }}`. `time.Now` is Hugo **build** time, and `.Permalink` is the topic page with no `?id=`.
- **Production behaviour** (`createCitation`): the date was the visitor's date (`new Date()`) and the URL was the full `window.location.href`, so it included indicator, measure, geo and time.
- **Severity:** wrong data shown.

### 9. "About the data" keeps the last trend, correlate or disparities text after you leave that tab. CONFIRMED (runtime)

- **Where:**
  - `renderAboutSources` (`global.js:344-380`) overwrites `#howCalculated` and `#dataSources`.
  - It is called from `measures.js:1397`, `1646` and `1723`, and from `disparities.js:168`.
  - The indicator-wide text from `renderIndicatorInfo` (`topic-indicator-selector.js:565-595`) is never restored.
- **Runtime:** `#howCalculated` held 3 paragraphs (all measures) on `asthma/?id=2380`. After opening Trends it held 1, and it was still 1 after switching to Bar.
- **Severity:** degraded UX; the information is misleading.

### 10. When there is no trend data, Save and Download on the Trends tab export the previous view. CONFIRMED (trace)

- **Where:** `trend.js:152-164` returns early without clearing `DE.print.printSpec`, `CSVforDownload` or `chartType`.
- **Download:** `downloadData` then exports the prior bar or correlate CSV, named after `DE.print.chartType` (for example "(bar view)").
- **Save chart:** "Save chart" previews the prior spec.
- **False comment:** `global.js:943-951` says the guard means "a blank/leftover CSV can't go out under a confident but wrong filename". It only blocks an empty CSV.
- **Severity:** wrong data shown (export).

### 11. Correlate CSV: `Value_1_Indicator` and `Value_2_Indicator` are swapped when `SecondaryAxis` is `'y'`. CONFIRMED (trace); inherited from production

- **Where:** `correlate.js:614-615` label `Value_1` (the primary measure, the left table in the `data.js:855` join) with `yIndicatorName`.
- **When it happens:** in the `'y'`/default case, y is the *secondary* measure. 391 of 745 links in `metadata.json` are `'y'`.
- **Inherited:** the same mapping is at `production:assets/js/data-explorer/links.js:370-371`, so this is not new, but it still ships.
- **Severity:** wrong data shown (export).

### 12. Table: UHF33 and National rows have no label and no filter. CONFIRMED (runtime for UHF33; trace plus data for National)

- **Where:**
  - `global.js:469-482`: `GEO_RANK_BY_PRETTY_TYPE` and `geoTypes` have no `UHF33` or `National`.
  - `table.js:24`: the table filters its geography options through `geoTypes`.
  - `GeoLookup.json` has no rows for either geotype, so `Geography` is null.
- **Runtime** (`cigarette-smoke/?id=2017`): 66 UHF33 rows are in `tableData` with `Geography: null`. The geography checkboxes are only `Citywide`, `Borough` and `UHF34`.
- **What goes wrong:** these rows can never be selected. They appear, with the area shown as "-", only when every checkbox is ticked, because the geography search then becomes `''`.
- **Same pattern for National:** indicators 2214 and 2215, in both the table and the trend view (the trend line would be labelled null).
- **Also affected:** indicators 2019 and 2020 (UHF33).
- **Severity:** wrong data shown.

### 13. The table stops following the map after a measure-driven cascade or after Back. CONFIRMED (trace)

- **Where:**
  - `menu.js:290-304`: only `geo` and `time` selections call `syncTableFiltersToMapSelection`.
  - A Measure change can still change `GeoType` or `TimePeriodID` through `updateAllMenus` (`menu.js:134-173`).
  - The popstate same-indicator path (`app.js:580-592`) never resyncs.
- **What goes wrong:** the map moves to a new time or geography while the table keeps the old one, and its summary still says "Synced". This contradicts the stated "table follows the map" design.
- **Severity:** degraded UX.

### 14. The Area search box keeps its text after a table rebuild, but the filter is gone. CONFIRMED (trace)

- **Where:**
  - `table.js:701-712`: a rebuilt DataTable has no column-8 search.
  - `table.js:875` → `234` then refill the input from `DE.table.tableAreaSearchValue`.
  - That value is never reset on indicator change (it is absent from `renderMeasures`).
- **Triggers:**
  - Type an area name, then toggle "Group neighborhoods by borough" (`app.js:659-672` → `renderTable`).
  - Or switch indicator with Table open.
- **What goes wrong:** the box shows the term while all rows show. Retyping the same term is ignored by the redundancy check at `table.js:324`.
- **Severity:** degraded UX.

### 15. The generic small-numbers note can print twice. CONFIRMED (trace plus data)

- **Where:**
  - `getDisplayNotes` (`global.js:976-989`) maps every note containing "based on small numbers" to the same sentence, but does not dedupe afterwards.
  - The callers dedupe *before* mapping: `bar.js:78-81`, `trend.js:179-182`, `correlate.js:369-372`.
- **Trigger:** indicator 2383 data has two variants, `* Estimate is based on small numbers…` and `< 4 Estimate is based on small numbers…`, so trend and bar print the sentence twice.
- **False claim:** this breaks `global.js:389-391`, which says callers pass an "already-deduped `notes` array".
- **Severity:** cosmetic.

### 16. After the "No correlates" message, the Disparities chart keeps Save Chart and Download data disabled. CONFIRMED (runtime)

- **Where:**
  - `correlate.js:169-175` disables both buttons (`pointer-events: none`, `tabindex="-1"`).
  - Only `correlate.js:217` re-enables them. `renderDisparitiesChart` never calls `setCorrelateActionState(true)`.
- **Trigger:** `asthma/?id=2380&MeasureID=1197&overlay=links`, then click Disparities. The chart renders and both buttons stay disabled.
- **Severity:** user-visible breakage.

### 17. When correlate and disparities both fail, the previous chart stays up. CONFIRMED (trace); trigger SUSPECTED

- **Where:** `measures.js:1800-1826`. When `renderSelectedCorrelate` returns false (an empty join) and there are no disparities, nothing clears `#links` or `DE.print`.
- **Effect:** the previous indicator's chart remains under the new indicator.
- **Trigger status:** a sweep of `metadata.json` found no link pair with zero shared geographies. An empty *time* join is still possible, but I did not find a live case.
- **Severity:** wrong data shown (latent).

### 18. Unguarded `localStorage.getItem` in `head.html`, on every page. Trace CONFIRMED; trigger SUSPECTED

- **Where:** `themes/dohmh/layouts/partials/head.html:200`, new on this branch.
- **What goes wrong:** if storage access throws (for example, Chrome with site data blocked, which I believe throws a `SecurityError`; not verified here), the whole inline script aborts. `debugLog` is then never defined, and every DE script fails at its first `debugLog` call with a `ReferenceError`, as does any other page script that calls it.
- **Fix shape:** wrap the read in `try/catch`.
- **Severity:** user-visible breakage for those users.

### 19. "Download data" and "Sync to map" are `href="#"` links that don't prevent the default action. CONFIRMED (trace)

- **Where:**
  - `de-tab-content.html:140`, `237` and `281` (`onclick="downloadData()"`).
  - `de-tab-content.html:190` (`#tableFilterSyncButton`, whose handler at `table.js:513` has no `preventDefault`).
  - The Table tab's `downloadTableData` link at `:209` has the same shape.
- **What goes wrong:** each click appends `#`, scrolls the page to the top and adds a history entry. Back then fires popstate and a full map re-render.
- **Severity:** degraded UX.

### 20. Placeholder links ship. CONFIRMED (read)

- "Email your elected officials" has `href="#"` at `header-de.html:451` (desktop) and `de-tab-button.html:37` (mobile).
- **Severity:** user-visible.

### 21. "More info about {topic}" can be a self-link. CONFIRMED (read plus content sweep)

- **Where:** `header-de.html:422` renders `href="{{ .Params.azlink }}"` unconditionally. Production guarded it with `{{ with .Params.azlink }}`.
- **Affected live pages** (no `azlink`): `economic-conditions`, `worker-health`, and the `data-explorer/_index` landing page.
- **Severity:** minor.

### 22. Dead SCSS: nested under `.de-wrapper`, but the targets are outside it. CONFIRMED (runtime plus compiled CSS)

- **Mobile bottom padding never applies.** `_de-custom.scss:543` compiles to `.de-wrapper .de-wrapper` (seen in the built `docs/scss/theme.*.css`). Runtime at 390px: `article.de-wrapper` `padding-bottom: 0px` while `.de-tabs` is `position: fixed`.
- **Modal styles never apply.** `.indicator-grid`, `.indicator-card` (`:890-928`), `.hover-underline`, `.indicator-modal-topic-trigger` and the sticky About/Related bar (`:638`) are all scoped to `.de-wrapper`. But the indicator, topic and Learn More modals live in `header-de.html`, outside `<article class="de-wrapper">`. Runtime: `#indicatorDestination .indicator-grid` has `display: block`, so the two-column grid, card hover and sticky nav never take effect.
- **Severity:** degraded UX.

## B. Accessibility

### 23. Controls with no accessible name. CONFIRMED (read)

- **Topic selector:** `header-de.html:282-284`. `#topicSelectorButton` contains only `<img alt="">`.
- **Logo link:** `header-de.html:57`. The image has no alt at all; `header.html:75` has `alt="Environment & Health Data Portal home"`, so this is a regression.
- **Learn More (mobile):** `header-de.html:397-400`. Below `md`, the text is `d-none` and the image has `alt=""`.

### 24. The mobile Measure/Boundary/Time panel cannot be opened from the keyboard. CONFIRMED (read; not run with AT)

- **Where:** `de-indicator-info.html:12`. It is a `<div data-toggle="collapse">` with no role and no tabindex.
- **Also SUSPECTED:** the "Change dataset" button is nested inside it, so tapping that button probably toggles the collapse as well.

### 25. Low-contrast buttons. CONFIRMED (contrast computed)

- `.btn-light-green-bg-outline` puts `#008939` on `#EFFAF4`, which is 4.24:1. That is the pairing commit `0007cf874f` recorded as failing AA and fixed elsewhere.
- Production used the class 0 times. This branch uses it 9 times (Save Chart, Download data).

### 26. `#map role="img"` wraps focusable content. SUSPECTED

- **Where:** `single.html:28-30`. The `role="img"` element contains the sr-only "View this data as a table" link and Leaflet's attribution links.
- **Why it matters:** children of `img` are presentational. The comment at `:24-27` says the link gives screen-reader users a path, but that is doubtful when the link is inside the img.
- **Side effect:** if the Table pane is already open, the link's click closes it (the toggle-off in `de-tab-content.js:32`).

### 27. A button that does nothing. CONFIRMED (no JS references)

- `#tableFilterToggle` (`de-tab-content.html:151`) is focusable, sits in an `sr-only` container, and nothing binds to it.

### 28. Contradictory ARIA on the "Recently updated" icon. Minor

- `topic-indicator-selector.js:547-549` gives the icon both `aria-hidden="true"` and `aria-label`, so the label is never read.

## C. Maintainability: false or stale claims in code and docs

- **29. Stale-load claim.** `app.js:499-500`; see #4.
- **30. Unmapped-measure comments.** `map.js:505-506`, `map.js:577-581`, `global.js:535-538`; see #5.
- **31. Download guard comment.** `global.js:943-951`; see #10.
- **32. "Already-deduped" claim.** `global.js:389-391`; see #15.
- **33. Search comment made stale by this branch.** `themes/dohmh/layouts/partials/structured-data.html:53-58` still says the search modal is in `partials/footer.html` (it moved to `search-modal.html`). It also describes `/search-results/`'s layout, which this branch deletes. There are no remaining references to search-results.
- **34. Map export description.** `print.js:6-7` says maps are exported "by compositing the current Leaflet DOM". In fact `print-map.js` builds an off-screen map.
- **35. Out-of-date code comments.**
  - `measures.js:2002` says the caller is "checkURL or popstate"; it is `loadAndRenderIndicator`.
  - `data.js:240` says "IndicatorID comes in as a string"; lookup now goes through `getIndicatorById`.
  - `de-tab-content.js:9-10` says "guarded so load order never matters", but `DE.state.overlay` writes at `:54` and `:107` are unguarded.
- **36. Dead and reformat-only partials.** `de-chooser.html` is included nowhere on either branch, yet it is reformatted here. A token diff showed the `de-chooser-accordion.html` changes are whitespace and attribute order only; that partial is used only by data-explorer-old.
- **37. Old topics collide with new ones.** `de-topic-indicators.html:25` and `de-indicator-names-pf.html:33` match the substring `/data-explorer`, which also matches `/data-explorer-old/*`.
  - Old topics write the same keys (from `path.Base`) into `topic_indicators.json`, which `nr-output/single.html:86` consumes.
  - Today the titles and IDs are identical, so there is no visible effect; it will break silently once the copies diverge.
- **38. Debug log left in.** `data-explorer/section.html:81` has a `console.log` in production code.
- **39. Duplicate CSS.** `_de-custom.scss:851-859` and `:872-880` are the same block twice. Its `#007bff` (3.98:1 on white) is overridden only because the `.de-tabs-nav` rule at `:766` is more specific.

## Verified clean (lists of sites checked)

- **`links.js` deletion.** It defined only `renderLinksChart`. There are 0 references to that name, or to `links.js`, in `assets/js/data-explorer/` or `themes/dohmh/layouts/` outside data-explorer-old.
- **SCSS port of `_custom.scss`.** Parsed rule by rule (selector path plus declarations): all **59** production rules are in `_de-custom.scss` with identical declarations, including the three `$primary-dark` edits from `0007cf874f`.
  - Positive control: changing line 167 or deleting line 221 each produced exactly 1 flagged issue.
- **Writes to `DE.state.*`.** Every write is listed below. The claim that IndicatorID is only written from `parseFloat` holds.
  - `app.js:90-93`, `117-119`, `640`
  - `data.js:213`, `222`
  - `de-tab-content.js:54`, `107`
  - `measures.js:1488`, `1564`, `1600`, `1771`
  - `menu.js:65`, `96`, `140`, `172`, `267`, `271`, `275`
- **Whitespace-only diffs.** In the 35 non-DE templates, the `-w` diff for these files was whitespace only: `de-text-search`, `socialshare`, `takeaction`, `temp-popup`, `render-*`, `related-data`, `related-footer`, `featured-data*`, `keywords`, `df-front-block` and `nr-insert-zips`. The `var`→`let` changes in `nr-*`, `overlap-tool` and `realtime-download` are top-level, and smoke covers them at page load.
- **Metadata shape.** All 731 measures have `Links[0]`, so `measures.js:1926` (unguarded) does not throw on current data. No `DisplayType` is null and none contains an apostrophe, so the Vega `calculate` strings are safe on current data.

## Anything else that would worry you shipping this

- **Coverage is much thinner than "full-site smoke" suggests.** The sweep loads DE topic pages without `?id=`. Only about 5 of 267 indicators (2380, 26, 2427, plus the 3 characterized) run the rendering code in CI. Every finding above came from an indicator, sequence or data shape that no automated check runs.
- **Async races, the same pattern several times.** Only indicator loads and deferred table renders have a token. Map renders (#2), `showLinks`, `renderSelectedCorrelate` and `renderDisparitiesChart` (fast pair or measure changes; not run), `loadData` (#4) and `render311Links` all write shared state or the DOM after an await without checking whether they are still current. One render-generation counter checked before every post-await write would close the class.
- **`DE.print` is one shared mutable record written by whichever renderer ran last.** That is the root of #10. The same structure makes the Save and Download buttons fragile whenever a renderer early-returns.
- **Cached values whose key is written somewhere else** (#3). The same shape exists for `DE.disparities.disparityData` (keyed on `selectedDisparityPrimaryMeasureId`, written in one place, so OK today).
- **Geotype lists are maintained in three places:** `GEO_RANK_BY_PRETTY_TYPE`, `GEO_FILE_BY_TYPE` and `prettifyGeoType`. They have already drifted from the data (UHF33, National; #12).
- **Possible design question, not a defect:** on DE pages, `header-de.html:4` collapses `#global-header` and its toggle (`:275`) carries `.hide` (`display: none`). DE pages therefore have no site navigation, home link or site search. If that is intended, ignore this.
- **Not finished:**
  - No screen-reader pass.
  - No print or `@media print` check.
  - I did not run the fast-click races for correlate, disparities or 311 (#4 is trace only).
  - I did not check the trend comparison quarterly filter (`measures.js:1739-1747`) against real quarterly data.
  - `data-index.html` only skimmed: its diff against production is one line.
  - The header Subscribe restyle (`header.html:196`) measured `rgb(33,37,41)` text on `rgba(255,255,255,.5)` over the header image. I could not settle the contrast without the composited background.

## Coverage table

| File | How reviewed |
|---|---|
| `assets/js/data-explorer/global.js`, `app.js`, `data.js`, `measures.js`, `map.js`, `table.js`, `menu.js`, `topic-indicator-selector.js`, `bar.js`, `trend.js`, `correlate.js`, `disparities.js`, `print.js`, `print-map.js`, `311.js`, `de-tab-content.js` (16) | Read whole |
| `links.js` (deleted) | Production copy grepped for definitions; references swept |
| `layouts/data-explorer/single.html`, `section.html`, `indicator-catalog.html` | Read whole |
| `layouts/data-explorer/data-index.html` | First 130 lines read, rest skimmed; diff is one line |
| `partials/de-tab-content.html`, `de-tab-button.html`, `de-tabs.html`, `de-indicator-info.html`, `de-print-chart-modal.html`, `lib-topojson.html`, `de-indicator-names-pf.html`, `header-de.html`, `search-modal.html`, `related-footer-de.html`, `de-chooser-modal.html`, `de-topic-indicators.html` | Read whole |
| `partials/de-chooser.html` | Includes swept (dead on both branches); token diff only |
| `partials/de-chooser-accordion.html` | Token diff (whitespace and attribute order only) |
| `partials/de-text-search.html` | Whitespace-stripped hash identical to production; not read |
| `_default/baseof.html`, `_default/list.html`, `partials/head.html`, `header.html`, `footer.html`, `js_bottom.html` | `-w` diff read |
| `data-features/{fvi,rats-in-your-neighborhood,realtime,rmz}.html`, `nr-output/single.html`, `df-about-the-data`, `heat-report-correction`, `nr-chooser`, `nr-leaflet`, `nr-report-footer{,-sm}`, `nyccas_pollutant_maps`, `overlap-tool`, `pesticides-section`, `realtime-download` (context also read), `related-footer-categories`, `related-footer-content` | `-w` diff read |
| `socialshare`, `takeaction`, `temp-popup`, `render-accessible-table`, `render-table`, `related-data`, `related-footer`, `featured-data`, `featured-data-2`, `keywords`, `df-front-block`, `nr-insert-zips` | `-w` diff empty (whitespace only) |
| `search-results/single.html` (deleted) | References swept: only the stale comment in #33 |
| `assets/scss/_de-custom.scss` | Read whole; rule-survival check with positive control; compiled CSS spot-checked |
| `assets/scss/__portal-custom.scss`, `_a-global-variables.scss`, `theme.scss` | `-w` diff read |
