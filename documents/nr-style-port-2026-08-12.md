# Porting the NR styles onto production's report system

**Status as of 2026-08-12: steps 1–9 all done, verified in a browser, and landed as `1ffd7a06a6`
… `d021d753e3` (see Completion). Nothing pending on this branch.** One item is owed to a
*different* branch:
`feature-MOD-Lab-NR-recode-refactor` inverts the good/bad verdict for reversed indicators (step 7),
which this port deliberately did not inherit.

Branch: `feature-improve-NR-styles`, branched from `production` at `a41bafdb95` with no changes of
its own before this work.

## What this is

`feature-MOD-Lab-NR-recode-refactor` carries a set of Neighborhood Reports styles the team wants on
production's report system: the print block, the comparison badge glyphs, the pill font sizes, the
`.comp-*` colour and weight, and the `$primary-dark` contrast fix. This ports them.

**It is a port, not a cherry-pick, and the reason is that the two branches render reports from
different markup.** The recode branch emits every indicator row from `assets/js/nr-topic-spa/cards.js`
into the Option D topic SPA. Production emits them from Hugo partials —
`themes/dohmh/layouts/partials/nr-indicator-new.html` and `nr-indicator-old.html`, under
`themes/dohmh/layouts/nr-output/`. The styles land on the same *class names* in both, which is what
makes the port tractable; nothing else about the two systems corresponds.

Three parts of the recode branch's SCSS delta are deliberately **out of scope**, because they style
partials that do not exist here: `.nr-selector-map`, the `.nr-list-toggle` collapse rules, and the
`.nr-flexdatalist` removal. All three belong to the shared neighborhood-picker partials introduced
by the Option D swap.

Note that `documents/` and `scripts/` are **not tracked on this branch's lineage** — both arrived
with the recode branch. This file creates `documents/`. The guardrail npm scripts CLAUDE.md
describes (`npm run lint`, `smoke`, `characterize:nr`) do not exist here, which is why step 5 is a
hand-written Playwright check rather than a harness run.

## Decisions taken before step 1

Asked and answered 2026-08-12:

- **Scope**: all three groups — the three named styles, the `$primary-dark` contrast fixes, and the
  `.comp-*` text colour and bold.
- **The `-sm` variants**: production has a second marker family, `.better-sm` / `.middle-sm` /
  `.worse-sm`, used in the full-sentence rows of `nr-indicator-new.html`. The recode branch has no
  equivalent. They get the same Font Awesome codepoints as the pills, so one report does not show
  emoji in the sentence rows and webfont glyphs in the pills beside them.
- **Rank 2**: no marker, matching the recode branch. `.comp-null::before` and `.middle-sm::before`
  are dropped rather than converted.

## Precondition verified before step 1

`themes/dohmh/layouts/partials/head.html:107-108` loads Font Awesome 6 as a **CSS webfont**
(`@fortawesome/fontawesome-free/css/all.min.css`), site-wide, and the line is byte-identical to the
recode branch's `[verified 2026-08-12: grep of head.html on both branches]`. This is the load-bearing
precondition for the whole port — a `::before` with `font-family: "Font Awesome 6 Free"` renders
nothing under the FA **JS SVG injector**, which is a delivery method this repo has used before.

## Steps

### Step 1 — `$primary-dark` variable — DONE 2026-08-12

**Files:** `assets/scss/_a-global-variables.scss`, `$primary-dark` immediately after `$primary`.

**Proof:** none on its own; an unused variable changes no output. Proven by step 3's build.

### Step 2 — `.comp-*` block and `.btn-light-green-bg` — DONE 2026-08-12

**Files:** `assets/scss/_custom.scss` — `$comp-bad-text` and the `.comp-good` / `.comp-bad` /
`.comp-null` rules, immediately above `.print-only`; `.btn-light-green-bg` further down.

