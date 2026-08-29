---
id: TASK-002.13
title: Source and display richer About metadata
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-28 20:53'
updated_date: '2026-08-29 02:50'
labels:
  - enhancement
dependencies:
  - TASK-002.12
documentation:
  - >-
    backlog/docs/architecture/doc-003 -
    QuickMark-application-metadata-authority-and-propagation.md
modified_files:
  - >-
    backlog/docs/architecture/doc-003 -
    QuickMark-application-metadata-authority-and-propagation.md
  - build/app-metadata.ts
  - index.html
  - package.json
  - package-lock.json
  - src/about-metadata.ts
  - src/app-metadata-env.ts
  - src/main.ts
  - src/styles.css
  - src-tauri/Cargo.toml
  - src-tauri/Cargo.lock
  - src-tauri/capabilities/about.json
  - src-tauri/src/lib.rs
  - src-tauri/tauri.conf.json
  - tests/about-metadata.test.ts
  - vite.config.ts
parent_task_id: TASK-002
priority: low
type: enhancement
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expand QuickMark's About experience with version, creator/maintainer attribution, repository URL, and other agreed project details without duplicating hard-coded metadata across application code and manifests. Decide authoritative metadata sources and build-time/runtime propagation before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The authoritative source for version, creator or maintainer, repository URL, and other displayed project metadata is documented
- [x] #2 About displays the agreed metadata without duplicating literals across frontend code and project manifests
- [x] #3 Version information stays synchronized with packaged application versions
- [x] #4 Repository information is presented accessibly and opens safely if made interactive
- [x] #5 Automated coverage verifies metadata propagation and About rendering
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Make `src-tauri/tauri.conf.json` authoritative for displayed/package metadata: product name, version, bundle publisher, homepage, and short description. Document this source and propagation contract in a Backlog architecture decision.
2. Add a typed Vite build-time metadata loader that validates those manifest fields and defines one immutable frontend metadata object; fail the build if required metadata or an HTTPS repository URL is missing/invalid.
3. Add a focused About module that renders the injected metadata into accessible dialog fields and routes repository activation through a dependency-injected opener with visible failure reporting.
4. Install/register Tauri's official opener plugin and grant the main window only an exact-URL `openUrl` scope for the repository; keep reference windows outside that permission.
5. Update the About markup/styles to show description, version, creator, and a keyboard-accessible repository control while preserving Close, Escape, backdrop dismissal, and focus behavior.
6. Add unit/static integration tests for manifest propagation, validation, rendering, exact opener scope, safe activation, and error handling; run frontend/Rust suites, production/native builds, formatting/Cargo/diff checks, and a native About/open-link smoke test before finalization.

Apply interactive-review polish: override the global button focus treatment for the repository control with a compact text-link focus indicator that remains keyboard-visible without surrounding the wrapped URL in a heavy rounded border.

Apply final responsive sizing feedback: size the About dialog in font-relative units with a viewport cap so normal repository URLs remain on one line when space permits, larger user fonts expand the dialog proportionally, and narrow displays still wrap without horizontal overflow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.12 is Done and the worktree is clean. Researching current About markup/controller behavior, Tauri/package metadata sources, Vite compile-time propagation, safe URL opening, and existing test conventions before recording the implementation plan.

Research decision: treat `src-tauri/tauri.conf.json` as the single authoritative source because its version and bundle metadata directly drive Tauri packages. Add `bundle.publisher` for Bryan Keary; reuse existing `productName`, `version`, `bundle.homepage`, and `bundle.shortDescription`. Vite will validate and inject those values at build time, so frontend code contains no duplicated metadata literals. Use Tauri's official opener plugin with an exact repository URL capability instead of unrestricted browser navigation.

Created architecture specification doc-003 documenting the authoritative Tauri manifest fields, build-time propagation, release-version workflow, and exact-scope external-link policy. Installed and registered the official opener plugin; capability scoping and frontend integration remain in progress.

Interactive verification passed metadata display, repository opening, and all modal dismissal paths. One visual issue remains before completion: the repository button inherits an overly heavy global focus ring. User requested a less obtrusive treatment; retain an accessible keyboard focus cue while styling it specifically as a text link.

User confirmed the subtler repository focus treatment. Final review found the fixed 26rem dialog unnecessarily wraps the repository URL; adjust to a font-relative responsive width rather than forcing no-wrap behavior.

Completed implementation and review polish. The Tauri manifest now owns product name, version, publisher, homepage, and description; Vite validates and injects them through a typed boundary. About renders those values, and the official opener plugin is registered with a main-window-only exact repository scope. The architecture contract is preserved in doc-003.

Final verification: 113/113 frontend tests across 14 files, 6/6 Rust tests, TypeScript/Vite production build, Tauri native debug no-bundle build, `cargo fmt --check`, `cargo check`, and `git diff --check` all pass. User native review confirmed correct metadata, default-browser repository opening, Close/Escape/backdrop dismissal, the revised subtle keyboard focus treatment, and responsive font-relative modal sizing with the URL on one line at normal size.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Expanded QuickMark's About dialog with version, creator, description, and repository metadata sourced from the same Tauri manifest used for packaging. Added validated build-time propagation so frontend literals cannot drift from distributable versions, documented the authority/release contract in architecture doc-003, and integrated Tauri's opener plugin with an exact-URL capability limited to the main window. Added accessible repository activation with visible error handling, responsive font-relative dialog sizing, and a restrained keyboard focus treatment. Verified with 113 frontend tests, 6 Rust tests, production and native debug builds, Cargo/rustfmt/diff checks, and successful user-confirmed native interaction and visual review.
<!-- SECTION:FINAL_SUMMARY:END -->
