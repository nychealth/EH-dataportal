<!-- docs-check source-roots: assets/js/data-explorer assets/js/nr-report themes/dohmh/layouts assets/scss config data content scripts -->
<!-- docs-check verified: 79d5eb4804 2026-09-02 -->
<!-- docs-check ignore: maxAge ignoreFiles -->
# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

This file covers conventions that hold across the whole repo, plus the Neighborhood Reports work this branch carries. Feature branches carry their own additions to it and merge them in when their PRs land. The same holds for `documents/`: audits and plans exist in divergent per-branch copies, so a finding marked FIXED describes the branch its copy was written on `[verified 2026-08-20: §11 row 15 reads FIXED and robots.txt is bodiless on this tree; §5k scopes flexdatalist at three call sites and this tree has five]`. Enumerate with `git ls-tree -r <branch> -- documents/` before concluding a subject is undocumented, and re-run a finding's own sweep against your tree before acting on its status.

## What this project is

NYC Department of Health & Mental Hygiene's [Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/) — a Hugo static site providing public access to environmental and health indicators through data stories, an interactive data explorer, neighborhood reports, and topic pages.

Most indicator data lives in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository (not this repo). Site code fetches it at build time via `data_branch` config variable and at runtime via `data_repo` param in Hugo templates/JS.

## Human-facing docs

These are written for the team and are the authority on their subjects. Read the relevant one before answering a question it covers; don't restate their contents here.

- [readme-development.md](readme-development.md) — getting started, branches, GitHub Actions builds, the full environment table, content creation, SRI, dependency bundling, CloudCannon, build caching.
- [readme-content.md](readme-content.md) — content-management standards for editors.
- [readme-components.md](readme-components.md) — the card and callout components available in markdown.
- [README.md](README.md) — orientation and contact info.

## Commands

```bash
# Install JS dependencies (includes hugo-extended)
npm install

# Local development (uses production data branch)
hugo serve --environment development

# Local dev with staging data
hugo serve --environment dev_stage

# Build to docs/ for production
hugo --environment production

# Create new content
hugo new data-stories/TITLE/index.md
hugo new key-topics/TITLE/index.md
```

A dev server prints its own URL on startup — read it rather than assuming. The path prefix is the
environment's `baseURL` path, so `development` serves under `/dev-prod/` and `dev_stage` under
`/dev-stage/`. No environment serves under `/EH-dataportal/`
`[verified 2026-08-07: baseURL across all eight environment directories under config/]`.

- **`npm install <pkg>@<ver> --save-*` un-pins `package.json`.** npm's default save-prefix is `^`, so a `--save-*` flag rewrites the range to a caret one even when you named an exact version — bumping the pinned `hugo-extended` that way turns `"0.147.3"` back into `"^0.147.3"`, and the diff reads as an ordinary version change. Use `--save-exact`. It also copies the package into the lockfile's `packages[""].dependencies`, where `package.json` declares it only as optional; a later plain `npm install` deletes that line again `[verified 2026-08-24, npm 11.4.1]`.

## Guardrails

Eighteen npm scripts, run from the repo root. **No two of them see the same thing**, which is
why a change to a shared template wants more than one: `lint` catches an undefined name without
loading a page; `smoke` runs the site's JavaScript and fails on a console error;
`characterize:site` compares rendered *structure* and deliberately does not gate on console
errors; and the Neighborhood Reports, Pagefind and congestion-pricing harnesses each cover a
surface none of the others reaches.

### Linting and docs

- `npm run lint` — ESLint (`no-undef`) over `assets/js/data-explorer/` and `assets/js/nr-report/`. `eslint.config.mjs` has one block per target. Both are directories of classic scripts sharing one global scope, so each block derives its shared globals at config-load time by scanning its own directory via `scanDeclaredGlobals(dir)`; `no-undef` catches the undefined-name typos that scope is most prone to. `no-unused-vars` is intentionally omitted — it false-positives on the cross-file global pattern. Names injected from outside a directory (libraries, and the inline `<script>` blocks in `themes/dohmh/layouts/data-explorer/single.html`) are listed per block in `DE_EXTERNAL_GLOBALS` / `NR_EXTERNAL_GLOBALS`. **Adding a file to `eslint.config.mjs` does not put it in scope**; the `lint` script's argument list is what selects files, and the two must be changed together. A green run proves nothing by itself — the check that the directory scan actually loaded is a *positive* control: call a name declared in another file of the same directory and confirm lint still passes.
- `npm run docs-check` — verifies that docs claiming to describe *current* code still name real paths and real identifiers (`scripts/docs-check.mjs`). **Opt-in**: a doc is checked only if it declares a `docs-check source-roots` comment in its first lines. Audits and dated findings must **not** opt in — they cite old names on purpose. Run it after any rename; it is the cheapest thing that catches doc rot at the commit that causes it. It scans every `.md` in `documents/` plus the root docs in `ROOT_DOCS` — **this file is one of them**, so a path or identifier written here must be real and repo-root-relative. Site URLs, globs, and placeholder patterns are skipped. **It cannot check prose — that is what the `docs-check verified: <commit> <date>` stamp is for, and the check fails a doc that opts in without one. If you change behaviour described here, update the prose and re-stamp.** The stamp asserts a human re-read the prose against the tree at that commit, so bumping it without doing that is a false claim, not bookkeeping.

### Smoke

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

**CI runs the full sweep on every PR into `production`.** `.github/workflows/smoke.yml` builds
`prod_prod` on the runner, builds Pagefind and then *asserts* the index is served, and sweeps every
page; `workflow_dispatch` offers the 33-page sample instead. A failing sweep triggers a
`base-control` job that rebuilds the site from the base branch tip and runs **this PR's harness**
against it — green means the PR caused it, red means the data or a third party moved. The harness
aborts `www.googletagmanager.com`, so no sweep reports page views to Google Analytics.

Ten things to know before trusting a result:

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

- **The broad `Failed to load resource` allowlist entry hides the *cause* of a blocked script**, leaving only the downstream `X is not defined` — the entry in `scripts/smoke-pages.mjs` is `{ page: null, error: /favicon|Failed to load resource|net::ERR/i }`, and the file carries its own CAUTION comment about it. Diagnose those failures with a separate unfiltered probe rather than from the sweep's output.
- **A cache-cold first run has been seen to fail spuriously** — `documents/site-wide-audit-2026-06-27.md` §5j.