**Proof:** step 5. Computed on a served report page: `.comp-good` `color: rgb(33, 136, 63)` with
`::before` `\f14a` in `"Font Awesome 6 Free"`; `.comp-bad` `color: rgb(122, 92, 0)` (`#7a5c00`) with
a `rgb(255, 193, 7)` (`$warning`) `\f071` glyph; both `font-weight: 700`.

### Step 3 — `theme.scss` — DONE 2026-08-12

**Files:** `assets/scss/theme.scss` — `.btn-report`; the `.better, .middle, .worse` block; the
`.worse` background; new glyph rules covering both marker families; new `@media print` block
immediately above the `// Report Modal` comment.

**Proof:** `hugo --environment development` built 1195 EN pages with no SCSS error, which is also
what proves `$success` and `$warning` resolve — neither is defined in `assets/scss/`, so both come
from Bootstrap's own variables. Computed on the served page: pills `font-size: 14.4px` (0.9rem) and
`width: 80px` at both breakpoints, `.worse` background `rgb(255, 230, 155)` (`#FFE69B`).

### Step 4 — remove the inline emoji rules — DONE 2026-08-12

**Files:** `themes/dohmh/layouts/nr-output/single.html` — the six inline `::before` rules setting
`✅`, `‼️` and `⚪`, replaced by a comment pointing at the two SCSS files that now own them.

**Proof:** the three emoji are absent from the served report page's HTML, and
`grep -rn "comp-null::before\|middle-sm::before" assets/ themes/` returns nothing. The compiled
stylesheet's only `.comp-null` rule is `font-weight: 700`, so rank 2 renders unmarked — this is the
static proof, because no `.comp-null` instance occurs on the page that was checked in the browser.

### Step 5 — verify in a browser — DONE 2026-08-12

Ran against `hugo serve --environment development` (production data, serving at
`http://localhost:1313/dev-prod/`) on
`/neighborhood-reports/bayside_little_neck/asthma_and_the_environment/`, via a disposable Playwright
script kept inside the repo tree so `playwright` resolved, and deleted afterwards.

**The prescribed proof in this file's first draft was wrong twice, and both corrections are the
reusable part.** The original step said to emulate print and read `document.body.innerText`. That is
necessary but nowhere near sufficient:

1. **The panel probe was a null result.** Reading a `.report-section .collapse` while it was
   collapsed gave text that was *already* absent from screen `innerText`, so "absent in print" could
   not distinguish the new print rule from a panel that never rendered. **A panel must be clicked
   open first**, and its probe confirmed present in screen `innerText`, before its absence in print
   means anything.
2. **The `emulateMedia` control was degenerate.** The first control compared a `.print-only`
   element's text against screen text — but the screen row carries the same indicator name, so the
   probe matched in both renditions and reported the instrument broken when it was fine. **The
   control has to be a string the print rendition emits and the screen one does not**; the tertile
   sentence works ("Less than most neighborhoods"), the indicator name does not.

With both corrected, the run reported: control probe absent on screen and present in print
(`emulateMedia` took effect); panel probe present on screen when expanded and absent in print (the
new rule works); `#map` not rendered in print; screen `innerText` 6519 chars against print 4208.

`.nr-map-container` from the recode branch's print block was **dropped rather than ported** — the
class exists nowhere on this branch, and production's map is already inside a `d-print-none` wrapper
at `themes/dohmh/layouts/nr-output/single.html`, the `col-md-4` holding `nr-leaflet`. Porting it
would have been dead CSS.

### Step 6 — the styles had nothing to attach to in two renditions — DONE 2026-08-12

Steps 1–5 ported the CSS correctly and it still was not enough, because two of the three places
the comparison appears carried no class the CSS could reach. Found by A/B against the refactor
branch in a worktree, both served at once (`8080` this branch, `8081` the worktree, which is safe
because the trees have separate `resources/_gen`).

- **The print row emitted the tertile sentence as bare text.** `nr-indicator-new.html` column 3 of
  the `print-only` row had no `<span>` at all, so nothing was styled. Measured after the fix: 14
  styled sentences on the page, 0 rows left carrying sentence text without a `.comp-*` class.
