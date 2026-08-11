# flexdatalist v3 upgrade — plan and ledger

*Written 2026-08-11 on branch `feature-upgrade-flexdatalist`. Moved into the repo from
`~/.claude/plans/upgrade-flexdatalist-v3.md` the same day, because a plan outside the repo is
invisible to `git log` and absent from the next clone.*

This file carries both the executable detail and the status, because the work is six tasks —
splitting it across two documents would cost more to keep in step than it would save. §1 is
the ledger; where it and the task list disagree, the ledger is right.

Related prior art, on the unmerged `feature-MOD-Lab-NR-recode-refactor` branch:
`documents/nr-neighborhood-picker-options-2026-08-09.md` and
`documents/nr-accessibility-audit-2026-08-10.md`.

---

## 1. Ledger

**Status as of 2026-08-11: nothing started. Plan written and its library claims verified
against the v3 source; no repo file has been edited, no build or browser check has run.**

| # | Task | Status | Proof |
|---|---|---|---|
| 1 | Add `flexdatalist@^3.1.1`, keep `jquery-flexdatalist` | Not started | Prescribed: `npm ls flexdatalist jquery-flexdatalist` shows both. Not yet run |
| 2 | Swap resource paths at the three load sites | Not started | Prescribed: `hugo` build green — `resources.Get` returns nil on a bad path and `short-fingerprint.html` errors on nil. Not yet run |
| 3 | Add `autodiscover-disabled` to the three inputs | Not started | Prescribed: exactly one `input#flex_search-flexdatalist` in the rendered DOM. Browser only. Not yet run |
| 4 | Port the three init blocks to the v3 API | Not started | Prescribed: on each page, keyboard-select and click-select both act. Browser only. Not yet run |
| 5 | CSS — specificity bump, `--fdl-*` vars, de-duplicate HVI | Not started | Prescribed: three migrated pages visually correct **and** the two NR pages unchanged against a pre-change screenshot. Not yet run |
| 6 | Full verification pass (§5) | Not started | — |

Nothing here is blocked or parked. The NR call sites are **on a separate track** — see §2.

When this lands, close the ledger with one line: done, the date, the commit range.

---

## 2. Context and scope

The site uses `jquery-flexdatalist@2.3.0` for the typeahead on five pages. The same author
(Sérgio Dinis Lopes, `sergiodlopes`) published `flexdatalist@3.1.1` on 2026-04-08 — a
zero-dependency ES6 rewrite of the same widget, with the v2 jQuery line moved to a `v2`
branch. Moving to it drops jQuery from this widget's dependency chain and puts the code on a
maintained line; `jquery-flexdatalist` last shipped in 2023.
[verified 2026-08-11: npm registry metadata for both packages, and the v3 repo README]

jQuery itself stays on the site regardless — Bootstrap 4, DataTables, and roughly a dozen
project scripts depend on it. This is not a jQuery-removal project.

**Three of the five call sites migrate here. The two Neighborhood Reports sites do not.**
`feature-MOD-Lab-NR-recode-refactor` has already rewritten both into a shared partial
(`themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html`) with an accessibility layer
built on flexdatalist's generated DOM, and that branch is not in production. Editing
`section.html` or `topiclanding.html` here would conflict on exactly the lines both branches
touch. Both packages stay installed in the interim; no single page loads both — there are five
load sites, each in a distinct layout. [verified 2026-08-11: `grep -rn jquery-flexdatalist themes/ content/ config/`]

In scope:

- `themes/dohmh/layouts/partials/de-text-search.html` — Data Explorer indicator search.
  Included by `data-explorer/indicator-catalog.html:33` and nowhere else.
- `themes/dohmh/layouts/data-features/hvi.html` + `content/data-features/hvi/hvi.js`
- `themes/dohmh/layouts/data-features/aqe.html` +
  `content/data-features/neighborhood-air-quality/aqe.js`

---

## 3. What was verified about v3

