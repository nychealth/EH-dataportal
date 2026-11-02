# R16: Explorer trend chart year labels (2026-11-02)

Batch R16 of `documents/site-wide-audit-2026-10.md` (Roadmap): one P1 row, N-107, on branch
`feature-audit-r16-trend-labels`, cut from the local `production` at `6cc2ccba22`. The branch was
first pushed as `docs-audit-n107-trend-year-labels` (at `cdd4bcac9c`, the commit filing N-107) and
renamed before any fix landed. This document is the plan and the ledger. N-107 is closed in the
audit only once its proof has run.

**Status as of 2026-11-02: N-107 filed (`cdd4bcac9c`), fixed (`aa97346626`) and closed in the
audit with R16 (step 5); step 6, the push and PR, not started.**

## Cause

`trend.js` draws the year labels as its own text mark (the last layer of `compspec2`), keeping a
label only where the `fallbackYear` calculation returns one. That calculation keeps every other
**row** (`datum.index % 2 === 0`, `index` a `row_number` over all rows), but a trend chart has one
row per series per period, so every period has an even row and keeps its label. Quarterly periods
are exempt and always keep theirs. `xAxisLabelField` is `'fallbackYear'` at every width; the
per-breakpoint assignments in `getTrendLayoutConfig` are commented out. The retired explorer's
`assets/js/data-explorer-old/trend.js` carries the same calculation.

`[verified 2026-11-02: scripts/.sc-rebaseline/n107/variants.mjs on a development server at
6cc2ccba22, 2380 and 2023 at 400/700/959/960/1024/1200/1400px: 6 rows per period on both; the
unchanged spec re-embedded (V0) matched the page's own render in all 14 cells; parity on the
period's dense_rank (V1) halved the labels, 19 -> 10 and 17 -> 9; a width-derived step at 40px per
label (V3) left 0 overlapping labels in all 14 cells, smallest gap 6px; output variants.out]`

Label widths vary by time type. Labels are split onto lines at each space, and the explorer's
time-period table has lines up to 13 characters ("July-December", "Cold season 1999-00" ->
"season" / "1999-00"); 4-character years measure about 6px per character at the 10px font
`[2026-11-02: periods.mjs over DE.lookups.timeTable; 700px gaps]`.

## Decisions

Chris, 2026-11-02:

- **A width-aware step.** Each label needs `6.5px x longest label line + 14px`, and the step is
  the smallest that gives every kept label that much room. Rejected: every other period alone (V1 still overlaps at 960 and 1024px, where the side panel is
  narrowest), and Vega-Lite's own axis with `labelOverlap` (unmeasured, and a larger change to the
  multi-line labels and their placement).
- **Anchor on the latest period**, so the most recent is always labelled and the first may drop.
- **Thin quarterly and every other time type too**, not only years. Chris's example:
  `weather-related-illness/?id=2376&MeasureID=1189&GeoType=Citywide&TimePeriodID=388&overlay=trend`.
- **One branch, renamed**, carrying both the N-107 row and its fix.

How the step is computed changed during step 2, Chris's rule unchanged: the first form divided by
the container width, which includes the y-axis and the end-of-line series names. The overhead
those take runs 74-110px across five indicators and moves with the data `[2026-11-02: span.mjs,
span.out]`, and `getChartContainerWidth` returned 0 in some cells, leaving the spec's width
`"container"`. So the label layer's own `filter` reads Vega's `width` signal, the laid-out plot
width: `step = ceil(labelWidth x (periods - 1) / (width - 40))`, the 40 being the x scale's 20px
padding each side. That also reaches the save-chart preview, which re-embeds the same spec.

Deferred: the retired explorer at `/data-explorer-old/`, which has the same bug; it is not linted
and not in this batch.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | File N-107 and batch R16 in the audit | `cdd4bcac9c` | **DONE 2026-11-02** | recount 187 OPEN / 274 FIXED / 509 rows, Roadmap 53, after a control that reproduced `HEAD`'s table |
| 2 | Measure the before state on more period types | *no commit* — measurement only | **DONE 2026-11-02** | `[verified 2026-11-02: metadata.json x TimePeriods.json over 439 trend measures: no trend chart has more than one quarterly period (2168/716, 2 periods), so quarters were added as 2376/1189 (24 cold seasons, Chris's example), 93/206 (24 years, the most) and 2208/871 (16 periods, 9-character lines, the longest); before-more.out: 2208 overlaps 15 of 16 at 700px too, and 2376 (1 row per period, Citywide) labels every other season and still overlaps 11 of 12 at 400 and 960-1400px]` |
| 3 | Replace `fallbackYear` in `trend.js`: the label layer aggregates to periods, ranks them, and filters to every Nth counting back from the latest, N from `width`; quarters are no longer exempt; `xAxisLabelField` and the `index` window removed | `aa97346626` | **DONE 2026-11-02** | step 4 |
| 4 | Prove it | `aa97346626` (with the baselines) | **DONE 2026-11-02** | `[verified 2026-11-02, development server on the edited tree, served trend.bb25bf94fd0bcfc5.js carrying periodLabelWidth: after.mjs, 5 indicators x 7 widths, page render and save-chart preview: 35 of 35 cells 0 overlapping labels, latest period labelled, smallest gap 19px, no page errors, the same 3 Vega warnings the unedited page logs (warns.mjs); npm run lint exit 0, no xAxisLabelField / fallbackYear / datum.index left; de-characterization.mjs --check failed on markCount alone, 3 lines on each data branch (2023 trend 235 -> 226, 2380 trend 255 -> 242 and trendComparison 140 -> 127), each drop the labels removed at the harness's 1400px plus, by arithmetic not inspection, the empty-text label the old grouping drew; both baselines re-captured and production re-checked PASSED; smoke-pages.mjs curated 44 pages PASSED, Pagefind served]`. Site characterization is left to CI: it loads no `?id=` explorer page |
| 5 | Close N-107 and R16 in the audit (recount control first), widening N-107's claim to the long-label case | | **DONE 2026-11-02** | `[verified 2026-11-02: recount and batch check on HEAD's copy reproduced its table first (187 OPEN, Roadmap 53, R16 1/0); after scripts/.sc-rebaseline/n107/close_n107.py, 186 OPEN / 275 FIXED / 509 rows, Roadmap 52, every batch OK with 52 unique ids, R16 0/0 at the table's foot; diff 7 lines in, 7 out]` |
| 6 | Push under the new name, delete the old remote branch (ask first), open the PR | | Not started | |

## Environment

- Probes live in the git-ignored `scripts/.sc-rebaseline/n107/` and import `../r3/lib.mjs`; they
  read `R3_BASE`. A `development` server (EHDP-data `production`) is what they ran against:
  `npx hugo serve --environment development --port 8080`, then
  `R3_BASE="http://localhost:8080/dev-prod/" node scripts/.sc-rebaseline/n107/variants.mjs`.
- The probe's one console error per page is its own `googletagmanager` abort (`net::ERR_FAILED`).
- The old remote branch `docs-audit-n107-trend-year-labels` is still on `origin`; the renamed local
  branch has no upstream. `git ls-remote --heads origin docs-audit-n107-trend-year-labels` shows
  whether it is still there.

## Next

Commit step 5 (`documents/site-wide-audit-2026-10.md` and this ledger). Then step 6:
`git push -u origin feature-audit-r16-trend-labels`, delete the old remote branch once Chris
agrees (`git push origin --delete docs-audit-n107-trend-year-labels`), and open a PR into
`production`. It touches `trend.js`, so both CI sweeps run; site characterization is expected to
pass unchanged, since it loads no `?id=` explorer page.
