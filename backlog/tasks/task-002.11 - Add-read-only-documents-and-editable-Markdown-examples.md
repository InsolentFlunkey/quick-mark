---
id: TASK-002.11
title: Add read-only documents and editable Markdown examples
status: Done
assignee: []
created_date: '2026-08-28 18:00'
updated_date: '2026-08-29 01:31'
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
Deliver safe read-only document behavior and non-destructive bundled reference experiences. The main working document must remain intact when users consult README or Markdown Examples. Implement this through independently verifiable child tasks for document/save capabilities and dedicated reference windows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filesystem documents expose reliable writable/read-only state with visible status and safe Save/Save As behavior
- [x] #2 README opens in a dedicated preview-only reference window without replacing the active document
- [x] #3 Markdown Examples opens in a dedicated editable source/preview playground without replacing the active document
- [x] #4 Reference windows are single-instance per reference type and preserve their in-session state when refocused
- [x] #5 Application menus and commands follow the focused window so actions never target a hidden or unintended document
- [x] #6 The capability and reference-window architecture is covered by automated tests and documented native verification
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design constraint raised before implementation: opening README or Markdown Examples must not replace, discard, or otherwise disrupt the document the user is actively editing. Decide the reference presentation model with the user before moving this task to In Progress (for example, a separate window, non-destructive reference panel, or another independently closable surface). The user may open these references briefly to look something up, then return to the exact working document and view state. Do not implement the current single-document replacement behavior as the final design.

Approved design: represent independent document capabilities rather than one overloaded read-only flag. Normal files are editable and support Save/Save As/any view; read-only filesystem files remain editable in memory, disable Save, permit Save As, and offer Re-check; bundled README is non-editable, non-saveable, and Preview-only in its own window; Markdown Examples is editable in memory, disables Save, permits Save As, defaults to Split, and offers Reset. README and Examples open/focus one dedicated window each and never replace the main document. Examples edits persist while its window remains open and receive unsaved-close protection. Menus must reflect the focused window to prevent commands affecting a hidden main editor.

Child TASK-002.11.02 completed and verified the filesystem document capability/read-only stage. Continuing umbrella delivery through TASK-002.11.01 for dedicated reference windows.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the approved read-only/reference design through two verified child tasks. Filesystem documents now expose explicit capabilities, safe writability checks, Save gating, Save As recovery, and permission re-checking. README and Markdown Examples open in isolated reusable windows without affecting the active document; Examples provides a protected editable playground. Menus follow window context and window geometry persists through the official Tauri plugin.
<!-- SECTION:FINAL_SUMMARY:END -->
