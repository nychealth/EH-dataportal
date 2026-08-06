<!-- docs-check source-roots: assets/js/data-explorer assets/js/nr-topic-spa themes/dohmh/layouts scripts -->
<!-- docs-check verified: 12c21b70b1 2026-07-29 -->
<!-- docs-check ignore: maxAge ignoreFiles -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NYC Department of Health & Mental Hygiene's [Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/) — a Hugo static site providing public access to environmental and health indicators through data stories, an interactive data explorer, neighborhood reports, and topic pages.

Most indicator data lives in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository (not this repo). Site code fetches it at build time via `data_branch` config variable and at runtime via `data_repo` param in Hugo templates/JS.

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

Browse locally at http://localhost:1313/EH-dataportal

Always open a **fresh browser tab** after rebuilding — fingerprinted JS bundles are cached aggressively, so an existing tab may serve stale assets even after a rebuild. Relatedly, a server started *before* a shared-template edit can go on serving stale pages, so a smoke run may pass against output that predates your change.

**Never run a static `hugo` rebuild while a `hugo server` is also running**, even against a different `--environment`. Both share the same on-disk resource-fingerprint cache (`resources/_gen/`), which isn't environment-namespaced — a static rebuild can poison the live server's cache with the wrong environment's asset paths, breaking every page on the live server with MIME-type-refused/404 errors until it's restarted. To verify a static build while someone's dev server is live, inspect the generated `docs/` HTML directly instead of hitting the live server; if you need the live server itself to reflect a change, ask before restarting a process you didn't start.

## Guardrails

Five npm scripts, run from the repo root:

- `npm run lint` — ESLint (`no-undef`) over `assets/js/data-explorer/` and `assets/js/nr-topic-spa/`. `eslint.config.mjs` has one block per target. Both are directories of classic scripts sharing one global scope, so each block derives its shared globals at config-load time by scanning its own directory via `scanDeclaredGlobals(dir)`; `no-undef` catches the undefined-name typos that scope is most prone to. `no-unused-vars` is intentionally omitted — it false-positives on the cross-file global pattern. Names injected from outside a directory (libraries, and the inline `<script>` blocks in `themes/dohmh/layouts/data-explorer/single.html`) are listed per block in `DE_EXTERNAL_GLOBALS` / `NR_EXTERNAL_GLOBALS`. **Adding a file to `eslint.config.mjs` does not put it in scope**; the `lint` script's argument list is what selects files, and the two must be changed together. A green run proves nothing by itself — the check that the directory scan actually loaded is a *positive* control: call a name declared in another file of the same directory and confirm lint still passes.
- `npm run smoke` — loads one page per template kind and fails on any non-allowlisted console `error`/`pageerror` (`scripts/smoke-pages.mjs`). Run before any merge that touches a shared template like `head.html`. Before relying on it as the proof for a change that only executes on one page kind, confirm that page is in `PAGES` — those comments are claims that rot like doc prose. Two caveats: the generic `Failed to load resource` allowlist entry hides the *cause* of blocked-script failures, leaving only a downstream `X is not defined`, so diagnose those with a separate unfiltered probe; and a cache-cold first run has been seen to fail spuriously (site-wide audit §5j).
- `npm run docs-check` — verifies that docs claiming to describe *current* code still name real paths and real identifiers (`scripts/docs-check.mjs`). **Opt-in**: a doc is checked only if it declares a `docs-check source-roots` comment in its first lines. Audits and dated findings must **not** opt in — they cite old names on purpose. Run it after any rename; it is the cheapest thing that catches doc rot at the commit that causes it. It scans every `.md` in `documents/` plus the root docs in `ROOT_DOCS` — **this file is one of them**, so a path or identifier written here must be real and repo-root-relative. Site URLs, globs, and placeholder patterns are skipped.
- `npm run characterize:nr` — Playwright characterization harness for the Neighborhood Reports topic SPA (`scripts/nr-characterization.mjs`). Captures rendered output — neighborhood header, demographics, ZIP list, accordion ids, chart count, **and the final URL** — for three topic/neighborhood pairs, and diffs them against `scripts/nr-characterization-baseline/`. `-- --check` to verify, `-- --baseline` to re-capture. Neighborhood selection goes through the SPA's own `sessionStorage` bridge rather than clicking the Leaflet map, so runs are deterministic. The captured final URL is the guard against a silent redirect to the 404 page. Run it before any merge touching the NR templates or `assets/js/nr-topic-spa/`. Note it never expands an accordion panel, so `chartCount` is 0 in every baseline and the whole Vega path is uncovered — a change touching `chart.js` needs a browser pass on top.
- `npm run characterize:de` — the equivalent harness for the data explorer (`scripts/de-characterization.mjs`). **Currently non-functional on this branch**: it was written against the `feature-new-data-explorer` explorer and waits on DOM this branch never produces. Migrated for parity, not usable here; no baseline is committed. Do not treat a failure from it as a regression signal.

