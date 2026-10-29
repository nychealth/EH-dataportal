# Congestion Pricing Report — Custom Analytics Events

**Goal:** Instrument the interactive controls on the Congestion Relief Zone air quality report with GA4 custom events, so we can see which sites, monitors, and sections readers actually engage with.

**Approach:** Five `gtag('event', ...)` call sites added to existing handlers in `assets/js/congestion-pricing-report/`, plus one `data-` attribute pass on the template. No new files, no new dependencies, no changes to how any control behaves. Events are fired from the DOM listeners themselves rather than from the callbacks they invoke, so programmatic and resize-driven re-renders cannot emit phantom interactions.

**Stack:** `gtag.js`, loaded unconditionally in [`themes/dohmh/layouts/partials/head.html:8-37`](../themes/dohmh/layouts/partials/head.html). jQuery (already present, used by `sticky-header.js`). Leaflet (already present, used by both map files).

**Origin:** This plan was written from a session discussion on 2026-08-14; there is no separate spec document. The requirements are restated in full below.

---

## Status

| Task | State | Proof that ran |
|---|---|---|
| 1. GA4 property configuration | not started | — |
| 2. Site picker events | not started | — |
| 3. Site badge events | not started | — |
| 4. Map marker events | not started | — |
| 5. Section view events | not started | — |
| 6. Smoke test coverage | not started | — |
| 7. Verification pass | not started | — |

Update this table as tasks land. Record the commit hash, never "done, uncommitted" — that phrasing is falsified by the commit that carries it.

---

## Global constraints

- **Event and parameter names are snake_case, parameters flat.** This matches the four custom events already in the repo: `click_tab`/`{tab}` ([`assets/js/data-explorer/app.js:106`](../assets/js/data-explorer/app.js)), `click_modal`/`{modal_name}` ([`themes/dohmh/layouts/partials/nr-indicator-new.html:320`](../themes/dohmh/layouts/partials/nr-indicator-new.html)), `file_download`/`{file_name, file_extension, link_text}` ([`themes/dohmh/layouts/nr-output/single.html:533`](../themes/dohmh/layouts/nr-output/single.html)), `search`/`{search_term}` ([`themes/dohmh/layouts/partials/footer.html:216`](../themes/dohmh/layouts/partials/footer.html)).
- **No `typeof gtag` guard.** `gtag` is defined by an inline `function` declaration in *both* branches of the environment conditional in `head.html`, so it exists on every page in every environment. Existing repo code calls it bare; match that.
- **4-space indentation**, and the generous vertical spacing already used throughout `assets/js/congestion-pricing-report/`.
- **Comments explain why, not what.** Each new call site gets one line explaining why it sits where it sits — those placements are the non-obvious part.
- **No behavior changes.** Every task adds statements; none reorders, removes, or rewrites existing logic.
- **Parameter names are permanent once registered.** GA4's custom-dimension form locks the "Event parameter" field after save (Google's documentation, retrieved 2026-08-14). Renaming a parameter later orphans the dimension. Settle names in Task 1.

---

## Task 1: Configure the GA4 property

No code. This runs first because GA4 does not backfill: parameter values that arrive before their custom dimension exists never become reportable, so registering after launch forfeits the launch window.

**Files:** none — this is admin work in the GA4 web UI.

**Interfaces:**
- Produces: seven registered event-scoped custom dimensions whose "Event parameter" values are consumed verbatim by Tasks 2–5; a yes/no answer on enhanced measurement that decides whether any PDF work exists.

**Access required:** Editor or Administrator on the property. Do the dev property `G-PB98MPZ31B` first — local `hugo serve` and the staging build both report there, so the whole plan can be verified before production `G-64BWDRHRGB` is touched.

- [ ] **Step 1: Register the custom dimensions**

Path: **Admin → Data display → Custom definitions →** the **Custom dimensions** tab **→ Create custom dimensions**. Scope is `Event` for all seven. The "Event parameter" column must match the code character for character.

