import MarkdownIt from "markdown-it";
import { clearRecentHistory, createClearHistoryConfirmation, createSettingsController } from "./settings";
import { createApplicationMenu, type ApplicationMenuController } from "./application-menu";
import { TabSession } from "./tab-session";
import { createDocumentTabs } from "./document-tabs";
import { type OperationOutcome } from "./document-operations";
import {
  initialLaunchPath,
  canonicalDocumentPath,
  listenForFileDrops,
  listenForLaunchPaths,
  readLocalImage,
  resolveDocumentLink,
  tauriFileServices,
} from "./tauri-file-services";
import { closeCurrentWindow, destroyCurrentWindow, onCloseRequested, promptUnsavedChanges } from "./tauri-window-services";
import { saveShortcutFor } from "./unsaved-changes";
import { addRecentFile, loadRecentFiles, removeRecentFile, saveRecentFiles } from "./recent-files";
import { openReferenceWindow } from "./reference-window-services";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { connectAbout } from "./about-metadata";
import { appMetadata } from "./app-metadata-env";
import { createScrollSyncController } from "./scroll-sync";
import { generateMarkdownTable, insertMarkdownTable, type TableAlignment } from "./table-builder";
import { installRenderedResourceController } from "./rendered-resources";
import { createOperationStatusController, OPERATION_TRANSIENT_DURATION_MS } from "./operation-status";
import { formatDocumentStatus } from "./document-status";
import {
  DEFAULT_VIEW_PREFERENCES,
  loadViewPreferences,
  saveViewPreferences,
  type ViewMode,
  type ViewPreferences,
} from "./view-preferences";

let editor = document.querySelector<HTMLTextAreaElement>("#editor");
const preview = document.querySelector<HTMLElement>("#preview");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const documentStatus = document.querySelector<HTMLElement>("#document-status");
const operationStatus = document.querySelector<HTMLElement>("#operation-status");
const dismissOperationStatusButton = document.querySelector<HTMLButtonElement>("#dismiss-operation-status");
const newButton = document.querySelector<HTMLButtonElement>("#new-document");
const openButton = document.querySelector<HTMLButtonElement>("#open-document");
const saveButton = document.querySelector<HTMLButtonElement>("#save-document");
const saveAsButton = document.querySelector<HTMLButtonElement>("#save-document-as");
const tableBuilderButton = document.querySelector<HTMLButtonElement>("#table-builder");
const viewModeSelect = document.querySelector<HTMLSelectElement>("#view-mode");
const swapButton = document.querySelector<HTMLButtonElement>("#swap-panes");
const workspace = document.querySelector<HTMLElement>(".workspace");
const aboutDialog = document.querySelector<HTMLDialogElement>("#about-dialog");
const aboutTitle = document.querySelector<HTMLElement>("#about-title");
const aboutDescription = document.querySelector<HTMLElement>("#about-description");
const aboutVersion = document.querySelector<HTMLElement>("#about-version");
const aboutPublisher = document.querySelector<HTMLElement>("#about-publisher");
const aboutRepository = document.querySelector<HTMLButtonElement>("#about-repository");
const tableDialog = document.querySelector<HTMLDialogElement>("#table-dialog");
const tableForm = document.querySelector<HTMLFormElement>("#table-form");
const tableColumns = document.querySelector<HTMLInputElement>("#table-columns");
const tableRows = document.querySelector<HTMLInputElement>("#table-rows");
const tableColumnFields = document.querySelector<HTMLElement>("#table-column-fields");
const tablePreview = document.querySelector<HTMLTextAreaElement>("#table-preview");
const tableError = document.querySelector<HTMLElement>("#table-error");
const tableReset = document.querySelector<HTMLButtonElement>("#table-reset");
const tableCancel = document.querySelector<HTMLButtonElement>("#table-cancel");
const readOnlyBanner = document.querySelector<HTMLElement>("#read-only-banner");
const recheckWritableButton = document.querySelector<HTMLButtonElement>("#recheck-writable");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const tabSession = new TabSession(tauriFileServices, canonicalDocumentPath, promptUnsavedChanges);
const editors = new Map<string, HTMLTextAreaElement>();
if (editor) editors.set(tabSession.activeId, editor);
let displayedId = tabSession.activeId;
const documentLifecycle = {
  get snapshot() { return tabSession.snapshot; },
  edit(content: string) { return tabSession.workspace.edit(tabSession.activeId, content); },
};
const tabStrip = document.querySelector<HTMLElement>("#document-tabs");
const tabs = tabStrip ? createDocumentTabs(tabStrip, selectTab, id => void closeTab(id)) : null;
const operationStatusController = createOperationStatusController(operationStatus, dismissOperationStatusButton);
let scrollSync = editor && preview
  ? createScrollSyncController({ editor, preview, getSource: () => documentLifecycle.snapshot.content })
  : null;
