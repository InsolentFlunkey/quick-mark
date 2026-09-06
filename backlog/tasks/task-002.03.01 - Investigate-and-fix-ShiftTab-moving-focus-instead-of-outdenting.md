---
id: TASK-002.03.01
title: Investigate and fix Shift+Tab moving focus instead of outdenting
status: Done
assignee:
  - Codex
created_date: '2026-09-06 18:32'
updated_date: '2026-09-06 22:54'
labels:
  - bug
  - regression
dependencies: []
references:
  - user-notes.md
  - TASK-014.02
  - TASK-014.03
modified_files:
  - shared/editor-behavior.js
  - src/main.ts
  - src/vite-env.d.ts
  - README.md
  - tests/editor-behavior.test.js
  - tests/tab-editor-integration.test.ts
  - tests/detached-editor-integration.test.ts
parent_task_id: TASK-002.03
priority: high
type: bug
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User reports that Shift+Tab while editing a list moves focus to the active tab's close button instead of decreasing indentation. Outdent was an existing verified requirement of TASK-002.03. The introduction point is unknown; the user suspects tab-close controls but does not believe TASK-014.03 introduced it. Reproduce and establish the cause before fixing it. Preserve the intentional Escape-then-Tab/Shift+Tab accessibility escape behavior. This is a separately authorized follow-up, not work to begin during TASK-014.03.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The reported native editor focus/outdent failure is reproduced and its triggering conditions and cause are recorded.
- [x] #2 Ordinary Shift+Tab outdents the current indented line or selected lines without leaving the editor, including list items and tabs created by New/Open or detachment.
- [x] #3 Intentional Escape-then-Tab/Shift+Tab focus navigation and ordinary Tab indentation remain functional.
- [x] #4 Automated editor integration tests and native verification cover the reported case; user-facing keyboard guidance is accurate.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce native Shift+Tab using an isolated GTK/WebKitGTK window loading the actual shared editor handler; capture key/code/modifiers, default prevention, text and focus. Compare with existing synthetic tests and history to establish the trigger, without attributing the issue to tabs prematurely.
2. Add regression tests for the observed event sequence before fixing it. Correct only the keyboard routing/escape behavior required for ordinary Shift+Tab outdent. Preserve Escape-then-Tab/Shift+Tab navigation, ordinary Tab indentation and busy transfer/file-operation protection.
3. Verify real main.ts editor binding in initial/New/Open and detached tabs, current-line and selected-list outdent, unchanged unindented text, and intentional keyboard escape. Update README keyboard guidance if needed.
4. Run focused/full frontend tests, production build and native debug build; repeat the native WebKitGTK reproduction against the fix. Record limitations and obtain the user's native QuickMark review before marking Done. Ask separately before committing this implementation.

Confirmed implementation: share isTabKey across editor behavior and main.ts busy guard; recognize standard key=Tab plus key=Unidentified/code=Tab fallback. Cover Escape, Shift keydown, Shift+Tab sequence (modifier keydown currently disarms escape) and reset the one-shot escape on editor blur. These preserve the existing documented accessibility intent.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after explicit user approval at 10531cb (approved geometry Watch/config changes committed locally). Shared handler is unchanged since 3479d3d TASK-002.03 and checks event.key === Tab. Existing tests synthesize Tab with shiftKey and do not exercise native platform key mapping. No implementation changes before plan. GTK/WebKitGTK 2.52.5 available through Python GI; native display requires escalated access. Geometry remains Watch and unrelated tasks remain untouched.

Native reproduction confirmed with installed WebKitGTK 2.52.5: a GDK ISO_Left_Tab event with Shift produces DOM key=Unidentified, code=Tab, shiftKey=true. Actual shared handler leaves defaultPrevented=false; focus moves from textarea to preceding Close button and text remains '    - item'. This reproduces the reported symptom in a native WebKitGTK harness using production shared code, not yet the full Tauri UI. Existing handler has only recognized key=Tab since TASK-002.03; the tab close control is the focus destination rather than the cause. Existing unit events hide the platform mapping gap.

Added six regression tests before implementation; all six failed against the old handler (native mapping, selected/current lines, unindented text, Escape/Shift sequence and stale escape after blur). Implemented isTabKey with a narrow Unidentified/code=Tab fallback, used by shared behavior and main.ts busy capture guard. Shift keydown now preserves the one-shot Escape permission; blur clears it. README explicitly documents backward focus exit and focus retention on unindented lines.

Verification: all 247 frontend tests across 38 files pass. Real main.ts DOM integration exercises the native event shape in initial, New, Open and detached editors, verifies rendered content and focus, and prevents the fallback from editing during pending adoption. Native WebKitGTK 2.52.5 probe rerun against the fixed shared code: Shift+Tab => key=Unidentified/code=Tab, defaultPrevented=true, focus=editor, text='- item'; Escape then Shift then Shift+Tab => defaultPrevented=false, focus=preceding Close button, text unchanged; ordinary Tab => prevented=true, focus=editor, four spaces inserted. GDK events were delivered to an isolated WebKit window; this verifies native event mapping/focus but does not replace user verification of the full Tauri UI. Probe script is /tmp/quickmark-key-probe.py. git diff --check passes.

Awaiting final native QuickMark user review for AC4; task stays In Progress. Manual checklist: (1) In Markdown Input type an indented list item, press Shift+Tab at its end: remove up to four spaces and keep focus in the editor. Select two indented list lines and repeat: both outdent. (2) Repeat using New, Open and File → Move Tab to New Window; text edits/rendering work in each editor. (3) On an unindented line Shift+Tab keeps focus and text unchanged; Tab still inserts indentation. (4) Escape then Shift+Tab moves to the preceding control without changing text; Escape then Tab moves forward. Click back into Markdown Input and ordinary Shift+Tab outdents again. No geometry changes. Commit approval at task start covered existing Watch metadata, not this implementation; ask before committing after native review.

Production TypeScript/Vite and native debug build pass via npm run tauri build -- --debug --no-bundle. Review executable: src-tauri/target/debug/quick-mark. No Rust source changed, so the native build verifies integration; native behavioral evidence comes from the WebKitGTK keyboard probe above.

User completed native QuickMark review ('OK, looks good!') and explicitly authorized commit and push. All acceptance criteria now verified; geometry remains Watch.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed Linux WebKitGTK Shift+Tab leaving the editor instead of outdenting. The shared handler and busy-state guard now recognize the observed Unidentified key with code Tab, preserving focus and transfer safety. Escape followed by Shift+Tab retains intentional backward focus navigation, and unused escape state clears on blur.

Added six regression tests plus initial/New/Open/detached editor integration coverage and updated README keyboard guidance. Verified 247 frontend tests, production/native debug builds, native WebKitGTK event/focus reproduction and user native QuickMark review.
<!-- SECTION:FINAL_SUMMARY:END -->