`scripts/dev-server.mjs` resolves the server. It reuses one that is already answering on :8080, :8081 or :1313, starts one (`--environment dev_stage`, so **staging data**) when nothing is running, and never stops a server it didn't start. If a `hugo` process exists but answers on no prefix it knows, it aborts rather than start a second builder — set `DE_BASE_URL` in that case.

Import `ensureDevServer()` from that module directly for one-off browser checks — it is exported
(`scripts/dev-server.mjs:178`). **Starting a server when none is running needs no permission**;
the "ask first" caution is about a server *you didn't start*.

**Check whether a server is actually running before planning around one.** A process list is a point-in-time observation, and a server someone else started can exit between the check and the run — at which point the harness's own spawn path gives you a `dev_stage` server on :8080, matching the baseline prefix, with no workaround needed. Reach for the isolated-build route only once you have confirmed a server you must not disturb is holding the port.

**Stopping a background task may orphan the server** — the wrapper is the tracked process, so `hugo.exe` can keep :8080. Check the port after stopping, and identify a running server by its command line before assuming it isn't yours.

### Site characterization

```bash
npm run characterize:site            # every page, diff `structure` against the committed baseline
npm run characterize:site:sample     # the same check over 41 pages, one per template kind
npm run characterize:site:baseline   # re-capture this environment's baseline — commit the result
npm run characterize:site:prod_prod   # the same check against an isolated prod_prod server
npm run characterize:site:dev_stage   # ditto, dev_stage
npm run characterize:site:env local_prod   # ditto, any environment in config/
npm run characterize:site:env local_prod sample   # ditto, over the 41-page sample
node scripts/site-characterization.mjs --check --content   # widen the gate to titles and link targets
```

`scripts/site-characterization.mjs` is the breadth-first counterpart to `smoke`: every page, one
load each, no interaction. Where `smoke` fails on JS that throws, this fails on a page whose
rendered *structure* moved — an asset that stopped loading, a heading level that started skipping,
a lost `alt` or `<th>`, a container that began overflowing the viewport, an `<iframe>` at zero
height, JSON-LD that stopped being a JSON object. Neither sees what the other does. Console errors
are printed as a harness-health number and deliberately **not** baselined — that is `smoke`'s job.

- **Each record splits into `structure` and `content`, and `--check` gates on `structure` alone.**
  CloudCannon commits content directly — `git log production --pretty=%s | grep -i cloudcannon`
  returns commits titled "Updated 1 file via CloudCannon" whose stat is a single `content/` file,
  and note their author reads "No Name", so an `--author` search finds none. So a check that also
  gated on titles and link text would
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

### Neighborhood Reports harnesses

- `npm run characterize:nr` — Playwright characterization harness for the Neighborhood Reports report page (`scripts/nr-characterization.mjs`). Captures rendered output — neighborhood header, demographics, ZIP list, accordion ids, chart count, **and the final URL** — for three topic/neighborhood pairs, and diffs them against a baseline. `-- --check` to verify, `-- --baseline` to re-capture. **`--baseline` cannot fail** — it records whatever it finds, including three empty pages if a template change stopped the report page rendering. Only `--check` can tell you, so read its diff before re-baselining, never instead. It navigates straight to the real `<nbhd>/<topic>/` page, so it exercises the path the site actually serves; the Leaflet map is deliberately not clicked, which would make it a test of map hit-detection. **Baselines are filed per EHDP-data branch** — `scripts/nr-characterization-baseline/staging/` and `scripts/nr-characterization-baseline/production/` — because the branches render different reports: staging carries two accordion ids production does not on the asthma topic, 46 against 44 `[verified 2026-08-11: diff of the two baselines]`. The harness reads the served `data_branch` off the page and files under it, so environments sharing a branch share a baseline — and since 2026-08-15 the data branch is the *whole* condition: `staging` covers `dev_stage`, `local_stage` and `prod_stage`; `production` covers `dev_prod`, `development`, `local_prod`, `prod_prod` and `production`. An unreadable branch aborts; a branch with no baseline is named in the refusal rather than checked against another's. The captured final URL is the guard against a silent redirect to the 404 page, and it is now recorded **prefix-relative** — `stripBasePath` removes the server's baseURL path, so `/IndicatorPublic/…` and `/dev-stage/…` record the same value and a check runs from any environment on the branch. Before that it carried the raw `window.location.pathname`, and a same-branch cross-environment check failed every target on that field alone; if you meet that failure in an older record, it is the fixed bug, not a regression. The strip is anchored to the *start* of the path, so a redirect still shows as a diff `[verified 2026-08-15: prod_stage against the dev_stage-captured staging baseline — 3 of 3 targets failing on `finalURL` before, 3 of 3 passing after, with the redirect and 404 shapes still differing]`. `documents/nr-characterization-environment-options-2026-08-11.md` records why the environment *spawner* (its Option 2) was left unbuilt. Run it before any merge touching the NR templates or `assets/js/nr-report/`. It expands the first accordion panel per target so the lazy Vega path runs, and records the renderer (`hasCanvas`/`hasSvg`) plus a painted flag per mark group — structural facts only, since mark *counts* track EHDP-data row counts and would churn the baseline on every data refresh. It also captures each chart's accessible name and its export-menu label (`chartName`, `actionsLabel`), read off the node carrying `role="graphics-document"` — **not** off `.vega-embed`, which has no `aria-label` and whose empty capture left chart naming uncovered until 2026-08-11.
- `npm run a11y:nr` — accessibility audit of the four Neighborhood Reports page kinds (`scripts/nr-a11y-audit.mjs`), axe-core under Playwright, plus probes for what no axe rule implements: a full tab-order sweep recording focus indicators and `aria-hidden` ancestors, heading order read from the accessibility tree rather than the DOM, id/ARIA-reference integrity, a before/after capture around a Leaflet re-render, chart naming, and computed colour on the comparison vocabulary. It scans the report page in four states — at rest, one panel expanded, all expanded, and print-emulated — because the chart and the print rendition do not exist in the others. **It is an audit instrument, not a gate**: it exits non-zero only when a *control* fails, never on findings. Two controls make its numbers mean anything, and both are the reason a zero here is not self-certifying. The **positive control** injects an `<img>` with no `alt` and asserts `image-alt` fires, because a scan where axe never loaded reports the same zero as a clean page. The **rendered-content control** requires a per-page selector to match first: the report page's cards come from the data repo, and against an empty one it renders five empty accordion shells that axe will honestly call almost clean. Set `DE_BASE_URL` to choose the server and `A11Y_OUT` to choose where the per-page JSON lands (default is a temp directory). Findings as of 2026-08-10 are triaged in `documents/nr-accessibility-audit-2026-08-10.md`, which also records which source-read candidates the browser disconfirmed. **Read `wcag.incompleteIds` in the per-page JSON, not only `wcag.violations`.** axe defers nodes whose background it cannot resolve, and `color-contrast` sits in that bucket on all four pages — so a zero in the violations list for that rule is a floor, not a census. The worked case: one shared partial's button, reported on the topic index but not the landing page, then on both after an unrelated change with its colours untouched.

