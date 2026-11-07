# R11: Search metadata and languages (2026-11-06)

Batch R11 of `documents/site-wide-audit-2026-10.md` (Roadmap): 1 P1 row (N-097) and 10 P2 (A-086,
A-104, A-129, N-073, N-074, N-075, N-078, N-081, N-095, N-099), on branch
`feature-audit-r11-search-metadata`, cut from the local `production` at `b730ddf7d3`. This document
is the plan and the ledger. Rows are closed in the audit document only once their proof has run.

**Status as of 2026-11-06: Tasks 0–7 done (`d6c2c91312`..`fa99cd800d`, `ba495ea83a`); Task 8
smoke and Pagefind done, site-characterization re-baseline owed; Task 9 after.**

## Decisions

Taken by Chris on 2026-11-06:

- **N-097: stop building es and zh taxonomy pages**, and point the es/zh stories' keyword links at
  the English term pages. Rejected: translating `list.html`'s heading through `i18n/` files (needs
  Spanish and Chinese strings someone can vouch for, and leaves the stories' own English
  "Keywords:" label), and keeping the pages under `noindex` (fixes search, leaves the WCAG 3.1.1
  mismatch).
- **N-078: unintended — fix it.** The new explorer's topic pages get a route to Google Translate:
  a "Translate" dropdown in the explorer's nav bar (Chris, 2026-11-06, after Task 7's
  measurements).
- **A-104: declined.** Client rendering of explorer indicator text stays. The row becomes
  `OPEN (declined)`, Priority `— (declined)`, the form A-007 and A-237 already use.
- **N-073: Search Console instead.** The host root is outside this repo, so the sitemap is
  submitted through Google Search Console by whoever owns the property. No commit closes it.

Taken by Chris on 2026-11-06, after Task 7:

- **A-086: close it; the SVG-removal hack is fine.** A-086 is the umbrella over N-097, N-081 and
  N-078, all three fixed here. What remained was the Google Translate SVG-removal hack in
  `js_bottom.html` (`googleTranslateElementInit`), whose comment says those SVGs recalculate
  styles and are never shown; it is kept as deliberate and gets no row. Rejected: filing the hack
  as its own P3 row (proposed), and keeping A-086 OPEN narrowed to it.

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

- [x] Language code for zh: `zh-CN`. Correction: no code list for the website widget itself was
      found; `docs.cloud.google.com/translate/docs/languages` (fetched 2026-11-06, undated)
      documents the Cloud Translation API and lists Simplified Chinese as `zh-CN` or `zh`. The
      in-repo evidence carries more weight: the footer's own button passes `data-lang="zh-CN"` to
      the widget's `.goog-te-combo`. `js_bottom.html` had no page context, so both callers
      (`baseof.html`, `list.html`) now pass `.`.
