---
id: TASK-020
title: Remove terminal blank lines when copying code blocks
status: Done
assignee:
  - Codex
created_date: '2026-09-04 14:49'
updated_date: '2026-09-04 16:07'
labels:
  - bug
  - markdown
  - clipboard
dependencies: []
modified_files:
  - shared/markdown-renderer.js
  - test-files/code-blocks.md
  - tests/markdown-renderer.test.js
priority: high
type: bug
ordinal: 22200
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make copied code safe and predictable when pasted into terminals and other tools. The Copy action for rendered code blocks should end the clipboard text at the last non-blank code line instead of retaining Markdown’s terminal line ending or trailing blank lines, which can trigger multiline-paste warnings or execute a command immediately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Copying a one-line fenced code block places only the command text on the clipboard with no terminal line ending
- [x] #2 All line endings and whitespace-only lines after the final non-blank code line are omitted from copied text
- [x] #3 Leading indentation, internal blank lines, and line breaks between non-blank code lines are preserved exactly
- [x] #4 LF and CRLF code content produce the same normalized clipboard ending
- [x] #5 An empty or whitespace-only code block copies as an empty string
- [x] #6 Automated clipboard tests plus native verification cover terminal-oriented single-line and multiline examples
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a focused clipboard-normalization helper in shared/markdown-renderer.js that returns an empty string for whitespace-only content and removes the final line ending plus any following whitespace-only lines from non-empty content, without normalizing leading indentation, internal blank lines, internal LF/CRLF sequences, or trailing spaces on the final non-blank line.
2. Apply normalization only inside the delegated rendered-code Copy handler so fenced/indented rendering, syntax classes, source-map attributes, and stored Markdown remain unchanged in both the main and reference windows.
3. Expand markdown-renderer clipboard tests to cover one-line terminal commands, multiple trailing blank lines, internal blank lines and indentation, LF/CRLF input, whitespace-only blocks, and clipboard fallback behavior as relevant.
4. Add a terminal-oriented example to test-files/code-blocks.md for native verification, then run the focused test, full frontend suite, production build, and packaged-app manual Copy checks before evaluating the acceptance criteria.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: shared/markdown-renderer.js renders markdown-it token.content unchanged into <code>, and installCodeCopyHandler currently passes code.textContent directly to the Clipboard API. Both the main editor and reference windows install this same shared handler, so clipboard-boundary normalization covers both without changing rendered source fidelity.

Implemented clipboard-boundary normalization without modifying rendered code text. Focused Markdown renderer tests pass (12 tests), full frontend suite passes (164 tests), and the production frontend build passes.

Native verification completed in the packaged desktop app: the user confirmed the one-line dnf example copied without a terminal line ending and the multiline example retained its intended internal formatting.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Normalized code only at the rendered-copy boundary so copied fenced and indented blocks omit their terminal line ending and any following whitespace-only lines. Rendering, stored Markdown source, leading indentation, internal blank lines, internal LF/CRLF sequences, and trailing spaces on the final content line remain unchanged. Whitespace-only blocks copy as an empty string.

Expanded the shared renderer’s clipboard coverage for one-line commands, LF and CRLF endings, multiple terminal blank lines, internal formatting, and empty content, and added a terminal-oriented native fixture. Verification passed with 12 focused renderer tests, 164 total frontend tests, production and packaged debug builds, and user-confirmed native single-line and multiline Copy behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
