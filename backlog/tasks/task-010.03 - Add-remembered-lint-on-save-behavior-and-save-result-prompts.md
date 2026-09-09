---
id: TASK-010.03
title: Add remembered lint-before-save checks and save decisions
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:58'
updated_date: '2026-09-09 01:31'
labels:
  - feature
  - markdown
  - linting
dependencies:
  - TASK-010.02
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
parent_task_id: TASK-010
priority: high
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend manual linting with an optional remembered Lint before saving setting. Run the linter immediately on Save/Save As, before filename/location selection, document filesystem inspection or overwrite dialogs. Clean checks proceed to normal saving; findings offer Review Issues / Save Anyway / Cancel; failures offer Retry / Save Anyway / Cancel. Review/Cancel leave the document unsaved without opening file dialogs. Only actual successful writes may show Save complete. Keep the corrected normal-flow popup layout.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings → General exposes Lint before saving, default off, synchronized across editor windows and persisted across restarts; persistence errors retain the last accepted value
- [x] #2 When enabled, Save and Save As lint the originating in-memory snapshot before any save filename/location dialog or document filesystem operation; capture preference at save start and write only the checked content
- [x] #3 Review Issues and Cancel prevent all save file dialogs and writes, retaining dirty content; later canceled file dialogs or failed writes never display Save complete
- [x] #4 A clean check proceeds automatically to normal file selection/saving and only a successful write displays a five-second, immediately dismissible clean-save confirmation
- [x] #5 Findings show document-specific Review Issues, Save Anyway and Cancel; Review Issues opens originating snapshot results without saving, Save Anyway continues to normal file operations, Cancel leaves content and view unchanged
- [x] #6 Prompts have a non-overlapping responsive action row below their text, Cancel initially focused, and no Escape/backdrop/window-close ambiguity; Close/Clear/window-close sequences stop on Review or Cancel
- [x] #7 Linter failure/timeout/cancellation is distinguished from findings and write failure, with Retry, Save Anyway and Cancel; retries do not open file dialogs; subsequent filesystem/ownership/overwrite checks and history-error handling remain intact
- [x] #8 Automated tests, native layout/keyboard/timing/restart review and user documentation cover the revised lint-first save workflow
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Apply the user's explicit correction: run preflight at the beginning of #save before #write, native inspect, path selection, canonicalization, writability and overwrite dialogs. Existing Close/Clear unsaved/recovery decision still determines whether Save is requested; its save branch uses the same lint-first flow.
2. Capture a document snapshot with existing path (nullable for untitled), current display name, exact source/revision and operation identity. Protect it during lint, return early for Review/Cancel/failure, and run ordinary save operations only for clean/Save Anyway. Before writing, validate that source/revision still match the checked snapshot. Successful receipt uses final chosen path/name.
3. Update tests to assert filename/location, disk and write services have not run during lint or Review/Cancel, including repeated new-document Save → Review → Save; test subsequent dialog cancellation, filesystem errors, conflicts, exact content and final receipt. Preserve corrected popup layout and all existing choices/persistence.
4. Update README/doc-008/parent ordering contracts, run focused and full frontend tests, worker probe and standalone debug build. Retain known unrelated desktop-parity failure and leave .03 pending integrated native review; no commits or unrelated work.

User completed native review of the final lint-first build, reported it looks good and explicitly authorized commit and push. All criteria now verified. Finalize task metadata and implementation together in one TASK-010.03 commit, then push main; leave follow-up tasks unstarted.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Read AGENTS.md and workflow overview/execution, TASK-010 and dependencies .01/.02, approved doc-008 and architecture docs 002/005/006/007. Initial git status clean; HEAD 4d630aa; user-notes.md has no topics. Current code uses a session-wide operation lock with tab selection allowed; managed writes apply lifecycle success before Recent Files updating. Manual LintClient currently cancels previous requests, so saved jobs must be explicitly protected. No implementation yet.

Implemented native revisioned preference persistence, Settings control, successful-write receipts independent of Recent Files outcome, saved-snapshot worker execution, retained-document continuation, five-second clean notices, durable Yes/No and failure/retry notices, pending-window-close focus protection, and README instructions. Focused transaction/Settings/lint tests passed (65 in the first regression set; 47 in the expanded focused set). Rust suite passed 47 including two new persistence/restart/failure tests. Frontend build and production worker artifact checks passed. Initial new DOM tests incorrectly spied on missing jsdom dialog APIs; corrected the harness to use explicit per-dialog doubles like existing tests, then all passed. Native interaction review remains required. Full suite process output was unavailable after session pause, so rerunning with a durable log; standalone native debug build is in progress. user-notes.md now has a line-number gutter proposal; asked whether to create a separate task, no unrelated implementation started.

