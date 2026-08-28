---
id: TASK-002.12
title: Add native application menus and recent files
status: Done
assignee:
  - Codex
created_date: '2026-08-28 19:49'
updated_date: '2026-08-28 20:54'
labels:
  - enhancement
dependencies:
  - TASK-002.07
modified_files:
  - index.html
  - src/application-menu.ts
  - src/main.ts
  - src/recent-files.ts
  - src/styles.css
  - src/tauri-window-services.ts
  - tests/application-menu.test.ts
  - tests/desktop-parity.test.ts
  - tests/recent-files.test.ts
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a conventional desktop menu bar and a persistent Recent Files workflow. Keep toolbar duplication limited to frequent actions while exposing complete document, editing, view, and help commands through menus.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A native menu bar provides File, Edit, View, and Help menus using platform-appropriate labels and shortcuts
- [x] #2 File provides New, Open, Recent Files, Save, Save As, Print, and Exit or Close as appropriate for the platform
- [x] #3 Recent Files lists previously opened or saved documents predictably, handles missing entries clearly, and does not discard unsaved work
- [x] #4 Edit provides Undo, Redo, Cut, Copy, Paste, Select All, and Clear with correct editor enablement
- [x] #5 View provides Split, Input, Preview, and Swap Panes and stays synchronized with toolbar controls and persisted preferences
- [x] #6 Help provides About and reserves clearly labeled README and Markdown Examples entries without replacing the active document; TASK-002.11 owns enabling their final non-destructive reference experience
- [x] #7 The toolbar retains only frequent actions and avoids confusing duplication with the menu bar
- [x] #8 Menu commands and recent-file persistence have automated coverage where practical and documented native verification
- [x] #9 About opens as an accessible in-app modal that closes from its button, Escape, or a click on the backdrop without closing from clicks inside the dialog
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a pure, tested recent-files module that safely parses storage, de-duplicates and caps paths in most-recent-first order, derives portable labels, and supports removal of stale entries without persisting document content.
2. Refactor existing document and view actions into shared command functions consumed by both toolbar controls and menus, keeping unsaved-change protection on New, Open, Recent, Clear, launch, and drop flows.
3. Build a native Tauri app menu in TypeScript with File, Edit, View, and Help submenus. Use native predefined edit commands, check items synchronized to view state, platform accelerators, a custom close path that preserves the existing close guard, and an About item.
4. Populate Recent Files dynamically from successful opens/saves; safely remove entries that fail to open and report the result in the existing visible status region. Persist only paths in local storage.
5. Reserve disabled, clearly labeled README and Markdown Examples help entries so this task does not preempt TASK-002.11's required presentation discussion or replace the active document.
6. Reduce the toolbar to frequent commands (New, Open, Save, Save As, View, Swap), moving Clear, Print, and reference discovery to the native menus.
7. Add automated coverage for recent-file state, menu structure/wiring, toolbar scope, synchronization, stale paths, and error handling; then run frontend/Rust/native verification and record platform observations before completion.

Apply pre-commit review correction: replace Tauri's predefined About item with a custom menu action that opens an accessible HTML dialog. Implement close-button, Escape, and backdrop-only dismissal while preserving focus behavior, then rerun frontend and native verification before returning this task to Done. Richer About metadata remains a separate follow-up pending agreement on authoritative project metadata sources.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.07 is Done and its commit is included on pushed `origin/main` (TASK-002.08 commit `b286018` pushed afterward). Researching the installed Tauri menu APIs, current document/view command wiring, persistence boundaries, and non-destructive reference-content constraints before recording an implementation plan. TASK-002.11 remains To Do pending the separate README/Examples presentation discussion.

Research findings: the installed Tauri JavaScript API provides native `Menu`, `Submenu`, `MenuItem`, `CheckMenuItem`, and `PredefinedMenuItem` resources. `Menu.setAsAppMenu()` produces a window menu on Linux/Windows and the global menu on macOS; predefined Undo/Redo/Cut/Copy/Paste/Select All use native behavior; menu items support action callbacks and dynamic enabled/checked/text state. The existing `core:default` capability already includes the complete `core:menu:default` permission set, so no broader capability grant is needed. Use app-wide menus for cross-platform behavior. README/Examples must remain disabled placeholders in this task because the user explicitly requested design discussion before TASK-002.11 implementation.

Implemented the native application menu and recent-file workflow. File exposes New/Open/Recent/Save/Save As/Print/Close through shared guarded document commands; Edit uses Tauri's predefined native Undo/Redo/Cut/Copy/Paste/Select All plus guarded Clear; View uses synchronized check items and pane-swap state; Help provides About plus disabled README/Examples placeholders pending TASK-002.11. Recent paths are safely parsed, deduplicated, capped at ten, moved to most-recent-first after successful opens/saves, and removed after a failed recent open while the visible operation status reports the underlying failure. The toolbar now contains only New/Open/Save/Save As/View/Swap. The existing close request path protects menu-initiated Close. Verification: 91/91 Vitest tests across 11 files; TypeScript/Vite production build; 5/5 Rust tests; rustfmt check; Cargo check; native Tauri debug build; task-scoped diff check. Launched the built native debug application successfully; it remained running without menu initialization, capability, or API errors until deliberately stopped after the smoke check.

Applied user-review correction before commit: Tauri's predefined native About dialog exposes metadata but no backdrop-dismissal control, so the Help menu now opens an accessible HTML dialog instead. It closes through its Close button, the platform-standard Escape behavior of `showModal()`, or a click whose target is the dialog backdrop; clicks within the content panel do not close it. Richer non-hard-coded metadata is tracked separately as TASK-002.13. Re-verification passes 92/92 frontend tests, 5/5 Rust tests, TypeScript/Vite and native Tauri debug builds, rustfmt, Cargo check, and task-scoped diff validation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a conventional native Tauri application menu with File, Edit, View, and Help groups, platform accelerators, native editing commands, synchronized view checkmarks, guarded Close/Clear/document actions, and non-disruptive disabled reference placeholders pending TASK-002.11. About uses an accessible in-app modal with Close, Escape, and backdrop-click dismissal. Added a persistent Recent Files submenu that stores only normalized paths, de-duplicates and caps entries, records successful opens/saves, routes selection through unsaved-change protection, and removes failed entries with visible feedback. Reduced the toolbar to frequent actions and shared command functions between menu and toolbar. Verified with 92 frontend tests, 5 Rust tests, production and native debug builds, formatting/Cargo/diff checks, and a native launch smoke test.
<!-- SECTION:FINAL_SUMMARY:END -->
