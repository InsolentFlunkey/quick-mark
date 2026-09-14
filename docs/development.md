# Development and contributions

[README](../README.md)

The desktop foundation uses Tauri 2, Vite, and vanilla TypeScript. Linux and Windows are the initial supported targets; shared frontend code should remain platform-neutral, with native integration isolated under `src-tauri/`.

Markdown rendering, editor behavior, and presentation are kept in focused reusable modules:

- `shared/markdown-renderer.js` owns markdown-it configuration, link safety, code-block markup, and copy controls.
- `shared/markdown.css` owns rendered Markdown, code-block, table, and print presentation.
- `shared/editor-behavior.js` owns Markdown-aware indentation and list continuation.
- The desktop entry point supplies the locked npm markdown-it dependency.

## Frontend content security policy

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

## Working on QuickMark

Start with [Building on Windows](build-windows.md) or [Building on Linux](build-linux.md) for tool installation, a source checkout, test commands and packaging. Use [Release verification](release-verification.md) to check a release.

Before proposing a change, read the repository’s AGENTS.md and review existing Backlog.md tasks to avoid duplicate work. Describe the user-visible problem, keep changes focused, and include the relevant automated checks and manual verification in your contribution. Task management in this project uses the Backlog.md tools.

## Documentation maintenance

README.md is the product landing page; detailed user and developer instructions live in the guides linked there. The same Markdown files ship with the app for offline use through Help → README. Keep relative guide links within that bundle and provide a return link to README. Adding a guide requires updating the explicit bundle in src/bundled-guides.ts. Same-document section links use the shared renderer's heading-anchor contract; file-qualified fragments are not supported.
