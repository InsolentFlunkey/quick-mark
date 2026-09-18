# Real-time lint native verification

1. Confirm **Lint while typing** and **Lint before saving** can be toggled independently in Settings, survive a full restart, and synchronize between two editor windows.
2. Enable real-time linting, type several incomplete Markdown fragments quickly, and verify Preview remains visible with no dialog or focus movement. After pausing, verify the toolbar shows the current issue count. A nonzero count should use a clearly visible warning treatment in each theme; **Lint (0)** should remain neutral and **Lint (!)** should remain distinct.
3. Edit again and verify the old count disappears immediately. Pause and verify only the newest content is reported.
4. With real-time linting enabled, open a nonempty document and verify its count appears after the idle delay without typing. Confirm an empty new document is not checked and a background tab waits until selected.
5. Activate the Lint control and verify the cached results open without a visible second check. Leave the results pane open, edit, and verify it updates in place after the pause.
6. With lint-before-save disabled, save while real-time linting is enabled and verify no lint decision prompt appears. Then enable lint-before-save and verify its existing save decision remains unchanged.
7. Open the TASK-008 256 KiB and 1 MiB fixtures. In Split and Input views, type near the beginning, middle, and end and compare responsiveness with real-time linting disabled and enabled. Verify keystrokes do not start overlapping checks and synchronized scrolling remains usable.
8. Change individual lint rules in another editor window and verify subsequent live results use the new profile. Move a tab to a new window and verify its completed or stale result state remains safe.