| Event parameter | Dimension name | Description to enter |
|---|---|---|
| `site` | CP site | EJ community site or regional monitor name, CP report |
| `chart` | CP chart | Which CP report chart a site selection belongs to |
| `control` | CP selector control | Whether a CP site was chosen by button or mobile select |
| `map` | CP map | Which CP report map a marker click belongs to |
| `site_id` | CP monitor site ID | NYCCAS monitor site ID, CP monitoring map |
| `site_type` | CP monitor site type | Monitor or counter type, CP report maps |
| `section` | CP section | CP report section reached while scrolling |

Dimension names allow underscores and spaces but prohibit hyphens. The `CP ` prefix is not required by anything; it keeps these sorted together and away from future pages. Drop it if it conflicts with an existing naming scheme in the property.

Registration is keyed to the parameter name, not the event — so the one `site` dimension serves `select_site`, `click_badge`, and the regional half of `click_map_marker`.

- [ ] **Step 2: Check enhanced measurement, and record the answer here**

Path: **Admin → Data collection and modification → Data streams →** click the stream **→ Enhanced measurement**. Use the settings icon to see individual toggles.

Record in this document whether **File downloads** and **Outbound clicks** are enabled:

> File downloads: ______ Outbound clicks: ______ `[checked <date> by <name>]`

Google documents `file_download` as firing automatically against the extension pattern `pdf|xlsx?|docx?|txt|rtf|csv|exe|key|pp(s|t|tx)|7z|pkg|rar|gz|zip|avi|mov|mp4|mpe?g|wmv|midi?|mp3|wav|wma` (retrieved 2026-08-14). `pdf` is in that pattern.

**If File downloads is on:** the four appendix PDFs — `pdf/Appendix1.pdf` through `Appendix3.pdf` from [`content/data-features/congestion-pricing-report/more-info.md:6`](../content/data-features/congestion-pricing-report/more-info.md) and `embeds/CRZ_Report_Appendix.pdf` from [`analysis.md:16`](../content/data-features/congestion-pricing-report/analysis.md) and [`conclusion.md:20`](../content/data-features/congestion-pricing-report/conclusion.md) — are already tracked. Add nothing. A custom `file_download` on the same links would double-count.

**If it is off:** either switch it on (preferred — it covers the whole site, not just this page) or open a follow-up task. Do not add per-link handlers to this page as a workaround for a property-wide setting.

The external nyc.gov methods PDF at [`conclusion.md:23`](../content/data-features/congestion-pricing-report/conclusion.md) is covered by Outbound clicks under the same reasoning.

- [ ] **Step 3: Note the quota**

The Custom definitions page shows event-scoped dimension usage against the property's cap. Seven new entries is small, but the portal's property is shared across every page — confirm there is room before assuming these saved. I have not verified what the cap is; the number is on that page.

**Verification for this task:** the seven dimensions appear in the Custom definitions list with scope `Event`, and Step 2's blanks above are filled in with a date. Nothing else in this plan can be checked against reports until 24–48 hours after both the dimension exists and matching data has been sent (Google's documentation, retrieved 2026-08-14) — which is why Task 7 verifies through DebugView and `dataLayer` instead.

---

## Task 2: Site picker events

The EJ picker (`#cpSiteButtons`, driving `#cpVis` and `#aqChangeVis`) and the time-of-day picker (`#todSiteButtons`, driving `#cpVisTOD`) are both built by `createSiteSelector`. One edit to that function covers both; the call sites only pass a label.

**Files:**
- Modify: `assets/js/congestion-pricing-report/shared.js:100` (signature), `:123` (select listener), `:138-144` (button click handler)
- Modify: `assets/js/congestion-pricing-report/chart-ej.js:684-692` (call site)
- Modify: `assets/js/congestion-pricing-report/chart-tod.js:292-300` (call site)

**Interfaces:**
- Consumes: the `site`, `chart`, and `control` dimensions from Task 1.
- Produces: event `select_site` with `{chart, site, control}`. `chart` is `"ej"` or `"tod"`; `control` is `"button"` or `"select"`; `site` is the site name string as it appears in `site_names` / `tod_site_names`. Task 7 asserts against these exact values.

