---
id: doc-001
title: 'QuickMark: Viewer/Editor Split Investigation'
type: specification
created_date: '2026-07-01 16:50'
updated_date: '2026-07-01 17:03'
tags:
  - investigation
  - architecture
  - task-001
---
## Context

QuickMark.html is a single static page that both renders and edits Markdown. It's launched either by double-clicking the file or via `Start-QuickMark.ps1`, which is Windows/PowerShell-only tooling already. This doc investigates splitting it into a viewer-only web page plus a separate desktop editor app with native file I/O, per task-001.

## 1. Current file open/save flakiness — root causes

Read from `QuickMark.html`:

- **Open (file picker / drag-drop)**: uses `<input type=file>` and the HTML5 drop event, then `file.text()`. This part is actually fine and standard — not the flaky piece.
- **Open (launch-with-file)**: `Start-QuickMark.ps1 -File foo.md` reads the file in PowerShell, writes it into `vendor/launch.js` as `window.__LAUNCH_FILE__ = {...}`, then `Start-Process` opens the HTML in the default browser, which picks the global up on load (guarded by a `sessionStorage` "consumed" flag). This is a workaround for the fact that a static HTML file has no way to receive a file path argument directly — it's fragile (depends on running the PS1 first, breaks if the page is opened directly, only works for one file per launch) but not the thing the user called "flaky" about saving.
- **Save**: `saveBtn` builds a `Blob`, an `object URL`, and a synthetic `<a download>` click. This is the core problem:
  - It **always downloads a new file** (typically to the Downloads folder) — it never writes back to the original file location/handle. There is no persistent reference to the file the user opened.
  - Repeated saves of the same filename get silently suffixed (`document (1).md`, `document (2).md`, ...) by the browser, or silently overwritten, depending on browser download settings — behavior the app has no control over.
  - The user must manually move the downloaded file back over the original to actually update it, which is the "flaky" part in practice.
  - `beforeunload` dirty-tracking (`isDirty()`) only warns about unsaved changes; it can't do anything to actually persist them.
- **Why not the File System Access API** (`showOpenFilePicker` / `showSaveFilePicker`, which *do* support real overwrite-in-place with a retained file handle): it's Chromium-only (Chrome/Edge; not Firefox/Safari), so adopting it would trade one kind of flakiness (fake save-as-download) for another (inconsistent behavior across browsers) unless the app detects support and falls back — extra complexity for a static single-file app.
- **Serving over `file://`**: `fetch("README.md")` fails under `file://`, which is why the README-loading feature needs its own PowerShell-generated `vendor/readme.js` shim. Another symptom of the same underlying constraint: a static browser page has very limited, inconsistent access to the local filesystem.

**Bottom line**: the flakiness isn't a bug, it's a structural limitation — browsers deliberately sandbox local file access, and the current design routes around that sandbox with a download-trick for save and a PowerShell-generated JS shim for open. Both are workarounds, not fixes.

## 2. Desktop app approaches evaluated

The repo currently has **no build tooling** (no `package.json`, no npm/node dependency) and is already Windows/PowerShell-oriented (`Start-QuickMark.ps1`). Toolchain cost is evaluated per the *developer's* existing setup, not the repo's current file listing — every stack requires installing something the first time a given repo adopts it, so "not in this repo yet" isn't by itself a differentiator.

### Option A — Tauri (recommended)

Rust-backed shell using the OS webview (WebView2 on Windows), with the existing front-end reused as-is and file I/O exposed via Tauri's built-in dialog/fs plugins.

