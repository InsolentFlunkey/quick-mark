import { describe, expect, it, vi } from "vitest";
import { deleteCharForward } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorSurface } from "../src/editor-surface";
import { DocumentLifecycle } from "../src/document-lifecycle";
import { quickMarkTab } from "../src/editor-commands";
import {
  draggedLineSelection,
  extendedLineSelection,
  logicalLineRange,
} from "../src/editor-line-numbers";

describe("whole-line gutter ranges", () => {
  const state = EditorState.create({ doc: "first line\n\nwrapped logical line\nfinal" });

  it("includes line endings, blank lines, and an unterminated final line", () => {
    expect(logicalLineRange(state.doc, 2)).toEqual({ from: 0, to: 11 });
    expect(logicalLineRange(state.doc, 11)).toEqual({ from: 11, to: 12 });
    expect(logicalLineRange(state.doc, state.doc.length)).toEqual({ from: 33, to: 38 });
  });

  it("creates directional contiguous selections and Shift-click extensions", () => {
    const down = draggedLineSelection(state.doc, 0, 15).main;
    expect([down.anchor, down.head, down.from, down.to]).toEqual([0, 33, 0, 33]);
    const up = draggedLineSelection(state.doc, 15, 0).main;
    expect([up.anchor, up.head, up.from, up.to]).toEqual([33, 0, 0, 33]);
    expect(extendedLineSelection(state.doc, 5, state.doc.length).main.head).toBe(38);
    expect(extendedLineSelection(state.doc, 20, 0).main.head).toBe(0);
  });
});

