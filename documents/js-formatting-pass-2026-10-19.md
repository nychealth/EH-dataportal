# JS formatting pass (2026-10-19)

**Status as of 2026-10-19:** rules written and settled (steps 1–2) on `feature-js-formatting`;
the sweep itself waits for #1491 to merge (steps 3–5).

## Decisions

| Decision | Rejected | Why |
|---|---|---|
| Write the rules now; sweep the tree only after #1491 merges | Sweeping now, on #1491 or on a branch stacked on it | The R14 ledger (`documents/nr-audit-r14-fixes-2026-10-18.md`, Decisions) left the comment-spacing sweep out of #1491 as diff noise, and a sweep taken now conflicts with every remaining R14 step (all six of its files would be reformatted). Chris, 2026-10-19 |
| `feature-js-formatting` cut from `feature-MOD-Lab-NR-recode-refactor-merge` at `295046215b`, brought up to date with it before the sweep | Cutting from `production` | The sweep covers `assets/js/nr-report/` and NR templates that exist only on #1491 until it merges |
| Withdraw "Forward-only" in `js-conventions.md` | Keeping it | Once #1491 merges, the reformat is no longer noise. Chris, 2026-10-19 |
| A comment above an object property whose value is a multi-line block gets the gap; a single-line value does not | Exempting all object-property comments | Chris, 2026-10-19. `js-comment-spacing.py` still exempts all of them, so this half is by hand |
| A function body of two lines or fewer stays unpadded | Padding every body | Chris, 2026-10-19 (`setBarSelection`) |
| A multi-line object literal follows the "any other block" rule: padded when longer than ~3 lines | A rule for spec/config objects only; never padding objects | Chris, 2026-10-19. Fits the hand-pass examples: it padded `DataTable({`, `L.geoJson(exportGeojson, {`, `NR_REPORT_CONFIG = {`, `nr-report/chart.js` `spec` (7–165 lines each, measured 2026-10-19) and `table.js` `getTableColumnSearchValues`'s `return {`, and left `measures.js` `getSyncedLinksState`'s 3-line returns tight |
| The multi-line-value comment gap stays a hand pass; `js-comment-spacing.py` is not taught it | Adding a "property line ends in `{ [ (`" test to the script | Chris, 2026-10-19. 20 sites in 4 files on 2026-10-19, a floor because multi-line ternary values evade the probe; see step 5 |

The rules were extracted from a hand pass over 20 files that Chris made as examples on
2026-10-19 and then discarded, along with a staged run of the script. Nothing tracked keeps them;
the code examples in `js-conventions.md` (`setBarSelection`, `addResizeHandler`, `L.control`) are
taken from that pass.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Rules into `js-conventions.md`; `.editorconfig` | `feature-js-formatting @ d8708f0f35` | **DONE 2026-10-19** | `npm run docs-check` exit 0 — but neither `js-conventions.md` nor this file opts in (no `docs-check source-roots` comment), so that run checked neither; corrected 2026-10-19 |
| 2 | Settle the two rule questions (object-literal padding; script vs hand for multi-line values) | | **DONE 2026-10-19** — see the last two Decisions rows | Prose only; re-read of the edited `js-conventions.md` "Any other block" bullet. No tool covers these docs |
| 3 | After #1491 merges: merge it (or `production`) into this branch | | BLOCKED on #1491 merging | — |
| 4 | `python scripts/js-comment-spacing.py`, commit alone | | BLOCKED on 3 | — |
| 5 | Hand pass for the rules the script does not apply, commit separately; `npm run lint`, `npm run smoke:all` | | BLOCKED on 4 | — |

Step 5 has a starting list for the multi-line-value gap: a comment directly above a property line
ending in `{`, `[` or `(`, over `git ls-files assets/js content themes/dohmh/layouts`, excluding
`data-explorer-old`. On 2026-10-19 that found 20, in `data-explorer/global.js` (9),
`congestion-pricing-report/chart-tod.js` (5), `data-explorer/table.js` (5) and `nr-report.html` (1).
The probe misses multi-line ternary values like `timeSearch` in `table.js`
`getTableColumnSearchValues`, so read each file too. Object-literal padding (Decisions) is also
by hand: the script does not check block length.

Step 4's commit is regenerable: on a conflict in a file only it touched, take the other side and
re-run the script (idempotent). Step 4's proof is the three checks in the script's docstring.

## Next command

Wait for #1491: `gh pr view 1491 --json state,mergedAt` shows `"state":"MERGED"` when it has
merged. Then step 3: `git merge production` on `feature-js-formatting`.

VS Code ignores `.editorconfig` without the EditorConfig extension, which was not installed on
Chris's machine on 2026-10-19 (`code --list-extensions`, 77 extensions, none matching).
