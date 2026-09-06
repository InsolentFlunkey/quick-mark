---
id: TASK-022.01
title: Investigate and fix main-window geometry persistence and work-area regression
status: To Do
assignee: []
created_date: '2026-09-06 18:33'
labels:
  - bug
  - regression
dependencies: []
references:
  - user-notes.md
  - TASK-022
parent_task_id: TASK-022
priority: high
type: bug
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Regression report: with no QuickMark instances running, start QuickMark, move/resize its main window, close it so none remain, then relaunch. The main window returns to the same unwanted size/location instead of the user's last geometry. On the user's 57-inch ultrawide KDE Plasma display it occupies roughly the middle 3/7 of the width and extends about 1/4 inch beyond available vertical space, behind a centered bottom panel about 1/2 inch tall. This is unrelated to Move Tab to New Window. TASK-022 previously verified remembered geometry and usable-display bounds; determine when/why those guarantees regressed rather than assuming a particular task caused it. Do not hard-code a fix for the user's monitor. A screenshot is available from the user if needed during investigation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A complete stop/relaunch reproduction identifies and records why main-window size/location is not retained and why vertical bounds are exceeded.
- [ ] #2 Valid main-window size and position survive repeated normal closes and fresh launches with no other QuickMark instance running.
- [ ] #3 Restored outer window bounds respect the usable monitor area, including KDE Plasma panel space, without monitor-specific hard-coded dimensions.
- [ ] #4 Tests and native review cover valid saved geometry, oversized/stale state and repeated launches; preserve reference-window behavior and document any platform constraints.
<!-- AC:END -->
