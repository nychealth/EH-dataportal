<!-- docs-check source-roots: assets/js/nr-report themes/dohmh/layouts assets/scss data content -->
<!-- docs-check verified: 79d5eb4804 2026-09-02 -->

# Neighborhood Reports architecture

How the report page renders an indicator row, how the shared picker partials are wired, and how
the generated URLs route. Split out of `CLAUDE.md` unchanged; the traps that bite from outside the
NR files stay there under "Neighborhood Reports".

## The report page prints a different document than it shows

**The report page prints a different document than it shows, and the print rendition is markup, not
a stylesheet over the screen one.** `buildIndicatorCard` in `assets/js/nr-report/cards.js` emits
two renditions of every indicator: the screen row, which is `d-print-none`, and a `print-only`
sibling carrying the same name, value and units at 50/25/25 plus a full-sentence tertile label from
`getTertileInlineLabel`. Two renditions rather than one, because what each *shows* genuinely differs
— the screen pill is *blank* for rank 2 and reads a bare "Higher"/"Lower" otherwise, where print
wants a sentence. What they *announce* is now the same: the screen pill carries `aria-hidden` and an
`.sr-only` copy of the sentence sits beside it, so the accessibility tree gets one vocabulary
wherever the reader meets the comparison (a11y audit F5/C3). The sentence is the same function the
expanded panel uses, deliberately: a reader who opens a row on screen and then prints it would
otherwise get the same fact in two vocabularies. It
carries a `.comp-*` class — `assets/js/nr-report/tertiles.js` sets it, `assets/scss/_custom.scss`
styles it, and all three classes are bold so the comparison word stands out of its sentence. That
bold is invisible in the print row unless the column also carries `font-weight-normal`, because the
accordion button is weight 700 and the column inherits it. Colour and glyph are then split by rank.
`.comp-good` is
`$success` throughout, word and square-check `\f14a`. `.comp-bad` pairs a `$warning` triangle-
exclamation `\f071` with a **darker** amber word, because `$warning` is 1.6:1 on white — legible as
a glyph, not as text. `.comp-null` has no rule at all, so rank 2 prints unmarked, mirroring the
blank pill the screen row shows — visually. Rank 2 still emits the `.sr-only` sentence, because
showing nothing was a third state a screen reader could not tell from missing data. The glyphs are
Font Awesome 6 codepoints rather than emoji, so they come from the webfont `head.html` already loads
sitewide and are under this repo's control; square against triangle also means the two differ in
shape and not only in colour. All three renditions resolve through one `getTertileSentenceParts` in
`tertiles.js`, so they cannot drift: `getTertileInlineLabel` wraps the comparison word in its
`.comp-*` class for the panel and the print row, `getTertileSentence` returns the same sentence as
plain text for the collapsed row. **`rankReverse` marks indicators where *higher* is better, and it
chooses only the comparison word, never the verdict** — `data_value_rank` carries that, 1 always the
unfavourable tertile and 3 always the favourable one. Reading the flag as a verdict flip is what
pilled four Active Design indicators "better" for a neighborhood in the bottom tertile on all four
(fixed 2026-08-12, a6c494a152); `getComparison` at the foot of `tertiles.js` is the function the
rest of the file's reading is anchored to. Panels never print: `@media print` in
`assets/scss/theme.scss` hides `.report-section .collapse` and `.collapsing`, so the printed report
has one shape whatever the reader expanded. The print-only QR code back to the report is filled by
`renderQRCode`, defined in the layout because the layout owns both the element and the library
resource, and called from near the *end* of `renderAll` rather than at load — the Leaflet map
switches neighborhood in place and rewrites the address bar, so a code generated once would point at
the report the reader navigated away from. One call now follows it:
`announceNeighborhoodChange` rebuilds `document.title` and writes the `#nr-report-status` live
region, last so both describe a report that is already built. It reads `reportConfig.seoShortName`, not
`reportName` — `reportName` is `.Title`, and the two differ on Active Design, so the title would be
rewritten on 42 of the 210 pages. Both are suppressed on first paint, since `renderAll` runs at load
too and nothing has changed then.

