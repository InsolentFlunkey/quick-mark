---
id: TASK-010.02.01
title: Show loaded lint issue counts and emphasize Load More
status: To Do
assignee: []
created_date: '2026-09-15 00:36'
labels:
  - enhancement
dependencies: []
parent_task_id: TASK-010.02
priority: medium
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During TASK-008 manual review, a document reported 2840 lint issues but initially displayed only 200. The total alone does not clearly communicate that more results remain. Show the displayed range alongside the total (for example, '1–200 of 2840 issues found') and make Load More visually prominent while additional results remain. This task captures the requested UI enhancement only; implementation has not been authorized.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The lint results summary shows the displayed range and total, such as '1–200 of 2840 issues found', and updates after each Load More action.
- [ ] #2 Load More is visibly emphasized while undisplayed issues remain, with accessible contrast and keyboard focus; once all issues are displayed it no longer suggests more are available.
- [ ] #3 Zero issues, fewer than one batch, exact batch boundaries, final partial batches and a fresh lint run show accurate counts without stale ranges.
- [ ] #4 Preserve bounded result rendering and existing issue navigation; verify count progression and button states with focused tests and document manual verification steps.
<!-- AC:END -->
