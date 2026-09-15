---
id: TASK-027
title: Add consistent pressed feedback to application buttons
status: To Do
assignee: []
created_date: '2026-09-15 02:23'
labels:
  - enhancement
dependencies:
  - TASK-010.02.01
priority: medium
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User reports that application buttons show hover borders but lack visible feedback when pressed. Inspection during TASK-010.02.01 confirms shared button styles have no pressed state. Add consistent tactile visual feedback across application buttons while preserving existing selected, hover, focus and disabled behavior. User explicitly authorized creation and implementation after TASK-010.02.01 is complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Enabled application buttons show clear, consistent feedback while pressed, without shifting surrounding layout or introducing link-like hover underlines.
- [ ] #2 Keyboard focus remains visible and disabled buttons do not show enabled pressed feedback; persistent selected/pressed states remain distinguishable from momentary activation.
- [ ] #3 Review ordinary toolbar/dialog buttons, lint controls including highlighted Load more, tab controls and issue navigation buttons; document native mouse/keyboard verification and run appropriate build checks.
<!-- AC:END -->
