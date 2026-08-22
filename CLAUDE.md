# CLAUDE.md

<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts assets/scss config data content scripts -->
<!-- docs-check verified: 74a11a51ef 2026-08-21 -->

Guidance for Claude Code (claude.ai/code) when working in this repository.

This file covers conventions that hold across the whole repo. Feature branches carry their own additions to it and merge them in when their PRs land — so if you are on a feature branch, expect this file to say more than it does here. The same holds for `documents/`: audits and plans exist in divergent per-branch copies, so a finding marked FIXED describes the branch its copy was written on `[verified 2026-08-20: §11 row 15 reads FIXED and robots.txt is bodiless on this tree; §5k scopes flexdatalist at three call sites and this tree has five]`. Enumerate with `git ls-tree -r <branch> -- documents/` before concluding a subject is undocumented, and re-run a finding's own sweep against your tree before acting on its status.

## What this project is

NYC Department of Health & Mental Hygiene's [Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/) — a Hugo static site publishing environmental and health indicators through data stories, an interactive data explorer, neighborhood reports, and key-topic pages.

Most indicator data lives in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository, not here. Templates and JS reach it through the `data_repo` and `data_branch` config params — at build time via `getresource`, and at runtime via `fetch` from raw GitHub URLs.

## Human-facing docs

These are written for the team and are the authority on their subjects. Read the relevant one before answering a question it covers; don't restate their contents here.

- [readme-development.md](readme-development.md) — getting started, branches, GitHub Actions builds, the full environment table, content creation, SRI, dependency bundling, CloudCannon, build caching.
- [readme-content.md](readme-content.md) — content-management standards for editors.
- [readme-components.md](readme-components.md) — the card and callout components available in markdown.
- [README.md](README.md) — orientation and contact info.

## Commands

```bash
npm install                              # JS dependencies, including hugo-extended

hugo serve --environment development     # local dev, production data
hugo serve --environment dev_stage       # local dev, staging data

hugo --environment prod_prod             # build to docs/ the way the deploy workflow does

hugo new data-stories/TITLE/index.md     # scaffold new content
hugo new key-topics/TITLE/index.md
```

Local site: http://localhost:1313/EH-dataportal

**Use `prod_prod`, not `production`, for a build meant to resemble the live site.** The two configs are byte-identical, but `head.html:3` branches on the environment *name*: only `prod_prod` gets the production analytics property and escapes the `<meta name="robots" content="noindex, nofollow">` that every other environment emits. The deploy workflow uses `prod_prod`. See `documents/site-wide-audit-2026-06-27.md` §14.4.

### Smoke test

```bash
npm run smoke                                          # 33 pages
DE_BASE_URL="http://localhost:1313/dev-prod/" npm run smoke   # against a server you already have
```

`scripts/smoke-pages.mjs` loads one page per template kind under Playwright and fails on any console `error` or `pageerror` that isn't allowlisted. It is the only automated check in the repo, and it exists because a `hugo` build proves the templates compile and nothing more: the site's browser JS is classic `<script>` tags sharing one global scope, so a bad edit throws at load while the build stays green. **Run it before merging anything that touches `head.html`, `baseof.html`, the header/footer partials, or `assets/js/`.**

Three things to know before trusting a result:

- **Before citing it as proof for a change that only executes on one page kind, check that page is in `PAGES`.** The comments there name the template that renders each URL, and a comment naming the wrong one is how a page ends up with no coverage while looking covered.
- **Each `KNOWN_NOISE` entry is scoped to the page where its cause was identified**, so the same error text elsewhere still fails. Adding a site-wide entry to quiet one page disables the check everywhere. The allowlist should trend to zero: fixing a bug is what removes its entry.
- **A CORS error from `airnowapi.org` on `(home)` is external — re-run before diagnosing it.** `themes/dohmh/layouts/partials/temp-popup.html` fetches that API at page load, and the AirNow `KNOWN_NOISE` entry is scoped to `realtime-air-quality` and different hostnames, so it does not cover this one `[verified 2026-08-17: one failure between two passes, on a tree where that file was unchanged from the pre-merge tip]`.

`scripts/dev-server.mjs` resolves the server. It reuses one that is already answering on :8080, :8081 or :1313, starts one (`--environment dev_stage`, so **staging data**) when nothing is running, and never stops a server it didn't start. If a `hugo` process exists but answers on no prefix it knows, it aborts rather than start a second builder — set `DE_BASE_URL` in that case.

### Four ways a local check silently lies

