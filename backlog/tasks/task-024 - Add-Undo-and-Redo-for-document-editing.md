---
id: TASK-024
title: Add Undo and Redo for document editing
status: To Do
assignee: []
created_date: '2026-09-10 04:27'
labels:
  - feature
  - editor
dependencies: []
priority: medium
type: feature
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide reliable Undo and Redo for Markdown document edits so users can recover from accidental changes and reapply edits they have undone. Cover ordinary text editing and changes made through QuickMark editor tools, including indentation/outdent and table insertion. Expose discoverable Edit menu commands and conventional platform keyboard shortcuts. Keep history isolated per document and preserve existing document lifecycle, dirty-state and read-only protections.

During planning, assess existing native text undo behavior and define coherent edit grouping and history boundaries for save, reload/external replacement, Clear, tab closure and moving a tab to another window. Do not assume that programmatic editor changes participate in native undo. Persistent history across application restarts is outside the initial scope. The user authorized task creation and committing/pushing the task file only; implementation has not been authorized.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Edit → Undo and Edit → Redo and conventional platform keyboard shortcuts operate on the intended focused editing surface; command availability reflects whether the action can be performed.
- [ ] #2 Undo and Redo correctly reverse and reapply typing, deletion, cut/paste, selection replacement, indentation/outdent and table insertion, with sensible action grouping and restored caret/selection.
- [ ] #3 A new edit after Undo discards the superseded redo branch; exhausted history commands safely make no change.
- [ ] #4 Each document has independent edit history that survives switching tabs and saving; Undo/Redo update preview, dirty state and lint-result freshness consistently with the resulting source.
- [ ] #5 Undo/Redo cannot modify read-only documents or bypass pending document-operation protections, and document commands do not intercept editing shortcuts intended for Settings or other dialog fields.
- [ ] #6 History behavior for reload/external replacement, Clear, tab closure and moving tabs between windows is explicitly defined and documented; history never applies changes from another document or an invalidated document state.
- [ ] #7 Automated tests, native keyboard/menu verification and user documentation cover ordinary edits, editor tools, redo branching, save/dirty-state transitions, tab isolation and the documented history boundaries.
<!-- AC:END -->
