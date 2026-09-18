# Editor line numbers — native verification

Run this checklist in the packaged or Tauri development application, not only a browser preview. Test at the normal display scale and, where available, a high-DPI scale such as 150%.

1. Open or paste a document containing a blank line, a line long enough to wrap, and a final line without a terminating newline.
   - One number appears for every logical source line, including the blank line.
   - The wrapped line has one number, and the numbers remain aligned while typing and scrolling.

2. Click the number of a terminated line, then Copy and paste into a temporary location.
   - The whole line and its terminating newline are copied.
   - Pressing Delete, Cut, or typing replaces/removes the same ordinary text selection.

3. Click the number of the final unterminated line.
   - The complete final line is selected without selecting unrelated text.

4. Drag from a middle line number downward, then repeat upward.
   - The starting line and every line crossed are selected.
   - The selection direction follows the drag direction and includes blank and wrapped source lines correctly.

5. Start a gutter drag and continue above the editor, then repeat below it.
   - The editor scrolls automatically and the whole-line selection continues extending.

6. Make a text selection or place the caret, hold Shift, and click another line number above and below it.
   - The existing selection anchor is retained and the selection extends through the clicked whole line.

7. Start an Open, Save, or other operation that temporarily locks editing, if a delay can be induced.
   - Gutter selection remains harmless and typing, Cut, and Delete cannot modify locked content.

8. With Split view and **View → Sync Scrolling** enabled, scroll from the source and then from Preview. Run a lint check and choose an issue.
   - Source/Preview synchronization still works, and lint navigation selects and reveals the reported source range.

9. Open **Settings**, clear **Show editor line numbers**, close and restart QuickMark.
   - The gutter stays hidden after restart and editing layout remains usable.
   - Re-enable the setting, restart again, and confirm the gutter returns.

10. Open two tabs and move one tab to a new window.
    - Each tab/window keeps its content, selection, and source scroll position; line-number visibility matches the saved preference.
