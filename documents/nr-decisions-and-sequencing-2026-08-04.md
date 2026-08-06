# Neighborhood Reports — decisions, consequences, and sequencing

*Written 2026-08-04 against `cc61dfd4e4` on `feature-MOD-Lab-NR-recode-refactor`.
Reconciled 2026-08-05 after decision 3 was settled — see "What changed" below.*

Five threads opened in quick succession — a JS module split, a state-namespace question,
a URL-scheme change, retiring the old report system, and a pile of dead files. This is the
map. Claims marked `[verified]` were checked against the tree by command on 2026-08-04;
`[verified 08-05]` marks the reconciliation pass. Anything unverified says so.

**Deliberately not opted into `npm run docs-check`** — it names paths that this work
would delete.

Inventory, traffic figures, and the full open-questions list live in
[`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md).
This document is the decision record and the order of work; it does not repeat them.

---

## What changed on 2026-08-05

- **Decision 3 is settled: neighborhood-first URLs.** The topic-first order turned out to
  be an artifact — the pre-slug scheme had five topic landing pages with the neighborhood
  in a query string, and when it moved to path slugs the ordering carried over. Nobody
  chose it on the merits `[source: team, 2026-08-05]`. With no argument for topic-first and
  several against, Option A is withdrawn.
- **The analytics were pulled.** The 252 old URLs draw ~14,200 sessions a year against 476
  for the five SPA topic pages. Figures and method in the retirement memo §5.
- **Decision 4 no longer branches.** It is cleanup plus generation, not a product decision.
- **The `404.html` fall-through test is no longer worth running for this purpose.** It
  mattered only if the old URLs were going to be redirected. They aren't.
- **Four side questions were answered by the team**, including the Pagefind posture below.
  Recorded in the retirement memo §10.1.

What remains genuinely open is in "Still open" at the end.

---

## The short version

**Four decisions. Three need no decision at all. The one live choice is a mechanism.**

| | What | Blocked on | Cost |
|---|---|---|---|
| **1** | Delete 5 callerless partials | nothing | ~1 hour |
| **2** | Split `nr-topic-spa.js` into 10 modules | nothing | ~half a day |
| **3** | URL scheme | **settled — neighborhood-first** | — |
| **4** | Retire `nr-output` | **how** the 210 pages get built — see below | ~2–4 days |

Decision 3 used to determine what decision 4 *was*. Now that it is settled, decision 4 is a
cleanup task in either mechanism: no URL is deleted, no redirect is needed, no product
sign-off is needed. What is left to choose is where the 210 pages come from.

---

## Current state

Two systems share the `neighborhood-reports` section `[verified: find, frontmatter read]`.

| | Old — `nr-output` | New — topic SPA |
|---|---|---|
| Content | 252 `.md` (210 topic + 42 `_index.md`) across 42 neighborhood dirs | 5 topic `.md` + the section `_index.md` |
| URL | `/neighborhood-reports/<neighborhood>/<topic>/` | `/neighborhood-reports/<topic>/` |
| How the neighborhood is known | it's in the URL, and in frontmatter | IIS rewrite, `sessionStorage` bridge, or `404.html` |
| Report content in the HTML | **yes — server-rendered at build time** | **no — built by JS in the browser** |
| Layout | `nr-output/single.html` (855 lines, 434 inline `<script>`) | `neighborhood-reports/nr-topic-spa.html` + `assets/js/nr-topic-spa.js` (1,435 lines) |
| Sessions / yr | **~14,200** | 476 |
| In site search | no — `data-pagefind-ignore="all"` | yes |

The rendering row is the one that matters most and is easiest to miss.
`nr-output/single.html:420` fetches the report JSON at *build* time via
`resources.GetRemote`, filters to the page's neighborhood, and ranges through the
indicators via `nr-indicator-new.html` — so indicator names, values, geographies, units,
and tertile ranks are all in the delivered HTML. The SPA's template emits report-topic
headings and then an empty `<div id="nr-section-N">`; everything inside is client-built
`[verified: read of both templates]`.

**Nothing in this repo links to the 252 old URLs** `[verified: grep across content/,
themes/, data/, config/]`. That was never the same as unused, and the analytics settled it:
those URLs live entirely on external referral and search, which is the profile most
sensitive to deletion.

---

## Decision 1 — Delete the five callerless partials

**No decision required.** Provable today, independent of everything else. Not yet done.

`nr-chooser.html`, `nr-clickable-uhf.html`, `nr-map-highlight.html`,
`nr-indicator-old.html`, `nr-sub_nav.html` have no caller `[verified: usage sweep with
positive control — `nr-leaflet` returns 4 callers; `partials.Include` confirmed unused]`.
Site-wide audit §5a names the first three; the last two are new findings.

**Two traps.** `.nr-clickable-uhf` is a live CSS class at
`neighborhood-reports/section.html:86` even though the partial is dead — a grep-and-delete
on the bare string breaks the landing page. `nr-sub_nav` survives only in a stale comment
at `nr-output/single.html:207`.

**Proof:** clean build, `git diff` of `docs/` shows no rendered-output change.

---

## Decision 2 — Split `nr-topic-spa.js` into a module directory

**No decision required.** A pure refactor with no behavior change, fully specified and
provable. Not yet done.

Ten files under `assets/js/nr-topic-spa/`, mirroring `assets/js/data-explorer/`. The file's
12 existing level-1 sections are already the seams. Stage 5 of the earlier conventions work
removed the last structural reason for it to be one file when it unwrapped the
`bootstrap()` closure.

**Why it's safe:** the only new failure mode is a name used at *load* time before its file
has run, and that's bounded by enumeration — the file has exactly two top-level executable
statements (`window.nrDownloadCSV = downloadCSV;` and `bootstrap();`, both landing in the
last-loaded file) and exactly one declaration reading another at load time
(`DEMOGRAPHIC_FIELDS` → `percent`, staying together) `[verified: column-0 sweep]`.

**Consequence for later work:** decision 4's JS edits touch three functions that land in one
~118-line file after the split, instead of one 1,435-line file. That is the only reason to
prefer doing this first — there is no hard dependency.

**Sub-item, gated on this:** an `NR = {…}` state namespace like the data explorer's `DE`.
Applying [`js-conventions.md`](js-conventions.md):113–129's own test — namespace for
churning cross-file state, bare for module seams — **11 of the 13 shared bindings have
exactly one writing file** and are already seams `[verified: assignment-only grep]`. Only
`renderedPanels` and `accordionCounter` fail it. So this is a ~5-site change, not a
`DE`-scale migration, and it should be decided after the split's annotations exist.

---

## Decision 3 — The URL scheme — SETTLED, neighborhood-first

The SPA moves to the old `<neighborhood>/<topic>` shape. **Option A (leave it topic-first)
is withdrawn**; see "What changed". Option C (neighborhood-first with no server-rendered
content) stays rejected, for the reason recorded on 08-04: it would strip real indicator
content out of 210 indexed pages that currently have it, reproducing site-wide audit §12's
Data Explorer finding for NR.

**This cannot be done by editing a rewrite rule.** A real Hugo page beats any IIS rewrite,
and those 252 URLs are real `nr-output` pages today. The only way the SPA can own that URL
shape is for those pages to render the SPA.

### The search-indexing stake

This was the argument before the analytics existed, and it holds up:

- The 210 old report URLs are **210 of the 723 `<loc>` entries in the sitemap — ~29% of the
  declared indexable surface** `[verified: grep of docs/en/sitemap.xml. NOTE: docs/ is a
  stale `local-stage` build; structure is reliable, re-derive counts from a production
  build]`.
- **They are explicitly indexable.** `head.html:18` emits `<meta name="robots" content="all">`
  in production; the `noindex, nofollow` at `:27` fires only outside it `[verified: read]`.
- Each carries a unique `seo_title`/`seo_description` and server-rendered content.
- **`data-pagefind-ignore="all"` is irrelevant to this** — it governs on-site Pagefind
  search, not search engines. Easy to conflate.

The 08-04 draft also worked through why a redirecting stub cannot preserve any of it —
Google's redirect documentation (fetched 2026-08-04) states that a permanent redirect will
"Show the new redirect target in search results," and that "the indexing pipeline uses the
redirect as a signal that the redirect target should be canonical." That analysis is now
moot in the good direction: **under the settled decision there are no redirects at all**,
because the URLs do not move. Kept here only so nobody re-derives it.

### The live sub-choice: how the 210 pages get built

Both paths produce the same URLs. They differ in where the pages come from:

| | **Option B** — re-point the content files | **Option D** — generate from a content adapter |
|---|---|---|
| The 210 pages | keep them; swap `type: nr-output` → `layout: nr-topic-spa` | delete them; `_content.gotmpl` emits them |
| Measure values in static HTML | yes — reuses the build-time fetch | no — names, descriptions, demographics only |
| Build-time EHDP-data report fetch | kept | removed |
| Card renderers to maintain | two, forever — `nr-indicator-new.html` + `buildIndicatorCard` | one |
| Editable in CloudCannon | yes | no — generated pages are not content files |
| 42 neighborhood index pages | need building separately | fall out of the same loop |
| Prerequisite — **both probed 2026-08-05, both pass** | `layout: nr-topic-spa` resolves two levels deep — page built, 8 `nr-section-N` divs | a content adapter reads `.Site.Data` — all 5 topics + uhflist's 42 rows |

Option B's real price is the two card implementations staying in visual agreement
indefinitely — not the template work. Option D's is that measure *values* leave the HTML,
which matters only for crawlers that do not run JS. Both carry indicator names, measure
names, indicator descriptions and demographics in static HTML; the `MeasureID` join that
makes that possible is verified `[verified 08-05: metadata.json is a flat indicator array
with a nested `Measures` array — see retirement memo §6]`.

Option B additionally requires unifying accordion ids first: `nr-indicator-new.html` keys
off `indicator_data_name`, `nextAccordionId` emits `nr-acc-N`, and the characterization
harness asserts on `accordionIds`.

Either way the characterization harness must be **re-baselined** — the first NR change that
legitimately does, since it captures `finalURL` precisely to catch redirects. Read the
re-baseline rather than rubber-stamping it: confirm `finalURL` is the only field that moved.

---

## Decision 4 — Retire the old `nr-output` system

**Unblocked.** No URL is deleted, no redirect is needed, no product sign-off is needed.
Proof is a clean build, a `git diff` of `docs/`, and the characterization harness.

What goes: `nr-output/single.html`, `nr-output/section.html`, `nr-insert-zips.html`,
`nr-report-footer.html`, `nr-report-footer-sm.html`, `data/globals/NR_footer`, and
`PAGES[32]`/`[33]` in `scripts/smoke-pages.mjs`. Under Option D the 252 content files go
too; under Option B they stay and are re-pointed. `nr-indicator-new.html` survives under
Option B and goes under Option D.

The four prerequisites the 08-04 version listed are all discharged: the sitemap loss does
not occur (no URLs deleted), the analytics are pulled, there is no redirect story to write,
and the team confirmed on 2026-08-05 that the SPA is a view-by-view replacement.

One sequencing constraint under Option D that has no analogue under B: generated
`<nbhd>/<topic>` pages occupy the same paths as the existing content files, so Hugo
conflicts and the deletion and generation must land in the same commit. Mitigation — a
pre-capture of the top 20 report pages to diff against — is in the retirement memo §11.

---

## Ordering

```
  Decision 1 (dead partials) ──────────────── independent, do anytime
  Decision 2 (module split)  ──────────────── independent, do anytime
        │
        │ (makes decision 4's JS edits cheaper — preference, not dependency)
        ▼
  Pick B or D ──▶ probe its prerequisite ──▶ Decision 4 ──▶ NR state namespace
```

**Recommended order**

1. **Decision 1** — free, independent, removes noise from every later sweep.
2. **Decision 2** — ready, proven, blocks nothing and unblocks everything.
3. **Pick Option B or Option D.** ~~Then probe that option's prerequisite.~~ **Both were
   probed 2026-08-05 and both pass** — see the retirement memo §10.6. The choice is now
   purely the trade-off in the table above, with no technical unknown behind either column.
4. **Decision 4**, per the staging in the retirement memo §11.
5. **NR state namespace** — after decision 2's annotations exist.

Steps 1 and 2 are worth doing regardless. Nothing here waits on a person except the B/D
choice itself: the last such blocker, the `uhflist` vintage, was settled 2026-08-05.

---

## Still open

- **Option B or Option D** (decision 3's sub-choice above). The only decision left.
- **Site-wide audit §5a item 4 needs correcting, not just closing.** It frames
  `uhflist.js` / `uhflist.json` as two vintages where "all 42 rows differ" and demands
  content sign-off. Both are misleading: 8 of 13 fields are byte-identical including
  `Zipcodes`, only the five ACS percentages diverge, and keeping the `.js` — the decision
  taken 2026-08-05 — changes no displayed number, because the `.json` percentages were
  never rendered anywhere. Detail in the retirement memo §10.5.
- **The five ACS percentages in `uhflist.js` have no established vintage** — the pulls in
  `cgettings-EHDP-work` are 2015-19 and match neither file. **Being corrected on a separate
  track** `[decided 08-05]`; not a blocker here. Both tracks edit `uhflist.js`, so whichever
  lands second should re-read it rather than assume its shape.
- **Site-wide audit §5a still owns five deletions** this document also claims. Hand them
  over when decision 1 is acted on, or two documents conflict.
- **`topiclanding.html`** — nothing selects it via `layout:`, but §5a treats it as live.
  One file; resolve separately. It also holds one of the three build-time
  `resources.GetRemote` call sites.
- **`urlExtension` frontmatter** on the 5 topic files is read by nothing `[verified]`.
- **~75 lines of inline `<style>`** in `nr-topic-spa.html`, some of it dead, most
  duplicating `nr-output/single.html`. Belongs in `assets/scss/`.

**Closed 2026-08-05:** the URL scheme (above); the analytics; the redirect story; whether
the SPA is a functional replacement; whether EHDP-data has other consumers of `spec/` and
`images/`; the `MeasureID` join; the **`uhflist` source of truth** — `.js` stays, `.json`
goes with `nr-insert-zips.html`, verified to lose nothing; and the **Pagefind posture** — NR
goes into site search,
because the pages are expected to carry indicator names and descriptions. That last one
turns into a concrete edit: `neighborhood-reports/section.html:3` carries the
`data-pagefind-ignore="all"` that excludes the landing page, and it comes off
`[verified 08-05: grep across themes/dohmh/layouts]`. Details and consequences in the
retirement memo §10.

## Where the detail lives

| Topic | Document |
|---|---|
| Inventory, traffic, open questions, staging | [`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md) |
| Everything outside the SPA, incl. §5a and §12 | [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) |
| JS conventions, incl. the namespace rule | [`js-conventions.md`](js-conventions.md) |

Step-by-step execution plans for decisions 2 and 4 exist outside the repo and can be moved
into `documents/` when either is picked up.
