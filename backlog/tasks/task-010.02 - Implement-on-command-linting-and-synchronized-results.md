---
id: TASK-010.02
title: Implement on-command linting and synchronized results
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 20:58'
updated_date: '2026-09-08 03:23'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-010.01
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
parent_task_id: TASK-010
priority: high
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the core QuickMark linting experience defined by the approved lint design. Users must be able to lint the current in-memory document without saving, inspect actionable issues in the right-hand workspace, navigate between issues and source, and return to the rendered Preview without losing document state. Results should participate in the existing source-synchronization model where meaningful, including sparse-result and no-result cases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A toolbar action and native menu action lint the active in-memory document on demand
- [x] #2 Lint results identify rule, message, line, column when available, and enough context to act on each issue
- [x] #3 Selecting an issue moves focus and the caret to the corresponding source location
- [x] #4 The results pane can be switched back to rendered Preview without changing document content, selection, dirty state, or view preferences
- [x] #5 Source and lint results synchronize scrolling or nearest-issue navigation predictably in both directions, including sparse issue sets
- [x] #6 A document with no issues shows an unambiguous clean result without leaving stale issues visible
- [x] #7 Lint execution errors are reported separately from lint findings and leave editing and Preview functional
- [x] #8 Automated tests, native verification, and user documentation cover the complete on-command workflow
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify the pinned markdownlint 0.41.1 dependency and browser worker integration before UI work; report installation/build failures without substituting another engine.
2. Implement the approved versioned default profile and typed per-document lint snapshot state with request/revision validation, cancellation and worker timeout. Extend validated transfer state for completed results only.
3. Add toolbar/native Edit command and temporary Source + Results inspection, Preview switching/normal-view restoration, accessible issue navigation, batching and explicit clean/stale/error states.
4. Integrate nearest-issue scroll synchronization and lifecycle invalidation across edits, reload/Clear, tab switching, close and detach without changing save workflows.
5. Verify rule fixtures, worker/client failures, range mapping and DOM/tab/transfer integration; run frontend tests/build and relevant Rust checks. Build and verify native worker/CSP behavior and document manual review steps. Update README and task evidence; only mark Done after all criteria verified. TASK-010.03/.04/.05 remain unstarted; ask before commit/push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User authorized proceeding to the named next task. Working tree is clean and user-notes.md has no pending topics. Approved doc-008 and dependency TASK-010.01 are available. Current main.ts binds per-tab retained textareas and preview controllers; view transfer validation is shared between document-workspace.ts and native editor_coordinator.rs. Begin with the required dependency/worker feasibility check.

Implemented pinned markdownlint worker/profile, typed result state, manual toolbar/Edit commands, Source/Results/Preview inspection with restoration, accessible line/range navigation, stale-result invalidation, result batching, nearest-issue scrolling and validated completed-result transfer. Save-triggered lint and rule controls remain unstarted. README documents the manual workflow.

Dependency installation initially failed with sandbox DNS EAI_AGAIN; approved escalation installed markdownlint 0.41.1 successfully (zero npm audit vulnerabilities). Executing the compiled worker revealed document-dependent entity decoding despite successful bundling. Corrected Vite export conditions to select the dependency's supported worker entry. Production artifact checks now pass without DOM globals. WebKitGTK 2.52 worker/CSP check outside sandbox passed MD025/MD042. Sandbox has no display access, but elevated native display access is available.

Verification so far: focused lint/workspace/tab/detach tests 33 passed; full frontend suite 270 passed, 1 failed. The failure in tests/desktop-parity.test.ts:50 expects CSS Grid while HEAD already uses Flexbox; confirmed pre-existing via git show. User permission to correct that separate stale assertion was requested asynchronously and remains pending. Do not suppress or alter it without authorization. cargo test passed 45 tests, cargo fmt --check and cargo check passed. Standalone debug build succeeded before final UI refinements and is being rebuilt. Native integrated app review remains pending; do not mark Done.

Production worker benchmarks (Node, not native UI): 1 MiB mixed Markdown 2781ms/20,167 findings; 5 MiB mixed input reached the approved 10s timeout; 50,000 lines 607ms; long line 177ms. No truncation or clean-result claim on timeout. Added a repeatable artifact check/benchmark script.

User completed native review of the standalone debug build and reported all looking good, explicitly authorizing commit and push. Acceptance evidence: AC1 toolbar/Edit invocation verified natively; AC2 actionable row fields verified in DOM tests/native review; AC3 source selection verified by range/DOM tests/native review; AC4 Preview and original-view restoration verified by DOM tests/native review; AC5 sparse nearest-issue sync and disabled-sync behavior covered by tests and user review; AC6 clean runs replace issues in tests; AC7 worker startup errors, timeout/cancel, stale response rejection and usable Preview covered by worker/DOM tests; AC8 README, 13 lint-specific tests, 45 native tests, actual WebKitGTK worker execution and user native review complete. Final standalone debug build and git diff --check passed. Full frontend suite remains 270 passed/1 pre-existing stale layout assertion failure; this is disclosed and unchanged, not claimed passing. User authorized delivery after that disclosure. No authorization inferred to fix the unrelated assertion.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented manual Markdown linting through the toolbar and native Edit menu using pinned markdownlint 0.41.1 in a bundled worker. Added the approved standard-rule profile (MD034/MD051 excluded), source-linked results, Preview/previous-view restoration, stale and error states, batched lists, scroll synchronization and validated results transfer across windows. Documented controls and worker integration.

Verification: 13 lint-specific tests pass; 45 Rust tests pass; production worker execution passes without DOM globals and in WebKitGTK under the worker CSP. Frontend build, standalone debug build, cargo fmt/check and whitespace checks pass. User completed native review and approved commit/push. Full suite has 270 passes and one disclosed pre-existing Grid-vs-Flexbox assertion failure in desktop-parity.test.ts:50; that unrelated test was not changed.

TASK-010.03 is next. Rule controls (.04) and heading-anchor/fragment linting (.05) remain To Do. No lint-on-save implementation is included.
<!-- SECTION:FINAL_SUMMARY:END -->
