# Whole-site characterization harness — plan

**Status as of 2026-08-23:** branch `feature-site-characterization` cut from `production` at
`d8c45abebe`. **All six tasks done.** **Every one of the eleven probes has been proved to fire**
against an injected regression — Task 4's findings table is the evidence, and it is what a passing
`--check` is worth. The committed baseline is 925 pages captured at `6200892d85` against
`/dev-stage/`, and `npm run characterize:site` passes against it with zero pages differing.

One signal was **deleted** after Task 6's first full check failed on it: `img` no longer counts
Leaflet tiles, which were a measure of network timing rather than of page structure.

**Baselines are per environment class** — `staging/`, `production/`, `prod_prod/` under
`scripts/site-characterization-baseline/`, selected automatically from the running site. `staging`
and `prod_prod` are committed; see Task 8.

**Task 7 found that the DOM-quiescence detector had never worked** — the MutationObserver threw
on attach and the counter read a constant 0 on every page since Task 1. Fixed and guarded; the
committed baseline was unaffected and did not need re-capturing. Read Task 7 before trusting any
sentence elsewhere in this document that credits the quiescence wait for anything.

**Read Task 3's findings before trusting anything Task 1 concluded.** Task 1 declared the harness
deterministic on three agreeing sweeps; Task 3's first `--baseline`/`--check` cycle disproved it.
**The cause of that failure is still unestablished** — three explanations were proposed, two are
ruled out and one is unsupported, and it has not been reproduced since. What is in the harness is a
guard justified by the observed failure, not a fix for a known mechanism. This harness has also
produced three separate false "N runs agreed" results, so agreement is weak evidence here.

**The committed baseline is the 925-page one.** Re-capture it with
`npm run characterize:site:baseline`, never by hand, and commit the whole directory — `_meta.json`
records the commit, the environment prefix and the viewport that make the records comparable.

**One thing a later reader must not miss:** the baseline is **environment-specific**. `meta.robots`
reads `"noindex, nofollow"` on all 925 pages under `dev_stage`; under `prod_prod` the same field
would read `"all"` on most pages and `"noindex"` on the `resources` section
(`head.html:46-53`). Record the environment alongside any baseline, and never compare baselines
taken under different ones.

## Why this, when `smoke` already exists

`scripts/smoke-pages.mjs` loads all 925 pages and fails on unallowlisted console `error` /
`pageerror`. That catches exactly one class of regression: JS that throws. It is blind to a page
that renders wrongly without complaining — a library that stopped loading because `head.html`'s
gating changed and nothing on the page needed it yet, a heading level that started skipping, an
`alt` that vanished, a table that lost its `<th>`, a container that started overflowing the
viewport, an `<iframe>` that renders at zero height.

`npm run smoke:all` passed 925/925 at `d8c45abebe`
`[verified 2026-08-23: mode=all, concurrency=6, failures=0, clearedOnRecheck=0,
report scripts/smoke-reports/smoke-2026-08-23T15-52-38-788Z.json]`. That is the starting condition
this harness is characterizing, not a claim that the site has no regressions of the kind above.

### What this is not redundant with

Five characterization harnesses already exist on `feature-MOD-Lab-NR-recode-refactor`, none merged
to `production` `[verified 2026-08-23: git ls-tree -r --name-only <branch> -- scripts/]`:

| Harness | Lines | Covers |
|---|---|---|
| `de-characterization.mjs` | 386 | Data explorer, a fixed indicator set, driven through tabs |
| `nr-characterization.mjs` | 428 | NR report page, fixed topic/neighborhood pairs |
| `nr-a11y-audit.mjs` | 647 | axe over four NR page kinds |
| `nr-postswap-check.mjs` | 269 | One-time Option D before/after |
| `pagefind-characterization.mjs` | 780 | Search index contents |

All five are **depth-first**: few pages, driven through interactions. This one is the orthogonal
axis — **breadth-first and shallow**, every page, one load each, no interaction. It does not
replace any of them and they do not cover it.

`cp-characterization.mjs` (on this branch) is the convention to inherit: `--baseline` / `--check`,
output tree diffed with `git diff --no-index --exit-code`, dev-server reuse via `ensureDevServer()`.

## Decisions taken

| Decision | Chosen | Rejected, and why |
|---|---|---|
| Baseline churn | Each record splits into `structure` and `content`. `--check` diffs `structure` only; `--check --content` diffs both | One flat record set — CloudCannon commits content directly, so a flat baseline fails on commits that never touch a template, and a check that fails routinely stops being read. Two-ref on-demand comparison — no repo weight, but ~2 full sweeps per answer and no way to see what `production` looked like without running it |
| axe-core | **Out of scope entirely.** Accessibility stays with `nr-a11y-audit.mjs` on its own branch; `axe-core ^4.13.0` stays an unused devDependency here | An `--axe` opt-in flag, and axe in the default sweep |
| Console errors | **Not baselined.** Printed as a harness-health number only | Recording a per-page count would duplicate `smoke` and import its known flakiness (the AirNow `(home)` case, CLAUDE.md § *Smoke test*) into a baseline meant to be stable |
| Extraction method | One browser pass, `page.evaluate()` per page | A no-browser static pass over fetched HTML. No HTML parser is installed `[verified 2026-08-23: jsdom, cheerio, linkedom, node-html-parser, parse5, domhandler, htmlparser2 all absent from node_modules]`, and regex counting over source lines is the exact failure CLAUDE.md documents for multi-line `<img>` tags. A browser is needed anyway for data-explorer and nr-output, which render from JS after fetching EHDP-data |
| Page set | Reuse `collectAllPaths()` from `site-urls.mjs`; `--all` default off, mirroring `smoke` | A separate enumeration. `site-urls.mjs` already cross-checks its paginator count against Hugo's build summary |
| When to measure | Wait for DOM quiescence — a MutationObserver count holding still across three 400ms samples, capped at 15s, with the cap reported per page | A fixed sleep. Measured: a 2.5s settle left 8 of 41 sample pages churning between runs. Added in Task 1 |
| Third-party requests | Abort requests to the Google Translate and GTM hosts (`BLOCKED_HOSTS`) | Letting them load. Their injected subtree is the entire remaining churn source and nothing visible depends on it. Datawrapper, AirNow and forecast7 are deliberately **not** blocked — what they render is content this harness is meant to characterize. Added in Task 1 |

## Record shape

One JSON file per page, path-mirrored under the baseline directory.

```json
{
    "path": "data-stories/housing/",
    "status": 200,
    "structure": {
        "lang": "en",
        "assets": ["js/lib-vega-bundle.js", "node_modules/d3/dist/d3.min.js", "scss/theme.css",
                   "translate.google.com", "www.googletagmanager.com"],
        "assetsWithIntegrity": 11,
        "headingLevels": [1, 2, 2, 3, 2],
        "headingJumps": 0,
        "landmarks": { "main": 1, "nav": 2, "header": 1, "footer": 1, "h1": 1 },
        "meta": { "description": true, "canonical": true, "robots": "noindex, nofollow",
                  "ogTitle": true, "ogImage": true, "viewport": true },
        "jsonld": [{ "type": "Dataset", "keys": ["@context", "@type", "name"],
                     "topLevelIsObject": true }],
        "img": { "total": 12, "missingAlt": 0, "emptyAlt": 3, "zeroSize": 0 },
        "links": { "internal": 84, "external": 6, "emptyHref": 0, "noAccessibleText": 0 },
        "controls": { "button": 4, "input": 2, "select": 1, "textarea": 0,
                      "noAccessibleName": 0 },
        "tables": { "total": 1, "withTh": 1, "withCaption": 0 },
        "iframes": [{ "host": "(self)", "zeroSize": true },
                    { "host": "datawrapper.dwcdn.net", "zeroSize": false }],
        "overflowX": false
    },
    "content": {
        "title": "Health, housing, and history – Environment & Health Data Portal",
        "headingText": ["Health, housing, and history", "Why it matters"],
        "internalTargets": ["/", "/about/", "/data-explorer/"],
        "externalHosts": ["datawrapper.dwcdn.net", "www1.nyc.gov"],
        "metaDescription": "..."
    }
}
```

Two field notes that are load-bearing:

- **`jsonld[].topLevelIsObject`** asserts the parsed value's *type*, not that parsing returned.
  `JSON.parse` hands back a string and throws nothing for a document double-encoded as a JSON
  string literal, which is how a whole site's JSON-LD passed a parse check while no consumer could
  read it (CLAUDE.md § *Validating the instrument*).
- **`assets`** treats same-origin and cross-origin differently, and both choices exist to keep the
  baseline stable against something that is not this site changing.
  - *Same-origin* is the baseURL-prefix-stripped path with the fingerprint removed:
    `js/lib-vega-bundle.js`, not `http://localhost:8080/dev-stage/js/lib-vega-bundle.7bffeead9d7ff2c7.js`.
    Hugo's `short-fingerprint.html` inserts `xxhash` as 16 hex characters before the extension, and
    some assets ship unhashed (`conditional-modal.js`) while some base names carry their own dot
    (`accessible-autocomplete.min.js`), so the strip is `/\.[0-9a-f]{16,}(?=\.(js|css)$)/` — the
    lookahead on the extension is what keeps it off `.min`. Task 1 proves the strip fired rather
    than assuming it.
  - *Cross-origin* is the **host alone**. Vendor paths carry vendor build ids —
    `translate.googleapis.com/_/translate_http/_/js/k=translate_http.tr.en_US.<id>/…` — which change
    on the vendor's release schedule, and `googletagmanager`'s `?id=` is the analytics property,
    which differs by environment.

---

## Ledger

