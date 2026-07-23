# Data Explorer Tier 4.5 — Guardrails: design

**Date:** 2026-07-23
**Audit item:** §4.5 of `data-explorer-fresh-audit-2026-07-13.md` ("Guardrails worth adding while the code is hot")
**Status:** design approved; implementation plan to follow in `data-explorer-guardrails-plan-2026-07-23.md`

---

## 1. Purpose

Tier 4.5 is the cheapest item left in the fresh audit and is explicitly meant to land *before* 4.1 (dismantling `renderMeasures()`), because 4.1 is the riskiest refactor remaining and should not be attempted without a regression net.

Three gaps this closes:

1. **No linting.** The DE tree is 15 files and ~10,800 lines sharing one global scope. An undefined-name typo is this codebase's most likely regression class, and nothing currently catches one before a browser does.
2. **No npm scripts.** `package.json` has dependencies and nothing else. The characterization harness already exists, already supports `--baseline`/`--check`, and already exits non-zero on drift — but it is undiscoverable and undocumented.
3. **No console-error check.** During Tier 4.6's execution, a clean `hugo --cleanDestinationDir` build and static grep checks both passed while real pages were broken: the old explorer's map had lost Leaflet/TopoJSON entirely, and four data-features pages threw on `colorIcon`/`easyButton`. Only loading real pages in a browser found them.

## 2. Scope

**In scope:**

- ESLint flat config over `assets/js/data-explorer/` only.
- Three npm scripts: `lint`, `characterize`, `smoke`.
- A shared dev-server module, `documents/de-dev-server.mjs`.
- A new console-error smoke script, `documents/de-smoke-pages.mjs`.
- DOMPurify on the four genuinely metadata-derived `innerHTML` assignments in the DE tree.
- Documentation in `CLAUDE.md` and status entries in both audit docs.

**Explicitly out of scope — to be logged in `site-wide-audit-2026-06-27.md`, not built here:**

- Running lint as a CI job in the build workflows.
- A git pre-commit hook.
- A full classification sweep of all ~40 `innerHTML` assignments in the DE tree.
- The dead `nr-chooser` / `nr-clickable-uhf` / `nr-map-highlight` partials, which are three of DOMPurify's five layout consumers (already tracked in site-wide §5a).

**Behavioral impact:** none, except the three DOMPurify calls in §6. Everything else is config, dev tooling, and documentation.

## 3. ESLint

### 3.1 Configuration

New devDependencies: `eslint` and `globals`. One config file, `eslint.config.mjs`, at the repo root, scoped by a `files: ["assets/js/data-explorer/**/*.js"]` key so nothing else in the repo is linted.

`assets/js/data-explorer-old/` is deliberately excluded — it is marked "retired; do not modify" in CLAUDE.md, so lint findings there would be unactionable noise.

**`js.configs.recommended` is deliberately NOT extended.** It enables roughly fifty rules; the audit asked for two, and the other forty-eight would bury them on first run. Rules are set explicitly:

- `no-undef: "error"` — the actual target.
- `no-unused-vars` — configuration deferred to measurement, see 3.3.

### 3.2 Globals

`languageOptions.globals` merges three sources:

1. `globals.browser` from the `globals` package.
2. A hand-listed set of library and Hugo-injected names: `$`, `jQuery`, `L`, `aq`, `topojson`, `vegaEmbed`, `vega`, `d3`, `DOMPurify`, `chroma`, `qrcode`, plus `hugoEnv`, `baseURL`, `data_repo`, `data_branch`, and `debugLog` (the last five are injected by `head.html`, not by any library).
3. The DE tree's own top-level declarations, **derived at config-load time** by reading the 15 files and extracting top-level `function` / `const` / `let` / `var` declarations.

Source 3 exists because ESLint scopes every script file separately, while these 15 files genuinely share one runtime global scope. A measured 254 top-level declarations exist across the tree; a hand-curated list of that size would go stale, and a stale globals list produces false `no-undef` errors, which is how a linter gets ignored and stops catching anything.