- **A Hugo build's exit code is a fact about the tree *and* its `data_branch`, not the tree alone.** Each environment pins its own branch, so the same commit can build clean under one and abort under another when EHDP-data filenames differ. Name the environment in any claim that a branch does or does not build.
- **Open a fresh browser tab after rebuilding.** JS and CSS are fingerprinted and cached hard; an existing tab can serve the previous build's assets. A server started *before* an edit to a shared template can also keep serving stale pages. The fingerprint is also the proof: read the served asset filename out of the page and confirm it changed between your before and after reads — an unchanged one means you measured the old file.
- **Never run two Hugo builders against this tree at once** — a static build beside a running server, or two servers on different ports, even against different `--environment`s. They all write the same on-disk fingerprint cache (`resources/_gen/`), which is not namespaced by environment, so one can leave another pointing at asset paths that no longer exist. The tell is every fingerprinted asset 404ing under the *other* environment's path prefix; the page dies with `$ is not defined` and reads like a broken code change, so check the served asset URLs before suspecting your diff. Ask before restarting a server you didn't start.
- **Counting over generated HTML? Define the real-page set first.** A `prod_prod` build writes 1397 HTML files of which 933 are pages — 442 are Hugo alias-redirect shells carrying their own `noindex` and `lang="en"`, and 22 are `static/` passthrough that never reaches `head.html`. A tree-wide count scores those 464 as failures. Select real pages by a marker only the layout emits; `head.html`'s viewport meta works `[verified 2026-08-21]`.

To build while someone's server is up, redirect both writable outputs to temp directories — the build then cannot reach `resources/_gen/` or `docs/` at all:

```bash
# TEMP = any directory outside the repo
HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment development -d "$TEMP/iso-docs"
```

`[verified 2026-08-12: full site build, exit 0 in 31s; all 197 files under resources/_gen identical in mtime and size afterward, 173 resources written to the temp dir instead, docs/ untouched]`. That establishes the build writes neither shared location, which is what the "safe beside a server" claim rests on.

**The concurrent case is now tested too, and it holds** `[verified 2026-08-18 on feature-new-data-explorer, with a dev_stage server live on :8080 throughout: production build exit 0, 0 ERROR, 1326 EN pages in 31.1s; resources/_gen byte-identical before and after on a manifest of path+size+mtime for all 174 files; 174 resources written to the isolated resourceDir and 3038 files to the temp output dir; the worktree stayed clean and docs/ was untouched. The server was then unharmed — same 200, same page byte-length, an identical list of 36 fingerprinted asset URLs, and the same 34x200 / 2x404 split, the two 404s being pagefind, which hugo serve never builds]`. That is the documented poisoning symptom — fingerprinted assets 404ing — probed directly and absent. Inspect the generated HTML in the temp directory rather than hitting the live server.

## Repo structure

```
content/          Markdown with YAML frontmatter; mirrors the layouts structure
themes/dohmh/layouts/   All Hugo templates — there is NO root layouts/ directory
  _default/baseof.html    Root template: head, header, main, footer, scripts
  partials/               Reusable template blocks
  shortcodes/             Callable from markdown
assets/           SCSS, JS, images, map-data — processed by Hugo, fingerprinted with SRI
  bootstrap/        Vendored Bootstrap 4.3.1 SCSS source (see SCSS below)
static/           Served as-is, unprocessed
data/globals/     YAML available to every template (SEO defaults, social, NR content/footer)
config/           Per-environment config, merged over config/_default/config.toml
archetypes/       Frontmatter templates for `hugo new`
memories/repo/    Durable repo findings written up for agents (see Hugo rules below)
documents/        Internal audits and technical write-ups
docs/             Generated output — never edit
resources/_gen/   Hugo's fingerprint and image cache — never edit
.cloudcannon/     CMS prebuild/postbuild hooks and frontmatter schemas
```

A path written as `layouts/partials/…` will not resolve — that directory does not exist in this repo. Templates are always `themes/dohmh/layouts/…`.

### Layout routing

- `_index.md` → `section.html`; `index.md` or `name.md` → `single.html`
- Frontmatter `layout: X` → `X.html` in that section's layouts folder
- Frontmatter `type: X` routes to the `X` layouts folder — this is how neighborhood reports reach `nr-output`

### Content sections

| Section | Layout folder | Notes |
|---------|---------------|-------|
| `data-stories` | `data-stories` | Markdown articles with Vega/Datawrapper shortcode embeds |
| `data-explorer` | `data-explorer` | Each topic's markdown lists its indicators in frontmatter; JS drives the visualizations |
| `neighborhood-reports` | `neighborhood-reports` + `nr-output` | Landing/topic pages and the per-neighborhood reports |
| `key-topics` | `key-topics` | Organizing principle; content links to it via `categories` frontmatter |
| `data-features` | `data-features` | Feature articles and tools |

### Languages

