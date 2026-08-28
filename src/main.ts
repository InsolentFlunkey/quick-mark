import MarkdownIt from "markdown-it";
import { DocumentLifecycle } from "./document-lifecycle";
import { openDocument, saveDocument, type OperationOutcome } from "./document-operations";
import { initialLaunchPath, listenForLaunchPaths, tauriFileServices } from "./tauri-file-services";

const editor = document.querySelector<HTMLTextAreaElement>("#editor");
const preview = document.querySelector<HTMLElement>("#preview");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const documentStatus = document.querySelector<HTMLElement>("#document-status");
const operationStatus = document.querySelector<HTMLElement>("#operation-status");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
const openButton = document.querySelector<HTMLButtonElement>("#open-document");
const saveButton = document.querySelector<HTMLButtonElement>("#save-document");
const saveAsButton = document.querySelector<HTMLButtonElement>("#save-document-as");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const documentLifecycle = new DocumentLifecycle();
const operationButtons = [openButton, saveButton, saveAsButton].filter(
  (button): button is HTMLButtonElement => button !== null,
);

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

async function runDocumentOperation(operation: () => Promise<OperationOutcome>) {
  operationButtons.forEach((button) => (button.disabled = true));
  try {
    const outcome = await operation();
    if (operationStatus) {
      operationStatus.textContent = outcome.message;
      operationStatus.dataset.status = outcome.status;
    }
    renderDocument();
  } finally {
    operationButtons.forEach((button) => (button.disabled = false));
  }
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

openButton?.addEventListener("click", () => void runDocumentOperation(() => openDocument(documentLifecycle, tauriFileServices)));
saveButton?.addEventListener("click", () => void runDocumentOperation(() => saveDocument(documentLifecycle, tauriFileServices)));
saveAsButton?.addEventListener("click", () =>
  void runDocumentOperation(() => saveDocument(documentLifecycle, tauriFileServices, { saveAs: true })),
);

async function initializeLaunchHandling() {
  try {
    await listenForLaunchPaths((path) =>
      runDocumentOperation(() => openDocument(documentLifecycle, tauriFileServices, path)),
    );
    const launchPath = await initialLaunchPath();
    if (launchPath) await runDocumentOperation(() => openDocument(documentLifecycle, tauriFileServices, launchPath));
  } catch (error) {
    if (operationStatus) {
      operationStatus.textContent = `Could not initialize desktop file handling: ${String(error)}`;
      operationStatus.dataset.status = "failed";
    }
  }
}

void initializeLaunchHandling();

const platform = navigator.userAgentData?.platform ?? navigator.platform;
document.documentElement.dataset.platform = platform.toLowerCase();
