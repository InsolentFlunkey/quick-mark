---
id: TASK-002.03
title: Modularize and verify Markdown editor behavior
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:45'
updated_date: '2026-08-28 15:11'
labels:
  - enhancement
dependencies:
  - TASK-002.02
modified_files:
  - QuickMark.html
  - index.html
  - shared/editor-behavior.js
  - src/main.ts
  - src/styles.css
  - src/vite-env.d.ts
  - tests/editor-behavior.test.js
  - tests/markdown-renderer.test.js
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Separate QuickMark's editor interactions from page-level event wiring so they can be maintained and tested independently in the desktop application. Preserve the lightweight editing experience already provided by the application.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tab and Shift+Tab indentation behavior is preserved for cursors and multiline selections
- [x] #2 Markdown list continuation, renumbering, and blank-item termination behavior is preserved
- [x] #3 Editor behavior is no longer implemented as inline logic in the legacy HTML page
- [x] #4 Automated tests cover the supported keyboard-editing cases and relevant edge cases
- [x] #5 The migrated editor remains usable with keyboard-only navigation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract the legacy textarea editing algorithms into a dependency-free browser-compatible `shared/editor-behavior.js` API that owns Tab, Shift+Tab, and Enter transformations plus listener installation/removal.
2. Keep editor updates observable through the normal `input` event so legacy preview/status persistence and desktop live preview remain page-level concerns rather than module concerns.
3. Replace the inline editor-key logic in `QuickMark.html` with the shared script and installed handler, preserving file:// compatibility and the existing legacy application workflow.
4. Replace the desktop renderer sample with a labeled textarea and live preview that consumes the shared editor behavior and renderer; retain visible focus treatment, natural tab order outside the textarea, and status feedback suitable for keyboard-only use.
5. Add Vitest/jsdom tests for cursor insertion/outdent, list-prefix indentation, multiline indent/outdent (including partial selections and trailing-newline boundaries), unordered/ordered continuation, renumbering, blank-item termination, ignored Enter cases, input-event dispatch, and listener cleanup.
6. Add wiring assertions proving both legacy and desktop entry points consume the shared editor module and that the legacy page no longer contains the extracted algorithms.
7. Run the full JavaScript test suite, TypeScript/Vite build, Cargo check, production Tauri build, legacy static-asset smoke checks, and `git diff --check`; record objective acceptance-criteria evidence before finalization.

8. Provide an explicit keyboard escape path from the editor: Escape arms the next Tab or Shift+Tab for native focus navigation, while ordinary Tab behavior remains unchanged; expose this instruction in both legacy and desktop editor hints and test it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.02 is Done. Researching the legacy and desktop editor implementations before recording the required implementation plan.

Research findings: QuickMark.html currently defines line-boundary helpers, textarea replacement, multiline indentation, current-line outdent, list-prefix indentation, list continuation/renumbering, blank-list termination, and the keydown dispatcher inline. The desktop frontend currently renders a fixed sample only.

Boundary decision: the shared module will own textarea value/selection transformations and keyboard listener lifecycle. Rendering, persistence, character counts, and other page orchestration remain with each application. The module will dispatch a bubbling input event after edits so existing app-level update flows are preserved.

Baseline verification before implementation: `npm test` passed 8/8 tests and `npm run build` passed.

Accessibility review found that preserving Tab indentation without an escape mechanism traps keyboard focus in the textarea. Use the established Escape-then-Tab convention to satisfy keyboard-only navigation without weakening indentation behavior.

Implemented `shared/editor-behavior.js` as a browser-compatible shared API. Both QuickMark.html and the desktop frontend install it; the legacy page no longer contains the editor algorithms inline.

The desktop foundation is now a functional labeled Markdown textarea with live shared-renderer preview, character status, visible focus treatment, and responsive editor/preview panels. Both applications document Escape-then-Tab, and the module allows that next Tab to perform native focus navigation.

Acceptance-criteria evidence: Vitest key-event tests exercise cursor insertion/outdent, partial and multiline selections, trailing-newline boundaries, list-marker indentation, all unordered markers, ordered renumbering, indented lists, blank-item termination, ignored native/modifier cases, bubbling input events, cleanup, and Escape-then-Tab focus exit. Static integration assertions verify both entry points load/install the shared module, the legacy handlers are absent, and accessible label/help/focus wiring exists.

Final verification: `npm test` passed 24/24 tests across 2 files; `npm run build` passed; Cargo check passed; optimized `npm run tauri build` passed and produced the release executable; `git diff --check` passed. A temporary static server returned HTTP 200 for QuickMark.html, shared/editor-behavior.js, shared/markdown-renderer.js, and shared/markdown.css.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extracted QuickMark's Markdown textarea behavior into a dependency-free shared browser module consumed by both the legacy HTML application and the Tauri desktop frontend. The module preserves cursor and multiline Tab/Shift+Tab behavior, list-marker indentation, unordered-list continuation, ordered-list renumbering, blank-item termination, selection updates, and app-level input notifications. It also adds an Escape-then-Tab focus exit so indentation support does not trap keyboard users.

Converted the desktop renderer foundation into a functional, labeled Markdown editor with live preview, character status, responsive panels, visible keyboard focus, and accessible editor instructions. Removed the corresponding inline algorithms from QuickMark.html while retaining its existing file://-compatible application wiring.

Added a dedicated Vitest/jsdom suite and integration assertions, bringing verification to 24 passing tests. TypeScript/Vite build, Cargo check, optimized Tauri build, git diff validation, and HTTP smoke checks for the legacy page and shared assets all pass.
<!-- SECTION:FINAL_SUMMARY:END -->
