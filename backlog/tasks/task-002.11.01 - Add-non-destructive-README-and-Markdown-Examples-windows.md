---
id: TASK-002.11.01
title: Add non-destructive README and Markdown Examples windows
status: Done
assignee:
  - Codex
created_date: '2026-08-28 23:23'
updated_date: '2026-08-29 01:31'
labels:
  - enhancement
dependencies:
  - TASK-002.12
  - TASK-002.11.02
modified_files:
  - package.json
  - package-lock.json
  - reference.html
  - src/application-menu.ts
  - src/main.ts
  - src/markdown-examples.md
  - src/menu-platform.ts
  - src/reference.css
  - src/reference-menu.ts
  - src/reference-window-services.ts
  - src/reference.ts
  - src-tauri/Cargo.toml
  - src-tauri/Cargo.lock
  - src-tauri/capabilities/default.json
  - src-tauri/capabilities/desktop.json
  - src-tauri/src/lib.rs
  - tests/application-menu.test.ts
  - tests/menu-platform.test.ts
  - tests/reference-windows.test.ts
  - vite.config.ts
parent_task_id: TASK-002.11
priority: medium
type: enhancement
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add dedicated reference windows so README and Markdown Examples can be consulted without replacing the main document. README is a preview-only reference; Examples is an editable in-memory playground with source and preview.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Help > README opens or focuses one dedicated preview-only window and never mutates the main document or its view state
- [x] #2 Help > Markdown Examples opens or focuses one dedicated source/preview playground window with broad common-format coverage
- [x] #3 Examples can be edited in memory, Reset to its bundled baseline, and saved only through Save As
- [x] #4 Examples preserves edits while its window remains open and protects meaningful unsaved edits on close
- [x] #5 Reference windows restore appropriate size/position where supported and do not create duplicates
- [x] #6 Menus and command enablement follow the focused window so actions cannot affect a hidden document
- [x] #7 Automated tests and native verification cover window reuse, isolation, capabilities, focus-aware commands, and close behavior
- [x] #8 File > Close closes clean reference windows and uses unsaved-change protection for dirty Examples
- [x] #9 On Linux and Windows each window retains its own contextual menu instead of changing the main window menu when a reference window is focused
- [x] #10 Examples view choices remain mutually exclusive and accurately checked after every selection
- [x] #11 Pane-order menu wording remains “Swap Panes” regardless of current order
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a Vite multi-page `reference.html` entry with a dedicated reference controller and shared renderer/editor assets. Bundle README plus a comprehensive Markdown Examples fixture at build time; keep all reference state isolated from the main lifecycle.
2. Add a narrow reference-window service using Tauri `WebviewWindow`: open-or-focus stable `readme` and `examples` labels, create each only once with its own title/size, surface creation errors in the main status region, and grant only the named windows/capabilities required.
3. Install and register Tauri's official window-state plugin so main/reference positions and sizes restore across launches; verify the plugin permissions and avoid custom geometry persistence.
4. Implement README as Preview-only with no editor/save controls. Implement Examples as a split source/preview playground using the approved capability model: editable in memory, ordinary Save disabled, Save As through the existing native writer, Reset to bundled baseline, and dirty-close protection.
5. Make the native app menu focus-aware by letting each window activate its own contextual app-wide menu on focus: the main window restores the full editor menu; README exposes only relevant Close/Print/Help actions; Examples exposes Save As, Close, native editing, Reset, view actions, and Help. This prevents commands from targeting hidden windows.
6. Add unit/static integration coverage for bundled example breadth, open-or-focus behavior, isolation, capabilities, reset/dirty-close logic, contextual menu activation, capability permissions, and multi-page builds.
7. Run frontend/Rust suites, formatting/Cargo checks, multi-page production build, native build, live single-instance/focus/menu/window-state smoke checks, and task-scoped diff validation; record evidence before completion.

