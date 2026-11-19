# R4: Story and feature page accessibility (2026-10-29)

Batch R4 of `documents/site-wide-audit-2026-10.md` (Roadmap): 15 P1 rows and one P2, on branch
`feature-resolve-audit-items`, cut from `production` at `80ffb572f3`. This document is the plan and
the ledger. Rows are closed in the audit document only in Task 8, once their proof has run.

**Closed 2026-10-30: all tasks done on `feature-resolve-audit-items`, `80ffb572f3..2717a7e8a9`
plus the ledger commit after it. 14 of R4's 16 rows FIXED; N-003 and N-012 stay OPEN for the two
remainders below. Next for this batch: a PR into `production`.**

## Decisions

- **#1491 has merged** (`7156c27081`), so A-133's NR half is checked on `production` like the rest.
  The audit recorded it as named on #1491 (G6-25); Task 0 re-measures it rather than assuming that.
- **The retired explorer (`/data-explorer-old/`) is in scope** because N-003, N-006, N-007 and N-009
  name it and it is still served. If the team would rather retire the pages than fix them, those
  parts move out of R4 and the rows are re-scoped, not closed.
- **N-003's home-page anchor depends on A-125** (R1, misnested featured-story markup). R4 does not
  fix A-125; if the anchor is still empty after Task 2, N-003 closes except that node, and the
  row says so.

## Instrument

