# Neighborhood Reports accessibility audit — 2026-08-10

Dated record. Written against `feature-MOD-Lab-NR-recode-refactor` at `43e42b666e`, which is the
tree the probes ran against — the Expand all / Collapse all control was present on disk and is
covered here (F12). It cites
line numbers that will move; it does not opt into `docs-check` for that reason.

## 1. Scope and method

The Option D rewrite replaced 252 hand-written pages with four generated page kinds, a ten-file
client-side SPA, a Leaflet picker, a flexdatalist typeahead, and a print rendition built as
separate markup. None of it had been checked for accessibility. WCAG 2.1 AA is the bar.

Every finding below was observed in a running browser. A source read produced the candidate list
first; §4 records the candidates the browser disconfirmed, which is a third of them.

**Targets** — one sample of each page kind, against the `local_prod` dev server on
`http://localhost:8080/local-prod/`:

| Page kind | Path | Count in the site |
|---|---|---|
| NR landing | `neighborhood-reports/` | 1 |
| Neighborhood index | `neighborhood-reports/east_new_york/` | 42 |
| Topic index | `neighborhood-reports/asthma_and_the_environment/` | 5 |
| Report SPA | `neighborhood-reports/east_new_york/asthma_and_the_environment/` | 210 |

The report SPA was scanned in four states, because they are different documents: at rest, with one
panel expanded (the only state in which a chart exists), with all 22 expanded, and under
`emulateMedia({ media: 'print' })`.

**Instrument** — `scripts/nr-a11y-audit.mjs` (`npm run a11y:nr`), axe-core 4.13.0 under
Playwright 1.62.0, plus probes for what no axe rule implements: a full tab-order sweep recording
focus indicators and `aria-hidden` ancestors, heading order read from the accessibility tree,
id/ARIA-reference integrity, a before/after capture around a Leaflet re-render, chart naming, and
computed colour on the comparison vocabulary. Accessible names come from Chrome's own computation
over CDP, not from a re-implementation of the accname algorithm.

**Controls.** Both passed, which is the only reason the counts below mean anything.

- *Positive control.* An `<img>` with no `alt` was injected, axe re-run, `image-alt` confirmed to
  fire, the element removed. A scan where axe never loaded and a page with no violations report
  the same zero.
- *Rendered-content control.* Each page declared a selector that had to match before scanning. The
  SPA matched 22 `.card-header button`, so the scan ran against a populated report rather than the
  five empty accordion shells an empty data repo produces.

**What this audit does not cover.** No screen reader was driven — findings are about the
accessibility tree and the keyboard, not about how JAWS or VoiceOver narrate it. One
neighborhood/topic pair was sampled, so data-dependent states (an indicator with no chart, a
neighborhood with missing rows) are unexamined. Zoom and reflow at 400%, and 200% text spacing,
were not tested.

## 2. Findings

Severity is axe's where axe found it, and assigned by impact where the probes did. Site-shell
defects that reproduce on non-NR pages are in §3, not here.

### 2.1 Serious

**F1 — 46 keyboard stops sit inside an `aria-hidden="true"` subtree.** WCAG 4.1.2, 1.3.1.
`themes/dohmh/layouts/partials/nr-neighborhood-picker.html:46` wraps the picker map in
`aria-hidden="true"`, reasoning that the 42-link neighborhood list below is the text equivalent.
The reasoning is sound; the subtree still contains focusable content. The tab sweep counted 46
stops with an `aria-hidden` ancestor on both the landing page and the topic index: the map
container, 42 Leaflet polygons, and the Leaflet/OpenStreetMap/CARTO attribution links. A keyboard
user tabs through 46 positions that a screen reader is told do not exist. axe reports this as
`aria-hidden-focus`, serious.

**F2 — the 42 Leaflet polygons are focusable, unnamed, and do nothing.** WCAG 2.1.1, 4.1.2.
Distinct from F1, and present on the report SPA where the map is *not* `aria-hidden`
(`nr-topic-spa.html:136`). Each polygon computes to `graphics-symbol` with an empty name. Focusing
one and pressing Enter left the `<h1>`, the URL and the first card unchanged — the neighborhood did
not switch. `assets/js/nr-topic-spa/map.js:146-160` registers a `click` handler only. Enter does
reach the polygon — a DOM listener on a focused path recorded `keydown` and `keypress`
`[verified 2026-08-10]` — and Leaflet 1.9.4 routes key events to layer targets
(`leaflet-src.js:4555-4565`), skipping only the coordinate computation. Nothing is listening, so
nothing runs. The SPA's only in-place neighborhood switcher is therefore mouse-operable, and it
costs a keyboard user 42 dead stops to skip.

One trap for whoever fixes this: `el.tabIndex` reads `-1` on these paths and none carries a
`tabindex` attribute, yet walking the tab order lands on all 42. The DOM property is not the test
here; the sweep is.

**F3 — the neighborhood search emits combobox ARIA without a combobox role, and its state is
stale.** WCAG 4.1.2. flexdatalist hides the authored `#flex_search` (`tabIndex -1`) and renders
`#flex_search-flexdatalist`, carrying `aria-autocomplete="list"`, `aria-owns` and `aria-expanded`
on an element with no `role`. axe reports `aria-allowed-attr` as critical: `aria-expanded` is not
allowed on a plain textbox. Worse than the attribute being disallowed, it is wrong — after typing
`Bay`, the results container was visible with 3 options and `role="listbox"`, while
`aria-expanded` still read `"false"` and `aria-activedescendant` was absent. A screen reader is
told nothing opened.

**F4 — the topic buttons and links fail contrast at 4.23:1.** WCAG 1.4.3. `#008939` on `#EFFAF4`,
14px bold, against the 4.5:1 threshold. `.btn-light-green-bg` at `assets/scss/_custom.scss:214-219`,
used by `partials/nr-topic-menu.html:27` and the landing page's topic buttons. Four to six nodes
per page on the landing page, topic index and report SPA. The neighborhood index has no topic menu
and is unaffected.

