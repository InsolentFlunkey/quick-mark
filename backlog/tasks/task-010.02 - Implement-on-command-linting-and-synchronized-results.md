---
id: TASK-010.02
title: Implement on-command linting and synchronized results
status: To Do
assignee: []
created_date: '2026-08-29 20:58'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-010.01
parent_task_id: TASK-010
priority: high
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the core QuickMark linting experience defined by the approved lint design. Users must be able to lint the current in-memory document without saving, inspect actionable issues in the right-hand workspace, navigate between issues and source, and return to the rendered Preview without losing document state. Results should participate in the existing source-synchronization model where meaningful, including sparse-result and no-result cases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A toolbar action and native menu action lint the active in-memory document on demand
- [ ] #2 Lint results identify rule, message, line, column when available, and enough context to act on each issue
- [ ] #3 Selecting an issue moves focus and the caret to the corresponding source location
- [ ] #4 The results pane can be switched back to rendered Preview without changing document content, selection, dirty state, or view preferences
- [ ] #5 Source and lint results synchronize scrolling or nearest-issue navigation predictably in both directions, including sparse issue sets
- [ ] #6 A document with no issues shows an unambiguous clean result without leaving stale issues visible
- [ ] #7 Lint execution errors are reported separately from lint findings and leave editing and Preview functional
- [ ] #8 Automated tests, native verification, and user documentation cover the complete on-command workflow
<!-- AC:END -->
