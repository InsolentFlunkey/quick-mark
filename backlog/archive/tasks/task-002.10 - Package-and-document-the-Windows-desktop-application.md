---
id: TASK-002.10
title: Package and document the Windows desktop application
status: To Do
assignee: []
created_date: '2026-08-28 04:27'
updated_date: '2026-08-29 04:19'
labels:
  - enhancement
dependencies:
  - TASK-002.08
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the migrated QuickMark desktop application straightforward to build, install, and launch on Windows for the maintainer's work environment and for prospective open-source users. Windows distribution must preserve the same document behavior as the Linux application while documenting any platform-specific integration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A distributable Windows application package is produced successfully
- [ ] #2 The packaged Windows application launches and completes a basic open-edit-save verification
- [ ] #3 Windows build and packaging commands are documented from a clean developer checkout
- [ ] #4 Required Windows runtime and development prerequisites are clearly distinguished
- [ ] #5 User documentation describes Windows installation, launch, supported file types, and platform-specific limitations
- [ ] #6 The Windows distribution does not require the legacy PowerShell launch-file workaround
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OBE (overtaken by events) as a migration subtask. Windows distribution has been separated from the completed desktop-architecture migration and is now represented by deferred parent DRAFT-001. This task is superseded, not completed.
<!-- SECTION:NOTES:END -->
