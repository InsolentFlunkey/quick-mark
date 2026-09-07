---
id: TASK-010.04
title: Configure Markdown lint rules individually and by functional group
status: To Do
assignee: []
created_date: '2026-09-07 21:05'
updated_date: '2026-09-07 21:28'
labels:
  - enhancement
  - markdown
  - linting
  - settings
dependencies:
  - TASK-010.03
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
parent_task_id: TASK-010
priority: medium
type: enhancement
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let users adapt QuickMark's documented standard-based lint profile by disabling or re-enabling individual rules and groups of related functionality. The user authorized tracking this follow-up separately from TASK-010.01's design work. TASK-010.03 supplies the completed manual and save-triggered lint workflows; both must use the user's effective configuration. Retain advisory saves. This is a separately deliverable follow-up to the original three-child lint MVP; creation does not authorize implementation. Define and review functional groups and their interaction with individual choices before implementation. Custom rule code, project-file discovery, auto-fix and live linting are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can disable and re-enable each available lint rule with its rule ID and understandable description visible.
- [ ] #2 Users can disable and re-enable documented functional groups; mixed group states and overlapping membership, if any, have predictable behavior reflected accurately in the controls.
- [ ] #3 Users can restore the documented QuickMark default profile.
- [ ] #4 Rule choices persist across restarts and stay consistent across editor windows; persistence failures are reported without falsely showing a saved setting.
- [ ] #5 Manual and save-triggered linting use the same effective choices, and results from an earlier configuration are not presented as current.
- [ ] #6 Keyboard-accessible controls, automated coverage, native verification and user documentation cover individual/group changes, mixed states, reset, persistence and result invalidation.
<!-- AC:END -->
