---
id: TASK-002.01
title: Establish the Tauri development foundation
status: Done
assignee:
  - Codex
created_date: '2026-08-28 03:44'
updated_date: '2026-08-28 05:08'
labels:
  - enhancement
dependencies: []
documentation:
  - backlog/docs/doc-001 - QuickMark-Viewer-Editor-Split-Investigation.md
  - >-
    backlog/docs/architecture/quickmark-cross-platform-tauri/doc-002 -
    QuickMark-Cross-Platform-Tauri-Architecture.md
parent_task_id: TASK-002
priority: high
type: enhancement
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prepare QuickMark for cross-platform desktop development, beginning on the maintainer's Linux workstation. Establish a minimal Tauri application foundation, verify the required local toolchain, and record the adopted architecture and development prerequisites. Linux and Windows are the initial supported targets, and platform-specific assumptions must be isolated. Preserve the existing application during this foundation work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Required Rust, JavaScript, system-library, and Tauri prerequisites are documented for development on the detected Linux distribution
- [x] #2 The desktop application can be launched successfully in development mode on the Linux workstation
- [x] #3 A production Linux build completes successfully
- [x] #4 The application foundation avoids Linux-specific assumptions in shared application code and identifies platform-specific integration points
- [x] #5 The existing QuickMark application remains available during the migration
- [x] #6 A Backlog architecture document records the cross-platform Tauri decision, initial Linux and Windows targets, migration boundaries, and supersedes conflicting recommendations from the earlier investigation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Assess and document the Fedora 44 workstation baseline and official Tauri prerequisites.
2. Install the Fedora native dependencies and user-local stable Rust toolchain while retaining the existing Node.js installation.
3. Add a minimal Tauri 2 + Vite + vanilla TypeScript application alongside the untouched QuickMark.html application, including generated cross-platform icon assets.
4. Keep frontend code platform-neutral and isolate the native shell and capabilities under src-tauri.
5. Verify the TypeScript/Vite build, Cargo checks, production Tauri build, and a graphical Tauri development launch on Fedora.
6. Create a Backlog architecture document recording Linux and Windows as initial targets, migration boundaries, platform integration points, and supersession of conflicting prior recommendations.
7. Document verified Fedora prerequisites and development/build commands in README.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Workstation assessment: Fedora Linux 44 KDE x86_64. Node v22.23.1, npm 10.9.8, and pkg-config 2.5.1 are installed. rustc, cargo, rustup, gcc, WebKitGTK 4.1 development metadata, and JavaScriptCoreGTK 4.1 development metadata are not currently available.

Official Tauri prerequisites currently specify Fedora packages: webkit2gtk4.1-devel, openssl-devel, curl, wget, file, libappindicator-gtk3-devel, librsvg2-devel, libxdo-devel, plus the c-development package group. Rust is installed through rustup. Existing Node satisfies the JavaScript frontend prerequisite.

Installed the user-local minimal stable Rust toolchain through the official rustup installer. Verified rustc 1.98.0 and cargo 1.98.0.

Native Fedora dependency installation could not run because sudo requires the workstation user's password in an interactive terminal. The user must run: sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel libxdo-devel @c-development. gcc and WebKitGTK 4.1 remain unavailable until that completes.

Foundation implementation completed with Tauri 2, Vite 6, vanilla TypeScript, npm and Cargo lockfiles, a baseline core-only capability, and generated platform icon assets. Bundler packaging is disabled for this foundation because Linux and Windows packaging are owned by TASK-002.09 and TASK-002.10.

Verification evidence: `npm run build` passed; `cargo check --manifest-path src-tauri/Cargo.toml` passed; `npm run tauri build` completed the optimized release profile and produced `src-tauri/target/release/quick-mark`; `npm run tauri dev` started Vite, compiled the debug application, launched `target/debug/quick-mark`, and remained running until the verification session was stopped.

Legacy preservation evidence: `git diff --quiet -- QuickMark.html` and `git diff --quiet -- Start-QuickMark.ps1` both confirmed no changes. Architecture record created as doc-002. README now contains the verified Fedora prerequisites and desktop development commands.

Environment note: IDE terminals opened before rustup installation may not see Cargo until restarted. Verification used the explicit user Cargo path for the current session.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Established QuickMark's cross-platform desktop foundation using Tauri 2, Vite, vanilla TypeScript, and Rust while preserving the existing browser application unchanged. Added a minimal platform-neutral frontend, a core-only Tauri capability boundary, application configuration, lockfiles, and generated desktop/platform icon assets. Documented verified Fedora 44 prerequisites and development/build commands in README.md, and created doc-002 to record Linux and Windows as the initial targets and supersede the earlier conflicting architecture recommendation.

Verification: `npm run build`, Cargo check, and `npm run tauri build` all pass; the optimized Linux executable was produced successfully. A graphical `npm run tauri dev` session compiled and launched the debug QuickMark process successfully. Packaging remains intentionally disabled until the dedicated Linux and Windows packaging subtasks.
<!-- SECTION:FINAL_SUMMARY:END -->
