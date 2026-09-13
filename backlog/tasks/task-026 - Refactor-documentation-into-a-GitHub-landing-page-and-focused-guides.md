---
id: TASK-026
title: Refactor documentation into a GitHub landing page and focused guides
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-13 04:37'
updated_date: '2026-09-13 20:39'
labels:
  - enhancement
  - documentation
dependencies: []
references:
  - README.md
  - src/reference.ts
  - src/reference-window-services.ts
  - src/rendered-resources.ts
  - >-
    backlog/tasks/task-025.01 -
    Build-package-and-document-QuickMark-on-Windows.md
documentation:
  - backlog/docs/doc-010 - TASK-026-Bundled-offline-documentation-navigation.md
modified_files:
  - README.md
  - docs/installation.md
  - docs/build-windows.md
  - docs/build-linux.md
  - docs/editing.md
  - docs/linting.md
  - docs/markdown.md
  - docs/development.md
  - docs/release-verification.md
  - reference.html
  - src/reference.css
  - src/bundled-guides.ts
  - src/reference.ts
  - src/rendered-resources.ts
  - tests/bundled-guides.test.ts
  - tests/reference-guides-integration.test.ts
  - tests/content-security-policy.test.ts
  - tests/desktop-parity.test.ts
priority: medium
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restructure QuickMark's documentation so README.md is a useful GitHub product landing page with substantive feature descriptions, supported platforms, limitations and getting-started guidance, linking to focused user and developer guides. Preserve detailed existing instructions while making installation, Windows/Linux source builds, day-to-day usage, Markdown support and release verification discoverable. This is separate from TASK-025.01 Windows build delivery. Initially created for planning only; the user subsequently authorized implementation and selected bundled offline guides. Help → README must navigate these guides read-only in its existing reference window without a filesystem folder, arbitrary local file access, broken relative links or editor-document replacement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README is a concise GitHub landing page describing QuickMark, its main capabilities, supported platforms, and clear routes to installation, building from source, usage, and contribution/development guidance.
- [x] #2 Detailed material is organized into focused, clearly named guides with discoverable navigation; existing substantive instructions and deliberate limitations are preserved without conflicting duplicate versions.
- [x] #3 Windows and Linux build-from-source guides are directly discoverable from README, distinguish build prerequisites from runtime requirements, and include complete commands and artifact locations without assuming a prebuilt installer exists.
- [x] #4 Documentation links and anchors resolve correctly when viewed on GitHub, including navigation back to the overview.
- [x] #5 Help → README and access to detailed help have an explicitly documented and verified behavior after the split; no newly broken relative links are exposed in bundled reference windows.
- [x] #6 Relevant link/content checks and manual GitHub-style and packaged-app documentation navigation verification are completed, with the resulting documentation structure recorded.
- [x] #7 Bundled help provides a Back control that returns to the actual previous guide and restores its scroll position; fixed Markdown overview links are labeled README, and current syntax limits are explicitly distinguished from permanent roadmap decisions.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved: retain a substantive GitHub README with product overview, main feature descriptions, supported platforms, limitations and getting-started routes. Split detailed existing content into docs/installation.md, build-windows.md, build-linux.md, editing.md, linting.md, markdown.md, development.md and release-verification.md, preserving instructions and limitations. Bundle an explicit allowlist of these guides for offline read-only navigation within Help → README, including return navigation, without filesystem access or editor replacement. Update relocated-content assertions and add navigation/link checks. Verify automated tests, production build, GitHub-style rendering and packaged native help. Record navigation design in a Backlog doc. User approved bundled offline guides on 2026-09-13.

Approved review revision: add a README-help-only Back button and in-memory guide history containing path and scroll offsets. Following valid guide links pushes the current guide; Back pops without adding another entry and restores scroll. Initial Back is disabled. External links and failed links do not modify history. Keep ordinary Markdown links to ../README.md but label them README for GitHub clarity. Update README limitation wording to describe this release, not permanent exclusions. Update documentation/design notes and integration tests, run checks, rebuild release executable and NSIS installer, and provide exact launch instructions. User approved using the accessible IDE-bundled rg; do not modify PATH/installations/ACLs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User authorized implementing TASK-026. Repository starts clean. Existing README contains all substantive docs; no docs directory yet. reference.ts raw-imports README, and rendered-resources.ts rejects relative links when reference documents have no filesystem path. Found existing README-specific assertions in desktop-parity and content-security-policy tests; these must follow content relocation. Asked user to select bundled offline guides vs external GitHub navigation before implementation.

