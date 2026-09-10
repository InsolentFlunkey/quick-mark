---
id: TASK-010.04
title: Configure Markdown lint rules individually and by functional group
status: Done
assignee:
  - Codex
created_date: '2026-09-07 21:05'
updated_date: '2026-09-10 04:23'
labels:
  - enhancement
  - markdown
  - linting
  - settings
dependencies:
  - TASK-010.03
references:
  - tests/manual/lint-rule-sample.md
  - tests/manual/lint-rule-guide.md
documentation:
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-008 -
    Markdown-lint-profile-and-results-experience.md
  - >-
    backlog/docs/architecture/markdown-lint-design/doc-009 -
    Lint-rule-settings-and-configuration-lifetime.md
parent_task_id: TASK-010
priority: medium
type: enhancement
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let users adapt QuickMark's documented standard-based lint profile by disabling or re-enabling individual rules and groups of related functionality. The user authorized tracking this follow-up separately from TASK-010.01's design work. TASK-010.03 supplies the completed manual and save-triggered lint workflows; both must use the user's effective configuration. Retain advisory saves. This is a separately deliverable follow-up to the original three-child lint MVP; creation does not authorize implementation. Define and review functional groups and their interaction with individual choices before implementation. Custom rule code, project-file discovery, auto-fix and live linting are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can disable and re-enable each available lint rule with its rule ID and understandable description visible.
- [x] #2 Users can disable and re-enable documented functional groups; mixed group states and overlapping membership, if any, have predictable behavior reflected accurately in the controls.
- [x] #3 Users can restore the documented QuickMark default profile.
- [x] #4 Rule choices persist across restarts and stay consistent across editor windows; persistence failures are reported without falsely showing a saved setting.
- [x] #5 Manual and save-triggered linting use the same effective choices, and results from an earlier configuration are not presented as current.
- [x] #6 Keyboard-accessible controls, automated coverage, native verification and user documentation cover individual/group changes, mixed states, reset, persistence and result invalidation.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved, implemented and verified; user accepted native review and authorized commit/push.

1. Add a Markdown Lint Rules section in Settings with expandable, non-overlapping groups: Headings (MD001/003/018/019/020/021/022/023/024/025/026/036/041/043); Lists (MD004/005/007/029/030/032); Spacing and blockquotes (MD009/010/012/013/027/028/047); Code blocks and inline code (MD014/031/038/040/046/048); Links, images and HTML (MD011/033/034/039/042/045/051/052/053/054/059); Emphasis and names (MD037/044/049/050); Tables and thematic breaks (MD035/055/056/058/060). Show ID and plain-language description for each rule. Groups are bulk-edit controls over individual booleans, with checked/unchecked/mixed states; clicking mixed enables all available members. No separate group override or hidden restoration of prior choices.
2. Preserve the existing default rule options. Expose MD034 as an opt-in style check, off by default; show MD051 as unavailable with an explanation until TASK-010.05 aligns heading navigation and validation. Group operations skip unavailable MD051. Explain MD043/044 require configured headings/names and currently have no such constraints; this task adds switches, not option editors. Restore QuickMark Defaults resets only rule choices, not Lint before saving or unrelated settings.
3. Extend native coordinator preference persistence with validated rule overrides and serialized patch operations so simultaneous windows cannot overwrite unrelated changes. Preserve existing enabled preference and migration defaults. Publish accepted values only after persistence succeeds; show errors and retain last accepted controls on failure. Reuse the existing revision synchronization and fetch authoritative choices before lint runs.
4. Pass immutable effective rule configuration through lint client/worker for both manual and pre-save jobs. Add configuration identity to result/cache/transfer validation. Rule changes mark old results visibly stale and disable their navigation; late old-configuration responses cannot become current. An already-started save retains its captured rule configuration through Retry and save decisions; subsequent runs use latest choices. No automatic lint on changes.
5. Extend Settings HTML/controller/styles with keyboard-accessible group/rule controls and mixed-state semantics. Document approved group mapping, reset behavior, compatibility exclusions and configuration lifetime in a Backlog design doc and README.
6. Verify meaningful profile, UI, persistence/migration/failure/concurrency, stale response, detach, and manual/pre-save integration tests; run frontend suite, Rust checks, production worker probe and native debug build. Complete native keyboard/layout/multi-window/restart review before Done. Preserve and report the previously documented unrelated desktop-parity Grid/Flexbox failure; do not bypass it or expand scope.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User explicitly authorized beginning TASK-010.04. Verified dependency TASK-010.03 is Done. Marked In Progress and assigned Codex. Inspected current lint profile, worker/client/state, Settings markup/controller, native preference persistence and main integration. Node dependencies and cargo are available. Only task metadata changed; implementation awaits the task-required review of groups and individual-control semantics. Existing lint profile excludes MD034/MD051; fixed options and native revisioned persistence must be preserved.

User approved the proposed groups, direct bulk-switch/mixed-state behavior, default reset scope, MD034 opt-in, MD051 unavailable, stale results and captured save configuration. Proceeding with implementation under the recorded plan.

