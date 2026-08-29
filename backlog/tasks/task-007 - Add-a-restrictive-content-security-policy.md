---
id: TASK-007
title: Add a restrictive content security policy
status: To Do
assignee: []
created_date: '2026-08-29 20:57'
updated_date: '2026-08-29 20:59'
labels:
  - enhancement
  - security
dependencies:
  - TASK-006
priority: high
type: enhancement
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add defense-in-depth protection for the Tauri frontend. QuickMark currently has no configured content security policy even though it renders user-authored Markdown and may load linked resources. Establish a policy compatible with required application assets and intentionally supported Markdown images or navigation while preventing unexpected script, frame, object, and resource execution.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The packaged and development application run with an explicit content security policy rather than a null policy
- [ ] #2 The policy blocks unexpected scripts, frames, objects, and unsafe resource origins
- [ ] #3 Required QuickMark assets and intentionally supported Markdown resources continue to work
- [ ] #4 Policy violations or blocked user resources fail safely without breaking document editing
- [ ] #5 Automated configuration checks and native smoke verification cover the effective policy
- [ ] #6 The security rationale and any allowed external origins are documented
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency rationale: the restrictive policy must be designed after rendered link/image behavior defines which navigation paths and resource origins QuickMark intentionally supports.
<!-- SECTION:NOTES:END -->
