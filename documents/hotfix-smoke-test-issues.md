# Hotfix: smoke-test issues (branch `hotfix-smoke-test-issues`)

**Status as of 2026-08-13: steps 1–4 DONE and verified; step 0 done by Chris in
the working tree (all three files moved to `static/`).**

Three defects investigated 2026-08-13. Step 0 is a fourth, found during the
investigation, and is deliberately out of scope for this branch.

---

## Step 0 — Build fails on Hugo 0.164.0 (`security.allowContent`)

**DONE 2026-08-13** — resolved by Chris in the working tree, not by this pass.
All three files were moved to `static/` at the same published paths, so the
build passes and the two `*_leaflet.html` iframe targets still resolve.

`[verified 2026-08-13: isolated build with NO security override -> exit 0;
static/data-stories/air-quality-and-covid-part-2/{no2,pm25}_differences_leaflet.html
and static/data-features/healthy-homes-info/source/index.html all present, and
all three appear in the build output at their original URLs]`

Original diagnosis, kept because it explains why the move was needed:

`hugo` and `hugo serve` both abort at HEAD on a clean tree:

```
assemble: failed to create page from pageMetaSource
/data-features/healthy-homes-info/source/index.html:
access denied: "text/html" is not whitelisted in policy "security.allowContent"
```

`allowContent` appears nowhere in `config/` — it is Hugo 0.164.0's default
(`['! ^text/html$']`) rejecting bare `.html` under `content/`. Three tracked
files trip it:

- `content/data-features/healthy-homes-info/source/index.html` (the abort point)
- `content/data-stories/air-quality-and-covid-part-2/no2_differences_leaflet.html`
- `content/data-stories/air-quality-and-covid-part-2/pm25_differences_leaflet.html`

Two candidate fixes: whitelist `text/html` in `config/_default/config.toml`, or
move the three files to `static/` (what CLAUDE.md already prescribes for
standalone `.html` needing its own URL; see `memories/repo/page-bundle-publication.md`).
Moving requires checking that the two `*_leaflet.html` iframe references survive.

`[verified 2026-08-13: HUGO_SECURITY_ALLOWCONTENT='.*' + isolated build -> exit 0,
1264 EN pages, 22.7s; without it, exit 1]`

**Note on the override:** before the files were moved, local verification needed
`HUGO_SECURITY_ALLOWCONTENT='.*'` prefixed to every `hugo` call. That is no
longer necessary and was never committed.

---

## Step 1 — Lowercase-normalize conflicting taxonomy keyword literals

**DONE 2026-08-13.** 10 lines across 10 files.

`[verified 2026-08-13: casing sweep re-run -> keywords 341 distinct, 0 conflicting;
categories 18/0; tags 0/0. Sweep carries a positive control asserting a term
confirmed by eye ("ed visits", 5 uses, now a single form) — an earlier version of
this sweep returned a false zero because it parsed only two of the three YAML list
forms in use. git diff -U0 over content/**/*.md shows exactly 10 changed lines, all
keyword values]`

Rewrite was done by a scoped script, not a find/replace: all four literals also
occur in body prose, `seo_*` fields, and two JS files, and those are untouched.

Hugo merges taxonomy terms case-insensitively and picks one literal to display,
so a term used with two casings gives a non-deterministic term-page title,
`og:title`, `twitter:title` and `data-pagefind-meta`. Chris chose uniform
lowercase (2026-08-13), including the singular `ED visit`.

Four literals to rewrite, **in the frontmatter `keywords:` block only**:

| From | To | Uses |
|---|---|---|
| `PM2.5` | `pm2.5` | 4 |
| `ED visits` | `ed visits` | 1 |
| `ED visit` | `ed visit` | see script output |
| `Rat Mitigation Zones` | `rat mitigation zones` | 2 |

**Do not use a bare find/replace.** All four strings also occur in body prose,
`seo_title`/`seo_description`, and in two JS files
(`content/data-features/heat-story/embed/config.js`,
`content/data-features/realtime-air-quality/js/realtime.js`). Only the
`keywords` list values change.

Proof to run: re-run the casing sweep and confirm zero conflicts remain, then
confirm the non-keywords occurrences are untouched via `git diff`.

## Step 2 — `topiclanding.html` throws `Cannot read properties of null`

**DONE 2026-08-13.** `nr-show-zips.html` now takes a `urlSuffix` param; both call
sites pass one (`"/"` from `section.html`, `.Params.urlExtension` from
`topiclanding.html`); the duplicated script block and second
`showNeighborhoods()` are gone from `topiclanding.html`. `reportURL` is still
computed and still used by the flexdatalist select handler — that was left alone.

