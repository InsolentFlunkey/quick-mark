---
id: TASK-002.04
title: Introduce a reliable document lifecycle
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:46'
updated_date: '2026-08-28 15:24'
labels:
  - enhancement
dependencies:
  - TASK-002.03
modified_files:
  - index.html
  - src/document-lifecycle.ts
  - src/main.ts
  - src/styles.css
  - tests/document-lifecycle.test.ts
  - tests/markdown-renderer.test.js
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give the desktop application an explicit document model for content, identity, saved state, and dirty state. This lifecycle must provide predictable behavior for new, opened, edited, saved, and cleared documents without relying on browser storage as the source of truth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The active document tracks its content, display name, filesystem identity when available, and last saved state
- [x] #2 Dirty state changes correctly after edits and resets only after a successful save or load
- [x] #3 New and untitled documents have predictable names and Save behavior
- [x] #4 Failed or canceled document operations do not incorrectly change document identity or saved state
- [x] #5 Automated tests cover document lifecycle transitions and failure cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a pure TypeScript document lifecycle module with immutable snapshots tracking content, display name, optional filesystem path, saved-content baseline, and derived dirty state.
2. Model new, edit, clear, load-result, save-request, and save-result transitions explicitly. Canceled/failed load or save results will be no-ops, and successful saves will use the request's captured content as the saved baseline so edits made during an in-flight save remain dirty.
3. Give untitled documents a stable `Untitled.md` display name and make save requests explicitly distinguish `save` (existing path) from `save-as` (suggested filename), leaving native path selection and filesystem I/O for TASK-002.05.
4. Integrate the lifecycle into the desktop editor as the source of truth: start with a blank untitled document, update it on textarea input, render from its snapshot, and expose document name/dirty state in accessible status text and the window title.
5. Add focused Vitest tests for initial/new state, edits and reversions, clearing, successful/canceled/failed loads, existing-path and untitled save requests, successful/canceled/failed saves, Save As identity changes, and edits occurring during an in-flight save.
6. Run the full JavaScript suite, TypeScript/Vite build, Cargo check, optimized Tauri build, and `git diff --check`; record acceptance-criteria evidence and finalize only TASK-002.04.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.03 is Done and its commit (3479d3d) is pushed to origin/main. Researching current desktop state handling and adjacent task boundaries before recording the implementation plan.

Research findings: the desktop entry point currently stores the sample directly in the textarea and derives preview/count directly from DOM state; it has no document identity or saved baseline. TASK-002.05 owns native open/save/dialog/launch operations, and TASK-002.06 owns destructive-action prompts and save shortcuts.

Design decision: represent operation completion as discriminated success/canceled/failed results. Only success transitions mutate lifecycle identity or saved state. A save request captures the content being written, preventing a later edit from being incorrectly marked saved when that earlier request completes.

Implemented a pure `DocumentLifecycle` with immutable snapshots for content, display name, optional file path, last-saved content, and derived dirty state. New, edit, clear, load result, save request, and save result transitions are explicit.

Untitled documents consistently use `Untitled.md`; their default save request is Save As with that suggested name. Existing documents request Save to their current path, while explicit Save As requests omit the old path.

Canceled and failed load/save results are state-preserving no-ops. Save requests capture both content and document generation: edits made while a save is in flight remain dirty after success, and stale completion from an earlier document cannot alter the active document.

Integrated the lifecycle as the desktop editor's source of truth. The app starts with a clean blank untitled document, updates the model on input, renders from the snapshot, and exposes filename plus New/Saved/Unsaved state in an accessible live region and window title.

Final verification: `npm test` passed 38/38 tests across 3 files; `npm run build` passed; Cargo check passed; optimized `npm run tauri build` passed and produced the release executable; `git diff --check` passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Introduced a pure TypeScript document lifecycle as the desktop application's source of truth. Immutable snapshots track content, display name, optional filesystem path, last-saved content, and derived dirty state. Explicit transitions cover new documents, edits, clearing, load outcomes, save requests, and save outcomes without using browser storage.

Untitled documents consistently use `Untitled.md` and request Save As, while opened documents request Save to their existing path. Canceled and failed operations preserve state. Save requests capture the content and document generation so edits made during an in-flight save remain dirty and stale completions cannot overwrite a newly active document.

Integrated lifecycle state into the desktop editor, preview, accessible document-status region, and window title. Added comprehensive transition and failure tests; all 38 tests, the TypeScript/Vite build, Cargo check, optimized Tauri build, and diff validation pass.
<!-- SECTION:FINAL_SUMMARY:END -->
