---
id: TASK-006
title: Make rendered document links and images predictable in the desktop app
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:57'
updated_date: '2026-08-30 16:56'
labels:
  - bug
  - markdown
  - security
dependencies: []
modified_files:
  - README.md
  - shared/markdown.css
  - src/rendered-resources.ts
  - src/main.ts
  - src/reference.ts
  - src/tauri-file-services.ts
  - src/markdown-examples.md
  - src-tauri/Cargo.toml
  - src-tauri/Cargo.lock
  - src-tauri/src/lib.rs
  - src-tauri/capabilities/rendered-content.json
  - test-files/links.md
  - tests/rendered-resources.test.ts
  - tests/rendered-resources-wiring.test.ts
priority: high
type: bug
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define and implement safe desktop behavior for links and images rendered from Markdown. External web and mail links, document-relative links, local image references, missing targets, and unsupported schemes need intentional outcomes that do not navigate the QuickMark application window away from the editor or silently fail. Relative resources should be interpreted in the context of the active document when that context exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening a supported external web or mail link uses an intentional desktop-safe destination and does not replace the QuickMark application window
- [x] #2 Relative document links and local image references have documented behavior based on the active document’s filesystem location
- [x] #3 Untitled documents and missing, inaccessible, or unsupported relative targets produce safe and understandable behavior
- [x] #4 Unsupported or dangerous URI schemes remain blocked
- [x] #5 Automated tests and native verification cover external, mail, relative, missing, and blocked link/resource cases
- [x] #6 User documentation explains supported rendered-link and image behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define a focused rendered-resource controller in TypeScript. Intercept preview anchor clicks before browser navigation: keep fragment-only anchors inside the preview; send HTTP(S) and mailto links to the operating system through Tauri’s opener; resolve relative `.md`, `.markdown`, and `.txt` targets against the active document and open them through QuickMark’s existing protected document operation; reject absolute paths, unsupported schemes/types, and pathless untitled/reference contexts with an operation-status explanation.
2. Add narrowly scoped opener capability entries for HTTP, HTTPS, and mailto URLs on the main and reference windows. Preserve the existing exact About capability and keep renderer-level blocking of dangerous schemes. Add tests proving preview clicks are prevented from replacing the WebView and opener failures are reported.
3. Add a native read-only image command that accepts the active document path plus a relative image reference, resolves it using native path semantics, permits a documented raster allowlist, rejects schemes/absolute paths/unsupported types, enforces a reasonable size ceiling, and returns MIME-tagged bytes. Do not enable the broad Tauri asset protocol. Add Rust tests for relative resolution, missing/inaccessible targets, unsupported types, and traversal semantics.
4. After each render, replace relative image sources with object URLs produced from the native command; revoke stale URLs on rerender. For untitled documents or failed image loads, prevent accidental WebView-relative/network resolution and expose understandable alt/title/status feedback. Leave explicit HTTP(S) image URLs as remote images and keep blocked schemes inert.
5. Wire the controller into the main preview and bundled reference windows, using the active lifecycle path as context. Update README’s dialect/resource documentation and Markdown Examples so external links, relative documents, remote images, local images, missing targets, and unsupported behavior are explicit.
6. Add frontend DOM tests and capability wiring tests, run the full JavaScript suite/build and Rust test/format/check sequence, then perform native manual verification for external browser/mail opening, protected relative-document navigation, local image display, missing targets, untitled documents, and blocked schemes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research (2026-08-29): rendered anchors currently have no delegated desktop handler. HTTP(S) links receive `_blank`, but normal WebView navigation remains possible for mail, relative, and other accepted targets. The opener plugin is registered, yet its only current URL capability is the exact repository URL used by the About dialog.

The active `DocumentLifecycle` already exposes the source file path and existing `openDocument` plus unsaved-change protection can safely load another Markdown/text file in the same QuickMark window. Untitled and bundled reference documents intentionally have no filesystem path.

