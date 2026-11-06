# Data explorer: mobile layout, findings and options (2026-11-05)

Status: **decided 2026-11-05 — Stage 0, then Option C on phones; tablet layout to be tested** (see
Decision, below Recommendation). Nothing here is built. Once an option is chosen, the execution
plan and its ledger go in this file (or one beside it that this file links to).

Measured on `production` @ `b730ddf7d3`, `hugo serve --environment development` (Hugo 0.147.3),
Playwright Chromium with the window resized to 375×812 and 360×640. Page:
`/data-explorer/asthma/?id=2380` (CD, 2023). Screenshots are in the git-ignored `.playwright-mcp/`
folder at the repo root (`m-bar-viewport.png`, `m-bar-scrolled.png`, `m-expanded2.png`,
`m-none.png`, `m-table.png`, `m-trend.png`, `m360-trend.png`, `d-bar.png` for desktop,
`m-old.png` for the retired explorer).

**What this did not test.** A resized desktop Chromium is not a phone: it draws scrollbars, has no
touch input, and has no collapsing browser toolbar. Scroll chaining between nested scrollers under
touch, and how `100vh` behaves under iOS Safari's toolbar, are therefore unverified here. Both need
a real device (or BrowserStack) before any option is called done.

## How the phone layout works now

Below 960px (`lg` on this site) the explorer keeps its desktop structure — a full-bleed Leaflet map
with things floating over it — and re-positions the pieces:

- `#map` is `height: calc(100vh - 4rem)` (`assets/scss/_de-custom.scss:1056`).
- The indicator card (`.de-main-details`) is absolute at `top: 2rem` over the map. Its description
  and the Measure / Boundary / Time dropdowns are a collapsed `#detailsContent`, opened by the "+"
  (`themes/dohmh/layouts/partials/de-indicator-info.html:15-40`).
- The legend (`.de-legend`) is absolute at `bottom: 9rem` over the map.
- The view panel (`.de-tabs`) is `position: fixed` to the bottom of the screen, and its
  `.tab-content` is `max-height: 50vh; overflow-y: scroll` (`_de-custom.scss:704-734`). The tab bar
  under it is 64px.
- Tapping the active tab closes the panel (`overlay=none`), which leaves the map alone. That is the
  "map view"; there is no Map tab.

## Findings

Each one is a measurement from the run above unless it says otherwise.

| # | Finding | Measurement | Mechanism |
|---|---|---|---|
| F1 | Two scroll layers at rest, up to five in Table view | Page: 921px document in an 812px viewport. Panel: 713px of bar chart in a 406px pane. Table view adds `.dataTables_scrollBody` (484px visible, 5319px content, and 384px wide in 328px) and two 80px checkbox boxes (`#tableTimeCheckboxes` 80/491) | Page scroll: the 105px announcement banner sits above a map sized to `100vh - 4rem`; dismissing it took the document from 749px to 644px at 360×640. Panel: `max-height: 50vh` + `overflow-y: scroll`. Table: DataTables `scrollY: 500` (`assets/js/data-explorer/table.js:719`) |
| F2 | Scrolling the page does not scroll the panel | After `scrollTo` bottom (109px), the panel stayed at y=342–812; only the header, banner, card and map moved | The panel is `position: fixed`; the page scroll moves everything else under it |
| F3 | The panel takes over half the screen whatever it holds | 375×812: panel 470px (58%), top at y=342. The map shows in a ~170px strip (y≈173–342) between the banner and the panel | `50vh` + the 64px tab bar, not sized to content |
| F4 | Measure / Boundary / Time are under the panel when a view is open | Expanded, the three dropdowns sit at y=473–678; the panel covers y=342–812. `elementFromPoint` at each dropdown's centre returns something else | Card and panel overlap by position; the panel is on top (`.tab-content` `z-index: 10`) |
| F5 | The map legend is always under the panel when a view is open | Legend box y=600–668, panel y=342–812 | `bottom: 9rem` assumes a short bar, not a 470px panel |
| F6 | At 360×640 the panel cuts through the indicator title | Panel top y=256; "Change dataset" at y=277–304 is not tappable until the page is scrolled 109px, after which it is | F3 at a shorter screen |
| F7 | No close control on phones | The close button's wrapper is `d-none d-lg-block` (`themes/dohmh/layouts/partials/de-tab-content.html:117`), computed `display: none` at 360px. The `.closeTabPane` rule at `_de-custom.scss:736` matches no element; the template's class is `close-tab-pane` | Re-tapping the active tab is the only way to reach the map or the dropdowns, and nothing says so |
| F8 | Charts are taller than the pane | Bar: 550px chart in a 405px pane. Trend: 536px in 405px, so its x-axis is below the fold. Save / Cite / Download sit at y≈1009, inside the pane's scroll | Charts are sized for the desktop panel's height |
| F9 | Table clips its fourth column | Rate column cut at the right edge in `m-table.png`; table 384px in a 328px body | Horizontal scroll nested inside two vertical ones |
| F10 | The "+" reports `aria-expanded="false"` while open | One click: `#detailsContent` gets `collapse show` (382px tall), the button still says `false`, and the icon stays "+" | Not traced. The header row (`.mobile-details-header`, `cursor: pointer`) and the button both look like toggles; whether a second handler resets the attribute is the first thing to check |

