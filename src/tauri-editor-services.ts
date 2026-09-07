import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { EditorCoordination, TransferStatus } from "./editor-coordination";
import type { WorkspaceTransfer } from "./document-workspace";
export const editorCommand = <T>(request: Record<string, unknown>) => invoke<T>("editor_command", { request });
export const editorCoordination: EditorCoordination = {
  disk: (id, operation, options) => editorCommand({ kind: "disk", id, operation, path: options?.path, token: options?.token, expected_content: options?.expectedContent }),
  claim: (id, path) => editorCommand({ kind: "claim", id, path }),
  adopt: id => editorCommand({ kind: "adopt", id }),
  release: id => editorCommand({ kind: "release", id }),
  write: (id, path, content, saveAs, approval) => editorCommand({ kind: "write", id, path, content, save_as: saveAs, token: approval?.token, expected_content: approval?.expectedContent }),
  focus: id => editorCommand({ kind: "focus", id }),
  detach: (snapshot, token) => editorCommand({ kind: "detach", snapshot, token }),
  transferStatus: (token, cancel) => editorCommand({ kind: "transferStatus", token, cancel }),
};
export interface StagedTransfer { token: string; key: string | null; snapshot: WorkspaceTransfer; status: TransferStatus["status"] }
export const stageEditor = () => editorCommand<StagedTransfer | null>({ kind: "stage" });
export const acknowledgeEditor = (token: string) => editorCommand<TransferStatus>({ kind: "acknowledge", token });
export const readyEditor = () => editorCommand<void>({ kind: "ready" });
export const focusedEditor = () => editorCommand<void>({ kind: "focused" });
export const closeEditor = () => editorCommand<void>({ kind: "close" });
export const pollLaunches = () => editorCommand<string[]>({ kind: "poll" });
export const listenForDocumentFocus = (handler: (id: string) => void) =>
  getCurrentWindow().listen<string>("quickmark://focus-document", event => handler(event.payload));
export interface RecentHistory { revision: number; paths: string[] }
export const recentHistory = (operation: "get" | "add" | "remove" | "clear", path?: string, legacy?: string[]) =>
  editorCommand<RecentHistory>({ kind: "history", operation, path, legacy });
