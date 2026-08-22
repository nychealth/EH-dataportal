# Audit backlog on `production` — 2026-08-20

**Goal:** land the easy and moderate audit findings that are open on the tree `production` is about
to become, in three deployable branches. Every item below was re-verified against `merge/production`
at `a67f957ba7` on 2026-08-20 — not taken from the audit's own status line, because most of these
read as FIXED in a document that was written against a feature branch where they were.

**Base:** branch off `production` **after** PR [#1473](https://github.com/nychealth/EH-dataportal/pull/1473)
merges, from the merge commit. Decided 2026-08-20. Rejected: committing into the open PR, which would
invalidate the 33/33 smoke run it cites at `31b08a3aa2` and delay the deploy behind 20+ review items.

**Not in scope:** the Congestion Pricing analytics instrumentation
([`cp-report-analytics-events.md`](cp-report-analytics-events.md), 7 tasks, all unstarted) — deferred
by decision 2026-08-20, unchanged by anything here.

---

## Ledger

**Status as of 2026-08-21: Branch A is in review as
[PR #1474](https://github.com/nychealth/EH-dataportal/pull/1474) — base `production`, head
`2b4abe82f2`, 7 task commits `3ce4b8f2b3..cad179b26c` plus ledger commits on top. Branch B
(`hotfix-audit-seo-meta`) is cut from A's tip and in review as
[PR #1475](https://github.com/nychealth/EH-dataportal/pull/1475), **based on `hotfix-audit-markup-a11y`,
not `production`** — Tasks 10–16 committed as `f697da1c81..eb80c2abd4`, one per task except Tasks 12
and 13, which both edit `head.html` and share one, plus ledger commits on top. **B also carries one
commit that belongs to no task** — `b905e1e3d4` edits the project `CLAUDE.md`, adding a fourth entry
to "ways a local check silently lies" and making the stale-asset rule checkable; it came out of the
lessons pass on Branch B, and it reaches `production` behind B like any other change on this branch.
Task 20 and Task 22 should read it before touching that file. Branch C (`feature-audit-moderate`) was
cut from B's tip at `3cd323a44d` on 2026-08-21, in the same `merge/production` worktree, which now
has C checked out rather than B; Tasks 17–22 all landed there on 2026-08-21 as `3cd323a44d..465ffceb84`, seven commits, plus three ledger commits on top (`ab668aec40`, `016f785d8f`, `71d84bbadf`). Whether C is pushed and whether a PR exists are relationships, not facts — derive them with the commands under "The exact next commands"; as of 2026-08-22 all three branches were pushed with PRs open, C's being #1476. **C also carries one commit that belongs to no task**, in the same shape as B's `b905e1e3d4`: `74a11a51ef` adds a paragraph to the project `CLAUDE.md` about `customJS` bundles being where two `data-features` pages initialize flexdatalist, from the lessons pass after Task 19.**
PR #1473
merged at `6a2101c19a`; Task 0's branch had already merged ahead of it at `dcaafea20a`, so Task 0
is DONE without any work. Branch A (`hotfix-audit-markup-a11y`) was cut from `6a2101c19a` **in the
`merge/production` worktree**, which now has that branch checked out rather than `merge/production`.
Tasks 1–9 are implemented and proved, one commit per task except Tasks 4 and 5, which share one.
See the sequencing decision below.

**Sequencing decision, 2026-08-21 — superseded the same day. A, B and C are stacked, and all three
are worked and reviewed in parallel.** B is cut from A's tip, C from B's tip. Nothing waits on a
merge into `production`: all three PRs can be open at once, and only the *merge* order stays serial
(A → B → C).

Rejected, with reasons. **Cutting all three from `production`** — the measured overlap makes this the
expensive option, not the cheap one. Task 17 touches the 49 layouts carrying `#skip-header-target`,
and 9 of them are files Branch A modifies (`partials/header.html`, `partials/header-ds.html`,
`key-topics/single.html`, the four `data-features/` feature layouts, `data-features/section.html`,
`data-stories/section.html`); Task 21 adds an include to `partials/head.html` that Tasks 12 and 13
are rewriting `[verified 2026-08-21: comm -12 of the skip-header-target file list against the
Branch A working-tree file list returned those 9; Branch B's file list intersects Branch A's in
nothing]`. It would also give each branch its own copy of this ledger — the per-branch `documents/`
divergence CLAUDE.md warns about. **Running them serially**, each cut after the previous merges, was
the earlier decision recorded here; it keeps one ledger lineage but blocks each branch on the
previous branch's review, which is the cost that retired it.

Cost of stacking: if review changes Branch A, B and C need `git rebase --onto`. That is the same
9-file collision either way — stacking pays it with a lineage to rebase along, cutting from
`production` pays it as a merge conflict without one.

**The ledger ports forward by lineage, not by hand.** B contains A and C contains B, so this
document's later copies already hold the earlier branches' rows: one lineage, no manual
reconciliation. Task 22 lands last, on C, and therefore sees all three branches' entries.

**Completed work is referenced by branch, and by commit once one exists — `A @ <sha>`.** A `DONE`
row is a fact about the branch named in its Branch column and about nothing else until that branch
merges; check `git log production` before citing one as live on the site.

| # | Task | Branch | Status | Proof that ran |
|---|---|---|---|---|
| 0 | Merge `upgrade-GHA-dependencies` | (its own) | **DONE 2026-08-21** | Already merged at `dcaafea20a`, ahead of #1473. `git rev-list --left-right --count upgrade-GHA-dependencies...production` returned `0 49`; `git diff --name-only production upgrade-GHA-dependencies -- .github/` returned nothing |
| 1 | Header logo `alt` + link name | A @ `712c74a33c` | **DONE 2026-08-21** | axe `image-alt` and `link-name` both 0 violations over 4 pages; a11y tree shows `img "Environment & Health Data Portal home"` |
| 2 | Duplicate `id="languages"` | A @ `3ce4b8f2b3` | **DONE 2026-08-21** | `grep -c 'id="languages"' footer.html` returned 1. Renamed the **hidden** (`d-none`) block to `languages-grid`; the visible block keeps `languages` so `[id="languages"]` in `_f-layout-elements.scss:27` still matches. No JS references either id |
| 3 | Duplicate `data-toggle` ×3 | A @ `9ae35c3e9a` | **DONE 2026-08-21** | Pattern 3 to 0 in the template. All 3 call sites open `#searchModal` in-browser, with a validated positive control (driving the modal directly opened it) and a negative control (closed state reads false). A synchronous read after `.click()` returns a false negative — the modal is animated |
| 4 | `<a><li>` ×6 | A @ `d0fc7e1753` | **DONE 2026-08-21** | Pattern 6 to 0; axe `list`/`listitem` 0 violations. Dropdown **pixel-identical** before/after under a matched procedure, and desktop + mobile geometry identical on 5 measured boxes |
| 5 | Site-title `<a>`/`<span>` overlap | A @ `d0fc7e1753` | **DONE 2026-08-21** | a11y tree: one `link "Environment & Health Data Portal"` where the parser previously produced **two** anchors. Header screenshot pixel-identical across the change |
| 6 | Unlabeled `<nav>` landmarks | A @ `6c85c4a575` | **DONE 2026-08-21** | axe `landmark-unique` 0 violations; a11y tree shows exactly `navigation "Main"` and `navigation "Footer"` exposed on the home page |
| 7 | 16 `<img>` with no `alt` | A @ `b152f67c31` | **DONE 2026-08-21** | axe `image-alt` 0 violations on home, cooling-info, nyccas and a data story. Task 7 covered **14** images, not the 15 the plan lists (16 site-wide including Task 1) — see the corrections below |
| 8 | 19 doubled `class` attributes | A @ `cad179b26c` | **DONE 2026-08-21** | 19 to 0 in templates. Proved a no-op **against the Task 8 commit alone**, which is the only scope where the proof holds — `index.html` and `components.html` also carry Task 7's `alt` additions, so file-scoped it fails on 2 of 7. Stripping every `class="…"` from `cad179b26c` and from its parent leaves all 7 files identical, 7 of 7, with the same comparison unstripped differing as a control. The surviving attribute is the first one in all 19 |
| 9 | Gate `g-dev-tools.scss` by environment | A | **DONE 2026-08-21 — no change made** | Doc correction. The partial emits **zero CSS**: both features are gated on `$floating-breakpoints-bar: false` and `$container-background-color: false`, hardcoded with no environment input. Compiled stylesheet: `breakpoint: ` 0 hits, `[class*="container"]` 0 hits, against positive controls `.site-title` 3 and `.link-no-dec` 1 |
| 10 | `<html lang>` from the page's language | B @ `f697da1c81` | **DONE 2026-08-21** | Generated HTML, isolated `prod_prod` build: `es/` and `zh/` each went from 51 pages at `lang="en"` to 51 at their own language; the 827 English pages unchanged. Counted excluding Hugo's 442 internal alias stubs, which hardcode `lang="en"` and would have masked the result |
| 11 | `robots.txt` production body + `Sitemap:` | B @ `fa966be9c9` | **DONE 2026-08-21** | Copied verbatim; `git hash-object` matches `feature-MOD-Lab-NR-recode-refactor`'s blob `1a3bbb2502`. Built both environments: `prod_prod` writes 1089 bytes with a bodiless `Disallow:` and an absolute `Sitemap:`; `development` writes 736 `Disallow` lines and **0** `Sitemap`. The pre-change tree wrote **no robots.txt at all** under `prod_prod` — stronger than the plan's "emits nothing" |
| 12 | Collapse the stacked `robots` metas | B @ `c7497564b9` | **DONE 2026-08-21** | Control build of the pre-change tip shows **3 pages carrying 2 metas** — so the sweep can see the defect it reports gone. After: 927 real pages with exactly 1; `resources/` reads `noindex` under `prod_prod` and `noindex, nofollow` under `development` |
| 13 | `<title>` brand suffix | B @ `c7497564b9` | **DONE 2026-08-21** | 0 → 924 of 927 real pages end in the suffix. The 3 that do not are the home pages, excluded by an `.IsHome` guard. (Originally written as "924 of 933 … the 9 that do not", counting 6 `static/` files that never reach `head.html` and were never real pages — see found-item 6.) Instrument check in the same sweep: 0 pages have a `<title>` spanning lines, so the line-oriented read is sound here |
| 14 | Vestigial metas out; `canonical`/`og:url` absolute | B @ `cc8f651bcc` | **DONE 2026-08-21** | 927 pages went path-only → absolute for both `canonical` and `og:url`; `geo.region` and `fb:profile_id` went from 927 pages to 0. The `og:url` half is now sourced: OGP's URL type is "All valid URLs that utilize the http:// or https:// protocols" [https://ogp.me/, retrieved 2026-08-21] |
| 15 | `click_how_caclulated` misspelling | B @ `8334d0450a` | **DONE 2026-08-21 — renamed** | Decision 2026-08-21: rename, accepting the GA4 continuity cost. Browser, reading `window.dataLayer` directly: one `click_how_calculated`, zero under the old spelling, `#howCalcModal` still opens. Cutover date recorded in the audit's §9, which is this repo's analytics inventory |
| 16 | `click_subscribe` fires twice — confirm, then fix | B @ `eb80c2abd4` | **DONE 2026-08-21 — the doubling was real** | Evidence first: one click produced **2** events with two schemas, `{page, place}` from `main.js` and `{page, place, click_url}` from `site.js`. Removed the `main.js` emitter; re-click gives exactly 1 and the modal still opens. The `main.js` fingerprint differed across the two runs, ruling out a cached script |
| 17 | `#skip-header-target` de-duplication | C @ `d057ea74ca` | **DONE 2026-08-21** | Control build of the pre-change tip: **355 real pages carried 2 declarations**, so the sweep can see the defect it reports gone. After: **all 927** real pages carry exactly 1, all on `<main>` with `tabindex="-1"`. (Originally "927 of 933"; the 6 `static/` passthrough files with no header and no skip link were never real pages — see found-item 6. They were identical before and after either way.) Browser, 5 pages: Enter on the skip link leaves `document.activeElement` as `<main id="skip-header-target">`; a negative control that strips `tabindex` in-page leaves it on `<body>`, which is what shows the probe reads focus and not scroll. `npm run smoke` 33/33 |
| 18 | flexdatalist combobox port, 5 call sites | C @ `9c2f424ce0` | **DONE 2026-08-21** | Browser, all 5 call sites, with a full control run on the stashed pre-change tree. **Control fired on every discriminating check:** `aria-expanded` read `false` with 36/4/4/1/1 options showing, and after Escape the list was gone at 60 ms and **back at 660 ms** — the reopen defect, reproduced on 5 of 5. After: `role=combobox`, `aria-expanded` true while open, `aria-activedescendant` resolving to a real `<li>` id after ArrowDown, and `false` with no list at both 60 ms and 660 ms. axe 4.13.0 `aria-allowed-attr` [critical] **4 → 0**; the 5th (aqe) never reported it, for the reason in the found-items below. Not discriminating, and recorded as such: the outside-click path reads the same in control and after |
| 19 | `$primary`-as-text contrast sweep | C @ `4f5e7f5f4f` | **DONE 2026-08-21** | `getComputedStyle` on live nodes across 15 pages, every rendered element painting `#008939` or `#007a31`, ratio computed against the composited background actually behind it. **Control on the stashed pre-change tree: 4 measurements below their applicable AA threshold; after: 0.** Three rules switched to `$primary-dark`: `a`, `$accordion-title-color`, `.neighborhood-list-button`. The full table and the four instrument corrections are below |
| 20 | Port the guardrails (`lint`, `docs-check`) | C @ `e45cdb603f` | **DONE 2026-08-21 — `lint` lands red, on purpose** | `npm run docs-check` PASSES on `CLAUDE.md`, and all three of its probes were shown to fire first on a seeded control (missing source root, missing path, unknown identifier), so the pass is not a null result. Its one real hit was a path claim written into `CLAUDE.md` earlier the same day. `npm run lint` exits 1 with **33 `no-undef` errors over 5 names**; see the found-items below for why they are real and left unfixed. eslint's DE block is byte-identical to the source branch's apart from two rewritten comments — `diff -u` against `feature-MOD-Lab-NR-recode-refactor:eslint.config.mjs` shows every code deletion is NR-only. `scripts/docs-check.mjs` is byte-identical (`cmp -s`) |
| 21 | JSON-LD: Organization, WebSite, BreadcrumbList | C @ `d293ef6cfd` | **DONE 2026-08-21 — Rich Results Test still owed** | Isolated `prod_prod` build, exit 0, **0 ERROR**: **927 of 927** pages rendered through `head.html` carry a block — 924 `BreadcrumbList` plus 3 home-page `@graph`s — 0 JSON parse failures, and 0 breadcrumbs with a non-monotonic `position`, a relative `item` URL or an empty `name`. Browser check on the home page adds what the file sweep cannot: `JSON.parse` returns `[object Object]`, not `[object String]`, which is the discriminating read against the `safeJS` bug below; the site name's ampersand round-trips; and `WebSite.publisher.@id` matches the Organization's `@id` exactly. `npm run smoke` 33/33 against the `development` server, `head.html` being the rule's trigger. **Consumer check done 2026-08-22** — code-snippet mode against an isolated `prod_prod` build at `016f785d8f`, the live site carrying none of this until the branch deploys. Google's Rich Results Test: `BreadcrumbList` (`data-stories/adult-lead`) → **1 valid item detected**, 0 errors, 0 warnings. The home `@graph` → **No items detected**, flagged `info` and not `error` — that tool reports only types it has a rich-result treatment for, and an `Organization`/`WebSite` pair with no `SearchAction` has none. The breadcrumb run is the positive control that makes the null readable rather than ambiguous with a failed submission. `validator.schema.org` covers the type the Google tool ignores: the home `@graph` → **0 ERRORS, 0 WARNINGS**, and it resolved `publisher.@id` into the full Organization node, which exercises the `@id` linkage across the graph |
| 22 | Reconcile the audit records | C @ `465ffceb84` | **DONE 2026-08-21** | Doc-only, and proved so: `git diff --name-only d293ef6cfd 465ffceb84` returns three paths, all `.md`, **0 non-`.md`** — which is what lets Task 21's build and smoke stand for the branch. §11's status table re-swept, 9 rows moved; **every zero carries a positive control** — the same pattern against `production`'s copy of the same file returns 3, 6, 2 and 1 for rows 7, 9, 12 and 16, the counts those rows originally reported. Four narrative findings re-checked and annotated in place (§5k, §10a, §12 metadata, §12 structured data). `js-conventions.md` replaced by the unified version, byte-identical from `## Scope` down under an arrival banner. The "24 of 77" path figure **replaced rather than refreshed** — its extraction rule was never recorded, so the number is not reproducible; re-derived as 19 of 84 checkable, with the rule written into the banner. `npm run docs-check` still PASSES after the `CLAUDE.md` edits |

### Branch A verification that ran

Against the working tree at branch point `6a2101c19a`, on 2026-08-21:

- **Isolated `prod_prod` build**, the form CLAUDE.md documents as safe beside a live server:
  `HUGO_RESOURCEDIR="$SP/iso-resources" npx hugo --environment prod_prod -d "$SP/iso-docs-prod"`.
  Exit 0, 30.9 s, 1282 EN pages, **0 ERROR**, 1397 HTML files written. `git status --porcelain docs/`
  was empty afterward.
- **Sweeps over the generated HTML**, not over the template diff: doubled `data-toggle` 0,
  `<a …><li` 0, doubled `class` 0, logo-img-without-alt 0. Every probe was validated against the
  pre-change file at `HEAD` and fired there at exactly the expected count (6, 3, 9 and 0).
- **`npm run smoke`** returned `Smoke test PASSED — 33 pages clean`. Chris re-ran it himself on
  branch A on 2026-08-21 after the push and reported it green; that run was not observed here, so
  the commit it ran against is not recorded. It covers the shipping code regardless —
  `git diff --name-only cad179b26c ef6f37ac28` returns only this ledger file, so everything after
  the last task commit is documents-only.
- **axe-core 4.13** over the home page, `data-features/cooling-info/`, `data-features/nyccas/` and
  `data-stories/adult-lead/`, rules `image-alt, link-name, landmark-unique, list, listitem,
  aria-allowed-attr`: all zero except two pre-existing `link-name` violations recorded below. The
  harness was a scratch script, since deleted; building it properly belongs in Task 20.
- **Screenshot and geometry diffs** for Tasks 4 and 5, at desktop 1440×900 and mobile 390×844.

**Corrections to this plan's own premises, found while executing.** Each was wrong as written. The
fix was unaffected in every case, but the reason for it changed:

- *Task 4.* The plan says browsers "recover by restructuring the DOM". They do not, here — the parsed
  tree was `UL > A > LI`, exactly what the template said, and `.extensible-list li` is a descendant
  selector that matched either way. The real defect is that the `<ul>` had no `<li>` **children**.
- *Task 5.* Here the parser **does** restructure: the adoption agency algorithm split the crossed
  tags into **two** separate anchors to the home page. The fix genuinely goes 2 links to 1.
- *Task 7.* The line-based sweep returns 16 at `HEAD`; the true total is **15**, so Task 7 covered 14, not 15. `data-features/minimum-wage-with-maps.html:278` is a
  false positive of a line-based sweep — its tag spans lines and `alt="Table 1 (Table)"` sits on line
  280. The plan's own sweep inherited that error.
- *Task 8.* "Every one is the same shape" is wrong for 4 of the 19: `data-features/section.html:114`
  has an **empty** first `class`, `key-topics/single.html:191` has `link-track`, `index.html:165` is a
  `<button>`, and `partials/nr-chooser.html:9` is a `<div>` discarding `d-inline mr-1`.
- *Task 9.* Not a change at all — see the ledger row above.
- *Environment.* No hugo process was running when this work resumed, contradicting the environment
  note below. One was started for this work:
  `npx hugo serve --environment development --port 1313 --appendPort=false --baseURL "http://localhost:1313/dev-prod/"`.
  **It has since been stopped** — see the environment note below.

### Found while executing, not in this plan — three open items

> **These are tracked in [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §15**,
> which is their home once this ledger closes. Entries below are the record as found on 2026-08-21;
> §15 re-verified every `file:line` on 2026-08-22 and corrects three that moved.


1. **A second, unnamed link to the featured story on every home page load.**
   `themes/dohmh/layouts/index.html:62` opens an `<a>` whose `</a>` at `:92` sits outside the `<div>`s
   it opened, so the parser splits it in two exactly as in Task 5. axe reports `link-name` [serious]
   on the second, unnamed half. **Pre-existing, not caused by Branch A** — that anchor contains no
   `<img>`, and Branch A's `index.html` diff touches only lines 111, 165, 186, 204, 223 and 244.
2. **Three more doubled `class` attributes, in content rather than templates.**
   `class="tab-content" id="myTabContent" class="mb-4"` in `content/data-stories/housing/index.md:609`
   and its `.es.md:388` and `.zh.md:394` translations. Same defect as Task 8 but outside its stated
   scope of `themes/dohmh/layouts/`; the `mb-4` has never applied.
3. **`<hr>` and a bare `<a>All topics</a>` are still direct children of `<ul>`** in the four header
   menus Task 4 touched — the same invalid content model, on adjacent lines, not matched by Task 4's
   grep. Separately, `assets/js/main.js:193` and `assets/js/site.js:85` both bind `.lang-select`,
   which is the same doubled-handler shape Task 16 exists to investigate.

### Branch B verification that ran

Against `hotfix-audit-seo-meta`, cut from A's tip at `2b4abe82f2`, on 2026-08-21. Every build-visible
claim below was re-run on the final tree after the last edit, so all of it describes one state.

- **Three isolated builds**, the form CLAUDE.md documents as safe beside a server:
  `HUGO_RESOURCEDIR="$SP/iso-resources" npx hugo --environment <env> -d "$SP/iso-docs-<env>"`.
  `prod_prod` and `development` on the changed tree, plus a third of the pre-change tip as control.
  All exit 0, **0 ERROR**, 1397 HTML files each; `git status --porcelain docs/ resources/` empty
  afterward.
- **One Python walk per tree, not per-file greps.** The first attempt shelled out a `grep` per file
  per probe and was killed at 10 minutes — process creation under Git Bash on Windows makes that
  shape unusable at ~900 files x 3 trees. Reach for a single-pass script here, not a shell loop.
- **"Real pages" is 927 of the 1397 HTML files, and the distinction is load-bearing.** The excluded
  470 are Hugo's internal alias-redirect stubs plus static passthrough files. The alias stubs
  carry their own `noindex` **and** `lang="en"`, so a naive tree-wide count reports ~443 phantom
  failures of Tasks 10 and 12. **The marker matters as much as the count** — `head.html`'s viewport
  meta returns 928 because one `static/` file carries the identical tag, and a loose
  `name="viewport"` match returns 933 by picking up five more. Use `data-pagefind-meta="title:`.
  Rows written during Tasks 10–17 were measured with the loose marker and their denominators are
  corrected in place below; the numerators — the pages that actually carry each signal — were
  counted directly and did not change. See found-item 6.
- **`npm run smoke`** returned `Smoke test PASSED — 33 pages clean`, against a `dev_stage` server on
  :8080 started for this work and since stopped.
- **Browser, for Tasks 15 and 16 only.** `window.dataLayer` read directly, never through a `gtag`
  stub — the GA snippet redefines `gtag` after page scripts run, which cost a false negative on
  2026-08-15. In both tests the fingerprinted asset filename differed between the before and after
  reads, which is what rules out a cached-script reading.

**Corrections to this plan's own premises, found while executing.**

- *Task 11.* The plan says the template "currently emits nothing at all" under production. It is
  stronger than that: **no `robots.txt` is written at all**, so the path 404s rather than serving an
  empty body.
- *Task 14.* The plan cites `seo.html:10` for `og:url`; it was `:11`, and `:10` is `og:locale`. The
  other three line numbers were correct.
- *Task 16.* The plan allows for the doubling being unconfirmed, in which case "this task is a doc
  correction and ends here". It is not — both emitters fire, so it was a code change.
- *Environment.* No hugo process was running when this work started, and none is running now. A
  process count is not a usable "is a builder running" signal, but **not for the reason recorded
  here earlier** — "`npx hugo server` leaves two `hugo.exe` processes for one server" is wrong
  `[corrected 2026-08-21: one server owns exactly one `hugo.exe`; `Win32_Process` showed PID 17624
  running `node_modules/hugo-extended/vendor/hugo.exe` with the node shim as its parent, and
  `Get-NetTCPConnection -LocalPort 1313` named that same PID]`. Two processes meant two servers or
  a survivor from an earlier run, which is the real reason the count says nothing: it cannot
  distinguish those from each other. Read each process's `CommandLine` and check which PID owns the
  port.

### Found while executing Branch B, not in this plan — three open items

> **These are tracked in [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §15**,
> which is their home once this ledger closes. Entries below are the record as found on 2026-08-21;
> §15 re-verified every `file:line` on 2026-08-22 and corrects three that moved.


1. **`og:image` and `twitter:image` are still path-only.** `seo.html:13` uses `.RelPermalink`, `:20`
   uses `relURL`. The OGP sentence that justified the `og:url` change covers them equally, but Task
   14's stated scope named only `canonical` and `og:url`, so they were left alone.
2. **`og:locale` is hardcoded `en_us`** at `seo.html:8`, on all 927 real pages. Task 10 has just made
   `<html lang>` correct for the 102 `es`/`zh` pages, so those pages now assert two different
   languages in two places. The value is also `en_us`, where the spec's examples use `en_US`.
3. **A commented-out `console.log` sits above the gtag call** at `app.js:151`, and the orientation
   comment above the `#citeButton` block at `app.js:157-159` reads "how calculated" — copied from
   the block above it. The dead comment was renamed rather than deleted, to match its neighbours.

### Branch C verification that ran

Against `feature-audit-moderate`, cut from B's tip at `3cd323a44d`, on 2026-08-21.

- **Two isolated `prod_prod` builds** in the form CLAUDE.md documents as safe beside a server —
  `HUGO_RESOURCEDIR="$SP/iso-resources" npx hugo --environment prod_prod -d "$SP/iso-docs-<label>"` —
  one of the changed tree and one of the pre-change tip as control, the latter reached by
  `git stash push -- themes/`. Both exit 0, **0 ERROR**, 1397 HTML files each, and 933 by the loose viewport match then in use — 927 real pages by the corrected marker;
  `git status --porcelain docs/ resources/` empty afterward. The stash pop was checked byte-exact
  before continuing, not eyeballed.
- **One Python walk per tree**, per the Branch B finding — a `grep` per file per probe is unusable
  at ~900 files x 2 trees under Git Bash on Windows. The first attempt at this sweep still hit the
  2-minute tool timeout inside a Bash heredoc; running the same script from PowerShell finished it.
- **`npm run smoke`** returned `Smoke test PASSED — 33 pages clean`, against the `development`
  server described under environment state below. Run first after Task 17, the task that touches
  `baseof.html`, and **again after Task 21 at `d293ef6cfd`** — 33/33 both times.
- **The branch-closing `prod_prod` build is `d293ef6cfd`, not the branch tip.** It exited 0 with
  **0 ERROR** and 1397 HTML files. Task 22 (`465ffceb84`) is the only commit after it, and it is
  doc-only: `git diff --name-only d293ef6cfd 465ffceb84` returns three paths, all `.md`, 0
  non-`.md`. That is what lets a build of the earlier commit stand for the branch — state it as
  the fact about `d293ef6cfd` that it is, not as a fact about the tip.
- **Every browser claim on this branch has a control run behind it**, obtained with
  `git stash push -- themes/ content/` to put the tree back at the pre-change state, waiting for the
  dev server to rebuild, re-running the identical script, then `git stash pop`. Confirm the control
  really is the pre-change state before trusting it — `curl … | grep -c wireComboboxState` returning
  0 is the cheap check, and the pop was verified byte-exact each time. This is what separates "the
  probe reports the fixed value" from "the probe never ran": the Escape and outside-click readings
  are both plain `false`, and only one of them changes between control and after.

**Corrections to this plan's own premises, found while executing.**

- *Task 17, the four-surface sweep.* The plan's `for d in themes assets/js assets/scss content` loop
  returns 49/0/0/0 as written, but those four directories are not the whole repo: `git grep -l
  skip-header-target` with no pathspec returns **53** files. The other four are `documents/*.md` —
  this plan, the merge plan, the NR/DE integration plan and the site-wide audit. No code outside
  `themes/`, so the conclusion holds; the sweep as written is what does not prove it.
- *Task 17, why `list.html` is exempt.* The plan keeps the id in `baseof.html` and `list.html`
  without saying why the second one is not itself a duplicate. It is a **standalone document** —
  its own `<!DOCTYPE html>`, `<head>` and `<body>` — so it never renders inside `baseof.html` and
  needs its own target. The theme has exactly one `baseof.html`, and all 45 files the id was
  stripped from are `{{ define "main" }}` blocks that render inside it. That is what makes the strip
  safe, and it was checked per file rather than assumed.
- *Task 17, how many pages actually carried the duplicate.* **355** of 927 real pages, not most of
  them; the other 572 already had exactly one, from `baseof.html` alone. `_default/list.html`
  renders 510 of those pages, so its half of the `tabindex` edit is live rather than dead code.
- *Task 18, the target list is 8 files, not 5.* The plan names `data-features/aqe.html` and
  `data-features/hvi.html` as call sites. **Neither initializes flexdatalist.** Both only load the
  library and then a page-bundle script named in frontmatter (`customJS`), and the `.flexdatalist()`
  call lives in `content/data-features/neighborhood-air-quality/aqe.js:18` and
  `content/data-features/hvi/hvi.js:47`. So the two layouts get the partial include and the two
  **content** files get the `wireComboboxState()` call — files the plan does not list. That works
  because these are classic scripts sharing one global scope, the same property the data explorer
  relies on.
- *Task 18, the hardcoded results id.* The source hardcodes `flex_search-flexdatalist-results`. All
  five call sites here happen to author `id="flex_search"`, so the hardcode would in fact have
  worked; it is derived anyway as `input.id + '-results'`, which is what the library itself does
  (`jquery.flexdatalist.js:1572`). One shared partial that cannot be broken by renaming an input.
- *Task 18, one wrong line citation in the ported comment.* The source cites `:1551-1560` for the
  `<li>` creation that omits ids. In this tree's copy of the library it is **`:1507-1514`**. The
  other citations were re-checked and hold: `accessibility()` at `:474-482`, `aria-expanded`
  appearing exactly once in the file, `removed:flexdatalist.results` at `:1635`, the Escape handler
  at `:2046`, the outside-click handler at `:2027`, `searchDelay: 400` at `:115`. Both branches
  declare `jquery-flexdatalist ^2.3.0`, so this is a citation error, not a version difference.
- *Task 20, which way the NR block fails.* The plan says leaving it in means the config "either
  throws or silently lints nothing". It **throws**, and the mechanism is worth naming because it
  decides the fix: `scanDeclaredGlobals(NR_DIR)` runs at module evaluation, not at lint time, so
  `readdirSync("assets/js/nr-report")` raises `ENOENT` before ESLint reads a single file. Deleting
  the block is mandatory, not tidying — no `files:` glob could have made it inert.
- *Task 20, `docs-check` is not a no-op on arrival.* The plan says porting it "changes nothing until
  a doc opts in", which is true of the port and stops being true one step later: the same task opts
  `CLAUDE.md` in, and the first run failed it. Budget for the first opt-in finding something.
- *Task 21, the SearchAction has no target to point at.* The plan says to emit one "pointing at the
  Pagefind search URL". There is no such URL: search is a modal (`#searchModal`, `partials/footer.html`)
  and `/search-results/` is an orphan — zero inbound links in the repo, an empty `js_bot` block, and
  `?q=asthma` renders an empty title with all five result containers still `hidden` and **0** result
  links, against **5** links in the static fallback block on the same page as a control. Omitted, with
  the reason in the partial.
- *Task 21, the plan's proof would have passed the bug.* "The emitted JSON parses (`node -e` over the
  extracted block)" is satisfied by the pre-`safeJS` output, which was the whole document as a
  **quoted JSON string** — `json.loads` returns a `str` and raises nothing. Check the parsed value's
  *type*, not that parsing succeeded.
- *Task 21, no Organization `logo`.* The repo holds exactly one logo asset,
  `assets/images/nyc-bubble-logo.svg`, and the footer labels it "NYC Logo" and links it to nyc.gov —
  it is the City's, not the department's. Adding a DOHMH logo asset is what closes this.

### Task 19's measurements, and what the harness got wrong four times

**The rule set was derived from the compiled stylesheet, not from the plan's source lines.** The
plan names 17 candidate rules; `color: #008939` appears in **24** rules in the built CSS. The extra
seven are Bootstrap's generated `.btn-outline-primary` / `.btn-outline-hover` variants and the
`.text-primary` / `.text-hover` utilities, which come from the `$theme-colors` map rather than from
any line the plan lists.

**Eleven of the 24 render nowhere.** Seven are dead by any reading — `.btn-outline-hover`,
`.text-hover`, `.btn-outline-green`, `.sidebar-report` (two rules), `.indicator-anchor:hover
.indicator-short-name` and `.kt-accent i` appear in **zero** built pages and in zero files under
`themes/`, `content/`, `assets/js` or `static/` `[verified 2026-08-21, with pullquote/resource-card/
accordion-group as positive controls returning 3, 1 and 8 files]`. `.indicator-anchor` survives only
in `partials/nr-indicator-old.html`, which nothing includes. **Four of the plan's own 17 candidates
are among the dead** — `theme.scss:454`, `theme.scss:472`, `theme.scss:580` and `_custom.scss:104`
— so they cannot be measured and were not changed. The remaining four unrendered selectors are
`.btn-outline-primary` in its disabled state and `.related-reading .card-header`, whose classes do
render but whose specific instances did not appear in the crawled set.

**Result, thirteen rendered rules.** Control on the stashed pre-change tree, then the identical run:

| measurement | before | after | background | size/weight |
|---|---|---|---|---|
| `.btn-outline-primary` (normal) | **4.24 FAIL** | 5.13 PASS | `#EFFAF4` | 16px/700 |
| `.neighborhood-list-button` (normal) | **4.24 FAIL** | 5.13 PASS | `#EFFAF4` | 16px/700 |
| `a` (normal) | **4.45 FAIL** | 4.53 PASS | `#FDFDFD` | 14px/400 |
| `a:hover` (normal) | **4.45 FAIL** | 4.53 PASS | `#FDFDFD` | 14px/400 |
| `.accordion-group a[data-toggle]` (large) | 3.46 PASS | 4.19 PASS | `#E1E1E1` | 18.672px/700 |
| `.text-primary`, `.pullquote`, `.key-topics i`, `h1.report-title .sub-title`, both `.related-reading .card a` rules, both `.content-card … resource-card` rules | 4.53 PASS | 4.53 PASS | `#FFFFFF` | various |

Rules that already passed are recorded as passing rather than silently skipped, per the plan.

**Three rules changed, and only to `$primary-dark`:** `theme.scss` `a`, `_f-layout-elements.scss`
`$accordion-title-color`, `_custom.scss` `.neighborhood-list-button`. `.btn-outline-primary`'s 4.24
is on the same nodes, where `.neighborhood-list-button`'s `!important` wins the cascade, so those
buttons are fixed without touching the Bootstrap-generated rule — which would mean changing
`$primary` itself and is out of scope.

**Two findings the palette could not have produced.** The `a` failure is on `#FDFDFD`, a near-white
that is not one of the two greens `$primary-dark`'s own comment records — it is only reachable by
measuring. And the accordion's `#E1E1E1` header is the worst background on the site for this colour
at 3.46:1; it passes AA solely because 18.672px/700 is WCAG large text, where the threshold is 3:1.
`$primary-dark` takes it to 4.19:1, which still would not clear 4.5:1 — noted in a comment beside
the variable, because a restyle that drops that size or weight re-opens it.

**The harness was wrong four times, and each error changed the answer.** Worth reading before
writing the next one of these.

1. *`color:` is a substring of `background-color:`.* The first selector extraction returned 41
   rules; 17 of them set the background, not the text. A `background-color: #008939` count of 15
   as a separate control is what made the overlap visible.
2. *An element that inherits a colour need not paint any text.* The header logo `<a>` inherits
   `a { color: $primary }` and contains only an `<img>`, so it measured green-on-green at **1.00:1**
   — a headline-shaped number for a link that renders no text at all.
3. *The element a selector matches is often not the element that paints.* Requiring a direct text
   node then lost `.pullquote` (text in a `<figcaption>`) and both buttons (text in a `<span>`).
   Each match has to expand to itself **plus its descendants**, keeping whichever still compute to
   the colour.
4. *One worst case per rule compares the wrong number to the wrong threshold.* WCAG AA is 4.5:1 for
   normal text and 3:1 for large. Tracking a single worst case per rule reported the accordion as
   failing at 3.46:1 when its size and weight make 3:1 the applicable bar. Worst normal-size and
   worst large-text have to be tracked separately.

### Found while executing Branch C, not in this plan — six items, five still open

> **These are tracked in [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §15**,
> which is their home once this ledger closes. Entries below are the record as found on 2026-08-21;
> §15 re-verified every `file:line` on 2026-08-22 and corrects three that moved.


1. **The whole neighborhood picker on `data-features/aqe.html:21` is inside `aria-hidden="true"`,**
   wrapping the label text, the input, the Clear button and the "About NTAs" link. axe reports
   `aria-hidden-focus` [serious]. This is also **why aqe was the one page of five where axe reported
   no `aria-allowed-attr` before the fix** — axe skips hidden subtrees, so the wrapper concealed the
   defect rather than removing it. Task 18's wiring is in place there and becomes effective for
   assistive tech the moment the wrapper goes; removing it is a separate change with its own commit.
2. **Neither flexdatalist input has an accessible name on 3 of the 5 sites** — axe `label`
   [critical] ×2 (the authored `#flex_search` and the generated `#flex_search-flexdatalist`) on
   `data-explorer/indicator-catalog/`, `data-features/hvi/` and the NR topic landing pages. The NR
   section page escapes only because its input carries `placeholder="Search"`, which axe accepts as
   a last-resort name; aqe escapes only by being hidden per item 1. The source partial on
   `feature-MOD-Lab-NR-recode-refactor` fixes this with `aria-labelledby` at the call site, which is
   outside Task 18's stated scope of role, `aria-expanded` and `aria-activedescendant`.
3. **The fix trades one axe *violation* for one axe *incomplete*, while the list is open.** With
   `aria-controls` set, axe 4.13.0 parks `aria-valid-attr-value` [critical] in *incomplete* with
   "Unable to determine if aria-controls referenced ID exists on the page while using
   aria-haspopup" — a limitation of that rule, not a dangling reference: the id resolves and the
   list is in the DOM, both measured. With the list **closed** every page is clean, 0 violations and
   0 incomplete, which is what the add-and-remove-with-the-list design buys.
4. **`neighborhood-reports/` has its own `aria-hidden-focus` [serious]** on `.nr-clickable-uhf`,
   the Leaflet map's UHF shapes — pre-existing, unrelated to flexdatalist, and reported by axe both
   before and after.
5. **`npm run lint` is red on arrival: 33 `no-undef` errors over 5 undeclared names** —
   `indicators`, `selectedDisparity`, `xValue`, `yValue`, `comp_group_col`. Every one is assigned
   with no declarator (`comp_group_col = "Geography"` at `assets/js/data-explorer/trend.js:142`,
   and so on), and none is declared anywhere under `assets/`, `themes/` or `content/` — the one
   apparent declaration, `let indicators;` at `data-explorer/data-index.html:65`, is on a page that
   does not load `data.js`. So they are implicit globals, which is exactly what CLAUDE.md's data
   explorer section says not to create. **Confirmed in a browser, not inferred:** on
   `data-explorer/asthma/?id=2380`, `window.indicators` and `window.selectedDisparity` are own
   properties after load, and `window.comp_group_col` is `"Geography"` after `#display=trend`
   runs — against a control pair that discriminates, since `global.js`'s `let showMap` is correctly
   *absent* from `window` while `jQuery` is present. `xValue`/`yValue` live in `links.js`, whose
   view was not driven, so those two rest on the source reading alone. The fix is five declarations
   in `global.js` and is collision-free — `global.js` loads only from `data-explorer/single.html`
   (one grep hit repo-wide), and nothing reads any of the five through `window.`, so moving them to
   lexical bindings changes no reachable read. It is still a change to runtime JS on the explorer
   and wants its own task and its own smoke run, so Task 20 landed the guardrail red rather than
   widening into it.
6. **The "933 real pages" figure in `CLAUDE.md` is wrong, and so is the marker it recommends.**
   CLAUDE.md says a `prod_prod` build writes 1397 HTML files "of which 933 are pages", and names
   `head.html`'s viewport meta as the way to select them. Measured on the Task 21 build, all three
   numbers differ: `data-pagefind-meta="title:` — also emitted unconditionally by `head.html` —
   matches **927** files, and agrees with the `<script type="application/ld+json">` count on every
   one of the 1397 files, **0 disagreements**. The exact viewport string matches **928**: the extra
   file is `static/data-stories/cold/source/index.html`, a standalone static page that happens to
   contain the identical meta tag. A loose `name="viewport"` match returns **933** — the CLAUDE.md
   figure — picking up five more `static/` files with their own variants (three heat-report figure
   embeds, two HOLC maps). So 933 was taken with a looser pattern than the rule prescribes, and the
   real figure is 927. This matters beyond bookkeeping: several **DONE** rows on Branches B and C
   state their proofs as "N of 933", so their denominators wanted re-deriving. **Both closed in
   Task 22:** the CLAUDE.md rule now names 927, says the viewport meta is unsafe and why, and points
   at `data-pagefind-meta="title:`; the rows 13 and 17 denominators are corrected in place above,
   each keeping the original wording in a parenthetical so the change is legible. The numerators
   were counted directly and none moved.

### The exact next commands

All three branches are pushed and all three are in review — A as #1474 onto `production`, B as
#1475 onto A, C as #1476 onto B `[derived 2026-08-22]`. The worktree has **C** checked out. Derive
the git state rather than trusting this paragraph:

```bash
cd EH-dataportal.worktrees/merge/production   # has feature-audit-moderate checked out
git branch --show-current                     # expect feature-audit-moderate
git log --oneline 3cd323a44d..HEAD            # C's own commits; expect 7 task commits + 3 ledger
git status --porcelain                        # expect empty
git rev-list --left-right --count origin/feature-audit-moderate...HEAD   # 0 0 means pushed
gh pr view 1474 --json state,baseRefName,mergeable,reviewDecision   # A: OPEN / production / MERGEABLE
gh pr view 1475 --json state,baseRefName,mergeable,reviewDecision   # B: OPEN / hotfix-audit-markup-a11y / MERGEABLE
gh pr view 1476 --json state,baseRefName,mergeable,reviewDecision   # C: OPEN / hotfix-audit-seo-meta / MERGEABLE
```

**Nothing is owed on any of the three branches, and all 22 tasks have landed.** Branch C's own work
is `3cd323a44d..465ffceb84`, seven commits: Task 17 alone at `d057ea74ca` as the element-id rule
requires, then Tasks 18–22 one commit each, plus `74a11a51ef`, which belongs to no task. Three
ledger commits sit on top; `git diff --name-only 465ffceb84 71d84bbadf` returns two paths, both
under `documents/`, which is what keeps Task 21's build and smoke standing for the branch.

What is left is **review, then the serial merge below**. The **eleven found-items** recorded in this
document (3 on A, 3 on B, 5 on C) belong to no task and to no branch; they were moved to
[`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §15 at `6e8b52a52d` so they
outlive this ledger, and the copies below are the as-found record rather than the live backlog.

**The `hugo serve` on :1313 is still up** `[verified 2026-08-22: one `hugo.exe`, and
`Get-NetTCPConnection -LocalPort 1313` names it]`, and nothing outstanding needs it. Stop it by that
PID — see the environment note below for why `TaskStop` is not enough.

**Merge order stays serial: A, then B, then C.** Retarget each PR to `production` as its parent
merges, or merge them in order down the stack. If review changes A, rebase the stack rather than
merging down it:

```bash
git rebase --onto hotfix-audit-markup-a11y <old-A-tip> hotfix-audit-seo-meta
git rebase --onto hotfix-audit-seo-meta   <old-B-tip> feature-audit-moderate
```

**Both open questions were answered 2026-08-21 and are closed.** `content/resources/` **stays
`noindex` in production** — the section holds `health-code-reference` and `sugar-lookup`, and
keeping them out of the index is deliberate; the rationale is now a comment in `head.html` rather
than only here. And `click_how_caclulated` **was renamed**, accepting that the historical series
ends at the cutover.

**Environment state a cold session needs.** The work is planned from the
`EH-dataportal.worktrees/merge/production` worktree, which has `node_modules` installed; `production`
is checked out in the main repo directory (`Documents/DOHMH/Programming/EH-dataportal`).

**A `hugo serve` is running on :1313 and was started for the Branch C work** —
`npx hugo serve --environment development --port 1313 --appendPort=false --baseURL
"http://localhost:1313/dev-prod/"`, which is the same invocation Branch A used. Tasks 18 and 19 both
need a browser, so it is deliberately left up; **stop it when Branch C is done.** Nothing was running
before it `[verified 2026-08-21 from PowerShell: Get-Process -Name hugo returned nothing and ports
1313, 8080 and 8081 all failed to answer — those are the three scripts/dev-server.mjs probes. Check
this from PowerShell, not Bash — Git Bash rewrites the /fi in tasklist /fi into a path, so the
command errors and prints nothing, which reads as "no server running"]`. Before starting another,
**never start a second builder**; `scripts/dev-server.mjs` probes :8080, :8081 and :1313 and reuses
what it finds. `TaskStop` on the backgrounded command does not end the server — stop it
explicitly, by the PID that `Get-NetTCPConnection -LocalPort 1313` names. Don't go by a process
count: one server is one `hugo.exe`, so a count above one means a second server or a leftover, and
those are indistinguishable without reading each `CommandLine`.

**Execute these directly, not through subagents.** Every task here is grep- or lint-provable against
a standing harness; a subagent would re-derive the file list this document already holds.

---

## Branch A — shared shell and page templates

Markup and accessibility fixes. Every one lands in a partial or layout that renders on every page,
which is what sets the verification bar: `npm run smoke` (33 pages) is mandatory before merge, per
CLAUDE.md's rule for `header.html` / `footer.html` / `baseof.html`.

Branch name: `hotfix-audit-markup-a11y`.

### Task 1: Give the header logo an accessible name

**Files:** `themes/dohmh/layouts/partials/header.html:75` — the `<a href={{ relURL "" }}>` wrapping an
`<img>` of `7618350_heatmap_business_analytics_statistics_icon-gpr.ico`.

The `<img>` carries no `alt`, so the link that wraps it has no accessible name at all. Two axe rules
fire on it: `image-alt` (critical) and `link-name` (serious), on every page of the site —
[`nr-accessibility-audit-2026-08-10.md`](nr-accessibility-audit-2026-08-10.md) §3.

1. Add `alt="Environment & Health Data Portal home"` to the `<img>`. Not `alt=""` — the image is the
   only content of the link, so an empty alt leaves the link unnamed, which is the worse of the two
   failures.
2. Expected: the link's computed accessible name is that string, and both rules stop firing on it.

### Task 2: One `id="languages"`

**Files:** `themes/dohmh/layouts/partials/footer.html:9` and `:48` — two
`<div class="container py-3 …">`.

1. Read both. `:9` carries `d-none`, `:48` carries `d-print-none`; they are different elements, so
   this is a rename, not a deletion.
2. Rename one and update every reference. Element-id renames get their own commit (CLAUDE.md), and
   the grep is four-surfaced — JS, templates, SCSS, ARIA attributes:
   `grep -rn 'languages' assets/js assets/scss themes/`
3. Expected: `grep -c 'id="languages"' themes/dohmh/layouts/partials/footer.html` returns 1, and no
   reference points at a name that no longer exists.

### Task 3: Remove the duplicate `data-toggle`

**Files:** `themes/dohmh/layouts/partials/header.html:188`, `:244`, `:347` — each ends
`data-toggle="modal" data-target="#searchModal" title="Search" data-toggle="collapse">`.

HTML parsers keep the **first** attribute and drop the rest, so `modal` is what Bootstrap already
sees and deleting the trailing `data-toggle="collapse"` should be inert.

1. Delete the trailing `data-toggle="collapse"` on all three lines.
2. Expected: `grep -c 'data-toggle.*data-toggle' header.html` → 0.
3. "Should be inert" is a claim about a parser, not an observation: open the search modal from the
   desktop header, the mobile header and the third call site, and confirm each still opens.

### Task 4: `<a><li></li></a>` → `<li><a></a></li>`

**Files:** `themes/dohmh/layouts/partials/header.html:107`, `:110`, `:157`, `:266`, `:269`, `:316`.

An `<a>` may not contain an `<li>`; browsers recover by restructuring the DOM, which means the CSS
that styles these menus is matching against a tree that is not what the template says.

1. Invert each: the `<li>` becomes the outer element, the `<a>` the inner one, classes staying on the
   element they are on now.
2. Expected: `grep -cE '<a[^>]*>[[:space:]]*<li' header.html` → 0.
3. **This one can move pixels** — the recovered DOM and the corrected DOM are different trees. Take a
   before screenshot of the desktop menu, the mobile menu and the section menu, and diff after.

### Task 5: Un-cross the site title

**Files:** `themes/dohmh/layouts/partials/header.html:78-79`. The `<a>` opens inside
`<span class="site-subtitle">` and closes inside `<span class="site-title">`.

1. Restructure so the `<a>` wraps both spans. The visible text is "Environment & Health" + "Data
   Portal", one link to the home page, so wrapping both preserves the current behavior.
2. Expected: the spans and the anchor nest cleanly, and the title still reads as one link.
3. Same screenshot check as Task 4; these are adjacent lines and belong in one commit with it.

### Task 6: Label the navigation landmarks

**Files:** `themes/dohmh/layouts/partials/header.html:94` and `:253`,
`themes/dohmh/layouts/partials/footer.html:71`, `themes/dohmh/layouts/partials/header-ds.html:69`.

Each is `<nav … role="navigation">` with no accessible name, so a screen reader lists two or three
identical "navigation" landmarks per page (`landmark-unique`, moderate) —
[`nr-accessibility-audit-2026-08-10.md`](nr-accessibility-audit-2026-08-10.md) §3.

1. Add a distinguishing `aria-label` to each: the header pair by what they contain (they are the
   desktop and mobile renditions of the same menu — label by menu, not by viewport, since only one is
   in the tree at a time), the footer one "Footer", the data-stories one by its section.
2. `role="navigation"` on a `<nav>` is redundant; leave it rather than widen the diff.
3. Expected: on one page, every exposed navigation landmark has a distinct name.

### Task 7: `alt` on the 16 images that have none

**Files:** 16 `<img>` across 9 layouts — `index.html` ×5 (`:111`, `:186`, `:204`, `:223`, `:244`),
`data-features/cooling-info.html` ×4, and one each in `components.html`,
`data-features/minimum-wage-with-maps.html`, `data-features/rat-info-portal.html`,
`data-features/resourceportal.html`, `data-features/restaurant-grades.html`,
`partials/nyccas_pollutant_maps.html`. (`partials/header.html` holds the 16th; that is Task 1.)

The audit records this as the home page's card images (§14.2); the sweep found nine files
`[verified 2026-08-20: grep -rn "<img" themes/dohmh/layouts/ filtered to lines without alt=]`.

1. The five `index.html` card images are **decorative** — each sits in a card whose visible `<h3>`
   already names the destination, so `alt=""` is correct and descriptive text would double the
   announcement.
2. The other ten are not decided here. Open each and decide decorative (`alt=""`) or informative (a
   sentence naming what the image shows). Record the decision per file in the commit message; a wrong
   `alt` is harder to spot later than a missing one.
3. Expected: no `<img>` in `themes/dohmh/layouts/` lacks an `alt` attribute.

### Task 8: One `class` attribute per element

**Files:** 19 occurrences in 7 files — `data-stories/section.html` ×9, `data-features/section.html`
×3, `components.html` ×2, `key-topics/single.html` ×2, and one each in `about/section.html`,
`index.html`, `partials/nr-chooser.html`.

Every one is the same shape: `<a class="text-black" href="…" class="text-primary">`. The parser keeps
the first and discards the second, so these elements are `text-black` and the `text-primary` was
never applied. §14.1 describes it as a single instance; it is 19.

1. Merge each pair into one attribute — **and decide which classes survive**. Keeping both
   (`class="text-black text-primary"`) is a color change on 19 links, because `text-primary` was
   inert. Keeping only `text-black` is the no-op, and is the default here unless someone wants the
   green.
2. Expected: zero elements carrying two `class` attributes, and the rendered links look identical to
   before.

### Task 9: Keep dev tooling out of the production stylesheet

**Files:** `assets/scss/theme.scss:23` — `@import "g-dev-tools.scss";`, unconditional.

1. Read `assets/scss/_g-dev-tools.scss` first and record what it contains. If it is empty or inert,
   the finding is a doc correction, not a change — say so and close it.
2. If it carries real rules, gate the import on `hugo.Environment`. Hugo compiles the SCSS through
   `resources.ToCSS`, so the gate belongs where the partial is chosen, not inside the SCSS.
3. Expected: a `prod_prod` build's stylesheet does not contain the dev rules; a `development` build
   does. Diff the two generated CSS files rather than reading the template.

### Branch A verification

Cheapest-first, stopping at the first rung that would catch a break for this change:

1. Isolated build, so it cannot race the running server —
   `HUGO_RESOURCEDIR="$TEMP/iso-resources" hugo --environment prod_prod -d "$TEMP/iso-docs"`. Expect
   exit 0 and zero ERROR lines.
2. `grep` the generated HTML under `$TEMP/iso-docs` for each task's expected count. That is the
   evidence — not the template diff.
3. `npm run smoke` — expect `Smoke test PASSED — 33 pages clean`. A CORS error from `airnowapi.org`
   on `(home)` is external; re-run before diagnosing it.
4. Browser: the header/footer screenshot diffs Tasks 4–5 require, plus the modal clicks from Task 3.

---

## Branch B — SEO, metadata and analytics

Branch name: `hotfix-audit-seo-meta`.

### Task 10: Emit the page's real language

**Files:** `themes/dohmh/layouts/_default/baseof.html:2` and
`themes/dohmh/layouts/_default/list.html:2` — both `<html lang="en" dir="ltr">`.

Fourteen translated pages (7 `.es`, 7 `.zh`) ship `lang="en"`, contradicting the `hreflang` alternates
emitted a few lines later in `head.html`, which get each page's language right.

1. Replace with `<html lang="{{ .Language.Lang }}" dir="ltr">` in both files.
2. Expected: in a built site, the `.es` output carries `lang="es"`, the `.zh` output `lang="zh"`, and
   English pages are unchanged. Grep all three from `$TEMP/iso-docs`, not one page.

### Task 11: A production `robots.txt` with a body

**Files:** `themes/dohmh/layouts/robots.txt` — currently emits nothing at all under `production` and
`prod_prod`, so no `Sitemap:` directive reaches any crawler.

This is a **file copy, not a rewrite**: the NR retirement work already wrote the version to use, with
its allow-all decision and rationale in comments.

1. `git show feature-MOD-Lab-NR-recode-refactor:themes/dohmh/layouts/robots.txt > themes/dohmh/layouts/robots.txt`
2. Read the result. It inverts the environment condition (production gets the body, previews get the
   blanket `Disallow`), and adds `User-agent: *` / `Disallow:` plus
   `Sitemap: {{ "sitemap.xml" | absURL }}`.
3. Expected: `$TEMP/iso-docs/robots.txt` under `prod_prod` contains a fully-qualified `Sitemap:` line;
   a `development` build still emits the per-page `Disallow` list and **no** `Sitemap:` line. Build
   both and read both — the whole point of this file is that it differs by environment.

### Task 12: One computed `robots` meta

**Files:** `themes/dohmh/layouts/partials/head.html:18`, `:27`, `:43`.

Line 18 (`content="all"`) or line 27 (`noindex, nofollow`) fires from the environment branch, and line
43 adds a second, unconditional `noindex` for `.Section == "resources"`. On a production build of a
`resources` page, two robots metas ship on one response. The most restrictive is understood to win
[Google's robots-meta documentation, as cited in site-wide audit §12 — re-check the source and record
the date before relying on it], but the stacking is fragile.

1. Compute one value and emit one tag.
2. **Do not change the `resources` behavior in this task.** `content/resources/` holds
   `health-code-reference` and `sugar-lookup`, which look like public tools, and they are `noindex` in
   every environment while still appearing in `sitemap.xml`. Whether that is deliberate is a question
   for the team; record it and leave the behavior as-is.
3. Expected: exactly one `<meta name="robots">` per built page, counted across the whole
   `$TEMP/iso-docs` tree rather than on one page.

### Task 13: Put the site name in `<title>`

**Files:** `themes/dohmh/layouts/partials/head.html:64-66`.

`og:title` and `twitter:title` both append `" – {{ .Site.Title }}"` (`seo.html:12`, `:20`); the
`<title>` that becomes the browser tab and the search result does not.

1. Append the same suffix inside the `title` block.
2. Expected: every built page's `<title>` ends in the site title — and the home page does not read as
   the title twice. Check that page specifically.

### Task 14: Vestigial metas out, URLs absolute

**Files:** `themes/dohmh/layouts/partials/seo.html:3`, `:4`, `:8`, `:10`.

1. Delete `<meta name="geo.region" content="" />` (`:4`) and
   `<meta property="fb:profile_id" content="0" />` (`:8`) — both are placeholders, and `geo.*` has no
   ranking role to preserve.
2. `:3` `<link rel="canonical" href="{{ .RelPermalink }}">` and `:10`
   `<meta property="og:url" content="{{ .RelPermalink }}">` both emit a path, not a full URL. **This
   is not from the audits — it was found 2026-08-20 while checking §12, and the `og:url` half is
   unverified:** confirm against the Open Graph specification (ogp.me) that `og:url` requires an
   absolute URL before changing it, and record the retrieval date.
3. If confirmed, switch both to `.Permalink`.
4. Expected: a built page's canonical and `og:url` carry the full `https://…` URL, and no page emits
   `geo.region` or `fb:profile_id`.

### Task 15: The misspelled analytics event

**Files:** `assets/js/data-explorer/app.js:151-152` — `gtag('event', 'click_how_caclulated')`, bound
to `#howCalcButton`, which exists at `themes/dohmh/layouts/data-explorer/single.html:813`. So unlike
the branch where §11 row 12 was closed, **this handler fires**.

1. A decision before an edit: renaming a GA4 event starts a new series and orphans the history under
   the old name. Ask before renaming, and if it is renamed, record the cutover date where the
   analytics inventory lives.
2. If renamed: `click_how_calculated`, matching the snake_case convention the other four custom events
   use.
3. Expected: no occurrence of `caclulated` under `assets/` or `themes/`, and the button still fires an
   event — read `window.dataLayer` to confirm. **Stubbing `window.gtag` does not work:** the GA
   snippet redefines it after page scripts run, so a stub records zero and reads as "never fired".
   That cost a false negative on 2026-08-15.

### Task 16: Confirm, then fix, the doubled `click_subscribe`

**Files:** `assets/js/main.js:14` (`gtag('event', 'click_subscribe', …)`) and `assets/js/site.js:99`
(`sendAnalyticsEvent("click_subscribe", …)`).

Both call sites exist. Whether both fire on one click was never verified in a browser — §11 row 3 says
so explicitly.

1. **Evidence first, no code.** Click the subscribe control with `window.dataLayer` under observation
   and count `click_subscribe` entries. If one fires, this task is a doc correction and ends here.
2. If two fire, delete the one whose file does not own the control, and re-count.
3. Expected: exactly one `click_subscribe` per click, with the counts from before and after recorded.

### Branch B verification

Build under **both** `prod_prod` and `development` into temp directories and grep the generated HTML —
Tasks 11 and 12 are environment-branched, so a single-environment check cannot see them. Then
`npm run smoke`, then the two `dataLayer` reads for Tasks 15–16. No screenshot pass: nothing in this
branch changes layout.

---

## Branch C — the moderate items

Branch name: `feature-audit-moderate`. Five independent tasks; each gets its own commit, and Task 17
must not share one (element-id changes, per CLAUDE.md).

### Task 17: De-duplicate `#skip-header-target`

**Files:** `themes/dohmh/layouts/_default/baseof.html` (the canonical declaration, on `<main>`) plus
the id's other declarations. **The "49 layout files carry it" figure written here on 2026-08-20 was
wrong in a way that matters** `[re-derived 2026-08-21 on Branch B's tip]`: 49 files *mention*
`skip-header-target`, but only **47 declare the id**. The other two are `partials/header.html:2` and
`partials/header-ds.html:2`, which carry the skip *link* — `href="#skip-header-target"`. Dropping
anything from those two breaks the link this task exists to fix.

```bash
git grep -l 'id="skip-header-target"' -- themes/          # 47 — the edit set
git grep -n 'href="#skip-header-target"' -- themes/       # 2 — do not touch
for d in themes assets/js assets/scss content; do echo "$d $(git grep -l skip-header-target -- $d | wc -l)"; done
```

That last sweep returns `themes 49`, and **0 for `assets/js`, `assets/scss` and `content`**
`[verified 2026-08-21]`, so step 3's four-surface grep resolves to templates only. Neither
`baseof.html:22` nor `list.html:27` carries `tabindex="-1"` yet, so step 2 is fully outstanding.

The keyboard skip link's target is declared on `<main>` and again inside it on most pages. The DE
branch fixed it in the form to copy: the id was dropped from the templates that duplicated it, and
`tabindex="-1"` was added to the `<main>` in `baseof.html` and `list.html` so the skip link actually
moves focus rather than only scrolling.

1. Read the DE branch's `baseof.html` before starting — its count was 44 files, this tree's is 49, so
   derive the list from this tree's own grep, not from that commit.
2. Drop the id everywhere except `baseof.html` / `list.html`; add `tabindex="-1"` to the `<main>` in
   both.
3. Grep all four surfaces for the id, not just templates: JS, SCSS, templates, ARIA attributes.
4. Expected: one declaration per built page, and pressing the skip link moves **focus** into `<main>`.
   Check focus, not scroll position — those are different outcomes and only one of them is the fix.

### Task 18: Port the flexdatalist combobox fix

**Files, source:** `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html` on
`feature-MOD-Lab-NR-recode-refactor` — `wireComboboxState(input)` at `:80`, called from
`loadNeighborhoodSearch()` at `:61`.
**Files, targets (5):** `themes/dohmh/layouts/partials/de-text-search.html:47`,
`themes/dohmh/layouts/data-features/aqe.html`, `themes/dohmh/layouts/data-features/hvi.html`,
`themes/dohmh/layouts/neighborhood-reports/section.html:76`,
`themes/dohmh/layouts/neighborhood-reports/topiclanding.html`.

The library puts `aria-autocomplete`, `aria-owns` and a **static** `aria-expanded="false"` on a plain
textbox with no `role="combobox"` — axe `aria-allowed-attr` (critical), and worse, the attribute reads
false while the listbox is open. Site-wide §5k scopes this at three pages because it was written
against a tree where the two NR call sites were already fixed; **on this tree the fix is absent
entirely** — `wireComboboxState` appears nowhere under `themes/`.

1. Extract `wireComboboxState` into a new shared partial rather than pasting it five times —
   `themes/dohmh/layouts/partials/flexdatalist-combobox-js.html` — and include it from each call site.
2. Carry across the two things the source encodes, rather than rediscovering them: it reads state
   through a `MutationObserver` and not from library events, because only `results.remove()` fires
   `removed:flexdatalist.results` — Escape and outside-click remove the container silently; and the
   generated `<li>`s need ids for `aria-activedescendant` to point at.
3. Expected, per call site: `role="combobox"` present; `aria-expanded` flips `false → true` on typing;
   `aria-activedescendant` follows the highlight and resolves to a real id; `false` again after Escape
   and after an outside click. **Sample twice around Escape** — at ~60 ms and again at ~600 ms. A
   single read cannot separate a stale attribute from a listbox that genuinely reopened, which is a
   defect that was found exactly that way.

### Task 19: The `$primary`-as-text contrast sweep

**Files:** 17 candidate rules — `theme.scss:35, 344, 349, 409, 454, 472, 580, 816, 819, 826, 858`;
`_custom.scss:104, 159`; `_f-layout-elements.scss:774` (`$accordion-title-color`);
`__portal-custom.scss:201, 204, 1297` (hardcoded `#008939`; the audit cites `:1283`, which has moved).

`$primary` `#008939` is 4.53:1 on pure white and below 4.5:1 on every tinted background the palette
defines. `$primary-dark: #007a31` is already in the tree (`_a-global-variables.scss:92`) and used by
exactly two rules. §10a is explicit that the rest are **candidates, not findings**.

1. For each of the 17, find the background it actually renders on and compute the ratio from
   `getComputedStyle` on a live node — not from the palette, and not from an axe count.
   `color-contrast` lands in axe's *incomplete* bucket whenever it cannot resolve a background, so its
   violation count is a floor, not a census.
2. Switch only the rules that measure below 4.5:1, and only to `$primary-dark`. `$primary` stays the
   brand color for fills, borders and map geometry.
3. **Reading a computed style immediately after a hover measures the transition, not the hover
   state** — Bootstrap transitions over .15s. Wait ~500 ms.
4. Expected: a table of all 17 with before/after ratios and the background each was measured against,
   in the commit message. Rules that already pass are recorded as passing, not silently skipped —
   that record is what stops the next person re-deriving it.

### Task 20: Port the guardrails

**Files:** new `eslint.config.mjs` (from `feature-MOD-Lab-NR-recode-refactor`), new
`scripts/docs-check.mjs` (same), and the `scripts` block of `package.json`.

This tree runs `smoke` and `characterize:cp` only. The dev dependencies are already installed —
`eslint ^10.7.0`, `globals ^17.7.0`, `axe-core`, `playwright` are all in `devDependencies` — so this
is config and scripts, not an install.

1. Copy `eslint.config.mjs` and **delete its NR block**: it scans `assets/js/nr-report`, which does
   not exist here. Leaving it in means the config either throws or silently lints nothing.
2. Copy `scripts/docs-check.mjs`. It is opt-in — a doc is checked only if it declares
   `<!-- docs-check source-roots: … -->` — so porting it changes nothing until a doc opts in. Opt in
   `CLAUDE.md` first: it makes more path claims than any audit doc, and a root `layouts/` path that
   never existed survived in it for months.
3. Add `"lint": "eslint assets/js/data-explorer"` and `"docs-check": "node scripts/docs-check.mjs"`.
4. Expected: `npm run lint` exits 0 — or names real `no-undef` hits, which is the point. This is the
   check that catches the failure a Hugo build cannot: these are classic `<script>` tags sharing one
   global scope, so a bad name throws at load while the build stays green.

### Task 21: Add JSON-LD

**Files:** a new `themes/dohmh/layouts/partials/structured-data.html`, included from
`themes/dohmh/layouts/partials/head.html`.

The theme emits zero JSON-LD, Microdata or `itemtype` anywhere (§12).

1. Emit `Organization` (DOHMH — name, url, logo, `sameAs` from `data/globals/social`), `WebSite` (with
   a `SearchAction` pointing at the Pagefind search URL), and `BreadcrumbList` where the page
   hierarchy exists.
2. **`Dataset` is deliberately out of scope here.** The audit calls it the highest-value item, and it
   is: it is also the one that needs indicator metadata at build time, which the explorer currently
   fetches at runtime. Scoping that needs its own pass; do not half-build it.
3. Expected: the emitted JSON parses (`node -e` over the extracted block), and Google's Rich Results
   Test accepts each type. Record the date of that check — it is an external tool whose behavior is
   not re-derivable from this repo.
   > **Amended 2026-08-22, after running it:** "accepts each type" was the wrong expectation. The
   > Rich Results Test reports only types it has a rich-result treatment for, so `Organization` and
   > a `SearchAction`-less `WebSite` come back as "No items detected" no matter how well-formed
   > they are. `BreadcrumbList` is the only one of the three it scores. Use `validator.schema.org`
   > for the other two, and pair any null with a control submission that does report, or a failed
   > submission and an unsupported type are indistinguishable in the output.

### Task 22: Reconcile the audit records

Doc-only, and it goes last so it can describe what actually landed.

1. Update the §11 status table in [`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) —
   it was swept against `production` on 2026-08-12, and every row this plan touches moves.
2. Port the unified `js-conventions.md` from `feature-MOD-Lab-NR-recode-refactor` (14,642 bytes,
   "Browser-Side JS") over this tree's older Data-Explorer-only copy (7,355 bytes). It needs one edit
   on arrival: it exempts `assets/js/data-explorer-old/` "on `feature-new-data-explorer`", a path this
   tree does not have.
3. The audit's banner says 24 of the 77 repo paths it cites do not exist on `production`. That count
   is from 2026-08-12 and this tree has moved since; re-run the existence check before repeating the
   number, or drop it.
4. Expected: no status line in the audit contradicts the repo, and every number in the banner was
   re-derived rather than copied.

### Branch C verification

Per task, because they share no surface: `npm run lint` for 20; browser ARIA reads for 18;
`getComputedStyle` measurements for 19; focus (not scroll) for 17; a JSON parse plus the Rich Results
Test for 21. Then `npm run smoke` once for the branch — 17 touches `baseof.html`, which is the rule's
trigger.

---

## Task 0: Merge `upgrade-GHA-dependencies`

Its own branch, already written, **1 commit ahead of `production` and 0 behind** as of 2026-08-20. It
adds the missing `permissions:` blocks to the four hugo-build workflows and bumps `actions/checkout`,
`actions/setup-node`, `peaceiris/actions-gh-pages` and `peaceiris/actions-hugo`.

It merges cleanly after #1473 without a rebase: `merge/production` changes nothing under `.github/`
`[verified 2026-08-20: git diff --name-only production merge/production -- .github/ returned nothing]`.

Two things it does **not** do, both from site-wide §11 row 2, both optional follow-ons:

- Actions are pinned by tag, not by commit SHA. Invoke the `hardening-github-actions` skill before
  doing this — that skill owns the convention.
- `github/codeql-action` is still at `v2` in `codeql.yml`. Check whether v2 is still supported before
  treating that as a finding: it is a claim about GitHub's support policy, so it needs a source and a
  date, not a recollection.

---

## Re-running this

Every "open" claim here is one command against a clean tree. To re-derive the list rather than trust
it: `git rev-parse HEAD` first, then the per-task greps quoted in each task, then compare counts. A
result in this document is a fact about `a67f957ba7`; any of them can be closed by a commit that lands
before the work starts.
