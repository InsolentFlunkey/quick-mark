---
id: TASK-002.13
title: Source and display richer About metadata
status: To Do
assignee: []
created_date: '2026-08-28 20:53'
labels:
  - enhancement
dependencies:
  - TASK-002.12
parent_task_id: TASK-002
priority: low
type: enhancement
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expand QuickMark's About experience with version, creator/maintainer attribution, repository URL, and other agreed project details without duplicating hard-coded metadata across application code and manifests. Decide authoritative metadata sources and build-time/runtime propagation before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The authoritative source for version, creator or maintainer, repository URL, and other displayed project metadata is documented
- [ ] #2 About displays the agreed metadata without duplicating literals across frontend code and project manifests
- [ ] #3 Version information stays synchronized with packaged application versions
- [ ] #4 Repository information is presented accessibly and opens safely if made interactive
- [ ] #5 Automated coverage verifies metadata propagation and About rendering
<!-- AC:END -->
