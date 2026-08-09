# NR neighborhood picker — unification options and ledger

Branch `feature-MOD-Lab-NR-recode-refactor`. Follow-up to
`documents/nr-topic-index-picker-restore-2026-08-09.md`, which restored the map and typeahead to
the topic index and left the two copies of the picker to drift.

Scope set by the user in session: make the selector map bigger on both pages by hoisting the
sibling column's text above it, and unify the two implementations. The plan lives at
`~/.claude/plans/nr-neighborhood-picker-unify.md` — **outside the repo, so this document is the
one that survives**. Anything a later session must act on belongs here, not there.

**Status as of 2026-08-09: all tasks done, browser-verified, and committed, including the one
choice that was left open — the search input height, decided as Option A (42px on both) in §2.
Nothing here is outstanding.**

| # | Task | Status | Proof that ran |
|---|---|---|---|
| 1 | This document | **DONE 2026-08-09** | n/a — it is the record |
| 2 | `fitBounds` + `zoomSnap` in `nr-leaflet`'s no-`geocode` branch | **DONE 2026-08-09** | `[verified 2026-08-09: Playwright, dev_stage :8080]` layer spans 78%w/97%h of a 679×550 box at zoom 10.39, 81%w/96%h of 468×400 at 9.91. Regression: `bayside_little_neck` still flies to zoom 12 |
| 3 | `.nr-selector-map` height class in `_custom.scss` | **DONE 2026-08-09** | `[verified 2026-08-09]` rendered 679×550 at 1280px viewport, 468×400 at 500px — both pages identical |
| 4 | `nr-neighborhood-picker` + `-js` partials | **DONE 2026-08-09** | Exercised by tasks 5–6 below; `aria-hidden="true"` confirmed on both pages |
| 5 | Topic index layout + `nrPickerDestination` | **DONE 2026-08-09** | `node scripts/smoke-pages.mjs` exit 0, 15 pages clean. Map click → `kingsbridge_riverdale/housing_and_health/`; typeahead on `climate_and_health` → `east_harlem/climate_and_health/` |
| 6 | Landing page layout + `nrPickerDestination` | **DONE 2026-08-09** | `node scripts/smoke-pages.mjs` exit 0. `#Housing` clicked then "Bayside" selected → `bayside_little_neck/housing_and_health/`, i.e. the runtime destination, not a baked default |
| 7a | CLAUDE.md prose — Topic index bullet rewritten, the two new partials and the `zoomSnap` fact documented, this doc added to the audit list | **DONE 2026-08-09** | `node scripts/docs-check.mjs` exit 0, 1 doc checked, no stale paths or identifiers |
| 7b | `docs-check verified` stamp at `CLAUDE.md:2` | **DONE 2026-08-09** | Re-stamped in a follow-up commit citing 7a's commit, as `88e327c8a0` did for the picker restore |
| 8 | Input height decision — Option A, and `.nr-flexdatalist` + the `input_class` parameter deleted | **DONE 2026-08-09** | `[verified 2026-08-09: Playwright against local_stage :8080]` visible alias input 42px on both pages at 1280px and 500px, `#clear` 42px; `nr-flexdatalist` absent from the rendered class list, where it was present before |

`node scripts/nr-characterization.mjs --check` also passed — 3 targets match baseline — which is
what bounds task 2's blast radius to the two picker pages.

Two harness notes for whoever runs these. **Call the scripts directly** — PowerShell strips the
`--` in `npm run smoke -- --flag`, and the script prints its usage line and exits 1 while looking
like a real failure. And the harness spawns its own `dev_stage` server on :8080 when none is
running, which is what these runs used.

### Two corrections to the prescribed checks

**`fitBounds` alone was not enough, and the first measurement caught it.** Leaflet's default
`zoomSnap: 1` rounds `fitBounds` *down* to a whole zoom level: the city spanned only 59% of the
box width and 85% of its height, at zoom 10 — indistinguishable from the old hardcoded `setView`
zoom in a screenshot. The fix is `map.options.zoomSnap = 0` immediately before the fit, set at
runtime inside the `else` branch rather than at map construction so the `geocode` branch keeps
whole-number framing on the 42 neighborhood index pages. **The positive control that proved
`fitBounds` was running at all, before the fix, was the mobile viewport reporting zoom 9 where the
old code hardcoded 10** — desktop's 10 alone would have been consistent with the branch never
firing. Measure the layer's pixel span against the container, not the zoom number.

**The first map-click check was a broken instrument that would have passed as a failure.** It
waited on `waitForURL(/neighborhood-reports\/.+\//)` — a pattern the topic index's *own* URL
already matches — so it resolved instantly and reported the un-navigated URL. Wait on the pathname
**differing from the one you started on**, captured before the click. A navigation check whose
pattern matches the starting page tests nothing.

---

## 1. Why there are options at all

The two pickers are near-duplicates that drifted. Verified 2026-08-09, reading both files:

| | NR landing (`section.html`) | Topic index (`nr-topic-index.html`) |
|---|---|---|
| Column | right `col-md-5` | left `col-md-4` |
| Map height | `style="height:400px"` (`:90`) | `style="height: 450px"` (`:46`) |
| Map wrapper class | `.nr-clickable-uhf` — **no CSS rule anywhere** | `.border` |
| `aria-hidden` on map | yes | no |
| Search position | above the map | below the map |
| Input class | `.nr-flexdatalist` (64px) | none |
| Placeholder | `"Search"` | `"Search name or ZIP code"` |
| flexdatalist config | `:286-300` | `:165-179` — **byte-identical, 13 options, same order** |
| `js_bot` resource loads | `:213-217` | `:153-157` — **identical** |
| `#clear` handler | identical | identical |
| Destination | runtime `intendedDestinationName` | build-time `$topicSlug` |

**Every line number in that table is the state *before* this work** — the markup has since moved
into `themes/dohmh/layouts/partials/nr-neighborhood-picker.html` and the init into
`nr-neighborhood-picker-js.html`, so none of them resolve now. Kept as the record of what was
unified, which is why this document does not opt into `docs-check`.

The last four rows are real duplication. The rest is drift — differences nobody chose, which
appeared because the same block was written twice. Unifying forces a decision on each, and the
sections below are that decision list.

## 2. Input height — decided: Option A, 42px on both

**Decided 2026-08-09 by the user.** `.nr-flexdatalist` is deleted, the partial no longer takes an
`input_class`, and both pages render the default `.form-control` field.
`[verified 2026-08-09: getBoundingClientRect on the visible alias input, local_stage server on
:8080 — 42px on both pages at 1280px and 500px viewports, with #clear 42px beside it. The landing
page measuring 42 rather than its former 64 is itself the control that the change took effect.]`

The options below are the record of what was weighed, not a live choice.

`assets/scss/_custom.scss`:

```scss
.nr-flexdatalist {
  height: 64px;
}
```

Against the default `.form-control`, which **renders at 42px** on the topic index
`[verified 2026-08-09: getBoundingClientRect on the visible input, Playwright, both viewports]`.
So the choice is 64px against 42px — a 52% difference in height.

Do not quote the SCSS derivation instead. Bootstrap 4.6.2's `$input-height` is
`calc(1.5em + .75rem + 2px)`, and this project overrides none of the four variables feeding it, so
the formula gives ≈38px at a 16px root font — but the field that actually renders is
flexdatalist's alias input, which carries the plugin's own stylesheet on top of `.form-control`.
The computed 38px is a floor, not the rendered value; the 4px gap was found by measuring, not by
reading SCSS.

It is a **height override only** — no `font-size`, so the typed text is identical in both and only
the box around it changes.

**The class does reach the rendered field.** Worth stating because it is not obvious: flexdatalist
hides the authored `<input>` and builds its own, copying `class` and `placeholder` across —
`node_modules/jquery-flexdatalist/jquery.flexdatalist.js`, the alias-input constructor:

```js
.attr({
    'class': $this.attr('class'),
    'name': ($this.attr('name') ? 'flexdatalist-' + $this.attr('name') : null),
    'id': aliasid,
    'placeholder': $this.attr('placeholder')
})
```

So both the 64px and the placeholder string survive the swap.

### Option A — 42px on both (chosen)

```
[ Search name or ZIP code                        ][ Clear ]     42px

[                                                          ]
[                    MAP  (col-md-8)                       ]
[                                                          ]
```

Deletes `.nr-flexdatalist` entirely: the landing page's `nr-neighborhood-picker` call is its only
consumer now that the input markup lives in the partial, so the rule in `assets/scss/_custom.scss`
goes with it. Simplest partial — no `input_class` parameter at all.

Against it: the landing page's search is currently its most prominent control, and this shrinks it
by 40% at the same moment the map beneath it gets bigger.

### Option B — 64px on both

```
[                                                          ]
[ Search name or ZIP code                       ][  Clear  ]     64px
[                                                          ]

[                                                          ]
[                    MAP  (col-md-8)                       ]
[                                                          ]
```

A bigger touch target under a bigger map, consistent across both pages. Partial hardcodes
`.nr-flexdatalist`; still no parameter.

Against it: 64px with 16px text is a lot of empty box, and the `Clear` button beside it either
stretches to match or sits short in the group. **Check that pairing in the browser before
choosing** — `.btn-group` stretches children to the group height, so `Clear` becomes a 64px button
too, which is not what it looks like on the landing page today at `col-md-5` width.

### Option C — parameterized (shipped first, then superseded by A)

`{{ partial "nr-neighborhood-picker" (dict "page" . "input_class" "nr-flexdatalist") }}` on the
landing, `"input_class" ""` on the topic index. Code unifies, appearance does not change on either
page. Flipping to A or B later is a one-line edit per caller plus, for A, deleting the rule.

This is what the plan implemented, so that the height decision was not blocked on the layout work.
It shipped in `6e368b6e98` and was replaced by Option A the same day, which is why the parameter
appears and disappears within two commits.

## 3. Placeholder — decided

`"Search name or ZIP code"` on both, hardcoded in the partial. The landing page's `"Search"` says
nothing about ZIP search being available, and ZIP is why `searchIn` includes `Zipcodes`.