`scripts/nr-postswap-check.mjs` diffs the generated pages against
`scripts/nr-output-precapture/capture.json`, the record of what the retired pages rendered. **It
must run against a production-data server** — `ensureDevServer()` spawns `dev_stage`, and the
staging branch's row counts differ, which reads as content regressions. The script refuses to run
on a branch mismatch.

### Search index

- `npm run characterize:pagefind` — characterization harness for the **search index**
  (`scripts/pagefind-characterization.mjs`). Nothing else in this repo can see search: Pagefind is
  a post-build step, so `hugo server` produces no index at all — which is why `PagefindUI is not
  defined` is allowlisted dev-only noise in `nr-characterization.mjs`. A template change that
  silently adds or removes indexed text is invisible to `lint`, `smoke` and both other harnesses.
  It **builds the site itself** into a temp directory with `HUGO_RESOURCEDIR` pointed there too —
  the one form that cannot reach `resources/_gen`, so it is safe beside a running dev server —
  then runs Pagefind over that build, records every indexed page (`word_count`, `meta.title`,
  filters, anchor ids, a content hash and its opening words) plus a fixed query set run through
  Pagefind's JS API in Chromium, and diffs against a baseline. It reads `docs/` for nothing:
  `docs/` holds whatever was last built, and a check against a stale index passes for the wrong
  reason. `--against <built-site-dir>` diffs against another worktree's `docs/` instead of a
  baseline, which is the cross-branch comparison. **Both the fragment record and the query set are
  needed, not either alone** — production's fragment for a neighborhood index holds only its ZIP
  codes, which reads as "not findable by name", but Pagefind searches `meta.title` too and the
  query returns it first. Baselines are filed per EHDP-data branch, read from the merged Hugo
  config rather than off a page, and the baseURL path prefix is normalized out of every recorded
  value — so `local_prod`, `dev_prod` and `prod_prod` all check against `production.json`.
  `characterize:nr` closed the same gap on 2026-08-15 and now normalizes its one path field the
  same way, though it reads the prefix off the live server rather than the merged config.
  **Unlike `characterize:nr`, `--baseline`
  here can fail**: it runs both controls first and refuses to write when they fail. The
  rendered-content control puts a word floor under one page of nine template kinds; the query
  control asserts a real term returns many results and a nonsense term few. That negative control
  is a *ceiling*, not `=== 0`, because Pagefind matches fuzzily — `zzqqxxwv` returns `/about/`
  `[verified 2026-08-15: five nonsense tokens, only one returned 0]`. A control may also be
  **inverted** (`absent: true`), asserting a page is deliberately *not* indexed; the NR report page
  is the case, so removing its page-level ignore fails a control instead of reading as a diff to
  re-baseline. Run it before any merge touching a shared partial, `head.html`, `baseof.html`, or an
  NR template.

### Data explorer harness

- `npm run characterize:de` — the equivalent harness for the data explorer (`scripts/de-characterization.mjs`). **Currently non-functional on this branch**: it was written against the `feature-new-data-explorer` explorer and waits on DOM this branch never produces. Migrated for parity, not usable here; no baseline is committed. Do not treat a failure from it as a regression signal.

### Four ways a local check silently lies

- **A Hugo build's exit code is a fact about the tree *and* its `data_branch`, not the tree alone.** Each environment pins its own branch, so the same commit can build clean under one and abort under another when EHDP-data filenames differ. Name the environment in any claim that a branch does or does not build.
- **Open a fresh browser tab after rebuilding.** JS and CSS are fingerprinted and cached hard; an existing tab can serve the previous build's assets. A server started *before* an edit to a shared template can also keep serving stale pages. The fingerprint is also the proof: read the served asset filename out of the page and confirm it changed between your before and after reads — an unchanged one means you measured the old file.
- **Never run two Hugo builders against this tree at once** — a static build beside a running server, or two servers on different ports, even against different `--environment`s. They all write the same on-disk fingerprint cache (`resources/_gen/`), which is not namespaced by environment, so one can leave another pointing at asset paths that no longer exist. `scripts/dev-server.mjs` only guards the ports it probes, so a server started outside it slips past. The tell is every fingerprinted asset 404ing under the *other* environment's path prefix; the page dies with `$ is not defined` and reads like a broken code change, so check the served asset URLs before suspecting your diff. Ask before restarting a server you didn't start.
- **Counting over generated HTML? Define the real-page set first, and pick a marker no `static/` file can also carry.** A `prod_prod` build writes 1397 HTML files, of which **927** are pages rendered through `head.html`; 443 are Hugo alias-redirect shells carrying their own `noindex` and `lang="en"`, and the rest are `static/` passthrough. A tree-wide count scores those 470 as failures. **`head.html`'s viewport meta is not a safe marker** — `static/data-stories/cold/source/index.html` contains the identical tag, so it returns 928, and a loose `name="viewport"` match returns 933 by picking up five more `static/` files with their own variants. Use `data-pagefind-meta="title:`, also emitted unconditionally by `head.html`: it returns 927 and agrees with a same-run `<script type="application/ld+json">` count on all 1397 files `[verified 2026-08-21: one Python walk, 0 disagreements]`. Earlier notes citing 933 real pages were taken with the loose match.