- **The expanded panel used a different class family.** It wrapped the whole phrase in
  `.worse-sm` / `.middle-sm` / `.better-sm`, which carried only a glyph — so within one panel,
  "Less than most neighborhoods" rendered weight 400 and uncoloured while "Lower than the Queens
  average" two lines below it was green and bold.

**Fix:** a new `themes/dohmh/layouts/partials/nr-tertile-inline-label.html`, one source for both
renditions, modelled on `getTertileInlineLabel` in the refactor branch's
`assets/js/nr-topic-spa/tertiles.js`. Both call sites now call it. The `-sm` family is
consequently unreferenced and its rules are deleted from `theme.scss`, including the pre-existing
`display`/`font-size` rule this change orphaned.

**Copy changes this carried, as a side effect of unifying two drifted copies:** the print row said
"In the middle of **NYC** neighborhoods" where the panel said "of neighborhoods" — now both say the
latter. Rank 3's word is now "Lower" rather than "Less", matching "Higher". The emphasised span is
now the comparison word alone rather than the whole phrase.

### Step 7 — the refactor branch's rank mapping is wrong; this branch's is right — DONE 2026-08-12

**Do not port `getTertileSentenceParts`'s rank-to-verdict mapping.** It flips the verdict when
`rankReverse` is set — rank 1 becomes `comp-good` — and the same flip is in its
`getTertilePillClass`. On `jamaica/active_design_physical_activity_and_health` alone that marks
**Park access, Bike lanes, Subway access and Exercise** as good news while the neighborhood sits
below most others on all four. This branch instead lets the rank carry the verdict on its own
(1 = worse, 3 = better) and uses `rankReverse` only to choose the word, which is what its pill
logic at `nr-indicator-new.html:47-61` has always done.

Found by pairing all 14 indicators by name across the two servers and reducing each side's pill and
sentence classes to a good/bad/neutral verdict: 4 of 14 disagreed. **Confirmed by Chris 2026-08-12
that this branch is the correct one**, and confirmed independently of that by the refactor branch
contradicting itself: its own `getComparison` scores a neighborhood below its reference value on a
reversed indicator as `comp-bad`, which is the opposite of what its `getTertileSentenceParts` said
about the same indicator on the same card. `getComparison` is byte-for-byte equivalent to this
branch's borough/city logic at `nr-indicator-new.html:211-218`, so the two branches only ever
disagreed about the tertile, never about the area comparison.

**Fixed on the refactor branch 2026-08-12**, in its worktree at
`EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor`: `getTertilePillClass` no longer takes
`rankReverse` at all (the rank carries the verdict), `getTertileSentenceParts` keeps the flag for
the word but pins `cssClass` to `comp-bad` for rank 1 and `comp-good` for rank 3, and the two
comments asserting the flag means "lower values are better" are corrected — it means higher values
are better. `cards.js:62` updated for the narrowed signature. `getTertileLabel` and `getComparison`
were already right and are untouched. Re-audit after the fix: **14 of 14 paired indicators agree,
0 disagreements**, against 4 before — the same probe, so its ability to detect the fault is
established by the fact that it detected it. Those changes are uncommitted in that worktree and
belong to that branch, not to this one.

**Proof the rewire changed no verdict:** on this branch the pill and the sentence both derive from
rank, so they must agree on every row. After the rewire: 14 rows, 0 mismatches, and each row's
verdict equals what it was before the rewire (`worse`/`worse-sm` → `worse`/`comp-bad`,
`middle`/`middle-sm` → `middle`/`comp-null`). That invariant is the regression net to re-run if
this markup is touched again.

`themes/dohmh/layouts/partials/nr-indicator-old.html` was left alone: it is included from nowhere
on this branch (`nr-output/single.html:410` includes only `nr-indicator-new.html`), as is the
`.modal-body` pill rule in `theme.scss`. Both are dead paths here, so the pill changes cannot reach
a sentence context.

### Step 8 — the comparison span swallowed its preposition — DONE 2026-08-12

