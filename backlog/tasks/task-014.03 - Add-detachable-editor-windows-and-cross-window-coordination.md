---
id: TASK-014.03
title: Add detachable editor windows and cross-window coordination
status: Done
assignee:
  - Codex
created_date: '2026-09-06 02:44'
updated_date: '2026-09-06 18:34'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.02
modified_files:
  - README.md
  - src-tauri/capabilities/default.json
  - src-tauri/src/document_registry.rs
  - src-tauri/src/editor_coordinator.rs
  - src-tauri/src/lib.rs
  - src/application-menu.ts
  - src/document-operations.ts
  - src/editor-coordination.ts
  - src/main.ts
  - src/reference-menu.ts
  - src/settings.ts
  - src/tab-session.ts
  - src/tauri-editor-services.ts
  - src/tauri-file-services.ts
  - tests/application-menu.test.ts
  - tests/cross-window-session.test.ts
  - tests/desktop-protection-wiring.test.ts
  - tests/detached-editor-integration.test.ts
  - tests/reference-windows.test.ts
  - tests/settings-menu.test.ts
  - tests/settings.test.ts
  - tests/tab-editor-integration.test.ts
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
parent_task_id: TASK-014
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build on the tabbed workspace and ownership contracts to move a tab into a new native window. Preserve document identity, current and saved content, capabilities, selection, scroll and view. Transfer requires target acknowledgement before source removal and rollback on failure. Duplicate opens focus the owner across windows; launch/drop routes once; Recent Files and Settings clearing synchronize. Help remains independent. Automatic session restoration is excluded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Move Tab to New Window preserves document and view state with exactly one live owner after acknowledgement.
- [x] #2 Failed creation/adoption preserves the source; conflicting saves/closes/edits during transfer cannot lose state.
- [x] #3 Duplicate opens focus the owning tab/window, and native launch/drop routing avoids duplicate document creation.
- [x] #4 Menus, Recent Files and Settings clearing remain correct across editor windows and reference windows retain their behavior.
- [x] #5 Automated failure/integration tests, native cross-window review and documentation cover detaching and persistence limits.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implementation plan approved by the user, including native Recent Files migration. Implementation, automated verification and user native review are complete.

1. Integrate a native editor coordinator behind one lock in src-tauri/src/editor_coordinator.rs and lib.rs. Derive caller labels from native WebviewWindow arguments; register editor windows separately from reference windows. Wrap canonical ownership reservations, release, destination commit and owner lookup/focus. Retain canonical reservation keys rather than re-resolving keys on release/commit. Enforce ownership on writes, including Save As: reserve destination before writing, keep old ownership until success, release provisional ownership on failure. Track pending opens separately from adopted documents so a concurrent duplicate never focuses a nonexistent tab.
2. Integrate coordinator services into TabSession and tauri-file-services.ts. Preserve originating pristine blank reuse only after successful open; preserve failed/canceled opens and edited/file-backed tabs. Route duplicates to the existing document/window, retaining a blank source tab if otherwise empty. Bind all async outcomes and recent-history updates to the actual opened/saved path rather than the currently active tab. Release ownership on Clear, Close Tab and successful native window destruction; canceled Close Window keeps every claim.
3. Implement the doc-006 staged transfer handshake for file-backed and untitled documents. Capture view before acquiring the workspace lease; create a native-generated editor window and retain snapshot/token in native memory. Target bootstraps with mutations disabled, validates and stages the snapshot, then acknowledges with caller-bound identity/token. Commit ownership atomically before enabling target; source removes its frozen tab only on confirmed committed status. Query transaction status to reconcile lost completion events. Creation/adoption failure cancels before source reactivation and disposes the staged target. Coordinate participant closes and bounded readiness failure without treating timeout as proof of rollback. Preserve blank-last-tab behavior. Transfer snapshots remain memory-only.
4. Wire File > Move Tab to New Window, busy/menu state and bootstrap ordering in main.ts/application-menu.ts. Install protection/listeners before registering ready or accepting transfers. Allow named editor windows in capabilities. Route startup arguments once and subsequent launches to one ready editor (focus existing owner when present; otherwise most recently focused editor, creating an editor if only reference windows remain). Native drops remain bound to their receiving editor and use the same reservation path. Preserve reference-window menus and existing geometry behavior; avoid accumulating persisted geometry entries for ephemeral editor labels.
5. Approved shared-history architecture: make the native coordinator the serialized authority for Recent Files add/remove/clear, persist its bounded list to an app-config JSON file, and import existing localStorage history once when no native history exists. Persist successfully before publishing revisioned updates; initialize/reconcile each editor from the current revision so late events cannot undo Clear. Update an already-open Settings dialog and each menu. Keep View preferences as defaults for new tabs, synchronize defaults without overwriting existing tabs' View state. Do not introduce tab or unsaved-session restoration.
6. Add behavior-level native coordinator and frontend integration/failure tests: simultaneous opens and Save As collisions, untitled/file-backed detach state preservation, wrong/stale acknowledgements, creation/import failure, lost notifications, pending closes/edits/saves, source/target readiness, targeted launch/drop routing, shared history clearing and reference menu independence. Retain all approved TASK-014.02 regression coverage. Update doc-006 with final IPC/transaction/persistence decisions and README with detach and undo/session limits.
7. Run full frontend tests and production build; cargo fmt --check, cargo test, cargo check and native debug build; inspect diff. Obtain native cross-window review against a concrete manual checklist before checking AC5 or marking Done. Leave TASK-014.04 and unrelated tasks untouched. Ask before any commit; no push authorization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started on main at a3c463a with clean worktree; TASK-014.02 dependency is Done. Read AGENTS.md, Backlog overview/execution guide, doc-006, parent and both completed children. user-notes.md has no pending topics. npm and cargo are available; no baseline tests rerun during research.

