import { Compartment, EditorSelection, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter,
  keymap, placeholder,
} from "@codemirror/view";
import {
  defaultKeymap, history, historyField, historyKeymap,
} from "@codemirror/commands";
import { indentUnit, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { markdownLanguage } from "@codemirror/lang-markdown";
import {
  autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type CompletionSource,
} from "@codemirror/autocomplete";
import { lintGutter, lintKeymap, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { selectableLineNumbers } from "./gutter-selection";
import { quickMarkEnter, quickMarkOutdent, quickMarkTab } from "./quickmark-editing";

export interface EditorTransfer {
  version: 1;
  state: unknown;
  scrollTop: number;
  scrollLeft: number;
}

export interface ResearchEditorOptions {
  document: string;
  parent: HTMLElement;
  completion?: CompletionSource;
  onChange?(document: string): void;
}

function extensions(options: Pick<ResearchEditorOptions, "completion" | "onChange">, lock: Compartment): Extension[] {
  return [
    selectableLineNumbers(),
    lintGutter(),
    highlightActiveLineGutter(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    history(),
    // Use the Markdown language directly. The convenience markdown() support
    // eagerly includes HTML/CSS/JavaScript parsing that QuickMark does not need.
    markdownLanguage,
    markdownLanguage.data.of({ closeBrackets: { brackets: ["(", "[", "{"] } }),
    closeBrackets(),
    indentUnit.of("    "),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    placeholder("# Start writing Markdown…"),
    ...(options.completion ? [autocompletion({ override: [options.completion] })] : []),
    keymap.of([
      { key: "Escape", run: view => { view.setTabFocusMode(1200); return true; } },
      { key: "Tab", run: quickMarkTab },
      { key: "Shift-Tab", run: quickMarkOutdent },
      { key: "Enter", run: quickMarkEnter },
      ...closeBracketsKeymap,
      ...completionKeymap,
      ...historyKeymap,
      ...lintKeymap,
      ...defaultKeymap,
    ]),
    EditorView.domEventHandlers({
      keydown(event, view) {
        if (event.key === "Unidentified" && event.code === "Tab" && event.shiftKey) {
          event.preventDefault(); return quickMarkOutdent(view);
        }
        return false;
      },
    }),
    EditorView.updateListener.of(update => {
      if (update.docChanged) options.onChange?.(update.state.doc.toString());
    }),
    EditorView.contentAttributes.of({
      "aria-label": "Markdown input proof of concept",
      "aria-describedby": "editor-help",
      spellcheck: "false",
    }),
    EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { overflow: "auto", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" },
      ".cm-content": { padding: "0.75rem 0", caretColor: "var(--accent)" },
      ".cm-gutters": { cursor: "default", userSelect: "none" },
      ".cm-lineNumbers .cm-gutterElement": { cursor: "default", padding: "0 0.65rem" },
      ".qm-diagnostic-line": { textDecoration: "underline wavy #d69e2e 2px" },
      ".qm-diagnostic-exact": { textDecoration: "underline wavy #e53e3e 2px" },
    }),
    lock.of([EditorState.readOnly.of(false), EditorView.editable.of(true)]),
  ];
}

export function createResearchState(document: string, options: Pick<ResearchEditorOptions, "completion" | "onChange"> = {}, lock = new Compartment()) {
  return { lock, state: EditorState.create({ doc: document, extensions: extensions(options, lock) }) };
}

export class ResearchEditor {
  readonly view: EditorView;
  readonly lock: Compartment;
  private readonly options: Pick<ResearchEditorOptions, "completion" | "onChange">;

  constructor(options: ResearchEditorOptions) {
    this.options = options;
    const created = createResearchState(options.document, options);
    this.lock = created.lock;
    this.view = new EditorView({ state: created.state, parent: options.parent });
  }

  get document() { return this.view.state.doc.toString(); }
  get selection() { return this.view.state.selection.main; }
  get composing() { return this.view.composing || this.view.compositionStarted; }

  replace(from: number, to: number, text: string, select = from + text.length) {
    this.view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: select }, userEvent: "input.quickmark" });
  }

  select(anchor: number, head = anchor) {
    this.view.dispatch({ selection: EditorSelection.single(anchor, head), scrollIntoView: true });
  }

  setBusy(busy: boolean) {
    this.view.dispatch({ effects: this.lock.reconfigure([
      EditorState.readOnly.of(busy), EditorView.editable.of(!busy),
    ]) });
  }

  setDiagnostics(diagnostics: readonly Diagnostic[]) {
    this.view.dispatch(setDiagnostics(this.view.state, diagnostics));
  }

  exportTransfer(): EditorTransfer {
    return {
      version: 1,
      state: this.view.state.toJSON({ history: historyField }),
      scrollTop: this.view.scrollDOM.scrollTop,
      scrollLeft: this.view.scrollDOM.scrollLeft,
    };
  }

  importTransfer(transfer: EditorTransfer) {
    if (transfer.version !== 1) throw new Error("Unsupported editor transfer");
    const json = transfer.state as Record<string, unknown>;
    const configured = extensions(this.options, this.lock);
    const owns = (property: string) => Object.prototype.hasOwnProperty.call(json, property);
    const fields = owns("history") ? { history: historyField } : undefined;
    const state = owns("selection")
      ? EditorState.fromJSON(transfer.state, { extensions: configured }, fields)
      : EditorState.create({ doc: typeof json.doc === "string" ? json.doc : "", extensions: configured });
    this.view.setState(state);
    this.view.scrollDOM.scrollTop = transfer.scrollTop;
    this.view.scrollDOM.scrollLeft = transfer.scrollLeft;
  }

  destroy() { this.view.destroy(); }
}
