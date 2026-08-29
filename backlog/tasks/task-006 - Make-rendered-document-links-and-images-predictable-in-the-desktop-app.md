---
id: TASK-006
title: Make rendered document links and images predictable in the desktop app
status: To Do
assignee: []
created_date: '2026-08-29 20:57'
labels:
  - bug
  - markdown
  - security
dependencies: []
priority: high
type: bug
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define and implement safe desktop behavior for links and images rendered from Markdown. External web and mail links, document-relative links, local image references, missing targets, and unsupported schemes need intentional outcomes that do not navigate the QuickMark application window away from the editor or silently fail. Relative resources should be interpreted in the context of the active document when that context exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Opening a supported external web or mail link uses an intentional desktop-safe destination and does not replace the QuickMark application window
- [ ] #2 Relative document links and local image references have documented behavior based on the active document’s filesystem location
- [ ] #3 Untitled documents and missing, inaccessible, or unsupported relative targets produce safe and understandable behavior
- [ ] #4 Unsupported or dangerous URI schemes remain blocked
- [ ] #5 Automated tests and native verification cover external, mail, relative, missing, and blocked link/resource cases
- [ ] #6 User documentation explains supported rendered-link and image behavior
<!-- AC:END -->
