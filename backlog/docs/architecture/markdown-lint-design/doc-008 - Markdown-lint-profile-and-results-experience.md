---
id: doc-008
title: Markdown lint profile and results experience
type: specification
created_date: '2026-09-07 17:45'
updated_date: '2026-09-07 21:28'
tags:
  - markdown
  - linting
  - task-010.01
  - approved
---
# Markdown lint profile and results experience

## Status and scope

Approved for TASK-010.01 on 2026-09-07 after user review. The standard-rule baseline includes formatting guidance; MD034 and MD051 are disabled initially. The user explicitly accepted temporary MD051 exclusion and approved the rest of the plan. Native interaction review remains part of the implementation tasks. TASK-010.04 tracks rule controls; TASK-010.05 tracks heading anchors and aligned linting. Application implementation has not started.

Read with TASK-010/.01/.02/.03, completed TASK-005 and TASK-014, README Supported Markdown dialect, and architecture docs 002, 004, 005, 006 and 007. Current implementation takes precedence over historical recommendations: Sync Scrolling now defaults on.

## Engine and integration

Select markdownlint 0.41.1 as the research baseline, pinned during implementation with a lockfile and explicit QuickMark profile version. Use its string API in a locally bundled module worker inside the Tauri webview. There is no separate supported browser product, Node runtime, CLI subprocess, network lint service, document upload or filesystem/config discovery.

Upstream supports browser use and in-memory strings. Its package has browser import conditions. Built-in rules parse with micromark; markdown-it customization does not change their parser. Set frontMatter to null and noInlineConfig to true so QuickMark does not silently omit a metadata preamble or honor hidden configuration instructions in literal HTML comments. Use structured results and discard fix instructions.

