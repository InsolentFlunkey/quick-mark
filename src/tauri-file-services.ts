import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { DocumentFileServices } from "./document-operations";

const markdownFilters = [{ name: "Markdown or text", extensions: ["md", "markdown", "txt"] }];

export const tauriFileServices: DocumentFileServices = {
  async selectOpenPath() {
    return open({ directory: false, multiple: false, filters: markdownFilters });
  },
  async selectSavePath(suggestedName) {
    return save({ defaultPath: suggestedName, filters: markdownFilters });
  },
  readText(path) {
    return invoke<string>("read_document", { path });
  },
  writeText(path, content) {
    return invoke<void>("write_document", { path, content });
  },
};

export function initialLaunchPath() {
  return invoke<string | null>("initial_launch_path");
}

export function listenForLaunchPaths(handler: (path: string) => void | Promise<void>): Promise<UnlistenFn> {
  return listen<string>("quickmark://open-file", (event) => void handler(event.payload));
}
