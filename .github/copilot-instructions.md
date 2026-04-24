# Copilot Instructions

When generating or editing code in this repository:

- Use 4 spaces for indentation.
- Prefer generous vertical whitespace so logic is visually separated into small, readable blocks.
- In `assets/js/data-explorer-new`, use `measures.js` as the spacing guide: add extra vertical whitespace inside functions, especially around guard clauses, setup sections, and major conditional branches.
- Add frequent short clarifying comments where intent is not immediately obvious.
- Keep comments concise and practical; favor brief intent-focused notes over long explanations.
- Bias toward adding more comments. The developers like knowing what the code is for or how it works before they look at the actual code.
- Preserve existing project conventions unless a requested change requires a different approach.
- Avoid large unrelated refactors while completing focused tasks.

- Treat this as a Hugo-based static site. Prefer changing source content, templates, partials, assets, and config instead of generated output. Preserve the current structure of content, layouts, partials, data files, static assets, and environment-specific config, unless explicitly requested.
- Keep edits local to the feature being changed. Avoid mixing content rewrites, template changes, and JavaScript refactors unless the task requires all of them.
- Match the surrounding file style before introducing new structure. In JavaScript, favor readable helper functions, explicit branching, and lightweight state flow.
- Keep browser-side JavaScript lightweight. Do not introduce new frameworks, build systems, or major dependencies unless explicitly requested.
- Preserve accessibility and progressive enhancement. Interactive features should keep working with clear labels, keyboard support, and sensible fallbacks.
- Respect environment-specific config and deployment assumptions. Put environment-dependent values in config rather than hardcoded strings.
- Be careful with front matter, slugs, section paths, and asset references, since small changes can alter generated URLs or break builds.
- Favor existing dependencies and patterns over adding new tooling.
- Keep data explorer changes incremental. Reuse existing indicator, measure, geography, and time-period structures unless a deeper redesign is explicitly requested.
- When a behavior is non-obvious, add a short comment explaining the intent, fallback, or constraint.
- When adding or updating repo memory entries under `/memories/repo`, also mirror those additions in `.github/workspace-memory.md` so memory context is preserved in-repo.