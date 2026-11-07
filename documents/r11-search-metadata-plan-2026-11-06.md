# R11: Search metadata and languages (2026-11-06)

Batch R11 of `documents/site-wide-audit-2026-10.md` (Roadmap): 1 P1 row (N-097) and 10 P2 (A-086,
A-104, A-129, N-073, N-074, N-075, N-078, N-081, N-095, N-099), on branch
`feature-audit-r11-search-metadata`, cut from the local `production` at `b730ddf7d3`. This document
is the plan and the ledger. Rows are closed in the audit document only once their proof has run.

**Status as of 2026-11-06: decisions taken, baseline measured, Task 0 done; Task 1 next.**

## Decisions

Taken by Chris on 2026-11-06:

- **N-097: stop building es and zh taxonomy pages**, and point the es/zh stories' keyword links at
  the English term pages. Rejected: translating `list.html`'s heading through `i18n/` files (needs
  Spanish and Chinese strings someone can vouch for, and leaves the stories' own English
  "Keywords:" label), and keeping the pages under `noindex` (fixes search, leaves the WCAG 3.1.1
  mismatch).
- **N-078: unintended — fix it.** The new explorer's topic pages get a route to Google Translate.
  Where it goes is Task 7's decision, taken after both placements are measured.
- **A-104: declined.** Client rendering of explorer indicator text stays. The row becomes
  `OPEN (declined)`, Priority `— (declined)`, the form A-007 and A-237 already use.
- **N-073: Search Console instead.** The host root is outside this repo, so the sitemap is
  submitted through Google Search Console by whoever owns the property. No commit closes it.

Proposed, not yet taken (Task 9 asks):

- **A-086** is the umbrella over N-097, N-081 and N-078. Once those three close, what remains is the
  Google Translate SVG-removal hack in `js_bottom.html` (`googleTranslateElementInit`). Proposed:
  close A-086 as covered by its three instances and file the hack as its own P3 row, so the
  umbrella does not stay OPEN with no instance left behind it.

Applied without a decision, each mechanical:

- **A-129 + N-075:** one processed image feeds both `og:image` and `twitter:image`, written
  absolute.
- **N-074:** sitemap `<loc>` and `xhtml:link`, and head `hreflang`, absolute, with each page listing
  itself.
- **N-095:** paginator pages are canonical to themselves.
- **N-099:** the retired explorer gets `noindex`, beside `resources` in `head.html`'s robots branch —
  consistent with its existing exclusion from page lists, the sitemap and Pagefind
  (`content/data-explorer-old/_index.md` cascade).
- **N-081:** Google Translate's `pageLanguage` follows the page's language.

## Evidence

Baseline: an isolated `prod_prod` build of `b730ddf7d3`
(`HUGO_RESOURCEDIR=C:/temp/r11/res-base npx hugo --environment prod_prod -d C:/temp/r11/base`, exit 0,
30.9s), measured by `scripts/.sc-rebaseline/r11/r11_measure.py` (copied out of the session
scratchpad in Task 0). Real pages are those carrying `head.html`'s `data-pagefind-meta="title:`
marker. Run it from Git Bash as
`MSYS_NO_PATHCONV=1 python scripts/.sc-rebaseline/r11/r11_measure.py <build> /IndicatorPublic/` —
without the prefix, Git Bash rewrites `/IndicatorPublic/` into a Windows path and every
file-existence probe misses (first run read og:image "missing" on 972 of 972; the files exist).

`[verified 2026-11-06 on b730ddf7d3]`, 972 real pages (en 870, es 51, zh 51):

| Row | Reading |
|---|---|
| N-097 | es 43 of 51, zh 43 of 51 carry "More content about" |
| N-074 | head hreflang on 223 pages, 0 with a self-entry, 223 all-relative. Sitemaps: en 737 `<loc>`, es 47, zh 47, 0 absolute; 141 `xhtml:link` each, 0 absolute |
| A-129 | `og:image` relative on 972, resolving on 972 |
| N-075 | `twitter:image` relative on 972, padded with a space on **972** (the row says 210), resolving on 762; the 210 that miss are exactly the NR report pages. The 762 are the positive control |
| N-081 | `pageLanguage: "en"` on 870 en, 51 es, 51 zh pages |
| N-095 | 94 paginator pages, 0 canonical to themselves |
| N-099 | 44 retired-explorer pages, robots `all` on 44 |
| N-078 | 43 `data-explorer/*/` pages, 41 without `lang-select` |

