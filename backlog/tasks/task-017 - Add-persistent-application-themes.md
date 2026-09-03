---
id: TASK-017
title: Add persistent application themes
status: To Do
assignee: []
created_date: '2026-09-03 01:18'
labels:
  - enhancement
  - themes
  - accessibility
dependencies:
  - TASK-014
priority: medium
type: enhancement
ordinal: 23750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide user-selectable visual themes for QuickMark, including Dark, Light, and a recovered or faithfully recreated version of the original QuickMark color scheme when available from repository history. Theme selection should apply consistently across the main workspace, dialogs, rendered content, reference windows, tabs, and detached windows, and persist across restarts. Implement after the multi-window document architecture so propagation is designed for the final window model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark provides accessible Dark and Light themes plus a documented disposition for the original QuickMark color scheme
- [ ] #2 The original color scheme is recovered from repository history when possible and offered as a distinct theme or its relevant characteristics are deliberately incorporated
- [ ] #3 Theme selection is available from a clearly named application control and persists across application restarts
- [ ] #4 The selected theme applies consistently to editor, preview, toolbar, menus where platform APIs permit, dialogs, reference windows, tabs, and detached windows
- [ ] #5 All themes maintain readable contrast and visible focus, disabled, error, selection, and hover states
- [ ] #6 Printing remains intentionally styled and is not accidentally changed by the active screen theme
- [ ] #7 Automated preference and presentation tests plus native multi-window verification and user documentation cover theme selection and persistence
<!-- AC:END -->
