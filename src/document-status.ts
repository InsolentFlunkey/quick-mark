import type { DocumentSnapshot } from "./document-lifecycle";

type DocumentStatusSnapshot = Pick<DocumentSnapshot, "filePath" | "dirty" | "capabilities">;

export function formatDocumentStatus(snapshot: DocumentStatusSnapshot): string {
  const identity = snapshot.filePath ?? "Untitled";
  const state = snapshot.dirty
    ? "Unsaved changes"
    : !snapshot.capabilities.canSave
      ? "Read-only"
      : snapshot.filePath
        ? "Saved"
        : "New document";

  return `${identity} — ${state}`;
}
