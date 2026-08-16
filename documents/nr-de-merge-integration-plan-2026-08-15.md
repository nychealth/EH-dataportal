# Merging `production` / `merge/production` into the two feature branches

<!-- Deliberately does NOT declare a `docs-check source-roots` comment. This plan cites paths that
     exist on `merge/production` but not on this branch (themes/dohmh/layouts/nr-output/single.html,
     assets/js/uhflist.js) — that is the point of the document, and docs-check would fail it for
     naming them. Do not opt this file in. -->

**Goal:** Bring `merge/production` into `feature-MOD-Lab-NR-recode-refactor` and
`feature-new-data-explorer` without losing either branch's work, and without shipping the two
silent breakages this analysis found.

**Approach:** `merge/production` strictly contains `production`, so the choice is not *whether* to
absorb it but *when*. NR goes straight to `merge/production` (its `production`-only merge is nine
docs-and-config files with no code in it, and doing both means resolving eight of them twice). DE
takes `production` first — its `production` merge has twelve real code conflicts worth landing and
testing before the `head.html` gating refactor arrives on top of them.

**The two findings that drive the plan.** Both merge *clean* — git flags neither:

1. `merge/production` deletes `head.html`'s blanket library block. The NR branch's four
   `neighborhood-reports/` templates reference no `lib-*` partial, and three of the four don't
   exist on `merge/production`, so they merge with no conflict and load no Leaflet, no Vega and no
   Arquero.
2. The NR branch's `head.html` *generates* the `neighborhoods` global from
   `data/globals/uhflist.json` at build time. That generator sits inside the block
   `merge/production` deletes, and `assets/js/uhflist.js` — which `lib-uhflist.html` loads instead
   — does not exist on the NR branch. `demographics.js` guards with
   `typeof neighborhoods === 'undefined'`, so losing it blanks the demographics sidebar silently
   rather than erroring.

---

## Ledger

**Status as of 2026-08-15: nothing started. All stages not started. `rerere.enabled=true` is set
(shared repo config, applies in every worktree).**

| Stage | Task | Status |
|---|---|---|
| A | A1 shared-infra conflicts | Not started |
| A | A2 retired-file modify/deletes | Not started |
| A | A3 `head.html` — uhflist generator + gating | Not started |
| A | A4 `lib-*` includes for the four NR templates | Not started |
| A | A5 SCSS: `theme.scss`, `_custom.scss` | Not started |
| A | A6 duplicate comparison implementation — decision | Not started |
| A | A7 NR verification sweep | Not started |
| B | B1 DE ← `production` | Not started |
| B | B2 DE verification sweep | Not started |
| C | C1 DE ← `merge/production` | Not started |
| C | C2 DE gating reconciliation | Not started |
| C | C3 DE verification sweep | Not started |

Update the row **in the commit that finishes the task**, not at the end of a session. Record the
proof that actually ran in the house form — `[verified <date>: how]` — naming the command, its
flags, and the numbers that came back. If a prescribed check turns out not to work in this repo,
correct the step here and say why, rather than silently substituting another.

---

## Global constraints

These apply to every task below.

- **Never run two Hugo builders against this tree at once.** A static build beside a running dev
  server poisons the shared `resources/_gen` fingerprint cache and every fingerprinted asset 404s
  under the other environment's prefix. The safe static build is the isolated form in the
  Commands appendix.
- **PowerShell eats the `--` in `npm run <script> -- --flag`.** Every characterization command in
  this plan is written as the underlying `node` invocation for that reason. Do not "fix" them back
  to the npm forwarding form.
- **Nothing commits without Chris's say-so, and he raises committing.** Each task below ends at a
  verified working tree, not at a commit. Do not draft commit messages until asked.
- **`rerere` covers exactly one file across these merges** — `scripts/dev-server.mjs`, the only
  shared-infra file byte-identical between the two branches
  `[verified 2026-08-15: git rev-parse of all nine shared-infra paths on both branches]`. Do not
  plan around it replaying anything else.
- Resolve conflicts in a scratch worktree first where a task says so. Nothing lands on
  `feature-MOD-Lab-NR-recode-refactor` or `feature-new-data-explorer` until its stage verifies.

---

## Stage A — `feature-MOD-Lab-NR-recode-refactor` ← `merge/production`

22 conflicted files `[verified 2026-08-15: git merge-tree --write-tree --name-only]`. Start the
merge once, then work the tasks in order against the conflicted tree.

```
git switch feature-MOD-Lab-NR-recode-refactor
git merge --no-commit --no-ff merge/production
```

Expect it to stop with 22 conflicts. Do not `git merge --abort` between tasks — the tasks share
one conflicted working tree.

### Task A1: Shared-infrastructure conflicts

