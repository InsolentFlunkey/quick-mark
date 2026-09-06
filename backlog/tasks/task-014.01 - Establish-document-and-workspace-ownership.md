---
id: TASK-014.01
title: Establish document and workspace ownership
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-06 02:44'
updated_date: '2026-09-06 02:50'
labels:
  - feature
  - documents
dependencies:
  - TASK-007
documentation:
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
modified_files:
  - src/document-lifecycle.ts
  - src/document-workspace.ts
  - src-tauri/src/lib.rs
  - src-tauri/src/document_registry.rs
  - tests/document-workspace.test.ts
  - >-
    backlog/docs/architecture/doc-006 -
    Document-and-window-ownership-for-tabbed-editing.md
parent_task_id: TASK-014
priority: high
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Foundation for TASK-014's approved tab/window model. Define stable document identities, isolated per-document lifecycle and transient view state, safe asynchronous operation targeting, canonical path ownership across windows and transferable state. Preserve current single-document UI while providing verified contracts for later tab and detach integration. One live owner per canonical path; view preferences are defaults for new tabs; no automatic tab/unsaved-session restoration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A durable architecture documents document/window ownership, canonical identity, transfer acknowledgement and failure boundaries, shared preferences, and restoration limits.
- [x] #2 Workspace state preserves independent content, saved baseline, dirty/read-only state, selection, scroll and view state across switching and snapshot round trips.
- [x] #3 Asynchronous results remain bound to their originating document, with closed/replaced document and busy-transfer cases handled safely.
- [x] #4 Native path ownership prevents conflicting owners and supports reservation, release and acknowledged ownership transfer without losing the source on failure.
- [x] #5 Automated frontend/native tests verify these contracts and existing single-document behavior still builds and passes its regression suite.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the approved ownership model and precise handoff contract as a Backlog architecture document. Keep UI/IPC integration for dependent milestones; this foundation supplies independently tested domain primitives.
2. Extend DocumentLifecycle with versioned export/import preserving content, baseline, path and capabilities; imported state gets a fresh generation to reject earlier requests. Add a Workspace model with stable unique IDs, per-document view/selection/scroll snapshots, target-bound async operations and exclusive transfer leases. Prevent close/transfer while an operation is outstanding and prevent stale results from affecting another document.
3. Add a native ownership registry with canonical path keys, exclusive claim/release, and token-based begin/acknowledge/cancel transfer. Document runtime integration requirements and test canonical aliases, conflicting owners, forged/stale tokens and rollback. Keep these primitives internal until the later integration milestone defines caller-bound IPC wrappers.
4. Add focused state/native tests and run existing frontend regression suite, frontend build, cargo tests/format/check and native debug build. Preserve existing single-document UI; report the lack of UI changes as intentional. Finalize only this child before the next child milestone.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research carried forward from active parent: DocumentLifecycle has generation-safe save requests but no import/export; document-operations accepts a concrete lifecycle, enabling target binding without routing through an active-tab global. Native commands currently have no ownership registry. The foundation will provide domain contracts without enabling new windows or changing the current UI; IPC exposure and user-facing integration remain in dependent tasks.

Implemented versioned DocumentLifecycle import/export, target-bound DocumentWorkspace operations, copied per-tab selection/scroll/view state, and transfer leases with explicit acknowledge/cancel. Added public native registry domain primitives for canonical claims and token-checked transfer, without exposing IPC or changing existing UI routing. Detailed integration contracts and boundaries are recorded in doc-006.

Verification so far: 203 frontend tests pass, production build passes, 21 native tests pass, cargo fmt --check and cargo check pass. Tests cover snapshot baseline/read-only preservation, stale saves, async targeting while switching active IDs, blocked close/edit/transfer while busy, rollback, duplicate/invalid imports and canonical ownership/token cases. Native debug build running.

Final verification: native debug build without bundling passed, as did final diff whitespace validation. AC1 is documented in doc-006; AC2/3 are exercised by workspace/lifecycle tests; AC4 by native registry tests; AC5 by 203 frontend tests, 21 native tests, production/native builds and Cargo format/check. This foundation deliberately adds no UI integration, so tab/detach native interaction checks belong to the dependent milestones.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Established the domain foundation for tabs and detachable windows: versioned document state preserves dirty baselines and capabilities, a window-local workspace isolates document/view state and binds asynchronous operations to document IDs, and transfer leases retain source state until acknowledgement. Native registry primitives enforce canonical-path ownership and token-checked transfer/cancellation. Documented ownership, staged adoption, integration requirements and restoration boundaries in doc-006. Existing single-document runtime remains unchanged. Verification passed with 203 frontend tests, 21 native tests, production/native debug builds, Cargo formatting/checks and diff validation.
<!-- SECTION:FINAL_SUMMARY:END -->
