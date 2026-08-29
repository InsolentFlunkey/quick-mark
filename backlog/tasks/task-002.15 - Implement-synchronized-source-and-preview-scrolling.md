---
id: TASK-002.15
title: Implement synchronized source and preview scrolling
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 03:35'
updated_date: '2026-08-29 03:58'
labels:
  - feature
dependencies:
  - TASK-002.14
documentation:
  - >-
    backlog/docs/research/doc-004 -
    Synchronized-Markdown-source-and-preview-scrolling-investigation.md
modified_files:
  - README.md
  - shared/markdown-renderer.js
  - src/application-menu.ts
  - src/main.ts
  - src/reference-menu.ts
  - src/reference.ts
  - src/scroll-sync.ts
  - src/view-preferences.ts
  - src/vite-env.d.ts
  - tests/application-menu.test.ts
  - tests/markdown-renderer.test.js
  - tests/reference-windows.test.ts
  - tests/scroll-sync.test.ts
  - tests/view-preferences.test.ts
parent_task_id: TASK-002
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Turn the verified TASK-002.14 investigation into a production QuickMark feature. In Split view, keep Markdown source and rendered preview aligned in both directions using the documented hybrid block-anchor design. Synchronization is enabled by default, can be disabled through View, and remembers the user's preference. Apply the shared behavior to the main editor and editable Markdown Examples window without affecting the preview-only README window.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sync Scrolling is enabled by default, exposed as a checked View-menu option in the main editor and Markdown Examples, and persists the user's preference
- [x] #2 In Split view, user scrolling in either source or preview moves the other pane to the corresponding document region without oscillation or feedback loops
- [x] #3 Synchronization uses measured Markdown block/source anchors with monotonic interpolation and a safe proportional fallback when usable anchors are unavailable
- [x] #4 Editing and preview rerendering preserve the current logical region without moving the source pane or producing disruptive preview jumps
- [x] #5 Window resizing, source wrapping changes, delayed image layout, pane swapping, and substantially different source/preview heights invalidate and rebuild mappings predictably
- [x] #6 Synchronization is inactive outside Split view, remains unavailable in preview-only README, and resumes consistently when Split view returns
- [x] #7 Large mixed Markdown documents and both scroll directions are covered by automated tests and documented native verification
- [x] #8 User documentation explains the Sync Scrolling control, remembered default, and the approximation within unusually tall individual blocks
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the shared Markdown renderer with an opt-in source-map render mode that decorates mapped block output with source-line attributes while preserving byte-for-byte ordinary rendering, HTML safety, link behavior, code-copy markup, and print behavior.
2. Promote the proven normalization/interpolation logic into a tested production scroll-mapping module. Add a reusable controller that measures preview anchors and matching textarea line positions through an inaccessible offscreen mirror, caches forward/reverse mappings, and falls back to proportional extents when anchors are insufficient.
3. Implement bidirectional ownership and lifecycle behavior: latest user-scrolled pane owns direction; animation-frame scheduling and programmatic guards prevent feedback; render completion preserves the source-owned logical region; ResizeObserver plus captured image load/error events invalidate measurements; controller activation is limited to enabled Split view and survives pane swaps.
4. Add `syncScrolling` to persisted view preferences with a default of true. Add synchronized checked/disabled View-menu items to the main window and Examples menu; reuse the same preference key in Examples without importing the main window's mode/pane-order preferences. README remains preview-only and receives no control/controller.
5. Integrate source-mapped rendering and the shared controller into the main and Examples render lifecycles, including reset/view changes and clean teardown. Keep synchronization UI in the View menus rather than adding toolbar clutter.
6. Update README user documentation with the on-by-default remembered control and within-tall-block approximation.
7. Add focused renderer, mapping, mirror/controller, preference, menu, main/Examples integration, large mixed-document, resize/image invalidation, and feedback-loop tests; then run frontend/Rust suites, production/native builds, formatting/Cargo/diff checks, and interactive native verification before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after TASK-002.14 and its research artifacts were committed/pushed as `235b4cf`; this task's tracking commit is `11d0915`. Researching the current shared renderer API, main/Examples render lifecycles, view preference persistence, native menu controllers, and DOM/CSS geometry before recording the production plan.

Current-system decision: make source mapping an optional renderer output mode so existing tests/browser-neutral rendering remain unchanged by default. Use one ScrollSyncController for main and Examples, with an offscreen mirror matching computed textarea typography/wrapping and preview data-source-line geometry. Persist only the sync flag across windows; do not make Examples inherit the main document's view mode or pane order. Keep the control in native View menus only.

Implemented optional renderer source maps, production monotonic/interpolated mapping with proportional fallback, textarea mirror measurement, bidirectional controller ownership/guards/invalidation, default-on persisted preference, main/Examples View-menu integration, and README documentation. Automated verification currently passes 125/125 frontend tests across 16 files, 6/6 Rust tests, production build, native debug build, rustfmt, and Cargo check. Proceeding to native interaction testing for menu toggle semantics and real textarea/preview geometry.

Native verification completed by the user: both scroll directions, enabled/disabled menu behavior, single-pane pause and Split resumption, swapped panes, Examples behavior, README exclusion, edit/rerender stability, and preference persistence all passed.

Final automated verification: 125/125 frontend tests across 16 files, 6/6 Rust tests, production frontend build, native debug build without bundling, rustfmt, Cargo check, and diff checks passed. A separate GTK native file-chooser state issue was reported during testing and is outside this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented default-on, remembered bidirectional synchronized scrolling for the main editor and Markdown Examples using measured source/preview block anchors, monotonic interpolation, and proportional fallback. Added lifecycle invalidation, loop prevention, renderer source mapping, native View-menu controls, documentation, automated coverage, and completed native verification.
<!-- SECTION:FINAL_SUMMARY:END -->
