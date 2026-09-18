import { openLintPanel, nextDiagnostic } from "@codemirror/lint";
import { lintDiagnostics } from "./diagnostics";
import { ResearchEditor, type EditorTransfer } from "./editor";
import { pathCompletion } from "./path-completion";
import type { LintIssue } from "../../src/lint-profile";
import "./styles.css";

const initial = `# CodeMirror research editor

Click this line number to select the whole logical line. This intentionally long line wraps so TASK-023 can verify that one number still owns every wrapped visual row.

- Continue this list with Enter
- Press Tab or Shift+Tab to change indentation

[Complete a path](do)

The final line has no terminating newline`;

const host = document.querySelector<HTMLElement>("#editor-host")!;
const status = document.querySelector<HTMLElement>("#status")!;
const documents = new Map<string, EditorTransfer>();
let active = "one";
let busy = false;

const completion = pathCompletion(async (_directory, prefix, image) => {
  await new Promise(resolve => setTimeout(resolve, 80));
  return [
    { name: "docs", kind: "directory" as const },
    { name: image ? "diagram.png" : "documentation.md", kind: image ? "image" as const : "document" as const },
  ].filter(entry => entry.name.toLowerCase().startsWith(prefix.toLowerCase()));
});

const editor = new ResearchEditor({
  document: initial,
  parent: host,
  completion,
  onChange(document) { status.textContent = `${document.length.toLocaleString()} characters; composition=${editor.composing}`; },
});

function sampleIssues(): LintIssue[] {
  return [
    { rule: "POC001", message: "Exact ranged finding", line: 1, column: 3, length: 10, detail: "Hover the underline or press F8.", context: "" },
    { rule: "POC002", message: "Line-only finding", line: 3, column: null, length: null, detail: "The whole logical line is the fallback range.", context: "" },
    { rule: "POC003", message: "Missing exact range on final line", line: 10_000, column: null, length: null, detail: "Out-of-range lines clamp safely.", context: "" },
  ];
}

function applyDiagnostics() {
  editor.setDiagnostics(lintDiagnostics(editor.view.state.doc, sampleIssues()));
  status.textContent = "Three diagnostics applied: exact, line-only, and clamped final-line fallback.";
}

function saveActive() { documents.set(active, editor.exportTransfer()); }
function switchDocument(id: string) {
  if (id === active) { editor.view.focus(); return; }
  saveActive();
  active = id;
  const saved = documents.get(id);
  if (saved) editor.importTransfer(saved);
  else editor.importTransfer({ version: 1, state: { doc: `# Document ${id}\n\nIndependent state and Undo history.` }, scrollTop: 0, scrollLeft: 0 });
  editor.view.focus();
  status.textContent = `Active document: ${id}`;
}

document.querySelector("#diagnostics")?.addEventListener("click", applyDiagnostics);
document.querySelector("#lint-panel")?.addEventListener("click", () => openLintPanel(editor.view));
document.querySelector("#next-diagnostic")?.addEventListener("click", () => nextDiagnostic(editor.view));
document.querySelector("#toggle-busy")?.addEventListener("click", () => {
  busy = !busy; editor.setBusy(busy); status.textContent = busy ? "Busy lock enabled." : "Busy lock disabled; filesystem read-only would remain editable in memory.";
});
document.querySelector("#document-one")?.addEventListener("click", () => switchDocument("one"));
document.querySelector("#document-two")?.addEventListener("click", () => switchDocument("two"));
document.querySelector("#transfer")?.addEventListener("click", () => {
  const transfer = JSON.parse(JSON.stringify(editor.exportTransfer())) as EditorTransfer;
  editor.importTransfer(transfer); editor.view.focus(); status.textContent = "Serialized transfer restored content, selection, scroll, and Undo history.";
});

status.textContent = `${initial.length} characters; filesystem read-only simulation remains editable.`;

declare global {
  interface Window {
    quickMarkCodeMirrorResearch: {
      editor: ResearchEditor;
      applyDiagnostics(): void;
      switchDocument(id: string): void;
    };
  }
}
window.quickMarkCodeMirrorResearch = { editor, applyDiagnostics, switchDocument };
