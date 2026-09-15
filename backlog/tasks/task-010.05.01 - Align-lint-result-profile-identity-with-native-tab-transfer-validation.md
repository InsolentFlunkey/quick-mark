---
id: TASK-010.05.01
title: Align lint result profile identity with native tab transfer validation
status: Done
assignee:
  - Codex
created_date: '2026-09-14 02:01'
updated_date: '2026-09-15 00:57'
labels:
  - bug
  - linting
  - windows
dependencies: []
references:
  - src/lint-state.ts
  - src/lint-profile.ts
  - src-tauri/src/editor_coordinator.rs
documentation:
  - >-
    backlog/docs/architecture/heading-fragments/doc-011 -
    QuickMark-heading-anchors-and-fragment-validation.md
modified_files:
  - src/lint-identity.ts
  - src/lint-state.ts
  - src/lint-profile.ts
  - src-tauri/src/editor_coordinator.rs
  - tests/lint.test.ts
  - tests/lint-results.test.ts
  - tests/lint-state-isolation.test.ts
  - tests/manual/lint-profile-transfer.md
  - docs/linting.md
  - >-
    backlog/docs/architecture/heading-fragments/doc-011 -
    QuickMark-heading-anchors-and-fragment-validation.md
parent_task_id: TASK-010.05
priority: high
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Native performance measurement after TASK-010.05 exposed a remaining profile identity mismatch: src/lint-state.ts uses quickmark-1-markdownlint-0.41.1, while src/lint-profile.ts and native editor_coordinator.rs transfer validation use quickmark-2-markdownlint-0.41.1. Results display the old profile, and native validation can reject moving tabs that carry lint state. The worker itself runs the current heading-aligned checks. Keep this correction separate from TASK-008. User authorized creating this bug task and fixing it after TASK-008 is complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Current lint results display and transfer using the same profile identity as the active lint engine and native validator.
- [x] #2 Moving a tab with completed or stale lint results to another window succeeds and preserves appropriate result freshness; genuinely incompatible profile data remains rejected.
- [x] #3 Automated cross-layer identity/transfer coverage, a standalone native move-tab check, and relevant documentation verify the correction without introducing a parser dependency into UI state-only modules.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
User authorized this fix after TASK-008 and confirmed proceeding. Share the frontend lint identity through a dependency-free module, re-exporting existing public constants so engine and UI state cannot drift. Keep native rejection of incompatible profiles. Add cross-layer identity coverage and completed/stale transfer preservation/rejection tests, including Rust validation coverage. Run relevant frontend/Rust checks, production build and worker isolation check, rebuild ordinary Windows executable and document manual standalone completed/stale move-tab verification. Do not change lint rules or pagination behavior; native manual review required before Done.

Implementation and automated verification complete. User confirmed the rebuilt standalone native completed/stale move-tab checklist looks good and explicitly authorized commit/push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed mismatch: lint-state PROFILE_VERSION is quickmark-1 while engine and native transfer validator use quickmark-2. Cancel visibility/pagination work is outside this fix.

Implemented dependency-free identity shared by engine and UI exports. Added actual engine-produced completed/stale snapshot transfer tests, incompatible v1 rejection, result-summary identity assertion, frontend/native accepted-identity comparison, parser isolation test, and native stale-state validation. Updated user/architecture docs and standalone manual checklist.

Full frontend run: 339 passed, one new test failed due to browser-transformed import.meta.url. Corrected the test to use Vite raw source import; all 23 tests in the three affected suites pass on rerun (340 tests covered across runs). All 50 Rust tests and formatting pass. Ordinary native rebuild in progress. AC2/3 remain pending standalone manual move-tab review.

Ordinary Windows standalone debug build (locked dependencies) passes; executable rebuilt at src-tauri/target/debug/quick-mark.exe. Production worker smoke test passes without DOM globals. Implementation ready for the manual completed/stale move-tab checklist; no commit created.

User accepted native verification: completed results move and remain navigable; edited results move as out of date; Run Again refreshes results. All acceptance criteria satisfied. Commit and push authorized.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fix rejection of detached tabs carrying lint results by sharing the current v2 identity between the frontend engine and UI state through a dependency-free module. Native validation continues rejecting incompatible profiles. No lint rule behavior changed.

Regression coverage checks engine/UI/native agreement, displayed profile, completed/stale transfer preservation, incompatible profile rejection and parser-free UI state imports. Updated linting documentation and native review checklist.

Verification: frontend suite plus corrected affected-suite rerun covers 340 passing tests; 50 Rust tests, formatting, production worker smoke check and ordinary Windows debug build pass. User verified completed/stale moves and rerunning lint in the rebuilt app.
<!-- SECTION:FINAL_SUMMARY:END -->
