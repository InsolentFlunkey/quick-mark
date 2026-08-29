---
id: TASK-003
title: Add a Markdown table builder
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-28 03:50'
updated_date: '2026-08-29 18:51'
labels:
  - enhancement
dependencies: []
modified_files:
  - README.md
  - index.html
  - src/application-menu.ts
  - src/main.ts
  - src/styles.css
  - src/table-builder.ts
  - tests/application-menu.test.ts
  - tests/desktop-parity.test.ts
  - tests/table-builder.test.ts
priority: low
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add guided table-building functionality so users can create correctly formatted Markdown tables without manually aligning delimiters. The desktop editor architecture this enhancement was waiting for is now established. Refine the interaction design and supported insertion or editing workflows when this task is taken into progress.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The intended table-building interaction and supported insertion or editing workflows are documented before implementation
- [x] #2 Users can define table dimensions and header content and insert a syntactically valid Markdown table into the active document
- [x] #3 Generated tables include a valid delimiter row and preserve cell content that requires Markdown escaping
- [x] #4 Insertion respects the editor's current selection or cursor without losing unrelated document content
- [x] #5 Representative table-generation and insertion behavior is covered by automated tests
- [x] #6 User-facing documentation explains how to invoke and use the table builder
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define a reusable table-generation and selection-insertion module. Generate CommonMark/GFM-style tables from validated column/body-row counts, header labels, and per-column alignment; escape cell pipes and backslashes; normalize surrounding line breaks; and return a deterministic caret position in the first blank body cell.
2. Add an accessible main-window Table Builder modal with column count, body-row count, dynamically generated header controls, a live raw-Markdown preview, validation, Reset, Cancel, and Insert actions. Header inputs use `Column N` suggestion placeholders and blank inputs generate blank header cells. The modal may close only through Cancel or successful Insert; backdrop clicks and Escape do not dismiss it.
3. Present column configuration as a compact semantic grid with an explicitly sized header-entry column and three equal, centered alignment columns. Give every column a keyboard-accessible Left/Center/Right radio group. Add an `All columns` row with compact `Set` buttons under each alignment; each button carries a full accessible label and matching tooltip such as `Set all columns left`, immediately updates all row radios and the preview, and does not represent misleading persistent state.
4. Start every builder invocation from the documented three-column/three-body-row defaults. Cancel and successful Insert discard the current configuration, while Reset restores defaults without closing. Preserve entered values only while changing dimensions during the same open session.
5. Let the modal and column-control area grow naturally as columns are added, applying internal scrolling only when the dialog approaches the available viewport height; use available horizontal space for clear alignment labels rather than ambiguous arrow shorthand.
6. Expose the builder through both a prominent `Table Builder` toolbar button and native `Insert → Table…` menu item. Keep it out of README and Markdown Examples. Disable or safely reject insertion when the active document is not editable.
7. Insert the generated table at the current textarea cursor or replace only the current selection, then commit the complete content through `DocumentLifecycle.edit`, rerender, restore editor focus, and place the caret in the first blank body cell. Existing-table parsing/editing remains outside this MVP.
8. Add unit tests for validation, alignment delimiters, escaping, newline normalization, selection replacement, and caret placement; add integration coverage for toolbar/menu/modal wiring, reset/dismissal behavior, placeholders, adaptive sizing, compact alignment layout, radio/bulk actions, accessible tooltips, and main-window-only scope.
9. Document invocation and MVP behavior in the README, then run the complete frontend/Rust suites, production and native builds, formatting/diff checks, and native interaction verification before finalizing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed the TASK-002 dependency because the editor/application conversion needed by Table Builder is complete. Deferred Windows distribution is now tracked independently by DRAFT-001 and does not block this enhancement.

Started after TASK-002 was finalized and pushed as `14ecf3d`. The desktop editor architecture prerequisite is complete and TASK-003 has no remaining dependencies. Beginning current-system research into editor selection insertion, native menu placement, modal conventions, and shared Markdown behavior before recording an implementation plan or changing application code.

