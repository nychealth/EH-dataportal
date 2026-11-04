# `href="#"` links to buttons (2026-11-03)

Chris, 2026-11-03: convert more `href="#"` links to buttons. An `<a href="#">` that runs script is
announced as a link but does something else. It doesn't respond to Space. If its handler fails or
loads late, it adds `#` to the URL and a history entry and scrolls to the top. This document
inventories every instance, sorts them into actions (which become `<button type="button">`) and
navigation (which get a real `href`), and is the ledger. Branch
`feature-link-underlines-and-buttons`, cut from the local `production` at `7618c577ee`. The
underline change on the same branch has its own plan, `documents/link-underlines-plan-2026-11-03.md`.
This plan depends on it (Decision 4).

**Status: decided 2026-11-03. See the ledger.**

## What a conversion costs and buys

What it buys, for an action:

- Screen readers announce "button", which matches what happens. A button that opens a dialog is
  the WAI-ARIA Authoring Practices pattern for a dialog trigger.
- Enter and Space both activate it. An `<a role="button">` (12 instances here) gets Space only
  if a script adds it.
- With no JavaScript or a slow handler, nothing happens, instead of a jump to the top and a `#`
  in the history.

What it costs, and how each task handles it:

- **Never for navigation.** A link that goes somewhere keeps the things only links have: open in
  a new tab, copy link address, the back button, the links list in a screen reader's rotor.
  Group F is a set of links whose fix is a real URL, not a button.
- **Screen-reader users notice the move.** The control moves from the links list to the buttons
  list ("link, Español" becomes "button, Español"). That's the correct place for an action, but
  someone who knows the site by its old announcements will need to find it again.
- **Buttons bring default styling.** They get the browser's border, background, padding and
  system font, and don't inherit colour or font. Every converted button needs a reset class
  (Decision 1) or it visibly changes.
- **`type="button"` is required.** A `<button>` with no type inside a `<form>` submits the form.
- **A button inside a sentence has no underline rule.** Those buttons need one so they are not
  told apart by colour alone, which is the same WCAG 1.4.1 concern as the underline plan. axe's
  `link-in-text-block` checks links only, so it won't flag a button that lacks one.
- **Scripts may assume an anchor.** Each group lists its JavaScript readers below. Analytics is
  safe: `assets/js/site.js:69` resolves clicks with `closest("a, button")`. But `getClickUrl`
  (`assets/js/site.js:7-9`) reads `href` first, then `data-target`. A subscribe CTA therefore
  reports `click_url: "#"` today and `"#subscribeModal"` as a button, which is what the header's
  existing Subscribe buttons (`themes/dohmh/layouts/partials/header.html:205`) already send. A GA
  report filtering on `click_url = "#"` would need its filter changed.
- **A button inside a sentence doesn't wrap with the text.** Found during Task 4. A link can break
  across lines mid-phrase; a button is one inline-block box, so a long one moves to the next line
  whole. On `about/` at 1280px, "sign up for our email list" used to start at the end of a line and
  continue on the next; as a button it starts the next line. At 375px the stories' "Sign up to find
  out when we post something new." starts its own line under "Like this story?". No CSS fixes this:
  `display: inline` on a button computes to `inline-block`, and `display: contents` makes it
  unfocusable `[measured 2026-11-03 in Chromium on the :8090 build]`. Paragraph heights did not
  change on the pages measured (`about/`: 56px before and after). Screenshots:
  `.playwright-mcp/uc3/*-signup__*` and `heat-2024-note__*` (git-ignored, this machine only).
- **Site characterization will move.** It records `controls.button` and `links` per page, so
  every conversion is an expected structural change and needs a re-baseline (Task 9).

Exemplar to follow: `themes/dohmh/layouts/partials/de-cite-popup.html` already made this change
for the explorer's Cite and Copy controls ("Buttons, not href="#" links: both are actions…"),
styled by `.de-link-button` (`assets/scss/_de-custom.scss:1329-1340`).

## Inventory

