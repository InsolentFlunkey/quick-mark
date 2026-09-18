import { describe, expect, it } from "vitest";
import { EditorState, type Transaction } from "@codemirror/state";
import { history, historyField, undo } from "@codemirror/commands";
import { draggedLineSelection, extendedLineSelection, logicalLineRange } from "../research/codemirror/gutter-selection";
import { lintDiagnostic } from "../research/codemirror/diagnostics";
import { quickMarkEnter, quickMarkOutdent, quickMarkTab } from "../research/codemirror/quickmark-editing";

describe("CodeMirror whole-line gutter research", () => {
  const state = EditorState.create({ doc: "first line\n\nwrapped logical line\nfinal" });

  it("includes line endings except on the final unterminated line", () => {
    expect(logicalLineRange(state.doc, 2)).toEqual({ from: 0, to: 11 });
    expect(logicalLineRange(state.doc, 11)).toEqual({ from: 11, to: 12 });
    expect(logicalLineRange(state.doc, state.doc.length)).toEqual({ from: 33, to: 38 });
  });

  it("creates directional ordinary selections for upward and downward dragging", () => {
    const down = draggedLineSelection(state.doc, 0, 15).main;
    expect([down.anchor, down.head, down.from, down.to]).toEqual([0, 33, 0, 33]);
    const up = draggedLineSelection(state.doc, 15, 0).main;
    expect([up.anchor, up.head, up.from, up.to]).toEqual([33, 0, 0, 33]);
  });

  it("extends an existing selection anchor to a whole target line", () => {
    expect(extendedLineSelection(state.doc, 5, state.doc.length).main.head).toBe(38);
    expect(extendedLineSelection(state.doc, 20, 0).main.head).toBe(0);
  });
});

describe("CodeMirror lint diagnostic research", () => {
  const state = EditorState.create({ doc: "alpha\nbeta\nfinal" });
  const issue = (line: number, column: number | null, length: number | null) => ({
    rule: "TEST", message: "message", line, column, length, detail: "detail", context: "",
  });

  it("maps exact ranges and line-only findings", () => {
    expect(lintDiagnostic(state.doc, issue(2, 2, 2))).toMatchObject({ from: 7, to: 9, fallback: "exact" });
    expect(lintDiagnostic(state.doc, issue(2, null, null))).toMatchObject({ from: 6, to: 10, fallback: "line" });
  });

  it("clamps invalid locations and keeps empty lines visible", () => {
    const empty = EditorState.create({ doc: "alpha\n\nfinal" });
    expect(lintDiagnostic(empty.doc, issue(2, null, null))).toMatchObject({ from: 6, to: 6 });
    expect(lintDiagnostic(state.doc, issue(99, null, null))).toMatchObject({ from: 11, to: 16 });
  });
});

describe("CodeMirror transferable per-document history", () => {
  it("round-trips document, directional selection and Undo history", () => {
    let state = EditorState.create({ doc: "alpha", extensions: [history()] });
    state = state.update({ changes: { from: 5, insert: " beta" }, selection: { anchor: 10, head: 2 }, userEvent: "input.type" }).state;
    const json = state.toJSON({ history: historyField });
    let restored = EditorState.fromJSON(json, { extensions: [history()] }, { history: historyField });
    expect(restored.doc.toString()).toBe("alpha beta");
    expect([restored.selection.main.anchor, restored.selection.main.head]).toEqual([10, 2]);
    const target = { state: restored, dispatch(transaction: Transaction) { restored = transaction.state; } };
    expect(undo(target)).toBe(true);
    expect(restored.doc.toString()).toBe("alpha");
  });
});

describe("CodeMirror QuickMark editing parity", () => {
  function command(document: string, position: number, run: typeof quickMarkTab, end = position) {
    let state = EditorState.create({ doc: document, selection: { anchor: position, head: end } });
    expect(run({ state, dispatch(transaction) { state = transaction.state; } })).toBe(true);
    return state;
  }

  it("preserves four-space cursor indentation and multiline indentation", () => {
    let state = command("alpha", 2, quickMarkTab);
    expect(state.doc.toString()).toBe("al    pha");
    state = command("one\ntwo", 0, quickMarkTab, 7);
    expect(state.doc.toString()).toBe("    one\n    two");
    expect(state.sliceDoc(state.selection.main.from, state.selection.main.to)).toBe("    one\n    two");
  });

  it("preserves list-prefix indentation and up-to-four-space outdent", () => {
    expect(command("7. ordered", 3, quickMarkTab).doc.toString()).toBe("    1. ordered");
    expect(command("first\n   second", 12, quickMarkOutdent).doc.toString()).toBe("first\nsecond");
  });

  it("continues and terminates QuickMark list markers", () => {
    expect(command("    9. item", 11, quickMarkEnter).doc.toString()).toBe("    9. item\n    10. ");
    expect(command("previous\n- ", 11, quickMarkEnter).doc.toString()).toBe("previous\n\n");
  });
});
