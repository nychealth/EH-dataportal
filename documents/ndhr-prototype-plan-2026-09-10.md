# NDHR prototype — community-district health report

Plan for the Neighborhood Development Health Report (NDHR), a neighborhood-report-shaped
feature at Community District geography. Branch: `feature-NDHR-prototype`.

Sources: `documents/NDHR/2026 Neighborhood Development Health Report.docx`,
`documents/NDHR/Text of Neighborhood Development Health Report Tool for Revi.docx`, and
`documents/NDHR/Screenshot 2026-09-10 164835.png`, which annotates the existing NR report page
with the four regions the NDHR page must carry.

**No `docs-check source-roots` comment on purpose.** This plan names files that do not exist
yet, which is exactly what that check would fail on.

---

## 1. Decisions taken

All four decisions that were OPEN were taken by the user on 2026-09-11 and are recorded as
DECIDED-6 through DECIDED-9. Nothing in Tasks 1-11 is blocked on a decision.

**One decision re-opened and closed on 2026-09-13**: DECIDED-11, below, on which text the
indicator description column should carry. It had blocked Task 15 and nothing else.

### DECIDED-1 — Prototype what exists; drop what does not

Of the 28 indicators named across both documents, **18 are renderable** at community-district
geography and **10 are not**. Five exist only at UHF42 — walkability index (2133), subway walking
distance (2391), perception of neighborhood safety (2073), psychiatric hospitalizations (2418),
health insurance adults (2132). Four are absent from EHDP-data under any name at any geography —
displacement risk, social cohesion, maternal mortality, premature mortality attributed to drug
use.

The prototype drops those nine rather than approximating them. Re-raising any is a request to the
data team, not site work. `npm run ndhr:availability check` re-derives the split and fails when
EHDP-data moves it.

**Amended twice on 2026-09-11.** DECIDED-6 moved the four PUMA/Subboro indicators from dropped
to renderable, 15 to 19; DECIDED-10 then set PUMA2020 as the geography, which returns 2377 to
the dropped list for want of PUMA2020 data — 18 renderable, 10 dropped. 2377 is **deferred**
there, unlike the other nine, and DECIDED-10 says what would bring it back.

### DECIDED-2 — CD is the page geography; CDTA2020 joins exactly

Pages are keyed on `GeoType` **CD** — 59 community districts, DCP boundaries, and
`geography/CD.geojson` and `geography/CD.topo.json` are already published in EHDP-data for the
Leaflet selector and the Vega choropleth respectively.

CDTA2020-sourced indicators (HVI 2191, public bathrooms 2457) are shown on their matching CD.
The crosswalk is derived, not authored: both `Name` strings in `GeoLookup.json` carry a
`(CD n)` suffix and a borough, and **every row of the generated `cdlist.json` pairs a CD with the
CDTA of the same borough and number, 59 of 59** `[verified 2026-09-11: per-pair check — for each
row, `CD_id` and `CDTA_id` resolved through GeoLookup names to the same (borough, CD number)]`.

**That per-pair form is the claim; set equality is not.** An earlier version of this bracket cited
"59 matched, CD-only set empty, CDTA-only set empty", which compares the two geotypes' *key sets*
and never reads the generated pairing at all — so it holds at 59/59 under any permutation of the
assignment. Rotating CDTA ids between two boroughs leaves set equality at 59/59 while the per-pair
check drops to 53 (Brooklyn ↔ Staten Island) and 35 (Manhattan ↔ Bronx), which is what makes the
per-pair run a measurement rather than a restatement `[both controls run 2026-09-11]`.

CD and CDTA2020 are not identical polygons. The page must say which geography each value came
from — see Task 7.

The crosswalk is parsed from the names rather than joined on `GeoID`, because a `GeoID` is unique
only within its own geotype and CD's collides with CDTA2020's — see "Task 2 as built".

### DECIDED-3 — The CD-to-PUMA crosswalk is NO LONGER deferred

**Reversed 2026-09-11 by DECIDED-6.** The original entry deferred it, recorded that both
crosswalks were wanted, and named what would bring it forward. That is what happened. The
reasoning that justified the deferral — no published CD-to-PUMA file in either repository — was
true of the two repositories it named and false of a third; see DECIDED-6.

### DECIDED-4 — Route A: compute in the browser, from the data explorer's own files

The NR report page fetches precomputed per-topic JSON from EHDP-data
(`nr-report.html:332` builds the report URL, `nr-report.html:302` the viz URL). Those files
arrive with tertile rank, borough value and citywide value already filled in.

NDHR instead computes them in the browser from `indicators/data/<IndicatorID>.json`,
`indicators/metadata/metadata.json`, `indicators/metadata/TimePeriods.json` and
`geography/GeoLookup.json` — the files `assets/js/data-explorer/` already reads
(`data-explorer/data.js:13` for metadata, `data-explorer/data.js:178` for indicator data).

This needs no EHDP-data change, so the prototype starts immediately.

**Route A is also the eventual destination for Neighborhood Reports**, per the user 2026-09-10.
That is why Task 4 builds the compute layer as a shared, geography-parameterized module rather
than as NDHR-local code, and why Task 4's verification diffs its output against NR's precomputed
JSON rather than against nothing.

### DECIDED-5 — Fork the presentation, share the compute

The NR report page is settled and lands ahead of this work; this branch must not reshape it. (It
is in this branch's ancestry rather than on `production` — see the merge-order note in the status
block.) The strategies column and the contact form are NDHR-only. So `assets/js/ndhr-report/`
forks the NR renderers.

The compute half does not fork. NR is migrating onto route A, so a forked tertile and comparison
implementation would be two copies of logic already known to be converging.

### DECIDED-6 — PUMA is out of deferral; the crosswalk exists and is vintage-sensitive

**The user's decision, 2026-09-11**: pull PUMA out of deferral. Four indicators rejoin the
prototype — household AC (2185), electric medical equipment (2377), homes with 3+ housing
problems (45), homes with cockroaches (107) — taking Climate & Active Design from two rows to
four and Housing from four to six, and the renderable total from 15 to 19.

**The crosswalk does not have to be built.** It already exists, twice, under
`cgettings-EHDP-work/data/gis/`: `puma2020_to_cd.csv` (`PUMA2020,CD`) and
`puma2010_to_subboro_cd.csv` (`PUMA2010,Subboro,CD`). Each is 59 rows, covers all 59 of
`cdlist.json`'s `CD_id` values with none missing and none extra, and resolves to 55 distinct
PUMAs `[verified 2026-09-11: both read and joined against data/globals/cdlist.json]`. DECIDED-3
deferred this partly because "no CD-to-PUMA crosswalk file exists in either repository" — which
was true of EH-dataportal and EHDP-data, the two it checked, and false of the working repo where
the geography is actually prepared.

**The two vintages disagree, and the disagreement is the whole risk.** Both merge exactly four
PUMAs across two CDs each, but not the same four:

| | merges | Manhattan effect |
|---|---|---|
| PUMA2010 (`puma2010_to_subboro_cd.csv`) | 3705→[203,206], 3710→[201,202], **3807→[104,105]**, 3810→[101,102] | CD4+CD5 share; CD6 alone |
| PUMA2020 (`puma2020_to_cd.csv`) | 4221→[201,202], 4263→[203,206], **4165→[105,106]**, 4121→[101,102] | CD5+CD6 share; CD4 alone |

The Bronx pairs agree; Manhattan does not. **Choosing the wrong vintage silently shifts Manhattan
CD4, CD5 and CD6** — a value lands on a district it does not describe, correctly formatted, with
nothing on the page to betray it. This is the exact hazard the original deferral named, now
located.

This plan originally resolved that by choosing a crosswalk per indicator. **DECIDED-10
supersedes that with one geography for every PUMA-sourced row — PUMA2020** — which removes the
per-indicator choice and with it the chance of making it inconsistently. The cost is 2377,
which publishes at PUMA2010 and Subboro and not at PUMA2020
`[verified 2026-09-10: npm run ndhr:availability, baseline rows]`. Task 7 must still label each
PUMA-sourced row with the wider area it covers, as the original deferral required.

**Both CSVs go to EHDP-data**, per the user 2026-09-11 — published under `geography/` beside
`puma_to_subboro.csv`, not committed into EH-dataportal. Both, even though the report reads
only PUMA2020: `puma2010_to_subboro_cd.csv` is what carries `Subboro`, which DECIDED-10 keeps
available. So Task 2's generator fetches them from
`data_repo` + `data_branch` like everything else it reads, and they are subject to the same
`npm run ndhr:cdlist check` drift guard. Until they are published, the generator has nothing to
read: **this is Task 2's one external dependency, and it is the only thing in the plan waiting on
another repository.**

### DECIDED-7 — Mental Health is a fifth category, and it will render empty

**The user's decision, 2026-09-11**: add Mental Health, on the reasoning that it can be dropped
later. Five categories, so the report inventory goes from 236 pages to **295** (59 CDs x 5).

**It has zero indicators at community-district geography, and that is not a gap in this plan's
research.** The two source documents list no indicators under the Mental Health heading at all.
Independently, every mental-health indicator EHDP-data publishes is UHF42-only — depression
(adults) 2417, psychiatric hospitalizations (adults) 2418, serious psychological distress
(adults) 2419 `[verified 2026-09-11: swept every IndicatorName matching
/mental|psych|depress|anxi|suicide|self-harm|substance|drug|alcohol|opioid|overdose|isolat|lonel/
for CD or CDTA2020 in AvailableGeoTypes; control: the same sweep returned 2417, 2418 and 2419,
so it can see mental-health indicators — none is CD-family. The eight CD-family hits it also
returned are heat- and cold-stress indicators matching on the word "stress" and are not mental
health]`.

So the category renders a header, its written description from "Text of ... for Review", and no
indicator rows, on all 59 pages. **Task 3 must give it an explicit empty state and Task 7 must
render that state**, rather than either emitting an empty accordion or letting a zero-length loop
produce nothing — a category that silently renders nothing is indistinguishable from a template
bug.

Dropping it later costs one entry in `NDHR_categories.yml` and re-running the adapter. Filling it
is a request to the data team for any of 2417/2418/2419 at CD.

### DECIDED-8 — The public name is the Neighborhood Development Health Report (NDHR)

**The user's decision, 2026-09-11**: use NDHR, and the long form alongside it. Not "Healthy
Places Toolkit", which is the title of the second source document only.

First or most prominent mention on a page carries **Neighborhood Development Health Report
(NDHR)**; later mentions carry NDHR. `ndhr` is the URL segment and the section directory name, as
this plan already assumed. Task 5's `seo_title` strings take the long form, since search results
have no earlier mention to expand the abbreviation.

### DECIDED-9 — The contact form is deferred as a later enhancement

**The user's decision, 2026-09-11**: defer, as an enhancement idea rather than prototype scope.

**The decision is that the form is wanted and deferred, not that it was rejected.** What is
deferred: the form collecting first name, last name, affiliation (public agency / private
organization / community organization / general public), email, and a short inquiry.

What justifies waiting: this is a Hugo static site published to a GitHub build branch, so there is
no server to post to, and every option costs something outside the prototype's reach — a
third-party endpoint is a procurement and privacy question, and a link out to an existing DOHMH
form needs one to exist.

What brings it forward: a decision on which of those two routes, which is an agency question
rather than a site one. Until then Task 8 builds the strategies column only, and the page carries
no contact affordance rather than a disabled one.


### DECIDED-10 — PUMA2020 is the geography for PUMA-sourced rows; 2377 is deferred

**The user's decision, 2026-09-11**: use PUMA2020, accepting the loss of one indicator, because
the subborough boundaries are not trusted to have held across vintages. **Subboro is not dropped**
— it stays as a column in `cdlist.json`, unused by the report, so the option costs nothing to keep
open.

The question asked was what restricting to PUMA2020 costs. Measured against the four indicators'
own data files rather than against `AvailableGeoTypes`, because availability and
rows-at-a-useful-period are different questions:

| | 2185 AC | 2377 medical equip. | 45 3+ problems | 107 cockroaches |
|---|---|---|---|---|
| PUMA2010 | 2017 | 2017 | 2017 | 2017 |
| PUMA2020 | 2023 | **no rows at all** | 2021 | 2023 |
| Subboro | 2023 | 2017 | 2021 | 2023 |

`[verified 2026-09-11: latest period per geotype by end_period, with 55 of 55 areas present at
that period in every populated cell]`

It costs exactly one indicator — **2377, households using electric medical equipment**, which has
no PUMA2020 rows — and buys four to six years of freshness on the other three. PUMA2010 was not
the conservative option it looks like: choosing it for consistency would publish 2017 figures on
three indicators that have 2021-2023 data.

Subboro would have carried all four at the freshest period each, with CD groupings identical to
PUMA2010's. It was not chosen because that depends on subborough boundaries having held between
2017 and 2023, which this plan could not establish — 55 areas at every period from 1999 to 2023
and no year suffix on the geotype is consistent with stability and is not proof.

**2377 is deferred, not rejected.** What is deferred: one indicator, in Climate & Active Design,
which drops that category from four rows to three. Why waiting: its only geographies are PUMA2010
and Subboro, and rendering it would mean putting a second, differently-merged geography on the
page for one row. What brings it forward: either EHDP-data publishing it at PUMA2020, or the data
team confirming subborough boundaries held — at which point it renders on `Subboro_id`, which
`cdlist.json` already carries, with a label naming the wider area.

**Two merge patterns will coexist on three Manhattan pages, and both are correct.** The
demographic sidebar comes from CD-level ACS, which merges CD4+CD5; the PUMA2020 rows merge
CD5+CD6 `[verified 2026-09-11: sidebar groups measured from the five indicators in "Task 2 as
built", PUMA groups read from puma2020_to_cd.csv]`. So on Manhattan CD5's page the sidebar matches
CD4's and the indicator rows match CD6's. **Task 7 must label both, not only the PUMA rows** — a
reader who notices one shared value and not the other will conclude the page is broken.


### DECIDED-11 — The source document's descriptions are the ones to render

**The user's decision, 2026-09-13**: "keep the source document's descriptions for now". Raised by
the review in §4 as OPEN-11 and answered the same day, so this entry carries the question as well
as the answer.

**Read as: render the document's text, not EHDP-data's.** The document's descriptions are not on
the page today, so there was nothing to retain under the other reading. The assumption was stated
back to the user when the work started.

**"For now" is the prototype scope, and the fallback is what makes it reversible.** Rows the
document does not cover keep EHDP-data's `IndicatorDescription`, so this is an override on 18 rows
rather than a replacement of the field. Deleting the authored keys returns the page to its current
state.

The source document's indicator table has two columns, `Indicator` and `Description`, and its
24 descriptions are written in built-environment terms for this tool's audience. The page renders
EHDP-data's `IndicatorDescription` instead — `assets/js/report-data/normalize.js:405`.

**This paragraph read 26 until 2026-09-14 and that was wrong** `[corrected at f0242eb371, where
the count was re-derived from the document's own repetition rather than from a category list
written by hand; the earlier extraction's list omitted "Health Outcomes and Care Access"]`.

Walking distance to a park, as the page renders it:

> The percentage of the population who live within walking distance to a park: a quarter-mile or
> less to entrances of smaller sites…

The same indicator, as the source document writes it:

> Nearby green spaces make it easier for residents to walk daily, which can lower risks of
> obesity chronic diseases such as diabetes, heart disease, anxiety, and depression.

Both are correct. The first is methodological, the second is audience-facing.

**The question is whether this was decided or never surfaced.** No decision entry in §1 names it,
and `indicator_description` appears in this plan only as a field of the NR payload shape and of
`normalize.js`'s output — never as a choice of source `[verified 2026-09-13: `grep -n -i
'IndicatorDescription\|indicator_description\|description key'` over this file returns 2 hits,
both in field lists at :298 and :931]`. Only whoever authored the content YAML can say.

