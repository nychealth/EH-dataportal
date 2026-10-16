# Data Explorer analytics audit — 2026-10-16

What Google Analytics events the new explorer (`/data-explorer/`) sends, compared with the retired
one (`/data-explorer-old/`), and whether they fire. Written for #1462's deploy: D19 item 3 in
[de-production-deploy-plan-2026-10-01.md](de-production-deploy-plan-2026-10-01.md) lists the
event changes GA readers are told about at cutover, and this checks that list.

The old explorer under `/data-explorer-old/` stands in for production's current `/data-explorer/`:
the 21 `gtag(` blocks in its `app.js`, `measures.js` and `print.js` are identical to those in
`origin/production`'s `assets/js/data-explorer/` `[verified 2026-10-16: whitespace-stripped
comparison, 12 + 8 + 1 blocks]`. Production's template was checked separately for the two items
that turned on markup (raw-data link, disparities wrapper). Whether the deployed build carries
`origin/production`'s tip is a separate question (D19).

## Ledger

**Status as of 2026-10-16: passes 1–3 done; finding 1 decided; `option_label` in `aa448afa19`;
table-download and chart-save tracking in `3d0ae9ba77`; history events off and
confirmed on both streams; review fixes R1–R13 done ([Review fixes](#review-fixes)).**

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Static inventory: every event name and its params, both explorers, plus shared partials loaded on their pages | *no commit* — read-only | **DONE 2026-10-16** | `git grep` for the wrappers first (5 in `data-explorer/global.js`, `sendAnalyticsEvent` in `site.js`), then every call site of `gtag(` and the four `trackDataExplorer*` wrappers in both trees. The first call-site sweep excluded `global.js` to skip definitions and so missed `downloadData`'s call; re-run over `global.js` alone. Templates of both explorers and `partials/de-*`: zero calls, with `search-modal.html` added as a positive control (2 hits) |
| 2 | Browser capture: GA requests on both explorers for the same actions, intercepted and never sent | *no commit* — probe was a temporary script | **DONE 2026-10-16** | See [Method](#method). Final run: both arms on both explorers, exit 0 each |
| 3 | Compare against D19 item 3; findings | — | **DONE 2026-10-16** | [Findings](#findings) below |

**Decided (Chris, 2026-10-16): no `page_view` per selection.** Turned off on the production
stream (`G-64BWDRHRGB`) and the dev stream (`G-PB98MPZ31B`). The setting is in GA admin, not
this repo.

- **The route that worked** (both streams, 2026-10-16): web stream details → Configure tag
  settings → Manage automatic event detection → **Page views on browser history change**. Each
  stream's served `gtag.js` read `"vtp_enableHistoryEvents":false` after this change; on
  production it had not after the change below.
- **The route Google's docs give** did not change the served config: Enhanced measurement → Page
  views → Show advanced settings → "Page changes based on browser history events"
  ([Enhanced measurement events](https://support.google.com/analytics/answer/9216061?hl=en),
  read 2026-10-16). Production's config still read `true` on 15 checks from 15:48 to 16:19 UTC
  after a change there. Whether these are two settings or one setting shown in two places was
  not established. Use the first route, and confirm with the served config.
- **The tag cannot override it:** Google says `send_page_view: false` does not stop these page
  views ([Measure pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views),
  read 2026-10-16).

Every selection that changed the URL in pass 2 also sent its own event
(`click_tab`, `click_option` `map_*`, `click_indicator`), so no action goes unrecorded. Two URL
changes have none: the load-time URL normalization, which is not a user action, and back/forward
inside the explorer, which the old explorer did not track either.

- **Dev stream (`G-PB98MPZ31B`): changed and confirmed.** `[verified 2026-10-16: served gtag.js
  reads "vtp_enableHistoryEvents":false with "vtp_enablePageView":true; arm B on the new
  explorer sent 1 page_view, against 10 with the setting on, and the same counts of every other
  event; all 20 custom events still carried the post-change URL as page_location; the three map
  events carried option_label]` The one `page_view` now records the normalized URL
  (`?id=2380&MeasureID=…&overlay=none`) where it had recorded the bare `?id=2380`.
  Chris also created the custom dimensions, `option_label` included, on the dev property; that is
  admin-side and not observable from the page.
- **Production stream (`G-64BWDRHRGB`): changed in GA admin (Chris, 2026-10-16) and
  confirmed.** `[verified 2026-10-16 16:26 UTC: served gtag.js reads
  "vtp_enableHistoryEvents":false with "vtp_enablePageView":true]` The `true` readings from 15:48
  to 16:19 UTC followed a change on the other route above, not a slow update. How long the change
  took to reach the served config was not measured. No browser capture against this property:
  only a `prod_prod` build loads its tag. The same flag was observed taking effect on the dev
  stream.
- **Site-wide scope:** the setting is per stream. On `feature-new-data-explorer` the explorer is
  the only GA-tagged page that writes history entries (`data-explorer/section.html` writes only
  `#topics` / `#indicators`; the three `static/html/202*-heat-report-fig-1.html` load no GA). The
  unmerged `nr-report/url.js` (`feature-MOD-Lab-NR-recode-refactor`) and `ndhr-report/url.js`
  (`feature-NDHR-prototype`) also write them, and will get one `page_view` per load.
- **What turning it off does not drop:** the chosen measure, geography and time period. Every
  event carries the page URL as `page_location`, and `handleSelection` in
  `assets/js/data-explorer/menu.js` writes the URL before it sends `click_option`, so each map
  event carries the full selection after the change. `[verified 2026-10-16, arm B: map_measure
  ?…MeasureID=1197&GeoType=CD&TimePeriodID=298…, map_geo …GeoType=Borough…, map_time
  …TimePeriodID=296…; each moved only the value its control sets]` Holds with the setting off
  as well (dev stream, above).

**`option_label` (Chris, 2026-10-16; `aa448afa19`).** The three map-menu `click_option` events also send
`option_label`, the menu text clicked, for readable reports. IDs and `IndicatorID` were not added:
`page_location` already carries both. An `option_value` ID parameter was proposed and dropped for
that reason. GA side: an event-scoped custom dimension on parameter `option_label`, which Chris
created on both properties, dev (`G-PB98MPZ31B`) and production (`G-64BWDRHRGB`), on 2026-10-16;
admin-side, not observable from the page. Code: `trackDataExplorerOption` in `assets/js/data-explorer/global.js` takes optional
extra params; `handleSelection` takes the item's `label`.
`[verified 2026-10-16: npm run lint exit 0; served menu.dd3dbf1d0f529b3c.js contains
option_label; both arms on the new explorer: map_measure "Number", map_geo "Borough",
map_time "2022" — the same selection the map PNG's filename names — and the other six
click_option events unchanged, with no option_label]`

**Table downloads and chart saves now tracked (Chris, 2026-10-16; `3d0ae9ba77`).** Findings 3
and 5.
`downloadTableData` in `table.js` sends `file_download` with `link_text: "Current table view"`,
the old explorer's label for the same action, so that series continues across the cutover; its
file name comes from `getTableDownloadFileName`, which the `csvHtml5` button's `filename` also
uses. A delegated listener in `bindPrintControls` (`print.js`) sends `file_download` for
vega-embed's "Save as PNG" / "Save as SVG" links in the chart preview, with vega-embed's own
link text and file name (`visualization.png` / `.svg`, its default, left unchanged). The old
explorer never tracked chart saves, so these values are new. Both file names changed afterwards,
in review fixes R1 and R7 below.
`[verified 2026-10-16: npm run lint exit 0; served table.ac6d67ea7957a86b.js and
print.206589119e588af8.js carry the new code; real mouse clicks, arm A for all three and arm B
for the table and PNG: one file_download each, and each file_name equals the browser's saved
filename. The first SVG attempt read NOT FOUND because the probe's second click on the menu's
summary closed it; re-run opening it only when closed]`

D19 item 3 in the deploy plan now points at
[D19 item 3, corrected](#d19-item-3-corrected).

### Review fixes

A `/code-review` of `e479d59c1a..be84615033` (2026-10-16) returned 12 findings. Chris chose a fix
for each on 2026-10-16; the rejected options are listed so they are not re-proposed.

| R | Finding | Decision (Chris) | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| 1 | `table.js`: GA `file_name` is the raw indicator name; Buttons strips `: + " ' / % >` from the saved file, and the button's name is fixed at render | Button's `filename` gets the function; GA takes the name from `buttons.exportInfo()`. Rejected: copy Buttons' regex; fix the comment only | `fe5eb17dec` | **DONE 2026-10-16** | Probe ([below](#review-fix-probe)): before, saved `… Heat stress deaths (filtered).csv` against GA `… Heat stress: deaths (filtered).csv`; after, both `… Heat stress deaths (filtered).csv`. The reload race was not exercised |
| 2 | Audit, D19 item 3 list: "its file name unchanged" is false (`(filtered table)` → `(filtered)`) | Correct the doc line and narrow the `table.js` comment to `link_text`. Rejected: send the old string | `fe5eb17dec`, `3c6ff56335` | **DONE 2026-10-16** | Doc and comment only; item 4 of [D19 item 3, corrected](#d19-item-3-corrected) rewritten |
| 3 | `option_label` dimension recorded on the dev property only | Chris created it on production (`G-64BWDRHRGB`) too; record it | `3c6ff56335` | **DONE 2026-10-16** | Chris's report; admin-side, not observable from the page. Recorded in the `option_label` paragraph above and in D19 |
| 4 | vega-embed sets the export href in an async `mousedown`, so keyboard Enter or a fast click may save the page while GA counts a save | Browser test first, then a fix. After the test: a `keydown` listener in `bindPrintControls` builds the image with the stored embed's `view.toImageURL`, then clicks the link. Future direction, not scheduled: explorer-owned save buttons replacing vega-embed's export actions, which would also retire R6's dependency. Rejected: skip tracking unready links (keyboard users still get the page); document only | `fe5eb17dec` | **DONE 2026-10-16** | Probe: before, keyboard Enter saved the page HTML (123,479 B, `<!DOCTYP`) as `visualization.png` and GA counted it; a Playwright click and a slow-click control (1.5 s between mousedown and mouseup) each saved a 9,026 B PNG, so the fast-click half did not reproduce on this chart. After, keyboard Enter saved the 9,026 B PNG with one `file_download`; both clicks unchanged. PNG only: the SVG keyboard path was not run |
| 5 | Audit: duplicated paragraph in this Ledger section | Delete the second copy | `3c6ff56335` | **DONE 2026-10-16** | Doc only |
| 6 | `print.js`: chart-save selector depends on vega-embed's internal DOM | Comment naming the vega-embed version it matches | `fe5eb17dec` | **DONE 2026-10-16** | Comment only |
| 7 | Chart saves all named `visualization.png` / `.svg` | `downloadFileName` from `getViewDownloadFileName` (`global.js`), the `(<view> view)` form `downloadData` uses. Chrome did rewrite characters, so the name goes through the existing `sanitizeFilename` (`print-map.js`), which the map PNG already uses. Rejected after the test: a second helper with Buttons' character set (built, then replaced); moving `sanitizeFilename` to `global.js`; Buttons' set for every download | `fe5eb17dec` | **DONE 2026-10-16** | Probe: Chrome wrote `Heat stress: deaths (bar view).png` to disk as `Heat stress_ deaths (bar view).png`, and `a+b "q" 's' 1/2 50% x>y.png` as `a+b _q_ 's' 1_2 50% x_y.png`, with a plain control name unchanged. After, the `download` attribute, the saved name and GA `file_name` all read `NYC EH Data Portal - Heat stress deaths (bar view).png` |
| 8 | `renderChartPreview` re-embeds without `finalize()`, leaking a document click listener per open | Keep the embed result on `DE.print`; finalize before re-embedding | `fe5eb17dec` | **DONE 2026-10-16** | Probe, document `click` listeners via CDP `DOMDebugger.getEventListeners` across three modal opens: before 3 → 4 → 5 → 6, after 3 → 4 → 4 → 4 |
| 9 | `href="#"` download links with no `preventDefault` | Browser test (URL, `history.length`, `popstate`); if confirmed, `return false;` on all four. Rejected: `<button type="button">` | `fe5eb17dec` | **DONE 2026-10-16** | Probe: before, the table and chart-data links each added `#` to the URL, one history entry and one `popstate`; after, none. Also changed `setCorrelateActionState`'s lookup in `correlate.js` from `a[onclick="downloadData()"]` to a prefix match, which the new attribute would otherwise have broken silently: after, prefix matches, the old exact selector does not |
| 10 | `menu.js` comment states GA's `page_location` behavior with no date | Append `(observed 2026-10-16, documents/de-analytics-audit-2026-10-16.md)` | `fe5eb17dec` | **DONE 2026-10-16** | Comment only |
| 11 | Findings 3 and 5, and D19, describe gaps `3d0ae9ba77` closed, in the present tense | One "Fixed in `3d0ae9ba77`" line under each; findings keep their measured wording. Rejected: rewrite in past tense | `3c6ff56335` | **DONE 2026-10-16** | Doc only |
| 12 | "(dev stream, below)" points to a bullet above it | "below" → "above" | `3c6ff56335` | **DONE 2026-10-16** | Doc only |
| 13 | Found while testing R7: `downloadData` (`global.js`) names its CSV from the raw indicator name, and Chrome saved `Heat stress_ deaths (bar view).csv` where GA got `Heat stress: deaths (bar view).csv` | Name it with `getViewDownloadFileName`, as R7 does | `fe5eb17dec` | **DONE 2026-10-16** | Probe: after, saved name and GA `file_name` both `… Heat stress deaths (bar view).csv` |

<a id="review-fix-probe"></a>`[verified 2026-10-16: npm run lint exit 0. A temporary Playwright script on an isolated
dev_stage server (:8090, -d and HUGO_RESOURCEDIR outside the repo), indicator 2074 "Heat stress:
deaths" on weather-related-illness, bar preview, Google hosts aborted and dataLayer read (arm A),
run on be84615033 and on the changed tree; the final run served global.c332bc173c1977a5.js,
table.c0537af9c1aeaea7.js, print.a8bf818bdf036ab3.js, menu.26b899e7aef995bd.js and
correlate.5c2e4622885d4bba.js; no page errors. Disk names read from a Chrome download directory
set through CDP Browser.setDownloadBehavior. Curated smoke (node scripts/smoke-pages.mjs with
DE_BASE_URL at that server) passed 44 of 44 on the final tree, Pagefind absent and allowlisted;
npm run docs-check exit 0.]` One indicator, one chart view, Chromium on Windows only.

## Findings

Every finding below was observed in arm B (what `gtag.js` sends) and, for events the code sends,
in arm A (what the code calls) as well. One indicator, one session per explorer; see
[Limits](#limits).

### 1. The new explorer sends a `page_view` for every selection change

In the same scripted session the old explorer sent **1** `page_view` and the new one sent **10**,
each carrying a different query string (`MeasureID`, `GeoType`, `TimePeriodID`, `overlay`). The
new explorer writes each selection into the URL with `history.pushState` or `replaceState`
(`assets/js/data-explorer/app.js`, `writeHistoryState`); the old one changes only the hash.

The `page_view`s are not in the explorer's code — arm A's `dataLayer` holds no `page_view` call
on either explorer — so they come from `gtag.js`. Both properties' tag configurations, fetched
2026-10-16 from `googletagmanager.com/gtag/js?id=…`, carry `"vtp_enableHistoryEvents":true`
(dev `G-PB98MPZ31B` and production `G-64BWDRHRGB`). The dev configuration's
`"vtp_enableScroll":true` matches the `scroll` event arm B recorded, which is the reason to read
those flags as the live settings.

Consequence: page-view counts for explorer pages will rise at cutover without any change in
traffic, and page reports keyed on the full URL will split one visit across many rows. Not in D19.

### 2. `click_tab` values change, and a repeat click is no longer counted

| | Values sent |
|---|---|
| Old | `map`, `trend`, `links`, `table` |
| New | `bar`, `trend`, `links`, `table` |

`map` stops and `bar` starts: the new explorer has no map tab (the map sits beside every view).
Clicking the tab that is already open sent nothing on the new explorer and `click_tab` again on the
old: `assets/js/data-explorer/de-tab-content.js` collapses the open pane and calls
`stopImmediatePropagation()`, so `app.js`'s tracking listener never runs. Not in D19.

### 3. Table downloads are no longer tracked

The old explorer's table download sent `file_download` with `link_text: "Current table view"`. The
new one's ("Download data" in the table pane) sent **no event** in either arm. It triggers
DataTables' stock `csvHtml5` export (`downloadTableData` in `table.js`), which has no tracking
call, and GA4's own download tracking did not record it either. D19 lists "Current table view" as
a dropped `link_text`, which reads as a relabel; the action itself is now untracked.

Fixed in `3d0ae9ba77`: `downloadTableData` sends `file_download` with `link_text: "Current table
view"` ([Ledger](#ledger)).

### 4. "Raw data for this indicator" was already not firing

The `#rawData` link is commented out in the old explorer's template, on this branch and on
`origin/production`'s live `data-explorer/single.html`. Its `file_download` cannot fire today, so
its absence after cutover is not a change. D19 lists it as one.

### 5. New values that D19 does not list

- `file_download` with `file_extension: ".png"` and `link_text: "Download PNG"`, from the map save
  dialog. Chart saves (bar, trend, correlate) go through vega-embed's own PNG/SVG menu and send
  nothing: the chart dialog never shows the tracked link (`renderChartPreview` in `print.js`
  passes `showDownload: false`). Fixed in `3d0ae9ba77`: chart saves send `file_download`
  ([Ledger](#ledger)); review fix R7 later named them by indicator and view.
- `print_viz` with `chart_type: "bar"`.
- `file_download` "Download chart data" file names end in `(bar view).csv`, where the old explorer
  wrote `(map view)`, `(trend view)` or `(links view)`.

### 6. `click_indicator` sends `IndicatorID` as a number

Old: `ep.IndicatorID = "2414"` (a string parameter). New: `epn.IndicatorID = "2414"` (a numeric
one), because `topic-indicator-selector.js` passes `Number(id)`. Whether a custom dimension built
on the old parameter still fills is a property setting this audit cannot see. Not in D19.

### Matching, for completeness

`click_option` sends the same eight values on both (`map_measure`, `map_geo`, `map_time`,
`trend_comparison`, `links_measure`, `links_disparities`, `table_time`, `table_geo`), plus
`table_sync` on the new explorer only, which D19 lists. `click_citation` and `print_viz`
`chart_type: "map"` match. `click_about` matches D19's description.

### Unexplained, recorded only

- The new explorer sent one `scroll` event (90%) at load; the old sent none. Page height in this
  viewport is the likely difference, not established.
- The new explorer made 41 requests to `www.googletagmanager.com/a` and the old made none. They
  carry no event and no measurement id, so they are not property hits; their trigger is unknown.
- Every hit was sent twice, to `www.google-analytics.com/g/collect` and `www.google.com/g/collect`,
  on both explorers alike. Counts above are of one copy.

## D19 item 3, corrected

What GA readers would need to be told at cutover, on this evidence:

1. Explorer `page_view`s rise, one per selection, each with its own query string (finding 1) —
   unless the GA setting is off by the deploy, as decided above. Then nothing changes here.
2. `click_tab`: `map` ends, `bar` begins; re-clicking the open tab is not counted (finding 2).
3. `click_how_calculated` ends; `click_about` carries `section: how_calculated_and_sources` for the
   combined pane (as D19 says).
4. `file_download`: "Current table view" continues as `link_text`, but its `file_name` changes
   from `… (filtered table).csv`, a name the old explorer's saved file never carried, to
   `… (filtered).csv`, the saved file's name; "Full table for this indicator" ends; map PNG
   downloads begin (`"Download PNG"`), and so do chart saves (`"Save as PNG"` / `"Save as SVG"`,
   file name `NYC EH Data Portal - <indicator> (<view> view).png` / `.svg`); chart-data file names
   say `(bar view)`. File names now drop the characters the saved file drops, so GA's name matches
   the saved one (measured on indicator 2074, "Heat stress: deaths"): the table CSV drops
   `: + " ' / % >` among others (DataTables Buttons' filter), and chart and chart-data names drop
   `< > : " / \ | ? *` (`sanitizeFilename`). On EHDP-data `staging` on 2026-10-16, 29 of 286
   indicator names held a character the table CSV drops (findings 3, 5, the tracking added after
   them, and review fixes R1, R2, R7, R13). Drop "Raw data for this indicator" from the list
   (finding 4).
5. `print_viz` gains `bar`; `click_option` gains `table_sync`, and its three map-menu events gain
   `option_label`; `click_indicator`'s `IndicatorID` becomes numeric (findings 5, 6).

## Method

`[verified 2026-10-16: local_prod hugo server on :8080, tree at e479d59c1a, http://localhost:8080/local-prod/data-explorer{,-old}/asthma/?id=2380, Chromium via Playwright at 1366x900]`

A temporary Playwright script drove the same actions on each explorer: every tab, a trend mode,
a correlate measure, disparities, a table time and geography filter, table sync (new only), each
download, the three map menus, chart and map save, the PNG link, about, citation, and selecting
indicator 2414. Controls were triggered with a DOM `click()` on the element the handler is bound
to, so closed dropdowns ran their real handlers.

- **Arm A:** every request to a Google host aborted, so `gtag.js` never loaded and
  `window.dataLayer` stayed a plain array of the code's own `gtag()` calls, read after each step.
- **Arm B:** only `googletagmanager.com/gtag/*` allowed through; every other Google request aborted
  and recorded with its body, then parsed (`en`, `ep.*`, `epn.*`, `dl`). No hit reached a property.

Corrections made during the run, each because a step returned nothing:

- The old explorer's disparities handler fires only for a `.dropdown-item` inside the
  `.btn-toggle-disparities` wrapper; the first probe clicked the wrapper. Re-run on
  `#show-disparities` inside it: `links_disparities` sent.
- The PNG link was first clicked after a chart save, where it never appears (finding 5). Moved to
  after the map save, with a wait for the link to become visible: `file_download` `.png` sent.

## Limits

- One indicator (2380), one viewport, one session per explorer. Events tied to controls this
  indicator lacks were not exercised.
- `site.js` events (navigation, search, subscribe, language) load on both explorers alike and were
  not compared.
- The probe's Google host match also blocked `translate.google.com` in both arms, so the translate
  widget did not load on either.
- Headless Chromium denied clipboard access (`NotAllowedError` on both explorers); `click_citation`
  was sent regardless.
- The property flags in finding 1 are as served on 2026-10-16; they are property settings and can
  change without a commit here.
