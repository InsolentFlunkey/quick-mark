---
id: TASK-014.03
title: Add detachable editor windows and cross-window coordination
status: To Do
assignee: []
created_date: '2026-09-06 02:44'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.02
parent_task_id: TASK-014
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build on the tabbed workspace and ownership contracts to move a tab into a new native window. Preserve document identity, current and saved content, capabilities, selection, scroll and view. Transfer requires target acknowledgement before source removal and rollback on failure. Duplicate opens focus the owner across windows; launch/drop routes once; Recent Files and Settings clearing synchronize. Help remains independent. Automatic session restoration is excluded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Move Tab to New Window preserves document and view state with exactly one live owner after acknowledgement.
- [ ] #2 Failed creation/adoption preserves the source; conflicting saves/closes/edits during transfer cannot lose state.
- [ ] #3 Duplicate opens focus the owning tab/window, and native launch/drop routing avoids duplicate document creation.
- [ ] #4 Menus, Recent Files and Settings clearing remain correct across editor windows and reference windows retain their behavior.
- [ ] #5 Automated failure/integration tests, native cross-window review and documentation cover detaching and persistence limits.
<!-- AC:END -->