Related audit rows, read 2026-11-05 in `documents/site-wide-audit-2026-10.md`: A-158 (OPEN) says the
mobile `padding-bottom` rule meant to leave room for the bottom bar compiles to
`.de-wrapper .de-wrapper` and matches nothing; A-308 (FIXED by `082cd56d40`) is why 720–959px also
gets this phone layout; N-106 (OPEN) is the duplicated mobile/desktop dropdown markup, which
Options C and D below would touch. None of F1–F10 has its own row.

For comparison, the retired explorer at `/data-explorer-old/` at 375×812 is one page scroll (a
3570px document) with a single nested scroller, its DataTables body.

## Options

All four keep the desktop layout as it is; every change is scoped below 960px.

### Stage 0: fixes every option needs (do first, whichever is chosen)

These are prerequisites rather than an option: none of B–D works well without them, and none
conflicts with any of them.

1. Stop the page itself scrolling: size `#map` to the space actually left, rather than to
   `100vh - 4rem`. The cheapest form is making the explorer's wrapper a flex column of
   `100dvh` (falling back to `100vh`) with the map as `flex: 1`, so the banner takes space from the
   map rather than adding to the document. `dvh` is the CSS unit that tracks a collapsing mobile
   toolbar; browser support was not checked for this document and needs checking before use.
2. `overflow-y: auto` instead of `scroll` on the mobile `.tab-content`, so a scrollbar appears only
   when there is something to scroll.
3. Delete the dead `.closeTabPane` rule (F7) and fix A-158's dead padding rule, or delete it if the
   chosen option makes it unnecessary.
4. Fix F10 so the toggle's state is announced.

Cost: CSS plus one small JS fix. Fixes F1's outer layer and F6's "only reachable by scrolling".
Does not fix F3–F5.

### Option A: keep the overlay, fix the collisions

Keep map-behind-panel, but make the pieces respect each other.

- Give the panel a visible close/minimise handle on phones (un-hide the existing close button, or a
  drag-handle bar at the panel's top edge that toggles it).
- Cap the panel at the space below the card rather than at `50vh`: publish the panel's height as a
  CSS custom property from JS (one `ResizeObserver`) and set the legend's `bottom` and the card's
  `max-height` from it, so neither can sit under the panel.
- When the "+" opens the details, close the panel (or vice versa), so the dropdowns are never
  under it.
- Table: drop DataTables' `scrollY` below 960px so the pane is the only vertical scroller.

Fixes: F4, F5, F7, F9's double vertical scroll. Leaves: F3 (the map is still a strip whenever a
view is open) and F8 (charts still taller than the pane). Cost: small. Risk: the most JS-coupled
of the four, since three elements would size off one measured height.

### Option B: bottom sheet with three heights

Turn the panel into a sheet with explicit states, cycled by tapping a handle (dragging optional):

- **Peek**: only the tab bar and the chart title; the map and the card get the screen.
- **Half**: today's layout, with the legend and card constrained as in Option A.
- **Full**: the sheet covers the map below the header; the view gets the whole height, and the
  sheet is the only scroller.

Fixes: F3 (the user picks the balance), F7, F8 (full height fits the charts), and F4/F5 in peek and
full. Cost: moderate, mostly CSS states on `.de-tabs` and a small handler beside the existing
`overlay` URL state; drag gestures add more. Risk: three states to test across five views, and
"half" still carries every Option A collision rule.

### Option C: stacked page on phones (no overlay)

Below 960px, drop the floating layout and let the page flow, as the retired explorer does:
header → indicator card with its dropdowns always visible → map at a fixed height (about half the
screen) with the legend under it, not over it → a sticky tab bar → the active view, full width, in
the page.

