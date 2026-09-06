---
id: TASK-002.03.01
title: Investigate and fix Shift+Tab moving focus instead of outdenting
status: To Do
assignee: []
created_date: '2026-09-06 18:32'
labels:
  - bug
  - regression
dependencies: []
references:
  - user-notes.md
  - TASK-014.02
  - TASK-014.03
parent_task_id: TASK-002.03
priority: high
type: bug
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User reports that Shift+Tab while editing a list moves focus to the active tab's close button instead of decreasing indentation. Outdent was an existing verified requirement of TASK-002.03. The introduction point is unknown; the user suspects tab-close controls but does not believe TASK-014.03 introduced it. Reproduce and establish the cause before fixing it. Preserve the intentional Escape-then-Tab/Shift+Tab accessibility escape behavior. This is a separately authorized follow-up, not work to begin during TASK-014.03.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The reported native editor focus/outdent failure is reproduced and its triggering conditions and cause are recorded.
- [ ] #2 Ordinary Shift+Tab outdents the current indented line or selected lines without leaving the editor, including list items and tabs created by New/Open or detachment.
- [ ] #3 Intentional Escape-then-Tab/Shift+Tab focus navigation and ordinary Tab indentation remain functional.
- [ ] #4 Automated editor integration tests and native verification cover the reported case; user-facing keyboard guidance is accurate.
<!-- AC:END -->
