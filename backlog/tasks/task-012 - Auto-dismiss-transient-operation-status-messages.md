---
id: TASK-012
title: Auto-dismiss transient operation status messages
status: To Do
assignee: []
created_date: '2026-09-03 01:17'
labels:
  - bug
dependencies: []
priority: high
type: bug
ordinal: 21500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent stale success messages from contradicting the current document state. Transient confirmations such as “Saved document.md” should clear after a short, predictable interval and should be superseded immediately when editing or a newer operation changes the state. Errors and prompts that require attention must remain understandable rather than disappearing prematurely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Successful transient operation messages automatically clear after a documented short interval
- [ ] #2 Editing after a successful save immediately removes or replaces the stale save-success message
- [ ] #3 A newer operation message cannot be cleared by an older pending timeout
- [ ] #4 Failure messages and durable user decisions are not auto-dismissed as though they were transient successes
- [ ] #5 Automated timing and state-transition tests plus native verification cover save, edit, replacement, and failure cases
<!-- AC:END -->
