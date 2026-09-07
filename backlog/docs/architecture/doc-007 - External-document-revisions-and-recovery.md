---
id: doc-007
title: External document revisions and recovery
type: other
created_date: '2026-09-07 00:56'
updated_date: '2026-09-07 03:41'
tags:
  - documents
  - filesystem
  - data-integrity
---
# External document revisions and recovery

Status: TASK-009 completed after automated verification and user native review, including the corrected external-change banner layout. Extends doc-006 ownership contracts; no session restoration or automatic rename following.

## Separate disk and editor baselines

DocumentLifecycle.lastSavedContent continues to define editor dirty state. The native coordinator additionally retains the disk revision obtained by an owner-bound initial read or approved reload, or after a successful write. A revision contains exact bytes and metadata (Unix device/inode/modification/change times; portable creation/modification/length metadata elsewhere). Missing is a distinct revision; unreadable/non-regular paths are errors. Before/after metadata checks reject reads observed changing during the read. Content comparison is required; timestamps alone are insufficient. Native baseline follows document identity when transfer acknowledgement changes its owner.

The frontend also sends its lastSavedContent expectation for inspection and ordinary Save. This matters when a reload reply is lost after the native baseline advances: stale editor content is still a conflict, never silently authorized against the new native baseline.

## Observation and approval

Owner-bound Disk commands support read, inspect, prepare and reload. The native coordinator captures owner/key/baseline, releases its mutex during disk reads, then revalidates the source before publishing results. The frontend checks all open file-backed tabs roughly once per second while idle, on focus/tab selection, before Save and before close/clear decisions. Polling is serialized per window but does not make the session busy or drop typing. An operation epoch prevents a late inspection from replacing state after Save As, close or detach.

Inspect and Save As prepare retain separate, bounded approval slots per document and return opaque numeric revision tokens. A token binds the caller, destination path and observed disk revision. Normal Save compares the original disk baseline and frontend saved-content expectation. Explicit overwrite/reload uses the observed token; a subsequent disk change invalidates it. A successful write/read clears old approvals. This is revision-bound user consent, not an unconditional force flag. Other QuickMark owners remain protected by canonical path reservations.

## User-visible state

A per-tab notice remains visible until reload, successful save/recovery, or a recheck establishes that the baseline is current. It never replaces content automatically. Keep Editing focuses the textarea without resolving the conflict. Reload from Disk requires explicit confirmation before replacing retained content. Conflict Save offers Overwrite Disk File, Save As and Cancel. Existing-target Save As obtains fresh approval; choosing Save As in that prompt returns to the path chooser.

A moved/deleted original is reported as missing; QuickMark does not guess its new location or silently recreate it on ordinary Save. Retry rechecks availability; Save As explicitly chooses a recovery path. Read errors preserve editor content, and writability is rechecked. If the original cannot be saved, selecting Save in close protection opens Save As. Close/Clear protection includes unresolved external state even if editor content equals lastSavedContent, since the retained clean copy may no longer exist on disk. Explicit Discard remains available. Recent Files is not automatically pruned by monitoring; successful Save As records its new path. Reload refreshes rendered resources while preserving/clamping selection and keeping tab View settings.

## Write strategy and limits

Writes reserve the destination, stage a create-new temporary sibling, copy existing standard permissions, write and sync the staged contents, compare the disk revision again, then rename over the destination. On pre-rename failure the original remains and temporary cleanup is attempted. Old path ownership changes only after success. The temporary sibling keeps rename on the same filesystem. [Rust std::fs::rename](https://doc.rust-lang.org/std/fs/fn.rename.html) documents replacement and platform behavior.

The lock protects QuickMark participants only. Portable filesystems offer no general compare-and-swap against arbitrary other processes: an external write between the last comparison and rename remains possible. This is not crash recovery or a guarantee against a continuously racing writer. Atomic replacement requires parent-directory write permission, creates a new file identity, and does not preserve hard-link relationships, custom ACLs, extended attributes or every platform-specific metadata field. Standard file permissions are copied; unsupported replacement/permission failures surface without an in-place-write fallback. Canonical path remapping to another target is refused rather than silently changing ownership. A fresh Save As to another path is the recovery route.

Polling compares contents of open files and may be more costly on large documents or remote filesystems. It detects state at observation time, not every transient event between scans. Linux native filesystem tests cover modification, same-content replacement, move/delete/reappearance, read-only state, invalid UTF-8, stale approvals, lost reload replies and transfer baselines. Other platforms still require native validation; metadata-only replacement detection depends on the identity information available there.