**Files:**
- Modify: `.claude/settings.json` (add/add)
- Modify: `.gitignore` (content)
- Modify: `CLAUDE.md` (add/add)
- Modify: `documents/js-conventions.md` (add/add)
- Modify: `documents/site-wide-audit-2026-06-27.md` (add/add)
- Modify: `package.json` (content)
- Modify: `package-lock.json` (content)
- Modify: `scripts/dev-server.mjs` (add/add — rerere may replay this one)
- Modify: `scripts/smoke-pages.mjs` (add/add)

**Depends on:** nothing.
**Leaves for:** A7, which runs `npm run smoke` and `npm run lint` — both read `package.json`'s
script block and `eslint.config.mjs`'s file arguments, so the merged `package.json` must retain
every `scripts` entry from both sides.

- [ ] **Step 1: Union the two `scripts` blocks in `package.json`.**

The NR branch owns `characterize:nr`, `a11y:nr`, `characterize:pagefind`, `characterize:de`,
`docs-check`. `merge/production` adds its own. Take both; there is no overlap in names to
arbitrate. Confirm with:

```
node -e "console.log(Object.keys(require('./package.json').scripts).sort().join('\n'))"
```

Expected: every script named in `CLAUDE.md`'s Guardrails section is present.

- [ ] **Step 2: Regenerate `package-lock.json` rather than hand-merging it.**

```
git checkout --ours package-lock.json
npm install --package-lock-only
git add package-lock.json
```

Expected: `npm install --package-lock-only` exits 0 and rewrites the lock to match the unioned
`package.json`. Hand-resolving a 790-line lockfile conflict is the failure mode this avoids.

- [ ] **Step 3: `documents/site-wide-audit-2026-06-27.md` — keep the NR branch's copy.**

CLAUDE.md names this the active findings log for this branch (§5f–§5j). `merge/production` deletes
719 lines of it from a different lineage.

```
git checkout --ours documents/site-wide-audit-2026-06-27.md
git add documents/site-wide-audit-2026-06-27.md
```

Then read `§5f–§5j` and confirm those five findings are still present:

```
grep -nE '^#+ *5[fghij]' documents/site-wide-audit-2026-06-27.md
```

Expected: five headings. If fewer, `--ours` picked the wrong side — stop and re-check.

- [ ] **Step 4: `CLAUDE.md`, `documents/js-conventions.md`, `.claude/settings.json`, `.gitignore`
      — union by hand.**

These are prose and config; both sides added real content. For `CLAUDE.md` specifically, the NR
branch's copy is the one that documents the current NR architecture — keep all of it, and fold in
`merge/production`'s additions that describe things the merge is bringing in (the `lib-*` partials
model). Do not resolve `CLAUDE.md` by taking one side wholesale.

`CLAUDE.md` carries a `docs-check verified: <commit> <date>` stamp. Leave it stale for now; A7
re-stamps it after the prose has been re-read against the merged tree.

- [ ] **Step 5: `scripts/smoke-pages.mjs` — union the `PAGES` list.**

Both sides added page entries. The merged list must include one entry per template kind on the
merged branch. Check the NR page kinds specifically survive:

```
grep -nE 'neighborhood-reports' scripts/smoke-pages.mjs
```

Expected: at least one report-page URL, one neighborhood-index URL, one topic-index URL. A7
depends on these being present — a smoke run that doesn't load the NR pages cannot catch the
Task A3/A4 breakages.

---

### Task A2: Retired-file modify/deletes

**Files (all resolve as delete):**
- Delete: `themes/dohmh/layouts/nr-output/section.html`
- Delete: `themes/dohmh/layouts/nr-output/single.html`
- Delete: `themes/dohmh/layouts/neighborhood-reports/topiclanding.html`
- Delete: `themes/dohmh/layouts/partials/nr-clickable-uhf.html`
- Delete: `themes/dohmh/layouts/partials/nr-indicator-new.html`
- Delete: `themes/dohmh/layouts/partials/nr-indicator-old.html`
- Delete: `themes/dohmh/layouts/partials/nr-map-highlight.html`
- Delete: `themes/dohmh/layouts/partials/nr-show-zips.html`
- Delete: `assets/js/uhflist.json`

**Depends on:** nothing.
**Leaves for:** A3, which must *not* reintroduce `assets/js/uhflist.js`/`.json` — the merged branch
generates `neighborhoods` from `data/globals/uhflist.json` instead.

- [ ] **Step 1: Confirm each file is genuinely retired before deleting.**

Everything in this list was removed by the Option D swap. Before `git rm`, confirm nothing on the
NR branch still references it:

```
git grep -nE 'nr-clickable-uhf|nr-indicator-new|nr-indicator-old|nr-map-highlight|nr-show-zips|topiclanding|nr-output' -- themes/ assets/ content/ config/
```

Expected: no hits outside comments and this plan. A hit in a live template means the retirement is
incomplete and the delete is wrong — stop and report.

- [ ] **Step 2: Delete them.**

