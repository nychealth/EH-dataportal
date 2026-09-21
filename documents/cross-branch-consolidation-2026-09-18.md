# Cross-branch consolidation (2026-09-18)

Several files drifted into per-branch copies where only one copy should exist. This collects the
divergences that are **branch-agnostic** — the ones every branch cut from `production` would want —
onto one branch and lands them through a single PR.

**Status as of 2026-09-18: all four steps DONE, on `documentation-consolidate-site-wide-audit`
(cut from `production` at `451b2df450`) as `6aba8861f0..7b4f67483b`. Whether they have been pushed
or opened as a PR is derived by the commands at the bottom of this file, not asserted here.**

## Scope, and what was deliberately left out

The survey compared every local branch against `production` over `.github/`, `.claude/`,
`scripts/` (excluding the characterization baselines), `package.json`, `.gitignore` and the
top-level READMEs, then filtered to files where a branch carries content `production` lacks.

Four things looked like candidates and are **not**:

- **`scripts/dev-server.mjs`** — reads as "3 branches ahead" by commit date, but the diff runs the
  other way. Those branches carry the older prose citing `d5fb2ea700`; `production` has the clearer
  replacement ("two builders share `resources/_gen` and corrupt each other's asset paths"). Commit
  date is not a substitute for reading the diff.
- **`package.json`, `scripts/nr-*.mjs`, `scripts/ndhr-*.mjs`, `scripts/pagefind-characterization.mjs`,
  `eslint.config.mjs`** — tooling for `assets/js/nr-report/` and `assets/js/ndhr-report/`, neither of
  which exists on `production`. They land when their own branches do.
- **`.claude/` in `.gitignore`** — 7 branches added it. **Decided against 2026-09-18 (user).**
  `feature-NDHR-prototype` and `feature-chart-coverage` deliberately track files under `.claude/`,
  and an ignore line would make adding more of those need `git add -f`.
- **`CLAUDE.md`** — 20 branches diverge. Out of scope this round by the user's call; a separate
  pass.

The six older copies of the site-wide audit (`feature-new-data-explorer`, `content-pesticides`,
`feature-upgrade-hugo`, `feature-site-characterization` and the two backups) are strictly behind
`production` in substance. Their apparent additions are superseded wordings — the retracted
"a single `eslint` pass would have caught most of the concrete bugs" paragraph, the "24 of 77
paths" figure `production`'s own preamble says not to quote, row 12 still pointing at
`data-explorer-old/`, row 15 before it was marked FIXED. Nothing to salvage from them.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | `.gitignore` — union of the four branch additions | `6aba8861f0` | **DONE 2026-09-18** | `git status --porcelain` before/after: all five untracked paths gone, no tracked file changed state, 0 CR bytes in 3406 |
| 2 | `documents/site-wide-audit-2026-06-27.md` — union of the two ahead copies | `d81a2ea548` | **DONE 2026-09-18** | `git diff` vs `production`'s blob: **+347, −0**. Vs `335b5872ba`: 0 removed / 82 added. Vs `5ca1a38569`: 0 removed / 116 added — matching the two sources' own 82/116 difference |
| 3 | `scripts/smoke-pages.mjs` — one `report.html` `js:` page; Mapbox noise entry **dropped** | `c4b1920350` | **DONE 2026-09-18** | `npm run smoke` **PASSED, 34 pages clean**, `Pagefind index: served` (201 pages, 3 languages). The dropped entry was checked by loading `/data-features/displacement-risk/` directly — see below |
| 4 | `.claude/commands/js-development.md` — port from `feature-NDHR-prototype` | `7b4f67483b` | **DONE 2026-09-18** | Committed blob is `a0a3e36a8d`, equal to `git ls-tree feature-NDHR-prototype -- .claude/commands/js-development.md` |
| 0 | This document | *the commit that added it* | **DONE 2026-09-18** | n/a — a record cannot cite the commit that carries it |

Nothing above says whether these have reached `origin` or `production`; run the commands at the
foot of this file for that.

### Step 1 — `.gitignore`

`production`'s copy is the newest on all but four branches. Take the union of what those four add,
minus `.claude/` (decided against, above):

- `scripts/ndhr-characterization-current/` — `feature-NDHR-prototype`, `update-rat-mitigation-report`
- `documents/NDHR/` (with its two-line comment) — same two branches
- `documents/Annual Rat Mitigation Report 2026_08_31.docx` — `update-rat-mitigation-report`
- `scripts/rat-report-charts/current/` (with its comment) — same
- `documents/rat-report-2026-figures-to-confirm.docx` and `.html` (with its comment) — same
- drop the duplicated `# Playwright characterization --check output (baseline IS committed)`
  comment that `production` carries twice, before `documents/de-characterization-current/` and
  again before `scripts/de-characterization-current/`

