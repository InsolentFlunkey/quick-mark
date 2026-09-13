---
id: doc-010
title: 'TASK-026: Bundled offline documentation navigation'
type: guide
created_date: '2026-09-13 14:33'
updated_date: '2026-09-13 15:26'
tags:
  - documentation
  - architecture
---
# Bundled offline documentation

README.md remains the GitHub product landing page with substantive features, first-use steps, platforms and current-release limitations. Detailed material lives in docs/installation.md, editing.md, linting.md, markdown.md, build-windows.md, build-linux.md, development.md and release-verification.md. Current renderer limitations do not decide permanent roadmap exclusions.

The user selected bundled offline guides. src/bundled-guides.ts statically imports the same Markdown used on GitHub, matching the installed app version without a checkout or network. An explicit virtual-path registry resolves only known guide files. Relative links support sibling guides and ../README.md; absolute paths, schemes, encoded paths, query strings, fragments and paths outside the bundle are rejected. Guide navigation does not add heading-anchor support to the editor Markdown dialect.

Only the README reference window supplies a bundled-document handler to the shared rendered resource controller. Existing scheme and absolute-path checks run first; external HTTP(S)/mailto links retain the OS opener. Bundled links never resolve filesystem paths or open editor tabs. Existing linked-document navigation from TASK-014.02 opens or focuses filesystem-backed editor tabs; it is not a Back/Forward history implementation and cannot be directly substituted for read-only bundled navigation. Cheat Sheet and editable Examples retain their existing behavior.

## Navigation and return behavior

A Back button above the README help preview uses a window-local stack of previous guide paths and horizontal/vertical scroll positions. A valid link to another guide pushes the current reading position and opens the destination at the top with heading focus. Back pops without pushing, renders the previous guide, focuses its reading region without scrolling to the heading, and restores its saved offsets. Initial Back is disabled. External links, rejected links and links to the same current guide do not add history entries. The Back control is hidden in other reference types and in print.

Each Markdown guide has a fixed README link to ../README.md. Its name accurately describes its destination both on GitHub and in the app. It is ordinary navigation and participates in in-app history, so Back can return from README to the guide that linked there. This avoids presenting a hardcoded overview link as a previous-page action.

Reopening Help → README focuses the existing window at its current guide and retains its history. Closing and reopening starts at README with empty history. History is not persisted across reload or restart.

Automated checks enumerate all bundled sources and links, verify GitHub-equivalent relative targets and reject unbundled targets. An actual reference.ts integration test with native boundary mocks verifies multi-guide navigation, Back order, scroll/focus restoration, history exhaustion, fixed README links, external delegation and rejected-link behavior. Native and visual smoke steps are in docs/release-verification.md.
