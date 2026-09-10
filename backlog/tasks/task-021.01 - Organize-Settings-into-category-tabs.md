---
id: TASK-021.01
title: Organize Settings into category tabs
status: To Do
assignee: []
created_date: '2026-09-10 04:18'
labels:
  - enhancement
  - settings
dependencies:
  - TASK-010.04
parent_task_id: TASK-021
priority: medium
type: enhancement
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the long single-pane Settings dialog with category tabs so users can reach related controls without scrolling past every setting. During TASK-010.04 native review, the user explicitly requested a tracked follow-up because the combined General and Markdown Lint Rules content is too long. TASK-010.04 supplies the individual/group lint controls whose behavior must be preserved. Suggested initial categories are General and Markdown Linting; decide the exact grouping and initial/reopened tab behavior during task planning. This request authorizes task creation only, not implementation. Do not add unrelated preferences.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Settings presents clearly labeled category tabs and displays only the active category's settings instead of the full combined list.
- [ ] #2 All existing controls remain available in an appropriate category, including Recent Files management, Lint before saving, individual/group lint switches and Restore QuickMark Defaults; their behavior is preserved.
- [ ] #3 Users can navigate and activate category tabs with the keyboard, with visible focus and accessible active-tab/panel relationships; hidden panels do not receive keyboard focus.
- [ ] #4 Switching tabs preserves accepted setting values and does not trigger preference writes or destructive actions; persistence errors and pending operations remain visible or clearly indicated.
- [ ] #5 The dialog remains usable at narrow window sizes and with a long lint-rule category; category navigation and Close remain reachable without scrolling through unrelated categories.
- [ ] #6 Automated tests, native verification and user documentation cover category switching, keyboard navigation, reopen behavior, narrow layouts and preservation of existing Settings workflows.
<!-- AC:END -->
