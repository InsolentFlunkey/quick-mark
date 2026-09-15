---
id: TASK-010.05.01
title: Align lint result profile identity with native tab transfer validation
status: To Do
assignee: []
created_date: '2026-09-14 02:01'
labels:
  - bug
  - linting
  - windows
dependencies: []
references:
  - src/lint-state.ts
  - src/lint-profile.ts
  - src-tauri/src/editor_coordinator.rs
documentation:
  - >-
    backlog/docs/architecture/heading-fragments/doc-011 -
    QuickMark-heading-anchors-and-fragment-validation.md
parent_task_id: TASK-010.05
priority: high
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Native performance measurement after TASK-010.05 exposed a remaining profile identity mismatch: src/lint-state.ts uses quickmark-1-markdownlint-0.41.1, while src/lint-profile.ts and native editor_coordinator.rs transfer validation use quickmark-2-markdownlint-0.41.1. Results display the old profile, and native validation can reject moving tabs that carry lint state. The worker itself runs the current heading-aligned checks. Keep this correction separate from TASK-008. User authorized creating this bug task and fixing it after TASK-008 is complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Current lint results display and transfer using the same profile identity as the active lint engine and native validator.
- [ ] #2 Moving a tab with completed or stale lint results to another window succeeds and preserves appropriate result freshness; genuinely incompatible profile data remains rejected.
- [ ] #3 Automated cross-layer identity/transfer coverage, a standalone native move-tab check, and relevant documentation verify the correction without introducing a parser dependency into UI state-only modules.
<!-- AC:END -->
