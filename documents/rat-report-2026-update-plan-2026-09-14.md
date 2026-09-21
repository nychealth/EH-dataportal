# Rat Mitigation Zone Report — 2026 update plan

**Branch:** `update-rat-mitigation-report`
**Source document:** `documents/Annual Rat Mitigation Report 2026_08_31.docx` (gitignored at `5a60a06b27`; keep it out of the repo)
**Target page:** `content/data-features/rat-report/index.md` → `/data-features/rat-report/`
**Written:** 2026-09-14

The report covers **January 2026 to June 2026**, the seventh 6-month round since Local Law 110.
The page currently holds the January–June 2025 report.

---

## Status

**Status as of 2026-09-14:** tasks 0, 1, 1a, 2 and 4 are closed. **Task 3 is the only thing left,
and it is the only thing gating publication:** the 32 charts have to be produced before the page
can ship, and its re-run of task 4 follows.

**Amended 2026-09-17:** Task 3 now specifies *how* the 32 charts get produced — the Datawrapper v3
API, driven by `scripts/rat-report-charts.mjs`, rather than 32 rounds of the UI. That does not
unblock it. Two things still gate it and neither is in this repo: the 2026 numbers, which exist
only in the docx, and a Datawrapper API token. See Task 3's "How the 32 charts get produced". The
script is written and committed at `47d637cf3d`; what has been run against it is recorded
under Task 3's
"What has been run against the script" — offline checks only, no API verb exercised.

**Amended 2026-09-17, later the same day — both gates named above have been cleared, and Task 3 is
no longer BLOCKED.** A token was created and used; `pull`, `push` and a new `repush` verb have all
run against the live API. The 32 `next/*.csv` exist and are committed at `df70bdf265`. **1 of 32
slots is pushed and published** (`table-2-1` → `zVvyR`), the other 31 are not, and `apply` has
never run — `index.md` still carries all 32 TODO markers and all 32 2025 embed IDs. What now
gates the remaining 31 is a *partner answer*, not credentials: see
`documents/rat-report-2026-figures-to-confirm.md`. Detail and proofs under Task 3's
"The push run: state as of 2026-09-17".

**Amended 2026-09-18 — a 2026 folder tree exists in the live Datawrapper account, and the one
pushed chart is filed in it.** `c2840dfbd0` carries three new verbs in
`scripts/rat-report-charts.mjs` (`folders`, `makefolders`, `move`, +301 lines) and
`scripts/rat-report-charts/folder-map.json`, which holds the ten folder ids `makefolders` created
against the live API on 2026-09-18 — a side effect `git checkout` does not undo. **`move` then ran
on `table-2-1` and is no longer unexercised**: `zVvyR` moved from `363786` to `443569`, and the
rewritten `chart-map.json` is at `b16c041ab6`. Rows and proofs below, under "Filing the 2026
charts". The remaining 31 pushes are still blocked on the partner's answer; nothing in this
amendment changes that.

**Amended 2026-09-21 — the partner answered, and the 31 pushes are no longer blocked.** Their reply
covers all 31 rows of `documents/rat-report-2026-figures-to-confirm.md` and confirms the 2026
document in both groups, which is what the document's stated default already assumed:

- **The 27 `table-33-*` rows are a methodology change**, and their report carries an appendix note
  for it: initial counts in 2024 and 2025 removed inspections at properties the Department marked
  city-owned, or that an inspector noted as government properties, and that restriction was
  dropped because ownership changes over time.
- **The 4 `slot1` rows are NYCHA developments converting to RAD or private management**, mostly
  during fiscal year 2026 (Jul 2025–Jun 2026). The 2026 figures are the developments still managed
  by NYCHA and routinely surveyed by DOHMH as of June 2026. No appendix note exists for this and
  the partner asked whether one should be added.

**Their Table 3a note does not describe what the numbers do, and that is worth raising before the
note is final.** It says inspections were *removed from the counts*, which predicts the revised
counts rising. They do not move: in all 8 zone-periods the `Inspections` total is identical in
`scripts/rat-report-charts/published/table-33-*.tsv` and `next/table-33-*.csv` (3524, 3448, 2621,
2372, 919, 904, 3975, 3816), the four elevation-level counts sum to it in both, and every group's
level changes net to exactly zero — first comp falls and the higher levels rise by the same amount
`[verified 2026-09-21, read off the two CSV sets rather than off the difference list, which holds
only cells that differ and so never showed the unchanged total]`. A change to how a property's
*prior* compliance history is counted would produce this; a change to which inspections are counted
would not. Unverified — it is the partner's to confirm.

**Two questions in that document are still unanswered**: the "since the 2024 report" wording (see
Task 2 Step 4) and the offer to fix the duplicated column headings in `table-5a-5` and the
`table-33-*` group.

| Task | State | Proof that ran |
|---|---|---|
| 0. Send numeric discrepancies to partner | **DONE 2026-09-14** — `c73fd0451c` — partner confirmed the tables were right; all five prose figures corrected | each figure re-derived before writing; verified in the rendered HTML, each new figure n=1 and each old one n=0 |
| 1. Archive the 2025 report to `2025/` | **DONE 2026-09-14** — `6020832f59` | `cmp` exit 0; both 48,992 bytes / 404 lines |
| 1a. Publish the archives (Decision D2) | **DONE 2026-09-14** — `0122a3c4e4` | isolated build exit 0, 0 ERROR; 3 archive `index.html` in the output where there were none; en sitemap 736 → 739 `<loc>` |
| 2. Rewrite `index.md` body from the docx | **DONE 2026-09-14** — `6b2055b407` | isolated build exit 0, 0 ERROR, 1206 EN pages; 4 id sets identical to the archived 2025 copy (29 buttons, 34 panels, 37 embeds, 29 `changeTable` calls), control: the 2025 title string differs |
| 3. Swap in the 2026 chart embeds | **IN PROGRESS — 1 of 32 slots pushed** (`table-2-1` → `zVvyR` v2, live). The other 31 are **UNBLOCKED as of 2026-09-21** — the partner answered `documents/rat-report-2026-figures-to-confirm.md` and confirmed the 2026 figures; see the 2026-09-21 amendment. Nothing gates them but running the commands. `apply` has not run. The `repush` verb is at `119207fa01`, `chart-map.json` and the `#1` title edit at `f5ea98079b`, the figures-to-confirm document at `efcace7a59`. The `folders` / `makefolders` / `move` verbs and `folder-map.json` are at `c2840dfbd0`; `makefolders` and `move` have both run against the live API, and the rewritten `chart-map.json` is at `b16c041ab6` | the pushed chart's live dataset at `dwcdn.net/zVvyR/2/dataset.csv` is byte-identical to `next/table-2-1.csv`, 7 rows `[verified 2026-09-17]`; earlier offline proofs unchanged — 32 TODO markers each one line above a live embed, 0 orphaned and 0 uncovered |
| 4. Build + smoke + interaction check | build, smoke and the interaction check all **DONE 2026-09-14** — smoke list `120dbcd8d9`; re-run after task 3, which edits the same file | see Task 4 |

Update this table in the same commit as the work it describes. Name the commit hash once it
exists; never write "done, uncommitted" here.

### Deriving what this table deliberately does not claim

A DONE row is a fact about its commit and nothing downstream of it. Run these rather than reading
a status phrase:

```
git log --oneline 9344ce458a..HEAD                              # the task commits
git ls-remote origin refs/heads/update-rat-mitigation-report    # pushed 2026-09-15; empty output means it is gone again
git rev-list --left-right --count origin/update-rat-mitigation-report...HEAD   # 0 0 means in sync
gh pr list --head update-rat-mitigation-report                  # a PR, and against which base
git merge-base --is-ancestor 6b2055b407 production              # exit 0 means it reached production
```

### Environment

- No server was started. Builds went to a scratchpad directory via `HUGO_RESOURCEDIR` and `-d`;
  `docs/` does not exist in this worktree and `resources/_gen` was untouched.
- The source document sits at `cgettings-EHDP-work/documents/Rat report/Annual Rat Mitigation
  Report 2026_08_31.docx`, outside this repo, 132,140 bytes `[corrected 2026-09-17; it is not in
  `documents/` in this tree, and the worktree this section used to name no longer exists -- the
  branch is checked out in the primary tree]`. It was previously gitignored
  at `5a60a06b27`. It is on disk in this worktree; a fresh clone will not have it.
- Worktree: none. The branch is checked out in the primary tree,
  `C:/Users/Chris/Documents/DOHMH/Programming/EH-dataportal` `[corrected 2026-09-18; this line
  previously named `EH-dataportal.worktrees/update-rat-mitigation-report`, contradicting the
  2026-09-17 correction two bullets above it]`.
- **The Datawrapper token is not in this repo, but it does persist on this machine** as a
  **User-scope Windows environment variable**, 64 characters `[verified 2026-09-18]`. A new shell
  does not inherit it into the process — `$env:DATAWRAPPER_TOKEN` and the Bash `$DATAWRAPPER_TOKEN`
  both read empty — so every run has to lift it first. This line is what every run since
  2026-09-17 has opened with:

  ```powershell
  $env:DATAWRAPPER_TOKEN = [Environment]::GetEnvironmentVariable('DATAWRAPPER_TOKEN','User')
  ```

  `[corrected 2026-09-18; this bullet previously read "not in any shell this document can reach",
  which sent a resuming session looking for a token it already had.]` Every API verb exits 2
  naming the variable when it is unset.
