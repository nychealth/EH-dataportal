# R3: Explorer behaviour (2026-10-30)

Batch R3 of `documents/site-wide-audit-2026-10.md` (Roadmap): 4 P1 rows (A-152, A-162, A-308,
N-046) and 9 P2 (A-153, A-154, A-155, A-273, A-284, N-040, N-041, N-042, N-045), on branch
`feature-audit-r3-explorer-behaviour`, cut from the local `production` at `a77f7d4991`. This
document is the plan and the ledger. Rows are closed in the audit document only once their proof
has run.

**Status as of 2026-10-30: Task 0 done (10 of 11 reproduce); Task 3 (A-155) written and verified; D1 and D2 open.**

Every row was found on `b8f4b32fbd`. Since then 13 non-merge commits have touched the explorer's
files (16 JS files +628/−588, mostly the formatting sweeps `d2d80dc7e2`..`840ede9674` and
`91aa287079`, plus R4 `47d7a1bea8` and R5 `7f721b3aaa`, which changed `de-tab-content.js`)
`[verified 2026-10-30: git log --no-merges b8f4b32fbd..production over assets/js/data-explorer/,
themes/dohmh/layouts/data-explorer/, de-*.html partials and _de-custom.scss]`. So Task 0
reproduces every row on `a77f7d4991`, the runtime-confirmed ones included, and a row that does
not reproduce is dropped from the batch rather than fixed.

## Decisions

Open, both Chris's:

- **D1, A-308 (charts too narrow between 720 and ~1000px).** `documents/de-chart-width-findings-2026-10-15.md`
  §Options: (1) move the side-panel breakpoint from 720px to e.g. 992px — eight
  `@media (min-width: 720px)` blocks and one `max-width: 719.98px` block in `_de-custom.scss`,
  plus `trend.js`'s `viewportWidth < 720` legend switch; (2) a minimum side-panel width (~360px),
  which overlaps the 380px details panel more between 720 and ~800px. That document recommends
  (1); neither was built. Both get built and measured at 720, 768, 991, 992 and 1024px before
  the choice is put to Chris.
- **D2, A-284 (failed fetches only log to the console).** What the message says, where it shows,
  and whether a retry is in scope for this batch.
- **D3, A-155 (small-numbers sentence printed twice): fix it** (Chris, 2026-10-30). Task 0 found
  no render that shows it on today's data, though the mechanism is in the source; the fix dedupes
  after mapping in `getDisplayNotes`. Rejected: dropping it as not reproduced.

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | all 13 but A-284 and A-308: reproduce on an isolated `prod_prod` build of `a77f7d4991` | *no commit* (measurement) | **DONE 2026-10-30**: 10 of 11 reproduce; A-155 does not on today's data (D3) | Task 0 findings, below |
| 1 | A-162: correlate CSV column swap | | Not started | |
| 2 | A-152: "About the data" keeps a tab's text | | Not started | |
| 3 | A-155: notes printed twice (indicator 2383); D3: fix it (Chris, 2026-10-30) | | **Fix written, verified** | `getDisplayNotes` returns `[...new Set(mapped)]`; `renderUnreliabilityNotes`'s caller comment now says the inline step dedupes raw notes only. `npm run lint` exit 0. `a155fix.mjs` on 2383's raw notes (`* Estimate…`, `< 4 Estimate…`): before (`global.e107fa142c37c568.js`, :8091) 2 identical sentences, after (`global.9b9f69c4ad3abdaa.js`, isolated `prod_prod` build of the edited tree on :8092) 1. Control, a small-numbers and a suppressed note: 2 distinct sentences on both. The 1206 bar slice shows the sentence once on both |
| 4 | A-153, A-154: table sync and Area search after rebuild | | Not started | |
| 5 | A-273, N-040, N-041, N-042: history and overlay state | | Not started | |
| 6 | N-045: unknown `?id=` throws | | Not started | |
| 7 | N-046: Take Action placeholder | | Not started | |
| 8 | A-284: fetch failure message (D2) | | BLOCKED on D2 | |
| 9 | A-308: tablet chart width (D1) | | BLOCKED on D1 | |
| 10 | lint, smoke, DE and site characterization, re-baseline | | Not started | |
| 11 | close the rows in the audit | | Not started | |

Each fix task's proof is the Task 0 reproduction re-run on a build of the edited tree, with the
same probe, plus a control the fix should not move.

### Task 0 findings

