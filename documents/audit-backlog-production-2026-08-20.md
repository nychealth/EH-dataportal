# Audit backlog on `production` — 2026-08-20

**Goal:** land the easy and moderate audit findings that are open on the tree `production` is about
to become, in three deployable branches. Every item below was re-verified against `merge/production`
at `a67f957ba7` on 2026-08-20 — not taken from the audit's own status line, because most of these
read as FIXED in a document that was written against a feature branch where they were.

**Base:** branch off `production` **after** PR [#1473](https://github.com/nychealth/EH-dataportal/pull/1473)
merges, from the merge commit. Decided 2026-08-20. Rejected: committing into the open PR, which would
invalidate the 33/33 smoke run it cites at `31b08a3aa2` and delay the deploy behind 20+ review items.

**Not in scope:** the Congestion Pricing analytics instrumentation
([`cp-report-analytics-events.md`](cp-report-analytics-events.md), 7 tasks, all unstarted) — deferred
by decision 2026-08-20, unchanged by anything here.

---

## Ledger

**Status as of 2026-08-20: nothing started. Every task Not started, and all of them BLOCKED on PR
#1473 merging.** This document is committed on `merge/production`, so it arrives on `production` with
that PR and is already in place when the three branches below are cut.

| # | Task | Branch | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Merge `upgrade-GHA-dependencies` | (its own) | BLOCKED on #1473 | — |
| 1 | Header logo `alt` + link name | A | BLOCKED on #1473 | — |
| 2 | Duplicate `id="languages"` | A | BLOCKED on #1473 | — |
| 3 | Duplicate `data-toggle` ×3 | A | BLOCKED on #1473 | — |
| 4 | `<a><li>` ×6 | A | BLOCKED on #1473 | — |
| 5 | Site-title `<a>`/`<span>` overlap | A | BLOCKED on #1473 | — |
| 6 | Unlabeled `<nav>` landmarks | A | BLOCKED on #1473 | — |
| 7 | 16 `<img>` with no `alt` | A | BLOCKED on #1473 | — |
| 8 | 19 doubled `class` attributes | A | BLOCKED on #1473 | — |
| 9 | Gate `g-dev-tools.scss` by environment | A | BLOCKED on #1473 | — |
| 10 | `<html lang>` from the page's language | B | BLOCKED on #1473 | — |
| 11 | `robots.txt` production body + `Sitemap:` | B | BLOCKED on #1473 | — |
| 12 | Collapse the stacked `robots` metas | B | BLOCKED on #1473 | — |
| 13 | `<title>` brand suffix | B | BLOCKED on #1473 | — |
| 14 | Vestigial metas out; `canonical`/`og:url` absolute | B | BLOCKED on #1473 | — |
| 15 | `click_how_caclulated` misspelling | B | BLOCKED on #1473 | — |
| 16 | `click_subscribe` fires twice — confirm, then fix | B | BLOCKED on #1473 | — |
| 17 | `#skip-header-target` de-duplication | C | BLOCKED on #1473 | — |
| 18 | flexdatalist combobox port, 5 call sites | C | BLOCKED on #1473 | — |
| 19 | `$primary`-as-text contrast sweep | C | BLOCKED on #1473 | — |
| 20 | Port the guardrails (`lint`, `docs-check`) | C | BLOCKED on #1473 | — |
| 21 | JSON-LD: Organization, WebSite, BreadcrumbList | C | BLOCKED on #1473 | — |
| 22 | Reconcile the audit records | C | BLOCKED on #1473 | — |

**Two open questions, neither blocking any task above.** Whether `content/resources/` should stay
`noindex` in production (Task 12 records it, changes nothing); and whether `click_how_caclulated`
should be renamed at all, given GA4 event-name continuity (Task 15).

**Environment state a cold session needs.** The work is planned from the
`EH-dataportal.worktrees/merge/production` worktree, which has `node_modules` installed; `production`
is checked out in the main repo directory (`Documents/DOHMH/Programming/EH-dataportal`). A hugo
process was running on 2026-08-20 that this planning session did not start — **never start a second
builder**; `scripts/dev-server.mjs` probes :8080, :8081 and :1313 and reuses what it finds.

**Execute these directly, not through subagents.** Every task here is grep- or lint-provable against
a standing harness; a subagent would re-derive the file list this document already holds.

---

## Branch A — shared shell and page templates

Markup and accessibility fixes. Every one lands in a partial or layout that renders on every page,
which is what sets the verification bar: `npm run smoke` (33 pages) is mandatory before merge, per
CLAUDE.md's rule for `header.html` / `footer.html` / `baseof.html`.

Branch name: `hotfix-audit-markup-a11y`.

### Task 1: Give the header logo an accessible name

**Files:** `themes/dohmh/layouts/partials/header.html:75` — the `<a href={{ relURL "" }}>` wrapping an
`<img>` of `7618350_heatmap_business_analytics_statistics_icon-gpr.ico`.

The `<img>` carries no `alt`, so the link that wraps it has no accessible name at all. Two axe rules
fire on it: `image-alt` (critical) and `link-name` (serious), on every page of the site —
[`nr-accessibility-audit-2026-08-10.md`](nr-accessibility-audit-2026-08-10.md) §3.

1. Add `alt="Environment & Health Data Portal home"` to the `<img>`. Not `alt=""` — the image is the
   only content of the link, so an empty alt leaves the link unnamed, which is the worse of the two
   failures.
2. Expected: the link's computed accessible name is that string, and both rules stop firing on it.

### Task 2: One `id="languages"`

**Files:** `themes/dohmh/layouts/partials/footer.html:9` and `:48` — two
`<div class="container py-3 …">`.

1. Read both. `:9` carries `d-none`, `:48` carries `d-print-none`; they are different elements, so
   this is a rename, not a deletion.
2. Rename one and update every reference. Element-id renames get their own commit (CLAUDE.md), and
   the grep is four-surfaced — JS, templates, SCSS, ARIA attributes:
   `grep -rn 'languages' assets/js assets/scss themes/`
3. Expected: `grep -c 'id="languages"' themes/dohmh/layouts/partials/footer.html` returns 1, and no
   reference points at a name that no longer exists.

### Task 3: Remove the duplicate `data-toggle`

**Files:** `themes/dohmh/layouts/partials/header.html:188`, `:244`, `:347` — each ends
`data-toggle="modal" data-target="#searchModal" title="Search" data-toggle="collapse">`.

HTML parsers keep the **first** attribute and drop the rest, so `modal` is what Bootstrap already
sees and deleting the trailing `data-toggle="collapse"` should be inert.

1. Delete the trailing `data-toggle="collapse"` on all three lines.
2. Expected: `grep -c 'data-toggle.*data-toggle' header.html` → 0.
3. "Should be inert" is a claim about a parser, not an observation: open the search modal from the
   desktop header, the mobile header and the third call site, and confirm each still opens.

### Task 4: `<a><li></li></a>` → `<li><a></a></li>`

**Files:** `themes/dohmh/layouts/partials/header.html:107`, `:110`, `:157`, `:266`, `:269`, `:316`.

An `<a>` may not contain an `<li>`; browsers recover by restructuring the DOM, which means the CSS
that styles these menus is matching against a tree that is not what the template says.

1. Invert each: the `<li>` becomes the outer element, the `<a>` the inner one, classes staying on the
   element they are on now.
2. Expected: `grep -cE '<a[^>]*>[[:space:]]*<li' header.html` → 0.
3. **This one can move pixels** — the recovered DOM and the corrected DOM are different trees. Take a
   before screenshot of the desktop menu, the mobile menu and the section menu, and diff after.

### Task 5: Un-cross the site title

**Files:** `themes/dohmh/layouts/partials/header.html:78-79`. The `<a>` opens inside
`<span class="site-subtitle">` and closes inside `<span class="site-title">`.

1. Restructure so the `<a>` wraps both spans. The visible text is "Environment & Health" + "Data
   Portal", one link to the home page, so wrapping both preserves the current behavior.
2. Expected: the spans and the anchor nest cleanly, and the title still reads as one link.
3. Same screenshot check as Task 4; these are adjacent lines and belong in one commit with it.

### Task 6: Label the navigation landmarks

**Files:** `themes/dohmh/layouts/partials/header.html:94` and `:253`,
`themes/dohmh/layouts/partials/footer.html:71`, `themes/dohmh/layouts/partials/header-ds.html:69`.

Each is `<nav … role="navigation">` with no accessible name, so a screen reader lists two or three
identical "navigation" landmarks per page (`landmark-unique`, moderate) —
[`nr-accessibility-audit-2026-08-10.md`](nr-accessibility-audit-2026-08-10.md) §3.

1. Add a distinguishing `aria-label` to each: the header pair by what they contain (they are the
   desktop and mobile renditions of the same menu — label by menu, not by viewport, since only one is
   in the tree at a time), the footer one "Footer", the data-stories one by its section.
2. `role="navigation"` on a `<nav>` is redundant; leave it rather than widen the diff.
3. Expected: on one page, every exposed navigation landmark has a distinct name.

### Task 7: `alt` on the 16 images that have none

**Files:** 16 `<img>` across 9 layouts — `index.html` ×5 (`:111`, `:186`, `:204`, `:223`, `:244`),
`data-features/cooling-info.html` ×4, and one each in `components.html`,
`data-features/minimum-wage-with-maps.html`, `data-features/rat-info-portal.html`,
`data-features/resourceportal.html`, `data-features/restaurant-grades.html`,
`partials/nyccas_pollutant_maps.html`. (`partials/header.html` holds the 16th; that is Task 1.)

The audit records this as the home page's card images (§14.2); the sweep found nine files
`[verified 2026-08-20: grep -rn "<img" themes/dohmh/layouts/ filtered to lines without alt=]`.

1. The five `index.html` card images are **decorative** — each sits in a card whose visible `<h3>`
   already names the destination, so `alt=""` is correct and descriptive text would double the
   announcement.
2. The other ten are not decided here. Open each and decide decorative (`alt=""`) or informative (a
   sentence naming what the image shows). Record the decision per file in the commit message; a wrong
   `alt` is harder to spot later than a missing one.
3. Expected: no `<img>` in `themes/dohmh/layouts/` lacks an `alt` attribute.

### Task 8: One `class` attribute per element

**Files:** 19 occurrences in 7 files — `data-stories/section.html` ×9, `data-features/section.html`
×3, `components.html` ×2, `key-topics/single.html` ×2, and one each in `about/section.html`,
`index.html`, `partials/nr-chooser.html`.

Every one is the same shape: `<a class="text-black" href="…" class="text-primary">`. The parser keeps
the first and discards the second, so these elements are `text-black` and the `text-primary` was
never applied. §14.1 describes it as a single instance; it is 19.

1. Merge each pair into one attribute — **and decide which classes survive**. Keeping both
   (`class="text-black text-primary"`) is a color change on 19 links, because `text-primary` was
   inert. Keeping only `text-black` is the no-op, and is the default here unless someone wants the
   green.
2. Expected: zero elements carrying two `class` attributes, and the rendered links look identical to
   before.

### Task 9: Keep dev tooling out of the production stylesheet

**Files:** `assets/scss/theme.scss:23` — `@import "g-dev-tools.scss";`, unconditional.

1. Read `assets/scss/_g-dev-tools.scss` first and record what it contains. If it is empty or inert,
   the finding is a doc correction, not a change — say so and close it.
2. If it carries real rules, gate the import on `hugo.Environment`. Hugo compiles the SCSS through
   `resources.ToCSS`, so the gate belongs where the partial is chosen, not inside the SCSS.
3. Expected: a `prod_prod` build's stylesheet does not contain the dev rules; a `development` build
   does. Diff the two generated CSS files rather than reading the template.

### Branch A verification

Cheapest-first, stopping at the first rung that would catch a break for this change:

1. Isolated build, so it cannot race the running server —
   `HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment prod_prod -d "$TEMP/iso-docs"`. Expect
   exit 0 and zero ERROR lines.
2. `grep` the generated HTML under `$TEMP/iso-docs` for each task's expected count. That is the
   evidence — not the template diff.
3. `npm run smoke` — expect `Smoke test PASSED — 33 pages clean`. A CORS error from `airnowapi.org`
   on `(home)` is external; re-run before diagnosing it.
4. Browser: the header/footer screenshot diffs Tasks 4–5 require, plus the modal clicks from Task 3.

---

## Branch B — SEO, metadata and analytics

Branch name: `hotfix-audit-seo-meta`.

### Task 10: Emit the page's real language

**Files:** `themes/dohmh/layouts/_default/baseof.html:2` and
`themes/dohmh/layouts/_default/list.html:2` — both `<html lang="en" dir="ltr">`.

Fourteen translated pages (7 `.es`, 7 `.zh`) ship `lang="en"`, contradicting the `hreflang` alternates
emitted a few lines later in `head.html`, which get each page's language right.

1. Replace with `<html lang="{{ .Language.Lang }}" dir="ltr">` in both files.
2. Expected: in a built site, the `.es` output carries `lang="es"`, the `.zh` output `lang="zh"`, and
   English pages are unchanged. Grep all three from `$TEMP/iso-docs`, not one page.

### Task 11: A production `robots.txt` with a body

**Files:** `themes/dohmh/layouts/robots.txt` — currently emits nothing at all under `production` and
`prod_prod`, so no `Sitemap:` directive reaches any crawler.

This is a **file copy, not a rewrite**: the NR retirement work already wrote the version to use, with
its allow-all decision and rationale in comments.

1. `git show feature-MOD-Lab-NR-recode-refactor:themes/dohmh/layouts/robots.txt > themes/dohmh/layouts/robots.txt`
2. Read the result. It inverts the environment condition (production gets the body, previews get the
   blanket `Disallow`), and adds `User-agent: *` / `Disallow:` plus
   `Sitemap: {{ "sitemap.xml" | absURL }}`.
3. Expected: `$TEMP/iso-docs/robots.txt` under `prod_prod` contains a fully-qualified `Sitemap:` line;
   a `development` build still emits the per-page `Disallow` list and **no** `Sitemap:` line. Build
   both and read both — the whole point of this file is that it differs by environment.

### Task 12: One computed `robots` meta

**Files:** `themes/dohmh/layouts/partials/head.html:18`, `:27`, `:43`.

Line 18 (`content="all"`) or line 27 (`noindex, nofollow`) fires from the environment branch, and line
43 adds a second, unconditional `noindex` for `.Section == "resources"`. On a production build of a
`resources` page, two robots metas ship on one response. The most restrictive is understood to win
[Google's robots-meta documentation, as cited in site-wide audit §12 — re-check the source and record
the date before relying on it], but the stacking is fragile.

1. Compute one value and emit one tag.
2. **Do not change the `resources` behavior in this task.** `content/resources/` holds
   `health-code-reference` and `sugar-lookup`, which look like public tools, and they are `noindex` in
   every environment while still appearing in `sitemap.xml`. Whether that is deliberate is a question
   for the team; record it and leave the behavior as-is.
3. Expected: exactly one `<meta name="robots">` per built page, counted across the whole
   `$TEMP/iso-docs` tree rather than on one page.

### Task 13: Put the site name in `<title>`

**Files:** `themes/dohmh/layouts/partials/head.html:64-66`.

`og:title` and `twitter:title` both append `" – {{ .Site.Title }}"` (`seo.html:12`, `:20`); the
`<title>` that becomes the browser tab and the search result does not.

1. Append the same suffix inside the `title` block.
2. Expected: every built page's `<title>` ends in the site title — and the home page does not read as
   the title twice. Check that page specifically.

### Task 14: Vestigial metas out, URLs absolute

**Files:** `themes/dohmh/layouts/partials/seo.html:3`, `:4`, `:8`, `:10`.

1. Delete `<meta name="geo.region" content="" />` (`:4`) and
   `<meta property="fb:profile_id" content="0" />` (`:8`) — both are placeholders, and `geo.*` has no
   ranking role to preserve.
2. `:3` `<link rel="canonical" href="{{ .RelPermalink }}">` and `:10`
   `<meta property="og:url" content="{{ .RelPermalink }}">` both emit a path, not a full URL. **This
   is not from the audits — it was found 2026-08-20 while checking §12, and the `og:url` half is
   unverified:** confirm against the Open Graph specification (ogp.me) that `og:url` requires an
   absolute URL before changing it, and record the retrieval date.
3. If confirmed, switch both to `.Permalink`.
4. Expected: a built page's canonical and `og:url` carry the full `https://…` URL, and no page emits
   `geo.region` or `fb:profile_id`.

### Task 15: The misspelled analytics event

**Files:** `assets/js/data-explorer/app.js:151-152` — `gtag('event', 'click_how_caclulated')`, bound
to `#howCalcButton`, which exists at `themes/dohmh/layouts/data-explorer/single.html:813`. So unlike
the branch where §11 row 12 was closed, **this handler fires**.

1. A decision before an edit: renaming a GA4 event starts a new series and orphans the history under
   the old name. Ask before renaming, and if it is renamed, record the cutover date where the
   analytics inventory lives.
2. If renamed: `click_how_calculated`, matching the snake_case convention the other four custom events
   use.
3. Expected: no occurrence of `caclulated` under `assets/` or `themes/`, and the button still fires an
   event — read `window.dataLayer` to confirm. **Stubbing `window.gtag` does not work:** the GA
   snippet redefines it after page scripts run, so a stub records zero and reads as "never fired".
   That cost a false negative on 2026-08-15.

### Task 16: Confirm, then fix, the doubled `click_subscribe`

**Files:** `assets/js/main.js:14` (`gtag('event', 'click_subscribe', …)`) and `assets/js/site.js:99`
(`sendAnalyticsEvent("click_subscribe", …)`).

Both call sites exist. Whether both fire on one click was never verified in a browser — §11 row 3 says
so explicitly.

1. **Evidence first, no code.** Click the subscribe control with `window.dataLayer` under observation
   and count `click_subscribe` entries. If one fires, this task is a doc correction and ends here.
2. If two fire, delete the one whose file does not own the control, and re-count.
3. Expected: exactly one `click_subscribe` per click, with the counts from before and after recorded.

### Branch B verification

Build under **both** `prod_prod` and `development` into temp directories and grep the generated HTML —
Tasks 11 and 12 are environment-branched, so a single-environment check cannot see them. Then
`npm run smoke`, then the two `dataLayer` reads for Tasks 15–16. No screenshot pass: nothing in this
branch changes layout.

---

## Branch C — the moderate items

Branch name: `feature-audit-moderate`. Five independent tasks; each gets its own commit, and Task 17
must not share one (element-id changes, per CLAUDE.md).

### Task 17: De-duplicate `#skip-header-target`

**Files:** `themes/dohmh/layouts/_default/baseof.html` (the canonical declaration, on `<main>`) plus
the id's other declarations — 49 layout files carry it as of 2026-08-20.

The keyboard skip link's target is declared on `<main>` and again inside it on most pages. The DE
branch fixed it in the form to copy: the id was dropped from the templates that duplicated it, and
`tabindex="-1"` was added to the `<main>` in `baseof.html` and `list.html` so the skip link actually
moves focus rather than only scrolling.

1. Read the DE branch's `baseof.html` before starting — its count was 44 files, this tree's is 49, so
   derive the list from this tree's own grep, not from that commit.
2. Drop the id everywhere except `baseof.html` / `list.html`; add `tabindex="-1"` to the `<main>` in
   both.
3. Grep all four surfaces for the id, not just templates: JS, SCSS, templates, ARIA attributes.
4. Expected: one declaration per built page, and pressing the skip link moves **focus** into `<main>`.
   Check focus, not scroll position — those are different outcomes and only one of them is the fix.

### Task 18: Port the flexdatalist combobox fix

**Files, source:** `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html` on
`feature-MOD-Lab-NR-recode-refactor` — `wireComboboxState(input)` at `:80`, called from
`loadNeighborhoodSearch()` at `:61`.
**Files, targets (5):** `themes/dohmh/layouts/partials/de-text-search.html:47`,
`themes/dohmh/layouts/data-features/aqe.html`, `themes/dohmh/layouts/data-features/hvi.html`,
`themes/dohmh/layouts/neighborhood-reports/section.html:76`,
`themes/dohmh/layouts/neighborhood-reports/topiclanding.html`.

The library puts `aria-autocomplete`, `aria-owns` and a **static** `aria-expanded="false"` on a plain
textbox with no `role="combobox"` — axe `aria-allowed-attr` (critical), and worse, the attribute reads
false while the listbox is open. Site-wide §5k scopes this at three pages because it was written
against a tree where the two NR call sites were already fixed; **on this tree the fix is absent
entirely** — `wireComboboxState` appears nowhere under `themes/`.

1. Extract `wireComboboxState` into a new shared partial rather than pasting it five times —
   `themes/dohmh/layouts/partials/flexdatalist-combobox-js.html` — and include it from each call site.
2. Carry across the two things the source encodes, rather than rediscovering them: it reads state
   through a `MutationObserver` and not from library events, because only `results.remove()` fires
   `removed:flexdatalist.results` — Escape and outside-click remove the container silently; and the
   generated `<li>`s need ids for `aria-activedescendant` to point at.
3. Expected, per call site: `role="combobox"` present; `aria-expanded` flips `false → true` on typing;
   `aria-activedescendant` follows the highlight and resolves to a real id; `false` again after Escape
   and after an outside click. **Sample twice around Escape** — at ~60 ms and again at ~600 ms. A
   single read cannot separate a stale attribute from a listbox that genuinely reopened, which is a
   defect that was found exactly that way.

### Task 19: The `$primary`-as-text contrast sweep

**Files:** 17 candidate rules — `theme.scss:35, 344, 349, 409, 454, 472, 580, 816, 819, 826, 858`;
`_custom.scss:104, 159`; `_f-layout-elements.scss:774` (`$accordion-title-color`);
`__portal-custom.scss:201, 204, 1297` (hardcoded `#008939`; the audit cites `:1283`, which has moved).

`$primary` `#008939` is 4.53:1 on pure white and below 4.5:1 on every tinted background the palette
defines. `$primary-dark: #007a31` is already in the tree (`_a-global-variables.scss:92`) and used by
exactly two rules. §10a is explicit that the rest are **candidates, not findings**.

1. For each of the 17, find the background it actually renders on and compute the ratio from
   `getComputedStyle` on a live node — not from the palette, and not from an axe count.
   `color-contrast` lands in axe's *incomplete* bucket whenever it cannot resolve a background, so its
   violation count is a floor, not a census.
2. Switch only the rules that measure below 4.5:1, and only to `$primary-dark`. `$primary` stays the
   brand color for fills, borders and map geometry.
3. **Reading a computed style immediately after a hover measures the transition, not the hover
   state** — Bootstrap transitions over .15s. Wait ~500 ms.
4. Expected: a table of all 17 with before/after ratios and the background each was measured against,
   in the commit message. Rules that already pass are recorded as passing, not silently skipped —
   that record is what stops the next person re-deriving it.

### Task 20: Port the guardrails

**Files:** new `eslint.config.mjs` (from `feature-MOD-Lab-NR-recode-refactor`), new
`scripts/docs-check.mjs` (same), and the `scripts` block of `package.json`.

This tree runs `smoke` and `characterize:cp` only. The dev dependencies are already installed —
`eslint ^10.7.0`, `globals ^17.7.0`, `axe-core`, `playwright` are all in `devDependencies` — so this
is config and scripts, not an install.

1. Copy `eslint.config.mjs` and **delete its NR block**: it scans `assets/js/nr-report`, which does
   not exist here. Leaving it in means the config either throws or silently lints nothing.
2. Copy `scripts/docs-check.mjs`. It is opt-in — a doc is checked only if it declares
   `<!-- docs-check source-roots: … -->` — so porting it changes nothing until a doc opts in. Opt in
   `CLAUDE.md` first: it makes more path claims than any audit doc, and a root `layouts/` path that
   never existed survived in it for months.
3. Add `"lint": "eslint assets/js/data-explorer"` and `"docs-check": "node scripts/docs-check.mjs"`.
4. Expected: `npm run lint` exits 0 — or names real `no-undef` hits, which is the point. This is the
   check that catches the failure a Hugo build cannot: these are classic `<script>` tags sharing one
   global scope, so a bad name throws at load while the build stays green.

### Task 21: Add JSON-LD

**Files:** a new `themes/dohmh/layouts/partials/structured-data.html`, included from
`themes/dohmh/layouts/partials/head.html`.

The theme emits zero JSON-LD, Microdata or `itemtype` anywhere (§12).

1. Emit `Organization` (DOHMH — name, url, logo, `sameAs` from `data/globals/social`), `WebSite` (with
   a `SearchAction` pointing at the Pagefind search URL), and `BreadcrumbList` where the page
   hierarchy exists.
2. **`Dataset` is deliberately out of scope here.** The audit calls it the highest-value item, and it
   is: it is also the one that needs indicator metadata at build time, which the explorer currently
   fetches at runtime. Scoping that needs its own pass; do not half-build it.
3. Expected: the emitted JSON parses (`node -e` over the extracted block), and Google's Rich Results
   Test accepts each type. Record the date of that check — it is an external tool whose behavior is
   not re-derivable from this repo.

### Task 22: Reconcile the audit records

Doc-only, and it goes last so it can describe what actually landed.

1. Update the §11 status table in [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) —
   it was swept against `production` on 2026-08-12, and every row this plan touches moves.
2. Port the unified `js-conventions.md` from `feature-MOD-Lab-NR-recode-refactor` (14,642 bytes,
   "Browser-Side JS") over this tree's older Data-Explorer-only copy (7,355 bytes). It needs one edit
   on arrival: it exempts `assets/js/data-explorer-old/` "on `feature-new-data-explorer`", a path this
   tree does not have.
3. The audit's banner says 24 of the 77 repo paths it cites do not exist on `production`. That count
   is from 2026-08-12 and this tree has moved since; re-run the existence check before repeating the
   number, or drop it.
4. Expected: no status line in the audit contradicts the repo, and every number in the banner was
   re-derived rather than copied.

### Branch C verification

Per task, because they share no surface: `npm run lint` for 20; browser ARIA reads for 18;
`getComputedStyle` measurements for 19; focus (not scroll) for 17; a JSON parse plus the Rich Results
Test for 21. Then `npm run smoke` once for the branch — 17 touches `baseof.html`, which is the rule's
trigger.

---

## Task 0: Merge `upgrade-GHA-dependencies`

Its own branch, already written, **1 commit ahead of `production` and 0 behind** as of 2026-08-20. It
adds the missing `permissions:` blocks to the four hugo-build workflows and bumps `actions/checkout`,
`actions/setup-node`, `peaceiris/actions-gh-pages` and `peaceiris/actions-hugo`.

It merges cleanly after #1473 without a rebase: `merge/production` changes nothing under `.github/`
`[verified 2026-08-20: git diff --name-only production merge/production -- .github/ returned nothing]`.

Two things it does **not** do, both from site-wide §11 row 2, both optional follow-ons:

- Actions are pinned by tag, not by commit SHA. Invoke the `hardening-github-actions` skill before
  doing this — that skill owns the convention.
- `github/codeql-action` is still at `v2` in `codeql.yml`. Check whether v2 is still supported before
  treating that as a finding: it is a claim about GitHub's support policy, so it needs a source and a
  date, not a recollection.

---

## Re-running this

Every "open" claim here is one command against a clean tree. To re-derive the list rather than trust
it: `git rev-parse HEAD` first, then the per-task greps quoted in each task, then compare counts. A
result in this document is a fact about `a67f957ba7`; any of them can be closed by a commit that lands
before the work starts.
