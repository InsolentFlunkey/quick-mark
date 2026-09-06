---
id: TASK-014.08
title: Improve the initial size of detached editor windows
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
  - TASK-022
parent_task_id: TASK-014
priority: medium
type: enhancement
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional follow-up beyond TASK-014's original four required children. The user reports that Move Tab to New Window creates a usable but noticeably too-small editor window. Choose a more comfortable initial size through user review. This is separate from the main-window stop/relaunch persistence regression tracked under TASK-022. The user's monitor is a 57-inch ultrawide, but the behavior must suit ordinary displays too. Do not assume source-window geometry inheritance, persistent detached geometry, or changes to full-editor functionality without reviewing the sizing behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A proposed initial sizing behavior is reviewed and approved by the user before implementation.
- [ ] #2 Newly detached windows open at a comfortable approved size and remain within the current monitor's usable area, including decorations and desktop panels.
- [ ] #3 Sizing works on ordinary and ultrawide displays without hard-coded assumptions about the user's monitor, and does not change main-window persistence or add session restoration.
- [ ] #4 Automated size/bounds verification and native review cover the chosen behavior; documentation reflects any user-visible sizing rules.
<!-- AC:END -->