Apply interactive-review corrections before completion: grant the narrow window-close permission; attach menus per-window on Linux/Windows while retaining app-wide activation only where macOS requires it; expose a reference-menu controller that synchronizes mutually exclusive view checks after actions; and keep pane-swap wording stable in main/reference menus. Re-run automated/native verification and repeat the interactive scenarios before finalizing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sequenced after TASK-002.11.02 so reference windows can reuse the approved document-capability model instead of introducing parallel special cases.

Started after confirming TASK-002.11.02 is Done, committed as `28c7622`, and pushed to `origin/main`; this task's tracking commit is `f723ece`. Researching Tauri multi-window lifecycle, Vite multi-page entry options, focused-window menu behavior, window state persistence, bundled reference content, Save As integration, and unsaved-close protection before recording the implementation plan.

Research decision: use stable Tauri labels (`readme`, `examples`) and `WebviewWindow.getByLabel()` for open-or-focus semantics. Use a separate Vite HTML/TypeScript entry so reference windows do not initialize the main document lifecycle or launch/drop listeners. Use Tauri's official window-state plugin rather than homegrown localStorage geometry; it restores state after window creation across Linux, Windows, and macOS. Because Tauri menus are window menus on Linux/Windows but app-wide on macOS, each focused window will activate a context-specific app menu, ensuring commands act only on the visible/focused document. This also avoids routing reference actions through the hidden main lifecycle.

Implementation progress: added the official Tauri window-state plugin, multi-page Vite reference entry, stable open-or-focus `readme`/`examples` windows, bundled README and broad Markdown Examples content, preview-only README, editable/resettable Save As-only Examples with dirty-close protection, contextual app-wide menus activated by focused window, and named-window capability scopes. Automated verification currently passes 100/100 frontend tests, 6/6 Rust tests, TypeScript/Vite multi-page build, Cargo check, rustfmt, native Tauri debug build, and diff validation. The native main window launch remains stable. Final completion is pending an interactive smoke check of Help > README/Markdown Examples creation, reuse/focus, contextual menu switching, close protection, and restored geometry because this environment has no desktop input automation utility.

Interactive review confirmed README/Examples isolation, rendering, editing, reset/Save As, reuse, and general focus behavior. Defects found: reference File > Close lacks the explicit JS close permission; app-wide menu assignment unnecessarily changes the main window menu on Linux when a reference is focused; Examples check items toggle independently instead of being synchronized as a radio-like group. User also requested stable “Swap Panes” wording rather than “Restore Pane Order.” These are in-scope pre-completion corrections.

Applied all interactive-review corrections. Added explicit `core:window:allow-close`; introduced a platform menu attachment helper that uses per-window menus on Linux/Windows and app-wide menus only on macOS; made Examples view check items update as a mutually exclusive group after every selection; kept “Swap Panes” wording constant in main and reference menus. Added focused tests for platform selection, permissions, exclusive checks, and stable wording. Re-verification passes 107/107 frontend tests across 13 files, 6/6 Rust tests, multi-page production build, rustfmt, Cargo check, native Tauri debug build, and diff validation. Awaiting a short interactive regression check of the four reported behaviors before marking Done.

User completed the post-fix interactive regression check and confirmed all reference-window behavior is working: Close, per-window menus, exclusive view checks, stable Swap Panes wording, window isolation/reuse, editing/reset/Save As, and focus behavior. This supplies the final native interaction evidence.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added isolated README and Markdown Examples reference windows through a separate Vite entry. README is preview-only; Examples is an editable split playground with Reset, Save As-only persistence, and unsaved-close protection. Stable Tauri labels provide open-or-focus reuse, the official window-state plugin restores geometry, and contextual menus attach per-window on Linux/Windows while retaining macOS-compatible app-menu behavior. Fixed reference Close permission, exclusive view checks, and stable Swap Panes wording after interactive review. Verified with 107 frontend tests, 6 Rust tests, multi-page production and native builds, Cargo/rustfmt/diff checks, and successful user-confirmed native interaction testing.
<!-- SECTION:FINAL_SUMMARY:END -->
