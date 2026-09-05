---
id: TASK-021
title: Add Settings with Recent Files management
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-04 14:49'
updated_date: '2026-09-05 04:55'
labels:
  - feature
  - settings
  - recent-files
dependencies:
  - TASK-018
documentation:
  - >-
    backlog/docs/architecture/doc-005 -
    Settings-presentation-and-Recent-Files-clearing.md
modified_files:
  - index.html
  - src/application-menu.ts
  - src/main.ts
  - src/styles.css
  - src/settings.ts
  - tests/settings.test.ts
  - tests/settings-menu.test.ts
  - >-
    backlog/docs/architecture/doc-005 -
    Settings-presentation-and-Recent-Files-clearing.md
priority: medium
type: feature
ordinal: 22300
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a conventional, reusable Settings/Preferences surface rather than placing a destructive Clear command directly among recent documents. The first setting should let users clear QuickMark’s persisted Recent Files history deliberately and safely; the surface should be suitable for later theme and lint preferences without implementing those features in this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark exposes a platform-appropriate Settings or Preferences command that opens a non-destructive settings interface
- [x] #2 The settings interface includes a clearly labeled Clear Recent Files control separated from ordinary document-opening actions
- [x] #3 Clearing recent files requires confirmation and Cancel leaves the history unchanged
- [x] #4 Confirming the action removes the persisted history and immediately changes File → Recent Files to the disabled `No Recent Files` placeholder
- [x] #5 Clearing history never deletes, moves, closes, or modifies document files
- [x] #6 The settings structure can accept future categories without implementing theme or lint preferences in this task
- [x] #7 Automated persistence, confirmation, menu synchronization, and accessibility coverage plus native verification confirm the workflow
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add Settings… consistently under QuickMark on macOS and Edit on Windows/Linux, with CmdOrCtrl+,. Open a modal Settings surface in the main editor and preserve TASK-018 native menu attachment/resource behavior.
2. Implement accessible Settings markup/styles with named General and Recent Files sections, Clear Recent Files…, Close, and visible status/error feedback. Keep future theme/lint categories out of scope.
3. Use the user-approved HTML confirmation modal with Cancel initially focused, explicit Clear Recent Files confirmation, Escape cancellation, and return-value reset on every opening. Guard duplicate actions and restore focus after dismissal.
4. Persist the empty recent-files list before replacing in-memory history and awaiting the existing native submenu refresh. Surface failures; do not involve document lifecycle or filesystem mutations.
5. Cover persistence, cancellation, confirmation, repeated opening, failures, accessible names/focus restoration, document-content preservation, and native-menu synchronization with behavioral tests. Run the full frontend suite, production build, and native debug build.
6. Capture design rationale in Backlog doc-005. Complete user native verification of Cancel/Escape, focus containment, submenu stability, dirty-document preservation, relaunch persistence, and repopulation before marking TASK-021 Done. Ask for commit approval only after all acceptance criteria are verified. Do not begin later tasks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Initial research: verified clean starting worktree and HEAD feb7d5d; TASK-018 dependency is Done. TASK-021 is the first listed To Do task and is now In Progress, assigned @Codex. user-notes.md contains no pending topics. No later tasks started and no code changed.

Current implementation: src/recent-files.ts stores a normalized list under quickmark:recent-files in localStorage; tests/recent-files.test.ts covers normalization/loading/saving but no clear workflow. src/main.ts owns recentFiles and updateRecentFiles; that helper currently updates memory before persistence and catches failures internally, so clearing needs an observable success/failure path and persist-before-memory ordering. src/application-menu.ts already renders a disabled No Recent Files MenuItem and manages live Tauri resources; preserve that behavior. Existing HTML dialogs provide styling precedent; native confirmation uses message() in src/tauri-window-services.ts and dialog:allow-message is already permitted. Vitest uses jsdom; npm, cargo and node_modules are present. No build or native verification has been run during planning.

Plan review checkpoint: proposed modal presentation, category structure, and platform menu placement are product decisions under the Backlog task-execution proportional-review rule. Present the concrete proposal for approval before writing implementation code.

Implementation progress: added platform-specific Settings menu entry, accessible Settings markup/styles, an injected Settings controller, and persist-before-visible-update clearRecentHistory operation. New Settings/controller tests pass 9/9; mocked native-menu tests pass 3/3; existing menu/recent-files tests pass 16/16. No later tasks changed.

Confirmation prerequisite: installed @tauri-apps/plugin-dialog MessageDialogOptions has no default-button/focus option. Requested user choice between HTML confirmation with explicit Cancel focus and native confirmation with platform default focus; dependent confirmation adapter and main.ts wiring are pending. Intermediate build reports missing showSettings action in main.ts, expected until that wiring is complete; task is not build-ready yet.

Implementation completed with the approved HTML confirmation and main.ts wiring; the prior missing-action build error is resolved. Full frontend suite passed 188/188 tests before two additional confirmation tests were added; updated Settings suite passes 11/11, including both added tests. Production build and native debug build without bundling pass. Native binary: src-tauri/target/debug/quick-mark. Architecture rationale recorded as doc-005.

Native interactive verification remains outstanding: no desktop interaction tool is available in this session. Leave TASK-021 In Progress and AC #7 unchecked until the user verifies mouse/keyboard, focus containment, relaunch persistence, and dirty-document preservation. No commits made; no later tasks started.

User native review accepted: after receiving the native verification checklist, the user reported 'OK, that's looking good. please proceed'. Combined with the recorded DOM/persistence/menu tests and successful production/native builds, this completes acceptance verification. Native review was user-performed; platform-specific menu placement also has automated coverage, not a claim of manual testing on every OS. Final diff whitespace check passed. No later tasks started.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Settings… under QuickMark on macOS and Edit on Windows/Linux. The reusable General/Recent Files surface separates history management from document-opening actions. Clearing requires an HTML confirmation with Cancel initially focused; cancellation and dismissal preserve history, and confirmation persists an empty list before refreshing the native Recent Files submenu. Documents and current edits remain unaffected. Errors are visible and duplicate clear requests are guarded. Architecture rationale is recorded in doc-005. Verification includes the full 188-test frontend run, the updated 11-test Settings suite with two additional confirmation tests, production and native debug builds, diff checks, and user-accepted native review. No theme/lint preferences or later tasks were implemented.
<!-- SECTION:FINAL_SUMMARY:END -->
