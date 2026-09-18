import { describe, expect, it, vi } from "vitest";
import { deleteCharForward } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorSurface } from "../src/editor-surface";
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
});
