# Site-Wide Audit (2026-06-27)

> ## Ported to `production` — read this before acting on anything below
>
> **Provenance.** Copied verbatim on 2026-08-12 from `feature-MOD-Lab-NR-recode-refactor`
> at `5cb650e40c`, where it was last updated 2026-08-11. That is the newest and largest of
> the 21 branch copies, and it is a superset of the others in substance: of the 12 lines
> present in the `feature-claude-tooling-migration` copy and absent from this one, 11 are
> re-wraps and the twelfth survives here in a more specific form
> `[verified 2026-08-12: line diff of all three copies, then a per-claim grep of each
> differing line]`.
>
> **It was written against a different tree.** Findings describe the branch they were found
> on unless a line says otherwise. Two mechanical facts about this copy on `production`:
>
> - **24 of the 77 repo paths it cites do not exist here** `[verified 2026-08-12: existence
>   check of every path matching `(themes|assets|scripts|config|content|data|static|documents|.github)/…`]`.
>   The absent ones cluster in identifiable places: everything under `assets/js/data-explorer-old/`
>   (§1, §5, §9, §11 row 12) and `assets/js/nr-topic-spa*` (§5a, §5h), the DE-only partials
>   `header-de.html`, `de-indicator-info.html`, `search-modal.html`, `lib-vega.html`
>   (§11 rows 17, 19, 20, 23 and §12), and the `scripts/` harnesses (§10a, §5h). A finding
>   whose evidence is a file this tree does not have is about another branch.
> - **The sibling documents it cross-references are not in this repo.**
>   `data-explorer-deep-audit-2026-06-27.md`, `data-explorer-fresh-audit-2026-07-13.md`,
>   `js-conventions.md`, `nr-accessibility-audit-2026-08-10.md` and
>   `flexdatalist-accessibility-seed-2026-08-11.md` live only on the branches that own that work.
>
> **What was re-checked here.** The §11 quick-wins table, because it is the part meant to be
> acted on — see the status note directly above that table. Nothing else in this document has
> been re-verified against `production`; treat the rest as the branch's record until it is.
> §14 holds findings first observed on this tree.

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
  `@mapbox/leaflet-pip`, `qrcode-generator`, `jquery-flexdatalist` for actual use
  and drop the unused ones. **`georaster` / `georaster-layer-for-leaflet` /
  `geoblaze` are confirmed IN USE (2026-07-25)** — `data-features/heatstory.html`
  loads all three from `node_modules` into the browser; don't drop them. (Note
  `@mapbox/leaflet-pip` is installed but loaded by no template — see §5c.)
- ~~**No `npm audit` / Dependabot.**~~ **CORRECTED 2026-07-25: Dependabot IS
  enabled and reporting.** It surfaces 8 open alerts on the default branch, which
  is why every `git push` prints a vulnerability banner. Triage in **§3a** below.
  The gap is not scanning — it's that nobody had read the results.

### 3a. Dependabot alert triage (added 2026-07-25)

**Status: all 8 open alerts assessed, none fixed.** Nothing here is an emergency,
but the banner on every push had never been read, and one item is a real project
that should be scheduled rather than rushed.

Two numbers that do **not** reconcile, so don't try: Dependabot reports **8**;
`npm audit` reports far more (`chokidar`, `cacache`, `glob`, `brace-expansion`,
`rimraf`…). The extras are dev-tree transitives Dependabot's default config
doesn't alert on. Use the 8 as the work list.

**Group 1 — `decompress` (CRITICAL). Not in the production path at all.**
Transitive under `hugo-extended@0.146.7`, a local dev convenience. All four
workflows pin `hugo-version: "0.147.3"` through the Hugo setup action instead, so
this package never participates in a build that produces production output. The
vulnerability is archive-extraction path traversal and the archive is the Hugo
release itself. Fix: `hugo-extended@0.164.0` (semver-major). **Also ask whether it
belongs in `package.json` at all**, since CI ignores it. Good candidate to dismiss
with a reason in the Dependabot UI so it stops padding the count.

**Group 2 — vega / vega-functions / vega-expression (3 × HIGH). These ship, but
the exploitation paths are not present.** `lib-vega.html` bundles vega 5.33.1 +
vega-lite 5.23.0 + vega-embed 6.29.0 from `node_modules` and serves them with SRI
on every explorer page, plus data-features and data-stories. Each advisory's
precondition was checked rather than assumed:

- The `VEGA_DEBUG` advisories require that global. `VEGA_DEBUG` appears in neither
  shipped bundle nor any first-party code.
- The expression-abuse XSS requires untrusted input reaching a Vega expression.
  The codebase contains exactly two `"expr"` fields — `correlate.js:425` and
  `trend.js:60` — both static literals with no interpolation. Metadata-derived
  strings reach specs as **data values**, never as expressions.
- `setdata` is not called anywhere.

Fix is vega 6.3.1 / vega-lite 6.4.3 / vega-embed 7.1.0 — **all semver-major**,
across four chart modules (bar, trend, correlate, disparities) plus the print
path. Schedule as its own PR with `npm run characterize -- --check` as the safety
net; that harness exists for exactly this kind of change. **Do not rush it** — no
reachable CVE is forcing the timeline, and a botched vega-lite 5→6 spec migration
would break every chart on the site.
**Re-check if this ever changes:** the "not exploitable" finding rests on specs
being code-built from trusted metadata. If a spec, expression, or signal ever
becomes assembled from fetched or user-supplied strings, this group jumps to P1.

**Group 3 — `serialize-javascript` (high), `micromatch` (moderate), `elliptic`
and `braces` (low). One root cause: all four are transitive under
`georaster@1.6.0`**, which is genuinely used (see §3 — heatstory loads it into the
browser). npm reports non-major fixes available, unconfirmed by an actual run.
**Cheapest real win of the three groups** — four alerts for one small change,
verifiable by loading `data-features/heat-story/` and confirming the raster layer
renders.

**Recommended order:** group 3 → `hugo-extended` bump (or removal) → vega as a
scheduled project. Then dismiss anything left that is genuinely unreachable, with
a written reason, so a future alert that *is* reachable stands out instead of
being lost in a count of eight.

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

### 4a. Element-id hygiene, and one shared partial that constrains it (added 2026-07-25)

Found while sweeping the Data Explorer for misleading names (DE audit §4.1
follow-up). The DE-scoped instances are fixed; these are the parts that are
site-wide or blocked.

- ~~**`#skip-header-target` is duplicated on most pages (P2, a11y).**~~
  **FIXED 2026-07-25.**
  [baseof.html:24](../themes/dohmh/layouts/_default/baseof.html) puts it on
  `<main>`, and ~20 templates *also* put it on their own `<article>` — both
  explorers, every `data-features/*`, and others. The "Skip Header" link resolves
  to the first match, so the second is inert, but duplicate ids are invalid and
  this one is the keyboard-skip target on a NYC.gov property. Fix by dropping the
  id from the templates and keeping the `baseof.html` one, after checking nothing
  scrolls to the article copy.
  **Resolution:** the id was dropped from **44 templates** — the `~20` estimate
  above was low; 44 is the count on `feature-new-data-explorer` once
  `data-explorer-old/` is excluded. The "checking nothing scrolls to the article
  copy" step came back clean: nothing in `assets/`, `static/`, `content/` or
  `config/` referenced the id, and the only references anywhere are the `href`
  in `header.html` / `header-ds.html` / `header-de.html`. A `dev_stage` build
  went from 367 pages carrying two targets to 42, and all 42 are
  `data-explorer-old/` pages, which keep their copies until the old tree is
  deleted (§1) — CLAUDE.md forbids modifying that tree.
  Fixed alongside it: the `<main>` was not focusable, so the skip link could
  scroll without moving keyboard focus. `tabindex="-1"` was added to the
  `<main>` in `baseof.html` and `list.html`, covering 994 of 994 pages that
  have a target. That focus behavior is standard a11y guidance but was not
  reproduced in a browser (Playwright could not launch in the sandbox), so it
  is marked `HYPOTHESIS (unverified)` in `baseof.html` per CLAUDE.md.