## Full-dataset links

**Each panel's "Full dataset" link needs a map the page does not otherwise fetch.** The report rows
carry `IndicatorID`, but nothing in them says which data explorer topic that indicator lives under,
so `loadTopicIndicators` in `data.js` fetches `/IndicatorMetadata/topic_indicators.json` and reverses
it into `indicatorTopicSlugs`, `IndicatorID` → topic slug; `getDataExplorerUrl` in `cards.js` then
resolves the href as the card is built. **That JSON is a published Hugo resource, not a static
file** — `themes/dohmh/layouts/partials/de-topic-indicators.html` builds it by ranging `.Site.Pages`
and calling `.Publish`, so it exists only because the three data-explorer layouts that include that
partial are in the build. Its two config keys are `topicIndicatorsUrl` and `dataExplorerUrl`. Three
things follow from the shape of the data. The lookup takes the first topic an id appears under,
matching the retired `getURL`, which returned on its first hit — 42 of the 263 ids are in more than
one topic. An indicator in no topic gets no link at all, the same outcome as the old anchor that
stayed `display:none`; Neighborhood safety (2073) is the live case, so a page rendering a link on
every row is the tell that the omission broke rather than the mapping improving. And the fetch is
counted into `totalFetches`, so a card can never render before the map is in.

## Comparison vocabulary styling

**The comparison vocabulary is styled in two files, and which one depends on the rendition.** The
sentence's `.comp-good` / `.comp-bad` / `.comp-null` live in `assets/scss/_custom.scss`; the
collapsed row's `.worse` / `.middle` / `.better` pills live in `assets/scss/theme.scss`. Editing one
set does not touch the other. The pills carried good-vs-bad in `background-color` alone until C3 —
both read the same two words, so a reader with a colour vision deficiency saw no difference (WCAG
1.4.1) — and now take the same Font Awesome codepoints the sentence uses, `\f071` on `.worse` and
`\f14a` on `.better`, with no `color` of their own so the glyph inherits text colour that already
passes on those backgrounds — `#212529` on `.worse` and `.better` alike, 12.5:1 on both
`[verified 2026-08-12: computed colour read off a rendered pill, after `.worse` moved from `#F2CDD7`
to `#FFE69B` in cd19eb2aca]`. `.middle` gets none, matching `.comp-null`. `cards.js` is the only
thing that emits any of the three pill classes, so their blast radius is the report page.

## The shared picker and neighborhood-list partials

**The picker and the neighborhood list are both shared by the topic index and the NR landing page**
(`section.html`), which had drifted to two heights, two placeholders, two search positions and two
introductions while running byte-identical flexdatalist config. Three partials — and the picker's
markup one alone does nothing, since the search needs the JS one beside it:

- `themes/dohmh/layouts/partials/nr-neighborhood-picker.html` — a `Choose Neighborhood` heading, a
  visible `<label>`, the search box, then the map in a `.nr-selector-map` wrapper (height in
  `assets/scss/_custom.scss`,
  since `nr-leaflet`'s `#map` is 100%/100% and has no intrinsic size). Takes `page` and nothing else
  — the search field is the plain `.form-control`, 42px on both pages, since the landing page's 64px
  override was dropped rather than kept as a parameter. The heading is in here, not in the callers,
  for the same reason the rest is; it is an `<h2>` carrying `.h3` for size, because both callers put
  it directly under their page `<h1>`. The label is visible rather than `sr-only` because a
  placeholder was this field's only name and a placeholder vanishes on typing — and it is pointed at
  twice, `for="flex_search"` on the authored input plus an `aria-labelledby` the JS partial sets on
  flexdatalist's generated one.
