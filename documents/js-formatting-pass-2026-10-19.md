# JS formatting pass (2026-10-19)

**Done 2026-10-22, `d8708f0f35` through `534daf9424` on `feature-js-formatting`:** steps 1–5, the
step 4 sweep taken before #1491 merged (Decisions, first row). One body is left unparsed on
purpose, `partials/render-table.html` (step 5's row).

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
| A function body with a blank line between its first and last lines is padded at any length | Opening with a one-line guard (+40/−22 in 23 files); the same grouped rule for every block (+133/−17 in 37) | Chris, 2026-10-21, on `global.js` `trackDataExplorerOption`, which step 5b's collapse left at two lines in two groups. The hand pass padded 17 of 21 such short bodies; measured over the tree at `d93df12820`, this rule's 5a re-run does +106/−18 in 32 files |
| An `if` with no `else` is padded when longer than three non-blank lines | Padding only bodies with internal groups; never padding a lone `if` | Chris, 2026-10-21. The pass split 4 padded / 4 one end / 4 tight on 4+-line cases |
| A multi-line object literal is padded only when it is longer than three lines and holds a function value; specs, configs and data stay tight, nested objects never | Outermost objects only; every object over three lines; options passed to a call | Chris, 2026-10-21 ("not specs or data"). Selects exactly `DataTable({` and `L.geoJson(exportGeojson, {` from the pass's four padded objects; `nr-report/chart.js` `spec` and `NR_REPORT_CONFIG`, which the pass padded, stay tight |
| A padded block whose last line is a closer (`}`, `});`, `]`) gets no bottom blank line | Always padding both ends | Chris, 2026-10-21. The pass did this in 24 of 35 one-end paddings and padded the bottom anyway in 27 blocks |
| Inside a block of three lines or fewer, no blank line before a `return` | A return gap in every block | Chris, 2026-10-21 |
| A comment that is a block's first line keeps the gap after `{` even when the block stays tight; step 4's sweep stands | Dropping the gap in tight blocks and reverting those step-4 insertions | Chris, 2026-10-21 (`table.js` `getTableColumnSearchValues`'s `return {`) |
| Rules derived from Chris's 2026-10-19 hand pass, recovered from that session's scratchpad and kept as `documents/js-formatting-hand-pass-2026-10-19.patch` | — | The patch rebuilds against its base blobs to its recorded post-image hash on all 20 files `[verified 2026-10-21]`; the rows above are measured against it. Rebuild under a short path such as `C:/temp`: `git apply` fails with `Filename too long` under the scratchpad |
| A single-statement `if` with no `else` is one line, unbraced, when that line is 60 characters or fewer from `if` to the end, and braced otherwise, in both directions: long one-liners gain braces. A statement spanning lines, or a comment inside the braces, keeps them | 89 including indentation (Chris's first answer, withdrawn the same day: 241 collapses); 40 from `if` (75 collapse, 98 gain braces; swept, then replaced by 60 the same day); no cap (323); 120 (295); at 40, measuring the whole line (60 / 110) or the condition alone (251 / 10) | Chris, 2026-10-21: "it's especially hard to visually parse a long conditional", measured from `if`; the cap set in `scripts/js-guard-braces.mjs` `MAX_LENGTH`. At 60, counted on HEAD `b6311515c6`: 171 collapse, 43 of 154 one-liners gain braces (the sweep braced 42; `congestion-pricing-report/shared.js:89` sits inside a one-line callback, which the tool leaves alone). The hand pass collapsed 9 of 181 candidates in its 20 files, all 38 characters or shorter, and left plain early returns braced beside them, so it was a sample, not a rule; § Statements is the spec |
| Only return, throw, break, continue and expression statements collapse; a missing semicolon is added | Collapsing any single statement | Not asked: a declaration is a SyntaxError as an unbraced `if` body, a nested `if` reads as `if (a) if (b)`, and without the `;` ASI can join the statement to a next line opening with `(` |
| `healthy-homes-info/source/assets/js/bootstrap.js` and `popper.js` are vendored | Leaving them as targets | Minified Bootstrap 4.1.3 and Popper under plain `.js` names; they were targets in steps 4 and 5a, which changed neither (`git show --stat b7eba45592`). The target lists now live in `scripts/js-sweep-targets.mjs` for the two `.mjs` tools; `js-comment-spacing.py` keeps a mirrored copy |
| Step 5c's semicolons come from `scripts/js-semicolons.mjs`, ESLint's `semi` rule run through its `Linter` API over the sweep targets, applying only bare `;` insertions | `npx eslint --fix --rule "semi: error"`, which this ledger's next-command block named | `eslint.config.mjs` (ESLint 10.8.0) configures only `assets/js/data-explorer` and `assets/js/nr-report`, so ESLint skips every other target, and it cannot read a layout's `<script>` bodies. Not a rule decision: § Statements already requires the semicolon |
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
| 5 | Hand pass for the rules the script does not apply, commit separately; `npm run lint`, `npm run smoke:all` | 5a: `feature-js-formatting @ 6427745337` (tool, verifier, build comparison), `b7eba45592` (sweep). 5b: `5d01f8c6a1` (`js-guard-braces.mjs`, its verifier, `js-sweep-targets.mjs`), `d93df12820` (sweep); then 5a again: `bf1abdbf2a` (grouped-body rule), `e9288b7e86` (re-run). 5c: `c06078c8d0` (`js-semicolons.mjs`), `840ede9674` (sweep). 5d, the hand look: `4544b304e8` (`shared.js` guard), `cb6e35aa60` (`render-table.html` padding), `2edcfd98c3` (detector fix), `534daf9424` (5c's `js_bottom.html` semicolons removed) | **DONE 2026-10-22**. Chris chose (b). 5d: `congestion-pricing-report/shared.js`'s 69-character guard inside a one-line `forEach` braced by hand; `render-table.html` padded by hand, and left unparsed by the tools on purpose — its `{{ if }}…{{ else }}…{{ end }}` sits inside a JS value. `minimum-wage-with-maps.html` was a detector bug, not a body: `scriptRegions` in `html-script-bodies.mjs` read a src-only `<script` whose opening tag spans lines as a body. The same bug made `js_bottom.html`'s four split src-only tags read as JS, and since their attribute lines parse, `840ede9674` appended `;` to 12 of them in a partial every page loads; `534daf9424` removes them. The 5a note below that `minimum-wage-with-maps.html` was "left untouched" is wrong: `b7eba45592` padded its real body (line 334 on) and skipped only the false region. 5a, `scripts/js-brace-padding.mjs` applying the brace rules; 5b, one-line guards at a 60-character cap, both directions; 5c, semicolons. 5b: 171 guards collapsed and 42 one-liners braced in 44 files. The 5a re-run after 5b: +106/−18 blank lines in 32 files, including Chris's new grouped-body rule (Decisions). 5c: 1,363 semicolons in 53 files, by `js-semicolons.mjs` rather than `eslint --fix` (Decisions). 5a's sweep: 1,297 blank lines inserted and 398 removed in 85 files; two layout bodies it cannot parse are left untouched (`data-features/minimum-wage-with-maps.html`, whose detected body is markup, and `partials/render-table.html`, whose `{{ if }}…{{ else }}…{{ end }}` sits inside a JS value) | 5a sweep, before commit: `[2026-10-21: node scripts/js-comment-spacing-verify.mjs exit 0, 85 files, 0 changed tokens, 0 changed non-blank lines; that check's control, one doubled space in bar.js, exit 1; the tool's fixture control rejected 5 of 6 rule mutations (the sixth, loops, a no-op sed); re-run changes 0; npm run lint exit 0; step 4's 20 layouts re-read through the new .html path, token-identical, 16,066 tokens]`. `[2026-10-21: prod_prod built three times into temp dirs — base 41ab26e5f3 in a worktree, the swept tree, base again — all exit 0, 0 ERROR; python scripts/build-output-diff.py base→base exit 0 (3,017 identical, 3 build_datetime only), base→sweep exit 0 (2,003 identical, 1,017 blank lines only, 0 one-sided after fingerprint pairing); its control, one <title> edited in a built page, exit 1 naming it]`. 5b: `[2026-10-21/22: js-guard-braces.mjs fixture control exit 0 at caps 17–200 and 2 at 16; 12 of 12 rule mutations rejected; node scripts/js-guard-braces-verify.mjs exit 0, 44 files, same syntax tree as HEAD; its controls — a token in measures.js, a token, a Hugo action and a markup edit in temp-popup.html — each exit 1; re-run changes 0; npm run lint exit 0; prod_prod built from 5d01f8c6a1 and the swept tree, both exit 0, 1,007 files changed, all 1,007 the same syntax tree after unbracing, by a scratch checker whose controls (one built-JS token, one built <title>) exit 1]`. 5a re-run: `[2026-10-22: fixture control exit 0, and 2 under each of two mutations (grouped rule removed; applied to every block); js-comment-spacing-verify.mjs exit 0, 32 files, 0 changed tokens, 0 changed non-blank lines; re-run 0; lint exit 0; build-output-diff.py exit 0, 31 files blank lines only, the 32nd source (restaurant-grades) a draft page that is never built]`. 5c: `[2026-10-22: js-semicolons.mjs fixture control exit 0, and 2 with the rule set to "never"; js-guard-braces-verify.mjs exit 0, 53 files; the diff's 1,354 line pairs differ only by ";", adding 1,363; re-run 0; lint exit 0; prod_prod builds both exit 0, 997 files changed, all the same syntax tree, checker controls exit 1; npm run smoke:prod_prod exit 0, 1,187 pages clean, Pagefind index served, 4 net::ERR_NETWORK_CHANGED failures clean on sequential re-check]` — that smoke run and the syntax-tree checker both passed with the attribute semicolons in place, since browsers tolerate them and neither instrument reads HTML attributes. 5d: `[2026-10-22: scriptRegions dumped for all 171 tracked .html files before and after the fix — changed only minimum-wage-with-maps.html (false region [270,275] gone), js_bottom.html (4 false regions gone, Google Translate body kept) and 5 static/nyccas pages, which are not sweep targets; js_bottom.html 0 diff lines against 840ede9674~1; js-brace-padding, js-guard-braces and js-semicolons each re-run over 198 targets, 0 changed, exit 1 naming only render-table.html:69; js-guard-braces-verify.mjs: shared.js same syntax tree as HEAD; render-table.html 0 non-blank changed lines by git diff -U0 --ignore-blank-lines (the same probe on shared.js: 6) and js-comment-spacing-verify.mjs reads it, 0 unreadable; npm run lint exit 0, which does not cover congestion-pricing-report/]` |

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

None; the pass is done. The three step-5 tools exit 1 naming
`themes/dohmh/layouts/partials/render-table.html:69` and nothing else, and that exit is expected
(step 5's row). Any other file named is new.

To change a rule later, re-run its tool: `node scripts/js-guard-braces.mjs` (cap: `MAX_LENGTH`,
steps in its header), `node scripts/js-brace-padding.mjs`, `node scripts/js-semicolons.mjs`,
each proved as in step 5's row.

Deferred, not part of step 5: `js-comment-spacing.py`'s `script_regions` reads a `<script>` mentioned
inside a Hugo comment as the start of a body, which `html-script-bodies.mjs` fixed by masking Hugo
actions first (`flexdatalist-combobox-js.html` and `structured-data.html` showed it). It also
starts a body inside a split src-only `<script` tag, which `2edcfd98c3` fixed in the `.mjs`
detector; harmless so far, since the script only acts after a comment. Un-defer when
that script is next run or edited.

A re-run of 5a: `node scripts/js-brace-padding.mjs`, then `node scripts/js-comment-spacing-verify.mjs`
(exit 0) and the build comparison in `scripts/build-output-diff.py`'s docstring (exit 0). The tool
exits 1 naming `render-table.html`, as above. A guard or semicolon run changes
tokens, so the build comparison reports changed pages for it; read what it names rather than
expecting 0.

If #1491 takes another commit first, merge it in before step 5: a conflict in a file only step 4
touched is resolved by taking #1491's side and re-running the script, as above.

VS Code ignores `.editorconfig` without the EditorConfig extension, which was not installed on
Chris's machine on 2026-10-19 (`code --list-extensions`, 77 extensions, none matching).
