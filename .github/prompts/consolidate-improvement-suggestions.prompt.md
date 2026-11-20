name: consolidate-improvement-suggestions
description: "Run a code review across multiple models, then consolidate the results into one prioritized improvements document."
argument-hint: "Optionally specify a folder or component to review, e.g. 'assets/js/data-explorer/'"
agent: "agent"
---

This prompt automates a two-step code review workflow.

## Step 1 — Collect independent reviews

Send the following review prompt **independently** to each of these four models. If the model names don't match exactly, choose the one that is the closest match. Run each in parallel as a separate subagent so the reviews do not influence each other. Replace all existing documents without consulting them.

- Gemini 3.1 Pro (Preview) (copilot)
- GPT-5.4 (copilot)
- Claude Haiku 4.5 (copilot)
- Claude Sonnet 4.6 (copilot)

If a model is unavailable, skip it and proceed with the others.

### Review prompt (send verbatim to each model)

> Analyze the code in `{target}` and the related Hugo partials and templates
> that render its UI.
>
> Suggest up to 20 concrete improvements to code structure, state management,
> coupling, rendering efficiency, and maintainability.
>
> For each suggestion:
>
> 1. **Problem** — describe the current behavior and why it is a concern.
> 2. **Suggestion** — describe the recommended change.
> 3. **Example** — provide a working code example that fits the project's
>    current browser-side pattern (plain JavaScript, globally loaded scripts,
>    no framework, Hugo-rendered HTML). Keep examples concise.
>
> Format the output as a single Markdown file. Use an H1 title that includes
> the model name (e.g., `# Improvements — Gemini 3.1 Pro`). Number each
> suggestion with an H3 heading.
>
> Do not suggest adding frameworks, build systems, or major new dependencies.
> Stay within the project's existing tooling.

Replace `{target}` with the user's argument. If no argument was provided, default to `assets/js/data-explorer/`.

Save each model's output as `improvements-{model-slug}.md` in the documents folder, where `{model-slug}` is a lowercase kebab-case version of the model name (e.g., `improvements-gemini-3.1-pro.md`).


## Step 2 — Consolidate

After all reviews are collected, read every `improvements-*.md` file produced in Step 1 and consolidate them into a single document using the rules below.

### Consolidation rules

- **Deduplicate.** Where multiple models suggest the same or overlapping changes, merge them into one entry. Keep the clearest problem statement, the most efficient suggestion, and the best code example from any source.
- **Resolve conflicts.** If suggestions conflict, pick the approach that is simplest to implement and least disruptive to the existing codebase.
- **Rank by importance.** Order the final list from most important to least important, grouped into tiers:
  1. Architecture and Data Flow
  2. Coupling and Structure
  3. Performance
  4. DOM and Template Hygiene
  5. Code Quality and Maintenance
- **No limit on count.** Include every distinct suggestion that survives deduplication.
- **Generous whitespace.** Use blank lines between sections and within code blocks so the document is easy to scan.
- **Brief explanatory headings.** Each tier gets a short paragraph explaining why its suggestions matter.
- **Follow Markdown guidelines.** Apply the rules in `.github/instructions/markdown.instructions.md`.

### Output file

Save the consolidated document as:

```text
consolidated-improvements-{{YYYY-MM-DD}}.md
```

where `{{YYYY-MM-DD}}` is today's date. Place it in the `documents` folder.


## Summary of files produced

| File | Contents |
|------|----------|
| `improvements-gemini-3.1-pro.md` | Raw review from Gemini 3.1 Pro |
| `improvements-gpt-5.4.md` | Raw review from GPT-5.4 |
| `improvements-haiku-4.5.md` | Raw review from Haiku 4.5 |
| `improvements-opus-4.6.md` | Raw review from Opus 4.6 |
| `consolidated-improvements-{{YYYY-MM-DD}}.md` | Deduplicated, ranked result |
