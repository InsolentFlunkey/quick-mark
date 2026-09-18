type Field = HTMLInputElement | HTMLTextAreaElement;
type Direction = "forward" | "backward" | "none" | null;

interface Snapshot {
  value: string;
  start: number | null;
  end: number | null;
  direction: Direction;
}

interface FieldHistory {
  current: Snapshot;
  undo: Snapshot[];
  redo: Snapshot[];
  pending: Snapshot | null;
  applying: boolean;
}

function snapshot(field: Field): Snapshot {
  return { value: field.value, start: field.selectionStart, end: field.selectionEnd,
    direction: field.selectionDirection as Direction };
}

function same(left: Snapshot, right: Snapshot) {
  return left.value === right.value && left.start === right.start && left.end === right.end &&
    left.direction === right.direction;
}

function editableField(target: EventTarget | null): Field | null {
  if (target instanceof HTMLTextAreaElement) return target.readOnly || target.disabled ? null : target;
  if (!(target instanceof HTMLInputElement) || target.readOnly || target.disabled) return null;
  return ["text", "search", "url", "tel", "email", "password", "number"].includes(target.type) ? target : null;
}

function historyShortcut(event: KeyboardEvent): "undo" | "redo" | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  return key === "y" && !event.shiftKey ? "redo" : null;
}

/** Keeps native-style field history inside modal dialogs instead of Chromium's shared editing history. */
export function installDialogFieldHistory(root: Document) {
  const histories = new WeakMap<Field, FieldHistory>();
  const state = (field: Field) => {
    let value = histories.get(field);
    if (!value) {
      value = { current: snapshot(field), undo: [], redo: [], pending: null, applying: false };
      histories.set(field, value);
    }
    return value;
  };
  const inOpenDialog = (target: EventTarget | null) =>
    target instanceof Element && target.closest("dialog[open]") !== null;

  const beforeInput = (event: Event) => {
    if (!inOpenDialog(event.target)) return;
    const field = editableField(event.target);
    if (field) state(field).pending = snapshot(field);
  };
  const input = (event: Event) => {
    if (!inOpenDialog(event.target)) return;
    const field = editableField(event.target);
    if (!field) return;
    const history = state(field);
    const next = snapshot(field);
    if (!history.applying && !same(history.current, next)) {
      history.undo.push(history.pending ?? history.current);
      history.redo.length = 0;
    }
    history.current = next;
    history.pending = null;
  };
  const keydown = (event: KeyboardEvent) => {
    const command = historyShortcut(event);
    if (!command || !inOpenDialog(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const field = editableField(event.target);
    if (!field) return;
    const history = state(field);
    const current = snapshot(field);
    if (!same(history.current, current)) {
      history.undo.push(history.current);
      history.current = current;
      history.redo.length = 0;
    }
    const source = command === "undo" ? history.undo : history.redo;
    const target = command === "undo" ? history.redo : history.undo;
    const next = source.pop();
    if (!next) return;
    target.push(history.current);
    history.applying = true;
    field.value = next.value;
    if (next.start !== null && next.end !== null) {
      try { field.setSelectionRange(next.start, next.end, next.direction ?? undefined); } catch { /* Number inputs have no text selection. */ }
    }
    history.current = snapshot(field);
    history.pending = null;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    history.applying = false;
  };

  root.addEventListener("beforeinput", beforeInput, true);
  root.addEventListener("input", input, true);
  root.addEventListener("keydown", keydown, true);
  return () => {
    root.removeEventListener("beforeinput", beforeInput, true);
    root.removeEventListener("input", input, true);
    root.removeEventListener("keydown", keydown, true);
  };
}
