# Site-Wide Audit (2026-06-27)

Companion to `data-explorer-deep-audit-2026-06-27.md`, which covered the
Data Explorer SPA (now `assets/js/data-explorer/`). This document covers
**everything else**: the Hugo
theme (136 layout files, 63 partials, 10 shortcodes), the non-DE JavaScript
(~12K lines), the SCSS, the build/CI pipeline, configuration, and overall
organization + refactoring opportunities.

Method: structural survey of the whole repo, then close reads of the shell
(`baseof`/`head`/`js_bottom`), the global `header`, the core JS (`main.js`,
`site.js`), the production build workflow, the SCSS entry, and the default
config. Severity: **P1** real defect / user or security impact, **P2**
correctness/perf/maintainability risk, **P3** quality/cleanup.

> Scope note: this is the static-site/front-end repo. The data pipeline
> (R/SQL that produces `EHDP-data`) lives in a separate repo and is out of
> scope here.

> **Updated 2026-06-27 (post-cutover).** The Data Explorer endpoint cutover has
> since landed: the new SPA now owns `/data-explorer/` (`assets/js/data-explorer/`)
> and the legacy explorer moved to `/data-explorer-old/`
> (`assets/js/data-explorer-old/`). §1, §5, and §9 below were revised to match;
> the old explorer is now retired but **not yet deleted**, so it is still built
> and served.

---

## 1. The headline: parallel implementations and "duplicate-and-version" cruft

The single biggest organizational drag is that features are **forked rather than
refactored** — old and new versions live side by side, both shipping.

- **Two complete Data Explorers — cutover done 2026-06-27, deletion still
  pending.** The new SPA was promoted to the canonical `/data-explorer/`
  (`assets/js/data-explorer/`, ~9,800 lines) and the legacy explorer was moved to
  `/data-explorer-old/` (`assets/js/data-explorer-old/`, ~6,560 lines) — still
  rendered and built, just unlinked from the main menu. So the *active-fork*
  hazard (changes landing in the wrong copy) is largely resolved, but the old
  tree (content + layouts + JS) is still in the repo and still ships. **Next
  step: delete the three `*-old` trees** once nothing depends on
  `/data-explorer-old/`; that removes ~6,560 lines of JS plus the parallel
  content and layouts in one stroke.
- **Versioned partials/shortcodes** never cleaned up:
  `featured-data.html` + `featured-data-2.html`; `vega.html` + `vega0.html`;
  `nyccas_pollutant_trends.html` + `nyccas_pollutant_trends_new.html`;
  `nr-indicator-new.html` + `nr-indicator-old.html`;
  `related-footer.html` + `related-footer-old.html`.
- **Eight `related*` partials** (`related`, `related-data`, `related-footer`,
  `related-footer-categories`, `related-footer-content`, `related-footer-de`,
  `related-footer-old`, `related`) — almost certainly collapsible to 1–2
  parameterized partials.
- **Three header partials** (`header`, `header-de`, `header-ds`) and two
  overlap-tool partials (`overlap-tool`, `overlap-tool-with-map`).

> **Refactor:** adopt a rule — when a "v2" stabilizes, delete v1 in the same PR.
> Do a sweep now: each `*-old`, `*-new`, `*-2`, `*0` pair is a candidate for
> deletion or merge. Git history is the archive.

---

## 2. Performance — `head.html` is doing far too much synchronously (P1)

[head.html](../themes/dohmh/layouts/partials/head.html) is the hot path for
every page. Current issues, roughly in impact order:

- **~20 render-blocking `<script>` in `<head>` with no `defer`/`async`.** For any
  `page`/`neighborhood-reports`/`data-explorer` route it loads Vega + Vega-Lite
  + Vega-Embed + D3 + DataTables(+buttons/rowgroup) + Arquero + Leaflet
  (+geocoder, easybutton, colorIcon, pip) + TopoJSON + uhflist.js, all blocking
  parse. jQuery and Font Awesome load blocking on *every* page.
- **Font Awesome shipped as JS** ([head.html:116](../themes/dohmh/layouts/partials/head.html))
  — `all.min.js` is a large runtime SVG-injector that blocks rendering and
  mutates the DOM on load. The CSS+webfont build is already loaded too
  ([:111](../themes/dohmh/layouts/partials/head.html)), so the JS is redundant.
  Drop the FA JS; keep CSS + webfonts (or move to an SVG sprite of only the
  icons used).
- **No CSS minification.** [head.html:137-139](../themes/dohmh/layouts/partials/head.html)
  does `toCSS | resources.Fingerprint` with no `minify`. The ~14K-line SCSS
  compiles to unminified CSS in production. **Proposed and implemented
  2026-07-14 as part of Tier 3.3, then explicitly rejected by the user before
  commit ("don't want the minify change") with no reason given.** Left out of
  the 3.3 commits. Don't re-add `| minify` without checking in first — there
  may be a reason (debuggability, an existing minify step elsewhere,
  something environment-specific) that didn't surface in that exchange.
- **Duplicate resources:** the favicon `<link>` is emitted twice
  ([:49](../themes/dohmh/layouts/partials/head.html), [:105](../themes/dohmh/layouts/partials/head.html));
  the nyc-lib CSS is loaded conditionally behind `.Params.mapLib`
  ([:90-94](../themes/dohmh/layouts/partials/head.html)) *and again
  unconditionally* ([:129-131](../themes/dohmh/layouts/partials/head.html)) — so
  every page pulls two external nyc.gov stylesheets whether it has a map or not.
- **Dead Hugo loop:** [head.html:121-127](../themes/dohmh/layouts/partials/head.html)
  ranges FA webfonts into `$woff_got` and never uses it. **Correction, 2026-07-14:
  not actually dead** — evaluating `$woff.RelPermalink` as the inner `resources.Get`'s
  argument triggers Hugo's lazy-publish-on-access side effect for the *original*
  matched resource, which is what puts the raw `.woff2` files at the
  node_modules-relative path the fingerprinted FA CSS's `@font-face` rules
  (`url(../webfonts/...)`) actually resolve against. Confirmed by inspecting the
  built `docs/` output. Deleting it (rather than replacing the pointless double-`Get`
  with the `.Publish` idiom already used for the Leaflet marker icons two blocks
  later in the same file) would have broken every Font Awesome icon on the site
  the moment the JS injector below is also dropped.
