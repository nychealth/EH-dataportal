# Neighborhood Reports — Pagefind indexing parity with `production`

Audit, fix and standing check for what Pagefind indexes on this branch against what it indexes on
`production`. Written 2026-08-15 against `feature-MOD-Lab-NR-recode-refactor`.

**Status as of 2026-08-15: steps 1–8 done; step 9 parked; the §5 GA test is open and would reverse step 8.**

---

## 1. What was compared, and how

Both worktrees held a `docs/` build and a Pagefind index built within the same minute
(`docs/pagefind/pagefind-entry.json`, both `2026-08-14 23:40`), both under `local_prod`, both
Pagefind 1.5.2. Three instruments, cheapest first:

- **Index-level.** Every `.pf_fragment` gunzipped and parsed — they carry a `pagefind_dcd` magic
  prefix ahead of the JSON — into per-URL records of `url`, `content`, `word_count`, `filters`,
  `meta` and `anchors`. This is what Pagefind actually holds, not what a template appears to say.
- **Query-level.** Each `docs/` served statically at `/local-prod/` on a throwaway port, then
  `pagefind.js` queried in Chromium. **This step is not optional.** The fragment `content` for
  production's `/neighborhood-reports/kingsbridge_riverdale/` is only `"ZIP Codes: 10463, 10471."`,
  which reads as "production cannot find this page by neighborhood name". It can: Pagefind searches
  `meta.title` as well as body content, and the query returns the page. Reading fragments alone
  would have produced a confident false finding.
- **Source-level.** The templates behind each difference.

Neither step ran Hugo, so nothing touched `resources/_gen` or either running dev server.

## 2. Findings

### 2a. Outside Neighborhood Reports there is no regression

11 non-NR pages differ. Every one traces to content present on `production` and absent here —
principally `/data-features/congestion-pricing-report/`, whose blurb also moves the word counts on
`/`, `/es/`, `/zh/`, `/data-features/`, `/key-topics/airquality/` and `/key-topics/public-space/`.
The branch is 368 commits behind `production`. Titles and `section` filters are byte-identical
across all 201 shared URLs `[verified 2026-08-15: field-by-field diff of the two fragment sets]`.

**No action. These arrive on merge.**

### 2b. The 47 → 258 page increase is deliberate

`documents/nr-output-option-d-execution-plan-2026-08-06.md` §Pagefind decided it and verified it on
2026-08-07. Literal page-count parity is the wrong target.

### 2c. Precision is the real gap, and it has one mechanism

Production's 42-neighborhood list was assembled in JavaScript (`topiclanding.html`,
`neighborhoods.forEach(… ul.appendChild …)`), so Pagefind never saw it. This branch's
`partials/nr-neighborhood-list.html` server-renders it deliberately — it is the crawl path into
the 210 report pages and the no-JS equivalent of the map. The side effect is that 42 neighborhood
names and every ZIP code entered the index on 6 pages.

Text present on *every* page of a kind, measured across the branch's own fragments
`[verified 2026-08-15: sentence-frequency count over the 210/42/5 fragment sets]`:

| Page kind | Pages | Identical words | Typical total |
|---|---|---|---|
| Neighborhood index `<nbhd>/` | 42 | ~144 (five topic-card blurbs) | ~157 |
| Topic index + landing | 6 | ~331 (the neighborhood list) | 767–945 |
| Report `<nbhd>/<topic>/` | 210 | ~75 (tertile explainer, QR caption) | ~355 |

Query effects `[verified 2026-08-15: pagefind.js in Chromium against both built indexes]`:

- `"Kingsbridge"` — production 1 hit; branch 12, with the neighborhood's own hub page ranked 4th
  beneath three of its own topic reports.
- `"10463"` — production 1 hit, exact; branch 12.
- `"asthma"` — production 46 hits, topic page at #2; branch 299, positions #4–#8 filled with
  per-neighborhood duplicates.
- Against that: `"asthma East Harlem"` returns two unrelated data stories on production and the
  correct report page first on this branch.

Production carried `data-pagefind-ignore="all"` on precisely the neighborhood-index topic cards
(`nr-output/section.html:36`), so item 3 below restores its own treatment rather than inventing one.

