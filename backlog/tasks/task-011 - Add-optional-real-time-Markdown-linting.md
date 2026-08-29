---
id: TASK-011
title: Add optional real-time Markdown linting
status: To Do
assignee: []
created_date: '2026-08-29 20:59'
labels:
  - enhancement
  - markdown
  - linting
  - performance
dependencies:
  - TASK-010
  - TASK-008
priority: low
type: enhancement
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After the on-command and lint-on-save MVP is established and large-document performance is understood, add an optional real-time linting mode that updates issues during editing without distracting users or degrading responsiveness. Real-time linting must remain opt-in, debounced, and consistent with the same rule profile and results experience as manual linting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can enable or disable real-time linting independently of lint-on-save, and the choice persists across restarts
- [ ] #2 Lint updates are debounced so incomplete keystrokes do not trigger excessive work or disruptive UI churn
- [ ] #3 Editing, rendering, synchronized scrolling, and input responsiveness remain within the established large-document performance budgets
- [ ] #4 Real-time results use the same rule profile, issue identity, navigation, and results pane as on-command linting
- [ ] #5 Stale lint runs cannot replace results for newer document content
- [ ] #6 The feature remains unobtrusive when results are not being viewed and does not open save-result prompts while typing
- [ ] #7 Automated concurrency/performance coverage, native verification, and user documentation cover the optional mode
<!-- AC:END -->
