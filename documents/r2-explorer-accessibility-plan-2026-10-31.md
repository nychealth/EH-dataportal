# Audit batch R2: explorer accessibility — plan and ledger (2026-10-31)

**Status as of 2026-10-31: all tasks done: `b01dce9f85` (fixes), `f6c077344e` (re-baseline), `0e151ae9ac` (audit closure). Next is a push and a PR into `production`.** Branch `feature-audit-r2-explorer-a11y`, cut from local `production`
at `a77f7d4991` when it matched `origin/production` (`git rev-list --left-right --count production...origin/production`
read `0 0`). Cut from `production`, not stacked on R3 (`feature-audit-r3-explorer-behaviour`, held on decisions): the two
touch `de-tab-button.html` and `header-de.html`, so whichever merges second resolves those, plus the audit doc's count
table and Summary.

Rows, from `documents/site-wide-audit-2026-10.md` §Roadmap R2 (P1 bold): **A-159**, **N-002**, **N-008**, **N-043**,
**N-044**; A-160, A-256, A-280, N-047.

## Decisions

All Chris's, asked 2026-10-31 after Task 0 had reproduced each row:

- **D1, A-159 (`#map role="img"` wraps focusable content): `role="region"` only** (Chris, 2026-10-31). `#map` becomes a
  labelled region and nothing else changes, so screen readers may walk Leaflet's own markup; that gives up the intent in
  `data-explorer/single.html`'s comment, whose text goes with it. Rejected: also `aria-hidden` on Leaflet's map panes
  (keeps the intent, a few lines in `map.js`); keeping `role="img"` and moving the links out (hides the map credit).
- **D2, A-160 (`#tableFilterToggle` does nothing): plain text** (Chris, 2026-10-31). The button becomes non-interactive
  text with the same content, so `updateTableFilterSummary` keeps writing the filter state screen readers can find.
  Rejected: removing it (loses that summary); binding it to a behaviour (a design, out of scope).
- **D3, A-256 (no announcement of measure/geo/time changes): the full selection** (Chris, 2026-10-31). One visually
  hidden polite status region reads e.g. "Showing Age-adjusted rate, CD, 2023" once per completed render after a measure,
  boundary or time change. Rejected: announcing only the changed part; not announcing.
