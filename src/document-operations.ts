import type { DocumentLifecycle } from "./document-lifecycle";

export interface DocumentFileServices {
  selectOpenPath(): Promise<string | null>;
  selectSavePath(suggestedName: string): Promise<string | null>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
}

export interface OperationOutcome {
  readonly status: "success" | "canceled" | "failed";
  readonly message: string;
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
    const snapshot = lifecycle.applyLoadResult({ status: "success", content, filePath: path });
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
  const request = lifecycle.createSaveRequest(options);
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