User clarified README must provide useful app features suitable for a GitHub landing page, not merely links. Approved bundled offline guides. rg launcher fails to start in this environment; using native PowerShell inspection.

Implemented feature-rich README and eight focused guides, preserving original detailed sections and adding checkout/navigation instructions. Added explicit static guide bundle and README-only resource handler with no filesystem access; navigation resets scroll and focuses the new heading. Tests cover complete guide-link graph, bundled-source identity, rejected paths, and same-window navigation without editor-opening calls. Browser skill bootstrap failed with 'Cannot redefine property: process'; visual/browser verification remains blocked. Automated suite/build running.

Verification: npm test passed all 325 tests across 48 files. Includes actual reference.ts integration with native boundary mocks: README → editing → linting → README → Windows guide, heading focus, scroll reset, window title, hidden editing actions, code-copy markup, external URL delegation, and no filesystem resolution. All guide Markdown links resolve both through the offline allowlist and GitHub-equivalent POSIX paths; guide contents match source files. Compared original README substantive blocks against guides; only four blocks changed for intentional cross-guide/checkout wording, with original information preserved. Production frontend build and Windows NSIS release build succeeded. Browser bootstrap failed again after a fresh kernel reset with 'Cannot redefine property: process'. No alternate browser workaround applied. AC6 remains unchecked pending actual GitHub-style visual and packaged-app manual checks; do not mark Done or commit yet. Final rebuild running after correcting the development guide heading level. Tauri rewrote Cargo.toml line endings only; restored original CRLF with no content diff.

Final Windows NSIS rebuild succeeded after heading-level cleanup; executable src-tauri/target/release/quick-mark.exe and installer src-tauri/target/release/bundle/nsis/QuickMark_0.1.0_x64-setup.exe contain the final guides. Targeted documentation, reference integration and CSP tests passed again (18 tests); git diff --check passed. No commits created. Remaining next step: user/manual verification of GitHub-style rendering and packaged offline help using docs/release-verification.md, or approved restoration/alternative for unavailable browser verification.

User native review: overall looks good, but requested true previous-guide Back navigation and clearer current-release limitation wording. Review changes approved; task remains In Progress pending verification of revised behavior.

Approved review corrections implemented: README-help-only Back button with previous-guide history and horizontal/vertical scroll restoration. Fixed Markdown overview links renamed README. Back focuses restored reading region; following links focuses destination heading. Initial Back disabled; external/rejected/same-guide links do not add history. README and Markdown support guide explicitly describe this release's limitations, not permanent exclusions. Updated offline-help and native smoke instructions and doc-010. All 325 tests across 48 files pass, including expanded real-reference integration; frontend production build passes and Windows native rebuild is running. Bundled IDE rg now used successfully via absolute executable path. Awaiting native review of revised Back behavior; AC6 stays pending.

Windows release rebuild blocked: Cargo could not remove src-tauri/target/release/quick-mark.exe (Access is denied, os error 5). Read-only inspection confirms process 6772 is running that exact executable. Executable and installer remain the prior 2026-09-13 08:37:10 artifacts and do not contain the review revision. Asked user to save and close all QuickMark windows; do not kill the process or bypass the lock. Once closed, rerun npm.cmd run tauri -- build --bundles nsis -- --locked and report fresh artifact timestamps.

User closed QuickMark. Retried the normal Windows release build successfully: frontend build, release executable and NSIS installer now contain the Back/navigation and limitation-wording revisions. No alternate target directory or process termination used. All 325 tests passed before build. Remaining verification is native review of the new Back button, scroll restoration, fixed README links and fresh-window disabled state. Task stays In Progress; no commits made.

User accepted the rebuilt UI and documentation, including the separate Back control and fixed README links, and explicitly authorized commit and push. Native review completes the remaining acceptance verification. No further navigation changes requested.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Refactored README into a substantive GitHub product landing page and preserved detailed instructions in eight focused guides. Bundled those same guides for offline read-only Help → README navigation, with a true Back button restoring the previous guide and scroll position, plus explicit README overview links. Clarified current Markdown limitations are not permanent exclusions. Recorded navigation architecture in doc-010. Verification: 325 tests passed across 48 files, link/source parity and reference navigation integration passed, TypeScript/Vite production build and Windows release/NSIS packaging succeeded, git diff --check passed, and user accepted native review. Browser automation was unavailable; user review supplied the remaining visual verification.
<!-- SECTION:FINAL_SUMMARY:END -->