**The exception:** a build with `HUGO_RESOURCEDIR` and `-d` pointed at temp directories cannot
reach `resources/_gen` at all, so it is safe beside a running server — the one caveat is in the
`project-isolated-hugo-build` memory.

To build while someone's server is up, redirect both writable outputs to temp directories — the build then cannot reach `resources/_gen/` or `docs/` at all:

```bash
# TEMP = any directory outside the repo
HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment development -d "$TEMP/iso-docs"
```

`[verified 2026-08-12: full site build, exit 0 in 31s; all 197 files under resources/_gen identical in mtime and size afterward, 173 resources written to the temp dir instead, docs/ untouched]`. That establishes the build writes neither shared location, which is what the "safe beside a server" claim rests on.
**The concurrent case is now tested too, and it holds** `[verified 2026-08-18 on feature-new-data-explorer, with a dev_stage server live on :8080 throughout: production build exit 0, 0 ERROR, 1326 EN pages in 31.1s; resources/_gen byte-identical before and after on a manifest of path+size+mtime for all 174 files; 174 resources written to the isolated resourceDir and 3038 files to the temp output dir; the worktree stayed clean and docs/ was untouched. The server was then unharmed — same 200, same page byte-length, an identical list of 36 fingerprinted asset URLs, and the same 34x200 / 2x404 split, the two 404s being pagefind, which hugo serve never builds]`. That is the documented poisoning symptom — fingerprinted assets 404ing — probed directly and absent. Inspect the generated HTML in the temp directory rather than hitting the live server.

## Root-cause claims

A claim about runtime behavior — CSS, DOM, layout, timing, browser APIs — must cite an observation from a running browser, not reasoning about the source. This applies at **any change size**: a one-property CSS fix needs it as much as a template-wide refactor, and to **more than diagnosis** — describing what a class does when presenting an option is the same assertion with the same failure mode. `.comp-*` was described as colouring its text, from the class name alone, when its only rules set a `::before` emoji. Plausibility is not evidence, and a well-written explanation is not a verified one.

- **State the disconfirming test you ran and what it showed**, before proposing the fix. "I hid the child element and the ring rendered correctly" is evidence. "Outlines don't follow asymmetric border-radius" is a guess.
- **If a nearby working example contradicts your theory, the theory is wrong.** Do not add a secondary explanation for why the working case is exempt — that is how a wrong diagnosis survives review.
- **Mark unverified reasoning as unverified.** If a fix ships on a hypothesis you could not test, write `// HYPOTHESIS (unverified):` rather than stating the cause as fact. A confident wrong comment misleads every later attempt; the next person re-tests a hypothesis but trusts an explanation.
- **After one failed fix attempt, stop and gather runtime evidence** instead of trying a second theory. Two speculative fixes in a row means the premise is wrong, not the implementation.
- **Rule out your own confounds before reporting a cause.** If you ran a static build in the same tree as the server you are testing, or the cache was cold, that is a candidate explanation you introduced — eliminate it, and say that you did. For an A/B *timing* comparison the confound is **order** — the first run warms the caches for the rest. Run A, B, A; a non-monotonic result across an ordered sweep means you measured order, not the variable `[2026-08-24]`. For an A/B comparison of *output* rather than timing, run one condition twice as well — the same-condition control is what separates a real difference from the floor. Hugo 0.147.3 against 0.147.9 differed on 3 of 2936 built files, and so did 0.147.3 against itself: a `build_datetime` clock, not a version effect `[2026-08-24]`.
- **If a refactor is justified partly by bug claims, prove them in a no-code stage first.** Reproduce each in the browser before touching anything, and drop any that doesn't reproduce rather than fixing a phantom.

Worked example: `documents/data-explorer-fresh-audit-2026-07-13.md` §4.9 — a focus-ring bug that survived two fixes because the diagnosis was plausible, confidently written, and false; the actual cause took one browser experiment to find.

## Architecture

### Hugo structure

- `content/` — Markdown content files with YAML frontmatter
- `themes/dohmh/layouts/` — Hugo templates (mirrors `content/` structure). There is **no** root layouts directory — a path written that way will not resolve.
- `themes/dohmh/layouts/_default/baseof.html` — Root template: head, header, main, footer, JS
- `themes/dohmh/layouts/partials/` — Reusable template blocks
- `themes/dohmh/layouts/shortcodes/` — Shortcodes callable from markdown content
- `assets/` — SCSS, JS, images (processed by Hugo with SRI fingerprinting)
- `static/` — Unprocessed files served as-is
- `data/globals/` — YAML/JSON data accessible throughout templates: featured data, SEO vars, and the three Neighborhood Reports sources — `data/globals/uhflist.json`, `data/globals/NR_topics.yml` and `data/globals/NR_content`
- `documents/` — Internal audits and technical write-ups
- `scripts/` — Node dev tooling (smoke test, docs-check, dev-server helper, the five characterization harnesses, the accessibility audit, and the NR pre-capture/post-swap pair)
- `docs/` — Generated output; never edit directly

### Layout routing

- `_index.md` → `section.html` (section landing pages)
- `index.md` or `name.md` → `single.html`
- Frontmatter `layout: custom` → `custom.html` in the section's layouts folder
- Frontmatter `type: X` routes to the `X` layouts folder; `layout: X` selects `X.html` within the section's own layouts folder, which is how all three Neighborhood Reports page kinds are routed
- A `_content.gotmpl` in a content directory is a **content adapter** — it generates pages at build time. `content/neighborhood-reports/` has one

### JS architecture

JS files under `assets/js/` are fingerprinted and served with Subresource Integrity. Dependencies from `node_modules` are mounted into `assets/node_modules` via Hugo module mounts — they are bundled locally, not loaded from CDNs.

#### Library loading

`head.html` loads only what every page needs: jQuery, Font Awesome (CSS webfont), and DOMPurify. Everything else is a **`lib-*` partial that the template including it opts into** — seven of them, each wrapping one library's `resources.Get` calls, fingerprinting and SRI:

`lib-leaflet` · `lib-easybutton-coloricon` · `lib-uhflist` · `lib-vega` · `lib-arquero` · `lib-d3` · `lib-datatables`

