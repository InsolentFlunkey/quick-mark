---
id: TASK-028.02
title: Fix CodeMirror completion-popup contrast across themes
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-19 02:32'
updated_date: '2026-09-19 02:45'
labels:
  - bug
  - accessibility
  - theme
  - editor
dependencies: []
references:
  - TASK-028
documentation:
  - src/styles.css
  - docs/editing.md
modified_files:
  - src/styles.css
  - tests/theme-preferences.test.ts
  - tests/tab-editor-integration.test.ts
parent_task_id: TASK-028
priority: medium
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The production CodeMirror path-completion popup uses its default light surface while inheriting QuickMark theme text colors. In QuickMark Classic, unselected suggestions render as light gray text on white and are nearly unreadable. Apply theme-aware completion-popup styling without changing path-completion behavior. The defect was observed during TASK-028 Windows validation and is separate from bracket pairing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Unselected completion suggestions have clearly readable foreground and background contrast in Dark, Light and QuickMark Classic themes.
- [x] #2 Selected, keyboard-focused and pointer-hovered suggestions remain visually distinct and readable in every supported theme.
- [x] #3 Completion-popup borders, metadata text and scrollable overflow use theme-appropriate styling without changing completion behavior.
- [x] #4 Automated style or interaction coverage protects the completion popup's theme integration.
- [x] #5 Native Windows visual review confirms the popup is readable in all supported themes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan:

1. Add explicit completion-popup palette variables for Dark, Light, and QuickMark Classic.
2. Style CodeMirror's popup surface, border, text, metadata, icons, scrollbar, hover state, and selected row using those variables.
3. Add automated contrast checks for unselected, metadata, and selected text/background combinations in all three themes.
4. Extend the completion integration test to confirm CodeMirror renders the expected popup structure and selection state.
5. Run focused tests, the full frontend suite, and production/native builds.
6. Provide a new Windows executable for visual review in all three themes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added explicit completion-popup foreground, background, detail, hover, selected-background and selected-text palette values for Dark, Light and QuickMark Classic. High-specificity CodeMirror overrides now theme the tooltip surface, border, shadow, list, scrollbar, rows, metadata and icons.

Added WCAG-style 4.5:1 contrast assertions for unselected text, metadata text and selected text in all three themes. Extended the production editor integration test to verify the rendered completion popup label, detail metadata and selected option structure.

Verification passed: focused theme/editor integration suite (2 files / 13 tests), full frontend suite (59 files / 484 tests), TypeScript/Vite production build, native Tauri release build and git diff --check. The local browser preview could not connect in this environment, so AC #5 remains open for user Windows visual review.

User completed the native Windows visual review and confirmed the completion popup looks much better. AC #5 is satisfied.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-19 02:33
---
Implementation authorized by the user after TASK-028 completion on 2026-09-18.
---

author: @Codex
created: 2026-09-19 02:36
---
User approved the implementation plan on 2026-09-18.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Fixed the CodeMirror path-completion popup's unreadable QuickMark Classic presentation by adding explicit, theme-specific popup palettes for Dark, Light and QuickMark Classic. High-specificity editor styles now control the popup surface, border, shadow, text, metadata, icons, scrollbar, hover state and selected row without changing completion behavior.

Added automated 4.5:1 contrast checks for unselected text, metadata and selected text across every supported theme. Extended production editor integration coverage to verify CodeMirror renders the expected completion label, detail metadata and selected option state.

Verification passed: focused theme/editor tests (2 files / 13 tests), full frontend suite (59 files / 484 tests), TypeScript/Vite production build, native Tauri release build, git diff --check, and user Windows visual review of Dark, Light and QuickMark Classic.
<!-- SECTION:FINAL_SUMMARY:END -->
