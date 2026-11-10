# Audit batch R18: in-sentence links outside paragraphs (2026-11-07)

Batch R18 of `documents/site-wide-audit-2026-10.md` is one row, N-004: 15 links inside sentences
that sit outside a `<p>`, so `main p a:not([class])` (`assets/scss/_d-enhancements.scss`, the rule
narrowed on 2026-11-03 in `documents/link-underlines-plan-2026-11-03.md`) leaves them plain and axe
`link-in-text-block` flags them. Branch `feature-audit-r18-link-underlines`, cut from the local
`production` at `b730ddf7d3`. This document is the ledger.

**Status as of 2026-11-07: Tasks 0–3 done on `feature-audit-r18-link-underlines`; N-004 stays OPEN, narrowed to the 8 list links.**

## Decisions

Chris, 2026-11-07:

1. **Fix the 7 non-list links in their own markup; leave the 8 list links.** The two
   sentences outside a `<p>` become `<p>`s, so the existing rule reaches them with no CSS change.
   These are congestion-pricing-report's benefits sentence (2 links) and hvi's three factor
   descriptions (5 links). The 8 links in `<li>`s stay plain: about/ (3), data-index (2) and the
   housing story's take-action and source lists (3). N-004 stays OPEN, narrowed to those 8.
   Rejected: an opt-in `.prose-links` class on those lists (one selector beside the rule), and a
   `<p class="mb-0">` inside each `<li>`. Either would close the 8.

Not acted on, recorded so it is not rediscovered: about/ (`themes/dohmh/layouts/about/section.html`,
"Browse other Health Department data resources") and data-index
(`themes/dohmh/layouts/data-explorer/data-index.html`, "Can't find what you're looking for?") open a
`<p>` and put a `<ul>` inside it. That is invalid HTML: the parser closes the `<p>` at `<ul>`, and
the original `</p>` becomes an empty paragraph. That is also why those list links fall outside
`main p`. It is left for the list decision above.

## Tasks

| # | Change | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Reproduce N-004 before fixing | *no commit* (measurement) | **DONE 2026-11-07** | `[verified 2026-11-07 on b730ddf7d3, isolated prod_prod: `node scripts/site-a11y-audit.mjs prod_prod` with `A11Y_PAGES` = R5's 16 pages + the two Ridgewood NR pages, axe 4.13.0, positive control FIRED, 18 of 18 audited: link-in-text-block 5 pages / 15 nodes, the same nodes as the 2026-11-03 Evidence table; also image-alt 1/1, aria-hidden-focus 1/1]` |
| 1 | congestion-pricing-report: benefits sentence `<div>` → `<p>` (`content/data-features/congestion-pricing-report/index.md`) | `10827ac57e` | **DONE 2026-11-07** | Task 3's audit |
| 2 | hvi: the three factor descriptions holding links, `<div class="fs-sm">` → `<p class="fs-sm mb-0">` (`themes/dohmh/layouts/data-features/hvi.html`, the factor table; the low-income description has no link and stays a `<div>`). Each held only text and `<a>`, so a `<p>` is valid; `.fs-sm` (`_e-supplementary-classes.scss`) has no element qualifier and `hvi.js` selects none of them | `10827ac57e` | **DONE 2026-11-07** | Task 3's audit |
| 3 | Re-run the audit; `node scripts/characterize-env.mjs prod_prod`; N-004's row, the R18 Touches cell and the Summary paragraph in the audit (no count changes: N-004 stays OPEN P1) | `10827ac57e` (audit edits in the ledger commit after it) | **DONE 2026-11-07** | `[verified 2026-11-07 on b730ddf7d3 plus 10827ac57e's two files, run before that commit: same audit command as Task 0, positive control FIRED, 18 of 18: link-in-text-block 3 pages / 8 nodes, all the `<li>` links on about/, data-index and housing, image-alt and aria-hidden-focus unchanged at 1/1; characterize-env prod_prod: 926/926 captured, structure PASSED against the baseline captured at 2e6e180b77]` |

Outputs for Tasks 0 and 3 are in the git-ignored `scripts/.sc-rebaseline/r18/` (`before/`, `after/`,
and `nodes.py`, which lists the `link-in-text-block` nodes per page from an output directory).

## Next command

Push and open a PR into `production`:
`gh pr create --base production --head feature-audit-r18-link-underlines`. No re-baseline is owed:
characterization passed unchanged.