- **`lib-easybutton-coloricon` must follow `lib-leaflet`** — both extend the global `L`.
- **`lib-uhflist` emits the global `neighborhoods`**, generated at build time from `data/globals/uhflist.json` via `resources.FromString` into a fingerprinted `uhflist-data` script. The old hand-maintained `uhflist.js` source under `assets/js/` is gone; a comment naming it is stale.
- **Placement is not free.** `baseof.html` renders `block "main"` before `block "js_bot"`, so a partial included in `js_bot` is parsed *after* any inline `<script>` in `main`. `nr-leaflet.html` calls `L.map(...)` at the top level of an inline script, so every template rendering it includes `lib-leaflet` in `main`, above that call. Put the include beside the consumer that runs earliest, not at the foot of the page by habit.
- Not every template uses the partials: `themes/dohmh/layouts/data-explorer/single.html` still declares its libraries inline, and flexdatalist has no `lib-*` partial — the four templates that use it load it themselves (`themes/dohmh/layouts/partials/de-text-search.html`, `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html`, `themes/dohmh/layouts/data-features/aqe.html`, `themes/dohmh/layouts/data-features/hvi.html`) `[verified 2026-09-01: grep for the `resources.Get` on the package across `themes/`]`.
- **A layout that loads a library is not necessarily where it is initialized.** `customJS` frontmatter names a `.js` inside the content bundle, and `content/data-features/hvi/hvi.js` and `content/data-features/neighborhood-air-quality/aqe.js` are where those two pages call `.flexdatalist()` — `hvi.html` and `aqe.html` only load it. The other two init sites are in the partials themselves. Classic scripts, so they share the layout's global scope. Grep `content/` as well as `themes/` when tracing a library's wiring.

Adding a library call to a template's JS means adding its `lib-*` include too — nothing loads it globally any more, and the failure is a runtime `X is not defined` that a green build will not show you.

### Data explorer

`assets/js/data-explorer/` is a vanilla-JS app of 10 files loaded as classic `<script>` tags sharing one global scope. **Load order is critical** and is set in `themes/dohmh/layouts/data-explorer/single.html`:

`global → data → measures → table → map → links → disparities → trend → app → print`

- `global.js` declares the shared top-level state. Add new cross-file state there rather than assigning an undeclared name — an implicit global works at runtime but defeats `npm run lint`, which is what proves renames complete.
- Data flow: indicator metadata → Arquero table → `joinData` → `renderMeasures` → the `show` renderers (`showMap`, `showTable`, `showTrend`, …).
- `single.html` also defines `renderIndicatorDropdown`, `renderIndicatorButtons`, and `createCitation` in inline `<script>` blocks, because they read template markup Hugo has to render. They are called from `data.js`, which works because classic scripts share one top-level scope.
- `renderLinksChart` (`links.js`) and `renderTrendChart` (`trend.js`) are each a single function spanning nearly their whole file.

Key gotchas:
- `isDataTable` is reached via the lowercase-`d` jQuery plugin property, not the capitalised one. **Scoped to `feature-new-data-explorer`** — the name appears 6× there and 0× here or on `production`, though DataTables itself is used on this branch `[verified 2026-08-06]`.
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`); data rows may carry versioned values. Normalize with `prettifyGeoType` before comparing. `assignGeoRank` derives its ranking from the same source, so a new versioned variant only needs adding in one place.
- **The search modal is not where this file used to say it was.** On this branch `#searchModal` is defined inline at `themes/dohmh/layouts/partials/footer.html:189`, reached only because `baseof.html` includes the footer — the arrangement the old wording forbade. `feature-new-data-explorer` solved it differently again, with a dedicated `search-modal.html` under `themes/dohmh/layouts/partials/` included from the header partials, and has it in neither `baseof.html` nor `footer.html`. So there is no branch where it lives in `baseof.html` `[verified 2026-08-06: counts across all three branches]`. Whether the Pagefind double-initialization it guarded against actually occurs here is **untested** — it needs a footerless page to reproduce.
- **`head.html` no longer carries a library block at all.** It used to gate one on `.Kind`/`.Section`, and that gate missed section pages — which is what made the data explorer landing page throw `aq is not defined` (site-wide audit §5f). Libraries are now per-template `lib-*` partials, and `themes/dohmh/layouts/data-explorer/section.html:40` includes `lib-arquero.html`, so that particular failure is fixed `[verified 2026-08-17: npm run smoke passes the data explorer landing page, and it fails on any pageerror]`. See "Library loading" below before assuming a library is available on a template.

### Neighborhood Reports

**There is no `nr-output` any more.** The 252 hand-written content files under
`content/neighborhood-reports/<Neighborhood>/` and the two `nr-output` layouts were retired in
favour of generated pages ("Option D"). URLs are unchanged — that was the point — so a path that
worked before still works, but nothing renders it the way it used to. Three page kinds:

- **Report page** — `/neighborhood-reports/<nbhd>/<topic>/`, 210 of them, `kind: page`, rendered by
  `themes/dohmh/layouts/neighborhood-reports/nr-report.html`. **None of these 210 are in the
  Pagefind index**: the layout's `<section id="skip-header-target">` carries
  `data-pagefind-ignore="all"`, restoring production's model 2026-08-15 after the alternatives were
  measured and failed. It costs neighborhood+topic search — "asthma East Harlem" no longer finds
  East Harlem's asthma report — and it is reversible by deleting that one attribute, which
  `npm run characterize:pagefind` will catch as a control failure rather than a diff.
  `documents/nr-pagefind-parity-2026-08-15.md` §2g has the numbers, §5 the test that would reverse
  it. Pagefind only: crawlers, the accessibility tree and the no-JS path are untouched. This is the
  report page:
  `assets/js/nr-report/`, ten classic scripts sharing one global scope, mirroring the data
  explorer: `global → url → tertiles → demographics → cards → report → chart → map → data → app`.
  **Load order is set in the template and `app.js` must be last** — it holds the only two
  statements that run at load time. `global.js` declares the shared state, each binding annotated
  with the files that read and write it. Unlike the DE charts, `chart.js` passes `renderer: 'svg'`
  to `vegaEmbed`, so NR chart marks are inspectable DOM nodes. The neighborhood is **server-side**:
  the page knows which one it is, `NR_REPORT_CONFIG.neighborhood` says so, and the name, ZIP list
  and headers render without JS.

  Its Leaflet map is the only in-place neighborhood switcher, and it answers the keyboard as well
  as the mouse: `map.js` binds `keydown` beside `click`, both routing through one
  `selectNeighborhood`. Leaflet already delivered the key event to the focused `<path>` — the 42
  polygons were focusable all along, and nothing was listening. Every polygon carries
  `role="button"` and a name from `featureDisplayName`, **not** from the geojson's `GEONAME`, which
  disagrees with `uhflist`'s `UHF_name` on 6 of the 42 ("Fordham - Bronx Pk", "Rockaways"); the
  tooltip resolves the same way, so the visible label matches the accessible name.
