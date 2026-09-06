import { DocumentLifecycle } from "./document-lifecycle";
import { DocumentWorkspace } from "./document-workspace";
import { openDocument, saveDocument, recheckDocumentWritability, type DocumentFileServices, type OperationOutcome } from "./document-operations";
import { resolveUnsavedChanges, type UnsavedChoice } from "./unsaved-changes";
import { DEFAULT_VIEW_PREFERENCES, type ViewPreferences } from "./view-preferences";

export class TabSession {
  readonly workspace = new DocumentWorkspace();
  readonly outcomes = new Map<string, OperationOutcome>();
  #keys = new Map<string, string>();
  #busy = false;
  constructor(private readonly services: DocumentFileServices,
    private readonly canonicalize: (path: string) => Promise<string>,
    private readonly prompt: (name: string, action: string) => Promise<UnsavedChoice>,
    public defaults: ViewPreferences = DEFAULT_VIEW_PREFERENCES) { this.newDocument(); }
  get busy() { return this.#busy; }
  get activeId() { return this.workspace.activeId!; }
  get snapshot() { return this.workspace.snapshot(this.activeId); }
  newDocument() {
    if (this.#busy) return null;
    return this.workspace.create(this.defaults);
  }
  async #exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.#busy) throw new Error("Another document operation is in progress.");
    this.#busy = true;
    try { return await operation(); } finally { this.#busy = false; }
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
        return { status: "success", message: `Focused ${this.snapshot.displayName}.` };
      }
      const lifecycle = new DocumentLifecycle();
      const outcome = await openDocument(lifecycle, this.services, key);
      if (outcome.status !== "success") return outcome;
      const id = reuseBlank ? originId : crypto.randomUUID();
      if (reuseBlank) {
        await this.workspace.operate(id, async target => { target.importState(lifecycle.exportState()); });
        this.workspace.select(id);
      } else {
        const template = new DocumentWorkspace(); const templateId = template.create(this.defaults);
        this.workspace.adopt({ version: 1, documentId: id, document: lifecycle.exportState(), view: template.view(templateId) });
      }
      this.#keys.set(id, key);
      this.outcomes.set(id, outcome);
      return outcome;
    });
  }
  async #save(id: string, saveAs = false): Promise<OperationOutcome> {
    let nextKey: string | undefined;
    const services: DocumentFileServices = { ...this.services,
      writeText: async (path, content) => {
        const key = await this.canonicalize(path);
        const conflict = [...this.#keys].find(([other, value]) => other !== id && value === key);
        if (conflict) throw new Error("This file is already open in another tab. Save that tab or choose a different path.");
        await this.services.writeText(path, content);
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
      this.workspace.close(id); this.#keys.delete(id); this.outcomes.delete(id);
      if (!this.workspace.ids.length) this.workspace.create(this.defaults);
      return { status: "success", message: "Closed tab." };
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
