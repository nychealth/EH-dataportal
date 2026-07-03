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
  compiles to unminified CSS in production. Add `| minify` (or
  `toCSS (dict "outputStyle" "compressed")`).
- **Duplicate resources:** the favicon `<link>` is emitted twice
  ([:49](../themes/dohmh/layouts/partials/head.html), [:105](../themes/dohmh/layouts/partials/head.html));
  the nyc-lib CSS is loaded conditionally behind `.Params.mapLib`
  ([:90-94](../themes/dohmh/layouts/partials/head.html)) *and again
  unconditionally* ([:129-131](../themes/dohmh/layouts/partials/head.html)) — so
  every page pulls two external nyc.gov stylesheets whether it has a map or not.
- **Dead Hugo loop:** [head.html:121-127](../themes/dohmh/layouts/partials/head.html)
  ranges FA webfonts into `$woff_got` and never uses it.
- **Inline JS in 66 of 136 layouts.** Behavioral JavaScript lives inside
  templates (e.g. ~240 lines in `de-tab-content.html`, plus the data-features
  pages). It can't be linted, fingerprinted/cached, unit-tested, or covered by a
  strict CSP. This is the structural reason the site can't tighten its
  Content-Security-Policy.

> **Refactor:** (1) bundle the data-viz libraries with `resources.Concat` (the
> file already does this for Vega/DataTables — extend it) and load the bundle
> `defer`; (2) only load Leaflet/Vega/DataTables on pages that use them (most are
> already gated, but jQuery/FA are global); (3) minify CSS; (4) de-dupe favicon +
> nyc-lib; (5) move inline `<script>` blocks into fingerprinted files under
> `assets/js/`.

---

## 3. Dependency & supply-chain hygiene (P1/P2)

- **Dead CDN dependency — rawgit.** [head.html:230](../themes/dohmh/layouts/partials/head.html)
  loads Leaflet point-in-polygon from `https://cdn.rawgit.com/...`. **RawGit was
  shut down in October 2019**; this request almost certainly fails. The same
  capability is already a local dependency (`@mapbox/leaflet-pip` in
  package.json). **Replace with the node_modules copy** (and add SRI). *(P1 —
  verify in the network tab; if a feature relies on PIP it's silently broken.)*
- **External scripts without SRI.** rawgit (above) and Google Translate
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
  `geography.js`.)
- **Legacy `assets/js/data-explorer-old/`** (~6,560 lines) — the cutover retired
  it but it is still built and reachable at `/data-explorer-old/`. Dead weight;
  delete with the rest of the old tree (§1).

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

`package.json` has **no `scripts` block at all** — no `build`, `dev`, `lint`,
`format`, or `test`. There is no linting (ESLint/Stylelint), no formatting
(Prettier), and no tests anywhere in the repo. For ~25K lines of JS this is the
highest-leverage gap: a single `eslint` pass would have caught most of the
concrete bugs in the DE audit (the `ReferenceError`, the dead `v-pills-trend`
id, the operator-precedence percentile bug, duplicate object keys).

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
   consolidated docs' "#30 guard analytics" recommendation, done — and after the
   2026-06-27 cutover this **is now the live explorer**, so production DE
   analytics finally runs through a guarded wrapper.
3. **Raw `gtag('event', …)`** — scattered and unguarded: [main.js:14](../assets/js/main.js);
   the **now-retired old explorer** (still reachable at `/data-explorer-old/`)
   ([data-explorer-old/app.js:106-302](../assets/js/data-explorer-old/app.js),
   [measures.js](../assets/js/data-explorer-old/measures.js) ×8,
   [print.js:60](../assets/js/data-explorer-old/print.js)); and four templates
   ([nr-indicator-old.html:274](../themes/dohmh/layouts/partials/nr-indicator-old.html),
   [nr-indicator-new.html:311](../themes/dohmh/layouts/partials/nr-indicator-new.html),
   [search-modal.html:33](../themes/dohmh/layouts/partials/search-modal.html),
   [nr-output/single.html:533](../themes/dohmh/layouts/nr-output/single.html)).

> Net effect after the cutover: production DE analytics now flows through the
> SPA's guarded wrapper, but the picture is still fragmented — `main.js`, the
> retired old explorer, and four inline templates call `gtag` raw, and there are
> two separate guarded wrappers (`sendAnalyticsEvent` and
> `trackDataExplorerEvent`). **Recommend one shared `track(name, params)` helper**
> (promote `sendAnalyticsEvent` to a tiny module) used everywhere, and delete the
> per-area variants — including the old explorer's raw calls when its tree is
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
| 1 | P1 | [head.html:230](../themes/dohmh/layouts/partials/head.html) | Point-in-polygon loaded from shut-down `cdn.rawgit.com`; use local `@mapbox/leaflet-pip` + SRI |
| 2 | P1 | CI workflows | Unpinned actions + no `permissions:` block (your own CLAUDE.md rules) |
| 3 | P2 | [main.js:110](../assets/js/main.js) + [site.js:94](../assets/js/site.js) | `click_subscribe` analytics fires twice |
| 4 | P2 | [head.html:116](../themes/dohmh/layouts/partials/head.html) | Font Awesome shipped as render-blocking JS *and* CSS; drop the JS |
| 5 | P2 | [head.html:137](../themes/dohmh/layouts/partials/head.html) | Production CSS not minified |
| 6 | P2 | [head.html:90-131](../themes/dohmh/layouts/partials/head.html) | nyc-lib CSS loaded twice on every page; favicon `<link>` duplicated |
| 7 | P3 | [header.html:188,244,347](../themes/dohmh/layouts/partials/header.html) | Duplicate `data-toggle` attribute (second ignored) |
| 8 | P3 | [header.html:77-80](../themes/dohmh/layouts/partials/header.html) | Overlapping `<a>`/`<span>` nesting in site title |
| 9 | P3 | [header.html:107…](../themes/dohmh/layouts/partials/header.html) | `<a><li></li></a>` invalid list markup |
| 10 | P3 | [head.html:121-127](../themes/dohmh/layouts/partials/head.html) | Dead webfont `range` loop |
| 11 | P2 | [head.html:3-37](../themes/dohmh/layouts/partials/head.html) | GA fires in dev/local environments (incl. `hugo server`) → dev property polluted by developer/CI traffic |
| 12 | P3 | [data-explorer-old/app.js:152](../assets/js/data-explorer-old/app.js) + live [data-explorer/app.js:446](../assets/js/data-explorer/app.js) | Misspelled GA event `click_how_caclulated` in both explorers, incl. the live one (see §9) |

---

## 12. Suggested roadmap

**Phase 0 — guardrails (do first; cheap, prevents regressions).**
1. Add `package.json` scripts: `lint` (ESLint), `format` (Prettier), `build`/`dev`
   (Hugo). Wire ESLint + a Hugo build into a PR check workflow.
2. Add `.gitattributes` LF rules; delete the `dos2unix` build step.
3. Pin CI actions to SHAs; add `permissions:` blocks; switch to `npm ci` + cache;
   add Dependabot.
4. Decide a testing strategy (ad-hoc `node:test` scripts vs. adopting a
   framework like Vitest) — unresolved as of 2026-07-02, see §7.

**Phase 1 — quick wins (the §11 table).** rawgit → local PIP; drop FA JS; minify
CSS; de-dupe favicon/nyc-lib; fix the header markup bugs; gate GA out of
dev/local and fix the double-fire + `click_how_caclulated` typo (§9).

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