- **A `Rat Report 2026` folder tree exists in the live Datawrapper account**, created 2026-09-18
  03:12Z by `makefolders 214216 2026`. Nothing in git created it and nothing in git can remove it.
  Parent is `Rat Report` (`214216`) in team `KeHyhPba`, the same parent as `Rat Report 2024`
  (`278908`) and `Rat Report 2025` (`363784`).

  ```
  Rat Report 2026 (443568)   <- slot #1 sits in the year folder itself
    Table 2 (443569)   Table 4  (443572)   Table 5a (443575)
    Table 3 (443570)   Table 4a (443573)   Table 6  (443576)
    Table 3a (443571)  Table 5  (443574)   Table 6a (443577)
  ```

  All ten printed `created`, so the run made them rather than matching existing ones. **`makefolders`
  is idempotent, and that is a run rather than a claim in a comment** `[verified 2026-09-18:
  immediately re-run against the same parent — 10 of 10 printed "already there, reusing", 0
  created, and the ids were identical]`. `scripts/rat-report-charts/folder-map.json` maps all 32
  slots onto those ten ids, and is committed with the verbs at `c2840dfbd0`.
- **`scripts/rat-report-charts/chart-map.json` is not gitignored**
  `[verified 2026-09-17: `git check-ignore -v` names only `current/`]`. It is the only record of
  which 2026 chart belongs to which slot, and losing it orphans every chart pushed so far, so it
  was committed at `f5ea98079b`. It is rewritten by every `push`, `repush` and `move`; commit it
  again with the run that changes it.

---

## What the page actually is

`layout: report` → `themes/dohmh/layouts/data-features/report.html`. That layout renders
`.Content` inside a Bootstrap column and, at its end, emits `<script src="{{ .Params.js }}">`
for the bundle-relative `rat-report.js`. There is no fingerprinting or SRI on that script — it is
loaded by bundle path, unlike `assets/js/`.

`rat-report.js` contains one function, `changeTable(table, zone)`. It toggles an `active` class
across `.table{N}Buttons` and a `hide` class across `.table{N}tables`, then unhides
`#table-{N}-{zone}`. Every zone switcher on the page runs through it. Do not change it.

**Every table on the page is a Datawrapper embed, not markup.** `index.md` holds 37 embed IDs;
5 of them sit inside the commented-out "old by buttons incase needed?" block at lines 198–232,
leaving **32 live embeds**.

None of the 32 is shared with an archive page
`[verified 2026-09-14: comm -12 over sorted unique datawrapper-vis-* IDs — current index.md vs
2024/index.md returns 5, and all 5 (9PTUy, wlmWL, eYNEV, 65T5P, NeIGz) resolve to lines 207–222,
inside the comment block; vs 2023/index.md returns 0, and 2023/index.md contains 0 embeds
total. Control: the same comm against index.md itself returns all 37.]`

That matters: the 2024 update created new charts rather than editing existing ones, which is what
keeps archived pages frozen at their published numbers. Editing a chart in place would rewrite the
2025 archive after Task 1 copies this page into `2025/`.

### The 32 live embed slots

**Line numbers are against `index.md` as of `07549883c0`, the last commit to touch that file.**
They were re-derived 2026-09-15, because the numbers this table originally carried were
`5a60a06b27`'s and Task 2 rewrote the body at `6b2055b407` — every row had moved by 2 to 33 lines,
and so had the commented-out block, which is now at 216–244 rather than 198–232. The IDs and panel
ids did not move: all 32 were identical, in the same order.

**The `Slot` column is what the Task 3 proof command prints.** Panel ids and button ids are what
`changeTable()` matches on — preserve both. The three stand-alone tables have no switcher and so no
panel id; they are named by ordinal position in the file, which is what makes the whole table
diffable against that command's output.

| Line | Table | Slot | Current ID | Zone (button label) |
|---|---|---|---|---|
| 75 | 1 | `#1` | `EfIky` | single table |
| 108 | 2 | `table-2-1` | `bMzMo` | BX: Grand Concourse |
| 112 | 2 | `table-2-2` | `LAaPy` | MN: Harlem |
| 116 | 2 | `table-2-3` | `mVQJR` | MN: EV / Chinatown |
| 119 | 2 | `table-2-4` | `DKVEV` | BK: Bed-Stuy/Bushwick |
| 123 | 2 | `table-2-5` | `9i7xg` | Totals |
| 145 | 3 | `table-3-1` | `jaV7S` | BX: Grand Concourse |
| 149 | 3 | `table-3-2` | `PaKDr` | MN: Harlem |
| 153 | 3 | `table-3-3` | `pCGDW` | MN: EV / Chinatown |
| 157 | 3 | `table-3-4` | `f4qkK` | BK: Bed-Stuy/Bushwick |
| 160 | 3 | `table-3-5` | `szLTu` | Totals |
| 179 | 3a | `table-33-1` | `A4dTB` | BX: Grand Concourse |
| 183 | 3a | `table-33-2` | `ol6ho` | MN: Harlem |
| 187 | 3a | `table-33-3` | `JJRpq` | MN: EV / Chinatown |
| 191 | 3a | `table-33-4` | `18Wbr` | BK: Bed-Stuy/Bushwick |
| 206 | 4 | `#16` | `sPNQu` | pest management visits, all zones |
| 212 | 4a | `#17` | `KhvBm` | stoppage visits, all zones |
| 265 | 5 | `table-5-1` | `UqEDs` | BX: Grand Concourse |
| 270 | 5 | `table-5-2` | `Jm1m0` | MN: Harlem |
| 275 | 5 | `table-5-3` | `Lyets` | MN: EV / Chinatown |
| 280 | 5 | `table-5-4` | `RBGAy` | BK: Bed-Stuy/Bushwick |
| 284 | 5 | `table-5-5` | `9qR8g` | Totals |
| 306 | 5a | `table-5a-1` | `VIJdM` | BX: Grand Concourse |
| 311 | 5a | `table-5a-2` | `NwWcR` | MN: Harlem |
| 316 | 5a | `table-5a-3` | `2AJd4` | MN: EV / Chinatown |
| 321 | 5a | `table-5a-4` | `qx7lH` | BK: Bed-Stuy/Bushwick |
| 325 | 5a | `table-5a-5` | `glCLq` | Totals |
| 346 | 6 | `table-6-1` | `5Lv5f` | BX: Grand Concourse |
| 351 | 6 | `table-6-2` | `eEaFz` | MN: Harlem |
| 356 | 6 | `table-6-3` | `BXHue` | MN: EV / Chinatown |
| 361 | 6 | `table-6-4` | `FgeCo` | BK: Bed-Stuy/Bushwick |
| 365 | 6 | `table-6-5` | `HIVhB` | Totals |

Table 5a's buttons call `changeTable('5a', n)` — a quoted string where every other switcher passes
a bare number, and Table 3a's pass `33`. Any pattern written against the numeric form will miss
those five slots without erroring.

Note the id inconsistency in the Table 3a set: buttons are `33-1`…`33-4` with classes
`table33Buttons` / `table33tables`, not `3a-*`. Leave it — renaming element ids is its own commit
and touches nothing this update needs.

### How the docx tables map onto those slots

The docx lays some tables out differently from the page, so the per-zone panels have to be
derived rather than copied:

- Docx Tables 1, 2, 3, 4, 4a, 5, 5a — one table with zone *columns* and a Total column. The page
  wants one panel per zone plus a Totals panel.
- Docx Table 3a — two tables, two zones each (Bronx+Brooklyn, then Harlem+EV/Chinatown). The page
  wants four panels and has no Totals panel; the docx supplies no total either. Consistent.
- Docx Table 6 — two tables, two zones each. Docx Table 6a is the citywide total, which is the
  page's `table-6-5` Totals panel. That roll-up already happened once: commit `6749b85850`
  ("roll up 6a into 6").

---

## Task 0: Send the numeric discrepancies to the partner — RESOLVED

**Resolved 2026-09-14: the partner confirmed the tables were correct, so all five prose figures
were corrected in `index.md` and the three `PENDING PARTNER CONFIRMATION` comments removed.**

| Where | Was | Now |
|---|---|---|
| COTA paragraph (§I) | 17% of **36,267** initial inspections | 38,267 — 6,571/38,267 = 17.17%, matching the 17% in the same sentence |
| Summons paragraph (§II) | **3,200 fewer** compliance inspections | 2,755 — 10,540 − 7,785 |
| 311 paragraph (§VI) | Harlem from **2,292** to **1,460** | 2,133 and 961 — the four component counts in that same sentence sum to exactly those two |
| Table 4 paragraph | approximately **2,500** fewer visits | approximately 2,800 — 9,704 − 6,919 = 2,785 |
| Table 3a paragraph | East Village/Chinatown **23%** | 24% — (125+53+38)/904 = 23.89% |

Verified in the rendered HTML rather than the source: each new figure appears and each old one
returns 0. The Rat Academy and community-event counts keep the source document's July 1, 2025 –
June 30, 2026 window, which its own comment [16] says was deliberate.

The original analysis follows, kept because it records how each figure was derived.


Three figures in the docx prose contradict the docx's own tables. The tables are internally
consistent — zone columns sum to their Total rows in Tables 1, 2, 3, 5, 5a and 6/6a
`[verified 2026-09-14: summed by hand from the extracted table text; e.g. Table 2 Jan–Jun 2026
8,593+14,569+10,468+4,637 = 38,267 and 2,091+2,313+1,613+554 = 6,571]` — so the tables are the
better source, but the partner should confirm rather than us silently editing their prose.

1. **COTA paragraph (docx §I).** "the Department issued 6,571 COTAs (17% of **36,267** initial
   inspections)". Table 2's Jan–Jun 2026 total is 38,267. 6,571/36,267 = 18.1%, which contradicts
   the 17% in the same sentence; 6,571/38,267 = 17.2%, which matches. The Table 5 paragraph uses
   38,267 for the same denominator. Likely a single wrong digit.
