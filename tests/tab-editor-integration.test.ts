import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";
const mocks = vi.hoisted(() => ({
  actions: null as any, close: null as any, prompt: vi.fn(async () => "cancel"), editHistory: vi.fn(),
  selectOpenPath: vi.fn(async () => "/opened.md"),
  readText: vi.fn(async () => "# Opened"),
  selectSavePath: vi.fn(async () => "/saved.md"), writeText: vi.fn(async () => {}),
  listPaths: vi.fn(async () => ({ entries: [{ name: "nested.md", kind: "document" }], truncated: false })),
}));
vi.mock("../src/app-metadata-env", () => ({ appMetadata: { name: "QuickMark", version: "test", description: "test", publisher: "test", repository: "https://example.com" } }));
vi.mock("../src/application-menu", () => ({ createApplicationMenu: async (actions: unknown) => {
  mocks.actions = actions;
  return { setRecentFiles: vi.fn(), setView: vi.fn(), setDocumentCapabilities: vi.fn(), setEditHistory: mocks.editHistory, activate: vi.fn(), setBusy: vi.fn() };
} }));
vi.mock("../src/tauri-file-services", () => ({
  listPathCompletions: mocks.listPaths,
  tauriFileServices: { selectOpenPath: mocks.selectOpenPath, selectSavePath: mocks.selectSavePath,
    readText: mocks.readText, writeText: mocks.writeText, isWritable: async () => true, recordOpenedPath: vi.fn() },
  canonicalDocumentPath: async (path: string) => path,
  initialLaunchPath: async () => null, listenForFileDrops: async () => {}, listenForLaunchPaths: async () => {},
  readLocalImage: vi.fn(), resolveDocumentLink: vi.fn(),
}));
vi.mock("../src/tauri-editor-services", () => ({
  lintPreference: async () => ({ revision: 0, enabled: false }),
  editorCoordination: {
    claim: async (id: string, path: string) => ({ owner: { document_id: id, window_label: "main" }, key: path, ready: false }),
    adopt: vi.fn(), release: vi.fn(), write: vi.fn(), focus: vi.fn(),
  },
  stageEditor: async () => null, acknowledgeEditor: vi.fn(), readyEditor: vi.fn(), focusedEditor: vi.fn(),
  closeEditor: vi.fn(), pollLaunches: async () => [], listenForDocumentFocus: vi.fn(),
  recentHistory: async () => ({ revision: 1, paths: [] }),
}));
vi.mock("../src/tauri-window-services", () => ({
  closeCurrentWindow: vi.fn(), destroyCurrentWindow: vi.fn(), promptUnsavedChanges: mocks.prompt,
  onCloseRequested: async (handler: unknown) => { mocks.close = handler; },
}));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ onFocusChanged: async () => {} }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
vi.mock("../src/reference-window-services", () => ({ openReferenceWindow: vi.fn() }));
vi.mock("../src/scroll-sync", () => ({ createScrollSyncController: () => ({ setActive: vi.fn(), contentRendered: vi.fn(), destroy: vi.fn() }) }));

function verifyNativeOutdent(editor: HTMLTextAreaElement) {
  const previous = editor.value;
  editor.value = "    - first\n    - second";
  editor.dispatchEvent(new Event("input"));
  editor.focus(); editor.setSelectionRange(0, editor.value.length);
  const event = new KeyboardEvent("keydown", { key: "Unidentified", code: "Tab", shiftKey: true, bubbles: true, cancelable: true });
  editor.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(editor.value).toBe("- first\n- second");
  expect(editor.contains(document.activeElement)).toBe(true);
  expect(document.querySelector("#preview")!.textContent).toContain("first");
  editor.value = previous; editor.dispatchEvent(new Event("input"));
}

