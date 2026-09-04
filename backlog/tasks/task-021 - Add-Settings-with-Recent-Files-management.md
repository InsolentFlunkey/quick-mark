---
id: TASK-021
title: Add Settings with Recent Files management
status: To Do
assignee: []
created_date: '2026-09-04 14:49'
labels:
  - feature
  - settings
  - recent-files
dependencies:
  - TASK-018
priority: medium
type: feature
ordinal: 22300
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a conventional, reusable Settings/Preferences surface rather than placing a destructive Clear command directly among recent documents. The first setting should let users clear QuickMark’s persisted Recent Files history deliberately and safely; the surface should be suitable for later theme and lint preferences without implementing those features in this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark exposes a platform-appropriate Settings or Preferences command that opens a non-destructive settings interface
- [ ] #2 The settings interface includes a clearly labeled Clear Recent Files control separated from ordinary document-opening actions
- [ ] #3 Clearing recent files requires confirmation and Cancel leaves the history unchanged
- [ ] #4 Confirming the action removes the persisted history and immediately changes File → Recent Files to the disabled `No Recent Files` placeholder
- [ ] #5 Clearing history never deletes, moves, closes, or modifies document files
- [ ] #6 The settings structure can accept future categories without implementing theme or lint preferences in this task
- [ ] #7 Automated persistence, confirmation, menu synchronization, and accessibility coverage plus native verification confirm the workflow
<!-- AC:END -->
