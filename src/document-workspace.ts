import { DocumentLifecycle, type DocumentState } from "./document-lifecycle";
import { DEFAULT_VIEW_PREFERENCES, type ViewPreferences } from "./view-preferences";

export interface TabViewState {
  preferences: ViewPreferences;
  selectionStart: number;
  selectionEnd: number;
  selectionDirection: "forward" | "backward" | "none";
  editorScrollTop: number;
  editorScrollLeft: number;
  previewScrollTop: number;
  previewScrollLeft: number;
}
export interface WorkspaceTransfer {
  version: 1;
  documentId: string;
  document: DocumentState;
  view: TabViewState;
}
interface Entry {
  lifecycle: DocumentLifecycle;
  view: TabViewState;
  busy: boolean;
}
function cloneView(view: TabViewState): TabViewState {
  if (![view.selectionStart, view.selectionEnd, view.editorScrollTop, view.editorScrollLeft,
    view.previewScrollTop, view.previewScrollLeft].every(n => Number.isFinite(n) && n >= 0) ||
    !Number.isInteger(view.selectionStart) || !Number.isInteger(view.selectionEnd) ||
    view.selectionEnd < view.selectionStart ||
    !["forward", "backward", "none"].includes(view.selectionDirection) ||
    !["both", "input", "preview"].includes(view.preferences.mode) ||
    typeof view.preferences.swapped !== "boolean" || typeof view.preferences.syncScrolling !== "boolean") {
    throw new TypeError("Invalid tab view state");
  }
  return { ...view, preferences: { ...view.preferences } };
}

/** Window-local state. Native ownership must be claimed before adopting a file-backed tab. */
export class DocumentWorkspace {
  #entries = new Map<string, Entry>();
  #active: string | null = null;
  constructor(private readonly makeId: () => string = () => crypto.randomUUID()) {}
  get ids(): readonly string[] { return [...this.#entries.keys()]; }
  get activeId() { return this.#active; }
  #entry(id: string) {
    const entry = this.#entries.get(id);
    if (!entry) throw new Error("Document is not in this workspace");
    return entry;
  }
  #idle(id: string) {
    const entry = this.#entry(id);
    if (entry.busy) throw new Error("Document has an operation or transfer in progress");
    return entry;
  }
  create(preferences: ViewPreferences = DEFAULT_VIEW_PREFERENCES) {
    const document = new DocumentLifecycle().exportState();
    const id = this.makeId();
    this.adopt({ version: 1, documentId: id, document, view: {
      preferences, selectionStart: 0, selectionEnd: 0, selectionDirection: "none",
      editorScrollTop: 0, editorScrollLeft: 0, previewScrollTop: 0, previewScrollLeft: 0,
    } });
    return id;
  }
  adopt(state: WorkspaceTransfer) {
    if (state.version !== 1 || typeof state.documentId !== "string" || !state.documentId.trim() ||
      this.#entries.has(state.documentId)) throw new Error("Invalid or duplicate document identity");
    const lifecycle = new DocumentLifecycle();
    lifecycle.importState(state.document);
    const view = cloneView(state.view);
    if (view.selectionEnd > state.document.content.length) throw new Error("Selection exceeds document content");
    this.#entries.set(state.documentId, { lifecycle, view, busy: false });
    this.#active = state.documentId;
  }
  select(id: string) { this.#entry(id); this.#active = id; }
  snapshot(id: string) { return this.#entry(id).lifecycle.snapshot; }
  view(id: string) { return cloneView(this.#entry(id).view); }
  #clampSelection(entry: Entry) {
    const length = entry.lifecycle.snapshot.content.length;
    entry.view.selectionStart = Math.min(entry.view.selectionStart, length);
    entry.view.selectionEnd = Math.min(entry.view.selectionEnd, length);
  }
  edit(id: string, content: string) {
    const entry = this.#idle(id);
    const snapshot = entry.lifecycle.edit(content);
    this.#clampSelection(entry);
    return snapshot;
  }
  setView(id: string, view: TabViewState) {
    const entry = this.#idle(id);
    const copy = cloneView(view);
    if (copy.selectionEnd > entry.lifecycle.snapshot.content.length) throw new Error("Selection exceeds document content");
    entry.view = copy;
  }
  close(id: string) {
    this.#idle(id);
    this.#entries.delete(id);
    if (this.#active === id) this.#active = this.ids[0] ?? null;
  }
  /** Caller handles prompts; callback must await all work and must not retain the lifecycle. */
  async operate<T>(id: string, operation: (lifecycle: DocumentLifecycle) => Promise<T>): Promise<T> {
    const entry = this.#idle(id);
    entry.busy = true;
    try { return await operation(entry.lifecycle); }
    finally { this.#clampSelection(entry); entry.busy = false; }
  }
  beginTransfer(id: string) {
    const entry = this.#idle(id);
    const state: WorkspaceTransfer = { version: 1, documentId: id,
      document: entry.lifecycle.exportState(), view: cloneView(entry.view) };
    entry.busy = true;
    let settled = false;
    const finish = (remove: boolean) => {
      if (settled) throw new Error("Transfer already settled");
      settled = true;
      entry.busy = false;
      if (remove) this.close(id);
    };
    return { state, acknowledge: () => finish(true), cancel: () => finish(false) };
  }
}
