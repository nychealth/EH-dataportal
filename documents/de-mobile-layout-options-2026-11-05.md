# Data explorer: mobile layout, findings and options (2026-11-05)

Status: **decided 2026-11-05 — Stage 0, then Option C on phones; tablet layout to be tested** (see
Decision, below Recommendation). The execution plan and its ledger are the last section,
[Execution plan](#execution-plan).

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
| F10 | The "+" reports `aria-expanded="false"` while open | One click: `#detailsContent` gets `collapse show` (382px tall), the button still says `false`, and the icon stays "+" | Timing points at the "backup" click listener in `assets/js/data-explorer/de-tab-content.js` (the "mobile accordion" block), which re-reads `.show` 100ms after a click. Bootstrap's collapse is still `collapsing` then, so the listener writes `false` and swaps the icon back to "+" `[verified 2026-11-05: aria-expanded true at +0 and +50ms, false at +110ms with the class still "collapsing", "collapse show" by +410ms]`. Removing the listener is the test (Task 1) |

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

## Execution plan

### Ledger

**Status as of 2026-11-06: Tasks 1–5 done, `c1801a007b`..`b32e6b5a7f`; Task 7 done (T2, reworked
into a pinned map), `c5c4a1a225` and `ddb619e114`; Task 6 needs a phone, on the CloudCannon preview;
Task 8 partly run. Q1 still open.** Work branch: `feature-de-mobile-layout`, cut from
`docs-de-mobile-layout-options` (which holds this document) so the plan and the code reach
`production` in one PR.

**How Tasks 1–5 were committed.** They ran overnight on one working tree and were committed
afterwards, on Chris's go. The cumulative diff against `9fa5fd7402` had been saved after each task
as `scripts/.sc-rebaseline/de-mobile/after-task-N.patch` (git-ignored, so on this machine only),
beside copies of the two new files and every probe output cited below. Each commit's tree was
built by `git apply --cached` of that patch onto `9fa5fd7402` in a temporary index, excluding this
document, plus the new files that task had; this document's edits land in the ledger commit
after them. Task 5's tree equals the working tree that the proofs ran on `[verified 2026-11-06:
git diff --stat <task-5 tree> outside this document, empty; cmp of both new files against their
saved copies]`.

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Fix the "+" toggle's `aria-expanded` (F10) | `c1801a007b` | **DONE 2026-11-06** | `[verified 2026-11-05: npm run lint exit 0; served de-tab-content.625c5a2eea46acdf.js contains the jQuery listener; at 375×812, aria-expanded/icon read false/plus at load, true/minus at +0, +110 and +410ms after the toggle, false/plus after closing, true/minus after a tap on the header bar]` |
| 2 | Phone-layout probe script, run against today's tree as its control | `48e266267c` | **DONE 2026-11-06** | `[verified 2026-11-06: node --check clean; probe-task2-control.txt: exit 1, 9 of 10 FAIL. 375×812 bar/trend/correlate/table: scrollers page + #v-pills-tabContent, Measure/Boundary/Time/Legend covered; 360×640 the same plus Change dataset covered even after scrollIntoView (F6); 375 none PASS, so the probe can pass; 360 none FAIL on Boundary covered (unpredicted; the control value)]` |
| 3 | Stage 0 CSS: `overflow-y: auto`, dead rules | `64913f49f9` | **DONE 2026-11-06** | `[verified 2026-11-06: served theme CSS before → after: ".de-wrapper .de-wrapper" 1 → 0, "closeTabPane" 1 → 0, new fingerprint; #v-pills-tabContent computed overflowY "auto" at 375×812; probe-task3.txt byte-identical to the control, as predicted]` |
| 4 | Reorder the explorer shell's DOM to card → map → legend → views (desktop unchanged) | `47f753af9f` | **DONE 2026-11-06** | `[verified 2026-11-06: legend block moved verbatim (diff of HEAD's lines 158–188 against de-legend.html: none); served order card, #map, legend, tabs; desktop 1280×800 screenshots of none/bar/table, tiles hidden, sha256 identical before (twice) and after; control: a 1px legend nudge changed all three hashes; desktop tab order: the map's 5 stops moved as one block from after the view panel to after the card's Save map/Cite, nothing else moved; npm run smoke (curated) 44/44 clean; phone probe rows unchanged]` |
| 5 | Option C phone layout below 720px | `b32e6b5a7f` | **DONE 2026-11-06** | `[verified 2026-11-06: probe-task5-a.txt exit 0, 10/10 PASS, scrollers=[page] on every view except table (plus its allowed scrollers); legend, card and "+" inside the 375px viewport by bounding box; every view's end meets the tab bar's top edge when scrolled to the bottom (64px padding = 64px bar); 768×1024 and 1024×768 probe rows identical to Task 4's; 719px PASS, 720px keeps today's layout; desktop hashes identical; smoke curated 44/44; screenshots .playwright-mcp/c-<view>-<size>.png]`. Q1 still open |
| 6 | Real-phone check: scroll gestures over the map, table scroller | — | BLOCKED on Chris's phone | — |
| 7 | Tablet prototypes T1 and T2, then Chris picks | `c5c4a1a225`, `ddb619e114` | **DONE 2026-11-06**: Chris picked T2, then asked for the whole city on the map, no blank space under it, and an open view that covers part of the map rather than shrinking it; see Task 7's Decision | `[verified 2026-11-06: npm run lint exit 0; de-mobile-probe.mjs at 375x812 360x640 768x1024 900x1200, 20/20 PASS (probe-sheet.txt); with no view open the legend meets the tab bar and the page does not scroll at all four sizes, and the whole city is inside the map (fit-sheet.txt); tab taps at 375x812 switch the overlap 0/227/0/227px and the map stays pinned after a 300px scroll (sheet-toggle.txt); zoomed to 12 on Harlem, opening and closing bar keeps zoom 12 and Harlem within 2px of the visible middle, while an untouched map re-fits (keep-zoom.txt); desktop screenshot hashes equal Task 4's (desk-sheet.txt)]` |
| 8 | Harnesses, re-baseline if needed, PR | — | Partly run 2026-11-06 on the Task 5 tree | `[verified 2026-11-06: npm run lint exit 0 (Task 1); node scripts/de-characterization.mjs --check PASSED against production/; node scripts/characterize-env.mjs prod_prod sample PASSED, 41/41 captured, data-explorer/asthma/ and three other explorer pages compared; asthma/?id=2380 and search-results/ have no baseline record and were not compared]`. No re-baseline needed so far |

### Decisions made in this plan, and open questions

- **C applies below 720px (`md`) only.** 720–959px keeps today's layout, with Stage 0, until Task 7
  picks T1, T2 or T3. That avoids building a tablet layout twice.
- **The bottom tab bar stays fixed to the bottom of the screen** under C, as it is today. The
  options doc said "sticky tab bar"; fixed is what is already built and tested, and it keeps the
  views one tap away wherever the page is scrolled. The page gets bottom padding equal to the bar's
  height so the last of the view is not under it.
- **Stage 0 item 1 (size the map to the space left) is superseded on phones by C,** where the page
  is meant to scroll and the map gets its own height. It still applies to 720–959px if Task 7
  picks T3. The desktop page also scrolls by the banner's height (the scrollbar is visible in
  `d-bar.png`); that is **deferred**, not rejected: out of this plan's scope, which is phones and
  tablets. Bringing it forward is Stage 0 item 1 applied at `min-width: 960px`, plus a desktop
  re-baseline.
- **Open, for Chris (Q1):** the options doc described C with the Measure / Boundary / Time
  dropdowns always visible. This plan keeps them behind the existing "+" (closed on load), because
  once nothing covers them the "+" reaches them, and the open details add 382px, which by
  arithmetic on the measured boxes (64px header, 105px banner, ~140px card header) would start the
  map at about y=690 of an 812px screen. Not measured with C built. Task 5 builds it collapsed; making it open-by-default on phones
  is one class (`show` on `#detailsContent`) if you'd rather.
