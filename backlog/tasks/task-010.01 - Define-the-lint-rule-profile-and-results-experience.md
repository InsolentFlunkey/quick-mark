---
id: TASK-010.01
title: Define the lint rule profile and results experience
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-29 20:58'
updated_date: '2026-09-07 21:29'
labels:
  - enhancement
  - markdown
  - linting
dependencies:
  - TASK-005
  - TASK-014
references:
  - 'https://github.com/DavidAnson/markdownlint'
  - 'https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md'
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
parent_task_id: TASK-010
priority: high
type: enhancement
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define the product behavior and rule configuration for QuickMark’s Markdown linter before implementation. The profile must align with the supported Markdown dialect, distinguish formatting/style guidance from malformed or misleading syntax, avoid noisy defaults that would make the feature unhelpful, and specify the results-pane, synchronized-navigation, command, preference, and save-prompt interactions needed by the MVP.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The selected lint engine and its desktop/browser integration constraints are documented
- [x] #2 An explicit default rule profile is documented with rationale for enabled, disabled, and customized rules
- [x] #3 The profile is reconciled with QuickMark’s supported Markdown dialect and safety restrictions
- [x] #4 The manual command, results presentation, issue navigation, no-issue state, Preview restoration, and synchronized-scrolling behavior are specified
- [x] #5 The remembered lint-on-save control and exact clean, issue-found, canceled-save, failed-save, and lint-failure interactions are specified
- [x] #6 Accessibility, large-document responsiveness, and future configuration or auto-fix boundaries are documented
- [x] #7 The approved decisions are captured as durable Backlog documentation suitable for independent implementation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Completed design-only sequence: researched TASK-010, dependencies TASK-005/TASK-014, downstream contracts, current code and architecture docs 002/004/005/006/007; researched upstream markdownlint 0.41.1; recorded and reviewed doc-008. Replaced the initial permissive proposal after user feedback with the standard pinned rule baseline, explicit formatting options and approved MD034/MD051 exclusions. Captured approved results/navigation/save interactions and verification handoff. Created user-authorized follow-ups TASK-010.04 (rule controls) and TASK-010.05 (heading anchors/aligned linting), both To Do. Finalize by auditing all seven documentation criteria, recording evidence and marking this specification task Done. No application implementation or other task starts; ask before committing or pushing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started research/planning only as requested. TASK-005 and TASK-014 dependencies are Done. Initial git status --short was clean; preserve all user files and any concurrent edits, especially test-files/code-blocks.md. user-notes.md has no topics under Notes. Product review is required before implementation; no other task is authorized.

Current code evidence: src/document-workspace.ts gives stable per-document identity and serializable view/transfer state; lint state is absent. src/main.ts wires source/preview controllers and persists explicit View changes. src/tab-session.ts centralizes direct and close/clear saves, but #managedSave returns status failed when recordSaved fails after the successful write; generic OperationOutcome carries neither write receipt nor saved text. The lint design must distinguish actual write success from ancillary history errors and preserve existing conflict/close semantics. This is a design dependency to address within the save-lint implementation, not an unrelated fix performed now.

Upstream research: markdownlint 0.41.1 documents browser usage and strings input; package metadata advertises browser import conditions. Built-in rules use micromark, whose source adds footnote/math/directive extensions; replacing markdown-it options will not align those rules with QuickMark. Proposed fixed advisory profile must disclose incomplete dialect validation. No markdownlint dependency is currently installed; no installation/build/runtime experiment attempted. Native worker/bundler behavior remains unverified.

Created doc-008 as an explicitly unapproved draft with full rule inventory, outcomes and verification handoff. Awaiting product review; acceptance criteria intentionally unchecked. Key review choices: low-noise advisory profile with disclosed dialect gaps; temporary Source/right-pane Preview-or-Results inspection with explicit restoration; stale rows retained but non-navigable; completed lint state follows detach; application-wide opt-in save lint; Yes during Save-and-Close/Clear retains the saved document and stops the pending action. No code or other task changes.

Created TASK-010.04 (To Do, dependency TASK-010.03) for individual and functional-group rule enablement, default reset, persistence across windows, effective-profile consistency and verification/documentation. No duplicate rule-configuration task was found. User's approval applies to the standard-based direction; the UI remains provisionally accepted subject to native review. No application code changed.

User explicitly accepted disabling MD051 for now and approved the rest of the plan. Recorded doc-008 as approved, including MD034 exclusion; future native usability verification remains in implementation tasks. Searched anchor/fragment tasks and read TASK-006: existing work routes fragments but does not generate heading anchors or align MD051. Created TASK-010.05 as the authorized follow-up, with rendering, navigation, lint agreement, safety and verification criteria.

Final verification: reviewed approved doc-008 against each documentation criterion. AC1 engine/browser/desktop constraints and unverified native integration are explicit; AC2 the 53-rule pinned baseline, default options, customizations and two approved exclusions are enumerated; AC3 renderer/safety differences and incomplete compatibility diagnostics are disclosed; AC4 commands/results/clean state/navigation/Preview restoration/sparse sync are specified; AC5 remembered preference and exact write/lint/prompt outcomes include close/clear and history failure; AC6 accessibility, worker cancellation/timeouts, large-document probes and future boundaries are documented; AC7 user explicitly approved and final doc metadata/references are durable. Read-back audit passed one H1, complete nonduplicated 53-rule inventory, all required sections and valid documentation paths. The initial path assertion incorrectly assumed unwrapped metadata; corrected the verification to account for Backlog whitespace folding and reran successfully. git diff --check passed. No application tests/native checks claimed for this documentation-only task; implementation checks are handed off to .02/.03. user-notes.md is empty and application/test files remain untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Defined the approved Markdown lint profile and interaction specification in doc-008. Uses the standard pinned formatting-inclusive rule baseline with MD034 and MD051 disabled, documents renderer limits, tab/revision ownership, results navigation, Preview restoration and save feedback. Records accessibility/performance requirements and implementation verification boundaries.

Verified all seven documentation criteria through final content review, user approval and a passing structural/rule-inventory/reference audit; git diff --check passed. No application implementation or native validation is claimed. Authorized follow-ups TASK-010.04 (rule controls) and TASK-010.05 (heading anchors/aligned linting) remain To Do. TASK-010.02 is the next implementation task. Changes are uncommitted pending user approval.
<!-- SECTION:FINAL_SUMMARY:END -->
