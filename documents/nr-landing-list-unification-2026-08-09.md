# NR landing page — shared neighborhood list and picker heading

Branch `feature-MOD-Lab-NR-recode-refactor-merge`. Follow-up to
`documents/nr-neighborhood-picker-options-2026-08-09.md`, whose §8 listed the two neighborhood-list
implementations as deliberately not unified — "converging on the server-rendered one is a separate
piece of work". This is that work.

**Closed 2026-08-10. All five tasks done, browser-verified, and committed as
`0c7f95df78..79d440d899` plus the stamp-bump commit this line lands in.** Nothing outstanding.

The `docs-check verified:` stamp at `CLAUDE.md:2` now reads `79d440d899 2026-08-10` — the commit
that changed the NR prose — bumped in a follow-up commit of its own, the same shape `88e327c8a0`
and `d17786a908` used, because a commit cannot cite its own hash. The prose was re-read against
the tree before the bump, so it is not a false claim.

## Ledger

| # | Task | Status | Proof that ran |
|---|---|---|---|
| 1 | `partials/nr-neighborhood-list.html` + topic index switched to it | **DONE 2026-08-10**, committed `0c7f95df78` | `[verified 2026-08-10: local_stage :8080, topic index HTML captured before and after, normalized by stripping leading whitespace and the new data-nbhd attribute]` diff is exactly the two task-3 changes and nothing else — all 42 anchors byte-identical, so `path.Join` reproduced the old `printf` hrefs. `data-nbhd` count 0 → 42 is the positive control that the normalization was hiding something real |
| 2 | Landing page uses the partial; `js_bot` rewrites hrefs to the active topic | **DONE 2026-08-10**, uncommitted | `[verified 2026-08-10: Playwright, local_stage :8080]` served HTML has topic-less hrefs (curl); in the DOM **before any click** the East Harlem link already ends `/active_design_physical_activity_and_health/`, which is what proves the load-time call fired rather than only the click handler. After clicking `#Housing` all 42 end `/housing_and_health/` — one distinct final segment across the set. Followed the link: real report page, title "Housing and Health in East Harlem", not the 404 template |
| 3 | `h3` into the picker partial, prompt paragraph deleted from the topic index | **DONE 2026-08-10**, committed `0c7f95df78` | `[verified 2026-08-10]` topic index: prompt gone, `h3` present, in the same diff as task 1. Landing page: normalized output **byte-identical** to before, i.e. the move is a no-op there. Raw diff showing the tag shift is the control that the server actually rebuilt — an empty normalized diff alone would equally describe a stale page |
| 4 | Delete `partials/nr-show-zips.html` and its dead SCSS | **DONE 2026-08-10**, uncommitted | `git grep` for its four identifiers left only two comments, both since rewritten. `node scripts/smoke-pages.mjs` exit 0, 15 pages clean. Collapse re-verified in the browser after the SCSS cut: shut → `plus:block/minus:none`, open → `plus:none/minus:block`, 42 items visible, `border-bottom: none`, background still `rgb(239,250,244)` and text `rgb(0,137,57)` — so the base rule covers the open state the deleted `.active` variant used to. `git diff -w` shows only `.active` rules and the rewritten comment |
| 5 | `CLAUDE.md` prose + §8 of the picker-options doc | **DONE 2026-08-10**, uncommitted; **stamp still pending** | `node scripts/docs-check.mjs` exit 0, 1 doc checked |

Harness notes, carried from the picker-options memo because they cost a session last time. **Call
the scripts directly** — PowerShell strips the `--` in `npm run smoke -- --flag` and the script
prints its usage line and exits 1 while looking like a real failure. The harness spawns its own
`dev_stage` server on :8080 when none is running.

**This session's server was not that one.** A `local_stage` server the user started held :8080,
serving under `/local-stage/`, and `/local-stage/` is in `dev-server.mjs`'s `PREFIXES`, so the
harness found and reused it — `smoke` ran against it unmodified. Two consequences. Nothing here
could run a static `hugo` build, which would poison that server's `resources/_gen` cache. And
`node scripts/nr-characterization.mjs --check` **was deliberately not run**: its baseline records
`/dev-stage/` pathnames, so every target would fail on prefix alone, a false failure rather than a
regression. Skipping it is safe here for a reason independent of the prefix — the two shared
partials have exactly two callers, `nr-topic-index.html` and `section.html`, and neither is
`nr-topic-spa.html`, so none of the harness's three report-page targets can see this change
`[verified 2026-08-10: grep for both partial names across themes/dohmh/layouts/]`.

