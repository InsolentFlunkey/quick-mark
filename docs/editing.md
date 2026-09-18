# Editing and managing documents

[README](../README.md)

## Editor tools

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Table Builder**: Use the toolbar button or **Insert → Table…** to choose columns, blank body rows, headers, and per-column alignment. Choose Left, Center, or Right for each column, or use the **All columns** Set buttons. Header placeholders are suggestions; blank fields remain blank. **Reset** restores the default 3×3 form, while **Cancel** discards it. The generated table replaces the current selection or is inserted at the cursor, ready for body-cell editing.
- **Print Friendly**: Prints clean rendered Markdown via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Native Files**: Open, Save, and Save As operate on real filesystem paths.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Line numbers**: The Markdown Input pane shows one number for each source line, including blank lines. Wrapped text keeps its original source-line number. Open **Settings** and clear **Show editor line numbers** to hide the gutter; QuickMark remembers the choice.
- **Synchronized Scrolling**: In Split view, source and preview follow each other by default. Toggle **View → Sync Scrolling** to disable or re-enable it; QuickMark remembers the setting. Alignment uses nearby Markdown blocks, so movement within one unusually tall block may be approximate.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.

## Appearance themes

Open **Settings** and choose **Dark**, **Light**, or **QuickMark Classic** from the Theme control. QuickMark remembers the choice and applies it to every editor window, detached window, dialog, and bundled reference window. Other open QuickMark windows update when the preference changes.

QuickMark Classic restores the deep navy palette, translucent surfaces, blue accent, and subtle background gradients from QuickMark's original single-file release. Dark is the modern default; Light provides a high-contrast light surface. Native title bars and application menus receive the matching light or dark request where the operating system and webview support it, but remain platform-rendered and may follow system conventions.

Printing always uses the dedicated white print layout, independently of the selected screen theme.

## Document tabs

**New** creates an untitled tab. **Open**, **File → Recent Files**, dropped files and relative document links open a new tab or focus the tab and editor window already owning that filesystem path (including canonical symlink aliases). A failed open leaves existing tabs intact. A successful open reuses the active unchanged blank untitled tab; canceled or failed opens leave it intact. Tabs containing edits or an existing file remain open.

Each tab keeps its content, selection, scroll position and View settings. A dot marks unsaved changes. Tabs with matching filenames display their paths; hover a tab to see its full path. **Save**, **Save As**, **Edit → Clear** and **Insert → Table…** target the tab where the action began. Clear resets that tab to an untitled document after any required unsaved-change prompt. Save As refuses to overwrite a path already open in another tab or editor window, including when exporting from Markdown Examples.

Use a tab's **×** button or **File → Close Tab** to close it. Dirty tabs offer Save, Discard and Cancel. Closing the last tab leaves a fresh blank tab. **File → Close Window** checks all dirty tabs; Cancel keeps the window and tabs open (saves already completed remain saved). While a file operation or prompt is pending, editing and additional file operations are temporarily unavailable; tab switching remains available.

Use **File → Move Tab to New Window** to detach the active tab. The new window receives its content, saved baseline, read-only status, selection, scroll positions and View settings. The source tab stays frozen until the destination acknowledges it; failed creation or adoption keeps the source intact. Tab switching and document actions are temporarily unavailable during the handoff. Moving the last tab leaves a blank tab in the original window. Native textarea Undo history does not move with the tab.

**Recent Files** is shared across editor windows. **Settings → Clear Recent Files…** clears it everywhere; existing history is migrated automatically. New tabs inherit the latest chosen View defaults, while existing tabs keep their own settings. Opening a file through a second application launch routes it to one editor; dropping a file targets the receiving window. A duplicate focuses its existing owner. If that file is still being opened in another window, wait for that open to finish and try again.

Tabs and unsaved content are not restored after restarting QuickMark or reloading an editor. Recent-file history and preference defaults remain persisted. The main and reference windows retain their saved geometry; detached windows start with the standard editor size and are not recreated at startup.

## External file changes

QuickMark checks open files while idle (roughly once per second), when switching tabs or returning to a window, and before saving or closing. If another application changes a file, a notice appears on its tab and your editor content stays intact. **Keep Editing** returns focus to the editor and leaves the conflict unresolved. **Reload from Disk** asks before replacing your editor content; **Save As** lets you keep a separate copy. Reloading replaces the editor contents and cannot be undone with the textarea's Undo history.

**Save** during a conflict offers **Overwrite Disk File**, **Save As**, or **Cancel**. Overwrite applies only to the disk revision checked before that prompt; if the file changes again, QuickMark refuses the save and asks you to review it again. Save As also confirms replacement of an existing destination, and still refuses paths owned by another tab or window.

If the original file is deleted, moved, or cannot be read, QuickMark keeps the in-memory copy and offers **Save As** and **Retry**. It does not locate renamed files automatically or silently recreate a missing original through ordinary Save. Closing or clearing a tab protects this retained copy even if you had not edited it; choosing **Save** when the original is unavailable opens Save As. Monitoring does not remove entries from Recent Files. Read-only status is rechecked, and conflicts remain protected when moving a tab to a new window.

