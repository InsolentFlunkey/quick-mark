---
id: TASK-026
title: Refactor documentation into a GitHub landing page and focused guides
status: To Do
assignee: []
created_date: '2026-09-13 04:37'
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
priority: medium
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restructure QuickMark's documentation so README.md is a concise top-level landing page suitable for GitHub, linking to detailed documents for specific user and developer tasks. The current README mixes product overview, long feature behavior descriptions, Markdown dialect details, installation, platform build prerequisites, build commands, and release verification. Preserve that useful information while making it easy to find. This is separate from TASK-025.01 Windows build delivery; the user explicitly requested task creation only and wants the existing README left unchanged for now. During planning, define guide boundaries and navigation, including installation, building from source on Windows and Linux, day-to-day usage, Markdown support, and release verification. Account for Help → README: src/reference.ts currently bundles README, and reference windows have no filesystem folder for relative document links. Decide and review how bundled documentation navigation will remain usable before moving content; do not leave broken in-app links or silently rely on unsupported relative-link behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README is a concise GitHub landing page describing QuickMark, its main capabilities, supported platforms, and clear routes to installation, building from source, usage, and contribution/development guidance.
- [ ] #2 Detailed material is organized into focused, clearly named guides with discoverable navigation; existing substantive instructions and deliberate limitations are preserved without conflicting duplicate versions.
- [ ] #3 Windows and Linux build-from-source guides are directly discoverable from README, distinguish build prerequisites from runtime requirements, and include complete commands and artifact locations without assuming a prebuilt installer exists.
- [ ] #4 Documentation links and anchors resolve correctly when viewed on GitHub, including navigation back to the overview.
- [ ] #5 Help → README and access to detailed help have an explicitly documented and verified behavior after the split; no newly broken relative links are exposed in bundled reference windows.
- [ ] #6 Relevant link/content checks and manual GitHub-style and packaged-app documentation navigation verification are completed, with the resulting documentation structure recorded.
<!-- AC:END -->