**Tasks 1-10 done 2026-08-24. Tasks 11-14 opened the same day**, out of the question the first
red run could not answer: it said three pages differed, and nothing about what to go and look at.
Tasks 1-9 are in `d8c45abebe..3625c7f377`; Task 10 is `90328b504e..d0b3050820`. The check is green
on a GitHub runner — run `32780688054` at `d0b3050820` — and draft PR #1480 into `production` is
open and unmerged. The branch tip has since moved by docs-only commits, so re-read
`git rev-parse HEAD` before citing that green run.
The branch is `feature-site-characterization`; derive everything else from the commands below the
table rather than from this line.

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Probe core + determinism control | `9cbb2d44d0` | **DONE 2026-08-23** | 3 sweeps, 3 separately started servers, all 3 pairs byte-identical over 41 pages `[git diff --no-index --exit-code, exit 0 on a-b, a-c, b-c]`; control perturbing `landmarks.nav`, `lang` and `assets` fired on all 3 |
| 2 | Dead-field sweep over 925 pages | `e6ebe5c2c5` | **DONE 2026-08-23** | 925/925 captured, all quiesced; distinct-value table for all 36 `structure` fields; the 3 zero-constants proved live by `node scripts/site-characterization-probe-control.mjs`, all 4 responded |
| 3 | Baseline / check plumbing | `4c076520d0` | **DONE 2026-08-23** | `--baseline` then `--check` exit 0; perturbed `content.title` → `--check` exit 0 and `--check --content` exit 1 naming the page; baseline corrupted to `controls.button: 999` → exit 1 naming the field, with the sequential re-capture path firing. The `cleared` branch is **not** proven — see findings |
| 4 | Positive controls — prove the net catches things | *no code change* — the evidence is the findings section below | **DONE 2026-08-23** | 11 of 11 injected regressions drove `--check` to exit 1, each naming its own field; tree clean and `--check` passing again after all reverts. Two prescribed injections were wrong about the repo and are corrected in the table |
| 5 | Wire up npm scripts and document | *see the Task 4+5 commit* | **DONE 2026-08-23** | `npm run characterize:site:sample` exits 0 from both Bash and PowerShell; the two `--all` scripts are deferred to Task 6, which is when the baseline they need exists. The `readme-development.md` step was dropped on a false premise — see findings |
| 6 | Commit the baseline | harness fix `6200892d85`; baseline in the commit that follows it | **DONE 2026-08-23** | `npm run characterize:site` exit 0 against the baseline captured at `6200892d85` — 925/925, every page quiesced, zero pages differing, arbitration not needed. Baseline measured at 926 files / 4.74 MiB. The first attempt FAILED and found a dead field — see findings |
| 7 | Cold-fetch experiment | `e960523842` | **DONE 2026-08-24** | Theory retired on its premise — the dev server sends no Cache-Control or ETag and every capture already gets its own browser context. Found instead that the mutation observer never attached: 0 batches counted where a working one counts 2,558. Fixed, guarded, and the guard's positive control fires. Full check exit 0 afterwards, 925/925, zero differing |
| 8 | Multiple environments | `a6d91e78ec` | **DONE 2026-08-24** | Baselines keyed `staging` / `production` / `prod_prod`, key read off the running site. `staging` and `prod_prod` both captured at `e960523842` and both `--check` PASSED with zero differing, no arbitration in either. All 925 shared pages differ between the two baselines, which is the split earning its place. Use `hugo server` in CI — the baselines were captured that way. Two objections to static serving in an earlier draft were wrong and are corrected in the findings. The remaining Pagefind difference was closed by Task 9 |
| 9 | Serve Pagefind, and raise concurrency | concurrency `b5bfb73cc5`; pagefind + baselines `3625c7f377` | **DONE 2026-08-24** | `hugo server` writes and serves `docs/` from disk, so `npx -y pagefind --site docs` in a second process reaches the running site — 404 to 200 on all three assets, surviving a rebuild. Both baselines re-captured with it: 925/925 each, both sweeps agreeing, no arbitration, and the whole diff is `controls.button +1` and `controls.input +1` on all 925 pages with nothing else moving. Concurrency default is now machine-derived; measured 114s vs 198s over 925 pages. The new gate, and both branches of smoke's narrowed allowlist entry, each have a positive control |
| 10 | Run the check in GitHub Actions | version pin `90328b504e`; workflow + provenance `946ca1336c`; run fixes `4f2e669c77`, `156aed9289`; revert `d0b3050820` | **DONE 2026-08-24** — green on a GitHub runner. Open: PR #1480 is a draft and unmerged, so the file is not on `production` and `workflow_dispatch` stays unregistered | Static checks first: YAML parses to the intended 11 steps and 2 inputs; all four action tags resolved to commit SHAs via `gh api` (peaceiris' ref is an annotated tag and needed dereferencing); `npm ci --dry-run` clean; arg-building shell block exercised over all 9 input combinations; `hugo server --environment prod_prod` verified to serve `/IndicatorPublic/`; provenance field verified end to end by a `--baseline` run rooted in a temp cwd. Then four runs, all `pull_request` events from PR #1480: `32771116783` @ `60ea1333ee` GREEN, 8m13s job — 62s to a serving build, 1.2s Pagefind, 370s to sweep 925 pages at concurrency 6 (ubuntu-24.04 reports 4 logical processors); `32777189174` @ `cb334f5b37` RED on three deliberately perturbed baseline records, which is what exercised the `if: failure()` path a green run skips entirely, and exposed the artifact upload dropping both `.sc-check` trees plus an orphaned `hugo`; `32779430909` @ `156aed9289` RED on the same injection with both fixed and the artifact complete; `32780688054` @ `d0b3050820` GREEN after the revert, 8m9s |
| 11 | Skip docs-only PRs | `7bcdec1945` | **DONE 2026-08-24, never exercised** | `paths-ignore` parses to the intended 10 entries and the file still parses to the same 11 steps, 2 inputs and 2 branches `[js-yaml, 2026-08-24]`. **Inert on PR #1480**, and that is not a defect — a `pull_request` path filter reads the whole three-dot diff, and this PR's carries 1856 files under `scripts/` |
| 12 | Say what changed, not just that something did | *not started* | **NOT STARTED** | — |
| 13 | Put the summary on the run page, and name the candidate source files | *not started* | **NOT STARTED** | — |
| 14 | Merge-base control run — my change, or EHDP-data's? | *not started* | **NOT STARTED** | — |

Derive what this table deliberately does not claim:

```bash
git log --oneline d8c45abebe..HEAD                                              # the task commits
git rev-list --left-right --count origin/feature-site-characterization...HEAD   # "0	0" means pushed
gh pr list --head feature-site-characterization                                 # a PR, and its base
```

### Environment state a cold session needs

- Branch `feature-site-characterization`, cut from **local** `production` at `d8c45abebe`.
  `git config --get branch.feature-site-characterization.merge` is empty, which is correct.
- Worktree: `EH-dataportal.worktrees/feature-site-characterization`, moved there 2026-08-24 from
  `merge/production`, which has since been removed. Three other worktrees exist; do not start a
  second Hugo builder in any of them while this one has a server up (CLAUDE.md § *Four ways a local
  check silently lies*). `.claude/settings.local.json` is globally ignored and does not travel with
  a checkout — a new worktree needs it recreated, pointing `autoMemoryDirectory` at the main repo's
  store, or a session there starts on an empty one.
- `scripts/smoke-reports/` is gitignored (`.gitignore:93`), so smoke runs leave the tree clean.
- No server is left running between tasks; `ensureDevServer()` starts and stops its own.

---

## Task 1: Probe core + determinism control

The cheapest experiment that could falsify the whole plan, so it runs first. The premise is *a
whole-site baseline is stable enough to be a regression net*. If fields churn when nothing changed,
the harness is noise and the rest of the plan is wasted.

**Files:**
- `scripts/site-characterization.mjs` — new. At this task it holds only `capturePage(page)` (the
  single `page.evaluate()` returning the record above) and a driver that sweeps a fixed page list
  and writes one JSON per page. No `--baseline` / `--check` yet.
- `scripts/smoke-pages.mjs:35-71` — read only, for the `PAGES` list to reuse as the Task 1 sample.

**Interfaces:**
- Consumes: `ensureDevServer()` from `./dev-server.mjs`; `mapPool()` from `./site-urls.mjs`.
- Produces: `capturePage(page) -> record`, imported unchanged by Tasks 2–4.

**Steps:**

1. Write `capturePage()` returning the record shape above.
   *Expected:* one page captured by hand prints a record with every field populated.
2. Sweep the 33 `PAGES` entries plus four JS-rendered pages not in that list
   (the NR report page is already in it; add
   `data-features/heat-syndrome/`, `data-features/hvi/`,
   `data-features/neighborhood-air-quality/`, `data-features/cooling-info/`, and four Spanish and
   Chinese pages so `lang` can vary). Write to `run-a/`.
   *Expected:* 41 JSON files.
3. **Stop the server. Start a fresh one.** Sweep the same list to `run-b/`.
   *Expected:* 41 JSON files. A fresh server is the point — step 2 alone would only re-test what
   is already known, that repeated fetches from *one* server are byte-identical
   `[verified 2026-08-23: 5 pages, 2 fetches each, 0 diff lines]`. Build-to-build determinism is
   the untested half, and the home page is documented as build-nondeterministic.
4. `git diff --no-index run-a/ run-b/`
   *Expected:* the deliverable of this task is the **list of every field that differed and the page
   it differed on** — not a pass. A zero diff is a fine outcome; a non-zero one is the finding.
5. For each churning field, take one of three actions and record which: normalize it (round, sort,
   bucket to a boolean), drop it from `structure` into `content`, or delete it. A field that
   churns and cannot be normalized is deleted and the deletion recorded in this document.
6. Prove the fingerprint strip: confirm every `assets` entry in `run-a` matches its `run-b`
   counterpart, and separately that at least one page's raw (unstripped) asset list *did* contain a
   16-hex segment — otherwise the strip is untested and passing by construction.

**Proof:** the field-churn list, written into this document under this task, naming every field
that differed and the action taken. Plus the strip's positive control from step 6.

**Gate:** if more than a handful of fields churn irreducibly, stop and report before Task 2 — the
premise is wrong and the signal set needs rethinking, not more code.

### Task 1 findings

> **Superseded in part by Task 3 — read this section with its correction.** Task 1 concluded from
> three agreeing sweeps that the premise held. It did not: Task 3's first `--baseline` followed
> immediately by `--check` found the data-explorer pages churning by hundreds of links and dozens
> of controls. The DOM-quiescence wait described below was necessary and **not sufficient**, and
> the fix is recorded under *Task 3 findings*. Everything else in this section stands.

**Result as recorded at the time: the premise holds.** Three sweeps, each against a separately
started `hugo server`, all three pairs byte-identical across 41 pages
`[verified 2026-08-23: git diff --no-index --exit-code, exit 0 on a-b, a-c and b-c; plus an
independent Node file-by-file comparator, 0 files differing]`. It did not hold on the first attempt
— and, as Task 3 showed, it did not hold on this one either.

**Two runs agreeing is not a determinism test, and this is why the task ran three.** The first pair
of sweeps came back identical and would have closed the task. Two later pairs disagreed — and once
the churn was understood, a run at `a`-vs-`b` was clean in the *same* triple where `a`-vs-`c`
differed by 338 lines. A race that fires on roughly half of runs passes a two-run test half the
time. **Any future re-measurement of determinism here runs at least three sweeps and compares all
pairs.**

