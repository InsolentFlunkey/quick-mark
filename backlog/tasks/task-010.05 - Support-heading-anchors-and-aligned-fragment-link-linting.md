---
id: TASK-010.05
title: Support heading anchors and aligned fragment-link linting
status: Done
assignee:
  - Codex
created_date: '2026-09-07 21:27'
updated_date: '2026-09-14 01:18'
labels:
  - enhancement
  - markdown
  - linting
  - navigation
dependencies:
  - TASK-010.02
  - TASK-006
references:
  - 'https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/md051.md'
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
  - >-
    backlog/docs/architecture/heading-fragments/doc-011 -
    QuickMark-heading-anchors-and-fragment-validation.md
modified_files:
  - shared/markdown-renderer.js
  - src/rendered-resources.ts
  - src/cheat-sheet-renderer.ts
  - src/vite-env.d.ts
  - src/lint-profile.ts
  - src/lint-rules.ts
  - src-tauri/src/editor_coordinator.rs
  - scripts/check-lint-worker.mjs
  - tests/heading-fragments.test.ts
  - tests/lint-rules.test.ts
  - tests/lint.test.ts
  - tests/settings.test.ts
  - tests/markdown-renderer.test.js
  - tests/markdown-cheat-sheet.test.js
  - tests/manual/heading-fragments.md
  - docs/markdown.md
  - docs/linting.md
  - docs/development.md
  - src/markdown-cheat-sheet.md
  - src/markdown-examples.md
  - >-
    backlog/docs/architecture/heading-fragments/doc-011 -
    QuickMark-heading-anchors-and-fragment-validation.md
parent_task_id: TASK-010
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add same-document heading navigation and corresponding lint validation so section links work in QuickMark Preview and incorrect destinations are diagnosed. MD051 is disabled in the approved initial profile because QuickMark currently generates no heading IDs, while the upstream rule assumes GitHub-style anchors and accepts additional fragment forms. TASK-006 provides safe preview link routing; TASK-010.02 supplies the lint engine/results. The user explicitly authorized this future functionality and tracking, not implementation now. This is a separate follow-up to the original lint MVP. Define the supported fragment contract and review material choices before implementation; do not equate enabling MD051 alone with matching actual Preview behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rendered headings expose deterministic unique anchors, with documented behavior for repeated headings, punctuation, inline formatting and Unicode.
- [x] #2 Activating a supported same-document section link navigates to the correct heading in the intended preview without leaving the app or targeting another document.
- [x] #3 Linting identifies invalid supported section-link destinations and accepts valid ones using the same documented naming contract as rendering; the default lint profile enables the aligned validation.
- [x] #4 Explicit heading attributes, raw HTML anchors, top-of-document and GitHub line/content fragments have documented supported or unsupported dispositions; upstream MD051 acceptance is not falsely presented as proof they work in Preview.
- [x] #5 Existing HTML escaping, restricted resource navigation, source-scroll mapping and tab/window isolation are preserved.
- [x] #6 Automated rendering/navigation/lint tests, native verification and user documentation cover valid links, missing/renamed headings, duplicate anchors and the supported fragment boundaries.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved by the user on 2026-09-13; implementation and native interaction review complete.

1. Shared contract in shared/markdown-renderer.js: derive anchors from parsed heading inline text (including code/link labels/image alt text, excluding formatting delimiters and link destinations), using the same markdown-it configuration for rendering and lint analysis. Normalize Unicode to NFC, lowercase, retain Unicode letters/marks/numbers plus underscores/hyphens, remove other punctuation/symbols, trim and replace whitespace runs with a hyphen. Use section when the result is empty. Assign unique IDs in document order with -1, -2, etc., checking all previously assigned IDs, including literal suffixed headings. Reset allocation on each document parse. Preserve source-map attributes.
2. Fragment routing in src/rendered-resources.ts: match generated heading IDs only within the controller's preview root; never use a window-wide ID lookup. Decode URI fragments once, match case-sensitively, report malformed/missing targets, and keep navigation inside the preview. Bare # scrolls to preview top. #top is an ordinary heading destination (works for a heading generating top), not a reserved alias. Explicit {#id} attributes and raw HTML anchors remain unsupported/literal. GitHub line/content fragments have no special meaning and must match a generated heading to resolve. File-qualified fragments remain outside this same-document feature; retain existing resource policy.
3. Aligned validation: keep upstream MD051 disabled internally and produce QuickMark-specific MD051 findings from the shared renderer analysis for rendered fragment links, including reference-style links. Merge into normal sorted lint results with useful source locations. Do not validate code examples, escaped HTML, image URLs or external/file-qualified destinations as same-document links. Enable the MD051 catalog entry by default and allow existing individual/group overrides. Explain the QuickMark-specific contract in Settings/documentation. Update native rule validation plus frontend/native profile identities so old results cannot be treated as current.
4. Verify rendering, duplicate collision allocation, Unicode/encoding, punctuation-only headings, inline formatting and renderer/linter agreement; valid/missing/renamed and unsupported targets; same-ID headings across tabs and reference roots; sync scrolling on/off, keyboard activation, rerender, detach and result/settings persistence. Preserve HTML escaping and existing resource restrictions. Run frontend tests/build, bundled worker smoke check and relevant Rust tests/format/check. Build the standalone Windows debug app for native WebView2 review; record native evidence before marking Done.
5. Document the reviewed contract in a Backlog architecture doc, update docs/markdown.md and docs/linting.md plus relevant bundled examples/fixtures, and provide concrete native manual steps. Keep work limited to TASK-010.05 and ask before committing.

