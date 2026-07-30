<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts scripts -->
<!-- docs-check verified: 52d5252e1a 2026-07-27 -->
<!-- docs-check ignore: fixedHeader -->
# Claude Code Instructions

## Project overview

Hugo-based static site for NYC DOHMH's Environment & Health Data Portal. Outputs to `docs/`. Deployed via GitHub Actions.

## Build and validation

```powershell
# Rebuild static output
hugo --environment dev_stage --cleanDestinationDir --logLevel debug

# Local dev server
hugo server --environment dev_stage --cleanDestinationDir --disableFastRender --logLevel debug -p 8080
```

`--disableFastRender` is how the team actually starts the server by hand, so it belongs in the documented command. `scripts/dev-server.mjs` spawns this exact command — keep the two in sync when either changes.

Always open a **fresh browser tab** after rebuilding — fingerprinted JS bundles are cached aggressively, so an existing tab may serve stale assets even after a rebuild.

**Never run a static `hugo` rebuild while a `hugo server` is also running**, even against a different `--environment`. Both share the same on-disk resource-fingerprint cache (`resources/_gen/`), which isn't environment-namespaced — a static rebuild can poison the live server's cache with the wrong environment's asset paths, breaking every page on the live server with MIME-type-refused/404 errors until it's restarted. To verify a static build while someone's dev server is live, inspect the generated `docs/` HTML directly (grep/read the output) instead of hitting the live server; if you need the live server itself to reflect a change, ask before restarting a process you didn't start.

### Guardrails (Tier 4.5)

