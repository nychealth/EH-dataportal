<!-- docs-check source-roots: assets/js/data-explorer assets/js/nr-report themes/dohmh/layouts scripts -->
<!-- docs-check verified: 84cf36b5bf 2026-08-15 -->
<!-- docs-check ignore: maxAge ignoreFiles -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NYC Department of Health & Mental Hygiene's [Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/) — a Hugo static site providing public access to environmental and health indicators through data stories, an interactive data explorer, neighborhood reports, and topic pages.

Most indicator data lives in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository (not this repo). Site code fetches it at build time via `data_branch` config variable and at runtime via `data_repo` param in Hugo templates/JS.

## Commands

```bash
# Install JS dependencies (includes hugo-extended)
npm install

# Local development (uses production data branch)
hugo serve --environment development

# Local dev with staging data
hugo serve --environment dev_stage

# Build to docs/ for production
hugo --environment production

# Create new content
hugo new data-stories/TITLE/index.md
hugo new key-topics/TITLE/index.md
```

A dev server prints its own URL on startup — read it rather than assuming. The path prefix is the
environment's `baseURL` path, so `development` serves under `/dev-prod/` and `dev_stage` under
`/dev-stage/`. No environment serves under `/EH-dataportal/`
`[verified 2026-08-07: baseURL across all eight config/ directories]`.

## Guardrails

Seven npm scripts, run from the repo root:

