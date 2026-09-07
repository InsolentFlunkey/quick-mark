import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";
const mocks = vi.hoisted(() => ({
  actions: null as any, close: null as any, focus: null as any,
  diskText: "saved", diskStatus: "unchanged", prompt: vi.fn(async () => "reload"),
  selectOpenPath: vi.fn(async () => "/opened.md"),
  readText: vi.fn(async () => "# Opened"),
  selectSavePath: vi.fn(async () => "/saved.md"), writeText: vi.fn(async () => {}),
}));
vi.mock("../src/app-metadata-env", () => ({ appMetadata: { name: "QuickMark", version: "test", description: "test", publisher: "test", repository: "https://example.com" } }));
vi.mock("../src/external-change", () => ({ promptExternalChange: mocks.prompt }));
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
    disk: async (_id: string, operation: string) => {
      if (operation === "read" || operation === "reload") { mocks.diskStatus = "unchanged"; return {content:mocks.diskText,writable:true}; }
      return {status:mocks.diskStatus,token:1,writable:mocks.diskStatus !== "missing"};
    },
    claim: async (id: string, path: string) => ({ owner: { document_id: id, window_label: "main" }, key: path, ready: false }),
    adopt: vi.fn(), release: vi.fn(), write: vi.fn(), focus: vi.fn(),
  },
  stageEditor: async () => null, acknowledgeEditor: vi.fn(), readyEditor: vi.fn(), focusedEditor: vi.fn(async () => {}),
  closeEditor: vi.fn(), pollLaunches: async () => [], listenForDocumentFocus: vi.fn(),
  recentHistory: async () => ({ revision: 1, paths: [] }),
}));
vi.mock("../src/tauri-window-services", () => ({
  closeCurrentWindow: vi.fn(), destroyCurrentWindow: vi.fn(), promptUnsavedChanges: async () => "cancel",
  onCloseRequested: async (handler: unknown) => { mocks.close = handler; },
}));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ onFocusChanged: async (handler: unknown) => { mocks.focus=handler; } }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
vi.mock("../src/reference-window-services", () => ({ openReferenceWindow: vi.fn() }));
vi.mock("../src/scroll-sync", () => ({ createScrollSyncController: () => ({ setActive: vi.fn(), contentRendered: vi.fn(), destroy: vi.fn() }) }));

it("shows a persistent targeted notice and reloads only after explicit approval", async () => {
  localStorage.clear(); document.body.innerHTML = readFileSync("index.html", "utf8");
  await import("../src/main");
  await vi.waitFor(() => expect(mocks.actions).not.toBeNull());
  const current=()=>document.querySelector<HTMLTextAreaElement>("#editor")!;
  await vi.waitFor(()=>expect(current().readOnly).toBe(false));
  mocks.actions.openDocument(); await vi.waitFor(()=>expect(current().value).toBe("saved"));
  current().value="my edits"; current().dispatchEvent(new Event("input"));
  mocks.diskText="new disk"; mocks.diskStatus="changed";
  await mocks.focus({payload:true});
  const banner=document.querySelector<HTMLElement>("#external-change")!;
  await vi.waitFor(()=>expect(banner.hidden).toBe(false));
  expect(current().value).toBe("my edits");
  document.querySelector<HTMLButtonElement>("#external-keep")!.click();
  expect(document.activeElement).toBe(current()); expect(banner.hidden).toBe(false);
  mocks.actions.newDocument(); expect(banner.hidden).toBe(true);
  document.querySelector<HTMLButtonElement>('[role="tab"]')!.click();
  expect(banner.hidden).toBe(false);
  mocks.prompt.mockResolvedValueOnce("cancel");
  document.querySelector<HTMLButtonElement>("#external-reload")!.click();
  await vi.waitFor(()=>expect(mocks.prompt).toHaveBeenCalledOnce());
  await vi.waitFor(()=>expect(current().readOnly).toBe(false));
  expect(current().value).toBe("my edits");
  document.querySelector<HTMLButtonElement>("#external-reload")!.click();
  await vi.waitFor(()=>expect(current().value).toBe("new disk"));
  expect(banner.hidden).toBe(true); expect(document.querySelector("#preview")!.textContent).toContain("new disk");
  mocks.diskStatus="missing"; await mocks.focus({payload:true});
  await vi.waitFor(()=>expect(banner.hidden).toBe(false));
  expect(document.querySelector<HTMLButtonElement>("#external-reload")!.disabled).toBe(true);
  expect(document.querySelector<HTMLButtonElement>("#external-save-as")!.disabled).toBe(false);
  expect(current().value).toBe("new disk");
});
