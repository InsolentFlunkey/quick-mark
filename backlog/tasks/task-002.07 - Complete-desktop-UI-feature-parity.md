---
id: TASK-002.07
title: Complete desktop UI feature parity
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:47'
updated_date: '2026-08-28 18:01'
labels:
  - enhancement
dependencies:
  - TASK-002.02
  - TASK-002.03
  - TASK-002.06
modified_files:
  - index.html
  - src/document-lifecycle.ts
  - src/main.ts
  - src/styles.css
  - src/tauri-file-services.ts
  - src/view-preferences.ts
  - tests/desktop-parity.test.ts
  - tests/document-lifecycle.test.ts
  - tests/view-preferences.test.ts
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bring the migrated desktop interface to an intentional feature-parity point with the existing QuickMark experience, resolving remaining gaps without expanding into unrelated roadmap features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Input-only, preview-only, and split views work in the desktop application
- [x] #2 Pane swapping and persisted view preferences behave predictably
- [x] #3 Drag-and-drop loading, clear, bundled README sample, and copy-code interactions have an explicit working desktop equivalent
- [x] #4 Printing produces the rendered Markdown rather than hidden or editor-only content
- [x] #5 Errors and status changes are communicated without relying on developer tools
- [x] #6 The existing manual Markdown fixtures are exercised and parity results are recorded
- [x] #7 The desktop header contains no redundant in-content app name or tagline and toolbar controls are left-justified
- [x] #8 The view selector remains readable in the dark theme
- [x] #9 The desktop workspace continues expanding to the window edges at every supported width with only small fixed padding
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a tested desktop view-preference module that normalizes and persists input-only, preview-only, split, and swapped-pane settings without storing document content.
2. Replace the oversized desktop masthead with a compact application toolbar that retains the tagline unobtrusively and exposes view, swap, New/Open/Save/Save As, Clear, bundled README, and Print actions; keep the editor focus-escape instruction available as accessible help without consuming a visible row.
3. Refactor the desktop layout to fit the default viewport without page-level scrolling, using internal pane scrolling and responsive fallbacks for genuinely constrained windows.
4. Wire view/swap persistence, guarded Clear and README loading, native Tauri file drops, and rendered-preview printing into the existing document lifecycle and unsaved-change protection; keep the legacy browser application unchanged.
5. Extend automated coverage for view state, document lifecycle additions, desktop wiring/styles, fixture rendering, copy-code behavior, error/status paths, and print output.
6. Run the full verification suite and desktop build, exercise the documented manual Markdown fixtures against parity behaviors, record results and modified files in this task, then mark it Done only if every acceptance criterion passes.

Apply review corrections before commit: remove the in-content brand/tagline row, left-align the toolbar, explicitly theme native select options for readable contrast, and remove the application shell's maximum width so both panes track the full window width. Re-run the parity tests and native build, then re-complete the task. README read-only/example behavior is deliberately tracked separately because it adds filesystem metadata and document-state semantics.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependencies TASK-002.02, TASK-002.03, and TASK-002.06 are Done. User review priorities to incorporate during research/planning: first-launch panes must fit the window without page scrolling, the large tagline must become compact, and Escape-then-Tab accessibility must remain but its visual guidance should be unobtrusive.

Implemented the planned desktop parity surface while leaving `QuickMark.html` unchanged: compact header/tagline, viewport-contained panes, input/preview/split views, persistent swapping, guarded Clear and bundled README actions, native Tauri drag/drop, rendered-preview print styling, and unobtrusive accessible Escape-then-Tab help. Added pure view-preference tests, bundled-sample lifecycle coverage, and desktop parity assertions. Corrected the drag/drop adapter during verification to use the installed Tauri 2 event variants (`enter`, `over`, `drop`, `leave`). Verification so far: `npm test` passes 76 tests across 8 files; `npm run build` passes; `npm run tauri build -- --debug` passes and produces the native debug application. Existing fixture coverage exercised every `.md`, `.markdown`, and `.txt` file in `test-files`; targeted assertions confirm code-block copy controls/raw text, kitchen-sink tables/blockquotes, print-test headings/code blocks, unsafe HTML/link sanitization, and shared print rules.

Applied user-review corrections before commit: removed the in-content QuickMark name and tagline, moved the tagline into the dynamic native title text, left-aligned toolbar controls, removed the 90rem shell width cap so panes expand continuously with the window, and added dark native-control styling plus explicit option contrast. Re-verification passes 78 tests across 8 files, `npm run build`, `npm run tauri build -- --debug`, and task-scoped `git diff --check`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed desktop UI feature parity without changing the legacy browser application. The desktop app now has viewport-fitting, full-window-width panes; a left-aligned functional toolbar with branding/tagline moved out of the content area; readable dark-themed view controls; persistent input/preview/split and swapped views; guarded Clear/README/drop-file flows; native file-drop feedback; rendered-preview printing; accessible unobtrusive editor escape guidance; and visible operation/error status. Added coverage for view persistence, bundled sample lifecycle, desktop parity wiring/layout, all existing Markdown fixtures, copy-code behavior, sanitization, print rules, full-width layout, and selector contrast. Verified with 78 passing tests, successful production and native Tauri debug builds, and task-scoped diff checks.
<!-- SECTION:FINAL_SUMMARY:END -->