- **Neighborhood index** — `/neighborhood-reports/<nbhd>/`, 42 of them, `kind: section`,
  `themes/dohmh/layouts/neighborhood-reports/nr-neighborhood-index.html`. Leaflet map, ZIP list,
  five topic cards linking to that neighborhood's reports.
- **Topic index** — `/neighborhood-reports/<topic>/`, the 5 topic markdown files, which set
  `layout: nr-topic-index` and an explicit `url`. Title and intro sit *above* the picker in the
  same centred `col-md-8`, not beside it. Then the shared neighborhood list. Plus the hidden
  indicator-name headings Pagefind indexes.

**The rest of the NR narrative now lives in [documents/nr-architecture.md](documents/nr-architecture.md)** — how the report page renders an
indicator row (print rendition, tertile vocabulary, the `.comp-*` classes, the QR code and the live
region), the `topic_indicators.json` lookup behind each "Full dataset" link, the three shared
picker/list partials, `nr-leaflet`'s framing, and the routing note. What stays below is what bites
from *outside* the NR files.

Two traps when working on the report page's print rendition. `.print-only` is `display:none` normally and `display:flex`
in print (`assets/scss/_custom.scss`) — a hand-rolled class, because Bootstrap's own `_print.scss`
is **not** imported; only the `d-print-*` utilities are. And nothing below a browser proves a print
change: emulate print media and read `document.body.innerText`, which respects `display:none` and is
therefore what print actually shows. `documents/nr-print-view-fix-2026-08-10.md` has the before/after
numbers and the instrument that reported a false pass.

**The report page has no styles of its own any more.** Its inline `<style>` block moved into
`assets/scss/_custom.scss` on 2026-08-15, under a "Neighborhood Reports report page" heading, so a
reader looking in `nr-report.html` for why an accordion header is white will not find it there.
Three of those rules are **scoped to `.nr-report-accordion`, and the scope is load-bearing**:
`.card-header` is a Bootstrap class, an inline block reached only its own page, and the same rules
in a shared stylesheet repaint every card header on the site — measured on
`/data-features/realtime-air-quality/`, where 8 headers went `#EFFAF4` → white with the scope
removed and back with it restored `[verified 2026-08-15: computed style, three runs]`. The
corollary generalizes: **lifting page-local CSS into a shared stylesheet is never a pure
relocation**, because the inline block was carrying a page scope and a cascade position that the
new home does not reproduce. Eight of the seventeen rules were dead and were deleted instead —
`.nr-card-header`, `.nr-indicator-card` and `.card-header a` match nothing the page renders.

**`nr-leaflet.html` and `assets/js/nr-report/map.js` are two parallel Leaflet implementations
that share four top-level names, so they must never load on the same page.** `highlightFeature`,
`onEachFeature`, `resetHighlight` and `selectNeighborhood` are declared in both
`[verified 2026-08-11: top-level declarations in the two files, intersected]`. They do not collide
today because `nr-report.html` includes the report page modules and not `nr-leaflet`, while the picker
pages do the reverse — but a `const` and a `function` of the same name in one classic-script scope
is a `SyntaxError` that kills every script on the page, and `npm run lint` cannot see it, since
`no-undef` is satisfied by either declaration. Adding `nr-leaflet` to the report page, or the report page's
map module to a picker page, needs a rename first.

The generator is `content/neighborhood-reports/_content.gotmpl`, a Hugo **content adapter**. It
crosses `data/globals/uhflist.json` (42 neighborhoods) with `data/globals/NR_topics.yml` (5 topics)
and emits 252 pages. Two adapter facts that fail silently rather than loudly. **A front matter
field with its own Hugo accessor must be a top-level key in the page map, not a `params` entry** —
in `params` the accessor just returns empty. `title` feeds `.Title`, `summary` feeds `.Summary`;
`summary` filed wrongly blanked the `<description>` of all 210 report entries in `index.xml` and
the 42 per-neighborhood feeds while every HTML page looked correct. And `.File.BaseFileName` is
the literal string `_content`, so a `where` keyed on it matches zero rows without erroring. `.Site.Pages` and
`.Site.GetPage` are unavailable inside an adapter — the Site object is not built yet — which is why
everything it needs comes from `data/`.

### SCSS

`assets/scss/theme.scss` is the root entrypoint, importing Bootstrap overrides and custom styles in lettered files. Bootstrap itself is mounted from `node_modules`.

### Content sections

| Section | Layout folder | Notes |
|---------|---------------|-------|
| `data-stories` | `data-stories` | Markdown articles with Vega/Datawrapper shortcode embeds |
| `data-explorer` | `data-explorer` | Each topic MD lists an indicators array; JS drives all visualization |
| `neighborhood-reports` | `neighborhood-reports` | 252 of its 258 pages are generated by a content adapter — see above |
| `key-topics` | `key-topics` | Organizing principle; linked via `categories` frontmatter |
| `data-features` | `data-features` | Feature articles/tools |

### Data flow

- **Build time**: Hugo fetches remote JSON/YAML from EHDP-data via `getresource` (controlled by `data_branch` and `maxAge` in config). `data-index.html` generates a topic/indicator cross-reference.
- **Runtime**: JS reads `data_repo` and `data_branch` Hugo params to fetch indicator data, map specs, and Vega specs directly from EHDP-data raw URLs.

### Content relationships

- `categories` frontmatter links content to Key Topics
- `keywords` feeds Pagefind site search
- `related` and `relatedData` frontmatter fields specify manual cross-links; templates default to category-matched content when these are absent

## Environments

Specify with `--environment ENV`. Each environment's own config.toml, under its directory in `config/`, is merged over `config/_default/config.toml`.

