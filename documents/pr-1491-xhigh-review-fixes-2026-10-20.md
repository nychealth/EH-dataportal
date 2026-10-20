# PR #1491 xhigh review fixes (2026-10-20)

**Status as of 2026-10-20: Tasks 0 to 4 done (Task 0's claim 30 reproduced only in part); Tasks 5 to V not started.** Chris answered all seven open decisions on 2026-10-20
(see [Decisions answered by Chris](#decisions-answered-by-chris)). Finding 17 is parked. Finding 31 waits on a screenshot
comparison that Task 10 produces.

Source: `/code-review xhigh #1491 --max-findings all`, run 2026-10-19 23:53 local against head `13fa8d6016`, merge-base
`06b38225b1`. It reported 31 findings, all of them static: lint, plus a tally of the live EHDP-data report JSONs. None was
checked in a browser. The reviewer's full text is the last assistant message in
`~/.claude/projects/c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge/c5623a61-8a7c-43c3-ac12-5383aa2bad81/subagents/agent-a8adb6362f930c608.jsonl`.
A verbatim copy, with each finding's full failure scenario, is in
[pr-1491-xhigh-review-findings-2026-10-19.md](pr-1491-xhigh-review-findings-2026-10-19.md). Read the scenario there before
reproducing a finding in Task 0. Chris's verdict on each finding is quoted verbatim in the [Findings](#findings) table.

Predecessor: [pr-1491-review-fixes-2026-10-17.md](pr-1491-review-fixes-2026-10-17.md), closed. Its decisions still stand
unless a row below reverses one, and finding 17 reverses its F5.

Line numbers below are the reviewer's, at `13fa8d6016`. Each task also names a symbol, so it can still be found once lines move.

## Findings

| # | Finding (reviewer, condensed) | Chris | Task |
|---|---|---|---|
| 1 | CSV download no longer sends GA `file_download` (`app.js` `downloadCSV`) | "Add gtag" | 1 |
| 2 | Panel expand no longer sends GA `click_modal` (`chart.js` `onAccordionExpand`) | "Add gtag" | 1 |
| 3 | Report map switches neighborhood in place; head metadata keeps the old neighborhood; Back skips the switch; no `page_view` for the new report; reviewer proposes full navigation instead | "Does this change the SPA-esque functionality? I want to preserve that, and fix whatever's wrong or bad." | 2 |
| 4 | `nr-postswap-check.mjs` `extractReport` reads `<h3>`; template now renders `<h2 class="h4 fs-rg">` | "Fix" | 7 |
| 5 | `totalFetches` counts the viz fetch only when `vizUrl` is set; `loadVizData` calls `checkAllLoaded()` either way (latent) | "Fix" | 3 |
| 6 | `nr-characterization.mjs` waits on `#nr-header-neighborhood`, now server-rendered, so the wait is a no-op and the expand step races the card render | "Fix" | 7 |
| 7 | EHDP-data strings concatenated into `innerHTML` unescaped (`cards.js` `buildIndicatorCard`, `report.js:97`) | "Fix with DOMPurify.sanitize" | 4 |
| 8 | Indicator rows no longer server-rendered: no-JS readers see empty sections, runtime dependency on raw.githubusercontent.com, data pushes go live without a rebuild | "Intended, removes an awkward build loop. Might be documented in a plan. Same failure mode as the Data Explorer." | 11 |
| 9 | GeoJSON `.catch` in `map.js` also catches `tryInitialRender()` throws, mislabels them, and re-runs `renderAll` | "Fix" | 3 |
| 10 | A polygon clicked after map-ready but before data-ready is styled selected with `aria-current`, then the initial render silently drops it | "Fix" | 3 |
| 11 | `chart.js` re-queries `#map-nr-acc-N` after `vegaEmbed` settles; after a switch that id belongs to another neighborhood's panel | "Fix" | 3 |
| 12 | Geocode concatenated unquoted into a Vega expression (`chart.js:39`) | "Fix" | 3 |
| 13 | `nr-postswap-check.mjs --limit` with no/non-numeric value checks 0 pages and reports PASS | "Fix" | 7 |
| 14 | `nr-postswap-check.mjs` usage documents `/EH-dataportal/`, a prefix no environment serves | "Fix" | 7 |
| 15 | `nr-postswap-check.mjs` ends with `process.exit()` after network activity (lines 211, 269) | "Fix" | 7 |
| 16 | `nr-characterization.mjs --baseline` deletes the committed baseline dir before capturing; an uncaught `goto` timeout leaves it half-deleted | "Fix" | 7 |
| 17 | Cards wait for the viz table and `topic_indicators.json`, which they don't need | "Fix"; then, 2026-10-20: "keep deferring 17" | 5, **parked** |
| 18 | Each chart spec fetches `UHF42.topo.json` twice and `borough.topo.json` once, by URL | "Fix" | 5 |
| 19 | `NR_REPORT_CONFIG.neighborhoodMap` duplicates the `neighborhoods` global from `lib-uhflist` | "Fix" | 5 |
| 20 | `nr-leaflet.html` `removeHiddenMapFromTabOrder` runs only on GeoJSON success; zoom links focusable inside `aria-hidden` until then | "Fix" | 6 |
| 21 | `nr-leaflet.html` hover-out resets the neighborhood index's own highlight; no `aria-current` there | "Fix" | 6 |
| 22 | A failed section fetch reads as "No data available for this neighborhood." | "Fix" | 3 |
| 23 | `pagefind-characterization.mjs` defaults to `local_prod`, whose `maxAge = -1` makes results depend on the machine's cache | "Change maxAge = 0. I'm the only consumer of local_prod." | 8 |
| 24 | `.gitignore` ignores `.claude/` while two files in it are tracked | "Fix" | 9 |
| 25 | Lockfile downgrades playwright/playwright-core 1.62.1 → 1.62.0 and drops sha.js metadata | "Restore" | 8 |
| 26 | Root-level working files reach production: `EHDP feedback for MOD-Lab.md`, `README-MOD.md`, `.cursor/` | "Add stale files to gitignore" | 9 |
| 27 | Changelog-style comments (`tertiles.js:45`, `:72`; `map.js:78-80`) and comments made false by merge (`report.js:15`, `_de-custom.scss:137`) | "Should we update or remove these?"; then, 2026-10-20: "update comments" | 10 |
| 28 | `dev-server.mjs`: merge restored older wording over production's, added unused `const onExit` | "Fix" | 10 |
| 29 | `chart.js:58` `format.parse.Value` names a field the data lacks | "Fix" | 10 |
| 30 | `nr-a11y-audit.mjs:563` QR selector `#nr-qrcode img` matches nothing; the id is `qrcode` | "Fix" | 7 |
| 31 | `nr-report.html:179` class `mb-` | "Change to whatever might have been intended"; then, 2026-10-20: "let's see if it needs a bottom margin" | 10, screenshots for Chris |

## Decisions answered by Chris

All answered 2026-10-20.

| Item | Question | Answer | Effect on the plan |
|---|---|---|---|
| 17 | Fix now, reversing the 2026-10-17 plan's F5 deferral? | "keep deferring 17" | **Parked.** Cards keep waiting for the viz fetch. Same un-park condition as F5: the planned refactor of how report data arrives. |
| 3, Back button | `pushState` so Back returns to the previous neighborhood, or keep `replaceState`? | "Back should go back to previous neighborhood" | Task 2 uses `pushState` plus a `popstate` handler. |
| 3, GA `page_view` | Send a manual `page_view` on each switch? (The production stream's history events are **off**: `"vtp_enableHistoryEvents":false`, `de-analytics-audit-2026-10-16.md` §Ledger, `[verified 2026-10-16 16:26 UTC]`.) | "yes send a page view" (2026-10-20). `b8b572b6d3` had recorded this as "taken with the pushState answer", which was wrong: the row was never among the questions shown to Chris, so it was re-asked | Task 2 step 5 sends it. Step 1 re-checks the flag first, because with history events on, `pushState` would make the manual hit a double count. |
| 26 | Untracking deletes the files from other clones that pull the branch, including MOD-Lab's. Acceptable? | "Yes, i think they're using Claude now, but i also think our agent setup supercedes theirs" | Task 9 untracks all four, `.cursor/` included. |
| 27 | Update or remove the comments? | "update comments" | Task 10 rewrites them: state what the code does and why, with no dates, no "used to", and no references to production or to other branches. |
| 31 | Remove `mb-` or pick a margin? | "let's see if it needs a bottom margin" | Task 10 produces screenshots for Chris to choose from. The intent can't be recovered from the repo: `mb-` arrived bare in `d6f99e19ea` and no commit gave it a number `[verified 2026-10-20: git log -S'd-none d-md-block mb-' -- themes/dohmh/layouts → one commit]`. |
| 22, copy | "This section could not be loaded. Please try again later." OK? | "yes" | Task 3 uses that text. |

## Decisions taken in writing this plan

| # | Decision | Rejected | Why |
|---|---|---|---|
| 3 | Keep the in-place switch and fix what it gets wrong | Reviewer's proposal: navigate to the generated page, as `nr-leaflet.html` does on the other NR pages | Chris: preserve the SPA feel |
| 3 | Rewrite `<link rel=canonical>`, `og:url`, `og:title`, `twitter:title` and `meta description` (only if it names the neighborhood) on a switch. **Deferred:** the JSON-LD `BreadcrumbList`, whose parent item names the neighborhood index (`structured-data.html`, `.Title` / `.Permalink` of ancestors) | Rewriting JSON-LD too | A crawler fetches each `<nbhd>/<topic>/` URL directly and gets that page's own correct JSON-LD. The rewritten head matters only to in-browser readers of the DOM (share tools, extensions), and the plan assumes none of them reads JSON-LD. **Unverified assumption.** Un-defer if a share or SEO tool is found reading it after load. |
| 1, 2 | One `trackNREvent(name, params)` helper in `assets/js/nr-report/global.js`, modelled on the data explorer's `trackDataExplorerEvent` (`assets/js/data-explorer/global.js`), with the same `typeof gtag !== 'function'` guard. No environment gate. | Porting production's `$envs` gate (`slice "Production" "production" "prod_prod" "development"` in `nr-indicator-new.html`) | `head.html` now defines `gtag` on every environment and routes non-`prod_prod` hits to the dev stream `G-PB98MPZ31B`. The explorer sends ungated on the same basis. |
| 1, 2 | Payloads identical to production's: `file_download` `{file_name, file_extension: '.csv', link_text: 'Download Report Data'}`; `click_modal` `{modal_name: indicator_short_name}` | New names or params | GA reports keyed on them continue unbroken |
| 7 | Sanitise every EHDP-data `innerHTML` sink in `assets/js/nr-report/`, including `demographics.js:72` (`metric.format(d[metric.field])`), which the reviewer did not list | Only the sinks the reviewer named | A grep for `innerHTML` across `assets/js/nr-report/*.js` returns 10 lines: 5 static strings in `chart.js`, 2 clears, and 3 data sinks (`report.js:89`, `report.js:97` → `buildIndicatorCard`, `demographics.js:72`) `[verified 2026-10-20 at 13fa8d6016]`. Re-run the grep in Task 4, since the count is a claim. |
| 10 | Queue the early click: record the clicked neighborhood, and have `tryInitialRender` render it in place of the page's own | Ignoring clicks until data is ready | The user asked for that neighborhood. Ignoring the click means they have to click again, with no sign the first one was dropped. |
| 25 | Put back production's `playwright`, `playwright-core` and `sha.js` lockfile entries by hand, and keep the branch's acorn 8.18.0 / eslint 10.8.0 / globals 17.8.0 / wkt-parser 1.5.6 entries | `git checkout production -- package-lock.json` | A whole-file restore also drops those four upgrades `[verified 2026-10-20: git diff production -- package-lock.json]`. The reviewer flagged only the downgrades. `npm install playwright@1.62.1` was rejected because `--save-*` rewrites ranges (project CLAUDE.md). |

## Order and file overlap

Tasks share files, so run them in this order: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → V**.

- `report.js`: Tasks 2, 3, 4
- `map.js`: Tasks 2, 3
- `chart.js`: Tasks 1, 3, 5, 10
- `nr-report.html`: Tasks 2, 5, 10

Task 2 consumes `trackNREvent` from Task 1. Commit each task on its own, never batched with an approval-gated command.

---

## Task 0: Evidence pass (no code)

Reproduce each runtime claim before fixing it. A claim that does not reproduce is dropped from scope, and the row says so.
Write the predictions in the Ledger's Proof column **before** running anything.

Use a `dev_stage` server through `ensureDevServer()`, except Task 7's `nr-postswap-check.mjs`, which needs production data
(`development`). Write a scratch Playwright probe in the session scratchpad. It is not kept.

| Claim | Prediction if real |
|---|---|
| 3 | After an Enter-key switch on `east_harlem/asthma_and_the_environment/` to Kingsbridge - Riverdale: `link[rel=canonical]`, `og:url` and `og:title` still say East Harlem, and `history.length` is unchanged |
| 4 | `node scripts/nr-postswap-check.mjs --limit 2` against a `development` server exits 1 with "report topic N" mismatches reading `''` |
| 9 | With a temporary `throw` in `buildIndicatorCard`, the console shows "Error loading UHF42 GeoJSON" and the throw appears twice |
| 10 | Throttle the section JSONs with route delay, click a polygon after the map draws: it gets `aria-current`; after render, the page's own neighborhood is selected |
| 11 | Expand panel 3, switch neighborhood while a delayed topojson is pending, then let that request fail: the new panel 3 reads "Unable to render chart." |
| 13 | `node scripts/nr-postswap-check.mjs --limit` prints "Checking 0 of 210" and exits 0 |
| 20 | On the NR landing page (`/neighborhood-reports/`) with the GeoJSON request aborted, Tab reaches the zoom links inside `aria-hidden`. *Corrected 2026-10-20: this row first named a neighborhood index, but the finding is about the `aria-hidden` picker map on the landing page and topic indexes, and a neighborhood index's map is not hidden.* |
| 21 | On a neighborhood index, after hovering on and off the page's own polygon, its stroke is black/1.5 and no polygon has `aria-current` |
| 22 | With one section JSON answered 404, that section reads "No data available for this neighborhood." |
| 30 | `document.querySelector('#nr-qrcode img')` is `null` on a report page; `#qrcode img` is not |

Claims 5, 6, 12, 15 and 16 are argued from code. Each task cites the lines it read in its Proof cell. Do not run 16 for real,
because it deletes the committed baseline.

Step 1 also records a pre-change baseline at `13fa8d6016`: `npm run lint`, `node scripts/nr-characterization.mjs --check`
and `node scripts/smoke-pages.mjs`, each with its exit code.

## Task 1: Restore the two GA events (findings 1, 2)

**Files:** `assets/js/nr-report/global.js` (new `trackNREvent`), `assets/js/nr-report/app.js` (`downloadCSV`),
`assets/js/nr-report/chart.js` (`onAccordionExpand`).
**Produces:** `trackNREvent(eventName, eventParams)`, consumed by Task 2.

1. Add `trackNREvent` beside the other shared helpers in `global.js`, modelled on `trackDataExplorerEvent`.
2. In `downloadCSV`, after the click, send `file_download` with `file_name` set to the anchor's `download` value.
3. In `onAccordionExpand`, send `click_modal` with `modal_name` set to the row's `indicator_short_name`. Read production's
   `nr-indicator-new.html` (`git show production:themes/dohmh/layouts/partials/nr-indicator-new.html`) to confirm whether
   "expand all" fired one event per panel. Match whatever it did.
4. **Proof:** a Playwright probe wrapping `window.gtag` to record calls: one download gives one `file_download` with the
   expected params; expanding panel 1 gives one `click_modal` with that indicator's short name. `npm run lint` exit 0.

## Task 2: Fix the in-place neighborhood switch (finding 3)

**Files:** `assets/js/nr-report/url.js` (`setNeighborhoodInURL`, new head-metadata updater),
`assets/js/nr-report/report.js` (`renderAll`, `announceNeighborhoodChange`), `assets/js/nr-report/app.js` (popstate
listener, if Chris approves `pushState`).
**Consumes:** `trackNREvent` (Task 1).

1. Re-check the GA flag: fetch `https://www.googletagmanager.com/gtag/js?id=G-64BWDRHRGB` and the same for `G-PB98MPZ31B`,
   and grep each for `vtp_enableHistoryEvents`. If either reads `true`, a manual `page_view` double-counts on that
   stream. Stop and report.
2. In `renderAll`, move the `document.title` rewrite ahead of the URL write. At `13fa8d6016` the URL write is
   `setNeighborhoodInURL` (`report.js:244`) and the title rewrite is in `announceNeighborhoodChange` (`report.js:258`).
3. Rewrite `link[rel=canonical]` and `meta[property="og:url"]` to the new absolute URL, and `og:title` / `twitter:title`
   to the new title. Rewrite `meta[name=description]` only if the served value names the neighborhood. Check one built
   report page first.
4. History: `pushState` with `{neighborhood: name}` plus a `popstate` handler that re-renders from `event.state`
   (Chris, 2026-10-20). The first render must still use `replaceState`, as it does now, so loading a page adds no history
   entry. It should also seed `{neighborhood: <page's own>}` as state, so Back to the first entry has something to restore.
   The `popstate` re-render must not push again.
5. After the URL and title update, send `page_view` through `trackNREvent` with `page_location: location.href` and
   `page_title: document.title`. Skip it on the initial render, because `gtag('config')` already counted that load.
6. **Proof:** a Playwright probe on `east_harlem/asthma_and_the_environment/`, switching with Enter to Kingsbridge - Riverdale.
   It checks: canonical, og:url and og:title name Kingsbridge; `document.title` changes before the `page_view` call
   (record the order in a `gtag` wrapper); exactly one `page_view` per switch and none on load; with `pushState`, Back
   restores East Harlem's h1, URL and canonical without a navigation (`performance.getEntriesByType('navigation').length`
   unchanged). Back then Forward re-shows Kingsbridge, and neither sends a second `page_view` beyond the one per
   rendered switch. Control: the same probe at `13fa8d6016` fails the canonical and `page_view` checks.

## Task 3: Render-pipeline correctness (findings 5, 9, 10, 11, 12, 22)

**Files:** `assets/js/nr-report/app.js` (`totalFetches`), `assets/js/nr-report/data.js` (`loadVizData`, `loadSection`'s
`.catch`), `assets/js/nr-report/map.js` (GeoJSON `.then`/`.catch`, click handler), `assets/js/nr-report/chart.js`
(`vegaEmbed` settle handlers, the `geo_join_id` filter expression), `assets/js/nr-report/report.js` (the empty-section
branch).

1. **5:** make `totalFetches` and the completion calls agree. Count the viz fetch whenever `loadVizData` will call
   `checkAllLoaded()`, which it does unconditionally.
2. **9:** split success and failure with `.then(onOk, onErr)` so a throw from `tryInitialRender` is not caught as a map-load
   failure. `onErr` keeps today's "map unavailable, still render" behaviour.
3. **10:** if a click arrives with `mapReady && !dataReady`, store the neighborhood and return without selecting.
   `tryInitialRender` renders the stored one if set, otherwise the page's own.
   **Note from Task 2 (`9c89f95642`):** `renderAll` treats a render with `previousNeighborhood === ''` as first paint, so a
   stored neighborhood drawn that way gets `replaceState`, no title or head rewrite and no `page_view`. Render the page's own
   neighborhood first and then the stored one as a switch, or pass the switch through explicitly; the probe for 10 must read
   canonical and `document.title` as well as `aria-current`.
4. **11:** capture the destination element before calling `vegaEmbed`. On resolve or reject, act only if
   `el.isConnected` is still true. Task 0 reproduced this through the **resolve** handler, not the reject one: Vega logs a
   failed topojson load as `WARN Loading failed` and `vegaEmbed` still resolves, so the stale `.then` relabelled the new
   neighborhood's panel 3 export button with the old indicator's name. The Task 3 probe has to check the summary's
   `aria-label`, because the chart text does not change.
5. **12:** build the filter as `'datum.geo_join_id == ' + JSON.stringify(geocode)`. Before committing, check that
   `geo_join_id` is numeric in the data and that the comparison still matches. Vega's `==` coerces types, but a quoted
   number compared with a numeric field needs a browser check.
6. **22:** in `loadSection`'s `.catch`, store a failure marker instead of `{}`. `report.js` renders a distinct message.
   The copy is "This section could not be loaded. Please try again later." (Chris approved it 2026-10-20.)
7. **Proof:** re-run the Task 0 probes for 9, 10, 11 and 22, which should now pass, plus a probe for 12 using an expanded
   chart that renders a highlighted neighborhood. `npm run lint` exit 0.

## Task 4: Sanitise EHDP-data markup (finding 7)

**Files:** `assets/js/nr-report/report.js` (sinks at the empty-section branch and the card write),
`assets/js/nr-report/demographics.js` (`metric.format` write).

1. Re-run `git grep -n innerHTML -- assets/js/nr-report` and classify every hit as static, clear, or data.
2. Wrap each data sink's value in `DOMPurify.sanitize(...)`. `DOMPurify` is loaded by `head.html`. **Correction 2026-10-20:**
   it is *not* in `eslint.config.mjs`'s `NR_EXTERNAL_GLOBALS`. Its one hit there, `eslint.config.mjs:26`, is in
   `DE_EXTERNAL_GLOBALS`, the data explorer's list. Add it to the NR list, as Task 1 added `gtag`. The card markup string
   is built in `assets/js/nr-report/cards.js` (`buildIndicatorCard`), which has no `innerHTML`; the sink that writes it
   is in `report.js`.
3. **Proof:** a browser probe in which a stubbed report JSON row with `indicator_short_name: 'X<img src=x onerror=window.__xss=1>'`
   leaves `window.__xss` undefined. Real data must render unchanged: a report page carrying `N/A<1%*` still shows that
   literal text. Find the page with a grep over the production report JSONs, as the reviewer did. `node scripts/nr-characterization.mjs --check` passes.

## Task 5: Efficiency and reuse (findings 17, 18, 19)

**Files:** `assets/js/nr-report/app.js`, `assets/js/nr-report/data.js` (17); `assets/js/nr-report/chart.js`, which builds
the spec's `UHF42.topo.json` / `borough.topo.json` data entries (18); `assets/js/nr-report/url.js`
(`slugForNeighborhood`), `themes/dohmh/layouts/neighborhood-reports/nr-report.html` (`neighborhoodMap`) (19).

1. **17, parked 2026-10-20** ("keep deferring 17"). Skip it. When the data-loading refactor un-parks it, the shape is:
   render the cards when the section fetches finish, and fill the "Full dataset" links and enable charts and CSV when the
   viz table and `topic_indicators.json` arrive. Keep the 2026-10-17 step 4 behaviour: a failed viz fetch still disables
   Download and shows "Chart data could not be loaded."
2. **18:** fetch both topojson files once per page (memoised promise) and pass them to the spec as inline `values` with
   the same `format`. **Proof:** with "Expand all", count requests to each topojson URL in the network log (expect 1
   each), and the charts still render.
3. **19:** replace `reportConfig.neighborhoodMap` lookups with `neighborhoods.find(n => n.UHF_name === name)?.page_name`,
   and remove `neighborhoodMap` from the template. First confirm that `lib-uhflist` loads before the NR scripts on the
   report page. **Proof:** `git grep -n neighborhoodMap` returns nothing; lint exit 0; the Task 2 switch probe still passes.

## Task 6: `nr-leaflet.html` keyboard and highlight (findings 20, 21)

**Files:** `themes/dohmh/layouts/partials/nr-leaflet.html` (`removeHiddenMapFromTabOrder` call site, the reset-highlight
handler). Related site-wide audit rows: A-134 / G2-60 (`aria-hidden-focus` on the picker map). Do not change their
status here; that audit is the status record for `production`.

1. **20:** call `removeHiddenMapFromTabOrder` once right after `L.map(...)` as well as in its current place, so the zoom
   control is covered.
2. **21:** in the reset handler, restore the highlight style when the layer is the page's own neighborhood, and give that
   polygon `aria-current="page"`, mirroring `map.js`'s fix.
3. **Proof:** the Task 0 probes for 20 and 21 now pass; `npm run a11y:nr`, comparing `aria-hidden-focus` against Task 0's
   run.

## Task 7: Harness scripts (findings 4, 6, 13, 14, 15, 16, 30)

**Files:** `scripts/nr-postswap-check.mjs`, `scripts/nr-characterization.mjs`, `scripts/nr-a11y-audit.mjs`.

1. **4:** read section headings from `h2` (or the class the template uses), whichever selects exactly the report-topic
   headings. Check against one page's DOM before relying on it.
2. **13:** reject a missing or non-numeric `--limit` value with a usage message and exit 2.
3. **14:** correct the usage line to an environment that exists. `development` serves `/dev-prod/` (project CLAUDE.md).
4. **15:** `main()` returns its code and the caller sets `process.exitCode`, on every exit path (the form in
   `scripts/nr-r14-probe.mjs`).
5. **6:** wait for `.card-header`, which is what `nr-a11y-audit.mjs` waits on, instead of `#nr-header-neighborhood`.
6. **16:** `--baseline` captures into a temp directory and replaces the committed baseline directory only after every
   target succeeds. Catch `page.goto` failures and exit non-zero naming the target.
7. **30:** change the selector to `#qrcode img`, and drop the `.print-only img` fallback so a wrong selector fails instead of
   matching some other image.
8. **Proof:** `node scripts/nr-postswap-check.mjs --limit 2` against a production-data server reports non-empty headings
   and no "report topic N" mismatch; `--limit` alone exits 2. *Corrected 2026-10-20: this first said `--limit 2` "exits 0",
   but it cannot. EHDP-data has moved since the pre-capture: in Task 0 the two pages also differed on two indicator rows
   whose year went from 2024 to 2025 (Ozone, PM2.5), so the run exits 1 whatever the heading fix does. Whether to
   re-take `scripts/nr-output-precapture/capture.json` is out of scope here.* `node scripts/nr-characterization.mjs --check` 3 of 3; a `--baseline` run with `DE_BASE_URL` pointed at a dead port
   leaves `git status -- scripts/nr-characterization-baseline/` clean; `npm run a11y:nr` reports the QR alt from `#qrcode`.

## Task 8: Config and lockfile (findings 23, 25)

**Files:** `config/local_prod/config.toml`, `scripts/pagefind-characterization.mjs` (comment near the default
environment, reviewer's line 92), `CLAUDE.md` (Environments → "Build caching" bullet, which lists `local_prod` among the
forever-cache environments), `package-lock.json`.

1. **23:** set `maxAge = 0` under `local_prod`'s `getresource` cache. Correct the harness comment: the environment is a
   data-source choice, and a build now always fetches from `http://localhost/EHDP-data/`, so it fails without a local data
   server. Update the CLAUDE.md bullet, then run `npm run docs-check`. Site-wide audit row A-087 tracks `maxAge = -1` on
   `production` and moves only when this merges.
2. **25:** copy production's `node_modules/playwright`, `node_modules/playwright-core` and `node_modules/sha.js` blocks
   (`git show production:package-lock.json`) over the branch's. **Proof:** `git diff production -- package-lock.json`
   shows only the acorn, eslint, globals and wkt-parser entries; `npm ci` exit 0; `npx playwright --version` reads 1.62.1.
   Then run `npx playwright install chromium` if the browser build differs.

## Task 9: Repo hygiene (findings 24, 26)

**Files:** `.gitignore`; untrack `EHDP feedback for MOD-Lab.md`, `README-MOD.md`, `.cursor/commands/readme.md`,
`.cursor/rules/project-context.mdc`.

1. **24:** replace the `.claude/` line with `.claude/settings.local.json` and `.claude/scheduled_tasks.lock`, which are
   the two untracked files there now `[verified 2026-10-20: ls -a .claude]`. **Proof:** `git status --short --ignored
   .claude` lists only those two as ignored, and a scratch `.claude/commands/x.md` shows as untracked. Delete it afterwards.
2. **26** (Chris, 2026-10-20: approved, including `.cursor/`): `git rm --cached` the four files, then add their paths to `.gitignore`. **Proof:**
   `git ls-files | grep -iE '^(EHDP feedback|README-MOD|\.cursor/)'` is empty, and the files still exist on disk.

## Task 10: Comments and dead code (findings 27, 28, 29, 31)

**Files:** `assets/js/nr-report/tertiles.js` (comments above `getTertilePillClass` and in `getTertileLabel`),
`assets/js/nr-report/map.js` (the comment block above `selectLayer` naming `feature-NDHR-prototype`),
`assets/js/nr-report/report.js` (`collectDataNotes` comment), `assets/scss/_de-custom.scss` (comment on the NR
data-note class), `scripts/dev-server.mjs` (header, the two-builders error text, `onExit`),
`assets/js/nr-report/chart.js` (`format.parse.Value`), `themes/dohmh/layouts/neighborhood-reports/nr-report.html`
(`mb-`).

1. **27** (Chris, 2026-10-20: "update comments"): rewrite the five comments as described under Decisions answered by Chris. **Proof:** a grep of those files for
   `Fixed 20\|used to\|production\|feature-NDHR` returns no comment lines.
2. **28:** restore production's header and error wording (`git show production:scripts/dev-server.mjs`), keep this
   branch's code changes, and inline `onExit`. The finding's "unused" is wrong: `process.once("exit", onExit)` on the next
   line uses it `[verified 2026-10-20: scripts/dev-server.mjs:238-239]`. Inlining is still the change, because it is
   production's form and the merge rewrote it for no reason. **Proof:** `git diff production -- scripts/dev-server.mjs` shows code
   only; `node scripts/smoke-pages.mjs` exercises the module.
3. **29:** delete the `format.parse` entry. **Proof:** one expanded chart renders the same in the Task 3 probe.
4. **31** (Chris, 2026-10-20: "let's see if it needs a bottom margin"): screenshot `#nr-report-header` at a desktop
   width (≥768px, where `d-md-block` shows the wrapper) on one report page, with the class removed and with `mb-2` and
   `mb-3`. Toggle the class in the live DOM so one page load gives all three. Then stop and show Chris; the class he picks
   goes in. The `<hr class="mb-2 mt-1">` below the wrapper already sets its own top margin, so expect the differences to
   be small. **Proof:** the three screenshots, and the chosen class in a grep of `nr-report.html`.
5. Comment-only edits are proven with `git diff -w` showing only comment lines (project CLAUDE.md, Refactors). This is
   invalid where a template literal is touched, which none of these files does at the cited lines. Check before relying on it.

## Task 11: Record the no-JS trade (finding 8)

**Files:** `documents/nr-output-retirement-scoping-2026-08-04.md` (§10.4, "Option B or Option D — DECIDED 2026-08-06").

The decision is already recorded: §10.4 `[decided 2026-08-06: team]` says Option D concedes the rates to crawlers that do
not run JS. That section also claims a non-JS crawler still sees "indicator and measure names, and indicator
descriptions". But `nr-report.html` server-renders only the report-topic headings and an empty `<div id="nr-section-N">`
per topic (`range $i, $rt := $reportTopics`) `[read 2026-10-20 at 13fa8d6016]`. The template no longer server-renders
indicator names, so the memo sentence may describe an earlier template or another page kind.

1. Build `development` into a temp directory (isolated build, project CLAUDE.md). Count indicator short names in one
   report page's HTML against the same page's report JSON.
2. If the count is zero, correct the §10.4 sentence and date the correction.
3. Draft one paragraph for the PR #1491 description naming the trade, including Chris's point that the data explorer has
   the same failure mode. Show it to Chris. Running `gh pr edit` publishes it, so Chris approves it first.

## Task V: Verification

At the final commit, with the hash recorded beside each result:

- `npm run lint`, exit 0
- `npm run docs-check`, exit 0
- `node scripts/nr-characterization.mjs --check`, 3 of 3. Expected diffs come from Task 4 only if sanitising changes the rendered text, which the plan predicts it does not.
- `node scripts/smoke-pages.mjs`, 44 clean, Pagefind served. A server `dev-server.mjs` merely reuses serves no index, as in
  Task 0. Either run `npx -y pagefind --site docs` against it, which needs Chris's go-ahead if he started it, or accept
  ABSENT and say so
- `node scripts/pagefind-characterization.mjs --check`. Predicted unchanged: no task touches indexed text.
- `npm run characterize:site:prod_prod`. Task 6 changes focusability and Task 10 may change classes. Predicted no
  `structure` change; any change is read before re-baselining (project CLAUDE.md, "Before re-baselining").
- `npm run a11y:nr`, compared with Task 0's run

## Ledger

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Evidence pass | *no commit*: checks | **DONE 2026-10-20** | At `829e3c5396`, docs-only since `13fa8d6016` (`git diff --stat` touches only the two plan files). **Server:** a `local_prod` server on :8080 that Chris started, reused rather than spawning `dev_stage`, since a second builder is unsafe. Its served `global.js`, `map.js` and `report.js` are byte-identical to this tree's. Production data, so `nr-characterization` checks against `production/`. **Baseline:** `npm run lint` exit 0; `node scripts/nr-characterization.mjs --check` exit 1 on the first run (bayside_little_neck/asthma: `chartCount` 1→0, `expandedPanel` null, accordion ids matching), then exit 0 on two re-runs, which is claim 6's race (below); `node scripts/smoke-pages.mjs` exit 0, 44 clean, **Pagefind index ABSENT** because a reused server gets no index; `npm run a11y:nr` exit 0, controls passed, 0 WCAG violations on all 4 pages, JSON in the session scratchpad (not kept). **Claims**, by Playwright probe on `east_harlem/asthma_and_the_environment/` unless named: **3** reproduced: after Enter on Kingsbridge - Riverdale, URL, `<title>` and `<h1>` changed; canonical, `og:url`, `og:title`, `twitter:title` and the meta description still say East Harlem; `history.length` 2→2. **9** reproduced: a throw injected at the top of `renderAll` (SRI stripped, GeoJSON held 6s) logged "Error loading UHF42 GeoJSON: Error: probe-throw" from `map.js:334`, then threw again uncaught (`pageerror`). The first two injections, in `buildIndicatorCard`, never ran: serving the document through `route.fulfill` made all 8 cross-origin section fetches fail, so no card was built. **10** reproduced: with section JSONs held 8s, a click gave Kingsbridge `aria-current`; after render, East Harlem was selected and rendered. **11** reproduced, by the resolve path (see Task 3 step 4): the new panel 3's export label read "…Asthma hospitalizations (adults)…" over an "Asthma (adults)" chart; the predicted "Unable to render chart." did not appear. **20** reproduced on `/neighborhood-reports/` with the GeoJSON aborted: Tab reached 5 stops inside `aria-hidden` (container, Zoom in, Zoom out, 2 attribution links); 0 in the control arm with it loaded. **21** reproduced on `east_harlem/`: stroke `#008939`/3 → hover → `black`/1.5/dash 1; 0 `aria-current` on the map. **22** reproduced: section 1's JSON answered 404 → "No data available for this neighborhood."; section 0 rendered 3 cards. **30** partly: `#nr-qrcode img` is null and `#qrcode img` is not, but the audit's selector list also has `.print-only img`, which matches the QR image (the page's only `.print-only img`). The audit reads the right element; one half of the selector is dead. **4** reproduced: `nr-postswap-check.mjs --limit 2` exit 1, every "got" heading empty (plus a data drift, see Task 7 step 8). **13** reproduced: `--limit` alone printed "Checking 0 of 210", PASS, exit 0. **From code, at `829e3c5396`:** **5** `app.js:119` counts the viz fetch only with `vizUrl`, and `data.js:177`/`:195` call `checkAllLoaded` on both paths; latent, since `nr-report.html:318` always sets `vizUrl`. **6** `nr-report.html:181` server-renders `#nr-header-neighborhood`, so the wait at `nr-characterization.mjs:137-142` passes at once; `:149-153` then clicks `#nr-acc-1-h button` only `if (await firstPanel.count())`, and the first baseline run above lost that race. **12** `chart.js:39` concatenates `geocode` unquoted. **15** `nr-postswap-check.mjs:211`, `:269` call `process.exit`. **16** `nr-characterization.mjs:350` `rmSync`s the baseline dir before capture, and `page.goto` at `:131` is not caught. **28** partly: the wording revert is real, but `onExit` is used (Task 10 step 2). |
| 1 | GA events (1, 2) | `a6316e5fd4` | **DONE 2026-10-20** | On a `development` server Claude started on :8080 (production data, Pagefind index built with `npx -y pagefind --site docs`, `pagefind.js` 200). Playwright probe on `east_harlem/asthma_and_the_environment/` recording `dataLayer` pushes: control, the page-load `gtag('config')` recorded once; one `nrDownloadCSV()` gave one `file_download` `{file_name: "NYC EH Data Portal - Neighborhood Report - Asthma and the Environment - East Harlem.csv", file_extension: ".csv", link_text: "Download Report Data"}`, `file_name` equal to the download's suggested filename; opening `nr-acc-1` gave one `click_modal` `{modal_name: "Asthma (adults)"}`, close and re-open exactly one more; 0 page errors. `npm run lint` exit 0, after a first run failed `no-undef` on `gtag` (fixed by adding it to `NR_EXTERNAL_GLOBALS`), which is the control that the NR block is linted. Production's handler (`nr-indicator-new.html`, `shown.bs.collapse` per panel) counted re-opens, so `click_modal` fires ahead of the already-rendered guard; collapses without `data-indicator-label` are skipped, since `app.js` binds the handler to every `.collapse`. **Not run:** expand-all and the mobile-navbar skip. **Probe note:** panel ids start at `nr-acc-1` (`cards.js` `nextAccordionId` pre-increments). |
| 2 | In-place switch (3) | `9c89f95642` | **DONE 2026-10-20** | Step 1 `[verified 2026-10-20: curl of gtag/js for each id, 519,559 and 515,522 bytes; `grep -o 'enableHistoryEvents[^,]*,[^,]*'` → `"vtp_enableHistoryEvents":false` once in each]`; the pattern first written here, `'"vtp_enableHistoryEvents",[a-z]*'`, matched nothing, since the value follows a colon. **Step 2 reversed by measurement:** the title is written *after* the history call. Written before, Chrome relabelled the entry being left: `Page.getNavigationHistory` over CDP read East Harlem's URL titled "… in Kingsbridge - Riverdale"; written after, each entry kept its own title. The step's stated reason, GA history-change page views, does not apply (step 1). **Step 3 widened:** `og:description` and `twitter:description` name the neighborhood too, so all three descriptions are rewritten. JSON-LD (`BreadcrumbList`, crawler-only) left as served. **Added at Chris's request, 2026-10-20:** Back/Forward each send `page_view`, matching GA4's own history-event behaviour (support.google.com/analytics/answer/9216061: pushState, popState, replaceState); a new `select_neighborhood` `{nr_neighborhood, report_name}` counts map choices alone. **Proof**, Playwright on the `development` server, Enter on Kingsbridge - Riverdale from `east_harlem/asthma_and_the_environment/`: canonical, `og:url`, `og:title`, `twitter:title` and the three descriptions name Kingsbridge; `page_view` 0 on load, then 1/2/3 across switch, Back, Forward, each sent with the new title already set; Back restored East Harlem's h1, URL, map `aria-current` and head with a page marker surviving (same document); `select_neighborhood` 1 through Back/Forward and Enter on the shown neighborhood, 2 after a click on Bayside - Little Neck; 0 page errors. `npm run lint` exit 0; `node scripts/nr-characterization.mjs --check` PASSED 3/3. **Control:** not re-run at `13fa8d6016`; Task 0's claim 3 is that arm. |
| 3 | Render pipeline (5, 9, 10, 11, 12, 22) | `e7ce27a501` | **DONE 2026-10-20** | Playwright on the `development` server, which was serving the rebuilt `chart`, `map`, `data` and `report` fingerprints, with Task 0's probes adapted (`renderAll` anchor updated). **9:** with `probe-throw` injected into `renderAll` (SRI stripped, GeoJSON held 6s), one uncaught `pageerror`, no "Error loading UHF42 GeoJSON". **10:** section JSONs held 8s; after the early click 0 `aria-current`; at the end Kingsbridge's h1, path, title, canonical, `history.state` and `aria-current`, history 2→3. **11:** after the held topojson was released, the new panel's export label still read "…Asthma (adults)…". **12:** `geo_join_id` is a string (`"101"`) while `currentGeocode` is a number (303); `vegaEmbed` filters `datum.g == 302` and `== "302"` each kept 1 of 2 rows (the control), `== UHF101` errored "Unrecognized signal name", bare `== ` "Unexpected end of input"; the expanded `nr-acc-1` chart had 2 marks at `stroke-width` 2.5. **22:** section 1 forced to 404 read "This section could not be loaded. Please try again later." beside section 0's 3 cards. **5:** latent (`nr-report.html` always sets `vizUrl`), not exercised. `npm run lint` exit 0; `nr-characterization --check` PASSED 3/3; Task 2's probe re-run with identical counts. **Departures:** 9 uses `.catch(…).then(render)`, the shape `data.js` uses, rather than `.then(onOk, onErr)`, so an error while building the layer is caught too; 22 records failures in a `failedSections` set beside `sectionData`, which keeps `{}`, rather than a marker inside it, since `resolveGeocode` indexes every `sectionData` value. 10 applies the Task 2 note: the page's own neighborhood renders first, then the held selection as a switch. |
| 4 | Sanitise (7) | `8ad92b34a4` | **DONE 2026-10-20** | Step 1, `git grep -n innerHTML -- assets/js/nr-report`: 13 hits; static 6 (`chart.js` ×4, `report.js` ×2), clears 3, a comment 1, data 2 (`report.js` card write, `demographics.js` `metric.format`). Card write wrapped in `DOMPurify.sanitize`; `DOMPurify` added to `NR_EXTERNAL_GLOBALS`. **Departure:** the demographics write became `textContent`, not DOMPurify; its values come from `data/globals/uhflist.json` through `Number()` and carry no markup. **Proof**, Playwright on the `development` server serving the rebuilt `report` and `demographics` fingerprints: on all five topic pages, every row for all 42 neighborhoods (3,570) gave identical parsed markup (`<template>` round-trip) with and without the sanitizer; 126 rows carry `&` and 1 carries `<`, the reviewer's counts, so the comparison saw both characters. The `<` row is Peeling paint on `south_beach_tottenville/housing_and_health`, and that page shows `N/A<1%*` as text. A stubbed `indicator_short_name: 'X<img src=x onerror=window.__xss=1>'` left `window.__xss` undefined, its four `<img>` rendered as `<img src="x">`; control: the same row written unsanitized set `window.__xssCtrl = 1`. `npm run lint` exit 0; `nr-characterization --check` PASSED 3/3. **Not checked in a browser:** the demographics sidebar's rendered values. |
| 5 | Efficiency (17, 18, 19) | — | 18, 19 Not started; **17 Parked** 2026-10-20 (Chris). Un-park with the data-loading refactor, as for F5 | — |
| 6 | `nr-leaflet.html` (20, 21) | — | Not started | — |
| 7 | Harness scripts (4, 6, 13, 14, 15, 16, 30) | — | Not started | — |
| 8 | Config and lockfile (23, 25) | 23: `c85bb40e6a` | **23 DONE 2026-10-20**, made by Chris; 25 Not started | 23: `git diff` of the commit is the one `maxAge = -1` → `0` line; `grep -rn maxAge config/` leaves `prod_stage` as the only environment inheriting `-1` |
| 9 | Repo hygiene (24, 26) | — | Not started | — |
| 10 | Comments and dead code (27, 28, 29, 31) | — | Not started; 31 pauses for Chris's pick after the screenshots | — |
| 11 | No-JS trade (8) | — | Not started | — |
| V | Verification | *no commit*: checks | Not started | — |

## Next command

Task 5, step 2 (finding 18; 17 is parked). See how `chart.js` builds the topojson data entries:

```bash
git rev-parse --abbrev-ref HEAD   # expect feature-MOD-Lab-NR-recode-refactor-merge
grep -n "topo.json\|boroTopoUrl\|uhfTopoUrl\|topojson" assets/js/nr-report/chart.js
```

A `development` server on :8080 (`npx hugo serve --environment development -p 8080`, with Pagefind built) may still be running from the Task 1 session; check `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/dev-prod/` before starting another.
