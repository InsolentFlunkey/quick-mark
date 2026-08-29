---
id: TASK-002.15
title: Implement synchronized source and preview scrolling
status: To Do
assignee: []
created_date: '2026-08-29 03:35'
labels:
  - feature
dependencies:
  - TASK-002.14
documentation:
  - >-
    backlog/docs/research/doc-004 -
    Synchronized-Markdown-source-and-preview-scrolling-investigation.md
parent_task_id: TASK-002
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Turn the verified TASK-002.14 investigation into a production QuickMark feature. In Split view, keep Markdown source and rendered preview aligned in both directions using the documented hybrid block-anchor design. Synchronization is enabled by default, can be disabled through View, and remembers the user's preference. Apply the shared behavior to the main editor and editable Markdown Examples window without affecting the preview-only README window.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sync Scrolling is enabled by default, exposed as a checked View-menu option in the main editor and Markdown Examples, and persists the user's preference
- [ ] #2 In Split view, user scrolling in either source or preview moves the other pane to the corresponding document region without oscillation or feedback loops
- [ ] #3 Synchronization uses measured Markdown block/source anchors with monotonic interpolation and a safe proportional fallback when usable anchors are unavailable
- [ ] #4 Editing and preview rerendering preserve the current logical region without moving the source pane or producing disruptive preview jumps
- [ ] #5 Window resizing, source wrapping changes, delayed image layout, pane swapping, and substantially different source/preview heights invalidate and rebuild mappings predictably
- [ ] #6 Synchronization is inactive outside Split view, remains unavailable in preview-only README, and resumes consistently when Split view returns
- [ ] #7 Large mixed Markdown documents and both scroll directions are covered by automated tests and documented native verification
- [ ] #8 User documentation explains the Sync Scrolling control, remembered default, and the approximation within unusually tall individual blocks
<!-- AC:END -->
