---
id: TASK-025
title: Deliver and maintain QuickMark for Windows
status: To Do
assignee: []
created_date: '2026-08-29 04:18'
updated_date: '2026-09-13 13:59'
labels:
  - enhancement
  - windows
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Track Windows distribution as an independent, deferred initiative rather than a blocker for the completed desktop architecture or ongoing product enhancements. When resumed on suitable Windows hardware, define and execute the work needed to build, package, install, verify, document, and maintain QuickMark for Windows. This parent intentionally replaces the earlier migration subtask TASK-002.10 and may be divided into focused child tasks after current Windows tooling and distribution requirements are researched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Windows distribution approach and supported installer or package formats are documented before implementation
- [ ] #2 QuickMark can be built and packaged from a clean checkout on a supported Windows development environment
- [ ] #3 The packaged application installs or launches successfully and passes representative document open, edit, save, menu, and reference-window verification
- [ ] #4 Windows prerequisites, installation, launch, supported file associations, upgrade behavior, and known platform limitations are documented
- [ ] #5 Release and maintenance procedures are divided into independently verifiable child tasks when the initiative is resumed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Initial user-authorized delivery is TASK-025.01: Windows prerequisite verification, locked dependency/check commands, NSIS packaging, native smoke verification, and README documentation. Assigned to @Codex. Ongoing release/maintenance milestones will be scoped separately after initial delivery; do not begin them implicitly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User authorized resuming Windows build verification and documentation on 2026-09-12. Found this deferred initiative during draft search; it explicitly replaced TASK-002.10. Initial scope is a focused build/package/documentation milestone; ongoing release maintenance remains separate.

Initial Windows milestone TASK-025.01 completed and native verification accepted by user. Parent remains To Do for remaining release/maintenance scoping and cross-version upgrade verification; those were not included in the initial build milestone.
<!-- SECTION:NOTES:END -->
