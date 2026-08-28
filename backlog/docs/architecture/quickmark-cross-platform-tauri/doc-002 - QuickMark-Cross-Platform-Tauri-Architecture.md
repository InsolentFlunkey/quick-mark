---
id: doc-002
title: QuickMark Cross-Platform Tauri Architecture
type: specification
created_date: '2026-08-28 05:06'
tags:
  - architecture
  - tauri
  - cross-platform
  - task-002
  - task-002.01
---
## Status

Accepted for the TASK-002 migration initiative.

## Decision

QuickMark will migrate incrementally from its single-file browser application to a Tauri 2 desktop application with a Vite and vanilla TypeScript frontend. Linux and Windows are the initial supported platforms. Shared application behavior must remain platform-neutral so additional Tauri-supported desktop platforms are not unnecessarily excluded.

This decision supersedes any WPF/WinForms recommendation recorded in TASK-001 or earlier revisions of doc-001. It confirms the current Tauri recommendation in doc-001 while adding the cross-platform requirement.

## Context

The legacy QuickMark.html page combines Markdown rendering, editor behavior, UI state, persistence, and browser-oriented file workarounds. Browser sandbox constraints prevent dependable save-in-place behavior. The desktop migration exists to provide real filesystem operations without discarding working rendering and editing behavior.

The maintainer develops on Fedora Linux and also uses QuickMark on Windows. The project may be published as open source, so development and distribution conventions must not assume one workstation or operating system.

## Boundaries

- `src/` contains portable frontend behavior and presentation.
- `src-tauri/` contains the native shell, Tauri configuration, capabilities, and platform integration.
- Platform-specific behavior must be isolated behind explicit interfaces rather than branching throughout shared UI code.
- `QuickMark.html` and `Start-QuickMark.ps1` remain intact during migration so the existing application stays usable.
- The legacy browser viewer's final disposition is deferred to TASK-002.08 after desktop feature parity.
- Native open/save, document lifecycle, and other product behavior are delivered by their dedicated migration subtasks, not by the foundation task.

## Foundation

The initial foundation uses Tauri 2, Vite, vanilla TypeScript, npm, and Rust stable. It deliberately avoids a frontend component framework. This keeps the migration close to the existing HTML/CSS/JavaScript implementation while introducing modules, dependency locking, build checks, and a native application boundary.

The baseline capability grants only Tauri core defaults. Native plugins and their permissions are added by the subtasks that require them.

## Platform targets

### Linux

Development begins on Fedora Linux 44 using WebKitGTK 4.1. TASK-002.09 owns distributable Linux packaging and installation documentation.

### Windows

Windows uses the Tauri WebView2 runtime and the MSVC Rust toolchain. Shared application code must not depend on Linux paths, shell commands, or WebKitGTK behavior. TASK-002.10 owns Windows build verification, packaging, and installation documentation.

## Consequences

- Existing browser code is migrated in small, independently verified units rather than rewritten wholesale.
- Native filesystem behavior can be implemented consistently at the product level while platform integration remains isolated.
- Linux and Windows builds require their platform-specific native toolchains and must be verified independently.
- Maintaining the browser viewer after parity is a conscious product decision rather than an accidental duplicate application.