const renderedResources = preview
  ? installRenderedResourceController(preview, {
      getDocumentPath: () => documentLifecycle.snapshot.filePath,
      openExternal: openUrl,
      resolveDocumentLink,
      openRelativeDocument: async (path) => { await openPath(path); },
      readLocalImage,
      report: showOperationOutcome,
    })
  : null;
const operationButtons = [newButton, openButton, saveButton, saveAsButton].filter(
  (button): button is HTMLButtonElement => button !== null,
);
let applicationMenu: ApplicationMenuController | null = null;
let tableSelection = { start: 0, end: 0 };
let tableDocumentId: string | null = null;
let recentFiles: string[] = [];
try {
  recentFiles = loadRecentFiles(localStorage);
} catch (error) {
  operationStatusController.show({ status: "failed", message: `Could not load recent files: ${String(error)}` });
}
const settingsDialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
const clearRecentDialog = document.querySelector<HTMLDialogElement>("#clear-recent-dialog");
const settingsController = settingsDialog && clearRecentDialog
  ? createSettingsController(settingsDialog, {
      hasRecentFiles: () => recentFiles.length > 0,
      confirmClear: createClearHistoryConfirmation(clearRecentDialog),
      clearHistory: () => clearRecentHistory(localStorage, async (paths) => {
        recentFiles = paths;
        await applicationMenu?.setRecentFiles(paths);
      }),
    })
  : null;
let viewPreferences: ViewPreferences = DEFAULT_VIEW_PREFERENCES;
try {
  viewPreferences = loadViewPreferences(localStorage);
} catch (error) {
  operationStatusController.show({ status: "failed", message: `Could not load view preferences: ${String(error)}` });
}

tabSession.defaults = viewPreferences;
tabSession.workspace.setView(tabSession.activeId, { ...tabSession.workspace.view(tabSession.activeId), preferences: viewPreferences });

function captureTabView() {
  if (!editor || !preview || !tabSession.workspace.ids.includes(displayedId)) return;
  tabSession.workspace.setView(displayedId, {
    preferences: viewPreferences, selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd,
    selectionDirection: editor.selectionDirection, editorScrollTop: editor.scrollTop, editorScrollLeft: editor.scrollLeft,
    previewScrollTop: preview.scrollTop, previewScrollLeft: preview.scrollLeft,
  });
}
function bindEditor(input: HTMLTextAreaElement) {
  input.addEventListener("input", () => {
    if (tabSession.busy) return;
    operationStatusController.dismissTransient();
    documentLifecycle.edit(input.value);
    renderDocument();
  });
  globalThis.QuickMarkEditor.installMarkdownEditorBehavior(input);
}
function selectTab(id: string) {
  if (tableDialog?.open) return;
  captureTabView();
  tabSession.workspace.select(id);
  displayActiveTab();
}
function displayActiveTab() {
  const id = tabSession.activeId;
  for (const [key, node] of editors) {
    if (!tabSession.workspace.ids.includes(key)) { node.remove(); editors.delete(key); }
  }
  if (displayedId !== id || !editor?.isConnected) {
    scrollSync?.destroy();
    for (const node of editors.values()) { node.hidden = true; node.removeAttribute("id"); }
    let input = editors.get(id);
    if (!input) {
      input = document.createElement("textarea"); input.spellcheck = false;
      input.setAttribute("aria-describedby", "editor-help"); input.placeholder = "# Start writing Markdown…";
      document.querySelector(".editor-panel")?.insertBefore(input, document.querySelector("#editor-help"));
      editors.set(id, input); bindEditor(input);
    }
    editor = input; editor.id = "editor"; editor.hidden = false; displayedId = id;
    const state = tabSession.workspace.view(id); viewPreferences = state.preferences;
    scrollSync = preview ? createScrollSyncController({ editor, preview, getSource: () => tabSession.snapshot.content }) : null;
    renderDocument(); applyViewPreferences();
    editor.setSelectionRange(state.selectionStart, state.selectionEnd, state.selectionDirection);
    // Restore after rendering without letting scroll synchronization overwrite the saved pair.
    scrollSync?.setActive(false);
    editor.scrollTop = state.editorScrollTop; editor.scrollLeft = state.editorScrollLeft;
    if (preview) { preview.scrollTop = state.previewScrollTop; preview.scrollLeft = state.previewScrollLeft; }
    const restoredId = id;
    requestAnimationFrame(() => { if (displayedId === restoredId) applyViewPreferences(); });
    const outcome = tabSession.outcomes.get(id);
    if (outcome) operationStatusController.show(outcome); else operationStatusController.dismissTransient();
  } else renderDocument();
}

