---
id: TASK-014.04
title: Verify the integrated tab and window workflow
status: To Do
assignee: []
created_date: '2026-09-06 02:44'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.03
parent_task_id: TASK-014
priority: high
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Complete the TASK-014 initiative's integrated release verification after the preceding children have their own tests and documentation. Audit cross-boundary races, save-as collisions, simultaneous opens, transfer failures, close cancellation and restoration limits. Resolve only defects within the initiative scope and complete user guidance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Integrated tests cover simultaneous opens, Save As path collisions, transfer failure and close cancellation without document loss or duplicate ownership.
- [ ] #2 Frontend/native checks and user cross-window verification pass for the complete tab/window workflow.
- [ ] #3 User documentation accurately covers commands, linked navigation, detaching, shared settings and restoration limits.
- [ ] #4 All preceding required TASK-014 children are verified Done and parent acceptance evidence is recorded.
<!-- AC:END -->
