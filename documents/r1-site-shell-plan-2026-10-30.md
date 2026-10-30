# R1: Site shell markup and languages (2026-10-30)

Batch R1 of `documents/site-wide-audit-2026-10.md` (Roadmap): 6 P1 rows and 4 P2, on branch
`feature-audit-r1-site-shell`, cut from the local `feature-resolve-audit-items` at `1705ee0d67`
(R4, not yet in `production`), so this branch's PR follows R4's. This document is the plan and the
ledger. Rows are closed in the audit document only once their proof has run.

**Closed 2026-10-30: all tasks done on `feature-audit-r1-site-shell`, `1705ee0d67..ab6ec0e071`
plus the ledger commit after it. All ten R1 rows and R4's N-003 FIXED by `cdfde6f2af`. N-103 and
N-104, found here, were added as OPEN rows in `1255e6bb02`. R4 reached `production` through #1524
(`095ebc5010`), merged into this branch at `245c4262e9`. Next for this batch: a PR into
`production`.**

## Decisions

Taken without the user, and each one can be reversed in one file:

- **N-076: es and zh headers link to the English Topics and About pages**, because only the English
  site has `key-topics` and `about` content. The other option is hiding both items on es and zh.
  English pages are reached from the es/zh header today through the logo and Explore menu, so this
  follows what the header already does. The lookup is `.Sites.Default` (the page method);
  `hugo.Sites` does not exist in the pinned Hugo 0.147.3 and failed the build on its first try.