function applyViewPreferences() {
  if (!workspace || !viewModeSelect) return;
  workspace.dataset.view = viewPreferences.mode;
  workspace.dataset.swapped = String(viewPreferences.swapped);
  viewModeSelect.value = viewPreferences.mode;
  if (swapButton) swapButton.disabled = viewPreferences.mode !== "both";
  scrollSync?.setActive(viewPreferences.mode === "both" && viewPreferences.syncScrolling);
  void applicationMenu?.setView(viewPreferences.mode, viewPreferences.swapped, viewPreferences.syncScrolling);
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
  if (tabSession.busy) return;
  viewPreferences = next;
  tabSession.defaults = next;
  captureTabView();
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
  tabs?.render(tabSession.workspace.ids.map(id => {
    const snapshot = tabSession.workspace.snapshot(id);
    return { id, name: snapshot.displayName, path: snapshot.filePath, dirty: snapshot.dirty };
  }), tabSession.activeId);
  workspace?.setAttribute("aria-labelledby", `tab-${tabSession.activeId}`);
  editor.readOnly = tabSession.busy;
  operationButtons.forEach(button => { button.disabled = tabSession.busy; });
  if (tableBuilderButton) tableBuilderButton.disabled = tabSession.busy;
  if (viewModeSelect) viewModeSelect.disabled = tabSession.busy;
  if (editor.value !== documentSnapshot.content) editor.value = documentSnapshot.content;
  preview.innerHTML = renderer.render(documentSnapshot.content, { sourceMap: true });
  renderedResources?.refresh();
  scrollSync?.contentRendered();
  if (editorStatus) {
    const count = documentSnapshot.content.length;
    editorStatus.textContent = `${count.toLocaleString()} ${count === 1 ? "character" : "characters"}`;
  }
  if (documentStatus) {
    documentStatus.textContent = formatDocumentStatus(documentSnapshot);
  }
  saveButton && (saveButton.disabled = tabSession.busy || !documentSnapshot.capabilities.canSave);
  saveAsButton && (saveAsButton.disabled = tabSession.busy || !documentSnapshot.capabilities.canSaveAs);
  if (readOnlyBanner) readOnlyBanner.hidden = documentSnapshot.filePath === null || documentSnapshot.capabilities.canSave;
  void applicationMenu?.setDocumentCapabilities(
    documentSnapshot.capabilities.canSave,
    documentSnapshot.capabilities.canSaveAs,
  );
  document.title = `${documentSnapshot.dirty ? "• " : ""}${documentSnapshot.displayName} — QuickMark — Write Markdown. See it rendered.`;
}

function showOperationOutcome(outcome: OperationOutcome) {
  operationStatusController.show(outcome);
  renderDocument();
}

