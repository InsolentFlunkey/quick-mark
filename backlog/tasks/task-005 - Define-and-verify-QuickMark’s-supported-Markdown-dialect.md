---
id: TASK-005
title: Define and verify QuickMark’s supported Markdown dialect
status: To Do
assignee: []
created_date: '2026-08-29 20:57'
labels:
  - enhancement
  - markdown
dependencies: []
references:
  - 'https://spec.commonmark.org/'
  - 'https://github.github.com/gfm/'
  - 'https://github.com/markdown-it/markdown-it'
priority: high
type: enhancement
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish a precise, user-facing contract for the Markdown syntax QuickMark renders. Reconcile CommonMark behavior, enabled markdown-it extensions, deliberate safety restrictions, and unsupported extension syntax so documentation, examples, rendering, and tests make consistent claims. The current Markdown Examples includes task-list markers that render as literal text, and the application does not presently distinguish core syntax from optional features such as footnotes, definition lists, heading anchors, front matter, math, or diagrams.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A durable capability matrix identifies supported core syntax, enabled extensions, deliberate restrictions, and unsupported optional syntax
- [ ] #2 The product documentation names QuickMark’s Markdown dialect without claiming broader CommonMark or GitHub Flavored Markdown compatibility than is actually provided
- [ ] #3 The disposition of task-list syntax, raw HTML, footnotes, definition lists, heading anchors, front matter, syntax highlighting, and other identified extensions is explicitly documented
- [ ] #4 Markdown Examples demonstrates supported behavior accurately and does not present unsupported syntax as implemented
- [ ] #5 Representative automated fixtures verify every syntax category QuickMark publicly claims to support
<!-- AC:END -->
