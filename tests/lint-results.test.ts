// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createLintResults } from "../src/lint-results";
import { DocumentWorkspace } from "../src/document-workspace";
import { LintClient } from "../src/lint-client";
import { lintSource } from "../src/lint-profile";
vi.mock("../src/scroll-sync", () => ({ measureSourceLines: (_editor: unknown, _source: string, lines: number[]) => new Map(lines.map(line => [line, line * 10])) }));

function fixture(configuration: { getRules?: () => Record<string, boolean>; loadRules?: () => Promise<Record<string, boolean>> } = {}) {
  document.body.innerHTML = '<div class="workspace"><textarea></textarea><div id="preview"></div></div>';
  const editor = document.querySelector("textarea")!;
  const workspace = new DocumentWorkspace(); const id = workspace.create();
  const client = new LintClient(); vi.spyOn(client,"run").mockImplementation(async (source, rules) => lintSource(source, rules));
  const controller = createLintResults({workspace, editor:()=>editor, preview:document.querySelector("#preview")!,
    container:document.querySelector(".workspace")!,canRun:()=>true,capture:()=>{},applyView:()=>{}, ...configuration}, client);
  const edit = (text:string) => { editor.value=text; workspace.edit(workspace.activeId!,text); controller.refresh(); };
  const click = (name:string) => [...document.querySelectorAll("button")].find(node=>node.textContent===name)!.click();
  return {workspace,id,editor,client,controller,edit,click};
}
describe("lint inspection", () => {
  it("navigates issues, preserves preferences and selection when returning, and replaces old issues on clean run", async () => {
    const f=fixture(); f.edit("# Title\n\n[text]()\n");
    const preferences=f.workspace.view(f.id).preferences;
    await f.controller.run();
    const row=[...document.querySelectorAll<HTMLButtonElement>(".lint-issues button")].find(n=>n.textContent?.includes("MD042"))!;
    row.click(); expect(document.activeElement).toBe(f.editor); expect(f.editor.selectionStart).toBeGreaterThan(0);
    const selection=f.editor.selectionStart; f.click("Preview"); f.click("Return to Previous View");
    expect(f.editor.selectionStart).toBe(selection); expect(f.workspace.view(f.id).preferences).toEqual(preferences);
    f.edit("# Title\n\nText.\n"); await f.controller.run();
    expect(document.querySelectorAll(".lint-issues li")).toHaveLength(0);
    expect(document.body.textContent).toContain("No issues found with the QuickMark profile");
  });
  it("marks edits stale and does not render HTML context", async () => {
    const f=fixture(); f.edit("# Title\n\n<script>alert(1)</script>\n"); await f.controller.run();
    expect(document.querySelector(".lint-panel script")).toBeNull();
    f.edit("different"); expect(document.body.textContent).toContain("out of date");
    expect([...document.querySelectorAll<HTMLButtonElement>(".lint-issues button")].every(b=>b.disabled)).toBe(true);
  });
  it("binds async results to the originating tab", async () => {
    const f=fixture(); let resolve!: (value: ReturnType<typeof lintSource>)=>void;
    vi.mocked(f.client.run).mockImplementation(()=>new Promise(done=>{resolve=done;}));
    f.edit("# Title\n\n[x]()\n"); const pending=f.controller.run();
    const second=f.workspace.create(); f.controller.refresh(); resolve(lintSource("# Title\n\n[x]()\n")); await pending;
    expect(f.workspace.view(f.id).lint?.status).toBe("complete"); expect(f.workspace.view(second).lint).toBeUndefined();
  });
  it("batches large result sets and keeps failed runs separate from clean results", async () => {
    const f=fixture();
    const issue={rule:"MD042",message:"Empty link",line:1,column:1,length:1,detail:"",context:"x"};
    vi.mocked(f.client.run).mockResolvedValue(Array.from({length:450},()=>({...issue})));
    await f.controller.run(); expect(document.querySelectorAll(".lint-issues li")).toHaveLength(200);
    f.click("Load more"); expect(document.querySelectorAll(".lint-issues li")).toHaveLength(400);
    vi.mocked(f.client.run).mockRejectedValue(new Error("worker unavailable"));
    await f.controller.run(); expect(document.body.textContent).toContain("worker unavailable");
    expect(document.body.textContent).not.toContain("No issues found");
    f.click("Preview"); expect(document.querySelector<HTMLElement>("#preview")!.hidden).toBe(false);
  });
  it("follows source scrolling without changing the caret and honors disabled sync", async () => {
    const f=fixture(); f.edit("line\n".repeat(100));
    vi.mocked(f.client.run).mockResolvedValue([1,50,100].map(line=>({rule:"MD042",message:"Link",line,column:1,length:1,detail:"",context:"x"})));
    await f.controller.run(); f.editor.setSelectionRange(0,0);
    f.editor.scrollTop=490; f.editor.dispatchEvent(new Event("scroll"));
    await new Promise(resolve=>requestAnimationFrame(resolve));
    expect(f.workspace.view(f.id).lint?.selected).toBe(1); expect(f.editor.selectionStart).toBe(0);
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const view=f.workspace.view(f.id); f.workspace.setView(f.id,{...view,preferences:{...view.preferences,syncScrolling:false}});
    f.editor.scrollTop=990; f.editor.dispatchEvent(new Event("scroll"));
    await new Promise(resolve=>requestAnimationFrame(resolve)); expect(f.workspace.view(f.id).lint?.selected).toBe(1);
  });
});

