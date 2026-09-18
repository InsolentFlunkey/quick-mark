---
id: TASK-024
title: Add Undo and Redo for document editing
status: Done
assignee:
  - Codex
created_date: '2026-09-10 04:27'
updated_date: '2026-09-18 20:40'
labels:
  - feature
  - editor
dependencies:
  - TASK-031
modified_files:
  - docs/editing.md
  - src-tauri/src/editor_coordinator.rs
  - src/application-menu.ts
  - src/dialog-field-history.ts
  - src/document-workspace.ts
  - src/editor-surface.ts
  - src/main.ts
  - tests/application-menu.test.ts
  - tests/detached-editor-integration.test.ts
  - tests/dialog-field-history.test.ts
  - tests/document-workspace.test.ts
  - tests/editor-line-numbers.test.ts
  - tests/external-change-integration.test.ts
  - tests/manual/undo-redo.md
  - tests/markdown-renderer.test.js
  - tests/save-lint-integration.test.ts
  - tests/tab-editor-integration.test.ts
priority: medium
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide reliable Undo and Redo for Markdown document edits so users can recover from accidental changes and reapply edits they have undone. Cover ordinary text editing and changes made through QuickMark editor tools, including indentation/outdent and table insertion. Expose discoverable Edit menu commands and conventional platform keyboard shortcuts. Keep history isolated per document and preserve existing document lifecycle, dirty-state and read-only protections.

During planning, assess existing native text undo behavior and define coherent edit grouping and history boundaries for save, reload/external replacement, Clear, tab closure and moving a tab to another window. Do not assume that programmatic editor changes participate in native undo. Persistent history across application restarts is outside the initial scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Edit → Undo and Edit → Redo and conventional platform keyboard shortcuts operate on the intended focused editing surface; command availability reflects whether the action can be performed.
- [x] #2 Undo and Redo correctly reverse and reapply typing, deletion, cut/paste, selection replacement, indentation/outdent and table insertion, with sensible action grouping and restored caret/selection.
- [x] #3 A new edit after Undo discards the superseded redo branch; exhausted history commands safely make no change.
- [x] #4 Each document has independent edit history that survives switching tabs and saving; Undo/Redo update preview, dirty state and lint-result freshness consistently with the resulting source.
- [x] #5 Undo/Redo cannot modify read-only documents or bypass pending document-operation protections, and document commands do not intercept editing shortcuts intended for Settings or other dialog fields.
- [x] #6 History behavior for reload/external replacement, Clear, tab closure and moving tabs between windows is explicitly defined and documented; history never applies changes from another document or an invalidated document state.
- [x] #7 Automated tests, native keyboard/menu verification and user documentation cover ordinary edits, editor tools, redo branching, save/dirty-state transitions, tab isolation and the documented history boundaries.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan:

1. Extend `EditorSurface` with explicit Undo/Redo commands, availability reporting, atomic programmatic edits, history reset, and versioned history serialization.
2. Replace native predefined Undo/Redo behavior with QuickMark-controlled Edit menu commands and enabled states. Keep keyboard handling scoped to CodeMirror so Settings and other dialog fields retain native editing shortcuts.
3. Route table insertion through one CodeMirror transaction so it is one reversible action with restored caret/selection. Verify indentation/outdent, typing, deletion, cut/paste, selection replacement, and path completion use coherent history grouping.
4. Preserve independent per-document history across tab switching and saving. Route every Undo/Redo content change through the ordinary editor-change path so Preview, dirty state, document revision, and lint freshness remain consistent.
5. Apply explicit history boundaries: Save preserves history; reload/external replacement and Clear discard prior history; tab closure destroys history; moving a tab transfers a versioned CodeMirror state/history payload and canceled transfer retains the source history; application restart does not preserve history.
6. Validate transferred history in frontend workspace handling and at the Rust window-transfer boundary while remaining compatible with transfer snapshots that omit the optional editor payload.
7. Add focused EditorSurface, menu, workspace, integration, detached-window, dirty-state, redo-branch, tool-edit, busy-lock, and history-boundary tests. Run targeted tests first, then the frontend build/full suite and relevant Rust tests.
8. Update `docs/editing.md` and add a native manual verification checklist covering platform shortcuts, menu availability, editor tools, dialog-field isolation, dirty-state transitions, tabs, reload/Clear, and detached windows.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Planning inspection (2026-09-18): TASK-031 is complete and the production editor now uses CodeMirror through `EditorSurface` (from the completed line-number/editor-foundation work). CodeMirror `history()` and `historyKeymap` are already installed per retained editor surface, so ordinary edits and tab switching have a partial foundation.

