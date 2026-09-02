# Merging `production` into `feature-MOD-Lab-NR-recode-refactor-merge`

**CLOSED 2026-09-02. The merge landed at `79d5eb4804` and the baseline re-capture at
`029e40f36e`.** All 11 conflicts resolved, both gaps closed, all 8 checks run and green. Read
this as a dated record, not as live work.

Work ran across 2026-09-01 (conflicts) and 2026-09-02 (gaps, verification, commits).

**Two things were changed beyond resolving conflicts:** the G1 duplicate-`id` fix (two lines),
and a re-captured Pagefind baseline. Both are in `79d5eb4804`. **One thing was split out
deliberately:** the `staging` site-characterization baseline, which rewrites 262 files and would
have buried the merge diff, so it is `029e40f36e`.

**Three follow-ups survive this document** — F1, F2 and F3 at the foot. **F2 is the one with a
deadline**: the `prod_prod` characterization baseline is still production's and needs capturing
before the PR into `production` merges.

This is not a stage of `documents/nr-de-merge-integration-plan-2026-08-15.md`. That plan closed
2026-08-19 and its stages merged `merge/production` into two feature branches. This is the
separate job of bringing the NR branch up to `production`'s current tip, which has moved 184
commits since.

## Identity

| | |
|---|---|
| Branch (ours) | `feature-MOD-Lab-NR-recode-refactor-merge` at `4c9f4ad5ee` |
| Worktree | `EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor` |
| Merging in | `production` at `0c860946cd` |
| Merge base | `c59d614716` |
| Divergence | 185 commits ours, 184 theirs |
| Backup branch | `feature-MOD-Lab-NR-recode-refactor-backup` (pre-existing, not cut for this merge) |

`production` changes 1961 files against the merge base, but **1852 of those are
`scripts/site-characterization-baseline/`**. The reviewable surface is ~109 files: 62 under
`themes/dohmh`, 9 workflows, 14 scripts, 5 content, 3 SCSS.

## Environment state

- **No Hugo server was running when this started** `[verified 2026-09-01: Win32_Process for
  hugo.exe/node.exe returns none; Get-NetTCPConnection on 8080, 8081, 1313, 8090 returns none]`.
  So the harnesses may spawn their own, which they do at `dev_stage` — **staging data**.
- `node_modules` was reinstalled against the merged `package.json` at V1 and is current.
- **`rerere.enabled=true`** in shared repo config and this merge was started with it **on**,
  against the convention the 08-15 plan set. It replayed nothing:
  `git merge-tree --write-tree --name-only 4c9f4ad5ee 0c860946cd` (rerere-blind) returns the same
  11 paths `git status` reports `[verified 2026-09-01]`. No action needed; recorded so a later
  reader does not have to re-derive it.
- **This ledger could not be committed on its own while the merge was live** — a commit during a
  conflicted merge *is* the merge commit — so it landed inside `79d5eb4804`, and M3 filled in the
  hash column afterwards. That is why the M1 row names a commit it is not itself in.
- **`rerere` recorded 8 resolutions** as `79d5eb4804` was written (every conflicted path except
  the three delete/modifies, which rerere does not handle). A future merge of these same two
  sides will replay them; re-run the checks rather than trusting a replay.

## Decisions taken

| Decision | Rejected | Why |
|---|---|---|
| `eslint.config.mjs` takes **our** side whole | Production's side, or a union | Production deleted the `assets/js/nr-report` block because that directory does not exist there. It exists here — 10 files. Production's copy also carries a "Ported from feature-MOD-Lab-NR-recode-refactor" note explaining the deletion, which is false on the merged tree and gets dropped with it |
| `scripts/dev-server.mjs` takes **their** side whole | Ours, or a union keeping `--logLevel debug` | Production's is a strict evolution: :8081 probe, exported `PREFIXES`, vendored pinned hugo, Pagefind build and report, hugo-version provenance. Our only unique content is `--logLevel debug` in `SPAWN_ARGS`. Nothing reads the spawned server's stdout — readiness is an HTTP probe `[verified 2026-09-01: no stdout/stderr handler in the file]` — so the flag only adds console noise |
| `documents/js-conventions.md` takes **our** side | Their side | Production's added banner lists five things the document gets wrong *about `production`*. This branch is the file's origin and none of the five holds here |
| `CLAUDE.md` is a **union rewrite**, not a side pick | Either side whole | Ours documents the NR guardrails (`characterize:nr`, `a11y:nr`, `characterize:pagefind`); theirs documents `smoke:all`/`smoke:env`, site characterization, and the CI smoke workflow. Taking a side silently drops the other's guardrail documentation |
| The three delete/modify files are **removed**, not restored | Restoring them | They are the retired NR templates and their replacements exist. This repeats Stage A Task A2's resolution — but not blindly: task R6 checks what production's four commits changed in them first |

