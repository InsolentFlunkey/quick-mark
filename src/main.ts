import MarkdownIt from "markdown-it";
import { DocumentLifecycle } from "./document-lifecycle";

const editor = document.querySelector<HTMLTextAreaElement>("#editor");
const preview = document.querySelector<HTMLElement>("#preview");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const documentStatus = document.querySelector<HTMLElement>("#document-status");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const documentLifecycle = new DocumentLifecycle();

function renderDocument() {
  if (!editor || !preview) return;
  const documentSnapshot = documentLifecycle.snapshot;
  if (editor.value !== documentSnapshot.content) editor.value = documentSnapshot.content;
  preview.innerHTML = renderer.render(documentSnapshot.content);
  if (editorStatus) {
    const count = documentSnapshot.content.length;
    editorStatus.textContent = `${count.toLocaleString()} ${count === 1 ? "character" : "characters"}`;
  }
  if (documentStatus) {
    const stateLabel = documentSnapshot.dirty
      ? "Unsaved changes"
      : documentSnapshot.filePath
        ? "Saved"
        : "New document";
    documentStatus.textContent = `${documentSnapshot.displayName} — ${stateLabel}`;
  }
  document.title = `${documentSnapshot.dirty ? "• " : ""}${documentSnapshot.displayName} — QuickMark`;
}

if (editor && preview) {
  editor.addEventListener("input", () => {
    documentLifecycle.edit(editor.value);
    renderDocument();
  });
  globalThis.QuickMarkEditor.installMarkdownEditorBehavior(editor);
  globalThis.QuickMarkMarkdown.installCodeCopyHandler(preview, (message) => {
    if (copyStatus) copyStatus.textContent = message;
  });
  renderDocument();
}

const platform = navigator.userAgentData?.platform ?? navigator.platform;
document.documentElement.dataset.platform = platform.toLowerCase();
