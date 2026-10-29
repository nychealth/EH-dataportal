# Copilot Instructions

When editing or generating code in this repository:

- Use 4 spaces for indentation.
- Add generous vertical whitespace and clarifying comments, especially in `assets/js/data-explorer` (see `measures.js` for style). Never modify `assets/js/data-explorer-old/`; it is retired.
- Keep comments concise and practical; favor brief intent-focused notes over long explanations.
- Bias toward more comments—developers want to know intent before reading code.
- Match existing project conventions and file style unless a change is explicitly requested.
- Avoid large, unrelated refactors; keep edits local to the feature being changed.

- Treat this as a Hugo-based static site: change source content, templates, partials, assets, or config, not generated output. Preserve the structure of content, layouts, partials, data files, static assets, and environment config unless explicitly requested.
- Keep browser-side JavaScript lightweight—no new frameworks, build systems, or major dependencies unless requested.
- Use readable helper functions, explicit branching, and lightweight state flow in JavaScript.
- Preserve accessibility and progressive enhancement: interactive features must have clear labels, keyboard support, and sensible fallbacks.
- Respect environment-specific config and deployment assumptions; use config for environment-dependent values, not hardcoded strings.
- Be careful with front matter, slugs, section paths, and asset references—small changes can alter URLs or break builds.
- Favor existing dependencies and patterns over adding new tooling.
- Keep data explorer changes incremental. Reuse existing indicator, measure, geography, and time-period structures unless a deeper redesign is explicitly requested.
- When a behavior is non-obvious, add a short comment explaining the intent, fallback, or constraint.
- Read `CLAUDE.md` at the repo root for build commands, data explorer architecture, and the current list of gotchas. It is the maintained source; `.github/workspace-memory.md` is a stub that points at it.