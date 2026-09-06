import { describe, expect, it, vi } from "vitest";
import { TabSession } from "../src/tab-session";
import type { DocumentFileServices } from "../src/document-operations";
function setup() {
  const files = new Map([["/a.md", "A"], ["/b.md", "B"]]);
  const services: DocumentFileServices = {
    selectOpenPath: vi.fn(async () => "/a.md"), selectSavePath: vi.fn(async () => "/saved.md"),
    readText: vi.fn(async path => { if (!files.has(path)) throw Error("missing"); return files.get(path)!; }),
    writeText: vi.fn(async (path, content) => { files.set(path, content); }),
    isWritable: vi.fn(async () => true), recordOpenedPath: vi.fn(),
  };
  const prompt = vi.fn(async () => "cancel" as "save" | "discard" | "cancel");
  const session = new TabSession(services, async path => path.replace("/alias.md", "/a.md"), prompt);
  return { session, services, prompt, files };
}
describe("tab file workflow", () => {
  it("preserves dirty tabs and deduplicates canonical opens", async () => {
    const { session, prompt } = setup(); const first = session.activeId; session.workspace.edit(first, "dirty");
    await session.open("/a.md"); const a = session.activeId;
    await session.open("/b.md"); await session.open("/alias.md");
    expect(session.activeId).toBe(a); expect(session.workspace.ids).toHaveLength(3);
    expect(session.workspace.snapshot(first).content).toBe("dirty"); expect(prompt).not.toHaveBeenCalled();
  });
  it("canceled or failed opens create no tab and leave selection unchanged", async () => {
    const { session, services } = setup(); const id = session.activeId;
    expect((await session.open("/missing.md")).status).toBe("failed");
    vi.mocked(services.selectOpenPath).mockResolvedValue(null);
    expect((await session.open()).status).toBe("canceled");
    expect(session.activeId).toBe(id); expect(session.workspace.ids).toEqual([id]);
  });
  it("saves the originating tab even when selection changes during a dialog", async () => {
    const { session, services, files } = setup(); const a = session.activeId; session.workspace.edit(a, "saved A");
    const b = session.newDocument()!; session.workspace.edit(b, "keep B");
    let resolve!: (path: string) => void;
    vi.mocked(services.selectSavePath).mockImplementation(() => new Promise(r => { resolve = r; }));
    const saving = session.save(a); session.workspace.select(b);
    await vi.waitFor(() => expect(services.selectSavePath).toHaveBeenCalled());
    resolve("/saved.md"); await saving;
    expect(files.get("/saved.md")).toBe("saved A"); expect(session.snapshot.content).toBe("keep B");
    expect(session.workspace.snapshot(a).dirty).toBe(false); expect(session.snapshot.dirty).toBe(true);
  });
  it("refuses Save As collisions before writing", async () => {
    const { session, services, files } = setup(); await session.open("/a.md"); const a = session.activeId;
    await session.open("/b.md"); session.workspace.edit(session.activeId, "B changed");
    vi.mocked(services.selectSavePath).mockResolvedValue("/alias.md");
    expect((await session.save(session.activeId, true)).status).toBe("failed");
    expect(files.get("/a.md")).toBe("A"); expect(services.writeText).not.toHaveBeenCalled();
    expect(session.workspace.snapshot(a).content).toBe("A");
  });
  it("rejects overlapping operations and releases the lock after failure", async () => {
    const { session, services } = setup(); let release!: () => void;
    vi.mocked(services.readText).mockImplementation(async () => { await new Promise<void>(r => { release = r; }); throw Error("read failed"); });
    const opening = session.open("/a.md"); await vi.waitFor(() => expect(release).toBeDefined());
    await expect(session.open("/b.md")).rejects.toThrow("in progress");
    expect(session.newDocument()).toBeNull(); release(); await opening; expect(session.busy).toBe(false);
  });
});
describe("tab close and clear protection", () => {
  it("Cancel preserves a dirty tab and Discard closes only that tab", async () => {
    const { session, prompt } = setup(); const first = session.activeId; session.workspace.edit(first, "dirty");
    const second = session.newDocument()!;
    expect((await session.close(first)).status).toBe("canceled"); expect(session.workspace.ids).toContain(first);
    prompt.mockResolvedValue("discard"); await session.close(first); expect(session.workspace.ids).toEqual([second]);
    await session.close(second); expect(session.workspace.ids).toHaveLength(1); expect(session.snapshot.content).toBe("");
  });
  it("Save then Cancel while closing a window keeps all tabs and completed saves", async () => {
    const { session, prompt, files } = setup(); const first = session.activeId; session.workspace.edit(first, "save me");
    const second = session.newDocument()!; session.workspace.edit(second, "keep me");
    prompt.mockResolvedValueOnce("save").mockResolvedValueOnce("cancel"); const destroy = vi.fn();
    expect((await session.closeWindow(destroy)).status).toBe("canceled"); expect(destroy).not.toHaveBeenCalled();
    expect(session.workspace.ids).toEqual([first, second]); expect(files.get("/saved.md")).toBe("save me");
    expect(session.workspace.snapshot(first).dirty).toBe(false); expect(session.workspace.snapshot(second).dirty).toBe(true);
  });
  it("save failure prevents close; successful discard permits window close", async () => {
    const { session, prompt, services } = setup(); session.workspace.edit(session.activeId, "keep");
    prompt.mockResolvedValue("save"); vi.mocked(services.writeText).mockRejectedValue(Error("write failed"));
    expect((await session.close(session.activeId)).status).toBe("failed"); expect(session.snapshot.content).toBe("keep");
    prompt.mockResolvedValue("discard"); const destroy = vi.fn(); await session.closeWindow(destroy); expect(destroy).toHaveBeenCalledOnce();
  });
  it("Clear affects only its captured tab and releases its path identity", async () => {
    const { session, prompt } = setup(); await session.open("/a.md"); const a = session.activeId;
    session.workspace.edit(a, "dirty A"); await session.open("/b.md"); const b = session.activeId;
    expect((await session.clear(a)).status).toBe("canceled");
    prompt.mockResolvedValue("discard"); await session.clear(a);
    expect(session.activeId).toBe(b); expect(session.workspace.snapshot(a).filePath).toBeNull();
    expect(session.snapshot.content).toBe("B"); await session.open("/a.md"); expect(session.activeId).not.toBe(a);
  });
});

