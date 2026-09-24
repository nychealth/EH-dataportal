# Section header and icon standardization — 2026-09-24

Branch `hotfix-section-icon-standardization`, cut from `production`.

**Status as of 2026-09-24: steps 1–5 done in the working tree, uncommitted; step 6 waits on Chris.** The working tree also holds the edits Chris made before this ledger (Data Features `df-accent` + `fa-chart-bar`, 4-space re-indent of `df-front-block.html` and `aqe.html`); both sets are verified together. The `row my-2` spacing edits Chris made on three section pages were superseded by `section-header.html`.

## Goal

Every section's pages show one icon and one accent color. The five section pages render
breadcrumb → H1 → description through one partial, so the H1's vertical position is identical
across sections and is changed in one place.

## Decisions (2026-09-24, from Chris)

- `*-accent` classes (`assets/scss/theme.scss`, "Section styles") are the standard. The older
  `.data-stories` / `.data-features` / `.key-topics` / `.n-reports` / `.data-explorer` set in
  `_custom.scss` is not used for H1 icons. `.data-features` there colors only `svg path`, so it
  cannot color an `<i>` webfont icon.
- Single pages get the section icon too, including Data Explorer and Neighborhood Reports.
- **Header only:** the partial standardizes vertical spacing. Each section page keeps its own
  outer container, so the H1's left edge still differs by section. Rejected: unifying the outer
  container, because that re-flows the card grids below the header.
- The description under the H1 is 8/12 wide at md and up.

| Section | Icon | Accent |
|---|---|---|
| data-stories | `fa-passport` | `ds-accent` |
| data-explorer | `fa-chart-line` | `de-accent` |
| data-features | `fa-chart-bar` | `df-accent` |
| neighborhood-reports | `fa-map-marked-alt` | `nr-accent` |
| key-topics | `fa-star` | `kt-accent` |

## Deferred

- `partials/related-footer.html` and `key-topics/single.html` hardcode the same mapping as an
  `if` chain. They could read `data/globals/sections.yml`, but they render correctly today, so
  they are left alone. Revisit if the mapping changes.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Baseline: H1 `getBoundingClientRect().top` on the 5 section pages | *no commit* — measurement | **DONE 2026-09-24** | `[verified 2026-09-24: Playwright against the running dev_prod server on :8080. Breadcrumb top 189 on all five. H1 top 265 on DS/NR/KT and 281 on DF/DE at 1280px; 333 vs 349 at 390px]` |
| 2 | `data/globals/sections.yml`, `partials/section-icon.html`, `partials/section-header.html`, `.section-header` SCSS (theme.scss, "Section styles") | *uncommitted* | **DONE 2026-09-24** | covered by step 5 |
| 3 | Convert the 5 section pages to `section-header.html`. DS and DF descriptions moved from the templates into their `_index.md` bodies; DE passes `"description" false` because its `.Content` shares a row with the sidebar | *uncommitted* | **DONE 2026-09-24** | covered by step 5 |
| 4 | Single-page H1s call `section-icon.html` (27 edits in 26 files via one count-checked script) | *uncommitted* | **DONE 2026-09-24** | covered by step 5 |
| 5 | Verify | *no commit* | **DONE 2026-09-24** | `[verified 2026-09-24 on the uncommitted tree: (a) H1 top 265 on all 5 section pages at 1280px and 333 at 390px; breadcrumb 189/257, unchanged from baseline. (b) Grep: 30 <h1> openings in the five sections' layouts plus the two partials; 28 call section-icon; the other 2 are d-none. (c) Browser, one page per layout: 26 of 26 published pages show the icon in the expected accent color. The 3 draft layouts (healthy-homes, asthma-syndrome, pesticides-report) were checked in an isolated dev_prod --buildDrafts build: exit 0, 0 ERROR, each emits the df-accent span. (d) Curated smoke, 34 pages clean]`. Not verifiable: the `advanced` and `rats-in-your-neighborhood-nyc-lib` layouts, which no content uses |
| 6 | Commit, on Chris's say-so | | Not started | |

Next command, from the repo root, after re-running step 5's smoke if the tree has changed since:

```
git add assets/scss/theme.scss content/data-features/_index.md content/data-stories/_index.md data/globals/sections.yml documents/section-header-standardization-2026-09-24.md themes/dohmh/layouts
```
