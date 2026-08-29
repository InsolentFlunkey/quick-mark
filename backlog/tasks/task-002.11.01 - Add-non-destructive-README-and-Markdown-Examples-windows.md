---
id: TASK-002.11.01
title: Add non-destructive README and Markdown Examples windows
status: To Do
assignee: []
created_date: '2026-08-28 23:23'
updated_date: '2026-08-28 23:23'
labels:
  - enhancement
dependencies:
  - TASK-002.12
  - TASK-002.11.02
parent_task_id: TASK-002.11
priority: medium
type: enhancement
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add dedicated reference windows so README and Markdown Examples can be consulted without replacing the main document. README is a preview-only reference; Examples is an editable in-memory playground with source and preview.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Help > README opens or focuses one dedicated preview-only window and never mutates the main document or its view state
- [ ] #2 Help > Markdown Examples opens or focuses one dedicated source/preview playground window with broad common-format coverage
- [ ] #3 Examples can be edited in memory, Reset to its bundled baseline, and saved only through Save As
- [ ] #4 Examples preserves edits while its window remains open and protects meaningful unsaved edits on close
- [ ] #5 Reference windows restore appropriate size/position where supported and do not create duplicates
- [ ] #6 Menus and command enablement follow the focused window so actions cannot affect a hidden document
- [ ] #7 Automated tests and native verification cover window reuse, isolation, capabilities, focus-aware commands, and close behavior
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sequenced after TASK-002.11.02 so reference windows can reuse the approved document-capability model instead of introducing parallel special cases.
<!-- SECTION:NOTES:END -->
