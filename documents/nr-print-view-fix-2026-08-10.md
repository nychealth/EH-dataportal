# Neighborhood Reports — print view fix

Branch `feature-MOD-Lab-NR-recode-refactor`. Reported 2026-08-10: printing a report page on
the new topic SPA produces section headings and a stack of empty bordered buttons — no indicator
rows. Seen on Chromium on Windows and on Chrome and Safari on iOS 26; the cause is pure CSS, which
is why it is browser-independent. Second complaint, older and true on production too: a panel the
reader expanded on screen prints expanded, which is not wanted.

**Tasks 1-5 closed 2026-08-10**, browser-verified and committed as `8daaf8ed7d..cbe04801d5`,
including the `CLAUDE.md` print contract and its stamp. Task 5, the tertile wording swap, followed
the same day and reversed task 1's wording decision. That range is pushed, plus the two records
commits that follow it; the branch is still unmerged to `production`.

**Reopened the same day for task 6**, an appearance follow-up on the comparison markers: Font
Awesome glyphs in place of the emoji, colour on the comparison word, and a smaller third print
column. **Task 6 closed 2026-08-10, committed `5195e4db8a`** — this line read "task 6 in
progress" until 2026-08-15, contradicting its own ledger row, which had recorded the task done
with proof since the day it landed
`[verified 2026-08-15: git log -S over assets/scss/_custom.scss]`.

**All six tasks are done; this is a dated historical record, not live work.**

## Ledger

| # | Task | Status | Proof that ran |
|---|---|---|---|
| 1 | `getTertilePrintLabel` in `assets/js/nr-topic-spa/tertiles.js` | **DONE 2026-08-10**, committed `8daaf8ed7d` | `npm run lint` exit 0. That is also the positive control CLAUDE.md asks for: the name is declared in `tertiles.js` and called from `cards.js`, so a green run proves `scanDeclaredGlobals` loaded the directory rather than silently returning nothing |
| 2 | Print-only row from `buildIndicatorCard` (`cards.js`) | **DONE 2026-08-10**, committed `8daaf8ed7d` | `[verified 2026-08-10: Playwright, print media emulated, local_stage :8080]` printed `body.innerText` **1,459 → 4,361 chars**, 23 rows against 0. Diffed line-by-line against the live production capture: the 16 tertile sentences and 16 values before the divergence point match **exactly**; from index 16 dev runs one ahead of prod throughout, a pure insertion, identified as the `Mold in homes, 2019` row that staging carries and production does not. Geometry under print: children 402/201/201 of an 835px row, all at the same `top` — 50/25/25 side by side, not stacked |
| 3 | `@media print` collapse rule (`assets/scss/theme.scss`) | **DONE 2026-08-10**, committed `b60830a4b2` | `[verified 2026-08-10: Playwright]` with a panel expanded on screen, under print media the open panel computes `display:none`, height **0**, and printed text is **4,361 chars — byte-identical to the collapsed-state capture**. That equality is the real claim: print output is independent of screen state |
| 4 | Restore the print-only QR code (`nr-topic-spa.html`, `report.js`) | **DONE 2026-08-10**, committed `df528f920e` | `[verified 2026-08-10: Playwright]` `#qrcode img` present, `.print-only` wrapper `display:flex` under print media. Staleness fix proven by switching neighborhood via `renderAll()` and hashing the **full** `src`: `1842390694` → `-371523795`. **The prescribed check was wrong and is corrected here** — comparing a 60-char prefix and the length reported *no change*, because a type-10 QR GIF is fixed-size and shares a header. Positive control: the library returns different markup for two different strings. Compare full strings, never a prefix |

| 5 | Print row uses `getTertileInlineLabel`; `getTertilePrintLabel` deleted | **DONE 2026-08-10**, committed `3af05d965e` | `npm run lint` exit 0. `[verified 2026-08-10: Playwright, print media, local_prod :8080]` printed text 4,268 → 4,233 chars (shorter because "In the middle of **NYC** neighborhoods" lost a word, and `::before` emoji never appear in `innerText`), 21 sentences over 22 rows either way — the unranked row correctly carries none. All three marker classes present, `comp-good`/`comp-bad`/`comp-null`, 21 markers, `::before` resolving to the emoji. Screenshotted under print media |