**If the answer is "use the document's text", the mechanism already exists.** The YAML carries
site-owned fields today — `indicator_short_name`, `strategy`, `strategy_description`, and nothing
else besides `geotype` and `MeasureID`/`MeasureName` `[verified 2026-09-13: union of second-level
keys across `data/globals/NDHR_content/*.yml`]`. A `description` key is the same mechanism, read
in `cards.js` beside `indicator_short_name`. That is Task 15, which this decision unblocks.

---

## 2. Findings this plan rests on

Every claim below was measured on 2026-09-10 against EHDP-data `production` unless stated.

**Indicator availability.** Read from each measure's `AvailableGeoTypes` in
`indicators/metadata/metadata.json` (267 indicators on `production`; `staging` has 286 and adds
none of the missing four). Validated against raw data files in both directions: indicator 2143
claims CD and its data file carries 59 CD rows; indicator 2133 claims UHF42 only and its file
carries 42 UHF42 rows and nothing else; 2191 carries CDTA2020 only; 45 carries PUMA and Subboro
and no CD. So the metadata is accurate on a case that says present and on a case that says
absent.

The 18 indicators the prototype renders. **Geotype is the geography the value is read at**;
every PUMA-sourced row is PUMA2020, per DECIDED-10:

| Category | Indicator (IndicatorID) | Geotype |
|---|---|---|
| Climate & Active Design | Walking distance to a park (2388) | CD |
| | Heat Vulnerability Index (2191) | CDTA2020 |
| | Household air conditioning (2185) | PUMA2020 |
| Housing | Household crowding (15) | CD |
| | Rent-burdened households (2336) | CD |
| | Independent living difficulty, adults (2145) | CD |
| | Evictions, court-ordered (2365) | CD |
| | Homes with 3+ housing problems (45) | PUMA2020 |
| | Homes with cockroaches (107) | PUMA2020 |
| Neighborhood Conditions | Vegetative cover (2143) | CD |
| | Violence-related ED visits, all ages (2400) | CD |
| | Public bathroom availability (2457) | CDTA2020 |
| | Unhealthy food access (2389) | CD |
| | School absenteeism (2323) | CD |
| | Litter basket coverage (2416) | CD |
| Health Outcomes & Care Access | Heat stress, yearly ED visits (2075) | CD |
| | Premature mortality (2322) | CD |
| | Asthma ED visits age 5 to 17 (2379) | CD |
| Mental Health | *(none available at CD — see DECIDED-7)* | — |

Deferred rather than dropped: **households using electric medical equipment (2377)**, Climate &
Active Design, which has no PUMA2020 data. See DECIDED-10.

**Per-indicator data files are thin.** Column-oriented, eight columns: `MeasureID`, `GeoID`,
`GeoType`, `TimePeriodID`, `Value`, `CI`, `Note`, `DisplayValue`. Everything else the card shows
comes from metadata or is computed.

**Five precomputed fields are read by nothing on the site.** `summary_bar_svg`, `trend_flag`,
`nbr_rank`, `TimeCount` and `nbr_data_note` appear in the NR report JSON and return zero hits
across `assets/js/nr-report/` and `themes/dohmh/layouts/neighborhood-reports/`
`[verified 2026-09-10: grep -ro per field over both directories; control: rankReverse returns 20
hits and data_value_rank 8 over the same command, so the probe fires]`. Route A does not have to
reproduce them.

**One consumed field has no source outside the precomputed JSONs.**
`indicator_short_name` is the bold card headline — "Overweight" above "Overweight or obesity
(adults), 2022". `metadata.json` has `IndicatorName` and `IndicatorLabel`, both the long form and
identical to each other on indicator 2061. EHDP-data's curated
`neighborhood-reports/metadata/nr_indicator_names.json` has three columns — `title`,
`indicator_name`, `indicator_description` — across 79 rows and no short name
`[verified 2026-09-10: enumerated the actual key sets rather than grepping for guessed names —
6 keys at indicator level, 10 at measure level, 3 in the curated file, none a short name]`.
**The measure-level count is 11, not 10, and identical across all 731 measures**
`[re-measured 2026-09-11]`. The extra key is not a short name, so the finding above stands as
written — but one of the 11 is `DisplayType`, which the same enumeration recorded and the
`units` conclusion then missed; see the correction under "Task 4 as built".

NDHR authors its own short names in `NDHR_content/` (Task 3), alongside the strategy text that
is site-owned anyway. **This is the one thing an eventual NR migration to route A will need that
route A cannot supply**: 79 short names authored, or that single field kept upstream.

`indicator_data_name` looks like a second gap and is not. It is a join key between report rows
and the viz table (`nr-report/chart.js:246`), a data attribute (`nr-report/cards.js:255`), and is
dropped from the CSV export (`nr-report/app.js:22`). IndicatorID serves all three.

**`metadata.json` is 1.1 MB and is an existing site cost, not a new one.**
`assets/js/data-explorer/data.js:13` fetches it unindented at top level, so every data-explorer
page load already pays it.

**Demographics are partly homeless at CD.** Five of the NR sidebar's eight rows exist as EHDP
indicators at CD — neighborhood poverty (103), limited English (2335), graduated high school
(2334), owner-occupied homes (17), rent-burdened households (2336). Total population, percent
over 65 and percent under 18 do not, and come from ACS by hand. The ZIP code line has no CD
equivalent at all: `geography/` carries `zcta_to_uhf.csv` and nothing keyed to community
districts.

**Two traps carried over from the NR work**, both already recorded in `CLAUDE.md`:

- `themes/dohmh/layouts/partials/nr-leaflet.html` and `assets/js/nr-report/map.js` both declare
  `highlightFeature`, `onEachFeature`, `resetHighlight` and `selectNeighborhood` at top level, so
  they cannot load on the same page — a `const` and a `function` of one name in one
  classic-script scope is a `SyntaxError` that kills every script on the page, and `no-undef` is
  satisfied by either declaration so `npm run lint` cannot see it. A forked `ndhr-report/map.js`
  inherits the same constraint against `nr-leaflet.html` `[re-verified 2026-09-10: grep -c per
  name over both files returns non-zero on both sides for all four — 3/2, 2/3, 2/2, 3/4]`.
- The report page's CSS lives in `assets/scss/_custom.scss` scoped to `.nr-report-accordion`, and
  the scope is load-bearing: removing it repainted eight card headers on
  `/data-features/realtime-air-quality/` `[verified 2026-08-15 per CLAUDE.md: computed style,
  three runs]`. NDHR gets its own scope, never a widened one.

---

## 3. Ledger

Update this table inside each task, before moving to the next. Record the commit hash once the
work is committed, never "done, uncommitted".

| Task | Status | Proof that ran | Commit |
|---|---|---|---|
| 1. Availability sweep as a committed script | done | `npm run ndhr:availability check` exits 0; five hand-edits of one baseline row each exit 1; the control arm exits 2 when flipped; `npm run docs-check` passes | `451b3da94f` |
| 2. `cdlist.json` | **DONE 2026-09-10**, except the three ACS fields | `npm run ndhr:cdlist check` exits 0; 59 rows, `CDTA_id` non-null and distinct; three build-path injections each exit 2. **The "isolated build emits the fingerprinted `cdlist-data` script" half is not reproducible and was corrected** — see the note below the table | `c3d03a2fbf` |
| 2b. PUMA crosswalk columns (DECIDED-6) | **DONE 2026-09-11** — CSVs cherry-picked onto EHDP-data `production` and `staging` and pushed, generator reads them, `cdlist.json` regenerated | `ndhr:cdlist check` exits 0 "UNCHANGED"; `prod_stage` also exits 0, so both data branches are usable; field-by-field diff of the old committed file against the new one adds exactly the three keys and changes **zero** pre-existing values, with an injection proving that detector live; three injections each exit 2 — a vintage swap trips the grouping control **and nothing else** | `c8fc31c182`, `39d967c289` |

**Correction to Task 2's proof.** It cited an isolated build emitting the fingerprinted
`cdlist-data` script. That cannot be run from this tree: nothing includes
`themes/dohmh/layouts/partials/lib-cdlist.html`, so a build emits no such asset
`[verified 2026-09-11: isolated `development` build, exit 0 over 1205 pages —
`uhflist-data` 1 file, `cdlist-data` 0. The included `lib-uhflist` partial is the control
that the probe can see these assets at all]`. A session re-running the proof as written would
read that absence as a regression. **The build proof belongs to Task 6**, which adds the include;
until then the partial's only check is that it parses, which the same build shows.
| 3. Category and content YAML | **DONE 2026-09-11** — five categories, 18 measures keyed on MeasureID in a flat `measures` list, Mental Health empty with a stated empty state | `node scripts/ndhr-indicator-availability.mjs check` exits 0 with "5 categories, 18 measures — consistent with the metadata"; nine injections each exit 1 naming their own cause, including the sibling-only geotype a union check would pass, and a wrong-shaped or absent content directory exits 2; isolated `development` build exits 0 over 1205 EN pages, and a deliberately malformed content file fails it naming file and line, so that pass is about these files | `110a1ada44`, `f02134901a` (the flat shape landed in the next commit after those two on this branch) |
| 4. Shared compute module | **DONE 2026-09-11** — `assets/js/report-data/normalize.js` plus `scripts/report-data-parity.mjs`; keyed on MeasureID, not the IndicatorID this task was written against | `npm run report-data:parity all` exits 0: **34,398 field comparisons against the published NR payloads, 0 mismatched**, over all 5 reports and 22 sections at UHF42 — 13 fields over 2,646 rows, **now 14 and 37,044 since the `units` correction of 2026-09-11 (`42e85ae72d`)**, so a re-run reports the larger number. Three controls each fire (tertile boundary 17, rounding removed 243, rankReverse forced off 514); 7 named upstream rounding rows are allowed and a stale allowance fails the run; `npm run lint` passes with an undefined-name control exiting 1 | `554ac114b2` |
| 5. Content adapter and routing | **DONE 2026-09-11** — `content/ndhr/`: the adapter, the section landing page and the five category pages | Isolated `development` build exits 0 and lists **360** `/ndhr/` URLs in the built English sitemap — 1 landing, 5 category indexes, 59 CD indexes, 295 report pages, 295 of them at depth 2, so no CD slug collides with a category slug. **The marker count reads 60, not 360, until Task 6 lands** — see the as-built section for why, and for the placeholder-layout control that takes it to 360 | `e679133fc8` |
| 6. Report layout and CD Leaflet map | **DONE 2026-09-11** — the server-rendered half only. The map rung this task prescribes needs `assets/js/ndhr-report/map.js`, which is Task 7, and **this row does not claim it** | Isolated `development` build exits 0 and writes **360** NDHR pages by the `data-pagefind-meta="title:` marker — 1 landing, 5 category indexes, 59 CD indexes, 295 report pages, 0 unclassified, against the 60 that marker counted before these layouts existed. Browser on a `dev_stage` server, all five page kinds: 200 and a clean console on 5 of 5, no `console.error` or `pageerror`; `L`, `communityDistricts` (59), `vegaEmbed`, `aq` and `renderQRCode` all defined on the report page and `uhflist-data` absent from it; `NDHR_REPORT_CONFIG` parses as an **object** — the `safeJS` fix — with `measures` 6 on Housing and 0 on Mental Health and `districtMap` 59; heading order introduces no new skip, the one it reports being the shared footer, present on two pre-existing pages in the same run. `npm run lint` and `npm run docs-check` both exit 0 `[re-run 2026-09-11 at this tree]`. **`node scripts/pagefind-characterization.mjs --check` exits 1 and was deliberately not re-baselined** — see the ranking finding in the as-built section | `6164da52e2` |
| 7. Renderers and geography labelling | **DONE 2026-09-12** — ten modules in `assets/js/ndhr-report/`, plus the layout's script tags, the SCSS container rule, the lint block and one smoke entry. **`chart.js` is not the rename pass this task predicted** and Arquero left the page; see the as-built section | `npm run lint` exits 0 with an injected undefined name exiting 1 and the restore returning to 0; isolated `development` build exits 0 with all **295** report pages carrying exactly ten `ndhr-report` scripts plus `normalize.js` and zero carrying arquero; `npm run smoke` **34 pages clean** including `ndhr/midtown/housing/`. Browser on a `dev_stage` server over 5 page kinds: HTTP 200 and 0 console errors on 5 of 5, 59 named polygons, a click rewriting the address bar and rebuilding all 6 cards with 0 pageerrors, and an SVG chart named per indicator. The CD4/CD5/CD6 sidebar-vs-PUMA crossing is measured page by page. **Tab-order membership is NOT established** — only programmatic focus | `eae618a844` |
| 8. Strategies column | **DONE 2026-09-12** — the strategy cell inside `.card-header` and outside the `<button>`, the description in the expanded panel, the phrase in the print rendition. No contact affordance, per DECIDED-9. The row-height cost was measured and **accepted by the user, 2026-09-12**; see the as-built section | Browser on a `dev_stage` server: `/ndhr/midtown/housing/` renders 6 headers and 6 strategy cells, **0 inside a `<button>`**, 0 empty, 0 console errors, and the accessibility tree shows each button's name ending at the tertile sentence with the strategy as a sibling text node. 5 of 6 panels carry a description block and evictions (1128) does not, which is its explicit YAML null. Print-emulated `document.body.innerText` with all six panels expanded carries **6 phrases and 0 descriptions**. Computed style: `border-left: 1px solid rgb(222,226,230)` and no top border at 1280px, the reverse at 500px, with the cell beside the button at 1280 and 55px beneath it at 500. `npm run lint` exits 0, `npm run smoke` **34 pages clean**, `npm run docs-check` exits 0 | `c2209d3f63` |
| 9. Guardrails | **DONE 2026-09-12** — smoke entries, `scripts/ndhr-characterization.mjs` and both its baselines, and both site-characterization baselines. The Pagefind item closed **without a re-capture**: the section was taken out of the index instead, so the committed baseline still describes the site. Four `absent: true` controls now guard that | `npm run lint`, `npm run docs-check`, `npm run characterize:ndhr check`, `npm run characterize:site` and `npm run smoke:all` (1285 pages, 0 failures) all exit 0; the NDHR harness is proved to discriminate by two injections whose predictions were registered first — a `console.error` moved `consoleErrors` on all 4 targets, one edited strategy phrase moved `strategies` on the 2 Housing targets and no others, nothing else moved, and restoring both returned it to 0 | `c60f184477`, `0cd2fe97ff`, `c895d33575` |
| 10. District typeahead | **DONE 2026-09-12** — two partials (`ndhr-district-picker.html` + `-js.html`) on the landing page and the five category indexes; the 59 district indexes were out of scope and did not get one. Searches `CD_name` and `borough`, with **no ZIP search**, which the partial says on the page rather than leaving implied | Isolated `development` build exit 0, picker markup on exactly **6 of 360** NDHR pages with 0 duplicate `wireComboboxState` and 0 NR partials; browser on `dev_stage`, both page kinds: HTTP 200 and **0 console errors**, `role="combobox"` + `aria-labelledby` on the generated input, `communityDistricts` 59, "bedford" → 2 rows, "Bronx" → all 12, "11216" and "zzqqxx" → none, Escape dismisses and `aria-expanded` returns false, and a selection lands on the right page from both kinds. `npm run lint` 0, `npm run docs-check` 0, `npm run smoke` 38 clean. `characterize:site` moved 5 fields on those 6 pages — the diff was read before re-baselining, and `controls.noAccessibleName` 0 → 1 is diagnosed in the as-built section, not absorbed | `9411011f73`, `1952ff919b` |
| 11. CD picker map | **DONE 2026-09-12** — `themes/dohmh/layouts/partials/ndhr-leaflet.html` on geography/CD.topo.json, plus `themes/dohmh/layouts/partials/lib-topojson.html`, on all three non-report layouts. Two things this row does not leave implied: its polygons are keyboard stops on the 59 district indexes and deliberately **not** on the 6 picker pages, and it **does not fly to the located district** where `nr-leaflet.html` does. Both are in the as-built section | Isolated `development` build exit 0; the map on exactly **65 of 360** NDHR pages — 1 landing, 5 category indexes, 59 district indexes — each with one CD.topo.json reference and one topojson-client script, and **0 on all 295 report pages**, so the `map.js` name collision stays unreachable. Browser on `dev_stage` over 4 page kinds: HTTP 200 and **0 console errors** on 4 of 4; 59 polygons each carrying `role="button"` and a district name on all three map-bearing kinds; on the 6 picker pages the container and **65 of 65** candidate nodes carry `tabindex="-1"`, on a district index **0 of 65** do and a real Tab sweep put focus on 7 polygons in 8 stops — **tab-order membership measured rather than inferred, which Task 7 explicitly could not claim**. Exactly one polygon carries the selected style on a district index and none on the picker pages. Un-forced clicks land on `/ndhr/midtown/`, `/ndhr/midtown/housing/` and `/ndhr/central_harlem/` from the three kinds, and Enter on a focused polygon does the same. `npm run lint` 0, `npm run docs-check` 0, `npm run characterize:ndhr check` 0, `npm run smoke` **38 clean**. `characterize:site` moved 4 fields on those 65 pages and nothing else; the diff was read before re-baselining | `77932ab348`, `b770e2fb1a` |
| 12. Report map viewport (review) | **DONE 2026-09-13** — the fly-to is gone from `selectLayer` and both its call sites, replaced by a `fitBounds` on the whole layer. **Scope decided by the user 2026-09-13: fix NDHR here, file the NR half** — it is `documents/site-wide-audit-2026-06-27.md` §18, not a task in this plan | Two arms on one page, one variable, A -> B -> A: **57 of 59** reachable at zoom 9.58, **5 of 59** with the removed fly-to re-applied by hand at zoom 13.78, **56 of 59** refitted — two runs, identical counts. An un-forced click on Central Harlem navigates, exactly 1 polygon still carries the selected style, 59 polygons named. `npm run lint`, `npm run docs-check`, `npm run characterize:ndhr check` and `npm run smoke` (38 pages) all exit 0 | `999d986758` |
| 13. Tertile sentence geography (review) | **OPEN** — added 2026-09-13. DECIDED-2's obligation, unmet on 5 of 18 rows | none yet | — |
| 14. Strategy-column caveats (review) | **OPEN** — added 2026-09-13. Placement needs the user's word; the wording is the source document's | none yet | — |
| 15. Indicator descriptions (review) | **DONE 2026-09-14** — the document's descriptions on 17 of 18 rows, evictions (1128) an explicit null falling back to EHDP-data's text. **It also took the card headline off the site-authored `indicator_short_name` and onto EHDP-data's `IndicatorName`**, which this task did not ask for and the user decided on 2026-09-13; the YAML keeps a validated copy for the category index alone | The two new content checks are proved to fire — a wrong `IndicatorName` and a removed `description` key each exit 1 naming their own cause, file restored byte-for-byte after each. Browser on a `dev_prod` server: all three climate cards carry the data repo name and the document description, EHDP-data's park text is gone with a positive control for that search, evictions still shows EHDP-data's text, and the category index renders three items with no blank name half. `npm run report-data:parity all` still exits 0 at **37,044 comparisons, 0 mismatched**, which is the proof the override stayed out of the shared module. `npm run lint`, `npm run docs-check` and `npm run ndhr:availability check` all exit 0. Both NDHR baselines re-captured, diff read first: every changed line a name or a name-derived chart field, zero outside that set | `f0242eb371` |
| 16. Four low-symptom defects (review) | **OPEN** — added 2026-09-13. 16a is a correctness bug with a session-permanent consequence; 16d is comment-only | none yet | — |

**Status as of 2026-09-14:** **Tasks 1-12 and 15 are done on `feature-NDHR-prototype`; Tasks 13,
14 and 16 are open and none is blocked.** A review on 2026-09-13 added Tasks 12-16 and re-opened
one decision; Task 12 and the decision were both closed that afternoon, and Task 15 the next
morning. §4 carries the review's own summary, including what it checked and did not find.

**An earlier version of this block read "Nothing in this plan is open and nothing is blocked."
That was true of Tasks 1-11 and is not true of the plan.** A session resuming here starts at §4,
not at the task list above it.

**One of the three remaining tasks still opens with a question rather than an edit**, and a
session that starts editing instead has taken a decision that is not its to take:

- **Task 14 — placement.** The source document attaches its two caveats to column headers; Task 8
  dissolved the strategies column into per-row cells, so there is no header to hang them on. The
  wording is settled and the placement is not.

Task 15's own open question — which of the document's 24 descriptions maps to which MeasureID —
was settled by authoring the keys; the one row with no document equivalent carries a null rather
than a guess. See "Task 15 as built".

**Task 13 and Task 16 can be picked up without asking anything.** Task 13 is the larger of the
two and closes a DECIDED-2 obligation, so it is the one to take first.

**What Task 12 settled that the other tasks inherit.** A `characterize:site` re-capture is **not**
owed for a JS content change: the baselines record unhashed logical asset paths — `js/ndhr-report/
map.js`, not the fingerprinted filename — so a changed file moves no recorded field
`[verified 2026-09-13: `structure.assets` read off the committed `staging` record for
`ndhr/midtown/housing/`]`. A re-capture is owed when a task *adds or removes* an asset, which is
what Task 11's topojson note was about. Tasks 13-16 add none.

Two things this plan names that are deliberately NOT in it, and that a later session should not
read as oversights:

- **Moving `assets/js/ndhr-report/map.js` onto the topology — DECIDED 2026-09-12: deferred by
  the user as a potential future enhancement.** Task 11 raised it, built the topojson path, and
  declined to fold it in. It would save 32,590 gzipped bytes on each of the 295 report pages
  (46,926 → 11,732 for the geometry, plus 2,604 for `topojson-client`). The code is five lines
  in `assets/js/ndhr-report/map.js:253-282` and two in
  `themes/dohmh/layouts/ndhr/ndhr-report.html` — the URL at `:320` and a `lib-topojson` include
  beside `lib-leaflet` at `:420` — plus deleting the `filter: GEOCODE != 0` at `:282`, which is
  dead against this file. **What defers it is the verification, not the code:** `topojson-client`
  joins `structure.assets` on 295 pages, so both site-characterization baselines need
  re-capturing, and the report page's map is the only in-place district switcher and has a
  keyboard path, so the browser rung re-opens. Nothing about the swap decays while it waits;
  pick it up with the next change that touches the report page, so one re-baseline covers both.
- **The `docs-check verified:` stamp in `CLAUDE.md`**, at `9ccce9dcc9 2026-09-11` and now several
  prose edits behind. The stamp asserts a human re-read the prose, so it waits on the user
  rather than on a session.

**This branch lands AFTER the NR retirement, per the user 2026-09-12 — do not read its diff
against `production` as its own work.** `production` still carries all 252 hand-written NR content
files and has no `content/neighborhood-reports/_content.gotmpl`, so `git diff production...HEAD`
is 258 NR files plus the NDHR work; the Option D retirement is in this branch's ancestry and
merges ahead of it `[verified 2026-09-12: `git ls-tree` on both refs — 258 NR content files on
`production`, 7 here]`. Size and review this work against the NR branch it sits on, not against
`production`.

**Pagefind is settled: the whole NDHR section is out of the index**, decided by the user
2026-09-12 — "proceed with indexing turned off, we can refine it later". A page-level
`data-pagefind-ignore="all"` on each of the four layouts, so all 360 pages, not just the 295
report pages.

**The measurement that decided it goes beyond the rank changes recorded in "Task 6 as built".**
Indexing the 65 non-report pages did not merely add them to the corpus — it stopped one query
discriminating. Every NDHR page carries the phrase "Neighborhood Development Health Report", so
for "neighborhood reports" both terms became common: the top score fell from **6.5880 to 4.6470**
and the count of results within 0.05 of the top went from **2 to 105** of 173, with
`/neighborhood-reports/` falling from rank 2 to rank 99. An earlier note in this plan read that
as "a tie-break among equals"; it was not — the tie was created by the change, and that reading
rested on a post-change reading with no before to compare. Separately
`/ndhr/climate-and-active-design/` took first for "climate" at 17.2595 against
`/key-topics/climatehealth/`'s 17.0357, a margin ten times the 0.023 gap between the two below
it, so that one was never a tie either. With the section out, `--check` **exits 0 and matches the
committed baseline in every recorded field** — no re-capture, and `/neighborhood-reports/` back
at rank 2 of 108 with only 2 results within 0.05 of the top
`[all verified 2026-09-12: two isolated builds of the same commit, the same query set measured on
both through Pagefind's JS API]`.

**What it costs and how to reverse it.** No NDHR page is reachable through the search box. It is
a prototype decision and four attributes undo it — which now fails four `absent: true` controls
in `scripts/pagefind-characterization.mjs`, one per page kind, rather than reading as a diff to
re-baseline. The untested middle is ignoring only the 59 district indexes and keeping the landing
and category pages: it would plausibly fix the dilution and leave the "climate" result standing,
since a category index is what won that slot. One build settles it.

Three decisions from Task 7 are open and none blocks Task 9: the row order (authored YAML order,
where NR sorts by rank), the hand-written CSV export, and `lib-arquero` removed from the layout.
Each is named in "Task 7 as built" with what reversing it costs. Task 8 closed one of its own —
the strategies column's row-height cost — and that one is decided rather than open.

**One thing outstanding, and it sits inside Task 9 rather than before it.** The Pagefind ranking
finding in "Task 6 as built" has three open responses; it blocks Task 9's Pagefind re-capture and
nothing else. The site-characterization re-captures do not wait on it.

**The `units` gap Task 6 surfaced is closed** — `normalize.js` reads metadata's `DisplayType`,
which is the field, and no content authoring is needed. See the correction under "Task 4 as
built".

Re-run the checks first — they are cheap, and §2's table and every demographic figure in
this plan rest on them:

```bash
npm run ndhr:availability check    # expect exit 0, "UNCHANGED — all 28 rows"
npm run report-data:parity all     # expect exit 0, "37044 field comparisons, 0 mismatched"
npm run ndhr:cdlist check          # expect exit 0, "UNCHANGED"
node scripts/ndhr-build-cdlist.mjs print prod_stage   # expect exit 0 — the other data branch
npm run lint                       # expect exit 0
npm run docs-check                 # expect exit 0, "2 doc(s) checked"
```

`node scripts/pagefind-characterization.mjs --check` exits **1** on this branch and is expected to
— 202 indexed pages to 267. Read its diff; do not re-baseline it until the ranking question is
settled.

`npm run report-data:parity all` now expects **37,044** field comparisons, not 34,398 — `units`
joined the compared set on 2026-09-11. A run still reporting 34,398 is running against a
`normalize.js` from before that correction.

**How a crosswalk reaches the data branches, for the next time one has to.** Cherry-pick onto
`production` and `staging` separately; do not merge a branch cut from `production` into `staging`.
That merge drags in 206 commits across 357 files — the situation EHDP-data's own
`merge-strategy.md` exists to avoid — against 3 files for a cherry-pick `[measured 2026-09-11]`.
Size the staging pick first with a three-way `git merge-tree --write-tree
--merge-base=<commit>^ staging <commit>`, then read the tree it returns rather than only its exit
code: the 2026-09-11 pick came back clean at tree `767ada6f` with staging's own README section
intact beside the added one and zero conflict markers.

**A consequence worth keeping: `--contains` and `git cherry` cannot answer "did it land".** A
cherry-pick rewrites the hash, so the source commit is an ancestor of nothing downstream however
far its content travels, and patch-ids do not survive either. Ask about content:

```bash
git -C ../EHDP-data ls-tree production geography/ | grep -c puma2020_to_cd   # expect 1
curl -s -o /dev/null -w "%{http_code}\n" \
  https://raw.githubusercontent.com/nychealth/EHDP-data/production/geography/puma2020_to_cd.csv
# 2026-09-11: 200 on production and staging, both files
```

**Environment state this session left behind.** The EHDP-data clone at `../EHDP-data` is on
`staging` (clean, and `production`/`staging` both level with origin). It started the session on
`docs-geoid-scheme` — restore with `git -C ../EHDP-data switch docs-geoid-scheme` if that matters.
The two CSVs were also copied into the local IIS mirror at
`C:\inetpub\wwwroot\EHDP-data\production\geography\` to verify the generator before the publish,
and **removed again** — the mirror is not a checkout and a `pull` would not have cleaned them up.

**Deferred, so it reads as a decision rather than an oversight:** the `geography/README.md`
section this session added carries `TODO: record the source they were transcribed from`. Nothing
in `cgettings-EHDP-work` generates the two CSVs — `code/gis/puma2010_to_puma2020.R` only reads
them — so their provenance is unrecorded and only the author can supply it. It is now on
`production` and `staging`, so closing it is a follow-up commit rather than a pre-merge edit.

---

## Task 1: Commit the availability sweep as a re-runnable script

§2's indicator table is the plan's load-bearing claim and it was produced by a throwaway script.
EHDP-data adds indicators and geotypes over time, so the table decays silently. Make it
re-derivable.

**Files:**
- Create `scripts/ndhr-indicator-availability.mjs`
- Create `scripts/ndhr-indicator-availability-baseline.json`
- Edit `package.json` — add `"ndhr:availability": "node scripts/ndhr-indicator-availability.mjs"`
  to `scripts`, beside the existing `"lint"` entry at line 15

**Interfaces:**
- Consumes: nothing from earlier tasks. Reads `indicators/metadata/metadata.json` from
  `data_repo` + `data_branch`.
- Produces: the authoritative indicator-to-geotype table that Tasks 3 and 4 read, and a
  `--check` mode that exits 1 when availability has moved since the baseline.

**Steps:**
1. The script holds the 28 NDHR indicator names as a literal list keyed by category, resolves
   each to an IndicatorID by exact match on `IndicatorName`, and reports the union of
   `AvailableGeoTypes` across that indicator's measures.
2. Classify each into one of four buckets: CD-family available, PUMA/Subboro only, UHF42 only,
   not found.
3. Positional arguments only, and reject any argument starting with `-`;
   `scripts/characterize-env.mjs` refuses them for the same reason. **The mechanism is worse
   than "npm eats the flag name" for a valueless flag.** A flag with a value arrives as a
   nameless positional, but `--check` carries none, so nothing arrives at all:
   `npm run ndhr:availability -- --check` reaches the script with an empty argv, prints the
   table and exits 0, which reads exactly like a check that passed
   `[verified 2026-09-10: run in PowerShell, empty argv and exit 0; control: the same command
   in Bash delivers --check intact and the script refuses it with exit 2]`. So the `-`
   refusal protects the direct-node path only, and the mode must be a bare word.
4. Bare invocation prints the table; `baseline` writes the JSON; `check` diffs and exits 1 on
   a difference. An optional second positional names an environment, defaulting to
   `production`; `check` refuses a baseline captured on a different EHDP-data branch, since
   staging and production carry different indicator sets and a cross-branch diff reports real
   differences that mean nothing about whether anything moved.
5. Include a positive control: assert that indicator 2143 resolves and reports CD, and that 2133
   resolves and does **not** report CD. Two arms, because one cannot separate the two innocent
   readings: a fetch that silently returned an empty document reports every row "not found",
   which only the 2143 arm catches, while bucket logic reading `AvailableGeoTypes` as
   always-present reports every row "CD-family", which only the 2133 arm catches. The controls
   gate `baseline` too — a baseline written from a broken sweep looks like a real one, and
   every later check passes against it.

**Verification rung:** run the script — it is its own proof. Confirm `check` exits 0 against
the baseline it just wrote, and exits 1 when one row of that baseline is edited by hand. The
second half is what separates a working check from one that passes on everything.

**Read the exit code, not the message.** The script was run 15 ways on 2026-09-10; every message
was correct while the control-failure path exited **127**: on Node v24.0.1 / Windows,
`process.exit()` after a `fetch()` aborts with `Assertion failed: !(handle->flags &
UV_HANDLE_CLOSING), file src\win\async.c, line 76`. `main()` therefore returns its code and
the caller sets `process.exitCode`. It is a race against socket teardown, so the paths that
exited correctly were winning it rather than exempt — which is why the fix covers all of them
`[verified 2026-09-10: an 8-line repro independent of this script — fetch, console.error,
process.exit(2) — exits 127; the same script with process.exitCode = 2 exits 2, and faster
(0.144s against 0.240s)]`. Tasks 2 and 4 fetch from EHDP-data the same way and inherit this.

---

## Task 2: Build `data/globals/cdlist.json`

The CD analogue of `data/globals/uhflist.json`, which supplies the Leaflet selector's name map
and the demographics sidebar.

**Files:**
- Create `data/globals/cdlist.json`
- Create `themes/dohmh/layouts/partials/lib-cdlist.html`, modelled on
  `themes/dohmh/layouts/partials/lib-uhflist.html`

**Interfaces:**
- Consumes: `geography/GeoLookup.json` for the 59 CD rows and the CDTA2020 crosswalk;
  `indicators/data/103.json`, `2335.json`, `2334.json`, `17.json` and `2336.json` for the five
  demographic rows that exist as indicators.
- Produces: the global `communityDistricts`, emitted by `lib-cdlist.html` at build time via
  `resources.FromString` into a fingerprinted script, exactly as `lib-uhflist.html` does for
  `neighborhoods`. Read by Tasks 6 and 7.

**Per-row fields:** `CD_id` (GeoLookup `GeoID`), `CD_name` (GeoLookup `Name`), `page_name`
(slug), `borough`, `CDTA_id` (from the parsed crosswalk), plus `TotalPopulation`,
`PercentOver65`, `PercentUnder18` from ACS by hand, and `PovertyPercent`,
`PercentLimitedEnglish`, `PercentGraduatedHighSchool`, `PercentOwnerOccupied`,
`PercentRentBurdened` from the five indicator files at their latest time period.

**No `Zipcodes` field.** ZIP codes do not nest into community districts and no crosswalk is
published. The sidebar row is dropped rather than approximated; Task 7 removes it from the markup
rather than rendering it empty.

**Verification rung:** grep plus a build. Assert the file has 59 rows and that every `CDTA_id` is
non-null and distinct. The crosswalk assertion is the one that matters — a null there means the
`(CD n)` parse failed on a name string.

**This rung also asked for a `hugo --environment development` build emitting the fingerprinted
`cdlist-data` script, and that check cannot pass — it is corrected rather than re-run.** Nothing
includes `themes/dohmh/layouts/partials/lib-cdlist.html`, so no build emits the asset
`[verified 2026-09-11: isolated `development` build, exit 0 over 1205 pages — `uhflist-data`
1 file, `cdlist-data` 0, with the included `lib-uhflist` partial as the control that the probe
can see these assets]`. Written as an outcome the tree cannot produce, it would read as a
regression to whoever ran it next. **It belongs to Task 6**, which adds the include; what a build
proves until then is only that the partial and the JSON parse.

### Task 2 as built `[c3d03a2fbf]`

**The file is generated, not authored** — `scripts/ndhr-build-cdlist.mjs`, run as
`npm run ndhr:cdlist build`, with a `check` mode that regenerates and diffs. A deviation from
the file list above, taken for Task 1's reason: 59 rows x 10 derived fields is 590 values, five
of the fields move with every EHDP-data refresh, and a throwaway generator is what makes an
artifact decay silently. `data/globals/cdlist-source.json` is the sidecar recording which
indicator, measure and time period each demographic field came from.

**Three ACS fields are unfilled and this task is not closed on them.** `TotalPopulation`,
`PercentOver65` and `PercentUnder18` are `null` on all 59 rows. EHDP-data publishes no
total-population or age-structure indicator at CD — the only CD-level population indicator is
"Foreign-born population" (14), a different quantity `[verified 2026-09-10: every
IndicatorName matching /popul|age|65|under 18/ swept for CD in AvailableGeoTypes; control:
the same sweep returns 2146 and 2176 as CD-available, so it fires]`. "From ACS by hand" needs
a source and a decision about which vintage; **Task 7 must render a null as absent, never as
0**, and the generator refuses a half-filled set so the gap cannot be closed by accident.

**Join CD to CDTA2020 on the parsed names, never on `GeoID` — and nothing is broken upstream.**
A `GeoID` value is an arbitrary internal key. Its only job is that a geotype's geometry, its
`GeoLookup` rows and its indicator data agree with each other, and all three do, so every map and
every indicator on the site is correct today. There is no fix this plan waits on.

What a `GeoID` does **not** carry is any relationship *between* geotypes. It is unique only within
one: across `GeoLookup` as a whole, `(GeoType, GeoID)` is unique at 801 of 801 while `GeoID` alone
is 644 distinct, with 89 values used by more than one geotype `[verified 2026-09-10: counted over
all 801 rows]`. Three of those collisions are CD against CDTA2020, and they are the dangerous
shape — CD `GeoID` 501 is Staten Island CD1 while CDTA2020 `GeoID` 501 is Bronx CD1, so a GeoID
join does not error, it swaps boroughs.

**The divergence from CD is a choice, not a slip, and it was not made at CDTA.**
`EHDP-data/geography/create_TopoJSON.r:279-283` builds the CDTA2020 id by stripping the two-letter
borough prefix off DCP's `BX01`, concatenating `CountyFIPS`, and casting to integer. The same
four-line construction appears at `:329` for NTA2010 and `:381` for NTA2020. NTA2010 came first
and predates the current author of the export code, so why it used FIPS is not recoverable from
anyone here — but a reason is visible in the data: **under a `BoroCode` prefix, 27 of the 195
NTA2010 ids would equal a CD id exactly** — 101, 103, 104, 106, 109, 111, 112, 201, … — and the
FIPS prefix sidesteps that `[verified 2026-09-11: reconstructed the BoroCode form of every
NTA2010, NTA2020 and CDTA2020 id from GeoLookup.json and intersected with the 59 CD ids]`.
NTA2020 and CDTA2020 then borrowed the established pattern, per the author 2026-09-11: NTA2020
nests within CDTA2020, so the two had to number alike.

**What the pattern bought had expired by the time it was extended.** 0 of 197 BoroCode-form
NTA2020 ids collide with a CD id, because NTA2020's unit number is four digits (CD number + NTA
number) rather than two — so the collision NTA2010 avoided cannot arise there. And the nesting
does not depend on FIPS: NTA2020 sits under CDTA2020 as a string prefix **197 of 197 under both
schemes** (same verification). The constraint is that the two geographies agree with each other,
which `BoroCode` satisfies equally. Under `BoroCode` the CDTA ids would equal the CD ids exactly,
59 of 59, and the join this section warns against would simply work. The three-digit Bronx ids are
the tell for the mechanism: `as.integer` drops the two leading zeros of FIPS `005`.

So the cost of the choice lands entirely on CDTA-against-CD, and the author is reconsidering it on
that basis (2026-09-11). Nothing consumes the NTA-under-CDTA nesting in this repo: no authored JS
derives one geography's id from another's, and every use of `properties.GEOCODE` is a within-geotype
join between indicator data and that geotype's own topojson `[verified 2026-09-10: grep over
assets/js/data-explorer and assets/js/nr-report, excluding minified vendor bundles]`.

**Correcting the ids is therefore cosmetic, and optional.** What it would buy is turning a silent
trap into a working convenience. **De-prioritised, not dropped, 2026-09-11**: with an explicit
CD-to-CDTA map committed here (below), nothing in this repo is waiting on a renumbering, so the
case for doing it upstream is convenience for other consumers rather than anything NDHR needs.
NTA2020 and CDTA2020 would have to move together to keep the nesting. **It now has a plan of its
own upstream**: `EHDP-data/documents/geoid-borocode-migration.md` on branch
`docs-geoid-scheme` (named `hotfix-CDTA2020-codes` until 2026-09-11), scoped to CDTA2020 and
NTA2020 with NTA2010 staying on FIPS, and reading
"nothing started, not urgent, not blocking" as of 2026-09-11. Its measurements and this section's
agree independently — 27 NTA2010/CD collisions under `BoroCode`, 0 for NTA2020 either way, 197/197
nesting under both schemes. **And EHDP-data has deliberately not published a CD-to-CDTA crosswalk file**, on
the grounds that `cdlist.json` is its only consumer and a renumbering would reduce any upstream
copy to an identity map; `geography/README.md` documents the name-parse instead. **That README
section is on `docs-geoid-scheme` and is unmerged** — `production` and `staging` carry a
`geography/README.md` with no `## CD and CDTA2020` heading at all
`[verified 2026-09-11: headings compared across all three branches]`. None of this governs the
*PUMA* crosswalks, which are a different relationship and are being published (Task 2b). If it is ever
done, the geometry and the data must move together
or the CDTA choropleth matches nothing and draws unfilled — `CDTA2020.topo.json`,
`CDTA_2020.topo.json`, `GeoLookup.json`, `GeoLookup.csv` and the 33 indicators publishing
CDTA2020. **No site code changes**: every CDTA reference under `assets/`, `themes/` and `content/`
handles the geotype *name*, never an id value. One repo-local file would go stale rather than
break, since the proximity feature reads only its own bundled geojson:
`content/data-features/proximity/geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`.

**None of this reaches NDHR — the explicit map is already committed.** `data/globals/cdlist.json`
carries `CDTA_id` on every row, so the CD-to-CDTA relationship this repo needs is a frozen lookup,
not a rule about id construction `[verified 2026-09-11: 59 rows, zero null, 59 distinct, CD 101 →
CDTA 6101, working tree clean for that path at `c3d03a2fbf`]`. The crosswalk behind it parses
`(borough, CD number)` out of both `Name`
strings, which is correct under either id scheme and depends on no id convention at all
`[verified 2026-09-11: per-pair, 59 of 59 — see DECIDED-2 for the check and its two permutation
controls; the set-equality figure this bracket used to cite could not have seen a mispairing]`.
If the ids are ever corrected,
`npm run ndhr:cdlist check` reports 59 changed `CDTA_id` values — re-run `build`, and do **not**
switch the join to `GeoID`.

**The latest time period is never the highest `TimePeriodID`.** On production the highest id
(288) is "2007-11" and the true latest (287) is "2015-19"; all five fields disagree the same
way. Resolved by `end_period`. **No control catches a wrong choice here** — forcing the reducer
to `max(TimePeriodID)` builds a complete, plausible file, 59 of 59 rows, no nulls, every control
passing, every value eight years stale `[verified 2026-09-10: the injection ran and exited 0
with "Controls: passed"]`. Only the printed period, the sidecar, and `check` against a
committed file surface it. **Task 4 fetches the same indicator files and inherits this.**

**The five demographic fields are 55 measurements across 59 districts.** Four CD pairs carry
one value between them, identically across all five fields, and it is the same four every time:
Manhattan CD1/CD2, Manhattan CD4/CD5, Bronx CD1/CD2, Bronx CD3/CD6. The merge structure is
PUMA's — DECIDED-3 names the two Manhattan ones — but the values are not copied Subboro values:
9 to 20 CD values per field appear at no Subboro area `[verified 2026-09-10: exact Value
comparison, CD against Subboro, all five indicators at TimePeriodID 287]`. Recorded as
`reportedAsOneArea` in the sidecar rather than corrected, because it is upstream. **Task 7 owes
this a label**: the sidebar otherwise shows two neighbouring districts as identical, which reads
as a bug. It is also a partial answer to DECIDED-3 — for these five fields EHDP-data has already
made the CD-to-PUMA decision upstream, under a CD label.

**No `namezip` either.** It has zero consumers across `themes/`, `assets/` and `content/`, so it
is dead in `uhflist.json` as well `[verified 2026-09-10: grep over all three trees]`. The
typeahead in `nr-neighborhood-picker-js.html` searches `UHF_name` and `Zipcodes`, not `namezip`,
so an NDHR picker needs its own `searchIn` list rather than a substitute field.

### Task 2 re-opened by DECIDED-6: the PUMA crosswalk columns

**DONE 2026-09-11.** Files:
- `puma2010_to_subboro_cd.csv` and `puma2020_to_cd.csv` published under EHDP-data `geography/`
  on **both** data branches, from `cgettings-EHDP-work/data/gis/`, with a
  `## PUMA to Community District` README section. Authored at `b573b8ae` on
  `feature-cd-puma-crosswalks`, cherry-picked onto `production` as `b696872b` and onto `staging`
  separately — §3 says why cherry-pick rather than merge, and how to ask whether it landed
- `scripts/ndhr-build-cdlist.mjs` fetches both from `data_repo` + `data_branch` and emits the
  three columns `[c8fc31c182]`
- `data/globals/cdlist.json` and `data/globals/cdlist-source.json` regenerated `[39d967c289]`

**Three columns, one of them used.** `PUMA2020_id` is what the report reads, per DECIDED-10.
`Subboro_id` and `PUMA2010_id` are emitted too — DECIDED-10 keeps Subboro available rather than
dropping it, and both ride along in `puma2010_to_subboro_cd.csv` at no extra cost. Task 4 reads
`PUMA2020_id` and nothing else until that decision changes.

**Never name a column `PUMA_id`.** An unqualified name invites a later reader to treat the two
vintages as interchangeable, and they are not: they merge different Manhattan districts, so the
wrong one is right for 56 of 59 and silently wrong for CD4, CD5 and CD6 — the shape that passes
a spot check of any other borough. The generator's controls must assert all three columns are
non-null on all 59 rows, that each resolves to 55 distinct values, and that the multi-CD groups
are the four each vintage actually declares.

**Interfaces:** consumes the two CSVs from EHDP-data `geography/`; produces three columns, of
which Tasks 4 and 7 read `PUMA2020_id`.

**Verification rung `[built and run 2026-09-11, `c8fc31c182`]`:** the generator's own `check`,
plus the assertion it lacked — the set of CDs sharing a `PUMA2010_id` must equal the four groups
measured from the demographic data in "Task 2 as built" (Manhattan CD1/CD2, Manhattan CD4/CD5,
Bronx CD1/CD2, Bronx CD3/CD6). That is a cross-check of the crosswalk against data computed
independently of it, and it is the only thing here that catches a vintage swap.

**The discriminating result is which controls fired, not that one did.** Reshaping
`puma2020_to_cd.csv` into the 2010 file's columns — the literal vintage swap — exits 2 on the
grouping control **and on nothing else**, because the null, distinctness and 55-area checks pass
identically under either file. Two structural injections also exit 2, both refused before any row
is built: a dropped CD row (`has CD 503, which is not in geography/puma2020_to_cd.csv`) and a
renamed header (`header is "PUMA_2020,CD"`). The injections were run before the publish, against
the two files served from the local IIS mirror at
`C:\inetpub\wwwroot\EHDP-data\production\geography\` — byte-identical to what EHDP-data now
serves, and removed afterwards.

**Then against the real source, once both branches carried the files.** `npm run ndhr:cdlist build`
exits 0, `check` exits 0 "UNCHANGED", and `node scripts/ndhr-build-cdlist.mjs print prod_stage`
exits 0 with the same four PUMA2020 groups — the second data branch, which a 200 on the raw URL
does not by itself establish.

**The regeneration is proved to have changed only the three columns.** Field-by-field against the
previously committed file: 59 rows both sides, keys added exactly `PUMA2010_id`, `PUMA2020_id`,
`Subboro_id`, none removed, and **zero** pre-existing values changed. That detector is not dead —
injecting `PovertyPercent = -1` on CD 101 makes it report that field
`[all verified 2026-09-11]`. The demographic period is still 2015-19 (TimePeriodID 287), not the
higher-id 2007-11 a `max(TimePeriodID)` reducer would have taken.

Before the publish, `npm run ndhr:cdlist check` exited 2 with `REFUSING TO RUN — 404 Not Found`.
That was deliberate and is worth keeping in mind if the files ever move: a missing crosswalk must
not build a file whose three columns are quietly null.

---

## Task 3: Author the category and content YAML

**Files:**
- Create `data/globals/NDHR_categories.yml`, modelled on `data/globals/NR_topics.yml`
- Create `data/globals/NDHR_content/<category_key>.yml`, one per category, modelled on
  `data/globals/NR_content/*.yml`

**Interfaces:**
- Consumes: Task 1's baseline for which indicators are in scope.
- Produces: the category list the content adapter (Task 5) crosses with `cdlist.json`, and the
  per-category indicator specs the compute module (Task 4) resolves.

`NDHR_categories.yml` carries per category: `key`, `slug`, `title`, `menu_label`,
`seo_short_name`, `seo_long_name`, `summary`. The `summary` text is the header description from
"Text of ... for Review", section "Headers and Header Description".

`NDHR_content/<key>.yml` differs from `NR_content` in three ways, each deliberate:
- keyed on **IndicatorID**, not MeasureID, because route A resolves measures from metadata
- carries `indicator_short_name` per indicator, since §2 established it has no upstream source
- carries `strategy` and `strategy_description` per indicator, from "Text of ... for Review",
  section "Strategies and Strategy Description" — site-owned content with no EHDP-data equivalent

**Unblocked 2026-09-11.** Five category files, 18 indicators: Climate & Active Design declares
three (2388, 2191, 2185) per DECIDED-10, Housing six (15, 2336, 2145, 2365, 45, 107),
Neighborhood Conditions six (2143, 2400, 2457, 2389, 2323, 2416), Health Outcomes & Care Access
three (2075, 2322, 2379), and **Mental Health none**.

Mental Health needs an explicit empty state rather than an absent or zero-length indicator
list, per DECIDED-7: give it a required `empty_state` string saying no community-district data
is published for these measures yet, so Task 7 renders a stated absence and a template bug that
drops the rows is still distinguishable from it. A category whose indicator list is simply
missing is not.

**Verification rung:** a build, plus one assertion added to Task 1's script — every IndicatorID
appearing in a content file must be present in the availability baseline with a CD-family
geotype. Checking that by eye across four files is how a typo'd ID reaches Task 4 as a silent
empty row.

### Task 3 as built

**DONE 2026-09-11.** Files: `data/globals/NDHR_categories.yml` (five categories) and
`data/globals/NDHR_content/{climate_and_active_design,housing,neighborhood_conditions,health_outcomes_and_care_access,mental_health}.yml`
(18 measures, Mental Health zero). `scripts/ndhr-indicator-availability.mjs` gained the
validator; `js-yaml` was added as a devDependency, since nothing in `node_modules` could parse
YAML and no other script in `scripts/` reads any.

**Keyed on MeasureID, in NR_content's key naming — the user's decision, 2026-09-11.** This
task's own text specified IndicatorID ("because route A resolves measures from metadata"), and
the snake_case keys that came with it were an unprompted divergence from the files this work is
modelled on. Both were reversed: **NR is the reference because the work to make NR render has
already been done**, so the data its templates read keeps its form unless there is a reason to
depart. `MeasureID`, `IndicatorID` and `MeasureName` are spelled as EHDP-data spells them.

**One place it does depart, also the user's call: no `report_topics` layer.** NR_content groups
its MeasureIDs into named subsections. Neither NDHR source document groups indicators below the
five categories, so that layer held exactly one group per file, named after the category, with a
null description — structure carrying no information. A flat `measures` list instead. If real
subsections are ever authored this becomes a list of them and the renderer gains a heading level.

MeasureID is also the better key on its own terms: an IndicatorID names a family of series —
"Number", "Percent", "Age-adjusted rate" — whose values are not interchangeable, and choosing
among them is a content decision the file should record. `IndicatorID` stays beside it because
it is what locates the data file; EHDP-data publishes `indicators/data/<IndicatorID>.json` with
MeasureID as a column inside.

**Ten of the eighteen measures are the ones NR already chose** for the same indicator — 25,
245, 690, 692, 781, 983, 1029, 1128, 1196, 1224 `[verified 2026-09-11: MeasureIDs in
data/globals/NR_content/*.yml]`. Of the remaining eight, four had only one measure to take and
four are recorded with their reason in a comment beside the row: rates rather than counts for
evictions and the three health outcomes, density rather than count for public bathrooms and
litter baskets, and the with-AC framing rather than without-AC, which would invert the tertile
reading.

**Three fields NR_content does not carry**, each named in this task or forced by an earlier
decision: `indicator_short_name` (§2 established it has no upstream source), `strategy` and
`strategy_description` (DECIDED-5), and `geotype`. **Task 15 made this four and renamed the
first** — `indicator_short_name` is gone, replaced by `IndicatorName` carrying EHDP-data's own
name, and `description` joined them; see "Task 15 as built". The last is the one this task did not
anticipate: NR needs no such field because every NR row is UHF42, while NDHR reads three rows
at PUMA2020 and two at CDTA2020 per DECIDED-10, and several of these measures publish at more
than one geography.

**The source document must be read with its tracked changes ACCEPTED, and this is not a
detail.** Flattening the XML yields text carrying both the insertions and the deletions, which
still reads as prose: "Health care access is not equally distributed across the city,. Theand
its availability of affordable health-related facilities…". Two rows also vanish on acceptance —
households using electric medical equipment and health insurance (adults) — and both are
indicators this plan had already dropped for other reasons, so the document and DECIDED-1/10
agree more closely than the flattened text suggests `[26 `w:del` runs, 38 `w:ins`]`.

**One summary is repaired rather than transcribed.** Accepting the changes leaves the Health
Outcomes header ungrammatical — the deletion took the noun phrase its sentence needs. The phrase
is restored from the other source document, which carries the same sentence intact, and the YAML
comment says so at the point of use. Two further content gaps are recorded as `TODO` comments
rather than invented: the Housing header carries an unresolved authoring note
("[Also add language about housing affordability, stability, and accessibility]"), and evictions
(2365) appears in neither table of "Text of ...", so its strategy comes from the other document's
"Example Intervention" column and its `strategy_description` is null.

**The rung's assertion outgrew this task's wording twice over.** "Present in the availability
baseline with a **CD-family** geotype" predates DECIDED-10 — three of the eighteen are read at
PUMA2020, which is not CD-family — and the baseline could not carry the check at all once the
files became measure-keyed. **Its `geoTypes` is the union across an indicator's measures**, so a
row naming a geography only a *sibling* measure publishes at would pass. Three of the eighteen
indicators have measures that disagree that way: 2185, 107, 45 `[verified 2026-09-11: per-measure
`AvailableGeoTypes` against the indicator union]`. So the check reads live metadata, and asserts
per row that the MeasureID exists, sits under the declared IndicatorID, carries the declared
MeasureName, and publishes at the declared geotype.

**Verification `[all run 2026-09-11]`:**
`node scripts/ndhr-indicator-availability.mjs check` exits 0 and prints "Content: 5 categories,
18 measures — consistent with the metadata". Nine injections each exit 1 naming their own cause:
an unknown MeasureID, a real sibling measure swapped in, a wrong MeasureName, a geotype the
measure does not publish, **a geotype only a sibling publishes — the case a union check passes**,
Mental Health's `empty_state` removed, one measure declared in two files, a content file renamed
out from under its category entry, and a category key with no file. A removed `measures` key
exits 2. The files were restored from a copy and diffed back to byte-identical afterwards.

**The first pass of this injection suite included one that did not fire, and the premise behind
it was wrong rather than the code.** It set indicator 15's row to a sibling-only geotype — but
"Crowding, Percent" and "Crowding, Number" publish at the same nine geographies, so there was no
sibling-only geotype to name. The comment in the script had cited 15 as the live case; it now
cites 2185, where "Households with AC, Number" (782) publishes at Subboro and not PUMA2020 while
its indicator's union includes PUMA2020. A green suite would have hidden that the discriminating
arm had never run.

**The validator's no-power case is loud, which is the point.** A validator that cannot find the
files reports zero problems, and zero problems is what a clean pass looks like — so a missing or
unparseable content directory exits **2**, not 0. Verified by moving the directory aside.

**The build proof has its own control.** An isolated `development` build exits 0 with the new
data files present — but Hugo loads all of `data/` whether or not anything reads it, so that pass
would look identical if it had never opened them. Appending one malformed line to
`housing.yml` fails the build naming the file and line, which is what makes the clean exit 0 a
statement about these files `[both builds run with `HUGO_RESOURCEDIR` and `-d` outside the repo]`.

**Category slugs are hyphenated** — `/ndhr/<cd-slug>/climate-and-active-design/` — where
`NR_topics.yml` uses underscores. NR's slugs reproduce URLs already indexed; this section has
none yet, so it was a free choice. Reversible now, expensive after Task 5 generates 295 pages.

---

## Task 4: The shared compute module

The piece both NDHR and, later, Neighborhood Reports read. Geography-parameterized from the
start.

**Files:**
- Create `assets/js/report-data/normalize.js`
- Create `scripts/report-data-parity.mjs`

**Interfaces:**
- Consumes: `NDHR_content` indicator lists (Task 3); EHDP-data metadata, indicator data,
  TimePeriods and GeoLookup.
- Produces: `buildRows({ indicatorIds, geoType, geoId })` returning normalized rows carrying
  `indicator_name`, `indicator_short_name`, `indicator_long_name`, `indicator_description`,
  `data_value_geo_entity`, `data_value_boro`, `data_value_nyc`, `data_value_rank`, `rankReverse`,
  `data_source_list`, `measurement_type`, `units` — deliberately the NR report JSON's field
  names, so the forked renderers need no rewriting. Consumed by Task 7.

**Steps:**
1. Resolve each IndicatorID to its measure via `metadata.json`, taking the measure whose
   `AvailableGeoTypes` includes the requested `geoType`.
2. Take the latest `TimePeriodID` present for that geotype in the indicator's data file.
3. Rank the geography's areas into tertiles and emit `data_value_rank` on the same convention
   `assets/js/nr-report/tertiles.js` reads: 1 is the unfavourable tertile, 3 the favourable, and
   `rankReverse` chooses only which word describes the value, never the verdict
   (`nr-report/tertiles.js:48`, fixed 2026-08-12).
4. Read `rankReverse` from the measure's `VisOptions.Map` entry for that geotype.
5. Read borough and citywide comparison values from the same data file's `Borough` and
   `Citywide` rows.

**Verification rung: a parity harness against ground truth, not a unit test.**
`scripts/report-data-parity.mjs` runs `buildRows` for `geoType: "UHF42"` over the Active Design
indicator list and diffs its output against EHDP-data's own precomputed
`neighborhood-reports/data/report/Active_Design_Physical_Activity_and_Health Injury and
health.json` for the same neighborhoods.

This is the task's whole point. It validates route A against the numbers NR ships today, before
any NDHR page exists — and it is the evidence an eventual NR migration will need.

Write the expected result down before running: `indicator_short_name` differs, since §2
established it has no upstream source; every other consumed field matches. A run that fails for
an unexpected reason reads as a flake without that written first, and gets retried instead of
diagnosed.

### Task 4 as built

**The result: 34,398 field comparisons against the published NR payloads, 0 mismatched**, over all
five reports and 22 sections at UHF42 — **37,044 on a re-run, once `units` joined the compared set** — not the one report this task specified. Route A is
established: the browser can reproduce the numbers NR has published for years, from EHDP-data's
own indicator files.

The prediction written before the first run held on the fields it named and was **too narrow on
two counts**. `indicator_short_name` does differ, as §2 said, and is a site-owned field the
content YAML supplies. So, it was recorded here, does `units` — **and that was wrong; corrected
2026-09-11, see below**. The third, `nbr_rank`, is not emitted at all:
`assets/js/nr-report/cards.js` reads `data_value_rank` only and nothing in the NR templates or
modules reads `nbr_rank`, so its published tie convention — neither competition nor dense ranking
in either direction — was left unrecovered rather than approximated.

**Correction, 2026-09-11: `units` is not site-owned. Metadata's `DisplayType` is that field.**
The original claim was that units appear nowhere in metadata. They had been sought under
`MeasurementType`, where they genuinely are not — two "Percent" measures do carry different units,
so that half of the reasoning was sound and the conclusion drawn from it was not.
`measure.DisplayType` carries `"per 100,000"`, `"per 10,000 homes"`, `"per square mile"`,
`"out of 5"`, `"Bodegas to supermarkets"`, and the empty string for every `Percent` measure.

It agrees with the published payloads' `units` on **10 of 10** NDHR measures that appear in an NR
payload, empty string included. That sample is small and is not what the correction rests on:
`normalize.js` now reads `measure.DisplayType ?? ''`, `units` moved out of the parity harness's
`EXPECTED_ABSENT` into its compared-fields list, and the harness re-run is the proof —
**37,044 field comparisons, 0 mismatched**, up from 34,398 by 2,646, which is one new comparison
per row over all five reports and 22 sections. All three controls still fire (17, 243, 514).

**What this retires.** Task 3 needs no `units` authoring, and Task 7 does not wait on it. The gap
recorded at the foot of "Task 6 as built" — every card rendering a bare number — is closed by a
one-line read, not by 18 hand-written strings, and the 8 NDHR measures with no NR precedent are
covered as well as the 10 with one, which hand-authoring would not have been.

**The generalizable half, and it is sharper than "we didn't look".** §2 *had* enumerated the
measure-level key set on 2026-09-10 rather than grepping for guessed names — which is the right
method, and `DisplayType` was in what it returned. Enumerating the keys does not tell you what a
key holds, and this one's name says *display*, not *units*.

So the name-shaped search fails in both directions here. Searching the measure objects for keys
matching `/unit/i` returns **zero** — not `MeasureName`, `MeasurementType`, `DisplayType` or
`how_calculated` contains the string, so that search reads as confirmation of the absence. What
finds it is searching for a known *value*: `"per 100,000"` appears in 117 of the 731 measure
objects, in exactly two fields, `how_calculated` and `DisplayType` `[verified 2026-09-11]`.
**When asserting a field is absent from an upstream source, search for an instance of what it
would hold, not for what it would be called.**

**Two of the task's five steps were wrong as written.** Step 1 resolves an IndicatorID to a
measure by geotype; Task 3's MeasureID rekeying made that obsolete, and `buildRows` takes the
content rows directly. Step 4 reads `rankReverse` from the measure's `VisOptions.Map` entry for
the requested geotype — which **does not exist for 2 of the 18 NDHR measures**: 690 has Map
entries for Borough and NTA2010 only, and 537's single entry carries `GeoType: null,
RankReverse: null`. Falling back to any non-null entry is safe by measurement rather than
assumption — across all 731 measures in production metadata, `RankReverse` is constant within a
measure, zero exceptions — but **223 of those 731 carry no non-null value anywhere**, so the
content YAML may state `rank_reverse` and the default is 0.

**Five rules the plan did not have, each recovered by diffing and each load-bearing.**

- The number is `Value` rounded to **one decimal**, via `Number(v.toFixed(1))`. `Value` is
  unrounded (46.9313) and every published figure is rounded (46.9). `Math.round(v * 10) / 10` is
  not the same operation — it rounds 26.95 up to 27 because multiplying by 10 first loses the
  fact that the stored double is 26.9499999999999993, where the payload publishes 26.9.
- Ranking runs on the **rounded** value. Rounding merges distinct figures into ties, and ranking
  the unrounded column produces ranks the payload does not have. The control that removes the
  rounding produces 243 mismatches.
- Tertiles are **`NTILE(3)` over position**, sorted unfavourable-first: the first `n % 3` buckets
  take the extra area, so 41 areas split 14/14/13. `floor(n/3)` leaves 8 rows unexplained across
  the corpus and `ceil(n/3)` leaves 2; NTILE leaves 0.
- The latest period is the one whose coverage **ends last and has at least one usable value**.
  Measure 1128 publishes a complete 59-row CD set for 2022 in which every value is null — "latest
  period present at this geotype" renders that indicator empty on all 59 pages with no error.
- `DisplayValue` **already carries its footnote marker** ("43.7\*", and "^^" on measure 86, so the
  markers are not all asterisks). It is emitted verbatim; the one case needing work is a
  suppressed row, whose DisplayValue is the bare marker and which the payload prefixes "N/A" to.

**48 of 2,646 rows cannot be matched by any implementation and are scored separately.** (The
denominator here read 34,398 until 2026-09-11, which is the *comparison* count — 13 fields over
those same 2,646 rows, now 14 and 37,044.) Tertiles
split by position, so a run of tied values straddling a boundary lands in two tertiles, and which
area falls on which side is not a function of any field in the data — the payloads order such ties
inconsistently between measures. Reproducing that split rather than giving a tie group one tertile
was decided 2026-09-11; on NDHR's own data it affects 38 rows of 1,062, 24 of them on the Heat
Vulnerability Index, whose integer 1–5 score ties heavily.

**Seven rows are a named allowance, not a tolerance.** They are exact half-way values (99.95,
2.05, 22.05) where the payload rounds the other way, and they cluster on measures 687, 755 and 645
against 221 and 1128 — two upstream pipelines rounding differently. `toFixed` agrees with the
payload on 2,598 of 2,603 area values and `DisplayValue` on 2,171, so the first is the rule and
these are its residual. Each is listed row by row, and an entry that stops being needed fails the
run, so the list cannot quietly absorb a later regression.

**The first control battery was a single arm and it was dead.** It removed NTILE's remainder
distribution — and every NR section has exactly 42 areas, which divides by 3, so that branch never
executes. It returned 0 against a run that was in fact correct, and the harness refused to certify
its own green result. Replaced by three arms that must each move something the data can see.

**What the harness could not check, and what it found instead — the export gap route A has to
close.** **10 measures the published payloads carry cannot be computed from what EHDP-data
exports**, and they split into two shapes with different causes:

- **Seven have no metadata entry and no data file**: 691, 2377, 640, 641, 642, 646 and 647 are
  absent from `metadata.json` and their indicator data files 404. **The cause is an export gap,
  not a retirement** — per Chris 2026-09-11, the database holds data that is exported into the
  neighborhood-report payloads but not exported as indicators, and closing that is a prerequisite
  for route A. Worth stating because the observation alone cannot tell the two apart: the harness
  sees only current state, so "absent now" reads equally as "removed" and as "never published",
  and only the author can say which.
- **Two are exported but carry no usable UHF42 row**: 625 and 1284 are in `metadata.json` with
  data files that fetch. Whether that is the same gap at geography granularity or a separate
  cause is **not established** — it is a different fix if it is different.

Four more sections have no published payload to compare against at all (the PM2.5 and ozone
health-burden pairs, 404 on both reports).

**Three NDHR facts for Task 7.** Measure 822 (Heat Vulnerability Index) publishes at CDTA2020
**only** — no Borough, no Citywide row — so its card can carry a tertile sentence but no borough
or citywide comparison. Measure 781 renders "N/A\*\*" on the 21 community districts PUMA2020 does
not cover, which is the gap accepted on 2026-09-11 rather than a failure. And `area_count` varies
by row on one page — 59 at CD and CDTA2020, 35 or 52 at PUMA2020 — so "than most neighborhoods"
is comparing against different-sized sets within one report.

---

## Task 5: Content adapter, routing, and page inventory

**Files:**
- Create `content/ndhr/_index.md`
- Create `content/ndhr/_content.gotmpl`, modelled on
  `content/neighborhood-reports/_content.gotmpl`
- Create `content/ndhr/<category_key>.md`, one per category, each setting `layout` and an
  explicit `url`

**Interfaces:**
- Consumes: `cdlist.json` (Task 2) and `NDHR_categories.yml` (Task 3).
- Produces: the page set Tasks 6 and 7 render into.

Pages, on five categories per DECIDED-7: **295** report pages at
`/ndhr/<cd-slug>/<category-slug>/`, 59 CD indexes at `/ndhr/<cd-slug>/`, 5 category indexes, 1
landing — **360 pages**. `ndhr` is confirmed as the path segment by DECIDED-8, and the long form
"Neighborhood Development Health Report" is what `seo_title` carries.

**295 of these render an indicator-free category on 59 of them.** The Mental Health pages are
real pages with a header, a description and a stated empty state; the adapter must emit them
rather than skipping a category with no indicators, or the count silently becomes 236 again.

Three adapter constraints, each of which fails silently rather than loudly:
- `.Site.Pages` and `.Site.GetPage` are unavailable inside an adapter — the Site object is not
  built yet — so everything it needs comes from `data/`.
- A front matter field with its own Hugo accessor must be a **top-level key** in the page map,
  not a `params` entry. `title` feeds `.Title`, `summary` feeds `.Summary`. Filing `summary`
  wrongly blanked the `<description>` of all 210 NR report entries in `index.xml` while every
  HTML page looked correct.
- `.File.BaseFileName` is the literal string `_content`, so a `where` keyed on it matches zero
  rows without erroring.

**Verification rung:** build and count. `hugo --environment development` with `HUGO_RESOURCEDIR`
and `-d` redirected to temp directories, which cannot reach `resources/_gen` and so is safe
beside a running server `[verified 2026-08-18 per CLAUDE.md: production build run with a
dev_stage server live throughout; all 174 files under resources/_gen byte-identical on a
path+size+mtime manifest before and after, docs/ untouched, and the server's 36 fingerprinted
asset URLs unchanged afterward — the documented poisoning symptom probed directly and absent]`.
Count generated pages by the `data-pagefind-meta="title:` marker, which
`head.html` emits unconditionally. A viewport-meta count is not safe here —
`static/data-stories/cold/source/index.html` carries the identical tag and would be scored as a
page.

---

### Task 5 as built

**The page inventory is exactly the number this task predicted: 360.** An isolated `development`
build lists 360 `/ndhr/` URLs in `en/sitemap.xml` — 1 landing, 5 category indexes, 59 community
district indexes, 295 report pages — with 295 of them at depth 2 (`<cd>/<category>/`), so no CD
slug collides with a category slug. Mental Health is among the five, unconditionally: its 59
pages exist and carry its header and description, and the empty indicator list is Task 7's to
render.

**The finding that changes Task 6: a `kind: page` with no renderable layout is dropped in
silence.** With no `themes/dohmh/layouts/ndhr/` directory, the build exits 0, prints no warning,
lists all 360 URLs in the sitemap, and writes **60** HTML files — the landing page and the 59 CD
indexes, which resolve to `_default/list.html`. The 300 `kind: page` entries resolve instead to
`themes/dohmh/layouts/_default/single.html`, **which is a zero-byte file** and has been since the
repository's first commit `[verified 2026-09-11: `git cat-file -s` on that path reads 0 at both
this branch's HEAD and `production`]`. Nothing in the build output distinguishes that from a
section that was never generated.

So the marker count this task specified cannot reach 360 until Task 6 lands, and a session running
it before then will read 60 and suspect the adapter. Two things separate those cases, and both
were run:

- **The sitemap is the adapter's own output** and reads 360 with no layouts present at all.
- **A placeholder-layout control.** Three minimal `{{ define "main" }}` stubs at
  `themes/dohmh/layouts/ndhr/ndhr-{report,category-index,cd-index}.html` take the build from 60
  NDHR pages to **360**, counted by the `data-pagefind-meta="title:` marker
  `[verified 2026-09-11: 1 landing + 5 category + 59 CD + 295 report, 59 distinct CDs, all five
  category segments present, 0 unclassified]`. The stubs were deleted afterwards — they are Task
  6's files, not this task's. Site-wide the same count moved 987 to 1287, and 1287 minus 360 is
  927, which is the real-page count CLAUDE.md records for a `prod_prod` build; the environments
  differ only in `head.html`'s robots meta, so that is a cross-check rather than a proof.

**Three things this task decided that its spec did not name, each reversible in one line:**

- **No main-menu entry.** `config/_default/config.toml` has five `[[menu.main]]` blocks and NDHR
  is not a sixth. Adding one puts a prototype in the site's primary navigation, which is a
  publishing decision rather than a routing one.
- **No `categories` front matter on the five category pages.** The NR topic files carry one, which
  is what cross-links them to Key Topics. NDHR has no assigned key topics, and inventing keys
  would create wrong cross-links rather than missing ones.
- **No `seo_image`.** `NDHR_categories.yml` carries none where `NR_topics.yml` does, so the card
  images on the CD index are a Task 6 decision.

**One duplication was accepted deliberately.** Each category's summary appears twice — as
`summary` in `NDHR_categories.yml`, which feeds `.Summary` on the 295 generated report pages, and
as the body of `content/ndhr/<key>.md`, which is what a category index renders. NR has the same
two slots and fills them with different prose; NDHR has one written description per category, so
the two copies are the same string and can drift. Giving the category pages their own intro copy
is the fix, and it needs copy that does not exist yet.

**The landing page prose is sourced, not composed.** `content/ndhr/_index.md` paraphrases the
Context section of `documents/NDHR/2026 Neighborhood Development Health Report.docx`, paragraphs 2
and 3. That file carries 0 tracked changes, unlike the other source document.

**`seo_title` carries the long form on every kind of page**, per DECIDED-8 — report pages as
"<Category> in <CD> | Neighborhood Development Health Report", CD indexes as
"<CD> | Neighborhood Development Health Report", category indexes as the `seo_long_name` string.
`head.html` appends " – Environment & Health Data Portal" to every non-home page, so none of these
repeats the brand the way `nr-neighborhood-index`'s does.

---

## Task 6: Report layout and the CD Leaflet map

**Files:**
- Create `themes/dohmh/layouts/ndhr/ndhr-report.html`, forked from
  `themes/dohmh/layouts/neighborhood-reports/nr-report.html`
- Create `themes/dohmh/layouts/ndhr/ndhr-cd-index.html`
- Create `themes/dohmh/layouts/ndhr/ndhr-category-index.html`
- Create `themes/dohmh/layouts/ndhr/section.html`
- Edit `assets/scss/_custom.scss` — add an "NDHR report page" heading with rules scoped to
  `.ndhr-report-accordion`

**Interfaces:**
- Consumes: Task 5's pages, `lib-cdlist.html` (Task 2).
- Produces: `window.NDHR_REPORT_CONFIG`, read by Task 7's modules. Same shape as
  `NR_REPORT_CONFIG` minus `vizUrl` and the report `sections` array, plus `geoType`,
  `communityDistrict`, `cdId`, `cdtaId`, and the per-category indicator list.

The Leaflet selector loads `CD.geojson`. It sits in EHDP-data, where `UHF42.geojson` sits in
this repo's `static/geojson/` — pick one and say why in a template comment. Fetching it from
EHDP-data makes the map geometry follow `data_branch` like everything else on the page; copying
it to `static/` matches what NR does today.

**Do not include `nr-leaflet.html` on this page.** Task 7's `map.js` declares the four names that
partial also declares, per §2.

**Verification rung: browser.** A map is a runtime claim and nothing below the browser settles
it. Load one report page, confirm 59 polygons render, confirm a click selects and the address bar
rewrites, and confirm keyboard focus reaches a polygon and Enter selects it — `map.js` binds
`keydown` beside `click`, and the NR polygons were focusable long before anything listened.

---

### Task 6 as built

**All 360 pages now render.** An isolated `development` build exits 0 and writes 360 NDHR pages
counted by the `data-pagefind-meta="title:` marker — 1 landing, 5 category indexes, 59 community
district indexes, 295 report pages, 59 distinct districts, all five category segments, 0
unclassified. Site-wide that is 987 to 1287 real pages.

**This task's browser rung as written cannot run, and the premise behind it is worth naming.** It
asks for 59 polygons, a click that rewrites the address bar, and keyboard focus reaching a
polygon — all of which `assets/js/ndhr-report/map.js` draws, and that directory is Task 7. The
same coupling stops the layout being a complete fork: `resources.Get` on a path that does not
exist returns nil and fails the build, so the ten `<script>` tags that mirror `nr-report.html`'s
last twenty lines land with the modules they name. **Task 6 is the server-rendered half; the map
rung belongs to Task 7 and this row does not claim it.**

What was run instead is the browser, on all five page kinds against a `dev_stage` server:

- **200 and a clean console on 5 of 5.** No `console.error`, no `pageerror`.
- **The four library partials define their globals on the report page** — `L` object,
  `communityDistricts` array of 59, `vegaEmbed` function, `aq` object, plus `renderQRCode`.
  `lib-cdlist`, not `lib-uhflist`: `uhflist-data` appears 0 times on an NDHR page.
- **`NDHR_REPORT_CONFIG` parses as an object**, with `measures` an array of 6 on Housing and of 0
  on Mental Health, `geoIds` carrying all three geographies, and `districtMap` 59 entries. That
  needed a fix: `{{ jsonify }}` inside a `<script>` is escaped as a JS *string*, so the first
  build shipped `measures` as one long quoted string and `emptyState` as the string `"null"`.
  `safeJS` is what makes it a literal, and `jsonify` still escapes `<`, `>` and `&`.
- **Heading order introduces no skip.** The landing page reads 1 2 3 3 3 3 3 2 3 3 3 3 3 2 and the
  report page 1 1 2 — the two `h1`s being the mobile and desktop titles, as on the NR report page.
  The one skip the probe reports, `h2 "Page Footer"` to `h5 "Search"`, is on the home page and both
  NR pages too, so it is the shared footer and predates this work `[verified 2026-09-11: the same
  probe over 5 pages, 2 of them pre-existing]`.

**The finding that needs a decision: adding this section moved search results for pages that
already existed.** `node scripts/pagefind-characterization.mjs --check` exits 1, and the count half
is exactly as intended — **202 indexed pages to 267, all 65 new ones under `/ndhr/`, none lost**, so
the 295 report pages are correctly out of the index. The ranking half is not neutral:

- **A search for "neighborhood reports" no longer returns the Neighborhood Reports landing page in
  its top five.** It was second; the result count went 108 to 173 and `/neighborhood-reports/` is
  no longer among the five printed. Its exact new rank was not measured.
- **"climate" now returns `/ndhr/climate-and-active-design/` first**, ahead of
  `/key-topics/climatehealth/`, which held that slot.
- **"asthma East Harlem" now returns `/ndhr/` first.** NDHR has no asthma category and no East
  Harlem, so that is a false positive against a two-word query NR's own indexing decisions were
  tuned around.

**Resolved 2026-09-12: the whole section came out of the index instead, and the baseline was
never re-captured.** Two of the three symptoms above were one bug, fixed in `c895d33575` {EM} the
landing page's 59 district names were body text, which is what answered "asthma East Harlem" on
*East* from Upper East Side and *Harlem* from Central Harlem. Of the remaining two, neither was
the tie-break a later note in this plan called them: for "neighborhood reports" the tie itself was
created by the change (2 results within 0.05 of the top before, 105 of 173 after, top score 6.5880
to 4.6470), and for "climate" there were no ties at all {EM} 37 distinct scores over 37 results.
Three responses had been named and were not exclusive: ignore the 59 district indexes, weight the
category indexes, or accept. The user chose a fourth {EM} ignore all of it for now {EM} which
returns `--check` to exit 0 against the committed baseline. See the status block at the top for the
full numbers and how to reverse it. `documents/nr-pagefind-parity-2026-08-15.md` §5 remains the
instrument that would settle whether any of this matters to real searchers.

**Task 9's file list was short by one line** {EM} it named re-capturing
`scripts/site-characterization-baseline/staging/` and `.../prod_prod/` and not the Pagefind
baseline, which this measurement showed also moves. Added 2026-09-11, then closed 2026-09-12
without a re-capture being needed at all.

**What was built beyond the four files this task names, and why each:**

- `themes/dohmh/layouts/partials/ndhr-category-menu.html`, the analogue of `nr-topic-menu.html`.
  The report page cannot be a fork of `nr-report.html` without it, and both the report page and the
  category index render it.
- The **empty state renders server-side**, in `ndhr-report.html`, rather than in Task 7's JS as
  the plan assigns it. It is five lines of template, it works with JS off, and a category that
  renders nothing is the exact thing the state exists to distinguish from a template bug. Task 7
  inherits nothing here.

**Four departures from `nr-report.html`, each because of what the data carries:**

- **No ZIP list.** `cdlist.json` has none; community districts are not ZIP-based.
- **Five demographic rows, not eight.** Population, Over 65 and Under 18 are null on all 59 rows,
  which "Task 2 as built" records, so rendering them would give every page three permanently blank
  cells. Restoring them is three `<tr>` once those indicators exist at CD.
- **One indicator container, not one per subsection.** The NDHR content YAML has no `report_topics`
  layer, so there is no second heading level to render.
- **No `nr-report-footer-sm` analogue.** `data/globals/NR_footer/` has no NDHR equivalent — that
  content is the per-indicator strategies column, which is Task 8.

**The map geometry comes from EHDP-data, which is the decision this task left open.**
`geography/CD.geojson` at the environment's own `data_branch`, not a copy in `static/geojson/`
where NR keeps `UHF42.geojson`. Three reasons, in order of weight: the data repository generates
and owns that file, its `geography/` directory carrying the R scripts that build it; fetching it at
`data_branch` makes the geometry move with the data the page already fetches at `data_branch`; and
a copy here would be 162 KB that nothing in this repo updates. It joins `cdlist.json` exactly —
59 features, `GEOCODE` matching `CD_id` and `GEONAME` matching `CD_name` on all 59, where
`UHF42.geojson`'s `GEONAME` disagrees with `uhflist`'s `UHF_name` on 6 of 42 `[verified 2026-09-11
against the production branch; byte-identical on staging]`.

**No picker map on the district index or the category index**, where their NR counterparts have
one. That map is `nr-leaflet.html`, 370 lines, whose CD analogue is in no task's file list; both
pages list their destinations as server-rendered links instead, which is what a crawler and a
keyboard user need either way. Adding the partial later is an addition, not a rewrite.

**A number that moves and is fully explained: the build's alias count falls 423 to 363.** The 60
are `ndhr/<cd>/page/1/` and `ndhr/page/1/` — paginator redirects `_default/list.html` emitted while
these 60 pages had no layout of their own. `ndhr-cd-index.html` and `section.html` do not
paginate, so the aliases stop being written `[verified 2026-09-11: alias-file sets diffed between
the two builds — 60 removed, all under /ndhr/, 0 added]`.

**One gap this task surfaced for Task 7 — since closed, and the diagnosis was wrong.**
`buildRows` reads `units` off each measure row; "Task 4 as built" recorded it as a field the
content YAML supplies, no `data/globals/NDHR_content/` file carries one, and the conclusion drawn
was that Task 3 owed 18 hand-written strings. Metadata's `DisplayType` is the field, so
`normalize.js` reads it directly and Task 3 owes nothing. The correction, and the parity re-run
that proves it across every NR measure rather than the 10 it was found on, are under "Task 4 as
built".

---

## Task 7: Renderers, and labelling the geography

**Files:**
- Create `assets/js/ndhr-report/` — `global.js`, `url.js`, `tertiles.js`, `demographics.js`,
  `cards.js`, `report.js`, `chart.js`, `map.js`, `data.js`, `app.js`, forked from
  `assets/js/nr-report/`
- Edit `eslint.config.mjs` — add an `NDHR_DIR` constant beside `NR_DIR` at line 17, and a config
  block mirroring the `assets/js/nr-report/**/*.js` block at line 97
- Edit `package.json` line 15 — `"lint": "eslint assets/js/data-explorer assets/js/nr-report assets/js/ndhr-report"`

**Interfaces:**
- Consumes: `NDHR_REPORT_CONFIG` (Task 6), `buildRows` from `report-data/normalize.js` (Task 4),
  the `communityDistricts` global (Task 2).
- Produces: the rendered accordion. Task 8 adds a column to `cards.js`'s output.

`data.js` is the only file that differs structurally from its NR counterpart: it calls
`buildRows` instead of fetching precomputed sections. Everything else is a rename pass.

`demographics.js` drops the ZIP list per Task 2 and reads `communityDistricts` instead of
`neighborhoods`.

**Each card states its geography where it is not CD.** HVI and public bathrooms are CDTA2020
values shown on a CD page, and DECIDED-2 records that the polygons are not identical. The three
PUMA2020 rows — 2185, 45, 107 — use the same affordance, naming the wider area the value covers.

**The sidebar needs a label too, and this is the part that is easy to miss.** Two different merge
patterns coexist on three Manhattan pages, and both are correct. The demographic sidebar is
CD-level ACS, which reports Manhattan CD4 and CD5 as one area; the PUMA2020 rows report CD5 and
CD6 as one area `[verified 2026-09-11: sidebar groups measured from the five demographic
indicators in "Task 2 as built", PUMA groups read from puma2020_to_cd.csv]`. So on the Manhattan
CD5 page every sidebar figure equals CD4's while every PUMA row equals CD6's.

Labelling only the indicator rows is worse than labelling neither: it tells the reader that
shared values are marked, which makes the unmarked shared sidebar read as a bug. `cdlist.json`
carries what the sidebar label needs — the CDs sharing a `PUMA2010_id` are exactly the sidebar's
merge groups, which is why that column is emitted despite the report reading `PUMA2020_id`.

The four sidebar groups and the four PUMA2020 groups agree on the two Bronx pairs and on
Manhattan CD1+CD2; they differ only on Manhattan CD4, CD5 and CD6. **Those three pages are the
render check**, not a sample of one.

**Adding a file to `eslint.config.mjs` does not put it in scope.** The `lint` script's argument
list selects the files, and the two must change together. Prove the directory scan actually
loaded with a positive control: call a name declared in another file of the same directory and
confirm lint still passes.

**Verification rung:** `npm run lint`, then `npm run smoke` with one NDHR page added to `PAGES`
(Task 9 adds the rest). Lint proves no undefined names; smoke is the only check here that runs
the site's JavaScript and fails on a console error.

---

### Task 7 as built `[eae618a844]`

**All 295 report pages render their rows.** `npm run lint` exits 0 over the new directory, with
an injected undefined name exiting 1 and the restore exiting 0 again; an isolated `development`
build exits 0 and every one of the 295 carries exactly ten `ndhr-report` scripts plus
`normalize.js`; `npm run smoke` passes **34 pages clean** with `ndhr/midtown/housing/` added to
`PAGES`.

**The lint block's scan is proved loaded, not assumed.** `report.js` calls six names declared
across the other five files — `buildIndicatorCard` (cards), `renderDemographics` (demographics),
`setDistrictInURL` (url), `updateAccordionToggle` (app), `geoIdsForDistrict` (global),
`loadDistrictRows` (data) — and none is a browser global, so an empty scan would have failed all
six. The injection control above proves `no-undef` fires in this block at all.

**Two files are not the rename pass this task predicted.**

`data.js` calls `buildRows`, which the task does say. What it does not say is that `buildRows`
returns the current district's row and its rank and **not** the other 58 areas' values — which the
choropleth needs. `buildIndicatorSeries` derives them from the same indicator files `buildRows`
already fetched; `normalize.js` caches by URL, so the second read costs no network. It was put
here rather than into `buildRows` because `scripts/report-data-parity.mjs` pins that function
against the published NR payloads, and widening its return shape would mean widening that
comparison to fields the payloads do not carry.

`chart.js` is the one this task calls a rename, and it is the larger change of the two. NR's chart
reads one precomputed viz table holding every indicator across every neighborhood; there is no
such table here.

**The Arquero replacements, site by site.** NR calls it at **seven sites across three files**, all
downstream of the single `aq.loadJSON` that makes its viz payload a table. The page no longer
loads `lib-arquero` at all.

| NR site | What it does there | What NDHR does instead |
|---|---|---|
| `nr-report/data.js:220` | `aq.loadJSON(reportConfig.vizUrl, …)` — the viz payload arrives *as* a table, which is what makes the dependency structural rather than incidental | Nothing. There is no viz payload: `buildRows` returns plain row objects |
| `nr-report/chart.js:246` | `.filter(aq.escape(d => d.indicator_data_name === indicatorName))` | `indicatorSeries[measureId]` — the series is keyed by MeasureID when it is built, so there is nothing to filter at render time |
| `nr-report/chart.js:250` | `.orderby('neighborhood', aq.desc('end_date'))` then `.slice(0, 1)` — the latest row per neighborhood | Already done upstream: `reportDataLatestPeriod` in `normalize.js` picks the period before any row is built, and `buildIndicatorSeries` filters on that one `TimePeriodID` |
| `nr-report/chart.js:253` | `op.parse_float` over the value column | `reportDataNumericValue`, the same helper `buildRows` uses, applied per row in the `.map()` |
| `nr-report/chart.js:255` | `.select(aq.not('end_date'))` | The `.map()` emits three fields, so there is nothing to drop |
| `nr-report/app.js:22` | `.select(aq.not('report_id', 'indicator_id', …))` — five columns dropped from the export | `CSV_COLUMNS`, an explicit 12-name list in `app.js`. A public export is the thing worth being explicit about, and an allow-list cannot leak a field a future row gains |
| `nr-report/app.js:23` | `.filter(aq.escape(d => d.neighborhood === currentNeighborhood))` | Nothing. `indicatorRows` already holds exactly the current district's rows |

`[verified 2026-09-12: 7 call sites in assets/js/nr-report/, 0 in assets/js/ndhr-report/ and
assets/js/report-data/normalize.js — the NR count is the control that the pattern matches a real
call, without which the zero describes only the search]`.

**Both merge patterns are labelled, and the three Manhattan pages prove they cross.** The sidebar
is CD-level ACS, which merges CD4 with CD5; the PUMA2020 rows merge CD5 with CD6. Measured in the
browser on a `dev_stage` server:

| Page | Sidebar poverty / rent-burden | PUMA rows (measure=geoid) | Sidebar note |
|---|---|---|---|
| Clinton and Chelsea (CD4) | 12.3% / 39.0% | `86=4104`, `245=4104` | names CD5 |
| Midtown (CD5) | 12.3% / 39.0% | `86=4165`, `245=4165` | names CD4 |
| Stuyvesant Town and Turtle Bay (CD6) | 7.9% / 41.2% | `86=4165`, `245=4165` | none, correctly |

So CD4 and CD5 share a sidebar while differing on PUMA, and CD5 and CD6 share PUMA while differing
on the sidebar. Labelling only the indicator rows would have told a reader that shared values are
marked, which makes the unmarked shared sidebar read as a bug rather than as the same situation.

The sidebar's merge groups were re-derived rather than taken from the plan: grouping the 59 cdlist
rows by their five demographic values gives `101,102 / 104,105 / 201,202 / 203,206`, exactly the
PUMA2010 groups, where the PUMA2020 groups read `101,102 / 105,106 / 201,202 / 203,206`
`[verified 2026-09-11; the demographic values are computed without reference to the crosswalk, so
this is a control and not a restatement]`.

**The map rung Task 6 deferred to here, all of it.** A click rewrote the address bar
`ndhr/midtown/housing/` -> `ndhr/financial_district/housing/`, the header followed, all 6 cards
rebuilt, 0 pageerrors through the switch. 59 polygons carry `role="button"` and a name. An
accordion expand rendered an SVG chart with a `role="graphics-document"` node named "Crowding
across all NYC community districts".

**One thing that rung does NOT establish: tab-order membership.** The polygon reported
`focused: true` after a programmatic `.focus()` and carries no `tabindex` attribute, and an SVG
`<path>` is not tabbable by default. `nr-report/map.js` asserts its 42 polygons were already in
the tab order through Leaflet's own container handling; that mechanism is inherited here unchanged
and **was not verified** — a `.focus()` call cannot tell the two apart. Task 9's accessibility
work is where that gets a real tab sweep.

**Three departures worth a decision rather than a default.**

- **Row order.** Rendered in the order `NDHR_content` lists the measures, because that order was
  authored from the NDHR source documents. NR sorts by `data_value_rank` descending, having no
  authored order to preserve. One line in `report.js`.
- **The CSV export is hand-written** against an explicit column list rather than Arquero's
  `toCSV()`. This is what let the library go.
- **`lib-arquero` removed from the layout.** Task 6 included it with a comment naming `data.js` as
  the consumer; `data.js` does not call it and neither does anything else on the page.

**Files this task changed beyond its own list:** `themes/dohmh/layouts/ndhr/ndhr-report.html` (the
ten script tags, `normalize.js` ahead of them, the sidebar note element, `lib-arquero` removed),
`assets/scss/_custom.scss` (`.ndhr-map-container` beside `.nr-map-container`), and
`scripts/smoke-pages.mjs` (the one NDHR entry this task's rung asks for).

**`normalize.js` had never been loaded by any template before this.** Checked before adding the
tag: a second load would redeclare its top-level `const`s and kill every script on the page.

---

## Task 8: Strategies column

**Unblocked 2026-09-11, and narrowed.** The contact form is deferred by DECIDED-9, so this task
builds the strategies column only and the page carries no contact affordance — not a disabled
one, which would advertise a feature that does not exist. The three PUMA2020 indicators
kept by DECIDED-10 each need `strategy` text like every other row.

**Files:**
- Edit `assets/js/ndhr-report/cards.js` — render `strategy` and `strategy_description` from the
  content YAML
- Edit `themes/dohmh/layouts/ndhr/ndhr-report.html` — the contact block in the left column

**Interfaces:**
- Consumes: `NDHR_content` strategy fields (Task 3), the card markup from Task 7.
- Produces: the finished report row.

The screenshot places the strategies column where the NR page's tertile pill sits, at the right
edge of each indicator row. The pill and the strategy are different things and the page needs
both — the pill is the comparison verdict, the strategy is the intervention. Resolve that
collision at design time rather than by stacking them and seeing what happens.

**Verification rung:** browser, print-emulated as well as on screen. `.print-only` is
`display:none` normally and `display:flex` in print, hand-rolled in `_custom.scss` because
Bootstrap's own `_print.scss` is not imported. Read `document.body.innerText` under print
emulation — it respects `display:none` and is therefore what print actually shows.

### Task 8 as built `[c2209d3f63]`

Three files, 167 insertions: `assets/js/ndhr-report/cards.js`, `assets/scss/_custom.scss`,
`themes/dohmh/layouts/ndhr/ndhr-report.html`.

**The pill/strategy collision is resolved by the DOM, not by the grid.** The strategy cell sits
**inside `.card-header` and outside the `<button>`**. The pill keeps its place in the button's
three-column row as the comparison verdict; the strategy is editorial prose and does not belong in
a control's accessible name, which already runs short name, long name, value, units and the
tertile sentence together. The accessibility tree shows the split directly:

```
- button "Crowding Household crowding, 2015-19 4.7 Percent Lower than most community districts"
- text:  Strategy Create shared housing to alleviate housing shortage
```

**The cost of the split, stated because it is a real loss:** the right quarter of the header no
longer expands the panel on click. That is the correct trade for text a reader may want to select,
and for a field that would carry a link if DECIDED-9's contact route ever lands.

**`textContent` cannot answer this question and reported the opposite.** The first probe read
`textContent` on each button and found the strategy in it, which reads as a failure. `textContent`
includes `display:none` content and `.print-only` is `display:none` on screen, so it was counting
the print rendition. The reading that settles it is the accessibility tree, cross-checked against
`innerText` — the method `scripts/nr-a11y-audit.mjs`'s `probeHeadings` already uses, and for the
same reason.

**The row-height cost was measured and accepted.** Measured at 1280px against the counterfactual
of the same list with no strategy column — each button's own height plus `.card-header`'s 0.5rem
top and bottom padding:

| Category | rows | collapsed list | buttons alone | ratio |
|---|---|---|---|---|
| Health Outcomes & Care Access | 3 | 687px | 276px | **2.49×** |
| Neighborhood Conditions | 6 | 1234px | 531px | 2.32× |
| Housing | 6 | 1094px | 531px | 2.06× |
| Climate & Active Design | 3 | 407px | 255px | 1.60× |

The strategy sets the row height on every category except Climate — the cell is 165px wide and
100–240px tall against buttons of 55–97px. Health Outcomes is the worst case rather than
Neighborhood Conditions: its three rows carry two of the three longest phrases with only three
buttons to amortize them. Across all 18 measures the phrases run 26–132 characters, median 93.

**The user's decision, 2026-09-12**: accept it. Two alternatives were costed and declined —
`col-md-4`/`col-md-8`, which widens the cell to ~220px at the indicator name's expense and is one
number in two places in `cards.js`; and a three-line clamp with the full phrase in the panel,
which hides content behind an expand the cell itself no longer triggers.

**`strategy_description` is in the panel, not the row.** These run to a sentence or two against a
165px cell. The phrase repeats as the block's lead-in rather than being referred back to, so the
block reads on its own when a reader expands one panel out of six. Evictions (1128) renders no
block at all: its YAML `strategy_description` is an explicit `null` with a TODO beside it — the
row appears in neither table of "Text of ..." — and an empty `<p>` would read as a rendering
fault. Measured: 5 of 6 Housing panels carry the block, 1128 does not.

**Print carries the phrase and not the description.** The print rendition inside the button goes
from three blocks at 50/25/25 to four at 35/15/25/25; the tertile column keeps its 25% because it
is a sentence and not a word. The description needs no print rule — `@media print` already hides
the collapse it sits in. Verified with all six panels expanded first, so the absence is the print
rule and not a collapsed panel.

**Read off `reportConfig.measures`, not off the row, and that is structural.**
`assets/js/report-data/normalize.js` is shared with Neighborhood Reports and
`scripts/report-data-parity.mjs` pins its output field by field against NR's published payloads,
which carry no strategy of their own. Adding one to `buildRows` would put a site-authored field
into the compute layer that harness exists to hold still. The template already emits the YAML rows
verbatim, so both strings reach the page with no template change and no row change.

**The divider is a rule, not a Bootstrap utility**, because it has to move: below md the cell
stacks under the button, where a `border-left` runs alongside nothing. Bootstrap 4 has no
responsive border utilities. `$gray-300` is Bootstrap's own `$border-color` default, which is what
the `.border-*` utilities beside it paint. Verified by computed style at both widths — at 1280px
`border-left: 1px solid rgb(222,226,230)` with no top border and the cell top equal to the button
top; at 500px the reverse, with the cell 55px below the button.

**No contact affordance**, per DECIDED-9, with the reason written into the template at the point
the screenshot's "Population Demographic and Contact Information" annotation points — so a reader
comparing the two finds the decision where they look for the missing half, rather than in this
document.

**Two things deliberately not done.**

- **The CSV export keeps its 12 data columns.** A 13th would repeat one editorial sentence on
  every row of every district's download; the strategy is constant across all 59 districts, where
  everything else in the file varies by district. Reversing it costs one entry in `CSV_COLUMNS`
  plus a special case in `downloadCSV`'s `map`, since `indicatorRows` does not carry the field.
- **`normalize.js` is untouched**, per the paragraph above.

**One stale paragraph removed on the way past.** `ndhr-report.html`'s header comment said the ten
report modules were not loaded yet and named Task 7 as what would land them. They landed in
`eae618a844`; the file's own foot has loaded them since.

---

## Task 9: Guardrails

**Files:**
- Edit `scripts/smoke-pages.mjs` — add four `PAGES` entries, one per NDHR page kind, each with a
  comment naming the template that renders it, matching the NR entries at lines 61-65
- Re-capture `scripts/site-characterization-baseline/staging/` and `.../prod_prod/`
- ~~Re-capture `scripts/pagefind-characterization-baseline/`~~ — **added 2026-09-11, closed
  2026-09-12 without a re-capture.** Task 6's browser rung measured the index moving 202 pages to
  267 and the ranking moving with it on queries that have nothing to do with NDHR. The response
  chosen was to take the section out of the index, so the committed baseline still describes the
  site and `--check` exits 0. What landed instead: a page-level `data-pagefind-ignore="all"` on
  all four NDHR layouts, and four `absent: true` controls in the harness
- Create `scripts/ndhr-characterization.mjs`, modelled on `scripts/nr-characterization.mjs`

**Interfaces:**
- Consumes: everything above.
- Produces: the checks that catch an NDHR regression.

Adding roughly 300 pages moves the site characterization baselines on every environment, so both
committed baselines need re-capturing. Read the `--check` diff before re-baselining, never
instead — that ordering is what tells you the new pages are the whole difference and nothing else
moved.

`ndhr-characterization.mjs` files baselines per EHDP-data branch for the same reason its NR
sibling does: staging and production carry different indicator data, so a single baseline fails
on whichever branch it was not captured against.

**Verification rung:** the full ladder, because this is the task that establishes what every
later change is checked against. `npm run lint`, `npm run smoke:all`, then
`npm run characterize:site` and read its diff before `npm run characterize:site:baseline`.
Record the commit hash beside each result — a green check is a fact about a commit, not about a
branch.

---

## Task 10: District typeahead on the landing and category pages

**Added 2026-09-12, at the user's instruction, after an NR/NDHR divergence audit found it
absent.** It was never scoped: this plan mentions a picker three times and all three are
asides — §"Two crossing merge patterns" notes in passing that an NDHR typeahead would need its
own `searchIn` list, and "Task 6 as built" records the absence after the fact. Both layouts
give the reason as "not in Task 6's file list", which is scope rather than rationale, and then
offer a justification ("server-rendered links are what a crawler and a keyboard user need")
that does not answer it — NR has the links **and** the picker.

**The precedent is decisive and it points the other way.** The Option D swap dropped exactly
this from the NR topic index, and `documents/nr-topic-index-picker-restore-2026-08-09.md` exists
because the user set the scope in session to put it back: "restore the map *and* the
flexdatalist, keep the 42-neighborhood link list but collapse it. Work exactly like the old
version, implementation is a looser requirement." NDHR currently reproduces the pre-restore
state, with 59 items to scan rather than 42.

**This is the cheap half of the picker work and is independently shippable.** It needs no new
geometry, no new partial, and no Leaflet.

**Files:**
- Edit `themes/dohmh/layouts/ndhr/section.html` — typeahead above the district list
- Edit `themes/dohmh/layouts/ndhr/ndhr-category-index.html` — the same, linking to that
  category's report for the chosen district
- Possibly a shared partial rather than two copies; `nr-neighborhood-picker-js.html` is the
  model, and the NR work that extracted its two duplicated copies into shared partials is
  `documents/nr-neighborhood-picker-options-2026-08-09.md`

**Interfaces:**
- Consumes: the `communityDistricts` global from `lib-cdlist.html` (59 rows), which neither page
  currently loads — check before assuming, since `section.html` renders its list from
  `site.Data.globals.cdlist` at build time and needs no JS global today.
- Produces: a district chooser that does not require scanning 59 names.

**`searchIn` is the one substantive difference from the NR original.**
`nr-neighborhood-picker-js.html` searches `UHF_name` and `Zipcodes`. A community district has
neither: `cdlist.json` carries `CD_name` and no ZIP list at all, because community districts are
not ZIP-based. So the field list is a swap, not an addition — and there is no ZIP fallback, which
means a reader who knows only their ZIP cannot use this. Say so or solve it; do not leave it
implied.

**flexdatalist has no `lib-*` partial** — the four templates that use it load it themselves
(project `CLAUDE.md`, "Library loading"). A fifth and sixth caller here is the existing pattern,
not a new one, but it is worth asking whether that is the moment to write the partial.

**Verification rung:** browser. Type a partial district name and assert the option list narrows
to the right rows and the chosen link resolves to a real page — `npm run smoke` will not catch a
typeahead that silently matches nothing, because matching nothing throws no console error. The
NDHR characterization harness does not cover these two page kinds; extending it is optional here
and is the cheaper alternative to a bespoke test.

### Task 10 as built

**Two partials, not two copies.** `themes/dohmh/layouts/partials/ndhr-district-picker.html` is
markup only — label, search box, Clear button, and one sentence saying what is searchable.
`themes/dohmh/layouts/partials/ndhr-district-picker-js.html` loads flexdatalist and wires it, and
goes in the caller's `js_bot` block beside `lib-cdlist.html`. Each caller defines
`ndhrPickerDestination()`: `''` on the landing page, the category slug on a category index. That
is the same split `nr-neighborhood-picker.html` / `-js.html` uses, and for the same reason — the
destination is the one thing the two callers disagree on.

**Three departures from the NR original, each deliberate.**

- **No heading in the partial.** The NR one carries `Choose Neighborhood` because its two callers
  had drifted to two different introductions. Both NDHR callers already render one identical
  `Choose a community district` heading above their district list, so the picker sits under it.
- **The combobox ARIA work is included, not copied.** `nr-neighborhood-picker-js.html` holds its
  own inline `wireComboboxState`; `partials/flexdatalist-combobox-js.html` is the same function,
  already shared by `de-text-search`, `aqe.js` and `hvi.js` and deriving its results-list id from
  the input rather than hardcoding `flex_search`. A sixth copy was not worth writing. The two must
  never load on one page — two declarations of one name in the shared classic-script scope is a
  `SyntaxError`.
- **`searchIn` is `["CD_name", "borough"]`.** A swap for the NR original's
  `["UHF_name", "Zipcodes"]`, not an addition: `cdlist.json` has no ZIP field, per this plan's
  Task 2. `borough` earns its place because district names do not carry one and five districts are
  called `Community Board 3`.

**The ZIP gap is stated rather than implied, per this task's own instruction.** The placeholder
reads `Search district or borough name`, and the partial renders one line under the box:
"Community districts are not based on ZIP codes, so this searches district and borough names only.
The full list is below." Typing `11216` returns flexdatalist's own "No results found", so a reader
who tries it is told, not left guessing.

**`id="flex_search"` is the site-wide convention and is load-bearing.** flexdatalist derives its
wrapper class from the authored id, and `assets/scss/__portal-custom.scss:1281-1286` styles the
placeholder through `.flex_search-flexdatalist`. All four pre-existing call sites use it and no
page carries two.

**Six pages, not eight.** The landing page and the five category indexes. The 59 district indexes
were not in this task's scope and did not get one.

**Verification.** Isolated `development` build exit 0; the picker markup on exactly **6 of 360**
NDHR pages, `cdlist-data` and the two flexdatalist assets on the same 6, **0** pages with a
duplicate `wireComboboxState` and **0** loading an NR partial; the five category pages each
render their own slug in `ndhrPickerDestination()`. Browser on a `dev_stage` server, both page
kinds: HTTP 200 and **0 console errors**; the generated input carries `role="combobox"` and
`aria-labelledby="ndhr-search-label"`; `communityDistricts` 59; `bedford` narrows to 2 rows,
`Bronx` to all 12 Bronx districts, `11216` and `zzqqxx` to none; Escape dismisses the list and
`aria-expanded` returns to `false`; selecting a row lands on
`/ndhr/kingsbridge_heights_and_bedford/` from the landing page and
`.../housing/` from the category page, each rendering the expected `h1`. `npm run lint` 0,
`npm run docs-check` 0, `npm run smoke` 38 pages clean.

**One characterization field moved for a reason worth recording: `controls.noAccessibleName`
0 -> 1 on all six pages.** flexdatalist re-points the authored input's `<label for>` at the
generated one (`node_modules/jquery-flexdatalist/jquery.flexdatalist.js:403`), leaving the
authored `#flex_search` unlabelled; `site-characterization.mjs` walks the DOM rather than the
accessibility tree, so it counts it. **That node is unreachable** — `position: absolute` at
x -13700, y -12689, `tabIndex -1`, and Tab from the generated input goes straight to `#clear`
`[verified 2026-09-12]`. The same is true on `/neighborhood-reports/`, whose committed baseline
already records `noAccessibleName: 1`, so this is the shared flexdatalist pattern arriving on six
more pages rather than a new defect. The finding is written into
`ndhr-district-picker-js.html`'s own comment so the next reader does not re-diagnose it. Both
committed site-characterization baselines were re-captured after reading the `--check` diff, not
instead of it.

