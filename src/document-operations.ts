import type { DocumentLifecycle } from "./document-lifecycle";

export interface DocumentFileServices {
  selectOpenPath(): Promise<string | null>;
  selectSavePath(suggestedName: string): Promise<string | null>;
  recordOpenedPath(path: string): void;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
  isWritable(path: string): Promise<boolean>;
}

export interface OperationOutcome {
  readonly status: "success" | "canceled" | "failed";
  readonly message: string;
  readonly requiresAttention?: boolean;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function filename(path: string) {
  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

export async function openDocument(
  lifecycle: DocumentLifecycle,
  services: DocumentFileServices,
  requestedPath?: string,
): Promise<OperationOutcome> {
  let path = requestedPath;
  try {
    path ??= (await services.selectOpenPath()) ?? undefined;
    if (!path) return { status: "canceled", message: "Open canceled." };
    const content = await services.readText(path);
    const writable = await services.isWritable(path);
    const snapshot = lifecycle.applyLoadResult({ status: "success", content, filePath: path, writable });
    services.recordOpenedPath(path);
    return { status: "success", message: `Opened ${snapshot.displayName}.` };
  } catch (error) {
    lifecycle.applyLoadResult({ status: "failed", error });
    return {
      status: "failed",
      message: `Could not open ${path ? filename(path) : "the document"}: ${errorMessage(error)}`,
    };
  }
}

export async function saveDocument(
  lifecycle: DocumentLifecycle,
  services: DocumentFileServices,
  options: { readonly saveAs?: boolean } = {},
): Promise<OperationOutcome> {
  let request;
  try {
    if (!options.saveAs && lifecycle.snapshot.filePath) {
      if (lifecycle.snapshot.capabilities.canSave) request = lifecycle.createSaveRequest(options);
      const writable = await services.isWritable(lifecycle.snapshot.filePath);
      lifecycle.applyFilesystemWritability(writable);
      if (!writable) {
        return { status: "failed", message: `${lifecycle.snapshot.displayName} is read-only. Use Save As.` };
      }
    }
    request ??= lifecycle.createSaveRequest(options);
  } catch (error) {
    return { status: "failed", message: errorMessage(error) };
  }
  let path = request.filePath;
  try {
    if (request.kind === "save-as") {
      path = await services.selectSavePath(request.suggestedName);
      if (!path) {
        lifecycle.applySaveResult(request, { status: "canceled" });
        return { status: "canceled", message: "Save canceled." };
      }
    }
    if (!path) throw new Error("No save path was selected");
    await services.writeText(path, request.content);
    const snapshot = lifecycle.applySaveResult(request, { status: "success", filePath: path });
    return { status: "success", message: `Saved ${snapshot.displayName}.` };
  } catch (error) {
    lifecycle.applySaveResult(request, { status: "failed", error });
    return {
      status: "failed",
      message: `Could not save ${path ? filename(path) : request.suggestedName}: ${errorMessage(error)}`,
    };
  }
}

export async function recheckDocumentWritability(
  lifecycle: DocumentLifecycle,
  services: DocumentFileServices,
): Promise<OperationOutcome> {
  const path = lifecycle.snapshot.filePath;
  if (!path) return { status: "failed", message: "This document has no filesystem path." };
  try {
    const writable = await services.isWritable(path);
    lifecycle.applyFilesystemWritability(writable);
    return {
      status: writable ? "success" : "failed",
      message: writable ? `${lifecycle.snapshot.displayName} is writable.` : `${lifecycle.snapshot.displayName} is still read-only.`,
    };
  } catch (error) {
    return { status: "failed", message: `Could not re-check ${filename(path)}: ${errorMessage(error)}` };
  }
}
