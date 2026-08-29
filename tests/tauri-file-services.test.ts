import { beforeEach, describe, expect, it, vi } from "vitest";

const openDialog = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: openDialog,
  save: vi.fn(),
}));
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn() }));
vi.mock("@tauri-apps/api/webview", () => ({ getCurrentWebview: vi.fn() }));

describe("Tauri open-file service", () => {
  beforeEach(() => {
    openDialog.mockReset().mockResolvedValue(null);
  });

  it("derives native parent directories for supported path styles", async () => {
    const { parentDirectory } = await import("../src/tauri-file-services");

    expect(parentDirectory("/notes/file.md")).toBe("/notes");
    expect(parentDirectory("/file.md")).toBe("/");
    expect(parentDirectory("C:\\notes\\file.md")).toBe("C:\\notes");
    expect(parentDirectory("C:\\file.md")).toBe("C:\\");
    expect(parentDirectory("file.md")).toBeNull();
  });

  it("uses the native default until an opened path is recorded", async () => {
    vi.resetModules();
    const { tauriFileServices } = await import("../src/tauri-file-services");

    await tauriFileServices.selectOpenPath();
    expect(openDialog).toHaveBeenLastCalledWith(expect.not.objectContaining({ defaultPath: expect.anything() }));

    tauriFileServices.recordOpenedPath("/notes/opened.md");
    await tauriFileServices.selectOpenPath();
    expect(openDialog).toHaveBeenLastCalledWith(expect.objectContaining({ defaultPath: "/notes" }));
  });

  it("falls back to the native default for a path without a parent", async () => {
    vi.resetModules();
    const { tauriFileServices } = await import("../src/tauri-file-services");

    tauriFileServices.recordOpenedPath("opened.md");
    await tauriFileServices.selectOpenPath();
    expect(openDialog).toHaveBeenLastCalledWith(expect.not.objectContaining({ defaultPath: expect.anything() }));
  });
});