---

## Task 11: Community district picker map

**Added 2026-09-12, same audit as Task 10.** The expensive half, and genuinely new work rather
than an include.

**`nr-leaflet.html` cannot be reused.** It is hard-bound to UHF42: it fetches
`geojson/UHF42.geojson` at line 45 and holds it in a `uhf_geojson` binding used throughout
`[verified 2026-09-12]`. A CD counterpart is a new partial.

**The script-collision argument does NOT block this, and an earlier note in this plan implied it
did.** `nr-leaflet.html` and `assets/js/ndhr-report/map.js` do share four top-level names
(`highlightFeature`, `onEachFeature`, `resetHighlight`, `selectNeighborhood`), and two
declarations of one name in a shared classic-script scope is a `SyntaxError` that kills every
script on the page. But that only bites on a page loading both, and none of the three non-report
NDHR layouts loads any `ndhr-report` module — `grep -c "ndhr-report/"` returns **0** on
`section.html`, `ndhr-category-index.html` and `ndhr-cd-index.html` `[verified 2026-09-12]`. The
collision is a real constraint on the *report* page and nowhere else. A new `ndhr-leaflet.html`
should still pick distinct names, so that it and `map.js` could coexist later.

**Use `geography/CD.topo.json`, not `CD.geojson`** — the user's instruction, and the measurement
supports it:

