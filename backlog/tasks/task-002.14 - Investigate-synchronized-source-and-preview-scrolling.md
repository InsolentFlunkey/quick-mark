---
id: TASK-002.14
title: Investigate synchronized source and preview scrolling
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 01:24'
updated_date: '2026-08-29 02:56'
labels:
  - enhancement
dependencies:
  - TASK-002.11
documentation:
  - >-
    backlog/docs/research/doc-004 -
    Synchronized-Markdown-source-and-preview-scrolling-investigation.md
modified_files:
  - >-
    backlog/docs/research/doc-004 -
    Synchronized-Markdown-source-and-preview-scrolling-investigation.md
  - research/scroll-sync-prototype.ts
  - tests/scroll-sync-prototype.test.ts
parent_task_id: TASK-002
priority: low
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research and prototype synchronized scrolling between Markdown source and rendered preview for split view. Simple percentage matching is insufficient when source lines expand or collapse during rendering, so compare mapping strategies and define predictable opt-in behavior before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The investigation compares proportional, block/heading anchor, source-position instrumentation, and hybrid synchronization approaches
- [x] #2 Large documents, headings, lists, tables, code blocks, images, and substantially different source/render heights are evaluated
- [x] #3 User control, scroll-direction ownership, feedback-loop prevention, and behavior while actively editing are specified
- [x] #4 Performance and renderer-maintenance implications are documented
- [x] #5 A recommended implementation approach and independently verifiable follow-up scope are recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build a research-only mapping prototype around markdown-it block-token `map` ranges, producing sanitized source-line anchors without changing QuickMark's production renderer or enabling synchronized scrolling.
2. Create representative synthetic scenarios for long documents, headings, nested lists, tables, fenced code, images with late height changes, wrapped source lines, and sharply different source/preview heights. Compare whole-document proportional, heading/block anchors, full source-position instrumentation, and a hybrid piecewise interpolation model with measurable error/cost tradeoffs.
3. Specify the interaction model: an explicit persisted Sync Scrolling toggle that is available only in Split view; whichever pane receives the latest trusted user scroll temporarily owns direction; programmatic-scroll guards plus animation-frame coalescing prevent feedback; editing/rerendering preserves the source-owned logical position; resize/image changes invalidate measurements.
4. Document implementation/performance consequences for the shared renderer, textarea measurement mirror, preview anchor measurement, resize observation, and both the main and Markdown Examples windows.
5. Record a recommendation and a bounded follow-up implementation scope with acceptance tests, but do not implement production scrolling or create/start a follow-up task without separate approval.
6. Verify prototype results and documentation with automated tests, existing frontend/Rust suites, production build, formatting/Cargo checks, and task-scoped diff validation before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.11 is Done and the worktree is clean. Researching QuickMark's textarea/preview scroll containers, markdown-it token/source-map capabilities, render lifecycle, reference-window reuse, and representative document fixtures before recording the investigation plan.

Initial findings: the editor and preview are independent native scroll containers (`textarea` and `.viewer`); every edit fully rerenders preview HTML. markdown-it 15 provides zero-based `[startLine, endLine]` maps on top-level headings, paragraphs, blockquotes, lists, rules, fences, and tables in current fixtures. Inline tokens lack useful block geometry, and images can change preview heights after render. This supports a block-anchor prototype but rules out relying on headings alone or raw whole-pane percentages.

Completed research prototype and doc-004. The prototype extracts markdown-it block source maps, normalizes measured mapping points, performs binary-search piecewise interpolation, quantifies a 120-pixel proportional error on an uneven layout where anchored mapping is exact, adapts to simulated delayed-image height changes, and validates 5,000 sparse anchors. Recommendation: opt-in hybrid block anchors with a textarea geometry mirror, cached bidirectional interpolation, proportional fallback, latest-user-pane ownership, animation-frame coalescing, and resize/image invalidation. Production integration is intentionally excluded.

Final verification passed: 119/119 frontend/research tests across 15 files, 6/6 Rust tests, TypeScript/Vite production build, `cargo fmt --check`, `cargo check`, and `git diff --check`. This investigation changes no production app behavior; all additions are a research prototype, automated evaluation, durable specification, and completed task metadata.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Compared whole-document proportional, heading/block-anchor, full source-position instrumentation, and hybrid synchronization approaches against QuickMark's actual textarea/markdown-it architecture. Added a research-only token-map/interpolation prototype and tests covering mixed fixtures, headings, lists, tables, fenced code, images/layout changes, uneven pane heights, non-monotonic data, and 5,000 anchors. Recommended an opt-in hybrid using markdown-it block anchors, a textarea geometry mirror, cached bidirectional piecewise interpolation, proportional fallback, latest-user-pane ownership, animation-frame feedback suppression, and resize/image invalidation. Documented performance/maintenance tradeoffs and an independently verifiable eight-part follow-up scope in doc-004; production behavior remains unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
