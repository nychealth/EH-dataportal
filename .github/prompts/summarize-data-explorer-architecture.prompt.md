name: summarize-data-explorer-architecture
description: "Analyze the data explorer's data flow, interaction flow, function call order, and UI behavior, then write a repo-root markdown walkthrough with improvement suggestions."
argument-hint: "What part of the data explorer should be analyzed?"
agent: "agent"
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

Analyze the data explorer implementation described by the user's argument. If the argument is broad or omitted, analyze the current data explorer implementation in the workspace.

Produce a markdown document at the top level of the repository. Use `DATA-EXPLORER-ARCHITECTURE.md` unless the user requests a different filename.

Your job is to explain both architecture and behavior:

- Walk through the high-level data flow and logic flow.
- Explain the interaction flow for common user actions such as initial page load, indicator selection, dropdown changes, tab clicks, close actions, and browser back or forward navigation.
- Show which functions are called, in what order, and what changes on the page at each step.
- Distinguish broad overview material from detailed step-by-step behavior.
- Suggest concrete improvements to code structure, state management, coupling, rendering efficiency, and maintainability.

Structure the markdown with these sections:

1. Overview
2. Key Files And Responsibilities
3. Initial Load Flow
4. Interaction Flows
5. State And URL Synchronization
6. Rendering Pipeline
7. Risks, Edge Cases, And Current Constraints
8. Improvement Suggestions

For each interaction flow:

- Name the triggering user action.
- List the relevant files and functions in execution order.
- Explain what state changes.
- Explain what the user sees change in the UI.
- Call out any legacy aliases, fallbacks, or normalization behavior.

Keep the explanation broad first, then detailed. Be concrete about actual functions and data transitions rather than giving generic architecture commentary.

If the code has changed recently, prefer the current implementation over older assumptions. Reconcile conflicting names or legacy behavior explicitly.