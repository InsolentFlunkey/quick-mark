import { acceptCompletion, completionStatus } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { quickMarkEnter, quickMarkTab } from "../src/editor-commands";
import { EditorSurface } from "../src/editor-surface";

describe("automatic bracket pairing", () => {
  const editors: EditorSurface[] = [];

  afterEach(() => {
    editors.splice(0).forEach(editor => editor.destroy());
    document.body.replaceChildren();
  });

  function fixture(source = "", list = vi.fn(async () => ({ entries: [], truncated: false }))) {
    const host = document.createElement("div");
    document.body.append(host);
    const editor = new EditorSurface({
      host,
      document: source,
      lineNumbers: true,
      owner: () => ({ id: "document", path: "C:/notes/source.md" }),
      list,
      onChange: vi.fn(),
    });
    editors.push(editor);
    return { editor, list };
  }

  function type(editor: EditorSurface, text: string) {
    for (const character of text) {
      const state = editor.view.state;
      if (state.readOnly) continue;
      const selection = state.selection.main;
      let transaction: ReturnType<typeof state.update> | undefined;
      const defaultInsert = () => transaction ??= state.update({
        changes: { from: selection.from, to: selection.to, insert: character },
        selection: { anchor: selection.from + character.length },
        userEvent: "input.type",
      });
      const handled = state.facet(EditorView.inputHandler)
        .some(handler => handler(editor.view, selection.from, selection.to, character, defaultInsert));
      if (!handled) editor.view.dispatch(defaultInsert());
    }
  }

  function press(editor: EditorSurface, key: string, options: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
    editor.view.contentDOM.dispatchEvent(event);
    return event;
  }

  it.each([
    ["(", "()"],
    ["[", "[]"],
    ["{", "{}"],
  ])("pairs %s and leaves the caret inside", (opening, expected) => {
    const { editor } = fixture();
    type(editor, opening);
    expect(editor.value).toBe(expected);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([1, 1]);
  });

  it("nests pairs, skips tracked closers, and does not duplicate them", () => {
    const { editor } = fixture();
    type(editor, "([{");
    expect(editor.value).toBe("([{}])");
    expect(editor.selectionStart).toBe(3);
    type(editor, "}])");
    expect(editor.value).toBe("([{}])");
    expect(editor.selectionStart).toBe(editor.value.length);
  });

  it("removes an untouched pair with one Backspace", () => {
    const { editor } = fixture();
    type(editor, "[");
    const event = press(editor, "Backspace");
    expect(event.defaultPrevented).toBe(true);
    expect(editor.value).toBe("");
    expect(editor.selectionStart).toBe(0);
  });

  it("wraps forward and backward selections without losing their contents", () => {
    const { editor } = fixture("alpha beta");
    editor.setSelectionRange(0, 5);
    type(editor, "(");
    expect(editor.value).toBe("(alpha) beta");
    expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe("alpha");

    editor.setSelectionRange(8, 12, "backward");
    type(editor, "[");
    expect(editor.value).toBe("(alpha) [beta]");
    expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe("beta");
    expect(editor.selectionDirection).toBe("backward");
  });

  it("inserts escaped openings literally and pairs after an even escape run", () => {
    const { editor } = fixture("\\");
    editor.setSelectionRange(1, 1);
    type(editor, "(");
    expect(editor.value).toBe("\\(");

    editor.resetDocument("\\\\", 2, 2);
    type(editor, "[");
    expect(editor.value).toBe("\\\\[]");
    expect(editor.selectionStart).toBe(3);
  });

  it("leaves an opener unpaired before ordinary text", () => {
    const { editor } = fixture("word");
    editor.setSelectionRange(0, 0);
    type(editor, "{");
    expect(editor.value).toBe("{word");
    expect(editor.selectionStart).toBe(1);
  });

  it("does not reinterpret paste or composition input as typed brackets", () => {
    const { editor } = fixture();
    editor.view.dispatch({ changes: { from: 0, insert: "([{" }, selection: { anchor: 3 }, userEvent: "input.paste" });
    expect(editor.value).toBe("([{");

    editor.view.contentDOM.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "(" }));
    expect(editor.view.compositionStarted).toBe(true);
    type(editor, "(");
    editor.view.contentDOM.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "(" }));
    expect(editor.value).toBe("([{(");
  });

  it("does not edit while busy and remains compatible with Markdown commands", () => {
    const { editor } = fixture("- item");
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.setReadOnly(true);
    type(editor, "(");
    expect(editor.value).toBe("- item");

    editor.setReadOnly(false);
    expect(quickMarkEnter(editor.view)).toBe(true);
    type(editor, "[");
    expect(editor.value).toBe("- item\n- []");
    editor.setSelectionRange(editor.value.lastIndexOf("- ") + 2, editor.value.lastIndexOf("- ") + 2);
    expect(quickMarkTab(editor.view)).toBe(true);
    expect(editor.value).toBe("- item\n    - []");
  });

  it("keeps relative-path completion available inside paired link delimiters", async () => {
    const list = vi.fn(async () => ({
      entries: [{ name: "guide.md", kind: "document" as const }],
      truncated: false,
    }));
    const { editor } = fixture("", list);
    type(editor, "[");
    type(editor, "Guide");
    type(editor, "]");
    type(editor, "(");
    type(editor, "./");
    expect(editor.value).toBe("[Guide](./)");
    expect(editor.selectionStart).toBe(editor.value.length - 1);

    await vi.waitFor(() => expect(list).toHaveBeenCalledWith("C:/notes/source.md", "./", "", false));
    await vi.waitFor(() => expect(completionStatus(editor.view.state)).toBe("active"));
    expect(acceptCompletion(editor.view)).toBe(true);
    expect(editor.value).toBe("[Guide](./guide.md)");
  });

  it("opens bare-path completion for WebView2's Ctrl+Space event shape", async () => {
    const list = vi.fn(async () => ({
      entries: [{ name: "guide.md", kind: "document" as const }],
      truncated: false,
    }));
    const { editor } = fixture("[Guide](gu)", list);
    editor.setSelectionRange(10, 10);

    const event = press(editor, " ", { code: "Space", ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith("C:/notes/source.md", ".", "gu", false));
    await vi.waitFor(() => expect(completionStatus(editor.view.state)).toBe("active"));
    expect(acceptCompletion(editor.view)).toBe(true);
    expect(editor.value).toBe("[Guide](guide.md)");
  });
});