Saves stage a temporary sibling and replace the destination, so the directory must also be writable. Standard permissions are copied, but hard-link relationships and custom filesystem metadata such as ACLs/extended attributes are not preserved. Checks cannot eliminate the narrow race with an unrelated application writing between the final check and replacement. Polling may miss transient changes between checks and costs more on large files or remote disks. Tabs and recovery copies are still not restored after restarting QuickMark.

## Keyboard navigation

### Selecting source lines

Click a line number to select that entire source line. The selection includes the line ending when one exists, so Copy, Cut, Delete, or typing behaves like an ordinary text selection. The final line is selectable even when the document has no final newline.

Drag upward or downward through the line-number gutter to select a contiguous group of source lines. Keep dragging above or below the editor to scroll and extend the selection. Shift-click another line number to extend the current selection through that whole line. Ctrl-click and Command-click do not create separate non-contiguous line selections.

### Relative link and image suggestions

In a saved document, start an inline destination with `./` or `../`, such as
`[Guide](./docs/)` or `![Photo](./images/)`. A suggestion list appears in the
Markdown Input pane. For a bare filename or folder, press **Ctrl+Space** inside
the destination to request suggestions, then keep typing to narrow them.
Starting a web URL does not automatically open the file list; recognized URL
schemes such as `https:` never offer file suggestions.
Use **Up/Down** to choose an entry and **Tab** or **Enter** to insert it, or click
an entry. Directories have a trailing `/`; accepting one shows its contents.
**Escape** dismisses suggestions and still allows the usual Escape-then-Tab
focus exit. Outside an open suggestion list, Tab and Enter keep their normal
editing behavior. Shift+Tab keeps its normal outdent behavior.

Paths start from the active document's folder, including in detached windows.
Use forward slashes and `../` to browse parent folders. Document links suggest
`.md`, `.markdown`, and `.txt` files; images suggest `.png`, `.jpg`, `.jpeg`,
`.gif`, `.webp`, and `.bmp`. Both show directories. Names containing spaces,
Unicode, percent signs, or Markdown punctuation are inserted as URL-encoded
paths so they work in Preview. Accepting a file replaces the destination path,
adds a missing closing parenthesis (and `>` for angle-delimited destinations),
and moves the caret past the closing parenthesis. Existing closers are reused;
an existing title or fragment is retained. Accepting a directory leaves the
caret inside the link so you can continue browsing.

Suggestions apply to inline links/images, including destinations enclosed in
`<...>`. They do not appear for untitled documents, URLs, absolute paths,
reference-style links, fragment/query editing, or code. Type a little more or
click inside an explicit `./` or `../` path to reopen suggestions after dismissing
them, or press **Ctrl+Space** to request them again for a bare filename.
An explicit Ctrl+Space search with no supported matches keeps the chooser open
and says that no matching document/image or folder names were found. Keep typing
or delete characters to narrow or widen the search. Automatic empty results and
inaccessible folders quietly close the list. Large folders show a notice when
results are limited; narrow the path or type the filename yourself.
Suggestions are temporary: changing tabs, moving focus away, or saving to a new
path discards the previous context. The inserted Markdown is saved normally.

### Editor and application shortcuts

- While focus is in the Markdown Input pane, press **Escape**, then **Tab** to move focus to the next application control, or **Escape**, then **Shift+Tab** to move to the previous control. A normal **Tab** inserts indentation; **Shift+Tab** removes indentation from the current line or selected lines and keeps focus in the editor, even when there is no indentation to remove.
- Use **Ctrl+N** (**Command+N** on macOS) for New, **Ctrl+O** for Open, **Ctrl+S** for Save, **Ctrl+Shift+S** for Save As, **Ctrl+P** for Print, and **Ctrl+W** for Close Tab, and **Ctrl+Shift+W** for Close Window.
- Use **Ctrl+1**, **Ctrl+2**, and **Ctrl+3** (or the corresponding Command shortcuts on macOS) for Split, Input, and Preview views.
- In the tab strip, use **Left/Right**, **Home/End** to switch tabs and **Delete** to close the focused tab. **Tab** reaches the active tab’s Close button and the editor.
- In the Table Builder alignment grid, use **Tab** to reach a radio group and the arrow keys to choose Left, Center, or Right.

These instructions are also available inside QuickMark through **Help → README**. Use **Help → Markdown Cheat Sheet** for a read-only syntax guide with copyable source examples; **Help → Markdown Examples** remains an editable practice document. The cheat sheet is original QuickMark documentation based on [QuickMark’s supported dialect](markdown.md).

## Offline help

**Help → README** opens the app overview and bundled guides in one read-only reference window. Follow a guide link to read it. The **Back** button above the document returns to the actual previous guide and restores your reading position, including when you followed a link between guides. Back is disabled until you have visited another guide. The **README** link at the top of each guide always opens the overview; it is a document link, not a history action. Guide navigation needs no internet connection and never opens or replaces an editor tab. Reopening Help → README focuses the existing reference window at its current guide; closing that window and opening it again starts at the overview with empty navigation history. External web links still open your system browser and need a connection.

For checking Markdown formatting and configuring rules, see [Markdown linting](linting.md).
