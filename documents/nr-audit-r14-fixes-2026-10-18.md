# NR fixes from the 2026-10 site-wide audit (R14)

**Status as of 2026-10-19:** step 0 done (all three P1 rows reproduce); steps 1 and 2 done; steps 3–5 not started; N-026's pointer half deliberately left open (Decisions).

Source: roadmap batch R14 of `documents/site-wide-audit-2026-10.md`, which lands on #1491's branch
(`feature-MOD-Lab-NR-recode-refactor-merge`) before it merges. The audit read this branch at
`d1c7402735` and its tip `00737207cb`; since then the only commit touching NR code is `0943e08e4d`
(N-024), per `git log --oneline 00737207cb..HEAD --no-merges -- assets/js/nr-report
themes/dohmh/layouts/neighborhood-reports themes/dohmh/layouts/partials/nr-*.html`. Each row is
re-reproduced at HEAD before it is fixed (step 0). When a row lands, update its Status cell in the
audit too.

## Decisions

| # | Decision | Rejected | Why |
|---|---|---|---|
| A-382 | **Not fixed here.** Report pages stay out of the Pagefind index | Removing `data-pagefind-ignore="all"` | Reverses the decision recorded 2026-08-15 (`documents/nr-pagefind-parity-2026-08-15.md` §2g); the test that would re-decide it is the GA `search_term` check, A-383 / that doc's §5. Chris, 2026-10-18 |
| N-026 | Port `assets/js/nr-report/map.js`'s keyboard + naming handling into `nr-leaflet.html` | Unifying the two Leaflet implementations | Smaller change on a branch about to merge; unification is a separate item. Chris, 2026-10-18 |
| N-026 zoom | Keep `nr-leaflet.html`'s `flyToBounds` onto the page's own neighborhood; fix naming and keyboard only | A whole-city `fitBounds`, as the report page's `map.js` took on 2026-09-15 | Keeps the neighborhood index's framing. The pointer-reachability half of N-026 therefore stays open, and its audit cell should say so. Chris, 2026-10-19 |
| N-027 attributes | Topic buttons: `aria-pressed` `true`/`false`, set by the template and flipped in `handleTopicButtons` with `.active`. Selected report polygon: `aria-current="true"`, moved in `map.js` wherever the selection style moves | `aria-pressed` on the polygons too | A polygon is the report's current neighborhood, and pressing it again does not toggle it off, so `aria-pressed` would claim a toggle that does not exist. Chris, 2026-10-19 |
| P3 | Fold in N-028 and N-068 (same files as N-026), N-029, A-384, A-394 | A-383, A-385 (need investigation), A-391 (`refile-rules` job), A-393 (comment-spacing sweep, diff noise) | Same-file or doc-only fixes; the rest are not fixes |

## Steps