- **Leading-digit ids are a live trap.** `id="311"` / `id="311label"` are valid
  HTML5 but **invalid CSS selectors** — `querySelector('#311')` throws
  `SyntaxError`, so only `getElementById` can reach them. The DE copies were
  renamed to `#contact311Label` / `#contact311Links*`; grep for other numeric-
  leading ids before writing any new `querySelector`.
- **`takeaction.html` is shared, so its ids can't move.** It is included by both
  [data-explorer/single.html:68](../themes/dohmh/layouts/data-explorer/single.html)
  and [data-explorer-old/single.html:455](../themes/dohmh/layouts/data-explorer-old/single.html),
  and the old explorer's `data.js` still resolves `#311`/`#311label` by name. It
  therefore keeps the old ids while the DE-only partials moved off them. **This
  unblocks itself when the old tree is deleted (§1)** — fold it into that pass.
- **Its hidden copy contributes nothing to search.** On the new explorer the
  partial renders inside a `d-none` block that exists specifically to keep
  topic-level content Pagefind-indexable (the visible equivalent lives in a
  `data-pagefind-ignore`d JS shell). But both of its 311 elements are populated
  **client-side only**, so at build time — which is when Pagefind reads the DOM —
  they are empty. They are dead weight inside a block whose entire purpose is
  indexing. Same shape as the §12 finding about the explorer's client-rendered
  content being invisible to crawlers.

### 4b. Deferred: the SPA says `links`, the UI says "Correlate" (added 2026-07-25)

The user-facing vocabulary is **Correlate** / **Correlations**; the code calls the
same feature `links` in **454 places across 11 files** (222 in `measures.js`
alone). Deferred by decision — recorded here so the cost is known rather than
rediscovered. Three external contracts make it more than a rename:

- the canonical `?overlay=links` query param (live, shareable URLs);
- the legacy `#display=links` / `#tab-links` hashes that `normalizeLegacyHashOverlayURL` still honours;
- the `links_disparities` GA value, which would break series continuity.

Options, cheapest first: **(1) leave it** — the current state, consistent within
itself and only confusing at the UI boundary; **(2) rename internals only**,
keeping `links` as the wire format at the three contract points, with one
documented translation layer — most of the benefit, but introduces a
vocabulary seam someone must maintain; **(3) rename everything including the URL
param**, adding `links` → `correlate` to the existing legacy-URL normalizer so old
bookmarks keep working, and accepting a GA discontinuity. Do (2) or (3) only as
its own PR, never folded into other work.

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
the numbers for five ACS percentages, and the site displays the `.js`.**

| Thing | Copies | Consumers |
|---|---|---|
| 42-row neighborhood list | [`uhflist.js`](../assets/js/uhflist.js) (20 KB, `var neighborhoods`) **and** [`uhflist.json`](../assets/js/uhflist.json) (20 KB) | `.js` at runtime (`nr-output/single.html`, `nr-leaflet`, `neighborhood-reports/section`, `topiclanding`); `.json` at build time only (`nr-insert-zips.html` via `transform.Unmarshal`) |
| CD/CCD → UHF crosswalk | `ccd-to-uhf42.js` (40 KB), `cd-to-uhf42.js` (32 KB), `ccd-to-uhf42.json` (33 KB) | the two `.js` by `overlap-tool.html` + `overlap-tool-with-map.html`; **the `.json` by nothing** |
| UHF42 boundary | `static/geojson/UHF42.geojson` (95 KB), the remote `EHDP-data/…/geography/UHF42.geojson`, and `UHF42.topo.json` | local → `nr-leaflet.html`; remote → `overlap-tool-with-map.html` (2×); topojson → the data explorer |
| UHF42 attribute table | `static/UHF42.csv` (3.5 KB) | only `nr-clickable-uhf.html` + `nr-map-highlight.html` — **both dead, and both deleted 2026-08-06; the CSV is retained, see the correction under §5a's suggested order** |

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

