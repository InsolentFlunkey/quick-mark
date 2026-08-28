---
id: TASK-002.07
title: Complete desktop UI feature parity
status: To Do
assignee: []
created_date: '2026-08-28 03:47'
labels:
  - enhancement
dependencies:
  - TASK-002.02
  - TASK-002.03
  - TASK-002.06
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bring the migrated desktop interface to an intentional feature-parity point with the existing QuickMark experience, resolving remaining gaps without expanding into unrelated roadmap features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Input-only, preview-only, and split views work in the desktop application
- [ ] #2 Pane swapping and persisted view preferences behave predictably
- [ ] #3 Drag-and-drop loading, clear, bundled README sample, and copy-code interactions have an explicit working desktop equivalent
- [ ] #4 Printing produces the rendered Markdown rather than hidden or editor-only content
- [ ] #5 Errors and status changes are communicated without relying on developer tools
- [ ] #6 The existing manual Markdown fixtures are exercised and parity results are recorded
<!-- AC:END -->
