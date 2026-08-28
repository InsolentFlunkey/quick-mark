---
id: TASK-002.08
title: Resolve the legacy browser viewer's future
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:47'
updated_date: '2026-08-28 19:59'
labels:
  - enhancement
dependencies:
  - TASK-002.07
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
modified_files:
  - QuickMark.html
  - Start-QuickMark.ps1
  - README.md
  - ROADMAP.md
  - >-
    backlog/docs/architecture/quickmark-cross-platform-tauri/doc-002 -
    QuickMark-Cross-Platform-Tauri-Architecture.md
  - tests/markdown-renderer.test.js
  - tests/product-boundary.test.ts
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make and implement an explicit product decision for QuickMark.html after the desktop application reaches feature parity. Retain a focused viewer only if its zero-install value justifies ongoing maintenance; otherwise retire it cleanly. Remove obsolete browser-era launch and persistence workarounds from whichever product path remains.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The decision to retain or retire the standalone browser viewer is recorded with its rationale and maintenance implications
- [ ] #2 If retained, the browser page has a clearly documented viewer-only scope and does not imply dependable native editing or save-in-place
- [x] #3 If retired, users are directed to the desktop application and no supported workflow depends on the legacy page
- [x] #4 Obsolete launch-file, generated README, download-save, and browser-storage workarounds are removed wherever they are no longer required
- [x] #5 Project documentation and roadmap reflect the chosen product boundary
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the product decision to retire and remove the standalone browser editor/viewer: its limited zero-install value does not justify duplicated viewer functionality, browser-sandbox limitations, or a second maintained UI now that the desktop app has parity.
2. Remove `QuickMark.html` rather than retaining a migration page; project documentation becomes the authoritative route to building, installing, and running the Tauri desktop application.
3. Remove browser-only launcher/generated-content infrastructure (`Start-QuickMark.ps1` and its generated launch/README/dependency flow) after confirming no supported workflow still references it; retain shared renderer, editor behavior, and presentation assets consumed by the desktop app.
4. Update the README, architecture record, and roadmap to make the desktop app the sole supported product and eliminate obsolete browser guidance.
5. Update automated assertions to verify shared modules remain desktop-consumed without requiring a legacy entry point, and verify obsolete browser filenames/workarounds are absent from supported documentation.
6. Run frontend tests/build, Rust checks/tests, native build, reference searches, and task-scoped diff validation; record evidence and mark Done only when every acceptance criterion passes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research decision: retire the standalone browser application rather than maintain a viewer-only second product. Its remaining advantage is zero-install viewing, but it still requires a browser-specific markdown-it dependency path, generated README shim, PowerShell launch-file shim, separate toolbar/view interactions, and continued testing of a surface that cannot offer dependable save-in-place. The completed Tauri app already owns rendering, printing, copy controls, drag/drop, and native file operations, so a single supported desktop surface is the clearer product and maintenance boundary. Preserve `QuickMark.html` only as a minimal migration notice/link rather than a functioning editor or viewer.

User confirmed the retirement boundary: if the browser application is no longer supported, remove `QuickMark.html` entirely instead of keeping a migration notice. A lightweight viewer-only page was considered but rejected because its limited lookup value would require maintaining a second viewer surface.

Implemented the approved retirement boundary. Removed `QuickMark.html` and `Start-QuickMark.ps1`; retained `shared/markdown-renderer.js`, `shared/editor-behavior.js`, and `shared/markdown.css` because the Tauri frontend consumes them. README and ROADMAP now describe only the desktop product and current desktop-oriented ideas. Updated doc-002 through Backlog.md to record the rationale, rejected viewer-only alternative, maintenance implications, and sole-product boundary. Added product-boundary tests and removed legacy-entry assertions. Verification: 80/80 Vitest tests pass; TypeScript/Vite production build passes; 5/5 Rust tests pass; rustfmt and Cargo check pass; native Tauri debug build passes; task-scoped diff validation passes. A non-backlog reference search finds obsolete browser filenames only in the tests that assert their absence.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Retired the legacy browser product after desktop feature parity. Removed `QuickMark.html` and its PowerShell launcher instead of maintaining a second viewer surface. Preserved the reusable renderer, editor behavior, and Markdown presentation modules consumed by Tauri. Updated README, roadmap, and the architecture decision to make the desktop application the sole supported QuickMark product and remove browser download, generated README/launch, browser persistence, and dependency-loader guidance. Added product-boundary tests and updated shared-module assertions. Verified with 80 frontend tests, 5 Rust tests, production frontend and native debug builds, rustfmt, Cargo check, reference checks, and task-scoped diff validation.
<!-- SECTION:FINAL_SUMMARY:END -->
