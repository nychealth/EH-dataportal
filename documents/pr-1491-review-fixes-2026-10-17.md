# PR #1491 review fixes (2026-10-17)

**Closed 2026-10-17.** All steps landed in `b33ba2373e` and `2474ff1796` (range `d1c7402735..2474ff1796`); F5 deferred.

Source: a `/code-review high #1491` pass on 2026-10-16, ten findings plus one over its cap.
Findings 1–4 reproduced in a browser before any change, against a `dev_stage` server on
`neighborhood-reports/bayside_little_neck/asthma_and_the_environment/`
`[verified 2026-10-16 at d1c7402735: scratch Playwright probe, not kept]`:

- F1 served title ends `&ndash; Environment &amp; Health Data Portal`; `document.title` after render does not
- F2 arriving with `?utm_source=x#nr-accordion-2`, `search` and `hash` both empty after render
- F3 selected polygon after mouseover+mouseout reads `#444`/5 (a non-selected one returns to black/1.5)
- F4 viz JSON answered 404: an expanded panel still reads "Loading..." after 4s (control with viz served: an svg)

## Decisions

| # | Decision | Rejected | Why |
|---|---|---|---|
| F5 | **Deferred**: cards keep waiting for the viz fetch | Gating cards on the section fetches only | Chris plans to refactor how report data arrives; un-defer as part of that. Measured: viz 706 KB, 8 section files 1,048 KB together, largest 208 KB; no throttled timing taken |
| F7 | Landing buttons and `topicSlugs` generated from `data/globals/NR_topics.yml`, keyed by `key`; the five descriptions stay hand-written, re-keyed | Replacing the descriptions with the yml `summary` | 3 of 5 landing descriptions differ from `summary`; changing them is a content decision. Visible change accepted: "Active design" → `menu_label` "Active Design" |
| F8 | Rename the four `nr-report/map.js` functions that collided with `nr-leaflet.html`, to a reportMap prefix | Leaving the hazard documented in CLAUDE.md | Removes the trap rather than describing it |
| F6 | Defer `URL.revokeObjectURL` with `setTimeout` | — | Untested outside Chromium (the only browser installed); a hedge, marked `HYPOTHESIS (unverified)` in the code |

## Steps