async function runDocumentOperation(operation: () => Promise<OperationOutcome>, targetId = tabSession.activeId) {
  if (tableDialog?.open) return { status: "canceled" as const, message: "Finish Table Builder first." };
  captureTabView();
  try {
    const pending = operation();
    renderDocument();
    const outcome = await pending;
    displayActiveTab();
    if (targetId === tabSession.activeId || outcome.status !== "success") showOperationOutcome(outcome);
    return outcome;
  } catch (error) {
    const outcome = { status: "failed" as const, message: String(error) };
    showOperationOutcome(outcome); return outcome;
  } finally { renderDocument(); }
}

function newDocument() {
  if (tableDialog?.open) return;
  captureTabView();
  tabSession.newDocument(); displayActiveTab(); editor?.focus();
}
async function openPath(path?: string) {
  const outcome = await runDocumentOperation(() => tabSession.open(path));
  if (outcome.status === "success") {
    const openedPath = tabSession.snapshot.filePath;
    if (openedPath) await updateRecentFiles(addRecentFile(recentFiles, openedPath));
  }
  return outcome;
}
function openSelectedDocument() { return openPath(); }
async function openRecentDocument(path: string) {
  const outcome = await openPath(path);
  if (outcome.status === "failed" && !tabSession.busy) await updateRecentFiles(removeRecentFile(recentFiles, path));
}
async function saveCurrentDocument(saveAs = false) {
  const id = tabSession.activeId;
  const outcome = await runDocumentOperation(() => tabSession.save(id, saveAs), id);
  if (outcome.status === "success") {
    const path = tabSession.workspace.snapshot(id).filePath;
    if (path) await updateRecentFiles(addRecentFile(recentFiles, path));
  }
}
function clearDocument() {
  const id = tabSession.activeId;
  return runDocumentOperation(() => tabSession.clear(id), id);
}
function closeTab(id = tabSession.activeId) {
  return runDocumentOperation(() => tabSession.close(id), id);
}

function tableDefinition() {
  if (!tableColumns || !tableRows || !tableColumnFields) throw new Error("Table Builder is unavailable.");
  const headers = [...tableColumnFields.querySelectorAll<HTMLInputElement>("[data-table-header]")].map(
    (input) => input.value,
  );
  const alignments = [...tableColumnFields.querySelectorAll<HTMLInputElement>("[data-table-alignment]:checked")].map(
    (radio) => radio.value as TableAlignment,
  );
  if (headers.length !== tableColumns.valueAsNumber) throw new Error("Choose a valid number of columns.");
  return { headers, alignments, bodyRows: tableRows.valueAsNumber };
}

function updateTablePreview() {
  if (!tablePreview || !tableError) return;
  try {
    tablePreview.value = generateMarkdownTable(tableDefinition()).markdown;
    tableError.hidden = true;
  } catch (error) {
    tablePreview.value = "";
    tableError.textContent = error instanceof Error ? error.message : String(error);
    tableError.hidden = false;
  }
}

