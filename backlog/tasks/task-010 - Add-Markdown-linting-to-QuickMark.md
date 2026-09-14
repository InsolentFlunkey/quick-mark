---
id: TASK-010
title: Add Markdown linting to QuickMark
status: Done
assignee: []
created_date: '2026-08-29 20:58'
updated_date: '2026-09-14 01:19'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-014
references:
  - 'https://github.com/DavidAnson/markdownlint'
priority: high
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an integrated Markdown quality-checking experience based on accepted, documented rules rather than an IDE-specific extension. The completed MVP must support explicit linting, a durable results view synchronized with the Markdown source, and an optional remembered lint-on-save workflow. Linting is advisory: saves complete even when issues are found, and users retain control over whether to inspect results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark has a documented lint-rule profile aligned with its supported Markdown dialect
- [x] #2 Users can lint the active in-memory document on command and inspect actionable line-based results
- [x] #3 Lint results and Markdown source support synchronized navigation without permanently displacing normal Preview use
- [x] #4 Users can enable or disable a remembered lint-before-save preference
- [x] #5 Before writing, clean checks proceed automatically and findings offer Review Issues, Save Anyway and Cancel; save-complete feedback follows actual successful writes
- [x] #6 Lint failures are distinguished from document save failures and never falsely report that a failed or canceled save completed
- [x] #7 The complete linting experience is covered by automated tests, native verification, and user documentation
- [x] #8 All required linting MVP child tasks are completed and verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Delivered through five independently implemented and verified subtasks: TASK-010.01 approved the standard-rule profile and interaction design; TASK-010.02 implemented on-command linting and synchronized results; TASK-010.03 implemented remembered lint-before-save decisions and truthful save feedback; TASK-010.04 added persistent individual/group rule controls; TASK-010.05 added heading anchors and aligned fragment validation. All five are Done. The final profile enables QuickMark-specific MD051 while preserving optional MD034. Live linting remains separately tracked in TASK-011.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Parent completion audit after user acceptance of TASK-010.05: all five children are Done. AC1 is evidenced by .01/.05 and current user/architecture docs; AC2/3 by .02; AC4/5/6 by .03; AC7 by child automated/native verification and current 333 frontend/50 Rust passes plus final Windows user review; AC8 by completed .01-.05. Closing parent metadata only; no additional implementation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the Markdown linting feature and all five children: documented profile, on-command linting with source-linked synchronized results, remembered lint-before-save choices, persistent individual/group controls, and renderer-aligned heading fragment validation. Saves remain advisory and report actual outcomes; stale and failed checks are distinct from successful results.

Verification is recorded in each completed child. The final integrated state passes 333 frontend tests, 50 Rust tests, frontend/native build and worker checks, and user native Windows review. Optional real-time linting remains outside this completed scope.
<!-- SECTION:FINAL_SUMMARY:END -->