- [ ] **Step 1: Accept a `chart` label in the selector factory**

`shared.js:100`, change:

```js
function createSiteSelector({ wrapId, sites, idPrefix, getCurrent, onChange }) {
```

to:

```js
function createSiteSelector({ wrapId, sites, idPrefix, getCurrent, onChange, chart }) {
```

- [ ] **Step 2: Fire on the mobile `<select>`**

`shared.js:123`, change:

```js
        sel.addEventListener("change", () => onChange(sel.value));
```

to:

```js
        // Fired from the listener rather than from onChange, because
        // createSiteSelector is re-called on every 768px breakpoint crossing to
        // swap the control — instrumenting onChange would emit a selection the
        // reader never made.

        sel.addEventListener("change", () => {

            gtag('event', 'select_site', { chart: chart, site: sel.value, control: 'select' });

            onChange(sel.value);

        });
```

- [ ] **Step 3: Fire on the desktop button group**

`shared.js:138-144`, change:

```js
            btn.addEventListener("click", async () => {

                [...btnWrap.querySelectorAll("button")].forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                await onChange(site);

            });
```

to:

```js
            btn.addEventListener("click", async () => {

                gtag('event', 'select_site', { chart: chart, site: site, control: 'button' });

                [...btnWrap.querySelectorAll("button")].forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                await onChange(site);

            });
```

The `control` parameter separates mobile from desktop without a device dimension, and answers a question we cannot otherwise ask: whether the mobile `<select>` is being found at all.

- [ ] **Step 4: Label the EJ call site**

`chart-ej.js:684-692`, add `chart: "ej",` to the options object:

```js
    createSiteSelector({

        wrapId: "cpSiteButtons",
        sites: site_names,
        idPrefix: "",
        chart: "ej",

        getCurrent: () => currentSite,
        onChange: handleSiteChange,

    });
```

- [ ] **Step 5: Label the time-of-day call site**

`chart-tod.js:292-300`, add `chart: "tod",`:

```js
    createSiteSelector({

        wrapId: "todSiteButtons",
        sites: tod_site_names,
        idPrefix: "tod-",
        chart: "tod",
        getCurrent: () => todCurrentSite,
        onChange: handleTODSiteChange,

    });
```

- [ ] **Step 6: Confirm the page still loads**

Rung: browser load. These files are classic scripts sharing one top-level scope, so a syntax error takes down the whole page rather than one handler. Load the report locally and confirm both charts render and both pickers still switch sites. Payload correctness is Task 7's job, not this step's.

---

## Task 3: Site badge events

The seven badges above the monitoring map ([template `:211-217`](../themes/dohmh/layouts/data-features/congestion-pricing-report.html)) are the clearest read on which communities brought readers to the report.

**Files:**
- Modify: `assets/js/congestion-pricing-report/sticky-header.js:115-133` (the `.site-badge` click handler)

**Interfaces:**
- Consumes: the `site` dimension from Task 1.
- Produces: event `click_badge` with `{site}`, where `site` is the resolved full site name from `CP_BADGE_TO_SITE` — the same vocabulary `select_site` uses, so both events break down on one dimension.

- [ ] **Step 1: Add the call after the site name resolves**

`sticky-header.js`, inside `$('.site-badge').on('click', ...)`, immediately after the `var info = ...` line:

```js
        // Reports the resolved site name, not the data-site key, so this shares
        // the `site` dimension with select_site. Falls back to the key so an
        // unmapped badge still records something identifiable.

        gtag('event', 'click_badge', { site: siteName || siteKey });
```

- [ ] **Step 2: Do not instrument the zoom this handler triggers**

The same handler calls `window.cpReportZoomToSite(siteName)`. Task 4 instruments marker clicks only, so a badge-driven zoom produces exactly one event. Leave the `cpReportZoomToSite` call untouched — this step is a constraint on Task 4, not an edit.

- [ ] **Step 3: Confirm badges still work**

