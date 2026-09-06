# QuickMark

A lightweight cross-platform Markdown viewer and editor built with Tauri.

## Install and run on Linux

The current Linux distribution is an unsigned RPM built for Fedora-compatible systems. Install a downloaded package with:

```bash
sudo dnf install ./QuickMark-*.rpm
```

Launch **QuickMark** from the desktop application menu or run `quick-mark` in a terminal. A Markdown or text file can also be opened from the application menu, passed on the command line, or associated with QuickMark through the desktop's **Open With** interface:

```bash
quick-mark notes.md
```

The RPM declares its runtime libraries, so `dnf` installs any missing dependencies. Rust, Node.js, npm, compilers, and development headers are not required to run the installed application.

To remove QuickMark:

```bash
sudo dnf remove quick-mark
```

### Supported files and current limitations

QuickMark opens and saves `.md`, `.markdown`, and `.txt` files. Its Markdown dialect is defined below; embedded HTML is escaped for safety.

Linux is currently distributed only as an unsigned RPM. The package is tied to the Linux/glibc compatibility baseline of the system on which it was built; build release artifacts on the oldest supported Linux baseline. Windows packaging is tracked separately and is not yet documented as a supported distribution. QuickMark supports multiple document tabs in one editor window; README, Markdown Cheat Sheet, and Markdown Examples open in separate reference windows.

## Features

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Table Builder**: Use the toolbar button or **Insert → Table…** to choose columns, blank body rows, headers, and per-column alignment. Choose Left, Center, or Right for each column, or use the **All columns** Set buttons. Header placeholders are suggestions; blank fields remain blank. **Reset** restores the default 3×3 form, while **Cancel** discards it. The generated table replaces the current selection or is inserted at the cursor, ready for body-cell editing.
- **Print Friendly**: Prints clean rendered Markdown via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Native Files**: Open, Save, and Save As operate on real filesystem paths.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Synchronized Scrolling**: In Split view, source and preview follow each other by default. Toggle **View → Sync Scrolling** to disable or re-enable it; QuickMark remembers the setting. Alignment uses nearby Markdown blocks, so movement within one unusually tall block may be approximate.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.

## Document tabs

**New** creates an untitled tab. **Open**, **File → Recent Files**, dropped files and relative document links open a new tab or focus the tab already owning that filesystem path (including canonical symlink aliases). A failed open leaves existing tabs intact. A successful open reuses the active unchanged blank untitled tab; canceled or failed opens leave it intact. Tabs containing edits or an existing file remain open.

Each tab keeps its content, selection, scroll position and View settings. A dot marks unsaved changes. Tabs with matching filenames display their paths; hover a tab to see its full path. **Save**, **Save As**, **Edit → Clear** and **Insert → Table…** target the tab where the action began. Clear resets that tab to an untitled document after any required unsaved-change prompt. Save As refuses to overwrite a path already open in another tab.

Use a tab's **×** button or **File → Close Tab** to close it. Dirty tabs offer Save, Discard and Cancel. Closing the last tab leaves a fresh blank tab. **File → Close Window** checks all dirty tabs; Cancel keeps the window and tabs open (saves already completed remain saved). While a file operation or prompt is pending, editing and additional file operations are temporarily unavailable; tab switching remains available.

Tabs and unsaved content are not restored after restarting QuickMark. Existing recent-file history and preference defaults remain persisted. New tabs inherit the latest chosen View settings; changing one tab does not change other existing tabs. Detaching into another editor window is a later milestone.

## Keyboard navigation

