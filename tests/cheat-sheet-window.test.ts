import { readFileSync } from "node:fs";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getByLabel: vi.fn(), created: vi.fn() }));
vi.mock("@tauri-apps/api/webviewWindow", () => ({ WebviewWindow: class {
  static getByLabel = mocks.getByLabel;
  constructor(label: string, options: unknown) { mocks.created(label, options); }
  once(event: string, callback: () => void) { if (event === "tauri://created") callback(); }
} }));
import { openReferenceWindow } from "../src/reference-window-services";
beforeEach(() => { vi.clearAllMocks(); });
it("creates an independent cheat-sheet window and focuses it on repeated requests", async () => {
  mocks.getByLabel.mockResolvedValue(null);
  expect(await openReferenceWindow("cheat-sheet")).toBe("created");
  expect(mocks.created).toHaveBeenCalledWith("cheat-sheet", expect.objectContaining({ url: "/reference.html?kind=cheat-sheet", title: "QuickMark Markdown Cheat Sheet" }));
  const existing = { show: vi.fn(), setFocus: vi.fn() }; mocks.getByLabel.mockResolvedValue(existing);
  expect(await openReferenceWindow("cheat-sheet")).toBe("focused");
  expect(existing.show).toHaveBeenCalledOnce(); expect(existing.setFocus).toHaveBeenCalledOnce();
  expect(mocks.created).toHaveBeenCalledOnce();
});
it("wires Help to the read-only reference and preserves its document boundary", () => {
  const read = (path: string) => readFileSync(path, "utf8");
  expect(read("src/application-menu.ts")).toContain('text: "Markdown Cheat Sheet", action: actions.showCheatSheet');
  expect(read("src/main.ts")).toContain('showCheatSheet: () => void openReferenceWindow("cheat-sheet")');
  const reference = read("src/reference.ts");
  expect(reference).toContain('kind === "cheat-sheet" ? bundledCheatSheet');
  expect(reference).toContain('editorPanel.hidden = kind !== "examples"');
  expect(reference).toContain('actions.hidden = kind !== "examples"');
  expect(reference).toContain('Bundled reference documents cannot replace the active QuickMark document.');
  for (const name of ["default", "desktop", "rendered-content"]) {
    expect(JSON.parse(read(`src-tauri/capabilities/${name}.json`)).windows).toContain("cheat-sheet");
  }
});