- **The conditional-gating pattern itself is becoming a second problem, layered
  on top of what's gated (new 2026-07-14).** Every section-specific exception —
  easybutton/colorIcon excluded for `data-explorer`, `uhflist` restricted to
  `neighborhood-reports` (§5a), and whatever gets added next — is implemented as
  another branch inside the same one big
  `{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") (eq .Section "data-explorer") }}`
  block ([head.html:143](../themes/dohmh/layouts/partials/head.html)). A page's
  actual dependencies end up living somewhere other than its own template — you
  have to read head.html to know what `data-explorer/single.html` loads, not the
  template itself — and two templates can collide on the same resource path with
  no build error: `data-explorer-old/single.html` builds its own DataTables
  bundle at the literal same `resources.Concat` target name
  (`js/dataTableBundle.js`) as head.html's, and Hugo silently serves whichever
  one it cached first (harmless today only because neither template's JS calls
  the plugin APIs the two versions differ on). **Recommend per-template
  inclusion** for anything that isn't truly universal — each template
  `{{ partial }}`s in only the libraries it needs — reserving head.html
  conditionals for what every page genuinely needs (charset, viewport, favicon,
  GA). This project's own CLAUDE.md already endorses the equivalent pattern one
  level down, for page-specific inline JS ("externalize to
  `assets/js/<page-name>/*.js`... see `data-explorer/single.html`"); this is the
  same idea one level up, applied to which libraries a template pulls in. A
  Tier-4-sized restructure, not a quick fix — cross-referenced in the DE
  fresh-audit's Tier 4.6.
  **Update (2026-07-16): implemented** — see Tier 4.6's execution-status note
  in `documents/data-explorer-fresh-audit-2026-07-13.md` for what shipped,
  what was found and fixed during verification, and one separate newly-surfaced
  issue (4.7) tracked there.
- **Inline JS in 66 of 136 layouts.** Behavioral JavaScript lives inside
  templates (e.g. ~240 lines in `de-tab-content.html`, plus the data-features
  pages). It can't be linted, fingerprinted/cached, unit-tested, or covered by a
  strict CSP. This is the structural reason the site can't tighten its
  Content-Security-Policy.

> **Refactor:** (1) bundle the data-viz libraries with `resources.Concat` (the
> file already does this for Vega/DataTables — extend it) and load the bundle
> `defer`; (2) only load Leaflet/Vega/DataTables on pages that use them (most are
> already gated, but jQuery/FA are global); (3) ~~minify CSS~~ proposed and
> rejected by the user 2026-07-14, don't re-add without checking in; (4) de-dupe
> favicon + nyc-lib — **done**; (5) move inline `<script>` blocks into
> fingerprinted files under `assets/js/`; (6) longer-term, replace head.html's
> growing per-section conditional nest with per-template inclusion — each
> template loads only what it needs, instead of head.html trying to know every
> template's needs.

---

## 3. Dependency & supply-chain hygiene (P1/P2)

- **Dead CDN dependency — rawgit.** `head.html` loaded Leaflet point-in-polygon
  from `https://cdn.rawgit.com/...`. **RawGit was shut down in October 2019**, so
  that request always failed. **FIXED 2026-07-14** — the tag was deleted during the
  DE audit's Tier 1.6 dependency cleanup. It did rely on PIP, and removing the tag
  exposed the resulting breakage: see **§5c** below, along with three *other*
  RawGit tags (OpenLayers) that are still live in the templates.
- **External scripts without SRI.** the surviving rawgit OpenLayers tags (§5c) and Google Translate
  (`translate.google.com/...`, [js_bottom.html:40](../themes/dohmh/layouts/partials/js_bottom.html))
  load without `integrity`. Everything served from `node_modules` is correctly
  fingerprinted with SRI — good — so these two stand out.
- **Bootstrap 4.3.1** (package.json) is **end-of-life** (BS4 reached EOL Jan
  2023; current is BS5). It pins the site to jQuery and to a fork of the BS4 SCSS
  under `assets/bootstrap/scss`. This is a large but worthwhile modernization
  target; at minimum bump 4.3.1 → latest 4.6.x for the security patches.
- **Suspicious/again-check deps:** `ci` (`^2.3.0`) looks like an accidental
  install (a small CLI lib, unlikely to be intentional). Audit
  `@mapbox/leaflet-pip`, `geoblaze`, `georaster*`, `qrcode-generator`,
  `jquery-flexdatalist` for actual use and drop the unused ones.
- **No `npm audit` / Dependabot.** There is a CodeQL workflow but no dependency
  scanning. Add Dependabot (npm + github-actions ecosystems).

---

## 4. Templates & partials (P2/P3)

- **Mobile/desktop nav fully duplicated.** [header.html](../themes/dohmh/layouts/partials/header.html)
  renders the entire Topics/Explore/About/Search/Subscribe nav twice — desktop
  `#nav-primary-top` ([:92-203](../themes/dohmh/layouts/partials/header.html)) and
  mobile `#nav-primary` ([:251-364](../themes/dohmh/layouts/partials/header.html)) —
  including the ~35-line `$want_menus` menu-loop **verbatim in both**. Extract one
  `partial "nav-items.html"` and include it twice. (Same mobile/desktop
  duplication pattern flagged in the DE audit — it's site-wide.)
- **Invalid list markup (a11y).** Throughout the nav, links wrap list items:
  `<a href=...><li>…</li></a>` with the `<a>` as a direct child of `<ul>`
  ([header.html:107,110,157,316](../themes/dohmh/layouts/partials/header.html)).
  `<ul>` must contain `<li>`; `<a>` wrapping `<li>` is backwards and confuses
  screen readers. Should be `<li><a>…</a></li>`.
- **HTML nesting error in the site title.** [header.html:77-80](../themes/dohmh/layouts/partials/header.html):
  the `<a>` opens inside one `<span>` and closes inside the next, so the anchor
  crosses span boundaries (overlapping tags). Browsers patch it, but it's
  malformed and fragile.
- **Duplicate `data-toggle` attribute.** Search links carry both
  `data-toggle="modal"` and `data-toggle="collapse"`
  ([header.html:188,244,347](../themes/dohmh/layouts/partials/header.html)); the
  second is ignored — copy-paste residue.
- **`console-log.html` / `warn_counter.html` / `temp-popup.html` partials** and
  `g-dev-tools.scss` suggest debug scaffolding lives in the theme. Confirm none
  ship to production.

---

## 5. JavaScript outside the SPA (P2/P3)

- **`main.js` and `site.js` overlap and double-fire analytics.** `main.js`
  (jQuery, [:110](../assets/js/main.js)) binds `click` on `[data-subscribe-click]`
  and fires `click_subscribe`; `site.js` (vanilla, [:94-104](../assets/js/site.js))
  *also* delegates `click_subscribe` for the same elements. Both run on every
  page → **the subscribe event is counted twice.** Pick one owner (site.js is the
  newer, cleaner, delegated implementation) and delete the duplicate from main.js.
- **Two JS idioms.** `main.js` is jQuery `$(document).ready`; `site.js` is a
  modern IIFE with event delegation. New code should follow `site.js`; migrate
  `main.js`'s remaining concerns (RTL observer, collapse toggles, back-to-top)
  into it over time so jQuery can eventually be dropped with Bootstrap 5.
- **Geo crosswalks embedded as JS, not data.** `ccd-to-uhf42.js` (1642),
  `cd-to-uhf42.js` (1328), `uhflist.js` (631) are large literal lookup tables
  compiled and shipped as scripts (and `uhflist.js` loads in `<head>` for most
  pages — [head.html:195](../themes/dohmh/layouts/partials/head.html)). These are
  *data*; move them to `data/` (Hugo `site.Data`) or fetch as JSON so they're not
  parsed as JS on every page load. (Same anti-pattern as the dead
  `geography.js`.) **Followed up in §5a below — the sprawl is worse than this
  bullet implies, and one of the copies is stale.**
- **Legacy `assets/js/data-explorer-old/`** (~6,560 lines) — the cutover retired
  it but it is still built and reachable at `/data-explorer-old/`. Dead weight;
  delete with the rest of the old tree (§1).

### 5a. UHF neighborhood files — one list, two vintages, five copies (added 2026-07-14)

Full audit of every UHF artifact in the repo, prompted by the `uhflist` bullet
above. The 42-neighborhood list, the UHF42 boundary, and the CD→UHF crosswalks
are each stored more than once, in more than one format. **The headline is not
the duplication — it's that the two copies of the neighborhood list disagree on
the numbers, and the site displays the stale one.**

| Thing | Copies | Consumers |
|---|---|---|
| 42-row neighborhood list | [`uhflist.js`](../assets/js/uhflist.js) (20 KB, `var neighborhoods`) **and** [`uhflist.json`](../assets/js/uhflist.json) (20 KB) | `.js` at runtime (`nr-output/single.html`, `nr-leaflet`, `neighborhood-reports/section`, `topiclanding`); `.json` at build time only (`nr-insert-zips.html` via `transform.Unmarshal`) |
| CD/CCD → UHF crosswalk | `ccd-to-uhf42.js` (40 KB), `cd-to-uhf42.js` (32 KB), `ccd-to-uhf42.json` (33 KB) | the two `.js` by `overlap-tool.html` + `overlap-tool-with-map.html`; **the `.json` by nothing** |
| UHF42 boundary | `static/geojson/UHF42.geojson` (95 KB), the remote `EHDP-data/…/geography/UHF42.geojson`, and `UHF42.topo.json` | local → `nr-leaflet.html`; remote → `overlap-tool-with-map.html` (2×); topojson → the data explorer |
| UHF42 attribute table | `static/UHF42.csv` (3.5 KB) | only `nr-clickable-uhf.html` + `nr-map-highlight.html` — **both dead** |

**1. `uhflist.js` and `uhflist.json` are different vintages of the same table
(P1 — correctness, not cleanup).** All 42 rows differ on at least one shared
key. UHF 101, for example: poverty `16.53` vs `16.1624`, HS-grad `87.51` vs
`84.98`, limited-English `16.54` vs `17.01`, rent-burdened `49.5` vs `50.89`.
One field is even named differently (`PercentOwnerOccupied` vs
`OwnerOccupiedPercent`). The demographics **rendered on neighborhood reports**
([nr-output/single.html:853](../themes/dohmh/layouts/nr-output/single.html))
come from the `.js`; the `.json`'s more precise values are read for `Zipcodes`
only and are never displayed. This has the shape of a regenerated update that
landed in the JSON and never made it back into the JS. **Someone has to decide
which vintage is authoritative before anything here is deleted or unified.**

**2. `uhflist.js` is render-blocking on pages that never use it (P2).**
[head.html:195](../themes/dohmh/layouts/partials/head.html) sits inside
`{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") (eq .Section "data-explorer") }}`,
so 20 KB of `var neighborhoods` blocks parsing on every data-explorer page,
data-feature, data-story and key-topic page. Only neighborhood-reports read the
global. (This is the same gating problem as easybutton / colorIcon / leaflet-pip
in §2 — note the earlier claim that these are "only used by data-features" is
wrong for `uhflist`, which is a neighborhood-reports dependency.)

**3. `topiclanding.html` loads it twice (P3).** Its section is
`neighborhood-reports`, so head.html has already emitted the script;
[topiclanding.html:146-147](../themes/dohmh/layouts/neighborhood-reports/topiclanding.html)
emits a second tag that re-executes the 20 KB and re-declares `var
neighborhoods`. `index.html:320` also loads it explicitly, but *that* one is
legitimate — home is `Kind: home`, which head's condition doesn't cover.

**4. Three dead partials, plus the files only they use (P3).**
`nr-clickable-uhf.html`, `nr-map-highlight.html` and `nr-chooser.html` have
**zero invocations** in any form (`partial`/`partialCached`, with or without the
`.html` suffix). The `nr-clickable-uhf` string that survives in `docs/` is the
vestigial CSS class on
[section.html:86](../themes/dohmh/layouts/neighborhood-reports/section.html) —
the partial's own `id="vis1"` never renders; `nr-leaflet` fills that div now.
Deleting the three strands `static/UHF42.csv`, which nothing else references.
`ccd-to-uhf42.json` is likewise unreferenced, and has no `cd-to-uhf42.json`
partner — so it isn't even a consistent two-format convention, just a leftover.

**5. The UHF42 boundary is served from two origins (P3).** A 95 KB local
`static/` copy for `nr-leaflet`, and the EHDP-data repo's copy for
`overlap-tool-with-map`. They can drift independently, and no page benefits from
having both.

**Suggested order** — deletions first; they're provable and reversible:

1. Delete `nr-clickable-uhf.html`, `nr-map-highlight.html`, `nr-chooser.html`,
   `ccd-to-uhf42.json`, `static/UHF42.csv`. Verify with a clean `hugo` build and
   a `git diff` of `docs/` — expect **no** rendered-output change.
2. Drop the duplicate `uhflist.js` tag from `topiclanding.html`.
3. Gate `uhflist.js` in head.html to `neighborhood-reports` (keep `index.html`'s
   explicit load). Removes a render-blocking 20 KB from every DE page.
4. **Blocked on #1's decision:** collapse `uhflist.js` + `uhflist.json` into one
   source of truth. The clean shape is JSON-only — keep the build-time
   `transform.Unmarshal` for zips and emit the runtime copy *from the same JSON*
   (`{{ $l := resources.Get "js/uhflist.json" | transform.Unmarshal }}<script>var neighborhoods = {{ $l | jsonify }}</script>`),
   on the pages that need it, so the two can't drift again. This changes the
   numbers shown on neighborhood reports: it is a **content change** and wants
   its own commit with sign-off, not a ride-along in a perf PR.
5. *Optional:* point `nr-leaflet` at the EHDP-data UHF42 geometry the overlap
   tool already fetches and delete the local copy — one origin, one cache entry,
   but neighborhood reports then depend on the data repo at runtime. Same idea
   for the 72 KB of crosswalk `.js`, though those load on only two pages, so the
   win is small.

### 5b. Datawrapper embeds inside hidden Bootstrap tabs throw SVG-sizing console errors (added 2026-07-16)

Found while investigating a DE-fresh-audit item (§4.7 there) that had misattributed
this to Vega — it isn't; Vega/D3 aren't involved. **Any Datawrapper chart placed in
a Bootstrap `tab-pane` that isn't the initially-active one renders once, immediately,
while its ancestor is `display:none`.** The pane's layout box is 0×0, so Datawrapper's
own d3 code computes `NaN`/negative pixel values and every SVG attribute it sets
(`width`, `height`, `transform`, …) throws a browser console error — dozens to ~190
per page load, confirmed live (Playwright, `local-stage`) on:

| Page | Hidden-tab charts | Embed style |
|---|---|---|
| `data-stories/housing/` (+ `.es`, `.zh`) | 1 (Scatterplot tab) | raw `<iframe src="datawrapper.dwcdn.net/…">` |
| `data-stories/redlining/` (+ `.es`, `.zh`) | 5 of 6 borough tabs | raw `<iframe src="datawrapper.dwcdn.net/…">` |
| `data-stories/air-quality-snapshots/` | 5 of 7 tabs across two tab groups | raw `<iframe>` |
| `data-stories/vectorborne-diseases-and-health/` | 2 of 3 tabs | Datawrapper's newer `embed.js` (`<div id="datawrapper-vis-…">` + `<script defer src=".../embed.js">`) loader |

**Not a visible bug** — every chart self-heals the moment its tab is actually
clicked (Datawrapper's own code re-renders correctly once the pane's box has a
real size; confirmed by clicking the housing Scatterplot tab and screenshotting
the result). The cost is purely: console pollution, wasted work loading/rendering
a chart the visitor may never look at, and it's exactly the kind of thing that
fails an automated console-error smoke test (see §4.5/4.6/4.7 note in the DE
fresh-audit doc — this is what a Playwright pass there actually caught).

**Root cause is generic, not per-chart** — it's the combination of Bootstrap's
`display:none`-on-inactive-`tab-pane` pattern with an iframe/script embed that
renders eagerly on load instead of on first reveal. **Recommended fix:** don't let
the embed request/render until its tab is shown. Concretely, swap `src="…"` (or
the `embed.js` `<script>` tag) for a `data-lazy-src`/`data-lazy-embed-src`
placeholder in the markdown, and add one small shared script — loaded wherever
these pages load — that promotes the placeholder to a live embed the first time
its pane is shown. One script covers both embed styles and every page in the
table above; no per-page JS needed beyond the markdown attribute swap.

**Fixed 2026-07-16** on `fix-datastories-hidden-tab-charts` (branched off
`production`, independent of the DE work — these pages aren't part of the SPA
and the bug exists identically on production). Implemented as
`assets/js/data-stories/lazy-tab-embeds.js` + a `themes/dohmh/layouts/data-stories/single.html`
wire-up, loaded unconditionally (small, first-party, no library cost, so no
front-matter gate needed) plus the attribute swap across all 8 files in the
table above. **One correction to the recommendation above:** the shared script
must bind on `shown.bs.tab`, not `show.bs.tab` or a plain `click` listener —
both of the latter fire *before* Bootstrap's own handler makes the pane
visible, so activating the embed there just reproduces the exact bug at
click-time instead of load-time (caught live: the first click-based version of
the script threw all ~96 of housing's original errors, one click later).
Verified live: console errors zero on fresh load across all 4 pages (was
~96/9/191/27), each embed style renders correctly on first click, re-clicking
doesn't double-inject, sibling tabs target correctly, active tabs unaffected.

**New, separate finding surfaced during verification (not fixed, not in
scope):** `data-stories/housing/index.es.md` (and likely the same pattern
elsewhere) also hides some Datawrapper charts via a *different* mechanism —
plain radio-button `onclick` handlers toggling inline `style="display:none"`
on `<div id="ifElow">`/`ifVlow`/`ifLow`/`ifMod"` (an "income level" selector),
not Bootstrap tabs. The Spanish version's hidden divs throw `"Aborting chart
rendering due to invalid container dimensions"` **warnings** (not errors —
this is Datawrapper's own newer vendor bundle, `dw-2.0.min.js`, which guards
against the crash the older `d3-*.js` bundle doesn't). Confirmed pre-existing
and unrelated to the tab fix above: the identical radio-toggle block exists on
the English page, untouched by this fix, and doesn't warn there (different
Datawrapper chart IDs apparently serve different vendor-bundle generations).
Same root cause family (render into a `display:none` box), different trigger
mechanism (radio buttons, not tabs) and different severity (soft warning, not
a thrown error) — worth its own fix using the same lazy-activation idea,
keyed off the radio inputs' `onclick` instead of `shown.bs.tab`, but not
bundled into this one since it wasn't part of what was audited or approved.

---

### 5c. RawGit fallout — a broken point-in-polygon call and three dead OpenLayers tags (moved here 2026-07-23)

*Surfaced during Tier 1.6 of `documents/data-explorer-fresh-audit-2026-07-13.md` and originally
logged there; moved here because none of it is data-explorer work. The DE audit now just points
at this section.*

**Context.** `cdn.rawgit.com` shut down in **October 2019**. §3 above flagged one RawGit tag —
head.html's Leaflet PointInPolygon — and that one is now **fixed** (the tag was deleted during
the DE audit's Tier 1.6 dependency cleanup). Removing it exposed, but did not cause, the two
items below. Everything here was already broken; the cleanup only made it visible.

- **P1 — `rats-in-your-neighborhood` calls a method that hasn't existed since 2019.**
  [neighborhood-rats.js:230,250](../content/data-features/rats-in-your-neighborhood/neighborhood-rats.js)
  calls `area.contains(location.getLatLng())` on an `L.polygon(...)` for its rat-mitigation-zone
  check. **Native Leaflet has no `.contains()` on a polygon** — that method came only from the
  RawGit-hosted `Leaflet.PointInPolygon` plugin. So this has been throwing
  `TypeError: area.contains is not a function` on every RMZ check for years.
  **Fix:** use the already-installed `@mapbox/leaflet-pip` —
  `leafletPip.pointInLayer({ lat, lng }, layer)`, exactly the call
  [heat-story-leaflet.js:1728](../content/data-features/heat-story/embed/heat-story-leaflet.js)
  already makes — or Turf / manual ray-casting. Note the package is in `package.json` but is
  **not** loaded by any template today (§3's "audit for actual use" bullet), so a script tag
  or `lib-*.html` partial has to be added alongside the code change.

- **P2 — three templates still load OpenLayers from RawGit.** Same dead host, a different
  library, and the *core* map dependency for the pages that load it —
  [rats-in-your-neighborhood.html:219](../themes/dohmh/layouts/data-features/rats-in-your-neighborhood.html),
  [rats-in-your-neighborhood-nyc-lib.html:99](../themes/dohmh/layouts/data-features/rats-in-your-neighborhood-nyc-lib.html),
  and [email-electeds.html:132](../themes/dohmh/layouts/take-action/email-electeds.html) (a
  take-action page — this third site wasn't in the original DE write-up). All three go on to
  construct `new nyc.ol.FrameworkMap({...})`, which is nyc-lib's OpenLayers wrapper.
  **HYPOTHESIS (unverified): these maps are broken in production.** Per this repo's root-cause
  rule that is a guess until someone loads the pages and checks the console — it hinges on
  whether `nyc-ol-lib.js` (loaded from `maps.nyc.gov`, two lines later) supplies its own `ol`
  global or expects the dead CDN to have provided it. **Check that first**, then either point
  the tag at a live OpenLayers build or delete it as redundant. Cheap to settle and it decides
  whether this is a P1 outage or a P3 dead tag.

- **Aside — `rats-in-your-neighborhood-nyc-lib.html` is referenced by nothing.** A repo-wide
  grep finds no `layout:` front matter and no template pointing at it; the live page uses
  `rats-in-your-neighborhood.html`. Likely a dead duplicate to delete rather than fix, in the
  same family as §1's duplicate-and-version cruft.

---

### 5d. Console errors surfaced by the Tier 4.5 smoke test (added 2026-07-23)

The new `npm run smoke` guardrail (fresh-audit §4.5), on its first run, flagged two
console-error findings beyond the already-tracked §5b/§5c noise:

- **`data-features/realtime-air-quality/` — AirNow widget CORS (allowlisted, third-party).**
  The embedded AirNow widget (`widget.airnow.gov`) makes a cross-origin `XMLHttpRequest`
  to `airnowgovapi.com` that the browser blocks (no `Access-Control-Allow-Origin` header).
  It's the vendor's own iframe, not our code, and the widget renders regardless — allowlisted
  in the smoke test (scoped to that page) as documented noise. Nothing to fix on our side;
  revisit only if the widget is replaced or self-hosted.
- **`neighborhood-reports/` — duplicate-declaration SyntaxError (FIXED 2026-07-23, commit
  `103c8197bd`).** The landing page (`neighborhood-reports/section.html`) declared
  `var intendedDestinationName` in its inline script while the `nr-leaflet` partial it
  includes declared `let intendedDestinationName`; two top-level declarations of the same
  name in shared global scope throw `Identifier ... has already been declared`, aborting the
  page's scripts. The variable is intentionally shared (topic buttons set it; both the
  search-box handler in `section.html` and the map-click handler in `nr-leaflet` read it to
  route to the chosen topic), so the partial's `let` became `var` — two `var`s of the same
  name don't collide — rather than renaming one. Previously observed but untracked here; the
  smoke test turned it into a hard failure. This is exactly the "clean build + grep miss real
  console errors" class the smoke test was built for (fresh-audit §4.5).

### 5e. `nr-output` report pages use Arquero but never load it — charts broken (P1, added 2026-07-23)

Surfaced while extending the Tier 4.5 smoke test to cover the `nr-output` template
(a whole-branch-review recommendation): **individual neighborhood-report pages
(`nr-output/single.html`, e.g. `neighborhood-reports/<neighborhood>/<report>/`)
reference Arquero (`aq.`) 48× via their `nr-indicator-new.html` / `nr-indicator-old.html`
partials, but no template in the `nr-output` chain includes `lib-arquero.html`.**
Confirmed live (Playwright, `local-stage`): `typeof aq === 'undefined'`, the first
`aq.` call throws `Uncaught ReferenceError: aq is not defined`, and **0 chart
elements render** — the page shows its header, map, and ZIP list but none of the
Arquero-built indicator data/charts.

`lib-arquero.html` is currently included only by `data-explorer/{data-index,indicator-catalog,single}.html`
and `data-features/{heatstory,realtime}.html`. **Likely a Tier 4.6 lib-gating regression** —
4.6 moved shared libraries from site-wide loads to per-template `partial "lib-*.html"`
includes and appears to have missed the `nr-output` chain (which the DE audit already
flags as wanting its own staged effort, fresh-audit §4.6). Not investigated further here —
out of Tier 4.5's scope, and on shared production-bound templates.

**Fix direction (unverified):** add `{{- partial "lib-arquero.html" . }}` to the
`nr-output` template(s) that render `nr-indicator-*`, then confirm charts render and
`aq` is defined. Check the other per-template library gates at the same time — if
Arquero was missed on `nr-output`, another library/template pair may be too (exactly
the per-template coverage gap the smoke test exists to catch). **Blocks adding an
`nr-output` page to the Tier 4.5 smoke list** (deferred there with a pointer here).

---

## 6. CSS / SCSS (P2/P3)

- Organization is actually reasonable: ordered `a-…h-` partials behind one
  `theme.scss` entry. Two issues:
- **Dev tooling compiled into production:** `@import "g-dev-tools.scss"`
  ([theme.scss:23](../assets/scss/theme.scss)) ships whatever debug styles it
  contains to prod. Gate it behind `hugo.Environment`.
- **Two oversized catch-all files:** `__portal-custom.scss` (1317 lines) and
  `_de-custom.scss` (993). These accrete one-off rules; budget time to split by
  component.
- **Bootstrap source fork** under `assets/bootstrap/scss` (~7K lines) is
  maintained in-repo. With a BS5 upgrade, prefer importing from `node_modules`
  and overriding variables rather than vendoring the source.
- **`!important` and inline `style=`** are widespread (e.g. the DE partials,
  header background). Inline styles also block a strict CSP.

---

## 7. Build & CI (P1/P2 — several map directly to your CLAUDE.md rules)

`package.json` **had no `scripts` block at all** — no `build`, `dev`, `lint`,
`format`, or `test` — and no linting, formatting, or tests anywhere in the repo.
For ~25K lines of JS this was the highest-leverage gap: a single `eslint` pass
would have caught most of the concrete bugs in the DE audit (the `ReferenceError`,
the dead `v-pills-trend` id, the operator-precedence percentile bug, duplicate
object keys).

**Update 2026-07-23 (DE Tier 4.5):** a `scripts` block now exists — `lint`,
`characterize`, `smoke` — and ESLint (`no-undef`) runs over `assets/js/data-explorer/`
(see the fresh-audit §4.5 status). This closes the gap for the SPA tree only.
Still open: no formatter, no tests, ESLint doesn't cover the ~60 inline-JS layouts
or the theme partials, and **lint is not yet enforced in CI** (deferred, below).

**Testing strategy is an open decision, not yet made.** Raised 2026-07-02
while triaging DE audit items 9-10 against the TDD skill's require-a-test
rule, which conflicts with the "no new frameworks/build deps" rule above. Two
options to decide between when this becomes a priority:
  - **Ad-hoc `node:test`/`assert` scripts** for pure-logic pieces only (e.g.
    Arquero transforms, reduce/filter helpers) — zero installs, so it doesn't
    violate "no new frameworks" literally, but it's a first-ever test
    file/pattern in the repo and covers non-DOM logic only.
  - **Adopt a real framework** (e.g. Vitest) and commit to ongoing coverage —
    bigger decision, explicitly overrides the current CLAUDE.md rule.

  Until one is chosen, bugfixes are verified manually (Hugo rebuild + browser
  check), consistent with how the repo has always operated.

**Deferred out of Tier 4.5 scope (2026-07-23), each considered and parked with reason:**
  - **Run `npm run lint` as a CI job** in the build workflows — the guardrail
    exists locally but isn't enforced on push; the highest-value next step once
    the team wants enforcement (pin the action to a SHA and add a `permissions:`
    block per the workflow notes above).
  - **A git pre-commit hook running `lint`** — catches undefined-name typos
    before they land, but adds local-setup friction; parked pending team appetite.
  - **A full classification sweep of all ~40 DE-tree `innerHTML` sinks** for
    sanitization — 4.5 wrapped only the metadata-derived sinks (fresh-audit §4.5);
    a complete pass would classify every sink (static/trusted vs. data-derived)
    and is a larger, lower-urgency effort on DOHMH-controlled data.
  - **The three dead `nr-*` DOMPurify-consuming partials** (cross-reference §5a's
    dead-partial list) — deletion candidates, but out of scope for a guardrails
    PR; fold into the §5a UHF-file cleanup.

The production workflow
([hugo-build-to-prod-prod.yml](../.github/workflows/hugo-build-to-prod-prod.yml))
has these issues — most are explicit violations of the GitHub-Actions section of
`~/.claude/CLAUDE.md`:

- **Actions pinned to mutable tags, not SHAs:** `actions/checkout@v4`,
  `actions/setup-node@v4`, `peaceiris/actions-hugo@v3`,
  `elstudio/actions-js-build/commit@v4`, `peaceiris/actions-gh-pages@v4`.
  Pin each to a full commit SHA with a version comment.
- **No `permissions:` block.** The job uses `GITHUB_TOKEN` to push a build branch
  and commit back to source. Set top-level `permissions: contents: read` and
  grant `contents: write` only on the jobs that need it.
- **`npm install` instead of `npm ci`** ([:75](../.github/workflows/hugo-build-to-prod-prod.yml)),
  and **no npm cache** (setup-node supports `cache: 'npm'`). `npm ci` is the
  reproducible CI install; caching keyed on `package-lock.json` speeds builds.
- **The build commits dependency files back to the repo**
  ([:123-126](../.github/workflows/hugo-build-to-prod-prod.yml), "Update index &
  NPM package list") via a third-party action. Builds mutating source is a smell
  and a side effect of using `npm install`; switching to `npm ci` removes the
  drift.
- **`dos2unix` line-ending normalization at build time**
  ([:93-96](../.github/workflows/hugo-build-to-prod-prod.yml)) papers over a
  CRLF/SRI-integrity problem. Fix it at the source with `.gitattributes`
  (`*.js text eol=lf`, `*.css text eol=lf`) so integrity hashes are stable and
  the build step disappears.
- **Four near-duplicate build workflows** (any-branch, dev-stage, dev-prod,
  prod-prod). Extract a reusable workflow (`workflow_call`) parameterized by
  environment/branch to remove the copy-paste.
- `fetch-depth: 0` clones full history; only the last commit metadata is used —
  confirm whether the commit-back step needs more than `fetch-depth: 1`.

---

## 8. Configuration (P3)

- **Nine `config.toml` files** under `config/` (`_default`, `development`,
  `dev_stage`, `dev_prod`, `local_stage`, `local_prod`, `production`,
  `prod_stage`, `prod_prod`). Most differ only in `data_branch` / `baseURL` /
  GA gating. Verify each is still a live deploy target; fold dead ones in. Hugo
  merges `_default` with the environment file, so the per-env files should be
  *thin* — confirm they are.
- `ignoreFiles = ['Simplified.Chinese', 'Spanish']`
  ([config/_default/config.toml:12](../config/_default/config.toml)) ignores
  translated content even though `es`/`zh` languages are configured — looks like
  leftover; confirm intent.
- **Mixed i18n strategy:** Hugo multilingual (`languages.en/es/zh`) *and* the
  Google Translate widget ([js_bottom.html:24-40](../themes/dohmh/layouts/partials/js_bottom.html))
  with a DOM-mutating "obliterate all google translate SVGs" hack. Decide on one
  translation approach.
- `[caches.getresource] maxAge = -1` caches remote fetches forever — fine for a
  build, but be aware stale remote data won't refresh without a cache clear.

---

## 9. Analytics — Google Analytics / gtag (P2)

GA4 (`gtag.js`) is the only analytics. It works, but the implementation is
**fragmented across three patterns** with no single owner, the event taxonomy
has drifted, and dev/local builds pollute the dev property. Inventory below is
from a full grep of `gtag(`, the `trackDataExplorer*` family, and
`sendAnalyticsEvent`.

### Bootstrap
- Two GA4 properties, environment-gated in
  [head.html:3-37](../themes/dohmh/layouts/partials/head.html): **prod**
  `G-64BWDRHRGB` (only when `hugo.Environment == "prod_prod"`), **everything
  else** `G-PB98MPZ31B`. Loaded `async` — good. `gtag` is defined inline
  (`function gtag(){dataLayer.push(arguments)}`), so it always exists even if the
  remote script is blocked; raw `gtag()` calls won't throw (relevant below).
- The snippet is **duplicated** across the prod and dev branches (only the ID
  differs). Collapse to one snippet with the measurement ID in a Hugo variable.
- **Dev/local builds emit real events.** The `else` branch covers `development`,
  `local_stage`, `local_prod`, `dev_stage`, `dev_prod` — so running
  `hugo server` locally and every preview build fire events into the dev
  property. Add a guard so GA loads only for `prod_prod` (and a true shared
  staging env if one exists), not for `development`/`local_*`.

### Three competing implementations
1. **`sendAnalyticsEvent`** — guarded wrapper in [site.js:58](../assets/js/site.js)
   (homepage/nav/search/subscribe/language link tracking, via delegation). The
   cleanest of the three.
2. **`trackDataExplorerEvent`** family — guarded wrappers in the SPA
   ([global.js:500-565](../assets/js/data-explorer/global.js)). This is the
   consolidated docs' "#30 guard analytics" recommendation, done. **Correction
   2026-07-12:** this wrapper only runs on the new SPA, which lives on the
   `feature-de-state-namespace-refactor` branch lineage — verified against
   `origin/production` directly, that branch has never merged. Today's actual
   production DE analytics still goes through the **old** explorer's raw,
   unguarded `gtag` calls (#3 below), not this wrapper.
3. **Raw `gtag('event', …)`** — scattered and unguarded: [main.js:14](../assets/js/main.js);
   the **now-retired old explorer** (still reachable at `/data-explorer-old/`)
   ([data-explorer-old/app.js:106-302](../assets/js/data-explorer-old/app.js),
   [measures.js](../assets/js/data-explorer-old/measures.js) ×8,
   [print.js:60](../assets/js/data-explorer-old/print.js)); and four templates
   ([nr-indicator-old.html:274](../themes/dohmh/layouts/partials/nr-indicator-old.html),
   [nr-indicator-new.html:311](../themes/dohmh/layouts/partials/nr-indicator-new.html),
   [search-modal.html:33](../themes/dohmh/layouts/partials/search-modal.html),
   [nr-output/single.html:533](../themes/dohmh/layouts/nr-output/single.html)).

> Net effect: on the new SPA's branch, DE analytics flows through the guarded
> wrapper; on actual `production`, it still doesn't (see correction above). The
> picture is fragmented either way — `main.js`, the currently-live old explorer,
> and four inline templates call `gtag` raw, and there are two separate guarded
> wrappers (`sendAnalyticsEvent` and `trackDataExplorerEvent`). **Recommend one
> shared `track(name, params)` helper** (promote `sendAnalyticsEvent` to a tiny
> module) used everywhere, and delete the per-area variants — including the old
> explorer's raw calls when its tree is
> removed (§1).

### Event-taxonomy problems
- **Double-counting `click_subscribe`** (also §11): fired by both
  [main.js:14](../assets/js/main.js) (raw) and
  [site.js:99](../assets/js/site.js) (delegated) — and with *different params*
  (`page`/`place` vs `place`/`click_url`), so one event name has two schemas.
- **`search` is three different events:** `search`
  ([search-modal.html:33](../themes/dohmh/layouts/partials/search-modal.html)),
  `search_click` and `click_search_open` (both in [site.js](../assets/js/site.js)).
  Decide one search vocabulary.
- **Inherited typo `click_how_caclulated`** ("caclulated") exists in **both**
  explorers — [old app.js:152](../assets/js/data-explorer-old/app.js) and the
  live [app.js:446](../assets/js/data-explorer/app.js) — so it has been
  miscounting in GA for a long time and was faithfully copied into the rewrite.
- **Param-name casing is inconsistent:** `IndicatorID` (PascalCase) in
  `click_indicator` vs snake_case everywhere else (`file_name`, `chart_type`,
  `page_viewed`, `click_url`). GA4's convention is snake_case; mixed casing makes
  reports harder to query.
- The new explorer deliberately mirrors the old explorer's event names (good for
  reporting continuity) — so when the old tree is deleted (§1), make the new
  wrapper the single source of truth and fix the typo in the same pass.

### Privacy / governance (city agency)
- No Consent Mode and no cookie-consent gate on GA. GA4 anonymizes IP by default,
  so that specific item is low-priority, but confirm GA use is disclosed in the
  NYC privacy policy and that no PII enters event params. Current params look
  PII-free (paths, labels, indicator IDs) — good; keep it that way (don't add
  free-text search terms or anything user-entered to event params).

> **Refactor summary:** (1) one `track()` helper, one event catalog (documented
> name + params); (2) fix the typo and the double-fire; (3) pick one
> search/subscribe vocabulary and snake_case all params; (4) gate GA out of
> local/dev environments; (5) de-dupe the head snippet.

---

## 10. Accessibility (site-wide, P1 for a NYC.gov property)

In addition to the map/chart gaps in the DE audit:

- Nav list markup (`<a><li></li></a>`) and the title nesting error (§4) are
  validity/SR issues on every page.
- `href="#"` action links (search/dropdown toggles) throughout the header —
  prefer `<button>` for actions.
- Google-Translate-as-i18n is itself a known a11y/SEO weakness (translated DOM
  isn't in the markup; `hreflang` only points at the few real translations).
- **Recommend** running `axe`/Lighthouse in CI against a sample of each template
  type (home, key-topic, data-story, data-feature, neighborhood-report, the
  explorer) so regressions are caught automatically — this is a legal-exposure
  area for a city agency (WCAG 2.1 AA / Section 508).

---

## 11. Concrete defects found (quick wins)

| # | Severity | Where | Issue |
|---|---|---|---|
| 1 | ~~P1~~ **FIXED 2026-07-14** | `head.html` | Point-in-polygon loaded from shut-down `cdn.rawgit.com`; tag deleted in DE-audit Tier 1.6. The breakage it was masking, and three surviving RawGit OpenLayers tags, moved to **§5c** |
| 2 | P1 | CI workflows | Unpinned actions + no `permissions:` block (your own CLAUDE.md rules) |
| 3 | P2 | [main.js:110](../assets/js/main.js) + [site.js:94](../assets/js/site.js) | `click_subscribe` analytics fires twice |
| 4 | ~~P2~~ **FIXED 2026-07-14** | `head.html` | Font Awesome shipped as render-blocking JS *and* CSS — the `all.min.js` SVG-injector was dropped (CSS + webfonts kept). Caused one regression: per-section accent icon coloring had silently depended on the injector rewriting `<i class="fa…">` into `<svg><path>`; fixed separately on `hotfix-color-styles` |
| 5 | P2 | [head.html:137](../themes/dohmh/layouts/partials/head.html) | Production CSS not minified — proposed + rejected by user 2026-07-14, don't re-add without checking in |
| 6 | ~~P2~~ **FIXED 2026-07-14** | `head.html` | nyc-lib CSS loaded twice on every page; favicon `<link>` duplicated. Both de-duped — nyc-lib CSS is now behind `.Params.mapLib` only (set on the 3 `take-action/` pages), so every other page stopped paying for it |
| 7 | P3 | [header.html:188,244,347](../themes/dohmh/layouts/partials/header.html) | Duplicate `data-toggle` attribute (second ignored) |
| 8 | P3 | [header.html:77-80](../themes/dohmh/layouts/partials/header.html) | Overlapping `<a>`/`<span>` nesting in site title |
| 9 | P3 | [header.html:107…](../themes/dohmh/layouts/partials/header.html) | `<a><li></li></a>` invalid list markup |
| 10 | ~~P3~~ **NOT A DEFECT — corrected + rewritten 2026-07-14** | [head.html:112-117](../themes/dohmh/layouts/partials/head.html) | The webfont `range` loop was called dead here and in the DE audit. It wasn't: evaluating `$woff.RelPermalink` as an argument triggered Hugo's lazy publish-on-access for the matched resource, which is exactly what the fingerprinted FA CSS's relative `url(../webfonts/…)` `@font-face` rules need. Deleting it would have broken every FA icon site-wide once the JS injector was also dropped (row 4). Rewritten to use the explicit `.Publish` idiom instead of relying on an accidental read |
| 11 | P2 | [head.html:3-37](../themes/dohmh/layouts/partials/head.html) | GA fires in dev/local environments (incl. `hugo server`) → dev property polluted by developer/CI traffic |
| 12 | P3 | [data-explorer-old/app.js:152](../assets/js/data-explorer-old/app.js) + live [data-explorer/app.js:446](../assets/js/data-explorer/app.js) | Misspelled GA event `click_how_caclulated` in both explorers, incl. the live one (see §9) |
| 13 | P3 | `content/data-stories/{housing,redlining,air-quality-snapshots,vectorborne-diseases-and-health}` | ~~Datawrapper embeds in hidden Bootstrap tabs throw SVG-sizing console errors on load~~ — fixed 2026-07-16, see §5b |
| 14 | P3 | `content/data-stories/housing/index.es.md` (income-level radio toggle) | Same `display:none`-render-timing issue, different trigger (radio `onclick`, not tabs) and severity (warning, not error) — not fixed, see §5b |
| 15 | P3 | [robots.txt](../themes/dohmh/layouts/robots.txt) | Production `robots.txt` has no body — missing a `Sitemap:` directive |
| 16 | P2 | [baseof.html:2](../themes/dohmh/layouts/_default/baseof.html) + [list.html:2](../themes/dohmh/layouts/_default/list.html) | `<html lang="en">` hardcoded — wrong on all 14 translated (`.es`/`.zh`) pages, see §12 |
| 17 | P1 | [de-indicator-info.html](../themes/dohmh/layouts/partials/de-indicator-info.html) | Data Explorer's real content is 100% client-rendered — invisible to non-JS (i.e. most AI) crawlers, see §12 |

---

## 12. SEO & AI-search readiness (added 2026-07-22)

Method: read `seo.html`/`head.html`/`robots.txt`/`sitemap.xml` line-by-line, confirmed what
each Hugo environment actually *emits* (not just what the template intends), and traced what a
**non-JS-executing crawler** — how nearly every AI/LLM crawler operates today (GPTBot, ClaudeBot,
PerplexityBot, CCBot, Google-Extended, Bytespider, Applebot-Extended, etc. — Googlebot is the
outlier that renders JS) — actually receives from the Data Explorer, since that's the site's
flagship feature.

### Crawl directives

- **The alarming `docs/robots.txt` in this working tree is not a live bug.** [robots.txt](../themes/dohmh/layouts/robots.txt)
  only emits a body when `hugo.Environment` is *not* `production`/`prod_prod`, in which case it
  blanket-`Disallow`s every page — by design, so preview builds never get indexed. The copy
  currently sitting in `docs/` (hundreds of `Disallow: /local-stage/...` lines) is a leftover
  local `local_stage` build artifact: `docs/` is `.gitignore`d ([.gitignore:19](../.gitignore)),
  and the real production file is generated fresh by CI (`hugo --environment prod_prod`) and
  published straight to the `builds/prod-prod` branch
  ([hugo-build-to-prod-prod.yml](../.github/workflows/hugo-build-to-prod-prod.yml)) — it never
  passes through this working tree. Confirmed correct; flagged only because it looks alarming on
  sight.
- **Production `robots.txt` has no body at all, and no `Sitemap:` line (P3).** When the
  environment *is* `production`/`prod_prod`, the template's `{{ if }}` never fires, so the live
  file is empty. That's a reasonable default (open to every crawler), but it also means there's no
  `Sitemap: https://.../sitemap.xml` line, which every major crawler — search and AI alike — uses
  to discover the sitemap without separate registration. One-line fix, unconditional on
  environment.
- **No explicit stance on AI-training crawlers (P3 — a policy decision, not a defect).** Zero
  mentions anywhere in the repo of `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`,
  `PerplexityBot`, `Applebot-Extended`, `Bytespider`, etc. The effective policy today is "allow
  everyone, by omission" — for a city agency publishing public health data, maximum reach plausibly
  *is* the right call, but it's worth an affirmative decision (and a comment recording it) rather
  than an accidental default. No `llms.txt` either; that convention is still informal and
  unstandardized industry-wide, so treat it as optional, not a gap.

### Structured data — none (P2)

- **Zero JSON-LD or Microdata anywhere in the theme** (confirmed: no `ld+json`, `schema.org`, or
  `itemscope`/`itemtype` across all 136 layouts / 63 partials). For a government **data portal**,
  the highest-value miss is `Dataset` schema.org markup — the exact vocabulary Google Dataset
  Search and Data Commons rely on to surface open datasets, and one of the clearer signals AI
  answer engines use to extract entity-level facts instead of guessing from prose.
  `Organization`/`GovernmentOrganization` (for DOHMH), `WebSite` with a `SearchAction`
  (sitelinks searchbox), and `BreadcrumbList` (the nav already has the hierarchy — key-topic →
  indicator → neighborhood) are the other three that would cost little relative to payoff, since
  the underlying data (indicator names/descriptions from `metadata.json`, org name, page
  hierarchy) already exists in Hugo `.Params`/menu structure.

### The Data Explorer's real content is invisible to every non-JS crawler (P1)

This is the site's flagship feature, so it's worth tracing precisely what ships in the *initial*
HTML response — it's less than it looks:

- [de-indicator-info.html](../themes/dohmh/layouts/partials/de-indicator-info.html) — the
  indicator name/description/measure/geo/time UI — server-renders only placeholder text:
  `"Loading indicator..."`, `"Loading indicator description..."`, and empty
  `.measure-name`/`.geo-name`/`.time-name` holders. Every real value is written in by
  `assets/js/data-explorer/menu.js` and friends only after `metadata.json` loads client-side. The
  map, legend, table, and every chart are the same story: empty containers populated by
  Leaflet/DataTables/Vega after JS runs.
- The static text that *does* exist is in
  [de-indicator-names-pf.html](../themes/dohmh/layouts/partials/de-indicator-names-pf.html): for
  every indicator bundled on a data-explorer page, it emits a hidden
  `<h1 id="IndicatorID-{id}" class="d-none">{name}</h1>` + `<h2 class="d-none">{description}</h2>`.
  This exists **only to work around Pagefind** — the app's real interactive markup
  (`de-indicator-info.html`, the map, the tabs) sits inside a scoped
  `data-pagefind-ignore="all"`, so the site's *own* search index would otherwise see nothing on
  these pages either.
  **Updated 2026-07-22:** a second, separate `d-none` block was added to
  [single.html](../themes/dohmh/layouts/data-explorer/single.html) and
  [section.html](../themes/dohmh/layouts/data-explorer/section.html) carrying each topic's real
  `.Title`/`.Content`/take-action text (see the DE fresh-audit doc's §4.8) — the ignore that used
  to sit on the whole outer `<article>` ([single.html:10](../themes/dohmh/layouts/data-explorer/single.html)
  pre-fix) is now scoped down to just the JS shell, the same narrow-not-blanket shape as the
  indicator-name dump. This is a second instance of the identical hidden-text pattern, not a fix to
  it — the multi-`<h1>`/hidden-text issues below now apply to two partials instead of one, and any
  non-JS crawler reading raw HTML picks up topic-level "about" prose in addition to the indicator
  name/description dump.
- **Net effect:** any crawler that doesn't execute JavaScript — essentially the entire non-Google
  AI-crawler ecosystem — can now also read each topic's real "about" text and take-action link, but
  still gets **zero actual data**: no numbers, no map, no table row, nothing distinguishing one
  measure/geography/time period from another. The indicator-level content remains a flat,
  undifferentiated bag of every bundled indicator's name and one-line description on a given topic
  page — unchanged by the 2026-07-22 update, which only added topic-level text.
- Two secondary defects ride along with the workaround: (1) **multiple `<h1>` elements per page**
  — one per bundled indicator, so a topic page with a dozen indicators ships a dozen `<h1>`s,
  invalid outline structure regardless of visibility; (2) those `<h1>`/`<h2>` are `display:none`
  (`.d-none`) on *every* load for *every* visitor — the same shape of thing Google's spam guidance
  calls out as "hidden text." Not deceptive here (the identical name/description becomes visible
  once JS populates the real UI), but worth fixing on the underlying technical-SEO merits alone.
- **The addressability already exists — this is fixable incrementally, not a rebuild.** The app
  already deep-links each indicator via a real query string, `?id=<IndicatorID>`, read with
  `URLSearchParams` and pushed with `history.pushState`/`replaceState`
  ([app.js:68](../assets/js/data-explorer/app.js),
  [data.js:283-289](../assets/js/data-explorer/data.js),
  [topic-indicator-selector.js:99,636](../assets/js/data-explorer/topic-indicator-selector.js)).
  Hugo just never varies the *server-rendered* response by that param — every `?id=` on a given
  topic page returns byte-identical HTML. The lowest-cost fix isn't a JS rewrite: make the existing
  hidden-h1/h2 pattern *visible* and specific to the `id` in the URL when present (one real,
  visible `<h1>` instead of a hidden dump of every bundled indicator) — which also resolves the
  multi-`<h1>` and hidden-text issues above in the same change. Full pre-rendering (SSR/static
  snapshot per indicator) is the complete fix but a much bigger lift — worth its own Tier-4-sized
  proposal if this becomes a priority, cross-referencing the DE fresh-audit doc's Tier 4.

### Meta-tag correctness (P2/P3)

- **`<html lang="en" dir="ltr">` is hardcoded** in both
  [baseof.html:2](../themes/dohmh/layouts/_default/baseof.html) and
  [list.html:2](../themes/dohmh/layouts/_default/list.html) — every one of the 14 translated pages
  that actually exist (7 `.es.md` + 7 `.zh.md`, confirmed under `content/data-stories/*` plus the
  homepage) ships with the wrong document language. This directly contradicts the `hreflang`
  alternate-links code a few lines below in the same file
  ([head.html:82-86](../themes/dohmh/layouts/partials/head.html)), which correctly reflects each
  translation's real language — the two signals disagree on the same page. Also affects screen
  readers (wrong pronunciation/voice). Fix: `<html lang="{{ .Language.Lang }}" dir="ltr">`.
- **Three `<meta name="robots">` tags can stack on one response**
  ([head.html:17,26,41](../themes/dohmh/layouts/partials/head.html)): the prod/dev branch, plus an
  unconditional second tag for `.Section == "resources"`. Functionally fine — Google documents that
  the most restrictive directive wins when multiple robots meta tags conflict — but fragile and
  non-obvious; collapse to one computed value.
- **`content/resources/` is `noindex`ed in every environment, including production**
  ([head.html:39-42](../themes/dohmh/layouts/partials/head.html)). The section holds
  `health-code-reference` and `sugar-lookup` — both look like real, standalone public tools, not
  admin/internal content — and both are still listed in `sitemap.xml` despite being noindexed (the
  sitemap template doesn't check the same condition), a signal-hygiene mismatch worth resolving
  either way. Confirm this is deliberate before treating it as correct.
- **`<title>` never includes the site name**, while `og:title`/`twitter:title` both append
  `" – {{ .Site.Title }}"` ([seo.html:12,20](../themes/dohmh/layouts/partials/seo.html) vs.
  [head.html:62-64](../themes/dohmh/layouts/partials/head.html)) — the tag that actually becomes
  the browser-tab text and (usually) the search-result blue link carries no branding, while social
  shares do. Minor, one-line fix for consistency.
- **Vestigial meta tags:** `geo.region` ships with an empty `content=""`
  ([seo.html:4](../themes/dohmh/layouts/partials/seo.html)) and `fb:profile_id` is hardcoded to
  `"0"` ([seo.html:8](../themes/dohmh/layouts/partials/seo.html)) — both look like placeholders
  nobody filled in or removed. `geo.*` meta tags haven't influenced Google ranking in well over a
  decade regardless; safe to delete both rather than fix.
- **~18% of content pages (111 of 624 `.md` files) have no `seo_description` override**, falling
  back to one site-wide sentence ([globals/seo_defaults.yml](../data/globals/seo_defaults.yml)).
  Spot-checked: most of the 111 are non-rendered leaf-bundle fragments (e.g.
  `data-features/heat-report/*-fig-*.md` are `.Content`-included pieces of a longer report, not
  standalone pages), so the real gap is smaller than the raw count suggests — but worth a pass to
  confirm none of the 111 are actually indexable pages sharing the boilerplate description.

### One thing that looks like a bug but isn't

- [sitemap.xml:9-19](../themes/dohmh/layouts/_default/sitemap.xml) emits what looks like a
  duplicated `<xhtml:link rel="alternate">` block. It isn't: the first block (inside
  `range .Translations`) lists every *other* language version; the second, identical-looking block
  sits after the range closes, back in the current page's own context, and emits the page's
  *self-referential* hreflang entry — which Google's hreflang guidelines require in every
  alternate-link set. Confirmed correct on a close read; would benefit from a one-line comment
  explaining why, since it reads as copy-paste residue at a glance.

> **Refactor summary:** (1) add `Sitemap:` to `robots.txt`, fix the hardcoded `lang="en"`, add the
> `<title>` brand suffix, delete the two vestigial meta tags — all trivial, bundle into the
> existing Phase 1 quick-win pass (§13); (2) decide and document an explicit AI-crawler policy
> instead of an implicit one; (3) add `Dataset`/`Organization`/`WebSite`/`BreadcrumbList` JSON-LD —
> the single highest-leverage structured-data addition for a government open-data site; (4) the
> Data Explorer JS-only-content gap is the biggest item here — start by making the existing
> hidden-indicator-name pattern visible and `id`-specific instead of a hidden bag of everything,
> which also resolves the multi-`<h1>` and hidden-text issues in the same pass.

---

## 13. Suggested roadmap

**Phase 0 — guardrails (do first; cheap, prevents regressions).**
1. ~~Add `package.json` scripts: `lint` (ESLint)~~ **partly done 2026-07-23 (DE Tier 4.5):**
   a `scripts` block with `lint`/`characterize`/`smoke` and ESLint `no-undef` over the
   SPA tree now exist (see §7). Still to do: `format` (Prettier), `build`/`dev` (Hugo),
   and wiring ESLint + a Hugo build into a PR check workflow (lint-in-CI is deferred, §7).
2. Add `.gitattributes` LF rules; delete the `dos2unix` build step.
3. Pin CI actions to SHAs; add `permissions:` blocks; switch to `npm ci` + cache;
   add Dependabot.
4. Decide a testing strategy (ad-hoc `node:test` scripts vs. adopting a
   framework like Vitest) — unresolved as of 2026-07-02, see §7.

**Phase 1 — quick wins (the §11 table).** ~~rawgit → local PIP~~ head.html tag done
2026-07-14, but the follow-on work is still open — see §5c; drop FA JS; ~~minify
CSS~~ proposed + rejected by the user, see §2; de-dupe favicon/nyc-lib; fix the
header markup bugs; gate GA out of dev/local and fix the double-fire +
`click_how_caclulated` typo (§9); add `Sitemap:` to `robots.txt`, fix the
hardcoded `lang="en"` on translated pages, add the `<title>` brand suffix, and
delete the vestigial `geo.region`/`fb:profile_id` tags (§12).

**Phase 1.5 — SEO/AI discoverability (§12).** Decide and document an explicit
AI-crawler policy instead of an implicit one; add `Dataset`/`Organization`/
`WebSite`/`BreadcrumbList` JSON-LD (highest-leverage structured-data gap for a
government open-data site); make the Data Explorer's hidden per-topic
indicator name/description block visible and `id`-specific instead of a
hidden bag of everything — the biggest item in §12, since it's the only thing
a non-JS crawler can currently read on the site's flagship pages.

**Phase 2 — delete forks (cutover done 2026-06-27; deletion pending).** The
endpoint cutover landed. Remaining: delete the three `data-explorer-old` trees
(content + layouts + JS, ~6,560 lines) once nothing depends on
`/data-explorer-old/`, plus the dead `geography.js`/`_*.js` in the live
`data-explorer` tree; sweep the `*-old/-new/-2/0` partial pairs; move geo
crosswalks from JS to `data/`.

**Phase 3 — structural.** Extract `nav-items` partial (de-dupe header); collapse
the `related*` partials; move inline `<script>` out of the 66 templates into
fingerprinted JS (also unblocks a real CSP); reusable `workflow_call` for the
four build workflows; plan the Bootstrap 4 → 5 / de-jQuery migration.

**Phase 4 — a11y + perf budgets.** axe/Lighthouse in CI on representative pages;
defer/bundle the data-viz libraries; settle on one i18n strategy.
