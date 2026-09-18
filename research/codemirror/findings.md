# CodeMirror 6 editor-foundation findings

## Recommendation

QuickMark should adopt CodeMirror 6 through a staged, reversible editor adapter,
subject to completing native Windows accessibility/IME review and an equivalent
Linux/WebKitGTK pass before the textarea is removed. The proof demonstrates the
architecture needed by TASK-023, TASK-024, TASK-028 and inline TASK-011
diagnostics without changing the production editor.

The recommendation is based on CodeMirror's modular transaction/state model,
viewport rendering, maintained input workarounds and extension APIs rather than
on its defaults. QuickMark must keep its product-specific Markdown commands,
filesystem semantics, lint scheduler and results experience.

## Dependency, maintenance and licensing evidence

The proof locks these direct development dependencies:

| Package | Version | License | Purpose |
| --- | ---: | --- | --- |
| `@codemirror/state` | 6.7.5 | MIT | document, selection and transferable state |
| `@codemirror/view` | 6.43.12 | MIT | virtualized editor UI and gutters |
| `@codemirror/commands` | 6.11.1 | MIT | history and platform editing commands |
| `@codemirror/language` | 6.12.4 | MIT | indentation and highlighting support |
| `@codemirror/autocomplete` | 6.20.3 | MIT | path completion and bracket pairing |
| `@codemirror/lint` | 6.9.7 | MIT | diagnostic ranges, hover and keyboard panel |
| `@codemirror/lang-markdown` | 6.5.2 | MIT | Markdown parser |

The packages were current from npm on 2026-09-17. The official changelog records
continued 2026 releases and recent fixes for IME composition, selection,
tooltips and accessibility. The project moved its canonical repositories from
GitHub to `code.haverbeke.berlin`; archived GitHub mirrors are not evidence that
development stopped. CodeMirror's development repository and direct packages use
the MIT license. A production adoption must add the required copyright/license
text to QuickMark's third-party notices.

References:

- <https://codemirror.net/docs/changelog/>
- <https://codemirror.net/docs/guide/>
- <https://codemirror.net/docs/ref/>
- <https://github.com/codemirror/dev/blob/main/LICENSE>

## Offline bundling and bundle impact

Vite bundles the proof into local hashed assets. The page uses no CDN, remote
module, remote font or runtime package fetch and runs under QuickMark's existing
Tauri `script-src 'self'` policy.

| Build | Minified JavaScript | Gzip JavaScript | CSS gzip |
| --- | ---: | ---: | ---: |
| Current production main + shared theme chunks | 246.3 kB | 88.0 kB | 4.1 kB |
| Standalone explicit-module CodeMirror proof | 401.7 kB | 131.6 kB | 0.7 kB |

The standalone proof is a conservative feature-cost observation, not an exact
future production delta: an integrated build will tree-shake and share some app
code differently. Replacing `markdown()` with `markdownLanguage` removed unused
HTML/CSS/JavaScript fenced-language support and reduced the proof from 588.5 kB
minified / 203.2 kB gzip to 401.7 kB / 131.6 kB in the measured build. Future
implementation should continue using explicit extensions rather than
`basicSetup` and must remeasure the integrated artifact.

## Proof-of-concept results

The proof provides:

- A transaction-backed editor adapter for content, directional selection,
  focus, programmatic edits, busy locking, diagnostics and scroll state.
- Per-document `EditorState`, including independent Undo history, serialized
  through the detached-window boundary with content, selection and scroll.
- QuickMark-specific list continuation, list termination, four-space Tab and
  Shift+Tab behavior. CodeMirror's default CommonMark command deliberately did
  not continue QuickMark's four-space ordered-list case, so using the default
  would have been a regression.
- Async filesystem-style completion using QuickMark's existing conservative
  Markdown-link context parser. CodeMirror's completion keymap leaves Tab free.
- Configured automatic pairing for `()`, `[]` and `{}` without quote pairing.
- Busy state implemented with `EditorState.readOnly` plus
  `EditorView.editable`. Filesystem writability remains a separate lifecycle
  capability, so non-writable files can still be edited in memory for Save As.
- Escape-then-Tab focus exit using temporary tab-focus mode, plus the existing
  WebKitGTK `Unidentified` Shift+Tab compatibility hook.

### TASK-023 adoption gate: line-number selection

CodeMirror does not ship whole-line gutter selection as a setting. Its supported
line-number `domEventHandlers` and document geometry APIs are sufficient to add
it without forking CodeMirror.

The proof implements ordinary directional `EditorSelection` ranges for:

- Single click, including the terminating newline except on the final
  unterminated line.
