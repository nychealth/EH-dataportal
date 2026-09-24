# Brief: move the NR borough/city comparison from runtime JS to build time

**Status as of 2026-08-12: both tasks DONE, verified in a browser, and landed as `d021d753e3`.
The open decision
was answered — Chris chose "not comparable" (option 1), so the `$comparable` guard stands as
written. Two corrections to this brief's own prescriptions are recorded inline below: the compile
probe in task 1 step 2 could not work as written, and the verdict counts in task 2 step 4 did not
need re-baselining after all.**

**Goal:** replace the inline `<script>` in `themes/dohmh/layouts/partials/nr-indicator-new.html`
that fills the borough and citywide comparison sentences at runtime with a Hugo partial that renders
them at build time.

**Branch:** `feature-improve-NR-styles`. Read
`documents/nr-style-port-2026-08-12.md` first — it is the record of the work this follows on from,
and its step 7 explains a semantic trap that will bite you if you skip it.

**Why:** every input to that script is already a build-time value, interpolated into the IIFE as a
Hugo expression. Nothing on this branch switches neighborhood in place — each report is its own page
and the values are baked in as literals, so the script could not respond to a switch anyway. Doing
it at build time removes the element ids, the IIFE, a dead parameter, and a no-JS defect where the
reader is served the literal placeholder text `boro val` and `city val`.

## Global constraints

Copy these into your working memory before task 1; they are the things that make this change go
wrong.

1. **`rankReverse: true` marks indicators where HIGHER values are better** — park access, bike
   lanes, subway access, regular exercise. The name reads as the opposite and two comments in the
   sibling refactor branch asserted the opposite until 2026-08-12. Do not "correct" the direction.
2. **Do not reuse the tertile rank logic here.** The tertile sentence
   (`partials/nr-tertile-inline-label.html`) lets the *rank* carry the verdict and uses
   `rankReverse` only to pick the word. This comparison is the other shape: the *direction of the
   difference* carries the verdict and `rankReverse` flips it. They are genuinely different
   functions. Conflating them is the bug that step 7 of the port document describes.
3. **Never run two Hugo builders against one tree.** They share `resources/_gen`. Chris typically
   serves this branch on `:8080` and the refactor worktree on `:8081`; two trees are fine, two
   builders on one tree are not. Do not start a second server against this tree — check
   `Get-NetTCPConnection -LocalPort 8080 -State Listen` first.
4. **This branch has no npm scripts.** `package.json` has an empty `scripts` block
   `[verified 2026-08-12]`, so there is no `lint`, `smoke`, `docs-check` or characterization
   harness. Verification is the browser, and only the browser.
5. **4-space indentation**; comments explain *why*. See `CLAUDE.md`.

## Current state

**`themes/dohmh/layouts/partials/nr-indicator-new.html`**, two regions:

- **Markup**, the two `<p>` blocks inside `div.col-md-5.h-100.p-1` (around lines 150-160). Each is
  an empty `<span id="b-…">` / `<span id="c-…">` followed by static text, plus a value span
  carrying the placeholder string `boro val` / `city val`:

  ```html
  <p>
      <span id="b-{{ urlize .data.indicator_short_name }}"></span> the <strong>{{ .borough }} average</strong>
      <br>
      <span class="fs-sm pl-3">(<span id="bv-{{ urlize .data.indicator_short_name }}">boro val</span>{{ if in .data.measurement_type "ercent" }}%{{ else }} {{ .data.units }}{{ end }})</span>
  </p>
  ```

- **Script**, the IIFE beginning `(function(n, b, c, nid, bid, cid, rr) {` (around line 200) and its
  argument list at the foot of the same `<script>` block. It holds `getComparison`,
  `renderComparison`, the two `renderComparison(...)` calls, and the two `bv-`/`cv-` assignments.

**The semantics to preserve exactly.** This is the current JS, post-2026-08-12 fix:

```js
let rankReverse = (rr === true || rr === 'true');

function getComparison(refVal) {
    if (n > refVal) {
        return { word: "Higher", preposition: "than", cssClass: rankReverse ? 'comp-good' : 'comp-bad' };
    }
    if (n < refVal) {
        return { word: "Lower", preposition: "than", cssClass: rankReverse ? 'comp-bad' : 'comp-good' };
    }
    return { word: "Equal", preposition: "to", cssClass: 'comp-null' };
}
```

with `n = Number(.data.unmodified_data_value_geo_entity)`, `refVal` being
`Number(.data.data_value_boro)` or `Number(.data.data_value_nyc)`, and the rendered output being
`<span class="CLS">WORD</span> PREPOSITION`. The word and preposition are separate because "Equal"
takes "to" where the other two take "than", and **only the word carries the class** — styling the
wrapper swept the preposition in too, which is what was fixed on 2026-08-12.

**`nid` is dead**: one occurrence in the file, the parameter declaration
`[verified 2026-08-12: grep -c '\bnid\b' returns 1]`. It is passed `'n-<slug>'`, an id no element in
this partial carries; the only `id="n-…"` in the repo is in `nr-indicator-old.html`, which is
included from nowhere. Delete it with the rest.

## Decision to confirm with Chris before task 2

**Non-numeric and null values behave differently in Hugo than in JS, and you cannot preserve the
current behaviour and be correct at the same time.** JS `Number(null)` is `0`, so a null
neighborhood value against a borough average of 60 currently renders "**Lower** than the Queens
average" — a comparison asserted from a value that does not exist. JS `Number("abc")` is `NaN`, and
both comparisons against `NaN` are false, so that case falls through to "Equal to" — also wrong, but
differently.

The partial below treats *any* non-numeric on either side as not comparable and renders "Equal to"
with `comp-null`. That matches current behaviour for unparseable strings and **changes** it for
null. Recommended, because "Lower than" from a missing value is a false statement about data,
whereas "Equal to" is merely uninformative. Ask Chris; if he wants strict parity instead, replace
the `$comparable` guard with a cast that maps null to 0.

**ANSWERED 2026-08-12: Chris chose "not comparable".** Measured afterwards across the whole
corpus, the change reaches no reader:

- **Reference side — no cases at all.** All 210 report pages swept; 7,140 borough/citywide values
  render, every one of them numeric. `[verified 2026-08-12: per-page grep of
  `fs-sm pl-3">([0-9]` (control, 7,140 hits) against `fs-sm pl-3">([^0-9)]` (probe, 0 hits),
  210 of 210 pages, stop condition input exhausted]`
- **Neighborhood side — 48 cases, all already hidden.** 48 comparisons across 42 pages have an
  empty `unmodified_data_value_geo_entity`, and all 48 sit inside a `col-md-5 … d-none` panel,
  hidden because `data_value_rank` is nil (the row carries "Estimate is suppressed due to
  insufficient data"). `[verified 2026-08-12: temporary `data-nval` attribute on the borough
  `<p>`, swept via `fetch` + `DOMParser` in the browser over all 42 hit pages; 48 non-numeric
  found, 48 with `closest('.col-md-5').classList.contains('d-none')`, 0 rendered to readers.
  Control: 583 numeric-valued panels in the same run were correctly read as *not* hidden, so the
  hidden/visible discrimination is not stuck on. Probe removed afterwards.]`

So the "Lower than a value that does not exist" defect the decision was about is real in the data
and was never visible on the page. The guard is defensive, not corrective.

---

## Task 1: the comparison partial

**Files:**
- Create: `themes/dohmh/layouts/partials/nr-comparison-label.html`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: a partial called as
  `{{ partial "nr-comparison-label.html" (dict "neighborhoodValue" V "referenceValue" R "rankReverse" RR) }}`,
  emitting exactly `<span class="comp-good|comp-bad|comp-null">Higher|Lower|Equal</span> than|to`
  with no surrounding whitespace. Task 2 is its only caller.

- [x] **Step 1: write the partial** — DONE 2026-08-12

Written as prescribed with one simplification: `$reverse` is
`eq (printf "%v" .rankReverse) "true"` alone, dropping the `or (eq .rankReverse true) …` first
clause. The `%v` form already collapses boolean `true` and the string `"true"` to the same text, so
the dropped clause could never change the result, and removing it also avoids `eq nil true` on an
indicator with no `rankReverse` at all. Both forms are covered by probes 2 and 7 below.

```html
{{- /*
    One borough-or-citywide comparison sentence fragment: the judgment word wrapped in its
    .comp-* class, then the preposition as plain text. The two are separate because "Equal"
    takes "to" where the other two take "than", and because only the word is styled — the
    preposition belongs to the sentence around it, which is static markup in the caller.

    Replaces an inline IIFE that did this at runtime. Every input is build-time data, and no
    page on this branch switches neighborhood in place, so nothing was gained by deferring it.

    rankReverse marks indicators where HIGHER values are the better ones (park access, bike
    lanes, subway access, exercise), so it decides which direction earns comp-good. This is
    NOT the tertile rule in nr-tertile-inline-label.html, where the rank carries the verdict
    on its own — see documents/nr-style-port-2026-08-12.md step 7.

    Params:
      neighborhoodValue — .data.unmodified_data_value_geo_entity
      referenceValue    — .data.data_value_boro or .data.data_value_nyc
      rankReverse       — .data.rankReverse; boolean true or the string 'true', matching the
                          two forms the payload uses
*/ -}}