## Why

The two pages present the same two controls. The picker has been shared since 2026-08-09; the list
has not. The landing page's copy (`partials/nr-show-zips.html`) is built in JS at runtime, so it is
neither a crawl path into the report pages nor a no-JS equivalent of the map — which is the argument
Option D rested on, and which the topic index's server-rendered version satisfies.

Three defects close with it:

- `nr-show-zips.html:26-27` appends the **same** `<li>` node to two lists. `appendChild` moves an
  existing node, so `#neighborhoodList` — the `sr-only` "Select neighborhood" list — ends up empty.
  That list is the text equivalent cited to justify `aria-hidden="true"` on the map
  (`partials/nr-neighborhood-picker.html`, the comment above `.nr-selector-map`).
  `[verified 2026-08-10: Playwright against the pre-change landing page — 0 items in
  #neighborhoodList against 42 in #neighborhoodList2, with the sr-only "Select neighborhood"
  heading present above the empty list. Restored the old markup for the check by stashing only
  section.html, since the working tree had already moved past it]`
- The landing page's list links go to `<nbhd>/` regardless of which topic button is active.
- The list exists only after JS runs.

## Decisions taken in session (2026-08-09)

- **Heading: the `h3` wins on both pages.** `<h3>Choose Neighborhood</h3>` on the landing page and
  the arrow-down prompt paragraph on the topic index were the two competing introductions. The
  prompt is dropped from both. The `h3` moves into `partials/nr-neighborhood-picker.html` so the two
  pages cannot drift again — the same argument the picker partial itself rests on.
- **Landing-page list links follow the active topic button.** Server-rendered with topic-less hrefs
  so they work with JS off, then rewritten at runtime. The alternative — leaving them pointed at
  `<nbhd>/` — was offered and declined.

## Task detail

### 1. `partials/nr-neighborhood-list.html`

Move `neighborhood-reports/nr-topic-index.html`'s list block — the `.nr-list-toggle` button through
the closing `</div>` of `#nr-neighborhood-list` — into a new partial. Header comment in the style of
`nr-neighborhood-picker.html`: what it is, that it is server-rendered on purpose, its one parameter.

**Interface:** a dict with `topic_slug`, a slug string or `""`.

- Non-empty → `href` is `<nbhd>/<topic_slug>/`, as today.
- Empty → `href` is `<nbhd>/`, the neighborhood index. Task 2 upgrades these at runtime.

Every anchor carries `data-nbhd="{{ .page_name }}"` unconditionally — the hook task 2 rewrites
from, inert on the topic index. Watch the slash handling: `printf` with an empty `$topicSlug` leaves
a doubled separator, so check the rendered `href` in **both** cases rather than assuming one
expression covers them.

Unchanged: the button, `id="nr-neighborhood-list"`, the
`neighborhood-list-button nr-list-toggle collapsed` classes, the `col-md-4 col-sm-6` grid.

### 2. Landing page

`themes/dohmh/layouts/neighborhood-reports/section.html`:

1. Replace the `{{ partial "nr-show-zips" . }}` call with
   `{{ partial "nr-neighborhood-list" (dict "topic_slug" "") }}`.
2. Delete the `<h3>Choose Neighborhood</h3>` above the picker call — it moves into the picker
   partial in task 3.
3. In `js_bot`, add `updateNeighborhoodListLinks()` and call it from the end of
   `setIntendedDestination`:

```js
// The list ships with topic-less hrefs so it works with JS off; once a topic is active the
// links follow it, so a list click lands where the map and search already send you.
function updateNeighborhoodListLinks() {
    const base = {{ relURL "neighborhood-reports/" }}
    const suffix = intendedDestinationName ? intendedDestinationName + '/' : ''

    document.querySelectorAll('#nr-neighborhood-list a[data-nbhd]').forEach(a => {
        a.href = base + a.dataset.nbhd + '/' + suffix
    })
}
```

`setIntendedDestination('Active')` already runs at load, so the links carry
`active_design_physical_activity_and_health/` on first paint, matching the pre-selected button. The
ternary guard is load-bearing: `topicSlugs` is read through `hasOwnProperty`, so an unmatched id
leaves `intendedDestinationName` at `null` and the links must fall back to the neighborhood index
rather than become `<nbhd>/null/`. `topicSlugs` is declared in `partials/nr-leaflet.html`, which the
picker partial pulls in above `js_bot` — the same source `setIntendedDestination` already reads.

### 3. The `h3`, and the topic index

