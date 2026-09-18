---
id: TASK-031
title: Investigate CodeMirror as QuickMark's editor foundation
status: To Do
assignee: []
created_date: '2026-09-18 01:55'
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
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evaluate whether QuickMark should replace its native textarea editor with CodeMirror 6 before implementing the planned line-number, Undo/Redo and automatic-bracket-pairing features. The investigation must determine whether CodeMirror can provide a maintainable foundation for VS Code-style inline Markdown lint diagnostics (range highlighting with accessible hover or keyboard details) while preserving QuickMark's existing Markdown editing, multi-document, multi-window, filesystem, path-completion, lint, scrolling and performance behavior. This is an investigation and recommendation task, not authorization to replace the production editor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A written recommendation records whether QuickMark should adopt CodeMirror 6, with evidence covering maintenance status, licensing, offline bundling, bundle-size impact, Tauri/WebView compatibility, accessibility and platform input behavior.
- [ ] #2 An isolated proof of concept validates Markdown editing, caret and selection behavior, read-only operation, keyboard navigation, composition input, per-document state and integration hooks needed by QuickMark without replacing the production editor.
- [ ] #3 The investigation demonstrates or rules out range highlights and accessible hover or keyboard details for lint findings, including findings with line-only locations or missing exact ranges.
- [ ] #4 Existing QuickMark behaviors are mapped to CodeMirror equivalents or migration risks, including indentation and list continuation, path completion, table insertion, synchronized scrolling, lint navigation, tab switching, detached-window transfer and focus handling.
- [ ] #5 Large-document measurements compare the proof of concept with the TASK-008 256 KiB and 1 MiB baseline and record the disposition of rendering, input, scroll, lint-decoration and memory risks.
- [ ] #6 The recommendation defines a reviewable migration sequence and rollback boundary if adoption is recommended, or a maintainable alternative for inline diagnostics and the dependent editor features if rejected.
- [ ] #7 The investigation documents its conclusions and explicitly identifies the resulting implementation implications for TASK-023, TASK-024, TASK-028 and enhanced TASK-011 lint reporting.
<!-- AC:END -->
