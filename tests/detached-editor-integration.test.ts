import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";
const mocks = vi.hoisted(() => ({
  actions: null as any, acknowledge: vi.fn(), ready: vi.fn(), close: vi.fn(),
  state: { version: 1, documentId: "moved", document: { version: 1, content: "changed text", lastSavedContent: "saved text",
    filePath: "/a.md", displayName: "a.md", canSave: false },
    view: { preferences: { mode: "input", swapped: true, syncScrolling: false }, selectionStart: 2, selectionEnd: 6,
      selectionDirection: "backward", editorScrollTop: 12, editorScrollLeft: 0, previewScrollTop: 30, previewScrollLeft: 0 } },
}));
vi.mock("../src/app-metadata-env", () => ({ appMetadata: { name: "QuickMark", version: "test", description: "test", publisher: "test", repository: "https://example.com" } }));
vi.mock("../src/application-menu", () => ({ createApplicationMenu: async (actions: unknown) => {
  mocks.actions = actions;
  return { setRecentFiles: vi.fn(), setView: vi.fn(), setDocumentCapabilities: vi.fn(), setBusy: vi.fn(), activate: vi.fn() };
} }));
vi.mock("../src/tauri-file-services", () => ({
  tauriFileServices: {}, canonicalDocumentPath: async (path: string) => path,
  listenForFileDrops: async () => {}, readLocalImage: vi.fn(), resolveDocumentLink: vi.fn(),
}));
vi.mock("../src/tauri-editor-services", () => ({
  editorCoordination: {}, stageEditor: async () => ({ token: "token", snapshot: mocks.state, status: "pending" }),
  acknowledgeEditor: mocks.acknowledge, readyEditor: mocks.ready, focusedEditor: vi.fn(), closeEditor: mocks.close,
  pollLaunches: async () => [], listenForDocumentFocus: vi.fn(), recentHistory: async () => ({ revision: 1, paths: [] }),
}));
vi.mock("../src/tauri-window-services", () => ({ closeCurrentWindow: vi.fn(), promptUnsavedChanges: vi.fn(), onCloseRequested: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ onFocusChanged: vi.fn() }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
vi.mock("../src/reference-window-services", () => ({ openReferenceWindow: vi.fn() }));
vi.mock("../src/scroll-sync", () => ({ createScrollSyncController: () => ({ setActive: vi.fn(), contentRendered: vi.fn(), destroy: vi.fn() }) }));
it("keeps the destination locked until acknowledgement then restores content, selection, view and capability", async () => {
  let acknowledge!: (value: unknown) => void;
  mocks.acknowledge.mockImplementation(() => new Promise(resolve => { acknowledge = resolve; }));
  localStorage.clear(); document.body.innerHTML = readFileSync("index.html", "utf8");
  await import("../src/main");
  await vi.waitFor(() => expect(mocks.acknowledge).toHaveBeenCalledWith("token"));
  expect(document.querySelector<HTMLTextAreaElement>("#editor")!.readOnly).toBe(true);
  const locked = document.querySelector<HTMLTextAreaElement>("#editor")!;
  const lockedText = locked.value;
  const blockedTab = new KeyboardEvent("keydown", { key: "Unidentified", code: "Tab", shiftKey: true, bubbles: true, cancelable: true });
  locked.dispatchEvent(blockedTab);
  expect(blockedTab.defaultPrevented).toBe(true);
  expect(locked.value).toBe(lockedText);
  mocks.actions.newDocument(); expect(document.querySelectorAll('[role="tab"]')).toHaveLength(1);
  expect(mocks.ready).not.toHaveBeenCalled();
  acknowledge({ status: "committed", target: "editor-1" });
  await vi.waitFor(() => expect(mocks.ready).toHaveBeenCalledOnce());
  const editor = document.querySelector<HTMLTextAreaElement>("#editor")!;
  expect(editor.readOnly).toBe(false); expect(editor.value).toBe("changed text");
  expect(editor.selectionStart).toBe(2); expect(editor.selectionEnd).toBe(6); expect(editor.selectionDirection).toBe("backward");
  expect(editor.scrollTop).toBe(12); expect(document.querySelector("#preview")!.scrollTop).toBe(30);
  expect(document.querySelector<HTMLSelectElement>("#view-mode")!.value).toBe("input");
  expect(document.querySelector<HTMLButtonElement>("#save-document")!.disabled).toBe(true);
  expect(document.querySelector<HTMLButtonElement>("#save-document-as")!.disabled).toBe(false);
  expect(document.querySelectorAll('[role="tab"]')).toHaveLength(1);
  expect(document.title).toContain("• a.md");
  editor.value = "    - moved item"; editor.dispatchEvent(new Event("input"));
  editor.focus(); editor.setSelectionRange(editor.value.length, editor.value.length);
  const outdent = new KeyboardEvent("keydown", { key: "Unidentified", code: "Tab", shiftKey: true, bubbles: true, cancelable: true });
  editor.dispatchEvent(outdent);
  expect(outdent.defaultPrevented).toBe(true);
  expect(editor.value).toBe("- moved item");
  expect(document.activeElement).toBe(editor);
  expect(document.querySelector("#preview")!.textContent).toContain("moved item");
});
