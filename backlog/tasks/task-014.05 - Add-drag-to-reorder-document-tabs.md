---
id: TASK-014.05
title: Add drag-to-reorder document tabs
status: To Do
assignee: []
created_date: '2026-09-06 18:33'
labels:
  - enhancement
  - follow-up
dependencies:
  - TASK-014.04
references:
  - user-notes.md
parent_task_id: TASK-014
priority: medium
type: enhancement
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional follow-up beyond TASK-014's original four required children. Allow users to rearrange document tabs within the same editor window by dragging them. This was not a requirement of TASK-014.02 or TASK-014.03. Cross-window dragging/transfers are a separate enhancement and must not be silently included.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dragging a tab to another position changes the tab order in that window with understandable placement feedback.
- [ ] #2 Reordering preserves document identity, active document, content, dirty state, selection, scroll and View settings.
- [ ] #3 Canceled or invalid drags leave the workspace intact, and existing keyboard switching and inset close controls remain usable.
- [ ] #4 Automated interaction tests and native review cover reordering and cancellation; documentation explains the action.
<!-- AC:END -->