> **RESOLVED 2026-08-05 — `uhflist.js` is the source of truth; `uhflist.json` is
> deleted along with its only consumer, `nr-insert-zips.html`.** Two corrections
> to the framing above, from a field-level comparison (parse both, join on
> `UHF_id`, count differing rows per field):
>
> - **"All 42 rows differ" is true but reads as more than it is.** 8 of the 13
>   shared fields are byte-identical across every row — `UHF_id`, `UHF_name`,
>   `page_name`, `Zipcodes`, `namezip`, `TotalPopulation`, `PercentOver65`,
>   `PercentUnder18`. Only the five ACS socioeconomic percentages diverge.
>   Because `Zipcodes` is byte-identical, deleting the `.json` loses nothing at
>   all — a stronger warrant than "its consumer is going away."
> - **The "different vintages" reading is unconfirmed in both directions.**
>   Neither file could be dated: the three ACS poverty pulls in
>   `cgettings-EHDP-work/data/` are all 2015-19 and give UHF 101 poverty as
>   `15.08`, matching neither `16.53` nor `16.1624`. The decimal-precision
>   difference hints at different origins but dates nothing. Choosing the `.js`
>   is a decision to keep displaying what the site already displays, not a
>   finding that its numbers are current — **the ACS values are being corrected
>   on a separate track**.
>
> Detail in [`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md) §10.5.

**2. `uhflist.js` is render-blocking on pages that never use it (P2).**
[head.html:185](../themes/dohmh/layouts/partials/head.html) sits inside
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

> **HANDED OVER 2026-08-05 to
> [`nr-decisions-and-sequencing-2026-08-04.md`](nr-decisions-and-sequencing-2026-08-04.md)
> decision 1**, which owns the deletion and its proof. It found **five**, not three
> — `nr-indicator-old.html` and `nr-sub_nav.html` are also callerless. Left here
> because the analysis below is the record of how the first three were established;
> do not action it from this document.
>
> **All five deleted 2026-08-06.** `static/UHF42.csv` and `ccd-to-uhf42.json` were
> **not** deleted with them, against the suggested order below — see the correction
> at the end of that list.

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

**6. A name-correction map in the topic SPA blames the wrong file, and is inert
against the one it actually reads (P3, added 2026-08-03).**
[nr-topic-spa.js:310](../assets/js/nr-topic-spa.js) carries
`nameCorrections = { 'Crotona -Tremont': 'Crotona - Tremont' }` under a comment
stating *"uhflist.js has one known typo… (missing space after dash)"*. It does
not. Grepping every `uhflist*` file in the tree: **both** `assets/js/uhflist.js`
and `assets/js/uhflist.json` spell it `Crotona - Tremont`, correctly and
identically — one of the few things the two vintages agree on. The unspaced form
does exist in the repo, in exactly two places, neither of them read by the SPA:
`static/UHF42.csv` (already dead per finding 4, and slated for deletion in step 1
below) and `content/data-features/restaurant-grades/resto-data-full.csv` (10
rows, a different feature entirely).

So `correctedUhfName` is an identity function on current data. Confirmed at
runtime 2026-08-03: the SPA's `neighborhoods` global returns
`Crotona - Tremont` for UHF 105, and the Crotona topic page resolves geocode 105
and renders its 23 indicator cards and demographics. Both sides of the comparison
already agree, so nothing is being corrected.

The map is harmless and costs one property lookup. The comment is the actual
defect: it sends anyone auditing this to `uhflist.js`, where they will find
nothing and reasonably conclude the note is stale rather than misfiled. Fix the
comment or drop both — but note that deleting the map is only provably safe for
data in *this* repo. Report JSONs arrive from EHDP-data at runtime and were not
surveyed for spelling.

**Closed 2026-08-08** — both dropped, with the `correctedUhfName` wrapper and its
three call sites, in Stage F of the NR retirement. **The caveat above does not
apply**: EHDP-data spelling never reaches this comparison. Both sides of it are
uhflist names — `neighborhoods` is built from `data/globals/uhflist.json` in
[head.html:193](../themes/dohmh/layouts/partials/head.html), and the display name
it is matched against is the `neighborhood` param the content adapter takes from
the same file. Had the key ever matched, correcting one side of a comparison
between two copies of one string would have broken the lookup, not fixed it.

**Suggested order** — deletions first; they're provable and reversible:

1. Delete `nr-clickable-uhf.html`, `nr-map-highlight.html`, `nr-chooser.html`,
   `ccd-to-uhf42.json`, `static/UHF42.csv`. Verify with a clean `hugo` build and
   a `git diff` of `docs/` — expect **no** rendered-output change.
   *(The three partials are handed over to the NR sequencing doc's decision 1,
   which found five — see #4 above. `ccd-to-uhf42.json` and `static/UHF42.csv`
   stay owned here.)*

   **CORRECTED 2026-08-06.** The five partials are deleted. **The two data files are
   not, and grouping them with the partials in one step was wrong.** A callerless
   partial cannot be reached at all; `static/UHF42.csv` and `ccd-to-uhf42.json` are
   served verbatim from `static/`, which Hugo publishes *regardless of references* —
   so both remain live public URLs after the last in-repo consumer is gone. "Nothing
   in this repo references it" is exactly the condition that held for the 252
   `nr-output` report URLs, which draw ~14,200 sessions a year (§5 of the retirement
   memo). The build-diff proof this step proposes cannot detect the loss either,
   since a `static/` file that no page links to leaves no trace in rendered output.
   Deleting them needs external-traffic evidence, not a build diff, and belongs in
   its own step.
2. ~~Drop the duplicate `uhflist.js` tag from `topiclanding.html`.~~ **Closed 2026-08-07 — the
   template was deleted in the Option D swap at `2bce6c6d46`**, so the duplicate tag went with it.
3. Gate `uhflist.js` in head.html to `neighborhood-reports` (keep `index.html`'s
   explicit load). Removes a render-blocking 20 KB from every DE page.
4. ~~**Blocked on #1's decision:** collapse `uhflist.js` + `uhflist.json` into one
   source of truth. The clean shape is JSON-only — keep the build-time
   `transform.Unmarshal` for zips and emit the runtime copy *from the same JSON*,
   on the pages that need it, so the two can't drift again. This changes the
   numbers shown on neighborhood reports: it is a **content change** and wants
   its own commit with sign-off, not a ride-along in a perf PR.~~

   > **SUPERSEDED 2026-08-05.** The decision went the other way: `.js` is the
   > source of truth and `.json` is deleted with `nr-insert-zips.html`, the only
   > thing that reads it. **The sign-off requirement does not apply to that
   > direction** — it was written for the JSON-only shape recommended here, which
   > would have changed displayed numbers. Keeping the `.js` changes none, because
   > the `.json` percentages were never rendered anywhere (see #1 above). The two
   > can't drift again for the simpler reason that only one will exist.
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
  already makes — or Turf / manual ray-casting. ~~Note the package is in `package.json` but is
  **not** loaded by any template today (§3's "audit for actual use" bullet), so a script tag
  or `lib-*.html` partial has to be added alongside the code change.~~

  > **CORRECTED 2026-08-05 — it *is* loaded.** `data-features/heatstory.html:332` pulls it
  > via `resources.Get "node_modules/@mapbox/leaflet-pip…"`, on `HEAD`,
  > `feature-new-data-explorer` and `production` alike `[verified: git grep -l
  > 'node_modules/@mapbox/leaflet-pip' <branch> -- themes/]`. So the migration target is
  > already wired into the build on a real page; only `head.html` never followed. That makes
  > the fix smaller than described — copy heatstory's load, don't invent one. §3's
  > "installed but loaded by no template" note is wrong for the same reason.

- **P2 — three templates still load OpenLayers from RawGit.** Same dead host, a different
  library, and the *core* map dependency for the pages that load it —
  [rats-in-your-neighborhood.html:219](../themes/dohmh/layouts/data-features/rats-in-your-neighborhood.html),
  [rats-in-your-neighborhood-nyc-lib.html:99](../themes/dohmh/layouts/data-features/rats-in-your-neighborhood-nyc-lib.html),
  and [email-electeds.html:132](../themes/dohmh/layouts/take-action/email-electeds.html) (a
  take-action page — this third site wasn't in the original DE write-up). All three go on to
  construct `new nyc.ol.FrameworkMap({...})`, which is nyc-lib's OpenLayers wrapper.

  > **Branch-scoped, checked 2026-08-05.** Three is correct for
  > `feature-new-data-explorer` and `production`. On
  > `feature-MOD-Lab-NR-recode-refactor` it is **five** — `take-action-email.html` and
  > `take-action/email.html` also carry the tag `[verified: git grep -l
  > 'rawgit.*openlayers' <branch> -- themes/]`. Count against the branch you are fixing.
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

### 5e. `nr-output` report pages use Arquero but never load it — charts broken (P1, added 2026-07-23, FIXED 2026-07-23)

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

**Fixed 2026-07-23:** added `{{- partial "lib-arquero.html" . }}` to
`nr-output/single.html` (the only template in the chain that renders
`nr-indicator-new.html`/uses `aq.` — `nr-output/section.html`,
`neighborhood-reports/section.html`, and `neighborhood-reports/topiclanding.html`
are card-grid/landing pages with no `aq.` usage and needed no change), placed after
the existing `lib-vega.html`/`lib-d3.html` includes to match the working
`data-features/realtime.html` idiom. Confirmed live (Playwright, `dev-stage`):
`aq` is now defined (no `ReferenceError`), the 23 build-time indicator rows
render, and **expanding an indicator accordion now builds its Arquero+Vega
trend chart** (`#collapse-Asth1199` → a `.vega-embed` with a rendered canvas;
the client-side chart build was what the missing library aborted). The only
remaining console errors are the allowlisted Pagefind dev-noise. The page also
passes the Tier 4.5 smoke test (13/13 green). No longer blocks adding an
`nr-output` page to the smoke list — it has been added.

Per the reviewer's suggestion, audited every other `lib-*.html` gate the same way
(does any template use a library global — `vegaEmbed`, `d3.`, `topojson.`, `L.`/
`easyButton`/`colorIcon`, `.DataTable(`, `chroma.` — without including the matching
partial in its own render chain, directly or via an included sub-partial). **No
other gaps found** — every other consumer already includes its library, including
the two Vega-shortcode files (`shortcodes/vega.html`/`vega0.html`) and the
`nyccas_pollutant_trends.html`/`nr-indicator-old.html`/`nr-map-highlight.html`/
`nr-clickable-uhf.html` partials, which use `aq.`/`vegaEmbed`/`L.` but are dead
code (not `partial`-included anywhere), so they can't throw at runtime.

---

### 5f. `/data-explorer/` calls Arquero without loading it (P1, added 2026-07-29)

**Branch note:** found on `feature-MOD-Lab-NR-recode-phase2`, which carries the
older 10-file explorer. `feature-new-data-explorer` removed Arquero from
`head.html` entirely (Tier 4.6), so this very likely does not apply there —
re-check before acting on this if the two lines converge.

`themes/dohmh/layouts/data-explorer/section.html:35` includes
`partials/de-topic-indicators.html`, which calls `aq.from(...)` at line 75. But
`themes/dohmh/layouts/partials/head.html:138` gates the whole library block —
Arquero included, at line 178 — behind:

```go-html-template
{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") }}
```

closing at line 233. The Data Explorer landing page is `.Kind == "section"` and
`.Section == "data-explorer"`, so it satisfies neither arm. Arquero never loads,
`aq` is undefined, and the topic/indicator table on the page never builds.

