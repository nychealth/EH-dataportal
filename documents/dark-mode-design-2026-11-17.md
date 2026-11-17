# Dark mode — design (2026-11-17)

Branch `feature-dark-mode`, cut from local `production` at `8993a4fc5d`. Plan and ledger:
[dark-mode-plan-2026-11-17.md](dark-mode-plan-2026-11-17.md).

## Intent

"Everything is too light at night." A dark theme for the whole portal, built to public standard on
a branch as a prototype: shown to the team first, shipped later if they agree (Chris, 2026-11-16).

## Decisions (Chris, 2026-11-16, in the brainstorming Q&A)

| Question | Answer |
|---|---|
| Who for | Public visitors eventually; prototype first, built to public standard |
| Trigger | Follow the OS setting by default, plus a header toggle that overrides it, remembered per browser |
| Scope | Everything, charts and maps included |
| Data colours | Identical in both modes: only the chrome around data changes (basemap, axes, labels, gridlines, legends, tooltips) |
| Palette | Surfaces derived from the site's own navy, `$dark` `#0A1438`; brand green lightened where it is text |
| Wiring | One override layer of dark rules using a small set of CSS custom properties; Bootstrap untouched |
| Exports | Downloaded chart/map images and print always stay light |
| Overnight | Design, then build; work uncommitted, cumulative patch per step |

## Goals

- Every page readable in dark mode with no large light panels left behind.
- Text contrast in dark mode meets WCAG AA (4.5:1 body text, 3:1 large text and UI graphics).
- No flash of the light theme on load when dark is chosen.
- Light mode unchanged, byte for byte where it can be proved: the compiled CSS is today's CSS with
  the dark layer appended, and nothing in it applies unless the theme is dark.

## Non-goals

- The retired explorer at `/data-explorer-old/` (excluded from search, kept as a record).
- Standalone `static/` HTML pages iframed into content (R widgets, Plotly figures, qgis2web maps):
  each is its own document with its own styles. Listed as a gap, not themed.
- Third-party iframes other than Datawrapper (Equitable Explorer, the weather widget): no control.

## Anti-goals

- Changing what a data colour means. A choropleth class, a chart series, a tertile colour reads the
  same in both modes.
- A dark exported PNG or a dark printout.
- A light-mode regression of any kind.

## Constraints found in recon

- Bootstrap is the vendored v4.3.1 at `assets/bootstrap/scss/`. Its mixins call `darken()` and
  similar Sass colour functions at build time, which fail on a `var(--…)` value, so Bootstrap's own
  variables cannot become CSS variables. The dark layer therefore overrides compiled Bootstrap rules
  rather than re-parameterizing them.
- `assets/scss/theme.scss` imports the lettered partials, then `__portal-custom` and `de-custom`.
  Appending the dark partial last makes the compiled CSS a strict extension of today's.
- Inline `<script>` blocks already exist in `head.html`, so a no-flash inline script needs no CSP
  change.
- Vega: every current template loads Vega through `lib-vega.html`, except the retired explorer.
  45 `vegaEmbed(` call sites across `assets/`, `themes/`, `content/`. The new explorer renders to
  canvas, so chart chrome cannot be restyled by CSS; it must go in through Vega config.
- Leaflet: 15 `L.tileLayer` call sites, all but one CARTO (`light_all` or `rastertiles/voyager`, keyed);
  `proximity.js` uses MapTiler. CARTO answers a request without a valid key with a 200 placeholder
  image (memory `project-carto-keyless-placeholder`), so any new tile style is checked by hashing.
