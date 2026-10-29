# Workspace Memory Snapshot

**Read `CLAUDE.md` at the repo root first — it is the current, maintained description of this
codebase.** This file exists only for tools that look in `.github/` for context; it deliberately
holds no architecture inventory, because the copy that used to live here rotted through five
refactors and started actively misleading readers.

Last reconciled against the code: 2026-07-27.

## History of this file

It was written as a mirror of four Copilot workspace memories under `/memories/repo/`
(`data-explorer-analysis`, `geotype-normalization`, `shared-shell-modals`, `leaflet-map-export`),
last synced 2026-05-28. Those four files were never committed to this repo and no longer exist
anywhere reachable — only `memories/repo/page-bundle-publication.md` is real. So this is not a
mirror of anything; it is a standalone file, and the mirroring instruction in
`.github/copilot-instructions.md` has been retired.

Everything the old snapshot asserted about the data explorer's structure was written before the
cutover and before Tiers 2–4. As of 2026-07-27 it was wrong about the directory names, the state
model, where the `show*` renderers are defined, the script load order, and at least six of its
twelve "known issues" — all of which had since been fixed. It was replaced rather than patched.

## Where the current information lives

- `CLAUDE.md` (repo root) — build/validation commands, coding conventions, data explorer
  architecture summary, and the running list of gotchas. Maintained.
- `documents/data-explorer-architecture.md` — the SPA's current-state narrative (load pipeline,
  per-interaction flow, URL sync, ordering constraints). Guarded by `npm run docs-check` and
  carries a `docs-check verified: <commit>` stamp.
- `documents/data-explorer-fresh-audit-2026-07-13.md` — the active audit (Tiers 1–4) and the
  place to log new findings.
- `documents/site-wide-audit-2026-06-27.md` — everything outside the SPA.
- `documents/js-conventions.md` — JS formatting and comment conventions.

Dated audit documents in `documents/` cite old file and function names on purpose. Do not treat
them as descriptions of current code, and do not "correct" them.

## Carried forward, unverified

One note from the old snapshot has no home in the maintained docs and was not re-checked during
this reconciliation, so it is preserved as-is rather than asserted or deleted:

- In `measures.js`, a manual disparities selection must override synced correlate defaults
  whenever the selected primary measure is disparities-capable, or `#show-disparities` can
  reopen the correlate chart. *(Written on or before 2026-05-28 against
  `data-explorer-new/measures.js`; mechanism not confirmed against current code.)*
