---
id: TASK-014.02
title: Add tabbed editing and linked-document navigation
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-06 02:44'
updated_date: '2026-09-06 15:21'
labels:
  - feature
  - documents
dependencies:
  - TASK-014.01
modified_files:
  - README.md
  - index.html
  - src/main.ts
  - src/application-menu.ts
  - src/document-tabs.ts
  - src/tab-session.ts
  - src/document-workspace.ts
  - src/tauri-file-services.ts
  - src/styles.css
  - src/markdown-cheat-sheet.md
  - src-tauri/src/lib.rs
  - tests/tab-session.test.ts
  - tests/document-tabs.test.ts
  - tests/tab-editor-integration.test.ts
  - tests/document-workspace.test.ts
  - tests/application-menu.test.ts
  - tests/desktop-parity.test.ts
  - tests/desktop-protection-wiring.test.ts
  - tests/markdown-renderer.test.js
  - tests/rendered-resources-wiring.test.ts
parent_task_id: TASK-014
priority: high
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use the ownership foundation from the preceding TASK-014 child to expose multiple documents in one editor window. New creates a tab; Open, Recent Files and relative document links open or focus an existing document. Failed opens preserve the active document and create no misleading tab. Preserve per-tab selection, scroll and view state. Close Tab uses CmdOrCtrl+W; Close Window is separate; closing the final tab leaves one blank tab.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Accessible tabs identify documents, dirty state and duplicate filenames and support keyboard switching and closing.
- [x] #2 New/Open/Recent/relative links target or deduplicate tabs; failed opens create no tab and preserve existing work.
- [x] #3 Save/Save As/Clear/table insertion/status and unsaved-change prompts target the intended document, even across asynchronous tab switches.
- [x] #4 Closing dirty tabs/windows supports save/discard/cancel; the last tab leaves a blank tab.
- [x] #5 Tests and native review verify tab actions/navigation and user documentation explains this milestone.
- [x] #6 Successfully opening a document reuses the active unchanged blank untitled tab; failed or canceled opens preserve it, and edited or file-backed tabs are not replaced.
- [x] #7 Each tab appears as one container with its filename and a small distinct close control inside, retaining accessible keyboard actions.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a tested tab-session controller around DocumentWorkspace. Route New/Open/Recent/links through new-tab adoption or canonical-path deduplication. Read into a temporary lifecycle and publish only on success. Serialize file identity changes within the single editor window; capture operation target IDs and retain per-tab outcomes. Expose native path canonicalization for deduplication and Save As collision checks; cross-window registry routing stays in TASK-014.03.
2. Add an accessible tab strip with filename, dirty indicator, full-path tooltips/disambiguation, close buttons, roving focus and keyboard navigation. Retain an editor element per open tab so switching does not overwrite another document's editing surface. Refresh preview resources and scroll synchronization when switching; preserve per-tab selection, scroll and view preferences.
3. Route Save/Save As, read-only recheck, Clear and Table Builder to captured document IDs. New/Open no longer prompt because they preserve existing tabs. Close Tab uses CmdOrCtrl+W; Close Window handles all dirty tabs with save/discard/cancel and leaves tabs intact if any prompt cancels. Closing the final tab creates a blank one.
4. Add behavioral controller/UI tests for switching, async targeting, canonical duplicate opens, failures, Save As collisions, close cancellation and accessibility. Update prior wiring tests and README that assumed document replacement. Run full frontend/native checks and obtain native UI verification before marking Done. Do not begin detaching in this task.

User native review accepted existing behavior but requested two corrections within this task: a successful open replaces the active pristine blank untitled tab, while edited/nonblank/file-backed tabs remain; render each tab as one visual container with a small inset close control rather than two button-styled components. Update tests and documentation accordingly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after approved commits 3f52c3c (milestone records) and a5dacfa (TASK-014.01 foundation). Research: main.ts still captures a singleton lifecycle in open/save/close and rendered-resource callbacks. New/Open replacement prompts must be removed as tabs preserve current work. Native file services expose read/write/writability but no canonical identity command. The existing scroll controller is bound to an editor element and must be rebound on tab switches; preview resources can remain window-owned and refresh. Existing tests explicitly expect replacement prompts and will be updated to the new behavior.

Implemented TabSession around DocumentWorkspace, a canonical-path native command, accessible tab strip with targeted close controls, retained per-tab editor nodes, and preview/controller rebinding. Open/Recent/launch/drop/relative links now preserve existing tabs and deduplicate within the editor window. Save As checks canonical path collisions before writing; saves, clear and close capture document IDs. Close Window checks every dirty tab without removing any on cancellation. Initial and final blank-tab behavior follows the approved policy.

Integration refinement: selection/scroll view snapshots may update while an ordinary document operation is pending; transfer leases still freeze view snapshots. This preserves view state when switching during a pending save without allowing content mutation. The single-window session rejects overlapping file operations and temporarily disables editing; cross-window coordination stays in TASK-014.03.

Validation: full frontend suite passes 214/214 across 35 files; strengthened workspace test also passes after adding busy-view/transfer-view assertions. All 21 native tests, cargo check, cargo fmt --check, production build, native debug build, and git diff --check pass. Initial seven regression failures were obsolete singleton wiring/layout expectations and were updated alongside behavioral tab-session, tab-strip and main-editor integration tests.

Native verification remains required for AC5. Run src-tauri/target/debug/quick-mark: open multiple files, switch tabs and verify selection/scroll/view/Undo behavior; reopen the same file and follow relative links to confirm deduplication/no lost edits; Save/Save As and duplicate-path rejection; Cancel Close Tab/Close Window with dirty tabs; close the last tab to confirm a blank tab remains. TASK-014.03 is not started. Planning and foundation commits 3f52c3c/a5dacfa are local; no push was performed in this turn.

Implemented native-review corrections: successful opens reuse the originating unchanged blank untitled tab and retain its view settings; duplicate opens remove that blank and focus the existing file tab. Canceled/failed opens and nonempty/file-backed tabs remain intact. Origin ID is captured before awaiting the file dialog, so switching tabs cannot replace the wrong tab. Tests cover reuse, duplicate focus, preserved edited/empty-file tabs, and pending-dialog focus changes.

Tab styling now uses one outer tab container with transparent filename control and a small inset close icon. Close remains a separate semantic button for accessibility, without a separate button-like border/background. README updated. Full frontend suite passes 218/218 and diff check passes. Awaiting native review of these two corrections before finalizing TASK-014.02; no commit or detaching work started.

User verified the revised blank-tab reuse and unified tab presentation: 'that looks and works MUCH better'. This completes native review following earlier acceptance of the tab workflow. User explicitly authorized commit and push, then requested a new-chat handoff rather than starting the next child.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added single-window document tabs with independent retained editors, selection/scroll/view state, targeted file actions and close protection. Open/Recent/launch/drop/relative links deduplicate canonical paths and reuse an unchanged blank untitled tab only after a successful open. Save As rejects collisions with another open tab. Close Window preserves tabs on cancellation, and closing the last tab leaves a blank one. Tabs use one visual container with a small accessible close control. Updated README and cheat-sheet navigation guidance. Verification passed with 218 frontend tests, 21 native tests, Cargo checks, production/native builds, diff validation and user native review. Cross-window detaching remains TASK-014.03.
<!-- SECTION:FINAL_SUMMARY:END -->
