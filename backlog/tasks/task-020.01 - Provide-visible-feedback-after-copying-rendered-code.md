---
id: TASK-020.01
title: Provide visible feedback after copying rendered code
status: To Do
assignee: []
created_date: '2026-09-04 16:13'
labels:
  - enhancement
  - markdown
  - clipboard
  - accessibility
dependencies: []
parent_task_id: TASK-020
priority: medium
type: enhancement
ordinal: 22210
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make successful rendered-code Copy actions visibly apparent without relying on the existing screen-reader-only announcement. Provide immediate feedback at the clicked code block and a consistent transient informational message in every window that renders copyable Markdown code. The feedback must use the same dismissal interval as other transient information and must remain accessible to keyboard and assistive-technology users.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After a rendered code block is copied successfully, that block’s Copy control immediately displays a checkmark or equivalent completed-state indicator
- [ ] #2 While completed feedback is active, the control’s tooltip and accessible label communicate that the content was copied to the clipboard
- [ ] #3 The completed control state reverts to the normal Copy state after the standard transient-information interval
- [ ] #4 Clicking Copy again while feedback is active restarts the completed-state interval without leaving stale timers or indicators
- [ ] #5 A visible informational message reading “Copied to clipboard.” appears for the same transient interval and dismisses automatically
- [ ] #6 Main, README, and Markdown Examples windows provide the same visible and accessible copy feedback
- [ ] #7 Automated tests and native verification cover mouse and keyboard activation, timed reversion, repeated copies, visible messaging, and multi-window behavior
<!-- AC:END -->