**The churn had one cause and eleven symptoms.** With a fixed 2.5s settle, 8 of 41 pages differed,
always in the same eleven fields at once: `assets`, `img.total`, `img.emptyAlt`, `img.zeroSize`,
`links.external`, `controls.button`, `controls.input`, `controls.select`,
`controls.noAccessibleName`, `iframes`, and `content.externalHosts`. Every delta was the Google
Translate widget's injected subtree — its language `<select>`, five hidden inputs, two buttons, two
images, a same-origin banner iframe and two script hosts — landing either side of the settle
depending on Google's network timing. Eleven fields, one fix.

Worth separating out, because it would have been recorded as a finding about this site:
**`controls.noAccessibleName` went 0 → 5 on the home page, and all five were Google's inputs.**

**Two fixes, in order, with what each bought:**

| Fix | Pages still churning |
|---|---|
| Fixed 2.5s settle (starting point) | 8 of 41 |
| DOM-quiescence wait (MutationObserver, 3 stable 400ms samples, 15s cap) | 5 of 41 |
| Blocking the Translate and GTM hosts at the network layer | **0 of 41** |

The quiescence wait alone was not enough because the injection can *begin* after the DOM has
already been quiet for three samples — waiting longer is a race with an unbounded tail, not a fix.
`BLOCKED_HOSTS` in the harness carries the reasoning and what the block costs.

**Four harness defects found by reading the output, not by the diff.** All four would have baked
the local dev server's identity into a baseline meant to describe the site, and all four were
invisible to the run-to-run diff because both runs carried them equally:

1. `assets` recorded `livereload.js` — injected by `hugo server`, present in no built site.
2. `assets` recorded full URLs including `http://localhost:8080/dev-stage/`.
3. `iframes` recorded `localhost:8080` as an embed host.
4. `content.internalTargets` carried the `/dev-stage/` prefix on some links and not others.

That last one exposed a site fact worth a separate look: some internal links are written as
absolute paths *without* the baseURL prefix (`/data-explorer/asthma/`). The harness deliberately
does not normalise those away — under a server mounted at `/IndicatorPublic/` the two shapes
resolve differently, so the distinction is a signal.

**A fifth defect was mine and the diff did catch it:** `assetName()` was written but the call site
still used the old `stripHash()`, so the fix had no effect until the distinct-value sweep showed
raw URLs still in the field.

**`git diff --no-index` prints nothing on a long path while still exiting non-zero.** Against the
session scratchpad (a ~150-character path) it returned exit 1 for a perturbed tree and **zero lines
of output**, alongside `Filename too long` warnings. The same comparison at `C:/temp/sc/` produced
full field-level output. A check that fails without saying what changed reads as a broken harness.
`cp-characterization.mjs` uses the same mechanism, so this applies to it too. **Keep
characterization output at a short path.**

**Strip control:** 468 fingerprinted asset references were seen across the sample, so the
fingerprint-stripping pattern had something to strip. A strip that never matched anything would
have passed by construction.

**Sample gap found and closed:** `lang` was constant at `"en"` across the original 33-page sample,
which in a distinct-value sweep is indistinguishable from a probe reading nothing. Four Spanish and
Chinese pages were added; `lang` now takes `en`, `es`, `zh`.

**Preview of Task 2, on the 41-page sample.** Three fields are constant at zero and are constant
*by construction*, verified against the templates rather than assumed
`[verified 2026-08-23: grep over themes/dohmh/layouts/ and content/]`:

- `landmarks.aside` — zero `<aside>` elements anywhere in the repo.
- `controls.textarea` — the only `<textarea>` string in the repo is inside a vendored minified
  jQuery file, not a page.
- `tables.withCaption` — zero `<caption>` elements anywhere in the repo. **That is a real, if
  small, accessibility finding in its own right: no table on the site has a caption.**

All three are kept as change detectors, and each now has its justification recorded rather than
being a count-of-1 nobody looked at.

---

## Task 2: Dead-field sweep over 925 pages

Task 1 catches fields that vary when they shouldn't. This catches the mirror failure: a field that
*never* varies, which is either constant by construction or reading a node that does not exist.
Both look identical in a passing baseline (CLAUDE.md § *A fixture field identical across every case
it covers is dead, not passing*).

**Files:**
- `scripts/site-characterization.mjs` — add `--all` to sweep `collectAllPaths()`.

**Interfaces:**
- Consumes: `capturePage()` from Task 1; `collectAllPaths()` from `./site-urls.mjs`.
- Produces: a full 925-page capture that Task 3 turns into the committed baseline.

**Steps:**

1. Sweep all 925 pages at concurrency 6.
   *Expected:* 925 JSON files. Enumeration prints `830 sitemap + 94 paginator + 1 extra`; if that
   breakdown differs, the page set changed and that is a finding before anything else.
2. For every leaf field in `structure`, count distinct values across all 925 records.
3. Write the table into this document: field, distinct-value count, and for every field whose count
   is **1**, a one-line justification for why constant is correct.
   *Expected:* `lang` will be near-constant and legitimately so (three languages, seven translated
   pages). `meta.viewport` is emitted unconditionally by `head.html` and should be `true` on all
   925 — that one is constant by construction. A field constant at `0` or `false` everywhere is
   the suspicious shape and each needs its justification checked, not assumed.
4. Delete or fix any field whose constancy cannot be justified.

**Proof:** the distinct-value table in this document, with every count-of-1 field justified.

### Task 2 findings

**925/925 pages captured, every one reaching DOM quiescence before the cap**, and the enumeration
printed the expected `830 sitemap + 94 paginator + 1 extra`. Zero records came back with a null
`structure`. Strip control: 9,909 fingerprinted asset references seen.

Wall time for the capture phase was **about 5m24s** at concurrency 6 — first record written
14:30:27, log closed 14:35:51, by file mtime — with server start and enumeration on top of that.

**Distinct values per `structure` field across all 925 records**, ordered by how little each varies:

| Field | Distinct | Field | Distinct |
|---|---|---|---|
| `landmarks.main` | 1 | `img.missingAlt` | 5 |
| `landmarks.header` | 1 | `tables.total` | 6 |
| `landmarks.aside` | 1 | `tables.withTh` | 6 |
| `meta.description` | 1 | `img.zeroSize` | 9 |
| `meta.canonical` | 1 | `assetsWithIntegrity` | 10 |
| `meta.robots` | 1 | `links.noAccessibleText` | 14 |
| `meta.ogTitle` | 1 | `links.emptyHref` | 15 |
| `meta.ogImage` | 1 | `img.emptyAlt` | 18 |
| `meta.viewport` | 1 | `landmarks.h1` | 20 |
| `controls.textarea` | 1 | `img.total` | 21 |
| `tables.withCaption` | 1 | `links.external` | 22 |
| `landmarks.footer` | 2 | `controls.input` | 27 |
| `jsonld` | 2 | `iframes` | 29 |
| `controls.select` | 2 | `assets` | 33 |
| `overflowX` | 2 | `controls.button` | 47 |
| `lang` | 3 | `links.internal` | 77 |
| `landmarks.nav` | 3 | `headingLevels` | 115 |
| `controls.noAccessibleName` | 3 | | |
| `headingJumps` | 5 | | |

**Eleven fields are constant. They split into two kinds, and only one kind is suspicious.**

*Positive constants — cannot be dead probes.* `meta.description`, `meta.canonical`, `meta.ogTitle`,
`meta.ogImage`, `meta.viewport` all read `true`; `landmarks.main` and `landmarks.header` read 1;
`meta.robots` reads a non-empty string. A probe that found nothing would return `false`, `0` or
`null` here, so a positive value on all 925 pages is itself the evidence that the probe fires.

- The five `meta.*` tags are emitted **unconditionally** — verified in
  [`partials/seo.html`](../themes/dohmh/layouts/partials/seo.html) lines 2, 3, 10 and 13 and
  [`partials/head.html:66`](../themes/dohmh/layouts/partials/head.html). The `{{ if }}` blocks
  around them choose the tag's *content*, and every branch falls back to
  `.Site.Data.globals.seo_defaults`, so the tag itself is always present. **`meta.description` is
  therefore a presence-only probe:** it detects the tag being removed and nothing else. The
  description's actual text is in `content.metaDescription`, ungated.
  These four are not in `head.html` at all — it reaches them via `{{ partial "seo" . }}` at line 104.
- `landmarks.main` — one unconditional `<main>` in
  [`_default/baseof.html:24`](../themes/dohmh/layouts/_default/baseof.html).
- `landmarks.header` — one unconditional `<header>` in
  [`partials/header.html:4`](../themes/dohmh/layouts/partials/header.html).
- **`meta.robots` reading `"noindex, nofollow"` on all 925 pages is the environment, not the site.**
  The tag is always emitted; only its value branches
  ([`head.html:46-53`](../themes/dohmh/layouts/partials/head.html)): `$robots` starts at `"all"`,
  becomes `"noindex, nofollow"` when the environment is not `prod_prod`, and becomes `"noindex"`
  for the `resources` section under `prod_prod`. So this sweep, run against `dev_stage`, sees one
  value — while a `prod_prod` baseline would see **two**, and the field would then be a live check
  on the resources-section noindex rule decided 2026-08-21. **The baseline is environment-specific
  and the environment it was taken under has to be recorded with it.**

*Negative constants — the suspicious shape, and the reason `site-characterization-probe-control.mjs`
exists.* `landmarks.aside`, `controls.textarea` and `tables.withCaption` all read 0 everywhere. A
grep says the elements exist nowhere in the repo, but a grep cannot tell a correct selector on an
absent element from a wrong selector. The control injects an `<aside>`, a `<textarea>` and a
`<table><caption>` into a real page and re-runs the capture
`[verified 2026-08-23: landmarks.aside 0 -> 1, controls.textarea 0 -> 1, tables.withCaption 0 -> 1,
tables.total 0 -> 1; all four responded]`. The zeros are real.

`tables.withCaption` being genuinely zero site-wide is a small accessibility finding in its own
right, separate from this harness: **no table on the site carries a `<caption>`.**

**No field was deleted.** All eleven constants are justified, and each is a live detector for the
change that would break it.

---

## Task 3: Baseline / check plumbing

**Files:**
- `scripts/site-characterization.mjs` — add `--baseline`, `--check`, `--content`.
- `scripts/site-characterization-baseline/` — new directory, path-mirrored records.

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: `--check` semantics relied on by Task 4.

**Steps:**

1. `--baseline` writes `structure` and `content` into each record; `--check` writes to a
   `-current/` directory and diffs. Default diff scope is `structure`; `--content` widens it. Match
   `cp-characterization.mjs`'s use of `git diff --no-index --exit-code`.
2. Run `--baseline`, then immediately `--check`.
   *Expected:* exit 0, zero diffs. This is a necessary condition and proves nothing on its own —
   a probe that reads nothing also passes it. Task 4 is what makes it mean something.