| 6 | Comparison markers: FA glyphs, coloured and bolded word, `fs-sm` third print column (`assets/scss/_custom.scss`, `nr-topic-spa.html`, `cards.js`) | **DONE 2026-08-10**, committed `5195e4db8a` | `npm run lint` exit 0, `npm run smoke` 15/15. `[verified 2026-08-10: Playwright, print media, local_prod :8080]` — served `theme.*.css` fetched and the old codepoints `2705`/`203C`/`26AA` confirmed **absent** from both it and the page HTML; `document.fonts.check('900 1rem "Font Awesome 6 Free"')` **true** as the positive control. Computed `::before` content read as **numeric codepoints** (`f14a`, `f071`, one char each) — necessary, because a PUA glyph serializes to an empty-looking string through a pipe and reads as a missing rule. Colours identical on screen and under print media: word `rgb(33,136,63)` / `rgb(122,92,0)`, `.comp-bad::before` `rgb(255,193,7)`, `.comp-null` `content: none`. Screenshotted under print media: both glyphs render as icons, not tofu. `characterize:nr -- --check` deliberately not run — its baseline's `finalURL` carries `/dev-stage/` and the only server is `local_prod`, so every target would fail on the prefix alone |

**A stale bundle nearly read as a failed change here.** The first post-swap check reported the old
wording and zero markers, against a `tertiles.d05e114a7ace7785.js` that still contained the deleted
function. Hugo *had* rebuilt — the page was by then referencing `tertiles.a29897a710fb71a1.js` — and
the browser was serving both page and bundle from cache. Fetching the served bundle and asserting
the deleted identifier is **absent** is what separates the two cases; a re-check with the cache
bypassed then showed the change. An unchanged fingerprint plus unchanged output is the tell.

**Task 6 needed four instruments before one of them measured the thing.** The claim under test was
"the third print column wraps to fewer lines", and three plausible measurements all reported *no
change*:

1. **Element height.** The third `div` is a block child of a flex row, so it stretches to the row's
   height. It read 51px/72px identically with and without `fs-xs` — a number wholly determined by
   the 50% column beside it.
2. **`Range.getClientRects().length`.** Returns a rect per *element boundary* as well as per line,
   so a `<span>` plus trailing text on one line counts as 3. It reported 3 lines both ways.
3. **Viewport width.** Print emulation does not re-lay-out to page width; at the default 1280px
   viewport the column was 246px, wide enough that nothing wrapped differently. The column is 184px
   at a Letter-width 816px viewport.

What worked was the count of **distinct rounded `top` values** among those rects, at 816px. It
reports 21 labels at **2 lines each** at the inherited 14px, and 11 of 21 down to a single line at
`fs-xs`. The plan's prediction of "about three lines" was an estimate from column width and was
wrong; the measured before-state is two.

**`fs-xs` was then reverted to `fs-sm` on request, which is a no-op on size** — `$fs-sm` is
0.875rem and the accordion button is `.btn-sm`, so the column rendered at 14px either way. The class
is explicit rather than inherited, and the tally is back to 2 lines for all 21.

**`getComparison` returned the preposition inside the styled word**, so the panel's borough and
citywide lines read a bold coloured "Higher than" where the tertile line above them styled only
"Higher". It now returns `word` and `preposition` separately — separately rather than by trimming a
suffix, because "Equal" takes *to* where the other two take *than*. All five branches exercised
against the live global `[verified 2026-08-10: getComparison called from the page console — higher,
lower, equal, rank-reversed, and non-numeric]`. Unchanged and worth knowing: `Number(null)` is `0`,
not `NaN`, so a null neighborhood value slips past the non-numeric guard and compares as zero. That
predates this work and was left alone.

**The bold went on the wrong element first.** `font-weight: 700` on `.comp-good`/`.comp-bad`/
`.comp-null` is right for the expanded panel but changed nothing in the print row, because the
accordion button is already weight 700 and the column inherits it — the whole label was bold, so
bolding the word picked out nothing. The print row un-bolds selectively, which is why its other
spans carry `font-weight-normal`; the third column now does too. Proof is the pair of computed
weights, parent `400` against span `700` `[verified 2026-08-10: getComputedStyle under print media]`
— reading the screenshot could not settle it, since bold and normal at 14px are near-identical
after antialiasing.

`innerText` is the wrong instrument here too, and provably: turning `content` off on both `::before`
rules leaves the printed character count at **4,254, unchanged**. Pseudo-element text never enters
`innerText`, so the scalar that proved tasks 2 and 3 is blind to the whole of task 6. The 4,233 →
4,254 shift against task 5's figure therefore has some other origin, not isolated here — but it
cannot be this change, since this change cannot move that number at all.

`node scripts/smoke-pages.mjs` — exit 0, 15 pages clean, covering
`neighborhood-reports/bayside_little_neck/asthma_and_the_environment/`, i.e. this page kind.

Scratch artifacts left untracked at the repo root for review and safe to delete:
`nr-print-check.pdf`, `nr-print-check.png`.