- While focus is in the Markdown Input pane, press **Escape**, then **Tab** to move focus to the next application control. A normal **Tab** inserts indentation; **Shift+Tab** removes indentation from the current line or selected lines.
- Use **Ctrl+N** (**Command+N** on macOS) for New, **Ctrl+O** for Open, **Ctrl+S** for Save, **Ctrl+Shift+S** for Save As, **Ctrl+P** for Print, and **Ctrl+W** for Close Tab, and **Ctrl+Shift+W** for Close Window.
- Use **Ctrl+1**, **Ctrl+2**, and **Ctrl+3** (or the corresponding Command shortcuts on macOS) for Split, Input, and Preview views.
- In the tab strip, use **Left/Right**, **Home/End** to switch tabs and **Delete** to close the focused tab. **Tab** reaches the active tab’s Close button and the editor.
- In the Table Builder alignment grid, use **Tab** to reach a radio group and the arrow keys to choose Left, Center, or Right.

These instructions are also available inside QuickMark through **Help → README**. Use **Help → Markdown Cheat Sheet** for a read-only syntax guide with copyable source examples; **Help → Markdown Examples** remains an editable practice document. The cheat sheet is original QuickMark documentation based on the supported dialect below.

## Supported Markdown dialect

QuickMark uses the default syntax rules from markdown-it 15 with URL linkification and typographic replacements enabled. This is a CommonMark-derived dialect with selected extensions, not a claim of complete CommonMark or GitHub Flavored Markdown compatibility.

| Category | Status | QuickMark behavior |
| --- | --- | --- |
| Core block syntax | Supported | Paragraphs, ATX and Setext headings, blockquotes, ordered and unordered lists, thematic breaks, fenced code blocks, and indented code blocks render normally. |
| Core inline syntax | Supported | Emphasis, strong emphasis, inline code, escapes, entities, links, reference links, images, and hard line breaks render normally. A single newline remains a soft break because `breaks` is disabled. Desktop link and image destinations follow the resource rules below. |
| Tables | Supported extension | markdown-it's built-in GFM-style table rule is enabled, including column alignment markers. This does not imply support for every GFM feature. |
| Strikethrough | Supported extension | Text delimited by `~~` renders as strikethrough using markdown-it's built-in rule. |
| Bare URLs and typography | Supported extensions | URL-like text is automatically linked. Straight quotation marks and selected character sequences are replaced by markdown-it's language-neutral typographer rules. |
| Code language labels and copying | Supported presentation | A fenced code language adds a `language-*` class, and fenced or indented blocks receive a Copy button. QuickMark does not perform colored syntax highlighting. |
| Raw HTML | Deliberately restricted | HTML blocks and inline tags are displayed as text rather than inserted into the document. |
| Link schemes | Deliberately restricted | HTTP, HTTPS, mailto, in-page anchors, and relative document paths are accepted. Explicit schemes such as `javascript`, `data`, and `vbscript`, absolute filesystem paths, and unsupported relative file types are rejected. |
| Task lists | Unsupported optional syntax | `[ ]` and `[x]` remain literal text in an ordinary list; QuickMark does not render checkboxes. |
| Footnotes and definition lists | Unsupported optional syntax | No footnote or definition-list plugins are enabled. Similar-looking input may be interpreted by ordinary link-reference or paragraph rules. |
| Heading anchors and front matter | Unsupported optional syntax | QuickMark does not generate heading IDs or interpret `{#id}` attributes, YAML, TOML, or JSON front matter. Delimiter lines may still have their normal Markdown meaning. |
| Math and diagrams | Unsupported optional syntax | TeX-style math remains text. Mermaid and other diagram fences render as code and are never executed. |
| Other plugin syntax | Unsupported unless listed above | Abbreviations, emoji shortcodes, superscript, subscript, inserted/marked text, containers, and a table of contents are not added by QuickMark. |

### Rendered links and images