3. Confirm `--content` actually widens the diff: hand-edit one `content.title` in the baseline and
   re-run.
   *Expected:* `--check` exits 0 (structure untouched); `--check --content` exits 1 and names that
   one page. Revert the hand-edit.

**Proof:** step 3's two exit codes, which discriminate. Step 2 alone does not.

### Task 3 findings

**Step 2 failed, and that is the whole value of this task.** `--baseline` followed immediately by
`--check`, same commit, same tree, reported structure differences on three data-explorer pages:
`controls.button 25 -> 96`, `links.internal 70 -> 638`, `tables.total 0 -> 2`. Task 1 had declared
the harness deterministic on the strength of three agreeing sweeps. It was not.

**The cause is NOT established.** Three explanations were proposed; two are ruled out and the third
turned out not to be supported either. The failure has not been reproduced since. This is written
out in full because a plan that names a confident wrong cause is what the next person refactors
against.

*Explanation 1: the runtime fetch leaves a quiet DOM.* The data explorer fetches EHDP-data from raw
GitHub URLs, so the theory was that between initial render and fetch resolution the DOM is
genuinely still and the quiescence wait accepts that gap. A zero-in-flight condition was added, then
measured as never binding: "DOM quiet" and "DOM quiet and nothing in flight" arrive at the same
millisecond on every page sampled `[2026-08-23: extra = 0ms on about/, key-topics/airquality/,
data-explorer/asthma/, data-explorer/data-index/]`. **That disproof is invalid.** It ran against a
warm HTTP cache, where the fetch resolves instantly and the condition has no window in which to
bind — it shows the condition is inert when the data is cached and says nothing about a cold fetch,
which is the case the theory is about. **Status: open.** Three `--check` runs passed after that
change and none of them is evidence either way.

*Explanation 2: the pages are slow.* **Ruled out.** Hit sequentially, `data-explorer/asthma/`
reaches its final state at **260ms**, `?id=2380` at **269ms**, the NR report page at **1050ms**,
static pages at **~4ms** `[2026-08-23: 250ms sampling of button, link, table and image counts for
25s per page]`. No wait would have fixed this, because nothing is slow.

*Explanation 3: six pages starve one `hugo server`'s on-demand render.* This is
[`smoke-pages.mjs:246`](../scripts/smoke-pages.mjs)'s explanation, which this repo's `CLAUDE.md`
repeated — a code comment, not a measurement. Both were corrected on 2026-08-23 off the back of this
task, so neither now states it. **Not supported.** Measured over 12 pages at
concurrency 6 against concurrency 1, navigation (`goto` → `load`) slowed **1.34x** (8052ms → 10823ms)
while JS settle time was **1.00x** (2564ms → 2552ms), and all 12 pages reached **identical** final
DOM states `[2026-08-23]`. A 1.34x slower navigation cannot produce a capture taken before a page's
first render state.

*What is not in doubt.* The failing capture read `controls.button` **25**, and that page's *first*
sampled state is already **63**. It was not caught between two states — it was caught before its
first. Something can produce that; nothing measured so far does.

**The fix is a guard, not a cure, and is justified by the observed failure rather than by a known
mechanism.** `--check` re-captures any page differing from the baseline one at a time and reports
separately those that then agree; `--baseline` runs two concurrent sweeps and sequentially
re-captures anything they disagree on, so no baseline entry can come from a single anomalous
capture. Worth the roughly doubled `--baseline` cost on an operation run this rarely, and it is the
same answer `smoke-pages.mjs` reaches for — whose *response* is sound whether or not its stated
cause is.

**Open, for whoever picks this up:** reproduce the failure on demand. The one lead not yet tested is
Explanation 1 against a genuinely cold fetch, since every measurement so far has run warm.

**The one general lesson worth carrying out of this file:** waiting for the DOM to stop changing
cannot distinguish a page that has **finished** rendering from one that has **not started**. Both
are quiet. Any readiness check built on quiescence alone inherits that blindness — which is why the
answer here is arbitration rather than a longer wait.

**The second lesson is about the diagnosis, not the bug.** Two of the three explanations above were
retired on measurements that felt conclusive and were not: one "disproof" ran against a warm cache
and so could not have observed the thing it declared absent, and the other inherited its mechanism
from a code comment nobody had tested. Both were written into the harness and this document as
established before being checked.

**What is proven, and what is not.** Stated separately because the gap matters:

| Claim | Status |
|---|---|
| `--baseline` then `--check` passes on an unchanged tree | Proven — and it is a necessary condition only, which is why the rest of this table exists |
| `--content` widens the gate | Proven. A perturbed `content.title` leaves `--check` at exit 0 and drives `--check --content` to exit 1 naming that page |
| `--check` detects a real difference and names the field | Proven. A baseline corrupted to `controls.button: 999` produced exit 1 and the exact field |
| The sequential re-capture path executes | Proven. The corrupted-baseline run printed `1 page(s) differ from the baseline — re-capturing sequentially` |
| The **`cleared` branch** — a page differing under concurrency that agrees sequentially | **NOT proven.** The contention is intermittent and `--check --concurrency 24` over 41 pages did not reproduce it, so that branch has never executed. It is written from the failure that was observed, not from one that was reproduced on demand |
| Determinism generally | Held on every run since arbitration landed, but this harness has now produced three separate false "N runs agreed" results. Treat agreement as weak evidence and the mechanism as the argument |

**Environment guard added**, forced by Task 2's `meta.robots` finding: the baseline records the
server's path prefix in `_meta.json`, and `--check` aborts before sweeping if the running server's
prefix differs. Comparing a `dev_stage` baseline against a `prod_prod` run would otherwise report a
robots change on every one of 925 pages and bury any real regression in it.

**`--check` working directories** (`scripts/site-characterization-current/`, `scripts/.sc-check/`)
are gitignored and deliberately kept at a short in-repo path, per Task 1's finding that
`git diff --no-index` prints nothing on a long one.

---

## Task 4: Positive controls — prove the net catches things

A characterization harness that has never failed is indistinguishable from one that reads nothing.
Every probe gets one injected regression proving it can fire.

**Files:**
- Temporary edits, each reverted immediately after its check runs. Nothing here commits.

**Interfaces:**
- Consumes: `--check` from Task 3.
- Produces: the control table below, which is the harness's own evidence that it works.

**Steps:** for each row, make the edit, run `--check`, record whether it failed and which pages it
named, then `git checkout --` the file and confirm `--check` is clean again.

| # | Probe | Injected regression | Must fire on |
|---|---|---|---|
| 1 | `assets` | Comment out one `<script>` block in `themes/dohmh/layouts/partials/head.html` | every page that gated it in |
| 2 | `headingLevels` / `headingJumps` | Change one `<h2>` to `<h4>` in a shared partial | every page rendering that partial |
| 3 | `img.missingAlt` | Delete one `alt` attribute in a shared partial — **and mark the edit with an added attribute**, see findings | every page rendering it |
| 4 | `landmarks` | Delete the `<nav>` wrapper in `partials/header.html` | every page |
| 5 | `controls.noAccessibleName` | Remove **every** name source from a header button — `aria-label`, `sr-only` text and `title`, see findings | every page |
| 6 | `meta` | Remove `<meta name="description">` from `head.html` | every page |
| 7 | `jsonld.topLevelIsObject` | Wrap one JSON-LD block's output in an extra `jsonify` | that page kind |
| 8 | `tables.withTh` | Change one `<th>` to `<td>` in a table-bearing template | that page kind |
| 9 | `overflowX` | Add `width: 200vw` to one block in a shared SCSS partial | every page |
| 10 | `iframes[].zeroSize` | Force `height: 0` on one embed | that page kind |
| 11 | `links.internal` | Delete one footer link | every page |

**Proof:** the completed table written into this document — regression injected, probe that fired,
page count it named, and confirmation `--check` was clean again after revert. **A row where the
probe did not fire is a broken probe, not a skipped control**, and it gets fixed or its field gets
deleted before Task 6.

**Gate:** Task 6 does not run until every row in this table has fired.

### Task 4 findings

**All eleven probes fired.** Every row drove `--check` to exit 1 and named its own field.

Run against the 41-page sample baseline captured at `5e3391846b`, on one `hugo server
--environment dev_stage --disableFastRender` that stayed up for the whole task (PID owning :8080
confirmed once, per the two-builders rule). Driver:
`scratchpad/task4-controls.py`, disposable — it makes the edit, waits for the change to appear in
the **served** page, runs `--check`, then reverts with `git checkout --`.

| # | Probe | Injection | Exit | Pages named | Field in the diff |
|---|---|---|---|---|---|
| 1 | `assets` | dompurify `<script>` removed from `partials/head.html` | 1 | 41 | `assets`, `assetsWithIntegrity` |
| 2 | `headingLevels` / `headingJumps` | `partials/footer.html` `<h2 class="sr-only">` → `<h4>` | 1 | 41 | `headingLevels` (`2`→`4`), `headingJumps` |
| 3 | `img.missingAlt` | logo `alt` removed in `partials/header.html` | 1 | 41 | `missingAlt` |
| 4 | `landmarks.nav` | both `<nav class="nav">` → `<div>`, closing tags too | 1 | 41 | `nav` |
| 5 | `controls.noAccessibleName` | menu toggle's `aria-label`, `sr-only` text **and** `title` removed | 1 | 41 | `noAccessibleName` |
| 6 | `meta.description` | `partials/seo.html` meta renamed | 1 | 41 | `description` |
| 7 | `jsonld.topLevelIsObject` | second `jsonify` on the breadcrumb graph | 1 | 38 | `topLevelIsObject`, `type`, `keys` |
| 8 | `tables.withTh` | `data-explorer/data-index.html` `<th>` → `<td>` (6) | 1 | 1 | `withTh` |
| 9 | `overflowX` | `body { min-width: 200vw }` in `assets/scss/theme.scss` | 1 | 40 | `overflowX` |
| 10 | `iframes[].zeroSize` | `data-stories/cold.html` iframe `height: 750px` → `0px` | 1 | 1 | `zeroSize` |
| 11 | `links.internal` | one footer language link deleted (both copies) | 1 | 41 | `internal`, `emptyHref` |

**Clean again after revert:** `git status --porcelain` shows no template or SCSS file modified, and
a final `--check` against the same baseline passed. That single end-state check is what proves every
one of the eleven reverts was complete — a residue from any earlier row would still have been
present at the end.

**Row 5 needed three edits, not one.** The plan's "remove one `aria-label`" would not have fired:
`accessibleName()` falls back through `aria-labelledby` → `aria-label` → `el.labels` → own text →
`img[alt]` → `title`, and that button carries an `aria-label`, an `sr-only` span reading "Main Menu",
and `title="Main Menu"`. Removing one of three leaves the control named and the probe correctly
silent. The written control was wrong about the repo, not about the probe.

