import { acceptCompletion, autocompletion, completionKeymap, startCompletion, type Completion, type CompletionSource } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyField,
  historyKeymap,
  isolateHistory,
  redo,
  redoDepth,
  undo,
  undoDepth,
} from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { EditorView, drawSelection, dropCursor, keymap, placeholder } from "@codemirror/view";
import { completedFileEdit, completionContext, encodePathSegment } from "./path-completion-context";
import type { PathListing } from "./path-completion";
import { quickMarkEnter, quickMarkOutdent, quickMarkTab } from "./editor-commands";
import { selectableLineNumbers } from "./editor-line-numbers";

interface EditorOwner { id: string; path: string }

export interface EditorSurfaceTransfer {
  version: 1;
  state: unknown;
}

export interface EditorHistoryAvailability {
  canUndo: boolean;
  canRedo: boolean;
}

export function validateEditorSurfaceTransfer(document: string, transfer?: EditorSurfaceTransfer) {
  if (!transfer) return;
  if (transfer.version !== 1 || typeof transfer.state !== "object" || transfer.state === null) {
    throw new TypeError("Invalid editor transfer state");
  }
  const state = EditorState.fromJSON(transfer.state, { extensions: [history()] }, { history: historyField });
  if (state.doc.toString() !== document) throw new TypeError("Editor transfer content does not match the document");
}

export interface EditorSurfaceOptions {
  host: HTMLDivElement;
  document: string;
  lineNumbers: boolean;
  transfer?: EditorSurfaceTransfer;
  owner(): EditorOwner | null;
  list(path: string, directory: string, prefix: string, image: boolean): Promise<PathListing>;
  onChange(document: string): void;
  onHistoryChange?(availability: EditorHistoryAvailability): void;
}

