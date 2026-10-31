# R3: Explorer behaviour (2026-10-30)

Batch R3 of `documents/site-wide-audit-2026-10.md` (Roadmap): 4 P1 rows (A-152, A-162, A-308,
N-046) and 9 P2 (A-153, A-154, A-155, A-273, A-284, N-040, N-041, N-042, N-045), on branch
`feature-audit-r3-explorer-behaviour`, cut from the local `production` at `a77f7d4991`. This
document is the plan and the ledger. Rows are closed in the audit document only once their proof
has run.

**Status as of 2026-10-31: Tasks 0–7, 10 and 11 done (`fcb2771302`, `3fbc44854f`, `f4719c3047`, `b6dee3e27a`); A-308 and N-105 BLOCKED on D1 (both options measured); A-284 BLOCKED on D2. The branch is held for those (Chris, 2026-10-31), not opened as a PR.**

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
  **Measured 2026-10-31** (below, "D1 measurements"): (1) as specced removes every clip from 720 to
  991 but produces a third layout there, not the phone one; (2) still clips two of three chart
  titles and covers part of the details panel at 720–800. Titles that clip at 992–1024px on all three builds are N-105,
  added to the audit 2026-10-31 as a P1 row of this batch.
- **D2, A-284 (failed fetches only log to the console).** What the message says, where it shows,
  and whether a retry is in scope for this batch.
