---
id: TASK-031
title: Investigate CodeMirror as QuickMark's editor foundation
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-18 01:55'
updated_date: '2026-09-18 14:30'
labels:
  - research
  - editor
  - architecture
  - accessibility
  - performance
dependencies: []
references:
  - TASK-008
  - TASK-011
  - TASK-023
  - TASK-024
  - TASK-028
documentation:
  - research/performance/findings.md
  - research/performance/README.md
  - docs/editing.md
  - docs/linting.md
  - research/codemirror/README.md
  - research/codemirror/findings.md
  - >-
    backlog/docs/research/codemirror/doc-014 -
    CodeMirror-editor-foundation-recommendation.md
modified_files:
  - .gitignore
  - package.json
  - package-lock.json
  - research/codemirror/README.md
  - research/codemirror/findings.md
  - research/codemirror/index.html
  - research/codemirror/index.ts
  - research/codemirror/styles.css
  - research/codemirror/editor.ts
  - research/codemirror/gutter-selection.ts
  - research/codemirror/quickmark-editing.ts
  - research/codemirror/diagnostics.ts
  - research/codemirror/path-completion.ts
  - research/codemirror/native-benchmark.ts
  - research/codemirror/run-native.ps1
  - research/codemirror/vite.config.ts
  - research/codemirror/vite.benchmark.config.ts
  - research/codemirror/tsconfig.json
  - research/codemirror/tauri.conf.json
  - research/codemirror/tauri.benchmark.conf.json
  - research/codemirror/baseline/native-webview2-v4-native.jsonl
  - research/codemirror/baseline/native-webview2-v4-memory.jsonl
  - tests/codemirror-research.test.ts
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evaluate whether QuickMark should replace its native textarea editor with CodeMirror 6 before implementing the planned line-number, Undo/Redo and automatic-bracket-pairing features. The investigation must determine whether CodeMirror can provide a maintainable foundation for VS Code-style inline Markdown lint diagnostics (range highlighting with accessible hover or keyboard details) while preserving QuickMark's existing Markdown editing, multi-document, multi-window, filesystem, path-completion, lint, scrolling and performance behavior. This is an investigation and recommendation task, not authorization to replace the production editor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A written recommendation records whether QuickMark should adopt CodeMirror 6, with evidence covering maintenance status, licensing, offline bundling, bundle-size impact, Tauri/WebView compatibility, accessibility and platform input behavior.
- [x] #2 An isolated proof of concept validates Markdown editing, caret and selection behavior, read-only operation, keyboard navigation, composition input, per-document state and integration hooks needed by QuickMark without replacing the production editor.
- [x] #3 The investigation demonstrates or rules out range highlights and accessible hover or keyboard details for lint findings, including findings with line-only locations or missing exact ranges.
- [x] #4 Existing QuickMark behaviors are mapped to CodeMirror equivalents or migration risks, including indentation and list continuation, path completion, table insertion, synchronized scrolling, lint navigation, tab switching, detached-window transfer and focus handling.
- [x] #5 Large-document measurements compare the proof of concept with the TASK-008 256 KiB and 1 MiB baseline and record the disposition of rendering, input, scroll, lint-decoration and memory risks.
- [x] #6 The recommendation defines a reviewable migration sequence and rollback boundary if adoption is recommended, or a maintainable alternative for inline diagnostics and the dependent editor features if rejected.
- [x] #7 The investigation documents its conclusions and explicitly identifies the resulting implementation implications for TASK-023, TASK-024, TASK-028 and enhanced TASK-011 lint reporting.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved investigation plan:

1. Establish the CodeMirror 6 dependency baseline: exact versions, maintenance evidence, licenses, transitive dependencies, explicit-module bundle impact, offline bundling, and Tauri/WebView compatibility evidence.
2. Build an isolated research proof of concept without replacing the production textarea. Use explicit CodeMirror modules and a small adapter covering text, selection, focus, scrolling, busy locking, transactions, and independent per-document state.
3. Validate QuickMark parity and integration hooks: Markdown editing, caret/selection direction, filesystem-read-only versus busy-lock semantics, keyboard focus exit, composition input, indentation/list continuation, table insertion, async path completion, tab switching, detached-window transfer, and focus restoration.
4. Treat TASK-023 gutter selection as a mandatory adoption gate. Demonstrate click, Shift-click, upward/downward drag, drag autoscroll, blank and wrapped lines, final-line selection, and ordinary editable selection from the line-number gutter.
5. Feed existing QuickMark lint results into CodeMirror diagnostics without adding a second lint scheduler. Demonstrate exact ranges, line-only/missing-range fallbacks, visible range markings, pointer details, and keyboard-accessible diagnostic navigation/details.
6. Reuse TASK-008's 256 KiB and 1 MiB fixtures and measurement discipline. Compare the production editor and proof of concept for initial rendering, single-character input, scrolling, tab switching, lint-decoration updates, memory, integrated Preview cost, and production bundle-size delta.
7. Perform native Windows WebView2 review for keyboard, selection, clipboard, focus, scaling, accessibility, and IME behavior; obtain equivalent WebKitGTK/Linux evidence where feasible or explicitly record the unverified platform risk.
8. Write the adopt/reject recommendation with a reviewable migration sequence and rollback boundary, and document implications for TASK-023, TASK-024, TASK-028, and enhanced TASK-011 inline lint reporting.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented an isolated CodeMirror 6 research app without production imports. Explicit dev-only modules provide per-document state/history, serialized transfer, async path completion, QuickMark-specific list/indent commands, configured bracket pairing, busy locking, line-number whole-line click/Shift-click/drag/autoscroll selection, and exact/line-fallback lint diagnostics.

Native Windows WebView2 benchmark completed on Windows 11/i7-13620H/WebView2 153 at 150% scale. Editor-only edit frame medians were 19.1ms at both 256 KiB and 1 MiB; synchronous medians 1.3ms/1.8ms. Diagnostic updates for 715/2,841 findings were 5.8ms/3.8ms synchronous and about 16.8ms frame. Three retained 1 MiB states switched at 19.2ms median; sampled private memory reached about 317 MiB. These measurements exclude QuickMark Preview and do not claim integrated performance.

Verification passed: isolated TypeScript/Vite build; full frontend suite (55 files, 451 tests); production TypeScript/Vite build; 55 Rust tests; native benchmark build/run. Production assets contain no CodeMirror imports. git diff --check reports only pre-existing trailing whitespace in the user-modified AGENTS.md, which was not touched.

Remaining gates are human native review of gutter pointer/autoscroll/edit behavior, focus, diagnostics, NVDA and IME on Windows, plus equivalent Linux/WebKitGTK evidence. AC #1 and #2 remain open pending that review.

User completed the proof-of-concept review and found the implemented contiguous click, Shift-click, and drag gutter behavior suitable. Ctrl/Cmd-click non-contiguous whole-line selection was recorded as a tentative future behavior in the research findings and TASK-023, explicitly outside current acceptance scope until multi-range edit semantics are decided. Human NVDA/IME and Linux/WebKitGTK review remain pre-production adoption gates, not blockers to concluding this investigation.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 03:30
---
User approved starting TASK-031 on 2026-09-17 after reviewing the investigation plan. Line-number whole-line click/Shift-click/drag selection, including autoscroll and wrapped/final-line behavior, is an explicit proof-of-concept adoption gate.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

Completed the CodeMirror 6 foundation investigation without changing QuickMark's production textarea. Added an isolated, locally bundled proof of concept covering Markdown editing, per-document state and history, versioned detached-state transfer, QuickMark-specific indentation/list behavior, configured bracket pairing, async path completion, busy locking, whole-line gutter click/Shift-click/drag/autoscroll selection, and ranged or line-fallback lint diagnostics with pointer and keyboard access.

The recommendation is to adopt CodeMirror through a staged, reversible EditorAdapter migration. Production adoption remains conditional on native accessibility/composition-input review on Windows and equivalent WebKitGTK/Linux review; the textarea rollback boundary remains available through integrated validation.

Measured the native Windows WebView2 proof at the TASK-008 256 KiB and 1 MiB sizes, retained raw traces, documented editor-only timing and memory results, and kept CodeMirror out of production assets. Mapped implications for TASK-023, TASK-024, TASK-028, and enhanced TASK-011 lint reporting.

Verification passed: isolated research build, full frontend suite (55 files / 451 tests), production build, 55 Rust tests, and native WebView2 benchmark. User manual review accepted the proof's current contiguous gutter behavior. Ctrl/Cmd-click non-contiguous whole-line selection is documented only as a tentative future behavior pending product decisions for multi-range editing.
<!-- SECTION:FINAL_SUMMARY:END -->