Approved by user; implementation may proceed.

Cheat Sheet result regions are separate rendered document scopes within the reference preview; fragment navigation must stay within the clicked example. Preserve existing MD042 advice for bare # while MD051 accepts its supported top navigation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User authorized starting TASK-010.05 on 2026-09-13. Preparing required fragment-contract review before writing application code.

Inspection: prerequisites TASK-006 and TASK-010.02 are Done. Current renderer has no heading IDs. Fragment controller uses ownerDocument.getElementById, which is unsuitable for duplicate IDs across retained tab previews. MD051 is unavailable in the Settings catalog, and native validation/profile transfer checks also require updates. Upstream v0.41.1 MD051 documentation confirms broader acceptance of explicit IDs, HTML anchors, #top and GitHub line/content fragments. No user-notes.md exists at repository root. Node/npm/Cargo commands are discoverable; execution/build feasibility remains to be checked during implementation. Initial rg launcher failed and Git warned about unreadable global ignore; read-only PowerShell inspection completed. No application edits or commits made.

User approved the proposed fragment contract and implementation plan on 2026-09-13. Proceeding with implementation.

Implemented approved shared renderer anchor allocation/fragment analysis, preview-scoped navigation, configurable QuickMark MD051 and profile v2 with native validation. Updated user/bundled documentation and added tests/manual/heading-fragments.md. Architecture recorded in doc-011. Findings deliberately point to the containing source block because markdown-it has no inline source ranges.

Verification: full frontend suite passes 332/332 across 49 files; Rust suite passes 50/50, cargo fmt --check and cargo check pass; frontend build and production DOM-free worker checks pass. Initial failures were old no-heading-ID expectations and a new test overlooking existing typographic quote conversion, corrected without changing renderer restrictions. Native standalone Windows debug build and interaction review remain pending; task stays In Progress.

Final review added document scoping for independently rendered Cheat Sheet examples, preventing example/guide target collisions. All 333 frontend tests pass. MD042's existing bare-# warning is retained and explicitly documented; MD051 accepts the supported top navigation. Standalone Windows debug build succeeded and is being rebuilt to include this final refinement.

Final standalone Windows build succeeded: npm.cmd run tauri -- build --debug --no-bundle -- --locked produced src-tauri/target/debug/quick-mark.exe with the final example-scoping/doc changes. Production worker smoke check passed again against that build. git diff --check passes. Tauri rewrote Cargo.toml line endings without semantic changes; restored its original CRLF format. No application launch/native interaction claimed. Awaiting user execution of tests/manual/heading-fragments.md before completing AC2/AC6 and marking Done. No commits created.

User confirmed the complete native review works and explicitly authorized commit and push. AC2 and AC6 are now verified by native interaction plus the automated rendering/navigation/lint coverage. All criteria are satisfied.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added deterministic Unicode heading anchors and preview-scoped section navigation, including isolated Cheat Sheet examples. Enabled configurable QuickMark-specific MD051 validation using the same renderer contract, with native preference support and profile-version invalidation. Documented supported fragment boundaries, block-level finding locations and existing MD042 advice for bare # links.

Verification: 333 frontend tests and 50 Rust tests pass; TypeScript/Vite, cargo fmt/check, production DOM-free worker checks, whitespace checks and the standalone Windows debug build pass. User completed native verification successfully and approved commit/push. No unrelated implementation included.
<!-- SECTION:FINAL_SUMMARY:END -->
