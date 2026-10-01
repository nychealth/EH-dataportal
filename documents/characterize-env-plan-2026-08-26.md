# Per-environment characterization invocation

**Status as of 2026-08-26: tasks 1-8 DONE, `d14ab4e841..8c15d56ae7` on branch
`feature-characterize-env`, cut from `production` at `3d5438830c`. `npm run
characterize:site:prod_prod` passes 925/925 at `8c15d56ae7`. Task 9 — the `sample` positional,
added to match `feature-smoke-env`'s `smoke-env.mjs` — is DONE at `e92c7ac15c`.**

Derive what a status line cannot hold:

```
git log --oneline 3d5438830c..HEAD                          # the five task commits
git rev-list --left-right --count origin/production...HEAD  # right-hand number = unpushed
gh pr list --head feature-characterize-env                  # a PR, and against which base
```

## Why

`npm run characterize:site` can only check the environment `scripts/dev-server.mjs` happens to
resolve — it reuses whatever answers on :8080/:8081/:1313 and otherwise spawns `dev_stage`
(`dev-server.mjs:56`). Checking `prod_prod`, the environment that actually deploys, currently
means starting a server by hand and exporting `DE_BASE_URL`.

The check itself needs no new flag: `site-characterization.mjs:1015` derives the baseline key
from the running site (`env.hugoEnv === "prod_prod" ? "prod_prod" : env.dataBranch`). So the whole
feature is "start the right server and point the harness at it" — which
`site-characterization-rebaseline.mjs:187-228` already does correctly, for `--baseline`.

## Decisions taken

- **A dedicated npm script per environment, plus one generic script taking a positional.** Not
  `--env prod_prod` and not `--prod_prod`. Measured 2026-08-26, npm 11.4.1 under PowerShell, with
  a throwaway package printing `process.argv` and `npm_config_*`:

  | Invocation | Script sees |
  |---|---|
  | `npm run show --prod_prod` | `argv: []`, `npm_config_prod_prod=true` |
  | `npm run show --env prod_prod` | `argv: ["prod_prod"]`, `npm_config_env=true` |
  | `npm run show -- --env prod_prod` | identical — PowerShell ate the `--` |
  | `npm run show local_prod` | `argv: ["local_prod"]` |
  | `npm run show local_prod extra` | `argv: ["local_prod","extra"]` |
  | `npm run show local_prod --concurrency 8` | `argv: ["local_prod","8"]` |

  Bare positionals survive npm untouched; any `--flag` has its NAME eaten and its value left as a
  nameless positional. Hence: environments as positionals, and the wrapper REJECTS any argument
  starting with `--` rather than let `8` be read as an environment name. Flags stay available
  through a direct `node scripts/site-characterization.mjs` call.

- **Extract the server lifecycle rather than export it from `rebaseline.mjs`.** The shared piece
  is the isolation logic whose failure mode is corrupting a running server's `resources/_gen`; it
  should have one home, not a home and an importer.

- **Do NOT converge `.github/workflows/site-characterization.yml` onto the new wrapper.** Rejected
  deliberately. CI's server wait is clock-bounded (`$SECONDS` against a 300s deadline,
  `--max-time 120` per attempt, `kill -0 $HUGO_PID` to tell "still building" from "Hugo died",
  `tail hugo-server.log` on failure), tuned for a cold runner with no EHDP-data cache — one `curl`
  blocked 61s inside a single iteration on run 32771116783. Converging makes a local convenience
  script load-bearing for the deploy gate and trades a diagnosable failure for a generic timeout.

- **CI is out of scope and must stay that way.** It calls `node scripts/site-characterization.mjs`
  directly (`site-characterization.yml:240`, `:423`), never an npm script, and passes
  `DE_BASE_URL`, which takes `ensureDevServer`'s path 1 and never reaches the spawn logic. Nothing
  CI runs imports `rebaseline.mjs`. **The constraint that keeps this true: do not touch
  `dev-server.mjs`** — it IS imported by `site-characterization.mjs`, `smoke-pages.mjs`, and
  `site-characterization-probe-control.mjs`.

## Environment-to-key mapping

Derived by the harness, not by the wrapper. Only `staging` and `prod_prod` are committed, so the
rest exit 2 with the "No baseline" message at `site-characterization.mjs:1075-1092`.

| Environment | Key | Baseline committed? |
|---|---|---|
| `prod_prod` | `prod_prod` | yes |
| `dev_stage`, `local_stage`, `prod_stage` | `staging` | yes |
| `dev_prod`, `development`, `local_prod`, `production` | `production` | no |

