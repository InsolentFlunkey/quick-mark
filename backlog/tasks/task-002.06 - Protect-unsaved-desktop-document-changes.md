---
id: TASK-002.06
title: Protect unsaved desktop document changes
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:46'
updated_date: '2026-08-28 16:15'
labels:
  - feature
dependencies:
  - TASK-002.05
modified_files:
  - index.html
  - src/main.ts
  - src/tauri-window-services.ts
  - src/unsaved-changes.ts
  - src-tauri/capabilities/default.json
  - tests/desktop-protection-wiring.test.ts
  - tests/unsaved-changes.test.ts
parent_task_id: TASK-002
priority: high
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent accidental loss of edited content during destructive document actions or application shutdown, and provide standard save-oriented keyboard interaction for the desktop editor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Closing the application with unsaved changes requires the user to save, discard, or cancel
- [x] #2 Opening or creating another document with unsaved changes requires the user to save, discard, or cancel
- [x] #3 Canceling an unsaved-changes prompt leaves the current document and application state unchanged
- [x] #4 The standard Save and Save As keyboard shortcuts invoke the corresponding document operations
- [x] #5 Successful and failed save outcomes are clearly reflected in dirty state and user feedback
- [x] #6 Automated tests cover the decision flow independently of native prompt presentation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a pure, dependency-injected unsaved-changes decision module. Given current dirty state, a Save/Discard/Cancel prompt, and a save callback, it will return Proceed/Cancel/Failure without presenting native UI.
2. Require successful Save plus a clean post-save snapshot before proceeding. A canceled/failed save or an edit made during the save keeps the destructive action blocked and preserves the active document.
3. Add a native Tauri prompt adapter using the dialog plugin's custom three-button result, and add the minimal `core:window:allow-destroy` permission needed to complete an approved close without recursively emitting another close request.
4. Guard desktop Open, New, initial/subsequent launch-file replacement, and native window close with the shared decision flow. Add a New button; leave ordinary non-destructive edits and saves unchanged.
5. Add platform-standard Ctrl/Cmd+S and Ctrl/Cmd+Shift+S handling for Save and Save As, preventing browser defaults while reusing the same document operations and feedback path.
6. Add Vitest coverage for clean, save, discard, cancel, failed/canceled save, edit-during-save, protected-action invocation, and shortcut mapping independently of native dialogs; add integration assertions for controls/permissions.
7. Run the full frontend suite/build, Rust tests/check/formatting, optimized Tauri build, task-scoped diff validation, and a runtime close-handler smoke check where practical; record evidence and finalize only TASK-002.06.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.05 is Done and committed/pushed as ea7b4c1. Researching Tauri close-event APIs, current open/save coordination, and keyboard handling before recording the implementation plan.

Research findings: Tauri 2 exposes async `onCloseRequested` interception; `destroy()` force-closes without emitting another close-requested event. The installed dialog plugin supports custom Yes/No/Cancel button labels and returns the selected label.

Decision boundary: TASK-002.06 will protect Open, New, launch-path replacement, and close. It will not add broader UI parity or recent-document behavior, which belong to later tasks.

Reliability decision: after a user chooses Save, the guard rechecks dirty state. If content changes while the write is in flight, the newer edit remains dirty and the destructive action is canceled rather than losing it.

Implemented a pure unsaved-change decision flow with injected dirty-state, prompt, and save dependencies. Clean and Discard decisions proceed; Cancel, prompt failure, and canceled/failed saves block the action; a successful save proceeds only when the post-save snapshot is clean.

Added a native Save/Discard/Cancel prompt adapter and close interception. Dirty close requests are prevented synchronously, duplicate close prompts are suppressed, and an approved close uses Tauri window destruction to avoid re-entering the close-request handler. Initialization and destroy failures are reported in the accessible operation status.

Guarded New, Open, initial/subsequent launch-file replacement, and close through the same flow. Added a New control and minimal `dialog:allow-message` plus `core:window:allow-destroy` capabilities.

Added Ctrl/Cmd+S and Ctrl/Cmd+Shift+S mapping to the existing Save and Save As operations. Browser defaults are prevented only for recognized save shortcuts, and all outcomes reuse lifecycle dirty-state rendering and accessible feedback.

Acceptance evidence: Vitest covers clean, discard, cancel, save success, canceled/failed save, prompt failure, edit-during-save, protected-action gating, four Ctrl/Cmd shortcut variants, ignored shortcuts, and static wiring/permission assertions. The suite passes 67/67 tests across 6 files.

Final verification: `npm run build`, 5/5 Rust tests, Cargo check, rustfmt check, optimized `npm run tauri build`, and task-scoped `git diff --check` pass. Native prompt presentation and close wiring compile in the production Tauri bundle; the decision behavior is verified independently of GUI automation as required.

Unrelated worktree note: the pre-existing line-ending-only AGENTS.md modification remains untouched and excluded from task validation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added reliable unsaved-change protection for desktop close, New, Open, and launch-file replacement. A pure dependency-injected decision flow handles Save, Discard, and Cancel consistently; destructive actions proceed only after explicit discard or a successful save that leaves the active buffer clean. Canceled/failed saves, prompt failures, and edits made while saving keep the document open and dirty.

Integrated Tauri close interception with a native three-button warning dialog and force-destroy only after approval, using minimal message/destroy capabilities. Added a New control and platform-standard Ctrl/Cmd+S plus Ctrl/Cmd+Shift+S shortcuts routed through the existing Save and Save As operations and accessible feedback.

Added 16 decision/shortcut tests plus desktop wiring assertions. All 67 frontend tests, 5 Rust tests, TypeScript/Vite and optimized Tauri builds, Cargo checks, rustfmt, and task-scoped diff validation pass. The unrelated AGENTS.md line-ending modification remains untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
