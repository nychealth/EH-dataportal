---
name: js-development
description: Vanilla JavaScript conventions for this project — module scope, const/let, arrow functions, 4-space indentation, vertical whitespace, and comment style. Use when writing or editing any .js file.
---

# Vanilla JavaScript conventions

## Scope — no IIFEs

Do not wrap code in an immediately-invoked function expression. `let` and `const`
at the top level of a script do not create `window.*` properties, so an IIFE adds
no safety benefit over just writing module-level declarations.

When a value genuinely needs to be reachable from outside the file, expose it
explicitly:

```js
// expose one function; everything else stays file-scoped
window.nrDownloadCSV = downloadCSV;
```

## Variables — `const` and `let`

- Use `const` by default.
- Use `let` only when the binding is reassigned.
- Never use `var`.

```js
// good
const config = window.NR_TOPIC_SPA_CONFIG;
let currentNeighborhood = '';

// bad
var config = window.NR_TOPIC_SPA_CONFIG;
```

## Functions — named arrow functions

Prefer named arrow functions assigned to `const` over `function` declarations.

```js
// good
const getTertileLabel = (rank, rankReverse) => {
    ...
};

// bad
function getTertileLabel(rank, rankReverse) {
    ...
}
```

Use a `function` declaration only when you specifically need hoisting or a `this`
binding — document why if you do.

Inline callbacks use arrow functions:

```js
rows.forEach(row => {
    ...
});

fetch(url)
    .then(res => res.json())
    .then(data => { ... });
```

Single-expression bodies can drop braces and `return`:

```js
const styleFeature = () => defaultStyle;
const el = id => document.getElementById(id);
```

## Indentation — 4 spaces

Use 4 spaces per indent level. No tabs.

## Vertical whitespace

Add a blank line between logical groups within a function body and before each
`return`. Functions should breathe — a reader should be able to scan and
immediately see the distinct phases.

```js
const renderSection = (section, neighborhoodName) => {

    // Section containers are layout-driven and may be absent in some templates
    const container = document.getElementById(section.containerId);

    if (!container) {
        return;
    }

    // Neighborhood-level rows are pre-grouped during loadSection
    const byNeighborhood = sectionData[section.id] || {};
    const rows = byNeighborhood[neighborhoodName] || [];

    container.innerHTML = '';

    if (!rows.length) {
        container.innerHTML =
            '<p class="text-muted px-2 pb-2 mb-0">No data available for this neighborhood.</p>';
        return;
    }

    rows.forEach(row => {

        const card = document.createElement('div');
        card.innerHTML = buildIndicatorCard(row, section.id, neighborhoodName);
        container.appendChild(card);

    });

};
```

Inside `forEach`, `then`, and similar callbacks: add a blank line after the
opening brace and before the closing brace when the body is more than one line.

## Comments

Add a short comment before each function explaining its purpose. Add inline
comments before non-obvious branches or variable groups — focus on *why*, not
*what*.

```js
// Normalize rank values that may arrive as numbers or strings
const r = String(rank);
// rankReverse indicates indicators where lower values are directionally better
const reverse = rankReverse === true || rankReverse === 'true';
```

Do not end comments with a period. Keep them to one line where possible.

## console.log format

Use a structured `'scope: event: value'` format for trace logs so they are
greppable and easy to filter:

```js
console.log('renderSection: enter:', { sectionId: section.id, neighborhoodName });
console.log('renderSection: branch-missing-container:', section.containerId);
console.log('bootstrap: start');
```

## HTML string indentation

When building HTML via string concatenation, indent each nested element to
reflect the actual DOM hierarchy:

```js
const headerHTML =
    '<div class="card-header" id="' + headingId + '">' +
        '<h2 class="mb-0">' +
            '<button class="btn" type="button" ' +
                'data-toggle="collapse" data-target="#' + collapseId + '">' +
                '<div class="row">' +
                    '<div class="col-7">' +
                        '<span>' + row.indicator_short_name + '</span>' +
                    '</div>' +
                '</div>' +
            '</button>' +
        '</h2>' +
    '</div>';
```
