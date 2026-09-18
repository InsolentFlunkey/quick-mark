import type { Text } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
import { EditorView, lineNumbers, type BlockInfo } from "@codemirror/view";

export interface LogicalLineRange {
  from: number;
  to: number;
}

/** Return a logical source line, including its terminating newline when present. */
export function logicalLineRange(document: Text, position: number): LogicalLineRange {
  const line = document.lineAt(Math.max(0, Math.min(position, document.length)));
  return { from: line.from, to: line.to < document.length ? line.to + 1 : line.to };
}

export function draggedLineSelection(document: Text, start: number, target: number): EditorSelection {
  const origin = logicalLineRange(document, start);
  const current = logicalLineRange(document, target);
  return current.from < origin.from
    ? EditorSelection.single(origin.to, current.from)
    : EditorSelection.single(origin.from, current.to);
}

export function extendedLineSelection(document: Text, anchor: number, target: number): EditorSelection {
  const current = logicalLineRange(document, target);
  return EditorSelection.single(anchor, current.from < anchor ? current.from : current.to);
}

/**
 * VS Code-style whole-line selection for the line-number gutter. CodeMirror
 * supplies gutter hit testing; this extension owns drag direction and edge
 * autoscroll so the resulting range remains ordinary editable text selection.
 */
export function selectableLineNumbers() {
  let cancelActiveDrag: (() => void) | null = null;

  return lineNumbers({
    domEventHandlers: {
      mousedown(view: EditorView, block: BlockInfo, event: Event) {
        const mouse = event as MouseEvent;
        if (mouse.button !== 0) return false;
        mouse.preventDefault();
        cancelActiveDrag?.();

        const win = view.dom.ownerDocument.defaultView;
        if (!win) return false;
        const start = block.from;
        const existingAnchor = view.state.selection.main.anchor;
        const extending = mouse.shiftKey;
        let lastClientY = mouse.clientY;
        let frame = 0;

        const positionAt = (clientY: number) => {
          const height = Math.max(0, Math.min(view.contentHeight, clientY - view.documentTop));
          return view.lineBlockAtHeight(height).from;
        };
        const apply = (position: number) => {
          const selection = extending
            ? extendedLineSelection(view.state.doc, existingAnchor, position)
            : draggedLineSelection(view.state.doc, start, position);
          view.dispatch({ selection, scrollIntoView: false });
        };
        const scroll = () => {
          frame = 0;
          const rect = view.scrollDOM.getBoundingClientRect();
          const overflow = lastClientY < rect.top ? lastClientY - rect.top
            : lastClientY > rect.bottom ? lastClientY - rect.bottom : 0;
          if (!overflow) return;
          const delta = Math.sign(overflow) * Math.min(28, Math.max(4, Math.abs(overflow) / 3));
          view.scrollDOM.scrollTop += delta;
          apply(positionAt(lastClientY));
          frame = win.requestAnimationFrame(scroll);
        };
        const move = (moveEvent: MouseEvent) => {
          lastClientY = moveEvent.clientY;
          apply(positionAt(lastClientY));
          const rect = view.scrollDOM.getBoundingClientRect();
          if (!frame && (lastClientY < rect.top || lastClientY > rect.bottom)) {
            frame = win.requestAnimationFrame(scroll);
          } else if (frame && lastClientY >= rect.top && lastClientY <= rect.bottom) {
            win.cancelAnimationFrame(frame); frame = 0;
          }
        };
        const stop = () => {
          if (frame) win.cancelAnimationFrame(frame);
          frame = 0;
          win.removeEventListener("mousemove", move);
          win.removeEventListener("mouseup", stop);
          win.removeEventListener("blur", stop);
          if (cancelActiveDrag === stop) cancelActiveDrag = null;
        };
        cancelActiveDrag = stop;
        win.addEventListener("mousemove", move);
        win.addEventListener("mouseup", stop);
        win.addEventListener("blur", stop);
        view.focus();
        apply(start);
        return true;
      },
    },
  });
}
