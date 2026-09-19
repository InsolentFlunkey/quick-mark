# Automatic bracket-pairing native review

Run this checklist in a production build on Windows/WebView2 and Linux/WebKitGTK. Repeat the composition checks with an installed IME on each platform where one is available.

## Pairing and keyboard behavior

- [ ] In an empty document, type each of `(`, `[`, and `{`; confirm its closer appears and the caret remains between the pair.
- [ ] Type nested `([{`, then type `}])`; confirm the result is `([{}])` with no duplicated closers.
- [ ] Place the caret between a newly inserted pair and press Backspace; confirm both characters are removed by one keypress.
- [ ] Select text in both forward and backward directions, type each opener, and confirm the text remains selected inside the new pair.
- [ ] Type an opener immediately before a letter; confirm it is inserted without an unwanted closer.
- [ ] Type `\(`, `\[`, and `\{`; confirm each escaped opener remains a single literal character. Confirm an opener after two backslashes can still pair.

## Native input and integration

- [ ] Paste text containing unmatched and nested brackets; confirm the pasted text is unchanged and no extra closers appear.
- [ ] Use an IME to compose text containing or adjacent to brackets; confirm the candidate window, committed text, caret, and Undo behavior remain correct.
- [ ] Create a Markdown link by typing `[Guide](./`; confirm pairing permits the syntax and path suggestions still appear and can be accepted with Tab or Enter.
- [ ] Confirm Enter list continuation, Tab/Shift+Tab indentation, Escape-then-Tab focus exit, Undo, and Redo still behave as documented.
- [ ] Start a file operation that locks the editor and confirm typing, closer skipping, and paired Backspace cannot change the document until the operation finishes.
- [ ] Open a filesystem read-only file and confirm it remains editable in memory for Save As, including bracket pairing.