- Datawrapper: 72 content files plus the `datawrapper` shortcode embed `datawrapper.dwcdn.net`
  iframes. Datawrapper documents `?dark=true` / `?dark=false` on the iframe URL
  ([docs](https://www.datawrapper.de/docs/dark-mode-in-embedded-datawrapper-visualizations),
  read 2026-11-17).
- Explorer map export (`print-map.js`) draws to a canvas and calls `toDataURL`; chart export
  (`print.js`) re-embeds the spec in `#printVis` and calls `view.toImageURL`.

## Approaches considered

1. **Override layer + CSS variables (chosen).** One new partial, `_i-dark-mode.scss`, imported last.
   Dark palette as custom properties declared only under the dark selectors; overrides for Bootstrap
   components and the site's own classes that hard-code light colours. Small diff, light mode provably
   untouched. Cost: a future component that hard-codes a light colour needs its own dark rule.
2. **Convert the site's own SCSS to variables.** Rewrite colour literals in ~4,000 lines of custom
   partials to `var(--…)`. Sturdier long term; large diff through the busiest files, and it changes
   the light-mode CSS, so "light unchanged" becomes a visual claim instead of a diff.
3. **`filter: invert()` on the page.** Minutes of work; shifts every hue, including data colours,
   which is the anti-goal. Rejected.

## Design

### Theme state

- An inline script at the top of `head.html` resolves the theme before the body is parsed:
  a stored choice in `localStorage['ehdp-theme']` (`light` / `dark`) wins, else
  `matchMedia('(prefers-color-scheme: dark)')`. It writes `data-theme` on `<html>` and exposes a tiny
  global, `ehdpTheme` (`current()`, `set(mode)`, `onChange(fn)`), firing on toggle and on OS change
  when nothing is stored. Storage access is wrapped in `try`, as the existing `de_debug` read is.
- CSS also carries `@media (prefers-color-scheme: dark)` fallbacks for `html:not([data-theme=light])`,
  so a visitor without JS still follows the OS. A Sass mixin emits both selector forms from one rule.
- Every dark rule sits under `@media screen`, so print is light regardless of mode.
- `color-scheme: dark` on the root in dark mode, so native controls, scrollbars and iframe canvases
  match.

### Toggle

A button in the black `#nyc-top-header` bar, in each of the three header partials (`header.html`,
`header-de.html`, `header-ds.html`), beside "311" and "Search all NYC.gov". Moon/sun icon from the
already-loaded Font Awesome, a visible text label at desktop widths, `aria-pressed` reflecting dark,
`d-print-none`. Two states; the first click stores an explicit choice, overriding the OS from then on.

### Page chrome

Palette tokens (dark only): page background, surface (cards, accordions, tables), raised surface
(dropdowns, modals, popovers), border, body text, muted text, link/brand-text green (lightened `#008939`
to reach 4.5:1 on the page background), focus ring. Overrides cover: `body`, Bootstrap `bg-white` /
`bg-light` / `text-dark` / `text-body` / `text-muted`, cards, list groups, dropdowns, modals, forms,
tables, accordions, nav-items, buttons with light fills, `hr`/borders, DataTables, flexdatalist,
Pagefind UI, Leaflet controls/popups/tooltips, vega-embed actions menu and vega-tooltip. Then the site's
own classes, found by a browser sweep (below) rather than by reading 4,000 lines of SCSS.

### Changed during the build (2026-11-17), each from a measurement

- **Charts: CSS, not a `vegaEmbed` wrapper.** Every current call site passes `renderer: "svg"`
  (one grep over `assets/`, `themes/`, `content/`), and Vega writes colours as SVG presentation
  attributes, which CSS outranks. Restyling by role class (`role-axis-label`, `role-axis-grid`, …)
  follows a toggle live with no re-embed, and exports stay light because `view.toImageURL` renders
  from Vega's scenegraph. The wrapper would have had to re-embed on toggle, which orphans the views
  that `bar.js` (`window.myVegaView`, hover listeners) and `nr-report/chart.js` (`chartViews`, for
  `finalize()`) keep. Measured: bar chart PNG exported from a dark page has a white corner pixel,
  74% white pixels, 0.1% dark.
- **Datawrapper: stays light, on a light plate.** `?dark=true` re-colours the data: on the heat
  report's HVI map (`OEVex/6`) it reverses the sequential palette and draws classes 4 and 5 in
  near-identical peach, against the "data colours identical" decision. The switching code is kept
  behind `DATAWRAPPER_FOLLOWS_THEME = false` in `theme-adapters.js`, and works for both embed forms
  (iframe and script embed) when switched on, including a live re-render on toggle.
- **Basemap: variant A only** — superseded in round 2 (below) by CARTO's `dark_all`, at Chris's
  request.

### Round 2 (Chris's review, 2026-11-17)

- **Basemap: CARTO `dark_all`.** A hook in `lib-leaflet.html`, which all 16 Leaflet templates
  include, wraps `L.TileLayer`'s `getTileUrl`: a CARTO `light_all` or `voyager` layer asks for
  `dark_all` while the page is dark, and layers on a map redraw on a toggle. The site's key serves
  `dark_all` (keyless control: the "API KEY REQUIRED" placeholder). `print-map.js` opts its export
  layer out (`keepLightBasemap`), so a downloaded map stays light. A tile layer from another
  provider (proximity's MapTiler) keeps the invert filter, now on that layer alone: the overnight
  rule filtered the whole tile pane, where the heat story's georaster data layer also draws, and
  would have inverted its colours.
- **Dark data series lightened** (a departure from "data colours identical", for these only):
  trend's NYC `#000000ff` → `--dm-text`, `#374c80` → `#7d93d6` (trend, disparities), correlate's
  `#000F89` → `#7c8cff`, each from under 2:1 to over 5:1 on the chart surface; the bar view's black
  highlight outline and the trend chart's black tick marks too. Every other series in those views
  measures 3.20:1 or more. CSS on the literal attribute Vega writes, so exports keep the originals.
- **Explorer toggle**: a second toggle in the explorer's own bar, text from lg up (at md it ran into
  the topic title), icon below.
- **Surfaces**: breadcrumb transparent; content cards paint their inner `.card-content`, so the
  outer card's margin and gutter show the page; the home page's bottom cards raised, their stripe
  green again (the card border override had turned it grey-blue).
- **Click-only states**, which the load-time sweep never opened: header menu links (`#212529`,
  1.2:1), the explorer's selected dropdown item (`#0A408A`), the explorer map popup's header and greys.
- **Scrollbar**: `scrollbar-color` from the palette on `<html>`, inherited by inner scrollers.
- **Datawrapper dark, switched on for review** (`DATAWRAPPER_FOLLOWS_THEME = true`; the light plate
  stands down through `data-dw-follow`). Charts that load late (hidden tabs, the housing story's
  radios) are caught by a `MutationObserver` and get the flag too. Measured by mean luminance of
  each embed's screenshot in dark mode, over the 44 Datawrapper pages that resolve: 117 of 158
  embeds draw dark and 41 stay light (none between), the light ones clustered by page
  (air-quality-snapshots, violence, restaurants-and-air-quality, food, heat all light; streets,
  housing, redlining mixed). A chart that stays light keeps its white iframe canvas. Those that
  go dark re-colour their data (heat report Figure 1: dark red bars become peach), as on `OEVex/6`.
  Why some charts ignore `?dark=true` was not established.

### Maps

Basemap darkened, data overlays untouched. Two candidate mechanisms, to be compared in the browser:

- **A: CSS filter on `.leaflet-tile-pane`** (`invert(1) hue-rotate(180deg)` plus brightness/contrast
  tuning). One rule covers all 15 call sites, follows a toggle with no JS, and cannot reach exports,
  since `print-map.js` draws tile images onto its own canvas, where a CSS filter does not apply.
- **B: CARTO `dark_all` tiles.** Better-looking by design, but needs a wrapper on `L.tileLayer` to
  rewrite URLs, re-point existing layers on toggle, and exempt the export map; plus a hash check
  that the key serves real `dark_all` tiles.

If the two look close, both are kept, with a switch so they can be compared.

### Charts (Vega) — superseded, see "Changed during the build" above

As first designed: `lib-vega.html` wraps the global `vegaEmbed` right after the bundle loads. In dark mode the wrapper
deep-merges a chrome-only config into a copy of the spec's own `config` (axis domain/tick/grid/label/
title colours, legend label/title colours, title and subtitle colour, view stroke, background).
Category, range and mark colours are never touched. The spec's own config is overridden for these keys
on purpose: a spec that sets `labelColor: "#545454"` would otherwise stay dark-on-dark.

