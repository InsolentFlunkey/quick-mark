import { describe, expect, it } from "vitest";
import { TabSession } from "../src/tab-session";
import type { EditorCoordination } from "../src/editor-coordination";
import type { WorkspaceTransfer } from "../src/document-workspace";
import type { UnsavedChoice } from "../src/unsaved-changes";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}
/** Shared ownership-service fixture. Sessions and document operations are production instances;
 * native lock/IPC behavior is independently exercised by coordinator tests in Rust. */
function desktop() {
  const files = new Map([["/a.md", "saved A"], ["/b.md", "saved B"]]);
  const claims = new Map<string, { id: string; window: string; ready: boolean }>();
  const windows = new Map<string, ReturnType<typeof window>>();
  const transfers = new Map<string, { status: "committed" | "canceled"; target: string }>();
  let nextWindow = 0;
  function window(label: string) {
    const controls = {
      readGate: null as Promise<void> | null, readStarted: deferred(),
      adoptionFailure: false, lostAdoptionReply: false, failTransfer: false, savePath: "/saved.md", choices: [] as UnsavedChoice[],
    };
    const services: EditorCoordination = {
      async claim(id, path) {
        if (!claims.has(path)) claims.set(path, { id, window: label, ready: false });
        const claim = claims.get(path)!;
        return { owner: { document_id: claim.id, window_label: claim.window }, ready: claim.ready, key: path };
      },
      async adopt(id) {
        if (controls.adoptionFailure) throw Error("adoption reply failed");
        const claim = [...claims.values()].find(c => c.id === id && c.window === label)!;
        claim.ready = true;
        if (controls.lostAdoptionReply) throw Error("lost reply after adoption commit");
      },
      async release(id) {
        for (const [key, claim] of claims) if (claim.id === id && claim.window === label) claims.delete(key);
      },
      async write(id, path, content) {
        const existing = claims.get(path);
        if (existing && (existing.id !== id || existing.window !== label)) throw Error("Already open in another window");
        for (const [key, claim] of claims) if (claim.id === id && claim.window === label) claims.delete(key);
        claims.set(path, { id, window: label, ready: true }); files.set(path, content);
      },
      async focus(id) {
        const owner = [...claims.values()].find(c => c.id === id)!;
        windows.get(owner.window)!.session.workspace.select(id);
      },
      async detach(snapshot: WorkspaceTransfer, token) {
        const target = `detached-${++nextWindow}`;
        if (controls.failTransfer) { transfers.set(token, { status: "canceled", target }); return { token }; }
        const destination = window(target); destination.session.setInitializing(true);
        destination.session.adoptTransfer(snapshot);
        for (const claim of claims.values()) if (claim.id === snapshot.documentId) claim.window = target;
        transfers.set(token, { status: "committed", target }); destination.session.setInitializing(false);
        return { token };
      },
      async transferStatus(token) { return transfers.get(token)!; },
    };
    const session = new TabSession({
      selectOpenPath: async () => "/a.md", selectSavePath: async () => controls.savePath,
      readText: async path => {
        controls.readStarted.resolve(); await controls.readGate;
        if (!files.has(path)) throw Error("missing file"); return files.get(path)!;
      },
      writeText: async () => { throw Error("Editor bypassed shared ownership"); },
      isWritable: async () => true, recordOpenedPath: () => {},
    }, async path => path, async () => controls.choices.shift() ?? "cancel", undefined, services);
    const result = { session, controls }; windows.set(label, result); return result;
  }
  return { window, windows, files, claims };
}