**Row 3 first came back INCONCLUSIVE, and that is the served-page gate working.** The driver waited
for `alt="NYC Logo"` to disappear from the served page; it never can, because that string is in
three partials and `partials/footer.html`'s copy renders on every page. Without that gate the run
would have recorded a dead `img.missingAlt` probe. Re-run against an injected `data-sc-control`
attribute instead of a removed one, the row fired on all 41 pages. **State an injection's marker as
something the edit *adds*, never as something it removes.**

**Three rows produced diffs wider than their target field**, which is worth knowing before reading a
real failure:

- **Row 9** additionally changed `img.total` and `img.emptyAlt` on exactly 10 pages, all of them
  map-bearing (`data-features/*` with Leaflet, and neighborhood reports). Leaflet tiles are `<img>`
  with empty alt, so a body forced to `200vw` plausibly loads a different tile count. Not verified
  beyond the page list — the row's purpose was met.
- **Row 1** additionally changed `controls.button`, `controls.input`, `links.external`, `img.total`
  and `tables.withTh` on exactly 2 pages: `data-explorer/asthma/` and `data-explorer/asthma/?id=2380`.
  Console errors were flat across the run (373, against 374 on the clean check either side), so a
  "page JS throws without DOMPurify" explanation is **not** supported by that signal. Those two pages
  are also two of the three that needed sequential arbitration when this baseline was captured, so
  this is the open instability and the injection landing on the same page kind, and this run cannot
  separate them.
- **Row 2** changed nothing outside `headingLevels` and `headingJumps`.

**A fourth observation of the data-explorer instability.** Capturing the baseline for this task —
`--baseline` on a freshly started server, so a cold Hugo render and a cold browser cache — put
`data-explorer/asthma/`, `data-explorer/asthma/?id=2380` and `data-explorer/data-index/` through
sequential arbitration, i.e. the two sweeps disagreed on exactly those three pages. Every `--check`
afterwards, against the warm server, was clean. That is consistent with the untested cold-fetch
theory in Task 3's findings and is not a test of it: nothing here varied the cache deliberately.
What would settle it: capture twice against a server started fresh each time, with the browser cache
disabled, and see whether the same three pages disagree.

---

## Task 5: Wire up npm scripts and document

**Files:**
- `package.json` — `characterize:site`, `characterize:site:baseline`, `characterize:site:check`.
- `CLAUDE.md` — a short subsection under `## Commands`, beside the existing `### Smoke test`.
- `readme-development.md` — one pointer, matching how `smoke` is referenced there.

**Interfaces:** consumes Task 4's control table for the "what this actually catches" wording.

**Steps:**

1. Add the npm scripts. `npm run characterize:site -- --check` will **not** work under PowerShell,
   which eats the `--` — the same trap `smoke:all` has its own npm script to avoid. So each mode
   gets its own script rather than a forwarded flag, and the file header says why.
2. Write the CLAUDE.md subsection: what it records, what `structure` vs `content` means, that
   console errors are smoke's job and not baselined, and that the control table in this plan is
   what establishes the probes fire.
   *Expected:* the subsection states which signals are covered and does not claim coverage of any
   probe whose Task 4 row did not fire.

**Proof:** each npm script runs clean from both PowerShell and Bash.

### Task 5 findings

**Scripts added** to `package.json`:

| Script | Runs |
|---|---|
| `characterize:site` | `--check --all` — the full sweep against the committed baseline |
| `characterize:site:sample` | `--check` — the same check over the 41-page sample |
| `characterize:site:baseline` | `--baseline --all` — re-capture what gets committed |

`--content` has no script. It is the rarer mode and it takes a flag on the direct `node` call,
which is what the file header documents.

**Verified:** `npm run characterize:site:sample` exits 0 with `Characterization check PASSED` from
**both** Bash and PowerShell `[2026-08-23, against the 41-page baseline at 5e3391846b]`. The two
`--all` scripts are **not** yet verified — they need the 925-page baseline that Task 6 captures, and
running them before it exists would prove nothing. Task 6 verifies them.

**The `readme-development.md` pointer was dropped, and the plan's premise for it was false.**
That step said to add one "matching how `smoke` is referenced there". `smoke` is referenced nowhere
in it — `grep -rn "smoke\|npm run" readme-development.md README.md readme-content.md` returns zero
hits across all three human-facing docs `[2026-08-23]`. None of them documents any harness, so there
was no form to match, and adding characterization alone would have made it the one harness in a file
that documents none. If the team wants the harnesses in `readme-development.md`, `smoke` goes in the
same pass — that is a separate piece of work.

**Section size, for the always-loaded file:** the new `### Site characterization` subsection is 380
words, added to a `CLAUDE.md` that was 3,658 — a 10.4% growth, to 4,038 `[measured 2026-08-23, not
estimated]`. It sits beside `### Smoke test`, which is 804 words, and is less than half its length.

---

## Task 6: Commit the baseline

**Files:** `scripts/site-characterization-baseline/` — 925 records.

**Steps:**

1. Re-run `--baseline` on a clean tree at a known commit, so the baseline is a fact about that
   commit and not about a tree with Task 4's edits half-reverted.
   *Expected:* `git status --porcelain` shows only the baseline directory.
2. Record the directory's file count and on-disk size in this document before committing — a
   number measured, not estimated.
3. Commit the harness and the baseline separately: the harness is reviewable, the baseline is 925
   generated files and is not.

**Proof:** `git rev-parse HEAD` recorded beside the baseline, and `--check` passing against that
exact commit.

### Task 6 findings

**The first full-site `--check` failed, and it found a real defect in the harness.** All nine
remaining differences were `img.total` and `img.emptyAlt` on neighborhood-report pages, deltas of
3 and 4 in both directions.

**Cause, measured in a browser, not reasoned from the source:** four loads of
`neighborhood-reports/flushing_clearview/asthma_and_the_environment/` gave `img.total` 17, 17, 20, 20
and `img.leaflet-tile` 9, 9, 12, 12 — while images *outside* the map container were 8 on all four
`[verified 2026-08-23]`. How many tiles a Leaflet map has fetched is a fact about network timing,
not about page structure, so the field was reading noise on every map-bearing page.

**Fix:** `img` now excludes `.leaflet-tile` only. Marker icons and anything else inside the map
container are still counted, because those *are* structure. This is the same signature as Task 4's
row 9, where a `200vw` body changed `img.total`/`img.emptyAlt` on exactly 10 map-bearing pages —
that was the same defect showing up as collateral in a control, and it was not recognised at the time.

**The `cleared` branch executed, closing Task 3's one NOT-proven row.** Of 12 pages differing under
concurrency, 3 matched on a sequential re-capture and were reported rather than failed
(`greenwich_village_soho/climate_and_health/`, `greenwich_village_soho/`, `upper_east_side/`). The
path is no longer written-but-never-run.

**18 of 925 pages needed arbitration when the baseline was captured, and all 18 are runtime-fetching
page kinds** — 17 neighborhood reports and `data-explorer/climate/`. No page kind that renders
entirely at build time disagreed. That is the first evidence that narrows the open instability to a
class rather than to three URLs, and it is consistent with the cold-fetch theory without testing it.

**`zh/` was the one page that never reached DOM quiescence** in the pre-fix capture and was taken at
the 30s cap. After the fix every one of the 925 pages quiesced, on both the capture and the check.

**The committed baseline.** Captured at `6200892d85` against `/dev-stage/`, mode `all`:
**926 files, 4,974,574 bytes (4.74 MiB)** `[measured 2026-08-23 by a directory walk, not estimated]`
— 925 page records plus `_meta.json`.

**The check that proves it:** `npm run characterize:site` against that exact baseline, at that exact
commit, **exit 0 — 925/925 captured, every page quiesced, zero pages differing.** The sequential
arbitration path was not needed at all, where the pre-fix run had put 12 pages through it.

**The tile fix is what moved those numbers**, and the effect is large enough to state plainly:

| | pre-fix (`7ba7957fe0`) | post-fix (`6200892d85`) |
|---|---|---|
| Pages arbitrated during `--baseline` | 18 | 2 |
| Pages differing at `--check` | 12 (3 cleared, 9 failed) | 0 |
| Pages hitting the quiescence cap | 1 (`zh/`) | 0 |
| `--check` verdict | FAILED | PASSED |

The 2 pages still arbitrated at capture were `data-explorer/climate/` and `data-explorer/waterways/`
— both runtime-fetching, consistent with the class narrowing above. **The open instability is
therefore smaller than it looked and is not closed:** most of what Task 3 and Task 4 were watching
was this one dead field, but two data-explorer pages still disagreed between sweeps on a single
capture, and the cold-fetch theory is still untested.

**Both `--all` npm scripts are now verified**, which is what Task 5 deferred to here:
`characterize:site:baseline` and `characterize:site` each exit as documented against the full site.

---

## Task 7: the cold-fetch experiment, and what it actually found

Run to settle the open instability. **The theory was dead on its premise, and testing it found a
harness defect that had been invisible since Task 1.**

### The premise was wrong

There is no warm cache to be cold against.

- `hugo server` sends **no `Cache-Control` and no `ETag`** — only `Last-Modified`, stamped at server
  start `[verified 2026-08-24: curl -I on both the HTML and a fingerprinted JS asset]`.
- `browser.newPage()` creates a **new browser context** per page, so every capture is already
  isolated.

Every capture this harness has ever taken was a cold fetch. The warm/cold framing — including the
measurement in Task 3's findings that "ran warm-cached and therefore does not settle it" — was about
a distinction that does not exist here.

### The mutation observer never attached

`page.addInitScript` runs while `document.readyState` is `"loading"` and `document.documentElement`
is `null`, so `.observe(document.documentElement, …)` threw
`TypeError: parameter 1 is not of type 'Node'` on every page. The `window.__scMutations = 0`
assignment on the preceding line survives, so the counter read a constant **0** for the life of every
page, and `waitForQuiescence` compared 0 to 0 on every sample and returned after three of them.

`[verified 2026-08-24 on data-explorer/climate/: the harness's construction read 0 mutation batches
after 8s; a deferred attach on the same page counted 2,558. The failing construction reported
docElAtInit false, readyState "loading", and the TypeError above.]`

**The tell was in the output from the beginning.** "Every page reached DOM quiescence before the cap"
on 925 of 925 is a constant-true field — the same dead-field signature Task 2 was built to catch, in
the harness's own summary line rather than in a record.

**What actually did the waiting** was the in-flight main-frame request check beside it, plus
`waitUntil: "load"`. Not the mutation count.

