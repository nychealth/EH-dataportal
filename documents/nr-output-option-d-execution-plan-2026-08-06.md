# Decision 4 — execution plan for Option D

*Written 2026-08-06. Moved into the repo from an untracked plan file the same day, because the
analysis below existed nowhere a later session could find it — see "Why this file exists".*

**This is the executable detail. Status lives elsewhere.**
[`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md) §11 is
the ledger: what is done, what proof ran, what comes next. This document does not repeat it, and
where the two disagree the ledger is right. Decisions and rationale are in that memo and in
[`nr-decisions-and-sequencing-2026-08-04.md`](nr-decisions-and-sequencing-2026-08-04.md); this
file does not re-open them either.

**Deliberately not opted into `npm run docs-check`**, for the same reason as its two siblings: it
names paths that the work it describes deletes, so the checker would fail on names that are
correct for the document's purpose. Re-derive its paths against the tree rather than trusting
them after a deletion pass.

## Why this file exists

Stages A, B/4a, C and D landed while this plan sat in `~/.claude/plans/` — outside the repo,
invisible to `git log`, absent from the next clone. The ledger was kept properly throughout and
still could not have carried a fresh session through Stage E, because a ledger records status and
this is not status. A per-fact audit of the committed docs on 2026-08-06 found two substantive
gaps: the whole Pagefind section below, and the `neighborhoodMap` dependency. Both are here now.

---

## Findings that the scoping memos do not record

Everything in this section was established during execution and is not in the two memos, except
where noted.

### 1. `neighborhoodMap` is built from the content files this work deletes

`themes/dohmh/layouts/neighborhood-reports/nr-topic-spa.html:331-338` builds
`NR_TOPIC_SPA_CONFIG.neighborhoodMap` by ranging
`($.Site.GetPage "/neighborhood-reports").Sections` — that is, from the 42 `_index.md` files
Stage E deletes. The Stage C spike showed adapter-created `kind: "section"` pages are real branch
pages, so this may keep working; it has not been tested for the real 42.

**Do not rely on that.** Rebuild the map from `.Site.Data.globals.uhflist` (`page_name` →
`UHF_name`), which is the same source the adapter generates pages from and is independent of
Hugo's section machinery. Two consumers depend on it: `getNeighborhoodFromURL` (slug → name) and
`setNeighborhoodInURL` (name → slug), both in `assets/js/nr-topic-spa/url.js`.

### 2. `topiclanding.html` is live on `production`

All five topic `.md` files carry `layout: topiclanding` there
`[verified 2026-08-06: git show production:content/neighborhood-reports/Asthma_and_the_Environment.md,
all five]`. The memos' "nothing selects it" is true on this branch only. Its JS-built
42-neighborhood link list (`topiclanding.html:241-246`) is exactly what the generated topic index
pages should carry, server-rendered instead.

### 3. Hugo version

The memos record 0.146.7; the tree runs **0.147.9** (`cae7f7b10f`). Content adapters need ≥0.126,
so nothing changes, but §10.6's probe ran under a different version than Stage E will.

### 4. Decisions taken while planning, with their rationale

Recorded so they are not re-litigated. These are narrower than the memos' decisions and were made
during execution.

- **Topic-first URLs get no redirect.** Both Web.config NR rules are deleted outright rather than
  one being inverted. The `<topic>/<nbhd>` shape never reached production, was never in a sitemap,
  and has no internal references once Stage F lands `[decided 2026-08-06: team]`.
- **The neighborhood index keeps today's design.** The generated `<nbhd>/` page is a port of
  `nr-output/section.html` — Leaflet map, `<h1>`, ZIP list, five topic cards with their
  `seo_image` backgrounds — rather than a leaner crawler-first page. Lowest visual risk on a page
  drawing 4,689 sessions a year `[decided 2026-08-06: team]`.
- **Canonical neighborhood data moved to `data/globals/`** rather than parsing `uhflist.js` at
  build time or reviving `uhflist.json` `[decided 2026-08-06: team]`. Done in step 4a.

---

## Pagefind — what exists today, and what Option D does to it

Memo §10.3 treats NR search indexing as "remove one `data-pagefind-ignore` attribute". It is more
than that. Search is Pagefind, run as a post-build step in all four workflows
(`npx -y pagefind --site docs`). `baseof.html:22` puts `data-pagefind-body` on `<main>`, so only
`<main>` is indexed; the standard page furniture (`keywords.html`, `related-data.html`,
`related-footer.html`, `socialshare.html`) each carry `data-pagefind-ignore="all"`. Four pieces
bear on this work.

### 1. Indicator names and descriptions are injected as hidden headings

`themes/dohmh/layouts/neighborhood-reports/topiclanding.html:115-143` fetches
`nr_indicator_names.json` from EHDP-data at build time, filters it to this topic, and emits each
indicator as `<h1 class="d-none">` + `<h2 class="d-none">`. It is live on `production` and
arrived deliberately — `2e4d5f6583` "adding NR indicator names and descriptions", `77054c60e2`
"add NR indicators to index", `94f3fccd7e` "improving indexing thru h1-3 … need to use h tags for
accessibility reasons". Two consequences:

- **It keys on `.File.BaseFileName`, which on an adapter page is the string `_content`** — not
  nil `[verified 2026-08-06: Stage C spike]`. The `where` therefore returns zero rows
  **silently**: no build error, no warning, the hidden headings simply vanish. The fix is cheap —
  the live JSON's `title` field holds exactly the `content_yml` string
  (`Active_Design_Physical_Activity_and_Health`) `[verified 2026-08-06: fetched the raw JSON]`,
  so `where "title" "eq" .Params.content_yml` is a drop-in.
- **The NR copy carries the comment "this gets an id because we want sub results with links" but
  no `id` attribute.** The data-explorer copy it was adapted from does have one
  (`data-explorer/single.html:1108-1110`, `id="IndicatorID-{{ $id }}"`), and `footer.html:241`
  rewrites exactly that anchor into a `?id=` query string. `PagefindUI` runs with
  `showSubResults: true` (`footer.html:208`). Whether NR sub-results are produced today and where
  they link is **unverified** — check against a built index rather than assuming.

### 2. Search-result titles use `.Parent.Title`

`themes/dohmh/layouts/partials/head.html:303-317` emits
`data-pagefind-meta="title:{{ .Title }} | {{ .Parent.Title }}"` when the page has a non-home
parent, falling back to `.Site.Title`. On today's report pages `.Parent` is the neighborhood
`_index.md`, so a result reads "Asthma and the Environment | East Harlem". The Stage C spike
confirmed a generated page under a `kind: "section"` parent reproduces this exactly. **If the 42
neighborhood indexes ever stop being real branch pages, all 210 report results collapse to
"Asthma and the Environment | Neighborhood Reports" — 42 identical titles per topic.**

### 3. The section filter chip

`head.html:257-259` emits `data-pagefind-filter="section[content]" content="Neighborhood Reports"`
when `eq .Section "neighborhood-reports"`. The spike confirmed adapter pages report that
`.Section`.

### 4. Near-duplicate text is a larger risk than §10.3 states

§10.3 flags 42 copies of each `report_topic_description`. The hidden indicator block is per-topic
too, so porting it onto the 210 report pages would add ~8 more duplicated name/description pairs
per page on top. **Recommendation: leave that block on the five topic index pages, where it is
today, and do not put it on the generated report pages.** The report pages' distinguishing
indexable text is the neighborhood name, ZIP list and demographics; prefer
`data-pagefind-weight` on the neighborhood name over adding volume.

### Consequence for memo §8

§8's build-time-fetch table writes off `topiclanding.html:115` as going away because "the template
is unselected". That is true on this branch only (see finding 2 above), and if the hidden-heading
block is ported the `nr_indicator_names.json` fetch survives into the new topic index. After this
work there are **two** build-time `GetRemote` call sites, not one. Sourcing the same names from
`metadata.json` via the `MeasureID` join that memo §6 verified would collapse it back to one —
worth doing, not required here.

---

## Stage E — the swap, one commit

Generated `<nbhd>/<topic>` pages occupy the same paths as the 252 content files, so Hugo conflicts
and deletion and generation cannot be staged apart.

### New

- **`content/neighborhood-reports/_content.gotmpl`** — the adapter. Nested loop over
  `.Site.Data.globals.uhflist` × `.Site.Data.globals.NR_content`, emitting 210 report pages
  (`kind: page`, `layout: nr-topic-spa`) and 42 neighborhood indexes (`kind: section`,
  `layout: nr-neighborhood-index`). Per-page params carry `neighborhood`, `geocode` (`UHF_id`),
  `content_yml`, and templated `seo_title`/`seo_description` — which also fixes the inconsistency
  where East Harlem's `seo_title` reads "Neighborhood report - East Harlem | …" and Bayside's
  reads bare "Bayside - Little Neck".
- **`themes/dohmh/layouts/neighborhood-reports/nr-neighborhood-index.html`** — port of
  `nr-output/section.html`, with the five topic cards pointing at real `<nbhd>/<topic>/` hrefs
  instead of the sessionStorage bridge at `:65-73`. Keep the `.nr-clickable-uhf` class name: the
  partial is dead, the CSS class is live (memo §2).
- **`themes/dohmh/layouts/neighborhood-reports/nr-topic-index.html`** — the five `<topic>/` pages
  become real index pages: breadcrumb, `<h1>`, `.Content` intro, topic mini-menu, and a
  **server-rendered** 42-neighborhood link list ported from `topiclanding.html:241-246`. Also
  inherits that template's Pagefind block (`:115-143`) with the two changes named above: key on
  `.Params.content_yml`, and add the `id` the comment already claims is there.

### Changed

- **`nr-topic-spa.html`** — add `neighborhood: "{{ .Params.neighborhood }}"` to
  `NR_TOPIC_SPA_CONFIG`; rebuild `neighborhoodMap` (`:331-338`) from
  `.Site.Data.globals.uhflist`; add the neighborhood to the breadcrumb; server-render the
  neighborhood name into the two `<h1>`-adjacent spans (`:115`, `:232`) so a non-JS crawler does
  not get the dangling "Asthma and the Environment in" that memo §12a flags. **Switch
  `.Params.title` to `.Title`** at `:105`, `:113`, `:231`, `:236` and `:303` — the page map's
  top-level `title` sets `.Title` only, so `.Params.title` renders blank on generated pages
  (`reportName: ""`).
- **`assets/js/nr-topic-spa/url.js`** — `getNeighborhoodFromURL` gains a step 0: return
  `spaConfig.neighborhood` when the server supplied one. The membership search added in step 3
  stays as the fallback for a `replaceState`-produced URL.
- **`static/Web.config`** — delete `nr-spa-neighborhood-path` (`:304-309`) and `nr-old-to-new-spa`
  (`:322-327`). **This is the line-item that decides whether any of the work is reachable**; the
  second is a permanent 301 with `stopProcessing` that would redirect away every generated page.
- **`neighborhood-reports/section.html:3`** — drop `data-pagefind-ignore="all"`. This takes the
  section from 5 indexed pages to ~258, so it is the change most likely to show as a search-quality
  regression.
- **`scripts/smoke-pages.mjs`** — the two `nr-output` entries (`PAGES` indices 11 and 12, file
  lines 32-33) become one generated report page and one generated neighborhood index.
- **`CLAUDE.md`** — in `docs-check`'s `ROOT_DOCS`, and it names both `nr-output` templates by
  path, so the check fails the moment they are deleted. Update the prose and re-stamp
  `docs-check verified:`.

### Kept, against memo §11

`data/globals/NR_footer` and `partials/nr-report-footer-sm.html` stay `[decided 2026-08-06: team]`.
Call the partial from the generated report page. Its `{{- if $.Params.content_yml -}}` guard
(`:3`) keeps it silent elsewhere, and its `data-pagefind-ignore="all"` (`:14`) means keeping it
adds nothing to the index.

### Deleted

The 252 content files; `themes/dohmh/layouts/nr-output/` (both templates);
`partials/nr-indicator-new.html`; `partials/nr-insert-zips.html`; `partials/nr-report-footer.html`
(already callerless); `themes/dohmh/layouts/neighborhood-reports/topiclanding.html`.

### Verification

1. `hugo --environment production` completes; sitemap `<loc>` count rises from ~723 to ~975.
2. Diff the generated pages against `scripts/nr-output-precapture/capture.json` on neighborhood
   name, ZIP list, indicator names and descriptions, and EHDP-data URLs. Every page in that
   artifact carries 10–22 indicators and none carries zero, so a zero is a regression.
3. **A JS-disabled render** of one generated report page and one neighborhood index — the state
   that decides whether Option D's SEO argument holds, and invisible to every other check.
4. `npm run smoke`, `npm run lint`, `npm run docs-check`.
5. `npm run characterize:nr -- --check` **will** diff on `finalURL`, legitimately, for the first
   time. Read the diff rather than re-baselining past it: confirm `finalURL` is the only field
   that moved.
6. **Build the Pagefind index and query it** — `npx -y pagefind --site <build-dir>`, the same
   command the workflows run. Check four things no other rung reaches: a report result's title
   carries the neighborhood (`.Parent.Title` resolved), the "Neighborhood Reports" filter count
   matches the generated page count, the hidden indicator headings on a topic index produce
   sub-results and where those link, and a neighborhood+topic query returns the right page rather
   than 42 near-identical ones. `hugo server` cannot show any of this — Pagefind is a post-build
   step, which is why `PagefindUI is not defined` is an allowlisted dev-only error in
   `scripts/smoke-pages.mjs`.

---

## Stage F — SPA rewiring and cleanup

Separable from E, and better as its own commit so Stage E's "do the generated pages render"
question is answered on its own.

- `url.js` — `setNeighborhoodInURL` (`:82`) composes `<nbhd>/<topic>` instead of splicing after
  `topicSlug`; `updateTopicLinks` (`:93-114`) deleted along with the `nr_pending_neighborhood`
  bridge it feeds. Tabs become plain anchors to real URLs, which is also what gives crawlers 210
  links to follow.
- Remove the remaining `nr_pending_neighborhood` writers: `404.html:66` (the whole dev bridge at
  `:60-72` goes back to being a 404), `neighborhood-reports/section.html:315`,
  `partials/nr-leaflet.html:324`.
- `scripts/nr-characterization.mjs` — navigate directly to `<nbhd>/<topic>/` instead of writing
  the sessionStorage key at `:96`, then re-baseline. **Until this lands, `characterize:nr` cannot
  prove anything about path-based neighborhood resolution** — it exercises the bridge, not the
  path (ledger step 3). The committed baselines bake in the `/dev-stage` path prefix, so
  re-baseline against the same environment they were captured under.
- Optional cleanup: `nameCorrections` in `assets/js/nr-topic-spa/global.js` is dead — `f8759d8d6d`
  fixed the `Crotona -Tremont` typo in the source data, so its only key no longer occurs.

---

## Stage G — robots.txt

Independent of everything above; memo §11 wants it folded in.

- Add an unconditional `Sitemap:` line to `themes/dohmh/layouts/robots.txt`, whose body is
  currently gated out of production entirely. Adding ~250 URLs is the moment it starts paying.
- Add a comment naming the 2026-08-05 decision to allow all crawlers and why, so "allow everyone
  by omission" and "allow everyone deliberately" stop being indistinguishable in the repo.

---

## Corrections still owed to the scoping memo

Neither memo is opted into `docs-check`, so nothing enforces any of this. Fixed so far: §8's
build-time-fetch table, §10.5's ACS vintage claim, §7's line references, and the sequencing doc's
"nothing selects `topiclanding.html`" and "there is no plan for decision 4". Still outstanding:

- **The Hugo version, in three places** — §6 (`this repo runs 0.146.7`), §10.4, and §10.6's probe
  note. The tree runs 0.147.9 as of `cae7f7b10f`. Nothing about content adapters changes, but
  §10.6's probes were run under the older version and Stage E will not be.
- **§10.3's framing of NR search indexing as one attribute removal** — "That one attribute comes
  off". True as far as it goes, and it is the whole of what that section says about a change that
  also ports a build-time fetch, re-keys a filter that fails silently, and takes the section from
  5 indexed pages to ~258. The Pagefind section above is the correction; §10.3 should point at it.
- **§4's reachability claim** is worth re-deriving rather than trusting after Stage E: it lists
  the templates linking to per-neighborhood URLs, and both new layouts add more.

## Cost

Roughly **3–4 days** for the whole of decision 4, against the memos' 2–4. Step 4a, the two new
layouts and the Pagefind port are additions to their estimate, partly offset by the mechanisms
§10.6 probed. Stages A, C, D, 4a and G were each a few hours or less; **Stage E is the bulk of
what remains**, with F and G a few hours after it.

No subagents were used and none are needed: every stage is grep-, build- or browser-provable
directly, and dispatching would re-derive context the plan already carries. That last clause is
now true in a way it was not when this was written outside the repo.