describe("integrated tab/window workflows", () => {
  it("resolves simultaneous opens to one owner and focuses it on retry", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    const gate = deferred(); a.controls.readGate = gate.promise;
    const opening = a.session.open("/a.md"); await a.controls.readStarted.promise;
    const blank = b.session.activeId;
    expect((await b.session.open("/a.md")).status).toBe("failed");
    expect(b.session.workspace.ids).toEqual([blank]); expect(b.session.snapshot.filePath).toBeNull();
    gate.resolve(); await opening; const owner = a.session.activeId; a.session.newDocument();
    expect((await b.session.open("/a.md")).status).toBe("success");
    expect(a.session.activeId).toBe(owner); expect(d.claims.size).toBe(1);
    expect(b.session.snapshot.filePath).toBeNull();
  });
  it("protects pending reads against Save As from another editor", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    const gate = deferred(); a.controls.readGate = gate.promise;
    const opening = a.session.open("/a.md"); await a.controls.readStarted.promise;
    b.session.workspace.edit(b.session.activeId, "must not overwrite"); b.controls.savePath = "/a.md";
    expect((await b.session.save(b.session.activeId, true)).status).toBe("failed");
    expect(d.files.get("/a.md")).toBe("saved A"); expect(b.session.snapshot.dirty).toBe(true);
    gate.resolve(); await opening; expect(a.session.snapshot.content).toBe("saved A");
  });
  it("simultaneous Save As attempts preserve the losing editor's unsaved content", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    a.session.workspace.edit(a.session.activeId, "A edits"); b.session.workspace.edit(b.session.activeId, "B edits");
    const outcomes = await Promise.all([a.session.save(a.session.activeId, true), b.session.save(b.session.activeId, true)]);
    expect(outcomes.map(o => o.status).sort()).toEqual(["failed", "success"]);
    const loser = outcomes[0].status === "failed" ? a : b;
    expect(loser.session.snapshot.dirty).toBe(true); expect(loser.session.snapshot.filePath).toBeNull();
    expect(d.claims.size).toBe(1);
  });
  it("Save then Cancel during window close keeps every tab and protects the completed save", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    const first = a.session.activeId; a.session.workspace.edit(first, "save first");
    const second = a.session.newDocument()!; a.session.workspace.edit(second, "keep second");
    a.controls.choices.push("save", "cancel"); let destroyed = false;
    expect((await a.session.closeWindow(async () => { destroyed = true; })).status).toBe("canceled");
    expect(destroyed).toBe(false); expect(a.session.workspace.ids).toEqual([first, second]);
    expect(a.session.workspace.snapshot(first).dirty).toBe(false); expect(a.session.snapshot.dirty).toBe(true);
    b.session.workspace.edit(b.session.activeId, "other window");
    expect((await b.session.save(b.session.activeId, true)).status).toBe("failed");
    expect(d.files.get("/saved.md")).toBe("save first");
  });
  it("failed transfer retains the source, then committed transfer routes duplicates and saves to the destination", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    await a.session.open("/a.md"); const id = a.session.activeId; a.session.workspace.edit(id, "edited A");
    a.controls.failTransfer = true;
    expect((await a.session.detach(id)).status).toBe("failed"); expect(a.session.snapshot.content).toBe("edited A");
    expect(d.claims.get("/a.md")!.window).toBe("a");
    a.controls.failTransfer = false; await a.session.detach(id);
    const target = d.windows.get("detached-2")!;
    expect(a.session.snapshot.filePath).toBeNull(); expect(target.session.activeId).toBe(id);
    expect(target.session.snapshot.dirty).toBe(true); expect(target.session.snapshot.lastSavedContent).toBe("saved A");
    target.session.newDocument(); await b.session.open("/a.md"); expect(target.session.activeId).toBe(id);
    await target.session.save(id); expect(d.files.get("/a.md")).toBe("edited A");
    expect(d.claims.get("/a.md")!.window).toBe("detached-2");
  });
  it.each([false, true])("failed adoption preserves existing local tabs (edited origin=%s) and releases its claim", async edited => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    const origin = a.session.activeId;
    if (edited) a.session.workspace.edit(origin, "keep existing edits");
    const before = a.session.snapshot; a.controls.adoptionFailure = true;
    expect((await a.session.open("/a.md")).status).toBe("failed");
    expect(a.session.workspace.ids).toEqual([origin]); expect(a.session.snapshot).toEqual(before);
    expect(d.claims.size).toBe(0);
    expect((await b.session.open("/a.md")).status).toBe("success");
  });
  it("a lost native adoption reply releases committed ownership without replacing the source blank", async () => {
    const d = desktop(); const a = d.window("a"); const b = d.window("b");
    const blank = a.session.activeId; a.controls.lostAdoptionReply = true;
    expect((await a.session.open("/a.md")).status).toBe("failed");
    expect(a.session.workspace.ids).toEqual([blank]); expect(a.session.snapshot.filePath).toBeNull();
    expect(d.claims.size).toBe(0);
    expect((await b.session.open("/a.md")).status).toBe("success");
  });

});
