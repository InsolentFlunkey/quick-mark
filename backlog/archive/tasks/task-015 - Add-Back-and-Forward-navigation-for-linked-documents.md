---
id: TASK-015
title: Add Back and Forward navigation for linked documents
status: To Do
assignee: []
created_date: '2026-09-03 01:18'
labels:
  - feature
  - navigation
  - documents
dependencies:
  - TASK-006
  - TASK-014
priority: high
type: feature
ordinal: 23250
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give users an obvious way to return after opening a relative Markdown or text link inside QuickMark. Maintain browser-like document history per tab so Back and Forward restore the intended document without bypassing unsaved-change protection or confusing filesystem identity. This work follows the tabbed multi-document initiative so history ownership and link-opening policy are designed once.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The active tab exposes clearly labeled Back and Forward controls whose enabled state reflects available document history
- [ ] #2 Opening a relative document link records navigable history without affecting unrelated tabs or windows
- [ ] #3 Back and Forward restore the correct filesystem document and update their history stacks predictably
- [ ] #4 Dirty documents receive the normal Save, Discard, or Cancel protection before history navigation replaces their content
- [ ] #5 Missing, moved, inaccessible, and duplicate history entries fail safely without corrupting history or active document state
- [ ] #6 Automated history/state tests plus native verification cover link navigation, repeated Back/Forward use, dirty-state decisions, and failure recovery
- [ ] #7 User documentation explains document history behavior and any non-persistence across restarts
<!-- AC:END -->
