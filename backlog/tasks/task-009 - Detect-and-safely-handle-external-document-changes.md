---
id: TASK-009
title: Detect and safely handle external document changes
status: To Do
assignee: []
created_date: '2026-08-29 20:57'
labels:
  - feature
  - data-integrity
dependencies: []
priority: high
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protect users when an open document is modified, replaced, moved, or deleted by another application. QuickMark should detect relevant filesystem changes and offer understandable choices without silently overwriting external work or discarding unsaved in-memory edits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark detects when the active file is modified, replaced, moved, or deleted outside the application
- [ ] #2 External changes do not silently overwrite dirty in-memory edits or get silently overwritten by Save
- [ ] #3 The user receives clear choices appropriate to clean and dirty document states, including reloading or preserving their in-memory work
- [ ] #4 Save, Save As, read-only re-checking, recent files, and close protection remain coherent after an external change
- [ ] #5 Automated state/coordination tests and native filesystem verification cover representative change, deletion, conflict, and recovery scenarios
- [ ] #6 User documentation explains external-change handling and any platform limitations
<!-- AC:END -->
