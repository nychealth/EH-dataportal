# Smoke over every data explorer indicator: plan

<!-- Deliberately does NOT declare a `docs-check source-roots` comment: it names a function
     (`collectExplorerIndicatorPaths`) that does not exist until Task 1 lands. -->

**Goal:** make the full smoke sweep (`--all`, which CI runs on every PR into `production`) load
every data explorer indicator, so a runtime failure in the explorer's rendering or its EHDP-data
fetches fails CI.

**Why:** CI's sweeps take URLs from the sitemap, which has no `?id=`. Production's old explorer
selects a topic's first indicator itself when given no id, so today's CI sweeps render one
default indicator per topic (41) `[verified 2026-10-02 on production's tree, isolated prod_prod:
asthma → ?id=2414, air-quality → ?id=2023, waterways → ?id=2427, economic-conditions → ?id=103]`.
The new explorer in PR #1462 instead opens the indicator chooser and renders nothing, so once it
merges, CI exercises no indicator at all `[verified 2026-10-02 on feature-new-data-explorer: same
4 topics, no IndicatorID, 0 map paths; the "open chooser if URL has no valid indicator ID" guard in
assets/js/data-explorer/topic-indicator-selector.js]`. That is how
`geography/citywide.topo.json`, present on EHDP-data `staging` and 404 on `production`, reached PR
#1462 unflagged (`documents/de-production-deploy-plan-2026-10-01.md`, D15).

**Architecture:** a new `collectExplorerIndicatorPaths(baseURL)` in `scripts/site-urls.mjs` reads
the build's own `IndicatorMetadata/topic_indicators.json` and returns one
`data-explorer/<topic>/?id=<n>` path per unique indicator. `scripts/smoke-pages.mjs --all` appends
those paths to the sitemap enumeration. Pages with an id get an extra wait until the EHDP-data fetches
go quiet, so late errors land inside the window. Site characterization does **not** get these paths.

**Decided (Chris, 2026-10-02):** a separate PR from `production`, not part of #1462; indicators
come from `topic_indicators.json`; smoke only. Characterization stays on the sitemap, because a rendered
indicator's structure (period, legend, row and mark counts) moves with EHDP-data, which
auto-commits seasonally. The same drift is why `scripts/de-characterization-baseline/` went red
on data alone (deploy plan D7, D17).

## Ledger

