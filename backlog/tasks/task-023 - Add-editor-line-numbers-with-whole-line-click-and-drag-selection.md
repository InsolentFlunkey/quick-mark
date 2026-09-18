---
id: TASK-023
title: Add editor line numbers with whole-line click and drag selection
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-10 03:54'
updated_date: '2026-09-18 18:45'
labels:
  - enhancement
  - editor
dependencies:
  - TASK-031
references:
  - user-notes.md
modified_files:
  - index.html
  - package.json
  - package-lock.json
  - src/editor-commands.ts
  - src/editor-line-numbers.ts
  - src/editor-surface.ts
  - src/line-number-preference.ts
  - src/lint-results.ts
  - src/main.ts
  - src/scroll-sync.ts
  - src/settings.ts
  - src/styles.css
  - docs/editing.md
  - tests/editor-line-numbers.test.ts
  - tests/line-number-preference.test.ts
  - tests/manual/editor-line-numbers.md
  - tests/setup.ts
  - tests/detached-editor-integration.test.ts
  - tests/external-change-integration.test.ts
  - tests/markdown-renderer.test.js
  - tests/settings.test.ts
  - tests/tab-editor-integration.test.ts
  - vitest.config.ts
priority: medium
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add line numbers to the Markdown source editor to make locating and selecting lines easier. Clicking and dragging in the line-number gutter uses ordinary text selection, usable with Copy, Cut, Delete and typing. Display one number per source line; wrapped visual rows belong to that source line. Whole-line selection includes its terminating newline when present. Show line numbers by default and provide a remembered Settings visibility toggle. Include Shift-click to extend selection and automatic scrolling when dragging beyond the editor's top or bottom edge.

These defaults were explicitly approved by the user. This task captures the line-number topic originally recorded in user-notes.md; the user authorized removing that note after capture. Folding, bookmarks and diagnostic markers remain outside this task. The user authorized implementation on 2026-09-18 and approved the completed native review, commit and push.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Markdown source editor shows one number per source line by default, aligned during editing and scrolling, including blank lines; wrapped visual rows do not receive additional numbers.
- [x] #2 Clicking a line number selects the entire source line as ordinary text selection, including all wrapped rows and its terminating newline when present; a final line without a newline remains selectable.
- [x] #3 Dragging from a line number upward or downward selects a contiguous range including the starting line; dragging beyond the editor's top or bottom edge scrolls automatically and extends the selection.
- [x] #4 Shift-clicking a line number extends the existing selection to the clicked line using whole-line selection.
- [x] #5 A Settings toggle shows or hides line numbers and remembers the preference across application restarts.
- [x] #6 Gutter selection supports Copy, Cut, Delete and typing as normal text selection, respects read-only content, and preserves keyboard editing, lint navigation and synchronized source/preview scrolling.
- [x] #7 Automated coverage, native manual verification and user documentation cover clicking, Shift-click, bidirectional dragging, drag autoscroll, blank/wrapped/final lines, read-only behavior and remembered visibility.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan:

1. Introduce a production editor adapter and migrate the Markdown input from the native textarea to CodeMirror 6, retaining per-tab content, selection, scrolling, focus, and busy/read-only behavior.
2. Port QuickMark's current editing behavior: indentation, list continuation, table insertion, path completion, tab switching, detached-window transfer, and focus escape.
3. Integrate the proven custom line-number gutter with click, Shift-click, bidirectional drag, and edge autoscroll whole-line selection.
4. Add a persisted, default-on Show line numbers Settings checkbox that updates all editor instances.
5. Adapt synchronized scrolling and lint-result navigation to CodeMirror geometry while preserving the existing preview and lint workflows.
6. Add focused tests for line ranges, selection direction, settings persistence, read-only behavior, editor integration, and regressions in existing editing features.
7. Update the editing documentation and add a native manual-verification checklist covering wrapped, blank, final, and read-only lines; clipboard/edit operations; dragging and autoscroll; persistence; and synchronized scrolling.
8. Run targeted tests first, then the full frontend suite and production build. Record verification against every acceptance criterion before finalizing the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migrated the production Markdown input to a CodeMirror EditorSurface using the TASK-031 proof: retained per-tab surfaces, QuickMark list/indent commands, async path completion, busy locking, directional selections, tab state, lint navigation geometry and source/preview scroll geometry.

Added the selectable line-number gutter with whole-line click, Shift-click, bidirectional drag and edge autoscroll. Line numbers are default-on and controlled by a persisted Settings checkbox that synchronizes across windows.

Automated verification passes: 57 frontend test files / 458 tests, production TypeScript/Vite build, 55 Rust tests, and git diff --check. User documentation and a native desktop checklist were added. The in-app browser runtime failed to initialize, so no browser visual pass is claimed. AC #7 remains open pending native manual verification of pointer feel, clipboard/edit operations, drag autoscroll, scaling and restart persistence.

Native review found two dark-theme presentation defects: CodeMirror's drawn cursor retained its default black border and was nearly invisible, and the gutter background obscured the left edge of the editor focus outline. Remediation stays within the approved editor styling step: explicitly theme the drawn cursor and render the focus indicator as a pointer-transparent overlay above both content and gutter.

User completed native review in the production Tauri integration. The initial review found a dark-theme cursor contrast issue and a focus-ring gap over the gutter; both were corrected with an accent-colored CodeMirror cursor and a focus overlay spanning content and gutter. The user confirmed the corrected native appearance and approved commit/push.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 01:55
---
Dependency added at the user's request: complete TASK-031's CodeMirror investigation before implementing this editor feature, so the work uses the approved editor foundation.
---

author: @Codex
created: 2026-09-18 14:29
---
Tentative future behavior from TASK-031 review: consider Ctrl-click on Windows/Linux and Cmd-click on macOS to add or remove non-contiguous whole-line gutter selections. This is deliberately not an acceptance requirement yet. Product semantics for Copy, Cut, Delete, typing, formatting, overlapping ranges, and modifier-drag must be decided before implementation.
---

author: Codex
created: 2026-09-18 14:59
---
TASK-031 is complete, so the dependency gate is satisfied. Beginning planning and production-code review for the authorized TASK-023 implementation.
---

author: Codex
created: 2026-09-18 15:21
---
User approved the implementation plan and authorized proceeding on 2026-09-18.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Migrated QuickMark's production Markdown input from the native textarea to a CodeMirror 6 EditorSurface and added default-on source line numbers. The custom gutter selects ordinary whole-line text ranges on click, Shift-click and bidirectional drag, includes terminating newlines when present, supports edge autoscroll, and retains normal clipboard and editing commands while respecting operation locks.

Added a remembered Settings toggle for line-number visibility with cross-window synchronization. Ported QuickMark's indentation/list behavior and path completion, and adapted per-tab state, detached-window transfer, lint navigation and synchronized source/preview scrolling to the new editor surface. Native review also led to an accent-colored cursor and a complete focus border spanning the gutter in dark theme.

Updated editing documentation and added a native verification checklist. Verification passed: 57 frontend test files / 458 tests, production TypeScript/Vite build, 55 Rust tests, git diff --check, and user native review of the production Tauri editor.
<!-- SECTION:FINAL_SUMMARY:END -->
