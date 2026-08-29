---
id: TASK-002.16
title: Open the native file dialog in the last used directory
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 04:01'
updated_date: '2026-08-29 04:12'
labels:
  - bug
dependencies: []
modified_files:
  - src/document-operations.ts
  - src/tauri-file-services.ts
  - tests/document-operations.test.ts
  - tests/tauri-file-services.test.ts
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
- [x] #1 After a document is successfully opened, the next Open File dialog starts in that document’s containing directory rather than the native chooser’s virtual Recent view
- [x] #2 Opening a document through any supported in-app open path updates the directory used by the next Open File dialog
- [x] #3 When no usable prior directory is available, Open File retains a safe native default and remains fully functional
- [x] #4 The solution continues to use the operating system’s native file chooser and does not replace or restrict its navigation interface
- [x] #5 Automated coverage verifies last-directory selection and fallback behavior, and native verification covers the reported Linux/GTK sequence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the document file-service contract with a successful-open notification. Have `openDocument` invoke it only after reading, writability detection, and lifecycle loading all succeed, covering picker selections, Recent Files, launch paths, and drag/drop through their shared coordination path.
2. In the Tauri file service, derive and retain the parent directory of the most recently successful open using cross-platform path handling. Supply that directory as the native dialog’s optional `defaultPath`; omit the option when no valid directory has been learned so the operating system retains its normal fallback.
3. Add focused tests for POSIX and Windows parent paths, first-use fallback, subsequent native dialog options, all successful direct/picker opens, and canceled/failed-open non-updates. Preserve the existing native Tauri dialog and navigation behavior.
4. Run the complete frontend suite and production build, then build/run the native app for the reported Linux/GTK sequence before finalizing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after its dedicated tracking commit `b59e4d3` was pushed. The task has no dependencies; its TASK-002 parent remains active with other child work, so this focused child is eligible to proceed.

Current-system research: `src/tauri-file-services.ts` calls Tauri plugin-dialog `open` with filters but no `defaultPath`. All picker, Recent Files, launch-argument, and drag/drop routes converge on `openDocument` in `src/document-operations.ts`; only successful operations should update chooser state. In-memory service state is sufficient for the reported repeated-open sequence and is naturally initialized by successful launch/recent/drop opens during a session; persistence across application restarts is not part of this task’s acceptance criteria.

Implemented successful-open directory tracking through the shared `openDocument` coordinator and native Tauri file service. The picker omits `defaultPath` until a usable parent is known, then supplies the last successful open’s parent; canceled and failed operations do not update it. Added POSIX/Windows path and behavior tests. Verification passes: 128/128 frontend tests across 17 files, production frontend build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and native debug build. Awaiting native Linux/GTK verification of the reported open-then-open sequence.

User completed native Linux/GTK verification: after opening a file from `test-files`, invoking Open again returned directly to that directory with its normal breadcrumb and file listing. The original behavior was confirmed to be GTK reopening the native chooser on its virtual Recent view.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated QuickMark’s native Open File flow to remember the parent directory of each successfully opened document and provide it as the next native chooser’s starting location. Picker selections, Recent Files, launch paths, and drag/drop share the successful-open update; canceled and failed opens retain the prior safe state. The application continues to use Tauri’s operating-system dialog. Verification passed with 128 frontend tests, the production frontend build, 6 Rust tests, rustfmt, Cargo check, a native debug build, and user-confirmed Linux/GTK behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