| # | Row(s) | Files | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| 0 | Reproduce N-025, N-026, N-027 at HEAD | *no commit* — probe at `4cfa25c9bb` | — | **DONE 2026-10-18** | Scratch Playwright probe (not kept), fresh `dev_stage` server via `ensureDevServer()`, Pagefind served, exit 0. N-025: after Enter on the Kingsbridge polygon the h1 and URL move to Kingsbridge - Riverdale, the breadcrumb's 3rd item still reads Central Harlem - Morningside Heights with its href. N-026: `/neighborhood-reports/east_new_york/`, 120 Tabs: 49 path stops, 0 named; Enter on the first polygon leaves URL and h1 unchanged. Control, East New York asthma report: 42 stops, 42 named (so the name counter can fire). N-027: no `.nr-topic-button` carries `aria-pressed`/`-current`/`-selected` before or after clicking Climate, only `.active` moves; report polygons' only `aria-*` attribute is `aria-label`. All three match the audit rows. The pointer-reachability half of N-026 was not re-measured |
| 1 | N-025 breadcrumb not updated on in-place switch | `assets/js/nr-report/url.js` (new `updateNeighborhoodCrumb`, beside `updateTopicLinks`), called from `report.js` `renderAll`; `nr-report.html` crumb anchor gets class `nr-breadcrumb-neighborhood`; `scripts/nr-r14-probe.mjs` | `79e7fa27bd` | **DONE 2026-10-19**; audit row FIXED, summary counts and R14 batch updated (recount of all 502 rows reproduces HEAD's table before the edit and the new one after; 122 P1/P2 rows each in one batch) | `npm run lint` exit 0. `node scripts/nr-r14-probe.mjs`, fresh `dev_stage` server, Pagefind served: exit 0, `PASS N-025`. Control: the same run with the `updateNeighborhoodCrumb` call deleted from `report.js` exits 1, `FAIL N-025`, crumb still Central Harlem after the switch; file restored after. The earlier scratch run of the same check: before the switch the crumb reads Central Harlem - Morningside Heights with the class present (so the served template is the edited one); after Enter on the Kingsbridge polygon it reads Kingsbridge - Riverdale, href `/dev-stage/neighborhood-reports/kingsbridge_riverdale/`, h1 and URL agree, 0 `pageerror` |
| 2 | N-027 topic buttons / selected polygon state by styling only | `neighborhood-reports/section.html` (`aria-pressed` in the button markup and `handleTopicButtons`); `assets/js/nr-report/map.js` (`selectLayer` moves `aria-current`); `scripts/nr-r14-probe.mjs` | `dc8b639543` | **DONE 2026-10-19**; audit row FIXED, count table, summary paragraph, roadmap total (121) and R14 row updated, R14 moved below R11 to keep the table's P1-then-P2 order (recount of all 502 rows reproduces HEAD's table before the edit and the new one after) | `npm run lint` exit 0. `node scripts/nr-r14-probe.mjs`, fresh `dev_stage` server, Pagefind served: exit 0, PASS N-025, `N-027 topic buttons`, `N-027 report polygon`. Before the fix, at `8373b098d2`, the same probe exited 1: every button's `aria-pressed` null before and after the Climate click, and no polygon with `aria-current` on load or after Enter on Kingsbridge, while the controls held (5 buttons, `.active` moved to Climate, 42 polygons named) |
| 3 | N-026 (+ N-028, N-068) neighborhood-index polygons unnamed, Enter dead — naming and keyboard only, zoom kept (Decisions) | `partials/nr-leaflet.html`; comments in `map.js`, `CLAUDE.md` | — | Not started | — |
| 4 | A-374 `getComparison(null, x)` compares instead of returning empty | `assets/js/nr-report/tertiles.js` (`getComparison`); callers in `cards.js` | — | Not started — first check whether real data passes null | — |
| 5 | P3 docs/comments: N-029, A-384, A-394 | `report.js`, `CLAUDE.md`, site-wide audit §17 | — | Not started | — |
| V | Verification | *no commit* — checks | — | Not started | — |

V is: `node scripts/nr-r14-probe.mjs` (each step adds its row's check there), `npm run lint`, `node scripts/nr-characterization.mjs --check`,
`npm run a11y:nr`, `node scripts/smoke-pages.mjs`, `npm run characterize:pagefind`.

## Next command

When a row lands, the audit takes five edits, as N-024 and N-025 did: the row (Status FIXED,
**Fixed by** hash, Tree `#1491 @ <hash>`, Priority —), the Summary count table, the sentence under
it, the roadmap's P1+P2 total, and the R14 row's counts and ids. The roadmap table is ordered by
P1 count, then P2, so a closed row can move its batch.

Step 3 (N-026, + N-028, N-068): name the neighborhood-index polygons and make Enter on one
navigate, in `partials/nr-leaflet.html`, porting `map.js`'s `nameMapPolygons` and `keydown`
handling; keep its `flyToBounds` (Decisions). First add an N-026 check to
`scripts/nr-r14-probe.mjs` and confirm it fails at HEAD: on `neighborhood-reports/east_new_york/`,
step 0 counted 49 path tab stops and 0 named, and Enter on the first polygon left URL and h1
unchanged; the control page `east_new_york/asthma_and_the_environment/` names 42 of 42. Read
N-028 and N-068 in the audit before starting, to fold them into the same change.
