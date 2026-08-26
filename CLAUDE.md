# CLAUDE.md

<!-- docs-check source-roots: assets/js/data-explorer themes/dohmh/layouts assets/scss config data content scripts -->
<!-- docs-check verified: d293ef6cfd 2026-08-21 -->

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
npm run smoke                                          # 33 pages, one per template kind
npm run smoke:all                                      # every page the site serves
npm run smoke:prod_prod                                # every page, on an isolated prod_prod server
npm run smoke:env local_prod                           # every page, on any environment in config/
npm run smoke:env local_prod sample                    # the curated 33 instead, same isolated server
DE_BASE_URL="http://localhost:1313/dev-prod/" npm run smoke   # against a server you already have
```

`scripts/smoke-pages.mjs` loads pages under Playwright and fails on any console `error` or `pageerror` that isn't allowlisted. It is the only check here that runs the site's JavaScript, and it exists because a `hugo` build proves the templates compile and nothing more: the site's browser JS is classic `<script>` tags sharing one global scope, so a bad edit throws at load while the build stays green. **Run it before merging anything that touches `head.html`, `baseof.html`, the header/footer partials, or `assets/js/`.**

The default reads the curated `PAGES` list — one page per template kind, weighted toward templates that load map and chart libraries, which is what a quick check wants. `smoke:all` reads the whole site instead, for a pre-merge or pre-deploy sweep.

`smoke:env <environment>` (`scripts/smoke-env.mjs`) is `smoke:all` against an environment you name
rather than one you happen to be serving. It is the second caller of `scripts/isolated-server.mjs`
— `characterize-env.mjs` is the first — so the isolation is theirs in common: :8090, `-d` and
`HUGO_RESOURCEDIR` both outside the repo, server stopped afterwards. Two axes make the environment
worth naming: `head.html` branches on the environment *name*, and each environment pins its own
`data_branch`, which changes the EHDP-data URLs a page fetches **at runtime** — a renamed data file
throws in the browser on one environment and not another. Same positional-argument contract as
`characterize-env.mjs`, `--flag` rejected, for the reason measured there. An optional second
positional, the bare word `sample`, swaps the full sweep for the curated `PAGES` list — spelled out
exactly, so a typo exits 2 rather than quietly sweeping 925 pages when 33 were wanted. A cold Hugo
build runs either way, so `sample` narrows what is checked and does not make the command quick. The
two `:env` scripts share :8090 and so cannot run concurrently; each refuses to start when the other
holds it.

Eight things to know before trusting a result:

- **`npm run smoke -- --all` does not work here.** PowerShell eats the `--`, so the script gets an empty `argv` and silently runs the curated list — a pass you would read as full coverage. That is why `--all` has its own npm script. Direct `node scripts/smoke-pages.mjs --all --concurrency 12` works from either shell.
- **Before citing the *curated* run as proof for a change that only executes on one page kind, check that page is in `PAGES`.** The comments there name the template that renders each URL, and a comment naming the wrong one is how a page ends up with no coverage while looking covered. `smoke:all` removes this concern and is the answer when you can afford the wall time.
- **Each `KNOWN_NOISE` entry is scoped to the page where its cause was identified**, so the same error text elsewhere still fails. Adding a site-wide entry to quiet one page disables the check everywhere — which now means across the whole site, not across 33 pages. The allowlist should trend to zero: fixing a bug is what removes its entry. One entry is
  *conditional* rather than scoped: Pagefind's, which applies only when the index is absent, because
  `dev-server.mjs` now builds one for servers it starts. Smoke prints `Pagefind index: served` or
  `ABSENT` before it sweeps. Blanket-allowlisting it was masking `PagefindUI is not defined` on
  every page `[2026-08-24: with the predicate forced off and no index, smoke failed 33 of 33]`.
- **`smoke:all` enumerates rather than hardcodes, and prints the breakdown every run** (`scripts/site-urls.mjs`): `sitemap.xml` for content pages in all three languages, plus a probe walk for paginator pages, plus `404.html`. Hugo lists neither of the last two in any sitemap, and reports only a *count* for paginator pages — which is the cross-check. `[verified 2026-08-22 on feature-audit-moderate against a development-environment server: 925 pages = 830 sitemap + 94 paginator + 1, enumerated in 0.5s, and the 94 matched Hugo's build summary exactly; reproduced 2026-08-23 on `production` against a dev_stage server, same 830/94/1 breakdown]`. That total is the same set as the 927 counted below over a `prod_prod` build; only the paginator count differs between branches.
- **Concurrent failures are re-checked sequentially before being reported.** A sweep that reports a concurrency artefact as a regression gets ignored, so pages that clear on the re-run are printed separately and do not fail the run `[2026-08-22: 925 pages in 449s at a concurrency of 6, which was the default at the time; zero cleared on re-check]`. **The mechanism is not established.** The explanation that used to sit in `smoke-pages.mjs`, and in this bullet — pages contending for one `hugo server`'s on-demand render — was never measured, and does not hold up: measured 2026-08-23 at concurrency 6 against 1 over 12 pages, navigation slowed 1.34x, JS settle time was 1.00x, and all 12 reached identical final DOM states — nowhere near enough to time a page out. Treat the re-check as a guard for an unexplained flake, not a fix for a known cause.
- **That re-check is capped at 25 pages, and the concurrency default is no longer 6.** Both changed
  2026-08-26 to match `site-characterization.mjs`, which is now the sibling this file tracks rather
  than diverges from. The default is `min(24, max(6, availableParallelism()))` — 24 on a 24-core
  box, still 6 on a small runner. **The 24 comes from the characterization harness's measurement
  (925 pages, 12 -> 198s, 24 -> 114s, 12 -> 199s `[2026-08-24]`), not from one taken here**; both
  drive one `chromium` with `browser.newPage()` per URL, but smoke adds a fixed 2s settle per page
  that the other lacks, so do not quote 114s for a smoke run. Past 25 failures the sequential
  re-check is skipped outright and the run says so, printing `recheckCapped: true` in its report:
  a capture race does not reach hundreds of pages, so a failure that wide is systematic — which is
  exactly what smoke is built to catch, and re-visiting ~925 pages at a 2s floor is 31 minutes
  during which nothing is reported. Characterization hit that shape in CI `[run 32802721473,
  2026-08-25]`. Both branches of the cap are proved to fire `[2026-08-26: same 33 forced failures
  at concurrency 4, cap 2 -> capped message and no re-check, cap 100 -> sequential re-check ran]`.
- **The harness sends a de-headlessed user agent.** forecast7.com (Cloudflare) answers 403 to a `HeadlessChrome` UA and 200 with an `Access-Control-Allow-Origin` header to a normal Chrome one, so the weatherwidget.io embed on `/data-features/heat-syndrome/` reported a CORS block and rendered at 0px under the sweep while working for visitors `[verified 2026-08-22: same run, same server — default UA 3 errors / 0px, de-headlessed 0 errors / 211px]`. A console error naming a third-party host can be the harness being fingerprinted; check what a real UA gets before allowlisting one.
- **A CORS error from `airnowapi.org` on `(home)` is external — re-run before diagnosing it.** `themes/dohmh/layouts/partials/temp-popup.html` fetches that API at page load, and the AirNow `KNOWN_NOISE` entry is scoped to `realtime-air-quality` and different hostnames, so it does not cover this one `[verified 2026-08-17: one failure between two passes, on a tree where that file was unchanged from the pre-merge tip]`.

`scripts/dev-server.mjs` resolves the server. It reuses one that is already answering on :8080, :8081 or :1313, starts one (`--environment dev_stage`, so **staging data**) when nothing is running, and never stops a server it didn't start. If a `hugo` process exists but answers on no prefix it knows, it aborts rather than start a second builder — set `DE_BASE_URL` in that case.

### Site characterization

```bash
npm run characterize:site            # every page, diff `structure` against the committed baseline
npm run characterize:site:sample     # the same check over 41 pages, one per template kind
npm run characterize:site:baseline   # re-capture this environment's baseline — commit the result
npm run characterize:site:prod_prod   # the same check against an isolated prod_prod server
npm run characterize:site:dev_stage   # ditto, dev_stage
npm run characterize:site:env local_prod   # ditto, any environment in config/
node scripts/site-characterization.mjs --check --content   # widen the gate to titles and link targets
```

`scripts/site-characterization.mjs` is the breadth-first counterpart to `smoke`: every page, one
load each, no interaction. Where `smoke` fails on JS that throws, this fails on a page whose
rendered *structure* moved — an asset that stopped loading, a heading level that started skipping,
a lost `alt` or `<th>`, a container that began overflowing the viewport, an `<iframe>` at zero
height, JSON-LD that stopped being a JSON object. Neither sees what the other does. Console errors
are printed as a harness-health number and deliberately **not** baselined — that is `smoke`'s job.

- **Each record splits into `structure` and `content`, and `--check` gates on `structure` alone.**
  CloudCannon commits content directly, so a check that also gated on titles and link text would
  fail on commits that never touch a template — and a check that fails routinely stops being read.
  `--content` widens it when you want that.
- **`characterize:site` checks whichever environment your machine happens to be serving; the
  `:env` scripts pick one.** `dev-server.mjs` reuses any server answering on :8080/:8081/:1313 and
  otherwise spawns `dev_stage` into the repo's own `docs/` and `resources/_gen`, so what
  `characterize:site` compares depends on what you have running. `scripts/characterize-env.mjs`
  ignores running servers entirely: it spawns the named environment on :8090 with `-d` and
  `HUGO_RESOURCEDIR` redirected outside the repo, builds Pagefind into that isolated `publishDir`,
  runs `--check --all` against it, and stops it. Slower — a cold isolated build runs before the
  sweep, and `rebaseline.mjs` allows 200s for the server alone — and it leaves `docs/` and
  `resources/_gen` untouched. Use `characterize:site` by default; use `:prod_prod` when the
  question is about the site that actually deploys.
- **Arguments to these are POSITIONAL, and that is not a style choice.** Measured 2026-08-26 (npm
  11.4.1, PowerShell): `npm run x -- --env prod_prod` reaches the script as `argv ["prod_prod"]` —
  PowerShell eats the `--` and npm eats the flag *name*, leaving its value as a nameless
  positional, so `--concurrency 8` arrives as a bare `"8"`. A plain positional survives both
  intact. `characterize-env.mjs` therefore refuses any argument starting with `-` rather than
  half-honour it; flags stay available through a direct `node scripts/site-characterization.mjs`
  call. For the same reason `site-characterization-rebaseline.mjs` now refuses unrecognized
  arguments outright: it takes none, it re-captures *every* committed baseline on every run, and
  an argument it merely ignored made a typo indistinguishable from the destructive invocation
  `[2026-08-26: `rebaseline.mjs nosuchkey`, believed to name one key, began re-capturing both]`.
- **Baselines are filed by environment class, and `--check` picks its own.** They live under
  `scripts/site-characterization-baseline/<key>/`, and the harness reads the key off the running
  site — it prints `Environment: dev_stage (EHDP-data staging) at /dev-stage/ — baseline
  "staging"` before it sweeps. Three keys, because two things vary:

  | Key | Environments |
  |---|---|
  | `staging` | dev_stage, local_stage, prod_stage |
  | `production` | dev_prod, development, local_prod, production |
  | `prod_prod` | prod_prod |

  The data branch is the first axis — staging and production carry different indicator data. The
  second is `prod_prod` alone: `head.html:46-53` branches on the environment *name*, so only
  `prod_prod` emits `robots` as `"all"` (`"noindex"` for the `resources` section) where every other
  environment emits `"noindex, nofollow"` on every page. Measured: **all 925 shared pages differ
  between the `staging` and `prod_prod` baselines** — `meta` on 925 of them, plus `controls` on 95,
  `headingLevels` on 86 and `links` on 84 from the data branch `[2026-08-24]`.

  Records are prefix-relative, so a `prod_stage` server on `/IndicatorPublic/` checks correctly
  against a `dev_stage`-captured `staging` baseline. Only `staging` and `prod_prod` are committed;
  capture `production` with `--baseline` against a `dev_prod` server if you need it.
- **The harness serves Pagefind, and `--check` refuses to compare a site that has it against a
  baseline that doesn't.** `hugo server` renders `docs/` to disk (since Hugo v0.123; `Serving pages
  from disk` in its own startup output), so `dev-server.mjs` runs `npx -y pagefind --site docs` —
  the deploy workflow's own command — against any server it starts. It does **not** build into a
  server it merely reused or was pointed at via `DE_BASE_URL`, since it doesn't own that
  `publishDir`; it reports `pagefind served` / `ABSENT` on the environment line either way. The
  search UI is worth `controls.button` +1 and `controls.input` +1 on every page and nothing else
  `[2026-08-24: 925 of 925 pages in both baselines, zero changed lines outside those two fields]`,
  so a mismatched run would report 925 regressions — `_meta.json` records the state and the check
  exits 2 naming the fix instead. If you started the server yourself and see `ABSENT`, run
  `npx -y pagefind --site docs` against it and re-run; a rebuild will not remove the index.
- **Every capture writes a `_meta.json` beside its records — provenance, not a gate.** Commit,
  environment, data branch, Hugo version, Pagefind state, which pages needed re-capturing, and
  `dataCommit`: the EHDP-data commit that branch pointed at, read from `api.github.com` and printed
  on the environment line as `EHDP-data: staging @ b2b63d0635 (2026-08-17)`, or `@ unknown` when the
  lookup fails. `--check` writes one too, so a CI failure artifact says what produced it; `--out`
  deliberately does not, because `baselineKeys()` reads any directory under the baseline root
  holding a `_meta.json` as a key. **Only `pagefind` is gated** — EHDP-data's auto-commit is
  seasonal (heat illness surveillance), so gating on `dataCommit` would refuse nearly every
  comparison through the months the data actually moves. A red `--check` prints one line saying
  whether it moved, with a compare URL; a baseline captured before the field existed has none, and
  that is not a mismatch.
- **Concurrency defaults to `min(24, max(6, availableParallelism()))`, not a fixed 6.** Measured
  over 925 pages, three sweeps interleaved so a warm cache could not pass for a concurrency effect:
  12 -> 198s, **24 -> 114s**, 12 -> 199s, all three captures byte-identical across every record
  `[2026-08-24, 24 logical processors]`. A full `characterize:site` including the Hugo and Pagefind
  builds is ~130s, which is why the 41-page sample is for cheap churn measurement rather than for
  saving time. `--concurrency N` overrides. The bounds are the range measured, not a known optimum.
- **What a pass is worth is established by `documents/site-characterization-plan-2026-08-23.md`,
  not by the check passing.** All eleven probes were driven by an injected regression and each one
  fired `[2026-08-23: 11 of 11, exit 1, each naming its own field]`. A probe that reads zero on
  every page is otherwise indistinguishable from a dead selector — three fields read zero site-wide
  and are proved live by `node scripts/site-characterization-probe-control.mjs`.
- **Each mode has its own npm script rather than a forwarded flag**, for the same reason
  `smoke:all` does: PowerShell eats the `--` in `npm run x -- --flag`.
- **Pages that disagree between sweeps are re-captured sequentially before anything is reported —
  up to 25 of them.** Past that cap `--check` reports what it captured and says so in the output,
  because a capture race does not reach hundreds of pages at once and a difference that wide is
  systematic: a one-line template edit that moved `lang` on every page sent the CI job into a
  12-minute sequential re-capture of all 925 and hit `timeout-minutes: 20` having reported nothing
  `[run 32802721473, 2026-08-25]`. `--baseline` is uncapped — it compares two sweeps of the same
  commit, is run by hand, and is under no timeout.
  Most of what looked like instability was one dead field: `img` was counting Leaflet map tiles,
  which measure network timing rather than page structure. Removing it took `--baseline`
  arbitration from 18 pages to 2, and the `prod_prod` capture needed none at all. **Whatever
  remains is not diagnosed** — read the plan's Task 6 and Task 7 findings before treating it as
  understood, and note that Task 7 found the DOM-quiescence detector had never attached, so any
  older claim crediting that wait is void.

### Four ways a local check silently lies

- **A Hugo build's exit code is a fact about the tree *and* its `data_branch`, not the tree alone.** Each environment pins its own branch, so the same commit can build clean under one and abort under another when EHDP-data filenames differ. Name the environment in any claim that a branch does or does not build.
- **Open a fresh browser tab after rebuilding.** JS and CSS are fingerprinted and cached hard; an existing tab can serve the previous build's assets. A server started *before* an edit to a shared template can also keep serving stale pages. The fingerprint is also the proof: read the served asset filename out of the page and confirm it changed between your before and after reads — an unchanged one means you measured the old file.
- **Never run two Hugo builders against this tree at once** — a static build beside a running server, or two servers on different ports, even against different `--environment`s. They all write the same on-disk fingerprint cache (`resources/_gen/`), which is not namespaced by environment, so one can leave another pointing at asset paths that no longer exist. The tell is every fingerprinted asset 404ing under the *other* environment's path prefix; the page dies with `$ is not defined` and reads like a broken code change, so check the served asset URLs before suspecting your diff. Ask before restarting a server you didn't start.
- **Counting over generated HTML? Define the real-page set first, and pick a marker no `static/` file can also carry.** A `prod_prod` build writes 1397 HTML files, of which **927** are pages rendered through `head.html`; 443 are Hugo alias-redirect shells carrying their own `noindex` and `lang="en"`, and the rest are `static/` passthrough. A tree-wide count scores those 470 as failures. **`head.html`'s viewport meta is not a safe marker** — `static/data-stories/cold/source/index.html` contains the identical tag, so it returns 928, and a loose `name="viewport"` match returns 933 by picking up five more `static/` files with their own variants. Use `data-pagefind-meta="title:`, also emitted unconditionally by `head.html`: it returns 927 and agrees with a same-run `<script type="application/ld+json">` count on all 1397 files `[verified 2026-08-21: one Python walk, 0 disagreements]`. Earlier notes citing 933 real pages were taken with the loose match.

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
- **Rule out your own confounds.** A static build run in the same tree as the server under test, or a cold cache, is a candidate explanation you introduced — eliminate it, and say that you did. For an A/B timing comparison the confound is *order* — the first run warms the caches for the rest. Run A, B, A; a non-monotonic result across an ordered sweep means you measured order, not the variable `[2026-08-24]`. For an A/B comparison of *output* rather than timing, run one condition twice as well — the same-condition control is what separates a real difference from the floor. Hugo 0.147.3 vs 0.147.9 differed on 3 of 2936 built files, and so did 0.147.3 against itself: a `build_datetime` clock, not a version effect `[2026-08-24]`.

## Refactors and renames

- **Clarity renames are pre-authorized.** A name that actively *misleads* — describing something other than what the thing is — may be renamed as part of any refactor touching it. Rename what misleads, not every name you'd have chosen differently. Prove each rename complete rather than assuming it: with no linter here, that means a scoped grep for the old name across JS, templates, SCSS, and string literals.
- **Element-id renames get their own commit**, separate from any JS change. Ids are referenced from templates, JS strings, SCSS, and ARIA attributes — grep all four.
- **Prove a pure relocation by reverse-transform, not by reading the diff.** After moving a block, re-apply the inverse transform (re-indent the moved lines, say) and diff against the pre-move state; byte-identity proves "no behavior change" by construction, where a large diff only invites eyeballing.

## Branching and deployment

Branch from `production`, named `hotfix-[NAME]`, `content-[NAME]`, or `feature-[NAME]`, and merge to `production` to deploy. **Merging to `development` for testing is deprecated** — individual branches are staged in CloudCannon instead. The evidence was already in the repo when this line still said otherwise: `development` appears in no row of readme-development.md's branch table, and `hugo-build-to-dev-prod.yml` is marked "In use? No" in its workflow table `[corrected 2026-08-26]`. GitHub Actions builds `production` → `builds/prod-prod` (live) and `build-to-dev-stage` → `builds/dev-stage` (staging). Full workflow and environment tables: [readme-development.md](readme-development.md).

A build can also be triggered on demand rather than by merging. `trigger_prod-prod_workflow.ps1` and `trigger_dev-stage_workflow.ps1` (with `.sh` equivalents) run `gh workflow run` against the matching workflow, and `.github/workflows/hugo-build-any-branch.yml` takes a `branch` input and publishes to `builds/[branch]`, or to a `publish-branch` input when one is given. These publish to real build branches — treat running one as a deploy, not a test.

**Stacked branches yes, GitHub's Stacked PRs feature no** (decided 2026-08-23). Cutting B from A's tip and C from B's is worth keeping; retarget each PR to `production` by hand as the one below it merges. Don't enable the GitHub feature: merging the bottom PR fires a server-side cascading rebase that force-pushes every branch above it, so the hashes those branches recorded in their own ledgers stop resolving. The cost and the 24-pair mapping are in [audit-backlog-production-2026-08-20.md](documents/audit-backlog-production-2026-08-20.md).

**Test a new workflow with a PR into `production`, not by merging it.** `workflow_dispatch` only registers from the default branch — GitHub documents that the event "will only trigger a workflow run if the workflow file exists on the default branch" — but `pull_request` carries no such requirement, and opening a PR into `production` does not deploy, because `hugo-build-to-prod-prod.yml` is `types: [closed]` with a `merged == true` guard on the job. Once the file is on `production`, `gh workflow run <wf> --ref <branch>` runs *that branch's* copy `[verified 2026-08-24]`. A green run proves only the unconditional steps: this workflow's `if: failure()` artifact upload was dropping half its payload, and a deliberately reverted one-line regression is what ran it `[2026-08-24, run 32777189174]`.

## Common gotchas

- **Missing images fail the build.** Hugo resizes images at build time; a missing source aborts the build.
- **Build caching.** Remote EHDP-data resources are cached. If a data update isn't appearing, set `maxAge = 0` for the relevant cache in config, or add the `--ignoreCache` switch to the `hugo` call.
- **SRI and line endings.** Integrity mismatches on production usually mean `CRLF` endings reached the build; the Actions workflows normalize to `LF` on merge. If *every* resource breaks instead of some, look at the server certificate rather than line endings.
- **`npm install <pkg>@<ver> --save-*` un-pins `package.json`.** npm's default save-prefix is `^`, so a `--save-*` flag rewrites the range to a caret one even when you named an exact version — bumping the pinned `hugo-extended` that way turns `"0.147.3"` back into `"^0.147.3"`, and the diff reads as an ordinary version change. Use `--save-exact`. It also copies the package into the lockfile's `packages[""].dependencies`, where `package.json` declares it only as optional; a later plain `npm install` deletes that line again `[verified 2026-08-24, npm 11.4.1]`.
- **Case-only renames in EHDP-data are a two-repo, two-OS hazard.** `report_topic` in `data/globals/NR_content/*.yml` is a path segment of the report JSON filename. A Windows-side export drops case-only renames silently; and if both casings land on a branch, Windows clones choke on the checkout collision. Hugo hides both — it fetches by URL and never checks the tree out. Worked case, with the EHDP-data cleanup commits: [documents/nr-de-merge-integration-plan-2026-08-15.md](documents/nr-de-merge-integration-plan-2026-08-15.md) Task 0.1 Step 3.
