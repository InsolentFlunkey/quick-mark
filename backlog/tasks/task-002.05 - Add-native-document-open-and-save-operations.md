---
id: TASK-002.05
title: Add native document open and save operations
status: To Do
assignee: []
created_date: '2026-08-28 03:46'
labels:
  - feature
dependencies:
  - TASK-002.04
parent_task_id: TASK-002
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace QuickMark's browser upload, download, and generated launch-file workarounds with dependable desktop filesystem operations connected to the document lifecycle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Open lets the user select and load supported Markdown or text files from the filesystem
- [ ] #2 Save writes an opened document back to its existing filesystem path
- [ ] #3 Save As lets the user choose a new path and updates the active document identity after success
- [ ] #4 Canceled and failed operations preserve the existing document and report an understandable result
- [ ] #5 Opening a supported file through the desktop application's launch arguments loads that file
- [ ] #6 Automated tests cover file-operation coordination where it can be tested without native dialogs
<!-- AC:END -->
