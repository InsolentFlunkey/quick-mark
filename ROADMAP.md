# QuickMark Roadmap

Future improvements planned for the cross-platform QuickMark desktop application. Active work is tracked in Backlog.md; this file preserves longer-term product ideas.

## Editor & UX

- **Theme toggle (light / dark)** — user-selectable and persisted, defaulting to the system preference.
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
- **Multiple documents / tabs** — keep several independent buffers open at once.

## Rendering

- **Syntax highlighting** in fenced code blocks via a maintained highlighting library.
- **GitHub-Flavored Markdown extras**
  - Tables
  - Task lists (`- [ ]` / `- [x]`)
  - Strikethrough (`~~text~~`)
  - Autolinked issue/PR references (optional)
- **Table of contents / heading anchors** — auto-generated `id`s on headings plus an optional `[[toc]]` directive.

## Export

- **Export to HTML** — produce a standalone `.html` with inlined CSS, suitable for sharing.
- **Export to PDF** — beyond the current Print flow, offer a dedicated PDF export.

## Performance

- **Debounce rendering** — avoid reparsing very large documents on every keystroke while preserving responsive preview updates.

## Security & Hardening

- **Content Security Policy review** — keep Tauri capabilities and frontend content restrictions minimal as native features are added.

## Desktop integration

- **Recent files and native menus** — tracked by TASK-002.12.
- **Platform file associations** — integrate `.md` and `.markdown` with packaged Linux and Windows applications without replacing the user's preferred editor unless explicitly selected.
