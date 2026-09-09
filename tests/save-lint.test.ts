import { describe, expect, it, vi } from "vitest";
import { TabSession } from "../src/tab-session";
import type { DocumentFileServices, SaveSnapshot, SaveLintDecision } from "../src/document-operations";

function setup() {
  const services: DocumentFileServices = {
    selectOpenPath: vi.fn(async () => "/a.md"), selectSavePath: vi.fn(async () => "/saved.md"),
    readText: vi.fn(async () => "# Original\n"), writeText: vi.fn(async () => {}),
    isWritable: vi.fn(async () => true), recordOpenedPath: vi.fn(),
  };
  const lint = { enabled: vi.fn(async () => true), check: vi.fn(async (_snapshot: SaveSnapshot): Promise<SaveLintDecision> => "clean"), completed: vi.fn() };
  const prompt = vi.fn(async () => "save" as const);
  const session = new TabSession(services, async path => path, prompt, undefined, undefined, undefined, undefined, lint);
  session.workspace.edit(session.activeId, "# Saved\n");
  return { session, services, lint, prompt };
}

describe("pre-save lint transactions", () => {
  it("captures the preference at save start and checks the exact write before saving, then confirms", async () => {
    const f = setup(), id = f.session.activeId, other = f.session.newDocument()!;
    f.services.selectSavePath = vi.fn(async () => {
      f.lint.enabled.mockResolvedValue(false); f.session.workspace.select(other); return "/chosen.md";
    });
    f.lint.check.mockImplementation(async snapshot => {
      expect(f.services.writeText).not.toHaveBeenCalled(); expect(f.lint.completed).not.toHaveBeenCalled();
      expect(snapshot).toMatchObject({ documentId: id, path: null, name: "Untitled.md", content: "# Saved\n", revision: 1 });
      expect(f.services.selectSavePath).not.toHaveBeenCalled(); expect(f.services.isWritable).not.toHaveBeenCalled();
      expect(Object.isFrozen(snapshot)).toBe(true); return "clean";
    });
    f.lint.completed.mockImplementation(receipt => { expect(f.services.writeText).toHaveBeenCalledWith(receipt.path, receipt.content); });
    const result = await f.session.save(id, true);
    expect(result.status).toBe("success"); expect(f.lint.completed).toHaveBeenCalledWith(result.receipt);
    expect(result.receipt).toMatchObject({ path: "/chosen.md", name: "chosen.md" });
    expect(f.session.activeId).toBe(other); await f.session.save(id); expect(f.lint.check).toHaveBeenCalledTimes(1);
  });
  it("lints first but never confirms a canceled destination, read-only save or failed write", async () => {
    const f = setup(); f.services.selectSavePath = vi.fn(async () => null);
    expect((await f.session.save(f.session.activeId)).status).toBe("canceled"); expect(f.lint.check).toHaveBeenCalledTimes(1);
    f.services.selectSavePath = vi.fn(async () => "/a.md"); f.services.writeText = vi.fn(async () => { throw Error("disk full"); });
    expect((await f.session.save(f.session.activeId)).status).toBe("failed"); expect(f.lint.check).toHaveBeenCalledTimes(2);
    expect(f.lint.completed).not.toHaveBeenCalled();
    await f.session.open("/a.md"); f.services.isWritable = vi.fn(async () => false);
    expect((await f.session.save(f.session.activeId)).status).toBe("failed"); expect(f.lint.check).toHaveBeenCalledTimes(3);
  });
  it.each(["review", "cancel"] as const)("%s keeps content dirty and does not write", async choice => {
    const f = setup(); f.lint.check.mockResolvedValue(choice);
    expect((await f.session.save(f.session.activeId)).status).toBe("canceled");
    expect(f.services.selectSavePath).not.toHaveBeenCalled(); expect(f.services.isWritable).not.toHaveBeenCalled();
    expect(f.services.writeText).not.toHaveBeenCalled(); expect(f.session.snapshot.dirty).toBe(true);
    expect(f.session.snapshot.content).toBe("# Saved\n"); expect(f.lint.completed).not.toHaveBeenCalled();
  });
  it("repeated Save and Save As reviews never ask for a path; a clean retry asks once", async () => {
    const f = setup(), id = f.session.activeId; f.lint.check.mockResolvedValue("review");
    await f.session.save(id); f.session.workspace.edit(id, "still has issues"); await f.session.save(id, true);
    expect(f.services.selectSavePath).not.toHaveBeenCalled(); expect(f.services.writeText).not.toHaveBeenCalled();
    f.session.workspace.edit(id, "# Fixed\n"); f.lint.check.mockResolvedValue("clean"); await f.session.save(id);
    expect(f.services.selectSavePath).toHaveBeenCalledOnce(); expect(f.services.writeText).toHaveBeenCalledWith("/saved.md", "# Fixed\n");
    expect(f.lint.check).toHaveBeenCalledTimes(3);
  });
  it.each(["close", "clear"] as const)("review stops %s, while Save Anyway writes and continues", async action => {
    const f = setup(), id = f.session.activeId; f.lint.check.mockResolvedValue("review");
    expect((await f.session[action](id)).status).toBe("canceled"); expect(f.session.workspace.snapshot(id).dirty).toBe(true);
    expect(f.services.writeText).not.toHaveBeenCalled(); f.lint.check.mockResolvedValue("save");
    expect((await f.session[action](id)).status).toBe("success"); expect(f.services.writeText).toHaveBeenCalledOnce();
    expect(f.lint.completed).not.toHaveBeenCalled();
    if (action === "clear") expect(f.session.snapshot.content).toBe(""); else expect(f.session.workspace.ids).not.toContain(id);
  });
  it("locks the origin while checking but allows tab selection; no write happens before approval", async () => {
    const f = setup(), id = f.session.activeId, other = f.session.newDocument()!;
    let finish!: (choice: SaveLintDecision) => void;
    f.lint.check.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = f.session.save(id); await vi.waitFor(() => expect(finish).toBeDefined());
    expect(f.session.workspace.snapshot(id).dirty).toBe(true); expect(f.services.writeText).not.toHaveBeenCalled();
    expect(() => f.session.workspace.edit(id, "changed")).toThrow("operation");
    f.session.workspace.select(other); expect(f.session.canSwitch).toBe(true);
    await expect(f.session.close(id)).rejects.toThrow("in progress"); await expect(f.session.clear(id)).rejects.toThrow("in progress");
    await expect(f.session.detach(id)).rejects.toThrow("in progress");
    finish("save"); expect((await pending).status).toBe("success"); expect(f.session.busy).toBe(false);
  });
  it("sequential Close Window stops at Review and preserves earlier writes", async () => {
    const f = setup(), first = f.session.activeId;
    const second = f.session.newDocument()!; f.session.workspace.edit(second, "# Second\n");
    const third = f.session.newDocument()!; f.session.workspace.edit(third, "# Third\n");
    f.services.selectSavePath = vi.fn().mockResolvedValueOnce("/one.md").mockResolvedValueOnce("/two.md");
    f.lint.check.mockResolvedValueOnce("clean").mockResolvedValueOnce("review");
    const destroy = vi.fn(); expect((await f.session.closeWindow(destroy)).status).toBe("canceled");
    expect(destroy).not.toHaveBeenCalled(); expect(f.prompt).toHaveBeenCalledTimes(2);
    expect(f.session.workspace.snapshot(first).dirty).toBe(false); expect(f.session.workspace.snapshot(second).dirty).toBe(true);
    expect(f.session.workspace.snapshot(third).dirty).toBe(true); expect(f.services.writeText).toHaveBeenCalledOnce();
  });
  it("a feedback infrastructure failure cannot accidentally authorize a write", async () => {
    const f = setup(); f.lint.check.mockRejectedValue(Error("dialog unavailable"));
    const outcome = await f.session.save(f.session.activeId);
    expect(outcome.status).toBe("failed"); expect(outcome.message).not.toContain("Save complete");
    expect(f.services.selectSavePath).not.toHaveBeenCalled(); expect(f.services.isWritable).not.toHaveBeenCalled();
    expect(f.services.writeText).not.toHaveBeenCalled(); expect(f.session.snapshot.dirty).toBe(true);
  });
});
