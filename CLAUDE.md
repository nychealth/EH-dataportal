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
- Comments should be brief and intent-focused. Explain *why*, not *what*. Bias towards adding more comments, not fewer.
- Match existing file style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on all interactive elements.

**Orientation comments before code blocks:** Add a brief comment before each meaningful code block (function, object, initialization section, etc.) explaining what it does at a high level — even if the name alone makes it obvious. The user wants to know what's coming before reading the code, not just after.

## Hugo-specific rules

- Edit source files (`content/`, `layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- Environment-specific values go in config, not hardcoded strings.

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
- Map export (`print.js`): uses an off-screen Leaflet map with `L.canvas({ padding: 0 })` as the renderer. Call `setView()` before adding vector layers — adding layers first causes number-measure exports to silently fail.
- `menu.js` has its own `getDefaultMeasure` with different rules from `pickDefaultMeasureByPriority` in `measures.js` — two sources of truth for the same logic. Don't add a third; consolidate into `measures.js` before extending measure-priority logic.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell:

- `documents/data-explorer-deep-audit-2026-06-27.md`
- `documents/site-wide-audit-2026-06-27.md`