```
git rm themes/dohmh/layouts/nr-output/section.html \
       themes/dohmh/layouts/nr-output/single.html \
       themes/dohmh/layouts/neighborhood-reports/topiclanding.html \
       themes/dohmh/layouts/partials/nr-clickable-uhf.html \
       themes/dohmh/layouts/partials/nr-indicator-new.html \
       themes/dohmh/layouts/partials/nr-indicator-old.html \
       themes/dohmh/layouts/partials/nr-map-highlight.html \
       themes/dohmh/layouts/partials/nr-show-zips.html \
       assets/js/uhflist.json
```

- [ ] **Step 3: Confirm the one name-correction carried in `assets/js/uhflist.json` is not lost.**

`hotfix-geo-names` changed exactly one value there: `"Crotona -Tremont"` → `"Crotona - Tremont"`.
The NR branch already made the same correction independently in `data/globals/uhflist.json`.

```
grep -c 'Crotona - Tremont' data/globals/uhflist.json
```

Expected: `2` (the `UHF_name` and the `namezip` field)
`[verified 2026-08-15: count on all four branches — NR data/globals=2, merge/production
assets/js=2, production assets/js=0]`.

If this returns 0, the delete *did* lose the fix and it must be applied to
`data/globals/uhflist.json` by hand before continuing.

---

### Task A3: `head.html` — preserve the uhflist generator through the gating change

This is the load-bearing conflict. Resolving it by taking either side wholesale breaks the branch.

**Files:**
- Modify: `themes/dohmh/layouts/partials/head.html` (NR 306 lines, `merge/production` 191,
  `production` 280)
- Create: `themes/dohmh/layouts/partials/lib-uhflist.html` — replacing `merge/production`'s
  version, which loads a file this branch does not have

**Depends on:** A2 (which deletes `assets/js/uhflist.json`).
**Leaves for:** A4, which adds `{{- partial "lib-uhflist.html" . }}` to NR templates and therefore
requires this partial to work without `assets/js/uhflist.js`. Produces the global
`neighborhoods` — an array of rows from `data/globals/uhflist.json`, each carrying `UHF_id` and
`UHF_name`, read by `demographics.js` (`neighborhoods.filter(n => n.UHF_id == geocode)`) and by
`featureDisplayName` in `global.js` (`neighborhoods.find(n => n.UHF_name === displayName)`).

- [ ] **Step 1: Take `merge/production`'s `head.html` as the base, then re-add the NR generator.**

The gating model is the direction of travel; the NR branch's blanket block is what's being
retired. But the NR branch's `head.html` carries one block that is *not* part of the blanket
library block and must survive — the build-time `neighborhoods` generator, currently at
`themes/dohmh/layouts/partials/head.html:176-184`, identified by the comment "Generated from
data/globals/uhflist.json, which is the single source of truth".

```
git show feature-MOD-Lab-NR-recode-refactor:themes/dohmh/layouts/partials/head.html | sed -n '174,186p'
```

Read it, then resolve `head.html` to `merge/production`'s version with that block **removed** — it
moves to `lib-uhflist.html` in Step 2, so it is not lost, it is relocated.

- [ ] **Step 2: Rewrite `lib-uhflist.html` to generate from `data/globals/uhflist.json`.**

`merge/production`'s version loads `resources.Get "js/uhflist.js"`, which does not exist on this
branch — a nil resource into `short-fingerprint.html` fails the build. Replace its entire contents
with the NR branch's generator:

```gotemplate
{{- /*  UHF42 neighborhood list (defines the global `neighborhoods`).
        Generated from data/globals/uhflist.json rather than loaded from assets/js/uhflist.js,
        which this branch retired — the JSON is the single source of truth for the 42
        neighborhoods and their names, and the content adapter reads the same file.  */}}

{{- $uhflist_js := printf "var neighborhoods = %s" (jsonify site.Data.globals.uhflist) | resources.FromString "js/uhflist-data.js" | partial "short-fingerprint.html" -}}
<script type="text/javascript" src="{{ $uhflist_js.RelPermalink }}" integrity="{{ $uhflist_js.Data.Integrity }}"></script>
```

- [ ] **Step 3: Fix the stale comment in `nr-leaflet.html`.**

`themes/dohmh/layouts/partials/nr-leaflet.html:340` reads "'neighborhoods' is a variable set in
uhflist.js". After Step 2 it is set in `lib-uhflist.html` from `data/globals/uhflist.json`. Update
the comment to say so. A comment naming a file that no longer exists is what sends the next
reader looking for `assets/js/uhflist.js`.

- [ ] **Step 4: Prove the generator survived — build, then assert the global is emitted.**

Isolated static build (exact form in the Commands appendix). Then, against the built output:

```
grep -l 'var neighborhoods' "$TMP/nr-merge-build/js/"*.js
```

