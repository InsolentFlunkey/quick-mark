import { DocumentLifecycle } from "./document-lifecycle";
import type { EditorCoordination } from "./editor-coordination";
import { DocumentWorkspace, type WorkspaceTransfer } from "./document-workspace";
import { openDocument, saveDocument, recheckDocumentWritability, type DocumentFileServices, type OperationOutcome } from "./document-operations";
import { resolveUnsavedChanges, type UnsavedChoice } from "./unsaved-changes";
import { DEFAULT_VIEW_PREFERENCES, type ViewPreferences } from "./view-preferences";

export class TabSession {
  readonly workspace = new DocumentWorkspace();
  readonly outcomes = new Map<string, OperationOutcome>();
  #keys = new Map<string, string>();
  #busy = false;
  #initializing = false;
  #transferring = false;
  get canSwitch() { return !this.#initializing && !this.#transferring; }
  setInitializing(value: boolean) { this.#initializing = value; }
  constructor(private readonly services: DocumentFileServices,
    private readonly canonicalize: (path: string) => Promise<string>,
    private readonly prompt: (name: string, action: string) => Promise<UnsavedChoice>,
    public defaults: ViewPreferences = DEFAULT_VIEW_PREFERENCES,
    private readonly coordination?: EditorCoordination) { this.newDocument(); }
  get busy() { return this.#busy || this.#initializing; }
  get activeId() { return this.workspace.activeId!; }
  get snapshot() { return this.workspace.snapshot(this.activeId); }
  newDocument() {
    if (this.busy) return null;
    return this.workspace.create(this.defaults);
  }
  async #exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.busy) throw new Error("Another document operation is in progress.");
    this.#busy = true;
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
      const outcome = await openDocument(lifecycle, this.services, key);
      if (outcome.status !== "success") {
        if (claimed) await this.coordination!.release(id);
        return outcome;
      }
      if (reuseBlank) {
        await this.workspace.operate(id, async target => { target.importState(lifecycle.exportState()); });
        this.workspace.select(id);
      } else {
        const template = new DocumentWorkspace(); const templateId = template.create(this.defaults);
        this.workspace.adopt({ version: 1, documentId: id, document: lifecycle.exportState(), view: template.view(templateId) });
      }
      this.#keys.set(id, key);
      if (claimed) await this.coordination!.adopt(id);
      this.outcomes.set(id, outcome);
      return { ...outcome, documentPath: key };
    });
  }
  async #save(id: string, saveAs = false): Promise<OperationOutcome> {
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
    return resolveUnsavedChanges(action, {
      isDirty: () => this.workspace.snapshot(id).dirty,
      displayName: () => this.workspace.snapshot(id).displayName,
      prompt: this.prompt,
      save: () => this.#save(id),
    });
  }
  clear(id: string) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      const decision = await this.#decision(id, "Clear");
      if (decision.status !== "proceed") return decision;
      // Preserve existing Clear semantics: reset only this tab to a new untitled document.
      await this.coordination?.release(id);
      await this.workspace.operate(id, async lifecycle => { lifecycle.newDocument(); });
      this.#keys.delete(id);
      const outcome = { status: "success" as const, message: "Cleared the document." };
      this.outcomes.set(id, outcome); return outcome;
    });
  }
  close(id: string) {
    return this.#exclusive(async (): Promise<OperationOutcome> => {
      const decision = await this.#decision(id, "Close tab");
      if (decision.status !== "proceed") return decision;
      await this.coordination?.release(id);
      this.workspace.close(id); this.#keys.delete(id); this.outcomes.delete(id);
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
            lease.acknowledge(); this.#keys.delete(id); this.outcomes.delete(id);
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