2. **Summons paragraph (docx §II).** "conducted **3,200 fewer** compliance inspections in the
   first half of 2026 (7,785) as compared to the same period in 2025 (10,540)". That difference
   is 2,755.
3. **311 paragraph (docx §VI).** "most notable decrease in Harlem (from **2,292** Rodent 311
   complaints in January to June 2025 to **1,460** in January to June 2026)". Table 6's Harlem
   column gives 2,133 for Jan–Jun 2025 and 961 for Jan–Jun 2026; 2,292 and 1,460 are the
   Jul–Dec 2024 and Jul–Dec 2025 rows. Every other Harlem figure in that paragraph reconciles
   (signs 933→57, sightings 933→713, conditions 214→171, mouse 53→20).

Two minor ones worth mentioning in the same message:

- Table 4 paragraph: visits fell "approximately 2,500"; 9,704 − 6,919 = 2,785.
- Table 3a paragraph: East Village/Chinatown "23%" second-or-higher compliances in Jan–Jun 2025;
  (125+53+38)/904 = 23.9%, which rounds to 24%. Every other percentage in that paragraph rounds
  as stated.

Also confirm, don't assume: the docx reports Rat Academy and community-event counts for
**July 1, 2025 – June 30, 2026**, a different window from the report's Jan–Jun 2026. Docx comment
[16] (Martha Vernazza, 2026-08-27) states this was deliberate. Carry the docx's own wording.

**Proof:** none — this is a message, not a change. Record the reply in this file under Task 0
before Task 2 rewrites the affected paragraphs.

---

## Task 1: Archive the 2025 report

**Files:**
- copy `content/data-features/rat-report/index.md` → `content/data-features/rat-report/2025/index.md` (new, 404 lines / 48,992 bytes at `5a60a06b27`)

An earlier draft of this document gave 44,433 bytes here. That is the size of the *2024-era* file
on both sides of the byte-identity check below, not of the page being archived now
`[re-measured 2026-09-14: wc -lc → 404 48992, and git cat-file -s on the same blob → 48992]`.

This mirrors what commit `99339aca73` (2025-11-12, "Fix tables") did for 2024
`[verified 2026-09-14: git show 99339aca73^:…/index.md and 99339aca73:…/2024/index.md are both
44,433 bytes and byte-identical]`.

