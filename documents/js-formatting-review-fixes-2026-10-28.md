# PR #1515 review fixes (2026-10-28)

This plan fixes the 20 findings from the `/code-review xhigh` run on #1515 (`feature-js-formatting`, head
`73c6f2f0ec`, reviewed against `8ca6013616`). Finding numbers (F1–F20) follow that review's order. The
review is not in the repo, so each task below restates what its finding needs.
`documents/js-formatting-pass-2026-10-19.md` is still the ledger for the formatting pass itself. Task 15
writes this plan's results back into it.

Shipped output: the review found no behaviour change in built JS, inline scripts, markup (outside
`1654d60788`'s hand edits) or CSS. Most tasks here fix the tools, so that a later re-run can't introduce
one. Two tasks change what the site renders: Task 3 (latent, no output change today) and Task 13
(heatstory's markup).

## Decisions (Chris)

All four answered 2026-10-28: Chris took each recommendation ("go").

| # | Question | Recommendation | Blocks |
|---|---|---|---|
| D1 | Retarget #1515 from `feature-MOD-Lab-NR-recode-refactor-merge` (merged as #1491, `7156c27081`) to `production` now? | Yes. Until it is retargeted, neither CI sweep runs on it. This is an outward-facing change to the PR, so it needs your go-ahead | Task 16 |
| D2 | Should heatstory's unclosed `<a>` (F12) be fixed in this PR or in a separate content PR? | This PR, in its own commit. `1654d60788` already edits that list, and site characterization will see the change either way | Task 13 |
| D3 | Should the one-shot tools `indent-rescale.mjs` and `indent-normalize.mjs` (F4, F8) get a guard or be deleted? | Guard. The ledger's step 7 and 8 rows cite both by path and describe their `--verify`, so deleting them leaves those citations pointing at nothing | Task 9 |
| D4 | YAML at 2 spaces (F15): should CLAUDE.md say "4-space indentation in all files except YAML (2)"? | Yes. Ledger Decisions row "4-space indentation joins the pass" already records the YAML exception as your choice | Task 14 |

## Ledger

| Task | Commit | Status | Proof that ran |
|---|---|---|---|
| 1 | `6a710ef4aa` | **DONE 2026-10-28** | `[2026-10-28: new fixtures fail on the old mask — js-semicolons wrote "return; {{ .Params.x \| jsonify }}", and the verifier, once its control was wrapped in a function (a bare top-level return is a parse error, so its first run returned null on both masks and proved nothing), called the pair equal — and pass on the new one; three sweep tools re-run, 0 of 198 changed, only render-table.html:69 unparsed; scriptRegions identical on all 171 tracked .html under both masks; verifier controls const→let in cooling-info.js and temp-popup.html each exit 1; js-comment-spacing-verify control exit 1; npm run lint exit 0]` |
| 2 | `e2e16ac69d` | **DONE 2026-10-28** | `[2026-10-28: git diff -U0, 4 pairs differing by ";"; js-semicolons re-run 0 changed, and the pre-Task-1 tool in a worktree adds all 4 back; prod_prod built before and after: 3,017 identical, 3 build noise, one-sided only the untracked static/commissaries/.vscode/settings.json; comparator control, a built NR page edited, exit 1]` |
| 3 | `95e60939d8` | **DONE 2026-10-28** | `[2026-10-28: template-literal fixture exit 2 before, 0 after; tree re-run 0 changed]`. Departure: the line-text tests are kept beside the token tests, since dropping them would start padding `{ // note` lines |
| 4 | `aad5d22f61`, `68114ff02f`, `fb58c99353` | **DONE 2026-10-28** | `[2026-10-28: each tool's fixture control passes and fails with lineOf shifted by one (padding, guards) or every action masked as a comment (semicolons); each re-run 0 of 198 changed; a semicolon deleted from bar.js put back byte-identical to HEAD]`. Departure: shared `jsBodies` and `lineIndex` rather than one `forEachBody` that also applies edits, since the three tools apply edits in three shapes (offsets, line plans, line sets) |
| 5 | `38fdd07248` | **DONE 2026-10-28** | `[2026-10-28: no changed file, exit 2; a doubled space in bar.js staged, exit 1 naming it; the previous copy on that staged tree, 0 files compared, exit 0]` |
| 6 | `b15e993648` | **DONE 2026-10-28** | `[2026-10-28: all three tools exit 0 at the tree, printing render-table as known; controls — an {{ if }}…{{ else }}…{{ end }} value in temp-popup.html, render-table removed from the list, temp-popup.html listed while it parses — each exit 1 naming its cause]` |
| 7 | `116c985d12` (with 8) | **DONE 2026-10-28** | `[2026-10-28: the .py list, read through a new sweep_targets(), and the .mjs list hold the same 196 files (diff --strip-trailing-cr; a line appended to one makes them differ); the .py sweep inserts 0]` |
| 8 | `116c985d12` (with 7) | **DONE 2026-10-28** | `[2026-10-28: both crosswalks 0 diff lines against 8ca6013616; js-semicolons no longer reaches them, and with HEAD's target list re-adds both ";"]` |
| 9 | `b1f4685efc` | **DONE 2026-10-28** | `[2026-10-28: both refuse here, exit 2, --verify included, nothing written; at 81ae3b4ea0~1 the guarded rescale rescales 11 files, 2,548 lines; at 91aa287079~1 the guarded normalize changes 5,902 lines with 78 orphans — the ledger's own counts]` |
| 10 | `62ac689947` | **DONE 2026-10-28** | `[2026-10-28: three synthetic pairs — lines re-indented inside <pre> and <textarea> CHANGED, outside accepted; the previous copy accepted all three; 9a's builds (3177305899, fc6eee395d) exit 0, 3,004 identical, 16 leading whitespace only, each named]`. No built page holds a `<pre>`, and its 3 `<textarea>` hits are inside minified jQuery, so the controls are synthetic |
| 11 | `2c1988f5e9` | **DONE 2026-10-28** | `[2026-10-28: every section glob matches a tracked file except docs/** (untracked output) and *.diff; no EditorConfig parser installed]`. Departure: the final-newline exemption covers `themes/dohmh/layouts/**`, not only `shortcodes/`: 84 of the 145 tracked `.html` layouts end without a newline, render hooks among them |
| 12 | `6f7c29c485` | **DONE 2026-10-28** | `[2026-10-28: npm ls espree, one copy, 11.2.0, deduped with ESLint's; package.json and the lockfile root each +1 line; fixture controls and verifier controls pass]`. Departure: `^11.2.0`, not `--save-exact`, matching the four caret-ranged devDependencies beside it and ESLint's own range |
| 13 | `722ea6f50d`, baseline `e3bceb058c` | **DONE 2026-10-28** | `[2026-10-28: Chromium parsed DOM of the built page, scripts off: CAPA links 3 → 1, ul > :not(li) 31 → 30, elements 554 → 552; characterize-env.mjs prod_prod: heat-story alone, links.external 31 → 29, links.noAccessibleText 4 → 2; rebaseline --expect "data-features/heat-story/": that page alone in both keys, git diff -U0 those two fields only]` |
| 14 | `c5f6d50e4f` | **DONE 2026-10-28** | `[2026-10-28: npm run docs-check exit 0]`. CLAUDE.md's `docs-check verified` stamp left as it was: one line changed, the file not re-read |
| 15 | below | **DONE 2026-10-28** | Ledger edits read back: line 9, the commit-state Decisions row, step 9's 522-element claim corrected by measurement (557 → 554), the Next command's heatstory pointer replaced by a count, step 10 row added; step rows all 7 fields |
| 16 | — | **DONE 2026-10-28** | `[2026-10-28 at 38ec743279: pull_request runs 40716776779 (Smoke check) and 40716776739 (Site characterization check), both success]`. #1515 retargeted to `production`; `git merge-tree --write-tree origin/production HEAD` clean, and `production` has no commit this branch lacks. `[2026-10-28 at b7e48267ac: npm run smoke:prod_prod exit 0, 1,187 pages clean, Pagefind index served]`. The retarget alone starts no run: neither sweep workflow lists `types`, so both take `opened`/`synchronize`/`reopened`, and `b7e48267ac` carried `[skip ci]`. The ledger commit after it is pushed without the marker to start both. PR body rewritten |
| 17 | — | **DONE 2026-10-28** | `C:/temp/r1515/base`, `C:/temp/r1515/head` and this plan's `C:/temp/t2base` each had 0 changed files, and were removed with `git worktree remove`; their build output under `C:/temp` deleted |

**Next command:** none in this plan; #1515 is ready for review. The formatting ledger's deferred
`script_regions` fix in `js-comment-spacing.py`, whose trigger Tasks 7 and 8 met, is done; that
ledger's paragraph on it has the proof.

Tasks 1–12 are tool and config changes. None of them may change a tracked file outside `scripts/`,
`.editorconfig` or `package*.json`, except Task 2 (`nr-leaflet.html`) and Task 8 (the two crosswalk
files). The tools are expected to exit 1 naming only `themes/dohmh/layouts/partials/render-table.html:69`
until Task 6 lands, and 0 after it.

**Order.** Tasks run in number order, except Task 5, which sits in Stage 3 and can run at any point. Task 1 must come before Tasks 2, 3 and 4. Task 6 depends on Task 4.
Task 15 runs after Tasks 1–14, and Task 16 runs last, on the final head.

---

## Stage 1: correctness

## Task 1: Mask each Hugo action by its role, not the whole body by one mask (F1, F2, F16)

**Defect.** Today `maskHugo(text, asValue)` masks every action in a body the same way. Its callers try
the comment mask first and the value mask second. Under the comment mask, `return {{ v }}` parses as a
bare `return`. So `js-semicolons.mjs` writes `return; {{ v }}` (F1). `js-guard-braces-verify.mjs`'s
`sameBody` compares the two sides under that same first mask and calls them the same tree (F2). Neither
pattern exists in the tree today: `grep -rnE 'return \{\{' themes/dohmh/layouts` returns 0 lines
`[2026-10-28]`.

**Files:**
- `scripts/html-script-bodies.mjs:12-16` (`maskHugo`)
- Callers that loop over the two masks: `scripts/js-semicolons.mjs:108`, `scripts/js-guard-braces-verify.mjs:92-94`, `scripts/js-guard-braces.mjs:241`, `scripts/js-brace-padding.mjs:254`, `scripts/indent-normalize.mjs:106`
- Fixture calls that pass `true`: `scripts/js-semicolons.mjs:175`, `scripts/js-guard-braces.mjs:493`

**Interfaces.** Produces `maskHugo(text)`, which takes one argument. Tasks 2, 3 and 4 consume it.

- [ ] **Step 1. Add the failing fixtures first.** Put these in the fixture blocks of `js-semicolons.mjs` and
  `js-guard-braces-verify.mjs`:
  - `function f() {\n    return {{ .Params.x | jsonify }}\n}`. The semicolon tool must insert `;` after the action, not after `return`.
  - The pair `return {{ x }}` / `return; {{ x }}`. The verifier must call them different.

  Run both tools. Expected: each fixture control exits 2. This is the positive control: it shows the
  fixtures can see the defect.
- [ ] **Step 2. Change `maskHugo` to classify each action.**
  - Strip the action's `{{-` / `-}}` trim markers and leading space, then classify it.
  - A control action becomes the existing comment mask `/*___*/`. Control means it matches
    `^(if|else|end|range|with|define|block|break|continue)\b`, `^\$[A-Za-z_]\w*\s*:?=`, or `^/\*`.
  - Any other single-line action becomes the same-length identifier `____`.
  - A multi-line action stays a comment, as it does today.
  - Update the header comment to say this.
- [ ] **Step 3. Make every caller parse once.** Remove the two-mask loops. A body that fails to parse
  under the one mask is reported as unparseable, exactly as when both masks fail today.
- [ ] **Step 4. Run the fixture controls.** Run each tool's fixture control. Expected: exit 0.
- [ ] **Step 5. Re-run the three sweep tools over the tree.** Run `node scripts/js-semicolons.mjs`,
  `node scripts/js-guard-braces.mjs` and `node scripts/js-brace-padding.mjs`, saving each one's output to a
  file.
  - Expected: 0 files changed, and exit 1 naming only `render-table.html:69`.
  - Pre-registered failure: any change at all means some statement-level value action (for example
    `{{ partial "x" . }}` on its own line) now reads as an expression statement. Stop and report it.
    Don't widen the control list to make the count 0.
- [ ] **Step 6. Run the verifiers.**
  - Run `node scripts/js-guard-braces-verify.mjs` and `node scripts/js-comment-spacing-verify.mjs`
    against the `HEAD` copy. Expected: exit 0.
  - Then run their existing controls (`const`→`let` in `cooling-info.js`; a doubled space in `bar.js`).
    Expected: exit 1.
- [ ] **Step 7. Run lint.** `npm run lint`. Expected: exit 0.
- [ ] **Step 8. Commit.** Commit Task 1 alone.

## Task 2: Remove the four semicolons after Hugo actions in `nr-leaflet.html` (F3)

**Defect.** Lines 375–378 end `-}};` / `}};`. The `;` doesn't render today only because each `{{-` trims
back onto a `//` comment line, and html/template drops that comment. If that comment moves, the
template emits 1 + 2×topics + 1 stray `;`.

Only these four lines have the defect. I swept the layouts for a `;` after an `if/else/end/range/with/define/block`
action, an assignment, or a Hugo comment: 4 hits, all `nr-leaflet.html:375-378`
`[2026-10-28: grep -rnE '\{\{-?\s*(if|else|end|range|with|define|block|\$[A-Za-z_]+\s*:?=|/\*)[^}]*\}\};' themes/dohmh/layouts; control: the range-only pattern on that file returns 1]`.
The sweep covers single-line actions only.

**Files:** `themes/dohmh/layouts/partials/nr-leaflet.html:375-378`

- [ ] **Step 1. Remove the semicolons.** Delete the trailing `;` on lines 375–378. Make no other edit.
- [ ] **Step 2. Check the diff.** Expected: `git diff -U0` shows 4 line pairs that differ only by a trailing `;`.
- [ ] **Step 3. Check the tool doesn't put them back.** Re-run `node scripts/js-semicolons.mjs`.
  Expected: 0 changed. This is the proof that Task 1 stops it re-adding them. Control: run `HEAD~`'s copy
  of the tool (from before Task 1) in a throwaway worktree. It re-adds them.
- [ ] **Step 4. Build and compare.** Build `prod_prod` from before and after this task, isolated
  (`build-output-diff.py`'s docstring), and run `python scripts/build-output-diff.py`.
  - Expected: identical output, because the `;` was already trimmed away.
  - If any NR page differs, the trim reasoning was wrong. Read the page before committing.
- [ ] **Step 5. Commit.** Commit Task 2.

## Task 3: Pad a block only from its own brace tokens (F19)

**Defect.** `js-brace-padding.mjs` tests line text: `lines[openLine].trimEnd().endsWith("{")` at line
177, plus the matching closer test. Take a line like `if (x) { el.innerHTML = \`<style>.a {`. It ends
with a `{` that isn't the block's, so the tool pads inside the template literal and changes the string.
No such line exists today. Task 1's re-run changes 0 files.

**Files:** `scripts/js-brace-padding.mjs:129-139` (`braceLines`), `:173-177`

- [ ] **Step 1. Add the failing fixture.** Add the line above as a fixture. Run the tool's fixture
  control. Expected: exit 2.
- [ ] **Step 2. Test the tokens instead of the line text.**
  - Require the block's `{` token to be the last token on `openLine`: the next token in `ast.tokens`
    starts on a later line.
  - Require the `}` token to be the first token on `closeLine`.
  - Drop the line-text tests.
- [ ] **Step 3. Check the fixture and the tree.** Run the fixture control. Expected: exit 0. Re-run over
  the tree. Expected: 0 changed.

## Stage 2: consolidation

## Task 4: Move the shared parse loop and line index into `html-script-bodies.mjs` (F18)

**Duplication.** These copies exist today:
- `lineStarts` / `lineOf`: `js-guard-braces.mjs:95-107` and `js-brace-padding.mjs:154-164`.
- The loop over `scriptRegions` with the parse and the CRLF keep/restore: `js-guard-braces`, `js-brace-padding` and `js-semicolons`.

`2edcfd98c3` fixed the region detector in the shared module, which the three tools all use. This task
puts the rest of the duplicated code there as well.

**Files:** `scripts/html-script-bodies.mjs`, `scripts/js-guard-braces.mjs`, `scripts/js-brace-padding.mjs`, `scripts/js-semicolons.mjs`

**Interfaces.** Consumes Task 1's single-mask `maskHugo`. Produces three functions:
- `lineIndex(source)`, which returns `{ lineStarts, lineOf }`.
- `forEachBody(path, text, fn)`, which yields `{ body, startLine, masked }` per region, or the whole file for `.js`. It applies `fn`'s returned edits and restores CRLF.
- `unparseable(path, line)`. Task 6 uses it.

- [ ] **Step 1. Extract the helpers.** Move the code verbatim first. Then point the three tools at the
  shared helpers one at a time, one commit per tool.
- [ ] **Step 2. Check each tool's commit.**
  - Its fixture control: exit 0.
  - Its fixture mutations still rejected, as listed in ledger step 5's row.
  - A re-run over the tree: 0 changed.
  - `npm run lint`: exit 0.
  - What must be preserved: the CRLF handling (`content/` files carry CRLF on some machines), and the
    `.js`-vs-`.html` branch.

## Task 6: Let exit 0 mean clean (F17)

Note: Task 5 is in Stage 3. It is independent of this task and can run before or after it.

**Defect.** Every clean run of the three sweep tools exits 1 because of `render-table.html:69`. So a
second unparseable body exits exactly like a clean run.

**Files:**
- Exit lines: `scripts/js-semicolons.mjs:224`, `scripts/js-guard-braces.mjs:536`, `scripts/js-brace-padding.mjs:494`
- The list: `scripts/html-script-bodies.mjs`, beside Task 4's helpers

- [ ] **Step 1. Add the allowlist.** Add `KNOWN_UNPARSEABLE = new Map([["themes/dohmh/layouts/partials/render-table.html", "its {{ if }}…{{ else }}…{{ end }} sits inside a JS value"]])`.
  - The tools print the known entry on its own line and exit 0 when only known entries failed.
  - An entry that now parses fails the run, so a fixed file can't stay listed.
- [ ] **Step 2. Prove each exit path.**
  - At the tree: all three exit 0, and each prints the render-table line.
  - Control 1: add a stray `{{ if }}` inside a JS value in `temp-popup.html`. Expected: exit 1 naming it.
  - Control 2: empty the Map. Expected: exit 1 naming render-table.
- [ ] **Step 3. Update the docs.** Update ledger step 5's row and the Next-command paragraph
  ("exit 1 … is expected") in the same commit.

## Stage 3: smaller tool and config fixes

## Task 5: Read the comment-spacing verifier's file list against `HEAD` (F9)

**Defect.** `scripts/js-comment-spacing-verify.mjs:71` runs `git diff --name-only` with no `HEAD`, which
compares the working tree to the index. Once a sweep's edits are staged, it compares 0 files and exits 0.

- [ ] **Step 1. Diff against `HEAD`.** Add `"HEAD"` after `"--name-only"`, matching
  `js-guard-braces-verify.mjs:151`.
- [ ] **Step 2. Refuse an empty comparison.** If 0 files are compared, print that and exit 2, so an
  empty comparison can't read as a pass.
- [ ] **Step 3. Check it on staged edits.** Double a space in `bar.js` and `git add` it. Expected: exit 1
  naming `bar.js`. Before this task the same steps gave exit 0 with 0 files compared. Restore the file.

## Task 7: Exclude `*.min.js` in the Python target list (F10)

**Files:** `scripts/js-comment-spacing.py:197`

- [ ] **Step 1. Add the filter.** Add `and not p.endswith(".min.js")` to the target filter, matching
  `js-sweep-targets.mjs`'s `sweepTargets`.
- [ ] **Step 2. Compare the two lists.** Print both target lists and diff them. Expected: identical.
  Before this task the Python list also held `accessible-autocomplete.min.js`, `jquery-3.3.1.min.js` and
  `modernizr-3.6.0.min.js`. That difference is the control.

## Task 8: Treat the generated crosswalks as vendored and restore their bytes (F5)

**Defect.** The crosswalk files are `assets/js/ccd-to-uhf42.js` and `assets/js/cd-to-uhf42.js`.
`documents/js-conventions.md:10` exempts both, and ledger Decisions row 33 keeps them out. But neither
target list does. The only change on this branch is `840ede9674`'s `]` → `];` in each
`[2026-10-28: git log 8ca6013616..HEAD -- both files names only 840ede9674; --stat 1+/1− each]`.

**Files:** `scripts/js-sweep-targets.mjs:15-22`, `scripts/js-comment-spacing.py:63` (`VENDORED`), both crosswalk files

- [ ] **Step 1. Add the files to the lists.** Add both paths to both `VENDORED` lists. Correct the
  comment above `js-sweep-targets.mjs`'s list: it is hand-maintained and includes generated files.
- [ ] **Step 2. Restore the files.** `git checkout 840ede9674~1 -- assets/js/ccd-to-uhf42.js assets/js/cd-to-uhf42.js`.
  Expected: `git diff 8ca6013616 -- <both>` is empty.
- [ ] **Step 3. Check the tools leave them alone.** Re-run `js-semicolons.mjs`. Expected: neither file
  is named and 0 changed. Control: the same run with Step 1 reverted re-adds both `;`.

## Task 9: Guard the one-shot indentation tools against a second run (F4, F8; D3)

**Defect.** Both tools exit 0 on a re-run and damage the tree:
- `indent-rescale.mjs` doubles the indentation again. Its `--verify` then passes, because halving the
  doubled file gives `HEAD` back.
- `indent-normalize.mjs` re-indents the 9a hand pass.

The review measured these: 2,405 lines in 9 files and 27 lines in 3 files respectively.

**Files:** `scripts/indent-rescale.mjs:13-14, 71-110`, `scripts/indent-normalize.mjs:17-18` and its run path

- [ ] **Step 1. Add the guard.** Before writing anything, each tool runs
  `git merge-base --is-ancestor <its sweep commit> HEAD`: `81ae3b4ea0` for the rescale, `91aa287079` for
  normalize. If the sweep commit is an ancestor, the tool prints "already applied at <hash>; this tool is
  a record of step 7/8, not a re-runnable sweep" and exits 2. `--verify` gets the same refusal.
- [ ] **Step 2. Update the headers.** Each header's usage lines say the same thing, in place of the run
  commands they give now.
- [ ] **Step 3. Prove the guard fires and stays narrow.**
  - At HEAD, in a throwaway worktree: both tools exit 2 and `git status` is clean.
  - Control: in a worktree at `81ae3b4ea0~1`, with the new script copied in, the rescale still runs and
    changes 11 files. The same control for normalize at `91aa287079~1`, which changes 33 files.

## Task 10: Refuse leading-whitespace changes inside `<pre>`/`<textarea>` in the build comparison (F11)

**Files:** `scripts/build-output-diff.py:22-30` (docstring), `:99` (the `leading_ok` branch)

- [ ] **Step 1. Narrow the acceptance.** A pair accepted as "leading whitespace only" is moved to
  "changed" if any line whose leading whitespace differs sits inside `<pre>…</pre>` or
  `<textarea>…</textarea>` in either file.
- [ ] **Step 2. Name each accepted file.** Print every file accepted as leading-whitespace-only, so a
  reader can open each one.
- [ ] **Step 3. Document the blind spot.** The docstring says the tool can't see JS template literals in
  built output. For a re-indent, the source commit's own record must list every multi-line template
  literal it touched, as ledger step 7's row did for `minimum-wage-with-maps.html:469`.
- [ ] **Step 4. Check both paths.**
  - Control 1: re-indent one line inside a `<pre>` in a copy of a built page. Expected: exit 1.
  - Control 2: re-indent a line outside any `<pre>`. Expected: still accepted.
  - Re-run the 9a comparison (`3177305899` vs `fc6eee395d` builds). Expected: still exit 0, with the 16
    files named.

## Task 11: Fix `.editorconfig`'s exemptions and stale comment (F6, F7)

**Defects.**
- `insert_final_newline` would add a newline to shortcodes whose output is inlined. 8 of the 10
  shortcodes end without one: `baseurl`, `datawrapper`, `rawhtml`, `relURL`, `storyheader`,
  `updateflag`, `vega` and `vega0` `[2026-10-28: tail -c1 over themes/dohmh/layouts/shortcodes/*.html]`.
  The review measured that a newline added to `relURL.html` changes 54 built pages.
- `trim_trailing_whitespace` would break the tracked `.patch`.
- Lines 10–11 say the mixed partials "wait for the structural re-indent", which steps 8 and 9 have since
  done.
- The vendored section lists none of the vendored `.js` files.

**Files:** `.editorconfig`

- [ ] **Step 1. Add the sections.**
  - `[themes/dohmh/layouts/shortcodes/*.html]` with `insert_final_newline = unset`.
  - `[*.{patch,diff}]` with `trim_trailing_whitespace = false`.
  - The `VENDORED` paths, the two crosswalks from Task 8 included, in the generated/vendored section.
- [ ] **Step 2. Fix the comment.** Rewrite lines 10–11 to describe what is true now.
- [ ] **Step 3. Check the file.** No automated EditorConfig check exists in this repo, and VS Code needs
  an extension for it (ledger, last paragraph). The proof is a read-through, plus one check: every
  section glob matches at least one tracked file (`git ls-files` per glob).

## Task 12: Declare `espree` as a dev dependency (F20)

Five scripts import `espree`, but `package.json` doesn't declare it. It resolves only because npm
hoists eslint's copy. The lockfile has `espree ^11.2.0` under eslint (`package-lock.json:3514`
`[2026-10-28]`).

- [ ] **Step 1. Install it pinned.** Run `npm install --save-dev --save-exact espree@<the installed version>`.
  Read the version from `node_modules/espree/package.json` first. Use `--save-exact`, because of the
  caret trap in CLAUDE.md § Commands.
- [ ] **Step 2. Check the result.**
  - `git diff package.json` shows one added line.
  - `npm ls espree` shows one version.
  - The three sweep tools' fixture controls exit 0.

## Stage 4: markup, docs, records

## Task 13: Close heatstory's `CAPA Strategies` link (F12; D2)

**Defect.** `themes/dohmh/layouts/data-features/heatstory.html:287` reads
`<li><a href="https://www.capastrategies.com/" target="_blank">CAPA Strategies</li>`. The browser
re-creates that `<a>` outside its `<li>` and again inside the next item. The review saw it three times in
the parsed DOM, on both base and head.

- [ ] **Step 1. Measure the baseline.** Count `a[href*=capastrategies]` in the built heat-story page,
  read off the browser's parsed DOM. Expected: 3.
- [ ] **Step 2. Fix the markup.** Insert `</a>` before `</li>`. Make no other edit.
- [ ] **Step 3. Re-measure.** The same count. Expected: 1, and every `<ul>` child is an `<li>`.
- [ ] **Step 4. Run site characterization.** Run `node scripts/characterize-env.mjs prod_prod`.
  Expected: only `/data-features/heat-story/` differs, in `links`.
  - Re-baseline that page with `site-characterization-rebaseline.mjs --expect "<that page>"`.
  - Tally `git diff -U0` by key before committing, per CLAUDE.md.
- [ ] **Step 5. Commit.** Commit this task alone.

## Task 14: Record YAML's 2-space exception in CLAUDE.md (F15; D4)

- [ ] **Step 1. Edit the line.** At `CLAUDE.md:592`, change the line to
  "4-space indentation in all files, except YAML at 2 (`.editorconfig`)."
- [ ] **Step 2. Run docs-check.** `npm run docs-check`. Expected: exit 0.

## Task 15: Correct the formatting ledger (F13, F14)

**Files:** `documents/js-formatting-pass-2026-10-19.md`: line 9, Decisions row "This session may commit
the production merge only", step 9's row, and the Next command

- [ ] **Step 1. Line 9.** Drop "the 36 mixed-indent files wait on Chris". Steps 8 and 9 re-indented them.
- [ ] **Step 2. The commit-state row.** Replace "Steps 6b and 7 are proved and left for Chris to commit"
  with the commits that carry them, `f5ed8708e5` and `81ae3b4ea0`.
- [ ] **Step 3. Step 9's row and `1654d60788`'s description.**
  - Count again what 9b removed from heatstory, from `git show 1654d60788 -- themes/dohmh/layouts/data-features/heatstory.html`.
    The review read it as two `</div>`, one `</li>` and three empty `<a>`.
  - Measure the parsed element count before and after again. The review read 522 → 519.
  - Record what is measured, not the review's numbers. The commit message stays wrong, because it is
    pushed. The row says so.
- [ ] **Step 4. The Next command.** The pointer to "the surplus `</div>` at heatstory.html:309" is stale.
  Re-check the file's `div` balance and either drop the pointer or point it at what is actually open.
- [ ] **Step 5. Record this plan's results.** Add a row for this plan, naming its commits.

## Task 16: Retarget, smoke, and fix the PR body (D1)

- [ ] **Step 1. Retarget the PR.** After D1: `gh pr edit 1515 --base production`.
- [ ] **Step 2. Confirm CI ran.** Check that both sweep workflows started on the head commit
  (`gh run list --commit <head>`). A conflicting PR runs zero workflows (memory
  `project-pr-checks-need-a-mergeable-pr`).
- [ ] **Step 3. Run smoke locally.** `npm run smoke:prod_prod` at the final head, output to a file.
  Record `git rev-parse HEAD` beside the result. No smoke run has covered steps 6b–9, including 9b's
  code edits.
- [ ] **Step 4. Update the PR body.** Its Verification section cites `534daf9424`. Rewrite it to cite
  the final head and the checks that ran on it. Check each sentence against this ledger before
  `gh pr edit`.

## Task 17: Remove the review's worktrees

The review left `C:/temp/r1515/base` and `C:/temp/r1515/head` (both clean), plus build output under
`C:/temp/r1515/`.

- [ ] **Step 1. Confirm they are clean.** `git -C C:/temp/r1515/base status --short` and the same for
  `head`. Expected: empty.
- [ ] **Step 2. Remove them.** `git worktree remove C:/temp/r1515/base`, the same for `head`, then delete
  `C:/temp/r1515/`.