Checked against `sergiodlopes/flexdatalist@master:packages/core/src/flexdatalist.js` and the
npm tarball for 3.1.1, both downloaded 2026-08-11. Line numbers are in that source file. Do
not trust them after a version bump — re-derive.

**Compatible, no work needed:**

- All options in use (`minLength`, `valueProperty`, `textProperty`, `selectionRequired`,
  `focusFirstResult`, `visibleProperties`, `searchIn`, `searchContain`, `searchByWord`,
  `redoSearchOnFocus`, `toggleSelected`, `cache`, `data`) survive with the same names and
  meanings. `valueProperty` still takes an array; `textProperty` still takes `{Property}`.
- The generated alias input still derives its id **and** a matching class as
  `<authoredId>-flexdatalist` (`:854`, `:862`, `:865`), still inserted as the authored input's
  next sibling (`:824`). `#flex_search-flexdatalist` and `.flex_search-flexdatalist` keep working.
- Results markup is still `<ul class="flexdatalist-results">` (`:2566`) of `<li class="item">`
  (`:2468`) with matches in `<span class="highlight">` (`:2254`). The repo's structural
  overrides (`span:not(:first-child):not(.highlight)`) still match.
- `<label for>` is still re-pointed at the alias (`:838`).

**Changed — this is the porting work:**

- Init is `await Flexdatalist.init(selector, options)`, returning `Promise<Flexdatalist[]>`.
- Events are native `CustomEvent`s dispatched on the *authored* input, bubbling (`:3213`). For
  `select:flexdatalist` the selected item is `e.detail` — replacing v2's jQuery `(event, set)`
  second argument.
- Result-item spans are `class="prop-X"`, not v2's `class="item item-X"`. Nothing in this repo
  targets `item-X`; informational only.
- **v3 auto-initialises** `input.flexdatalist:not(.flexdatalist-set):not(.autodiscover-disabled)`
  on `DOMContentLoaded` (`:1090-1092`). All five inputs carry `class="flexdatalist"` and every
  real init runs later inside a fetch callback, so the widget would be built twice — the second
  constructor destroys the first (`:266-273`). Task 3 opts out.
- The package ships `dist/flexdatalist.umd.js` (34,010 bytes, pre-minified by vite) and
  `dist/flexdatalist.css` (6,211 bytes). There is no `.min.js` name to swap in place.
  `short-fingerprint.html` fingerprints and copies but does **not** minify, so the pre-built
  `dist/` files are the right ones to reference.
- The UMD build assigns a module *namespace* to the global, not the class — its tail reads
  `r.Flexdatalist=o, r.default=o`. Under a plain `<script src>`, `Flexdatalist.init(...)`
  fails; the class is `Flexdatalist.Flexdatalist`.

**Not fixed by v3 — this matters for the deferred NR work:**

Both accessibility defects that `nr-neighborhood-picker-js.html` works around on the NR branch
are still present in 3.1.1. `aria-expanded` is written once at setup as `"false"` (`:910`) and
the string appears nowhere else in the file — it is never updated. `_actSearch`'s ignore-list
is `['Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']` (`:1257`), which excludes
`Escape`, so an Escape keyup still schedules a search that re-renders the list the document
keydown handler just removed (`:1043`) — the same shape of bug that branch documented in v2.
Neither `role="combobox"` nor `aria-haspopup` is set on the alias. **`wireComboboxState()`
must be carried across verbatim; v3 does not retire it.**

---

## 4. Tasks

### Task 1 — add the package

**Files:** `package.json`

Add `"flexdatalist": "^3.1.1"` to `dependencies`. **Leave `"jquery-flexdatalist": "^2.3.0"`
in place** — the two NR layouts still load it.

```
npm install flexdatalist@^3.1.1
```

The existing Hugo mount (`config/_default/config.toml:111-113`, `node_modules` →
`assets/node_modules`) reaches `dist/` with no config change.

### Task 2 — swap the three load sites