Four npm scripts, run from the repo root (the repo's first `package.json` `scripts` block):

- `npm run lint` — ESLint (`no-undef`) over `assets/js/data-explorer/`. The 15 SPA files share one global scope, so the flat config (`eslint.config.mjs`) derives their shared globals at config-load time; `no-undef` catches the undefined-name typos that scope is most prone to. `no-unused-vars` is intentionally omitted — it false-positives on the cross-file global pattern.
- `npm run characterize -- --check` — Playwright characterization harness (`scripts/de-characterization.mjs`); diffs 3 indicators across the map/bar/table/trend views against a committed baseline (`scripts/de-characterization-baseline/`). `-- --baseline` re-captures.
- `npm run smoke` — loads one page per template kind and fails on any non-allowlisted console `error`/`pageerror` (`scripts/smoke-pages.mjs`). Run before any merge that touches a shared template like `head.html`. Before relying on it as the proof for a change that only executes on one page kind, confirm that page is in `PAGES` — the list's comments are unverified claims that rot like doc prose (one read `// DE section` while pointing at a `single.html` URL, so the real section page had no coverage at all).
- `npm run docs-check` — verifies that docs claiming to describe *current* code still name real paths and real identifiers (`scripts/docs-check.mjs`). **Opt-in**: a doc is checked only if it declares `<!-- docs-check source-roots: … -->` in its first lines. Audits and dated findings must **not** opt in — they cite old names on purpose. Run it after any rename; it is the cheapest thing that catches doc rot at the commit that causes it. It scans every `.md` in `documents/` plus the root docs in `ROOT_DOCS` — **this file is one of them**, so a path or identifier you write here must be real and repo-root-relative. Site URLs (`/data-explorer/`), globs, and `<placeholder>` patterns are skipped; a name deliberately cited as absent (like a DataTables option we don't use) goes in the `docs-check ignore:` header.

`characterize` and `smoke` **reuse a running dev server, start one if none is running, and never stop a server they didn't start** (via `scripts/dev-server.mjs`). Set `DE_BASE_URL` to point them at a server on a non-default port/environment (e.g. `DE_BASE_URL="http://localhost:8080/local-stage/"`). If a `hugo` process is running but they can't find it on :8080/:1313, they abort with instructions rather than start a second server — a second server poisons the running one's fingerprint cache (`d5fb2ea700`).

Run `characterize -- --check` and `smoke` before any Tier 2–4 merge.

## Root-cause claims

A causal claim about runtime behavior — CSS, DOM, layout, timing, browser APIs — must cite an observation from a running browser, not reasoning about the source. This applies at **any change size**: a one-property CSS fix needs it as much as a template-wide refactor. Plausibility is not evidence, and a well-written explanation is not a verified one.

- **State the disconfirming test you ran and what it showed**, before proposing the fix. "I hid the child element and the ring rendered correctly" is evidence. "Outlines don't follow asymmetric border-radius" is a guess.
- **If a nearby working example contradicts your theory, the theory is wrong.** Do not add a secondary explanation for why the working case is exempt — that is how a wrong diagnosis survives review.
- **Mark unverified reasoning as unverified.** If a fix ships on a hypothesis you could not test, write `// HYPOTHESIS (unverified):` rather than stating the cause as fact. A confident wrong comment misleads every later attempt; the next person re-tests a hypothesis but trusts an explanation.
- **After one failed fix attempt, stop and gather runtime evidence** instead of trying a second theory. Two speculative fixes in a row means the premise is wrong, not the implementation.
- **If a refactor is justified partly by bug claims, prove them in a no-code stage first.** Reproduce each in the browser before touching anything, and drop any that doesn't reproduce rather than fixing a phantom. It costs one browser session and makes every later commit cite real before/after evidence instead of a hypothesis. It cuts both ways: 4.2 found a fourth defect nobody had recorded, and 4.3 falsified two of the three it set out to fix.
- **Two methods that make that evidence cheap here:** delay a fetch with Playwright's `page.route` to hold a load-window open and inspect state mid-flight; drive canvas charts by sweeping the real mouse and letting the chart report its own hits, not by computing scenegraph coordinates. Details and gotchas: `project-browser-verification-methods` in memory.

Worked example: `documents/data-explorer-fresh-audit-2026-07-13.md` §4.9 — a focus-ring bug that survived two fixes because the diagnosis was plausible, confidently written, and false; the actual cause took one browser experiment to find.

## Repo structure

```
assets/         Source JS, SCSS, images, map-data
  js/
    data-explorer/      Active SPA (canonical /data-explorer/)
    data-explorer-old/  Retired; do not modify
content/        Markdown pages and data feature content
themes/dohmh/layouts/   Hugo templates and partials — there is NO root layouts/
config/         Per-environment Hugo config (dev_stage, local_stage, prod_prod, …)
data/           JSON/YAML used by Hugo at build time
static/         Files copied verbatim to docs/
docs/           Generated output — never edit directly
resources/      Hugo's fingerprint cache (_gen/) — generated, never edit
documents/      Internal audits and technical write-ups
scripts/        Node dev tooling (characterization harness, smoke test, dev-server helper)
```

Templates live under `themes/dohmh/layouts/`. There is no root layouts/ directory — a
path written that way will not resolve.

## Coding conventions

- 4-space indentation in all files.
- Browser-side JS: no new frameworks or build dependencies. Keep it lightweight, readable, and explicitly branched.
- Generous vertical whitespace in `assets/js/data-explorer/` — see `measures.js` for the style reference.
- **JS formatting and comment conventions:** see `documents/js-conventions.md` — covers file headers, comment hierarchy, variable grouping, function-level comments, and internal step comments. Apply when writing or revising any browser-side JS.
- Comments should be brief and intent-focused. Explain *why*, not *what*. Bias towards adding more comments, not fewer.
- Match existing file style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on all interactive elements.

**Orientation comments before code blocks:** Add a brief comment before each meaningful code block (function, object, initialization section, etc.) explaining what it does at a high level — even if the name alone makes it obvious. The user wants to know what's coming before reading the code, not just after.

## Branching

Each audit tier's work goes on its own `feature-de-tier<N>-<slug>` branch cut from `feature-new-data-explorer`, never committed directly to it — see `feature-de-tier2-consolidation` through `feature-de-tier4.5-guardrails`. Merge back only when the tier is verified and documented.

## Refactors and renames

- **Clarity renames are pre-authorized.** The codebase mixes hand-written names with AI-generated ones from earlier refactors, so a name that actively *misleads* — describing something other than what the thing is — may be renamed as part of any refactor touching it. Rename what misleads, not every name you'd have chosen differently. Every rename must be *proven* complete, not assumed: `npm run lint` (`no-undef`) proves a JS identifier rename, since the old name ceases to exist; a scoped grep proves a template/SCSS/string rename.
- **Element-id renames get their own commit**, separate from any JS change, and scoped to the new explorer. Ids are referenced from templates, JS string literals, SCSS, and `aria-labelledby` — grep all four. Never touch `assets/js/data-explorer-old/`; it keeps its own independent copies of these ids and its own JS. See the Tier 4.1 Stage 4 commit (`f5867cacf3`) for the pattern.
- **Prove a pure relocation by reverse-transform, not by reading the diff.** After moving a block, re-apply the inverse transform (e.g. re-indent the moved lines) and diff against the pre-move state — byte-identity proves "no behavior change" by construction, where a 700-line diff only invites eyeballing. Tier 4.1 Stage 3 moved ~360 lines this way.

## Hugo-specific rules

- Edit source files (`content/`, `themes/dohmh/layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- Environment-specific values go in config, not hardcoded strings.
- For a page with substantial inline JS, externalize it to a per-page folder under `assets/js/` and load via `resources.Get` → `partial "short-fingerprint.html"` → fingerprinted `<script src integrity=...>` — see `themes/dohmh/layouts/data-explorer/single.html` for the working example. It is the only page on this branch using a per-page JS folder. The congestion-pricing report is the second example, but it lives only on the unmerged `feature-summer-CP-report` branch, under assets/js/congestion-pricing-report/ (seven files) — check that branch out before concluding the pattern has one instance. Note that `npm run docs-check` only ever sees the checked-out tree, so a cross-branch path must not be written as a backticked path claim here. Keep scripts as classic (non-module) tags when they share global scope across files — load order matters and isn't enforced by tooling, so state it explicitly in a template comment.

## Data explorer architecture

The data explorer (`assets/js/data-explorer/`) is a vanilla-JS SPA whose shared state lives in one global namespace object:

- **`global.js`** — declares all shared state as `const DE = { ... }` (global.js:18), with sub-objects `DE.table`, `DE.disparities`, `DE.links`, `DE.trend`, `DE.map`, `DE.print`, `DE.lookups`, `DE.indicator`, `DE.state`. Don't reintroduce bare top-level globals for state that already has a `DE.*` home.
- **Two DE templates, and the URL doesn't hint which is which:** `/data-explorer/` is `themes/dohmh/layouts/data-explorer/section.html` (topic chooser — loads `topic-indicator-selector.js` *alone*, without `app.js` or the rest of the bundle); `/data-explorer/<topic>/` is `themes/dohmh/layouts/data-explorer/single.html` (the full SPA). `content/data-explorer/_index.md` vs `<topic>.md` is what decides. Guards of the form `typeof <spaFunction> === 'function'` exist for the section page, and it is the only page that exercises them.
- **Script load order is critical** (15 files, synchronous): `global → app → data → measures → table → map → 311 → topic-indicator-selector → menu → bar → trend → correlate → disparities → print-map → print`. Note: `utilities.js` is not a separate file — its code is concatenated into `global.js` (grep the `// utilities.js` banner). `de-tab-content.js` is a 16th file in the directory but is **not** in this bundle — `themes/dohmh/layouts/partials/de-tab-content.html` loads it itself.
- **Data flow:** `metadata.json` → Arquero table → `joinData()` → `renderMeasures()` → `show*()` closures
- **`renderCurrentView(updateMap)`** is the central dispatch function
- **`loadAndRenderIndicator(id, { selection, history })`** (app.js) is the *only* path from an indicator ID to a rendered view — `checkURL`, `selectIndicator` and `popstate` all go through it. It also owns the URL: exactly one history write per navigation, made after `renderMeasures()` so the URL carries the resolved defaults. Don't add a `pushState`/`replaceState` to `loadIndicator` or anything else in the load path; pass `history: 'push' | 'replace' | 'none'` instead. Reads go through `parseSelectionFromURL()`, writes through `buildCanonicalSearchParams()`, legacy forms through `normalizeLegacyURL()`.

Key gotchas:
- `showBar()` depends on `filteredMapData` set by `showMap()` — bar must not render before map
- `$.fn.dataTable.isDataTable` (lowercase `d`) — not `$.fn.DataTable.isDataTable`
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`); data rows may carry versioned values (`NTA2020`). Normalize before comparing.
- `#searchModal` must be in `baseof.html`, not `footer.html`, to avoid Pagefind double-initialization on footerless pages
- `showTable()` must not run in the same turn as `showMap()` — DataTables init (~50-90 ms) blocks Leaflet's first paint. Schedule it with a double `requestAnimationFrame` after `showMap()`'s promise resolves.
- DataTables: omit `fixedHeader` and `Select` (they add 15-20 ms startup cost each with no benefit here — `select: true` was inert anyway and has been deleted). `Buttons` is kept, but only for the table tab's `csvHtml5` CSV export (the `buttons:` config in `table.js`). Skip `columns.adjust()` on first render (~25 ms). Lock `.dataTables_scrollBody` to `height/min-height/max-height: 500px; overflow-y: scroll` to prevent width drift as row counts change.
- Map export (`print-map.js`): uses an off-screen Leaflet map with `L.canvas({ padding: 0 })` as the renderer. Call `setView()` before adding vector layers — adding layers first causes number-measure exports to silently fail.
- Default-measure priority lives in one place: `pickDefaultMeasureByPriority` in `measures.js`. `menu.js`'s `getDefaultMeasure` delegates to it (passing `indicator.Measures`) so the dropdown highlight and the rendered default can't diverge — don't reintroduce a parallel priority list.
- Magic MeasureIDs / ComparisonIDs that render logic branches on (poverty comparator, air-quality trend slices, quarterly measures, etc.) live in `DE_MEASURE_RULES` in `global.js`. Add new data-coupled IDs there with a comment, not as inline literals in `measures.js` / `trend.js`.
- Verbose tracing goes through `debugLog()`, not raw `console.log`. It's defined in `head.html` (site-wide, next to `hugoEnv`/`baseURL`/`data_repo`/`data_branch`) rather than `global.js`, because `topic-indicator-selector.js` also runs on `themes/dohmh/layouts/data-explorer/section.html`, which loads it without the rest of the SPA bundle — a `global.js`-only helper would throw `ReferenceError` there. It defaults on for every Hugo environment except `production`/`prod_prod` (reads `hugoEnv`), so local/dev/staging need no setup; `localStorage.setItem('de_debug', '1' | '0')` overrides it either direction per browser. Use it for new trace/dump statements; leave genuine error-path logging (`.catch(error => console.log(error))`) as plain `console.log`/`console.error` so failures stay visible regardless of environment or flag.
- `assignGeoRank` derives its ranking from `prettifyGeoType` (`GEO_RANK_BY_PRETTY_TYPE` in `global.js`) instead of its own `switch`. A new versioned geotype variant (e.g. a future `NTA2030`) only needs adding to `prettifyGeoType` — don't reintroduce a parallel version list in `assignGeoRank`.
- `window.mapInterop` is a fixed three-member contract (`ready`, `highlight(geoID)`, `reset()`) created once at load in `map.js` and **attached** by each renderer — don't publish renderer-specific members (`circleMarkers`, `geoIDtoLayer`, …) on it or bar.js will start shape-sniffing again. `resetMapForRender()` detaches it, so `ready` is false while geometry is in flight; that gap is real (a hover landing in it used to write stale text into the legend panel, silently). The reverse direction goes through `setBarSelection()` — the only place map.js may touch `window.myVegaView`.
- **The old explorer is the oracle for what catalog metadata *means*, not just a retired copy.** A null `GeoType` inside a `VisOptions[0]` vis-type array encodes "this vis type is unavailable for this measure" — the old explorer disables the tab and falls back to Table; the new one reads it as a geography and hard-fails (fresh audit §4.12). Before reporting catalog data as malformed, load the same `?id=` on `/data-explorer-old/`: if it renders there, the defect is ours. Tier 4.4 retires that oracle — mine it before it goes.
- The seven `show*` renderers and `syncLinksSelectionsToMapSelection` are declared `let` in `global.js` and **assigned** (not declared) in `measures.js`, now at module scope. Writing `const showMap = …` redeclares the `global.js` `let` in the shared top-level scope → load-time `SyntaxError` on *every* page. Keep them assignments. `npm run smoke` is the runtime catch for this.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell:

- `documents/data-explorer-architecture.md` — the SPA's **current-state** narrative: load pipeline, per-interaction flow, URL sync, ordering constraints. Deliberately holds no file/function inventory (that content rotted through five refactors; `grep` answers it better). Guarded by `npm run docs-check` and carries a `docs-check verified: <commit>` stamp — if you change behaviour it describes, update the prose and re-stamp.
- `documents/data-explorer-deep-audit-2026-06-27.md` — closed/historical; all §0–§6 findings shipped by 2026-07-04. Superseded by the fresh audit below.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active data explorer audit (Tiers 1–4). **Tiers 1, 2 and 3 are complete and all merged into `feature-new-data-explorer`** (as of 2026-07-23), along with Tier 4.5 (guardrails), 4.6 (head.html gating), 4.7, 4.8 (Pagefind), 4.9, 4.1 (dismantle `renderMeasures()`) and its naming sweep, 4.2 (one indicator-load pipeline + URL module, 2026-07-26), 4.3 (`window.mapInterop` contract, merged and pushed 2026-07-27) and 4.10 (delegated dropdown menus). **4.12 is fixed but not yet merged** (2026-07-30) — a null `GeoType` meant "no map for this measure" and the map threw on 40 of 282 indicators; it now draws an explicit gray "not mapped" state. It sits on `feature-de-tier4.12-null-geotype`. **Open: §4.13** (10 measures have no `Citywide` row to fall back on, so their Boundary/Time dropdowns are empty — an upstream metadata question, no crash) and **§4.14** (none of the three map renderers carries a stale-render token; logged, not reproduced). Then **4.4** (retire the old explorer, parked until comparative user testing ends) — 4.12 cleared its crash, but those indicators still default to a thinner Table than the old explorer's, which is 4.4's remaining gate. Log new findings and fix status here, not in the deep-audit doc.
- `documents/site-wide-audit-2026-06-27.md`

## Team context

The team is mostly self-trained, so some things are done deliberately and well, others evolved organically. The team is happy with what works but open to suggestions for more professional or elegant approaches. Proactively flag patterns that have a clearly better industry-standard equivalent, even as asides during unrelated work — but don't assume everything unfamiliar is wrong, and keep suggestions brief.