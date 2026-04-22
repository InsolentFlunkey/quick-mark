# QuickMark

A tiny local Markdown viewer (no install, no venv) that runs in a web browser. It uses `markdown-it` for accurate rendering and adds a copy-to-clipboard button on every fenced code block (```).

## Run

- Double-click `QuickMark.html`, or
- From PowerShell: `.\run.ps1` (downloads `markdown-it` if missing, syncs `README.md` into `vendor/readme.js`, then launches the page).

## Dependency download

This project expects `vendor/markdown-it.min.js` and `vendor/readme.js` at runtime, but neither is committed. `.\run.ps1` handles both automatically. If you want to prepare everything without launching (e.g. before going offline):

- Run `.\run.ps1 -Setup` to download and generate the vendor files, or
- Just open `QuickMark.html` while online and it will fall back to loading `markdown-it` from `unpkg.com` (you’ll see a banner when this happens). The **README** button falls back to drag-and-drop in that case.

## Features

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Print Friendly**: Optimized for printing clean Markdown directly from the browser via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Save**: Use the **Save** button to download the current input as a `.md` file.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.
