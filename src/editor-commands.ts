import type { StateCommand } from "@codemirror/state";

const indentText = "    ";

function lineRange(state: Parameters<StateCommand>[0]["state"]) {
  const selection = state.selection.main;
  const first = state.doc.lineAt(selection.from);
  const lastPosition = selection.empty ? selection.to : Math.max(selection.from, selection.to - 1);
  const last = state.doc.lineAt(lastPosition);
  return { selection, first, last };
}

export const quickMarkTab: StateCommand = ({ state, dispatch }) => {
  if (state.readOnly) return true;
  const { selection, first, last } = lineRange(state);
  if (!selection.empty) {
    const lines = [];
    for (let number = first.number; number <= last.number; number++) lines.push(state.doc.line(number));
    const changes = lines.map(line => ({ from: line.from, insert: indentText }));
    dispatch(state.update({ changes, selection: { anchor: first.from, head: last.to + indentText.length * lines.length }, userEvent: "input.indent" }));
    return true;
  }
  const prefix = first.text.match(/^(\s*)(([-*+]\s+)|(\d+)\.\s+)/);
  if (prefix && selection.head <= first.from + prefix[0].length) {
    const nextPrefix = prefix[4] ? prefix[1] + indentText + "1. " : prefix[1] + indentText + prefix[3];
    dispatch(state.update({ changes: { from: first.from, to: first.from + prefix[0].length, insert: nextPrefix },
      selection: { anchor: first.from + nextPrefix.length }, userEvent: "input.indent" }));
    return true;
  }
  dispatch(state.update({ changes: { from: selection.from, to: selection.to, insert: indentText },
    selection: { anchor: selection.from + indentText.length }, userEvent: "input.type" }));
  return true;
};

export const quickMarkOutdent: StateCommand = ({ state, dispatch }) => {
  if (state.readOnly) return true;
  const { first, last } = lineRange(state);
  const changes = [];
  for (let number = first.number; number <= last.number; number++) {
    const line = state.doc.line(number);
    const spaces = line.text.match(/^ {1,4}/)?.[0].length ?? 0;
    if (spaces) changes.push({ from: line.from, to: line.from + spaces, insert: "" });
  }
  if (!changes.length) return true;
  dispatch(state.update({ changes, userEvent: "input.indent" }));
  return true;
};

export const quickMarkEnter: StateCommand = ({ state, dispatch }) => {
  if (state.readOnly) return true;
  const selection = state.selection.main;
  if (!selection.empty) return false;
  const line = state.doc.lineAt(selection.head);
  const before = state.sliceDoc(line.from, selection.head);
  const match = before.match(/^(\s*)(?:([-*+]\s+)|(\d+)\.\s+)?/);
  if (!match?.[0]) return false;
  const prefix = match[0];
  if (prefix.trim() && prefix === before) {
    dispatch(state.update({ changes: { from: line.from, to: selection.head, insert: "\n" },
      selection: { anchor: line.from + 1 }, userEvent: "input.type" }));
    return true;
  }
  const nextPrefix = match[2] ? match[1] + match[2]
    : match[3] ? match[1] + (Number.parseInt(match[3], 10) + 1) + ". " : match[1];
  dispatch(state.update({ changes: { from: selection.head, insert: "\n" + nextPrefix },
    selection: { anchor: selection.head + 1 + nextPrefix.length }, userEvent: "input.type" }));
  return true;
};
