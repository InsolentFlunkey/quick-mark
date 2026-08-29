---
id: doc-003
title: QuickMark application metadata authority and propagation
type: specification
created_date: '2026-08-29 02:29'
tags:
  - architecture
  - metadata
  - packaging
---
# Decision

QuickMark's Tauri manifest, `src-tauri/tauri.conf.json`, is the authoritative source for application identity metadata shown to users and embedded in platform packages.

The About experience uses:

- `productName` for the application name
- `version` for the displayed and packaged version
- `bundle.publisher` for creator or maintainer attribution
- `bundle.homepage` for the repository URL
- `bundle.shortDescription` for the concise description

# Propagation

`vite.config.ts` reads and validates the manifest during frontend configuration, then injects one typed, immutable metadata object for frontend use. A missing required field or non-HTTPS homepage fails the build rather than silently producing incomplete About information.

Frontend modules must consume that injected object and must not repeat these metadata literals. Tauri's bundler continues to read the same manifest directly, which keeps the About version synchronized with RPM, NSIS, and MSI package versions.

# External links

Repository activation uses Tauri's opener plugin and the operating system's default browser. The main-window capability allows only the exact authoritative homepage URL; reference windows do not receive opener access. Failures are reported in the existing application operation-status region.

# Version updates

Release preparation changes `src-tauri/tauri.conf.json#version`. Other tool manifests may retain their own technical package versions when their tooling requires them, but About and distributable application versions are sourced only from the Tauri manifest.
