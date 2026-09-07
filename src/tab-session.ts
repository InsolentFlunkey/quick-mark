import { DocumentLifecycle } from "./document-lifecycle";
import type { EditorCoordination, DiskStatus, DiskRead, ExternalPrompt } from "./editor-coordination";
import { DocumentWorkspace, type WorkspaceTransfer } from "./document-workspace";
import { openDocument, saveDocument, recheckDocumentWritability, type DocumentFileServices, type OperationOutcome } from "./document-operations";
import { resolveUnsavedChanges, type UnsavedChoice } from "./unsaved-changes";
import { DEFAULT_VIEW_PREFERENCES, type ViewPreferences } from "./view-preferences";

export class TabSession {
  readonly workspace = new DocumentWorkspace();
  readonly outcomes = new Map<string, OperationOutcome>();
  #keys = new Map<string, string>();
  readonly external = new Map<string, DiskStatus>();
  #busy = false;
  #epoch = 0;
  #initializing = false;
  #transferring = false;
  get canSwitch() { return !this.#initializing && !this.#transferring; }
  setInitializing(value: boolean) { this.#initializing = value; }
  constructor(private readonly services: DocumentFileServices,
    private readonly canonicalize: (path: string) => Promise<string>,
    private readonly prompt: (name: string, action: string) => Promise<UnsavedChoice>,
    public defaults: ViewPreferences = DEFAULT_VIEW_PREFERENCES,
    private readonly coordination?: EditorCoordination,
    private readonly externalPrompt: ExternalPrompt = async () => "cancel",
    private readonly recordSaved: (path: string) => Promise<void> = async () => {}) { this.newDocument(); }
  get busy() { return this.#busy || this.#initializing; }
  get activeId() { return this.workspace.activeId!; }
  get snapshot() { return this.workspace.snapshot(this.activeId); }
  newDocument() {
    if (this.busy) return null;
    return this.workspace.create(this.defaults);
  }
  async #exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.busy) throw new Error("Another document operation is in progress.");
    this.#busy = true; this.#epoch++;
    try { return await operation(); } finally { this.#busy = false; this.#transferring = false; }
  }
  async open(path?: string): Promise<OperationOutcome> {
    const originId = this.activeId;
    return this.#exclusive(async () => {
      const origin = this.workspace.snapshot(originId);
      const reuseBlank = origin.filePath === null && origin.content === "" &&
        origin.lastSavedContent === "" && !origin.dirty;
      const chosen = path ?? await this.services.selectOpenPath();
      if (!chosen) return { status: "canceled", message: "Open canceled." };
      const key = await this.canonicalize(chosen);
      const existing = [...this.#keys].find(([, value]) => value === key)?.[0];
      if (existing) {
        if (reuseBlank && originId !== existing) {
          this.workspace.close(originId);
          this.outcomes.delete(originId);
        }
        this.workspace.select(existing);
        return { status: "success", message: `Focused ${this.snapshot.displayName}.`, documentPath: key };
      }
      const id = reuseBlank ? originId : crypto.randomUUID();
      let claimed = false;
      if (this.coordination) {
        const claim = await this.coordination.claim(id, key);
        if (claim.owner.document_id !== id) {
          if (!claim.ready) return { status: "failed", message: "This file is still opening in another window. Try again shortly." };
          await this.coordination.focus(claim.owner.document_id);
          return { status: "success", message: "Focused the document in its existing window.", documentPath: key };
        }
        claimed = true;
      }
      const lifecycle = new DocumentLifecycle();
      let loaded: DiskRead | undefined;
      const openServices = this.coordination?.disk ? { ...this.services,
        readText: async () => { loaded = await this.coordination!.disk!<DiskRead>(id, "read"); return loaded.content; },
        isWritable: async () => loaded!.writable,
      } : this.services;
      const outcome = await openDocument(lifecycle, openServices, key);
      if (outcome.status !== "success") {
        if (claimed) await this.coordination!.release(id);
        return outcome;
      }
      if (claimed) {
        try { await this.coordination!.adopt(id); }
        catch (error) {
          // The acknowledgement may have been lost after the native commit. Release
          // the claim in either case before leaving the originating workspace intact.
          await this.coordination!.release(id);
          return { status: "failed", message: `Could not adopt the opened document: ${String(error)}` };
        }
      }
      // Publish only after native adoption succeeds. No file/dialog work remains.
      if (reuseBlank) {
        await this.workspace.operate(id, async target => { target.importState(lifecycle.exportState()); });
        this.workspace.select(id);
      } else {
        const template = new DocumentWorkspace(); const templateId = template.create(this.defaults);
        this.workspace.adopt({ version: 1, documentId: id, document: lifecycle.exportState(), view: template.view(templateId) });
      }
      this.#keys.set(id, key);
      this.outcomes.set(id, outcome);
      return { ...outcome, documentPath: key };
    });
  }
  async #inspect(id: string) {
    if (!this.coordination?.disk || !this.workspace.snapshot(id).filePath) return;
    const before = this.workspace.snapshot(id);
    const epoch = this.#epoch;
    let status: DiskStatus;
    try { status = await this.coordination.disk<DiskStatus>(id, "inspect", { expectedContent: before.lastSavedContent }); }
    catch (error) { status = { status: "unreadable", writable: false, message: String(error) }; }
    if (epoch !== this.#epoch || !this.workspace.ids.includes(id)) return;
    const after = this.workspace.snapshot(id);
    if (after.filePath !== before.filePath || after.lastSavedContent !== before.lastSavedContent) return;
    this.external.set(id, status);
    return status;
  }
  async inspect(id: string) {
    if (this.busy) return;
    const epoch = this.#epoch;
    const status = await this.#inspect(id);
    if (status && !this.busy && epoch === this.#epoch && this.workspace.ids.includes(id)) {
      await this.workspace.operate(id, async lifecycle => { lifecycle.applyFilesystemWritability(status.writable); });
    }
  }
  needsRecovery(id: string) { const status = this.external.get(id); return !!status && status.status !== "unchanged"; }
  async #managedSave(id: string, saveAs: boolean): Promise<OperationOutcome> {
    const before = this.workspace.snapshot(id);
    try {
      let path = before.filePath;
      let token: number | undefined;
      if (!saveAs && path) {
        const status = await this.#inspect(id);
        if (status?.status === "missing" || status?.status === "unreadable") {
          return { status: "failed", message: "The original file is unavailable. Use Save As or Retry; your content is preserved." };
        }
        if (status?.status === "changed") {
          const choice = await this.externalPrompt(before.displayName, "overwrite", "The disk file changed. Overwrite replaces that disk version with your editor content.");
          if (choice === "save-as") saveAs = true;
          else if (choice === "overwrite") token = status.token;
          else return { status: "canceled", message: "Save canceled." };
        }
      }
      if (saveAs || !path) {
        for (;;) {
          path = await this.services.selectSavePath(before.displayName);
          if (!path) return { status: "canceled", message: "Save canceled." };
          const key = await this.canonicalize(path);
          if ([...this.#keys].some(([other,value]) => other !== id && value === key)) throw new Error("This file is already open in another tab.");
          const status = await this.coordination!.disk!<DiskStatus>(id, "prepare", { path });
          if (status.status !== "missing") {
            const choice = await this.externalPrompt(path, "overwrite", "Save As will replace this existing disk file with your editor content.");
            if (choice === "save-as") continue;
            if (choice !== "overwrite") return { status: "canceled", message: "Save As canceled." };
          }
          token = status.token;
          saveAs = true;
          break;
        }
      }
      const nextKey = await this.canonicalize(path);
      await this.workspace.operate(id, async lifecycle => {
        // A missing/read-only original does not prohibit saving a recovery copy.
        const request = lifecycle.createSaveRequest({ saveAs: true });
        await this.coordination!.write(id, path!, request.content, saveAs, { token, expectedContent: before.lastSavedContent });
        lifecycle.applySaveResult(request, { status: "success", filePath: nextKey });
      });
      this.#keys.set(id, nextKey); this.external.delete(id);
      try { await this.recordSaved(nextKey); }
      catch (error) { return { status: "failed", message: `The document was saved, but Recent Files could not be updated: ${String(error)}` }; }
      return { status: "success", message: `Saved ${this.workspace.snapshot(id).displayName}.`, documentPath: nextKey };
    } catch (error) {
      await this.#inspect(id);
      return { status: "failed", message: `Could not save: ${String(error)}` };
    }
  }
  reload(id: string) { return this.#exclusive(async (): Promise<OperationOutcome> => {
    try {
      const status = await this.#inspect(id);
      if (!status || status.token === undefined || status.status === "missing" || status.status === "unreadable") {
        return { status: "failed", message: "The disk file cannot be reloaded. Your editor content is preserved." };
      }
      const before = this.workspace.snapshot(id);
      if (before.dirty || this.needsRecovery(id)) {
        if (await this.externalPrompt(before.displayName, "reload", "Reload replaces your current editor content with the disk version. This cannot be undone.") !== "reload") {
          return { status: "canceled", message: "Reload canceled." };
        }
      }
      await this.workspace.operate(id, async lifecycle => {
        const loaded = await this.coordination!.disk!<DiskRead>(id, "reload", { token: status.token });
        lifecycle.applyLoadResult({ status: "success", content: loaded.content, filePath: before.filePath!, writable: loaded.writable });
      });
      this.external.delete(id);
      const view = this.workspace.view(id), length = this.workspace.snapshot(id).content.length;
      this.workspace.setView(id, { ...view, selectionStart: Math.min(view.selectionStart,length), selectionEnd: Math.min(view.selectionEnd,length) });
      return { status: "success", message: `Reloaded ${before.displayName}.` };
    } catch (error) { await this.#inspect(id); return { status: "failed", message: `Could not reload: ${String(error)}` }; }
  }); }
  async #save(id: string, saveAs = false): Promise<OperationOutcome> {
    if (this.coordination?.disk) {
      const outcome = await this.#managedSave(id, saveAs); this.outcomes.set(id,outcome); return outcome;
    }
    let nextKey: string | undefined;
    const services: DocumentFileServices = { ...this.services,
      writeText: async (path, content) => {
        const key = await this.canonicalize(path);
        const conflict = [...this.#keys].find(([other, value]) => other !== id && value === key);
        if (conflict) throw new Error("This file is already open in another tab. Save that tab or choose a different path.");
        if (this.coordination) await this.coordination.write(id, path, content, saveAs);
        else await this.services.writeText(path, content);
        nextKey = key;
      },
    };
    const outcome = await this.workspace.operate(id, lifecycle => saveDocument(lifecycle, services, { saveAs }));
    if (outcome.status === "success" && nextKey) this.#keys.set(id, nextKey);
    this.outcomes.set(id, outcome);
    return outcome;
  }
  save(id: string, saveAs = false) { return this.#exclusive(() => this.#save(id, saveAs)); }
  recheck(id: string) {
    return this.#exclusive(async () => {
      const outcome = await this.workspace.operate(id, lifecycle => recheckDocumentWritability(lifecycle, this.services));
      this.outcomes.set(id, outcome); return outcome;
    });
  }
  async #decision(id: string, action: string) {
    await this.#inspect(id);
    return resolveUnsavedChanges(action, {
      isDirty: () => this.workspace.snapshot(id).dirty || this.needsRecovery(id),
      displayName: () => this.workspace.snapshot(id).displayName,
      prompt: this.prompt,
      save: () => this.#save(id, this.external.get(id)?.writable === false),
    });
  }
  clear(id: string) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      const decision = await this.#decision(id, "Clear");
      if (decision.status !== "proceed") return decision;
      // Preserve existing Clear semantics: reset only this tab to a new untitled document.
      await this.coordination?.release(id);
      await this.workspace.operate(id, async lifecycle => { lifecycle.newDocument(); });
      this.#keys.delete(id); this.external.delete(id);
      const outcome = { status: "success" as const, message: "Cleared the document." };
      this.outcomes.set(id, outcome); return outcome;
    });
  }
  close(id: string) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      const decision = await this.#decision(id, "Close tab");
      if (decision.status !== "proceed") return decision;
      await this.coordination?.release(id);
      this.workspace.close(id); this.#keys.delete(id); this.external.delete(id); this.outcomes.delete(id);
      if (!this.workspace.ids.length) this.workspace.create(this.defaults);
      return { status: "success", message: "Closed tab." };
    });
  }
  /** Adopt while bootstrap keeps the whole editor locked until native acknowledgement. */
  adoptTransfer(state: WorkspaceTransfer, canonicalKey = state.document?.filePath) {
    const previous = this.workspace.ids;
    this.workspace.adopt(state);
    for (const id of previous) this.workspace.close(id);
    if (canonicalKey) this.#keys.set(state.documentId, canonicalKey);
  }
  detach(id: string, wait: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 100)),
    report: (message: string) => void = () => {}) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      if (!this.coordination) throw new Error("Native window coordination is unavailable");
      const lease = this.workspace.beginTransfer(id);
      this.#transferring = true;
      const token = crypto.randomUUID();
      let creationFailed = false;
      try { await this.coordination.detach(lease.state, token); }
      catch { creationFailed = true; }
      let attempts = 0;
      for (;;) {
        try {
          const result = await this.coordination.transferStatus(token, creationFailed || attempts >= 150);
          if (result.status === "committed") {
            lease.acknowledge(); this.#keys.delete(id); this.external.delete(id); this.outcomes.delete(id);
            if (!this.workspace.ids.length) this.workspace.create(this.defaults);
            return { status: "success", message: "Moved tab to a new window." };
          }
          if (result.status === "canceled") {
            lease.cancel();
            return { status: "failed", message: "Could not move the tab. The original document has been preserved." };
          }
        } catch (error) {
          report(`Waiting to confirm document ownership: ${String(error)}`);
        }
        attempts++;
        await wait();
      }
    });
  }
  /** No tabs are removed until the window really closes; Cancel preserves all tabs. */
  closeWindow(destroy: () => Promise<void>) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      for (const id of this.workspace.ids) {
        const decision = await this.#decision(id, "Close window");
        if (decision.status !== "proceed") return decision;
      }
      await destroy();
      return { status: "success", message: "Closed window." };
    });
  }
}