| source | raw bytes | over the wire |
|---|---|---|
| `geography/CD.geojson` (what `map.js` fetches today) | 162,386 | 46,926 |
| `geography/CD.topo.json` | 34,421 | 11,732 |
| `topojson-client.min.js` (already a dependency) | 7,169 | 2,604 |
| **topojson route, total** | **41,590 — a 120,796 byte saving, 74%** | **14,336 — a 32,590 byte saving, 69%** |

**The wire column is the one to quote.** An earlier version of this table had only the raw
column, and a raw-byte comparison overstates what a visitor pays: raw.githubusercontent.com
serves these files gzipped, and topojson's win is partly redundancy that gzip also finds.
The saving is real either way — 69% rather than 74% — but it is 32,590 bytes, not 120,796.

`[all verified 2026-09-12: `urllib` with `Accept-Encoding: gzip` against the production data
branch, reading the compressed body length and the `Content-Encoding` header; `topojson-client`
gzipped locally at level 6, since Hugo serves it as a fingerprinted local asset]`

It carries everything a picker needs: `type: "Topology"`, one object named `collection`, **59
geometries**, and `id` / `GEOCODE` / `GEONAME` present on all 59. `GEOCODE` matches `cdlist.json`'s
`CD_id` on **59 of 59** and `GEONAME` matches `CD_name` on **59 of 59**, with no unmatched codes
`[verified 2026-09-12]` — the same clean join the plan already recorded for `CD.geojson`, and
better than `UHF42.geojson`, whose `GEONAME` disagrees with `uhflist` on 6 of 42.

