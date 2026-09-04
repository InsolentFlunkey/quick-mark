---
id: TASK-007
title: Add a restrictive content security policy
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:57'
updated_date: '2026-09-04 14:36'
labels:
  - enhancement
  - security
dependencies:
  - TASK-006
documentation:
  - 'https://v2.tauri.app/security/csp/'
  - 'https://v2.tauri.app/reference/config/#securityconfig'
modified_files:
  - README.md
  - src-tauri/tauri.conf.json
  - tests/content-security-policy.test.ts
priority: high
type: enhancement
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add defense-in-depth protection for the Tauri frontend. QuickMark currently has no configured content security policy even though it renders user-authored Markdown and may load linked resources. Establish a policy compatible with required application assets and intentionally supported Markdown images or navigation while preventing unexpected script, frame, object, and resource execution.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The packaged and development application run with an explicit content security policy rather than a null policy
- [x] #2 The policy blocks unexpected scripts, frames, objects, and unsafe resource origins
- [x] #3 Required QuickMark assets and intentionally supported Markdown resources continue to work
- [x] #4 Policy violations or blocked user resources fail safely without breaking document editing
- [x] #5 Automated configuration checks and native smoke verification cover the effective policy
- [x] #6 The security rationale and any allowed external origins are documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the null Tauri CSP with explicit production and development directive maps in `src-tauri/tauri.conf.json`. Default all unspecified resource types to `none`; allow only bundled scripts/fonts/styles, required Tauri IPC endpoints, local/blob/data images, and HTTP(S) Markdown images. Permit inline styles only because QuickMark’s scroll measurement and clipboard fallback create runtime styles; do not allow inline scripts, eval, frames, objects, base changes, or form submissions. Add only WebSocket connectivity to the development policy for Vite HMR.
2. Add configuration-focused automated tests that assert both policies are non-null, enforce the denied directives, contain the narrow production sources, isolate development-only WebSocket access, and remain aligned with rendered image behavior. Retain existing renderer safety tests as behavioral coverage for hostile Markdown remaining inert.
3. Document the CSP rationale and every allowed non-self origin/scheme in README.md, including why `style-src 'unsafe-inline'` remains necessary and why it does not enable user-authored HTML or script execution.
4. Run focused and full frontend tests, production build, Rust tests/check/format, and a Tauri debug build. Inspect Tauri’s generated codegen HTML to confirm it injects the effective CSP with script hashes/nonces, then perform native smoke verification of editing, local/remote images, links, copy fallback, and synchronized scrolling.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency rationale: the restrictive policy must be designed after rendered link/image behavior defines which navigation paths and resource origins QuickMark intentionally supports.

Research: `app.security.csp` is currently null. QuickMark loads only bundled scripts/CSS; raw Markdown HTML is disabled. Local images become `blob:` URLs after restricted IPC reads, while explicit remote images remain `http:`/`https:` resources. Tauri commands/plugins require `ipc:` and `http://ipc.localhost` in `connect-src`. The only runtime inline styles are internal clipboard-fallback positioning and scroll-sync measurement, so a strict policy can prohibit inline scripts while retaining `style-src 'unsafe-inline'`. Tauri’s official CSP guidance states that configured policies are enabled for built assets and Tauri injects hashes/nonces for bundled code; `devCsp` is needed here to add Vite’s development WebSocket without widening production.

Implementation: replaced null CSP with explicit production and development directive maps. Both default-deny objects/frames/base changes/forms and prohibit inline/eval scripts; bundled scripts/fonts/styles, Tauri IPC, and the documented local/blob/data/HTTP(S) image paths are allowed. Development alone adds self/WebSocket connectivity for Vite HMR. README now documents every exception and its boundary.

Automated verification: CSP/renderer/resource focused tests pass (25/25); full frontend suite passes (163/163 across 23 files); TypeScript/Vite production build and Tauri debug build without bundling pass; Rust tests pass (9/9), `cargo fmt --check` passes, `cargo check` passes, and task-scoped diff validation passes. The first focused run had one documentation assertion fail solely because a sentence wrapped across a Markdown newline; normalizing whitespace corrected that test without changing behavior.

Native verification completed by the user: ordinary editing/preview/save/menu behavior, local and remote images, external links, code copying, inert hostile Markdown, and synchronized scrolling all worked under the configured policy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explicit production and development Content Security Policies to QuickMark’s Tauri configuration. Both policies default-deny unexpected content and explicitly block objects, frames, base changes, forms, inline scripts, and dynamic evaluation while preserving bundled assets, Tauri IPC, and QuickMark’s supported local/blob/data/HTTP(S) image behavior. Development alone allows Vite’s WebSocket transport. Documented each source and the narrow inline-style exception in README, and added configuration tests that keep the policy aligned with rendered-resource behavior. Verification passed with 163 frontend tests, 9 Rust tests, TypeScript/Vite and native Tauri debug builds, Cargo formatting/checks, scoped diff validation, and user-completed native smoke testing.
<!-- SECTION:FINAL_SUMMARY:END -->
