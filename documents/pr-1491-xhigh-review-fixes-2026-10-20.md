# PR #1491 xhigh review fixes (2026-10-20)

**Status as of 2026-10-20: plan written, no task started.** Tasks 1, 3, 5 (finding 17), 9 and 10 (finding 27) each carry a
decision that Chris has to confirm before they run. Those are listed under [Decisions waiting on Chris](#decisions-waiting-on-chris).

Source: `/code-review xhigh #1491 --max-findings all`, run 2026-10-19 23:53 local against head `13fa8d6016`, merge-base
`06b38225b1`. It reported 31 findings, all of them static: lint, plus a tally of the live EHDP-data report JSONs. None was
checked in a browser. The reviewer's full text is the last assistant message in
`~/.claude/projects/c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge/c5623a61-8a7c-43c3-ac12-5383aa2bad81/subagents/agent-a8adb6362f930c608.jsonl`.
Transcripts age out, so quote it here before relying on it later. Chris's verdict on each finding is quoted verbatim in the
[Findings](#findings) table.

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
| 17 | Cards wait for the viz table and `topic_indicators.json`, which they don't need | "Fix" | 5, **gated** |
| 18 | Each chart spec fetches `UHF42.topo.json` twice and `borough.topo.json` once, by URL | "Fix" | 5 |
| 19 | `NR_REPORT_CONFIG.neighborhoodMap` duplicates the `neighborhoods` global from `lib-uhflist` | "Fix" | 5 |
| 20 | `nr-leaflet.html` `removeHiddenMapFromTabOrder` runs only on GeoJSON success; zoom links focusable inside `aria-hidden` until then | "Fix" | 6 |
| 21 | `nr-leaflet.html` hover-out resets the neighborhood index's own highlight; no `aria-current` there | "Fix" | 6 |
| 22 | A failed section fetch reads as "No data available for this neighborhood." | "Fix" | 3 |
| 23 | `pagefind-characterization.mjs` defaults to `local_prod`, whose `maxAge = -1` makes results depend on the machine's cache | "Change maxAge = 0. I'm the only consumer of local_prod." | 8 |
| 24 | `.gitignore` ignores `.claude/` while two files in it are tracked | "Fix" | 9 |
| 25 | Lockfile downgrades playwright/playwright-core 1.62.1 → 1.62.0 and drops sha.js metadata | "Restore" | 8 |
| 26 | Root-level working files reach production: `EHDP feedback for MOD-Lab.md`, `README-MOD.md`, `.cursor/` | "Add stale files to gitignore" | 9 |
| 27 | Changelog-style comments (`tertiles.js:45`, `:72`; `map.js:78-80`) and comments made false by merge (`report.js:15`, `_de-custom.scss:137`) | "Should we update or remove these?" | 10, **gated** |
| 28 | `dev-server.mjs`: merge restored older wording over production's, added unused `const onExit` | "Fix" | 10 |
| 29 | `chart.js:58` `format.parse.Value` names a field the data lacks | "Fix" | 10 |
| 30 | `nr-a11y-audit.mjs:563` QR selector `#nr-qrcode img` matches nothing; the id is `qrcode` | "Fix" | 7 |
| 31 | `nr-report.html:179` class `mb-` | "Change to whatever might have been intended" | 10, **gated** |

## Decisions waiting on Chris

| Item | Plan's recommendation | Why it needs you |
|---|---|---|
| 17 | Hold until you confirm the reversal | The 2026-10-17 plan records F5 as **Deferred**, with the note "Chris plans to refactor how report data arrives; un-defer as part of that". "Fix" reverses that. Confirm whether this finding now runs ahead of that refactor. |
| 3, Back button | Switch from `replaceState` to `pushState` and add a `popstate` handler, so Back returns to the previous neighborhood without a reload | This changes history behaviour, which is part of the SPA feel. The alternative is to keep `replaceState`, so Back leaves the page as it does today, and fix only the metadata and analytics. |
| 3, GA `page_view` on a switch | Send `gtag('event', 'page_view', {page_location, page_title})` after the URL and title update | The analytics audit records the production stream's history events as **off** (`"vtp_enableHistoryEvents":false`, `de-analytics-audit-2026-10-16.md` §Ledger, `[verified 2026-10-16 16:26 UTC]`). A switch is therefore counted only if the code sends it. Production counted a full page load on every switch. Re-check the flag before relying on it (Task 2, step 1). |
| 26 | `git rm --cached` the four files, then add their paths to `.gitignore` | Adding a tracked file to `.gitignore` does nothing on its own. `git rm --cached` keeps your copy, but **deletes the files from every other clone or worktree that pulls the branch**, including MOD-Lab's, whose agents read `.cursor/rules/project-context.mdc`. Confirm that's acceptable, or move the files out of the repo another way. |
| 27 | Remove the history and keep the reasoning: each comment states what the code does now and why, with no dates, no "used to", and no references to production or to other branches | You asked the question. Removing the comments outright loses the *why*: the `rankReverse` comments explain a non-obvious verdict rule that a later reader could "fix" back into the bug. |
| 31 | Remove the class, which leaves the shipped rendering unchanged | The intent can't be recovered from the repo. `mb-` arrived bare in `d6f99e19ea` ("add map picker, add data to accordion, persistance"), and no commit gave it a number `[verified 2026-10-20: git log -S'd-none d-md-block mb-' -- themes/dohmh/layouts → one commit]`. The page has looked this way through every review since. Choosing `mb-1`…`mb-5` is a visual decision, so say if you want screenshots of two candidates. |

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
| 20, 21 | On a neighborhood index with the GeoJSON request aborted, Tab reaches the zoom links; after hovering on and off the page's own polygon, its stroke is black/1.5 |
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
4. History: `pushState` with `{neighborhood: name}` plus a `popstate` handler that re-renders from `event.state`, or keep
   `replaceState`, per Chris's answer. With `pushState`, the first render must still use `replaceState`, as it does now,
   so loading a page adds no history entry.
5. After the URL and title update, send `page_view` through `trackNREvent` with `page_location: location.href` and
   `page_title: document.title`. Skip it on the initial render, because `gtag('config')` already counted that load.
6. **Proof:** a Playwright probe on `east_harlem/asthma_and_the_environment/`, switching with Enter to Kingsbridge - Riverdale.
   It checks: canonical, og:url and og:title name Kingsbridge; `document.title` changes before the `page_view` call
   (record the order in a `gtag` wrapper); exactly one `page_view` per switch and none on load; with `pushState`, Back
   restores East Harlem's h1, URL and canonical without a navigation (`performance.getEntriesByType('navigation').length`
   unchanged). Control: the same probe at `13fa8d6016` fails the canonical and `page_view` checks.

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
4. **11:** capture the destination element before calling `vegaEmbed`. On resolve or reject, act only if
   `el.isConnected` is still true.
5. **12:** build the filter as `'datum.geo_join_id == ' + JSON.stringify(geocode)`. Before committing, check that
   `geo_join_id` is numeric in the data and that the comparison still matches. Vega's `==` coerces types, but a quoted
   number compared with a numeric field needs a browser check.
6. **22:** in `loadSection`'s `.catch`, store a failure marker instead of `{}`. `report.js` renders a distinct message.
   Proposed copy is "This section could not be loaded. Please try again later." Chris confirms the copy at review.
7. **Proof:** re-run the Task 0 probes for 9, 10, 11 and 22, which should now pass, plus a probe for 12 using an expanded
   chart that renders a highlighted neighborhood. `npm run lint` exit 0.

## Task 4: Sanitise EHDP-data markup (finding 7)

**Files:** `assets/js/nr-report/report.js` (sinks at the empty-section branch and the card write),
`assets/js/nr-report/demographics.js` (`metric.format` write).

1. Re-run `git grep -n innerHTML -- assets/js/nr-report` and classify every hit as static, clear, or data.
2. Wrap each data sink's value in `DOMPurify.sanitize(...)`. `DOMPurify` is already loaded by `head.html` and declared in
   `eslint.config.mjs`'s NR external globals.
3. **Proof:** a browser probe in which a stubbed report JSON row with `indicator_short_name: 'X<img src=x onerror=window.__xss=1>'`
   leaves `window.__xss` undefined. Real data must render unchanged: a report page carrying `N/A<1%*` still shows that
   literal text. Find the page with a grep over the production report JSONs, as the reviewer did. `node scripts/nr-characterization.mjs --check` passes.

## Task 5: Efficiency and reuse (findings 17, 18, 19)

**Files:** `assets/js/nr-report/app.js`, `assets/js/nr-report/data.js` (17); `assets/js/nr-report/chart.js`, which builds
the spec's `UHF42.topo.json` / `borough.topo.json` data entries (18); `assets/js/nr-report/url.js`
(`slugForNeighborhood`), `themes/dohmh/layouts/neighborhood-reports/nr-report.html` (`neighborhoodMap`) (19).

1. **17, gated on Chris:** render the cards when the section fetches finish, and fill the "Full dataset" links and enable
   charts and CSV when the viz table and `topic_indicators.json` arrive. Keep the 2026-10-17 step 4 behaviour: a failed
   viz fetch still disables Download and shows "Chart data could not be loaded."
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
8. **Proof:** `node scripts/nr-postswap-check.mjs --limit 2` against a `development` server exits 0; `--limit` alone exits
   2; `node scripts/nr-characterization.mjs --check` 3 of 3; a `--baseline` run with `DE_BASE_URL` pointed at a dead port
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
2. **26, gated on Chris:** `git rm --cached` the four files, then add their paths to `.gitignore`. **Proof:**
   `git ls-files | grep -iE '^(EHDP feedback|README-MOD|\.cursor/)'` is empty, and the files still exist on disk.

## Task 10: Comments and dead code (findings 27, 28, 29, 31)

**Files:** `assets/js/nr-report/tertiles.js` (comments above `getTertilePillClass` and in `getTertileLabel`),
`assets/js/nr-report/map.js` (the comment block above `selectLayer` naming `feature-NDHR-prototype`),
`assets/js/nr-report/report.js` (`collectDataNotes` comment), `assets/scss/_de-custom.scss` (comment on the NR
data-note class), `scripts/dev-server.mjs` (header, the two-builders error text, `onExit`),
`assets/js/nr-report/chart.js` (`format.parse.Value`), `themes/dohmh/layouts/neighborhood-reports/nr-report.html`
(`mb-`).

1. **27, gated on Chris:** rewrite the five comments per the recommendation above. **Proof:** a grep of those files for
   `Fixed 20\|used to\|production\|feature-NDHR` returns no comment lines.
2. **28:** restore production's header and error wording (`git show production:scripts/dev-server.mjs`), keep this
   branch's code changes, and inline `onExit`. **Proof:** `git diff production -- scripts/dev-server.mjs` shows code
   only; `node scripts/smoke-pages.mjs` exercises the module.
3. **29:** delete the `format.parse` entry. **Proof:** one expanded chart renders the same in the Task 3 probe.
4. **31, gated on Chris:** per his answer.
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
- `node scripts/smoke-pages.mjs`, 44 clean, Pagefind served
- `node scripts/pagefind-characterization.mjs --check`. Predicted unchanged: no task touches indexed text.
- `npm run characterize:site:prod_prod`. Task 6 changes focusability and Task 10 may change classes. Predicted no
  `structure` change; any change is read before re-baselining (project CLAUDE.md, "Before re-baselining").
- `npm run a11y:nr`, compared with Task 0's run

## Ledger

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Evidence pass | *no commit*: checks | Not started | — |
| 1 | GA events (1, 2) | — | Not started | — |
| 2 | In-place switch (3) | — | **BLOCKED on Chris**: Back-button and `page_view` decisions | — |
| 3 | Render pipeline (5, 9, 10, 11, 12, 22) | — | Not started | — |
| 4 | Sanitise (7) | — | Not started | — |
| 5 | Efficiency (17, 18, 19) | — | 18, 19 Not started; **17 BLOCKED on Chris**: reverses 2026-10-17 F5 | — |
| 6 | `nr-leaflet.html` (20, 21) | — | Not started | — |
| 7 | Harness scripts (4, 6, 13, 14, 15, 16, 30) | — | Not started | — |
| 8 | Config and lockfile (23, 25) | — | Not started | — |
| 9 | Repo hygiene (24, 26) | — | 24 Not started; **26 BLOCKED on Chris**: deletes files from other clones | — |
| 10 | Comments and dead code (27, 28, 29, 31) | — | 28, 29 Not started; **27, 31 BLOCKED on Chris** | — |
| 11 | No-JS trade (8) | — | Not started | — |
| V | Verification | *no commit*: checks | Not started | — |

## Next command

```bash
git rev-parse --abbrev-ref HEAD; git rev-parse --short=10 HEAD   # expect feature-MOD-Lab-NR-recode-refactor-merge, then the plan commit's hash
npm run lint > "$SCRATCH/t0-lint.txt" 2>&1; echo "exit=$?"         # Task 0 baseline; expect exit=0
```