Accepted trade-off: a typo'd *declaration* would be silently accepted as a global. Call-site typos — the regression class the audit actually names — are still caught.

**Acknowledged as the better long-term fix, not proposed here:** ES modules would make `no-undef` correct for free. CLAUDE.md deliberately keeps classic script tags for source-line traceability, and Tiers 4.1/4.2 are the structural items. This config exists to serve the codebase as it is.

### 3.3 The `no-unused-vars` open question

**This is unresolved by design and must be settled by measurement, not by assumption.**

It is not established whether ESLint 9's `no-unused-vars` reports unused *top-level* declarations in `sourceType: "script"` files. If it does, then every function declared in `map.js` and consumed only by `bar.js` is reported as unused — a false-positive rate that would make the rule unusable.

Implementation Step 1 therefore installs ESLint, runs it with a minimal config, and reads the real output before configuring this rule. Two outcomes are acceptable:

- Top-level declarations are not reported → enable `no-unused-vars` normally, tuning only `args`.
- They are reported → `no-undef` alone still delivers the audit's stated goal; `no-unused-vars` is logged as deferred with the reason recorded.

Findings from the first green run are handled as: fix in place if trivially safe and obviously correct, log to the audit otherwise. A lint pass is not a licence to refactor untouched code.

## 4. Dev-server module (`documents/de-dev-server.mjs`)

Both `characterize` and `smoke` need a running Hugo server. Neither should require the user to have started one, and neither may endanger a server the user *did* start.

Exports `ensureDevServer()`, returning `{ baseURL, stop }`. Resolution order:

1. **`DE_BASE_URL` is set** → use it verbatim; `stop` is a no-op. Preserves the existing documented override (added in `d5fb2ea700`) and skips probing entirely.
2. **Probe for a running server** — `http://localhost:8080`, then `http://localhost:1313`, trying each known baseURL prefix (`/dev-stage/`, `/local-stage/`, `/dev-prod/`, `/local-prod/`, `/IndicatorPublic/`, `/`) until one returns 200. Found → reuse it; `stop` is a no-op.
3. **Nothing answered, but a `hugo` process exists** → abort with a message naming the process and instructing the user to set `DE_BASE_URL`.
4. **Nothing answered and no `hugo` process** → spawn a server, poll until it answers, register teardown.

### 4.1 Safety invariants

These are not incidental; they encode a failure this repo has already suffered.

- **Never stop a server it did not start.** `stop` is a no-op in paths 1 and 2.
- **Never start a second server.** Path 3 is the guard. Hugo's default port is **1313**, not 8080, so "a server is running on a port we didn't probe" is the *likely* case rather than a hypothetical. Commit `d5fb2ea700` records what happens otherwise: a second server on :8081 rewrote the running server's asset URLs and livereload port, producing 87 console errors on the user's open tab. Probing two ports plus aborting on an unmatched `hugo` process makes that outcome unreachable.
- **Spawn the documented command verbatim** — `hugo server --environment dev_stage --cleanDestinationDir --logLevel debug -p 8080`, exactly as CLAUDE.md specifies, so no assumption of mine about Hugo's flag behavior is baked into the tooling.
- **Tear down on every exit path**, including `SIGINT`, so Ctrl-C does not orphan a server. On Windows, teardown is `taskkill /pid <pid> /T /F`; `child.kill()` alone does not reap descendants.

## 5. Console-error smoke test (`documents/de-smoke-pages.mjs`)

A standalone script, structurally modeled on `de-characterization.mjs` (same Playwright import, same `process.exitCode = 1` on failure) but with a separate concern: the harness characterizes DE render output across 3 indicator pages, while this checks *every template kind* for console errors. The two are needed at different times — the smoke test matters precisely when a shared template like `head.html` changes, which is when the DE harness is least relevant.

Loads each page in a fixed list, waits for network idle, and fails on any console `error` or `pageerror` event.

### 5.1 Page list