**Corrected 2026-08-10, after A5.** `.btn-light-green-bg` was not the only source of the
`color-contrast` nodes counted here; the rule id was read as if it were. Two more rules put
`$primary` on a near-white green, and both survived A5:

| Element | Rule | Was | Now |
|---|---|---|---|
| Print / Download / Expand all, `.btn-report` (`assets/scss/theme.scss:480-486`) — NR-only | `$primary` on `$light-green` `#F8FCF7`, 14px bold | 4.37:1 | **5.29:1** — fixed |
| "See neighborhood list" toggle, `.nr-list-toggle` (`nr-neighborhood-list.html:22`) — `.btn-outline-primary`, a Bootstrap variant used site-wide | `$primary` on `#EFFAF4`, 16px bold | 4.24:1 | 4.24:1 — **left alone by decision**, the class is site-wide |

`[verified 2026-08-11: `getComputedStyle` on the live nodes under Playwright, at rest and after a
real hover with a 500ms wait for Bootstrap's .15s `background-color` transition — reading
immediately after `page.hover()` measures the transition, not the hover state, and returned the
resting colour on all five targets. Ratios recomputed from the sRGB formula. Resting: `.btn-report`
5.29, `.nr-topic-link` 5.13, toggle 4.24. Hover: `.btn-report` 5.29 (the same pair inverted),
`.nr-topic-link` 5.49]`

The fix is `$primary-dark: #007A31` in `assets/scss/_a-global-variables.scss`, used by
`.btn-report` and `.btn-light-green-bg` for text and its inverse only. `$primary` stays the brand
colour for fills, borders and map geometry.

**F5 — worse and better are distinguished by background colour alone.** WCAG 1.4.1. The collapsed
indicator row shows a pill reading `Higher` or `Lower`; whether that is good or bad is carried only
by `.worse` (`#F2CDD7`, pink) versus `.better` (`#D1F0C8`, green) at
`assets/scss/theme.scss:655-665`. On the sampled report that is 20 pink against 1 green, every one
of them reading `Higher` or `Lower` and nothing else. The accordion button's accessible name ends
`… Age-adjusted percent Higher`. `.middle` is never emitted — the probe counted 0 — so rank 2 shows
no pill at all, which is a third state conveyed by absence.

The expanded panel and the print rendition do not have this problem: both use the full sentence
`Higher than most neighborhoods` from `getTertileInlineLabel`. The gap is the collapsed row, which
is what the page shows by default.

**F6 — 22 chart action menus have no accessible name.** WCAG 4.1.2. vega-embed's actions control
renders as a `<summary>` containing only an SVG, computing to `DisclosureTriangle` with an empty
name. It is in the tab order (`tabIndex 0`). axe reports `summary-name` ×22 with every panel
expanded.

**F7 — the SPA re-renders the whole report and announces nothing, and the page title goes stale.**
WCAG 4.1.3, 2.4.2. Clicking a map polygon runs `renderAll` (`map.js:126-142`), which wipes and
rebuilds the report body (`report.js:23`), swaps the `<h1>` and rewrites the URL
(`url.js:65`). Measured across one such click:

| | before | after |
|---|---|---|
| `<h1>` | Asthma and the Environment in East New York | Asthma and the Environment in Williamsburg - Bushwick |
| URL | `…/east_new_york/asthma_and_the_environment/` | `…/williamsburg_bushwick/asthma_and_the_environment/` |
| `document.title` | Asthma and the Environment in East New York | **unchanged** |
| live regions | 0 | 0 |
| focus | `body` | the clicked `path` |

The count of `[aria-live], [role=status], [role=alert]` elements is zero on all four page kinds, in
every state scanned. Nothing signals that the entire page content changed, and the title now names
a neighborhood the page is no longer showing — which is what a tab list, a bookmark and a browser
history entry will record.

**F8 — the Community/Council District dialog has no accessible name.** WCAG 4.1.2.
`themes/dohmh/layouts/neighborhood-reports/section.html:102` sets
`aria-labelledby="CCDModalLabel"`; the title at `:106` has `id="CCDModalTitle"`. The reference
resolves to nothing, confirmed by the id-integrity probe.

### 2.2 Moderate

**F9 — 44 chart mark groups are unnamed, and all 22 charts share one generic name.** WCAG 1.1.1.
`vegaEmbed` is called with `renderer: 'svg'` (`chart.js:185`), so vega emits a `.chart-wrapper`
with `role="graphics-document"` — and the name it computes to is `"Vega visualization"`, identical
for every chart on the page. Nothing identifies which indicator a chart shows. Inside, the two
`role="graphics-symbol"` mark containers per chart carry no name; axe reports `svg-img-alt` ×44
with all panels expanded. The 77 per-mark `aria-label`s vega generates are present on the first
chart, so the underlying data is described — but there is no summary, no `<desc>`, no caption, and
no table alternative (`tableAlternative: false` on all 22).

**F10 — heading levels are out of order on the report SPA.** WCAG 1.3.1. The exposed sequence
begins `h1 → h3 → h2` and later runs `h2 → h4`: the page title (`nr-topic-spa.html:201`), the
report-section title (`:247`, an `h3`), then each indicator card (`cards.js:104`, an `h2`), then
the footer (`nr-report-footer-sm.html:21,36,52`, `h4`). So every indicator appears to close its
section and open a sibling of the page title. axe reports `heading-order` on the landing page
(`h1 → h3` at "Choose report"), the topic index (`h1 → h3` at "Choose Neighborhood") and the SPA.
The neighborhood index is clean: `h1 → h2 ×5`.

