---
id: TASK-010.05
title: Support heading anchors and aligned fragment-link linting
status: To Do
assignee: []
created_date: '2026-09-07 21:27'
updated_date: '2026-09-07 21:28'
labels:
  - enhancement
  - markdown
  - linting
  - navigation
dependencies:
  - TASK-010.02
  - TASK-006
references:
  - 'https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/md051.md'
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
parent_task_id: TASK-010
priority: medium
type: enhancement
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add same-document heading navigation and corresponding lint validation so section links work in QuickMark Preview and incorrect destinations are diagnosed. MD051 is disabled in the approved initial profile because QuickMark currently generates no heading IDs, while the upstream rule assumes GitHub-style anchors and accepts additional fragment forms. TASK-006 provides safe preview link routing; TASK-010.02 supplies the lint engine/results. The user explicitly authorized this future functionality and tracking, not implementation now. This is a separate follow-up to the original lint MVP. Define the supported fragment contract and review material choices before implementation; do not equate enabling MD051 alone with matching actual Preview behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rendered headings expose deterministic unique anchors, with documented behavior for repeated headings, punctuation, inline formatting and Unicode.
- [ ] #2 Activating a supported same-document section link navigates to the correct heading in the intended preview without leaving the app or targeting another document.
- [ ] #3 Linting identifies invalid supported section-link destinations and accepts valid ones using the same documented naming contract as rendering; the default lint profile enables the aligned validation.
- [ ] #4 Explicit heading attributes, raw HTML anchors, top-of-document and GitHub line/content fragments have documented supported or unsupported dispositions; upstream MD051 acceptance is not falsely presented as proof they work in Preview.
- [ ] #5 Existing HTML escaping, restricted resource navigation, source-scroll mapping and tab/window isolation are preserved.
- [ ] #6 Automated rendering/navigation/lint tests, native verification and user documentation cover valid links, missing/renamed headings, duplicate anchors and the supported fragment boundaries.
<!-- AC:END -->