Implemented approved catalog/UI, native revisioned rule patches/reset with legacy migration and write-before-publish behavior, worker overrides preserving fixed options, authoritative manual/save configuration capture, stale tab/transfer validation and save Retry lifetime. New regression test caught preference-read errors becoming stale rather than failed; fixed by preserving failure statuses. Updated the saved integration assertion for the new configuration argument and extended it through Settings changes, stale results, Retry and subsequent-save choices.

Verification so far: 31 focused frontend tests passed; full frontend 311 passed / one known pre-existing tests/desktop-parity.test.ts:50 Grid-vs-Flexbox assertion failed unchanged. 49 Rust tests passed including migration, restart, independent patch/reset and failure/invalid-ID tests. Standalone npm run tauri build -- --debug --no-bundle passed. Actual WebKitGTK isolated Settings probe at 620px and 360px confirms initial Close focus, mixed-to-all behavior, unavailable MD051 and horizontal containment; screenshots inspected. Desktop display required sandbox escalation, approved; no workaround. README and approved doc-009 describe the behavior. Integrated user native review remains pending; no commit/push authorized for this task.

Acceptance evidence: AC1/2 Settings DOM tests exercise individual/group off/on/mixed behavior and skip MD051; catalog/profile tests verify rule inventory and effective checks; WebKitGTK probes verify actual mixed/all controls. AC3 reset test restores defaults while preserving Lint before saving, backed by native independent reset test. AC4 native tests cover older-file migration, independent window patches, restart, failed write rollback and invalid configuration; Settings/integrated polling tests cover accepted controls and another-window revisions. AC5 integrated main test covers same manual/save choices, Settings invalidation, Retry preserving captured rules and subsequent save adopting new rules; result tests cover all-tab staleness, late responses and mismatched detached cache. Production worker probe passed configured rules, default checks, entities and rejection of unavailable MD051 without DOM globals. AC6 remains pending integrated native user review; no Done/final summary/commit yet.

Final checks: actual native GDK Space-key activation of the focused group checkbox passed in WebKitGTK (group turned off, focus remained on input). Final integrated save test passed after ensuring enabled and rule choices are captured from the same authoritative response even if newer Settings responses have arrived. Rebuilt standalone debug app successfully; configured production worker checks and git diff --check passed. Binary: src-tauri/target/debug/quick-mark. Full suite baseline remains 311 passing frontend tests plus one disclosed pre-existing desktop-parity failure; 49 Rust tests passed. User native review checklist: Settings → Markdown Lint Rules → Headings → Individual rules, toggle MD025 and verify mixed group behavior; lint two distinct H1 headings and verify MD025 disappears after disabling and Run Again, with old results immediately stale; verify Lint before saving uses the same choices; compare switches across two editor windows and restart; Restore QuickMark Defaults restores MD025 on/MD034 off/MD051 unavailable while preserving Lint before saving. Task remains In Progress pending AC6 integrated native review. No commits or pushes made.

User requested a Markdown document for native rule-control testing. Add a manual sample and companion instructions within this task's verification scope; deliberately exercise each functional group plus MD034 opt-in and MD051 unavailability, and verify the sample with the current lint engine. User also requested tracking a separate Settings tab layout follow-up; its implementation is not part of .04 and is not authorized to start.

Created user-requested manual sample tests/manual/lint-rule-sample.md and companion guide tests/manual/lint-rule-guide.md. Verified with the current lintSource engine: 13 default findings; MD025 off gives 12; MD034 on gives 14; disabling the seven groups individually gives 11/11/11/12/11/11/11; all available rules off gives zero. Guide lists actual rule IDs/line numbers, explains duplicate MD049 findings, mixed Links group and unavailable MD051, and covers stale navigation, save-first decisions, cross-window/restart persistence and keyboard controls. It is representative coverage of all groups, not a claim to trigger all 53 rules. New TASK-021.01 tracks the requested category-tab Settings follow-up as To Do, dependent on this task; no tab-layout implementation started.

User reviewed the work and manual sample, reported 'it looks good', and explicitly authorized committing/pushing this implementation first, followed by a separate commit/push for TASK-021.01. User intends additional exploratory testing. Review acceptance completes AC6 alongside recorded automated/native checks and documentation; mark Done with completed metadata in the implementation commit. Pre-commit git diff --check passes. The known unrelated desktop-parity assertion remains disclosed and unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Add persistent individual and functional-group lint switches in Settings, with direct bulk changes, mixed states and Restore QuickMark Defaults. Share validated native rule patches across editor windows without overwriting unrelated choices; preserve prior settings when writes fail. Use the same effective profile for manual and before-save linting, retain captured choices through save Retry, and mark older results stale. Keep MD034 optional/off by default and MD051 unavailable. Document the design and supply a verified manual sample/guide.

Verified with 311 passing frontend tests, 49 Rust tests, production worker configuration checks, standalone debug build, actual WebKitGTK layout checks at 620px/360px and native Space-key activation, plus user review acceptance. One pre-existing desktop-parity Grid/Flexbox assertion remains unchanged. Settings category tabs are separately tracked in TASK-021.01; implementation not started.
<!-- SECTION:FINAL_SUMMARY:END -->
