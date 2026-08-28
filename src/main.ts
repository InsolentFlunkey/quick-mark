import MarkdownIt from "markdown-it";
import { createApplicationMenu, type ApplicationMenuController } from "./application-menu";
import { DocumentLifecycle } from "./document-lifecycle";
import { openDocument, saveDocument, type OperationOutcome } from "./document-operations";
import { initialLaunchPath, listenForFileDrops, listenForLaunchPaths, tauriFileServices } from "./tauri-file-services";
import { closeCurrentWindow, destroyCurrentWindow, onCloseRequested, promptUnsavedChanges } from "./tauri-window-services";
import { protectAction, resolveUnsavedChanges, saveShortcutFor } from "./unsaved-changes";
import { addRecentFile, loadRecentFiles, removeRecentFile, saveRecentFiles } from "./recent-files";
import {
  DEFAULT_VIEW_PREFERENCES,
  loadViewPreferences,
  saveViewPreferences,
  type ViewMode,
  type ViewPreferences,
} from "./view-preferences";

const editor = document.querySelector<HTMLTextAreaElement>("#editor");
const preview = document.querySelector<HTMLElement>("#preview");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const documentStatus = document.querySelector<HTMLElement>("#document-status");
const operationStatus = document.querySelector<HTMLElement>("#operation-status");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
const newButton = document.querySelector<HTMLButtonElement>("#new-document");
const openButton = document.querySelector<HTMLButtonElement>("#open-document");
const saveButton = document.querySelector<HTMLButtonElement>("#save-document");
const saveAsButton = document.querySelector<HTMLButtonElement>("#save-document-as");
const viewModeSelect = document.querySelector<HTMLSelectElement>("#view-mode");
const swapButton = document.querySelector<HTMLButtonElement>("#swap-panes");
const workspace = document.querySelector<HTMLElement>(".workspace");
const aboutDialog = document.querySelector<HTMLDialogElement>("#about-dialog");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const documentLifecycle = new DocumentLifecycle();
const operationButtons = [newButton, openButton, saveButton, saveAsButton].filter(
  (button): button is HTMLButtonElement => button !== null,
);
let applicationMenu: ApplicationMenuController | null = null;
let recentFiles: string[] = [];
try {
  recentFiles = loadRecentFiles(localStorage);
} catch (error) {
  if (operationStatus) {
    operationStatus.textContent = `Could not load recent files: ${String(error)}`;
    operationStatus.dataset.status = "failed";
  }
}
let viewPreferences: ViewPreferences = DEFAULT_VIEW_PREFERENCES;
try {
  viewPreferences = loadViewPreferences(localStorage);
} catch (error) {
  if (operationStatus) {
    operationStatus.textContent = `Could not load view preferences: ${String(error)}`;
    operationStatus.dataset.status = "failed";
  }
}

function applyViewPreferences() {
  if (!workspace || !viewModeSelect) return;
  workspace.dataset.view = viewPreferences.mode;
  workspace.dataset.swapped = String(viewPreferences.swapped);
  viewModeSelect.value = viewPreferences.mode;
  if (swapButton) swapButton.disabled = viewPreferences.mode !== "both";
  void applicationMenu?.setView(viewPreferences.mode, viewPreferences.swapped);
}

async function updateRecentFiles(paths: string[]) {
  recentFiles = paths;
  try {
    saveRecentFiles(localStorage, paths);
    await applicationMenu?.setRecentFiles(paths);
  } catch (error) {
    showOperationOutcome({ status: "failed", message: `Could not save recent files: ${String(error)}` });
  }
}

function updateViewPreferences(next: ViewPreferences) {
  viewPreferences = next;
  applyViewPreferences();
  try {
    saveViewPreferences(localStorage, next);
  } catch (error) {
    showOperationOutcome({ status: "failed", message: `Could not save view preference: ${String(error)}` });
  }
}

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
  document.title = `${documentSnapshot.dirty ? "• " : ""}${documentSnapshot.displayName} — QuickMark — Write Markdown. See it rendered.`;
}

function showOperationOutcome(outcome: OperationOutcome) {
  if (operationStatus) {
    operationStatus.textContent = outcome.message;
    operationStatus.dataset.status = outcome.status;
  }
  renderDocument();
}

async function runDocumentOperation(operation: () => Promise<OperationOutcome>) {
  operationButtons.forEach((button) => (button.disabled = true));
  try {
    const outcome = await operation();
    showOperationOutcome(outcome);
    const path = documentLifecycle.snapshot.filePath;
    if (outcome.status === "success" && path) await updateRecentFiles(addRecentFile(recentFiles, path));
    return outcome;
  } finally {
    operationButtons.forEach((button) => (button.disabled = false));
  }
}

const unsavedChangeDependencies = {
  isDirty: () => documentLifecycle.snapshot.dirty,
  displayName: () => documentLifecycle.snapshot.displayName,
  prompt: promptUnsavedChanges,
  save: () => saveDocument(documentLifecycle, tauriFileServices),
};

async function runProtectedOperation(action: string, operation: () => Promise<OperationOutcome>) {
  return protectAction(action, unsavedChangeDependencies, operation);
}

