---
id: TASK-020
title: Remove terminal blank lines when copying code blocks
status: To Do
assignee: []
created_date: '2026-09-04 14:49'
labels:
  - bug
  - markdown
  - clipboard
dependencies: []
priority: high
type: bug
ordinal: 22200
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make copied code safe and predictable when pasted into terminals and other tools. The Copy action for rendered code blocks should end the clipboard text at the last non-blank code line instead of retaining Markdown’s terminal line ending or trailing blank lines, which can trigger multiline-paste warnings or execute a command immediately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Copying a one-line fenced code block places only the command text on the clipboard with no terminal line ending
- [ ] #2 All line endings and whitespace-only lines after the final non-blank code line are omitted from copied text
- [ ] #3 Leading indentation, internal blank lines, and line breaks between non-blank code lines are preserved exactly
- [ ] #4 LF and CRLF code content produce the same normalized clipboard ending
- [ ] #5 An empty or whitespace-only code block copies as an empty string
- [ ] #6 Automated clipboard tests plus native verification cover terminal-oriented single-line and multiline examples
<!-- AC:END -->
