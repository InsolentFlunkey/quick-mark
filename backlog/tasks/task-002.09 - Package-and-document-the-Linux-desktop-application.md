---
id: TASK-002.09
title: Package and document the Linux desktop application
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-28 03:47'
updated_date: '2026-08-29 01:38'
labels:
  - enhancement
dependencies:
  - TASK-002.08
modified_files:
  - README.md
  - src-tauri/tauri.conf.json
  - src-tauri/tauri.linux.conf.json
  - src-tauri/linux/QuickMark.desktop
parent_task_id: TASK-002
priority: medium
type: enhancement
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the migrated QuickMark desktop application straightforward to build, install, and launch on the maintainer's Linux environment, with accurate project documentation for ongoing development and use.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A distributable Linux application package is produced successfully
- [x] #2 The packaged application launches and completes a basic open-edit-save verification
- [x] #3 Build and packaging commands are documented from a clean developer checkout
- [x] #4 Runtime and development prerequisites are clearly distinguished
- [x] #5 User documentation describes installation, launch, supported file types, and current platform limitations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add `src-tauri/tauri.linux.conf.json` to enable the Tauri RPM bundle only on Linux, and add shared bundle metadata/file associations to `src-tauri/tauri.conf.json` without pre-empting TASK-002.10.
2. Update `README.md` with separate end-user and developer sections: Fedora runtime installation/launch/removal, supported file types and limitations, Fedora build prerequisites, and reproducible clean-checkout install/test/package commands.
3. Produce a release RPM with `npm run tauri build -- --bundles rpm`; inspect its metadata, payload, desktop entry, icons, executable, dependencies, and file associations.
4. Install or extract the generated RPM as appropriate, launch the packaged executable, and perform a basic open-edit-save smoke test against a disposable Markdown file without modifying repository fixtures.
5. Run the frontend/Rust suites, production build, formatting/Cargo checks, README/config validation, and task-scoped diff checks; record objective evidence for every acceptance criterion before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started after confirming dependency TASK-002.08 is complete and TASK-002.09 is the highest-priority ready implementation task. Researching current Tauri bundle configuration, existing documentation, Linux tooling/prerequisites, and clean-checkout build commands before recording the implementation plan.

Research result: use Tauri 2's native RPM bundler because the maintainer environment is Fedora and `rpm` is installed. Keep Windows packaging deferred to TASK-002.10. The generated RPM should supply the executable, desktop entry, icons, runtime dependency metadata, and `.md`/`.markdown`/`.txt` associations. Documentation will distinguish end-user RPM requirements from Rust/Node/WebKitGTK development packages and warn that Linux artifacts inherit the build host's glibc compatibility baseline.

Routine plan refinement: keep `bundle.active` and the RPM target in Tauri's supported platform-specific `tauri.linux.conf.json`; put only cross-platform application metadata and file associations in the base config. This prevents Linux packaging settings from breaking the future Windows packaging task.

Implementation completed: added shared bundle metadata and Markdown/text file associations, enabled RPM bundling only through `tauri.linux.conf.json`, and supplied a custom RPM desktop template with `%F` so desktop Open With actions forward selected files. Reworked README installation/development guidance and corrected the documented case-sensitive artifact filename after inspecting actual output.

Verification evidence: `npm test` passed 107/107 tests across 13 files; `cargo test` passed 6/6; `npm run tauri build -- --bundles rpm` produced `QuickMark-0.1.0-1.x86_64.rpm`; `cargo fmt --check` and `cargo check` passed. RPM inspection confirmed name/version/architecture/URL/summary, WebKitGTK and GTK runtime dependencies, executable, three icon sizes, desktop entry, `text/markdown` and `text/plain` MIME types, `Exec=quick-mark %F`, valid digests, and no unresolved linked libraries.

Packaged-app manual verification: launched `/usr/bin/quick-mark` from an isolated extraction of the generated RPM with `/tmp/quick-mark-package-smoke.md`; the user opened it, edited the document, saved, and closed. The packaged process exited 0 and the file contains the new text. Task-scoped `git diff --check` passes. The repository-wide check reports only pre-existing whitespace in the user's unrelated `AGENTS.md` edit, which is excluded from this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Enabled Fedora RPM packaging without imposing Linux targets on other platforms. Added production bundle metadata, icons, Markdown/text associations, and a custom desktop entry that correctly forwards selected files. Reorganized README documentation to distinguish RPM runtime installation from clean-checkout development prerequisites and commands, and documented supported formats plus current distribution limitations. Verified the generated RPM structurally and through a successful user-performed packaged open-edit-save-close smoke test, alongside 107 frontend tests, 6 Rust tests, release/frontend builds, Cargo check, rustfmt, dependency/link inspection, digest validation, and scoped diff validation.
<!-- SECTION:FINAL_SUMMARY:END -->
