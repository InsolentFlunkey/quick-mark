---
id: doc-006
title: Document and window ownership for tabbed editing
type: other
created_date: '2026-09-06 02:49'
tags:
  - documents
  - tabs
  - windows
---
# Document and window ownership

Status: TASK-014 approved architecture, with domain foundations implemented in TASK-014.01. UI and IPC integration belong to TASK-014.02/03. These primitives do not yet change runtime editor behavior.

## Ownership

A document has a stable UUID independent of filename or tab position. Its DocumentLifecycle owns content, lastSavedContent, file path, display name and capabilities; dirty is derived, never independently restored. A window-local DocumentWorkspace owns ordered document IDs, active ID and per-document selection (including direction), editor/preview scroll coordinates and view preferences. Each native editor window owns its menu, status presentation, DOM renderer, scroll controller and object-URL resources. Switching tabs must dispose/refresh rendered resources rather than transferring blob URLs. Help windows remain separate reference surfaces.

Existing view preferences initialize new tabs. Changing one tab does not retroactively change other tab views. Recent history and Settings remain application-wide and require coordinated updates in the window integration milestone. No tab/session or unsaved-content restoration is added; existing geometry/preferences/history persistence remains. Closing the final visible tab creates a new blank tab in the UI layer; the domain workspace may be empty during transactions.

## Operations and snapshots

Workspace operations capture an entry by ID before awaiting. A per-document exclusive busy lease blocks close, replacement, editing and transfer until the callback settles, while other documents may remain usable. Callbacks must await all child work and may not retain lifecycle references. The UI must reflect this temporary busy state. Failed operations release the lease. Existing lifecycle generation checks reject save results predating an import/replacement. Selection is clamped after content changes.

Version-1 document snapshots preserve content, saved baseline, path, name and save capability. Import validates fields and advances generation rather than trusting a generation supplied by another window. Workspace transfer snapshots add stable identity and copied selection/scroll/view state. Snapshot import is not a security boundary; future IPC must validate sender/recipient, version and payload. DOM nodes, callbacks, object URLs and native menu resources never travel in a snapshot. Native textarea undo history is not represented by these snapshots and is not promised across detach; content, dirty baseline and selection are preserved.

## Path identity and reservations

The native DocumentRegistry is a domain primitive to be held behind a single coordinator lock when integrated. It resolves canonical filesystem paths (including symlink aliases); a new Save As destination uses a canonical existing parent plus filename. Distinct hard links are distinct path identities. Callers must not use lowercase string conversion as a substitute for filesystem identity. Concurrent claim attempts return the existing owner rather than overwriting it.

Reserve before opening/writing. A failed read releases the reservation and creates no tab. Duplicate Open/Recent/link requests focus the registry owner. Save As must reserve the destination before writing; if another document owns it, report/focus the conflict without overwriting. Preserve the old claim until successful write and identity update, then release it. Integration must retain canonical identity keys for the operation and address filesystem identity changes rather than silently remapping claims. Filesystem monitoring remains a later task.

## Detach protocol

1. Refuse detach while a document operation is busy. Acquire the workspace transfer lease, freezing source mutations. Keep the source snapshot/tab intact.
2. For a file-backed document, begin a native transfer against its current owner with a destination window label and monotonic token. Untitled documents use the stable document ID and the same coordinator handshake without a path claim.
3. Create the destination, validate the snapshot and stage it without enabling edits. The destination sends an acknowledgement tied to its native caller window, source identity and token. The registry remains owned by the source until that acknowledgement commits ownership.
4. On acknowledgement, switch registry ownership, enable the target and complete the source workspace lease. Tokens are single-use; wrong recipient/token and stale acknowledgements fail. The integration coordinator must reconcile a lost completion notification by querying committed ownership, never by independently activating both copies.
5. On creation/import failure before commit, cancel the native and workspace leases and destroy the staged destination. Source remains authoritative. Closing either participating window must be coordinated while transfer is pending. No timeout may discard the source without checking whether ownership committed. Crash recovery is outside this initiative; graceful failure handling is required.

The registry module has no IPC commands yet. TASK-014.03 must derive window identity from the actual native caller, not a frontend-supplied label, serialize access, stage target adoption, and implement acknowledgement/reconciliation before exposing detaching. Snapshot and registry primitives alone are not a complete transfer transport.

## Verification and rollout

TASK-014.01 tests isolated document/view state, snapshot round trips, stale saves, async target binding, busy leases, rollback, invalid imports, path aliases, ownership conflicts and stale/incorrect transfer tokens. Existing application tests/builds protect the current single-document UI. TASK-014.02 integrates tabs and targeted actions; TASK-014.03 integrates caller-bound coordination and detach; TASK-014.04 audits combined races, native cross-window behavior and user documentation. Each milestone must satisfy its own tests before its dependent milestone starts.