- **A-097: `href="#"` action links become `<button type="button" class="nav-link …">`**, styled by a
  new `button.nav-link` rule in `assets/scss/_e-supplementary-classes.scss`. The first attempt
  reused `.no-btn-style` (the mobile menu toggle's class), and the pixel diff showed it stripping
  `.nav-link`'s padding from every header item, so it was replaced. The new rule strips only the
  browser's button chrome, sets `width: 100%` (a block `<a>` fills its `.nav-item` and a `<button>`
  shrinks to fit, which moved the mobile caret), and removes the outline on non-keyboard focus
  (reboot's `button:focus` ringed the toggle after a mouse click; the links showed nothing).
  One analytics side effect: `site.js` reports `click_url` as `href || data-target`, so header
  Subscribe clicks now send `#subscribeModal` where they sent `#`.
- **A-127: each separator `<hr>` moves inside `<li aria-hidden="true">`**, and the bare "All
  topics" link gets its own `<li>`. A screen reader's item count then matches the visible items.
- **N-050: `mx-0` on the two `.row`s that sit outside any container** (`_default/list.html`
  `div.row.mt-4`, `header-de.html` `div.row.bg-black.de-nav-bar`). `.de-nav-bar` already had
  `margin-left: 0 !important`, so there only the right margin changes.

## Instrument

- `scripts/site-a11y-audit.mjs prod_prod` with `A11Y_PAGES` set to `R1_PAGES` (below): axe 4.13.0,
  positive control, rendered-content control. axe reported no `list`, `listitem` or
  `aria-dialog-name` on any R1 page before the change. The dropdown menus and the subscribe dialog
  are `display: none` at rest, and axe skips hidden nodes. So for A-127, A-026 and N-080 the
  built-HTML sweep is the instrument, not axe.
- A built-HTML sweep (`sweep.py`, html.parser with an element stack, over the 970 real pages of an
  isolated `prod_prod` build; session scratchpad, numbers copied here). Its control is the audit's
  own counts: it reproduced 18,560 `lang-select` links, the empty About box on 51 of 51 es and zh
  pages, and 875 crumb self-links (the audit counted 873 at `b8f4b32fbd`).
- Header pixel diff: 35 screenshots per build (home, about, keywords/asthma, es home, the explorer;
  1280 and 400 wide; at rest, mobile menu open, each dropdown open), third-party hosts blocked.
  Floor: two base runs were byte-identical on 35 of 35.
- `node scripts/characterize-env.mjs prod_prod` for N-017 / N-050 (`overflow` field) and every
  other structural change; then `site-characterization-rebaseline.mjs --expect`.
- `node scripts/smoke-env.mjs prod_prod`, since the header partials are on every page.

`R1_PAGES`:

```
(home),es/,zh/,about/,data-stories/,data-stories/housing/,es/data-stories/housing/,zh/data-stories/housing/,keywords/asthma/,data-explorer/,data-explorer/asthma/?id=2380,key-topics/airquality/
```

## Ledger

| Task | Rows | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 0 | all: reproduce before fixing | *no commit* (measurement) | **DONE 2026-10-30** | Baseline, below |
| 1 | A-125 (and N-003's last node) | `cdfde6f2af` | **DONE 2026-10-30** | axe `link-name` |
| 2 | A-127, A-026 | `cdfde6f2af` | **DONE 2026-10-30** | sweep |
| 3 | A-097 | `cdfde6f2af` | **DONE 2026-10-30** | pixel diff, keyboard probe |
| 4 | N-076, N-077 | `cdfde6f2af` | **DONE 2026-10-30** | sweep, pixel diff |
| 5 | N-079, N-080 | `cdfde6f2af` | **DONE 2026-10-30** | sweep |
| 6 | N-050, N-017 | `cdfde6f2af` | **DONE 2026-10-30** | `scrollWidth`; characterization `overflowX` |
| 6b | N-003 (R4's row): the census's last two pages | `cdfde6f2af` | **DONE 2026-10-30** | runtime empty-link probe; characterization |
| 7 | smoke, characterization, re-baseline | re-baseline `c9b957f5ae` | **DONE 2026-10-30** | below |
| 8 | commit; close the rows in the audit | fixes `cdfde6f2af`, re-baseline `c9b957f5ae`, harness `ab6ec0e071`; rows closed in the ledger commit that follows them | **DONE 2026-10-30** | `close_r1.py` dry run then write, 11 rows; recount of every row's Status and Priority matches the new table (OPEN 27/67/132/2 = 228, FIXED 229) |

### Task 6b: N-003's remainder

R4 left N-003 open for A-125's home-page anchor. Fixing A-125 names that one, but the site-wide
census (characterization `links.noAccessibleText`) still read two pages after it, both outside
R4's 36:

- `data-explorer/mice-and-rats/` (and the retired explorer's copy): the topic markdown wrote
  `<a href="www.nyc.gov/rats">www.nyc.gov/rats.</a>`. Goldmark's linkify turns the inner text into
  a second anchor, the browser closes the outer one empty, and its `href` has no scheme anyway.
  Now `[www.nyc.gov/rats](https://www.nyc.gov/rats).` in both `content/data-explorer/mice-and-rats.md`
  and `content/data-explorer-old/mice-and-rats.md`.
- `data-features/heat-story/`: an icon-only `<a href="#communityScience">` (`heatstory.html`), now
  `aria-label="About the community science data"` with the icon `aria-hidden`.

`[verified 2026-10-30: empty-link probe (a[href] with no text, aria-label, title or alt) in Chromium
with EHDP-data allowed, on all three pages: 2, 2 and (old explorer) not run before; after, 0, 0
and 0; each page confirmed present in the build, and the fixed link read in the built HTML]`.

### Task 7

- Smoke: `[verified 2026-10-30, twice: node scripts/smoke-env.mjs prod_prod — 1187 pages clean on
  the tree before Task 6b, and again on the final tree]`.
- Characterization: `[verified 2026-10-30, the tree before Task 6b: characterize-env.mjs prod_prod,
  924 of 924 differ, every difference explained]`. Per page: `controls.button` +9 (four dropdown
  toggles, three search, two Subscribe), `links.emptyHref` −9 and `links.internal` −9 (the `href="#"`
  links they were) on all 924; `links.internal` a further −1 on the 42 explorer pages (the anchor the
  parser cloned across `header-de.html`'s two title spans, A-026) and the en home (A-125's cloned
  anchor); +24 on the 98 other es/zh pages (11 topics × 2 menus, About × 2) and +23 on the es/zh home
  (less A-125's clone); `overflowX` true → false on 552, still true on 6 (N-017's stamp lists them),
  false → true on 0; `links.noAccessibleText` 1 → 0 on the three home pages.
- Re-baseline: the first run (`--expect "**"`, both keys) reported "Nothing unexplained", and its
  `git diff -U0` tallied by key held only those fields: `button`, `emptyHref`, `internal` 1,848 lines
  each (924 × 2 keys), `overflowX` 1,104, `noAccessibleText` 6, twelve new `internalTargets` (the 11
  topic pages and `/about/`) 200 times each, and `_meta.json`'s provenance. Task 6b then moved two
  more pages; the tool refuses a dirty baseline directory, so the first run was discarded and the
  combined re-run is the one to commit. `[verified 2026-10-30, final tree: rebaseline.mjs --expect
  "**", "Nothing unexplained" for both keys; git diff -U0 tallied by key: the first run's fields
  unchanged, plus noAccessibleText on 5 pages × 2 keys (the 3 home pages and the 2 of Task 6b) and
  one internal target removed, /data-explorer/mice-and-rats/www.nyc.gov/rats (the scheme-less href),
  × 2; 1,850 files, +9,064 −6,666]`.

### Harness fix

Separate from R1, from the lessons pass after it, `ab6ec0e071`: `scripts/isolated-server.mjs` (keeps
Hugo's output and fails as soon as the server exits, printing it; before, a template error on the
first build read as a bare 200s timeout) and the `CLAUDE.md` bullet "Re-baseline after every
row's own proof has run". `[verified 2026-10-30: positive control — a `hugo.Sites` call injected
into a clean partial made startServer fail after 37s with "exited (code 1)" and Hugo's render
error; the partial restored, `git status` clean on it; a normal start then served and copied the
build; docs-check PASSED]`. `CLAUDE.md`'s `docs-check verified` stamp was not bumped: the bullet
is new prose, and the stamp asserts a human re-read.

### Next commands

```
git rev-parse --abbrev-ref HEAD                      # feature-audit-r1-site-shell
git log --oneline --no-merges 095ebc5010..HEAD      # R1's commits: cdfde6f2af through 1255e6bb02, plus this ledger's
gh pr list --head feature-audit-r1-site-shell        # this branch's PR into production
```

The merge of `production` at `245c4262e9` changed no file: its tree equals its first parent's
(`f68d721fd6`), because `production` held nothing beyond R4's tip but #1524's merge commit. So the
re-baseline in `c9b957f5ae`, captured on top of R4, was not re-run. `[verified 2026-10-30: git
rev-parse HEAD^1^{tree} HEAD^{tree}, both f68d721fd6; git log 1705ee0d67..origin/production, one
commit, 095ebc5010]`

### Baseline and after

Both on the tree at `1705ee0d67`, the after on it plus this branch's R1 edits, measured before they were committed.

| Signal | Before | After |
|---|---|---|
| axe `link-name`, R1_PAGES | home, es, zh: 1 node each (`#featured-homepage`'s anchor) | 0 on every page |
| `<ul>` children that are not `<li>`, inside `#global-header` | en 27,300; es 408; zh 408 | 0 |
| `<li>` inside `<a>` (header-de) | 1,260 | 0 |
| tags with a duplicated attribute, in the header | 126 | 0 |
| `lang-select` links with `lang` | 0 of 18,560 | 18,560 of 18,560 |
| pages with an unnamed `role="dialog"` | 970 of 970 | 3 (home en/es/zh: `temp-popup.html`'s `#weatherModal`, not N-080's; see Found) |
| crumb links to the page itself | en 779, es 48, zh 48 | 0 |
| es / zh: empty About box | 51 / 51 | 0 / 0 |
| es / zh: header key-topic links | 0 / 0 | 1,122 / 1,122 (22 a page) |
| en header key-topic links | 19,107 | 19,096: the 11 key-topic pages each lose one, their own crumb (N-077) |
| `scrollWidth` at 1280 / 400, keywords/asthma and the explorer | 1296 / 416 | 1280 / 400 |

axe after-run: `[verified 2026-10-30: site-a11y-audit.mjs prod_prod, R1_PAGES, axe 4.13.0,
positive control FIRED, 12 of 12 rendered; violations link-in-text-block 4/17, color-contrast 3/6
(both R5), nested-interactive 1/1 (#map on the explorer, R2); link-name gone]`.

Pixel diff, final build: 18 of 35 shots byte-identical to base (every home and about shot, at rest
and with each menu open, at both widths). The 17 that differ are es (About and the topic list now
render), keywords (column re-centred and 20px narrower, no overflow) and the explorer (Learn More
and Take Action 16px left, back inside the viewport); each was looked at side by side.

Keyboard probe: on `about/` and the explorer, Space or Enter on each dropdown toggle, the search
button and the Subscribe button opens its target, 8 of 8. Focus outline `auto` on 7 of 8; the
eighth was focused programmatically right after a mouse click, which `:focus-visible` treats as
mouse focus. The probe blocked third-party hosts, and the explorer threw 3 errors (`reading
'find'`) that look like its blocked EHDP-data fetches; the smoke sweep is the check for those.

### Found, not fixed

Both are now audit rows, OPEN in batch R1: the weather dialog is N-103 and the header language N-104. `heat-report-correction.html` turned out to be named, and `conditional-modal.html` is included by no template.

- Three more `role="dialog"` elements have no accessible name: `conditional-modal.html`
  (`#prototypeModal`, three copies), `temp-popup.html` (`#weatherModal`, on the home pages) and
  possibly `heat-report-correction.html` (attributes span lines; not read). Not in N-080's scope.
- The header's chrome (Topics, Explore, About, Subscribe) is English on es and zh pages with no
  `lang="en"`; N-076's fix adds English topic titles to it. A WCAG 3.1.2 question for whoever owns
  the translations, not in any R1 row.
