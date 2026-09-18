# CodeMirror editor-foundation research

This directory is the isolated TASK-031 proof of concept. It does not replace
QuickMark's production textarea and is excluded from ordinary production builds.

## Build and run

From the repository root:

```powershell
npm run research:codemirror:build
npm run research:codemirror:dev
```

The development page is served at `http://127.0.0.1:1422` by default. Build the
standalone native WebView2 proof with:

```powershell
npm.cmd run tauri -- build --debug --no-bundle --config research/codemirror/tauri.conf.json -- --locked
```

The resulting executable is `src-tauri/target/debug/quick-mark.exe`. This build
contains the proof page, not the ordinary QuickMark UI. Rebuild the ordinary app
after review before using that path as QuickMark.

## Native benchmark

The benchmark uses the TASK-008 deterministic 256 KiB and 1 MiB fixtures. It
measures CodeMirror's editor surface without QuickMark's Preview renderer so that
the editor cost remains attributable.

```powershell
npm.cmd run tauri -- build --debug --no-bundle --features benchmark --config research/codemirror/tauri.benchmark.conf.json -- --locked
./research/codemirror/run-native.ps1 -RunName native-webview2
```

Choose a new run name for every attempt. The runner never overwrites a trace.
The retained baseline is under `baseline/` and is summarized in
[findings.md](findings.md).

## Manual review

1. Click a line number. The entire logical line is selected, including its
   terminating newline when present.
2. Drag from a line number upward and downward. The range includes every logical
   line and preserves drag direction. Drag beyond the top and bottom edges to
   exercise autoscroll.
3. Shift-click a line number. The existing selection anchor extends to the full
   target line.
4. Repeat with the blank line, the wrapped paragraph and the final unterminated
   line. A wrapped source line has one line number.
5. Type, delete, copy, cut and replace a gutter selection. It behaves as ordinary
   editable text selection.
6. Continue and terminate Markdown lists; use Tab and Shift+Tab at a cursor and
   across multiple selected lines.
7. Type `(`, `[` and `{` with an empty and nonempty selection; type the closer and
   use Backspace between an untouched pair.
8. In the sample link, press Ctrl+Space and choose a file or directory. Completion
   remains asynchronous and does not claim Tab.
9. Switch documents, make edits, Undo, switch back and use **Round-trip detached
   transfer**. Content, directional selection, scroll and history remain isolated.
10. Toggle the busy lock. Input is blocked only while busy; a filesystem-read-only
    document would remain editable in memory for Save As, matching QuickMark.
11. Apply diagnostics. Hover exact and line-only marks, press F8, and open the
    diagnostic panel with its button or Ctrl+Shift+M.
12. Press Escape then Tab to leave the editor. Return and verify that Tab indents
    again.
13. Enter composed text with an installed IME and verify that composition is not
    split or duplicated. Review the editor and diagnostic panel with NVDA.

Linux/WebKitGTK requires an equivalent native pass; Windows results do not prove
Linux input or screen-reader behavior.
