# Neighborhood Reports follow-ups — 2026-08-15

Branch `feature-MOD-Lab-NR-recode-refactor`. A batch of small items left open across the NR
records, picked up together because none of them was large enough to own a document. The detail
for each stays in the document that owns it; this file holds only status, so a session resuming
mid-batch can tell done from pending without re-deriving it.

**Status as of 2026-08-15: all six items done, and the guardrail suite is green on the finished
tree** — `lint` exit 0, `docs-check` PASSED, `smoke` 15/15, `characterize:nr` 3/3,
`characterize:pagefind` 201 indexed pages with both controls passing.

Not in scope, and still open where they were: the Pagefind GA test and filter facet
([`nr-pagefind-parity-2026-08-15.md`](nr-pagefind-parity-2026-08-15.md) steps 9 and 10), the
flexdatalist combobox port to three non-NR pages
([`site-wide-audit-2026-06-27.md`](site-wide-audit-2026-06-27.md) §5k), the `.nr-list-toggle`
contrast decision, and the fresh ACS pull.

## Ledger

| # | Item | Owner document | Status | Proof that ran |
|---|---|---|---|---|
| 1 | `finalURL` prefix-relative in `scripts/nr-characterization.mjs` — Option 1 of the memo | [`nr-characterization-environment-options-2026-08-11.md`](nr-characterization-environment-options-2026-08-11.md) §4 | **DONE 2026-08-15**, `1846385e72` | All three runs came back as predicted — see the table below, now recording what ran |
| 2 | Extract the inline `<style>` block from `nr-topic-spa.html` into `assets/scss/_custom.scss`, dropping the dead rules | [`nr-decisions-and-sequencing-2026-08-04.md`](nr-decisions-and-sequencing-2026-08-04.md) "Still open" | **DONE 2026-08-15**, `14307b0cc5` | Computed-style A/B on a report page, screen and print: every sampled value byte-identical before and after. Plus a scoping control on a non-NR page — see below |
| 3 | Delete the `urlExtension` frontmatter from the five topic files | same | **DONE 2026-08-15**, `128915f28b` | Case-insensitive repo-wide sweep found no reader; all five URLs re-fetched afterwards, 200 and the expected title on each |
| 4 | Correct the stale "task 6 in progress" header | [`nr-print-view-fix-2026-08-10.md`](nr-print-view-fix-2026-08-10.md) | **DONE 2026-08-15**, `84cf36b5bf` | Task 6 landed in `5195e4db8a` `[verified: git log -S over assets/scss/_custom.scss]`; the row now carries that hash and the header says closed |
| 5 | Correct the stale "Not started" on step 5 of §11 | [`nr-output-retirement-scoping-2026-08-04.md`](nr-output-retirement-scoping-2026-08-04.md) §11 | **DONE 2026-08-15**, `84cf36b5bf` | `git show --stat 2bce6c6d46` — the commit deleting the 252 content files |
| 6 | Re-count the branch's delivery state (was "19 ahead of `origin`", 2026-08-09) | same | **DONE 2026-08-15**, `84cf36b5bf` then amended | The count was replaced by the two `git rev-list --count` commands instead. `84cf36b5bf` wrote "5 ahead of `origin`" and the four commits of this batch made it 9 within the hour — a count against the branch you are committing to cannot survive its own commit, which is the same failure this row exists to correct |

## Item 1 — what was built and what proved it

Option 1 only. **Option 2 (an environment selector in `dev-server.mjs`) was deliberately not
built**: the memo's own §5 records that it "does not on its own fix the check" on either axis, and
it widens `dev-server.mjs`, which `smoke`, both characterization harnesses and the a11y audit all
share. It stays open in that memo, which is where the decision is recorded.

The capture stores `finalURL` with the server's baseURL path prefix removed, so the recorded value
is `/neighborhood-reports/<nbhd>/<topic>/` whatever environment captured it. The six committed
baselines had the same transform applied rather than being re-captured — deliberately, because
`--baseline` cannot fail (CLAUDE.md), so a re-capture would have risked installing a different
tree's output as the reference while claiming to fix one field.

**The proof is a before/after across two prefixes on one data branch**, which is the failure the
memo describes. `prod_stage` and `dev_stage` both serve the `staging` branch, so every content
field is comparable and only the prefix differs — `/IndicatorPublic/` against `/dev-stage/`.