function pathCompletion(options: Pick<EditorSurfaceOptions, "owner" | "list">): CompletionSource {
  return async context => {
    const owner = options.owner();
    const selection = context.state.selection.main;
    const source = context.state.doc.toString();
    const match = completionContext(source, selection.head, selection.anchor);
    if (!owner || !match || (!context.explicit && !/^\.\.?\//.test(match.directory))) return null;
    const found = await options.list(owner.path, match.directory || ".", match.prefix, match.image);
    const choices: Completion[] = found.entries.map(entry => ({
      label: entry.name + (entry.kind === "directory" ? "/" : ""),
      type: entry.kind === "directory" ? "folder" : "text",
      detail: entry.kind,
      apply(view) {
        if (entry.kind === "directory") {
          const text = match.directory + encodePathSegment(entry.name) + "/";
          view.dispatch({ changes: { from: match.start, to: match.end, insert: text },
            selection: { anchor: match.start + text.length }, userEvent: "input.complete" });
          view.requestMeasure();
          requestAnimationFrame(() => startCompletion(view));
        } else {
          const edit = completedFileEdit(view.state.doc.toString(), match, entry.name);
          view.dispatch({ changes: { from: match.start, to: edit.end, insert: edit.text },
            selection: { anchor: match.start + edit.text.length }, userEvent: "input.complete" });
        }
      },
    }));
    return { from: match.start, to: match.end, options: choices, filter: false };
  };
}

export class EditorSurface {
  readonly host: HTMLDivElement;
  readonly view: EditorView;
  readonly #readOnly = new Compartment();
  readonly #lineNumbers = new Compartment();
  readonly #options: EditorSurfaceOptions;
  #externalUpdate = false;
  #isReadOnly = false;
  #lineNumbersVisible: boolean;

  constructor(options: EditorSurfaceOptions) {
    this.#options = options;
    this.#lineNumbersVisible = options.lineNumbers;
    this.host = options.host;
    this.host.tabIndex = -1;
    this.view = new EditorView({ state: this.#createState(options.document, options.transfer), parent: this.host });
    this.installHostCompatibility(options.onChange);
  }

  #extensions(): Extension[] {
    const options = this.#options;
    return [
      this.#lineNumbers.of(this.#lineNumbersVisible ? selectableLineNumbers() : []),
      this.#readOnly.of([EditorState.readOnly.of(this.#isReadOnly), EditorView.editable.of(!this.#isReadOnly)]),
      history(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      markdownLanguage,
      indentUnit.of("    "),
      placeholder("# Start writing Markdown…"),
      autocompletion({ override: [pathCompletion(options)], interactionDelay: 0 }),
      keymap.of([
        { key: "Escape", run: view => { view.setTabFocusMode(1200); return true; } },
        ...completionKeymap,
        { key: "Tab", run: quickMarkTab },
        { key: "Shift-Tab", run: quickMarkOutdent },
        { key: "Enter", run: quickMarkEnter },
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      EditorView.domEventHandlers({
        keydown(event, view) {
          if (event.key === "Unidentified" && event.code === "Tab" && event.shiftKey) {
            event.preventDefault();
            return quickMarkOutdent(view);
          }
          return false;
        },
      }),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !this.#externalUpdate) options.onChange(update.state.doc.toString());
        if (update.transactions.length) this.#reportHistory();
      }),
      EditorView.contentAttributes.of({
        "aria-label": "Markdown input",
        "aria-describedby": "editor-help",
        spellcheck: "false",
      }),
    ];
  }

  #createState(document: string, transfer?: EditorSurfaceTransfer) {
    const extensions = this.#extensions();
    if (!transfer) return EditorState.create({ doc: document, extensions });
    validateEditorSurfaceTransfer(document, transfer);
    const state = EditorState.fromJSON(transfer.state, { extensions }, { history: historyField });
    return state;
  }

  #reportHistory() {
    this.#options.onHistoryChange?.({ canUndo: this.canUndo, canRedo: this.canRedo });
  }

  get value() { return this.view.state.doc.toString(); }
  set value(value: string) {
    if (value === this.value) return;
    this.resetDocument(value, this.selectionStart, this.selectionEnd, this.selectionDirection);
  }
  get selectionStart() { return this.view.state.selection.main.from; }
  get selectionEnd() { return this.view.state.selection.main.to; }
  get selectionDirection(): "forward" | "backward" | "none" {
    const selection = this.view.state.selection.main;
    return selection.empty ? "none" : selection.anchor <= selection.head ? "forward" : "backward";
  }
  get scrollTop() { return this.view.scrollDOM.scrollTop; }
  set scrollTop(value: number) { this.view.scrollDOM.scrollTop = value; }
  get scrollLeft() { return this.view.scrollDOM.scrollLeft; }
  set scrollLeft(value: number) { this.view.scrollDOM.scrollLeft = value; }
  get clientWidth() { return this.view.scrollDOM.clientWidth; }
  get isConnected() { return this.host.isConnected; }
  get hidden() { return this.host.hidden; }
  set hidden(value: boolean) { this.host.hidden = value; }
  get id() { return this.host.id; }
  set id(value: string) { this.host.id = value; }
  get scrollElement() { return this.view.scrollDOM; }
  get keyElement() { return this.view.dom; }
  get canUndo() { return !this.#isReadOnly && undoDepth(this.view.state) > 0; }
  get canRedo() { return !this.#isReadOnly && redoDepth(this.view.state) > 0; }

  focus() { this.view.focus(); }
  remove() { this.destroy(); this.host.remove(); }
  destroy() { this.view.destroy(); }

  setSelectionRange(start: number, end: number, direction: "forward" | "backward" | "none" = "none") {
    const length = this.view.state.doc.length;
    const from = Math.max(0, Math.min(start, length));
    const to = Math.max(from, Math.min(end, length));
    const selection = direction === "backward" ? EditorSelection.single(to, from) : EditorSelection.single(from, to);
    this.view.dispatch({ selection });
  }

  undo() { return this.canUndo && undo(this.view); }
  redo() { return this.canRedo && redo(this.view); }

  applyDocumentEdit(document: string, selection: number, userEvent = "input.quickmark") {
    if (this.#isReadOnly || document === this.value) return false;
    const previous = this.value;
    let from = 0;
    while (from < previous.length && from < document.length && previous[from] === document[from]) from++;
    let previousTo = previous.length;
    let documentTo = document.length;
    while (previousTo > from && documentTo > from && previous[previousTo - 1] === document[documentTo - 1]) {
      previousTo--; documentTo--;
    }
    const anchor = Math.max(0, Math.min(selection, document.length));
    this.view.dispatch({
      changes: { from, to: previousTo, insert: document.slice(from, documentTo) },
      selection: { anchor },
      userEvent,
      annotations: isolateHistory.of("full"),
    });
    return true;
  }

  resetDocument(document: string, start = 0, end = start, direction: "forward" | "backward" | "none" = "none") {
    const from = Math.max(0, Math.min(start, document.length));
    const to = Math.max(from, Math.min(end, document.length));
    const selection = direction === "backward" ? { anchor: to, head: from } : { anchor: from, head: to };
    this.#externalUpdate = true;
    try { this.view.setState(EditorState.create({ doc: document, selection, extensions: this.#extensions() })); }
    finally { this.#externalUpdate = false; }
    this.#reportHistory();
  }

  exportTransfer(): EditorSurfaceTransfer {
    return { version: 1, state: this.view.state.toJSON({ history: historyField }) };
  }

  replaceSelection(text: string, select: number) {
    const selection = this.view.state.selection.main;
    this.view.dispatch({ changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: select }, userEvent: "input.quickmark" });
  }

  setReadOnly(readOnly: boolean) {
    if (this.#isReadOnly === readOnly) return;
    this.#isReadOnly = readOnly;
    this.view.dispatch({ effects: this.#readOnly.reconfigure([
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ]) });
  }

  setLineNumbers(visible: boolean) {
    if (this.#lineNumbersVisible === visible) return;
    this.#lineNumbersVisible = visible;
    this.view.dispatch({ effects: this.#lineNumbers.reconfigure(visible ? selectableLineNumbers() : []) });
  }

  lineTop(zeroBasedLine: number) {
    const number = Math.max(1, Math.min(zeroBasedLine + 1, this.view.state.doc.lines));
    return this.view.lineBlockAt(this.view.state.doc.line(number).from).top;
  }

  private installHostCompatibility(onChange: (document: string) => void) {
    const host = this.host as HTMLDivElement & {
      value: string;
      readOnly: boolean;
      selectionStart: number;
      selectionEnd: number;
      selectionDirection: "forward" | "backward" | "none";
      setSelectionRange(start: number, end: number, direction?: "forward" | "backward" | "none"): void;
    };
    Object.defineProperties(host, {
      value: { configurable: true, get: () => this.value, set: (value: string) => { this.value = String(value); } },
      readOnly: { configurable: true, get: () => this.#isReadOnly, set: (value: boolean) => this.setReadOnly(Boolean(value)) },
      selectionStart: { configurable: true, get: () => this.selectionStart },
      selectionEnd: { configurable: true, get: () => this.selectionEnd },
      selectionDirection: { configurable: true, get: () => this.selectionDirection },
      scrollTop: { configurable: true, get: () => this.scrollTop, set: (value: number) => { this.scrollTop = Number(value); } },
      scrollLeft: { configurable: true, get: () => this.scrollLeft, set: (value: number) => { this.scrollLeft = Number(value); } },
      setSelectionRange: { configurable: true, value: (start: number, end: number, direction?: "forward" | "backward" | "none") =>
        this.setSelectionRange(start, end, direction) },
    });
    host.addEventListener("input", event => {
      if (event.target === host && !this.#isReadOnly) onChange(this.value);
    });
    host.addEventListener("keydown", event => {
      if (event.target !== host) return;
      if (this.#isReadOnly && (event.key.length === 1 || ["Enter", "Backspace", "Delete", "Tab", "Unidentified"].includes(event.key))) {
        event.preventDefault();
        return;
      }
      if ((event.key === "Enter" || event.key === "Tab") && acceptCompletion(this.view)) {
        event.preventDefault();
        return;
      }
      const forwarded = new KeyboardEvent("keydown", {
        key: event.key, code: event.code, altKey: event.altKey, ctrlKey: event.ctrlKey,
        metaKey: event.metaKey, shiftKey: event.shiftKey, bubbles: true, cancelable: true,
      });
      this.view.contentDOM.dispatchEvent(forwarded);
      if (forwarded.defaultPrevented) event.preventDefault();
    });
  }
}
