---
id: TASK-014.07
title: Allow moving tabs into an existing editor window
status: To Do
assignee: []
created_date: '2026-09-06 18:33'
labels:
  - enhancement
  - follow-up
dependencies:
  - TASK-014.04
references:
  - user-notes.md
  - TASK-014.03
documentation:
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
parent_task_id: TASK-014
priority: medium
type: enhancement
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional follow-up beyond TASK-014's original four required children. Let users move a detached tab back to its original editor window or into another existing editor window. Current Move Tab to New Window supports only creation of a destination. Preserve all document and view state and exclusive ownership. The user provisionally accepts leaving a blank tab when the source window becomes empty but considers automatically closing a window created specifically for a moved tab potentially better UX. The user is also undecided whether detached windows should remain full editors or become reduced-function child windows; full editor functionality remains the current baseline. Preserve these concerns for explicit design review. Cross-window dragging is a candidate interaction, not an approved requirement; within-window drag reordering does not automatically provide this feature.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Before implementation, the user approves the transfer interaction and the recorded handling of empty source windows and full-editor versus reduced-function windows; provisional baseline is a full editor with one blank tab when emptied.
- [ ] #2 Users can move a tab into an existing editor window, including back to its originating window, without creating a duplicate document.
- [ ] #3 Successful transfer preserves content, saved baseline, capabilities, selection, scroll and View settings with exactly one live owner; failures preserve the source.
- [ ] #4 The approved empty-window behavior is verified, and busy operations, destination closure and canceled transfers cannot lose document state.
- [ ] #5 Automated integration/failure tests, native review and documentation cover the approved workflow and deliberate limitations.
<!-- AC:END -->