- **Pros**: Same WebView2 rendering as any WebView2-based option, so visual/behavioral parity with today's app is easy. Much smaller install than Electron (~10-20MB), secure-by-default permission model, and genuinely cross-platform later if that's ever wanted. Reuses existing HTML/CSS/JS with little to no custom Rust needed for basic open/save/dialog. The maintainer already has a working Rust/Cargo/Tauri/Vite/TypeScript toolchain proven out on this machine from another project, so there is no new toolchain or learning curve to pay for here.
- **Cons**: Smaller ecosystem/community than Electron (not a practical concern at this app's scale). Front-end build conventions (Vite, etc.) will need to be set up for this repo specifically, since it has none today.

### Option B — WPF or WinForms host + WebView2

Embed a `Microsoft.Web.WebView2` control in a thin C#/.NET shell and load the existing HTML/CSS/JS almost unchanged inside it.

- **Pros**: Reuses ~95% of existing front-end code as-is. Real native file APIs (`OpenFileDialog`/`SaveFileDialog`, `File.ReadAllText`/`WriteAllText`) eliminate the flakiness at the root — true overwrite-in-place, Ctrl+S, recent files, optional `.md` file association ("Open with QuickMark"). Fits naturally next to the existing PowerShell launcher, which already leans on .NET types directly (`[System.IO.File]`, `[System.Text.Encoding]`).
- **Cons**: Windows-only. Requires the .NET SDK, and — unlike Tauri here — this would be a toolchain/stack the maintainer doesn't already have hands-on experience with elsewhere. Worth reconsidering only if Tauri turns out to be a poor fit in practice, or deeper native Windows integration is needed than Tauri's plugins provide.

### Option C — Electron (ruled out)

Bundles Chromium + Node; front-end runs almost verbatim, file I/O via Node's `fs` in the main process over IPC.

- **Pros**: Easiest possible migration of the existing JS, huge ecosystem/docs, mature auto-updater and packaging story.
- **Cons**: Heaviest option by far — ~150-200MB installs since it bundles its own Chromium/Node rather than reusing the OS webview. Larger security surface to configure correctly. Overkill for an app this simple. Ruled out.

### Recommendation

**Tauri.** It renders identically to any other WebView2-based option on Windows, produces a small and optionally cross-platform binary, and — decisively — the maintainer already has a working Tauri + Vite + TypeScript toolchain in daily use on this same machine from another project, so adopting it here carries no new tooling or learning cost. WPF/WinForms + WebView2 remains a reasonable fallback if Tauri proves to be a poor fit in practice, but is no longer the lead recommendation.

## 3. Viewer vs. desktop-editor scope split

**Viewer-only `QuickMark.html`** (stays static, zero-install, browser-based):

- Keep: Markdown rendering (markdown-it config, styling, codeblock copy-to-clipboard, table/print styling), drag-and-drop or file-picker to *load* a file for viewing, the View toggle, Print.
- Change: The input `<textarea>` becomes read-only (a "source" view) or is removed in favor of preview-only; drop the Save button, dirty-tracking, and `beforeunload` warning entirely (nothing to lose if there's no editing).
- Rationale: matches the existing "local, no install" tagline — this is for quickly *looking at* a Markdown file, not authoring one.

**Desktop editor app** (new, Tauri):

- Owns: editing (textarea + existing Tab/Enter list-continuation keyboard logic, reused unchanged), live preview (same renderer), and all file I/O — Open, Save, Save As, Ctrl+S, proper "unsaved changes" native dialog on close, recent-files list, optional `.md` file association — via Tauri's dialog/fs plugins.
- This is where the flakiness is actually fixed, by construction (native file handles, no download-trick).

**Shared code recommendation**: extract the markdown-it setup + rendering CSS + codeblock/copy-button logic into a shared module/file consumed by *both* the viewer page and the Tauri app's webview, so visual/behavioral parity is maintained without duplicating the renderer in two places as Markdown features evolve.

## Next steps (not part of this investigation)

If this direction is approved, follow-up implementation work should be filed as a new parent task with subtasks (e.g., extract shared renderer module, scaffold the Tauri + Vite shell, wire native Open/Save via Tauri plugins, strip editing from the viewer page, update `Start-QuickMark.ps1` or replace it with the new app's launcher) rather than expanding task-001 further.