The borough and citywide sentences put the judgment class on the id'd wrapper, so the colour,
weight and icon covered `Lower than` where the tertile sentence one line above covered `Higher`
alone. Visible in the same panel, and it only became visible once step 6 narrowed the tertile
emphasis to the word.

**Fix** in `nr-indicator-new.html`'s inline script: a `getComparison(refVal)` returning `word`,
`preposition` and `cssClass` separately — the split exists because "Equal" takes "to" where the
other two take "than", so the preposition cannot simply be appended to a styled string — plus a
`renderComparison` that writes `<span class="…">word</span> preposition` into the wrapper, leaving
the wrapper unclassed. This also collapses the two byte-identical `boroJudgement` / `cityJudgement`
if-chains into one function, which is what stopped them drifting apart.

**Proof:** the node Chris quoted now renders
`<span id="b-exercise"><span class="comp-bad">Lower</span> than</span> the <strong>Queens
average</strong>`. Across the whole page, zero `.comp-*` spans contain a preposition on either
branch, and the distinct comparison-span texts on this branch are exactly `Higher`,
`In the middle`, `Lower`. **Regression net:** verdict class counts are identical on the two
branches — `comp-good` 13, `comp-bad` 27, `comp-null` 16 — so the span change moved no verdict.

Behaviour deliberately preserved rather than "fixed": a non-numeric reference value still falls
through to "Equal to", as it did before. The refactor branch instead returns an empty comparison
for that case. Not changed here because it is outside this port and would alter what a reader sees
on any indicator with a missing borough or city value.

**Superseded in part by step 9** — a `null` on either side now renders "Equal to" rather than the
`Number(null) === 0` comparison the JS performed. Unparseable strings still fall through to "Equal
to" as described above.

### Step 9 — the borough/city comparison moved to build time — DONE 2026-08-12

Followed `documents/nr-comparison-buildtime-brief-2026-08-12.md`, which has the full record. In
brief: a new `themes/dohmh/layouts/partials/nr-comparison-label.html` renders the two comparison
fragments at build time, and the inline IIFE in `nr-indicator-new.html` that did it at runtime is
deleted along with the `b-`/`c-`/`bv-`/`cv-` element ids, the dead `nid` parameter, and the
`boro val` / `city val` placeholders a no-JS reader used to be served. 8 insertions, 114 deletions.

Step 8's own regression net was the check: verdict counts identical at `comp-good` 13, `comp-bad`
27, `comp-null` 16, plus a stricter per-row diff — 14/14 rows and 28/28 comparisons agreeing on
class and word, 0 mismatches.

**One decision, taken by Chris:** a non-numeric or null value on either side is now treated as not
comparable and renders "Equal to", where the JS mapped `null` to 0 and could assert "Lower than the
Queens average" from a value that does not exist. Step 8 above records that behaviour as
"deliberately preserved rather than fixed" — **that is now superseded for the null case**, though
not for unparseable strings, which behave as before. Measured across all 210 report pages, the
change is invisible to readers: every borough and citywide value is numeric (7,140 of 7,140), and
the 48 empty neighborhood values across 42 pages all sit inside a `d-none` panel already hidden
because `data_value_rank` is nil. The brief carries the sweep commands and their controls.

## Completion

Commit range: `a41bafdb95..d021d753e3`, four commits. The steps above were done in one working
tree and split by concern at commit time, so a step maps to a commit rather than the reverse:

| Commit | Covers |
|---|---|
| `1ffd7a06a6` | step 1 and the `$primary-dark` half of steps 2–3 (`.btn-light-green-bg`, `.btn-report`) |
| `a2d08a53fa` | the `@media print` block from step 3, proven by step 5 |
| `4dcbe069ec` | the marker half of steps 2–3, step 4, and step 6's `nr-tertile-inline-label.html` |
| `d021d753e3` | steps 8–9 — `nr-comparison-label.html` and the deletion of the inline IIFE |

Step 7 is not in this range: its fix belongs to `feature-MOD-Lab-NR-recode-refactor` and was left
in that branch's worktree.
