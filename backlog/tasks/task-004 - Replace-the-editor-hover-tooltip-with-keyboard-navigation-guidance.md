---
id: TASK-004
title: Replace the editor hover tooltip with keyboard-navigation guidance
status: To Do
assignee: []
created_date: '2026-08-29 18:51'
labels:
  - bug
  - accessibility
dependencies: []
priority: low
type: bug
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the native hover tooltip currently displayed whenever the pointer rests over the Markdown Input pane. The tooltip explains the Escape-then-Tab focus behavior, but it is intrusive for pointer users and poorly discoverable for keyboard-only users. Preserve the keyboard behavior while moving its explanation, together with other relevant keyboard-navigation tips, into durable user instructions. Decide during task execution whether the appropriate home is an expanded README section or a dedicated Instructions document that remains easy to discover.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hovering anywhere over the Markdown Input pane does not display the Escape-then-Tab native tooltip
- [ ] #2 The existing Escape-then-Tab behavior for leaving the editor remains functional and accessible
- [ ] #3 User-facing instructions document how to leave the editor with the keyboard and summarize other relevant QuickMark keyboard-navigation controls
- [ ] #4 The chosen documentation location is discoverable from the application’s existing help or documentation surfaces
- [ ] #5 Automated coverage verifies tooltip removal without regressing the editor’s keyboard behavior or accessible description
<!-- AC:END -->