function rebuildTableColumns() {
  if (!tableColumns || !tableColumnFields) return;
  const count = tableColumns.valueAsNumber;
  if (!Number.isInteger(count) || count < 1 || count > 20) return updateTablePreview();
  const previousHeaders = [...tableColumnFields.querySelectorAll<HTMLInputElement>("[data-table-header]")].map(
    (input) => input.value,
  );
  const previousAlignments = [...tableColumnFields.querySelectorAll<HTMLInputElement>("[data-table-alignment]:checked")].map(
    (radio) => radio.value,
  );
  const alignmentOptions: readonly TableAlignment[] = ["left", "center", "right"];
  const table = document.createElement("table");
  table.className = "table-dialog__configuration";
  const columns = document.createElement("colgroup");
  for (const className of ["table-dialog__header-column", ...alignmentOptions.map(() => "table-dialog__alignment-column")]) {
    const column = document.createElement("col");
    column.className = className;
    columns.append(column);
  }
  table.append(columns);
  const heading = table.createTHead();
  const groupRow = heading.insertRow();
  const headerHeading = document.createElement("th");
  headerHeading.rowSpan = 2;
  headerHeading.scope = "col";
  headerHeading.textContent = "Column header";
  const alignmentHeading = document.createElement("th");
  alignmentHeading.colSpan = 3;
  alignmentHeading.scope = "colgroup";
  alignmentHeading.textContent = "Alignment";
  groupRow.append(headerHeading, alignmentHeading);
  const optionRow = heading.insertRow();
  for (const alignment of alignmentOptions) {
    const optionHeading = document.createElement("th");
    optionHeading.scope = "col";
    optionHeading.textContent = alignment[0].toUpperCase() + alignment.slice(1);
    optionRow.append(optionHeading);
  }
  const body = table.createTBody();
  const bulkRow = body.insertRow();
  const bulkHeading = document.createElement("th");
  bulkHeading.scope = "row";
  bulkHeading.textContent = "All columns";
  bulkRow.append(bulkHeading);
  for (const alignment of alignmentOptions) {
    const cell = bulkRow.insertCell();
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tableSetAll = alignment;
    const label = `Set all columns ${alignment}`;
    button.textContent = "Set";
    button.ariaLabel = label;
    button.title = label;
    cell.append(button);
  }
  for (let index = 0; index < count; index += 1) {
      const row = body.insertRow();
      const headerCell = document.createElement("th");
      headerCell.scope = "row";
      const header = document.createElement("input");
      header.dataset.tableHeader = "";
      header.value = previousHeaders[index] ?? "";
      header.placeholder = `Column ${index + 1}`;
      header.ariaLabel = `Column ${index + 1} header`;
      headerCell.append(header);
      row.append(headerCell);
      for (const alignment of alignmentOptions) {
        const cell = row.insertCell();
        const label = document.createElement("label");
        label.className = "table-dialog__alignment-choice";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `table-alignment-${index}`;
        radio.value = alignment;
        radio.dataset.tableAlignment = "";
        radio.checked = (previousAlignments[index] ?? "left") === alignment;
        const accessibleLabel = `${alignment[0].toUpperCase() + alignment.slice(1)} align column ${index + 1}`;
        radio.ariaLabel = accessibleLabel;
        label.title = accessibleLabel;
        label.append(radio);
        cell.append(label);
      }
  }
  tableColumnFields.replaceChildren(table);
  updateTablePreview();
}

function resetTableBuilder() {
  if (!tableColumns || !tableRows || !tableColumnFields) return;
  tableColumns.value = "3";
  tableRows.value = "3";
  tableColumnFields.replaceChildren();
  rebuildTableColumns();
}

function showTableBuilder() {
  if (!editor || !tableDialog || tabSession.busy || tableDialog.open) return;
  tableDocumentId = tabSession.activeId;
  if (!documentLifecycle.snapshot.capabilities.editable) {
    showOperationOutcome({ status: "failed", message: "This document cannot be edited." });
    return;
  }
  tableSelection = { start: editor.selectionStart, end: editor.selectionEnd };
  resetTableBuilder();
  tableDialog.showModal();
  tableColumns?.focus();
}

if (editor && preview) {
  bindEditor(editor);
  globalThis.QuickMarkMarkdown.installCodeCopyHandler(
    preview,
    (message) => operationStatusController.show({ status: "success", message }),
    OPERATION_TRANSIENT_DURATION_MS,
  );
  renderDocument();
}

aboutDialog?.addEventListener("click", (event) => {
  if (event.target === aboutDialog) aboutDialog.close();
});
tableDialog?.addEventListener("cancel", (event) => event.preventDefault());
tableColumns?.addEventListener("input", rebuildTableColumns);
tableRows?.addEventListener("input", updateTablePreview);
tableColumnFields?.addEventListener("input", updateTablePreview);
tableColumnFields?.addEventListener("change", updateTablePreview);
tableColumnFields?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-table-set-all]") : null;
  const alignment = target?.dataset.tableSetAll as TableAlignment | undefined;
  if (!alignment || !tableColumnFields) return;
  for (const radio of tableColumnFields.querySelectorAll<HTMLInputElement>(`[data-table-alignment][value="${alignment}"]`)) {
    radio.checked = true;
  }
  updateTablePreview();
});
tableReset?.addEventListener("click", resetTableBuilder);
tableCancel?.addEventListener("click", () => {
  resetTableBuilder();
  tableDialog?.close();
});
tableForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editor || !tableDialog || tableDocumentId !== tabSession.activeId || tabSession.busy) return;
  try {
    const insertion = insertMarkdownTable(
      documentLifecycle.snapshot.content,
      tableSelection.start,
      tableSelection.end,
      generateMarkdownTable(tableDefinition()),
    );
    documentLifecycle.edit(insertion.content);
    renderDocument();
    resetTableBuilder();
    tableDialog.close();
    editor.focus();
    editor.setSelectionRange(insertion.caret, insertion.caret);
  } catch (error) {
    if (tableError) {
      tableError.textContent = error instanceof Error ? error.message : String(error);
      tableError.hidden = false;
    }
  }
});