**Leaflet needs GeoJSON, so this costs one conversion.** `topojson.feature(topo,
topo.objects.collection)` from `topojson-client`, which is already in `package.json` and already
bundled by `themes/dohmh/layouts/data-features/heatstory.html` via `resources.Concat`. Every other
topojson consumer in this repo — `data-explorer/map.js`, `minimum-wage-with-maps.html`,
`ndhr-report/chart.js` — uses **Vega's** built-in `format: {type: "topojson"}` and needs no
client, so heatstory is the only precedent for the Leaflet direction. There is no `lib-topojson`
partial; writing one is part of this task.

**Files:**
- New `themes/dohmh/layouts/partials/ndhr-leaflet.html` — the CD analogue, on `CD.topo.json`
- New `themes/dohmh/layouts/partials/lib-topojson.html`, or a justified reason to bundle instead
- Edit `themes/dohmh/layouts/ndhr/section.html`, `ndhr-category-index.html` and
  `ndhr-cd-index.html` to include it

**Interfaces:**
- Consumes: `geography/CD.topo.json` at the environment's own `data_branch`, and
  `communityDistricts` for the names.
- Produces: the map half of the picker.

**One decision this task surfaces and should not silently take.** `assets/js/ndhr-report/map.js`
fetches `CD.geojson` on all 295 report pages. If this task builds the topojson path anyway, moving
`map.js` onto it saves ~120 KB per report page — but that edits shipped Task 7 code that
`scripts/ndhr-characterization.mjs` now baselines, so it is a separate change with its own
verification, not a free rider. Decide it explicitly; do not fold it in.