`themes/dohmh/layouts/neighborhood-reports/topiclanding.html` (the block after
`loadList()`, reading `neighborhoodList` / `neighborhoodList2`) populates two
`<ul>`s that only `themes/dohmh/layouts/partials/nr-show-zips.html` emits, and
only `neighborhood-reports/section.html` includes that partial. So on all five
`layout: topiclanding` pages both lookups return `null` and the `forEach` throws
on its first iteration.

Affects all 5 topiclanding pages; only `active_design_physical_activity_and_health`
is in the smoke `PAGES` list, so the other four fail silently.

Fix: give `nr-show-zips.html` a URL-suffix parameter, include it in
`topiclanding.html` after the `#flex_search` / `#clear` button group, and delete
`topiclanding.html`'s duplicated script block and its second
`showNeighborhoods()` definition.

Facts this rests on, all checked 2026-08-13:
- `.Params.urlExtension` exists on all 5 topiclanding pages and equals exactly
  the `reportURL` the JS switch computes; no template currently reads it.
- `uhflist.js` (which defines `neighborhoods`) loads in `<head>` via
  `partials/head.html`, so a body-position script can rely on it.
  `topiclanding.html` loads it a *second* time lower in the body — same
  fingerprint, redundant.
- `nr-show-zips.html` uses no page context, only the `relURL` global.

`[verified 2026-08-13: npm run smoke -> 32/32 PASSED (was 31 ok / 1 FAIL). Plus a
browser pass over all six pages — the five topiclanding pages and the section
page — since smoke covers only one of the five: each has the list markup exactly
once, both lists populated 42/42, and the first href carries that page's own
suffix. Zero same-origin console errors, pageerrors, failed requests or 404s]`

## Step 3 — `appendChild` moves the node, leaving the sr-only list empty

**DONE 2026-08-13.** One line, one file: `ul2.appendChild(li.cloneNode(true))` in
`nr-show-zips.html`. Step 2 had already deleted the duplicate copy.

`[verified 2026-08-13, same browser pass as step 2: #neighborhoodList now has 42
children on all six pages, where it had 0 before. The probe carries a positive
control that injects an appendChild-on-null and asserts the harness catches it,
so the clean run is not a blind one]`

`ul.appendChild(li); ul2.appendChild(li)` appends the *same* node twice, which
moves it. The screen-reader-only list under `<h2>Select neighborhood</h2>` ends
up empty on the pages where the markup does exist.

`[verified 2026-08-13, browser on /neighborhood-reports/: #neighborhoodList has 0
children, #neighborhoodList2 has 42, neighborhoods.length === 42]`

Fix: clone for the second list. Present in `nr-show-zips.html` and in
`topiclanding.html`'s duplicate — step 2 deletes the duplicate, so after step 2
this is a one-line change in one file.

---

## Re-verifying this work

```bash
npx hugo serve --environment dev_stage --port 8080
DE_BASE_URL="http://localhost:8080/dev-stage/" npm run smoke
```

Pass = 32/32 ok. Before these fixes: 31 ok, 1 FAIL on
`neighborhood-reports/active_design_physical_activity_and_health/`.

Smoke covers only one of the five topiclanding pages, so it is necessary but not
sufficient here — a regression in `nr-show-zips.html`'s `urlSuffix` would leave
smoke green while breaking the other four. Check all five, and check that
`#neighborhoodList` (the sr-only list) is populated and not just
`#neighborhoodList2`.

## Step 4 — duplicate `uhflist.js` on topiclanding pages

**DONE 2026-08-13.** Chris deleted the redundant `<script>` block from
`topiclanding.html` by hand; this pass re-ran the checks.

`partials/head.html:130` gates its script bundle on
`{{ if or (eq .Kind "page") (eq .Section "neighborhood-reports") }}` (closing at
line 214), and a topiclanding page satisfies **both** halves, so `head.html:175`
already emitted `js/uhflist.js` before `topiclanding.html` emitted its own copy.

The home page is the case that makes this asymmetric and is worth not breaking:
`.Kind` is `home` and `.Section` is empty, so the head gate is false there and
`layouts/index.html:320` is the home page's **only** copy. It must stay.

`[verified 2026-08-13: built output — topiclanding pages went 2 copies -> 1 (now
only the `<head>` one at line 81); home, NR section and nr-output reports
unchanged at 1. npm run smoke -> 32/32 PASSED. Browser pass over 7 pages: the 5
topiclanding pages, the NR section page, and the home page as a control — every
one has exactly 1 uhflist script tag and `neighborhoods.length === 42`, so
nothing lost its data source. Probe carries the same injected-error positive
control]`

## Left undone

Nothing in steps 1–4. One observation, not acted on: `tags` is declared as a
taxonomy in `config/_default/config.toml` but used by no content file, so
`/tags/` term pages are generated empty.
