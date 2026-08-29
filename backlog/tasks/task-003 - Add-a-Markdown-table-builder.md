---
id: TASK-003
title: Add a Markdown table builder
status: To Do
assignee: []
created_date: '2026-08-28 03:50'
updated_date: '2026-08-29 04:19'
labels:
  - enhancement
dependencies: []
priority: low
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add guided table-building functionality so users can create correctly formatted Markdown tables without manually aligning delimiters. The desktop editor architecture this enhancement was waiting for is now established. Refine the interaction design and supported insertion or editing workflows when this task is taken into progress.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The intended table-building interaction and supported insertion or editing workflows are documented before implementation
- [ ] #2 Users can define table dimensions and header content and insert a syntactically valid Markdown table into the active document
- [ ] #3 Generated tables include a valid delimiter row and preserve cell content that requires Markdown escaping
- [ ] #4 Insertion respects the editor's current selection or cursor without losing unrelated document content
- [ ] #5 Representative table-generation and insertion behavior is covered by automated tests
- [ ] #6 User-facing documentation explains how to invoke and use the table builder
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed the TASK-002 dependency because the editor/application conversion needed by Table Builder is complete. Deferred Windows distribution is now tracked independently by DRAFT-001 and does not block this enhancement.
<!-- SECTION:NOTES:END -->