### Fix

Attach when `documentElement` exists, retrying on `readystatechange`. And **`waitForQuiescence` now
throws if the observer did not attach**, because a dead counter and a quiet page are otherwise
indistinguishable, which is precisely how this survived three tasks and two "determinism" results.

**Positive control on the guard:** with the retry deliberately removed, all 41 sample pages raised
`the mutation observer never attached` and the run exited 1 `[2026-08-24]`.

### What the fix changes: nothing measurable

| Check | Result |
|---|---|
| 41-page sample, fixed observer vs committed baseline | 39 of 39 overlapping records **identical**, 0 changed |
| `npm run characterize:site`, fixed observer, 925 pages | **exit 0** — 925/925, zero pages differing, no page hit the cap, 383s |

So the committed baseline stays valid and needs no re-capture. The fix is worth having anyway: the
instrument was dead, and the next page that genuinely needs more than a load event plus request-idle
would have been captured half-built with the harness reporting it settled.

### Still open

The two `data-explorer` pages that disagreed between `--baseline`'s two sweeps were not re-tested by
this run — `--check` is a single sweep. Whether a working observer closes that is unmeasured. Do not
record it as fixed.

---

## Task 8: multiple environments

**Why:** one intended use is a GitHub Action on a PR closing into `production`, which builds under
`prod_prod`. A harness that can only check the environment it was baselined against cannot do that.

**Precedent followed:** `scripts/nr-characterization-baseline/{production,staging}/` on
`feature-MOD-Lab-NR-recode-refactor`, which files baselines by **EHDP-data branch** rather than by
Hugo environment, and reads `data_branch` off the running page.

### Three keys, not two

This harness needs one axis the NR one does not. `head.html:46-53` branches on the environment
*name*, so `prod_prod` alone emits `robots` as `"all"` — `"noindex"` for the `resources` section —
where every other environment emits `"noindex, nofollow"` on every page. `prod_prod` carries
production data, so it would otherwise share a directory with `dev_prod` and differ from it on all
925 pages.

| Key | Environments |
|---|---|
| `staging` | dev_stage, local_stage, prod_stage |
| `production` | dev_prod, development, local_prod, production |
| `prod_prod` | prod_prod |

The key is read off the running site — `data_branch` and `hugoEnv` are top-level `let`s in
`head.html`'s inline script, so `page.evaluate(() => data_branch)` reaches them and
`window.data_branch` does not. `--check` selects its own baseline and names it before sweeping.

**The prefix abort is gone.** Records are prefix-relative, so a `prod_stage` server on
`/IndicatorPublic/` checks against a `dev_stage`-captured `staging` baseline. What replaces it is a
missing-baseline error naming the environment, the data branch, and the keys that do exist.

### Evidence that the split was necessary

**All 925 shared pages differ between the `staging` and `prod_prod` baselines** `[2026-08-24,
whole-record comparison]` — `meta` on all 925, and from the data branch, `controls` on 95,
`headingLevels` on 86, `links` on 84, `landmarks` on 2. Without the split a `prod_prod` run against
a `staging` baseline reports 925 regressions and buries anything real.

### Results

| | `staging` | `prod_prod` |
|---|---|---|
| Captured | 925/925 | 925/925 |
| Arbitration at `--baseline` | **none** — both sweeps agreed | **none** — both sweeps agreed |
| Pages at the quiescence cap | 0 | 0 |
| `--check` | PASSED, zero differing | PASSED, zero differing |
| Committed size | 926 files, 4.74 MiB | 926 files, 4.72 MiB |

Both captured at `e960523842`. **Arbitration has now gone 18 → 2 → 0** across the tile fix and the
observer fix — but that is one capture per environment, and this harness has produced false
"N runs agreed" results before. Read it as consistent with both fixes, not as proof.

### Two bugs found on the way

**`characterize:site:sample` was broken by the move.** A 41-page capture against a 925-page baseline
diffed the other 884 as deletions. Both sides are now projected through the **intersection**, and
pages that cannot be compared are named rather than dropped — a check that silently ignores what it
cannot compare is this harness's own failure mode. One page qualifies: `data-explorer/asthma/?id=2380`,
because `--all` enumerates from `sitemap.xml`, which lists no query strings.

**`zh/data-stories/geographies/` had been a 404 since Task 1.** It is in `SAMPLE_EXTRA` specifically
so `lang` does not read constant — and the 404 page renders `lang="en"`, so it supplied no Simplified
Chinese coverage at all while looking like it did. One of the 41 pages Task 4's controls ran against
was an error page. Repointed to `zh/data-stories/redlining/` (200). **The run summary now reports any
non-200**, which is what would have caught it on day one; positive control: an injected bogus path
printed `404  this-page-does-not-exist-sc-control/` `[2026-08-24]`.

### Running this in CI

**Use `hugo server --environment prod_prod` in the Action.** An earlier draft of this section
assumed a CI job must build and serve statically, and raised two objections to that. Both were
wrong and are recorded here because the wrong version was written down as a finding:

- *"Links in a static build would carry the production origin, so `links.internal` would count them
  all as external."* **Unfounded.** Exactly one `.Permalink` appears in an `href` anywhere in
  `themes/dohmh/layouts/` — the canonical `<link>` in `seo.html:3`, which is not an `<a>` and does
  not feed `links`. The other 507 URL emissions are `relURL` / `RelPermalink`, i.e. root-relative
  paths that are same-origin under any host `[2026-08-24]`.
- *"`collectAllPaths()` may not enumerate from a statically served `sitemap.xml`."* Non-issue.
  `hugo server` already serves that sitemap; it is where the 925 came from.

There was never a reason `hugo server` could not run on Actions. **The actual constraint is that a
baseline is only comparable to a run served the same way**, and both committed baselines were
captured under `hugo server` — which is also what rewrites `baseURL` to localhost and is why
`prod_prod` recorded `internal=89 / external=24` on `about/`, with `a816-dohbesp.nyc.gov` absent
from `externalHosts`, identical to `staging` `[2026-08-24]`.

**The one genuine difference between the two serving modes is Pagefind.** `hugo serve` never builds
it, so `pagefind/pagefind.js` and `pagefind-ui.js` both answer **404** under the dev server
`[verified 2026-08-24]`. The baseline still lists `pagefind/pagefind-ui.js` and
`pagefind/pagefind-ui.css` in `assets`, because the request is recorded whatever its status — so the
asset list is unaffected.

**Superseded by Task 9.** The paragraph that stood here said the rest was untested and treated
"serve with `hugo server`" and "check what actually ships" as a fork. It is neither untested nor a
fork: `hugo server` renders to disk, so Pagefind can be built into the site the dev server is
already serving. The guess that the search UI would land in `controls`, `landmarks` and `img` was
one third right. Read Task 9 instead.

---

## Task 9: serve Pagefind, and set concurrency from the machine

**Why:** two separate gaps, both found by questioning a premise Task 8 had written down as settled.

### `hugo server` renders to disk, so Pagefind needs no static build

Task 8 recorded Pagefind as the one difference between serving modes and left it there. The premise
behind that — that testing Pagefind means building and serving statically — is false for this Hugo.

`hugo server` has written and served `publishDir` from disk by default since v0.123; the installed
binary's own help says so, and the running server prints `Serving pages from disk`
`[verified 2026-08-24 on hugo v0.147.9-extended]`. So a second process can write into `docs/` and
the running server serves what it finds. That is exactly what the deploy workflow already does —
`npx -y pagefind --site docs`, `.github/workflows/hugo-build-to-prod-prod.yml:122`.

Measured, in order:

| Step | Result |
|---|---|
| `pagefind.js` / `pagefind-ui.js` / `pagefind-ui.css` before | 404 / 404 / 404 |
| `npx -y pagefind --site docs` | 201 pages, 8221 words, 0.502s |
| The same three after | 200 / 200 / 200 — 45,555 + 119,987 + 14,482 bytes |
| Rebuild survival | touched `content/_index.md`; server rebuilt in 1164ms; both assets still 200 — despite `--cleanDestinationDir` in the server's own args |

`docs` is gitignored (`.gitignore:19`) and holds no tracked files, so serving from disk leaves the
tree clean.

**`dev-server.mjs` now owns this.** It builds the index for any server it starts — never for one it
reuses or is pointed at, because it does not own that server's `publishDir` — and reports
`pagefind: true | false` on every path, including those. Reporting it on paths it cannot fix is the
point: a reused server started with `--cleanDestinationDir` has no index, and that is a state a
consumer must be told about rather than left to infer.

### What the search UI is worth

**`controls.button` +1 and `controls.input` +1, on every page, and nothing else.** Across both
re-captured baselines: 1850 changed `button` lines and 1850 changed `input` lines, the delta `+1`
on all 925 pages in each, zero unpaired lines, and **zero changed lines** outside those two fields
and the five `_meta.json` lines `[2026-08-24, one sweep over the whole diff]`. Task 8 guessed
`controls`, `landmarks` and `img`; `landmarks` and `img` do not move.

Directly observed rather than inferred from the diff: with the index served, `.pagefind-ui` and
`.pagefind-ui__search-input` each mount exactly once on `(home)`, `search-results/`,
`data-explorer/asthma/` and `about/`, with **0** pagefind-related console errors. Positive control
— the same probe with the index moved aside — reported 3 to 4 per page and 0 mounted nodes.

Both re-captured baselines pass their own `--check --all` `[2026-08-24]`: `staging` in 130s
including the Hugo and Pagefind builds, `prod_prod` in 112s against an already-running server, both
exit 0 with zero pages differing.

### `--check` refuses to compare across the two states

A searched site against a search-less baseline moves two fields on all 925 pages, which buries
anything real. `_meta.json` now records `pagefind`, and `--check` aborts with exit 2 naming the fix
rather than spending a sweep producing noise. Baselines predating the field have it `undefined` and
are not gated, since their state is unknown.

Positive control `[2026-08-24]`: index removed → exit **2**, `Pagefind mismatch: this server does
not serve the search index, the "staging" baseline was captured with it.` Index restored → exit
**0**, PASSED.

### Smoke's blanket Pagefind allowlist entry is now conditional

`smoke-pages.mjs` allowlisted `/pagefind|favicon|Failed to load resource|net::ERR/i` site-wide,
which was masking `PagefindUI is not defined` on every page — the precise failure its own CAUTION
comment warns about. The `pagefind` term is now split out and applies only when the index is
absent.

Both branches have a control, because a pass on one side proves nothing `[2026-08-24, 33 pages]`:

| Index | `when` predicate | Result |
|---|---|---|
| Served | live | PASSED, 0 pagefind errors |
| Absent | live | PASSED — the entry applies |
| Absent | forced to `false` | **FAILED, 33 of 33 pages**, `PagefindUI is not defined` |

