# Chart coverage plan — 2026-09-09

A QA harness that renders the site's Vega / Vega-Lite charts and checks them, closing the gap
neither `smoke` nor `characterize:site` can reach.

**Status as of 2026-09-09: nothing started. Branch `feature-chart-coverage` cut from `production`
at `1a1d11d409`, no commits on it yet. Task 0 is a measurement whose result decides the page set
for Tasks 1–5, so it runs first and its answer is written back into this document.**

---

## Why this exists

Two checks sweep the whole site today and neither sees a chart render.

- **Neither harness ever clicks.** Both load a page, wait, and read
  `[verified 2026-09-09: grep -c 'click' → 0 on both scripts/smoke-pages.mjs and
  scripts/site-characterization.mjs; control: grep -c 'goto' on the same two files → 1 and 3, so
  the files are being read and the pattern does match navigation code]`.
- `smoke:all` fails on console `error` / `pageerror`, which is everything it claims.
- `characterize:site` diffs a per-page `structure` record. That record has no SVG or chart field at
  all — its shape is `lang`, `assets`, `headingLevels`, `landmarks`, `meta`, `jsonld`, `img`,
  `links`, `controls`, `tables`, `iframes`, `overflowX`
  `[verified 2026-09-09: enumerated every leaf key of
  scripts/site-characterization-baseline/staging/404.html.json; control: the same enumeration
  returns 11 populated `structure` groups, so the reader is not returning empty]`.

So a chart that throws on interaction, or renders empty on one neighborhood, is invisible to both —
the first because no chart on a DE or NR page renders without a click, the second because no field
in the record could hold the difference even if it did.

### The bugs this would have caught

Three real hotfixes, diffs read rather than inferred from branch names:

| PR | Commit | What broke | Caught by |
|---|---|---|---|
| #1454 `hotfix-nr-greenwich-village-name` | `a41bafdb95` | `neighborhood: "Greenwich Village - Soho"` vs `data_json: "…Greenwich Village - SoHo"`. Five pages of one neighborhood showed no data; template fine, 41 other neighborhoods fine | cross-instance invariant (Task 4) |
| #1417 `hotfix-disparities-chart-bug` | `ef470eb477` | JS logic in `data.js` / `global.js` / `measures.js` | interaction capture (Task 3) |
| #1489 `hotfix-injury-leading-causes-undefined` | `0c860946cd` | `cause_text` / `cause` mismatched between two CSVs; tooltips rendered undefined while the chart drew correctly | **nothing here** — a data-consistency check over the CSVs, out of scope |

#1489 is in the table to mark the boundary. This harness drives a browser; a bug where the chart
draws correctly from wrong inputs is a different instrument, and the plan does not claim it.

### Measured facts this plan rests on

All from 2026-09-09, on a `hugo server --environment development` at `/dev-prod/`, vega 5.33.1 /
vega-lite 5.23.0 / vega-embed 6.29.0.

- **262 of 735 English sitemap pages load a vega bundle**: 41 `data-explorer`, 9 `data-features`,
  2 `data-stories`, 210 `neighborhood-reports`
  `[verified: one threaded fetch of all 735 sitemap URLs, matching on "lib-vega-bundle" or
  "vegaBundle" in the served HTML; 0 fetch errors]`.
- **Charts render fast.** Click → chart present: NR median **439ms** (n=45, min 343, max 466), DE
  median **33ms** (n=6). "Present" means a `.vega-embed` whose `svg` has `childElementCount > 0`;
  counting the container alone races the draw.
- **Per-page serial cost, polling rather than sleeping**: NR **7.7s** (11 toggles), **9.3s** (15),
  **12.7s** (23); DE **3.2s** and **3.3s** (4 pill tabs).
- **Exactly one toggle per page opens a panel with no chart.** An earlier probe waited its full
  20s timeout there, which was 20 of every 27 seconds. Dropping that wait to 2.5s returned
  identical chart counts (10, 14, 22, 3, 3).
