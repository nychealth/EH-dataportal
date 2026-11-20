# Dark mode — implementation plan (2026-11-17)

> Status is kept in this file's `## Ledger` section only, per `keep-ledger`. The checkboxes in the
> tasks are not status. Executor: Claude, inline, overnight (Chris, 2026-11-16: "design doc, then
> build"). The overnight build and rounds 2 and 3 were kept uncommitted until Chris's review
> (Chris, 2026-11-16: "work only, no commits"); the Commit column names where each landed.

**Goal:** a dark theme for the whole portal: OS-following with a header toggle; charts, maps and
Datawrapper included; data colours, print and exports unchanged.

**Architecture:** one appended SCSS partial of dark-only rules on CSS custom properties; an inline
head script owning theme state; small runtime adapters for Vega (config merge in `lib-vega.html`),
Leaflet (tile-pane treatment) and Datawrapper (`dark=` URL flag).

**Spec:** [dark-mode-design-2026-11-17.md](dark-mode-design-2026-11-17.md).

## Global constraints

- Light mode unchanged: compiled `theme.scss` output on this branch begins with `production`'s byte
  for byte; every dark rule is under `@media screen` and a dark selector.
- Data colours untouched: no override of Vega `range`/scheme/mark colours, no filter on Leaflet
  overlay panes.
- Exports and print light.
- Text contrast AA in dark mode (4.5:1 body, 3:1 large text and UI graphics).
- Browser JS: classic scripts, no new dependencies (project CLAUDE.md, Coding conventions).
- JS style: `documents/js-conventions.md` (4-space, orientation comments, generous whitespace).

## Review focus

1. Storage blocked (private window / site data off): `localStorage` throws; the page must still follow
   the OS and the toggle must still work for the page's lifetime. Owner: Task 1.
2. Toggle with charts already drawn, especially the explorer, whose `DE.print.chartEmbed` and trend/bar
   views hold the returned view. Owner: Task 4.
3. Export while dark: explorer chart PNG/SVG and map PNG must come out light. Owner: Tasks 4 and 5.
4. OS flips while the page is open with no stored choice: page follows; with a stored choice it doesn't.
   Owner: Task 1.
5. Print emulation in dark mode reads exactly as light print. Owner: Task 2.

## Files

- Create `assets/scss/_i-dark-mode.scss`: palette tokens and all dark overrides.
- Modify `assets/scss/theme.scss`: append `@import "i-dark-mode.scss";` as the last line.
- Modify `themes/dohmh/layouts/partials/head.html`: inline theme-state script, first thing in the file
  after the GA block.
- Modify `themes/dohmh/layouts/partials/header.html`, `header-de.html`, `header-ds.html`: toggle button
  in `#nyc-top-header`.
- Create `assets/js/theme-adapters.js`: toggle wiring, Datawrapper flag; loaded from `js_bottom.html`.
- Modify `themes/dohmh/layouts/partials/lib-vega.html`: inline `vegaEmbed` wrapper after the bundle.
- Modify `assets/js/data-explorer/print.js` only if Task 4 finds the export embed needs an explicit
  opt-out.

## Task 1: Theme state and toggle

**Interfaces — produces:** global `ehdpTheme` with `current(): 'light'|'dark'`, `set(mode)`,
`onChange(fn)`; `<html data-theme="light|dark">`; event fired to `onChange` subscribers with the new mode.

- [ ] Inline script in `head.html`; storage access in `try`.
- [ ] Toggle button in the three headers, `aria-pressed`, label "Dark mode" / icon.
- [ ] Verify (browser): fresh profile with `colorScheme: 'dark'` emulated → `data-theme="dark"` before
  first paint (read in an `addInitScript`-free page via `document.documentElement.dataset.theme` on
  `DOMContentLoaded`); click → light, reload → still light; storage blocked → no console error.

## Task 2: Page chrome

**Consumes:** `data-theme`. **Produces:** `_i-dark-mode.scss`, its `dark` mixin and `--dm-*` tokens.

- [ ] Mixin + tokens + root/body + Bootstrap component overrides.
- [ ] Sweep: dark-mode light-panel probe over the curated smoke pages (script under
  `scripts/.sc-rebaseline/dark-mode/`); iterate until findings are only intended (images, data).
- [ ] Verify: CSS-prefix proof (build CSS on `production` and here, compare prefix); print emulation
  `innerText` identical in light and dark.

## Task 3: Maps

- [ ] Variant A (tile-pane filter) in SCSS; screenshot the explorer map, NR report map, realtime AQ.
- [ ] Variant B (CARTO `dark_all`) probe: fetch one keyed and one keyless tile, hash; decide or keep
  both behind a switch.
- [ ] Leaflet controls, popups, tooltips, legends dark.
- [ ] Verify: explorer map export PNG light in dark mode.

## Task 4: Charts (Vega)

**Consumes:** `ehdpTheme`. **Produces:** wrapped global `vegaEmbed`, same signature and return.

- [ ] Wrapper with chrome-only config merge; exempt `#printVis`.
- [ ] Re-embed on toggle; check explorer, NR report chart, a data story `vega` shortcode.
- [ ] Verify: chart export PNG light in dark mode; no console errors on toggle.

## Task 5: Datawrapper and iframes

- [ ] `theme-adapters.js`: rewrite `dark=` on `datawrapper.dwcdn.net` iframes at load and on change.
- [ ] Verify: a heat-report page; iframe `src` carries `dark=true` in dark, `false` after toggle.

## Task 6: Regression checks

- [ ] `npm run lint`; `npm run smoke` against a server from this tree; `characterize:site:sample`
  expecting only the toggle's `controls.button +1`; axe `color-contrast` in dark mode on a sample.

## Ledger

**Status as of 2026-11-17:** done. Tasks 1–6 and review rounds 2 and 3 landed in
`feature-dark-mode @ 2ef8005b26`; the characterization re-baseline in `@ a0c907cba8`. Whether
the branch is pushed: `git rev-list --left-right --count origin/feature-dark-mode...HEAD`; whether
a PR exists: `gh pr list --head feature-dark-mode`.
Cumulative patches: `scripts/.sc-rebaseline/dark-mode/patches/<nn>-<name>/` (git-ignored), each a
`git diff production` (`tracked.patch`) plus copies of the untracked files (`new/`). Tasks 4 and 5
changed design; see the design doc's "Changed during the build".

All browser proofs ran against `hugo serve --environment development --port 8080` from this tree
(`/dev-prod/`), production data. Instruments, all under `scripts/.sc-rebaseline/dark-mode/`:
`dark-probe.mjs` (dark-mode light-panel and contrast sweep, 42 pages incl. four explorer views;
`--light` is its positive control) and `css-prefix-check.mjs`.

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Theme state and toggle | `feature-dark-mode @ 2ef8005b26` | **Built 2026-11-17** | Playwright, `/about/`: OS dark → `data-theme=dark`, `aria-pressed=true`; click → light, stored `light`, body `#fff`; reload → light; stored choice ignores an OS flip; Enter on focused button toggles; no stored choice + OS flip → follows live; `Storage` methods throwing → follows OS, click works, 0 page errors; JS disabled + OS dark → no attribute, body `rgb(13,21,48)`. 375px: bar 40px (64px before the icon-only change), button 24×24, a11y tree `button "Dark mode" [pressed]` |
| 2 | Page chrome | `feature-dark-mode @ 2ef8005b26` | **Built 2026-11-17** | `css-prefix-check.mjs` on two isolated `development` builds (production worktree `8993a4fc5d` vs this tree): production's 291,442 B theme CSS is an exact prefix of the branch's 341,879 B; only `.theme-toggle` and `.theme-toggle-icon-light` sit outside a dark scope; control (arguments swapped) exits 1. Print emulation: light and dark full-page screenshots byte-identical on home, NR report, housing story, with `data-theme=dark` and body still `#fff`. Probe sweep: see row 6 |
| 3 | Maps | `feature-dark-mode @ 2ef8005b26` | **Built 2026-11-17** (variant A only; superseded by R2-4's CARTO `dark_all`, which is what landed) | Screenshots: explorer CD choropleth, FVI (voyager), NR report map. Explorer "Save map" PNG from a dark page: 1920×1330, 83.4% light pixels, 0.1% dark |
| 4 | Charts | `feature-dark-mode @ 2ef8005b26` | **Built 2026-11-17** (CSS, no wrapper) | Bar view: axis label fill `rgb(227,230,238)`, mark fill unchanged `rgb(232,229,26)`; `myVegaView.toImageURL('png')` from a dark page: corner `#fff`, 74% white, 0.1% dark |
| 5 | Datawrapper | `feature-dark-mode @ 2ef8005b26` | **Built 2026-11-17** (stays light, plate; superseded by R2-1 and R3-10: Datawrapper dark, which is what landed) | `?dark=true` vs `false` on `OEVex/6` screenshotted: palette reversed, classes 4/5 merge → switched off. With the switch on (tested before turning off): script embeds re-render in place on toggle, 32 containers, 0 duplicate ids, cell text `#ececec` ↔ `#333`. "invalid container dimensions" warnings: 69 on a plain load in light and in dark, twice each |
| 6 | Regression checks | *n/a* | **Run 2026-11-17** | `npm run lint` exit 0; `node --check` on `theme-adapters.js` and on the extracted 64-line head script, exit 0. `DE_BASE_URL=…/dev-prod/ npm run smoke`: PASSED, 44 pages (light; Pagefind absent, allowlisted). `npm run characterize:site:env prod_prod sample`: FAILED as predicted, 39 of 39 baselined pages differ in exactly `controls.button` +1, `assets` +`js/theme-adapters.js`, `assetsWithIntegrity` +1; the other 2 of 41 have no baseline record and their captures carry the script; EHDP-data unmoved. `axe-contrast.mjs` (10 pages, both schemes, control fired both): 0 violations light, 0 dark; incomplete 391 in each, page for page equal. Final `dark-probe.mjs` (42 pages, blending translucent layers; light control flags `body`): 0 uncaught exceptions; remaining light panels are the intended ones listed in the design doc's follow-ups; text findings 0 after the popup-note fix (re-probed on its 4 pages) |

**Re-baseline: done 2026-11-17, `feature-dark-mode @ a0c907cba8`.** Both keys re-captured at
`2ef8005b26` with `site-characterization-rebaseline.mjs --expect "**" --expect ""` (exit 0, 840
of 840 pages per key). Field tally against the previous capture (`baseline-field-tally.py`):
`controls.button` +1 on 798 pages and +2 on 42 per key, all 42 under `data-explorer/`; `assets`
+`js/theme-adapters.js` and nothing else on all 840; `assetsWithIntegrity` +1 on all 840; and
`content.internalTargets` on `data-stories/racial-wealth-gap/` (.png → .webp), from
`54242a5922`, merged after the previous capture at `e8fe4a3c4d`.

### Round 2 (Chris's review, 2026-11-17)

Chris's requests from reviewing on his own `local_prod` server: Datawrapper dark to look at; the
toggle "might" be wanted visible in the explorer; the housing-story overflow into the audit; CARTO's
dark tiles; a darker scrollbar; breadcrumbs matching the page (options welcome); bottom home cards
standing out more and section cards' trailing padding; nav dropdown text and the explorer's
selected measure too dark; the citywide (trend) and dark blue (correlate) series too dark.

Environment: round 2's browser proofs ran against an isolated server, `HUGO_RESOURCEDIR` and `-d`
in the session scratchpad, `--environment development --port 8095` (`/dev-prod/`). The overnight
`:8080` server was stopped at the start of the round: Chris's own `local_prod` server on `:8081`
builds from this same tree, and the two were writing the same `docs/` (`:8080` was serving pages
whose assets pointed at `/local-prod/`). Cumulative patches 04 and 05 are beside 01–03.

| # | Item | Commit | Status | Proof that ran |
|---|---|---|---|---|
| R2-1 | Datawrapper dark switch on, for review | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** — kept on (Chris, R3-10) | `dw-check.mjs` (heat report, redlining, air-quality-snapshots): every iframe `dark=true` and script `data-dark="true"` at load; the 5 hidden-tab charts on each story `dark=true` once opened; all `false` after a toggle to light and `true` again; plate transparent; 0 duplicate ids, 0 page errors. `dw-luma.mjs` over the 44 Datawrapper pages that resolve: 117 of 158 embeds draw dark, 41 light, 0 between (`dw-luma-1.txt`). Data recoloured where dark (heat report Fig. 1, screenshots `shots/dw-0-*.png`) |
| R2-2 | Toggle visible in the explorer's own bar | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `round2-check.mjs`: 2 toggles on the explorer, `aria-pressed` in sync, a click on the bar's toggles the page, 0 page errors. Label from lg: at md it ran into the title ("AsthmaDark mode", screenshot); bar height with and without the button equal at 375, 414, 720, 960, 1100, 1280 (a long title already wraps the bar's buttons at 960–1100, with or without it) |
| R2-3 | Housing-story overflow into `site-wide-audit-2026-10.md` | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** — N-134, P1, new batch R24; renumbered N-137 in the 2026-11-20 merge of `production`, whose own N-134 (CARTO quota) landed first | Measured on the live site (`housing-overflow.mjs`, output `housing-overflow-live.txt`): embed 550px, SVG 730px, `elementFromPoint` at the heading's centre hits an SVG `path`; control heading hits itself. `audit-recount.py` reproduced `HEAD`'s table first, then reads OPEN 1/37/137/5 = 180 and every batch OK, 38 ids = 38 open P1/P2 |
| R2-4 | CARTO dark basemap replacing the tile filter | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Hook in `lib-leaflet.html` (all 16 Leaflet templates include it), `keepLightBasemap` in `print-map.js`, filter narrowed to `.basemap-filtered`. `curl`: the site's key serves `dark_all` (keyless control returns the placeholder). `basemap-check.mjs` on the isolated :8095 server: explorer, NR report, NR index, heat story, realtime AQ load only `dark_all` in dark, their light style after a toggle, `dark_all` again; proximity's MapTiler keeps the filter; explorer export from a dark page 92.1% light pixels. Heat story with "Morning heat index" on: the georaster draws in the tile pane (4 canvases), unfiltered in dark — the overnight build's whole-pane filter would have inverted it |
| R2-5 | Darker scrollbars | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Computed `scrollbar-color` on `<html>`: `rgb(52, 64, 107) rgb(13, 21, 48)`. How Chris's Chrome draws its overlay scrollbars with it was not observed |
| R2-6 | Breadcrumb background | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** — transparent; not an a11y need | Breadcrumb bg `rgba(0,0,0,0)`; its text 8.13:1 (link) and 8.32:1 (current) on the page |
| R2-7 | Home cards: bottom row contrast, section cards' trailing fill | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `content-card-check.mjs`: 105 cards on 11 page kinds, nothing visible outside `.card-content` (control: an injected element is found). Home: outer card transparent, inner `rgb(21,30,61)`; bottom cards `rgb(28,39,80)` on the `rgb(21,30,61)` band, stripe `rgb(0,137,57)` |
| R2-8 | Nav dropdown text, explorer selected measure | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17**, plus the map popup | `round2-check.mjs`: Topics and Explore menus min 11.56:1 (were `#212529` on the menu); selected measure `#4cc47a` on `#26325f`, 5.57:1; map popup min 6.67:1, header `rgb(38,50,95)` (was light) |
| R2-9 | Dark data series lightened in charts (departs from "data colours identical", by request) | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `chart-colors.mjs` dark: `#000000ff` → `rgb(227,230,238)`, `#374c80` → `rgb(125,147,214)`, `#000F89` → `rgb(124,140,255)`, trend ticks `black` → `rgb(169,176,198)`; light control: 31 of 31 hex-attribute marks painted as their attribute |
| R2-10 | Regression checks re-run | *n/a* | **Run 2026-11-17** | `npm run lint` exit 0; `node --check` on `theme-adapters.js` and `print-map.js` 0. Smoke against :8095 PASSED, 44 pages. `dark-scope-check.py` on the served CSS: production's 291,442 B prefix ends at its last DataTables rule; of 302 rules after it, only `.theme-toggle` and `.theme-toggle-icon-light` lack a dark selector (other SCSS untouched since the overnight prefix proof: `git diff --stat production -- assets/scss` is theme.scss +3, identical to patch 03). `dark-probe.mjs` 42 pages: 0 uncaught exceptions; light panels by rule 12 → 11, text 2 → 1 (the known urban-heat-island inline grey). `characterize:site:env prod_prod sample`: FAILED as predicted, 39 of 39 in `assets`, `assetsWithIntegrity` and `controls.button` (+1 on 37 pages, +2 on the 2 explorer pages) |

### Round 3 (Chris's review, 2026-11-17)

Chris: "make sure all of these aren't present other places", so each item gets a sweep for its
other instances, not only the page he named.

| # | Item | Commit | Status | Proof that ran |
|---|---|---|---|---|
| R3-1 | Home "Get updates" / "Find what you need" cards: lighter background | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Plain `div.card-left-border` (not `.card`) → `rgb(21,30,61)`, stripe green (`round3-check.mjs`) |
| R3-2 | Subscribe button: hover effect | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** — was a regression of round 1 | Round 1's dark fill outranked Bootstrap's yellow hover. Now rest: navy fill, text `rgb(227,230,238)`; hover: `rgb(255,193,7)` fill, text `rgb(33,37,41)` |
| R3-3 | Text under a Datawrapper chart too dark (food-safety-101) | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `.figure-caption` was `#212529` → `rgb(169,176,198)` |
| R3-4 | Toggle: label standard (question); label shifts because the icons differ in width | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** (`fa-fw`); standard answered in the report | Label left edge identical in both modes: header 919.2px, explorer bar 688.9px |
| R3-5 | Explorer: unselected disparities pill; correlate dropdown's selected item | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Pill `rgb(61,74,122)` + inset outline, text 6.84:1; correlate menu `.active` (a second copy of the `.is-selected` style, `de-tab-content.html`) `rgb(76,196,122)` on `rgb(38,50,95)` |
| R3-6 | Tables: inner borders invisible, row shading indistinguishable | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | DataTables borders `rgb(52,64,107)`, odd rows inset `rgba(255,255,255,0.07)`, even none; Bootstrap `.table-striped` 4% → 7%. Screenshot `shots/r3-explorer-table.png` |
| R3-7 | NR map too dark, lines too thick; NR rows too light | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17**, basemap choice to Chris | Rows `transparent` (were `--dm-raised`). Map overlay: 41 outlines `black` → `rgb(169,176,198)`, selection `#008939` → `rgb(76,196,122)`, scoped to `#nr-map` and the new `.nr-uhf-map` class on `nr-leaflet.html`. The thick lines are CARTO's roads (voyager's are as thick in light): four treatments screenshotted, `shots/r3-nr-map-{A,B,C,D}.png` |
| R3-8 | Other instances of each (sweep) | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `dark-probe.mjs` over 119 pages (all stories, features, topics, about, resources, take-action; 3 of each repeated template; lists `sweep-r3-list-*.txt`): found and fixed pagination, `code`, `.text-info`, a plain `.btn`, inline greys. `inline-colors.py` (static, every inline text colour in `content/` and the layouts): 25 under 4.5:1 on the page; keys plated, greys muted, accents lightened. `hover-check.mjs` (273 controls, 12 pages, both modes): found the Subscribe text, `.btn-outline-primary`/`-info` hover text and the active nav pill; after fixes dark = light, 9 each, all the explorer view rail at 3.86:1, which is the same in light |
| R3-10 | Decisions: NR basemap A; Datawrapper dark kept, without the page reflowing on a toggle | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Chris: basemap A ("the original base map is fine"); Datawrapper dark kept ("i like the look"), but a toggle re-laid out the page. Measured (`dw-shift.mjs`): script embeds collapse to 0–60px while re-rendering (8 of 9 on the heat report), iframes do not. CSS cannot re-theme them (iframes are cross-origin; script embeds are an open shadow root, but the theme is a render flag, and setting `renderFlags` on the element changed nothing). Fix: `holdHeight` in `theme-adapters.js` keeps each chart's space until the new copy draws. A/B with the patch-07 file served in its place, interleaved twice: heat report footer moved 98px / 98px old, 0px / 0px new; food-safety 0px in all four |
| R3-11 | Congestion pricing sticky heading (Chris); same class of state elsewhere | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | Stuck bar was `rgba(255,255,255,0.94)` from the template's own `<style>`, applied only on scroll → navy; `#site-name` taken off the R3-8 plate (a white box in the heading) and lightened, `rgb(124,140,255)`. Sweep: every light background in a template or content `<style>` block listed (27), each state that appears only after an interaction triggered: AQE `.sourceBox:hover` and realtime `.location-row:hover` were light under light text → `--dm-hover`; the CP map legend was already dark; the heat story has no layers control. Screenshot `shots/r4-cp-sticky.png` |
| R3-12 | Inline key colours: lightened in their hue instead of a white plate (Chris: plates "a little jarring") | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | `lighten-keys.py`: each of the 14 hex keys plus named blue/green at its hue's lowest lightness reaching 5:1 on `--dm-surface` (5.51–5.75:1 on the page); round 1's `.badge-light[style*=color]` light fill removed too (its two colours, `#00694D` and `#A93200`, are in the list; no JS builds such badges). Compiled rules present in the served CSS |
| R3-13 | Congestion pricing charts: dark marks too hard to see (Chris) | `feature-dark-mode @ 2ef8005b26` | **Done 2026-11-17** | In-page sweep of every Vega mark, opacity blended over `--dm-surface`: 9 colours under 3:1 (named blue, purple, black; `#9b2c2c` `#276749` `#2b6cb0` `#9c179e` `#545454`), opaque marks 1.44–2.43:1. After: no opaque mark under 3:1; translucent bars (20–50% opacity) 1.36–2.27:1, as faint as in light mode (black at 20% on white is 1.6:1). Rules apply to every Vega chart's marks and legend symbols. `dark-scope-check.py`: 410 rules past production's 291,442 B prefix, 2 without a dark selector (the toggle's) |
| R3-9 | Regression checks | *n/a* | **Run 2026-11-17** | lint 0; smoke PASSED 44 pages; 119-page probe: text findings only the explorer legend label on its gradient (probe cannot read gradients); page errors on food/ and assaults/ (`5000ms timeout exceeded`) occur equally with `theme-adapters.js` blocked (`pageerror-ab.mjs`, 3 of 3 loads each arm) and in light mode, so not from that script; not compared with a production build |

Next command: none in this plan. Pushing `feature-dark-mode` and opening a PR into `production` is
Chris's call; CI then runs the full smoke and characterization sweeps against these baselines.