`git grep -n 'href="#"' -- themes assets content` returned 72 lines on `7618c577ee`. 5 are not
instances: comments at `assets/bootstrap/scss/_close.scss:25`, `assets/js/data-explorer/table.js:526`
and `themes/dohmh/layouts/partials/de-cite-popup.html:4`, and two lines inside an HTML comment at
`themes/dohmh/layouts/partials/header-de.html:442-443`. The other 67 fall into the groups below
(20 + 11 + 2 + 11 + 5 + 8 + 7 + 3 = 67). A wider sweep for single quotes, `javascript:` and
anchors built in JavaScript found no authored instance outside these files
`[2026-11-03: Grep for href\s*[=:]\s*\\?['"`]#['"`] over *.js; control: it matched
content/data-features/heat-story/embed/heat-story-leaflet.js:362-364]`. Files under `static/` are
vendored or generated (Leaflet builds, heat-report figures) and out of scope.

At runtime the live pages carry 20 to 26 `a[href="#"]` each, 10 to 14 visible
`[2026-11-03, 12 live pages]`. 20 are the footer languages, the rest are Group B CTAs, and Leaflet's
own zoom controls are library-owned and out of scope.

### A. Footer language selector: 20, action

`themes/dohmh/layouts/partials/footer.html:15-60`. 10 languages, rendered twice (two layouts in
one partial). Each has `class="lang-select text-reset" data-lang lang`, and a click sets the
Google Translate combo. Readers: `assets/js/main.js:197` (`$('.lang-select').click`,
`preventDefault`) and `assets/js/site.js:83` (`classList.contains("lang-select")`). Both select by
class and keep working on a button. On every page.

### B. Subscribe CTAs: 11, action (or navigation, Decision 2)

Open `#subscribeModal`: `themes/dohmh/layouts/index.html:156`,
`themes/dohmh/layouts/data-stories/single.html:96`, `themes/dohmh/layouts/data-stories/uhi.html:562`,
`themes/dohmh/layouts/partials/signup.html:2`, and five content files: `content/about/_index.md:16`,
`content/about/redesign/index.md:91`, `content/about/roadmap/index.md:43`,
`content/about/subscribe.md:15` (`class="btn btn-primary"`, already looks like a button),
`content/data-stories/redesign/index.md:96`. Two more in
`themes/dohmh/layouts/partials/conditional-modal.html:19,89` use `data-subscribe-parent-modal`
instead of `data-toggle`, handled by `assets/js/main.js:114-117`. Readers select by the
`data-subscribe-click` attribute (`assets/js/main.js:102`, `assets/js/site.js:96-99`). All but
`subscribe.md` sit inside a sentence.

### C. Correction-note modal: 2, action

`themes/dohmh/layouts/data-features/24-25-heat-report.html:34` (used by `heat-report/`,
`heat-report-archive/2024/` and `/2025/`) and `content/data-features/heat-report-archive/2023.md:30`.
Inside a sentence, opens `#noteModal`.

### D. Healthy-homes hotspots: 11, action

`themes/dohmh/layouts/data-features/healthy-homes.html:43-53` (page `data-features/healthy-homes-info/`).
Absolutely positioned dots over an illustration, each with `onclick`, `data-toggle="modal"`,
`role="button"` and `tabindex="0"`. Both of those attributes become redundant on a button. Each modal's
`aria-labelledby` names its dot's id (e.g. `:157`), so the ids must survive. Styles: the
template's own `.dot`, `.dot-lg` and `.dot-border` (`:403-430`).

### E. Data explorer: 8, mostly action

`themes/dohmh/layouts/partials/de-tab-content.html`: four "Download data" links with
`onclick="downloadData(); return false;"` (`:141, :215, :244, :289`; already styled as buttons);
"Sync to map" inside a sentence (`:194`), read by `assets/js/data-explorer/table.js:520`, whose
`preventDefault` exists only because of the `href="#"` (`:526`); and a Copy citation link
(`:312`), read by `assets/js/data-explorer/app.js:825` and `global.js:333,349` by class.

Stay links, out of scope: `themes/dohmh/layouts/partials/de-print-chart-modal.html:22` and
`themes/dohmh/layouts/partials/realtime-download.html:70` are real download links. Script sets
their `href` to the file (`assets/js/data-explorer/print.js:51`, `realtime-download.html:161`),
and `#` is only the value before that.

### F. Breadcrumb "Home": 5, navigation, fix the URL

