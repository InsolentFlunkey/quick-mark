---
id: TASK-009
title: Detect and safely handle external document changes
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:57'
updated_date: '2026-09-07 03:41'
labels:
  - feature
  - data-integrity
dependencies:
  - TASK-014
documentation:
  - >-
    backlog/docs/architecture/doc-007 -
    External-document-revisions-and-recovery.md
modified_files:
  - README.md
  - index.html
  - src-tauri/src/editor_coordinator.rs
  - src-tauri/src/disk_revision.rs
  - src-tauri/src/lib.rs
  - src/editor-coordination.ts
  - src/tauri-editor-services.ts
  - src/tab-session.ts
  - src/main.ts
  - src/styles.css
  - src/external-change.ts
  - tests/external-changes.test.ts
  - tests/external-change-integration.test.ts
  - >-
    backlog/docs/architecture/doc-007 -
    External-document-revisions-and-recovery.md
priority: high
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protect users when an open document is modified, replaced, moved, or deleted by another application. QuickMark should detect relevant filesystem changes and offer understandable choices without silently overwriting external work or discarding unsaved in-memory edits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark detects when the active file is modified, replaced, moved, or deleted outside the application
- [x] #2 External changes do not silently overwrite dirty in-memory edits or get silently overwritten by Save
- [x] #3 The user receives clear choices appropriate to clean and dirty document states, including reloading or preserving their in-memory work
- [x] #4 Save, Save As, read-only re-checking, recent files, and close protection remain coherent after an external change
- [x] #5 Automated state/coordination tests and native filesystem verification cover representative change, deletion, conflict, and recovery scenarios
- [x] #6 User documentation explains external-change handling and any platform limitations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan; implementation and automated verification complete, native user review pending.

1. Establish coordinator-owned exact disk revisions through owner-bound reads, distinct from frontend saved-content/dirty baselines. Retain revisions across transfers; compare bytes and filesystem identity/metadata, distinguish missing/read errors, and recheck writability.
2. Add owner-bound inspect/prepare/reload commands. Read outside the global mutex and revalidate source ownership/baseline on return. Bind overwrite/reload approval to the observed path/revision. Use the frontend saved-content expectation to reject stale state after a lost reload reply.
3. Poll open file-backed tabs roughly once per second while idle, on focus/selection and before Save/close/clear. Do not lock editing for background scans; discard stale responses using a session operation epoch. Display a persistent per-tab notice with Reload from Disk, Keep Editing, Save As and Retry.
4. Implement the approved choices: never auto-reload; confirm replacement of retained content; require explicit conflict overwrite and invalidate stale approval; preserve missing/unreadable copies and offer recovery via Save As. Protect recoverable clean copies on close, retain old claims on canceled/failed saves, and record recovery Save As in shared Recent Files before closing. Preserve other tabs and View state.
5. Stage writes in a temporary sibling, copy standard permissions, sync data, recheck revision and rename. Fail visibly without an in-place-write fallback. Document parent-directory permission requirements, metadata/hard-link limitations, the remaining external compare/rename race and absence of automatic rename following/session restoration in README and doc-007.
6. Verify native filesystem modification/replacement/deletion/move/recovery, stale approval, read-only/invalid text and lost reload replies; exercise real TabSession and real-main DOM behavior, targeting, close recovery, Save As collisions, transfer inheritance and stale polling. Run full frontend/native tests, Cargo checks and production/native debug build.
7. Obtain user native cross-application verification before marking Done, then ask before committing. No other backlog task is started.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started on clean main at 80825de after explicit user instruction; dependency TASK-014 is Done. User notes contain no pending topics. Reviewed doc-006, DocumentLifecycle, document-operations, TabSession, native coordinator/registry, editor IPC, native prompts and idle/focus hooks. Current native Document stores owner/key/ready only; open reads separately through read_document; write serializes internal claims then std::fs::write without any expected disk revision. Frontend lastSavedContent is an in-memory dirty baseline, not an external disk revision. Missing paths can still canonicalize when their parent exists. Window idle polling currently serves launch/history only. No filesystem watcher dependency is present. No code changed; recorded concrete proposed plan for proportional user review because reload/overwrite/missing-file close choices materially affect data preservation. Geometry remains Watch; other tasks untouched.

User approved proposed conflict/recovery behavior. Implementation proceeding within TASK-009. Native revisions will remain coordinator-owned across transfers; disk probes will run outside the global lock with owner/baseline validation on return. Writes will require revision-bound consent when replacing an existing Save As target or resolving an external conflict. Frontend saved-content expectation will additionally guard a lost reload acknowledgement from enabling an overwrite with stale local content.