`[verified 2026-10-30: HUGO_RESOURCEDIR=C:/temp/r3/res hugo --environment prod_prod -d C:/temp/r3/docs
on a77f7d4991, served under /IndicatorPublic/ on :8091; Playwright, de-headlessed UA, GA aborted. Probes
in the session scratchpad r3/: probe0.mjs, a162.mjs, a162b.mjs, a155*.mjs, a153.mjs, a154.mjs]`

- **A-162 reproduces.** Over all metadata links `SecondaryAxis` is `y` 467, `x` 475, `null` 567. Axis
  `y`: `birth-outcomes/?id=4&MeasureID=8&overlay=links` (secondary measure 777) writes `Value_1_Indicator`
  "Elevated blood lead levels (under age 6) - Rate…" while `Value_1` is the primary's: first row GeoID 101,
  TimePeriodID 49, `Value_1` 8.8 = measure 8's own UHF42 row (8.8; CD 5.8). Control, axis `x`
  (`asthma/?id=18&MeasureID=31`): `Value_1_Indicator` names the primary. Cause in source: the default/`y`
  branch of `correlate.js`'s axis switch sets `yIndicatorName` to the secondary, and the download labels
  `Value_1_Indicator` with `yIndicatorName`; `data.js` joins the primary on the left (`_1`). The `null`
  candidate (id 1) opened as `bubble-map`, so whether a `null` link reaches the CSV is not established.
- **A-152 reproduces.** `asthma/?id=2380`: `#howCalculated` at load lists every measure ("Number: …");
  after Trends it holds the trend text ("Age-adjusted rate: …"), and Bar and Table keep it.
- **A-155 does not reproduce on today's data.** Indicator 2383's two raw notes ("* Estimate is based on
  small numbers…", "< 4 Estimate…") both map to the same sentence, but they sit on different measures
  (1206 and 1217, one row each at NTA2010 / 254), and no measure, measure×geo or measure×geo×time group
  carries both. Positive control: `?id=2383&MeasureID=1206&TimePeriodID=254&overlay=bar` shows the
  sentence once in `#bar-unreliability`. The mechanism is in the source at all three callers (each dedupes
  raw notes, then `getDisplayNotes` maps without deduping), so it fires on any render carrying both
  variants; none was found.
- **A-153 reproduces on Back.** Indicator 22, `overlay=table`, Synced: a menu geo change keeps the table
  following the map (control); Back over it leaves `selectedTableGeography` off the map's selection while
  the summary still reads "Synced". The Measure-cascade arm did not run: indicator 22's measure 41 offers
  UHF42 in data but not in its geo menu at the default time, and 2380's three measures share geos and
  times, so no cascade occurred on either.
- **A-154 reproduces on an indicator switch.** `asthma/?id=2380&overlay=table`, Area search "Bronx": box,
  state and column filter agree, 12 rows (control). After Change dataset → 2384 the box and
  `tableAreaSearchValue` still read "Bronx", the column filter is `""` and 188 rows show. A measure change
  keeps all three at "Bronx" (no mismatch).
- **A-273 reproduces.** Choosing the selected "Age-adjusted rate": `history.length` 2 → 3, URL unchanged.
  Control, "Number": 3 → 4 with `MeasureID=1197`.
- **N-040 reproduces.** `overlay=bar`, Save Chart opens `#printModal`; Escape closes it and the Bar pane,
  `overlay=none`, `history.length` 2 → 3. Control: Escape with no modal closes the pane (intended).
- **N-041 reproduces.** Data Sources opens with `overlay=none`; Measure "Number" leaves no pane open. From
  `overlay=trend`, Data Sources leaves the URL at `overlay=trend`. Control: Bar sets `overlay=bar`.
- **N-042 reproduces.** `asthma/` chooser → 2414 (`history.length` 2 → 3); `history.back()` gives an
  empty query, `DE.state.IndicatorID` 2414, Measure "Percent", no chooser, `.citation-url` the bare topic
  page.
- **N-045 reproduces.** `asthma/?id=99999` opens `#indicatorSelector` and throws `Cannot read properties
  of undefined (reading 'array')`. Control `?id=2380`: no page error.
- **N-046 reproduces.** With modals closed and Take Action open, `/data-explorer/` and
  `/data-explorer/asthma/` show "Dynamic option" → `#`. Control `?id=2380`: "Asthma" →
  portal.311.nyc.gov KA-02563.

### Next commands

```
git log --oneline a77f7d4991..HEAD     # task commits on this branch
```
