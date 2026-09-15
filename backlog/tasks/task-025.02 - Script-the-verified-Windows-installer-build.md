---
id: TASK-025.02
title: Script the verified Windows installer build
status: Done
assignee:
  - Codex
created_date: '2026-09-15 02:52'
updated_date: '2026-09-15 13:45'
labels:
  - enhancement
  - windows
dependencies: []
documentation:
  - docs/build-windows.md
  - docs/release-verification.md
modified_files:
  - scripts/build-windows.ps1
  - tests/build-windows.test.ts
  - docs/build-windows.md
parent_task_id: TASK-025
priority: medium
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Windows guide requires manually running dependency installation, frontend and Rust verification, then NSIS packaging. Provide one repeatable command from an existing checkout on a prepared Windows development machine, with clear progress and failure reporting. User requested feasibility assessment and explicitly authorized creating and implementing this task if feasible. Existing commands and Windows bundle configuration make it feasible; prerequisite installation and interactive installer smoke review remain documented manual steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One documented command runs locked dependency installation, all documented automated build checks, and produces the Windows NSIS installer from a prepared checkout.
- [x] #2 Missing prerequisites or a failed command produce an actionable error and nonzero exit without running later build stages or reporting stale artifacts as a successful build.
- [x] #3 The script locates the checkout independently of the caller's working directory and reports the resulting executable and installer paths on success.
- [x] #4 The Windows guide documents usage, prerequisites, network requirements, and remaining manual installer review; automated script failure checks and a real installer build are recorded.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add scripts/build-windows.ps1, compatible with Windows PowerShell 5.1 and PowerShell 7, resolving checkout from PSScriptRoot. Include a read-only -Plan command preview.
2. Preflight Windows x64, required command availability and supported Node/MSVC Rust host. Run npm ci with engine checking, frontend tests/build/production-worker check, Rust tests/fmt/check and locked Tauri NSIS build sequentially with explicit exit checks. Report verified current installer and executable paths.
3. Update Windows guide with one-command use, manual prerequisites, network/download behavior and installer smoke review.
4. Add focused script orchestration checks for plan mode, cwd independence, missing tools, nonzero exits and artifact reporting; execute real full Windows installer build. Record results, mark Done only on verified acceptance criteria, and ask before committing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Feasibility confirmed from local build-windows.md, package scripts and Tauri Windows configuration. User authorized task creation and implementation. TASK-027 committed/pushed separately as c0c1324.

Implemented PowerShell 5.1/7 build entry point and -Plan preview; sequential checked native exit codes, Node/toolchain preflight, full documented checks, pinned packaging output directory and newly written installer validation. Added six Windows orchestration tests using disposable tool stubs (no real installs from tests). All six and 12 bundled-guide tests pass. Starting real end-to-end installer build.

Real run: npm ci --engine-strict succeeded with zero vulnerabilities; npm warned existing esbuild postinstall lacks allowScripts coverage. No config change or approval bypass applied. All 52 test files / 354 tests pass, TypeScript/Vite build and production-worker verification pass. Rust/native packaging stages underway. Failure-path tests confirm nonzero exit, no later stages, missing prerequisite diagnostics and rejection of stale installer artifacts.

End-to-end build completed successfully with exit 0: locked npm installation, 354 JavaScript/TypeScript tests (52 files), 50 Rust tests, TypeScript/Vite, production-worker check, cargo fmt/check and release NSIS packaging. Script confirmed the newly written installer and printed both artifact paths. Installer: src-tauri/target/release/bundle/nsis/QuickMark_0.1.0_x64-setup.exe (2,402,942 bytes, written 2026-09-14 20:58 local). Windows PowerShell 5.1 orchestration tests verify invocation from another cwd and a checkout path containing spaces; real pipeline ran in PowerShell 7. git diff --check passes. npm allowScripts warning did not block the build; no dependency policy changes made. Installer installation/smoke test is documented as a manual post-build step and was not performed. Implementation and task metadata await separate commit approval.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Provide scripts/build-windows.ps1 as a single command for verified Windows x64 NSIS builds. Include a read-only -Plan preview, prerequisite checks, locked dependency installation, all documented frontend/worker/Rust checks, explicit native exit handling and current-installer validation. Resolve the checkout from the script path and report executable/installer locations. Update the Windows guide with usage, network requirements and manual installer review.

Verification: 354 JavaScript/TypeScript tests and 50 Rust tests pass, including six Windows script orchestration cases for plan mode, cwd/spaces, failed native commands, missing tools, old Node and stale artifacts. TypeScript/Vite, production worker, Rust formatting/compile checks and real release NSIS build all pass. The generated installer was verified on disk. npm emitted an existing esbuild allowScripts warning; no policy changes were needed. Installation and UI smoke review remain documented manual release steps.
<!-- SECTION:FINAL_SUMMARY:END -->
