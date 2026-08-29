---
id: TASK-002
title: Migrate QuickMark to a maintainable desktop application
status: To Do
assignee: []
created_date: '2026-08-28 03:44'
updated_date: '2026-08-29 04:19'
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
- [ ] #1 QuickMark runs as a verified desktop application on Linux
- [ ] #2 The application architecture does not unnecessarily prevent later Windows or other Tauri-supported platform distributions
- [ ] #3 Existing Markdown rendering, code-block copy, editing, preview, and print behavior remains available or has an explicitly documented disposition
- [ ] #4 Open, Save, and Save As operate on real filesystem paths without browser download workarounds on the verified desktop platform
- [ ] #5 The final disposition of the standalone browser viewer is documented
- [ ] #6 All applicable migration child tasks are completed and verified; superseded Windows packaging work is tracked independently
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Execute the approved migration through focused child tasks: establish the portable Tauri foundation and architecture record; modularize rendering and editor behavior; introduce the document lifecycle; add native file operations and unsaved-change protection; reach intentional UI parity; resolve the browser viewer's future; package and document the verified Linux distribution; and complete subsequent desktop refinements. Windows packaging is explicitly outside this parent’s completion scope and is preserved as the independently deferred DRAFT-001 initiative. Each applicable child is independently verified and committed only after user approval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Scope clarified after the Linux desktop migration and shared editor architecture were completed: Windows packaging is no longer a completion gate for this parent. TASK-002.10 is OBE and replaced by deferred standalone parent DRAFT-001; this preserves portability as an architectural requirement without indefinitely blocking unrelated enhancements.
<!-- SECTION:NOTES:END -->