`<a href="#">Home</a>` in the breadcrumbs of five data-features templates:
`asthma-syndrome.html:9`, `cooling-info.html:10`, `healthy-homes.html:9`,
`restaurant-grades.html:9`, `restaurants.html:9`, all under `themes/dohmh/layouts/data-features/`.
These are broken links, and the fix is `{{ relURL "" }}`, not a button. The same breadcrumbs'
"Key Topics" link is a root-absolute `/key-topics/` (`healthy-homes.html:10`), which drops the
`/IndicatorPublic/` prefix. It belongs in the same task, after checking the other four templates.

### G. Retired explorer: 7

`themes/dohmh/layouts/data-explorer-old/single.html:399-738`. Still served at `/data-explorer-old/`
and deliberately not linted. Decision 3.

### H. Heat-story map controls: 3, action

`content/data-features/heat-story/embed/heat-story-leaflet.js:362-364`: zoom in, reset and zoom
out, built as anchors in an HTML string. Read by `:370` via `.leaflet-control-button`.

## Decisions

Chris, 2026-11-03, accepting all four recommendations: a new `.link-button`; subscribe CTAs
become buttons; Group G is left alone and `readme-content.md` gains the editor note; the
underline rule lands first.

**Amended by Chris later on 2026-11-03**, after the wrapping cost (above) was measured:
**actions inside a sentence stay links**, so Group B's in-sentence prompts, Group C and Group E's
"Sync to map" were reverted, and Decision 4's `main p .link-button` rule was removed with them.
`content/about/subscribe.md`'s standalone button stays converted. **Group H is left as it is.**
What is converted: Groups A, D, E's downloads and Copy citation, `subscribe.md`, and Group F's URLs.

1. **Reset class.** Recommended: a site-wide `.link-button` in
   `assets/scss/_d-enhancements.scss` that clears the button defaults (`background: none; border: 0;
   padding: 0; font: inherit; color: inherit; text-align: inherit; cursor: pointer`). Each group
   then adds its existing look classes (`text-reset`, `font-weight-bold`, `btn …`). Alternative:
   reuse `.de-link-button`, which is explorer-named and fixes its colour to `$primary-dark`, so the
   footer would need an override. Bootstrap 4.3.1's `.btn-link` brings `.btn` padding and
   line-height, which would shift inline text.
2. **Subscribe CTAs: button, or a link to `about/subscribe/`.** Open. A button is the honest role
   today. A real `href` to the subscribe page, with the click handler still opening the modal,
   keeps link behaviour (new tab, copy address) and gives the CTA a destination. But that page's
   own form is also a modal, so without JavaScript it reaches a page that can't subscribe either.
   Recommended: button.
3. **Scope.** Open. Recommended: Groups A to F and H. Leave G, the retired explorer, unless it has
   a removal date that is far off. Content files in Groups B and C are CloudCannon-edited, so
   `readme-content.md` should gain one line telling editors to use the button form.
