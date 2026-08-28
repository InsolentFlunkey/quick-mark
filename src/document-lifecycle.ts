export const UNTITLED_DOCUMENT_NAME = "Untitled.md";

export interface DocumentSnapshot {
  readonly content: string;
  readonly displayName: string;
  readonly filePath: string | null;
  readonly lastSavedContent: string;
  readonly dirty: boolean;
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

  get snapshot(): DocumentSnapshot {
    return Object.freeze({
      content: this.#content,
      displayName: this.#displayName,
      filePath: this.#filePath,
      lastSavedContent: this.#lastSavedContent,
      dirty: this.#content !== this.#lastSavedContent,
    });
  }

  newDocument() {
    this.#documentGeneration += 1;
    this.#content = "";
    this.#displayName = UNTITLED_DOCUMENT_NAME;
    this.#filePath = null;
    this.#lastSavedContent = "";
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
    return this.snapshot;
  }

  createSaveRequest(options: { readonly saveAs?: boolean } = {}): SaveRequest {
    const saveAs = options.saveAs === true || this.#filePath === null;
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
    return this.snapshot;
  }
}