- **Expands cannot be batched.** Clicking every toggle with a 250ms gap and waiting once returned
  6 charts where sequential returned 10, 8 where sequential returned 14, and 13 where sequential
  returned 22. A fast second expand drops the first one's render
  `[verified 2026-09-09: both arms run in the same process against the same server, same page, same
  toggle list; control: the sequential arm is the positive control and returned the full 10/14/22,
  so the loss is the batching and not the counter]`. Mechanism not established; treat it as a
  constraint, not a tuning knob.
- **The record shape is stable across repeat runs.** Two identical captures differed on **0 of 53**
  chart slots (data-features / data-stories / DE) and **0 of 170** (NR). Fields compared: SVG
  `width`/`height` attributes, per-tag element census, `text` element count.

### Decisions taken, and what was rejected

- **Not a flag on `characterize:site`.** Its contract is every page, one load each, no interaction;
  a mode that interacts changes what a green run of it means. Rejected in favour of a sibling
  script that imports its baseline plumbing.
- **Not a from-scratch harness either.** The baseline root, `_meta.json` provenance, environment-key
  resolution and re-capture arbitration in `scripts/site-characterization.mjs` are worth reusing.
- **Screenshot diffing is out of scope.** It is the only thing that catches "renders, structurally
  fine, looks wrong" — colour, overlap, illegible labels — and it is a much larger commitment.
  Named here so a later reader knows it was considered rather than missed.
- **A per-template sample (~17 pages, ~90s) was the original proposal and is now the fallback,
  not the target.** It cannot catch #1454: the sample visits one page per template, so it covers
  at most 2 of the 42 neighborhoods, and `Greenwich_Village_SoHo` is not among them
  `[verified 2026-09-09: the sample set drafted in session was east_harlem and bayside_little_neck;
  control: those two ARE covered, so a fault in either would be caught — the gap is instance
  coverage, not the check]`. It stays as the answer if Task 0 shows full coverage is unaffordable.

### Environment state

- Branch `feature-chart-coverage` at `1a1d11d409`, cut from local `production`, no upstream set
  (`git config --get branch.feature-chart-coverage.merge` returns empty).
- `scripts/nr-chart-probe.mjs` is **tracked**, committed alongside this document. It is the
  throwaway session probe that produced the NR numbers above, kept as the seed for Task 3 — adapt
  it there rather than rewriting it, and delete it once `chart-characterization.mjs` exists.
- No hugo server should be running when Task 0 starts. Task 0 starts its own and must stop it.

---

## Ledger

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Measure concurrent interaction cost | — | **Not started** | — |
| 1 | Derive the chart-page set and the chart-bearing-toggle rule | — | **Not started** | — |
| 2 | Export shared plumbing from `site-characterization.mjs` | — | **Not started** | — |
| 3 | Capture module: interaction and record shape | — | **Not started** | — |
| 4 | Cross-instance invariant | — | **Not started** | — |
| 5 | `--baseline` and `--check` modes | — | **Not started** | — |
| 6 | Positive control against `a41bafdb95` and `ef470eb477` | — | **Not started** | — |
| 7 | npm scripts, CI decision, docs | — | **Not started** | — |

---

## Instrument inventory

What can measure a rendered chart, what each is blind to, what each costs. Written before the task
list so that no task reaches for the most expensive option by default.

| Instrument | Sees | Blind to | Cost |
|---|---|---|---|
| `smoke:all` | thrown errors, all 925 pages | anything not thrown; any chart needing interaction | 449s at concurrency 6 |
| `characterize:site` | page structure, all 925 pages | every chart field; anything needing interaction | ~130s incl. builds |
| Playwright `page.evaluate` over `.vega-embed` | SVG dimensions, per-tag element census, text content | wrong values that render correctly; colour and overlap | ~440ms per chart |
| vega `View.data()` via the embed result | the data actually bound to a view | nothing about layout | not yet measured |
| Screenshot diff | everything visual | nothing — but noisy, and needs a stable renderer | not measured; out of scope |
| Cross-instance comparison of sibling pages | one instance disagreeing with its 41 siblings | a fault common to all instances | free, given the captures |

