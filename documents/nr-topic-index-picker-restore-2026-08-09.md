# Neighborhood picker on the NR topic index — restore

Branch `feature-MOD-Lab-NR-recode-refactor`. Follow-up to the Option D swap
(`documents/nr-output-option-d-execution-plan-2026-08-06.md`, landed 2026-08-08), which
replaced `topiclanding.html` with `nr-topic-index.html` and dropped the map and search that
template had carried.

**Status as of 2026-08-09: implementation done and browser-verified; both outstanding checks now
run and passing; nothing committed. What remains is the commits and the CLAUDE.md re-stamp.**

Scope was set by the user in session: restore the map *and* the flexdatalist, keep the
42-neighborhood link list but collapse it. "Work exactly like the old version, implementation is
a looser requirement."

---

## 1. What is on disk, uncommitted

`git status` shows three modified files. Nothing is staged and nothing is committed. The branch
also has 15 commits not on `origin/feature-MOD-Lab-NR-recode-refactor` — those predate this work.

| File | Change |
|---|---|
| `themes/dohmh/layouts/neighborhood-reports/nr-topic-index.html` | Map + typeahead restored; link list collapsed; new `js_bot` block |
| `assets/scss/_custom.scss` | Three rules for the collapse toggle's ± glyphs |
| `CLAUDE.md` | Topic index bullet under **Neighborhood Reports** rewritten to match |

### Landmarks

- The map is `{{- partial "nr-leaflet" . -}}` inside a `col-md-4` (`nr-topic-index.html:47`).
- The typeahead markup is the `.btn-group` under it — `input#flex_search` plus `button#clear`.
- The init is in the `{{ define "js_bot" }}` block at the foot of the file, function
  `loadNeighborhoodSearch`.
- The collapse trigger carries `.nr-list-toggle`; its SCSS is the block at
  `assets/scss/_custom.scss:133-143`, immediately after the existing
  `.neighborhood-list-button` rules.

## 2. Decisions made, and why — do not re-litigate without new evidence

- **`nr-leaflet` needed no changes.** `getReportAndNeighborhood` already recognises a topic slug
  in the first path segment (`topicValues.includes(urlPieces[1])`), and `selectNeighborhood`
  already builds `<nbhd>/<topic>/`. Leaflet, its CSS and the `neighborhoods` global are already
  in `head.html` for this page kind — nothing is gated away from it.
- **The absent `geocode` is safe.** `var chosenGeo = {{ .Params.geocode }}` has no quotes, but
  Hugo's JS-context escaping renders the nil as ` null `. Same as the NR landing page, which
  also has no geocode.
- **The 42-neighborhood link list stays.** It is the only server-rendered link from any hub page
  into the 210 report pages: the NR landing page builds its neighborhood list in JS
  (`partials/nr-show-zips.html`), and the 42 neighborhood index pages — which do carry five
  server-rendered report links each — are themselves only reachable from the sitemap and from
  that same JS list. Delete the topic list and the whole 252-page subtree is HTML-unreachable.
  Collapsing it costs nothing, because Bootstrap collapse leaves the markup in place.
- **Topic slug comes from Hugo, not the DOM.** `topiclanding.html` read `#nrtitle`'s `innerHTML`
  and reconstructed a slug with a chain of `title.includes(...)`. The new handler interpolates
  `$topicSlug`, derived off `.RelPermalink` — the same value the link list uses.
- **No `<style>` block with the flexdatalist.** The five `.flexdatalist-*` rules that
  `neighborhood-reports/section.html` inlines at its foot are already in
  `assets/scss/__portal-custom.scss:1243-1265`, site-wide. `section.html` is the only surviving
  template with the duplicate block — `topiclanding.html` had one too and is deleted; the
  `data-features` templates (`aqe.html`, `hvi.html`) and `partials/de-text-search.html` carry a
  flexdatalist input but no inline styles `[verified 2026-08-09: `git grep -l
  'flexdatalist-results\|flex_search-flexdatalist' -- themes/`]`.
- **`name="indicator_name_suggestion"` kept**, despite describing indicators rather than
  neighborhoods. It is the same string in all five flexdatalist templates; renaming one makes it
  the odd one out. Candidate for a separate sweep, not this change.
- **`.nr-flexdatalist` (height 64px) deliberately not applied** — that is the landing page's
  hero-sized search. Default `form-control` height matches what `topiclanding.html` had.

## 3. Proof that actually ran

All against the dev server the user had running: **`local_stage`, port 8080**, path prefix
`/local-stage/`. Rung chosen: browser automation, because a map click and a typeahead selection
are runtime claims that no build or grep can settle.