English, Spanish, and Simplified Chinese, configured as `[languages.en|es|zh]` in `config/_default/config.toml`. Translations sit beside their English source as `index.es.md` / `index.zh.md` — seven of each, all under `content/data-stories/` and the home page. `config/_default/config.toml` also sets `ignoreFiles = ['Simplified.Chinese', 'Spanish']`, which currently matches no tracked file `[verified 2026-08-12: zero filenames in the repo contain either string]`; it is not what gates translated content.

### Content relationships

- `categories` links a page to Key Topics
- `keywords` feeds Pagefind site search
- `related` and `relatedData` set manual cross-links; the partials fall back to category matches when those fields are absent

## JS architecture

Browser JS under `assets/js/` is fingerprinted and served with Subresource Integrity via the `short-fingerprint.html` partial. Third-party libraries are mounted from `node_modules` into `assets/node_modules` (`[[module.mounts]]` in `config/_default/config.toml`) and bundled locally — nothing loads from a CDN.

`themes/dohmh/layouts/partials/head.html` gates library `<script>` blocks on page kind and section (`.Kind`, `.Section`). Check that gate before assuming a library is available on a given template — a library loaded for `data-explorer` single pages is not necessarily loaded for its section page.

**A layout that loads a library is not necessarily where it is initialized.** `customJS` frontmatter names a `.js` inside the content bundle: `content/data-features/hvi/hvi.js` and `content/data-features/neighborhood-air-quality/aqe.js` are where those pages call `.flexdatalist()`, while `hvi.html` and `aqe.html` only load it. Classic scripts, so they share the layout's global scope. Grep `content/` as well as `themes/` when tracing a library's wiring.

### Data explorer

`assets/js/data-explorer/` is ten vanilla-JS files loaded as classic `<script>` tags sharing one top-level scope. **Load order is set in [data-explorer/single.html](themes/dohmh/layouts/data-explorer/single.html) and is load-bearing:**

`global → data → measures → table → map → links → disparities → trend → app → print`

- `global.js` declares the shared state. Add new cross-file state there rather than assigning an undeclared name.
- The renderers (`showMap`, `showTable`, …) are declared `let` in `global.js` and **assigned** in `measures.js`. Keep them assignments — writing `const showMap = …` in `measures.js` redeclares the same name in the same shared top-level scope, which is a load-time `SyntaxError` on every page that loads the bundle, not a localized failure.
- Data flow: indicator metadata → Arquero table → `joinData` (`data.js`) → `renderMeasures` → the `show*` renderers.
- `single.html` defines `renderIndicatorDropdown`, `renderIndicatorButtons`, and `createCitation` in inline `<script>` blocks because they read markup Hugo has to render first. `data.js` calls them; that works only because classic scripts share one scope.
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`) while data rows may carry versioned values (`NTA2020`). Normalize with `prettifyGeoType` (`global.js`) before comparing. `assignGeoRank` derives its ranking from the same shape, so a new versioned variant should be handled in one place, not two.

### Neighborhood reports

Per-neighborhood reports are content under `content/neighborhood-reports/` with `type: nr-output`, rendered by `themes/dohmh/layouts/nr-output/`. Their JSON specs, images, and indicator data live in EHDP-data; the YAML that drives shared copy is in `data/globals/NR_content/` and `data/globals/NR_footer/`.

### SCSS

`assets/scss/theme.scss` is the entrypoint, importing lettered partials in order (`a-global-variables` → `b-bootstrap-imports` → …). Bootstrap comes from the **vendored copy at `assets/bootstrap/scss/`** (v4.3.1), not from `node_modules` — `package.json` also lists `bootstrap ^4.3.1`, so a dependency bump does not move the styles and the two can drift.

## Coding conventions

- 4-space indentation in all files.
- Browser JS: no new frameworks or build dependencies. Keep it lightweight, readable, explicitly branched.
- Comments explain *why*, not *what*, and are brief. Bias toward more of them, not fewer.
- **JS formatting and comment conventions:** [documents/js-conventions.md](documents/js-conventions.md) — file headers, comment hierarchy, variable grouping, function-level comments, internal step comments. Apply when writing or revising any browser JS.
- **Orientation comment before each meaningful block** — function, object, initialization section — saying at a high level what it does, even when the name makes it obvious. The reader should know what's coming before reading it.
- Match the surrounding file's style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on every interactive element.

## Hugo-specific rules

- Edit source (`content/`, `themes/dohmh/layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Frontmatter, slugs, and asset references are load-bearing — a small typo breaks a URL or the build.
- Environment-specific values belong in `config/<env>/config.toml`, not in hardcoded strings.
- **A standalone `.html` file that needs its own URL goes in `static/`, not in a page bundle.** Inside a leaf bundle, an extra `.html` behaves as a page resource and is not reliably published, so an iframe pointing at a bundle-relative path 404s. Bundle *resources* that templates and shortcodes read are fine to keep in the bundle (`csvtable` reads bundled CSV via `.Page.Resources.GetMatch`), as are images. The worked case, the fix, and the existing static-published examples are in [memories/repo/page-bundle-publication.md](memories/repo/page-bundle-publication.md).
- For a page with substantial inline JS, externalize it to a per-page folder under `assets/js/` and load it through `short-fingerprint.html` as a fingerprinted script with an `integrity` attribute. Keep scripts classic (non-module) when they share global scope — load order matters and nothing enforces it, so state the order in a template comment. Two worked examples: [data-explorer/single.html](themes/dohmh/layouts/data-explorer/single.html) and [data-features/congestion-pricing-report.html](themes/dohmh/layouts/data-features/congestion-pricing-report.html).