Verification audit: AC1 Settings DOM tests verify persisted-first checkbox and error rollback; integrated editor test verifies shared revision refresh and next-save behavior; two Rust tests verify default off, true/false relaunch persistence, revision preservation on failed write, and corruption errors. AC2/3 transaction and managed-save tests verify exact immutable source/origin/path receipts, authoritative setting capture, Save/Save As/recovery, cancellation, read-only/write failures and declined/stale overwrite approval. AC4 fake-clock DOM checks verify clean notice at 4999/5000ms and early Dismiss. AC5/6 DOM tests verify No initial focus, explicit Yes/No, no 60-second timeout, Escape/backdrop/ambiguous dialog close protection, origin focus and native-close callback prevention in full main.ts integration. Close/Clear and sequential Close Window continuation tests pass. AC7 canceled/failed/timed-out wording and retry tests keep filesystem success independent; history failure still lints its receipt and retains prior ancillary-error close behavior.

Final automated verification: full frontend suite 292 passed / 1 failed (293 total). Sole remaining failure is the disclosed pre-existing tests/desktop-parity.test.ts:50 Grid-vs-Flexbox assertion; unchanged. Three initial integration failures were caused by native service mocks missing the new lintPreference API; updated those mocks and verified their original behavior plus a new full saved-feedback integration test. 47 Rust tests passed; rustfmt applied and whitespace checks pass. npm run tauri build -- --debug --no-bundle passed after final UI changes; binary src-tauri/target/debug/quick-mark. Production worker artifact checks passed without DOM globals. README and doc-008 now document save behavior and implementation decisions.

AC8 remains unchecked and task In Progress pending user native review: Settings synchronization across editor windows and restart; clean notice five-second/manual dismissal; issue prompt keyboard focus, Escape/backdrop/window-close durability and Yes/No; Save chosen in Close/Clear and sequential window close; canceled Save As; Cancel Lint/failure and Run Again. No commit or push performed. TASK-010.04/.05 untouched. Line-number notes left intact; separate task creation awaits the user's answer.

User native review found popup buttons covering the title/text. Root cause is reuse of .lint-controls, whose absolute positioning is for the results panel. User explicitly approved dedicated popup layout and changing timing to BEFORE saving with clean auto-save; findings Review Issues / Save Anyway / Cancel; failures Retry / Save Anyway / Cancel. Prior after-save acceptance evidence is superseded. Existing uncommitted work/user files will be preserved; no commit authorization given.

Implemented approved timing revision: both native managed and file-service saves now run the check after path/overwrite decisions but before write, under the workspace lease. Clean proceeds automatically; Review/Cancel returns a canceled save with dirty content retained; Save Anyway proceeds; Retry rechecks the same pending snapshot. Successful receipts alone trigger clean confirmations, including truthful confirmation alongside a post-write history error. Removed the obsolete after-save retainDocument continuation. Renamed Settings to Lint before saving while retaining authoritative persisted preference state.

Fixed overlap with .save-lint-actions in normal flow rather than absolute .lint-controls. Native GTK display was unavailable in sandbox; approved display escalation ran an isolated WebKitGTK probe with the actual popup controller and stylesheet. At both 620px and 360px viewport widths, the buttons start 16px below the message, all button bounds fit within the dialog, Cancel has focus, and screenshots show no overlap. Evidence: /tmp/quickmark-popup-620.png and /tmp/quickmark-popup-360.png. This is actual engine layout verification, not a jsdom layout claim.

Rewritten focused tests passed 66; full suite after revision passed 296 with only the known pre-existing desktop-parity Grid/Flexbox failure. Added a further managed-save race test verifying an external edit during lint still rejects Save Anyway at the native write boundary without claiming save completion; final checks/build running. README, doc-008 and parent task now describe the user-approved before-save contract. Native end-to-end user review is still pending; no commit/push or unrelated task work.

Final revised-workflow verification: full frontend suite 297 passed, 1 known pre-existing failure at tests/desktop-parity.test.ts:50; the unrelated assertion is unchanged. Latest focused managed-save/worker/editor integration checks passed 21. Final npm run tauri build -- --debug --no-bundle and production worker checks passed; git diff --check passed. Native persistence implementation is unchanged from the 47-passing Rust suite.

