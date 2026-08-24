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

| # | Task | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Probe core + determinism control | `9cbb2d44d0` | **DONE 2026-08-23** | 3 sweeps, 3 separately started servers, all 3 pairs byte-identical over 41 pages `[git diff --no-index --exit-code, exit 0 on a-b, a-c, b-c]`; control perturbing `landmarks.nav`, `lang` and `assets` fired on all 3 |
| 2 | Dead-field sweep over 925 pages | `e6ebe5c2c5` | **DONE 2026-08-23** | 925/925 captured, all quiesced; distinct-value table for all 36 `structure` fields; the 3 zero-constants proved live by `node scripts/site-characterization-probe-control.mjs`, all 4 responded |
| 3 | Baseline / check plumbing | `4c076520d0` | **DONE 2026-08-23** | `--baseline` then `--check` exit 0; perturbed `content.title` → `--check` exit 0 and `--check --content` exit 1 naming the page; baseline corrupted to `controls.button: 999` → exit 1 naming the field, with the sequential re-capture path firing. The `cleared` branch is **not** proven — see findings |
| 4 | Positive controls — prove the net catches things | *no code change* — the evidence is the findings section below | **DONE 2026-08-23** | 11 of 11 injected regressions drove `--check` to exit 1, each naming its own field; tree clean and `--check` passing again after all reverts. Two prescribed injections were wrong about the repo and are corrected in the table |
| 5 | Wire up npm scripts and document | *see the Task 4+5 commit* | **DONE 2026-08-23** | `npm run characterize:site:sample` exits 0 from both Bash and PowerShell; the two `--all` scripts are deferred to Task 6, which is when the baseline they need exists. The `readme-development.md` step was dropped on a false premise — see findings |
| 6 | Commit the baseline | harness fix `6200892d85`; baseline in the commit that follows it | **DONE 2026-08-23** | `npm run characterize:site` exit 0 against the baseline captured at `6200892d85` — 925/925, every page quiesced, zero pages differing, arbitration not needed. Baseline measured at 926 files / 4.74 MiB. The first attempt FAILED and found a dead field — see findings |
| 7 | Cold-fetch experiment | *the commit that follows* | **DONE 2026-08-24** | Theory retired on its premise — the dev server sends no Cache-Control or ETag and every capture already gets its own browser context. Found instead that the mutation observer never attached: 0 batches counted where a working one counts 2,558. Fixed, guarded, and the guard's positive control fires. Full check exit 0 afterwards, 925/925, zero differing |
| 8 | Multiple environments | *the commit that follows* | **DONE 2026-08-24** | Baselines keyed `staging` / `production` / `prod_prod`, key read off the running site. `staging` and `prod_prod` both captured at `e960523842` and both `--check` PASSED with zero differing, no arbitration in either. All 925 shared pages differ between the two baselines, which is the split earning its place. Use `hugo server` in CI — the baselines were captured that way. Two objections to static serving in an earlier draft were wrong and are corrected in the findings; the one real difference is Pagefind |

Derive what this table deliberately does not claim:

```bash
git log --oneline d8c45abebe..HEAD                                              # the task commits
git rev-list --left-right --count origin/feature-site-characterization...HEAD   # "0	0" means pushed
gh pr list --head feature-site-characterization                                 # a PR, and its base
```

### Environment state a cold session needs

- Branch `feature-site-characterization`, cut from **local** `production` at `d8c45abebe`.
  `git config --get branch.feature-site-characterization.merge` is empty, which is correct.
- Worktree: `EH-dataportal.worktrees/merge/production`. Nine other worktrees exist; do not start a
  second Hugo builder in any of them while this one has a server up (CLAUDE.md § *Four ways a local
  check silently lies*).
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
asset list is unaffected. What would change is that in a real build those scripts **execute**, and
whatever the search UI injects would land in `controls`, `landmarks` and `img`. That is untested.

**So:** serve with `hugo server` and the committed baselines apply as-is. If you would rather check
the artifact that actually ships, that is a legitimate different choice — capture the baseline from
a static build too, and expect Pagefind to appear in it. The test either way: build to a temp
directory with the isolated-build recipe in CLAUDE.md, serve it, point `DE_BASE_URL` at it, and
`--check` against the committed `prod_prod` baseline.

---

**Deferred, not forgotten:** folding `smoke`'s console check and this sweep into one page visit
would halve the wall time of running both. Not done here because it would refactor the repo's only
automated check. What would un-defer it: the two harnesses being run together routinely enough that
the second sweep's cost is felt.