Rung: browser. Click a badge, confirm `#site-info-box` updates and the map zooms as before.

---

## Task 4: Map marker events

Two maps, two nearly identical Leaflet handlers, different data shapes.

**Files:**
- Modify: `assets/js/congestion-pricing-report/map-monitoring.js:158-161` (marker click)
- Modify: `assets/js/congestion-pricing-report/map-regional.js:64-67` (marker click)

**Interfaces:**
- Consumes: the `map`, `site_id`, `site_type`, and `site` dimensions from Task 1.
- Produces: event `click_map_marker`. From the monitoring map: `{map: 'monitoring', site_id, site_type}`. From the regional map: `{map: 'regional', site, site_type}`.

The two payloads differ deliberately. The monitoring dataset has a `SiteID` field; the regional dataset has no ID column at all, only `Site Name`. Sending a name in a parameter called `site_id` would be a misleading name of exactly the kind the repo's rules say to avoid, so the regional event reuses `site` instead. The cost: `site` then holds two vocabularies — EJ community names and regional monitor names. They are always separable by event name and `map`, and reusing the dimension avoids an eighth registration. Flip this to a separate `site_name` dimension if the mixed vocabulary proves confusing in reports.

- [ ] **Step 1: Instrument the monitoring map**

`map-monitoring.js:158-161`, change:

```js
            // Clicking a marker zooms in on it
            site.on('click', function (event) {
                map.setView(event.latlng, 13);
            });
```

to:

```js
            // Clicking a marker zooms in on it
            site.on('click', function (event) {

                // site_type separates traffic counters from integrated monitors
                // from PM2.5 real-time monitors — i.e. whether readers explore
                // the monitor network or only the sites named in the prose.

                gtag('event', 'click_map_marker', {
                    map: 'monitoring',
                    site_id: siteData.SiteID,
                    site_type: siteData.SiteType
                });

                map.setView(event.latlng, 13);

            });
```

- [ ] **Step 2: Instrument the regional map**

`map-regional.js:64-67`, change:

```js
            // Clicking a marker zooms in on it

            site.on('click', function (event) {
                map.setView(event.latlng, 13);
            });
```

to:

```js
            // Clicking a marker zooms in on it

            site.on('click', function (event) {

                // The regional dataset has no ID column, so the site name goes
                // in `site` rather than being mislabelled as site_id.

                gtag('event', 'click_map_marker', {
                    map: 'regional',
                    site: siteData['Site Name'],
                    site_type: siteData.Type
                });

                map.setView(event.latlng, 13);

            });
```

- [ ] **Step 3: Confirm both maps still zoom**

Rung: browser. Click a marker on each map, confirm the popup opens and the view zooms to level 13.

---

## Task 5: Section view events

The sticky-header machinery already computes which header is stuck on every scroll, so the scroll-spy is free. This is the one task with a real noise risk: `update()` runs on every scroll event, and an unguarded fire would flood the property.

There are five `.cp-sticky-header` elements. Two headings on the page — "EJ-Designated Community Site Analysis" (`:209`) and "Evaluation analysis" (`:240`) — are *not* sticky headers and are therefore not covered. That is a known limitation, not an oversight; extending coverage would mean making them sticky, which is a visual change outside this plan's scope.

**Files:**
- Modify: `themes/dohmh/layouts/data-features/congestion-pricing-report.html:199, 281, 322, 352, 386` (add `data-cp-section`)
- Modify: `assets/js/congestion-pricing-report/sticky-header.js:76-101` (the `update()` function), plus one variable declaration above it

**Interfaces:**
- Consumes: the `section` dimension from Task 1.
- Produces: event `view_section` with `{section}`, at most once per section per page load. Values are exactly the five slugs below.

- [ ] **Step 1: Label the five sticky headers**

Add a `data-cp-section` attribute to each. An explicit attribute rather than reading `textContent` because the `:281` header's text is rewritten at runtime by the site picker — its label would otherwise change mid-session and fragment the dimension.

