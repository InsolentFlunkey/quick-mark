---
id: TASK-018
title: Keep the File menu open when displaying Recent Files
status: To Do
assignee: []
created_date: '2026-09-03 02:47'
updated_date: '2026-09-03 02:51'
labels:
  - bug
  - menus
  - recent-files
dependencies:
  - TASK-002.12
priority: high
type: bug
ordinal: 21750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the native application-menu regression where moving the pointer down the File menu causes the entire menu to disappear as the pointer reaches Recent Files, apparently while the Recent Files submenu is being opened. The submenu must remain usable without destabilizing the parent File menu or changing recent-file behavior established by TASK-002.12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Moving the pointer from File menu items onto Recent Files keeps the File menu open and opens a stable Recent Files submenu
- [ ] #2 The Recent Files submenu remains stable and navigable when the recent-file list is empty and when it contains entries
- [ ] #3 Selecting a recent file still opens it through the existing unsaved-change protection, and missing-file handling remains unchanged
- [ ] #4 Keyboard navigation into and out of Recent Files does not dismiss the File menu unexpectedly
- [ ] #5 Automated menu-state coverage where practical plus native desktop verification reproduces the original hover path and confirms the fix
<!-- AC:END -->
