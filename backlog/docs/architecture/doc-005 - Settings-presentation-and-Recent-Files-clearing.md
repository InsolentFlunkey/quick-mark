---
id: doc-005
title: Settings presentation and Recent Files clearing
type: other
created_date: '2026-09-05 04:51'
tags:
  - settings
  - recent-files
---
# Settings presentation and Recent Files clearing

TASK-021 uses a modal HTML Settings surface in the main editor, following the existing About and Table Builder dialogs. Its named General/Recent Files sections can accommodate later settings without implementing theme or lint controls now. The command is Settings… on all platforms; it appears under QuickMark on macOS and Edit on Windows/Linux, as approved by the user.

Clearing history uses a second HTML modal with Cancel initially focused. The installed native dialog API cannot configure initial button focus; the user explicitly approved HTML confirmation. Resetting the dialog return value before every opening ensures Escape/dismissal cannot reuse a previous affirmative result. Native HTML modal behavior supplies focus containment; the controller restores focus after confirmation and Settings closure.

Only the recent-files localStorage entry is written. Persisting an empty list precedes in-memory replacement and the awaited native submenu update. Storage failures leave the visible history unchanged; menu failures are displayed rather than reported as success. No document lifecycle or filesystem mutation operation participates. Subsequent ordinary opens/saves can repopulate history. Existing per-window menu attachment and live MenuItem resource handling remain in use.

Native mouse/keyboard and relaunch checks are required in addition to mocked-menu and DOM tests; jsdom cannot establish native focus containment or platform menu behavior.