**Verification rung:** browser. 59 named polygons, a click reaching the right URL, and keyboard
reachability — `map.js`'s own rung, which "Task 7 as built" records as **NOT** establishing
tab-order membership, only programmatic focus. Do not repeat that gap here: assert the polygons
are in the tab order, or say plainly that they are not.

### Task 11 as built

Two files new — `themes/dohmh/layouts/partials/ndhr-leaflet.html` and
`themes/dohmh/layouts/partials/lib-topojson.html` — and four edited: the three non-report NDHR
layouts and one SCSS rule.

**The map is on 65 of 360 NDHR pages and 0 of the 295 report pages.** The landing page, the five
category indexes and, unlike Task 10's typeahead, all 59 district indexes.

**It reuses `ndhrPickerDestination()` rather than taking a Hugo parameter.** That function was
Task 10's, read only by the typeahead; the map now reads the same one, so a page's two
affordances cannot disagree about where a selection lands — which is the defect class Task 10
existed to close, and a second mechanism would have reopened it. It is called on click, long
after every script has parsed, so the two callers can keep declaring it in `js_bot`. The 59
district indexes declare none and the partial falls back to the district index, which is what
those pages want.

**`lib-cdlist.html` moved from `js_bot` into `main` on the landing and category pages.** The map
reads `communityDistricts` from inside a `fetch` callback, and a callback can run between two
script blocks — so leaving the data partial at the page foot was a race rather than a
guaranteed win. The typeahead still sees the global: one shared classic-script scope. This is the
less obvious half of the placement rule `CLAUDE.md` already carried for `L.map()`.

