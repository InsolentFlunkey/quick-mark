---
id: TASK-001
title: Investigate splitting QuickMark into a viewer-only page + desktop editor app
status: Done
assignee: []
created_date: '2026-07-01 16:45'
updated_date: '2026-07-01 16:50'
labels:
  - enhancement
dependencies: []
documentation:
  - doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QuickMark.html is currently a single static, browser-only app that handles both viewing and editing Markdown, including opening/saving files from disk. File open/save reliability in the browser (File System Access API support, permission re-prompts, drag/drop edge cases, etc.) has proven flaky enough that it's worth exploring a split: keep the HTML page as a lightweight viewer only, and move editing + file I/O into a separate desktop app that can use native OS file APIs instead of browser APIs.

This is an investigation/spike task — the goal is a documented recommendation, not an implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Current file open/save flakiness in QuickMark.html is documented, including root causes tied to browser-only file APIs
- [x] #2 At least 2-3 desktop app approaches are evaluated (e.g., Electron, Tauri, .NET) with pros/cons specific to this codebase and its existing Start-QuickMark.ps1 launcher
- [x] #3 Scope of the remaining viewer-only HTML page is defined: which current features stay (rendering, styling, maybe drag-and-drop preview) vs. which move to the desktop app (editing, save, file management)
- [x] #4 Findings and a recommendation are captured as a Backlog doc for future reference
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Read QuickMark.html and Start-QuickMark.ps1 in full to ground the investigation in the actual current implementation before evaluating options.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Investigated splitting QuickMark into a viewer-only page + desktop editor app. Root cause of save flakiness: the Save button uses a Blob + synthetic `<a download>` click, which always downloads a new copy rather than overwriting the original file in place — there's no persistent file handle. Open-with-file also relies on a PowerShell-generated `vendor/launch.js` shim as a workaround for static HTML having no way to receive a file argument. Evaluated Electron, Tauri, and WPF/WinForms+WebView2; recommended WPF/WinForms+WebView2 since it reuses the existing front-end almost unchanged, needs no new Node/Rust toolchain, and fits the project's existing Windows/PowerShell-only tooling. Defined the split: viewer page keeps rendering/printing/loading-for-viewing only (no save, no dirty-tracking), desktop app owns editing and all real file I/O. Full writeup in doc-001. Follow-up implementation work should be filed as a new parent task, not appended to this one.
<!-- SECTION:FINAL_SUMMARY:END -->
