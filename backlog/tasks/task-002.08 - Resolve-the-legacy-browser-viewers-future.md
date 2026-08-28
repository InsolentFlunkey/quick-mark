---
id: TASK-002.08
title: Resolve the legacy browser viewer's future
status: To Do
assignee: []
created_date: '2026-08-28 03:47'
labels:
  - enhancement
dependencies:
  - TASK-002.07
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
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
- [ ] #1 The decision to retain or retire the standalone browser viewer is recorded with its rationale and maintenance implications
- [ ] #2 If retained, the browser page has a clearly documented viewer-only scope and does not imply dependable native editing or save-in-place
- [ ] #3 If retired, users are directed to the desktop application and no supported workflow depends on the legacy page
- [ ] #4 Obsolete launch-file, generated README, download-save, and browser-storage workarounds are removed wherever they are no longer required
- [ ] #5 Project documentation and roadmap reflect the chosen product boundary
<!-- AC:END -->