Expected: exactly one generated `uhflist-data.<hash>.js` containing `var neighborhoods = [`. Zero
files means the generator was dropped in Step 1 and the demographics sidebar will silently blank —
`demographics.js` guards on `typeof neighborhoods === 'undefined'` and clears rather than throwing,
so nothing downstream will tell you.

---

### Task A4: Give the four NR templates their library includes

**Files:**
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-report.html` (js_bot block, near the
  `$nrGlobal`/`$nrUrl` resource declarations around line 290)
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-neighborhood-index.html` (which includes
  `nr-leaflet` at line 37)
- Modify: `themes/dohmh/layouts/neighborhood-reports/nr-topic-index.html` (which includes
  `nr-neighborhood-picker` at line 64)
- Modify: `themes/dohmh/layouts/neighborhood-reports/section.html` (which includes
  `nr-neighborhood-picker` at line 71 and `overlap-tool` at 119)

**Depends on:** A3 (`lib-uhflist.html` must generate rather than load).
**Consumes:** `lib-leaflet.html`, `lib-vega.html`, `lib-arquero.html`, `lib-uhflist.html` — all
present on `merge/production`, the last rewritten by A3.
**Leaves for:** A7's smoke and characterization runs, which are what prove the includes are right.

Library needs, derived from the globals each page's JS actually calls
`[verified 2026-08-15: git grep for the library globals across assets/js/nr-report/ and the four
templates]`:

| Template | leaflet | uhflist | vega | arquero | d3 | datatables |
|---|---|---|---|---|---|---|
| `nr-report.html` | yes (`map.js`, `L.`) | yes (`demographics.js`, `global.js`) | yes (`chart.js`, `vegaEmbed`) | yes (`app.js`, `chart.js`, `data.js` — `aq.not`, `aq.escape`, `aq.loadJSON`, `aq.desc`) | no | no |
| `nr-neighborhood-index.html` | yes (`nr-leaflet`) | yes (`nr-leaflet` reads `neighborhoods`) | no | no | no | no |
| `nr-topic-index.html` | yes (picker's map) | yes | no | no | no | no |
| `section.html` | yes (picker's map) | yes | no | no | no | no |

`d3` and `datatables` are in no column: `git grep 'd3\.'` and `git grep 'DataTable'` across
`assets/js/nr-report/` both return zero files. Do not add them "to be safe" — the whole point of
the gating refactor is that pages load only what they use.

The QR code library needs no `lib-*` partial. `nr-report.html` already mounts it itself from
`node_modules/qrcode-generator/dist/qrcode.js` at line 361, deliberately, because the template
owns both the `#qrcode` element and the resource.

- [ ] **Step 1: Add includes to `nr-report.html`.**

In the `js_bot` block, **before** the `assets/js/nr-report/` script tags — the report modules call
these libraries at load, so the libraries must be parsed first, the same ordering constraint the
QR library already has:

```gotemplate
{{- partial "lib-leaflet.html" . }}
{{- partial "lib-uhflist.html" . }}
{{- partial "lib-vega.html" . }}
{{- partial "lib-arquero.html" . }}
```

- [ ] **Step 2: Add includes to the three picker/map pages.**

Same block position in each of `nr-neighborhood-index.html`, `nr-topic-index.html`,
`section.html`:

```gotemplate
{{- partial "lib-leaflet.html" . }}
{{- partial "lib-uhflist.html" . }}
```

For `nr-topic-index.html` and `section.html` these go **before** the existing
`{{ partial "nr-neighborhood-picker-js" . }}` call — the picker's JS wires the combobox against a
map that Leaflet must already have built.

- [ ] **Step 3: Sweep for any NR template left without includes.**

One labelled sweep across every candidate, rather than four separate greps whose empty results are
easy to misattribute:

```
for f in themes/dohmh/layouts/neighborhood-reports/*.html; do
  printf '%-64s %s\n' "$f" "$(grep -c 'partial "lib-' "$f")"
done
```

Expected, in the glob's alphabetical order:

```
nr-neighborhood-index.html   2
nr-report.html               4
nr-topic-index.html          2
section.html                 2
```

All four read `0` before this task `[verified 2026-08-15: the same sweep on the unmerged branch]`,
which is the breakage this task exists to fix. A zero remaining anywhere afterwards is a page that
will load no libraries.

---

### Task A5: SCSS — `theme.scss` and `_custom.scss`

**Files:**
- Modify: `assets/scss/theme.scss` (content conflict)
- Modify: `assets/scss/_custom.scss` (content conflict)

**Depends on:** nothing.
**Leaves for:** A7's print check, which reads `.print-only` and the `@media print` rules, and A7's
`.nr-report-accordion` scope check.

- [ ] **Step 1: Preserve the `.nr-report-accordion` scope.**

`_custom.scss` gained the report page's CSS on 2026-08-15 under a "Neighborhood Reports report
page" heading. Three of those rules are scoped to `.nr-report-accordion` and the scope is
load-bearing: unscoped, `.card-header` repaints every card header on the site
`[verified 2026-08-15: 8 headers on /data-features/realtime-air-quality/ went #EFFAF4 → white with
the scope removed, and back with it restored]`. Whatever the merge produces, the scope must
survive.

```
grep -n 'nr-report-accordion' assets/scss/_custom.scss
```

Expected: at least three occurrences.

- [ ] **Step 2: Union `theme.scss`'s import list.**

`merge/production` changed 71 lines of `theme.scss` and the NR branch has its own `@media print`
block hiding `.report-section .collapse` and `.collapsing`. Both must survive. Confirm after
resolving:

```
grep -nE 'report-section|collapsing' assets/scss/theme.scss
```

Expected: the print block intact — panels never print, whatever the reader expanded.

- [ ] **Step 3: Check for a `.comp-*` / `.worse|.middle|.better` collision.**

`merge/production` ports NR comparison markers to Font Awesome too (commit `4dcbe069ec`). The NR
branch already did this in `_custom.scss` (`.comp-good` `\f14a`, `.comp-bad` `\f071`) and
`theme.scss` (`.worse` `\f071`, `.better` `\f14a`). Two independent implementations of the same
thing will not conflict textually if they landed in different rule blocks.

```
grep -rn 'f14a\|f071' assets/scss/
```

Expected: each codepoint defined once per class. A duplicate definition of the same class is the
tell that both implementations survived — resolve to the NR branch's, which is the one its JS
emits classes for.

---

### Task A6: The duplicate comparison implementation — decision required

**Files:**
- Evaluate: `themes/dohmh/layouts/partials/nr-comparison-label.html` (arrives from
  `merge/production`, absent on this branch)
- Evaluate: `themes/dohmh/layouts/partials/nr-tertile-inline-label.html` (same)
- Compare against: `assets/js/nr-report/tertiles.js` (`getTertileSentenceParts`,
  `getTertileInlineLabel`, `getTertileSentence`, `getComparison`)

**Depends on:** A2, A5.
**Leaves for:** A7. Whichever survives, exactly one implementation may emit comparison markup.

These two partials are **not** in the conflict list — they are new files on `merge/production` and
absent here, so they arrive as clean additions. `merge/production` renders the borough/citywide
comparison at build time in Hugo (commit `d021d753e3`); this branch renders it at runtime in JS.
Both survive a merge silently.

- [ ] **Step 1: Establish whether anything on the merged branch calls them.**

```
git grep -n 'nr-comparison-label\|nr-tertile-inline-label' -- themes/
```

The templates that called them (`nr-indicator-new.html`, `nr-output/single.html`) are deleted by
A2. If this returns only the partial files themselves, they are orphaned.

- [ ] **Step 2: Delete the orphans, or stop and report.**

If Step 1 shows no callers:

```
git rm themes/dohmh/layouts/partials/nr-comparison-label.html \
       themes/dohmh/layouts/partials/nr-tertile-inline-label.html
```

If Step 1 shows a live caller, **stop and report** rather than choosing. Build-time versus runtime
comparison rendering is a design decision with consequences for the print rendition and the
accessibility tree, and it is Chris's call, not the implementer's.

---

### Task A7: NR verification sweep

**Files:** none modified. This task runs checks.

**Depends on:** A1–A6.

Climb only as far as the change requires — but this change genuinely can break at runtime, in CSS,
and in the search index, so it needs the top of the ladder.

- [ ] **Step 1: Lint — proves no undefined names across the NR global scope.**

```
npm run lint
```

Expected: zero errors. Positive control, because a green run proves nothing on its own — add a
call to a name declared in another file of `assets/js/nr-report/`, confirm lint still passes, then
remove it. That is what proves the directory scan loaded.

- [ ] **Step 2: Build — proves the templates compile and `lib-uhflist.html` resolves.**

Isolated build (Commands appendix). Expected: exit 0. A nil-resource failure here is
`lib-uhflist.html` still pointing at `assets/js/uhflist.js` — go back to A3 Step 2.

- [ ] **Step 3: Smoke — proves the library includes actually landed.**

```
npm run smoke
```

Expected: zero non-allowlisted console errors. **This is the check that catches Task A4 failing.**
A missing include shows as `L is not defined`, `vegaEmbed is not defined` or `aq is not defined`
on the NR page kinds. Note the generic `Failed to load resource` allowlist entry hides the *cause*
of blocked-script failures — if you see a bare `X is not defined`, diagnose with a separate
unfiltered probe rather than trusting the allowlisted output.

- [ ] **Step 4: NR characterization — proves the rendered report is unchanged.**

```
node scripts/nr-characterization.mjs --check
```

Expected: zero diffs across three topic/neighborhood pairs. Written as the `node` form on purpose;
the npm forwarding form loses the flag under PowerShell.

**Read the diff before re-baselining, never instead.** `--baseline` cannot fail — it records
whatever it finds, including three empty pages if the merge broke rendering.

The harness files baselines per EHDP-data branch and the dev server it spawns is `dev_stage`, so
this checks against `scripts/nr-characterization-baseline/staging/`.

- [ ] **Step 5: Demographics sidebar — the specific thing A3 protects.**

The characterization harness captures the neighborhood header and ZIP list but the demographics
sidebar blanking is exactly the failure that guard hides. Check it directly in the browser:

Navigate to a report page and read the sidebar's metric rows. Expected: populated values, not
empty cells. An empty sidebar with no console error is the A3 failure mode.

- [ ] **Step 6: Pagefind — proves the search index did not shift.**

```
node scripts/pagefind-characterization.mjs --check
```

Expected: zero diffs, and the inverted control asserting the report page is *not* indexed still
passing. The merge touches `head.html` and shared partials, which is exactly this harness's
trigger condition.

- [ ] **Step 7: Print rendition — nothing below a browser proves this.**

Emulate print media and read `document.body.innerText`, which respects `display:none`. Expected:
one shape regardless of what is expanded, the print-only rows present, the QR code present.

- [ ] **Step 8: Accessibility audit — instrument, not gate.**

```
npm run a11y:nr
```

Read `wcag.incompleteIds` in the per-page JSON, not only `wcag.violations` — `color-contrast` sits
in the deferred bucket on all four pages, so a zero there is a floor, not a census. Compare
against the triage in `documents/nr-accessibility-audit-2026-08-10.md`; new findings are a
regression signal, not a new backlog.

- [ ] **Step 9: Re-stamp `CLAUDE.md`.**

Re-read the NR sections against the merged tree — the `head.html` and `lib-*` changes make several
paragraphs describing the library model false. Update the prose, then update the
`docs-check verified: <commit> <date>` stamp. Bumping the stamp without re-reading is a false
claim, not bookkeeping.

```
npm run docs-check
```

Expected: exit 0.

---

## Stage B — `feature-new-data-explorer` ← `production`

21 conflicted files `[verified 2026-08-15: git merge-tree --write-tree --name-only]`. Nine are the
same shared-infra set as A1; twelve are DE-specific.

### Task B1: DE ← `production`

**Files:**
- The nine shared-infra files from A1 (resolve the same way; only `scripts/dev-server.mjs` will
  replay from rerere)
- Modify: `assets/js/data-explorer/table.js` — 9 hunks, 256 conflicted lines of 1073
- Modify: `assets/js/data-explorer/global.js` — 1 hunk, 169 of 947
- Modify: `assets/js/data-explorer/app.js` — 1 hunk, 162 of 801
- Modify: `assets/js/data-explorer/data.js` — 1 hunk, 66 of 920
- Modify: `themes/dohmh/layouts/data-explorer/single.html` — 1 hunk, 1109 of 1236
- Modify: `themes/dohmh/layouts/data-explorer/data-index.html` — 14 lines
- Modify: `themes/dohmh/layouts/data-explorer/indicator-catalog.html` — 10 lines
- Modify: `themes/dohmh/layouts/data-explorer/section.html` — 12 lines
- Modify: `themes/dohmh/layouts/data-stories/single.html` — 23 lines
- Modify: `themes/dohmh/layouts/partials/heat-report-correction.html` — 99 of 192
- Modify: `content/data-explorer/carbon-monoxide-poisoning.md` — 2 hunks, 27 of 85
- Modify: `content/data-explorer/childhood-lead-exposure.md` — 5 of 66
- Delete: `assets/scss/_custom.scss` (modify/delete — see Step 3)

**Depends on:** nothing. Independent of Stage A.
**Leaves for:** C1, whose merge-base becomes `production`'s tip
`[verified 2026-08-15: git merge-base of a simulated merge commit against merge/production returned
f2d04146b1, identical to git rev-parse production]`.

Resolve by taking the DE version and re-applying production's changes, which are seven named
commits totalling +217/−98 across these paths — against the DE branch's +10,812/−7,206. You are
porting seven small changes into a rewrite, not reconciling two large files.

- [ ] **Step 1: Read production's seven commits before resolving anything.**

```
git log --oneline --no-merges $(git merge-base production feature-new-data-explorer)..production -- assets/js/data-explorer/ themes/dohmh/layouts/data-explorer/ themes/dohmh/layouts/data-stories/single.html themes/dohmh/layouts/partials/heat-report-correction.html content/data-explorer/
```

Expected, in order:

```
4a3185e056  replacing exotic unicode with regular unicode
dd16987cad  correcting extraneous double spaces
c03635c51e  Add Arquero script to data index, indicator catalog, and de section page
05db5fd1cc  don't render vertical bar on last 311 item
a0ce013172  Defer Datawrapper embeds in hidden tabs until their tab is shown
4c06062296  neighborhood gouping by borough - toggleable
3eec76d023  change sort column, and prep for adding sort column name
```

For each, decide: still applies to the rewritten explorer, or superseded. Record the decision per
commit in the ledger — the next session cannot re-derive it.

- [ ] **Step 2: `table.js` — the one real merge.**

Both sides have borough-grouping code: 35 references on the DE branch, 33 on production
`[verified 2026-08-15: git grep -c -i borough on both]`. Determine first whether these are the same
feature arrived at twice or two different behaviors, by reading `4c06062296`'s diff against the DE
branch's implementation:

```
git show 4c06062296 -- assets/js/data-explorer/table.js
```

If the DE branch already implements the toggle, take the DE side for all 9 hunks and record that
`4c06062296` is superseded. If it does not, port the toggle. Do not merge hunk-by-hunk without
answering this — nine independent hunk decisions on one feature is how half a feature lands.

- [ ] **Step 3: `_custom.scss` — resolve the modify/delete deliberately.**

The DE branch split `_custom.scss` into `__portal-custom.scss` + `_de-custom.scss`. Git followed
the rename into `__portal-custom.scss` *and left production's `_custom.scss` in the tree*. Commit
as-is and the branch ships both.

```
git rm assets/scss/_custom.scss
grep -n 'custom' assets/scss/theme.scss
```

Expected after: `theme.scss` imports `__portal-custom` and `_de-custom`, and no import of
`_custom`. Then confirm production's 2-line change to `_custom.scss` landed in its new home —
`git show $(git merge-base production feature-new-data-explorer)..production -- assets/scss/_custom.scss`
shows what to look for.

- [ ] **Step 4: `single.html` — a large conflict block with a small decision.**

1109 of 1236 lines conflict, but production changed only 22 lines of this file while the DE branch
moved 1406 lines out of it. Take the DE version, then check whether production's 22 lines
(from `c03635c51e`, the Arquero include) are still needed — the DE branch has its own `lib-*`
partials, so this may already be solved.

```
git show c03635c51e -- themes/dohmh/layouts/data-explorer/single.html
git grep -n 'lib-arquero' feature-new-data-explorer -- themes/dohmh/layouts/data-explorer/
```

If the DE branch already includes `lib-arquero.html`, record `c03635c51e` as superseded.

### Task B2: DE verification sweep

**Depends on:** B1.

- [ ] **Step 1:** `npm run lint` — zero errors, with the same positive control as A7 Step 1
      (call a name declared in another file of `assets/js/data-explorer/`).
- [ ] **Step 2:** Isolated build — exit 0.
- [ ] **Step 3:** `npm run smoke` — zero non-allowlisted console errors.
- [ ] **Step 4:** `node scripts/pagefind-characterization.mjs --check` — zero diffs.
- [ ] **Step 5:** Browser check of the data explorer: load a topic page, switch geography, confirm
      the table, map and trend chart render. **`npm run characterize:de` is non-functional on this
      branch** — it was written against a different explorer and waits on DOM this branch never
      produces. Do not read its failure as a regression signal, and do not use it as this step's
      proof.

---

## Stage C — `feature-new-data-explorer` ← `merge/production`

36 conflicted files `[verified 2026-08-15: git merge-tree --write-tree --name-only]`, of which 21
are Stage B's set. The +15: `disparities.js`, `map.js`, `print.js`, `trend.js` (one line each),
`config/dev_stage/config.toml`, five `data-features` templates (`fvi`, `minimum-wage-with-maps`,
`rats-in-your-neighborhood`, `realtime`, `rmz`), and four `nr-*` partials.

**Run Stage C only after Stage B has verified.** Its merge-base is `production`'s tip, so none of
Stage B's resolutions are re-presented.

### Task C1: DE ← `merge/production`

**Depends on:** B2 verified.

- [ ] **Step 1: The four `nr-*` partials resolve differently here than in Stage A.**

Unlike the NR branch, the DE branch still *has* `nr-clickable-uhf.html`, `nr-indicator-new.html`,
`nr-map-highlight.html`, `nr-show-zips.html` — these are content conflicts, not modify/deletes.
Take `merge/production`'s side: the DE branch has no NR work of its own, and these files are on
their way to being retired by Stage A anyway.

- [ ] **Step 2: The five `data-features` templates are two versions of the same refactor.**

`merge/production` adds `lib-*` includes; the DE branch already has its own. Reconcile so each
template includes exactly the libraries it uses, with no duplicate include. Sweep after:

```
for f in themes/dohmh/layouts/data-features/*.html; do
  d=$(grep -o 'partial "lib-[a-z-]*' "$f" | sort | uniq -d)
  [ -n "$d" ] && printf '%-58s DUPLICATE: %s\n' "$f" "$d"
done
```

Expected: no output. Any line printed is a template including the same library twice.

- [ ] **Step 3: `config/dev_stage/config.toml`.**

A one-line conflict. Confirm `data_branch = "staging"` survives — the characterization harnesses
read the served branch to pick a baseline directory, and a wrong value files results against the
wrong baseline.

### Task C2: DE gating reconciliation

**Depends on:** C1.

- [ ] **Step 1: `head.html` sweep.**

DE's `head.html` is 211 lines, `merge/production`'s 191, production's 280 — the two are close
because both did this refactor. After resolving, confirm no library block remains in `head.html`:

```
grep -inE 'leaflet|vega|arquero|d3|datatables|uhflist' themes/dohmh/layouts/partials/head.html
```

Expected: no hits. `merge/production`'s `head.html` returns zero here
`[verified 2026-08-15]`.

- [ ] **Step 2: Every page template includes what it uses.**

One labelled sweep, per the audit rule — derive the candidate list from the template directory,
not from what has already been flagged:

```
for f in $(git ls-files 'themes/dohmh/layouts/**/*.html' | grep -vE 'partials/|shortcodes/'); do
  printf '%-72s %s\n' "$f" "$(grep -c 'partial "lib-' "$f")"
done
```

Read the zero rows and confirm each is a page that genuinely uses no library. This is the sweep
that would have caught the NR breakage in Stage A.

### Task C3: DE verification sweep

**Depends on:** C2. Same five steps as B2, plus:

- [ ] **Step 6:** `npm run smoke` is the gate for the gating refactor across every page kind, not
      just the explorer. Before relying on it, confirm the five `data-features` templates touched
      in C1 Step 2 have entries in `PAGES` in `scripts/smoke-pages.mjs` — those comments are claims
      that rot like doc prose, and a page kind absent from `PAGES` is not covered.

---

## Commands appendix

**Isolated static build** — safe beside a running dev server, because the poisoning hazard is
`resources/_gen` and `HUGO_RESOURCEDIR` moves it:

```
HUGO_RESOURCEDIR="$TEMP/hugo-res-$$" npx hugo --environment production -d "$TEMP/hugo-out-$$"
```

Expected: exit 0. The isolation is proven by `resources/` being untouched, not by the page count —
a full production build processing 172 images left zero files under `resources/` modified, and the
server on :8080 served a page 200 immediately after
`[verified 2026-08-09: project-isolated-hugo-build memory, EH-dataportal store]`.

**Leave `cacheDir` shared** — do not add `--cacheDir`. It keys `getresource` by URL and the two
environments read different `data_repo` URLs, so there is no collision; isolating it only buys a
~33s cold fetch.

**Check whether a server is actually holding :8080 before reaching for this at all.** With nothing
running, `ensureDevServer()` spawns its own `dev_stage` server on :8080 — which is the environment
the NR baseline was captured under, so the harnesses just work with no workaround. A process list
is a point-in-time observation; re-probe before acting on one from several turns ago.

**Characterization harnesses** — always the `node` form under PowerShell:

```
node scripts/nr-characterization.mjs --check
node scripts/nr-characterization.mjs --baseline     # only after reading a --check diff
node scripts/pagefind-characterization.mjs --check
```

**Dry-run any merge without touching a working tree:**

```
git merge-tree --write-tree --name-only <branch-a> <branch-b>
```

Exit 1 means conflicts; the first output line is a real tree oid you can `git cat-file -p <oid>:<path>`
to inspect the merged content, including conflict markers.

**Abort and restart a stage:**

```
git merge --abort
```

rerere keeps its recordings, so a restart replays what you already resolved in that merge.

---

## Self-review

**Spec coverage.** Every conflicted file from both dry-runs is assigned to a task: NR's 22 across
A1 (9), A2 (9), A3 (1), A5 (2), plus `neighborhood-reports/section.html` in A4 — 22. DE's 21 in
B1, and the +15 in C1/C2. The two clean-merge breakages have dedicated tasks (A3, A4) and dedicated
proofs (A7 Steps 3, 4, 5).

**Placeholder scan.** No "TBD", no "handle edge cases", no "similar to Task N". A6 Step 2 and B1
Step 2 stop and escalate rather than deferring — both are decisions with consequences outside the
merge, and naming who decides is not a placeholder.

**Name consistency.** `lib-uhflist.html` is created in A3 Step 2 and consumed in A4 Steps 1–2 under
that exact name. The global it defines is `neighborhoods` throughout — matching
`demographics.js`'s `neighborhoods.filter(n => n.UHF_id == geocode)` and `global.js`'s
`neighborhoods.find(n => n.UHF_name === displayName)`. `getTertileSentenceParts`,
`getTertileInlineLabel`, `getTertileSentence` and `getComparison` in A6 match `tertiles.js`.

**One gap, stated rather than papered over.** Whether `4c06062296` (borough grouping) is already
implemented on the DE branch is not resolved here — B1 Step 2 makes answering it the first action,
because the answer changes whether `table.js` is a short resolution or a feature port, and it
cannot be answered without reading both implementations.
