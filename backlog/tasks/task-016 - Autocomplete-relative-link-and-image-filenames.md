---
id: TASK-016
title: Autocomplete relative link and image filenames
status: Done
assignee:
  - Codex
created_date: '2026-09-03 01:18'
updated_date: '2026-09-16 03:50'
labels:
  - feature
  - markdown
  - editor
dependencies:
  - TASK-006
  - TASK-014
documentation:
  - tests/manual/path-completion.md
  - backlog/docs/doc-013 - Relative-path-completion-context-and-safety.md
modified_files:
  - src/path-completion-context.ts
  - src/path-completion.ts
  - src/main.ts
  - src/tauri-file-services.ts
  - src/styles.css
  - src-tauri/src/lib.rs
  - src-tauri/src/path_completions.rs
  - tests/path-completion.test.ts
  - tests/tab-editor-integration.test.ts
  - tests/detached-editor-integration.test.ts
  - tests/external-change-integration.test.ts
  - tests/save-lint-integration.test.ts
  - docs/editing.md
  - tests/manual/path-completion.md
  - backlog/docs/doc-013 - Relative-path-completion-context-and-safety.md
priority: medium
ordinal: 23500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Help users author relative Markdown links and images by suggesting filesystem entries from the active document’s directory while the caret is inside a link destination. The interaction must be keyboard-accessible, preserve ordinary editor behavior outside that context, and use the same path and resource rules as rendered links and images. Implement after the tabbed document model so suggestions always use the correct tab’s filesystem context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Typing inside a relative Markdown link or image destination can display relevant filesystem suggestions from the active document’s directory
- [x] #2 Suggestions distinguish supported document targets, supported local images, and directories while excluding or clearly handling unsupported targets
- [x] #3 Arrow keys navigate suggestions and Tab or Enter accepts the highlighted completion without breaking normal indentation or editing outside the completion context
- [x] #4 Suggestions insert correctly escaped relative paths and support nested directories, spaces, and common cross-platform path cases
- [x] #5 Untitled documents, inaccessible directories, empty results, stale asynchronous results, and filesystem failures remain unobtrusive and safe
- [x] #6 Suggestion context belongs to the active tab and cannot insert results from another tab or detached window
- [x] #7 Automated parser, interaction, concurrency, and path tests plus native verification and user documentation cover the workflow
- [x] #8 Automatic suggestions require an explicit ./ or ../ relative path; Ctrl+Space requests suggestions for a bare filename without showing suggestions for web URLs.
- [x] #9 Accepting a file completes missing link delimiters and moves the caret past the closing parenthesis without duplication; accepting a directory leaves the caret inside for continued browsing.
- [x] #10 An explicit Ctrl+Space chooser remains visible with a clear no-matches message when the current prefix has no supported results, and dynamically recovers when the prefix is widened or changed.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect editor/tab lifecycle and existing native resource resolution. Implement a focused inline Markdown destination parser and safe relative path encoding.
2. Add a bounded native directory-suggestion command reusing supported document/image rules and relative resource validation. Return only relevant files/directories; do not write filesystem content.
3. Add an accessible suggestion controller to main/detached editors, with keyboard and mouse acceptance, cancellation, normal editor behavior outside completion, and stale-request/tab/path protection.
4. Add parser, keyboard, concurrency and Rust path/filter tests; document supported completion syntax and native review steps. Run frontend/Rust checks and rebuild Windows app for native review. Leave native verification pending if live UI tooling is unavailable; ask before committing.

User approved review refinements: automatic suggestions only for explicit ./ or ../ relative destinations; Ctrl+Space explicitly requests bare-filename suggestions. File acceptance inserts missing destination/link delimiters and positions caret after the closing parenthesis without duplicating existing delimiters; directory acceptance continues browsing inside the link. Preserve titles/fragments and existing suffix text. Update tests/docs and rebuild for review.

User approved an empty-state refinement: when an explicit Ctrl+Space lookup has no matches, keep the chooser visible with a document/image-and-folder-specific message. Preserve the explicit typedown session so subsequent typing or deletion can narrow or widen results; automatic ./ or ../ lookups and filesystem errors remain unobtrusive.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented inline-destination parser, URL-safe filename insertion and accessible listbox controller; keyboard capture respects existing editor shortcuts and Escape focus exit. Main/detached editors share controller integration, with disposal on tab close and invalidation on owner/path/text/caret changes. Native directory lookup reuses resource resolution and document/image classification, runs on blocking pool and caps scanning/results. Initial 46 frontend completion tests and all 54 Rust tests passed; added multiline-code cases during final review. Browser initialization again failed with Cannot redefine property: process, so native visual/interaction review will remain pending. Added editing guide and manual checklist.

