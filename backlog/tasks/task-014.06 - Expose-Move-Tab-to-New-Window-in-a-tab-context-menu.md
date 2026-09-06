---
id: TASK-014.06
title: Expose Move Tab to New Window in a tab context menu
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
  - TASK-014.03
parent_task_id: TASK-014
priority: medium
type: enhancement
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional follow-up beyond TASK-014's original four required children. Add a right-click menu on a document tab that offers Move Tab to New Window. The command must target the tab whose context menu was opened, even if another tab is active. Existing File-menu detachment already satisfies TASK-014.03; this is an additional access method. Moving into an existing window remains separate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Right-clicking a tab exposes a clearly named Move Tab to New Window action; the menu is also accessible from the keyboard.
- [ ] #2 The action moves the context-menu tab rather than whichever document becomes active later.
- [ ] #3 The action preserves existing transfer acknowledgement, rollback and busy-state protections and existing tab close controls.
- [ ] #4 Automated interaction tests and native review verify inactive-tab targeting and cancellation; documentation includes the new access method.
<!-- AC:END -->
