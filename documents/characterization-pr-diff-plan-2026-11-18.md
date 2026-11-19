# Site characterization: PR-vs-base report — plan and ledger

> **Status lives in `## Ledger` at the foot of this file, and nowhere else.** Maintained with the
> `keep-ledger` skill. The `- [ ]` boxes in the tasks are a reading aid, not status. The executor is
> the user's choice.

**Branch:** `feature-characterization-pr-diff`, cut from local `production` at `8993a4fc5d`.

**Goal:** Replace "diff every PR against a committed baseline, fail on any difference" with "capture
the PR and its base branch in the same run, post what changed as one PR comment, never fail the PR on
a difference" — plus a strict local mode that exits non-zero on a difference nobody claimed.

**Architecture:** One new script, `scripts/site-characterization-compare.mjs`, owns both trees: it
serves the base tree and the head tree on two isolated Hugo servers (:8091, :8090), captures each with
the existing `site-characterization.mjs --out`, arbitrates differing pages by re-capturing them
sequentially on both servers, and writes a text report to stdout and a markdown report to a file. CI
calls it with `--report-only`; a separate job posts the markdown as a single, edited-in-place PR
comment. The committed baselines, the re-baseline tool and the `--check`/`--baseline` modes are then
deleted.

**Tech stack:** Node 24 ESM scripts, Playwright Chromium, Hugo (lockfile-pinned `hugo-extended`),
Pagefind, GitHub Actions, `gh` CLI on the runner.

## Decisions (Chris, 2026-11-18)

- **D1. Compare against the base branch, not a committed baseline.** Reason recorded in the
  conversation: a report-only check against a committed baseline accumulates every merged-but-not-
  re-baselined change, and nothing would re-baseline once CI stops failing. 29 re-baseline commits
  against 78 merged PRs since 2026-10-01 `[2026-11-18: git log --grep, gh pr list]` is the rate it
  would drift at.
- **D2. The report is a PR comment; no email.** GitHub notifies PR participants of new comments. That
  a `github-actions[bot]` comment triggers that email is **not verified** — Task 3 observes it.
- **D3. CI never fails a PR on a difference.** It fails only when the harness itself fails (a server
  that never answers, a page that will not load, a Pagefind mismatch), because a report that silently
  did not run is indistinguishable from "no changes".
- **D4. Strict mode is the local default.** `npm run characterize:site` exits 1 when any page moved
  that no `--expect` glob claims.
- **Deferred, not rejected:** catching EHDP-data drift between PRs. Under D1 a data change that lands
  between PRs appears in no report, since both sides fetch the same data. Bringing it forward means a
  `schedule:` run that captures `production` weekly and diffs it against last week's artifact. Cost of
  waiting: a data-driven structural change (e.g. a table losing `<th>`) goes unreported until a PR
  touches that page's template, and then appears on both sides and so not at all.

## Global constraints

- Arguments that come through `npm run` are **positional**; flags are rejected there
  (`CLAUDE.md`, "Arguments to these are POSITIONAL"). Flags are available only via a direct `node`
  call.
