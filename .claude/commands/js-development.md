---
name: js-development
description: Vanilla JavaScript conventions for this project — scope and module structure, const/let, arrow functions, 4-space indentation, vertical whitespace, comment hierarchy, and debug logging. Use when writing or editing any browser-side .js file, or an inline <script> block in a Hugo layout.
---

# Vanilla JavaScript conventions

**The conventions live in `documents/js-conventions.md`.** Read that file before
writing or editing browser-side JS. It covers all of `assets/js/` plus inline
`<script>` blocks in `themes/dohmh/layouts/`, and it excludes vendored/generated
files by name.

There is no longer a directory-scoped split: one document governs the whole tree,
including `assets/js/data-explorer/`.

The one rule worth knowing before you open it, because it is the only thing that
varies by file:

- **Trace logs go through `debugLog`, not raw `console.log`** — it is gated off on
  `production`/`prod_prod` and defined in `head.html`. (Pending: it arrives with
  `feature-new-data-explorer`; raw `console.log` is acceptable on branches that
  lack it.)
- **Format is call-depth markers** (`"* fn"` / `"** fn"` / `"*** fn"`) everywhere
  **except `assets/js/nr-topic-spa.js`**, which uses structured
  `'scope: event: value'`.