- Shift-click extension from the existing anchor.
- Upward and downward dragging across logical lines.
- Blank lines and wrapped source lines.
- Edge autoscroll driven by animation frames and `lineBlockAtHeight`.

A tentative future gutter behavior is Ctrl-click on Windows/Linux or Cmd-click
on macOS to add or remove non-contiguous whole-line selections. This is desired
for further product evaluation, but is not a TASK-031 or TASK-023 requirement
until the expected Copy, Cut, Delete, typing and formatting semantics for
multiple ranges are decided.

Focused tests protect range boundaries and direction. Native pointer feel,
autoscroll speed, clipboard/edit operations and high-DPI behavior remain explicit
manual-review gates. CodeMirror adoption should be rejected if those native checks
cannot meet TASK-023.

### Lint diagnostics

QuickMark's worker, debounce, cancellation, rule identity and per-tab lint cache
remain authoritative. Completed `LintIssue` values are translated into
CodeMirror diagnostics with `setDiagnostics`; CodeMirror does not run a second
linter.

- Column and length produce an exact clamped range.
- A missing column or length highlights the known logical line.
- An empty line remains a valid point diagnostic.
- Invalid upstream line numbers clamp to the document.
- Hover provides pointer details; F8 navigates; Ctrl+Shift+M opens a
  keyboard-accessible diagnostic panel.

The existing QuickMark results pane remains valuable for pagination, rule
categories, Preview comparison and save review. Inline markings should augment,
not replace, that experience.

## Existing behavior mapping and risks

| QuickMark behavior | CodeMirror approach | Disposition or risk |
| --- | --- | --- |
| Text, caret and directional selection | `EditorState.doc` and anchor/head selection | Proven in state and transfer tests |
| Per-tab editor state | One retained `EditorState` per document with one active `EditorView` | Proven; cheaper than retaining a view/DOM per tab |
| Detached-window transfer | `EditorState.toJSON/fromJSON` with `historyField`, plus scroll | Proven in isolation; version the payload before production use |
| Undo/Redo | `history`, `historyKeymap`, serializable `historyField` | Proven foundation; TASK-024 must define reload/Clear/save boundaries |
| Indent/list continuation | QuickMark transaction commands | Proven; do not substitute CodeMirror/CommonMark defaults silently |
| Automatic brackets | Configured `closeBrackets` and its Backspace keymap | Foundation present; composition/escape cases remain TASK-028 checks |
| Path completion | Async `CompletionSource` using current context/parser and native listing | Proven hook; production result rendering and ownership errors need integration tests |
| Table insertion | One programmatic transaction with explicit selection and history grouping | Adapter hook proven; production dialog remains unchanged |
| Source/Preview scroll sync | `scrollDOM`, `lineBlockAt`, `lineBlockAtHeight`, viewport geometry | Feasible, but current textarea mirror must be replaced and accuracy reverified |
| Lint navigation | `setDiagnostics`, F8/previous, hover and panel; retain QuickMark pane | Proven in the proof; screen-reader review pending |
| Tab switching | `setState` with independent histories and scroll restoration | Proven and measured |
| Focus exit | temporary tab-focus mode after Escape | Proven hook; native keyboard review pending |
| Composition input | CodeMirror composition tracking and maintained browser workarounds | API/build compatible; real IME review pending |
| Busy operation | read-only + non-editable compartment | Proven hook |
| Filesystem read-only | remains editable; disable Save but allow Save As | Must stay outside the editor lock |

## Windows WebView2 performance comparison

The retained trace is `baseline/native-webview2-v4-native.jsonl`; memory samples
are in the adjacent file. It ran on Windows 11 10.0.26200, an i7-13620H, 16
logical processors, 63.7 GiB RAM, viewport 1100×760 at 150% scale, and WebView2
153.0.0.0. The Tauri Rust build was debug and the Vite frontend was production.

These are synthetic transaction-to-two-animation-frame observations, not
physical key-to-photon latency. CodeMirror was measured editor-only. TASK-008's
production figures include QuickMark's renderer even in Input mode and therefore
answer a broader question.

| Scenario | 256 KiB production baseline | 256 KiB CodeMirror | 1 MiB production baseline | 1 MiB CodeMirror |
| --- | ---: | ---: | ---: | ---: |
| Initial frame | 254.2 ms Split | 44.6 ms | 832.4 ms Split | 33.9 ms |
| Edit frame median | 91.1 ms Input/no sync | 19.1 ms | 365.4 ms Input/no sync | 19.1 ms |
| Edit synchronous median | 41.8 ms | 1.3 ms | 166.7 ms | 1.8 ms |
| Cached/source scroll median | 16.7 ms | 18.8 ms | 31.3 ms | 18.9 ms |
| Diagnostic update | not an inline-decoration baseline | 715 findings: 5.8 ms sync / 16.8 ms frame | not an inline-decoration baseline | 2,841 findings: 3.8 ms sync / 16.7 ms frame |