Sources: [API and browser documentation](https://github.com/DavidAnson/markdownlint/tree/v0.41.1), [package metadata](https://github.com/DavidAnson/markdownlint/blob/v0.41.1/package.json), [parser implementation](https://github.com/DavidAnson/markdownlint/blob/v0.41.1/lib/micromark-parse.mjs).

Feasibility boundary: the package is not installed in QuickMark and this planning task has not proven Vite worker bundling or native execution. TASK-010.02 must prove the browser import path, production worker asset resolution and Linux WebKitGTK operation; record Windows WebView2 verification separately. Prefer an explicit worker-src 'self' CSP directive and a bundled worker asset; do not add remote scripts, unsafe-eval, broad filesystem capabilities or a main-thread fallback. Report integration failures before proposing a changed approach.

## Default profile

The user approved the revised direction: use markdownlint's standard rule set
as the baseline, retain formatting guidance, and disable rules only for a
documented QuickMark conflict reviewed with the user. This supersedes the
original low-noise allowlist. The exceptions below are approved.

All findings remain advisory; saves can complete with outstanding warnings.
Rendering successfully does not imply conformance to the chosen formatting
convention. QuickMark's documented profile defines that convention without
claiming that it is the only valid Markdown style.

### Baseline and explicit configuration

Enable the complete active rule catalog from the pinned markdownlint 0.41.1
release. Resolve its default options into a versioned QuickMark profile during
implementation, so dependency upgrades cannot silently change the convention.
Using default:false internally with every reviewed rule explicitly enabled is
acceptable; it must not recreate the original ten-rule allowlist.

The baseline rule inventory is:

- Headings: MD001, MD003, MD018, MD019, MD020, MD021, MD022, MD023, MD024,
  MD025, MD026, MD036, MD041, MD043.

- Lists: MD004, MD005, MD007, MD029, MD030, MD032.

- General spacing and blockquotes: MD009, MD010, MD012, MD013, MD027, MD028,
  MD047.

- Code: MD014, MD031, MD038, MD040, MD046, MD048.

- Links, images and HTML: MD011, MD033, MD034, MD039, MD042, MD045, MD051,
  MD052, MD053, MD054, MD059.

- Other inline styles and names: MD037, MD044, MD049, MD050.

- Thematic breaks and tables: MD035, MD055, MD056, MD058, MD060.

These inventory groups explain coverage; TASK-010.04 will define the user-facing
functional groups and their behavior. They are not a prematurely approved UI
taxonomy.

Use the pinned upstream default options unless explicitly changed below.
In particular:

- Keep MD025 at heading level 1 and MD041 at its level-1 first-heading default:
  a document should have one H1 title followed by lower-level sections.

- Keep MD022, MD031, MD032 and MD058 enabled for spacing around headings,
  fences, lists and tables.

- Keep MD013 enabled with its default 80-character limit, including headings,
  code and tables, and default non-strict behavior. Long lines are formatting
  advice even when the renderer wraps them successfully.

- Keep indentation, trailing whitespace, duplicate-heading, fence-language and
  consistent-style checks enabled. Style rules whose default is consistency
  preserve the author's initial style while flagging inconsistencies.

- Keep MD033 enabled with empty allowed_elements and table_allowed_elements.
  Explain that HTML is displayed literally by QuickMark.

- Use the normal MD052 defaults, including shortcut_syntax:false and
  ignored_labels:["x"]; remove the earlier custom override.

- MD043 and MD044 retain their default empty configuration lists. They are
  enabled but cannot impose an organization-specific outline or vocabulary
  without configuration. Do not invent required section titles or proper names.

- Set MD025 and MD041 front_matter_title to an empty string, alongside the
  existing frontMatter:null engine option: QuickMark does not treat metadata
  as a substitute for a document title.

Sources: [rule catalog][rules], [single-title options][single-title],
[line-length options][line-length] and [outline options][outline].
The implementation must verify these options against the pinned package.

### Approved compatibility exceptions

Only two rules are disabled in the initial profile:

| Rule | Exception and reason |
| --- | --- |
| MD034 | Disable bare-URL warnings because QuickMark deliberately linkifies them. |
| MD051 | Disable fragment validation because its heading-ID assumptions do not match QuickMark, which generates no heading IDs. This does not certify fragment links as usable. |

No other style or formatting rule is disabled. Every other active rule remains
in the baseline above. TASK-010.05 owns future heading-anchor support and
re-enabling validation aligned with actual Preview behavior.
Obsolete or new upstream rule IDs require a version/profile review.

Present friendly explanations with rule IDs. Distinguish formatting guidance
from syntax/structure, compatibility and accessibility advice; do not label every
formatting warning a malformed document or use the presentation categories as
independent configuration overrides.

### User control follow-up

TASK-010.04 tracks disabling and re-enabling individual rules and functional
groups, restoring defaults, persistence and configuration-aware results. It
depends on TASK-010.03 and remains To Do. Its implementation is separate from
this design task and the original manual/save-lint MVP.

Keep the profile identity explicit so the later user configuration can
invalidate old results consistently. The follow-up does not authorize
auto-fixing, custom executable rules, config-file discovery or live linting.

[rules]: https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/Rules.md
[single-title]: https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/md025.md
[line-length]: https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/md013.md
[outline]: https://github.com/DavidAnson/markdownlint/blob/v0.41.1/doc/md043.md

## Dialect and safety reconciliation

The renderer remains markdown-it 15 default-derived syntax with linkification and typography, HTML disabled, tables/strikethrough enabled, and existing restricted resource handling. The linter does not render HTML, load links/images, check disk targets or execute code.

Supported syntax may still receive formatting guidance: mixed fence styles, missing language labels and long paragraphs can render successfully while violating the selected convention. Valid hard breaks follow the configured whitespace rule rather than being forbidden indiscriminately. Keep syntax support and formatting compliance distinct. Fenced examples of unsupported syntax remain examples, not compatibility errors, although code-formatting rules may apply.

Important limit: markdownlint's parser also recognizes footnotes, math and directives. It cannot certify that a clean document renders as intended in QuickMark. HTML comments may be omitted by engine rules even though QuickMark displays them; noInlineConfig does not remove that parser difference. Task lists, footnotes, front matter, math, diagrams, definition lists, explicit anchors and resource-policy violations are not comprehensively diagnosed in this MVP. Display “No issues found with the QuickMark profile,” never “Valid Markdown” or “All syntax supported.” Document these limits next to the profile description. No masking unsupported blocks, custom parser fork or speculative compatibility rules in this design.

TASK-010.02 must exercise the existing supported/unsupported dialect fixtures and dedicated positive/negative probes for enabled rules, verifying actual warnings and documenting mismatches. Material false positives require review before changing the approved profile.

## Commands and results surface

Add a toolbar “Lint” button and Edit → Lint Markdown (no new shortcut in the MVP). They lint the captured active document's current in-memory text, including untitled/read-only documents and .txt files. Reference windows are outside the editor-tab MVP.

Lint opens a temporary two-pane inspection layout: Source on the left and Lint Results on the right, with “Preview” and “Lint Results” controls plus “Run Again” and “Return to Previous View.” Remember the prior per-tab mode, pane order and scroll positions without writing new View defaults. Within inspection, Preview and Lint Results switch the right-hand pane while Source remains visible on the left. Return to Previous View exits inspection and restores the saved normal layout. This also applies when inspection began from Input-only, Preview-only or swapped Split view. Explicit View menu/dropdown choices exit inspection and apply the user's chosen normal view. Merely opening or leaving results does not change content, dirty state or selection; deliberate issue navigation does change selection.

Results header names the document, profile, issue count and snapshot state. Sort by line, column (missing columns first), then rule ID. Rows expose line, optional column, rule, category, message, detail and bounded plain-text source context. Never insert source/error text as HTML. Render all outcomes distinctly: not run, running, issues, clean, out of date, canceled and execution failed. Run Again replaces the result set atomically; an empty result must remove prior issues.

Activating a row focuses Source and selects its reported range, or places the caret at the line start if no range is available. Normalize line endings and convert positions to textarea UTF-16 offsets with tests for CRLF, tabs and non-BMP characters; clamp invalid ranges safely. Returning to Preview preserves the resulting caret.

## Synchronization and document ownership

Lint cache belongs to stable document ID plus content revision, profile version and request ID. File path alone and whichever tab happens to be active at completion are insufficient. A late response cannot overwrite a newer run or another tab's results. Edits, reload and Clear invalidate navigation immediately. Show “Results out of date — Run Again”; keep old rows visibly stale for reference but disable source jumps. Do not lint on each keystroke. Fresh content equal to an old snapshot does not implicitly resurrect a canceled request.

Changing tabs retains each tab's results/layout. Closing destroys its cache. Approved detach behavior: retain completed results and inspection state via validated serializable transfer data; cancel in-flight manual work and offer Run Again in the destination. Do not move worker instances or DOM. Destination rechecks content/profile before enabling cached navigation. No results or sessions survive app restart.

While results are current and Sync Scrolling is on, use nearest-issue navigation rather than proportional scrolling between sparse rows and a long source document:

- User source scrolling follows the issue nearest the top visible logical source line; break ties toward the earlier issue and select the first issue on a shared line. Reveal the row without moving keyboard focus or the caret.

- User results scrolling aligns Source to the line of the first visible issue, without changing the caret.

- Explicit row activation always works even when Sync Scrolling is off.

- One issue stays stable; zero issues disables sync; before/after the issue range uses the nearest endpoint.

- Ignore programmatic counterpart events and coalesce scroll updates. Stale/running/failed results do not drive source scrolling.

Reuse source measurement principles from doc-004; do not reuse rendered-preview interpolation as if issue rows represented all source blocks. Suppress the normal source/preview controller during inspection. Preserve the normal Sync Scrolling preference.

## Lint on save

Settings → General adds “Lint after saving,” default off, application-wide across editor windows and persisted across restarts. Keep one authoritative value, synchronize open Settings controls, and surface persistence failures without pretending the setting was saved. Capture the setting when a save begins; a later toggle applies to subsequent saves. Individual/group controls are tracked by TASK-010.04 after the original MVP. Project configs and inline suppression remain outside that scope.

Lint the exact successful write snapshot, not a reread of the disk or mutable current editor text. A save receipt needs document ID, saved content/revision, operation ID and resulting path/name. Run once for each actual successful Save/Save As, including recovery saves and Save chosen during Close/Clear. External-change approval, ownership claims and failed/canceled writes retain doc-007 behavior.

| Outcome | Required behavior |
| --- | --- |
| Preference off | Existing save experience. |
| Write canceled or failed (including declined/stale overwrite approval) | No save-triggered lint and no save-complete confirmation. Preserve editing/recovery state. |
| Write succeeded; no findings | “Save complete, no linter issues found” plus filename. Dismissible immediately; automatically dismiss after five seconds. Retain a clean result in the tab cache. |
| Write succeeded; findings | Modal “Save complete for [name]. N linter issues were found. Would you like to view them?” Explicit Yes/No, with No initially focused. No timeout, Escape/backdrop dismissal or ambiguous native-window dismissal. |
| Yes | Focus the originating tab and open its saved-snapshot results. If content has changed, label results out of date and disable inaccurate source jumps. |
| No | Close the prompt and retain results for later inspection; no content or view change. |
| Write succeeded; lint failed/timed out/canceled | Durable dismissible “Save complete for [name], but linting [failed/timed out/was canceled].” Offer Run Again; never imply clean results or a failed write. |
| Write succeeded; Recent Files update failed | Preserve/report the history error separately and still lint the successful write receipt. Do not infer write failure from generic OperationOutcome.status. |

From successful write receipt until save-lint feedback is resolved, retain the originating document and defer its close, Clear and detach; allow unrelated tab selection. Do not discard pending save feedback as a superseded manual job. Save dialogs and issue prompts must identify the originating document even if another tab is active. Queue prompts rather than stack modals or switch unrelated windows. A window-close attempt while the durable Yes/No prompt is open keeps that window open and brings the prompt forward.

Approved Close/Clear rule: Yes opens results and cancels the pending destructive action, with the file already saved; No continues that action. Clean results continue without requiring a five-second wait. A lint failure continues only after the user dismisses its factual failure notice, unless they choose Run Again; it never undoes the write. During Close Window, process documents sequentially; Yes stops the remaining close sequence, leaving prior successful saves intact. This continuation choice must be separate from filesystem save status. Existing ancillary-save-error close behavior should not be silently changed.

## Accessibility and responsiveness

Use labeled regions, native buttons and a semantic issue list. Provide Previous Issue/Next Issue buttons so large lists do not require tabbing through every row; keyboard activation moves focus intentionally. Retain visible focus and a route back to results. Announce run completion/count through a polite live region once, not every scroll or row. Findings/staleness cannot rely on color. HTML prompts have accessible titles, contained focus and explicit focus restoration. Verify at narrow native window sizes and with keyboard-only interaction.

Run parsing off the UI thread. One active job per window, bounded queue, latest manual request wins; save jobs remain tied to their write receipts. Provide Cancel while linting and keep editing usable outside existing file-operation/modal locks. Initial timeout: 10 seconds, with terminate/recreate worker and truthful timeout state, never main-thread retry. Render results incrementally in batches of 200 with “Load more”; retain the full count and reveal the target batch for issue navigation. No silent document truncation or arbitrary successful partial result.

Implementation performance probes: 1 MiB and 5 MiB mixed Markdown, a 50,000-line document, one long wrapped line and thousands of findings. Record timing/platform and verify typing/cancellation, tab switching, bounded row rendering and no scroll feedback loops. Thresholds are initial budgets, not measured guarantees. Worker failure or unsupported runtime is a visible lint failure; saves still retain their true outcome.

## Boundaries and verification handoff

Individual and functional-group rule controls are tracked in TASK-010.04. Heading anchors and aligned fragment linting are tracked in TASK-010.05. Both remain To Do; neither is implemented by this specification. Further work requires separate authorization: auto-fix, lint-on-type, custom JavaScript rules, config discovery, per-project controls, full renderer compatibility diagnostics, links/filesystem validation, reference-window linting and persisted result history.

TASK-010.01 received explicit user approval. The final document audit maps AC1 to engine/integration, AC2 to the complete profile, AC3 to dialect/safety, AC4 to commands/sync/ownership, AC5 to the save matrix, AC6 to accessibility/responsiveness/boundaries, and AC7 to approved status and durable references.

For later implementation, verify:

1. Rule positive/negative cases and dialect fixtures, including code samples, literal HTML, bracketed text and valid table variations.

2. Empty/clean/issues/failure/cancel states; Input/Preview/Split and swapped-pane restoration; explicit View changes; Unicode range navigation; sparse and same-line issues.

3. Edit/reload/Clear invalidation, stale worker replies, tab switching, closed documents and successful/failed detach.

4. Every save-matrix row, saved-snapshot identity, history-update failure after write, recovery/overwrite races, settings persistence failure and multi-window synchronization.

5. Keyboard navigation, actual five-second confirmation timing, durable Yes/No behavior, Close/Clear Yes/No continuation and native modal/window focus.

6. Focused frontend tests, full suite/build and relevant Rust transfer/settings checks; native worker/CSP/performance checks on supported test platforms.

No app code, dependency installation, test fixture edits, commits, pushes or other task starts are part of the present research deliverable.
