# R6: Data-feature correctness and broken links (2026-10-30)

Batch R6 of `documents/site-wide-audit-2026-10.md` (Roadmap): 6 P1 rows (A-045, A-312, N-051,
N-052, N-053, N-054) and 6 P2 (A-044, A-046, A-147, N-057, N-058, N-060), on branch
`feature-audit-r6-data-features`, cut from the local `production` at `a7fc32ddd8`. This document is
the plan and the ledger. Rows are closed in the audit document only once their proof has run.

**Closed 2026-10-30: all twelve rows FIXED, A-045 by `92809024ba` on production before this batch,
the rest by `0fefefeca1`, `7f897c39b5` and `f6ff719488`; characterization re-baselined in
`893914cf79`. Next: push this branch and open a PR into `production`.**

## Decisions

Taken by Chris on 2026-10-30:

- **N-052: a defect, change it.** The average divides by the readings present instead of 24; the
  more-than-17 gate (18 of 24) stays. Both copies, `realtime.js:347-360` and `:387-400` (the audit
  cited one).
- **N-051: the bundle.** The map's lookup reads the bundle's `aqe-nta.csv`, as the cards and the
  bar chart (`aqe.js:217`) already do, replacing the personal gist at `aqe.js:387`. The gist's
  columns differ (`TotalPM` / `TotalNOx` where the lookup names `PM_Avg` / `NO2_Avg`); the map
  colours only by the four source tertiles, which both carry.
- **A-046: price it first**, then **option (a)**, pin without vendoring (Chris, 2026-10-30).
  Rejected: (b) and (c), vendoring, which still leave three or all of these pages' CDN libraries
  in place for (b) and cost ~1.5 MB of hand-maintained copies for (c).

### A-046 pricing

Measured 2026-10-30: `cdn.rawgit.com/.../v5.3.0/build/ol.js` answers 301 to
`cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/...` and serves OpenLayers (654,650 B),
so nothing is broken today; the exposure is a retired service's redirect and a floating `@master`.
Both live pages draw an OpenLayers map (`.ol-viewport` 1 each) through NYC's `nyc-ol-lib`, and
each also loads proj4 and PapaParse from cdnjs and nyc-lib from `maps.nyc.gov`, none with SRI.
`rats-in-your-neighborhood-nyc-lib.html` is used by no content file. npm's `ol@5.3.0` ships no
UMD build (`cdn.jsdelivr.net/npm/ol@5.3.0/dist/ol.js` 404), so vendoring means committing the
built file by hand.

- **(a) Pin, don't vendor.** Point the two live templates at
  `cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@4eccf2cf93/en/v5.3.0/build/ol.js` (the
  commit `master` resolves to; byte-identical to what rawgit serves, SHA-256 `703bda1c3bca13cf…`)
  and delete the unused template. Two lines and one file; the page stays on CDNs like its other
  three libraries.
- **(b) Vendor OpenLayers only.** Commit the 654 KB `ol.js` under `assets/`, add a `lib-ol`
  partial with fingerprint and SRI, include it in both templates. Removes one CDN of four on
  these pages; the other three remain.
