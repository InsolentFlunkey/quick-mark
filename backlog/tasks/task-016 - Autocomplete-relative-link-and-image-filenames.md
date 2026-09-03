---
id: TASK-016
title: Autocomplete relative link and image filenames
status: To Do
assignee: []
created_date: '2026-09-03 01:18'
labels:
  - feature
  - markdown
  - editor
dependencies:
  - TASK-006
  - TASK-014
priority: medium
type: feature
ordinal: 23500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Help users author relative Markdown links and images by suggesting filesystem entries from the active document’s directory while the caret is inside a link destination. The interaction must be keyboard-accessible, preserve ordinary editor behavior outside that context, and use the same path and resource rules as rendered links and images. Implement after the tabbed document model so suggestions always use the correct tab’s filesystem context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typing inside a relative Markdown link or image destination can display relevant filesystem suggestions from the active document’s directory
- [ ] #2 Suggestions distinguish supported document targets, supported local images, and directories while excluding or clearly handling unsupported targets
- [ ] #3 Arrow keys navigate suggestions and Tab or Enter accepts the highlighted completion without breaking normal indentation or editing outside the completion context
- [ ] #4 Suggestions insert correctly escaped relative paths and support nested directories, spaces, and common cross-platform path cases
- [ ] #5 Untitled documents, inaccessible directories, empty results, stale asynchronous results, and filesystem failures remain unobtrusive and safe
- [ ] #6 Suggestion context belongs to the active tab and cannot insert results from another tab or detached window
- [ ] #7 Automated parser, interaction, concurrency, and path tests plus native verification and user documentation cover the workflow
<!-- AC:END -->