| # | Finding | Files | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| 1 | Title loses site suffix | `assets/js/nr-report/report.js` (`announceNeighborhoodChange`), `nr-report.html` (`siteTitle`) | `b33ba2373e` | **DONE 2026-10-17** | V: load title keeps `– Environment & Health Data Portal`; after an Enter-key switch to Kingsbridge - Riverdale the title is the full rebuilt string |
| 2 | URL rewrite drops query and hash | `assets/js/nr-report/url.js` (`setNeighborhoodInURL`) | `b33ba2373e` | **DONE 2026-10-17** | V: `?utm_source=x#nr-accordion-2` survives load, and survives the switch while the path moves to `kingsbridge_riverdale` |
| 3 | Hover leaves selected polygon in hover style | `assets/js/nr-report/map.js` (`reportMapResetHighlight`) | `b33ba2373e` | **DONE 2026-10-17** | V: selected returns `#008939`/3; control polygon black/1.5. Driven by `layer.fire`, not a real pointer |
| 4 | "Loading..." forever when viz fails | `chart.js` (`onAccordionExpand`), `data.js` (`loadVizData`), `nr-report.html` (`#nr-download-csv`) | `b33ba2373e` | **DONE 2026-10-17** | V: viz 404 → "Chart data could not be loaded." and Download disabled; control → svg, Download enabled |
| 6 | Immediate blob URL revoke | `assets/js/nr-report/app.js` (`downloadCSV`) | `b33ba2373e` | **DONE 2026-10-17** | V: Chromium download 8,342 bytes. Other browsers untested |
| 7 | Topics hard-coded on the landing page | `neighborhood-reports/section.html`, `partials/nr-leaflet.html` (`topicSlugs`) | `2474ff1796` | **DONE 2026-10-17** | V: 5 buttons keyed by yml key, first active; `topicSlugs` 5 keys; default and Climate button set copy, destination and list hrefs; topic index and neighborhood index load clean. Pagefind: see V |
| 8 | Map function name collision | `assets/js/nr-report/map.js`, `CLAUDE.md` | `b33ba2373e` | **DONE 2026-10-17** | Word-boundary counts of the four old names in `map.js` 3/2/4/3 → 0/0/0/1, the 1 being Leaflet's `onEachFeature:` option key; lint exit 0 |
| 9 | Dead `normalizeReportUrl` | `assets/js/nr-report/data.js` (`loadSection`) | `b33ba2373e` | **DONE 2026-10-17** | `git grep -c normalizeReportUrl` exit 1; V: 23 cards render from the section fetches |
| 10 | `section.html` comment says report pages are indexed | `neighborhood-reports/section.html` | `2474ff1796` | **DONE 2026-10-17** | Committed Pagefind baseline: 48 NR pages, 1 at depth 1, 47 at depth 2, 0 report pages |
| 11 | `map.js` cites NDHR files not on this branch | `assets/js/nr-report/map.js` (above `selectLayer`) | `b33ba2373e` | **DONE 2026-10-17** | Both files present on `feature-NDHR-prototype` (`git ls-tree`), comment now names it |
| V | Verification | — | *no commit* — checks | **DONE 2026-10-17** | Scratch probe (not kept), dev_stage: 22 PASS, 0 FAIL. `npm run lint` exit 0. `npm run docs-check` exit 0 (first run exit 1 on a backticked prefix read as an identifier; reworded). `node scripts/nr-characterization.mjs --check` 3 of 3. `node scripts/smoke-pages.mjs` 44 clean, Pagefind served. `node scripts/pagefind-characterization.mjs --check` exit 1 as predicted: only `/neighborhood-reports/` changed (anchors + contentHash, words 362 unchanged); `--baseline` (controls passed) diffed per record: 203 → 203 pages, that one record, its 10 anchor ids old → new key form, queries unchanged, 0 CR bytes |

## Next command

None — closed. F5 is un-deferred by the data-loading refactor, not by this document.

## Follow-up: regressions found by the 2026-10 site-wide audit

The audit (branch `documentation-site-wide-audit-2026-10`, `documents/site-wide-audit-2026-10.md`)
read this branch at `00737207cb` and confirmed one regression from step 2 above.

| # | Finding | Files | Commit | Status | Proof that ran |
|---|---|---|---|---|---|
| N-024 | Step 2 keeps query + hash, so `renderQRCode` encodes a long `location.href` and `qrcode(10,'M')` (213 bytes) throws inside `renderAll` | `nr-report.html` (`renderQRCode`): encodes `location.origin + location.pathname` | `0943e08e4d` | **DONE 2026-10-17** | Scratch Playwright probe (not kept), dev_stage, Central Harlem active-design report, with no query and with `?fbclid=` + 300 chars + `#nr-accordion-2`, then Enter on the Kingsbridge polygon: 20 PASS, 0 FAIL. In-page control: the 454-char `location.href` itself throws `code length overflow. (3652>1728)`, so the URL was long enough to trigger the bug. Arm against HEAD's unfixed template: 7 FAIL, all in the long-query arm (no QR image, overflow errors, title and live region unchanged after the switch), matching the audit's reproduction. Query and hash stay in the address bar, so step 2 holds. `node scripts/nr-characterization.mjs --check` 3 of 3; `node scripts/smoke-pages.mjs` 44 clean, Pagefind served |

**Closed 2026-10-17** at `0943e08e4d`. CI on PR #1491 at `4677240bf7` (the ledger commit on top of it):
both sweeps SUCCESS, the full-site smoke and the rendered-structure diff `[verified 2026-10-17: gh pr view 1491
--json headRefOid,statusCheckRollup]`. The audit's other open #1491 rows are that audit's to prioritize (its Task 6),
not this document's.