**F11 — the print QR code has no `alt` attribute.** WCAG 1.1.1. `renderQRCode` at
`nr-topic-spa.html:377` calls `createImgTag()` with no arguments, and `qrcode-generator` only
emits `alt` when passed one (`node_modules/qrcode-generator/dist/qrcode.js:595-599` — the
attribute is written inside an `if (alt)` branch). Confirmed under print media: `hasAltAttribute: false`. The image is
`display:none` on screen, so it is exposed only in the print rendition — where it is the sole
route back to the online report.

**F12 — the expand/collapse-all button carries no state.** WCAG 4.1.2. `#nr-toggle-accordions`
computes to `button :: "Expand all"`, and its label flips to "Collapse all" on click. It has
`aria-expanded: null` and `aria-controls: null`, so the group state it controls is conveyed only by
the visible label text.

**F13 — a duplicate id and a broken label reference reach the landing page through
`overlap-tool.html`.** WCAG 4.1.2, 4.1.1. `partials/overlap-tool.html` declares
`id="tab-btn-01-a"` twice (`:5`, `:33`) and points `aria-labelledby="tab-btn-02-a"` (`:39`) at an
id it never defines. NR's `section.html:117` includes the partial; `data-features/neighborhood-overlap.html`
is the other caller, so a fix there is shared.

**Corrected 2026-08-10, during A3.** There is no other caller. `neighborhood-overlap.html:11`
includes `overlap-tool-with-map.html`, a *different* partial, and that one contains no tab markup
at all — zero hits for `tab-btn` or `nav-tabs`. `overlap-tool.html` is included only by NR's
`section.html:117` `[verified 2026-08-10: grep for `overlap-tool` across `themes/` and `content/`]`.
So A3 changes nothing outside Neighborhood Reports.

### 2.3 Minor

**F14 — the "Download" button claims it opens a new tab; it triggers a blob download.**
`nr-topic-spa.html:224` carries `.sr-only` text "(opens in a new tab)", which the probe confirmed
is part of the button's accessible name. `app.js:30-38` builds an object URL and clicks a detached
`<a download>`. The convention is right and the claim is wrong, which is worse than saying nothing.

**F15 — the demographics table has no row headers.** WCAG 1.3.1. The `thead.sr-only` at
`nr-topic-spa.html:150-152` is a good affordance and it works. Below it, all eight body rows start
with a `<td>`, and neither `<th>` carries `scope`. In a two-column table a screen reader reading
cell by cell gets the value without the metric name attached.

**F16 — 42 dangling `aria-describedby` references after interaction.** WCAG 4.1.2. At rest the
pages have none. After expanding all panels, all 42 Leaflet polygons carry
`aria-describedby="leaflet-tooltip-NNN"` pointing at tooltip elements that no longer exist —
Leaflet's tooltip lifecycle removes the node and leaves the attribute.

**F17 — accordion panels are not regions, and their label is the whole header row.** The panel at
`cards.js:188-189` has `role: null` and `aria-labelledby` resolving to the full header text,
including the value and the pill: `"Asthma (adults) Adults with a recent asthma attack, 2022 7.0*
Age-adjusted percent Higher"`. Navigating by region will not find the panels, and the label is a
sentence rather than a name.

### 2.4 Found during Stage C, not in the original scan

**F18 — Escape does not dismiss the neighborhood typeahead; the list reopens ~400ms later.**
WCAG 2.1.1 is arguably met (Tab still leaves the field), but the ARIA combobox pattern expects
Escape to close the popup, and here it does not stick. Surfaced by C4's own verification, which
sampled `aria-expanded` twice around the key press specifically to tell a stale attribute from a
list that genuinely reopened.

Measured on the topic index: at +60ms after Escape the list is gone and `aria-expanded` reads
`"false"`; at +660ms a **different** `<ul>` node is present, visible, 112px tall, with the same
three options, and `aria-expanded` reads `"true"`. The body-level `childList` observer recorded
exactly one `absent` then one `present`
`[verified 2026-08-11: dev_stage on :8080, Playwright, node identity compared across the gap]`.

Two handlers, both in flexdatalist 2.3.0, fighting over one key press. The document-level
`keydown` handler removes the container on key 27 (`jquery.flexdatalist.js:2046`). The input's
own `keyup` handler then calls `keypressSearch` (`:174-182`), whose guard is
`key !== 13 && (key < 37 || key > 40)` — true for 27 — so it schedules a fresh search on
`searchDelay`, default 400 (`:115, :251-259`). The search re-renders the list the keydown just
removed.

**The ARIA sync is not implicated, and that is what the two-sample probe established.** It
reported `false` while the list was gone and `true` once it was back; both readings were correct
at the instant taken. A single sample at 500ms would have shown `aria-expanded: "true"` after
Escape and read exactly like the F3 defect being fixed.

**Fixed 2026-08-11 on the NR picker, by holding the dismissal rather than cancelling the search.**
The pending search cannot be cancelled from outside the library: `_searchTimeout` is a closure
variable with no accessor. Blocking the Escape keyup would not have been enough either — a timer
armed by an *earlier* keystroke is still live, and it is `keypressSearch`'s own `clearTimeout`
that would have cleared it, so suppressing that call leaves the earlier timer running. Instead
`wireComboboxState` records that Escape was pressed and removes any list that reappears while
that flag holds; the MutationObserver it already runs for the ARIA sync is what notices. The flag
clears on the next non-Escape keydown, on `mousedown`, on `blur` and on `focus`, so the reader
gets results back the moment they do anything else. Removal happens in a MutationObserver
callback, which runs as a microtask before paint, so the reopened list never reaches the screen.

This works against any path that reopens the list, not only the 400ms timer — which is the reason
to prefer it over a handler that has to enumerate them.

Still open at the other three flexdatalist call sites, where the same two handlers ship
(`documents/site-wide-audit-2026-06-27.md` §5k).

