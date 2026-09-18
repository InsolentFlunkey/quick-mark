---
id: doc-014
title: CodeMirror editor foundation recommendation
type: other
created_date: '2026-09-18 03:54'
tags:
  - research
  - editor
  - architecture
  - performance
  - accessibility
---
# CodeMirror editor foundation recommendation

TASK-031's isolated proof supports adopting CodeMirror 6 through a staged, reversible editor adapter, conditional on native Windows accessibility/IME/pointer approval and equivalent Linux/WebKitGTK review before removing the textarea.

## Decision evidence

- Explicit CodeMirror 6 packages are actively maintained and MIT licensed.
- Vite bundles all code into local assets compatible with QuickMark's existing Tauri CSP; no runtime network dependency is introduced.
- The isolated bundle is 401.7 kB minified / 131.6 kB gzip. An integrated production build must be remeasured and must add third-party license notices.
- A native Windows WebView2 benchmark at 256 KiB and 1 MiB shows approximately 19 ms median editor-only edit-to-two-frame opportunity at both sizes. This does not include QuickMark's full Preview rerender and is not a whole-app performance promise.
- CodeMirror supports per-document state/history, versionable transfer, async completion, configurable bracket pairing and ranged lint diagnostics.
- QuickMark-specific indentation/list behavior must remain custom; CodeMirror's default CommonMark command does not match every existing case.
- The required TASK-023 click, Shift-click, directional drag and edge-autoscroll gutter behavior is implemented as a supported extension using line-number event and geometry APIs. Native pointer review remains an adoption gate.
- Existing TASK-011 worker scheduling and results remain authoritative; CodeMirror receives only completed current diagnostics.
- Windows WebView2 synthetic execution is proven. Human NVDA/IME review and Linux/WebKitGTK input/accessibility review remain pending.

## Migration boundary

1. Introduce a textarea-backed EditorAdapter without behavior changes.
2. Add CodeMirror behind a reversible development switch.
3. Move versioned per-document state and detached transfer behind the adapter.
4. Port commands, completion, tables, focus and synchronized scrolling.
5. Add inline diagnostics from the existing lint cache.
6. Run integrated performance and native Windows/Linux review.
7. Make CodeMirror default, then remove textarea only in a later change.

Rollback remains available through step 6 by selecting the textarea adapter. No document or filesystem format migration is involved.

The detailed behavior matrix, measurements, raw-trace locations, downstream task implications and manual checklist are in `research/codemirror/findings.md` and `research/codemirror/README.md`.