- `themes/dohmh/layouts/partials/nr-neighborhood-list.html` — the 42 neighborhood links, collapsed
  behind a Bootstrap toggle but present in the markup either way, which is what keeps it the crawl
  path *and* the no-JS equivalent of the map. **Both its elements carry
  `data-pagefind-ignore="all"`, and the server-rendering is why they need it.** The list this
  replaced was built in JS (`topiclanding.html`, `neighborhoods.forEach` + `appendChild`), so
  Pagefind — which reads static HTML — never saw it; rendering it server-side put all 42 names and
  every ZIP code into the index on the landing page and all five topic indexes, ~331 identical
  words each, taking a search for "Kingsbridge" from 1 match to 12 and its own hub page from first
  to fourth. `data-pagefind-ignore` is read by Pagefind alone, so the crawl path, the accessibility
  tree and the JS-off fallback are untouched by it. Same reasoning covers the whole of
  `nr-neighborhood-picker.html`, which is a control rather than content, and the five topic cards
  on `nr-neighborhood-index.html`, where the retired `nr-output/section.html:36` had the identical
  attribute. `documents/nr-pagefind-parity-2026-08-15.md` has the measurements and the queries.
  Takes `topic_slug`: a slug gives `<nbhd>/<topic>/`
  links, and `""` gives `<nbhd>/` links. Every anchor carries `data-nbhd`. **The landing page passes
  `""` and rewrites the hrefs at runtime** — `updateNeighborhoodListLinks` in its `js_bot`, called
  from `setIntendedDestination`, so the list follows the active topic button the way the map and
  search already do. It runs at load too, so the links carry the default topic on first paint.
  `path.Join` rather than `printf` builds the href, because an empty slug in a `printf` leaves a
  doubled separator.
- `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html` — called from each page's
  `js_bot`. Safe there because it only binds handlers; the libraries it depends on are pulled in
  higher up the page (see "Library loading" in `CLAUDE.md`). **Each caller must define
  `nrPickerDestination()`**, returning the topic slug to append. That is the one thing the two
  pages genuinely disagree on: a build-time slug on a topic index, the active topic button on the
  landing page. Order does not matter — it is called on selection, after everything has parsed.
  It also holds `wireComboboxState`, which supplies the `role="combobox"` flexdatalist never emits
  and keeps `aria-expanded`, `aria-controls`, `aria-owns` and `aria-activedescendant` true. **It
  reads the DOM through a `MutationObserver`, not the library's events, and that is deliberate** —
  only `results.remove()` fires `removed:flexdatalist.results`, while Escape and the outside-click
  handler each remove the list directly and fire nothing. The same observer makes Escape stick: the
  library's own keyup re-runs the search 400ms later and re-renders what its keydown just removed,
  and the pending search cannot be cancelled from outside (`_searchTimeout` is a closure variable),
  so the dismissal is held and any list that reappears is removed on arrival.

## nr-leaflet framing

`nr-leaflet` needs no argument beyond the page: it reads a topic slug out of the first path
segment itself. Where a page has **no** `geocode` — the landing page and the five topic indexes —
it sets `zoomSnap = 0` and fits the UHF42 layer, so the city fills whatever box the caller gives
it. Both statements live inside that branch, so pages that *do* carry a `geocode` keep the
highlight-and-fly framing. `zoomSnap` is load-bearing, not a tweak: at Leaflet's default of 1,
`fitBounds` rounds down to a whole zoom and the city spans ~59% of the box.

## nr-topic-menu

`themes/dohmh/layouts/partials/nr-topic-menu.html` renders the five topic buttons for both the
report page and the topic index, driven by the same topic data.

## Routing note

Routing note: the two NR rules in `static/Web.config` are gone. Every `<nbhd>/<topic>/` URL is now a
real generated page, so nothing needs rewriting — and the old 301 would have redirected all 210 of
them away. The `sessionStorage` hand-off that used to carry a neighborhood from a topic-first URL
into the report page is gone at both ends — the bridge in `themes/dohmh/layouts/404.html`, which now treats
those URLs as the genuine 404s they are, and the path-scan and bridge-read fallbacks in
`assets/js/nr-report/url.js`. `getNeighborhoodFromURL` reads `NR_REPORT_CONFIG.neighborhood`
and nothing else, so a page reaching that layout without the param renders no neighborhood rather
than guessing one.
