---
id: TASK-019
title: Display the active document’s full path
status: Done
assignee:
  - Codex
created_date: '2026-09-03 03:49'
updated_date: '2026-09-04 19:29'
labels:
  - enhancement
  - documents
  - ui
dependencies: []
modified_files:
  - src/document-status.ts
  - src/main.ts
  - src/styles.css
  - tests/document-status.test.ts
  - tests/document-status-wiring.test.ts
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
- [x] #1 The document-status line displays the complete filesystem path followed by the existing state label for an opened or saved document
- [x] #2 The displayed path updates after Open, Recent Files selection, Save, and Save As
- [x] #3 A new document without a filesystem path continues to display `Untitled — New document`
- [x] #4 Dirty, saved, and read-only state wording remains accurate alongside the full path
- [x] #5 Long paths remain readable without breaking the main-window layout
- [x] #6 Automated coverage verifies Unix-style and Windows-style paths plus untitled and state transitions, with native desktop verification
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a pure document-status formatter that uses the lifecycle’s exact filePath for filesystem-backed documents, keeps the user-facing untitled status as “Untitled,” and derives New document, Saved, Read-only, or Unsaved changes wording from the existing snapshot state without changing displayName or Save As suggestions.
2. Replace the inline filename-only formatting in main.ts with the formatter. Rely on the existing renderDocument calls shared by Open, Recent Files, Save, and Save As so every successful identity transition updates the path consistently.
3. Adjust the status-row CSS so long Unix and Windows paths can wrap within the available header width while operation feedback remains usable.
4. Add focused unit coverage for Unix paths, Windows paths, untitled state, saved/read-only/dirty precedence, and identity transitions, plus wiring/layout assertions where useful.
5. Run focused and full frontend tests, production and packaged desktop builds, then perform native verification for Open, Recent Files, Save As, read-only state, dirty state, and a deliberately long path before finalizing the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: DocumentLifecycle already stores the original filePath separately from its basename displayName. main.ts is the only main-window document-status formatter, and all relevant document operations already call renderDocument after successful lifecycle changes. The status row needs explicit min-width/wrapping behavior for long paths.

Automated verification passed with 25 test files and 172 tests, plus the TypeScript/Vite production build and Tauri embedded-frontend debug build.

Native verification completed with isolated writable long-path and read-only fixtures. The user confirmed full-path updates after Open, Recent Files, Save, and Save As; correct saved, dirty, read-only, and untitled wording; and long-path wrapping without layout damage.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a dedicated document-status formatter that shows the exact lifecycle file path for filesystem-backed documents while retaining “Untitled — New document” for new documents. Status wording now consistently distinguishes saved, read-only, and unsaved content without changing basename-based window titles or Save As suggestions. All existing Open, Recent Files, Save, and Save As flows update through their shared render path.

Made the status row resilient to long Unix and Windows paths by allowing the document identity to shrink and wrap while keeping operation feedback available. Added focused formatting, lifecycle-transition, wiring, and layout-contract tests. Verification passed with 172 frontend tests, production and packaged debug builds, and user-confirmed native coverage of every required document transition and state.
<!-- SECTION:FINAL_SUMMARY:END -->