Ignoring paths `production` cannot itself produce has precedent in the file: it already ignores
`scripts/nr-characterization-current/` while carrying no `scripts/nr-characterization.mjs`.

Three of these paths are untracked in the working tree of this checkout right now.

**Proof:** `git status --porcelain` before and after — the three untracked entries
(`documents/NDHR/`, `scripts/ndhr-characterization-current/`, `scripts/rat-report-charts/`)
disappear and nothing tracked changes state.

### Step 2 — site-wide audit

`production`'s copy is the base (2373 lines). Two branches are ahead, and **neither is a superset of
the other**:

| Copy | Blob | vs `production` |
|---|---|---|
| `feature-NDHR-prototype` | `335b5872ba` | +189 lines, **0 removed** — §17 (+17a-17d) and a 2026-09-12 note in §15.8 |
| `feature-MOD-Lab-NR-recode-refactor-merge` | `5ca1a38569` | +155 lines, **0 removed** — §18a and §19a (the 2026-09-15 FIXED write-ups) |

Both carry §18 and §19 identically; only the NR-recode copy has `18a`/`19a`. The union is
`production` + the §15.8 note + §17 + (§18, §18a, §19, §19a), in section order.

**Two things the union needs beyond a concatenation:**

1. The preamble's count — "19 of the 84 checkable repo paths it cites do not exist here", re-derived
   2026-08-21 — is falsified by adding §17-§19, which cite `assets/js/nr-report/`,
   `assets/js/ndhr-report/` and `partials/ndhr-*.html`, none of which exist on `production`
   (`git ls-tree -r production -- assets/js/nr-report` is empty). Mark the figure as pre-dating
   these sections rather than re-deriving it; re-deriving needs the extraction rule that produced
   the 84, and that rule survives in the preamble only as prose.
2. §17's opening paragraph and §17a's second bullet describe a tree with `lib-topojson.html` and
   `ndhr-leaflet.html`. Both are NDHR-branch files. The document's existing convention covers this
   ("Findings describe the branch they were found on unless a line says otherwise") — no rewrite,
   but the new sections should be reachable as branch records, not read as `production` facts.

**Proof:** section headings `## 1` through `## 19` present and in order; a line-level diff of the
result against `production`'s blob shows additions only, zero removals, and every added line
traces to one of the two source copies.

### Step 3 — `scripts/smoke-pages.mjs`

Scoped as two pieces; **one was dropped after measurement, and measuring it turned up a finding
that points the other way.**

- **DROPPED — the second `displacement-risk` `KNOWN_NOISE` entry** (matching `events.mapbox.com`
  and `api.mapbox.com`), from `feature-NDHR-prototype`. It was written 2026-09-12 against Mapbox
  calls carrying the literal placeholder `access_token=no-token`. **That failure no longer
  reproduces, and neither does the CARTO one `production` already allowlists.**

  `[verified 2026-09-18: `/data-features/displacement-risk/` loaded in Chromium against a
  `dev_stage` server on :8080, console and network read. Every CARTO call carries
  `api_key=default_public` and returns 200 or 204 — no `Unauthorized access to Maps API`. Every
  Mapbox call carries a real `access_token=pk.eyJ1...`, not the placeholder:
  `events.mapbox.com/events/v2` → 204 (x2), `api.mapbox.com/map-sessions/v1` → 200. The embed's
  origin emitted 2 warnings and 0 errors.]`

  **Capture control:** the two warnings came from
  `equitableexplorer.planning.nyc.gov/_next/static/chunks/...`, so that cross-origin frame's
  console does reach the parent's — the absence of errors is an absence, not a capture failure.

  **What this is not.** One load, one moment, one IP. It does not prove the vendor's failure is
  permanently gone, only that it did not occur here today, six days after the NDHR branch saw it.
  Adding an allowlist entry for a failure that cannot be reproduced is the opposite of the
  "allowlist should trend to zero" rule in CLAUDE.md, so the entry was not ported.

  **Consequence for `production`, not actioned here.** The existing CARTO entry at
  `smoke-pages.mjs:107` now appears inert, and its own comment says "Remove this when the embed
  loads again." Removing it is a separate decision with its own risk — if the vendor flaps back,
  CI goes red — and `hotfix-smoke-displacement-risk-maps-key` is the branch that owns it. Flagged,
  not removed.

