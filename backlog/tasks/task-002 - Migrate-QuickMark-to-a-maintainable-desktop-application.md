---
id: TASK-002
title: Migrate QuickMark to a maintainable desktop application
status: Done
assignee: []
created_date: '2026-08-28 03:44'
updated_date: '2026-08-29 04:21'
labels:
  - enhancement
dependencies: []
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
priority: high
type: enhancement
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate QuickMark incrementally from its single-file browser architecture to a maintainable Tauri desktop application while preserving its lightweight Markdown viewing and editing experience. Linux is the verified initial distribution platform. The architecture must remain portable to Windows and other Tauri-supported platforms, while Windows packaging and distribution are tracked independently in deferred parent DRAFT-001. Native desktop file operations replace the browser download and generated launch-file workarounds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark runs as a verified desktop application on Linux
- [x] #2 The application architecture does not unnecessarily prevent later Windows or other Tauri-supported platform distributions
- [x] #3 Existing Markdown rendering, code-block copy, editing, preview, and print behavior remains available or has an explicitly documented disposition
- [x] #4 Open, Save, and Save As operate on real filesystem paths without browser download workarounds on the verified desktop platform
- [x] #5 The final disposition of the standalone browser viewer is documented
- [x] #6 All applicable migration child tasks are completed and verified; superseded Windows packaging work is tracked independently
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Execute the approved migration through focused child tasks: establish the portable Tauri foundation and architecture record; modularize rendering and editor behavior; introduce the document lifecycle; add native file operations and unsaved-change protection; reach intentional UI parity; resolve the browser viewer's future; package and document the verified Linux distribution; and complete subsequent desktop refinements. Windows packaging is explicitly outside this parent’s completion scope and is preserved as the independently deferred DRAFT-001 initiative. Each applicable child is independently verified and committed only after user approval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Scope clarified after the Linux desktop migration and shared editor architecture were completed: Windows packaging is no longer a completion gate for this parent. TASK-002.10 is OBE and replaced by deferred standalone parent DRAFT-001; this preserves portability as an architectural requirement without indefinitely blocking unrelated enhancements.

Final audit after backlog restructuring: all 15 applicable direct migration children are Done, including the Linux package/documentation task and subsequent desktop refinements; TASK-002.11's two nested children are also Done. The superseded Windows child TASK-002.10 is archived with an OBE note and Windows distribution is preserved independently as deferred DRAFT-001. Native Linux behavior and the parent’s rendering, editing, file-operation, menu, reference-window, and scrolling capabilities were verified throughout the completed child tasks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed QuickMark’s migration from a standalone browser-oriented implementation to a maintainable, portable Tauri desktop architecture with a verified Linux distribution. The completed child work modularized rendering and editor behavior, added reliable native document operations and unsaved/read-only protections, established native menus and reference windows, resolved the legacy viewer, documented Linux packaging, and delivered subsequent usability improvements including synchronized scrolling and native chooser state. All applicable migration children are Done. Windows distribution was intentionally separated from this completed migration and retained as deferred DRAFT-001.
<!-- SECTION:FINAL_SUMMARY:END -->