- `npm run lint` — ESLint (`no-undef`) over `assets/js/data-explorer/` and `assets/js/nr-report/`. `eslint.config.mjs` has one block per target. Both are directories of classic scripts sharing one global scope, so each block derives its shared globals at config-load time by scanning its own directory via `scanDeclaredGlobals(dir)`; `no-undef` catches the undefined-name typos that scope is most prone to. `no-unused-vars` is intentionally omitted — it false-positives on the cross-file global pattern. Names injected from outside a directory (libraries, and the inline `<script>` blocks in `themes/dohmh/layouts/data-explorer/single.html`) are listed per block in `DE_EXTERNAL_GLOBALS` / `NR_EXTERNAL_GLOBALS`. **Adding a file to `eslint.config.mjs` does not put it in scope**; the `lint` script's argument list is what selects files, and the two must be changed together. A green run proves nothing by itself — the check that the directory scan actually loaded is a *positive* control: call a name declared in another file of the same directory and confirm lint still passes.
- `npm run smoke` — loads one page per template kind and fails on any non-allowlisted console `error`/`pageerror` (`scripts/smoke-pages.mjs`). Run before any merge that touches a shared template like `head.html`. Before relying on it as the proof for a change that only executes on one page kind, confirm that page is in `PAGES` — those comments are claims that rot like doc prose. Two caveats: the generic `Failed to load resource` allowlist entry hides the *cause* of blocked-script failures, leaving only a downstream `X is not defined`, so diagnose those with a separate unfiltered probe; and a cache-cold first run has been seen to fail spuriously (site-wide audit §5j).
- `npm run docs-check` — verifies that docs claiming to describe *current* code still name real paths and real identifiers (`scripts/docs-check.mjs`). **Opt-in**: a doc is checked only if it declares a `docs-check source-roots` comment in its first lines. Audits and dated findings must **not** opt in — they cite old names on purpose. Run it after any rename; it is the cheapest thing that catches doc rot at the commit that causes it. It scans every `.md` in `documents/` plus the root docs in `ROOT_DOCS` — **this file is one of them**, so a path or identifier written here must be real and repo-root-relative. Site URLs, globs, and placeholder patterns are skipped. **It cannot check prose — that is what the `docs-check verified: <commit> <date>` stamp is for, and the check fails a doc that opts in without one. If you change behaviour described here, update the prose and re-stamp.** The stamp asserts a human re-read the prose against the tree at that commit, so bumping it without doing that is a false claim, not bookkeeping.
- `npm run characterize:nr` — Playwright characterization harness for the Neighborhood Reports report page (`scripts/nr-characterization.mjs`). Captures rendered output — neighborhood header, demographics, ZIP list, accordion ids, chart count, **and the final URL** — for three topic/neighborhood pairs, and diffs them against a baseline. `-- --check` to verify, `-- --baseline` to re-capture. **`--baseline` cannot fail** — it records whatever it finds, including three empty pages if a template change stopped the report page rendering. Only `--check` can tell you, so read its diff before re-baselining, never instead. It navigates straight to the real `<nbhd>/<topic>/` page, so it exercises the path the site actually serves; the Leaflet map is deliberately not clicked, which would make it a test of map hit-detection. **Baselines are filed per EHDP-data branch** — `scripts/nr-characterization-baseline/staging/` and `scripts/nr-characterization-baseline/production/` — because the branches render different reports: staging carries two accordion ids production does not on the asthma topic, 46 against 44 `[verified 2026-08-11: diff of the two baselines]`. The harness reads the served `data_branch` off the page and files under it, so environments sharing a branch share a baseline — and since 2026-08-15 the data branch is the *whole* condition: `staging` covers `dev_stage`, `local_stage` and `prod_stage`; `production` covers `dev_prod`, `development`, `local_prod`, `prod_prod` and `production`. An unreadable branch aborts; a branch with no baseline is named in the refusal rather than checked against another's. The captured final URL is the guard against a silent redirect to the 404 page, and it is now recorded **prefix-relative** — `stripBasePath` removes the server's baseURL path, so `/IndicatorPublic/…` and `/dev-stage/…` record the same value and a check runs from any environment on the branch. Before that it carried the raw `window.location.pathname`, and a same-branch cross-environment check failed every target on that field alone; if you meet that failure in an older record, it is the fixed bug, not a regression. The strip is anchored to the *start* of the path, so a redirect still shows as a diff `[verified 2026-08-15: prod_stage against the dev_stage-captured staging baseline — 3 of 3 targets failing on `finalURL` before, 3 of 3 passing after, with the redirect and 404 shapes still differing]`. `documents/nr-characterization-environment-options-2026-08-11.md` records why the environment *spawner* (its Option 2) was left unbuilt. Run it before any merge touching the NR templates or `assets/js/nr-report/`. It expands the first accordion panel per target so the lazy Vega path runs, and records the renderer (`hasCanvas`/`hasSvg`) plus a painted flag per mark group — structural facts only, since mark *counts* track EHDP-data row counts and would churn the baseline on every data refresh. It also captures each chart's accessible name and its export-menu label (`chartName`, `actionsLabel`), read off the node carrying `role="graphics-document"` — **not** off `.vega-embed`, which has no `aria-label` and whose empty capture left chart naming uncovered until 2026-08-11.
- `npm run a11y:nr` — accessibility audit of the four Neighborhood Reports page kinds (`scripts/nr-a11y-audit.mjs`), axe-core under Playwright, plus probes for what no axe rule implements: a full tab-order sweep recording focus indicators and `aria-hidden` ancestors, heading order read from the accessibility tree rather than the DOM, id/ARIA-reference integrity, a before/after capture around a Leaflet re-render, chart naming, and computed colour on the comparison vocabulary. It scans the report page in four states — at rest, one panel expanded, all expanded, and print-emulated — because the chart and the print rendition do not exist in the others. **It is an audit instrument, not a gate**: it exits non-zero only when a *control* fails, never on findings. Two controls make its numbers mean anything, and both are the reason a zero here is not self-certifying. The **positive control** injects an `<img>` with no `alt` and asserts `image-alt` fires, because a scan where axe never loaded reports the same zero as a clean page. The **rendered-content control** requires a per-page selector to match first: the report page's cards come from the data repo, and against an empty one it renders five empty accordion shells that axe will honestly call almost clean. Set `DE_BASE_URL` to choose the server and `A11Y_OUT` to choose where the per-page JSON lands (default is a temp directory). Findings as of 2026-08-10 are triaged in `documents/nr-accessibility-audit-2026-08-10.md`, which also records which source-read candidates the browser disconfirmed. **Read `wcag.incompleteIds` in the per-page JSON, not only `wcag.violations`.** axe defers nodes whose background it cannot resolve, and `color-contrast` sits in that bucket on all four pages — so a zero in the violations list for that rule is a floor, not a census. The worked case: one shared partial's button, reported on the topic index but not the landing page, then on both after an unrelated change with its colours untouched.
- `npm run characterize:pagefind` — characterization harness for the **search index**
  (`scripts/pagefind-characterization.mjs`). Nothing else in this repo can see search: Pagefind is
  a post-build step, so `hugo server` produces no index at all — which is why `PagefindUI is not
  defined` is allowlisted dev-only noise in `nr-characterization.mjs`. A template change that
  silently adds or removes indexed text is invisible to `lint`, `smoke` and both other harnesses.
  It **builds the site itself** into a temp directory with `HUGO_RESOURCEDIR` pointed there too —
  the one form that cannot reach `resources/_gen`, so it is safe beside a running dev server —
  then runs Pagefind over that build, records every indexed page (`word_count`, `meta.title`,
  filters, anchor ids, a content hash and its opening words) plus a fixed query set run through
  Pagefind's JS API in Chromium, and diffs against a baseline. It reads `docs/` for nothing:
  `docs/` holds whatever was last built, and a check against a stale index passes for the wrong
  reason. `--against <built-site-dir>` diffs against another worktree's `docs/` instead of a
  baseline, which is the cross-branch comparison. **Both the fragment record and the query set are
  needed, not either alone** — production's fragment for a neighborhood index holds only its ZIP
  codes, which reads as "not findable by name", but Pagefind searches `meta.title` too and the
  query returns it first. Baselines are filed per EHDP-data branch, read from the merged Hugo
  config rather than off a page, and the baseURL path prefix is normalized out of every recorded
  value — so `local_prod`, `dev_prod` and `prod_prod` all check against `production.json`.
  `characterize:nr` closed the same gap on 2026-08-15 and now normalizes its one path field the
  same way, though it reads the prefix off the live server rather than the merged config.
  **Unlike `characterize:nr`, `--baseline`
  here can fail**: it runs both controls first and refuses to write when they fail. The
  rendered-content control puts a word floor under one page of nine template kinds; the query
  control asserts a real term returns many results and a nonsense term few. That negative control
  is a *ceiling*, not `=== 0`, because Pagefind matches fuzzily — `zzqqxxwv` returns `/about/`
  `[verified 2026-08-15: five nonsense tokens, only one returned 0]`. A control may also be
  **inverted** (`absent: true`), asserting a page is deliberately *not* indexed; the NR report page
  is the case, so removing its page-level ignore fails a control instead of reading as a diff to
  re-baseline. Run it before any merge touching a shared partial, `head.html`, `baseof.html`, or an
  NR template.
- `npm run characterize:de` — the equivalent harness for the data explorer (`scripts/de-characterization.mjs`). **Currently non-functional on this branch**: it was written against the `feature-new-data-explorer` explorer and waits on DOM this branch never produces. Migrated for parity, not usable here; no baseline is committed. Do not treat a failure from it as a regression signal.

`smoke` and the characterization harness **reuse a running dev server, start one if none is running, and never stop a server they didn't start** (via `scripts/dev-server.mjs`). **The server it starts is `--environment dev_stage`, i.e. staging data.** That is invisible until a check compares against something captured from `production` — see `nr-postswap-check.mjs` below, where it read as 210 content regressions. Import `ensureDevServer()` directly for one-off browser checks: **starting a server when none is running needs no permission.** The "ask first" caution is about a server *you didn't start*. Set `DE_BASE_URL` to point them at a server on a non-default port/environment; it is checked first and suppresses probing entirely, which is what lets it get past the abort below. If a `hugo` process is running but they can't find it on :8080/:1313, they abort with instructions rather than start a second server — a second server poisons the running one's fingerprint cache.