CodeMirror rendered 38 visible `.cm-line` nodes for both 6,765 and 26,962-line
documents, confirming viewport-based rendering. No long task was observed in the
successful ordered run. Three retained 1 MiB editor states switched at a 19.2 ms
median. Sampled process-tree private memory was approximately 188.7 MiB near idle,
246.4 MiB during the normal workload and 317.2 MiB with three retained 1 MiB
documents. TASK-008 observed 2,529.6 MiB with three production documents, but
that includes each document's textarea/Preview workload and is not an
editor-component apples-to-apples memory comparison.

### Performance disposition

CodeMirror removes the source editor itself as the likely large-document scaling
constraint and comfortably meets TASK-008's 100 ms editor-response review target
in this proof. It does not optimize Markdown parsing, full Preview DOM replacement,
layout, source-map rebuilding or lint-worker cost. A production migration must
retain an integrated checkpoint at 256 KiB and 1 MiB and may not claim whole-app
performance improvement until the existing Preview path is remeasured.

## Accessibility and platform input disposition

The proof exposes a labeled contenteditable editor, standard directional text
selection, temporary Tab escape, keyboard completion, F8 diagnostic navigation,
and the CodeMirror lint panel. CodeMirror's changelog documents ongoing fixes for
screen-reader announcements, ARIA relationships, composition, wrapped tooltip
placement and platform selection behavior.

The automated checks and synthetic WebView2 run cannot establish actual speech
output, IME candidate-window behavior or pointer feel. Required remaining manual
evidence is:

- Windows WebView2 with NVDA and at least one installed IME.
- Copy/cut/delete/type after gutter selection, bidirectional drag and edge
  autoscroll at 100% and 150% scaling.
- Linux WebKitGTK keyboard, composition, clipboard, focus and Orca review. Orca
  support has historically been weaker than NVDA/JAWS, so lack of Linux review
  must remain an explicit release risk rather than an inferred pass.

## Migration and rollback boundary

1. Introduce a production `EditorAdapter` around the existing textarea. Move
   direct value, selection, focus, lock, scrolling and replacement operations
   behind it without changing behavior.
2. Add a CodeMirror adapter behind a build-time or local development switch.
   Keep the textarea adapter and its tests intact.
3. Move per-document selection, scroll and history ownership into versioned
   adapter state. Extend detached-window transfer while accepting the previous
   transfer version.
4. Port QuickMark commands, table insertion, async path completion, focus exit and
   synchronized scrolling. Run both adapters through the same behavior contracts.
5. Feed existing cached lint results into inline diagnostics; retain the current
   results/save flows.
6. Re-run integrated TASK-008 workloads and native Windows/Linux review. Only then
   make CodeMirror the default.
7. Remove the textarea implementation in a separate reviewable change after the
   CodeMirror default has passed parity review.

The rollback boundary is step 6: until native parity and integrated performance
are accepted, selecting the textarea adapter restores the old editor without a
document-format or filesystem migration. Editor history is ephemeral; older
windows ignore the new optional transfer payload and still receive content,
selection and scroll through the existing versioned boundary.

## Implications for dependent tasks

- **TASK-023:** implement the proven custom line-number gutter extension, not only
  CodeMirror's `lineNumbers()`. Its pointer/autoscroll manual gate remains part of
  that task.
- **TASK-024:** use CodeMirror history and menu commands per `EditorState`; specify
  save, reload, Clear and transfer isolation. Programmatic QuickMark transactions
  must carry intentional history grouping.
- **TASK-028:** configure only parentheses, square brackets and braces. Reuse
  `closeBracketsKeymap`; test selection wrapping, closer skipping, pair deletion,
  escapes and composition in QuickMark contexts.
- **TASK-011 enhancement:** keep the existing worker and bounded scheduler. Apply
  only current cached results with `setDiagnostics`; clear or mark decorations
  stale at the same point as the results pane.

## Verification status

- Isolated TypeScript/Vite build passes.
- Focused gutter, diagnostic, history and QuickMark-command tests pass.
- Native Windows WebView2 benchmark passes and retained raw traces are present.
- Production QuickMark build remains independent of CodeMirror imports.
- Native human Windows accessibility/IME/pointer review is pending.
- Linux/WebKitGTK native review is pending.