`[verified 2026-08-11 against local_prod on :8081, both picker pages: list dismissed at +60ms and
still absent at +600, +900 and +1800ms, with aria-expanded "false" and aria-controls removed
throughout. Four controls, because a list that never comes back is indistinguishable from a
search that broke — typing again reopens it (3 options → 1 as the term narrows); selection from a
clean field navigates to bayside_little_neck/asthma_and_the_environment/; selection still
navigates when the Escape precedes it; ArrowDown+Enter navigates too. A fifth case, blur then
refocus, does not reopen the list — checked separately with no Escape anywhere in the sequence,
where blur leaves the list open, so nothing re-runs the search on focus and this is library
behaviour rather than the flag]`

## 3. Site-shell defects, reproduced outside Neighborhood Reports

These appear on every NR page and are worth fixing, but they are not NR regressions. Each was
re-run against the site home, the data explorer and the key-topics section, and reproduced on all
three — so a fix belongs in the shared partials, and NR should not carry the ticket.

| Defect | Rule | Where |
|---|---|---|
| Header logo `<img>` has no `alt`, making its wrapping link unnamed | `image-alt` (critical), `link-name` (serious) | header partial; all pages |
| `id="languages"` declared twice | `duplicate-id` | header/footer; all pages |
| `id="skip-header-target"` declared twice — on `<main>` and again inside it | `duplicate-id` | `baseof.html:22` plus each section layout; reproduced on data-explorer and key-topics |
| Two `<nav role="navigation">` with no distinguishing label | `landmark-unique` (moderate) | `#nav-primary-top`; all pages |

The `skip-header-target` duplicate is the one worth a note: the source read flagged it as something
the NR layouts introduced. They do declare it, but so does every other section layout, so it is a
site-wide pattern that NR inherited rather than created.

## 4. Candidates the browser disconfirmed

Recorded so the next reader does not raise them again. Each was a plausible source-read finding.

| Candidate | What the browser showed |
|---|---|
| The search input has no accessible name | It computes to `textbox :: "Search name or ZIP code"` — the placeholder supplies a name. The real defects are F3, and that a placeholder-only label disappears once the user types (WCAG 3.3.2, worth fixing, not a naming failure) |
| There is no keyboard path to any map polygon | All 42 are focusable. The defect is the opposite shape: they are reachable, unnamed, and inert (F2) |
| The Font Awesome `::before` glyphs on `.comp-*` will be announced as garbage | The `.comp-bad` span computes to `none :: null [IGNORED]`; U+F071 appears in neither the accessible name nor `innerText`. Chrome drops it |
| Two `<h1>` elements on the report SPA | The DOM holds 2 (mobile and desktop); the accessibility tree exposes 1. Responsive `display:none` resolves it |
| The topic index emits many `<h1>`s for Pagefind | 20 in the DOM, 39 headings hidden from the tree, 1 exposed. No user-facing effect |
| No `:focus-visible` rules and several `outline: none` overrides leave controls without a visible focus indicator | Every NR control in the sweep had one — UA `outline: auto 1px` on links and the map, Bootstrap's focus `box-shadow` on buttons and the input. No unindicated stop was found |
| Malformed anchors in `nr-report-footer-sm.html` produce nested and empty focusable anchors | The parser recovered: 4 empty `<a>` with no href, 0 nested anchors, 0 stray `<li>`. Not focusable, not exposed. The markup at `:25-26, 41-42` is still wrong and worth fixing as code quality, not as accessibility |
| The `fa-arrow-circle-right` icon in the neighborhood-index cards lacks `aria-hidden` and pollutes the link name | The link's name is clean; axe reports no `link-name` failure there. Same mechanism as the `.comp-*` glyphs |
| The beige `.middle` pill needs a non-colour cue | It is never emitted — the probe counted 0 on a page with 21 pills |
| The print rendition duplicates the screen row into the reading order | Print `innerText` shows one clean rendition per indicator, with the full sentence. The `display:none`/`display:flex` swap works |

## 5. Staged fix plan

Staged by what proves each stage, not by severity, so every stage has one cheap check.

### Stage A — mechanical; proof is the axe rule that flagged it now passing

| # | Fix | File |
|---|---|---|
| A1 | Give `createImgTag` an alt string naming the destination (F11) | `nr-topic-spa.html:377` |
| A2 | Point `aria-labelledby` at `CCDModalTitle`, or rename the title's id (F8) | `neighborhood-reports/section.html:102` |
| A3 | Make the second `tab-btn-01-a` unique and fix the `tab-btn-02-a` reference (F13) | `partials/overlap-tool.html:33, 39` |
| A4 | Replace the "(opens in a new tab)" sr-only text with "(downloads a CSV file)" (F14) | `nr-topic-spa.html:224` |
| A5 | Darken `.btn-light-green-bg`'s foreground to clear 4.5:1 on `#EFFAF4` (F4) | `_custom.scss:214-219` |
| A6 | Add `scope="col"` to the sr-only headers and make each row's first cell a `<th scope="row">` (F15) | `nr-topic-spa.html:150-152`, ~~`demographics.js`~~ |
| A7 | Close the anchors and drop the stray `</li>` — code quality, no a11y change expected | `nr-report-footer-sm.html:25-26, 41-42` |

A6 is template-only. `demographics.js` writes the *value* cells by id (`DEMOGRAPHIC_FIELDS`) and
never emits the metric cells, so it needed no change.

Proof: `node scripts/nr-a11y-audit.mjs`, then confirm `image-alt` drops to the site-shell instance
only, ~~`color-contrast` reaches 0 on all four pages~~, and the broken-reference list is empty.