- **D4, A-280 (duplicated control groups): narrow and move out of R2** (Chris, 2026-10-31). The reused-ids claim is
  recorded DISCONFIRMED with Task 0's evidence; the duplication itself is re-filed as a new P3 refactor row outside R2,
  since it is not an accessibility defect. Rejected: the one-structure refactor in R2 (a rewrite of
  `de-indicator-info.html`'s dropdowns, conflicting with R3 there); closing it with nothing recorded.

## Ledger

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Reproduce all nine rows on an isolated `prod_prod` build of `a77f7d4991`, before any edit; drop any that does not reproduce | — (no code) | **DONE 2026-10-31** | Eight reproduce; A-280's duplicate ids do not. See "Task 0 findings" |
| 1 | N-002: name the Measure, Boundary and Time buttons when empty | `b01dce9f85` | **DONE 2026-10-31** | `aria-labelledby` = visible label + the button, six buttons in both copies. On an isolated prod_prod build of the edited tree (:8092), `task0.mjs` against the same probe on `a77f7d4991` (:8091): `asthma/` axe `button-name` 3 → 0, names "Measure:", "Boundary:", "Time:"; `waterways/?id=2427` likewise; control `?id=2380` "Measure: Age-adjusted rate" |
| 2 | N-008: no `aria-selected` on `<button>`s | `b01dce9f85` | **DONE 2026-10-31** | Pills keep `aria-pressed`; correlate menu items and the old explorer's indicator items take `aria-current`, as `menu.js:231`'s items do; the unused `setDropdownMenuItemState` likewise. On an isolated prod_prod build of the edited tree (:8092), `task0.mjs` against the same probe on `a77f7d4991` (:8091): axe 2 → 0 (trend pills), 18 → 0 (`data-explorer-old/asthma/`); `button[aria-selected]` 16 → 0 on `asthma/?id=2380`. Scope note: the old explorer's other ~40 `aria-selected` writes on buttons (set on interaction, and read back as state at its `measures.js:2430`) are not changed |
| 3 | N-043: name the tabs below `md` | `b01dce9f85` | **DONE 2026-10-31** | `aria-label` on the four icon tabs. On an isolated prod_prod build of the edited tree (:8092), `task0.mjs` against the same probe on `a77f7d4991` (:8091): 375x800 names `""` → Bar, Trends, Correlate, Table; 1280 control named on both |
| 4 | N-044: group-header rows reachable and operable by keyboard | `b01dce9f85` | **DONE 2026-10-31** | Group label is a `<button aria-expanded>` in its cell; `bindTableGroupToggles` keeps `aria-expanded` in step. `after.mjs`: Tab reaches the first in 18 presses (0 of 80 before), Enter 59 → 0 rows / false, Space 0 → 59 / true, a cell click still collapses |
| 5 | N-047: the map's table link opens the table, never closes it | `b01dce9f85` | **DONE 2026-10-31** | The link clicks the tab unless it is active and its pane shows, the condition `de-tab-content.js` closes on. On an isolated prod_prod build of the edited tree (:8092), `task0.mjs` against the same probe on `a77f7d4991` (:8091): from `overlay=table` stays `table`, history +0 (was `none`, +1); control from none opens |
| 6 | A-159: `#map` becomes `role="region"` (D1) | `b01dce9f85` | **DONE 2026-10-31** | On an isolated prod_prod build of the edited tree (:8092), `task0.mjs` against the same probe on `a77f7d4991` (:8091): axe `nested-interactive` 1 → 0, same four links inside |
| 7 | A-160: the filter toggle becomes plain text (D2) | `b01dce9f85` | **DONE 2026-10-31** | `<button>` → `<p>`, same id and text. `after.mjs`: `P`, tabIndex -1, "Table filters 2023 | CD | Synced". Its summary span stays `d-none` below 960px, as before, so screen readers get the summary only from 960 up |
| 8 | A-256: a status region announcing the full selection (D3) | `b01dce9f85` | **DONE 2026-10-31** | `#selectionStatus` (`role=status`) in `data-explorer/single.html`, written by `announceSelection` at the end of `handleSelection` (`menu.js`). Live-region mutations on a measure change 0 → 1 ("Showing Number, CD, 2023"); boundary then time: "Showing Number, Borough, 2023", "Showing Number, Borough, 2022"; empty at load |
| 9 | A-280: DISCONFIRMED for ids; new P3 row for the duplication (D4); audit doc only | `0e151ae9ac` | **DONE 2026-10-31** | A-280 DISCONFIRMED with Task 0's evidence; N-106 (P3) added after N-104, numbered past R3's N-105 |
| 10 | lint, smoke, site characterization, axe re-run, re-baseline | checks on the tree committed as `b01dce9f85`; re-baseline `f6c077344e` | **DONE 2026-10-31** | `npm run lint` exit 0 (`menu.js` calling `app.js`'s `renderCurrentView` is the cross-file control). `smoke-env.mjs prod_prod`: 1187 pages clean. `characterize-env.mjs prod_prod`: 41 of 924 pages, all `data-explorer/`, every one `controls.button` −1 and `controls.noAccessibleName` 6 → 0 and nothing else (`tally_char.py`), as `task10-predictions.md` said. `site-characterization-rebaseline.mjs --expect "data-explorer/**"`: "41 of 924 pages changed in all; 41 covered by --expect, 0 not", "Nothing unexplained"; diff 84 files +170/−170, by key 82 `button` and 82 `noAccessibleName` each way plus `_meta.json`'s `capturedAt`, `gitHead`, `fetchedAt` |
| 11 | Close the fixed rows in the audit | `0e151ae9ac` | **DONE 2026-10-31** | `close_r2.py`: eight FIXED, A-280 DISCONFIRMED, N-106 added; counts OPEN 10/56/132/2 = 200, FIXED 259, DISCONFIRMED 18, 507 rows; Roadmap total 66; R2 0/0. `recount.py` reproduced the parent's table (OPEN 208, FIXED 251, DISCONFIRMED 17) first, then the new one; `check_batches.py` OK, 66 ids. Its first run failed: R2's row named A-280 and N-106, which the check reads as batch members; reworded to name no ids, as R6's closed row does. `git diff --numstat` 17/16 |

## Task 0 findings

`[verified 2026-10-31: isolated prod_prod build of a77f7d4991 served on :8091 by scripts/.sc-rebaseline/r2/serve-prefix.mjs;
scripts/.sc-rebaseline/r2/task0.mjs and a280.mjs, de-headlessed UA, GA aborted; predictions written first in task0-predictions.md;
output task0.out, a280.out]`

- **axe control:** an injected `<img>` with no `alt` fires `image-alt`, so the axe nulls below are real.
- **A-159 reproduces.** axe `nested-interactive` on `#map` at `asthma/?id=2380`. Four focusable links sit inside
  `role="img"`: the sr-only "View this data as a table" and Leaflet's three attribution links (Leaflet, OpenStreetMap, CARTO).
- **N-002 reproduces.** `asthma/` (no `?id=`): axe `button-name` on all three buttons, CDP names `""`. `waterways/?id=2427`:
  Boundary and Time `""`, Measure named. Control `asthma/?id=2380`: all three named, axe clean.
- **N-008 reproduces, wider than the row.** axe `aria-allowed-attr`: 2 nodes at `drinking-water-quality/?id=2207&overlay=trend`,
  18 at `data-explorer-old/asthma/` (the old explorer's indicator items). axe counts only rendered nodes: `asthma/?id=2380`
  reads 0 from axe but carries `aria-selected` on 16 `<button>`s, 4 badge pills (`setBadgePillState`, `measures.js`, which
  also sets `aria-pressed`) and 12 correlate `linksbutton` menu items, all in hidden panes or menus.
- **N-043 reproduces.** At 375x800 the Bar, Trends, Correlate and Table tabs' names are `""`, Data Sources named. Control at
  1280x900: all five named.
- **N-044 reproduces.** `asthma/?id=2380&overlay=table`: 7 group rows, 0 with `tabindex`, `role=button` or `aria-expanded`;
  0 of 80 Tab presses land in one; a click on the first takes visible data rows 59 → 0.
- **A-160 reproduces.** `#tableFilterToggle` is focusable, CDP `getEventListeners` lists none, and a click changes
  nothing in the pane (inner HTML 33794 bytes before and after). Control `#groupByBoroughToggle`: `change` listed.
  Its container is `sr-only`; `#tableFilterSummary` reads "2023 | CD | Synced".
- **A-256 reproduces.** A MutationObserver on every `aria-live`/`role=status|alert|log` region saw 0 mutations across a
  measure change (1199 → 1197). Control: the same observer caught 2 during page load (the `.indicator-name` region going
  from "Loading indicator..." to the name).
- **A-280 does not reproduce as written.** No duplicate ids on `asthma/?id=2380` or `asthma/` (axe `duplicate-id*` empty,
  DOM census empty). Control: an injected second `id="map"` is caught. The duplication is real: each dropdown exists
  twice (`measureOptionsDropdownButton` and `…Button1`, likewise geo and time; at 1280 the first is rendered), and the
  copies share `measures-holder`, `geo-holder`, `time-holder` (2 each), which the JS fills by class.
- **N-047 reproduces.** From `overlay=table`, Enter on `#map a.sr-only` closes the table: overlay `none`, pane inactive,
  history +1. Control from no overlay: opens it (`table`, active).

## Next commands

```
git log --oneline a77f7d4991..HEAD                                           # the task commits
git rev-list --left-right --count origin/feature-audit-r2-explorer-a11y...HEAD   # 0 0 means pushed
gh pr list --head feature-audit-r2-explorer-a11y                            # a PR, and against which base
python scripts/.sc-rebaseline/r2/recount.py documents/site-wide-audit-2026-10.md        # expect OPEN 10/56/132/2 = 200
python scripts/.sc-rebaseline/r2/check_batches.py documents/site-wide-audit-2026-10.md  # expect OK, 66 ids
```

Scripts and outputs: `scripts/.sc-rebaseline/r2/` (git-ignored, so on the machine that ran them): `task0.mjs`, `a280.mjs`, `after.mjs`, `lib.mjs`, `serve-prefix.mjs`, `close_r2.py`, `tally_char.py`, both prediction files, and `task0.out`, `task0-after.out`, `after.out`, `smoke.log`, `char.log`, `rebaseline.log`.

Merging: R3 (`feature-audit-r3-explorer-behaviour`) and #1530 also edit the audit's count table and Summary paragraph, so whichever merges second re-does its counts on the others'.
