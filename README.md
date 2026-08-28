# QuickMark

A lightweight Markdown viewer and editor. QuickMark is migrating from its original browser-only application to a cross-platform Tauri desktop application. The existing `QuickMark.html` application remains available while features move incrementally to the desktop shell.

## Run

- Double-click `QuickMark.html`, or
- From PowerShell: `.\Start-QuickMark.ps1` (downloads `markdown-it` if missing, syncs `README.md` into `vendor/readme.js`, then launches the page).
- From PowerShell with a file: `.\Start-QuickMark.ps1 notes.md` opens the page with that file preloaded.

## Dependency download

This project expects `vendor/markdown-it.min.js` and `vendor/readme.js` at runtime, but neither is committed. `.\Start-QuickMark.ps1` handles both automatically. If you want to prepare everything without launching (e.g. before going offline):

- Run `.\Start-QuickMark.ps1 -SetupOnly` to download and generate the vendor files, or
- Just open `QuickMark.html` while online and it will fall back to loading `markdown-it` from `unpkg.com` (you’ll see a banner when this happens). The **README** button falls back to drag-and-drop in that case.

## Features

- **Smart Editor**: Auto-indents, auto-continues markdown lists (`- `, `1. `), and supports `Tab`/`Shift+Tab` for block indentation.
- **Print Friendly**: Optimized for printing clean Markdown directly from the browser via the **Print** button.
- **Copy Code**: Adds a copy-to-clipboard button on every fenced code block.
- **Save**: Use the **Save** button to download the current input as a `.md` file.
- **Views**: Use the **View** dropdown to show the Input pane, Preview pane, or both.
- **Safety**: Escapes HTML from the input Markdown to prevent malicious scripts from running.

## Desktop development

The desktop foundation uses Tauri 2, Vite, and vanilla TypeScript. Linux and Windows are the initial supported targets; shared frontend code should remain platform-neutral, with native integration isolated under `src-tauri/`.

Markdown rendering and presentation are shared across the desktop and legacy browser entry points:

- `shared/markdown-renderer.js` owns markdown-it configuration, link safety, code-block markup, and copy controls.
- `shared/markdown.css` owns rendered Markdown, code-block, table, and print presentation.
- The browser page supplies its vendored/global markdown-it build; the desktop entry point supplies the locked npm dependency.

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