4. **Order.** Open. Recommended: land the underline plan's rule first. The in-sentence buttons
   (Groups B, C and E's "Sync to map") then get an underline from one extra selector beside it,
   `main p .link-button`, mirroring the link rule. Without that rule they would be the only
   unmarked inline controls.

## Tasks

One commit per group, so each group's proof stands alone. Every task's check list:

- **Keyboard:** Tab reaches it, Enter and Space each activate it once, and focus shows a visible
  ring (R5 restored `:focus-visible` rings and nothing here may remove them).
- **Accessibility tree:** role `button` and the same accessible name as before, read with
  Playwright's accessibility snapshot, not from the source.
- **Look:** element screenshot before and after at 1280px and 375px. Expected: identical, except
  where the in-sentence underline is intended.
- **Analytics:** the event still fires, with the same parameters except `click_url` where noted
  (local GA check per the `feedback-browser-verification-methods` memory, EH-dataportal store).
- `npm run lint` when a file under `assets/js/` changes. `smoke` on the group's pages.

## Task 1: `.link-button` and its in-sentence underline

**Files:** `assets/scss/_d-enhancements.scss`, beside the underline rule.

Add `.link-button` (Decision 1) and `main p .link-button { text-decoration: underline; }`
(Decision 4). No markup yet, so the built CSS gains two rules and no page changes.
Produces: the class every later task uses.

## Task 2: Group F, breadcrumb URLs

**Files:** the five templates in Group F.

`href="#"` → `href="{{ relURL "" }}"`. Check each template's "Key Topics" link for the same
root-absolute `/key-topics/` and give it `relURL` too. Expected: on an isolated `prod_prod` build,
each breadcrumb's Home resolves to `/IndicatorPublic/` and Key Topics to
`/IndicatorPublic/key-topics/`.

## Task 3: Group A, footer languages

**Files:** `themes/dohmh/layouts/partials/footer.html:15-60`.

`<a class="lang-select text-reset" href="#" …>` → `<button type="button" class="link-button
lang-select text-reset" …>`, keeping `data-lang` and `lang`. `preventDefault` in `main.js:198`
becomes unnecessary. Leave it in: it costs nothing and guards against any markup that is still an
anchor. Expected: language switching works on one page per layout (desktop and mobile copy),
and `click_language` still fires with `language` and `place`.

## Task 4: Group B, subscribe CTAs

**Files:** the four templates, `conditional-modal.html` and the five content files in Group B.

Per Decision 2. As buttons: keep `data-subscribe-click`, `data-toggle`, `data-target` and
`data-subscribe-parent-modal`; `subscribe.md` keeps `btn btn-primary`; `index.html:156` keeps
`font-weight-bold`. Expected: each opens the modal, focus returns to the button when the modal
closes, and `click_subscribe` fires with `click_url: "#subscribeModal"` (or `""` for the two
conditional-modal ones, which have no `data-target`).

## Task 5: Group C, correction notes

**Files:** `themes/dohmh/layouts/data-features/24-25-heat-report.html:34`,
`content/data-features/heat-report-archive/2023.md:30`.

Expected: on the three pages using the template and the 2023 archive page, the button opens
`#noteModal` and is underlined in its sentence.

## Task 6: Group D, healthy-homes hotspots

**Files:** `themes/dohmh/layouts/data-features/healthy-homes.html:43-53` and its `.dot` styles.

`<a … href="#" … role="button" tabindex="0">` → `<button type="button" …>` without `role` and
`tabindex`, keeping `id`, `onclick`, `aria-label` and `data-*`. Then add to `.dot` what the button
needs (`padding: 0`, `cursor: pointer`, background and border reset where `.dot-border` doesn't set
them). Expected: all 11 dots in the same pixel positions (screenshot diff of the illustration),
each opening its modal, and each modal still named by its dot.

## Task 7: Group E, data explorer

**Files:** `themes/dohmh/layouts/partials/de-tab-content.html:141,194,215,244,289,312`,
`assets/js/data-explorer/table.js:520-528`.

Downloads: drop `return false` from the `onclick`. Sync to map: a `.link-button` in its sentence.
Delete the `preventDefault` and its comment in `table.js`, since the reason they give no longer
exists. Copy citation: copy the `de-cite-popup.html` exemplar's markup. Expected: `npm run lint`
clean; `node scripts/de-characterization.mjs --check` passes or moves only button/link counts;
download, sync and copy each work by keyboard on indicator 2380.

## Task 8: Group H, heat-story map controls

**Files:** `content/data-features/heat-story/embed/heat-story-leaflet.js:362-364`.

Anchors → buttons in the HTML string, keeping `class="leaflet-control-button"` and `title`. Add
an `aria-label` equal to the title, because the content is an icon. Expected: zoom in, reset and
zoom out work by mouse and keyboard on `data-features/heat-story/`.

## Task 9: Characterization, smoke, re-baseline

After every group's own proof has run (CLAUDE.md: re-baseline last):

1. `node scripts/smoke-env.mjs prod_prod`: every page clean.
2. `node scripts/characterize-env.mjs prod_prod`, then
   `node scripts/site-characterization-rebaseline.mjs --expect "<globs>"` with the globs of every
   page touched. The footer reaches every page, so expect `controls.button` and `links` to move
   site-wide. Tally `git diff -U0` by key before committing: only `controls.button`, `links` and
   any field the task lists may change.
3. `node scripts/pagefind-characterization.mjs --check`: the language names are in the footer, so
   check whether the index moved, and whether it moved only there.

## Ledger

| Task | Commit | Status | Proof that ran |
|---|---|---|---|
| Inventory | *no commit* (measurement) | **DONE 2026-11-03** | grep plus the control above; live runtime count over 12 pages |
| 1 | | **DONE 2026-11-03** | `.link-button` takes `$primary-dark`, `$hover` and the hover/focus underline from `theme.scss`'s `a` rule, not `color: inherit` as Decision 1 sketched, so an in-sentence button matches the links beside it; `text-reset` still wins in the footer |
| 2 | | **DONE 2026-11-03** | the five Home links → `relURL ""`, and three root-absolute Key Topics links → `relURL` (asthma-syndrome also had `/key-topics/climatehealth/`). Only `cooling-info/` is published; on the build its Home reads `/IndicatorPublic/`. The other four pages 404 live and locally (draft or unlisted), so they were checked by grep only |
| 3–5, 7 | | **DONE 2026-11-03** | Before (live, the build of `7618c577ee`) and after (isolated `prod_prod` on :8090), one probe, `.playwright-mcp/uc2/probe-controls.js`: footer Español, the home / about / story subscribe CTAs, the 2024 correction note and Sync to map. Before, every one was `link` and Space did nothing. After, every one is `button` with the same name, Enter and Space each activate once, modals return focus on Escape, and `gtag` gets the same events and parameters except `click_url` `"#"` → `"#subscribeModal"`. The explorer's four downloads keep their padding and font; Copy citation copies `de-cite-popup.html`. `npm run lint` clean |
| 6 | | **DONE 2026-11-03** | the page is `draft: true`, so checked on an isolated `-D` server on :8091: 11 buttons, `#moldDot` named "Mold stains on a wall", Enter and Space open `#moldModal`, focus returns, the modal is still named by its dot; geometry in page coordinates identical to HEAD's anchors rebuilt in the same page, 11 of 11; background transparent |
| 3–5, 7 amended | | **DONE 2026-11-03** | in-sentence actions reverted per the amended decision: 12 files restored to `HEAD` (`git diff --quiet` on them: clean), the Sync line restored in `de-tab-content.html`, `main p .link-button` removed (`link-button` is now used only in `footer.html`, 20 times, outside `<main>`). The probe rows above for the home / about / story prompts, the correction note and Sync describe the reverted state's buttons, not what ships |
| 8 | | **NOT DONE: Chris, 2026-11-03, leave as is** | the controls sit in a `leaflet-bar`, styled by Leaflet's `.leaflet-bar a` rules, which a button would not match; Leaflet 1.9.4's own zoom control is `<a href="#" role="button">` (`node_modules/leaflet/src/control/Control.Zoom.js:85,91`). Options: buttons plus a copy of those rules; Leaflet's convention (`role="button"`); leave it |
| 9 | *no commit* (proof) | **partly DONE 2026-11-03**: re-baseline held | `smoke-env.mjs prod_prod`: 1189 pages clean (heat-report flaked under concurrency and cleared on re-check). `characterize-env.mjs prod_prod`: 925 of 926 pages moved, only `controls.button`, `links.internal`, `links.emptyHref`; sampled pages moved by the footer's 20 plus their own conversions (cooling-info: one more empty href gone, the breadcrumb). `pagefind-characterization.mjs --check` fails with 51 lines that `7618c577ee` reproduces byte for byte, and `--against` a build of `7618c577ee` reads no difference: the index is unchanged and its baseline drifted earlier. `de-characterization.mjs --check` PASSED. Re-baseline not run: Chris's answer on in-sentence buttons may change markup again |
| 9, amended tree | *no commit* (proof) | **DONE 2026-11-03** | `npm run lint` and `docs-check` clean. `characterize-env.mjs prod_prod`: 925 of 926 pages, only `controls.button`, `links.emptyHref`, `links.internal`, every page as predicted: (+20, −20, −20) on 882 (the footer; home, about, housing and heat-2024 among them, now that their prompts are links again), (+5, −5, −5) on the 41 explorer topic pages (4 downloads, Copy citation; explorer pages have no footer language list), (+21, −21, −21) on `about/subscribe/`, (+20, −21, −20) on `cooling-info/` (its breadcrumb), 0 on the explorer landing page. Smoke not re-run: the amendment restores `HEAD` bytes and deletes one CSS selector, and the first smoke run covered every conversion still shipped |

Next: commit the code, and only after that re-baseline, since each baseline's
`_meta.json` records `gitHead`: `node scripts/site-characterization-rebaseline.mjs --expect "**"
--expect ""` (`""` is the home page's path, which the tool's own comment says only an empty glob
claims). Tally `git diff -U0` by key before committing the baselines: only `controls.button`,
`links.internal` and `links.emptyHref` may move.
