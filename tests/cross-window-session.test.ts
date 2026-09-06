import { describe, expect, it, vi } from "vitest";
import { TabSession } from "../src/tab-session";
import type { EditorCoordination } from "../src/editor-coordination";
import type { DocumentFileServices } from "../src/document-operations";
function setup() {
  const native: EditorCoordination = {
    claim: vi.fn(async (id, path) => ({ owner: { document_id: id, window_label: "main" }, key: path, ready: false })),
    adopt: vi.fn(), release: vi.fn(), write: vi.fn(), focus: vi.fn(),
    detach: vi.fn(async (_, token) => ({ token })),
    transferStatus: vi.fn(async () => ({ status: "committed", target: "editor-1" })),
  };
  const files: DocumentFileServices = {
    selectOpenPath: async () => "/a.md", selectSavePath: async () => "/saved.md",
    readText: vi.fn(async () => "saved baseline"), writeText: vi.fn(),
    isWritable: async () => true, recordOpenedPath: vi.fn(),
  };
  const session = new TabSession(files, async path => path, async () => "cancel", undefined, native);
  return { session, native, files };
}
describe("cross-window tab coordination", () => {
  it("reserves before reading and reuses the originating blank only on success", async () => {
    const { session, native, files } = setup(); const blank = session.activeId;
    await session.open("/a.md");
    expect(native.claim).toHaveBeenCalledWith(blank, "/a.md");
    expect(vi.mocked(native.claim).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(files.readText).mock.invocationCallOrder[0]);
    expect(native.adopt).toHaveBeenCalledWith(blank);
    expect(session.workspace.ids).toEqual([blank]);
  });
  it("releases a failed read reservation and preserves the blank", async () => {
    const { session, native, files } = setup(); const blank = session.activeId;
    vi.mocked(files.readText).mockRejectedValue(Error("read failed"));
    expect((await session.open("/a.md")).status).toBe("failed");
    expect(native.release).toHaveBeenCalledWith(blank); expect(native.adopt).not.toHaveBeenCalled();
    expect(session.workspace.ids).toEqual([blank]); expect(session.snapshot.filePath).toBeNull();
  });
  it("focuses a remote duplicate without reading it or losing local work", async () => {
    const { session, native, files } = setup(); const blank = session.activeId;
    vi.mocked(native.claim).mockResolvedValue({ owner: { document_id: "remote", window_label: "other" }, key: "/a.md", ready: true });
    expect(await session.open("/a.md")).toMatchObject({ status: "success", documentPath: "/a.md" });
    expect(native.focus).toHaveBeenCalledWith("remote"); expect(files.readText).not.toHaveBeenCalled();
    expect(session.workspace.ids).toEqual([blank]); expect(session.snapshot.content).toBe("");
  });
  it("does not pretend a pending reservation is an adopted tab", async () => {
    const { session, native, files } = setup();
    vi.mocked(native.claim).mockResolvedValue({ owner: { document_id: "remote", window_label: "other" }, key: "/a.md", ready: false });
    expect((await session.open("/a.md")).status).toBe("failed");
    expect(native.focus).not.toHaveBeenCalled(); expect(files.readText).not.toHaveBeenCalled();
  });
  it("rejects remote Save As collisions without falling back to unowned writes", async () => {
    const { session, native, files } = setup(); const id = session.activeId;
    session.workspace.edit(id, "keep edited content");
    vi.mocked(native.write).mockRejectedValue(Error("already open in another window"));
    expect((await session.save(id, true)).status).toBe("failed");
    expect(files.writeText).not.toHaveBeenCalled(); expect(session.snapshot.dirty).toBe(true);
    expect(session.snapshot.filePath).toBeNull();
  });
  it("detaches file-backed state and restores it only in the acknowledged target", async () => {
    const { session, native } = setup(); await session.open("/a.md"); const id = session.activeId;
    session.workspace.edit(id, "changed content");
    const view = { ...session.workspace.view(id), selectionStart: 2, selectionEnd: 6,
      selectionDirection: "backward" as const, editorScrollTop: 12, previewScrollTop: 30,
      preferences: { mode: "input" as const, swapped: true, syncScrolling: false } };
    session.workspace.setView(id, view);
    expect((await session.detach(id)).status).toBe("success");
    const state = vi.mocked(native.detach).mock.calls[0][0];
    const target = setup().session; target.setInitializing(true); target.adoptTransfer(state);
    expect(target.busy).toBe(true); expect(target.workspace.ids).toEqual([id]);
    expect(target.snapshot).toMatchObject({ content: "changed content", lastSavedContent: "saved baseline", dirty: true, filePath: "/a.md" });
    expect(target.workspace.view(id)).toEqual(view);
    expect(session.workspace.ids).not.toContain(id); expect(session.snapshot.content).toBe("");
  });
  it("freezes edits, saves, closes and view changes while waiting for adoption", async () => {
    const { session, native } = setup(); const id = session.activeId; session.workspace.edit(id, "unsaved");
    let release!: () => void;
    vi.mocked(native.transferStatus).mockResolvedValueOnce({ status: "pending", target: "editor-1" });
    const detaching = session.detach(id, () => new Promise<void>(resolve => { release = resolve; }));
    await vi.waitFor(() => expect(release).toBeDefined());
    expect(session.workspace.ids).toContain(id); expect(session.canSwitch).toBe(false);
    expect(() => session.workspace.edit(id, "bad")).toThrow();
    expect(() => session.workspace.setView(id, session.workspace.view(id))).toThrow();
    await expect(session.save(id)).rejects.toThrow(); await expect(session.close(id)).rejects.toThrow();
    await expect(session.closeWindow(vi.fn())).rejects.toThrow();
    release(); await detaching; expect(session.busy).toBe(false);
  });
  it("creation failure confirms cancellation before unfreezing the source", async () => {
    const { session, native } = setup(); const id = session.activeId; session.workspace.edit(id, "keep");
    vi.mocked(native.detach).mockRejectedValue(Error("creation failed"));
    vi.mocked(native.transferStatus).mockResolvedValue({ status: "canceled", target: "editor-1" });
    expect((await session.detach(id)).status).toBe("failed");
    expect(native.transferStatus).toHaveBeenCalledWith(expect.any(String), true);
    expect(session.activeId).toBe(id); expect(session.snapshot.content).toBe("keep");
    session.workspace.edit(id, "still editable");
  });
  it("lost creation and completion replies cannot reactivate a committed source", async () => {
    const { session, native } = setup(); const id = session.activeId;
    vi.mocked(native.detach).mockRejectedValue(Error("lost reply after creation"));
    vi.mocked(native.transferStatus).mockRejectedValueOnce(Error("lost status reply"));
    const report = vi.fn(); await session.detach(id, async () => {}, report);
    expect(report).toHaveBeenCalled(); expect(session.workspace.ids).not.toContain(id);
    expect(native.transferStatus).toHaveBeenLastCalledWith(expect.any(String), true);
  });
  it("timeout requests cancellation but honors a commit that already won the race", async () => {
    const { session, native } = setup(); const id = session.activeId;
    vi.mocked(native.transferStatus).mockImplementation(async (_, cancel) => ({ status: cancel ? "committed" : "pending", target: "editor-1" }));
    await session.detach(id, async () => {});
    expect(native.transferStatus).toHaveBeenCalledTimes(151); expect(session.workspace.ids).not.toContain(id);
  });
  it("retains the canonical key after detaching a document saved through an alias", async () => {
    const { session, native } = setup();
    const source = setup().session; await source.open("/alias.md");
    const lease = source.workspace.beginTransfer(source.activeId);
    session.adoptTransfer(lease.state, "/a.md"); const moved = session.activeId;
    session.newDocument(); await session.open("/a.md");
    expect(session.workspace.ids).toEqual([moved]); expect(session.activeId).toBe(moved);
    expect(native.claim).not.toHaveBeenCalled(); lease.cancel();
  });
  it("invalid target adoption keeps its existing workspace intact", () => {
    const { session } = setup(); const blank = session.activeId;
    expect(() => session.adoptTransfer({ version: 99 } as any)).toThrow();
    expect(session.workspace.ids).toEqual([blank]);
  });
});