## Root-cause claims

A causal claim about runtime behavior — CSS, DOM, layout, timing, browser APIs — must cite an observation from a running browser, not reasoning about the source. This applies at any change size: a one-property CSS fix needs it as much as a template-wide refactor. Plausibility is not evidence, and a well-written explanation is not a verified one.

- **State the disconfirming test you ran and what it showed**, before proposing the fix. "I hid the child element and the ring rendered correctly" is evidence. "Outlines don't follow asymmetric border-radius" is a guess.
- **If a nearby working example contradicts the theory, the theory is wrong.** Adding a secondary explanation for why the working case is exempt is how a wrong diagnosis survives review.
- **Mark unverified reasoning as unverified.** If a fix ships on a hypothesis you could not test, write `// HYPOTHESIS (unverified):` rather than stating the cause as fact. The next person re-tests a hypothesis but trusts an explanation.
- **After one failed fix attempt, gather runtime evidence** instead of trying a second theory. Two speculative fixes in a row means the premise is wrong, not the implementation.
- **Rule out your own confounds.** A static build run in the same tree as the server under test, or a cold cache, is a candidate explanation you introduced — eliminate it, and say that you did.

## Refactors and renames

- **Clarity renames are pre-authorized.** A name that actively *misleads* — describing something other than what the thing is — may be renamed as part of any refactor touching it. Rename what misleads, not every name you'd have chosen differently. Prove each rename complete rather than assuming it: with no linter here, that means a scoped grep for the old name across JS, templates, SCSS, and string literals.
- **Element-id renames get their own commit**, separate from any JS change. Ids are referenced from templates, JS strings, SCSS, and ARIA attributes — grep all four.
- **Prove a pure relocation by reverse-transform, not by reading the diff.** After moving a block, re-apply the inverse transform (re-indent the moved lines, say) and diff against the pre-move state; byte-identity proves "no behavior change" by construction, where a large diff only invites eyeballing.

## Branching and deployment

Branch from `production`, named `hotfix-[NAME]`, `content-[NAME]`, or `feature-[NAME]`. Merge to `development` for testing, then to `production` to deploy. GitHub Actions builds `production` → `builds/prod-prod` (live) and `build-to-dev-stage` → `builds/dev-stage` (staging). Full workflow and environment tables: [readme-development.md](readme-development.md).

A build can also be triggered on demand rather than by merging. `trigger_prod-prod_workflow.ps1` and `trigger_dev-stage_workflow.ps1` (with `.sh` equivalents) run `gh workflow run` against the matching workflow, and `.github/workflows/hugo-build-any-branch.yml` takes a `branch` input and publishes to `builds/[branch]`, or to a `publish-branch` input when one is given. These publish to real build branches — treat running one as a deploy, not a test.

## Common gotchas

- **Missing images fail the build.** Hugo resizes images at build time; a missing source aborts the build.
- **Build caching.** Remote EHDP-data resources are cached. If a data update isn't appearing, set `maxAge = 0` for the relevant cache in config, or add the `--ignoreCache` switch to the `hugo` call.
- **SRI and line endings.** Integrity mismatches on production usually mean `CRLF` endings reached the build; the Actions workflows normalize to `LF` on merge. If *every* resource breaks instead of some, look at the server certificate rather than line endings.
- **Case-only renames in EHDP-data are a two-repo, two-OS hazard.** `report_topic` in `data/globals/NR_content/*.yml` is a path segment of the report JSON filename. A Windows-side export drops case-only renames silently; and if both casings land on a branch, Windows clones choke on the checkout collision. Hugo hides both — it fetches by URL and never checks the tree out. Worked case, with the EHDP-data cleanup commits: [documents/nr-de-merge-integration-plan-2026-08-15.md](documents/nr-de-merge-integration-plan-2026-08-15.md) Task 0.1 Step 3.
