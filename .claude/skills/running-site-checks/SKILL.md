---
name: running-site-checks
description: Use when running or interpreting this repo's QA sweeps — npm run smoke / smoke:all / smoke:env, and characterize:site and its per-environment variants. Covers the commands, what each check can and cannot see, the allowlist and baseline rules, the concurrency and re-capture caps, and the ways a green result can mislead you. Reach for it before trusting a pass, before adding a KNOWN_NOISE entry, and before re-capturing a baseline.
---

# Running this repo's site checks

`smoke` runs the site's JavaScript and fails on console errors. `characterize:site` loads every
page once and diffs its rendered structure against a committed baseline. Neither interacts with
the page, so neither sees a chart that renders only on a tab click or an accordion expand — see
`documents/chart-coverage-plan-2026-09-09.md`.

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

**CI runs the full sweep on every PR into `production`.** `.github/workflows/smoke.yml` builds
`prod_prod` on the runner, builds Pagefind and then *asserts* the index is served, and sweeps every
page; `workflow_dispatch` offers the 33-page sample instead. A failing sweep triggers a
`base-control` job that rebuilds the site from the base branch tip and runs **this PR's harness**
against it — green means the PR caused it, red means the data or a third party moved. The harness
aborts `www.googletagmanager.com`, so no sweep reports page views to Google Analytics.

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