**Check whether a server is actually running before planning around one.** A process list is a point-in-time observation, and a server someone else started can exit between the check and the run — at which point the harness's own spawn path gives you a `dev_stage` server on :8080, matching the baseline prefix, with no workaround needed. Reach for the isolated-build route only once you have confirmed a server you must not disturb is holding the port.

- **Stopping a background task may orphan the server** — the wrapper is the tracked process, so `hugo.exe` can keep :8080. Check the port after stopping, and identify a running server by its command line before assuming it isn't yours.

**Never run two Hugo builders against this tree at once** — a static rebuild beside a running server, or two servers on different ports, even against different `--environment`s. All of them share the same on-disk resource-fingerprint cache (`resources/_gen/`), which isn't environment-namespaced — one can poison another's cache with the wrong environment's asset paths, breaking every page on the live server with MIME-type-refused/404 errors until it's restarted. To verify a static build while someone's dev server is live, inspect the generated `docs/` HTML directly instead of hitting the live server; if you need the live server itself to reflect a change, ask before restarting a process you didn't start.

Two builders is the hazard, not the static build specifically. `scripts/dev-server.mjs` only guards the ports it probes, so a server started outside it slips past. The tell is every fingerprinted asset 404ing under the *other* environment's prefix — the page dies with `$ is not defined` and reads as a broken code change, so check the served asset URLs before suspecting your diff.

**The exception:** a build with `HUGO_RESOURCEDIR` and `-d` pointed at temp directories cannot
reach `resources/_gen` at all, so it is safe beside a running server — the command, the proof and
the one caveat are in the `project-isolated-hugo-build` memory.

## Root-cause claims

A claim about runtime behavior — CSS, DOM, layout, timing, browser APIs — must cite an observation from a running browser, not reasoning about the source. This applies at **any change size**: a one-property CSS fix needs it as much as a template-wide refactor, and to **more than diagnosis** — describing what a class does when presenting an option is the same assertion with the same failure mode. `.comp-*` was described as colouring its text, from the class name alone, when its only rules set a `::before` emoji. Plausibility is not evidence, and a well-written explanation is not a verified one.

- **State the disconfirming test you ran and what it showed**, before proposing the fix. "I hid the child element and the ring rendered correctly" is evidence. "Outlines don't follow asymmetric border-radius" is a guess.
- **If a nearby working example contradicts your theory, the theory is wrong.** Do not add a secondary explanation for why the working case is exempt — that is how a wrong diagnosis survives review.
- **Mark unverified reasoning as unverified.** If a fix ships on a hypothesis you could not test, write `// HYPOTHESIS (unverified):` rather than stating the cause as fact. A confident wrong comment misleads every later attempt; the next person re-tests a hypothesis but trusts an explanation.
- **After one failed fix attempt, stop and gather runtime evidence** instead of trying a second theory. Two speculative fixes in a row means the premise is wrong, not the implementation.
- **Rule out your own confounds before reporting a cause.** If you ran a static build in the same tree as the server you are testing, or the cache was cold, that is a candidate explanation you introduced — eliminate it, and say that you did.
- **If a refactor is justified partly by bug claims, prove them in a no-code stage first.** Reproduce each in the browser before touching anything, and drop any that doesn't reproduce rather than fixing a phantom.

Worked example: `documents/data-explorer-fresh-audit-2026-07-13.md` §4.9 — a focus-ring bug that survived two fixes because the diagnosis was plausible, confidently written, and false; the actual cause took one browser experiment to find.

## Architecture

### Hugo structure

- `content/` — Markdown content files with YAML frontmatter
- `themes/dohmh/layouts/` — Hugo templates (mirrors `content/` structure). There is **no** root layouts directory — a path written that way will not resolve.
- `themes/dohmh/layouts/_default/baseof.html` — Root template: head, header, main, footer, JS
- `themes/dohmh/layouts/partials/` — Reusable template blocks
- `themes/dohmh/layouts/shortcodes/` — Shortcodes callable from markdown content
- `assets/` — SCSS, JS, images (processed by Hugo with SRI fingerprinting)
- `static/` — Unprocessed files served as-is
- `data/globals/` — YAML/JSON data accessible throughout templates: featured data, SEO vars, and the three Neighborhood Reports sources — `data/globals/uhflist.json`, `data/globals/NR_topics.yml` and `data/globals/NR_content`
- `documents/` — Internal audits and technical write-ups
- `scripts/` — Node dev tooling (smoke test, docs-check, dev-server helper, the three characterization harnesses, the accessibility audit, and the NR pre-capture/post-swap pair)
- `docs/` — Generated output; never edit directly

### Layout routing

- `_index.md` → `section.html` (section landing pages)
- `index.md` or `name.md` → `single.html`
- Frontmatter `layout: custom` → `custom.html` in the section's layouts folder
- Frontmatter `type: X` routes to the `X` layouts folder; `layout: X` selects `X.html` within the section's own layouts folder, which is how all three Neighborhood Reports page kinds are routed
- A `_content.gotmpl` in a content directory is a **content adapter** — it generates pages at build time. `content/neighborhood-reports/` has one

### JS architecture

JS files under `assets/js/` are fingerprinted and served with Subresource Integrity. Dependencies from `node_modules` are mounted into `assets/node_modules` via Hugo module mounts — they are bundled locally, not loaded from CDNs.

### Data explorer

`assets/js/data-explorer/` is a vanilla-JS app of 10 files loaded as classic `<script>` tags sharing one global scope. **Load order is critical** and is set in `themes/dohmh/layouts/data-explorer/single.html`:

`global → data → measures → table → map → links → disparities → trend → app → print`