`smoke` and the characterization harness **reuse a running dev server, start one if none is running, and never stop a server they didn't start** (via `scripts/dev-server.mjs`). Import `ensureDevServer()` directly for one-off browser checks: **starting a server when none is running needs no permission.** The "ask first" caution is about a server *you didn't start*. Set `DE_BASE_URL` to point them at a server on a non-default port/environment. If a `hugo` process is running but they can't find it on :8080/:1313, they abort with instructions rather than start a second server — a second server poisons the running one's fingerprint cache.

## Root-cause claims

A causal claim about runtime behavior — CSS, DOM, layout, timing, browser APIs — must cite an observation from a running browser, not reasoning about the source. This applies at **any change size**: a one-property CSS fix needs it as much as a template-wide refactor. Plausibility is not evidence, and a well-written explanation is not a verified one.

- **State the disconfirming test you ran and what it showed**, before proposing the fix. "I hid the child element and the ring rendered correctly" is evidence. "Outlines don't follow asymmetric border-radius" is a guess.
- **If a nearby working example contradicts your theory, the theory is wrong.** Do not add a secondary explanation for why the working case is exempt — that is how a wrong diagnosis survives review.
- **Mark unverified reasoning as unverified.** If a fix ships on a hypothesis you could not test, write `// HYPOTHESIS (unverified):` rather than stating the cause as fact. A confident wrong comment misleads every later attempt; the next person re-tests a hypothesis but trusts an explanation.
- **After one failed fix attempt, stop and gather runtime evidence** instead of trying a second theory. Two speculative fixes in a row means the premise is wrong, not the implementation.
- **Rule out your own confounds before reporting a cause.** If you ran a static build in the same tree as the server you are testing, or the cache was cold, that is a candidate explanation you introduced — eliminate it, and say that you did.
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
- `data/globals/` — YAML data accessible throughout templates (featured data, NR specs, SEO vars)
- `documents/` — Internal audits and technical write-ups
- `scripts/` — Node dev tooling (smoke test, docs-check, dev-server helper)
- `docs/` — Generated output; never edit directly

### Layout routing

- `_index.md` → `section.html` (section landing pages)
- `index.md` or `name.md` → `single.html`
- Frontmatter `layout: custom` → `custom.html` in the section's layouts folder
- Frontmatter `type: X` routes to the `X` layouts folder — this is how neighborhood reports reach `nr-output`

### JS architecture

JS files under `assets/js/` are fingerprinted and served with Subresource Integrity. Dependencies from `node_modules` are mounted into `assets/node_modules` via Hugo module mounts — they are bundled locally, not loaded from CDNs.

### Data explorer

`assets/js/data-explorer/` is a vanilla-JS app of 10 files loaded as classic `<script>` tags sharing one global scope. **Load order is critical** and is set in `themes/dohmh/layouts/data-explorer/single.html`:

`global → data → measures → table → map → links → disparities → trend → app → print`

- `global.js` declares the shared top-level state. Add new cross-file state there rather than assigning an undeclared name — an implicit global works at runtime but defeats `npm run lint`, which is what proves renames complete.
- Data flow: indicator metadata → Arquero table → `joinData` → `renderMeasures` → the `show` renderers (`showMap`, `showTable`, `showTrend`, …).
- `single.html` also defines `renderIndicatorDropdown`, `renderIndicatorButtons`, and `createCitation` in inline `<script>` blocks, because they read template markup Hugo has to render. They are called from `data.js`, which works because classic scripts share one top-level scope.
- `renderLinksChart` (`links.js`) and `renderTrendChart` (`trend.js`) are each a single function spanning nearly their whole file.

Key gotchas:
- `isDataTable` is reached via the lowercase-`d` jQuery plugin property, not the capitalised one.
- UI state uses prettified geotypes (`NTA`, `CDTA`, `PUMA`); data rows may carry versioned values. Normalize with `prettifyGeoType` before comparing. `assignGeoRank` derives its ranking from the same source, so a new versioned variant only needs adding in one place.
- The search modal must live in `baseof.html`, not `footer.html`, to avoid Pagefind double-initialization on footerless pages.
- `head.html` gates its library block on page kind and section. That condition does **not** cover section pages — which is why the data explorer landing page throws `aq is not defined` (site-wide audit §5f). Check the gate before assuming a library is available on a given template.

### Neighborhood Reports

Two distinct systems share the `neighborhood-reports` section:

- **Per-neighborhood reports** — content under `content/neighborhood-reports/`, `type: nr-output`, rendered by `themes/dohmh/layouts/nr-output/section.html` and `themes/dohmh/layouts/nr-output/single.html`. JSON spec per neighborhood lives in EHDP-data.
- **Topic SPA (Phase 2)** — `assets/js/nr-topic-spa/` with `themes/dohmh/layouts/neighborhood-reports/nr-topic-spa.html`. Topic content files set `layout: nr-topic-spa` and an explicit `url`, giving topic-first URLs. Ten classic scripts sharing one global scope, mirroring the data explorer: `global → url → tertiles → demographics → cards → report → chart → map → data → app`. **Load order is set in the template and `app.js` must be last** — it holds the only two statements that run at load time. `global.js` declares the shared state, each binding annotated with the files that read and write it. Unlike the DE charts, `chart.js` passes `renderer: 'svg'` to `vegaEmbed` — so NR chart marks are inspectable DOM nodes, while the canvas-rendered DE charts are not.

Routing note: production uses an IIS rewrite for topic/neighborhood URLs. `hugo server` has no equivalent, so `themes/dohmh/layouts/404.html` intercepts those, stores the neighborhood slug in `sessionStorage`, and redirects to the clean topic URL, where the SPA restores it. That bridge is load-bearing in dev — see site-wide audit §5i for a merge scenario where it sends report pages to a 404.

### SCSS

`assets/scss/theme.scss` is the root entrypoint, importing Bootstrap overrides and custom styles in lettered files. Bootstrap itself is mounted from `node_modules`.

### Content sections

| Section | Layout folder | Notes |
|---------|---------------|-------|
| `data-stories` | `data-stories` | Markdown articles with Vega/Datawrapper shortcode embeds |
| `data-explorer` | `data-explorer` | Each topic MD lists an indicators array; JS drives all visualization |
| `neighborhood-reports` | `neighborhood-reports` + `nr-output` | See above |
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

| Environment   | Data branch | Purpose                              |
|---------------|-------------|--------------------------------------|
| `development` | production  | Preview site changes (default local) |
| `dev_stage`   | staging     | Preview combined site + data changes |
| `production`  | production  | Deploy to production servers         |
| `prod_stage`  | staging     | Preview data changes only            |
| `local_prod`  | production  | Uses locally hosted data repo        |
| `local_stage` | staging     | Uses locally hosted data repo        |

Key per-environment variables: `baseURL` and `data_branch`.

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

## Hugo-specific rules

- Edit source files (`content/`, `themes/dohmh/layouts/`, `assets/`, `data/`, `config/`). Never edit `docs/`.
- Front matter, slugs, and asset references are load-bearing — small typos can break URLs or builds.
- Environment-specific values go in config, not hardcoded strings.
- For a page with substantial inline JS, externalize it to a per-page folder under `assets/js/` and load it through the `short-fingerprint` partial as a fingerprinted script with an integrity attribute. Keep scripts as classic (non-module) tags when they share global scope across files — load order matters and isn't enforced by tooling, so state it explicitly in a template comment.

### Subresource Integrity (SRI)

Hugo calculates integrity hashes for all local JS/CSS resources using the `short-fingerprint.html` partial (a custom hash-shortening wrapper around Hugo's built-in integrity function). If SRI breaks on production, check that end-of-line characters are Unix `LF` — the GitHub Actions workflows enforce this on merge.

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

Branch naming convention: `hotfix-[NAME]`, `content-[NAME]`, `feature-[NAME]`. Branch from `production`; merge to `development` for testing, then to `production` to deploy.

## Audit documents

Detailed technical audits live in `documents/`. Check these before making structural changes to the data explorer or site shell. Most were written against `feature-new-data-explorer`, which carries a substantially different data explorer — read them as that branch's record, not as a description of this tree. **Before recording any audit claim as stale, re-check it on `feature-new-data-explorer` and `production` too** — `git grep <pattern> <branch> -- <path>`. On 2026-08-05 two of four "stale" claims turned out to be branch differences.

- `documents/site-wide-audit-2026-06-27.md` — everything outside the data explorer, and the active log for findings on this branch (§5f–§5j).
- `documents/data-explorer-architecture.md` — the other branch's explorer narrative. Not applicable here; carries a banner saying so.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active data explorer audit for that branch.
- `documents/data-explorer-deep-audit-2026-06-27.md` — closed/historical; superseded by the fresh audit.
- `documents/js-conventions.md` — JS conventions for all browser-side JS (see Coding conventions above). Its data-explorer examples describe the `feature-new-data-explorer` tree.
- `documents/nr-output-retirement-scoping-2026-08-04.md` — Neighborhood Reports: inventory, traffic, decisions, staging. Written against the `feature-MOD-Lab-NR-recode-refactor` branch, not `feature-new-data-explorer`.
- `documents/nr-decisions-and-sequencing-2026-08-04.md` — the NR decision record and order of work. Also this branch.

## Common gotchas

- **Missing images cause build failures.** Hugo resizes images at build time; a missing source image will abort the build.
- **Build caching.** Remote EHDP-data resources can be cached. Set `maxAge = 0` in config to disable if updates aren't appearing in a build.
- **SRI + line endings.** Integrity hash mismatches on production usually mean `CRLF` line endings snuck in. GitHub Actions normalizes these on merge.
