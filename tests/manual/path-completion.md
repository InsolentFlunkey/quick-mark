# Relative path completion (TASK-016)

Native review was approved by the user on 2026-09-15. Use
`src-tauri/target/debug/quick-mark.exe` with
disposable Markdown files in two different folders. In the first folder, include
`guide (new).md`, a `docs` folder containing `nested.md`, and an `images` folder
containing a real PNG named `photo one.png`. Keep a second Markdown document in
another folder with different filenames for the context checks.

1. Use **File → Open** on the first document. In **Markdown Input**, type
   `[Guide]()` and place the caret between the parentheses. Type `gu`: expect no
   automatic list. Press **Ctrl+Space**.
   Expect a list showing `guide (new).md` as a document. Hold focus in the editor,
   use **Up/Down** to choose it, and press **Enter**. Expect
   `[Guide](guide%20%28new%29.md)` with no added newline or duplicate `)` and the
   caret immediately after `)`. Click **Guide** in Preview:
   expect the file to open normally. Return to the original document tab.
2. Type `[Nested](./do`, wait for suggestions, and press **Tab** on **docs/**.
   Expect `./docs/` inserted, no closing `)` yet, and the nested file offered.
   Accept **nested.md**: expect the closing `)` inserted and the caret past it.
   Repeat with `../` for a parent directory.
3. Type `![Photo](./images/ph` and click **photo one.png** in the list. Expect focus
   to remain in Markdown Input, the encoded filename and closing `)` inserted,
   and the caret past `)`. Expect the PNG to render. Unsupported files such as `.exe` and `.svg` must not
   appear. The popup should remain readable in Input/Split view and small windows.
4. With suggestions showing, press **Escape**, then **Tab**. Expect focus to leave
   Markdown Input. Return and press Tab in ordinary prose: expect indentation.
   Press Enter after a list item: expect normal list continuation. Try typing in
   a fenced code block, an HTTPS link and a `#fragment`: expect no suggestions.
   Type a web link starting with `[Web](h` and continue through `https://example.com`:
   expect no file popup at any point. In a bare file destination, press Ctrl+Space,
   type more characters to narrow the list, then Escape: expect suggestions to stop.
   Repeat with a prefix that matches nothing: expect **No matching document or
   folder names found.** Delete characters until a file matches: expect the list
   to repopulate without pressing Ctrl+Space again. Repeat in an image destination:
   expect **No matching image or folder names found.**
5. Request suggestions, immediately switch to the document tab in the other
   folder, and type a destination there. Expect only that folder's entries.
   Repeat after **File → Save As** changes the file's folder, and after **File →
   Move Tab to New Window** moves the document: old results must not reappear or
   insert into a different tab/window. Closing a tab must remove its popup.
6. Choose **File → New** and type a relative destination: expect no suggestions
   until the document has been saved. In a saved file, try a missing directory:
   expect no popup or error dialog and ordinary typing still works. Test an
   inaccessible directory if one is available without changing permissions.
7. Save the completed links, close and reopen the file. Expect the inserted
   Markdown to persist; the popup itself is never restored.

Automated tests cover delayed/out-of-order requests, path changes, encoding,
keyboard/mouse acceptance, errors, file filtering and bounded directory results.