Full-suite failures were resolved: added the new service to existing main-editor integration mocks and corrected multiline code-span handling across the trailing line boundary. Full suite now passes: 53 files / 402 tests. Added an actual main-editor completion integration check for active path lookup, insertion, preview update, tab retention and popup disposal. All 54 Rust tests passed. Design decisions captured as Backlog doc-013. Native Windows debug rebuild underway; AC7 remains pending native review.

Final Windows debug build succeeded: npm.cmd run tauri -- build --debug --no-bundle -- --locked, including TypeScript and production Vite build. cargo fmt --check and git diff --check pass. Review executable: src-tauri/target/debug/quick-mark.exe. Automated checks complete (402 frontend / 54 Rust tests); AC1, AC3 and AC7 await native visual/keyboard review using tests/manual/path-completion.md because browser tooling cannot initialize. No commit created.

User confirmed initial native implementation works; requested avoiding automatic file suggestions while starting web links and finishing closing parenthesis on file acceptance. Approved both refinements and creation (not implementation) of a separate general bracket-pairing task.

Implemented approved refinements: auto lookup only for ./ and ../; Ctrl+Space starts a destination-scoped explicit session for bare paths, and directory selection continues browsing. File acceptance completes missing closers and moves the caret past the final parenthesis while reusing existing closers and preserving title/fragment/following prose. Added regression cases for partial web URLs, explicit invocation, manual filtering, missing/existing angle/parenthesis delimiters and directory caret behavior. All 53 frontend files / 423 tests pass; git diff --check passes. Native rebuild underway. TASK-028 created To Do for general bracket pairing only; implementation remains unstarted.

Frontend build passes, but native rebuild failed replacing src-tauri/target/debug/quick-mark.exe: Access is denied (os error 5). Likely held by running QuickMark. Did not terminate processes or build an alternate executable. Await user closure of app and retry standard build; existing executable does not yet contain approved refinements. All 423 tests pass.

User closed QuickMark; standard Windows debug rebuild retried and succeeded with approved refinements: npm.cmd run tauri -- build --debug --no-bundle -- --locked. Rebuilt review executable is src-tauri/target/debug/quick-mark.exe (15,370,240 bytes; written 2026-09-15 21:18 local). Scoped git diff --check passes for TASK-016/TASK-028 files. Unrelated user changes appeared in AGENTS.md and ai-docs/ during the build; left untouched and excluded from verification/commit scope. TASK-016 remains In Progress pending user review of web-link suppression, Ctrl+Space, and closing-parenthesis/caret behavior.

User approved the rebuilt web-link suppression, Ctrl+Space, typedown, file acceptance and caret behavior ('works great'), satisfying the remaining original native-review criteria. Implemented requested explicit empty state: document searches show 'No matching document or folder names found.'; image searches use the corresponding image message. The chooser remains open and preserves the manual session so typing/deleting can repopulate options. Automatic empty results and lookup errors still close quietly. Focused tests pass (72), full suite passes (53 files / 425 tests), and the standard Windows debug rebuild succeeds. AC10 awaits user review of the rebuilt executable.

User approved the explicit no-matches state and dynamic recovery ('That's great'). Native review is complete. User explicitly authorized commit and push. TASK-016 is ready for its dedicated commit; TASK-028 task creation will be committed separately. User-owned AGENTS.md and ai-docs/ changes remain outside both commits.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Add active-document-aware relative path completion for inline Markdown links and images. Automatic suggestions require ./ or ../; Ctrl+Space requests bare-path suggestions without interrupting web-link entry. The accessible chooser supports keyboard/mouse selection, directory browsing, typedown filtering, explicit no-match messages that recover as the prefix changes, URL-safe insertion, and automatic closing delimiters/caret placement. Native lookup shares QuickMark's document/image rules, runs off the UI thread, bounds directory work, and rejects stale tab/path/caret results.

Document the workflow and architectural constraints, including TASK-028 for separate general bracket pairing. Validation: 53 frontend test files / 425 tests and all 54 Rust tests pass; TypeScript/Vite, Rust formatting and Windows debug build pass. User approved native behavior across initial implementation, web-link suppression, Ctrl+Space, link completion and no-match recovery.
<!-- SECTION:FINAL_SUMMARY:END -->
