---
id: TASK-025.01
title: 'Build, package, and document QuickMark on Windows'
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-13 00:26'
updated_date: '2026-09-13 13:59'
labels:
  - enhancement
  - windows
dependencies: []
modified_files:
  - README.md
  - src-tauri/tauri.windows.conf.json
  - src-tauri/src/editor_coordinator.rs
  - tests/desktop-parity.test.ts
  - scripts/check-lint-worker.mjs
parent_task_id: TASK-025
priority: high
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the first verified Windows build procedure on the maintainer's Windows PC. Cover developer prerequisites, locked dependency installation, automated checks, release packaging, and native open/edit/save/menu/reference-window verification. Document installation, launch, file associations, and current limitations. This is the initial milestone of TASK-025 (formerly DRAFT-001); ongoing release automation and maintenance are outside this task. The user approved proceeding with Windows build verification, packaging, and documentation before further editor features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The chosen Windows installer format and runtime/development prerequisites are documented.
- [x] #2 Locked dependencies, frontend checks, Rust checks, and release packaging succeed on Windows with recorded commands and tool versions.
- [x] #3 A Windows release artifact launches and passes native open-edit-save, menu, and reference-window verification.
- [x] #4 README documents reproducible Windows development/build commands, artifact locations, installation/launch, file associations, and verified limitations.
- [x] #5 The discovered Rust fixture path, obsolete frontend layout assertion, and production-worker import issues are corrected without skipping checks or altering application behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved scope from user's 'please proceed': verify prerequisites; install locked dependencies; run frontend/Rust checks; enable Windows release packaging; perform native open/edit/save/menu/reference-window smoke verification; document reproducible commands and limitations. Implementation detail: use Tauri's NSIS .exe installer, current-user install, default WebView2 download bootstrapper, with Windows-only tauri.windows.conf.json so Linux RPM settings remain unchanged. Record detected tool versions and actual artifact paths. User review is needed for native UI steps if no native-control tool is available. Do not mark Done without that evidence. Ask before commits.

User approved fixing the discovered test and verification-script issues. Canonicalize the Rust fixture root so raw owner_key test assertions use real registry identities on Windows; retain production path/alias coverage. Replace obsolete grid assertion with assertions for bounded flex layout. Import production lint artifact through pathToFileURL. Rerun frontend, worker, Rust tests and formatting; then build NSIS release and document verified results.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Preflight: clean Git working tree verified outside sandbox (sandbox could not read user Git ignore). Node 22.17.0, npm 11.17.0, Rust/Cargo 1.94.0, stable-x86_64-pc-windows-msvc, Visual Studio 18 BuildTools with VC tools. node_modules absent, allowing locked installation verification. Windows reports build 26200, 64-bit. rg WinGet shim is a symlink; investigating failed sandbox launch separately.

npm ci installed 144 packages with zero reported vulnerabilities but warned that installed Node 22.17.0 is unsupported: jsdom 30.0.1 needs ^22.22.2 || ^24.15.0 || >=26.0.0; undici needs >=22.19.0. Tests/build are pending a supported Node upgrade, not treating warning as success. WinGet offers OpenJS.NodeJS.22 22.23.2; asked user before changing system Node. npm 11.17 also warned about esbuild postinstall allowScripts policy; investigate actual build behavior after upgrade without bypassing policy. WebView2 152.0.4191.66 and Windows SDK 10.0.22621.0/10.0.26100.0 installed.

cargo fmt --check passed. cargo test --locked compiled successfully on Windows, then failed 8/49 coordinator tests (41 passed). Seven failures use owner_key with uncanonicalized fixture paths; Windows canonicalize introduces the verbatim path prefix, so raw paths do not match registry keys. The moved-parent transfer test similarly supplies the noncanonical path after renaming its directory, forcing canonicalization of a now-missing parent. No tests skipped or altered. Need authorize a focused test portability fix after confirming production flow. README and Windows-only NSIS config drafted. PowerShell npm.ps1 swallowed -- separators in a help check; npm.cmd correctly forwarded them. Documented npm.cmd build command passes final --locked to Cargo.

User explicitly approved upgrading Node only. Started WinGet upgrade of OpenJS.NodeJS.22 to 22.23.2; downloaded MSI hash verified. Windows installer may require the user's UAC response. Rust test-path corrections remain unapproved and unchanged.

Verified completed Node upgrade: node --version v22.23.2, npm 11.17.0; WinGet installed inventory also reports 22.23.2 (its source refresh warned/faulted, but local executable version verified directly). npm.cmd run build passed TypeScript and Vite production build. npm.cmd test: 311 passed, 1 failed across 46 files. Existing tests/desktop-parity.test.ts:50 still expects grid-template-rows on .app-shell, whereas existing CSS uses flex; no application/test edits made. node scripts/check-lint-worker.mjs fails ERR_UNSUPPORTED_ESM_URL_SCHEME because dynamic import interpolates a Windows absolute path rather than a file URL; needs pathToFileURL conversion. These and the prior 8 Rust fixture failures are unresolved; user has approved Node upgrade only, not test/script fixes.

Approved fixes verified: all 312 frontend tests across 46 files pass; all 49 Rust tests pass with canonical fixture root; cargo fmt --check and production worker checks pass. No tests disabled and no production behavior changed. Started documented Windows release command npm.cmd run tauri -- build --bundles nsis -- --locked.

cargo check --locked passed. Host confirmed through Win32_OperatingSystem as Windows 11 Pro 10.0.26200 x64. README now documents NSIS runtime/developer prerequisites, install/launch/file associations, manual update limitations, and concrete native smoke steps. Release compilation is still underway; need rebuild frontend/release afterward to embed final README (reference.ts imports README raw). Native UI verification remains pending.

Final NSIS release build succeeded with documented locked Cargo command after rebuilding to embed final Windows README. Artifact: src-tauri/target/release/bundle/nsis/QuickMark_0.1.0_x64-setup.exe, 2,346,766 bytes, Product QuickMark 0.1.0, unsigned. SHA256 3891A1934F9A812B92736CDD4D45D3234170EA3115F320535F4331B667CE406C. Generated NSIS script confirms currentUser, RequestExecutionLevel user, WebView2 downloadBootstrapper, and md/markdown/txt associations. git diff --check passed. Restored only verified line-ending-only Cargo.toml rewrite produced by Tauri; no manifest semantic change. Native install/launch/open-edit-save/menu/reference-window verification still requires user interaction; AC3 deliberately unchecked and task stays In Progress. No commits created.

User confirmed the supplied native verification checklist with 'OK, that's working great!' and reviewed the installed README. Native installation/launch, document operations, menus and reference windows accepted. User requested documentation restructuring separately as TASK-026 and explicitly approved committing/pushing it separately from the Windows build work.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Enable unsigned current-user Windows NSIS packaging with WebView2 bootstrapper and document prerequisites, source builds, artifact locations, installation, and smoke verification. Correct Windows Rust fixture canonicalization, production-worker file URL imports, and an obsolete layout assertion without changing application behavior. Verified 312 frontend tests, 49 Rust tests, rustfmt, Cargo check, production worker, and NSIS release build; user accepted native smoke verification. Windows maintenance and documentation restructuring remain separate follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
