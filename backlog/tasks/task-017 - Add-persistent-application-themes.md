---
id: TASK-017
title: Add persistent application themes
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-03 01:18'
updated_date: '2026-09-17 22:40'
labels:
  - enhancement
  - themes
  - accessibility
dependencies:
  - TASK-014
  - TASK-021
modified_files:
  - docs/editing.md
  - index.html
  - shared/markdown.css
  - src-tauri/capabilities/default.json
  - src/main.ts
  - src/reference.ts
  - src/settings.ts
  - src/styles.css
  - src/theme-preferences.ts
  - tests/manual/themes.md
  - tests/settings.test.ts
  - tests/theme-preferences.test.ts
priority: medium
ordinal: 23750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide user-selectable visual themes for QuickMark, including Dark, Light, and a recovered or faithfully recreated version of the original QuickMark color scheme when available from repository history. Theme selection should apply consistently across the main workspace, dialogs, rendered content, reference windows, tabs, and detached windows, and persist across restarts. Implement after the multi-window document architecture so propagation is designed for the final window model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark provides accessible Dark and Light themes plus a documented disposition for the original QuickMark color scheme
- [x] #2 The original color scheme is recovered from repository history when possible and offered as a distinct theme or its relevant characteristics are deliberately incorporated
- [x] #3 Theme selection is available from a clearly named application control and persists across application restarts
- [x] #4 The selected theme applies consistently to editor, preview, toolbar, menus where platform APIs permit, dialogs, reference windows, tabs, and detached windows
- [x] #5 All themes maintain readable contrast and visible focus, disabled, error, selection, and hover states
- [x] #6 Printing remains intentionally styled and is not accidentally changed by the active screen theme
- [x] #7 Automated preference and presentation tests plus native multi-window verification and user documentation cover theme selection and persistence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a typed theme-preference module supporting Dark, Light and QuickMark Classic, with safe fallback and localStorage persistence.
2. Recover QuickMark Classic from the original commit's navy palette, translucent panels, blue accent and subtle gradients.
3. Add a clearly labeled Theme selector to Settings with immediate application and persistence-error handling.
4. Convert hard-coded interface colors into semantic CSS variables covering focus, hover, selection, disabled, warning, error, code, dialog, tab and completion states.
5. Apply and synchronize themes across main, detached-editor, README, cheat-sheet and Markdown Examples windows. Request the matching Tauri native-window theme where supported; native menus remain platform-rendered.
6. Keep print styling explicitly white and independent of the selected screen theme.
7. Add automated preference, Settings, propagation, contrast and presentation tests plus a native multi-window verification checklist.
8. Update user documentation with theme selection, persistence, QuickMark Classic provenance and platform-menu limitations.
9. Run the complete test and production-build suites, update verified acceptance criteria and finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Planning investigation: the first commit (ebdf407) contains the original QuickMark palette and visual treatment: deep navy backgrounds (#0b1020 / #0f172a), slate text and borders, blue accent (#60a5fa), translucent panels, and blue/slate radial gradients. This can be offered as a distinct QuickMark Classic theme rather than approximated.

Current architecture: main and detached editor windows share index.html/main.ts/styles.css; README, cheat-sheet and examples windows share reference.html/reference.ts/reference.css. Preferences already use localStorage and storage events. Settings has a General section suitable for a Theme selector. Tauri native menus are platform-rendered; web CSS can cover application content and dialogs, while the native window theme can be synchronized through the available window API where supported.

Implementation complete pending native visual acceptance. Added Dark, Light and recovered QuickMark Classic palettes; persistent Settings selector; localStorage/storage-event propagation across editor, detached and reference windows; Tauri native window theme synchronization; semantic state colors; explicit print palette; documentation and manual checklist.

Verification on 2026-09-16: targeted theme/Settings/reference tests passed (29/29); full Vitest suite passed (54 files, 434 tests); npm run build passed; `tauri build --debug` compiled the desktop app and produced the debug NSIS installer. `git diff --check` passed. The in-app browser runtime could not initialize (`Cannot redefine property: process`), so browser screenshots were unavailable. Launched the debug desktop build for user-native review.

Native review accepted by the user on 2026-09-17. Theme switching and the reviewed application appearance look good. The user observed that QuickMark Classic appears darker than the original QuickMark, but explicitly chose to leave it as implemented and revisit only if desired later; no follow-up task was authorized.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-17 03:43
---
User explicitly authorized beginning TASK-017 on 2026-09-16. Moving it to In Progress for implementation planning; no code changes will begin until the plan is presented, approved, and recorded.
---

author: @Codex
created: 2026-09-17 03:47
---
User approved the implementation plan on 2026-09-16. The plan is now the task's execution record.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented persistent application themes across QuickMark.

- Added accessible Dark and Light themes plus QuickMark Classic, derived from the original single-file application's navy palette, blue accent, translucent surfaces and gradients.
- Added a Theme selector to Settings with localStorage persistence, cross-window storage-event synchronization and matching Tauri native-window theme requests.
- Reworked application and rendered-Markdown colors into semantic tokens covering editor, preview, tabs, dialogs, controls, focus/hover/disabled states, warnings, errors, code, reference windows and detached windows.
- Preserved a dedicated black-on-white print presentation independent of the active screen theme.
- Documented theme behavior, Classic provenance and platform-native menu limitations, and added a native verification checklist.

Verification: full Vitest suite passed (54 files, 434 tests); TypeScript/Vite production build passed; Tauri debug application and NSIS installer build passed; git diff --check passed; user completed and accepted native visual review. The user noted Classic currently looks darker than the original and may revisit that subjective tuning later.
<!-- SECTION:FINAL_SUMMARY:END -->
