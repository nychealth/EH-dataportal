## Plan: Data Explorer Structural Cleanup

Recommend a light, non-behavioral cleanup focused on comment density, heading consistency, spacing, and a few safe function moves. Avoid changing execution order or cross-file dependencies because this codebase relies on synchronous script load order and shared globals.

**Steps**
1. Normalize comment density in active files: keep one summary comment per function and one intent comment only for non-obvious branches or loops; remove stacked duplicate comments where a heading and inline summary say the same thing.
2. Standardize section headers across active files: use one banner style for top-level sections, one style for subsections, and avoid mixing decorative divider styles within a file.
3. Tighten vertical spacing in long files: keep one blank line between small setup statements and two blank lines between major sections/functions; remove extra air around simple conditionals and array literals.
4. In app.js, group related blocks by lifecycle: URL serialization helpers, URL normalization helpers, render dispatcher, history listener, DOMContentLoaded wiring, analytics hooks.
5. In menu.js, keep helper functions together at the top and move the generic menu renderer next to the selection handler, since they form one interaction unit.
6. In measures.js, move small internal tab utility helpers (disableTab/enableTab) to module-level helpers above renderMeasures, but keep showTable/showMap/showBar/showTrend/showLinks inside renderMeasures because they intentionally close over current per-indicator arrays.
7. In topic-indicator-selector.js, keep metadata-loading helpers together, then modal rendering helpers, then boot/load helpers (checkURL, printIndicatorInfo, selectIndicator).
8. Leave map.js and data.js mostly in place; their execution flow already matches the data pipeline well enough, and larger movement would increase risk without much readability gain.

**Relevant files**
- c:\Users\Chris\Documents\DOHMH\Programming\EH-dataportal\assets\js\data-explorer-new\app.js — consolidate duplicate comments and group lifecycle-related helpers.
- c:\Users\Chris\Documents\DOHMH\Programming\EH-dataportal\assets\js\data-explorer-new\menu.js — reduce repeated explanatory comments and group menu-render/selection helpers.
- c:\Users\Chris\Documents\DOHMH\Programming\EH-dataportal\assets\js\data-explorer-new\measures.js — extract tiny pure helpers only; keep closure-based show* functions where they are.
- c:\Users\Chris\Documents\DOHMH\Programming\EH-dataportal\assets\js\data-explorer-new\topic-indicator-selector.js — reorder toward fetch/render/bootstrap phases.
- c:\Users\Chris\Documents\DOHMH\Programming\EH-dataportal\assets\js\data-explorer-new\bar.js — reduce commented-out historical blocks or isolate them under a single Legacy Notes header.

**Verification**
1. After any cleanup, run workspace diagnostics on assets/js/data-explorer-new.
2. Smoke-test topic page load, measure/geo/time changes, tab changes, browser back/forward, and section.html modal navigation.
3. Confirm no file that depends on load order starts referencing functions declared later in the script tag sequence.

**Decisions**
- Included: formatting, comment cleanup, heading normalization, and safe intra-file reordering.
- Excluded: module splitting, bundling, state model changes, and moving closures across files.
- Recommended caution: do not move show* closures out of measures.js unless you are ready to refactor their captured state explicitly.

**Further Considerations**
1. app.js and menu.js currently have some duplicate explanatory comments introduced by iterative passes; cleaning those first gives the biggest readability improvement for the least risk.
2. bar.js contains the highest concentration of commented-out historical spec code; if kept, label it clearly as reference-only, otherwise remove it in a separate cleanup task.
3. Prototype files like _bar.js and choro.js should either keep minimal comments plus a Legacy/Prototype heading or be moved to a dedicated prototypes folder in a separate task.