function newDocument() {
  return runDocumentOperation(() =>
    runProtectedOperation("New document", async () => {
      documentLifecycle.newDocument();
      return { status: "success", message: "Created a new document." };
    }),
  );
}

function openSelectedDocument() {
  return runDocumentOperation(() =>
    runProtectedOperation("Open", () => openDocument(documentLifecycle, tauriFileServices)),
  );
}

async function openRecentDocument(path: string) {
  const outcome = await runDocumentOperation(() =>
    runProtectedOperation("Open recent file", () => openDocument(documentLifecycle, tauriFileServices, path)),
  );
  if (outcome.status === "failed") await updateRecentFiles(removeRecentFile(recentFiles, path));
}

function saveCurrentDocument(saveAs = false) {
  return runDocumentOperation(() => saveDocument(documentLifecycle, tauriFileServices, { saveAs }));
}

function clearDocument() {
  return runDocumentOperation(() =>
    runProtectedOperation("Clear", async () => {
      documentLifecycle.newDocument();
      return { status: "success", message: "Cleared the document." };
    }),
  );
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

aboutDialog?.addEventListener("click", (event) => {
  if (event.target === aboutDialog) aboutDialog.close();
});

newButton?.addEventListener("click", () => void newDocument());
openButton?.addEventListener("click", () => void openSelectedDocument());
saveButton?.addEventListener("click", () => void saveCurrentDocument());
saveAsButton?.addEventListener("click", () => void saveCurrentDocument(true));
viewModeSelect?.addEventListener("change", () =>
  updateViewPreferences({ ...viewPreferences, mode: viewModeSelect.value as ViewMode }),
);
swapButton?.addEventListener("click", () =>
  updateViewPreferences({ ...viewPreferences, swapped: !viewPreferences.swapped }),
);

document.addEventListener("keydown", (event) => {
  const shortcut = saveShortcutFor(event);
  if (!shortcut) return;
  event.preventDefault();
  void saveCurrentDocument(shortcut === "save-as");
});

let closeDecisionActive = false;

async function initializeCloseProtection() {
  try {
    await onCloseRequested(async (event) => {
      if (!documentLifecycle.snapshot.dirty) return;
      event.preventDefault();
      if (closeDecisionActive) return;
      closeDecisionActive = true;
      try {
        const decision = await resolveUnsavedChanges("Close", unsavedChangeDependencies);
        if (decision.status === "proceed") {
          try {
            await destroyCurrentWindow();
          } catch (error) {
            showOperationOutcome({ status: "failed", message: `Could not close QuickMark: ${String(error)}` });
          }
        } else {
          showOperationOutcome(decision);
        }
      } finally {
        closeDecisionActive = false;
      }
    });
  } catch (error) {
    if (operationStatus) {
      operationStatus.textContent = `Could not initialize unsaved-change protection: ${String(error)}`;
      operationStatus.dataset.status = "failed";
    }
  }
}

async function initializeLaunchHandling() {
  try {
    await listenForLaunchPaths(async (path) => {
      await runDocumentOperation(() =>
        runProtectedOperation("Open", () => openDocument(documentLifecycle, tauriFileServices, path)),
      );
    });
    await listenForFileDrops(
      async (path) => {
        await runDocumentOperation(() =>
          runProtectedOperation("Open dropped file", () => openDocument(documentLifecycle, tauriFileServices, path)),
        );
      },
      (hovering) => document.body.classList.toggle("file-drop-active", hovering),
    );
    const launchPath = await initialLaunchPath();
    if (launchPath) {
      await runDocumentOperation(() =>
        runProtectedOperation("Open", () => openDocument(documentLifecycle, tauriFileServices, launchPath)),
      );
    }
  } catch (error) {
    if (operationStatus) {
      operationStatus.textContent = `Could not initialize desktop file handling: ${String(error)}`;
      operationStatus.dataset.status = "failed";
    }
  }
}

async function initializeApplicationMenu() {
  try {
    applicationMenu = await createApplicationMenu({
      newDocument: () => void newDocument(),
      openDocument: () => void openSelectedDocument(),
      openRecent: (path) => void openRecentDocument(path),
      saveDocument: () => void saveCurrentDocument(),
      saveDocumentAs: () => void saveCurrentDocument(true),
      clearDocument: () => void clearDocument(),
      printDocument: () => globalThis.print(),
      closeWindow: () => void closeCurrentWindow(),
      setView: (mode) => updateViewPreferences({ ...viewPreferences, mode }),
      swapPanes: () => updateViewPreferences({ ...viewPreferences, swapped: !viewPreferences.swapped }),
      showAbout: () => aboutDialog?.showModal(),
    });
    await applicationMenu.setRecentFiles(recentFiles);
    await applicationMenu.setView(viewPreferences.mode, viewPreferences.swapped);
  } catch (error) {
    showOperationOutcome({ status: "failed", message: `Could not initialize the application menu: ${String(error)}` });
  }
}

void initializeLaunchHandling();
void initializeCloseProtection();
void initializeApplicationMenu();
applyViewPreferences();

const platform = navigator.userAgentData?.platform ?? navigator.platform;
document.documentElement.dataset.platform = platform.toLowerCase();
