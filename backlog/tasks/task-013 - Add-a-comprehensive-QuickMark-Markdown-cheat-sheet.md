---
id: TASK-013
title: Add a comprehensive QuickMark Markdown cheat sheet
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-03 01:18'
updated_date: '2026-09-06 01:42'
labels:
  - enhancement
  - markdown
  - documentation
dependencies:
  - TASK-005
  - TASK-006
  - TASK-020
references:
  - 'https://www.markdownguide.org/cheat-sheet/'
  - 'https://www.markdownguide.org/about/'
modified_files:
  - README.md
  - src/markdown-cheat-sheet.md
  - src/cheat-sheet-renderer.ts
  - src/application-menu.ts
  - src/main.ts
  - src/reference-window-services.ts
  - src/reference.ts
  - src/reference.css
  - src-tauri/capabilities/default.json
  - src-tauri/capabilities/desktop.json
  - src-tauri/capabilities/rendered-content.json
  - tests/markdown-cheat-sheet.test.js
  - tests/cheat-sheet-renderer.test.ts
  - tests/cheat-sheet-window.test.ts
  - tests/reference-windows.test.ts
  - tests/rendered-resources-wiring.test.ts
priority: medium
type: enhancement
ordinal: 22500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the expectation that Markdown Examples serves as complete instruction with a dedicated, user-facing cheat sheet tailored to QuickMark’s documented Markdown dialect. It should teach nearly every currently supported formatting form, clearly identify syntax that is currently unsupported or restricted, include local and web links, images, and mailto examples, and make example source easy to copy into the editor. Describing syntax as currently unsupported documents present behavior and does not establish a permanent product exclusion. A reputable external guide may be adapted only when its license, attribution requirements, and syntax claims are compatible with QuickMark.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QuickMark exposes a dedicated Markdown cheat sheet from an appropriate Help control without replacing or damaging the active document
- [x] #2 The cheat sheet demonstrates nearly every syntax category QuickMark publicly supports and clearly distinguishes currently unsupported syntax from deliberate safety restrictions without implying that unsupported syntax is permanently excluded
- [x] #3 Link coverage includes HTTP and HTTPS, mailto, relative Markdown documents, local images, remote images, and the saved-document context required for relative resources
- [x] #4 Every copyable source example provides the same accessible Copy interaction and feedback used by rendered application code blocks
- [x] #5 Any externally sourced or adapted content has verified compatible licensing, required attribution, and a recorded source; otherwise the content is original
- [x] #6 Automated coverage verifies availability, dialect consistency, copy controls, and non-destructive Help-window behavior
- [x] #7 Each copyable syntax example is paired with its actual QuickMark-rendered result, including current unsupported-syntax behavior; resource-dependent examples explain their local-file or network requirements.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a stable cheat-sheet reference kind and Help → Markdown Cheat Sheet action. Reuse the existing reference.html window, open-or-focus lifecycle, read-only presentation, native reference menu and code-copy feedback. Keep README and editable Markdown Examples available and the main document untouched.
2. Author original src/markdown-cheat-sheet.md content against README's dialect contract and the actual shared renderer. Cover core block/inline syntax, extensions, links/images and saved-folder requirements with fenced copyable source examples; distinguish currently unsupported optional syntax from safety restrictions. Do not adapt external content, introduce Markdown plugins, or change the dialect.
3. Extend only the named reference-window capabilities needed by the new window, and update README Help documentation. Preserve ordinary document and reference-window behavior.
4. Add tests that render the cheat sheet with QuickMark's renderer, validate example syntax and unsupported/restricted behavior, exercise code copying, and mock open-or-focus behavior. Update existing reference-window wiring checks for the new kind.
5. Run focused and full frontend tests, production build, and native debug build; obtain native Help-window and clipboard verification before finalization. Record results, mark Done only after acceptance verification, and ask for commit approval. Do not begin later tasks.

User review requested source-and-result examples, and explicitly approved this revision. Add a cheat-sheet-only rendering helper that renders the original guide with the shared renderer, then renders each top-level fenced source example into a labeled result panel. Preserve source Copy controls, reuse rendered-resource handling, label local/network-dependent examples, and test actual paired DOM results. Keep README/Examples rendering unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research: clean worktree at task start. Dependencies TASK-005, TASK-006 and TASK-020 were verified Done before starting. reference-window-services.ts uses stable readme/examples labels and reference.html; reference.ts has a per-window DocumentLifecycle and refuses relative links that would replace the active document. README is preview-only; Examples alone enables editing/save/reset. Shared renderer supplies copy controls and reference.ts already supplies transient accessible copy feedback. New cheat-sheet kind can reuse this system without an additional renderer or document-opening path. All content will be original, so no external source adaptation or licensing dependency is introduced.

Implemented Help → Markdown Cheat Sheet with a stable cheat-sheet window label, bundled original Markdown content, preview-only reference presentation, shared Copy feedback, and existing open-or-focus behavior. Added the new label to existing reference capabilities without expanding URL schemes. README now documents the guide. No external guide text was copied or adapted: source is original and checked against the repository dialect contract and renderer behavior.

Verification: full frontend suite passes 196/196 across 30 files; production build and diff whitespace check pass. New tests exercise every copyable source example, supported syntax rendering, current unsupported syntax and HTML restrictions, named-window creation/focus, and reference wiring. Initial failures were test-maintenance issues: the capability window list needed its new label, and the new example extraction needed Markdown tokens rather than splitting on headings inside fences. Copy feedback assertions now await the asynchronous completion state. Native debug build is running; native interactive review remains outstanding.

Native debug build without bundling passed; binary is src-tauri/target/debug/quick-mark. Final diff whitespace check passed. Awaiting user native review because this session has no desktop interaction tool: open Help → Markdown Cheat Sheet with unsaved main-document edits; verify separate read-only window and repeat-open focus behavior; copy ordinary and nested-fence examples with visible feedback and paste into the main editor; close the guide without document changes; confirm README/Examples remain available. TASK-013 stays In Progress, with no commit or later-task work.

Source-and-result revision implemented: src/cheat-sheet-renderer.ts pairs each original guide code block with a labeled result produced by the same shared renderer. Original source remains copyable; result code blocks retain normal Copy controls and are not recursively expanded. Named result regions and visually separated panels make comparisons clear. reference.ts invokes this helper only for cheat-sheet; the normal resource controller handles result links/images. Guide text explains local-folder requirements and network-dependent illustrative images.

Revision verification: 197/197 tests pass across 31 files, production build and native debug build pass, and git diff --check passes. New test compares every result panel against the actual renderer output and checks tables, emphasis, nested code, literal unsupported syntax, image output, source preservation, and labels. Updated native review remains required for the revised presentation. No commit or later task started.

User accepted the revised source-and-result presentation and explicitly authorized committing, pushing, and moving to the next task. Native review is user-performed. Potential future editorial changes are deferred; no additional scope added.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Help → Markdown Cheat Sheet as a separate read-only, open-or-focus reference window that preserves the active document. Original QuickMark-specific content pairs copyable source with actual rendered results, covers supported syntax and resource requirements, and distinguishes current optional limitations from safety restrictions. Shared Copy controls and accessible feedback remain in use. Verified with 197 passing tests, production and native debug builds, diff checks, and user acceptance of the revised native presentation.
<!-- SECTION:FINAL_SUMMARY:END -->
