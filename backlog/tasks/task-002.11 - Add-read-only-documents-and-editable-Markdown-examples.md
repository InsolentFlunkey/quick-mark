---
id: TASK-002.11
title: Add read-only documents and editable Markdown examples
status: To Do
assignee: []
created_date: '2026-08-28 18:00'
updated_date: '2026-08-28 19:49'
labels:
  - enhancement
dependencies:
  - TASK-002.07
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protect read-only filesystem documents and bundled samples from accidental overwrite while preserving QuickMark's live-editing experience. Open the bundled README as a preview-only locked-view reference, and provide a comprehensive bundled Markdown examples document that users can edit locally to learn how source changes affect rendering.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Opening a filesystem document checks its current write permissions and clearly identifies read-only documents in the application
- [ ] #2 Read-only documents remain editable in memory but Save is disabled and Save As remains available
- [ ] #3 The app offers an explicit way to re-check filesystem read-only status and enables Save when the file becomes writable
- [ ] #4 The bundled README opens in Preview mode with Save disabled and the view selector locked to Preview
- [ ] #5 A bundled Markdown examples document demonstrates common supported formatting in source and preview, remains editable in memory, disables Save, and permits Save As
- [ ] #6 Unsaved-change protection and visible statuses remain correct for read-only files and bundled documents
- [ ] #7 Automated tests cover permission-state transitions, bundled-document restrictions, and Save/Save As behavior
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design constraint raised before implementation: opening README or Markdown Examples must not replace, discard, or otherwise disrupt the document the user is actively editing. Decide the reference presentation model with the user before moving this task to In Progress (for example, a separate window, non-destructive reference panel, or another independently closable surface). The user may open these references briefly to look something up, then return to the exact working document and view state. Do not implement the current single-document replacement behavior as the final design.
<!-- SECTION:NOTES:END -->
