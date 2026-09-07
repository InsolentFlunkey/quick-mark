import type { WorkspaceTransfer } from "./document-workspace";
export interface ClaimResult {
  owner: { document_id: string; window_label: string };
  key: string;
  ready: boolean;
}
export interface TransferStatus { status: "pending" | "committed" | "canceled"; target: string }
export interface DiskStatus {
  status: "unchanged" | "changed" | "missing" | "unreadable";
  token?: number;
  writable: boolean;
  message?: string;
}
export interface DiskRead { content: string; writable: boolean }
export type ExternalChoice = "overwrite" | "save-as" | "reload" | "cancel";
export type ExternalPrompt = (name: string, action: "overwrite" | "reload", detail: string) => Promise<ExternalChoice>;
export interface EditorCoordination {
  disk?<T extends DiskStatus | DiskRead>(id: string, operation: "read" | "reload" | "inspect" | "prepare", options?: { path?: string; token?: number; expectedContent?: string }): Promise<T>;

  claim(id: string, path: string): Promise<ClaimResult>;
  adopt(id: string): Promise<void>;
  release(id: string): Promise<void>;
  write(id: string, path: string, content: string, saveAs: boolean, approval?: { token?: number; expectedContent: string }): Promise<void>;
  focus(id: string): Promise<void>;
  detach(snapshot: WorkspaceTransfer, token: string): Promise<{ token: string }>;
  transferStatus(token: string, cancel: boolean): Promise<TransferStatus>;
}
