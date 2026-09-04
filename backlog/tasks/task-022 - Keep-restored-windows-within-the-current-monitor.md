---
id: TASK-022
title: Keep restored windows within the current monitor
status: To Do
assignee: []
created_date: '2026-09-04 14:49'
labels:
  - bug
  - windows
  - desktop
dependencies: []
references:
  - >-
    https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/window-state/src/lib.rs
  - 'https://github.com/tauri-apps/plugins-workspace/issues/2620'
priority: high
type: bug
ordinal: 22100
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Correct QuickMark’s window-state restoration when persisted physical dimensions are invalid, incorrectly scaled, or larger than the available display. QuickMark currently has a saved main-window size of 4498 × 4800 pixels and restores it without a usable monitor-bound size, despite the window-state plugin being installed. Preserve valid remembered geometry while recovering safely from oversized or stale state for main and reference windows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A restored QuickMark window never opens wider or taller than the usable current display
- [ ] #2 Valid remembered size and position continue to survive a normal close and relaunch
- [ ] #3 Oversized, corrupt, stale-monitor, and incorrectly scaled saved geometry recover to a usable bounded size instead of compounding across launches
- [ ] #4 Main, README, and Markdown Examples windows follow the same safe restoration rules
- [ ] #5 First launch without saved state retains sensible default and minimum dimensions
- [ ] #6 Automated geometry/state tests plus native verification cover valid restoration, oversized saved state, display changes, and repeated relaunches
<!-- AC:END -->