## Tasks

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Extract `startServer` / `makeStop` / `responds` / `ENVIRONMENT_FOR` from `site-characterization-rebaseline.mjs` into a new `scripts/isolated-server.mjs`; import them back | `feature-characterize-env @ d14ab4e841` | **DONE 2026-08-26** | Reverse-transform: rebuilt the pre-move file from the two current ones, undoing only the declared normalizations (5 `export` prefixes, `sc-rebaseline`->`sc-isolated`, the import lines, one comment pointer). `diff` against the pre-move snapshot exits 0, byte-identical, 629 lines both sides. Plus `node --check` on both files; `import()` of the module lists exactly `ENVIRONMENT_FOR, ISO_ROOT, PORT, responds, startServer`; a symbol sweep shows `spawn`/`tmpdir`/`sleep`/`HUGO_BIN`/`PREFIXES`/`makeStop`/`SERVER_TIMEOUT_S` now at 0 occurrences in rebaseline and non-zero in the module; `--help` runs clean through the new import. The extracted `startServer` was also exercised for real, unintentionally — see the incident below |
| 2 | New `scripts/characterize-env.mjs <environment>` — validate the name against `config/`, reject `-` args, start server, build Pagefind into its isolated `destDir`, run `site-characterization.mjs --check --all` as a child with `DE_BASE_URL` + `DE_SERVER_OWNED=1`, stop in `finally` | `feature-characterize-env @ 4a91dd94f9` | **DONE 2026-08-26** | Five rejection paths, exit code read from `$LASTEXITCODE` on its own line rather than after a pipeline (a pipe returns the pager's status): no argument, `local_prod --concurrency 8` (arrives as two positionals), unknown environment, a `-` flag, two environments — **all exit 2** with a specific message. Concurrency pass-through was dropped: not asked for, and the harness's machine-derived default is better than a number chosen here |
| 3 | `package.json`: `characterize:site:env`, `characterize:site:prod_prod`, `characterize:site:dev_stage` | `feature-characterize-env @ 4a91dd94f9` | **DONE 2026-08-26** | 3-line diff, hand formatting intact — edited as a string replace, not a `json.load`/`dump` round trip, which would have reformatted the whole file. `npm run characterize:site:env` with no argument exits 2 listing the eight environments |
| 4 | Document the split: comment block in `characterize-env.mjs` and a CLAUDE.md line saying how `characterize:site:dev_stage` (isolated, private :8090 server, never reuses) differs from `characterize:site` (reuses whatever is up, builds into `docs/`) | `feature-characterize-env @ 4a91dd94f9` | **DONE 2026-08-26** | Two CLAUDE.md bullets and the four new command lines; the argument bullet carries the measured npm table rather than asserting the behaviour |
| 5 | End-to-end: `npm run characterize:site:prod_prod` against this tree | `feature-characterize-env @ 4a91dd94f9` | **DONE 2026-08-26** — with a caveat, see below | The wrapper worked: server up, `prod_prod` baseline selected unaided, 925 pages swept, server stopped, harness exit code (1) passed through. **Isolation proven:** `resources/_gen` 399 files and `docs/` 2934 files byte-identical on a path+size+mtime manifest before and after. The exit 1 is a real site diff, not a wrapper fault — see below. Log at `C:/temp/characterize-prod_prod.log` |
| 6 | Fold in the hazard the incident exposed: make `rebaseline.mjs` refuse unrecognized arguments instead of ignoring them | `feature-characterize-env @ 4a91dd94f9` | **DONE 2026-08-26** | `parseArgs` rewritten as one consuming pass returning `unknown`; `main` exits 2 on any leftover and points at `characterize-env.mjs`. The exact command from the incident, `rebaseline.mjs nosuchkey`, now exits 2 without touching a baseline — as do `--nosuchflag` and a dangling `--expect` (previously dropped in silence). Positive control the other way: `--report-only --expect "data-explorer/*" --concurrency 8` still parses and runs, echoing the glob as claimed-intended, exit 0, `git status` on the baseline path silent afterwards |
| 9 | Optional second positional `sample` on `characterize-env.mjs`, so the curated 41-page check can run against a NAMED environment; one argument contract with `feature-smoke-env`'s `smoke-env.mjs`. Plus `readme-development.md` and `CLAUDE.md` | `feature-characterize-env @ e92c7ac15c` | **DONE 2026-08-26** | Five rejection arms, each exit 2 with its own message: no argument, unknown environment, `--env prod_prod`, `prod_prod typo`, three positionals. The `typo` arm is the load-bearing one — without the explicit `SAMPLE` comparison it would have swept all 925 pages silently. End-to-end: `npm run characterize:site:prod_prod sample` -> **PASSED, exit 0**, 41/41 captured, every page quiescent before the cap, `prod_prod` baseline selected unaided, log at `C:/temp/characterize-sample.log`. That run also proves `sample` survives npm + PowerShell as a positional, and answers the open question about partial captures: the 884 uncompared pages are NOT reported as deletions — sample mode projects both sides through the intersection (`site-characterization.mjs:1345-1364`) |

## Incident 2026-08-26: an unintended re-baseline

`node scripts/site-characterization-rebaseline.mjs nosuchkey` was run as what was believed to be
an unknown-key error path. **That script takes no positional arguments at all** — `main()` sets
`keys = committedKeys()`, read from disk, and unrecognized argv is silently ignored. So the
invocation was the bare, destructive one: it began re-capturing BOTH committed baselines.

Killed after ~2 minutes, mid-sweep of `prod_prod`. Restored with the script's own documented pair,
`git checkout -- scripts/site-characterization-baseline` then `git clean -fd` on the same path.
Verified: `git status --porcelain` on that path is silent, both keys hold 926 files, and
`capturedAt` reads the original `2026-08-25T19:22:10.988Z` / `19:28:12.257Z`. `scripts/.sc-rebaseline`
removed; no `hugo.exe` survives and :8090 is free.

Two things it did establish, before it was killed: the extracted `startServer` works — it brought up
an isolated `prod_prod` server on :8090 serving `/IndicatorPublic/`, with `HUGO_RESOURCEDIR` and
`-d` under `C:/Users/Chris/AppData/Local/Temp/sc-isolated/` — and the harness then selected the
`prod_prod` baseline unaided and enumerated 925 pages.

**Actioned as task 6**, at the user's direction 2026-08-26 — this branch is where the argument
handling is being written, so the fix belongs with it rather than in a follow-up.

## Open: one page differs on `prod_prod`, and this branch did not cause it

`data-features/realtime-air-quality/` — `structure.img.total` 19 -> 18 and
`structure.img.missingAlt` 16 -> 15, against the `prod_prod` baseline captured at `e93bfcf1d5`
(2026-08-25). One `<img>` fewer, and the one that went had no `alt`.

Established:

- **Not caused by this branch.** `git diff --name-only production..HEAD -- themes assets config
  data content static` is empty, and so is the same diff against the working tree.
- **Not a Leaflet base tile.** `site-characterization.mjs:398` filters `.leaflet-tile` out of the
  `img` set, and the comment above it records why (four loads of one NR page gave `img.total`
  17, 17, 20, 20 purely from tile timing). Marker icons and anything else inside the map still
  count — the comment says so explicitly.
- The page draws a live map: `content/data-features/realtime-air-quality/js/realtime.js:462` adds
  a carto CDN tile layer, and the page's data is realtime air quality.

**It reproduces exactly.** A second `npm run characterize:site:prod_prod`, ~20 minutes after the
first, gave the identical page, the identical two fields and the identical numbers (19 -> 18,
16 -> 15). So this is a stable difference between the site as it renders now and the baseline
captured 2026-08-25, not a capture flake.

**Diagnosed 2026-08-26: it is one fewer map marker, drawn from live data.** The page was loaded
twice against an isolated `prod_prod` server and every `<img>` dumped with its class, `alt`, box and
`src`. Both passes: 30 images, 10 of them `.leaflet-tile` (excluded by the harness), and **exactly
15 `images/map-marker.svg` — every one of them with no `alt` attribute, and the only alt-less
images on the page.** The harness reads `missingAlt` 15 against a baseline of 16. So the marker
count went 16 -> 15, and `total` moved by the same 1.

Markers on this page are one per live air-quality monitor, so the count is a fact about the feed
that day, not about the site. **Nothing to fix in this repo.**

(The probe counted 20 non-tile images where the harness counts 18. The three the harness sees
besides markers are the two NYC logos and the portal icon; the two it does not are the Google
Translate widget's. `blockedHosts` in `_meta.json` lists `translate.google.com`,
`translate.googleapis.com`, `www.gstatic.com` and `www.googletagmanager.com`, so the widget cannot
initialize under the harness — consistent with the arithmetic, though not separately confirmed.)

**The general finding, which outlives this page:** `structure.img.total` and
`structure.img.missingAlt` track marker counts on any page whose map draws from live data.
`site-characterization.mjs:398` excludes `.leaflet-tile` and the comment there says marker icons
deliberately still count — that exclusion was written for tile *timing*, and does not cover a
marker set whose size is data-driven. Such a page goes red whenever the feed moves, with no
code change. Worth deciding separately from this branch: exclude marker icons too, or accept
periodic re-baselines.

## Task 8: stop counting map markers (in progress)

Direction from the user 2026-08-26: a marker count tracks monitor uptime, which is transient —
check for markers *at all* instead, and do not re-baseline for a down monitor.

Evidence the design rests on `[verified 2026-08-26 in a browser, isolated prod_prod server, three
page kinds]`: a marker `<img>` carries **no class of its own** — `div.leaflet-marker-icon` is its
PARENT — which is why `classList.contains("leaflet-marker-icon")` reads false and only `closest`
finds them. `el.closest(".leaflet-container")` separates cleanly: 25 of 30 images in-map on
`realtime-air-quality`, 9 of 14 on `neighborhood-reports/bayside_little_neck/` (all tiles, no
markers), 0 of 5 on `data-explorer/asthma/`.

Split in two so the count change is provable apart from the field addition, which by construction
touches all 925 records in both keys:

**Step 1 — widen the filter from `.leaflet-tile` to `.leaflet-container`.** Predictions, written
before the run:

1. Exit 1.
2. `data-features/realtime-air-quality/`: `img.total` 19 -> 3, `img.missingAlt` 16 -> 0.
3. NR pages do NOT move — their only in-map images are tiles, already excluded.
4. No field outside `structure.img.*` changes.
5. Unknown, and the reason this sweep is worth its five minutes: whether
   `data-features/proximity/` (131 images) and `data-features/congestion-pricing-report/` (115)
   carry in-map images. Both read `missingAlt` 0, so neither is alt-less markers, but nothing
   yet says what they are.

**Step 1 result: four of five predictions confirmed exactly; the fifth was the finding.**
Exit 1, four pages, two fields, nothing outside `structure.img.*`, and no NR page moved.
`realtime-air-quality` went 19 -> 3 and `missingAlt` 16 -> 0, as predicted. What the sweep bought
was prediction 5: `data-features/proximity/` 131 -> 3 and
`data-features/congestion-pricing-report/` 115 -> 4 **both carry in-map images** — 128 and 111 of
them — and `data-features/heat-story/` 22 -> 3 carries 19. Three pages nobody had looked at were
recording map contents as page structure. Log at `C:/temp/characterize-step1.log`.

**A cost I flagged, then retired.** The worry was that those 128 and 111 in-map images might be
static page content the check would stop watching. They are not: the control shows all of them are
`map-pin-hollow_P.svg` marker icons — 128 on `proximity`, 111 on `congestion-pricing-report`, 19 on
`heat-story` — the same category as air-quality's 15 `map-marker.svg`. All four are marker sets
drawn from data, differing only in how fast their data moves. Excluding them loses no static
imagery. What remains true, and is the real trade: a map that loses *some* markers but not all now
passes, because presence is all that is recorded.

**Step 2 — add `img.mapMarkers`**, a boolean: did the map draw any markers at all. Queried as
`.leaflet-marker-icon` directly rather than through the images, so a marker drawn without an
`<img>` still counts. **Positive control passed, both directions** `[2026-08-26, six pages, isolated prod_prod server]`:

| Page | `.leaflet-marker-icon` | `mapMarkers` |
|---|---|---|
| `data-features/proximity/` | 128 | `true` |
| `data-features/congestion-pricing-report/` | 111 | `true` |
| `data-features/heat-story/` | 19 | `true` |
| `data-features/realtime-air-quality/` | 15 | `true` |
| `neighborhood-reports/bayside_little_neck/` | 0 | `false` |
| `data-explorer/asthma/` | 0 | `false` |

So the selector is not dead, and `false` is not its only reading. The two `false` rows are the
arm that matters — a map with tiles and no markers, and a page with no map — since a selector
matching nothing would produce them too, and only the `true` rows rule that out. Marker counts
reconcile against the baseline arithmetic on all four: 128 + 3 chrome = 131, 111 + 4 = 115,
19 + 3 = 22, 15 + 3 = 18/19.

**Step 2b — key the exclusion by page** (user direction 2026-08-26, replacing the global form).
Only `realtime-air-quality` reads a live feed; `proximity`, `congestion-pricing-report` and
`heat-story` draw markers from data that changes by hand, so on those pages a marker appearing or
vanishing IS the regression the check exists to catch, and their counts stay. This also retires
`mapMarkers` as a global field: where counts are kept, a marker set dropping to zero already shows
as a count diff, so the flag is recorded only where the count was suppressed.

Keyed on the record's own `path`, derived inside `CAPTURE` from `location.pathname` and `prefix`
using the same stripping idiom as `:321`, so neither caller's one-argument signature changes.

Predictions before the run:

1. Exit 1.
2. **Exactly one page** differs: `data-features/realtime-air-quality/`.
3. On it: `img.total` 19 -> 3, `img.missingAlt` 16 -> 0, plus a new `mapMarkers: true`.
4. `proximity`, `congestion-pricing-report` and `heat-story` do **not** move — this is the
   control on the keying. If they move, the page match failed open.
5. No other page gains `mapMarkers`.

A wrong prefix match would make `liveMarkers` false everywhere, leaving the page at 19 and the run
green at 0 pages — so the run discriminates the failure mode rather than merely passing.

**Result: all five confirmed** `[2026-08-26, C:/temp/characterize-step2b.log]`. `1 of 925 page(s)
differ, across 3 field(s)`, all on `data-features/realtime-air-quality/`: `total` 19 -> 3,
`missingAlt` 16 -> 0, `mapMarkers` undefined -> true. `proximity`, `congestion-pricing-report` and
`heat-story` kept their 131, 115 and 22 — the keying scoped rather than failing open.

**Step 3 — re-baselined both keys, at the user's go-ahead.** `node
scripts/site-characterization-rebaseline.mjs --expect "data-features/realtime-air-quality/"`:
1 of 925 pages changed in each key, 1 covered by `--expect`, 0 not, **"Nothing unexplained"** on
both, `"arbitrated": []` on both. The EHDP-data drift this was watched for did not materialize.

Working tree matched the report exactly: four files, the two records carrying `19 -> 3`,
`16 -> 0`, `+mapMarkers: true` and nothing else, plus the two `_meta.json` — which also gained
`dataCommit`, `arbitrated`, `cleared` and `capped`, fields the harness grew after 2026-08-25, so
their absence was the stale half rather than anything this change did. Provenance now records
production data at `c03ccd89fb` (2026-08-26) and staging at `b2b63d0635` (2026-08-17).

**Then the check itself was re-run, which is a different claim from "the capture succeeded":**
`npm run characterize:site:prod_prod` -> `Characterization check PASSED`, 925/925 pages, every one
reaching DOM quiescence before the cap, exit 0.

All of task 8 is at `8c15d56ae7`.

## Environment state

- Branch `feature-characterize-env`, cut from local `production` at `3d5438830c`. Upstream is
  now `refs/heads/feature-characterize-env` — its own name, not `production`.
- No Hugo server running at branch time (`Get-NetTCPConnection -LocalPort 8080,8081,1313` returned
  nothing; no `hugo.exe`).
- Task 5 spawns a private server on :8090 and writes an isolated build under the temp root
  `rebaseline.mjs:87` defines. If a run is interrupted, check for a surviving `hugo.exe` on :8090.

## Next command

```
git -C . rev-parse --abbrev-ref HEAD     # expect feature-characterize-env
git log --oneline 3d5438830c..HEAD       # the task commits
git branch -a --contains e92c7ac15c      # where task 9 has reached since
```

All nine tasks have landed. Nothing is queued; the branch is ready for a PR into `production`.

To re-run task 9's end-to-end proof from scratch: `npm run characterize:site:prod_prod sample`,
expect `Characterization check PASSED`, exit 0, 41/41 pages, and one named uncompared page
(`data-explorer/asthma/?id=2380` — no baseline record exists for a query string, in either
baseline; `find scripts/site-characterization-baseline -name '*id=2380*'` returns nothing).

`feature-smoke-env` carries the same `sample` contract on `smoke-env.mjs` and has already edited
`readme-development.md`'s command table and its "Checking a specific environment" block. The two
branches will conflict in that file. **Take both sides** — the edits are the smoke row and the
characterization row of the same table, and the smoke lines and characterization lines of the same
code block.
