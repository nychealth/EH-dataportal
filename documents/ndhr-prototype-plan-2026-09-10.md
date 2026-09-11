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
DECIDED-6 through DECIDED-9. **Nothing in this plan is blocked on a decision any more.**

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
`(CD n)` suffix and a borough, and parsing those joins the two sets **59 to 59 with no leftover
on either side** `[verified 2026-09-10: parsed (borough, CD number) out of all 59 CD and all 59
CDTA2020 rows of GeoLookup.json; 59 matched, CD-only set empty, CDTA-only set empty]`.

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

The NR report page is merged and shipped; this branch must not reshape it. The strategies column
and the contact form are NDHR-only. So `assets/js/ndhr-report/` forks the NR renderers.

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
| 2. `cdlist.json` | done, except the three ACS fields; **re-opened by DECIDED-6** for the PUMA crosswalk columns | `npm run ndhr:cdlist check` exits 0; 59 rows, `CDTA_id` non-null and distinct; isolated build emits the fingerprinted `cdlist-data` script; three build-path injections each exit 2 | `c3d03a2fbf` |
| 3. Category and content YAML | unblocked 2026-09-11; five categories, one of them empty | — | — |
| 4. Shared compute module | not started | — | — |
| 5. Content adapter and routing | unblocked 2026-09-11; 295 report pages, `ndhr` URL segment | — | — |
| 6. Report layout and CD Leaflet map | not started | — | — |
| 7. Renderers and geography labelling | not started | — | — |
| 8. Strategies column | unblocked 2026-09-11; contact form deferred by DECIDED-9 | — | — |
| 9. Guardrails | not started | — | — |

Next command: **Task 2's re-opened half** — add the PUMA crosswalk columns to `cdlist.json`,
since Tasks 4 and 7 both read them. Then Task 4. Nothing is blocked on a decision any more.
Re-run `npm run ndhr:availability check` and `npm run ndhr:cdlist check` before acting on
§2's table or on any demographic figure.

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

**Verification rung:** grep plus a build. Assert the file has 59 rows, that every `CDTA_id` is
non-null and distinct, and that a `hugo --environment development` build emits the fingerprinted
`cdlist-data` script. The crosswalk assertion is the one that matters — a null there means the
`(CD n)` parse failed on a name string.

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

The reason this looks like it ought to work is that it was meant to.
`EHDP-data/geography/create_TopoJSON.r:279-283` builds the CDTA2020 id by stripping the two-letter
borough prefix off DCP's `BX01` and concatenating `CountyFIPS` where `BoroCode` was intended, then
casting to integer — per the export code's author 2026-09-10, a mistake, possibly carried in from
borrowed code where FIPS was the right field. Under `BoroCode` the CDTA ids would equal the CD ids
exactly, 59 of 59, and the join this warns against would have been the intended one. The
three-digit Bronx ids are the tell: `as.integer` drops the two leading zeros of FIPS `005`.

**NTA2010 and NTA2020 carry the same mistake** — same four-line construction at
`create_TopoJSON.r:329` and `:381` — and NTA had no analogous geography to disagree with, which is
why only CDTA surfaced it. Their ids nest under CDTA's for the same reason, not by design, and
nothing consumes that nesting: no authored JS derives one geography's id from another's, and every
use of `properties.GEOCODE` is a within-geotype join between indicator data and that geotype's own
topojson `[verified 2026-09-10: grep over assets/js/data-explorer and assets/js/nr-report,
excluding minified vendor bundles]`.

**Correcting the ids is therefore cosmetic, and optional.** What it would buy is turning a silent
trap into a working convenience. If it is ever done, the geometry and the data must move together
or the CDTA choropleth matches nothing and draws unfilled — `CDTA2020.topo.json`,
`CDTA_2020.topo.json`, `GeoLookup.json`, `GeoLookup.csv` and the 33 indicators publishing
CDTA2020. **No site code changes**: every CDTA reference under `assets/`, `themes/` and `content/`
handles the geotype *name*, never an id value. One repo-local file would go stale rather than
break, since the proximity feature reads only its own bundled geojson:
`content/data-features/proximity/geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`.

**None of this reaches NDHR.** The crosswalk parses `(borough, CD number)` out of both `Name`
strings, which is correct under either id scheme and depends on no id convention at all
`[verified 2026-09-10: 59 of 59 matched, zero unparsed, zero leftover either side, pairs
spot-checked by name in all five boroughs]`. If the ids are ever corrected,
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

**Files:**
- **Blocked on EHDP-data**: `puma2010_to_subboro_cd.csv` and `puma2020_to_cd.csv` published
  under `geography/`, from `cgettings-EHDP-work/data/gis/`. Nothing here can start until they
  are there
- Edit `scripts/ndhr-build-cdlist.mjs` — fetch both from `data_repo` + `data_branch`, emit
  three new columns
- Regenerate `data/globals/cdlist.json` and `data/globals/cdlist-source.json`

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

**Verification rung:** the generator's own `check`, plus one assertion it does not have yet — the
set of CDs sharing a `PUMA2010_id` must equal the four groups measured from the demographic data
in "Task 2 as built" (Manhattan CD1/CD2, Manhattan CD4/CD5, Bronx CD1/CD2, Bronx CD3/CD6). That
is a cross-check of the crosswalk against data computed independently of it, and it is the only
thing here that would catch a vintage swap: under PUMA2020 the Manhattan group is CD5/CD6 and the
assertion fails `[verified 2026-09-11: the two CSVs merge different Manhattan pairs]`.

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

---

## Task 9: Guardrails

**Files:**
- Edit `scripts/smoke-pages.mjs` — add four `PAGES` entries, one per NDHR page kind, each with a
  comment naming the template that renders it, matching the NR entries at lines 61-65
- Re-capture `scripts/site-characterization-baseline/staging/` and `.../prod_prod/`
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
