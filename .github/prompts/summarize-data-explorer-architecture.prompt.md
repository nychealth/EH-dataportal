name: summarize-data-explorer-architecture
description: "Analyze the data explorer's data flow, interaction flow, function call order, and UI behavior, then write a markdown walkthrough."
argument-hint: "What part of the data explorer should be analyzed?"
agent: "agent"
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

Analyze the data explorer implementation described in `assets\js\data-explorer-new\` and the related Hugo partials and templates that render its UI.

Produce a markdown document at the top level of the repository. Use `documents\data-explorer-architecture.md` unless the user requests a different filename. Make sure you follow the Markdown guidelines in `.github\instructions\markdown.instructions.md`

Your job is to explain both architecture and behavior:

- Walk through the high-level data flow and logic flow.
- Explain the interaction flow for common user actions such as initial page load, indicator selection, dropdown changes, tab clicks, close actions, and browser back or forward navigation.
- Show which functions are called, in what order, and what changes on the page at each step.
- Distinguish broad overview material from detailed step-by-step behavior.

Structure the markdown with these sections:

1. Table of Contents
2. Overview
3. Key Files And Responsibilities
4. Initial Load Flow
5. Interaction Flows
6. State And URL Synchronization
7. Rendering Pipeline
8. Risks, Edge Cases, And Current Constraints

For each interaction flow:

- Name the triggering user action.
- List the relevant files and functions in execution order.
- Explain what state changes.
- Explain what the user sees change in the UI.
- Call out any legacy aliases, fallbacks, or normalization behavior.

Keep the explanation broad first, then detailed. Be concrete about actual functions and data transitions rather than giving generic architecture commentary.

If the code has changed recently, prefer the current implementation over older assumptions. Reconcile conflicting names or legacy behavior explicitly.