Current implementation findings: DocumentWorkspace has export/adopt and source transfer leases but adopt enables editing immediately. TabSession serializes operations only within one window and stores canonical keys locally. DocumentRegistry is not managed by Tauri or exposed to IPC and re-canonicalizes keys for every operation. read/write commands are not owner-bound. initial_launch_path re-reads process arguments on every call and single-instance launch uses app-wide emit to all listeners while focusing main. main.ts initializes launch/menu/close protection concurrently and maintains cached Recent Files lists; Settings clears only its own storage/menu. Named capabilities currently exclude dynamic editors. Existing menu focus helper and reference windows provide reusable boundaries. No code changed; recorded plan is awaiting review of the proposed shared-history persistence migration.

User approved the proposed native serialized Recent Files persistence migration and explicitly authorized proceeding with implementation.

Implementation progress: native caller-bound coordinator now handles canonical reservations, ready/adopted distinction, owner-checked writes/Save As, staged file-backed and untitled transfer, idempotent acknowledgement/status and cancellation tombstones. Source-generated transaction IDs allow reconciling lost creation replies; atomic cancellation prevents a delayed creation request from reviving a rolled-back transfer. Dynamic editors bootstrap locked and source snapshots remain frozen until native status resolves. Native history migrates existing localStorage once and persists before publishing revisioned state.

Integration findings addressed within AC4: Tauri menu plugin stores callbacks app-wide by menu item ID (confirmed in installed native dependency); IDs now include editor label or reference kind. Examples exports keep their existing write path but reject paths claimed by editors. Window-state plugin filters ephemeral editor labels to avoid unbounded geometry records. Startup paths are queued once; subsequent launches use one editor/owner, and frontend queues focus while busy. Existing 21 native tests plus 9 new coordinator tests pass; first frontend pass exposed stale mocks/wiring assertions being updated. One full-suite run also reported an unexpectedly exited worker; focused new cross-window suite passes 11/11 and full-suite verification will be repeated after mock updates.

Full frontend rerun passed 229/229 with no worker error. Added a further DOM integration check proving a detached destination stays locked until acknowledgement, then restores content/dirty indicator, read-only save capability, selection, scroll and View state. Added native snapshot-schema checks and preserved canonical-wrapper registry APIs alongside stable-key integration methods. Updated doc-006 with the implemented transaction, reload, menu, launch and native history contracts; README now documents detaching, shared history and persistence/Undo limits.

