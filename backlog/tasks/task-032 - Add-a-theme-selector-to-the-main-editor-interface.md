---
id: TASK-032
title: Add a theme selector to the main editor interface
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-19 03:21'
updated_date: '2026-09-19 17:05'
labels:
  - enhancement
  - ui
  - theme
  - accessibility
dependencies: []
references:
  - TASK-028.02
documentation:
  - src/theme-preferences.ts
  - src/styles.css
  - docs/editing.md
modified_files:
  - index.html
  - src/main.ts
  - src/styles.css
  - docs/editing.md
  - tests/desktop-parity.test.ts
  - tests/theme-preferences.test.ts
  - tests/tab-editor-integration.test.ts
  - tests/manual/themes.md
priority: medium
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make QuickMark's Dark, Light and Midnight themes directly selectable from the main editor interface so users do not have to open Settings for a frequent appearance change. The right-aligned control must reuse the existing shared theme preference and remain consistent with Settings and other QuickMark windows. Midnight retains the existing internal `classic` preference value for compatibility.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The main editor interface provides a clearly discoverable, right-aligned theme selector for Dark, Light and Midnight without opening Settings.
- [x] #2 Selecting a theme applies it immediately, persists through the existing preference mechanism and synchronizes the displayed value in Settings and other open QuickMark windows.
- [x] #3 The selector has an accessible name, exposes its current value, supports keyboard operation and retains a visible focus state.
- [x] #4 The selector fits supported window sizes and themes without obscuring document actions, view controls or status information.
- [x] #5 Automated tests, user documentation and native visual and keyboard review cover the new selector, Midnight naming and existing Settings behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a compact, clearly labeled Theme selector to the main editor toolbar, offering Dark, Light and Midnight; retain the existing internal `classic` preference value for compatibility.
2. Place the Theme control in its own right-aligned toolbar group while allowing it to wrap safely at narrow widths without obscuring document actions, View controls or status content.
3. Route toolbar changes through the existing shared theme selection path so the preference persists, the current/native window updates, Settings reflects the accepted value and other open windows receive storage synchronization.
4. Keep the toolbar and Settings selectors synchronized after local changes, cross-window changes and save failures, and use Midnight consistently in user-facing Settings and documentation.
5. Preserve visible keyboard focus and readable presentation in every supported theme.
6. Add focused integration/accessibility coverage for markup, immediate application, persistence, synchronization, failure recovery, responsive alignment and user-facing naming; update docs/editing.md and the native checklist.
7. Run focused tests, the full frontend suite, the production build and a final native Windows visual/keyboard review; record results before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added the main-toolbar Theme selector with Dark, Light and QuickMark Classic options. It uses the existing shared preference path, updates the document and native window immediately, refreshes Settings, reacts to cross-window storage changes and restores the accepted value if persistence fails.

Made toolbar action groups wrap at narrow widths and capped the theme selector width. Updated the appearance documentation. Focused verification passed: theme preferences, desktop parity, Settings and tab/editor integration (4 files / 39 tests), TypeScript/Vite production build and git diff --check. Native size/theme review and the full suite remain pending.

Full frontend verification passed: 59 test files / 485 tests. The self-contained Windows Tauri debug build also succeeded at src-tauri/target/debug/quick-mark.exe. Updated tests/manual/themes.md with TASK-032 toolbar/Settings synchronization, keyboard focus and narrow-width checks. Native user review is now pending before AC #4 and #5 can be completed.

User completed the first native Windows review and confirmed the selector looked good, then requested two refinements before completion: right-align the Theme control and shorten the user-facing QuickMark Classic name to Midnight. The internal `classic` preference value will remain stable. Final native review will be repeated after these changes.

Implemented the approved refinement: Theme is now a separate toolbar group aligned to the right with auto margin, and the visible `classic` option is named Midnight in the toolbar, Settings, editing guide and native checklist. The persisted value remains `classic`. Focused verification again passed (4 files / 39 tests), as did the production build and git diff --check.

Post-refinement full verification passed: 59 test files / 485 tests, TypeScript/Vite production build and git diff --check. The debug executable rebuild was blocked because the first-review QuickMark process still has src-tauri/target/debug/quick-mark.exe open; no process was closed automatically. Built the updated self-contained release executable successfully at src-tauri/target/release/quick-mark.exe for final review.

Final native Windows review passed. The user approved the right-aligned placement, compact Midnight naming, narrow-window behavior and keyboard/focus presentation.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-19 03:24
---
Implementation authorized by the user on 2026-09-18.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Added a right-aligned Theme selector to the main editor toolbar for Dark, Light and Midnight. The control uses QuickMark's existing shared theme preference path, so selections apply immediately, persist across launches, update the native window, remain synchronized with Settings and propagate to other open QuickMark windows. Persistence failures restore the last accepted selection and surface an operation error.

Renamed the user-facing QuickMark Classic option to Midnight in the toolbar, Settings and documentation while retaining the internal `classic` value for saved-preference compatibility. Toolbar action groups now wrap safely at narrow widths, and the existing focus treatment covers keyboard navigation.

Expanded integration and presentation coverage for selector markup, naming, persistence, Settings synchronization, cross-window changes, native theme mapping and failure recovery. Updated the editing guide and native theme checklist.

Verification passed: focused theme/Settings/editor tests (4 files / 39 tests), full frontend suite (59 files / 485 tests), TypeScript/Vite production build, self-contained Windows release build, git diff --check and user-approved native Windows visual/keyboard review including alignment, Midnight naming and narrow-width behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