- **Open, decided by Task 6 (Q2):** whether one-finger map dragging stays on for phones. Leaflet
  1.9.4 (`node_modules/leaflet/package.json`) has a `dragging` map option, on by default. With
  the map at ~55% of the screen there is always page outside it to scroll on, so the default is
  to leave dragging on and see whether that's enough on a real phone.
- **Deferred: the table's width (F9).** Under C the table keeps DataTables' own `scrollX` and
  `scrollY: 500` (`assets/js/data-explorer/table.js`, the `DataTable({` call in the table
  initialiser), as the retired explorer does. Fewer columns or stacked rows on phones would need
  their own design; Task 6 records whether the remaining nested scroller is a problem in a real hand.

### Task 1: Fix the "+" toggle's `aria-expanded` (F10)

**Files:** `assets/js/data-explorer/de-tab-content.js`, the "mobile accordion" block: delete the
listener under the comment `// Also listen for click events on the header as a backup` (the
`setTimeout(..., 100)` that re-reads `.show`).

**Interfaces:** none. `updateIconState` stays.

**Correction (2026-11-05, during the task).** This section first said the `show.bs.collapse` /
`hide.bs.collapse` listeners above the deleted one already keep the icon in step. They never ran:
they were native `addEventListener` calls, and Bootstrap 4.6.2 triggers its events through jQuery
only `[verified 2026-11-05: on one tap, a native show.bs.collapse listener fired 0 times and a
$().on() one fired once]`. The deleted listener was the only thing updating the icon. With it gone,
`aria-expanded` read correctly (Bootstrap sets it) and the icon stayed "+". So the task also
switches those two listeners to `$(detailsContent).on(…)`.