## 2d. What production's NR indexing encodes, and who decided it

Production's 47 is not a default. It is a deliberate selective-indexing design, built over five
commits between 2023-08 and 2024-02, all authored by cgettings:

| Commit | Date | What it did |
|---|---|---|
| `fa75f7361a` | 2023-08-24 | first `data-pagefind-ignore` attributes on the report template |
| `9b270a71d6` | 2023-10-25 | "hiding topic and neighborhood, re-adding neighborhood" — put `data-pagefind-ignore="all"` on the report page's whole `#skip-header-target` **and** `#primary-content`, and tried `data-pagefind-index-attrs="neighborhood"` |
| `e2239f835e` | 2023-10-25 | "adding more data-pagefind-ignore attrs" — the chooser chrome |
| `94f3fccd7e` | 2024-02-28 | "improving indexing thru h1-3 and ignore tag need to use h tags for accessibility reasons" — the NR landing page ignore, plus div→h1/h2/h3 with ignores on the report modal headings |
| `77054c60e2` | 2024-02-29 | "add NR indicators to index and some other search/index stuff" — the hidden `<h1 class="d-none">` / `<h2 class="d-none">` indicator blocks on `topiclanding.html` |

The resulting shape, read off the built index rather than the templates:

| NR page kind | Pages | Indexed |
|---|---|---|
| Topic landing | 5 | Everything — intro plus every indicator name and description, 429–607 words |
| Neighborhood hub | 42 | ZIP codes only, 4–19 words; the `<h1>` name is ignored, so the name is reachable through `meta.title` alone |
| Report `<nbhd>/<topic>/` | 210 | **Nothing.** Absent from the index entirely |
| NR landing | 1 | **Nothing** |

So the design is: one indexable page per topic, carrying that topic's whole indicator vocabulary,
and 210 combinatorial pages contributing zero. That is the entire reason `"asthma"` returns 46.

**Its premise was that the report pages had no identity of their own to find.** They were reached
through a topic-first URL plus a `sessionStorage` hand-off, so there was nothing stable to rank —
`data-pagefind-index-attrs="neighborhood"` was an attempt at giving them one and is absent from
both trees today. Option D reversed that premise deliberately: the 210 are now real, crawlable,
individually-titled pages, which is what makes `"asthma East Harlem"` work here and fail on
production. The 2023 decision is not thereby wrong; it is a decision whose input changed, and
re-deciding it is a product call rather than a parity gap.

## 2e. Weights are at parity

Every `data-pagefind-weight` in `themes/dohmh/layouts/` is identical across the two branches, with
two entries not shared `[verified 2026-08-15: `git grep -o` for the attribute on both refs,
sorted and diffed]`:

- `data-features/congestion-pricing-report.html:184` — `7.0`, production only, because the whole
  layout is part of the content drift in §2a. Arrives on merge.
- `neighborhood-reports/nr-neighborhood-index.html:47` — `10`, this branch only. It weights the
  neighborhood name, for which production has no counterpart: its `<h1>` was ignored outright.

Nothing on either branch weights an NR report page or a topic index. Minor house-style nit: the new
one is written `"10"` where every other weight in the repo is written `"10.0"`. Pagefind parses
both.

## 2f. The first page, and why weight does not fix it

Result *count* was the wrong metric. What matters is the first page, and on the five NR topic words
it is crowded out. Top 10, this branch against production
`[verified 2026-08-15: top-10 URL sets read off both indexes]`:

| Query | Production's top 10 still present | Per-neighborhood reports in the branch's top 10 |
|---|---|---|
| `climate` | **0 of 10** | **10** |
| `asthma` | 3 of 10 | 7 |
| `housing` | 4 of 10 | 6 |
| `air quality` | 9 of 10 | 0 |
| `heat` | 10 of 10 | 0 |

On `climate` the whole first page is per-neighborhood reports; `/key-topics/climatehealth/`,
`/data-explorer/climate/` and even `/neighborhood-reports/climate_and_health/` — the topic overview,
beaten by its own 42 children — are all off it. Queries that do not collide with a report title
(`air quality`, `heat`) are untouched.

**Two fixes were tried against this on 2026-08-15. Measured A/B over three builds:**