- **D3, A-155 (small-numbers sentence printed twice): fix it** (Chris, 2026-10-30). Task 0 found
  no render that shows it on today's data, though the mechanism is in the source; the fix dedupes
  after mapping in `getDisplayNotes`. Rejected: dropping it as not reproduced.

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | all 13 but A-284 and A-308: reproduce on an isolated `prod_prod` build of `a77f7d4991` | *no commit* (measurement) | **DONE 2026-10-30**: 10 of 11 reproduce; A-155 does not on today's data (D3) | Task 0 findings, below |
| 1 | A-162: correlate CSV column swap | `3fbc44854f` | **Fix written, verified** | `correlate.js` labels the download by primary/secondary instead of by axis, each column keeping its format. `a162.mjs`, before `:8091` (`a77f7d4991`), after `:8092` (isolated `prod_prod` build of the edited tree); `after-8091.out` / `after-8092.out`: axis `y` (id 4) `Value_1_Indicator` names the primary — false before, true after, `Value_1` 8.8 both; control axis `x` (id 18): both labels byte-identical before and after. `a162null.mjs`: all 567 links whose `SecondaryAxis` is null carry no secondary `MeasureID` (the same field read 777 on the axis-`y` link), so none reaches a correlate CSV; A-162's scope is the 467 axis-`y` links |
| 2 | A-152: "About the data" keeps a tab's text | `3fbc44854f` | **Fix written, verified** | the About/Sources fill moves out of `renderIndicatorInfo` into `renderIndicatorAbout`; `renderCurrentView` calls `restoreIndicatorAbout` on every overlay but `trend` and `links`, which write their own. `probe0.mjs a152`: after Trends, Bar and Table read the trend text before and the indicator-wide text after; Trends still shows its own text after |
| 3 | A-155: notes printed twice (indicator 2383); D3: fix it (Chris, 2026-10-30) | `fcb2771302` | **Fix written, verified** | `getDisplayNotes` returns `[...new Set(mapped)]`; `renderUnreliabilityNotes`'s caller comment now says the inline step dedupes raw notes only. `npm run lint` exit 0. `a155fix.mjs` on 2383's raw notes (`* Estimate…`, `< 4 Estimate…`): before (`global.e107fa142c37c568.js`, :8091) 2 identical sentences, after (`global.9b9f69c4ad3abdaa.js`, isolated `prod_prod` build of the edited tree on :8092) 1. Control, a small-numbers and a suppressed note: 2 distinct sentences on both. The 1206 bar slice shows the sentence once on both |
| 4 | A-153, A-154: table sync and Area search after rebuild | `3fbc44854f` | **Fix written, verified** | popstate and a measure change that cascades geo/time now clear the Area search and resync the table, as a geo/time change already did; `bindAreaOnlySearch` re-applies a kept Area term to a rebuilt table; `resetSelectionForNewIndicator` clears it. `a153.mjs` (id 22), Back over a geo change: table off the map while "Synced" before, following after; the geo-change control follows on both. Cascade arm, run 2026-10-31 on indicator 103 (found by a metadata scan, `cascade-scan.mjs`: measure 221 offers NTA, 870 does not): 221 at NTA with "Bronx", then Rank: before, the table stops following the map (geo and time) and "Bronx" stays applied under "Synced"; after, it follows and the search is cleared. On both builds Rank leaves GeoType and TimePeriodID `null`, which predates this branch and was not looked into. Indicator 40 (PUMA, Percent → Number) did not cascade: its menus offer PUMA for both. `a154.mjs`, Change dataset 2380 → 2384 with "Bronx": box "Bronx" over an empty column filter (188 rows) before, box and filter both cleared after. `a154b.mjs`, group-by-borough toggle with "Bronx": filter dropped to 59 rows under a "Bronx" box before, 12 rows with box and filter agreeing after |
| 5 | A-273, N-040, N-041, N-042: history and overlay state | `3fbc44854f` | **Fix written, verified** | A-273: `writeSelectionToURL` turns a push of the URL already showing into `replaceState`. N-040: the Escape listener returns on `event.defaultPrevented`, which Bootstrap 4.6.2 sets for a modal's and an open dropdown's own Escape. N-041: Data Sources is overlay `ds` (tab map, a no-op `renderCurrentView` case, `showOverlayTab`). N-042: popstate to an entry with no `id` reloads the page, the state `checkURL` gives a topic page opened without one (a choice made here, not by Chris). `probe0.mjs`: A-273 same measure `history.length` 2 → 3 before, 2 → 2 after, other measure +1 on both; N-040 modal arm and new dropdown arm closed the Bar pane and pushed an entry before, kept it open with no entry after, Escape alone still closes it; N-041 `overlay=ds` when Data Sources opens, kept through a Measure change and from `overlay=trend` (before: `none`, closed, `trend`), Bar control `bar` on both; N-042 Back left 2414 on screen with no chooser before, after it reloads to the chooser |
| 6 | N-045: unknown `?id=` throws | `3fbc44854f` | **Fix written, verified** | `loadAndRenderIndicator` stops after `ensureIndicatorsLoaded` when `getIndicatorById` finds nothing. `probe0.mjs n045`: chooser open on both; `reading 'array'` page error before, none after; control `?id=2380` none on both |
| 7 | N-046: Take Action placeholder | `3fbc44854f` | **Fix written, verified** | `header-de.html` and `de-tab-button.html` render the 311 spans empty with `hide` and an empty label, the state `render311Links` leaves for an indicator with no match. Built `data-explorer/asthma/index.html`: 2 "Dynamic option" before, 0 after. `probe0.mjs n046`: `/data-explorer/` and `/data-explorer/asthma/` showed "Dynamic option" → `#` before and no link after; control `?id=2380` "Asthma" → KA-02563 on both |
| 8 | A-284: fetch failure message (D2) | | BLOCKED on D2 | |
| 9 | A-308: tablet chart width (D1); N-105: titles clipped at 992–1024px | | **BLOCKED on D1**; both options built and measured, neither in the tree | D1 measurements, above |
| 10 | lint, smoke, DE and site characterization, re-baseline | re-baseline `f4719c3047` | **DONE 2026-10-31** (checks on `3fbc44854f`) | `npm run lint` exit 0. `smoke-env.mjs prod_prod`: 1187 pages clean; `heat-report-archive/2021/` failed under concurrency and cleared on the sequential re-check (the Datawrapper flake in CLAUDE.md). `de-characterization.mjs --check` against `:8091` (before) and `:8092` (after): both fail the committed baseline on the same 14 lines (indicator 2023's time 2024 → 2025, row and mark counts, legend), and the two arms' outputs are identical (`git diff --no-index` exit 0), so this is EHDP-data having moved since that baseline, not this branch. That baseline was re-captured afterwards in `987d8397dc` against `dev_stage`, where it was first captured (`19c3e93153`): 2023's 14 lines, plus 2380's links `markCount` 43 → 17, which appeared on staging data in two `--check` runs and not in the `prod_prod` runs above. `--check` passes on `dev_stage` after it. A check against production data will now fail on that 2380 line, because the harness keeps one baseline, not one per data branch. Logs: `scripts/.sc-rebaseline/r3/de-*.log`. `characterize-env.mjs prod_prod`: 42 of 924 pages differ, all under `data-explorer/`, every one `links.internal` −2 and `links.emptyHref` −2 and nothing else (a parse of both captures): N-046's two placeholder links. `site-characterization-rebaseline.mjs --expect "data-explorer/**"`: both baselines "42 of 924 pages changed in all; 42 covered by --expect, 0 not", "Nothing unexplained"; `git diff -U0` tallied by key: 84 `internal` and 84 `emptyHref`, every one −2, plus the two `_meta.json` provenance lines; 86 files +174/−174 |
| 11 | close the rows in the audit | `b6dee3e27a` | **11 of 13 closed**; A-284, A-308 and the new N-105 stay OPEN | `close_r3.py` on a copy, then on the audit, byte-identical (`cmp` exit 0): 11 rows FIXED (A-155 by `fcb2771302`, the other ten by `3fbc44854f`), the count table, the Summary paragraph, the Roadmap's P1+P2 total (75 → 64) and the R3 batch row (1 / 1: **A-308**; A-284), moved below R11 by P1-then-P2 order. Recount control reproduced `HEAD`'s table first (OPEN 15/60/131/2 = 208, FIXED 251), then read OPEN 12/52/131/2 = 197, FIXED 262. Batch check (`C:/temp/check_batches.py`, the memory's script): every batch OK, ordered, 64 ids = the OPEN P1/P2 rows. `git diff --numstat` 17/17. Then N-105 added by `add_n105.py` (OPEN, P1, batch R3: chart titles clipped at 992 and 1024px, past both A-308 options, from the D1 measurements), on a copy first and byte-identical: OPEN 13/52/131/2 = 198, all 507, Roadmap 64 → 65, R3's row 2 / 1 and above R1; batch check 0 MISMATCH, 65 ids |

Every script, probe output, prediction file and screenshot this document names is in
`scripts/.sc-rebaseline/r3/` (git-ignored, so on the machine that ran them only; copied there
2026-10-31 from the session scratchpad). The probes import Playwright through the repo's
`package.json` and read `R3_BASE` for the site to load (default `http://localhost:8091/IndicatorPublic/`).

Each fix task's proof is the Task 0 reproduction re-run on a build of the edited tree, with the
same probe, plus a control the fix should not move.

### D1 measurements (A-308)

`[verified 2026-10-31: three isolated prod_prod builds of 3fbc44854f, the variants applied in a detached
worktree (C:/temp/r3wt) by a308_variant.py and confirmed in each built theme CSS: current (:8092);
option 1 (:8093), the seven explorer min-width: 720px blocks and the max-width: 719.98px block moved to
992px / 991.98px (min-width: 992px 1 → 8, min-width: 720px 33 → 26 in the CSS; .container-to-large
left alone) plus trend.js's viewportWidth < 720; option 2 (:8094), min-width: 360px on .de-tabs.
a308.mjs, method of .playwright-mcp/chart-text-clip.mjs, 9 widths x 4 charts per build;
predictions written first in a308-predictions.md]`

No-power check passed: current clips at 768 on all three bar and trend charts (1, 3 and 1 text
elements), as the 2026-10-15 findings recorded.

| Window | current: chart px / clipped (bar 2023, bar 2445, trend 2380) / correlate past pane | option 1 | option 2 |
|---:|---|---|---|
| 700 | 666 / 0, 0, 0 / — | same | same |
| 720 | 172 / 1, 1, 1 / 92px | 626 / 0, 0, 0 / — | 258 / 0, 1, 1 / 6px |
| 768 | 190 / 1, 3, 1 / 74px | 674 / 0, 0, 0 / — | 258 / 0, 1, 1 / 6px |
| 800 | 202 / 0, 3, 1 / 62px | 706 / 0, 0, 0 / — | 258 / 0, 1, 1 / 6px |
| 900 | 240 / 0, 1, 1 / 24px | 806 / 0, 0, 0 / — | 258 / 0, 1, 1 / 6px |
| 991 | 275 / 0, 1, 1 / — | 897 / 0, 0, 0 / — | 275 / 0, 1, 1 / — |
| 992 | 275 / 0, 1, 1 / — | same as current | same as current |
| 1024 | 287 / 0, 1, 0 / — | same as current | same as current |
| 1200 | 354 / 0, 0, 0 / — | same | same |

- The clipped text is the chart title ("Cold-related illness: 5-…", "Asthma emergency departm…"), plus bar
  2445's axis numbers 10 and 20 at 768–800 on current. At 992–1024 those two titles clip on all three
  builds: neither option addresses a ~275–287px chart's title.
- Side panel over the details panel: current 0px at every width; option 2 84, 36 and 4px at 720, 768
  and 800 — at 720 it covers "Change dataset" (only "Cha" shows) and the right end of the Measure,
  Boundary and Time dropdowns (`shot-opt2-720.png`). No build scrolls the page sideways at any width.
- Option 1 is not the phone layout at 768–991. The explorer's Bootstrap `md` classes still switch at
  768, so the tab buttons stand in a vertical column on the right (tops 450–809px) instead of the
  phone's bottom bar (all at 836px at 700), and the details card shows expanded, full width, above a
  full-width chart (`shot-opt1-768.png`, `shot-opt1-900.png` against `shot-current-700.png`). Making
  768–991 the phone layout as well means moving those classes too: 33 `*-md-*` occurrences in 7
  explorer partials (`de-tab-content.html` 9, `de-tab-button.html` 8, `header-de.html` 6, …), not all of
  them part of this layout. Not built.

### Task 0 findings

`[verified 2026-10-30: HUGO_RESOURCEDIR=C:/temp/r3/res hugo --environment prod_prod -d C:/temp/r3/docs
on a77f7d4991, served under /IndicatorPublic/ on :8091; Playwright, de-headlessed UA, GA aborted. Probes
probe0.mjs, a162.mjs, a162b.mjs, a155*.mjs, a153.mjs, a154.mjs]`

- **A-162 reproduces.** Over all metadata links `SecondaryAxis` is `y` 467, `x` 475, `null` 567. Axis
  `y`: `birth-outcomes/?id=4&MeasureID=8&overlay=links` (secondary measure 777) writes `Value_1_Indicator`
  "Elevated blood lead levels (under age 6) - Rate…" while `Value_1` is the primary's: first row GeoID 101,
  TimePeriodID 49, `Value_1` 8.8 = measure 8's own UHF42 row (8.8; CD 5.8). Control, axis `x`
  (`asthma/?id=18&MeasureID=31`): `Value_1_Indicator` names the primary. Cause in source: the default/`y`
  branch of `correlate.js`'s axis switch sets `yIndicatorName` to the secondary, and the download labels
  `Value_1_Indicator` with `yIndicatorName`; `data.js` joins the primary on the left (`_1`). The `null`
  candidate (id 1) opened as `bubble-map`; all 567 `null` links name no secondary measure (Task 1), so none reaches the CSV.
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
  the summary still reads "Synced". The Measure-cascade arm did not run here (it ran in Task 4, on indicator 103): indicator 22's measure 41 offers
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

State on 2026-10-31: branch pushed (`git rev-list --left-right --count origin/feature-audit-r3-explorer-behaviour...HEAD`
→ `0 0` means nothing unpushed), no PR, held for A-308 / N-105 and A-284 (Chris). No servers or
worktree are left running; the builds below are rebuilt from scratch.

```
git log --oneline a77f7d4991..HEAD                       # this branch's commits
python scripts/.sc-rebaseline/r3/recount.py documents/site-wide-audit-2026-10.md         # expect OPEN 13/52/131/2 = 198, FIXED 262
python scripts/.sc-rebaseline/r3/check_batches.py documents/site-wide-audit-2026-10.md   # expect every batch OK, 65 ids
```

To look at A-308's options again (Git Bash, from the repo root; each build ~30 s, isolated, safe beside a dev server):

```
R=scripts/.sc-rebaseline/r3; HUGO=$PWD/node_modules/.bin/hugo
git worktree add --detach C:/temp/r3wt HEAD
python $R/a308_variant.py C:/temp/r3wt opt1          # prints "opt1 applied"; asserts 8 media blocks + trend.js
(cd C:/temp/r3wt && HUGO_RESOURCEDIR=C:/temp/r3o1/res $HUGO --environment prod_prod -d C:/temp/r3o1/docs && git checkout -- .)
python $R/a308_variant.py C:/temp/r3wt opt2
(cd C:/temp/r3wt && HUGO_RESOURCEDIR=C:/temp/r3o2/res $HUGO --environment prod_prod -d C:/temp/r3o2/docs && git checkout -- .)
HUGO_RESOURCEDIR=C:/temp/r3cur/res $HUGO --environment prod_prod -d C:/temp/r3cur/docs
node $R/serve-prefix.mjs C:/temp/r3cur/docs 8092 &   node $R/serve-prefix.mjs C:/temp/r3o1/docs 8093 &   node $R/serve-prefix.mjs C:/temp/r3o2/docs 8094 &
# open http://localhost:8093/IndicatorPublic/data-explorer/asthma/?id=2380&overlay=bar at 768px, etc.
R3_BASE=http://localhost:8093/IndicatorPublic/ node $R/a308.mjs opt1     # the D1 table's numbers
git worktree remove --force C:/temp/r3wt
```

Once D1 and D2 are decided: apply the chosen A-308 variant to this tree (`python $R/a308_variant.py . opt1`
applies option 1 as measured; the `md`-class extension is not written), design N-105's fix (chart titles at
~275–287px; neither option reaches it), write A-284's message, then re-run Task 10 (lint, `smoke-env.mjs
prod_prod`, `characterize-env.mjs prod_prod`, re-baseline with `--expect`) and close the rows with a
`close_r3.py`-style script plus the two checks above, then open the PR into `production`.
