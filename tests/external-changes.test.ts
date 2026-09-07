import { describe, expect, it, vi } from "vitest";
import { TabSession } from "../src/tab-session";
import type { EditorCoordination, ExternalPrompt, DiskStatus } from "../src/editor-coordination";
import type { DocumentFileServices } from "../src/document-operations";
import type { UnsavedChoice } from "../src/unsaved-changes";

// Multiple real sessions use a shared disk/ownership fixture; native tests verify
// actual filesystem revisions and the production caller-bound coordinator.
function setup() {
  const files = new Map([["/a.md", "saved"], ["/b.md", "other"]]);
  const owners = new Map<string,string>(), paths = new Map<string,string>(), baselines = new Map<string,string>();
  const approvals = new Map<number,{ path:string; text:string|undefined }>(); let next=0;
  const services: DocumentFileServices = {
    selectOpenPath: vi.fn(async()=>"/a.md"), selectSavePath: vi.fn(async()=>"/copy.md"),
    readText: vi.fn(async path=>files.get(path)!), writeText: vi.fn(), isWritable: vi.fn(async()=>true), recordOpenedPath: vi.fn(),
  };
  const coord: EditorCoordination = {
    claim: async(id,path)=> { const old=owners.get(path); if (!old) { owners.set(path,id); paths.set(id,path); }
      return { owner:{document_id:old??id,window_label:"main"},key:path,ready:!!old }; },
    adopt: vi.fn(), release: async id=> { owners.delete(paths.get(id)!); paths.delete(id); baselines.delete(id); },
    focus: vi.fn(), detach: vi.fn(), transferStatus: vi.fn(),
    disk: vi.fn(async (id,operation,options) => {
      const path=options?.path??paths.get(id)!; const content=files.get(path);
      if (operation==="read" || operation==="reload") {
        if (content===undefined) throw Error("missing");
        if (operation==="reload" && approvals.get(options?.token??-1)?.text!==content) throw Error("changed again");
        baselines.set(id,content); return {content,writable:true};
      }
      if (operation==="prepare" && owners.has(path) && owners.get(path)!==id) throw Error("owned by another window");
      const token=++next; approvals.set(token,{path,text:content});
      return {status:content===undefined?"missing":baselines.get(id)===content && (options?.expectedContent===undefined || options.expectedContent===content)?"unchanged":"changed",token,writable:content!==undefined};
    }) as EditorCoordination["disk"],
    write: vi.fn(async (id,path,content,_saveAs,approval)=> {
      if (owners.has(path) && owners.get(path)!==id) throw Error("owned");
      const token=approval?.token;
      if (token!==undefined) {
        const expected=approvals.get(token); if (expected?.path!==path || expected.text!==files.get(path)) throw Error("changed again");
      } else if (baselines.get(id)!==files.get(path) || approval?.expectedContent!==baselines.get(id)) throw Error("conflict");
      files.set(path,content); baselines.set(id,content); owners.delete(paths.get(id)!); owners.set(path,id); paths.set(id,path);
    }),
  };
  const prompt=vi.fn(async ():Promise<UnsavedChoice>=>"cancel");
  const external=vi.fn<ExternalPrompt>(async()=>"cancel");
  const recorded=vi.fn(async (_path: string)=>{});
  const make=()=>new TabSession(services,async path=>path,prompt,undefined,coord,external,recorded);
  return {session:make(),make,files,services,coord,prompt,external,recorded};
}

