# QuickMark

A lightweight cross-platform Markdown viewer and editor built with Tauri. Available for Windows and Linux: write Markdown, see it rendered, and work directly with local files.

## Features

- **Write and preview together.** Choose Input, Preview, or Split view. Synchronized scrolling keeps source and rendered content aligned while you read and edit.
- **Work across documents.** Open Markdown and text files in tabs, revisit Recent Files, or move a tab into its own editor window. Each tab keeps its content and view settings.
- **Edit Markdown comfortably.** Automatic indentation and list continuation keep writing moving; Tab and Shift+Tab indent or unindent lines and selections.
- **Build tables.** Choose headers, row and column counts, and column alignment in the Table Builder, then insert Markdown at the cursor or replace a selection.
- **Check formatting.** Run Markdown linting, navigate issues in the source, and choose the rules you want. Optional lint-before-save lets you review issues or save anyway. Linting offers advice without rewriting your text.
- **Save with conflict protection.** Open, Save, and Save As use real filesystem paths. Notices about external file changes let you reload, keep editing, or save a separate copy.
- **Read and share rendered content.** Render tables, strikethrough, links and images; copy code blocks with a button or print the rendered document. Raw HTML is displayed as text.
- **Learn inside the app.** Bundled offline guides, a Markdown Cheat Sheet with copyable examples, and an editable Markdown Examples document are available from Help.

## Get started

QuickMark opens and saves `.md`, `.markdown`, and `.txt` files. Install a package you built or obtained from a trusted source using [Installing QuickMark](docs/installation.md). If you do not have an installer, build from source on [Windows](docs/build-windows.md) or [Linux](docs/build-linux.md). Those guides cover prerequisites, checkout, commands and package locations.

Launch QuickMark and choose **File → Open**, or start writing in the blank tab. Choose **View → Split** to see your source and preview together, then **File → Save** to keep your work.

### Platforms and current limits

- **Windows:** x64 desktop builds with an unsigned NSIS installer; Microsoft Edge WebView2 is required. Verification currently targets the maintainer’s Windows 11 x64 PC.
- **Linux:** unsigned RPM packages for Fedora-compatible systems, subject to the build host’s glibc baseline.
- Tabs and unsaved content are **not restored after a restart**. Save your work before closing; Recent Files and preference defaults persist.
- Markdown support is CommonMark-derived with selected extensions. This release does not yet render task-list checkboxes, footnotes, generated heading anchors, math, or diagrams. These are current implementation limits, not permanent exclusions. See [Markdown support](docs/markdown.md) for the full dialect and resource rules.
- Automatic updates and signed releases are not configured.

## Guides

These guides are also bundled in **Help → README** for offline reading. Guide links stay in the read-only help window; external web links open your browser. Use the help window’s **Back** button to return to the previous guide and your reading position. Each guide also has a **README** link to the overview, both here and in the app.

| Guide | What you’ll find |
| --- | --- |
| [Installing QuickMark](docs/installation.md) | Runtime requirements, installing, launching, updating and removing the app. |
| [Editing and managing documents](docs/editing.md) | Editor tools, tabs, windows, keyboard navigation and external file changes. |
| [Markdown linting](docs/linting.md) | Rule settings, issue navigation and lint-before-save decisions. |
| [Markdown support](docs/markdown.md) | Supported syntax, deliberate limitations, links and images. |
| [Building on Windows](docs/build-windows.md) | Windows tools, source checkout, checks and NSIS packaging. |
| [Building on Linux](docs/build-linux.md) | Fedora tools, source checkout, checks and RPM packaging. |
| [Development and contributions](docs/development.md) | Code organization, security policy and contribution workflow. |
| [Release verification](docs/release-verification.md) | Packaged-app and documentation smoke checks. |