| Run | Code | Server | Result |
|---|---|---|---|
| Positive control | before the fix | `prod_stage`, `/IndicatorPublic/` | **FAILED, 3 of 3 targets** — and `finalURL` was the only differing field on any of them, so the check can fail for exactly this reason and nothing else was moving |
| Regression guard | after the fix | `dev_stage`, `/dev-stage/` | **PASSED 3/3** — capture-side strip and rewritten baselines agree on the original prefix |
| The claim | after the fix | `prod_stage`, `/IndicatorPublic/` | **PASSED 3/3** — the same baseline now checks from a different prefix |

Row 1 is what makes rows 2 and 3 mean anything: a passing run proves nothing if the check could
not have failed. Rows 2 and 3 read the same baseline files from two different servers, one
spawned by the harness itself and one started by hand, never both at once.

Row 1 also settled something the memo could only assume. Every content field matched across the
two environments — only `finalURL` moved — which is direct evidence for the memo's §2 claim that
the prefix and the data branch are independent axes, rather than an inference from the config
table.

**The six committed baselines were rewritten by transform, not re-captured.** The diff is 6 files
× 1 line, every one of them a `finalURL`
`[verified 2026-08-15: git diff -U0 over the baseline directory, every changed line read]`.

**The redirect guard survives**, which was Option 1's stated risk — and this was tested rather
than argued, because a cascade-style "it must still work" is the kind of claim that reads as
correct and isn't. The shipped `stripBasePath` was extracted from the source file and run over
seven paths `[verified 2026-08-15]`: a redirect to `/404.html` and a redirect to the topic index
both still differ from the baseline value, a path repeating the prefix string deeper down keeps
that inner segment, and the two legitimate prefixes converge on the same recorded value. The
anchored leading-strip is what makes the third case work; a global replace would have eaten it.

## Item 2 — two risks, only one of them the expected one

17 rules, of which **8 were dead and were deleted rather than moved**: five `.nr-card-header`, two
`.nr-indicator-card`, and `.card-header a`. All three selectors match zero elements on a rendered
report page, confirmed twice over — a repo-wide grep, and `querySelectorAll` counts in the browser
against the 23 card headers the page builds, every one of which holds a `<button>` and no anchor.

**The expected risk was the cascade, and it turned out not to bite.** An inline `<style>` sits
after the stylesheet link, so it wins ties a rule in `_custom.scss` could lose. One rule had a tie
to lose: `.col-print-12` competes with Bootstrap's `.col-md-8` at identical 0-1-0 specificity, and
under print emulation both media queries match at once. `_custom.scss` is imported at
`theme.scss:26`, after `b-bootstrap-imports` at `:18`, so source order still favours it — and the
computed value confirmed it rather than the reasoning being trusted.

**The risk that did bite was scope, and it was not on the list.** `.card-header` is a *Bootstrap*
class. The inline block was page-scoped for free; the same rules in a shared stylesheet reach the
whole site. Measured on `/data-features/realtime-air-quality/`, a non-NR page with 8 card headers:

| Scope | Background | Padding |
|---|---|---|
| Scoped to `.nr-report-accordion` (shipped) | `rgb(239,250,244)` | 16px |
| Unscoped (control run only) | **`rgb(255,255,255)`** | **8px** |
| Restored to scoped | `rgb(239,250,244)` | 16px |

So the naive move would have repainted every Bootstrap card header on the site, and `!important`
on `background: white` means nothing downstream could have overridden it. The three `.card-header`
rules are scoped in their new home; `.nr-report-accordion` is exact, covering 23 of 23 headers.

`.card-body-no-top` is deliberately **not** scoped the same way: 24 elements carry it and only 23
are inside the accordion, the 24th being the demographics block. Scoping it would have dropped
that one silently — the count is what caught it, not the source read.

**One probe defect worth recording.** The first before-capture reported `.card-header`'s
background as the *hover* colour and an identical value for the hover sample. Cause was the probe,
not the page: it clicks an accordion button to expand a panel, and Playwright leaves the mouse
resting where it clicked, so `:hover` was live for the whole "base state" read. A rule that is not
applying looks exactly like this. Moving the mouse away before reading fixed it, and the two
states then separated cleanly — white at rest, `#EFFAF4` on hover.

## Item 3 — `urlExtension`

Five deletions, one line each. **The sweep was case-insensitive on purpose**: Hugo lowercases
param keys, so a template reading `.Params.urlextension` would not appear in a case-sensitive
grep, and the only hits were the five declarations and the line in the decisions memo recording
the field as dead. Routing is driven by an explicit `url:` on each of the five files, and all five
were re-fetched after the deletion rather than assumed — 200 and the expected `<title>` on each.

## Re-running this

```
node scripts/nr-characterization.mjs --check     # 3/3 pass, on any server serving a branch with a baseline
npm run lint
npm run smoke
npm run docs-check
```
