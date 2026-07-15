# Claude Code Instructions

## Project overview

Hugo-based static site for NYC DOHMH's Environment & Health Data Portal. Outputs to `docs/`. Deployed via GitHub Actions.

## Build and validation

```powershell
# Rebuild static output
hugo --environment dev_stage --cleanDestinationDir --logLevel debug

# Local dev server
hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080
```

Always open a **fresh browser tab** after rebuilding — fingerprinted JS bundles are cached aggressively, so an existing tab may serve stale assets even after a rebuild.

## Repo structure

```
assets/         Source JS, SCSS, images
  js/
    data-explorer/      Active SPA (canonical /data-explorer/)
    data-explorer-old/  Retired; do not modify
content/        Markdown pages and data feature content
layouts/        Hugo templates and partials
data/           JSON/YAML used by Hugo at build time
static/         Files copied verbatim to docs/
docs/           Generated output — never edit directly
documents/      Internal audits and technical write-ups
```

## Coding conventions

- 4-space indentation in all files.
- Browser-side JS: no new frameworks or build dependencies. Keep it lightweight, readable, and explicitly branched.
- Generous vertical whitespace in `assets/js/data-explorer/` — see `measures.js` for the style reference.
- **JS formatting and comment conventions:** see `documents/js-conventions.md` — covers file headers, comment hierarchy, variable grouping, function-level comments, and internal step comments. Apply when writing or revising any browser-side JS.
- Comments should be brief and intent-focused. Explain *why*, not *what*. Bias towards adding more comments, not fewer.
- Match existing file style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on all interactive elements.

**Orientation comments before code blocks:** Add a brief comment before each meaningful code block (function, object, initialization section, etc.) explaining what it does at a high level — even if the name alone makes it obvious. The user wants to know what's coming before reading the code, not just after.

## Hugo-specific rules

- Edit source files (`content/`, `layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- Environment-specific values go in config, not hardcoded strings.
- For a page with substantial inline JS, externalize it to `assets/js/<page-name>/*.js` and load via `resources.Get` → `partial "short-fingerprint.html"` → fingerprinted `<script src integrity=...>` — see `data-explorer/single.html` and `data-features/congestion-pricing-report.html` for two working examples. Keep scripts as classic (non-module) tags when they share global scope across files — load order matters and isn't enforced by tooling, so state it explicitly in a template comment.

## Data explorer architecture

The data explorer (`assets/js/data-explorer/`) is a vanilla-JS SPA with a global-variable state model:

- **`global.js`** — declares all shared state (50+ globals: `IndicatorID`, `MeasureID`, `GeoType`, `TimePeriodID`, etc.)
- **Script load order is critical** (14 files, synchronous): `global → app → data → measures → table → map → 311 → topic-indicator-selector → menu → bar → trend → correlate → disparities → print`. Note: `utilities.js` is not a separate file — its code is concatenated into `global.js` (see `// utilities.js` banner at ~line 294).
- **Data flow:** `metadata.json` → Arquero table → `joinData()` → `renderMeasures()` → `show*()` closures
- **`renderCurrentView(updateMap)`** is the central dispatch function

Key gotchas:
- `showBar()` depends on `filteredMapData` set by `showMap()` — bar must not render before map
- `$.fn.dataTable.isDataTable` (lowercase `d`) — not `$.fn.DataTable.isDataTable`
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`); data rows may carry versioned values (`NTA2020`). Normalize before comparing.
- `#searchModal` must be in `baseof.html`, not `footer.html`, to avoid Pagefind double-initialization on footerless pages
- `showTable()` must not run in the same turn as `showMap()` — DataTables init (~50-90 ms) blocks Leaflet's first paint. Schedule it with a double `requestAnimationFrame` after `showMap()`'s promise resolves.
- DataTables: omit `fixedHeader`, `Buttons`, and `Select` extensions (they add 15-20 ms startup cost each with no benefit here); skip `columns.adjust()` on first render (~25 ms). Lock `.dataTables_scrollBody` to `height/min-height/max-height: 500px; overflow-y: scroll` to prevent width drift as row counts change.
- Map export (`print-map.js`): uses an off-screen Leaflet map with `L.canvas({ padding: 0 })` as the renderer. Call `setView()` before adding vector layers — adding layers first causes number-measure exports to silently fail.
- Default-measure priority lives in one place: `pickDefaultMeasureByPriority` in `measures.js`. `menu.js`'s `getDefaultMeasure` delegates to it (passing `indicator.Measures`) so the dropdown highlight and the rendered default can't diverge — don't reintroduce a parallel priority list.
- Magic MeasureIDs / ComparisonIDs that render logic branches on (poverty comparator, air-quality trend slices, quarterly measures, etc.) live in `DE_MEASURE_RULES` in `global.js`. Add new data-coupled IDs there with a comment, not as inline literals in `measures.js` / `trend.js`.
- Verbose tracing goes through `debugLog()`, not raw `console.log`. It's defined in `head.html` (site-wide, next to `hugoEnv`/`baseURL`/`data_repo`/`data_branch`) rather than `global.js`, because `topic-indicator-selector.js` also runs on `data-explorer/section.html`, which loads it without the rest of the SPA bundle — a `global.js`-only helper would throw `ReferenceError` there. It defaults on for every Hugo environment except `production`/`prod_prod` (reads `hugoEnv`), so local/dev/staging need no setup; `localStorage.setItem('de_debug', '1' | '0')` overrides it either direction per browser. Use it for new trace/dump statements; leave genuine error-path logging (`.catch(error => console.log(error))`) as plain `console.log`/`console.error` so failures stay visible regardless of environment or flag.
- `assignGeoRank` derives its ranking from `prettifyGeoType` (`GEO_RANK_BY_PRETTY_TYPE` in `global.js`) instead of its own `switch`. A new versioned geotype variant (e.g. a future `NTA2030`) only needs adding to `prettifyGeoType` — don't reintroduce a parallel version list in `assignGeoRank`.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell:

- `documents/data-explorer-deep-audit-2026-06-27.md` — closed/historical; all §0–§6 findings shipped by 2026-07-04. Superseded by the fresh audit below.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active data explorer audit (Tiers 1–4). Tiers 1–3 are done across `feature-de-tier1-audit-fixes` (merged), `feature-de-tier2-consolidation` and `feature-de-tier3-perf` (both unmerged, kept on their own branches per user choice); Tier 4 (structural) is not started. Log new findings and fix status here, not in the deep-audit doc.
- `documents/site-wide-audit-2026-06-27.md`

## Team context

The team is mostly self-trained, so some things are done deliberately and well, others evolved organically. The team is happy with what works but open to suggestions for more professional or elegant approaches. Proactively flag patterns that have a clearly better industry-standard equivalent, even as asides during unrelated work — but don't assume everything unfamiliar is wrong, and keep suggestions brief.