N-097 feasibility `[verified 2026-11-06]`: with `disableKinds = ["taxonomy", "term"]` under
`[languages.es]` only, the same isolated build exited 0 and es fell to 8 real pages, 0 carrying the
English heading, while zh — the unchanged arm — stayed at 51 and 43. The es stories then held 48
links into es taxonomy pages, all 48 unresolved (the probe fires); their 29 distinct targets all have
an English term page (0 missing). The config edit was reverted (`git status` clean).

N-078: no element in `themes/` opens `#global-language` (`header.html:228`, `header-de.html:168`;
the audit's `:161` has moved). Translation is driven by the footer's `.lang-select` buttons
(`footer.html`, two lists) through `main.js`'s `$('.lang-select').click` → `setLanguage`, and
`baseof.html:35` drops the whole footer when `excludeFooter` is set.

## Tasks

Every task's proof re-runs `r11_measure.py` on a fresh isolated `prod_prod` build of the working
tree, into `C:/temp/r11/t<N>`, and compares it to the baseline table above. Each task changes only
the fields it names; a second field moving is a finding, not noise.

## Task 0: Copy the instrument into the repo

**Files:** `scripts/.sc-rebaseline/r11/r11_measure.py` (git-ignored directory), from the session
scratchpad.

- [ ] Copy the script. Re-run it on `C:/temp/r11/base` and confirm it prints the baseline table.

## Task 1: N-097 — no es/zh taxonomy pages

**Files:** `config/_default/config.toml` (`[languages.es]`, `[languages.zh]`),
`themes/dohmh/layouts/partials/keywords.html` (the `href`, `relLangURL` → `relURL`).

**Interfaces:** consumes nothing; Task 3's hreflang counts are taken after this lands, since en term
pages lose their es/zh alternates here.

- [ ] Add `disableKinds = ["taxonomy", "term"]` to both languages.
- [ ] Change `keywords.html`'s link to `{{ "keywords/" | relURL }}`. On en pages `relLangURL` and
      `relURL` give the same path (English is not in a subdirectory), so en output is unchanged.
- [ ] Grep `themes/` for any other `relLangURL` into `categories/`, `keywords/` or `tags/`.
- [ ] Proof: es and zh at 8 real pages each, 0 carrying the heading; 0 links on es/zh pages into
      es/zh taxonomy paths; every keyword link on es/zh pages resolves. Diff the en pages against
      the baseline: the only change allowed is es/zh `hreflang` entries removed from en term pages.

## Task 2: A-129 + N-075 — absolute social images

**Files:** `themes/dohmh/layouts/partials/seo.html` (lines 13 and 20).

- [ ] Compute `$image` once (the existing `resources.Get` … `Fill "2400x1260"` for the page's
      `seo_image` or the default), and write both tags from `$image.Permalink`.
- [ ] Proof: `og:image` and `twitter:image` absolute, unpadded and resolving on 972 of 972; the
      two tags equal on every page.

## Task 3: N-074 — absolute sitemaps and hreflang with a self-entry

**Files:** `themes/dohmh/layouts/_default/sitemap.xml` (`.RelPermalink` → `.Permalink`, three
places), `themes/dohmh/layouts/partials/head.html` (the "content translations" block:
`.Translations` → `.AllTranslations`, `.RelPermalink` → `.Permalink`).

- [ ] Make both edits.
- [ ] Proof: 0 relative `<loc>` or `xhtml:link` in any language's sitemap; every page with
      alternates carries one for its own language and all are absolute; the set of pages carrying
      alternates is the baseline's 223 less those Task 1 removed. Validate one sitemap against the
      sitemaps.org schema's required shape (each `<url>` has one `<loc>`).

## Task 4: N-095 — self-canonical paginator pages

**Files:** `themes/dohmh/layouts/partials/seo.html` (lines 3 and 9).

- [ ] First, list the `.Kind` of the 94 pager pages' first pages, and confirm `_default/list.html`
      is the only template calling `.Paginator` (`grep -rn '\.Paginat' themes/` returned
      `list.html:35` alone on `b730ddf7d3`). Calling `.Paginator` from the head of a page whose
      template never paginates would create pager pages that do not exist today, so the canonical
      must read it only for the kinds `list.html` renders.
- [ ] Write a `$canonical` used by both `canonical` and `og:url`: the pager's URL on those kinds,
      `.Permalink` otherwise. Check the value is exactly
      `https://a816-dohbesp.nyc.gov/IndicatorPublic/<path>/page/<n>/`. If `absURL` drops or doubles
      the `/IndicatorPublic/` prefix on the pager's root-relative URL, build it from
      `site.BaseURL`'s scheme and host instead.
- [ ] Proof: still 94 pager pages; 94 canonical to themselves; every non-pager page's canonical
      byte-identical to the baseline.

## Task 5: N-099 — noindex the retired explorer

**Files:** `themes/dohmh/layouts/partials/head.html` (the `$robots` branch, beside `resources`).

- [ ] Extend the `resources` condition to `data-explorer-old`, and extend the comment above it with
      the reason (already out of lists, the sitemap and Pagefind).
- [ ] Proof: 44 of 44 retired-explorer pages `noindex`; every other page's robots value unchanged.

## Task 6: N-081 — Google Translate `pageLanguage`

**Files:** `themes/dohmh/layouts/partials/js_bottom.html` (`googleTranslateElementInit`).

- [ ] Fetch Google's language-code list for the Translate widget and record its URL and date here.
      Map en → `en`, es → `es`, zh → the code that list gives for Simplified Chinese (the footer's
      buttons already use `zh-CN`).
- [ ] Proof: build counts (870 / 51 / 51 → 870 en, 8 es, 8 zh after Task 1, each with its
      language's code). Browser: on the es home page under an isolated server, the widget loads with
      no console error and the footer's English button translates the page.

## Task 7: N-078 — a translate route on explorer topic pages

**Files:** decided in the task.

- [ ] Measure two placements on a phone (375px) and a desktop (1280px) viewport, against the
      site's breakpoints (`md` 720, `lg` 960): (a) the footer's compact `#languages` list rendered
      on `excludeFooter` pages; (b) a header-de control that opens `#global-language`, which
      `header-de.html` already declares and nothing opens. For each: whether the translate widget is
      reachable by keyboard, what it costs the pinned map on phones (`feature-de-mobile-layout`,
      #1548, changes that layout — rebase onto it if it has merged).
- [ ] Put both measurements to Chris; record the choice above.
- [ ] Proof: 43 of 43 topic pages reach `setLanguage` by keyboard; `npm run smoke` passes.

## Task 8: Guardrails and baselines

- [ ] `npm run smoke:prod_prod` (`head.html`, `js_bottom.html` and `header-de.html` changed).
- [ ] `node scripts/pagefind-characterization.mjs --check`: expect the es/zh taxonomy pages gone
      from the index and nothing else; re-baseline if so.
- [ ] `npm run characterize:site:prod_prod`: expect `meta` to move on every page (canonical,
      og:image, hreflang) and the es/zh taxonomy pages to disappear. Re-baseline with
      `node scripts/site-characterization-rebaseline.mjs --expect "<globs>"`, then tally
      `git diff -U0` by key — `--expect` claims every field on the pages it covers.

## Task 9: Close the rows

**Files:** `documents/site-wide-audit-2026-10.md` (each row, the count table, the Summary
paragraph, the Roadmap total, R11's batch row).

- [ ] Ask Chris for the A-086 decision (proposed above).
- [ ] FIXED with hashes: N-097, A-129, N-075, N-074, N-095, N-099, N-081, N-078. N-075's evidence
      gains the 972-padded finding.
- [ ] A-104 → `OPEN (declined)`, `— (declined)`.
- [ ] N-073 stays OPEN until the Search Console submission is done; record who submits and when.
- [ ] Recount every `A-`/`N-` row's Status and Priority, reproducing `HEAD`'s table first (method:
      the `project-audit-recount-method` memory).

## Ledger

| # | Commit | Status | Proof that ran |
|---|---|---|---|
| 0 | *no commit* — git-ignored | **DONE 2026-11-06** | re-run on `C:/temp/r11/base`; output (`scripts/.sc-rebaseline/r11/base-measure.txt`) identical to the session run's |
| 1 | | Not started | |
| 2 | | Not started | |
| 3 | | Not started | |
| 4 | | Not started | |
| 5 | | Not started | |
| 6 | | Not started | |
| 7 | | Not started | |
| 8 | | Not started | |
| 9 | | Not started | |

Environment: baseline build at `C:/temp/r11/base` (short path, for `git diff --no-index`); its
resource dir at `C:/temp/r11/res-base`. Neither is needed once Task 0 has copied the script —
rebuild from `b730ddf7d3` if gone.

Next command:

```bash
# Task 1, after the two edits:
HUGO_RESOURCEDIR="C:/temp/r11/res-t1" npx hugo --environment prod_prod -d "C:/temp/r11/t1"
MSYS_NO_PATHCONV=1 python scripts/.sc-rebaseline/r11/r11_measure.py C:/temp/r11/t1 /IndicatorPublic/
# expect: pages by lang en 870, es 8, zh 8; N-097 0 of 8 for both
```
