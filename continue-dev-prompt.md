Please continue QuickMark backlog work in /home/bryan/share/git/quick-mark.

Read AGENTS.md and follow the Backlog.md workflow. Begin TASK-010.01 — Define the lint rule profile and results experience. Research the current implementation and record a plan before making changes. This task defines linting behavior; do not begin TASK-010.02 or unrelated tasks. Present material product decisions for review.

Current state:
- Branch main; pushed through e67fd3d.
- TASK-009 (external document changes) is Done after native review.
- TASK-014’s original required children .01–.04 are Done.
- TASK-002.03.01 (WebKitGTK Shift+Tab fix) is Done.
- TASK-022.01 (geometry issue) is Watch: repeated tests work on X11; no geometry fix was claimed. Do not investigate unless requested.
- Optional tab/window enhancements TASK-014.05–.08 remain To Do.
- test-files/code-blocks.md contains my uncommitted native-test edits, including trailing whitespace. Preserve them; do not commit or discard them without permission.
- user-notes.md currently has no pending topics. Check for updates.

Read architecture doc-006 (document/window ownership), doc-007 (external revisions/recovery), TASK-010 and TASK-010.01. Reconcile linting decisions with TASK-005’s supported Markdown dialect.

Preserve existing behavior:
- Independent per-tab content, selection, scrolling and View settings.
- Successful opens reuse the originating unchanged blank tab; failed/canceled opens preserve it.
- Duplicate opens focus the existing owner across windows.
- Close Tab differs from Close Window; the last tab leaves a blank tab.
- Save As rejects another open document’s path.
- External changes never auto-reload. Persistent notices offer explicit reload, continued editing and recovery.
- Overwrite approval is revision-bound; missing files retain recovery protection even when previously clean.
- No automatic tab or unsaved-session restoration.

Latest verification:
- 258 frontend tests and 44 native tests passed.
- Cargo checks and production/native debug builds passed.
- Banner layout fix passed native WebKitGTK geometry checks and my review.
- Launchable native review build: src-tauri/target/debug/quick-mark.
- Build it with npm run tauri build -- --debug --no-bundle.

Make task/document changes only through Backlog tools.
Ask before committing; this handoff does not authorize commits or pushes.