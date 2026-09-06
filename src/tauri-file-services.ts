import { invoke } from "@tauri-apps/api/core";
import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { DocumentFileServices } from "./document-operations";

const markdownFilters = [{ name: "Markdown or text", extensions: ["md", "markdown", "txt"] }];

export interface NativeImageData {
  readonly bytes: number[];
  readonly mime: string;
}

export function parentDirectory(path: string) {
  const separatorIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (separatorIndex < 0) return null;
  if (separatorIndex === 0) return path[0];
  if (separatorIndex === 2 && /^[A-Za-z]:[\\/]/.test(path)) return path.slice(0, 3);
  return path.slice(0, separatorIndex);
}

let lastOpenDirectory: string | null = null;

export const tauriFileServices: DocumentFileServices = {
  async selectOpenPath() {
    return open({
      directory: false,
      multiple: false,
      filters: markdownFilters,
      ...(lastOpenDirectory ? { defaultPath: lastOpenDirectory } : {}),
    });
  },
  async selectSavePath(suggestedName) {
    return save({ defaultPath: suggestedName, filters: markdownFilters });
  },
  recordOpenedPath(path) {
    lastOpenDirectory = parentDirectory(path);
  },
  readText(path) {
    return invoke<string>("read_document", { path });
  },
  writeText(path, content) {
    return invoke<void>("write_document", { path, content });
  },
  isWritable(path) {
    return invoke<boolean>("document_writable", { path });
  },
};

export function resolveDocumentLink(documentPath: string, reference: string) {
  return invoke<string>("resolve_document_link", { documentPath, reference });
}

export function readLocalImage(documentPath: string, reference: string) {
  return invoke<NativeImageData>("read_local_image", { documentPath, reference });
}

export function listenForFileDrops(
  handler: (path: string) => void | Promise<void>,
  onHoverChange: (hovering: boolean) => void,
): Promise<UnlistenFn> {
  return getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "enter" || event.payload.type === "over") onHoverChange(true);
    if (event.payload.type === "leave") onHoverChange(false);
    if (event.payload.type === "drop") {
      onHoverChange(false);
      const [path] = event.payload.paths;
      if (path) void handler(path);
    }
  });
}

export function canonicalDocumentPath(path: string) {
  return invoke<string>("canonical_document_path", { path });
}
