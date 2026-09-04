---
id: TASK-020.01
title: Provide visible feedback after copying rendered code
status: Done
assignee:
  - Codex
created_date: '2026-09-04 16:13'
updated_date: '2026-09-04 22:02'
labels:
  - enhancement
  - markdown
  - clipboard
  - accessibility
dependencies: []
modified_files:
  - index.html
  - reference.html
  - shared/markdown-renderer.js
  - shared/markdown.css
  - src/main.ts
  - src/reference.ts
  - src/styles.css
  - src/vite-env.d.ts
  - tests/copy-feedback-wiring.test.ts
  - tests/markdown-renderer.test.js
parent_task_id: TASK-020
priority: medium
type: enhancement
ordinal: 22210
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make successful rendered-code Copy actions visibly apparent without relying on the existing screen-reader-only announcement. Provide immediate feedback at the clicked code block and a consistent transient informational message in every window that renders copyable Markdown code. The feedback must use the same dismissal interval as other transient information and must remain accessible to keyboard and assistive-technology users.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After a rendered code block is copied successfully, that block’s Copy control immediately displays a checkmark or equivalent completed-state indicator
- [x] #2 While completed feedback is active, the control’s tooltip and accessible label communicate that the content was copied to the clipboard
- [x] #3 The completed control state reverts to the normal Copy state after the standard transient-information interval
- [x] #4 Clicking Copy again while feedback is active restarts the completed-state interval without leaving stale timers or indicators
- [x] #5 A visible informational message reading “Copied to clipboard.” appears for the same transient interval and dismisses automatically
- [x] #6 Main, README, and Markdown Examples windows provide the same visible and accessible copy feedback
- [x] #7 Automated tests and native verification cover mouse and keyboard activation, timed reversion, repeated copies, visible messaging, and multi-window behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the shared rendered-code markup with distinct copy and checkmark SVG states, and enhance installCodeCopyHandler with an optional feedback duration. After a successful clipboard write, set only the activated button to a “copied” title/accessibility/icon state, restart that button’s timer on repeated activation, and restore it after the configured interval; cleanup must cancel timers and restore any surviving buttons.
2. Route the main window’s “Copied to clipboard.” message through its existing top-right operation-status controller. Use that controller’s revision protection so later save/error outcomes cannot be cleared by an older copy timer.
3. Add a dedicated visible aria-live copy status to reference markup and place it at the equivalent top-right location, since README hides the normal reference header and Examples shares its status with persistent dirty-state wording. Drive it through createOperationStatusController and OPERATION_TRANSIENT_DURATION_MS.
4. Wire main, README, and Markdown Examples to the same shared button handler, duration, and success message. Keep the semantic button activation path so mouse clicks and native keyboard activation behave identically.
5. Style the copied button state and reference-window top-right message, including empty-state hiding and print suppression.
6. Expand shared-handler tests for successful state change, tooltip/accessibility text, exact timed reversion, repeated activation, independent buttons, cleanup, and semantic keyboard support; add wiring tests for the main operation area and reference message.
7. Run focused and full frontend tests, production and packaged desktop builds, then perform native mouse/keyboard, timer, repeated-copy, main/README/Examples, and top-right message verification before finalizing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: the main copy notification currently targets #copy-status with the sr-only class; reference windows write into #reference-status, but README hides its entire header. A dedicated copy toast avoids collisions with operation/document state and remains visible in all window types. createOperationStatusController already supplies the required four-second transient lifecycle and stale-timer protection.

Implemented per-button copied state with a checkmark, updated title/accessibility label, restartable cleanup timer, and handler cleanup. Added a dedicated visible aria-live copy toast in main and reference markup; both application entry points use createOperationStatusController and OPERATION_TRANSIENT_DURATION_MS.

Focused feedback/status tests pass (22 tests). Full frontend verification passes with 26 test files and 176 tests, and the production TypeScript/Vite build passes.

User review found that the initial dedicated bottom-right toast conflicted with QuickMark’s established top-right notification placement. Revised the plan before further implementation: reuse the protected main operation-status area and place the separate reference message at the equivalent top-right location.

After user review, moved visible feedback from the initial bottom-right toast design to QuickMark’s established top-right notification location. Main copy success now uses the existing operation-status controller; reference windows retain a separate status at the equivalent upper-right position so README remains supported despite its hidden header.

Final automated verification passes with 26 test files and 176 tests, the TypeScript/Vite production build, and the embedded-frontend Tauri debug build. The user confirmed native mouse/keyboard activation, checkmark and tooltip state, four-second reversion, repeated-copy timing, visible top-right messaging, and main/README/Markdown Examples behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added immediate, accessible completion feedback to rendered-code Copy controls. A successful copy changes only the activated button to an accent checkmark, “Copied!” tooltip, and “Copied to clipboard” accessible label; repeated activation restarts its four-second timer, cleanup cancels outstanding timers, and the normal Copy state returns automatically.

Added the visible transient message “Copied to clipboard.” in QuickMark’s established top-right notification location. The main window uses its existing revision-protected operation-status controller, while README and Markdown Examples use an equivalent dedicated reference status so copy feedback remains visible even when README’s normal header is hidden. All windows use the standard transient-information duration, semantic buttons, aria-live announcements, and print suppression.

Expanded shared-handler and wiring tests for copied state, accessibility text, focus preservation, exact timing, repeated activation, independent controls, cleanup, message placement, multi-window wiring, and styling. Verification passed with 176 frontend tests, production and packaged desktop builds, and user-confirmed native behavior across all three window types.
<!-- SECTION:FINAL_SUMMARY:END -->