| Line | Current element | Attribute to add |
|---|---|---|
| 199 | `<h2 class="h3 cp-sticky-header">Air pollution monitoring</h2>` | `data-cp-section="monitoring"` |
| 281 | `<h3 class="h3 cp-sticky-header mb-3">` (dynamic site question) | `data-cp-section="site-question"` |
| 322 | `<h3 class="cp-sticky-header">Air quality changes throughout the day</h3>` | `data-cp-section="time-of-day"` |
| 352 | `<h3 class="cp-sticky-header">Pollution outside of NYC </h3>` | `data-cp-section="regional"` |
| 386 | `<h2 class="h3 cp-sticky-header">Conclusion</h2>` | `data-cp-section="conclusion"` |

Line 199 becomes:

```html
            <h2 class="h3 cp-sticky-header" data-cp-section="monitoring">Air pollution monitoring</h2>
```

- [ ] **Step 2: Add the fired-once record**

`sticky-header.js`, inside the first `$(function () { ... })`, beside the existing `var $headers = $('.cp-sticky-header');`:

```js
    // Sections already reported this page load. update() runs on every scroll
    // event, so without this guard view_section would fire hundreds of times
    // per reader.

    var sectionsSeen = {};
```

- [ ] **Step 3: Fire when a header first sticks**

In `update()`, inside the `else` branch, immediately after `$h.addClass('cp-is-fixed').css('top', fixedTop + 'px');`:

```js
                var section = $h.attr('data-cp-section');

                if (section && !sectionsSeen[section]) {
                    sectionsSeen[section] = true;
                    gtag('event', 'view_section', { section: section });
                }
```

Use `.attr()`, not `.data()` — jQuery's `.data()` camel-cases hyphenated attribute names and caches the first read, and neither behavior is wanted here.

- [ ] **Step 4: Confirm the guard actually holds**

Rung: browser console. This is the step that distinguishes a working guard from a flood, so it needs a count, not an impression. Scroll the full report top to bottom, then run:

```js
dataLayer.filter(a => a[0] === 'event' && a[1] === 'view_section').length
```

Expected: at most 5, and each `section` value distinct. A number in the dozens means the guard is not being reached — check that the `else` branch is where you added it. Then scroll back up and down again and re-run: the count must not increase.

Note `recordPositions()` strips `cp-is-fixed` and re-runs `update()` on every resize, so a window resize re-enters the `else` branch for every already-stuck header. The `sectionsSeen` guard is what makes that a no-op. Resize the window once during this check and confirm the count is unchanged.

---

## Task 6: Add the report to the smoke test

The CP report is not currently in the smoke test's page list — [`scripts/smoke-pages.mjs:37-43`](../scripts/smoke-pages.mjs) covers seven data-features pages, and this is not one of them. Since this plan edits five JS files loaded by that page, the repo's own rule ("run it before merging anything that touches `assets/js/`") currently cannot be satisfied for this work.

**Files:**
- Modify: `scripts/smoke-pages.mjs` — the `PAGES` array, in the `data-features/` group at lines 37-43

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: smoke coverage that Task 7 relies on for its console-error check.

- [ ] **Step 1: Add the page**

Add to the `data-features/` block, matching the existing comment style that names the layout and the libraries in play:

```js
    "data-features/congestion-pricing-report/",     // congestion-pricing-report layout — Leaflet + Vega, 7 CP scripts
```

Confirm the URL against the built site before committing — the entry is only useful if it resolves, and a 404 in `PAGES` fails the run rather than silently skipping.

- [ ] **Step 2: Run it**

```
npm run smoke
```

Expected: pass, with the new page in the output. If it surfaces console errors that predate this plan, they are pre-existing bugs on a page nothing was checking — record them here and fix them separately rather than adding `KNOWN_NOISE` entries, since an allowlist entry disables the check for that text everywhere.

This task is independent of Tasks 2–5 and can land first. Doing so is worth considering: it establishes whether the page is clean *before* this plan touches it, which a later failure could otherwise be blamed on.

---

## Task 7: Verification pass

