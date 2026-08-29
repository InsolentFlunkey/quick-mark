---
id: TASK-002.14
title: Investigate synchronized source and preview scrolling
status: To Do
assignee: []
created_date: '2026-08-29 01:24'
labels:
  - enhancement
dependencies:
  - TASK-002.11
parent_task_id: TASK-002
priority: low
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research and prototype synchronized scrolling between Markdown source and rendered preview for split view. Simple percentage matching is insufficient when source lines expand or collapse during rendering, so compare mapping strategies and define predictable opt-in behavior before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The investigation compares proportional, block/heading anchor, source-position instrumentation, and hybrid synchronization approaches
- [ ] #2 Large documents, headings, lists, tables, code blocks, images, and substantially different source/render heights are evaluated
- [ ] #3 User control, scroll-direction ownership, feedback-loop prevention, and behavior while actively editing are specified
- [ ] #4 Performance and renderer-maintenance implications are documented
- [ ] #5 A recommended implementation approach and independently verifiable follow-up scope are recorded
<!-- AC:END -->
