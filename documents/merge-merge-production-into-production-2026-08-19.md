# Merging `merge/production` into `production`

**Goal:** land the commits on `merge/production` — the `head.html` library-gating refactor, the
Vega SVG rollout, the UHF42 name fixes and the plan/audit documents — on `production`, without
shipping the one defect the gating refactor leaves behind.

**Verdict: the merge is clean, the build is green, and the one page kind that regressed is fixed.**
`themes/dohmh/layouts/neighborhood-reports/topiclanding.html` was the only NR template without a
`lib-uhflist.html` include while using the `neighborhoods` global, costing five published pages their
neighborhood search. Task 1 added the include (`ab831a000c`) and Task 2's smoke run is green; Task 3,
the merge, is what remains.

## Ledger

**Status as of 2026-08-20: Tasks 1 and 2 done; Task 3 in progress — PR #1473 is open and not
merged.** The fix landed as `ab831a000c`, smoke is green at 33/33 on the branch tip, and merging
the PR is the only thing left. Merging it deploys.

| # | Task | Status |
|---|---|---|
| 1 | Add `lib-uhflist.html` to `topiclanding.html` | **DONE 2026-08-20** — `ab831a000c`, 1 file, +2/-1 |
| 2 | Re-run `npm run smoke`, expect 33/33 | **DONE 2026-08-20** |
| 3 | Merge `merge/production` into `production` | **In progress** — PR [#1473](https://github.com/nychealth/EH-dataportal/pull/1473) opened 2026-08-20, not merged |

**Task 1 proof.** `[verified 2026-08-20: grep -c 'partial "lib-uhflist' across the four NR templates
returns 1 for each of neighborhood-reports/section.html, neighborhood-reports/topiclanding.html,
nr-output/section.html, nr-output/single.html]`.

**Task 2 proof.** `[verified 2026-08-20 on the branch tip adafc076e1: npm run smoke → exit 0,
"Smoke test PASSED — 33 pages clean (known noise allowlisted)", zero FAIL lines, including
neighborhood-reports/active_design_physical_activity_and_health/ — the topiclanding entry that
failed with "neighborhoods is not defined" before Task 1]`. No `airnowapi.org` CORS flake on any
run. Smoke has run three times: at `81ad0123e9`, again after `31b08a3aa2` landed because that commit
changes a template, and again at `adafc076e1` — a green run is a fact about the commit it loaded, and
`a67f957ba7` had moved `scripts/dev-server.mjs`, which is the harness the run itself uses. **Cite the run that
covers the tip, and re-run smoke if any further commit lands before the PR merges.** One exception,
and it is narrow: a commit confined to `documents/` cannot reach the build. That directory is not a
Hugo mount — `config/_default/config.toml` mounts `node_modules`, `content`, `static`, `layouts` and
`data`, and nothing else — and the only two templates naming it do so in source comments citing an
audit `[verified 2026-08-20: grep for "documents" across config/, and for "documents/" across
themes/, assets/ and content/ — two hits, both source comments]`. So the run at `31b08a3aa2` still
covers the rendered output
after a docs-only commit. Any commit touching a template, `assets/`, `content/`, `data/` or `config/`
re-arms the rule.

**Two unplanned commits rode along.** `81ad0123e9` adds port `8081` to `PROBE_PORTS` in
`scripts/dev-server.mjs`, so the smoke harness finds a server running there instead of starting a
second builder. `31b08a3aa2` writes `partial "nr-leaflet.html"` in place of `partial "nr-leaflet"` in
`topiclanding.html` and carries this memo; the partial resolves either way and
`themes/dohmh/layouts/partials/nr-leaflet.html` exists. Both merge to `production` with everything
else. The `8081` change makes three records false — see the reconciliation note at the end.

**A third rode along, docs-only.** `documents/audit-backlog-production-2026-08-20.md` is the plan for
the easy and moderate audit findings that are open on this tree. It is committed here rather than on
the branches that will execute it, so that it reaches `production` with this merge and is in place
before those branches are cut off the merge commit. It changes no build input; see the exception
above.

**Task 3 precheck re-run at the branch tip, and it still passes** `[verified 2026-08-20 with
merge/production at adafc076e1: production is unmoved at 781c15773d — local and origin/production
agree; git -c rerere.enabled=false merge-tree --write-tree production merge/production → exit 0,
single tree oid 9013dac397; git diff --stat merge/production 9013dac397 → 1 file,
content/data-stories/congestion-tolling-update/index.md, +2/-1]`. The same check at `31b08a3aa2`
returned tree `eaa0e77c1f` with the same one-file diff. That is the PR #1471 hotfix
and nothing else, matching the 2026-08-19 finding. The branch carries **zero merge commits**
`[verified 2026-08-20: git rev-list --merges --count production..merge/production → 0]`. For how far
ahead it is, run `git rev-list --count production..merge/production` — a number written here is
falsified by the commit that carries it, which is row 6 of
[`nr-followups-2026-08-15.md`](nr-followups-2026-08-15.md). Re-run this precheck if either tip moves
before the merge.

**Environment state a cold session needs.** The work happens in the
`EH-dataportal.worktrees/merge/production` worktree, which has `node_modules` installed. `production`
is checked out in the **main** repo directory (`Documents/DOHMH/Programming/EH-dataportal`), not in
`EH-dataportal.worktrees/production` — that one holds `build-to-dev-stage`. **A hugo process is
running** (PID 19688 as of 2026-08-20 16:22, not started by this session); the smoke run reused it
rather than starting its own. This memo is committed as of `31b08a3aa2` and pushed, so it
reaches `production` with the merge. The build and sweep outputs cited below were written to session-scoped temp directories that
no longer exist; the numbers are the record.

**Decision taken:** fix on `merge/production` before merging, rather than merging and hotfixing
`production` afterwards. The defect is one line, `merge/production` is not deployed, and a green
smoke run on the branch is what makes the merge itself provable. Rejected alternative: merge now and
fix on `production`, which puts a broken NR entry point on the live site for the length of a
build cycle.

---

## Task 1: give `topiclanding.html` its `lib-uhflist.html` include

**Files:** `themes/dohmh/layouts/neighborhood-reports/topiclanding.html` — the include block at
line 18 (`lib-leaflet.html`, immediately before `{{ partial "nr-leaflet" . }}` on line 19).

**Interfaces:** consumes nothing from earlier tasks. Produces the `neighborhoods` global on every
page rendered by this template, which Task 2's smoke run checks.

**Why it is needed.** `merge/production` deletes `head.html`'s blanket library block, which is where
`production` loads `js/uhflist.js` for every page
`[verified 2026-08-19: production's head.html:175-176 loads resources.Get "js/uhflist.js"; the same
grep against merge/production's head.html returns nothing]`. The four NR templates were given
explicit `lib-*` includes to replace it, and three of the four got `lib-uhflist.html` —
`neighborhood-reports/section.html:87`, `nr-output/section.html:19`, `nr-output/single.html:61`.
`topiclanding.html` did not, and `loadList()` at line 185 passes `neighborhoods` to flexdatalist at
line 204.

**Step 1.** Insert the include after the Leaflet one, matching the whitespace-trimming form of the
line above it:

```
                            {{- partial "lib-leaflet.html" . }}
                            {{- partial "lib-uhflist.html" . }}
                            {{ partial "nr-leaflet" . }}
```

Expected result: the file differs from `feature-new-data-explorer`'s copy only in the
`id="skip-header-target"` attribute on line 3, which is DE-branch work and does not belong here
`[verified 2026-08-19: git diff of the two blobs returns exactly those two hunks]`.

**Step 2.** Confirm all four NR templates now carry the include:

```
grep -c 'partial "lib-uhflist' themes/dohmh/layouts/neighborhood-reports/section.html \
    themes/dohmh/layouts/neighborhood-reports/topiclanding.html \
    themes/dohmh/layouts/nr-output/section.html \
    themes/dohmh/layouts/nr-output/single.html
```

Expected result: `1` for each of the four.

## Task 2: re-run the smoke test

**Files:** none edited. `scripts/smoke-pages.mjs` is the check.

**Interfaces:** consumes Task 1's edit. Produces the green run that Task 3's merge rests on.

**Step 1.** With no Hugo server already running, from the `merge/production` worktree:

```
npm run smoke
```

It spawns its own `hugo serve --environment dev_stage`. Expected result: exit 0,
`33 pages clean`. The page to watch is
`neighborhood-reports/active_design_physical_activity_and_health/`, which is the `topiclanding`
entry in `PAGES`.

**Step 2.** If a CORS error from `airnowapi.org` fails `(home)`, re-run before diagnosing — that one
is external and is not covered by the `KNOWN_NOISE` allowlist (see `CLAUDE.md` § Smoke test).

## Task 3: merge

**Files:** none edited by hand. The merge is clean; do not resolve anything.

**Interfaces:** consumes Task 2's green run.

**Step 1.** Re-confirm the merge is still conflict-free — `production` may have moved since
2026-08-19:

```
git -c rerere.enabled=false merge-tree --write-tree production merge/production
```

Expected result: exit 0 and a single tree oid on stdout. Any file paths in the output mean
`production` has moved and the conflict must be read before merging. Run it with `-c
rerere.enabled=false`: `rerere.enabled=true` is set in the shared repo config and its cache holds a
wrong `package.json` recording (recorded in the NR/DE plan's Stage B notes).

**Step 2.** Merge through a **pull request** into `production`, not a local merge and push. The
deploy workflow fires on a merged PR, not on a push
`[verified 2026-08-19: .github/workflows/hugo-build-to-prod-prod.yml triggers on
pull_request → branches: production → types: closed, gated by
if: github.event.pull_request.merged == true || github.event_name == 'workflow_dispatch']`. A
pushed local merge lands the code and builds nothing until someone dispatches the workflow by hand
(`trigger_prod-prod_workflow.ps1`).

**Step 3.** With `production` fetched, verify its tree equals `merge/production`'s tree plus
production's hotfix, and nothing else:

```
git diff --stat merge/production origin/production
```

Expected result: one file — `content/data-stories/congestion-tolling-update/index.md`, 2
insertions, 1 deletion.

---

## What the merge does, and the evidence

All checks below ran on 2026-08-19 against `production` at `781c15773d` and `merge/production` at
`96fedd502d`, merge base `c0931fbee6`.

**It is a true merge, not a fast-forward.** `merge/production` is 40 commits ahead; `production` is
2 ahead, both from PR #1471 (the congestion-tolling update note). None of the 40 is a merge commit —
the branch is linear.

**No conflicts, and nothing from `production` is lost.** `git merge-tree --write-tree` exits 0 with
a single tree oid `3ae9e96e18`. That tree differs from `merge/production`'s own tree by exactly one
file, the PR #1471 hotfix `[verified 2026-08-19: git diff --stat merge/production
3ae9e96e18 → 1 file, 2 insertions, 1 deletion]`.

**92 files change against `production`** — 4541 insertions, 590 deletions. Seven new `lib-*.html`
partials, `head.html`'s blanket block removed, ~20 `data-features` templates given explicit
includes, the Vega SVG shortcode change, UHF42 name fixes, taxonomy keywords lowercased, and the
`documents/` write-ups. No `.github/workflows/` changes; `config/` is byte-identical on both sides.

**The build is green under the config the deploy workflow uses**
`[verified 2026-08-19: HUGO_RESOURCEDIR=<temp> hugo --environment prod_prod -d <temp> → exit 0, 0
ERROR, 1282 EN / 91 ES / 91 ZH pages, 31.9s; the worktree stayed clean]`. The `production` control
build gives 1286 EN pages, but **both builds publish an identical set of 1397 HTML paths** — no URL
appears or disappears `[verified 2026-08-19: comm of the two sorted find outputs, both directions
empty]`. The 4-page difference is in pages that render no HTML output.

### The one regression: five NR topic-landing pages

**Fixed by `ab831a000c`; the section below is the 2026-08-19 finding as it stood before the fix.**

`npm run smoke` on `merge/production`: 32 ok, 1 FAIL of 33.

```
FAIL  neighborhood-reports/active_design_physical_activity_and_health/
        neighborhoods is not defined
        neighborhoods is not defined
```

**This is not a working page breaking — it is a broken page changing its failure mode.** The control
run on `production` fails the same page with `Cannot read properties of null (reading
'appendChild')`, 1 FAIL of 32 `[verified 2026-08-19: node scripts/smoke-pages.mjs in the main
worktree on 781c15773d]`. That is the missing-`<ul>` defect (Finding 6 in the NR/DE plan);
`e6e5af11dc` on this branch fixed it, and the missing `neighborhoods` global is what was underneath.
Fixing Task 1 clears both.

Five built pages render from this template: `active_design_physical_activity_and_health`,
`asthma_and_the_environment`, `climate_and_health`, `housing_and_health`, `outdoor_air_and_health`.

### Nothing else loses a library it uses

The gating refactor stops 402 of the 1397 pages loading at least one library. To find which of those
actually use one, per-page "library global referenced" was diffed against "library asset loaded"
across both builds — inline `<script>` blocks plus every page-owned `.js` file in the output (2417
files on the merge build), for nine libraries: Leaflet, easyButton, Vega, d3, Arquero, DataTables,
uhflist, TopoJSON, flexdatalist.

New findings on `merge/production` against `production`: **8, all `uhflist`.** Five are the
topiclanding pages above. Three are false positives, each read individually — `congestion-pricing-report`
matches the word "neighborhoods" in prose strings, `find-your-uhf` in a `console.log` label, and
`nyccas` inside an HTML string. No page loses a Leaflet, Vega, d3, Arquero, DataTables, TopoJSON or
easyButton it uses.

`L.colorIcon` is not in that pattern set, so it was checked separately: all six pages referencing
`colorIcon` or `easyButton` load the plugin `[verified 2026-08-19: 2 matching asset loads per page
across all six]`.

**Instrument caveats, since most of that result is a null.** The probe's positive control is the
topiclanding page, which it flags and which the browser independently confirms. Its first run
scanned **zero** page-owned JS files, because Git Bash rewrote the `/IndicatorPublic/` URL-prefix
argument into a Windows path and every prefix test failed silently — caught only by a scanned-files
counter, and fixed by passing the prefix through an environment variable. It covers the nine named
globals and cannot see dynamically constructed references. The sweep script was ad hoc and is not
committed; the method above is enough to rebuild it.

A name-based comparison of loaded assets is **not** a reliable signal on its own here: the Vega
bundle is renamed `vegaBundle.<hash>.js` → `lib-vega-bundle.<hash>.js` by this branch with the same
content hash, which reads as 223 pages "gaining" Vega.

## Things that land and need no action

- **`content/data-features/healthy-homes-info/source/index.html` is deleted** by `df7f0fbb6e`, whose
  subject is about taxonomy casing and does not mention it, and it has no `static/` counterpart —
  unlike the two `*_differences_leaflet.html` files deleted alongside it. The NR/DE plan flags this
  as unexplained. **It is safe:** the parent bundle is `draft: true`, nothing in the repo links to
  it, and `production`'s own build emits that directory empty
  `[verified 2026-08-19: find in the production build output returns the directory and no files;
  identical published HTML sets on both sides]`.
- **Three unused devDependencies arrive** — `axe-core`, `eslint`, `globals`. This branch has no
  `lint` script and no eslint config, and the prod workflow runs bare `npm install`, so they install
  on every deploy build without being used. Harmless; worth removing if nothing on `production` is
  going to consume them.
- `CLAUDE.md`, `.claude/settings.json` and two new `documents/` files land on `production`, which is
  how this repo already carries its records.

## What this memo does not cover

- Spanish and Chinese pages beyond the whole-site library sweep and the page-set comparison.
- Anything the smoke list does not reach at runtime. It loads 33 pages, one per template kind; the
  library sweep is static and covers all 1397.
- Both builds fetch EHDP-data at build time, so page counts can move without any change in this
  repo. Compare page-for-page rather than by count.

## Records the `8081` commit falsifies

`81ad0123e9` widened `PROBE_PORTS` to `[8080, 8081, 1313]`, which left three present-tense records
describing a two-port probe. **All three were corrected on 2026-08-20** and now read
":8080, :8081 or :1313":

- `CLAUDE.md` § Smoke test, the sentence describing what `dev-server.mjs` reuses.
- `documents/nr-de-merge-integration-plan-2026-08-15.md:927`, the surviving caveat under the retired
  bare-`smoke-pages.mjs` warning.
- `scripts/dev-server.mjs:99`, the Path 3 abort message — a runtime string a user reads when the
  harness refuses to spawn, so it misdirected at exactly the moment someone is debugging port
  resolution `[verified 2026-08-20: node --check scripts/dev-server.mjs → exit 0]`.

A fourth mention, in the same plan's 2026-08-18 blockquote at `:2166`, is a dated account of a past
session and stays as written.