The same pattern is in five more places in the explorer, outside this task:
`de-tab-content.js` (the "has-open-panel state class" block, `show/hide/shown/hidden.bs.tab`) and
`bar.js` (`shown.bs.tab` on the bar tab). **Not checked whether they matter**: something else may
set `has-open-panel`, since the desktop panel does resize. Recorded as a finding for the audit
rather than fixed here; checking each is a matter of whether its handler ever runs.

Steps:
1. Delete the listener and its comment. Expected: `npm run lint` passes.
2. At 375×812 on `/data-explorer/asthma/?id=2380&overlay=bar`, click `.mobile-details-toggle`, then
   read `aria-expanded` and `.toggle-icon`'s class at +0, +110 and +410ms. Expected: `true` at
   all three, icon `fa-minus` by +410ms. Click again: `false` and `fa-plus`.
3. Tap the green header bar (not a button). Expected: the details open and the attribute reads
   `true`, since the bar's other listener clicks the toggle.
4. Commit.

### Task 2: Phone-layout probe, run against today's tree as its control

**Files:** create `scripts/de-mobile-probe.mjs`.

**Interfaces:** produces the pass/fail instrument Tasks 3, 5 and 7 run. Exits 1 on any failure,
0 when clean, 2 on a harness error.

```js
// Phone-layout probe for the data explorer (documents/de-mobile-layout-options-2026-11-05.md).
// For each viewport and view: which elements scroll vertically, and whether "Change dataset",
// the three mobile dropdowns and the legend are reachable — scrolled into view, then hit-tested
// at their centre. Fails on a second vertical scroller (beyond the allowed table ones) or on any
// target that is covered. Usage: node scripts/de-mobile-probe.mjs [WIDTHxHEIGHT ...]
import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";

const PAGE = "data-explorer/asthma/?id=2380";
const VIEWS = ["none", "bar", "trend", "correlate", "table"];
const DEFAULT_SIZES = ["375x812", "360x640"];

// DataTables' own body and the table's checkbox boxes are allowed to scroll: Task 6 decides
// whether they stay.
const ALLOWED_SCROLLERS = [".dataTables_scrollBody", ".de-table-optionbox"];

const TARGETS = {
    "Change dataset": ".mobile-details-header .indicator-selector-trigger",
    "Measure": "#measureOptionsDropdownButton1",
    "Boundary": "#geoOptionsDropdownButton1",
    "Time": "#timeOptionsDropdownButton1",
    "Legend": ".de-legend",
};

// Runs in the page. Returns the vertical scrollers and each target's reachability.
function measure({ targets, allowed }) {
    const name = el => el === document.scrollingElement ? "page"
        : el.id ? `#${el.id}` : `.${String(el.className).trim().split(/\s+/)[0]}`;
    const scrollers = [document.scrollingElement, ...document.querySelectorAll("body *")]
        .filter(el => {
            if (el.scrollHeight <= el.clientHeight + 1) return false;
            if (el === document.scrollingElement) return true;
            const r = el.getBoundingClientRect();
            return r.height > 0 && /(auto|scroll)/.test(getComputedStyle(el).overflowY);
        })
        .map(el => ({ name: name(el), allowed: allowed.some(s => el.matches(s)) }));
    const reach = {};
    for (const [label, sel] of Object.entries(targets)) {
        const el = document.querySelector(sel);
        if (!el || el.getBoundingClientRect().height === 0) { reach[label] = "hidden"; continue; }
        el.scrollIntoView({ block: "center" });
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        reach[label] = hit && (el === hit || el.contains(hit)) ? "ok" : "covered";
    }
    return { scrollers, reach, docWidth: document.documentElement.scrollWidth, vw: innerWidth };
}

