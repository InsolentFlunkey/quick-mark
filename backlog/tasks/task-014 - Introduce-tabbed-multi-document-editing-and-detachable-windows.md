---
id: TASK-014
title: Introduce tabbed multi-document editing and detachable windows
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-03 01:18'
updated_date: '2026-09-06 21:54'
labels:
  - feature
  - initiative
  - documents
dependencies:
  - TASK-007
documentation:
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
priority: high
type: feature
ordinal: 22750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve QuickMark from a single-document editor into a multi-document workspace. Users should be able to keep multiple documents open as tabs and move a tab into a separate native window without losing document identity, edit state, view state, or safety protections. Relative Markdown document links should open in a new tab by default, focusing an already-open tab for the same document instead of creating a duplicate; this tab-based navigation model avoids requiring browser-style Back and Forward controls. This is an initiative-level parent task: define and approve an implementation decomposition before beginning its child work, with sequencing that establishes the per-document and per-window ownership model before later navigation, filesystem monitoring, themes, completion, and lint-result features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An approved durable architecture defines ownership of document lifecycle, dirty state, filesystem path, view preferences, rendered resources, linked-document navigation, and native menus across tabs and windows
- [x] #2 The initiative is decomposed into independently implementable and verifiable child tasks before implementation begins
- [x] #3 Users can open and work with multiple documents as clearly identified tabs
- [x] #4 Opening a relative Markdown document link creates and focuses a new tab by default, or focuses the existing tab when that same document is already open
- [x] #5 A linked document that cannot be opened reports the failure without creating an empty or misleading tab or changing the active document
- [x] #6 Users can move a tab to a new native window without losing content, identity, dirty state, selection, or relevant view state
- [x] #7 New, Open, Save, Save As, Close, recent files, linked-document navigation, and unsaved-change protection behave predictably for the targeted tab and window
- [x] #8 Automated state and integration tests plus native cross-window verification cover creation, switching, linked-document opening and deduplication, detaching, closing, restoration boundaries, and failure cases
- [x] #9 User documentation explains the tab and window model, linked-document behavior, and persistence limitations
- [x] #10 All required child tasks are completed and verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Planning checkpoint — proposed decomposition, pending user approval; do not create children or implement until approved.

1. Document/workspace ownership foundation: introduce stable document IDs and a workspace model separate from DOM controllers; retain one DocumentLifecycle per document. Define explicit snapshot import/export preserving lastSavedContent, capabilities and generation safety. Bind asynchronous operations to document IDs, not whichever tab is active when completion arrives. Establish a native registry for canonical path identity and owning window, plus serializable transfer contracts. Verify state switching, save completion targeting, identity reservations, and snapshot round trips before tabs consume the model.
2. Single-window tabbed editing and navigation: add accessible tabs with filename, dirty marker, full-path disambiguation, close controls and keyboard navigation. New opens a new untitled tab; Open/Recent/relative links open or focus the existing document. Commit a new tab only after a successful read. Preserve per-tab selection, scroll and view state; route Save/Save As/Clear/table insertion/status to the intended document. Separate Close Tab (CmdOrCtrl+W) from Close Window; protect dirty tabs, including cancellation during window close. Include documentation and native checks for this milestone.
3. Multiple native editor windows and safe detaching: add Move Tab to New Window and acknowledged transfer of content, identity, saved baseline, capabilities, selection, scroll and view state. Freeze mutations while transferring; do not remove the source tab until the target acknowledges adoption. Roll back on failed creation/transfer. Route duplicate opens to the owning window/tab and native launch/drop requests to one intended editor. Synchronize app-wide Recent Files and Settings clearing; preserve focus-aware menu behavior and named-window capabilities. Verify source/target close and in-flight operation boundaries. Do not promise crash recovery or restored unsaved sessions.
4. Integrated safety and release verification: complete race/failure coverage across save-as identity collisions, simultaneous opens, transfer failures, targeted close cancellation and window lifecycle; run frontend/native checks and user cross-window review. Finish user documentation for commands, linked-document behavior and restoration limits. Mark the parent Done only when all approved children are verified.

Proposed ownership and product decisions for review: one live owner per canonical document path across editor windows; each tab owns lifecycle and transient view/selection/scroll state, each window owns native menus and rendered-resource/controller instances. Persist existing view preferences as defaults for new tabs, not a live override of every tab. Keep existing window geometry/preferences/recent-history persistence, but no automatic tab or unsaved-content restoration in this initiative. Closing the last tab keeps one blank tab in that window; Close Window is explicit. Help windows remain independent reference surfaces. Exact cross-window registry/acknowledgement protocol must be documented and verified in the foundation child before dependent implementation.

