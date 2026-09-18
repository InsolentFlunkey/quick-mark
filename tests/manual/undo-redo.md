# Undo and Redo native verification

Run this checklist in the packaged application on each supported platform. Redo is `Ctrl+Y` on Windows, `Ctrl+Y` or `Ctrl+Shift+Z` on Linux, and `Command+Shift+Z` on macOS.

1. Open a saved Markdown file and focus the Markdown Input pane.
   - **Edit → Undo** and **Edit → Redo** begin disabled.
   - Type a short phrase. Undo becomes available; Undo removes the phrase and Redo restores it with the caret/selection in the expected position.
2. Exercise deletion, Cut, Paste, and replacement of a selected range.
   - Each Undo reverses the most recent sensible edit group; Redo reapplies it.
   - After Undo, make a different edit. Redo becomes unavailable and makes no change.
3. Select several lines and use Tab and Shift+Tab. Continue and terminate a Markdown list with Enter.
   - Each command is undone and redone as one coherent action with the selection restored.
4. Open **Insert → Table…**, configure a table, and insert it over a selection.
   - One Undo restores the replaced text and selection. One Redo restores the whole table and its first-body-cell caret.
5. Save the edited document, then Undo and Redo.
   - Save does not clear history. Undo marks the document dirty when its content differs from the saved version; Redo clears the dirty indicator when it returns to the saved content.
   - Preview and lint results update or become stale exactly as they do for a new edit.
6. Create two tabs and edit both. Switch between them and use Undo/Redo.
   - Each tab retains only its own history; no command changes another tab.
7. Move an edited tab to a new window, then use Undo and Redo there.
   - Content, history, and caret/selection move together. Cancel or force a failed move and confirm the original tab keeps its history.
8. With undoable edits present, confirm **Edit → Clear** and then choose Discard if prompted.
   - The tab becomes a blank untitled document and Undo cannot restore the previous document.
9. Edit a file, change it externally, and choose **Reload from Disk**.
   - The disk content replaces the editor and the prior history is unavailable.
10. Start an Open, Save, reload, or tab-transfer operation that temporarily locks the editor.
    - Undo/Redo are disabled and their shortcuts do not modify content until the operation ends.
11. Open Settings and Table Builder, type in a text field, and press the platform Undo/Redo shortcuts.
    - The focused dialog field handles its own edit history; the Markdown document does not change.
    - Continue pressing Undo after the field returns to its initial value. The shortcut is safely exhausted and still does not undo the Markdown document behind the dialog.
12. Close a tab and restart QuickMark.
    - Closed-tab and previous-session histories are not restored.