- **(c) Vendor all four** (OpenLayers, proj4, PapaParse, nyc-ol-lib with its babel-polyfill, ~1.5 MB
  together), which is what would take these pages off third-party CDNs. nyc-lib is NYC's own
  mapping library, versioned per page (v1.4.78 on both live pages).

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0a | all: re-run each row's source signal on `a7fc32ddd8` | *no commit* (measurement) | **DONE 2026-10-30** | Source re-check, below |
| 0b | A-312: unprefixed root-relative links in built HTML | *no commit* (measurement) | **DONE 2026-10-30** | below |
| 0c | A-045: reproduce in a browser | *no commit*: already fixed on `production` by `92809024ba` (2026-10-23, after the audit's `b8f4b32fbd`) | **DONE 2026-10-30**; the row is closed as FIXED by that commit when this batch closes rows | on the isolated build of `a7fc32ddd8`: `L.polygon(...).contains` is a function and `await checkPointInRMZ(40.8116, -73.9465)` resolves without throwing |
| 0d | N-053, N-058, N-060, A-044: reproduce in a browser | *no commit* (measurement) | **DONE 2026-10-30**, all four reproduce | `task0d-probe.mjs` / `task0d-probe2.mjs` (scratchpad) on the isolated build of `a7fc32ddd8`, none of these rows' files changed since. **N-053:** one real click per tab, 1.2 s each: air-quality-snapshots 5 of 5 panes active, 0 of 5 iframes given a `src`, no `lazy-tab-embeds` request; control `redlining/` 5 of 5 given a `src`. (A first pass clicking all five in one tick set no `src` on the control either, so it had no power.) **N-058:** `fullTable` loses one row per `#inputNum` change (2923 → 2920 over 3); the feed holds ~15 rows per hour, so `chartStart` holds for 14 changes and moves an hour earlier at the 15th (2026-10-27 22:00 → 21:00 UTC), i.e. the window drifts back an hour per ~15 changes. **N-060:** one `HEAD` for `edheat2026_live.csv`, issued by `UrlExists`'s `open('HEAD', url, false)`; Chromium logged no sync-XHR deprecation line to the console, so the synchronous flag rests on the source. **A-044:** 6 `invalid container dimensions` warnings on `/es/data-stories/housing/`, 0 on the English page |
| 1 | N-052 | `0fefefeca1` | **Fix written, verified** | `aq-probe.mjs` on isolated `prod_prod` builds of `a7fc32ddd8` (before) and the edited tree (after), live feed, 15 monitors, one with 23 readings: before, the shown value matched sum/24 on 15 of 15 and sum/count on 14; after, sum/count on 15 and sum/24 on 14. Perturbed (3 readings dropped from a second monitor, `printRecentAverage()` re-run): after, sum/count on 15 of 15 with 2 monitors below 24 |
| 2 | N-051 | `0fefefeca1` | **Fix written, verified** | same probe: the map's joined `Building_emissions` against the bundle the cards read, 262 of 262 NTAs joined: before 81 differ (e.g. BX0202 map Medium, cards High), after 0 |
| 3 | A-046: option (a), chosen by Chris 2026-10-30 | `0fefefeca1` | **Fix written, verified** | the two live templates load OpenLayers from the pinned jsDelivr URL; `rats-in-your-neighborhood-nyc-lib.html` deleted (no content file names it; its `nyc-lib/v1.2.79` string is on 0 built pages, against 4 for the live templates' `v1.4.78`). Rebuilt: 0 `rawgit` `src`/`href` in source or build; the pinned URL on 2 pages. `ol-probe.mjs` on both pages, before and after: `ol` and `nyc.ol` objects, one `.ol-viewport` each, `cdn.rawgit.com` no longer among script hosts, console errors unchanged at 2 (two 404s present before the edit too, not diagnosed) |
| 4 | N-053 | `7f897c39b5` | **Fix written, verified** | `flexible.html` loads `lazy-tab-embeds.js` as `single.html` does. `task0d-probe2.mjs` on the rebuilt `prod_prod` tree: air-quality-snapshots 5 of 5 tabs give their iframe a `src` (0 of 5 before); control `redlining/` 5 of 5 both times |
| 5 | N-054 | `7f897c39b5` | **Fix written, verified** | `cooling-info.js:483` `https://finder.nyc.gov/coolingcenters/`, `:504` gains `https://`, `config.js:47` closes with `</a>`; both target URLs answer 200 (`curl -L`, 2026-10-30). Built files: 0 `https://:`, the notify link with its scheme, 0 `provider<a>`. Runtime not driven: the messages appear only for particular answers to the page's questions |
| 6 | A-312 | `7f897c39b5` | **Fix written, verified** | Home breadcrumb `{{ relURL "" }}` (the form `section-header.html` uses), the 2025 report's link via `{{< relURL >}}data-features/heat-report-archive/2024/` (the form its `10-conclusion.md` uses), `bbb.html`'s explorer link via `relURL`. `a312_sweep.py` on the rebuilt tree: 0 unprefixed targets on 970 pages (3 targets / 4 pages before); control 66,778 prefixed references |
| 7 | N-058 | `7f897c39b5` | **Fix written, verified** | `updateTime` reads `fullTable[fullTable.length - 1]` instead of popping it. 20 changes to 3 days: rows 2923 throughout and `chartStart` unchanged (before: one row lost per change, `chartStart` an hour earlier at the 15th) |
| 8 | N-060 | `7f897c39b5` | **Fix written, verified** | `UrlExists` is a `fetch` `HEAD` returning a promise (a network failure counts as missing, falling back to last year, where the XHR threw out of `init()`); `init` is async; `colorArray` is declared up front (it was an implicit global, which the scatterplot specs would have hit as a `ReferenceError` before `init` resolved); the `#vis2` scatterplot is drawn, with `colorArray` written into both specs' `config.range.category`, once `init()` resolves. `after-probe.mjs n060`, HEAD held 3 s by route: DOMContentLoaded at 3,250 ms before, 147 ms after; buttons 11, active 2026, palette 10 and 0 page errors on both. **Correction, found by the re-baseline:** `#vis1` was embedded twice, once at load and once by `init()` → `changeYear()`. The synchronous HEAD made the two embeds race into the div together, which left two export menus (10 empty-href links, measured on the old build at every wait); once the HEAD became asynchronous, a slow HEAD let the first embed finish and be replaced, leaving one menu, so the page's `links.emptyHref` went 35 or 30 depending on timing (30 in the re-baseline's sweeps, 35 in the `--check` an hour earlier). The load-time embed is removed, so `changeYear()` draws `#vis1` once: 30 empty-href links and one menu at 0.5, 2 and 8 s and with the HEAD held 3 s (old build: 10 in `#vis1` throughout); the chart itself is unchanged in two loads (header 2026, `edheat2026_live.csv`, 310 marks) |
| 9 | A-044 | `7f897c39b5` | **Fix written, verified** | the three Spanish charts hidden at load (`ifVlow`, `ifLow`, `ifMod`) carry `data-lazy-src` and get a `src` from a `loadDeferredChart` call in their radio handler, after the display change. The English page uses the same eager pattern and warns 0, so the cause is these charts' `dw-2.0` renderer (every warning came from `lib/vendor/dw-2.0.min…js`). `after-probe.mjs a044`: 0 warnings at load and after choosing each option, each chart 230 px tall with its `src`; before, 6 at load and 6 throughout |
| 10 | A-147, N-057 | `f6ff719488` | **Fix written, verified** | 17 string literals in 6 files rewritten to `data_repo + data_branch` (head.html's globals; `branch_sweep.py`, quote-aware, dry-run count 6/1/2/1/3/4 as `git grep -c` predicted); `HVIMapSpec.vg.json`'s borough URL becomes the placeholder `"borough_topo"`, which `hvi.js`'s `buildMap` fills, as it already fills `"topo"`. Left: `static/js/neighborhood-reports/spec/mapSpec.json` (2 lines), which nothing in `content/`, `themes/`, `assets/` or `static/` references. `after-probe.mjs branch` on 7 pages, same tree built twice: `prod_prod` requests only `production`, `dev_stage` only `staging`, 0 console errors on either. The rats page requests nothing from EHDP-data at load (its two URLs are fetched after an address search), so those two are checked in source only |
| 11 | smoke, characterization, re-baseline | re-baseline `893914cf79` | **DONE 2026-10-30** | on the full edited tree over `8e4d2a3450`: `smoke-env.mjs prod_prod` 1187 pages clean (tally: urban-heat-island 2, AirNow 1). `characterize-env.mjs prod_prod` failed on 4 of 924 pages, each one of this batch's changes; the first re-baseline then also moved heat-syndrome (the `#vis1` race, Task 8's correction) and heat-report-archive/2025 (A-312, content only). After the `#vis1` fix, `site-characterization-rebaseline.mjs` with `--expect` on those 6 pages: both baselines "6 of 924 pages changed in all; 6 covered by --expect, 0 not" and "Nothing unexplained"; every changed line read by hand (`git diff -U0`, prod_prod 25 lines, staging 29, the extra 4 being staging's heat-syndrome button count). Smoke and the first characterization check ran before the `#vis1` fix; that fix removes one embed call, and the re-baseline's sweeps ran after it |
| 12 | close the rows in the audit | — | **DONE 2026-10-30** | `close_r6.py` (scratchpad) dry run then write: 12 rows FIXED, the count table, the Summary paragraph, the Roadmap's P1+P2 total (87 → 75) and the R6 batch row (0 / 0, moved to the foot of the table). Recount control reproduced `HEAD`'s table first (OPEN 21/66/131/2, FIXED 239), then read OPEN 15/60/131/2 = 208, FIXED 251; the batch check: 75 ids in batches, exactly the OPEN P1 and P2 rows, order by P1 then P2 intact; `git diff --numstat` 18/18 |

### Source re-check (Task 0a)

`static_recheck.py` (scratchpad), one pass over 822 tracked text files under `content/`,
`themes/`, `assets/`, `static/`. Every row's code is still present; lines have moved:

- A-045: `area.contains(` at `neighborhood-rats.js:279` and `:304`.
- A-046: rawgit `ol.js` in `rats-in-your-neighborhood.html:219`,
  `rats-in-your-neighborhood-nyc-lib.html:99`, `take-action/email-electeds.html:132`.
- A-147 / N-057: an EHDP-data branch hardcoded in a fetched URL on 20 lines in 8 files
  (`git grep -c -E 'EHDP-data/(refs/heads/)?(production|main|staging)\b'`): `heatsyndrome.js` 6,
  `overlap-tool-with-map.html` 4, `minimum-wage-with-maps.html` 3, `neighborhood-rats.js` 2,
  NR `static/js/neighborhood-reports/spec/mapSpec.json` 2, `HVIMapSpec.vg.json`, `rmz.js` and the
  housing story's `index.md` 1 each. Not the same 8 files as N-057: its `find-your-uhf/index.md`
  and `heat-syndrome/index.md` hits are "About the data" links to `github.com/.../tree/production`,
  not data fetches, and the housing story and the NR spec sit outside `data-features`. Control:
  `data_branch` reads match 47 lines, the explorer's among them.
- N-053: `lazy-tab-embeds.js` is included by `data-stories/single.html:23` only;
  `flexible.html` does not include it.
- N-054: all three: `cooling-info.js:483` `https://:finder.nyc.gov/coolingcenters/`, `:504`
  `href="a858-nycnotify.nyc.gov/..."` (no scheme), `config.js:47` closed with `<a>`.
- N-058: `fullTable.pop()` at `realtime.js:601`. N-060: `http.open('HEAD', url, false)` at
  `heatsyndrome.js:77`. N-051: the gist URL at `aqe.js:387`. A-044: three
  `style="display:none"` chart divs at `housing/index.es.md:321-331`.

### A-312 (Task 0b)

Isolated `prod_prod` build of `a7fc32ddd8` into `C:/temp/r6-base` (`HUGO_RESOURCEDIR` and `-d`
under `C:/temp`), then `a312_sweep.py` (scratchpad) over the 970 files carrying
`data-pagefind-meta="title:`: `href`/`src` values starting `/` but not `/IndicatorPublic/`.
Control: 66,772 prefixed root-relative references counted. Result: 3 targets, 4 pages, 3 source
lines:

- `href="/"`, the breadcrumb's Home, `themes/dohmh/layouts/data-features/24-25-heat-report.html:10`
  (heat-report, heat-report-archive 2024 and 2025);
- `/heat-report-archive/2024/` at `content/data-features/heat-report-archive/2025/9-impacts.md:10`,
  which also lacks `data-features/`, so it is wrong on any server;
- `/data-explorer/housing-stability/?id=2365…` at `themes/dohmh/layouts/data-stories/bbb.html:319`.

Blind to links that JavaScript writes after load.

### Next commands

```
git log --oneline a7fc32ddd8..HEAD     # task commits on this branch
gh pr list --head feature-audit-r6-data-features
```
