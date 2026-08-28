---
id: doc-002
title: QuickMark Cross-Platform Tauri Architecture
type: specification
created_date: '2026-08-28 05:06'
updated_date: '2026-08-28 19:58'
tags:
  - architecture
  - tauri
  - cross-platform
  - task-002
  - task-002.01
  - task-002.08
---
## Status

Accepted for the TASK-002 migration initiative and updated by TASK-002.08 after desktop feature parity.

## Decision

QuickMark is a Tauri 2 desktop application with a Vite and vanilla TypeScript frontend. Linux and Windows are the initial supported platforms. Shared application behavior remains platform-neutral so additional Tauri-supported desktop platforms are not unnecessarily excluded.

The former `QuickMark.html` browser application is retired and removed. Its zero-install convenience does not justify maintaining a second viewer surface, browser-specific dependency loading, generated content, or filesystem workarounds. The Tauri application is the sole supported QuickMark product.

This decision supersedes any WPF/WinForms recommendation recorded in TASK-001 or earlier revisions of doc-001. It also resolves the viewer/editor split proposed by doc-001 in favor of one desktop product.

## Context

The original browser page combined Markdown rendering, editor behavior, UI state, persistence, and browser-oriented file workarounds. Browser sandbox constraints prevented dependable save-in-place behavior. The desktop migration provides real filesystem operations while retaining the proven rendering and editing behavior in reusable modules.

A viewer-only browser page was considered after desktop parity. Its limited quick-reference value would still require a duplicate UI and compatibility/test surface. README and Markdown examples belong in non-destructive desktop reference experiences instead.

The maintainer develops on Fedora Linux and also uses QuickMark on Windows. The project may be published as open source, so development and distribution conventions must not assume one workstation or operating system.

## Boundaries

- `src/` contains portable frontend behavior and presentation.
- `src-tauri/` contains the native shell, Tauri configuration, capabilities, and platform integration.
- `shared/` contains focused renderer, editor-behavior, and Markdown presentation assets consumed by the desktop frontend.
- Platform-specific behavior is isolated behind explicit interfaces rather than branching throughout shared UI code.
- No supported workflow depends on `QuickMark.html`, a PowerShell browser launcher, generated launch content, generated README JavaScript, browser downloads, or browser content persistence.
- Native open/save, document lifecycle, reference content, menus, packaging, and other product behavior are delivered by their dedicated migration subtasks.

## Foundation

The foundation uses Tauri 2, Vite, vanilla TypeScript, npm, and Rust stable. It deliberately avoids a frontend component framework. This keeps the frontend small while providing modules, dependency locking, build checks, and a native application boundary.

Tauri capabilities remain minimal. Native plugins and permissions are added only by the tasks that require them.

## Platform targets

### Linux

Development begins on Fedora Linux 44 using WebKitGTK 4.1. TASK-002.09 owns distributable Linux packaging and installation documentation.

### Windows

Windows uses the Tauri WebView2 runtime and the MSVC Rust toolchain. Shared application code must not depend on Linux paths, shell commands, or WebKitGTK behavior. TASK-002.10 owns Windows build verification, packaging, and installation documentation.

## Consequences

- QuickMark has one supported product surface and one set of viewer/editor interactions to maintain.
- Native filesystem behavior is consistent at the product level while platform integration remains isolated.
- Shared renderer/editor assets remain modular for testing and desktop consumption, not to support a second browser application.
- Linux and Windows builds require their platform-specific native toolchains and must be verified independently.
- Users build, install, and launch the Tauri application; the old double-click HTML and PowerShell launcher workflows no longer exist.