| Variant | `climate` count | `climate` top 10 | `asthma` count | `asthma` top 10 |
|---|---|---|---|---|
| Neither | 254 | 0 of 10 survive, 10 reports | 257 | 3 of 10 survive, 7 reports |
| `data-pagefind-weight` on the topic index `<h1>` (10.0) and intro (7.0) | 254 | **identical** | 257 | **identical** |
| `data-pagefind-ignore` on the shared topic menu | 82 | 0 of 10 survive, 10 reports | 173 | 3 of 10 survive, 7 reports |

**Weight changed nothing measurable** — identical counts and identical top-10 membership — so it was
reverted rather than shipped with a comment claiming a purpose it does not serve. **Ignoring the
topic menu cut `climate` by two thirds and `asthma` by a third, and left the first page exactly as
it was.** Both were kept as A/B evidence rather than assumed.

The mechanism this exposes: **report pages win the first page on their titles.** A page titled
"Climate and Health | East Harlem" matches `climate` on `meta.title`, there are 42 per topic, and no
body-level lever — neither `ignore` nor `weight` — reaches a title. That closes off the whole class
of fix, so the remaining levers are: change what the report titles are, un-index the 210, add a
filter facet so a searcher can exclude them, or accept it.

One side effect worth recording: removing the menu from 258 pages reordered the top 5 of
`"heat vulnerability"`, an unrelated non-NR query, moving `/data-features/hvi/` off the top spot.
Membership of the top 10 did not change — all 10 of production's are still there — and the
reordering reproduced identically on two independent builds, so it is deterministic corpus-statistic
coupling rather than run-to-run noise `[verified 2026-08-15: two separate --check runs on unchanged
source returned the same list]`.

The topic-menu ignore was kept. It is independently justified on the same
navigation-chrome grounds as the other three, it makes `"asthma East Harlem"` stop returning East
Harlem's *climate* report, and it is a two-thirds precision gain — but **it does not achieve what it
was reached for**, and the first-page decision is still open.

## 2g. Decision: production's model, restored

**The 210 report pages carry a page-level `data-pagefind-ignore="all"` and are not in the search
index.** `nr-topic-spa.html`, on `<section id="skip-header-target">` — the same element the retired
`nr-output/single.html:204` carried it on. Decided 2026-08-15 by the team, after §2f showed the
first page could not be fixed any other way.

Result, against production `[verified 2026-08-15: characterize:pagefind --against ../production/docs]`:

| | production | this branch |
|---|---|---|
| Indexed pages | 201 | **201** |
| `climate` | 43, `key-topics/climatehealth` first | **40, `key-topics/climatehealth` first** |
| `asthma` | 46, top 5 as listed in §2f | **47, same top 5** |
| `housing` | 73 | **73** |
| `heat vulnerability` | 27, `/data-features/hvi/` first | **28, `/data-features/hvi/` first** |
| `Kingsbridge` | 1 | **1** |

The `heat vulnerability` reordering noted in §2f resolved itself: it was caused by the 210 pages
being in the corpus at all, and `/data-features/hvi/` is back at position 1.

Every remaining difference is either the content drift of §2a or a deliberate Option D improvement
kept on purpose:

- `/neighborhood-reports/` — the landing page is indexed here and not on production, so a search
  for "neighborhood reports" reaches the page the reports hang off.
- The 42 neighborhood hubs index their own name (6–19 → 13–15 words); production ignored the `<h1>`.
- The 5 topic indexes are slightly shorter here, because the picker, the neighborhood list and the
  topic menu are ignored where production indexed them.

**What this costs, stated plainly:** `asthma East Harlem` returns two unrelated data stories, which
is exactly what production returns. `Kingsbridge` returns the hub page alone rather than the hub
plus its five reports. Neighborhood+topic search is gone. §5 is the test that would bring it back.

## 5. The GA test — does anyone actually search neighborhood + topic?

The decision in §2g traded away neighborhood+topic search to fix the first page for bare topic
words. Whether that was the right trade is an empirical question about real queries, and the site
already collects the data.

### Where the data comes from

`themes/dohmh/layouts/partials/footer.html`, inside `PagefindUI`'s `processTerm` callback:

```js
processTerm: function (term) {
    gtag('event', 'search', { search_term: term });
    return term;
}
```

So every search fires a GA `search` event carrying the typed term. Two things about it must be
known before the numbers mean anything.

**1. One search can fire many events, one per prefix.** `PagefindUI` runs with
`debounceTimeoutMs: 500` and calls `processTerm` on each debounced search, so a typist slower than
that logs every intermediate string. Measured by typing "climate" into the real search box under
Playwright `[verified 2026-08-15: dataLayer read after typing, two runs]`:

| Typing speed | `search` events fired | `search_term` values |
|---|---|---|
| 120 ms/char | 1 | `["climate"]` |
| 700 ms/char | 7 | `["c","cl","cli","clim","clima","climat","climate"]` |

Raw `search_term` frequencies therefore over-count short strings and under-count real queries, by an
amount that depends on how fast people type. **Do not read a raw top-terms list as a query
distribution.** It is not a reason to distrust the test below, because a term long enough to contain
a whole neighborhood name is not a prefix artefact — but it is a reason never to compare a
short term's count against a long one's.

**2. Stubbing `window.gtag` to capture these does not work.** The GA snippet replaces it with
`function gtag(){dataLayer.push(arguments);}` after page scripts run, so a stub installed earlier
records zero and reads as "the event never fires". Read `window.dataLayer` instead. This cost a
false negative on 2026-08-15 and was caught only by a positive control.

### The question, and the rule

**How often does someone search for a neighborhood together with a topic?** That, and only that, is
what §2g gave up. A neighborhood name alone is still served: the hub page ranks first for it and
links to all five of that neighborhood's reports.

Procedure:

1. Pull `search` events with their `search_term` for a window of at least 90 days — long enough to
   cover seasonal topics like heat and asthma. **Confirm first that `search_term` is actually
   queryable in the property**: GA4's built-in site-search reporting keys on its own
   `view_search_results` event, and this is a custom `search` event, so the parameter may need
   registering as a custom dimension, or the data may need to come from a BigQuery export. Establish
   which before concluding anything from an empty report — an unregistered parameter and a term
   nobody searches look identical.
2. Classify each term against `data/globals/uhflist.json` (42 `UHF_name` values, plus their
   `Zipcodes`) and the five topic words in `data/globals/NR_topics.yml`:
   - **neighborhood+topic** — contains a neighborhood name or a ZIP *and* a topic word
   - **neighborhood only** — contains a neighborhood name or a ZIP and no topic word
   - **topic only** — contains a topic word and no neighborhood
   - **other**
3. Count **distinct sessions**, not events, so one slow typist is one data point.

**The rule.** If *neighborhood+topic* is a materially larger share of NR-related searches than
*topic only*, §2g is the wrong trade and should be reversed. If *topic only* dominates — which is
what §2g assumes — leave it.

"Materially larger" is a judgment the team makes on seeing the split; it is deliberately not a
number here, because no measurement supports one yet, and inventing a threshold would dress a guess
as a finding.

### Reversing it

Delete the `data-pagefind-ignore="all"` on `<section id="skip-header-target">` in
`themes/dohmh/layouts/neighborhood-reports/nr-topic-spa.html`. The narrower ignores below it — the
tertile explainer and the print-only QR caption — are still in place and become live again, and
§2c's neighborhood-list and picker ignores are unaffected. Then:

```
node scripts/pagefind-characterization.mjs --check
```

It will fail on the inverted control for `/neighborhood-reports/east_harlem/asthma_and_the_environment/`,
which exists to make this reversal deliberate rather than accidental. Re-baseline once you mean it,
and expect §2f's first-page crowding to return with it — that is the trade being re-taken, not a
regression.

## 3. Ledger

The fix principle: **index what distinguishes a page; ignore navigation and shared explainer
chrome.** `data-pagefind-ignore` is read only by Pagefind — crawlers, the accessibility tree and
the no-JS fallback all keep the markup — so none of Option D's gains are spent.

