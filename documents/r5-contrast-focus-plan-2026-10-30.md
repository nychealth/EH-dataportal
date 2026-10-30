# R5: Contrast, focus and link underlines (2026-10-30)

Batch R5 of `documents/site-wide-audit-2026-10.md` (Roadmap): 9 P1 rows and 1 P2 (A-100, N-004,
N-005, N-061, N-062, N-065, N-069, N-070, N-071; N-072), on branch
`feature-audit-r5-contrast-focus`, cut from the local `production` at `095ebc5010`. This document is
the plan and the ledger. Rows are closed in the audit document only once their proof has run.

**Status as of 2026-10-30: Tasks 0 and 8 done; Tasks 1–3 and 5–7 edited and proved on the edited
tree; Task 4 deferred; Task 9 (commit, then close the rows) next.**

## Decisions

Taken by Chris on 2026-10-30, from options put to him with contrast ratios and rendered previews:

- **N-005 `.keywords`: `grey` (#808080, 3.95:1 on white) becomes Bootstrap's `$gray-600`
  (#6C757D, 4.69:1).** Rejected: #767676 (4.54:1), the lightest grey that passes, as a new
  hard-coded value where the vendored Bootstrap already carries one.
- **N-005 / N-065 data-stories text: a new `$color-data-stories-text: #C8433A` (4.86:1) for text
  only.** `$color-data-stories` (#D75047, 4.10:1) stays for icons and fills, which need 3:1 as
  graphics. This mirrors `$primary` / `$primary-dark` in `_a-global-variables.scss`. Rejected:
  darkening `$color-data-stories` itself, which shifts the section colour site-wide.
- **N-004 / N-061 underlines: `main a:not([class])`, breadcrumbs excluded**, replacing
  `#primary-content p > a:not([class])` in `_d-enhancements.scss`. Measured before choosing
  (preview: the rule injected into a served `prod_prod` build of R4's tip, `C:/temp/r1-base`):
  `#primary-content` is emitted by 16 templates and is absent on the data-index, data-stories
  landing, key-topics and data-features pages, where the widened `#primary-content` rule reached 0
  links, so it could not fix N-004's data-index lists. Under `main` it newly underlines 5 to 22
  visible links per page on six sampled pages (46 on the data-stories landing). Story cards'
  anchors change computed value but not pixels (element screenshots byte-identical); breadcrumbs
  would gain an underline on every page, so they are excluded. Rejected: `main` including
  breadcrumbs; `#primary-content` only.
- **N-072 "Show More" becomes a toggle**: the button stays visible, reads "Show less" when
  expanded, and keeps `aria-expanded` in step, so focus stays on it and the list can collapse
  again. Rejected: hiding it and moving focus to the first revealed story; deferring the row.
  **Amended 2026-10-30, open:** that choice rested on `$gray-600` being Bootstrap's #6C757D. It is
  not here: `_a-global-variables.scss` sets `$accessible-colors: true`, whose block redefines
  `$gray-600: #777677` (4.52:1). `.keywords` uses `$gray-600` and so renders #777677; hard-coding
  #6C757D is the alternative. Put back to Chris, who asked why the override exists: it arrived in
  the repo's first commit (`4a87b2156c`, 2021-07-07, "Bringing in from previous repo") with no
  recorded reason. Shown an A/B of what else reads it (17 compiled rules: the breadcrumb's current
  item and divider on every page, `.form-control` / `select` / `.input-group-text` borders, the
  custom-control outline, disabled states), **he chose to remove the override**, so Bootstrap's
  #6C757D applies to all of them.
- **A-100 / N-062: the explorer's `Measure:` / `Boundary:` / `Time:` labels use `$primary-dark`**
  (#007A31, 4.74:1 on the card header's #DCF4E7), the precedent three `_de-custom.scss` rules
  already follow. Not put to Chris: it applies a recorded decision rather than making one.

## Instrument

- `scripts/site-a11y-audit.mjs prod_prod` with `A11Y_PAGES` set to `R5_PAGES` (below): axe,
  positive control, rendered-content control. Rules read: `color-contrast` and
  `link-in-text-block`, **violations and incomplete both**, since the audit records both rules
  as floors (incomplete on 89 and 126 pages).
- Focus probe for N-069 / N-070 / N-071, the audit's own: keyboard focus on the control, computed
  outline / box-shadow / text-decoration / background / colour at rest and focused, plus an element
  screenshot each way. Positive control: a `#global-footer` link, which must differ.
- N-072 probe: Enter on `#toggleButton`, then read `aria-expanded`, the label, computed `display`,
  and `document.activeElement`; Enter again must collapse the list.
- `node scripts/characterize-env.mjs prod_prod`, then `site-characterization-rebaseline.mjs
  --expect` if anything structural moves (an underline is not a recorded field, so a clean check
  is the expected result for the CSS tasks).
- `node scripts/smoke-env.mjs prod_prod`, for Task 7's template JS.

`R5_PAGES`:

```
(home),about/,data-stories/,data-stories/housing/,data-stories/urban-heat-island/,data-stories/racial-wealth-gap/,data-explorer/data-index/,data-explorer/asthma/?id=2380,key-topics/airquality/,data-features/heat-syndrome/,data-features/rat-mitigation-zones/,data-features/congestion-pricing-report/,data-features/realtime-air-quality/,data-features/neighborhood-air-quality/,data-features/hvi/,keywords/asthma/
```

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | all: reproduce before fixing; locate N-005's legend colours | *no commit* (measurement) | **DONE 2026-10-30** | Baseline and after, below |
| 1 | A-100, N-062 | | Edited | probe: 3 labels 3.91 → 4.74 |
| 2 | N-005 (`.keywords`); the `$gray-600` override | | Edited | probe 3.95 → 4.52 with the override, axe nodes gone; override removed afterwards: the rebuilt `theme.css` equals the previous one with its 18 `#777677` replaced by `#6c757d`, byte for byte (285,551 B both), so `.keywords` is #6C757D, 4.69:1 |
| 3 | N-065, N-005 (story-card text) | | Edited | probe: 1 element 4.10 → 4.86 |
| 4 | N-005 (legend colours) | *no commit* | **Deferred** (Chris, 2026-10-30): the words match map or chart colours, which belong to those pages' owners. N-005 stays OPEN, re-scoped to these 11 nodes | axe, below |
| 5 | N-004, N-061 | | Edited | axe `link-in-text-block` 9 pages / 40 nodes → 0 |
| 6 | N-069, N-070, N-071 | | Edited | focus probe: 3 of 3 NO INDICATOR → indicator; control fired both runs |
| 7 | N-072 | | Edited | Enter, Enter: focus stays on `#toggleButton`, list opens and closes, label follows |
| 8 | smoke, characterization, re-baseline if needed | *no commit*: no re-baseline needed | **DONE 2026-10-30** on the edited tree over `095ebc5010` | `characterize-env.mjs prod_prod`: 924 of 924, structure PASSED, as pre-registered (colour, decoration and focus are no recorded field; the toggle's label is `content`). `smoke-env.mjs prod_prod`: 1187 pages clean, Pagefind index served. Both ran before the `$gray-600` override was removed; that edit's whole effect on the build is 18 colour values in `theme.css` (Task 2), which neither harness reads |
| 9 | commit; close the rows in the audit | | Not started | |

Task 4 is a pause point: the legend colours on rat-mitigation-zones, congestion-pricing,
realtime-air-quality, aqe and hvi may be set in page JS or chart specs rather than `assets/scss/`,
and data-viz colours are a choice for Chris once Task 0 names where they live.

### Baseline and after

Before readings on `production`'s tree (`095ebc5010`); after readings on the edited tree over it.

- **axe**, `site-a11y-audit.mjs prod_prod` over `R5_PAGES`, axe 4.13.0, positive control fired
  both runs, 16 of 16 pages audited: `link-in-text-block` 9 pages / 40 nodes → 0 (and no longer
  incomplete anywhere); `color-contrast` 8 / 21 → 5 / 11, the 11 being Task 4's. `color-contrast`
  stays incomplete on 16 of 16, so it is a floor both times. A-100's labels and N-065's red are not
  among axe's violations in either run, so they were measured directly.
- **Direct contrast probe** (computed colour against the nearest opaque ancestor background;
  control: `.keywords` read 3.95 where axe reported 3.94): explorer `Measure:` / `Boundary:` /
  `Time:` on `asthma/?id=2380` 3.91 → 4.74; `.keywords` 3.95 → 4.52; the one element rendering
  `#D75047` across `main` on five pages, the home page's "New data stories", 4.10 → 4.86. That
  scan printed all 433 rows and found 127 `$primary-dark` rows, so it could see coloured text. N-065
  names `data-stories/`; its text there is black, `#212529` and `$primary-dark`.
- **Underlines**: on six pages the built CSS underlines exactly the preview's newly underlined links
  less the breadcrumb links (data-index 4, housing 22, about 10, data-stories 121, key-topics 3,
  heat-syndrome 9), and every breadcrumb link reads not-underlined.
- **Focus**: keyboard focus (focus, Shift+Tab, Tab); before, the share button, `#slider` and the
  Glossary button were identical at rest and focused in computed style and pixels; after, each
  gains `outline: auto`. Control (`#global-footer` link) changed both runs.
- **N-072**: before, Enter left focus on `BODY` and a second Enter did nothing; after, focus stays
  on `#toggleButton`, the label reads "Show less" then "Show More", and the list opens then closes.

Task 4's 11 nodes, all inline `style` colours in page markup except one class:
rat-mitigation-zones `#8670e6` 3.83, `#82ad49` 2.61, `#1d8f3f` 4.15, `#D77393` 3.10 (×2);
congestion-pricing-report `#DF7B00` 2.96 on `#FDFDFD`, badges `#007153` 4.22 and `#ae3400` 4.47
on `#D8D8D8`; realtime-air-quality `red` 3.99; neighborhood-air-quality `.badge-worse` white on
`#8077b6` 4.01; hvi `#e9c213` on dimgray 3.18.

### Where each fix lands

- Task 1: `themes/dohmh/layouts/partials/de-indicator-info.html`, the three label `<div>`s carrying
  `text-primary`, now `de-option-label`, styled `$primary-dark` in `assets/scss/_de-custom.scss`
  beside the `#toggleButton` rule. Not a utility in `_e-supplementary-classes.scss`, which R1 also
  edits.
- Task 2: `assets/scss/__portal-custom.scss`, the `.keywords` rule (`color: grey`).
- Task 3: `assets/scss/_de-custom.scss`, `$color-data-stories` and the `.data-stories` rule.
- Task 5: `assets/scss/_d-enhancements.scss`, the "visible underline" block.
- Task 6: `assets/scss/__portal-custom.scss`, `.share-btn { outline: none }` and
  `input[type=range]:focus { outline: none }`; `assets/scss/theme.scss`,
  `.content-card button.card-content { outline: none }`.
- Task 7: `themes/dohmh/layouts/key-topics/single.html` (`#toggleButton`) and
  `assets/scss/_de-custom.scss`, `#toggleButton[aria-expanded="true"]` (the audit cites line 375;
  it has moved).

### Next commands

```
git log --oneline --no-merges 095ebc5010..HEAD           # the task commits
git rev-list --left-right --count origin/feature-audit-r5-contrast-focus...HEAD   # 0 0 means pushed
gh pr list --head feature-audit-r5-contrast-focus
```