Every claim this plan makes is about runtime behavior — whether a handler fires, and with what payload. Source reading cannot establish either, so this runs in a browser. Two rungs, cheapest first: `dataLayer` proves the call fires with the right payload and needs no GA4 access at all; DebugView proves delivery to the property.

**Files:** none — this task produces the evidence recorded in the Status table.

**Interfaces:**
- Consumes: every event and parameter produced by Tasks 2–5, at the exact names given in those tasks' Interfaces blocks.

- [ ] **Step 1: Serve the page**

```
hugo serve --environment development
```

Then open `http://localhost:1313/EH-dataportal/data-features/congestion-pricing-report/` in a **fresh tab** — JS is fingerprinted and cached hard, and an existing tab will happily serve the previous build's scripts.

Disable ad blockers for this origin. They block `googletagmanager.com`, which does not stop `dataLayer` from filling (the `gtag` shim is local and inline) but does stop anything reaching GA4.

- [ ] **Step 2: Establish the positive control**

Before asserting that anything fired, prove the instrument can register a fire at all. In the console:

```js
dataLayer.filter(a => a[0] === 'event').length
```

Then click one site badge and re-run. If the number does not increase, nothing below this line means anything — a silent `gtag` and a handler that never ran are indistinguishable in an empty result.

- [ ] **Step 3: Exercise every control and dump the payloads**

Click, in order: a badge; an EJ picker button; a time-of-day picker button; a monitoring map marker; a regional map marker. Narrow the window under 768px and change both pickers via the `<select>`. Scroll the full page. Then:

```js
dataLayer.filter(a => a[0] === 'event').map(a => [a[1], a[2]])
```

Expected, checked against the Interfaces blocks above:

| Event | Required parameters | Expected values |
|---|---|---|
| `click_badge` | `site` | full site name, e.g. `Major Deegan` — not the `deegan` badge key |
| `select_site` | `chart`, `site`, `control` | `chart` in {`ej`, `tod`}; `control` in {`button`, `select`} |
| `click_map_marker` | `map`, `site_type`, and `site_id` (monitoring) or `site` (regional) | `map` in {`monitoring`, `regional`} |
| `view_section` | `section` | one of `monitoring`, `site-question`, `time-of-day`, `regional`, `conclusion` |

Check the values, not just the event names. The failure mode here is quiet: a typo'd parameter name still sends the event, GA4 still accepts it, and the registered dimension reports `(not set)` indefinitely.

- [ ] **Step 4: Confirm delivery in DebugView**

With the Google Analytics Debugger extension active, open **Admin → DebugView** on the dev property `G-PB98MPZ31B` and repeat a few interactions. Confirm the events arrive with parameters attached.

Positive control for this rung too: `page_view` should already be visible in the stream. If it is not, the debugger is not connected and an absence of custom events proves nothing about the code.

- [ ] **Step 5: Run the smoke test**

```
npm run smoke
```

Expected: pass, including the page added in Task 6.

- [ ] **Step 6: Record what ran**

Fill in the Status table with the commit hashes and a `[verified <date>: how]` note per task — naming the rung that ran, not "tested". Reports will not show these dimensions until 24–48 hours after registration and matching data, so a reporting check is a follow-up, not a gate on merging.

---

## Deliberately out of scope

- **PDF and outbound-link tracking.** Task 1 Step 2 decides this. If enhanced measurement is on, adding handlers would double-count.
- **The Datawrapper table** at [`index.md:96`](../content/data-features/congestion-pricing-report/index.md). Cross-origin iframe; interaction inside it cannot be instrumented from this page. Datawrapper keeps its own view stats.
- **Vega chart internals** — tooltip and legend hovers. High event volume, and a hover cannot distinguish deliberate inspection from a cursor crossing the chart. The site pickers already report which chart states readers chose.
- **The two non-sticky headings** at template `:209` and `:240`, per Task 5.
- **Production property configuration.** Tasks 1–7 run against `G-PB98MPZ31B`. Repeating Task 1 on `G-64BWDRHRGB` is a separate step, to be done before the report goes live, since dimensions are not backfilled.