- `global.js` declares the shared top-level state. Add new cross-file state there rather than assigning an undeclared name — an implicit global works at runtime but defeats `npm run lint`, which is what proves renames complete.
- Data flow: indicator metadata → Arquero table → `joinData` → `renderMeasures` → the `show` renderers (`showMap`, `showTable`, `showTrend`, …).
- `single.html` also defines `renderIndicatorDropdown`, `renderIndicatorButtons`, and `createCitation` in inline `<script>` blocks, because they read template markup Hugo has to render. They are called from `data.js`, which works because classic scripts share one top-level scope.
- `renderLinksChart` (`links.js`) and `renderTrendChart` (`trend.js`) are each a single function spanning nearly their whole file.

Key gotchas:
- `isDataTable` is reached via the lowercase-`d` jQuery plugin property, not the capitalised one. **Scoped to `feature-new-data-explorer`** — the name appears 6× there and 0× here or on `production`, though DataTables itself is used on this branch `[verified 2026-08-06]`.
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`); data rows may carry versioned values. Normalize with `prettifyGeoType` before comparing. `assignGeoRank` derives its ranking from the same source, so a new versioned variant only needs adding in one place.
- **The search modal is not where this file used to say it was.** On this branch `#searchModal` is defined inline at `themes/dohmh/layouts/partials/footer.html:189`, reached only because `baseof.html` includes the footer — the arrangement the old wording forbade. `feature-new-data-explorer` solved it differently again, with a dedicated `search-modal.html` under `themes/dohmh/layouts/partials/` included from the header partials, and has it in neither `baseof.html` nor `footer.html`. So there is no branch where it lives in `baseof.html` `[verified 2026-08-06: counts across all three branches]`. Whether the Pagefind double-initialization it guarded against actually occurs here is **untested** — it needs a footerless page to reproduce.
- `head.html` gates its library block on page kind and section. That condition does **not** cover section pages — which is why the data explorer landing page throws `aq is not defined` (site-wide audit §5f). Check the gate before assuming a library is available on a given template.

### Neighborhood Reports

**There is no `nr-output` any more.** The 252 hand-written content files under
`content/neighborhood-reports/<Neighborhood>/` and the two `nr-output` layouts were retired in
favour of generated pages ("Option D"). URLs are unchanged — that was the point — so a path that
worked before still works, but nothing renders it the way it used to. Three page kinds:

- **Report page** — `/neighborhood-reports/<nbhd>/<topic>/`, 210 of them, `kind: page`, rendered by
  `themes/dohmh/layouts/neighborhood-reports/nr-report.html`. **None of these 210 are in the
  Pagefind index**: the layout's `<section id="skip-header-target">` carries
  `data-pagefind-ignore="all"`, restoring production's model 2026-08-15 after the alternatives were
  measured and failed. It costs neighborhood+topic search — "asthma East Harlem" no longer finds
  East Harlem's asthma report — and it is reversible by deleting that one attribute, which
  `npm run characterize:pagefind` will catch as a control failure rather than a diff.
  `documents/nr-pagefind-parity-2026-08-15.md` §2g has the numbers, §5 the test that would reverse
  it. Pagefind only: crawlers, the accessibility tree and the no-JS path are untouched. This is the
  report page:
  `assets/js/nr-report/`, ten classic scripts sharing one global scope, mirroring the data
  explorer: `global → url → tertiles → demographics → cards → report → chart → map → data → app`.
  **Load order is set in the template and `app.js` must be last** — it holds the only two
  statements that run at load time. `global.js` declares the shared state, each binding annotated
  with the files that read and write it. Unlike the DE charts, `chart.js` passes `renderer: 'svg'`
  to `vegaEmbed`, so NR chart marks are inspectable DOM nodes. The neighborhood is **server-side**:
  the page knows which one it is, `NR_REPORT_CONFIG.neighborhood` says so, and the name, ZIP list
  and headers render without JS.

  Its Leaflet map is the only in-place neighborhood switcher, and it answers the keyboard as well
  as the mouse: `map.js` binds `keydown` beside `click`, both routing through one
  `selectNeighborhood`. Leaflet already delivered the key event to the focused `<path>` — the 42
  polygons were focusable all along, and nothing was listening. Every polygon carries
  `role="button"` and a name from `featureDisplayName`, **not** from the geojson's `GEONAME`, which
  disagrees with `uhflist`'s `UHF_name` on 6 of the 42 ("Fordham - Bronx Pk", "Rockaways"); the
  tooltip resolves the same way, so the visible label matches the accessible name.
- **Neighborhood index** — `/neighborhood-reports/<nbhd>/`, 42 of them, `kind: section`,
  `themes/dohmh/layouts/neighborhood-reports/nr-neighborhood-index.html`. Leaflet map, ZIP list,
  five topic cards linking to that neighborhood's reports.
- **Topic index** — `/neighborhood-reports/<topic>/`, the 5 topic markdown files, which set
  `layout: nr-topic-index` and an explicit `url`. Title and intro sit *above* the picker in the
  same centred `col-md-8`, not beside it. Then the shared neighborhood list. Plus the hidden
  indicator-name headings Pagefind indexes.