`scripts/site-a11y-audit.mjs`, with `A11Y_PAGES` (added on this branch) set to the page list below.
It builds and serves an isolated `prod_prod` on :8090, proves a positive control (injected `<img>`
without `alt` must fire `image-alt`), and applies a per-page rendered-content control. It exits 1
only if its own evidence is void. Blind spots: axe defers unresolvable colour contrast to
`incompleteIds` (not R4's concern), and it scans each page at rest, so state reached only by
interaction (N-055's tab switch) needs a separate click probe.

Page list (`R4_PAGES`), one line for a PowerShell or Bash env var:

```
(home),data-features/,data-stories/,key-topics/accessibility/,key-topics/airquality/,key-topics/childhealth/,key-topics/climatehealth/,key-topics/foodanddrink/,key-topics/health-equity/,key-topics/healthoutcomes/,key-topics/housing/,key-topics/injury-and-violence/,key-topics/pests/,key-topics/public-space/,data-stories/cold/,data-stories/block-by-block/,data-stories/housing/,data-stories/air-quality-snapshots/,data-stories/urban-heat-island/,data-stories/geographies/,es/data-stories/housing/,zh/data-stories/housing/,data-explorer-old/,data-explorer-old/asthma/?id=2380,data-explorer/indicator-catalog/,data-features/neighborhood-air-quality/,data-features/hvi/,data-features/realtime-air-quality/,data-features/rats-in-your-neighborhood/,data-features/leading-causes/,data-features/minimum-wage/,data-features/rat-report/,data-features/heat-report-archive/2021/,take-action/email-electeds/,neighborhood-reports/,neighborhood-reports/asthma_and_the_environment/
```

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | all: reproduce before fixing | *no commit* (measurement) | **DONE 2026-10-29** | every row reproduced; see Baseline |
| 1 | A-132, A-133 | `47d7a1bea8` | **DONE 2026-10-29** | After-run, below |
| 2 | N-003 | `47d7a1bea8` | **DONE 2026-10-29**, except one node, A-125's (Remainders); row stays OPEN | After-run |
| 3 | N-006, N-055, N-012, N-084 | `47d7a1bea8` | **DONE 2026-10-29**; N-012's rat-report half left to R7 (Remainders), row stays OPEN | After-run; N-055 static parse |
| 4 | N-007, N-013, N-014, N-015, N-018 | `47d7a1bea8` | **DONE 2026-10-29** | After-run; N-018 static parse |
| 5 | N-009 | `47d7a1bea8` | **DONE 2026-10-29** | After-run |
| 6 | N-010, N-011 | `47d7a1bea8` | **DONE 2026-10-29** | After-run |
| 7 | N-056 | `47d7a1bea8` | **DONE 2026-10-29** | built-HTML sweep, below |
| 8 | re-baseline; close rows in the audit | re-baseline `2717a7e8a9`; rows closed in the ledger commit that follows it | **DONE 2026-10-30** | below |

### After-run

`[verified 2026-10-29, uncommitted tree on 80ffb572f3: site-a11y-audit.mjs prod_prod with
R4_PAGES plus es/zh geographies, axe 4.13.0, positive control FIRED; 38 input, 36 rendered — the
two failures are es/zh geographies, which are draft: true and never build. Every rule in the
Baseline table reads 0 nodes on every page except link-name on (home) (1, A-125) and list on
rat-report (1, R7)]`. Not covered: housing's `#housingmap` and the snapshots charts were scanned at
rest only; N-055 needs no click now, since no pane carries `aria-hidden` at all.

- N-018: `<th>` counts on geographies `[4, 4]`; the two wrapper tables are now `<div>`s with
  `display: table`, so `structure.tables.total` 4 → 2 is expected.
- N-055: 0 of 7 `.tab-pane`s carry `aria-hidden`.
- N-056: 46 built pages carry Datawrapper ids; 0 duplicates within a page; 0 `O0SUA`;
  0 "Interactive chart" labels. That includes the hand-pasted copies on `data-stories/violence/`
  (en/es/zh) and heat-report-archive/2021's `16xAz` iframe, which reused `0wHq0`'s id.

`[verified 2026-10-29: node scripts/smoke-env.mjs prod_prod — 1187 pages clean, exit 0]`.

`[verified 2026-10-29: node scripts/characterize-env.mjs prod_prod — exit 1, 22 of 924 pages
differ across 4 fields, one changed line per page: links.noAccessibleText on 15 (data-features/,
data-stories/, es/ and zh/data-stories/, 11 key-topics), controls.noAccessibleName on 5
(indicator-catalog, hvi, neighborhood-air-quality, rats, urban-heat-island), img.missingAlt on
heat-report-archive/2021, tables.total on geographies. Every one is a count falling to what a fix
predicts]`.

### Found while fixing, and handled here

- The geographies `aria-hidden` wrappers (3) hid the radio groups *and* the Vega maps beside them.
  Unhiding exposed `summary-name` and `svg-img-alt` on all three maps, fixed in `buildMap`; the
  same fix went into es/zh geographies (draft, unscanned) and es/zh housing, whose maps share that
  function. The es/zh housing marks were first filed as EHDP-data's; they are fixed client-side
  instead, as geographies is.
- nyc-ol-lib v1.4.78 renders the rats and email-electeds zoom/locate icons and the rats dialog
  input. Patched after `new nyc.ol.FrameworkMap(...)`, marked `HACK`. A-046 (R6) replaces only the
  rawgit `ol.js` tag, so the patch is not throwaway.

### Remainders (rows stay open for these)

- N-003, home page's first featured-story anchor: needs A-125 (R1).
- N-012, rat-report `ol type="I"`: the `update-rat-mitigation-report` branch (R7) already rewrites
  the stray line as an `<li>` and deletes `2024/index.md`; editing it here would only conflict.
- air-quality-snapshots: 7 `aria-hidden="true"` wrappers around Datawrapper charts remain. axe does
  not flag them, and whether hiding the charts is intended is the page author's question.

## Commit, then (ran)

`[verified 2026-10-30: step 2 below on 47d7a1bea8 — "Nothing unexplained" in both keys, 22 of 22
changed pages covered; git diff -U0 tallied 15 noAccessibleText, 5 noAccessibleName, 1 missingAlt
and 1 tables.total line pair per key, and _meta.json changed only capturedAt, fetchedAt and
gitHead. Committed as 2717a7e8a9. Step 3: 14 rows closed by a script that refuses any row not
OPEN; a Status × Priority recount over all 504 rows matches the new Summary table, and the same
recount on the pre-edit copy reproduces the old one]`.

1. Commit the tree — `47d7a1bea8`, one commit including the instrument change.
2. Re-baseline, naming the 22 pages exactly rather than by section glob, because `--expect`
   claims every field on every page it covers (the tool's `globToRegExp` anchors `^…$`, and
   `data-features/**` would cover the whole section):

   ```
   node scripts/site-characterization-rebaseline.mjs --expect "data-explorer/indicator-catalog/" --expect "data-features/" --expect "data-features/heat-report-archive/2021/" --expect "data-features/hvi/" --expect "data-features/neighborhood-air-quality/" --expect "data-features/rats-in-your-neighborhood/" --expect "data-stories/" --expect "data-stories/geographies/" --expect "data-stories/urban-heat-island/" --expect "es/data-stories/" --expect "zh/data-stories/" --expect "key-topics/accessibility/" --expect "key-topics/airquality/" --expect "key-topics/childhealth/" --expect "key-topics/climatehealth/" --expect "key-topics/foodanddrink/" --expect "key-topics/health-equity/" --expect "key-topics/healthoutcomes/" --expect "key-topics/housing/" --expect "key-topics/injury-and-violence/" --expect "key-topics/pests/" --expect "key-topics/public-space/"
   ```

   Pass: "Nothing unexplained". Then tally `git diff -U0 scripts/site-characterization-baseline/` by key: expect only the four
   fields above, on the 22 pages above, in the `prod_prod` key and the matching pages of `staging`.
3. Close the rows in `documents/site-wide-audit-2026-10.md` (Task 8 step 3), naming the commit.

## Task 0: Reproduce every row on `80ffb572f3`

No code fixes. Each row's rule must fire on the page it names, or the row is re-scoped before any
fix (CLAUDE.md, "prove bug claims in a no-code stage first").

1. `A11Y_PAGES="<R4_PAGES>" A11Y_OUT="$TEMP/r4-before" node scripts/site-a11y-audit.mjs prod_prod`.
   Pass: positive control FIRED, 0 pages failed the render control.
2. From `$TEMP/r4-before/page-*.json`, record per row the rule id, page and node count that
   reproduce it, in the table under "Baseline" below. Rules: `link-name` (N-003),
   `aria-required-children` / `aria-required-parent` / `listitem` (N-006), `label` (A-133, N-007),
   `scrollable-region-focusable` (N-009), `aria-hidden-focus` (A-132, N-010), `summary-name` /
   `svg-img-alt` (N-011), `list` (N-012, N-084), `frame-title` (N-013), `image-alt` /
   `aria-command-name` (N-014), `role-img-alt` (N-015). N-018 and N-056 are not axe rules:
   count `<th>` in `data-stories/geographies/` tables, and grep built HTML for `datawrapper-chart-O0SUA`.
3. N-055: click "Heart disease" on `data-stories/air-quality-snapshots/`, read `aria-hidden` on
   `#tab-01-b`.

### Baseline

`[verified 2026-10-29 on 80ffb572f3: site-a11y-audit.mjs prod_prod, axe 4.13.0, positive control
FIRED on (home); 37 pages input, 35 rendered. The two that 404'd were wrong paths in the list, now
corrected above: key-topics/neighborhoods/ is draft: true, and the NR topic index is
neighborhood-reports/asthma_and_the_environment/, which this run therefore did not scan]`.
Node counts per page, from `page-*.json`:

| Row | Rule | Pages (nodes) |
|---|---|---|
| A-132 | `aria-hidden-focus` | neighborhood-air-quality (1, `.my-2[aria-hidden]`) |
| A-133 | `label` | indicator-catalog (2), hvi (2): `#flex_search` and its generated twin. aqe reports none because the input is inside A-132's `aria-hidden` |
| N-003 | `link-name` | data-stories/ 44, data-features/ 21; key-topic pages 5–12 each on 11 of 11 scanned (card links, and `.link-track` on childhealth/foodanddrink); `.email` on 8 story pages; old explorer 2 (`.email`, data-sources link); (home) 1 |
| N-006 | `aria-required-children` / `-parent` / `listitem` | data-stories/ `#pills-tab` (1/8/8); housing en/es/zh `#myTab` (1/2/2 each); air-quality-snapshots `.list-group` (1/0/0); data-explorer-old/ `#accordion-02` (1/0/0) |
| N-007 | `label` | old explorer `#citeText`, urban-heat-island `#slider`, rats `.dia > input` (1 each) |
| N-009 | `scrollable-region-focusable` | leading-causes 1, minimum-wage 2 (`#csv-table-container-N`), old explorer `.dataTables_scrollBody` 1 |
| N-010 | `aria-hidden-focus` | housing 2 (`.btn-group`, `.wide`) |
| N-011 | `summary-name` / `svg-img-alt` | summary: housing en/es/zh, leading-causes, realtime-air-quality; marks: hvi 2, aqe 1, realtime 1, housing es/zh 1 each |
| N-012, N-084 | `list` | housing en/es/zh `.navbar-nav`; rat-report `ol[type="I"]` |
| N-013 | `frame-title` | cold, urban-heat-island; also housing es/zh (`.py-0 > iframe`, not in the row) |
| N-014 | `image-alt` / `aria-command-name` | realtime-air-quality 16/16 markers; heat-report-archive/2021 2 figures |
| N-015 | `role-img-alt` | rats, email-electeds: `.fa-plus`, `.fa-minus`, and `.fa-crosshairs` (3 each; the row names two) |
| N-018 | (static parse) | geographies: 4 tables, `<th>` counts `[0, 4, 0, 4]` |
| N-055 | (static parse) | air-quality-snapshots: 6 of 7 `.tab-pane`s carry `aria-hidden="true"`, including `#tab-02-a`, which is the shown pane at rest |
| N-056 | (grep, built HTML) | `id="datawrapper-chart-O0SUA"` 48 times over 17 pages; every iframe `aria-label="Interactive chart"` |

Not in any row, found by the same run: `aria-hidden-focus` on data-stories/geographies/ (3 nodes,
`div[aria-hidden="true"]` around focusable content) is N-010's shape on another page and is fixed
in Task 6 with it. `aria-allowed-attr` on the old explorer (18) is outside R4 and left alone.

Probes: `scratchpad/tab.py` (rule × page table from `page-*.json`) and
`scratchpad/static_probe.py` (N-018, N-055) are session scratch; their logic is the two
paragraphs above, so a later session re-derives them from this table rather than needing the files.

## Tasks 1–7

Each task: fix, rebuild, re-run step 1 into `$TEMP/r4-after-<N>`, and compare that task's rules
against the baseline. Pass: those rules' node counts on those pages drop to 0 (or to the
documented remainder), and no rule in the whole list gains a node. Then `npm run smoke` against
the same isolated build is Task 8's job, not each task's.

- **Task 1.** `themes/dohmh/layouts/data-features/aqe.html` (the `aria-hidden="true"` wrapper
  around the picker); flexdatalist names in `themes/dohmh/layouts/partials/de-text-search.html`,
  `themes/dohmh/layouts/data-features/hvi.html`, `aqe.html`. Exemplar for the naming:
  `nr-neighborhood-picker-js.html` sets `aria-labelledby` on the generated input.
- **Task 2.** Card partials under `themes/dohmh/layouts/partials/` that render image-card links,
  the story share-by-email link, the old explorer's data-sources icon link.
- **Task 3.** Tab and list markup: `data-stories/section.html` (`#pills-tab`), housing (`#myTab`),
  air-quality-snapshots (`role="list"`, static `aria-hidden` on panes), old explorer section
  accordion, `data-stories/single.html` "Read this data story in:" `<span>` in `<ul>`, rat-report
  `ol type="I"`.
- **Task 4.** `#citeText`, `#slider`, `.dia > input` labels; iframe titles on cold and
  urban-heat-island; realtime-air-quality marker names and `alt`; heat-report-archive 2021 figure
  `alt`; FA `.fa-plus`/`.fa-minus` names; geographies table headers.
- **Task 5.** `themes/dohmh/layouts/shortcodes/csvtable.html` container `tabindex="0"`; old
  explorer DataTables scroll body.
- **Task 6.** housing's `aria-hidden` wrappers; Vega action-menu and mark-group names outside the
  NR report, following #1491's A-343/A-346 fix in `assets/js/nr-report/chart.js`.
- **Task 7.** `themes/dohmh/layouts/shortcodes/datawrapper.html`: title from the shortcode's own
  argument, id unique per chart.

## Task 8: Close and gate

1. `node scripts/smoke-pages.mjs --all` against an isolated `prod_prod`
   (`npm run smoke:prod_prod`). Pass: exit 0.
2. `npm run characterize:site:prod_prod`. These tasks add and remove rendered elements, so a diff
   is expected on the touched pages; re-baseline with
   `node scripts/site-characterization-rebaseline.mjs --expect "<touched page globs>"` and tally
   `git diff -U0` by key before committing.
3. Close each row in `documents/site-wide-audit-2026-10.md` in the five places its Summary
   paragraph lists, and the R4 Roadmap row.

## Next command

```
gh pr list --head feature-resolve-audit-items   # none yet means the PR into production is still to open
```
