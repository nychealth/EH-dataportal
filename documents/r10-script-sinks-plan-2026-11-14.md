# R10: Script sinks, N-120 and N-122 (2026-11-14)

Two of batch R10's eight rows in `documents/site-wide-audit-2026-10.md` (Roadmap), both P2, on
branch `feature-audit-r10-script-sinks`, cut from the local `production` at `9967b1096a`. R10's
other six rows (A-014, A-015, A-018, A-020, A-076, N-128) are dependency upgrades and script
integrity, a different kind of change, and are not in this branch. This document is the plan and
the ledger. A row is closed in the audit only once its proof has run.

**Status 2026-11-14: all four steps done. Next: push and open a PR into `production` (below).**

## What the rows found

- **N-120:** the explorer writes four `metadata.json` fields as HTML without sanitizing them:
  `IndicatorName`, `IndicatorDescription`, `Measures[].MeasurementType` and
  `Measures[].DisplayType`. Sites traced by the audit: `topic-indicator-selector.js:438`, `:441`
  (written at `:456`); `map.js:810`, `:815`, `:951`, `:956`; `table.js:655`. Also
  `data-explorer/data-index.html:122`, `:126`, read and not run. No value of the four fields holds
  `<` or `&` on EHDP-data `production` (267 indicators) or `staging` (285)
  (`scripts/.sc-rebaseline/audit-fable-2026-11-14/markup-census.out`).
- **N-122:** `take-action/email-electeds.html:382`-`:416` writes `www.mygovnyc.org`'s API fields
  into table cells with `innerHTML`, and puts its `website` field into an `href` unchecked.

## Decisions

- **`DOMPurify.sanitize` at each sink, not a new escape helper.** It is what the explorer already
  does for `how_calculated` and `Sources` (`global.js:427`-`:435`,
  `topic-indicator-selector.js:621`), and `head.html` loads DOMPurify on every page. The row
  suggests escaping; on today's data the two render identically, since no value holds `<` or `&`.
  Its default URI allowlist also drops a `javascript:` `href`, which is N-122's second half; the
  probe checks that rather than assuming it.
- **The table sanitizes each distinct header once, not each row.** `MeasurementDisplay`
  (`data.js:616`) becomes the `<th>` text through Arquero 8.0.3's `toHTML`, which escapes cell
  values (`node_modules/arquero/src/format/to-html.js:71`-`:74`) but not column names (`:92`). A
  lookup built from the distinct names keeps the cost off the per-row path, which N-126 measured
  at 1729ms.
- **Out of scope, recorded so it is not rediscovered:** `trend.js:503` interpolates
  `compDisplayTypes` into a Vega `calculate` expression string, so a quote in `DisplayType`
  breaks the expression. Vega expressions cannot run arbitrary script, so it is a robustness bug,
  not part of N-120.