describe("production CodeMirror surface", () => {
  function fixture(document = "one\n\nlong logical line that may wrap\nfinal") {
    const host = documentGlobal().createElement("div");
    documentGlobal().body.append(host);
    const changed = vi.fn();
    const editor = new EditorSurface({
      host,
      document,
      lineNumbers: true,
      owner: () => null,
      list: async () => ({ entries: [], truncated: false }),
      onChange: changed,
    });
    return { editor, host, changed };
  }
  const documentGlobal = () => globalThis.document;

  it("renders one gutter entry per logical source line and toggles the gutter", () => {
    const { editor, host } = fixture();
    const labels = [...host.querySelectorAll(".cm-lineNumbers .cm-gutterElement")]
      .map(node => node.textContent?.trim()).filter(text => /^[1-4]$/.test(text ?? ""));
    expect(labels.slice(-4)).toEqual(["1", "2", "3", "4"]);
    editor.setLineNumbers(false);
    expect(host.querySelector(".cm-lineNumbers")).toBeNull();
    editor.setLineNumbers(true);
    expect(host.querySelector(".cm-lineNumbers")).not.toBeNull();
    editor.destroy();
  });

  it("uses ordinary editable selections and blocks editing while read-only", () => {
    const { editor, changed } = fixture("one\ntwo\nfinal");
    editor.view.dispatch({ selection: draggedLineSelection(editor.view.state.doc, 0, 5) });
    expect(deleteCharForward(editor.view)).toBe(true);
    expect(editor.value).toBe("final");
    expect(changed).toHaveBeenLastCalledWith("final");

    editor.setSelectionRange(0, 0);
    editor.setReadOnly(true);
    expect(quickMarkTab(editor.view)).toBe(true);
    expect(editor.value).toBe("final");
    editor.setReadOnly(false);
    expect(quickMarkTab(editor.view)).toBe(true);
    expect(editor.value).toBe("    final");
    editor.destroy();
  });

  it("undoes, redoes, branches, and reports exhausted history safely", () => {
    const { editor, changed } = fixture("alpha");
    editor.view.dispatch({ changes: { from: 5, insert: " beta" }, selection: { anchor: 10 }, userEvent: "input.type" });
    expect(editor.canUndo).toBe(true);
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe("alpha");
    expect(editor.canUndo).toBe(false);
    expect(editor.canRedo).toBe(true);
    expect(editor.redo()).toBe(true);
    expect(editor.value).toBe("alpha beta");
    expect(editor.undo()).toBe(true);
    editor.view.dispatch({ changes: { from: 5, insert: " gamma" }, selection: { anchor: 11 }, userEvent: "input.type" });
    expect(editor.value).toBe("alpha gamma");
    expect(editor.canRedo).toBe(false);
    expect(editor.redo()).toBe(false);
    expect(changed).toHaveBeenLastCalledWith("alpha gamma");
    editor.destroy();
  });

  it("treats a QuickMark document edit as one event and restores its caret", () => {
    const { editor } = fixture("BeforeAfter");
    editor.setSelectionRange(6, 6);
    expect(editor.applyDocumentEdit("Before\n\n| A |\n| --- |\n|  |\n\nAfter", 28, "input.quickmark.table")).toBe(true);
    expect(editor.selectionStart).toBe(28);
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe("BeforeAfter");
    expect(editor.selectionStart).toBe(6);
    expect(editor.redo()).toBe(true);
    expect(editor.value).toContain("| A |");
    expect(editor.selectionStart).toBe(28);
    editor.destroy();
  });

  it("restores selections for replacement, paste, and cut-style transactions", () => {
    const { editor } = fixture("alpha beta");
    editor.setSelectionRange(6, 10, "backward");
    editor.view.dispatch({ changes: { from: 6, to: 10, insert: "gamma" }, selection: { anchor: 11 }, userEvent: "input.paste" });
    expect(editor.value).toBe("alpha gamma");
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe("alpha beta");
    expect(editor.selectionStart).toBe(6); expect(editor.selectionEnd).toBe(10);
    expect(editor.selectionDirection).toBe("backward");
    expect(editor.redo()).toBe(true);
    editor.setSelectionRange(6, 11);
    editor.view.dispatch({ changes: { from: 6, to: 11, insert: "" }, selection: { anchor: 6 }, userEvent: "delete.cut" });
    expect(editor.value).toBe("alpha ");
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe("alpha gamma");
    editor.destroy();
  });

  it("round-trips history between surfaces and clears it at a replacement boundary", () => {
    const first = fixture("alpha").editor;
    first.view.dispatch({ changes: { from: 5, insert: " beta" }, selection: { anchor: 10 }, userEvent: "input.type" });
    const transfer = first.exportTransfer();
    const host = documentGlobal().createElement("div");
    documentGlobal().body.append(host);
    const second = new EditorSurface({ host, document: "alpha beta", lineNumbers: true, transfer,
      owner: () => null, list: async () => ({ entries: [], truncated: false }), onChange: vi.fn() });
    expect(second.undo()).toBe(true);
    expect(second.value).toBe("alpha");
    second.resetDocument("replacement", 4, 4);
    expect(second.value).toBe("replacement");
    expect(second.canUndo).toBe(false);
    expect(second.canRedo).toBe(false);
    first.destroy(); second.destroy();
  });

  it("blocks Undo and Redo while the editor is operation-locked", () => {
    const { editor } = fixture("alpha");
    editor.view.dispatch({ changes: { from: 5, insert: " beta" }, userEvent: "input.type" });
    editor.setReadOnly(true);
    expect(editor.canUndo).toBe(false);
    expect(editor.undo()).toBe(false);
    expect(editor.value).toBe("alpha beta");
    editor.setReadOnly(false);
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe("alpha");
    editor.destroy();
  });

  it("handles the conventional shortcut only inside CodeMirror", () => {
    const availability = vi.fn();
    const host = documentGlobal().createElement("div");
    const input = documentGlobal().createElement("input");
    documentGlobal().body.append(host, input);
    const editor = new EditorSurface({ host, document: "alpha", lineNumbers: true, owner: () => null,
      list: async () => ({ entries: [], truncated: false }), onChange: vi.fn(), onHistoryChange: availability });
    editor.view.dispatch({ changes: { from: 5, insert: " beta" }, userEvent: "input.type" });
    const shortcut = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true });
    editor.view.contentDOM.dispatchEvent(shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    expect(editor.value).toBe("alpha");
    const fieldShortcut = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(fieldShortcut);
    expect(fieldShortcut.defaultPrevented).toBe(false);
    expect(availability).toHaveBeenCalledWith({ canUndo: false, canRedo: true });
    editor.destroy();
  });

  it("keeps history through Save and derives dirty state from the resulting source", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "saved", filePath: "/saved.md" });
    const host = documentGlobal().createElement("div"); documentGlobal().body.append(host);
    const editor = new EditorSurface({ host, document: "saved", lineNumbers: true, owner: () => null,
      list: async () => ({ entries: [], truncated: false }), onChange: value => { lifecycle.edit(value); } });
    editor.view.dispatch({ changes: { from: 5, insert: " edit" }, userEvent: "input.type" });
    expect(lifecycle.snapshot.dirty).toBe(true);
    const request = lifecycle.createSaveRequest();
    lifecycle.applySaveResult(request, { status: "success" });
    expect(lifecycle.snapshot.dirty).toBe(false);
    expect(editor.undo()).toBe(true);
    expect(lifecycle.snapshot.content).toBe("saved");
    expect(lifecycle.snapshot.dirty).toBe(true);
    expect(editor.redo()).toBe(true);
    expect(lifecycle.snapshot.content).toBe("saved edit");
    expect(lifecycle.snapshot.dirty).toBe(false);
    editor.destroy();
  });
});