| # | Step | Status |
|---|---|---|
| 1 | Audit: fragment diff, query probe, source read | **DONE 2026-08-15** — §1–2 above |
| 2 | This document | **DONE 2026-08-15** |
| 3 | Ignore the neighborhood list and picker chrome — `partials/nr-neighborhood-list.html`, `partials/nr-neighborhood-picker.html` | **DONE 2026-08-15** |
| 4 | Ignore the five topic cards on `neighborhood-reports/nr-neighborhood-index.html`, keeping the `<h1>` name and ZIP list | **DONE 2026-08-15** |
| 5 | Ignore the tertile explainer (`.asidebox`) and the print-only QR caption on `neighborhood-reports/nr-topic-spa.html` | **DONE 2026-08-15** |
| 6 | `scripts/pagefind-characterization.mjs` + `npm run characterize:pagefind` | **DONE 2026-08-15** |
| 7 | Ignore the shared topic menu — `partials/nr-topic-menu.html` | **DONE 2026-08-15** — §2f |
| 8 | Decide the first-page question in §2f | **DONE 2026-08-15 — team chose production's model.** The 210 report pages are un-indexed; §2g has the result and the cost. Reversible, and §5 is the test that would reverse it |
| 10 | Run the §5 GA test and re-decide step 8 | **Not started.** First action is §5 step 1 — confirm `search_term` is queryable in the GA property at all, since an unregistered parameter and a term nobody searches produce the same empty report |
| 9 | Second `data-pagefind-filter` dimension separating NR overviews from the 210 reports | **Parked 2026-08-15 — team.** The UI already renders filters (`showEmptyFilters: true`, `footer.html`), but all 258 NR pages share the single "Neighborhood Reports" value, so filtering cannot separate them today. It is an escape hatch, not a fix: it changes nothing about default results, which is where §2f's harm is. Unpark if the step 8 decision does not settle the first page |

### Result of steps 3–5

Rebuilt into a temp directory and re-indexed `[verified 2026-08-15: isolated hugo build with
`HUGO_RESOURCEDIR`, then pagefind 1.5.2 over it, fragments re-extracted]`:

| Page kind | Pages | Avg indexed words, before → after |
|---|---|---|
| NR landing | 1 | 711 → 362 |
| Topic index | 5 | 870 → 521 |
| Neighborhood index | 42 | 157 → 13 |
| Report | 210 | 291 → 203 |

Indexed page count is unchanged at 411, so nothing dropped out of the index. `east_harlem`'s
neighborhood index now reads `"Neighborhood Reports for East Harlem ZIP Codes: 10029, 10035."`
against production's `"ZIP Codes: 10029, 10035."` — production's text plus the name that makes the
page findable as itself.

Queries `[verified 2026-08-15: pagefind.js in Chromium against the rebuilt index]`:

- `"Kingsbridge"` — 12 hits → **6**, all six of them that neighborhood's own pages, with the hub
  page first rather than fourth. Production returns 1.
- `"10463"` — 12 → **6**, same six.
- `"asthma East Harlem"` — 14 → **7**, correct report page first.
- `"asthma"` — 299 → **257**, against production's 46.

**That last one does not reach production's shape, and only one kind of change could.** The residue
is not boilerplate: 42 pages are genuinely titled "Asthma and the Environment | *neighborhood*", and
un-indexing them is the thing Option D exists to do the opposite of. Positions #4–#8 for a bare
topic term are per-neighborhood reports.

Two levers exist and they do different things, which is worth stating because it is easy to reach
for the wrong one. **`data-pagefind-weight` cannot reduce the count** — it is a ranking multiplier,
not a gate on matching. The `resources/*` pages carry `data-pagefind-weight="0"` on their container
and are still indexed with 11–29 words each, still returned, and still rank *first* for their own
content `[verified 2026-08-15: "Sugar Lookup Tool" returns /resources/sugar-lookup/ at position 1]`.
So weight can push the topic index above the 42 reports; it will not make 257 into 46. Only removing
text from the index does that, and on a report page the only text left to remove is the text that
makes it a report. Production's 46 is a consequence of indexing none of those 210 pages at all —
see §2d.

The markup all survives — 42 `data-nbhd` links on both page kinds, the typeahead, the toggle, the
tertile box, the QR caption, the five topic cards `[verified 2026-08-15: greps over the temp
build's HTML]`. Nothing in `assets/` or `scripts/` reads a `data-pagefind*` attribute, so there is
no runtime coupling to have broken.