- Clicking an HTTP or HTTPS link opens it in the system's default browser. A `mailto:` link opens the system's registered mail application. QuickMark intercepts both kinds so the editor window is never replaced by the destination.
- A fragment-only link stays in the current preview and scrolls to a matching rendered element when one exists. QuickMark does not generate heading IDs automatically.
- A relative link to an `.md`, `.markdown`, or `.txt` file is resolved from the active document's folder and opens in a new tab, or focuses its existing tab. Other tabs and their unsaved edits remain intact. Missing or inaccessible files produce an error without replacing the current document.
- Relative local images are also resolved from the active document's folder. PNG, JPEG, GIF, WebP, and BMP files up to 10 MiB are loaded through a restricted native reader. Missing, inaccessible, oversized, and unsupported local images remain inert and show their alternative text and an explanatory tooltip or status message.
- Explicit HTTP(S) image URLs remain remote images. QuickMark does not load `data:`, SVG, absolute-filesystem, or other explicitly schemed local image targets.
- An untitled document and the bundled reference windows have no filesystem folder. Save the document first before using relative document links or local images. This restriction does not affect web links or remote HTTP(S) images.

## Desktop development

The desktop foundation uses Tauri 2, Vite, and vanilla TypeScript. Linux and Windows are the initial supported targets; shared frontend code should remain platform-neutral, with native integration isolated under `src-tauri/`.

Markdown rendering, editor behavior, and presentation are kept in focused reusable modules:

- `shared/markdown-renderer.js` owns markdown-it configuration, link safety, code-block markup, and copy controls.
- `shared/markdown.css` owns rendered Markdown, code-block, table, and print presentation.
- `shared/editor-behavior.js` owns Markdown-aware indentation and list continuation.
- The desktop entry point supplies the locked npm markdown-it dependency.

### Frontend content security policy

QuickMark applies an explicit Content Security Policy in packaged and development builds. Unspecified resource types are
blocked by default, as are objects, frames, base-URL changes, and form submissions. Scripts, fonts, and application assets
must come from the app itself. Tauri IPC is limited to the framework's `ipc:` and `http://ipc.localhost` transports.

Rendered Markdown images may use HTTP or HTTPS. Restricted local-image reads are converted to temporary `blob:` URLs;
`data:` remains available to application-owned image content. These image sources cannot execute as scripts, and raw HTML
in Markdown remains disabled. External links are opened by the operating system rather than navigating the QuickMark
webview.

Inline scripts and dynamic code evaluation are not permitted. Inline styles remain allowed because synchronized-scroll
measurement and the clipboard fallback apply temporary runtime styles to application-created elements. User-authored HTML
is escaped, so this style exception does not allow Markdown documents to inject elements or scripts. Development adds
WebSocket connectivity for Vite hot reload; packaged builds do not allow WebSocket or ordinary network connections.

### Fedora development prerequisites

The foundation is verified on Fedora Linux 44. Install Tauri's native development dependencies:

```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel libxdo-devel @c-development
```

Install the stable Rust toolchain with [rustup](https://rustup.rs/) and a supported Node.js release. These are build-time requirements, not RPM runtime requirements. This repository was initially verified with Rust 1.98, Node.js 22.23, WebKitGTK 2.52, and GCC 16.2.

From a clean checkout, install the locked JavaScript dependencies and run the development application:

```bash
npm ci
npm run tauri dev
```

Run all automated checks and build the frontend:

```bash
npm test
npm run build
cd src-tauri
cargo test
cargo fmt --check
cargo check
cd ..
```

Build the release executable and Fedora RPM with:

```bash
npm run tauri build -- --bundles rpm
```

The executable is written to `src-tauri/target/release/quick-mark`; the installable package is written beneath `src-tauri/target/release/bundle/rpm/`. Inspect or install that RPM with:

```bash
rpm -qip src-tauri/target/release/bundle/rpm/QuickMark-*.rpm
sudo dnf install ./src-tauri/target/release/bundle/rpm/QuickMark-*.rpm
```

Tauri Linux bundles inherit the build host's glibc baseline. For broadly distributed releases, build in a controlled environment based on the oldest supported distribution rather than an arbitrary newer workstation.

If Rust was installed while an IDE terminal was already open, restart the terminal or IDE so `$HOME/.cargo/bin` is included in `PATH`.
