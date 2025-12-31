# QuickMark

A tiny local Markdown viewer (no install, no venv). It uses `markdown-it` for accurate rendering and adds a copy-to-clipboard button on every fenced code block (```).

## Run

- Double-click `QuickMark.html`, or
- From PowerShell: `.\run.ps1` (will try to download `markdown-it` if missing)

## Dependency download

This project expects `vendor/markdown-it.min.js` at runtime, but it is not committed.

- Run `.\setup.ps1` to download it (requires internet), or
- Just open `QuickMark.html` while online and it will fall back to loading from `unpkg.com` (you’ll see a banner when this happens).

## Notes

- This is a simple renderer (headings, lists, blockquotes, links, inline code, fenced code blocks).
- It escapes HTML from the input Markdown for safety.
- Use the **Save** button to download the current input as a `.md` file.