### The dropped item, settled

Re-adding `id="nrtitle"` was dropped on reasoning and then checked. Production's second sub-result
on a topic index is `Asthma and the Environment -> …/asthma_and_the_environment/#nrtitle` — the
page's own title, linking to the page's own `<h1>`, under a result that already says the same thing
`[verified 2026-08-15: sub_result titles and urls read off both indexes for the query "asthma"]`.
It duplicates the main result. Not restored.

**Dropped, with reason.** Re-adding `id="nrtitle"` to the topic index `<h1>` was in the plan
presented on 2026-08-15 and is not being done. On `production` that id exists because
`topiclanding.html:160` reads `document.getElementById('nrtitle').innerHTML`; the Pagefind
sub-result was incidental, and it points at the page's own title, duplicating the main result.
Nothing on this branch reads the id `[verified 2026-08-15: grep for "nrtitle" across themes,
assets, static, scripts — zero hits]`. Confirm against the sub-result counts in step 3's
verification before treating this as settled.

### Proof for steps 3–5

Not a build-and-eyeball. Rebuild this branch's index into a temp directory, re-extract fragments,
and assert against the numbers in §2c:

```
hugo --environment local_prod -d <tmp>/public --cacheDir <tmp>/cache
npx -y pagefind --site <tmp>/public
```

Expected after the three edits: neighborhood-index pages back to name + ZIPs only; topic index and
landing down by ~331 words each; report pages down by ~75. Then re-run the six queries — `"Kingsbridge"`
should return 6 hits with `/neighborhood-reports/kingsbridge_riverdale/` first.

**Do not build into the repo's own `resources/_gen`** — two Hugo builders against this tree poison
each other's fingerprint cache, and two dev servers were running when this work started. The
`HUGO_RESOURCEDIR` / `-d` temp form is the exception recorded in CLAUDE.md.

### Step 6 — the harness

`scripts/pagefind-characterization.mjs`, `npm run characterize:pagefind`. It builds the site into a
temp directory, runs Pagefind over it, records every indexed page and a fixed query set, and diffs
that against a per-data-branch baseline. `--against <built-site-dir>` diffs against another
worktree's `docs/` instead, which reproduces the whole of §2 in one command.

**Its own instrument checks, and what they caught.** Two controls run before any comparison, and
`--baseline` refuses to write when they fail — the opposite of `characterize:nr`, whose
`--baseline` cannot fail and will happily record three empty pages.

- The **negative query control** fired on its first run, against the harness rather than the site.
  It was written as "a nonsense token returns exactly 0" and `"zzqqxxwv"` returned `/about/`;
  `"xylophonewombat"` returns `/about/accessibility-updates/` by way of "x-y". Pagefind matches
  fuzzily, so of five nonsense tokens only `"qqzzxxvvww"` returned 0
  `[verified 2026-08-15: five tokens queried against the built index]`. Pinning the exact figure
  would have made the control fail on unrelated content changes, so it is now a ceiling of 2 —
  which still catches the failure it exists for, a query path that has broken open and matches
  everything, against a real query's 257 on the same index.
- The **rendered-content control** puts a word-count floor under one page of each of nine template
  kinds, because a template break renders empty shells and Pagefind indexes empty shells without
  complaint.

**The harness was proved able to fail before its pass was believed.** Reverting one
`data-pagefind-ignore` in `nr-neighborhood-list.html` and re-running `--check` reported the word
counts on all 6 pages, the anchor-id change, and `query "Kingsbridge": 6 -> 12` — the regression
this document exists about. The file was then restored byte-identically and `--check` passed
`[verified 2026-08-15: diff against a pre-experiment copy, then a clean --check]`.

### Next command

```
node scripts/pagefind-characterization.mjs --check
```

Expected: `PASSED`, 201 indexed pages, controls passing. Re-baseline with `--baseline` only after
reading a `--check` diff — the baseline records whatever it is given, and the controls only catch
a broken *build*, not an unintended-but-working change.

Run it before any merge that touches a shared partial, `head.html`, `baseof.html`, or any
Neighborhood Reports template. PowerShell eats the `--` in the npm form, so call node directly
there.
