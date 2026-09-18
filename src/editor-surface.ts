import { acceptCompletion, autocompletion, completionKeymap, startCompletion, type Completion, type CompletionSource } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorSelection, EditorState, Transaction, type Extension } from "@codemirror/state";
import { EditorView, drawSelection, dropCursor, keymap, placeholder } from "@codemirror/view";
import { completedFileEdit, completionContext, encodePathSegment } from "./path-completion-context";
import type { PathListing } from "./path-completion";
import { quickMarkEnter, quickMarkOutdent, quickMarkTab } from "./editor-commands";
import { selectableLineNumbers } from "./editor-line-numbers";

interface EditorOwner { id: string; path: string }

export interface EditorSurfaceOptions {
  host: HTMLDivElement;
  document: string;
  lineNumbers: boolean;
  owner(): EditorOwner | null;
  list(path: string, directory: string, prefix: string, image: boolean): Promise<PathListing>;
  onChange(document: string): void;
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
  #externalUpdate = false;
  #isReadOnly = false;

  constructor(options: EditorSurfaceOptions) {
    this.host = options.host;
    this.host.tabIndex = -1;
    const extensions: Extension[] = [
      this.#lineNumbers.of(options.lineNumbers ? selectableLineNumbers() : []),
      this.#readOnly.of([EditorState.readOnly.of(false), EditorView.editable.of(true)]),
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
      }),
      EditorView.contentAttributes.of({
        "aria-label": "Markdown input",
        "aria-describedby": "editor-help",
        spellcheck: "false",
      }),
    ];
    this.view = new EditorView({
      state: EditorState.create({ doc: options.document, extensions }),
      parent: this.host,
    });
    this.installHostCompatibility(options.onChange);
  }

  get value() { return this.view.state.doc.toString(); }
  set value(value: string) {
    if (value === this.value) return;
    const selection = this.view.state.selection.main;
    const anchor = Math.min(selection.anchor, value.length);
    const head = Math.min(selection.head, value.length);
    this.#externalUpdate = true;
    try {
      this.view.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: value },
        selection: EditorSelection.single(anchor, head),
        annotations: Transaction.addToHistory.of(false),
      });
    } finally {
      this.#externalUpdate = false;
    }
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

  replaceSelection(text: string, select: number) {
    const selection = this.view.state.selection.main;
    this.view.dispatch({ changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: select }, userEvent: "input.quickmark" });
  }

  setReadOnly(readOnly: boolean) {
    this.#isReadOnly = readOnly;
    this.view.dispatch({ effects: this.#readOnly.reconfigure([
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ]) });
  }

  setLineNumbers(visible: boolean) {
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