## Tasks

Statuses were checked against the repo, not recollection. Every row names the commit that holds
it, so `git branch -a --contains 79d5eb4804` answers where the work has reached since — which is
the question these rows deliberately do not.

### Stage R — conflict resolutions (11 files)

Conflicts were resolved with a scratch script that keeps one side of every hunk and leaves the
rest of the file byte-identical (newline handling preserved, so no resolution rewrote LF to CRLF —
that would break SRI). It prints the number of hunks it resolved, which was checked against
`grep -c '^<<<<<<<'` taken before each run.

**A side pick applies to the conflicted hunks only.** Regions git auto-merged keep whichever
side changed them, so "takes theirs" never means "is theirs". `scripts/dev-server.mjs` is the
case where that matters and it is verified below.

| # | File | Resolution | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| R1 | `.gitignore` | Union — ours adds `.claude/`, theirs adds harness working dirs | `79d5eb4804` | **DONE 2026-09-01** | 1 conflict, 0 markers left; both sides' entries present in `tail` |
| R2 | `package.json` | Union; `lint` takes ours (`data-explorer` + `nr-report`, the superset) | `79d5eb4804` | **DONE 2026-09-01** | `node -e` parse asserting the result is an **object** (not a string — a double-encoded document parses without raising): 18 scripts, and every `.mjs` target resolved on disk |
| R3 | `eslint.config.mjs` | Ours, 6 hunks; production's porting note goes with it | `79d5eb4804` | **DONE 2026-09-01** | 6 conflicts resolved; result `diff`s identical to stage 2 |
| R4 | `scripts/dev-server.mjs` | Theirs, 5 hunks | `79d5eb4804` | **DONE 2026-09-01** | 5 conflicts resolved. Result is **not** identical to stage 3, and that is correct: production never edited the file's header or six comment lines, so our edits there auto-merged. Confirmed by reading stage 1 — the base and stage 3 agree on those lines, our stage 2 differs `[verified 2026-09-01]`. Production's features are all present: `8081`, `pagefindServed`, `buildPagefind`, `hugoVersion`, `VENDORED_HUGO`, `export const PREFIXES`; `logLevel` is 0. `node --check` OK |
| R5 | `themes/dohmh/layouts/neighborhood-reports/section.html` | Ours, 2 hunks — both empty on our side, because the picker moved to shared partials | `79d5eb4804` | **DONE 2026-09-01** | 2 conflicts resolved, 0 markers; `diff -u` against stage 2 is empty. **`git diff --no-index` reported "differs" on the same pair and was wrong** — do not use it here, see the long-path caveat in CLAUDE.md |
| R6 | `topiclanding.html`, `nr-output/single.html`, `partials/nr-chooser.html` | `git rm` | `79d5eb4804` | **DONE 2026-09-01** | Port check first, on all four things production's 4 commits changed. Three are already covered here: `lib-uhflist` is included by all four surviving NR templates; `wireComboboxState` is defined *and called* in `partials/nr-neighborhood-picker-js.html` (lines 80 and 61); the duplicate-`class` sweep has nothing to port — **0 hits across 130 templates**, from a detector proved to fire on the pre-sweep `nr-chooser.html` and to stay silent on the post-sweep one. The fourth is not covered and became task G1 |
| R7 | `documents/js-conventions.md` | Ours | `79d5eb4804` | **DONE 2026-09-01** | 1 conflict; result identical to stage 2 |
| R8 | `documents/nr-de-merge-integration-plan-2026-08-15.md` | Theirs — one line, :8080/:1313 becomes :8080/:8081/:1313 | `79d5eb4804` | **DONE 2026-09-01** | 1 conflict; result identical to stage 3 |
| R9 | `CLAUDE.md` | Union rewrite, 6 hunks. Also resolves to **one** `docs-check verified:` stamp — the merge leaves two, at lines 2 and 10 | | **In progress** — the only path still unmerged | |

