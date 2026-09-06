import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";
const mocks = vi.hoisted(() => ({
  actions: null as any, close: null as any,
  selectOpenPath: vi.fn(async () => "/opened.md"),
  readText: vi.fn(async () => "# Opened"),
  selectSavePath: vi.fn(async () => "/saved.md"), writeText: vi.fn(async () => {}),
}));
vi.mock("../src/app-metadata-env", () => ({ appMetadata: { name: "QuickMark", version: "test", description: "test", publisher: "test", repository: "https://example.com" } }));
vi.mock("../src/application-menu", () => ({ createApplicationMenu: async (actions: unknown) => {
  mocks.actions = actions;
  return { setRecentFiles: vi.fn(), setView: vi.fn(), setDocumentCapabilities: vi.fn(), activate: vi.fn(), setBusy: vi.fn() };
} }));
vi.mock("../src/tauri-file-services", () => ({
  tauriFileServices: { selectOpenPath: mocks.selectOpenPath, selectSavePath: mocks.selectSavePath,
    readText: mocks.readText, writeText: mocks.writeText, isWritable: async () => true, recordOpenedPath: vi.fn() },
  canonicalDocumentPath: async (path: string) => path,
  initialLaunchPath: async () => null, listenForFileDrops: async () => {}, listenForLaunchPaths: async () => {},
  readLocalImage: vi.fn(), resolveDocumentLink: vi.fn(),
}));
vi.mock("../src/tauri-editor-services", () => ({
  editorCoordination: {
    claim: async (id: string, path: string) => ({ owner: { document_id: id, window_label: "main" }, key: path, ready: false }),
    adopt: vi.fn(), release: vi.fn(), write: vi.fn(), focus: vi.fn(),
  },
  stageEditor: async () => null, acknowledgeEditor: vi.fn(), readyEditor: vi.fn(), focusedEditor: vi.fn(),
  closeEditor: vi.fn(), pollLaunches: async () => [], listenForDocumentFocus: vi.fn(),
  recentHistory: async () => ({ revision: 1, paths: [] }),
}));
vi.mock("../src/tauri-window-services", () => ({
  closeCurrentWindow: vi.fn(), destroyCurrentWindow: vi.fn(), promptUnsavedChanges: async () => "cancel",
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
  expect(document.activeElement).toBe(editor);
  expect(document.querySelector("#preview")!.textContent).toContain("first");
  editor.value = previous; editor.dispatchEvent(new Event("input"));
}

it("switches retained editors, restores selection/view and routes toolbar/menu actions to tabs", async () => {
  localStorage.clear(); document.body.innerHTML = readFileSync("index.html", "utf8");
  await import("../src/main");
  await vi.waitFor(() => expect(mocks.actions).not.toBeNull());
  const current = () => document.querySelector<HTMLTextAreaElement>("#editor")!;
  await vi.waitFor(() => expect(current().readOnly).toBe(false));
  const first = current(); verifyNativeOutdent(first); first.value = "first unsaved document"; first.dispatchEvent(new Event("input"));
  first.setSelectionRange(2, 7, "backward");
  const view = document.querySelector<HTMLSelectElement>("#view-mode")!; view.value = "input"; view.dispatchEvent(new Event("change"));
  document.querySelector<HTMLButtonElement>("#new-document")!.click();
  const second = current(); verifyNativeOutdent(second); expect(second).not.toBe(first); expect(first.hidden).toBe(true);
  second.value = "second document"; second.dispatchEvent(new Event("input"));
  view.value = "preview"; view.dispatchEvent(new Event("change"));
  const tabButtons = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  tabButtons()[0].click();
  expect(current()).toBe(first); expect(first.value).toBe("first unsaved document");
  expect(first.selectionStart).toBe(2); expect(first.selectionEnd).toBe(7); expect(first.selectionDirection).toBe("backward");
  expect(view.value).toBe("input");
  mocks.actions.openDocument();
  await vi.waitFor(() => expect(tabButtons()).toHaveLength(3));
  expect(current().value).toBe("# Opened"); verifyNativeOutdent(current()); expect(first.value).toBe("first unsaved document");
  mocks.actions.openDocument(); await vi.waitFor(() => expect(mocks.selectOpenPath).toHaveBeenCalledTimes(2));
  await new Promise(resolve => setTimeout(resolve, 0)); expect(tabButtons()).toHaveLength(3);
  mocks.actions.closeTab(); await vi.waitFor(() => expect(tabButtons()).toHaveLength(2));
  expect(current()).toBe(first);
  // Cancel on a dirty tab retains it; no blank replacement is created.
  mocks.actions.closeTab(); await new Promise(resolve => setTimeout(resolve, 0)); expect(tabButtons()).toHaveLength(2);
  const event = { preventDefault: vi.fn() }; await mocks.close(event); expect(event.preventDefault).toHaveBeenCalledOnce();
  expect(tabButtons()).toHaveLength(2);
});
