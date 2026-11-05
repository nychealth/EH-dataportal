# R7: port the rat report archive fix to production (2026-11-02)

Closes N-083 of `documents/site-wide-audit-2026-10.md` (batch R7) ahead of the
`update-rat-mitigation-report` branch, which is still being worked on. Branch
`feature-audit-r7-rat-archive`, cut from the local `production` at `dd1251ca46` (level with
`origin/production`; no upstream set). This document is the plan and the ledger.

## Decisions

- **A port of `0122a3c4e4`, not a cherry-pick** (Chris, 2026-11-02). That commit moves
  `rat-report/{2023,2024,2025}/index.md` into a new `rat-report-archive/` bundle whose `_index.md`
  sets `build: {list: never, render: never}` (the `heat-report-archive/` pattern), and adds a
  `rat-report.js` beside 2024 and 2025. `2025/` exists only on the rat branch, so the port takes
  everything else: the 2023 and 2024 moves, `2024/rat-report.js`, `_index.md`. Each file is taken
  byte-for-byte from `0122a3c4e4`, and no later commit on the rat branch touches
  `rat-report-archive/` (`git log 0122a3c4e4..origin/update-rat-mitigation-report --
  content/data-features/rat-report-archive/` is empty), so when that branch merges `production`
  both sides hold the same renames and blobs.
- **N-012 stays with the rat branch** (Chris, 2026-11-02). The branch's fix renumbers the metrics
  list for the 2026 report (Susceptibility becomes item V, 311 item VI), which would misnumber
  production's 2025 page, whose sections run I–V. A production-only nesting fix would conflict with
  the branch's rewrite of the same block.
- **`hide: true` on both archive pages** (Chris, 2026-11-02), the one departure from
  `0122a3c4e4`'s bytes. `key-topics/single.html` lists a topic's `report: true` pages "except those
  with 'hide'"; every `heat-report-archive/` year sets it, so `key-topics/climatehealth/` shows only
  the current heat report. Ported byte-for-byte, `key-topics/pests/` gained the 2023 and 2024
  reports beside the current one. The rat branch's archives, its 2025 one included, do not set it.
  `hide` is also read by `data-features/section.html`, `key-topics/section.html` and both header
  partials, but on this site it moves only `key-topics/pests/` `[verified 2026-11-02: isolated
  prod_prod builds of the port without and with hide differ in 4 files, key-topics/pests/ and the
  three home pages, whose only changed line is build_datetime]`. The categories and keywords
  listings still include the archives, as they include the heat archives.
- Not ported: the links to the archive pages, which come with the branch's page rewrite
  (`c73fd0451c`). After this port the two pages build and are in the sitemap, but production's
  report does not link to them.

## Ledger

