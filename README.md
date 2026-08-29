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

QuickMark opens and saves `.md`, `.markdown`, and `.txt` files. It renders CommonMark-style Markdown with tables and fenced code blocks, and escapes embedded HTML for safety.

Linux is currently distributed only as an unsigned RPM. The package is tied to the Linux/glibc compatibility baseline of the system on which it was built; build release artifacts on the oldest supported Linux baseline. Windows packaging is tracked separately and is not yet documented as a supported distribution. QuickMark is a single-document editor; README and Markdown Examples open in separate reference windows.

## Features

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Table Builder**: Use the toolbar button or **Insert → Table…** to choose columns, blank body rows, headers, and per-column alignment. Choose Left, Center, or Right for each column, or use the **All columns** Set buttons. Header placeholders are suggestions; blank fields remain blank. **Reset** restores the default 3×3 form, while **Cancel** discards it. The generated table replaces the current selection or is inserted at the cursor, ready for body-cell editing.
- **Print Friendly**: Prints clean rendered Markdown via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Native Files**: Open, Save, and Save As operate on real filesystem paths.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Synchronized Scrolling**: In Split view, source and preview follow each other by default. Toggle **View → Sync Scrolling** to disable or re-enable it; QuickMark remembers the setting. Alignment uses nearby Markdown blocks, so movement within one unusually tall block may be approximate.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.

## Desktop development

The desktop foundation uses Tauri 2, Vite, and vanilla TypeScript. Linux and Windows are the initial supported targets; shared frontend code should remain platform-neutral, with native integration isolated under `src-tauri/`.

Markdown rendering, editor behavior, and presentation are kept in focused reusable modules:

- `shared/markdown-renderer.js` owns markdown-it configuration, link safety, code-block markup, and copy controls.
- `shared/markdown.css` owns rendered Markdown, code-block, table, and print presentation.
- `shared/editor-behavior.js` owns Markdown-aware indentation and list continuation.
- The desktop entry point supplies the locked npm markdown-it dependency.

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