Final automated verification on the current implementation: 233 frontend tests pass across 37 files; 32 native tests pass; cargo fmt --check and cargo check pass; production frontend and native debug build (npm run tauri build -- --debug --no-bundle) pass; git diff --check passes. Final review corrected focus dispatch to explicit emit_to(owner window), since Tauri Emitter::emit broadcasts regardless of receiver, and carries the reserved canonical key into target adoption so alias-backed Save As documents retain local blank-tab/deduplication behavior after detachment. The canonical handoff has a frontend regression test. user-notes.md remains empty. No commits or pushes; TASK-014.04 and unrelated tasks remain untouched.

Automated acceptance evidence: AC1/2 are covered by cross-window-session and detached-editor-integration DOM tests plus native transfer commit/cancel/token tests, including content/baseline/read-only capability/view/selection/scroll, source freezing, failed creation, lost replies, timeout-versus-commit and malformed target state. AC3 has native reservation/launch tests and frontend remote duplicate/collision tests. AC4 has native history migration/clear/persistence-failure tests, editor-specific menu callback tests and live Settings refresh tests. Native interaction review is still needed to confirm full AC1/3/4 behavior and satisfy AC5. Keep In Progress; do not mark Done or write a final completion summary before that review.

Native review checklist (run src-tauri/target/debug/quick-mark after saving work and closing older QuickMark instances):
1. Open a Markdown file, edit it, select text, scroll both panes and choose View settings. Use File > Move Tab to New Window: new window retains content/dirty state/selection/scroll/View, and source removes only that tab. Moving the last tab leaves a blank source tab. Undo history deliberately does not transfer. Repeat with an edited untitled tab.
2. From the original window use File > Open to open the detached file again: focus moves to its existing tab/window without another copy. Drop a different file onto a particular editor: only that editor opens it. Launch the debug executable with an already-open file argument: its owner is focused once.
3. In another edited tab, File > Save As to the detached file's path must report a collision and preserve both documents. Help > Markdown Examples > File > Save As must also reject that owned path; another unused destination should still export successfully.
4. In a dirty detached window, use File > Close Tab and choose Cancel; content remains. Use File > Close Window and Cancel; that window and all its tabs remain. Save/Discard should close only the requested tab/window. Other editor/reference windows remain usable.
5. Open Settings in both editors. Clear Recent Files… in one and confirm: both Settings controls and File > Recent Files show the empty history. Close/restart without opening another file: history remains empty; tabs/unsaved sessions are deliberately not restored.
6. In each editor use File > New and its View menu to verify commands affect that editor. Open Help > README, Markdown Cheat Sheet and Markdown Examples; each reference window's menu/Close action must affect the correct reference window.

User native review accepted this task: 'Everything looks good for this task.' Subsequent clarification confirms the geometry report concerns full main-window stop/relaunch, not detaching. New context-menu, reorder, return-to-existing-window and sizing requests were confirmed as follow-up enhancements. Captured regressions separately without asserting their introduction point. Native acceptance plus the recorded 233 frontend/32 native tests, production/native builds and Cargo checks complete this task. No commit/push permission has been given.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added detachable full editor windows with caller-bound native ownership, acknowledged state transfer, rollback and lost-reply reconciliation. Duplicate opens focus their existing tab/window, Save As enforces ownership across editors and Examples exports, launches route to one editor, and Recent Files/Settings clearing use an approved native persisted history store. Window-specific menu IDs prevent callback collisions. Preserved tab content, saved baseline, capabilities, selection, scroll and View state; documented no session restoration or transferred Undo history. Verification: 233 frontend tests, 32 native tests, Cargo format/check, production/native debug builds, diff validation and user native review passed. Follow-up bugs and optional enhancements are tracked separately; TASK-014.04 has not begun.
<!-- SECTION:FINAL_SUMMARY:END -->
