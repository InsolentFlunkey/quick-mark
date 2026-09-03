---
id: TASK-014
title: Introduce tabbed multi-document editing and detachable windows
status: To Do
assignee: []
created_date: '2026-09-03 01:18'
updated_date: '2026-09-03 01:30'
labels:
  - feature
  - initiative
  - documents
dependencies:
  - TASK-007
priority: high
type: feature
ordinal: 22750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve QuickMark from a single-document editor into a multi-document workspace. Users should be able to keep multiple documents open as tabs and move a tab into a separate native window without losing document identity, edit state, view state, or safety protections. Relative Markdown document links should open in a new tab by default, focusing an already-open tab for the same document instead of creating a duplicate; this tab-based navigation model avoids requiring browser-style Back and Forward controls. This is an initiative-level parent task: define and approve an implementation decomposition before beginning its child work, with sequencing that establishes the per-document and per-window ownership model before later navigation, filesystem monitoring, themes, completion, and lint-result features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An approved durable architecture defines ownership of document lifecycle, dirty state, filesystem path, view preferences, rendered resources, linked-document navigation, and native menus across tabs and windows
- [ ] #2 The initiative is decomposed into independently implementable and verifiable child tasks before implementation begins
- [ ] #3 Users can open and work with multiple documents as clearly identified tabs
- [ ] #4 Opening a relative Markdown document link creates and focuses a new tab by default, or focuses the existing tab when that same document is already open
- [ ] #5 A linked document that cannot be opened reports the failure without creating an empty or misleading tab or changing the active document
- [ ] #6 Users can move a tab to a new native window without losing content, identity, dirty state, selection, or relevant view state
- [ ] #7 New, Open, Save, Save As, Close, recent files, linked-document navigation, and unsaved-change protection behave predictably for the targeted tab and window
- [ ] #8 Automated state and integration tests plus native cross-window verification cover creation, switching, linked-document opening and deduplication, detaching, closing, restoration boundaries, and failure cases
- [ ] #9 User documentation explains the tab and window model, linked-document behavior, and persistence limitations
- [ ] #10 All required child tasks are completed and verified
<!-- AC:END -->
