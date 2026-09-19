---
id: TASK-028
title: Add automatic bracket pairing in the Markdown editor
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-16 01:40'
updated_date: '2026-09-19 02:28'
labels:
  - enhancement
  - editor
dependencies:
  - TASK-031
references:
  - TASK-016
modified_files:
  - src/editor-surface.ts
  - tests/editor-bracket-pairing.test.ts
  - docs/editing.md
  - tests/manual/bracket-pairing.md
priority: medium
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add general automatic pairing for parentheses (), square brackets [] and braces {} while preserving Markdown editing and native input behavior. TASK-016 handles finishing a link when accepting a file; this task covers general typing. Implementation was authorized on 2026-09-18. Linux/WebKitGTK native validation is deferred to child TASK-028.01 and does not block completion of this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Typing an opening parenthesis, square bracket or brace inserts its matching closer in appropriate editing contexts and positions the caret between the pair.
- [x] #2 Typing a matching closer skips an existing automatically inserted closer without duplicating it; backspace between an untouched pair removes the pair predictably.
- [x] #3 Typing an opening delimiter with text selected wraps the selection without losing its contents.
- [x] #4 Escaped delimiters, nested pairs, paste, composition input and read-only/busy editors are handled without corrupting content or interfering with existing Markdown shortcuts and path completion.
- [x] #5 Automated interaction tests, user documentation and native keyboard review cover the supported behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan (updated by the user's 2026-09-18 validation decision):

1. Configure the production CodeMirror editor to pair only parentheses, square brackets, and braces, using the standard closer-skip and paired-backspace behavior.
2. Add focused interaction tests for insertion, selection wrapping, nested pairs, escaped delimiters, closer skipping, paired backspace, paste, composition, read-only/busy state, Markdown commands, and path completion compatibility.
3. Update docs/editing.md to describe the supported bracket behavior.
4. Add and perform the native Windows/WebView2 keyboard review. The user does not use IME, so Windows IME review is not applicable to this validation.
5. Track unavailable Linux/WebKitGTK validation separately in child TASK-028.01 so it does not block TASK-028.
6. Run focused tests, the full frontend suite, and the production/native build; record results and modified files.
7. Mark TASK-028 Done after the corrected Ctrl+Space path-completion behavior passes Windows retesting and all parent acceptance criteria are verified.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented production CodeMirror pairing for only (), [] and {}, including tracked-closer skipping and the standard paired-Backspace keymap. Added a QuickMark input guard so opening delimiters preceded by an odd backslash run are inserted literally; composition and read-only behavior remain governed by CodeMirror's native input state.

Added 11 focused interaction tests covering insertion/caret placement, nested pairs, closer skipping, paired deletion, forward/backward selection wrapping, escaped delimiters, context-sensitive non-pairing, paste, composition, operation locking, Markdown Enter/Tab behavior, and live relative-path completion acceptance.

Automated verification passed: focused bracket suite (11 tests), full frontend suite (59 files / 479 tests), production TypeScript/Vite build, and git diff --check. AC #5 remains open pending the documented native Windows/WebView2 and Linux/WebKitGTK keyboard review.

Fresh native Windows release verification passed with `npm run tauri build`. Outputs: `src-tauri/target/release/quick-mark.exe` and `src-tauri/target/release/bundle/nsis/QuickMark_0.1.0_x64-setup.exe`, both built 2026-09-18 19:31 local time. Human native keyboard validation remains required before AC #5 can be checked.

User native Windows review passed pairing, closer skipping, paired Backspace, selection wrapping, escaping, and paste. The user does not use IME. Ctrl+Space path suggestions failed, so AC #4 was reopened pending retest.

Root cause: the textarea implementation explicitly recognized WebView2 Ctrl+Space as key=' '/code='Space', while the production CodeMirror surface relied only on its generic Ctrl-Space binding. Added the native-compatible mapping and a regression test using the exact WebView2 event shape.

Post-fix automated verification passed: focused bracket/path-completion suite 12/12 and full frontend suite 59 files / 480 tests. A corrected standalone validation executable was built at src-tauri/target/release/quick-mark-task028.exe. The normal quick-mark.exe could not be overwritten because it was open.

Created child TASK-028.01 for deferred Linux/WebKitGTK native validation at the user's request; it does not block TASK-028.

Second Windows retest was reported as failing: Ctrl+Space inside link parentheses produced no visible suggestions. The previous claimed key-event root cause is not confirmed; existing production integration coverage already exercised the same synthetic key/code shape, so native context, document ownership, filesystem results, and actual binary launch must be distinguished before another code change. The prior clickable executable link was also unusable in the user's Windows client because it was rendered with a leading slash; future handoff paths must be plain Windows paths.

Final Windows retest confirmed Ctrl+Space path suggestions work in a saved document. The initial failures were from testing an untitled document, which intentionally has no filesystem base path. All parent acceptance criteria are now satisfied. The QuickMark Classic completion popup has insufficient unselected-row contrast because CodeMirror's default light tooltip background is inheriting the theme's light text; this separate issue was observed but not modified.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 01:56
---
Dependency added at the user's request: complete TASK-031's CodeMirror investigation before implementing this editor feature, so the work uses the approved editor foundation.
---

author: @Codex
created: 2026-09-18 22:38
---
Implementation authorized by the user on 2026-09-18. TASK-031 is complete, so the dependency is satisfied.
---

author: @Codex
created: 2026-09-18 22:41
---
User approved the implementation plan on 2026-09-18.
---

author: @Codex
created: 2026-09-19 01:46
---
Windows validation feedback: all reviewed bracket behaviors passed except Ctrl+Space path suggestions. Linux validation was explicitly deferred to child TASK-028.01 because the user's Linux workstation is unavailable.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Added automatic pairing for parentheses, square brackets and braces to the production CodeMirror editor. Opening delimiters pair in appropriate contexts, tracked closers are skipped, untouched pairs delete together, selected text is wrapped without losing selection direction, and escaped openings remain literal. Pairing respects paste, composition state and operation locks while preserving QuickMark list/indent commands and relative-path completion.

Added focused interaction coverage and user documentation plus a native-review checklist. Restored an explicit WebView2-compatible Ctrl+Space completion mapping and verified path completion in a saved document during Windows review. The user does not use an IME, so Windows IME validation was not applicable.

Verification passed: focused bracket/path-completion suite (12 tests), full frontend suite (59 files / 480 tests), TypeScript/Vite production build, native Tauri release build, git diff --check, and user Windows/WebView2 keyboard review. Linux/WebKitGTK validation is intentionally deferred to child TASK-028.01 and does not block this task.

A separate pre-existing QuickMark Classic completion-popup contrast issue was discovered during validation. It is not changed under TASK-028 and requires user authorization before follow-up work.
<!-- SECTION:FINAL_SUMMARY:END -->