| Environment   | Data branch | Purpose                                                   |
|---------------|-------------|-----------------------------------------------------------|
| `development` | production  | Preview site changes (default local)                      |
| `dev_stage`   | staging     | Preview combined site + data changes; also CI → `builds/dev-stage` |
| `dev_prod`    | production  | CI → `builds/dev-prod`. Same `baseURL`/`data_branch` as `development` |
| `production`  | production  | Same config as `prod_prod`, but **no workflow builds with it** |
| `prod_prod`   | production  | **The live build** — CI → `builds/prod-prod` on merge to `production` |
| `prod_stage`  | staging     | Preview data changes only                                 |
| `local_prod`  | production  | Uses locally hosted data repo                             |
| `local_stage` | staging     | Uses locally hosted data repo                             |

**Eight, not six, and the two pairs matter.** `development`/`dev_prod` and `production`/`prod_prod` are pairwise identical in `baseURL` and `data_branch`; the difference is only which one CI names. The deploy workflow passes `--environment prod_prod`, so a change made under `production` alone does not reach the live build `[verified 2026-08-06: --environment grep across .github/workflows/]`.

Key per-environment variables: `baseURL` and `data_branch`.

- **Build caching is per environment, and the default is the exception.** `config/_default/config.toml` sets `caches.getresource maxAge = -1` — cache forever — but five environments override it to `0`: `development`, `dev_prod`, `dev_stage`, `production`, `prod_prod`. Only `local_prod`, `local_stage` and `prod_stage` inherit the forever cache `[verified 2026-09-01: grep for maxAge across config/]`. So "the build is serving stale EHDP-data" is a real explanation under three environments and not under the other five — check which one you are building before reaching for it. `--ignoreCache` forces a cold fetch either way. **An earlier version of this bullet described the forever cache as sitewide and quoted a warm-vs-cold build time for a `production` build; `production` sets `0`, so that figure cannot have been measuring this cache and has been dropped rather than restated.**
- **Case-only renames in EHDP-data are a two-repo, two-OS hazard.** `report_topic` in `data/globals/NR_content/*.yml` is a path segment of the report JSON filename. A Windows-side export drops case-only renames silently; and if both casings land on a branch, Windows clones choke on the checkout collision. Hugo hides both — it fetches by URL and never checks the tree out. Worked case, with the EHDP-data cleanup commits: [documents/nr-de-merge-integration-plan-2026-08-15.md](documents/nr-de-merge-integration-plan-2026-08-15.md) Task 0.1 Step 3.

## Coding conventions

- 4-space indentation in all files.
- Browser-side JS: no new frameworks or build dependencies. Keep it lightweight, readable, and explicitly branched.
- Comments should be brief and intent-focused. Explain *why*, not *what*. Bias towards adding more comments, not fewer.
- **Orientation comments before code blocks:** add a brief comment before each meaningful code block (function, object, initialization section) explaining what it does at a high level — even if the name alone makes it obvious. Know what's coming before reading the code, not just after.
- Match existing file style before applying any general rule. Don't refactor untouched code.
- Preserve accessibility: labels, keyboard support, sensible fallbacks on all interactive elements.

**JS formatting and comment conventions live in `documents/js-conventions.md`**, which covers all authored browser-side JS — `assets/js/` and inline `<script>` blocks in layouts alike. `.claude/commands/js-development.md` is a stub pointing there.


## Refactors and renames

- **Clarity renames are pre-authorized.** The codebase mixes hand-written names with AI-generated ones from earlier refactors, so a name that actively *misleads* — describing something other than what the thing is — may be renamed as part of any refactor touching it. Rename what misleads, not every name you'd have chosen differently. Every rename must be *proven* complete, not assumed: `npm run lint` proves a JS identifier rename, since the old name ceases to exist; a scoped grep proves a template/SCSS/string rename.
- **Element-id renames get their own commit**, separate from any JS change. Ids are referenced from templates, JS string literals, SCSS, and ARIA attributes — grep all four.
- **Prove a pure relocation by reverse-transform, not by reading the diff.** After moving a block, re-apply the inverse transform (e.g. re-indent the moved lines) and diff against the pre-move state — byte-identity proves "no behavior change" by construction, where a large diff only invites eyeballing. For a comment- or indentation-only pass, `git diff -w` proves the same thing more cheaply: every deletion it still shows must be a line of the category you meant to touch. Invalid in files with template literals — `-w` also hides whitespace edited inside a string.

After a rename or delete, fetch the served asset and assert the **old** identifier is absent — that is what separates a broken change from a stale cache. An unchanged fingerprint alongside unchanged output is the tell.

## Hugo-specific rules

