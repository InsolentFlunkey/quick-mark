---
id: TASK-028.01
title: Validate automatic bracket pairing on Linux/WebKitGTK
status: To Do
assignee: []
created_date: '2026-09-19 01:40'
labels:
  - validation
  - editor
  - linux
dependencies: []
documentation:
  - tests/manual/bracket-pairing.md
  - docs/editing.md
parent_task_id: TASK-028
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Perform the deferred Linux/WebKitGTK native review for TASK-028 after a Linux workstation is available. The Windows implementation and validation may complete independently; this subtask tracks platform-specific keyboard, clipboard, focus, and composition risk without holding TASK-028 open.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The production QuickMark build is exercised on Linux/WebKitGTK using the automatic bracket-pairing native review checklist.
- [ ] #2 Pair insertion, closer skipping, paired Backspace, selection wrapping, escaping, paste, Markdown shortcuts, path completion, focus exit and busy-state locking behave as documented.
- [ ] #3 IME composition is reviewed when an applicable Linux input method is available, or the unverified limitation is explicitly recorded.
- [ ] #4 Observed regressions are documented and tracked before the subtask is completed.
<!-- AC:END -->
