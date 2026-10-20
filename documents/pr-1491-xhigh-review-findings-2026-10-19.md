# PR #1491 xhigh review findings (2026-10-19)

Appendix to [pr-1491-xhigh-review-fixes-2026-10-20.md](pr-1491-xhigh-review-fixes-2026-10-20.md), which holds the
decisions, tasks and ledger. This file is a verbatim copy of the reviewer's final message, so the failure scenarios
outlive the transcript they came from. It is a dated record, not a description of the current tree: line numbers are at
`13fa8d6016`, and a finding's status lives in the plan's ledger.

Source: `/code-review xhigh #1491 --max-findings all`, run 2026-10-19 23:53 local. The message is the last assistant
message in `~/.claude/projects/c--Users-Chris-Documents-DOHMH-Programming-EH-dataportal-worktrees-feature-MOD-Lab-NR-recode-refactor-merge/c5623a61-8a7c-43c3-ac12-5383aa2bad81/subagents/agent-a8adb6362f930c608.jsonl`.
Findings are numbered by their order in the JSON array, which is the numbering the plan uses.

---

I reviewed PR #1491 at head `13fa8d6016` against merge-base `06b38225b1`. The PR touches 876 files; I read every changed code file in full: the 10 `assets/js/nr-report/` modules, the NR layouts and partials, the content adapter, SCSS, `eslint.config.mjs`, `dev-server.mjs`, and the five NR harness scripts. I skipped generated content deletions, baselines, `documents/` and CLAUDE.md prose.

What I ran:
- **Lint:** `npx eslint assets/js/nr-report` exits 0.
- **Live data, `rankReverse`:** I tallied all 26 production EHDP-data report JSONs (3,570 rows). `rankReverse` is always a boolean, so the new `=== true || === 'true'` test and production's `ne false` test agree on today's data. I did not report that difference.
- **Live data, HTML characters:** in the same files, `&` appears in `data_source_list` 126 times and `<` in `data_value_geo_entity` once ("N/A<1%*"). That feeds finding 7.

Nothing below was checked in a browser. Items marked "inherited" copy behaviour from production's retired templates.

