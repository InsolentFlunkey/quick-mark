# QuickMark Roadmap

Future improvements planned for QuickMark, in no particular order. Each item keeps the spirit of the project: single-file, zero-install, works offline from the browser.

## Editor & UX

- **Theme toggle (light / dark)** — user-selectable, with preference persisted to `localStorage`. Default to system preference via `prefers-color-scheme`.
- **Keyboard shortcuts**
  - `Ctrl/Cmd + S` — Save
  - `Ctrl/Cmd + P` — Print (and/or export)
  - `Ctrl/Cmd + B` — wrap selection in `**bold**`
  - `Ctrl/Cmd + I` — wrap selection in `*italic*`
  - `Ctrl/Cmd + K` — insert link around selection
  - `Ctrl/Cmd + F` — find/replace (see below)
- **Find & replace** in the editor with match count, case-sensitivity toggle, and regex mode.
- **Synchronized scroll** between the input and preview panes (percentage-based or heading-anchored).
- **Word count + reading time** in the status bar (alongside the existing char count).
- **Image paste / drag support** — accept images from clipboard or drag-drop and embed as base64 `data:` URLs inline.
- **Multiple documents / tabs** — keep several buffers open at once, each persisted separately.

## Rendering

- **Syntax highlighting** in fenced code blocks via `highlight.js` (or `prism`), with a local vendor copy like the existing `markdown-it` fallback.
- **GitHub-Flavored Markdown extras**
  - Tables
  - Task lists (`- [ ]` / `- [x]`)
  - Strikethrough (`~~text~~`)
  - Autolinked issue/PR references (optional)
- **Table of contents / heading anchors** — auto-generated `id`s on headings plus an optional `[[toc]]` directive.

## Export

- **Export to HTML** — produce a standalone `.html` with inlined CSS, suitable for sharing.
- **Export to PDF** — beyond the current Print flow, offer a one-click PDF via `window.print()` with a PDF-tuned stylesheet, or via a client-side library.