**Files:** `themes/dohmh/layouts/partials/de-text-search.html:22-26`,
`themes/dohmh/layouts/data-features/hvi.html:206-210`,
`themes/dohmh/layouts/data-features/aqe.html:248-252`

Identical two-line change in each; only the resource paths move.

```
node_modules/jquery-flexdatalist/jquery.flexdatalist.min.css  →  node_modules/flexdatalist/dist/flexdatalist.css
node_modules/jquery-flexdatalist/jquery.flexdatalist.min.js   →  node_modules/flexdatalist/dist/flexdatalist.umd.js
```

Keep the `partial "short-fingerprint.html"` pipe and the `integrity` attributes as they are.

Do **not** touch `neighborhood-reports/section.html:209-213` or
`neighborhood-reports/topiclanding.html:151-155`.

### Task 3 — opt the three inputs out of auto-discovery

**Files:** the `input#flex_search` in `de-text-search.html:5-10`, `hvi.html:28-33`,
`aqe.html:24-29`

Add `autodiscover-disabled` to the existing class list, keeping `flexdatalist` — the CSS
overrides key off it.

```html
class='flexdatalist autodiscover-disabled form-control'
```

Without this the widget is constructed twice on every load: once with default options and no
data at `DOMContentLoaded`, then again when the fetch resolves.

### Task 4 — port the three init blocks

**Files:** `de-text-search.html:47-84`, `content/data-features/hvi/hvi.js:47-90`,
`content/data-features/neighborhood-air-quality/aqe.js:18-63`

All three are the same shape — init inside a `.then()`, a `select:flexdatalist` handler, a
`#clear` click handler — and the option objects are unchanged. Only the surrounding four lines
differ. Worked example from `de-text-search.html`:

```js
// The UMD build exposes a module namespace, not the class.
const FDL = Flexdatalist.Flexdatalist ?? Flexdatalist;

const [fd] = await FDL.init('#flex_search', {
    minLength: 0,
    valueProperty: ["IndicatorID", "IndicatorName"],
    // ...every other option exactly as it is today...
    data: indicatorJSON
});

fd.on('select:flexdatalist', (e) => {
    const set = e.detail;          // v2 passed this as the handler's 2nd argument
    if (typeof printToPage === "function") {
        printToPage(set);
    } else {
        sendToIndicator(set);
    }
});

document.getElementById('clear').addEventListener('click', () => {
    fd.clear();
    document.getElementById('flex_search-flexdatalist').focus();
});
```

Three things to carry into all three sites:

- The enclosing `.then(data => { ... })` callback must become `async` for `await FDL.init` to
  be legal, or the promise handled as `.then(([fd]) => { ... })`. The outer
  `load_flexdatalist` is already `async`; the inner callback is not.
- The selector moves from `$('.flexdatalist')` to `'#flex_search'`. Every page has exactly one.
- `$($input).find("~input").val("")` becomes `fd.clear()`. **This is a behavior change:** the
  old line emptied the visible alias only, leaving the stored value on the authored input.
  `clear()` empties both (`:589-592`). That is what a Clear button should do, but anything
  downstream that read the stale value will now read empty.

`toggleSelected: true` is inert at all three sites — v3 documents it as a multiple-mode tag
control and these are single-value inputs. Leave it or drop it; it changes nothing.

`searchDelay` now defaults to 300 ms against v2's 400, so the dropdown appears slightly
sooner. No action unless it reads as twitchy.

### Task 5 — CSS: consolidate and adopt the custom properties

**Files:** `assets/scss/__portal-custom.scss:1249-1274`,
`content/data-features/hvi/custom.css:2-45`

The same five-rule override block exists in four places. Two are the NR inline `<style>`
blocks — **leave those**; they serve pages still on v2 and sit on the NR branch's conflict
surface (`6e368b6e98` already deletes one of them).

