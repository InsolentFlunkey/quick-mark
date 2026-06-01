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

- **Rename `run.ps1` and add a file argument** — *(done in commit `467b680`)* renamed to `Start-QuickMark.ps1`, accepts a positional file path, and renamed `$Setup` to `$SetupOnly`.

- **File System Access API integration** (Edge / Chrome) — replace the download-only Save and `<input type=file>` Open with `window.showOpenFilePicker` / `showSaveFilePicker`, so the user can save *back* to the same file. Also enables a "Recent files" list via `FileSystemFileHandle` objects persisted in IndexedDB.

  **Blocker:** the API requires a secure context (`window.isSecureContext === true`). A page loaded from `file://` is **not** a secure context in Chromium browsers, so today's double-click launch path can't use the API. Verify locally by pasting `window.isSecureContext` into DevTools — expected to log `false`.

  **Unblock path:** serve the page from `http://localhost` instead of `file://`. PowerShell has `System.Net.HttpListener` built in — a static file server is ~30 lines. `Start-QuickMark.ps1` would gain a `-Serve` switch that:
  1. Picks a free port.
  2. Spins up an `HttpListener` serving the project directory.
  3. Opens `http://localhost:PORT/QuickMark.html`.
  4. Stays running (close-to-stop) to keep serving.

  **Graceful degradation:** JS feature-detects `window.showOpenFilePicker`. When present, use the new flows. When absent (file:// users, Firefox, Safari), fall back to today's download/upload. No regression for anyone.

  **Browser support:** Edge/Chrome full since 2020; Firefox not supported and not on roadmap; Safari partial (pick yes, persistent write no).

  **Effort:** medium, ~1–2 focused days. Suggested first step is a spike — add the `-Serve` switch and verify `isSecureContext` + `showOpenFilePicker` are both available in the served page (~50 lines, ~1 hour) before committing to the full integration.

  **Tradeoff:** transitions QuickMark from "double-click and go" to "really should use the launcher." Worth it if save-back-to-file is a frequent use case.

- **"Open with QuickMark" Explorer context menu** — ship a pair of opt-in installer scripts (`Install-QuickMarkShellMenu.ps1` / `Uninstall-QuickMarkShellMenu.ps1`) that write a per-user registry entry routing right-clicks on `.md` (and `.markdown`) files to `Start-QuickMark.ps1 "%1"`.

  **Sketch:**
  ```powershell
  $startScript = Join-Path $PSScriptRoot "Start-QuickMark.ps1"
  $key = "HKCU:\Software\Classes\SystemFileAssociations\.md\shell\QuickMark"
  New-Item -Path $key -Force | Out-Null
  Set-ItemProperty -Path $key -Name "(Default)" -Value "Open with QuickMark"

  $cmdKey = "$key\command"
  New-Item -Path $cmdKey -Force | Out-Null
  $cmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass ' +
         '-WindowStyle Hidden -File "' + $startScript + '" "%1"'
  Set-ItemProperty -Path $cmdKey -Name "(Default)" -Value $cmd
  ```

  Per-user (`HKCU`) — **no admin elevation needed**. `-WindowStyle Hidden` eliminates the PowerShell window flash; missing-file errors still surface in-app via the launch-error banner (commit `467b680`).

  **Scope:** `.md` and `.markdown` only. Skip `.txt` (too invasive). Don't touch the *default* file association — this is an additional menu entry, not a replacement for the user's preferred editor.

  **Windows 11 note:** lives in the legacy menu (under "Show more options"). The modern menu API requires an App Package + AppUserModelID + an `IExplorerCommand` COM handler — far too much machinery for a single-file HTML app. Legacy menu is fine.

  **Risks:**
  - The path is baked into the registry — moving the project folder breaks the entry. Re-running the installer fixes it. Consider a defensive check on launch that warns if the registered path doesn't resolve.
  - Counter to "zero install" spirit, hence the deliberate opt-in via a separate script (not a flag on `Start-QuickMark.ps1`).

  **Effort:** small, ~1–2 hours. Two scripts, ~60 lines total. Uses the `Start-QuickMark.ps1 file.md` plumbing we already shipped — no app code changes.

  **Suggested order:** do this *before* the File System Access API work. It's smaller, self-contained, and immediately useful — and it's the more compelling shell-integration win for users who don't already use the launcher.