- **KEPT — one `PAGES` entry** — `data-features/rat-report/`. It is the only page on `production` that
  reaches `report.html:55-56`'s `<script src="{{ .Params.js }}">` branch, and `PAGES` did not cover
  it.

  **This was scoped as two entries and is one.** `content/data-features/rat-report/2024/index.md`
  also carries `layout: report` and `js: rat-report.js` — 5 pages on `production` carry a `js:`
  frontmatter key, 2 of them `layout: report` `[verified 2026-09-18: one walk of `production`'s
  `content/`]` — but **it is not published**. It is a nested `index.md` inside a leaf bundle, which
  Hugo serves as a page resource rather than a page: `/data-features/rat-report/2024/` and
  `/2023/` both answer **404** `[verified 2026-09-18: `curl -o /dev/null -w '%{http_code}'` against
  a `dev_stage` server on :8080; `/data-features/rat-report/` answers 200 and
  `/data-features/rat-report/rat-report.js` answers 200, so the probe can return a 200 and the 404s
  are the pages' own]`. This is the hazard `memories/repo/page-bundle-publication.md` records.
  `update-rat-mitigation-report` already fixes it — that branch moved both years to
  `content/data-features/rat-report-archive/` and deleted the nested copies — so it lands with that
  branch and needs nothing here.

The rat branch's own comment names three such pages and the NDHR branch adds `ndhr/` entries; both
are branch-local and were not copied verbatim. The comment was rewritten for what `production` has.

**Proof:** `npm run smoke` — **PASSED, 34 pages clean** (the curated 33 plus `rat-report/`), zero
unallowlisted console errors, against a `dev_stage` server on :8080 with Pagefind built into it
(`Pagefind index: served`; `npx -y pagefind --site docs` indexed 201 pages, 3 languages — a
non-degenerate index, so the conditional Pagefind allowlist entry was inactive and `PagefindUI`
was genuinely under test). The new page is the point of the change, so a curated run covers it and
`smoke:all` was not needed.

`displacement-risk` is **not** in the curated `PAGES` list, which is why the entry above had to be
checked by loading that page directly rather than by reading a green smoke run — a smoke pass here
says nothing about it either way.

### Step 4 — `.claude/commands/js-development.md`

Absent from `production`, present on 6 branches from one lineage. Port
`feature-NDHR-prototype`'s copy. **Decided 2026-09-18 (user)**, against leaving it branch-local.

**Proof:** the committed blob hash equals
`git rev-parse feature-NDHR-prototype:.claude/commands/js-development.md` — a byte-identical port,
not a transcription.

## Next commands

```bash
git rev-parse --abbrev-ref HEAD          # expect documentation-consolidate-site-wide-audit
git log --oneline production..HEAD       # the consolidation commits
git rev-list --left-right --count origin/documentation-consolidate-site-wide-audit...HEAD
                                         # 0 0 means pushed; a missing upstream means never pushed
gh pr list --head documentation-consolidate-site-wide-audit   # a PR, and against which base
```

## What is left

1. ~~**Open the PR into `production`.**~~ **PR #1500**, opened 2026-09-19 against `production`
   from `5771b1c049`. Its current state is not recorded here — run
   `gh pr view 1500 --json state,mergeStateStatus`.
2. **Decide the CARTO allowlist entry** at `scripts/smoke-pages.mjs:107`, per the §3 finding above.
   Not this branch's to make — `hotfix-smoke-displacement-risk-maps-key` owns it.

Nothing else in this document is outstanding.

### CI on `5771b1c049`

Both PR workflows ran. **Smoke check: passed.** **Site characterization check: failed, and the
failure is not this branch's** — the `base-control` job rebuilt `production`'s tip
(`451b2df450`) and ran the same harness against the same baseline, and its field table is
identical to the sweep's: 5 of 925 pages, `structure.links.internal` on 4 (`(home)` 110 → 114,
`data-explorer/` 224 → 228, `es/` and `zh/` 84 → 88) and `structure.controls.input` on 1
(`data-explorer/air-quality/` 26 → 27). Both fields are ones the harness names as EHDP-data's to
move, and the run reports EHDP-data at `c03ccd89fb -> 3b5e6257ca` since the baseline was captured
at `156693a99b` (2026-08-27). A field moving in both runs is the data; one moving only in the
sweep would be this PR's, and there is none.

The `production` baseline is therefore stale against today's EHDP-data, which is a `production`
problem and not one this branch can fix by merging. Both runs also printed `89 page(s) differ from
the baseline — past the 25-page arbitration cap`; that is the pre-gate capture count, of which the
structure-only gate reports the 5 above.

## Environment state left behind

None. Two `hugo server --environment dev_stage -p 8080` instances were started and both stopped
(`Get-CimInstance Win32_Process -Filter "Name='hugo.exe'"` returns 0, port 8080 free). The second
was started with `--cleanDestinationDir`, which wiped the Pagefind index built into `docs/` for the
smoke run — so `docs/` currently has no `pagefind/` directory, and a later harness run that needs
one must rebuild it with `npx -y pagefind --site docs`. `docs/` is git-ignored, so nothing tracked
is affected.