Harness notes. **Call the scripts directly** — PowerShell strips the `--` in
`npm run smoke -- --flag`, and the script prints its usage line and exits 1 while looking like a real
failure. This session's `:8080` is a **`local_stage`** server the user started, serving under
`/local-stage/`; nothing here may run a static `hugo` build, which would poison its `resources/_gen`
cache. `node scripts/nr-characterization.mjs --check` will false-fail on every target if run against
it: the committed baseline records `/dev-stage/` pathnames, so the final-URL field differs on prefix
alone.

## Diagnosis

Verified in a running browser with print media emulated — `page.emulateMedia({media:'print'})`,
reading `document.body.innerText`, which respects `display:none` and so is what print actually shows.
Dev page against the live production page, same neighborhood and topic
`[verified 2026-08-10: Playwright, local_stage :8080 vs a816-dohbesp.nyc.gov]`:

| | dev (this branch) | production (old page) |
|---|---|---|
| printed characters | **1,459** | **4,295** |
| indicator rows printed | **0** | all 24 |
| `.print-only` elements | **0** | 24 |
| collapse button height in print | 16px (empty) | full row |

Everything else prints identically — page title, section headings, section descriptions are all
present on dev. The entire 2,836-character gap is the missing rows.

1. **Rows don't populate.** `cards.js:80` puts `d-print-none` on the *whole* header row wrapper, so
   Bootstrap's `utilities/_display.scss` makes it `display:none !important` in print. On the retired
   `partials/nr-indicator-new.html` (production, lines 26–117) that class sat on the three *inner*
   columns and was paired with a `col-12 print-only` sibling carrying a 50/25/25 print layout of the
   same name / value / rank content. The rewrite hoisted the class to the wrapper and dropped the
   `print-only` counterpart. The CSS it needs is still present and unused — `_custom.scss:29-45`.

2. **Expanded panels print expanded.** Nothing on either branch collapses them for print. With one
   panel open, under print media it is `display:block`, 391px tall — and prints *half-empty*, because
   `theme.scss:702` hides `.nr-map-container`, so the chart is gone but the comparison text remains.

3. **The QR code was dropped.** Production printed a `print-only` QR linking back to the report
   (`production:themes/dohmh/layouts/nr-output/single.html:442-470`). `qrcode-generator@^2.0.2` is
   still in `package.json` and `node_modules` is mounted to `assets/node_modules`, so only the script
   tag and markup need restoring.

## Decisions taken in session (2026-08-10)

- **Print wording followed production verbatim** in the first pass — "Higher than most
  neighborhoods" / "In the middle of NYC neighborhoods" / "Less than most neighborhoods" as plain
  text. **Reversed later the same day** after seeing both rendered side by side: print now uses
  `getTertileInlineLabel`, the same labels the expanded panel shows, so a reader who opens a row and
  prints it does not get the same fact in two vocabularies. `getTertilePrintLabel` was deleted with
  the swap; it is recoverable from `8daaf8ed7d` if the plain wording is ever wanted back.
- **The `.comp-*` classes carry no colour.** Stated otherwise when the options were first put — the
  correction matters because it changes what the emoji is doing. `.comp-good` / `.comp-bad` /
  `.comp-null` are defined *only* as `::before` rules in
  `themes/dohmh/layouts/neighborhood-reports/nr-topic-spa.html`; computed colour on those spans is
  `rgb(33, 37, 41)`, identical to `body` `[verified 2026-08-10: grep across assets/scss and themes,
  plus getComputedStyle in the browser]`. So the emoji is the whole visual signal. **Untested on a
  greyscale printer**, where ✅ and ‼️ would be left differing only in shape — reasoned from the
  absence of a colour rule, not measured. Accepted knowingly; a `content: none` print rule would
  suppress them. **Superseded by task 6 the same day** — the rules moved to
  `assets/scss/_custom.scss`, gained colour, and traded the emoji for Font Awesome glyphs, which
  retires the greyscale question by making the two differ in shape.
- **Icon colour and text colour are not the same value in the bad case.** `$warning` (`#ffc107`) is
  1.6:1 on white `[verified 2026-08-10: computed against $accessible-colors: true, which overrides
  $green to #21883f but leaves $yellow at the Bootstrap default]`. Fine for a glyph, unreadable as
  body text, so the word takes `#7a5c00` (6.3:1) instead. The good case needs no split — `$success`
  is 4.8:1 and does both jobs.
- **The QR code comes back.** Offered as optional; the user asked for it.

## Task detail

### 1. `getTertilePrintLabel`

`assets/js/nr-topic-spa/tertiles.js`, after `getTertileInlineLabel`. Plain strings, no markup:

