---
id: TASK-002.02
title: Modularize Markdown rendering and presentation
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:44'
updated_date: '2026-08-28 05:46'
labels:
  - enhancement
dependencies:
  - TASK-002.01
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move QuickMark's reusable Markdown rendering, safe-link handling, code-block copy behavior, and presentation styles out of the legacy single HTML file so the desktop application can consume them without duplicating behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Markdown rendering is provided by a reusable module rather than inline page code
- [x] #2 Unsafe HTML and unsupported link schemes remain blocked
- [x] #3 Fenced and indented code blocks retain working copy controls
- [x] #4 Existing Markdown and print fixtures render without unintended regressions
- [x] #5 Automated tests cover the renderer's security-sensitive and customized behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add markdown-it as an application dependency and Vitest/jsdom as the renderer test environment.
2. Extract Markdown parser configuration, safe-link policy, customized fenced/indented code rendering, and delegated copy-button behavior into one shared browser-compatible module. Keep it dependency-injected so the legacy file:// page can pass its global markdown-it build while the Vite app passes the npm module.
3. Extract viewer, code-block, and print presentation rules into one shared stylesheet consumed by both QuickMark.html and the desktop frontend.
4. Replace the corresponding inline renderer/copy logic and presentation rules in QuickMark.html with references to the shared assets, preserving the legacy browser workflow.
5. Update the desktop foundation to load the shared assets and render a small Markdown preview through the reusable renderer.
6. Add automated fixture-driven tests covering raw HTML escaping, blocked schemes, external-link attributes, fenced and indented code controls, copied raw text, tables, and print stylesheet invariants.
7. Run tests, TypeScript/Vite build, Cargo check, production Tauri build, and a legacy static-server smoke check; record acceptance-criteria evidence before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research decision: use a dependency-injected browser-compatible shared renderer rather than duplicating TypeScript and legacy implementations. This preserves QuickMark.html's file:// compatibility: the legacy page supplies global markdown-it, while the Vite entry supplies the npm markdown-it dependency.

Presentation boundary identified: `.viewer`, `.codeblock`, `.copy-btn`, and their print overrides can move to a shared stylesheet. App shell, editor, toolbar, toast, panel, and view-mode rules remain owned by their respective applications.

Existing fixtures cover XSS schemes, fenced and indented code, tables, general Markdown, and print content. Automated tests will consume these fixtures rather than creating a parallel fixture set.

Implemented one browser-compatible shared renderer module and one shared presentation stylesheet. QuickMark.html now references those assets directly and no longer contains parser construction, customized code rendering, copy delegation, viewer CSS, code-block CSS, or rendered-content print CSS inline.

The desktop frontend imports markdown-it 15 from npm, invokes the same shared renderer, renders a live sample, and installs the same delegated copy handler. Vite copies the shared directory unchanged into the desktop distribution.

Added Vitest 4 and jsdom 30 with eight tests. The suite consumes every existing Markdown/text fixture and specifically verifies XSS escaping, unsupported schemes, external-link attributes, fenced/indented code controls and raw text, delegated clipboard behavior, tables, print content, print CSS, and dual-entry-point wiring.

Runtime verification: the Tauri development process launched successfully and the Vite server returned index.html plus both shared assets. The production Tauri build also completed and produced the optimized Linux executable.

Legacy static-server smoke evidence: QuickMark.html, shared/markdown-renderer.js, and shared/markdown.css each returned HTTP 200 from a temporary localhost server. Relative asset paths in the legacy page and root asset paths in the Vite page were also asserted by the automated suite.

Final verification: `npm test` passed 8/8 tests; `npm run build` passed; Cargo check passed; `npm run tauri build` passed and produced the release executable; `git diff --check` passed. The Tauri dev application launched and remained running until deliberately stopped.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extracted QuickMark's Markdown behavior and rendered-content presentation into shared browser-compatible assets consumed by both the legacy page and Tauri desktop frontend. The renderer owns markdown-it configuration, safe-link validation, external-link protection, customized fenced/indented code markup, and delegated copy behavior. The stylesheet owns viewer, table, code-block, copy-control, and print presentation. QuickMark.html now references those assets instead of carrying duplicate inline implementations, while retaining its file://-compatible dependency flow.

Added markdown-it as a locked desktop dependency plus a Vitest/jsdom fixture suite. Eight tests cover raw HTML escaping, unsupported schemes, external link attributes, hostile fence metadata, fenced and indented code blocks, clipboard behavior, all existing Markdown/text fixtures, tables, print markup/CSS, and shared entry-point wiring. TypeScript/Vite, Cargo check, optimized Tauri build, Tauri development launch, and legacy static asset smoke checks all pass.
<!-- SECTION:FINAL_SUMMARY:END -->