One page per template kind, weighted toward what Tier 4.6's bugs actually hit:

- Home
- `data-explorer` `single.html` and `section.html`
- `data-explorer-old` `single.html`
- Four data-features pages — `fvi`, `rats-in-your-neighborhood`, `rmz`, `realtime` — the exact `colorIcon`/`easyButton` casualties from 4.6
- `neighborhood-overlap` (the sole real consumer of `easyButton`/`colorIcon`)
- A neighborhood report, and an `nr-output` page
- A data story
- A take-action page

Paths are stored prefix-relative and joined onto whatever `baseURL` `ensureDevServer()` returns, so the list works unchanged across environments.

### 5.2 The known-noise allowlist

**This is load-bearing, not incidental.** Two pages in the list are *known* to be red today:

- `data-stories/housing` — Datawrapper iframe computing `NaN`/negative sizes inside a hidden Bootstrap tab. Documented, pre-existing, unfixed: site-wide audit §5b.
- `rats-in-your-neighborhood` — `area.contains()` has thrown since 2019. Documented, unfixed: site-wide audit §5c.

Without an explicit allowlist the script fails on its first run for reasons that are not regressions, and a check that is always red is a check nobody runs. Each entry is a commented pattern citing its audit section, so **fixing the underlying bug is what deletes the entry** — the allowlist shrinks toward zero rather than accumulating.

## 6. DOMPurify

The old explorer sanitized fetched-metadata HTML; the new tree does not. DOMPurify is loaded unconditionally site-wide (`head.html:128-129`), so it is already paid for on every DE page.

Four data-derived assignments across two files:

- `how_calculated` — `topic-indicator-selector.js:542`
- Sources — `global.js:358` and `global.js:360`
- About text — `global.js:363`

The `innerHTML = ''` clears at `global.js:349` and `topic-indicator-selector.js:534` are static empty strings and are left alone. Also deletes the dead commented-out sanitize call at `data.js:299`.

Actual risk is low — the data repo is DOHMH-controlled — so this is hygiene and parity restoration, not a vulnerability fix.

**This is the only change in Tier 4.5 that touches shipped SPA runtime code**, so it gets its own commit and its own `characterize --check` run. Sanitizing can strip markup that the metadata legitimately contains, which is a rendering regression rather than a security one; verification therefore includes a browser look at a rendered sources / how-calculated panel, not just a green check.

## 7. Documentation

`CLAUDE.md` gains a short **Guardrails** block under *Build and validation*:

- The three commands.
- That `characterize` and `smoke` reuse a running server, start one if none is running, and never stop a server they did not start.
- The `DE_BASE_URL` override and what the path-3 abort message means.
- That `characterize -- --check` and `smoke` are expected before any Tier 2–4 merge.

`data-explorer-fresh-audit-2026-07-13.md` §4.5 gains an execution-status entry. `site-wide-audit-2026-06-27.md` gains the four deferred items from §2.

## 8. Staging and verification

Five commits, each independently green.

| # | Change | Verification |
|---|---|---|
| 1 | ESLint config, devDeps, `lint` script | `npm run lint` exits 0. Step 1 also measures the `no-unused-vars` question in 3.3 and records the outcome. |
| 2 | `de-dev-server.mjs`; rewire `de-characterization.mjs` to it; `characterize` script | All four resolution paths exercised by hand: with `DE_BASE_URL` set; with a server already running; with nothing running; and with a server on 1313 — which **must abort, not spawn**. |
| 3 | `de-smoke-pages.mjs`, `smoke` script | `npm run smoke` exits 0, with every allowlist entry justified by an audit citation. |
| 4 | DOMPurify | `npm run characterize -- --check` exits 0, plus a browser check that no legitimate markup was stripped. |
| 5 | Documentation and audit status entries | — |

**Operational note:** verification path 4 of commit 2 requires deliberately starting a Hugo server, which CLAUDE.md otherwise forbids doing unprompted. That specific test is to be confirmed with the user before it is run; this design does not authorize it standing.