describe("saved snapshot results", () => {
  it("protects a save job from manual supersession and caches it without opening inspection", async () => {
    const f = fixture(); f.edit("# Title\n");
    let resolve!: (issues: ReturnType<typeof lintSource>) => void;
    vi.mocked(f.client.run).mockImplementation(() => new Promise(done => { resolve = done; }));
    const receipt = { documentId: f.id, operationId: "write", revision: f.workspace.revision(f.id), content: "# Title\n", path: "/a.md", name: "a.md" };
    const pending = f.controller.runForSave(receipt);
    const other = f.workspace.create(); f.controller.refresh(); await f.controller.run();
    expect(f.client.run).toHaveBeenCalledTimes(1);
    resolve([]); expect((await pending).status).toBe("complete");
    expect(f.workspace.view(f.id).lint?.inspecting).toBe(false); expect(f.workspace.view(other).lint).toBeUndefined();
  });
  it("labels an edited-then-reverted saved snapshot stale and disables navigation", async () => {
    const f = fixture(); f.edit("text");
    const receipt = { documentId: f.id, operationId: "write", revision: f.workspace.revision(f.id), content: "text", path: "/a.md", name: "a.md" };
    f.edit("changed"); f.edit("text");
    expect((await f.controller.runForSave(receipt)).status).toBe("stale"); f.controller.showSnapshot(f.id);
    expect(document.body.textContent).toContain("out of date");
    expect([...document.querySelectorAll<HTMLButtonElement>(".lint-issues button")].every(button => button.disabled)).toBe(true);
  });
});


describe("rule configuration lifetime", () => {
  it("invalidates all tabs without automatically running and cannot resurrect late responses", async () => {
    let rules = {};
    const f = fixture({ getRules: () => rules }); f.edit("# Title\n\n[x]()\n"); await f.controller.run();
    const second = f.workspace.create(); f.edit("# Title\n");
    let resolve!: (issues: ReturnType<typeof lintSource>) => void;
    vi.mocked(f.client.run).mockImplementation(() => new Promise(done => { resolve = done; }));
    const pending = f.controller.run(); rules = { MD042: false }; f.controller.refresh();
    expect(f.workspace.view(f.id).lint?.status).toBe("stale");
    expect(f.workspace.view(second).lint?.status).toBe("stale");
    resolve([]); await pending;
    expect(f.workspace.view(second).lint?.status).toBe("stale"); expect(f.client.run).toHaveBeenCalledTimes(2);
  });
  it("loads authoritative choices before a manual run and reports preference failures", async () => {
    let rules = {};
    const loadRules = vi.fn(async () => { rules = { MD042: false }; return rules; });
    const f = fixture({ getRules: () => rules, loadRules }); f.edit("# Title\n\n[x]()\n");
    await f.controller.run(); expect(f.client.run).toHaveBeenCalledWith(f.editor.value, { MD042: false });
    expect(f.workspace.view(f.id).lint?.issues.some(issue => issue.rule === "MD042")).toBe(false);
    loadRules.mockRejectedValue(Error("preferences unreadable")); await f.controller.run();
    expect(f.workspace.view(f.id).lint?.status).toBe("failed"); expect(f.client.run).toHaveBeenCalledTimes(1);
  });
  it("retains a save's captured choices while making its cached results stale after a rule change", async () => {
    let rules = {};
    const f = fixture({ getRules: () => rules }); f.edit("# Title\n");
    let resolve!: (issues: ReturnType<typeof lintSource>) => void;
    vi.mocked(f.client.run).mockImplementation(() => new Promise(done => { resolve = done; }));
    const snapshot = { documentId: f.id, operationId: "save", revision: f.workspace.revision(f.id), content: f.editor.value, path: null, name: "Untitled.md" };
    const pending = f.controller.runForSave(snapshot, {}); rules = { MD042: false }; f.controller.refresh();
    resolve([]); expect((await pending).status).toBe("complete");
    expect(f.workspace.view(f.id).lint?.status).toBe("stale");
    f.controller.showSnapshot(f.id); expect(document.body.textContent).toContain("out of date");
  });
  it("rechecks transferred cache configuration before enabling navigation", async () => {
    const f = fixture(); f.edit("# Title\n\n[x]()\n"); await f.controller.run();
    const transfer = f.workspace.beginTransfer(f.id);
    const destination = fixture({ getRules: () => ({ MD042: false }) });
    destination.workspace.adopt(transfer.state); destination.workspace.select(f.id); destination.controller.refresh();
    expect(destination.workspace.view(f.id).lint?.status).toBe("stale");
    expect([...document.querySelectorAll<HTMLButtonElement>(".lint-issues button")].every(button => button.disabled)).toBe(true);
  });
});