Fixes: F1 (one page scroll), F3, F4, F5, F6, F7 (nothing to close; the map is always there), F8
(views get their natural height). Cost: mostly CSS, plus changing what `overlay=none` means on
phones. Risk: a map inside a scrolling page traps the scroll gesture when a finger lands on it.
Leaflet's `dragging` and `tap` options can turn one-finger panning off on touch devices, but which
options suit Leaflet's installed version was not checked. Also removes the side-by-side map/chart
hover link on phones, which a phone cannot do with hover anyway.

### Option D: the map becomes a tab

Make every view, the map included, full-screen between a compact top bar and the existing bottom
tab bar. Add a "Map" tab on phones (today it's the "no panel open" state). The indicator card
shrinks to a one-line title with "Change dataset", and the Measure / Boundary / Time dropdowns move
into a sheet opened from that title bar ("Filters"), shown above whatever view is active.

Fixes: F1–F9 by construction, since nothing floats over anything else and each view has one
scroller. Cost: the largest of the four. A sixth tab has to fit in the bar, which at 375px is
already six 60–66px items including Data Sources and Take Action; the overlay URL state needs a
`map` value; and the dropdown markup moves, which overlaps N-106. Risk: a reworked mental model
for phone users who have learned the current one; the URLs keep working.

### Comparison

| | Scroll layers (Bar view) | Map visible while a chart is open | Dropdowns reachable with a view open | Size |
|---|---|---|---|---|
| Today | 2 | ~170px strip | No | — |
| Stage 0 only | 1 | ~170px strip | No | Small |
| A | 1 | strip | Yes (card and panel exclude each other) | Small |
| B | 1 | user's choice (peek/half/full) | In peek and full | Moderate |
| C | 1 | scroll up to it | Yes, always | Moderate |
| D | 1 | no — one tab at a time | Yes, from every view | Largest |

## Recommendation

Stage 0 first in any case. After it, **C** is the one I'd pick: it fixes every finding except F10
(which Stage 0 covers) and the table's width (F9's clipped column, which needs its own decision
under any option: horizontal scroll, fewer columns on phones, or stacked rows), it has a working precedent in this repo (the retired explorer's single page
scroll), and it is mostly CSS scoped below 960px, so the desktop layout and its harness baselines
are untouched. D is the cleaner end state but costs the most and needs a decision on the sixth tab.
A is the cheapest fix but leaves the map as a strip, which is half of the complaint. B sits between
them and is worth choosing if keeping map-and-chart on one screen matters more to the team than
simplicity.

Decision needed: which option, and whether 720–959px (tablets) should get the same treatment or
something in between, since A-308 put them on the phone layout.

## Decision (Chris, 2026-11-05)

- **Phones: Stage 0, then Option C.**
- **Tablets (720–959px): keep the map and the active chart on one screen, if that isn't too
  cluttered; settle it by testing.** Not yet decided which layout does that. Before A-308's fix
  (`082cd56d40`) this range got the desktop side panel at 38% width, which left charts 172–275px
  wide and clipped titles, axis numbers and the correlate chart, so "the desktop layout" is not
  one of the candidates. Three that are:
  - **T1, two columns:** map on the left, active view on the right, each about half the width
    (~360–480px of chart, the width the views already handle on phones). The dropdowns stay in
    the card above the map.
  - **T2, stacked but sized to fit:** Option C's order, with the map's height chosen so the map
    and the top of the active view both fit in a portrait screen (768×1024).
  - **T3, today's overlay with Option A's collision fixes,** kept for this range only.

  The test: at 768×1024 and 1024×768 (plus one current tablet's viewport, read off a real device), build
  T1 and T2 as CSS-only prototypes and check, for each of the five views, that the chart's own
  width is at least what it gets at 375px, that nothing is clipped, and that there is one
  vertical scroller. T3 is the fallback if neither reads as uncluttered.

## How the chosen option would be verified

- Re-run this document's own probes at 375×812 and 360×640 for each of the five views: count
  scroll containers with `scrollHeight > clientHeight`, and hit-test every dropdown, the legend and
  "Change dataset". Pass: one vertical scroller per view, every hit-test lands on its own element.
- A real phone (iOS Safari and Android Chrome) for touch scroll chaining and toolbar collapse.
- `npm run smoke` and `npm run characterize:site:sample`: the explorer pages' recorded structure
  will move (controls, overflow), so expect a re-baseline of the explorer pages only, and check that
  no other page kind moved.
- `node scripts/de-characterization.mjs --check` for the three baselined indicators.
