# JS formatting pass (2026-10-19)

**Status as of 2026-10-21:** steps 1–4 done on `feature-js-formatting`, the sweep taken before
#1491 merged (Decisions, first row); step 5, the hand pass, parked on its scope.

## Decisions

| Decision | Rejected | Why |
|---|---|---|
| Write the rules now; sweep the tree only after #1491 merges | Sweeping now, on #1491 or on a branch stacked on it | The R14 ledger (`documents/nr-audit-r14-fixes-2026-10-18.md`, Decisions) left the comment-spacing sweep out of #1491 as diff noise, and a sweep taken now conflicts with every remaining R14 step (all six of its files would be reformatted). Chris, 2026-10-19. **Superseded 2026-10-21:** Chris merged #1491's branch into this one at `659d6cf339` and asked to continue, with #1491 still open. Both reasons had expired: the R14 ledger reads complete, and every task in `documents/pr-1491-xhigh-review-fixes-2026-10-20.md` is done. Cost: a further fix on #1491 conflicts with step 5's hand pass (step 4 is regenerable) |
| `feature-js-formatting` cut from `feature-MOD-Lab-NR-recode-refactor-merge` at `295046215b`, brought up to date with it before the sweep | Cutting from `production` | The sweep covers `assets/js/nr-report/` and NR templates that exist only on #1491 until it merges |
| Withdraw "Forward-only" in `js-conventions.md` | Keeping it | Once #1491 merges, the reformat is no longer noise. Chris, 2026-10-19 |
| A comment above an object property whose value is a multi-line block gets the gap; a single-line value does not | Exempting all object-property comments | Chris, 2026-10-19. `js-comment-spacing.py` still exempts all of them, so this half is by hand |
| A function body of two lines or fewer stays unpadded | Padding every body | Chris, 2026-10-19 (`setBarSelection`). **Superseded 2026-10-21:** three lines, below |
| A multi-line object literal follows the "any other block" rule: padded when longer than ~3 lines | A rule for spec/config objects only; never padding objects | Chris, 2026-10-19. Fits the hand-pass examples: it padded `DataTable({`, `L.geoJson(exportGeojson, {`, `NR_REPORT_CONFIG = {`, `nr-report/chart.js` `spec` (7–165 lines each, measured 2026-10-19) and `table.js` `getTableColumnSearchValues`'s `return {`, and left `measures.js` `getSyncedLinksState`'s 3-line returns tight. **Superseded 2026-10-21:** only objects holding a function, below |
| Function and callback bodies of three non-blank lines or fewer stay tight; four or more are padded | Two lines (the 2026-10-19 row); a line-length test | Chris, 2026-10-21. In the hand pass, 22 of 28 two- and three-line bodies near a padded block fit it, against 16 of 28 for two lines. Chris's reason for padding a short body was a long line, but no length threshold reproduces the pass: padded bodies' longest lines ran 44–91 characters, tight ones' up to 133 |
| An `if` with no `else` is padded when longer than three non-blank lines | Padding only bodies with internal groups; never padding a lone `if` | Chris, 2026-10-21. The pass split 4 padded / 4 one end / 4 tight on 4+-line cases |
| A multi-line object literal is padded only when it is longer than three lines and holds a function value; specs, configs and data stay tight, nested objects never | Outermost objects only; every object over three lines; options passed to a call | Chris, 2026-10-21 ("not specs or data"). Selects exactly `DataTable({` and `L.geoJson(exportGeojson, {` from the pass's four padded objects; `nr-report/chart.js` `spec` and `NR_REPORT_CONFIG`, which the pass padded, stay tight |
| A padded block whose last line is a closer (`}`, `});`, `]`) gets no bottom blank line | Always padding both ends | Chris, 2026-10-21. The pass did this in 24 of 35 one-end paddings and padded the bottom anyway in 27 blocks |
| Inside a block of three lines or fewer, no blank line before a `return` | A return gap in every block | Chris, 2026-10-21 |
| A comment that is a block's first line keeps the gap after `{` even when the block stays tight; step 4's sweep stands | Dropping the gap in tight blocks and reverting those step-4 insertions | Chris, 2026-10-21 (`table.js` `getTableColumnSearchValues`'s `return {`) |
| Rules derived from Chris's 2026-10-19 hand pass, recovered from that session's scratchpad and kept as `documents/js-formatting-hand-pass-2026-10-19.patch` | — | The patch rebuilds against its base blobs to its recorded post-image hash on all 20 files `[verified 2026-10-21]`; the rows above are measured against it. Rebuild under a short path such as `C:/temp`: `git apply` fails with `Filename too long` under the scratchpad |
| The multi-line-value comment gap stays a hand pass; `js-comment-spacing.py` is not taught it | Adding a "property line ends in `{ [ (`" test to the script | Chris, 2026-10-19. 20 sites in 4 files on 2026-10-19, a floor because multi-line ternary values evade the probe; see step 5 |

The rules were extracted from a hand pass over 20 files that Chris made as examples on
2026-10-19 and then discarded, along with a staged run of the script. The hand pass survived as a
patch in a session scratchpad and is now tracked (Decisions, last row). The code examples in `js-conventions.md` (`setBarSelection`, `addResizeHandler`, `L.control`) are
taken from that pass.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Rules into `js-conventions.md`; `.editorconfig` | `feature-js-formatting @ d8708f0f35` | **DONE 2026-10-19** | `npm run docs-check` exit 0 — but neither `js-conventions.md` nor this file opts in (no `docs-check source-roots` comment), so that run checked neither; corrected 2026-10-19 |
| 2 | Settle the two rule questions (object-literal padding; script vs hand for multi-line values) | `feature-js-formatting @ 955adbf64d` | **DONE 2026-10-19** — see the last two Decisions rows | Prose only; re-read of the edited `js-conventions.md` "Any other block" bullet. No tool covers these docs |
| 3 | Merge #1491's branch (or `production`) into this branch | `feature-js-formatting @ 659d6cf339` (merge of `feature-MOD-Lab-NR-recode-refactor-merge` at `9a474a5c0b`) | **DONE 2026-10-21**, before #1491 merged | — |
| 4 | `python scripts/js-comment-spacing.py`, commit alone | `feature-js-formatting @ c6f2a481be` (script), `d2d80dc7e2` (sweep) | **DONE 2026-10-21** | First run also touched 9 files under `data-explorer-old/` (19 lines), which `js-conventions.md` § Scope exempts; discarded, and `c6f2a481be` adds `EXEMPT_DIRS` to the script so a re-run cannot put them back. Second run: 313 lines across 50 files (30 `.js`, 20 `.html`). `[verified 2026-10-21: git diff -U0 with the script excluded, 0 non-blank + lines and 0 - lines; node scripts/js-comment-spacing-verify.mjs exit 0, 30 files, 0 changed tokens; positive control, a blank line injected after data-explorer/map.js:240 inside a template literal, exit 1, restored exit 0; the 58 .html insertions read by eye, all inside <script> bodies, none in markup or a {{ }} action; npm run lint exit 0; re-run inserts 0]` |
| 5 | Hand pass for the rules the script does not apply, commit separately; `npm run lint`, `npm run smoke:all` | | **Parked 2026-10-21** on a scope decision from Chris — see below the table | — |

Step 5 has a starting list for the multi-line-value gap: a comment directly above a property line
ending in `{`, `[` or `(`, over `git ls-files assets/js content themes/dohmh/layouts`, excluding
`data-explorer-old`. On 2026-10-19 that found 20, in `data-explorer/global.js` (9),
`congestion-pricing-report/chart-tod.js` (5), `data-explorer/table.js` (5) and `nr-report.html` (1).
The probe misses multi-line ternary values like `timeSearch` in `table.js`
`getTableColumnSearchValues`, so read each file too. Object-literal padding (Decisions) is also
by hand: the script does not check block length.

Re-run 2026-10-21 on `d2d80dc7e2`: 19 sites, the same three `.js` files at 5/9/5. The
`nr-report.html` site is gone — no comment now sits directly above a block-opening property in
`NR_REPORT_CONFIG`.

**Step 5 is wider than the two items above.** "The rules the script does not apply" also takes in
the brace-padding rules (§ Vertical whitespace: function bodies over two lines, every
if/else/try branch, any other block over ~3 lines) wherever the block's first line is code,
since the script pads a brace only when a comment follows it. An indentation-based count over
the 63 tracked `.js` files (`.html` not counted) found 343 unpadded function bodies, 787
branches and 1,257 other blocks, in 60 files `[2026-10-21: heuristic, not a parser]`. The three
top files — `assets/js/ccd-to-uhf42.js`, `assets/js/cd-to-uhf42.js`,
`content/data-features/heat-story/embed/config.js` — are mostly data arrays and account for
~580. That is not a hand pass, so the open choice is between (a) the two listed items only,
leaving brace padding forward-only; (b) teaching the script brace padding, with a data-file
exemption; (c) a hand pass over a named subset of files. Those counts used the pre-2026-10-21
thresholds. (b) is more practical than it looked: `espree`, already imported by
`scripts/js-comment-spacing-verify.mjs`, gives exact brace matching, and padding is blank-line
insertion that the verifier proves. The hand pass also collapsed one-line guards and added
semicolons (`js-conventions.md` § Statements); those change tokens, so they need their own
commits and proofs (`eslint --fix` with `semi` for the second).

Step 4's commit is regenerable: on a conflict in a file only it touched, take the other side and
re-run the script (idempotent). Step 4's proof is the three checks in the script's docstring.

## Next command

Step 5: Chris picks (a), (b) or (c) above; every rule question is settled (Decisions). For
(a), apply the gap at
the 19 sites, then read `data-explorer/global.js`, `table.js` and `chart-tod.js` for multi-line
ternary values the probe misses. After the hand pass,
`npm run lint` (exit 0) and `npm run smoke:all` (exit 0, `Pagefind index: served`).

If #1491 takes another commit first, merge it in before step 5: a conflict in a file only step 4
touched is resolved by taking #1491's side and re-running the script, as above.

VS Code ignores `.editorconfig` without the EditorConfig extension, which was not installed on
Chris's machine on 2026-10-19 (`code --list-extensions`, 77 extensions, none matching).