Current-system research: the main window has a native File/Edit/View/Help menu, a deliberately minimal toolbar, one existing HTML `<dialog>` pattern, and a textarea backed by `DocumentLifecycle.edit`. Cursor/selection replacement is not yet exposed as a reusable production operation, though shared editor behavior already manipulates selections for keyboard features. Table Builder should be main-editor-only (not README or editable Examples), invoked from a new Insert menu rather than toolbar clutter, and should commit one generated replacement through the document lifecycle so dirty state, preview, scrolling, and save capabilities update normally. A material interaction decision remains for user review before the implementation plan is finalized.

User approved the MVP interaction with one change to the initial recommendation: Table Builder must also be a toolbar button because this is a primary editing action. Confirmed MVP: dimensions, header text, per-column alignment, live Markdown preview, blank body cells, cursor/selection insertion, and no existing-table parser/editor. Invocation will be available from both the toolbar and a native Insert menu.

Implemented the approved MVP: reusable generation/insertion logic, toolbar button, native Insert → Table menu, accessible responsive modal, dimensions, header and alignment controls, live raw preview, blank body rows, selection/cursor replacement, first-body-cell focus restoration, README guidance, and main-window-only wiring. Verification passes: 136/136 frontend tests across 18 files, production frontend build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and native debug build. Awaiting native interaction and visual verification before finalization.

User testing found four same-task UX refinements and approved the resolution: prevent backdrop/Escape dismissal; reset to clean defaults on every invocation and provide an in-dialog Reset action; let the modal grow before viewport-constrained scrolling; replace prefilled `Column N` values with placeholders, with blank inputs producing blank table headers.

Applied the approved UX refinements: removed backdrop dismissal and prevent Escape cancellation; added Reset and clean 3×3 state on each open/Cancel/successful Insert; changed default header text to non-content `Column N` placeholders with blank-header output; and increased adaptive column-list growth to half the viewport before scrolling. Updated README and regression coverage. Verification passes with 137/137 frontend tests across 18 files, production build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and refreshed native debug build. Awaiting user native verification.

User approved replacing per-column alignment dropdowns with a horizontally spacious semantic grid. Each row will use Left/Center/Right radios; a top `Set all columns` row will use buttons (not radios) so later per-column changes cannot leave a misleading bulk selection. Explicit words were chosen over arrow shorthand for clarity and accessibility.

Implemented the approved alignment UX: a semantic two-level table header (`Column header` and grouped `Alignment` with Left/Center/Right), keyboard-native radio groups per column, and non-stateful `Set all left/center/right` bulk buttons. Bulk actions update every row and the live Markdown preview; individual changes can then diverge without a misleading all-columns selection. Updated styling, README, and integration assertions. Full verification remains green: 137/137 frontend tests, production build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and refreshed native debug build. Awaiting native visual/interaction verification.

User visual testing exposed a selector bug: the first-cell sizing rule also matched the Left subheading because its row has no header-entry cell due to row spanning. Approved fix: explicit 46% header-entry and equal 18% alignment columns, centered alignment headings, compact `All columns` / `Set` bulk controls, and full matching aria-label/title text on each Set button.

Applied final alignment-grid polish: explicit colgroup sizing prevents the row-spanned header layout from treating Left as the header-entry column; the header-entry column is 46% and all three centered alignment columns are 18%. The bulk row is now `All columns` with compact `Set` buttons. Each Set button has matching full `aria-label` and `title` text for assistive technology and hover clarification. Verification passes: focused tests, 137/137 full frontend tests, production build, 6/6 Rust tests, rustfmt, Cargo check, diff check, and refreshed native debug build. Awaiting native visual verification.

User completed final native visual and interaction verification after the compact alignment-grid polish and confirmed the Table Builder looks and behaves correctly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a guided Markdown Table Builder to the main QuickMark editor through both a toolbar button and native Insert menu. The accessible, explicit-dismissal modal supports dimensions, blank header placeholders, a compact per-column alignment radio grid with bulk actions and tooltips, live Markdown preview, reset behavior, cursor/selection insertion, escaping, and deterministic focus restoration. README guidance and focused regression coverage were added. Verification passed with 137 frontend tests, production build, six Rust tests, rustfmt, Cargo check, native debug build, and repeated user native interaction/visual testing.
<!-- SECTION:FINAL_SUMMARY:END -->
