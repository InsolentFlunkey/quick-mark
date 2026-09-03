---
id: TASK-019
title: Display the active document’s full path
status: To Do
assignee: []
created_date: '2026-09-03 03:49'
labels:
  - enhancement
  - documents
  - ui
dependencies: []
priority: medium
type: enhancement
ordinal: 21900
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the active document’s filesystem identity visible in the main window. Replace the filename-only portion of the existing document-status line with the complete path whenever the document has a filesystem path, while preserving the current untitled-document label and state wording.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The document-status line displays the complete filesystem path followed by the existing state label for an opened or saved document
- [ ] #2 The displayed path updates after Open, Recent Files selection, Save, and Save As
- [ ] #3 A new document without a filesystem path continues to display `Untitled — New document`
- [ ] #4 Dirty, saved, and read-only state wording remains accurate alongside the full path
- [ ] #5 Long paths remain readable without breaking the main-window layout
- [ ] #6 Automated coverage verifies Unix-style and Windows-style paths plus untitled and state transitions, with native desktop verification
<!-- AC:END -->
