import type { WorkspaceTransfer } from "./document-workspace";
export interface ClaimResult {
  owner: { document_id: string; window_label: string };
  key: string;
  ready: boolean;
}
export interface TransferStatus { status: "pending" | "committed" | "canceled"; target: string }
export interface EditorCoordination {
  claim(id: string, path: string): Promise<ClaimResult>;
  adopt(id: string): Promise<void>;
  release(id: string): Promise<void>;
  write(id: string, path: string, content: string, saveAs: boolean): Promise<void>;
  focus(id: string): Promise<void>;
  detach(snapshot: WorkspaceTransfer, token: string): Promise<{ token: string }>;
  transferStatus(token: string, cancel: boolean): Promise<TransferStatus>;
}