**(a) Raise the specificity of the block in `__portal-custom.scss`.** The library `<link>` is
emitted in the body, after `theme.scss` in head, so at equal specificity the library wins.
Under v2 that was harmless: v2's `.flexdatalist-results li span.highlight` sets only
`font-weight` and `text-decoration`, so the repo's yellow `background: #feff7f` survived. v3's
rule (`flexdatalist.css:251-257`) sets `background` and `color`, which would silently replace
the yellow keyword highlight. Prefix the repo's rules with `ul.` —
`ul.flexdatalist-results li span.highlight` — which outranks the library and still matches
under both versions, since both render the container as a `<ul>`.

**(b) Add the theming block** near the override rules:

```scss
:root {
    --fdl-accent:    #{$primary};   // #008939; library default is indigo #6366f1
    --fdl-accent-fg: #fff;
}
```

`$primary` is at `assets/scss/_a-global-variables.scss:86`. This moves the active result row
from the library's blue (`#2B82C9` under v2) to the site green. v2's stylesheet ignores
`--fdl-*` entirely, so NR pages are unaffected. Hold off on `--fdl-radius` and
`--fdl-font-size` until the §5 screenshots show whether they need it.

**(c) Delete the duplicated block** at `content/data-features/hvi/custom.css:2-45`, keeping
HVI's two genuinely local rules: `.flex_search-flexdatalist { min-width: 50px; width: 50vw;
max-width: 100vw; }` (`:22-26`) and `.flexdatalist { flex-grow: 1; min-width: 50px; }`
(`:42-45`). The site-wide copy already covers the rest on every page.

One rule to check rather than preserve blindly: `.flex_search-flexdatalist input:placeholder-shown`
and `::placeholder` target a descendant `input` of the alias, but in single-value mode the
alias *is* the input — so the selector appears to match nothing under either version. Confirm
in the browser before deciding whether to fix it
(`.flex_search-flexdatalist:placeholder-shown`) or drop it. Pre-existing either way; not
something this upgrade breaks.

---

## 5. Verification

A green build proves the templates compile and the resource paths resolve. It proves nothing
about a typeahead. Everything that can actually break here — the UMD global, the event
payload, the dropdown's appearance, the Clear button — is runtime or visual, so the browser
rung is required and no cheaper rung substitutes for it.

**1. Build.** `hugo`. `resources.Get` returns nil on a wrong path and `short-fingerprint.html`
errors on nil, so green confirms Task 2.

**2. Browser, all three migrated pages** — Data Explorer indicator catalog, HVI, AQE:

- Focus the empty field: results appear (all three run `minLength: 0`).
- Type a partial term: dropdown renders, the matched substring is highlighted **yellow**, the
  secondary properties are the smaller grey text, the active row is green with white text.
- Arrow-key to a result and press Enter, then separately click a result. Both must act — this
  is what proves `e.detail` replaced the v2 `set` argument correctly at every site.
- Click Clear: the field empties and takes focus.
- Confirm exactly one `input#flex_search-flexdatalist` in the DOM. Two means Task 3's opt-out
  did not take.

**3. Console.** Before reporting a clean console, confirm the listener fires at all — trigger
one deliberate `console.warn`. Otherwise "no errors" and "not listening" look identical.

**4. Regression: the two NR pages, still on v2.** They share `__portal-custom.scss`, so Task
5's specificity bump and `:root` block reach them. Dropdown, highlight, and active row must
look exactly as they do on `production`. Compare against a screenshot taken before the change,
not from memory.

**5. Contrast.** White and `rgba(255,255,255,.70)` text on the new `#008939` active row needs
a real contrast check (axe, or a checker). The 70%-alpha secondary text is the one at risk,
and the NR branch is mid-way through accessibility work this must not undercut.

---

## 6. Follow-up, once `feature-MOD-Lab-NR-recode-refactor` merges

Port `themes/dohmh/layouts/partials/nr-neighborhood-picker-js.html` the same way, delete the
two NR inline `<style>` blocks in favour of the consolidated one, and remove
`jquery-flexdatalist` from `package.json`. Carry `wireComboboxState()` across unchanged — per
§3, v3 fixes neither defect it exists for.