- [ ] Proof: build counts (870 / 51 / 51 → 870 en, 8 es, 8 zh after Task 1, each with its
      language's code). Browser: on the es home page under an isolated server, the widget loads with
      no console error and the footer's English button translates the page.

## Task 7: N-078 — a translate route on explorer topic pages

**Files:** `themes/dohmh/layouts/partials/header-de.html` (the `.de-nav-bar`'s right-hand group,
before the Learn More button).

- [x] Measure two placements on a phone (375px) and a desktop (1280px) viewport.
      **Correction to (b):** `#global-language` sits inside `#global-header`, which on explorer
      pages is itself a collapse, closed by default and opened by the logo button — a control
      opening `#global-language` is two steps. So (b) became a "Translate" dropdown in the
      `.de-nav-bar`, beside Learn More and modelled on its "Take Action" dropdown, holding the
      footer's ten `.lang-select` buttons. (a) renders the footer's `#languages` list alone below
      the app on `excludeFooter` pages. Both reuse `main.js`'s `.lang-select` → `setLanguage`.
      #1548 was OPEN (head `f327314393`) and touches none of the files either variant edits, so
      all three arms were built on that head, to measure its phone layout.
      `[verified 2026-11-06: scripts/.sc-rebaseline/r11/placement-probe.mjs on
      data-explorer/asthma/?id=2380, control / t7a.patch / t7b.patch builds; output
      t7-placement.json, screenshots t7-shots/]`:

      | Arm | Width | Route visible on load | Keys to a language | Translates | Nav bar / map | Page height |
      |---|---|---|---|---|---|---|
      | control | 375 | none | — | — | 68px / top 280, 327px | 740 of 740 |
      | control | 1280 | none | — | — | 68px / top 131, 736px | 867 of 800 |
      | (a) footer list | 375 | no — starts at 772px, below the fold | 20 Tab | yes | unchanged | **964** of 740 |
      | (a) footer list | 1280 | no — starts at 899px | 24 Tab | yes | unchanged | 995 of 800 |
      | (b) nav dropdown | 375 | yes, at 24px | 4 Tab, Enter, 1 Tab | yes | unchanged | 740 of 740 |
      | (b) nav dropdown | 1280 | yes, at 22px | 4 Tab, Enter, 1 Tab | yes | unchanged | 867 of 800 |

      The control has no route but does initialize the widget (`.goog-te-combo` 1), so a route
      only has to reach `setLanguage`. (a) makes the phone page, which fits one screen on #1548's
      layout, scroll by 224px. Console errors other than resource loads: 0 in every arm.
- [x] Put both measurements to Chris: **(b), the nav-bar dropdown** (Chris, 2026-11-06). Rejected:
      (a), below the fold at both widths, 20–24 Tabs away, and it makes #1548's one-screen phone
      page scroll by 224px.
- [x] Proof, corrected from "43 of 43 topic pages reach `setLanguage` by keyboard": the build
      shows the route on every page and the browser shows keyboard reach on one, since all 41
      topic pages render the same partial. `[verified 2026-11-06: main-tree build of 8e4bf960d7 +
      the header-de.html edit; 41 data-explorer/*/ pages carry #translateToggle and had no other
      language route, data-index and indicator-catalog keep their footer and carry no dropdown,
      /data-explorer/ (also excludeFooter) gains it, and all 886 real pages now have a route.
      placement-probe.mjs on data-explorer/asthma/?id=2380: visible on load at 375 and 1280,
      4 Tab + Enter + 1 Tab to a language, page translated, 0 console errors; nav bar, map and
      page height identical to the t6 build (t7-final.json against t7-control-t6.json)]`. Smoke
      is Task 8.

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

- [x] A-086 decision: close it, no row for the hack (Decisions, above). Its fix-by cell names the three instances' commits.
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
| 1 | `d6c2c91312` | **DONE 2026-11-06** | `t1` vs baseline: real pages 972 → 886 (es 8, zh 8, 0 with the heading); the 86 removed are exactly es/zh `categories` 9, `keywords` 33, `tags` 1 each; en pages changed only by losing `hreflang="es|zh"` entries; es/zh pages only by the keyword links; 96 links into taxonomy paths, 0 unresolved, 0 into es/zh taxonomies. `r11_diff.py` 0 unexplained lines besides those and `build_datetime` |
| 2 | `3b1cd36f55` | **DONE 2026-11-06** | `t2` vs `t1`: `og:image` and `twitter:image` absolute, unpadded, resolving on 886 of 886, equal on 886; NR report misses 210 → 0; 0 unexplained lines |
| 3 | `330a7d1c4a` | **DONE 2026-11-06** | `t3` vs `t2`: head alternates on 24 pages (home, 6 stories, 404 × 3 languages), 24 with a self-entry, all absolute; sitemaps en 737/737, es 7/7, zh 7/7 `<loc>` absolute and 21/21 `xhtml:link` each; the index already absolute; 0 unexplained lines |
| 4 | `096f5a9b5c` | **DONE 2026-11-06** | `t4` vs `t3`: 88 pager pages (not 94 — Task 1 removed the 6 es/zh ones), 88 canonical to exactly their own URL and `og:url` equal; 0 of 798 non-pager pages moved either; 424 `page/` files before and after |
| 5 | `e7a20dfaf1` | **DONE 2026-11-06** | `t5` vs `t4`: robots `noindex` on 44 of 44 retired-explorer pages, `resources` 3 unchanged, 839 others `all`. Same build carries a whitespace trim of Tasks 2 and 4's template lines (`{{-`), which removed 6 blank lines per head — 3 they added and 3 already there; nothing else changed |
| 6 | `fa99cd800d` | **DONE 2026-11-06** | `t6` vs `t5`: `pageLanguage` en on 870 en, `es` on 8, `zh-CN` on 8; 0 unexplained lines. Browser A/B (`translate-ab.mjs`, baseline vs `t6`, es housing story's longest `<p>`, footer `français`, run twice): `en` arm keeps "hipotecarias" untranslated both runs, `es` arm gives "saisies immobilières" both runs; each arm reproduced its own output exactly; both arms log the same 404/`ERR_FAILED` resource lines. A first run on the es home page had no power: its sampled heading is English, and both arms translated it identically |
| 7 | `ba495ea83a` | **DONE 2026-11-06** | (b) nav-bar dropdown; route on all 886 real pages, keyboard reach and translation on asthma ?id=2380 at 375 and 1280, layout unchanged against `t6` (see Task 7) |
| 8 | | **In progress** — smoke and Pagefind done, re-baseline owed | On `8e4bf960d7` + Task 7's `header-de.html` edit. **Smoke** (`npm run smoke:prod_prod`): PASSED, 1103 pages, Pagefind index served; 1 page, `rat-report-archive/2023/`, failed under concurrency with `t.datasetSourceUrl is not a function` and was clean on the sequential re-check — the Datawrapper runtime signature recorded in `site-wide-audit-2026-06-27.md` and `smoke-workflow-plan-2026-08-26.md`, absent from this repo's code. **Pagefind** (`node scripts/pagefind-characterization.mjs --check`): exit 1, but the log is byte-identical to the same check on `production`'s `b730ddf7d3` (both in `scripts/.sc-rebaseline/r11/t8-pagefind*.log`), so R11 changes nothing in the index — expected, since `list.html`'s `<main>` carries no `data-pagefind-body` and the other edits are in `<head>` and the header. The committed baseline is behind `production` itself (2 rat-report archive pages newly indexed, word counts on 13 pages); not re-baselined here. **Site characterization** (`npm run characterize:site:prod_prod`): exit 1 as predicted, EHDP-data unmoved (`547482b9df`); 128 of 926 pages across two fields — 86 whole pages absent (43 es + 43 zh taxonomy pages, Task 1) and `controls.button` on 42 `data-explorer` pages, every one +11 (toggle + 10 languages, Task 7) with no other changed line. Past the 25-page re-check cap, so nothing was re-checked; all 128 have the causes just named |
| 9 | | Not started | |

Environment: baseline build at `C:/temp/r11/base`, per-task builds at `C:/temp/r11/t<N>`; rebuild
from `b730ddf7d3` if gone. Tasks 1–6 were built from a detached worktree, `C:/temp/r11/wt`
(remove with `git worktree remove --force C:/temp/r11/wt` when the batch closes), through
`bash scripts/.sc-rebaseline/r11/build.sh <tag>`, which applies the main tree's `git diff HEAD`
there first. Reason: while a `hugo serve --environment development --port 8080` ran in the main
tree (started 2026-11-05 22:48, not by this work), an isolated build started in the main tree
stalled at "Start building sites" twice, at 0.5s CPU, while the same diff built from the worktree in
31.8s. Chris had that server stopped on 2026-11-06; the main tree then built the same tree in
32.3s with measurements identical to `t6`. So the server blocked builds, and how is not
established (Hugo's `.hugo_build.lock` in the project directory is an untested guess). With no
server running, build in the main tree directly.

Next command:

Re-capture both committed baselines. `--expect` claims every field on the pages it covers, so tally the
result by key before committing it:

```bash
node scripts/site-characterization-rebaseline.mjs --expect "es/categories/**" --expect "es/keywords/**" --expect "es/tags/**" --expect "zh/categories/**" --expect "zh/keywords/**" --expect "zh/tags/**" --expect "data-explorer/**"
git diff -U0 -- scripts/site-characterization-baseline/ | grep -E '^[+-]\s+"' | sed -E 's/^([+-])\s+"([^"]+)".*/\1 \2/' | sort | uniq -c
# expect: only "button" lines, on data-explorer pages, plus the removed es/zh records and _meta.json
```
