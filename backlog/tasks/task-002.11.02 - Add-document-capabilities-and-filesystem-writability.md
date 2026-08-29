---
id: TASK-002.11.02
title: Add document capabilities and filesystem writability
status: Done
assignee:
  - Codex
created_date: '2026-08-28 23:23'
updated_date: '2026-08-28 23:26'
labels:
  - enhancement
dependencies:
  - TASK-002.12
modified_files:
  - index.html
  - src/application-menu.ts
  - src/document-lifecycle.ts
  - src/document-operations.ts
  - src/main.ts
  - src/styles.css
  - src/tauri-file-services.ts
  - src-tauri/src/lib.rs
  - tests/application-menu.test.ts
  - tests/desktop-parity.test.ts
  - tests/document-lifecycle.test.ts
  - tests/document-operations.test.ts
parent_task_id: TASK-002.11
priority: medium
type: enhancement
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce explicit document capabilities and native filesystem writability checks for the main editor. Read-only files remain editable in memory but cannot be overwritten; Save As and permission re-checking provide safe recovery paths.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Document state explicitly represents editable, Save, Save As, and allowed-view capabilities without conflating them into one read-only boolean
- [x] #2 Opening a filesystem document determines its current writability through the native boundary and displays a compact read-only banner when appropriate
- [x] #3 Read-only files remain editable in memory, disable Save, retain Save As, and remain protected by unsaved-change handling
- [x] #4 The banner provides Re-check and enables Save when the same file becomes writable
- [x] #5 Normal Save re-checks writability immediately before writing and safely transitions to read-only state if permission changed
- [x] #6 Open, Save, Save As, launch, drop, Recent Files, toolbar, menu, title, and visible statuses remain consistent
- [x] #7 Frontend and Rust tests cover writable/read-only transitions, re-checking, permission changes, and failure paths
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the document lifecycle with explicit immutable capabilities (`editable`, `canSave`, `canSaveAs`, `allowedViews`) and transitions for new, writable filesystem, read-only filesystem, bundled, re-checked, and Save As identities. Keep dirty state independent from capability state.
2. Add a validated Rust `document_writable` command that checks the filesystem read-only flag and attempts a non-truncating write-open to account for platform permissions/ACLs without modifying content; expose it through the narrow Tauri file-service adapter.
3. Make Open retrieve content and writability before atomically changing lifecycle identity. Make ordinary Save re-check writability immediately before writing, transition to read-only and report Save As guidance when blocked, while Save As establishes a new writable identity after successful creation.
4. Add a compact accessible read-only banner with Re-check. Synchronize toolbar Save, native File > Save, Save As, document status/title, shortcuts, launch/drop/recent flows, and unsaved-change protection from lifecycle capabilities.
5. Add lifecycle/coordinator/service/Rust/UI-menu tests for writable and read-only opens, permission changes, Re-check, Save rejection without writes, Save As recovery, cancellation/failure preservation, and in-flight generation safety.
6. Run the full frontend and Rust suites, formatting/Cargo checks, production and native builds, a native launch smoke check, and task-scoped diff validation; record acceptance evidence before completion.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Selected as the first implementation stage because dedicated reference windows depend on an explicit, tested capability/save-policy model. Dependency TASK-002.12 is Done. Researching the current lifecycle, Rust file commands, save coordinator, toolbar/menu synchronization, and cross-platform writability semantics before recording the implementation plan.

Writability design decision: do not rely only on `metadata.permissions().readonly()`, which is incomplete for ACLs and other platform rules. The native command will first honor the filesystem read-only flag, then attempt `OpenOptions::write(true).open(path)` without create/truncate/append. Success means the existing file can currently be opened for writing without content modification; permission-denied means read-only; other metadata/open failures are surfaced. Actual writes still report races or later permission changes safely. Capabilities describe allowed operations and views; dirty state continues to describe whether in-memory content differs from its saved baseline.

Implemented explicit immutable document capabilities independent of dirty state. New/writable documents allow Save and Save As; read-only filesystem documents remain editable and allow Save As but disable Save; bundled samples are editable in memory and Save As-only. Added a native `document_writable` command that honors the filesystem read-only flag and uses a non-truncating write-open for effective permission checking. Open resolves content plus writability before changing identity. Ordinary Save re-checks immediately before writing, blocks without invoking write when read-only, and preserves the captured save generation so edits made during permission checks/writes remain dirty. Save As creates a new writable identity. Added a compact banner/Re-check action and synchronized toolbar/native-menu command enablement. Verification passes 96/96 frontend tests, 6/6 Rust tests, TypeScript/Vite build, Cargo check, rustfmt check after formatting, native Tauri debug build, and task-scoped diff validation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explicit document capabilities and cross-platform native filesystem writability checks. Read-only files stay editable in memory while Save is disabled, Save As remains available, a compact banner explains the state, and Re-check can restore Save after permissions change. Open captures writability atomically; ordinary Save re-checks immediately before writing and safely blocks without data loss if permissions changed. Toolbar, native menu, shortcuts, launch/drop/recent flows, visible status, and unsaved-change behavior remain coordinated. Verified with 96 frontend tests, 6 Rust tests, production/native builds, Cargo/rustfmt, and diff checks.
<!-- SECTION:FINAL_SUMMARY:END -->
