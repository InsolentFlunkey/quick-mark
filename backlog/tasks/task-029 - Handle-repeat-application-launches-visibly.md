---
id: TASK-029
title: Handle repeat application launches visibly
status: Done
assignee:
  - Codex
created_date: '2026-09-17 01:09'
updated_date: '2026-09-17 01:29'
labels:
  - bug
dependencies: []
documentation:
  - 'https://v2.tauri.app/plugin/single-instance/'
modified_files:
  - src-tauri/src/lib.rs
  - src-tauri/src/editor_coordinator.rs
priority: high
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make repeat launches of QuickMark produce a visible, predictable result while preserving the existing single-process document coordination. A plain repeat launch should create a new blank editor window. A repeat launch with a supported document should focus the existing tab when already open or add the document as a new tab without replacing any open document.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Launching QuickMark again without a document creates and focuses a new blank editor window in the running QuickMark process
- [x] #2 Launching QuickMark with a supported document that is not open adds it as a new tab without replacing or closing any existing tab
- [x] #3 Launching QuickMark with a document that is already open focuses that document in its existing tab and window without creating a duplicate
- [x] #4 A window targeted by a repeat launch is shown and restored when minimized, brought to the foreground when Windows permits, and requests taskbar attention as a fallback
- [x] #5 Automated tests cover plain repeat launches, new-document launches, already-open documents, and preservation of existing tabs
- [x] #6 The Windows application is rebuilt and the repeat-launch flows are manually verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the single-instance callback and editor coordinator to represent both document launches and blank repeat launches.
2. Reuse the existing in-process multi-window model: route an already-open document to its owner, queue a new document as an additional tab in the most recently focused editor, and create a fresh blank editor window for a plain repeat launch.
3. Centralize window activation so repeat launches show and unminimize the target, request focus, and request Windows taskbar attention as a fallback.
4. Add focused Rust tests for launch routing and preservation behavior, then run the frontend and Rust suites.
5. Rebuild the Windows application and manually verify plain, new-document, already-open, minimized, and background-window launches.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented explicit repeat-launch routing. Plain launches allocate a fresh editor window; document launches route to the owning or most recently focused editor and retain the existing tab set.

Window activation now unminimizes, shows, focuses, and requests informational user attention as a taskbar fallback.

Verification passed: 55 Rust tests, 425 frontend tests, and the production frontend build.

Live Windows verification passed on the rebuilt release: a plain second launch created two visible QuickMark windows in one process; launching two documents produced two retained tabs; relaunching the second document kept two tabs and selected the existing tab.

Minimized-window verification passed: relaunching an open document changed the owning window from minimized to restored and made that exact window the Windows foreground window.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Repeat launches now produce a visible result through QuickMark's existing single-process coordinator. Plain launches create a fresh blank editor window; file launches route to the owning or most recently focused editor, add unopened files without replacing existing document tabs, and focus already-open files without duplication. Target windows are unminimized, shown, focused, and request taskbar attention as a fallback.

Validated with 55 Rust tests, 425 frontend tests, the production frontend/lint-worker/build checks, a successful Windows release and NSIS build, and live Windows checks covering new windows, new tabs, duplicate prevention, tab focus, minimization, restoration, and foreground activation.
<!-- SECTION:FINAL_SUMMARY:END -->
