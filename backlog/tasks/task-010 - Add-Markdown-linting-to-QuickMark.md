---
id: TASK-010
title: Add Markdown linting to QuickMark
status: To Do
assignee: []
created_date: '2026-08-29 20:58'
updated_date: '2026-09-09 01:28'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-014
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
- [ ] #4 Users can enable or disable a remembered lint-before-save preference
- [ ] #5 Before writing, clean checks proceed automatically and findings offer Review Issues, Save Anyway and Cancel; save-complete feedback follows actual successful writes
- [ ] #6 Lint failures are distinguished from document save failures and never falsely report that a failed or canceled save completed
- [ ] #7 The complete linting experience is covered by automated tests, native verification, and user documentation
- [ ] #8 All required linting MVP child tasks are completed and verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
User-authorized follow-up TASK-010.04 tracks individual/group lint rule controls after TASK-010.03. It is a separate delivery after the original three-child MVP, remains unassigned/To Do, and is not authorized to start. TASK-010.01 remains the only active task; its profile direction now uses standard formatting checks, superseding the initial permissive proposal.

TASK-010.01 design approved: standard formatting-inclusive profile with initial MD034/MD051 exclusions. User-authorized TASK-010.05 tracks future heading anchors and aligned fragment linting, depending on TASK-010.02 and completed TASK-006. Like .04, it is a separate follow-up outside the original .01-.03 MVP and remains To Do.

User approved revising TASK-010.03 during native review to lint BEFORE saving, with Review Issues / Save Anyway / Cancel for findings and Retry / Save Anyway / Cancel for execution failures. TASK-010.01/.02 remain Done; .03 remains the sole active implementation task. The approved timing revision supersedes the earlier after-save Yes/No design. TASK-010.04/.05 remain To Do and unstarted.

Further explicit user correction during .03 review: lint must run before ALL save document file operations, including the initial filename/location picker and disk inspection. Review/Cancel returns without any destination prompt; clean/Save Anyway then starts the ordinary save flow. This supersedes .03's earlier path-first pre-write gate.
<!-- SECTION:PLAN:END -->
