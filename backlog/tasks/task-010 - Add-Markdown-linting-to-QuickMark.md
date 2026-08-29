---
id: TASK-010
title: Add Markdown linting to QuickMark
status: To Do
assignee: []
created_date: '2026-08-29 20:58'
labels:
  - feature
  - markdown
  - linting
dependencies: []
references:
  - 'https://github.com/DavidAnson/markdownlint'
priority: high
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an integrated Markdown quality-checking experience based on accepted, documented rules rather than an IDE-specific extension. The completed MVP must support explicit linting, a durable results view synchronized with the Markdown source, and an optional remembered lint-on-save workflow. Linting is advisory: saves complete even when issues are found, and users retain control over whether to inspect results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QuickMark has a documented lint-rule profile aligned with its supported Markdown dialect
- [ ] #2 Users can lint the active in-memory document on command and inspect actionable line-based results
- [ ] #3 Lint results and Markdown source support synchronized navigation without permanently displacing normal Preview use
- [ ] #4 Users can enable or disable a remembered lint-on-save preference
- [ ] #5 Successful saves report clean lint results with an easily dismissed confirmation and offer a durable Yes/No choice when issues exist
- [ ] #6 Lint failures are distinguished from document save failures and never falsely report that a failed save completed
- [ ] #7 The complete linting experience is covered by automated tests, native verification, and user documentation
- [ ] #8 All required linting MVP child tasks are completed and verified
<!-- AC:END -->