- Two Hugo builders against one tree poison `resources/_gen` (`CLAUDE.md`, "Never run two Hugo
  builders"). Both servers here must use `HUGO_RESOURCEDIR` and `-d` outside either tree, which
  `startServer` already does.
- Branch from local, never `origin/`; never `git -C … commit`; no commit without Chris's say-so.
- Workflow edits go through the `hardening-github-actions` skill: actions pinned by SHA, per-job
  `permissions`.
- Dated documents in `documents/` are records and are **not** edited to drop the old commands.

## Files

| File | Change |
|---|---|
| `scripts/isolated-server.mjs` | `startServer(environment, { cwd, port, tag })` — tree, port, and temp-dir name become parameters; defaults keep today's behaviour |
| `scripts/site-characterization.mjs` | export `walk`, `project`, `recapture`, `META_FILE`; Task 4 deletes `--check`, `--baseline`, `BASELINE_ROOT`, `writeMeta`, the arbitration-against-baseline block |
| `scripts/site-characterization-summary.mjs` | `renderMarkdown(rows, totalPages, heading)` — heading no longer hard-codes "FAILED" |
| `scripts/site-characterization-compare.mjs` | **new** — the compare driver |
| `.github/workflows/site-characterization.yml` | rewritten: one `compare` job (contents: read) + one `comment` job (pull-requests: write); `base-control` job deleted |
| `package.json` | `characterize:site*` scripts repointed / removed |
| `.gitignore` | add `scripts/.sc-compare/` |
| `scripts/site-characterization-baseline/` | deleted (Task 4) |
| `scripts/site-characterization-rebaseline.mjs`, `scripts/characterize-env.mjs` | deleted (Task 4) |
| `CLAUDE.md`, `readme-development.md`, comments in `dev-server.mjs`, `isolated-server.mjs`, `smoke-env.mjs` | Task 5 |

## Review focus

The input classes most likely to bite and no happy-path run exercises. Each has a test in its owning
task.

1. **A page present on one side only** (today's food-safety PR adds a page). `differingPaths` walks
   only its first directory (`scripts/site-characterization.mjs:806`), so a page only in head is never
   arbitrated, and the path it returns is read from the first directory's record. The compare script
   must build its suspect list from the union of both trees. `summarize` already takes the union.
   Test: Task 2 proof (f).
2. **The base tree does not build** (a broken `production` tip, or an EHDP-data rename the base still
   references). Expected: exit 2, report says the *base* failed, CI comment says "no report — base
   build failed" rather than nothing. Test: Task 2 proof (g).
3. **A report longer than a PR comment allows.** A one-line `head.html` change moves every page.
   GitHub's comment limit is believed to be 65,536 characters — **unverified, confirm in Task 3**. The
   comment carries the field table, at most 50 page names, and a link to the run. Test: Task 3 proof (d).
4. **A PR from a fork** gets a read-only token, so the comment step would fail. Expected: comment job
   skipped, compare job still green with the report in the job summary. Guarded by an `if:` on the
   comment job; no live test (the team does not open fork PRs).
5. **Local `production` behind `origin/production`.** The local base would be stale and the report
   would include other people's merged changes. Expected: the script prints the base SHA and warns
   when `git rev-list --count production..origin/production` is non-zero; it does not fetch or switch
   to the remote ref. Test: Task 2 proof (h).

---

## Task 1: Parameterize the isolated server and export the capture helpers

**Files:**
- Modify: `scripts/isolated-server.mjs` (`startServer`, ~line 90)
- Modify: `scripts/site-characterization.mjs` (`walk` :751, `recapture` :790, `META_FILE` :831,
  `project` :919 — add `export`)
- Modify: `scripts/site-characterization-summary.mjs` (`renderMarkdown` :254)

**Interfaces:**
- Produces: `startServer(environment, { cwd = REPO_ROOT, port = PORT, tag = environment } = {})
  → { baseURL, destDir, stop }`. `destDir` / resource dir become `${ISO_ROOT}/${tag}-docs` /
  `${tag}-resources`, so two servers of one environment do not share temp dirs. The Hugo binary is
  `<cwd>/node_modules/.bin/hugo` resolved the way `dev-server.mjs` resolves `VENDORED_HUGO`, falling
  back to `SPAWN_CMD` — each tree builds with its own lockfile's Hugo, as CI does today.
- Produces: `export const walk, project, recapture, META_FILE` (signatures unchanged).
- Produces: `renderMarkdown(rows, totalPages, heading = "Characterization check FAILED")`.

- [ ] **Step 1:** Make the three edits. Callers (`characterize-env.mjs`, `smoke-env.mjs`,
  `site-characterization-rebaseline.mjs`) pass no options, so their behaviour is unchanged.
- [ ] **Step 2: Verify unchanged behaviour.** Run `node scripts/characterize-env.mjs prod_prod sample`
  and `node scripts/smoke-env.mjs prod_prod sample`. Expected: both exit 0, same output shape as on
  `production` (record the exit codes and the `starting isolated prod_prod server` line in the ledger).
- [ ] **Step 3: Commit** (after Chris approves): "Parameterize the isolated server; export capture helpers".

## Task 2: The compare driver

**Files:**
- Create: `scripts/site-characterization-compare.mjs`
- Modify: `.gitignore` (add `scripts/.sc-compare/`)
- Modify: `package.json` — add `"characterize:site:compare": "node scripts/site-characterization-compare.mjs"`
  (renamed over `characterize:site` in Task 4, once the old check is gone)

**Interfaces:**
- Consumes: Task 1's `startServer`, `walk`, `project`, `recapture`, `renderMarkdown(…, heading)`;
  existing `summarize`, `renderText`, `fetchDataCommit`, `capturePage`.
- Produces (CLI, used by Task 3 and Task 4):
  ```
  node scripts/site-characterization-compare.mjs [environment=prod_prod] [sample]
       [--base <ref>=production | --base-tree <dir>]
       [--expect <glob>]...  [--content]  [--report <file.md>]  [--report-only]
  ```
  Exit codes: `0` no unclaimed difference (or `--report-only`); `1` unclaimed difference (strict);
  `2` harness failure (port busy, a server failed, a page failed to load, Pagefind on one side only,
  unknown argument). Unknown arguments exit 2 — the rebaseline incident in `CLAUDE.md` is why.
- Produces: the markdown report always begins with the line `<!-- site-characterization-report -->`
  (Task 3 finds the comment by it), then: heading, base SHA → head SHA, environment, EHDP-data commit,
  page counts, the field table (or "No structural differences"), the `--expect` partition when given,
  pages cleared by arbitration, and the arbitration-cap notice when it fired.

Flow (each line a decision the implementer would otherwise have to make):

1. Parse args; reject unknown flags and a third positional (exit 2).
2. Base tree: `--base-tree <dir>` is used as is (CI prepares it). Otherwise a detached worktree at
   `${tmpdir()}/sc-base` — short path on purpose (`git diff --no-index` and `git apply` fail silently
   on long paths, global `CLAUDE.md`). `git worktree add --detach` on first use, `git checkout
   --detach <sha>` after; `npm ci` there only when `package-lock.json`'s blob hash differs from the
   one stamped in `${tmpdir()}/sc-base/.sc-lock-hash`. Print `Base: <ref> @ <sha10>`, and warn when
   local `<ref>` is behind `origin/<ref>` (Review focus 5).
3. Refuse if :8090 or :8091 already answers (exit 2), same message shape as `characterize-env.mjs`.
4. Start base (`tag: "sc-base"`, port 8091, `cwd`: base tree), then head (`tag: "sc-head"`, port 8090).
   Sequential, so two cold builds do not compete for CPU. Build Pagefind into each `destDir`.
5. Capture base then head, sequentially, each by spawning `site-characterization.mjs --out
   scripts/.sc-compare/<side> [--all]` with `DE_BASE_URL` set to that side's URL. Any non-zero exit → 2.
6. Suspects = pages whose record differs, over the **union** of both trees (Review focus 1); a page on
   one side only is a difference and is not re-captured. If 1–25 suspects, `recapture` each on both
   servers sequentially, then recompute; pages that now match are "cleared". Above 25, skip
   arbitration and say so (same reason as today's cap).
7. `project` both trees (`structure`, plus `content` with `--content`) into `scripts/.sc-compare/proj/{base,head}`,
   `summarize` over the union, print `renderText`, write the markdown report when `--report` is given
   and append it to `$GITHUB_STEP_SUMMARY` when set.
8. Partition changed pages by `--expect` globs (move `globToRegExp` here from the rebaseline script
   verbatim). Exit per the table above.
9. Stop both servers in a `finally`.

Proofs — predictions written before running, per global `CLAUDE.md`. All on the `sample` page set
unless stated, `--base HEAD` unless stated so base and head differ only by the injected edit (an
uncommitted edit is in the working tree, which is head; the worktree is the committed `HEAD`).

- [ ] **(a) Null:** clean tree, `--base HEAD`. Predict exit 0, "No structural differences".
- [ ] **(b) Positive control:** remove `alt="NYC Logo"` from `themes/dohmh/layouts/partials/footer.html`
  (uncommitted). Predict exit 1, `structure.img.missingAlt` on most sample pages. *Corrected
  2026-11-18:* "one image in a shared partial" first went to `header-ds.html`, which no sample page
  renders (`_default/list.html` uses it only for data-stories list pages other than the landing) — so
  the run read exactly like (a). Pick a partial the sample provably renders, and check the built
  output carries the injection before reading the report.
  **No-power condition:** if (b) prints the same as (a), the comparison is not seeing head's tree —
  stop and diagnose before anything else.
- [ ] **(c) `--expect` claims it:** (b) plus `--expect "**"`. Predict exit 0, the report lists the pages
  as expected.
- [ ] **(d) `--expect` misses it:** (b) plus `--expect "nosuchsection/**"`. Predict exit 1.
- [ ] **(e) `--report-only`:** (b) plus `--report-only --report <scratch>/r.md`. Predict exit 0, `r.md`
  starts with the marker line and contains the field.
- [ ] **(f) New page (Review focus 1):** add an uncommitted `content/data-features/sc-probe/index.md`
  and pass its path in the sample set (or run `--all`). Predict a "(whole page) new" row, no crash, no
  arbitration of that page.
- [ ] **(g) Base fails to build (Review focus 2):** `--base-tree` pointed at a copy of the tree with a
  template syntax error. Predict exit 2 and a message naming the *base* server.
- [ ] **(h) Stale base warning (Review focus 5):** `git branch sc-stale production~1` and
  `git update-ref refs/remotes/origin/sc-stale production` (both local-only), then `--base sc-stale`.
  Predict the warning line naming 1 commit behind. Control: `--base production` prints no warning
  (after confirming `git rev-list --count production..origin/production` reads 0). Clean up with
  `git branch -D sc-stale` and `git update-ref -d refs/remotes/origin/sc-stale`.
- [ ] **(i) Full run:** `node scripts/site-characterization-compare.mjs prod_prod` on a clean tree
  against `production`. Record wall time and the number of pages arbitrated — this is the first
  measured cost of the new design, and Task 3's `timeout-minutes` derives from it.
- [ ] Revert every probe edit; `git status` clean apart from the task's own files.
- [ ] **Commit** (after Chris approves): "Add the PR-vs-base characterization compare".

## Task 3: CI — report-only compare, one PR comment

Invoke `hardening-github-actions` before editing.

**Files:**
- Rewrite: `.github/workflows/site-characterization.yml`

**Interfaces:**
- Consumes: Task 2's CLI and the report's marker line.

Shape:
- Triggers and `paths-ignore` unchanged. `workflow_dispatch` keeps `scope` (`all`/`sample`) and
  `content`.
- **Job `compare`** (`permissions: contents: read`): checkout (no `ref:` — the merge ref, as today; that
  comment block carries over), second checkout of `github.event.pull_request.base.sha` into `base/`
  (on `workflow_dispatch`, `production`'s tip), `npm ci` in both, Playwright, then
  `node scripts/site-characterization-compare.mjs prod_prod [sample] --base-tree base --report-only
  --report sc-report.md [--content]`. Upload `sc-report.md` as artifact `sc-report` (always), and
  `scripts/.sc-compare/` + both server logs on failure. `timeout-minutes` = 2× Task 2 (i)'s measured
  wall time scaled to the runner, recorded with its derivation in a comment.
- **Job `comment`** (`needs: compare`, `if: always() && github.event_name == 'pull_request' &&
  github.event.pull_request.head.repo.full_name == github.repository`, `permissions:
  pull-requests: write`, no checkout): download `sc-report`; if it is missing (compare died before
  writing it), body = marker + "No report — the compare job failed; see <run URL>". Truncate the body
  to the limit confirmed in step (d) minus a margin, appending the run link. Find an existing comment by
  `gh api --paginate repos/$REPO/issues/$PR/comments --jq` filtering `user.login ==
  "github-actions[bot]"` and body starting with the marker; PATCH it if found, else POST.
- Delete the `base-control` job — its question ("was it the data?") no longer arises when both sides
  fetch EHDP-data minutes apart.

Proofs (on a draft PR into `production` from this branch — it does not deploy, `CLAUDE.md` §Deployment):
- [ ] **(a)** First push: `compare` green, exactly one comment carrying the marker.
- [ ] **(b)** Second push (any commit): still exactly one marker comment, its body updated (compare
  `updated_at`).
- [ ] **(c)** Push a commit injecting Task 2 (b)'s `alt` removal: `compare` still **green**, comment
  names the field. Revert it in the next commit; comment returns to "No structural differences".
- [ ] **(d)** Confirm the comment size limit from GitHub's docs (record source and date here), then
  force an oversize report once (temporarily lower the truncation threshold to e.g. 2,000) and check
  the comment ends with the run link. Restore the threshold.
- [ ] **(e)** Ask Chris whether the comment produced a notification email (D2's unverified half).
- [ ] **Commit** per step as they land (after Chris approves); the PR stays draft until Task 5.

## Task 4: Remove the baseline machinery

**Files:**
- Delete: `scripts/site-characterization-baseline/`, `scripts/site-characterization-rebaseline.mjs`,
  `scripts/characterize-env.mjs`
- Modify: `scripts/site-characterization.mjs` — remove `--check`, `--baseline`, `BASELINE_ROOT`,
  `CURRENT_DIR` default, `existingBaselines`, `writeMeta` and the `--check` block (:1142-1188,
  :1259-1300, :1338-1489 as of `8993a4fc5d` — re-read before cutting); `--out` becomes required and
  the usage text says so.
- Modify: `package.json` — `characterize:site` → `node scripts/site-characterization-compare.mjs`;
  `characterize:site:sample` → `… prod_prod sample`; `characterize:site:env` →
  `node scripts/site-characterization-compare.mjs` (environment positional). Remove
  `characterize:site:prod_prod`, `:dev_stage`, `:baseline`, `:rebaseline`, `:compare`.
- Modify: `.gitignore` — drop `scripts/site-characterization-current/`.

- [ ] **Step 1:** Make the deletions.
- [ ] **Step 2: Sweep** — one labelled command over tracked files outside `documents/`:
  `git grep -nE "site-characterization-baseline|rebaseline\.mjs|characterize-env|--baseline|characterize:site:(prod_prod|dev_stage|baseline|rebaseline)" -- . ':!documents'`.
  Predict hits only in `CLAUDE.md`, `readme-development.md` and code comments Task 5 owns.
  Positive control: the same command with `production` as the tree (`git grep … production -- …`)
  returns hits in `scripts/`.
- [ ] **Step 3:** `npm run characterize:site:sample` → exit 0 on a clean tree;
  `node scripts/site-characterization-probe-control.mjs` → still passes (it imports `CAPTURE` and
  `capturePage`, which stay).
- [ ] **Commit** (after Chris approves).

## Task 5: Docs

**Files:** `CLAUDE.md` (the "Site characterization" subsection and the Guardrails count),
`readme-development.md` (:96-180), stale comments named by Task 4's sweep.

- [ ] Rewrite the `CLAUDE.md` subsection to describe the compare: what it captures, the two ports,
  strict vs `--report-only`, `--expect`, the PR comment, what it cannot see (D1's deferral). Keep the
  bullets that still hold (structure vs content, Pagefind gate, arbitration cap, third-party embed
  stalls) and drop the baseline-key table and re-baseline bullets.
- [ ] `readme-development.md`: same, for the team.
- [ ] `npm run docs-check` → exit 0; re-stamp `CLAUDE.md` only after re-reading the edited section
  against the tree.
- [ ] Re-run Task 4's sweep: zero hits outside `documents/`.
- [ ] Re-read the PR description against `git log production..HEAD`; mark the PR ready.
- [ ] **Commit** (after Chris approves).

---

## Ledger

Status as of 2026-11-19: plan at `60dc642547`; Tasks 1–5 and 3b done on draft PR #1583; the PR description re-read and marking it ready remain.

| # | Task | State | Commit | Proof that ran |
|---|---|---|---|---|
| 1 | Parameterize server, export helpers | **DONE 2026-11-18** | `5a1f3dc8ad` | `[verified 2026-11-18: node --check on all three, exit 0; node scripts/characterize-env.mjs prod_prod sample → exit 0, 41/41 captured, "Characterization check PASSED"; node scripts/smoke-env.mjs prod_prod sample → exit 0, 44 pages clean; both printed the unchanged temp dirs sc-isolated/prod_prod-{docs,resources}, so the tag default holds; :8090 free afterwards. Logs: scripts/.sc-rebaseline/pr-diff-t1/ (git-ignored)]` |
| 2 | Compare driver | **DONE 2026-11-18** | `1250a7340f` | `[2026-11-18: node --check exit 0; --bogus, three positionals, an unknown environment, and --base without a value each exit 2]`. `[verified 2026-11-18, all sample, --base HEAD at 5a1f3dc8ad: (a) clean → exit 0, "No differences across 41 pages", 125s including first npm ci, :8090/:8091 free after; (b) as written, removing alt in header-ds.html, read IDENTICAL to (a) — no power: list.html:18-20 renders header-ds only on data-stories list pages other than the landing, no sample page is one, and the built head had 0 pages lacking the alt. Corrected (b): footer.html:149 alt removed → exit 1, structure.img.missingAlt 0→1 on 38/41 (the 3 data-explorer pages unchanged, not examined), over-cap message printed, 844 built head pages lack the alt; (c) + --expect "**" → exit 0, 38 claimed; (d) + --expect "nosuchsection/**" → exit 1, "matched no changed page"; (e) + --report-only → exit 0, report starts with the marker; arbitration path: a <button> in nr-neighborhood-index.html → 1 page, re-captured alone on both servers, still controls.button 35→36, exit 1]`. Fixed after the arbitration run: shapeOf's "re-run at the merge base" line is replaced in compare output, since both sides fetch the same data. `[verified 2026-11-18: (f) uncommitted content/data-features/sc-probe/index.md, --all, --base HEAD → exit 1, 840 vs 841 pages; "(whole page) new" for data-features/sc-probe, not arbitrated; plus 3 pages linking to it (categories/airquality/page/4/, data-features/, key-topics/airquality/: links.internal +1, headingLevels +1), arbitrated and still differing — real knock-on effects, not predicted; 295s; one-sided row wording then changed to "new in head"/"removed in head". (g) {{ if }} prepended to the base worktree's baseof.html, --base-tree → exit 2, "The BASE tree did not build or serve … exited (code 1) before answering on :8091"; worktree restored. (h) local sc-stale at production~1 with refs/remotes/origin/sc-stale at production → "local sc-stale is 2 commit(s) behind", exit 0, no differences; control --base production with production..origin/production = 0 → no warning, exit 0; both refs deleted after. (i) clean tree (no rendering edits), --all against production @ 8993a4fc5d → exit 0, 840/840 each side, "No structural differences", no arbitration, 280s at concurrency 24 on 24 logical processors]`. Proof logs: `scripts/.sc-rebaseline/pr-diff-t2/` (git-ignored) |
| 3 | CI report + comment | **DONE 2026-11-19** — on draft PR #1583 | `f83512d318` workflow; `7ccc7b04bb` process-group fix + timeout; `6d4d8b9461` probe and `20b502e08a` its exact revert; `ec01605cdc` author mention | No local YAML parse (`npx -y js-yaml@4.1.0` refused by the permission classifier); GitHub parsed it on push. `[verified 2026-11-19, run 44461996966 on f83512d318: setup 67s; compare wrote "No structural differences across 840 pages" and the report at 05:11:49, 11m29s after the step began, then HUNG to the 30-minute timeout — node_modules/.bin/hugo is hugo-extended's lib/cli.js, which spawns the real binary with stdio inherited, and child.kill() reached only the wrapper (Windows' taskkill /T had hidden it locally). Fixed in 7ccc7b04bb by detached spawn + group kill. The comment job still ran: one marker comment (id 7000666422) posted by github-actions[bot] with pull-requests: write, no 403 — (a) for the comment half. Smoke passed, 11m10s]`. Comment limit: no GitHub doc states it; the API error quoted in mshick/add-pr-comment#93 and peter-evans/create-or-update-comment reads "Body is too long (maximum is 65536 characters)" `[searched 2026-11-19]`; the job cuts at 60,000 bytes, which is ≤ 60,000 characters either way. `[verified 2026-11-19: (a)+(b) run 44519135899 on 7ccc7b04bb — compare success, step 12m11s and it exited on its own (the fix), job 14m; still ONE marker comment, same id 7000666422, updated_at 12:09:47; smoke success. (c)+(d) run 44522951372 on probe 6d4d8b9461 (footer alt removed, limit=2000) — compare SUCCESS (report-only held), comment "798 page(s) changed", structure.img.missingAlt 0 -> 1 on 798 of 840; raw body 2169 chars, page list cut, "**Report truncated**" then the run link last. A first jq print of the body seemed to drop lines; the raw body fetched alone is complete. Smoke on that push failed in "Install Playwright Chromium" (apt: could not connect to azure.archive.ubuntu.com) — runner infrastructure, before any page loaded. Revert 20b502e08a: git diff --stat 6d4d8b9461~1 HEAD over themes/ .github/ is empty; its run 44526488612 green, one marker comment, body back to "No differences across 840 pages"; smoke green]`. (e) `[2026-11-19: no email reached Chris for the plain bot comment; his notifications API showed one thread for #1583, reason "author", latest_comment_url null — the comment had not touched it. Decision (Chris): @mention the PR author. ec01605cdc adds "cc @<author>" (skipped for [bot] logins); with the old comment deleted first, run 44531326493 created comment 7010579718 at 13:30:38 and the thread switched to reason "mention", latest_comment_url = that comment, at 13:31:02. Not yet tested: whether an EDIT that keeps the mention notifies again — the next push to #1583 answers it]` |
| 4 | Remove baseline machinery | **DONE 2026-11-19** | `e5127aa7d0` | `[verified 2026-11-19: git rm of scripts/site-characterization-baseline/ (1682 files), site-characterization-rebaseline.mjs, characterize-env.mjs; site-characterization.mjs cut to --out only by an anchored 8-cut script (+43/−473 before follow-ups; LF kept, 0 CR); project()'s unused `only` param, ENVIRONMENT_FOR and the summary module's EHDP-data field classification removed, its wording fixed at source and the compare's text patch deleted; package.json: characterize:site / :sample / :env now run the compare, five scripts removed. Sweep as written over-matched — "--baseline" also hits the cp/de/nr/pagefind harnesses, which keep their own baselines; the real leftovers it found outside Task 5's docs were comments in dev-server.mjs, smoke-env.mjs (5) and smoke.yml, all fixed. Positive control: same pattern on production hits 17 files. npm run characterize:site:sample → exit 0, 41/41 each side vs production @ 8993a4fc5d, no differences; site-characterization-probe-control.mjs → exit 0, "All probes responded"; harness with no args and with --check → exit 2 + usage; :8080/:8090/:8091 free after]`. Logs: `scripts/.sc-rebaseline/pr-diff-t4/` |
| 3b | Retry and list pages that do not load (added 2026-11-19, Chris) | **DONE 2026-11-19** — `LOAD_FAILURE_LIMIT = 5` | `534ff4f6c6` | `[verified 2026-11-19: cause — run 44541819564 on 129f134f64 voided its report on one base-side timeout of /data-features/displacement-risk/. Threshold check (Chris asked) — FAIL lines across every failed run of the workflow: 186 runs since 2026-08-24, 28 failed, 27 logs retrievable, ONE page-load failure ever (that run; positive control). Proof 1, --all --base HEAD with an uncommitted rawhtml <script>while(true){}</script> page: predicted the probe page would hang; instead the probe page served 404 (in the sitemap, not at that URL — not diagnosed) and the /data-features/ LISTING, which renders its body, timed out on head only; retried on head only, left out, listed "Not compared … data-features/ (head)", 2 listing pages still reported changed, exit 1, 357s. Proof 2, limit temporarily 0, sample → exit 2 "1 pages did not load — more than 0 … No report", no retry; limit restored to 5 (grep line 74). Script and logs: scripts/.sc-rebaseline/pr-diff-loadfail/]` |
| 5 | Docs | **DONE 2026-11-19** — `CLAUDE.md` subsection rewritten (144 lines → 102 by an anchored replace, then the load-failure retry added) plus the Guardrails count, the `smoke:env` paragraph and one stale phrase; `readme-development.md` characterization rows and subsections rewritten. Remaining: re-read the PR description against `git log production..HEAD`, then mark #1583 ready | `45f774dc6d` | `[verified 2026-11-19: npm scripts counted 18 on production, 14 now, so "Eighteen" → "Fourteen"; first npm run docs-check FAILED on 6 spans I wrote (a retired path, three site URLs without the leading "/", a short template path, a node_modules path), fixed, re-run PASSED, 3 docs; each edited passage re-read in the file, which caught and fixed four overclaims (one author's notifications generalized to "nobody's"; the hugo wrapper scoped to "off Windows"; "both scripts refuse anything starting with -"; "a data change does not show up at all"); LF kept, 0 CR in both. CLAUDE.md's docs-check verified stamp NOT bumped: it asserts the whole file was re-read, and only the edited passages were]` |

**Environment:** the local base worktree lives at `%TEMP%/sc-base` (a detached `git worktree`;
`git worktree list` shows it), with `node_modules` installed and a `.sc-lock-hash` stamp. Isolated
server output goes to `%TEMP%/sc-isolated/sc-{base,head}-{docs,resources}`. Both are disposable.

**Edit re-notification, settled as far as it can be:** after the push of `129f134f64` the bot edited
comment 7010579718 (14:25:16) and Chris received only the failed-run notification, no email for the
edit. His notification thread did update at 14:25:21 (reason `mention`, `latest_comment_url` null),
which cannot be attributed to the edit rather than the failed check `[2026-11-19]`. In practice the
author is pinged once, when a PR's first report is posted.

**Next command:** watch the CI runs for the latest pushed commit
(`gh run list --commit $(git rev-parse HEAD)`), re-read #1583's description against
`git log --oneline production..HEAD` and update its "Not included yet" line, then
`gh pr ready 1583`. After merge, the close-out line goes here with the commit range.