const sizes = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SIZES)
    .map(s => s.split("x").map(Number));
if (sizes.some(([w, h]) => !w || !h)) { console.error("Sizes are WIDTHxHEIGHT"); process.exit(2); }

const server = await ensureDevServer();
const browser = await chromium.launch();
let failures = 0;
try {
    for (const [width, height] of sizes) {
        for (const view of VIEWS) {
            const page = await browser.newPage({ viewport: { width, height } });
            await page.goto(`${server.baseURL}${PAGE}&overlay=${view}`, { waitUntil: "load" });
            await page.waitForTimeout(2500);
            // Open the details so the dropdowns exist to test, as a user would. The toggle is
            // d-lg-none, so at 960px and wider it is hidden and the targets read "hidden".
            const toggle = page.locator(".mobile-details-toggle");
            if (await toggle.isVisible()) {
                await toggle.click();
                await page.waitForTimeout(500);
            }
            const m = await page.evaluate(measure, { targets: TARGETS, allowed: ALLOWED_SCROLLERS });
            const extra = m.scrollers.filter(s => !s.allowed);
            const covered = Object.entries(m.reach).filter(([, v]) => v === "covered").map(([k]) => k);
            const wide = m.docWidth > m.vw;
            const ok = extra.length <= 1 && covered.length === 0 && !wide;
            if (!ok) failures++;
            console.log(`${ok ? "PASS" : "FAIL"} ${width}x${height} ${view.padEnd(9)} `
                + `scrollers=[${m.scrollers.map(s => s.name + (s.allowed ? "*" : "")).join(", ")}] `
                + `covered=[${covered.join(", ")}]${wide ? ` pageWidth=${m.docWidth}` : ""}`);
            await page.close();
        }
    }
} finally {
    await browser.close();
    await server.stop();
}
console.log(`${failures} failing of ${sizes.length * VIEWS.length}`);
process.exitCode = failures ? 1 : 0;
```

Steps:
1. Write the file. `node --check scripts/de-mobile-probe.mjs`, expected silent.
2. Run it against today's tree (the positive control). Expected, from the findings table: exit 1;
   at 375×812, `bar`, `trend`, `correlate` and `table` FAIL with
   `scrollers=[page, #v-pills-tabContent, …]` and `Measure`, `Boundary`, `Time` and `Legend`
   covered. `none` has no prediction: with the details open, the legend sits at the tab bar's top
   edge (`m-none.png`), so record whichever way it reads and treat that as its control value. At 360×640 `Change dataset`
   may read `ok` because the probe scrolls it into view first, which is what a user would have to
   do too (F6). If the control does **not** fail where F1/F4/F5 say it should, the probe is wrong:
   fix it before Task 3.
3. Paste the control's output into this ledger's proof column, and commit.

### Task 3: Stage 0 CSS

**Files:** `assets/scss/_de-custom.scss`, the `@media (max-width: 959.98px)` block commented
"Ensure mobile bottom nav sits above iOS Safari toolbar":
- `.tab-content`: `overflow-y: scroll` → `overflow-y: auto`.
- Delete the `.closeTabPane` rule (matches no element; the template's class is `close-tab-pane`).
- Delete the `.de-wrapper { padding-bottom: … }` pair in that block (A-158: nested inside
  `.de-wrapper { … }` it compiles to `.de-wrapper .de-wrapper` and matches nothing). Task 5 adds
  the working version for phones.

Steps:
1. Make the three edits. Expected: the dev server rebuilds; at 375×812 with `overlay=bar`,
   `getComputedStyle(document.querySelector('#v-pills-tabContent')).overflowY` reads `auto`.
2. `grep -c 'closeTabPane' assets/scss/_de-custom.scss` → 0; grep the built CSS
   (`docs/` or the served `theme.*.css`) for `.de-wrapper .de-wrapper` → 0. Control: the same grep
   on the CSS served before the edit returns ≥1.
3. Re-run the probe; expected unchanged from Task 2 except that no pane draws a scrollbar
   when its content fits. Commit.

### Task 4: Reorder the shell's DOM (relocation only)

Why first: under C the pieces stack in DOM order. Today's order is card, legend, views, map; C
wants card, map, legend, views. Doing it with CSS `order` would leave keyboard focus order
different from what is on screen, so the DOM moves instead. On desktop everything in that row is
absolutely positioned, so the move should not change a pixel; this task proves that.

**Files:**
- Create `themes/dohmh/layouts/partials/de-legend.html`: the `<!-- Legend overlay -->` block
  moved verbatim out of `de-indicator-info.html` (from that comment to the end of its
  `.de-legend` div).
- `themes/dohmh/layouts/partials/de-indicator-info.html`: remove that block.
- `themes/dohmh/layouts/data-explorer/single.html`: in the `.row.position-relative`, order the
  children `de-indicator-info` → `#map` div → `{{- partial "de-legend" . -}}` →
  `{{- partial "de-tabs" . -}}` → `#selectionStatus` → `#loadErrorOverlay`.

**Interfaces:** `#hoveredGeo`, `#hoveredValue`, `#hoveredUnits` and the legend's gradient keep
their ids; `map.js` finds them by id, so it is indifferent to where they sit.

Steps:
1. Before editing, capture desktop screenshots at 1280×800 of `overlay=none`, `bar` and `table`
   with the tile layer hidden (`.leaflet-tile-pane { visibility: hidden }` injected), since tiles
   load on their own schedule. Take each twice: the two must be byte-identical, or the comparison
   cannot detect anything (same-condition control).
2. Make the moves. Prove the moved block is verbatim: `git diff` shows the legend lines as a pure
   delete in `de-indicator-info.html` and the same lines added in `de-legend.html`
   (`git diff --no-index` the extracted hunks, expected no output).
3. Re-capture the three screenshots. Expected: byte-identical to step 1. A difference is a
   stacking change (card, legend and panel share `z-index: 2`, so DOM order breaks ties); fix it
   with an explicit z-index rather than accepting it.
4. Tab order: on desktop, Tab from the "Change dataset" button through the page and record the
   sequence. Expected: the map's "View this data as a table" link now comes before the tab pane
   controls rather than after them; nothing else moves. Record the before and after.
5. `npm run smoke` (curated; it includes the explorer). Expected: pass. Commit.

### Task 5: Option C below 720px

**Files:** `assets/scss/_de-custom.scss`, a new block after the `.de-wrapper { … }` block that
holds the mobile rules (it must come later in source so it wins the cascade):

```scss
// ----- Phone layout (Option C, documents/de-mobile-layout-options-2026-11-05.md) ----- //
// Below md the explorer stops floating its pieces over the map and stacks them in DOM order
// (card, map, legend, views), so the page is the only vertical scroller. The tab bar stays
// fixed to the bottom of the screen, and the page is padded by its height so nothing ends under it.
// !important is needed against Bootstrap's .position-absolute utility, which carries its own.
@media (max-width: 719.98px) {
    .de-wrapper {
        padding-bottom: calc(64px + env(safe-area-inset-bottom));

        .de-main-details,
        .de-legend,
        .de-tabs {
            position: static !important;
            width: 100% !important;
        }

        #map {
            height: 55vh;
            height: 55svh; // dropped by browsers without svh, leaving the vh line
        }

        .tab-content {
            max-height: none;
            overflow: visible;
        }

        .de-tabs-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1010; // above Leaflet's controls (1000)
        }
    }
}
```

**Interfaces:** consumes Task 4's DOM order. The `64px` is the tab bar's measured height
(`[role=tablist]` box, 748–812 at 375×812); re-measure after the edit, since the bar's own
safe-area padding is inside it.

Steps:
1. Add the block. Expected: lint is unaffected (SCSS), the dev server rebuilds without error.
2. `node scripts/de-mobile-probe.mjs`. Expected: exit 0, every row PASS, `scrollers=[page]` for
   all views except `table`, which may add the starred `.dataTables_scrollBody*`.
3. Screenshot all five views at 375×812 and 360×640, full page, into `.playwright-mcp/`
   (`c-<view>-<size>.png`). Check by eye for anything the probe cannot see: a chart wider than the
   screen, a legend detached from its map, the last of a view under the tab bar.
4. `node scripts/de-mobile-probe.mjs 768x1024 1024x768`. Expected: the same rows as Task 2's
   control at those sizes would give, i.e. 720–959 unchanged (run the probe on Task 4's commit at
   those sizes first for the comparison).
5. Re-capture Task 4's desktop screenshots. Expected: byte-identical.
6. Commit. Then ask Chris about Q1 with the `c-none-375x812.png` screenshot in hand.

### Task 6: Real-phone check

Needs Chris's phone (iOS Safari and/or Android Chrome) on the CloudCannon preview of the branch,
or the dev server over the LAN (`hugo serve --bind 0.0.0.0 --baseURL http://<this-pc-ip>:8080/dev-prod/`).

Steps, each recorded with what was seen:
1. Scroll the page from the top to the view, starting the swipe on the card, then again starting
   on the map. Q2: if a swipe starting on the map pans the map and the page can't be scrolled
   easily, set `dragging: !L.Browser.mobile` in `initBaseMap` (`assets/js/data-explorer/map.js`,
   the `L.map('map', {` options) and repeat. First confirm `L.Browser.mobile` exists in
   1.9.4: `grep -n "mobile" node_modules/leaflet/dist/leaflet-src.js | head`.
2. Open each view and scroll to its end: the last line must clear the tab bar.
3. Table view: scroll the table body, then the page. Record whether the nested table scroller is
   usable or traps the swipe (the deferred F9 decision).
4. Toolbar collapse (iOS): scroll down so Safari's toolbar hides, then up. Record whether the map
   jumps in height.

### Task 7: Tablet prototypes, then a decision

**Files:** `assets/scss/_de-custom.scss`, prototype blocks under `@media (min-width: 720px) and
(max-width: 959.98px)`, one at a time, uncommitted until chosen.

- **T1:** the row as a two-column grid: card and map (with legend) in the left column, views in
  the right, tab bar fixed at the bottom; each column 50%.
- **T2:** Task 5's block with the breakpoint widened to 959.98px and `#map` height reduced until
  the top of the bar chart is on the first screen at 768×1024.

**Correction (2026-11-06).** The steps below first said to test at 1024×768. That cannot test
this range: 1024px is above 960, so a landscape tablet already gets the desktop layout. The range
holds portrait tablets only, so the run used 768×1024 and 900×1200. The same correction applies
to Task 5 step 4 and Task 8 step 2, where `1024x768` measured the desktop layout.

Steps:
1. Build T1. Probe at `768x1024 900x1200`, screenshot each view. Record the chart's rendered width
   (`#v-pills-tabContent .tab-pane.active svg` box) beside its 375px width from Task 5.
2. Revert T1, build T2, same measurements.
3. **Stop: Chris picks T1, T2 or T3** from the screenshots. Record the choice and the reason in
   Decisions above, then commit the chosen block (or, for T3, Option A's fixes scoped to 720–959,
   planned as a further task here).

**Results (2026-11-06).** Both prototypes pass the probe at both sizes (one page scroller per view,
nothing covered). Measured by `scripts/.sc-rebaseline/de-mobile/tablet-measure.mjs`; screenshots
`.playwright-mcp/T1-<view>-<size>.png` and `T2-…`. The blocks as measured are
`scripts/.sc-rebaseline/de-mobile/prototype-T1.scss` (the two-column grid, `#map` sticky at
`70svh`) and `prototype-T2.scss` (Task 5's block at 720–959, `#map` at `40svh`), each appended to
the end of `_de-custom.scss` on the Task 5 tree.

The first three columns are a first visit, with the "new Data Explorer" banner showing. The last
two are a returning visitor who dismissed it, re-measured for T1 and T2 only; the banner is 63px
tall at these widths and 106px on phones `[verified 2026-11-06: tablet-T1-nobanner.txt,
tablet-T2-nobanner.txt; the scripts set the banner's localStorage key before load and throw if
#de-announcement-explorer is still present; control: without the key the banner was present and
#map's top read 280 at 375×812, with it 174]`.

| | Chart width (768 / 900) | Chart starts at (768×1024) | Map on the first screen (768×1024) | Chart starts, banner dismissed | Map on the first screen, banner dismissed |
|---|---|---|---|---|---|
| Phone, Task 5 (375) | 341 | 813 of 748, below the fold | 447px | not re-measured | not re-measured |
| Today's tablet layout | 734 / 866, over the map | 465 | covered by the panel | not re-measured | not re-measured |
| **T1, two columns** | 350 / 416 | 148 | 654px, 384 wide, beside the chart | 85 | 717px |
| **T2, stacked** | 734 / 866 | 711 of 960, ~250px of chart showing | 410px, full width | 648 of 960, ~310px of chart showing | 410px |

Banner-dismissed screenshots: `.playwright-mcp/T1-nobanner-<view>-<size>.png` and
`T2-nobanner-…`; the phone shots `c-<view>-<size>.png` were retaken with the banner dismissed.

Reading of them: T1 is the one that puts map and chart on one screen, which is what Chris asked
for; its charts are about phone width at 768 and wider at 900, and the table's four columns fit
(`T1-table-768x1024.png`). T2 gives the charts twice the width but shows only the top of a chart
until the page is scrolled. A recommendation, not a decision: T1.

**Decision (Chris, 2026-11-06): T2, then reworked.** With T2 built, the stacked layout covers
everything below 960px, and three requests followed from the screenshots: (1) show the whole city,
a little cut off being acceptable, and remove the tiles' `maxZoom: 11` cap; (2) no blank space under
the map when no view is open (`overlay=none` is the default for almost every indicator), so the map
and the open view must not have fixed proportions; (3) an open view may cover part of the map, but
both must stay usable. Built as: the map is sticky and sized by `layoutStackedMap` (`map.js`) to fill
the screen between the card and the legend + tab bar; an open view is pulled up over the bottom
`SHEET_SHARE` (0.45) of the map, which re-fits the city into the part still showing; once the visitor
has zoomed or panned, opening or closing a view keeps their zoom, stepped by `SHEET_ZOOM_STEP` (0).
A map height of 55% and 45% of the screen was screenshotted first and rejected for (2) and (3).
Rejected with them: a fixed `40svh` map (T2 as prototyped), which cut off Staten Island and the
north Bronx.

### Task 8: Harnesses and PR

1. `npm run lint`; `npm run smoke`; `node scripts/de-characterization.mjs --check`;
   `npm run characterize:site:sample`. Expected: lint and smoke pass. Characterization runs at a
   desktop viewport, so Tasks 3–7 should not move it; Task 4's DOM order might. If anything moves,
   it must be explorer pages only, re-baselined with
   `site-characterization-rebaseline.mjs --expect "data-explorer/**"` after tallying the diff's
   fields (`git diff -U0` by key).
2. `node scripts/de-mobile-probe.mjs` and `node scripts/de-mobile-probe.mjs 768x1024 1024x768`
   one last time on the final commit; record the hash beside the result.
3. Push and open the PR into `production`. CI runs the full smoke and characterization sweeps.

### Next command

Needs from Chris: Task 6 on a real phone and tablet, on the branch's CloudCannon preview; Q1;
and whether `SHEET_SHARE` (0.45) and `SHEET_ZOOM_STEP` (0) in `assets/js/data-explorer/map.js` stay.
Then the rest of Task 8.

```bash
git rev-parse --abbrev-ref HEAD                 # expect feature-de-mobile-layout
gh pr list --head feature-de-mobile-layout       # the PR into production, and its checks
node scripts/de-mobile-probe.mjs 375x812 360x640 768x1024 900x1200   # expect "0 failing of 20"
```
