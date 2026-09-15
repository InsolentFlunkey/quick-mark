---
id: TASK-010.02.01
title: Show loaded lint issue counts and emphasize Load More
status: Done
assignee:
  - Codex
created_date: '2026-09-15 00:36'
updated_date: '2026-09-15 02:40'
labels:
  - enhancement
dependencies: []
documentation:
  - tests/manual/lint-result-counts.md
modified_files:
  - src/lint-results.ts
  - src/styles.css
  - tests/lint-results.test.ts
  - docs/linting.md
  - tests/manual/lint-result-counts.md
parent_task_id: TASK-010.02
priority: medium
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During TASK-008 manual review, a document reported 2840 lint issues but initially displayed only 200. The total alone does not clearly communicate that more results remain. Show the displayed range alongside the total (for example, '1–200 of 2840 issues found') and make Load More visually prominent while additional results remain. User authorized implementing this focused UI enhancement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The lint results summary shows the displayed range and total, such as '1–200 of 2840 issues found', and updates after each Load More action.
- [x] #2 Load More is visibly emphasized while undisplayed issues remain, with accessible contrast and keyboard focus; once all issues are displayed it no longer suggests more are available.
- [x] #3 Zero issues, fewer than one batch, exact batch boundaries, final partial batches and a fresh lint run show accurate counts without stale ranges.
- [x] #4 Preserve bounded result rendering and existing issue navigation; verify count progression and button states with focused tests and document manual verification steps.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
User explicitly requested proceeding with the previously specified range/total and prominent Load More enhancement. Update summary to report actual displayed range capped at total; preserve zero-result, running/error and stale semantics. Emphasize Load more with theme-aware high-contrast styling and focus-visible outline, hide after final batch and retain keyboard focus when it disappears. Keep batches/navigation behavior. Add focused tests for counts at zero/small/exact/partial boundaries, new run, stale results and navigation-driven expansion. Update linting guide; build ordinary Windows executable for manual visual and keyboard review using the existing app palette before completion.

Visual review correction: replace Load more underline hover with a contrasting border and inset pressed feedback on the highlighted control. Keep shared button styles unchanged pending separate authorization.

User accepted corrected hover/pressed styling in the rebuilt app and authorized commit/push. All implementation, automated and manual verification complete.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Current summary only shows total; visible is a batch capacity that can exceed issue count, so displayed count must be capped. Existing Load more hides at final batch and needs a focus destination when activated for that batch.

Implemented displayed range capped at total, including stale warnings, and retained zero-result/running/error semantics. Load more uses existing accent/panel palette (calculated text contrast 8.86:1), bold text, hover underline and visible focus outline. Final activation moves focus to the issue list when the button disappears. Navigation-driven batch expansion also updates the summary.

20 focused lint-results/save integration tests pass, covering zero/one/199/200/201/400/450 results, batch progression/reset, final focus, stale behavior and navigation expansion. TypeScript/production frontend and ordinary Windows standalone debug build pass. Manual visual/keyboard checklist provided; AC2 remains pending user review. No commit created.

User verified counts/batching work, but rejected link-like underline hover. Comparison with HEAD confirms global button rules are unchanged and had no :active styling. Correct Load more within this task: use border hover like other buttons and inset pressed feedback. Asked separately about tracking app-wide pressed feedback; no global change included.

Removed Load more hover underline; hover now changes the border and active press adds an inset border. Frontend TypeScript/Vite build passed. Native rebuild failed replacing target/debug/quick-mark.exe with Access denied (likely running app). No processes terminated or alternate executable workaround used; awaiting user closure before retry. User authorized creating/implementing separate app-wide pressed-feedback task after this task.

User closed QuickMark; initial retry coincided with their PowerShell update and could not launch the shell. After update, unchanged standard build command succeeds: TypeScript, Vite and ordinary Windows debug executable rebuilt successfully with corrected Load more hover/pressed styling. Environment blocker resolved; final visual review remains pending.

Final user review passed after removing link-like hover underline. Commit/push explicitly authorized. TASK-027 will follow in a new chat at the user's request; its implementation is already authorized but remains unstarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Show actual loaded lint issue range and total, updating for batch loading and navigation-driven expansion while preserving stale and clean-result messages. Emphasize Load more with accent fill, border hover, inset pressed feedback and visible keyboard focus; hide it after the final batch and move focus to the list.

20 focused lint/save integration tests pass, including zero/small/exact/partial batches, reset, stale results, navigation and focus. TypeScript, production frontend and ordinary Windows native debug build pass. User verified counts and corrected visual behavior. Documentation and native checklist included; app-wide button feedback remains separate in TASK-027.
<!-- SECTION:FINAL_SUMMARY:END -->
