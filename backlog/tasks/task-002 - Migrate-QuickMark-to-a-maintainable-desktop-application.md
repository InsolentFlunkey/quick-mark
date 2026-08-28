---
id: TASK-002
title: Migrate QuickMark to a maintainable desktop application
status: To Do
assignee: []
created_date: '2026-08-28 03:44'
updated_date: '2026-08-28 04:53'
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
QuickMark has outgrown its single-file browser architecture. Migrate it incrementally to a cross-platform Tauri desktop application while preserving its lightweight Markdown viewing and editing experience. Linux and Windows are the initial supported platforms, and the architecture should remain portable to additional Tauri-supported platforms. Native desktop file operations must replace the browser download and generated launch-file workarounds. The migration must remain divided into independently verifiable child tasks so existing behavior can be preserved throughout the transition.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark runs as a desktop application on Linux and Windows
- [ ] #2 The application architecture does not unnecessarily prevent support for additional Tauri-supported platforms
- [ ] #3 Existing Markdown rendering, code-block copy, editing, preview, and print behavior remains available or has an explicitly documented disposition
- [ ] #4 Open, Save, and Save As operate on real filesystem paths without browser download workarounds on each supported platform
- [ ] #5 The final disposition of the standalone browser viewer is documented
- [ ] #6 All migration child tasks are completed and verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Execute the approved migration through the existing child-task sequence: establish the cross-platform Tauri foundation and architecture record; modularize rendering and editor behavior; introduce the document lifecycle; add native file operations and unsaved-change protection; reach intentional UI parity; resolve the browser viewer's future; then package and document Linux and Windows distributions. Each child is independently verified and committed only after user approval.
<!-- SECTION:PLAN:END -->