Revised AC1 verified by Settings/shared-revision tests and the existing native persistence/restart tests. AC2/3 verified by immutable pre-write snapshot ordering, preference capture, canceled path, no-write Review/Cancel, locked content, write-failure, managed recovery and external-change-during-lint tests. AC4 verified by explicit successful-write callback ordering and 4999/5000ms/early-dismissal tests, including history failure after write. AC5 verified by all three explicit decision tests and full main.ts origin/review/dirty-state/Save Anyway integration. AC6 verified by DOM durability/focus/window-close/Close-Clear-sequencing tests plus native WebKitGTK layout measurements/screenshots at normal and narrow widths. AC7 verified by error/cancel/timeout choices, clean and issue retry cases, no-write infrastructure-failure and post-write history-error tests.

AC8 remains pending integrated native user review of the revised workflow. Review checklist: enable Lint before saving and confirm cross-window/restart persistence; save clean content and verify actual disk write plus five-second notice; use Review Issues and Cancel and verify dirty text/disk unchanged; Save Anyway writes; Close/Clear Save choices stop at Review/Cancel; popup remains readable at narrow widths with Cancel focused; cancel path selection skips lint; Cancel Lint gives Retry/Save Anyway/Cancel without premature save success. No commit or push performed.

Native review clarified that BEFORE saving means before ALL document file operations, especially the filename/location picker. User rejected selecting a destination before the lint prompt because Review forces repeated path selection. Implement lint-first directly at Save/Save As invocation; previous path-first ordering and its acceptance evidence are superseded.

Implemented lint-first ordering in #save before entering managed/service file operations. Preflight uses the existing document name/path (null for untitled) and immutable source/revision/operation identity; Review/Cancel or preflight infrastructure failure returns before filename selection, disk inspection, writability checks or writes. Clean/Save Anyway continues to ordinary file operations. A final pre-write source/revision guard rejects unchecked changes. Successful receipts still use the final chosen destination/name, and only actual writes can trigger clean confirmation.

Regression evidence: repeated new-document Save → Review, edit → Save As → Review makes zero selectSavePath/write calls; a subsequent clean Save selects once and writes checked text. Native managed Save and Save As Review tests make zero disk, overwrite-prompt, path-picker or write calls. Main.ts integration verifies no path dialog before the issue prompt or after Review, then a single picker after Save Anyway. Later canceled picker/read-only/failed writes never confirm save completion. Native disk changes during lint are handled by the later normal overwrite flow; a further change during approval still rejects the write. Changed editor content after preflight is rejected without writing.

Final verification: 38 focused tests passed; full frontend suite 301 passed / 1 known pre-existing desktop-parity Grid/Flexbox failure (unchanged). TypeScript, standalone npm run tauri build -- --debug --no-bundle, production worker checks and git diff --check passed. Native Rust persistence and popup CSS are unchanged from prior verified checks. README/doc-008/parent task updated to supersede path-first ordering. AC8 remains pending native user review, especially create new document → Save/Save As → Review with no file dialog, then fix → Save → choose destination once. No commit/push; user-notes preserved and unrelated tasks unstarted.

User accepted the final native-review result and explicitly requested commit and push. AC8 is satisfied by the recorded automated coverage, native WebKitGTK popup/layout checks, native persistence tests, documentation and user review of the integrated final build. Final full frontend result remains 301 passed / one disclosed pre-existing Grid/Flexbox assertion failure, unchanged. Git pre-commit whitespace check passed. Current origin/main already points to 4d630aa, so that earlier commit is no longer unpushed; this delivery adds the .03 commit. User notes and unrelated follow-ups remain untouched.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-29 21:08
---
Product clarification: the clean-save/no-issues confirmation should automatically dismiss after five seconds, while still allowing earlier manual dismissal. The issue-found Yes/No prompt remains durable and explicit.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Add a remembered, application-wide Lint before saving preference. Save and Save As check the originating text before filename/location selection or document filesystem operations. Clean results continue to saving; findings offer Review Issues, Save Anyway and Cancel; failures offer Retry, Save Anyway and Cancel. Review/Cancel keeps content unsaved without opening file dialogs. Preserve filesystem/ownership checks and successful-write receipts, with truthful five-second clean confirmations even when a later history update fails. Fix popup button overlap with a dedicated normal-flow action row.

Verified with 301 passing frontend tests, 47 Rust tests, production worker checks, standalone debug build, actual WebKitGTK layout probes at normal/narrow widths, and accepted user native review. The sole frontend failure is the disclosed pre-existing desktop-parity Grid/Flexbox assertion; untouched. README, approved doc-008 and parent contracts describe the final lint-first behavior. TASK-010.04/.05 remain unstarted.
<!-- SECTION:FINAL_SUMMARY:END -->
