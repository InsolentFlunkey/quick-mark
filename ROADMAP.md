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
- **Swap Input / Preview panes** — a toolbar control to flip the left/right ordering of the two panes, with the choice persisted to `localStorage`.

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

## Performance

- **Debounce render + persistence** — every keystroke currently re-parses the entire document and writes to `localStorage`. Add a ~120 ms debounce on `update()` and a longer debounce on the localStorage write to keep large documents responsive.

## Editor & UX (additional)

- **Restore filename with content** — on reload, restore the last `currentFilename` alongside the cached text, instead of falling back to `document.md`.
- **Keyboard escape from the editor** — Tab is captured unconditionally inside the textarea, leaving no native way to tab out. Either follow the common `Esc → Tab` pattern or document the trap for accessibility.

## Security & Hardening

- **Content-Security-Policy meta tag** — add a `default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline'` (or similar) to harden the CDN fallback path.
- **Unify localStorage key prefix** — `markdown-viewer:content` and `quickmark:view` should share the same `quickmark:` prefix.

## Docs

- **Document `vendor/readme.js`** — explain in the README that this generated file backs the **README** button so it works from `file://` without `fetch`.

## Tooling & OS integration

- **Rename `run.ps1` and add a file argument** — rename to a verb-noun PowerShell-conventional name (e.g. `Start-QuickMark.ps1` or `Open-QuickMark.ps1`) and accept a positional path argument so users can do `Start-QuickMark.ps1 notes.md` to open a specific file directly. Rename the `$Setup` switch to `$SetupOnly` for clarity.
- **Edge File System Access API integration** — investigate using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (`window.showOpenFilePicker` / `showSaveFilePicker`) when running in Chromium-based browsers (Edge, Chrome). This would allow true open/save with a persisted file handle, replacing the download-only Save and `<input type=file>` Open flows. Needs a graceful fallback for Firefox/Safari and for `file://` origins (the API requires a secure context — local files may or may not qualify depending on browser).
- **"Open with QuickMark" Explorer context menu** — investigate a Windows shell integration so right-clicking a `.md` file offers "Open with QuickMark". Likely implemented via a registry entry under `HKCU\Software\Classes\*\shell\QuickMark\command` (or scoped to `.md`/`SystemFileAssociations`) that launches `QuickMark.html` with the file path. Open questions: how to pass the file path to a static HTML page (query-string + fetch works only over `http(s)://`; `file://` blocks `fetch`), whether to ship a small launcher script that injects the file content into `vendor/readme.js`-style bootstrap, and whether to provide an installer/uninstaller PowerShell script.