Evidence: `pageerror: aq is not defined` on `/data-explorer/` in the Tier 4.5
smoke test, plus the gate above. Same class as the Tier 4.6 head.html-gating
bugs — a library gate whose condition doesn't cover every template that consumes
the library.

Currently allowlisted in `scripts/smoke-pages.mjs`, scoped to that one page.
Fixing the gate is what removes the entry.

---

### 5g. The header's Google Forms iframe is refused by Google's own CSP (P3, added 2026-07-29)

`themes/dohmh/layouts/partials/header.html:374` embeds the email-signup Google
Form in an `<iframe>`. Google serves that URL with a **report-only**
`frame-ancestors 'none'`, so Chromium logs a refusal on **every page that renders
the header** — which is every page.

Report-only means nothing is blocked *by policy*, and the message is harmless
noise. But it is worth noting that this is a third-party embed whose framing
Google explicitly discourages; if they promote the policy from report-only to
enforcing, the signup form silently stops rendering site-wide. The durable fix is
to link out rather than frame (`partials/signup.html` already does exactly that).

Allowlisted site-wide in `scripts/smoke-pages.mjs` (`page: null`) — it is genuinely
generic, unlike §5f.

---

### 5h. Two JS convention files, two contradictions (added 2026-07-29)

> **RESOLVED 2026-07-29 — the documents are now one.** Everything from here to
> "Resolved 2026-07-29 — unified, doc-only" below is the historical record of why
> the split existed, written in the present tense of that day. The stopgap it
> describes is no longer in force.

**The goal is one unified set of JS conventions covering all browser-side code in
this repo.** The directory split described below is an explicit stopgap that
preserves that goal — it is not the destination, and should not be read as a
settled architecture.

Two convention documents now coexist:

- `.claude/commands/js-development.md` (166 lines)
- `documents/js-conventions.md` (263 lines)

They are ~75% complementary. Unique to the first: the no-IIFE scope rule,
`const`/`let`/never-`var`, named arrow functions over `function` declarations,
4-space indent, HTML-string indentation mirroring the DOM. Unique to the second:
the file-header banner, the 4-level comment hierarchy, variable-declaration
grouping, internal step comments for functions over ~20 lines, a worked example.
Where they overlap (vertical whitespace, function-level comments, why-not-what)
the second is simply the more prescriptive, and they agree.

**They contradict each other twice:**

1. **`console.log` format.** `js-development.md` mandates a greppable
   `'scope: event: value'` form. `js-conventions.md` mandates call-depth markers
   (`"* fn"` / `"** fn"` / `"*** fn"`) and calls them "load-bearing for debugging."
2. **Trailing periods.** `js-development.md`: *"Do not end comments with a
   period."* `js-conventions.md` requires complete sentences and ends every
   example with one.

**Stopgap in force:** each file states its scope, so the conflicts never reach the
same source file. `documents/js-conventions.md` governs `assets/js/data-explorer/`;
`.claude/commands/js-development.md` governs all other browser-side JS. Depth
markers and trailing periods inside the DE tree, `scope: event:` and no periods
outside it — each matching the code already written under it.

**To unify:** pick a winner on each conflict, then reconcile the existing code that
follows the loser. The `console.log` decision is the expensive one — whichever
format loses has call sites to rewrite across whichever tree adopts it. Cheapest
done **after** `feature-new-data-explorer` merges; doing it on one branch
guarantees re-litigating it on the other.

#### Resolved 2026-07-29 — unified, doc-only

The two documents are now one. `documents/js-conventions.md` holds the merged
conventions and is scoped to all authored browser-side JS;
`.claude/commands/js-development.md` is a stub that points at it and keeps the
frontmatter that surfaces the conventions when a `.js` file is edited. No code was
changed.

How each conflict resolved:

- **`console.log` format** — neither format lost, so the rewrite the paragraph
  above priced never happened. The formats are scoped by file: call-depth markers
  everywhere, structured `'scope: event: value'` in `assets/js/nr-topic-spa.js`,
  where traces track a state machine rather than a call tree. Both route through
  the `debugLog` wrapper.
- **Trailing periods** — dropped as a rule. Neither required nor forbidden.

Two rules were promoted site-wide from `js-development.md`: no IIFEs /
`const`-by-default / never `var` / named arrow functions, and DOM-mirroring
indentation for HTML built in strings (extended to template literals). The file
banner and 4-level comment hierarchy were promoted from `js-conventions.md`, gated
at ~100 lines. The data explorer's shared-scope rule is documented descriptively,
quoting the framing `global.js` already carries for itself.

Unified ahead of this section's own advice about waiting for the DE merge, because
a doc-only merge re-applies cheaply and the expensive decision turned out not to be
expensive. Accepted cost: the merged doc describes the `feature-new-data-explorer`
explorer, not the retiring tree present on the branch it landed on.

##### Open question — comment voice