**The `color-contrast` half of that proof was wrong when written, and cannot be reached by A5.**
Two reasons, both worth carrying into Stage B. A5 only ever touched one of the three rules putting
`$primary` on a light-green background (see F4's correction above). And `color-contrast` appears in
axe's **`incomplete`** bucket on all four pages of the post-A5 run — axe defers
nodes whose background it cannot resolve, so its violation count is a floor, not a census. The
landing page's list toggle measures 4.24:1 and axe reports it on the topic index but not on the
landing page, from byte-identical partial markup. Use a computed-colour probe to assert a
contrast zero; the axe count alone cannot.

### Stage B — semantics, template-local; proof is axe plus a re-run of the keyboard and heading probes

| # | Fix | File |
|---|---|---|
| B1 | Give the picker map's focusable content `tabindex="-1"`, or drop `aria-hidden` and name the map instead. The 42-link list stays the text equivalent either way (F1) | `nr-neighborhood-picker.html:46`, `nr-leaflet.html:31` |
| B2 | Add `aria-expanded` and `aria-controls` to the expand-all button and keep them in sync in `app.js:55-74` (F12) | `nr-topic-spa.html:227`, `app.js` |
| B3 | Name each chart from the indicator it shows, rather than leaving vega's `"Vega visualization"`; add `role="region"` + `aria-label` on the mount, or a `<figure>`/`<figcaption>` (F9) | `chart.js:185`, `cards.js:199` |
| B4 | Give the vega actions `<summary>` an `aria-label`, or pass `actions: false` if the export menu is not wanted on a public report (F6) | `chart.js:185` |
| B5 | Fix heading order: make the indicator card heading a level below its section, and the footer headings follow the last content level (F10) | `cards.js:104`, `nr-topic-spa.html:247`, `nr-report-footer-sm.html` |
| B6 | Add `role="region"` to accordion panels and label them with the indicator name alone (F17) | `cards.js:188-189` |
| B7 | Add a visible `<label>` for the search field so the name survives typing, and give the `role="group"` wrapper a name | `nr-neighborhood-picker.html:29-38` |

Proof: axe, plus the tab sweep showing 0 stops inside an `aria-hidden` subtree, plus the heading
probe showing a monotonic sequence.

**Executed 2026-08-11. Three notes for the record:**

- **B1's mechanism, measured rather than assumed.** Two things put keyboard stops in the hidden
  subtree, and neither is an authored `tabindex`: Leaflet's `keyboard` option sets `tabindex="0"`
  on `.leaflet-container`, and the 42 polygons follow it into the tab order carrying **no**
  `tabindex` attribute at all — which is why `el.tabIndex` reading `-1` misleads. The fix sets
  `tabindex="-1"` explicitly, which removes an element from the sequential order whatever put it
  there, and is keyed off `closest('[aria-hidden="true"]')` rather than a partial parameter, so
  the report SPA's map — not hidden, and the only in-place neighborhood switcher — is untouched.
- **B5 reached further than its file list.** Fixing `cards.js`, the section title and the footer
  made the *report SPA* monotonic but left `heading-order` on the landing page and the topic
  indexes, whose `h1 → h3` comes from two headings the row did not name: `Choose report`
  (`section.html:35`) and `Choose Neighborhood` (`nr-neighborhood-picker.html`). Both are now
  `<h2>` carrying `.h3` for size. Heading level and type scale are independent here, so no
  heading in Stage B changed size.
- **B7 needed a second half the row did not anticipate.** flexdatalist hides the authored input
  and renders its own, so `<label for="flex_search">` names an element the reader never focuses.
  `nr-neighborhood-picker-js.html` points the generated input at the same label with
  `aria-labelledby` after init. Verified over CDP: the field computes to
  `textbox :: "Search for a neighborhood"` both empty and with `Bay` typed in.

### Stage C — behaviour and design; proposed 2026-08-10, decided 2026-08-11

The five items were written as options. The options are now decisions, taken 2026-08-11, and each
row below records the one chosen and what it rules out. Two things stated in the original proposal
did not survive a check before implementation; both are corrected in place under C3 and C4.

- **C1 (F7) — announce the re-render and fix the title.** *Chosen: update `document.title`, add a
  polite live region, do not move focus.* Focus stays where the reader put it — moving it on a
  pointer click costs a mouse user their place in the map on every comparison, and after C2 a
  keyboard user is already standing on the polygon they activated, so there is nothing to rescue.

  **`spaConfig.reportName` cannot build the title.** It is `.Title`, and `<title>` is
  `.Params.seo_title` verbatim (`partials/head.html:64-66`), composed by the content adapter as
  `seo_short_name + " in " + <neighborhood>`. The two differ on Active Design — `"Active Design,
  Physical Activity and Health"` against `"Active Design"` (`data/globals/NR_topics.yml:23-25`) —
  so building from `reportName` would rewrite the shipped title on 42 of the 210 pages. The
  adapter carries only the composed `seo_title`, so `seo_short_name` has to be added to its params
  dict and passed through `NR_TOPIC_SPA_CONFIG`.

  The announcement is suppressed on first paint. `renderAll` also runs at load, where nothing has
  changed and a "report loaded" utterance would be noise; the guard is the previous value of
  `currentNeighborhood`, which is null until the first render completes.

- **C2 (F2) — make the map keyboard-operable.** *Chosen: bind `keydown` Enter/Space alongside
  `click`, and name each polygon.* Rules out the alternative — polygons non-focusable plus a
  42-link list on the SPA — which would have left the report page with no in-place keyboard
  switcher at all, turning every keyboard comparison into a page load.

  Confirmed against the installed Leaflet 1.9.4 before writing the handler, since the whole case
  for this option is that the event already arrives. The map container registers
  `keypress keydown keyup` among its DOM listeners (`leaflet-src.js:4435`); `_findEventTargets`
  walks up from `e.target`, so a keydown on a focused `<path>` resolves to that path's layer, and
  only if the layer `listens()` for the type (`:4466-4491`); `_fireDOMEvent` then fires it on the
  layer, skipping the coordinate computation for key events specifically (`:4556-4565`).
  `layer.on('keydown', …)` is therefore the whole plumbing. Nothing in Leaflet's own keyboard
  handler binds Enter or Space, so there is no contention.

- **C3 (F5) — put the valence in text *and* in the pixels.** *Chosen: an `.sr-only` sentence plus
  a glyph in the pill.*

  **The proposal above closed half of this finding, and the half it closed is not the half F5 is
  filed under.** F5 is WCAG 1.4.1, *Use of Color*, which is about visual presentation.
  `.worse` and `.better` differ by `background-color` and by nothing else
  (`assets/scss/theme.scss:657-667`), and both pills read the same two words — so an `.sr-only`
  span, being invisible, leaves a sighted reader with a colour vision deficiency exactly where
  they started. Text for the accessibility tree and a non-colour cue in the pixels are two
  requirements, not two ways of meeting one.

  The glyph is the vocabulary this report already prints: `\f14a` square-check for the good case,
  `\f071` triangle-exclamation for the bad, the Font Awesome 6 codepoints `.comp-good` /
  `.comp-bad` carry at `assets/scss/_custom.scss:56-70`. Square against triangle differ in shape
  and not only in colour, which is the point. §4 recorded that Chrome drops these `::before`
  glyphs from the accessibility tree entirely — which is why the glyph cannot be the whole fix,
  and equally why it costs the tree nothing to add.

  The `.sr-only` sentence *replaces* the pill word rather than appending to it: the pill span goes
  `aria-hidden`, and the sentence sits beside it. Appending would have made the accordion button's
  name end `… Age-adjusted percent Higher, Higher than most neighborhoods`.

- **C4 (F3) — the typeahead.** *Chosen: patch the NR picker's own init.* Rules out, for now, both
  the shared version and the library swap.

  flexdatalist 2.3.0's `accessibility` function
  (`node_modules/jquery-flexdatalist/jquery.flexdatalist.js:474-482`) writes `aria-autocomplete`,
  `aria-owns` and a **static** `aria-expanded: 'false'` onto the generated input, and never emits
  `role="combobox"` or `aria-activedescendant`. The string `aria-expanded` appears exactly once in
  the library, which is why it stays `"false"` with the listbox open: there is no code path that
  updates it, and no option that makes it emit the role.

  **The library swap is not the low-cost option the proposal implied.** "Replace it with the
  accessible autocomplete already styled in `theme.scss:183-262` and used elsewhere on the site"
  is right about *styled* — `.autocomplete__*` runs at `assets/scss/theme.scss:175-265` — and right
  that the bundle is loaded, by `themes/dohmh/layouts/index.html:317` and
  `themes/dohmh/layouts/data-explorer/single.html:1155`. It is wrong about *used*:
  `accessibleAutocomplete(` and `enhanceSelectElement` appear in no template and no content file
  in the repo, the only other hit being a frontmatter path string at
  `content/data-features/neighborhood-air-quality/index.md:27`
  `[verified 2026-08-11: grep for both identifiers across every .html and .md in the tree]`.
  Adopting it here would be the site's first call site, and the ZIP-code search, the two-property
  match and the Clear button would all be rebuilt against an unexercised API.

  Scope is a choice rather than a given: flexdatalist is initialised at four independent call
  sites — this picker, `partials/de-text-search.html:47`, `data-features/aqe.html` and
  `data-features/hvi.html`. The other three keep the defect and are logged in
  `documents/site-wide-audit-2026-06-27.md` rather than pulled into an NR stage.

  **C4 also absorbed F18**, which its own verification turned up: Escape did not dismiss the
  list. That was left out of the original scope as behaviour redesign, then folded in, because
  the fix turned out to reuse the observer the ARIA sync already runs rather than needing a
  handler of its own — see F18 for the mechanism and why cancelling the library's timer is not
  available.

  Two traps found in the library before writing the sync, both about *which* paths close the
  listbox. `remove()` is the only one that fires `removed:flexdatalist.results` (`:1633`); the
  Escape key (`:2046`) and the outside-click handler (`:2028`) each call `.remove()` on the
  container directly and fire nothing. Syncing `aria-expanded` off the library's events alone
  would therefore have left it reading `"true"` after Escape — the same class of stale-state
  defect F3 is about. The sync watches the DOM instead. Second: the `<li>`s carry `role="option"`
  and `tabindex="-1"` but **no `id`** (`:1551-1560`), so `aria-activedescendant` needs ids minted
  at render time.

- **C5 (F16) — dangling tooltip references.** *Chosen: clear the attribute, keep the tooltips.*
  Leaflet writes `aria-describedby` in `_setAriaDescribedByOnLayer`, reached from `openTooltip`
  (`leaflet-src.js:10930-11002`), and removes it nowhere; `tooltipclose` fires on the source layer
  (`:10710-10712`), so the layer's own event is the hook. Tooltips stay because they are the
  hover affordance, and after C2 the polygons carry their own `aria-label`, so the description is
  redundant as well as dangling.

## 6. Ledger

| Stage | Status | Proof that ran | Next command |
|---|---|---|---|
| Instrument built | Done 2026-08-10 | Positive control fired; rendered control matched on all 4 pages; tab sweep completed without hitting its limit (96/96/94/128 stops) | — |
| Audit run and triaged | Done 2026-08-10 | `node scripts/nr-a11y-audit.mjs` against `local_prod` on :8080; findings in §2, disconfirmed candidates in §4 | — |
| Stage A | Done 2026-08-10; committed in `726a6eba4a` and `dfd8430a5e`; one item spun out — see below | A1–A7 all confirmed in served HTML, then `node scripts/nr-a11y-audit.mjs` against the running `local_prod` server on :8080 (`DE_BASE_URL=http://localhost:8080/local-prod/`). Both controls passed. `brokenRefs: []` on all four pages; `duplicateIds` down to the two site-shell ids (`languages`, `skip-header-target`); `image-alt` down to one node per page, `.pr-1` — the site-shell header logo — including under print, so F11 is closed; `.nr-topic-link` measured 5.13:1 | — |
| Stage A follow-on (F4 remainder) | Done 2026-08-11, committed in `cc258553c0`, for `.btn-report`; `.nr-list-toggle` **parked by decision** | `$primary-dark` added; `.btn-report` measured 5.29:1 at rest and on hover; re-run of `node scripts/nr-a11y-audit.mjs` shows the SPA's two `color-contrast` nodes gone, leaving one site-wide — `.flex-grow-1` on the topic index | Unparks if someone accepts darkening `.btn-outline-primary` site-wide. Nothing to do otherwise |
| Stage B | Done 2026-08-11 | `npm run lint` clean; `node scripts/nr-a11y-audit.mjs` against `local_prod` on :8080, both controls passed; `npm run smoke` 15 pages clean. Keyboard stops inside an `aria-hidden` subtree **46 → 0** on both picker pages (total stops 96→50 landing, 94→48 topic index). `summary-name` ×22 and `svg-img-alt` ×44 both **gone** from the all-expanded scan. `heading-order` gone from all four pages; every exposed sequence monotonic. Accessible names read from Chrome over CDP: 22 charts, 22 distinct names, 0 unnamed `graphics-symbol`; expand-all `aria-expanded` flips true/false across two clicks with all 8 `aria-controls` ids resolving; search field keeps its name after typing. `node scripts/nr-characterization.mjs --check` against a spawned `dev_stage` server — see the note below | — |
| Stage C | Done 2026-08-11, in four commits — C1 `5fecb8cb18`, C2+C5 `ace23eef17`, C3 `9f2ec19a01`, C4+F18 `c415c83a54`. All five items decided — see §5, where each records the option chosen and what it rules out. C4 scoped to the NR picker only; the other three flexdatalist call sites logged in the site-wide audit §5k. One new finding raised during verification and then fixed as part of C4: F18 | Per-item table below. `npm run lint` clean; `npm run docs-check` passed; `node scripts/nr-characterization.mjs --check` **passed**, 3/3 targets matching the staging baseline; `node scripts/nr-a11y-audit.mjs` both controls passed, on `dev_stage` and again on `local_prod` with the same result; `npm run smoke` 15 pages clean on both | — |

**Two servers, and why the runs name which one.** A `local_prod` server on :8081 was started by
someone else partway through, alongside the `dev_stage` one on :8080 this work began against.
`resources/_gen` is not environment-namespaced, so the pages served on :8080 began carrying
`/local-prod/` asset URLs — jQuery 404ed, `$ is not defined`, and the picker never initialised.
That is the failure `CLAUDE.md` describes for a static rebuild beside a running server; two
servers do it too. Diagnosed rather than assumed: the served HTML still contained
`wireComboboxState`, and the same page on :8081 loaded flexdatalist cleanly with zero page
errors. The `dev_stage` server was stopped — it was the contaminating half and the one this
session started — and everything after that point was verified on :8081. The earlier `dev_stage`
numbers predate :8081 and stand; the F18 work is `local_prod` throughout.

`nr-characterization.mjs` was **not** re-run after the F18 fix, deliberately: it captures report
pages only, and F18 touched `nr-neighborhood-picker-js.html`, which the report SPA does not load.
Re-running it against `local_prod` would also have failed every target on the `/local-prod/`
against `/dev-prod/` path prefix alone — a known false failure, not a signal.

**Stage C's proof cannot be an axe count, and knowing that up front is what shaped it.** After
Stage B nothing NR-scoped was left that an axe rule could see (see the note below this table),
and four of the five C items are for defects no rule implements. So each carries its own probe,
and each probe was shown capable of failing before its result was believed. What ran, and what
it returned:

| # | What was observed | The control, and what it showed |
|---|---|---|
| C1 | Across one keyboard-driven switch: `<h1>`, `document.title` and the URL all moved together, and the live region read `"Report updated. Now showing Asthma and the Environment in Kingsbridge - Riverdale."` | Read before *and* after. A probe reading only the after-state passes against a title that never moved — the exact defect F7 recorded |
| C2 | 42 polygons, 42 with `role="button"`, 42 with a non-empty `aria-label`; the accessibility tree returned 42 button nodes and **0 unnamed** | Enter pressed on the polygon for the neighborhood *already shown*: `<h1>`, title, status and URL byte-identical afterwards. So "it changed" is not the only outcome the probe can produce |
| C3 | `.worse::before` = U+F071, `.better::before` = U+F14A, both `"Font Awesome 6 Free"`, both inside an `aria-hidden` span; 23 of 23 accordion buttons carry the sentence | Both classes sampled on one page (8 `.worse`, 3 `.better`) and the codepoints compared. A rule matching *neither* looks identical to one matching both if only one class is read. Codepoints, not the raw `content` string: these are private-use characters a terminal prints as nothing, so an empty rule and a working one render the same |
| C4 | `role="combobox"`; `aria-expanded` `false → true` on typing, `true` on ArrowDown with `aria-activedescendant` following the highlight and resolving, `false` after an outside click. With F18 folded in: `false` at +60ms after Escape and still `false` at +600, +900 and +1800ms, on both picker pages | Escape and outside-click are the two paths the library fires no event for (§5 C4). Sampled **twice** around Escape rather than once — which is what separated a stale attribute from F18's genuine reopen, and a single 500ms sample would have read exactly like the defect being fixed. Four controls on the dismissal itself, since a list that never returns looks the same as a search that broke: typing reopens it, selection navigates from a clean field, selection still navigates with an Escape before it, and ArrowDown+Enter navigates |
| C5 | Leaflet's own tooltip API driven over all 42 layers: `withAttrAfter: 0`, `danglingAfter: 0` | `peakWithAttrDuringSweep: 1` — the attribute was observed present mid-sweep, so the probe can see it at all. Without that, a selector that never matched and a page with nothing dangling report the same zero. The mouse-driven sweep beside it reached only 2 of 15 attempted polygons, because a UHF shape is concave and its bbox centre lands inside a neighbour; that count is reported rather than the sweep being presented as exhaustive |

**One thing this stage changed that no C item asked for.** C2 needed a name for each polygon, and
the obvious source — the geojson's `GEONAME` — disagrees with the `UHF_name` the report `<h1>`,
the breadcrumb and the URL slug all use, on 6 of the 42: `"Fordham - Bronx Park"` against
`"Fordham - Bronx Pk"`, `"Rockaway"` against `"Rockaways"`, and four more
`[verified 2026-08-11: static/geojson/UHF42.geojson diffed against data/globals/uhflist.json by
GEOCODE]`. Naming from `GEONAME` would have made the accessible name differ from the visible
tooltip on those six, which is WCAG 2.5.3. Both now route through `featureDisplayName`, the same
resolution `selectNeighborhood` already used to decide what the report renders — so the tooltip
text changed on those six polygons. That is a visible change, and it is here rather than in a
C-item row because it was forced by C2 rather than planned.

**`aria-controls` was added, measured, and then made conditional.** The first version set it once
at init, which axe reported as `aria-valid-attr-value` in **`incomplete`** — "Unable to determine
if aria-controls referenced ID exists on the page while using aria-haspopup" — on both picker
pages, because flexdatalist creates and destroys the listbox per search and the id names nothing
while the field is closed. Isolated by removing the attribute in the page and re-running
(`incomplete: []`), then removing the library's `aria-owns` as well (still `[]`, so `aria-owns`
was not a contributor). Both are now added and removed with the list. This is the second time on
this branch that `incompleteIds` carried something `violations` did not — the reason CLAUDE.md
says to read it.