The third row is what makes the first two mean anything: it proves the errors are genuinely present
and that the predicate is what suppresses them.

### Concurrency is now derived from the machine

`DEFAULT_CONCURRENCY` was a hard-coded 6. It is now
`min(24, max(6, availableParallelism()))` — 24 on the workstation this was measured on, and not
enough to overcommit a small Actions runner.

Measured over 925 pages against one `prod_prod` server, three sweeps interleaved so a warm cache
could not be read as a concurrency effect:

| Order | Concurrency | Wall |
|---|---|---|
| 1st | 12 | 198s |
| 2nd | **24** | **114s** |
| 3rd | 12 | 199s |

All three captures byte-identical across all 925 records, every page quiesced, console-error total
1862 in all three. The two `12` runs bracket the `24` run and agree to 1s, which is what rules out
warmth. A full `--check --all` including the Hugo build and the Pagefind build now takes **130s**.

The bounds are the range measured, not a known optimum. Raising the ceiling means measuring above
it first.

**One page churned, and it is not diagnosed.** The verifying `--check --all` reported
`data-explorer/drinking-water-quality/` differing under concurrency and matching on a sequential
re-capture. The arbitration guard handled it and the check passed. Arbitration has now gone
18 → 2 → 0 → 1 across the tile fix, the observer fix and this change — but a single occurrence does
not establish that concurrency 24 caused it, and the three interleaved sweeps above were
byte-identical at both 12 and 24. Recorded as observed, not explained.

### Not done: smoke's own concurrency

`smoke-pages.mjs` keeps `DEFAULT_CONCURRENCY = 6`. Its workload is different — it fails on console
errors and already re-checks concurrent failures sequentially — and nothing here measured it. What
would un-defer it: two `smoke:all` runs at different concurrencies, compared on both wall time and
the failure set.

---

**Deferred, not forgotten:** folding `smoke`'s console check and this sweep into one page visit
would halve the wall time of running both. Not done here because it would refactor the repo's only
automated check. What would un-defer it: the two harnesses being run together routinely enough that
the second sweep's cost is felt.

---

## Task 10: run the check in GitHub Actions

`.github/workflows/site-characterization.yml`. Triggers on `pull_request` into `production` or
`development`, plus `workflow_dispatch` with a `scope` (all / sample) and a `content` input.
`permissions: contents: read`. Action `uses:` are pinned to commit SHAs.

### It runs `prod_prod`, not `dev_stage`

The point of the gate is the site that is about to be deployed, against the data it will be
deployed against — so the workflow builds `--environment prod_prod` and the check selects the
committed `prod_prod` baseline. `hugo server` keeps the config baseURL's path while replacing the
host, so the site is served at `http://localhost:8080/IndicatorPublic/`
`[verified 2026-08-24: 200 there, 404 on / and /dev-stage/]`. That server's build summary reports
88 + 3 + 3 = 94 paginator pages, matching the 94 the sweep's own enumeration expects.

**Analytics do not fire under the harness.** `prod_prod` is the only environment emitting the
production GA property (`head.html:8`, `G-64BWDRHRGB`), and its only transport is `gtag.js` from
`www.googletagmanager.com` — which is in `BLOCKED_HOSTS` and aborted at `page.route`
(`site-characterization.mjs:630-633`), so the script never loads and the inline `gtag()` calls
reach nothing but a local `dataLayer`.

### Hugo version: measured equivalent, and now recorded

The repo held two Hugos, and which one ran depended on invocation: `node_modules/.bin/hugo` under
an `npm run`, the PATH binary otherwise. The deploy builds run **0.147.3** — `hugo-version: 0.147.3`
and build `05417512bd` in the log of run `32648348501` (2026-08-23) — and the lockfile has since
been moved to 0.147.3 to match, so the workflow uses `npx hugo` rather than
`peaceiris/actions-hugo`.

Whether that mattered was measured, three isolated builds under `--environment development`,
interleaved 0.147.3 / 0.147.9 / 0.147.3 so a time-ordered drift could not pass for a version
effect:

| Pair | Files | Content differs |
|---|---|---|
| 0.147.3 vs 0.147.3 (control) | 2936 / 2936 | 3 |
| 0.147.3 vs 0.147.9 | 2936 / 2936 | 3 |
| 0.147.3 (2nd) vs 0.147.9 | 2936 / 2936 | 3 |

The same three files in every pair — `index.html`, `es/index.html`, `zh/index.html` — and the only
line that moves is `<meta name="build_datetime">`. So the version effect equals the control floor:
**the two render this site identically**, and the "three home pages are build-nondeterministic"
note has a name — a clock, not randomness. No record reads that field, so it cannot reach a
baseline. Both committed baselines are valid whichever binary captured them.

`_meta.json` now records `hugo: { version, owned }` anyway, so a future divergence is diagnosable.
`owned` is load-bearing: the version is a fact about the *server* only when `ensureDevServer()`
spawned it. For a `DE_BASE_URL` or reused server — which is the CI case — it describes the machine's
PATH, and the site emits no generator meta, so nothing better is observable. Nothing gates on it.

### What is not proven

It has now run on a GitHub runner — four times, green and red; the ledger row names each run and
its commit. `hugo-extended` is pinned exactly (`90328b504e`), so `npm ci` in CI resolves the same
binary the deploy workflows install.

Still not proven: the workflow on `production`. PR #1480 is an open draft, so `workflow_dispatch` —
and with it the cheap 41-page `scope=sample` mode — remains unregistered, and nothing but this PR
has ever triggered a run.

**`timeout-minutes: 20` has less headroom than the sweep suggests.** The longest job was 17m52s
(`32777189174`), of which 9m52s was `Checkout`, against 19-35s in the other three runs. Nothing
diagnosed that outlier. The sweep in that run was normal (380s), so the margin was spent by a step
this workflow does not control.

### How to get a first run, before it is on `production`

`workflow_dispatch` is unavailable until then: GitHub documents that "this event will only trigger a
workflow run if the workflow file exists on the default branch"
`[docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, read
2026-08-24]`. `gh workflow run` does take `-r/--ref`, so the CLI is not the limitation — the
registration is.

`pull_request` carries no such requirement; a workflow added on a PR branch runs for that PR. So
the first execution comes from opening a PR from this branch into `production`, which the trigger
already matches on its base branch.

