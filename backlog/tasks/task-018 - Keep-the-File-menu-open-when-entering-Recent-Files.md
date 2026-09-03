---
id: TASK-018
title: Keep the File menu open when displaying Recent Files
status: Done
assignee:
  - Codex
created_date: '2026-09-03 02:47'
updated_date: '2026-09-03 03:40'
labels:
  - bug
  - menus
  - recent-files
dependencies:
  - TASK-002.12
documentation:
  - 'https://docs.rs/tauri/latest/tauri/window/struct.Window.html#method.set_menu'
modified_files:
  - src/application-menu.ts
  - src/menu-platform.ts
  - src/reference-menu.ts
  - tests/application-menu.test.ts
  - tests/menu-platform.test.ts
priority: high
type: bug
ordinal: 21750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the native application-menu regression where moving the pointer down the File menu causes the entire menu to disappear as the pointer reaches Recent Files, apparently while the Recent Files submenu is being opened. The submenu must remain usable without destabilizing the parent File menu or changing recent-file behavior established by TASK-002.12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Moving the pointer from File menu items onto Recent Files keeps the File menu open and opens a stable Recent Files submenu
- [x] #2 The Recent Files submenu remains stable and navigable when the recent-file list is empty and when it contains entries
- [x] #3 Selecting a recent file still opens it through the existing unsaved-change protection, and missing-file handling remains unchanged
- [x] #4 Keyboard navigation into and out of Recent Files does not dismiss the File menu unexpectedly
- [x] #5 Automated menu-state coverage where practical plus native desktop verification reproduces the original hover path and confirms the fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Make focus-time menu activation platform-aware in `src/menu-platform.ts`: menus are attached once per window on Windows/Linux, while macOS retains focus-driven reactivation because its menu is app-wide. Update both main and reference menu controllers to use this safe activation path so native focus/submenu events cannot replace a window-local menu while it is open.
2. Keep the Recent Files submenu enabled in its empty state and show a disabled `No Recent Files` child, giving mouse and keyboard navigation a stable submenu target instead of toggling the submenu itself between disabled and enabled.
3. Add platform/helper and application-menu wiring coverage for one-time Windows/Linux attachment, macOS reactivation, and stable empty/populated Recent Files behavior while preserving existing recent-file actions.
4. Run focused and full frontend tests, production build, native debug build, and manual Linux verification with both empty and populated Recent Files lists using mouse and keyboard navigation.

5. Correct dynamic recent-item construction: create each placeholder or recent-file entry with `MenuItem.new(...)`, retain the live resource objects, append those resources to the submenu, and remove/close the prior resources during refresh. Tauri’s `newMenu` path injects an action `Channel`, while `Submenu.append` passes raw option objects directly; appending raw objects therefore displayed recent entries without registering their callbacks. Add a regression assertion that dynamic actionable entries are explicitly constructed before append.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: `createApplicationMenu` currently calls `attachWindowMenu(menu)` at creation and again from `activate()` on every main-window focus event. Reference windows use the same pattern. Official Tauri API documentation states window menus are supported on Windows/Linux but unsupported on macOS, where the menu is app-wide. Replacing an already attached Linux/Windows menu during a native focus transition can dismiss an open menu; focus reactivation is only necessary for switching the global macOS menu between QuickMark windows. The empty Recent Files state also disables the submenu itself after inserting a disabled placeholder, leaving no stable submenu to display. The planned fix addresses both instability sources without changing recent-file selection behavior.

Implementation: focus activation now calls `activateMenuForFocusedWindow`, which is a no-op on Linux/Windows and reapplies only the app-wide macOS menu. Both main and reference menus use the helper. Recent Files remains an enabled submenu when empty and contains a disabled `No Recent Files` item; populated entries retain their existing actions.

Automated verification: focused application-menu/menu-platform/reference-window tests pass (23/23); full Vitest suite passes (157/157 across 22 files); TypeScript/Vite production build passes; native Tauri debug build without bundling passes; task-scoped diff check passes.

Native review exposed AC #3 still failing: visible recent-file entries did nothing when selected. Root cause confirmed in the installed `@tauri-apps/api` implementation: `newMenu`/`MenuItem.new` converts an `action` callback to a Tauri `Channel`, but `Submenu.append` directly serializes raw option objects and does not call that conversion. The existing raw objects therefore produced labels without action handlers. This is part of TASK-018 because recent-file selection is already explicit acceptance criterion #3.

Recent-file action fix implemented: dynamic entries and the empty placeholder are constructed with `MenuItem.new`, active resources are retained in `recentItems`, and replaced resources are removed and closed before refresh. Regression wiring verifies explicit construction, action registration intent, append, and cleanup. Re-verification passes 23/23 focused tests, 158/158 full tests, production build, and native debug build without bundling.

Native verification completed by the user after both corrections: Recent Files mouse/keyboard display is stable and selecting listed files now opens them correctly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stabilized the native Recent Files submenu and restored its actions. Linux and Windows menus are now attached once per window instead of being replaced during focus events; macOS retains focus-time activation for its app-wide menu. The empty submenu remains enabled with a disabled placeholder. Dynamically refreshed recent entries are created and retained as real Tauri `MenuItem` resources so their action channels are registered, with old resources removed and closed during refresh. Existing guarded opening and stale-file behavior remain in place. Verification passed with 158 Vitest tests, production and native debug builds, scoped diff validation, and user-completed native mouse, keyboard, and file-opening checks.
<!-- SECTION:FINAL_SUMMARY:END -->