**Everything in the partial is inside an IIFE, so it declares no top-level name.** The plan asked
for distinct names; an IIFE is strictly stronger, and it means this partial and
`assets/js/ndhr-report/map.js` could coexist on one page, which distinct names alone would only
make likely. Precedent for the form: `assets/js/site.js` and
`themes/dohmh/layouts/partials/render-accessible-table.html`.

**No `GEOCODE != 0` filter, unlike both existing implementations.** That filter is live on
`static/geojson/UHF42.geojson`, which carries 43 features of which one is GEOCODE 0;
geography/CD.topo.json carries 59 and none `[verified 2026-09-12]`. Copying it would have stated
something about this data that is not true.

**Correction to this task's own reading of the file.** It recorded `id` / `GEOCODE` / `GEONAME`
as "present on all 59". `GEOCODE` and `GEONAME` are, and `id` is a *property* alongside them,
not the top-level TopoJSON geometry `id` — 0 of 59 geometries carry one of those
`[verified 2026-09-12]`. Nothing in the build depends on it either way; `GEOCODE` is what the
join uses.

#### The keyboard answer, which the task asked for explicitly

**Stated plainly, because it differs by page kind, and the difference is the caller's wrapper and
nothing else.** The partial keys entirely off an `aria-hidden="true"` ancestor, exactly as
`nr-leaflet.html` does.

| page kind | wrapped in `aria-hidden` | polygons in the tab order |
|---|---|---|
| landing, 5 category indexes | yes | **no** — container and 65 of 65 candidate nodes carry `tabindex="-1"` |
| 59 district indexes | no | **yes** — 0 of 65 carry it, and a Tab sweep reaches them |

The picker pages carry the 59-link borough-grouped list directly beneath the map, which is its
text equivalent; a subtree hidden from the accessibility tree must hold no keyboard stops, or a
keyboard user tabs through positions a screen reader is told do not exist. The district indexes
carry no such list, so there the map has to stand on its own: 59 polygons with `role="button"`,
a district name, and Enter and Space bound.

**Tab-order membership was measured, not inferred.** Focus was placed on the last focusable
element before the map and Tab pressed eight times; stops 2 through 8 were polygons, named
Financial District (CD1) through Upper East Side (CD8) `[verified 2026-09-12]`. Task 7 recorded
that it had established only programmatic focus for the report page's map; this does not repeat
that gap. The picker pages' exclusion is proved by the attribute rather than by a sweep, with the
district index as the control showing the identical DOM is tabbable without it.

#### The fly-to was removed, and that is a divergence from the named exemplar

`nr-leaflet.html` calls `flyToBounds` on the located neighborhood. This partial does not: it
highlights the located district and fits the whole city on every page kind.

**The reason is measured.** With the fly-to in, the other 58 districts sit outside the map
viewport, and an un-forced Playwright click on Central Harlem from the Midtown page timed out on
its actionability check — while the identical click succeeded on the whole-city landing page,
and a click event dispatched directly on the same node navigated correctly. So the handler was
never the problem; the pointer could not reach the polygon `[verified 2026-09-12: four arms,
run before and after the change]`. NR can afford the zoom because its polygons answer no key and
its neighborhood index is not the page's navigation; these carry `role="button"` and answer
Enter, so every one of them has to stay reachable.

**This is a departure from Neighborhood Reports, which the user named as the basis for NDHR, so
it is flagged rather than buried.** Restoring NR's behaviour is a two-line change at the foot of
the partial, at the cost measured above.

The page copy on the 59 district indexes depends on this: "This district is highlighted below.
Select any other community district on the map to open its report." That sentence was written
first and was false under the fly-to, which is what prompted the measurement.

#### One decision deliberately NOT taken

`assets/js/ndhr-report/map.js` still fetches geography/CD.geojson on all 295 report pages. Moving
it onto the topology this task now loads would save ~32,590 gzipped bytes per report page, and
this task built everything it would need. It was left alone because it edits shipped Task 7 code
that `scripts/ndhr-characterization.mjs` baselines, so it carries its own verification.
**Put to the user 2026-09-12 with the three options and the measurement; deferred as a potential
future enhancement.** The status block above carries the edit surface and the re-verification it
would re-open, so a later session does not have to re-derive either.


---

## 4. Review findings, 2026-09-13

A review of the whole feature against its two source documents and the annotated screenshot, run
at `cd1bd9329f` with all six committed guardrails passing (`lint`, `docs-check`,
`ndhr:availability check`, `ndhr:cdlist check`, `report-data:parity all`,
`characterize:ndhr check` — all exit 0). Runtime findings were measured against a `development`
server on :8080, production data branch.

Tasks 12-16 below are its output, and the two halves of their evidence have different provenance.
**Every `file:line`, absence sweep and control in them was re-run at `cd1bd9329f` while these
tasks were written**, not carried across from the review's own text — one citation moved
(`tertiles.js` carries three strings, not the two a "than most" pattern finds) and the docx
extraction was redone, returning the same 26 `w:del` / 38 `w:ins`. **The browser measurements were
not re-run**: the zoom two-arm table in Task 12, the rendered card header in Task 13, and the
keyboard sweeps are the review session's own, on the same day and the same commit. A session
acting on Task 12 re-runs that measurement anyway, since it is the before-arm of the fix's proof.

**What the review did NOT find, recorded so a later session does not re-derive it.** `CD.geojson`
is 59 features, `GEOCODE` 0 absent, joining `cdlist.json` 59/59 with no orphan polygons, so the
`filter: GEOCODE != 0` in `map.js` is dead but harmless and there is no unknown-name fallback
path. No duplicate ids in any built NDHR page; `id="ndhr-accordion"` appears twice in
`ndhr-report.html` but in the two branches of one `if`. The four repeated "community-based peer
support services" strategies are the source document's own repetition, not a mis-mapping. There
is no sanitization on `indicator_description` and its siblings, which matches
`nr-report/cards.js` exactly — inherited, not a fork regression.

**Content fidelity checks out where it could be measured.** All 18 CD-renderable indicators from
the 28-row availability baseline are in the content YAML with none omitted; the category
assignment matches the authoritative "Text of…" document exactly, including its re-filing of food
access from Climate into Neighborhood Conditions; all 18 strategies trace to a source document
row. Mental Health renders its stated empty state server-side with map, sidebar and QR intact,
and the Manhattan double-merge DECIDED-10 flagged is handled and labelled.

**The three remaining gaps between the prototype and the documents are all recorded as decisions,
not defects**: the contact affordance (DECIDED-9), the three null demographic rows — population,
over-65, under-18, which EHDP-data publishes at no CD-level indicator, already a data-team ask —
and the indicator descriptions (DECIDED-11 / Task 15). The 10 dropped indicators each have a DECIDED
entry with a re-runnable check behind it.


## Task 12: The report map's viewport leaves most districts unclickable

**`global.js:26` calls the map "sole community district selector"** `[verified 2026-09-13]`, so
what a pointer can reach on it is what a pointer can reach in the whole page's navigation.

On first paint `data.js:114` calls `selectLayer(layer, true)`, and `map.js:71-77` flies the map to
that one layer's bounds when the second argument is truthy. `map.js:148` does it again on every
in-place district switch, so the map re-zooms after each selection `[all verified 2026-09-13:
lines read at `cd1bd9329f`]`.

Two arms on one page, one variable, run A -> B -> A so ordering cannot explain the result:

| | zoom | polygons an un-forced click can reach |
|---|---|---|
| A — as the page leaves it | 13.00 | **9 of 59** |
| B — same map fitted to all 59 | 9.00 | 55 of 59 |

