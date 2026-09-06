---
id: doc-006
title: Document and window ownership for tabbed editing
type: other
created_date: '2026-09-06 02:49'
updated_date: '2026-09-06 19:57'
tags:
  - documents
  - tabs
  - windows
---
# Document and window ownership

Status: TASK-014 approved architecture. TASK-014.01 provides domain foundations; TASK-014.02 integrates tabs; TASK-014.03 integrates native editor coordination and has passed automated verification and user native review.

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

The TASK-014.03 editor_command IPC derives window identity from its native WebviewWindow argument. A managed Mutex<Coordinator> serializes ownership, writes, transaction transitions and shared history. The registry retains canonical keys for release and transfer; normal Save rejects a destination that resolves differently from the current claim. Native snapshot validation mirrors document/view schema validation, including UTF-16 selection offsets. The target validates again during workspace import.

## Verification and rollout

TASK-014.01 tests isolated document/view state, snapshot round trips, stale saves, async target binding, busy leases, rollback, invalid imports, path aliases, ownership conflicts and stale/incorrect transfer tokens. Existing application tests/builds protect the current single-document UI. TASK-014.02 integrates tabs and targeted actions; TASK-014.03 integrates caller-bound coordination and detach; TASK-014.04 audits combined races, native cross-window behavior and user documentation. Each milestone must satisfy its own tests before its dependent milestone starts.

## TASK-014.03 runtime integration

The frontend creates a UUID transaction token before requesting detachment; the native coordinator generates the destination label. This makes a lost creation reply reconcilable. Source cancellation of an unknown token records a caller-bound tombstone, so a delayed creation request cannot revive a rolled-back transaction. Native file-backed transfer tokens remain internal. Untitled identities use the same transaction states and owner checks.

Targets install close protection, menus and listeners and load shared history before fetching the staged snapshot. Their editor stays locked until acknowledgement commits native ownership. The source queries status every 100 ms; after roughly 15 seconds of pending adoption it requests atomic cancellation. A commit that wins the race always wins over cancellation. IPC errors leave the source frozen while status is retried and a visible message reports the uncertainty. Cancellation disposes the staged target; graceful participant destruction cancels pending transfers. Terminal records retain identity/status for reconciliation but discard content snapshots. Reloading an already-ready editor releases its old claims and starts blank rather than replaying a prior transfer. This is not crash recovery or unsaved-session restoration.

Open reserves before reading into a temporary lifecycle. TASK-014.04 confirms native adoption before publishing that lifecycle into the visible workspace. An adoption failure releases the reservation (even when the reply was lost after commit) and leaves existing tabs untouched. After a successful acknowledgement, local publication immediately follows without further file/dialog operations; focus requests remain queued while the session is busy. A duplicate of an adopted document focuses its owning tab/window; a duplicate of a still-pending read reports that the open must finish before retrying. Failed reads release provisional ownership. Save/Save As run under the same native lock, check destination ownership before writing, retain the original claim on failure and switch claims after success. Close Tab and Clear release their claim; native window destruction releases that window's claims. Examples exports honor these claims as well.

Startup arguments enter a one-time queue for main. Subsequent single-instance launches queue once for a canonical owner or the most recently focused editor; if none exists a new editor is created. Editor polling drains only its queue, and frontend queues defer focus/open handling while a dialog or operation is active. File drops use the receiving webview. No app-wide open-file broadcast remains.

Tauri's menu plugin stores handlers by item ID across the application. Editor item IDs therefore include the window label, while reference IDs include reference kind. Each editor maintains its own menu resources and macOS focus activation. Ephemeral editor labels are excluded from window-state persistence; main and reference geometry behavior remains.

## Shared history persistence (approved)

Recent Files is serialized natively and stored as a bounded JSON list in the application config directory's recent-files.json. On first use only, when that file is absent, the coordinator imports the legacy localStorage list. An existing empty file/list is authoritative, so cleared history cannot be reimported after restart. Add/remove/clear write a temporary file and rename it before committing the in-memory revision; errors preserve the previously published state and are surfaced to the caller.

Editors reconcile history revisions every 300 ms when idle. Older responses cannot replace newer state; menu updates are serialized and an open Settings dialog refreshes its controls. Mutations send add/remove/clear operations, never a stale replacement list. View preferences remain localStorage defaults, refreshed across editors without replacing existing tabs' views. Recent history, preferences and existing main/reference geometry are the only persisted state in this milestone.

Native implementation references checked against installed dependencies and official documentation: [Tauri caller-bound commands](https://v2.tauri.app/develop/calling-rust/) and [WebviewWindowBuilder async creation guidance](https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html). Native creation runs outside the coordinator lock in an async command to avoid synchronous Windows webview creation deadlocks.
