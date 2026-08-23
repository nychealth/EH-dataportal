# Whole-site characterization harness — plan

**Status as of 2026-08-23:** branch `feature-site-characterization` cut from `production` at
`d8c45abebe`. Tasks 1 and 2 **done** — the premise held, but only after one source of run-to-run
churn and five harness defects were found and fixed, and all eleven constant fields have now been
justified rather than assumed. See *Task 1 findings* and *Task 2 findings*. Tasks 3–6 not started.
The signal set is settled and no field was deleted.

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
| 3 | Baseline / check plumbing | — | **Not started** | — |
| 4 | Positive controls — prove the net catches things | — | **Not started** | — |
| 5 | Wire up npm scripts and document | — | **Not started** | — |
| 6 | Commit the baseline | — | **Not started** | — |

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

**Result: the premise holds.** Three sweeps, each against a separately started `hugo server`, all
three pairs byte-identical across 41 pages `[verified 2026-08-23: git diff --no-index --exit-code,
exit 0 on a-b, a-c and b-c; plus an independent Node file-by-file comparator, 0 files differing]`.
It did not hold on the first attempt.

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
| 3 | `img.missingAlt` | Delete one `alt` attribute in a shared partial | every page rendering it |
| 4 | `landmarks` | Delete the `<nav>` wrapper in `partials/header.html` | every page |
| 5 | `controls.noAccessibleName` | Remove one `aria-label` from a header button | every page |
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

**Deferred, not forgotten:** folding `smoke`'s console check and this sweep into one page visit
would halve the wall time of running both. Not done here because it would refactor the repo's only
automated check. What would un-defer it: the two harnesses being run together routinely enough that
the second sweep's cost is felt.
