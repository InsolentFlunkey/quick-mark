---
id: TASK-002.05
title: Add native document open and save operations
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:46'
updated_date: '2026-08-28 16:07'
labels:
  - feature
dependencies:
  - TASK-002.04
modified_files:
  - index.html
  - package.json
  - package-lock.json
  - src/document-operations.ts
  - src/main.ts
  - src/styles.css
  - src/tauri-file-services.ts
  - src-tauri/Cargo.toml
  - src-tauri/Cargo.lock
  - src-tauri/capabilities/default.json
  - src-tauri/src/lib.rs
  - tests/document-operations.test.ts
parent_task_id: TASK-002
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace QuickMark's browser upload, download, and generated launch-file workarounds with dependable desktop filesystem operations connected to the document lifecycle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Open lets the user select and load supported Markdown or text files from the filesystem
- [x] #2 Save writes an opened document back to its existing filesystem path
- [x] #3 Save As lets the user choose a new path and updates the active document identity after success
- [x] #4 Canceled and failed operations preserve the existing document and report an understandable result
- [x] #5 Opening a supported file through the desktop application's launch arguments loads that file
- [x] #6 Automated tests cover file-operation coordination where it can be tested without native dialogs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add the Tauri dialog and single-instance plugins. Grant only dialog open/save permissions; keep filesystem access behind dedicated Rust commands rather than broad frontend filesystem scopes.
2. Implement Rust commands that validate `.md`, `.markdown`, and `.txt` paths before UTF-8 reading or writing, plus an initial-launch-path command that resolves supported path arguments. Register the single-instance plugin first and emit supported later-launch paths to the existing main window while focusing it.
3. Add a dependency-injected TypeScript document-operation coordinator around `DocumentLifecycle` for Open, open-at-path, Save, and Save As. It will translate dialog/read/write outcomes into explicit success/canceled/failed results and user-facing messages without mutating lifecycle state on cancellation or failure.
4. Add a thin Tauri adapter for native open/save dialogs, command invocation, and subsequent-instance launch events. Keep native APIs out of the coordinator so tests need no dialogs or filesystem.
5. Add desktop Open, Save, and Save As controls and accessible operation feedback; connect initial and later launch paths to the same open-at-path flow. Leave unsaved-change prompts and save keyboard shortcuts to TASK-002.06.
6. Add frontend tests for open/save coordination, supported paths, cancellation, read/write failures, identity changes, and in-flight edits; add Rust unit tests for extension validation and launch-argument resolution.
7. Run frontend tests/build, Rust tests and formatting checks, Cargo check, optimized Tauri build, a launch-argument smoke check where practical, and `git diff --check`; record acceptance-criteria evidence before finalizing only TASK-002.05.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.04 is Done and committed/pushed as 80bfd22. Researching current Tauri capabilities, frontend lifecycle integration, and desktop launch handling before recording the implementation plan.

Current-state research: Tauri has only `core:default`; no dialog/filesystem/single-instance plugins or launch handling exist. The desktop UI has no document-operation controls, while the lifecycle already exposes the required load/save success boundaries.

Architecture decision: use the dialog plugin only for path selection and dedicated Rust commands for validated UTF-8 file I/O. This avoids granting the webview broad filesystem scopes and also gives launch-argument paths the same validation/read path.

Launch decision: expose the initial supported argument through an invokable command after the frontend is ready; use the single-instance callback for subsequent launches, focusing the main window and emitting the supported path. Unsupported/non-file arguments are ignored.

Added official Tauri dialog and single-instance plugins. The main-window capability grants only dialog open/save access; document reads and writes use dedicated Rust commands restricted to `.md`, `.markdown`, and `.txt` extensions.

Implemented Open, Save, and Save As controls through a dependency-injected coordinator. Open loads selected UTF-8 content into the lifecycle; Save reuses an existing path; Save As selects a new path and changes identity only after the write succeeds. Canceled/failed operations preserve lifecycle state and publish accessible, understandable status messages.

Implemented initial launch-argument resolution plus subsequent-instance routing. The single-instance plugin is registered first, focuses the existing main window, and emits supported existing file paths; the frontend sends initial and subsequent paths through the same tested open-at-path coordinator.

Installed the missing standard `rustfmt` toolchain component after verification initially reported it unavailable. Formatting now passes.

Acceptance evidence: 48/48 Vitest tests cover dialog open, direct launch open, Save, Save As, cancellation, read/write errors, identity updates, and edits during in-flight writes. Five Rust tests cover extension validation, real UTF-8 read/write commands, rejected paths, relative launch paths, and ignored missing/unsupported arguments.

Final verification: `npm run build`, Cargo test/check, rustfmt check, optimized `npm run tauri build`, and task-file `git diff --check` all pass. The built release application launched successfully and remained running with `test-files/notes.md` as its argument until deliberately stopped.

Unrelated worktree note: AGENTS.md gained a line-ending-only user change during this task and causes repository-wide `git diff --check` to report trailing whitespace. It was not modified, reverted, or included in TASK-002.05.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added native desktop Open, Save, and Save As operations connected to the tested document lifecycle. The frontend uses native Tauri dialogs for path selection and a dependency-injected coordinator for deterministic state transitions and user feedback. Dedicated Rust commands validate supported Markdown/text extensions and perform UTF-8 reads and writes without granting broad frontend filesystem permissions.

Added initial and subsequent launch-argument handling. The initial path is retrieved after the frontend is ready; the first-registered single-instance plugin routes later launches to the existing window, focuses it, and opens the supported file through the same coordinator.

Added 10 frontend coordination tests and 5 Rust tests covering successful operations, cancellation, failures, identity updates, in-flight edits, extension validation, actual read/write commands, and launch resolution. All 48 frontend tests, Rust tests/checks/formatting, production frontend and optimized Tauri builds, task-scoped diff validation, and a release-binary launch-argument smoke test pass. An unrelated line-ending-only AGENTS.md worktree change remains untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