Implemented native exact-content/metadata revision observations and owner-bound read/reload/inspect/prepare commands. Background reads occur outside the coordinator lock and revalidate source identity/baseline on return; approval tokens use a separate counter from window labels. Existing native transfer tests caught the shared-counter issue before release; fixed by separating counters. Revision-bound writes stage a sibling temporary file, sync its contents, recheck the revision and rename; permissions copied for existing files. Official std::fs::rename documentation reviewed (https://doc.rust-lang.org/std/fs/fn.rename.html). No unconditional overwrite bypass is exposed.

Frontend now retains a persistent per-tab notice, approved explicit reload/overwrite/Save As choices, missing-file recovery, and recovery-aware close protection. Background probes do not set the session busy flag (so typing is not dropped) and use an operation epoch to discard late results. Native saved baselines survive transfer; destination rechecks conflicts. Lost reload replies are guarded by the frontend saved-content expectation, preventing a stale local editor from treating the native reloaded baseline as its own. All preexisting frontend/native tests passed after initial implementation; 8 new session tests and a real-main DOM notice/action test pass, plus 7 native filesystem tests (44 native total).

Final verification on the current files: 258 frontend tests across 40 files passed; all 44 native tests passed; cargo fmt --check, cargo check and git diff --check passed; npm run tauri build -- --debug --no-bundle completed production TypeScript/Vite and native debug build. Earlier process handles were unavailable after a user continuation, so the complete checks were rerun to obtain confirmed current results. No commit or push performed.

AC evidence: #1 native filesystem tests cover modify, same-content replacement, move/delete/reappearance and unavailable files; #2 revision-bound ordinary/approved writes reject external and newer changes, while session tests preserve retained content; #3 real-main DOM test verifies persistent targeted notice, Keep Editing, canceled and approved reload; #4 multi-session/close tests verify Save As collisions, original claim retention, recovery Save As before close and Recent Files recording; native tests retain baseline across transfer and check permissions; #6 README and doc-007 describe commands and limitations. AC5 remains unchecked pending the planned full native QuickMark user review (automated state and native filesystem portions pass).

Manual review using src-tauri/target/debug/quick-mark after saving and closing older instances: (1) Open a disposable .md file in QuickMark and another editor. Save a change in the other editor; QuickMark should show a notice without replacing its content. Keep Editing retains the notice; Reload from Disk with confirmation loads the disk version. (2) Make different edits in both applications. In QuickMark use Save then Cancel: both versions remain. Repeat and choose Overwrite Disk File: disk receives QuickMark content. For a stale-approval check, edit/save externally while the overwrite prompt is open; confirming that older prompt must fail and preserve the newer disk version. (3) Rename/delete a clean open test file externally. File → Close Tab then Cancel must preserve its recovery copy. File → Close Window then Save should offer a Save As path; save to a new path and confirm that copy appears in Recent Files after reopening. (4) With an unresolved conflict, File → Move Tab to New Window must retain edits and show the notice in the destination; Save As to a different path resolves it, while choosing another open tab/window's path is rejected. (5) Change the file to read-only and use Retry/recheck; saving back stays unavailable while Save As remains usable. Restore writability and recheck. Review is Linux-native; other operating systems and custom ACL/xattr preservation are not claimed.

User native review confirms external changes are detected but the notice is covered by editor/preview panels. Root cause: .app-shell has three explicit grid rows for header/tabs/workspace; the new visible banner becomes the third flexible row and workspace moves to an implicit row. Plan: replace the shell's positional row allocation with a column flex layout, keep header/tabs/notice at natural height and let workspace take remaining space. Verify real WebKitGTK geometry with notice shown/hidden and narrow/short windows, then rebuild. Remains within TASK-009; no file-handling changes.

Fixed banner overlap by replacing the shell's positional three-row grid with a column flex layout: header/tabs/notice retain natural height, workspace receives remaining space. Removed the obsolete narrow-screen row override, allowed long notice text to wrap, and excluded the notice from printing. Native WebKitGTK layout probe using actual index.html/styles.css reproduced the original defect at 1200x800 (banner bottom 163.97, workspace top 153.19; buttons not hit-testable). After fix at 1200x800, 800x400 and 500x600, banner and workspace have a 12px gap and every action button is hit-testable; hiding the notice returns its space to the workspace. Narrow Split layout also checked. Probe: /tmp/quickmark-banner-layout.py. Focused external-change DOM integration test, TypeScript/Vite production build, native debug build and diff check all pass. Fresh executable: src-tauri/target/debug/quick-mark. Still awaiting user's remaining native conflict/recovery review before AC5/Done; no commits.

User accepted the corrected native banner ('ok, that looks good') and explicitly requested commit/push and a new-chat handoff. Native review is accepted following the external-change detection and banner correction; automated filesystem/state/DOM coverage and builds are recorded above. All acceptance criteria complete. User's manual test modified test-files/code-blocks.md; preserve and exclude that file from the commit (it includes trailing whitespace). No unrelated work started.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Detect external document changes without silently replacing editor content or overwriting disk changes. Added owner-bound disk revisions, revision-specific overwrite/reload consent, persistent per-tab notices and recovery-aware Save As/close protection. Baselines follow detached documents; stale background results and lost reload replies cannot authorize stale saves. Recovery saves update shared Recent Files before closing.

Writes use checked temporary-file replacement; README and doc-007 document permissions, metadata, polling and concurrent-writer limitations. Corrected the shell layout after native review so the banner and its actions remain above the panes.

Verification: 258 frontend tests, 44 native tests, Cargo formatting/checks, production/native debug builds, focused DOM retest and native WebKitGTK geometry checks at three window sizes. User native review accepted. User's test-files/code-blocks.md changes are excluded.
<!-- SECTION:FINAL_SUMMARY:END -->
