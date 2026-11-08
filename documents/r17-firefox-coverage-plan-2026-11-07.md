# R17: Firefox engine coverage — plan and ledger (2026-11-07)

Closes N-109 in `documents/site-wide-audit-2026-10.md` (batch R17): no harness or CI job runs the
site in Gecko. Branch `feature-audit-r17-firefox-coverage`, cut from `production` @ `558c53cb07`.

**Status as of 2026-11-08: steps 1-3 done locally (sweeps passed on both engines); step 4 written, unproven until a PR into `production` runs it; step 5 waits on that run.**

Evidence files live in the git-ignored `scripts/.sc-rebaseline/r17/`.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | `SMOKE_ENGINE` env switch in `scripts/smoke-pages.mjs` (`chromium` / `firefox`, default `chromium`; prints `Engine: …`). WebKit was left out: never run, so not offered | | **DONE 2026-11-08** | Curated 44 on isolated `prod_prod` via `smoke-env.mjs prod_prod sample`: Firefox 7 of 44 failed, Chromium control 44 of 44 passed `[verified 2026-11-07: ff.log, cr.log, ff-sample-report.json, cr-sample-report.json]` |
| 2 | Full `--all` sweep under Firefox, isolated `prod_prod` | *no commit* — a measurement | **DONE 2026-11-08** | `SMOKE_ENGINE=firefox node scripts/smoke-env.mjs prod_prod` on `558c53cb07`: 1189 pages, 120 failed, re-check skipped (`recheckCapped: true`, over the 25 cap). Signatures: 85 `page.goto: Timeout 30000ms exceeded`, 43 `pt.dwcdn.net` MIME, 2 `5000ms timeout exceeded` (assaults, food), 1 `__dw$1.vis is undefined` + `r.dataset is undefined` (air-quality-and-covid) `[verified 2026-11-07: ff-all.log, ff-all-report.json]`. Sequential re-check of the 87 non-MIME pages on a fresh isolated `prod_prod` server with Pagefind: 87 of 87 reached `load` (median 454ms, max 1442ms), 0 with an error outside the allowlist — so the 85 timeouts are a concurrency-24 effect, not Gecko defects `[verified 2026-11-07: recheck.mjs firefox → recheck-firefox.log / .json]`. Full sweep at concurrency 8 (`sweep-at.mjs firefox 8`): 1189 pages, 45 failed, **every one on `pt.dwcdn.net` MIME errors alone**; 0 load timeouts, 0 Datawrapper errors `[verified 2026-11-08: ff-all-c8.log, smoke-2026-11-08T05-26-49-237Z.json]`. Concurrencies between 8 and 24 not tried |
| 3 | In `smoke-pages.mjs`: `SMOKE_ENGINE` validated at module scope (unknown → exit 2), `FIREFOX_CONCURRENCY_CEILING = 8`, a Firefox-only `KNOWN_NOISE` entry for the `pt.dwcdn.net` MIME text, `engine` in the report | | **DONE 2026-11-08** | `node --check` 0; `SMOKE_ENGINE=firfox` → exit 2 with the message. `SMOKE_ENGINE=firefox node scripts/smoke-env.mjs prod_prod`: **PASSED, 1189 clean** at concurrency 8, the new entry 234x on 46 pages `[verified 2026-11-08: ff-all-final.log, ff-all-final-report.json, base 558c53cb07 + working tree]`. Chromium control `node scripts/smoke-env.mjs prod_prod sample`: PASSED 44 clean, the new entry 0x, the other entries' tallies identical to the pre-change sample run (2 / 1 / 0 / 47 on 44) `[verified 2026-11-08: cr-sample-final.log vs cr.log]`. Observed, not acted on: under Firefox the `favicon\|Failed to load resource\|net::ERR` entry read 0x over 1189 pages (47x on 44 under Chromium) — Firefox does not log resource 404s as console errors, so the engine-independent EHDP-data response-status check is what covers those there |
| 4 | `.github/workflows/smoke.yml`: `engine: [chromium, firefox]` matrix on `smoke` and `base-control`, `fail-fast: false`; engine in both concurrency groups (a shared job-level group would have the legs cancel each other) and in both artifact names; `SMOKE_ENGINE` passed to the harness | | **In progress** — written; needs a PR run | None yet: no YAML parser or actionlint installed locally, so the first PR run is the proof. Decision taken: base-control runs both engines whenever either sweep leg fails (~10 min of extra runner) rather than plumbing per-leg results. Firefox leg duration on the 4-core runner unmeasured; `timeout-minutes: 25` unchanged |
| 5 | Audit: close N-109, file a row for each Firefox-only finding from step 2 | | Not started | — |

## Findings so far

- **The only Firefox failure on the curated 44 is a harness condition, not a site defect.**
  Datawrapper's embed script requests `pt.dwcdn.net/<id>.css`, which answers `200` with no
  `Content-Type` and a 0-byte body, for either UA, scheme or referer (curl). Locally, Firefox logs
  `The stylesheet … was not loaded because its MIME type, "text/plain", is not "text/css"` once per
  request; on the live `https://a816-dohbesp.nyc.gov` pages it logs nothing, with the same request
  counts (housing 7, rat-report 32, air-quality-snapshots 9) `[verified 2026-11-07: dwprobe2.mjs,
  dwprobe3.mjs]`. The trigger is the `http://localhost` top-level page, but **whether it is the
  http scheme or the localhost host was not separated**. CI also serves `http://localhost`, so a
  Firefox CI job needs the entry. The file is empty, so no styling is lost in either case.
- A no-throw Firefox bug (N-108's class) is invisible to any smoke sweep; this plan does not cover
  that, and says so in the N-109 closure.

## Next command

```bash
git push -u origin feature-audit-r17-firefox-coverage
gh pr create --base production --head feature-audit-r17-firefox-coverage
gh pr checks <PR#> --watch   # expect four smoke jobs: chromium + firefox, base-control skipped
# pass: the firefox leg green inside timeout-minutes 25; record its duration in row 4
```

Fill this table's Commit column with the hash(es) once the work commits, in a separate ledger commit.
