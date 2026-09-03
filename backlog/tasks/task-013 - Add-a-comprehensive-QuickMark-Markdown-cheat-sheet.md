---
id: TASK-013
title: Add a comprehensive QuickMark Markdown cheat sheet
status: To Do
assignee: []
created_date: '2026-09-03 01:18'
updated_date: '2026-09-03 01:30'
labels:
  - enhancement
  - markdown
  - documentation
dependencies:
  - TASK-005
  - TASK-006
references:
  - 'https://www.markdownguide.org/cheat-sheet/'
  - 'https://www.markdownguide.org/about/'
priority: medium
type: enhancement
ordinal: 22500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the expectation that Markdown Examples serves as complete instruction with a dedicated, user-facing cheat sheet tailored to QuickMark’s documented Markdown dialect. It should teach nearly every currently supported formatting form, clearly identify syntax that is currently unsupported or restricted, include local and web links, images, and mailto examples, and make example source easy to copy into the editor. Describing syntax as currently unsupported documents present behavior and does not establish a permanent product exclusion. A reputable external guide may be adapted only when its license, attribution requirements, and syntax claims are compatible with QuickMark.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark exposes a dedicated Markdown cheat sheet from an appropriate Help control without replacing or damaging the active document
- [ ] #2 The cheat sheet demonstrates nearly every syntax category QuickMark publicly supports and clearly distinguishes currently unsupported syntax from deliberate safety restrictions without implying that unsupported syntax is permanently excluded
- [ ] #3 Link coverage includes HTTP and HTTPS, mailto, relative Markdown documents, local images, remote images, and the saved-document context required for relative resources
- [ ] #4 Every copyable source example provides the same accessible Copy interaction and feedback used by rendered application code blocks
- [ ] #5 Any externally sourced or adapted content has verified compatible licensing, required attribution, and a recorded source; otherwise the content is original
- [ ] #6 Automated coverage verifies availability, dialect consistency, copy controls, and non-destructive Help-window behavior
<!-- AC:END -->
