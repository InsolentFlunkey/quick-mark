---
id: TASK-002.16
title: Open the native file dialog in the last used directory
status: To Do
assignee: []
created_date: '2026-08-29 04:01'
labels:
  - bug
dependencies: []
parent_task_id: TASK-002
priority: medium
type: bug
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve QuickMark’s native Open File experience. On Linux/GTK, opening a document and invoking Open again can return the chooser to the virtual Recent view, which hides the directory breadcrumb and may show only the previously opened matching file. QuickMark should guide the native chooser back to the directory containing the most recently opened document while preserving the operating system’s native dialog and normal user navigation. This behavior was observed after opening a file from the repository’s test-files directory.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After a document is successfully opened, the next Open File dialog starts in that document’s containing directory rather than the native chooser’s virtual Recent view
- [ ] #2 Opening a document through any supported in-app open path updates the directory used by the next Open File dialog
- [ ] #3 When no usable prior directory is available, Open File retains a safe native default and remains fully functional
- [ ] #4 The solution continues to use the operating system’s native file chooser and does not replace or restrict its navigation interface
- [ ] #5 Automated coverage verifies last-directory selection and fallback behavior, and native verification covers the reported Linux/GTK sequence
<!-- AC:END -->