| Task | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | reproduce N-083 on `dd1251ca46` | *no commit* (measurement) | **DONE 2026-11-02** | isolated `prod_prod` build of `dd1251ca46` (the one R1 Part 2 took): `rat-report/{2023,2024}` and `rat-report-archive/{2023,2024}` all absent; control `heat-report-archive/2021/index.html` present; en sitemap 735 `<loc>` |
| 1 | port the archive bundle | `ebdaf79fa7` | **DONE 2026-11-02** | the four files' blobs equal `0122a3c4e4`'s (`git rev-parse` against `git hash-object`). Isolated `prod_prod` build: exit 0, 0 ERROR; `rat-report-archive/2023/` and `2024/` present, `rat-report-archive/index.html` absent, old paths absent, control present; en sitemap 737, the two new entries the archive URLs. Every local `src`/`href` on both pages resolves in the build except Pagefind's two files (built after Hugo) and 2024's `/IndicatorPublic/Rats/` link, which is the rat portal outside Hugo: `curl -L` 200 on the live site, 2026-11-02 |
| 2 | characterization, smoke; re-baseline if pages are added | re-baseline `f5d406cfb8` | **DONE 2026-11-02** | `node scripts/site-characterization-rebaseline.mjs --expect "data-features/rat-report-archive/**" --expect "categories/pests/**" --expect "keywords/pests/**"` at `ebdaf79fa7`: "Nothing unexplained" on `prod_prod` and `staging`, 926 pages each. `git diff -U0` tallied by line: the archive pages' titles, URLs and heading levels, `internal` +2 on page 2 of both listings, `pages` 924 → 926, provenance; page 1 of both listings trades Asthma for the 2024 report, since the listings sort by date. `key-topics/pests/` did not move. 14 files, +588 −24. Earlier, on the port before `hide`: `node scripts/smoke-env.mjs prod_prod` PASSED, 1189 pages (1187 + the two archives); two explorer pages failed under concurrency with `net::ERR_NETWORK_CHANGED` and were clean on the sequential re-check. `node scripts/characterize-env.mjs prod_prod` FAILED as predicted, 5 of 926: the two archive pages new, and `categories/pests/page/2/`, `keywords/pests/page/2/` and `key-topics/pests/` each changed in `links.internal` and `headingLevels` (internal links 68 → 70 and 65 → 67 on the first two). `hide` then returns `key-topics/pests/` to its base build (build diff above). Smoke was not re-run after `hide`: the build diff shows it changed no other page |
| 2b | the rat branch can still merge `production` | *no commit* (measurement) | **DONE 2026-11-02** | `git merge-tree --write-tree origin/update-rat-mitigation-report ebdaf79fa7`: no conflict under `content/data-features/`; the merged tree holds the port's 2023 and 2024 blobs (with `hide`), `_index.md` and `2024/rat-report.js` equal to both sides, the branch's `2025/index.md`, and neither old path. It conflicts in `.gitignore`, `CLAUDE.md` and `scripts/smoke-pages.mjs`, and so does the control, the same merge against `dd1251ca46`: those conflicts predate the port |
| 3 | close N-083 in the audit | the ledger commit after `54d475947a` | **DONE 2026-11-02** | `feature-audit-r1-dialog-header-lang` (#1539) merged in first at `54d475947a`, since both edit the audit's count table; the row FIXED; recount of every `A-`/`N-` row's Status and Priority reproduced the parent's table (OPEN 4/47/132/2 = 185), then read OPEN 3/47/132/2 = 184, FIXED 279, matching the edited table; Roadmap P1+P2 51 → 50, R7 moved to the 0/0 rows |

Closed 2026-11-02: N-083 FIXED by `ebdaf79fa7`, re-baseline `f5d406cfb8`, on
`feature-audit-r7-rat-archive` (`dd1251ca46..f5d406cfb8`, then R1's branch merged at `54d475947a`
and the ledger commit after it). Next: a PR into `production`. Until #1539 merges, that PR also
shows R1's two commits.

```
git rev-parse --abbrev-ref HEAD                   # feature-audit-r7-rat-archive
git log --oneline --first-parent dd1251ca46..HEAD # port, re-baseline, R1 merge, ledger
gh pr list --head feature-audit-r7-rat-archive    # this branch's PR into production
gh pr view 1539 --json state                      # R1; once MERGED, this PR's diff is R7 alone
```

For the rat branch, when it next merges `production`: the archive files arrive with no conflict, and
its 2025 archive page wants `hide: true` too.

Instrument: an isolated `prod_prod` build (`HUGO_RESOURCEDIR` and `-d` in temp) before and after:
whether `data-features/rat-report-archive/{2023,2024}/index.html` and the old
`data-features/rat-report/{2023,2024}/index.html` exist, the sitemap's `<loc>` count, and that
`rat-report-archive/index.html` is not emitted. Control: `data-features/heat-report-archive/2021/index.html`
present in both builds (the row's own control).

## Part 2: N-012 on production (2026-11-02)

Reverses the decision above to leave N-012 with the rat branch (Chris, 2026-11-02). Branch
`feature-audit-r4-rat-list`, cut from the local `feature-audit-r7-rat-archive` at `127315cca0`
(stacked on #1540, for the audit's count table; no upstream set).

The stray line in `content/data-features/rat-report/index.md`'s `<ol type="I">` ("a.
Susceptibility to rat infestation") becomes an `<ol type="a"><li>` nested in item IV. Production's
page treats it as IV's sub-item: the body has "IV. City agency referral letters" with "a.
Susceptibility to rat infestation" under it. The rat branch rewrote this block for 2026 (the item
becomes V), so its next merge of `production` conflicts here once; keep the branch's side.

| Task | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | reproduce: axe `list` on `data-features/rat-report/` | *no commit* (measurement) | **DONE 2026-11-02** | on `127315cca0`: axe 4.13.0, positive control FIRED, rendered-content control passed, `list` [serious] 1 page / 1 node |
| 1 | nest the item | `b919421eed` | **DONE 2026-11-02** | same run on the edit: `list` gone, no WCAG violation on the page; the served build held `<ol type="a">` and not the stray line (grep of the isolated build's page; the harness labels the tree with `HEAD`, not the working tree). Rendered list, before (`ebdaf79fa7`'s build) and after, 1280px, screenshots compared: item IV keeps "a. Susceptibility…" beneath it, its marker now `lower-alpha` from the nested list instead of literal text, and its wrapped lines now hang under the text; the other five items unchanged |
| 2 | characterization; smoke | *no commit*: no baseline moved | **DONE 2026-11-02** | `node scripts/characterize-env.mjs prod_prod`: PASSED against the baseline captured at `ebdaf79fa7`. Smoke not run: the change is list markup in content and adds no script, and smoke fails only on JavaScript errors |
| 2b | the rat branch's merge of `production` | *no commit* (measurement) | **DONE 2026-11-02** | `git merge-tree --write-tree origin/update-rat-mitigation-report b919421eed` conflicts in `content/data-features/rat-report/index.md` as expected, beside the three that predate this work (Part 1, Task 2b) |
| 3 | close N-012 in the audit | the ledger commit after `b919421eed` | **DONE 2026-11-02** | the row FIXED; the recount reproduced the parent's table (OPEN 3/47/132/2 = 184), then read OPEN 2/47/132/2 = 183, FIXED 280, matching the edited table; Roadmap P1+P2 50 → 49, R4 moved to the 0/0 rows, the R7 note's N-012 sentence updated |

Closed 2026-11-02: N-012 FIXED by `b919421eed` on `feature-audit-r4-rat-list`, stacked on #1540
(`127315cca0..b919421eed` plus the ledger commit after it). Next: push and a PR into `production`,
which shows #1539's and #1540's commits until they merge.

```
git rev-parse --abbrev-ref HEAD                 # feature-audit-r4-rat-list
git log --oneline 127315cca0..HEAD              # the fix and the ledger commit
gh pr list --head feature-audit-r4-rat-list     # this branch's PR into production
```

Instrument: `A11Y_PAGES=data-features/rat-report/ node scripts/site-a11y-audit.mjs prod_prod`
(positive and rendered-content controls built in), before and after.