**The characterization harness was re-baselined, and it cannot see the chart naming.** Ran
2026-08-11 against a `dev_stage` server the harness spawned itself, after killing the `local_prod`
one — so the baseline's `/dev-stage/` prefix matched and `finalURL` was not a false failure. All
three targets differed in exactly one field, `reportHeader`, and both changes in it predate Stage B:
A4's "(downloads a CSV file)" wording (`dfd8430a5e`) and the Expand all control (`43e42b666e`), both
landing after the baseline was last written at `2bce6c6d46`. Nothing else moved — `accordionIds`,
`chartCount`, `markGroups`, `demographics` and `zipList` all matched, which is the useful result,
since `cards.js` rewrote the accordion markup. Re-baselined after reading the diff, and the
re-capture changed exactly those three lines.

**That run also exposed a dead field in the harness, since fixed.** `charts[].ariaLabel` read
`.vega-embed`, the outer wrapper, which carries no `aria-label` at all — and `tidy()` turned the
missing attribute into `""`, so the field looked like a captured value while proving nothing. It was
blind to the chart naming B3 added, and to B4's actions label. A browser probe on 2026-08-11 located
the name: vega-embed's inner `.chart-wrapper`, carrying `role="graphics-document"`, reading
`"Asthma ED visits (adults) across all NYC neighborhoods"`, with the embed and `svg.marks` both
null. The capture now reads that node by role and records `chartName` and `actionsLabel`, preserving
`null` rather than collapsing it to `""`. Both baselines were re-captured. The field now
distinguishes the three targets — `Asthma ED visits (adults)`, `Asthma (adults)`, `Coastal flood
risk` — where it previously held the same empty string for all of them, so B3 and B4 have a
regression net that CDP alone was providing.

