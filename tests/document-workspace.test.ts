import { describe, expect, it } from "vitest";
import { DocumentLifecycle } from "../src/document-lifecycle";
import { DocumentWorkspace } from "../src/document-workspace";

describe("document transfer state", () => {
  it("preserves dirty baseline and read-only capabilities and rejects pre-import saves", () => {
    const source = new DocumentLifecycle();
    source.applyLoadResult({ status: "success", content: "saved", filePath: "/one.md", writable: false });
    source.edit("unsaved");
    const target = new DocumentLifecycle(); const stale = target.createSaveRequest();
    target.importState(JSON.parse(JSON.stringify(source.exportState())));
    target.applySaveResult(stale, { status: "success", filePath: "/wrong.md" });
    expect(target.snapshot).toEqual(source.snapshot);
    expect(target.snapshot.dirty).toBe(true); expect(target.snapshot.capabilities.canSave).toBe(false);
    expect(() => target.importState({ ...source.exportState(), version: 2 } as never)).toThrow();
    expect(target.snapshot).toEqual(source.snapshot);
  });
});
describe("document workspace", () => {
  function workspace() { let id = 0; return new DocumentWorkspace(() => `doc-${++id}`); }
  it("isolates tab content and view state and round trips a stable identity", () => {
    const source = workspace(); const first = source.create(); source.edit(first, "first document");
    source.setView(first, { ...source.view(first), selectionStart: 1, selectionEnd: 5,
      selectionDirection: "backward", editorScrollTop: 45, previewScrollLeft: 8,
      preferences: { mode: "input", swapped: true, syncScrolling: false } });
    const second = source.create(); source.edit(second, "second"); source.select(first);
    expect(source.snapshot(first).content).toBe("first document");
    expect(source.view(second).preferences.mode).toBe("both");
    const view = source.view(first); view.preferences.mode = "preview";
    expect(source.view(first).preferences.mode).toBe("input");
    const lease = source.beginTransfer(first); const target = workspace();
    target.adopt(JSON.parse(JSON.stringify(lease.state)));
    expect(target.snapshot(first)).toEqual(source.snapshot(first));
    expect(target.view(first)).toEqual(source.view(first));
    expect(source.ids).toContain(first);
    lease.acknowledge(); expect(source.ids).toEqual([second]);
    expect(target.activeId).toBe(first); expect(() => lease.cancel()).toThrow();
  });
  it("keeps async operations on the originating document despite active-tab changes", async () => {
    const source = workspace(); const first = source.create(); const second = source.create();
    let resume!: () => void; const pending = new Promise<void>(r => { resume = r; });
    const result = source.operate(first, async lifecycle => {
      const request = lifecycle.createSaveRequest(); await pending;
      lifecycle.applySaveResult(request, { status: "success", filePath: "/first.md" });
    });
    source.select(second);
    source.setView(first, { ...source.view(first), editorScrollTop: 33 });
    expect(source.view(first).editorScrollTop).toBe(33);
    expect(() => source.close(first)).toThrow(); expect(() => source.beginTransfer(first)).toThrow();
    expect(() => source.edit(first, "blocked")).toThrow();
    resume(); await result;
    expect(source.snapshot(first).filePath).toBe("/first.md");
    expect(source.snapshot(second).filePath).toBeNull();
    source.close(first);
    await expect(source.operate(first, async () => undefined)).rejects.toThrow();
  });
  it("releases busy state on operation failure and rolls back a canceled transfer", async () => {
    const source = workspace(); const id = source.create(); source.edit(id, "keep");
    await expect(source.operate(id, async () => { throw new Error("failure"); })).rejects.toThrow("failure");
    const transfer = source.beginTransfer(id);
    expect(() => source.setView(id, source.view(id))).toThrow();
    expect(() => source.edit(id, "lost")).toThrow(); expect(() => source.close(id)).toThrow();
    transfer.cancel(); source.edit(id, "kept"); expect(source.snapshot(id).content).toBe("kept");
  });
  it("rejects invalid or duplicate adoption without changing the active document", () => {
    const source = workspace(); const id = source.create(); const transfer = source.beginTransfer(id);
    expect(() => source.adopt(transfer.state)).toThrow();
    const target = workspace(); const existing = target.create();
    expect(() => target.adopt({ ...transfer.state, documentId: "another", view: { ...transfer.state.view, selectionEnd: Infinity } })).toThrow();
    expect(target.ids).toEqual([existing]); transfer.cancel();
  });
  it("clamps selection when content shrinks and preserves independent preference defaults", () => {
    const source = workspace(); const id = source.create(); source.edit(id, "abc");
    source.setView(id, { ...source.view(id), selectionStart: 2, selectionEnd: 3 });
    source.edit(id, "a"); const lease = source.beginTransfer(id);
    expect(lease.state.view.selectionEnd).toBe(1); lease.cancel();
  });
});
