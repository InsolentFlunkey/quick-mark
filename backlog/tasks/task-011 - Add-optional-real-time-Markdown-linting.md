---
id: TASK-011
title: Add optional real-time Markdown linting
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 20:59'
updated_date: '2026-09-18 02:59'
labels:
  - enhancement
  - markdown
  - linting
  - performance
dependencies:
  - TASK-010
  - TASK-008
modified_files:
  - docs/linting.md
  - index.html
  - src-tauri/src/editor_coordinator.rs
  - src/lint-results.ts
  - src/main.ts
  - src/settings.ts
  - src/styles.css
  - src/tauri-editor-services.ts
  - tests/lint-results.test.ts
  - tests/manual/realtime-lint.md
  - tests/save-lint-integration.test.ts
  - tests/settings.test.ts
priority: low
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After the on-command and lint-on-save MVP is established and large-document performance is understood, add an optional real-time linting mode that updates issues during editing without distracting users or degrading responsiveness. Real-time linting must remain opt-in, debounced, and consistent with the same rule profile and results experience as manual linting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can enable or disable real-time linting independently of lint-on-save, and the choice persists across restarts
- [x] #2 Lint updates are debounced so incomplete keystrokes do not trigger excessive work or disruptive UI churn
- [x] #3 Editing, rendering, synchronized scrolling, and input responsiveness remain within the established large-document performance budgets
- [x] #4 Real-time results use the same rule profile, issue identity, navigation, and results pane as on-command linting
- [x] #5 Stale lint runs cannot replace results for newer document content
- [x] #6 The feature remains unobtrusive when results are not being viewed and does not open save-result prompts while typing
- [x] #7 Automated concurrency/performance coverage, native verification, and user documentation cover the optional mode
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add an independent, persistent Lint while typing preference, defaulting off and synchronizing across editor windows.
2. Add the Settings toggle beside Lint before saving with existing persistence and error behavior.
3. Debounce live checks for 750 ms after editing stops, with at most one scheduled and one running live check; manual and save checks take precedence.
4. Reject results unless request token, document revision, source and rule configuration still match.
5. Keep Preview visible and never display save prompts or move focus for background checks.
6. Report current live status on the existing Lint control as Lint (count), Lint (0), or a subtle failure indicator; activating it opens current cached results immediately, while an already-open results pane updates in place.
7. Reuse the existing profile, issue identity, navigation, pagination and per-tab result cache. VS Code-style inline decorations remain outside this task and are evaluated by TASK-031.
8. Add concurrency, debounce, integration, persistence and deterministic scheduling/performance coverage plus documentation and native verification.
9. Interpret performance acceptance as no material live-lint scheduling regression against TASK-008's measured baseline and review tolerances because the pre-existing editor already misses the aspirational target in some synthetic cases.
10. Run the full frontend, Rust, production and desktop-build verification suites and finalize after native review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Planning investigation: TASK-008 records a 100 ms paint-opportunity target for 256 KiB/1 MiB editing, truthful 10-second lint timeouts, and a requirement that future live lint retain worker execution, debounce idle input, bound pending work, cancel superseded work and reject stale replies. Repeated full parses per keystroke are explicitly unsupported.

Current architecture supports a single coherent extension: lint-before-save plus rule overrides are persisted in the native coordinator; createLintResults owns the one LintClient, per-tab result cache, rule identity, cancellation and stale checks. Real-time scheduling should be added there so manual, save and live runs cannot race through separate clients. DocumentWorkspace already marks cached results stale immediately on edits.

Implementation completed for review: added an independent persisted `Lint while typing` preference; a 750 ms bounded scheduler integrated with the existing lint client/cache; exact token, revision, source, and rule-profile stale-result checks; manual/save precedence; compact cached status on the Lint control; and non-disruptive background behavior that leaves Preview and focus untouched.

Automated verification passed on 2026-09-18: `npm test` (54 files, 441 tests), `cargo test --manifest-path src-tauri/Cargo.toml` (55 tests), `npm run build`, `cargo fmt --check`, `git diff --check`, lint-worker production checks and benchmark, and `npm run tauri build -- --debug`. Benchmark observations remained consistent with TASK-008 constraints: 1 MiB lint 4594 ms, 5 MiB truthful 10-second timeout, 50,000-line sparse document 845 ms, long-line fixture 199 ms. A native debug build was launched for user review.

Native-review refinement requested by the user: nonzero real-time issue counts now use the theme-aware warning border, text, and background with stronger type; clean `Lint (0)` remains neutral and failed `Lint (!)` remains red. The count and accessible label preserve a non-color indication.

Refinement verification passed: focused lint-results/save-lint integration suite (26 tests), production TypeScript/Vite build, diff check, and a fresh native debug build in the isolated `src-tauri/target/realtime-lint-review` target. The isolated target was required because the original review executable remains open and Windows locks it.

Approved native-review refinement: real-time lint now schedules a debounced first check for a nonempty document when it becomes active, including newly opened and transferred/restored documents. Empty new documents are skipped, background tabs wait until activation, and current complete/running cached results prevent redundant checks.

Post-refinement verification passed on 2026-09-18: focused scheduler/integration suite (27 tests), complete frontend suite (54 files, 442 tests), production build, fresh native debug build, and diff check.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 00:46
---
User explicitly authorized beginning TASK-011 on 2026-09-17. Moving it to In Progress for implementation planning; code changes will wait until the plan is presented, approved, and recorded.
---

author: @Codex
created: 2026-09-18 02:12
---
User approved the revised TASK-011 implementation plan and the TASK-008-relative performance interpretation on 2026-09-17. The plan includes a compact Lint-control result count; inline editor decorations are deferred to the explicitly authorized TASK-031 investigation.
---

author: @Codex
created: 2026-09-18 02:23
---
TASK-011 implementation and automated verification are complete. The native debug build has been launched for the required manual review; the task remains In Progress pending that confirmation.
---

author: @Codex
created: 2026-09-18 02:33
---
Following native feedback, strengthened the toolbar indication for nonzero findings using the existing theme-aware warning palette. Awaiting a quick visual confirmation from the refreshed native build.
---

author: @Codex
created: 2026-09-18 02:54
---
Implemented the user-approved open/activation behavior: nonempty active documents lint after the normal idle delay without requiring an edit; empty documents and valid cached results are skipped. Awaiting final native confirmation.
---

author: @Codex
created: 2026-09-18 02:59
---
User confirmed the final native behavior on 2026-09-18, including the warning-colored finding indicator and automatic debounced linting when opening a nonempty document. All acceptance criteria are verified; marking TASK-011 Done.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented optional real-time Markdown linting with an independent persisted setting, a bounded 750 ms worker-backed scheduler, strict stale-result rejection, and manual/save precedence. Background checks preserve Preview and focus, reuse the existing rule profile and results cache, expose accessible toolbar counts with theme-aware warning/error states, and lint nonempty documents after opening or first activation without redundant cached checks. Added concurrency, persistence, integration, performance, documentation, and native verification coverage; the user completed native review successfully.
<!-- SECTION:FINAL_SUMMARY:END -->