1. `partials/nr-neighborhood-picker.html` — add `<h3>Choose Neighborhood</h3>` directly above the
   `.btn-group` search row; update the header comment.
2. `neighborhood-reports/nr-topic-index.html` — delete the prompt paragraph and the comment above it
   explaining the heading placement, which stops describing the markup. The `h1` and
   `.report-description` stay in the `col-md-8` row.
3. Replace the list block with `{{ partial "nr-neighborhood-list" (dict "topic_slug" $topicSlug) }}`.
   `$topicSlug` is already in scope, read off `.RelPermalink` near the top of the file.

Heading order becomes `h1 → h3` on both, skipping `h2`. Pre-existing on both pages — `section.html`'s
"Choose report" is already an `h3` under the `h1` — so not a regression, but recorded rather than
silently inherited.

### 4. Delete `nr-show-zips.html` and its dead CSS

1. Prove it unreferenced, then delete:
   `git grep -n "nr-show-zips\|showNeighborhoods\|neighborhoodList2\|showNeighbs"` should return
   only docs and comments once task 2 has landed.
2. `assets/scss/_custom.scss` — the `.neighborhood-list-button.active` rules exist only for the
   hand-rolled toggle, which added `.active` in `showNeighborhoods()`. Nothing adds `.active` to that
   button afterwards, so those blocks go, along with the `.active` selector in the
   background-colour rule above them.
3. The comment introducing the `.nr-list-toggle:not(.collapsed)` rules justifies scoping by "the
   hand-rolled button in nr-show-zips.html never carries `.collapsed`". That becomes false. Either
   restate why the scoping is there or fold the rules into `.neighborhood-list-button` — pick one and
   leave the file self-consistent.
4. `partials/nr-neighborhood-picker.html`'s comment above `.nr-selector-map` cites "nr-show-zips'
   `sr-only` list on the landing page" as the map's text equivalent. Both pages now carry the same
   server-rendered list; say that.

### 5. Records

- `CLAUDE.md` — the Neighborhood Reports section describes the topic index's list and the landing
  page's as separate things. Rewrite the page-kind bullets and the picker paragraph for the shared
  list partial and the `h3`. Re-read the whole NR section against the tree, then bump the
  `docs-check verified: <commit> <date>` stamp at the top of the file to the commit whose prose
  changed.
- `documents/nr-neighborhood-picker-options-2026-08-09.md` §8 — point the "neighborhood list
  equivalents" bullet at this document rather than deleting it. That doc does not opt into
  `docs-check`, so no stamp.
- This document: close it with the date and commit range when task 5 lands.

## Verification

Rungs, cheapest first. Everything here is runtime-visible, so a build alone proves nothing.

1. `node scripts/docs-check.mjs` — exit 0.
2. `node scripts/smoke-pages.mjs` — exit 0. Confirm the NR landing page and a topic index are both
   in its `PAGES` list before treating it as proof for this change; a surviving
   `showNeighborhoods()` caller would surface here as a `ReferenceError`.
3. `node scripts/nr-characterization.mjs --check` — 3 targets match baseline. Neither page under
   change is a target, so this bounds blast radius rather than proving the change.
4. **Browser — the rung that actually proves it.** Read the dev server's printed URL and path
   prefix rather than assuming :8080/`dev_stage`.
   - `/neighborhood-reports/` — the `h3` reads "Choose Neighborhood" above the search box. Expanding
     "See neighborhood list" gives 42 items in a 3-column grid with ZIPs beneath each name.
   - Read one `href` **before** clicking any topic button: it must already end
     `/east_harlem/active_design_physical_activity_and_health/`, which is what proves the load-time
     call fired and not just the click handler.
   - Click `#Housing`, re-read the same `href`: it must now end `/east_harlem/housing_and_health/`.
     Changing from a captured before-value is the positive control — asserting only the final string
     would pass against links that never updated.
   - Follow that link; confirm a report page, not the 404 template.
   - `/neighborhood-reports/active_design_physical_activity_and_health/` — same `h3`, no prompt
     paragraph, list `href`s unchanged from today.
   - Console clean on both.
5. `git diff -w` on `_custom.scss` — every remaining deletion must be one of the `.active` blocks or
   the rewritten comment.

## Commits

Four, each provable alone:

1. New partial + topic index switched to it (relocation; carries the `h3` move, which cannot be
   split without leaving a page headingless in between).
2. Landing page on the partial + the link updater — the behavior change.
3. Delete `nr-show-zips.html` and the dead SCSS.
4. `CLAUDE.md` prose + stamp, and the §8 note.