Tauri’s asset protocol requires static or persisted filesystem scopes for arbitrary user-selected locations. A broad `$HOME/**/*` or `**/*` scope would expose more local files to the WebView than this feature needs. A narrow application command can instead resolve a relative reference from the active document, validate a raster-image extension and size, read bytes, and return them for an in-memory object URL without granting general WebView filesystem access.

Implemented the approved architecture: a delegated preview controller prevents click and auxiliary-click WebView navigation, routes HTTP(S)/mailto through the OS opener, resolves relative documents through native path validation and existing protected open flow, and converts validated local raster bytes into revocable object URLs.

Added native validation for an existing active Markdown/text document, relative-only references, existing supported document targets, PNG/JPEG/GIF/WebP/BMP images, and a 10 MiB image limit. Broad asset-protocol and opener path permissions remain disabled; URL opener scope is limited to HTTP, HTTPS, and mailto.

Progress verification: focused frontend tests passed 16/16; initial Rust test compilation required a routine `Debug` derive for `expect_err`, after which 9/9 Rust tests passed. Full frontend suite passed 147/147 and `npm run build`, `cargo fmt --check`, and `cargo check` passed. Documentation now describes desktop link/image outcomes and bundled-example pathlessness.

Final verification (2026-08-30): `npm test` passed 148/148 tests across 20 files; `npm run build` passed; `cargo test` passed 9/9 native tests; `cargo fmt --check` and `cargo check` passed; all TASK-006 files are free of trailing whitespace. `npm run tauri dev` reached Vite readiness, compiled the native binary, accepted the generated rendered-content capability, and launched `target/debug/quick-mark` without initialization errors before being stopped.

The repository also contains an unrelated user-owned `AGENTS.md` modification with trailing whitespace. It was not edited, included in TASK-006 modified files, or used to weaken scoped verification.

Verification correction: running `npm run tauri dev` had overwritten `src-tauri/target/debug/quick-mark` with a development executable that required the Vite server, breaking the project’s established direct-debug-binary review workflow. Rebuilt the standalone embedded-frontend executable with `npm run tauri build -- --debug`; after Tauri reported the application built at the expected path, the unnecessary RPM bundling phase was stopped. Directly launching `src-tauri/target/debug/quick-mark` then remained running without Vite or a localhost connection error until deliberately stopped.

User manual verification completed successfully (2026-08-30). The initially reported relative-link failure was traced to `linked.md` having been saved one directory above the test document; once placed beside `main.md`, the final checklist passed. The missing-file error had correctly reported the resolved absent path.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Added a lifecycle-aware rendered-resource controller that prevents preview navigation, opens HTTP(S) and mail links in the system application, preserves in-preview fragment navigation, and opens relative Markdown/text documents through QuickMark’s existing unsaved-change protection.
- Added narrow native commands for relative document resolution and local raster-image loading. Local PNG, JPEG, GIF, WebP, and BMP images up to 10 MiB become revocable in-memory object URLs; broad asset-protocol and arbitrary path-opener permissions remain disabled.
- Added safe feedback for untitled documents, missing or inaccessible targets, unsupported file types, absolute paths, and dangerous schemes.
- Documented the desktop resource contract in README, Markdown Examples, and the link fixture, and added frontend, capability-wiring, and Rust filesystem tests.

## Verification

- `npm test` — 148 tests passed across 20 files.
- `npm run build` — TypeScript and Vite production build passed.
- `cargo test` — 9 native tests passed.
- `cargo fmt --check` and `cargo check` — passed.
- Native `npm run tauri dev` startup — Vite ready, Rust binary compiled, Tauri application launched without capability or command initialization errors.
- Scoped trailing-whitespace verification — passed for all TASK-006 files.

Restored and directly verified the standalone debug executable after identifying that `tauri dev` had temporarily replaced it with a localhost-dependent development binary.

User completed the manual verification checklist successfully; relative document navigation worked after the test target was placed in the active document’s directory.
<!-- SECTION:FINAL_SUMMARY:END -->