An un-forced click on Central Harlem fails in arm A and succeeds in arm B. **A directly dispatched
click event navigates correctly in both**, which is the control that rules out the handler: it is
the viewport, not the listener.

`[verified 2026-09-13: two-arm measurement on `/ndhr/midtown/climate-and-active-design/` against a
`development` server on :8080, Playwright actionability check as the reachability test]`

**This is the same mechanism Task 11 diagnosed and deliberately left out of `ndhr-leaflet.html`.**
That task's as-built section records it as a finding about the picker map; the report map still
has it.

**It is inherited, not introduced.** The identical measurement on NR's report page returns 9 of 45
`[verified 2026-09-13]`. Fixing NDHR alone leaves `/neighborhood-reports/` as it is.

**The keyboard path is unaffected** — Tab reached 6 polygons in under 60 stops and Enter switched
the report correctly `[verified 2026-09-13]`. The defect is pointer-only, which is the unusual
direction and is why a keyboard-first accessibility pass did not surface it.

**Files:**
- Edit `assets/js/ndhr-report/data.js:114` and `assets/js/ndhr-report/map.js:148` — the two
  `selectLayer(layer, true)` call sites
- Possibly edit `assets/js/ndhr-report/map.js:71-77` — the `if (zoom && leafletMap)` block, if the
  fly-to stops having any caller
- `assets/js/nr-report/map.js` — only if the NR half is in scope; see below

**Interfaces:**
- Consumes: nothing new.
- Produces: a map whose selected district is styled but which stays fitted to all 59, matching what
  `ndhr-leaflet.html` already does on the picker pages.

**One scope decision this task must not take silently.** The same defect is on the NR report page,
which is not this branch's feature. Three options, and the user picks: fix NDHR only and file the
NR half; fix both here, which widens this branch's diff into NR code and re-opens NR's own
verification; or fix NDHR here and take NR as a follow-up commit on the same branch so one
site-characterization re-capture covers both.

**Verification rung:** browser, and nothing below it will do — this is a claim about pointer
hit-testing. Re-run the two-arm measurement above and expect arm A to read 55-of-59 after the fix,
with the selected-style assertion still passing so the fix did not simply stop selecting.
`npm run characterize:ndhr check` must also be re-run: the harness does not read zoom, but it does
read the report's rendered rows, and a broken selection path would move them.


### Task 12 as built `[999d986758]`

**Scope decided by the user 2026-09-13: fix NDHR here, file the NR half.** The NR finding is
`documents/site-wide-audit-2026-06-27.md` §18 — that branch's active findings log — and is not a
task in this plan. §18 excludes `themes/dohmh/layouts/partials/nr-leaflet.html` explicitly: it is
a picker whose polygons answer no key and whose 42-neighborhood list carries the navigation, so it
should keep its fly-to. Do not sweep both on a grep for `flyToBounds`.

**`selectLayer` lost the `zoom` argument rather than being passed `false`.** Both call sites
passed `true` and there was no third caller, so a dead parameter wrapping a `flyToBounds` is the
kind of thing a later session switches back on. The reasoning, and the measurement behind it, is
now a comment at the point of removal.

**The task predicted two edits and the fix needed three.** The plan's Files block named the two
call sites and the `if (zoom && leafletMap)` block. It did not name the map's *initial* framing,
and removing the fly-to alone would not have fixed anything: `map.js` opened with a fixed
`setView([40.7128, -74.006], 10)` — lower Manhattan at zoom 10 — which in this column's width cuts
off the outer boroughs. With the fly-to gone that view is the one every district is selected from,
so it had to become a `fitBounds` on the whole layer. `zoomSnap = 0` comes with it, for the reason
`ndhr-leaflet.html` already records: the default of 1 makes `fitBounds` round **down** to a whole
zoom level.

**The measurement, re-run on the fixed build with the removed behaviour re-applied by hand as arm
B.** One page, one variable, A -> B -> A so ordering cannot explain the result:

| arm | zoom | polygons an un-forced click can reach |
|---|---|---|
| A — as the page now leaves it | 9.58 | **57 of 59** |
| B — old fly-to re-applied | 13.78 | **5 of 59** |
| A — refitted to all 59 | 9.58 | **56 of 59** |

Two runs returned identical counts on all three arms. Arm B is the control that matters: it
reproduces the defect *on the fixed build*, so the mechanism is demonstrated rather than inferred
from the fix working.

`[verified 2026-09-13: `/ndhr/midtown/climate-and-active-design/` against a `dev_prod` server on
:8080, Playwright's own actionability check via a trial click as the reachability test. The served
`map.js` was read back and asserted to contain `fitBounds` and no `flyToBounds`, so the numbers
describe the new file and not a cached one]`

**Three things checked so the fix could not pass by breaking something else.** An un-forced click
on Central Harlem from the Midtown page navigates to
`/ndhr/central_harlem/climate-and-active-design/` with the `<h1>` rewritten; exactly **1** polygon
carries the selected style, so the fix did not simply stop selecting; and **59** polygons are
named.

**The one console error that is not Pagefind was chased rather than allowlisted.** The sweep
reported a bare `Failed to load resource: 404`, which this repo's own notes warn hides its cause.
It is `pagefind/pagefind-ui.js`, and it appears identically on `/ndhr/` and on
`/neighborhood-reports/` — a page this change does not touch — so it is the documented
dev-server noise and not something introduced `[verified 2026-09-13: response listener over three
page kinds]`.

**No `characterize:site` re-capture, and that is a checked claim rather than a judgment call.**
Its baselines record unhashed logical asset paths, so a JS content change moves no recorded field.
The full note is in the status block above, because Tasks 13-16 inherit it.


## Task 13: The tertile sentence names the wrong geography on five rows

**DECIDED-2's obligation, in Task 7's own words: "The page must say which geography each value came
from."** Two of the three renditions in a panel do. The tertile sentence does not.

`assets/js/ndhr-report/tertiles.js:80`, `:86` and `:92` hardcode `' than most community districts'`
and `' of community districts'`, and the file takes no geotype at all `[verified 2026-09-13: a
case-sensitive count of geotype/geoType/GeoType over tertiles.js returns 0; control — the same
count over chart.js in the same directory returns hits, so the pattern is not the reason]`. Five
of the eighteen rows are not ranked among community districts:

| row | ranked over | page says |
|---|---|---|
| Air conditioning (PUMA2020) | 35 PUMAs | "than most community districts" |
| Homes with 3+ problems (PUMA2020) | 35 PUMAs | "than most community districts" |
| Homes with cockroaches (PUMA2020) | 52 PUMAs | "than most community districts" |
| Heat vulnerability (CDTA2020) | 59 CDTAs | "than most community districts" |
| Public bathrooms (CDTA2020) | 59 CDTAs | "than most community districts" |

On `/ndhr/midtown/climate-and-active-design/` one card header reads, in sequence:
`Household air conditioning, 2023 | 95.6^^ | Percent (with AC) | PUMA area | Higher | Higher than
most community districts`. **The geography tag and the comparison claim contradict each other
inside one row**, and the screen-reader copy is the plain string `"Higher than most community
districts"`. The same phrase reaches the print rendition.

`[verified 2026-09-13: rendered card header read from a `development` server on :8080]`

**The fix already exists one file over.** `chart.js:23-28` declares `GEOTYPE_AREA_LABEL`, mapping
`CD` / `CDTA2020` / `PUMA2020` to "NYC community districts" / "…community district tabulation
areas" / "…public use microdata areas", and the chart's accessible name reads correctly as "across
all NYC public use microdata areas". The geography note under the panel is correct too.
`tertiles.js` is the one rendition that takes no parameter.

**Files:**
- Edit `assets/js/ndhr-report/tertiles.js:66-97` — `getTertileSentenceParts`, to take a geotype
- Edit its callers in `assets/js/ndhr-report/cards.js` to pass `row.geotype`
- Either read `GEOTYPE_AREA_LABEL` from `chart.js` or move it to `global.js` — classic scripts in
  one scope, so a second copy is a divergence risk, not a syntax error

**Interfaces:**
- Consumes: `row.geotype`, which `normalize.js` already emits and `cards.js` already renders as the
  geography tag.
- Produces: three tertile renditions that agree with the chart title and the geography note.

**Do NOT change the middle-tertile string without reading `:86`** — it is `' of community
districts'`, a different shape from the other two, so a blind find-and-replace on "than most"
misses it.

**Verification rung:** browser. Read the sr-only string, the expanded panel and the print-emulated
`document.body.innerText` on a page carrying all three geotypes —
`/ndhr/midtown/climate-and-active-design/` is the only category with CD, CDTA2020 and PUMA2020 rows
together, which is why `scripts/ndhr-characterization.mjs` already uses it as a target.
`npm run characterize:ndhr check` will go red on that target and the diff should be read before
re-baselining.


## Task 14: Two caveats the source attaches to the strategy column are absent

`documents/NDHR/Text of Neighborhood Development Health Report Tool for Revi.docx`, read with
tracked changes accepted, marks both strategy-table column headers with an asterisk and footnotes
them:

- `Strategy*` — "These examples serve as ideas to address the indicators of concern, they are not
  comprehensive or prescriptive"
- `Description*` — "Strategies may differ if you are a city agency, community organization, or
  private developer. Please consult with the Health Department for more details."

`[verified 2026-09-13: document XML with every w:del element dropped — 26 w:del and 38 w:ins runs,
matching the counts CLAUDE.md records; the two strings are at body paragraphs 109 and 111,
immediately under the `Strategy*` and `Description*` headers at 108 and 110]`

Neither string appears anywhere in `themes/`, `data/globals/NDHR_content/`, `content/ndhr/` or
`assets/js/` `[verified 2026-09-13: case-insensitive filename sweep on four distinct phrases from
the two caveats, all zero; positive control — "Increase presence of parks", a strategy that does
render, returns `data/globals/NDHR_content/climate_and_active_design.yml`]`.

So the page renders "Increase presence of parks or green spaces" to a reader who may be a private
developer, with no qualifier.

**DECIDED-9 does not cover this.** Only the second sentence of the second caveat depends on the
deferred contact route. "These examples serve as ideas… not comprehensive or prescriptive" is plain
text with no dependency, and "consult with the Health Department for more details" can stand
without a form.

**Files:**
- Edit `themes/dohmh/layouts/ndhr/ndhr-report.html` — a qualifier near the strategies column
  heading, or above the accordion
- Possibly edit `assets/js/ndhr-report/cards.js` if the text belongs in the expanded panel beside
  `strategy_description` rather than in the layout

**Interfaces:**
- Consumes: nothing. Static prose, owned by this repo like `strategy` and `strategy_description`.
- Produces: the disclosure the source document attaches to this column.

**Placement is the open question, not the wording.** The source puts them on column headers; the
page has no strategies column *header* — Task 8 put the strategy inside `.card-header` and its
description in the panel. So this needs a decision about where a per-column caveat goes when the
column has become a per-row cell. Ask before building.

**Verification rung:** browser, plus print. Both strings must reach `document.body.innerText` on
screen and under print emulation — Task 8's own rung, and the reason it matters here is that
`.print-only` and `d-print-none` are how that page carries its two renditions, so a caveat written
into one is absent from the other. `npm run characterize:ndhr check` reads the strategies column's
text, so it will go red on the two Housing targets by design.


## Task 15: Indicator descriptions

**Unblocked 2026-09-13 by DECIDED-11**: the source document's descriptions are the ones to
render, with EHDP-data's `IndicatorDescription` as the fallback for any row the document does not
cover.

**Files:**
- Edit `data/globals/NDHR_content/*.yml` — add a `description` key per measure, from the source
  document's second column
- Edit `content/ndhr/_content.gotmpl` and `themes/dohmh/layouts/ndhr/ndhr-report.html` — carry it
  into `NDHR_REPORT_CONFIG.measures` the way `indicator_short_name` and `strategy` already are
- Edit `assets/js/ndhr-report/cards.js:416` — prefer the authored key, falling back to
  `row.indicator_description`
- Edit `scripts/ndhr-indicator-availability.mjs` — the content validator, so a `description` on an
  unknown MeasureID fails `check` like every other field does

**Interfaces:**
- Consumes: the source document's `Description` column, 24 rows (this read 26 until 2026-09-14),
  of which 17 map to built rows.
- Produces: an authored description per row, with EHDP-data's as the fallback for any row the
  document does not cover.

**Leave `normalize.js` alone.** It is shared with a future NR migration and its
`indicator_description` must keep meaning "what EHDP-data says". The override belongs in the NDHR
renderer, not in the shared compute — that is DECIDED-5's line, and crossing it would make
`npm run report-data:parity all` a test of NDHR's content instead of a test of the compute.

**Verification rung:** browser for the rendered text, plus `npm run report-data:parity all`
expecting an unchanged **37,044 comparisons, 0 mismatched** — which is the proof that the override
stayed out of the shared module. `node scripts/ndhr-indicator-availability.mjs check` with one
injected bad `description` row must exit 1.

### Task 15 as built `[f0242eb371]`

**The task grew a second half the review did not scope: the card headline.** DECIDED-11 settled
the descriptions. On 2026-09-13 the user also chose EHDP-data's `IndicatorName` over the
site-authored `indicator_short_name` for the bold headline, having been shown the measured
comparison — three headlines run 47-55 characters against 8-12 before (537, 1196, 1250). An
override list for those three was the alternative and was declined. So `cards.js` now takes
`row.indicator_name`, live from metadata through `buildRows`, and **the content YAML supplies no
name to the JS at all**.

**The YAML keeps a copy, and the copy is validated rather than trusted.** `IndicatorName` — named
to match the `MeasureName` convention beside it — exists for exactly one reader:
`themes/dohmh/layouts/ndhr/ndhr-category-index.html` renders the indicator list server-side, where
Hugo cannot reach `metadata.json`. Two pages naming one indicator two ways is the failure that
makes, so `validateContent` in `scripts/ndhr-indicator-availability.mjs` now fails when the copy
disagrees with metadata. The `description` key is required even where its value is null, for the
reason a null exists at all: an absent key and a deliberate null are the same thing to the
renderer and different things to a person.

**17 of 18 rows carry a description.** Evictions (1128) appears in neither table of the source
document, so it carries an explicit null and falls back to EHDP-data's text. "Displacement Risk"
is the nearest document row; naming it would be a content judgment, so it was left alone.

**The override travels the strategy pair's path, not `normalize.js`'s** — a lookup off
`reportConfig.measures` in `cards.js`. That is what keeps DECIDED-5's line intact, and
`report-data:parity all` at an unchanged 37,044 comparisons is the proof rather than the
assumption.

**The document carries 24 descriptions, not the 26 §2 recorded.** The first extraction filtered
on a category list written by hand, which omitted "Health Outcomes and Care Access"; the count is
now derived from the document's own repetition. §2 is corrected in place and says it was wrong.

**The harness field `indicatorShortNames` is renamed `indicatorNames`, and its header comment was
false rather than merely stale** — it claimed the names were committed in this repo and therefore
immune to an EHDP-data refresh. That stopped being true the moment the headline moved to live
metadata, which is the same change that renamed the field.

**One smoke failure, not diagnosed.** `data-explorer/asthma/?id=2380` failed once and passed on
the immediate re-run, with no data-explorer file in the diff. The mechanism is not established;
it is the unexplained flake `CLAUDE.md` already records under Guardrails, not a finding of this
task.


## Task 16: Four defects with no reader-visible symptom yet

Grouped because each is a few lines and none needs a decision. Ordered by consequence.

**16a — `normalize.js` caches rejected promises.** `assets/js/report-data/normalize.js:46` writes
the promise into `reportDataFetchCache[url]` before it settles, and nothing ever deletes a key
`[verified 2026-09-13: `:38` declares the cache, `:42` returns a hit, `:46` writes, `:52` returns;
no delete anywhere in the file]`. So one transient failure on `metadata.json` is permanent for the
session. The report page re-runs `buildRows` on every district switch, so every later switch
resolves to the same rejection and `data.js:194` returns `{rows: [], series: {}}` from its catch
each time. **Read from the code path, not reproduced in a browser** — reproducing it needs a forced
network failure, which is this task's own first step.
Fix: delete the key in a `.catch` before re-throwing, so the next call retries.

**16b — `map.js:274` parses without checking the response.** It calls `res.json()` directly on the
branch geojson fetch, where `normalize.js:48` throws a named `HTTP <status> from <url>` for the
same class of fetch `[verified 2026-09-13]`. A 404 from a renamed EHDP-data file becomes a
`SyntaxError` in the catch rather than a named HTTP failure — and a renamed data file is exactly
what `smoke:env` exists to catch, so the diagnostic matters.

**16c — `vegaEmbed(...)` has no rejection handler.** `chart.js:224` opens a `.then()` that closes at
`:232` with no `.catch`, and the surrounding `try` cannot see an async rejection `[verified
2026-09-13]`. Identical at `assets/js/nr-report/chart.js:200`, so this is inherited; the NR half is
the same scope question Task 12 raises.

**16d — `data.js:136-143`'s comment describes a function it is not attached to.** It documents a
staleness guard keyed on district name and a re-render; `loadDistrictRows` at `:144-195` does
neither — it builds rows and returns them. Both behaviours are in `report.js:163-182`, inside the
`.then()` on `loadDistrictRows` `[verified 2026-09-13: both bodies read]`. The comment is accurate
about the system and misfiled, which is the kind that survives review.

**Also recorded, and deliberately NOT in this task:**

- **`nbr_data_note` is computed and rendered by nothing.** `normalize.js:424` emits it; zero
  references anywhere in `assets/js/` or `themes/` `[verified 2026-09-13; positive control —
  `indicator_description`, a sibling field of the same object, returns 3 consumers]`. Real pages
  show `N/A**` (Midtown, housing problems) and `95.6^^` (Midtown, air conditioning) with **no
  legend anywhere on the page** — there is no footnote block in `ndhr-report.html` or
  `nr-report.html` `[verified 2026-09-13: no template or module matches "coefficient of variation",
  "suppressed due to" or "interpreteted"]`. The explanatory text is already in the row, one field
  away. It is out of this task because rendering a footnote block is a layout decision with a print
  rendition, not a four-line fix — and it is inherited from NR, where the markers also reach the
  page.
- **Sequential fetches in `buildRows`.** `normalize.js:351` awaits one data file per measure inside
  the loop, so six indicators are six sequential round trips after the three parallel lookup files;
  `data.js:180-182` then awaits `buildIndicatorSeries` per row the same way. No timing was
  measured, so this is a shape observation and not a performance claim. Out of scope until someone
  measures a page load.
- **The CSV export carries no `strategy` column.** `app.js:16-29` lists twelve columns, all
  inherited from NR `[verified 2026-09-13]`. So the field that most distinguishes NDHR from NR is
  absent from its download. One line, but it changes an export format, so it wants the user's word
  rather than a quiet addition.

**Files:** `assets/js/report-data/normalize.js:46`, `assets/js/ndhr-report/map.js:274`,
`assets/js/ndhr-report/chart.js:224`, `assets/js/ndhr-report/data.js:136-143`.

**Interfaces:** none — all four are internal to modules Tasks 4 and 7 already built.

**Verification rung:** `npm run lint` for 16d, which is comment-only; browser for 16a and 16b, each
with a forced failure as its own positive control — block `metadata.json`, confirm the session is
permanently broken before the fix and recovers after, and point the geojson URL at a 404 and read
the error message. 16c needs a spec that makes `vegaEmbed` reject. A green
`npm run characterize:ndhr check` proves none of the four changed the happy path.