describe("external disk changes in tab sessions",()=> {
  it("keeps clean and dirty editor content, cancels reload, then explicitly reloads",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    f.files.set("/a.md","disk version"); await f.session.inspect(id);
    expect(f.session.needsRecovery(id)).toBe(true); expect(f.session.snapshot.content).toBe("saved");
    f.session.workspace.edit(id,"my edits");
    expect((await f.session.reload(id)).status).toBe("canceled"); expect(f.session.snapshot.content).toBe("my edits");
    f.external.mockResolvedValue("reload"); expect((await f.session.reload(id)).status).toBe("success");
    expect(f.session.snapshot.content).toBe("disk version"); expect(f.session.snapshot.dirty).toBe(false);
    expect(f.session.needsRecovery(id)).toBe(false);
  });
  it("requires overwrite approval and rejects a change made during that prompt",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    f.session.workspace.edit(id,"mine"); f.files.set("/a.md","external");
    expect((await f.session.save(id)).status).toBe("canceled"); expect(f.files.get("/a.md")).toBe("external");
    f.external.mockImplementation(async()=>{f.files.set("/a.md","newer");return "overwrite";});
    expect((await f.session.save(id)).status).toBe("failed"); expect(f.files.get("/a.md")).toBe("newer"); expect(f.session.snapshot.dirty).toBe(true);
    f.external.mockResolvedValue("overwrite"); expect((await f.session.save(id)).status).toBe("success");
    expect(f.files.get("/a.md")).toBe("mine"); expect(f.session.needsRecovery(id)).toBe(false);
  });
  it("protects clean recovery content on Close Tab, Close Window and Clear after deletion",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId; f.files.delete("/a.md");
    expect(f.session.snapshot.dirty).toBe(false);
    expect((await f.session.close(id)).status).toBe("canceled");
    const destroy=vi.fn(); expect((await f.session.closeWindow(destroy)).status).toBe("canceled"); expect(destroy).not.toHaveBeenCalled();
    expect((await f.session.clear(id)).status).toBe("canceled"); expect(f.session.snapshot.content).toBe("saved");
    expect((await f.session.save(id)).status).toBe("failed"); expect(f.files.has("/a.md")).toBe(false);
    expect((await f.session.save(id,true)).status).toBe("success"); expect(f.files.get("/copy.md")).toBe("saved");
    expect(f.session.snapshot.filePath).toBe("/copy.md"); expect(f.session.needsRecovery(id)).toBe(false);
  });
  it("retains old path and both contents after canceled or colliding Save As",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    const other=f.make(); await other.open("/b.md");
    f.files.set("/a.md","external"); f.session.workspace.edit(id,"mine");
    vi.mocked(f.services.selectSavePath).mockResolvedValue(null);
    expect((await f.session.save(id,true)).status).toBe("canceled");
    vi.mocked(f.services.selectSavePath).mockResolvedValue("/b.md");
    expect((await f.session.save(id,true)).status).toBe("failed");
    expect(f.session.snapshot.filePath).toBe("/a.md"); expect(f.session.snapshot.content).toBe("mine"); expect(f.files.get("/b.md")).toBe("other");
  });
  it("binds a conflict choice to its originating tab while switching tabs",async()=> {
    const f=setup(); await f.session.open("/a.md"); const a=f.session.activeId;
    await f.session.open("/b.md"); const b=f.session.activeId;
    f.session.workspace.edit(a,"mine"); f.files.set("/a.md","external");
    f.external.mockImplementation(async()=>{ f.session.workspace.select(b); return "overwrite"; });
    expect((await f.session.save(a)).status).toBe("success"); expect(f.session.activeId).toBe(b);
    expect(f.session.snapshot.content).toBe("other"); expect(f.files.get("/a.md")).toBe("mine");
  });
  it("does not apply a stale background inspection after Save As",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    const original=f.coord.disk!; let resolve!: (status:DiskStatus)=>void;
    f.coord.disk=vi.fn().mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockImplementation(original);
    const checking=f.session.inspect(id);
    expect(f.session.busy).toBe(false);
    expect((await f.session.save(id,true)).status).toBe("success");
    resolve({status:"missing",writable:false}); await checking;
    expect(f.session.needsRecovery(id)).toBe(false); expect(f.session.snapshot.capabilities.canSave).toBe(true);
  });
  it("rediscovers an unresolved conflict in the destination after transfer adoption",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    f.session.workspace.edit(id,"mine"); f.files.set("/a.md","external");
    const lease=f.session.workspace.beginTransfer(id);
    const target=f.make(); target.adoptTransfer(lease.state); lease.acknowledge();
    await target.inspect(id); expect(target.needsRecovery(id)).toBe(true); expect(target.snapshot.content).toBe("mine");
    expect((await target.save(id)).status).toBe("canceled"); expect(f.files.get("/a.md")).toBe("external");
  });
  it("does not create a misleading tab on an owner-bound read failure",async()=> {
    const f=setup(); const id=f.session.activeId;
    expect((await f.session.open("/missing.md")).status).toBe("failed");
    expect(f.session.workspace.ids).toEqual([id]); expect(f.session.snapshot.content).toBe("");
  });
  it("saves a missing clean recovery copy and records it before closing",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    f.files.delete("/a.md"); f.prompt.mockResolvedValue("save");
    const destroy=vi.fn(async()=>{ expect(f.recorded).toHaveBeenCalledWith("/copy.md"); });
    expect((await f.session.closeWindow(destroy)).status).toBe("success");
    expect(destroy).toHaveBeenCalledOnce(); expect(f.files.get("/copy.md")).toBe("saved");
    expect(f.session.workspace.snapshot(id).filePath).toBe("/copy.md");
  });
  it("returns to the chooser when Save As is selected in an overwrite prompt",async()=> {
    const f=setup(); await f.session.open("/a.md"); const id=f.session.activeId;
    vi.mocked(f.services.selectSavePath).mockResolvedValueOnce("/existing.md").mockResolvedValueOnce("/copy.md");
    f.files.set("/existing.md","keep this"); f.external.mockResolvedValue("save-as");
    expect((await f.session.save(id,true)).status).toBe("success");
    expect(f.files.get("/existing.md")).toBe("keep this"); expect(f.files.get("/copy.md")).toBe("saved");
  });

});
