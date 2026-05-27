# Test files

Small fixtures for manually exercising QuickMark. Drag any of these onto the page (or use the file picker) and look for the behavior described.

| File | What it tests |
| --- | --- |
| `kitchen-sink.md` | Headings, paragraphs, blockquotes, lists, inline code, `<hr>`, autolinks. The broadest single-page smoke test. |
| `code-blocks.md` | Fenced code blocks, language hints, the per-block **Copy** button, and HTML escaping inside code. |
| `links.md` | External `https://` links should open in a new tab with `rel="noopener noreferrer"`. Anchor and relative links should stay in-tab. |
| `print-test.md` | Print this with the View dropdown set to **Input Pane** — the preview should still appear in the print output. |
| `notes.markdown` | Loads a `.markdown` file. Click **Save** and confirm the download is `notes.md`, not `notes.markdown.md`. |
| `notes.txt` | Same as above but for `.txt`. Save should produce `notes.md`. |
| `xss.md` | Raw HTML / `javascript:` URLs should be neutralized (rendered as text, not executed). |
| `lists-and-indent.md` | After loading, place the cursor at the end of a list item and press Enter to confirm the list auto-continues; Tab/Shift+Tab should indent/outdent. |
