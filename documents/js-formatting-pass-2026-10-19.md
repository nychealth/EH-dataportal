# JS formatting pass (2026-10-19)

**Status as of 2026-10-19:** rules written into `documents/js-conventions.md` and `.editorconfig`
added, on `feature-js-formatting`; the sweep itself waits for #1491 to merge (steps 2–5).

## Decisions

| Decision | Rejected | Why |
|---|---|---|
| Write the rules now; sweep the tree only after #1491 merges | Sweeping now, on #1491 or on a branch stacked on it | The R14 ledger (`documents/nr-audit-r14-fixes-2026-10-18.md`, Decisions) left the comment-spacing sweep out of #1491 as diff noise, and a sweep taken now conflicts with every remaining R14 step (all six of its files would be reformatted). Chris, 2026-10-19 |
| `feature-js-formatting` cut from `feature-MOD-Lab-NR-recode-refactor-merge` at `295046215b`, brought up to date with it before the sweep | Cutting from `production` | The sweep covers `assets/js/nr-report/` and NR templates that exist only on #1491 until it merges |
| Withdraw "Forward-only" in `js-conventions.md` | Keeping it | Once #1491 merges, the reformat is no longer noise. Chris, 2026-10-19 |
| A comment above an object property whose value is a multi-line block gets the gap; a single-line value does not | Exempting all object-property comments | Chris, 2026-10-19. `js-comment-spacing.py` still exempts all of them, so this half is by hand |
| A function body of two lines or fewer stays unpadded | Padding every body | Chris, 2026-10-19 (`setBarSelection`) |

The rules were extracted from a hand pass over 20 files that Chris made as examples on
2026-10-19 and then discarded, along with a staged run of the script. Nothing tracked keeps them;
the code examples in `js-conventions.md` (`setBarSelection`, `addResizeHandler`, `L.control`) are
taken from that pass.

## Open questions (for the rule tweaks)

- **Padding a multi-line object literal's opening `{`.** The hand pass padded it on
  `$('#tableID').DataTable({`, `L.geoJson(exportGeojson, {`, `window.NR_REPORT_CONFIG = {`,
  `const spec = {` (`nr-report/chart.js`) and `return {` (`table.js` `getTableColumnSearchValues`),
  but not on the `return {` objects in `measures.js` `getSyncedLinksState`. No rule written yet.
- **`js-comment-spacing.py` vs the multi-line-value exception.** Teach the script the distinction,
  or leave that half by hand.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Rules into `js-conventions.md`; `.editorconfig` | | Done in tree | `npm run docs-check` exit 0 |
| 2 | Settle the open questions above | | Not started | — |
| 3 | After #1491 merges: merge it (or `production`) into this branch | | BLOCKED on #1491 merging | — |
| 4 | `python scripts/js-comment-spacing.py`, commit alone | | BLOCKED on 3 | — |
| 5 | Hand pass for the rules the script does not apply, commit separately; `npm run lint`, `npm run smoke:all` | | BLOCKED on 4 | — |

Step 4's commit is regenerable: on a conflict in a file only it touched, take the other side and
re-run the script (idempotent). Step 4's proof is the three checks in the script's docstring.

## Next command

Step 2, then wait for #1491. Check with `gh pr view 1491 --json state,mergedAt`.

VS Code ignores `.editorconfig` without the EditorConfig extension, which was not installed on
Chris's machine on 2026-10-19 (`code --list-extensions`, 77 extensions, none matching).
