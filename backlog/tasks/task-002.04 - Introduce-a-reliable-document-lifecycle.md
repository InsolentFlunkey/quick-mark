---
id: TASK-002.04
title: Introduce a reliable document lifecycle
status: To Do
assignee: []
created_date: '2026-08-28 03:46'
labels:
  - enhancement
dependencies:
  - TASK-002.03
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give the desktop application an explicit document model for content, identity, saved state, and dirty state. This lifecycle must provide predictable behavior for new, opened, edited, saved, and cleared documents without relying on browser storage as the source of truth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The active document tracks its content, display name, filesystem identity when available, and last saved state
- [ ] #2 Dirty state changes correctly after edits and resets only after a successful save or load
- [ ] #3 New and untitled documents have predictable names and Save behavior
- [ ] #4 Failed or canceled document operations do not incorrectly change document identity or saved state
- [ ] #5 Automated tests cover document lifecycle transitions and failure cases
<!-- AC:END -->