- Edit source files (`content/`, `themes/dohmh/layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- **Missing images cause build failures.** Hugo resizes images at build time; a missing source image will abort the build.
- Environment-specific values go in config, not hardcoded strings.
- **A standalone `.html` file that needs its own URL goes in `static/`, not in a page bundle.** Inside a leaf bundle, an extra `.html` behaves as a page resource and is not reliably published, so an iframe pointing at a bundle-relative path 404s. Bundle *resources* that templates and shortcodes read are fine to keep in the bundle (`csvtable` reads bundled CSV via `.Page.Resources.GetMatch`), as are images. The worked case, the fix, and the existing static-published examples are in [memories/repo/page-bundle-publication.md](memories/repo/page-bundle-publication.md).
- For a page with substantial inline JS, externalize it to a per-page folder under `assets/js/` and load it through the `short-fingerprint` partial as a fingerprinted script with an integrity attribute. Keep scripts as classic (non-module) tags when they share global scope across files — load order matters and isn't enforced by tooling, so state it explicitly in a template comment. Two worked examples: [data-explorer/single.html](themes/dohmh/layouts/data-explorer/single.html) and [data-features/congestion-pricing-report.html](themes/dohmh/layouts/data-features/congestion-pricing-report.html).

### Subresource Integrity (SRI)

Hugo calculates integrity hashes for all local JS/CSS resources using the `short-fingerprint.html` partial (a custom hash-shortening wrapper around Hugo's built-in integrity function). If SRI breaks on production, check that end-of-line characters are Unix `LF` — integrity mismatches usually mean `CRLF` reached the build, and the GitHub Actions workflows normalize to `LF` on merge. If *every* resource breaks instead of some, look at the server certificate rather than line endings.

## Multi-language

Site has English (`en`), Spanish (`es`), and Simplified Chinese (`zh`). Localized home pages use `_index.es.md` / `_index.zh.md` naming. `ignoreFiles` in config.toml gates language-specific content from the default build.

## Shortcodes

Available in markdown content files:
- `vega` / `vega0` — embed Vega-Lite specs from EHDP-data
- `datawrapper` — embed Datawrapper charts
- `accordion` — collapsible content sections
- `csvtable`, `rawhtml`, `storyheader`, `updateflag`

## CloudCannon CMS

`cloudcannon.config.yaml` and `.cloudcannon/` configure the CMS editor interface. `.cloudcannon/schemas/` contains frontmatter templates for editor-created content.

## Deployment

Branches are auto-built by GitHub Actions on merge:
- `production` → builds to `builds/prod-prod` (live site)
- `build-to-dev-stage` → builds to `builds/dev-stage` (staging)

Branch from `production`, named `hotfix-[NAME]`, `content-[NAME]`, or `feature-[NAME]`, and merge to `production` to deploy. **Merging to `development` for testing is deprecated** — individual branches are staged in CloudCannon instead. The evidence was already in the repo when this line still said otherwise: `development` appears in no row of readme-development.md's branch table, and `hugo-build-to-dev-prod.yml` is marked "In use? No" in its workflow table `[corrected 2026-08-26]`. Full workflow and environment tables: [readme-development.md](readme-development.md).

**Stacked branches yes, GitHub's Stacked PRs feature no** (decided 2026-08-23). Cutting B from A's tip and C from B's is worth keeping; retarget each PR to `production` by hand as the one below it merges. Don't enable the GitHub feature: merging the bottom PR fires a server-side cascading rebase that force-pushes every branch above it, so the hashes those branches recorded in their own ledgers stop resolving. The cost and the 24-pair mapping are in [audit-backlog-production-2026-08-20.md](documents/audit-backlog-production-2026-08-20.md).

**Test a new workflow with a PR into `production`, not by merging it.** `workflow_dispatch` only registers from the default branch — GitHub documents that the event "will only trigger a workflow run if the workflow file exists on the default branch" — but `pull_request` carries no such requirement, and opening a PR into `production` does not deploy, because `hugo-build-to-prod-prod.yml` is `types: [closed]` with a `merged == true` guard on the job. Once the file is on `production`, `gh workflow run <wf> --ref <branch>` runs *that branch's* copy `[verified 2026-08-24]`. A green run proves only the unconditional steps: this workflow's `if: failure()` artifact upload was dropping half its payload, and a deliberately reverted one-line regression is what ran it `[2026-08-24, run 32777189174]`.

A build can also be triggered on demand rather than by merging. `trigger_prod-prod_workflow.ps1` and `trigger_dev-stage_workflow.ps1` (with `.sh` equivalents) run `gh workflow run` against the matching workflow, and `.github/workflows/hugo-build-any-branch.yml` takes a `branch` input and publishes to `builds/[branch]`, or to a `publish-branch` input when one is given. These publish to real build branches — treat running one as a deploy, not a test.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell. Most were written against `feature-new-data-explorer`, which carries a substantially different data explorer — read them as that branch's record, not as a description of this tree. **Before recording any audit claim as stale, re-check it on `feature-new-data-explorer` and `production` too** — `git grep <pattern> <branch> -- <path>`. On 2026-08-05 two of four "stale" claims turned out to be branch differences.

- `documents/nr-architecture.md` — **not an audit**: the Neighborhood Reports narrative split out of this file on 2026-09-02, describing current code and carrying a `docs-check` stamp like this one does. Report page rendering, the shared picker partials, routing.
- `documents/site-wide-audit-2026-06-27.md` — everything outside the data explorer, and the active log for findings on this branch (§5f–§5j).
- `documents/data-explorer-architecture.md` — the other branch's explorer narrative. Not applicable here; carries a banner saying so.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active data explorer audit for that branch.
- `documents/data-explorer-deep-audit-2026-06-27.md` — closed/historical; superseded by the fresh audit.
- `documents/js-conventions.md` — JS conventions for all browser-side JS (see Coding conventions above). Its data-explorer examples describe the `feature-new-data-explorer` tree.
- `documents/nr-output-retirement-scoping-2026-08-04.md` — Neighborhood Reports: inventory, traffic, decisions, staging. Written against the `feature-MOD-Lab-NR-recode-refactor` branch, not `feature-new-data-explorer`.
- `documents/nr-decisions-and-sequencing-2026-08-04.md` — the NR decision record and order of work. Also this branch.
- `documents/nr-output-option-d-execution-plan-2026-08-06.md` — the file-by-file detail for the Option D swap, its Pagefind analysis, and the Stage F/G work, all landed 2026-08-08. §11 of the scoping memo is the ledger; this is the executable half. Its file-by-file list predates the picker restore below, so read it as the plan, not as the current template.
- `documents/nr-topic-index-picker-restore-2026-08-09.md` — the follow-up that restored the UHF42 map and the neighborhood typeahead to the topic index, which the Option D swap had dropped. Closed 2026-08-09.
- `documents/nr-neighborhood-picker-options-2026-08-09.md` — enlarging the picker map on the topic index and the NR landing page, and extracting the two duplicated copies into shared partials. Carries the ledger and the decision list for each cosmetic difference the unification forced. Closed 2026-08-09; read it as a dated record.
- `documents/nr-landing-list-unification-2026-08-09.md` — the follow-up that shared the 42-neighborhood list too, moved the `Choose Neighborhood` heading into the picker partial, and made the landing page's list links follow the active topic button. Carries the ledger.
- `documents/nr-pagefind-parity-2026-08-15.md` — the search-index audit against `production`: how the two indexes were compared, what the Option D swap and the server-rendered neighborhood list did to search precision, the `data-pagefind-ignore` fix and its measured effect, and the harness that now checks all of it. Carries the ledger. Closed 2026-08-15 by restoring production's model: **the 210 report pages carry a page-level `data-pagefind-ignore="all"` and are not in the search index**, which puts both branches at 201 indexed pages **as measured on that date** — the committed Pagefind baseline and the harness both read 202 on 2026-09-02, and that one-page difference is not diagnosed. §5 of that document is the Google Analytics test that would reverse it, and §2f records the two fixes that were tried first and did not work.