- rank `1` → `rankReverse ? 'Less than most neighborhoods' : 'Higher than most neighborhoods'`
- rank `2` → `'In the middle of NYC neighborhoods'`
- rank `3` → `rankReverse ? 'Higher than most neighborhoods' : 'Less than most neighborhoods'`
- otherwise `''`

Normalize with `String(rank)` and the existing `isRankReversed`, as the two sibling functions do.
Rank `2` prints a sentence even though the screen pill is blank for it — that asymmetry is the reason
the print variant exists.

**Interface:** produces `getTertilePrintLabel`, consumed by task 2. `tertiles.js` already loads
before `cards.js`.

### 2. The print-only row

`assets/js/nr-topic-spa/cards.js`, in `buildIndicatorCard`'s `headerHTML`. Leave the `d-print-none`
screen row untouched; append a `col-12 print-only` sibling after it, still inside the `<button>`,
with three flex children at 50% / 25% / 25% mirroring `nr-indicator-new.html:67-117`:

- 50%, `border-right pl-1` — `indicator_short_name` in `font-weight-bold fs-md`, `<br>`,
  `indicator_long_name` in `fs-sm font-weight-normal`
- 25%, `border-right pl-1` — the `value` local (which carries the `–` fallback the old markup
  lacked), `<br>`, the `units` local in `fs-xs font-weight-normal`
- 25%, `pl-1` — `getTertilePrintLabel(row.data_value_rank, row.rankReverse)`

Build every value from the locals already resolved above, so the two renditions cannot drift — the
improvement over the old partial, which recomputed both sides from `.data`. Keep the old inline
`style="flex-direction:row; width:100%;"`: `.print-only` is `display:flex !important` in print and
the children are plain divs, not grid columns.

### 3. Print every panel collapsed

`assets/scss/theme.scss`, inside the existing NR `@media print` block:

```scss
    .report-section .collapse,
    .report-section .collapsing {
        display: none !important;
    }
```

`.report-section` is on the accordion containers (`nr-topic-spa.html:245`); it is also on
`#nr-demographics`, which contains no `.collapse` and already sits inside a `d-print-none` column.
`.collapsing` covers a print fired mid-animation, when Bootstrap has swapped the class.
`.nr-map-container { display: none !important; }` stays — redundant now, but it costs nothing.

### 4. The QR code

1. **Markup** — after the `$reportTopics` loop closes in `nr-topic-spa.html`, the two `row print-only`
   blocks from `production:.../nr-output/single.html:442-460`: a centred "View this report online:"
   and `<div id="qrcode" class="text-center">`.
2. **Library** — alongside the resource lookups, `resources.Get
   "node_modules/qrcode-generator/dist/qrcode.js" | partial "short-fingerprint.html"`, its script tag
   emitted before the ten SPA scripts. Mirrors `production:.../single.html:78-79`.
3. **Generation** — *not* production's load-time inline script. This page switches neighborhood in
   place via the Leaflet map, which rewrites the address bar, so a QR generated once at load would
   encode the wrong report. Define `renderQRCode()` in an inline `<script>` after the SPA scripts —
   the pattern `data-explorer/single.html` uses for `renderIndicatorDropdown` — and call it from the
   end of `renderAll()` in `report.js`, guarded by `typeof renderQRCode === 'function'`. `renderAll`
   runs on first render and on every neighborhood switch, so one call site covers both.

## Verification

Rung: **browser with print-media emulation**. Nothing below it can prove this — the defect is
entirely which rules apply under `@media print`, and a build or a grep is blind to it.

1. `npm run lint` — proves `getTertilePrintLabel` resolves from `cards.js`.
2. **Print text diff, the primary proof.** Emulate print, read `document.body.innerText`: expect
   ~4,300 characters against today's 1,459, all 24 rows, wording identical to the production capture.
3. **Collapsed-in-print.** Expand a panel, emulate print: the open panel computes `display:none`,
   height 0, and the printed text is unchanged from step 2 — print output independent of screen state.
4. **QR.** `#qrcode img` exists under print media; after switching neighborhood the `src` changes.
   **Hash the whole `src`.** A type-10 QR GIF is fixed-size, so its length and leading bytes are
   identical whatever it encodes — a prefix comparison reports "unchanged" against a code that did
   regenerate. Pair it with a positive control that the library differentiates two strings at all.
5. `node scripts/smoke-pages.mjs` — exit 0, no console errors from the new inline script.
6. A real Chromium print-to-PDF from the dev page, compared against the two PDFs at the repo root.

## Commits

Three, each provable alone: (1) tasks 1–2, the print row; (2) task 3, the collapse rule; (3) task 4,
the QR code. Plus a records commit if `CLAUDE.md`'s NR section gains a sentence on the print
contract, which would need the `docs-check verified:` stamp re-bumped.
