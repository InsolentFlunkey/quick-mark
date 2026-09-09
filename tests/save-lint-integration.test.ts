import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";
const mocks = vi.hoisted(() => ({
  actions: null as any, close: null as any,
  lint: vi.fn(), enabled: true, revision: 1, write: vi.fn(), destroy: vi.fn(),
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
  lintPreference: async (enabled?: boolean) => {
    if (enabled !== undefined) { mocks.enabled = enabled; mocks.revision++; }
    return { revision: mocks.revision, enabled: mocks.enabled };
  },
  editorCoordination: {
    claim: async (id: string, path: string) => ({ owner: { document_id: id, window_label: "main" }, key: path, ready: false }),
    adopt: vi.fn(), release: vi.fn(), write: mocks.write, focus: vi.fn(),
  },
  stageEditor: async () => null, acknowledgeEditor: vi.fn(), readyEditor: vi.fn(), focusedEditor: vi.fn(),
  closeEditor: mocks.destroy, pollLaunches: async () => [], listenForDocumentFocus: vi.fn(),
  recentHistory: async () => ({ revision: 1, paths: [] }),
}));
vi.mock("../src/tauri-window-services", () => ({
  closeCurrentWindow: vi.fn(), destroyCurrentWindow: vi.fn(), promptUnsavedChanges: async () => "save",
  onCloseRequested: async (handler: unknown) => { mocks.close = handler; },
}));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ onFocusChanged: async () => {} }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
vi.mock("../src/reference-window-services", () => ({ openReferenceWindow: vi.fn() }));
vi.mock("../src/scroll-sync", () => ({ createScrollSyncController: () => ({ setActive: vi.fn(), contentRendered: vi.fn(), destroy: vi.fn() }) }));

vi.mock("../src/lint-client", () => ({ LintClient: class { run = mocks.lint; cancel = vi.fn(); } }));

it("integrates saved results, origin focus, window-close protection and Close/Clear continuations", async () => {
  localStorage.clear(); document.body.innerHTML = readFileSync("index.html", "utf8");
  await import("../src/main");
  const current = () => document.querySelector<HTMLTextAreaElement>("#editor")!;
  await vi.waitFor(() => expect(current().readOnly).toBe(false));
  const dialog = document.querySelector<HTMLDialogElement>('[aria-labelledby="save-lint-title"]')!;
  dialog.showModal = vi.fn(() => { dialog.open = true; });
  dialog.close = vi.fn(() => { dialog.open = false; dialog.dispatchEvent(new Event("close")); });
  const click = (label: string) => [...dialog.querySelectorAll("button")].find(button => button.textContent === label)!.click();
  const edit = (text: string) => { current().value = text; current().dispatchEvent(new Event("input")); };
  const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  edit("saved source"); const first = current();
  mocks.actions.newDocument(); edit("other source"); const second = current(); tabs()[0].click();
  const view = document.querySelector<HTMLSelectElement>("#view-mode")!;
  view.value = "input"; view.dispatchEvent(new Event("change"));
  let finish!: (issues: unknown[]) => void;
  mocks.lint.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  mocks.actions.saveDocument();
  await vi.waitFor(() => expect(mocks.lint).toHaveBeenCalledWith("saved source"));
  expect(mocks.selectSavePath).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
  tabs()[1].click(); expect(current()).toBe(second);
  finish([{ rule: "MD041", message: "Heading", line: 1, column: null, length: null, detail: "", context: "saved source" }]);
  await vi.waitFor(() => expect(dialog.open).toBe(true));
  expect(dialog.textContent).toContain("Untitled.md"); expect(document.activeElement?.textContent).toBe("Cancel");
  await mocks.close({ preventDefault: vi.fn() }); expect(mocks.destroy).not.toHaveBeenCalled();
  expect(dialog.open).toBe(true); click("Review Issues");
  await vi.waitFor(() => expect(current().readOnly).toBe(false));
  expect(current()).toBe(first); expect(first.value).toBe("saved source");
  expect(mocks.selectSavePath).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled(); expect(tabs()[0].textContent).toContain("•");
  expect(document.querySelector(".workspace")?.getAttribute("data-lint")).toBe("results");
  expect(document.querySelector(".lint-issues")!.textContent).toContain("MD041");
  [...document.querySelectorAll<HTMLButtonElement>(".lint-controls button")].find(button => button.textContent === "Return to Previous View")!.click();
  expect(view.value).toBe("input");
  edit("next saved source"); mocks.actions.clearDocument();
  await vi.waitFor(() => expect(mocks.lint).toHaveBeenCalledTimes(2));
  expect(mocks.selectSavePath).not.toHaveBeenCalled();
  finish([{ rule: "MD041", message: "Heading", line: 1, column: null, length: null, detail: "", context: "next saved source" }]);
  await vi.waitFor(() => expect(dialog.open).toBe(true)); click("Save Anyway");
  await vi.waitFor(() => expect(current().value).toBe("")); expect(tabs()).toHaveLength(2);
  expect(second.value).toBe("other source"); expect(mocks.selectSavePath).toHaveBeenCalledOnce();
  // A newer shared preference refreshes the open control; later saves use it.
  mocks.enabled = false; mocks.revision++;
  await vi.waitFor(() => expect(document.querySelector<HTMLInputElement>("#settings-lint-before-saving")!.checked).toBe(false));
  edit("lint disabled"); mocks.actions.saveDocument();
  await vi.waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
  await vi.waitFor(() => expect(current().readOnly).toBe(false)); expect(mocks.lint).toHaveBeenCalledTimes(2);
});
