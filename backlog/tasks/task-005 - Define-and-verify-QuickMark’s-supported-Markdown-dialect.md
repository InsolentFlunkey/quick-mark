---
id: TASK-005
title: Define and verify QuickMark’s supported Markdown dialect
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:57'
updated_date: '2026-08-29 22:07'
labels:
  - enhancement
  - markdown
dependencies: []
references:
  - 'https://spec.commonmark.org/'
  - 'https://github.github.com/gfm/'
  - 'https://github.com/markdown-it/markdown-it'
priority: high
type: enhancement
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish a precise, user-facing contract for the Markdown syntax QuickMark renders. Reconcile CommonMark behavior, enabled markdown-it extensions, deliberate safety restrictions, and unsupported extension syntax so documentation, examples, rendering, and tests make consistent claims. The current Markdown Examples includes task-list markers that render as literal text, and the application does not presently distinguish core syntax from optional features such as footnotes, definition lists, heading anchors, front matter, math, or diagrams.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A durable capability matrix identifies supported core syntax, enabled extensions, deliberate restrictions, and unsupported optional syntax
- [x] #2 The product documentation names QuickMark’s Markdown dialect without claiming broader CommonMark or GitHub Flavored Markdown compatibility than is actually provided
- [x] #3 The disposition of task-list syntax, raw HTML, footnotes, definition lists, heading anchors, front matter, syntax highlighting, and other identified extensions is explicitly documented
- [x] #4 Markdown Examples demonstrates supported behavior accurately and does not present unsupported syntax as implemented
- [x] #5 Representative automated fixtures verify every syntax category QuickMark publicly claims to support
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a durable, user-facing Markdown dialect section to `README.md` that names the dialect as markdown-it default syntax plus QuickMark’s explicit options, and provides a capability matrix for core syntax, enabled extensions, safety/behavior restrictions, and unsupported optional syntax. Explicitly cover task lists, raw HTML, footnotes, definition lists, heading anchors, front matter, syntax highlighting, math, and diagrams without claiming full CommonMark or GFM compatibility.
2. Revise `src/markdown-examples.md` so every demonstrated construct is supported: replace task-list markers with ordinary nested lists and broaden examples where useful to match the documented contract. Correct stale support annotations in existing test fixtures without changing renderer behavior.
3. Add a focused Markdown dialect fixture representing each publicly claimed supported category and representative unsupported/restricted syntax. Extend renderer tests with semantic DOM assertions for the supported categories and literal/safe behavior assertions for restricted or unsupported categories; update the reference-window test so it no longer requires task-list syntax.
4. Run the focused renderer/reference tests, then the full JavaScript test suite and frontend build. Record verification evidence and any routine plan refinements in TASK-005. Do not change link/image navigation policy tracked by TASK-006 or begin any later task.

Routine clarification after review: add a plain Markdown preface to both dialect fixtures explaining that they are automated renderer contract data describing current behavior, not user-facing examples or permanent product-roadmap decisions. Re-run the focused dialect/reference tests and full test suite, then return TASK-005 to Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research (2026-08-29): `shared/markdown-renderer.js` constructs markdown-it with the default preset and options `html: false`, `linkify: true`, `typographer: true`, and `breaks: false`; no Markdown plugins or syntax-highlighting callback are installed. The renderer additionally restricts link schemes to HTTP(S), mailto, anchors, relative paths, and unschemed targets; adds safe external-link attributes; and wraps fenced/indented code with copy controls.

Empirical rendering confirmed tables, strikethrough, bare-URL linkification, and typographic substitutions are active. Task markers render as literal `[x]`/`[ ]` text. Raw HTML is escaped. Footnotes, definition lists, explicit heading anchors, front matter, and math are not interpreted as those features. Diagram fences remain escaped code, and language info produces a `language-*` class without colored syntax highlighting.

Documentation audit: `README.md` currently says “CommonMark-style Markdown” but provides no precise dialect contract. `src/markdown-examples.md` incorrectly presents task-list markers among supported examples. `test-files/kitchen-sink.md` contains stale claims that tables and strikethrough are unsupported. Existing renderer tests cover safety, link handling, code wrappers, tables, and smoke rendering, but not a representative public capability contract.

Implementation completed as planned: added the README capability matrix, corrected Markdown Examples and stale kitchen-sink annotations, and added supported/unsupported dialect fixtures with semantic renderer assertions. Parser behavior and TASK-006 link/image policy were not changed.

Verification (2026-08-29): focused `npm test -- --run tests/markdown-renderer.test.js tests/reference-windows.test.ts` passed 16/16 tests. Full `npm test` passed 139/139 tests across 18 files. `npm run build` completed successfully with TypeScript and Vite. `git diff --check` passed. Manual documentation review confirmed the matrix names the markdown-it 15 default-derived dialect, disclaims full CommonMark/GFM compatibility, and explicitly covers every syntax named in the acceptance criteria.

User review identified that the dialect fixtures could be mistaken for product requirements or example documents. The clarification will preserve all parser probes while explicitly distinguishing current behavior from future feature decisions.

Review clarification completed: both dialect fixtures now begin with a plain-text statement that they are automated contract fixtures describing current behavior, not end-user examples or permanent roadmap decisions.

Clarification verification: focused renderer/reference run passed 16/16 tests; full `npm test` passed 139/139 tests. Scoped `git diff --check` passed for every TASK-005 file. The repository-wide whitespace check reports trailing whitespace only in the independently replaced `AGENTS.md`; that user-owned file was left untouched and is outside TASK-005.

Pre-commit cleanup replaced the supported fixture’s two-trailing-space hard break with the equivalent backslash hard-break syntax so staged whitespace checks remain clean. Focused renderer tests passed 11/11 afterward; behavior is unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Defined QuickMark’s user-facing Markdown contract in a durable README capability matrix, separating supported core syntax, enabled markdown-it extensions, deliberate safety restrictions, and unsupported plugin syntax.
- Removed unsupported task-list markers from Markdown Examples, added an accurate bare-URL example, and corrected stale table/strikethrough notes in the kitchen-sink fixture.
- Added focused supported and unsupported dialect fixtures with DOM-level tests covering the documented block, inline, extension, safety, and inert-fallback behavior.
- Kept renderer configuration and the later TASK-006 link/image policy unchanged.

## Verification

- `npm test -- --run tests/markdown-renderer.test.js tests/reference-windows.test.ts` — 16 tests passed.
- `npm test` — 139 tests passed across 18 test files.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.

After review, added explicit prefaces to both dialect fixtures clarifying that they describe current renderer behavior and do not decide the future product roadmap. Re-ran the focused and full suites successfully.
<!-- SECTION:FINAL_SUMMARY:END -->