if (aboutTitle && aboutDescription && aboutVersion && aboutPublisher && aboutRepository) {
  connectAbout(
    {
      title: aboutTitle,
      description: aboutDescription,
      version: aboutVersion,
      publisher: aboutPublisher,
      repository: aboutRepository,
    },
    {
      metadata: appMetadata,
      openRepository: openUrl,
      reportError: (message) => showOperationOutcome({ status: "failed", message }),
    },
  );
}

newButton?.addEventListener("click", () => void newDocument());
openButton?.addEventListener("click", () => void openSelectedDocument());
saveButton?.addEventListener("click", () => void saveCurrentDocument());
saveAsButton?.addEventListener("click", () => void saveCurrentDocument(true));
tableBuilderButton?.addEventListener("click", showTableBuilder);
recheckWritableButton?.addEventListener("click", () =>
  void runDocumentOperation(() => tabSession.recheck(tabSession.activeId)),
);
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

async function initializeCloseProtection() {
  try {
    await onCloseRequested(async (event) => {
      event.preventDefault();
      await runDocumentOperation(() => tabSession.closeWindow(destroyCurrentWindow));
    });
  } catch (error) {
    showOperationOutcome({ status: "failed", message: `Could not initialize unsaved-change protection: ${String(error)}` });
  }
}

async function initializeLaunchHandling() {
  try {
    await listenForLaunchPaths(async path => { await openPath(path); });
    await listenForFileDrops(async path => { await openPath(path); },
      hovering => document.body.classList.toggle("file-drop-active", hovering));
    const launchPath = await initialLaunchPath();
    if (launchPath) await openPath(launchPath);
  } catch (error) {
    showOperationOutcome({ status: "failed", message: `Could not initialize desktop file handling: ${String(error)}` });
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
      showTableBuilder,
      printDocument: () => globalThis.print(),
      closeWindow: () => void closeCurrentWindow(),
      closeTab: () => void closeTab(),
      setView: (mode) => updateViewPreferences({ ...viewPreferences, mode }),
      setSyncScrolling: (enabled) => updateViewPreferences({ ...viewPreferences, syncScrolling: enabled }),
      swapPanes: () => updateViewPreferences({ ...viewPreferences, swapped: !viewPreferences.swapped }),
      showAbout: () => aboutDialog?.showModal(),
      showSettings: () => settingsController?.open(),
      showReadme: () => void openReferenceWindow("readme").catch((error) =>
        showOperationOutcome({ status: "failed", message: `Could not open README: ${String(error)}` }),
      ),
      showCheatSheet: () => void openReferenceWindow("cheat-sheet").catch((error) =>
        showOperationOutcome({ status: "failed", message: `Could not open Markdown Cheat Sheet: ${String(error)}` }),
      ),
      showExamples: () => void openReferenceWindow("examples").catch((error) =>
        showOperationOutcome({ status: "failed", message: `Could not open Markdown Examples: ${String(error)}` }),
      ),
    });
    await applicationMenu.setRecentFiles(recentFiles);
    await applicationMenu.setView(viewPreferences.mode, viewPreferences.swapped, viewPreferences.syncScrolling);
    await applicationMenu.setDocumentCapabilities(
      documentLifecycle.snapshot.capabilities.canSave,
      documentLifecycle.snapshot.capabilities.canSaveAs,
    );
    await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) void applicationMenu?.activate();
    });
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
