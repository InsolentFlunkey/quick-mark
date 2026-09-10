---
id: TASK-023
title: Add editor line numbers with whole-line click and drag selection
status: To Do
assignee: []
created_date: '2026-09-10 03:54'
updated_date: '2026-09-10 03:57'
labels:
  - enhancement
  - editor
dependencies: []
references:
  - user-notes.md
priority: medium
type: enhancement
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add line numbers to the Markdown source editor to make locating and selecting lines easier. Clicking and dragging in the line-number gutter uses ordinary text selection, usable with Copy, Cut, Delete and typing. Display one number per source line; wrapped visual rows belong to that source line. Whole-line selection includes its terminating newline when present. Show line numbers by default and provide a remembered Settings visibility toggle. Include Shift-click to extend selection and automatic scrolling when dragging beyond the editor's top or bottom edge.

These defaults were explicitly approved by the user. This task captures the line-number topic originally recorded in user-notes.md; the user authorized removing that note after capture. Task tracking, commit and push are authorized; feature implementation has not been authorized. Folding, bookmarks and diagnostic markers remain outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Markdown source editor shows one number per source line by default, aligned during editing and scrolling, including blank lines; wrapped visual rows do not receive additional numbers.
- [ ] #2 Clicking a line number selects the entire source line as ordinary text selection, including all wrapped rows and its terminating newline when present; a final line without a newline remains selectable.
- [ ] #3 Dragging from a line number upward or downward selects a contiguous range including the starting line; dragging beyond the editor's top or bottom edge scrolls automatically and extends the selection.
- [ ] #4 Shift-clicking a line number extends the existing selection to the clicked line using whole-line selection.
- [ ] #5 A Settings toggle shows or hides line numbers and remembers the preference across application restarts.
- [ ] #6 Gutter selection supports Copy, Cut, Delete and typing as normal text selection, respects read-only content, and preserves keyboard editing, lint navigation and synchronized source/preview scrolling.
- [ ] #7 Automated coverage, native manual verification and user documentation cover clicking, Shift-click, bidirectional dragging, drag autoscroll, blank/wrapped/final lines, read-only behavior and remembered visibility.
<!-- AC:END -->