**The report page prints a different document than it shows, and the print rendition is markup, not
a stylesheet over the screen one.** `buildIndicatorCard` in `assets/js/nr-report/cards.js` emits
two renditions of every indicator: the screen row, which is `d-print-none`, and a `print-only`
sibling carrying the same name, value and units at 50/25/25 plus a full-sentence tertile label from
`getTertileInlineLabel`. Two renditions rather than one, because what each *shows* genuinely differs
— the screen pill is *blank* for rank 2 and reads a bare "Higher"/"Lower" otherwise, where print
wants a sentence. What they *announce* is now the same: the screen pill carries `aria-hidden` and an
`.sr-only` copy of the sentence sits beside it, so the accessibility tree gets one vocabulary
wherever the reader meets the comparison (a11y audit F5/C3). The sentence is the same function the
expanded panel uses, deliberately: a reader who opens a row on screen and then prints it would
otherwise get the same fact in two vocabularies. It
carries a `.comp-*` class — `assets/js/nr-report/tertiles.js` sets it, `assets/scss/_custom.scss`
styles it, and all three classes are bold so the comparison word stands out of its sentence. That
bold is invisible in the print row unless the column also carries `font-weight-normal`, because the
accordion button is weight 700 and the column inherits it. Colour and glyph are then split by rank.
`.comp-good` is
`$success` throughout, word and square-check `\f14a`. `.comp-bad` pairs a `$warning` triangle-
exclamation `\f071` with a **darker** amber word, because `$warning` is 1.6:1 on white — legible as
a glyph, not as text. `.comp-null` has no rule at all, so rank 2 prints unmarked, mirroring the
blank pill the screen row shows — visually. Rank 2 still emits the `.sr-only` sentence, because
showing nothing was a third state a screen reader could not tell from missing data. The glyphs are
Font Awesome 6 codepoints rather than emoji, so they come from the webfont `head.html` already loads
sitewide and are under this repo's control; square against triangle also means the two differ in
shape and not only in colour. All three renditions resolve through one `getTertileSentenceParts` in
`tertiles.js`, so they cannot drift: `getTertileInlineLabel` wraps the comparison word in its
`.comp-*` class for the panel and the print row, `getTertileSentence` returns the same sentence as
plain text for the collapsed row. **`rankReverse` marks indicators where *higher* is better, and it
chooses only the comparison word, never the verdict** — `data_value_rank` carries that, 1 always the
unfavourable tertile and 3 always the favourable one. Reading the flag as a verdict flip is what
pilled four Active Design indicators "better" for a neighborhood in the bottom tertile on all four
(fixed 2026-08-12, a6c494a152); `getComparison` at the foot of `tertiles.js` is the function the
rest of the file's reading is anchored to. Panels never print: `@media print` in
`assets/scss/theme.scss` hides `.report-section .collapse` and `.collapsing`, so the printed report
has one shape whatever the reader expanded. The print-only QR code back to the report is filled by
`renderQRCode`, defined in the layout because the layout owns both the element and the library
resource, and called from near the *end* of `renderAll` rather than at load — the Leaflet map
switches neighborhood in place and rewrites the address bar, so a code generated once would point at
the report the reader navigated away from. One call now follows it:
`announceNeighborhoodChange` rebuilds `document.title` and writes the `#nr-report-status` live
region, last so both describe a report that is already built. It reads `reportConfig.seoShortName`, not
`reportName` — `reportName` is `.Title`, and the two differ on Active Design, so the title would be
rewritten on 42 of the 210 pages. Both are suppressed on first paint, since `renderAll` runs at load
too and nothing has changed then.

**Each panel's "Full dataset" link needs a map the page does not otherwise fetch.** The report rows
carry `IndicatorID`, but nothing in them says which data explorer topic that indicator lives under,
so `loadTopicIndicators` in `data.js` fetches `/IndicatorMetadata/topic_indicators.json` and reverses
it into `indicatorTopicSlugs`, `IndicatorID` → topic slug; `getDataExplorerUrl` in `cards.js` then
resolves the href as the card is built. **That JSON is a published Hugo resource, not a static
file** — `themes/dohmh/layouts/partials/de-topic-indicators.html` builds it by ranging `.Site.Pages`
and calling `.Publish`, so it exists only because the three data-explorer layouts that include that
partial are in the build. Its two config keys are `topicIndicatorsUrl` and `dataExplorerUrl`. Three
things follow from the shape of the data. The lookup takes the first topic an id appears under,
matching the retired `getURL`, which returned on its first hit — 42 of the 263 ids are in more than
one topic. An indicator in no topic gets no link at all, the same outcome as the old anchor that
stayed `display:none`; Neighborhood safety (2073) is the live case, so a page rendering a link on
every row is the tell that the omission broke rather than the mapping improving. And the fetch is
counted into `totalFetches`, so a card can never render before the map is in.

**The comparison vocabulary is styled in two files, and which one depends on the rendition.** The
sentence's `.comp-good` / `.comp-bad` / `.comp-null` live in `assets/scss/_custom.scss`; the
collapsed row's `.worse` / `.middle` / `.better` pills live in `assets/scss/theme.scss`. Editing one
set does not touch the other. The pills carried good-vs-bad in `background-color` alone until C3 —
both read the same two words, so a reader with a colour vision deficiency saw no difference (WCAG
1.4.1) — and now take the same Font Awesome codepoints the sentence uses, `\f071` on `.worse` and
`\f14a` on `.better`, with no `color` of their own so the glyph inherits text colour that already
passes on those backgrounds — `#212529` on `.worse` and `.better` alike, 12.5:1 on both
`[verified 2026-08-12: computed colour read off a rendered pill, after `.worse` moved from `#F2CDD7`
to `#FFE69B` in cd19eb2aca]`. `.middle` gets none, matching `.comp-null`. `cards.js` is the only
thing that emits any of the three pill classes, so their blast radius is the report page.

Two traps when working on any of this. `.print-only` is `display:none` normally and `display:flex`
in print (`assets/scss/_custom.scss`) — a hand-rolled class, because Bootstrap's own `_print.scss`
is **not** imported; only the `d-print-*` utilities are. And nothing below a browser proves a print
change: emulate print media and read `document.body.innerText`, which respects `display:none` and is
therefore what print actually shows. `documents/nr-print-view-fix-2026-08-10.md` has the before/after
numbers and the instrument that reported a false pass.

**The report page has no styles of its own any more.** Its inline `<style>` block moved into
`assets/scss/_custom.scss` on 2026-08-15, under a "Neighborhood Reports report page" heading, so a
reader looking in `nr-report.html` for why an accordion header is white will not find it there.
Three of those rules are **scoped to `.nr-report-accordion`, and the scope is load-bearing**:
`.card-header` is a Bootstrap class, an inline block reached only its own page, and the same rules
in a shared stylesheet repaint every card header on the site — measured on
`/data-features/realtime-air-quality/`, where 8 headers went `#EFFAF4` → white with the scope
removed and back with it restored `[verified 2026-08-15: computed style, three runs]`. The
corollary generalizes: **lifting page-local CSS into a shared stylesheet is never a pure
relocation**, because the inline block was carrying a page scope and a cascade position that the
new home does not reproduce. Eight of the seventeen rules were dead and were deleted instead —
`.nr-card-header`, `.nr-indicator-card` and `.card-header a` match nothing the page renders.