Current gaps: Edit menu Undo/Redo are native predefined items without QuickMark-controlled routing or availability; table insertion edits `DocumentLifecycle` and replaces editor content outside CodeMirror history; reload and Clear replace content with `addToHistory(false)` while retaining prior history; detached transfer carries selection/scroll but not CodeMirror history. Save already leaves the retained editor state intact.

Implemented explicit CodeMirror Undo/Redo APIs and availability reporting, atomic QuickMark document edits, reset boundaries, and versioned state/history serialization. Edit menu commands now use QuickMark history state; CodeMirror-scoped keyboard handling leaves dialog fields untouched.

Table insertion now dispatches one CodeMirror transaction through the normal change path. Undo/Redo therefore update the workspace, Preview, dirty state, revision, and lint freshness consistently. External programmatic replacements reset history; Clear and confirmed reload explicitly establish reset boundaries.

Detached transfers now carry a deep-cloned optional editor payload. The frontend validates/deserializes it before native acknowledgement, and the Rust coordinator rejects a payload whose version/state/document content does not match. Older snapshots without the optional payload remain valid.

Automated verification passed on 2026-09-18: 57 frontend test files / 466 tests; production TypeScript/Vite build; cargo fmt --check; 55 Rust tests; git diff --check. Native packaged keyboard/menu verification remains required using tests/manual/undo-redo.md before AC #1, #2 and #7 and task completion.

Native debug application build passed: `npm run tauri -- build --debug --no-bundle`; executable produced at `src-tauri/target/debug/quick-mark.exe`. The remaining gate is hands-on execution of `tests/manual/undo-redo.md` in that app.

Native review exposed cross-editing-host browser history leakage from an exhausted Table Builder input into the Markdown contenteditable. The fix must preserve field-local Undo/Redo while consuming exhausted shortcuts at the modal boundary.

Fixed the native-review blocker with an explicit per-field modal history boundary. Editable dialog inputs now retain isolated Undo/Redo stacks, new edits discard their field-local Redo branch, and exhausted or non-field modal shortcuts are consumed before Chromium can fall through to the Markdown contenteditable.

Regression coverage includes single-character header Undo/Redo, exhausted history, redo branching, non-editable modal controls, inputs outside dialogs, and an integrated Table Builder case with available Markdown history behind the modal. Verification passed: 58 frontend test files / 468 tests, production build, git diff --check. Because the original debug executable was open and locked, the corrected native build was produced at `src-tauri/target/task024/debug/quick-mark.exe`.

User completed native review on 2026-09-18 and confirmed menu commands, keyboard shortcuts, editor tools, lifecycle boundaries, cross-window history, and the corrected modal boundary. Table Builder history is intentionally field-local; the user accepted that behavior after confirming exhausted Undo/Redo no longer changes the Markdown document.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 01:56
---
Dependency added at the user's request: complete TASK-031's CodeMirror investigation before implementing this editor feature, so the work uses the approved editor foundation.
---

author: Codex
created: 2026-09-18 19:12
---
Plan approved by the user on 2026-09-18; implementation authorized.
---

author: Codex
created: 2026-09-18 19:57
---
Native review report from the user: Edit menu Undo/Redo and Ctrl+Z/Ctrl+Y operate successfully. Additional discriminating checks are needed to confirm QuickMark-managed programmatic edits, per-document isolation, lifecycle boundaries, and cross-window transfer rather than generic browser/OS undo.
---

author: Codex
created: 2026-09-18 20:11
---
Native review found a blocker: after exhausting Undo in a Table Builder column-header field, another Ctrl+Z can undo the Markdown editor behind the modal. AC #5 was reopened. CodeMirror also groups continuous Markdown typing into larger time-based actions (observed as full-line Undo), which is currently treated as intentional sensible grouping rather than a failure.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Implemented reliable document-scoped Undo and Redo on the production CodeMirror editor. Added QuickMark-controlled Edit menu commands and availability, conventional platform key handling, atomic history for editor tools such as indentation and table insertion, redo-branch invalidation, and consistent Preview, dirty-state, revision, and lint freshness updates.

Defined and enforced lifecycle boundaries: Save retains history; confirmed reload, external replacement, and Clear discard it; closing a tab destroys it; tab switching preserves independent histories; and moving a tab to another window serializes and validates its versioned CodeMirror history before native acknowledgement. Older transfer snapshots without editor history remain compatible.

Added modal field-local history so Table Builder and other dialog inputs handle Undo/Redo without leaking exhausted commands into the Markdown editor. Continuous Markdown typing retains CodeMirror's standard time-based grouping; dialog text fields use focused per-field history.

Updated user documentation and added a native verification checklist. Verification passed: 58 frontend test files / 468 tests, production TypeScript/Vite build, cargo fmt --check, 55 Rust tests, git diff --check, native debug build, and user-completed native keyboard/menu and boundary review.
<!-- SECTION:FINAL_SUMMARY:END -->