Decomposition approved by the user. Created sequential children TASK-014.01 (ownership foundation) → TASK-014.02 (tabs/navigation) → TASK-014.03 (detaching/coordination) → TASK-014.04 (integrated verification). Owner for the active foundation is @Codex; remaining children are unassigned until execution.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-013 was finalized and pushed to origin/main as fc75ea2 before starting this initiative. TASK-007 dependency is Done. No pending topics in user-notes.md. User explicitly authorized moving to the next task; TASK-014 is the next board item and is assigned @Codex/In Progress.

Current-system research: src/main.ts captures a single DocumentLifecycle in file, unsaved-change, rendered-resource, status and menu callbacks; runDocumentOperation updates recents from that singleton after asynchronous completion. DocumentLifecycle already preserves dirty baselines and rejects save results from an earlier document generation, but has no stable document ID or transfer import/export. View preferences are localStorage values shared across webviews. Native single-instance handling focuses 'main' and broadcasts OPEN_FILE_EVENT, so adding multiple editors without changing routing could open the same file in several windows. Reference windows already demonstrate native window creation/focus and per-window menus, but are not document owners.

The parent explicitly requires approved decomposition before child implementation. Proposed four sequential milestones and ownership/product choices are recorded for review. No TASK-014 code or child tasks created yet; later tasks remain untouched.

TASK-014.01 foundation is Done with documented architecture and verified domain primitives. TASK-014.02/03/04 remain To Do. Parent remains In Progress until all integrated tab/window acceptance criteria are met. No commits created in this turn.

TASK-014.02 is Done after user native review, including requested blank-tab reuse and unified tab styling. TASK-014.03 is the next logical child and remains To Do; no detaching implementation has started. User requested commit/push and a new-chat handoff.

User authorized six follow-up records after accepting TASK-014.03's native behavior. TASK-014.05 through TASK-014.08 track optional later enhancements (reorder, context menu, move into existing windows, detached sizing), with dependency on TASK-014.04. They are attached here per Backlog's follow-up hierarchy rule but do not expand the original required four-child delivery scope or block that scope's completion. Independently reported regressions are TASK-002.03.01 and TASK-022.01. No follow-up implementation is authorized.

TASK-014.04 integrated acceptance evidence (original required children .01-.04 only; optional .05-.08 do not expand this delivery):
- AC1 ownership architecture: doc-006 records stable identity, lifecycle/view ownership, canonical claims, native menus, caller-bound transfer and shared preferences. TASK-014.01 is Done.
- AC2 decomposition: approved four-child sequence and contracts remain recorded in this parent and its required children.
- AC3 tabs: TASK-014.02 user native acceptance; tab-session, document-tabs and tab-editor-integration tests exercise creation, retained editors, switching and blank reuse.
- AC4 relative navigation/deduplication: native relative-link tests, rendered-resource tests, tab-session and cross-window/integrated-workspace tests cover opening or focusing canonical owners.
- AC5 failed opens: failed read tests plus TASK-014.04 native-adoption rollback regression tests verify existing blank/edited tabs remain and provisional claims release.
- AC6 detach preservation: cross-window-session and detached-editor-integration DOM tests plus native transfer ownership tests; TASK-014.03 user native acceptance.
- AC7 targeted actions/protection: tab-session and integrated-workspace tests cover Save As collisions, originating tabs, Save-then-Cancel window close, retained claims, destination saves and shared Settings/menu tests.
- AC8 integrated verification: 241 frontend and 37 native tests pass, including actual concurrent native lock operations. Current TASK-014.04 native build/review is pending; do not consider this criterion complete yet.
- AC9 user guidance: README Document tabs/Keyboard navigation/resource-link sections explain commands, shared history, blank-last-tab behavior, no session restoration and no transferred Undo history. doc-006 updated to match the audited open-adoption ordering.
- AC10 required children: .01/.02/.03 confirmed Done; .04 remains In Progress pending final native integrated review.
Separate reported regressions remain TASK-002.03.01 and TASK-022.01; no attribution or fixes for those are claimed by this evidence.

TASK-014.04 native debug build and user integrated review passed; user authorized commit/push. Original approved required children .01-.04 are now Done, completing the original delivery scope. Optional .05-.08 remain explicitly deferred follow-ups as previously agreed. User reports successful main-window geometry persistence on this review but excessive initial width on a 57-inch ultrawide; separate geometry investigation remains relevant.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the approved four-stage tabbed editing and detachable-window initiative: durable document ownership, independent tabs and linked navigation, acknowledged cross-window transfers, shared recent history and integrated safety verification. Documentation covers blank-last-tab behavior and the absence of automatic tab/unsaved-session restoration.

Required children TASK-014.01 through TASK-014.04 are verified Done, including user native reviews and final 241 frontend/37 native tests plus builds/checks. Optional TASK-014.05 through .08 remain later enhancements, outside this completed original scope; separately tracked Shift+Tab and geometry issues remain open.
<!-- SECTION:FINAL_SUMMARY:END -->
