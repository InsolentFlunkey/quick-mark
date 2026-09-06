---
id: TASK-014.04
title: Verify the integrated tab and window workflow
status: Done
assignee:
  - Codex
created_date: '2026-09-06 02:44'
updated_date: '2026-09-06 21:53'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.03
modified_files:
  - src/tab-session.ts
  - src-tauri/src/editor_coordinator.rs
  - tests/integrated-workspace.test.ts
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
  - >-
    backlog/tasks/task-014 -
    Introduce-tabbed-multi-document-editing-and-detachable-windows.md
  - backlog/tasks/task-014.04 - Verify-the-integrated-tab-and-window-workflow.md
parent_task_id: TASK-014
priority: high
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Complete the TASK-014 initiative's integrated release verification after the preceding children have their own tests and documentation. Audit cross-boundary races, save-as collisions, simultaneous opens, transfer failures, close cancellation and restoration limits. Resolve only defects within the initiative scope and complete user guidance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Integrated tests cover simultaneous opens, Save As path collisions, transfer failure and close cancellation without document loss or duplicate ownership.
- [x] #2 Frontend/native checks and user cross-window verification pass for the complete tab/window workflow.
- [x] #3 User documentation accurately covers commands, linked navigation, detaching, shared settings and restoration limits.
- [x] #4 All preceding required TASK-014 children are verified Done and parent acceptance evidence is recorded.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Audit the current TabSession/native coordinator boundary and existing tests against the original TASK-014 contracts. Required children .01/.02/.03 are Done; .05-.08 are optional later enhancements. Keep TASK-002.03.01 and TASK-022.01 regressions and optional enhancements out of this task.
2. Add integrated frontend tests with multiple real TabSession instances sharing one ownership-service test fixture. Exercise simultaneous opens, Save As collisions with pending opens and other saves, transfer failure/commit across sessions, and Save-then-Cancel window closing while claims remain live. Complement this with native tests using the real coordinator lock and concurrent callers, plus reload/terminal transfer checks.
3. Reproduce and fix only in-scope defects exposed by this audit. In particular, verify failed native open-adoption acknowledgement does not replace the originating blank or publish a misleading tab: current open publishes local state before awaiting native adoption. Record any concrete defect and its regression test before fixing it. Preserve existing user-approved tab and window behavior.
4. Review README and doc-006 against the verified behavior and record a durable parent acceptance-evidence matrix covering the original four-child scope. Update documentation where the audit clarifies transaction ordering or limitations.
5. Run full frontend/native tests, Cargo formatting/checks, production/native debug build and diff checks. Obtain native user review for the integrated scenarios and any corrected behavior before marking this child or the required parent scope complete. Ask before committing; existing commit approval covered only earlier commits and does not authorize this task's commit or a push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started on main at 560edf6, clean worktree and two previously approved local commits ahead of origin. Cached Backlog overview/execution/finalization guides and doc-006 apply. AGENTS.md reread. Current coverage has isolated native coordinator tests and mostly single-session frontend mocks; this task will add cross-session scenario tests and true concurrent native reservation checks. Audit found local open state is published before native adopt resolves, so failed adoption could violate failed-open preservation. No code changed before recording this plan.

Reproduced two integration failures before fixing code: native open-adoption failure replaced the originating pristine blank with file content, or left a newly published tab behind when opening from an edited origin. TabSession now awaits native adoption before publishing local document state and releases the reservation on acknowledgement failure, including a lost reply after native commit. Multi-session tests cover both rollback cases and verify another editor can subsequently open the file.

Integrated frontend scenarios now use real TabSession instances sharing one test ownership service: simultaneous opens/retry focus, Save As versus pending open, simultaneous Save As, Save-then-Cancel window close retaining claims, failed then successful detach followed by duplicate focus/save from the destination, and adoption rollback. These test fixtures do not replace native verification: real native lock/thread tests separately cover concurrent opens, competing Save As, open-versus-write, and cancel-versus-acknowledgement. Extracted the unchanged native Stage operation into a directly testable coordinator method and verified reloaded targets cannot replay terminal snapshots or keep stale claims. All 37 native tests pass; focused frontend suites pass.

Automated verification complete: npm test passes 241 tests across 38 files; cargo test passes 37 tests; cargo fmt --check, cargo check and git diff --check pass. npm run tauri build -- --debug --no-bundle passes production TypeScript/Vite build and native debug build, producing src-tauri/target/debug/quick-mark. README reviewed; existing tab/window guidance remains accurate for this scope. Parent acceptance evidence recorded; required predecessors .01/.02/.03 are Done. AC2 and task completion await user integrated native review; no commit or push authorized.

Native review checklist: launch the newly built debug executable after saving work and closing older instances. (1) Open two Markdown files, edit one, then File → Move Tab to New Window; confirm edits/View state survive and opening its path from the other window focuses its owner. Try a missing relative Markdown link and confirm the originating tab remains unchanged. (2) From another dirty tab, File → Save As to that owned path must reject without losing either document. (3) With two dirty tabs in one window, File → Close Window, Save the first and Cancel the second; both tabs/window remain, the first is saved and the second dirty. (4) Settings → Clear Recent Files… clears File → Recent Files in both windows; close/reopen the app without opening additional files, confirm history stays cleared and old tabs are not restored. Last-tab close/move deliberately leaves a blank tab. Adoption-acknowledgement failure is covered by automated fault injection rather than requiring native failure manipulation. Separate Shift+Tab and main-window geometry regressions remain outside this task.

User completed native review: everything else looks good and explicitly authorized commit and push. User reports improved vertical height and successful resize/close/reopen geometry persistence, but initial horizontal width is about four-fifths of a 57-inch ultrawide and far too wide. No geometry fix is claimed by this task; retain this observation for existing TASK-022.01 investigation (and distinguish detached sizing TASK-014.08).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added multi-session integration coverage and concurrent native coordinator tests for duplicate opens, Save As collisions, transfer cancellation and close cancellation. Fixed failed native open-adoption acknowledgements publishing local tab state before success; failures now preserve the originating tab and release ownership even after a lost acknowledgement.

Verified 241 frontend tests, 37 native tests, Cargo formatting/checks, production frontend/native debug builds and user integrated native review. Updated doc-006 and parent acceptance evidence. Existing geometry and Shift+Tab follow-ups remain separate.
<!-- SECTION:FINAL_SUMMARY:END -->