## 4. Search above or below the map — decided: above

Landing has it above, topic index below. Above wins on both, because the search is the primary
affordance and below-the-map means scrolling past 400px of map to reach it on a phone.

This flips the topic index's current order. The consequence is in the prompt text, which currently
reads `<i class="fas fa-arrow-left ...">Choose a neighborhood from the map or the search box` with
a `d-none d-md-inline` gate — the arrow was hidden below `md` because the columns stacked and it
pointed at nothing. With the picker below the prompt at every breakpoint, `fa-arrow-down` is
correct everywhere and the gate is dead.

## 5. Map wrapper border — decided: `.border` on both

Topic index has it, landing does not, and the landing's `.nr-clickable-uhf` has no rule anywhere in
`assets/scss/` — it is a naked hook left from the deleted `nr-clickable-uhf.html` partial (see
`documents/nr-output-retirement-scoping-2026-08-04.md` §2). Replace it with `.nr-selector-map`; one
class, one meaning.

## 6. `aria-hidden` on the map — decided: yes on both, and this one is not cosmetic

Landing sets `aria-hidden="true"` on the map wrapper (`section.html:90`); the topic index does not.

Both pages carry a text equivalent — `partials/nr-show-zips.html`'s `sr-only` "Select neighborhood"
list on the landing, the server-rendered 42-link list on the topic index — and the Leaflet layer
holds nothing focusable, so a keyboard user cannot reach the polygons either way. On that reading
`aria-hidden` is the honest state and the topic index is the one that is wrong today.

**This is the only item here that changes assistive-technology behavior rather than pixels**, so it
gets flagged rather than folded in silently. Backing it out is one attribute in the partial, which
would then need a parameter. If it is backed out, the alternative worth considering is the reverse:
drop `aria-hidden` from both and give the map an accessible name, since the ZIP-list equivalents are
not obviously discoverable as substitutes.

## 7. Map size and framing — decided

`col-md-8 mx-auto` on both, and one shared height class replacing the two inline styles:

```scss
.nr-selector-map {
  height: 400px;
}

@include media-breakpoint-up(md) {
  .nr-selector-map {
    height: 550px;
  }
}
```

Lives in `assets/scss/_custom.scss` next to `.nr-flexdatalist` at line 176. Note that file is
**2-space indented** — match it rather than the 4-space repo default. `@include
media-breakpoint-up(...)` already resolves there (line 155), so no new import.

**Why a class and not two inline styles: `nr-leaflet`'s `#map` is `width:100%; height:100%` and has
no intrinsic size, so the wrapper is the only thing that sets it. Two callers each setting their own
inline height is exactly how 400px and 450px happened.**

### The framing change that makes the size change worth anything

`partials/nr-leaflet.html:25` calls `setView([40.715554, -74.0026642], 10)` and never fits to the
data. Zoom is scale, so a wider container at a fixed zoom shows more ocean and New Jersey — not a
bigger NYC. Widening the column without touching the zoom would make the map worse.

The fix replaces the `else` branch that previously only logged, and it takes **two** statements,
not one:

```js
map.options.zoomSnap = 0;
map.fitBounds(uhf_geojson.getBounds(), { padding: [10, 10] });
```

`fitBounds` alone is not enough — see the corrections under the ledger above for why, and for the
positive control that distinguished "the branch never fired" from "the branch fired and
under-filled". Both statements sit inside the `else`, so `zoomSnap` never applies to the `geocode`
branch.

Blast radius is exactly these two pages: `geocode` is set solely by the content adapter
(`content/neighborhood-reports/_content.gotmpl:38,59`), so the 42 neighborhood index pages take
the `geocode` branch and keep their highlight-and-`flyToBounds` behavior untouched — confirmed by
`bayside_little_neck` still flying to zoom 12. No parameterization of the partial is needed.

**Known limitation, recorded rather than solved.** UHF42's bounds are roughly square, so the fit
is constrained by height and leaves horizontal slack: measured 78% of width against 97% of height
in a 679×550 box. Acceptable at this width. If the map is later widened to full content width the
slack grows, and the answer then is an aspect-ratio wrapper rather than a taller fixed height.

## 8. What is deliberately not unified

- **`nr-leaflet` itself.** Its `id="map"` is hardcoded in both `L.map("map", …)` and the `#map:hover` rule, so the partial is a page singleton. Parameterizing it would pull in `nr-neighborhood-index.html` — 42 pages that need the map but not the picker — for no benefit here.
- **`name="indicator_name_suggestion"`** on the search input, which describes indicators rather than neighborhoods. It is the same string in all five flexdatalist templates site-wide; renaming one makes it the odd one out. Still a candidate for a separate sweep, as the picker-restore memo said.
- **The neighborhood list equivalents.** The landing builds its list in JS (`nr-show-zips.html`); the topic index server-renders 42 links behind a collapse. The topic index's version is the one that gives crawlers a path into the 210 report pages, which is the argument Option D rested on — converging on the JS version would undo that, and converging on the server-rendered one is a separate piece of work.