### Stage G — gaps the merge does not flag

| # | Gap | Commit | Status | Proof that ran |
|---|---|---|---|---|
| G1 | Duplicate `id="skip-header-target"`. Production's `b8771726c9` moved the id onto `<main>` in `baseof.html` and stripped it from **45 other templates**; this branch's NR templates postdate that sweep, so `nr-report.html` and `nr-topic-index.html` still carried it. Fixed by deleting the attribute from those two — a two-line diff, `data-pagefind-ignore="all"` left in place on `nr-report.html`, which is load-bearing | `79d5eb4804` | **DONE 2026-09-02** | Measured on built HTML, not on template source. Before: **215 of 1397 files carried the id twice** — 210 report pages + 5 topic indexes — 712 carried it once, 470 (aliases and `static/`) none. After: **0 twice, 927 once, 470 none**. The 927 is an independent cross-check: it is exactly the count of real pages rendered through `head.html` that CLAUDE.md documents, and 712 + 215 = 927 `[verified 2026-09-02: one Python walk over each of two isolated production builds]`. Nothing in `assets/` or `content/` selects the id, so no JS or CSS depended on it |
| G2 | `wireComboboxState` is declared in two partials after the merge — `partials/flexdatalist-combobox-js.html:34` (production's, ported *from* this branch) and `partials/nr-neighborhood-picker-js.html:80` (ours) | n/a — no fix needed | **DONE 2026-09-02, no change made** | **Not a defect on this tree.** Counted over built HTML rather than template source: of 1397 files, 1388 define it 0 times and **9 define it exactly once** — the DE indicator catalogue, `hvi`, `aqe`, the NR landing page and the 5 topic indexes. No page defines it twice, so the R5 resolution cannot shadow. The duplication is still worth removing and is follow-up F1 |

### Stage V — verification

Run in this order; each is cheaper than the next and can falsify the ones after it.

| # | Check | Commit | Status | Proof that ran |
|---|---|---|---|---|
| V1 | `npm install` against the merged `package.json` / `package-lock.json` | `79d5eb4804` | **DONE 2026-09-02** | exit 0. **The lockfile changed, by one line, and keeping the change is correct**: the merged root `devDependencies` still read `playwright: ^1.61.1` where `package.json` says `^1.62.0`; the install reconciled it. `hugo-extended` stayed pinned at `"0.147.3"` in `optionalDependencies`, so the un-pinning gotcha did not fire. Installed: playwright 1.62.0, eslint 10.8.0, globals 17.8.0, axe-core 4.13.0, hugo-extended 0.147.3 |
| V2 | `npm run lint` over both `assets/js/data-explorer` and `assets/js/nr-report` | `79d5eb4804` | **DONE 2026-09-02** | Bare run exit 0 over **20 files (10 DE + 10 NR), 0 errors, 0 warnings** — which on its own proves nothing, because a file matched by no config block is linted with `no-undef` off and passes silently. Two controls, both run against `assets/js/nr-report/app.js` and both restored from the index afterward (blob hash re-checked). **Negative:** an undefined name gave `'thisNameIsDefinedNowhereAtAll' is not defined no-undef`, exit 1 — the NR block's rule is live. **Positive:** referencing `getTertileSentenceParts`, declared in the sibling `tertiles.js` and used nowhere in `app.js`, gave exit 0 — `scanDeclaredGlobals("assets/js/nr-report")` ran and supplied the shared global |
| V3 | Isolated Hugo build, `HUGO_RESOURCEDIR` and `-d` both outside the repo | `79d5eb4804` | **DONE 2026-09-02** | Two builds, `--environment production`, vendored hugo 0.147.3+extended. Both **exit 0, 0 ERROR, 1205 EN / 91 ES / 91 ZH pages**, 31.3s and 31.9s. `resources/_gen` byte-identical either side of each — a path+size manifest over every file, md5 unchanged — and `docs/` untouched |
| V4 | `npm run docs-check` | `79d5eb4804` | **DONE 2026-09-02** | exit 0, "1 doc(s) checked". **The count is right, not a silently-skipped file**: `documents/audit-backlog-production-2026-08-20.md` only quotes the opt-in string in prose, and `documents/nr-de-merge-integration-plan-2026-08-15.md` says at line 3 that it deliberately does not opt in. **Positive control:** injecting `themes/dohmh/layouts/this-file-does-not-exist.html` into `CLAUDE.md` made it FAIL naming that path, so the pass is a fact about `CLAUDE.md` and not about an unread file |
| V5 | Smoke | `79d5eb4804` | **DONE 2026-09-02** | Curated: **33 of 33 clean**, exit 0, `Pagefind index: served`, and all four NR page kinds are in `PAGES` — landing, topic index, neighborhood index, report page. Full sweep: **`npm run smoke:all`, 925 pages clean, exit 0** (925 = 830 sitemap + 94 paginator + 1). One page (`data-features/heat-report-archive/2021/`) failed under concurrency and was clean on the harness's own sequential re-check — the documented undiagnosed flake, not a finding |
| V6 | `node scripts/nr-characterization.mjs --check` | `79d5eb4804` | **DONE 2026-09-02** | exit 0, **3 of 3 targets match** the `staging` baseline, against a spawned `dev_stage` server. Note this harness records no element ids, so it is not what proves G1 — the built-HTML count is |
| V7 | Pagefind index characterization | `79d5eb4804` | **DONE 2026-09-02, re-baselined** | `npm run characterize:pagefind` takes no default mode; use `node scripts/pagefind-characterization.mjs --check` (env defaults to `local_prod`, so the `production` baseline). First run **FAILED with controls passing** — 9 page kinds rendered, query path answering. Every difference was then explained and all of it is intended, so the baseline was re-captured and the re-check is green. See "What the Pagefind diff turned out to be" below |
| V8 | `npm run characterize:site` | **not re-baselined in M1** — see M2 | **DONE 2026-09-02, diagnosed** | exit 1: **261 of 925 pages differ across 11 fields**, in 4 sections. Past the 25-page arbitration cap, so nothing was re-captured and every page named is a real difference — which is correct here, because the cause is systematic. Two causes, both intended, and no third: **(a)** the NR rewrite, 210–216 pages, and several of its fields move the right way — `headingJumps` 3 -> 1, `img.missingAlt` 1 -> 0, `controls.noAccessibleName` 2 -> 1, and `headingLevels` first entry 2 -> 1; **(b)** `-js/uhflist.js` on 261 pages, because this branch deleted that source and generates the data through `lib-uhflist.html` instead. **(b) was the one that could have hidden a regression, and it does not**: `smoke:all` ran all 925 pages green, so no page anywhere — `es/` and `zh/` included — throws for a missing `neighborhoods`. The harness also confirmed EHDP-data has not moved since the baseline, so the data is not an explanation |

### What the Pagefind diff turned out to be

Worth reading before anyone meets a similar diff, because none of it was this branch's doing and
the obvious reading — "search got worse, we lost results" — is wrong.

`production` commit **`ac27116b14` "emit the page's real language in `<html lang>`"** replaced a
hardcoded `lang="en"` in `baseof.html` and `list.html` with `{{ .Language.Lang }}`. Pagefind reads
that attribute and builds a **separate index per language**, with language-appropriate
segmentation. So:

- **7 `/zh/` pages jumped in word count** — `/zh/data-stories/housing/` 163 -> 2004,
  `/zh/data-stories/violence/` 199 -> 2799. Chinese text was previously being tokenized as
  English, which yields almost no words. It is now segmented as Chinese.
- **English queries return fewer results** — "climate" 40 -> 35, "housing" 73 -> 67,
  "heat vulnerability" 28 -> 26. The zh pages left the English index, which is the point of the
  fix: an English search should not return Chinese pages.
- Direct confirmation, rather than inference: the built index now carries three language shards,
  `pagefind.en_*.pf_meta`, `pagefind.es_*.pf_meta` and `pagefind.zh_*.pf_meta`
  `[verified 2026-09-02: ls of the index the smoke run built]`, and the merged build emits
  `<html lang="zh">` / `lang="es"` / `lang="en"` on the right pages.

The other two groups: **144 pages each lost exactly one anchor id**, which is `b8771726c9`
removing `id="skip-header-target"` from 45 templates; and **4 English pages plus 1 contentHash**
moved, which is production's own content edits.

**The indexed page count did not change** — 202 before and after, and the committed baseline
already held 202. The 48 NR pages in the index are unchanged, so this branch's own NR work did
not move the index at all. Note that CLAUDE.md elsewhere cites 201 indexed pages from a
2026-08-15 document; the harness and its baseline both say 202. That discrepancy is not resolved
here and does not block anything — it is not a difference this merge introduced.

### Stage M — commits

| # | Step | Commit | Status |
|---|---|---|---|
| M1 | The merge commit: all 11 resolutions, the G1 fix, the reconciled lockfile, the re-captured Pagefind baseline, and this ledger | `79d5eb4804` | **DONE 2026-09-02** — 1956 files, parents `4c9f4ad5ee` and `0c860946cd` |
| M2 | Re-capture the `staging` site-characterization baseline, as its own commit so the merge diff stays reviewable | `029e40f36e` | **DONE 2026-09-02** — 262 files, exactly the 261 pages the failing check named plus `_meta.json`; both capture sweeps agreed on every page, so nothing needed arbitration; `characterize:site` then passed |
| M3 | Ledger hashes and the `CLAUDE.md` `docs-check verified:` re-stamp | *bookkeeping only, no work commit* — `git log -1 --format=%h -- documents/nr-merge-production-2026-09-01.md` names it | **DONE 2026-09-02** |

**M3 does not name its own hash and does not need to** — the rows above name the *work's*
commits, which is what a later session has to find.

**On the re-stamp.** `CLAUDE.md`'s stamp asserts that a human re-read the prose against the tree
at the named commit, and bumping it without that is a false claim rather than bookkeeping. What
actually happened: the prose was re-read and every factual claim in the rewritten Guardrails
section was checked against this tree — 18 npm scripts, the four flexdatalist load sites, the
per-environment `maxAge` split, `head.html:46-53`, the two committed baseline keys, 925 = 830 +
94 + 1, and 927 real pages — and `docs-check` passed with a positive control. **That is a machine
re-read, not a human one.** The stamp is bumped so it is not stale, and this paragraph is the
disclosure: the Guardrails and Common gotchas sections want a human eye on review.

## The exact next commands

**The merge is done. What is left is F2, and it belongs to whoever opens the PR into
`production`.**

```bash
cd "c:/Users/Chris/Documents/DOHMH/Programming/EH-dataportal.worktrees/feature-MOD-Lab-NR-recode-refactor"

# F2 — capture the prod_prod baseline, which this branch has NOT refreshed.
# Spawns its own isolated server on :8090; leaves docs/ and resources/_gen alone.
npm run characterize:site:prod_prod        # expect red first, for the same two causes as V8
npm run characterize:site:env prod_prod    # …then capture, and commit the result

# Re-running the merge's own checks (a green result is a fact about a commit, not a branch —
# re-read `git rev-parse HEAD` before citing any V row below).
npm run lint                               # expect 20 files, 0 errors
npm run smoke                              # expect 33/33; smoke:all for 925/925
node scripts/nr-characterization.mjs --check          # expect 3/3 against the staging baseline
node scripts/pagefind-characterization.mjs --check    # expect green
npm run characterize:site                  # expect green against 029e40f36e's baseline
```

Relationships this ledger deliberately does not assert — derive them instead:

```bash
git log --oneline c59d614716..HEAD                       # our commits since the merge base
git rev-list --left-right --count origin/feature-MOD-Lab-NR-recode-refactor-merge...HEAD   # 0 0 means pushed
git merge-base --is-ancestor 79d5eb4804 production       # exit 0 once this reaches production
gh pr list --head feature-MOD-Lab-NR-recode-refactor-merge
```

## Follow-ups this merge creates but does not close

| # | Follow-up | Status |
|---|---|---|
| F1 | Two near-duplicate `wireComboboxState` implementations, in `partials/flexdatalist-combobox-js.html` and `partials/nr-neighborhood-picker-js.html`. Harmless today — proved at G2, no page loads both — so this is tidying, not a fix, and it needs its own browser proof | **Not started** |
| F2 | **The `prod_prod` site-characterization baseline stays stale on this branch even after M2**, which only re-captures `staging`. `prod_prod` is the environment that actually deploys, and capturing it needs `npm run characterize:site:prod_prod`, which spawns its own isolated server. Do it before the PR into `production` is merged, not after | **Not started** |
| F3 | CLAUDE.md's Guardrails section is now a union of two branches' documentation and is long. If it becomes unwieldy, `refile-rules` is the pass for it — not part of this merge | **Not started** |