## Steps

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | N-120: `DOMPurify.sanitize` on both map popups' whole string (`map.js`), the chooser's section HTML (`topic-indicator-selector.js`), each distinct table header via a lookup before the pivot (`table.js`), and the five `data-index.html` sites: name (twice), measurement type, geography type, sources | `33d3d1d02c` | **DONE 2026-11-14** | Step 3 |
| 2 | N-122: every `email-electeds.html` cell through a local `sanitizeCell`, which passes `ADD_ATTR: ['target']` because DOMPurify 3.4.17 strips `target` by default and the name and contact links open in a new tab | `3ecca10ce6` | **DONE 2026-11-14** | Step 3 |
| 3 | Probes before and after, a clean-data no-change check, lint, curated smoke | *no commit* (measurement) | **DONE 2026-11-14** | below |
| 4 | Close N-120 and N-122 in the audit; R10 drops to 6 rows, after merging `production` (#1574, `696aa455ae`) in as `da4a66ea4a` | | **DONE 2026-11-14** | `audit_counts.py recount` reproduced the merged table first (OPEN 0/39/136/5, 180), then read OPEN 0/37/136/5 (178) and FIXED 311; `batches`: R10 `0 6 0 6 OK`, 37 ids for 37 OPEN P1/P2 rows, ordered; edit by `close_rows.py`, both in `scripts/.sc-rebaseline/r10-script-sinks/` |

Step 3's proof, all on an isolated prod_prod server on :8090 (`serve.mjs`) of this branch at
`9967b1096a` plus steps 1 and 2's edits, the same bytes later committed as `33d3d1d02c` and
`3ecca10ce6`; outputs in the git-ignored
`scripts/.sc-rebaseline/r10-script-sinks/`:

- **Before** (`data-xss-before.out`, `electeds-before.out`): the audit's recorded result
  reproduced on the explorer pages. The data-index target, new to this copy of the probe,
  executed `IndicatorName`, `Measures[].MeasurementType` and `Measures[].Sources`; `Sources` is
  sanitized in the explorer but was not here. Electeds: `firstname`, `lastname` and `email`
  executed, and the `javascript:` URL became an `href`. Clean arm: nothing.
- **After** (`data-xss-after.out`, `electeds-after.out`): `executed fields=0 of 93 rewritten`;
  electeds payload arm `executed=[]`, `javascriptHrefs=0`. The `<img>` payloads still land as
  elements with the handler stripped, which is the state the audit records as safe for
  `how_calculated`. The trend and correlate views log one page error in both arms, so it predates
  this change; not diagnosed.
- **No change on real data** (`clean-capture.mjs`, `clean-compare.out`): chooser, table header,
  map popup, data-index table and the stubbed electeds table, captured with the fix and with it
  stashed, are byte-identical on all five, both `target="_blank"` links included. The two arms
  served different code: `map.js` fingerprints `9f06f95a9a` (fixed) and `16ca5191c7` (stashed).
- `npm run lint` exit 0 (`lint.out`); curated smoke 44 of 44 clean, Pagefind served (`smoke.out`).
- Not covered: the geography type at `data-index.html`'s geography list, which the probe never
  rewrites (its key does not match the probe's text-key pattern); sanitized anyway, unproven.

**Does sanitizing change anything in the real data?** No, checked 2026-11-14 over every indicator's
data file, `metadata.json`, `GeoLookup.json` and `TimePeriods.json` on both EHDP-data branches
(`production` 267 indicators, `staging` 285):

- `data-census.py` counts, per field, the characters DOMPurify acts on and the tag starts (`<`
  followed by a letter, `/`, `!` or `?`). Its control string scores one. No field this branch
  sanitizes has a tag start, except one data `Note`. `MeasurementType` and `DisplayType` hold
  none of `< & >` or a non-breaking space, so the table's column names stay byte-for-byte the
  same. The re-encoded characters render as before: `>` in one `IndicatorName`, `&` in 6
  `Sources` and 93 geography names. `<` appears in 121 `DisplayValue`s on `production` (693 on
  `staging`), always as `<1,000*`, which is not a tag start (`data-census-*.out`).
- `note-markup.mjs`: the one `Note` with markup, on 36 rows of indicators 2380 and 2382, is
  `†  <strong style="color: red;">Data from 2015 are not shown…</strong>`. It parses to the same
  HTML with and without DOMPurify, `style` included, so the map popup's red warning is unchanged
  (`note-markup-*.out`).
- `purify-roundtrip.mjs`: every distinct affected string (171 and 194) shows the same visible text
  sanitized. Its markup controls show the limit: comparing visible text cannot see a stripped
  attribute, and the script exits 1 for that reason. The two checks above cover attributes
  (`purify-roundtrip-*.out`).
- Already true before this branch, not changed by it: `how_calculated` holds
  `<a … target="_blank">` links on 54 measures (75 on `staging`), and DOMPurify drops their
  `target`, because `global.js` sanitized that field before this branch.
- Not sampled: the elected-officials API's live responses.

## Next command

Push and open a PR into `production`:
`git push -u origin feature-audit-r10-script-sinks`, then
`gh pr create --base production --head feature-audit-r10-script-sinks`. No re-baseline is owed:
on real data every changed sink renders byte-identically (step 3).

To re-check the audit counts after any later merge of `production`:
`python scripts/.sc-rebaseline/r10-script-sinks/audit_counts.py recount documents/site-wide-audit-2026-10.md`
(`batches` in place of `recount` for the batch check).