- Exports: `print.js`'s `#printVis` embed is exempt, so the downloaded image stays light.
- Toggle while charts are on screen: the wrapper keeps the last arguments per container element and
  re-embeds each still-connected container on theme change. Where a caller relies on the returned
  view (signal listeners, the explorer's `chartEmbed`), that is checked per call site before relying
  on re-embedding; if a site breaks, it gets its own re-render hook instead.

### Datawrapper — superseded, see "Changed during the build" above

As first designed: a site-wide script sets `dark=true|false` on every `datawrapper.dwcdn.net` iframe's `src` at load and
on toggle (a toggle reloads those iframes, which is the documented mechanism).

### Images

Logos and diagrams that are dark-on-transparent are found by the sweep and given a light backing plate
in dark mode, never inverted.

## Verification

- **Light unchanged**: build the CSS on `production` and on this branch; the branch's CSS must begin
  with `production`'s byte for byte, with only the dark layer after it. Same for `head.html` output:
  the only additions are the inline script and the toggle.
- **Dark coverage**: a Playwright sweep that, in dark mode, lists visible elements with a light
  computed background (and text below 4.5:1 against its effective background), over the curated smoke
  page list. Positive control: the same sweep in light mode must report the page body.
- **Contrast**: axe `color-contrast` in dark mode on a sample, reading `incomplete` as well as
  `violations`.
- **No regressions**: `npm run lint`, `npm run smoke` (curated) on a server built from this tree,
  `characterize:site:sample`, which should show exactly `controls.button +1` per page from the toggle.
- **Exports**: download a chart and a map from the explorer in dark mode; both images light.
- **Toggle**: no flash on reload; toggle re-themes charts, Datawrapper and basemap without reload.

### Round 3 (Chris's review, 2026-11-17)

- **Inline text colours**: a static measurement of every inline `color:` in `content/` and the
  layouts (`inline-colors.py`) found 25 under 4.5:1 on the dark page. Keys to a chart, map or
  figure are lightened in their own hue to 5:1 on the surface (`lighten-keys.py`); a white plate
  keeping the exact colour was tried first and read as jarring (Chris). Plain greys take
  `--dm-muted`; two accents are lightened.
- **Vega series under 3:1 on the dark surface, any chart**: named blue, purple and black and five
  hexes (from the congestion pricing report), lightened the same way; translucent marks keep
  their opacity, so they are as faint as in light mode, not invisible. This closes the congestion-pricing and
  urban-heat-island gaps listed below.
- **Hover states**: a dark rule that sets a colour at rest must not outrank the hover rule that
  changes the fill. Subscribe, `.btn-outline-primary` and `.btn-outline-info` now set theirs at
  rest only; a hover sweep (`hover-check.mjs`) reads the same in both modes.
- **Tables**: DataTables' borders and stripes are black at low opacity, invisible on navy; set
  from the palette, stripe 7% white for both table kinds.
- **NR maps**: neighbour outlines and the selection recoloured for the dark basemap, scoped to
  the two NR maps (the explorer's black outline is half of a two-tone halo).

## Deliberately left light, and known gaps (2026-11-17)

Left light on purpose, because the fill carries meaning: the NR report's `.better` / `.middle` /
`.worse` pills, AQE's `.badge-better` / `.badge-medium`, realtime AQ's value bars, block-by-block's
`.pop` / `.dis` categories, and the yellow `btn-warning` / `badge-warning` accents. Each keeps dark
text. Datawrapper embeds: on a white plate while `DATAWRAPPER_FOLLOWS_THEME` is false; see round 2.

Gaps, not fixed:

- `/data-stories/housing/`: the map's SVG overflows its `.vega-embed` box and covers the "Who
  shoulders the burden of housing disrepair" heading; pre-existing, filed as audit N-134 (batch R24).
  In dark mode the transparent background shows the two overlapping.
- The explorer's view rail (white on `#1a954d` while hovered) measures 3.86:1 in both modes;
  not this branch's.
- The 2023 heat archive's orange key (`color:orange`) measures about 2:1 on white in light mode;
  on the dark page it passes.
- `static/` HTML pages iframed into content, and non-Datawrapper third-party iframes, stay light.
- The dark layer adds 76,765 B to the 291,442 B theme CSS, uncompressed (development build, after
  round 3). About half is the no-JS `prefers-color-scheme` copy of every rule; dropping that
  fallback would halve it.

## Left to the builder

Exact palette values (subject to the contrast checks), icon choice, toggle label text, filter tuning.