The fourth row is worth a note: `vegaEmbed()` resolves to `{ view, spec, vgSpec }`, and
`view.data(<name>)` returns the bound rows. That is the only instrument here that could speak to
#1489-class bugs, and Task 3 should record whether it is cheap enough to include rather than
silently skipping it.

---

## Task 0: Measure concurrent interaction cost

The page-set decision rests on a projection, not a measurement: 262 pages at ~10s each is ~38
minutes serial, which at concurrency 12–24 *projects* to 2–4 minutes. Nothing has measured the
concurrent case, and 23 sequential clicks per page is exactly the shape that could behave
differently under contention — this repo's `CLAUDE.md` already records unexplained concurrency
flakes in the existing sweeps.

**Files:**
- Create `scripts/chart-cost-probe.mjs` (throwaway; deleted in this task's final step)
- Read `scripts/site-urls.mjs:28` (`mapPool`) — the concurrency primitive the other harnesses use
- Read `scripts/site-characterization.mjs:77-79` — `CONCURRENCY_FLOOR` 6, `CONCURRENCY_CEILING` 24,
  `DEFAULT_CONCURRENCY = min(24, max(6, availableParallelism()))`

**Interfaces:** produces a concurrency figure and a wall-clock total, written back into this
document's "Measured facts" section and into Task 1's page-set decision. Consumes nothing.

**Steps:**

1. Start `npx hugo server --environment development --port 1313`. Wait for
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:1313/dev-prod/` to return 200.
2. Interleave three sweeps over the same 20 NR pages so a warm cache cannot pass for a concurrency
   effect: concurrency 6, then 24, then 6 again. Expected: the two 6-runs agree within a few
   percent. A non-monotonic result across the ordered sweep means order was measured, not
   concurrency — re-run before believing it.
3. For each sweep, record wall-clock total and the per-page chart counts.
4. Compare chart counts across all three sweeps. **Any page whose count differs between sweeps is
   the finding**, and it outranks the timing: it means interaction under concurrency is lossy, the
   way batching was, and the harness must run at a lower concurrency or serially.
5. Extrapolate to 262 pages and write the number into this document.
6. Stop the server (`Get-CimInstance Win32_Process -Filter "Name='hugo.exe'"`, stop each, confirm
   the count is 0 and port 1313 is free). Delete `scripts/chart-cost-probe.mjs`.

**Proof:** three sweeps of 20 pages, chart counts identical across all three, and the two
concurrency-6 totals within 5% of each other. Record all three totals.

**Decision this task settles:** whether Tasks 1–5 target all 262 chart pages or the ~17-page
per-template sample. Write the answer into the "Decisions taken" section above.

---

## Task 1: Derive the chart-page set and the chart-bearing-toggle rule

Two enumerations, both of which must come from the served site rather than from a hand-written list,
for the reason `smoke:all` enumerates rather than hardcodes.

**Files:**
- Create `scripts/chart-pages.mjs`
- Read `scripts/site-urls.mjs:79` (`collectAllPaths`) — returns every path the site serves
- Read `themes/dohmh/layouts/partials/lib-vega.html:7-8` — the bundle name to match on
- Read `themes/dohmh/layouts/partials/nr-indicator-new.html:19-22,110-113,129` — the collapse
  toggle, its `data-target`, and the `#map-<indicator>-<count>` container the chart draws into
- Read `themes/dohmh/layouts/data-explorer/single.html:524-549` — the four pill tabs
  `#tab-btn-table`, `#tab-btn-map`, `#tab-btn-trend`, `#tab-btn-links`

**Interfaces:**
- Exports `chartPages(baseURL)` → array of paths whose HTML references `lib-vega-bundle` or
  `vegaBundle`. Consumed by Tasks 3, 4, 5.
- Exports `interactionPlan(kind)` → the selectors to drive for a page kind: `de` returns the four
  tab ids, `nr` returns a rule for chart-bearing collapses, everything else returns `[]`.

**Steps:**

1. Implement `chartPages` as a threaded fetch over `collectAllPaths`, matching the served HTML.
   Expected on the current tree: 262 pages, split 41 / 9 / 2 / 210 across data-explorer,
   data-features, data-stories, neighborhood-reports.
2. Derive the chart-bearing NR toggles **from the markup**, not by clicking and timing out. A
   toggle's `data-target` names its collapse; that collapse contains a `#map-…` div when it has a
   chart. Implement as a single `page.evaluate` returning only the toggles whose target subtree
   holds a chart container.
3. Verify the rule against the known shape: on
   `neighborhood-reports/east_harlem/climate_and_health/` it must return 10 of the 11 toggles, on
   `…/active_design_physical_activity_and_health/` 14 of 15, on `…/outdoor_air_and_health/` 22 of
   23. Those three counts are measured, not assumed.
4. If the rule returns all toggles on any page, it has not discriminated — that is a dead
   predicate, not a page with an extra chart. Check the one non-chart toggle's markup and narrow it.

**Proof:** `chartPages` returns 262 with the 41/9/2/210 split; `interactionPlan("nr")` returns
10/14/22 on the three named pages. Both numbers stated as exact expectations, so a drift in either
is visible rather than absorbed.

---

## Task 2: Export shared plumbing from `site-characterization.mjs`

A pure-export change: no behavior change, provable by construction.

**Files:**
- Edit `scripts/site-characterization.mjs` — add `export` to `readEnvironment` (:1037),
  `writeMeta` (:851), `existingBaselines` (:1075), `browserUserAgent` (:1082), `walk` (:751),
  `differingPaths` (:806), `META_FILE` (:831), `BASELINE_ROOT` (:108)

Currently exported, already available and not to be touched: `CAPTURE` (:244), `capturePage`
(:688), `githubSlug` (:978), `fetchDataCommit` (:1004).

**Interfaces:** produces importable baseline plumbing for Tasks 3 and 5. Consumes nothing.

**Steps:**

1. Add the `export` keyword to each of the eight names above. Change nothing else — no
   reordering, no signature changes, no reformatting.
2. Prove the change is a no-op for the existing harness: `git diff` must show exactly eight changed
   lines, each differing only by a leading `export `.
3. Run `npm run characterize:site:sample` and confirm it still passes against the committed
   baseline.

**Proof:** `git diff -U0 scripts/site-characterization.mjs | grep -c '^[+-]'` returns 16 (eight
pairs), and every `+` line equals its `-` line with `export ` prepended. Then
`npm run characterize:site:sample`, zero diffs expected.

**Note on the baseline key:** `readEnvironment` returns
`key = hugoEnv === "prod_prod" ? "prod_prod" : dataBranch`. The chart harness must use the same
function rather than reimplementing that rule, so a chart baseline and a structure baseline
captured from one server always agree on which key they belong to.

---

## Task 3: Capture module — interaction and record shape

**Files:**
- Create `scripts/chart-characterization.mjs`
- Read `scripts/nr-chart-probe.mjs` (untracked, in the working tree) — the measured interaction
  sequence, to be adapted rather than rewritten
- Import from `scripts/chart-pages.mjs` (Task 1) and `scripts/site-characterization.mjs` (Task 2)

**Interfaces:**
- Exports `captureCharts(browser, baseURL, path, userAgent, prefix)` → `{ path, status, charts,
  errors }`, mirroring `capturePage`'s signature so the two can share a driver.
- Each chart record: `{ key, svgW, svgH, elements, textCount }`. `key` is the container id, which
  `nr-indicator-new.html` derives from the indicator name and is therefore stable across runs and
  across neighborhoods.

**Steps:**

1. Expand or click one interaction at a time, waiting for the rendered count to rise. Sequential is
   required: batching drops renders (measured — 22 charts became 13). Do not add a batch mode.
2. Poll for the chart rather than sleeping. Cap the wait at 2.5s, which is ~5x the measured p90 of
   457ms.
3. Record the SVG's `width`/`height` **attributes**, not the bounding box. A collapsed Bootstrap
   panel reports zero height while holding a fully rendered chart, so the box is not a usable
   field here.
4. Record the per-tag element census and the `text` element count. These were identical across two
   repeat runs on 223 charts, and they are what caught the v5→v6 comparison's real signal.
5. Decide whether to record `view.data()` from the embed result, per the instrument inventory.
   Measure the cost on one page before including it; if it is included, record which dataset names
   are read and why, because an unnamed dataset is a dead field.
6. Capture console `error` and `pageerror` during interaction. Chart-render exceptions on DE and NR
   are currently caught by nothing, and this is the pass that could see them.

**Proof:** run twice against the same commit on the Task 0 page set and diff. Expected: zero
differing chart slots, matching the 0/53 and 0/170 already measured. A non-zero noise floor here
must be diagnosed before Task 5, because `--check` is worthless on top of it.

---

## Task 4: Cross-instance invariant

The cheap half, and the one that catches #1454. Sibling pages of the same template are each other's
baseline, so this needs no committed baseline and no maintenance as content changes.

**Files:**
- Edit `scripts/chart-characterization.mjs` — add the invariant check
- Read `content/neighborhood-reports/Greenwich_Village_SoHo/Climate_and_Health.md:3-6` — the
  `neighborhood` / `data_json` pair whose mismatch is the worked case

**Interfaces:** consumes the capture array from Task 3. Produces a list of instances that disagree
with their template cohort.

**Steps:**

1. Group captured pages by template cohort: NR pages by topic segment (five cohorts of 42), DE
   pages as one cohort of 41.
2. For each cohort, compute the modal chart count and flag every member that differs from it.
3. Report the flagged pages with their count and the cohort's mode. Do not fail on a *difference in
   dimensions* between cohort members — indicator data legitimately varies chart height. Fail on
   chart **count**, which is what a broken data lookup moves.
4. State the invariant's blind spot in the code comment: a fault common to every member of a cohort
   passes, because the mode moves with it. That is what the Task 5 baseline is for.

**Proof:** on the current tree, zero cohort members flagged across all six cohorts. That is a null
result, so it does not stand alone — Task 6 supplies its positive control.

---

## Task 5: `--baseline` and `--check` modes

**Files:**
- Edit `scripts/chart-characterization.mjs`
- Create `scripts/chart-characterization-baseline/` (committed; one directory per baseline key)
- Read `scripts/site-characterization.mjs:135` — `ARBITRATION_CAP` 25, and the reasoning for it

**Interfaces:** consumes Tasks 2, 3, 4. Produces committed baselines and a non-zero exit on
regression.

**Steps:**

1. `--baseline` captures and writes per-page JSON under the key `readEnvironment` returns, plus a
   `_meta.json` via the exported `writeMeta`.
2. `--check` captures and diffs against the committed baseline for the running environment's key,
   exiting 2 with a named fix when no baseline exists for that key — the same failure mode
   `characterize:site` already has.
3. Re-capture differing pages sequentially before reporting, capped the way the sibling harness
   caps at 25. A difference wider than the cap is systematic, and re-visiting hundreds of
   interaction-heavy pages would report nothing for a very long time.
4. Capture and commit the `staging` and `prod_prod` baselines, matching which keys
   `site-characterization` commits today.

**Proof:** `--baseline` twice on the same commit produces byte-identical records; `--check`
immediately after passes with zero diffs.

---

## Task 6: Positive control

A check whose ability to fire is untested is not a check. Both arms below are real commits in this
repo's history, so this is a test that can be run rather than a claim.

**Files:** none created or edited. This task runs the harness against historical commits.

**Interfaces:** consumes Tasks 3, 4, 5. Produces the evidence that licenses every null result they
report.

**Steps:**

1. **Invariant arm.** Check out `a41bafdb95^1` (the tree before the Greenwich Village fix) into an
   isolated build per this repo's `HUGO_RESOURCEDIR` + `-d` recipe, so `docs/` and
   `resources/_gen` are untouched. Run the invariant. Expected: the five
   `Greenwich_Village_SoHo` pages flagged as disagreeing with their cohorts.
2. If they are *not* flagged, establish which before proceeding: the pages rendered charts and the
   bug was in the values (in which case the invariant is the wrong instrument for #1454 and this
   plan's central claim is wrong), or the harness failed to reach them.
3. **Interaction arm.** Check out `ef470eb477^1` (before the disparities fix) the same way. Run
   `--check` and the error capture. Record what fires — a structural diff on the disparities chart,
   a console error, or neither.
4. Write both outcomes into this document, including a negative. A negative here is a finding about
   the harness's reach and must not be quietly dropped.

**Proof:** the flagged-page list from step 1 and whatever step 3 reports, both quoted verbatim into
the ledger's proof column.

---

## Task 7: npm scripts, CI decision, docs

**Files:**
- Edit `package.json` — add scripts alongside the existing `characterize:*` block
- Edit `CLAUDE.md` — a section beside "Site characterization"
- Edit `readme-development.md` — if the existing harnesses are documented there, match it
- Possibly create `.github/workflows/` entry — decided in step 3

**Interfaces:** consumes everything above.

**Steps:**

1. Add `characterize:charts` (check), `characterize:charts:baseline`, and
   `characterize:charts:sample`. **Give each mode its own script rather than a forwarded flag** —
   PowerShell eats the `--` in `npm run x -- --flag`, which is why `smoke:all` exists as its own
   script. Take positionals only, and reject any argument starting with `-`, matching
   `characterize-env.mjs`.
2. Document what a pass is worth and what it is blind to: values that render correctly from wrong
   inputs, and anything visual that is structurally identical.
3. Decide whether this runs in CI. The input is Task 0's number. If full coverage lands near
   `characterize:site`'s ~130s it belongs on every PR into `production`; if it is closer to 38
   minutes it belongs on `workflow_dispatch` and pre-deploy only. Record the decision and its
   number here.
4. Delete `scripts/nr-chart-probe.mjs`. It is tracked, and Task 3 supersedes it — a throwaway
   probe left beside the harness it seeded is read as a second, disagreeing harness.

**Proof:** `npm run characterize:charts` from both PowerShell and Bash, same page count in both.
`npm run docs-check`, if it covers the files edited.

---

## Next command

```bash
# On feature-chart-coverage at 1a1d11d409. Task 0, step 1.
git rev-parse --abbrev-ref HEAD                  # expect feature-chart-coverage
npx hugo server --environment development --port 1313 &
curl -s -o /dev/null -w "%{http_code}" http://localhost:1313/dev-prod/   # expect 200
```

Then write `scripts/chart-cost-probe.mjs` per Task 0 and run the three interleaved sweeps.

To derive what this document deliberately does not state:

```bash
git log --oneline 1a1d11d409..HEAD                          # the task commits
git rev-parse --verify origin/feature-chart-coverage        # errors = never pushed
git rev-list --left-right --count origin/feature-chart-coverage...HEAD   # then 0 0 means in sync
gh pr list --head feature-chart-coverage                    # a PR, and against which base
```

The second line is there because the third cannot distinguish "not pushed" from a bad ref — it
exits non-zero for both. Run them in that order.
