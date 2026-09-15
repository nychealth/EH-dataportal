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

| Task | State | Proof that ran |
|---|---|---|
| 0. Send numeric discrepancies to partner | **DONE 2026-09-14** — `c73fd0451c` — partner confirmed the tables were right; all five prose figures corrected | each figure re-derived before writing; verified in the rendered HTML, each new figure n=1 and each old one n=0 |
| 1. Archive the 2025 report to `2025/` | **DONE 2026-09-14** — `6020832f59` | `cmp` exit 0; both 48,992 bytes / 404 lines |
| 1a. Publish the archives (Decision D2) | **DONE 2026-09-14** — `0122a3c4e4` | isolated build exit 0, 0 ERROR; 3 archive `index.html` in the output where there were none; en sitemap 736 → 739 `<loc>` |
| 2. Rewrite `index.md` body from the docx | **DONE 2026-09-14** — `6b2055b407` | isolated build exit 0, 0 ERROR, 1206 EN pages; 4 id sets identical to the archived 2025 copy (29 buttons, 34 panels, 37 embeds, 29 `changeTable` calls), control: the 2025 title string differs |
| 3. Swap in the 2026 chart embeds | **BLOCKED on the 2026 charts** — Decision D1 says ship on option A | — |
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
- The source document sits at `documents/Annual Rat Mitigation Report 2026_08_31.docx`, gitignored
  at `5a60a06b27`. It is on disk in this worktree; a fresh clone will not have it.
- Worktree: `EH-dataportal.worktrees/update-rat-mitigation-report`.

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

Line numbers are against `index.md` as of `5a60a06b27`. Panel ids and button ids are what
`changeTable()` matches on — preserve both.

| Line | Table | Panel | Current ID | Zone (button label) |
|---|---|---|---|---|
| 73 | 1 | — | `EfIky` | single table |
| 105 | 2 | `table-2-1` | `bMzMo` | BX: Grand Concourse |
| 108 | 2 | `table-2-2` | `LAaPy` | MN: Harlem |
| 111 | 2 | `table-2-3` | `mVQJR` | MN: EV / Chinatown |
| 113 | 2 | `table-2-4` | `DKVEV` | BK: Bed-Stuy/Bushwick |
| 116 | 2 | `table-2-5` | `9i7xg` | Totals |
| 137 | 3 | `table-3-1` | `jaV7S` | BX: Grand Concourse |
| 140 | 3 | `table-3-2` | `PaKDr` | MN: Harlem |
| 143 | 3 | `table-3-3` | `pCGDW` | MN: EV / Chinatown |
| 146 | 3 | `table-3-4` | `f4qkK` | BK: Bed-Stuy/Bushwick |
| 148 | 3 | `table-3-5` | `szLTu` | Totals |
| 166 | 3a | `table-33-1` | `A4dTB` | BX: Grand Concourse |
| 169 | 3a | `table-33-2` | `ol6ho` | MN: Harlem |
| 172 | 3a | `table-33-3` | `JJRpq` | MN: EV / Chinatown |
| 175 | 3a | `table-33-4` | `18Wbr` | BK: Bed-Stuy/Bushwick |
| 189 | 4 | — | `sPNQu` | pest management visits, all zones |
| 194 | 4a | — | `KhvBm` | stoppage visits, all zones |
| 246 | 5 | `table-5-1` | `UqEDs` | BX: Grand Concourse |
| 250 | 5 | `table-5-2` | `Jm1m0` | MN: Harlem |
| 254 | 5 | `table-5-3` | `Lyets` | MN: EV / Chinatown |
| 258 | 5 | `table-5-4` | `RBGAy` | BK: Bed-Stuy/Bushwick |
| 261 | 5 | `table-5-5` | `9qR8g` | Totals |
| 282 | 5a | `table-5a-1` | `VIJdM` | BX: Grand Concourse |
| 286 | 5a | `table-5a-2` | `NwWcR` | MN: Harlem |
| 290 | 5a | `table-5a-3` | `2AJd4` | MN: EV / Chinatown |
| 294 | 5a | `table-5a-4` | `qx7lH` | BK: Bed-Stuy/Bushwick |
| 297 | 5a | `table-5a-5` | `glCLq` | Totals |
| 317 | 6 | `table-6-1` | `5Lv5f` | BX: Grand Concourse |
| 321 | 6 | `table-6-2` | `eEaFz` | MN: Harlem |
| 325 | 6 | `table-6-3` | `BXHue` | MN: EV / Chinatown |
| 329 | 6 | `table-6-4` | `FgeCo` | BK: Bed-Stuy/Bushwick |
| 332 | 6 | `table-6-5` | `HIVhB` | Totals |

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

**Proof:** `hugo --environment development` exits 0 with no ERROR lines. Build into temp
directories if a server is running, per `CLAUDE.md`:
`HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment development -d "$TEMP/iso-docs"`.

**Interfaces:** consumes the docx text and the Task 0 replies; produces the page body whose 32
embed slots Task 3 fills.

---

## Task 3: Swap in the 2026 chart embeds — BLOCKED

Blocked on Decision D1 below. Until it is settled, leave the 2025 embed IDs in place so the page
renders, and mark each of the 32 slots with `<!-- TODO 2026 chart -->` on the line above.

**Do not edit the existing 32 charts in Datawrapper.** After Task 1, those IDs are what the
`2025/` archive renders; editing them in place would silently rewrite a published report.

**Proof, once unblocked:** all 32 TODO markers gone
(`grep -c "TODO 2026 chart" content/data-features/rat-report/index.md` → 0), no 2025 ID surviving
(`grep -c -E "(EfIky|bMzMo|LAaPy|mVQJR|DKVEV|9i7xg|jaV7S|PaKDr|pCGDW|f4qkK|szLTu|A4dTB|ol6ho|JJRpq|18Wbr|sPNQu|KhvBm|UqEDs|Jm1m0|Lyets|RBGAy|9qR8g|VIJdM|NwWcR|2AJd4|qx7lH|glCLq|5Lv5f|eEaFz|BXHue|FgeCo|HIVhB)" content/data-features/rat-report/index.md`
→ 0), and a browser read of every panel against the docx tables. Join those greps with `;`, not
`&&` — `grep -c` exits non-zero on the zero count that is the answer.

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
- Whether a new `image:` screenshot is being supplied for the 2026 page.
- ~~Nothing links to the archives.~~ **Closed 2026-09-14** — `c73fd0451c`. A
  `### Previous reports` block at the end of `index.md` links all three, mirroring
  `content/data-features/heat-report/10-conclusion.md:48-52`, but with this page's own
  `<hr class=my-2>` rule rather than heat-report's `---`. Verified in the rendered HTML: three
  `<a href>` to `/data-features/rat-report-archive/{2023,2024,2025}/`, each resolving to a file
  that exists in the same build output.