**Status as of 2026-10-02: plan written on `feature-smoke-explorer-indicators` (cut from local
`production` at `ed63fa7603`); Tasks 0–3 done; D1–D4 decided; D5 decided (2026-10-02); Task 4
not started.**

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Evidence: cost, throttling, and whether the collector sees late errors | *no commit* (throwaway probe) | **DONE 2026-10-02** | Pre-registered: 0 × 429; 4xx only on known-missing files (none on the old explorer); under 6 min; late control seen at 10 s, missed at 2 s; no power if data-host count or `held` is 0. **Run 1** (`explorer-sweep-probe.mjs`, the plan's Step 2 code plus Step 4) was unreadable: `startServer` builds no Pagefind index, so 263/263 pages logged Pagefind errors, and the 3-per-page cap hid anything else; its late control had no power (`held: 0`), because production's old explorer opens on the table tab, which loads no `.topo.json`. **Run 2** (`explorer-sweep-probe2.mjs`: `npx -y pagefind --site <destDir>` first, no cap, failed URLs by host, control on `indicators/data/<id>.json`) `[verified 2026-10-02, isolated prod_prod]`: 263 paths in 120 s at concurrency 6; 1346 data-host responses, 0 × 4xx, 0 × 429, so no shared context is needed; 1 page with `PAGEERROR Cannot read properties of undefined (reading 'array')`, path not recorded (Task 2 Step 3 will name it); 78 `ERR_BLOCKED_BY_ORB` requests to `www.google.com/sorry/index`, not errors to smoke. Late control: `held: 1`, 0 errors by 2 s after load, then the 404 and `PAGEERROR … Unexpected end of JSON input` at 6.8 s, so the quiet wait is needed. Step 4: the old explorer ignores `&overlay=trend`; it rewrites the URL to `#display=summary` with the table tab active, because it reads its view from the hash (`measures.js`, "set tab based on hash") |
| 1 | `collectExplorerIndicatorPaths` in `site-urls.mjs` | `feature-smoke-explorer-indicators @ 2b0d4af2ac` | **DONE 2026-10-02** | `[verified 2026-10-02, isolated prod_prod, collect-check.mjs]`: `Explorer indicators: 263 unique of 305 topic pairs in 41 topics`; the first six paths cycle the five D2 views and wrap; the `no-such-dir/` control threw on 404. Independent Python count over the built JSON: `305 263 41`. `grep collectExplorerIndicatorPaths scripts/*.mjs` hit `site-urls.mjs` only. `npx eslint` clean |
| 2 | Wire it into `smoke-pages.mjs --all`, with the data-quiet wait and D4's data-host status check | `feature-smoke-explorer-indicators @ 074d0257f8` | **DONE 2026-10-02** | Step 3 `[verified 2026-10-02, node scripts/smoke-env.mjs prod_prod, 220 s including build and Pagefind, concurrency 24]`: 1188 pages = 925 sitemap-side (830 + 94 + 1; the plan's 924 was CI's count) + 263 explorer. `quietCapReached` empty, 0 `EHDP-data responded` lines. Exit 1, 3 failures, all surviving the sequential re-check; see D5. Steps 4–5 `[verified 2026-10-02, smoke-visit-control.mjs over a generated copy of the working-tree file]`: arm A (data file held 6 s, then 404, wait on): `EHDP-data responded 404: …/indicators/data/2455.json` plus the JSON-parse pageerror, 9.7 s. Arm B (wait off): no errors, 3.0 s, so missed. Arm C (cap 500 ms): `quietCapReached: true`, no failure. `npx eslint` clean |
| 3 | Positive control: the sweep on a local merge with `feature-new-data-explorer` | *no commit* (throwaway branch, deleted) | **DONE 2026-10-02**, run as Chris chose: pinned, then live | Merged with `git merge --no-commit --no-ff feature-new-data-explorer` on `scratch-smoke-merge` (clean), so no merge commit was made; the scratch branch was aborted and deleted afterward. **Pinned run** (`data_branch = "d3558441…"` in the scratch tree's `config/prod_prod/config.toml`) `[verified 2026-10-02, smoke-env.mjs prod_prod, 207 s]`: 1190 pages = 924 + 266 explorer (the DE branch lists 266 unique of 311 pairs). 58 failures, past the re-check cap: 56 × `EHDP-data responded 404: …/d3558441…/geography/citywide.topo.json`, inside the pre-registered 1–68, spread across all five views (bar 12, links 12, table 12, trend 11, map-only 11), plus 2 × `reading 'array'`. **Live run**, pin reverted `[verified 2026-10-02, 218 s]`: 0 citywide 404s; 2 failures surviving the sequential re-check, `falls-among-older-adults/?id=2188` (bar) and `?id=2403` (trend), both `Cannot read properties of undefined (reading 'array')`; 1 flake, `heat-report-archive/2021/` `reading 'vis'`, cleared on re-check. Old-explorer failures (a) and (b) and cooling-info (c) did not occur. **D2 runtime** (`hash-pairing-probe.mjs`, live): `&overlay=trend#display=trend` kept `overlay=trend` with the hash stripped and the trends tab pressed. `#display=trend` alone was backfilled to `overlay=trend`. `&overlay=table#display=map` showed the table, so the query wins. History of the control: Step 1's no-power check fired `[2026-10-02]`: EHDP-data `production` gained `geography/citywide.topo.json` in `08d6e68f6e` ("adding citywide topojson", 2026-10-02T23:32Z; 19,736 B of TopoJSON), so D15 is fixed upstream. The known-bad still exists at that commit's parent `d3558441d1`: raw URLs accept a SHA, and there `citywide.topo.json` → 404 and `metadata.json` → 200. Proposed: set `data_branch = "d3558441d122b4db4b9fd4d2011be500df6b584a"` in `config/prod_prod/config.toml` on the scratch branch only. `git merge-tree --write-tree HEAD feature-new-data-explorer` exit 0, so the merge is clean; local `feature-new-data-explorer` = origin (`0 0`) |
| 4 | Docs, CI budget, PR | | **Not started** | |

Facts measured while planning (production build, isolated: `HUGO_RESOURCEDIR=<tmp> npx hugo
--environment prod_prod -d <tmp>`, exit 0, 0 errors, 2026-10-02):
- `topic_indicators.json` is a map keyed by topic slug (`path.Base` of the page's `RelPermalink`), each
  value `{ "topic_name": …, "IndicatorID": [int, …] }`.
- 41 topics, 305 topic–indicator pairs, 263 unique ids; no topic has an empty list.
- It is written by `themes/dohmh/layouts/partials/de-topic-indicators.html` (`.Publish`). Three
  templates render that partial (`data-explorer/section.html`, `data-index.html`,
  `indicator-catalog.html`), so any full build writes it. Drafts are excluded, because the partial
  ranges over `.Site.Pages`.
- CI baseline for the budget: run 37064754317's "Run the smoke check" step took 7 min 23 s
  for 924 pages, in a 9.6-min job; both jobs have `timeout-minutes: 25` (`.github/workflows/smoke.yml`).

Resume commands:

```
git log --oneline production..feature-smoke-explorer-indicators     # the task commits
git rev-list --left-right --count origin/feature-smoke-explorer-indicators...HEAD   # 0 0 = pushed
gh pr list --head feature-smoke-explorer-indicators
```

## Decisions

| # | Decision | Who / when | Notes |
|---|---|---|---|
| D1 | One URL per unique indicator (263) or per topic–indicator pair (305)? | **Unique, 263 — Chris, 2026-10-02** | Recommend unique: rendering is per indicator, and a topic page differs only in its header and menus. Pairs cost 42 more loads. Under unique, an indicator is loaded under the first topic that lists it, in the JSON's key order |
| D2 | Which views: rotate `overlay` through map-only, bar, trend, links, table across the list (each view on ~53 indicators), or map-only for all? | **Rotate, both params — Chris, 2026-10-02** | Recommend rotating, which costs the same number of loads. Map-only leaves bar/trend/correlate/table unexercised, which is where most of #1462's review findings were. A view that is disabled for an indicator resolves to `none` on the new explorer (`showOverlayTab`, #1462 `1808f80eeb`); production's old explorer reads `overlay` differently, which Task 0 records. **Task 0 found** the old explorer ignores `overlay`: it takes its view from `#display=summary\|map\|trend\|links` and opens the table when there is none. So until #1462 merges, an `overlay`-only rotation exercises the table alone, as CI's 41 default indicators do today. Option: append the matching hash too (`&overlay=trend#display=trend`). Whether the new explorer tolerates the hash is unchecked. **Decided:** both params, paired by the new explorer's own `legacyOverlayByHash` (#1462 `app.js`, `normalizeLegacyHashOverlayURL`): `bar`↔`#display=map`, `trend`↔`#display=trend`, `links`↔`#display=links`, `table`↔`#display=summary`, and map-only carries no hash. A `#display=map` with no `overlay` would be backfilled to `bar`. That function only backfills a missing `overlay` and then strips the hash, so the query param wins; this is from reading the source, and Task 3 checks it at runtime. On the old explorer the rotation gives table ×2, map, trend, links |
| D3 | Merge order with #1462 | **This PR first — Chris, 2026-10-02** | #1462 on its own drops CI's explorer coverage from 41 default indicators to 0 (see Why), which argues for this landing first or together. Whichever PR lands second merges the other in. If this lands first, it sweeps production's old explorer until #1462 merges. If it lands after #1462 without D15 fixed, its CI should fail on the unmapped indicators, which is the point. Either way the second merge must rewrite #1462's `CLAUDE.md` bullet "CI's sweeps render no Data Explorer indicator" (`9e38df2bdc`), which this change makes false. The #1462 merge must also delete D5's two old-explorer `KNOWN_NOISE` entries (`c4cb137647`) |
| D4 | Smoke cannot see a data-host 404 through console text: `KNOWN_NOISE`'s site-wide `{ page: null, error: /favicon\|Failed to load resource\|net::ERR/i }` matches Chrome's `Failed to load resource: the server responded with a status of 404 (Not Found)`, on `production` and on `feature-new-data-explorer` alike. Add a check in `visit` that fails a page on any ≥400 response from `raw.githubusercontent.com`? | **Yes, every page — Chris, 2026-10-02** | Found in Task 0. Recommend yes, on every page rather than explorer paths only: NR and data-story pages fetch EHDP-data too, and the check reads response status, so it leaves the allowlist untouched. A 404 is caught today only if a JS error follows it, as in Task 0's late control. Whether D15's missing `citywide.topo.json` is followed by one is unmeasured, so Task 3's expected `Failed to load resource … 404` failure would not happen without this |
| D5 | Task 2's sweep fails on production's own tree, so this PR's CI will be red as-is. Three failures, all survived the sequential re-check: (a) `data-explorer/weather-related-illness/?id=2074&overlay=trend#display=trend`: `Cannot read properties of undefined (reading 'columnNames')`; (b) `data-explorer/worker-health/?id=2211&overlay=trend#display=trend`: Vega `Expression parse error: 'Hospitalizations billed to workers' compensation: …'`, where the apostrophe ends a quoted string; (c) `data-features/cooling-info/`: `Cannot read properties of undefined (reading 'AQI')`. Fix, scope-allowlist, or leave red? | **Chris, 2026-10-02:** (a) and (b) scope-allowlisted in `feature-smoke-explorer-indicators @ c4cb137647`, by indicator id and error text; (c) and (d) out of this PR | Allowlist scope `[verified 2026-10-02, noise-scope-check.mjs through the real isKnownNoise, 11/11]`: the same id under any view matches; id 2075, id 20745, another topic, and another error on the same page do not; (d) stays visible. No full sweep was re-run for this commit; Task 4's CI run is the whole-site check. (c) wants a guard in `cooling-info.js` `getAQI`, the same class as `e6a48727fe`. (d) belongs to #1462. | (a) and (b) are old-explorer trend-view defects that only the D2 hash rotation reaches; today's CI loads no `#display=trend`. Whether #1462's explorer has them is Task 3's question. (c) is a sitemap page this change does not reach: `cooling-info.js` `getAQI` compares `aqiAPI[0].AQI` with `aqiAPI[1].AQI`, and AirNow's response varies. It is the same class as the unmerged AirNow guard (`e6a48727fe`). It is attributed by mechanism, not by a base run. Task 0's `reading 'array'` pageerror did not recur; that run had no hashes, so each indicator showed a different view. **Task 3 adds:** on #1462's explorer, (a) and (b) do not occur and (c) did not fail in either merged run. A fourth failure appears there instead: (d) `falls-among-older-adults/?id=2188` (bar) and `?id=2403` (trend), `reading 'array'`, in both the pinned and live runs and surviving the re-check. Under D3 (this PR first), this PR's CI sweeps production's old explorer and is red on (a) and (b), and on (c) whenever AirNow returns fewer than 2 rows. #1462's CI, once it merges this in, is red on (d) |

## Global Constraints

- `scripts/site-characterization.mjs` must not enumerate the new paths: it imports only
  `collectAllPaths`, and that stays sitemap-only.
- An enumeration that finds nothing is an error, not an empty list. Throw when the JSON is missing,
  non-200 or empty, as `collectAllPaths` does for an empty sitemap.
- Print the count breakdown every run (unique ids, pairs, topics), as `collectAllPaths` does, so a
  shrinking list is visible.
- No new CLI flags. `--all` widens; the curated `PAGES` default and `smoke:env … sample` are unchanged
  (positional-argument rule, project `CLAUDE.md`).
- Never run two Hugo builders against the tree. Runtime checks use `scripts/isolated-server.mjs` or
  `node scripts/smoke-env.mjs <env>`, which isolate `-d` and `HUGO_RESOURCEDIR`.
- Throwaway probes live in the gitignored `scripts/.sc-rebaseline/` and block
  `www.googletagmanager.com` and `www.google-analytics.com`.
- JS style: `documents/js-conventions.md`, 4-space indent, comment the why.

## Review Focus

1. **`topic_indicators.json` missing or served as an HTML 404 page.** The sweep must stop with an
   error naming the URL, never sweep zero explorer pages and pass. Test in Task 1, Step 3.
2. **EHDP-data throttling.** 263 fresh browser contexts each fetch `metadata.json` (1.15 MB) plus
   data and geometry from `raw.githubusercontent.com`. A 429 would surface as console errors on many
   pages and read as a regression. Task 0 measures 4xx counts and bytes before any code is written.
3. **An error that fires after the fixed 2 s settle.** Explorer pages fetch their data after
   `load`. Task 0 proves whether a delayed 404 reaches the collector; Task 2's wait is what makes it
   reliable.
4. **The same indicator under several topics.** It is deduplicated, and the printed reconciliation
   (unique vs pairs) must match the JSON. Test in Task 1, Step 4.
5. **A wait that never ends.** A page that keeps polling the data host must not hang the
   sweep: the quiet wait has a hard cap, and reaching the cap is counted in the report, not failed.
   Test in Task 2, Step 4.

---

## Task 0: Evidence: cost, throttling, and whether the collector sees late errors

No tracked change. Decides whether Task 2 needs a shared browser context (throttling) and confirms
the quiet wait is needed at all.

**Files:**
- Create (untracked): `scripts/.sc-rebaseline/explorer-sweep-probe.mjs`

**Interfaces:**
- Produces: four numbers recorded in the ledger. Wall time for the 263 paths at concurrency 6,
  bytes and 4xx/429 counts from `raw.githubusercontent.com`, pages with console errors, and the
  late-error control's result.

- [ ] **Step 1: Write the expectations into the ledger row before running.** Expect: 0 responses
  of 429. 4xx only on files known to be missing (none on production's old explorer). Wall time under
  6 min locally. The late-error control is seen with the quiet wait and missed without it.
  **No power if:** the probe's own route counter for `raw.githubusercontent.com` reads 0 (it never
  watched the data host), or the late-error control's delayed route was hit 0 times.

- [ ] **Step 2: Write the probe.** It reuses `startServer` and loads every path the Task 1 function
  will return. The function is inlined here, so Task 0 does not depend on Task 1.

```js
// Throwaway: what does sweeping every explorer indicator cost, and does a late error get seen?
import { chromium } from "playwright";
import { startServer } from "../isolated-server.mjs";
import { mapPool } from "../site-urls.mjs";

const BLOCKED = ["www.googletagmanager.com", "www.google-analytics.com"];
const DATA_HOST = "raw.githubusercontent.com";
const { baseURL, stop } = await startServer("prod_prod");

try {
    const topics = await fetch(baseURL + "IndicatorMetadata/topic_indicators.json").then(r => r.json());
    const seen = new Set(), paths = [];
    for (const [topic, v] of Object.entries(topics)) for (const id of v.IndicatorID) {
        if (!seen.has(id)) { seen.add(id); paths.push(`data-explorer/${topic}/?id=${id}`); }
    }
    console.log(`paths: ${paths.length}`);

    const browser = await chromium.launch();
    const stats = { bytes: 0, dataRequests: 0, status4xx: {}, errorPages: [] };
    const t0 = Date.now();
    await mapPool(paths, 6, async (path) => {
        const page = await browser.newPage();
        const errors = [];
        page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
        page.on("pageerror", e => errors.push(e.message.slice(0, 120)));
        page.on("response", async r => {
            if (new URL(r.url()).host !== DATA_HOST) return;
            stats.dataRequests++;
            if (r.status() >= 400) stats.status4xx[r.status()] = (stats.status4xx[r.status()] || 0) + 1;
            // Body length, not content-length: compressed responses can omit the header.
            stats.bytes += (await r.body().catch(() => Buffer.alloc(0))).length;
        });
        await page.route("**/*", route => BLOCKED.includes(new URL(route.request().url()).host) ? route.abort() : route.continue());
        await page.goto(baseURL + path, { waitUntil: "load", timeout: 30000 }).catch(e => errors.push("nav: " + e.message));
        await page.waitForTimeout(2000);
        if (errors.length) stats.errorPages.push({ path, errors: errors.slice(0, 3) });
        await page.close();
    });
    console.log(JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), ...stats, errorPageCount: stats.errorPages.length }, null, 1));

    // Late-error control: delay one geometry file 6 s and 404 it, then read errors at 2 s and at quiet.
    const page = await browser.newPage();
    let held = 0; const errs = [];
    page.on("console", m => { if (m.type() === "error") errs.push({ t: Date.now(), text: m.text().slice(0, 80) }); });
    await page.route(/geography\/.*\.topo\.json/, async r => { held++; await new Promise(res => setTimeout(res, 6000)); await r.fulfill({ status: 404, body: "" }); });
    const start = Date.now();
    await page.goto(baseURL + paths[0], { waitUntil: "load" });
    await page.waitForTimeout(2000);
    const at2s = errs.length;
    await page.waitForTimeout(8000);
    console.log(JSON.stringify({ lateControl: { held, errorsBy2s: at2s, errorsBy10s: errs.length, firstErrorAfterMs: errs[0] ? errs[0].t - start : null } }));
    await browser.close();
} finally {
    stop();
}
```

- [ ] **Step 3: Run it.** Run: `node scripts/.sc-rebaseline/explorer-sweep-probe.mjs > <scratch>/explorer-sweep.log 2>&1`
  Expected: as in Step 1. Record every number in the Task 0 row. If any 429 appears, Task 2 adds a
  shared `browser.newContext()` for explorer pages (so the HTTP cache is shared) and Task 0 is re-run
  with it. If `errorsBy2s` equals `errorsBy10s`, the quiet wait is not needed for this case; say so
  and keep it anyway for Review Focus 3, or drop it on Chris's call.

- [ ] **Step 4: Record what production's old explorer does with `&overlay=`** (for D2). Load
  `data-explorer/asthma/?id=2380&overlay=trend` in the same probe style and record whether a trend
  pane is shown. Record the observation only; nothing in this plan depends on the old explorer
  honouring it.

## Task 1: `collectExplorerIndicatorPaths` in `site-urls.mjs`

**Files:**
- Modify: `scripts/site-urls.mjs`: add the function after `collectAllPaths` (currently ends at the
  `return all;` closing it, line ~126).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export async function collectExplorerIndicatorPaths(baseURL: string): Promise<string[]>`.
  It returns paths relative to `baseURL`, with no leading slash (the same contract as
  `collectAllPaths`). Form: `data-explorer/<topic>/?id=<n>` with `&overlay=<view>` appended per D2.

- [x] **Step 1: Add the function.** As written in `scripts/site-urls.mjs`: `EXPLORER_VIEWS` and
  `collectExplorerIndicatorPaths`, after `collectAllPaths`. The draft that stood here differed in
  two ways. Views are `{ overlay, hash }` pairs per D2, so a path reads
  `data-explorer/<topic>/?id=<n>&overlay=trend#display=trend`. And an empty id list throws, as a
  missing file does.

- [ ] **Step 2: Check it against an isolated server.** Write
  `scripts/.sc-rebaseline/collect-check.mjs` (untracked):

```js
import { startServer } from "../isolated-server.mjs";
import { collectExplorerIndicatorPaths } from "../site-urls.mjs";
const { baseURL, stop } = await startServer("prod_prod");
try {
    const paths = await collectExplorerIndicatorPaths(baseURL);
    console.log(paths.length, paths.slice(0, 6));
    // Review Focus 1: a base URL with no JSON must throw, not return [].
    await collectExplorerIndicatorPaths(baseURL + "no-such-dir/")
        .then(p => console.log("CONTROL FAILED: returned", p.length))
        .catch(e => console.log("control threw:", e.message.slice(0, 90)));
} finally { stop(); }
```

  Run: `node scripts/.sc-rebaseline/collect-check.mjs`
  Expected: `Explorer indicators: 263 unique of 305 topic pairs in 41 topics`, 263 paths, the
  first six cycling `""`, `bar`, `trend`, `links`, `table`, `""`, then `control threw: …404…`.

- [ ] **Step 3 (Review Focus 1):** the control line in Step 2 is the test. `CONTROL FAILED` is
  a stop.

- [ ] **Step 4 (Review Focus 4):** confirm the reconciliation independently of the function:
  `python -c "import json;d=json.load(open('<tmp>/IndicatorMetadata/topic_indicators.json'));p=[i for v in d.values() for i in v['IndicatorID']];print(len(p),len(set(p)))"`
  against the same build. Expected `305 263`, matching Step 2's line.

- [ ] **Step 5: Confirm characterization is untouched.** `grep -n "collectExplorerIndicatorPaths" scripts/*.mjs`.
  Expected: hits in `site-urls.mjs` only (Task 2 adds `smoke-pages.mjs`), and none in
  `site-characterization.mjs`.

- [ ] **Step 6: Commit** `scripts/site-urls.mjs` alone.

## Task 2: Wire it into `smoke-pages.mjs --all`, with the data-quiet wait

**Files:**
- Modify: `scripts/smoke-pages.mjs`: the import (line ~30), `visit` (the `goto` +
  `waitForTimeout(2000)` block, ~line 267), and `main`'s path selection
  (`const paths = all ? await collectAllPaths(baseURL) : PAGES;`, ~line 330).

**Interfaces:**
- Consumes: `collectExplorerIndicatorPaths(baseURL)` from Task 1.
- Produces: `--all` sweeps `[...collectAllPaths, ...collectExplorerIndicatorPaths]`, and the JSON
  report gains `explorerIndicators` (count) and `quietCapReached` (paths whose wait hit the cap).

- [ ] **Step 1: Path selection.**

```js
import { collectAllPaths, collectExplorerIndicatorPaths, mapPool } from "./site-urls.mjs";
// …
const paths = all
    ? [...await collectAllPaths(baseURL), ...await collectExplorerIndicatorPaths(baseURL)]
    : PAGES;
```

- [ ] **Step 2: The quiet wait, inside `visit`, for explorer indicator paths only.**

```js
// Explorer pages with an id fetch their indicator data from EHDP-data after `load`, so an error
// in that data or in the rendering it drives can fire after the 2 s settle below. For those pages,
// wait first until no request to the data host has been in flight for QUIET_MS, capped at
// QUIET_CAP_MS so a page that keeps polling cannot hang the sweep.
const DATA_HOST = "raw.githubusercontent.com";
const QUIET_MS = 1000;
const QUIET_CAP_MS = 15000;
const isExplorerIndicator = (path) => /^data-explorer\/[^/]+\/\?id=/.test(path);

// in visit(), before page.goto:
let inFlight = 0;
let lastDataActivity = Date.now();
const onData = (request, delta) => {
    if (new URL(request.url()).host !== DATA_HOST) return;
    inFlight += delta;
    lastDataActivity = Date.now();
};
page.on("request", (r) => onData(r, +1));
page.on("requestfinished", (r) => onData(r, -1));
page.on("requestfailed", (r) => onData(r, -1));

// in visit(), after page.goto and before waitForTimeout(2000):
let quietCapReached = false;
if (isExplorerIndicator(path)) {
    const start = Date.now();
    while (inFlight > 0 || Date.now() - lastDataActivity < QUIET_MS) {
        if (Date.now() - start > QUIET_CAP_MS) { quietCapReached = true; break; }
        await page.waitForTimeout(200);
    }
}
```

  `visit` then returns `{ errors, quietCapReached }` instead of `errors`. Update its two callers
  in `main`, the concurrent sweep and the sequential re-check, to read `.errors`, and collect the
  paths with `quietCapReached` into the report.

  **Added for D4:** a `response` listener in `visit`, on every page, that pushes
  `EHDP-data responded <status>: <url>` for any ≥400 from `raw.githubusercontent.com`. The
  message goes through `isKnownNoise`, so a known gap can be scoped like any other entry. It shares
  the host test with the quiet-wait counters. Network-level failures (`requestfailed`) stay
  uncounted, as before; D4 decided on status only.

- [ ] **Step 3: Run the full sweep on an isolated `prod_prod`.**
  Run: `node scripts/smoke-env.mjs prod_prod > <scratch>/smoke-all.log 2>&1`
  Expected:
  - `Enumerated 924 pages = …` and `Explorer indicators: 263 unique of 305 …`;
  - every explorer path visited;
  - failures limited to what Task 0 recorded on production's old explorer.

  Record the wall time against Task 0's.

- [ ] **Steps 4 and 5 (Review Focus 5, 3 and D4), revised:** these run through a throwaway copy,
  not a local edit of the tracked file. The tracked file is uncommitted at this point, so the
  prescribed `git diff … | grep -c QUIET_CAP_MS` revert proof could not separate the probe edit
  from the task's own diff. `scripts/.sc-rebaseline/smoke-visit-copy.mjs` is `smoke-pages.mjs`
  with `visit` exported, `main()` not called, and three hooks: a cap override, a wait-off switch,
  and a per-page route. A driver (`smoke-visit-control.mjs`) runs the real `visit` against an
  isolated `prod_prod` in three arms:
  - **A**, the late control with the wait: `indicators/data/<id>.json` held 6 s, then 404. Expected:
    errors include `EHDP-data responded 404: …` (D4) and the JSON-parse pageerror, with
    `quietCapReached: false`.
  - **B**, the same with the wait off. Expected: no errors, i.e. missed.
  - **C**, an unrouted explorer page with the cap at 500 ms. Expected: `quietCapReached: true`, and
    the page's errors are those of an ordinary run.

- [ ] **Step 6: Commit** `scripts/smoke-pages.mjs`.

## Task 3: Positive control: the sweep on a local merge with `feature-new-data-explorer`

No tracked change. A real known-bad case, not an injected one: D15's missing
`citywide.topo.json` on EHDP-data `production`.

- [ ] **Step 1: Write the expectation first.** On the merged tree, explorer paths whose rendered
  measure takes the unmapped path fail with `EHDP-data responded 404: …/geography/citywide.topo.json`
  (corrected 2026-10-02: the plan first said `Failed to load resource … 404`, which `KNOWN_NOISE`'s
  site-wide entry swallows; see D4). That's more than 0 and at
  most 68 indicators (68 is the count of indicators with any unmapped measure; only those whose
  default or URL measure is unmapped load the file). **No power if:** EHDP-data `production` has
  gained `citywide.topo.json` by then (check: `curl -s -o /dev/null -w '%{http_code}' https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/citywide.topo.json`
  → 404 means the control still has power).

- [ ] **Step 2:** `git switch -c scratch-smoke-merge feature-smoke-explorer-indicators`, then
  `git merge --no-edit feature-new-data-explorer`. Resolve nothing by hand: if it conflicts, record
  the files and stop, since D3 then needs a decision.

- [ ] **Step 3:** `node scripts/smoke-env.mjs prod_prod > <scratch>/smoke-merged.log 2>&1`.
  Record the explorer failures and their distinct signatures in the ledger. Also check D2's
  hash pairing at runtime: load one `&overlay=trend#display=trend` path and confirm the URL
  keeps `overlay=trend` with the hash stripped, and that the trend view is the one shown.

- [ ] **Step 4:** `git switch feature-smoke-explorer-indicators`, then
  `git branch -D scratch-smoke-merge`. Never push it.

## Task 4: Docs, CI budget, PR

**Files:**
- Modify: `CLAUDE.md`: smoke section, the `smoke:all` enumeration bullet ("`smoke:all`
  enumerates rather than hardcodes…"). Add that `--all` also loads one `?id=` URL per unique
  indicator from `topic_indicators.json`, with the counts from Task 2 Step 3, and that
  characterization deliberately does not.
- Modify: `.github/workflows/smoke.yml`: `timeout-minutes` for both jobs, only if Task 2's
  measured wall time puts the job within 5 min of 25.

- [ ] **Step 1:** Edit `CLAUDE.md`, then run `npm run docs-check` (expected: PASSED).
- [ ] **Step 2:** Commit the docs (and the workflow, if changed), then update this ledger with
  every task's hash and proof in a separate commit.
- [ ] **Step 3:** Push (Chris), `gh pr create --base production --head feature-smoke-explorer-indicators`,
  and read both PR checks by head SHA. Expected: the smoke job's log shows `Explorer indicators: 263 …`,
  and the run's wall time fits the timeout.
