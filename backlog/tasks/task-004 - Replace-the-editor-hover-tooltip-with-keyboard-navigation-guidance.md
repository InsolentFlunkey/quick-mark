---
id: TASK-004
title: Replace the editor hover tooltip with keyboard-navigation guidance
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 18:51'
updated_date: '2026-08-29 19:18'
labels:
  - bug
  - accessibility
dependencies: []
modified_files:
  - README.md
  - index.html
  - tests/desktop-parity.test.ts
priority: low
type: bug
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the native hover tooltip currently displayed whenever the pointer rests over the Markdown Input pane. The tooltip explains the Escape-then-Tab focus behavior, but it is intrusive for pointer users and poorly discoverable for keyboard-only users. Preserve the keyboard behavior while moving its explanation, together with other relevant keyboard-navigation tips, into durable user instructions. Decide during task execution whether the appropriate home is an expanded README section or a dedicated Instructions document that remains easy to discover.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hovering anywhere over the Markdown Input pane does not display the Escape-then-Tab native tooltip
- [x] #2 The existing Escape-then-Tab behavior for leaving the editor remains functional and accessible
- [x] #3 User-facing instructions document how to leave the editor with the keyboard and summarize other relevant QuickMark keyboard-navigation controls
- [x] #4 The chosen documentation location is discoverable from the application’s existing help or documentation surfaces
- [x] #5 Automated coverage verifies tooltip removal without regressing the editor’s keyboard behavior or accessible description
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove the Markdown textarea’s `title` attribute, which produces the pointer hover tooltip, while retaining its `aria-describedby` connection to the screen-reader-only focus-exit instruction.
2. Add a concise `Keyboard navigation` section to README covering Escape then Tab, Tab/Shift+Tab Markdown indentation, standard document shortcuts, view shortcuts, and native radio-group navigation where relevant. Use the README because it is already bundled, preview-only, and directly discoverable through Help → README; do not create a redundant Instructions window.
3. Update static accessibility/integration assertions to require the absence of the title tooltip, continued accessible description, Help-menu discoverability, and documented keyboard guidance. Retain and run the existing behavior-level Escape/Tab editor tests.
4. Run the complete frontend/Rust suites, production and native builds, formatting/diff checks, and native hover/keyboard/help verification before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after its dedicated tracking commit `2f318d5` was pushed. The task has no dependencies and is eligible to proceed. Researching current editor focus behavior, accessible description, README/help surfaces, and test coverage before selecting and recording the documentation approach.

Current-system decision: use README as the durable instruction surface. It is already bundled into the app and discoverable through Help → README, satisfying discoverability without another reference document/window. The tooltip comes solely from the textarea `title`; `aria-describedby="editor-help"` and its screen-reader-only text can remain independently, and behavior-level Escape/Tab coverage already exists in `tests/editor-behavior.test.js`.

Implemented the planned fix: removed only the textarea `title` tooltip, retained `aria-describedby` and screen-reader-only focus-exit text, and added a Help → README-discoverable Keyboard navigation section covering Escape/Tab, indentation, document/view shortcuts, and Table Builder radio navigation. Verification passes: 42 focused accessibility/editor/help tests, 137/137 full frontend tests, production build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and native debug build. Awaiting native hover, keyboard, and README verification.

User completed native verification: the Input-pane hover tooltip is gone; ordinary Tab indentation and Escape-then-Tab focus exit work; Help → README remains preview-only and exposes clear Keyboard navigation guidance.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the intrusive native hover tooltip from the Markdown Input pane without changing its accessible description or keyboard behavior. Added a bundled README Keyboard navigation section, discoverable through Help → README, covering editor focus exit, indentation, document/view shortcuts, and Table Builder radio navigation. Updated regression assertions and retained behavior-level Escape/Tab coverage. Verification passed with 137 frontend tests, production build, six Rust tests, formatting/Cargo checks, native debug build, and user-confirmed native behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