`js-conventions.md` required a complete third-person sentence ("Assigns a sortable
rank…"); `js-development.md`'s examples were imperative fragments ("Normalize rank
values…"). This is independent of the punctuation question and is **deliberately
unresolved** — the merged doc accepts both and says so. Worth revisiting; not
urgent.

Still unresolved site-wide as of 2026-08-04. `assets/js/nr-topic-spa.js` picked
third-person for itself during its conventions pass — a within-file consistency
choice, matching `scripts/nr-characterization.mjs`, not a ruling on the open
question. All 41 of its function comments are third-person or noun-phrase; none
are imperative.

##### Pending — `debugLog` is not on every branch

`debugLog` is defined at `themes/dohmh/layouts/partials/head.html:190` on
`feature-new-data-explorer`: `console.log` bound (not wrapped, so DevTools
attributes lines to the caller) in every environment except `production` and
`prod_prod`, with a `localStorage.de_debug` override. Its own comment states it is
site-wide by design rather than DE-specific. Branches without it — including
`feature-claude-tooling-migration`, which has `hugoEnv` at `head.html:278` and no
wrapper — leave raw `console.log` acceptable in the interim. The merged doc marks
the rule PENDING; drop that marker once the DE branch merges.

##### Known non-conformance (the merge was forward-only)

- `assets/js/nr-topic-spa.js` (945 lines) has no file-header banner and no comment
  hierarchy, and its 46 `console.log` calls are unconditional — they ship to
  production. Recorded as a known gap, not scheduled.
  **Resolved 2026-08-03 on `feature-MOD-Lab-NR-recode-refactor`, except for module
  structure.** All three gaps named above are closed. The file has a header banner
  and a 12-section comment hierarchy, and all 46 traces route through `debugLog` —
  `console.log` is now zero, with the 4 `console.error` calls kept, since smoke and
  the characterization harness key on console errors. It grew from 945 to 1,425
  lines through Stage 4.

  Stages 1–3e brought every region into conventions. Stage 4 consolidated: seven
  duplicate expressions extracted, `findLayerByName` collapsed onto
  `getUhfIdForDisplayName`, the demographics sidebar's two parallel 8-item lists
  replaced by one `DEMOGRAPHIC_FIELDS` table both iterate, and two renames —
  `renderNRMap` → `renderIndicatorChart` and `init` → `bootstrap`. `escapeAttr` now
  covers every id and `data-*` interpolation in `buildIndicatorCard`, committed
  separately because it is the one Stage 4 item that can change output.

  **Stage 5 landed 2026-08-04 — the file is fully conformant.** The `bootstrap()`
  closure is unwrapped: 58 declarations moved to module scope, leaving a
  `bootstrap()` at the bottom that holds the two guard returns and the wiring, and
  is called on the last line. 1,431 lines, 12 level-1 sections, 59 module-scope
  declarations.

  **Module structure closed 2026-08-06 — the one gap this entry held open.** The file
  is now ten under `assets/js/nr-topic-spa/`, loaded in a stated order with `app.js`
  last, and the 59 declarations are unchanged in count and content. Everything above
  describes the single file and stays as the record of that state.

  The collision audit the plan required ran as a browser probe on the loaded topic
  page — for each of the 59 names, insert a `<script>` declaring it and watch for a
  duplicate-declaration `SyntaxError`. One hit: `bootstrap`, which is this file's
  own existing declaration. Zero foreign collisions. (The probe was validated
  against `hugoEnv`, a name known to be taken, so a null result would have meant
  something.) `config` → `spaConfig` and `el` → `nrById` were renamed anyway, both
  being generic enough to be a hazard for whatever script is added to these pages
  next; `defaultStyle` and `highlightStyle` were candidates on the same reasoning
  but did not collide and were left alone.

  Read those four as the names that were considered, not as the set that qualifies.
  The forward-looking argument was never run over all 59 — `percent`, `isBlank`,
  `escapeAttr`, `styleFeature`, `selectLayer` and `renderAll` are equally generic and
  went unexamined. `bootstrap` is the concrete case: a top-level `const` creates a
  global lexical binding, and that binding shadows any same-named `window` property
  for every script evaluated after it. Nothing is shadowed today — this project is on
  Bootstrap 4 (`package.json` declares `^4.3.1`; 4.6.2 installed), which attaches only
  jQuery plugins. Bootstrap 5's compiled bundle does expose a global `bootstrap`
  namespace: its Programmatic API documentation writes `new bootstrap.Modal(…)` and
  `bootstrap.Popover.getInstance(…)` as bare globals
  (getbootstrap.com/docs/5.3/getting-started/javascript/, checked 2026-08-04). So the
  Bootstrap 4 → 5 migration §3 already tracks would put a `window.bootstrap` on these
  pages for this file's `bootstrap` to shadow.

  `eslint.config.mjs` gained a second block for this file, listing only its seven
  externals — being self-contained, it needs no directory scan. Note that the block
  alone does not put the file in scope: `package.json`'s `lint` script names its
  targets explicitly, and it had to be extended too. That was caught by a positive
  control (a deliberate undefined name), not by the first passing run, which passed
  precisely because the file was never read.

  The two notes carried here for Stage 5 are both settled. `renderNRMap` was not a
  unique name — a different function of that name is defined in
  `themes/dohmh/layouts/nr-output/single.html` and called from
  `themes/dohmh/layouts/partials/nr-indicator-new.html`, and the closure was the only
  reason that was not a collision. Stage 4's rename to `renderIndicatorChart` removed
  the hazard before Stage 5 removed the closure; both template occurrences are
  unchanged. Separately, `vegaEmbed` does not mutate its input spec, which is what
  makes the shared spec-fragment references Stage 4 introduced safe to alias — first
  observed 2026-08-03, re-confirmed against this branch's HEAD 2026-08-04 by wrapping
  `vegaEmbed` in the loaded topic page and comparing the serialized spec before the
  call against after the returned promise resolved. Identical, with the wrapper's own
  call count as the control proving the probe fired. `valueScale` and `tooltipFields`
  are in any case rebuilt on every `renderIndicatorChart` call, so cross-call
  contamination is impossible independently of that result.
- `global.js` on `feature-new-data-explorer` uses two `function` declarations where
  the merged doc prefers named arrow functions.
- `assets/js/site.js` is empty (0 lines).

---

### 5i. Merge reconnaissance: DE → NR breaks nr-output report pages (added 2026-07-29)

A throwaway merge of `feature-new-data-explorer` into
`feature-MOD-Lab-NR-recode-phase2` was built and run to find out what actually
breaks. Recorded here because the mechanical signals are misleadingly reassuring.

**The NR routing bridge this finding turns on no longer exists on
`feature-MOD-Lab-NR-recode-refactor`** — Stage F of the retirement removed it from
`404.html` on 2026-08-08, so `404.html` is no longer a superset there and the
navigate-to-404 mechanism below is gone with it. The reconnaissance stands as the
record of that branch on 2026-07-29; re-run it before trusting the conflict list.

**Mechanically clean.** Only two conflicts: `CLAUDE.md` (add/add — two independent
rewrites) and `themes/dohmh/layouts/404.html`, where the NR side is a strict
superset (retains `removeBeta`/`redirectHome`/`countDown`, adds the Phase 2 NR
routing bridge), so it resolves to the NR side. `hugo --environment dev_stage`
then builds with exit 0.

**But runtime regresses.** `npm run smoke` on the merged tree: 14/15 pass, with
`neighborhood-reports/<neighborhood>/<topic>/` failing reproducibly across three
runs. The visible symptom is `pageerror: L is not defined`, which is **not** a
Leaflet gating problem — a probe reporting unfiltered network + console events
showed zero leaflet `<script>` tags in the DOM, an `HTTP 404` for
`/neighborhood-reports/asthma_and_the_environment/bayside_little_neck`, and GA
reporting `dt=404 Page not found`. **The page navigates to a 404**: the NR routing
bridge rewrites `/<neighborhood>/<topic>/` to the topic-first form, which does not
resolve under `hugo server`.

The same page renders correctly on `feature-MOD-Lab-NR-recode-phase2` alone
(`typeof window.L === true`, four leaflet tags), so the merge causes it.

Confound ruled out: a static `hugo` build had been run in that worktree first,
which is the documented `resources/_gen` cache-poisoning hazard. `resources/` and
`docs/` were deleted and the smoke re-run server-only — still fails.

Two incidental findings on `feature-MOD-Lab-NR-recode-phase2` itself:
- The same `…/asthma_and_the_environment/bayside_little_neck` 404 request fires
  there too. Non-fatal, but something is already attempting the rewrite.
- `pageerror: PagefindUI is not defined` throws on nr-output report pages and is
  silently swallowed by the `pagefind` entry in the smoke allowlist. Dev-only
  (Pagefind isn't built by `hugo server`), but the allowlist means smoke will
  never report it.

**Also worth fixing in the harness:** the generic `Failed to load resource`
allowlist entry hides the *cause* of every blocked-script failure, leaving only
the downstream `X is not defined`. Both this investigation and an intermittent
cold-start failure (below) had to be diagnosed with a separate unfiltered probe.

---

### 5j. Smoke test fails intermittently on a cache-cold first run (added 2026-07-29)

The first `npm run smoke` against a completely cold `resources/_gen` failed on
`data-explorer/asthma/` with `L is not defined` and `DOMPurify is not defined`.
An immediate re-run with a warm cache passed, and the failure has not recurred.

**Hypothesis, untested:** on a cold cache the dev server builds fingerprinted
assets on demand, and a slow or 404ing library `<script>` leaves its global
undefined — with the underlying load failure swallowed by the allowlist (§5i).
Confirming it means wiping the Hugo cache, so it has not been verified; treat the
mechanism as unproven.

Deliberately **not** allowlisted. An intermittent real error in a merge gate
trains people to re-run until green, which is worse than a gate that is honestly
red.

---

### 5k. flexdatalist emits combobox ARIA with no combobox role, on three non-NR pages (P2, added 2026-08-11)

Split out of the Neighborhood Reports accessibility audit
(`documents/nr-accessibility-audit-2026-08-10.md`, F3 / C4), which fixed it on the NR
neighborhood picker and deliberately left the rest here rather than pull three unrelated
pages into an NR stage.

The library's `accessibility` function
(`node_modules/jquery-flexdatalist/jquery.flexdatalist.js:474-482`) puts `aria-autocomplete`,
`aria-owns` and a **static** `aria-expanded: 'false'` on the input it generates, and never
gives it `role="combobox"` or emits `aria-activedescendant`. Two consequences, and the second
is the worse one. axe reports `aria-allowed-attr` as critical, because `aria-expanded` is not
allowed on a plain textbox. And the attribute is not merely misplaced but false: with the
listbox open and three options showing, it still reads `"false"`
`[verified 2026-08-10 on the NR picker: results container visible with 3 options and
role="listbox", aria-expanded "false", aria-activedescendant absent]`. A screen reader is told
nothing opened. The string `aria-expanded` appears exactly once in the library — there is no
code path that updates it, and no option that makes it emit the role.

Three call sites still carry it:

| Page | Init |
|---|---|
| Data explorer text search | `themes/dohmh/layouts/partials/de-text-search.html:47` |
| Air Quality Explorer | `themes/dohmh/layouts/data-features/aqe.html` |
| Heat Vulnerability Index | `themes/dohmh/layouts/data-features/hvi.html` |

**The fix already exists and is a copy away.** `partials/nr-neighborhood-picker-js.html`'s
`wireComboboxState()` sets the role and syncs `aria-expanded` / `aria-activedescendant`. Two
things to carry across rather than rediscover. It reads state from the DOM through a
`MutationObserver`, not from the library's events, because only `results.remove()` fires
`removed:flexdatalist.results` (`:1633`) — the Escape key (`:2046`) and the outside-click
handler (`:2028`) both remove the container directly and fire nothing, so an event-driven sync
goes stale on the two most common ways to dismiss the list. And the generated `<li>`s carry
`role="option"` but no `id` (`:1551-1560`), so `aria-activedescendant` needs ids minted at
render time.

Not done here because each of the three needs its own browser verification. Factoring the helper
into a partial the four callers share is the obvious follow-up; it was left alone so the NR
fix could be verified in isolation first.

**Corrected 2026-08-11.** This paragraph originally added "and one of them (`de-text-search.html`)
is shared with a branch this tree does not own." That is wrong. The partial is included by
`themes/dohmh/layouts/data-explorer/indicator-catalog.html:33`, which
`content/data-explorer/indicator-catalog.md` routes to via `layout: indicator-catalog`, and
`/data-explorer/indicator-catalog/` serves 200 in this tree. It is testable here like the other
two. The claim was asserted from the partial's name without tracing its includes.

**All three were then confirmed by browser probe rather than left as inference**
`[verified 2026-08-11, local_prod on :8081]`. Each shows the generated input with `role: null`,
`aria-expanded: "false"`, `aria-owns` set; after one typed character, 100 options visible with
`aria-expanded` still `"false"`, no `id` on any `<li>` and no `aria-activedescendant`; after
Escape, the list still present with 100 options. Zero page errors on all three. One thing the
markup would not have told you: `aqe.html` and `hvi.html` contain **no** `.flexdatalist({…})` call
— they initialise through the library's auto-discovery at `:2085` — so there is no init function to
hang the fix on, unlike the other two call sites.

A seed brief for the PR, with the fix's non-obvious properties and the verification each page
needs, is in `documents/flexdatalist-accessibility-seed-2026-08-11.md`.

**A second defect in the same library, found while verifying the first, and unfixed on all
four call sites: Escape does not dismiss the list.** Two handlers fight over the key press. The
document-level `keydown` handler removes the results container on key 27 (`:2046`); the input's
`keyup` handler then calls `keypressSearch` (`:174-182`), whose guard
`key !== 13 && (key < 37 || key > 40)` is true for 27, so it schedules a fresh search on
`searchDelay` — default 400 (`:115, :251-259`) — which re-renders what the keydown removed.
Measured on the NR topic index before the fix: gone at +60ms, a *different* `<ul>` present and
112px tall at +660ms `[verified 2026-08-11: dev_stage on :8080 under Playwright, node identity
compared across the gap]`. Recorded as F18 in the NR audit.

**Fixed on the NR picker, still live here.** The library's search timeout is a closure variable
with no accessor, so it cannot be cancelled from outside — and blocking the Escape keyup does
not help either, since a timer armed by an earlier keystroke is still running and it is
`keypressSearch`'s own `clearTimeout` that would have cleared it. `wireComboboxState` therefore
holds the dismissal instead: it records the Escape and removes any list that reappears while
that holds, using the MutationObserver already running for the ARIA sync. The flag clears on the
next non-Escape keydown, on `mousedown`, `blur` and `focus`. Copy it across with the ARIA work —
it is a handful of lines in the same function, and it covers any reopen path rather than only
the 400ms timer.

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
- **Inherited typo `click_how_caclulated`** ("caclulated") — **resolved in the new
  explorer 2026-07-25**, still present in [old app.js:152](../assets/js/data-explorer-old/app.js).
  The new explorer's handler was bound to `#howCalcButton`, an element that exists
  in no new-explorer template, so the event had in fact **never fired** from the
  rewrite; the dead handler was deleted (`71d321226e`). The new explorer has no
  separate "how calculated" affordance at all — that text and the data sources
  share one pane behind a single `#v-pills-ds-tab` click that already fires
  `click_about` — so a second event there would double-count one action. The
  coverage is carried as a parameter instead (`94a0ac1fcf`):
  `trackDataExplorerEvent('click_about', { section: 'how_calculated_and_sources' })`.
  **Reporting consequence:** the new explorer's figures for this dimension are
  *not* continuous with the historical series, which lives under the misspelled
  name. Anyone comparing across the cutover needs to know that.
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
- **Dangling `aria-labelledby` leaves a dialog with no accessible name.** Three DE
  modals pointed at ids that existed nowhere (`#topicSelectorLabel`,
  `#indicatorSelectorLabel`, `#learnMoreLabel` — Bootstrap boilerplate whose title
  element had been replaced), so all three announced as bare "dialog". **Fixed
  2026-07-25** (`574e856432`); see DE audit §4.1-follow-up Finding C. Worth a
  site-wide sweep for the same pattern: a dangling reference fails **silently**,
  which is exactly why it survived. One line in a browser console finds them all —
  `[...document.querySelectorAll('[aria-labelledby]')].filter(el => el.getAttribute('aria-labelledby').split(/\s+/).some(id => !document.getElementById(id)))`.
- **Duplicate ids break `aria-labelledby` and `for` silently too** — a reference
  resolves to the first match, so the second element is orphaned. See §4a.
- `href="#"` action links (search/dropdown toggles) throughout the header —
  prefer `<button>` for actions.
- Google-Translate-as-i18n is itself a known a11y/SEO weakness (translated DOM
  isn't in the markup; `hreflang` only points at the few real translations).
- **Recommend** running `axe`/Lighthouse in CI against a sample of each template
  type (home, key-topic, data-story, data-feature, neighborhood-report, the
  explorer) so regressions are caught automatically — this is a legal-exposure
  area for a city agency (WCAG 2.1 AA / Section 508).

### 10a. The brand green clears AA as text only on pure white, and only just (added 2026-08-11)

`$primary` (`#008939`) is 4.53:1 on white, against the 4.5:1 threshold. That 0.03 is the whole
margin, and it is spent by any tint of the background at all. Measured against the backgrounds the
palette itself defines:

| Background | `$primary` #008939 | `$primary-dark` #007A31 |
|---|---|---|
| `#FFFFFF` | 4.53 | 5.49 |
| `$light-green` `#F8FCF7` | **4.37** | 5.29 |
| `#EFFAF4` (the `.btn-light-green-bg` fill) | **4.24** | 5.13 |
| `$gray-100` `#F5F5F5` | **4.15** | 5.03 |
| `$active` `#DCF4E7` | **3.91** | 4.74 |

`[verified 2026-08-11: sRGB relative-luminance formula; the #EFFAF4 and #F8FCF7 rows also
confirmed against `getComputedStyle` on live nodes under Playwright, which is where the two
Neighborhood Reports instances were found]`

**The fix is in the tree as of Stage A of the NR audit**: `$primary-dark: #007A31` in
[`assets/scss/_a-global-variables.scss`](../assets/scss/_a-global-variables.scss), the same green
darkened until it clears 4.5:1 on every background above except `$active`. It is for **text and
its inverse only** — `$primary` stays the brand colour for fills, borders and map geometry, so
nothing about the site's appearance at a glance changes. Two rules use it so far,
`.btn-report` and `.btn-light-green-bg`.

**What is not established:** which of the remaining rules actually fail. About twenty SCSS rules
set the green as text (`grep -rn "color: *\$primary\|color: *#008939" assets/scss/`), and their
backgrounds were **not** checked one by one — the ratios above make them candidates, not findings.
Two worth looking at first, because their names imply a tinted ground:
`$accordion-title-color: $primary` ([`_f-layout-elements.scss:774`](../assets/scss/_f-layout-elements.scss))
and the three hardcoded `#008939` rules in
[`__portal-custom.scss:201, 204, 1283`](../assets/scss/__portal-custom.scss).

Two cautions for whoever sweeps this, both learned by getting them wrong:

- **axe's violation count is a floor, not a census.** `color-contrast` lands in axe's
  `incomplete` bucket on every page of the NR audit — it defers nodes whose background it cannot
  resolve. The "See neighborhood list" toggle is the worked case: byte-identical markup from one
  shared partial, and axe reported it on the topic index but not on the landing page. It began
  reporting on both only after an unrelated Stage B change to the same pages, with the toggle's
  own colours untouched throughout `[verified 2026-08-11: three runs of
  `scripts/nr-a11y-audit.mjs`]`. Assert a contrast zero from computed colour, not from a rule
  count.
- **Reading `getComputedStyle` right after a hover measures the transition, not the hover state.**
  Bootstrap transitions `background-color` over .15s, so an immediate read returns the *resting*
  colour and a broken hover state looks fine. Wait ~500ms.

---

## 11. Concrete defects found (quick wins)

> **Row 1 is branch-scoped — checked 2026-08-05.** The RawGit point-in-polygon tag is gone
> on `production` and `feature-new-data-explorer`, and is **still live and unconditional at
> `head.html:220`** on `feature-MOD-Lab-NR-recode-refactor` and its whole lineage
> (`…-recode`, `…-phase2`, `…-merge-prod`, `trial-merge-de-into-nr`)
> `[verified: git show <branch>:themes/dohmh/layouts/partials/head.html | grep
> 'rawgit.com/hayeswise', across all 44 local branches]`. The fix was real; recording it as
> "FIXED" without naming the branch made it read as global. Anyone exercising
> rats-in-your-neighborhood on the NR lineage still hits a CDN that shut down in 2019.

> **Status of this table on `production`, checked 2026-08-12.** One sweep per row against
> this tree; each row is *open here* unless listed otherwise. The command run for each is
> given so it can be re-run.
>
> | Row | On `production` | Evidence |
> |---|---|---|
> | 1 (RawGit) | **not applicable** | `grep -c rawgit head.html` → 0 |
> | 2 (CI) | **open** | all 9 `uses:` are tag-pinned, not SHA-pinned; 5 of 6 workflows have no `permissions:` block (only `codeql.yml` does) |
> | 3 (`click_subscribe` twice) | **both call sites exist** | `main.js:14` (`gtag`) and `site.js:99` (`sendAnalyticsEvent`). Whether both fire on one click was *not* re-verified in a browser here |
> | 5 (CSS not minified) | **open** | `head.html:125` is `$sass \| toCSS \| resources.Fingerprint`, no `minify`. Note the branch record: minification was proposed and **rejected by the user** on 2026-07-14 |
> | 7 (duplicate `data-toggle`) | **open** | 3 lines in `header.html` carry the attribute twice |
> | 8 (title `<a>`/`<span>` overlap) | **open** | `header.html:78-79` — the `<a>` opens inside one `<span>` and closes inside the next |
> | 9 (`<a><li>`) | **open** | 6 occurrences in `header.html` |
> | 11 (GA in dev) | **not applicable — inverted here** | `head.html:3` gates GA on `prod_prod` *only*, so no dev environment fires the production property. The inversion this creates is **§14.4** |
> | 12 (`click_how_caclulated`) | **open** | 2 occurrences in `assets/js/data-explorer/app.js` — this tree's explorer, not `data-explorer-old/` |
> | 13, 14 (Datawrapper SVG sizing) | **did not reproduce** | `data-stories/housing/` ran clean under `npm run smoke` on 2026-08-12 with no allowlist entry for it |
> | 15 (robots.txt) | **open** | no `Sitemap:` directive in `themes/dohmh/layouts/robots.txt` |
> | 16 (`<html lang="en">`) | **open** | hardcoded in `baseof.html:2` and `list.html:2`; this tree has 14 translated pages (7 `.es`, 7 `.zh`) |
> | 18 (`#skip-header-target`) | **open** | the id appears in 48 layout files |
> | 21, 22, 23 (Dependabot) | **subjects present** | `georaster ^1.6.0`, `hugo-extended ^0.146.3`, `vega ^5.30.0` in `package.json`. Alert *state* not re-checked |
> | 17, 19, 20 | **not applicable** | each cites a partial this tree does not have (`de-indicator-info.html`, `header-de.html`) |
>
> Also relevant: §5c's `rats-in-your-neighborhood` `area.contains` error **did not reproduce**
> here — that page ran clean under the same smoke run, with no allowlist entry.

| # | Severity | Where | Issue |
|---|---|---|---|
| 1 | ~~P1~~ **FIXED 2026-07-14 — but only on some branches; see note below** | `head.html` | Point-in-polygon loaded from shut-down `cdn.rawgit.com`; tag deleted in DE-audit Tier 1.6. The breakage it was masking, and three surviving RawGit OpenLayers tags, moved to **§5c** |
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
| 12 | P3 | [data-explorer-old/app.js:152](../assets/js/data-explorer-old/app.js) | Misspelled GA event `click_how_caclulated` — **new explorer resolved 2026-07-25**; its handler was bound to a non-existent element and had never fired, and the coverage is now a `click_about` parameter. Old explorer still has it (see §9) |
| 13 | P3 | `content/data-stories/{housing,redlining,air-quality-snapshots,vectorborne-diseases-and-health}` | ~~Datawrapper embeds in hidden Bootstrap tabs throw SVG-sizing console errors on load~~ — fixed 2026-07-16, see §5b |
| 14 | P3 | `content/data-stories/housing/index.es.md` (income-level radio toggle) | Same `display:none`-render-timing issue, different trigger (radio `onclick`, not tabs) and severity (warning, not error) — not fixed, see §5b |
| 15 | ~~P3~~ **FIXED 2026-08-08** | [robots.txt](../themes/dohmh/layouts/robots.txt) | Production `robots.txt` had no body — no `Sitemap:` directive. NR retirement Stage G added it, plus an explicit allow-all and the dated crawler decision. See §12 |
| 16 | P2 | [baseof.html:2](../themes/dohmh/layouts/_default/baseof.html) + [list.html:2](../themes/dohmh/layouts/_default/list.html) | `<html lang="en">` hardcoded — wrong on all 14 translated (`.es`/`.zh`) pages, see §12 |
| 17 | P1 | [de-indicator-info.html](../themes/dohmh/layouts/partials/de-indicator-info.html) | Data Explorer's real content is 100% client-rendered — invisible to non-JS (i.e. most AI) crawlers, see §12 |
| 18 | ~~P2~~ **FIXED 2026-07-25** | [baseof.html:24](../themes/dohmh/layouts/_default/baseof.html) + 44 templates | ~~`#skip-header-target` duplicated on most pages — the keyboard-skip target, so a11y-relevant~~ — id dropped from 44 templates (not ~20), and `tabindex="-1"` added to the `<main>` in `baseof.html`/`list.html` so the skip link actually moves focus. `data-explorer-old/` keeps its copies until §1. See §4a |
| 19 | ~~P2~~ **FIXED 2026-07-25** | `header-de.html` + `de-tab-button.html` | Every explorer page rendered two `#dropdownMenuButton` (desktop + mobile Take Action) and two `#311`/`#311label`. Renamed in the DE-only partials; `takeaction.html` keeps the old ids until the old tree is deleted. See §4a and DE audit §4.1-follow-up |
| 20 | ~~P2~~ **FIXED 2026-07-25** | [header-de.html:291,358,402](../themes/dohmh/layouts/partials/header-de.html) | Three DE modals had dangling `aria-labelledby` → no accessible name, including the dataset picker. See §10 |
| 21 | P2 | `package.json` (`georaster@1.6.0` subtree) | 4 of the 8 open Dependabot alerts share one root — cheapest fix of the three groups in §3a |
| 22 | P3 | `package.json` (`hugo-extended`) | Critical-rated `decompress` alert, but CI pins Hugo via the setup action and never uses this package — dismiss with a reason, or drop the dep. See §3a |
| 23 | P2 (scheduled, not urgent) | [lib-vega.html](../themes/dohmh/layouts/partials/lib-vega.html) | 3 high Vega XSS alerts ship to browsers, but no exploitation path exists in this codebase. Fix needs semver-major bumps across 4 chart modules — own PR, characterization-gated. See §3a |

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

  **FIXED 2026-08-08** (NR retirement Stage G). Production now emits an explicit
  `User-agent: * / Disallow:` and `Sitemap: https://a816-dohbesp.nyc.gov/IndicatorPublic/sitemap.xml`,
  which resolves to the `sitemapindex` listing the en/es/zh sitemaps — 723 `<loc>` entries in
  the English one `[verified 2026-08-08: --environment production build]`. **"Unconditional on
  environment" was the wrong instruction**: the preview branch `Disallow`s page paths one at a
  time and `/sitemap.xml` is not among them, so a `Sitemap:` line there would have advertised
  the URL list that branch exists to withhold. Preview builds carry a comment saying so instead.
  Sourced, being a claim about crawlers: Google's robots.txt spec says the sitemap field "isn't
  tied to any specific user agent and may be followed by all crawlers, provided it isn't
  disallowed for crawling" `[fetched 2026-08-08]`.
- **No explicit stance on AI-training crawlers (P3 — a policy decision, not a defect).** Zero
  mentions anywhere in the repo of `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`,
  `PerplexityBot`, `Applebot-Extended`, `Bytespider`, etc. The effective policy today is "allow
  everyone, by omission" — for a city agency publishing public health data, maximum reach plausibly
  *is* the right call, but it's worth an affirmative decision (and a comment recording it) rather
  than an accidental default. No `llms.txt` either; that convention is still informal and
  unstandardized industry-wide, so treat it as optional, not a gap.

  > **DECIDED 2026-08-05 — allow all crawlers, affirmatively.** Rationale, recorded so it
  > is not re-litigated: people use chatbots to ask questions the Department has data for,
  > so being crawled is a public service independent of how anyone feels about the use case.
  > The decision needs writing into the repo to be worth anything — a comment in
  > `themes/dohmh/layouts/robots.txt` naming it and its date is what distinguishes "allow
  > everyone deliberately" from the omission described above. Folded into the NR work's
  > staging alongside the `Sitemap:` fix, since both edit the same file: see
  > [`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md)
  > §10.3 and §11.
  >
  > **WRITTEN IN 2026-08-08** — the comment and the rationale above are now in the production
  > branch of [robots.txt](../themes/dohmh/layouts/robots.txt), stated in full rather than as a
  > pointer here, so the file answers the question without the reader finding this document.
  > Still no stance on individual AI crawlers by name, which the decision makes unnecessary:
  > allowing everyone needs no per-agent list. No `llms.txt`, as this finding advised.

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
   ~~add Dependabot~~ **Dependabot is already enabled** — 8 open alerts, triaged in
   §3a (2026-07-25). The remaining work is acting on them, not enabling scanning.
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

---

## 14. Findings first observed on `production` (added 2026-08-12)

Everything in this section was checked against this tree, on the branch
`feature-add-project-claude-md` (identical to `production` at the time). Each entry names
the command or observation behind it.

### 14.1 The same element carries two `class` attributes; the second is discarded (P3)

`<a class="text-black" href="…" class="text-primary">` appears in 10+ templates —
`about/section.html:26`, `components.html:43,85`, `data-features/section.html:39,77`,
`data-stories/section.html:43,106,130,154,178` — and, until 2026-08-12, in two of
`readme-components.md`'s copy-paste examples.

HTML parsers keep the first occurrence of an attribute and drop the rest, so `text-primary`
never applies. Confirmed in the browser rather than inferred: on `data-stories/`, the parsed
anchor's `outerHTML` retains only `class="text-black"` and computes `rgb(0, 0, 0)`, while a
genuine `.text-primary` anchor on the same page computes `rgb(0, 137, 57)`
`[verified 2026-08-12: Playwright, `getComputedStyle` on both, the second serving as the
control that the probe can tell the two apart]`.

Black is presumably what was wanted, so nothing renders wrongly today — the cost is a dead
attribute that reads as live styling, propagated by copy-paste. Fix: delete whichever of the
two is not intended. The readme's copies are already fixed.

### 14.2 Card images on the home page have no `alt` attribute (P2, a11y)

The four section cards at `index.html:175, 193, 212, 233` render
`<img class="card-img-top" src="…">` with no `alt`. Each sits inside an `<a>` whose only
other child is a positioned overlay `<div>`, so the link has no text node either: the
accessible name of that link falls back to the image filename or is empty, depending on the
screen reader. `readme-components.md` documents the same markup, so the pattern reproduces
whenever someone follows the components guide.

Fix is a judgement call, not a mechanical one: `alt=""` is correct only if the *link* gets
its name another way, which here it does not. Naming the destination (`alt="Data Explorer"`)
resolves both at once.

### 14.3 `.card-content.key-topics` and `.tab-key-topics` are defined and unused (P3)

`theme.scss:386` defines `.card-content.key-topics` with `border-bottom: 8px solid $primary`
— rule-for-rule identical to `.card-content.primary` at `theme.scss:392`. Zero layouts use
it; Key Topics cards use `.primary` (`index.html:63`). `.tab-key-topics` is likewise defined
in SCSS and used by no layout, while its four sibling `tab-*` classes have two uses each
`[verified 2026-08-12: per-class counts across assets/scss, themes/dohmh/layouts, and content]`.

Deleting both is safe. Note that `readme-components.md` omits `.key-topics` from its list of
section-card classes, which is the correct advice for the current markup.

### 14.4 The documented production build command is not the one that ships (P1)

`readme-development.md` and `CLAUDE.md` both document building with
`hugo --environment production`. The GitHub Actions workflow that produces the live site runs
`hugo --environment prod_prod` (`hugo-build-to-prod-prod.yml:112`).

`config/production/config.toml` and `config/prod_prod/config.toml` are byte-identical, so this
looks harmless. It is not, because `head.html:3` branches on the environment *name*:

```
{{ if eq hugo.Environment "prod_prod" }}   → production GA property, no robots meta
{{ else }}                                  → <meta name="robots" content="noindex, nofollow">
                                              + the dev GA property (G-PB98MPZ31B)
```

So a build made with the documented command produces a complete site that tells every crawler
not to index it and reports to the development analytics property. Confirmed on build output
rather than read off the template: a bare `hugo` — which is what `readme-development.md`'s
"To build the source code, simply enter the command `hugo`" produces — reports
`build_environment: production` and emits both `noindex, nofollow` and
`gtag/js?id=G-PB98MPZ31B` on the home page. A `--environment development` build does the same
`[verified 2026-08-12: two full builds into temp directories, grep of each generated
index.html]`.

The live site is unaffected — the workflow uses `prod_prod`. What's affected is anyone
building locally from the documented instructions and inspecting or deploying that output.
Two candidate fixes: gate on a config param rather than the environment name, or collapse the
duplicate environment. Both need a decision about which name is canonical.

Related and lower-value: `partials/conditional-modal.html` branches on
`hugo.Environment "production"`, `"development"`, and `"data_staging"`. No template includes
this partial, and `config/` has no `data_staging` directory, so all three branches are dead.
