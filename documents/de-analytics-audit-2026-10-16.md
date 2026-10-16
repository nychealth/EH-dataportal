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
confirmed on both streams.**

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
inside the explorer, which the old explorer did not track either. Every selection that changed the URL in pass 2 also sent its own event
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
  as well (dev stream, below).

**`option_label` (Chris, 2026-10-16; `aa448afa19`).** The three map-menu `click_option` events also send
`option_label`, the menu text clicked, for readable reports. IDs and `IndicatorID` were not added:
`page_location` already carries both. An `option_value` ID parameter was proposed and dropped for
that reason. GA side: create an event-scoped custom dimension on parameter `option_label`
(Chris). Code: `trackDataExplorerOption` in `assets/js/data-explorer/global.js` takes optional
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
explorer never tracked chart saves, so these values are new.
`[verified 2026-10-16: npm run lint exit 0; served table.ac6d67ea7957a86b.js and
print.206589119e588af8.js carry the new code; real mouse clicks, arm A for all three and arm B
for the table and PNG: one file_download each, and each file_name equals the browser's saved
filename. The first SVG attempt read NOT FOUND because the probe's second click on the menu's
summary closed it; re-run opening it only when closed]`

D19 item 3 in the deploy plan now points at
[D19 item 3, corrected](#d19-item-3-corrected).

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

### 4. "Raw data for this indicator" was already not firing

The `#rawData` link is commented out in the old explorer's template, on this branch and on
`origin/production`'s live `data-explorer/single.html`. Its `file_download` cannot fire today, so
its absence after cutover is not a change. D19 lists it as one.

### 5. New values that D19 does not list

- `file_download` with `file_extension: ".png"` and `link_text: "Download PNG"`, from the map save
  dialog. Chart saves (bar, trend, correlate) go through vega-embed's own PNG/SVG menu and send
  nothing: the chart dialog never shows the tracked link (`renderChartPreview` in `print.js`
  passes `showDownload: false`).
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
4. `file_download`: "Current table view" continues, its file name unchanged; "Full table for this
   indicator" ends; map PNG downloads begin (`"Download PNG"`), and so do chart saves
   (`"Save as PNG"` / `"Save as SVG"`, file name `visualization.png` / `.svg`); chart-data file
   names say `(bar view)` (findings 3, 5, and the tracking added after them). Drop "Raw data
   for this indicator" from the list (finding 4).
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
