export const UNTITLED_DOCUMENT_NAME = "Untitled.md";
export type DocumentViewMode = "both" | "input" | "preview";
export interface DocumentCapabilities {
  readonly editable: boolean;
  readonly canSave: boolean;
  readonly canSaveAs: boolean;
  readonly allowedViews: readonly DocumentViewMode[];
}
const ALL_VIEWS: readonly DocumentViewMode[] = Object.freeze(["both", "input", "preview"]);
function capabilities(canSave: boolean): DocumentCapabilities {
  return Object.freeze({ editable: true, canSave, canSaveAs: true, allowedViews: ALL_VIEWS });
}

export interface DocumentSnapshot {
  readonly content: string;
  readonly displayName: string;
  readonly filePath: string | null;
  readonly lastSavedContent: string;
  readonly dirty: boolean;
  readonly capabilities: DocumentCapabilities;
}

export interface DocumentState {
  readonly version: 1;
  readonly content: string;
  readonly lastSavedContent: string;
  readonly displayName: string;
  readonly filePath: string | null;
  readonly canSave: boolean;
}

export interface SaveRequest {
  readonly kind: "save" | "save-as";
  readonly content: string;
  readonly filePath: string | null;
  readonly suggestedName: string;
  readonly documentGeneration: number;
}

export type OperationResult = { readonly status: "canceled" } | { readonly status: "failed"; readonly error?: unknown };

export type LoadResult =
  | OperationResult
  | {
      readonly status: "success";
      readonly content: string;
      readonly filePath: string;
      readonly displayName?: string;
      readonly writable?: boolean;
    };

export type SaveResult =
  | OperationResult
  | {
      readonly status: "success";
      readonly filePath?: string;
      readonly displayName?: string;
    };

function basename(filePath: string) {
  const segments = filePath.split(/[\\/]/);
  return segments[segments.length - 1] || UNTITLED_DOCUMENT_NAME;
}

function requireFilePath(filePath: string) {
  if (!filePath.trim()) throw new TypeError("A non-empty file path is required");
  return filePath;
}

export class DocumentLifecycle {
  #content = "";
  #displayName = UNTITLED_DOCUMENT_NAME;
  #filePath: string | null = null;
  #lastSavedContent = "";
  #documentGeneration = 0;
  #capabilities = capabilities(true);

  get snapshot(): DocumentSnapshot {
    return Object.freeze({
      content: this.#content,
      displayName: this.#displayName,
      filePath: this.#filePath,
      lastSavedContent: this.#lastSavedContent,
      dirty: this.#content !== this.#lastSavedContent,
      capabilities: this.#capabilities,
    });
  }

  exportState(): DocumentState {
    return { version: 1, content: this.#content, lastSavedContent: this.#lastSavedContent,
      displayName: this.#displayName, filePath: this.#filePath, canSave: this.#capabilities.canSave };
  }

  importState(state: DocumentState) {
    if (state.version !== 1 || typeof state.content !== "string" ||
        typeof state.lastSavedContent !== "string" || typeof state.displayName !== "string" ||
        !state.displayName.trim() || typeof state.canSave !== "boolean" ||
        (state.filePath !== null && (typeof state.filePath !== "string" || !state.filePath.trim()))) {
      throw new TypeError("Invalid document state");
    }
    this.#documentGeneration += 1;
    this.#content = state.content;
    this.#lastSavedContent = state.lastSavedContent;
    this.#displayName = state.displayName;
    this.#filePath = state.filePath;
    this.#capabilities = capabilities(state.canSave);
    return this.snapshot;
  }

  newDocument() {
    this.#documentGeneration += 1;
    this.#content = "";
    this.#displayName = UNTITLED_DOCUMENT_NAME;
    this.#filePath = null;
    this.#lastSavedContent = "";
    this.#capabilities = capabilities(true);
    return this.snapshot;
  }

  loadBundledSample(content: string, displayName = "README.md") {
    this.#documentGeneration += 1;
    this.#content = content;
    this.#displayName = displayName;
    this.#filePath = null;
    this.#lastSavedContent = content;
    this.#capabilities = capabilities(false);
    return this.snapshot;
  }

  edit(content: string) {
    this.#content = content;
    return this.snapshot;
  }

  clear() {
    return this.edit("");
  }

  applyLoadResult(result: LoadResult) {
    if (result.status !== "success") return this.snapshot;
    const filePath = requireFilePath(result.filePath);
    this.#documentGeneration += 1;
    this.#content = result.content;
    this.#displayName = result.displayName || basename(filePath);
    this.#filePath = filePath;
    this.#lastSavedContent = result.content;
    this.#capabilities = capabilities(result.writable !== false);
    return this.snapshot;
  }

  applyFilesystemWritability(writable: boolean) {
    if (this.#filePath) this.#capabilities = capabilities(writable);
    return this.snapshot;
  }

  createSaveRequest(options: { readonly saveAs?: boolean } = {}): SaveRequest {
    const saveAs = options.saveAs === true || this.#filePath === null;
    if (!saveAs && !this.#capabilities.canSave) throw new Error("This document is read-only; use Save As");
    return Object.freeze({
      kind: saveAs ? "save-as" : "save",
      content: this.#content,
      filePath: saveAs ? null : this.#filePath,
      suggestedName: this.#displayName,
      documentGeneration: this.#documentGeneration,
    });
  }

  applySaveResult(request: SaveRequest, result: SaveResult) {
    if (result.status !== "success" || request.documentGeneration !== this.#documentGeneration) {
      return this.snapshot;
    }

    const filePath = result.filePath || request.filePath;
    if (!filePath) throw new TypeError("A successful Save As result must include a file path");
    this.#filePath = requireFilePath(filePath);
    this.#displayName = result.displayName || basename(this.#filePath);
    this.#lastSavedContent = request.content;
    this.#capabilities = capabilities(true);
    return this.snapshot;
  }
}