**The picker and the neighborhood list are both shared by the topic index and the NR landing page**
(`section.html`), which had drifted to two heights, two placeholders, two search positions and two
introductions while running byte-identical flexdatalist config. Three partials — and the picker's
markup one alone does nothing, since the search needs the JS one beside it:

- `themes/dohmh/layouts/partials/nr-neighborhood-picker.html` — a `Choose Neighborhood` heading, a
  visible `<label>`, the search box, then the map in a `.nr-selector-map` wrapper (height in
  `assets/scss/_custom.scss`,
  since `nr-leaflet`'s `#map` is 100%/100% and has no intrinsic size). Takes `page` and nothing else
  — the search field is the plain `.form-control`, 42px on both pages, since the landing page's 64px
  override was dropped rather than kept as a parameter. The heading is in here, not in the callers,
  for the same reason the rest is; it is an `<h2>` carrying `.h3` for size, because both callers put
  it directly under their page `<h1>`. The label is visible rather than `sr-only` because a
  placeholder was this field's only name and a placeholder vanishes on typing — and it is pointed at
  twice, `for="flex_search"` on the authored input plus an `aria-labelledby` the JS partial sets on
  flexdatalist's generated one.
- `themes/dohmh/layouts/partials/nr-neighborhood-list.html` — the 42 neighborhood links, collapsed
  behind a Bootstrap toggle but present in the markup either way, which is what keeps it the crawl
  path *and* the no-JS equivalent of the map. **Both its elements carry
  `data-pagefind-ignore="all"`, and the server-rendering is why they need it.** The list this
  replaced was built in JS (`topiclanding.html`, `neighborhoods.forEach` + `appendChild`), so
  Pagefind — which reads static HTML — never saw it; rendering it server-side put all 42 names and
  every ZIP code into the index on the landing page and all five topic indexes, ~331 identical
  words each, taking a search for "Kingsbridge" from 1 match to 12 and its own hub page from first
  to fourth. `data-pagefind-ignore` is read by Pagefind alone, so the crawl path, the accessibility
  tree and the JS-off fallback are untouched by it. Same reasoning covers the whole of
  `nr-neighborhood-picker.html`, which is a control rather than content, and the five topic cards
  on `nr-neighborhood-index.html`, where the retired `nr-output/section.html:36` had the identical
  attribute. `documents/nr-pagefind-parity-2026-08-15.md` has the measurements and the queries.
  Takes `topic_slug`: a slug gives `<nbhd>/<topic>/`
  links, and `""` gives `<nbhd>/` links. Every anchor carries `data-nbhd`. **The landing page passes
  `""` and rewrites the hrefs at runtime** — `updateNeighborhoodListLinks` in its `js_bot`, called
  from `setIntendedDestination`, so the list follows the active topic button the way the map and
  search already do. It runs at load too, so the links carry the default topic on first paint.
  `path.Join` rather than `printf` builds the href, because an empty slug in a `printf` leaves a
  doubled separator.
- `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html` — called from each page's
  `js_bot`, because flexdatalist is not in `head.html`. **Each caller must define
  `nrPickerDestination()`**, returning the topic slug to append. That is the one thing the two
  pages genuinely disagree on: a build-time slug on a topic index, the active topic button on the
  landing page. Order does not matter — it is called on selection, after everything has parsed.
  It also holds `wireComboboxState`, which supplies the `role="combobox"` flexdatalist never emits
  and keeps `aria-expanded`, `aria-controls`, `aria-owns` and `aria-activedescendant` true. **It
  reads the DOM through a `MutationObserver`, not the library's events, and that is deliberate** —
  only `results.remove()` fires `removed:flexdatalist.results`, while Escape and the outside-click
  handler each remove the list directly and fire nothing. The same observer makes Escape stick: the
  library's own keyup re-runs the search 400ms later and re-renders what its keydown just removed,
  and the pending search cannot be cancelled from outside (`_searchTimeout` is a closure variable),
  so the dismissal is held and any list that reappears is removed on arrival.

**`nr-leaflet.html` and `assets/js/nr-report/map.js` are two parallel Leaflet implementations
that share four top-level names, so they must never load on the same page.** `highlightFeature`,
`onEachFeature`, `resetHighlight` and `selectNeighborhood` are declared in both
`[verified 2026-08-11: top-level declarations in the two files, intersected]`. They do not collide
today because `nr-report.html` includes the report page modules and not `nr-leaflet`, while the picker
pages do the reverse — but a `const` and a `function` of the same name in one classic-script scope
is a `SyntaxError` that kills every script on the page, and `npm run lint` cannot see it, since
`no-undef` is satisfied by either declaration. Adding `nr-leaflet` to the report page, or the report page's
map module to a picker page, needs a rename first.

`nr-leaflet` needs no argument beyond the page: it reads a topic slug out of the first path
segment itself. Where a page has **no** `geocode` — the landing page and the five topic indexes —
it sets `zoomSnap = 0` and fits the UHF42 layer, so the city fills whatever box the caller gives
it. Both statements live inside that branch, so pages that *do* carry a `geocode` keep the
highlight-and-fly framing. `zoomSnap` is load-bearing, not a tweak: at Leaflet's default of 1,
`fitBounds` rounds down to a whole zoom and the city spans ~59% of the box.

The generator is `content/neighborhood-reports/_content.gotmpl`, a Hugo **content adapter**. It
crosses `data/globals/uhflist.json` (42 neighborhoods) with `data/globals/NR_topics.yml` (5 topics)
and emits 252 pages. Two adapter facts that fail silently rather than loudly. **A front matter
field with its own Hugo accessor must be a top-level key in the page map, not a `params` entry** —
in `params` the accessor just returns empty. `title` feeds `.Title`, `summary` feeds `.Summary`;
`summary` filed wrongly blanked the `<description>` of all 210 report entries in `index.xml` and
the 42 per-neighborhood feeds while every HTML page looked correct. And `.File.BaseFileName` is
the literal string `_content`, so a `where` keyed on it matches zero rows without erroring. `.Site.Pages` and
`.Site.GetPage` are unavailable inside an adapter — the Site object is not built yet — which is why
everything it needs comes from `data/`.

`themes/dohmh/layouts/partials/nr-topic-menu.html` renders the five topic buttons for both the
report page and the topic index, driven by the same topic data.

Routing note: the two NR rules in `static/Web.config` are gone. Every `<nbhd>/<topic>/` URL is now a
real generated page, so nothing needs rewriting — and the old 301 would have redirected all 210 of
them away. The `sessionStorage` hand-off that used to carry a neighborhood from a topic-first URL
into the report page is gone at both ends — the bridge in `themes/dohmh/layouts/404.html`, which now treats
those URLs as the genuine 404s they are, and the path-scan and bridge-read fallbacks in
`assets/js/nr-report/url.js`. `getNeighborhoodFromURL` reads `NR_REPORT_CONFIG.neighborhood`
and nothing else, so a page reaching that layout without the param renders no neighborhood rather
than guessing one.

`scripts/nr-postswap-check.mjs` diffs the generated pages against
`scripts/nr-output-precapture/capture.json`, the record of what the retired pages rendered. **It
must run against a production-data server** — `ensureDevServer()` spawns `dev_stage`, and the
staging branch's row counts differ, which reads as content regressions. The script refuses to run
on a branch mismatch.

### SCSS

`assets/scss/theme.scss` is the root entrypoint, importing Bootstrap overrides and custom styles in lettered files. Bootstrap itself is mounted from `node_modules`.

### Content sections

| Section | Layout folder | Notes |
|---------|---------------|-------|
| `data-stories` | `data-stories` | Markdown articles with Vega/Datawrapper shortcode embeds |
| `data-explorer` | `data-explorer` | Each topic MD lists an indicators array; JS drives all visualization |
| `neighborhood-reports` | `neighborhood-reports` | 252 of its 258 pages are generated by a content adapter — see above |
| `key-topics` | `key-topics` | Organizing principle; linked via `categories` frontmatter |
| `data-features` | `data-features` | Feature articles/tools |

### Data flow

- **Build time**: Hugo fetches remote JSON/YAML from EHDP-data via `getresource` (controlled by `data_branch` and `maxAge` in config). `data-index.html` generates a topic/indicator cross-reference.
- **Runtime**: JS reads `data_repo` and `data_branch` Hugo params to fetch indicator data, map specs, and Vega specs directly from EHDP-data raw URLs.

### Content relationships

- `categories` frontmatter links content to Key Topics
- `keywords` feeds Pagefind site search
- `related` and `relatedData` frontmatter fields specify manual cross-links; templates default to category-matched content when these are absent

## Environments

Specify with `--environment ENV`. Each environment's own config.toml, under its directory in `config/`, is merged over `config/_default/config.toml`.

| Environment   | Data branch | Purpose                                                   |
|---------------|-------------|-----------------------------------------------------------|
| `development` | production  | Preview site changes (default local)                      |
| `dev_stage`   | staging     | Preview combined site + data changes; also CI → `builds/dev-stage` |
| `dev_prod`    | production  | CI → `builds/dev-prod`. Same `baseURL`/`data_branch` as `development` |
| `production`  | production  | Same config as `prod_prod`, but **no workflow builds with it** |
| `prod_prod`   | production  | **The live build** — CI → `builds/prod-prod` on merge to `production` |
| `prod_stage`  | staging     | Preview data changes only                                 |
| `local_prod`  | production  | Uses locally hosted data repo                             |
| `local_stage` | staging     | Uses locally hosted data repo                             |

**Eight, not six, and the two pairs matter.** `development`/`dev_prod` and `production`/`prod_prod` are pairwise identical in `baseURL` and `data_branch`; the difference is only which one CI names. The deploy workflow passes `--environment prod_prod`, so a change made under `production` alone does not reach the live build `[verified 2026-08-06: --environment grep across .github/workflows/]`.

Key per-environment variables: `baseURL` and `data_branch`.

## Coding conventions

- 4-space indentation in all files.
- Browser-side JS: no new frameworks or build dependencies. Keep it lightweight, readable, and explicitly branched.
- Comments should be brief and intent-focused. Explain *why*, not *what*. Bias towards adding more comments, not fewer.
- **Orientation comments before code blocks:** add a brief comment before each meaningful code block (function, object, initialization section) explaining what it does at a high level — even if the name alone makes it obvious. Know what's coming before reading the code, not just after.
- Match existing file style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on all interactive elements.

**JS formatting and comment conventions live in `documents/js-conventions.md`**, which covers all authored browser-side JS — `assets/js/` and inline `<script>` blocks in layouts alike. `.claude/commands/js-development.md` is a stub pointing there.

## Refactors and renames

- **Clarity renames are pre-authorized.** The codebase mixes hand-written names with AI-generated ones from earlier refactors, so a name that actively *misleads* — describing something other than what the thing is — may be renamed as part of any refactor touching it. Rename what misleads, not every name you'd have chosen differently. Every rename must be *proven* complete, not assumed: `npm run lint` proves a JS identifier rename, since the old name ceases to exist; a scoped grep proves a template/SCSS/string rename.
- **Element-id renames get their own commit**, separate from any JS change. Ids are referenced from templates, JS string literals, SCSS, and ARIA attributes — grep all four.
- **Prove a pure relocation by reverse-transform, not by reading the diff.** After moving a block, re-apply the inverse transform (e.g. re-indent the moved lines) and diff against the pre-move state — byte-identity proves "no behavior change" by construction, where a large diff only invites eyeballing. For a comment- or indentation-only pass, `git diff -w` proves the same thing more cheaply: every deletion it still shows must be a line of the category you meant to touch. Invalid in files with template literals — `-w` also hides whitespace edited inside a string.

## Hugo-specific rules

- Edit source files (`content/`, `themes/dohmh/layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- Environment-specific values go in config, not hardcoded strings.
- For a page with substantial inline JS, externalize it to a per-page folder under `assets/js/` and load it through the `short-fingerprint` partial as a fingerprinted script with an integrity attribute. Keep scripts as classic (non-module) tags when they share global scope across files — load order matters and isn't enforced by tooling, so state it explicitly in a template comment.

### Subresource Integrity (SRI)

Hugo calculates integrity hashes for all local JS/CSS resources using the `short-fingerprint.html` partial (a custom hash-shortening wrapper around Hugo's built-in integrity function). If SRI breaks on production, check that end-of-line characters are Unix `LF` — the GitHub Actions workflows enforce this on merge.

## Multi-language

Site has English (`en`), Spanish (`es`), and Simplified Chinese (`zh`). Localized home pages use `_index.es.md` / `_index.zh.md` naming. `ignoreFiles` in config.toml gates language-specific content from the default build.

## Shortcodes

Available in markdown content files:
- `vega` / `vega0` — embed Vega-Lite specs from EHDP-data
- `datawrapper` — embed Datawrapper charts
- `accordion` — collapsible content sections
- `csvtable`, `rawhtml`, `storyheader`, `updateflag`

## CloudCannon CMS

`cloudcannon.config.yaml` and `.cloudcannon/` configure the CMS editor interface. `.cloudcannon/schemas/` contains frontmatter templates for editor-created content.

## Deployment

Branches are auto-built by GitHub Actions on merge:
- `production` → builds to `builds/prod-prod` (live site)
- `build-to-dev-stage` → builds to `builds/dev-stage` (staging)

Branch naming convention: `hotfix-[NAME]`, `content-[NAME]`, `feature-[NAME]`. Branch from `production`; merge to `development` for testing, then to `production` to deploy.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell. Most were written against `feature-new-data-explorer`, which carries a substantially different data explorer — read them as that branch's record, not as a description of this tree. **Before recording any audit claim as stale, re-check it on `feature-new-data-explorer` and `production` too** — `git grep <pattern> <branch> -- <path>`. On 2026-08-05 two of four "stale" claims turned out to be branch differences.

- `documents/site-wide-audit-2026-06-27.md` — everything outside the data explorer, and the active log for findings on this branch (§5f–§5j).
- `documents/data-explorer-architecture.md` — the other branch's explorer narrative. Not applicable here; carries a banner saying so.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active data explorer audit for that branch.
- `documents/data-explorer-deep-audit-2026-06-27.md` — closed/historical; superseded by the fresh audit.
- `documents/js-conventions.md` — JS conventions for all browser-side JS (see Coding conventions above). Its data-explorer examples describe the `feature-new-data-explorer` tree.
- `documents/nr-output-retirement-scoping-2026-08-04.md` — Neighborhood Reports: inventory, traffic, decisions, staging. Written against the `feature-MOD-Lab-NR-recode-refactor` branch, not `feature-new-data-explorer`.
- `documents/nr-decisions-and-sequencing-2026-08-04.md` — the NR decision record and order of work. Also this branch.
- `documents/nr-output-option-d-execution-plan-2026-08-06.md` — the file-by-file detail for the Option D swap, its Pagefind analysis, and the Stage F/G work, all landed 2026-08-08. §11 of the scoping memo is the ledger; this is the executable half. Its file-by-file list predates the picker restore below, so read it as the plan, not as the current template.
- `documents/nr-topic-index-picker-restore-2026-08-09.md` — the follow-up that restored the UHF42 map and the neighborhood typeahead to the topic index, which the Option D swap had dropped. Closed 2026-08-09.
- `documents/nr-neighborhood-picker-options-2026-08-09.md` — enlarging the picker map on the topic index and the NR landing page, and extracting the two duplicated copies into shared partials. Carries the ledger and the decision list for each cosmetic difference the unification forced. Closed 2026-08-09; read it as a dated record.
- `documents/nr-landing-list-unification-2026-08-09.md` — the follow-up that shared the 42-neighborhood list too, moved the `Choose Neighborhood` heading into the picker partial, and made the landing page's list links follow the active topic button. Carries the ledger.
- `documents/nr-pagefind-parity-2026-08-15.md` — the search-index audit against `production`: how the two indexes were compared, what the Option D swap and the server-rendered neighborhood list did to search precision, the `data-pagefind-ignore` fix and its measured effect, and the harness that now checks all of it. Carries the ledger. Closed 2026-08-15 by restoring production's model: **the 210 report pages carry a page-level `data-pagefind-ignore="all"` and are not in the search index**, which puts both branches at 201 indexed pages. §5 of that document is the Google Analytics test that would reverse it, and §2f records the two fixes that were tried first and did not work.

## Common gotchas

- **Missing images cause build failures.** Hugo resizes images at build time; a missing source image will abort the build.
- **Build caching.** `config/_default/config.toml` sets `caches.getresource maxAge = -1` — cache forever — so a build records what was cached locally, not what EHDP-data currently serves. `--ignoreCache` forces a cold fetch. The tell is build time: ~4s warm against ~32s cold for a full production build.
- **SRI + line endings.** Integrity hash mismatches on production usually mean `CRLF` line endings snuck in. GitHub Actions normalizes these on merge.

Always open a **fresh browser tab** after rebuilding — fingerprinted JS bundles are cached aggressively, so an existing tab may serve stale assets even after a rebuild. Relatedly, a server started *before* a shared-template edit can go on serving stale pages, so a smoke run may pass against output that predates your change.

After a rename or delete, fetch the served asset and assert the **old** identifier is absent — that is what separates a broken change from a stale cache. An unchanged fingerprint alongside unchanged output is the tell.
