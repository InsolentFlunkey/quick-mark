# QuickMark

A lightweight cross-platform Markdown viewer and editor built with Tauri.

## Run

After installing a platform package, launch QuickMark from the desktop or application menu. During development, use `npm run tauri dev`. You can also pass a supported `.md`, `.markdown`, or `.txt` path to the built executable.

## Features

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Print Friendly**: Prints clean rendered Markdown via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Native Files**: Open, Save, and Save As operate on real filesystem paths.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.

## Desktop development

The desktop foundation uses Tauri 2, Vite, and vanilla TypeScript. Linux and Windows are the initial supported targets; shared frontend code should remain platform-neutral, with native integration isolated under `src-tauri/`.

Markdown rendering, editor behavior, and presentation are kept in focused reusable modules:

- `shared/markdown-renderer.js` owns markdown-it configuration, link safety, code-block markup, and copy controls.
- `shared/markdown.css` owns rendered Markdown, code-block, table, and print presentation.
- `shared/editor-behavior.js` owns Markdown-aware indentation and list continuation.
- The desktop entry point supplies the locked npm markdown-it dependency.

### Fedora prerequisites

The foundation is verified on Fedora Linux 44. Install Tauri's native development dependencies:

```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel libxdo-devel @c-development
```

Install the stable Rust toolchain with [rustup](https://rustup.rs/) and a supported Node.js release. This repository was initially verified with Rust 1.98, Node.js 22.23, WebKitGTK 2.52, and GCC 16.2.

After cloning the repository:

```bash
npm install
npm run tauri dev
```

Build the frontend and desktop executable with:

```bash
npm run build
npm run tauri build
```

Run the automated renderer and fixture suite with:

```bash
npm test
```

The production executable is written beneath `src-tauri/target/release/`. Installer/package generation is intentionally deferred to the platform packaging tasks.

If Rust was installed while an IDE terminal was already open, restart the terminal or IDE so `$HOME/.cargo/bin` is included in `PATH`.
