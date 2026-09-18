import type { Completion, CompletionSource } from "@codemirror/autocomplete";
import { completedFileEdit, completionContext, encodePathSegment } from "../../src/path-completion-context";

export interface ResearchPathEntry { name: string; kind: "document" | "directory" | "image" }

export function pathCompletion(entries: (directory: string, prefix: string, image: boolean) => Promise<readonly ResearchPathEntry[]>): CompletionSource {
  return async context => {
    const source = context.state.doc.toString();
    const selection = context.state.selection.main;
    const match = completionContext(source, selection.head, selection.anchor);
    if (!match) return null;
    const found = await entries(match.directory, match.prefix, match.image);
    const options: Completion[] = found.map(entry => ({
      label: entry.name,
      type: entry.kind === "directory" ? "folder" : "text",
      detail: entry.kind,
      apply(view) {
        if (entry.kind === "directory") {
          const text = match.directory + encodePathSegment(entry.name) + "/";
          view.dispatch({ changes: { from: match.start, to: match.end, insert: text },
            selection: { anchor: match.start + text.length }, userEvent: "input.complete" });
        } else {
          const edit = completedFileEdit(view.state.doc.toString(), match, entry.name);
          view.dispatch({ changes: { from: match.start, to: edit.end, insert: edit.text },
            selection: { anchor: match.start + edit.text.length }, userEvent: "input.complete" });
        }
      },
    }));
    return { from: match.start, to: match.end, options, filter: false };
  };
}