**After Stage B, every remaining axe violation on the four pages is out of NR's scope or
deliberately parked** — `aria-allowed-attr` (F3, deferred to C4), `color-contrast` (the parked
site-wide list toggle), and `image-alt` / `link-name` / `landmark-unique` (the §3 site-shell
defects). Nothing NR-scoped is left that an axe rule can see; what remains for Stage C is F7 and
F16, which no rule implements.

**After Stage C, `aria-allowed-attr` is gone too.** The post-C run against `dev_stage` leaves
three violation rules and one deferral across the four pages, none of them NR's:

| Rule | Node | Pages | Status |
|---|---|---|---|
| `image-alt` | `.pr-1` | all 4 | §3 site-shell — the header logo |
| `link-name` | the logo's wrapping anchor | all 4 | §3 site-shell, same element |
| `color-contrast` | `.flex-grow-1` | landing, topic index | The site-wide `.btn-outline-primary` list toggle, parked by decision |
| `color-contrast` (**incomplete**) | — | all 4 | axe's standing deferral on backgrounds it cannot resolve. A floor, not a census |

Stage A modified seven files: `themes/dohmh/layouts/neighborhood-reports/nr-topic-spa.html`,
`.../section.html`, `themes/dohmh/layouts/partials/overlap-tool.html`,
`.../nr-report-footer-sm.html`, `assets/scss/_custom.scss`, `assets/scss/_a-global-variables.scss`,
`assets/scss/theme.scss`. Nothing under `assets/js/nr-topic-spa/` was touched.

**Two instrument notes for whoever runs Stage B.** Pass `DE_BASE_URL` when a `local_prod` server is
already up, or `ensureDevServer()` will not reuse it — it spawns `dev_stage`, whose data differs.
And read `wcag.incompleteIds` in the per-page JSON, not only `wcag.violations`: `color-contrast` is
deferred on every page, so a violation count of zero for that rule proves nothing on its own.

## 7. Re-running this

```
node scripts/nr-a11y-audit.mjs
```

Reuses a running dev server or starts one, per `scripts/dev-server.mjs`. Set `DE_BASE_URL` to point
it elsewhere; set `A11Y_OUT` to choose where the per-page JSON lands (default is a temp directory).
`npm run a11y:nr` works, but PowerShell eats the `--` in `npm run a11y:nr -- --flag`, so call node
directly when passing arguments.

Two things to know before believing a clean run. It exits non-zero if the positive control does not
fire or if any page's rendered-content control matched nothing — those are the only conditions it
treats as failure, because findings are for triage, not for gating. And it was run here against
`local_prod`, whose data comes from a local EHDP-data checkout; if that is not serving, the SPA
renders empty accordion shells and the rendered-content control is what catches it.