```json
[
  {
    "file": "assets/js/nr-report/app.js",
    "line": 10,
    "summary": "The CSV download no longer sends the GA 'file_download' event that production's report page sent on every download.",
    "failure_scenario": "Production's nr-output/single.html downloadData() called gtag('event','file_download',{file_name, file_extension:'.csv', link_text:'Download Report Data'}) after hiddenElement.click(). The new downloadCSV() builds a Blob, clicks a detached anchor and returns without calling gtag. A detached anchor is not in the document, so no delegated click listener sees it either. After merge, NR CSV downloads on all 210 report pages vanish from GA, with no error anywhere."
  },
  {
    "file": "assets/js/nr-report/chart.js",
    "line": 228,
    "summary": "Expanding an indicator no longer sends the GA 'click_modal' event that production sent on every panel expand.",
    "failure_scenario": "Production's nr-indicator-new.html bound shown.bs.collapse per indicator and, in Production/production/prod_prod/development, called gtag('event','click_modal',{modal_name: indicator_short_name}). onAccordionExpand has no gtag call. After merge, per-indicator engagement data stops arriving for every NR report."
  },
  {
    "file": "assets/js/nr-report/map.js",
    "line": 182,
    "summary": "Altitude: the report map switches neighborhood in place (renderAll plus a replaceState URL rewrite), even though every <nbhd>/<topic>/ is now a real generated page. This needs a stack of special-case rewrites and still leaves the head metadata naming the old neighborhood.",
    "failure_scenario": "Clicking 'Kingsbridge - Riverdale' on east_harlem/asthma_and_the_environment/ rewrites the URL (url.js:72), h1, title, crumb, topic links, QR code and live region. <link rel=canonical>, og:url, og:title, meta description (seo.html:2-11) and the JSON-LD still describe East Harlem. Back skips the switch, and no page_view is recorded for the Kingsbridge report, where production's nr-leaflet did a full navigation that GA counted. renderAll also calls replaceState (report.js:244) before rewriting document.title (report.js:258). If GA4 history-change page_views are on, the hit would carry the new URL with the old title (unverified). The simpler mechanism is to navigate to the generated page, as nr-leaflet.html:401 already does on the other NR pages. That deletes url.js's rewriters, announceNeighborhoodChange and the per-switch QR regeneration."
  },
  {
    "file": "scripts/nr-postswap-check.mjs",
    "line": 75,
    "summary": "extractReport reads each section heading from an <h3>, but nr-report.html now renders section headings as <h2 class=\"h4 fs-rg\"> (line 238), so every heading reads as an empty string.",
    "failure_scenario": "Against a production-data server, every report topic on every checked page compares '' with the pre-captured heading (e.g. 'injury and health'). The script reports 'report topic N' mismatches on all 20 (or all 210 with --all) pages and exits 1. The post-swap rollback check therefore always fails, and real regressions are buried in the noise."
  },
  {
    "file": "assets/js/nr-report/app.js",
    "line": 119,
    "summary": "totalFetches counts the viz fetch only when vizUrl is set, but loadVizData calls checkAllLoaded() even when vizUrl is empty (data.js:177), so the counts disagree.",
    "failure_scenario": "With vizUrl empty and N sections, totalFetches = N+1 while N+2 completions arrive. dataReady flips one completion early, renderAll paints with a section still in flight ('No data available for this neighborhood' for that section), and the last completion re-runs tryInitialRender, rendering everything a second time. The template always sets vizUrl today, so this is latent, but the guard advertised for that case is wrong."
  },
  {
    "file": "scripts/nr-characterization.mjs",
    "line": 139,
    "summary": "The 'wait for the neighborhood header to be filled' step no longer waits for anything: #nr-header-neighborhood is now server-rendered (nr-report.html:181), so the predicate is true on first evaluation and the expand step races the async card render.",
    "failure_scenario": "If the report JSON fetches finish after the 'load' event (slow network, cold CDN), '#nr-acc-1-h button' has count 0, the click is skipped, and the Vega wait times out silently after 30s. The capture records expandedPanel:null and charts:[], and --check fails against a baseline that has a chart. --baseline would silently pin that broken state. Waiting on '.card-header' (what nr-a11y-audit.mjs uses) fixes it."
  },
  {
    "file": "assets/js/nr-report/cards.js",
    "line": 118,
    "summary": "EHDP-data strings go into innerHTML unescaped. Production's Hugo templates auto-escaped the same fields, and the data explorer routes the same kind of strings through DOMPurify, which head.html loads site-wide.",
    "failure_scenario": "indicator_short_name, indicator_long_name, value, units, data_source_list (line 273), borough_name and neighborhoodName are concatenated raw into card.innerHTML (report.js:97). Today's production data has data_value_geo_entity 'N/A<1%*', which survives only because '<1' is not a tag start. A value such as 'N/A<b' or '<5 yrs' would swallow markup or inject elements. Use DOMPurify.sanitize, or textContent, as assets/js/data-explorer/global.js:395 does."
  },
  {
    "file": "themes/dohmh/layouts/neighborhood-reports/nr-report.html",
    "line": 245,
    "summary": "Removed behaviour: production rendered every indicator row into the HTML at build time (resources.GetRemote plus nr-indicator-new.html). The new section containers ship empty and fill only from client-side fetches.",
    "failure_scenario": "Three changes for the 210 report pages. A no-JS visitor or a non-rendering crawler now sees section headings with no indicators. The page now depends at runtime on raw.githubusercontent.com: if it is blocked or down, readers see 'No data available'. An EHDP-data push now changes live NR pages immediately, where before it waited for a site rebuild. If this is intended under Option D, it belongs in the PR description as a deliberate trade."
  },
  {
    "file": "assets/js/nr-report/map.js",
    "line": 339,
    "summary": "The .catch on the GeoJSON fetch also covers the tryInitialRender() call inside .then. Any exception from renderAll is logged as 'Error loading UHF42 GeoJSON' and renderAll is then run a second time.",
    "failure_scenario": "If renderAll throws on first paint (e.g. a malformed row in buildIndicatorCard), the error is misreported as a map-load failure. The catch sets mapReady and calls tryInitialRender again, which re-runs renderAll, which throws again as an unhandled rejection. Moving tryInitialRender out of the try scope (or using .then(onOk, onErr)) fixes it."
  },
  {
    "file": "assets/js/nr-report/map.js",
    "line": 180,
    "summary": "A polygon clicked after the map is ready but before data is ready is styled as selected and gets aria-current, but no render happens. The initial render then silently re-selects the page's own neighborhood.",
    "failure_scenario": "On a slow connection, the user clicks Jamaica while the section JSONs are still loading. Jamaica highlights and is announced as current. When data arrives, tryInitialRender selects and renders the page's own neighborhood, dropping the click with no feedback. Until then aria-current names a neighborhood the report is not showing."
  },
  {
    "file": "assets/js/nr-report/chart.js",
    "line": 219,
    "summary": "After vegaEmbed settles, the code re-queries the destination by selector ('#map-nr-acc-N'). renderAll resets accordionCounter, so a different neighborhood's panel can own that id by then.",
    "failure_scenario": "Expand panel 3, then switch neighborhood before its topojson loads. If the stale embed rejects, its catch writes 'Unable to render chart.' into the new neighborhood's #map-nr-acc-3, overwriting a chart that may already be drawn. A stale resolve can likewise label the new chart's export <summary> with the old indicator's name (line 205). Capturing the element before the call avoids both."
  },
  {
    "file": "assets/js/nr-report/chart.js",
    "line": 39,
    "summary": "The geocode is concatenated unquoted into a Vega expression string ('datum.geo_join_id == ' + geocode).",
    "failure_scenario": "geocode comes from a data-* attribute or currentGeocode. Any non-numeric value (e.g. a versioned id like 'UHF101', or an empty string) makes the expression unparseable, vegaEmbed rejects, and the chart shows 'Unable to render chart.'. JSON.stringify(geocode) is the safe form."
  },
  {
    "file": "scripts/nr-postswap-check.mjs",
    "line": 46,
    "summary": "'--limit' with a missing or non-numeric value parses to NaN, keys.slice(0, NaN) selects zero pages, and the script reports PASS.",
    "failure_scenario": "Running `node scripts/nr-postswap-check.mjs --limit` (or `--limit all`) prints 'Checking 0 of 210 report pages' and then 'PASS — all 0 pages match the pre-capture.', exiting 0. Nothing was checked, and the result reads as a pass."
  },
  {
    "file": "scripts/nr-postswap-check.mjs",
    "line": 26,
    "summary": "The documented usage points DE_BASE_URL at /EH-dataportal/, a prefix no environment serves. Project CLAUDE.md states 'No environment serves under /EH-dataportal/'.",
    "failure_scenario": "Following the usage line against a `development` server (which serves /dev-prod/): the gate loads the 404 page, which still declares data_branch='production', so it passes. Every report URL then 404s and redirects home, zero indicators render, and 20 pages report the 'Greenwich Village failure mode' as if the swap had regressed. README-MOD.md:36 repeats the same wrong prefix."
  },
  {
    "file": "scripts/nr-postswap-check.mjs",
    "line": 269,
    "summary": "Conventions (~/.claude/CLAUDE.md): the script ends with process.exit() after network activity, which the rule forbids.",
    "failure_scenario": "Rule: \"`process.exit()` after a `fetch()` returns 127 on Windows ... Have `main()` return its code and set `process.exitCode`, on **every** such path\". ensureDevServer fetches (dev-server.mjs:75) and Playwright drives network traffic. Lines 211 (`process.exit(2)`) and 269 (`process.exit(failures ? 1 : 0)`) can therefore report 127 instead of the intended 0, 1 or 2. nr-r14-probe.mjs:452 already uses the correct form."
  },
  {
    "file": "scripts/nr-characterization.mjs",
    "line": 350,
    "summary": "--baseline deletes the committed baseline directory before capturing, and page.goto at line 131 is not caught, so one timeout leaves the baseline half-deleted.",
    "failure_scenario": "`--baseline` against a server where the second target's goto times out after 30s: outDir (= the committed baseline dir) has already been rmSync'd. The first target's file is rewritten, the other two are gone, and main()'s rejection is unhandled. The working tree now shows two deleted baseline files that a careless `git add` would commit."
  },
  {
    "file": "assets/js/nr-report/app.js",
    "line": 119,
    "summary": "Efficiency: the first paint of the indicator cards waits for the viz table and topic_indicators.json, and the cards need neither.",
    "failure_scenario": "Cards need only the section JSONs. vizTable is used only on panel expand and CSV, and indicatorTopicSlugs only for the 'Full dataset' href. The production Asthma viz JSON is 677,349 bytes uncompressed (measured with curl), and it must download and be parsed by Arquero before any card appears. Rendering cards once the sections arrive, and filling links and charts later, takes that download off the critical path."
  },
  {
    "file": "assets/js/nr-report/chart.js",
    "line": 111,
    "summary": "Efficiency (inherited): each chart spec fetches UHF42.topo.json twice (once for the layer at line 93, once for the lookup at line 111) and borough.topo.json once, by URL.",
    "failure_scenario": "'Expand all' fires 22 vegaEmbed calls at once, which is up to 66 concurrent requests to raw.githubusercontent.com before any response can be cached. Fetching the two topojson files once and passing them as inline values (or a shared named dataset) would make that 2 requests."
  },
  {
    "file": "themes/dohmh/layouts/neighborhood-reports/nr-report.html",
    "line": 356,
    "summary": "Reuse: NR_REPORT_CONFIG.neighborhoodMap rebuilds a slug→name map that the `neighborhoods` global, already loaded on this page by lib-uhflist (line 407), carries as page_name/UHF_name.",
    "failure_scenario": "url.js:10 slugForNeighborhood could be neighborhoods.find(n => n.UHF_name === name)?.page_name. Instead every report page inlines a second 42-entry copy of the same data from the same file, which is one more structure to keep in step."
  },
  {
    "file": "themes/dohmh/layouts/partials/nr-leaflet.html",
    "line": 135,
    "summary": "removeHiddenMapFromTabOrder runs only in the GeoJSON fetch's success path, so on the landing page and topic indexes the aria-hidden map's container and the newly enabled zoom-control links stay keyboard-focusable until that fetch succeeds, and permanently if it fails.",
    "failure_scenario": "This PR turned the zoom control on (zoomControl:false was removed). If the GeoJSON fetch is slow or 404s, a keyboard user tabs onto the Leaflet container and the Zoom in/Zoom out links inside an aria-hidden subtree. That is the 'hidden but focusable' state the function exists to prevent. Calling it once right after L.map(...) closes the gap."
  },
  {
    "file": "themes/dohmh/layouts/partials/nr-leaflet.html",
    "line": 281,
    "summary": "On a neighborhood index, hovering off the page's own highlighted polygon resets it to the default black stroke. The polygon also never gets aria-current (the N-027 fix went into map.js only).",
    "failure_scenario": "With the fly-to removed, the green highlight is now the only marker of the page's neighborhood. After any mouseover/mouseout it reverts to weight 1.5, black, dash '1', and nothing restores it. Screen-reader users get no 'current' state on any of the 42 neighborhood index maps. map.js:53 shows the fix: compare against the page geocode and restore highlightStyle."
  },
  {
    "file": "assets/js/nr-report/report.js",
    "line": 90,
    "summary": "A failed section fetch (data.js:113 stores {}) is shown to readers as 'No data available for this neighborhood.', the same message as data that is genuinely absent.",
    "failure_scenario": "A 404 or network error on one report JSON (for example a case-only rename on EHDP-data, a known hazard per CLAUDE.md) produces a plausible-looking empty section on all 42 neighborhoods' pages for that topic. The only signal is a console.error."
  },
  {
    "file": "scripts/pagefind-characterization.mjs",
    "line": 92,
    "summary": "The default build environment, local_prod, reads EHDP-data from http://localhost/EHDP-data/ through a getresource cache with maxAge = -1 (config/local_prod/config.toml). The comment says the choice is 'a choice of data source and nothing else'.",
    "failure_scenario": "On a machine with a warm Hugo cache and no local data server, --baseline and --check build from cached EHDP-data of unknown age (e.g. nr_indicator_names.json, which feeds the topic indexes' indexed vocabulary), and the run passes. On a machine with neither, the build fails. Either way the result depends on the machine's cache, not on the data branch the baseline is filed under."
  },
  {
    "file": ".gitignore",
    "line": 90,
    "summary": "Ignoring `.claude/` while `.claude/settings.json` and `.claude/commands/js-development.md` stay tracked means any new file there is silently left out of `git add`.",
    "failure_scenario": "Someone adds `.claude/commands/<new>.md` or `.claude/agents/<x>.md`, runs `git add .claude`, and git skips it without warning. Tracked edits still show up, which hides the problem. CLAUDE.md points readers at `.claude/commands/js-development.md`, so the directory is shared project config."
  },
  {
    "file": "package-lock.json",
    "line": 6707,
    "summary": "The production merge (5cca304284) downgraded playwright and playwright-core from 1.62.1 to 1.62.0 in the lockfile and dropped sha.js's engines/funding metadata.",
    "failure_scenario": "After merge, `npm ci` in CI and locally installs an older Playwright than production currently pins, along with the matching older Chromium build. Smoke and characterization runs then shift browser versions as an unreviewed side effect of an NR PR."
  },
  {
    "file": "EHDP feedback for MOD-Lab.md",
    "line": 1,
    "summary": "Root-level working files get merged to production: a contractor feedback note, a generated README-MOD.md, and .cursor/ rules that tell agents README-MOD.md is the 'source of truth'.",
    "failure_scenario": "The feedback note asks why 'all the code [is] wrapped inside an immediately invoked function expression', a pattern no longer in assets/js/nr-report/. README-MOD.md:36 gives a default URL the project CLAUDE.md says does not exist. .cursor/rules/project-context.mdc (alwaysApply: true) sends Cursor agents to that file before the maintained docs."
  },
  {
    "file": "assets/js/nr-report/tertiles.js",
    "line": 45,
    "summary": "Conventions (~/.claude/CLAUDE.md, 'Never write: ... changelog comments'), and several comments describe production state that this merge makes false.",
    "failure_scenario": "Changelog-style: tertiles.js:45 and :72 ('Fixed 2026-08-12; this used to flip on the flag...'), and map.js:78-80, which cites feature-NDHR-prototype files and says 'Neither file is on this branch'. Stale after merge: report.js:15 ('production's `isset .data \"nbr_data_note\"` guard is why the live page emits 22 .data-note divs') and _de-custom.scss:137 ('.data-note, which production still uses'). Once this PR lands, production no longer has either."
  },
  {
    "file": "scripts/dev-server.mjs",
    "line": 238,
    "summary": "The merge put back the branch's older wording over production's and added `const onExit`, which nothing references after process.once.",
    "failure_scenario": "onExit is a dead indirection; the inline arrow it replaced did the same thing. The rewritten header cites 'design §5.1', which names no document, and the error text swaps production's self-explanatory '(two builders share resources/_gen ...)' for 'see d5fb2ea700'. That commit is not an ancestor of production, so a reader on production has no context for the reference."
  },
  {
    "file": "assets/js/nr-report/chart.js",
    "line": 58,
    "summary": "Dead config (inherited): `\"format\": { \"parse\": { \"Value\": \"number\" } }` names a field the chart data does not have.",
    "failure_scenario": "summaryData rows carry geo_join_id, neighborhood and unmodified_data_value_geo_entity. There is no 'Value' field, so the parse directive does nothing, and a reader assumes some field named Value is being coerced."
  },
  {
    "file": "scripts/nr-a11y-audit.mjs",
    "line": 563,
    "summary": "The QR probe's first selector, '#nr-qrcode img', matches nothing: the template's id is 'qrcode' (nr-report.html:264).",
    "failure_scenario": "The probe works only because the fallback '.print-only img' happens to match. If another image ever lands in a .print-only block above the QR (cards.js builds a .print-only row per indicator), qrImage would report that image's alt instead of the QR's."
  },
  {
    "file": "themes/dohmh/layouts/neighborhood-reports/nr-report.html",
    "line": 179,
    "summary": "Typo class 'mb-' on the desktop title wrapper.",
    "failure_scenario": "'mb-' is not a Bootstrap utility and has no effect. Whatever margin was intended (mb-1, mb-2, ...) is not applied."
  }
]
```