**Once it is on `production`, iteration gets cheap.** A `--ref` dispatch executes the workflow file
from that ref rather than the default branch's copy, so `gh workflow run site-characterization.yml
--ref feature-site-characterization -f scope=sample` runs the branch's version at 41 pages. Measured
2026-08-24 by `.github/workflows/test-print-branch.yml`: the copy merged to `production`
(`e6a1acc0d3`) prints the literal string `production`, the branch-only follow-up (`b1deba145d`,
confirmed not an ancestor of `production`) prints `feature-add-workflow-version-test`, and the
`--ref` dispatches printed the latter. That experiment does **not** speak to the registration
requirement above — all four of its runs came after the merge that put the file on `production`.

**Opening that PR does not deploy.** `hugo-build-to-prod-prod.yml` is `pull_request` with
`types: [closed]` and an `if: ... github.event.pull_request.merged == true` guard on the job, so it
fires on merge and not on open. A draft PR is therefore a free way to run this check, and each push
to the branch re-runs it — `cancel-in-progress` retires the superseded run.

The consequence for the first run: it will be the full 925-page `--all` sweep, because `scope` only
exists on the dispatch trigger. The cheap 41-page mode is not reachable until the file is on
`production`.

**Decision taken 2026-08-24 — the order to run these in.** Push the branch, open a **draft** PR into
`production`, and let the full sweep run there. Merge only once it is green, then iterate with
`--ref` sample dispatches. Rejected: merging the workflow to `production` first to unlock the cheap
mode. It reverses the value — merging is what deploys the live site, so it spends the irreversible
step to save wall time on the reversible one, and it ships a workflow that has never executed.
Also rejected: cherry-picking just the workflow file onto `production` in a small PR, which merges
to `production` all the same and therefore deploys all the same.

**Carried out 2026-08-24** — the draft PR is #1480 and the full sweep ran there. The merge half is
still outstanding.

**Both numbers are now set from the runs, 2026-08-24.** `timeout-minutes` is 20, 2.4x the 8m13s
job measured by `32771116783`. The readiness poll is 300s bounded by the clock, not 240 attempts —
a single `curl` can block for as long as the build takes, so counting attempts does not measure
time. Measured on the runner: 62s to a serving build, 1.2s for Pagefind, 370s to sweep 925 pages at
concurrency 6, the floor, since ubuntu-24.04 reports 4 logical processors. Locally the same 925
pages take 114s at concurrency 24. The local reference points that stood here before — a 4.6s warm
`prod_prod` server build and a 43s cold-`resourceDir` static build — were never the binding
constraint.

**Corrected 2026-08-24 — the line that stood here was wrong.** It read that Hugo "does not bind
the port" before printing `Web Server is available`, stamped `[verified 2026-08-24]`. On the runner
it binds first: the opening `curl` was refused at 0ms and the second blocked inside one iteration
for 62s of wall clock before answering `[run 32771116783]`. Waiting on a 200 is still a sound gate
— a poll cannot catch a half-built site, because the connection is held open until Hugo can answer
— but for the opposite reason to the one recorded, and that is why the poll is bounded by the clock
rather than by attempts.

### Not done: making the gate independent of EHDP-data

`structure` carries data-derived counts, and `prod_prod` pulls EHDP-data's `production` branch, so
a PR touching no template can go red because the data moved. `data_branch` is only a ref segment in
`{data_repo}{data_branch}/...`, and `raw.githubusercontent.com` serves a commit SHA there exactly as
it serves a branch name `[verified 2026-08-24: 200 for both `staging` and `b2b63d0635`]` — so
pinning it is available. A fixture branch is preferable to a SHA, because the baseline key is the
ref string and a SHA makes the baseline directory name churn on every bump. Costs a new
`config/<env>/config.toml` and a fresh 925-page baseline. What would un-defer it: the gate going red
for data reasons often enough to be ignored.


---

## Reading a red run

Written 2026-08-24 against run `32779430909`, the first red one. **This is the draft of a section
that belongs in `readme-development.md`** — refine it here while Tasks 12-14 change what the output
looks like, then port it there.

### 1. The environment line, before the diff

```
Environment: prod_prod (EHDP-data production) at /IndicatorPublic/ — baseline "prod_prod" — pagefind served
```

Four facts, and if any is wrong nothing below it means anything: the Hugo environment, the
EHDP-data branch it pulled, the path prefix served, and which committed baseline was selected.
`pagefind served` carries as much weight as the rest — the search UI is worth `controls.button` +1
and `controls.input` +1 on **every** page, so a site without the index compared against a baseline
with it would report 925 false regressions. The check refuses that comparison rather than making
it.

Exit codes: **0** pass; **1** the compared sections differ; **2** the run could not be compared at
all — a missing baseline, or a Pagefind state that disagrees with the baseline's.

### 2. What the check can establish, and what it cannot

The harness observes rendered output. Getting from an output delta to the edit that caused it is
inference, and one input is structurally invisible to it: EHDP-data moves independently of this
repo, so a PR that touched nothing can go red and the diff holds no trace of why.

| Question | Answerable from one run? |
|---|---|
| What moved — field path, before, after, on which pages | Yes, exactly |
| Which source file — the page set narrowed against the PR's own diff | A strong hint, not proof |
| My change, or EHDP-data's? | **No.** Task 14 is the experiment that answers it |

### 3. The page set is the sharpest single signal

It costs nothing to read and it is usually decisive:

- **All 925 pages** — something in `baseof.html`, `head.html`, the header/footer partials, or a
  globally loaded asset. Nothing else reaches every page.
- **One section** (`data-explorer/*`, `data-stories/*`) — that section's layout folder, or the
  `.Section` gate in `head.html` that decides which libraries load there.
- **One page** — that page's content bundle, or its `customJS`.
- **A scatter with no shape** — suspect the data, and go to Task 14.

### 4. Which fields move for which reason

Task 8's cross-environment measurement separates the two axes, and is the only calibration we have
for this: comparing the `staging` and `prod_prod` baselines, `meta` moved on all 925 pages from the
environment-*name* axis, while `controls` (95 pages), `headingLevels` (86) and `links` (84) moved
from the **data branch** `[2026-08-24]`.

So `controls.*`, `links.*` and `headingLevels` moving on data-explorer or neighborhood-report pages
is what a data change looks like. `assets`, `meta`, `landmarks`, `jsonld`, `img.missingAlt` and
`overflowX` have no data path to them and point at this repo.

This is calibration, not a rule — it was measured across two environments, not across two states of
the same one.

### 5. Three numbers that are printed and not gated

```
Fingerprinted asset references seen (strip control): 9909
Console errors across the sweep (NOT baselined — that is smoke's job): 1869
Every page reached DOM quiescence before the cap.
```

The first is a control on the comparison itself: fingerprinted filenames are stripped before
diffing, and a **0** there would mean the stripping matched nothing and every asset comparison is
meaningless. The second is harness health — console errors are `smoke`'s gate, deliberately not
this one, so the number is context and never a failure. The third says no page was captured
mid-render.

### 6. The artifact

A failed run uploads `site-characterization-<run_id>`, holding the full capture
(`scripts/site-characterization-current/`), both projected comparison trees (`scripts/.sc-check/`)
and `hugo-server.log`. Download it and run `git diff --no-index scripts/.sc-check/base
scripts/.sc-check/head` locally — keep it at a short path, since `--no-index` prints nothing at all
on a long one while still returning the right exit code.

---

## Task 11: skip docs-only PRs

**Files:** `.github/workflows/site-characterization.yml` — the `on.pull_request` block.

**Interfaces:** none. Nothing else reads or depends on this.

DONE 2026-08-24 in `7bcdec1945`. `paths-ignore` with ten explicit entries:
`documents/**`, `memories/**`, `.claude/**`, `.agents/**`, the four root `readme*` / `README.md` /
`CLAUDE.md` files, and `LICENSE`.

**Explicit entries rather than a pattern, deliberately.** A blanket `**.md` would also skip
`content/**/*.md`, which is the site's own copy and the most ordinary reason for the check to have
something to say. Everything on the list is unreachable from a rendered page: Hugo builds from
`content/`, `themes/`, `assets/`, `data/`, `static/`, `config/` and `archetypes/`, and none of these
are among them `[verified 2026-08-24: across themes/, content/, config/, data/, assets/ and
static/, the only mentions of documents/ or memories/ are two HTML comments citing an audit doc]`.

**It does nothing for PR #1480, and that is the filter working as documented.** A `pull_request`
path filter is evaluated against the whole three-dot diff, not against the latest push — GitHub:
"If any path names do not match patterns in `paths-ignore`, even if some path names match the
patterns, the workflow will run"
`[docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax, read 2026-08-24]`.
This PR's diff carries 1856 files under `scripts/`, so nothing it will ever receive can be
docs-only. The filter pays off on a *future* PR whose entire diff is documentation. To suppress a
single run on a PR like this one, the tool is a commit-message keyword — `[skip ci]`, `[ci skip]`,
`[no ci]`, `[skip actions]`, `[actions skip]`, or a `skip-checks: true` trailer — which applies to
`push` and `pull_request`
`[docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs, read 2026-08-24]`.

**WARNING, recorded in the file as well:** do not make this a required status check while it has a
path filter. GitHub: "Associated checks stay in a 'Pending' state and block merging" when a
workflow is skipped by path filtering, and the same applies to a skip keyword
`[docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks,
read 2026-08-24]`. A docs-only PR would then be unmergeable. Nothing is required on `production`
today `[gh api .../branches/production/protection, 2026-08-24: no required_status_checks key, and
rulesets is empty]`.

**Proof that ran:** the file parses to the intended shape — 2 triggers, `branches` + `paths-ignore`
under `pull_request`, the same 2 branches, 10 ignore entries, the same 2 dispatch inputs, the same
11 steps, `timeout-minutes: 20` `[js-yaml, 2026-08-24]`. **Never exercised on a runner**, and it
cannot be until a PR arrives whose whole diff is docs.

## Task 12: say what changed, not just that something did

**Files:**

- `scripts/site-characterization.mjs:1186-1210` — the check's reporting block. `project()` writes
  both comparison trees, then `execFileSync("git", ["diff", …], { stdio: "inherit" })` at line 1199
  streams raw hunks to the console with no summary in front of them.
- `scripts/site-characterization.mjs:683` — `walk()`, already used to enumerate both trees.
- `scripts/site-characterization.mjs:108, 116` — `CURRENT_DIR` and `DIFF_DIR`.

**Interfaces:** consumes the two projected trees `${DIFF_DIR}/base` and `${DIFF_DIR}/head` that
`project()` has already written. Produces a `summarize(baseDir, headDir)` returning
`[{ page, field, before, after }]`, which Task 13 consumes.

The failure this fixes is not the one the CI run showed. Three unrelated fields on three pages
reads fine as raw hunks. The common case does not: a template edit moves one field on all 925
pages, and the log becomes 925 near-identical hunks with no sentence saying it is one field.

**Do not parse the diff text.** Both sides are JSON on disk, so compare the objects directly —
a recursive walk yields exact dotted field paths and both values, where recovering a field path
from `-            "missingAlt": 3,` means reconstructing nesting from indentation.

1. Add `flatten(obj, prefix)` returning a `Map` of dotted path to a JSON-stringified leaf value.
   Arrays flatten as whole values, not per index, so `assets` reports as one changed field rather
   than as N insertions. Expected: `flatten` on any baseline record returns a Map whose size equals
   the record's leaf count.
2. Add `summarize(baseDir, headDir)` — walk the intersection of both trees, flatten each pair,
   and collect every key whose stringified values differ. Expected: on two identical trees it
   returns `[]`.
3. Print before the raw diff, on failure only: the count of differing pages out of the total; a
   table of field → page count → one example page with its before/after; and a per-section
   breakdown. Expected on the Task 4 injection: three rows, one page each.
4. Cap the raw diff at the first 40 hunks and print `… N more — see the artifact` beyond that.
   Keep the full diff in `${DIFF_DIR}`, which the artifact already uploads. Expected: a 925-page
   single-field regression prints one summary table and 40 hunks, not 925.

**Proof:** re-apply the exact three-record perturbation from `cb334f5b37` and confirm the summary
names those three fields on those three pages and nothing else. That control comes from a known-red
case captured before this code existed, so it cannot be circular. Then revert and confirm a clean
`--check` prints no summary at all. Two local `characterize:site` runs, ~130s each.

## Task 13: put the summary on the run page, and name the candidate source files

**Files:**

- `scripts/site-characterization.mjs` — the reporting block from Task 12.
- `.github/workflows/site-characterization.yml` — the `Run the characterization check` step.

**Interfaces:** consumes Task 12's `summarize()` output. Produces a markdown table appended to
`$GITHUB_STEP_SUMMARY`, which GitHub renders on the run page.

1. When `process.env.GITHUB_STEP_SUMMARY` is set, append the same table as markdown. Expected: a
   red run is legible on the run page without opening the log. When it is unset, behaviour is
   unchanged — that is what keeps local runs identical.
2. Emit the page-set shape as one sentence, computed rather than left to the reader: all pages, one
   section, or a scatter. Expected: the Task 4 injection reports a scatter of three.
3. Intersect the changed page set against the PR's changed files
   (`github.event.pull_request` provides them) and list the layouts and assets in the diff that
   could plausibly render those pages. **Print these as candidates, never as a cause** — the
   intersection cannot see EHDP-data, and Task 14 is what decides that.

**Proof:** the injection control from Task 12, run once with `GITHUB_STEP_SUMMARY` pointed at a
temp file, and the file's contents compared against the console table. A CI run is not needed to
prove the markdown; it is needed to prove GitHub renders it, which is one push.

## Task 14: merge-base control run — my change, or EHDP-data's?

**Files:** `.github/workflows/site-characterization.yml` — a second job, `if: failure()` on the
first.

**Interfaces:** consumes nothing from Tasks 12-13. Produces one line: whether the same failure
reproduces at the merge base.

This is the disconfirming test for the one question no amount of better formatting can answer.
Check out `github.event.pull_request.base.sha`, build, sweep, and compare against the same
committed baseline. Red there too means EHDP-data moved and the PR is innocent. Green there and red
at the head means it is the PR.

Two things to settle before building it, both of which could kill it:

- **Cost.** It doubles an ~8-minute job on failure, and `timeout-minutes: 20` already came within
  ~2 minutes of expiring once, on a run where `Checkout` alone took 9m52s. A separate job with its
  own timeout is the way to avoid inheriting that margin.
- **It may be redundant.** Pinning `data_branch` to a fixture ref — already scoped under *Not done:
  making the gate independent of EHDP-data* — makes a red run unambiguously code, and then this
  control has nothing left to distinguish. Decide which of the two to build; building both is
  paying twice for one answer.

**Proof:** trigger it by checking a PR head against a baseline captured before an EHDP-data change,
so the head is red for a data reason and the base is red identically. Until that case exists,
the job is unproven no matter how many green runs it sits beside.