**Steps:**
1. Copy the file verbatim. Change nothing — not the title, not the frontmatter, not the embed IDs.
   The archive is the published 2025 report and its title ("Rat Mitigation Zone Report:
   January 2025 to June 2025") is already correct for an archive.
2. Commit this on its own, before Task 2 touches `index.md`. A separate commit is what makes the
   byte-identity provable later.

**Proof:** `cmp content/data-features/rat-report/2025/index.md <(git show HEAD~1:content/data-features/rat-report/index.md)` exits 0.

**Interfaces:** produces the frozen 2025 page. Task 3 depends on this existing *before* any
Datawrapper chart is touched — otherwise editing a chart in place would alter both pages.

**Corrected 2026-09-14 — this paragraph previously said the archives were "reachable only by
direct URL or site search". They were not reachable at all.** `content/data-features/rat-report/`
held `index.md`, making it a *leaf* bundle, and subdirectories of a leaf bundle are page resources
rather than pages: `2023/`, `2024/` and the `2025/` copy committed at `6020832f59` rendered nothing
`[verified 2026-09-14: isolated build, the only output under data-features/rat-report/ was
index.html plus images and rat-report.js; the en sitemap's 736 <loc> entries held exactly one
rat-report URL. Control: heat-report-archive's five year URLs were present in the same sweep.]`
Task 1a fixes it. Nothing still links to the archives — see Open items.

---

## Task 1a: Publish the archives — Decision D2

**Decision D2 (settled 2026-09-14):** mirror `content/data-features/heat-report-archive/`, which is
this repo's already-working solution to the same problem.

That directory is a *branch* bundle: its `_index.md` carries `build: {list: never, render: never}`,
so the container neither renders nor appears in a listing, while its year children publish. It holds
both shapes — `2021.md`–`2023.md` beside asset directories, and `2024/index.md` /
`2025/index.md` as leaf bundles nested one level down, which is exactly the shape the rat archives
already have.

`[verified 2026-09-14 before the move: isolated build exit 0, 0 ERROR, 1206 EN pages in 48s. Output
held five heat-report-archive/<year>/index.html and one rat-report page; en/sitemap.xml (736 <loc>)
listed all five heat archive URLs. A first probe against the repo-root sitemap.xml returned zero for
both — that file is a sitemapindex, not a URL list; the numbers here are from en/sitemap.xml.]`

Rejected: converting `rat-report/` itself to a branch bundle. `_index.md` routes to `section.html`,
so the live page's `layout: report` would need re-verifying. The archive-container shape does not
touch the live page at all.

**Files:**
- `content/data-features/rat-report-archive/_index.md` (new, mirrors the heat-report-archive one)
- `git mv content/data-features/rat-report/{2023,2024,2025}` into it
- `content/data-features/rat-report-archive/{2024,2025}/rat-report.js` (copies)

The JS copies are load-bearing. `report.html:55-56` emits `<script src="{{ .Params.js }}">` with no
`relURL`, so `js: rat-report.js` resolves against the *page* URL. Each archive is now its own page
and each needs the file beside it. 2023 declares no `js` and calls `changeTable` zero times; 2024
calls it 30 times and 2025 34.

**Proof:** `[verified 2026-09-14 after the move: isolated build exit 0, 0 ERROR lines. Three
`rat-report-archive/<year>/index.html` in the output where there were none; en sitemap 736 → 739
`<loc>`, the three new ones being the archive URLs. 2023/2024/2025 rendered at 61,415 / 83,580 /
88,136 bytes with 0 / 31 / 37 Datawrapper embeds. `rat-report.js` sits beside each page that asks
for it, and both copies are `cmp`-identical to the source.]`

**Do not read the build summary's EN page count as the proof.** It stayed at 1206 across both
builds even though three pages started rendering — Hugo counted the archive `index.md` files as
pages while they were still bundle resources producing no output. The output tree and the sitemap
are the instruments that moved.

**No listing side effect.** `data-features/section.html` ranges over `.Pages`, which is direct
children only, and `_index.md`'s `list: never` hides the container. Control: the built
`data-features/index.html` holds zero `heat-report-archive` links against 4 for `heat-report`.

**Left alone:** each archive's `image:` frontmatter names a PNG that lives in the *parent* bundle
and is no longer a resource of the moved page. It is inert — `.Params.image` is read only by
listing templates, which exclude these pages, and `seo.html` uses `resources.Get` against `assets/`
instead. Fixing it would be an unrelated change.

---

## Task 2: Rewrite `index.md` from the docx

**Files:**
- `content/data-features/rat-report/index.md` — frontmatter lines 1–16, body lines 18–404

Of 61 substantive prose paragraphs in the docx, 5 are byte-identical to the current page and 12
are near-identical; the remaining 44 differ enough that patching in place costs more than
replacing the body `[measured 2026-09-14: difflib SequenceMatcher over case- and
punctuation-normalized text, each docx paragraph against its best match on the page]`. Replace the
body; keep the scaffolding.

**Keep exactly as-is:**
- The `<ol type="I">` metric list markup and its `&ensp;` / `<em>` conventions (lines 80–88), with
  the date ranges updated to "June 2026".
- Every `<div class="border-top border-bottom mb-4 py-2">` table wrapper.
- Every `<button class="… table{N}Buttons" id="{N}-{z}" onclick="changeTable({N},{z})">` and every
  `<div id="table-{N}-{z}" class="table{N}tables …">` panel.
- The commented-out block at lines 198–232.
- `{{< relURL >}}` shortcode links. The docx has bare link text where these belong ("Rat
  Inspection Mapping Tool", "Environment and Health Portal", "Inspection data at the borough and
  community district level") — docx comment [19] asks for hyperlinks there, and the page already
  supplies them.

**New material in the docx with no counterpart on the current page:**
- IPM bullet: "Evaluating new pest management practices and products."
- The rat-contraceptive pilot in the Harlem RMZ, June 2025 – June 2026. It appears in three
  places: the Table 4 narrative, "Current and planned rat mitigation measures", and "Visits by the
  Department's Pest Management Professionals". Docx comments [9]/[10] confirm contraceptive visits
  are already inside the Harlem visit counts, so the note must say *included*, not *additional*.
- The metric formerly called "Rat Exterminations and Stoppage visits" is renamed to "Visits by the
  Department's Pest Management Professionals", defined as baiting, monitoring, contraceptive
  application and stoppage (docx comment [2]). Table 4's heading changes with it — the current
  chart is titled "Extermination visits by RMZ".
- The elevated-compliance reversal: percentages rose after the late-2024 push and fell again in
  the first half of 2026. New narrative in both §II and "Compliance Inspections and enforcement".
- §4 gains: no new FY2026 resources, and the city-agency survey team was unfunded, "resulting in a
  decline in city agency survey work".
- Appendix gains a fourth entry, "Elevated compliances", on the removal of the city-owned-property
  restriction from 2024–2025 counts.

**Frontmatter changes:**
- `title: "Rat Mitigation Zone Report: January 2026 to June 2026"`
- `date:` — set to the publication date, not today's. The 2025 page carries `2025-12-01`; the 2024
  archive `2024-09-08`. Confirm before committing.
- `seo_title`, `seo_description`, `categories`, `keywords`, `layout`, `report`, `js`, `weight`,
  `blurb` — unchanged.
- `image:` — currently `ratportal-screenshot_copy copy.png`. That filename, with its embedded
  space and doubled "copy", came in at `99339aca73`. Leave it unless a new screenshot is supplied;
  renaming it is a separate change and the file is referenced only here.

**Steps:**
1. Update frontmatter.
2. Replace the body section by section, docx heading order, carrying the docx's own wording.
3. Apply the Task 0 replies to the three discrepant paragraphs.
4. Sweep for stale years: `grep -n "202[345]" content/data-features/rat-report/index.md` and read
   every hit. Many are legitimately historical ("since 2023", "the 2024 report", "late 2024"), so
   this is a read-every-hit check, not a replace-all.

**Step 4 ran 2026-09-15: 23 hits, every one legitimately historical, and 0 `PENDING PARTNER`
comments remain.** One sentence is worth raising with the partner rather than editing. Line 422
reads "There are no changes in rat mitigation measures since the **2024** report" — in a 2026
report, with a 2025 report now archived. It is the docx's own sentence, character-for-character
`[verified 2026-09-15 against the extracted `word/document.xml`: one hit, and the only paragraph
in the document matching either "2024 report" or "2023 report"]`, so Task 2 carried it correctly
and the question of whether they meant "2025 report" is theirs.
**Asked, and still open as of 2026-09-21:** it went to them as the "One wording question" section
of `documents/rat-report-2026-figures-to-confirm.md`, and their reply of that date addresses only
the numeric discrepancies. The page ships with "2024" unless they say otherwise.

**Proof:** `hugo --environment development` exits 0 with no ERROR lines. Build into temp
directories if a server is running, per `CLAUDE.md`:
`HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment development -d "$TEMP/iso-docs"`.

**Interfaces:** consumes the docx text and the Task 0 replies; produces the page body whose 32
embed slots Task 3 fills.

---

## Task 3: Swap in the 2026 chart embeds — IN PROGRESS (1 of 32)

Blocked on Decision D1 below. Until it is settled, leave the 2025 embed IDs in place so the page
renders, and mark each of the 32 slots with `<!-- TODO 2026 chart -->` on the line above.

**Do not edit the existing 32 charts in Datawrapper.** After Task 1, those IDs are what the
`2025/` archive renders; editing them in place would silently rewrite a published report.

### How the 32 charts get produced: the Datawrapper API

Decision D1 ships 2026 on option A — Datawrapper embeds. It does not follow that the charts have
to be made by hand. The v3 API covers the whole loop, and `POST /charts/{id}/copy` is what keeps
the constraint above intact rather than merely restating it: a copy is allocated its own
5-character ID, so the 32 charts the `2025/` archive renders are never written to.

Base `https://api.datawrapper.de/v3`, `Authorization: Bearer <token>`
`[read 2026-09-17 from developer.datawrapper.de/reference via Context7; the OpenAPI blocks there
declare `servers: https://api.datawrapper.de/v3` and doc version 2.9.0]`:

| Step | Call | Scope the reference names |
|---|---|---|
| read the 2025 CSV | `GET /charts/{id}/data` → `text/csv` | `chart:read` |
| read title and metadata | `GET /charts/{id}` | `chart:read` |
| duplicate | `POST /charts/{id}/copy` → `{id, title, …}` | not stated on the single-chart form; the batch form `POST /charts/copy` names `chart:write` |
| upload the 2026 CSV | `PUT /charts/{id}/data`, body `text/csv` → 204 | `chart:write` |
| retitle | `PATCH /charts/{id}`, JSON merge patch | `chart:write` |
| publish | `POST /charts/{id}/publish` → `{data, version, url}` | `chart:read` **and** `chart:write` **and** `theme:read` **and** `visualization:read` |

**The reference contradicts itself on scope names, and this is not settled here.** The endpoint
descriptions say `chart:write`; the example response under `GET /auth/token-scopes` lists
`chart:create,chart:delete,chart:read,chart:update,dataset:*,auth:read` and no `chart:write` at
all. Read the scopes off the token-creation UI at the moment the token is made rather than
trusting either list.

**A copy arrives unpublished** — the copy response carries `publishedAt: null` and
`publicVersion: 0`. Nothing renders on the page until `POST /charts/{id}/publish` has run against
the new ID.

#### Three things are unverified, and one chart settles all three

None of these could be checked without a token, so none of them is asserted here:

1. Whether the single-chart `POST /charts/{id}/copy` appends "(Copy)" to the title. The batch form
   documents a `markAsCopy` defaulting to true; the single-chart form documents no request body at
   all, so it has no way to be told otherwise. The script PATCHes every title afterwards, so a
   "(Copy)" suffix would not reach the page — but confirm it rather than assuming the PATCH is
   redundant.
2. Which folder or team a copy lands in. The single-chart form takes no `destination`; the batch
   form does. If copies land outside the folder the 32 originals live in, switch to the batch form
   with an explicit `destination.folderId`.
3. The rate limit. No number is recorded here because none was measured or read. The script
   serializes its calls and honours `Retry-After` on a 429 rather than guessing a safe rate.

**So Step 3 below is one slot, end to end, read in the Datawrapper UI before the other 31 run.**
It is the cheapest experiment that can falsify the approach and it costs one chart. Running all 32
first and discovering (2) afterwards means 32 charts in the wrong place.

#### Files

- `scripts/rat-report-charts.mjs` — `47d637cf3d`, the four-verb tool. No npm dependency; `fetch` and
  `node:fs` only.
- `scripts/rat-report-charts/current/<slot>.csv` (generated) — the 32 charts' 2025 data, as
  Datawrapper holds it.
- `scripts/rat-report-charts/current-charts.json` (generated) — per slot: current ID, title,
  `metadata.describe.intro`, `metadata.annotate.notes`.
- `scripts/rat-report-charts/next-titles.json` (generated by `pull`, **edited by hand**) — per
  slot, the title/intro/notes the 2026 chart should carry. Pre-filled with the 2025 values so it is
  a fill-in, not a blank.
- `scripts/rat-report-charts/next/<slot>.csv` (**written by hand**, from the docx) — the 2026 data.
- `scripts/rat-report-charts/chart-map.json` (generated by `push`) — `slot → {from, to, version,
  url, publishedAt}`. This is the run's own record and the second artifact the proof diffs.
- `content/data-features/rat-report/index.md` — rewritten by `apply`.

`scripts/` is outside Hugo's content, asset and data roots, so none of this reaches a build. That
is also what makes committing `next/*.csv` free: the 2026 numbers become greppable, diffable and
reviewable in a PR without changing how the page renders.

#### What has been run against the script, and what has not — SUPERSEDED 2026-09-17

This section describes a tree on which no API verb had been exercised. It is kept because its
offline proofs still stand; for what has since run against the live API, read "The push run:
state as of 2026-09-17" below.

`scripts/rat-report-charts.mjs` is committed at `47d637cf3d`. Everything below
ran offline, with `DATAWRAPPER_TOKEN` unset, so **no verb that talks to Datawrapper has been
exercised at all** — `pull`, the copy/upload/patch/publish sequence inside `push`, and every
response shape they assert are unproved until a token exists. `apply` is local but also unrun: it
needs a `chart-map.json`, which only `push` writes.

`[verified 2026-09-17, Node v24.0.1, all on a tree with `index.md` unmodified]`:

- **Parses, and the argument contract holds.** `node --check` exit 0. No arguments, `dryrun --all`
  and an unknown command each exit 2.
- **The missing-token path exits 2, after a correction.** Step 1 above specifies exit 2 and the
  draft exited 1 from inside the first request. `main()` now refuses `pull`, `dryrun` and `push`
  with exit 2 before reading anything; `apply` still exits 1, which is right — a missing
  `chart-map.json` is a state error, not a setup one. The token gate does not shadow the
  unknown-command path, which still exits 2 on its own.
- **`readSlots` agrees with this document's Python probe on all 32 rows.** Dumped from the
  script's own function and diffed against the probe's output over the same file: 32 rows each,
  zero differing lines. Control: perturbing one character of one id in the comparison makes the
  diff fire.
- **The script's own derivation is injection-tested, not just the probe's.** Swapping `bMzMo` and
  `LAaPy` in `index.md` — byte-length-preserving, the subtle case — moved exactly those two rows
  and nothing else. `index.md` was restored with `git checkout` and `git status --porcelain`
  returns it clean.
- **`writeGuard`'s scan is live, and `push` reaches it before any network call.** `push table-2-1`
  under a deliberately invalid token printed `guard: 419 published chart ids under content/ are
  off limits` and then stopped on the missing `next-titles.json` — no request is issued before the
  guard runs, so an invalid token is enough to exercise it. 419 is well above the 32 the
  self-check demands. **Its abort path is proved to fire, not assumed:** pointing the content scan
  at an empty directory made it report `found 0 chart id(s)`, name all 32 slots as unprotected and
  exit 1 without writing. A scan that silently returned nothing would otherwise permit every write
  the guard exists to block.
- **The token gate runs ahead of the guard**, so `push` with `DATAWRAPPER_TOKEN` *unset* now exits
  2 before `writeGuard` is reached. Use an invalid token, not an absent one, to exercise the guard
  offline.

**Proof 3 below needs its line endings normalized before the diff.** Python's stdout on Windows
writes CRLF and Node writes LF, so the two derivations compared byte-for-byte report all 32 rows
as differing while being identical `[measured 2026-09-17: 32 CR bytes in 534, against 0 in 502]`.
Pipe the probe through `tr -d '\r'`, or diff the parsed values rather than the text.

#### Producing the 32 CSVs from the docx

Step 4 below was written as "write the other 31 `next/*.csv` by hand". It does not have to be.
The docx's 12 tables are machine-readable and map onto all 32 slots.

**The published datasets are public, so this is verifiable without a token.** Datawrapper serves a
published chart's data at `https://datawrapper.dwcdn.net/<id>/<version>/dataset.csv`
`[verified 2026-09-17: all 32 of the page's charts fetched, 0 missing; versions range v1-v5 and
are found by walking upward from 1, since the embeds carry no version segment]`. That retires the
assumption that nothing about the chart data could be checked before a token exists — `pull` is
now a convenience, and only the write half (copy, upload, publish) still needs credentials.

**The source document is not where the Environment section said.** It is at
`cgettings-EHDP-work/documents/Rat report/Annual Rat Mitigation Report 2026_08_31.docx`, outside
this repo, 132,140 bytes. The worktree named there no longer exists either; the branch is checked
out in the primary tree.

##### The map, derived three ways rather than assumed

A `.docx` is a zip whose `word/document.xml` holds `<w:tbl>` elements, so this needs no
dependency — Python's `zipfile` and `ElementTree` are enough, which is why the tool is Python and
not `.mjs` like its siblings (`scripts/js-comment-spacing.py` is the precedent; Node has no
built-in zip reader and adding one would be a new dependency).

12 top-level tables, no nested tables, no images. Data rows carry a uniform cell count in all 12.

- **Index by ordinal cell position, never by walking `gridSpan`.** Docx Table 2's header row sums
  to 13 grid columns while every one of its data rows sums to 12, and `tblGrid` declares 13. The
  other 11 tables are internally consistent, so a span-walking reader would misplace only that
  table's Total column — the quiet kind of failure `[verified 2026-09-17]`.
- **The page reorders the zones.** Docx column order is Bronx, Brooklyn, Harlem, East Village,
  Total. Panel order is Bronx, Harlem, East Village, Brooklyn, Totals — so `-2` and `-4` are
  swapped relative to the docx, in every group that has them. Established on three independent
  signals that agree: the page's own switcher button labels, the docx header cells, and a
  data-match of each published dataset against the docx rows.
- **Matching on one column cannot derive this map.** Docx TABLE 2 (initial inspections + COTA) and
  TABLE 5 (initial inspections + agency referrals) carry an identical Insp column, so a probe
  scoring the first measure column alone put `table-2-*` and `table-5-*` on the same docx table at
  the same offsets, 5/5 both times. Scoring the whole flattened row separates them.
- **Formatting is per-slot and must be read off the live dataset, not applied as a rule.** The
  same percentage appears as `-26%` in `table-2-1`, `61%` in `table-3-1` and a bare `8` in
  `table-5-1`. Headers differ from the docx wording (`Total NYC Parks` against the docx's
  `Total DPR Parks`), and some are wrong in ways only a human should change — `table-5a-5` labels
  two different columns `Failed (#)`, and the `table-33-*` group labels four pairs with
  case-varying duplicates.

##### Ledger

| Step | State | Proof that ran |
|---|---|---|
| Fetch the 32 published datasets | **DONE 2026-09-17** — no commit; re-runnable | 32 of 32 fetched from the CDN, 0 missing |
| Derive the slot -> docx map | **DONE 2026-09-17** — no commit; recorded above | 27 of 31 period-based slots matched at 100%, on whole-row scoring; the 4 that did not are the discrepancy candidates below, and all 4 fill by the zone pattern the other groups establish |
| `scripts/rat-report-docx-tables.py` | **DONE 2026-09-17** — `faf71b0a56` | compiles; no args / a flag / an unknown command / a verb missing its argument each exit 2; `fetch` 32 of 32; `write` and `check` agree cell-for-cell on which values differ (37 = 35 + 2) |
| The 32-slot docx-vs-live discrepancy report | **DONE 2026-09-17** — 530 of 567 shared values agree exactly; `published/` and `next/` committed at `df70bdf265` | three findings re-verified against the raw docx cells; the `table-5a` group re-derived arithmetically |

##### The push run: state as of 2026-09-17

**Read this before running anything against the API.** It supersedes "What has been run against
the script", which describes a tree where no API verb had been exercised.

| Step | State | Proof that ran |
|---|---|---|
| Create the token | **DONE 2026-09-17** — not recorded anywhere in the repo; see Environment | `pull` and `push` both completed against the live API |
| `pull` | **DONE 2026-09-17** — no commit; `current/` is gitignored | 32 `current/*.csv` and a 32-slot `next-titles.json` on disk |
| Fill `next-titles.json` | **DONE 2026-09-17** — `f5ea98079b` | 32 slots present; only `#1` needed a year change (2025 → 2026), the other 31 titles carry no year `[verified: `grep -c 2025` returns 0]` |
| `push table-2-1` | **DONE 2026-09-17** — `zVvyR`, published 19:21Z; recorded at `f5ea98079b` | the chart resolves at `dwcdn.net/zVvyR/2/` |
| `repush` verb added | **DONE 2026-09-17** — `119207fa01`, ~200 lines in `scripts/rat-report-charts.mjs` | exercised against `table-2-1` (map `updatedAt` 20:42Z, version 2); the live v2 dataset is byte-identical to `next/table-2-1.csv` |
| The partner-facing figures document | **DONE 2026-09-17** — `efcace7a59`, at `documents/rat-report-2026-figures-to-confirm.md` | 4 arithmetic corrections stated as settled, 31 listed for confirmation; the counts match `check`'s 35 |
| `push` the other 31 | **READY 2026-09-21** — the partner answered that document and confirmed the 2026 figures; see the 2026-09-21 amendment | — |
| `apply` | **Not started** — needs all 32 in `chart-map.json` | — |

**Why `repush` had to exist.** `push` skips any slot already in `chart-map.json`, so once a number
changes, re-running `push` prints "already copied to" and exits 0 having done nothing. `repush`
writes into the chart already made, and its guard is deliberately narrower than `push`'s: it
refuses any id an **archive** page renders, while permitting ids rendered only by the live report.

**Step 3's three UI observations, read off `zVvyR` 2026-09-17.** All three are answered and none
of them blocks the remaining 31.

1. **No "(Copy)" suffix.** The published title is exactly the patched one, in all five places it
   appears in the CDN page `[verified 2026-09-17: the only case-insensitive `copy` matches in
   82,851 bytes are Datawrapper's own UI strings and `"upload-method":"copy"`]`. This confirms the
   PATCH lands; it does **not** answer whether `POST /charts/{id}/copy` appends the suffix, because
   the PATCH overwrote the title seconds later. That sub-question is unobservable on `zVvyR` and,
   the PATCH being unconditional, does not affect the other 31. Note `chart-map.json`'s `title` is
   set locally from `next-titles.json` rather than read back, so the map is evidence of intent, not
   of what Datawrapper stored -- the CDN page is.
2. **The copy lands in its source's folder**, `BESP > Live Charts > Data Features > Rat Report >
   Rat Report 2025 > Table 2`, with `COPIED FROM bMzMo` shown in the UI. The failure this step was
   guarding against did not happen: copies do not escape to a default location, so **the batch form
   with an explicit `destination.folderId` is not needed** and the remaining 31 can run as-is. What
   it does mean is that all 32 of the 2026 charts will be filed under a tree named *Rat Report
   2025*. That is filing, not correctness -- the page references charts by ID and never by folder --
   so whether to make a 2026 tree and move them is a decision, and a cheaper one before 31 more
   land there.
3. **The columns render correctly**: Period, Initial inspections, COTA (#), COTA (%), values
   matching `next/table-2-1.csv` row for row. The "Bronx: Grand Concourse" line above the table is
   the `intro` from `next-titles.json`, as set.

**The rate limit is not one of these three.** "Three things are unverified" above lists the copy
suffix, the folder and the rate limit; Step 3's three *observations* swap the rate limit for column
rendering. It cannot be read in the UI, the script serializes and honours `Retry-After`, and one
pushed slot is no evidence either way. It will be learned on the 31-slot run.

##### The pagination finding

**Not on the plan's list, and it hides the report's own reporting period.** `zVvyR` paginates at 5
rows and now holds 7, so page 1 ends at Jan-Jun 2025 and **Jul-Dec 2025 and Jan-Jun 2026 are behind
the page-2 arrow** `[verified 2026-09-17 in the Datawrapper UI: "Page 1 of 2", 5 rows visible]`.

The setting is `metadata.visualize.perPage: 5`, a sibling of `pagination: {"enabled": true,
"position": "top"}`, inherited from `bMzMo`. It was invisible on the 2025 chart because that chart
held exactly 5 rows -- one page. Adding two periods is what made it bite, and 31 of 32 slots grow.

**Scope: one chart, not a class.** All 32 published charts were surveyed 2026-09-17 by fetching
each one's page from the public CDN and reading `perPage`, `horizontal-header` and
`pagination.enabled`:

| `perPage` | slots | data rows | overflows? |
|---|---|---|---|
| **5** | `table-2-1` (`bMzMo`) alone | 7 | **yes, hides 2** |
| 15 | 20 slots | 6-7 | no |
| 20 | 11 slots | 4-7 | no |

Pagination is enabled on all 32, so the setting is live everywhere; `bMzMo` is simply the one set
low. At one added period a year the others have roughly eight years of headroom. `horizontal-header`
varies as expected -- true on `#1`, the `table-33-*` group, `table-6-*` and part of `table-5a-*` --
so those row counts are header-adjusted.

`[method: 2 requests per chart, since `/<id>/1/` returns a 239-byte JS+meta redirect stub naming the
current version rather than the chart -- a "first 200 wins" version walk reads the stub. Controls:
`A4dTB` must read perPage 20 / header true and `bMzMo` perPage 5 / header false; both passed, 0 of
32 unparsed. Three earlier runs of this survey returned a confident "0 slots affected" from a dead
probe -- first `urllib`'s default User-Agent drawing 403 from the CDN, then two regex forms that
did not match the page's backslash-escaped JSON. The controls are what caught all three.]`

**Decision taken 2026-09-17: fix it in the script** (`70338e9f0b`). `push` and `repush` now GET the
chart before patching and set `perPage` to `max(current, dataRows)`. That is a no-op on 31 of 32 slots and sets
7 on `table-2-1`, so it can never hide a row and never shrinks a chart. The alternative considered
and rejected was raising `perPage` to 7 by hand: it works, but its failure mode is silent -- if
nobody bumps it next year the 2027 chart shows 7 of 8 rows and hides the newest period with nothing
flagging it. Assignment rather than `max()` was also rejected: it would shrink the charts at 20 down
to 4 and re-create the bug the first year they grow. The header row is read from the chart's
`metadata.data.horizontal-header`, not inferred from the CSV, because the 32 files disagree about
whether row 1 is a header and `firstRowIsHeader` reads false even on charts that have one.

`fitPerPage` is covered by 7 offline cases run against the function extracted from the file itself,
including a control that returns 4 instead of 20 if the rule is assignment rather than `max()`
`[verified 2026-09-17: 7 of 7 pass, `node --check` exit 0]`.

**Two things unverified:** whether the API accepts an arbitrary `perPage` (the UI exposes a slider,
so there may be a cap), and whether a merge PATCH carrying `metadata.visualize.perPage` leaves the
rest of `visualize` intact. The first `repush` of `table-2-1` settles both -- run it on that one
slot and read the chart back before pushing the other 31.

**The period-window decision is still open, and pagination is now part of it.** `write` emits all
7 periods the docx holds; the 2025 charts showed 5 (`table-33-*`, 2; `table-6`, 6). `table-2-1` was
pushed with all 7. Keeping all 7 requires `perPage` to move with them, which the script now
handles -- see the pagination finding above. Trimming to a rolling 5 makes that moot. Either way the decision applies to `zVvyR` via
`repush` as well as to the 31 unpushed slots.

##### Filing the 2026 charts — tooling at `c2840dfbd0`, exercised on 1 of 32

Observation 2 above left a decision open: all 32 of the 2026 charts land under a tree named *Rat
Report 2025*, because a single-chart copy inherits its source's folder. The decision taken was to
make a 2026 tree and move them. The tree exists, the tooling is committed at `c2840dfbd0`, and
**`move` has now run once — on `table-2-1`, the only pushed slot**. The other 31 follow their
pushes.

| Step | State | Proof that ran |
|---|---|---|
| `folders`, `makefolders`, `move` verbs | **DONE 2026-09-18** — `c2840dfbd0`, +301 lines in `scripts/rat-report-charts.mjs` | `node --check` exit 0, and 9 argument-handling cases each exit 2 — no args, a flag, an unknown verb, `makefolders` short of both arguments, three arguments to `move`, an argument to `apply`, and `folders`/`move` with the token unset `[verified 2026-09-18]`. `cmdMove`'s own body has since run once — see the `move` row |
| `makefolders` run | **DONE 2026-09-18 03:12Z** — no commit; the live account changed | 10 of 10 folders printed `created`, `exit=0`; the immediate re-run printed 10 reuses / 0 created with identical ids. Tree and ids under Environment |
| Commit the verbs and `folder-map.json` | **DONE 2026-09-18** — `c2840dfbd0` | `git show --stat c2840dfbd0`: 2 files, 335 insertions, 9 deletions, `folder-map.json` created |
| `move`, on `table-2-1` | **DONE 2026-09-18 16:55:37Z** — `b16c041ab6` carries the rewritten `chart-map.json`. Two earlier attempts that day stopped before any API call: once on the script's own argument validation, once on the Claude Code auto-mode classifier, which reads a Datawrapper write as "Modify Shared Resources". What unblocked it was a `PowerShell(node scripts/rat-report-charts.mjs *)` **ask** rule in `~/.claude/settings.json` — the command then prompted and was approved | exit 0, `folder 443569  1 chart(s): table-2-1`. Verified against the API rather than the script's read-back, with a control that had to stay put: `GET /v3/charts/zVvyR` returns `folderId` **443569** (was 363786), and the 2025 source `bMzMo` still returns **363786** — so the batch `PATCH /charts` moved only the selected id. The run's guard reported 419 chart ids under `content/` and selected 1 |
| `move`, the other 31 | **READY 2026-09-21** — each follows its own `push`, and those are no longer blocked | — |

**`move`'s shape is not the one `push` and `repush` use, and that is why it needed a control.** It
sends `PATCH /charts` with an `ids` array, whose path carries no chart id — so the per-id guard in
`write()` cannot match it, and `cmdMove` re-implements the archive check itself before the call.
The one-chart run on 2026-09-18 exercised that path, and the control was `bMzMo`: an `ids` array
that swept wider than intended would have moved the 2025 source too, and it did not
`[verified 2026-09-18 via `GET /v3/charts/bMzMo`, still `363786`]`.

**The `table-6-5` → `Table 6a` rule is mirrored from two years, not from an author.** The code
comment beside it says so and says to ask whoever files these. Two years agreeing evidences a
common origin; a copy-paste satisfies that as well as a decision does. Worth one question before
31 more charts are filed that way.

###### The literal next command

**Everything on the first track is done.** `move` ran on the one pushed chart at 16:55:37Z and is
recorded at `b16c041ab6`. The second track below is runnable as of 2026-09-21 — the partner has
answered.

Three things that run survived from that track and are worth keeping, because the 31-slot run
repeats all of them:

- **The token is not in the process and every run has to lift it first**, which is why it shares
  the invocation with `node` rather than getting its own call — PowerShell has no inline env-var
  prefix and shell state does not persist between tool calls:

  ```powershell
  $env:DATAWRAPPER_TOKEN = [Environment]::GetEnvironmentVariable('DATAWRAPPER_TOKEN','User'); node scripts/rat-report-charts.mjs move
  ```

  **The prefix did not stop a permission rule matching** — the command prompted
  `[verified 2026-09-18, reported by the user]`. **Which rule fired is not determined**, and the
  question matters for anyone writing the next one: `~/.claude/settings.json` holds the anchored
  `PowerShell(node scripts/rat-report-charts.mjs *)`, while this repo's `.claude/settings.json`
  holds a leading-wildcard `PowerShell(* node scripts/rat-report-charts.mjs *)` that matches a
  prefixed command by construction. Two rules, one prompt, no way to tell them apart from the
  outcome. Write the wildcard form if the command will carry a prefix.
- **Bare `move` is the all-slots form and reads `folder-map.json`**, which an explicit id would
  skip. It moved 1 chart because `chart-map.json` held 1; after the 31-slot push it will move 32.
  `move table-2-1` does **not** work — `cmdMove(folderArg, only)` takes the folder id first, so
  the slot name is parsed as an id and the run exits 1 with `"table-2-1" is not a folder id`
  `[verified 2026-09-18; this block previously prescribed that command, written without running
  it]`. The one-slot escape hatch is `move <folderId> <slot>`.
- **`move` re-reads each chart and throws if `folderId` did not change**, so a silently-ignored
  PATCH exits non-zero rather than passing. Confirm the result against the API anyway, with a
  chart that must *not* move as the control.

The partner answered on 2026-09-21, so this track is clear. With `DATAWRAPPER_TOKEN` exported:

```
node scripts/rat-report-charts.mjs dryrun        # names every slot missing a CSV or a title
node scripts/rat-report-charts.mjs push          # the remaining 31; table-2-1 is skipped as resumed
node scripts/rat-report-charts.mjs move          # files all 32 per folder-map.json
node scripts/rat-report-charts.mjs apply         # rewrites index.md, deletes the 32 TODO lines
```

`slot1` is the one slot whose rows are zones rather than periods (docx Table 1), so it is mapped
by hand rather than by the period-matching above.

##### What the first run found

`python scripts/rat-report-docx-tables.py check <docx>` over all 32 slots: **530 of 567 shared
values agree exactly. 35 disagree on the number and 2 differ only in rendering.** The tool
separates those two classes, because a differing rendering of the same number is not something to
put in front of the partner.

**Two of the disagreements are errors in the charts the site is serving right now**, not restated
numbers — and the `2025/` archive renders the same chart IDs, so both are live in two places.

- **`table-5a-1` (Parks and playgrounds, Bronx Grand Concourse) has the wrong percentages in its
  last three rows.** The `Failed (%)` column repeats the `Failed (#)` count: 52, 56, 54 where the
  arithmetic gives 88%, 81%, 78%, which is what the docx says. Re-derived across the whole group:
  22 of the 25 published rows in `table-5a-*` are arithmetically right and only these three are
  wrong `[verified 2026-09-17: failed/inspected recomputed per row]`.
- **`table-2-4` (Initial inspections, Brooklyn) reads `-21%` for Jul-Dec 2023.** 4,129 of 15,533
  is 26.6%, and the docx says 27%.

The rest are restatements the partner should confirm rather than defects this can adjudicate:
`slot1`'s NYCHA development counts moved in all four zones and the total (17/10/28/79 published
against 15/9/24/72), and the whole `table-33-*` group differs by small amounts on both of the
periods it shares with the docx — 27 values across four panels, mostly ±1 to ±18.

**Answered 2026-09-21, and both are the docx's.** The `slot1` counts are NYCHA developments that
converted to RAD or private management, mostly in fiscal year 2026; the `table-33-*` group is a
methodology change on elevated compliances. Full wording, and the one thing in their explanation
that the numbers do not bear out, in the 2026-09-21 amendment at the top of this document.

The two cosmetic ones are the same defect in the published data: `table-33-1` drops the `%` from
one cell and `table-33-3` from another. The extractor writes them consistently, which is why they
surface as rendering rather than value differences.

##### Running it

```
python scripts/rat-report-docx-tables.py fetch          # refresh published/, no credentials
python scripts/rat-report-docx-tables.py check <docx>   # the report above; exit 1 on a numeric disagreement
python scripts/rat-report-docx-tables.py write <docx>   # emit next/*.csv for rat-report-charts.mjs
```

Both output directories are tracked as of `df70bdf265` — `published/*.tsv` as the pre-update
record and the reference `check` runs against, `next/*.csv` so the 2026 numbers are reviewable in
a PR. Both are re-derivable; `scripts/` is outside Hugo's content, asset and data roots, so
neither reaches a build.

```
```

`check` exits 1 while any number disagrees, so it stays red until the live charts carry the 2026
numbers — which is the point. **The docx is not what changes.** `cmd_check` compares the docx
against `published/*.tsv`, which `fetch` downloads from the CDN, so the 35 disagreements clear when
the 31 slots are pushed and `fetch` is re-run — not before. The partner confirmed on 2026-09-21
that the docx figures are the correct ones, so nothing is folded into it
`[corrected 2026-09-21; this sentence previously said the docx was what had to change]`. `write`
works regardless; it does not wait for `check` to pass.

**`write` emits every period the docx holds, and 31 of 32 slots grow.** The published charts show
5 periods (`table-33-*`, 2; the `table-6` group, 6) and the docx has 7, back to Jan-Jun 2023.
Whether the 2026 charts show all 7 or keep a rolling window is a content decision, so the tool
prints the change per slot and trims nothing. Decide it once and apply it before `push`.

**Headers are carried through from the published chart untouched**, including the ones that are
wrong: `table-5a-5` labels two different columns `Failed (#)`, and the `table-33-*` group labels
four column pairs with case-varying duplicates (`First comp` / `First comp`). Fixing those is a
content edit for `next-titles.json` and the Datawrapper UI, not something to change silently while
swapping data.

#### Steps

1. **Create the token.** Datawrapper UI, scopes per the table above. Put it in the environment as
   `DATAWRAPPER_TOKEN`; never in a file in this repo. The script reads only that variable and
   exits 2 naming it when unset.
2. **`node scripts/rat-report-charts.mjs pull`.** Read-only against Datawrapper. Writes the 32
   `current/*.csv`, `current-charts.json` and `next-titles.json`. Its own check: 32 CSVs, none
   empty. This step also settles whether the token's scopes are sufficient for reads before
   anything is written.
3. **Fill in one slot and push it.** Write `next/table-2-1.csv` from docx Table 2's Grand
   Concourse column, set its entry in `next-titles.json`, then
   `node scripts/rat-report-charts.mjs push table-2-1`. Open the new chart in the Datawrapper UI
   and read three things: the folder it landed in, whether its title says "(Copy)", and whether
   the table renders with the right columns. Record all three in this document before Step 4.
4. **Write the other 31 `next/*.csv`** from the docx, and their `next-titles.json` entries.
5. **`node scripts/rat-report-charts.mjs dryrun`.** Local plus one token check; no writes. It
   names every slot with no `next/` CSV and every slot with no title entry, and refuses to report
   ready while either list is non-empty.
6. **`node scripts/rat-report-charts.mjs push`.** Copies, uploads, patches and publishes the
   remaining 31. Resumable: a slot already in `chart-map.json` is skipped rather than copied a
   second time, so a re-run after a network failure does not orphan charts.
7. **`node scripts/rat-report-charts.mjs apply`.** Rewrites `index.md` — swaps each slot's ID and
   deletes that slot's `<!-- TODO 2026 chart -->` line. Local only.
8. **Update this document's 32-slot table** with the new IDs, then run the proof below.

#### Interfaces

Consumes: the 32 slot→ID pairs, derived from `index.md` itself rather than from the table above, so
there is no second copy to drift. Consumes the docx tables, by hand, as `next/*.csv`.
Produces: 32 published 2026 chart IDs, `chart-map.json`, and the rewritten `index.md` whose slots
the proof below checks.

#### Why the proof below still has to run

`apply` and the proof are deliberately *not* the same code. The script derives slots in JavaScript;
the proof's probe derives them in Python, from the same file, independently. The check that matters
is the probe's output diffed against `chart-map.json` — file text against API responses, two
artifacts produced by different means. Diffing the probe against a table the script itself printed
would prove only that the script is self-consistent.

The guard that keeps `push` off the published charts is a hard one, not a convention: every write
call passes through one function that refuses any ID found in a `dwcdn.net/<id>/` or `datawrapper …
src="<id>"` reference anywhere under `content/`. It carries its own positive control — the scan
must return at least the 32 source IDs, and `push` aborts if it does not, because a scan that
silently returned nothing would permit every write it exists to block.

**Proof, once unblocked.** Four checks. Join the two greps with `;`, not `&&` — `grep -c` exits
non-zero on the zero count that is the answer.

1. All 32 TODO markers gone:
   `grep -c "TODO 2026 chart" content/data-features/rat-report/index.md` → 0
2. No 2025 ID surviving:
   `grep -c -E "(EfIky|bMzMo|LAaPy|mVQJR|DKVEV|9i7xg|jaV7S|PaKDr|pCGDW|f4qkK|szLTu|A4dTB|ol6ho|JJRpq|18Wbr|sPNQu|KhvBm|UqEDs|Jm1m0|Lyets|RBGAy|9qR8g|VIJdM|NwWcR|2AJd4|qx7lH|glCLq|5Lv5f|eEaFz|BXHue|FgeCo|HIVhB)" content/data-features/rat-report/index.md`
   → 0
3. **The slot-to-ID check.** Neither grep above can see a right-id-in-the-wrong-slot paste: every
   switcher still works, every marker is gone, no 2025 id survives, and the file can even be the
   same length. Run the probe below and diff its `slot<TAB>id` output against `chart-map.json`'s
   `slot → to` pairs, which are what Datawrapper's own copy responses said. A swap shows as two
   mismatched rows. Update this document's 32-slot table from the result *after* it passes — the
   table is then a record of a checked state rather than the thing being checked.
4. A browser read of every panel against the docx tables.

```bash
python - content/data-features/rat-report/index.md <<'PY'
import re, sys

lines = open(sys.argv[1], encoding="utf-8").read().split("\n")

# The commented-out block holds 5 dead embed ids that must not be counted.
dead, start = set(), None
for i, ln in enumerate(lines, 1):
    if "<!--" in ln and "-->" not in ln:
        start = i
    elif "-->" in ln and start:
        dead.update(range(start, i + 1)); start = None

rows, panel = [], None
for i, ln in enumerate(lines, 1):
    if i in dead:
        continue
    m = re.search(r'<div id="(table-[\w-]+)"', ln)
    if m:
        panel = m.group(1)
    m = re.search(r"datawrapper-vis-([A-Za-z0-9]+)", ln)
    if m:
        rows.append([panel, m.group(1)]); panel = None

for n, row in enumerate(rows, 1):
    if row[0] is None:
        row[0] = f"#{n}"

dupes = [e for e in {e for _, e in rows} if [x for _, x in rows].count(e) > 1]

print(f"{len(rows)} live slots; {len(dupes)} duplicated id(s) {sorted(dupes)}")
for slot, eid in rows:
    print(f"{slot}\t{eid}")
PY
```

**Both of its probes are proved to fire** `[2026-09-15, against the file at 07549883c0]`. Swapping
`bMzMo` and `LAaPy` — two ids inside Table 2, the subtle case, and byte-length-preserving — moved
exactly the two expected rows and nothing else; pasting `bMzMo` into both slots reported
`1 duplicated id(s) ['bMzMo']`. The control, the unmodified file diffed against itself, printed
`32 live slots; 0 duplicated id(s) []` and an empty diff. Re-run the injection if the page's markup
changes shape, since the probe reads `<div id="table-...">` and `datawrapper-vis-*` literally.

---

## Task 4: Verify — DONE 2026-09-14 (re-run after Task 3)

**Build, smoke and the interaction check have all run.** Task 3 edits the same `index.md`, so the
smoke and interaction results are void for the final state and must be re-run after the chart swap.

- **Build** — isolated build, exit 0, 0 ERROR lines, 1206 EN pages.
- **Smoke** — `npm run smoke:env dev_stage sample`, twice. The rat report and the 2025 and 2024
  archives passed in both runs. **Use the `:env` form, not `npm run smoke`:** `dev-server.mjs`
  reuses any server on :8080/:8081/:1313, and a server from another worktree 404s on
  `rat-report-archive` while still answering, so the sweep would silently run against the wrong
  tree.
- **Smoke now covers these pages permanently.** `scripts/smoke-pages.mjs`'s `PAGES` went 33 → 36.
  The justification is template coverage, not page coverage: `report` layout was already in the list
  via `heat-report-archive/2021/`, but the three rat pages with a `js:` param are the only pages in
  the repo that reach `report.html`'s `<script src="{{ .Params.js }}">` branch.
  `rat-report-archive/2023/` was deliberately left out — it has no `js:`, so by the list's own
  one-page-per-template-kind rule it duplicates the 2021 entry.
- **Interaction** — 88 clicks across the four pages, zero failures: every click left the named
  panel visible and all siblings hidden. 2023 has no switchers. The assertion was validated by
  injection, renaming one panel id before the clicks: it failed on all three pages carrying
  `table-2-1` and correctly reported the panel absent on 2023. The script that did this was
  **deleted** — it re-proves a mechanism Task 3 does not touch. What Task 3 needs instead is a
  slot-to-ID check against the 32-slot table above, since pasting the right id into the wrong slot
  leaves every switcher working.

**A known non-issue, so nobody re-diagnoses it.** The 2023 archive throws
`t.datasetSourceUrl is not a function` up to five times — once per embed — from Datawrapper's
own `embed.js`. It is intermittent (5 hits in one of three runs, 0 in the other two) and the charts
render regardless `[verified 2026-09-14 by screenshot: its Table 1 renders complete and correctly
formatted, beside the 2025 control]`. That page uses Datawrapper's older script-injection embed
form; 2024 onward use the newer `datawrapper-vis-*` markup. It is why 2023 is not in the smoke list.

**A correction to this document.** The Task 1 / D1 sections say `2023/index.md` contains no embeds.
It contains five `[verified 2026-09-14]`. The `datawrapper-vis-*` pattern that zero came from cannot
match the older embed form, so it described the search rather than the file. D1's option B cited
2023 as a page with no table markup; that half still holds, but not the "0 embeds" half.

### The original rung list


Rungs, cheapest first. This page runs JS (`rat-report.js` plus, under option A, 32 third-party
embeds), so a green build is not sufficient — `CLAUDE.md` is explicit that a build proves the
templates compile and nothing more.

1. **Build** — Task 2's proof, above.
2. **Smoke.** `/data-features/rat-report/` is not in the curated `PAGES` list — check before
   citing a curated run. Either add it, or run `npm run smoke:all`. Do not write
   `npm run smoke -- --all`: PowerShell eats the `--` and you get the curated 33 reported as a
   pass.
3. **Interaction.** The one thing neither smoke nor characterization covers: click every button in
   all seven switcher sets (2, 3, 3a, 5, 5a, 6 — 29 buttons) and confirm the matching panel
   unhides and the others hide. A wrong `id` renders an empty div with no console error, so this
   failure is invisible to smoke.
4. **Characterization.** `npm run characterize:site` will report `structure` changes on this page
   by design. Expect them; read them rather than re-baselining reflexively.

---

## Decision D1 (open): how the tables should be produced, this year and after

The user asked for the future mechanics to be written up rather than decided now. Recorded here so
the deferral is explicit: **the 2026 page has to ship either way, and this decision only changes
how.** Option A can ship without any repo or template change; B and C cannot.

### A — Datawrapper embeds (status quo)

Annual effort: duplicate 32 charts in Datawrapper, paste the new CSV into each, publish each, copy
32 new IDs into `index.md`. Knowledge required: a Datawrapper account and its UI; essentially no
repo knowledge beyond a find-and-replace.

Costs, each checkable today:

- The numbers are not in the repo. They cannot be grepped, diffed, or reviewed in a PR, and no
  one can check a figure against the source docx without opening 32 charts.
- Every year adds 32 permanently-live third-party charts that must never be edited, because an
  archived page renders them.
- A mistyped ID renders an empty `<div>` with no console error, so smoke passes.
- The `<noscript>` fallback is `<img … alt="Table" />` on 26 of the 32 live slots — not a
  description of the data. The other 6 carry real descriptions
  `[verified 2026-09-14: grep -o 'alt="[^"]*"' | sort | uniq -c → 26 alt="Table", 6 descriptive,
  and 5 alt="" which are the commented-out block; 37 total, matching the embed count]`.

### B — HTML tables in `index.md`

Annual effort: write or generate 32 tables of markup. Knowledge: HTML tables, edited inside a
markdown file. The numbers land in git — diffable, greppable, reviewable.

This is what the `2023/` archive does, or rather doesn't: that page references Tables 1–5 in prose
and contains no table markup at all `[verified 2026-09-14: grep -c -E "<table|<th|^\|" on
2023/index.md → 0. Control: the same pattern returns 4 on
themes/dohmh/layouts/partials/render-table.html and matches 488 files under content/, so the zero
is a real absence and not a mangled pattern.]`. So there is no worked in-repo example as markup
to copy from, and responsive behaviour at phone width becomes ours to handle rather than
Datawrapper's.

### C — `csvtable` shortcode with CSVs bundled in the page

`themes/dohmh/layouts/shortcodes/csvtable.html` reads a bundled CSV via
`.Page.Resources.GetMatch` and renders through `themes/dohmh/layouts/partials/render-table.html`,
optionally with DataTables paging/search/sort and a "Download data" link.

Annual effort is the lowest of the three by mechanism: once the shortcode calls are in the page,
the yearly change is *replace N CSV files in the bundle* — no markup edit, no external service,
no ID swap. Knowledge required is CSV only, which is the format the partner's data already
arrives in.

Two things gate it, both measured:

- **`render-table.html` supports a single header row.** It treats row 0 as `<thead>` and every
  later row as `<tbody>` (lines 31–40); there is no `colspan` handling. The rat tables have a
  two-row header — zone across the top, then `Insp | COTA` beneath. Using it as-is means flattening
  to one row ("BX Insp", "BX COTA", …); keeping the visual grouping means extending the partial.
- **It has one consumer in the whole repo** — `content/data-features/pesticides-report/index.md`
  `[verified 2026-09-14: grep -rl csvtable content/ returns 1 file]`. It is an existing convention,
  but a thinly-exercised one.

### Not an option: the `datawrapper` shortcode

`themes/dohmh/layouts/shortcodes/datawrapper.html` is used by 17 content files, but it opens and
closes `.narrow` / `.wide` wrapper divs that only exist in the data-story layout, and it hardcodes
`id="datawrapper-chart-O0SUA"` on every instance. Dropping it into the `report` layout would
therefore emit an unbalanced `</div>` before the chart and leave a `.narrow` div open after it,
and give every chart on the page the same element id. The rat page's raw-HTML embeds are the right
shape for this template, not an anomaly — this is a reason not to switch, not a defect to fix here.

### Recommendation

Ship 2026 on **A**, because it needs no template change and the page has to go out. Evaluate **C**
for 2027 in a separate piece of work, on the mechanism that the annual update collapses to
"replace a CSV" — which is the axis where the current process is most expensive and most
error-prone. What would bring C forward: someone deciding whether flattened headers are acceptable,
or extending `render-table.html` with `colspan` support. Neither is large, but both are changes to
a shared partial that the pesticides report also renders through, so they need their own
verification.

**Amended 2026-09-17 — the API route retires one of A's four costs and leaves the other three.**
Taking them in the order listed above:

1. *"The numbers are not in the repo."* Removed, and without a template change. The 32
   `scripts/rat-report-charts/next/*.csv` the API route needs as input are the numbers, in git,
   greppable and diffable in a PR. This was the strongest argument for C, and it turns out to be
   separable from C.
2. *32 permanently-live charts a year that must never be edited.* Unchanged. The API makes more of
   them faster.
3. *A mistyped ID renders an empty `<div>` with no console error.* Reduced, not removed — `apply`
   writes the IDs from the copy responses rather than by hand, and the slot-to-ID check compares
   two independently-produced artifacts. A wrong ID is now a bug in one script rather than one of
   32 chances to mistype.
4. *26 of 32 `<noscript>` fallbacks read `alt="Table"`.* Unchanged, and **independent of D1** —
   that alt text is in this repo's own markup, not in Datawrapper, so it can be fixed under A, B or
   C alike. It is not a reason to prefer one.

This does not change the recommendation: ship 2026 on A. It does change what a 2027 evaluation of C
is arguing about, since the in-repo-numbers benefit is no longer C's to claim.

---

## Open items

- ~~Publication date for the frontmatter `date:` field.~~ **Closed 2026-09-14** — `07549883c0`,
  set to `2026-09-14T11:14:56-04:00`. It had read `2026-12-01T11:14:56-04:00`, the 2025 page's timestamp
  with the year bumped, which was 2.5 months in the future and the newest date on the site — so
  it was the English sitemap's own `lastmod` `[verified 2026-09-14: the root sitemapindex's
  <lastmod> for en/sitemap.xml read exactly that string]`. It never broke the build;
  `config/_default/config.toml:10` sets `buildFuture = true`. No date after today now remains
  anywhere in `content/`.
- D1 — recommendation is to ship 2026 on option A and evaluate C for 2027.
- Whether a new `image:` screenshot is being supplied for the 2026 page. If one is, drop the two
  unreferenced duplicates in the same commit: `ratportal-screenshot.png`,
  `ratportal-screenshot_copy.png` and `ratportal-screenshot_copy copy.png` are byte-identical
  (same md5, 1,440,902 B each) and only the third is referenced from this bundle
  `[verified 2026-09-15: the other two are named only from other bundles, which carry their own
  copies]`.
- Whether "since the 2024 report" at `index.md:422` should read 2025. The docx says 2024; see
  Task 2.
- **A Datawrapper API token, and whether the account holding it can reach the 32 charts.** Task 3's
  route needs one; nothing in this repo indicates whether the team has API access. No file under
  the repo names `api.datawrapper.de`, the R client `DatawRappr` or the Python `datawrapper`
  package `[verified 2026-09-17: that six-term grep returns 0 files; control: a plain
  case-insensitive `datawrapper` returns 370]`, so this would be the first API client here and
  there is no existing house harness to copy. If the 32 originals sit in a team folder, the token's
  user needs access to that folder, not just an account.
- ~~Nothing links to the archives.~~ **Closed 2026-09-14** — `c73fd0451c`. A
  `### Previous reports` block at the end of `index.md` links all three, mirroring
  `content/data-features/heat-report/10-conclusion.md:48-52`, but with this page's own
  `<hr class=my-2>` rule rather than heat-report's `---`. Verified in the rendered HTML: three
  `<a href>` to `/data-features/rat-report-archive/{2023,2024,2025}/`, each resolving to a file
  that exists in the same build output.
