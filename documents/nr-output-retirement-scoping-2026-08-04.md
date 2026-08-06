# Retiring the old Neighborhood Reports (`nr-output`) — scoping memo

*Written 2026-08-04. Substantially revised 2026-08-05: the recommendation reversed.
See §0 for what changed and §5A for the retracted section.*

**This is a decision memo.** The 2026-08-04 version inventoried what exists and listed
the decisions someone had to make. Most of those decisions are now made, on evidence
gathered 2026-08-05. What remains open is in §10.

**Baseline: `cc61dfd4e4`, working tree clean apart from this file and its sibling,
re-confirmed 2026-08-05.** Claims are tagged either `[verified 08-04]` — checked against
that tree by the original pass — or `[verified 08-05]` — checked during the revision.
Anything unverified says so.

**Deliberately not opted into `npm run docs-check`.** It names paths that the work it
describes would delete, so once any of this lands the checker would fail on names that
are correct for the memo's purpose. Re-derive its paths against the tree rather than
trusting them after a deletion pass.

**Independent of the `nr-topic-spa.js` module split — which landed 2026-08-06.** The two work
packages intersected in two files at non-overlapping lines: `scripts/smoke-pages.mjs` — the
split edited the comment at :30, while this work removes the two `nr-output` entries in
`PAGES`, at indices 11 and 12, file lines 32-33 — and
[`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) (§5h vs §5a)
`[verified 08-04: file-set intersection]`. Neither blocked the other.

---

## 0. What changed on 2026-08-05

Three things, in the order they landed:

1. **SEO review of the SPA-only end state.** Googlebot renders JavaScript, but the SPA
   exposes no crawlable neighborhood URLs and self-canonicalizes every view to the topic
   page. An SPA-only site is five indexable pages, not 252. Non-Google crawlers do not
   render JS at all. §6 covers this.
2. **Google Analytics, Aug 2025 – Aug 2026.** The 252 old URLs draw ~14,200 sessions a
   year against 476 for the five SPA topic pages. §5 has the exact figures.
3. **The topic-first URL order turned out to be an artifact.** The pre-slug scheme had
   five topic landing pages with the neighborhood in a query string; when it moved to
   path slugs the ordering carried over. Nobody chose topic-first over neighborhood-first
   on the merits `[source: team, 2026-08-05]`.

Together these invert the plan. The 2026-08-04 memo treated the old URLs as something to
redirect away from. They should instead be kept, and served by generated pages.

## 1. What the old system is

| Layer | Files | Notes |
|---|---|---|
| Content | **252** `.md` across 42 neighborhood directories — 5 topic files + `_index.md` each, every one `type: nr-output` | vs 5 topic files + 1 `_index.md` at the section top level, which are the SPA |
| Layouts | `nr-output/single.html` (855 lines, **434** of them inline `<script>`), `nr-output/section.html` (108 lines) | |
| Partials, exclusive | `nr-indicator-new.html` (356 lines, 118 inline script), `nr-insert-zips.html`, `nr-report-footer.html`, `nr-report-footer-sm.html` | called only from the two `nr-output` templates |
| Data | `data/globals/NR_footer` | read only by the two footer partials, both nr-output-exclusive |
| URLs | `/neighborhood-reports/<neighborhood>/` and `/neighborhood-reports/<neighborhood>/<topic>/` | 42 + 210 = **252 public URLs** |

`[verified 08-04: find, wc, awk script-block count, partial-usage sweep]`

Roughly 552 lines of inline JS sit in `nr-output/single.html` and `nr-indicator-new.html`,
which is why "delete the old JS" isn't separable from deleting the templates. There is no
`assets/js/` module for this system.

## 2. Already unreachable — five dead partials, not three

> **DONE 2026-08-06.** All five deleted under decision 1; see
> [`nr-decisions-and-sequencing-2026-08-04.md`](nr-decisions-and-sequencing-2026-08-04.md).
> Proof was an A/B production build, byte-identical but for the three home-page
> `build_datetime` stamps. Both traps below held, and the second is now resolved: the
> `nr-sub_nav` variables were used by nothing and went with the comment. The section stays
> as the record of how the five were established.

[`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §5a records three
partials with no caller. There are five `[verified 08-04: usage sweep over themes/,
positive control — nr-leaflet returns 4 callers; partials.Include confirmed unused, so
the `partial "` probe cannot miss a call site]`:

- `nr-chooser.html`, `nr-clickable-uhf.html`, `nr-map-highlight.html` — the three §5a
  already names
- `nr-indicator-old.html`
- `nr-sub_nav.html`

Two string traps for whoever does the deleting:

- **`.nr-clickable-uhf` is a live CSS class**, on a `<div>` at
  `neighborhood-reports/section.html:86` that wraps a `nr-leaflet` call. The partial is
  dead; the class name is not. A grep-and-delete on the bare string breaks the landing page.
- `nr-sub_nav` survives only in a stale comment at `nr-output/single.html:207`
  ("variables for nr-sub_nav partial"). The variables it describes may or may not still be
  used by something else — check before removing them with the comment.

## 3. Must survive the deletion

| Thing | Why |
|---|---|
| `data/globals/NR_content` | Read by **both** systems — `nr-topic-spa.html:16` and `nr-output/single.html:84`, `:505` |
| `partials/nr-leaflet.html` | Called by 4 templates, two of which are not nr-output (`neighborhood-reports/section.html`, `topiclanding.html`) |
| `partials/nr-show-zips.html` | Called only by `neighborhood-reports/section.html` — the shared landing, not nr-output |
| `assets/js/uhflist.js` | The 42-row neighborhood table both systems read |
| EHDP-data `neighborhood-reports/data/report/` and `data/viz/` | **Both systems fetch the same paths** — `nr-output/single.html:416`, `:508` and `nr-topic-spa.html:291`, `:305` |

`[verified 08-04: grep]`

That last row is worth stating plainly: deleting nr-output orphans almost nothing in
EHDP-data, because the SPA already consumes the same report and viz JSON. The exceptions
are `neighborhood-reports/spec/{map,trend,summary}`, used only by `nr-output/single.html`,
and `neighborhood-reports/images/`, whose only consumer is the already-dead
`nr-indicator-old.html`. So the data-repo coordination is "two directories may become
orphaned", not a migration.

## 4. Reachability — nothing in this repo links to the 252 URLs

- **Site nav** points at `/neighborhood-reports/` only (`config/_default/config.toml:84`).
- **The section landing's picker routes to the SPA** — `neighborhood-reports/section.html:316`
  resolves a topic slug from `topicSlugs`, writes `nr_pending_neighborhood`, and navigates
  to the clean topic URL.
- **Three content files reference neighborhood-reports, and all three point elsewhere**:
  `content/data-explorer/mental-health.md:32,34` → topic SPA URLs;
  `content/data-stories/geographies/index.md:30` → the section landing anchor;
  `content/data-stories/newlook/index.md:37` → the section landing.
- **The only templates linking to per-neighborhood URLs are dead or unselected**:
  `nr-chooser.html:60`, `nr-clickable-uhf.html:94` (both callerless), and
  `topiclanding.html:219,243` — which no content frontmatter selects via `layout:`.
- **The whole NR area is excluded from site search.** `nr-output/single.html`,
  `nr-output/section.html`, and `neighborhood-reports/section.html` all carry
  `data-pagefind-ignore="all"`; `nr-topic-spa.html` carries none. This is current state
  only — the team decided on 2026-08-05 to index NR; see §10.1 and §10.3.

`[verified 08-04: grep across content/, themes/, data/, config/]`

**This says nothing about whether the URLs are used.** §5 does, and the answer is that
they are heavily used. Zero internal links plus 14,200 sessions a year is a description of
pages that live entirely on external referral and search — which is the profile most
sensitive to being deleted.

## 5. Traffic — the numbers that decided it

Source: `cgettings-EHDP-work/data/Google Analytics/Whole_portal_Landing_page.csv`,
GA4 landing-page report, all users, 2025-08-06 to 2026-08-05.

| URL class | URL variants | Sessions | Users | % new | Wtd. avg engagement |
|---|---|---|---|---|---|
| `<nbhd>/<topic>/` — report pages | 216 | **9,549** | 7,790 | 74.8% | 77.5s |
| `<nbhd>/` — neighborhood landings | 73 | **4,689** | 4,435 | 93.8% | 42.5s |
| **Old nr-output total** | | **14,238** | | | |
| `/neighborhood-reports/` — section landing | 2 | 855 | 756 | 76.3% | 112.5s |
| `<topic>/` — SPA topic pages | 6 | 476 | 435 | 84.4% | 52.0s |

`[verified 08-05: PowerShell Import-Csv aggregation over the full file. Of 737 NR rows
outside /beta/, 426 are scanner-probe URLs carrying `'"<>&` injection strings — one session
each, 426 total — and are excluded, leaving 311]`

URL-variant counts exceed real page counts (216 vs 210, 73 vs 42) because GA records
casing and typo variants separately. Those variants are themselves evidence of external
references — `neighborhoodreports/east_harlem/climate_and_health`,
`bedford_stuyvesant cro wn_heights/housing and health`, and NR paths with citation
punctuation appended are not URLs the site can generate.

Three readings that bear on the decision:

- **For scale**, the old NR system out-draws `/data-explorer/air-quality` (11,379), the
  most-visited explorer topic, and draws about 30× the five SPA topic pages combined.
- **The traffic has a long tail**, so a partial migration doesn't help: top 10 report pages
  = 26% of sessions, top 20 = 39%, top 50 = 63%, top 100 = 84%, and 48 pages get under 10
  sessions a year `[verified 08-05: same aggregation]`. Since a content adapter generates
  210 pages as cheaply as 20, the tail costs nothing to keep.
- **The neighborhood landings are search entry points.** 93.8% new users at 42.5s
  engagement is the shape of arriving cold and orienting. They are also the page type the
  topic-first SPA has no equivalent for — see §6.

Report pages run 74.8% new at 77.5s, and the top ones much longer:
`hunts_point_mott_haven/asthma_and_the_environment` draws 493 sessions at 357s average
session duration. These are read, not bounced.

## 5A. RETRACTED — the redirect problem

The 2026-08-04 version's §5 was titled "The redirect problem — the segment order is
reversed" and called it "the substantive technical finding, and the one that decides how
much work a retirement actually is." It described the 404 bridge falling through to
`redirectHome()` for old-shape URLs, flagged the reading as unverified, and specified a
browser test.

**That section is withdrawn, not answered.** Under §6 the URLs do not change, so there is
no redirect to write, no segment order to reconcile, and the fall-through behavior stops
mattering. The browser test it specified is no longer worth running for this purpose.

## 6. The decision: keep the URLs, generate the pages

Retire the `nr-output` templates and content files. Do not retire the URLs. Generate
`/neighborhood-reports/<nbhd>/<topic>/` and `/neighborhood-reports/<nbhd>/` from a Hugo
content adapter, and move the SPA back onto that path shape.

### Why not SPA-only

Googlebot crawls, renders in headless Chromium, then indexes
([Google, JavaScript SEO Basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
fetched 2026-08-05). That is not sufficient here, for reasons that are not about rendering:

- **No crawlable neighborhood URL exists.** `nr-topic-spa.js:161-164` states the design:
  the neighborhood travels through `sessionStorage`, not the `href`, because a href
  carrying it 404s in dev and depends on the IIS rewrite in production. Google discovers
  URLs from anchors in rendered HTML. There are none to follow.
- **Every deep view self-canonicalizes to the topic page.** `partials/seo.html:3` emits
  `<link rel="canonical" href="{{ .RelPermalink }}">` from Hugo, so
  `/neighborhood-reports/asthma_and_the_environment/east_harlem` would declare itself a
  duplicate of the bare topic page `[verified 08-05: grep for canonical across
  themes/dohmh/layouts returns exactly this one site]`. `<title>` and meta description are
  likewise per-topic and identical across all 42 neighborhoods.
- **`replaceState` does not create a page.** `nr-topic-spa.js:151` rewrites the address bar
  after render, for sharing. Google indexes the URL it fetched.

Separately, reporting through mid-2026 is consistent that GPTBot, ClaudeBot, PerplexityBot,
Meta-ExternalAgent and Bytespider fetch but do not execute JavaScript, and that Bingbot
renders with limited framework support
([SearchOptimo](https://searchoptimo.com/blog/do-ai-crawlers-render-javascript),
[searchVIU](https://www.searchviu.com/en/ai-crawlers-javascript-rendering/),
[Radiant Elephant](https://www.radiantelephant.com/server-side-rendering-ai-crawlers/), all
fetched 2026-08-05). These are secondary sources, not vendor documentation — treat the
specific percentages as unverified. The direction is uncontested across all three and
matches site-wide audit §12's finding for the data explorer.

### Why the old URL order

With generated pages, Hugo's own routing produces the structure:

| URL | What it is | Sessions today |
|---|---|---|
| `/neighborhood-reports/` | section landing | 855 |
| `/neighborhood-reports/<nbhd>/` | neighborhood index — 5 topic links | 4,689 |
| `/neighborhood-reports/<nbhd>/<topic>/` | the report | 9,549 |
| `/neighborhood-reports/<topic>/` | topic index — 42 neighborhood links | 476 |

- **Zero redirects for 14,238 sessions a year.** The old URLs are not preserved; they
  simply remain the URLs.
- **The IIS-rewrite dependency disappears.** Every path becomes a real file. This retires
  the old §7.5 rather than answering it.
- **The neighborhood-landing gap closes.** Under topic-first there is no slot for
  `/neighborhood-reports/east_harlem/`, and it draws 4,689 sessions. Under this shape it is
  an ordinary Hugo section index.
- Topic-first entry points survive as `<topic>/` index pages carrying 42 crawlable links.

Constraint this introduces: topic slugs and neighborhood slugs both occupy the first
segment, so the two sets must stay disjoint. They are today, but it becomes a naming rule
rather than an accident.

### What the generated pages can carry without EHDP-data at build time

All of it comes from the repo `[verified 08-05: file inspection]`:

- `assets/js/uhflist.json` — 42 neighborhoods with `UHF_name`, `Zipcodes`, `page_name`, and
  demographics (`TotalPopulation`, `PovertyPercent`, `PercentGraduatedHighSchool`,
  `PercentLimitedEnglish`, `PercentRentBurdened`, `PercentOver65`, `PercentUnder18`).
- `data/globals/NR_content/*.yml` — per topic, ~8 `report_topic` entries each with a written
  `report_topic_description` and a `MeasureID` list.
- Indicator names and descriptions, from the `metadata.json` that
  `data-explorer/single.html:1063` already fetches once at build time — see §8.

So a generated page ships a unique `<title>`, unique meta description, a correct
self-canonical, an `<h1>`, the ZIP list, real demographic figures, and every indicator
group heading with its prose description, all in static HTML. Only the measure values
arrive via JS, and Googlebot renders those in.

The `MeasureID` → name join resolves, and yields more than expected. `metadata.json` is a
flat array of indicator objects, each carrying `IndicatorID`, `IndicatorName`,
`IndicatorDescription`, and a nested `Measures` array whose entries carry `MeasureID`,
`MeasureName` and `MeasurementType` `[verified 08-05: fetched
raw.githubusercontent.com/nychealth/EHDP-data/production/indicators/metadata/metadata.json;
confirmed by the team the same day — measures nest under indicators in concept and in the
JSON]`. So each `MeasureID` in `NR_content` resolves to a specific `MeasureName` *and* its
parent `IndicatorName`/`IndicatorDescription`.

That settles what a generated page can carry per report topic: the topic's own
`report_topic_description` from `NR_content`, plus for every listed measure a measure name,
an indicator name, and an indicator description — all in static HTML, from one build-time
fetch that already happens. Structure re-derived from a live fetch rather than a committed
fixture, so re-check it if EHDP-data reshapes `metadata.json`.

Mechanism: Hugo content adapters, a `_content.gotmpl` under `content/` calling `.AddPage`
in nested loops. Introduced in Hugo 0.126.0
([Hugo docs](https://gohugo.io/content-management/content-adapters/), fetched 2026-08-05);
this repo runs 0.146.7 `[verified 08-05: npx hugo version]`. The docs demonstrate adapters
reading remote data via `resources.GetRemote` but do not show `.Site.Data` access — expected
to work, not verified. Spike it before planning around it.

## 7. What the SPA rewiring costs

Four edits, one of which is a deletion `[verified 08-05: read at cc61dfd4e4]`:

*Line references updated 2026-08-06 for the module split: all three functions landed in
`assets/js/nr-topic-spa/url.js`, so this whole edit set is now one file.*

- **`url.js:21`** — `getNeighborhoodFromURL` reads the *last* path segment and looks
  it up in `neighborhoodMap`. Under `<nbhd>/<topic>` the last segment is the topic. Replace
  with a membership search, `pathParts.find(p => spaConfig.neighborhoodMap[p])`, which is
  position-independent and therefore correct under either scheme — so it can land ahead of
  the rest.
- **`url.js:58`** — `setNeighborhoodInURL` splices the slug in after
  `spaConfig.topicSlug`. It composes `<nbhd>/<topic>` instead. Same shape, different index.
- **`url.js:93` `updateTopicLinks`** — deleted, along with the
  `nr_pending_neighborhood` bridge it feeds. Once the pages exist the tabs become plain
  anchors to real URLs, which is also what gives Googlebot 210 links to follow.
- **`themes/dohmh/layouts/404.html:60-72`** — the dev bridge becomes unnecessary when every
  path resolves, and can go back to being a 404.

Plus five `url:` lines in the topic frontmatter (`content/neighborhood-reports/*.md`), and a
`characterize:nr` re-baseline, since the harness captures the final URL.

One consequence that is **not** a cost of reverting: once pages are generated, an in-page
neighborhood switch makes the DOM diverge from the HTML that URL serves. That is true under
either URL scheme — it follows from generating pages at all. The ordinary resolution
applies: server HTML correct for the URL fetched, JS updates in place, `replaceState` keeps
the address bar honest.

## 8. The build-time dependency claim, corrected

"Eliminate the build-time dependency on EHDP-data" has been cited as a motivation for the
SPA work. It is true only in a narrow sense. There are exactly three build-time
`resources.GetRemote` call sites in the layouts `[verified 08-05: grep -rn over
themes/dohmh/layouts, counted by file]`:

| File | Fetches | Fate |
|---|---|---|
| `nr-output/single.html:420` | per-report JSON, inside a per-report-topic loop | retired |
| `neighborhood-reports/topiclanding.html:115` | `nr_indicator_names.json` | template is unselected — see §9 |
| `data-explorer/single.html:1063` | `indicators/metadata/metadata.json` | stays |

After this work the site still cannot build with EHDP-data unreachable. What goes away is
the *report-data* fetch — a `GetRemote` inside a loop across 42 neighborhoods, which is
presumably where the build-time pain actually sits — not the dependency class. If the goal
is literally zero, `data-explorer/single.html:1063` is the remaining item and is separate
work.

This also means §6's use of `metadata.json` adds no new dependency: it reuses one fetch that
already exists and is not scheduled to go.

## 9. What this absorbs from site-wide audit §5a

§5a owns overlapping deletions. This memo should take them over rather than run beside it,
or two documents end up owning the same files. **§5a has not yet been edited to hand them
over** — do that when this memo is acted on, or the conflict is live:

- The three dead partials (extend to five — see §2)
- Dead `assets/js/ccd-to-uhf42.json` and `static/UHF42.csv`
- The `uhflist.js` / `uhflist.json` vintage split — P1, a correctness bug, and now a
  blocker: see §10
- `topiclanding.html`'s duplicate `uhflist.js` tag — moot if the template goes
- Gating `uhflist.js` in `head.html` — independent of this, leave it in §5a

`topiclanding.html` itself is the loose end: nothing selects it, but §5a still treats it as
live. Resolve that separately; it is one file.

## 10. Open questions

### 10.1 Answered by the team, 2026-08-05

- **The SPA is a view-by-view replacement.** The same UI interactions were designed to
  produce the same views `[answered 08-05: team]`. This removes the last content-loss
  objection to deleting `nr-output`, and it means the Vega `spec/` path has no surviving
  consumer.
- **EHDP-data has no other consumers of `neighborhood-reports/spec/` or `images/`**
  `[answered 08-05: team]`. Combined with the above, both directories become deletable in
  that repo — **after** this work lands, not before, since `nr-output/single.html:179-180`
  and `:416` still read them until the template goes. Hand off as a follow-up.
- **Neighborhood Reports should be in site search.** Rationale recorded because it will
  otherwise be re-litigated: the pages are expected to carry indicator names and
  descriptions, which is exactly what makes them worth indexing `[answered 08-05: team]`.
  Two consequences in §10.3.
- **`uhflist.js` is the source of truth; `uhflist.json` goes with `nr-insert-zips.html`**
  `[answered 08-05: team]`. The premises check out, and the field-level picture is narrower
  than site-wide audit §5a implies — see §10.5.
- **Crawlers are welcome, as an affirmative decision rather than an omission.** Rationale:
  people ask chatbots questions the Department has data for, so being crawled is a public
  service independent of how anyone feels about the use case `[answered 08-05: team]`.
  This closes the P3 policy item in site-wide audit §12. Two consequences in §10.3.

### 10.2 Still open

**Nothing.** The last item, Option B vs Option D, was decided 2026-08-06 — see §10.4.
Both options' prerequisites had already been probed and passed (§10.6), so implementation
is not waiting on a check or a decision.

Not blocking, but see §10.5: the five ACS percentages in `uhflist.js` have no established
vintage, and this work promotes them from JS-rendered to static, indexed HTML.

Closed earlier: the retire-or-redirect question (§5); the analytics question (§5); the IIS
config question (§6 — dissolved); the URL-order rationale (§0.3 — artifact, no defence).
Closed 08-05: the `MeasureID` join (§6 — resolves, via nested `Measures`), and the four
items in §10.1.

### 10.3 Consequences of the site-search and crawler answers

- **`themes/dohmh/layouts/neighborhood-reports/section.html:3` carries
  `data-pagefind-ignore="all"`** on the wrapping `<article id="primary-content">`, which is
  what excludes the whole landing page `[verified 08-05: grep across
  themes/dohmh/layouts]`. That one attribute comes off. The other NR occurrences are in
  `nr-output/single.html:215` and `nr-output/section.html:25,36`, both of which this work
  deletes; `nr-topic-spa.html` carries none, so generated report pages are indexed by
  default.
- **Watch for near-duplicate search results.** `NR_content` holds one
  `report_topic_description` per topic, not per neighborhood, so indexing 210 report pages
  puts 42 copies of each description into Pagefind. Whether that degrades result quality is
  worth looking at once it is indexed; it is not a reason to hold the decision.
- **`robots.txt` in production is empty and has no `Sitemap:` line.**
  `themes/dohmh/layouts/robots.txt` wraps its whole body in
  `{{ if not (in (slice "production" "prod_prod") hugo.Environment) }}`, so the live file
  has no content at all, and no `Sitemap:` directive appears anywhere in `themes/` or
  `static/` `[verified 08-05: read + grep]`. Site-wide audit §12 rates this P3. Adding ~250
  URLs is the moment it starts paying, so fold the one-line fix into this work.
- **Record the crawler stance in the file itself.** §12's point was that "allow everyone by
  omission" and "allow everyone deliberately" are indistinguishable in the repo. A comment
  in the `robots.txt` template naming the decision and its date is what makes it the
  latter.

### 10.4 Option B or Option D — DECIDED 2026-08-06: **Option D**

**Option D — generate the pages from a content adapter.** Rationale, recorded so it is not
re-litigated: it gets everything, and the concessions are to elegance rather than to
capability — shipping ~250 generated pages instead of five clean SPA URLs is clunkier than
the architecture anyone would draw from scratch, and search indexing is a good reason to
accept that `[decided 2026-08-06: team]`.

**One consequence to hold accurately.** Option D is the *maintenance*-optimal choice, not
the indexing-optimal one — Option B would have put more in the static HTML, because it keeps
the build-time fetch that renders measure values. What D concedes is the **numbers**, and
only to crawlers that don't run JS. After the cold-fetch measurement (§12a) that gap is
narrower than the table below implies: the topic prose is already static today, so D loses
values alone, not descriptive content. Concretely, once this ships a non-JS crawler sees
neighborhood name, ZIP list, demographics, indicator and measure names, and indicator
descriptions — and not the rates. Googlebot, which renders, sees everything. If anyone later
asks why an AI assistant knows the Department publishes East Harlem asthma data but not the
figure, this is the line that answers it.

The comparison that produced the decision:

[`nr-decisions-and-sequencing-2026-08-04.md`](nr-decisions-and-sequencing-2026-08-04.md)
reached neighborhood-first URLs independently, before the analytics, as its **Option B**.
It gets there differently from §6 of this memo, which that document labels **Option D**.
Both produce the same URLs:

| | Option B — re-point the content files | Option D — generate (this memo's §6) |
|---|---|---|
| Where the 210 pages come from | keep them; swap `type: nr-output` → `layout: nr-topic-spa` | delete them; `_content.gotmpl` emits them |
| Measure values in static HTML | yes — reuses the build-time fetch | no — names, descriptions, demographics only |
| Build-time EHDP-data report fetch | kept | removed |
| Card renderers to maintain | two (`nr-indicator-new.html` + `buildIndicatorCard`) | one |
| Editable in CloudCannon | yes | no — generated pages are not content files |
| 42 neighborhood index pages | need building separately | fall out of the same loop |

Option B puts more in the HTML for non-rendering crawlers. It also keeps the per-report
build-time fetch this branch set out to remove, and commits to two card implementations
staying in visual agreement — which the sequencing doc calls "the real price, not the
template work." The CloudCannon row is raised in neither document and matters if content
editors are ever expected to touch these pages.

Option B carries one prerequisite this memo's path does not: whether `layout: nr-topic-spa`
resolves for a page two levels deep in a nested section. Hugo's lookup order is
version-specific and this repo runs 0.146.7. **Probed and passed — see §10.6.**

### 10.6 Both mechanisms' prerequisites — probed 2026-08-05, both pass

Run as one throwaway `hugo --environment development` build to a scratch directory, with no
dev server running, probe files deleted afterwards `[verified 2026-08-05]`:

- **A content adapter can read `.Site.Data`** — Option D's only unverified prerequisite. A
  `content/_probe/_content.gotmpl` reached `.Site.Data.globals.NR_content` and reported all
  5 topics with correct `report_topics` counts and names (Asthma 8, Outdoor Air 6, the other
  three 4 each). It also read `resources.Get "js/uhflist.json" | transform.Unmarshal` —
  42 rows, first row `Kingsbridge - Riverdale`, zips `10463, 10471`. So the adapter can see
  everything §6 requires of it, from inside content assembly.
- **`layout: nr-topic-spa` resolves two levels deep in a nested section** — Option B's
  prerequisite. `content/neighborhood-reports/_probe_nbhd/asthma_and_the_environment.md`
  carrying only `layout:` and `content_yml:` built to 58,943 bytes containing
  `NR_TOPIC_SPA_CONFIG` and 8 `nr-section-N` divs, matching Asthma's 8 report topics. Hugo
  0.146.7 resolves it; no shared partial or `type:` workaround is needed.

Build exited 0 with no errors either time. **Neither option is blocked on a technical
unknown any more** — the choice in §10.2 is now purely the trade-off in §10.4.

### 10.5 The `uhflist` split, resolved — and what it does not settle

The team's call is to keep `uhflist.js` and let `uhflist.json` go with
`nr-insert-zips.html`. Both premises hold `[verified 08-05]`:

- **`uhflist.json` has exactly one consumer**, `partials/nr-insert-zips.html:1`, and it
  reads exactly one field — `Zipcodes`, via `where "page_name"` then `"Zipcodes"`. Nothing
  else in `themes/`, `assets/`, `config/` or `layouts/` references the file.
- **`nr-insert-zips.html` is nr-output-exclusive** (§1) and goes with the rest.

The field-level comparison narrows the problem considerably, and **site-wide audit §5a's
"all 42 rows differ" is true but reads as more than it is** — 8 of 13 fields are
byte-identical across every row `[verified 08-05: parsed both files, joined on UHF_id,
counted differing rows per field]`:

| Identical in all 42 rows | Differ in all 42 rows |
|---|---|
| `UHF_id`, `UHF_name`, `page_name`, `Zipcodes`, `namezip`, `TotalPopulation`, `PercentOver65`, `PercentUnder18` | `PovertyPercent`, `PercentGraduatedHighSchool`, `PercentLimitedEnglish`, `PercentRentBurdened`, plus owner-occupied — renamed between the files (`OwnerOccupiedPercent` vs `PercentOwnerOccupied`), so not directly compared |

Two consequences:

- **Dropping `uhflist.json` loses nothing.** Its only consumer reads `Zipcodes`, and
  `Zipcodes` is byte-identical in the `.js`. This is a stronger warrant than "the consumer
  is going away."
- **§5a's demand for content sign-off does not apply to this direction.** Its
  "Suggested order" step 4 wanted sign-off because collapsing the two "changes the numbers
  shown on neighborhood reports" — but it was recommending the *JSON-only* shape. Keeping
  the `.js` changes no displayed number, since the `.json` percentages have never been
  rendered anywhere. Choosing the `.json` would have been the content change.
  **Corrected in place 2026-08-05**, along with §5a finding 1's framing.

What this does **not** establish is that the `.js` figures are current. Choosing it is a
decision to keep displaying what the site already displays, which is the low-risk call, not
a finding that its vintage is right. Neither file could be dated from available sources: the
three ACS poverty files in `cgettings-EHDP-work/data/` are all the same 2015-19 pull, giving
UHF 101 poverty as 15.08, matching neither `.js` (16.53) nor `.json` (16.1624)
`[verified 08-05: grep across ACS*Poverty*.csv]`. A formatting signature hints they have
different origins — `.json` carries 4+ decimals throughout, `.js` two — but that dates
nothing.

This matters more after this work than before it. The five ACS percentages move from
JS-rendered to static HTML, on ~250 pages, indexed, under the Department's name.
**The team is correcting the ACS values on a separate track** `[decided 08-05]`. That work
and this one touch the same file for different reasons, so whichever lands second should
re-read `uhflist.js` rather than assume its shape — and if the correction lands first, the
generated pages simply pick up the corrected figures with no change here.

## 11. Staging

The 08-04 version's "redirects first, deletion second" is void. It is replaced by a harder
constraint: **generated `<nbhd>/<topic>` pages occupy the same paths as the 252 existing
content files**, so Hugo conflicts. The deletion and the generation must land in the same
commit. They cannot be staged, and both cannot run at once for comparison.

That removes the rollback the old §8.1 was built around, so buy it back cheaply: capture the
rendered output of the top 20 report pages by traffic (39% of sessions) before the swap, and
diff the generated pages against that capture for what must survive — neighborhood name, ZIP
list, indicator names and descriptions, and the EHDP-data URLs fetched. Same technique
`characterize:nr` already uses for the SPA, pointed at `nr-output` for one run.

**Status as of 2026-08-06:** steps 1, 3 and 4 done and committed; step 2 on a separate track;
steps 5–6 not started, and both have grown — see the new step 4a and the Web.config item under
step 5.

1. ~~**Delete the five callerless partials.**~~ **DONE 2026-08-06.** Both string traps in §2
   held. **The proof named here was wrong and was not used:** a `git diff` of `docs/` cannot
   work, because that tree is a stale `local-stage` build and the diff would be dominated by
   the environment difference. What was run instead: two full `--environment production`
   builds into separate temp directories, before and after, diffed with `diff -r`. Both
   2,766 files / 1,158 pages; the only differing lines were the three home-page
   `build_datetime` stamps, which differ between any two builds. **Use that A/B form for
   step 5's diff too, not a `docs/` diff.**
2. **Resolve the uhflist vintage split** (§10.1). **On a separate track** — the team is
   correcting the ACS values independently `[decided 08-05]`. Whichever lands second should
   re-read `uhflist.js` rather than assume its shape.
3. **Make `getNeighborhoodFromURL` position-independent** (§7). **DONE 2026-08-06**
   (`d55fb1d936`). The last-segment read in `getNeighborhoodFromURL`
   (`assets/js/nr-topic-spa/url.js`, step 1 of the function) became
   `pathParts.find(p => spaConfig.neighborhoodMap[p])`.

   **The proof named here was insufficient, and the reason generalizes.** It prescribed
   `npm run lint` plus `npm run characterize:nr -- --check`. Both were run and both pass
   (lint clean; 3/3 targets match) — but **the harness never exercises the code that
   changed.** It navigates to the clean topic URL and injects the neighborhood through the
   `sessionStorage` bridge (`scripts/nr-characterization.mjs`, the `addInitScript` that
   writes `nr_pending_neighborhood`), which is step *2* of the function. A green run here
   proves step 2 is intact and says nothing about step 1. Treat this as standing: **no
   change to path-based neighborhood resolution can be proven by `characterize:nr`** until
   the harness navigates to real `<nbhd>/<topic>/` URLs, which is step 6's job.

   What actually proved it `[verified 2026-08-06: Playwright against a `dev_stage` server]`:
   with `sessionStorage.clear()` first — so only step 1 could answer — calling
   `getNeighborhoodFromURL()` after `history.replaceState` to each shape returned
   `East New York` for neighborhood-first `/…/east_new_york/asthma_and_the_environment/`,
   `East New York` for topic-first, `Bayside - Little Neck` for a two-word slug, and `''`
   for both negatives (no neighborhood in path; unknown slug) — the negatives being what
   shows it does not match indiscriminately or mistake the `/dev-stage/` prefix for a slug.
   Instrument validated before trusting any of it: `typeof getNeighborhoodFromURL` is
   `'function'` and `neighborhoodMap` has 42 entries.
4. **Spike the content adapter** (§10.5). **DONE 2026-08-06 — every question passed.** Run
   against a `dev_stage` dev server rather than a static build, which also let the emitted
   `<meta>` tags be read directly; probe files (`content/neighborhood-reports/_content.gotmpl`,
   `data/globals/probe_uhflist.json`, a throwaway diagnostic layout) deleted, and on a
   restarted server the probe URLs 404 while the real pages 200, with zero build errors.

   Established: `kind: "section"` yields a real branch page; `layout` is settable in the
   `.AddPage` map; underscores survive the path transform (`probe_neighborhood` 200s,
   `probe-neighborhood` 404s); the adapter reads a **top-level JSON array** from
   `data/globals` (uhflist's shape — `NR_content`'s map-of-maps did not test this); the
   generated section sees its children in `.Pages`; `.Section` is `neighborhood-reports`, so
   `head.html`'s Pagefind filter chip fires. **The one that mattered:** the generated report
   page emitted `data-pagefind-meta="title:Asthma and the Environment | Probe Neighborhood"`,
   matching the `nr-output` control `"…| East Harlem"` — so `.Parent.Title` resolves and
   search results keep the neighborhood in the title.

   **Three findings that change step 5**, none of which fail loudly:
   - **`.Params.title` is empty on adapter pages; `.Title` works.** The page map's top-level
     `title` sets `.Title` only. `nr-topic-spa.html` reads `.Params.title` for both `<h1>`s,
     the breadcrumb and `reportName` — all rendered blank (`reportName: ""`). Switch them to
     `.Title`, which is identical for the five existing topic content files.
   - **`.File` is not nil on an adapter page — `.File.BaseFileName` is `_content`.** So
     `topiclanding.html`'s Pagefind block, which filters `where … "title" "eq"
     .File.BaseFileName`, would match **zero rows silently** rather than error. Key it on
     `.Params.content_yml`, which is the same string the JSON's `title` field holds.
   - **JSON numbers arrive as `float64`** (`geocode` → `999 (float64)`). Renders fine; an
     `eq` against an int literal will not match.
   **Step 4a — move the neighborhood list to `data/globals/`. Not started.** A new step, kept
   inside item 4 so the 1–6 numbering this memo and the sequencing doc cross-reference stays
   put. It must run before step 5 — the adapter
   needs the 42 rows at build time, but §10.5 retires `assets/js/uhflist.json` with
   `nr-insert-zips.html`, and `assets/js/uhflist.js` is not build-readable as-is. Derive
   `data/globals/uhflist.json` mechanically from `uhflist.js` (strip its `var neighborhoods = `
   prefix; it has no trailing semicolon, so the remainder is valid JSON), emit the browser
   global as a build resource via `resources.FromString` so SRI is unchanged, and repoint the
   three loaders — `partials/head.html` site-wide, plus the redundant duplicate tags in
   `index.html` and `topiclanding.html`. **Touches the same file as step 2's separate track**,
   so coordinate before running it: whichever lands second re-derives rather than assumes.
   Proof: the step-1 A/B production build form, normalizing the changed fingerprint, plus a
   browser check that `neighborhoods.length === 42`, plus `npm run smoke` — `head.html` is on
   every page.
5. **The swap**, one commit: the adapter generates 210 report pages, 42 neighborhood
   indexes, and 5 topic indexes; the 252 content files, 2 layouts, 3 exclusive partials,
   and the two `nr-output` entries in `PAGES` (indices 11 and 12, file lines 32-33) in `scripts/smoke-pages.mjs` all go.
   Diff against the pre-captured sample. **Not started.** Four amendments since this was written:

   - **`static/Web.config:322-327` must be deleted in this commit.** The `nr-old-to-new-spa`
     rule is a permanent 301 from `<nbhd>/<topic>/` to `<topic>/<nbhd>` with
     `stopProcessing="true"`, so it fires before IIS serves a static file and would **301 away
     every generated page**. `static/Web.config` is published by Hugo (`docs/Web.config`
     exists), so it is a real deploy artifact. It is **not on `production`** — it arrived with
     the SPA work in `902bdb98a1` and exists only on the feature-branch lineage
     `[verified 2026-08-06: git grep against production; git log -S]`. The sibling
     `nr-spa-neighborhood-path` rewrite (`:304-309`) goes with it; team decision 2026-08-06 is
     to delete both outright rather than redirect the topic-first shape, which never shipped.
   - **`data/globals/NR_footer` and `partials/nr-report-footer-sm.html` are KEPT**, reversing
     this line's original instruction `[decided 2026-08-06: team]`. That footer is real
     curated content on 210 live pages and the SPA has no equivalent, so deleting it would be
     content loss rather than cleanup; the partial carries `data-pagefind-ignore="all"`
     (`:14`), so keeping it adds nothing to the search index. `partials/nr-report-footer.html`
     — the non-`-sm` one, already callerless — still goes.
   - **Two new layouts are needed, not just the adapter.** Deleting `nr-output/section.html`
     leaves `/neighborhood-reports/<nbhd>/` (4,689 sessions/yr) with nothing to render it, and
     a bare `<topic>/` page under the SPA layout renders empty section divs (§12a). Port
     `nr-output/section.html` for the neighborhood index, and build a topic index carrying a
     server-rendered 42-neighborhood link list — the list `topiclanding.html` builds in JS
     today. That template can then go: it is unselected on this branch but **live on
     `production`**, where all five topic files carry `layout: topiclanding`
     `[verified 2026-08-06]`, which corrects §9's "nothing selects it".
   - **`CLAUDE.md` must be updated and re-stamped in this commit.** It is in `docs-check`'s
     `ROOT_DOCS` and names both `nr-output` templates by path, so the check fails the moment
     they are deleted.
6. **SPA rewiring** (§7), and re-baseline `characterize:nr`. **Not started.** Also make the
   harness navigate to real `<nbhd>/<topic>/` URLs instead of writing
   `nr_pending_neighborhood` — until it does, it cannot prove anything about path-based
   resolution (see step 3).

Steps 5 and 6 can be one commit or two. Two is better if the generated pages render
correctly with JS disabled, since that is the state worth verifying on its own.

**Independent of the sequence above, and cheap** — both follow from §10.1's answers and
neither blocks or is blocked by anything here:

- Remove `data-pagefind-ignore="all"` from `neighborhood-reports/section.html:3`, and
  re-run `npm run smoke`. Best done with step 5 so the newly-indexed pages arrive together.
- Add an unconditional `Sitemap:` line to `themes/dohmh/layouts/robots.txt`, plus a comment
  recording the 2026-08-05 decision to allow all crawlers and why. Closes the two `robots`
  items in site-wide audit §12.

Verification for the whole run stays unusually cheap for a deletion this size:
`npm run smoke`, `npm run characterize:nr -- --check`, `npm run docs-check`, and a `docs/`
diff. The characterization harness is what proves the deletion didn't reach into the SPA.

## 12a. The cold-fetch baseline — measured 2026-08-05

What a crawler gets from `/neighborhood-reports/asthma_and_the_environment/` with no
neighborhood in the URL and `sessionStorage` empty. Playwright against a `dev_stage` server
started through `scripts/dev-server.mjs`, fresh browser context `[verified 2026-08-05]`:

| | Raw HTML (non-JS crawlers) | Rendered DOM (Googlebot) |
|---|---|---|
| bytes / body text | 58,890 | 2,463 chars of text |
| `nr-section-N` divs | 8 | 8, **all empty** — `children=0`, `textLen=0` |
| report-topic names + descriptions | **6 of 6 markers present** | 6 of 6 |
| links to `<nbhd>/<topic>` | — | **0** |
| canonical | — | the bare topic URL |

Three things this settles, one of which corrects this memo:

- **The topic scaffolding is already server-rendered.** All eight `report_topic` headings and
  their prose descriptions are in the raw HTML with no JS — "Adult Asthma", "Child Asthma",
  "Home Maintenance", "Indoor Air Quality", "PM2.5", "asthma symptoms". §6's claim that
  generated pages "can carry" those is true but understates the present: they already do, for
  the five topic pages. What generation adds is the *neighborhood* dimension and the
  demographics, not the topic prose.
- **There is no citywide or default fallback.** After a full render with no neighborhood
  selected, every one of the eight section divs is empty. The grep at §12 was right. So the
  five SPA topic pages index today as topic descriptions with zero indicator data — that is
  the baseline §6 improves against, now measured rather than assumed.
- **Zero crawlable neighborhood links**, confirming §6's first bullet by count rather than by
  reading the source comment.

Two artifacts of the environment, not findings: `meta robots` reads `noindex, nofollow`
because `head.html:27` fires outside production, and a `PagefindUI is not defined` page error
is allowlisted dev-only noise in `scripts/smoke-pages.mjs` (Pagefind's index is a post-build
step absent under `hugo server`).

One oddity worth a look independently: the page carries **two `<h1>`s, both hidden**, both
reading `"Asthma and the Environment in"` — built to end in a neighborhood name that a cold
fetch never supplies, so the only heading on the page is a dangling preposition.

## 12. What I could not check

- ~~What Googlebot currently gets from a topic page.~~ **Measured 2026-08-05 — see §12a.**
- **EHDP-data's current contents** (§10.3). Separate repo.
- **Whether `docs/` reflects the current build.** The URL shapes here come partly from a
  `docs/` listing, which is generated output and may predate recent content changes. They
  match the content tree, so this is corroboration rather than load-bearing, but re-derive
  from a fresh build before writing anything that depends on exact paths.
- **The AI-crawler figures in §6.** Secondary sources, dated 2026-08-05, not vendor
  documentation. The direction is consistent across them; the numbers are not independently
  confirmed.
