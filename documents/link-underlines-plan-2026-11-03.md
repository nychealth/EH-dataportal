# Link underlines: narrowing R5's rule (2026-11-03)

R5 (`7f721b3aaa`, PR #1527) replaced `#primary-content p > a:not([class])` with
`main a:not([class])` in `assets/scss/_d-enhancements.scss`, underlining every unclassed link in
`<main>` to close audit rows N-004 and N-061 (axe `link-in-text-block`). Chris, 2026-11-03: the
underlines on the homepage's lists and the NR report's "What you can do" footer make those pages
harder to read; undo the change. This document compares the full revert with narrower rules,
records the decision, and is the ledger. Branch `feature-link-underlines-and-buttons`, cut from
the local `production` at `7618c577ee`. The `href="#"` conversion on the same branch has its own
plan: `documents/href-hash-to-buttons-plan-2026-11-03.md`.

**Status: decided 2026-11-03 (B, N-004 reopened narrowed, Task 4 not scheduled). See the ledger.**

## Decisions

Chris, 2026-11-03, accepting the recommendations: **1 = B**, with Task 4 not scheduled (the 15
nodes are recorded in N-004 instead); **2 as proposed**.

1. **Which rule.** Options, measured below:
   - **A. Full revert** to `#primary-content p > a:not([class])`.
   - **B. Paragraphs only:** `main p a:not([class])`. Recommended.
   - **C. B, then fix the 15 remaining axe nodes in their own markup** (Task 4). B and C are not
     alternatives: C is B plus a follow-up. The question is whether to schedule Task 4 now or
     file it as an open audit row.
   - **D. Keep R5's rule** and stop underlining specific blocks by giving their links a class.
     This is the smallest diff for your two examples. It leaves the other ~600 list and nav-style
     links underlined (571 on the data index alone), so it addresses your examples rather than
     the pattern.
2. **Audit rows.** Every option except D reopens N-004, and B leaves 15 of its 40 nodes.
   Proposed: N-004 goes back to OPEN, narrowed to the nodes left over (listed under Evidence), and
   N-061 stays FIXED. N-061's finding was that the rule reached only `#primary-content`, and B
   reaches every `<p>` in `<main>`. Option A would reopen N-061 too.

Option not taken: making link colour alone pass. WCAG 2.x's technique G183 allows colour as the
only cue when the link differs from the surrounding text by 3:1 and gets a non-colour cue on hover
and focus. The link green `#007A31` is **2.81:1** against body text `#212529`, so this route means
changing the link colour site-wide, which is a design decision outside this plan
`[measured 2026-11-03 on the live site: computed colours of prose links on realtime-air-quality
and housing; the same computation read 4.48:1 for a black link on #6C757D text, as a control]`.

## Evidence

### axe `link-in-text-block`, live site, 2026-11-03

Method: on each live page, the `main a:not([class])` rule was deleted from the page's own
stylesheet through the CSSOM and the candidate rule inserted at the same index, so every other
rule kept its cascade position. axe-core 4.13.0 (R5's version) ran `link-in-text-block` after each
swap. Pages: R5's 16 (`R5_PAGES` in `documents/r5-contrast-focus-plan-2026-10-30.md`) plus
`neighborhood-reports/ridgewood_forest_hills/climate_and_health/` and
`neighborhood-reports/ridgewood_forest_hills/`.

| Rule | Violations (nodes / pages) | Incomplete |
|---|---|---|
| Current, `main a:not([class])` | 0 / 0 | 0 |
| No underline rule | 57 / 11 | 3 |
| A, `#primary-content p > a:not([class])` | 40 / 9 | 1 |
| B, `main p a:not([class])` | 15 / 5 | 0 |

The instrument reproduces R5's own before-number: arm A gives 40 nodes on 9 pages, which is what R5
recorded on its build before the change `[r5 plan, Task 5 row]`. The no-rule arm, at 57, is the
positive control: removing every at-rest underline must flag more than any candidate does.

The 15 nodes B leaves, all links inside sentences that are not in a `<p>`:

| Page | Nodes | Where |
|---|---|---|
| `about/` | 3 | "Other resources" `<li>`s: "EpiQuery: Analyze and visualize…", Community Health Profiles, Health Topics A to Z |
| `data-explorer/data-index/` | 2 | the same "Other resources" list: EpiQuery, Community Health Profiles |
| `data-stories/housing/` | 3 | take-action `<li>` ("you may be eligible for a free home assessment"), and two source `<li>`s |
| `data-features/congestion-pricing-report/` | 2 | one sentence in a `<div>` ("The documented benefits of congestion pricing — reduced congestion, …") |
| `data-features/hvi/` | 5 | factor descriptions in `<td><div class="fs-sm">`: surface temperature, air conditioners, tree / grass / UHI |

### Which links each rule underlines

Visible links in `<main>`, classified by which rules underline them (C = current, R = revert,
P = paragraphs only). `C--` means underlined today and plain under both A and B. `C-P` means
plain under A and kept under B: that column is where A and B differ.

| Page | `CRP` (all three) | `C-P` (B keeps, A drops) | `C--` (both drop) |
|---|---|---|---|
| home | 2 | 0 | 24: topic list, new-data list |
| NR report (Ridgewood, climate) | 0 | 0 | 10: "What you can do", other topics, map attribution |
| NR neighborhood index (Ridgewood) | 0 | 5: "See report" | 3: map attribution |
| `data-stories/` | 0 | 0 | 44: story card links with no text (image wrappers) |
| `data-explorer/data-index/` | 0 | 0 | 571: the indicator table, plus "Other resources" |
| `about/` | 6 | 0 | 4: "Other resources" |
| `data-stories/housing/` | 3 | 1: "Email your elected officials" | 14: Español / 中文 links, indicator links ("Housing maintenance", "Neighborhood poverty", …), take-action and source lists |
| `data-stories/urban-heat-island/` | 10 | 1: "Email your elected officials" | 6: take-action list, Open Data link |
| `key-topics/airquality/` | 0 | 0 | 3: links with no text |
| `data-features/hvi/` | 0 | 9: intro and "learn more" prose | 5: the factor table |
| `data-features/realtime-air-quality/` | 0 | 16: methods prose, community monitor list, contact | 3: map attribution |
| `data-features/congestion-pricing-report/` | 5 | 6 | 15: sources list, map attribution, benefits sentence |

Pattern: A also drops underlines from real prose, because the data-features pages and the
story footer's "Email your elected officials" paragraph are outside `#primary-content`. B keeps
those and drops list and navigation links. That's why B is recommended over A.

Screenshots of 20 blocks under all three rules, captured from the live site at 1280px:
`.playwright-mcp/uc2/compare.html` (git-ignored, so it exists only on the machine that captured
it; re-capture by re-running the `browser_run_code_unsafe` script from the session of 2026-11-03,
or by hand with the CSSOM swap described above).

Two side findings, neither acted on:

- The homepage's "See all topics" carries `class=""`, which `a:not([class])` does not match, so
  under R5 it is the one topic-list link left plain (`themes/dohmh/layouts/index.html:51`). It
  is plain under A and B too, so this disappears with either option.
- `.link-w-underline` (`assets/scss/_de-custom.scss:255`) draws a bottom border on the
  homepage's topic list items; it is not a text underline and none of the options touch it.

## Tasks

Tasks 1 to 3 assume Decision 1 = B. For A, Task 1's selector becomes
`#primary-content p > a:not([class])` and Task 3 reopens N-061 as well.

## Task 1: Replace the rule

**Files:** `assets/scss/_d-enhancements.scss:318-329`

Replace `main a:not([class])` with `main p a:not([class])`. Rewrite the comment above it to say
why: links inside sentences need a non-colour cue, while lists and navigation links are told
apart by their layout. Name this document and Chris's decision date. The `.breadcrumb` rule
becomes inert under B if no breadcrumb sits inside a `<p>`. A grep for `<p` in the three lines
above each `class="breadcrumb` in `themes/` found none (2026-11-03), but that probe cannot see a
`<p>` opened further up. Check one built page per breadcrumb template before deleting the rule;
otherwise keep it.

Expected: one selector changed, comment rewritten, nothing else in the diff.

## Task 2: Prove it on a built site

1. `node scripts/characterize-env.mjs prod_prod`. Expected: structure PASSED on every page. An
   underline is not a recorded field, so a failure here means something else moved.
2. `scripts/site-a11y-audit.mjs prod_prod` with `A11Y_PAGES` set to `R5_PAGES` plus the two NR
   pages above. Expected: positive control FIRED, `link-in-text-block` 15 violations on 5 pages,
   the same nodes as the Evidence table. A different count means the live-site simulation and
   the build disagree, and that has to be explained before Task 3.
3. Browser check of your two examples on the isolated build: homepage topic list and NR report
   footer links read `text-decoration-line: none`, and a prose link on
   `data-features/realtime-air-quality/` reads `underline`.

`smoke` is not needed: the change is one CSS selector and executes no JavaScript.

## Task 3: Update the audit

**Files:** `documents/site-wide-audit-2026-10.md`: N-004's row, the count table, the status
paragraph, the Roadmap's P1+P2 total and the batch it lands in (the five places the status
paragraph names for closing a row, used here to reopen one).

N-004 → OPEN, narrowed to the 15 nodes, citing this document and Task 2's run. Re-derive the
counts with the recount method in the `project-audit-recount-method` memory (EH-dataportal
store), reproducing the current table on the parent tree first.

## Task 4 (only if Decision 1 = C): fix the 15 nodes in their markup

One commit per page, each verified by axe on that page:

- `about/` and `data-explorer/data-index/` "Other resources": the link starts a description
  ("EpiQuery: Analyze…"). Wrapping each item's text in a `<p>` would bring it under the rule.
  Find the source first (template or content file); both pages show the same list, so it may be
  one partial.
- `data-stories/housing/`: the take-action and sources `<li>`s, the same way.
- `data-features/congestion-pricing-report/`: the benefits sentence's `<div>` becomes a `<p>`.
- `data-features/hvi/`: the table cells' `<div class="fs-sm">` becomes `<p class="fs-sm mb-0">`.

Expected per commit: axe `link-in-text-block` reads 0 on that page, and site characterization
passes. Turning a `<div>` into a `<p>` can change `headingLevels` or spacing, so check the page
visually too.

## Ledger

| Task | Commit | Status | Proof that ran |
|---|---|---|---|
| Evidence | *no commit* (measurement) | **DONE 2026-11-03** | live-site axe and underline classification above |
| 1 | | **DONE 2026-11-03** | `assets/scss/_d-enhancements.scss`: `main p a:not([class])`. A `main p .link-button` beside it, for in-sentence buttons, was removed the same day when Chris kept in-sentence actions as links. The `.breadcrumb` rule is kept: not checked on a built page per breadcrumb template, so not deleted |
| 2 | *no commit* (proof) | **DONE 2026-11-03** on the edited tree over `7618c577ee`, isolated `prod_prod` | `site-a11y-audit.mjs` with R5's 16 pages + the two NR pages: axe 4.13.0, positive control FIRED, 18 of 18 rendered, `link-in-text-block` 5 pages / 15 nodes, the same 15 as the Evidence table. Two other violations (`image-alt` on racial-wealth-gap, `aria-hidden-focus` on heat-syndrome) are in files this branch does not touch; the second reads the same focusables live. Browser: homepage topic list and NR report footer `text-decoration-line: none`, realtime-air-quality prose `underline`. `characterize-env.mjs prod_prod`: only `controls.button` and `links` moved, from the buttons plan, none from this rule (an underline is no recorded field) |
| 3 | | **DONE 2026-11-03** | `documents/site-wide-audit-2026-10.md`: N-004 OPEN P1 in new batch R18, N-061's evidence amended, counts and Roadmap total. Recount reproduced `HEAD`'s table first (OPEN 1/47/132/2 = 182, FIXED 281), then read OPEN 2/47/132/2 = 183, FIXED 280; batch check: R18 OK, ordered, 49 ids = OPEN P1/P2. It also flags R1, R4 and R7's closing cells naming row ids, which `HEAD` has too |
| 4 | | **not scheduled** (Decision 1) | N-004 / R18 carries it |

Next: commit, together with the buttons plan's work. See that plan's ledger for what is still open.