{{- $reverse := or (eq .rankReverse true) (eq (printf "%v" .rankReverse) "true") -}}

{{- /* Both sides must parse as numbers for the comparison to mean anything. Hugo's `float`
       returns 0 for an unparseable value rather than failing, so guard before casting or a
       missing value silently becomes a real comparison against zero. */ -}}
{{- $numeric := `^-?[0-9]+\.?[0-9]*$` -}}
{{- $comparable := and
        (findRE $numeric (printf "%v" .neighborhoodValue))
        (findRE $numeric (printf "%v" .referenceValue)) -}}

{{- $word := "Equal" -}}
{{- $preposition := "to" -}}
{{- $class := "comp-null" -}}

{{- if $comparable -}}
    {{- $n := float .neighborhoodValue -}}
    {{- $ref := float .referenceValue -}}
    {{- if gt $n $ref -}}
        {{- $word = "Higher" -}}
        {{- $preposition = "than" -}}
        {{- $class = cond $reverse "comp-good" "comp-bad" -}}
    {{- else if lt $n $ref -}}
        {{- $word = "Lower" -}}
        {{- $preposition = "than" -}}
        {{- $class = cond $reverse "comp-bad" "comp-good" -}}
    {{- end -}}
{{- end -}}

<span class="{{ $class }}">{{ $word }}</span> {{ $preposition }}
```

- [x] **Step 2: confirm it compiles before wiring it** — DONE 2026-08-12

**The probe form prescribed here does not work, and the reason will bite any future Hugo probe.**
The original step said to wrap the call in an HTML comment and read it in view-source. Go's
`html/template` **elides HTML comments from its output** — this is the template package, not a
Hugo setting, and there is no `minify` config in this repo `[verified 2026-08-12: `grep -rn
"minify\|keepComments" config/` returns nothing; the served page contains 0 `<!--` and the
source's own `<!-- INDICATOR ROW -->` marker is likewise absent]`. The probe rendered as seven
blank lines. Nothing was wrong with the partial — the instrument was invisible.

**Use a visible element instead.** What ran: seven `<div data-temp="N">TEMP N|…|</div>` probes
above the borough `<p>`, read out of the served HTML with
`grep -o 'TEMP[0-9]|[^|]*|'`. All seven correct on the first build:

| # | Input | Output |
|---|---|---|
| 1 | 5 vs 3, `rankReverse` `false` | `<span class="comp-bad">Higher</span> than` |
| 2 | 5 vs 3, `rankReverse` `true` | `<span class="comp-good">Higher</span> than` |
| 3 | 3 vs 5, `false` | `<span class="comp-good">Lower</span> than` |
| 4 | `nil` vs 5 | `<span class="comp-null">Equal</span> to` |
| 5 | `"abc"` vs 5 | `<span class="comp-null">Equal</span> to` |
| 6 | 5 vs 5 | `<span class="comp-null">Equal</span> to` |
| 7 | `"5.5"` vs `"3.2"`, `rankReverse` `"true"` | `<span class="comp-good">Higher</span> than` |

Probes 1–3 and 7 are the positive control for the numeric path and 4–5 prove the `$comparable`
guard fires, so neither branch is asserted from an instrument that never ran. Probe 7 additionally
covers the string forms of all three params. Probes removed before task 2 `[verified: 0 matches
for `data-temp` in the served page]`.

---

## Task 2: wire the markup and delete the script

**Files:**
- Modify: `themes/dohmh/layouts/partials/nr-indicator-new.html` — the two `<p>` blocks around lines
  150-160, and the IIFE in the `<script>` block that follows

**Interfaces:**
- Consumes: `nr-comparison-label.html` from task 1, called with the three named params above.
- Produces: nothing later tasks depend on. This is the last task.

- [x] **Steps 1–2 both DONE 2026-08-12.** One deviation from the code below: both call sites pass
  `$rankReverse` rather than `.data.rankReverse`. Same value — `$rankReverse` is assigned from it at
  the top of the file — and it matches how the pill block and both `nr-tertile-inline-label.html`
  calls in this same file already read the flag.

- [x] **Step 1: replace the borough block**

```html
<p>
    {{ partial "nr-comparison-label.html" (dict "neighborhoodValue" .data.unmodified_data_value_geo_entity "referenceValue" .data.data_value_boro "rankReverse" .data.rankReverse) }}
    the <strong>{{ .borough }} average</strong>
    <br>
    <span class="fs-sm pl-3">({{ .data.data_value_boro }}{{ if in .data.measurement_type "ercent" }}%{{ else }} {{ .data.units }}{{ end }})</span>
</p>
```

- [x] **Step 2: replace the citywide block**

```html
<p>
    {{ partial "nr-comparison-label.html" (dict "neighborhoodValue" .data.unmodified_data_value_geo_entity "referenceValue" .data.data_value_nyc "rankReverse" .data.rankReverse) }}
    the <strong>Citywide average</strong>
    <br>
    <span class="fs-sm pl-3">({{ .data.data_value_nyc }}{{ if in .data.measurement_type "ercent" }}%{{ else }} {{ .data.units }}{{ end }})</span>
</p>
```

Both blocks lose their `id` attributes entirely — `b-`, `c-`, `bv-` and `cv-`. Nothing else in the
repo references them — re-derived after the edit rather than carried over from this brief's own
earlier claim.

[verified 2026-08-12: a regex over `*.{html,js,scss}` matching `getElementById("b-` / `"c-` /
`"bv-` / `"cv-` / `"n-` in any quote style, plus `id="b-`-style attribute forms, returns three
hits, all in `nr-indicator-old.html`. That file is included from nowhere —
`grep -rn "nr-indicator-old" themes/ layouts/` returns zero, while `nr-indicator-new` is included
at `nr-output/single.html:410`. `nid` occurrences in `nr-indicator-new.html`: 0.]

The placeholder strings `boro val` / `city val` go with them.

- [x] **Step 3: delete the IIFE** — DONE 2026-08-12

Remove the whole `(function(n, b, c, nid, bid, cid, rr) { … })( … )` block, including its argument
list. **Keep** the separate `getYear`-style IIFE above it that writes the `year-…` span, and keep
the `$( "#collapse-…" ).on('shown.bs.collapse', …)` handler below it — neither is part of this
change. If the `<script>` tag has nothing left in it after the removal, delete the tag too.

- [x] **Step 4: verify in the browser** — DONE 2026-08-12

Ran against the server already listening on `:8080` — `hugo serve --environment local_prod
--disableFastRender --disableLiveReload`, serving at `http://localhost:8080/local-prod/`. No second
builder was started. Which port held which tree was confirmed rather than assumed: `:8080` returns
14 `boro val` placeholders and no `nr-topic-spa` reference, `:8081` the reverse, so `:8080` is this
branch `[verified 2026-08-12: `grep -c` on both ports' copies of the same URL]`.

**Check 1 — verdict counts: PASS, exactly unchanged.** `comp-good` 13, `comp-bad` 27, `comp-null`
16, 56 total, before and after. Distinct span texts also unchanged: `Higher` 15, `Lower` 25,
`In the middle` 16.

**The count net alone is too weak, so it was not what the pass rests on** — counts survive two rows
swapping verdicts. A per-row table was captured before the edit (from the `b-`/`c-` wrappers the JS
filled) and after (from the panel markup, since those ids no longer exist), both in document order,
then diffed as files: **14/14 rows and 28/28 comparisons identical on both class and word, 0
mismatches.** Re-baselining turned out to be unnecessary — the decision above changes nothing on
this page, because all 14 indicators here have numeric values on both sides.

**Check 2 — no comparison span contains its preposition: PASS.** The prescribed filter returns
empty. Sentences read `Higher than the Queens average (60.3%)`, with the styled span covering
`Higher` alone.

**Check 3 — the sentence reads the same with JS disabled: PASS.** Checked against the raw served
HTML rather than a JS-disabled browser profile, which is the stronger form of the same claim now
that nothing is rendered at runtime: the bytes Hugo emits *are* the no-JS rendition. 56 `comp-*`
spans present in the raw HTML, 0 occurrences of `boro val` or `city val` anywhere on the page. The
previous implementation would have shown 0 and 28 respectively.

**Also confirmed:** 0 elements with a `bv-`/`cv-` id remain; the `getYear` IIFE and the
`shown.bs.collapse` handler both survive (15 handler instances on the page); `getComparison` and
`renderComparison` appear nowhere in the output. Net diff on the partial: 8 insertions, 114
deletions.

There is no test harness on this branch. Run these three checks against a running server for this
branch — read the URL the server prints rather than assuming a port — on
`/neighborhood-reports/jamaica/active_design_physical_activity_and_health/`, with every accordion
expanded:

1. **Verdict counts must be unchanged.** Baseline measured 2026-08-12 on this page, before this
   change: `comp-good` 13, `comp-bad` 27, `comp-null` 16. Count with
   `document.querySelectorAll('.comp-good').length` and so on. A changed count means the direction
   logic moved, which is the failure this whole brief is written around.
2. **No comparison span may contain its preposition.** Every `.comp-good`/`.comp-bad`/`.comp-null`
   span's `textContent` must be exactly one of `Higher`, `Lower`, `Equal` or `In the middle`. The
   check that catches a regression:
   `[...document.querySelectorAll('.comp-good,.comp-bad,.comp-null')].map(s => s.textContent.trim()).filter(t => /\s(than|to|of)\b/i.test(t))`
   must be empty.
3. **The sentence must read the same with JS disabled.** This is the point of the change, and it is
   the one check the previous implementation could not pass. Load the page with JavaScript blocked
   and confirm the borough and citywide sentences render in full, with no `boro val` or `city val`
   anywhere in the page text.

Check 1 is the regression net; checks 2 and 3 are the deliverable. Record the numbers you get, not
just "passed".

---

## Notes for whoever picks this up

- `documents/nr-style-port-2026-08-12.md` carries this as its **step 9**, and its step 8 has a
  pointer noting that the null case is superseded. Its Completion section maps every step in the
  port to the commit that carries it.
- Nothing commits without Chris's say-so, and he raises committing — do the work, report the
  numbers, and stop there.
- Self-review run against this brief 2026-08-12: both tasks name exact files and real identifiers;
  no step defers content to a later one; the partial's parameter names (`neighborhoodValue`,
  `referenceValue`, `rankReverse`) are identical in the Interfaces block, the partial body and both
  call sites; the one open question (null handling) is called out as a decision rather than left
  implicit in the code.