describe("pristine blank tab reuse", () => {
  it("reuses the initial blank identity and view settings only after a successful open", async () => {
    const { session } = setup(); const blank = session.activeId;
    session.workspace.setView(blank, { ...session.workspace.view(blank), preferences: { mode: "input", swapped: true, syncScrolling: false } });
    await session.open("/a.md");
    expect(session.workspace.ids).toEqual([blank]); expect(session.snapshot.content).toBe("A");
    expect(session.workspace.view(blank).preferences.mode).toBe("input");
    await session.open("/b.md"); expect(session.workspace.ids).toHaveLength(2);
  });
  it("removes the active blank when focusing an already-open file", async () => {
    const { session } = setup(); await session.open("/a.md"); const a = session.activeId;
    const blank = session.newDocument()!; await session.open("/alias.md");
    expect(session.workspace.ids).toEqual([a]); expect(session.workspace.ids).not.toContain(blank);
  });
  it("preserves edited untitled and empty file-backed tabs", async () => {
    const { session, services } = setup(); const edited = session.activeId; session.workspace.edit(edited, " ");
    vi.mocked(services.readText).mockResolvedValue(""); await session.open("/a.md"); const file = session.activeId;
    await session.open("/b.md"); expect(session.workspace.ids).toEqual([edited, file, session.activeId]);
  });
  it("reuses the originating blank when focus changes during the file dialog", async () => {
    const { session, services } = setup(); const origin = session.activeId; const other = session.newDocument()!;
    session.workspace.edit(other, "other edits"); session.workspace.select(origin);
    let choose!: (path: string) => void;
    vi.mocked(services.selectOpenPath).mockImplementation(() => new Promise(resolve => { choose = resolve; }));
    const opening = session.open(); session.workspace.select(other); choose("/a.md"); await opening;
    expect(session.activeId).toBe(origin); expect(session.workspace.ids).toEqual([origin, other]);
    expect(session.workspace.snapshot(other).content).toBe("other edits");
  });
});
