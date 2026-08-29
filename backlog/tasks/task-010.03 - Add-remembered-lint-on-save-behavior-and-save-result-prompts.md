---
id: TASK-010.03
title: Add remembered lint-on-save behavior and save-result prompts
status: To Do
assignee: []
created_date: '2026-08-29 20:58'
updated_date: '2026-08-29 21:08'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-010.02
parent_task_id: TASK-010
priority: high
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the completed manual linter with an optional, user-selectable lint-on-save workflow. The setting must be remembered. Linting runs only after a document save has actually succeeded, never blocks or reverses that save, and clearly distinguishes clean results, found issues, and linter execution failures. Clean saves use a lightweight confirmation that automatically dismisses after five seconds and may also be dismissed sooner; saves with issues use a durable Yes/No decision that cannot be dismissed accidentally and can open the lint results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can enable or disable lint-on-save through an appropriate application setting or menu control, and the choice persists across restarts
- [ ] #2 Linting runs after successful Save and Save As operations when enabled, using the exact content that was saved
- [ ] #3 Canceled or failed saves do not run lint-on-save and never display a save-complete message
- [ ] #4 A successful save with no issues displays a message equivalent to “Save complete, no linter issues found” that automatically dismisses after five seconds and can be dismissed sooner
- [ ] #5 A successful save with issues displays a durable Yes/No prompt equivalent to “Save complete. Some linter issues have been found. Would you like to view them?”
- [ ] #6 The issue-found prompt cannot be dismissed by Escape, backdrop click, or window ambiguity; Yes opens current lint results and No closes the prompt without changing the saved document
- [ ] #7 A linter execution failure after a successful save reports both facts accurately without presenting a clean or issue-found result
- [ ] #8 Automated tests, restart persistence checks, native prompt timing/dismissal verification, and user documentation cover all lint-on-save outcomes
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-29 21:08
---
Product clarification: the clean-save/no-issues confirmation should automatically dismiss after five seconds, while still allowing earlier manual dismissal. The issue-found Yes/No prompt remains durable and explicit.
---
<!-- COMMENTS:END -->