- **Map click** `[verified 2026-08-09]` — scanned a grid over `#map` with
  `document.elementFromPoint` (the browser's own hit-testing) to find a pixel over the
  Kingsbridge–Riverdale polygon, then `page.mouse.click` there. Navigated to
  `/local-stage/neighborhood-reports/kingsbridge_riverdale/housing_and_health/`.
- **Typeahead filters** `[verified 2026-08-09]` — on focus the list shows all 42
  (`minLength: 0` + `redoSearchOnFocus`); typing `10029` narrows to exactly one row,
  `303 East Harlem`. The 42 is the positive control.
- **Typeahead navigates, on a topic other than the one it was built against**
  `[verified 2026-08-09]` — from `/climate_and_health/`, selecting East Harlem landed on
  `/east_harlem/climate_and_health/`, title "Climate and Health in East Harlem". This is what
  proves `$topicSlug` is not baked in.
- **Name search and Clear** `[verified 2026-08-09]` — from `/asthma_and_the_environment/`,
  "Bayside" → one row; `#clear` empties the visible input and leaves
  `document.activeElement.id === "flex_search-flexdatalist"`.
- **Collapse** `[verified 2026-08-09]` — `aria-expanded` flips to `"true"`, `.plus` →
  `display:none` and `.minus` → `display:block`, and all 42 links are in the DOM *while
  collapsed*.
- **Accessible name** `[verified 2026-08-09]` — flexdatalist hides the original input behind its
  own, so the visible one was checked directly: `ariaSnapshot()` gives
  `- textbox "Search name or ZIP code"`, named from the placeholder. Same level as the site's
  other flexdatalist instances, so no extra label markup was added.
- **`npm run docs-check`** — PASSED.

**A correction to the method, worth carrying:** two earlier passes at the typeahead looked green
and were not. Waiting on `.flexdatalist-results li` *existing* resolves against the unfiltered
on-focus list of 42, before filtering settles — one such run clicked the first row, which
happened to be the right neighborhood by coincidence, and one screenshot captured a filter
frame showing Kingsbridge–Riverdale under a search for "Harlem". Wait on the **count settling**
(`waitForFunction` on `querySelectorAll(...).length`), never on the element existing.

**A second method note:** the documented commands are npm's `--`-forwarding form
(`npm run characterize:nr -- --check`), and PowerShell strips the `--` before npm sees it, so the
script reports its usage line and exits 1. `--%` is worse — it consumes the redirection too. Call
the script directly (`node scripts/nr-characterization.mjs --check`); it is verbatim what the npm
script runs.

## 4. Outstanding — do these before merging

1. **DONE 2026-08-09 — smoke.** `node scripts/smoke-pages.mjs`, exit 0,
   `15 pages clean (known noise allowlisted)`, full log kept rather than tailed.
   `neighborhood-reports/asthma_and_the_environment/` is in the script's `PAGES`, so the run
   exercises the template this change edits rather than passing around it. The earlier failure —
   one run, output lost to a `tail -6` — never recurred across five clean runs and has no
   diagnosis; it stays unexplained, not resolved.
2. **DONE 2026-08-09 — characterization.** `node scripts/nr-characterization.mjs --check`,
   exit 0, `3 target(s) match baseline`. Ran against a server the harness spawned itself: by
   this point no `hugo` process was running at all, so `ensureDevServer()` took its spawn path
   and produced the `dev_stage` server the baseline was captured under. The `/local-stage/`
   prefix problem this entry previously anticipated never arose, and none of the workarounds
   drafted for it were needed.
3. **Commit.** Nothing is committed. Suggested split: the template + SCSS as one commit (they
   are one change — the SCSS only exists to serve the new toggle), CLAUDE.md's prose as its own.
   **This document is itself untracked** — it is the only record of this work's state and exists
   nowhere but the working tree, so it should land first.
4. **Re-stamp CLAUDE.md.** Its `docs-check verified` stamp at line 2 still reads
   `c6532ea649 2026-08-08` and was deliberately left alone — the stamp asserts a human re-read of
   the prose. Bump it after reading the rewritten Topic index bullet, not before.

## 5. Known noise, so the next session does not chase it

Every page on this site logs one console error:

```
Framing 'https://docs.google.com/' violates the following report-only Content Security
Policy directive: "frame-ancestors 'none'".
```

It is the embedded Google Docs feedback iframe, report-only, and unrelated to this work —
confirmed by reproducing it on `/data-stories/`, which this change does not touch. It is
allowlisted in `scripts/smoke-pages.mjs`.

Separately, VS Code reports ~24 CSS parse errors in `nr-topic-index.html` ("at-rule or selector
expected"). That is the editor's CSS language service misreading Go template braces; Hugo builds
the page and serves it 200. Not a real diagnostic.
