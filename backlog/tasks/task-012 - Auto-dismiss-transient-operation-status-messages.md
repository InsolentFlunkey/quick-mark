---
id: TASK-012
title: Auto-dismiss transient operation status messages
status: Done
assignee:
  - Codex
created_date: '2026-09-03 01:17'
updated_date: '2026-09-03 03:12'
labels:
  - bug
dependencies: []
modified_files:
  - index.html
  - src/document-operations.ts
  - src/main.ts
  - src/operation-status.ts
  - src/styles.css
  - src/unsaved-changes.ts
  - tests/operation-status.test.ts
  - tests/operation-status-wiring.test.ts
  - tests/unsaved-changes.test.ts
priority: high
type: bug
ordinal: 21500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent stale success messages from contradicting the current document state. Transient confirmations such as “Saved document.md” should clear after a short, predictable interval and should be superseded immediately when editing or a newer operation changes the state. Errors and prompts that require attention must remain understandable rather than disappearing prematurely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Successful operation confirmations and routine cancellation messages automatically clear after a documented short interval
- [x] #2 Editing immediately removes a stale transient success or routine-cancellation message
- [x] #3 A newer operation message cannot be cleared by an older pending timeout
- [x] #4 Failure messages and actionable warnings remain visible until replaced or explicitly dismissed
- [x] #5 Persistent messages provide a visible keyboard-accessible Dismiss control that removes the message without changing document state
- [x] #6 Automated timing and state-transition tests plus native verification cover save, edit, routine cancellation, replacement, failure/actionable-warning persistence, and explicit dismissal
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the independently testable operation-status controller (`src/operation-status.ts`) to classify successful outcomes and routine cancellations as transient for a documented 4-second interval, while treating failures and explicitly marked actionable warnings as persistent. Preserve timer cancellation and revision guarding so older callbacks cannot clear newer feedback.
2. Add a visible, keyboard-accessible Dismiss control beside the main operation-status region. Let the controller own its visibility and click behavior so persistent messages can always be cleared without affecting document state.
3. Mark the existing save-race cancellation (the document changed while saving) as requiring attention; leave ordinary dialog cancellations transient. Route all main-window reporting through the controller and dismiss only transient feedback when editor input changes the document.
4. Expand fake-timer and wiring tests to cover timed success/cancellation dismissal, edit dismissal, replacement/race safety, persistent failures/actionable warnings, Dismiss behavior, and accessible markup/style wiring.
5. Run focused tests, the full Vitest suite, production build, and rebuilt-debug native verification for save, edit-after-save, routine cancellation, replacement, failure/warning persistence, and explicit dismissal.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: `src/main.ts` currently writes `#operation-status` both through `showOperationOutcome` and several direct initialization/rendered-resource paths. Editor input updates lifecycle/rendering but never clears the previous operation message. Operation outcomes already carry `success`, `canceled`, or `failed`, providing a narrow classification boundary: only `success` will be transient; `failed` and `canceled` remain visible. A controller with cancellation plus a generation/token guard will prevent an older timer from clearing newer feedback. Existing Vitest/jsdom support and fake timers are sufficient for deterministic coverage.

Implementation: added `src/operation-status.ts` with a 4,000 ms transient-success interval, timer cancellation plus revision guarding, and edit-time dismissal limited to the currently displayed success. Routed all `src/main.ts` operation outcomes and initialization/rendered-resource failures through the controller.

Automated verification: focused operation-status tests pass (6/6); full Vitest suite passes (154/154 across 22 files); `npm run build` passes; scoped `git diff --check` passes for TASK-012 files. Repository-wide `git diff --check` is currently blocked only by pre-existing trailing whitespace in the user-owned modified `AGENTS.md`, which was not changed. `npm run tauri build -- --debug` rebuilt `/home/bryan/share/git/quick-mark/src-tauri/target/debug/quick-mark`; after the executable completed, the unrelated RPM bundling phase produced no process/output and its lingering command session was canceled.

Approved scope refinement after native review: persistent messages must not mean undismissable messages. Routine cancellations are transient; failures and actionable warnings remain until a newer outcome replaces them or the user activates a visible accessible Dismiss control.

Refinement implemented: `success` and ordinary `canceled` outcomes are transient for 4 seconds and clear on edit. `failed` outcomes and outcomes explicitly marked `requiresAttention` are persistent. The document-changed-during-save cancellation now carries `requiresAttention: true`. Persistent feedback exposes a visible Dismiss button whose click only clears status presentation.

Refinement verification: focused status/wiring/unsaved-change tests pass (23/23); full Vitest suite passes (155/155 across 22 files); TypeScript/Vite production build passes; `npm run tauri build -- --debug --no-bundle` passes and rebuilds the standalone debug executable; task-scoped diff check passes.

Native verification completed by the user: transient save/cancellation timing, edit-time clearing, persistent failure presentation, and mouse/keyboard Dismiss behavior all worked as expected.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added centralized operation-status lifecycle handling for the main QuickMark window. Successful operations and routine cancellations now clear after four seconds and are removed immediately when editing makes them stale; timer replacement is race-safe. Failures and explicitly actionable warnings remain visible but now include a keyboard-accessible Dismiss button, while the save-race cancellation is marked as requiring attention. Added deterministic fake-timer, wiring, accessibility, and unsaved-change tests. Verification passed with 155 Vitest tests, TypeScript/Vite production build, Tauri debug build without bundling, scoped whitespace validation, and user-completed native interaction testing.
<!-- SECTION:FINAL_SUMMARY:END -->
