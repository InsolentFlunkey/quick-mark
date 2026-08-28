---
id: TASK-002.02
title: Modularize Markdown rendering and presentation
status: To Do
assignee: []
created_date: '2026-08-28 03:44'
labels:
  - enhancement
dependencies:
  - TASK-002.01
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move QuickMark's reusable Markdown rendering, safe-link handling, code-block copy behavior, and presentation styles out of the legacy single HTML file so the desktop application can consume them without duplicating behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Markdown rendering is provided by a reusable module rather than inline page code
- [ ] #2 Unsafe HTML and unsupported link schemes remain blocked
- [ ] #3 Fenced and indented code blocks retain working copy controls
- [ ] #4 Existing Markdown and print fixtures render without unintended regressions
- [ ] #5 Automated tests cover the renderer's security-sensitive and customized behavior
<!-- AC:END -->
