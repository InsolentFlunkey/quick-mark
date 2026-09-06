---
id: TASK-014.02
title: Add tabbed editing and linked-document navigation
status: To Do
assignee: []
created_date: '2026-09-06 02:44'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.01
parent_task_id: TASK-014
priority: high
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use the ownership foundation from the preceding TASK-014 child to expose multiple documents in one editor window. New creates a tab; Open, Recent Files and relative document links open or focus an existing document. Failed opens preserve the active document and create no misleading tab. Preserve per-tab selection, scroll and view state. Close Tab uses CmdOrCtrl+W; Close Window is separate; closing the final tab leaves one blank tab.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Accessible tabs identify documents, dirty state and duplicate filenames and support keyboard switching and closing.
- [ ] #2 New/Open/Recent/relative links target or deduplicate tabs; failed opens create no tab and preserve existing work.
- [ ] #3 Save/Save As/Clear/table insertion/status and unsaved-change prompts target the intended document, even across asynchronous tab switches.
- [ ] #4 Closing dirty tabs/windows supports save/discard/cancel; the last tab leaves a blank tab.
- [ ] #5 Tests and native review verify tab actions/navigation and user documentation explains this milestone.
<!-- AC:END -->