it("switches retained editors, restores selection/view and routes toolbar/menu actions to tabs", async () => {
  localStorage.clear(); document.body.innerHTML = readFileSync("index.html", "utf8");
  const tableDialog = document.querySelector<HTMLDialogElement>("#table-dialog")!;
  tableDialog.showModal = vi.fn(() => { tableDialog.open = true; });
  tableDialog.close = vi.fn(() => { tableDialog.open = false; tableDialog.dispatchEvent(new Event("close")); });
  await import("../src/main");
  await vi.waitFor(() => expect(mocks.actions).not.toBeNull());
  const current = () => document.querySelector<HTMLTextAreaElement>("#editor")!;
  await vi.waitFor(() => expect(current().readOnly).toBe(false));
  const first = current(); verifyNativeOutdent(first);
  first.value = "BeforeAfter"; first.dispatchEvent(new Event("input")); first.setSelectionRange(6, 6);
  mocks.actions.showTableBuilder();
  document.querySelector<HTMLFormElement>("#table-form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(first.value).toContain("| :--- | :--- | :--- |");
  expect(document.querySelector("#preview table")).not.toBeNull();
  await vi.waitFor(() => expect(mocks.editHistory).toHaveBeenLastCalledWith(true, false));
  mocks.actions.undo(); expect(first.value).toBe("BeforeAfter"); expect(first.selectionStart).toBe(6);
  expect(document.querySelector("#preview table")).toBeNull();
  await vi.waitFor(() => expect(mocks.editHistory).toHaveBeenLastCalledWith(false, true));
  mocks.actions.redo(); expect(first.value).toContain("| :--- | :--- | :--- |");
  expect(document.querySelector("#preview table")).not.toBeNull();
  await vi.waitFor(() => expect(mocks.editHistory).toHaveBeenLastCalledWith(true, false));
  const tableDocument = first.value;
  mocks.actions.showTableBuilder();
  const header = document.querySelector<HTMLInputElement>("[data-table-header]")!;
  const enterHeader = (value: string) => {
    header.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText" }));
    header.value = value; header.setSelectionRange(value.length, value.length);
    header.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  };
  enterHeader("A"); enterHeader("AB");
  for (const expected of ["A", "", ""]) {
    const undo = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true });
    header.dispatchEvent(undo); expect(undo.defaultPrevented).toBe(true); expect(header.value).toBe(expected);
    expect(first.value).toBe(tableDocument);
  }
  document.querySelector<HTMLButtonElement>("#table-cancel")!.click();
  const view = document.querySelector<HTMLSelectElement>("#view-mode")!; view.value = "input"; view.dispatchEvent(new Event("change"));
  document.querySelector<HTMLButtonElement>("#new-document")!.click();
  const second = current(); verifyNativeOutdent(second); expect(second).not.toBe(first); expect(first.hidden).toBe(true);
  second.value = "second document"; second.dispatchEvent(new Event("input"));
  view.value = "preview"; view.dispatchEvent(new Event("change"));
  const tabButtons = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  tabButtons()[0].click();
  expect(current()).toBe(first); expect(first.value).toContain("| :--- | :--- | :--- |");
  mocks.actions.undo(); expect(first.value).toBe("BeforeAfter"); expect(second.value).toBe("second document");
  mocks.actions.redo(); expect(first.value).toContain("| :--- | :--- | :--- |");
  first.value = "first unsaved document"; first.dispatchEvent(new Event("input"));
  first.setSelectionRange(2, 7, "backward");
  expect(first.selectionStart).toBe(2); expect(first.selectionEnd).toBe(7); expect(first.selectionDirection).toBe("backward");
  expect(view.value).toBe("input");
  mocks.actions.openDocument();
  await vi.waitFor(() => expect(tabButtons()).toHaveLength(3));
  expect(current().value).toBe("# Opened"); verifyNativeOutdent(current()); expect(first.value).toBe("first unsaved document");
  // Completion updates the active document/preview through the ordinary input path.
  const opened = current(); opened.value = "[Nested](ne)";
  opened.setSelectionRange(11, 11); opened.dispatchEvent(new Event("input"));
  const content = opened.querySelector<HTMLElement>(".cm-content")!; content.focus();
  content.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", ctrlKey: true, bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(document.querySelector('[role="option"]')?.textContent).toBe("nested.mddocument"));
  expect(mocks.listPaths).toHaveBeenLastCalledWith("/opened.md", ".", "ne", false);
  content.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  expect(opened.value).toBe("[Nested](nested.md)");
  expect(document.querySelector('#preview a')?.getAttribute("href")).toBe("nested.md");
  tabButtons()[0].click(); expect(document.querySelector('[role="option"]')).toBeNull();
  tabButtons()[2].click(); expect(current().value).toBe("[Nested](nested.md)");
  opened.value = "# Opened"; opened.dispatchEvent(new Event("input"));
  mocks.actions.openDocument(); await vi.waitFor(() => expect(mocks.selectOpenPath).toHaveBeenCalledTimes(2));
  await new Promise(resolve => setTimeout(resolve, 0)); expect(tabButtons()).toHaveLength(3);
  mocks.actions.closeTab(); await vi.waitFor(() => expect(tabButtons()).toHaveLength(2));
  expect(current()).toBe(first);
  // Cancel on a dirty tab retains it; no blank replacement is created.
  mocks.actions.closeTab(); await new Promise(resolve => setTimeout(resolve, 0)); expect(tabButtons()).toHaveLength(2);
  const event = { preventDefault: vi.fn() }; await mocks.close(event); expect(event.preventDefault).toHaveBeenCalledOnce();
  expect(tabButtons()).toHaveLength(2);
  mocks.prompt.mockResolvedValueOnce("discard");
  mocks.actions.clearDocument(); await vi.waitFor(() => expect(current().value).toBe(""));
  mocks.actions.undo(); expect(current().value).toBe("");
});
